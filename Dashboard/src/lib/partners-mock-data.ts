export type PartnerStatus = "active" | "deactivated";
export type PartnerType = "bnpl" | "bank" | "mfo";
export type ApiStatus = "online" | "offline" | "degraded";

export const PARTNER_STATUSES: Record<
  PartnerStatus,
  { label: string; bg: string; text: string }
> = {
  active: { label: "Активен", bg: "bg-green-100", text: "text-green-700" },
  deactivated: { label: "Деактивирован", bg: "bg-gray-100", text: "text-gray-700" },
};

export const PARTNER_TYPES: Record<
  PartnerType,
  { label: string }
> = {
  bnpl: { label: "BNPL" },
  bank: { label: "Банк" },
  mfo: { label: "МФО" },
};

export const API_STATUSES: Record<
  ApiStatus,
  { label: string; bg: string; text: string }
> = {
  online: { label: "Онлайн", bg: "bg-green-500", text: "text-white" },
  offline: { label: "Офлайн", bg: "bg-red-500", text: "text-white" },
  degraded: { label: "Деградация", bg: "bg-yellow-500", text: "text-gray-900" },
};

export interface PartnerRegion {
  name: string;
  enabled: boolean;
}

export interface PartnerTerms {
  availableMonths: number[];
  minAmount: number;
  maxAmount: number;
  minAge: number;
  maxAge: number;
}

export interface CommissionConfig {
  type: "fixed" | "percent" | "hybrid";
  fixedAmount?: number;
  percent?: number;
  hybridFixed?: number;
  hybridPercent?: number;
}

export interface Settlement {
  id: string;
  period: string;
  issued: number;
  commission: number;
  paid: number;
  balance: number;
  status: "paid" | "pending" | "overdue";
}

export interface ApiConfig {
  productionUrl: string;
  sandboxUrl: string;
  apiKey: string;
  secret: string;
  webhookUrl: string;
  schedule: { day: string; from: string; to: string }[];
  timeoutMs: number;
  retryCount: number;
  retryDelayMs: number;
}

export interface PartnerStats {
  totalApplications: number;
  approved: number;
  conversionRate: number;
  avgCheck: number;
  dailyData: { date: string; applications: number; approved: number }[];
  statusDistribution: { status: string; count: number; color: string }[];
  hourlyData: { hour: number; count: number }[];
}

export interface PartnerChange {
  id: string;
  date: Date;
  user: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface Partner {
  id: string;
  name: string;
  legalName: string;
  description: string;
  logoInitials: string;
  logoColor: string;
  type: PartnerType;
  status: PartnerStatus;
  apiStatus: ApiStatus;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  sla: string;
  applicationsToday: number;
  conversionRate: number;
  avgScoringTime: number;
  regions: PartnerRegion[];
  categories: string[];
  terms: PartnerTerms;
  commission: CommissionConfig;
  settlements: Settlement[];
  apiConfig: ApiConfig;
  stats: PartnerStats;
  changes: PartnerChange[];
}

const ALL_REGIONS: string[] = [
  "Ташкент",
  "Ташкентская обл.",
  "Самарканд",
  "Бухара",
  "Фергана",
  "Андижан",
  "Наманган",
  "Хорезм",
  "Навои",
  "Кашкадарья",
  "Сурхандарья",
  "Джизак",
  "Сырдарья",
  "Каракалпакстан",
];

const ALL_CATEGORIES: string[] = [
  "Смартфоны",
  "Ноутбуки",
  "Телевизоры",
  "Бытовая техника",
  "Климатическая техника",
  "Аудио и видео",
  "Аксессуары",
  "Мебель",
  "Спорт",
];

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function generateDailyData(base: number): { date: string; applications: number; approved: number }[] {
  const data: { date: string; applications: number; approved: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const apps = Math.floor(base * (0.7 + Math.random() * 0.6));
    data.push({
      date: `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`,
      applications: apps,
      approved: Math.floor(apps * (0.4 + Math.random() * 0.3)),
    });
  }
  return data;
}

function generateHourlyData(): { hour: number; count: number }[] {
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: h >= 9 && h <= 21 ? Math.floor(5 + Math.random() * 25) : Math.floor(Math.random() * 5),
  }));
}

function makeRegions(enabledNames: string[]): PartnerRegion[] {
  return ALL_REGIONS.map((name) => ({
    name,
    enabled: enabledNames.includes(name),
  }));
}

