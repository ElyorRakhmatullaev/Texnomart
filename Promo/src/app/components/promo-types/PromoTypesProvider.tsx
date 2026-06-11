"use client";

import * as React from "react";
import {
  PROMO_TYPE_RULES,
  nextRuleId,
  type PromoTypeRule,
  type RuleHistoryEntry,
} from "../../../lib/promo-mock-data";
import type { PromoRole } from "../../role-context";

/**
 * Holds the S7 promo-type-rule store ABOVE both /promo-types (list) and
 * /promo-types/:ruleId (selected rule) so the two sibling routes share one
 * live store and selecting a rule via the URL never resets it (same pattern as
 * the S3 ApprovalsProvider). In-memory only — reload reseeds (mock, matching
 * every other Promo screen).
 *
 * Workflow (spec §9): Черновик → На подтверждении → Утверждено (+ Архив). A rule
 * only takes effect after Коммерческий директор confirmation; ANY edit to an
 * approved rule drops it back to Черновик and needs re-confirmation (§9.5).
 */

/** Editable payload of a rule (everything the editor can change). */
export interface RuleDraft {
  name: string;
  promoTypeIds: string[];
  requiredFieldIds: string[];
}

interface SaveAction {
  type: "save";
  id: string;
  draft: RuleDraft;
  by: PromoRole;
}
interface SendAction {
  type: "send";
  id: string;
  by: PromoRole;
}
interface ConfirmAction {
  type: "confirm";
  id: string;
  by: PromoRole;
}
interface ArchiveAction {
  type: "archive";
  id: string;
  by: PromoRole;
}
interface CreateAction {
  type: "create";
  id: string;
  by: PromoRole;
}
interface CopyAction {
  type: "copy";
  sourceId: string;
  id: string;
  by: PromoRole;
}
type RuleAction =
  | SaveAction
  | SendAction
  | ConfirmAction
  | ArchiveAction
  | CreateAction
  | CopyAction;

const now = () => new Date();
const entry = (
  by: PromoRole,
  action: string,
  note?: string
): RuleHistoryEntry => ({ at: now(), by, action, note });

function reducer(state: PromoTypeRule[], action: RuleAction): PromoTypeRule[] {
  switch (action.type) {
    case "create": {
      const created: PromoTypeRule = {
        id: action.id,
        name: "Новое правило",
        promoTypeIds: [],
        requiredFieldIds: [],
        status: "draft",
        history: [entry(action.by, "Создано")],
      };
      return [created, ...state];
    }

    case "copy": {
      const src = state.find((r) => r.id === action.sourceId);
      if (!src) return state;
      const copied: PromoTypeRule = {
        id: action.id,
        name: `${src.name} (копия)`,
        promoTypeIds: [...src.promoTypeIds],
        requiredFieldIds: [...src.requiredFieldIds],
        status: "draft",
        confirmedBy: undefined,
        confirmedAt: undefined,
        history: [entry(action.by, "Создано копированием", `Источник: «${src.name}».`)],
      };
      return [copied, ...state];
    }

    case "save":
      return state.map((r) => {
        if (r.id !== action.id) return r;
        const { name, promoTypeIds, requiredFieldIds } = action.draft;
        const fieldsChanged =
          requiredFieldIds.join(",") !== r.requiredFieldIds.join(",");
        const typesChanged =
          promoTypeIds.join(",") !== r.promoTypeIds.join(",");
        // Editing an already-approved rule invalidates it → re-confirmation (§9.5).
        const needsReconfirm =
          r.status === "approved" && (fieldsChanged || typesChanged);
        const history = [
          ...r.history,
          entry(
            action.by,
            fieldsChanged
              ? "Изменён перечень полей"
              : typesChanged
                ? "Изменены типы промо"
                : "Сохранено",
            needsReconfirm
              ? "Изменения требуют повторного утверждения."
              : undefined
          ),
        ];
        return {
          ...r,
          name,
          promoTypeIds,
          requiredFieldIds,
          status: needsReconfirm ? "draft" : r.status,
          confirmedBy: needsReconfirm ? undefined : r.confirmedBy,
          confirmedAt: needsReconfirm ? undefined : r.confirmedAt,
          history,
        };
      });

    case "send":
      return state.map((r) =>
        r.id === action.id && r.status === "draft"
          ? {
              ...r,
              status: "pending",
              history: [...r.history, entry(action.by, "Отправлено на подтверждение")],
            }
          : r
      );

    case "confirm":
      return state.map((r) =>
        r.id === action.id && (r.status === "pending" || r.status === "draft")
          ? {
              ...r,
              status: "approved",
              confirmedBy: action.by,
              confirmedAt: now(),
              history: [
                ...r.history,
                entry(action.by, "Утверждено", "Правило вступило в силу."),
              ],
            }
          : r
      );

    case "archive":
      return state.map((r) =>
        r.id === action.id && r.status !== "archived"
          ? {
              ...r,
              status: "archived",
              history: [...r.history, entry(action.by, "Архивировано")],
            }
          : r
      );

    default:
      return state;
  }
}

interface PromoTypesContextValue {
  rules: PromoTypeRule[];
  getRule: (id: string) => PromoTypeRule | undefined;
  /** Persist editor changes; an approved rule drops to Черновик (re-confirm). */
  save: (id: string, draft: RuleDraft, by: PromoRole) => void;
  /** Черновик → На подтверждении. */
  send: (id: string, by: PromoRole) => void;
  /** → Утверждено (Коммерческий директор only — gated in the UI). */
  confirm: (id: string, by: PromoRole) => void;
  /** → Архив (no hard delete). */
  archive: (id: string, by: PromoRole) => void;
  /** Create an empty draft; returns the new id so the caller can navigate to it. */
  create: (by: PromoRole) => string;
  /** Clone an existing rule as a new draft; returns the new id. */
  copy: (sourceId: string, by: PromoRole) => string;
}

const PromoTypesContext = React.createContext<
  PromoTypesContextValue | undefined
>(undefined);

export function PromoTypesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [rules, dispatch] = React.useReducer(reducer, undefined, () =>
    PROMO_TYPE_RULES.map((r) => ({ ...r }))
  );

  // create/copy generate the id outside the reducer so callers can navigate to it.
  const rulesRef = React.useRef(rules);
  rulesRef.current = rules;

  const value = React.useMemo<PromoTypesContextValue>(
    () => ({
      rules,
      getRule: (id) => rules.find((r) => r.id === id),
      save: (id, draft, by) => dispatch({ type: "save", id, draft, by }),
      send: (id, by) => dispatch({ type: "send", id, by }),
      confirm: (id, by) => dispatch({ type: "confirm", id, by }),
      archive: (id, by) => dispatch({ type: "archive", id, by }),
      create: (by) => {
        const id = nextRuleId(rulesRef.current);
        dispatch({ type: "create", id, by });
        return id;
      },
      copy: (sourceId, by) => {
        const id = nextRuleId(rulesRef.current);
        dispatch({ type: "copy", sourceId, id, by });
        return id;
      },
    }),
    [rules]
  );

  return (
    <PromoTypesContext.Provider value={value}>
      {children}
    </PromoTypesContext.Provider>
  );
}

export function usePromoTypes() {
  const ctx = React.useContext(PromoTypesContext);
  if (!ctx) {
    throw new Error("usePromoTypes must be used within a PromoTypesProvider");
  }
  return ctx;
}
