import { ru } from "date-fns/locale";
import { format } from "date-fns";
import type { PromoRole } from "../app/role-context";
import {
  PLAN_APPROVALS,
  PLAN_MARKETING_REVIEW_LEAD_DAYS,
  PLAN_MARKETING_SUBMIT_LEAD_DAYS,
  PLAN_DIRECTOR_SLA_WORKING_DAYS,
  addCalendarDays,
  addWorkingDays,
  getOverdueDays,
  getCampaignById,
  formatPromoNo,
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
