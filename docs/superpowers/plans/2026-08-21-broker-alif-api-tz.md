# Broker · Ветка Alif по ТЗ на основе API — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Довести ветку Alif в Client Broker до восьми экранов ТЗ, написанного по API Alif: выбор условия с платежом и комиссией, привязка карты внутри ветки, родственники списком с анкетой, создание заявки с товаром и бизнес-ошибками, модель из семи статусов заявки, отмена заявки, продажа Alif, обработка ошибок и истечения сессии.

**Architecture:** Ветка остаётся фазами одного попапа `AlifCheckoutDialog` на `/scoring/banks`; фаз становится семь, фаза по-прежнему деривируется из состояния потока, а не хранится. Вся неUI-логика заявки (статусы, правила, деньги, планы, тексты ошибок) выносится в новый чистый модуль `lib/alif-application.ts`, из которого её читают и фазы, и карточка банка. Все недостижимые в моке исходы включаются одной демо-панелью внизу попапа.

**Tech Stack:** React 18 + Vite 6, Tailwind v4, `@texnomart/ui` (shadcn/Radix), lucide-react, date-fns (`ru`), sonner. Состояние потока — React context + `sessionStorage`.

**Spec:** `docs/superpowers/specs/2026-08-21-broker-alif-api-tz-design.md`

## Global Constraints

- **Тестов в проекте нет.** Ни тест-раннера, ни тестовых файлов в `Broker/`. Не создавать тестовую инфраструктуру — это вне скоупа задачи. Проверка задачи = сборка + перечитывание своего диффа против пунктов задачи.
- **TypeScript в `Broker/` отсутствует** — ни пакета `typescript`, ни `tsconfig.json`; `vite build` транспилирует через esbuild **без проверки типов**. Зелёная сборка не доказывает, что типы сходятся. Сигнатуры сверять глазами по блоку **Interfaces** своей задачи.
- **Команда сборки:** `corepack pnpm build:broker` из корня репозитория. `pnpm` не в PATH — только через `corepack`.
- **Не запускать сборки с `BASE_PATH` из Git Bash** — MSYS искажает значения, похожие на пути. Обычная сборка без env-переменных безопасна в любой оболочке.
- **Не открывать браузер** внутри задач: профиль Playwright лочится между агентами. Весь click-through QA — отдельной финальной задачей.
- Весь текст интерфейса — **на русском**. Числа — `toLocaleString("ru-RU")` + класс `tabular-nums`. Валюта — «сум».
- Цвета — точный hex через `style={{}}`, не Tailwind-классами с произвольным значением. Бренд — `#FFD60A`, текст на жёлтом — чёрный.
- Примитивы брать из `@texnomart/ui/*`. **Файлы в `packages/ui/src/` не редактировать** — это автогенерируемые shadcn-компоненты.
- Модалки открывать обычной кнопкой, **не** через Radix `asChild` — в этом монорепозитории это давало меню за пределами экрана.
- Мобильная адаптивность обязательна (sm/md/lg), цель касания — от 44×44 px.
- Коммит после каждой задачи, прямо в `main`, без веток. **Никаких AI-подписей и трейлеров в сообщениях коммитов.**
- Каждый демо-аффорданс (переключатель исхода, которого в реальном API не будет) помечается комментарием в коде со словом «демо» и упоминанием, что удаляется при интеграции.

---

## Файловая структура

| Файл | Ответственность |
|---|---|
| `Broker/src/lib/alif-application.ts` | **Создаётся.** Чистая логика заявки: статусы и их оформление, правила доступности действий, расчёт комиссии и платежа, построение планов, тексты бизнес-ошибок, причины отмены. Без React. |
| `Broker/src/lib/broker-mock-data.ts` | Сид-данные и константы: лимиты по срокам, товар «из 1С», сферы деятельности, причины отказа скоринга, задержки, маски. |
| `Broker/src/app/scoring-flow.tsx` | Состояние потока, деривация фазы (`checkoutPhaseOf`), действия. |
| `Broker/src/app/components/checkout/AlifCheckoutDialog.tsx` | Хост фазовой машины: шапка (прогресс + статус + отмена заявки), роутинг по фазам, демо-панель, экран истёкшей сессии. |
| `Broker/src/app/components/checkout/OfferPhase.tsx` | **Создаётся.** Экран 1 — планы, загрузка, отказ. Заменяет `ConfirmPhase.tsx`. |
| `Broker/src/app/components/checkout/CardAttachPhase.tsx` | **Создаётся.** Экран 2 — привязка карты к Alif. |
| `Broker/src/app/components/checkout/DetailsPhase.tsx` | Экран 3 — список родственников + анкета. |
| `Broker/src/app/components/checkout/RelativeFields.tsx` | **Создаётся.** Одна строка списка родственников + маска телефона. |
| `Broker/src/app/components/checkout/ApplicationPhase.tsx` | **Создаётся.** Экран 4 — товар, дата первого платежа, итоги, результат. |
| `Broker/src/app/components/checkout/HoldPhase.tsx`, `HoldStatusBar.tsx` | Экран 5 — даты удержания, правило отмены. |
| `Broker/src/app/components/checkout/CreditOtpPhase.tsx`, `SuccessPhase.tsx` | Экраны 6–8 — платёж в сводке, дата договора, продажа. |
| `Broker/src/app/components/checkout/ApplicationStatusBadge.tsx` | **Создаётся.** Бейдж статуса заявки. |
| `Broker/src/app/components/checkout/CancelApplicationDialog.tsx` | **Создаётся.** Отмена заявки с выбором причины. |
| `Broker/src/app/components/checkout/PhaseError.tsx` | **Создаётся.** Единая плашка ошибки API. |
| `Broker/src/app/components/checkout/DemoScenarioBar.tsx` | **Создаётся.** Демо-переключатели, зависящие от фазы. |
| `Broker/src/app/components/scoring/BankCard.tsx`, `BanksPage.tsx` | Карточка банка без выбора срока; статус заявки на карточке. |
| `Broker/src/app/components/shell/ScoringStepper.tsx` | Подсветка внешнего степпера по новым фазам. |

---

## Волна 1 — Фундамент

### Task 1: Чистый модуль логики заявки

**Files:**
- Create: `Broker/src/lib/alif-application.ts`

**Interfaces:**
- Consumes: ничего (модуль без зависимостей от проекта).
- Produces: всё перечисленное ниже — на это опираются задачи 2–17.

- [ ] **Step 1: Создать файл целиком**

```ts
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
```

- [ ] **Step 2: Проверить сборку**

Запустить из корня репозитория: `corepack pnpm build:broker`
Ожидается: сборка проходит (новый модуль пока никем не импортируется).

- [ ] **Step 3: Перечитать файл**

Убедиться глазами: девять причин отмены и шесть текстов ошибок совпадают дословно с §4 и §«Бизнес-ошибки» ТЗ; семь статусов и их подписи — с таблицей §5.

- [ ] **Step 4: Коммит**

```bash
git add Broker/src/lib/alif-application.ts
git commit -m "feat(broker): чистый модуль логики заявки Alif — статусы, правила, деньги, планы"
```

---

### Task 2: Сид-данные и константы

**Files:**
- Modify: `Broker/src/lib/broker-mock-data.ts`

**Interfaces:**
- Consumes: `AlifLimitSeed` из `@/lib/alif-application`.
- Produces: `ALIF_LIMITS`, `ALIF_DURATIONS`, `ALIF_REJECT_REASONS`, `ORDER_ITEM` (тип `OrderItem`), `ACTIVITY_AREAS`, `RELATION_KINDS` (расширяется), `APPLICATION_REVIEW_DELAY_MS`, `CARD_ATTACH_DELAY_MS`, `HOLD_TILL_DAYS`, `FIRST_PAYMENT_MAX_DAYS`, `FIRST_PAYMENT_DEFAULT_DAYS`, `ALIF_UNMATCHED_PHONE_MASK`, `maskPanAlif`, `maskPhoneTail`.

- [ ] **Step 1: Добавить импорт типа в начало файла**

```ts
import type { AlifLimitSeed } from "./alif-application"
```

- [ ] **Step 2: Заменить набор сроков Alif на набор ТЗ**

В константе `BANKS`, у объекта с `id: "alif"`, заменить строку `tenors: [2, 3, 6, 9, 12, 18, 24, 36],` на `tenors: [3, 6, 12, 18, 24],` и строку `defaultTenor: 6,` оставить как есть.

Поле `tenors` после задачи 7 больше не читается карточкой банка, но остаётся в типе `Bank` ради банка Iman.

- [ ] **Step 3: Добавить новые константы в конец файла**

```ts
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
```

- [ ] **Step 4: Расширить список видов родства**

Заменить существующую строку `export const RELATION_KINDS = [...]` на:

```ts
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
```

- [ ] **Step 5: Проверить сборку**

Запустить: `corepack pnpm build:broker`
Ожидается: сборка проходит.

- [ ] **Step 6: Коммит**

```bash
git add Broker/src/lib/broker-mock-data.ts
git commit -m "feat(broker): сид-данные ветки Alif — лимиты по срокам, товар 1С, сферы деятельности"
```

---

### Task 3: Состояние потока и семь фаз

**Files:**
- Modify: `Broker/src/app/scoring-flow.tsx`

**Interfaces:**
- Consumes: `ApplicationStatus`, `makeApplicationId`, `sumToTiyin` из `@/lib/alif-application`; `ONE_C_ORDER_NO`, `makeContractNo`, `SEED_CARD`, `HOLD_TILL_DAYS`, `ALIF_PREPAYMENT` из `@/lib/broker-mock-data`.
- Produces: тип `CheckoutPhase` (семь значений), `checkoutPhaseOf(state, alifPrepayment)`, `PHASE_STEP`, интерфейсы `Relation`/`Survey`/`AlifApplication`, а также действия контекста `selectPlan`, `setAlifLimitStatus`, `attachAlifCard`, `saveDetails`, `createApplication`, `setApplicationStatus`, `cancelApplication`, `sellApplication`, `unsellApplication`, `expireSession`, `refreshSession` — плюс существующие, кроме удаляемых `selectAlif` и `saveAdditionalData`.

- [ ] **Step 1: Заменить типы состояния**

Удалить интерфейс `AdditionalData` целиком. Вместо него и вместо старых полей задать:

```ts
export interface Relation {
  /** Вид родства из RELATION_KINDS. */
  type: string
  /** Отформатированный номер: "+998 XX XXX XX XX". */
  phone: string
  name: string
}

export interface Survey {
  activityAreaId: string
  language: "ru" | "uz"
  car?: boolean
}

export interface AlifCard {
  /** Маска в формате Alif: 986035******1296. */
  pan: string
  /** Маска телефона, куда ушёл код: ********9848. */
  phone: string
  phoneMatch: boolean
}

export interface HoldRecord {
  /** ISO-строки. */
  at: string
  till: string
  cardPan: string
  /**
   * Сумма удержания в тийинах — ровно в том виде, в каком её принимает
   * hold-down-payment. На экран выводится через tiyinToSum: §2 ТЗ требует
   * показывать суммы в сумах.
   */
  amountTiyin: number
}

export interface AlifApplication {
  id: string
  status: ApplicationStatus
  createdAt: string
  firstPaymentDate: string
  imei?: string
  amount: number
  commission: number
  duration: number
  cancelReasonKey?: string
}
```

