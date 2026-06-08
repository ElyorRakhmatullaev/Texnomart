export type BotConfig = {
  token: string;
  webhookUrl: string;
  isEnabled: boolean;
  username: string;
  subscriberCount: number;
  welcomeMessages: Record<string, string>;
  commands: BotCommand[];
};

export type BotCommand = {
  id: string;
  command: string;
  description: string;
  enabled: boolean;
};

export type TemplateCategory = "all" | "greetings" | "statuses" | "reminders" | "marketing";

export type MessageTemplate = {
  id: string;
  name: string;
  category: Exclude<TemplateCategory, "all">;
  languages: string[];
  content: Record<string, string>;
  preview: string;
  lastEdited: string;
  editedBy: string;
};

export type BroadcastStatus = "sent" | "scheduled" | "in_progress" | "draft" | "cancelled";

export type Broadcast = {
  id: string;
  name: string;
  segment: string;
  templateId: string;
  templateName: string;
  scheduledAt: string;
  sentCount: number;
  totalCount: number;
  deliveredPercent: number;
  readPercent: number;
  clickCount: number;
  status: BroadcastStatus;
};

export const BROADCAST_STATUS_CONFIG: Record<BroadcastStatus, { label: string; className: string }> = {
  sent: { label: "Отправлено", className: "bg-green-100 text-green-800" },
  scheduled: { label: "Запланировано", className: "bg-blue-100 text-blue-800" },
  in_progress: { label: "Отправляется", className: "bg-yellow-100 text-yellow-800" },
  draft: { label: "Черновик", className: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Отменено", className: "bg-red-100 text-red-800" },
};

export type SubscriberStatus = "subscribed" | "blocked";

export type Subscriber = {
  id: string;
  username: string;
  displayName: string;
  linkedClientId: string | null;
  linkedClientName: string | null;
  subscribedAt: string;
  lastActivity: string;
  messageCount: number;
  status: SubscriberStatus;
};

export type TelegramKpi = {
  label: string;
  value: number;
  delta: number;
  format: "number" | "percent";
};

export type FaqItem = {
  id: string;
  question: Record<string, string>;
  answer: Record<string, string>;
  active: boolean;
  order: number;
};

export type AutoReplyRule = {
  id: string;
  keyword: string;
  isRegex: boolean;
  templateId: string;
  templateName: string;
  active: boolean;
};

export type FunnelStep = {
  label: string;
  value: number;
  percent: number;
};

export const BOT_CONFIG: BotConfig = {
  token: "6847291053:AAH_kP9xNmVz3qRtW8yLcDfEgHiJkLmNoPq",
  webhookUrl: "https://api.texnomart-broker.uz/webhooks/telegram",
  isEnabled: true,
  username: "@texnomart_bot",
  subscriberCount: 8423,
  welcomeMessages: {
    ru: "Добро пожаловать в Texnomart! 🎉\n\nЯ помогу вам:\n• Отслеживать статус заявки\n• Узнать условия рассрочки\n• Найти ближайший филиал\n\nВыберите команду из меню или напишите свой вопрос.",
    uz: "Texnomart-ga xush kelibsiz! 🎉\n\nMen sizga yordam beraman:\n• Ariza holatini kuzatish\n• Bo'lib to'lash shartlarini bilish\n• Yaqin filialni topish\n\nMenyudan buyruqni tanlang yoki savolingizni yozing.",
  },
  commands: [
    { id: "cmd-1", command: "/start", description: "Начать работу с ботом", enabled: true },
    { id: "cmd-2", command: "/status", description: "Проверить статус заявки", enabled: true },
    { id: "cmd-3", command: "/calc", description: "Калькулятор рассрочки", enabled: true },
    { id: "cmd-4", command: "/branches", description: "Найти ближайший филиал", enabled: true },
    { id: "cmd-5", command: "/help", description: "Помощь и FAQ", enabled: true },
    { id: "cmd-6", command: "/feedback", description: "Оставить отзыв", enabled: true },
    { id: "cmd-7", command: "/language", description: "Сменить язык / Tilni o'zgartirish", enabled: true },
    { id: "cmd-8", command: "/promo", description: "Текущие акции", enabled: false },
  ],
};

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "tpl-1",
    name: "Приветствие нового пользователя",
    category: "greetings",
    languages: ["RU", "UZ"],
    content: {
      ru: "Здравствуйте, {{name}}! Добро пожаловать в Texnomart. Ваш ближайший филиал — {{branch}}.",
      uz: "Salom, {{name}}! Texnomart-ga xush kelibsiz. Sizga yaqin filial — {{branch}}.",
    },
    preview: "Здравствуйте, {{name}}! Добро пожаловать...",
    lastEdited: "2026-05-20",
    editedBy: "Администратор",
  },
  {
    id: "tpl-2",
    name: "Заявка принята",
    category: "statuses",
    languages: ["RU", "UZ"],
    content: {
      ru: "Ваша заявка №{{application_id}} принята и передана на рассмотрение. Ожидайте ответа в течение 30 минут.",
      uz: "Sizning №{{application_id}} arizangiz qabul qilindi. Javobni 30 daqiqa ichida kuting.",
    },
    preview: "Ваша заявка №{{application_id}} принята...",
    lastEdited: "2026-05-18",
    editedBy: "Администратор",
  },
  {
    id: "tpl-3",
    name: "Заявка одобрена",
    category: "statuses",
    languages: ["RU", "UZ"],
    content: {
      ru: "🎉 Поздравляем! Ваша заявка №{{application_id}} одобрена на сумму {{amount}} UZS. Срок: {{term}} мес. Партнёр: {{partner}}.",
      uz: "🎉 Tabriklaymiz! №{{application_id}} arizangiz {{amount}} UZS miqdorida tasdiqlandi. Muddat: {{term}} oy.",
    },
    preview: "🎉 Поздравляем! Ваша заявка одобрена...",
    lastEdited: "2026-05-18",
    editedBy: "Администратор",
  },
  {
    id: "tpl-4",
    name: "Заявка отклонена",
    category: "statuses",
    languages: ["RU"],
    content: {
      ru: "К сожалению, ваша заявка №{{application_id}} отклонена. Причина: {{reason}}. Вы можете подать новую заявку через 30 дней.",
    },
    preview: "К сожалению, ваша заявка отклонена...",
    lastEdited: "2026-05-15",
    editedBy: "Администратор",
  },
  {
    id: "tpl-5",
    name: "Напоминание о платеже",
    category: "reminders",
    languages: ["RU", "UZ"],
    content: {
      ru: "Напоминаем: следующий платёж по договору №{{contract_id}} — {{amount}} UZS до {{date}}. Оплатите через приложение или в филиале {{branch}}.",
      uz: "Eslatma: №{{contract_id}} shartnoma bo'yicha keyingi to'lov — {{amount}} UZS, {{date}} gacha.",
    },
    preview: "Напоминаем: следующий платёж...",
    lastEdited: "2026-05-22",
    editedBy: "Оператор Алиева",
  },
  {
    id: "tpl-6",
    name: "Просрочка платежа",
    category: "reminders",
    languages: ["RU"],
    content: {
      ru: "⚠️ Уважаемый {{name}}, платёж по договору №{{contract_id}} просрочен на {{days}} дн. Сумма к оплате: {{amount}} UZS. Свяжитесь с нами: +998 71 200-00-00.",
    },
    preview: "⚠️ Платёж просрочен на {{days}} дн...",
    lastEdited: "2026-05-19",
    editedBy: "Администратор",
  },
  {
    id: "tpl-7",
    name: "Документы получены",
    category: "statuses",
    languages: ["RU", "UZ"],
    content: {
      ru: "Документы по заявке №{{application_id}} получены и переданы на проверку. Результат — в течение 1 рабочего дня.",
      uz: "№{{application_id}} ariza bo'yicha hujjatlar qabul qilindi. Natija — 1 ish kuni ichida.",
    },
    preview: "Документы по заявке получены...",
    lastEdited: "2026-05-17",
    editedBy: "Администратор",
  },
  {
    id: "tpl-8",
    name: "Акция: Электроника",
    category: "marketing",
    languages: ["RU", "UZ"],
    content: {
      ru: "🔥 Специальное предложение! Рассрочка 0% на {{category}} до {{date}}. Подробнее: {{link}}",
      uz: "🔥 Maxsus taklif! {{category}} uchun 0% bo'lib to'lash {{date}} gacha. Batafsil: {{link}}",
    },
    preview: "🔥 Специальное предложение! Рассрочка 0%...",
    lastEdited: "2026-05-23",
    editedBy: "Маркетолог Каримов",
  },
  {
    id: "tpl-9",
    name: "Акция: Бытовая техника",
    category: "marketing",
    languages: ["RU"],
    content: {
      ru: "🏠 Обновите дом! Скидки до 30% на бытовую технику + рассрочка от 3 мес. Только до {{date}}!",
    },
    preview: "🏠 Обновите дом! Скидки до 30%...",
    lastEdited: "2026-05-21",
    editedBy: "Маркетолог Каримов",
  },
  {
    id: "tpl-10",
    name: "Добро пожаловать обратно",
    category: "greetings",
    languages: ["RU"],
    content: {
      ru: "С возвращением, {{name}}! Мы рады видеть вас снова. Новые условия рассрочки уже доступны — напишите /calc для расчёта.",
    },
    preview: "С возвращением, {{name}}!...",
    lastEdited: "2026-05-16",
    editedBy: "Администратор",
  },
  {
    id: "tpl-11",
    name: "Ближайший филиал",
    category: "greetings",
    languages: ["RU", "UZ"],
    content: {
      ru: "Ваш ближайший филиал Texnomart:\n📍 {{branch_name}}\n🏠 {{address}}\n📞 {{phone}}\n🕐 {{hours}}",
      uz: "Sizga yaqin Texnomart filiali:\n📍 {{branch_name}}\n🏠 {{address}}\n📞 {{phone}}\n🕐 {{hours}}",
    },
    preview: "Ваш ближайший филиал Texnomart...",
    lastEdited: "2026-05-14",
    editedBy: "Администратор",
  },
  {
    id: "tpl-12",
    name: "Напоминание: скоро платёж",
    category: "reminders",
    languages: ["RU"],
    content: {
      ru: "📅 Через 3 дня — платёж по договору №{{contract_id}}. Сумма: {{amount}} UZS. Не забудьте оплатить вовремя!",
    },
    preview: "📅 Через 3 дня — платёж...",
    lastEdited: "2026-05-20",
    editedBy: "Оператор Алиева",
  },
  {
    id: "tpl-13",
    name: "Чёрная пятница",
    category: "marketing",
    languages: ["RU", "UZ"],
    content: {
      ru: "🖤 ЧЁРНАЯ ПЯТНИЦА в Texnomart! Скидки до 50% + рассрочка 0% на 12 мес. Только {{date}}!",
      uz: "🖤 QORA JUMA Texnomart-da! 50% gacha chegirma + 12 oyga 0% bo'lib to'lash. Faqat {{date}}!",
    },
    preview: "🖤 ЧЁРНАЯ ПЯТНИЦА в Texnomart!...",
    lastEdited: "2026-05-10",
    editedBy: "Маркетолог Каримов",
  },
  {
    id: "tpl-14",
    name: "Статус: на скоринге",
    category: "statuses",
    languages: ["RU"],
    content: {
      ru: "Ваша заявка №{{application_id}} на этапе скоринга. Это занимает обычно 10–15 минут. Мы уведомим вас о результате.",
    },
    preview: "Ваша заявка на этапе скоринга...",
    lastEdited: "2026-05-18",
    editedBy: "Администратор",
  },
  {
    id: "tpl-15",
    name: "Опрос удовлетворённости",
    category: "marketing",
    languages: ["RU"],
    content: {
      ru: "Здравствуйте, {{name}}! Как вам обслуживание в Texnomart? Оцените от 1 до 5 ⭐. Ваш отзыв поможет нам стать лучше!",
    },
    preview: "Как вам обслуживание? Оцените от 1 до 5...",
    lastEdited: "2026-05-12",
    editedBy: "Маркетолог Каримов",
  },
];

