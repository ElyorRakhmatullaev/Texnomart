import { ru } from "date-fns/locale";
import { format } from "date-fns";
import type { PromoRole } from "../app/role-context";
import { scopeControlPoints, type AuditScope } from "./audit-access";
import {
  PLAN_APPROVALS,
  PLAN_MARKETING_REVIEW_LEAD_DAYS,
  PLAN_MARKETING_SUBMIT_LEAD_DAYS,
  PLAN_DIRECTOR_SLA_WORKING_DAYS,
  REVIEW_SLA_WORKING_DAYS,
  KM_FILL_SLA_CALENDAR_DAYS,
  CAMPAIGNS,
  addCalendarDays,
  addWorkingDays,
  formatPromoNo,
  getOverdueDays,
  getCampaignById,
  getCategoryManager,
  getCampaignVersions,
  getReportDeadline,
  getReportSentAt,
  isApprovedCampaign,
  buildReviewItems,
  seniorOverdueInfo,
  stageSlaStart,
  CATEGORY_MANAGERS,
  type ReviewItem,
} from "./promo-mock-data";

export type ControlScope = "plan" | "promo";
export type ControlResult = "В срок" | "Просрочено" | "Ожидается";

/** One deadline/control-point record (spec §11.9). Tabs 1–2 render these; Tab 3 aggregates them. */
export interface ControlPoint {
  id: string;
  scope: ControlScope;
  campaignId: string;
  promoNo: string;
  promoName: string;
  /**
   * Плановый период — диапазон дат (5C, вкладка 1 п. 2: «01.11.2026 — 30.11.2026»,
   * а не «Ноябрь 2026»). `label` остаётся как дополнительная группировка, не вместо периода.
   */
  planPeriod?: { start: Date; end: Date; label: string };
  promoPeriod?: { start: Date; end: Date };
  checkpoint: string;
  responsibleName: string;
  responsibleRole: PromoRole;
  deadline: Date;
  actualAt?: Date;
  result: ControlResult;
  overdueDays: number;
  /**
   * Единица величины срока: дедлайны — календарные дни, SLA согласования — рабочие.
   * Хранится в данных, а не выводится при рендере, иначе подпись расходится с применённой
   * арифметикой (долг Волны 4: план печатал раб. дни, `/audit` — кал.).
   */
  unit: "cal" | "work";
  comment?: string;
}

/** Подпись просрочки с единицей — единственное место, где она формируется. */
export function overdueLabel(p: { overdueDays: number; unit: "cal" | "work" }): string {
  if (p.overdueDays <= 0) return "—";
  return `+${p.overdueDays} ${p.unit === "work" ? "раб." : "кал."} дн.`;
}

/** Плановый период = календарный месяц старта акции: границы + подпись-группировка. */
function planPeriodOf(d: Date): { start: Date; end: Date; label: string } {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const s = format(d, "LLLL yyyy", { locale: ru });
  return { start, end, label: s.charAt(0).toUpperCase() + s.slice(1) };
}

/** Result + overdue days from a deadline and an actual/ref date. */
function resolve(
  deadline: Date,
  actualAt: Date | undefined,
  ref: Date
): { result: ControlResult; overdueDays: number } {
  if (!actualAt) {
    const overdueDays = getOverdueDays(deadline, ref); // 0 unless deadline already passed
    // 5C, вкладка 2 п. 5: если дедлайн прошёл, а факта нет — это «Просрочено».
    // «Ожидается» рядом с «+N дн.» читается как противоречие.
    return { result: overdueDays > 0 ? "Просрочено" : "Ожидается", overdueDays };
  }
  const overdueDays = getOverdueDays(deadline, actualAt);
  return { result: overdueDays > 0 ? "Просрочено" : "В срок", overdueDays };
}

