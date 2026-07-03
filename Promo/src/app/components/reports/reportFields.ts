// S5 — Department-report columns, PROJECTED from the full-calendar dictionary
// (gridFields.ts) so labels/order/formatting stay in sync with the full calendar
// (feedback §1) and new fields (Бренд, Наличие в магазинах, %) flow in automatically.
// Each department shows its own ordered subset; report-local identity columns
// (№ промо, ФИО КМ, Начало, Окончание, Номенклатура, подарки) are defined here
// because they are not 1:1 scrolling gridFields columns. Value accessors live here.

import {
  COLUMNS as GRID_COLUMNS,
  type CellKind,
  type ColumnDef,
  type ColumnGroupKey,
} from "../full-calendar/gridFields";
import {
  formatAvailabilityPct,
  getCategoryManager,
  getNomenclatureItem,
  getStoreAvailability,
  installmentTerm,
  programMonthly,
  type PromoCampaign,
  type PromoLine,
  type ReportDepartment,
} from "../../../lib/promo-mock-data";
import { formatSum } from "@texnomart/shared/utils/formatters";

export type ReportFieldKind =
  | "text"
  | "money"
  | "number"
  | "percent"
  | "date"
  | "check";

export interface ReportColumn {
  /** Stable id — the suffix in a `${lineId}:${fieldId}` changed-cell key. */
  id: string;
  label: string;
  kind: ReportFieldKind;
  /** Group header for the wide marketing table; omitted for the narrow reports. */
  group?: string;
  /** px column width (frozen/scroll pane alignment). */
  width: number;
  /** RU-formatted display value (string), or a boolean for checkbox fields. */
  value: (line: PromoLine, campaign: PromoCampaign) => string | boolean;
}

/** Back-compat alias so existing imports keep compiling. */
export type ReportField = ReportColumn;

export const MARKETING_EDITABLE_FIELD = "advSelectedMarketing";

// ── value helpers ──────────────────────────────────────────────────────────────
const DASH = "—";
const ruDate = (d: Date) => d.toLocaleDateString("ru-RU");
const money = (v: number | undefined) => (v != null ? formatSum(v) : DASH);
const num = (v: number | undefined) => (v != null ? v.toLocaleString("ru-RU") : DASH);
const pct = (v: number | undefined) => (v != null ? `${v}%` : DASH);
const nomName = (id: string | undefined) =>
  !id ? DASH : getNomenclatureItem(id)?.name ?? id;
const oldPriceOf = (line: PromoLine) =>
  getNomenclatureItem(line.nomenclatureId)?.oldRetailPrice ?? 0;

// gridFields CellKind ("checkbox") → ReportFieldKind ("check").
function mapKind(k: CellKind): ReportFieldKind {
  return k === "checkbox" ? "check" : k;
}
const GRID_GROUP_LABEL: Record<ColumnGroupKey, string> = {
  identity: "Идентификация",
  product: "Товар",
  prices: "Цены",
  installments: "Рассрочка",
  marketing: "Маркетинг",
};

// ── value accessors, keyed by column id ──────────────────────────────────────────
type Accessor = (l: PromoLine, c: PromoCampaign) => string | boolean;

const ACCESSORS: Record<string, Accessor> = {
  // report-local identity
  priznak: (_l, c) => (c.planned ? "Плановая" : "Внеплановая"),
  km: (l) => getCategoryManager(l.kmId)?.name ?? l.kmId,
  promoNo: (_l, c) => c.id,
  type: (_l, c) => c.type,
  name: (_l, c) => c.name,
  start: (_l, c) => ruDate(c.startDate),
  end: (_l, c) => ruDate(c.endDate),
  nomenclature: (l) => nomName(l.nomenclatureId),
  giftNomenclature: (l) =>
    l.gifts && l.gifts.length
      ? l.gifts.map((g) => nomName(g.nomenclatureId)).join(", ")
      : DASH,
  // product (from gridFields)
  brand: (l) => getNomenclatureItem(l.nomenclatureId)?.brand ?? DASH,
  storeAvailability: (l) =>
    formatAvailabilityPct(getStoreAvailability(l.nomenclatureId).pct),
  stock: (l) => num(l.stock),
  oldPrice: (l) => money(oldPriceOf(l)),
  // prices
  newPrice: (l) => money(l.newPrice),
  discountPct: (l) => pct(l.discountPct),
  cashDiscountPct: (l) => pct(l.cashDiscountPct),
  // installments (representative subset)
  inst006: (l) => money(programMonthly(l.newPrice, 6)),
  inst0012: (l) => money(programMonthly(l.newPrice, 12)),
  inst5002: (l) => money(programMonthly(l.newPrice, 2, 0.5)),
  t12new: (l) => money(installmentTerm(l, oldPriceOf(l), 12).newMonthly),
  t12full: (l) => money(installmentTerm(l, oldPriceOf(l), 12).newFullPrice),
  t24new: (l) => money(installmentTerm(l, oldPriceOf(l), 24).newMonthly),
  t24full: (l) => money(installmentTerm(l, oldPriceOf(l), 24).newFullPrice),
  t36new: (l) => money(installmentTerm(l, oldPriceOf(l), 36).newMonthly),
  t36full: (l) => money(installmentTerm(l, oldPriceOf(l), 36).newFullPrice),
  // marketing
  giftStock: (l) => num(getNomenclatureItem(l.gifts?.[0]?.nomenclatureId ?? "")?.stock),
  utp: (l) => l.utp ?? DASH,
  advRecommendedKm: (l) => l.advRecommendedKm,
  advSelectedMarketing: (l) => l.advSelectedMarketing,
  // compensation (Закуп/Аналитика)
  supplierCompensation: (l) => money(l.supplierCompensation),
  compensationLimit: (l) => num(l.compensationLimit),
};

