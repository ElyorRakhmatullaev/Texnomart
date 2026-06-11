// S7 — required-field catalog for promo-type rules (spec §9).
//
// The checklist of fields a rule can mark «обязательное» is the full-calendar
// field set (Appendix C). We derive it from the single gridFields dictionary so
// the labels/categories never drift from the actual calendar columns, and
// prepend the 3 spec-frozen identity columns (№ промо / ФИО КМ / Номенклатура)
// that live in the grid's frozen pane and aren't part of COLUMNS.

import {
  COLUMN_GROUPS,
  COLUMNS,
  type ColumnGroupKey,
} from "../full-calendar/gridFields";

export interface RuleFieldDef {
  id: string;
  label: string;
}

export interface RuleFieldGroup {
  key: ColumnGroupKey;
  label: string;
  fields: RuleFieldDef[];
}

// The 3 frozen identity columns (not in gridFields COLUMNS) — belong to the
// «Идентификация» category for the checklist.
const FROZEN_IDENTITY_FIELDS: RuleFieldDef[] = [
  { id: "promoNo", label: "№ промо" },
  { id: "kmName", label: "ФИО КМ" },
  { id: "nomenclature", label: "Номенклатура" },
];

/** Field catalog grouped by category, in the COLUMN_GROUPS order. */
export const RULE_FIELD_GROUPS: RuleFieldGroup[] = COLUMN_GROUPS.map((g) => {
  const fields: RuleFieldDef[] = [];
  if (g.key === "identity") fields.push(...FROZEN_IDENTITY_FIELDS);
  for (const col of COLUMNS) {
    if (col.group === g.key) fields.push({ id: col.id, label: col.label });
  }
  return { key: g.key, label: g.label, fields };
});

/** Flat id → label map across every category (for the editor / summaries). */
export const RULE_FIELD_LABEL: Record<string, string> = RULE_FIELD_GROUPS.reduce(
  (acc, group) => {
    for (const f of group.fields) acc[f.id] = f.label;
    return acc;
  },
  {} as Record<string, string>
);

/** Total number of configurable fields (for the «N из M» group toggles). */
export const RULE_FIELD_COUNT = Object.keys(RULE_FIELD_LABEL).length;
