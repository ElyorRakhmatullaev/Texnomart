// Global mock dataset for Texnomart Promo. All data is mock — no API yet.
// Later screens (S1–S8) reuse these seeds. Types are co-located here.

import type { PromoRole } from "../app/role-context";

// ── Status taxonomy (Appendix A) ──────────────────────────────────────────────

/** Campaign-level status — auto-computed, read-only (short calendar). */
export type CampaignStatus =
  | "На согласовании у старшего КМ"
  | "На согласовании у коммерческого директора"
  | "Переотправлено на корректировку КМ"
  | "Согласовано и отправлено смежным отделам"
  | "Отменена";

/** KM-level status — per (Promo + КМ). */
export type KmStatus =
  | "Не заполнено / Ожидание корректировки от КМ"
  | "На согласовании у старшего КМ"
  | "Согласовано старшим КМ (ожидает КД)"
  | "На согласовании у коммерческого директора"
  | "Принято коммерческим директором"
  | "Не участвует";

/** Plan-level status (plan workflow). */
export type PlanStatus =
  | "На ознакомлении"
  | "На обсуждении"
  | "На согл. с КД"
  | "На согл. с ОД"
  | "Утверждён"
  | "Отклонён";

// ── Reference data ────────────────────────────────────────────────────────────

export interface PromoTypeRef {
  id: string;
  name: string;
  /** Gift-bearing types require gift nomenclature fields (spec §8.8). */
  giftType?: boolean;
}

export const PROMO_TYPES: PromoTypeRef[] = [
  { id: "discount", name: "Скидка" },
  { id: "installment-0-0-12", name: "Рассрочка 0-0-12" },
  { id: "installment-0-0-6", name: "Рассрочка 0-0-6" },
  { id: "one-plus-one", name: "1+1", giftType: true },
  { id: "gift", name: "Товар в подарок", giftType: true },
  { id: "cashback", name: "Cashback" },
  { id: "clearance", name: "Распродажа" },
];

export interface CategoryManager {
  id: string;
  /** ФИО. */
  name: string;
  category: string;
  senior?: boolean;
}

export const CATEGORY_MANAGERS: CategoryManager[] = [
  { id: "km-1", name: "Алиев Бекзод", category: "Телевизоры и аудио" },
  { id: "km-2", name: "Юсупова Нигора", category: "Холодильники и крупная БТ" },
  { id: "km-3", name: "Каримов Шерзод", category: "Смартфоны и гаджеты" },
  { id: "km-4", name: "Рашидова Дилноза", category: "Мелкая бытовая техника" },
  { id: "km-5", name: "Тошматов Фаррух", category: "Ноутбуки и ПК" },
  { id: "km-6", name: "Исмаилов Жасур", category: "Климатическая техника", senior: true },
];

export interface NomenclatureItem {
  /** 1С code. */
  id: string;
  name: string;
  category: string;
  /** Себестоимость (1С, locked). */
  cost: number;
  /** Розничная цена (старая), KM-only, locked. */
  oldRetailPrice: number;
  /** Остаток (1С, editable by КМ). */
  stock: number;
}