/** Plan control points (spec §11.9 tab 1) from PLAN_APPROVALS. */
export function buildPlanControlPoints(ref: Date = new Date()): ControlPoint[] {
  const points: ControlPoint[] = [];
  for (const pa of PLAN_APPROVALS) {
    const c = getCampaignById(pa.campaignId);
    if (!c) continue;
    const base = {
      scope: "plan" as const,
      campaignId: c.id,
      promoNo: formatPromoNo(c.id),
      promoName: c.name,
      planPeriod: planPeriodOf(c.startDate),
      // По умолчанию календарные дни; этапы директоров переопределяют на рабочие.
      unit: "cal" as const,
    };

    // 1) Ознакомление плана — deadline start − 63 кал. дн.
    const reviewDeadline = addCalendarDays(c.startDate, -PLAN_MARKETING_REVIEW_LEAD_DAYS);
    const r1 = resolve(reviewDeadline, pa.marketing.reviewedAt, ref);
    points.push({
      ...base, id: `cp-plan-${c.id}-review`,
      checkpoint: "Ознакомление плана (дир. маркетинга)",
      responsibleName: "Директор маркетинга", responsibleRole: "Директор маркетинга",
      deadline: reviewDeadline, actualAt: pa.marketing.reviewedAt, ...r1,
    });

    // 2) Отправка плана на согласование — deadline start − 60 кал. дн.
    const sendDeadline = addCalendarDays(c.startDate, -PLAN_MARKETING_SUBMIT_LEAD_DAYS);
    const r2 = resolve(sendDeadline, pa.marketing.sentAt, ref);
    points.push({
      ...base, id: `cp-plan-${c.id}-send`,
      checkpoint: "Отправка плана на согласование",
      responsibleName: "Директор маркетинга", responsibleRole: "Директор маркетинга",
      deadline: sendDeadline, actualAt: pa.marketing.sentAt, ...r2,
    });

    // Optional correction chain (informational milestones — deadline = event date).
    if (pa.returnedAt) {
      points.push({
        ...base, id: `cp-plan-${c.id}-return`,
        checkpoint: "Возврат плана на корректировку",
        responsibleName: pa.returnedBy ?? "Коммерческий директор",
        responsibleRole: "Коммерческий директор",
        deadline: pa.returnedAt, actualAt: pa.returnedAt, result: "В срок", overdueDays: 0,
        comment: pa.returnComment,
      });
    }
    if (pa.resentAt) {
      points.push({
        ...base, id: `cp-plan-${c.id}-resent`,
        checkpoint: "Повторная отправка плана",
        responsibleName: "Директор маркетинга", responsibleRole: "Директор маркетинга",
        deadline: pa.resentAt, actualAt: pa.resentAt, result: "В срок", overdueDays: 0,
      });
    }

    // 3) Согласование КД — deadline = отправка + 3 раб. дн.
    const kdDeadline = addWorkingDays(pa.marketing.sentAt, PLAN_DIRECTOR_SLA_WORKING_DAYS);
    const r3 = resolve(kdDeadline, pa.kd.decidedAt, ref);
    points.push({
      ...base, id: `cp-plan-${c.id}-kd`,
      checkpoint: "Согласование КД (план)",
      responsibleName: "Коммерческий директор", responsibleRole: "Коммерческий директор",
      deadline: kdDeadline, actualAt: pa.kd.decidedAt, unit: "work", ...r3,
    });

    // 4) Согласование ОД — deadline = согл. КД + 3 раб. дн.
    const odDeadline = addWorkingDays(pa.kd.decidedAt ?? pa.marketing.sentAt, PLAN_DIRECTOR_SLA_WORKING_DAYS);
    const r4 = resolve(odDeadline, pa.od.decidedAt, ref);
    points.push({
      ...base, id: `cp-plan-${c.id}-od`,
      checkpoint: "Согласование ОД (план)",
      responsibleName: "Операционный директор", responsibleRole: "Операционный директор",
      deadline: odDeadline, actualAt: pa.od.decidedAt, unit: "work", ...r4,
    });

    // Доведение плана до КМ (informational).
    if (pa.deliveredToKmAt) {
      points.push({
        ...base, id: `cp-plan-${c.id}-deliver`,
        checkpoint: "Доведение плана до КМ",
        responsibleName: "Директор маркетинга", responsibleRole: "Директор маркетинга",
        deadline: pa.deliveredToKmAt, actualAt: pa.deliveredToKmAt, result: "В срок", overdueDays: 0,
      });
    }
  }
  return points;
}