В `ScoringFlowState` **удалить** поля `tenor`, `alifSelected`, `additionalData`. **Добавить**: `planId?: string`, `alifCard?: AlifCard`, `relations?: Relation[]`, `survey?: Survey`, `application?: AlifApplication`, `hold?: HoldRecord`, `contractDate?: string`, `sessionExpired?: boolean`. Тип `alifLimitStatus` расширить до `"pending" | "ready" | "rejected"`.

`INITIAL` соответственно теряет `alifSelected: false` и остальное не меняет.

- [ ] **Step 2: Сменить ключ хранилища**

```ts
// v2 — состояние поменялось несовместимо (planId вместо tenor, relations
// вместо additionalData, появилась заявка). Чтение делает {...INITIAL,
// ...parsed}, поэтому старый снимок дал бы полусостояние.
const STORAGE_KEY = "broker:scoring-flow:v2"
```

- [ ] **Step 3: Заменить деривацию фазы**

```ts
export type CheckoutPhase =
  | "offer"
  | "card"
  | "details"
  | "application"
  | "hold"
  | "otp"
  | "success"

// Внутренний прогресс мастера: экраны 7 и 8 ТЗ (итог кредита и договор) в
// попапе — одна фаза успеха, поэтому шагов семь, а не восемь.
export const PHASE_STEP: Record<CheckoutPhase, { step: number; title: string }> = {
  offer: { step: 1, title: "Предложение Alif" },
  card: { step: 2, title: "Привязка карты" },
  details: { step: 3, title: "Дополнительные данные" },
  application: { step: 4, title: "Создание заявки" },
  hold: { step: 5, title: "Предоплата" },
  otp: { step: 6, title: "Подтверждение кредита" },
  success: { step: 7, title: "Кредит оформлен" },
}

export const CHECKOUT_STEP_COUNT = 7

// Порядок проверок читается сверху вниз как «что сейчас блокирует прогресс»,
// а не «как далеко зашли». Два места здесь трогать нельзя:
//
// 1. Холд стоит ПОСЛЕ создания заявки — по ТЗ заявка сначала создаётся со
//    статусом NEW, и только потом удерживается предоплата.
// 2. Холд стоит ВЫШЕ otp — иначе отмена холда с шага OTP оставит оператора
//    на экране подтверждения кредита при уже разблокированных деньгах. Это
//    ровно тот баг, который чинили 19.08; менять порядок нельзя.
//
// relations и survey сохраняются одним действием экрана 3, поэтому проверки
// на survey здесь нет: заполненные relations означают пройденный экран.
export function checkoutPhaseOf(state: ScoringFlowState, alifPrepayment: number): CheckoutPhase {
  if (state.creditConfirmed) return "success"
  if (!state.offerConfirmed) return "offer"
  if (!state.alifCard) return "card"
  if (!state.relations) return "details"
  if (!state.application) return "application"
  if (alifPrepayment > 0 && state.holdStatus !== "confirmed") return "hold"
  return "otp"
}
```

- [ ] **Step 4: Заменить и добавить действия**

Удалить `selectAlif` и `saveAdditionalData` (вместе с их упоминаниями в интерфейсе контекста и в объекте `value`). Добавить:

```ts
const selectPlan = useCallback((planId: string) => {
  setState((prev) => (prev.planId === planId ? prev : { ...prev, planId }))
}, [])

const setAlifLimitStatus = useCallback((alifLimitStatus: ScoringFlowState["alifLimitStatus"]) => {
  setState((prev) => (prev.alifLimitStatus === alifLimitStatus ? prev : { ...prev, alifLimitStatus }))
}, [])

const attachAlifCard = useCallback((alifCard: AlifCard) => {
  setState((prev) => ({ ...prev, alifCard }))
}, [])

const saveDetails = useCallback((relations: Relation[], survey: Survey) => {
  setState((prev) => ({ ...prev, relations, survey }))
}, [])

const createApplication = useCallback((application: AlifApplication) => {
  setState((prev) => ({ ...prev, application }))
}, [])

const setApplicationStatus = useCallback((status: ApplicationStatus) => {
  setState((prev) =>
    prev.application ? { ...prev, application: { ...prev.application, status } } : prev,
  )
}, [])

// Отмена заявки снимает и холд: удержанные деньги не могут пережить заявку.
const cancelApplication = useCallback((cancelReasonKey: string) => {
  setState((prev) =>
    prev.application
      ? {
          ...prev,
          holdStatus: prev.holdStatus === "confirmed" ? "cancelled" : prev.holdStatus,
          application: { ...prev.application, status: "CANCELLED", cancelReasonKey },
        }
      : prev,
  )
}, [])

const sellApplication = useCallback(() => {
  setState((prev) =>
    prev.application ? { ...prev, application: { ...prev.application, status: "SOLD" } } : prev,
  )
}, [])

const unsellApplication = useCallback(() => {
  setState((prev) =>
    prev.application ? { ...prev, application: { ...prev.application, status: "CANCELLED" } } : prev,
  )
}, [])

const expireSession = useCallback(() => {
  setState((prev) => (prev.sessionExpired ? prev : { ...prev, sessionExpired: true }))
}, [])

const refreshSession = useCallback(() => {
  setState((prev) => (prev.sessionExpired ? { ...prev, sessionExpired: false } : prev))
}, [])
```

- [ ] **Step 5: Записывать сведения о холде**

Заменить `holdConfirm` так, чтобы вместе со статусом фиксировалась запись холда:

```ts
const holdConfirm = useCallback(() => {
  setState((prev) => {
    if (prev.holdStatus === "confirmed") return prev
    const at = new Date()
    const till = new Date(at.getTime() + HOLD_TILL_DAYS * 24 * 60 * 60 * 1000)
    const card = prev.cards.find((c) => c.confirmed)
    return {
      ...prev,
      holdStatus: "confirmed",
      hold: {
        at: at.toISOString(),
        till: till.toISOString(),
        cardPan: card?.mask ?? SEED_CARD.mask,
        amountTiyin: sumToTiyin(ALIF_PREPAYMENT),
      },
      // Удержание предоплаты уводит заявку на рассмотрение (§ экран 5 ТЗ).
      application: prev.application ? { ...prev.application, status: "REVIEWING" } : prev.application,
    }
  })
}, [])
```

- [ ] **Step 6: Фиксировать дату договора при оформлении**

Заменить тело `confirmCredit` так, чтобы дата подписания сохранялась, а не вычислялась при рендере:

```ts
const confirmCredit = useCallback(() => {
  setState((prev) =>
    prev.creditConfirmed
      ? prev
      : {
          ...prev,
          creditConfirmed: true,
          contractNo: prev.contractNo ?? makeContractNo(),
          // Дата подписания фиксируется здесь. Раньше SuccessPhase считала её
          // как new Date() при рендере, поэтому при повторном открытии
          // показывалась сегодняшняя дата, а не дата оформления.
          contractDate: prev.contractDate ?? new Date().toISOString(),
          oneCOrderNo: ONE_C_ORDER_NO,
          application: prev.application ? { ...prev.application, status: "ACTIVE" } : prev.application,
        },
  )
}, [])
```

- [ ] **Step 7: Обновить `cancelOffer`**

Выход из ветки должен сбрасывать и выбор условия, и привязку карты Alif, иначе повторный вход пропустит экраны 1–2:

```ts
const cancelOffer = useCallback(() => {
  setState((prev) => ({
    ...prev,
    offerConfirmed: false,
    holdStatus: "none",
    checkoutOpen: false,
  }))
}, [])
```

Оставить как есть — `planId` и `alifCard` сохраняются намеренно: экран 1 переоткроется с уже выбранным планом, а привязанная карта не требует повторного OTP. Добавить в комментарий над функцией строку: «`planId` и `alifCard` переживают выход — повторно вводить код карты оператор не должен».

- [ ] **Step 8: Обновить интерфейс контекста и объект value**

В `ScoringFlowContextValue` добавить сигнатуры всех новых действий и удалить `selectAlif`/`saveAdditionalData`. В объекте, передаваемом в `ScoringFlowContext.Provider`, перечислить их же.

- [ ] **Step 9: Проверить сборку**

Запустить: `corepack pnpm build:broker`
Ожидается: **сборка падает** — `BanksPage`, `ConfirmPhase`, `DetailsPhase`, `CreditOtpPhase`, `SuccessPhase`, `ScoringStepper` ещё ссылаются на удалённые `selectAlif`, `state.tenor`, `saveAdditionalData`, `AdditionalData` и на старые имена фаз. Это ожидаемо: их чинит задача 4. Зафиксировать список падений и передать дальше.

- [ ] **Step 10: Коммит**

```bash
git add Broker/src/app/scoring-flow.tsx
git commit -m "feat(broker): состояние заявки Alif и семь фаз попапа"
```

---

### Task 4: Каркас попапа, бейдж статуса, степпер

**Files:**
- Modify: `Broker/src/app/components/checkout/AlifCheckoutDialog.tsx`
- Create: `Broker/src/app/components/checkout/ApplicationStatusBadge.tsx`
- Create: `Broker/src/app/components/checkout/OfferPhase.tsx` (заглушка)
- Create: `Broker/src/app/components/checkout/CardAttachPhase.tsx` (заглушка)
- Create: `Broker/src/app/components/checkout/ApplicationPhase.tsx` (заглушка)
- Modify: `Broker/src/app/components/shell/ScoringStepper.tsx`
- Modify: `Broker/src/app/components/checkout/CreditOtpPhase.tsx`
- Modify: `Broker/src/app/components/checkout/SuccessPhase.tsx`
- Modify: `Broker/src/app/components/checkout/DetailsPhase.tsx`
- Modify: `Broker/src/app/components/scoring/BanksPage.tsx`

**Interfaces:**
- Consumes: `CheckoutPhase`, `PHASE_STEP`, `CHECKOUT_STEP_COUNT`, `checkoutPhaseOf` из `@/app/scoring-flow`; `APPLICATION_STATUS_META`, `ApplicationStatus`, `buildPlans` из `@/lib/alif-application`; `ALIF_LIMITS`, `ALIF_PREPAYMENT`, `ORDER` из `@/lib/broker-mock-data`.
- Produces: `<ApplicationStatusBadge status={...} />`; заглушки `OfferPhase`, `CardAttachPhase`, `ApplicationPhase` (без пропсов) — их наполняют задачи 6, 8, 10.

Цель задачи — вернуть проект к зелёной сборке на новой фазовой машине. Экраны наполняются позже.

- [ ] **Step 1: Создать бейдж статуса**

