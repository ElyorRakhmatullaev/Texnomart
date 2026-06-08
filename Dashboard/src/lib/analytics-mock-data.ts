export interface AnalyticsKpi {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  delta: number;
  format: "number" | "currency" | "percentage" | "duration";
  invertDelta?: boolean;
}

export interface GroupingRow {
  id: string;
  name: string;
  logo?: string;
  applications: number;
  conversion: number;
  avgTime: number;
  totalIssued: number;
  sharePercent: number;
  deltaPercent: number;
  sparklineData: number[];
}

export interface CohortCell {
  month: number;
  retention: number;
  count: number;
}

export interface CohortRow {
  cohortMonth: string;
  totalUsers: number;
  cells: CohortCell[];
}

export type ReportStatus = "ready" | "processing" | "error";
export type ReportFrequency = "daily" | "weekly" | "monthly";

export interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  period: string;
  author: string;
  createdAt: string;
  status: ReportStatus;
  size: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  frequency: ReportFrequency;
  recipients: string[];
  nextRun: string;
  enabled: boolean;
}

export interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface ChartPoint {
  date: string;
  value: number;
  comparison?: number;
}

export const ANALYTICS_KPIS: AnalyticsKpi[] = [
  { id: "applications", label: "Количество заявок", value: 1247, previousValue: 1109, delta: 12.4, format: "number" },
  { id: "requested", label: "Сумма заявок", value: 892_400_000, previousValue: 814_200_000, delta: 9.6, format: "currency" },
  { id: "approved", label: "Сумма одобрено", value: 623_800_000, previousValue: 571_100_000, delta: 9.2, format: "currency" },
  { id: "issued", label: "Сумма выдано", value: 587_200_000, previousValue: 543_900_000, delta: 8.0, format: "currency" },
  { id: "conversion", label: "Конверсия", value: 68.4, previousValue: 64.1, delta: 4.3, format: "percentage" },
  { id: "avgTime", label: "Среднее время рассмотрения", value: 47, previousValue: 52, delta: -9.6, format: "duration", invertDelta: true },
  { id: "repeatRate", label: "Доля повторных заявок", value: 23.1, previousValue: 20.8, delta: 2.3, format: "percentage" },
  { id: "ltv", label: "LTV клиента", value: 4_820_000, previousValue: 4_510_000, delta: 6.9, format: "currency" },
];

export const PERIOD_OPTIONS = [
  { value: "today", label: "Сегодня" },
  { value: "yesterday", label: "Вчера" },
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "3m", label: "3 мес" },
  { value: "6m", label: "6 мес" },
  { value: "1y", label: "1 год" },
  { value: "custom", label: "Произвольный..." },
] as const;

export const GROUPING_OPTIONS = [
  { value: "partners", label: "По партнёрам" },
  { value: "branches", label: "По филиалам" },
  { value: "operators", label: "По операторам / агентам" },
  { value: "statuses", label: "По статусам" },
  { value: "products", label: "По продуктам / категориям" },
  { value: "terms", label: "По срокам рассрочки" },
  { value: "age", label: "По возрастным группам" },
  { value: "regions", label: "По регионам" },
] as const;

function generateSparkline(trend: number): number[] {
  const points: number[] = [];
  let v = 50;
  for (let i = 0; i < 12; i++) {
    v += (trend > 0 ? 1 : -1) * (Math.random() * 4) + (Math.random() - 0.5) * 3;
    points.push(Math.max(5, Math.round(v)));
  }
  return points;
}