const KM_ROLE: PromoRole = "Категорийный менеджер (КМ)";

/**
 * ФИО старшего КМ. ВАЖНО: это же значение обязано возвращать `participantsFor("Старший КМ")` —
 * рейтинг сопоставляет участника с точками по `responsibleName`, и рассинхрон producer/consumer
 * оставляет строку старшего КМ пустой (дефект, пойманный whole-branch ревью E-3).
 */
const SENIOR_KM_NAME =
  CATEGORY_MANAGERS.find((m) => m.senior)?.name ?? "Старший КМ";

/** Promo/report control points (spec §11.9 tab 2). */
export function buildPromoControlPoints(ref: Date = new Date()): ControlPoint[] {
  const points: ControlPoint[] = [];
  const items = buildReviewItems(ref);
  const itemsByCampaign = new Map<string, ReviewItem[]>();
  for (const it of items) {
    const arr = itemsByCampaign.get(it.campaignId) ?? [];
    arr.push(it);
    itemsByCampaign.set(it.campaignId, arr);
  }

  for (const c of CAMPAIGNS) {
    if (c.cancelled) continue;
    const base = {
      scope: "promo" as const,
      campaignId: c.id,
      promoNo: formatPromoNo(c.id),
      promoName: c.name,
      promoPeriod: { start: c.startDate, end: c.endDate },
      // По умолчанию календарные дни; этапы согласования переопределяют на рабочие.
      unit: "cal" as const,
    };
    const fillDeadline = c.fillDeadlineOverride ?? addCalendarDays(c.startDate, -KM_FILL_SLA_CALENDAR_DAYS);
    const versions = getCampaignVersions(c.id);
    const firstSend = versions.find((v) => v.changeType === "Первичная отправка");
    const cItems = itemsByCampaign.get(c.id) ?? [];

    // 1) Отправка данных КМ — one row per КМ that has a submission signal.
    const kmSubmissions: { kmId: string; at: Date }[] = cItems.map((it) => ({
      kmId: it.kmId,
      at: new Date(it.submittedAt),
    }));
    if (kmSubmissions.length === 0 && (isApprovedCampaign(c) || firstSend)) {
      // Fully-approved campaigns have no pending review items — attribute the first send to the lead КМ.
      const leadKm = c.participatingKmIds[0];
      if (leadKm) kmSubmissions.push({ kmId: leadKm, at: firstSend?.date ?? getReportSentAt(c) });
    }
    for (const sub of kmSubmissions) {
      const km = getCategoryManager(sub.kmId);
      const overdueDays = getOverdueDays(fillDeadline, sub.at);
      points.push({
        ...base, id: `cp-promo-${c.id}-datakm-${sub.kmId}`,
        checkpoint: "Отправка данных КМ",
        responsibleName: km?.name ?? "Категорийный менеджер", responsibleRole: KM_ROLE,
        deadline: fillDeadline, actualAt: sub.at,
        result: overdueDays > 0 ? "Просрочено" : "В срок", overdueDays,
        comment: overdueDays > 0 ? "Данные поданы после дедлайна заполнения." : undefined,
      });
    }

    // 2) Решение старшего КМ + 3) авто-передача КД (per review item).
    for (const it of cItems) {
      const submitted = new Date(it.submittedAt);
      const seniorDeadline = addWorkingDays(submitted, REVIEW_SLA_WORKING_DAYS);
      const senior = seniorOverdueInfo(it, ref); // defined only when auto-escalated (senior missed)
      const km = getCategoryManager(it.kmId);
      const seniorName = SENIOR_KM_NAME;
      if (senior) {
        // Senior missed → auto-forward. Attribute the overdue to the Старший КМ.
        points.push({
          ...base, id: `cp-promo-${c.id}-senior-${it.kmId}`,
          checkpoint: "Решение старшего КМ",
          responsibleName: seniorName, responsibleRole: "Старший КМ",
          deadline: seniorDeadline, actualAt: undefined, unit: "work",
          result: "Просрочено", overdueDays: senior.seniorSlaDays,
          comment: "Срок согласования старшего КМ истёк.",
        });
        points.push({
          ...base, id: `cp-promo-${c.id}-autofwd-${it.kmId}`,
          checkpoint: "Авто-передача КД (просрочка старшего КМ)",
          responsibleName: seniorName, responsibleRole: "Старший КМ",
          deadline: senior.autoForwardedAt, actualAt: senior.autoForwardedAt, unit: "work",
          result: "Просрочено", overdueDays: senior.seniorSlaDays,
          // 5C, вкладка 2 п. 6: ответственный за просрочку — старший КМ, а не КМ.
          comment: `Старший КМ: ${seniorName} — просрочил срок согласования, промо автоматически передано КД (КМ: ${km?.name ?? "—"}).`,
        });
      } else if (it.kmStatus === "На согласовании у старшего КМ") {
        points.push({
          ...base, id: `cp-promo-${c.id}-senior-${it.kmId}`,
          checkpoint: "Решение старшего КМ",
          responsibleName: seniorName, responsibleRole: "Старший КМ",
          deadline: seniorDeadline, actualAt: undefined, unit: "work",
          ...resolve(seniorDeadline, undefined, ref),
        });
      } else {
        // Passed senior → decided at the КД-stage start (or submitted for seeds starting at КД).
        const decided = stageSlaStart(it, ref);
        const overdueDays = getOverdueDays(seniorDeadline, decided);
        points.push({
          ...base, id: `cp-promo-${c.id}-senior-${it.kmId}`,
          checkpoint: "Решение старшего КМ",
          responsibleName: seniorName, responsibleRole: "Старший КМ",
          deadline: seniorDeadline, actualAt: decided, unit: "work",
          result: overdueDays > 0 ? "Просрочено" : "В срок", overdueDays,
        });
      }

      // 4) Решение КД.
      const kdStart = stageSlaStart(it, ref);
      const kdDeadline = addWorkingDays(kdStart, REVIEW_SLA_WORKING_DAYS);
      // NOTE: unreachable with current seeds — buildReviewItems excludes terminal
      // statuses (reviewerForKmStatus("Согласовано КД") === undefined). Kept so that
      // if a completed-КД review item is ever seeded, it emits a completed point.
      if (it.kmStatus === "Согласовано КД") {
        const decided = getReportSentAt(c);
        const overdueDays = getOverdueDays(kdDeadline, decided);
        points.push({
          ...base, id: `cp-promo-${c.id}-kd-${it.kmId}`,
          checkpoint: "Решение КД",
          responsibleName: "Коммерческий директор", responsibleRole: "Коммерческий директор",
          deadline: kdDeadline, actualAt: decided, unit: "work",
          result: overdueDays > 0 ? "Просрочено" : "В срок", overdueDays,
        });
      } else if (
        it.kmStatus === "На согласовании у коммерческого директора" || senior
      ) {
        points.push({
          ...base, id: `cp-promo-${c.id}-kd-${it.kmId}`,
          checkpoint: "Решение КД",
          responsibleName: "Коммерческий директор", responsibleRole: "Коммерческий директор",
          deadline: kdDeadline, actualAt: undefined, unit: "work",
          ...resolve(kdDeadline, undefined, ref),
        });
      }

      // 5) Возврат на корректировку → повторная отправка (5C, вкладка 2 п. 2).
      // Набор с `returnedAt` уже переотправлен: текущий submittedAt и есть повторная
      // отправка, а срок на неё — REVIEW_SLA рабочих дней от момента возврата.
      if (it.returnedAt) {
        const returnedAt = new Date(it.returnedAt);
        points.push({
          ...base, id: `cp-promo-${c.id}-return-${it.kmId}`,
          checkpoint: "Возврат на корректировку",
          responsibleName: "Коммерческий директор", responsibleRole: "Коммерческий директор",
          deadline: returnedAt, actualAt: returnedAt, result: "В срок", overdueDays: 0,
          comment: `КМ: ${km?.name ?? "—"} · набор возвращён на корректировку.`,
        });
        const resendDeadline = addWorkingDays(returnedAt, REVIEW_SLA_WORKING_DAYS);
        const resendOverdue = getOverdueDays(resendDeadline, submitted);
        points.push({
          ...base, id: `cp-promo-${c.id}-resubmit-${it.kmId}`,
          checkpoint: "Повторная отправка после корректировки",
          responsibleName: km?.name ?? "Категорийный менеджер", responsibleRole: KM_ROLE,
          deadline: resendDeadline, actualAt: submitted, unit: "work",
          result: resendOverdue > 0 ? "Просрочено" : "В срок", overdueDays: resendOverdue,
          comment:
            resendOverdue > 0
              ? "Набор отправлен повторно после возврата с нарушением срока."
              : "Набор отправлен повторно после возврата на корректировку.",
        });
      } else if (it.kmStatus === "Переотправлено на корректировку КМ") {
        points.push({
          ...base, id: `cp-promo-${c.id}-return-${it.kmId}`,
          checkpoint: "Возврат на корректировку",
          responsibleName: "Коммерческий директор", responsibleRole: "Коммерческий директор",
          deadline: submitted, actualAt: submitted, result: "В срок", overdueDays: 0,
          comment: `КМ: ${km?.name ?? "—"} · набор возвращён на корректировку.`,
        });
      }
    }

    // 6) Отправка первичного отчёта + 7) новые версии.
    const reportDeadline = getReportDeadline(c);
    if (isApprovedCampaign(c)) {
      const sentAt = firstSend?.date ?? getReportSentAt(c);
      const overdueDays = getOverdueDays(reportDeadline, sentAt);
      const leadKm = getCategoryManager(c.participatingKmIds[0] ?? "");
      points.push({
        ...base, id: `cp-promo-${c.id}-report`,
        checkpoint: "Отправка первичного отчёта",
        responsibleName: leadKm?.name ?? "Категорийный менеджер", responsibleRole: KM_ROLE,
        deadline: reportDeadline, actualAt: sentAt,
        result: overdueDays > 0 ? "Просрочено" : "В срок", overdueDays,
        comment: overdueDays > 0 ? "Отчёт отправлен после дедлайна (старт − 17 кал. дн.)." : undefined,
      });
      for (const v of versions.filter((vv) => vv.version > 1)) {
        points.push({
          ...base, id: `cp-promo-${c.id}-report-v${v.version}`,
          checkpoint: `Новая версия отчёта (в.${v.version})`,
          responsibleName: v.author || (leadKm?.name ?? "Категорийный менеджер"),
          responsibleRole: KM_ROLE,
          deadline: v.date, actualAt: v.date, result: "В срок", overdueDays: 0,
          comment: v.summary,
        });
      }
    }
  }
  return points;
}