// ~30 SKUs across the КМ categories, generated deterministically (no randomness).
const NOMENCLATURE_SEED: Array<[string, string, number, number, number]> = [
  ["Samsung QLED 55\" QE55Q60D", "Телевизоры и аудио", 6200000, 8990000, 42],
  ["LG OLED 48\" OLED48C4", "Телевизоры и аудио", 8100000, 11490000, 18],
  ["Saund-бар Samsung HW-B650", "Телевизоры и аудио", 2100000, 3290000, 60],
  ["Artel ТВ 43\" 43H3401", "Телевизоры и аудио", 1900000, 2790000, 75],
  ["Xiaomi TV A2 50\"", "Телевизоры и аудио", 3100000, 4490000, 33],
  ["Холодильник Artel HD 455", "Холодильники и крупная БТ", 3900000, 5690000, 28],
  ["Samsung RB37 No Frost", "Холодильники и крупная БТ", 5600000, 7990000, 15],
  ["LG GC-B247 Side-by-Side", "Холодильники и крупная БТ", 9800000, 13990000, 9],
  ["Стиральная машина Bosch WGG", "Холодильники и крупная БТ", 4700000, 6790000, 21],
  ["Посудомоечная Midea MFD45", "Холодильники и крупная БТ", 3300000, 4790000, 17],
  ["iPhone 15 128GB", "Смартфоны и гаджеты", 9900000, 12990000, 40],
  ["Samsung Galaxy S24 256GB", "Смартфоны и гаджеты", 9100000, 11990000, 35],
  ["Xiaomi Redmi Note 13 Pro", "Смартфоны и гаджеты", 2600000, 3590000, 88],
  ["Realme 12 Pro 8/256", "Смартфоны и гаджеты", 2900000, 3990000, 52],
  ["Наушники Apple AirPods Pro 2", "Смартфоны и гаджеты", 2300000, 3290000, 64],
  ["Пылесос Dyson V12", "Мелкая бытовая техника", 4200000, 5990000, 12],
  ["Кофемашина De'Longhi Magnifica", "Мелкая бытовая техника", 3600000, 5290000, 14],
  ["Мультиварка Redmond RMC", "Мелкая бытовая техника", 620000, 990000, 130],
  ["Утюг Philips Azur", "Мелкая бытовая техника", 480000, 749000, 110],
  ["Блендер Bosch ErgoMixx", "Мелкая бытовая техника", 390000, 599000, 95],
  ["Ноутбук ASUS Vivobook 15", "Ноутбуки и ПК", 5400000, 7490000, 22],
  ["MacBook Air M3 13\"", "Ноутбуки и ПК", 13200000, 16990000, 7],
  ["Lenovo IdeaPad Slim 3", "Ноутбуки и ПК", 4100000, 5790000, 30],
  ["Монитор Samsung 27\" T35F", "Ноутбуки и ПК", 1600000, 2390000, 44],
  ["ПК HP Pavilion Desktop", "Ноутбуки и ПК", 6800000, 9290000, 11],
  ["Кондиционер Artel 12000 BTU", "Климатическая техника", 2700000, 3890000, 48],
  ["Кондиционер Gree Bora 09", "Климатическая техника", 3100000, 4490000, 26],
  ["Обогреватель Ballu BIH", "Климатическая техника", 540000, 849000, 140],
  ["Увлажнитель Xiaomi Smart", "Климатическая техника", 720000, 1090000, 80],
  ["Вентилятор Centek CT-5015", "Климатическая техника", 280000, 449000, 160],
];

export const NOMENCLATURE: NomenclatureItem[] = NOMENCLATURE_SEED.map(
  ([name, category, cost, oldRetailPrice, stock], i) => ({
    id: `1C-${String(10001 + i)}`,
    name,
    category,
    cost,
    oldRetailPrice,
    stock,
  })
);

// ── Campaigns ─────────────────────────────────────────────────────────────────

export interface PromoCampaign {
  /** № промо (auto for planned; generated id for unplanned). */
  id: string;
  type: string;
  name: string;
  /** Признак акции: плановая / внеплановая (план/внеплан ONLY). */
  planned: boolean;
  /** Cancellation is a SEPARATE state, not part of «Признак акции». */
  cancelled: boolean;
  startDate: Date;
  endDate: Date;
  status: CampaignStatus;
  /** КМ participating, with their per-KM status. */
  participatingKmIds: string[];
  kmStatuses: Record<string, KmStatus>;
  planStatus?: PlanStatus;
}