export const BROADCASTS: Broadcast[] = [
  {
    id: "bc-1",
    name: "Майская акция — электроника",
    segment: "Все подписчики",
    templateId: "tpl-8",
    templateName: "Акция: Электроника",
    scheduledAt: "2026-05-25 10:00",
    sentCount: 8423,
    totalCount: 8423,
    deliveredPercent: 94.2,
    readPercent: 67.8,
    clickCount: 1247,
    status: "sent",
  },
  {
    id: "bc-2",
    name: "Напоминание о платежах — июнь",
    segment: "С активными договорами",
    templateId: "tpl-5",
    templateName: "Напоминание о платеже",
    scheduledAt: "2026-06-01 09:00",
    sentCount: 0,
    totalCount: 3150,
    deliveredPercent: 0,
    readPercent: 0,
    clickCount: 0,
    status: "scheduled",
  },
  {
    id: "bc-3",
    name: "Бытовая техника — скидки",
    segment: "Ташкент",
    templateId: "tpl-9",
    templateName: "Акция: Бытовая техника",
    scheduledAt: "2026-05-24 14:00",
    sentCount: 2890,
    totalCount: 4210,
    deliveredPercent: 68.6,
    readPercent: 0,
    clickCount: 0,
    status: "in_progress",
  },
  {
    id: "bc-4",
    name: "Возвращение неактивных",
    segment: "Неактивные 30+ дней",
    templateId: "tpl-10",
    templateName: "Добро пожаловать обратно",
    scheduledAt: "2026-05-20 11:00",
    sentCount: 1560,
    totalCount: 1560,
    deliveredPercent: 91.5,
    readPercent: 42.3,
    clickCount: 312,
    status: "sent",
  },
  {
    id: "bc-5",
    name: "Опрос NPS — май",
    segment: "Завершившие сделку",
    templateId: "tpl-15",
    templateName: "Опрос удовлетворённости",
    scheduledAt: "2026-05-22 15:00",
    sentCount: 890,
    totalCount: 890,
    deliveredPercent: 96.1,
    readPercent: 55.7,
    clickCount: 445,
    status: "sent",
  },
  {
    id: "bc-6",
    name: "Тест: A/B заголовки",
    segment: "Самарканд",
    templateId: "tpl-8",
    templateName: "Акция: Электроника",
    scheduledAt: "",
    sentCount: 0,
    totalCount: 1200,
    deliveredPercent: 0,
    readPercent: 0,
    clickCount: 0,
    status: "draft",
  },
  {
    id: "bc-7",
    name: "Просрочки — предупреждение",
    segment: "С просрочкой > 5 дней",
    templateId: "tpl-6",
    templateName: "Просрочка платежа",
    scheduledAt: "2026-05-19 08:00",
    sentCount: 234,
    totalCount: 234,
    deliveredPercent: 98.3,
    readPercent: 78.6,
    clickCount: 67,
    status: "sent",
  },
  {
    id: "bc-8",
    name: "Чёрная пятница — анонс",
    segment: "Все подписчики",
    templateId: "tpl-13",
    templateName: "Чёрная пятница",
    scheduledAt: "2026-05-23 09:00",
    sentCount: 8200,
    totalCount: 8423,
    deliveredPercent: 0,
    readPercent: 0,
    clickCount: 0,
    status: "cancelled",
  },
];