```tsx
import { Badge } from "@texnomart/ui/badge"
import { cn } from "@texnomart/ui/utils"
import { APPLICATION_STATUS_META, type ApplicationStatus } from "@/lib/alif-application"

export interface ApplicationStatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

// Бейдж статуса заявки (§5 ТЗ). Оформление берётся из APPLICATION_STATUS_META,
// чтобы подпись и цвет совпадали везде, где статус показывается.
export function ApplicationStatusBadge({ status, className }: ApplicationStatusBadgeProps) {
  const meta = APPLICATION_STATUS_META[status]
  return (
    <Badge className={cn("border-transparent hover:bg-inherit", meta.className, className)}>
      {meta.label}
    </Badge>
  )
}
```

- [ ] **Step 2: Создать три заглушки фаз**

Каждый файл — один компонент без пропсов, чтобы попап собрался. Содержимое наполняется задачами 6, 8, 10.

`OfferPhase.tsx`:

```tsx
// Экран 1 ТЗ — наполняется задачей 6.
export function OfferPhase() {
  return <div className="px-2 py-4" />
}
```

`CardAttachPhase.tsx`:

```tsx
// Экран 2 ТЗ — наполняется задачей 8.
export function CardAttachPhase() {
  return <div className="px-2 py-4" />
}
```

`ApplicationPhase.tsx`:

```tsx
// Экран 4 ТЗ — наполняется задачей 10.
export function ApplicationPhase() {
  return <div className="px-2 py-4" />
}
```

- [ ] **Step 3: Переписать `AlifCheckoutDialog`**

Сохранить всё, что уже работает: деривацию фазы, блокировку закрытия во время `holdStatus === "held"`, скрытые заголовки для скринридеров. Изменения: семь фаз вместо пяти, шапка с прогрессом и статусом, переименованная константа задержки.

```tsx
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@texnomart/ui/dialog"
import { Progress } from "@texnomart/ui/progress"
import {
  CHECKOUT_STEP_COUNT,
  PHASE_STEP,
  checkoutPhaseOf,
  useScoringFlow,
  type CheckoutPhase,
} from "@/app/scoring-flow"
import { ALIF_PREPAYMENT } from "@/lib/broker-mock-data"
import { ApplicationStatusBadge } from "./ApplicationStatusBadge"
import { OfferPhase } from "./OfferPhase"
import { CardAttachPhase } from "./CardAttachPhase"
import { DetailsPhase } from "./DetailsPhase"
import { ApplicationPhase } from "./ApplicationPhase"
import { HoldPhase } from "./HoldPhase"
import { CreditOtpPhase } from "./CreditOtpPhase"
import { SuccessPhase } from "./SuccessPhase"

// Единственный переход, которому нужна пауза на читаемость: уход с фазы
// холда. Оператор должен успеть увидеть зелёный бейдж «Предоплата
// подтверждена» прежде, чем фаза сменится. В новом порядке фаз выход с холда
// один — на otp.
const HOLD_EXIT_DELAY_MS = 600

export function AlifCheckoutDialog() {
  const { state, closeCheckout } = useScoringFlow()
  const held = state.holdStatus === "held"
  const derivedPhase = checkoutPhaseOf(state, ALIF_PREPAYMENT)

  const [phase, setPhase] = useState<CheckoutPhase>(derivedPhase)

  useEffect(() => {
    if (phase === derivedPhase) return
    if (phase === "hold" && derivedPhase === "otp") {
      const t = setTimeout(() => setPhase(derivedPhase), HOLD_EXIT_DELAY_MS)
      return () => clearTimeout(t)
    }
    setPhase(derivedPhase)
  }, [derivedPhase, phase])

  function handleOpenChange(open: boolean) {
    if (open || held) return
    closeCheckout()
  }

  const { step, title } = PHASE_STEP[phase]

  return (
    <Dialog open={state.checkoutOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[640px] max-h-[90dvh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          if (held) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (held) e.preventDefault()
        }}
      >
        <DialogTitle className="sr-only">Оформление рассрочки Alif Nasiya</DialogTitle>
        <DialogDescription className="sr-only">
          Пошаговое оформление рассрочки Alif Nasiya: выбор условия, привязка карты, дополнительные
          данные, создание заявки, предоплата, код подтверждения и результат оформления.
        </DialogDescription>

        {/* Шапка мастера: прогресс по ветке Alif + статус заявки. Внешний
            степпер описывает весь скоринг, здесь — только эта ветка. */}
        <div className="border-b pb-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-gray-700">
              Шаг {step} из {CHECKOUT_STEP_COUNT} · {title}
            </p>
            {state.application && <ApplicationStatusBadge status={state.application.status} />}
          </div>
          <Progress value={(step / CHECKOUT_STEP_COUNT) * 100} className="mt-2 h-1" />
        </div>

        {phase === "offer" && <OfferPhase />}
        {phase === "card" && <CardAttachPhase />}
        {phase === "details" && <DetailsPhase />}
        {phase === "application" && <ApplicationPhase />}
        {phase === "hold" && <HoldPhase />}
        {phase === "otp" && <CreditOtpPhase />}
        {phase === "success" && <SuccessPhase />}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Обновить `ScoringStepper`**

Заменить константу `PHASE_INDEX` на:

```ts
// Внешний степпер описывает весь скоринг (5 шагов). Семь фаз ветки Alif
// раскладываются по трём его последним шагам; точный прогресс внутри ветки
// показывает шапка попапа.
const PHASE_INDEX: Record<CheckoutPhase, number> = {
  offer: 2,
  card: 2,
  details: 3,
  application: 3,
  hold: 3,
  otp: 4,
  success: 4,
}
```

- [ ] **Step 5: Починить `BanksPage`**

Удалить `selectAlif` из деструктуризации `useScoringFlow()` и убрать блок заморозки срока — выбор условия теперь живёт на экране 1:

```tsx
// Alif «Оформить» открывает попап на текущей странице (URL не меняется).
// Условие выбирается внутри попапа, на экране предложения, поэтому здесь
// ничего не выбирается и нечего замораживать.
function handleCheckout(bankId: "alif" | "iman") {
  if (bankId === "alif") {
    openCheckout()
  } else {
    toast.info("В прототипе реализован сценарий Alif")
  }
}
```

Вызовы у карточек привести к `onCheckout={() => handleCheckout("alif")}` и `onCheckout={() => handleCheckout("iman")}`.

- [ ] **Step 6: Починить `BankCard`**

Изменить тип пропса `onCheckout` на `() => void`, удалить `useState` со сроком и передавать `onCheckout()` без аргумента. Чипы срока и строку «Срок 0-0-N» пока **не** удалять — это задача 7; сейчас достаточно, чтобы чип менял только локальный вид.

Практически: оставить `const [tenor, setTenor] = useState(bank.defaultTenor)` для отрисовки чипов, но кнопка вызывает `onCheckout()`.

- [ ] **Step 7: Починить фазы, ссылающиеся на `state.tenor`**

В `CreditOtpPhase.tsx` и `SuccessPhase.tsx` заменить `const tenor = state.tenor ?? ORDER.tenor` на чтение срока из выбранного плана:

```tsx
import { buildPlans } from "@/lib/alif-application"
import { ALIF_LIMITS, ALIF_PREPAYMENT, ORDER } from "@/lib/broker-mock-data"

const PLANS = buildPlans(ALIF_LIMITS, ORDER.amount - ALIF_PREPAYMENT)

// ...внутри компонента:
const plan = PLANS.find((p) => p.id === state.planId) ?? PLANS[0]
const tenor = plan.duration
```

- [ ] **Step 8: Починить `DetailsPhase`**

Минимальная правка ради сборки, полная переработка — задача 9. Заменить импорт `type AdditionalData` и вызов `saveAdditionalData(data)` на:

```tsx
import { useScoringFlow, type Relation, type Survey } from "@/app/scoring-flow"

// ...в деструктуризации контекста saveAdditionalData заменить на saveDetails:
const { state, saveDetails } = useScoringFlow()

// ...в handleSubmit:
const relations: Relation[] = [{ type: t1Relation, phone: formatUzPhone(t1Digits), name: "" }]
if (t2Filled) relations.push({ type: t2Relation, phone: formatUzPhone(t2Digits), name: "" })
const survey: Survey = { activityAreaId: "other", language: "ru" }
saveDetails(relations, survey)
```

Инициализацию локального состояния из `state.additionalData?...` заменить на чтение из `state.relations?.[0]` / `state.relations?.[1]`, а `debitDate` оставить как локальное поле — оно уходит с этого экрана в задаче 9.

- [ ] **Step 9: Проверить сборку**

Запустить: `corepack pnpm build:broker`
Ожидается: сборка проходит без ошибок. Если падает — читать сообщение и чинить оставшиеся ссылки на `selectAlif`, `state.tenor`, `additionalData`, `ConfirmPhase`.

- [ ] **Step 10: Коммит**

```bash
git add Broker/src/app/components Broker/src/app/scoring-flow.tsx
git commit -m "feat(broker): каркас семифазного попапа Alif — прогресс мастера, бейдж статуса, заглушки экранов"
```

---

### Task 5: Демо-панель, плашка ошибки, экран истёкшей сессии

**Files:**
- Create: `Broker/src/app/components/checkout/PhaseError.tsx`
- Create: `Broker/src/app/components/checkout/DemoScenarioBar.tsx`
- Modify: `Broker/src/app/components/checkout/AlifCheckoutDialog.tsx`

**Interfaces:**
- Consumes: `useScoringFlow`, `CheckoutPhase` из `@/app/scoring-flow`.
- Produces: `<PhaseError message={string} className?={string} />`; `<DemoScenarioBar phase={CheckoutPhase} />`. Задачи 6, 8, 11 добавляют в панель свои переключатели.

- [ ] **Step 1: Создать `PhaseError`**

```tsx
import { AlertCircle } from "lucide-react"
import { cn } from "@texnomart/ui/utils"

export interface PhaseErrorProps {
  /** Текст поля message из ответа API. */
  message: string
  className?: string
}

