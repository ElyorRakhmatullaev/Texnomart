// Mock data for Applications module

export interface Application {
  id: string;
  createdAt: Date;
  client: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
    pinfl: string;
    scoring: number; // 0-1000
  };
  amount: number;
  term: 1 | 3 | 6 | 12 | 24; // months
  partners: Array<{
    id: string;
    name: string;
    logo?: string;
  }>;
  branch: {
    id: string;
    name: string;
  };
  operator: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  status: ApplicationStatus;
  channel: "online" | "app" | "telegram" | "branch";
}

export type ApplicationStatus =
  | "new"
  | "scoring"
  | "approved"
  | "partially_approved"
  | "rejected"
  | "in_progress"
  | "awaiting_docs"
  | "contract_signed"
  | "completed"
  | "cancelled"
  | "overdue";

export const APPLICATION_STATUSES: Record<
  ApplicationStatus,
  { label: string; bg: string; text: string }
> = {
  new: { label: "Новая", bg: "bg-gray-200", text: "text-gray-900" },
  scoring: { label: "На скоринге", bg: "bg-sky-100", text: "text-sky-700" },
  approved: { label: "Одобрена", bg: "bg-green-100", text: "text-green-700" },
  partially_approved: {
    label: "Частично одобрена",
    bg: "bg-emerald-100",
    text: "text-green-700",
  },
  rejected: { label: "Отклонена", bg: "bg-red-100", text: "text-red-700" },
  in_progress: {
    label: "В работе у оператора",
    bg: "bg-amber-100",
    text: "text-amber-700",
  },
  awaiting_docs: {
    label: "Ожидает документы",
    bg: "bg-orange-100",
    text: "text-orange-800",
  },
  contract_signed: {
    label: "Подписан договор",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
  },
  completed: { label: "Завершена", bg: "bg-green-50", text: "text-lime-700" },
  cancelled: { label: "Отменена", bg: "bg-gray-100", text: "text-gray-700" },
  overdue: { label: "Просрочена", bg: "bg-red-100", text: "text-red-800" },
};

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: "BR-12483",
    createdAt: new Date("2026-05-15T14:32:00"),
    client: {
      id: "CL-001",
      name: "Алиев Озодбек",
      phone: "+998 90 123-45-67",
      pinfl: "12345678901234",
      scoring: 742,
    },
    amount: 4200000,
    term: 6,
    partners: [{ id: "P1", name: "Alif Nasiya" }],
    branch: { id: "B1", name: "ТЦ Малика" },
    operator: { id: "OP1", name: "Алина П.", avatar: undefined },
    status: "approved",
    channel: "app",
  },
  {
    id: "BR-12482",
    createdAt: new Date("2026-05-15T14:28:00"),
    client: {
      id: "CL-002",
      name: "Каримова Дилнура",
      phone: "+998 91 234-56-78",
      pinfl: "23456789012345",
      scoring: 680,
    },
    amount: 1850000,
    term: 3,
    partners: [{ id: "P2", name: "Uzum Nasiya" }],
    branch: { id: "B2", name: "Чорсу" },
    operator: null,
    status: "scoring",
    channel: "online",
  },
  {
    id: "BR-12481",
    createdAt: new Date("2026-05-15T14:21:00"),
    client: {
      id: "CL-003",
      name: "Юсупов Жасур",
      phone: "+998 93 345-67-89",
      pinfl: "34567890123456",
      scoring: 815,
    },
    amount: 7600000,
    term: 12,
    partners: [{ id: "P3", name: "Anorbank" }],
    branch: { id: "B3", name: "Самарканд центр" },
    operator: { id: "OP2", name: "Бекзод К." },
    status: "in_progress",
    channel: "branch",
  },
  {
    id: "BR-12480",
    createdAt: new Date("2026-05-15T14:15:00"),
    client: {
      id: "CL-004",
      name: "Рахимова Малика",
      phone: "+998 94 456-78-90",
      pinfl: "45678901234567",
      scoring: 520,
    },
    amount: 2300000,
    term: 6,
    partners: [
      { id: "P1", name: "Alif Nasiya" },
      { id: "P4", name: "Kapitalbank" },
    ],
    branch: { id: "B1", name: "ТЦ Малика" },
    operator: { id: "OP1", name: "Алина П." },
    status: "rejected",
    channel: "telegram",
  },
  {
    id: "BR-12479",
    createdAt: new Date("2026-05-15T14:08:00"),
    client: {
      id: "CL-005",
      name: "Мирзаев Акбар",
      phone: "+998 97 567-89-01",
      pinfl: "56789012345678",
      scoring: 695,
    },
    amount: 3500000,
    term: 12,
    partners: [{ id: "P2", name: "Uzum Nasiya" }],
    branch: { id: "B4", name: "Бухара филиал" },
    operator: { id: "OP3", name: "Гулнора У." },
    status: "awaiting_docs",
    channel: "app",
  },
  {
    id: "BR-12478",
    createdAt: new Date("2026-05-15T13:52:00"),
    client: {
      id: "CL-006",
      name: "Усманова Нигора",
      phone: "+998 90 678-90-12",
      pinfl: "67890123456789",
      scoring: 890,
    },
    amount: 12000000,
    term: 24,
    partners: [{ id: "P5", name: "Ipoteka Bank" }],
    branch: { id: "B5", name: "Андижан-1" },
    operator: { id: "OP2", name: "Бекзод К." },
    status: "contract_signed",
    channel: "branch",
  },
  {
    id: "BR-12477",
    createdAt: new Date("2026-05-15T13:45:00"),
    client: {
      id: "CL-007",
      name: "Хамидов Фаррух",
      phone: "+998 91 789-01-23",
      pinfl: "78901234567890",
      scoring: 450,
    },
    amount: 1200000,
    term: 1,
    partners: [{ id: "P1", name: "Alif Nasiya" }],
    branch: { id: "B2", name: "Чорсу" },
    operator: null,
    status: "new",
    channel: "online",
  },
  {
    id: "BR-12476",
    createdAt: new Date("2026-05-15T13:38:00"),
    client: {
      id: "CL-008",
      name: "Назарова Саида",
      phone: "+998 93 890-12-34",
      pinfl: "89012345678901",
      scoring: 765,
    },
    amount: 5400000,
    term: 6,
    partners: [
      { id: "P2", name: "Uzum Nasiya" },
      { id: "P3", name: "Anorbank" },
      { id: "P4", name: "Kapitalbank" },
    ],
    branch: { id: "B6", name: "Фергана-парк" },
    operator: { id: "OP3", name: "Гулнора У." },
    status: "partially_approved",
    channel: "app",
  },
  {
    id: "BR-12475",
    createdAt: new Date("2026-05-15T13:22:00"),
    client: {
      id: "CL-009",
      name: "Азимов Шерзод",
      phone: "+998 94 901-23-45",
      pinfl: "90123456789012",
      scoring: 920,
    },
    amount: 8900000,
    term: 12,
    partners: [{ id: "P5", name: "Ipoteka Bank" }],
    branch: { id: "B3", name: "Самарканд центр" },
    operator: { id: "OP1", name: "Алина П." },
    status: "completed",
    channel: "branch",
  },
  {
    id: "BR-12474",
    createdAt: new Date("2026-05-15T13:10:00"),
    client: {
      id: "CL-010",
      name: "Исмаилова Лола",
      phone: "+998 97 012-34-56",
      pinfl: "01234567890123",
      scoring: 580,
    },
    amount: 2900000,
    term: 3,
    partners: [{ id: "P1", name: "Alif Nasiya" }],
    branch: { id: "B1", name: "ТЦ Малика" },
    operator: { id: "OP2", name: "Бекзод К." },
    status: "cancelled",
    channel: "telegram",
  },
];

export const MOCK_PARTNERS = [
  { id: "P1", name: "Alif Nasiya" },
  { id: "P2", name: "Uzum Nasiya" },
  { id: "P3", name: "Anorbank" },
  { id: "P4", name: "Kapitalbank" },
  { id: "P5", name: "Ipoteka Bank" },
];

export const MOCK_BRANCHES = [
  { id: "B1", name: "ТЦ Малика" },
  { id: "B2", name: "Чорсу" },
  { id: "B3", name: "Самарканд центр" },
  { id: "B4", name: "Бухара филиал" },
  { id: "B5", name: "Андижан-1" },
  { id: "B6", name: "Фергана-парк" },
];

export const MOCK_OPERATORS = [
  { id: "OP1", name: "Алина П." },
  { id: "OP2", name: "Бекзод К." },
  { id: "OP3", name: "Гулнора У." },
];