export const SUBSCRIBERS: Subscriber[] = [
  { id: "sub-1", username: "@alieva_ozoda", displayName: "Озода Алиева", linkedClientId: "CL-00428", linkedClientName: "Алиев Озодбек", subscribedAt: "2026-01-15", lastActivity: "2026-05-24", messageCount: 47, status: "subscribed" },
  { id: "sub-2", username: "@karimov_r", displayName: "Рустам Каримов", linkedClientId: "CL-00102", linkedClientName: "Каримов Рустам", subscribedAt: "2026-02-03", lastActivity: "2026-05-23", messageCount: 23, status: "subscribed" },
  { id: "sub-3", username: "@nodira_m", displayName: "Нодира Мирзаева", linkedClientId: null, linkedClientName: null, subscribedAt: "2026-03-10", lastActivity: "2026-05-24", messageCount: 65, status: "subscribed" },
  { id: "sub-4", username: "@javlon2000", displayName: "Жавлон Усманов", linkedClientId: "CL-00215", linkedClientName: "Усманов Жавлон", subscribedAt: "2026-01-28", lastActivity: "2026-05-22", messageCount: 12, status: "subscribed" },
  { id: "sub-5", username: "@dilshod_t", displayName: "Дилшод Турсунов", linkedClientId: null, linkedClientName: null, subscribedAt: "2026-04-05", lastActivity: "2026-05-20", messageCount: 8, status: "subscribed" },
  { id: "sub-6", username: "@malika_sh", displayName: "Малика Шарипова", linkedClientId: "CL-00334", linkedClientName: "Шарипова Малика", subscribedAt: "2025-12-20", lastActivity: "2026-05-24", messageCount: 89, status: "subscribed" },
  { id: "sub-7", username: "@bobur_n", displayName: "Бобур Назаров", linkedClientId: null, linkedClientName: null, subscribedAt: "2026-02-14", lastActivity: "2026-04-10", messageCount: 3, status: "blocked" },
  { id: "sub-8", username: "@gulnara_a", displayName: "Гульнара Ахмедова", linkedClientId: "CL-00501", linkedClientName: "Ахмедова Гульнара", subscribedAt: "2026-03-22", lastActivity: "2026-05-23", messageCount: 34, status: "subscribed" },
  { id: "sub-9", username: "@sardor_dev", displayName: "Сардор Рахимов", linkedClientId: null, linkedClientName: null, subscribedAt: "2026-04-18", lastActivity: "2026-05-24", messageCount: 56, status: "subscribed" },
  { id: "sub-10", username: "@aziz_k", displayName: "Азиз Каюмов", linkedClientId: "CL-00189", linkedClientName: "Каюмов Азиз", subscribedAt: "2026-01-05", lastActivity: "2026-05-21", messageCount: 18, status: "subscribed" },
  { id: "sub-11", username: "@feruza_r", displayName: "Феруза Рашидова", linkedClientId: null, linkedClientName: null, subscribedAt: "2026-05-01", lastActivity: "2026-05-24", messageCount: 71, status: "subscribed" },
  { id: "sub-12", username: "@sherzod_m", displayName: "Шерзод Мусаев", linkedClientId: "CL-00422", linkedClientName: "Мусаев Шерзод", subscribedAt: "2026-02-28", lastActivity: "2026-03-15", messageCount: 5, status: "blocked" },
  { id: "sub-13", username: "@lola_tashkent", displayName: "Лола Исмаилова", linkedClientId: null, linkedClientName: null, subscribedAt: "2026-03-05", lastActivity: "2026-05-23", messageCount: 29, status: "subscribed" },
  { id: "sub-14", username: "@timur_b", displayName: "Тимур Бахтияров", linkedClientId: "CL-00067", linkedClientName: "Бахтияров Тимур", subscribedAt: "2025-11-10", lastActivity: "2026-05-24", messageCount: 102, status: "subscribed" },
  { id: "sub-15", username: "@dildora_k", displayName: "Дильдора Камилова", linkedClientId: null, linkedClientName: null, subscribedAt: "2026-04-25", lastActivity: "2026-05-22", messageCount: 14, status: "subscribed" },
  { id: "sub-16", username: "@oybek_s", displayName: "Ойбек Сулейманов", linkedClientId: "CL-00290", linkedClientName: "Сулейманов Ойбек", subscribedAt: "2026-01-20", lastActivity: "2026-05-24", messageCount: 41, status: "subscribed" },
  { id: "sub-17", username: "@nozima_r", displayName: "Нозима Равшанова", linkedClientId: null, linkedClientName: null, subscribedAt: "2026-05-10", lastActivity: "2026-05-24", messageCount: 7, status: "subscribed" },
  { id: "sub-18", username: "@ulugbek_a", displayName: "Улугбек Абдуллаев", linkedClientId: "CL-00155", linkedClientName: "Абдуллаев Улугбек", subscribedAt: "2026-02-08", lastActivity: "2026-05-19", messageCount: 33, status: "subscribed" },
  { id: "sub-19", username: "@kamola_n", displayName: "Камола Набиева", linkedClientId: null, linkedClientName: null, subscribedAt: "2026-03-30", lastActivity: "2026-05-18", messageCount: 9, status: "subscribed" },
  { id: "sub-20", username: "@jasur_t", displayName: "Жасур Тошматов", linkedClientId: "CL-00378", linkedClientName: "Тошматов Жасур", subscribedAt: "2025-12-05", lastActivity: "2026-05-24", messageCount: 78, status: "subscribed" },
];