function makeSchedule(weekdayFrom: string, weekdayTo: string, satFrom: string, satTo: string, sunFrom?: string, sunTo?: string): ApiConfig["schedule"] {
  return WEEK_DAYS.map((day) => {
    if (day === "Сб") return { day, from: satFrom, to: satTo };
    if (day === "Вс") return { day, from: sunFrom ?? "", to: sunTo ?? "" };
    return { day, from: weekdayFrom, to: weekdayTo };
  });
}

function makeChanges(): PartnerChange[] {
  return [
    { id: "ch-1", date: new Date(2026, 4, 20, 10, 15), user: "Сардор Мавлянов", field: "Статус", oldValue: "Деактивирован", newValue: "Активен" },
    { id: "ch-2", date: new Date(2026, 4, 18, 14, 32), user: "Алина Петрова", field: "Максимальная сумма", oldValue: "30 000 000 UZS", newValue: "50 000 000 UZS" },
    { id: "ch-3", date: new Date(2026, 4, 15, 9, 45), user: "Сардор Мавлянов", field: "API URL", oldValue: "https://api-v1.example.com", newValue: "https://api-v2.example.com" },
    { id: "ch-4", date: new Date(2026, 4, 10, 16, 20), user: "Бекзод Каримов", field: "Регионы покрытия", oldValue: "8 регионов", newValue: "12 регионов" },
    { id: "ch-5", date: new Date(2026, 3, 28, 11, 0), user: "Сардор Мавлянов", field: "Комиссия", oldValue: "2.5%", newValue: "2.8%" },
  ];
}

