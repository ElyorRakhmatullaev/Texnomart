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
