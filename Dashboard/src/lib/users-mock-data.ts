export type UserRole = "superadmin" | "admin" | "operator" | "agent";

export type UserStatus = "active" | "deactivated";

export const USER_ROLES: Record<
  UserRole,
  { label: string; bg: string; text: string }
> = {
  superadmin: { label: "Superadmin", bg: "bg-gray-900", text: "text-white" },
  admin: { label: "Admin", bg: "bg-[#FFD60A]", text: "text-black" },
  operator: { label: "Оператор", bg: "bg-blue-100", text: "text-blue-700" },
  agent: { label: "Агент", bg: "bg-gray-100", text: "text-gray-700" },
};

export const USER_STATUSES: Record<
  UserStatus,
  { label: string; bg: string; text: string }
> = {
  active: { label: "Активен", bg: "bg-green-100", text: "text-green-700" },
  deactivated: { label: "Деактивирован", bg: "bg-red-100", text: "text-red-700" },
};

export interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  loginTime: Date;
  isCurrent: boolean;
}

export interface LoginHistory {
  id: string;
  date: Date;
  ip: string;
  location: string;
  device: string;
  result: "success" | "error" | "blocked";
}

export interface UserActivity {
  id: string;
  action: string;
  target: string;
  timestamp: Date;
  details?: string;
}

export interface UserStats {
  processedApplications: number;
  conversionRate: number;
  avgResponseTime: number;
  activeClients: number;
  dailyApplications: { date: string; count: number }[];
  monthlyConversion: { month: string; rate: number }[];
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  branch?: string;
  branchId?: string;
  status: UserStatus;
  avatarInitials: string;
  twoFactorEnabled: boolean;
  lastPasswordChange: Date;
  failedLoginAttempts: number;
  lastLogin: Date;
  lastLoginIp: string;
  createdAt: Date;
  createdBy: string;
  sessions: Session[];
  loginHistory: LoginHistory[];
  activity: UserActivity[];
  stats?: UserStats;
}

