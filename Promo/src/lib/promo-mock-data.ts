// Global mock dataset for Texnomart Promo. All data is mock — no API yet.
// Later screens (S1–S8) reuse these seeds. Types are co-located here.

import type { PromoRole } from "../app/role-context";

// ── Status taxonomy (Appendix A) ──────────────────────────────────────────────

/** Campaign-level status — auto-computed, read-only (short calendar). */
export type CampaignStatus =
  | "Черновик"
  | "На согласовании у старшего КМ"
  | "На согласовании у коммерческого директора"
  | "Переотправлено на корректировку КМ"
  | "Согласовано и отправлено смежным отделам"
  | "Отменена";

/**
 * KM-level status — per (Promo + КМ). Client feedback §5:
 * - «Принято коммерческим директором» → «Согласовано КД».
 * - «Согласовано старшим КМ (ожидает КД)» removed — senior-КМ approval auto-flips
 *   straight to «На согласовании у коммерческого директора».
 * - «Не заполнено / Ожидание корректировки от КМ» split into «Не заполнено» (never
 *   filled) and «Переотправлено на корректировку КМ» (returned by senior КМ or КД).
 * - «Отменена» added — auto-set for every КМ when the whole campaign is cancelled.
 */
export type KmStatus =
  | "Не заполнено"
  | "На согласовании у старшего КМ"
  | "На согласовании у коммерческого директора"
  | "Переотправлено на корректировку КМ"
  | "Согласовано КД"
  | "Не участвует"
  | "Отменена";

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
  /**
   * «Подарок на выбор» (feedback §8) — the gift is chosen from several options, each
   * shown on its own sub-row with the main nomenclature merged across them.
   */
  giftChoice?: boolean;
}

export const PROMO_TYPES: PromoTypeRef[] = [
  { id: "discount", name: "Скидка" },
  { id: "installment-0-0-12", name: "Рассрочка 0-0-12" },
  { id: "installment-0-0-6", name: "Рассрочка 0-0-6" },
  { id: "one-plus-one", name: "1+1", giftType: true },
  { id: "gift", name: "Товар в подарок", giftType: true },
  { id: "gift-choice", name: "Подарок на выбор", giftType: true, giftChoice: true },
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

/** E-3/§7 audit access: a plain КМ sees only this representative КМ's rows (no per-person identity in the mock). */
export const OWN_AUDIT_KM_ID = "km-3";

export interface NomenclatureItem {
  /** 1С code. */
  id: string;
  name: string;
  category: string;
  /** Бренд — подтягивается из 1С по номенклатуре, не редактируется (feedback §6). */
  brand: string;
  /** Себестоимость (1С, locked). */
  cost: number;
  /** Розничная цена (старая), KM-only, locked. */
  oldRetailPrice: number;
  /** Остаток (1С, editable by КМ). */
  stock: number;
}

// ~30 SKUs across the КМ categories, generated deterministically (no randomness).
// Tuple: [name, category, brand, cost, oldRetailPrice, stock]. Brand comes from 1С
// (feedback §6) — stored explicitly because the brand isn't always the first word
// of the name (e.g. «Saund-бар Samsung …»).
const NOMENCLATURE_SEED: Array<[string, string, string, number, number, number]> = [
  ["Samsung QLED 55\" QE55Q60D", "Телевизоры и аудио", "Samsung", 6200000, 8990000, 42],
  ["LG OLED 48\" OLED48C4", "Телевизоры и аудио", "LG", 8100000, 11490000, 18],
  ["Saund-бар Samsung HW-B650", "Телевизоры и аудио", "Samsung", 2100000, 3290000, 60],
  ["Artel ТВ 43\" 43H3401", "Телевизоры и аудио", "Artel", 1900000, 2790000, 75],
  ["Xiaomi TV A2 50\"", "Телевизоры и аудио", "Xiaomi", 3100000, 4490000, 33],
  ["Холодильник Artel HD 455", "Холодильники и крупная БТ", "Artel", 3900000, 5690000, 28],
  ["Samsung RB37 No Frost", "Холодильники и крупная БТ", "Samsung", 5600000, 7990000, 15],
  ["LG GC-B247 Side-by-Side", "Холодильники и крупная БТ", "LG", 9800000, 13990000, 9],
  ["Стиральная машина Bosch WGG", "Холодильники и крупная БТ", "Bosch", 4700000, 6790000, 21],
  ["Посудомоечная Midea MFD45", "Холодильники и крупная БТ", "Midea", 3300000, 4790000, 17],
  ["iPhone 15 128GB", "Смартфоны и гаджеты", "Apple", 9900000, 12990000, 40],
  ["Samsung Galaxy S24 256GB", "Смартфоны и гаджеты", "Samsung", 9100000, 11990000, 35],
  ["Xiaomi Redmi Note 13 Pro", "Смартфоны и гаджеты", "Xiaomi", 2600000, 3590000, 88],
  ["Realme 12 Pro 8/256", "Смартфоны и гаджеты", "Realme", 2900000, 3990000, 52],
  ["Наушники Apple AirPods Pro 2", "Смартфоны и гаджеты", "Apple", 2300000, 3290000, 64],
  ["Пылесос Dyson V12", "Мелкая бытовая техника", "Dyson", 4200000, 5990000, 12],
  ["Кофемашина De'Longhi Magnifica", "Мелкая бытовая техника", "De'Longhi", 3600000, 5290000, 14],
  ["Мультиварка Redmond RMC", "Мелкая бытовая техника", "Redmond", 620000, 990000, 130],
  ["Утюг Philips Azur", "Мелкая бытовая техника", "Philips", 480000, 749000, 110],
  ["Блендер Bosch ErgoMixx", "Мелкая бытовая техника", "Bosch", 390000, 599000, 95],
  ["Ноутбук ASUS Vivobook 15", "Ноутбуки и ПК", "ASUS", 5400000, 7490000, 22],
  ["MacBook Air M3 13\"", "Ноутбуки и ПК", "Apple", 13200000, 16990000, 7],
  ["Lenovo IdeaPad Slim 3", "Ноутбуки и ПК", "Lenovo", 4100000, 5790000, 30],
  ["Монитор Samsung 27\" T35F", "Ноутбуки и ПК", "Samsung", 1600000, 2390000, 44],
  ["ПК HP Pavilion Desktop", "Ноутбуки и ПК", "HP", 6800000, 9290000, 11],
  ["Кондиционер Artel 12000 BTU", "Климатическая техника", "Artel", 2700000, 3890000, 48],
  ["Кондиционер Gree Bora 09", "Климатическая техника", "Gree", 3100000, 4490000, 26],
  ["Обогреватель Ballu BIH", "Климатическая техника", "Ballu", 540000, 849000, 140],
  ["Увлажнитель Xiaomi Smart", "Климатическая техника", "Xiaomi", 720000, 1090000, 80],
  ["Вентилятор Centek CT-5015", "Климатическая техника", "Centek", 280000, 449000, 160],
];

export const NOMENCLATURE: NomenclatureItem[] = NOMENCLATURE_SEED.map(
  ([name, category, brand, cost, oldRetailPrice, stock], i) => ({
    id: `1C-${String(10001 + i)}`,
    name,
    category,
    brand,
    cost,
    oldRetailPrice,
    stock,
  })
);

// ── Campaigns ─────────────────────────────────────────────────────────────────

/**
 * One row of the «Распределение по категориям» block (client feedback §2): a single
 * category participating in the campaign on a specific day, with the КМ responsible
 * for it. The category label is its OWN structured field (not derived from the КМ's
 * home category) so the block can be filtered, exported and analysed independently.
 * Several entries may share a date — they render as stacked sub-rows without
 * repeating the day. The block is optional («используется не во всех акциях», §2).
 */
export interface CategoryDistributionEntry {
  /** День участия категории — дата внутри периода акции. */
  date: Date;
  /** Категория. */
  category: string;
  /** Ответственный КМ по категории. */
  responsibleKmId: string;
}

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
  /**
   * «Распределение по категориям» (feedback §2) — which categories participate on
   * which days and the responsible КМ. Collapsed by default in the short calendar;
   * present only for some campaigns (the block «используется не во всех акциях»).
   */
  categoryDistribution?: CategoryDistributionEntry[];
  planStatus?: PlanStatus;
  /**
   * Unplanned campaigns (§10): тип is editable only until the FIRST send for
   * approval. Flips true on submit and locks the тип/период editing affordance.
   */
  firstSendDone?: boolean;
  /**
   * Period changed AFTER approval (§11.5) — the grid renders the period in bold
   * with a ✏️ pencil. Set when an approved campaign's dates are edited; cleared
   * once the change is sent to departments (re-baselined).
   */
  periodChanged?: boolean;
  /** Cancellation metadata (§5.3) — required reason + actor + timestamp. */
  cancelReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  /**
   * Approved override of the «заполнение КМ» deadline (§4.7). When set, it wins
   * over the derived `getFillDeadline`. Applied only after senior-leadership approval.
   */
  fillDeadlineOverride?: Date;
  /** Pending/approved deadline-change request (§4.7). */
  deadlineChange?: DeadlineChangeRequest;
}

/**
 * A deadline-change request (§4.7 «Изменение дедлайнов»). КД initiates with a
 * required reason; it takes effect only after senior-leadership approval (here:
 * Операционный директор). The full request is logged for the audit trail.
 */
export interface DeadlineChangeRequest {
  /** Role label of the initiator (КД in the mock). */
  initiator: string;
  reason: string;
  /** Old «заполнение КМ» deadline at request time. */
  oldDeadline: Date;
  /** Proposed new deadline. */
  newDeadline: Date;
  requestedAt: string;
  status: "pending" | "approved";
  /** Approver (Операционный директор) — set once approved. */
  approvedBy?: string;
  approvedAt?: string;
}

/**
 * Short «№ промо» display (client feedback §6b): «26-N» — the 2-digit year suffix +
 * the sequence number with leading zeros stripped. Used in the SHORT calendar only
 * (table, detail, export); the full calendar keeps the raw PR-/UN- id.
 *   PR-2026-001 → «26-1»   PR-2026-007 → «26-7»   UN-2026-015 → «26-15»
 * Falls back to the raw id if it doesn't match the expected `XX-YYYY-NNN` shape.
 */
export function formatPromoNo(id: string): string {
  const m = /^[A-Za-z]+-(\d{4})-(\d+)$/.exec(id);
  if (!m) return id;
  return `${m[1].slice(2)}-${Number(m[2])}`;
}

// Review-stage КМ statuses — a clickable cell on these opens the approval workspace;
// everything else (final / data-entry) opens the campaign in the full calendar (§10).
const KM_STATUS_REVIEW_STAGE: KmStatus[] = [
  "На согласовании у старшего КМ",
  "На согласовании у коммерческого директора",
  "Переотправлено на корректировку КМ",
];

/**
 * Deep-link target for a clickable КМ-status cell in the short calendar (§10).
 * Review-stage statuses → the approval queue pre-filtered to the (promo, КМ);
 * final / data-entry statuses → the campaign in the full calendar.
 */
