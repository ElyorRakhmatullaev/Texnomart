import type { AlifLimitSeed } from "./alif-application"

export interface BrokerClient {
  name: string
  phone: string
  pinfl: string
  cardMask: string
  passport: string
}
export const BROKER_CLIENT: BrokerClient = {
  name: "Артем Борисов",
  phone: "+998 94 983 98 48",
  pinfl: "2116358415458",
  cardMask: "9860 **** **** 1296",
  passport: "AD 1276543",
}

export interface Bank {
  id: "alif" | "iman"
  title: string
  brandColor: string // фон логотипа-заглушки
  initial: string // буква в логотипе
  tenors: number[] // мес.
  defaultTenor: number
  limit: number // сум
  prepayment: number
  instantLimit: boolean // false = лимит приходит «через callback»
}
export const BANKS: Bank[] = [
  {
    id: "alif",
    title: "Alif Nasiya",
    brandColor: "#16A34A",
    initial: "A",
    tenors: [3, 6, 12, 18, 24],
    defaultTenor: 6,
    limit: 8_546_000,
    prepayment: 1_000_000,
    instantLimit: false,
  },
  {
    id: "iman",
    title: "Iman Invest",
    brandColor: "#0D9488",
    initial: "I",
    tenors: [6, 12, 24],
    defaultTenor: 6,
    limit: 6_120_000,
    prepayment: 0,
    instantLimit: true,
  },
]

export const ALIF_PREPAYMENT = BANKS.find((b) => b.id === "alif")!.prepayment

export const ORDER = { amount: 10_000_000, tenor: 6 }
export const ALIF_LIMIT_DELAY_MS = 6000 // мок callback+polling из MD
export const OTP_RESEND_SECONDS = 60
export const OTP_FAIL_CODE = "000000" // демо неверного кода
// Срок жизни кода: по истечении ввод блокируется, нужен новый код. Больше
// OTP_RESEND_SECONDS — перезапросить код можно до того, как старый истечёт.
export const OTP_TTL_SECONDS = 120
// Число попыток ввода до блокировки кода; сбрасывается повторной отправкой.
export const OTP_MAX_ATTEMPTS = 3
export const ONE_C_ORDER_NO = "235662235" // как в Figma

export const RELATION_KINDS = [
  "Супруг(а)",
  "Отец",
  "Мать",
  "Брат",
  "Сестра",
  "Сын",
  "Дочь",
  "Коллега",
  "Друг",
  "Другое",
]

export interface SeedCard {
  mask: string
  expiry: string
}
export const SEED_CARD: SeedCard = { mask: "9860 3569 7266 1296", expiry: "11/29" }
export const CARD_NOT_FOUND_SUFFIX = "0000"
export const CARD_BLOCKED_SUFFIX = "9999"
export const PREPAYMENT_HOLD_DELAY_MS = 2000
export const MYID_CHECK_DELAY_MS = 2500

// Демо-сценарии шага «Проверка MyID». Реальных отказов в моке взяться неоткуда
// (камера всегда отдаёт корректный JPEG, мок-проверка всегда успешна), поэтому
// оператор выбирает исход руками — иначе экраны ошибок недостижимы на демо.
// Ср. детерминированные триггеры в других шагах: суффиксы карты 0000/9999 и
// OTP_FAIL_CODE.
export type MyIdDemoScenario = "ok" | "bad-photo" | "reject"
export const MYID_DEMO_SCENARIOS: { id: MyIdDemoScenario; label: string }[] = [
  { id: "ok", label: "Успех" },
  { id: "bad-photo", label: "Некорректное фото" },
  { id: "reject", label: "Отказ MyID" },
]
// Причина, по которой фото не принято локально (до отправки в MyID).
export const PHOTO_INVALID_REASON = "Лицо распознано не полностью. Снимите анфас, лицо целиком в овале"
// Причина отказа самого сервиса MyID — приходит уже после отправки фото.
export const MYID_REJECT_REASON = "Фото не совпало с эталоном в базе MyID"

