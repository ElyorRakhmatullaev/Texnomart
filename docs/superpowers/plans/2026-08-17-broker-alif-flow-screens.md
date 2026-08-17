# Broker · Сценарий Alif (экраны 3–6) — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Третий саб-проект `Broker/` (операторское приложение скоринга) с работающей веткой Alif: «Выбор рассрочки» с ожиданием лимита → «Привязка карты» (OTP №1) → «Дополнительные данные» → «Подтверждение кредита» (OTP №2) → «Успех» с договором PDF.

**Architecture:** Новый Vite-app `Broker/` по чек-листу «When Adding a New Sub-Project» (без shared `AppShell` — собственный топ-бар `BrokerShell` по Figma). Состояние потока — `ScoringFlowProvider` (React-контекст + `sessionStorage`), мок-callback лимита Alif — таймер ~6 с. Маршруты-шаги под гвардами; степпер расширяется с 5 до 7 шагов при входе в ветку Alif.

**Tech Stack:** React 18 + TypeScript, Vite 6 (esbuild, **без `tsc`**), Tailwind v4, React Router v7, shadcn/ui через `@texnomart/ui` (в т.ч. `input-otp`), sonner, lucide-react.

**Спека:** `docs/superpowers/specs/2026-08-17-broker-alif-flow-screens-design.md`. Figma-референсы: канвас «Client Broker» (`gJWaXJEtxG06aAOhpIa11L`) — фреймы 27/44/45 (Выбор рассрочки + ожидание), 39/40/48 (Доп. данные), 41/42 (финал).

## Global Constraints

- Скоуп: `Broker/**` (новый) + корневые `pnpm-workspace.yaml`, `package.json`, `.github/workflows/deploy.yml`, документация. `Dashboard/`, `Promo/`, `packages/**` **не трогать**.
- Весь UI-текст по-русски; суммы `toLocaleString("ru-RU")` + «сум»; телефоны `+998 XX XXX XX XX`.
- Токены монорепо: primary `#FFD60A` (текст на жёлтом — чёрный), Inter, радиус 10px, тень карточек `0px 2px 4px rgba(204,204,204,0.25)`, фон контента `bg-gray-50`. Точные hex — через `style={{}}`, не `bg-[#...]`.
- Тестового раннера нет. Цикл проверки задачи: `corepack pnpm --filter broker build` → dev-сервер (`corepack pnpm dev:broker`) → проверка в браузере Playwright-инструментами (настоящие клики).
- `pnpm` не в PATH — префикс `corepack`.
- Каждая задача завершается коммитом на `main` (`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`).
- Мобильная адаптация Pattern K: проверять 1440px и 390px.

---

## File Structure

| Файл | Ответственность |
|---|---|
| `Broker/package.json`, `Broker/vite.config.ts`, `Broker/index.html`, `Broker/src/main.tsx`, `Broker/src/styles/*` | Bootstrap приложения (копия паттерна Dashboard) |
| `Broker/src/lib/broker-mock-data.ts` | Клиент, банки, сроки, тексты, константы таймеров, генератор № договора |
| `Broker/src/app/scoring-flow.tsx` | `ScoringFlowProvider` + `useScoringFlow` + sessionStorage-персист |
| `Broker/src/app/routes.tsx` | `createBrowserRouter` + basename + гварды шагов |
| `Broker/src/app/App.tsx` | RouterProvider + провайдеры + Toaster |
| `Broker/src/app/components/shell/BrokerShell.tsx` | Топ-бар + Outlet + правая рейка |
| `Broker/src/app/components/shell/ScoringStepper.tsx` | Степпер 5/7 шагов, compact-режим <md |
| `Broker/src/app/components/shell/ActionRail.tsx` | «Новая вкладка» · «Лимиты в Telegram» · «Завершить скоринг» |
| `Broker/src/app/components/scoring/ClientInfoBand.tsx` | Плашка ФИО/телефон/ПИНФЛ/карта |
| `Broker/src/app/components/scoring/BankCard.tsx` | Карточка банка: pending/ready, чипы сроков, «Оформить» |
| `Broker/src/app/components/scoring/BanksPage.tsx` | Экран 2 «Выбор рассрочки» |
| `Broker/src/app/components/alif/OtpStepCard.tsx` | Общий каркас OTP-экранов (вариант `card` / `credit`) |
| `Broker/src/app/components/alif/CardAttachPage.tsx` | Экран 3 «Привязка карты» |
| `Broker/src/app/components/alif/AdditionalDataPage.tsx` | Экран 4 «Дополнительные данные» |
| `Broker/src/app/components/alif/CreditConfirmPage.tsx` | Экран 5 «Подтверждение кредита» |
| `Broker/src/app/components/alif/SuccessPage.tsx` | Экран 6 «Успех» + скачивание PDF |
| `Broker/public/contract-mock.pdf` | Мок-договор для скачивания |
| `Broker/CLAUDE.md` | Контекст саб-проекта |
| корневые `pnpm-workspace.yaml`, `package.json`, `.github/workflows/deploy.yml`, `CLAUDE.md`, `HISTORY.md`, `docs/AI_CONTEXT.md` | Workspace, скрипты, deploy третьего приложения, документация |

