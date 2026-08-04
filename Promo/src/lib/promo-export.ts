// CSV export utilities for the short promo-calendar (client feedback §8). Mock:
// client-side CSV with a UTF-8 BOM (Excel-RU opens Cyrillic correctly), semicolon-
// delimited to match the S2 import. Export works per visible tab/block and reflects
// the CURRENT filters (the caller passes the already-filtered rows). Access rights are
// a mock no-op here — only the rows the user already sees are exported.

import {
  campaignReadiness,
  formatAvailabilityPct,
  formatPromoNo,
  getCategoryManager,
  getFillDeadline,
  getNomenclatureItem,
  getPlanApproval,
  getReportSendStatus,
  getStoreAvailability,
  type PlanStageStatus,
  type PromoCampaign,
  type PromoLine,
} from "./promo-mock-data";
import { getPlanState } from "./plan-store";
import {
  currentCycle,
  directorStageCell,
  latestJournalRejection,
  marketingStageCell,
  planRowLifecycle,
  type PlanRowLifecycle,
} from "./plan-approval";

function csvCell(v: string): string {
  return /[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCsv(rows: string[][]): string {
  const body = rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
  return "﻿" + body; // BOM so Excel detects UTF-8
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("ru-RU");
}

function fmtDateTime(d: Date): string {
  return (
    d.toLocaleDateString("ru-RU") +
    " " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
}

/**
 * Волна 4: подпись единицы срока обязательна — маркетинговый дедлайн считается в
 * КАЛЕНДАРНЫХ днях, SLA согласования КД/ОД — в РАБОЧИХ. Ожидание тоже может быть
 * просроченным (решения нет, а срок этапа уже прошёл).
 */
function stageLabel(
  status: PlanStageStatus,
  overdueDays?: number,
  unit: "cal" | "work" = "work"
): string {
  const u = unit === "cal" ? "кал. дн." : "раб. дн.";
  if (status === "waiting")
    return overdueDays
      ? `Ожидает согласования (просрочка +${overdueDays} ${u})`
      : "Ожидает согласования";
  if (status === "onTime") return "В срок";
  return `Просрочка +${overdueDays ?? 0} ${u}`;
}

/**
 * Промо-календарь tab → one row per campaign with status, readiness counts, distribution.
 * «Срок отчёта» + «Отправка смежным отделам» are omitted when `includeReportColumns` is
 * false — these two columns are role-gated on the page (КД / уполном. лицо КД / Сотрудник
 * маркетинга / Администратор, V2-12 «строго по ТЗ»); the export must not leak them either.
 */
export function buildCalendarCsv(
  campaigns: PromoCampaign[],
  opts?: { includeReportColumns?: boolean }
): string {
  const includeReportColumns = opts?.includeReportColumns ?? true;
  const header = [
    "№ промо",
    "Тип промо",
    "Название акции",
    "Период (начало)",
    "Период (окончание)",
    "Крайний срок заполнения КМ",
    ...(includeReportColumns ? ["Срок отчёта"] : []),
    "Общий статус акции",
    ...(includeReportColumns ? ["Отправка смежным отделам"] : []),
    "Согласовано КМ",
    "Всего КМ (без «Не участвует»)",
    "Согласовано КД",
    "На согл. у КД",
    "На согл. у ст. КМ",
    "На корр. / Не заполнено",
    "Не участвует",
    "Распределение по категориям",
  ];
  const rows = campaigns.map((c) => {
    const r = campaignReadiness(c);
    const rs = getReportSendStatus(c);
    // №4: фактический статус отправки; просрочка «+N дн.» только по факту отправки с опозданием.
    // R25 (10-я часть): «в.N» убран и из CSV краткого календаря — версия отчёта
    // отображается в разделе «Отчёты смежным отделам» и в «Истории версий».
    const sendLabel = rs.sent
      ? `Отправлено ${fmtDate(rs.sentAt!)}${
          rs.overdueDays > 0 ? ` (+${rs.overdueDays} дн.)` : ""
        }`
      : "Не отправлено";
    const dist = (c.categoryDistribution ?? [])
      .map(
        (e) =>
          `${fmtDate(e.date)}: ${e.category} — ${
            getCategoryManager(e.responsibleKmId)?.name ?? e.responsibleKmId
          }`
      )
      .join(" | ");
    return [
      formatPromoNo(c.id),
      c.type,
      c.name,
      fmtDate(c.startDate),
      fmtDate(c.endDate),
      fmtDate(getFillDeadline(c)),
      ...(includeReportColumns ? [fmtDate(rs.deadline)] : []),
      c.status,
      ...(includeReportColumns ? [sendLabel] : []),
      String(r.done),
      String(r.total),
      String(r.accepted),
      String(r.atKd),
      String(r.atSeniorKm),
      String(r.notFilled),
      String(r.notParticipating),
      dist,
    ];
  });
  return toCsv([header, ...rows]);
}

/**
 * Полный промо-календарь → FLAT export (feedback §13): one row per НОМЕНКЛАТУРА
 * with the № промо repeated on every row, so the file sorts/filters/analyses cleanly
 * in Excel. Reflects the current filters (the caller passes the filtered campaigns +
 * a linesFor accessor returning the visible lines). № промо uses the «26-N» short format
 * (tracker V2-9) — same as the short-calendar export.
 */
export function buildFullCalendarCsv(
  campaigns: PromoCampaign[],
  linesFor: (campaignId: string) => PromoLine[]
): string {
  const header = [
    "№ промо",
    "Признак",
    "Тип промо",
    "Название акции",
    "Период (начало)",
    "Период (окончание)",
    "ФИО КМ",
    "Номенклатура",
    "Код 1С",
    "Бренд",
    "Наличие в магазинах, %",
    "Остаток",
    "Себестоимость",
    "Розничная цена (старая)",
    "Новая цена (розничная)",
    "Скидка, %",
    "Скидка, % за Cash",
    "Регулярные продажи",
    "Прогноз продаж",
    "Компенсация поставщика",
    "Лимит компенс. кол-ва",
    "УТП",
    "Подарки (номенклатура)",
    "Остаток подарков",
    "В рекламу (КМ)",
    "В рекламу (маркетинг)",
    "Статус строки",
  ];
  const num = (v: number | undefined): string =>
    v == null ? "" : v.toLocaleString("ru-RU");
  const yn = (v: boolean | undefined): string => (v ? "Да" : "—");
  const lineStatus = (l: PromoLine): string => {
    const parts: string[] = [];
    if (l.removed) parts.push("Исключена из акции");
    else if (l.removalPending) parts.push("Ожидает исключения");
    if (l.rejected) parts.push("Отклонена");
    if (l.pending1CCheck) parts.push("Ожидает проверки 1С");
    if (l.duplicate) parts.push("Дубль");
    return parts.join("; ");
  };

  const rows: string[][] = [];
  for (const c of campaigns) {
    for (const l of linesFor(c.id)) {
      const nom = getNomenclatureItem(l.nomenclatureId);
      const avail = getStoreAvailability(l.nomenclatureId);
      const giftNames = (l.gifts ?? [])
        .map((g) => getNomenclatureItem(g.nomenclatureId)?.name ?? g.nomenclatureId)
        .join(", ");
      const giftStocks = (l.gifts ?? [])
        .map((g) => (getNomenclatureItem(g.nomenclatureId)?.stock ?? 0).toString())
        .join(", ");
      rows.push([
        formatPromoNo(c.id), // № промо repeated on every line (§13 flat format)
        c.planned ? "Плановая" : "Внеплановая",
        c.type,
        c.name,
        fmtDate(c.startDate),
        fmtDate(c.endDate),
        getCategoryManager(l.kmId)?.name ?? l.kmId,
        nom?.name ?? l.nomenclatureId,
        l.nomenclatureId,
        nom?.brand ?? "",
        formatAvailabilityPct(avail.pct),
        num(l.stock),
        num(nom?.cost),
        num(nom?.oldRetailPrice),
        num(l.newPrice),
        num(l.discountPct),
        num(l.cashDiscountPct),
        num(l.regularSales),
        num(l.salesForecast),
        num(l.supplierCompensation),
        num(l.compensationLimit),
        l.utp ?? "",
        giftNames,
        giftStocks,
        yn(l.advRecommendedKm),
        yn(l.advSelectedMarketing),
        lineStatus(l),
      ]);
    }
  }
  return toCsv([header, ...rows]);
}

export interface PlanExportRow {
  id: string;
  type: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

/**
 * План акций tab → one row per campaign with the three directors' approval stages
 * PLUS the row's live lifecycle + rejection details from the persisted plan state
 * («7-я часть» §9.5 — the reject comment goes into the выгрузка). Reads
 * `promo:plan-state` directly so the CSV matches what the plan tab shows.
 *
 * Волна 4 (T8): этапы берутся из ТОЙ ЖЕ деривации `plan-approval`, что питает
 * таблицу и панель истории (сид `PLAN_APPROVALS` — fallback внутри неё), поэтому
 * выгрузка не может разойтись с экраном. Плюс колонка «Цикл согласования».
 */
export function buildPlanCsv(rows: PlanExportRow[]): string {
  const state = getPlanState();

  const sendOf = (id: string): "draft" | "sent" =>
    state?.sendStatus?.[id] ?? (getPlanApproval(id) ? "sent" : "draft");

  const journalOf = (id: string) => state?.rowJournal?.[id];

  const LIFECYCLE_LABEL: Record<PlanRowLifecycle, string> = {
    draft: "Черновик",
    sent: "Отправлено",
    approved: "Согласовано",
    rejected: "Отклонено",
    "removal-pending": "Удаление на согласовании",
  };

  const lifecycleOf = (id: string): string => {
    const d = state?.decisions?.[id];
    // Та же композиция, что у `rowDecision` в PlanMode: отклонение любого этапа
    // важнее согласования, «Согласовано» — только у утверждённого плана.
    const decision =
      d?.kd === "rejected" || d?.od === "rejected"
        ? ("rejected" as const)
        : state?.planStatus === "Утверждён" && sendOf(id) === "sent"
          ? ("approved" as const)
          : undefined;
    return LIFECYCLE_LABEL[
      planRowLifecycle({ journal: journalOf(id), send: sendOf(id), decision })
    ];
  };

  const header = [
    "Код акции",
    "Статус строки",
    "Цикл согласования",
    "Тип акции",
    "Наименование акции",
    "Период (начало)",
    "Период (окончание)",
    "Маркетинг: ознакомление",
    "Маркетинг: отправка на согл.",
    "Маркетинг: статус",
    "КД: согласование",
    "КД: статус",
    "ОД: согласование",
    "ОД: статус",
    "Отклонил",
    "Роль согласующего",
    "Дата и время отклонения",
    "Комментарий отклонения",
  ];
  const out = rows.map((r) => {
    const j = journalOf(r.id);
    const ref = { id: r.id, startDate: r.startDate };
    const m = marketingStageCell(ref, j);
    const kd = directorStageCell("kd", ref, j);
    const od = directorStageCell("od", ref, j);
    const cyc = currentCycle(j);

    // Отклонение: журнал — источник; legacy-слайс читается, только когда журнала
    // нет (returns — записи истории, а не заголовок).
    const fromJournal = latestJournalRejection(j);
    const legacy = (state?.rejectionLog?.[r.id] ?? []).find(
      (e) => e.kind !== "return"
    );
    const rejection = fromJournal
      ? {
          by: fromJournal.by,
          role: fromJournal.role,
          at: fromJournal.at,
          comment: fromJournal.comment ?? "",
        }
      : legacy;
    const rejectionAt = rejection ? new Date(rejection.at) : undefined;
    return [
      formatPromoNo(r.id),
      lifecycleOf(r.id),
      cyc ? String(cyc.no) : "—",
      r.type,
      r.name,
      fmtDate(r.startDate),
      fmtDate(r.endDate),
      m?.reviewedAt ? fmtDateTime(m.reviewedAt) : "—",
      m?.sentAt ? fmtDateTime(m.sentAt) : "—",
      m ? stageLabel(m.status, m.overdueDays, m.unit) : "—",
      kd?.decidedAt ? fmtDateTime(kd.decidedAt) : "—",
      kd ? stageLabel(kd.status, kd.overdueDays, kd.unit) : "—",
      od?.decidedAt ? fmtDateTime(od.decidedAt) : "—",
      od ? stageLabel(od.status, od.overdueDays, od.unit) : "—",
      rejection?.by ?? "—",
      rejection?.role ?? "—",
      rejectionAt && !Number.isNaN(rejectionAt.getTime())
        ? fmtDateTime(rejectionAt)
        : "—",
      rejection?.comment || "—",
    ];
  });
  return toCsv([header, ...out]);
}

/** `YYYY-MM-DD` stamp for export filenames. */
export function exportStamp(ref: Date = new Date()): string {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}-${String(
    ref.getDate()
  ).padStart(2, "0")}`;
}
