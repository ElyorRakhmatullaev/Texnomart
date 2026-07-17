// A11 — persistence for the «План акций» lifecycle (localStorage, per-browser).
// Mirrors notifications-store.ts: defensive `typeof window` guard, try/catch JSON,
// Date↔ISO serialization. One key: `promo:plan-state`.
//
// `getPlanState`/`persistPlanState` traffic in the JSON-safe `PersistedPlanState`
// (dates as ISO strings, `deletedIds` as an array) — PlanMode.tsx owns the live
// domain shape (real `Date`s, `deletedIds` as a `Set`). The `reviveRow`/`serializeRow`
// (+ …Partial/…Overrides) helpers below do the round-trip so PlanMode doesn't
// duplicate ISO-conversion logic.

import type { PlanStatus } from "./promo-mock-data";

const KEY = "promo:plan-state";

/** The two interactive reviewer stages (mirrors PlanMode's `ReviewerStage`). */
type ReviewerStage = "kd" | "od";
/** Reviewer decision on a row (mirrors `PlanApprovalTable`'s `RowDecision`). */
type RowDecision = "approved" | "rejected";
/** Per-row send lifecycle (mirrors `PlanApprovalTable`'s `PlanRowSend`). */
type PlanRowSend = "draft" | "sent";

/** A plan row as persisted — dates as ISO strings. */
export interface PersistedPlanRow {
  id: string;
  type: string;
  name: string;
  startDate: string;
  endDate: string;
}

/**
 * A plan row as used live in `PlanMode` (real `Date` fields). Declared structurally
 * here (not imported from PlanMode.tsx) to avoid a component↔lib circular import —
 * TypeScript matches by shape, and PlanMode's own `PlanRow` is identical to this.
 */
export interface LivePlanRow {
  id: string;
  type: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

/** JSON-safe snapshot of PlanMode's session lifecycle state. */
export interface PersistedPlanState {
  planStatus: PlanStatus;
  rejectedStage?: ReviewerStage;
  extraRows: PersistedPlanRow[];
  overrides: Record<string, Partial<PersistedPlanRow>>;
  deletedIds: string[];
  sendStatus: Record<string, PlanRowSend>;
  decisions: Record<string, Partial<Record<ReviewerStage, RowDecision>>>;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Parsed + shape-defensive; malformed/absent JSON returns `null` (never throws). */
export function getPlanState(): PersistedPlanState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    return {
      planStatus: parsed.planStatus as PlanStatus,
      rejectedStage: parsed.rejectedStage as ReviewerStage | undefined,
      extraRows: Array.isArray(parsed.extraRows)
        ? (parsed.extraRows as PersistedPlanRow[])
        : [],
      overrides: isRecord(parsed.overrides)
        ? (parsed.overrides as Record<string, Partial<PersistedPlanRow>>)
        : {},
      deletedIds: Array.isArray(parsed.deletedIds)
        ? (parsed.deletedIds as string[])
        : [],
      sendStatus: isRecord(parsed.sendStatus)
        ? (parsed.sendStatus as Record<string, PlanRowSend>)
        : {},
      decisions: isRecord(parsed.decisions)
        ? (parsed.decisions as Record<
            string,
            Partial<Record<ReviewerStage, RowDecision>>
          >)
        : {},
    };
  } catch {
    return null;
  }
}

export function persistPlanState(state: PersistedPlanState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / serialization errors (mock) */
  }
}

export function clearPlanState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

// ── Row-level Date↔ISO round-trip helpers ─────────────────────────────────────

/** ISO strings → real `Date`s. */
export function reviveRow(r: PersistedPlanRow): LivePlanRow {
  return { ...r, startDate: new Date(r.startDate), endDate: new Date(r.endDate) };
}

/** Real `Date`s → ISO strings. */
export function serializeRow(r: LivePlanRow): PersistedPlanRow {
  return {
    ...r,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
  };
}

/** Same as `reviveRow` but for a `Partial` (used by `overrides` values). */
export function revivePartialRow(
  p: Partial<PersistedPlanRow>
): Partial<LivePlanRow> {
  const out: Partial<LivePlanRow> = { ...p };
  if (p.startDate) out.startDate = new Date(p.startDate);
  if (p.endDate) out.endDate = new Date(p.endDate);
  return out;
}

/** Same as `serializeRow` but for a `Partial` (used by `overrides` values). */
export function serializePartialRow(
  p: Partial<LivePlanRow>
): Partial<PersistedPlanRow> {
  const out: Partial<PersistedPlanRow> = { ...p };
  if (p.startDate) out.startDate = p.startDate.toISOString();
  if (p.endDate) out.endDate = p.endDate.toISOString();
  return out;
}

/** Revive every row in an `extraRows`-shaped array. */
export function reviveRows(rows: PersistedPlanRow[]): LivePlanRow[] {
  return rows.map(reviveRow);
}

/** Serialize every row in an `extraRows`-shaped array. */
export function serializeRows(rows: LivePlanRow[]): PersistedPlanRow[] {
  return rows.map(serializeRow);
}

/** Revive every value in an `overrides`-shaped record. */
export function reviveOverrides(
  overrides: Record<string, Partial<PersistedPlanRow>>
): Record<string, Partial<LivePlanRow>> {
  return Object.fromEntries(
    Object.entries(overrides).map(([id, patch]) => [id, revivePartialRow(patch)])
  );
}

/** Serialize every value in an `overrides`-shaped record. */
export function serializeOverrides(
  overrides: Record<string, Partial<LivePlanRow>>
): Record<string, Partial<PersistedPlanRow>> {
  return Object.fromEntries(
    Object.entries(overrides).map(([id, patch]) => [id, serializePartialRow(patch)])
  );
}