---

## Task 1: Bootstrap саб-проекта `Broker/`

**Files:**
- Create: `Broker/package.json`, `Broker/vite.config.ts`, `Broker/index.html`, `Broker/src/main.tsx`, `Broker/src/app/App.tsx` (заглушка), `Broker/src/styles/{index,tailwind,theme,fonts,globals}.css`
- Modify: `pnpm-workspace.yaml`, корневой `package.json`

**Interfaces:**
- Produces: рабочий `corepack pnpm dev:broker` / `build:broker`; стили и алиасы для всех последующих задач.

- [ ] **Step 1: `Broker/package.json`** — по образцу Dashboard, только нужные зависимости:

```json
{
  "name": "broker",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build" },
  "dependencies": {
    "@texnomart/ui": "workspace:*",
    "@texnomart/shared": "workspace:*",
    "date-fns": "3.6.0",
    "lucide-react": "0.487.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-router": "7.13.0",
    "sonner": "2.0.3",
    "tw-animate-css": "1.3.8"
  },
  "devDependencies": {
    "@tailwindcss/vite": "4.1.12",
    "@vitejs/plugin-react": "4.7.0",
    "tailwindcss": "4.1.12",
    "vite": "6.3.5"
  }
}
```

- [ ] **Step 2: `Broker/vite.config.ts`** — копия Dashboard-конфига без `figmaAssetResolver`:

```ts
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Set by the GitHub Pages deploy workflow (e.g. '/Texnomart/broker/').
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@texnomart/ui': path.resolve(__dirname, '../packages/ui/src'),
      '@texnomart/shared': path.resolve(__dirname, '../packages/shared/src'),
    },
  },
})
```

- [ ] **Step 3: `Broker/index.html`** — как у Dashboard (включая SPA-restore сниппет из `sessionStorage.spaRedirect`), `<title>Texnomart Broker</title>`, `lang="ru"`.

- [ ] **Step 4: Стили** — скопировать `Dashboard/src/styles/{index,tailwind,theme,fonts,globals}.css` как есть (те же токены и `@source` на оба пакета). `main.tsx` — как у Dashboard (`createRoot` + `./styles/index.css`). Временный `App.tsx`: `export default function App() { return <div className="p-8">Broker bootstrap OK</div> }`.

- [ ] **Step 5: Workspace + скрипты** — `pnpm-workspace.yaml`: `packages` += `'Broker'`. Корневой `package.json`: `"dev:broker": "pnpm --filter broker dev"`, `"build:broker": "pnpm --filter broker build"` (общий `build` = `pnpm -r build` подхватит автоматически).

- [ ] **Step 6: Проверка** — `corepack pnpm install` → `corepack pnpm build:broker`: Expected: сборка зелёная. `corepack pnpm dev:broker` → страница «Broker bootstrap OK».

- [ ] **Step 7: Commit** — `chore(broker): bootstrap третьего саб-проекта Broker (workspace, vite, styles)`

---

## Task 2: Мок-данные, `ScoringFlowProvider`, маршруты с гвардами

**Files:**
- Create: `Broker/src/lib/broker-mock-data.ts`, `Broker/src/app/scoring-flow.tsx`, `Broker/src/app/routes.tsx`
- Modify: `Broker/src/app/App.tsx`

**Interfaces:**
- Produces: `useScoringFlow()` → `{ state, selectAlif, attachCard, saveAdditionalData, confirmCredit, resetFlow }`; `BROKER_CLIENT`, `BANKS`, `ALIF_LIMIT_DELAY_MS = 6000`, `OTP_RESEND_SECONDS = 60`, `makeContractNo()`; маршруты `/scoring/banks`, `/scoring/alif/{card,details,confirm,success}`.

- [ ] **Step 1: `broker-mock-data.ts`**