export const TELEGRAM_KPIS: TelegramKpi[] = [
  { label: "DAU", value: 1247, delta: 8.3, format: "number" },
  { label: "MAU", value: 5892, delta: 12.1, format: "number" },
  { label: "Подписчиков", value: 8423, delta: 3.7, format: "number" },
  { label: "Нажатий за день", value: 3456, delta: -2.1, format: "number" },
];

export const FUNNEL_DATA: FunnelStep[] = [
  { label: "Подписка", value: 8423, percent: 100 },
  { label: "Первый клик", value: 6210, percent: 73.7 },
  { label: "Первая заявка", value: 2840, percent: 33.7 },
  { label: "Одобрено", value: 1520, percent: 18.0 },
];

export const TOP_COMMANDS = [
  { command: "/status", count: 4520 },
  { command: "/start", count: 3890 },
  { command: "/calc", count: 2340 },
  { command: "/branches", count: 1870 },
  { command: "/help", count: 1560 },
  { command: "/feedback", count: 890 },
  { command: "/language", count: 450 },
];

export const DAU_MAU_DATA = Array.from({ length: 30 }, (_, i) => ({
  date: `${String(i + 1).padStart(2, "0")}.05`,
  dau: Math.floor(900 + Math.random() * 600),
  mau: Math.floor(5000 + Math.random() * 1500),
}));