export const GROUPING_DATA: Record<string, GroupingRow[]> = {
  partners: [
    { id: "alif", name: "Alif Nasiya", applications: 412, conversion: 72.3, avgTime: 38, totalIssued: 198_400_000, sharePercent: 33.1, deltaPercent: 14.2, sparklineData: generateSparkline(14) },
    { id: "anorbank", name: "Anorbank", applications: 287, conversion: 65.8, avgTime: 52, totalIssued: 142_100_000, sharePercent: 23.0, deltaPercent: 8.7, sparklineData: generateSparkline(9) },
    { id: "uzum", name: "Uzum Nasiya", applications: 234, conversion: 71.1, avgTime: 41, totalIssued: 112_800_000, sharePercent: 18.8, deltaPercent: 11.3, sparklineData: generateSparkline(11) },
    { id: "iman", name: "Iman", applications: 156, conversion: 58.9, avgTime: 67, totalIssued: 72_300_000, sharePercent: 12.5, deltaPercent: -3.1, sparklineData: generateSparkline(-3) },
    { id: "multicard", name: "Multicard", applications: 98, conversion: 62.4, avgTime: 45, totalIssued: 41_200_000, sharePercent: 7.9, deltaPercent: 5.4, sparklineData: generateSparkline(5) },
    { id: "asia", name: "Asia Alliance", applications: 60, conversion: 55.2, avgTime: 71, totalIssued: 20_400_000, sharePercent: 4.8, deltaPercent: -7.8, sparklineData: generateSparkline(-8) },
  ],
  branches: [
    { id: "b1", name: "ТЦ Малика, Ташкент", applications: 198, conversion: 71.2, avgTime: 39, totalIssued: 94_200_000, sharePercent: 15.9, deltaPercent: 12.1, sparklineData: generateSparkline(12) },
    { id: "b2", name: "Чорсу, Ташкент", applications: 176, conversion: 68.4, avgTime: 43, totalIssued: 81_400_000, sharePercent: 14.1, deltaPercent: 9.3, sparklineData: generateSparkline(9) },
    { id: "b3", name: "Самарканд", applications: 142, conversion: 66.1, avgTime: 48, totalIssued: 65_800_000, sharePercent: 11.4, deltaPercent: 7.8, sparklineData: generateSparkline(8) },
    { id: "b4", name: "Бухара", applications: 128, conversion: 64.5, avgTime: 51, totalIssued: 58_100_000, sharePercent: 10.3, deltaPercent: 5.2, sparklineData: generateSparkline(5) },
    { id: "b5", name: "Андижан", applications: 119, conversion: 69.8, avgTime: 44, totalIssued: 54_300_000, sharePercent: 9.5, deltaPercent: 15.6, sparklineData: generateSparkline(16) },
    { id: "b6", name: "Фергана", applications: 104, conversion: 62.3, avgTime: 55, totalIssued: 47_200_000, sharePercent: 8.3, deltaPercent: 3.1, sparklineData: generateSparkline(3) },
    { id: "b7", name: "Наманган", applications: 96, conversion: 61.7, avgTime: 58, totalIssued: 42_100_000, sharePercent: 7.7, deltaPercent: -2.4, sparklineData: generateSparkline(-2) },
    { id: "b8", name: "Кашкадарья", applications: 87, conversion: 59.4, avgTime: 62, totalIssued: 38_400_000, sharePercent: 7.0, deltaPercent: 1.8, sparklineData: generateSparkline(2) },
    { id: "b9", name: "Хорезм", applications: 52, conversion: 57.8, avgTime: 64, totalIssued: 22_900_000, sharePercent: 4.2, deltaPercent: -4.3, sparklineData: generateSparkline(-4) },
    { id: "b10", name: "Сурхандарья", applications: 45, conversion: 55.1, avgTime: 68, totalIssued: 18_800_000, sharePercent: 3.6, deltaPercent: -1.9, sparklineData: generateSparkline(-2) },
  ],
  operators: [
    { id: "op1", name: "Алина Петрова", applications: 187, conversion: 74.3, avgTime: 34, totalIssued: 89_200_000, sharePercent: 15.0, deltaPercent: 18.2, sparklineData: generateSparkline(18) },
    { id: "op2", name: "Бекзод Каримов", applications: 164, conversion: 69.1, avgTime: 41, totalIssued: 76_800_000, sharePercent: 13.2, deltaPercent: 11.4, sparklineData: generateSparkline(11) },
    { id: "op3", name: "Дилноза Усманова", applications: 152, conversion: 71.8, avgTime: 37, totalIssued: 71_400_000, sharePercent: 12.2, deltaPercent: 9.7, sparklineData: generateSparkline(10) },
    { id: "op4", name: "Жасур Юсупов", applications: 143, conversion: 66.5, avgTime: 48, totalIssued: 64_200_000, sharePercent: 11.5, deltaPercent: 6.3, sparklineData: generateSparkline(6) },
    { id: "op5", name: "Камола Ахмедова", applications: 131, conversion: 63.2, avgTime: 52, totalIssued: 58_900_000, sharePercent: 10.5, deltaPercent: 4.1, sparklineData: generateSparkline(4) },
    { id: "op6", name: "Нодир Рахимов", applications: 118, conversion: 60.8, avgTime: 56, totalIssued: 51_300_000, sharePercent: 9.5, deltaPercent: -1.2, sparklineData: generateSparkline(-1) },
    { id: "op7", name: "Сарвиноз Мирзаева", applications: 105, conversion: 67.4, avgTime: 43, totalIssued: 47_100_000, sharePercent: 8.4, deltaPercent: 7.8, sparklineData: generateSparkline(8) },
    { id: "op8", name: "Улугбек Хасанов", applications: 89, conversion: 58.9, avgTime: 61, totalIssued: 38_200_000, sharePercent: 7.1, deltaPercent: -3.5, sparklineData: generateSparkline(-4) },
  ],
  statuses: [
    { id: "s1", name: "Одобрена", applications: 427, conversion: 100, avgTime: 42, totalIssued: 312_400_000, sharePercent: 34.2, deltaPercent: 9.8, sparklineData: generateSparkline(10) },
    { id: "s2", name: "На скоринге", applications: 198, conversion: 0, avgTime: 12, totalIssued: 0, sharePercent: 15.9, deltaPercent: 3.2, sparklineData: generateSparkline(3) },
    { id: "s3", name: "В работе", applications: 176, conversion: 0, avgTime: 35, totalIssued: 0, sharePercent: 14.1, deltaPercent: 7.1, sparklineData: generateSparkline(7) },
    { id: "s4", name: "Отклонена", applications: 164, conversion: 0, avgTime: 28, totalIssued: 0, sharePercent: 13.2, deltaPercent: -5.4, sparklineData: generateSparkline(-5) },
    { id: "s5", name: "Ожидает документы", applications: 112, conversion: 0, avgTime: 89, totalIssued: 0, sharePercent: 9.0, deltaPercent: 12.3, sparklineData: generateSparkline(12) },
    { id: "s6", name: "Завершена", applications: 98, conversion: 100, avgTime: 51, totalIssued: 274_800_000, sharePercent: 7.9, deltaPercent: 6.7, sparklineData: generateSparkline(7) },
    { id: "s7", name: "Отменена", applications: 72, conversion: 0, avgTime: 18, totalIssued: 0, sharePercent: 5.8, deltaPercent: -2.1, sparklineData: generateSparkline(-2) },
  ],
  products: [
    { id: "p1", name: "Смартфоны", applications: 387, conversion: 72.1, avgTime: 38, totalIssued: 178_400_000, sharePercent: 31.0, deltaPercent: 14.8, sparklineData: generateSparkline(15) },
    { id: "p2", name: "Бытовая техника", applications: 298, conversion: 68.4, avgTime: 44, totalIssued: 156_200_000, sharePercent: 23.9, deltaPercent: 8.3, sparklineData: generateSparkline(8) },
    { id: "p3", name: "Ноутбуки и ПК", applications: 214, conversion: 65.2, avgTime: 51, totalIssued: 124_800_000, sharePercent: 17.2, deltaPercent: 11.2, sparklineData: generateSparkline(11) },
    { id: "p4", name: "Телевизоры", applications: 168, conversion: 70.8, avgTime: 42, totalIssued: 89_100_000, sharePercent: 13.5, deltaPercent: 5.7, sparklineData: generateSparkline(6) },
    { id: "p5", name: "Аксессуары", applications: 112, conversion: 78.3, avgTime: 22, totalIssued: 28_400_000, sharePercent: 9.0, deltaPercent: 19.4, sparklineData: generateSparkline(19) },
    { id: "p6", name: "Прочее", applications: 68, conversion: 54.1, avgTime: 58, totalIssued: 10_300_000, sharePercent: 5.5, deltaPercent: -4.2, sparklineData: generateSparkline(-4) },
  ],
  terms: [
    { id: "t1", name: "3 месяца", applications: 342, conversion: 78.2, avgTime: 32, totalIssued: 98_400_000, sharePercent: 27.4, deltaPercent: 6.1, sparklineData: generateSparkline(6) },
    { id: "t2", name: "6 месяцев", applications: 312, conversion: 71.4, avgTime: 41, totalIssued: 148_200_000, sharePercent: 25.0, deltaPercent: 12.8, sparklineData: generateSparkline(13) },
    { id: "t3", name: "12 месяцев", applications: 278, conversion: 64.8, avgTime: 52, totalIssued: 198_600_000, sharePercent: 22.3, deltaPercent: 9.4, sparklineData: generateSparkline(9) },
    { id: "t4", name: "24 месяца", applications: 198, conversion: 58.1, avgTime: 64, totalIssued: 112_400_000, sharePercent: 15.9, deltaPercent: 3.7, sparklineData: generateSparkline(4) },
    { id: "t5", name: "1 месяц", applications: 72, conversion: 82.4, avgTime: 18, totalIssued: 14_800_000, sharePercent: 5.8, deltaPercent: -8.2, sparklineData: generateSparkline(-8) },
    { id: "t6", name: "36 месяцев", applications: 45, conversion: 48.9, avgTime: 78, totalIssued: 14_800_000, sharePercent: 3.6, deltaPercent: 1.2, sparklineData: generateSparkline(1) },
  ],
  age: [
    { id: "a1", name: "18–24 года", applications: 287, conversion: 58.4, avgTime: 42, totalIssued: 78_200_000, sharePercent: 23.0, deltaPercent: 22.1, sparklineData: generateSparkline(22) },
    { id: "a2", name: "25–34 года", applications: 398, conversion: 72.8, avgTime: 38, totalIssued: 212_400_000, sharePercent: 31.9, deltaPercent: 11.4, sparklineData: generateSparkline(11) },
    { id: "a3", name: "35–44 года", applications: 278, conversion: 69.1, avgTime: 44, totalIssued: 168_200_000, sharePercent: 22.3, deltaPercent: 5.8, sparklineData: generateSparkline(6) },
    { id: "a4", name: "45–54 года", applications: 168, conversion: 64.2, avgTime: 51, totalIssued: 87_400_000, sharePercent: 13.5, deltaPercent: -1.2, sparklineData: generateSparkline(-1) },
    { id: "a5", name: "55+ лет", applications: 116, conversion: 56.8, avgTime: 62, totalIssued: 41_000_000, sharePercent: 9.3, deltaPercent: -6.7, sparklineData: generateSparkline(-7) },
  ],
  regions: [
    { id: "r1", name: "Ташкент", applications: 374, conversion: 70.2, avgTime: 41, totalIssued: 175_600_000, sharePercent: 30.0, deltaPercent: 10.8, sparklineData: generateSparkline(11) },
    { id: "r2", name: "Самарканд", applications: 142, conversion: 66.1, avgTime: 48, totalIssued: 65_800_000, sharePercent: 11.4, deltaPercent: 7.8, sparklineData: generateSparkline(8) },
    { id: "r3", name: "Фергана", applications: 128, conversion: 63.8, avgTime: 52, totalIssued: 56_400_000, sharePercent: 10.3, deltaPercent: 5.2, sparklineData: generateSparkline(5) },
    { id: "r4", name: "Андижан", applications: 119, conversion: 69.8, avgTime: 44, totalIssued: 54_300_000, sharePercent: 9.5, deltaPercent: 15.6, sparklineData: generateSparkline(16) },
    { id: "r5", name: "Бухара", applications: 104, conversion: 64.5, avgTime: 51, totalIssued: 47_200_000, sharePercent: 8.3, deltaPercent: 3.1, sparklineData: generateSparkline(3) },
    { id: "r6", name: "Наманган", applications: 96, conversion: 61.7, avgTime: 58, totalIssued: 42_100_000, sharePercent: 7.7, deltaPercent: -2.4, sparklineData: generateSparkline(-2) },
    { id: "r7", name: "Кашкадарья", applications: 87, conversion: 59.4, avgTime: 62, totalIssued: 38_400_000, sharePercent: 7.0, deltaPercent: 1.8, sparklineData: generateSparkline(2) },
    { id: "r8", name: "Хорезм", applications: 52, conversion: 57.8, avgTime: 64, totalIssued: 22_900_000, sharePercent: 4.2, deltaPercent: -4.3, sparklineData: generateSparkline(-4) },
    { id: "r9", name: "Сурхандарья", applications: 45, conversion: 55.1, avgTime: 68, totalIssued: 18_800_000, sharePercent: 3.6, deltaPercent: -1.9, sparklineData: generateSparkline(-2) },
  ],
};