```ts
export interface BrokerClient { name: string; phone: string; pinfl: string; cardMask: string }
export const BROKER_CLIENT: BrokerClient = {
  name: "Артем Борисов", phone: "+998 94 983 98 48",
  pinfl: "2116358415458", cardMask: "4860 **** **** 1251",
}

export interface Bank {
  id: "alif" | "iman"
  title: string
  brandColor: string            // фон логотипа-заглушки
  initial: string               // буква в логотипе
  tenors: number[]              // мес.
  defaultTenor: number
  limit: number                 // сум
  prepayment: number
  instantLimit: boolean         // false = лимит приходит «через callback»
}
export const BANKS: Bank[] = [
  { id: "alif", title: "Alif Nasiya", brandColor: "#16A34A", initial: "A",
    tenors: [2, 3, 6, 9, 12, 18, 24, 36], defaultTenor: 6,
    limit: 8_546_000, prepayment: 0, instantLimit: false },
  { id: "iman", title: "Iman Invest", brandColor: "#0D9488", initial: "I",
    tenors: [6, 12, 24], defaultTenor: 6,
    limit: 6_120_000, prepayment: 0, instantLimit: true },
]

export const ORDER = { amount: 10_000_000, tenor: 6 }
export const ALIF_LIMIT_DELAY_MS = 6000   // мок callback+polling из MD
export const OTP_RESEND_SECONDS = 60
export const OTP_FAIL_CODE = "000000"     // демо неверного кода
export const ONE_C_ORDER_NO = "235662235" // как в Figma

export const RELATION_KINDS = ["Брат", "Сестра", "Отец", "Мать", "Супруг(а)", "Коллега", "Другое"]

export function makeContractNo(): string {
  // ALF-2026-XXXXXX — псевдослучайный, стабильный в рамках сессии не требуется
  return `ALF-2026-${String(Math.floor(100000 + Math.random() * 900000))}`
}
```

- [ ] **Step 2: `scoring-flow.tsx`** — контекст + sessionStorage:

```tsx
export interface AdditionalData {
  trustee1: { phone: string; relation: string }
  trustee2?: { phone: string; relation: string }
  debitDate: string // "YYYY-MM-DD"
}
export interface ScoringFlowState {
  alifLimitStatus: "pending" | "ready"
  alifSelected: boolean
  cardAttached: boolean
  additionalData?: AdditionalData
  creditConfirmed: boolean
  contractNo?: string
  oneCOrderNo?: string
}
const STORAGE_KEY = "broker:scoring-flow"
const INITIAL: ScoringFlowState = {
  alifLimitStatus: "pending", alifSelected: false,
  cardAttached: false, creditConfirmed: false,
}
```

Провайдер: `useState(INITIAL)` с ленивым чтением из sessionStorage (try/catch → INITIAL); `useEffect` пишет каждое изменение. Экшены (все — `useCallback`, мутации через функциональный `setState`):
- `markAlifLimitReady()` — `alifLimitStatus: "ready"` (вызывает таймер на BanksPage; если уже `ready` после перезагрузки — таймер не нужен);
- `selectAlif()` — `alifSelected: true`;
- `attachCard()` — `cardAttached: true`;
- `saveAdditionalData(d: AdditionalData)`;
- `confirmCredit()` — `creditConfirmed: true, contractNo: makeContractNo(), oneCOrderNo: ONE_C_ORDER_NO` (если `contractNo` ещё нет);
- `resetFlow()` — sessionStorage.removeItem + `setState(INITIAL)`.

- [ ] **Step 3: `routes.tsx`** — по паттерну Dashboard (basename из `BASE_URL`):

```tsx
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/"

function RequireAlif({ stage }: { stage: "card" | "details" | "confirm" | "success" }) {
  const { state } = useScoringFlow()
  const ok =
    stage === "card"    ? state.alifSelected :
    stage === "details" ? state.alifSelected && state.cardAttached :
    stage === "confirm" ? state.alifSelected && state.cardAttached && !!state.additionalData :
                          state.creditConfirmed
  return ok ? <Outlet /> : <Navigate to="/scoring/banks" replace />
}

export const router = createBrowserRouter([
  {
    element: <BrokerShell />,   // топ-бар + степпер + Outlet (Task 3)
    children: [
      { path: "/", element: <Navigate to="/scoring/banks" replace /> },
      { path: "/scoring/banks", element: <BanksPage /> },
      { element: <RequireAlif stage="card" />,    children: [{ path: "/scoring/alif/card",    element: <CardAttachPage /> }] },
      { element: <RequireAlif stage="details" />, children: [{ path: "/scoring/alif/details", element: <AdditionalDataPage /> }] },
      { element: <RequireAlif stage="confirm" />, children: [{ path: "/scoring/alif/confirm", element: <CreditConfirmPage /> }] },
      { element: <RequireAlif stage="success" />, children: [{ path: "/scoring/alif/success", element: <SuccessPage /> }] },
      { path: "*", element: <Navigate to="/scoring/banks" replace /> },
    ],
  },
], { basename })
```