/** All control points (plan + promo), newest deadline first. */
export function buildControlPoints(ref: Date = new Date()): ControlPoint[] {
  return [...buildPlanControlPoints(ref), ...buildPromoControlPoints(ref)].sort(
    (a, b) => b.deadline.getTime() - a.deadline.getTime()
  );
}

export const PARTICIPANT_ROLES: PromoRole[] = [
  "Категорийный менеджер (КМ)",
  "Старший КМ",
  "Коммерческий директор",
  "Директор маркетинга",
  "Операционный директор",
];

/** Which checkpoints each participant role is measured on. */
const ROLE_CHECKPOINTS: Record<string, string[]> = {
  "Категорийный менеджер (КМ)": ["Отправка данных КМ"],
  "Старший КМ": ["Решение старшего КМ", "Авто-передача КД (просрочка старшего КМ)"],
  "Коммерческий директор": ["Решение КД", "Согласование КД (план)"],
  "Директор маркетинга": ["Ознакомление плана (дир. маркетинга)", "Отправка плана на согласование"],
  "Операционный директор": ["Согласование ОД (план)"],
};

export type TimelinessBand = "Высокая" | "Средняя" | "Низкая";

export function timelinessBand(pct: number): TimelinessBand {
  if (pct >= 90) return "Высокая";
  if (pct >= 70) return "Средняя";
  return "Низкая";
}