export const COHORT_DATA: CohortRow[] = [
  { cohortMonth: "Дек 2025", totalUsers: 1842, cells: [
    { month: 0, retention: 100, count: 1842 }, { month: 1, retention: 64.2, count: 1182 }, { month: 2, retention: 51.8, count: 954 },
    { month: 3, retention: 44.1, count: 812 }, { month: 4, retention: 38.7, count: 713 }, { month: 5, retention: 34.2, count: 630 },
  ]},
  { cohortMonth: "Янв 2026", totalUsers: 2104, cells: [
    { month: 0, retention: 100, count: 2104 }, { month: 1, retention: 66.8, count: 1405 }, { month: 2, retention: 53.4, count: 1124 },
    { month: 3, retention: 45.9, count: 966 }, { month: 4, retention: 40.1, count: 844 },
  ]},
  { cohortMonth: "Фев 2026", totalUsers: 1976, cells: [
    { month: 0, retention: 100, count: 1976 }, { month: 1, retention: 62.1, count: 1227 }, { month: 2, retention: 49.8, count: 984 },
    { month: 3, retention: 42.3, count: 836 },
  ]},
  { cohortMonth: "Мар 2026", totalUsers: 2287, cells: [
    { month: 0, retention: 100, count: 2287 }, { month: 1, retention: 68.4, count: 1564 }, { month: 2, retention: 55.1, count: 1260 },
  ]},
  { cohortMonth: "Апр 2026", totalUsers: 2451, cells: [
    { month: 0, retention: 100, count: 2451 }, { month: 1, retention: 71.2, count: 1745 },
  ]},
  { cohortMonth: "Май 2026", totalUsers: 2198, cells: [
    { month: 0, retention: 100, count: 2198 },
  ]},
];