До Task 3 `BrokerShell` — временный `<Outlet />`-каркас, страницы — заглушки `<div>` с названием экрана (чтобы билд был зелёным и гварды кликались).

- [ ] **Step 4: `App.tsx`** — `<ScoringFlowProvider><RouterProvider router={router} /><Toaster position="top-right" richColors closeButton /></ScoringFlowProvider>`.

- [ ] **Step 5: Проверка** — build зелёный; в браузере: `/` → `/scoring/banks`; прямой заход `/scoring/alif/confirm` → redirect на `/scoring/banks`.

- [ ] **Step 6: Commit** — `feat(broker): мок-данные, ScoringFlowProvider (sessionStorage) и маршруты ветки Alif с гвардами`

---

## Task 3: `BrokerShell`, `ScoringStepper`, `ClientInfoBand`, `ActionRail`

**Files:**
- Create: `Broker/src/app/components/shell/BrokerShell.tsx`, `.../shell/ScoringStepper.tsx`, `.../shell/ActionRail.tsx`, `.../scoring/ClientInfoBand.tsx`

**Interfaces:**
- Consumes: `useScoringFlow`, `BROKER_CLIENT`.
- Produces: `<BrokerShell />` (layout-маршрут: хедер + степпер + серый фон + `<Outlet />` + `<ActionRail />`); `<ScoringStepper />` (сам вычисляет шаги из состояния потока + `useLocation`); `<ClientInfoBand />`.

- [ ] **Step 1: `BrokerShell`** — хедер 64px, белый, `border-b`: слева кнопка-логотип (жёлтый скруглённый квадрат 32px, чёрный астериск `*`) + «Ташкент, Янги Шахар, 16а» (text-sm); центр (скрыт <md): «Подбор товара» (text-gray-500, клик → toast «Раздел вне прототипа») и «Скоринг» (font-semibold); справа «RU | UZ» (RU полужирный, UZ приглушён, display-only) + серый круглый аватар «М» + «Мирхомитов Миржалол» (две строки, text-xs, скрыто <md). Ниже — белая полоса степпера (`border-b`), затем `<main className="bg-gray-50 min-h-[calc(100vh-128px)]"><Outlet /></main>`.

- [ ] **Step 2: `ScoringStepper`** — модель шагов:

```tsx
const BASE_STEPS = ["Верификация клиента", "Проверка MyID", "Выбор рассрочки", "Дополнительные данные", "Информация по рассрочке"]
const ALIF_STEPS = ["Верификация клиента", "Проверка MyID", "Выбор рассрочки", "Привязка карты", "Дополнительные данные", "Подтверждение кредита", "Информация по рассрочке"]
// activeIndex из location.pathname:
//  /scoring/banks → 2; /alif/card → 3; /alif/details → 4; /alif/confirm → 5; /alif/success → 6
```

Ветка Alif (`state.alifSelected`) → `ALIF_STEPS`, иначе `BASE_STEPS` (актив — «Выбор рассрочки», шаги 0–1 всегда finished). Рендер ≥md: горизонтальный ряд — подпись (актив: жёлтый текст `#B45309`-читаемость не нужна, как в Figma: жёлтая подпись `text-[#F59E0B]`-стиль заменяем на токен primary с чёрным текстом? — **по Figma**: активная подпись жёлтая `#FFB800`-подобная; используем `style={{color:'#EAB308'}}`, finished/default — `text-gray-400`) над точкой-индикатором (finished: жёлтая залитая, active: жёлтое кольцо, default: серое кольцо) и соединительными линиями (пройденные — жёлтые, будущие — серые). Рендер <md: строка «Шаг {n} из {steps.length} · {label}» + тонкий `Progress`.

- [ ] **Step 3: `ClientInfoBand`** — белая карточка (радиус 10px, тень токена): 4 колонки ≥md (label text-xs text-gray-500 / value text-sm font-medium): ФИО · Номер телефона · ПИНФЛ · Карта; <md — 2×2.

- [ ] **Step 4: `ActionRail`** — фиксированная колонка справа (`hidden lg:flex flex-col gap-3`, absolute у правого края контейнера): круглые белые кнопки 40px с иконками `SquarePlus`, `Send`, `X` + подпись text-[10px] text-gray-500 под каждой («Новая вкладка», «Отправить лимиты в Telegram», «Завершить скоринг»). Первые две → toast «Действие вне прототипа». «Завершить скоринг» → `AlertDialog` («Завершить скоринг?» / «Текущая сессия будет сброшена.» / «Отмена» + красная «Завершить») → `resetFlow()` + navigate `/scoring/banks`.

- [ ] **Step 5: Проверка** — build; в браузере: шапка/степпер соответствуют Figma-референсу (фрейм 27), на 390px степпер компактный, рейка скрыта.

