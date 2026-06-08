export type BranchStatus = "active" | "inactive";

export const BRANCH_STATUSES: Record<BranchStatus, { label: string; bg: string; text: string }> = {
  active: { label: "Активен", bg: "bg-green-100", text: "text-green-700" },
  inactive: { label: "Неактивен", bg: "bg-gray-100", text: "text-gray-700" },
};

export interface BranchEmployee {
  id: string;
  name: string;
  initials: string;
  role: "operator" | "agent";
  phone: string;
  applicationsMonth: number;
}

export interface BranchPartnerConfig {
  partnerId: string;
  partnerName: string;
  logoColor: string;
  logoInitials: string;
  enabled: boolean;
  availableTerms: number[];
}

export interface PrioritySlot {
  partnerId: string;
  partnerName: string;
  logoColor: string;
  logoInitials: string;
  priority: number;
  startHour: number;
  endHour: number;
}

export interface DaySchedule {
  day: string;
  dayShort: string;
  slots: PrioritySlot[];
}

export interface BranchStats {
  applicationsToday: number;
  applicationsMonth: number;
  conversionRate: number;
  topPartner: string;
  dailyData: { date: string; applications: number }[];
  topAgents: { name: string; applications: number }[];
  topPartners: { name: string; applications: number; color: string }[];
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  region: string;
  phone: string;
  workingHours: string;
  manager: { name: string; initials: string };
  coordinates: { lat: number; lng: number };
  status: BranchStatus;
  employees: BranchEmployee[];
  partners: BranchPartnerConfig[];
  schedule: DaySchedule[];
  stats: BranchStats;
}

const REGIONS = [
  "Ташкент",
  "Ташкентская область",
  "Самарканд",
  "Бухара",
  "Андижан",
  "Фергана",
  "Наманган",
  "Кашкадарья",
  "Сурхандарья",
  "Хорезм",
];

const PARTNER_POOL: Omit<BranchPartnerConfig, "enabled" | "availableTerms">[] = [
  { partnerId: "alif", partnerName: "Alif Nasiya", logoColor: "bg-emerald-600", logoInitials: "AN" },
  { partnerId: "anorbank", partnerName: "Anorbank", logoColor: "bg-blue-600", logoInitials: "AB" },
  { partnerId: "uzum", partnerName: "Uzum Nasiya", logoColor: "bg-purple-600", logoInitials: "UN" },
  { partnerId: "iman", partnerName: "Iman", logoColor: "bg-teal-600", logoInitials: "IM" },
  { partnerId: "multicard", partnerName: "Multicard", logoColor: "bg-orange-600", logoInitials: "MC" },
  { partnerId: "asia", partnerName: "Asia Alliance", logoColor: "bg-red-600", logoInitials: "AA" },
];

function generateSchedule(): DaySchedule[] {
  const days = [
    { day: "Понедельник", dayShort: "Пн" },
    { day: "Вторник", dayShort: "Вт" },
    { day: "Среда", dayShort: "Ср" },
    { day: "Четверг", dayShort: "Чт" },
    { day: "Пятница", dayShort: "Пт" },
    { day: "Суббота", dayShort: "Сб" },
    { day: "Воскресенье", dayShort: "Вс" },
  ];

  return days.map((d) => ({
    ...d,
    slots: [
      { ...PARTNER_POOL[0], priority: 1, startHour: 9, endHour: 18 },
      { ...PARTNER_POOL[2], priority: 2, startHour: 9, endHour: 20 },
      { ...PARTNER_POOL[1], priority: 3, startHour: 10, endHour: 17 },
    ],
  }));
}