export const GENERATED_REPORTS: GeneratedReport[] = [
  { id: "RPT-001", name: "Сводный отчёт за апрель", type: "Сводный", period: "01.04 – 30.04.2026", author: "Сардор Мавлянов", createdAt: "01.05.2026 09:15", status: "ready", size: "2.4 МБ" },
  { id: "RPT-002", name: "Детализация по партнёрам", type: "По партнёрам", period: "01.04 – 30.04.2026", author: "Алина Петрова", createdAt: "02.05.2026 14:32", status: "ready", size: "4.1 МБ" },
  { id: "RPT-003", name: "Финансовый отчёт Q1", type: "Финансовый", period: "01.01 – 31.03.2026", author: "Сардор Мавлянов", createdAt: "05.04.2026 10:00", status: "ready", size: "8.7 МБ" },
  { id: "RPT-004", name: "Еженедельный по филиалам", type: "По филиалам", period: "12.05 – 18.05.2026", author: "Система", createdAt: "19.05.2026 06:00", status: "ready", size: "1.8 МБ" },
  { id: "RPT-005", name: "Когортный анализ Q1–Q2", type: "Когортный", period: "01.01 – 18.05.2026", author: "Камола Ахмедова", createdAt: "18.05.2026 16:45", status: "ready", size: "3.2 МБ" },
  { id: "RPT-006", name: "Операторы — май", type: "По операторам", period: "01.05 – 18.05.2026", author: "Бекзод Каримов", createdAt: "18.05.2026 18:12", status: "processing", size: "—" },
  { id: "RPT-007", name: "Детализированный за неделю", type: "Детализированный", period: "12.05 – 18.05.2026", author: "Система", createdAt: "19.05.2026 06:05", status: "ready", size: "5.4 МБ" },
  { id: "RPT-008", name: "Сводный за май (промежуточный)", type: "Сводный", period: "01.05 – 18.05.2026", author: "Сардор Мавлянов", createdAt: "18.05.2026 17:30", status: "ready", size: "2.1 МБ" },
  { id: "RPT-009", name: "По регионам — апрель", type: "По филиалам", period: "01.04 – 30.04.2026", author: "Алина Петрова", createdAt: "01.05.2026 11:20", status: "ready", size: "3.8 МБ" },
  { id: "RPT-010", name: "Аналитика отказов", type: "Детализированный", period: "01.05 – 18.05.2026", author: "Дилноза Усманова", createdAt: "17.05.2026 15:42", status: "error", size: "—" },
];

