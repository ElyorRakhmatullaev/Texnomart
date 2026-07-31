// Full promo-calendar column dictionary (S2 — Appendix C, 38 fields).
//
// The 3 spec-frozen columns (№ промо, ФИО КМ, Номенклатура) live in the grid's
// frozen pane and are NOT listed here. Everything below is a scrolling column,
// grouped so the column-group toggle can show/hide whole blocks. Cell VALUES are
// rendered by FullCalendarGrid (heterogeneous accessors); this file owns the
// stable column METADATA (label, width, source → lock icon, required → asterisk).

export type ColumnGroupKey =
  | "identity"
  | "product"
  | "prices"
  | "installments"
  | "marketing";

export interface ColumnGroupDef {
  key: ColumnGroupKey;
  label: string;
}

export const COLUMN_GROUPS: ColumnGroupDef[] = [
  { key: "identity", label: "Идентификация" },
  { key: "product", label: "Товар" },
  { key: "prices", label: "Цены" },
  { key: "installments", label: "Рассрочка" },
  { key: "marketing", label: "Маркетинг" },
];

// Feedback §11: all column groups are selected/visible by default; the user can
// deselect the ones they don't need. (Previously Идентификация + Рассрочка were OFF.)
export const DEFAULT_VISIBLE_GROUPS: ColumnGroupKey[] = [
  "identity",
  "product",
  "prices",
  "installments",
  "marketing",
];

/**
 * Where a field's value comes from — drives the header lock icon:
 *  auto    — auto-filled from the short calendar (planned campaigns), read-only
 *  1c      — pulled from 1С, read-only
 *  calc    — auto-calculated (e.g. installment monthly payments), read-only
 *  km      — entered/edited by the КМ
 *  marketing — editable only by Маркетинг («В рекламу (выбрано маркетингом)»)
 */
export type FieldSource = "auto" | "1c" | "calc" | "km" | "marketing";

export type CellKind = "text" | "money" | "number" | "percent" | "date" | "checkbox";

export interface ColumnDef {
  id: string;
  label: string;
  /** px width of the column cell. */
  width: number;
  group: ColumnGroupKey;
  source: FieldSource;
  kind: CellKind;
  required?: boolean;
  /** Only shown/required for gift типы («1+1» / «Товар в подарок»). */
  giftOnly?: boolean;
}

const LOCKED_SOURCES: FieldSource[] = ["auto", "1c", "calc"];
export function isLocked(source: FieldSource): boolean {
  return LOCKED_SOURCES.includes(source);
}

export function lockHint(source: FieldSource): string {
  switch (source) {
    case "1c":
      return "Из 1С, только для чтения";
    case "calc":
      return "Рассчитывается автоматически";
    case "auto":
      return "Заполняется автоматически из краткого календаря";
    default:
      return "";
  }
}