// Единая плашка ошибки для всех фаз (§6 ТЗ): иконка + message понятным
// текстом. Оба формата ошибок Alif сводятся в моке к строке message, поэтому
// компоненту достаточно её одной.
export function PhaseError({ message, className }: PhaseErrorProps) {
  return (
    <div
      role="alert"
      className={cn("flex gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700", className)}
    >
      <AlertCircle className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
```

- [ ] **Step 2: Создать `DemoScenarioBar`**

```tsx
import { useScoringFlow, type CheckoutPhase } from "@/app/scoring-flow"
import { cn } from "@texnomart/ui/utils"

// ДЕМО-АФФОРДАНС. Реальных отказов, несовпадений телефона и бизнес-ошибок в
// моке взяться неоткуда: сеть не спрашивается, все операции успешны. Без
// явного переключателя все эти экраны — мёртвый код, который существует в
// репозитории и не существует в продукте.
//
// Панель собрана в одном месте (а не рассыпана чипами по фазам), чтобы при
// интеграции с API её можно было удалить одним движением: убрать этот файл и
// его вызов в AlifCheckoutDialog.

export interface DemoOption {
  id: string
  label: string
}

export interface DemoScenarioBarProps {
  phase: CheckoutPhase
}

export function DemoScenarioBar({ phase }: DemoScenarioBarProps) {
  const { state, setAlifLimitStatus, expireSession } = useScoringFlow()

  // Переключатели, относящиеся к текущей фазе. Фазы, у которых своих
  // сценариев нет, показывают только общий «Сессия истекла».
  const options: { label: string; active: boolean; onSelect: () => void }[] = []

  if (phase === "offer") {
    options.push(
      {
        label: "Одобрено",
        active: state.alifLimitStatus !== "rejected",
        onSelect: () => setAlifLimitStatus("ready"),
      },
      {
        label: "Отказ скоринга",
        active: state.alifLimitStatus === "rejected",
        onSelect: () => setAlifLimitStatus("rejected"),
      },
    )
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
      <span className="text-xs font-medium text-gray-400">Демо-сценарий:</span>
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          onClick={option.onSelect}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            option.active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
          )}
        >
          {option.label}
        </button>
      ))}
      <button
        type="button"
        onClick={expireSession}
        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
      >
        Сессия истекла
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Подключить панель и экран истёкшей сессии в попап**

В `AlifCheckoutDialog` добавить импорты `DemoScenarioBar`, `PhaseError`, `Button` и `RefreshCw` из `lucide-react`, взять `refreshSession` из контекста, а блок рендера фаз обернуть проверкой:

```tsx
{state.sessionExpired ? (
  <div className="px-2 py-4">
    <PhaseError message="Сессия Alif истекла. Обновите сессию, чтобы продолжить оформление." />
    <p className="mt-3 text-sm text-gray-500">
      Введённые данные сохранены — после обновления вы вернётесь на этот же шаг.
    </p>
    <Button
      type="button"
      onClick={refreshSession}
      className="mt-6 h-11 w-full font-semibold text-black hover:opacity-90"
      style={{ background: "#FFD60A" }}
    >
      <RefreshCw className="size-4" />
      Обновить сессию
    </Button>
  </div>
) : (
  <>
    {phase === "offer" && <OfferPhase />}
    {phase === "card" && <CardAttachPhase />}
    {phase === "details" && <DetailsPhase />}
    {phase === "application" && <ApplicationPhase />}
    {phase === "hold" && <HoldPhase />}
    {phase === "otp" && <CreditOtpPhase />}
    {phase === "success" && <SuccessPhase />}
  </>
)}

<DemoScenarioBar phase={phase} />
```

- [ ] **Step 4: Проверить сборку**

Запустить: `corepack pnpm build:broker`
Ожидается: сборка проходит.

- [ ] **Step 5: Коммит**

```bash
git add Broker/src/app/components/checkout
git commit -m "feat(broker): демо-панель сценариев, единая плашка ошибки и экран истёкшей сессии"
```

---

## Волна 2 — Экран 1 «Предложение Alif + выбор условия»

### Task 6: Экран выбора условия

**Files:**
- Modify: `Broker/src/app/components/checkout/OfferPhase.tsx`
- Delete: `Broker/src/app/components/checkout/ConfirmPhase.tsx`

**Interfaces:**
- Consumes: `buildPlans`, `AlifPlan` из `@/lib/alif-application`; `ALIF_LIMITS`, `ALIF_REJECT_REASONS`, `ALIF_PREPAYMENT`, `ORDER`, `BANKS` из `@/lib/broker-mock-data`; `selectPlan`, `confirmOffer`, `closeCheckout` из контекста потока.
- Produces: `OfferPhase` без пропсов.

- [ ] **Step 1: Написать компонент**

Три состояния по §«Состояния» ТЗ. Загрузка использует уже существующую задержку лимита (`state.alifLimitStatus === "pending"`), которую заводит `BanksPage`.

```tsx
import { useState } from "react"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { Button } from "@texnomart/ui/button"
import { DialogFooter } from "@texnomart/ui/dialog"
import { Skeleton } from "@texnomart/ui/skeleton"
import { cn } from "@texnomart/ui/utils"
import { buildPlans } from "@/lib/alif-application"
import { ALIF_LIMITS, ALIF_PREPAYMENT, ALIF_REJECT_REASONS, BANKS, ORDER } from "@/lib/broker-mock-data"
import { useScoringFlow } from "@/app/scoring-flow"

const ALIF = BANKS.find((b) => b.id === "alif")!
const PLANS = buildPlans(ALIF_LIMITS, ORDER.amount - ALIF_PREPAYMENT)

// Экран 1 ТЗ. Здесь выбирается условие рассрочки (condition_id) — это
// единственное место выбора: карточка банка его больше не предлагает, чтобы
// не держать один и тот же выбор в двух источниках правды.
export function OfferPhase() {
  const { state, selectPlan, confirmOffer, closeCheckout } = useScoringFlow()
  const [planId, setPlanId] = useState(state.planId ?? PLANS[0].id)

  if (state.alifLimitStatus === "rejected") {
    return (
      <div className="px-2 py-4">
        <h2 className="text-xl font-bold text-gray-900">Alif Nasiya отказал в рассрочке</h2>
        <div className="mt-4 flex gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          <div>
            <p className="font-medium">Причины отказа</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {ALIF_REJECT_REASONS.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
        <DialogFooter className="mt-6 w-full">
          <Button type="button" variant="outline" onClick={closeCheckout} className="h-11 w-full font-semibold">
            Назад к банкам
          </Button>
        </DialogFooter>
      </div>
    )
  }

  if (state.alifLimitStatus === "pending") {
    return (
      <div className="px-2 py-4">
        <h2 className="text-xl font-bold text-gray-900">Предложение Alif Nasiya</h2>
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="size-4 shrink-0 animate-spin" />
          Рассчитываем лимиты…
        </div>
        <div className="mt-4 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    )
  }

  function handleSubmit() {
    selectPlan(planId)
    confirmOffer()
  }

  return (
    <div className="px-2 py-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
          style={{ background: ALIF.brandColor }}
        >
          {ALIF.initial}
        </div>
        <h2 className="flex-1 text-xl font-bold text-gray-900">{ALIF.title}</h2>
      </div>
      <p className="mt-2 text-sm text-gray-500">Выберите условие рассрочки</p>

      <div className="mt-4 space-y-2">
        {PLANS.map((plan) => {
          const selected = plan.id === planId
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setPlanId(plan.id)}
              className={cn(
                "flex w-full flex-col gap-2 rounded-lg border p-4 text-left transition-colors",
                selected ? "bg-amber-50/40" : "hover:bg-gray-50",
              )}
              style={selected ? { borderColor: "#FFD60A" } : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-gray-900">{plan.duration} мес.</span>
                <span className="flex items-center gap-2">
                  {plan.promo && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {plan.promo}
                    </span>
                  )}
                  {selected && <Check className="size-4 text-emerald-600" />}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                <span className="text-gray-500">Лимит</span>
                <span className="text-right font-medium tabular-nums text-gray-900 sm:text-left">
                  {plan.amount.toLocaleString("ru-RU")} сум
                </span>
                <span className="hidden sm:block" />
                <span className="text-gray-500">Ежемесячный платёж</span>
                <span className="text-right font-medium tabular-nums text-gray-900 sm:text-left">
                  {plan.monthlyPayment.toLocaleString("ru-RU")} сум
                </span>
                <span className="hidden sm:block" />
                <span className="text-gray-500">Комиссия</span>
                <span className="text-right font-medium tabular-nums text-gray-900 sm:text-left">
                  {plan.commission.toLocaleString("ru-RU")} сум
                </span>
                <span className="hidden sm:block" />
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
        <span className="text-gray-500">Предоплата</span>
        <span className="font-medium tabular-nums text-gray-900">
          {ALIF_PREPAYMENT.toLocaleString("ru-RU")} сум
        </span>
      </div>

      <DialogFooter className="mt-6 w-full sm:justify-center">
        <Button type="button" variant="outline" onClick={closeCheckout} className="h-11 flex-1 font-semibold">
          Назад
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          className="h-11 flex-1 font-semibold text-black hover:opacity-90"
          style={{ background: "#FFD60A" }}
        >
          Продолжить
        </Button>
      </DialogFooter>
    </div>
  )
}
```

- [ ] **Step 2: Удалить `ConfirmPhase`**

```bash
git rm Broker/src/app/components/checkout/ConfirmPhase.tsx
```

Убедиться поиском, что на файл больше никто не ссылается: `grep -rn "ConfirmPhase" Broker/src`. Ожидается: пусто.

- [ ] **Step 3: Проверить сборку**

Запустить: `corepack pnpm build:broker`
Ожидается: сборка проходит.

- [ ] **Step 4: Коммит**

```bash
git add Broker/src/app/components/checkout
git commit -m "feat(broker): экран предложения Alif — планы с платежом и комиссией, отказ скоринга"
```

---

### Task 7: Карточка банка без выбора срока

**Files:**
- Modify: `Broker/src/app/components/scoring/BankCard.tsx`
- Modify: `Broker/src/app/components/scoring/BanksPage.tsx`

**Interfaces:**
- Consumes: `ApplicationStatusBadge` из `@/app/components/checkout/ApplicationStatusBadge`; `ApplicationStatus` из `@/lib/alif-application`.
- Produces: `BankCardProps` = `{ bank, pending, completed?, status?, onCheckout: () => void }`.

- [ ] **Step 1: Убрать чипы срока и строку срока**

В `BankCard.tsx` удалить импорт `useState` и `cn` (если после правки `cn` больше не нужен), удалить блок `<div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">…</div>` целиком и строку панели лимита со «Срок 0-0-{tenor}». В панели лимита остаются «Доступный лимит» и «Предоплата».

- [ ] **Step 2: Добавить проп статуса заявки**

```tsx
export interface BankCardProps {
  bank: Bank
  pending: boolean
  /**
   * Кредит уже оформлен (Alif, creditConfirmed) — бейдж «Оформлена» вместо
   * «Одобрена», а кнопка ведёт к договору.
   */
  completed?: boolean
  /** Статус заявки — показывается рядом со статусом предложения, когда заявка создана. */
  status?: ApplicationStatus
  onCheckout: () => void
}
```

В шапке карточки, после существующего бейджа предложения, добавить:

```tsx
{status && <ApplicationStatusBadge status={status} />}
```

- [ ] **Step 3: Прокинуть статус из `BanksPage`**

У карточки Alif добавить `status={state.application?.status}`.

- [ ] **Step 4: Проверить сборку**

Запустить: `corepack pnpm build:broker`
Ожидается: сборка проходит.

- [ ] **Step 5: Коммит**

```bash
git add Broker/src/app/components/scoring
git commit -m "feat(broker): карточка банка без выбора срока, статус заявки на карточке"
```