export const CAMPAIGNS: PromoCampaign[] = [
  {
    id: "PR-2026-001",
    type: "Скидка",
    name: "Чёрная пятница 2026",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 10, 27),
    endDate: new Date(2026, 10, 30),
    status: "На согласовании у коммерческого директора",
    participatingKmIds: ["km-1", "km-2", "km-3", "km-6"],
    kmStatuses: {
      "km-1": "Принято коммерческим директором",
      "km-2": "На согласовании у коммерческого директора",
      "km-3": "Согласовано старшим КМ (ожидает КД)",
      "km-6": "Не участвует",
    },
    planStatus: "Утверждён",
  },
  {
    id: "PR-2026-002",
    type: "Рассрочка 0-0-12",
    name: "Рассрочка на технику к Новому году",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 11, 15),
    endDate: new Date(2026, 11, 31),
    status: "На согласовании у старшего КМ",
    participatingKmIds: ["km-2", "km-4", "km-5"],
    kmStatuses: {
      "km-2": "На согласовании у старшего КМ",
      "km-4": "Не заполнено / Ожидание корректировки от КМ",
      "km-5": "На согласовании у старшего КМ",
    },
    planStatus: "Утверждён",
  },
  {
    id: "PR-2026-003",
    type: "1+1",
    name: "1+1 на мелкую бытовую технику",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 9, 1),
    endDate: new Date(2026, 9, 14),
    status: "Согласовано и отправлено смежным отделам",
    participatingKmIds: ["km-4"],
    kmStatuses: {
      "km-4": "Принято коммерческим директором",
    },
    planStatus: "Утверждён",
  },
  {
    id: "PR-2026-004",
    type: "Распродажа",
    name: "Распродажа ТВ и аудио",
    planned: true,
    cancelled: true,
    startDate: new Date(2026, 8, 5),
    endDate: new Date(2026, 8, 20),
    status: "Отменена",
    participatingKmIds: ["km-1"],
    kmStatuses: {
      "km-1": "Не участвует",
    },
    planStatus: "Утверждён",
  },
  {
    id: "PR-2026-005",
    type: "Cashback",
    name: "Cashback на смартфоны",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 7, 10),
    endDate: new Date(2026, 7, 24),
    status: "Переотправлено на корректировку КМ",
    participatingKmIds: ["km-3"],
    kmStatuses: {
      "km-3": "Не заполнено / Ожидание корректировки от КМ",
    },
    planStatus: "Утверждён",
  },
  {
    id: "PR-2026-006",
    type: "Скидка",
    name: "Скидки на климатическую технику",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 6, 1),
    endDate: new Date(2026, 6, 15),
    status: "На согласовании у старшего КМ",
    participatingKmIds: ["km-6"],
    kmStatuses: {
      "km-6": "На согласовании у старшего КМ",
    },
    planStatus: "Утверждён",
  },
  {
    // Near-term planned campaign: its «заполнение КМ» deadline (start − 21 кал. дн.)
    // has already passed relative to today, so the short calendar shows an OverdueTag.
    id: "PR-2026-007",
    type: "Рассрочка 0-0-6",
    name: "Летняя рассрочка на смартфоны",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 5, 22),
    endDate: new Date(2026, 6, 5),
    status: "На согласовании у старшего КМ",
    participatingKmIds: ["km-3", "km-5"],
    kmStatuses: {
      "km-3": "Не заполнено / Ожидание корректировки от КМ",
      "km-5": "На согласовании у старшего КМ",
    },
    planStatus: "Утверждён",
  },
  {
    // Unplanned — no № промо in the short calendar; system-generated id.
    id: "UN-2026-014",
    type: "Товар в подарок",
    name: "Подарок к ноутбукам (внеплановая)",
    planned: false,
    cancelled: false,
    startDate: new Date(2026, 6, 20),
    endDate: new Date(2026, 6, 27),
    status: "На согласовании у коммерческого директора",
    participatingKmIds: ["km-5"],
    kmStatuses: {
      "km-5": "На согласовании у коммерческого директора",
    },
  },
  {
    id: "UN-2026-015",
    type: "Скидка",
    name: "Срочная скидка на холодильники (внеплановая)",
    planned: false,
    cancelled: false,
    startDate: new Date(2026, 5, 25),
    endDate: new Date(2026, 5, 30),
    status: "Согласовано и отправлено смежным отделам",
    participatingKmIds: ["km-2"],
    kmStatuses: {
      "km-2": "Принято коммерческим директором",
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getCampaignById(id: string): PromoCampaign | undefined {
  return CAMPAIGNS.find((c) => c.id === id);
}

export function getCategoryManager(id: string): CategoryManager | undefined {
  return CATEGORY_MANAGERS.find((km) => km.id === id);
}

// ── Deadlines (spec §4.4 — all CALENDAR days, tied to a date) ──────────────────

/** «Крайний срок заполнения КМ» = 21 calendar days before the campaign start. */
export function getFillDeadline(campaign: PromoCampaign): Date {
  const d = new Date(campaign.startDate);
  d.setDate(d.getDate() - 21);
  return d;
}

/**
 * Whole calendar days a deadline is overdue relative to `ref` (default: now).
 * 0 (or negative) means not overdue. Never blocks — purely a signal (spec).
 */
export function getOverdueDays(deadline: Date, ref: Date = new Date()): number {
  const ms = ref.getTime() - deadline.getTime();
  if (ms <= 0) return 0;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ── Aggregated indicators (short-calendar row right side — spec §4.6) ──────────

export interface KmAggregate {
  /** «На согл. с КД» — submitted & in the КД pipeline (senior-KM step rolls in here). */
  atKd: number;
  /** «Принято КД». */
  acceptedKd: number;
  /** «Не заполнено / Ожидание корректировки от КМ». */
  notFilled: number;
  /** «Не участвует». */
  notParticipating: number;
}

/**
 * Roll a campaign's per-(Promo+КМ) statuses into the four aggregated indicators.
 * The intermediate senior-КМ step is NOT a separate chip — it rolls into «На согл. с КД»
 * (everything submitted and not yet accepted/declined and not «Не участвует»).
 */
export function aggregateKmStatuses(campaign: PromoCampaign): KmAggregate {
  const agg: KmAggregate = {
    atKd: 0,
    acceptedKd: 0,
    notFilled: 0,
    notParticipating: 0,
  };
  for (const kmId of campaign.participatingKmIds) {
    switch (campaign.kmStatuses[kmId]) {
      case "Принято коммерческим директором":
        agg.acceptedKd++;
        break;
      case "Не заполнено / Ожидание корректировки от КМ":
        agg.notFilled++;
        break;
      case "Не участвует":
        agg.notParticipating++;
        break;
      case "На согласовании у старшего КМ":
      case "Согласовано старшим КМ (ожидает КД)":
      case "На согласовании у коммерческого директора":
        agg.atKd++;
        break;
    }
  }
  return agg;
}

// ── Full promo calendar: lines (S2 — spec §6, §8) ──────────────────────────────
// One PromoLine = one nomenclature line within a campaign, owned by one КМ.
// All 38 Appendix-C fields are derived from these seeds (computed installment
// columns via the helpers below; identity/calendar fields from the campaign).

export interface WarehouseStock {
  warehouse: string;
  qty: number;
}

export interface PromoLine {
  id: string;
  campaignId: string;
  /** Owner КМ — gates editing (КМ edits own lines only). */
  kmId: string;
  nomenclatureId: string;
  /** Остаток — seeded from 1С, editable by КМ (field 9). */
  stock: number;
  /** ✏️ true when the остаток was overridden manually (autoupdate stopped). */
  stockManual: boolean;
  /** Новая цена (розничная), field 12. */
  newPrice: number;
  /** Скидка, % от полной оплаты, field 13. */
  discountPct: number;
  /** Регулярные продажи, field 14 (optional). */
  regularSales?: number;
  /** Прогноз продаж, field 15 — REQUIRED (blocks send for approval if empty). */
  salesForecast?: number;
  /** Скидка, % за Cash, field 31. */
  cashDiscountPct?: number;
  /** 12-мес «старый» ежемесячный платёж, field 19 (manual base; rest computed). */
  oldMonthly12?: number;
  /** Gift fields — only for типы «1+1» / «Товар в подарок» (fields 32–33). */
  giftNomenclatureId?: string;
  giftStock?: number;
  /** Компенсация от поставщика / лимит (fields 34–35). */
  supplierCompensation?: number;
  compensationLimit?: number;
  /** УТП, field 36 (optional). */
  utp?: string;
  /** «В рекламу (рекомендация КМ)» / «(выбрано маркетингом)» (fields 37–38). */
  advRecommendedKm: boolean;
  advSelectedMarketing: boolean;
  /** Row-level review feedback (shared with S3): rejected line + reviewer comment. */
  rejected?: boolean;
  rejectComment?: string;
  /** Duplicate marker — same nomenclature already in this/overlapping promo (§8.2.1). */
  duplicate?: boolean;
  /** Detail behind the «дубль» marker — which promo / overlap period (§8.2.1). */
  duplicateInfo?: DuplicateHit;
  /** Line history (§8.2.1: dup additions etc.). Light in-memory model; the full
   *  VersionHistoryDrawer integration is S4. */
  history?: LineHistoryEntry[];
  /** 1С availability — saved as draft awaiting a 1С re-check (§8.3). */
  pending1CCheck?: boolean;
}

/** A single line-history record (§8.2.1 stores {what, which promo, overlap, user, date/time}). */
export interface LineHistoryEntry {
  /** RU label of what happened (e.g. «Добавлен дубль номенклатуры»). */
  what: string;
  /** Conflicting promo, when the entry relates to a duplicate. */
  promoId?: string;
  promoName?: string;
  /** Overlapping-period text, when the conflict came from a period overlap. */
  overlap?: string;
  /** Actor — role label in the mock (no per-person identity yet). */
  user: string;
  /** ISO timestamp. */
  at: string;
}

// Compact seed — newPrice / discount derived from the nomenclature's old retail price.
type LineSeed = {
  id: string;
  campaignId: string;
  kmId: string;
  nomenclatureId: string;
  /** Discount fraction off the old retail price (drives newPrice + discountPct). */
  off: number;
  forecast?: number;
  regular?: number;
  cash?: number;
  stockManual?: boolean;
  rejected?: boolean;
  rejectComment?: string;
  duplicate?: boolean;
  pending1CCheck?: boolean;
  gift?: string;
  utp?: string;
  advKm?: boolean;
  advMkt?: boolean;
  supplierCompensation?: number;
  compensationLimit?: number;
};

const LINE_SEED: LineSeed[] = [
  // PR-2026-001 «Чёрная пятница 2026» (Скидка) — km-1, km-2, km-3, km-6
  { id: "L-0001", campaignId: "PR-2026-001", kmId: "km-1", nomenclatureId: "1C-10001", off: 0.15, forecast: 120, regular: 35, cash: 5, advKm: true, advMkt: true },
  { id: "L-0002", campaignId: "PR-2026-001", kmId: "km-1", nomenclatureId: "1C-10003", off: 0.18, forecast: 200, regular: 80, advKm: true, duplicate: true },
  { id: "L-0003", campaignId: "PR-2026-001", kmId: "km-2", nomenclatureId: "1C-10006", off: 0.12, forecast: 60, regular: 18, cash: 3 },
  // missing forecast → invalid until filled (red required marker)
  { id: "L-0004", campaignId: "PR-2026-001", kmId: "km-3", nomenclatureId: "1C-10011", off: 0.1, regular: 90, advKm: true },
  { id: "L-0005", campaignId: "PR-2026-001", kmId: "km-6", nomenclatureId: "1C-10026", off: 0.2, forecast: 150, rejected: true, rejectComment: "Скидка ниже минимальной маржи по категории — пересчитайте новую цену." },

  // PR-2026-002 «Рассрочка на технику к Новому году» (Рассрочка 0-0-12) — km-2, km-4, km-5
  { id: "L-0006", campaignId: "PR-2026-002", kmId: "km-5", nomenclatureId: "1C-10021", off: 0.08, forecast: 40, pending1CCheck: true },
  { id: "L-0007", campaignId: "PR-2026-002", kmId: "km-4", nomenclatureId: "1C-10016", off: 0.14, forecast: 25, stockManual: true },

  // PR-2026-005 «Cashback на смартфоны» (Переотправлено на корректировку) — km-3
  { id: "L-0008", campaignId: "PR-2026-005", kmId: "km-3", nomenclatureId: "1C-10013", off: 0.16, forecast: 300, rejected: true, rejectComment: "Уточните остаток — расходится с данными 1С." },

  // UN-2026-014 «Подарок к ноутбукам (внеплановая)» (Товар в подарок) — km-5
  { id: "L-0009", campaignId: "UN-2026-014", kmId: "km-5", nomenclatureId: "1C-10022", off: 0.05, forecast: 15, gift: "1C-10018", utp: "Мультиварка в подарок к каждому MacBook" },
];

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export const PROMO_LINES: PromoLine[] = LINE_SEED.map((s) => {
  const nom = NOMENCLATURE.find((n) => n.id === s.nomenclatureId);
  const oldPrice = nom?.oldRetailPrice ?? 0;
  const newPrice = roundTo(oldPrice * (1 - s.off), 10_000);
  const discountPct = oldPrice ? Math.round((1 - newPrice / oldPrice) * 100) : 0;
  const giftNom = s.gift ? NOMENCLATURE.find((n) => n.id === s.gift) : undefined;
  return {
    id: s.id,
    campaignId: s.campaignId,
    kmId: s.kmId,
    nomenclatureId: s.nomenclatureId,
    stock: nom?.stock ?? 0,
    stockManual: s.stockManual ?? false,
    newPrice,
    discountPct,
    regularSales: s.regular,
    salesForecast: s.forecast,
    cashDiscountPct: s.cash,
    oldMonthly12: roundTo(oldPrice / 12, 1_000),
    giftNomenclatureId: s.gift,
    giftStock: giftNom ? giftNom.stock : undefined,
    supplierCompensation: s.supplierCompensation,
    compensationLimit: s.compensationLimit,
    utp: s.utp,
    advRecommendedKm: s.advKm ?? false,
    advSelectedMarketing: s.advMkt ?? false,
    rejected: s.rejected,
    rejectComment: s.rejectComment,
    duplicate: s.duplicate,
    pending1CCheck: s.pending1CCheck,
  };
});

export function getNomenclatureItem(id: string): NomenclatureItem | undefined {
  return NOMENCLATURE.find((n) => n.id === id);
}

/** Lines for a campaign, in seed order. */
export function getPromoLines(campaignId: string): PromoLine[] {
  return PROMO_LINES.filter((l) => l.campaignId === campaignId);
}

/** Campaigns that have at least one full-calendar line, in CAMPAIGNS order. */
export function getCampaignsWithLines(): PromoCampaign[] {
  const ids = new Set(PROMO_LINES.map((l) => l.campaignId));
  return CAMPAIGNS.filter((c) => ids.has(c.id));
}

// ── Nomenclature entry (§8.2.1) — new lines + duplicate detection ────────────────

let newLineCounter = 0;

/**
 * Build a fresh line from a 1С nomenclature pick (§8.2.1 — no free-text entry).
 * Остаток/цена are seeded from the 1С item; Прогноз продаж is left empty so the
 * required marker shows and the action-bar invalid count ticks up immediately.
 */
export function createPromoLine(
  campaignId: string,
  kmId: string,
  nomenclatureId: string
): PromoLine {
  const nom = NOMENCLATURE.find((n) => n.id === nomenclatureId);
  const oldPrice = nom?.oldRetailPrice ?? 0;
  newLineCounter += 1;
  return {
    id: `L-new-${newLineCounter}`,
    campaignId,
    kmId,
    nomenclatureId,
    stock: nom?.stock ?? 0,
    stockManual: false,
    newPrice: oldPrice,
    discountPct: 0,
    salesForecast: undefined,
    oldMonthly12: roundTo(oldPrice / 12, 1_000),
    advRecommendedKm: false,
    advSelectedMarketing: false,
  };
}

/** Where a duplicate nomenclature was found (§8.2.1). */
export interface DuplicateHit {
  promoId: string;
  promoName: string;
  /** Overlap period text when the conflict is a different promo with overlapping dates. */
  overlap?: string;
  /** True when the same nomenclature is already in the TARGET promo. */
  samePromo: boolean;
}

function periodsOverlap(a: PromoCampaign, b: PromoCampaign): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("ru-RU");
}

/**
 * Detect whether a nomenclature already participates in this promo, or in another
 * (non-cancelled) promo with an overlapping period (§8.2.1). Returns the first hit
 * or null. Adding is never blocked — the caller confirms and marks «дубль».
 */
export function detectDuplicate(
  nomenclatureId: string,
  targetCampaign: PromoCampaign,
  allLines: PromoLine[],
  campaignsById: Map<string, PromoCampaign>
): DuplicateHit | null {
  // 1) Already in this promo?
  if (
    allLines.some(
      (l) =>
        l.campaignId === targetCampaign.id &&
        l.nomenclatureId === nomenclatureId
    )
  ) {
    return {
      promoId: targetCampaign.id,
      promoName: targetCampaign.name,
      samePromo: true,
    };
  }
  // 2) In another non-cancelled promo with an overlapping period?
  for (const l of allLines) {
    if (l.nomenclatureId !== nomenclatureId) continue;
    if (l.campaignId === targetCampaign.id) continue;
    const other = campaignsById.get(l.campaignId);
    if (!other || other.cancelled) continue;
    if (periodsOverlap(targetCampaign, other)) {
      const from = new Date(
        Math.max(targetCampaign.startDate.getTime(), other.startDate.getTime())
      );
      const to = new Date(
        Math.min(targetCampaign.endDate.getTime(), other.endDate.getTime())
      );
      return {
        promoId: other.id,
        promoName: other.name,
        overlap: `${fmtDate(from)} — ${fmtDate(to)}`,
        samePromo: false,
      };
    }
  }
  return null;
}

/** Whether a campaign's тип bears a gift (requires gift nomenclature fields, §8.8). */
export function isGiftType(typeName: string): boolean {
  return Boolean(PROMO_TYPES.find((t) => t.name === typeName)?.giftType);
}

/** Required-field IDs missing on a line (drives the red marker + send gating, §8.6/§8.8). */
export function missingRequiredFields(
  line: PromoLine,
  campaign: PromoCampaign
): string[] {
  const missing: string[] = [];
  // Прогноз продаж — always required (spec §8.6).
  if (line.salesForecast == null) missing.push("salesForecast");
  // Gift fields — required only for gift типы (spec §8.8).
  if (isGiftType(campaign.type)) {
    if (!line.giftNomenclatureId) missing.push("giftNomenclature");
    if (line.giftStock == null) missing.push("giftStock");
  }
  return missing;
}

/** A line is valid (sendable) when it has no missing required fields. */
export function isLineValid(line: PromoLine, campaign: PromoCampaign): boolean {
  return missingRequiredFields(line, campaign).length === 0;
}

// ── Installment programs (spec §8.5) — monthly payments auto-calculated ─────────
// Simplified illustrative model: equal monthly split with a small per-term markup.
// Exact bank formulas are out of scope for the mock.

/** Program monthly payment for a flat N-month split (0-0-6 / 0-0-12 / 50-0-2). */
export function programMonthly(fullPrice: number, months: number, prepayFraction = 0): number {
  const financed = fullPrice * (1 - prepayFraction);
  return Math.round(financed / months);
}

/** Per-term markup factor applied to the full installment price (12 / 24 / 36 мес). */
const TERM_FACTOR: Record<number, number> = { 12: 1.0, 24: 1.08, 36: 1.16 };

export interface InstallmentTerm {
  months: number;
  /** Ежемесячный платёж по старой цене (field 19/23/27). */
  oldMonthly: number;
  /** Ежемесячный платёж по новой цене (field 20/24/28). */
  newMonthly: number;
  /** Размер скидки за период (field 21/25/29). */
  discount: number;
  /** Полная цена (новая) за период (field 22/26/30). */
  newFullPrice: number;
}

/** Compute the four 12/24/36-month installment fields for a line. */
export function installmentTerm(
  line: PromoLine,
  oldRetailPrice: number,
  months: 12 | 24 | 36
): InstallmentTerm {
  const factor = TERM_FACTOR[months];
  const newFullPrice = roundTo(line.newPrice * factor, 1_000);
  const oldFullPrice = roundTo(oldRetailPrice * factor, 1_000);
  return {
    months,
    oldMonthly: Math.round(oldFullPrice / months),
    newMonthly: Math.round(newFullPrice / months),
    discount: oldFullPrice - newFullPrice,
    newFullPrice,
  };
}

// ── 1С stock breakdown (per-warehouse, read-only — spec §8.2.2) ─────────────────

const WAREHOUSES = [
  "Ташкент — Центральный",
  "Ташкент — Юнусабад",
  "Самарканд",
  "Бухара",
  "Андижан",
];
const WAREHOUSE_WEIGHTS = [0.38, 0.27, 0.16, 0.11, 0.08];

/**
 * Deterministic per-warehouse split of a nomenclature's остаток (sums to total).
 * Source = 1С, read-only; the остаток cell's Popover renders this in S2.
 */
export function getWarehouseBreakdown(nomenclatureId: string): WarehouseStock[] {
  const item = NOMENCLATURE.find((n) => n.id === nomenclatureId);
  if (!item) return [];
  const total = item.stock;
  const seed = parseInt(nomenclatureId.replace(/\D/g, ""), 10) || 0;
  const rows = WAREHOUSES.map((warehouse, i) => {
    // Rotate the weights by the seed so different SKUs split differently.
    const weight = WAREHOUSE_WEIGHTS[(i + seed) % WAREHOUSE_WEIGHTS.length];
    return { warehouse, qty: Math.floor(total * weight) };
  });
  // Assign the rounding remainder to the largest bucket so the split is exact.
  const assigned = rows.reduce((s, r) => s + r.qty, 0);
  if (rows.length) rows[0].qty += total - assigned;
  return rows;
}

// ── Full-calendar access (Appendix D) ──────────────────────────────────────────

export interface FullCalendarAccess {
  /** Whether the role may open the full calendar at all. */
  canView: boolean;
  /** Roles that fill/edit their own lines (КМ, Старший КМ, Администратор). */
  canEditOwnLines: boolean;
  /** Сотрудник маркетинга — may only toggle «В рекламу (выбрано маркетингом)». */
  marketingFlagOnly: boolean;
  /** Short RU description of what this role can do here (for the access banner). */
  note: string;
}

export function getFullCalendarAccess(role: PromoRole): FullCalendarAccess {
  switch (role) {
    case "Категорийный менеджер (КМ)":
    case "Старший КМ":
      return {
        canView: true,
        canEditOwnLines: true,
        marketingFlagOnly: false,
        note: "Заполнение и редактирование только своих строк; направление старшему КМ.",
      };
    case "Администратор":
      return {
        canView: true,
        canEditOwnLines: true,
        marketingFlagOnly: false,
        note: "Технический доступ (полный).",
      };
    case "Коммерческий директор":
      return {
        canView: true,
        canEditOwnLines: false,
        marketingFlagOnly: false,
        note: "Просмотр всех строк, согласование и отклонение версий КМ.",
      };
    case "Операционный директор":
      return {
        canView: true,
        canEditOwnLines: false,
        marketingFlagOnly: false,
        note: "Просмотр после утверждения коммерческим директором.",
      };
    case "Сотрудник маркетинга":
      return {
        canView: true,
        canEditOwnLines: false,
        marketingFlagOnly: true,
        note: "Доступно изменение только поля «В рекламу (выбрано маркетингом)».",
      };
    default:
      // Директор маркетинга, Сотрудник закупа, Сотрудник аналитики — нет доступа.
      return {
        canView: false,
        canEditOwnLines: false,
        marketingFlagOnly: false,
        note: "Нет доступа к полному промо-календарю.",
      };
  }
}

// ── Plan workflow (spec §4.2.6, §4.3.2) ────────────────────────────────────────

/** The multi-level plan approval chain, in order. */
export const PLAN_APPROVAL_CHAIN: PromoRole[] = [
  "Директор маркетинга",
  "Коммерческий директор",
  "Операционный директор",
];

/** Which role must act on a plan in the given plan-level status (undefined = terminal). */
export function actorForPlanStatus(status: PlanStatus): PromoRole | undefined {
  switch (status) {
    case "На ознакомлении":
    case "На обсуждении":
      return "Директор маркетинга";
    case "На согл. с КД":
      return "Коммерческий директор";
    case "На согл. с ОД":
      return "Операционный директор";
    case "Утверждён":
    case "Отклонён":
      return undefined;
  }
}

/**
 * Count of approval items awaiting the given role's action — drives the
 * «Согласование» nav badge. Simplified for the bootstrap.
 */
export function countApprovalsAwaiting(role: PromoRole): number {
  const active = CAMPAIGNS.filter((c) => !c.cancelled);
  switch (role) {
    case "Старший КМ":
      return active.filter((c) => c.status === "На согласовании у старшего КМ").length;
    case "Коммерческий директор":
      return active.filter(
        (c) => c.status === "На согласовании у коммерческого директора"
      ).length;
    case "Операционный директор":
      return active.filter((c) => c.planStatus === "На согл. с ОД").length;
    default:
      return 0;
  }
}