export function kmStatusDeepLink(
  campaignId: string,
  kmId: string,
  status: KmStatus
): string {
  if (KM_STATUS_REVIEW_STAGE.includes(status)) {
    const params = new URLSearchParams({ promo: campaignId, km: kmId });
    return `/approvals?${params.toString()}`;
  }
  return `/full-calendar?promo=${encodeURIComponent(campaignId)}`;
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
      "km-1": "Согласовано КД",
      "km-2": "На согласовании у коммерческого директора",
      "km-3": "На согласовании у коммерческого директора",
      "km-6": "Не участвует",
    },
    categoryDistribution: [
      { date: new Date(2026, 10, 27), category: "Телевизоры и аудио", responsibleKmId: "km-1" },
      { date: new Date(2026, 10, 27), category: "Холодильники и крупная БТ", responsibleKmId: "km-2" },
      { date: new Date(2026, 10, 28), category: "Смартфоны и гаджеты", responsibleKmId: "km-3" },
      { date: new Date(2026, 10, 30), category: "Климатическая техника", responsibleKmId: "km-6" },
    ],
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
      "km-4": "Не заполнено",
      "km-5": "На согласовании у старшего КМ",
    },
    categoryDistribution: [
      { date: new Date(2026, 11, 15), category: "Холодильники и крупная БТ", responsibleKmId: "km-2" },
      { date: new Date(2026, 11, 15), category: "Ноутбуки и ПК", responsibleKmId: "km-5" },
      { date: new Date(2026, 11, 20), category: "Мелкая бытовая техника", responsibleKmId: "km-4" },
    ],
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
      "km-4": "Согласовано КД",
    },
    categoryDistribution: [
      { date: new Date(2026, 9, 1), category: "Мелкая бытовая техника", responsibleKmId: "km-4" },
    ],
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
      // §5: a full campaign cancellation sets every КМ to «Отменена».
      "km-1": "Отменена",
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
      "km-3": "Переотправлено на корректировку КМ",
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
    // 7-я часть §1.3: the on-time-sent example — report first sent 30.05, i.e.
    // BEFORE the report deadline (start − 17 = 05.06), so the short calendar
    // shows the green «Отправлено ✓» plashka (versions seeded below).
    id: "PR-2026-007",
    type: "Рассрочка 0-0-6",
    name: "Летняя рассрочка на смартфоны",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 5, 22),
    endDate: new Date(2026, 6, 5),
    status: "Согласовано и отправлено смежным отделам",
    participatingKmIds: ["km-3", "km-5"],
    kmStatuses: {
      "km-3": "Согласовано КД",
      "km-5": "Согласовано КД",
    },
    categoryDistribution: [
      { date: new Date(2026, 5, 22), category: "Смартфоны и гаджеты", responsibleKmId: "km-3" },
      { date: new Date(2026, 6, 1), category: "Ноутбуки и ПК", responsibleKmId: "km-5" },
    ],
    planStatus: "Утверждён",
  },
  // ── Additional planned campaigns (mock) ───────────────────────────────────
  // Extend the short promo-calendar to 15 visible rows. All planned & non-cancelled
  // (so they appear in the short calendar) but WITHOUT seed PROMO_LINES — by design
  // they stay out of the full calendar (getCampaignsWithLines) and the reports
  // (getSentCampaigns), and render «—» plan stages. Their per-КМ statuses span the
  // full taxonomy so the readiness bar + «Статус КМ по акции» filter show variety.
  {
    id: "PR-2026-008",
    type: "Скидка",
    name: "Скидки на телевизоры к плей-офф",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 8, 10),
    endDate: new Date(2026, 8, 20),
    status: "На согласовании у коммерческого директора",
    participatingKmIds: ["km-1", "km-5"],
    kmStatuses: {
      "km-1": "Согласовано КД",
      "km-5": "На согласовании у коммерческого директора",
    },
    categoryDistribution: [
      { date: new Date(2026, 8, 10), category: "Телевизоры и аудио", responsibleKmId: "km-1" },
      { date: new Date(2026, 8, 12), category: "Ноутбуки и ПК", responsibleKmId: "km-5" },
    ],
    planStatus: "Утверждён",
  },
  {
    id: "PR-2026-009",
    type: "Рассрочка 0-0-12",
    name: "Рассрочка на крупную бытовую технику",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 9, 5),
    endDate: new Date(2026, 9, 25),
    status: "На согласовании у старшего КМ",
    participatingKmIds: ["km-2", "km-6"],
    kmStatuses: {
      "km-2": "На согласовании у старшего КМ",
      "km-6": "Не заполнено",
    },
    categoryDistribution: [
      { date: new Date(2026, 9, 5), category: "Холодильники и крупная БТ", responsibleKmId: "km-2" },
      { date: new Date(2026, 9, 7), category: "Климатическая техника", responsibleKmId: "km-6" },
    ],
    planStatus: "Утверждён",
  },
  {
    id: "PR-2026-010",
    type: "Cashback",
    name: "Кэшбэк на смартфоны и гаджеты",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 7, 12),
    endDate: new Date(2026, 7, 26),
    status: "Переотправлено на корректировку КМ",
    participatingKmIds: ["km-3"],
    kmStatuses: {
      "km-3": "Переотправлено на корректировку КМ",
    },
    planStatus: "Утверждён",
  },
  {
    id: "PR-2026-011",
    type: "1+1",
    name: "1+1 на аксессуары и гаджеты",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 10, 1),
    endDate: new Date(2026, 10, 10),
    status: "На согласовании у коммерческого директора",
    participatingKmIds: ["km-3", "km-4"],
    kmStatuses: {
      "km-3": "Согласовано КД",
      "km-4": "На согласовании у коммерческого директора",
    },
    planStatus: "Утверждён",
  },
  {
    id: "PR-2026-012",
    type: "Товар в подарок",
    name: "Подарок к покупке холодильника",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 6, 1),
    endDate: new Date(2026, 6, 14),
    status: "На согласовании у старшего КМ",
    participatingKmIds: ["km-1", "km-2"],
    kmStatuses: {
      "km-1": "На согласовании у старшего КМ",
      "km-2": "На согласовании у старшего КМ",
    },
    categoryDistribution: [
      { date: new Date(2026, 6, 1), category: "Холодильники и крупная БТ", responsibleKmId: "km-2" },
      { date: new Date(2026, 6, 1), category: "Телевизоры и аудио", responsibleKmId: "km-1" },
    ],
    planStatus: "Утверждён",
  },
  {
    id: "PR-2026-013",
    type: "Рассрочка 0-0-6",
    name: "Рассрочка на ноутбуки к учёбе",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 7, 1),
    endDate: new Date(2026, 7, 20),
    status: "На согласовании у коммерческого директора",
    participatingKmIds: ["km-5"],
    kmStatuses: {
      "km-5": "На согласовании у коммерческого директора",
    },
    categoryDistribution: [
      { date: new Date(2026, 7, 1), category: "Ноутбуки и ПК", responsibleKmId: "km-5" },
    ],
    planStatus: "Утверждён",
  },
  {
    // §8 demo: «Подарок на выбор» — a fresh (Черновик) campaign so add/remove of
    // choice gifts + the merged main-nomenclature sub-rows are demoable end-to-end.
    id: "PR-2026-014",
    type: "Подарок на выбор",
    name: "Подарок на выбор к телевизорам",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 8, 1),
    endDate: new Date(2026, 8, 15),
    status: "Черновик",
    participatingKmIds: ["km-1"],
    kmStatuses: {
      "km-1": "Не заполнено",
    },
    planStatus: "Утверждён",
  },
  {
    id: "PR-2026-015",
    type: "Скидка",
    name: "Скидки на технику для дома",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 11, 1),
    endDate: new Date(2026, 11, 14),
    status: "На согласовании у коммерческого директора",
    participatingKmIds: ["km-4", "km-2"],
    kmStatuses: {
      "km-4": "Согласовано КД",
      "km-2": "На согласовании у коммерческого директора",
    },
    categoryDistribution: [
      { date: new Date(2026, 11, 1), category: "Мелкая бытовая техника", responsibleKmId: "km-4" },
      { date: new Date(2026, 11, 3), category: "Холодильники и крупная БТ", responsibleKmId: "km-2" },
    ],
    planStatus: "Утверждён",
  },
  {
    id: "PR-2026-016",
    type: "Рассрочка 0-0-12",
    name: "Новогодняя рассрочка на всё",
    planned: true,
    cancelled: false,
    startDate: new Date(2026, 11, 20),
    endDate: new Date(2026, 11, 31),
    status: "На согласовании у старшего КМ",
    participatingKmIds: ["km-1", "km-2", "km-3", "km-5"],
    kmStatuses: {
      "km-1": "На согласовании у старшего КМ",
      "km-2": "Не заполнено",
      "km-3": "Не участвует",
      "km-5": "На согласовании у старшего КМ",
    },
    categoryDistribution: [
      { date: new Date(2026, 11, 20), category: "Телевизоры и аудио", responsibleKmId: "km-1" },
      { date: new Date(2026, 11, 20), category: "Холодильники и крупная БТ", responsibleKmId: "km-2" },
      { date: new Date(2026, 11, 22), category: "Ноутбуки и ПК", responsibleKmId: "km-5" },
    ],
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
      "km-2": "Согласовано КД",
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

// ── Unplanned campaign creation (spec §10) ─────────────────────────────────────
// «Создать внеплановую акцию»: created directly in the full calendar with NO № промо
// chosen by the user — the system generates an id; признак auto = «Внеплановая»;
// тип editable only until the first send for approval; срок подачи ≥ 3 кал. дн. до
// старта. Also «встроить в существующую плановую акцию» (keeps признак «Плановая»).

/** Срок подачи внеплановой акции — не менее 3 КАЛЕНДАРНЫХ дней до старта (§10). */
export const MIN_UNPLANNED_LEAD_DAYS = 3;

/** Add N calendar days to a date (pure — returns a new Date). */
export function addCalendarDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Earliest start an unplanned campaign created on `ref` may have (today + 3 кал. дн.). */
export function minUnplannedStartDate(ref: Date = new Date()): Date {
  const d = addCalendarDays(ref, MIN_UNPLANNED_LEAD_DAYS);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface UnplannedCampaignInput {
  type: string;
  name: string;
  startDate: Date;
  endDate: Date;
  /** Owner КМ — the mock attaches the campaign to a single creating КМ. */
  kmId: string;
}

/** Per-field validation for the create-unplanned form (§10). */
export interface UnplannedValidation {
  ok: boolean;
  errors: { name?: string; startDate?: string; endDate?: string };
}

export function validateUnplannedInput(
  input: { name: string; startDate: Date | null; endDate: Date | null },
  ref: Date = new Date()
): UnplannedValidation {
  const errors: UnplannedValidation["errors"] = {};
  if (!input.name.trim()) errors.name = "Укажите название акции.";
  const minStart = minUnplannedStartDate(ref);
  if (!input.startDate || Number.isNaN(input.startDate.getTime())) {
    errors.startDate = "Укажите дату начала.";
  } else if (input.startDate < minStart) {
    errors.startDate = `Срок подачи — не менее ${MIN_UNPLANNED_LEAD_DAYS} календарных дней до старта (не ранее ${minStart.toLocaleDateString("ru-RU")}).`;
  }
  if (!input.endDate || Number.isNaN(input.endDate.getTime())) {
    errors.endDate = "Укажите дату окончания.";
  } else if (input.startDate && input.endDate < input.startDate) {
    errors.endDate = "Дата окончания не может быть раньше даты начала.";
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

let unplannedCounter = 0;

/**
 * Build an unplanned campaign (§10). The user does NOT pick a № промо — the system
 * generates an id (UN-2026-1xx). признак = «Внеплановая» (planned:false), status
 * starts «Черновик», and `firstSendDone` is false so the тип stays editable until
 * the first send. The creating КМ is the sole participant (mock single-creator).
 */
export function createUnplannedCampaign(input: UnplannedCampaignInput): PromoCampaign {
  unplannedCounter += 1;
  return {
    id: `UN-2026-${100 + unplannedCounter}`,
    type: input.type,
    name: input.name.trim(),
    planned: false,
    cancelled: false,
    startDate: input.startDate,
    endDate: input.endDate,
    status: "Черновик",
    participatingKmIds: [input.kmId],
    kmStatuses: { [input.kmId]: "Не заполнено" },
    firstSendDone: false,
  };
}

// ── Deadlines (spec §4.4 — all CALENDAR days, tied to a date) ──────────────────

/** «Крайний срок заполнения КМ» = 21 calendar days before the campaign start. */
export function getFillDeadline(campaign: PromoCampaign): Date {
  const d = new Date(campaign.startDate);
  d.setDate(d.getDate() - 21);
  return d;
}

/**
 * Effective «заполнение КМ» deadline (§4.7): an APPROVED override wins over the
 * derived `getFillDeadline`. A pending change has NOT taken effect yet, so it does
 * not move the effective deadline until senior leadership approves it.
 */
export function effectiveFillDeadline(campaign: PromoCampaign): Date {
  return campaign.fillDeadlineOverride ?? getFillDeadline(campaign);
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
  /** «На согл. у ст. КМ» — submitted, awaiting Старший КМ (yellow segment §3). */
  atSeniorKm: number;
  /** «На согл. у КД» — awaiting Коммерческий директор (orange segment §3). */
  atKd: number;
  /** «Согласовано КД». */
  acceptedKd: number;
  /** «На корр. / Не заполнено» — «Не заполнено» + «Переотправлено на корректировку КМ». */
  notFilled: number;
  /** «Не участвует». */
  notParticipating: number;
  /** «Отменена» — campaign fully cancelled (not shown in the §3 bar). */
  cancelled: number;
}

/**
 * Roll a campaign's per-(Promo+КМ) statuses into the aggregated indicators (§3).
 * Client feedback splits «на согласовании» into two buckets: ст. КМ (yellow) and КД
 * (orange). «Не заполнено» and «Переотправлено на корректировку КМ» both fold into
 * the red «На корр. / Не заполнено» bucket.
 */
export function aggregateKmStatuses(campaign: PromoCampaign): KmAggregate {
  const agg: KmAggregate = {
    atSeniorKm: 0,
    atKd: 0,
    acceptedKd: 0,
    notFilled: 0,
    notParticipating: 0,
    cancelled: 0,
  };
  for (const kmId of campaign.participatingKmIds) {
    switch (campaign.kmStatuses[kmId]) {
      case "Согласовано КД":
        agg.acceptedKd++;
        break;
      case "Не заполнено":
      case "Переотправлено на корректировку КМ":
        agg.notFilled++;
        break;
      case "Не участвует":
        agg.notParticipating++;
        break;
      case "На согласовании у старшего КМ":
        agg.atSeniorKm++;
        break;
      case "На согласовании у коммерческого директора":
        agg.atKd++;
        break;
      case "Отменена":
        agg.cancelled++;
        break;
    }
  }
  return agg;
}

// ── Readiness «X из Y КМ согласовано» (client feedback §6 / §7) ────────────────

export interface CampaignReadiness {
  /** Согласовали (= «Согласовано КД») — числитель «N из M». */
  done: number;
  /**
   * Знаменатель: участвующие КМ МИНУС «Не участвует» И МИНУС «Отменена» (§3/§5 —
   * эти статусы не учитываются в общем количестве для расчёта готовности).
   */
  total: number;
  /** Зелёный сегмент — «Согласовано КД» (= done). */
  accepted: number;
  /** Оранжевый сегмент — «На согл. у КД». */
  atKd: number;
  /** Жёлтый сегмент — «На согл. у ст. КМ». */
  atSeniorKm: number;
  /** Красный сегмент — «На корр. / Не заполнено». */
  notFilled: number;
  /** Серый сегмент — «Не участвует» (показывается в плашке, вне знаменателя). */
  notParticipating: number;
}

/**
 * Roll a campaign's per-КМ statuses into the readiness model used by the «Статус
 * готовности акции» column (§3). Reuses {@link aggregateKmStatuses}; the denominator
 * excludes «Не участвует» and «Отменена» (e.g. 15 КМ − 2 не участвует → из 13).
 */
export function campaignReadiness(campaign: PromoCampaign): CampaignReadiness {
  const agg = aggregateKmStatuses(campaign);
  return {
    done: agg.acceptedKd,
    total:
      campaign.participatingKmIds.length - agg.notParticipating - agg.cancelled,
    accepted: agg.acceptedKd,
    atKd: agg.atKd,
    atSeniorKm: agg.atSeniorKm,
    notFilled: agg.notFilled,
    notParticipating: agg.notParticipating,
  };
}

// ── Full promo calendar: lines (S2 — spec §6, §8) ──────────────────────────────
// One PromoLine = one nomenclature line within a campaign, owned by one КМ.
// All 38 Appendix-C fields are derived from these seeds (computed installment
// columns via the helpers below; identity/calendar fields from the campaign).

export interface WarehouseStock {
  warehouse: string;
  qty: number;
}

/**
 * One gift attached to a line (feedback §8). The nomenclature is picked from the 1С
 * reference; «Остаток» and «Наличие в магазинах, %» are derived from 1С by that
 * nomenclature (see getNomenclatureItem / getStoreAvailability), so they aren't stored.
 */
export interface GiftItem {
  nomenclatureId: string;
}

/**
 * An unapproved repeat action on an already-approved line (10-я часть, Блоки 2/4):
 * the main table keeps showing the last APPROVED values; the new values live only here
 * + in the «Детали изменений» side panel until re-approval. `rejected` set → the repeat
 * action was declined → status «Отклонённые изменения» + red КМ indicator.
 */
export interface LinePendingChange {
  action: "change" | "addition";
  /** For action==="change": per-field diff vs the approved value (panel «Поле/Было/Стало»). */
  fields?: { field: keyof PromoLine; label: string; was: string; now: string }[];
  /** Role label (no per-person identity in the mock). */
  by: string;
  /** ISO date the repeat action was sent for approval. */
  at: string;
  comment?: string;
  /** «Тип запроса» shown in the panel, e.g. «Изменение цен и прогноза» / «Добавлена номенклатура». */
  requestType: string;
  /** Set when the repeat action was rejected (→ «Отклонённые изменения» + КМ indicator). */
  rejected?: { by: string; at: string; reason: string };
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
  /**
   * Подарки (feedback §8) — only for gift типы. «Товар в подарок» / «1+1»: up to 2
   * fixed gifts (Подарок №1 / №2). «Подарок на выбор»: a list of options, each shown
   * on its own sub-row. Per-gift «Остаток» / «Наличие в магазинах» are loaded from 1С
   * by the gift nomenclature (same logic as the main nomenclature). КМ picks the
   * nomenclature from the 1С reference; the numbers are read-only.
   */
  gifts?: GiftItem[];
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
  /**
   * Line cancellation / removal (§5.3) — DISTINCT from the S3 reviewer `rejected`
   * flag. КМ requests removal (→ `removalPending`), КД re-approves it (→ `removed`).
   * A removed line is «Исключена из акции / Отменена»: kept for history/reports
   * with a marker, hidden by the «Скрыть отменённое» filter when ON.
   */
  removalPending?: boolean;
  removed?: boolean;
  /** Required reason for the removal request (§5.3). */
  removalReason?: string;
  /** Actor who requested removal — role label (no per-person identity in the mock). */
  removalRequestedBy?: string;
  /** Unapproved repeat action (10-я часть, Блоки 2/4) — table still shows approved data. */
  pending?: LinePendingChange;
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
  removalPending?: boolean;
  removed?: boolean;
  removalReason?: string;
  /** Unapproved repeat action (10-я часть) — see LinePendingChange. */
  pending?: LinePendingChange;
  /** Single gift nomenclature id (fixed «Подарок (1)»). */
  gift?: string;
  /** Multiple gift nomenclature ids — fixed №1/№2 or «подарок на выбор» options (§8). */
  gifts?: string[];
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

  // PR-2026-003 «1+1 на мелкую бытовую технику» (1+1, gift type) — km-4.
  // Already «Согласовано и отправлено смежным отделам», so edits here are tracked
  // as edit-after-approval corrections (§5.1) — the values match Phase-1 версии.
  // Enriched (УТП / компенсация / advMkt) so the S5 department reports (M/P/A
  // field subsets) render populated cells rather than «—».
  { id: "L-0015", campaignId: "PR-2026-003", kmId: "km-4", nomenclatureId: "1C-10017", off: 0.16, forecast: 40, regular: 14, gifts: ["1C-10018", "1C-10019"], utp: "Гарантия 3 года", advKm: true, advMkt: true, supplierCompensation: 400000, compensationLimit: 50 },
  { id: "L-0016", campaignId: "PR-2026-003", kmId: "km-4", nomenclatureId: "1C-10016", off: 0.14, forecast: 25, gift: "1C-10018", advKm: true, supplierCompensation: 250000, compensationLimit: 30 },

  // PR-2026-005 «Cashback на смартфоны» (Переотправлено на корректировку) — km-3
  { id: "L-0008", campaignId: "PR-2026-005", kmId: "km-3", nomenclatureId: "1C-10013", off: 0.16, forecast: 300, rejected: true, rejectComment: "Уточните остаток — расходится с данными 1С." },

  // UN-2026-014 «Подарок к ноутбукам (внеплановая)» (Товар в подарок) — km-5
  { id: "L-0009", campaignId: "UN-2026-014", kmId: "km-5", nomenclatureId: "1C-10022", off: 0.05, forecast: 15, gift: "1C-10018", utp: "Мультиварка в подарок к каждому MacBook" },

  // PR-2026-014 «Подарок на выбор к телевизорам» (§8, giftChoice) — km-1, Черновик.
  // One line with several choice gifts → the gift column shows one gift per sub-row
  // and the main nomenclature is merged across them.
  { id: "L-0030", campaignId: "PR-2026-014", kmId: "km-1", nomenclatureId: "1C-10001", off: 0.12, forecast: 30, gifts: ["1C-10003", "1C-10015", "1C-10018", "1C-10019"], utp: "Подарок на выбор к каждому телевизору", advKm: true },

  // Review-queue coverage (S3): a line set for every (Promo + КМ) pair that is
  // pending a reviewer, so the согласование snapshot is never empty.
  // PR-2026-002 km-2 (at Старший КМ) — Холодильники.
  { id: "L-0010", campaignId: "PR-2026-002", kmId: "km-2", nomenclatureId: "1C-10007", off: 0.1, forecast: 30, regular: 12 },
  { id: "L-0011", campaignId: "PR-2026-002", kmId: "km-2", nomenclatureId: "1C-10010", off: 0.13, forecast: 18 },
  // PR-2026-006 km-6 (at Старший КМ) — Климатическая; L-0013 missing forecast → red required marker.
  { id: "L-0012", campaignId: "PR-2026-006", kmId: "km-6", nomenclatureId: "1C-10027", off: 0.15, forecast: 55, advKm: true },
  { id: "L-0013", campaignId: "PR-2026-006", kmId: "km-6", nomenclatureId: "1C-10029", off: 0.2 },
  // PR-2026-007 km-5 (sent on time, 7-я часть §1.3) — Ноутбуки.
  { id: "L-0014", campaignId: "PR-2026-007", kmId: "km-5", nomenclatureId: "1C-10023", off: 0.07, forecast: 40 },

  // S4 Phase 3 — cancellation demos.
  // PR-2026-004 «Распродажа ТВ и аудио» is a CANCELLED campaign (status «Отменена»):
  // seed it with lines so the «Скрыть отменённое» switch visibly hides/shows it.
  { id: "L-0017", campaignId: "PR-2026-004", kmId: "km-1", nomenclatureId: "1C-10001", off: 0.22, forecast: 80 },
  { id: "L-0018", campaignId: "PR-2026-004", kmId: "km-1", nomenclatureId: "1C-10004", off: 0.25, forecast: 110 },
  // UN-2026-015 «Срочная скидка на холодильники» is APPROVED («…отправлено смежным
  // отделам»): one normal line + one already-approved removal (removed) so the
  // "Исключено" report plashka is demoable on load (see REPORT_CHANGE_SETS).
  { id: "L-0019", campaignId: "UN-2026-015", kmId: "km-2", nomenclatureId: "1C-10008", off: 0.11, forecast: 22, utp: "Бесплатная доставка и установка", advKm: true, advMkt: true, supplierCompensation: 300000, compensationLimit: 40 },
  { id: "L-0020", campaignId: "UN-2026-015", kmId: "km-2", nomenclatureId: "1C-10009", off: 0.09, forecast: 30, removalPending: true, removalReason: "Снят с продаж поставщиком — исключить из акции.", supplierCompensation: 200000, compensationLimit: 25 },
  // Added in the latest report version (S5 «добавленные данные» demo — see REPORT_CHANGE_SETS).
  { id: "L-0021", campaignId: "UN-2026-015", kmId: "km-2", nomenclatureId: "1C-10007", off: 0.13, forecast: 18, utp: "Подарочная упаковка", supplierCompensation: 350000, compensationLimit: 35 },
];

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export const PROMO_LINES: PromoLine[] = LINE_SEED.map((s) => {
  const nom = NOMENCLATURE.find((n) => n.id === s.nomenclatureId);
  const oldPrice = nom?.oldRetailPrice ?? 0;
  const newPrice = roundTo(oldPrice * (1 - s.off), 10_000);
  const discountPct = oldPrice ? Math.round((1 - newPrice / oldPrice) * 100) : 0;
  const giftIds = s.gifts ?? (s.gift ? [s.gift] : undefined);
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
    gifts: giftIds?.map((id) => ({ nomenclatureId: id })),
    supplierCompensation: s.supplierCompensation,
    compensationLimit: s.compensationLimit,
    utp: s.utp,
    advRecommendedKm: s.advKm ?? false,
    advSelectedMarketing: s.advMkt ?? false,
    rejected: s.rejected,
    rejectComment: s.rejectComment,
    duplicate: s.duplicate,
    pending1CCheck: s.pending1CCheck,
    removalPending: s.removalPending,
    removed: s.removed,
    removalReason: s.removalReason,
    removalRequestedBy: s.removalPending || s.removed ? "Категорийный менеджер (КМ)" : undefined,
    pending: s.pending,
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

// ── Excel/CSV bulk import (§8.2.1) — template + per-row validation ────────────────
// Pragmatic mock: semicolon-delimited CSV (Excel-RU friendly), parsed client-side
// with no extra dependency. The per-row validation UX matches the spec; a true .xlsx
// parser is out of scope for the prototype.

/** Import template columns, in order. */
export const IMPORT_COLUMNS = [
  "Код 1С",
  "Прогноз продаж",
  "Новая цена",
  "Скидка %",
] as const;

const IMPORT_DELIM = ";";

/** Downloadable CSV template (header + one example row). */
export function buildImportTemplateCsv(): string {
  const header = IMPORT_COLUMNS.join(IMPORT_DELIM);
  const example = ["1C-10001", "120", "7640000", "15"].join(IMPORT_DELIM);
  return `${header}\n${example}\n`;
}

/** Sample CSV with a mix of valid / invalid rows for quick testing. */
export function buildImportSampleCsv(): string {
  return (
    [
      IMPORT_COLUMNS.join(IMPORT_DELIM),
      ["1C-10002", "60", "9900000", "12"].join(IMPORT_DELIM), // ok
      ["1C-99999", "40", "5000000", "10"].join(IMPORT_DELIM), // нет в 1С
      ["1C-10005", "", "3800000", "8"].join(IMPORT_DELIM), // нет прогноза
      ["1C-10009", "90", "6200000", "9"].join(IMPORT_DELIM), // ok
    ].join("\n") + "\n"
  );
}

export type ImportRowStatus = "ok" | "duplicate" | "error";

export interface ParsedImportRow {
  /** 1-based source row number (excluding the header). */
  row: number;
  nomenclatureId: string;
  salesForecast?: number;
  newPrice?: number;
  discountPct?: number;
  status: ImportRowStatus;
  /** RU reason shown in the preview for error / duplicate rows. */
  reason?: string;
  /** Resolved name when the code exists in 1С. */
  name?: string;
  /** Carried to the created line when the row is a duplicate. */
  duplicateInfo?: DuplicateHit;
}

export interface ImportParseResult {
  rows: ParsedImportRow[];
  /** Whole-file structure error (bad header) — blocks the entire import. */
  structureError?: string;
}

function parseImportNum(s: string | undefined): number | undefined {
  if (s == null) return undefined;
  const digits = s.replace(/[^\d]/g, "");
  return digits ? Number(digits) : undefined;
}

/**
 * Parse + validate a semicolon-CSV against the 1С reference and a target campaign
 * (§8.2.1). Pure — drives the import preview. «нет в 1С» / missing required field /
 * bad structure are errors; a duplicate is a non-blocking warning (imported with the
 * «дубль» marker).
 */
export function parseImportCsv(
  text: string,
  targetCampaign: PromoCampaign,
  liveLines: PromoLine[],
  campaignsById: Map<string, PromoCampaign>
): ImportParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { rows: [], structureError: "Файл пуст." };

  const header = lines[0].split(IMPORT_DELIM).map((h) => h.trim());
  const headerOk =
    header.length === IMPORT_COLUMNS.length &&
    IMPORT_COLUMNS.every((c, i) => header[i]?.toLowerCase() === c.toLowerCase());
  if (!headerOk) {
    return {
      rows: [],
      structureError: `Нарушена структура шаблона. Ожидаются столбцы: ${IMPORT_COLUMNS.join(", ")}.`,
    };
  }

  const rows: ParsedImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(IMPORT_DELIM).map((c) => c.trim());
    const row = i;
    if (cells.length !== IMPORT_COLUMNS.length) {
      rows.push({
        row,
        nomenclatureId: cells[0] ?? "",
        status: "error",
        reason: "Нарушена структура строки (неверное число столбцов).",
      });
      continue;
    }
    const [code, forecastS, priceS, discS] = cells;
    const salesForecast = parseImportNum(forecastS);
    const newPrice = parseImportNum(priceS);
    const discountPct = parseImportNum(discS);
    const nom = NOMENCLATURE.find((n) => n.id === code);

    if (!nom) {
      rows.push({
        row,
        nomenclatureId: code,
        salesForecast,
        newPrice,
        discountPct,
        status: "error",
        reason: "Нет в 1С / неверная номенклатура.",
      });
      continue;
    }
    if (salesForecast == null) {
      rows.push({
        row,
        nomenclatureId: code,
        name: nom.name,
        salesForecast,
        newPrice,
        discountPct,
        status: "error",
        reason: "Не заполнены обязательные поля (Прогноз продаж).",
      });
      continue;
    }
    const dup = detectDuplicate(code, targetCampaign, liveLines, campaignsById);
    rows.push({
      row,
      nomenclatureId: code,
      name: nom.name,
      salesForecast,
      newPrice,
      discountPct,
      status: dup ? "duplicate" : "ok",
      duplicateInfo: dup ?? undefined,
      reason: dup
        ? dup.samePromo
          ? "Дубль: уже в этой акции (импортируется с отметкой «дубль»)."
          : `Дубль: уже в акции ${formatPromoNo(dup.promoId)} (импортируется с отметкой «дубль»).`
        : undefined,
    });
  }
  return { rows };
}

/** Build a draft line from a validated import row — awaits a 1С re-check (§8.3). */
export function createImportedLine(
  campaignId: string,
  kmId: string,
  row: ParsedImportRow
): PromoLine {
  const line = createPromoLine(campaignId, kmId, row.nomenclatureId);
  if (row.salesForecast != null) line.salesForecast = row.salesForecast;
  if (row.newPrice != null) line.newPrice = row.newPrice;
  if (row.discountPct != null) line.discountPct = row.discountPct;
  // Imported data is saved as a draft awaiting 1С availability re-check (§8.3).
  line.pending1CCheck = true;
  if (row.duplicateInfo) {
    line.duplicate = true;
    line.duplicateInfo = row.duplicateInfo;
  }
  return line;
}

/** Whether a campaign's тип bears a gift (requires gift nomenclature fields, §8.8). */
export function isGiftType(typeName: string): boolean {
  return Boolean(PROMO_TYPES.find((t) => t.name === typeName)?.giftType);
}

/** Whether a campaign's тип is «Подарок на выбор» (multi-gift sub-rows, feedback §8). */
export function isGiftChoiceType(typeName: string): boolean {
  return Boolean(PROMO_TYPES.find((t) => t.name === typeName)?.giftChoice);
}

/** Required-field IDs missing on a line (drives the red marker + send gating, §8.6/§8.8). */
export function missingRequiredFields(
  line: PromoLine,
  campaign: PromoCampaign
): string[] {
  const missing: string[] = [];
  // Прогноз продаж — always required (spec §8.6).
  if (line.salesForecast == null) missing.push("salesForecast");
  // Gift fields — required only for gift типы (§8.8 / feedback §8): at least the
  // first gift's nomenclature must be chosen (остаток/наличие are derived from 1С).
  if (isGiftType(campaign.type)) {
    if (!line.gifts || line.gifts.length === 0 || !line.gifts[0].nomenclatureId)
      missing.push("gift1Nomenclature");
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

// ── Наличие в магазинах (feedback §5) ───────────────────────────────────────────
// % покрытия номенклатуры по АКТИВНЫМ магазинам (торговым точкам). Формула:
//   Наличие, % = (кол-во активных магазинов, где остаток > 0) / (всего активных
//                магазинов) × 100%.
// Учитываются только торговые точки из справочника активных магазинов; остатки по
// центральным складам (в т.ч. «Ташкент — Центральный») в расчёт НЕ включаются.
// Остаток 0 / пустой / отрицательный = отсутствие товара в магазине.

/** Всего активных магазинов (торговых точек) в справочнике. */
export const ACTIVE_STORE_COUNT = 39;

/** Центральные склады — исключаются из расчёта «Наличие в магазинах» (§5). */
export const CENTRAL_WAREHOUSES = ["Ташкент — Центральный"];

export interface StoreAvailability {
  /** Всего активных магазинов. */
  activeStores: number;
  /** Магазины, где остаток товара > 0. */
  inStock: number;
  /** Процент покрытия (0–100). */
  pct: number;
}

/**
 * Наличие товара по активным магазинам (§5) — рассчитывается «из 1С», read-only.
 * Детерминированный mock: число магазинов «в наличии» выводится из остатка и id
 * (без рандома), так что разные SKU дают разное покрытие в реалистичном диапазоне.
 * Остаток ≤ 0 → 0 магазинов (товара нет ни в одной точке).
 */
export function getStoreAvailability(nomenclatureId: string): StoreAvailability {
  const item = NOMENCLATURE.find((n) => n.id === nomenclatureId);
  if (!item || item.stock <= 0) {
    return { activeStores: ACTIVE_STORE_COUNT, inStock: 0, pct: 0 };
  }
  const seed = parseInt(nomenclatureId.replace(/\D/g, ""), 10) || 0;
  // 0..11 магазинов без товара — покрытие в диапазоне ~72–100% (как в примере ТЗ).
  const missing = (seed * 7 + item.stock) % 12;
  const inStock = Math.max(0, ACTIVE_STORE_COUNT - missing);
  const pct = (inStock / ACTIVE_STORE_COUNT) * 100;
  return { activeStores: ACTIVE_STORE_COUNT, inStock, pct };
}

/** Формат «94,87%» (2 знака, запятая — ru), как заполняют в гугл-таблице (§5). */
export function formatAvailabilityPct(pct: number): string {
  return `${pct.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
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

// ── Per-campaign plan approval (client feedback §5) ────────────────────────────
// In «План акций» the approval progress is shown SEPARATELY per campaign across the
// three directors. Timing rules (§5): the marketing director sends the plan for
// review 63 КАЛЕНДАРНЫХ days before the promo start and for approval 60 КАЛЕНДАРНЫХ
// days before; the commercial & operational directors then have 3 РАБОЧИХ days each
// from receipt. Each stage shows when it was sent / decided, whether it is «В срок»
// or «Просрочка +N дн.», or «Ожидает этапа» when not yet reached. The seed mirrors
// the client's example screen.

export const PLAN_MARKETING_REVIEW_LEAD_DAYS = 63; // календарные
export const PLAN_MARKETING_SUBMIT_LEAD_DAYS = 60; // календарные
export const PLAN_DIRECTOR_SLA_WORKING_DAYS = 3; // рабочие

export type PlanStageStatus = "onTime" | "overdue" | "waiting";

/** Marketing-director stage: ознакомление (Озн.) + отправка на согласование (Отпр.). */
export interface PlanStageMarketing {
  reviewedAt: Date;
  sentAt: Date;
  status: Exclude<PlanStageStatus, "waiting">;
  /** Дней просрочки when status === "overdue". */
  overdueDays?: number;
}

/** КД / ОД stage: a single согласование decision, or «Ожидает этапа» (waiting). */
export interface PlanStageDirector {
  /** Дата согласования; undefined — этап ещё не достигнут. */
  decidedAt?: Date;
  status: PlanStageStatus;
  overdueDays?: number;
}

export interface CampaignPlanApproval {
  campaignId: string;
  marketing: PlanStageMarketing;
  kd: PlanStageDirector;
  od: PlanStageDirector;
  /** Optional §11.9 correction chain — emitted as informational control points when present. */
  returnedAt?: Date;
  returnedBy?: string;
  returnComment?: string;
  resentAt?: Date;
  deliveredToKmAt?: Date;
}

export const PLAN_APPROVALS: CampaignPlanApproval[] = [
  {
    campaignId: "PR-2026-001",
    marketing: {
      reviewedAt: new Date(2026, 7, 24, 11, 10),
      sentAt: new Date(2026, 7, 27, 9, 30),
      status: "onTime",
    },
    kd: { decidedAt: new Date(2026, 8, 30, 10, 15), status: "onTime" },
    od: { decidedAt: new Date(2026, 9, 2, 10, 40), status: "onTime" },
  },
  {
    campaignId: "PR-2026-002",
    marketing: {
      reviewedAt: new Date(2026, 9, 12, 14, 25),
      sentAt: new Date(2026, 9, 14, 10, 0),
      status: "onTime",
    },
    kd: { decidedAt: new Date(2026, 9, 17, 11, 5), status: "onTime" },
    od: { decidedAt: new Date(2026, 9, 23, 9, 20), status: "overdue", overdueDays: 1 },
  },
  {
    campaignId: "PR-2026-003",
    marketing: {
      reviewedAt: new Date(2026, 6, 26, 16, 40),
      sentAt: new Date(2026, 6, 30, 9, 15),
      status: "onTime",
    },
    kd: { decidedAt: new Date(2026, 7, 3, 14, 10), status: "onTime" },
    od: { decidedAt: new Date(2026, 7, 6, 11, 30), status: "onTime" },
  },
  {
    campaignId: "PR-2026-005",
    marketing: {
      reviewedAt: new Date(2026, 4, 29, 10, 5),
      sentAt: new Date(2026, 5, 1, 9, 20),
      status: "onTime",
    },
    kd: { decidedAt: new Date(2026, 5, 5, 18, 45), status: "overdue", overdueDays: 3 },
    od: { decidedAt: new Date(2026, 5, 9, 10, 30), status: "onTime" },
  },
  {
    campaignId: "PR-2026-006",
    marketing: {
      reviewedAt: new Date(2026, 3, 20, 15, 20),
      sentAt: new Date(2026, 4, 4, 8, 45),
      status: "overdue",
      overdueDays: 1,
    },
    kd: { decidedAt: new Date(2026, 4, 7, 10, 0), status: "onTime" },
    od: { status: "waiting" },
    returnedAt: new Date(2026, 4, 5, 12, 30),
    returnedBy: "Коммерческий директор",
    returnComment: "План возвращён на корректировку: уточнить перечень категорий.",
    resentAt: new Date(2026, 4, 6, 9, 15),
    deliveredToKmAt: new Date(2026, 4, 8, 11, 0),
  },
  {
    campaignId: "PR-2026-007",
    marketing: {
      reviewedAt: new Date(2026, 5, 1, 12, 10),
      sentAt: new Date(2026, 5, 2, 9, 40),
      status: "onTime",
    },
    kd: { decidedAt: new Date(2026, 5, 5, 10, 20), status: "onTime" },
    od: { decidedAt: new Date(2026, 5, 10, 16, 30), status: "overdue", overdueDays: 1 },
  },
];

export function getPlanApproval(campaignId: string): CampaignPlanApproval | undefined {
  return PLAN_APPROVALS.find((p) => p.campaignId === campaignId);
}

/**
 * Whether a planned campaign's plan has been approved by ALL responsible directors —
 * Коммерческий + Операционный (client feedback №5). In the mock, the per-campaign
 * plan-approval record (`PLAN_APPROVALS`) is the signal: both director stages must be
 * decided (a `decidedAt` / non-«waiting» status); a cancelled campaign never qualifies.
 * Used to gate what the Категорийный менеджер sees in the short calendar — the КМ must
 * see the plan only AFTER it is fully approved (before that: «Найдено 0 акций»).
 */
export function isPlanApprovedByDirectors(campaign: PromoCampaign): boolean {
  if (campaign.cancelled) return false;
  const appr = getPlanApproval(campaign.id);
  if (!appr) return false;
  return appr.kd.status !== "waiting" && appr.od.status !== "waiting";
}

/**
 * Next plan-row promo number, generated automatically in sequence (client feedback
 * «6-я часть» №1 — the number must be auto-assigned, not typed by hand). Ids follow
 * the `PR-2026-0NN` shape; we take the max existing NN and return the next, zero-padded.
 */
export function nextPlanPromoNo(existingIds: string[]): string {
  let max = 0;
  for (const id of existingIds) {
    const m = /^PR-2026-(\d+)$/.exec(id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `PR-2026-${String(max + 1).padStart(3, "0")}`;
}

/** An uncovered stretch of calendar days between two promo periods. */
export interface CoverageGap {
  start: Date;
  end: Date;
  days: number;
}

/** Local-midnight copy of a date (strips the time so day math is exact). */
function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Coverage gaps within the min→max span of the given promo periods (client feedback
 * «6-я часть» №7 — when a plan is sent «на месяц» but some dates are left uncovered, a
 * hint should list them). Pure date math: merge the periods, then report every run of
 * ≥1 calendar day that no promo covers between the earliest start and the latest end.
 */
export function findCoverageGaps(
  periods: { start: Date; end: Date }[]
): CoverageGap[] {
  const valid = periods
    .filter((p) => p.start && p.end && p.start <= p.end)
    .map((p) => ({ start: atMidnight(p.start), end: atMidnight(p.end) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  if (valid.length < 2) return [];

  const gaps: CoverageGap[] = [];
  let coveredUntil = valid[0].end;
  for (let i = 1; i < valid.length; i++) {
    const { start, end } = valid[i];
    // A gap exists only when the next period starts more than one day after the
    // furthest day covered so far (adjacent/overlapping periods leave no gap).
    const gapStartMs = coveredUntil.getTime() + DAY_MS;
    if (start.getTime() > gapStartMs) {
      const gapStart = new Date(gapStartMs);
      const gapEnd = new Date(start.getTime() - DAY_MS);
      const days = Math.round((gapEnd.getTime() - gapStart.getTime()) / DAY_MS) + 1;
      gaps.push({ start: gapStart, end: gapEnd, days });
    }
    if (end > coveredUntil) coveredUntil = end;
  }
  return gaps;
}

/**
 * Count of approval items awaiting the given role's action — drives the
 * «Согласование» nav badge. Simplified for the bootstrap.
 */
export function countApprovalsAwaiting(role: PromoRole): number {
  // Per-(Promo + КМ) review items awaiting this role's action (S3 queue).
  return reviewQueueFor(role, buildReviewItems()).length;
}

// ── S3 — Согласование и проверка (review workspace) ─────────────────────────────

/** SLA window for a reviewer to act (spec §4.5.2) — РАБОЧИЕ дни (Пн–Пт). */
export const REVIEW_SLA_WORKING_DAYS = 2;

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/** Add (or subtract, if negative) N working days, skipping Sat/Sun. */
export function addWorkingDays(start: Date, days: number): Date {
  const d = new Date(start);
  const step = days >= 0 ? 1 : -1;
  let remaining = Math.abs(days);
  while (remaining > 0) {
    d.setDate(d.getDate() + step);
    if (!isWeekend(d)) remaining -= 1;
  }
  return d;
}

/** Count of working days in the half-open interval (from, to]. 0 if to ≤ from. */
export function workingDaysBetween(from: Date, to: Date): number {
  if (to <= from) return 0;
  let count = 0;
  const d = new Date(from);
  while (d < to) {
    d.setDate(d.getDate() + 1);
    if (!isWeekend(d)) count += 1;
  }
  return count;
}

export interface ReviewSla {
  /** Deadline = submittedAt + REVIEW_SLA_WORKING_DAYS working days. */
  deadline: Date;
  /** Working days still left (negative once past the deadline). */
  remaining: number;
  /** Working days the item is past its deadline (0 while in-time). */
  overdue: number;
}

export function reviewSla(submittedAt: Date, ref: Date = new Date()): ReviewSla {
  const deadline = addWorkingDays(submittedAt, REVIEW_SLA_WORKING_DAYS);
  if (ref <= deadline) {
    return { deadline, remaining: workingDaysBetween(ref, deadline), overdue: 0 };
  }
  return { deadline, remaining: -workingDaysBetween(deadline, ref), overdue: workingDaysBetween(deadline, ref) };
}

/** A review item is either the КМ's filled data set, or a «Не участвует» request. */
export type ReviewKind = "data" | "non-participation";

/**
 * A review comment — author + role + timestamp, scoped either to specific lines
 * (lineIds) or to the whole set (general). Persisted on the item; surfaced in the
 * line tooltip and the version history (spec §4.5.2, §4.7).
 */
export interface ReviewComment {
  /** Acting role label (no per-person identity in the mock). */
  author: PromoRole;
  /** ISO timestamp. */
  at: string;
  text: string;
  /** Lines the comment is attached to; empty/undefined = general comment. */
  lineIds?: string[];
}

/**
 * One review item = a (Promo + КМ) pair. Statuses are computed per (Promo + КМ)
 * (spec §4.5). The current KM-level status drives which reviewer it's queued for.
 */
export interface ReviewItem {
  /** `${campaignId}~${kmId}`. */
  id: string;
  campaignId: string;
  kmId: string;
  kind: ReviewKind;
  /** Current KM-level status — the single source of truth for routing. */
  kmStatus: KmStatus;
  /** When the КМ sent the set / non-participation request for review (ISO). */
  submittedAt: string;
  /**
   * When the item entered the КД stage (ISO) — set on a live Старший-КМ approval so
   * the КД SLA counts separately from that moment (§9). Undefined for a seed that
   * starts at the КД stage (its `submittedAt` is used) or an auto-escalated item
   * (its КД SLA counts from the Старший-КМ deadline).
   */
  kdStageStartedAt?: string;
  /** Auto-forwarded to КД after the Старший КМ SLA lapsed (spec §4.5.2). */
  escalatedToKD: boolean;
  /** Required reason when kind === "non-participation". */
  nonParticipationReason?: string;
  /** Whether «Не участвует» was set directly by КД (КМ cannot override). */
  nonParticipationByKd?: boolean;
  /** Reviewer comments (rejections etc.), newest last. */
  comments: ReviewComment[];
  /** Per-line reviewer feedback (rejection + comment), keyed by line id. */
  lineFeedback: Record<string, LineFeedback>;
}

/** A reviewer's decision on a single submitted line. */
export interface LineFeedback {
  rejected: boolean;
  comment?: string;
  /** ISO timestamp of the decision. */
  at: string;
  /** Acting reviewer role. */
  by: PromoRole;
}

/**
 * KM-level status a set lands in once the given reviewer approves it (spec §4.5.2).
 * Client feedback §5: Старший КМ approval auto-flips straight to «На согласовании у
 * коммерческого директора» (no intermediate «Согласовано старшим КМ» resting state).
 * For a «Не участвует» request, КД approval finalises the КМ as «Не участвует».
 */
export function approvedKmStatusFor(
  actor: PromoRole,
  kind: ReviewKind = "data"
): KmStatus {
  if (actor === "Старший КМ") return "На согласовании у коммерческого директора";
  return kind === "non-participation" ? "Не участвует" : "Согласовано КД";
}

/**
 * Rejecting ANY line returns the WHOLE КМ set here (spec §4.5.2). §5: «Переотправлено
 * на корректировку КМ» applies regardless of who returned it (Старший КМ or КД).
 */
export const REJECTED_KM_STATUS: KmStatus = "Переотправлено на корректировку КМ";

export function reviewItemId(campaignId: string, kmId: string): string {
  return `${campaignId}~${kmId}`;
}

/** Which reviewer must act on a KM-level status (undefined = not in any queue). */
export function reviewerForKmStatus(status: KmStatus): PromoRole | undefined {
  switch (status) {
    case "На согласовании у старшего КМ":
      return "Старший КМ";
    case "На согласовании у коммерческого директора":
      return "Коммерческий директор";
    default:
      // «Согласовано КД», «Не заполнено», «Переотправлено…», «Не участвует»,
      // «Отменена» — terminal here (not awaiting a reviewer).
      return undefined;
  }
}

/**
 * Seed offsets (in working days, relative to "now") for submittedAt, so that at
 * today's date the queue shows in-time, breached-Старший-КМ (auto-escalation),
 * and overdue-КД (просрочка) items without time travel. Default = 1 working day.
 */
const REVIEW_SUBMIT_OFFSET: Record<string, { days: number; escalatedToKD?: boolean; kind?: ReviewKind; reason?: string }> = {
  // PR-2026-002 km-5: at Старший КМ, breached 2-day SLA → eligible for auto-escalation.
  "PR-2026-002~km-5": { days: 3 },
  // PR-2026-002 km-2: at Старший КМ, still in time.
  "PR-2026-002~km-2": { days: 1 },
  // PR-2026-001 km-2: at КД, overdue (просрочка — non-blocking).
  "PR-2026-001~km-2": { days: 4 },
  // PR-2026-001 km-3: forwarded by Старший КМ, awaiting КД, in time.
  "PR-2026-001~km-3": { days: 1, escalatedToKD: false },
  // UN-2026-014 km-5: unplanned, straight to КД, in time.
  "UN-2026-014~km-5": { days: 1 },
  // PR-2026-006 km-6: «Не участвует» request raised by КМ, awaiting Старший КМ.
  "PR-2026-006~km-6": {
    days: 1,
    kind: "non-participation",
    reason: "Поставщик не подтвердил объём — категория не участвует в этой акции.",
  },
  // (PR-2026-007 was seeded here while pending review — now sent on time,
  // 7-я часть §1.3, so it no longer yields review items.)
};

/**
 * Builds the initial review items from the seed campaigns: one item per
 * participating КМ whose KM-level status is a pending-review state (data sets).
 * «Не участвует» lifecycle items are layered in by the provider in a later phase.
 */
export function buildReviewItems(ref: Date = new Date()): ReviewItem[] {
  const items: ReviewItem[] = [];
  for (const c of CAMPAIGNS) {
    if (c.cancelled) continue;
    for (const kmId of c.participatingKmIds) {
      const kmStatus = c.kmStatuses[kmId];
      if (!kmStatus) continue;
      const reviewer = reviewerForKmStatus(kmStatus);
      if (!reviewer) continue; // terminal / not awaiting a reviewer
      const key = reviewItemId(c.id, kmId);
      const seed = REVIEW_SUBMIT_OFFSET[key] ?? { days: 1 };
      items.push({
        id: key,
        campaignId: c.id,
        kmId,
        kind: seed.kind ?? "data",
        kmStatus,
        submittedAt: addWorkingDays(ref, -seed.days).toISOString(),
        escalatedToKD: seed.escalatedToKD ?? false,
        nonParticipationReason: seed.reason,
        comments: [],
        lineFeedback: {},
      });
    }
  }
  return items;
}

/**
 * Auto-escalation (spec §4.5.2): an item still sitting at the Старший КМ once its
 * 2-working-day SLA has lapsed is auto-forwarded to КД. Derived live from the SLA
 * (no timers / persistence) — OR true if the seed already marked it escalated.
 */
export function isAutoEscalated(item: ReviewItem, ref: Date = new Date()): boolean {
  if (item.escalatedToKD) return true;
  if (item.kmStatus !== "На согласовании у старшего КМ") return false;
  return reviewSla(new Date(item.submittedAt), ref).overdue > 0;
}

/**
 * The reviewer who must act on an item RIGHT NOW, accounting for live
 * auto-escalation (a breached Старший-КМ item is acted on by the КД).
 */
export function effectiveReviewer(
  item: ReviewItem,
  ref: Date = new Date()
): PromoRole | undefined {
  if (isAutoEscalated(item, ref)) return "Коммерческий директор";
  return reviewerForKmStatus(item.kmStatus);
}

/** Items awaiting the given reviewer role. КД also picks up auto-escalated items. */
export function reviewQueueFor(
  role: PromoRole,
  items: ReviewItem[],
  ref: Date = new Date()
): ReviewItem[] {
  return items.filter((it) => effectiveReviewer(it, ref) === role);
}

/**
 * Items VISIBLE to a reviewer (4th-round feedback §3): BOTH review stages are shown
 * to Старший КМ and КД (view), while ACTING stays gated by `effectiveReviewer`
 * (`reviewQueueFor` / `canAct`). Старший КМ «sees promo of their КМ at both stages»;
 * КД «sees all promo» — with no per-person КМ identity in the mock both resolve to
 * every item still in a review stage (terminal items drop out). The «Статус
 * согласования» filter then narrows to one stage.
 */
export function visibleReviewQueue(
  items: ReviewItem[],
  ref: Date = new Date()
): ReviewItem[] {
  return items.filter((it) => effectiveReviewer(it, ref) !== undefined);
}

/** Which review stage an item is currently in (auto-escalation aware), for filtering. */
export type ReviewStage = "senior" | "kd";
export function reviewStageOf(
  item: ReviewItem,
  ref: Date = new Date()
): ReviewStage | undefined {
  const reviewer = effectiveReviewer(item, ref);
  if (reviewer === "Старший КМ") return "senior";
  if (reviewer === "Коммерческий директор") return "kd";
  return undefined;
}

/**
 * The moment the CURRENT stage's SLA counts from (§9 — SLA is calculated separately
 * per stage):
 *  • Старший-КМ stage → when the КМ submitted (`submittedAt`).
 *  • КД stage → when the item reached the КД: the AUTO-FORWARD moment (= the
 *    Старший-КМ deadline) for an auto-escalated item; the recorded forward time
 *    (`kdStageStartedAt`) for a live Старший-КМ approval; else `submittedAt` for a
 *    seed that already starts at the КД stage.
 */
export function stageSlaStart(item: ReviewItem, ref: Date = new Date()): Date {
  const submitted = new Date(item.submittedAt);
  if (reviewStageOf(item, ref) === "kd") {
    if (isAutoEscalated(item, ref)) {
      return addWorkingDays(submitted, REVIEW_SLA_WORKING_DAYS);
    }
    if (item.kdStageStartedAt) return new Date(item.kdStageStartedAt);
  }
  return submitted;
}

/** The SLA in force for a review item's CURRENT stage (§9) — use instead of reviewSla(submittedAt). */
export function itemSla(item: ReviewItem, ref: Date = new Date()): ReviewSla {
  return reviewSla(stageSlaStart(item, ref), ref);
}

/**
 * For an auto-escalated item, the Старший-КМ SLA that lapsed before the КД took over
 * (§8/§9) — surfaced in the promo card and the approval history. `autoForwardedAt`
 * is the Старший-КМ deadline (= the moment the КД SLA starts).
 */
export interface SeniorOverdueInfo {
  autoForwardedAt: Date;
  seniorSlaDays: number;
}
export function seniorOverdueInfo(
  item: ReviewItem,
  ref: Date = new Date()
): SeniorOverdueInfo | undefined {
  if (!isAutoEscalated(item, ref)) return undefined;
  return {
    autoForwardedAt: addWorkingDays(new Date(item.submittedAt), REVIEW_SLA_WORKING_DAYS),
    seniorSlaDays: REVIEW_SLA_WORKING_DAYS,
  };
}

/**
 * Status shown in the general list for a review item (§8/§9): an auto-escalated item
 * displays «На согласовании у коммерческого директора» even though its underlying
 * `kmStatus` is still «На согласовании у старшего КМ» (escalation is derived, not a
 * mutation, so routing stays intact). Everything else shows its own `kmStatus`.
 */
export function displayKmStatus(item: ReviewItem, ref: Date = new Date()): KmStatus {
  return isAutoEscalated(item, ref)
    ? "На согласовании у коммерческого директора"
    : item.kmStatus;
}

/** A КМ-level status counts as a FINAL decision (campaign may advance past it). */
export function isFinalKmDecision(status: KmStatus): boolean {
  return (
    status === "Согласовано КД" ||
    status === "Не участвует" ||
    status === "Отменена"
  );
}

export interface CampaignDecisionSummary {
  total: number;
  /** КМ with a final decision («Принято КД» or «Не участвует»). */
  finalised: number;
  /** КМ still awaiting a final decision. */
  pending: number;
  /** All participating КМ have a final decision → the campaign may advance. */
  canAdvance: boolean;
}

/**
 * Advance gate (spec §4.5.1): a campaign can't move to the next level until EVERY
 * participating КМ has a final decision (incl. «Не участвует», itself an approval
 * object). Reads live item statuses where present, else the seed kmStatuses.
 */
export function campaignDecisionSummary(
  campaignId: string,
  items: ReviewItem[]
): CampaignDecisionSummary {
  const c = getCampaignById(campaignId);
  const kmIds = c?.participatingKmIds ?? [];
  let finalised = 0;
  for (const kmId of kmIds) {
    const item = items.find((it) => it.id === reviewItemId(campaignId, kmId));
    const status = item?.kmStatus ?? c?.kmStatuses[kmId];
    if (status && isFinalKmDecision(status)) finalised += 1;
  }
  const total = kmIds.length;
  return {
    total,
    finalised,
    pending: total - finalised,
    canAdvance: total > 0 && finalised === total,
  };
}

/** One КМ participation row for the «Мои участия» panel (КМ self-service view). */
export interface KmParticipation {
  campaignId: string;
  kmId: string;
  kmStatus: KmStatus;
}

/**
 * All non-cancelled campaigns the given КМ participates in, with the КМ-level
 * status (live item status wins over the seed). Drives the КМ «Мои участия» list
 * where they can raise «Не участвует». No per-person identity in the mock — the
 * КМ role sees every participation.
 */
export function participationsForKm(
  kmId: string,
  items: ReviewItem[]
): KmParticipation[] {
  const rows: KmParticipation[] = [];
  for (const c of CAMPAIGNS) {
    if (c.cancelled) continue;
    if (!c.participatingKmIds.includes(kmId)) continue;
    const seed = c.kmStatuses[kmId];
    if (!seed) continue;
    const item = items.find((it) => it.id === reviewItemId(c.id, kmId));
    rows.push({ campaignId: c.id, kmId, kmStatus: item?.kmStatus ?? seed });
  }
  return rows;
}

/** Whether a КМ may still raise «Не участвует» for a participation (not yet final). */
export function canRequestNonParticipation(status: KmStatus): boolean {
  return (
    status !== "Не участвует" &&
    status !== "Согласовано КД" &&
    status !== "Отменена"
  );
}

/**
 * «SLA КМ» (4th-round §10) — whether the КМ sent the promo FOR APPROVAL on time after
 * the campaign was created. This is a DIFFERENT SLA from the reviewer SLA (§4.5); the
 * mock has no real «created vs sent» timestamps, so it is seeded deterministically per
 * (campaign, КМ): «В срок» for a submitted set, «+N раб. дн. просрочено» for the seeded
 * late ones, and «—» while «Не заполнено» (nothing sent yet).
 */
export type KmSubmissionSla =
  | { state: "onTime" }
  | { state: "overdue"; days: number }
  | { state: "none" };

const KM_SUBMISSION_OVERDUE: Record<string, number> = {
  "PR-2026-002~km-5": 2,
};

export function kmSubmissionSla(
  campaignId: string,
  kmId: string,
  status: KmStatus
): KmSubmissionSla {
  if (status === "Не заполнено") return { state: "none" };
  const days = KM_SUBMISSION_OVERDUE[reviewItemId(campaignId, kmId)];
  return days ? { state: "overdue", days } : { state: "onTime" };
}

// ── S4 — Версионирование и изменения (§5.1, §7.1) ──────────────────────────────
// Every saved version forms an immutable report version; previous versions are
// never deleted, and rollback is NOT supported (§5.2.1) — a revert is a new
// correction that re-enters approval. The drawer renders three views over this
// model: «Только изменения» (the diff), «Полный актуальный отчёт» (the current
// snapshot), and «История версий» (the full version list). Mock = in-memory.

/** Change-type chip values (spec §5.1). */
export type VersionChangeType =
  | "Первичная отправка"
  | "Корректировка"
  | "Добавление"
  | "Отмена"
  | "Отправка отчёта";

/** A single changed/added/removed field within a version (drives the diff view). */
export interface VersionFieldChange {
  /** Scope label — the line («Samsung …») or «Кампания» for campaign-level fields. */
  scope: string;
  /** Field label, e.g. «Новая цена». */
  field: string;
  /** Previous value (RU-formatted); undefined for an addition. */
  from?: string;
  /** New value (RU-formatted); undefined for a removal. */
  to?: string;
  kind: "added" | "changed" | "removed";
}

/** One immutable report version of a campaign (§5.1). */
export interface CampaignVersion {
  id: string;
  campaignId: string;
  /** 1-based version number. */
  version: number;
  date: Date;
  /** Actor — role label in the mock (no per-person identity yet). */
  author: string;
  role: string;
  changeType: VersionChangeType;
  /** One-line summary of what the version changed. */
  summary: string;
  /** Per-field diff vs the previous version (empty for «Первичная отправка»). */
  changes: VersionFieldChange[];
}

/** One row of the «Полный актуальный отчёт» snapshot view. */
export interface CampaignReportRow {
  lineId: string;
  nomenclature: string;
  code: string;
  removed?: boolean;
  /** A compact set of the line's key fields (label + RU-formatted value). */
  fields: { label: string; value: string }[];
}

/**
 * Build the «Полный актуальный отчёт» rows from a campaign's current lines —
 * the up-to-date snapshot, derived live so it reflects in-session edits.
 */
export function buildCampaignReport(lines: PromoLine[]): CampaignReportRow[] {
  return lines.map((l) => {
    const nom = getNomenclatureItem(l.nomenclatureId);
    const fields: { label: string; value: string }[] = [
      { label: "Остаток", value: l.stock.toLocaleString("ru-RU") },
      {
        label: "Новая цена",
        value: l.newPrice ? `${l.newPrice.toLocaleString("ru-RU")} сум` : "—",
      },
      {
        label: "Скидка",
        value: l.discountPct != null ? `${l.discountPct}%` : "—",
      },
      {
        label: "Прогноз продаж",
        value:
          l.salesForecast != null
            ? l.salesForecast.toLocaleString("ru-RU")
            : "не заполнено",
      },
    ];
    return {
      lineId: l.id,
      nomenclature: nom?.name ?? l.nomenclatureId,
      code: l.nomenclatureId,
      // «Исключена из акции» (§5.3) or a reviewer rejection both render struck-through.
      removed: l.removed || l.rejected,
      fields,
    };
  });
}

// Seeded version histories. PR-2026-003 («Согласовано и отправлено смежным
// отделам») carries a full chain incl. an «Отправка отчёта»; PR-2026-001 has a
// первичная + корректировка. Every other campaign gets a single «Первичная
// отправка» so the drawer is never empty. Dates are fixed (seed-stable).
const CAMPAIGN_VERSIONS: Record<string, CampaignVersion[]> = {
  "PR-2026-003": [
    {
      id: "PR-2026-003-v4",
      campaignId: "PR-2026-003",
      version: 4,
      date: new Date(2026, 8, 29, 16, 5),
      author: "Система",
      role: "Автоматически",
      changeType: "Отправка отчёта",
      summary: "Сформирована версия отчёта и отправлена смежным отделам.",
      changes: [],
    },
    {
      id: "PR-2026-003-v3",
      campaignId: "PR-2026-003",
      version: 3,
      date: new Date(2026, 8, 29, 11, 40),
      author: "Каримов Шохрух",
      role: "Категорийный менеджер (КМ)",
      changeType: "Корректировка",
      summary: "Изменена новая цена по 2 позициям после согласования.",
      changes: [
        {
          scope: "Кофемашина De'Longhi",
          field: "Новая цена",
          from: "4 990 000 сум",
          to: "4 690 000 сум",
          kind: "changed",
        },
        {
          scope: "Кофемашина De'Longhi",
          field: "Скидка",
          from: "10%",
          to: "16%",
          kind: "changed",
        },
        {
          scope: "Пылесос Dyson V12",
          field: "Новая цена",
          from: "5 200 000 сум",
          to: "4 990 000 сум",
          kind: "changed",
        },
      ],
    },
    {
      id: "PR-2026-003-v2",
      campaignId: "PR-2026-003",
      version: 2,
      date: new Date(2026, 8, 25, 10, 12),
      author: "Каримов Шохрух",
      role: "Категорийный менеджер (КМ)",
      changeType: "Добавление",
      summary: "Добавлена 1 позиция номенклатуры.",
      changes: [
        {
          scope: "Пылесос Dyson V12",
          field: "Позиция",
          to: "добавлена в акцию",
          kind: "added",
        },
      ],
    },
    {
      id: "PR-2026-003-v1",
      campaignId: "PR-2026-003",
      version: 1,
      date: new Date(2026, 8, 22, 17, 48),
      author: "Каримов Шохрух",
      role: "Категорийный менеджер (КМ)",
      changeType: "Первичная отправка",
      summary: "Первичная отправка данных на согласование.",
      changes: [],
    },
  ],
  "PR-2026-001": [
    {
      id: "PR-2026-001-v3",
      campaignId: "PR-2026-001",
      version: 3,
      date: new Date(2026, 10, 24, 14, 32),
      author: "Алиев Бекзод",
      role: "Категорийный менеджер (КМ)",
      changeType: "Корректировка",
      summary: "Изменена новая цена и прогноз по 2 позициям.",
      changes: [
        {
          scope: "Samsung QLED 55\" QE55Q60D",
          field: "Новая цена",
          from: "7 990 000 сум",
          to: "7 640 000 сум",
          kind: "changed",
        },
        {
          scope: "Samsung QLED 55\" QE55Q60D",
          field: "Скидка",
          from: "11%",
          to: "15%",
          kind: "changed",
        },
        {
          scope: "iPhone 15 128GB",
          field: "Прогноз продаж",
          from: "120",
          to: "180",
          kind: "changed",
        },
      ],
    },
    {
      id: "PR-2026-001-v2",
      campaignId: "PR-2026-001",
      version: 2,
      date: new Date(2026, 10, 22, 9, 15),
      author: "Исмаилов Жасур",
      role: "Старший КМ",
      changeType: "Добавление",
      summary: "Добавлена 1 позиция номенклатуры.",
      changes: [
        {
          scope: "Кондиционер Artel 12000 BTU",
          field: "Позиция",
          to: "добавлена в акцию",
          kind: "added",
        },
      ],
    },
    {
      id: "PR-2026-001-v1",
      campaignId: "PR-2026-001",
      version: 1,
      date: new Date(2026, 10, 20, 17, 48),
      author: "Алиев Бекзод",
      role: "Категорийный менеджер (КМ)",
      changeType: "Первичная отправка",
      summary: "Первичная отправка данных на согласование.",
      changes: [],
    },
  ],
  // PR-2026-007 «Летняя рассрочка на смартфоны»: sent ON TIME — 30.05 is before
  // both the КМ-fill deadline (start − 21 = 01.06) and the report deadline
  // (start − 17 = 05.06) → the short calendar's green «Отправлено ✓» example
  // (7-я часть §1.3).
  "PR-2026-007": [
    {
      id: "PR-2026-007-v1",
      campaignId: "PR-2026-007",
      version: 1,
      date: new Date(2026, 4, 30, 16, 20),
      author: "Каримов Шерзод",
      role: "Категорийный менеджер (КМ)",
      changeType: "Первичная отправка",
      summary: "Первичная отправка данных смежным отделам.",
      changes: [],
    },
  ],
  // UN-2026-015 «Срочная скидка на холодильники»: first sent ON TIME (before the
  // 17-кал.-дн. report deadline), then a later incremental correction — drives the
  // S5 «изменённые/добавленные данные» highlight + ознакомление demo (REPORT_CHANGE_SETS).
  "UN-2026-015": [
    {
      id: "UN-2026-015-v2",
      campaignId: "UN-2026-015",
      version: 2,
      date: new Date(2026, 5, 12, 10, 30),
      author: "Юсупова Нигора",
      role: "Категорийный менеджер (КМ)",
      changeType: "Корректировка",
      summary: "Изменена новая цена по 1 позиции и добавлена 1 позиция; отправлено смежным отделам.",
      changes: [
        {
          scope: "LG GC-B247 Side-by-Side",
          field: "Новая цена",
          from: "12 690 000 сум",
          to: "12 450 000 сум",
          kind: "changed",
        },
        {
          scope: "Samsung RB37 No Frost",
          field: "Позиция",
          to: "добавлена в акцию",
          kind: "added",
        },
      ],
    },
    {
      id: "UN-2026-015-v1",
      campaignId: "UN-2026-015",
      version: 1,
      date: new Date(2026, 5, 5, 9, 15),
      author: "Юсупова Нигора",
      role: "Категорийный менеджер (КМ)",
      changeType: "Первичная отправка",
      summary: "Первичная отправка данных смежным отделам.",
      changes: [],
    },
  ],
};

/** Versions for a campaign, newest-first. Unknown campaigns get a single seed. */
export function getCampaignVersions(campaignId: string): CampaignVersion[] {
  const seeded = CAMPAIGN_VERSIONS[campaignId];
  if (seeded) return seeded;
  return [
    {
      id: `${campaignId}-v1`,
      campaignId,
      version: 1,
      date: new Date(2026, 9, 1, 9, 0),
      author: "Категорийный менеджер",
      role: "Категорийный менеджер (КМ)",
      changeType: "Первичная отправка",
      summary: "Первичная отправка данных на согласование.",
      changes: [],
    },
  ];
}

// Per-version report snapshots (§7): the latest version = the live report; seeded
// earlier versions show a few pre-change field values so «История версий» → выбор
// версии renders a visibly different read-only snapshot. Illustrative mock.
const REPORT_SNAPSHOT_OVERRIDES: Record<string, Record<number, Record<string, Record<string, string>>>> = {
  // campaignId → version → lineId → { fieldLabel → old display value }
  "UN-2026-015": {
    1: {
      "L-0019": { "Новая цена": "12 690 000 сум", "Скидка": "9%" },
    },
  },
};

export function getReportSnapshot(
  campaignId: string,
  version: number
): CampaignReportRow[] | undefined {
  const versions = getCampaignVersions(campaignId);
  if (!versions.length) return undefined;
  const base = buildCampaignReport(getPromoLines(campaignId));
  const latest = versions[0].version;
  if (version === latest) return base;
  const overrides = REPORT_SNAPSHOT_OVERRIDES[campaignId]?.[version];
  if (!overrides) return base; // valid snapshot (equals current) for un-seeded older versions
  return base.map((row) => {
    const o = overrides[row.lineId];
    if (!o) return row;
    return {
      ...row,
      fields: row.fields.map((f) => (o[f.label] != null ? { ...f, value: o[f.label] } : f)),
    };
  });
}

// ── S4 — Изменение после согласования (§5.1, §5.2, §11.8) ──────────────────────
// After a campaign is «Согласовано и отправлено смежным отделам», any edit is a
// tracked change detected by diffing the live lines/period against the last sent
// version (the baseline). Until approved (Маркетинг, where required → КД) it is a
// draft and is NOT sent to departments. КД approval forms a new version + an
// incremental send. Adding NEW products does NOT require Маркетинг re-approval.

/** The status at which edit-after-approval tracking kicks in (§5.1). */
export const APPROVED_CAMPAIGN_STATUS: CampaignStatus =
  "Согласовано и отправлено смежным отделам";

/** Whether edit-after-approval applies to this campaign. */
export function isApprovedCampaign(c: PromoCampaign): boolean {
  return c.status === APPROVED_CAMPAIGN_STATUS && !c.cancelled;
}

/**
 * «До отправки на согласование» (feedback §3) — the campaign hasn't been submitted
 * for approval yet (draft) or was returned to the КМ for correction, so the КМ may
 * freely ADD / EDIT / DELETE its nomenclature. Under review («На согласовании …»)
 * or already sent to departments, that is no longer allowed here (approved
 * campaigns are edited only as tracked corrections — see isApprovedCampaign).
 */
export function isCampaignFreshEditable(c: PromoCampaign): boolean {
  if (c.cancelled) return false;
  if (c.status === "Черновик" || c.status === REJECTED_KM_STATUS) return true;
  // An unplanned campaign that hasn't been sent for approval yet is still a draft.
  return !c.planned && !c.firstSendDone;
}

/** КМ-editable fields tracked for the edit-after-approval diff. */
const TRACKED_FIELDS: {
  field: keyof PromoLine;
  label: string;
  kind: "money" | "percent" | "number" | "text";
}[] = [
  { field: "stock", label: "Остаток", kind: "number" },
  { field: "newPrice", label: "Новая цена", kind: "money" },
  { field: "discountPct", label: "Скидка", kind: "percent" },
  { field: "salesForecast", label: "Прогноз продаж", kind: "number" },
  { field: "regularSales", label: "Регулярные продажи", kind: "number" },
  { field: "cashDiscountPct", label: "Скидка за Cash", kind: "percent" },
  { field: "supplierCompensation", label: "Компенсация поставщика", kind: "money" },
  { field: "compensationLimit", label: "Лимит компенс. кол-ва", kind: "number" },
  { field: "utp", label: "УТП", kind: "text" },
];

function fmtTracked(
  v: unknown,
  kind: "money" | "percent" | "number" | "text"
): string {
  if (v == null || v === "") return "—";
  if (kind === "money") return `${Number(v).toLocaleString("ru-RU")} сум`;
  if (kind === "percent") return `${v}%`;
  if (kind === "number") return Number(v).toLocaleString("ru-RU");
  return String(v);
}

function fmtPeriodRu(start: Date, end: Date): string {
  return `${start.toLocaleDateString("ru-RU")} — ${end.toLocaleDateString("ru-RU")}`;
}

/** The result of diffing a campaign's live state against its last sent version. */
export interface CampaignChangeSet {
  changes: VersionFieldChange[];
  /** `${lineId}:${field}` keys of changed cells — drives the grid highlight. */
  changedCells: string[];
  /** A change to an EXISTING line or the period → requires Маркетинг re-approval. */
  hasValueChange: boolean;
  /** A new line was added → no Маркетинг re-approval needed (§11.8). */
  hasAddition: boolean;
  periodChanged: boolean;
}

/**
 * Diff a campaign's current lines + period against the baseline (last sent
 * version). Returns the per-field changes, the changed-cell keys, and the flags
 * that drive re-approval routing.
 */
export function diffCampaignChanges(
  campaign: PromoCampaign,
  currentLines: PromoLine[],
  baselineLines: PromoLine[],
  baselinePeriod: { startDate: Date; endDate: Date }
): CampaignChangeSet {
  const baseById = new Map(baselineLines.map((l) => [l.id, l]));
  const changes: VersionFieldChange[] = [];
  const changedCells: string[] = [];
  let hasValueChange = false;
  let hasAddition = false;

  const periodChanged =
    campaign.startDate.getTime() !== baselinePeriod.startDate.getTime() ||
    campaign.endDate.getTime() !== baselinePeriod.endDate.getTime();
  if (periodChanged) {
    hasValueChange = true;
    changes.push({
      scope: "Период акции",
      field: "Период",
      from: fmtPeriodRu(baselinePeriod.startDate, baselinePeriod.endDate),
      to: fmtPeriodRu(campaign.startDate, campaign.endDate),
      kind: "changed",
    });
  }

  for (const line of currentLines) {
    const base = baseById.get(line.id);
    const nom = getNomenclatureItem(line.nomenclatureId);
    const scope = nom?.name ?? line.nomenclatureId;
    if (!base) {
      hasAddition = true;
      changes.push({
        scope,
        field: "Позиция",
        to: "добавлена после согласования",
        kind: "added",
      });
      continue;
    }
    for (const t of TRACKED_FIELDS) {
      const a = base[t.field];
      const b = line[t.field];
      if (a === b || (a == null && b == null)) continue;
      hasValueChange = true;
      changedCells.push(`${line.id}:${String(t.field)}`);
      changes.push({
        scope,
        field: t.label,
        from: a == null ? undefined : fmtTracked(a, t.kind),
        to: b == null ? undefined : fmtTracked(b, t.kind),
        kind: "changed",
      });
    }
  }

  return { changes, changedCells, hasValueChange, hasAddition, periodChanged };
}

/**
 * Build the new report version formed when КД approves a correction and it is
 * sent incrementally to departments (§5.1). Additions-only → «Добавление».
 */
export function buildSentVersion(
  campaignId: string,
  changeSet: CampaignChangeSet,
  nextVersion: number,
  date: Date,
  role: string
): CampaignVersion {
  const additionsOnly = changeSet.hasAddition && !changeSet.hasValueChange;
  return {
    id: `${campaignId}-v${nextVersion}`,
    campaignId,
    version: nextVersion,
    date,
    author: role,
    role,
    changeType: additionsOnly ? "Добавление" : "Корректировка",
    summary:
      "Изменения согласованы и отправлены смежным отделам (инкрементально, только изменённые/добавленные данные).",
    changes: changeSet.changes,
  };
}

// ── Cancellation + deadline change (S4 Phase 3, §5.3 / §4.7) ───────────────────

/** Whole-campaign cancellation is restricted to Коммерческий директор (§5.3). */
export function canCancelCampaign(role: PromoRole): boolean {
  return role === "Коммерческий директор";
}

/** КМ requesting removal of their own line (§5.3). КД re-approves it. */
export function canRequestLineRemoval(role: PromoRole): boolean {
  return role === "Категорийный менеджер (КМ)" || role === "Старший КМ";
}

/** КД re-approval of a КМ line-removal request (§5.3). */
export function canApproveLineRemoval(role: PromoRole): boolean {
  return role === "Коммерческий директор";
}

/** Initiating a deadline change — Коммерческий директор (§4.7). */
export function canManageDeadline(role: PromoRole): boolean {
  return role === "Коммерческий директор";
}

/** Approving a deadline change — senior leadership; here Операционный директор (§4.7). */
export function canApproveDeadline(role: PromoRole): boolean {
  return role === "Операционный директор";
}

/**
 * Build the immutable «Отмена» version entry appended when КД cancels a campaign
 * (§5.3). The reason is recorded so it stays visible in the history/audit trail.
 */
export function buildCancellationVersion(
  campaignId: string,
  reason: string,
  nextVersion: number,
  date: Date,
  role: string
): CampaignVersion {
  return {
    id: `${campaignId}-v${nextVersion}`,
    campaignId,
    version: nextVersion,
    date,
    author: role,
    role,
    changeType: "Отмена",
    summary: `Акция отменена. Причина: ${reason}`,
    changes: [],
  };
}

/**
 * Build the «Корректировка» version entry appended when КД approves a line
 * removal and it is sent incrementally to departments (§5.3). The excluded line
 * shows as a `removed` change in the diff.
 */
export function buildLineRemovalVersion(
  campaignId: string,
  nomenclatureName: string,
  reason: string,
  nextVersion: number,
  date: Date,
  role: string
): CampaignVersion {
  return {
    id: `${campaignId}-v${nextVersion}`,
    campaignId,
    version: nextVersion,
    date,
    author: role,
    role,
    changeType: "Корректировка",
    summary: `Позиция исключена из акции: ${nomenclatureName}. Причина: ${reason}. Отделы уведомлены.`,
    changes: [
      {
        scope: nomenclatureName,
        field: "Позиция",
        from: "в акции",
        to: "исключена из акции",
        kind: "removed",
      },
    ],
  };
}

// ── S5 — Отчёты для смежных подразделений (§7) ─────────────────────────────────
// Read-only, versioned reports auto-generated when a campaign reaches «Согласовано
// и отправлено смежным отделам». Three department views (Маркетинг / Закуп /
// Аналитика), each with its own Appendix-C field subset. Ознакомление ≠
// согласование (§11.7): acknowledging clears the change highlight but never moves
// the campaign status.

export type ReportDepartment = "marketing" | "purchasing" | "analytics";

export const DEPARTMENT_LABELS: Record<ReportDepartment, string> = {
  marketing: "Отчёт для маркетинга",
  purchasing: "Отчёт для закупа",
  analytics: "Отчёт для аналитики",
};

export const DEPARTMENT_SHORT: Record<ReportDepartment, string> = {
  marketing: "Маркетинг",
  purchasing: "Закуп",
  analytics: "Аналитика",
};

export interface ReportAccess {
  /** Department tabs this role may open (Appendix D «Отчёты»). */
  departments: ReportDepartment[];
  /** Only «Сотрудник маркетинга» may toggle «В рекламу (выбрано маркетингом)» (§7.2). */
  canEditMarketingFlag: boolean;
  /** Short RU description for the access banner / empty state. */
  note: string;
}

const ALL_DEPARTMENTS: ReportDepartment[] = [
  "marketing",
  "purchasing",
  "analytics",
];

/** Department-report access per role (Appendix D «Отчёты» column). */
export function getReportAccess(role: PromoRole): ReportAccess {
  switch (role) {
    case "Коммерческий директор":
    case "Операционный директор":
    case "Категорийный менеджер (КМ)":
    case "Старший КМ":
    case "Администратор":
      return {
        departments: ALL_DEPARTMENTS,
        canEditMarketingFlag: false,
        note: "Просмотр всех отчётов смежных подразделений.",
      };
    case "Директор маркетинга":
      return {
        departments: ["marketing"],
        canEditMarketingFlag: false,
        note: "Просмотр отчёта для маркетинга.",
      };
    case "Сотрудник маркетинга":
      return {
        departments: ["marketing"],
        canEditMarketingFlag: true,
        note: "Просмотр отчёта для маркетинга; изменение поля «В рекламу (выбрано маркетингом)».",
      };
    case "Сотрудник закупа":
      return {
        departments: ["purchasing"],
        canEditMarketingFlag: false,
        note: "Просмотр отчёта для закупа.",
      };
    case "Сотрудник аналитики":
      return {
        departments: ["analytics"],
        canEditMarketingFlag: false,
        note: "Просмотр отчёта для аналитики.",
      };
    default:
      return {
        departments: [],
        canEditMarketingFlag: false,
        note: "Нет доступа к отчётам.",
      };
  }
}

/**
 * «Срок отправки отчёта смежным отделам» = 17 calendar days before the campaign
 * start (§4.7). A report sent later than this is overdue (non-blocking signal).
 */
export function getReportDeadline(campaign: PromoCampaign): Date {
  const d = new Date(campaign.startDate);
  d.setDate(d.getDate() - 17);
  return d;
}

/**
 * Campaigns that have been sent to departments (a report exists): approved status,
 * not cancelled, and with at least one line. Newest report first (latest send).
 */
export function getSentCampaigns(): PromoCampaign[] {
  const withLines = new Set(PROMO_LINES.map((l) => l.campaignId));
  return CAMPAIGNS.filter(
    (c) => isApprovedCampaign(c) && withLines.has(c.id)
  ).sort(
    (a, b) =>
      getReportSentAt(b).getTime() - getReportSentAt(a).getTime()
  );
}

/** When the report was first sent — the «Первичная отправка» version date (§7). */
export function getReportSentAt(campaign: PromoCampaign): Date {
  const versions = getCampaignVersions(campaign.id);
  const first = versions.find((v) => v.changeType === "Первичная отправка");
  return first?.date ?? versions[versions.length - 1]?.date ?? campaign.startDate;
}

/** Latest report version number (newest version in the chain). */
export function getReportVersionNo(campaign: PromoCampaign): number {
  return getCampaignVersions(campaign.id)[0]?.version ?? 1;
}

/**
 * Whether/when a campaign's report was sent to the adjacent departments, plus its
 * report deadline (§12 — short-calendar «Отправка смежным отделам» + «Срок отчёта»).
 * «Sent» = the campaign is approved/sent and has at least one line (same rule as
 * `getSentCampaigns`). `overdueDays` is the ACTUAL lateness — days the report was
 * sent past the 17-кал.-дн. deadline — and is **> 0 only when the report was really
 * sent late** (client feedback №4: no premature просрочка before the fact of sending;
 * when not sent, `overdueDays` is 0 and only the «Срок отчёта» date is shown).
 * Seed-stale (mock report trail).
 */
export interface ReportSendStatus {
  sent: boolean;
  sentAt?: Date;
  versionNo?: number;
  deadline: Date;
  overdueDays: number;
}
export function getReportSendStatus(campaign: PromoCampaign): ReportSendStatus {
  const deadline = getReportDeadline(campaign);
  const hasLines = PROMO_LINES.some((l) => l.campaignId === campaign.id);
  const sent = isApprovedCampaign(campaign) && hasLines;
  if (sent) {
    const sentAt = getReportSentAt(campaign);
    return {
      sent,
      sentAt,
      versionNo: getReportVersionNo(campaign),
      deadline,
      // Просрочка «+N дн.» отображается только при фактической отправке позже срока (№4).
      overdueDays: getOverdueDays(deadline, sentAt),
    };
  }
  // Отчёт ещё не отправлен → просрочку не показываем (только крайняя дата в «Срок отчёта»).
  return { sent, deadline, overdueDays: 0 };
}

/**
 * The changed/added/removed cells+lines of a campaign's LATEST report version,
 * vs the previous one (§7.1). Highlighted in the report until the recipient
 * acknowledges (§11.4). Seed-stale (the audit trail is mocked).
 */
export interface ReportCellChange {
  lineId: string;
  fieldId: string;
  /** Pre-formatted display strings for the tooltip. */
  prevValue: string;
  newValue: string;
  changedAt: Date;
}

export interface ReportChangeSet {
  /** Lines added in the latest version → green «Добавлено» plashka. */
  addedLineIds: string[];
  /** Lines excluded in the latest version → red «Исключено» plashka (kept, struck). */
  removedLineIds: string[];
  /** Per-cell changes → amber highlight + before→after tooltip. */
  changedCells: ReportCellChange[];
}

const REPORT_CHANGE_SETS: Record<string, ReportChangeSet> = {
  // UN-2026-015 received a later incremental correction: a price/discount change on
  // L-0019, one added position (L-0021), and one excluded position (L-0020).
  "UN-2026-015": {
    addedLineIds: ["L-0021"],
    removedLineIds: ["L-0020"],
    changedCells: [
      { lineId: "L-0019", fieldId: "newPrice", prevValue: "12 690 000 сум", newValue: "12 450 000 сум", changedAt: new Date(2026, 5, 5, 10, 40) },
      { lineId: "L-0019", fieldId: "discountPct", prevValue: "9%", newValue: "11%", changedAt: new Date(2026, 5, 5, 10, 40) },
      { lineId: "L-0019", fieldId: "supplierCompensation", prevValue: "250 000 сум", newValue: "300 000 сум", changedAt: new Date(2026, 5, 5, 10, 40) },
      { lineId: "L-0019", fieldId: "compensationLimit", prevValue: "30", newValue: "40", changedAt: new Date(2026, 5, 5, 10, 40) },
    ],
  },
};

const EMPTY_CHANGE_SET: ReportChangeSet = {
  addedLineIds: [],
  removedLineIds: [],
  changedCells: [],
};

export function getReportChangeSet(campaignId: string): ReportChangeSet {
  return REPORT_CHANGE_SETS[campaignId] ?? EMPTY_CHANGE_SET;
}

export function reportCellChange(
  set: ReportChangeSet,
  lineId: string,
  fieldId: string
): ReportCellChange | undefined {
  return set.changedCells.find((c) => c.lineId === lineId && c.fieldId === fieldId);
}

// Roster of adjacent-department staff (for the «кто ознакомился» view — Task 4.3)
// and a seed of partial acknowledgements so that view has a realistic mix on load.
export interface ReportRosterUser { id: string; name: string; }
const REPORT_ROSTER: Record<ReportDepartment, ReportRosterUser[]> = {
  marketing: [
    { id: "u-mkt-1", name: "Ахмедова Дилноза" },
    { id: "u-mkt-2", name: "Юсупов Тимур" },
    { id: "u-mkt-3", name: "Каримова Севара" },
  ],
  purchasing: [
    { id: "u-buy-1", name: "Сотрудник закупа АС" },
    { id: "u-buy-2", name: "Рахимов Джасур" },
  ],
  analytics: [
    { id: "u-an-1", name: "Аналитик КР" },
    { id: "u-an-2", name: "Собиров Азиз" },
  ],
};
export function getReportRoster(department: ReportDepartment): ReportRosterUser[] {
  return REPORT_ROSTER[department] ?? [];
}
// Partial acknowledgements so the «кто ознакомился» view has a realistic mix.
// version = 2, the actual latest report version of UN-2026-015 (getReportVersionNo).
const REPORT_ACK_SEED: { campaignId: string; department: ReportDepartment; version: number; userId: string; lineId: string; at: string }[] = [
  { campaignId: "UN-2026-015", department: "marketing", version: 2, userId: "u-mkt-1", lineId: "L-0019", at: new Date(2026, 5, 5, 12, 10).toISOString() },
  { campaignId: "UN-2026-015", department: "marketing", version: 2, userId: "u-mkt-1", lineId: "L-0021", at: new Date(2026, 5, 5, 12, 11).toISOString() },
];
export function getReportAckSeed(campaignId: string, department: ReportDepartment, version: number) {
  return REPORT_ACK_SEED.filter(
    (r) => r.campaignId === campaignId && r.department === department && r.version === version
  );
}

// ── S6 — Центр уведомлений (notifications) — spec §11.3 ──────────────────────

/**
 * Notification categories (spec §11.3): a small fixed taxonomy. The icon is
 * resolved in the component layer (no JSX here); label + soft tint live here so
 * the bell, the list, and any filter stay consistent.
 */
export type NotificationType =
  | "data-changed" // новые/изменённые данные (новая версия отчёта)
  | "campaign-cancelled" // «Акция отменена»
  | "line-removed" // «Удалена позиция»
  | "marketing-reapproval" // «Требуется повторное согласование маркетинга»
  | "km-assignment" // назначение КМ
  | "ad-approval"; // утверждение «В рекламу»

export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  { label: string; bg: string; text: string }
> = {
  "data-changed": { label: "Новые/изменённые данные", bg: "bg-blue-50 dark:bg-blue-500/15", text: "text-blue-700 dark:text-blue-300" },
  "campaign-cancelled": { label: "Акция отменена", bg: "bg-red-50 dark:bg-red-500/15", text: "text-red-700 dark:text-red-300" },
  "line-removed": { label: "Удалена позиция", bg: "bg-orange-50 dark:bg-orange-500/15", text: "text-orange-700 dark:text-orange-300" },
  "marketing-reapproval": { label: "Повторное согласование маркетинга", bg: "bg-pink-50 dark:bg-pink-500/15", text: "text-pink-700 dark:text-pink-300" },
  "km-assignment": { label: "Назначение КМ", bg: "bg-violet-50 dark:bg-violet-500/15", text: "text-violet-700 dark:text-violet-300" },
  "ad-approval": { label: "Утверждение «В рекламу»", bg: "bg-emerald-50 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300" },
};

export interface PromoNotification {
  id: string;
  type: NotificationType;
  /** Related campaign — drives the quick link + context line. */
  campaignId?: string;
  campaignName?: string;
  /** Report version (for «новые/изменённые данные» report notifications). */
  reportVersion?: number;
  /** Ответственный пользователь — who triggered the event. */
  actor: { name: string; role: PromoRole };
  /** Краткое описание изменений. */
  description: string;
  sentAt: Date;
  read: boolean;
  /** In-app quick link (campaign/report). */
  href: string;
  /**
   * Roles allowed to see this notification (§11.3.1 — availability depends on
   * the user's role/rights). Undefined → visible to everyone. Администратор
   * always sees all (handled in `notificationsForRole`). Since E-2b, actual
   * visibility is governed by the per-role `RoleNotificationConfig`
   * (`notificationsForRole(role, list, config)` / the notification-settings
   * store); this field is retained for seed provenance and back-compat only.
   */
  visibleTo?: PromoRole[];
}

const MARKETING_AUDIENCE: PromoRole[] = [
  "Сотрудник маркетинга",
  "Директор маркетинга",
  "Коммерческий директор",
  "Администратор",
];

const ADJ_DEPARTMENTS_AUDIENCE: PromoRole[] = [
  "Сотрудник маркетинга",
  "Директор маркетинга",
  "Сотрудник закупа",
  "Сотрудник аналитики",
  "Коммерческий директор",
  "Операционный директор",
  "Администратор",
];

/**
 * E-2 — what an action handler passes to `notify()`. The store fills in
 * id / sentAt / actor / read; audience defaults from `notificationAudienceFor`.
 */
export interface NotificationInput {
  type: NotificationType;
  campaignId?: string;
  campaignName?: string;
  reportVersion?: number;
  description: string;
  /** In-app quick link; defaults to "/notifications". */
  href?: string;
  /** Override the type's default audience (§11.3.1). */
  visibleTo?: PromoRole[];
}

/**
 * Default audience per notification type (§11.3.1) so callers rarely pass
 * `visibleTo`. Both audiences include Коммерческий директор; MARKETING_AUDIENCE
 * includes Сотрудник маркетинга — so the actor of every wired emission is inside
 * the resulting audience and sees their own item. `km-assignment` → undefined
 * (visible to all); it is not emitted live.
 */
export function notificationAudienceFor(
  type: NotificationType
): PromoRole[] | undefined {
  switch (type) {
    case "campaign-cancelled":
    case "line-removed":
    case "data-changed":
      return ADJ_DEPARTMENTS_AUDIENCE;
    case "marketing-reapproval":
    case "ad-approval":
      return MARKETING_AUDIENCE;
    case "km-assignment":
      return undefined;
  }
}

/**
 * Pure factory for a live-emitted notification. `at` / `seq` are passed in (no
 * `Date.now()` at the data layer) so ids are unique within a session:
 * `live-<epoch>-<seq>`.
 */
export function createLiveNotification(
  input: NotificationInput,
  actor: { name: string; role: PromoRole },
  seq: number,
  at: Date
): PromoNotification {
  return {
    id: `live-${at.getTime()}-${seq}`,
    type: input.type,
    campaignId: input.campaignId,
    campaignName: input.campaignName,
    reportVersion: input.reportVersion,
    actor,
    description: input.description,
    sentAt: at,
    read: false,
    href: input.href ?? "/notifications",
    visibleTo: input.visibleTo ?? notificationAudienceFor(input.type),
  };
}

/**
 * Seed ~8 notifications across all types and read/unread states, with live
 * relative timestamps (so the date grouping «Сегодня»/«Вчера»/дата stays fresh).
 * `new Date()` is fine in app/mock code — the no-`Date.now()` rule is only for
 * Workflow scripts.
 */
export function buildNotifications(ref: Date = new Date()): PromoNotification[] {
  const minutesAgo = (m: number) => new Date(ref.getTime() - m * 60_000);
  const hoursAgo = (h: number) => minutesAgo(h * 60);
  const daysAgo = (d: number) => hoursAgo(d * 24);

  return [
    {
      id: "ntf-01",
      type: "data-changed",
      campaignId: "PR-2026-001",
      campaignName: "Чёрная пятница 2026",
      reportVersion: 3,
      actor: { name: "Каримов Шерзод", role: "Категорийный менеджер (КМ)" },
      description: "Отправлена новая версия отчёта смежным отделам: изменены цены и остатки по 4 позициям.",
      sentAt: minutesAgo(5),
      read: false,
      href: "/reports",
      visibleTo: ADJ_DEPARTMENTS_AUDIENCE,
    },
    {
      id: "ntf-02",
      type: "km-assignment",
      campaignId: "PR-2026-002",
      campaignName: "Рассрочка на технику к Новому году",
      actor: { name: "Сардор Мавлянов", role: "Коммерческий директор" },
      description: "Вы назначены категорийным менеджером по направлению «Холодильники и крупная БТ».",
      sentAt: minutesAgo(40),
      read: false,
      href: "/full-calendar",
    },
    {
      id: "ntf-03",
      type: "marketing-reapproval",
      campaignId: "PR-2026-003",
      campaignName: "1+1 на мелкую бытовую технику",
      actor: { name: "Рашидова Дилноза", role: "Категорийный менеджер (КМ)" },
      description: "После корректировки цены требуется повторное согласование выбора «В рекламу» маркетингом.",
      sentAt: hoursAgo(1),
      read: false,
      href: "/full-calendar",
      visibleTo: MARKETING_AUDIENCE,
    },
    {
      id: "ntf-04",
      type: "line-removed",
      campaignId: "UN-2026-015",
      campaignName: "Срочная скидка на холодильники (внеплановая)",
      actor: { name: "Сардор Мавлянов", role: "Коммерческий директор" },
      description: "Из акции исключена позиция «Холодильник Artel HD-345» по запросу КМ.",
      sentAt: hoursAgo(3),
      read: false,
      href: "/full-calendar",
      visibleTo: ADJ_DEPARTMENTS_AUDIENCE,
    },
    {
      id: "ntf-05",
      type: "campaign-cancelled",
      campaignId: "PR-2026-004",
      campaignName: "Распродажа ТВ и аудио",
      actor: { name: "Сардор Мавлянов", role: "Коммерческий директор" },
      description: "Акция отменена. Смежные подразделения уведомлены.",
      sentAt: hoursAgo(6),
      read: true,
      href: "/full-calendar",
      visibleTo: ADJ_DEPARTMENTS_AUDIENCE,
    },
    {
      id: "ntf-06",
      type: "data-changed",
      campaignId: "UN-2026-015",
      campaignName: "Срочная скидка на холодильники (внеплановая)",
      reportVersion: 2,
      actor: { name: "Юсупова Нигора", role: "Категорийный менеджер (КМ)" },
      description: "Инкрементальная корректировка отчёта: добавлена 1 позиция, изменена компенсация поставщика.",
      sentAt: daysAgo(1),
      read: true,
      href: "/reports",
      visibleTo: ADJ_DEPARTMENTS_AUDIENCE,
    },
    {
      id: "ntf-07",
      type: "ad-approval",
      campaignId: "PR-2026-003",
      campaignName: "1+1 на мелкую бытовую технику",
      actor: { name: "Алишер Хабибуллаев", role: "Сотрудник маркетинга" },
      description: "Маркетинг согласовал выбор позиций «В рекламу» (3 позиции).",
      sentAt: daysAgo(1),
      read: true,
      href: "/reports",
      visibleTo: MARKETING_AUDIENCE,
    },
    {
      id: "ntf-08",
      type: "km-assignment",
      campaignId: "PR-2026-005",
      campaignName: "Cashback на смартфоны",
      actor: { name: "Сардор Мавлянов", role: "Коммерческий директор" },
      description: "Назначен КМ Каримов Шерзод по направлению «Смартфоны и гаджеты».",
      sentAt: daysAgo(2),
      read: true,
      href: "/full-calendar",
    },
  ];
}

/** E-2b — per-role notification config: which categories each role receives. */
export type RoleNotificationConfig = Record<PromoRole, NotificationType[]>;

/**
 * Notifications a role may see. Администратор is never filtered (god-mode escape
 * hatch). With a `config` (E-2b), visibility = the role's configured categories;
 * without one, the pre-E-2b `visibleTo` audience behavior (back-compat until the
 * consumers pass the config).
 */
export function notificationsForRole(
  role: PromoRole,
  list: PromoNotification[],
  config?: RoleNotificationConfig
): PromoNotification[] {
  if (role === "Администратор") return list;
  if (config) {
    const allowed = config[role] ?? [];
    return list.filter((n) => allowed.includes(n.type));
  }
  return list.filter((n) => !n.visibleTo || n.visibleTo.includes(role));
}

/** E-2b — a context deep-link surfaced on a notification. */
export interface NotificationLink {
  label: string;
  href: string;
  kind: "promo" | "approval" | "report";
}

/**
 * Context deep-links for a notification (E-2b). Produced only when the item has a
 * `campaignId`; the target screens focus the campaign via `?promo=<id>`
 * (full-calendar/approvals show a banner, reports pre-selects the picker).
 */
export function notificationLinksFor(n: PromoNotification): NotificationLink[] {
  if (!n.campaignId) return [];
  const id = n.campaignId;
  const promo: NotificationLink = { label: "Открыть промо", href: `/full-calendar?promo=${id}`, kind: "promo" };
  const approval: NotificationLink = { label: "Открыть согласование", href: `/approvals?promo=${id}`, kind: "approval" };
  const report: NotificationLink = { label: "Открыть отчёт", href: `/reports?promo=${id}`, kind: "report" };
  // The report link only helps when the campaign has a sent report; otherwise
  // /reports cannot focus it and would silently show a different campaign.
  const reportAvailable = getSentCampaigns().some((c) => c.id === id);
  switch (n.type) {
    case "data-changed":
      return reportAvailable ? [report, promo] : [promo];
    case "campaign-cancelled":
    case "line-removed":
    case "marketing-reapproval":
      return [promo, approval];
    case "km-assignment":
      return [promo];
    case "ad-approval":
      return reportAvailable ? [report, promo] : [promo];
  }
}

export interface NotificationDateGroup {
  /** «Сегодня» / «Вчера» / DD.MM.YYYY. */
  key: string;
  items: PromoNotification[];
}

/** Group notifications by calendar day, newest first, with friendly day labels. */
export function groupNotificationsByDate(
  list: PromoNotification[],
  ref: Date = new Date()
): NotificationDateGroup[] {
  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const pad = (n: number) => String(n).padStart(2, "0");
  const ddmmyyyy = (d: Date) =>
    `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  const today = dayKey(ref);
  const yesterday = dayKey(addCalendarDays(ref, -1));

  const sorted = [...list].sort(
    (a, b) => b.sentAt.getTime() - a.sentAt.getTime()
  );

  const groups: NotificationDateGroup[] = [];
  const byKey = new Map<string, NotificationDateGroup>();

  for (const n of sorted) {
    const k = dayKey(n.sentAt);
    const label =
      k === today
        ? "Сегодня"
        : k === yesterday
          ? "Вчера"
          : ddmmyyyy(n.sentAt);
    let group = byKey.get(k);
    if (!group) {
      group = { key: label, items: [] };
      byKey.set(k, group);
      groups.push(group);
    }
    group.items.push(n);
  }

  return groups;
}

// ── S7 — Настройки типов промо (promo-type required-field rules, spec §9) ───────
//
// A rule maps one or more promo types to a set of full-calendar fields that
// become REQUIRED for those types. A rule only takes effect after Коммерческий
// директор confirmation (status → «Утверждено»); any later edit drops it back to
// «Черновик» and needs re-confirmation (§9.5). No hard delete — only «Архив».

export type PromoTypeRuleStatus = "draft" | "pending" | "approved" | "archived";

export const PROMO_TYPE_RULE_STATUS_LABEL: Record<PromoTypeRuleStatus, string> = {
  draft: "Черновик",
  pending: "На подтверждении",
  approved: "Утверждено",
  archived: "Архив",
};

/** Soft-tint (bg + text) per rule status, paired with the status text. */
export const PROMO_TYPE_RULE_STATUS_TINT: Record<
  PromoTypeRuleStatus,
  { bg: string; text: string }
> = {
  draft: { bg: "bg-gray-100 dark:bg-muted", text: "text-gray-600 dark:text-gray-300" },
  pending: { bg: "bg-amber-50 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-300" },
  approved: { bg: "bg-emerald-50 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300" },
  archived: { bg: "bg-gray-100 dark:bg-muted", text: "text-gray-500 dark:text-gray-400" },
};

export interface RuleHistoryEntry {
  at: Date;
  by: PromoRole;
  /** Short RU action label, e.g. «Создано», «Отправлено на подтверждение». */
  action: string;
  note?: string;
}

export interface PromoTypeRule {
  id: string;
  name: string;
  /** PromoTypeRef.id values this rule applies to. */
  promoTypeIds: string[];
  /** Field ids (from ruleFields.ts / gridFields) that become required. */
  requiredFieldIds: string[];
  status: PromoTypeRuleStatus;
  history: RuleHistoryEntry[];
  confirmedBy?: PromoRole;
  confirmedAt?: Date;
}

const ruleDate = (daysAgo: number) => addCalendarDays(new Date(), -daysAgo);

export const PROMO_TYPE_RULES: PromoTypeRule[] = [
  {
    id: "rule-installment-12",
    name: "Рассрочка 0-0-12",
    promoTypeIds: ["installment-0-0-12"],
    requiredFieldIds: [
      "nomenclature",
      "stock",
      "newPrice",
      "discountPct",
      "salesForecast",
      "t12disc",
    ],
    status: "approved",
    confirmedBy: "Коммерческий директор",
    confirmedAt: ruleDate(20),
    history: [
      { at: ruleDate(28), by: "Коммерческий директор", action: "Создано" },
      {
        at: ruleDate(22),
        by: "Коммерческий директор",
        action: "Отправлено на подтверждение",
      },
      {
        at: ruleDate(20),
        by: "Коммерческий директор",
        action: "Утверждено",
        note: "Правило вступило в силу.",
      },
    ],
  },
  {
    id: "rule-gift",
    name: "Товар в подарок",
    promoTypeIds: ["one-plus-one", "gift", "gift-choice"],
    requiredFieldIds: [
      "nomenclature",
      "stock",
      "salesForecast",
      "gift1Nomenclature",
      "supplierCompensation",
    ],
    status: "draft",
    history: [
      { at: ruleDate(5), by: "Администратор", action: "Создано" },
      {
        at: ruleDate(2),
        by: "Администратор",
        action: "Изменён перечень полей",
        note: "Добавлено поле «Компенсация поставщика».",
      },
    ],
  },
  {
    id: "rule-clearance-legacy",
    name: "Распродажа (старое правило)",
    promoTypeIds: ["clearance"],
    requiredFieldIds: ["nomenclature", "newPrice", "discountPct"],
    status: "archived",
    confirmedBy: "Коммерческий директор",
    confirmedAt: ruleDate(120),
    history: [
      { at: ruleDate(140), by: "Коммерческий директор", action: "Создано" },
      { at: ruleDate(120), by: "Коммерческий директор", action: "Утверждено" },
      {
        at: ruleDate(30),
        by: "Коммерческий директор",
        action: "Архивировано",
        note: "Заменено правилом для распродаж нового сезона.",
      },
    ],
  },
];

export interface PromoTypeSettingsAccess {
  /** Whether the role may open the settings screen. */
  canView: boolean;
  /** Edit rule fields / create / copy / send for confirmation / archive. */
  canEdit: boolean;
  /** Confirm a rule so it takes effect — Коммерческий директор only (§9). */
  canConfirm: boolean;
  /** Short RU description for the access banner. */
  note: string;
}

export function getPromoTypeSettingsAccess(
  role: PromoRole
): PromoTypeSettingsAccess {
  switch (role) {
    case "Коммерческий директор":
      return {
        canView: true,
        canEdit: true,
        canConfirm: true,
        note: "Создание, изменение и утверждение правил обязательных полей.",
      };
    case "Администратор":
      return {
        canView: true,
        canEdit: true,
        canConfirm: false,
        note: "Создание и изменение правил; утверждение — за коммерческим директором.",
      };
    // Client feedback «6-я часть» №3 — the marketing director may create/edit promo-type
    // rules; confirmation (§9) stays with the commercial director.
    case "Директор маркетинга":
      return {
        canView: true,
        canEdit: true,
        canConfirm: false,
        note: "Создание и изменение правил; утверждение — за коммерческим директором.",
      };
    default:
      return {
        canView: true,
        canEdit: false,
        canConfirm: false,
        note: "Только просмотр правил обязательных полей.",
      };
  }
}

/** Promo-type display names for the given rule (for the effect-preview note). */
export function promoTypeNamesFor(ids: string[]): string[] {
  return ids
    .map((id) => PROMO_TYPES.find((t) => t.id === id)?.name)
    .filter((n): n is string => Boolean(n));
}

/** Next id for a freshly created/copied rule (deterministic, no randomness). */
export function nextRuleId(existing: PromoTypeRule[]): string {
  let n = existing.length + 1;
  let id = `rule-new-${n}`;
  const ids = new Set(existing.map((r) => r.id));
  while (ids.has(id)) {
    n += 1;
    id = `rule-new-${n}`;
  }
  return id;
}

// ── S8 — Аудит-лог и свод контрольных событий (spec §11.9) ─────────────────────
// Read-only. Two views:
//   1) Аудит-лог — a chronological action log (who / role / when / action / object /
//      статус до→после / комментарий).
//   2) Свод контрольных событий — a per-campaign milestone timeline with просрочка
//      breaches attributed to the responsible participant.
// Both are RECONSTRUCTED from the existing seeds (campaign statuses, the version
// chains, review comments, cancellation/non-participation seeds, report sends) and
// are seed-stale — in-session actions on other screens are NOT appended here (the
// audit trail is mocked, same honesty as the S4/S5 version history).

/** The action taxonomy the log filters by (spec §11.9). */
export type AuditActionType =
  | "создание"
  | "изменение"
  | "отправка на согласование"
  | "согласование"
  | "отклонение"
  | "отмена"
  | "Не участвует"
  | "отправка отчёта"
  | "сброс пароля"
  | "назначение прав"
  | "отзыв прав"
  | "блокировка"
  | "разблокировка"
  | "смена пароля"
  | "изменение профиля"
  | "изменение ролей"
  | "назначение замещения"
  | "снятие замещения";

/** What an action acted on. */
export type AuditObjectType = "акция" | "строка" | "отчёт" | "план" | "пользователь";

/** Soft tint per action type (paired with the label, never colour alone). */
export const AUDIT_ACTION_META: Record<
  AuditActionType,
  { bg: string; text: string }
> = {
  "создание": { bg: "bg-blue-50 dark:bg-blue-500/15", text: "text-blue-700 dark:text-blue-300" },
  "изменение": { bg: "bg-amber-50 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-300" },
  "отправка на согласование": { bg: "bg-violet-50 dark:bg-violet-500/15", text: "text-violet-700 dark:text-violet-300" },
  "согласование": { bg: "bg-emerald-50 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300" },
  "отклонение": { bg: "bg-red-50 dark:bg-red-500/15", text: "text-red-700 dark:text-red-300" },
  "отмена": { bg: "bg-red-100 dark:bg-red-500/20", text: "text-red-800 dark:text-red-300" },
  "Не участвует": { bg: "bg-gray-100 dark:bg-muted", text: "text-gray-600 dark:text-gray-300" },
  "отправка отчёта": { bg: "bg-teal-50 dark:bg-teal-500/15", text: "text-teal-700 dark:text-teal-300" },
  "сброс пароля": { bg: "bg-sky-50 dark:bg-sky-500/15", text: "text-sky-700 dark:text-sky-300" },
  "назначение прав": { bg: "bg-indigo-50 dark:bg-indigo-500/15", text: "text-indigo-700 dark:text-indigo-300" },
  "отзыв прав": { bg: "bg-orange-50 dark:bg-orange-500/15", text: "text-orange-700 dark:text-orange-300" },
  "блокировка": { bg: "bg-rose-100 dark:bg-rose-500/20", text: "text-rose-800 dark:text-rose-300" },
  "разблокировка": { bg: "bg-green-50 dark:bg-green-500/15", text: "text-green-700 dark:text-green-300" },
  "смена пароля": { bg: "bg-cyan-50 dark:bg-cyan-500/15", text: "text-cyan-700 dark:text-cyan-300" },
  "изменение профиля": { bg: "bg-slate-100 dark:bg-slate-500/20", text: "text-slate-700 dark:text-slate-300" },
  "изменение ролей": { bg: "bg-purple-50 dark:bg-purple-500/15", text: "text-purple-700 dark:text-purple-300" },
  "назначение замещения": { bg: "bg-fuchsia-50 dark:bg-fuchsia-500/15", text: "text-fuchsia-700 dark:text-fuchsia-300" },
  "снятие замещения": { bg: "bg-stone-100 dark:bg-stone-500/20", text: "text-stone-700 dark:text-stone-300" },
};

export const AUDIT_OBJECT_LABEL: Record<AuditObjectType, string> = {
  "акция": "Акция",
  "строка": "Строка",
  "отчёт": "Отчёт",
  "план": "План",
  "пользователь": "Пользователь",
};

/** One immutable entry in the action log. */
export interface AuditEvent {
  /** Monospace id, e.g. AUD-0007. */
  id: string;
  /** ФИО (or a role label when no person is attributed). */
  user: string;
  role: PromoRole;
  at: Date;
  action: AuditActionType;
  objectType: AuditObjectType;
  /** The object's human label — campaign name, line nomenclature, report name. */
  objectLabel: string;
  /** № промо / campaign the entry belongs to (for the «акция» chip + grouping). */
  campaignId?: string;
  /** Status transition, when the action changed a status (Appendix-A strings). */
  statusFrom?: string;
  statusTo?: string;
  comment?: string;
  /** Для журнала конкретного пользователя (E-4) — id затронутой учётки. */
  targetUserId?: string;
}

// A curated, seed-consistent action log. Dates align with the version chains and
// campaign statuses used by the other screens; users/roles match CATEGORY_MANAGERS
// and the role taxonomy. Ordered oldest-first here; `buildAuditLog` returns it
// newest-first.
const AUDIT_EVENTS_SEED: Omit<AuditEvent, "id">[] = [
  // ── PR-2026-003 «1+1 на мелкую бытовую технику» — full cycle incl. a LATE report send ──
  {
    user: "Директор маркетинга",
    role: "Директор маркетинга",
    at: new Date(2026, 7, 28, 10, 5),
    action: "создание",
    objectType: "план",
    objectLabel: "Чёрная пятница 2026 / план Q4",
    campaignId: "PR-2026-001",
    comment: "Создан план промо-акций на IV квартал.",
  },
  {
    user: "Коммерческий директор",
    role: "Коммерческий директор",
    at: new Date(2026, 7, 31, 16, 20),
    action: "согласование",
    objectType: "план",
    objectLabel: "План Q4 — распределение по категориям",
    campaignId: "PR-2026-001",
    statusFrom: "На согл. с КД",
    statusTo: "На согл. с ОД",
  },
  {
    user: "Операционный директор",
    role: "Операционный директор",
    at: new Date(2026, 8, 1, 9, 40),
    action: "согласование",
    objectType: "план",
    objectLabel: "План Q4",
    campaignId: "PR-2026-001",
    statusFrom: "На согл. с ОД",
    statusTo: "Утверждён",
  },
  {
    user: "Каримов Шохрух",
    role: "Категорийный менеджер (КМ)",
    at: new Date(2026, 8, 22, 17, 48),
    action: "отправка на согласование",
    objectType: "акция",
    objectLabel: "1+1 на мелкую бытовую технику",
    campaignId: "PR-2026-003",
    statusFrom: "Не заполнено",
    statusTo: "На согласовании у старшего КМ",
  },
  {
    user: "Исмаилов Жасур",
    role: "Старший КМ",
    at: new Date(2026, 8, 23, 11, 15),
    action: "согласование",
    objectType: "акция",
    objectLabel: "1+1 на мелкую бытовую технику",
    campaignId: "PR-2026-003",
    statusFrom: "На согласовании у старшего КМ",
    statusTo: "На согласовании у коммерческого директора",
  },
  {
    user: "Коммерческий директор",
    role: "Коммерческий директор",
    at: new Date(2026, 8, 23, 18, 30),
    action: "согласование",
    objectType: "акция",
    objectLabel: "1+1 на мелкую бытовую технику",
    campaignId: "PR-2026-003",
    statusFrom: "На согласовании у коммерческого директора",
    statusTo: "Согласовано КД",
  },
  {
    user: "Коммерческий директор",
    role: "Коммерческий директор",
    at: new Date(2026, 8, 22, 18, 0),
    action: "отправка отчёта",
    objectType: "отчёт",
    objectLabel: "Отчёт смежным отделам — 1+1 на мелкую бытовую технику",
    campaignId: "PR-2026-003",
    comment: "Отправлено с просрочкой 8 кал. дн. (дедлайн 14.09).",
  },

  // ── PR-2026-001 «Чёрная пятница 2026» — versions + a КМ correction ──
  {
    user: "Алиев Бекзод",
    role: "Категорийный менеджер (КМ)",
    at: new Date(2026, 10, 20, 17, 48),
    action: "отправка на согласование",
    objectType: "акция",
    objectLabel: "Чёрная пятница 2026",
    campaignId: "PR-2026-001",
    statusFrom: "Не заполнено",
    statusTo: "На согласовании у старшего КМ",
  },
  {
    user: "Исмаилов Жасур",
    role: "Старший КМ",
    at: new Date(2026, 10, 22, 9, 15),
    action: "изменение",
    objectType: "строка",
    objectLabel: "Кондиционер Artel 12000 BTU",
    campaignId: "PR-2026-001",
    comment: "Добавлена 1 позиция номенклатуры в акцию.",
  },
  {
    user: "Алиев Бекзод",
    role: "Категорийный менеджер (КМ)",
    at: new Date(2026, 10, 24, 14, 32),
    action: "изменение",
    objectType: "строка",
    objectLabel: "Samsung QLED 55\" QE55Q60D",
    campaignId: "PR-2026-001",
    comment: "Новая цена 7 990 000 → 7 640 000 сум; скидка 11% → 15%.",
  },
  {
    user: "Коммерческий директор",
    role: "Коммерческий директор",
    at: new Date(2026, 10, 25, 10, 0),
    action: "согласование",
    objectType: "акция",
    objectLabel: "Чёрная пятница 2026 — КМ Алиев Бекзод",
    campaignId: "PR-2026-001",
    statusFrom: "На согласовании у коммерческого директора",
    statusTo: "Согласовано КД",
  },
  {
    user: "Исмаилов Жасур",
    role: "Старший КМ",
    at: new Date(2026, 10, 24, 12, 10),
    action: "Не участвует",
    objectType: "акция",
    objectLabel: "Чёрная пятница 2026 — климатическая техника",
    campaignId: "PR-2026-001",
    statusFrom: "На согласовании у старшего КМ",
    statusTo: "Не участвует",
    comment: "Нет товарного остатка под акцию.",
  },

  // ── PR-2026-005 «Cashback на смартфоны» — отклонение с доработкой ──
  {
    user: "Каримов Шерзод",
    role: "Категорийный менеджер (КМ)",
    at: new Date(2026, 6, 18, 15, 25),
    action: "отправка на согласование",
    objectType: "акция",
    objectLabel: "Cashback на смартфоны",
    campaignId: "PR-2026-005",
    statusFrom: "Не заполнено",
    statusTo: "На согласовании у старшего КМ",
  },
  {
    user: "Исмаилов Жасур",
    role: "Старший КМ",
    at: new Date(2026, 6, 19, 9, 50),
    action: "отклонение",
    objectType: "строка",
    objectLabel: "iPhone 15 128GB",
    campaignId: "PR-2026-005",
    statusFrom: "На согласовании у старшего КМ",
    statusTo: "Переотправлено на корректировку КМ",
    comment: "Не заполнен прогноз продаж по 2 позициям — вернуть на доработку.",
  },

  // ── PR-2026-004 «Распродажа ТВ и аудио» — отмена ──
  {
    user: "Коммерческий директор",
    role: "Коммерческий директор",
    at: new Date(2026, 7, 18, 13, 5),
    action: "отмена",
    objectType: "акция",
    objectLabel: "Распродажа ТВ и аудио",
    campaignId: "PR-2026-004",
    statusFrom: "На согласовании у коммерческого директора",
    statusTo: "Отменена",
    comment: "Поставщик не подтвердил объём — акция отменена.",
  },

  // ── UN-2026-015 «Срочная скидка на холодильники» — внеплановая, отчёт + корректировка ──
  {
    user: "Юсупова Нигора",
    role: "Категорийный менеджер (КМ)",
    at: new Date(2026, 5, 3, 11, 30),
    action: "создание",
    objectType: "акция",
    objectLabel: "Срочная скидка на холодильники (внеплановая)",
    campaignId: "UN-2026-015",
    comment: "Создана внеплановая акция (№ присвоен системой).",
  },
  {
    user: "Юсупова Нигора",
    role: "Категорийный менеджер (КМ)",
    at: new Date(2026, 5, 5, 9, 15),
    action: "отправка отчёта",
    objectType: "отчёт",
    objectLabel: "Отчёт смежным отделам — Срочная скидка на холодильники",
    campaignId: "UN-2026-015",
    comment: "Первичная отправка в срок (дедлайн 08.06).",
  },
  {
    user: "Сотрудник маркетинга",
    role: "Сотрудник маркетинга",
    at: new Date(2026, 5, 11, 16, 40),
    action: "согласование",
    objectType: "отчёт",
    objectLabel: "Срочная скидка — повторное согласование изменений",
    campaignId: "UN-2026-015",
    comment: "Согласованы изменения после согласования (§11.8).",
  },
  {
    user: "Юсупова Нигора",
    role: "Категорийный менеджер (КМ)",
    at: new Date(2026, 5, 12, 10, 30),
    action: "отправка отчёта",
    objectType: "отчёт",
    objectLabel: "Отчёт смежным отделам — Срочная скидка (в. 2)",
    campaignId: "UN-2026-015",
    comment: "Инкрементальная отправка: изменена цена по 1 позиции, добавлена 1 позиция.",
  },

  // ── UN-2026-014 «Подарок к ноутбукам» — внеплановая, на согл. КД ──
  {
    user: "Тошматов Фаррух",
    role: "Категорийный менеджер (КМ)",
    at: new Date(2026, 6, 10, 14, 0),
    action: "создание",
    objectType: "акция",
    objectLabel: "Подарок к ноутбукам (внеплановая)",
    campaignId: "UN-2026-014",
    comment: "Создана внеплановая акция «Товар в подарок».",
  },
  {
    user: "Тошматов Фаррух",
    role: "Категорийный менеджер (КМ)",
    at: new Date(2026, 6, 12, 17, 30),
    action: "отправка на согласование",
    objectType: "акция",
    objectLabel: "Подарок к ноутбукам (внеплановая)",
    campaignId: "UN-2026-014",
    statusFrom: "На согласовании у старшего КМ",
    statusTo: "На согласовании у коммерческого директора",
  },
];

/** The action log, newest-first, with stable monospace ids (spec §11.9). */
export function buildAuditLog(): AuditEvent[] {
  const ordered = [...AUDIT_EVENTS_SEED].sort(
    (a, b) => b.at.getTime() - a.at.getTime()
  );
  // Ids are assigned oldest-first so AUD-0001 is the earliest event.
  const total = ordered.length;
  return ordered.map((e, i) => ({
    ...e,
    id: `AUD-${String(total - i).padStart(4, "0")}`,
  }));
}

// ── Свод контрольных событий (control-events timeline) ─────────────────────────

export type ControlMilestoneState = "completed" | "current" | "pending";

/** One node in a campaign's control-events timeline. */
export interface ControlMilestone {
  key: string;
  label: string;
  date?: Date;
  state: ControlMilestoneState;
  /** >0 → red breach node. */
  overdueDays?: number;
  /** Participant the breach is attributed to. */
  responsible?: string;
  note?: string;
}

export const KM_FILL_SLA_CALENDAR_DAYS = 21; // «заполнение КМ»: start − 21 кал. дн. (mock)

/**
 * Build a campaign's milestone timeline (spec §11.9): план → отправка данных КМ →
 * согл./откл. старшим КМ → согл./откл. КД → «Не участвует» → отправка отчёта. The
 * report-send node is marked overdue against the 17-кал.-дн. report deadline.
 */
export function buildControlTimeline(
  campaignId: string,
  ref: Date = new Date()
): ControlMilestone[] {
  const campaign = getCampaignById(campaignId);
  if (!campaign) return [];

  // Use ONLY a genuinely seeded version chain for the «отправка данных» date — the
  // generic single-version fallback is dated 2026-09-01 for every unseeded campaign
  // and would otherwise produce nonsensical breaches against each campaign's own dates.
  const seededVersions = CAMPAIGN_VERSIONS[campaignId];
  const firstSend = seededVersions?.find(
    (v) => v.changeType === "Первичная отправка"
  );
  const kmName =
    getCategoryManager(campaign.participatingKmIds[0] ?? "")?.name ??
    "Категорийный менеджер";
  const statuses = Object.values(campaign.kmStatuses);
  const anyAccepted = statuses.includes("Согласовано КД");
  const anyAtKd =
    campaign.status === "На согласовании у коммерческого директора" ||
    statuses.includes("На согласовании у коммерческого директора");
  const anySeniorDone = anyAtKd || anyAccepted;
  const rejected =
    campaign.status === "Переотправлено на корректировку КМ" ||
    statuses.includes("Переотправлено на корректировку КМ") ||
    statuses.includes("Не заполнено");
  const anyNonPart = statuses.includes("Не участвует");
  const sent = isApprovedCampaign(campaign);
  // Data was submitted if a version was sent OR any status moved past «не заполнено»
  // OR it was bounced back («Переотправлено») — independent of a seeded version date.
  const dataSent =
    !!firstSend ||
    sent ||
    anySeniorDone ||
    anyNonPart ||
    campaign.status === "Переотправлено на корректировку КМ" ||
    statuses.includes("На согласовании у старшего КМ");

  const milestones: ControlMilestone[] = [];

  // 1) Создание / утверждение плана (planned campaigns only)
  if (campaign.planned) {
    milestones.push({
      key: "plan",
      label: "Утверждение плана",
      date: firstSend ? addCalendarDays(firstSend.date, -7) : undefined,
      state: campaign.planStatus === "Утверждён" ? "completed" : "current",
    });
  } else {
    milestones.push({
      key: "plan",
      label: "Создание внеплановой акции",
      date: firstSend ? addCalendarDays(firstSend.date, -2) : undefined,
      state: "completed",
    });
  }

  // 2) Отправка данных КМ — breach vs the «заполнение КМ» deadline.
  const fillDeadline = addCalendarDays(
    campaign.startDate,
    -KM_FILL_SLA_CALENDAR_DAYS
  );
  const dataSentOverdue =
    firstSend && firstSend.date > fillDeadline
      ? getOverdueDays(fillDeadline, firstSend.date)
      : 0;
  milestones.push({
    key: "data-km",
    label: "Отправка данных КМ",
    date: firstSend?.date,
    state: dataSent ? "completed" : "current",
    overdueDays: dataSentOverdue,
    responsible: dataSentOverdue > 0 ? kmName : undefined,
    note: dataSentOverdue > 0 ? "Данные поданы после дедлайна заполнения." : undefined,
  });

  // 3) Согласование / отклонение старшим КМ
  milestones.push({
    key: "senior",
    label: rejected && !anySeniorDone ? "Отклонение старшим КМ" : "Согласование старшим КМ",
    state: anySeniorDone ? "completed" : rejected ? "completed" : dataSent ? "current" : "pending",
    note: rejected && !anySeniorDone ? "Возврат КМ на доработку." : undefined,
  });

  // 4) Согласование / отклонение КД
  milestones.push({
    key: "kd",
    label: anyAccepted || sent ? "Согласование КД" : "Согласование КД",
    state: anyAccepted || sent ? "completed" : anyAtKd ? "current" : "pending",
  });

  // 5) Установка «Не участвует» (only when present)
  if (anyNonPart) {
    milestones.push({
      key: "non-part",
      label: "Установка «Не участвует»",
      state: "completed",
      note: "По части КМ участие исключено.",
    });
  }

  // 6) Отправка отчёта смежным отделам — breach vs the 17-кал.-дн. report deadline.
  const reportDeadline = getReportDeadline(campaign);
  const reportSentAt = sent ? getReportSentAt(campaign) : undefined;
  const reportOverdue =
    reportSentAt && reportSentAt > reportDeadline
      ? getOverdueDays(reportDeadline, reportSentAt)
      : 0;
  milestones.push({
    key: "report",
    label: "Отправка отчёта смежным отделам",
    date: reportSentAt,
    state: sent ? "completed" : "pending",
    overdueDays: reportOverdue,
    responsible: reportOverdue > 0 ? kmName : undefined,
    note: reportOverdue > 0 ? "Отчёт отправлен после дедлайна (старт − 17 кал. дн.)." : undefined,
  });

  // Cancellation supersedes — append a terminal node.
  if (campaign.cancelled) {
    milestones.push({
      key: "cancel",
      label: "Отмена акции",
      state: "completed",
      note: campaign.cancelReason,
    });
  }

  return milestones;
}

export interface AuditSummary {
  /** Campaigns that have a control timeline (planned + unplanned with versions). */
  campaignCount: number;
  /** Count of breached (overdue) milestones across all campaigns. */
  overdueEvents: number;
  /** Average approval time in WORKING days (отправка данных КМ → согласование КД). */
  avgApprovalWorkingDays: number | null;
}

/** Campaigns that appear in the control-events view, newest start first. */
export function getAuditCampaigns(): PromoCampaign[] {
  return [...CAMPAIGNS].sort(
    (a, b) => b.startDate.getTime() - a.startDate.getTime()
  );
}

/** Summary strip for the control-events view (spec §11.9). */
export function auditSummary(ref: Date = new Date()): AuditSummary {
  const campaigns = getAuditCampaigns();
  let overdueEvents = 0;
  const approvalSpans: number[] = [];

  for (const c of campaigns) {
    const milestones = buildControlTimeline(c.id, ref);
    overdueEvents += milestones.filter((m) => (m.overdueDays ?? 0) > 0).length;

    // Approval span: «отправка данных КМ» → «согласование КД» (when both reached).
    const dataKm = milestones.find((m) => m.key === "data-km");
    const kd = milestones.find((m) => m.key === "kd");
    if (
      dataKm?.date &&
      kd?.state === "completed"
    ) {
      // КД approval date isn't stored per-campaign; approximate it from the
      // latest version date (the most recent activity), bounded to ≥ the КМ send.
      const versions = getCampaignVersions(c.id);
      const kdDate = versions[0]?.date ?? dataKm.date;
      const span = workingDaysBetween(dataKm.date, kdDate);
      if (span > 0) approvalSpans.push(span);
    }
  }

  const avg =
    approvalSpans.length > 0
      ? Math.round(
          (approvalSpans.reduce((s, n) => s + n, 0) / approvalSpans.length) * 10
        ) / 10
      : null;

  return {
    campaignCount: campaigns.length,
    overdueEvents,
    avgApprovalWorkingDays: avg,
  };
}
