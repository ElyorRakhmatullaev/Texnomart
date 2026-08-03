"use client";

/**
 * «10-я часть» Волна 3 (R57 §16) — reviewer decisions on **repeat actions**
 * (change / addition / exclusion raised on an already-approved campaign).
 *
 * Согласовано → новые значения становятся актуальными, светло-оранжевая подсветка
 * убирается. Отклонено → данные возвращаются КМ на корректировку, а в истории
 * фиксируется, что именно отклонено и почему.
 *
 * Persisted to localStorage (per browser, mock — same idiom as `plan-store.ts`) so the
 * decision taken in the approval card is visible in the full calendar and survives a
 * reload. Applying happens through the pure `applyLineDecisions`.
 */

import type { LinePendingChange, PromoLine } from "./promo-mock-data";

const KEY = "promo:line-decisions";

/** What the decision was taken on. */
export type LineDecisionAction = "change" | "addition" | "removal";

export interface LineDecision {
  lineId: string;
  campaignId: string;
  action: LineDecisionAction;
  kind: "approved" | "rejected";
  /** Acting reviewer — role label (no per-person identity in the mock). */
  by: string;
  /** ISO timestamp of the decision. */
  at: string;
  /** Required on rejection. */
  reason?: string;
}

export type LineDecisionMap = Record<string, LineDecision>;

function isDecision(value: unknown): value is LineDecision {
  if (!value || typeof value !== "object") return false;
  const d = value as Partial<LineDecision>;
  return (
    typeof d.lineId === "string" &&
    typeof d.campaignId === "string" &&
    (d.kind === "approved" || d.kind === "rejected") &&
    (d.action === "change" || d.action === "addition" || d.action === "removal") &&
    typeof d.by === "string" &&
    typeof d.at === "string"
  );
}

export function getLineDecisions(): LineDecisionMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: LineDecisionMap = {};
    for (const [lineId, value] of Object.entries(parsed)) {
      if (isDecision(value)) out[lineId] = value;
    }
    return out;
  } catch {
    return {};
  }
}

function persist(map: LineDecisionMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // ignore quota / serialization errors (mock)
  }
}

/** Record one decision (last write wins per line). */
export function recordLineDecision(decision: LineDecision): void {
  const map = getLineDecisions();
  map[decision.lineId] = decision;
  persist(map);
}

/** Record several decisions in one write (bulk approve / reject). */
export function recordLineDecisions(decisions: LineDecision[]): void {
  if (decisions.length === 0) return;
  const map = getLineDecisions();
  for (const d of decisions) map[d.lineId] = d;
  persist(map);
}

/** Wipe every decision (demo reset). */
export function clearLineDecisions(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/**
 * Parse the formatted «Стало» string back to a value — fallback for seeds written before
 * `LinePendingChange.fields[].value` existed. Numbers may carry «%», «сум» and spaces.
 */
function parseFormatted(raw: string): unknown {
  const cleaned = raw.replace(/ /g, " ").trim();
  const numeric = cleaned.replace(/[^\d,.-]/g, "").replace(/\s/g, "").replace(",", ".");
  if (numeric !== "" && /^-?\d+(\.\d+)?$/.test(numeric)) {
    const asNumber = Number(numeric);
    if (Number.isFinite(asNumber)) return asNumber;
  }
  return cleaned;
}

/** The typed patch an approved «change» applies to the line. */
function patchFrom(pending: LinePendingChange): Partial<PromoLine> {
  const patch: Record<string, unknown> = {};
  for (const f of pending.fields ?? []) {
    patch[f.field as string] = "value" in f && f.value !== undefined
      ? f.value
      : parseFormatted(f.now);
  }
  return patch as Partial<PromoLine>;
}

/**
 * Fold the recorded decisions into a line list (pure):
 *  - approved change   → new values become the actual ones, `pending` cleared (подсветка снята);
 *  - approved addition → the line stays as-is, `pending` cleared (позиция теперь согласована);
 *  - approved removal  → `removed`, the exclusion is final («Скрыть отменённое» hides it);
 *  - rejected          → `pending.rejected` (→ «Отклонённые изменения» + red КМ indicator),
 *                        an exclusion request is withdrawn back to the approved state.
 */
export function applyLineDecisions(
  lines: PromoLine[],
  decisions: LineDecisionMap = getLineDecisions()
): PromoLine[] {
  if (Object.keys(decisions).length === 0) return lines;
  return lines.map((line) => {
    const d = decisions[line.id];
    if (!d || d.campaignId !== line.campaignId) return line;

    if (d.action === "removal") {
      if (!line.removalPending && !line.removed) return line;
      if (d.kind === "approved") {
        return { ...line, removalPending: false, removed: true };
      }
      // Rejected exclusion: the position stays in the promo, and the refusal is recorded
      // as a resolved repeat action so the КМ sees «Отклонённые изменения», the red
      // indicator and the reason in «Детали изменений» (Волна 2, Блок 6.2/6.6).
      return {
        ...line,
        removalPending: false,
        removed: false,
        pending: {
          action: "change",
          requestType: "Запрос на исключение из промо",
          by: line.removalRequestedBy ?? "Категорийный менеджер (КМ)",
          at: line.removalRequestedAt ?? d.at,
          comment: line.removalReason,
          fields: [
            {
              field: "removed",
              label: "Участие в акции",
              was: "Согласована в акции",
              now: "Предложена к удалению",
            },
          ],
          rejected: {
            by: d.by,
            at: d.at,
            reason: d.reason ?? "Причина не указана.",
          },
        },
      };
    }

    const pending = line.pending;
    if (!pending || pending.rejected) return line;

    if (d.kind === "rejected") {
      return {
        ...line,
        pending: {
          ...pending,
          rejected: { by: d.by, at: d.at, reason: d.reason ?? "Причина не указана." },
        },
      };
    }
    // approved
    const next: PromoLine = { ...line, pending: undefined };
    if (pending.action === "change") Object.assign(next, patchFrom(pending));
    return next;
  });
}