- [ ] **Step 6: Commit** — `feat(broker): оболочка BrokerShell, степпер 5/7 шагов, плашка клиента, правая рейка`

---

## Task 4: Экран 2 «Выбор рассрочки» — карточки банков + ожидание лимита Alif

**Files:**
- Create: `Broker/src/app/components/scoring/BankCard.tsx`, `.../scoring/BanksPage.tsx` (заменить заглушку)

**Interfaces:**
- Consumes: `BANKS`, `ORDER`, `ALIF_LIMIT_DELAY_MS`, `useScoringFlow`.
- Produces: переход `navigate("/scoring/alif/card")` после `selectAlif()`.

- [ ] **Step 1: `BankCard`** — props `{ bank: Bank; pending: boolean; onCheckout: () => void }`:
  - Хедер: логотип (скруглённый квадрат 32px `style={{background: bank.brandColor}}`, белая буква) + название (font-semibold) + бейдж: pending → янтарный soft-tint «Рассчитывается…», иначе зелёный soft-tint «✓ Одобрена».
  - Чипы сроков: серый трек `bg-gray-100 rounded-lg p-1`, выбранный — белая «таблетка» с тенью (`useState` c `bank.defaultTenor`).
  - Панель лимита: рамка `border` жёлтая (`style={{borderColor:'#FFD60A'}}`), строки «Доступный лимит» → `bank.limit.toLocaleString("ru-RU") + " сум"` (font-semibold, tabular-nums), «Срок» → `0-0-{tenor}` (красный акцент, как в Figma), «Предоплата» → `0`.
  - `pending` — вместо панели: 3 строки `Skeleton` + строка со спиннером (`Loader2 animate-spin`) «Ваш запрос отправлен, сейчас проходит оценка, ожидается ответ» (text-sm text-gray-500); кнопка `disabled` «Загрузка».
  - CTA: жёлтая «Оформить» (`style={{background:'#FFD60A', color:'#000'}}`, h-11, font-semibold) → `onCheckout()`.

- [ ] **Step 2: `BanksPage`** — контейнер `max-w-[880px] mx-auto px-4 py-6 space-y-4`: `<ClientInfoBand />`, сетка `grid gap-4 md:grid-cols-2`: Alif (pending = `state.alifLimitStatus === "pending"`) + Iman (pending=false). Таймер мок-callback:

```tsx
useEffect(() => {
  if (state.alifLimitStatus !== "pending") return
  const t = setTimeout(markAlifLimitReady, ALIF_LIMIT_DELAY_MS)
  return () => clearTimeout(t)
}, [state.alifLimitStatus])
```

