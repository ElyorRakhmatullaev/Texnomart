// «10-я часть» Волна 4 (R29.5 / R30.1 / R30.2) — чистый слой над журналом строки плана.
//
// ЕДИНСТВЕННАЯ деривация состояния строки: таблица, боковая панель и CSV-экспорт
// читают состояние только отсюда, поэтому разъехаться они не могут (урок E-3:
// вкладки согласуются только по конструкции). Сид `PLAN_APPROVALS` — это fallback
// ВНУТРИ этих функций, а не отдельная ветка у каждого потребителя.
//
// Единицы: маркетинговый дедлайн отправки — КАЛЕНДАРНЫЕ дни (за 60 дн. до старта),
// SLA согласования КД/ОД — РАБОЧИЕ дни (3 раб. дн. на этап).

import {
  PLAN_DIRECTOR_SLA_WORKING_DAYS,
  PLAN_MARKETING_SUBMIT_LEAD_DAYS,
  addCalendarDays,
  addWorkingDays,
  getOverdueDays,
  getPlanApproval,
  workingDaysBetween,
  type PlanStageStatus,
} from "./promo-mock-data";
import type {
  PlanApprovalCycle,
  PlanRemovalRequest,
  PlanReviewerStage,
  PlanRowJournal,
  PlanStageDecision,
  PlanStageDecisionKind,
} from "./plan-store";

/** Минимум, который дериваторам нужно знать о строке плана. */
export interface PlanRowRef {
  id: string;
  startDate: Date;
}

/** Пустой журнал — для строк, по которым живых событий ещё не было. */
export const EMPTY_JOURNAL: PlanRowJournal = { cycles: [] };

export const STAGE_LABEL: Record<PlanReviewerStage, string> = {
  kd: "Коммерческий директор",
  od: "Операционный директор",
};

/** Последний цикл строки — даже закрытый. undefined — живых циклов не было. */
export function currentCycle(j?: PlanRowJournal): PlanApprovalCycle | undefined {
  const cycles = j?.cycles;
  if (!cycles || cycles.length === 0) return undefined;
  return cycles[cycles.length - 1];
}

/** Последний цикл, если он ещё не закрыт возвратом/правкой. */
export function openCycle(j?: PlanRowJournal): PlanApprovalCycle | undefined {
  const c = currentCycle(j);
  return c && !c.closedAt ? c : undefined;
}

/**
 * Всё, что нужно ячейке этапа в таблице/экспорте. `unit` определяет подпись
 * просрочки — «кал. дн.» у маркетинга, «раб. дн.» у директоров.
 */
export interface StageCellData {
  /** «Озн.» — только из сида, живого источника у ознакомления нет. */
  reviewedAt?: Date;
  /** «Отпр.» — из текущего цикла, иначе из сида. */
  sentAt?: Date;
  decidedAt?: Date;
  decision?: PlanStageDecisionKind;
  status: PlanStageStatus;
  overdueDays?: number;
  unit: "cal" | "work";
  by?: string;
  /** Проставляется только при no > 1 — метка «Цикл N». */
  cycleNo?: number;
}

/**
 * Дедлайн отправки плана — за `PLAN_MARKETING_SUBMIT_LEAD_DAYS` КАЛЕНДАРНЫХ
 * дней до старта акции. При живом цикле статус пересчитывается от фактической
 * даты отправки; без цикла отдаётся сид как есть.
 */
export function marketingStageCell(
  row: PlanRowRef,
  j?: PlanRowJournal
): StageCellData | undefined {
  const seed = getPlanApproval(row.id);
  const cyc = currentCycle(j);

  if (!cyc) {
    if (!seed) return undefined; // ни сида, ни живого цикла → «—»
    return {
      reviewedAt: seed.marketing.reviewedAt,
      sentAt: seed.marketing.sentAt,
      status: seed.marketing.status,
      overdueDays: seed.marketing.overdueDays,
      unit: "cal",
    };
  }

  const sentAt = new Date(cyc.sentAt);
  const deadline = addCalendarDays(row.startDate, -PLAN_MARKETING_SUBMIT_LEAD_DAYS);
  const over = getOverdueDays(deadline, sentAt);
  return {
    reviewedAt: seed?.marketing.reviewedAt,
    sentAt,
    status: over > 0 ? "overdue" : "onTime",
    overdueDays: over > 0 ? over : undefined,
    unit: "cal",
    by: cyc.sentBy,
    cycleNo: cyc.no > 1 ? cyc.no : undefined,
  };
}

