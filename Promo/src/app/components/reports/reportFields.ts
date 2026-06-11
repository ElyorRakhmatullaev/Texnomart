// S5 — Department-report field routing (Appendix C M/P/A columns, spec §7.2–§7.2.2).
//
// Each department report shows its own subset of the full-calendar field
// dictionary. Marketing receives the widest set (identity + prices + installment
// block + gifts + УТП + both «В рекламу» checkboxes); Purchasing and Analytics
// receive the same narrow compensation/limit set. Field VALUES are computed here
// (a heterogeneous accessor per field, reusing the mock-data installment helpers);
// DepartmentReportView owns the rendering (highlight, checkbox, Mode-B cards).

import {
  getCategoryManager,
  getNomenclatureItem,
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

export interface ReportField {
  /** Stable id — the suffix in a `${lineId}:${fieldId}` changed-cell key. */
  id: string;
  label: string;
  kind: ReportFieldKind;
  /** Group header for the wide marketing table; omitted for the narrow reports. */
  group?: string;
  /** RU-formatted display value (string), or a boolean for checkbox fields. */
  value: (line: PromoLine, campaign: PromoCampaign) => string | boolean;
}

// ── value helpers ──────────────────────────────────────────────────────────────

const DASH = "—";

function ruDate(d: Date): string {
  return d.toLocaleDateString("ru-RU");
}
function money(v: number | undefined): string {
  return v != null ? formatSum(v) : DASH;
}
function num(v: number | undefined): string {
  return v != null ? v.toLocaleString("ru-RU") : DASH;
}
function pct(v: number | undefined): string {
  return v != null ? `${v}%` : DASH;
}
function nomName(id: string | undefined): string {
  if (!id) return DASH;
  return getNomenclatureItem(id)?.name ?? id;
}
function oldPriceOf(line: PromoLine): number {
  return getNomenclatureItem(line.nomenclatureId)?.oldRetailPrice ?? 0;
}

// ── identity fields (shared by all reports) ──────────────────────────────────────

const PRIZNAK: ReportField = {
  id: "priznak",
  label: "Признак",
  kind: "text",
  group: "Идентификация",
  value: (_l, c) => (c.planned ? "Плановая" : "Внеплановая"),
};
const KM: ReportField = {
  id: "km",
  label: "ФИО КМ",
  kind: "text",
  group: "Идентификация",
  value: (l) => getCategoryManager(l.kmId)?.name ?? l.kmId,
};
const PROMO_NO: ReportField = {
  id: "promoNo",
  label: "№ промо",
  kind: "text",
  group: "Идентификация",
  value: (_l, c) => c.id,
};
const TYPE: ReportField = {
  id: "type",
  label: "Тип промо",
  kind: "text",
  group: "Идентификация",
  value: (_l, c) => c.type,
};
const NAME: ReportField = {
  id: "name",
  label: "Название акции",
  kind: "text",
  group: "Идентификация",
  value: (_l, c) => c.name,
};
const START: ReportField = {
  id: "start",
  label: "Начало",
  kind: "date",
  group: "Идентификация",
  value: (_l, c) => ruDate(c.startDate),
};
const END: ReportField = {
  id: "end",
  label: "Окончание",
  kind: "date",
  group: "Идентификация",
  value: (_l, c) => ruDate(c.endDate),
};
const NOMENCLATURE: ReportField = {
  id: "nomenclature",
  label: "Номенклатура",
  kind: "text",
  group: "Товар",
  value: (l) => nomName(l.nomenclatureId),
};
const GIFT_NOMENCLATURE: ReportField = {
  id: "giftNomenclature",
  label: "Номенклатура по подаркам",
  kind: "text",
  group: "Товар",
  value: (l) => nomName(l.giftNomenclatureId),
};

// ── marketing-only fields ────────────────────────────────────────────────────────

const STOCK: ReportField = {
  id: "stock",
  label: "Остаток",
  kind: "number",
  group: "Товар",
  value: (l) => num(l.stock),
};
const OLD_PRICE: ReportField = {
  id: "oldPrice",
  label: "Розничная цена (старая)",
  kind: "money",
  group: "Цены",
  value: (l) => money(oldPriceOf(l)),
};
const NEW_PRICE: ReportField = {
  id: "newPrice",
  label: "Новая цена",
  kind: "money",
  group: "Цены",
  value: (l) => money(l.newPrice),
};
const DISCOUNT: ReportField = {
  id: "discountPct",
  label: "Скидка, %",
  kind: "percent",
  group: "Цены",
  value: (l) => pct(l.discountPct),
};
const CASH_DISCOUNT: ReportField = {
  id: "cashDiscountPct",
  label: "Скидка за Cash, %",
  kind: "percent",
  group: "Цены",
  value: (l) => pct(l.cashDiscountPct),
};
const GIFT_STOCK: ReportField = {
  id: "giftStock",
  label: "Остаток подарка",
  kind: "number",
  group: "Подарки",
  value: (l) => num(l.giftStock),
};
const UTP: ReportField = {
  id: "utp",
  label: "УТП",
  kind: "text",
  group: "Маркетинг",
  value: (l) => l.utp ?? DASH,
};
const ADV_KM: ReportField = {
  id: "advRecommendedKm",
  label: "В рекламу (КМ)",
  kind: "check",
  group: "Маркетинг",
  value: (l) => l.advRecommendedKm,
};
const ADV_MARKETING: ReportField = {
  id: "advSelectedMarketing",
  label: "В рекламу (маркетинг)",
  kind: "check",
  group: "Маркетинг",
  value: (l) => l.advSelectedMarketing,
};

/** Installment program / term columns (§8.5) — representative of the «full block». */
const INST_006: ReportField = {
  id: "inst006",
  label: "0-0-6 (платёж/мес)",
  kind: "money",
  group: "Рассрочка",
  value: (l) => money(programMonthly(l.newPrice, 6)),
};
const INST_0012: ReportField = {
  id: "inst0012",
  label: "0-0-12 (платёж/мес)",
  kind: "money",
  group: "Рассрочка",
  value: (l) => money(programMonthly(l.newPrice, 12)),
};
const INST_5002: ReportField = {
  id: "inst5002",
  label: "50-0-2 (платёж/мес)",
  kind: "money",
  group: "Рассрочка",
  value: (l) => money(programMonthly(l.newPrice, 2, 0.5)),
};

function termField(
  months: 12 | 24 | 36,
  part: "new" | "full",
  label: string
): ReportField {
  return {
    id: `t${months}${part}`,
    label,
    kind: "money",
    group: "Рассрочка",
    value: (l) => {
      const t = installmentTerm(l, oldPriceOf(l), months);
      return money(part === "new" ? t.newMonthly : t.newFullPrice);
    },
  };
}

// ── compensation fields (purchasing / analytics) ─────────────────────────────────

const SUPPLIER_COMPENSATION: ReportField = {
  id: "supplierCompensation",
  label: "Компенсация поставщика",
  kind: "money",
  group: "Компенсация",
  value: (l) => money(l.supplierCompensation),
};
const COMPENSATION_LIMIT: ReportField = {
  id: "compensationLimit",
  label: "Лимит компенс. кол-ва",
  kind: "number",
  group: "Компенсация",
  value: (l) => num(l.compensationLimit),
};

// ── per-department field lists (Appendix C) ──────────────────────────────────────

const MARKETING_FIELDS: ReportField[] = [
  PRIZNAK,
  KM,
  PROMO_NO,
  TYPE,
  NAME,
  START,
  END,
  NOMENCLATURE,
  STOCK,
  OLD_PRICE,
  NEW_PRICE,
  DISCOUNT,
  CASH_DISCOUNT,
  INST_006,
  INST_0012,
  INST_5002,
  termField(12, "new", "12 мес: платёж (новая)"),
  termField(12, "full", "12 мес: полная цена"),
  termField(24, "new", "24 мес: платёж (новая)"),
  termField(24, "full", "24 мес: полная цена"),
  termField(36, "new", "36 мес: платёж (новая)"),
  termField(36, "full", "36 мес: полная цена"),
  GIFT_NOMENCLATURE,
  GIFT_STOCK,
  UTP,
  ADV_KM,
  ADV_MARKETING,
];

// Purchasing & Analytics share the same narrow set (§7.2.1, §7.2.2): тип, название,
// dates, номенклатура, gift, компенсация, лимит — all read-only.
const COMPENSATION_FIELDS: ReportField[] = [
  TYPE,
  NAME,
  START,
  END,
  NOMENCLATURE,
  GIFT_NOMENCLATURE,
  SUPPLIER_COMPENSATION,
  COMPENSATION_LIMIT,
];

export function reportFieldsFor(department: ReportDepartment): ReportField[] {
  return department === "marketing" ? MARKETING_FIELDS : COMPENSATION_FIELDS;
}

/** The single marketing-editable field id (§7.2) — «В рекламу (выбрано маркетингом)». */
export const MARKETING_EDITABLE_FIELD = "advSelectedMarketing";