export const RETENTION_DATA = [
  { label: "D1", value: 72.3 },
  { label: "D7", value: 54.8 },
  { label: "D14", value: 41.2 },
  { label: "D30", value: 33.6 },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-1",
    question: { ru: "Как оформить рассрочку?", uz: "Bo'lib to'lashni qanday rasmiylashtirish mumkin?" },
    answer: { ru: "Для оформления рассрочки вам необходимо: 1) Выбрать товар в магазине Texnomart, 2) Предоставить паспорт и ПИНФЛ, 3) Заполнить заявку — ответ в течение 15 минут.", uz: "Bo'lib to'lashni rasmiylashtirish uchun sizga kerak: 1) Texnomart do'konidan mahsulotni tanlash, 2) Pasport va JShShIR taqdim etish, 3) Arizani to'ldirish — javob 15 daqiqa ichida." },
    active: true,
    order: 1,
  },
  {
    id: "faq-2",
    question: { ru: "Какие документы нужны?", uz: "Qanday hujjatlar kerak?" },
    answer: { ru: "Для подачи заявки необходимы: паспорт гражданина Узбекистана и ПИНФЛ. Для сумм свыше 10 000 000 UZS может потребоваться справка о доходах.", uz: "Ariza topshirish uchun kerak: O'zbekiston fuqarosi pasporti va JShShIR. 10 000 000 UZS dan yuqori summalar uchun daromad to'g'risida ma'lumotnoma talab qilinishi mumkin." },
    active: true,
    order: 2,
  },
  {
    id: "faq-3",
    question: { ru: "Как проверить статус заявки?", uz: "Ariza holatini qanday tekshirish mumkin?" },
    answer: { ru: "Отправьте команду /status и укажите номер заявки. Бот покажет текущий статус и этап обработки.", uz: "/status buyrug'ini yuboring va ariza raqamini ko'rsating. Bot joriy holat va qayta ishlash bosqichini ko'rsatadi." },
    active: true,
    order: 3,
  },
  {
    id: "faq-4",
    question: { ru: "Какие партнёры доступны?", uz: "Qaysi hamkorlar mavjud?" },
    answer: { ru: "Мы сотрудничаем с: Alif Nasiya, Anorbank, Uzum Nasiya, Iman, Multicard, Asia Alliance. Условия зависят от партнёра и товара.", uz: "Biz hamkorlik qilamiz: Alif Nasiya, Anorbank, Uzum Nasiya, Iman, Multicard, Asia Alliance." },
    active: true,
    order: 4,
  },
  {
    id: "faq-5",
    question: { ru: "Где найти ближайший филиал?", uz: "Yaqin filialni qayerdan topish mumkin?" },
    answer: { ru: "Отправьте команду /branches — бот определит ваше местоположение и покажет ближайшие филиалы Texnomart с адресами и часами работы.", uz: "/branches buyrug'ini yuboring — bot joylashuvingizni aniqlaydi va yaqin filiallarni ko'rsatadi." },
    active: true,
    order: 5,
  },
  {
    id: "faq-6",
    question: { ru: "Можно ли досрочно погасить?", uz: "Muddatidan oldin to'lash mumkinmi?" },
    answer: { ru: "Да, досрочное погашение доступно без штрафов и комиссий. Обратитесь в ближайший филиал или свяжитесь с нашей поддержкой.", uz: "Ha, muddatidan oldin to'lash jarimalar va komissiyalarsiz mavjud." },
    active: true,
    order: 6,
  },
  {
    id: "faq-7",
    question: { ru: "Как сменить язык бота?", uz: "Bot tilini qanday o'zgartirish mumkin?" },
    answer: { ru: "Отправьте команду /language и выберите нужный язык из меню.", uz: "/language buyrug'ini yuboring va menyudan kerakli tilni tanlang." },
    active: true,
    order: 7,
  },
  {
    id: "faq-8",
    question: { ru: "Что делать если платёж просрочен?", uz: "To'lov kechiktirilsa nima qilish kerak?" },
    answer: { ru: "Свяжитесь с нашей службой поддержки по номеру +998 71 200-00-00 или посетите ближайший филиал для обсуждения условий реструктуризации.", uz: "Bizning qo'llab-quvvatlash xizmatimiz bilan +998 71 200-00-00 raqami orqali bog'laning." },
    active: false,
    order: 8,
  },
];

