export interface OrganizationSettings {
  name: string;
  legalName: string;
  inn: string;
  email: string;
  phone: string;
  address: string;
  logoUrl: string | null;
}

export interface RegionalSettings {
  timezone: string;
  dateFormat: string;
  timeFormat: "24h" | "12h";
  currency: string;
  firstDayOfWeek: "monday" | "sunday";
}

export interface LanguageEntry {
  code: string;
  name: string;
  enabled: boolean;
  isDefault: boolean;
}

export interface TranslationRow {
  key: string;
  ru: string;
  uzCyr: string;
  uzLat: string;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: "1c" | "sms" | "email" | "telegram" | "ga" | "yandex" | "sentry";
  enabled: boolean;
  lastSync?: string;
  config: Record<string, string>;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigits: boolean;
  requireSpecial: boolean;
  expirationDays: number;
  historyCount: number;
}

export interface SessionPolicy {
  timeoutMinutes: number;
  singleSession: boolean;
  notifyNewDevice: boolean;
}

export interface AccessPolicy {
  ipWhitelist: string;
  forced2faRoles: string[];
  bruteForceEnabled: boolean;
  bruteForceMaxAttempts: number;
  bruteForceLockMinutes: number;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  createdAt: string;
  lastUsed: string | null;
  status: "active" | "revoked";
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  retryPolicy: string;
  status: "active" | "inactive";
  lastDelivery: string | null;
  deliveryHistory: WebhookDelivery[];
}

export interface WebhookDelivery {
  id: string;
  timestamp: string;
  event: string;
  responseCode: number;
  retries: number;
  payload: string;
}

export interface BackupEntry {
  id: string;
  date: string;
  size: string;
  type: "auto" | "manual";
  status: "success" | "in_progress" | "error";
}

export interface BackupSchedule {
  frequency: "daily" | "weekly" | "monthly";
  time: string;
  retentionDays: number;
  storage: "s3" | "local" | "yandex";
}

export const TIMEZONES = [
  { value: "Asia/Tashkent", label: "Asia/Tashkent (UTC+5)" },
  { value: "Asia/Samarkand", label: "Asia/Samarkand (UTC+5)" },
  { value: "Europe/Moscow", label: "Europe/Moscow (UTC+3)" },
  { value: "Asia/Almaty", label: "Asia/Almaty (UTC+6)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (UTC+4)" },
];

