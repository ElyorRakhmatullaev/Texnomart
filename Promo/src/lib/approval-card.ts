/**
 * «10-я часть» Волна 3 (R57) — pure row model for the approval card (`/approvals/:id`).
 *
 * §4  — the card lists the WHOLE promo's nomenclature, not just the current КМ's set.
 * §5  — previously approved rows are read-only («Согласовано ранее» + замок, no checkbox).
 * §6  — rows carrying a repeat action of THIS КМ are light-orange and require a decision.
 * §12 — counters «На согласовании: N строк · Согласовано ранее: M строк».
 * §14 — only rows that require a decision may be approved / rejected.
 */

import {
  lineDisplayStatus,
  type LineStatus,
} from "./full-calendar-status";
import {
  isApprovedCampaign,
  lineNeedsRepeatDecision,
  repeatActionAt,
  type PromoCampaign,
  type PromoLine,
  type ReviewItem,
} from "./promo-mock-data";

export type ApprovalRowKind =
  /** Repeat action of the reviewed КМ — needs a decision (light-orange). */
  | "change"
  | "addition"
  | "removal"
  /** Primary approval of a freshly submitted set (the pre-Волна-3 S3 flow). */
  | "primary"
  /** Already approved earlier — read-only, «Согласовано ранее» + замок (§5). */
  | "approved-earlier"
  /** A repeat action already declined — read-only context. */
  | "rejected-repeat"
  /** Someone else's row (another КМ, or excluded/cancelled) — read-only context. */
  | "context";

export interface ApprovalRow {
  line: PromoLine;
  kind: ApprovalRowKind;
  /** §14 — may be selected and decided on. */
  requiresDecision: boolean;
  /** §6 — light-orange highlight (a repeat action awaiting a decision). */
  isRepeat: boolean;
  /** Real per-line status — used for the read-only label, never as a table column (§13). */
  status: LineStatus;
  /** ISO moment the repeat action was sent (панель «дата повторной отправки», §7). */
  sentAt?: string;
  /** КМ's comment on the repeat action (§7). */
  comment?: string;
  /** «Тип запроса» shown in the panel. */
  requestType?: string;
}

export const ROW_KIND_LABEL: Record<ApprovalRowKind, string> = {
  change: "Изменение позиции",
  addition: "Добавлена номенклатура",
  removal: "Удаление номенклатуры",
  primary: "На согласовании",
  "approved-earlier": "Согласовано ранее",
  "rejected-repeat": "Отклонённые изменения",
  context: "",
};

/**
 * Classify one line of the promo for the given review item.
 *
 * A row requires a decision only when it carries an unresolved repeat action of the
 * reviewed КМ (§6/§14), or — in the primary flow — when the campaign itself is still
 * under review and the line belongs to that КМ (unchanged S3 behaviour).
 */
function classify(
  campaign: PromoCampaign,
  line: PromoLine,
  item: ReviewItem
): ApprovalRow {
  const status = lineDisplayStatus(campaign, line);
  const own = line.kmId === item.kmId;
  const base = { line, status } as const;

  if (own && lineNeedsRepeatDecision(line)) {
    const kind: ApprovalRowKind = line.removalPending
      ? "removal"
      : line.pending?.action === "addition"
        ? "addition"
        : "change";
    return {
      ...base,
      kind,
      requiresDecision: true,
      isRepeat: true,
      sentAt: repeatActionAt(line),
      comment: line.pending?.comment ?? line.removalReason,
      requestType:
        line.pending?.requestType ??
        (line.removalPending ? "Запрос на исключение из промо" : undefined),
    };
  }

  // A repeat action that was already declined — context only.
  if (line.pending?.rejected) {
    return {
      ...base,
      kind: "rejected-repeat",
      requiresDecision: false,
      isRepeat: false,
      sentAt: line.pending.at,
      comment: line.pending.comment,
      requestType: line.pending.requestType,
    };
  }

  // Primary flow: the campaign is still under review, so this КМ's own lines are the
  // ones being decided on right now (pre-Волна-3 behaviour, kept intact).
  if (own && !isApprovedCampaign(campaign) && !line.removed && !campaign.cancelled) {
    return { ...base, kind: "primary", requiresDecision: true, isRepeat: false };
  }

  // Genuinely approved earlier — the only case that may claim «Согласовано ранее» (§5).
  if (
    isApprovedCampaign(campaign) &&
    !line.removed &&
    !line.removalPending &&
    !line.pending
  ) {
    return {
      ...base,
      kind: "approved-earlier",
      requiresDecision: false,
      isRepeat: false,
    };
  }

  // Anything else (another КМ's open row, excluded / cancelled) keeps its real status.
  return { ...base, kind: "context", requiresDecision: false, isRepeat: false };
}

/** Rows of the whole promo for this review item, in line order (§4). */
export function buildApprovalRows(
  campaign: PromoCampaign,
  lines: PromoLine[],
  item: ReviewItem
): ApprovalRow[] {
  return lines.map((line) => classify(campaign, line, item));
}

export interface ApprovalCounters {
  /** Rows awaiting the current decision (§12). */
  pending: number;
  /** Rows approved earlier — read-only context (§12). */
  approvedEarlier: number;
}

export function approvalCounters(rows: ApprovalRow[]): ApprovalCounters {
  let pending = 0;
  let approvedEarlier = 0;
  for (const r of rows) {
    if (r.requiresDecision) pending += 1;
    else if (r.kind === "approved-earlier") approvedEarlier += 1;
  }
  return { pending, approvedEarlier };
}

/** Russian plural for «строка» (счётчик §12). */
export function pluralRows(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "строка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "строки";
  return "строк";
}
