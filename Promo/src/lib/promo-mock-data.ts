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
    kmStatuses: { [input.kmId]: "Не заполнено / Ожидание корректировки от КМ" },
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

  // PR-2026-003 «1+1 на мелкую бытовую технику» (1+1, gift type) — km-4.
  // Already «Согласовано и отправлено смежным отделам», so edits here are tracked
  // as edit-after-approval corrections (§5.1) — the values match Phase-1 версии.
  { id: "L-0015", campaignId: "PR-2026-003", kmId: "km-4", nomenclatureId: "1C-10017", off: 0.16, forecast: 40, regular: 14, gift: "1C-10018" },
  { id: "L-0016", campaignId: "PR-2026-003", kmId: "km-4", nomenclatureId: "1C-10016", off: 0.14, forecast: 25, gift: "1C-10018", advKm: true },

  // PR-2026-005 «Cashback на смартфоны» (Переотправлено на корректировку) — km-3
  { id: "L-0008", campaignId: "PR-2026-005", kmId: "km-3", nomenclatureId: "1C-10013", off: 0.16, forecast: 300, rejected: true, rejectComment: "Уточните остаток — расходится с данными 1С." },

  // UN-2026-014 «Подарок к ноутбукам (внеплановая)» (Товар в подарок) — km-5
  { id: "L-0009", campaignId: "UN-2026-014", kmId: "km-5", nomenclatureId: "1C-10022", off: 0.05, forecast: 15, gift: "1C-10018", utp: "Мультиварка в подарок к каждому MacBook" },

  // Review-queue coverage (S3): a line set for every (Promo + КМ) pair that is
  // pending a reviewer, so the согласование snapshot is never empty.
  // PR-2026-002 km-2 (at Старший КМ) — Холодильники.
  { id: "L-0010", campaignId: "PR-2026-002", kmId: "km-2", nomenclatureId: "1C-10007", off: 0.1, forecast: 30, regular: 12 },
  { id: "L-0011", campaignId: "PR-2026-002", kmId: "km-2", nomenclatureId: "1C-10010", off: 0.13, forecast: 18 },
  // PR-2026-006 km-6 (at Старший КМ) — Климатическая; L-0013 missing forecast → red required marker.
  { id: "L-0012", campaignId: "PR-2026-006", kmId: "km-6", nomenclatureId: "1C-10027", off: 0.15, forecast: 55, advKm: true },
  { id: "L-0013", campaignId: "PR-2026-006", kmId: "km-6", nomenclatureId: "1C-10029", off: 0.2 },
  // PR-2026-007 km-5 (at Старший КМ) — Ноутбуки.
  { id: "L-0014", campaignId: "PR-2026-007", kmId: "km-5", nomenclatureId: "1C-10023", off: 0.07, forecast: 40 },

  // S4 Phase 3 — cancellation demos.
  // PR-2026-004 «Распродажа ТВ и аудио» is a CANCELLED campaign (status «Отменена»):
  // seed it with lines so the «Скрыть отменённое» switch visibly hides/shows it.
  { id: "L-0017", campaignId: "PR-2026-004", kmId: "km-1", nomenclatureId: "1C-10001", off: 0.22, forecast: 80 },
  { id: "L-0018", campaignId: "PR-2026-004", kmId: "km-1", nomenclatureId: "1C-10004", off: 0.25, forecast: 110 },
  // UN-2026-015 «Срочная скидка на холодильники» is APPROVED («…отправлено смежным
  // отделам»): one normal line + one already-requested removal (removalPending) so
  // the КД «Подтвердить исключение» path is demoable on load.
  { id: "L-0019", campaignId: "UN-2026-015", kmId: "km-2", nomenclatureId: "1C-10008", off: 0.11, forecast: 22 },
  { id: "L-0020", campaignId: "UN-2026-015", kmId: "km-2", nomenclatureId: "1C-10009", off: 0.09, forecast: 30, removalPending: true, removalReason: "Снят с продаж поставщиком — исключить из акции." },
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
    removalPending: s.removalPending,
    removed: s.removed,
    removalReason: s.removalReason,
    removalRequestedBy: s.removalPending || s.removed ? "Категорийный менеджер (КМ)" : undefined,
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
          : `Дубль: уже в акции ${dup.promoId} (импортируется с отметкой «дубль»).`
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
 * For a «Не участвует» request, КД approval finalises the КМ as released
 * («Не участвует») rather than «Принято коммерческим директором».
 */
export function approvedKmStatusFor(
  actor: PromoRole,
  kind: ReviewKind = "data"
): KmStatus {
  if (actor === "Старший КМ") return "Согласовано старшим КМ (ожидает КД)";
  return kind === "non-participation"
    ? "Не участвует"
    : "Принято коммерческим директором";
}

/** Rejecting ANY line returns the WHOLE КМ set here (spec §4.5.2). */
export const REJECTED_KM_STATUS: KmStatus =
  "Не заполнено / Ожидание корректировки от КМ";

export function reviewItemId(campaignId: string, kmId: string): string {
  return `${campaignId}~${kmId}`;
}

/** Which reviewer must act on a KM-level status (undefined = not in any queue). */
export function reviewerForKmStatus(status: KmStatus): PromoRole | undefined {
  switch (status) {
    case "На согласовании у старшего КМ":
      return "Старший КМ";
    case "Согласовано старшим КМ (ожидает КД)":
    case "На согласовании у коммерческого директора":
      return "Коммерческий директор";
    default:
      // «Принято КД», «Не заполнено / на корректировке», «Не участвует» — terminal here.
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
  // PR-2026-007 km-5: at Старший КМ, breached (campaign also fill-overdue).
  "PR-2026-007~km-5": { days: 3 },
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

/** A КМ-level status counts as a FINAL decision (campaign may advance past it). */
export function isFinalKmDecision(status: KmStatus): boolean {
  return status === "Принято коммерческим директором" || status === "Не участвует";
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
  return status !== "Не участвует" && status !== "Принято коммерческим директором";
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
  { field: "giftStock", label: "Остаток подарка", kind: "number" },
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
