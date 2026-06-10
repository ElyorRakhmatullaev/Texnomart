"use client";

import * as React from "react";
import {
  approvedKmStatusFor,
  buildReviewItems,
  REJECTED_KM_STATUS,
  reviewQueueFor,
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
type ReviewAction = ApproveAction | RejectAction;

function reducer(state: ReviewItem[], action: ReviewAction): ReviewItem[] {
  return state.map((it) => {
    if (it.id !== action.itemId) return it;

    if (action.type === "approve") {
      const note: ReviewComment = {
        author: action.actor,
        at: action.at,
        text: "Набор согласован.",
      };
      return {
        ...it,
        kmStatus: approvedKmStatusFor(action.actor),
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
    return {
      ...it,
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