/**
 * Старт этапа: КД считает от отправки цикла, ОД — от СОГЛАСОВАНИЯ КД
 * (пока КД не согласовал, этап ОД не начат). Дедлайн — `+3 раб. дн.`
 *
 * Пять исходов: решение в срок · решение с просрочкой · ожидание в срок ·
 * ожидание с просрочкой (утверждено клиентом: раздел про контроль сроков,
 * молчащая просрочка — пробел; ничего не блокирует) · этап не начат.
 */
export function directorStageCell(
  stage: PlanReviewerStage,
  row: PlanRowRef,
  j?: PlanRowJournal,
  ref: Date = new Date()
): StageCellData | undefined {
  const seed = getPlanApproval(row.id);
  const seedStage = stage === "kd" ? seed?.kd : seed?.od;
  const cyc = currentCycle(j);

  if (!cyc) {
    if (!seedStage) return undefined;
    return {
      decidedAt: seedStage.decidedAt,
      status: seedStage.status,
      overdueDays: seedStage.overdueDays,
      unit: "work",
    };
  }

  const cycleNo = cyc.no > 1 ? cyc.no : undefined;
  const decision = stage === "kd" ? cyc.kd : cyc.od;

  const start =
    stage === "kd"
      ? new Date(cyc.sentAt)
      : cyc.kd?.decision === "approved"
        ? new Date(cyc.kd.at)
        : undefined;

  // Этап не начат — ждём предыдущий, просрочки быть не может.
  if (!start) return { status: "waiting", unit: "work", cycleNo };

  const deadline = addWorkingDays(start, PLAN_DIRECTOR_SLA_WORKING_DAYS);

  if (decision) {
    const at = new Date(decision.at);
    const over = at > deadline ? workingDaysBetween(deadline, at) : 0;
    return {
      decidedAt: at,
      decision: decision.decision,
      status: over > 0 ? "overdue" : "onTime",
      overdueDays: over > 0 ? over : undefined,
      unit: "work",
      by: decision.by,
      cycleNo,
    };
  }

  // Цикл закрыт возвратом/правкой — строка вернулась владельцу, никто не ждёт.
  if (cyc.closedAt) return { status: "waiting", unit: "work", cycleNo };

  const over = ref > deadline ? workingDaysBetween(deadline, ref) : 0;
  return {
    status: "waiting",
    overdueDays: over > 0 ? over : undefined,
    unit: "work",
    cycleNo,
  };
}

export type PlanRowLifecycle =
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "removal-pending";

/**
 * Журнал добавляет ровно одно новое состояние — «Удаление на согласовании»;
 * остальные по-прежнему выводятся из существующих `sendStatus`/`decisions`,
 * поэтому сид-строки и снапшоты прошлых сессий выглядят как раньше.
 */
export function planRowLifecycle(args: {
  journal?: PlanRowJournal;
  send: "draft" | "sent";
  decision?: PlanStageDecisionKind;
}): PlanRowLifecycle {
  if (args.journal?.removal) return "removal-pending";
  if (args.send === "draft") return "draft";
  if (args.decision === "rejected") return "rejected";
  if (args.decision === "approved") return "approved";
  return "sent";
}

/**
 * Этапы, согласовавшие строку в ПОСЛЕДНЕМ цикле. Закрытый цикл (возврат/правка)
 * не даёт ни одного — правка уже вывела строку из согласованного плана.
 *
 * Сид-строка без живого журнала: у `PlanStageDirector` нет вида решения, только
 * статус, поэтому этап с датой решения и статусом ≠ «waiting» считается
 * согласованным (все сиды — согласования).
 */