// Лимиты по срокам — в API это массив limits ({amount, duration}) из ответа
// скоринга. Промо-метка на одном плане, чтобы состояние «промо» было видно.
export const ALIF_LIMITS: AlifLimitSeed[] = [
  { duration: 3, amount: 8_546_000 },
  { duration: 6, amount: 8_546_000, promo: "Без переплаты первые 2 мес." },
  { duration: 12, amount: 7_200_000 },
  { duration: 18, amount: 6_400_000 },
  { duration: 24, amount: 5_800_000 },
]

// Причины отказа скоринга (reject_reasons) — понятным текстом.
export const ALIF_REJECT_REASONS = [
  "Есть просроченная задолженность в другом банке",
  "Недостаточная кредитная история для запрошенной суммы",
]

export interface OrderItem {
  goodName: string
  goodTypeName: string
  price: number
  ikpu: string
  sku: string
  /** Требуется ли IMEI/маркировка для этого товара. */
  needsMarking: boolean
}

// Товар «подтягивается из каталога/1С» — в моке это один зашитый товар заказа.
export const ORDER_ITEM: OrderItem = {
  goodName: "Смартфон Samsung Galaxy S24 Ultra 512GB Titanium Gray",
  goodTypeName: "Смартфоны",
  price: 10_000_000,
  ikpu: "08517120001000000",
  sku: "TM-1042993",
  needsMarking: true,
}

export interface ActivityArea {
  id: string
  label: string
}

export const ACTIVITY_AREAS: ActivityArea[] = [
  { id: "trade", label: "Торговля" },
  { id: "services", label: "Услуги" },
  { id: "manufacturing", label: "Производство" },
  { id: "education", label: "Образование" },
  { id: "medicine", label: "Медицина" },
  { id: "it", label: "IT и связь" },
  { id: "construction", label: "Строительство" },
  { id: "transport", label: "Транспорт" },
  { id: "government", label: "Госслужба" },
  { id: "other", label: "Другое" },
]

// Мок «заявка ушла на рассмотрение и вернулась одобренной» — тот же приём,
// что MYID_CHECK_DELAY_MS на шаге проверки личности.
export const APPLICATION_REVIEW_DELAY_MS = 2500
// Мок ожидания ответа request-attach при отправке кода.
export const CARD_ATTACH_DELAY_MS = 1200
export const HOLD_TILL_DAYS = 7
export const FIRST_PAYMENT_MAX_DAYS = 45
export const FIRST_PAYMENT_DEFAULT_DAYS = 30

// Маска телефона для демо-случая phone_match: false — телефон карты не
// совпадает с телефоном клиента, поэтому берётся не из BROKER_CLIENT.
export const ALIF_UNMATCHED_PHONE_MASK = "********2440"

// "9860 3569 7266 1296" → "986035******1296" — формат Alif (6 первых цифр,
// шесть звёзд, 4 последних). Отличается от maskCardNumber, который остаётся
// форматом карты списания на экране холда.
export function maskPanAlif(mask: string): string {
  const digits = mask.replace(/\D/g, "")
  if (digits.length < 10) return mask
  return `${digits.slice(0, 6)}******${digits.slice(-4)}`
}

// "+998 94 983 98 48" → "********9848"
export function maskPhoneTail(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return `********${digits.slice(-4)}`
}

// "9860 3569 7266 1296" → "9860 •••• 1296" (первые/последние 4 цифры).
// Общий формат для всех мест, где показывается карта списания.
export function maskCardNumber(mask: string): string {
  const digits = mask.replace(/\D/g, "")
  if (digits.length < 8) return mask
  return `${digits.slice(0, 4)} •••• ${digits.slice(-4)}`
}

export function makeContractNo(): string {
  // ALF-2026-XXXXXX — псевдослучайный, стабильный в рамках сессии не требуется
  return `ALF-2026-${String(Math.floor(100000 + Math.random() * 900000))}`
}
