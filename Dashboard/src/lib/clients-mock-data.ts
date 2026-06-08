export type ClientStatus = "active" | "inactive" | "blocked";

export const CLIENT_STATUSES: Record<
  ClientStatus,
  { label: string; bg: string; text: string }
> = {
  active: { label: "Активен", bg: "bg-green-100", text: "text-green-700" },
  inactive: { label: "Неактивен", bg: "bg-gray-100", text: "text-gray-700" },
  blocked: { label: "Заблокирован", bg: "bg-red-100", text: "text-red-700" },
};

export interface ClientCard {
  id: string;
  type: "uzcard" | "humo" | "visa" | "mastercard";
  masked: string;
  bank: string;
  verified: boolean;
}

export interface Installment {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerLogo?: string;
  totalAmount: number;
  remainingAmount: number;
  dueDate: Date;
  monthsPaid: number;
  totalMonths: number;
}

export interface Payment {
  id: string;
  date: Date;
  amount: number;
  installmentId: string;
  status: "paid" | "pending" | "overdue";
}

export interface ActivityEntry {
  id: string;
  type: "login" | "application" | "support" | "profile";
  description: string;
  timestamp: Date;
  meta?: string;
}

export interface ClientComment {
  id: string;
  author: string;
  authorRole: string;
  text: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string;
  fullName: string;
  avatar?: string;
  pinfl: string;
  pinflMasked: string;
  passportSeries: string;
  passportNumber: string;
  birthDate: Date;
  gender: "male" | "female";
  phone: string;
  phoneMasked: string;
  phoneAdditional?: string;
  email?: string;
  address: string;
  region: string;
  scoring: number;
  status: ClientStatus;
  isVip: boolean;
  isBlacklisted: boolean;
  applicationsCount: number;
  activeInstallments: number;
  totalInstallmentSum: number;
  ltv: number;
  registeredAt: Date;
  lastActivityAt: Date;
  maritalStatus: string;
  dependents: number;
  cards: ClientCard[];
  installments: Installment[];
  payments: Payment[];
  activity: ActivityEntry[];
  comments: ClientComment[];
  tags: string[];
}

const REGIONS = [
  "Ташкент",
  "Самарканд",
  "Бухара",
  "Наманган",
  "Фергана",
  "Андижан",
  "Нукус",
  "Карши",
  "Навои",
  "Термез",
  "Джиззак",
  "Гулистан",
  "Ургенч",
];

const FIRST_NAMES_MALE = [
  "Озодбек",
  "Шерзод",
  "Бобур",
  "Жасур",
  "Дильшод",
  "Азиз",
  "Фаррух",
  "Улугбек",
  "Ислом",
  "Достон",
  "Абдулла",
  "Нодир",
];

const FIRST_NAMES_FEMALE = [
  "Малика",
  "Дилноза",
  "Нигора",
  "Шахло",
  "Гулнора",
  "Зарина",
  "Мадина",
  "Камола",
];

const LAST_NAMES = [
  "Алиев",
  "Каримов",
  "Рахимов",
  "Ибрагимов",
  "Хасанов",
  "Юсупов",
  "Мирзаев",
  "Ахмедов",
  "Султанов",
  "Нурматов",
  "Абдуллаев",
  "Турсунов",
  "Исмаилов",
  "Саидов",
  "Махмудов",
  "Закиров",
  "Файзуллаев",
  "Баходиров",
  "Норматов",
  "Кадыров",
];

const MIDDLE_NAMES_MALE = [
  "Бахтиёрович",
  "Рустамович",
  "Алишерович",
  "Ильхомович",
  "Шухратович",
  "Анварович",
  "Камолович",
  "Тимурович",
];

