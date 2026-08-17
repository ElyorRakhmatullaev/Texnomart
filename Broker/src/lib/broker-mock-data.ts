export interface BrokerClient {
  name: string
  phone: string
  pinfl: string
  cardMask: string
}
export const BROKER_CLIENT: BrokerClient = {
  name: "Артем Борисов",
  phone: "+998 94 983 98 48",
  pinfl: "2116358415458",
  cardMask: "4860 **** **** 1251",
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
    tenors: [2, 3, 6, 9, 12, 18, 24, 36],
    defaultTenor: 6,
    limit: 8_546_000,
    prepayment: 0,
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

export const ORDER = { amount: 10_000_000, tenor: 6 }
export const ALIF_LIMIT_DELAY_MS = 6000 // мок callback+polling из MD
export const OTP_RESEND_SECONDS = 60
export const OTP_FAIL_CODE = "000000" // демо неверного кода
export const ONE_C_ORDER_NO = "235662235" // как в Figma

export const RELATION_KINDS = ["Брат", "Сестра", "Отец", "Мать", "Супруг(а)", "Коллега", "Другое"]

export function makeContractNo(): string {
  // ALF-2026-XXXXXX — псевдослучайный, стабильный в рамках сессии не требуется
  return `ALF-2026-${String(Math.floor(100000 + Math.random() * 900000))}`
}
