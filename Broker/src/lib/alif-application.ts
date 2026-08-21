// Чистая логика заявки Alif: статусы, правила доступности действий, деньги,
// планы, тексты ошибок. Без React и без импортов из приложения — этот модуль
// читают и фазы попапа, и карточка банка, поэтому он не должен ничего знать
// про UI.

export type ApplicationStatus =
  | "NEW"
  | "REVIEWING"
  | "APPROVED"
  | "REJECTED"
  | "SOLD"
  | "CANCELLED"
  | "ACTIVE"

export interface StatusMeta {
  label: string
  /** Классы фона и текста бейджа — цвета по таблице §5 ТЗ. */
  className: string
}

export const APPLICATION_STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  NEW: { label: "Новая", className: "bg-gray-100 text-gray-700" },
  REVIEWING: { label: "На рассмотрении", className: "bg-amber-50 text-amber-700" },
  APPROVED: { label: "Одобрено", className: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Отказано", className: "bg-red-50 text-red-700" },
  SOLD: { label: "Продано Alif", className: "bg-blue-50 text-blue-700" },
  CANCELLED: { label: "Отменено", className: "bg-gray-100 text-gray-700" },
  ACTIVE: { label: "Кредит активен", className: "bg-emerald-50 text-emerald-700" },
}

// Правила доступности действий (§4 ТЗ). Держим их здесь, а не в компонентах:
// одно и то же правило читают шапка попапа, плашка холда и фаза успеха.
export function canCancelApplication(status: ApplicationStatus): boolean {
  return status === "NEW" || status === "APPROVED"
}

// Отмена холда допускается, только пока заявка «Новая»: после удержания она
// уходит на рассмотрение. Выход из более поздних статусов даёт отмена самой
// заявки — см. canCancelApplication.
export function canCancelHold(status: ApplicationStatus): boolean {
  return status === "NEW"
}

export function canSell(status: ApplicationStatus): boolean {
  return status === "ACTIVE"
}

export function canUnsell(status: ApplicationStatus): boolean {
  return status === "SOLD"
}

// Комиссия по сроку — мок-таблица; в реальном API приходит из dynamic_pricings.
export const COMMISSION_RATES: Record<number, number> = {
  3: 0.06,
  6: 0.12,
  12: 0.24,
  18: 0.34,
  24: 0.44,
}

/** principal — сумма заказа за вычетом предоплаты. Округление до тысяч сум. */
export function commissionFor(principal: number, months: number): number {
  const rate = COMMISSION_RATES[months] ?? 0
  return Math.round((principal * rate) / 1000) * 1000
}

/** Ежемесячный платёж: (principal + комиссия) / срок, округление до тысяч сум. */
export function monthlyPayment(principal: number, months: number): number {
  if (months <= 0) return 0
  return Math.round((principal + commissionFor(principal, months)) / months / 1000) * 1000
}

// Часть сумм API отдаёт и принимает в тийинах (сумма холда). В моке всё
// хранится в сумах; эти два хелпера отмечают места, где при интеграции
// понадобится конвертация, чтобы её не искали заново.
export function sumToTiyin(sum: number): number {
  return Math.round(sum * 100)
}

export function tiyinToSum(tiyin: number): number {
  return tiyin / 100
}

export interface AlifLimitSeed {
  duration: number
  amount: number
  promo?: string
}

export interface AlifPlan {
  /** condition_id в терминах API. */
  id: string
  duration: number
  amount: number
  monthlyPayment: number
  commission: number
  promo?: string
}

export function buildPlans(limits: AlifLimitSeed[], principal: number): AlifPlan[] {
  return limits.map((limit) => ({
    id: `cond-${limit.duration}`,
    duration: limit.duration,
    amount: limit.amount,
    commission: commissionFor(principal, limit.duration),
    monthlyPayment: monthlyPayment(principal, limit.duration),
    promo: limit.promo,
  }))
}

export type ApplicationErrorKey =
  | "duplicate_marking"
  | "has_reviewing"
  | "has_new"
  | "amount_too_small"
  | "scoring_reject"
  | "amount_too_large"

export interface ApplicationError {
  message: string
  /** Какое поле формы подсветить (§6 ТЗ). */
  field?: "marking" | "amount"
}

export const APPLICATION_ERRORS: Record<ApplicationErrorKey, ApplicationError> = {
  duplicate_marking: { message: "Товар с данной маркировкой уже существует", field: "marking" },
  has_reviewing: { message: "Клиент уже имеет заявку на рассмотрении" },
  has_new: { message: "Клиент уже имеет новую заявку" },
  amount_too_small: { message: "Общая сумма заявки должна быть не менее 1000 сумов", field: "amount" },
  scoring_reject: { message: "Система не принимает заявку" },
  amount_too_large: { message: "Сумма заявки превышает 100 миллионов", field: "amount" },
}

export interface CancelReason {
  key: string
  label: string
}

export const CANCEL_REASONS: CancelReason[] = [
  { key: "client_refused_goods", label: "Клиент отказался от товара" },
  { key: "no_goods_left", label: "Товара не осталось" },
  { key: "client_disagrees_limit", label: "Клиент не согласен на лимит" },
  { key: "another_application", label: "Создали другую заявку" },
  { key: "not_reviewed", label: "Заявка не была на рассмотрении" },
  { key: "wrong_data", label: "Неверные данные" },
  { key: "technical_issues", label: "Технические неполадки" },
  { key: "client_unreachable", label: "Клиент не выходит на связь" },
  { key: "untrusted_client", label: "Не доверенный клиент" },
]

export function makeApplicationId(): string {
  return String(Math.floor(1_000_000 + Math.random() * 9_000_000))
}