export const DATE_FORMATS = [
  { value: "DD.MM.YYYY", label: "DD.MM.YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
];

export const CURRENCIES = [
  { value: "UZS", label: "UZS — Узбекский сум" },
  { value: "USD", label: "USD — Доллар США" },
  { value: "RUB", label: "RUB — Российский рубль" },
];

export const API_SCOPES = [
  "applications:read",
  "applications:write",
  "clients:read",
  "clients:write",
  "partners:read",
  "partners:write",
  "branches:read",
  "branches:write",
  "users:read",
  "users:write",
  "analytics:read",
  "settings:read",
  "settings:write",
];

export const WEBHOOK_EVENTS = [
  "application.created",
  "application.updated",
  "application.approved",
  "application.rejected",
  "client.created",
  "client.updated",
  "partner.status_changed",
  "user.login",
  "user.created",
  "backup.completed",
];

export const SMS_PROVIDERS = [
  { value: "eskiz", label: "Eskiz" },
  { value: "playmobile", label: "Playmobile" },
];

export const BACKUP_FREQUENCIES = [
  { value: "daily", label: "Ежедневно" },
  { value: "weekly", label: "Еженедельно" },
  { value: "monthly", label: "Ежемесячно" },
];

export const BACKUP_STORAGES = [
  { value: "s3", label: "Amazon S3" },
  { value: "local", label: "Локальное хранилище" },
  { value: "yandex", label: "Yandex Object Storage" },
];

export const mockOrganization: OrganizationSettings = {
  name: "Texnomart",
  legalName: 'ООО "TEXNOMART SAVDO"',
  inn: "305 123 456",
  email: "admin@texnomart.uz",
  phone: "+998 71 200-00-00",
  address: "г. Ташкент, ул. Амира Темура, 42",
  logoUrl: null,
};

export const mockRegional: RegionalSettings = {
  timezone: "Asia/Tashkent",
  dateFormat: "DD.MM.YYYY",
  timeFormat: "24h",
  currency: "UZS",
  firstDayOfWeek: "monday",
};

export const mockLanguages: LanguageEntry[] = [
  { code: "ru", name: "Русский", enabled: true, isDefault: true },
  { code: "uz-cyr", name: "Ўзбек (Кириллица)", enabled: true, isDefault: false },
  { code: "uz-lat", name: "O'zbek (Lotin)", enabled: false, isDefault: false },
];

export const mockTranslations: TranslationRow[] = [
  { key: "app.title", ru: "Texnomart Dashboard", uzCyr: "Texnomart Панели", uzLat: "Texnomart Dashboard" },
  { key: "nav.dashboard", ru: "Дашборд", uzCyr: "Бошқарув панели", uzLat: "Boshqaruv paneli" },
  { key: "nav.applications", ru: "Заявки", uzCyr: "Аризалар", uzLat: "Arizalar" },
  { key: "nav.clients", ru: "Клиенты", uzCyr: "Мижозлар", uzLat: "Mijozlar" },
  { key: "nav.partners", ru: "Партнёры", uzCyr: "Ҳамкорлар", uzLat: "Hamkorlar" },
  { key: "nav.branches", ru: "Филиалы", uzCyr: "Филиаллар", uzLat: "Filiallar" },
  { key: "nav.users", ru: "Пользователи", uzCyr: "Фойдаланувчилар", uzLat: "Foydalanuvchilar" },
  { key: "nav.analytics", ru: "Аналитика", uzCyr: "Таҳлил", uzLat: "Tahlil" },
  { key: "nav.settings", ru: "Настройки", uzCyr: "Созламалар", uzLat: "Sozlamalar" },
  { key: "common.save", ru: "Сохранить", uzCyr: "Сақлаш", uzLat: "Saqlash" },
  { key: "common.cancel", ru: "Отменить", uzCyr: "Бекор қилиш", uzLat: "Bekor qilish" },
  { key: "common.delete", ru: "Удалить", uzCyr: "Ўчириш", uzLat: "O'chirish" },
  { key: "common.search", ru: "Поиск", uzCyr: "Қидириш", uzLat: "Qidirish" },
  { key: "common.export", ru: "Экспорт", uzCyr: "Экспорт", uzLat: "Eksport" },
  { key: "common.loading", ru: "Загрузка...", uzCyr: "Юкланмоқда...", uzLat: "Yuklanmoqda..." },
  { key: "auth.login", ru: "Войти", uzCyr: "Кириш", uzLat: "Kirish" },
  { key: "auth.logout", ru: "Выйти", uzCyr: "Чиқиш", uzLat: "Chiqish" },
  { key: "auth.password", ru: "Пароль", uzCyr: "Парол", uzLat: "Parol" },
  { key: "status.active", ru: "Активный", uzCyr: "Фаол", uzLat: "Faol" },
  { key: "status.inactive", ru: "Неактивный", uzCyr: "Фаол эмас", uzLat: "Faol emas" },
];

export const mockIntegrations: IntegrationConfig[] = [
  {
    id: "int-1c",
    name: "1С",
    type: "1c",
    enabled: true,
    lastSync: "2026-05-24T14:30:00",
    config: {
      url: "https://1c.texnomart.uz/api/v2",
      apiKey: "sk_1c_••••••••••••••••",
      syncFrequency: "30",
    },
  },
  {
    id: "int-sms",
    name: "SMS-провайдер",
    type: "sms",
    enabled: true,
    config: {
      provider: "eskiz",
      apiKey: "sk_sms_••••••••••••••••",
      senderId: "Texnomart",
    },
  },
  {
    id: "int-email",
    name: "Email (SMTP)",
    type: "email",
    enabled: true,
    config: {
      host: "smtp.texnomart.uz",
      port: "587",
      username: "noreply@texnomart.uz",
      password: "••••••••",
      from: "noreply@texnomart.uz",
      tls: "true",
    },
  },
  {
    id: "int-telegram",
    name: "Telegram",
    type: "telegram",
    enabled: true,
    config: {
      token: "bot••••••••••:•••••••••••••••",
      webhook: "https://api.texnomart.uz/webhook/telegram",
    },
  },
  {
    id: "int-ga",
    name: "Google Analytics",
    type: "ga",
    enabled: false,
    config: {
      measurementId: "",
    },
  },
  {
    id: "int-yandex",
    name: "Yandex Metrika",
    type: "yandex",
    enabled: false,
    config: {
      counterId: "",
    },
  },
  {
    id: "int-sentry",
    name: "Sentry",
    type: "sentry",
    enabled: true,
    config: {
      dsn: "https://abc123@sentry.texnomart.uz/4",
      environment: "production",
      tracesSampleRate: "0.2",
    },
  },
];

export const mockPasswordPolicy: PasswordPolicy = {
  minLength: 10,
  requireUppercase: true,
  requireLowercase: true,
  requireDigits: true,
  requireSpecial: false,
  expirationDays: 90,
  historyCount: 5,
};

export const mockSessionPolicy: SessionPolicy = {
  timeoutMinutes: 30,
  singleSession: false,
  notifyNewDevice: true,
};

export const mockAccessPolicy: AccessPolicy = {
  ipWhitelist: "10.0.0.0/8\n172.16.0.0/12\n192.168.1.0/24",
  forced2faRoles: ["Superadmin", "Admin"],
  bruteForceEnabled: true,
  bruteForceMaxAttempts: 5,
  bruteForceLockMinutes: 15,
};

export const mockApiKeys: ApiKey[] = [
  {
    id: "key-1",
    name: "Production API",
    key: "txm_prod_sk_••••••••••••••••••••",
    scopes: ["applications:read", "applications:write", "clients:read", "partners:read"],
    createdAt: "2026-01-15",
    lastUsed: "2026-05-24T09:45:00",
    status: "active",
  },
  {
    id: "key-2",
    name: "Analytics Export",
    key: "txm_anl_sk_••••••••••••••••••••",
    scopes: ["analytics:read", "applications:read", "clients:read"],
    createdAt: "2026-03-01",
    lastUsed: "2026-05-23T18:20:00",
    status: "active",
  },
  {
    id: "key-3",
    name: "Mobile App (Legacy)",
    key: "txm_mob_sk_••••••••••••••••••••",
    scopes: ["applications:read", "clients:read"],
    createdAt: "2025-11-10",
    lastUsed: "2026-04-01T12:00:00",
    status: "revoked",
  },
  {
    id: "key-4",
    name: "Partner Integration",
    key: "txm_prt_sk_••••••••••••••••••••",
    scopes: ["partners:read", "partners:write", "applications:read"],
    createdAt: "2026-04-20",
    lastUsed: null,
    status: "active",
  },
];

export const mockWebhooks: Webhook[] = [
  {
    id: "wh-1",
    name: "CRM Sync",
    url: "https://crm.texnomart.uz/webhook/applications",
    events: ["application.created", "application.updated", "application.approved"],
    secret: "whsec_••••••••••••••••",
    retryPolicy: "3 попытки, 30с интервал",
    status: "active",
    lastDelivery: "2026-05-24T14:28:00",
    deliveryHistory: [
      { id: "del-1", timestamp: "2026-05-24T14:28:00", event: "application.updated", responseCode: 200, retries: 0, payload: '{"id": "APP-01234", "status": "approved"}' },
      { id: "del-2", timestamp: "2026-05-24T14:15:00", event: "application.created", responseCode: 200, retries: 0, payload: '{"id": "APP-01235", "client": "CL-00428"}' },
      { id: "del-3", timestamp: "2026-05-24T13:50:00", event: "application.approved", responseCode: 502, retries: 2, payload: '{"id": "APP-01230", "status": "approved"}' },
      { id: "del-4", timestamp: "2026-05-24T12:10:00", event: "application.updated", responseCode: 200, retries: 0, payload: '{"id": "APP-01228", "status": "scoring"}' },
      { id: "del-5", timestamp: "2026-05-24T11:45:00", event: "application.created", responseCode: 200, retries: 0, payload: '{"id": "APP-01227", "client": "CL-00415"}' },
    ],
  },
  {
    id: "wh-2",
    name: "Analytics Pipeline",
    url: "https://analytics.texnomart.uz/ingest",
    events: ["application.created", "application.approved", "application.rejected", "client.created"],
    secret: "whsec_••••••••••••••••",
    retryPolicy: "5 попыток, 60с интервал",
    status: "active",
    lastDelivery: "2026-05-24T14:25:00",
    deliveryHistory: [
      { id: "del-6", timestamp: "2026-05-24T14:25:00", event: "client.created", responseCode: 200, retries: 0, payload: '{"id": "CL-00450", "name": "Рахимов А."}' },
      { id: "del-7", timestamp: "2026-05-24T13:00:00", event: "application.approved", responseCode: 200, retries: 0, payload: '{"id": "APP-01229", "amount": 15000000}' },
    ],
  },
  {
    id: "wh-3",
    name: "Notification Service",
    url: "https://notify.texnomart.uz/events",
    events: ["partner.status_changed", "user.login", "backup.completed"],
    secret: "whsec_••••••••••••••••",
    retryPolicy: "3 попытки, 30с интервал",
    status: "inactive",
    lastDelivery: "2026-05-20T10:00:00",
    deliveryHistory: [],
  },
];

export const mockBackupSchedule: BackupSchedule = {
  frequency: "daily",
  time: "03:00",
  retentionDays: 30,
  storage: "s3",
};

export const mockBackups: BackupEntry[] = [
  { id: "bkp-001", date: "2026-05-24T03:00:00", size: "2.4 ГБ", type: "auto", status: "success" },
  { id: "bkp-002", date: "2026-05-23T03:00:00", size: "2.3 ГБ", type: "auto", status: "success" },
  { id: "bkp-003", date: "2026-05-22T15:30:00", size: "2.3 ГБ", type: "manual", status: "success" },
  { id: "bkp-004", date: "2026-05-22T03:00:00", size: "2.3 ГБ", type: "auto", status: "success" },
  { id: "bkp-005", date: "2026-05-21T03:00:00", size: "2.2 ГБ", type: "auto", status: "success" },
  { id: "bkp-006", date: "2026-05-20T03:00:00", size: "2.2 ГБ", type: "auto", status: "error" },
  { id: "bkp-007", date: "2026-05-19T03:00:00", size: "2.1 ГБ", type: "auto", status: "success" },
  { id: "bkp-008", date: "2026-05-18T03:00:00", size: "2.1 ГБ", type: "auto", status: "success" },
];