---

## Волна 3 — Экраны 2 и 3

### Task 8: Привязка карты к Alif

**Files:**
- Modify: `Broker/src/app/components/checkout/CardAttachPhase.tsx`
- Modify: `Broker/src/app/components/checkout/DemoScenarioBar.tsx`

**Interfaces:**
- Consumes: `OtpPanel` из `@/app/components/alif/OtpPanel`; `maskPanAlif`, `maskPhoneTail`, `ALIF_UNMATCHED_PHONE_MASK`, `BROKER_CLIENT`, `SEED_CARD` из `@/lib/broker-mock-data`; `attachAlifCard`, `cancelOffer` из контекста.
- Produces: `CardAttachPhase` без пропсов.

- [ ] **Step 1: Добавить переключатель совпадения телефона в демо-панель**

В `DemoScenarioBar` добавить локальное состояние совпадения и передавать его через контекст не нужно — достаточно, чтобы фаза читала его сама. Чтобы не заводить лишнее поле в потоке, переключатель хранится в `sessionStorage` под отдельным ключом и читается обеими сторонами:

```tsx
// Отдельный ключ, а не поле потока: это настройка демо-стенда, а не данные
// оформления, и она не должна попадать в состояние заявки.
export const DEMO_PHONE_MATCH_KEY = "broker:demo-phone-match"

export function readDemoPhoneMatch(): boolean {
  try {
    return sessionStorage.getItem(DEMO_PHONE_MATCH_KEY) !== "false"
  } catch {
    return true
  }
}

export function writeDemoPhoneMatch(value: boolean) {
  try {
    sessionStorage.setItem(DEMO_PHONE_MATCH_KEY, String(value))
  } catch {
    // sessionStorage недоступен — остаёмся на значении по умолчанию
  }
}
```

В теле `DemoScenarioBar` завести `const [phoneMatch, setPhoneMatch] = useState(readDemoPhoneMatch)` и добавить ветку:

```tsx
if (phase === "card") {
  options.push(
    {
      label: "Телефон совпадает",
      active: phoneMatch,
      onSelect: () => {
        writeDemoPhoneMatch(true)
        setPhoneMatch(true)
      },
    },
    {
      label: "Телефон не совпадает",
      active: !phoneMatch,
      onSelect: () => {
        writeDemoPhoneMatch(false)
        setPhoneMatch(false)
      },
    },
  )
}
```

- [ ] **Step 2: Написать `CardAttachPhase`**

```tsx
import { AlertTriangle } from "lucide-react"
import { OtpPanel } from "@/app/components/alif/OtpPanel"
import { useScoringFlow } from "@/app/scoring-flow"
import {
  ALIF_UNMATCHED_PHONE_MASK,
  BROKER_CLIENT,
  SEED_CARD,
  maskPanAlif,
  maskPhoneTail,
} from "@/lib/broker-mock-data"
import { readDemoPhoneMatch } from "./DemoScenarioBar"

// Экран 2 ТЗ. Привязка карты к Alif (request-attach) — отдельно от общей
// привязки на шаге «Верификация»: там карта заводится до выбора банка, здесь
// она привязывается к конкретному банку и подтверждается своим кодом.
export function CardAttachPhase() {
  const { state, attachAlifCard, cancelOffer } = useScoringFlow()

  const card = state.cards.find((c) => c.confirmed) ?? { mask: SEED_CARD.mask }
  const phoneMatch = readDemoPhoneMatch()
  const phone = phoneMatch ? maskPhoneTail(BROKER_CLIENT.phone) : ALIF_UNMATCHED_PHONE_MASK

  function handleSuccess() {
    attachAlifCard({ pan: maskPanAlif(card.mask), phone, phoneMatch })
  }

  return (
    <div className="px-2 py-4">
      <h2 className="text-xl font-bold text-gray-900">Привязка карты к Alif</h2>

      <div className="mt-4">
        <OtpPanel
          variant="card"
          subtitle={`Код отправлен на номер, привязанный к карте: ${phone}`}
          ctaLabel="Подтвердить привязку"
          onSuccess={handleSuccess}
        >
          <div className="grid grid-cols-2 gap-2 rounded-lg border bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-500">Карта</span>
            <span className="text-right font-medium tabular-nums text-gray-900">
              {maskPanAlif(card.mask)}
            </span>
          </div>

          {!phoneMatch && (
            <div className="mt-3 flex gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                Телефон, привязанный к карте, не совпадает с телефоном клиента. Убедитесь, что код
                получает владелец карты.
              </span>
            </div>
          )}
        </OtpPanel>
      </div>

      <button
        type="button"
        onClick={cancelOffer}
        className="mt-4 block w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        Вернуться к выбору предложения
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Привести текст исчерпания попыток к формулировке ТЗ**

В `Broker/src/app/components/alif/OtpPanel.tsx`, в `handleSubmit`, заменить строку `"Превышено число попыток. Запросите новый код"` на `"Исчерпано количество попыток ввода ОТП. Запросите новый код"`.

- [ ] **Step 4: Проверить сборку**

Запустить: `corepack pnpm build:broker`
Ожидается: сборка проходит.

- [ ] **Step 5: Коммит**

```bash
git add Broker/src/app/components
git commit -m "feat(broker): экран привязки карты к Alif — маска телефона, формат PAN, несовпадение телефона"
```

---

### Task 9: Родственники списком и анкета

**Files:**
- Create: `Broker/src/app/components/checkout/RelativeFields.tsx`
- Modify: `Broker/src/app/components/checkout/DetailsPhase.tsx`

**Interfaces:**
- Consumes: `Relation`, `Survey`, `saveDetails` из `@/app/scoring-flow`; `RELATION_KINDS`, `ACTIVITY_AREAS`, `BROKER_CLIENT` из `@/lib/broker-mock-data`.
- Produces: `RelativeFields` c пропсами `{ index, value, onChange, onRemove, removable, error }`, где `value` — `{ type: string; phoneDigits: string; name: string }`; экспортируемые хелперы маски `extractDigits`, `formatUzPhone`, `clampPhoneCursor`.

- [ ] **Step 1: Перенести машинку маски телефона в `RelativeFields`**

Скопировать из текущего `DetailsPhase.tsx` без изменений четыре функции — `extractDigits`, `digitsFromPhone`, `clampPhoneCursor`, `formatUzPhone` — вместе с их комментариями. Это выверенный код: `clampPhoneCursor` защищает префикс `+998` от порчи, когда курсор оказывается левее него. Экспортировать `extractDigits`, `formatUzPhone`, `clampPhoneCursor` и `digitsFromPhone`.

- [ ] **Step 2: Написать `RelativeFields`**

```tsx
import { Trash2 } from "lucide-react"
import { Input } from "@texnomart/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@texnomart/ui/select"
import { RELATION_KINDS } from "@/lib/broker-mock-data"

export interface RelativeDraft {
  type: string
  phoneDigits: string
  name: string
}

export interface RelativeFieldsProps {
  index: number
  value: RelativeDraft
  onChange: (next: RelativeDraft) => void
  onRemove: () => void
  removable: boolean
  error?: string
}