export const AUTO_REPLY_RULES: AutoReplyRule[] = [
  { id: "ar-1", keyword: "рассрочка|кредит|bo'lib to'lash", isRegex: true, templateId: "tpl-1", templateName: "Приветствие нового пользователя", active: true },
  { id: "ar-2", keyword: "статус|заявка|ariza", isRegex: true, templateId: "tpl-2", templateName: "Заявка принята", active: true },
  { id: "ar-3", keyword: "филиал|адрес|filial", isRegex: true, templateId: "tpl-11", templateName: "Ближайший филиал", active: true },
  { id: "ar-4", keyword: "оплата|платёж|to'lov", isRegex: true, templateId: "tpl-5", templateName: "Напоминание о платеже", active: true },
  { id: "ar-5", keyword: "привет|здравствуйте|salom", isRegex: true, templateId: "tpl-1", templateName: "Приветствие нового пользователя", active: false },
];

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "greetings", label: "Приветствия" },
  { value: "statuses", label: "Статусы заявок" },
  { value: "reminders", label: "Напоминания" },
  { value: "marketing", label: "Маркетинг" },
];

export const TEMPLATE_VARIABLES = [
  { variable: "{{name}}", description: "Имя клиента" },
  { variable: "{{branch}}", description: "Название филиала" },
  { variable: "{{application_id}}", description: "Номер заявки" },
  { variable: "{{amount}}", description: "Сумма" },
  { variable: "{{term}}", description: "Срок (месяцы)" },
  { variable: "{{partner}}", description: "Название партнёра" },
  { variable: "{{contract_id}}", description: "Номер договора" },
  { variable: "{{date}}", description: "Дата" },
  { variable: "{{days}}", description: "Количество дней" },
  { variable: "{{reason}}", description: "Причина" },
  { variable: "{{category}}", description: "Категория товара" },
  { variable: "{{link}}", description: "Ссылка" },
  { variable: "{{phone}}", description: "Номер телефона" },
  { variable: "{{hours}}", description: "Часы работы" },
  { variable: "{{address}}", description: "Адрес" },
  { variable: "{{branch_name}}", description: "Название филиала" },
];