export function approvedStages(
  rowId: string,
  j?: PlanRowJournal
): PlanReviewerStage[] {
  const cyc = currentCycle(j);
  if (cyc) {
    if (cyc.closedAt) return [];
    const out: PlanReviewerStage[] = [];
    if (cyc.kd?.decision === "approved") out.push("kd");
    if (cyc.od?.decision === "approved") out.push("od");
    return out;
  }
  const seed = getPlanApproval(rowId);
  const out: PlanReviewerStage[] = [];
  if (seed?.kd.decidedAt && seed.kd.status !== "waiting") out.push("kd");
  if (seed?.od.decidedAt && seed.od.status !== "waiting") out.push("od");
  return out;
}

/** true — удалять строку можно только через согласование (R30.2). */
export function removalNeedsApproval(rowId: string, j?: PlanRowJournal): boolean {
  return approvedStages(rowId, j).length > 0;
}

const STAGE_BY_ROLE: Record<string, PlanReviewerStage> = {
  "Коммерческий директор": "kd",
  "Операционный директор": "od",
};

/**
 * Этап, на котором ТЕКУЩАЯ роль может решить судьбу запроса на удаление,
 * либо undefined. Гейт пер-строчный и НЕ зависит от `planStatus`: при
 * «Утверждён» `actorForPlanStatus` возвращает undefined, и очередь, выведенная
 * из агрегатного статуса, новую работу просто не увидит (урок Волны 3).
 */
export function pendingRemovalStageFor(
  role: string,
  j?: PlanRowJournal
): PlanReviewerStage | undefined {
  const req = j?.removal;
  if (!req) return undefined;
  const stage = STAGE_BY_ROLE[role];
  if (!stage || !req.requiredStages.includes(stage)) return undefined;
  return req[stage] ? undefined : stage;
}

/** Все требуемые этапы согласовали удаление → строку можно применять. */
export function removalFullyApproved(req: PlanRemovalRequest): boolean {
  return req.requiredStages.every((s) => req[s]?.decision === "approved");
}

/** Хотя бы один требуемый этап отклонил удаление → строка остаётся в плане. */
export function removalRejected(req: PlanRemovalRequest): boolean {
  return req.requiredStages.some((s) => req[s]?.decision === "rejected");
}

export interface JournalRejection {
  stage: PlanReviewerStage;
  cycleNo: number;
  by: string;
  role: string;
  at: string;
  comment?: string;
}

/**
 * Самое свежее отклонение по журналу: циклы просматриваются от новых к старым,
 * внутри цикла ОД считается более поздним этапом, чем КД.
 */
export function latestJournalRejection(
  j?: PlanRowJournal
): JournalRejection | undefined {
  const cycles = j?.cycles ?? [];
  for (let i = cycles.length - 1; i >= 0; i--) {
    const c = cycles[i];
    const ordered: PlanReviewerStage[] = ["od", "kd"];
    for (const stage of ordered) {
      const d = c[stage];
      if (d?.decision === "rejected") {
        return {
          stage,
          cycleNo: c.no,
          by: d.by,
          role: d.role,
          at: d.at,
          comment: d.comment,
        };
      }
    }
  }
  return undefined;
}

// ── Запись в журнал ───────────────────────────────────────────────────────────
// Все функции ниже чистые: возвращают НОВЫЙ объект, чтобы React-мемо и
// write-through-эффект персистентности срабатывали по ссылке.

function cloneJournal(j?: PlanRowJournal): PlanRowJournal {
  return {
    cycles: [...(j?.cycles ?? [])],
    removal: j?.removal,
    removalHistory: j?.removalHistory ? [...j.removalHistory] : undefined,
  };
}

/**
 * Отправка строки на согласование открывает НОВЫЙ цикл. Если предыдущий цикл
 * ещё открыт, повтор игнорируется — «Отправлено» уже блокирует повторную
 * отправку в UI («6-я часть» №7), это защита на уровне модели.
 */