export interface ParticipantMetricRow {
  rank: number;
  name: string;
  dueCount: number;      // промо/задач с наступившим дедлайном
  onTime: number;
  overdue: number;
  timelinessPct: number; // 0 when dueCount === 0
  band: TimelinessBand;
  avgOverdueDays: number;
  returns: number;       // возвраты на корректировку
  resends: number;       // повторные отправки
}

export interface ParticipantTask {
  campaignId: string;
  promoNo: string;
  promoName: string;
  checkpoint: string;
  deadline: Date;
  actualAt?: Date;
  overdueDays: number;
  unit: "cal" | "work";
  comment?: string;
}

/** Фильтры вкладки «Показатели участников» (5C, вкладка 3, пп. 1–3). */
export interface ParticipantFilters {
  /** «Период дедлайна» (ISO yyyy-mm-dd). Пусто = весь доступный период. */
  from: string;
  to: string;
  /** Выбранные акции; пусто = все. */
  promoIds: string[];
  /** «Тип задачи / этап»: "all" | точное название контрольной точки. */
  checkpoint: string;
  /** «Участник»: "all" | ФИО. */
  participant: string;
}

export const EMPTY_PARTICIPANT_FILTERS: ParticipantFilters = {
  from: "", to: "", promoIds: [], checkpoint: "all", participant: "all",
};