export function RelativeFields({ index, value, onChange, onRemove, removable, error }: RelativeFieldsProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-900">Родственник {index + 1}</h3>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Удалить родственника ${index + 1}`}
            className="flex size-11 items-center justify-center rounded-md text-gray-400 transition-colors hover:text-red-600"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-gray-700">Вид родства</label>
          <Select value={value.type} onValueChange={(type) => onChange({ ...value, type })}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите" />
            </SelectTrigger>
            <SelectContent>
              {RELATION_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {kind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700">Имя</label>
          <Input
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Например, Дилшод"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700">Номер телефона</label>
          <Input
            inputMode="numeric"
            value={formatUzPhone(value.phoneDigits)}
            onChange={(e) => onChange({ ...value, phoneDigits: extractDigits(e.target.value) })}
            onSelect={clampPhoneCursor}
            onClick={clampPhoneCursor}
            onKeyUp={clampPhoneCursor}
          />
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Переписать `DetailsPhase`**

Удалить локальный `TrusteeFields`, поля второго доверительного лица и блок «Дата списания оплаты» (уезжает на экран 4).

Состояние: `const [relatives, setRelatives] = useState<RelativeDraft[]>(...)` — инициализация из `state.relations` (маппингом в `RelativeDraft` через `digitsFromPhone`) либо одной пустой строкой; `activityAreaId`, `language`, `car` — из `state.survey`.

Валидации (§«Валидации» ТЗ) — вычисляются на каждый рендер:

```tsx
const clientDigits = extractDigits(BROKER_CLIENT.phone)

// Индекс → текст ошибки. Три правила ТЗ: телефон заполнен, не совпадает с
// телефоном клиента, не совпадает с другим родственником.
const relativeErrors = relatives.map((relative, i) => {
  if (relative.phoneDigits.length > 0 && relative.phoneDigits.length < 9) {
    return "Введите номер полностью"
  }
  if (relative.phoneDigits.length === 9 && relative.phoneDigits === clientDigits) {
    return "Номер совпадает с номером клиента"
  }
  const duplicate = relatives.some(
    (other, j) => j !== i && other.phoneDigits.length === 9 && other.phoneDigits === relative.phoneDigits,
  )
  if (duplicate) return "Такой номер уже указан у другого родственника"
  return undefined
})

const allFilled = relatives.every(
  (r) => r.type !== "" && r.name.trim() !== "" && r.phoneDigits.length === 9,
)
const canSubmit =
  relatives.length >= 1 && allFilled && relativeErrors.every((e) => e === undefined) && activityAreaId !== ""
```

Сабмит:

```tsx
function handleSubmit() {
  if (!canSubmit) return
  const relations: Relation[] = relatives.map((r) => ({
    type: r.type,
    phone: formatUzPhone(r.phoneDigits),
    name: r.name.trim(),
  }))
  saveDetails(relations, { activityAreaId, language, car })
}
```

Разметка: заголовок «Дополнительные данные», подпись «Укажите хотя бы одного близкого родственника — это увеличивает шанс одобрения», `<HoldStatusBar />` (остаётся), список `RelativeFields` с `error={relativeErrors[i]}`, кнопка добавления, блок анкеты и `DialogFooter` с кнопкой «Продолжить».

Кнопка добавления:

```tsx
<button
  type="button"
  onClick={() => setRelatives((prev) => [...prev, { type: "", phoneDigits: "", name: "" }])}
  className="flex h-11 items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
>
  <Plus className="size-4" />
  Добавить родственника
</button>
```

Блок анкеты:

```tsx
<div className="mt-6">
  <h3 className="font-semibold text-gray-900">Анкета</h3>
  <div className="mt-3 grid gap-3 md:grid-cols-2">
    <div>
      <label className="mb-1 block text-sm text-gray-700">Сфера деятельности</label>
      <Select value={activityAreaId} onValueChange={setActivityAreaId}>
        <SelectTrigger>
          <SelectValue placeholder="Выберите" />
        </SelectTrigger>
        <SelectContent>
          {ACTIVITY_AREAS.map((area) => (
            <SelectItem key={area.id} value={area.id}>
              {area.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div>
      <label className="mb-1 block text-sm text-gray-700">Предпочитаемый язык</label>
      <Select value={language} onValueChange={(value) => setLanguage(value as "ru" | "uz")}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ru">Русский</SelectItem>
          <SelectItem value="uz">Oʻzbekcha</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  <label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-gray-700">
    <Checkbox checked={car} onCheckedChange={(value) => setCar(value === true)} />
    Есть автомобиль
  </label>
</div>
```

Язык здесь — **поле анкеты клиента, а не переключатель интерфейса**: приложение остаётся русскоязычным, `preferred_language` просто уходит в заявку. Импорты: `Plus` из `lucide-react`, `Checkbox` из `@texnomart/ui/checkbox`, `ACTIVITY_AREAS` и `BROKER_CLIENT` из `@/lib/broker-mock-data`.

- [ ] **Step 4: Проверить сборку**

Запустить: `corepack pnpm build:broker`
Ожидается: сборка проходит.

- [ ] **Step 5: Перечитать диффы**

Убедиться, что `clampPhoneCursor` навешен на все три обработчика (`onSelect`, `onClick`, `onKeyUp`) — без этого маска телефона «едет», это уже чинили.

- [ ] **Step 6: Коммит**

```bash
git add Broker/src/app/components/checkout
git commit -m "feat(broker): родственники списком с именем и анкета на экране дополнительных данных"
```

---

## Волна 4 — Экран 4 «Создание заявки»

### Task 10: Форма заявки

**Files:**
- Modify: `Broker/src/app/components/checkout/ApplicationPhase.tsx`

**Interfaces:**
- Consumes: `ORDER_ITEM`, `FIRST_PAYMENT_MAX_DAYS`, `FIRST_PAYMENT_DEFAULT_DAYS`, `ALIF_LIMITS`, `ALIF_PREPAYMENT`, `ORDER` из `@/lib/broker-mock-data`; `buildPlans`, `makeApplicationId` из `@/lib/alif-application`; `createApplication` из контекста.
- Produces: `ApplicationPhase` без пропсов; в задаче 11 к ней добавляются результат и ошибки.

- [ ] **Step 1: Написать форму без обработки результата**

```tsx
import { useState } from "react"
import { addDays, format } from "date-fns"
import { Button } from "@texnomart/ui/button"
import { DialogFooter } from "@texnomart/ui/dialog"
import { Input } from "@texnomart/ui/input"
import { buildPlans, makeApplicationId } from "@/lib/alif-application"
import {
  ALIF_LIMITS,
  ALIF_PREPAYMENT,
  FIRST_PAYMENT_DEFAULT_DAYS,
  FIRST_PAYMENT_MAX_DAYS,
  ORDER,
  ORDER_ITEM,
} from "@/lib/broker-mock-data"
import { useScoringFlow } from "@/app/scoring-flow"
import { HoldStatusBar } from "./HoldStatusBar"

const PLANS = buildPlans(ALIF_LIMITS, ORDER.amount - ALIF_PREPAYMENT)

function isoDate(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

// Экран 4 ТЗ. Товар подтягивается «из 1С» (ORDER_ITEM), условие — с экрана 1.
export function ApplicationPhase() {
  const { state, createApplication } = useScoringFlow()
  const plan = PLANS.find((p) => p.id === state.planId) ?? PLANS[0]

  const today = new Date()
  const minDate = isoDate(today)
  const maxDate = isoDate(addDays(today, FIRST_PAYMENT_MAX_DAYS))
  const [firstPaymentDate, setFirstPaymentDate] = useState(() =>
    isoDate(addDays(today, FIRST_PAYMENT_DEFAULT_DAYS)),
  )
  const [imei, setImei] = useState("")

  const dateValid = firstPaymentDate >= minDate && firstPaymentDate <= maxDate
  const imeiValid = !ORDER_ITEM.needsMarking || imei.trim().length > 0
  const canSubmit = dateValid && imeiValid

  function handleSubmit() {
    if (!canSubmit) return
    createApplication({
      id: makeApplicationId(),
      // Предоплата есть — заявка создаётся «Новой» (store-new), и следующая
      // фаза холд. Без предоплаты она сразу ушла бы на рассмотрение.
      status: ALIF_PREPAYMENT > 0 ? "NEW" : "REVIEWING",
      createdAt: new Date().toISOString(),
      firstPaymentDate,
      imei: imei.trim() || undefined,
      amount: ORDER.amount,
      commission: plan.commission,
      duration: plan.duration,
    })
  }

  return (
    <div className="px-2 py-4">
      <h2 className="text-xl font-bold text-gray-900">Создание заявки</h2>

      <div className="mt-4">
        <HoldStatusBar />
      </div>

      <div className="mt-4 rounded-lg border p-4">
        <p className="font-medium text-gray-900">{ORDER_ITEM.goodName}</p>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <span className="text-gray-500">Категория</span>
          <span className="text-right font-medium text-gray-900">{ORDER_ITEM.goodTypeName}</span>
          <span className="text-gray-500">Цена</span>
          <span className="text-right font-medium tabular-nums text-gray-900">
            {ORDER_ITEM.price.toLocaleString("ru-RU")} сум
          </span>
          <span className="text-gray-500">ИКПУ</span>
          <span className="text-right font-medium tabular-nums text-gray-900">{ORDER_ITEM.ikpu}</span>
          <span className="text-gray-500">SKU</span>
          <span className="text-right font-medium tabular-nums text-gray-900">{ORDER_ITEM.sku}</span>
        </div>
      </div>

      {ORDER_ITEM.needsMarking && (
        <div className="mt-4">
          <label className="mb-1 block text-sm text-gray-700">IMEI / маркировка</label>
          <Input
            value={imei}
            onChange={(e) => setImei(e.target.value)}
            inputMode="numeric"
            placeholder="Отсканируйте или введите вручную"
          />
        </div>
      )}

      <div className="mt-4">
        <label className="mb-1 block text-sm text-gray-700">Дата первого платежа</label>
        <Input
          type="date"
          className="max-w-[240px]"
          value={firstPaymentDate}
          min={minDate}
          max={maxDate}
          onChange={(e) => setFirstPaymentDate(e.target.value)}
        />
        <p className="mt-1 text-xs text-gray-400">
          Не позднее {FIRST_PAYMENT_MAX_DAYS} дней от сегодняшнего дня
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-gray-50 px-4 py-3 text-sm">
        <span className="text-gray-500">Сумма</span>
        <span className="text-right font-medium tabular-nums text-gray-900">
          {ORDER.amount.toLocaleString("ru-RU")} сум
        </span>
        <span className="text-gray-500">Комиссия</span>
        <span className="text-right font-medium tabular-nums text-gray-900">
          {plan.commission.toLocaleString("ru-RU")} сум
        </span>
        <span className="text-gray-500">Срок</span>
        <span className="text-right font-medium tabular-nums text-gray-900">{plan.duration} мес.</span>
        <span className="text-gray-500">Ежемесячный платёж</span>
        <span className="text-right font-medium tabular-nums text-gray-900">
          {plan.monthlyPayment.toLocaleString("ru-RU")} сум
        </span>
      </div>

      <DialogFooter className="mt-6 w-full">
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="h-11 w-full font-semibold text-black hover:opacity-90 disabled:opacity-50"
          style={{ background: "#FFD60A" }}
        >
          Создать заявку
        </Button>
      </DialogFooter>
    </div>
  )
}
```

- [ ] **Step 2: Проверить сборку**

Запустить: `corepack pnpm build:broker`
Ожидается: сборка проходит.

- [ ] **Step 3: Коммит**

```bash
git add Broker/src/app/components/checkout/ApplicationPhase.tsx
git commit -m "feat(broker): экран создания заявки — товар из 1С, дата первого платежа, итоги"
```

---

### Task 11: Результаты заявки и бизнес-ошибки

**Files:**
- Modify: `Broker/src/app/components/checkout/ApplicationPhase.tsx`
- Modify: `Broker/src/app/components/checkout/DemoScenarioBar.tsx`

**Interfaces:**
- Consumes: `APPLICATION_ERRORS`, `ApplicationErrorKey` из `@/lib/alif-application`; `PhaseError` из `./PhaseError`; `APPLICATION_REVIEW_DELAY_MS` из `@/lib/broker-mock-data`.
- Produces: экспортируемые из `DemoScenarioBar` хелперы `readDemoApplicationOutcome`, `writeDemoApplicationOutcome`, тип `DemoApplicationOutcome`.

- [ ] **Step 1: Добавить исходы заявки в демо-панель**

В `DemoScenarioBar.tsx` добавить рядом с хелперами телефона:

```tsx
export type DemoApplicationOutcome = "approved" | "reviewing" | "rejected" | ApplicationErrorKey

export const DEMO_APPLICATION_OUTCOME_KEY = "broker:demo-application-outcome"

export const DEMO_APPLICATION_OUTCOMES: { id: DemoApplicationOutcome; label: string }[] = [
  { id: "approved", label: "Одобрено сразу" },
  { id: "reviewing", label: "На рассмотрении" },
  { id: "rejected", label: "Отказано" },
  { id: "duplicate_marking", label: "Ошибка: маркировка занята" },
  { id: "has_reviewing", label: "Ошибка: заявка на рассмотрении" },
  { id: "has_new", label: "Ошибка: новая заявка" },
  { id: "amount_too_small", label: "Ошибка: сумма меньше 1000" },
  { id: "scoring_reject", label: "Ошибка: заявка не принята" },
  { id: "amount_too_large", label: "Ошибка: сумма свыше 100 млн" },
]

export function readDemoApplicationOutcome(): DemoApplicationOutcome {
  try {
    return (sessionStorage.getItem(DEMO_APPLICATION_OUTCOME_KEY) as DemoApplicationOutcome) ?? "approved"
  } catch {
    return "approved"
  }
}

export function writeDemoApplicationOutcome(value: DemoApplicationOutcome) {
  try {
    sessionStorage.setItem(DEMO_APPLICATION_OUTCOME_KEY, value)
  } catch {
    // sessionStorage недоступен — остаёмся на значении по умолчанию
  }
}
```

Импортировать `ApplicationErrorKey` из `@/lib/alif-application`. В теле компонента завести `const [outcome, setOutcome] = useState(readDemoApplicationOutcome)` и для `phase === "application"` рендерить не чипы, а `Select` из `@texnomart/ui/select` со списком `DEMO_APPLICATION_OUTCOMES`, который на выбор вызывает `writeDemoApplicationOutcome(id)` и `setOutcome(id)`. Разместить его в том же ряду, перед кнопкой «Сессия истекла».

- [ ] **Step 2: Обработать исход в `ApplicationPhase`**

Добавить локальные состояния и заменить `handleSubmit`:

```tsx
const [submitting, setSubmitting] = useState(false)
const [errorKey, setErrorKey] = useState<ApplicationErrorKey | null>(null)

function handleSubmit() {
  if (!canSubmit || submitting) return
  const outcome = readDemoApplicationOutcome()

  // Бизнес-ошибка приходит вместо заявки: экран остаётся на форме, ошибка
  // показывается плашкой, а поле, к которому она относится, подсвечивается.
  if (outcome !== "approved" && outcome !== "reviewing" && outcome !== "rejected") {
    setErrorKey(outcome)
    return
  }

  setErrorKey(null)
  setSubmitting(true)

  const status =
    outcome === "rejected" ? "REJECTED" : ALIF_PREPAYMENT > 0 ? "NEW" : "REVIEWING"

  createApplication({
    id: makeApplicationId(),
    status,
    createdAt: new Date().toISOString(),
    firstPaymentDate,
    imei: imei.trim() || undefined,
    amount: ORDER.amount,
    commission: plan.commission,
    duration: plan.duration,
  })
}
```

- [ ] **Step 3: Показать плашку ошибки и подсветку поля**

Над `DialogFooter` добавить:

```tsx
{errorKey && <PhaseError message={APPLICATION_ERRORS[errorKey].message} className="mt-4" />}
```

У полей IMEI и суммы включать подсветку по `APPLICATION_ERRORS[errorKey].field`:

```tsx
const errorField = errorKey ? APPLICATION_ERRORS[errorKey].field : undefined
// у Input с IMEI:
aria-invalid={errorField === "marking"}
// у блока итогов:
className={cn(
  "mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg px-4 py-3 text-sm",
  errorField === "amount" ? "bg-red-50 ring-1 ring-red-200" : "bg-gray-50",
)}
```

- [ ] **Step 4: Обработать состояния `REVIEWING` и `REJECTED` после создания**

Заявка уже создана, значит деривация увела фазу с `application` — кроме случая `REJECTED`, при котором двигаться некуда. Добавить в начало компонента, до формы:

```tsx
// Заявка создана и отказана — дальше по ветке идти некуда.
if (state.application?.status === "REJECTED") {
  return (
    <div className="px-2 py-4">
      <h2 className="text-xl font-bold text-gray-900">Заявка отклонена</h2>
      <PhaseError
        className="mt-4"
        message="Alif отказал в рассрочке по этой заявке. Предложите клиенту другой банк или другое условие."
      />
      <DialogFooter className="mt-6 w-full">
        <Button type="button" variant="outline" onClick={cancelOffer} className="h-11 w-full font-semibold">
          Назад к банкам
        </Button>
      </DialogFooter>
    </div>
  )
}
```

Взять `cancelOffer` из контекста. Состояние `REVIEWING` показывается на фазе холда и далее бейджем в шапке — отдельного экрана ему не нужно.

- [ ] **Step 5: Провести заявку через рассмотрение**

`REVIEWING` должен сам смениться на `APPROVED`, иначе бейдж застрянет. Добавить эффект в `AlifCheckoutDialog` (там он один на все фазы и переживает смену фазы):

```tsx
// Мок «заявка на рассмотрении» — через APPLICATION_REVIEW_DELAY_MS она
// возвращается одобренной. Эффект живёт в хосте, а не в фазе: рассмотрение
// продолжается и после того, как деривация увела оператора дальше.
useEffect(() => {
  if (state.application?.status !== "REVIEWING") return
  const t = setTimeout(() => setApplicationStatus("APPROVED"), APPLICATION_REVIEW_DELAY_MS)
  return () => clearTimeout(t)
}, [state.application?.status, setApplicationStatus])
```

Для этого в `AlifCheckoutDialog` добавить `setApplicationStatus` в деструктуризацию `useScoringFlow()` и импортировать `APPLICATION_REVIEW_DELAY_MS` из `@/lib/broker-mock-data`.

- [ ] **Step 6: Проверить сборку**

Запустить: `corepack pnpm build:broker`
Ожидается: сборка проходит.

- [ ] **Step 7: Коммит**

```bash
git add Broker/src/app/components/checkout
git commit -m "feat(broker): результаты заявки и шесть бизнес-ошибок с демо-переключателем"
```

---

## Волна 5 — Сквозное и доводка

### Task 12: Холд — даты удержания и правило отмены

**Files:**
- Modify: `Broker/src/app/components/checkout/HoldPhase.tsx`
- Modify: `Broker/src/app/components/checkout/HoldStatusBar.tsx`

**Interfaces:**
- Consumes: `canCancelHold` из `@/lib/alif-application`; `state.hold`, `state.application` из контекста.
- Produces: изменений в публичных интерфейсах нет.

- [ ] **Step 1: Показать даты удержания в `HoldPhase`**

В ветке `status === "confirmed"`, под зелёной плашкой, добавить:

```tsx
{state.hold && (
  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-gray-50 px-4 py-3 text-sm">
    <span className="text-gray-500">Удержано</span>
    <span className="text-right font-medium tabular-nums text-gray-900">
      {format(new Date(state.hold.at), "dd.MM.yyyy HH:mm", { locale: ru })}
    </span>
    <span className="text-gray-500">Действует до</span>
    <span className="text-right font-medium tabular-nums text-gray-900">
      {format(new Date(state.hold.till), "dd.MM.yyyy HH:mm", { locale: ru })}
    </span>
    <span className="text-gray-500">Карта</span>
    <span className="text-right font-medium tabular-nums text-gray-900">
      {maskCardNumber(state.hold.cardPan)}
    </span>
    <span className="text-gray-500">Сумма</span>
    <span className="text-right font-medium tabular-nums text-gray-900">
      {/* В записи холда сумма лежит в тийинах, как её принимает API; на экран
          она выводится в сумах — §2 ТЗ. */}
      {tiyinToSum(state.hold.amountTiyin).toLocaleString("ru-RU")} сум
    </span>
  </div>
)}
```

Добавить импорты `format` из `date-fns`, `ru` из `date-fns/locale` и `tiyinToSum` из `@/lib/alif-application`.

- [ ] **Step 2: Применить правило отмены в `HoldStatusBar`**

Заменить действие на условное:

```tsx
const status = state.application?.status
const cancellable = status !== undefined && canCancelHold(status)
```

Если `cancellable` — показывать «Отменить холд», как сейчас. Если нет — оставить плашку информационной, без кнопки, и добавить подпись:

```tsx
<span className="text-xs text-gray-500">
  Холд можно отменить, только пока заявка новая. Позже — через отмену заявки.
</span>
```

Двух кнопок отмены на одном экране быть не должно: выход из поздних статусов даёт «Отменить заявку» в шапке попапа.

- [ ] **Step 3: Проверить сборку**

Запустить: `corepack pnpm build:broker`
Ожидается: сборка проходит.

- [ ] **Step 4: Коммит**

```bash
git add Broker/src/app/components/checkout
git commit -m "feat(broker): даты удержания холда и правило «отмена только пока заявка новая»"
```

---

### Task 13: Итог кредита и зафиксированная дата договора

**Files:**
- Modify: `Broker/src/app/components/checkout/CreditOtpPhase.tsx`
- Modify: `Broker/src/app/components/checkout/SuccessPhase.tsx`

**Interfaces:**
- Consumes: `state.contractDate`, `state.application` из контекста; `buildPlans` из `@/lib/alif-application`.
- Produces: изменений в публичных интерфейсах нет.

- [ ] **Step 1: Добавить ежемесячный платёж в сводку OTP**

В таблице сводки `CreditOtpPhase`, после строки «Срок», добавить:

```tsx
<span className="text-gray-500">Ежемесячный платёж</span>
<span className="text-right font-medium tabular-nums text-gray-900">
  {plan.monthlyPayment.toLocaleString("ru-RU")} сум
</span>
```

Заменить CTA `ctaLabel="Завершить"` на `ctaLabel="Оформить кредит"` — формулировка ТЗ.

- [ ] **Step 2: Читать дату договора из состояния**

В `SuccessPhase` заменить

```tsx
const issuedDate = format(new Date(), "dd.MM.yyyy", { locale: ru })
```

на

```tsx
// Дата подписания фиксируется при оформлении (confirmCredit) — считать её
// здесь как new Date() значило бы показывать сегодняшнее число при каждом
// повторном открытии договора.
const issuedDate = state.contractDate
  ? format(new Date(state.contractDate), "dd.MM.yyyy", { locale: ru })
  : ""
```

- [ ] **Step 3: Добавить ежемесячный платёж в сводку успеха**

В компактную строку предложения добавить `· Платёж {plan.monthlyPayment.toLocaleString("ru-RU")} сум/мес.`

- [ ] **Step 4: Проверить сборку**

Запустить: `corepack pnpm build:broker`
Ожидается: сборка проходит.

- [ ] **Step 5: Коммит**

```bash
git add Broker/src/app/components/checkout
git commit -m "fix(broker): дата договора фиксируется при оформлении; ежемесячный платёж в итогах"
```

---

### Task 14: Отмена заявки

**Files:**
- Create: `Broker/src/app/components/checkout/CancelApplicationDialog.tsx`
- Modify: `Broker/src/app/components/checkout/AlifCheckoutDialog.tsx`

**Interfaces:**
- Consumes: `CANCEL_REASONS`, `canCancelApplication` из `@/lib/alif-application`; `cancelApplication` из контекста.
- Produces: `<CancelApplicationDialog open onOpenChange onConfirm />`, где `onConfirm: (reasonKey: string) => void`.

- [ ] **Step 1: Написать диалог**

```tsx
import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@texnomart/ui/alert-dialog"
import { cn } from "@texnomart/ui/utils"
import { CANCEL_REASONS } from "@/lib/alif-application"

export interface CancelApplicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reasonKey: string) => void
}

// Отмена заявки (§4 ТЗ): причина обязательна — API принимает cancel_reason_key,
// поэтому кнопка подтверждения заблокирована, пока причина не выбрана.
export function CancelApplicationDialog({ open, onOpenChange, onConfirm }: CancelApplicationDialogProps) {
  const [reasonKey, setReasonKey] = useState("")

  function handleConfirm() {
    if (!reasonKey) return
    onConfirm(reasonKey)
    setReasonKey("")
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[85dvh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 shrink-0 text-amber-500" />
            Отменить заявку?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Укажите причину отмены. Если предоплата удержана, она будет разблокирована на карте клиента.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1">
          {CANCEL_REASONS.map((reason) => (
            <button
              key={reason.key}
              type="button"
              onClick={() => setReasonKey(reason.key)}
              className={cn(
                "flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                reason.key === reasonKey
                  ? "bg-amber-50 font-medium text-gray-900"
                  : "text-gray-700 hover:bg-gray-50",
              )}
            >
              {reason.label}
            </button>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Не отменять</AlertDialogCancel>
          <AlertDialogAction
            disabled={!reasonKey}
            onClick={handleConfirm}
            className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            Отменить заявку
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 2: Подключить в шапку попапа**

В `AlifCheckoutDialog` завести `const [cancelOpen, setCancelOpen] = useState(false)`, взять `cancelApplication` из контекста и добавить в шапку, справа от бейджа:

```tsx
{state.application && canCancelApplication(state.application.status) && (
  <button
    type="button"
    onClick={() => setCancelOpen(true)}
    className="text-xs font-medium text-red-600 transition-colors hover:text-red-700"
  >
    Отменить заявку
  </button>
)}
```

И рядом с рендером фаз:

```tsx
<CancelApplicationDialog
  open={cancelOpen}
  onOpenChange={setCancelOpen}
  onConfirm={(reasonKey) => {
    cancelApplication(reasonKey)
    toast("Заявка отменена")
  }}
/>
```

Импортировать `toast` из `sonner` и `canCancelApplication` из `@/lib/alif-application`.

- [ ] **Step 3: Показать отменённую заявку**

Отменённая заявка не должна оставлять оператора на фазе холда, где предлагается «удержать заново». Добавить в `AlifCheckoutDialog`, рядом с проверкой `sessionExpired`, ветку:

```tsx
{state.application?.status === "CANCELLED" ? (
  <div className="px-2 py-4">
    <h2 className="text-xl font-bold text-gray-900">Заявка отменена</h2>
    <p className="mt-2 text-sm text-gray-500">
      Предоплата разблокирована. Чтобы оформить рассрочку заново, вернитесь к выбору банка.
    </p>
    <Button type="button" variant="outline" onClick={cancelOffer} className="mt-6 h-11 w-full font-semibold">
      Назад к банкам
    </Button>
  </div>
) : ...}
```

Порядок проверок в шапке рендера: `sessionExpired` → `CANCELLED` → фазы.

- [ ] **Step 4: Проверить сборку**

Запустить: `corepack pnpm build:broker`
Ожидается: сборка проходит.

- [ ] **Step 5: Коммит**

```bash
git add Broker/src/app/components/checkout
git commit -m "feat(broker): отмена заявки с обязательной причиной из девяти вариантов"
```

---

### Task 15: Продажа Alif и отмена продажи

**Files:**
- Modify: `Broker/src/app/components/checkout/SuccessPhase.tsx`

**Interfaces:**
- Consumes: `canSell`, `canUnsell` из `@/lib/alif-application`; `sellApplication`, `unsellApplication` из контекста.
- Produces: изменений в публичных интерфейсах нет.

- [ ] **Step 1: Добавить кнопки продажи**

В блок кнопок `SuccessPhase`, между ссылками на договор и «Завершить скоринг», добавить:

```tsx
{state.application && canSell(state.application.status) && (
  <Button
    type="button"
    variant="outline"
    onClick={() => {
      sellApplication()
      toast.success("Заявка продана Alif")
    }}
    className="h-11 w-full bg-white font-semibold"
  >
    Продать Alif
  </Button>
)}

{state.application && canUnsell(state.application.status) && (
  <Button
    type="button"
    variant="outline"
    onClick={() => {
      unsellApplication()
      toast("Продажа отменена")
    }}
    className="h-11 w-full bg-white font-semibold"
  >
    Отменить продажу
  </Button>
)}
```

Импортировать `toast` из `sonner`.

- [ ] **Step 2: Проверить сборку**

Запустить: `corepack pnpm build:broker`
Ожидается: сборка проходит.

- [ ] **Step 3: Коммит**

```bash
git add Broker/src/app/components/checkout/SuccessPhase.tsx
git commit -m "feat(broker): продажа Alif и отмена продажи на экране успеха"
```

---

### Task 16: Состояния загрузки

**Files:**
- Modify: `Broker/src/app/components/checkout/CardAttachPhase.tsx`
- Modify: `Broker/src/app/components/checkout/ApplicationPhase.tsx`

**Interfaces:**
- Consumes: `CARD_ATTACH_DELAY_MS` из `@/lib/broker-mock-data`.
- Produces: изменений в публичных интерфейсах нет.

§2 ТЗ требует три состояния на каждом экране. «Успех» и «Ошибка» уже есть; здесь добавляется «Загрузка» — ожидание ответа API.

- [ ] **Step 1: Задержка подтверждения привязки карты**

В `CardAttachPhase` завести `const [attaching, setAttaching] = useState(false)` и заменить `handleSuccess`:

```tsx
function handleSuccess() {
  setAttaching(true)
  // Мок ожидания ответа request-attach.
  setTimeout(() => {
    attachAlifCard({ pan: maskPanAlif(card.mask), phone, phoneMatch })
  }, CARD_ATTACH_DELAY_MS)
}
```

Пока `attaching`, вместо `OtpPanel` показывать:

```tsx
<div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
  <Loader2 className="size-4 shrink-0 animate-spin" />
  Привязываем карту…
</div>
```

- [ ] **Step 2: Спиннер на кнопке создания заявки**

В `ApplicationPhase` состояние `submitting` уже заведено задачей 11. Использовать его на кнопке:

```tsx
<Button
  type="button"
  disabled={!canSubmit || submitting}
  onClick={handleSubmit}
  className="h-11 w-full font-semibold text-black hover:opacity-90 disabled:opacity-50"
  style={{ background: "#FFD60A" }}
>
  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
  {submitting ? "Создаём заявку…" : "Создать заявку"}
</Button>
```

- [ ] **Step 3: Проверить сборку**

Запустить: `corepack pnpm build:broker`
Ожидается: сборка проходит.

- [ ] **Step 4: Коммит**

```bash
git add Broker/src/app/components/checkout
git commit -m "feat(broker): состояния ожидания ответа на привязке карты и создании заявки"
```

---

### Task 17: Документация

**Files:**
- Modify: `Broker/CLAUDE.md`
- Modify: `CLAUDE.md`
- Modify: `HISTORY.md`
- Modify: `docs/AI_CONTEXT.md`
- Modify: `tasks/lessons.md`

**Interfaces:**
- Consumes: всё реализованное задачами 1–16.
- Produces: документация, отражающая текущее состояние.

- [ ] **Step 1: Переписать `Broker/CLAUDE.md`**

Удалить раздел «Pending — новое ТЗ по флоу Alif на основе API»: он больше не pending. Обновить: дерево файлов (новые компоненты и `lib/alif-application.ts`), таблицу деривации фаз (семь фаз, новый порядок, обоснование позиции холда), описание экранов 1–8, раздел про демо-аффордансы (добавить `DemoScenarioBar` рядом с чипами MyID), раздел про отмену холда (новое правило и его конфликт с решением 19.08 — с указанием, что победило ТЗ и почему).

- [ ] **Step 2: Обновить строку Broker в таблице проектов корневого `CLAUDE.md`**

Дописать в ячейку статуса третью итерацию: восемь экранов ТЗ по API, модель из семи статусов заявки, отмена заявки и продажа.

- [ ] **Step 3: Добавить запись в `HISTORY.md`**

Новый раздел вверху, `## 2026-08-21 — Client Broker: ветка Alif по ТЗ на основе API (8 экранов)`. Перечислить: новый чистый модуль логики заявки, семь фаз, перенос выбора условия в попап, привязку карты внутри ветки, родственников списком с анкетой, экран создания заявки с шестью бизнес-ошибками, модель статусов, отмену заявки, продажу, истечение сессии, а также исправленный дефект даты договора.

- [ ] **Step 4: Обновить `docs/AI_CONTEXT.md`**

В таблице статусов проектов и в разделе «Next Steps» отразить, что третья итерация Broker закрыта.

- [ ] **Step 5: Добавить уроки в `tasks/lessons.md`**

Новый раздел с датой. Записать то, что выяснилось по ходу — как минимум: конфликт требований между чек-листом PM 19.08 и ТЗ 19.08 по отмене холда и как он разрешён; почему выбор условия нельзя держать в двух местах (повтор урока о локальном стейте как источнике правды); почему демо-аффордансы собраны в одну панель, а не рассыпаны по фазам.

- [ ] **Step 6: Коммит**

```bash
git add Broker/CLAUDE.md CLAUDE.md HISTORY.md docs/AI_CONTEXT.md tasks/lessons.md
git commit -m "docs: третья итерация Broker — ветка Alif по ТЗ на основе API"
```

---

### Task 18: Финальный QA в браузере

**Files:** изменений в коде не предполагается; найденные дефекты чинятся здесь же.

**Interfaces:** нет.

Выполняется **одной сольной задачей**, без параллельных агентов: профиль Playwright лочится между сессиями.

- [ ] **Step 1: Запустить dev-сервер**

Запустить: `corepack pnpm dev:broker`. Запомнить порт.

- [ ] **Step 2: Пройти основной путь**

Верификация → MyID (демо-сценарий «Успех») → «Оформить» у Alif → экран 1 (выбрать план 12 мес.) → экран 2 (код — любой, кроме `000000`) → экран 3 (два родственника, анкета) → экран 4 (IMEI, дата первого платежа) → холд → OTP → успех → договор. Проверить: прогресс «Шаг N из 7» меняется, бейдж статуса идёт `NEW → REVIEWING → APPROVED → ACTIVE`, суммы совпадают между экранами 1, 4, 6 и 7.

- [ ] **Step 3: Проверить отказные и краевые пути**

По одному: отказ скоринга на экране 1; несовпадение телефона на экране 2; три валидации родственников на экране 3 (дубль между собой, совпадение с телефоном клиента, незаполненный номер); все шесть бизнес-ошибок и статус `REJECTED` на экране 4; отмена холда в статусе `NEW`; отмена заявки в `APPROVED`; продажа и отмена продажи на экране успеха; истечение и обновление сессии.

- [ ] **Step 4: Проверить откаты фаз**

Отмена холда с шага OTP должна вернуть на фазу холда, сохранив введённых родственников и заявку. Перезагрузка страницы на каждой фазе должна переоткрывать попап на ней же. Дата договора после перезагрузки не должна меняться.

- [ ] **Step 5: Проверить адаптивность**

Ширины 1440 и 390 px на каждой из семи фаз. Проверить, что список родственников и таблицы итогов не переполняются, цели касания не мельче 44 px.

- [ ] **Step 6: Остановить dev-сервер по PID**

Найти PID: `netstat -ano | findstr :<порт>`, затем `taskkill /PID <pid> /F`. **Не** использовать `taskkill /IM node.exe` — это убьёт все процессы Node на машине, включая чужие серверы.

- [ ] **Step 7: Закоммитить исправления**

Если QA что-то нашёл — починить и закоммитить отдельным коммитом с описанием найденного.

---

## Порядок и зависимости

Задачи 1 → 2 → 3 → 4 строго последовательны: до конца задачи 4 проект не собирается. Дальше 5 перед 6–11 (демо-панель нужна экранам). Задачи 6/7, 8/9, 10/11 внутри своих волн последовательны. Задачи 12–16 независимы друг от друга и могут идти в любом порядке после задачи 11. Задачи 17 и 18 — последние.