export const SCHEDULED_REPORTS: ScheduledReport[] = [
  { id: "SCH-001", name: "Ежедневный сводный", frequency: "daily", recipients: ["Сардор М.", "Алина П."], nextRun: "19.05.2026 06:00", enabled: true },
  { id: "SCH-002", name: "Еженедельный по филиалам", frequency: "weekly", recipients: ["Сардор М.", "Бекзод К.", "Камола А."], nextRun: "26.05.2026 06:00", enabled: true },
  { id: "SCH-003", name: "Ежемесячный финансовый", frequency: "monthly", recipients: ["Сардор М."], nextRun: "01.06.2026 09:00", enabled: false },
];

export const REPORT_TEMPLATES: ReportTemplate[] = [
  { id: "tpl-1", title: "Сводный", description: "Общая сводка по заявкам, конверсии и финансам за период", icon: "FileText" },
  { id: "tpl-2", title: "Детализированный", description: "Подробная разбивка каждой заявки со статусами и суммами", icon: "Table" },
  { id: "tpl-3", title: "По партнёрам", description: "Сравнительный анализ партнёров: конверсия, скорость, объёмы", icon: "Handshake" },
  { id: "tpl-4", title: "По филиалам", description: "Показатели филиалов с рейтингом и динамикой", icon: "Store" },
  { id: "tpl-5", title: "Финансовый", description: "Выдачи, комиссии, взаиморасчёты с партнёрами", icon: "Wallet" },
  { id: "tpl-6", title: "По операторам", description: "Продуктивность и конверсия каждого оператора и агента", icon: "Users" },
  { id: "tpl-7", title: "Когортный", description: "Анализ удержания клиентов по месяцам привлечения", icon: "BarChart3" },
];