export interface ParticipantOptions {
  scope?: AuditScope;
  filters?: ParticipantFilters;
}

/**
 * The control points a given role is measured on (across plan + promo).
 * `scope` (5C) сужает набор по матрице прав ДО расчёта метрик — иначе рейтинг покажет
 * участников, чьи записи роли не видны на вкладках 1–2, и цифры перестанут сходиться.
 * `filters` — пользовательский отбор той же вкладки; применяется к тому же набору,
 * поэтому показатели и drill-down не могут разойтись.
 */
function roleControlPoints(role: PromoRole, ref: Date, opts?: ParticipantOptions): ControlPoint[] {
  const checkpoints = ROLE_CHECKPOINTS[role] ?? [];
  const all = buildControlPoints(ref);
  const scoped = opts?.scope ? scopeControlPoints(all, opts.scope) : all;
  const byRole = scoped.filter((p) => checkpoints.includes(p.checkpoint));
  return applyParticipantFilters(byRole, opts?.filters);
}

function applyParticipantFilters(
  points: ControlPoint[],
  f: ParticipantFilters | undefined
): ControlPoint[] {
  if (!f) return points;
  const fromTs = f.from ? new Date(`${f.from}T00:00:00`).getTime() : null;
  const toTs = f.to ? new Date(`${f.to}T23:59:59`).getTime() : null;
  return points.filter((p) => {
    const ts = p.deadline.getTime();
    if (fromTs !== null && ts < fromTs) return false;
    if (toTs !== null && ts > toTs) return false;
    if (f.promoIds.length > 0 && !f.promoIds.includes(p.campaignId)) return false;
    if (f.checkpoint !== "all" && p.checkpoint !== f.checkpoint) return false;
    if (f.participant !== "all" && p.responsibleName !== f.participant) return false;
    return true;
  });
}

/** Варианты для фильтров вкладки 3 — строятся из того же набора, что и метрики. */
export function participantFilterOptions(
  role: PromoRole,
  ref: Date = new Date(),
  scope?: AuditScope
): { checkpoints: string[]; participants: string[]; promos: { id: string; no: string; name: string }[] } {
  const points = roleControlPoints(role, ref, { scope });
  const promos = new Map<string, { id: string; no: string; name: string }>();
  for (const p of points) {
    if (!promos.has(p.campaignId)) {
      promos.set(p.campaignId, { id: p.campaignId, no: p.promoNo, name: p.promoName });
    }
  }
  return {
    checkpoints: Array.from(new Set(points.map((p) => p.checkpoint))).sort(),
    participants: Array.from(new Set(points.map((p) => p.responsibleName))).sort(),
    promos: Array.from(promos.values()).sort((a, b) => a.no.localeCompare(b.no, "ru", { numeric: true })),
  };
}