export const MOCK_PARTNERS: Partner[] = [
  {
    id: "P-001",
    name: "Alif Nasiya",
    legalName: 'ООО "ALIF TECH"',
    description: "Ведущий BNPL-провайдер в Узбекистане. Партнёр с 2022 года.",
    logoInitials: "AN",
    logoColor: "bg-emerald-500",
    type: "bnpl",
    status: "active",
    apiStatus: "online",
    contactPerson: "Рахматуллаев Азиз",
    contactEmail: "partners@alif.uz",
    contactPhone: "+998 71 200-00-01",
    sla: "60 сек",
    applicationsToday: 142,
    conversionRate: 68.4,
    avgScoringTime: 12,
    regions: makeRegions(["Ташкент", "Ташкентская обл.", "Самарканд", "Бухара", "Фергана", "Андижан", "Наманган", "Хорезм", "Навои", "Кашкадарья", "Сурхандарья", "Джизак"]),
    categories: ["Смартфоны", "Ноутбуки", "Телевизоры", "Бытовая техника", "Климатическая техника", "Аудио и видео", "Аксессуары"],
    terms: {
      availableMonths: [3, 6, 9, 12, 18, 24],
      minAmount: 500_000,
      maxAmount: 50_000_000,
      minAge: 21,
      maxAge: 65,
    },
    commission: { type: "percent", percent: 2.8 },
    settlements: [
      { id: "s-1", period: "Апрель 2026", issued: 4_200_000_000, commission: 117_600_000, paid: 117_600_000, balance: 0, status: "paid" },
      { id: "s-2", period: "Март 2026", issued: 3_850_000_000, commission: 107_800_000, paid: 107_800_000, balance: 0, status: "paid" },
      { id: "s-3", period: "Май 2026", issued: 2_100_000_000, commission: 58_800_000, paid: 0, balance: 58_800_000, status: "pending" },
    ],
    apiConfig: {
      productionUrl: "https://api.alif.uz/v2/scoring",
      sandboxUrl: "https://sandbox.alif.uz/v2/scoring",
      apiKey: "ak_live_8f3a2b1c4d5e6f7a8b9c0d1e",
      secret: "sk_live_1a2b3c4d5e6f7a8b9c0d1e2f",
      webhookUrl: "https://texnomart.uz/webhooks/alif",
      schedule: makeSchedule("09:00", "22:00", "10:00", "20:00", "10:00", "18:00"),
      timeoutMs: 30_000,
      retryCount: 3,
      retryDelayMs: 1_000,
    },
    stats: {
      totalApplications: 12_480,
      approved: 8_536,
      conversionRate: 68.4,
      avgCheck: 4_200_000,
      dailyData: generateDailyData(45),
      statusDistribution: [
        { status: "Одобрено", count: 8536, color: "#10B981" },
        { status: "Отклонено", count: 2744, color: "#EF4444" },
        { status: "На рассмотрении", count: 1200, color: "#F59E0B" },
      ],
      hourlyData: generateHourlyData(),
    },
    changes: makeChanges(),
  },
  {
    id: "P-002",
    name: "Anorbank",
    legalName: 'АКБ "Анор" ООО',
    description: "Коммерческий банк с широкой сетью отделений.",
    logoInitials: "AB",
    logoColor: "bg-blue-600",
    type: "bank",
    status: "active",
    apiStatus: "online",
    contactPerson: "Хасанова Нилуфар",
    contactEmail: "bnpl@anorbank.uz",
    contactPhone: "+998 71 200-00-02",
    sla: "90 сек",
    applicationsToday: 87,
    conversionRate: 54.2,
    avgScoringTime: 28,
    regions: makeRegions(["Ташкент", "Ташкентская обл.", "Самарканд", "Бухара", "Фергана", "Андижан"]),
    categories: ["Смартфоны", "Ноутбуки", "Телевизоры", "Бытовая техника"],
    terms: {
      availableMonths: [3, 6, 12],
      minAmount: 1_000_000,
      maxAmount: 30_000_000,
      minAge: 23,
      maxAge: 60,
    },
    commission: { type: "fixed", fixedAmount: 150_000 },
    settlements: [
      { id: "s-4", period: "Апрель 2026", issued: 2_610_000_000, commission: 87_000_000, paid: 87_000_000, balance: 0, status: "paid" },
      { id: "s-5", period: "Май 2026", issued: 1_305_000_000, commission: 43_500_000, paid: 0, balance: 43_500_000, status: "pending" },
    ],
    apiConfig: {
      productionUrl: "https://api.anorbank.uz/bnpl/v1",
      sandboxUrl: "https://sandbox.anorbank.uz/bnpl/v1",
      apiKey: "ak_live_2c3d4e5f6a7b8c9d0e1f2a3b",
      secret: "sk_live_3d4e5f6a7b8c9d0e1f2a3b4c",
      webhookUrl: "https://texnomart.uz/webhooks/anorbank",
      schedule: makeSchedule("09:00", "21:00", "09:00", "18:00"),
      timeoutMs: 45_000,
      retryCount: 2,
      retryDelayMs: 2_000,
    },
    stats: {
      totalApplications: 6_240,
      approved: 3_382,
      conversionRate: 54.2,
      avgCheck: 3_100_000,
      dailyData: generateDailyData(28),
      statusDistribution: [
        { status: "Одобрено", count: 3382, color: "#10B981" },
        { status: "Отклонено", count: 2234, color: "#EF4444" },
        { status: "На рассмотрении", count: 624, color: "#F59E0B" },
      ],
      hourlyData: generateHourlyData(),
    },
    changes: makeChanges(),
  },
  {
    id: "P-003",
    name: "Uzum Nasiya",
    legalName: 'ООО "UZUM TECHNOLOGIES"',
    description: "Цифровая платформа рассрочки от экосистемы Uzum.",
    logoInitials: "UN",
    logoColor: "bg-violet-600",
    type: "bnpl",
    status: "active",
    apiStatus: "degraded",
    contactPerson: "Мирзаев Тимур",
    contactEmail: "b2b@uzum.uz",
    contactPhone: "+998 71 200-00-03",
    sla: "45 сек",
    applicationsToday: 203,
    conversionRate: 72.1,
    avgScoringTime: 8,
    regions: makeRegions(ALL_REGIONS),
    categories: ["Смартфоны", "Ноутбуки", "Телевизоры", "Бытовая техника", "Климатическая техника", "Аудио и видео", "Аксессуары", "Мебель", "Спорт"],
    terms: {
      availableMonths: [2, 3, 4, 6, 9, 12, 18, 24, 36],
      minAmount: 300_000,
      maxAmount: 80_000_000,
      minAge: 20,
      maxAge: 70,
    },
    commission: { type: "hybrid", hybridFixed: 50_000, hybridPercent: 1.5 },
    settlements: [
      { id: "s-6", period: "Апрель 2026", issued: 6_090_000_000, commission: 141_350_000, paid: 141_350_000, balance: 0, status: "paid" },
      { id: "s-7", period: "Май 2026", issued: 3_248_000_000, commission: 78_720_000, paid: 0, balance: 78_720_000, status: "pending" },
    ],
    apiConfig: {
      productionUrl: "https://api.uzum.uz/nasiya/v3",
      sandboxUrl: "https://sandbox.uzum.uz/nasiya/v3",
      apiKey: "ak_live_4e5f6a7b8c9d0e1f2a3b4c5d",
      secret: "sk_live_5f6a7b8c9d0e1f2a3b4c5d6e",
      webhookUrl: "https://texnomart.uz/webhooks/uzum",
      schedule: makeSchedule("08:00", "23:00", "08:00", "22:00", "09:00", "20:00"),
      timeoutMs: 20_000,
      retryCount: 5,
      retryDelayMs: 500,
    },
    stats: {
      totalApplications: 18_920,
      approved: 13_641,
      conversionRate: 72.1,
      avgCheck: 5_400_000,
      dailyData: generateDailyData(65),
      statusDistribution: [
        { status: "Одобрено", count: 13641, color: "#10B981" },
        { status: "Отклонено", count: 3216, color: "#EF4444" },
        { status: "На рассмотрении", count: 2063, color: "#F59E0B" },
      ],
      hourlyData: generateHourlyData(),
    },
    changes: makeChanges(),
  },
  {
    id: "P-004",
    name: "Iman",
    legalName: 'ООО "IMAN FINANCE"',
    description: "Исламское финансирование без процентов. Мурабаха-модель.",
    logoInitials: "IM",
    logoColor: "bg-teal-600",
    type: "mfo",
    status: "active",
    apiStatus: "online",
    contactPerson: "Абдуллаев Фаррух",
    contactEmail: "partners@iman.uz",
    contactPhone: "+998 71 200-00-04",
    sla: "120 сек",
    applicationsToday: 34,
    conversionRate: 61.8,
    avgScoringTime: 45,
    regions: makeRegions(["Ташкент", "Ташкентская обл.", "Самарканд", "Фергана"]),
    categories: ["Смартфоны", "Ноутбуки", "Бытовая техника"],
    terms: {
      availableMonths: [3, 6, 12],
      minAmount: 500_000,
      maxAmount: 20_000_000,
      minAge: 21,
      maxAge: 55,
    },
    commission: { type: "percent", percent: 3.2 },
    settlements: [
      { id: "s-8", period: "Апрель 2026", issued: 680_000_000, commission: 21_760_000, paid: 21_760_000, balance: 0, status: "paid" },
      { id: "s-9", period: "Май 2026", issued: 340_000_000, commission: 10_880_000, paid: 0, balance: 10_880_000, status: "pending" },
    ],
    apiConfig: {
      productionUrl: "https://api.iman.uz/v1/scoring",
      sandboxUrl: "https://test.iman.uz/v1/scoring",
      apiKey: "ak_live_6a7b8c9d0e1f2a3b4c5d6e7f",
      secret: "sk_live_7b8c9d0e1f2a3b4c5d6e7f8a",
      webhookUrl: "https://texnomart.uz/webhooks/iman",
      schedule: makeSchedule("09:00", "18:00", "09:00", "15:00"),
      timeoutMs: 60_000,
      retryCount: 2,
      retryDelayMs: 3_000,
    },
    stats: {
      totalApplications: 3_120,
      approved: 1_928,
      conversionRate: 61.8,
      avgCheck: 3_800_000,
      dailyData: generateDailyData(12),
      statusDistribution: [
        { status: "Одобрено", count: 1928, color: "#10B981" },
        { status: "Отклонено", count: 874, color: "#EF4444" },
        { status: "На рассмотрении", count: 318, color: "#F59E0B" },
      ],
      hourlyData: generateHourlyData(),
    },
    changes: makeChanges(),
  },
  {
    id: "P-005",
    name: "Multicard",
    legalName: 'ООО "MULTICARD PAYMENT"',
    description: "Мультибанковская карточная платформа рассрочки.",
    logoInitials: "MC",
    logoColor: "bg-orange-500",
    type: "bnpl",
    status: "active",
    apiStatus: "online",
    contactPerson: "Юлдашев Бобур",
    contactEmail: "tech@multicard.uz",
    contactPhone: "+998 71 200-00-05",
    sla: "30 сек",
    applicationsToday: 98,
    conversionRate: 58.9,
    avgScoringTime: 15,
    regions: makeRegions(["Ташкент", "Ташкентская обл.", "Самарканд", "Бухара", "Фергана", "Наманган", "Хорезм", "Навои"]),
    categories: ["Смартфоны", "Ноутбуки", "Телевизоры", "Бытовая техника", "Климатическая техника"],
    terms: {
      availableMonths: [3, 6, 12, 24],
      minAmount: 500_000,
      maxAmount: 40_000_000,
      minAge: 22,
      maxAge: 63,
    },
    commission: { type: "percent", percent: 2.5 },
    settlements: [
      { id: "s-10", period: "Апрель 2026", issued: 3_920_000_000, commission: 98_000_000, paid: 98_000_000, balance: 0, status: "paid" },
      { id: "s-11", period: "Май 2026", issued: 1_960_000_000, commission: 49_000_000, paid: 0, balance: 49_000_000, status: "pending" },
    ],
    apiConfig: {
      productionUrl: "https://api.multicard.uz/bnpl/v2",
      sandboxUrl: "https://sandbox.multicard.uz/bnpl/v2",
      apiKey: "ak_live_8c9d0e1f2a3b4c5d6e7f8a9b",
      secret: "sk_live_9d0e1f2a3b4c5d6e7f8a9b0c",
      webhookUrl: "https://texnomart.uz/webhooks/multicard",
      schedule: makeSchedule("08:00", "23:00", "09:00", "21:00", "10:00", "19:00"),
      timeoutMs: 15_000,
      retryCount: 4,
      retryDelayMs: 800,
    },
    stats: {
      totalApplications: 8_640,
      approved: 5_089,
      conversionRate: 58.9,
      avgCheck: 3_600_000,
      dailyData: generateDailyData(32),
      statusDistribution: [
        { status: "Одобрено", count: 5089, color: "#10B981" },
        { status: "Отклонено", count: 2765, color: "#EF4444" },
        { status: "На рассмотрении", count: 786, color: "#F59E0B" },
      ],
      hourlyData: generateHourlyData(),
    },
    changes: makeChanges(),
  },
  {
    id: "P-006",
    name: "Asia Alliance",
    legalName: 'АКБ "Asia Alliance Bank"',
    description: "Один из старейших частных банков Узбекистана.",
    logoInitials: "AA",
    logoColor: "bg-red-600",
    type: "bank",
    status: "active",
    apiStatus: "offline",
    contactPerson: "Ким Виктория",
    contactEmail: "digital@asiaalliance.uz",
    contactPhone: "+998 71 200-00-06",
    sla: "180 сек",
    applicationsToday: 0,
    conversionRate: 47.3,
    avgScoringTime: 62,
    regions: makeRegions(["Ташкент", "Ташкентская обл.", "Самарканд"]),
    categories: ["Смартфоны", "Ноутбуки", "Телевизоры"],
    terms: {
      availableMonths: [3, 6, 12],
      minAmount: 2_000_000,
      maxAmount: 25_000_000,
      minAge: 25,
      maxAge: 58,
    },
    commission: { type: "fixed", fixedAmount: 200_000 },
    settlements: [
      { id: "s-12", period: "Апрель 2026", issued: 1_250_000_000, commission: 50_000_000, paid: 25_000_000, balance: 25_000_000, status: "overdue" },
      { id: "s-13", period: "Май 2026", issued: 0, commission: 0, paid: 0, balance: 0, status: "pending" },
    ],
    apiConfig: {
      productionUrl: "https://api.asiaalliance.uz/credit/v1",
      sandboxUrl: "https://test.asiaalliance.uz/credit/v1",
      apiKey: "ak_live_0e1f2a3b4c5d6e7f8a9b0c1d",
      secret: "sk_live_1f2a3b4c5d6e7f8a9b0c1d2e",
      webhookUrl: "https://texnomart.uz/webhooks/asia-alliance",
      schedule: makeSchedule("09:00", "18:00", "10:00", "16:00"),
      timeoutMs: 90_000,
      retryCount: 1,
      retryDelayMs: 5_000,
    },
    stats: {
      totalApplications: 2_890,
      approved: 1_367,
      conversionRate: 47.3,
      avgCheck: 2_800_000,
      dailyData: generateDailyData(10),
      statusDistribution: [
        { status: "Одобрено", count: 1367, color: "#10B981" },
        { status: "Отклонено", count: 1245, color: "#EF4444" },
        { status: "На рассмотрении", count: 278, color: "#F59E0B" },
      ],
      hourlyData: generateHourlyData(),
    },
    changes: makeChanges(),
  },
];

export const SETTLEMENT_STATUSES: Record<string, { label: string; bg: string; text: string }> = {
  paid: { label: "Оплачено", bg: "bg-green-100", text: "text-green-700" },
  pending: { label: "Ожидает", bg: "bg-yellow-100", text: "text-yellow-700" },
  overdue: { label: "Просрочено", bg: "bg-red-100", text: "text-red-700" },
};

export const ALL_TERM_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36];