export function generateChartData(period: string, kpiId: string): ChartPoint[] {
  const days = period === "today" || period === "yesterday" ? 24
    : period === "7d" ? 7
    : period === "30d" ? 30
    : period === "3m" ? 90
    : period === "6m" ? 180
    : period === "1y" ? 365 : 30;

  const isHourly = period === "today" || period === "yesterday";
  const baseValues: Record<string, number> = {
    applications: isHourly ? 8 : 42,
    requested: isHourly ? 3_200_000 : 28_000_000,
    approved: isHourly ? 2_100_000 : 19_600_000,
    issued: isHourly ? 1_900_000 : 18_400_000,
    conversion: 68,
    avgTime: 47,
    repeatRate: 23,
    ltv: 4_820_000,
  };

  const base = baseValues[kpiId] || 42;
  const points: ChartPoint[] = [];
  const now = new Date(2026, 4, 18);

  for (let i = 0; i < Math.min(days, 90); i++) {
    const d = new Date(now);
    if (isHourly) {
      d.setHours(i, 0, 0, 0);
    } else {
      d.setDate(d.getDate() - (days - 1 - i));
    }

    const noise = (Math.random() - 0.5) * base * 0.3;
    const trend = (i / days) * base * 0.1;
    const value = Math.max(0, Math.round(base + noise + trend));

    const compNoise = (Math.random() - 0.5) * base * 0.3;
    const comparison = Math.max(0, Math.round(base * 0.9 + compNoise));

    const label = isHourly
      ? `${String(i).padStart(2, "0")}:00`
      : `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;

    points.push({ date: label, value, comparison });
  }

  return points;
}

export function formatKpiValue(value: number, format: AnalyticsKpi["format"]): string {
  switch (format) {
    case "currency":
      return value.toLocaleString("ru-RU") + " UZS";
    case "percentage":
      return value.toFixed(1) + "%";
    case "duration":
      return value + " сек";
    default:
      return value.toLocaleString("ru-RU");
  }
}

export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + " млрд";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + " млн";
  if (value >= 1_000) return (value / 1_000).toFixed(0) + " тыс";
  return value.toString();
}

export const REPORT_STATUS_CONFIG: Record<ReportStatus, { label: string; className: string }> = {
  ready: { label: "Готов", className: "bg-green-100 text-green-800" },
  processing: { label: "В процессе", className: "bg-blue-100 text-blue-800" },
  error: { label: "Ошибка", className: "bg-red-100 text-red-800" },
};

export const FREQUENCY_LABELS: Record<ReportFrequency, string> = {
  daily: "Ежедневно",
  weekly: "Еженедельно",
  monthly: "Ежемесячно",
};