/** Distinct measured people for a role. КМ → the roster; other roles → single representative row. */
function participantsFor(role: PromoRole): string[] {
  if (role === "Категорийный менеджер (КМ)") {
    return CATEGORY_MANAGERS.filter((m) => !m.senior).map((m) => m.name);
  }
  if (role === "Старший КМ") {
    return [SENIOR_KM_NAME]; // должно совпадать с responsibleName точек старшего КМ
  }
  return [role]; // КД / дир. маркетинга / ОД — role label as the single aggregate row
}

export function buildParticipantMetrics(
  role: PromoRole,
  ref: Date = new Date(),
  opts?: ParticipantOptions
): ParticipantMetricRow[] {
  const points = roleControlPoints(role, ref, opts);
  const allPoints = opts?.scope
    ? scopeControlPoints(buildControlPoints(ref), opts.scope)
    : buildControlPoints(ref);
  const returnPoints = allPoints.filter((p) =>
    p.checkpoint === "Возврат на корректировку" || p.checkpoint === "Возврат плана на корректировку"
  );
  const versionPoints = allPoints.filter((p) =>
    p.checkpoint.startsWith("Новая версия отчёта") ||
    p.checkpoint === "Повторная отправка плана" ||
    p.checkpoint === "Повторная отправка после корректировки"
  );

  // Ростер, а не список из точек: участник без задач обязан быть виден (со строкой
  // «Нет данных»). Фильтр «Участник» сужает и его, иначе остальные дадут пустые строки.
  const roster = participantsFor(role).filter(
    (name) =>
      !opts?.filters ||
      opts.filters.participant === "all" ||
      opts.filters.participant === name
  );

  const rows = roster.map((name) => {
    const mine = points.filter((p) => p.responsibleName === name);
    const due = mine.filter((p) => p.deadline.getTime() <= ref.getTime());
    const onTime = due.filter((p) => p.result === "В срок").length;
    const overdue = due.filter((p) => p.overdueDays > 0).length;
    const dueCount = due.length;
    const timelinessPct = dueCount ? Math.round((onTime / dueCount) * 100) : 0;
    const overdueDaysArr = due.filter((p) => p.overdueDays > 0).map((p) => p.overdueDays);
    const avgOverdueDays = overdueDaysArr.length
      ? Math.round(overdueDaysArr.reduce((s, d) => s + d, 0) / overdueDaysArr.length)
      : 0;
    // returns/resends: campaigns touching this participant (approximation; documented mock limit).
    const myCampaigns = new Set(mine.map((p) => p.campaignId));
    const returns = returnPoints.filter((p) => myCampaigns.has(p.campaignId)).length;
    const resends = versionPoints.filter((p) => myCampaigns.has(p.campaignId)).length;
    return {
      rank: 0, name, dueCount, onTime, overdue, timelinessPct,
      band: timelinessBand(timelinessPct), avgOverdueDays, returns, resends,
    };
  });

  return rows
    .sort((a, b) => b.timelinessPct - a.timelinessPct || b.dueCount - a.dueCount)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

/** Drill-down: the control points measured for one participant. */
export function buildParticipantTasks(
  responsibleName: string,
  role: PromoRole,
  ref: Date = new Date(),
  opts?: ParticipantOptions
): ParticipantTask[] {
  return roleControlPoints(role, ref, opts)
    .filter((p) => p.responsibleName === responsibleName)
    .sort((a, b) => b.deadline.getTime() - a.deadline.getTime())
    .map((p) => ({
      campaignId: p.campaignId, promoNo: p.promoNo, promoName: p.promoName,
      checkpoint: p.checkpoint, deadline: p.deadline, actualAt: p.actualAt,
      overdueDays: p.overdueDays, unit: p.unit, comment: p.comment,
    }));
}