export function withSend(
  j: PlanRowJournal | undefined,
  at: Date,
  by: string
): PlanRowJournal {
  const next = cloneJournal(j);
  const last = next.cycles[next.cycles.length - 1];
  if (last && !last.closedAt) return next;
  next.cycles.push({
    no: (last?.no ?? 0) + 1,
    sentAt: at.toISOString(),
    sentBy: by,
  });
  return next;
}

/**
 * Гарантирует наличие открытого цикла перед записью решения. Сид-строка,
 * отправленная до появления журнала, материализуется как цикл №1 с датой
 * отправки из `PLAN_APPROVALS` — так SLA КД считается от реальной отправки,
 * а не от момента клика проверяющего.
 */
export function ensureOpenCycle(
  j: PlanRowJournal | undefined,
  rowId: string,
  fallbackSentAt: Date,
  sentBy: string
): PlanRowJournal {
  if (openCycle(j)) return j as PlanRowJournal;
  const seed = getPlanApproval(rowId);
  return withSend(
    j,
    seed?.marketing.sentAt ?? fallbackSentAt,
    seed ? "Директор маркетинга" : sentBy
  );
}

/** Решение КД/ОД в текущем цикле (цикл при необходимости материализуется). */
export function withDecision(
  j: PlanRowJournal | undefined,
  rowId: string,
  stage: PlanReviewerStage,
  decision: PlanStageDecisionKind,
  meta: { at: Date; by: string; role: string; comment?: string }
): PlanRowJournal {
  const base = ensureOpenCycle(j, rowId, meta.at, meta.by);
  const next = cloneJournal(base);
  const idx = next.cycles.length - 1;
  const cyc = next.cycles[idx];
  if (!cyc) return next;
  const entry: PlanStageDecision = {
    decision,
    at: meta.at.toISOString(),
    by: meta.by,
    role: meta.role,
    comment: meta.comment,
  };
  // Ветвление вместо вычисляемого ключа: computed key расширил бы тип, а
  // транспайл-онли билд такого не поймает.
  next.cycles[idx] = stage === "kd" ? { ...cyc, kd: entry } : { ...cyc, od: entry };
  return next;
}

/**
 * Закрывает текущий цикл без результата: «Вернуть на доработку» (`return`)
 * или правка отправленной строки (`edit`). Данные цикла остаются — именно они
 * попадают в историю (R30.1).
 */
export function withCycleClosed(
  j: PlanRowJournal | undefined,
  reason: "return" | "edit",
  at: Date
): PlanRowJournal {
  const next = cloneJournal(j);
  const idx = next.cycles.length - 1;
  const cyc = next.cycles[idx];
  if (!cyc || cyc.closedAt) return next;
  next.cycles[idx] = { ...cyc, closedAt: at.toISOString(), closedReason: reason };
  return next;
}

export function withRemovalRequest(
  j: PlanRowJournal | undefined,
  req: PlanRemovalRequest
): PlanRowJournal {
  const next = cloneJournal(j);
  next.removal = req;
  return next;
}

export function withRemovalDecision(
  j: PlanRowJournal | undefined,
  stage: PlanReviewerStage,
  decision: PlanStageDecisionKind,
  meta: { at: Date; by: string; role: string; comment?: string }
): PlanRowJournal {
  const next = cloneJournal(j);
  const req = next.removal;
  if (!req) return next;
  const entry: PlanStageDecision = {
    decision,
    at: meta.at.toISOString(),
    by: meta.by,
    role: meta.role,
    comment: meta.comment,
  };
  next.removal = stage === "kd" ? { ...req, kd: entry } : { ...req, od: entry };
  return next;
}

/**
 * Переносит завершённый запрос в историю — после отклонения (строка остаётся
 * в плане) или после применения удаления (строка уходит в tombstone-набор,
 * но её история сохраняется).
 */
export function withRemovalArchived(
  j: PlanRowJournal | undefined
): PlanRowJournal {
  const next = cloneJournal(j);
  if (!next.removal) return next;
  next.removalHistory = [next.removal, ...(next.removalHistory ?? [])];
  next.removal = undefined;
  return next;
}
