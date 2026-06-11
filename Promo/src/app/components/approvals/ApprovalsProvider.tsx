"use client";

import * as React from "react";
import {
  approvedKmStatusFor,
  buildReviewItems,
  reviewItemId,
  REJECTED_KM_STATUS,
  reviewQueueFor,
  type KmStatus,
  type ReviewComment,
  type ReviewItem,
} from "../../../lib/promo-mock-data";
import type { PromoRole } from "../../role-context";

/**
 * Holds the S3 review store ABOVE both /approvals (queue) and /approvals/:id
 * (detail) so reviewer actions made on the detail page are reflected back in the
 * queue. Seeded from the mock campaigns; in-memory only (reload reseeds) — the
 * approve / reject transitions are mock, matching S1/S2.
 *
 * Phase 2: per-line / bulk accept & reject with status transitions:
 *  - approve → Старший КМ forwards to КД; КД finalises («Принято КД»).
 *  - reject (any line) → the WHOLE КМ set returns to «Не заполнено» (spec §4.5.2).
 */

interface ApproveAction {
  type: "approve";
  itemId: string;
  actor: PromoRole;
  at: string;
}
interface RejectAction {
  type: "reject";
  itemId: string;
  /** Lines the rejection is attached to; empty = general (whole-set) rejection. */
  lineIds: string[];
  comment: string;
  actor: PromoRole;
  at: string;
}
/** КМ raises a «Не участвует» request → routed to Старший КМ (reason required). */
interface RequestNonParticipationAction {
  type: "request-non-participation";
  campaignId: string;
  kmId: string;
  reason: string;
  at: string;
}
/** КД sets «Не участвует» directly (final; КМ cannot override, Старший КМ notified). */
interface SetNonParticipationByKdAction {
  type: "set-non-participation-kd";
  campaignId: string;
  kmId: string;
  reason: string;
  at: string;
}
type ReviewAction =
  | ApproveAction
  | RejectAction
  | RequestNonParticipationAction
  | SetNonParticipationByKdAction;

function reducer(state: ReviewItem[], action: ReviewAction): ReviewItem[] {
  // «Не участвует» actions key off (campaign, КМ) and may create a new item.
  if (
    action.type === "request-non-participation" ||
    action.type === "set-non-participation-kd"
  ) {
    const id = reviewItemId(action.campaignId, action.kmId);
    const byKd = action.type === "set-non-participation-kd";
    const note: ReviewComment = {
      author: byKd ? "Коммерческий директор" : "Категорийный менеджер (КМ)",
      at: action.at,
      text: byKd
        ? `«Не участвует» установлено коммерческим директором.${action.reason ? ` ${action.reason}` : ""}`
        : `Заявка на «Не участвует». ${action.reason}`,
    };
    // КД sets it FINAL straight away; a КМ request goes to Старший КМ for review.
    const kmStatus: KmStatus = byKd
      ? "Не участвует"
      : "На согласовании у старшего КМ";
    const existing = state.find((it) => it.id === id);
    if (existing) {
      return state.map((it) =>
        it.id === id
          ? {
              ...it,
              kind: "non-participation",
              kmStatus,
              nonParticipationByKd: byKd,
              nonParticipationReason: action.reason || undefined,
              escalatedToKD: false,
              submittedAt: action.at,
              lineFeedback: {},
              comments: [...it.comments, note],
            }
          : it
      );
    }
    // No prior item (e.g. КМ was «Не заполнено») — create one.
    const created: ReviewItem = {
      id,
      campaignId: action.campaignId,
      kmId: action.kmId,
      kind: "non-participation",
      kmStatus,
      submittedAt: action.at,
      escalatedToKD: false,
      nonParticipationByKd: byKd,
      nonParticipationReason: action.reason || undefined,
      comments: [note],
      lineFeedback: {},
    };
    return [...state, created];
  }

  return state.map((it) => {
    if (it.id !== action.itemId) return it;

    if (action.type === "approve") {
      const isNonPart = it.kind === "non-participation";
      const note: ReviewComment = {
        author: action.actor,
        at: action.at,
        text: isNonPart ? "«Не участвует» согласовано." : "Набор согласован.",
      };
      return {
        ...it,
        kmStatus: approvedKmStatusFor(action.actor, it.kind),
        // A reviewer can't approve a set that still carries its own rejections.
        lineFeedback: {},
        comments: [...it.comments, note],
      };
    }

    // reject — mark the targeted lines, append the comment, return the whole set.
    const lineFeedback = { ...it.lineFeedback };
    for (const lineId of action.lineIds) {
      lineFeedback[lineId] = {
        rejected: true,
        comment: action.comment,
        at: action.at,
        by: action.actor,
      };
    }
    const note: ReviewComment = {
      author: action.actor,
      at: action.at,
      text: action.comment,
      lineIds: action.lineIds.length > 0 ? action.lineIds : undefined,
    };
    // Rejecting a «Не участвует» request also sends the КМ back to fill data.
    return {
      ...it,
      kind: "data",
      kmStatus: REJECTED_KM_STATUS,
      lineFeedback,
      comments: [...it.comments, note],
    };
  });
}

interface ApprovalsContextValue {
  items: ReviewItem[];
  getItem: (id: string) => ReviewItem | undefined;
  queueFor: (role: PromoRole) => ReviewItem[];
  /** Approve the whole КМ set (forward / finalise per the actor's role). */
  approve: (itemId: string, actor: PromoRole) => void;
  /** Reject lines (empty lineIds = general rejection); returns the whole set to the КМ. */
  reject: (
    itemId: string,
    opts: { lineIds: string[]; comment: string; actor: PromoRole }
  ) => void;
  /** КМ raises a «Не участвует» request (reason required) → routed to Старший КМ. */
  requestNonParticipation: (
    campaignId: string,
    kmId: string,
    reason: string
  ) => void;
  /** КД sets «Не участвует» directly for a КМ (final; reason recommended). */
  setNonParticipationByKd: (
    campaignId: string,
    kmId: string,
    reason: string
  ) => void;
}

const ApprovalsContext = React.createContext<ApprovalsContextValue | undefined>(
  undefined
);

export function ApprovalsProvider({ children }: { children: React.ReactNode }) {
  // Seed once on mount (relative to "now" so SLA timers are live for the demo).
  const [items, dispatch] = React.useReducer(
    reducer,
    undefined,
    () => buildReviewItems()
  );

  const value = React.useMemo<ApprovalsContextValue>(
    () => ({
      items,
      getItem: (id) => items.find((it) => it.id === id),
      queueFor: (role) => reviewQueueFor(role, items),
      approve: (itemId, actor) =>
        dispatch({ type: "approve", itemId, actor, at: new Date().toISOString() }),
      reject: (itemId, opts) =>
        dispatch({ type: "reject", itemId, ...opts, at: new Date().toISOString() }),
      requestNonParticipation: (campaignId, kmId, reason) =>
        dispatch({
          type: "request-non-participation",
          campaignId,
          kmId,
          reason,
          at: new Date().toISOString(),
        }),
      setNonParticipationByKd: (campaignId, kmId, reason) =>
        dispatch({
          type: "set-non-participation-kd",
          campaignId,
          kmId,
          reason,
          at: new Date().toISOString(),
        }),
    }),
    [items]
  );

  return (
    <ApprovalsContext.Provider value={value}>
      {children}
    </ApprovalsContext.Provider>
  );
}

export function useApprovals() {
  const ctx = React.useContext(ApprovalsContext);
  if (!ctx) {
    throw new Error("useApprovals must be used within an ApprovalsProvider");
  }
  return ctx;
}