export const MOCK_USERS: User[] = [
  {
    id: "USR-001",
    firstName: "Рустам",
    lastName: "Каримов",
    middleName: "Алишерович",
    fullName: "Каримов Рустам Алишерович",
    email: "r.karimov@texnomart.uz",
    phone: "+998 90 123-45-67",
    role: "superadmin",
    status: "active",
    avatarInitials: "РК",
    twoFactorEnabled: true,
    lastPasswordChange: new Date("2026-04-15"),
    failedLoginAttempts: 0,
    lastLogin: new Date("2026-05-24T09:14:00"),
    lastLoginIp: "192.168.1.100",
    createdAt: new Date("2024-01-15"),
    createdBy: "Система",
    sessions: [
      { id: "s1", device: "Windows 10", browser: "Chrome 125", ip: "192.168.1.100", location: "Ташкент", loginTime: new Date("2026-05-24T09:14:00"), isCurrent: true },
      { id: "s2", device: "iPhone 15", browser: "Safari 18", ip: "10.0.0.45", location: "Ташкент", loginTime: new Date("2026-05-23T18:30:00"), isCurrent: false },
    ],
    loginHistory: [
      { id: "lh1", date: new Date("2026-05-24T09:14:00"), ip: "192.168.1.100", location: "Ташкент", device: "Windows 10 / Chrome", result: "success" },
      { id: "lh2", date: new Date("2026-05-23T18:30:00"), ip: "10.0.0.45", location: "Ташкент", device: "iPhone 15 / Safari", result: "success" },
      { id: "lh3", date: new Date("2026-05-22T08:45:00"), ip: "192.168.1.100", location: "Ташкент", device: "Windows 10 / Chrome", result: "success" },
    ],
    activity: [
      { id: "a1", action: "Изменил роль", target: "Пользователь USR-005", timestamp: new Date("2026-05-24T10:30:00"), details: "Оператор → Админ" },
      { id: "a2", action: "Деактивировал", target: "Пользователь USR-012", timestamp: new Date("2026-05-23T16:20:00") },
      { id: "a3", action: "Создал пользователя", target: "USR-011", timestamp: new Date("2026-05-22T11:00:00") },
    ],
  },
  {
    id: "USR-002",
    firstName: "Дилноза",
    lastName: "Ахмедова",
    middleName: "Бахтиёровна",
    fullName: "Ахмедова Дилноза Бахтиёровна",
    email: "d.akhmedova@texnomart.uz",
    phone: "+998 91 234-56-78",
    role: "admin",
    status: "active",
    avatarInitials: "ДА",
    twoFactorEnabled: true,
    lastPasswordChange: new Date("2026-03-20"),
    failedLoginAttempts: 0,
    lastLogin: new Date("2026-05-24T08:45:00"),
    lastLoginIp: "192.168.1.101",
    createdAt: new Date("2024-03-10"),
    createdBy: "Каримов Р.А.",
    sessions: [
      { id: "s3", device: "macOS 15", browser: "Safari 18", ip: "192.168.1.101", location: "Ташкент", loginTime: new Date("2026-05-24T08:45:00"), isCurrent: true },
    ],
    loginHistory: [
      { id: "lh4", date: new Date("2026-05-24T08:45:00"), ip: "192.168.1.101", location: "Ташкент", device: "macOS / Safari", result: "success" },
      { id: "lh5", date: new Date("2026-05-23T09:10:00"), ip: "192.168.1.101", location: "Ташкент", device: "macOS / Safari", result: "success" },
    ],
    activity: [
      { id: "a4", action: "Обновил условия", target: "Партнёр Alif Nasiya", timestamp: new Date("2026-05-24T09:30:00") },
      { id: "a5", action: "Экспортировал отчёт", target: "Сводный за май", timestamp: new Date("2026-05-23T14:00:00") },
    ],
  },
  {
    id: "USR-003",
    firstName: "Бахтиёр",
    lastName: "Назаров",
    middleName: "Рустамович",
    fullName: "Назаров Бахтиёр Рустамович",
    email: "b.nazarov@texnomart.uz",
    phone: "+998 93 345-67-89",
    role: "admin",
    status: "active",
    avatarInitials: "БН",
    twoFactorEnabled: true,
    lastPasswordChange: new Date("2026-04-01"),
    failedLoginAttempts: 1,
    lastLogin: new Date("2026-05-23T17:20:00"),
    lastLoginIp: "192.168.2.50",
    createdAt: new Date("2024-06-01"),
    createdBy: "Каримов Р.А.",
    sessions: [
      { id: "s4", device: "Windows 11", browser: "Firefox 128", ip: "192.168.2.50", location: "Самарканд", loginTime: new Date("2026-05-23T17:20:00"), isCurrent: true },
    ],
    loginHistory: [
      { id: "lh6", date: new Date("2026-05-23T17:20:00"), ip: "192.168.2.50", location: "Самарканд", device: "Windows 11 / Firefox", result: "success" },
      { id: "lh7", date: new Date("2026-05-23T17:18:00"), ip: "192.168.2.50", location: "Самарканд", device: "Windows 11 / Firefox", result: "error" },
    ],
    activity: [
      { id: "a6", action: "Утвердил заявку", target: "APP-2847", timestamp: new Date("2026-05-23T16:00:00") },
    ],
  },
  {
    id: "USR-004",
    firstName: "Малика",
    lastName: "Исмаилова",
    middleName: "Фаррухoвна",
    fullName: "Исмаилова Малика Фаррухoвна",
    email: "m.ismailova@texnomart.uz",
    phone: "+998 94 456-78-90",
    role: "operator",
    branch: "Ташкент — Чиланзар",
    branchId: "BR-001",
    status: "active",
    avatarInitials: "МИ",
    twoFactorEnabled: true,
    lastPasswordChange: new Date("2026-05-01"),
    failedLoginAttempts: 0,
    lastLogin: new Date("2026-05-24T09:00:00"),
    lastLoginIp: "10.10.1.15",
    createdAt: new Date("2025-01-20"),
    createdBy: "Ахмедова Д.Б.",
    sessions: [
      { id: "s5", device: "Windows 10", browser: "Chrome 125", ip: "10.10.1.15", location: "Ташкент", loginTime: new Date("2026-05-24T09:00:00"), isCurrent: true },
    ],
    loginHistory: [
      { id: "lh8", date: new Date("2026-05-24T09:00:00"), ip: "10.10.1.15", location: "Ташкент", device: "Windows 10 / Chrome", result: "success" },
    ],
    activity: [
      { id: "a7", action: "Обработал заявку", target: "APP-3012", timestamp: new Date("2026-05-24T10:15:00") },
      { id: "a8", action: "Обработал заявку", target: "APP-3010", timestamp: new Date("2026-05-24T09:45:00") },
    ],
    stats: {
      processedApplications: 342,
      conversionRate: 68,
      avgResponseTime: 12,
      activeClients: 89,
      dailyApplications: [
        { date: "19.05", count: 14 }, { date: "20.05", count: 18 },
        { date: "21.05", count: 12 }, { date: "22.05", count: 20 },
        { date: "23.05", count: 16 }, { date: "24.05", count: 11 },
      ],
      monthlyConversion: [
        { month: "Янв", rate: 62 }, { month: "Фев", rate: 65 },
        { month: "Мар", rate: 64 }, { month: "Апр", rate: 70 },
        { month: "Май", rate: 68 },
      ],
    },
  },
  {
    id: "USR-005",
    firstName: "Азиз",
    lastName: "Турсунов",
    middleName: "Шухратович",
    fullName: "Турсунов Азиз Шухратович",
    email: "a.tursunov@texnomart.uz",
    phone: "+998 95 567-89-01",
    role: "operator",
    branch: "Ташкент — Юнусабад",
    branchId: "BR-002",
    status: "active",
    avatarInitials: "АТ",
    twoFactorEnabled: false,
    lastPasswordChange: new Date("2026-02-10"),
    failedLoginAttempts: 0,
    lastLogin: new Date("2026-05-24T08:30:00"),
    lastLoginIp: "10.10.2.20",
    createdAt: new Date("2025-03-15"),
    createdBy: "Ахмедова Д.Б.",
    sessions: [
      { id: "s6", device: "Windows 10", browser: "Edge 125", ip: "10.10.2.20", location: "Ташкент", loginTime: new Date("2026-05-24T08:30:00"), isCurrent: true },
    ],
    loginHistory: [
      { id: "lh9", date: new Date("2026-05-24T08:30:00"), ip: "10.10.2.20", location: "Ташкент", device: "Windows 10 / Edge", result: "success" },
    ],
    activity: [
      { id: "a9", action: "Обработал заявку", target: "APP-3008", timestamp: new Date("2026-05-24T09:20:00") },
    ],
    stats: {
      processedApplications: 287,
      conversionRate: 72,
      avgResponseTime: 9,
      activeClients: 74,
      dailyApplications: [
        { date: "19.05", count: 16 }, { date: "20.05", count: 14 },
        { date: "21.05", count: 19 }, { date: "22.05", count: 15 },
        { date: "23.05", count: 21 }, { date: "24.05", count: 13 },
      ],
      monthlyConversion: [
        { month: "Янв", rate: 68 }, { month: "Фев", rate: 70 },
        { month: "Мар", rate: 71 }, { month: "Апр", rate: 74 },
        { month: "Май", rate: 72 },
      ],
    },
  },
  {
    id: "USR-006",
    firstName: "Шахло",
    lastName: "Рахимова",
    middleName: "Ойбековна",
    fullName: "Рахимова Шахло Ойбековна",
    email: "sh.rakhimova@texnomart.uz",
    phone: "+998 97 678-90-12",
    role: "operator",
    branch: "Самарканд — Центр",
    branchId: "BR-003",
    status: "active",
    avatarInitials: "ШР",
    twoFactorEnabled: true,
    lastPasswordChange: new Date("2026-04-20"),
    failedLoginAttempts: 0,
    lastLogin: new Date("2026-05-24T09:05:00"),
    lastLoginIp: "10.20.1.10",
    createdAt: new Date("2025-02-01"),
    createdBy: "Назаров Б.Р.",
    sessions: [
      { id: "s7", device: "Windows 10", browser: "Chrome 125", ip: "10.20.1.10", location: "Самарканд", loginTime: new Date("2026-05-24T09:05:00"), isCurrent: true },
    ],
    loginHistory: [
      { id: "lh10", date: new Date("2026-05-24T09:05:00"), ip: "10.20.1.10", location: "Самарканд", device: "Windows 10 / Chrome", result: "success" },
    ],
    activity: [
      { id: "a10", action: "Обработал заявку", target: "APP-3015", timestamp: new Date("2026-05-24T10:00:00") },
    ],
    stats: {
      processedApplications: 198,
      conversionRate: 65,
      avgResponseTime: 14,
      activeClients: 52,
      dailyApplications: [
        { date: "19.05", count: 10 }, { date: "20.05", count: 12 },
        { date: "21.05", count: 8 }, { date: "22.05", count: 14 },
        { date: "23.05", count: 11 }, { date: "24.05", count: 9 },
      ],
      monthlyConversion: [
        { month: "Янв", rate: 60 }, { month: "Фев", rate: 62 },
        { month: "Мар", rate: 63 }, { month: "Апр", rate: 66 },
        { month: "Май", rate: 65 },
      ],
    },
  },
  {
    id: "USR-007",
    firstName: "Жавохир",
    lastName: "Мирзаев",
    middleName: "Ботирович",
    fullName: "Мирзаев Жавохир Ботирович",
    email: "j.mirzaev@texnomart.uz",
    phone: "+998 90 789-01-23",
    role: "agent",
    branch: "Ташкент — Чиланзар",
    branchId: "BR-001",
    status: "active",
    avatarInitials: "ЖМ",
    twoFactorEnabled: false,
    lastPasswordChange: new Date("2026-03-05"),
    failedLoginAttempts: 0,
    lastLogin: new Date("2026-05-24T08:50:00"),
    lastLoginIp: "10.10.1.30",
    createdAt: new Date("2025-06-10"),
    createdBy: "Исмаилова М.Ф.",
    sessions: [
      { id: "s8", device: "Android 14", browser: "Chrome Mobile", ip: "10.10.1.30", location: "Ташкент", loginTime: new Date("2026-05-24T08:50:00"), isCurrent: true },
    ],
    loginHistory: [
      { id: "lh11", date: new Date("2026-05-24T08:50:00"), ip: "10.10.1.30", location: "Ташкент", device: "Android / Chrome", result: "success" },
    ],
    activity: [
      { id: "a11", action: "Оформил заявку", target: "APP-3020", timestamp: new Date("2026-05-24T10:45:00") },
      { id: "a12", action: "Оформил заявку", target: "APP-3018", timestamp: new Date("2026-05-24T09:30:00") },
    ],
    stats: {
      processedApplications: 156,
      conversionRate: 74,
      avgResponseTime: 8,
      activeClients: 45,
      dailyApplications: [
        { date: "19.05", count: 8 }, { date: "20.05", count: 10 },
        { date: "21.05", count: 7 }, { date: "22.05", count: 12 },
        { date: "23.05", count: 9 }, { date: "24.05", count: 6 },
      ],
      monthlyConversion: [
        { month: "Янв", rate: 70 }, { month: "Фев", rate: 72 },
        { month: "Мар", rate: 73 }, { month: "Апр", rate: 75 },
        { month: "Май", rate: 74 },
      ],
    },
  },
  {
    id: "USR-008",
    firstName: "Нодира",
    lastName: "Хасанова",
    middleName: "Ильхомовна",
    fullName: "Хасанова Нодира Ильхомовна",
    email: "n.khasanova@texnomart.uz",
    phone: "+998 91 890-12-34",
    role: "agent",
    branch: "Бухара — Центр",
    branchId: "BR-004",
    status: "active",
    avatarInitials: "НХ",
    twoFactorEnabled: true,
    lastPasswordChange: new Date("2026-04-10"),
    failedLoginAttempts: 0,
    lastLogin: new Date("2026-05-23T17:00:00"),
    lastLoginIp: "10.30.1.5",
    createdAt: new Date("2025-04-20"),
    createdBy: "Назаров Б.Р.",
    sessions: [
      { id: "s9", device: "Windows 10", browser: "Chrome 125", ip: "10.30.1.5", location: "Бухара", loginTime: new Date("2026-05-23T17:00:00"), isCurrent: true },
    ],
    loginHistory: [
      { id: "lh12", date: new Date("2026-05-23T17:00:00"), ip: "10.30.1.5", location: "Бухара", device: "Windows 10 / Chrome", result: "success" },
    ],
    activity: [
      { id: "a13", action: "Оформил заявку", target: "APP-3005", timestamp: new Date("2026-05-23T16:30:00") },
    ],
    stats: {
      processedApplications: 124,
      conversionRate: 70,
      avgResponseTime: 11,
      activeClients: 38,
      dailyApplications: [
        { date: "19.05", count: 6 }, { date: "20.05", count: 8 },
        { date: "21.05", count: 5 }, { date: "22.05", count: 9 },
        { date: "23.05", count: 7 }, { date: "24.05", count: 4 },
      ],
      monthlyConversion: [
        { month: "Янв", rate: 66 }, { month: "Фев", rate: 67 },
        { month: "Мар", rate: 69 }, { month: "Апр", rate: 71 },
        { month: "Май", rate: 70 },
      ],
    },
  },
  {
    id: "USR-009",
    firstName: "Отабек",
    lastName: "Юлдашев",
    middleName: "Абдуллаевич",
    fullName: "Юлдашев Отабек Абдуллаевич",
    email: "o.yuldashev@texnomart.uz",
    phone: "+998 93 901-23-45",
    role: "agent",
    branch: "Андижан — Центр",
    branchId: "BR-005",
    status: "active",
    avatarInitials: "ОЮ",
    twoFactorEnabled: false,
    lastPasswordChange: new Date("2026-01-15"),
    failedLoginAttempts: 2,
    lastLogin: new Date("2026-05-24T07:45:00"),
    lastLoginIp: "10.40.1.8",
    createdAt: new Date("2025-07-01"),
    createdBy: "Ахмедова Д.Б.",
    sessions: [
      { id: "s10", device: "Android 13", browser: "Chrome Mobile", ip: "10.40.1.8", location: "Андижан", loginTime: new Date("2026-05-24T07:45:00"), isCurrent: true },
    ],
    loginHistory: [
      { id: "lh13", date: new Date("2026-05-24T07:45:00"), ip: "10.40.1.8", location: "Андижан", device: "Android / Chrome", result: "success" },
      { id: "lh14", date: new Date("2026-05-24T07:43:00"), ip: "10.40.1.8", location: "Андижан", device: "Android / Chrome", result: "error" },
      { id: "lh15", date: new Date("2026-05-24T07:42:00"), ip: "10.40.1.8", location: "Андижан", device: "Android / Chrome", result: "error" },
    ],
    activity: [
      { id: "a14", action: "Оформил заявку", target: "APP-3022", timestamp: new Date("2026-05-24T08:30:00") },
    ],
    stats: {
      processedApplications: 98,
      conversionRate: 62,
      avgResponseTime: 15,
      activeClients: 31,
      dailyApplications: [
        { date: "19.05", count: 5 }, { date: "20.05", count: 6 },
        { date: "21.05", count: 4 }, { date: "22.05", count: 7 },
        { date: "23.05", count: 5 }, { date: "24.05", count: 3 },
      ],
      monthlyConversion: [
        { month: "Янв", rate: 58 }, { month: "Фев", rate: 60 },
        { month: "Мар", rate: 61 }, { month: "Апр", rate: 63 },
        { month: "Май", rate: 62 },
      ],
    },
  },
  {
    id: "USR-010",
    firstName: "Камола",
    lastName: "Абдуллаева",
    middleName: "Тимуровна",
    fullName: "Абдуллаева Камола Тимуровна",
    email: "k.abdullaeva@texnomart.uz",
    phone: "+998 94 012-34-56",
    role: "operator",
    branch: "Фергана — Центр",
    branchId: "BR-006",
    status: "active",
    avatarInitials: "КА",
    twoFactorEnabled: true,
    lastPasswordChange: new Date("2026-05-10"),
    failedLoginAttempts: 0,
    lastLogin: new Date("2026-05-24T08:55:00"),
    lastLoginIp: "10.50.1.12",
    createdAt: new Date("2025-05-15"),
    createdBy: "Ахмедова Д.Б.",
    sessions: [
      { id: "s11", device: "Windows 11", browser: "Chrome 125", ip: "10.50.1.12", location: "Фергана", loginTime: new Date("2026-05-24T08:55:00"), isCurrent: true },
    ],
    loginHistory: [
      { id: "lh16", date: new Date("2026-05-24T08:55:00"), ip: "10.50.1.12", location: "Фергана", device: "Windows 11 / Chrome", result: "success" },
    ],
    activity: [
      { id: "a15", action: "Обработал заявку", target: "APP-3016", timestamp: new Date("2026-05-24T09:50:00") },
    ],
    stats: {
      processedApplications: 215,
      conversionRate: 67,
      avgResponseTime: 13,
      activeClients: 61,
      dailyApplications: [
        { date: "19.05", count: 11 }, { date: "20.05", count: 13 },
        { date: "21.05", count: 9 }, { date: "22.05", count: 15 },
        { date: "23.05", count: 12 }, { date: "24.05", count: 10 },
      ],
      monthlyConversion: [
        { month: "Янв", rate: 63 }, { month: "Фев", rate: 64 },
        { month: "Мар", rate: 66 }, { month: "Апр", rate: 68 },
        { month: "Май", rate: 67 },
      ],
    },
  },
  {
    id: "USR-011",
    firstName: "Фаррух",
    lastName: "Сафаров",
    middleName: "Дониёрович",
    fullName: "Сафаров Фаррух Дониёрович",
    email: "f.safarov@texnomart.uz",
    phone: "+998 95 123-45-67",
    role: "agent",
    branch: "Наманган — Центр",
    branchId: "BR-007",
    status: "active",
    avatarInitials: "ФС",
    twoFactorEnabled: false,
    lastPasswordChange: new Date("2026-03-25"),
    failedLoginAttempts: 0,
    lastLogin: new Date("2026-05-23T16:40:00"),
    lastLoginIp: "10.60.1.3",
    createdAt: new Date("2025-09-01"),
    createdBy: "Каримов Р.А.",
    sessions: [
      { id: "s12", device: "Windows 10", browser: "Chrome 125", ip: "10.60.1.3", location: "Наманган", loginTime: new Date("2026-05-23T16:40:00"), isCurrent: true },
    ],
    loginHistory: [
      { id: "lh17", date: new Date("2026-05-23T16:40:00"), ip: "10.60.1.3", location: "Наманган", device: "Windows 10 / Chrome", result: "success" },
    ],
    activity: [
      { id: "a16", action: "Оформил заявку", target: "APP-3002", timestamp: new Date("2026-05-23T15:50:00") },
    ],
    stats: {
      processedApplications: 87,
      conversionRate: 69,
      avgResponseTime: 10,
      activeClients: 28,
      dailyApplications: [
        { date: "19.05", count: 4 }, { date: "20.05", count: 6 },
        { date: "21.05", count: 3 }, { date: "22.05", count: 7 },
        { date: "23.05", count: 5 }, { date: "24.05", count: 2 },
      ],
      monthlyConversion: [
        { month: "Янв", rate: 64 }, { month: "Фев", rate: 66 },
        { month: "Мар", rate: 67 }, { month: "Апр", rate: 70 },
        { month: "Май", rate: 69 },
      ],
    },
  },
  {
    id: "USR-012",
    firstName: "Улугбек",
    lastName: "Джураев",
    middleName: "Хамидович",
    fullName: "Джураев Улугбек Хамидович",
    email: "u.djuraev@texnomart.uz",
    phone: "+998 97 234-56-78",
    role: "operator",
    branch: "Хорезм — Ургенч",
    branchId: "BR-009",
    status: "deactivated",
    avatarInitials: "УД",
    twoFactorEnabled: false,
    lastPasswordChange: new Date("2025-12-01"),
    failedLoginAttempts: 5,
    lastLogin: new Date("2026-04-15T10:20:00"),
    lastLoginIp: "10.80.1.2",
    createdAt: new Date("2025-04-01"),
    createdBy: "Назаров Б.Р.",
    sessions: [],
    loginHistory: [
      { id: "lh18", date: new Date("2026-04-15T10:20:00"), ip: "10.80.1.2", location: "Ургенч", device: "Windows 10 / Chrome", result: "blocked" },
      { id: "lh19", date: new Date("2026-04-15T10:19:00"), ip: "10.80.1.2", location: "Ургенч", device: "Windows 10 / Chrome", result: "error" },
      { id: "lh20", date: new Date("2026-04-15T10:18:00"), ip: "10.80.1.2", location: "Ургенч", device: "Windows 10 / Chrome", result: "error" },
    ],
    activity: [
      { id: "a17", action: "Заблокирован системой", target: "Превышено число попыток входа", timestamp: new Date("2026-04-15T10:20:00") },
    ],
    stats: {
      processedApplications: 45,
      conversionRate: 55,
      avgResponseTime: 20,
      activeClients: 12,
      dailyApplications: [
        { date: "10.04", count: 2 }, { date: "11.04", count: 3 },
        { date: "12.04", count: 1 }, { date: "13.04", count: 2 },
        { date: "14.04", count: 1 }, { date: "15.04", count: 0 },
      ],
      monthlyConversion: [
        { month: "Янв", rate: 52 }, { month: "Фев", rate: 54 },
        { month: "Мар", rate: 55 }, { month: "Апр", rate: 55 },
        { month: "Май", rate: 0 },
      ],
    },
  },
];

export const BRANCHES_LIST = [
  "Ташкент — Чиланзар",
  "Ташкент — Юнусабад",
  "Самарканд — Центр",
  "Бухара — Центр",
  "Андижан — Центр",
  "Фергана — Центр",
  "Наманган — Центр",
  "Кашкадарья — Карши",
  "Хорезм — Ургенч",
  "Сурхандарья — Термез",
];
