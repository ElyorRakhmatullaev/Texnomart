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

function stageLabel(status: PlanStageStatus, overdueDays?: number): string {
  if (status === "waiting") return "Ожидает этапа";
  if (status === "onTime") return "В срок";
  return `Просрочка +${overdueDays ?? 0} дн.`;
}

/** Промо-календарь tab → one row per campaign with status, readiness counts, distribution. */
export function buildCalendarCsv(campaigns: PromoCampaign[]): string {
  const header = [
    "№ промо",
    "Тип промо",
    "Название акции",
    "Период (начало)",
    "Период (окончание)",
    "Крайний срок заполнения КМ",
    "Срок отчёта",
    "Общий статус акции",
    "Отправка смежным отделам",
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
    const sendLabel = rs.sent
      ? `Отправлено ${fmtDate(rs.sentAt!)} (в.${rs.versionNo})`
      : rs.overdueDays > 0
        ? `Не отправлено (просрочка +${rs.overdueDays} дн.)`
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
      fmtDate(rs.deadline),
      c.status,
      sendLabel,
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
 * a linesFor accessor returning the visible lines). № промо keeps the PR-/UN- format.
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
        c.id, // № промо repeated on every line (§13 flat format)
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

/** План акций tab → one row per campaign with the three directors' approval stages. */
export function buildPlanCsv(rows: PlanExportRow[]): string {
  const header = [
    "Код акции",
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
  ];
  const out = rows.map((r) => {
    const a = getPlanApproval(r.id);
    const m = a?.marketing;
    const kd = a?.kd;
    const od = a?.od;
    return [
      r.id,
      r.type,
      r.name,
      fmtDate(r.startDate),
      fmtDate(r.endDate),
      m ? fmtDateTime(m.reviewedAt) : "—",
      m ? fmtDateTime(m.sentAt) : "—",
      m ? stageLabel(m.status, m.overdueDays) : "—",
      kd?.decidedAt ? fmtDateTime(kd.decidedAt) : "—",
      kd ? stageLabel(kd.status, kd.overdueDays) : "—",
      od?.decidedAt ? fmtDateTime(od.decidedAt) : "—",
      od ? stageLabel(od.status, od.overdueDays) : "—",
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