/** Full ordered column list (excludes the 3 frozen identity columns). */
export const COLUMNS: ColumnDef[] = [
  // ── Идентификация (campaign-level) — Тип промо / Название / Период показываются
  // отдельными столбцами (feedback §4), а не в верхней строке промо. Дедлайн в
  // полном промо-календаре не отображается (§4).
  { id: "priznak", label: "Признак акции", width: 130, group: "identity", source: "auto", kind: "text" },
  { id: "type", label: "Тип промо", width: 150, group: "identity", source: "auto", kind: "text" },
  { id: "name", label: "Название акции", width: 220, group: "identity", source: "auto", kind: "text" },
  { id: "period", label: "Период акции", width: 210, group: "identity", source: "auto", kind: "date" },

  // ── Товар ──
  // Бренд → Наличие в магазинах → Остаток (feedback §5, §6): бренд и наличие
  // подтягиваются из 1С (read-only), стоят ПЕРЕД остатком.
  { id: "brand", label: "Бренд", width: 130, group: "product", source: "1c", kind: "text" },
  { id: "storeAvailability", label: "Наличие в магазинах", width: 160, group: "product", source: "1c", kind: "percent" },
  { id: "stock", label: "Остаток", width: 120, group: "product", source: "km", kind: "number" },
  { id: "cost", label: "Себестоимость", width: 150, group: "product", source: "1c", kind: "money" },
  { id: "oldPrice", label: "Розничная цена (старая)", width: 180, group: "product", source: "auto", kind: "money" },

  // ── Цены ──
  { id: "newPrice", label: "Новая цена (розничная)", width: 170, group: "prices", source: "km", kind: "money" },
  { id: "discountPct", label: "Скидка, %", width: 110, group: "prices", source: "km", kind: "percent" },
  { id: "regularSales", label: "Регулярные продажи", width: 150, group: "prices", source: "km", kind: "number" },
  { id: "salesForecast", label: "Прогноз продаж", width: 150, group: "prices", source: "km", kind: "number", required: true },
  { id: "cashDiscountPct", label: "Скидка, % за Cash", width: 140, group: "prices", source: "km", kind: "percent" },

  // ── Рассрочка ── (programs + 12/24/36-мес sets, spec §8.5)
  { id: "inst006", label: "0-0-6 (платёж/мес)", width: 150, group: "installments", source: "calc", kind: "money" },
  { id: "inst0012", label: "0-0-12 (платёж/мес)", width: 150, group: "installments", source: "calc", kind: "money" },
  { id: "inst5002", label: "50-0-2 (платёж/мес)", width: 150, group: "installments", source: "calc", kind: "money" },

  { id: "t12old", label: "12 мес: платёж (старая)", width: 170, group: "installments", source: "calc", kind: "money" },
  { id: "t12new", label: "12 мес: платёж (новая)", width: 170, group: "installments", source: "calc", kind: "money" },
  { id: "t12disc", label: "12 мес: размер скидки", width: 160, group: "installments", source: "km", kind: "money" },
  { id: "t12full", label: "12 мес: полная цена (новая)", width: 190, group: "installments", source: "calc", kind: "money" },

  { id: "t24old", label: "24 мес: платёж (старая)", width: 170, group: "installments", source: "calc", kind: "money" },
  { id: "t24new", label: "24 мес: платёж (новая)", width: 170, group: "installments", source: "calc", kind: "money" },
  { id: "t24disc", label: "24 мес: размер скидки", width: 160, group: "installments", source: "km", kind: "money" },
  { id: "t24full", label: "24 мес: полная цена (новая)", width: 190, group: "installments", source: "calc", kind: "money" },

  { id: "t36old", label: "36 мес: платёж (старая)", width: 170, group: "installments", source: "calc", kind: "money" },
  { id: "t36new", label: "36 мес: платёж (новая)", width: 170, group: "installments", source: "calc", kind: "money" },
  { id: "t36disc", label: "36 мес: размер скидки", width: 160, group: "installments", source: "km", kind: "money" },
  { id: "t36full", label: "36 мес: полная цена (новая)", width: 190, group: "installments", source: "calc", kind: "money" },

  // ── Маркетинг ──
  // Подарки (10-я часть R44): «Подарок (1)» / «Подарок (2)» — два фиксированных подарка
  // по одной акции («Товар в подарок» / «1+1»), каждый = номенклатура (КМ выбирает из 1С)
  // + наличие в магазинах, % и остаток (из 1С, read-only). Для механики «Подарок на выбор»
  // блок «Подарок (1)» показывает варианты списком (подпись «Подарок на выбор», по одному на
  // подстроку); «Подарок (2)» не используется.
  { id: "gift1Nomenclature", label: "Подарок (1)", width: 220, group: "marketing", source: "km", kind: "text", giftOnly: true },
  { id: "gift1Availability", label: "Подарок (1): наличие, %", width: 160, group: "marketing", source: "1c", kind: "percent", giftOnly: true },
  { id: "gift1Stock", label: "Подарок (1): остаток", width: 150, group: "marketing", source: "1c", kind: "number", giftOnly: true },
  { id: "gift2Nomenclature", label: "Подарок (2)", width: 220, group: "marketing", source: "km", kind: "text", giftOnly: true },
  { id: "gift2Availability", label: "Подарок (2): наличие, %", width: 160, group: "marketing", source: "1c", kind: "percent", giftOnly: true },
  { id: "gift2Stock", label: "Подарок (2): остаток", width: 150, group: "marketing", source: "1c", kind: "number", giftOnly: true },
  { id: "supplierCompensation", label: "Компенсация поставщика", width: 180, group: "marketing", source: "km", kind: "money" },
  { id: "compensationLimit", label: "Лимит компенс. кол-ва", width: 170, group: "marketing", source: "km", kind: "number" },
  { id: "utp", label: "УТП", width: 200, group: "marketing", source: "km", kind: "text" },
  { id: "advRecommendedKm", label: "В рекламу (КМ)", width: 130, group: "marketing", source: "km", kind: "checkbox" },
  { id: "advSelectedMarketing", label: "В рекламу (маркетинг)", width: 160, group: "marketing", source: "marketing", kind: "checkbox" },
];