function generateStats(branchName: string): BranchStats {
  const base = Math.floor(Math.random() * 30) + 10;
  return {
    applicationsToday: base,
    applicationsMonth: base * 22 + Math.floor(Math.random() * 100),
    conversionRate: Math.round((40 + Math.random() * 35) * 10) / 10,
    topPartner: "Alif Nasiya",
    dailyData: Array.from({ length: 30 }, (_, i) => ({
      date: `${String(i + 1).padStart(2, "0")}.05`,
      applications: Math.floor(Math.random() * 40) + 10,
    })),
    topAgents: [
      { name: "Алина П.", applications: 87 },
      { name: "Бекзод К.", applications: 72 },
      { name: "Гулнора У.", applications: 65 },
      { name: "Даврон Т.", applications: 58 },
      { name: "Елена С.", applications: 41 },
    ],
    topPartners: [
      { name: "Alif Nasiya", applications: 145, color: "#059669" },
      { name: "Uzum Nasiya", applications: 112, color: "#7C3AED" },
      { name: "Anorbank", applications: 89, color: "#2563EB" },
      { name: "Iman", applications: 67, color: "#0D9488" },
      { name: "Multicard", applications: 45, color: "#EA580C" },
    ],
  };
}

export const MOCK_BRANCHES: Branch[] = [
  {
    id: "BR-001",
    name: "ТЦ Малика",
    address: "ул. Малика, 1, Ташкент",
    region: "Ташкент",
    phone: "+998 71 200-10-01",
    workingHours: "Пн-Сб 09:00–21:00, Вс 10:00–18:00",
    manager: { name: "Азизов Рустам", initials: "АР" },
    coordinates: { lat: 41.3111, lng: 69.2797 },
    status: "active",
    employees: [
      { id: "E1", name: "Алина Петрова", initials: "АП", role: "operator", phone: "+998 90 111 22 33", applicationsMonth: 87 },
      { id: "E2", name: "Бекзод Каримов", initials: "БК", role: "operator", phone: "+998 91 222 33 44", applicationsMonth: 72 },
      { id: "E3", name: "Гулнора Усманова", initials: "ГУ", role: "agent", phone: "+998 93 333 44 55", applicationsMonth: 65 },
      { id: "E4", name: "Даврон Тошматов", initials: "ДТ", role: "agent", phone: "+998 94 444 55 66", applicationsMonth: 58 },
    ],
    partners: PARTNER_POOL.map((p, i) => ({
      ...p,
      enabled: i < 4,
      availableTerms: [3, 6, 12, 24],
    })),
    schedule: generateSchedule(),
    stats: generateStats("ТЦ Малика"),
  },
  {
    id: "BR-002",
    name: "Чорсу базар",
    address: "ул. Чорсу, 12, Ташкент",
    region: "Ташкент",
    phone: "+998 71 200-10-02",
    workingHours: "Пн-Сб 08:00–20:00, Вс выходной",
    manager: { name: "Мирзаев Фарход", initials: "МФ" },
    coordinates: { lat: 41.3256, lng: 69.2345 },
    status: "active",
    employees: [
      { id: "E5", name: "Елена Сидорова", initials: "ЕС", role: "operator", phone: "+998 90 555 66 77", applicationsMonth: 41 },
      { id: "E6", name: "Жасур Юсупов", initials: "ЖЮ", role: "agent", phone: "+998 91 666 77 88", applicationsMonth: 53 },
    ],
    partners: PARTNER_POOL.map((p, i) => ({
      ...p,
      enabled: i < 3,
      availableTerms: [3, 6, 12],
    })),
    schedule: generateSchedule(),
    stats: generateStats("Чорсу базар"),
  },
  {
    id: "BR-003",
    name: "Самарканд Центр",
    address: "ул. Регистан, 5, Самарканд",
    region: "Самарканд",
    phone: "+998 66 233-10-03",
    workingHours: "Пн-Пт 09:00–18:00, Сб 10:00–16:00",
    manager: { name: "Хасанов Отабек", initials: "ХО" },
    coordinates: { lat: 39.6542, lng: 66.9597 },
    status: "active",
    employees: [
      { id: "E7", name: "Камола Рахимова", initials: "КР", role: "operator", phone: "+998 93 777 88 99", applicationsMonth: 62 },
      { id: "E8", name: "Лазиз Ибрагимов", initials: "ЛИ", role: "agent", phone: "+998 94 888 99 00", applicationsMonth: 48 },
      { id: "E9", name: "Мадина Алиева", initials: "МА", role: "agent", phone: "+998 90 999 00 11", applicationsMonth: 39 },
    ],
    partners: PARTNER_POOL.map((p, i) => ({
      ...p,
      enabled: i < 5,
      availableTerms: [3, 6, 12, 18, 24],
    })),
    schedule: generateSchedule(),
    stats: generateStats("Самарканд Центр"),
  },
  {
    id: "BR-004",
    name: "Бухара филиал",
    address: "ул. Накшбанди, 22, Бухара",
    region: "Бухара",
    phone: "+998 65 224-10-04",
    workingHours: "Пн-Пт 09:00–18:00, Сб 10:00–15:00",
    manager: { name: "Турсунов Ильхом", initials: "ТИ" },
    coordinates: { lat: 39.7747, lng: 64.4286 },
    status: "active",
    employees: [
      { id: "E10", name: "Нодира Каюмова", initials: "НК", role: "operator", phone: "+998 91 100 11 22", applicationsMonth: 34 },
      { id: "E11", name: "Олим Расулов", initials: "ОР", role: "agent", phone: "+998 93 200 22 33", applicationsMonth: 29 },
    ],
    partners: PARTNER_POOL.map((p, i) => ({
      ...p,
      enabled: i < 3,
      availableTerms: [3, 6, 12],
    })),
    schedule: generateSchedule(),
    stats: generateStats("Бухара филиал"),
  },
  {
    id: "BR-005",
    name: "Андижан-1",
    address: "ул. Навои, 8, Андижан",
    region: "Андижан",
    phone: "+998 74 226-10-05",
    workingHours: "Пн-Сб 09:00–20:00",
    manager: { name: "Сафаров Анвар", initials: "СА" },
    coordinates: { lat: 40.7821, lng: 72.3442 },
    status: "active",
    employees: [
      { id: "E12", name: "Парвина Хакимова", initials: "ПХ", role: "operator", phone: "+998 94 300 33 44", applicationsMonth: 55 },
      { id: "E13", name: "Равшан Эргашев", initials: "РЭ", role: "operator", phone: "+998 90 400 44 55", applicationsMonth: 47 },
      { id: "E14", name: "Сарвар Мирзаев", initials: "СМ", role: "agent", phone: "+998 91 500 55 66", applicationsMonth: 38 },
    ],
    partners: PARTNER_POOL.map((p, i) => ({
      ...p,
      enabled: i < 4,
      availableTerms: [3, 6, 12, 24],
    })),
    schedule: generateSchedule(),
    stats: generateStats("Андижан-1"),
  },
  {
    id: "BR-006",
    name: "Фергана-парк",
    address: "ул. Мустакиллик, 15, Фергана",
    region: "Фергана",
    phone: "+998 73 244-10-06",
    workingHours: "Пн-Пт 09:00–19:00, Сб 10:00–17:00",
    manager: { name: "Юлдашев Бахтиёр", initials: "ЮБ" },
    coordinates: { lat: 40.3864, lng: 71.7969 },
    status: "active",
    employees: [
      { id: "E15", name: "Тахмина Бобоева", initials: "ТБ", role: "operator", phone: "+998 93 600 66 77", applicationsMonth: 43 },
      { id: "E16", name: "Умид Жураев", initials: "УЖ", role: "agent", phone: "+998 94 700 77 88", applicationsMonth: 36 },
    ],
    partners: PARTNER_POOL.map((p, i) => ({
      ...p,
      enabled: i < 4,
      availableTerms: [3, 6, 12],
    })),
    schedule: generateSchedule(),
    stats: generateStats("Фергана-парк"),
  },
  {
    id: "BR-007",
    name: "Наманган Сити",
    address: "ул. Уйчи, 3, Наманган",
    region: "Наманган",
    phone: "+998 69 227-10-07",
    workingHours: "Пн-Сб 09:00–19:00",
    manager: { name: "Абдуллаев Шухрат", initials: "АШ" },
    coordinates: { lat: 41.0011, lng: 71.6722 },
    status: "active",
    employees: [
      { id: "E17", name: "Фарида Ташпулатова", initials: "ФТ", role: "operator", phone: "+998 90 800 88 99", applicationsMonth: 51 },
      { id: "E18", name: "Хуршид Рахматов", initials: "ХР", role: "agent", phone: "+998 91 900 99 00", applicationsMonth: 44 },
      { id: "E19", name: "Шахло Мирсалимова", initials: "ШМ", role: "agent", phone: "+998 93 010 00 11", applicationsMonth: 31 },
    ],
    partners: PARTNER_POOL.map((p, i) => ({
      ...p,
      enabled: i < 5,
      availableTerms: [3, 6, 12, 18],
    })),
    schedule: generateSchedule(),
    stats: generateStats("Наманган Сити"),
  },
  {
    id: "BR-008",
    name: "Карши Центральный",
    address: "ул. Ислом Каримов, 44, Карши",
    region: "Кашкадарья",
    phone: "+998 75 225-10-08",
    workingHours: "Пн-Пт 09:00–18:00",
    manager: { name: "Норматов Дилмурод", initials: "НД" },
    coordinates: { lat: 38.8606, lng: 65.7983 },
    status: "active",
    employees: [
      { id: "E20", name: "Юлдуз Кодирова", initials: "ЮК", role: "operator", phone: "+998 94 020 11 22", applicationsMonth: 28 },
    ],
    partners: PARTNER_POOL.map((p, i) => ({
      ...p,
      enabled: i < 3,
      availableTerms: [3, 6, 12],
    })),
    schedule: generateSchedule(),
    stats: generateStats("Карши Центральный"),
  },
  {
    id: "BR-009",
    name: "Ургенч филиал",
    address: "ул. Аль-Хорезми, 7, Ургенч",
    region: "Хорезм",
    phone: "+998 62 228-10-09",
    workingHours: "Пн-Пт 09:00–18:00, Сб 10:00–15:00",
    manager: { name: "Эшматов Акмал", initials: "ЭА" },
    coordinates: { lat: 41.5533, lng: 60.6317 },
    status: "inactive",
    employees: [
      { id: "E21", name: "Зарина Мамадалиева", initials: "ЗМ", role: "operator", phone: "+998 90 030 22 33", applicationsMonth: 0 },
    ],
    partners: PARTNER_POOL.map((p) => ({
      ...p,
      enabled: false,
      availableTerms: [3, 6],
    })),
    schedule: generateSchedule(),
    stats: { ...generateStats("Ургенч филиал"), applicationsToday: 0, applicationsMonth: 0, conversionRate: 0, topPartner: "—" },
  },
  {
    id: "BR-010",
    name: "Термез Главный",
    address: "ул. Ат-Термизий, 19, Термез",
    region: "Сурхандарья",
    phone: "+998 76 222-10-10",
    workingHours: "Пн-Пт 09:00–18:00",
    manager: { name: "Гафуров Зафар", initials: "ГЗ" },
    coordinates: { lat: 37.2241, lng: 67.2783 },
    status: "active",
    employees: [
      { id: "E22", name: "Ирода Назарова", initials: "ИН", role: "operator", phone: "+998 91 040 33 44", applicationsMonth: 33 },
      { id: "E23", name: "Комил Абдурахманов", initials: "КА", role: "agent", phone: "+998 93 050 44 55", applicationsMonth: 27 },
    ],
    partners: PARTNER_POOL.map((p, i) => ({
      ...p,
      enabled: i < 3,
      availableTerms: [3, 6, 12],
    })),
    schedule: generateSchedule(),
    stats: generateStats("Термез Главный"),
  },
];

export const ALL_REGIONS = [...new Set(MOCK_BRANCHES.map((b) => b.region))];