// Report-local identity/extra columns not present (or not 1:1) in gridFields.
const LOCAL_COLUMNS: Record<string, Omit<ReportColumn, "value">> = {
  priznak: { id: "priznak", label: "Признак", kind: "text", group: "Идентификация", width: 130 },
  km: { id: "km", label: "ФИО КМ", kind: "text", group: "Идентификация", width: 180 },
  promoNo: { id: "promoNo", label: "№ промо", kind: "text", group: "Идентификация", width: 130 },
  start: { id: "start", label: "Начало", kind: "date", group: "Идентификация", width: 120 },
  end: { id: "end", label: "Окончание", kind: "date", group: "Идентификация", width: 120 },
  nomenclature: { id: "nomenclature", label: "Номенклатура", kind: "text", group: "Товар", width: 260 },
  giftNomenclature: { id: "giftNomenclature", label: "Номенклатура по подаркам", kind: "text", group: "Товар", width: 220 },
  giftStock: { id: "giftStock", label: "Остаток подарка", kind: "number", group: "Подарки", width: 150 },
};

const GRID_BY_ID = new Map<string, ColumnDef>(GRID_COLUMNS.map((c) => [c.id, c]));

// supplierCompensation/compensationLimit live under gridFields' "marketing" group
// (full-calendar layout), but in the Закуп/Аналитика report they belong to their
// own «Компенсация» group header.
const GROUP_OVERRIDE: Record<string, string> = {
  supplierCompensation: "Компенсация",
  compensationLimit: "Компенсация",
};

function buildColumn(id: string): ReportColumn {
  const value = ACCESSORS[id];
  if (!value) throw new Error(`reportFields: no accessor for column "${id}"`);
  const local = LOCAL_COLUMNS[id];
  if (local) return { ...local, value };
  const g = GRID_BY_ID.get(id);
  if (!g) throw new Error(`reportFields: "${id}" is neither local nor a gridFields column`);
  return {
    id: g.id,
    label: g.label,
    kind: mapKind(g.kind),
    group: GROUP_OVERRIDE[g.id] ?? GRID_GROUP_LABEL[g.group],
    width: g.width,
    value,
  };
}

// Ordered per-department id lists (subset of gridFields + local identity columns).
const MARKETING_IDS = [
  "priznak", "km", "promoNo", "type", "name", "start", "end",
  "nomenclature", "brand", "storeAvailability", "stock", "oldPrice",
  "newPrice", "discountPct", "cashDiscountPct",
  "inst006", "inst0012", "inst5002",
  "t12new", "t12full", "t24new", "t24full", "t36new", "t36full",
  "giftNomenclature", "giftStock", "utp", "advRecommendedKm", "advSelectedMarketing",
];
const COMPENSATION_IDS = [
  "type", "name", "start", "end",
  "nomenclature", "giftNomenclature", "supplierCompensation", "compensationLimit",
];

const MARKETING_COLUMNS = MARKETING_IDS.map(buildColumn);
const COMPENSATION_COLUMNS = COMPENSATION_IDS.map(buildColumn);

export function reportColumnsFor(department: ReportDepartment): ReportColumn[] {
  return department === "marketing" ? MARKETING_COLUMNS : COMPENSATION_COLUMNS;
}
