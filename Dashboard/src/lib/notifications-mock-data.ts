export type NotificationType = "applications" | "partners" | "security" | "system" | "anomalies";
export type NotificationSeverity = "critical" | "warning" | "info" | "normal";

export interface AppNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
  sourceHref?: string;
}

export const NOTIFICATION_TYPES: Record<NotificationType, { label: string; color: string }> = {
  applications: { label: "Заявки", color: "bg-blue-100 text-blue-700" },
  partners: { label: "Партнёры", color: "bg-purple-100 text-purple-700" },
  security: { label: "Безопасность", color: "bg-red-100 text-red-700" },
  system: { label: "Система", color: "bg-gray-100 text-gray-700" },
  anomalies: { label: "Аномалии", color: "bg-orange-100 text-orange-700" },
};

export const NOTIFICATION_SEVERITIES: Record<NotificationSeverity, { label: string; bg: string; icon: string; text: string }> = {
  critical: { label: "Критично", bg: "bg-red-100", icon: "text-red-600", text: "text-red-600" },
  warning: { label: "Внимание", bg: "bg-amber-100", icon: "text-amber-600", text: "text-amber-600" },
  info: { label: "Информация", bg: "bg-blue-100", icon: "text-blue-600", text: "text-blue-600" },
  normal: { label: "Норма", bg: "bg-green-100", icon: "text-green-600", text: "text-green-600" },
};

const now = new Date();
function hoursAgo(h: number): Date {
  return new Date(now.getTime() - h * 60 * 60 * 1000);
}
function daysAgo(d: number, h = 10): Date {
  const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  date.setHours(h, Math.floor(Math.random() * 60), 0, 0);
  return date;
}