const MIDDLE_NAMES_FEMALE = [
  "Бахтиёровна",
  "Рустамовна",
  "Алишеровна",
  "Ильхомовна",
  "Шухратовна",
  "Анваровна",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function generatePhone(): string {
  const codes = ["90", "91", "93", "94", "95", "97", "98", "99", "33", "55"];
  const code = pick(codes);
  const d = () => randomInt(0, 9);
  return `+998 ${code} ${d()}${d()}${d()}-${d()}${d()}-${d()}${d()}`;
}

function maskPhone(phone: string): string {
  return phone.replace(/(\+998 \d{2}) (\d)\d\d-\d\d-(\d\d)/, "$1 $2••-••-$3");
}

function generatePinfl(): string {
  return Array.from({ length: 14 }, () => randomInt(0, 9)).join("");
}

function maskPinfl(pinfl: string): string {
  return `••••${pinfl.slice(-4)}`;
}

function generateCards(): ClientCard[] {
  const types: ClientCard["type"][] = ["uzcard", "humo", "visa", "mastercard"];
  const banks = ["Ipoteka Bank", "NBU", "Kapitalbank", "Hamkorbank", "Asaka Bank", "InfinBank"];
  const count = randomInt(1, 3);
  return Array.from({ length: count }, (_, i) => ({
    id: `card-${i}`,
    type: pick(types),
    masked: `•••• •••• •••• ${randomInt(1000, 9999)}`,
    bank: pick(banks),
    verified: Math.random() > 0.3,
  }));
}

function generateInstallments(clientId: string): Installment[] {
  const partners = [
    { id: "p1", name: "Alif Nasiya" },
    { id: "p2", name: "Anorbank" },
    { id: "p3", name: "Uzum Nasiya" },
    { id: "p4", name: "Iman" },
    { id: "p5", name: "Multicard" },
  ];
  const count = randomInt(0, 3);
  return Array.from({ length: count }, (_, i) => {
    const totalMonths = pick([3, 6, 12, 18, 24]);
    const monthsPaid = randomInt(1, totalMonths);
    const totalAmount = randomInt(2, 50) * 1_000_000;
    return {
      id: `${clientId}-inst-${i}`,
      partnerId: partners[i % partners.length].id,
      partnerName: partners[i % partners.length].name,
      totalAmount,
      remainingAmount: Math.round(totalAmount * ((totalMonths - monthsPaid) / totalMonths)),
      dueDate: new Date(2026, randomInt(5, 11), randomInt(1, 28)),
      monthsPaid,
      totalMonths,
    };
  });
}

function generatePayments(installments: Installment[]): Payment[] {
  const payments: Payment[] = [];
  for (const inst of installments) {
    for (let m = 0; m < inst.monthsPaid; m++) {
      payments.push({
        id: `pay-${inst.id}-${m}`,
        date: new Date(2026, m, randomInt(1, 28)),
        amount: Math.round(inst.totalAmount / inst.totalMonths),
        installmentId: inst.id,
        status: "paid",
      });
    }
    if (Math.random() > 0.7) {
      payments.push({
        id: `pay-${inst.id}-next`,
        date: new Date(2026, inst.monthsPaid, randomInt(1, 28)),
        amount: Math.round(inst.totalAmount / inst.totalMonths),
        installmentId: inst.id,
        status: Math.random() > 0.5 ? "pending" : "overdue",
      });
    }
  }
  return payments.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function generateActivity(): ActivityEntry[] {
  const entries: ActivityEntry[] = [];
  const now = new Date(2026, 4, 22);
  const types: ActivityEntry["type"][] = ["login", "application", "support", "profile"];
  const descriptions: Record<ActivityEntry["type"], string[]> = {
    login: ["Вход в личный кабинет", "Вход через мобильное приложение", "Вход через Telegram-бот"],
    application: ["Подана новая заявка", "Загружены документы", "Подписан договор"],
    support: ["Обращение в поддержку", "Запрос на изменение данных", "Жалоба на обслуживание"],
    profile: ["Обновлён номер телефона", "Изменён адрес проживания", "Загружено фото паспорта"],
  };
  const count = randomInt(8, 20);
  for (let i = 0; i < count; i++) {
    const type = pick(types);
    entries.push({
      id: `act-${i}`,
      type,
      description: pick(descriptions[type]),
      timestamp: randomDate(new Date(now.getTime() - 90 * 86400000), now),
    });
  }
  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function generateComments(): ClientComment[] {
  const authors = [
    { name: "Иванова А.С.", role: "Оператор" },
    { name: "Петров К.М.", role: "Менеджер" },
    { name: "Сидоров Д.В.", role: "Администратор" },
  ];
  const texts = [
    "Клиент запросил увеличение лимита. Передано на рассмотрение.",
    "Проверены документы, всё в порядке.",
    "Клиент обратился повторно по вопросу рассрочки.",
    "VIP-клиент, обработать в приоритете.",
    "Необходимо связаться для уточнения адреса.",
    "Просрочка закрыта, оплата поступила.",
  ];
  const count = randomInt(2, 5);
  const now = new Date(2026, 4, 22);
  return Array.from({ length: count }, (_, i) => {
    const author = pick(authors);
    return {
      id: `comment-${i}`,
      author: author.name,
      authorRole: author.role,
      text: pick(texts),
      isInternal: Math.random() > 0.5,
      createdAt: randomDate(new Date(now.getTime() - 30 * 86400000), now),
    };
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function generateClient(index: number): Client {
  const isFemale = Math.random() > 0.7;
  const firstName = isFemale ? pick(FIRST_NAMES_FEMALE) : pick(FIRST_NAMES_MALE);
  const lastName = pick(LAST_NAMES) + (isFemale ? "а" : "");
  const middleName = isFemale ? pick(MIDDLE_NAMES_FEMALE) : pick(MIDDLE_NAMES_MALE);
  const phone = generatePhone();
  const pinfl = generatePinfl();
  const id = `CL-${String(index + 1).padStart(5, "0")}`;
  const status: ClientStatus = pick(["active", "active", "active", "inactive", "blocked"]);
  const scoring = randomInt(200, 950);
  const registeredAt = randomDate(new Date(2023, 0, 1), new Date(2026, 3, 1));
  const lastActivityAt = randomDate(new Date(2026, 2, 1), new Date(2026, 4, 22));
  const installments = generateInstallments(id);

  return {
    id,
    firstName,
    lastName,
    middleName,
    fullName: `${lastName} ${firstName} ${middleName}`,
    pinfl,
    pinflMasked: maskPinfl(pinfl),
    passportSeries: pick(["AA", "AB", "AC", "AD"]),
    passportNumber: String(randomInt(1000000, 9999999)),
    birthDate: randomDate(new Date(1970, 0, 1), new Date(2002, 0, 1)),
    gender: isFemale ? "female" : "male",
    phone,
    phoneMasked: maskPhone(phone),
    phoneAdditional: Math.random() > 0.6 ? generatePhone() : undefined,
    email: Math.random() > 0.4 ? `${firstName.toLowerCase()}@mail.uz` : undefined,
    address: `г. ${pick(REGIONS)}, ул. ${pick(["Навои", "Амира Темура", "Бунёдкор", "Истиқлол", "Мустақиллик", "Беруний"])} ${randomInt(1, 150)}, кв. ${randomInt(1, 80)}`,
    region: pick(REGIONS),
    scoring,
    status,
    isVip: Math.random() > 0.85,
    isBlacklisted: Math.random() > 0.95,
    applicationsCount: randomInt(0, 15),
    activeInstallments: installments.length,
    totalInstallmentSum: installments.reduce((s, i) => s + i.totalAmount, 0),
    ltv: randomInt(0, 120) * 1_000_000,
    registeredAt,
    lastActivityAt,
    maritalStatus: pick(["Женат/Замужем", "Холост/Не замужем", "Разведён/Разведена"]),
    dependents: randomInt(0, 5),
    cards: generateCards(),
    installments,
    payments: generatePayments(installments),
    activity: generateActivity(),
    comments: generateComments(),
    tags: [
      ...(Math.random() > 0.85 ? ["VIP"] : []),
      ...(Math.random() > 0.95 ? ["Проблемный"] : []),
      ...(Math.random() > 0.8 ? ["Постоянный"] : []),
      ...(Math.random() > 0.9 ? ["Новый"] : []),
    ],
  };
}

// Seed the first client to match the spec: "Алиев Озодбек, CL-00428"
function generateMockClients(): Client[] {
  const clients: Client[] = [];
  for (let i = 0; i < 20; i++) {
    clients.push(generateClient(i));
  }

  // Override first client to match spec
  const featured = clients[0];
  featured.id = "CL-00428";
  featured.firstName = "Озодбек";
  featured.lastName = "Алиев";
  featured.middleName = "Бахтиёрович";
  featured.fullName = "Алиев Озодбек Бахтиёрович";
  featured.scoring = 782;
  featured.status = "active";
  featured.isVip = true;
  featured.isBlacklisted = false;
  featured.applicationsCount = 7;
  featured.activeInstallments = 2;
  featured.totalInstallmentSum = 24_500_000;
  featured.ltv = 68_000_000;
  featured.region = "Ташкент";
  featured.tags = ["VIP", "Постоянный"];

  return clients;
}

export const MOCK_CLIENTS: Client[] = generateMockClients();

export const AVAILABLE_TAGS = [
  "VIP",
  "Проблемный",
  "Постоянный",
  "Новый",
  "Должник",
  "Повторный",
  "Рекомендован",
];

export const SCORING_COLORS = {
  low: { dot: "bg-red-500", text: "text-red-600" },
  medium: { dot: "bg-yellow-500", text: "text-yellow-600" },
  high: { dot: "bg-green-500", text: "text-green-600" },
} as const;

export function getScoringColor(score: number) {
  if (score < 500) return SCORING_COLORS.low;
  if (score <= 700) return SCORING_COLORS.medium;
  return SCORING_COLORS.high;
}
