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
  formatPromoNo,
  getCategoryManager,
  getNomenclatureItem,
  getStoreAvailability,
  installmentTerm,
  isGiftChoiceType,
  isGiftType,
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

/**
 * Подарки — та же механика, что в полном промо-календаре (трекер, стр. 58 п.1;
 * гриду соответствует `GiftCell` в `FullCalendarGrid.tsx`):
 *  • не подарочный тип акции → «—» во всех девяти колонках;
 *  • «Подарок на выбор» → варианты только в блоке «Подарок на выбор (1)»,
 *    «Подарок (1)/(2)» показывают «—»;
 *  • фиксированный подарочный тип → «Подарок (1)» = gifts[0], «Подарок (2)» =
 *    gifts[1], блок выбора показывает «—».
 * Отчёт — плоская таблица без подстрок, поэтому варианты «подарка на выбор»
 * перечисляются в одной ячейке через запятую.
 */
type GiftBlock = "fixed1" | "fixed2" | "choice";
type GiftValue = "nom" | "avail" | "stock";

function giftCell(block: GiftBlock, field: GiftValue): Accessor {
  return (l, c) => {
    if (!isGiftType(c.type)) return DASH;
    const isChoiceCampaign = isGiftChoiceType(c.type);
    if (isChoiceCampaign !== (block === "choice")) return DASH;

    const gifts = l.gifts ?? [];
    const picked =
      block === "choice" ? gifts : gifts.slice(block === "fixed1" ? 0 : 1, block === "fixed1" ? 1 : 2);
    if (picked.length === 0) return DASH;

    const values = picked.map((g) => {
      if (field === "nom") return nomName(g.nomenclatureId);
      if (field === "avail")
        return formatAvailabilityPct(getStoreAvailability(g.nomenclatureId).pct);
      return num(getNomenclatureItem(g.nomenclatureId)?.stock);
    });
    return values.join(", ");
  };
}

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
  promoNo: (_l, c) => formatPromoNo(c.id),
  type: (_l, c) => c.type,
  name: (_l, c) => c.name,
  start: (_l, c) => ruDate(c.startDate),
  end: (_l, c) => ruDate(c.endDate),
  nomenclature: (l) => nomName(l.nomenclatureId),
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
  // «Платёж (старая)» и «Размер скидки» — трекер, стр. 58 п.2 (отсутствовали в
  // отчёте для маркетинга, хотя в полном промо-календаре считаются с S4).
  t12old: (l) => money(installmentTerm(l, oldPriceOf(l), 12).oldMonthly),
  t12new: (l) => money(installmentTerm(l, oldPriceOf(l), 12).newMonthly),
  t12disc: (l) => money(installmentTerm(l, oldPriceOf(l), 12).discount),
  t12full: (l) => money(installmentTerm(l, oldPriceOf(l), 12).newFullPrice),
  t24old: (l) => money(installmentTerm(l, oldPriceOf(l), 24).oldMonthly),
  t24new: (l) => money(installmentTerm(l, oldPriceOf(l), 24).newMonthly),
  t24disc: (l) => money(installmentTerm(l, oldPriceOf(l), 24).discount),
  t24full: (l) => money(installmentTerm(l, oldPriceOf(l), 24).newFullPrice),
  t36old: (l) => money(installmentTerm(l, oldPriceOf(l), 36).oldMonthly),
  t36new: (l) => money(installmentTerm(l, oldPriceOf(l), 36).newMonthly),
  t36disc: (l) => money(installmentTerm(l, oldPriceOf(l), 36).discount),
  t36full: (l) => money(installmentTerm(l, oldPriceOf(l), 36).newFullPrice),
  // marketing — подарки блоками, как в полном промо-календаре (стр. 58 п.1)
  gift1Nomenclature: giftCell("fixed1", "nom"),
  gift1Availability: giftCell("fixed1", "avail"),
  gift1Stock: giftCell("fixed1", "stock"),
  gift2Nomenclature: giftCell("fixed2", "nom"),
  gift2Availability: giftCell("fixed2", "avail"),
  gift2Stock: giftCell("fixed2", "stock"),
  giftChoiceNomenclature: giftCell("choice", "nom"),
  giftChoiceAvailability: giftCell("choice", "avail"),
  giftChoiceStock: giftCell("choice", "stock"),
  utp: (l) => l.utp ?? DASH,
  advRecommendedKm: (l) => l.advRecommendedKm,
  advSelectedMarketing: (l) => l.advSelectedMarketing,
  // compensation (Закуп/Аналитика)
  supplierCompensation: (l) => money(l.supplierCompensation),
  compensationLimit: (l) => num(l.compensationLimit),
};

// Report-local identity/extra columns not present (or not 1:1) in gridFields.
// Widths compacted per 7-я часть §6.2 (short values → narrow, like the short
// calendar); long-text columns keep width — their values now wrap onto 2 lines.
const LOCAL_COLUMNS: Record<string, Omit<ReportColumn, "value">> = {
  priznak: { id: "priznak", label: "Признак", kind: "text", group: "Идентификация", width: 110 },
  km: { id: "km", label: "ФИО КМ", kind: "text", group: "Идентификация", width: 160 },
  promoNo: { id: "promoNo", label: "№ промо", kind: "text", group: "Идентификация", width: 104 },
  start: { id: "start", label: "Начало", kind: "date", group: "Идентификация", width: 110 },
  end: { id: "end", label: "Окончание", kind: "date", group: "Идентификация", width: 110 },
  nomenclature: { id: "nomenclature", label: "Номенклатура", kind: "text", group: "Товар", width: 260 },
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
// Порядок внутри групп повторяет gridFields — требование «последовательность полей
// должна соответствовать полному промо-календарю» (трекер, стр. 58).
const MARKETING_IDS = [
  "priznak", "km", "promoNo", "type", "name", "start", "end",
  "nomenclature", "brand", "storeAvailability", "stock", "oldPrice",
  "newPrice", "discountPct", "cashDiscountPct",
  "inst006", "inst0012", "inst5002",
  "t12old", "t12new", "t12disc", "t12full",
  "t24old", "t24new", "t24disc", "t24full",
  "t36old", "t36new", "t36disc", "t36full",
  "gift1Nomenclature", "gift1Availability", "gift1Stock",
  "gift2Nomenclature", "gift2Availability", "gift2Stock",
  "giftChoiceNomenclature", "giftChoiceAvailability", "giftChoiceStock",
  "utp", "advRecommendedKm", "advSelectedMarketing",
];
// Закуп/Аналитика: механики подарков разделены так же, как в полном промо-календаре,
// но без колонок наличия/остатка — эти два отчёта их никогда не показывали и служат
// расчёту компенсации поставщика.
const COMPENSATION_IDS = [
  "type", "name", "start", "end", "nomenclature",
  "gift1Nomenclature", "gift2Nomenclature", "giftChoiceNomenclature",
  "supplierCompensation", "compensationLimit",
];

const MARKETING_COLUMNS = MARKETING_IDS.map(buildColumn);
const COMPENSATION_COLUMNS = COMPENSATION_IDS.map(buildColumn);

export function reportColumnsFor(department: ReportDepartment): ReportColumn[] {
  return department === "marketing" ? MARKETING_COLUMNS : COMPENSATION_COLUMNS;
}