export const mockNotifications: AppNotification[] = [
  // Сегодня
  {
    id: "NTF-001",
    type: "applications",
    severity: "normal",
    title: "Заявка BR-12487 одобрена",
    body: "Партнёр Alif Nasiya одобрил заявку на сумму 8 500 000 UZS. Ожидает подписание договора.",
    timestamp: hoursAgo(0.1),
    read: false,
    actionLabel: "Открыть заявку",
    actionHref: "/applications/BR-12487",
    sourceHref: "/applications/BR-12487",
  },
  {
    id: "NTF-002",
    type: "security",
    severity: "critical",
    title: "Подозрительная активность: 5 неудачных входов",
    body: "Пользователь operator@texnomart.uz — 5 неудачных попыток входа за 3 минуты с IP 192.168.1.45.",
    timestamp: hoursAgo(0.3),
    read: false,
    actionLabel: "Проверить",
    actionHref: "/users/USR-005",
    sourceHref: "/audit",
  },
  {
    id: "NTF-003",
    type: "partners",
    severity: "warning",
    title: "Партнёр Anorbank — API недоступен",
    body: "Последние 3 запроса вернули таймаут (>30с). Автоматическая отправка заявок приостановлена.",
    timestamp: hoursAgo(0.8),
    read: false,
    actionLabel: "Проверить подключение",
    actionHref: "/partners/PTR-002",
    sourceHref: "/partners/PTR-002",
  },
  {
    id: "NTF-004",
    type: "anomalies",
    severity: "warning",
    title: "Аномальный рост отказов: +340% за час",
    body: "Процент отклонений за последний час — 67% (обычно ~22%). Затронуты филиалы: Ташкент-Центр, Самарканд.",
    timestamp: hoursAgo(1.2),
    read: false,
    sourceHref: "/analytics",
  },
  {
    id: "NTF-005",
    type: "applications",
    severity: "normal",
    title: "Новая заявка BR-12486",
    body: "Клиент Каримов А.С. подал заявку на 12 000 000 UZS, 12 месяцев. Филиал: Ташкент-Центр.",
    timestamp: hoursAgo(1.5),
    read: false,
    actionLabel: "Открыть заявку",
    actionHref: "/applications/BR-12486",
    sourceHref: "/applications/BR-12486",
  },
  {
    id: "NTF-006",
    type: "system",
    severity: "info",
    title: "Синхронизация с 1С завершена",
    body: "Обновлено 47 записей, 2 конфликта разрешены автоматически. Время: 12.4 сек.",
    timestamp: hoursAgo(2),
    read: false,
    sourceHref: "/settings",
  },
  {
    id: "NTF-007",
    type: "applications",
    severity: "warning",
    title: "Заявка BR-12480 — истёк срок ожидания документов",
    body: "Клиент не загрузил документы в течение 48 часов. Заявка переведена в статус «Просрочена».",
    timestamp: hoursAgo(3),
    read: true,
    sourceHref: "/applications/BR-12480",
  },
  {
    id: "NTF-008",
    type: "partners",
    severity: "normal",
    title: "Uzum Nasiya — конверсия выросла до 78%",
    body: "За последние 24 часа конверсия одобрений у Uzum Nasiya достигла рекордных 78% (обычно ~62%).",
    timestamp: hoursAgo(4),
    read: true,
    sourceHref: "/partners/PTR-003",
  },
  {
    id: "NTF-009",
    type: "security",
    severity: "info",
    title: "Новый вход: admin@texnomart.uz",
    body: "Успешный вход с нового устройства: Chrome 125, Windows 10, IP 10.0.0.12 (Ташкент).",
    timestamp: hoursAgo(5),
    read: true,
    sourceHref: "/audit",
  },

  // Вчера
  {
    id: "NTF-010",
    type: "applications",
    severity: "normal",
    title: "Заявка BR-12475 — договор подписан",
    body: "Клиент Рахматуллаев Б.Ш. подписал договор. Средства будут перечислены в течение 1 рабочего дня.",
    timestamp: daysAgo(1, 17),
    read: true,
    sourceHref: "/applications/BR-12475",
  },
  {
    id: "NTF-011",
    type: "anomalies",
    severity: "critical",
    title: "Массовый сбой скоринга",
    body: "Скоринговый сервис Alif Nasiya вернул ошибку 503 для 23 заявок подряд. Затронутые заявки поставлены в очередь.",
    timestamp: daysAgo(1, 15),
    read: true,
    actionLabel: "Подробнее",
    actionHref: "/analytics",
    sourceHref: "/analytics",
  },
  {
    id: "NTF-012",
    type: "system",
    severity: "normal",
    title: "Резервная копия создана",
    body: "Ежедневное резервное копирование базы данных успешно завершено. Размер: 2.3 ГБ.",
    timestamp: daysAgo(1, 3),
    read: true,
    sourceHref: "/settings",
  },
  {
    id: "NTF-013",
    type: "partners",
    severity: "info",
    title: "Multicard — обновлены условия кредитования",
    body: "Партнёр обновил максимальную сумму кредита: 25 000 000 → 30 000 000 UZS.",
    timestamp: daysAgo(1, 11),
    read: true,
    sourceHref: "/partners/PTR-005",
  },
  {
    id: "NTF-014",
    type: "applications",
    severity: "normal",
    title: "Заявка BR-12472 отклонена",
    body: "Причина: недостаточный скоринг. Партнёр: Iman. Клиент уведомлён через Telegram.",
    timestamp: daysAgo(1, 9),
    read: true,
    sourceHref: "/applications/BR-12472",
  },
  {
    id: "NTF-015",
    type: "security",
    severity: "warning",
    title: "Пользователь USR-008 деактивирован автоматически",
    body: "Не было активности в системе более 90 дней. Учётная запись автоматически деактивирована.",
    timestamp: daysAgo(1, 8),
    read: true,
    sourceHref: "/users/USR-008",
  },

  // 2 дня назад
  {
    id: "NTF-016",
    type: "system",
    severity: "info",
    title: "Обновление системы v2.4.1",
    body: "Установлено обновление: улучшена производительность таблиц, исправлен расчёт конверсии.",
    timestamp: daysAgo(2, 22),
    read: true,
    sourceHref: "/settings",
  },
  {
    id: "NTF-017",
    type: "applications",
    severity: "normal",
    title: "5 заявок ожидают проверки документов",
    body: "BR-12468, BR-12465, BR-12463, BR-12460, BR-12458 — загруженные документы не проверены.",
    timestamp: daysAgo(2, 14),
    read: true,
    actionLabel: "Открыть список",
    actionHref: "/applications",
    sourceHref: "/applications",
  },
  {
    id: "NTF-018",
    type: "anomalies",
    severity: "info",
    title: "Необычное время активности",
    body: "Оператор Исмаилов А.Р. работает в системе после 23:00 третий день подряд.",
    timestamp: daysAgo(2, 12),
    read: true,
    sourceHref: "/users/USR-007",
  },
  {
    id: "NTF-019",
    type: "partners",
    severity: "normal",
    title: "Asia Alliance — подключение восстановлено",
    body: "API-соединение с Asia Alliance Bank восстановлено после 45 минут простоя.",
    timestamp: daysAgo(2, 10),
    read: true,
    sourceHref: "/partners/PTR-006",
  },
  {
    id: "NTF-020",
    type: "security",
    severity: "critical",
    title: "Попытка доступа к чужим данным",
    body: "Оператор USR-009 попытался открыть карточку клиента, не привязанного к его филиалу. Доступ заблокирован.",
    timestamp: daysAgo(2, 9),
    read: true,
    sourceHref: "/audit",
  },

  // 3 дня назад
  {
    id: "NTF-021",
    type: "applications",
    severity: "normal",
    title: "Заявка BR-12455 — частичное одобрение",
    body: "Alif Nasiya одобрил 6 000 000 UZS из запрошенных 10 000 000 UZS. Ожидается решение клиента.",
    timestamp: daysAgo(3, 16),
    read: true,
    sourceHref: "/applications/BR-12455",
  },
  {
    id: "NTF-022",
    type: "system",
    severity: "warning",
    title: "Место на диске заканчивается",
    body: "Свободно 8.2 ГБ из 100 ГБ (8%). Рекомендуется очистить старые логи или расширить хранилище.",
    timestamp: daysAgo(3, 14),
    read: true,
    sourceHref: "/settings",
  },
  {
    id: "NTF-023",
    type: "partners",
    severity: "info",
    title: "Iman — новый тарифный план активирован",
    body: "С 01.06 действует новый тарифный план: комиссия снижена с 2.5% до 2.0%.",
    timestamp: daysAgo(3, 11),
    read: true,
    sourceHref: "/partners/PTR-004",
  },

  // 4 дня назад
  {
    id: "NTF-024",
    type: "anomalies",
    severity: "warning",
    title: "Резкое снижение заявок из Ферганы",
    body: "Количество заявок из Ферганского филиала снизилось на 60% по сравнению с прошлой неделей.",
    timestamp: daysAgo(4, 15),
    read: true,
    sourceHref: "/branches/BRN-006",
  },
  {
    id: "NTF-025",
    type: "applications",
    severity: "normal",
    title: "Массовый экспорт: 500 заявок",
    body: "Администратор Иванов С.К. экспортировал 500 заявок в формате XLSX.",
    timestamp: daysAgo(4, 13),
    read: true,
    sourceHref: "/audit",
  },

  // 5 дней назад
  {
    id: "NTF-026",
    type: "security",
    severity: "info",
    title: "Плановая смена паролей",
    body: "3 пользователям отправлено напоминание о необходимости сменить пароль (90-дневная политика).",
    timestamp: daysAgo(5, 10),
    read: true,
    sourceHref: "/users",
  },
  {
    id: "NTF-027",
    type: "system",
    severity: "normal",
    title: "Telegram-бот: 50 новых подписчиков",
    body: "За неделю количество подписчиков Telegram-бота выросло с 1 240 до 1 290 (+4%).",
    timestamp: daysAgo(5, 9),
    read: true,
    sourceHref: "/telegram",
  },
  {
    id: "NTF-028",
    type: "partners",
    severity: "warning",
    title: "Anorbank — сертификат SSL истекает через 7 дней",
    body: "SSL-сертификат для API Anorbank истекает 31.05.2026. Необходимо обновить.",
    timestamp: daysAgo(5, 8),
    read: true,
    sourceHref: "/partners/PTR-002",
  },
  {
    id: "NTF-029",
    type: "anomalies",
    severity: "info",
    title: "Повышенная нагрузка на API",
    body: "Среднее время ответа API за последний час — 850 мс (норма — 200 мс). Возможно влияние DDoS.",
    timestamp: daysAgo(6, 20),
    read: true,
    sourceHref: "/analytics",
  },
  {
    id: "NTF-030",
    type: "applications",
    severity: "normal",
    title: "Еженедельная сводка: 312 заявок",
    body: "За неделю обработано 312 заявок. Одобрено: 198 (63.5%). Средняя сумма: 7 200 000 UZS.",
    timestamp: daysAgo(7, 9),
    read: true,
    sourceHref: "/analytics",
  },
];

export type NotificationChannelType = "Новая заявка" | "Изменение статуса" | "Партнёр недоступен" | "Аномалия" | "Системные" | "Безопасность";
export type NotificationChannel = "system" | "email" | "sms" | "push" | "telegram";

export interface ChannelMatrixRow {
  type: NotificationChannelType;
  channels: Record<NotificationChannel, boolean>;
}

export const defaultChannelMatrix: ChannelMatrixRow[] = [
  { type: "Новая заявка", channels: { system: true, email: false, sms: false, push: true, telegram: true } },
  { type: "Изменение статуса", channels: { system: true, email: true, sms: false, push: true, telegram: true } },
  { type: "Партнёр недоступен", channels: { system: true, email: true, sms: true, push: true, telegram: false } },
  { type: "Аномалия", channels: { system: true, email: true, sms: false, push: true, telegram: false } },
  { type: "Системные", channels: { system: true, email: false, sms: false, push: false, telegram: false } },
  { type: "Безопасность", channels: { system: true, email: true, sms: true, push: true, telegram: true } },
];

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  system: "В системе",
  email: "Email",
  sms: "SMS",
  push: "Push",
  telegram: "Telegram",
};