Переход pending→ready анимировать `tw-animate-css` (fade-in панели). `onCheckout`: alif → `selectAlif(); navigate("/scoring/alif/card")`; iman → `toast.info("В прототипе реализован сценарий Alif")`. Под сеткой — плоская плашка `bg-gray-100 rounded-xl` по центру: «Запрос лимита у партнеров ▾» (display-only, text-[#2563EB]-подобный синий из Figma — `text-blue-600`).

- [ ] **Step 3: Проверка** — в браузере: при загрузке Alif в ожидании (скелетон + спиннер + disabled «Загрузка»), через ~6 с — лимит 8 546 000 сум и активная «Оформить»; Iman готов сразу; «Оформить» Iman → toast; «Оформить» Alif → `/scoring/alif/card` (пока заглушка), степпер стал 7-шаговым с активной «Привязкой карты». Перезагрузка после ready — ожидание не повторяется. 390px: колонки в стек.

- [ ] **Step 4: Commit** — `feat(broker): экран «Выбор рассрочки» — карточки банков, мок-callback лимита Alif с ожиданием`

---

## Task 5: `OtpStepCard` + Экран 3 «Привязка карты» (OTP №1)

**Files:**
- Create: `Broker/src/app/components/alif/OtpStepCard.tsx`, `.../alif/CardAttachPage.tsx` (заменить заглушку)

**Interfaces:**
- Consumes: `useScoringFlow`, `OTP_RESEND_SECONDS`, `OTP_FAIL_CODE`, `BROKER_CLIENT`, `InputOTP` из `@texnomart/ui/input-otp`.
- Produces: `OtpStepCard` props: `{ variant: "card" | "credit"; title: string; subtitle: ReactNode; ctaLabel: string; onSuccess: () => void; onBack: () => void; children?: ReactNode /* доп. контент над полем: сводка/callout */; completedNote?: string /* режим «уже пройдено» */ }`.

- [ ] **Step 1: `OtpStepCard`** — белая карточка `max-w-[560px] mx-auto`:
  - Чип этапа: variant `card` → серый soft-tint (`bg-gray-100 text-gray-700`) + `CreditCard` 16px + «Код 1 из 2 · Привязка карты»; variant `credit` → зелёный soft-tint (`bg-emerald-50 text-emerald-700`) + `FileSignature` + «Код 2 из 2 · Подтверждение кредита».
  - H2 (text-xl font-bold) `title`, подзаголовок text-sm text-gray-500 (`subtitle`), затем `children`.
  - `InputOTP maxLength={6}` (6 слотов, разделитель после 3), автофокус.
  - Ошибка: локальный `useState<string | null>`; при ошибке — красная рамка слотов (`aria-invalid` + класс) и text-sm text-red-600 «Неверный код. Проверьте SMS и попробуйте ещё раз», ввод очищается.
  - Resend: `useState(OTP_RESEND_SECONDS)` + interval; «Отправить код повторно через 0:59» (text-gray-400) → по нулю активная ссылка-кнопка «Отправить код повторно» → toast «Код отправлен повторно» + перезапуск.
  - CTA (жёлтая, h-11, disabled пока < 6 цифр): `code === OTP_FAIL_CODE` → ошибка, иначе `onSuccess()`.
  - Под CTA — текстовая кнопка «Вернуться к предыдущему шагу» → `onBack()`.
  - `completedNote` задан → вместо ввода: зелёная строка `CheckCircle2` + note, CTA «Продолжить» → `onSuccess()`, resend скрыт.

- [ ] **Step 2: `CardAttachPage`**

```tsx
const { state, attachCard } = useScoringFlow()
<OtpStepCard
  variant="card"
  title="Привязка карты"
  subtitle={<>Мы отправили SMS с кодом на номер, привязанный к карте <b>{BROKER_CLIENT.cardMask}</b></>}
  ctaLabel="Подтвердить"
  completedNote={state.cardAttached ? "Карта привязана" : undefined}
  onSuccess={() => { attachCard(); toast.success("Карта привязана"); navigate("/scoring/alif/details") }}
  onBack={() => navigate("/scoring/banks")}
/>
```

- [ ] **Step 3: Проверка** — в браузере: чип «Код 1 из 2», ввод `123456` → toast + переход на details (заглушка); возврат назад на card → режим «Карта привязана ✓» без повторного ввода; `000000` (в новой сессии) → ошибка + очистка; resend-отсчёт тикает, по нулю ссылка активна. 390px — карточка во всю ширину.

- [ ] **Step 4: Commit** — `feat(broker): каркас OTP-шага и экран «Привязка карты» (код 1 из 2)`

---

## Task 6: Экран 4 «Дополнительные данные»

**Files:**
- Create: `Broker/src/app/components/alif/AdditionalDataPage.tsx` (заменить заглушку)

**Interfaces:**
- Consumes: `useScoringFlow` (`saveAdditionalData`, `state.additionalData`), `RELATION_KINDS`, `Select`/`Input` из `@texnomart/ui`.
- Produces: `AdditionalData` в состоянии потока (формат из Task 2).

- [ ] **Step 1: Разметка по Figma (фрейм 48)** — карточка `max-w-[720px]`: caption «Log Id: 123456» (text-xs text-gray-400), H2 «Дополнительные данные», подзаголовок «Укажите контакты близких — это увеличивает шанс одобрения». Grid `md:grid-cols-2 gap-6`: колонка «Доверительное лицо — 1» (h3 font-semibold): Input «Номер телефона» (placeholder `+998 __ ___ __ __`, маска: только цифры, автоформат `+998 XX XXX XX XX`) + Select «Вид родства» (`RELATION_KINDS`); колонка «Доверительное лицо — 2» — то же, оба поля необязательны. Ниже h3 «Дата списания оплаты» + `<Input type="date">` (умолчание: то же число следующего месяца, `date-fns addMonths(new Date(), 1)` → `format(..., "yyyy-MM-dd")`). Контролируемые `useState`, инициализация из `state.additionalData` (возврат назад сохраняет введённое).

- [ ] **Step 2: Валидация + сабмит** — «Продолжить» (жёлтая) активна когда телефон №1 полный (9 цифр после +998) и родство №1 выбрано; лицо №2 валидируется только если начали заполнять (телефон полный и родство выбраны — иначе inline-подсказка text-red-600 «Заполните оба поля или очистите»). Сабмит → `saveAdditionalData({...})` → navigate `/scoring/alif/confirm`. «Вернуться к предыдущему шагу» → `/scoring/alif/card`.

- [ ] **Step 3: Проверка** — заполнение №1 активирует кнопку; переход на confirm; назад → значения на месте; 390px — колонки в стек.

- [ ] **Step 4: Commit** — `feat(broker): экран «Дополнительные данные» (доверительные лица + дата списания)`

---

## Task 7: Экран 5 «Подтверждение кредита» (OTP №2)

**Files:**
- Create: `Broker/src/app/components/alif/CreditConfirmPage.tsx` (заменить заглушку)

**Interfaces:**
- Consumes: `OtpStepCard` (variant `credit`), `useScoringFlow` (`confirmCredit`), `BANKS`, `ORDER`.
- Produces: `state.creditConfirmed = true`, `contractNo`, `oneCOrderNo` → `SuccessPage`.

- [ ] **Step 1: Страница**

```tsx
const alif = BANKS.find(b => b.id === "alif")!
<OtpStepCard
  variant="credit"
  title="Подтверждение кредита"
  subtitle={<>Мы отправили <b>новый код</b> для подтверждения оформления кредита</>}
  ctaLabel="Завершить"
  onSuccess={() => { confirmCredit(); navigate("/scoring/alif/success") }}
  onBack={() => navigate("/scoring/alif/details")}
>
  {/* сводка кредита — только на этом шаге */}
  <div className="rounded-lg border bg-gray-50 px-4 py-3 grid grid-cols-2 gap-2 text-sm">
    …Банк: Alif Nasiya · Сумма: {ORDER.amount.toLocaleString("ru-RU")} сум ·
    Срок: {ORDER.tenor} мес. · Доступный лимит: {alif.limit.toLocaleString("ru-RU")} сум…
  </div>
  {/* callout-различитель шагов */}
  <div className="rounded-lg bg-amber-50 text-amber-800 px-4 py-3 text-sm flex gap-2">
    <Info className="size-4 shrink-0 mt-0.5" />
    Это другой код — не тот, что вы вводили при привязке карты. Введите код из последнего SMS.
  </div>
</OtpStepCard>
```

Если `state.creditConfirmed` (вернулись назад после подтверждения) — `completedNote="Кредит подтверждён"`, CTA «Продолжить» → success.

- [ ] **Step 2: Проверка** — рядом (в двух вкладках/скриншотах) экраны 3 и 5 визуально различимы: чип 1/2 серый + карта vs 2/2 зелёный + подпись договора, сводка и амбер-callout только на 5-м; степпер подсвечивает разные шаги. Ввод кода → success.

- [ ] **Step 3: Commit** — `feat(broker): экран «Подтверждение кредита» (код 2 из 2, визуально отличённый шаг)`

---

## Task 8: Экран 6 «Успех» + мок-PDF

**Files:**
- Create: `Broker/src/app/components/alif/SuccessPage.tsx` (заменить заглушку), `Broker/public/contract-mock.pdf`
- Modify: `Broker/src/app/components/shell/ScoringStepper.tsx` (шаг 7 активен на success — уже покрыто моделью Task 3; проверить)

**Interfaces:**
- Consumes: `useScoringFlow` (`state.contractNo`, `state.oneCOrderNo`, `resetFlow`), `BANKS`.
- Produces: финал ветки; сброс потока.

- [ ] **Step 1: `contract-mock.pdf`** — сгенерировать одностраничный PDF скриптом на лету (питон-скрипт в scratchpad, минимальный валидный PDF с текстом «TEXNOMART — Договор рассрочки Alif Nasiya (демо)») и положить в `Broker/public/`. Проверить, что файл открывается.

- [ ] **Step 2: `SuccessPage`** — заголовок H2 «Информация по рассрочке» над двухколоночной сеткой `md:grid-cols-2 gap-4 max-w-[880px]`:
  - Левая карточка: хедер (логотип Alif + «Alif Nasiya» + зелёный бейдж «Оформлена»), чип срока «{ORDER.tenor} мес.» (белая таблетка на сером треке), панель лимита (как в `BankCard`), строка `FileText` «Договор № {state.contractNo}» + «от {format(new Date(), "dd.MM.yyyy", { locale: ru })}».
  - Правая панель: `bg-emerald-50 border border-emerald-200 rounded-xl`, по центру: круг 44px `bg-white` с зелёной `Check`, текст: «Кредит оформлен! Договор №{contractNo} подписан.» + «Заявка №{oneCOrderNo} в базе 1С Texnomart создана автоматически — продолжайте оформление продажи в ней.» Кнопки в столбик: outline «Скачать договор (PDF)» (`<a href={import.meta.env.BASE_URL + "contract-mock.pdf"} download={"Договор_" + contractNo + ".pdf"}>` + `Download`), зелёная «Завершить скоринг» (`bg-emerald-500 hover:bg-emerald-600 text-white`) → `resetFlow()` + navigate `/scoring/banks`.

- [ ] **Step 3: Проверка** — полный сквозной проход banks → card → details → confirm → success: договор с номером, PDF скачивается с правильным именем, «Завершить скоринг» сбрасывает поток (Alif снова в ожидании лимита); перезагрузка на success сохраняет экран; прямой заход на success в чистой сессии → redirect. 390px — колонки в стек.

- [ ] **Step 4: Commit** — `feat(broker): экран «Успех» — договор №, скачивание PDF, завершение скоринга`

---

## Task 9: Deploy третьим приложением + документация

**Files:**
- Modify: `.github/workflows/deploy.yml`, корневой `CLAUDE.md`, `HISTORY.md`, `docs/AI_CONTEXT.md`
- Create: `Broker/CLAUDE.md`

**Interfaces:**
- Produces: `https://elyorrakhmatullaev.github.io/Texnomart/broker/`.

- [ ] **Step 1: `deploy.yml`** — добавить шаг сборки и копирования по образцу Promo:

```yaml
      - name: Build Broker
        run: pnpm build:broker
        env:
          BASE_PATH: /Texnomart/broker/
```

В «Assemble site»: `mkdir -p _site/dashboard _site/promo _site/broker` + `cp -r Broker/dist/. _site/broker/`; в 404.html условие `if (app === "dashboard" || app === "promo" || app === "broker")`. Обновить шапку-комментарий workflow (три URL).

- [ ] **Step 2: `Broker/CLAUDE.md`** — краткий контекст: назначение (операторское приложение скоринга, ветка Alif), маршруты, файловая структура, мок-конвенции (`000000` — ошибка OTP, 6 с — ожидание лимита, sessionStorage `broker:scoring-flow`), допущение о составе формы доп. данных («уточнить у бекенда» — взято из Figma), ссылка на спеку и Figma.

- [ ] **Step 3: Корневые доки** — `CLAUDE.md`: строка Broker в таблице Projects + команды `dev:broker`/`build:broker` + третий URL в Deployment; `docs/AI_CONTEXT.md` и `HISTORY.md` — краткая запись о новом саб-проекте.

- [ ] **Step 4: Проверка** — `corepack pnpm build` (все три) зелёный; локально `BASE_PATH=/Texnomart/broker/ corepack pnpm build:broker` собирается с правильным base (проверить `dist/index.html` пути ассетов).

- [ ] **Step 5: Commit** — `chore(broker): деплой третьим приложением на Pages + документация` (push → проверить Actions).

---

## Task 10: Сквозной QA + фиксация результата

**Files:**
- Modify: по результатам QA (точечные правки)

- [ ] **Step 1: Матрица QA (Playwright, настоящие клики)** —
  1. 1440px: полный happy-path banks→success (вкл. ожидание лимита ~6 с, оба OTP, PDF);
  2. ошибка `000000` на обоих OTP-экранах + resend-отсчёт;
  3. перезагрузка страницы на details → состояние восстановлено, гварды не выбивают;
  4. прямые заходы `/scoring/alif/{card,details,confirm,success}` в чистой сессии → redirect на banks;
  5. браузерный back: success → confirm показывает «Кредит подтверждён» (completed-режим), details ← card показывает «Карта привязана»;
  6. 390px: все 5 экранов — стек, степпер компактный, тач-таргеты ≥44px;
  7. Iman «Оформить» → toast; «Завершить скоринг» из рейки → AlertDialog → сброс.
- [ ] **Step 2: Найденные дефекты** — чинить по superpowers:systematic-debugging, каждый фикс — отдельный мини-коммит.
- [ ] **Step 3: Финальный build** — `corepack pnpm build` зелёный; итоговый коммит-доки при необходимости.

---

## Self-Review (выполнен)

- **Покрытие спеки:** §2.1 bootstrap → T1; §2.2 shell/рейка → T3; §2.3 маршруты/гварды → T2; §2.4 состояние/persist → T2; §3.0 степпер 5/7 → T3; §3.1 экран 2 + ожидание → T4; §3.2 экран 3 → T5; §3.3 экран 4 → T6; §3.4 экран 5 → T7; §3.5 экран 6 + PDF → T8; §3.6 краевые случаи → гварды T2 + completed-режимы T5/T7 + QA T10; deploy/доки (§2.1) → T9; §5 проверка → T10.
- **Типы/имена сквозные:** `useScoringFlow`, `ScoringFlowState`, `AdditionalData`, `OtpStepCard` props, константы мок-данных — согласованы между T2 и T5–T8.
- **Placeholder-скан:** кодовые блоки конкретны; JSX-описания дают точные тексты, классы и токены; «…» в T7-сводке — перечисленные там же 4 строки данных.
