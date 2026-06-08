// Centralized mock data for the dashboard

export interface KpiData {
  label: string;
  value: number;
  change: number;
  trend: "up" | "down";
  format: "number" | "currency" | "percentage";
}

export interface ApplicationDynamicsPoint {
  date: string;
  applications: number;
  approved: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface BranchData {
  name: string;
  applications: number;
}

export interface Application {
  id: string;
  client: {
    name: string;
    phone: string;
    initials: string;
  };
  amount: number;
  partner: {
    name: string;
    logo?: string;
  };
  status: {
    key: string;
    label: string;
    color: string;
  };
  timeAgo: string;
  isNew?: boolean;
}

export interface Alert {
  id: string;
  severity: "danger" | "warning" | "info" | "success";
  title: string;
  description: string;
  timeAgo: string;
  action?: {
    label: string;
    route: string;
  };
}

export interface PartnerDistribution {
  name: string;
  value: number;
  color: string;
}

export const MOCK_KPI_DATA: KpiData[] = [
  { label: "Заявки сегодня", value: 1847, change: 12.5, trend: "up", format: "number" },
  { label: "Одобрено", value: 1092, change: 8.3, trend: "up", format: "number" },
  { label: "Средний чек", value: 4250000, change: -2.1, trend: "down", format: "currency" },
  { label: "Конверсия", value: 59.2, change: 3.7, trend: "up", format: "percentage" },
  { label: "Активные филиалы", value: 47, change: 0, trend: "up", format: "number" },
  { label: "Партнёры онлайн", value: 12, change: 0, trend: "up", format: "number" },
  { label: "Ср. время обработки", value: 180, change: -15, trend: "up", format: "number" },
  { label: "Отказов", value: 423, change: -5.2, trend: "up", format: "number" },
];

export const MOCK_PARTNER_DISTRIBUTION: PartnerDistribution[] = [
  { name: "Alif Nasiya", value: 487, color: "#3B82F6" },
  { name: "Uzum Nasiya", value: 412, color: "#8B5CF6" },
  { name: "Anorbank", value: 356, color: "#10B981" },
  { name: "Kapitalbank", value: 289, color: "#F59E0B" },
  { name: "Ipoteka Bank", value: 234, color: "#EF4444" },
  { name: "Другие", value: 69, color: "#6B7280" },
];

export function generateMockApplicationDynamics(): ApplicationDynamicsPoint[] {
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  return days.map((day, i) => ({
    date: day,
    applications: Math.floor(Math.random() * 300) + 150,
    approved: Math.floor(Math.random() * 200) + 80,
  }));
}

export function generateMockStatusCounts(): StatusCount[] {
  return [
    { status: "new", count: 247 },
    { status: "scoring", count: 183 },
    { status: "approved", count: 1092 },
    { status: "rejected", count: 423 },
  ];
}

export function generateMockBranches(): BranchData[] {
  return [
    { name: "ТЦ Малика", applications: 482 },
    { name: "Чорсу", applications: 421 },
    { name: "Самарканд центр", applications: 367 },
    { name: "Бухара филиал", applications: 312 },
    { name: "Андижан-1", applications: 287 },
    { name: "Фергана-парк", applications: 268 },
  ];
}
