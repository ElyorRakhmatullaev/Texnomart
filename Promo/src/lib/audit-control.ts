import { ru } from "date-fns/locale";
import { format } from "date-fns";
import type { PromoRole } from "../app/role-context";
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
  formatPromoNo,
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
  planPeriod?: string;
  promoPeriod?: { start: Date; end: Date };
  checkpoint: string;
  responsibleName: string;
  responsibleRole: PromoRole;
  deadline: Date;
  actualAt?: Date;
  result: ControlResult;
  overdueDays: number;
  comment?: string;
}

/** Capitalised «LLLL yyyy» plan period, e.g. «Июль 2026». */
function planPeriodLabel(d: Date): string {
  const s = format(d, "LLLL yyyy", { locale: ru });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Result + overdue days from a deadline and an actual/ref date. */
function resolve(
  deadline: Date,
  actualAt: Date | undefined,
  ref: Date
): { result: ControlResult; overdueDays: number } {
  if (!actualAt) {
    const overdueDays = getOverdueDays(deadline, ref); // 0 unless deadline already passed
    return { result: "Ожидается", overdueDays };
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
      promoNo: c.id,
      promoName: c.name,
      planPeriod: planPeriodLabel(c.startDate),
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
      deadline: kdDeadline, actualAt: pa.kd.decidedAt, ...r3,
    });

    // 4) Согласование ОД — deadline = согл. КД + 3 раб. дн.
    const odDeadline = addWorkingDays(pa.kd.decidedAt ?? pa.marketing.sentAt, PLAN_DIRECTOR_SLA_WORKING_DAYS);
    const r4 = resolve(odDeadline, pa.od.decidedAt, ref);
    points.push({
      ...base, id: `cp-plan-${c.id}-od`,
      checkpoint: "Согласование ОД (план)",
      responsibleName: "Операционный директор", responsibleRole: "Операционный директор",
      deadline: odDeadline, actualAt: pa.od.decidedAt, ...r4,
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
      promoNo: c.id,
      promoName: c.name,
      promoPeriod: { start: c.startDate, end: c.endDate },
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
      const seniorName = "Старший КМ";
      if (senior) {
        // Senior missed → auto-forward. Attribute the overdue to the Старший КМ.
        points.push({
          ...base, id: `cp-promo-${c.id}-senior-${it.kmId}`,
          checkpoint: "Решение старшего КМ",
          responsibleName: seniorName, responsibleRole: "Старший КМ",
          deadline: seniorDeadline, actualAt: undefined,
          result: "Просрочено", overdueDays: senior.seniorSlaDays,
          comment: "Срок согласования старшего КМ истёк.",
        });
        points.push({
          ...base, id: `cp-promo-${c.id}-autofwd-${it.kmId}`,
          checkpoint: "Авто-передача КД (просрочка старшего КМ)",
          responsibleName: seniorName, responsibleRole: "Старший КМ",
          deadline: senior.autoForwardedAt, actualAt: senior.autoForwardedAt,
          result: "Просрочено", overdueDays: senior.seniorSlaDays,
          comment: `КМ: ${km?.name ?? "—"} · передано автоматически.`,
        });
      } else if (it.kmStatus === "На согласовании у старшего КМ") {
        points.push({
          ...base, id: `cp-promo-${c.id}-senior-${it.kmId}`,
          checkpoint: "Решение старшего КМ",
          responsibleName: seniorName, responsibleRole: "Старший КМ",
          deadline: seniorDeadline, actualAt: undefined, ...resolve(seniorDeadline, undefined, ref),
        });
      } else {
        // Passed senior → decided at the КД-stage start (or submitted for seeds starting at КД).
        const decided = stageSlaStart(it, ref);
        const overdueDays = getOverdueDays(seniorDeadline, decided);
        points.push({
          ...base, id: `cp-promo-${c.id}-senior-${it.kmId}`,
          checkpoint: "Решение старшего КМ",
          responsibleName: seniorName, responsibleRole: "Старший КМ",
          deadline: seniorDeadline, actualAt: decided,
          result: overdueDays > 0 ? "Просрочено" : "В срок", overdueDays,
        });
      }

      // 4) Решение КД.
      const kdStart = stageSlaStart(it, ref);
      const kdDeadline = addWorkingDays(kdStart, REVIEW_SLA_WORKING_DAYS);
      if (it.kmStatus === "Согласовано КД") {
        const decided = getReportSentAt(c);
        const overdueDays = getOverdueDays(kdDeadline, decided);
        points.push({
          ...base, id: `cp-promo-${c.id}-kd-${it.kmId}`,
          checkpoint: "Решение КД",
          responsibleName: "Коммерческий директор", responsibleRole: "Коммерческий директор",
          deadline: kdDeadline, actualAt: decided,
          result: overdueDays > 0 ? "Просрочено" : "В срок", overdueDays,
        });
      } else if (
        it.kmStatus === "На согласовании у коммерческого директора" || senior
      ) {
        points.push({
          ...base, id: `cp-promo-${c.id}-kd-${it.kmId}`,
          checkpoint: "Решение КД",
          responsibleName: "Коммерческий директор", responsibleRole: "Коммерческий директор",
          deadline: kdDeadline, actualAt: undefined, ...resolve(kdDeadline, undefined, ref),
        });
      }

      // 5) Возврат на корректировку.
      if (it.kmStatus === "Переотправлено на корректировку КМ") {
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
  "Коммерческий директор": ["Решение КД"],
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
  comment?: string;
}

/** The control points a given role is measured on (across plan + promo). */
function roleControlPoints(role: PromoRole, ref: Date): ControlPoint[] {
  const checkpoints = ROLE_CHECKPOINTS[role] ?? [];
  return buildControlPoints(ref).filter((p) => checkpoints.includes(p.checkpoint));
}

/** Distinct measured people for a role. КМ → the roster; other roles → single representative row. */
function participantsFor(role: PromoRole): string[] {
  if (role === "Категорийный менеджер (КМ)") {
    return CATEGORY_MANAGERS.filter((m) => !m.senior).map((m) => m.name);
  }
  if (role === "Старший КМ") {
    return [CATEGORY_MANAGERS.find((m) => m.senior)?.name ?? "Старший КМ"];
  }
  return [role]; // КД / дир. маркетинга / ОД — role label as the single aggregate row
}

export function buildParticipantMetrics(
  role: PromoRole,
  ref: Date = new Date()
): ParticipantMetricRow[] {
  const points = roleControlPoints(role, ref);
  const returnPoints = buildControlPoints(ref).filter((p) =>
    p.checkpoint === "Возврат на корректировку" || p.checkpoint === "Возврат плана на корректировку"
  );
  const versionPoints = buildControlPoints(ref).filter((p) =>
    p.checkpoint.startsWith("Новая версия отчёта") || p.checkpoint === "Повторная отправка плана"
  );

  const rows = participantsFor(role).map((name) => {
    const mine = points.filter((p) => p.responsibleName === name);
    const due = mine.filter((p) => p.deadline.getTime() <= ref.getTime());
    const onTime = due.filter((p) => p.result === "В срок").length;
    const overdue = due.filter((p) => p.result === "Просрочено").length;
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
  ref: Date = new Date()
): ParticipantTask[] {
  return roleControlPoints(role, ref)
    .filter((p) => p.responsibleName === responsibleName)
    .sort((a, b) => b.deadline.getTime() - a.deadline.getTime())
    .map((p) => ({
      campaignId: p.campaignId, promoNo: p.promoNo, promoName: p.promoName,
      checkpoint: p.checkpoint, deadline: p.deadline, actualAt: p.actualAt,
      overdueDays: p.overdueDays, comment: p.comment,
    }));
}
