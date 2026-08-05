# Промо Волна 6 — «Распределение по КМ / дням / категориям»: план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Дать КД возможность необязательно распределить промо по КМ, дням и категориям во вкладке «План акций», сохранить это, показать в блоке краткого календаря и привлечь внимание КМ индикатором.

**Architecture:** Новый `lib/distribution-store.ts` (localStorage) + чистая `applyDistribution(campaigns)`, применяемая на посеве в `ShortCalendarPage`; форма — Dialog, хостится в `PlanMode`; индикатор — на переключателе блока в `CalendarFilters`. Модель `CategoryDistributionEntry` не меняется, поэтому блок, фильтры и экспорт продолжают работать без правок.

**Tech Stack:** React 18 + TypeScript, Vite 6 (esbuild, **без `tsc`**), Tailwind v4, shadcn/ui через `@texnomart/ui`, localStorage-сторы.

**Спека:** `docs/superpowers/specs/2026-08-05-promo-category-distribution-design.md` (коммит `6ef5043`).

## Global Constraints

- Скоуп — только `Promo/src/**`; `packages/**` и `Dashboard/` не трогать.
- Весь UI-текст по-русски; даты через `RuDate`/`date-fns` с локалью `ru`.
- Тестового раннера нет. Цикл проверки: `corepack pnpm --filter promo build` → открыть экран на dev-сервере → **настоящие клики** (`browser_click`; Radix отсеивает `element.click()`).
- Контролируемый Dialog, открываемый обычной кнопкой, — только через `setTimeout(…, 0)`.
- Radix-меню под shared `<Button>` рендерится за экраном — использовать обычные кнопки или нативный `<button>` + `buttonVariants`.
- Каждая задача завершается коммитом на `main`.

---

## File Structure

| Файл | Ответственность |
|---|---|
| `Promo/src/lib/distribution-store.ts` (**создать**) | Хранение распределения по акциям + чистое слияние с сидом. |
| `Promo/src/app/components/short-calendar/CategoryDistributionDialog.tsx` (**создать**) | Форма распределения (даты из периода · категория с подсказками · ответственный КМ). |
| `Promo/src/app/components/short-calendar/PlanApprovalTable.tsx` | Кнопка «Распределить» в колонке действий. |
| `Promo/src/app/components/short-calendar/PlanMode.tsx` | Хост диалога, гейт `canDistribute`, сохранение + аудит. |
| `Promo/src/app/components/short-calendar/ShortCalendarPage.tsx` | Посев кампаний через `applyDistribution`, ре-деривация после сохранения. |
| `Promo/src/app/components/short-calendar/CalendarFilters.tsx` | Индикатор для КМ на переключателе блока. |

---

## Task 1: Стор распределения и слияние на посеве

**Files:**
- Create: `Promo/src/lib/distribution-store.ts`
- Modify: `Promo/src/app/components/short-calendar/ShortCalendarPage.tsx`

**Interfaces:**
- Consumes: `CategoryDistributionEntry`, `PromoCampaign` из `promo-mock-data`.
- Produces: `getDistributionFor`, `setDistributionFor`, `clearDistributionFor`, `hasStoredDistribution`, `applyDistribution`.

- [ ] **Step 1: Создать стор**

```ts
import type { CategoryDistributionEntry, PromoCampaign } from "./promo-mock-data";

const STORAGE_KEY = "promo:category-distribution";

/** Сериализуемый вид: Date → «YYYY-MM-DD». */
interface StoredEntry { date: string; category: string; responsibleKmId: string; }

function read(): Record<string, StoredEntry[]> { /* try/catch → {} */ }
function write(map: Record<string, StoredEntry[]>): void { /* localStorage */ }

/** «YYYY-MM-DD» → локальная полночь (без UTC-сдвига). */
function parseDateOnly(iso: string): Date;
/** Date → «YYYY-MM-DD» по локальному календарю. */
function toDateOnly(d: Date): string;

export function getDistributionFor(campaignId: string): CategoryDistributionEntry[] | undefined;
export function setDistributionFor(campaignId: string, entries: CategoryDistributionEntry[]): void;
/** Удаляет ключ → акция возвращается к сиду. */
export function clearDistributionFor(campaignId: string): void;
export function hasStoredDistribution(campaignId: string): boolean;

/** Сохранённое перекрывает сид ЦЕЛИКОМ (запись по акции — полный список, не патч). */
export function applyDistribution(campaigns: PromoCampaign[]): PromoCampaign[];
```

- [ ] **Step 2: Посев в `ShortCalendarPage`**

`PLANNED` остаётся модульной константой (сид), но страница читает живой набор:

```tsx
const [distTick, setDistTick] = React.useState(0);
const planned = React.useMemo(() => applyDistribution(PLANNED), [distTick]);
```

Все потребители внутри страницы (`filtered`, `CalendarFilters campaigns`, таблица, экспорт) переводятся с `PLANNED` на `planned`. `distTick` бампится из колбэка, который получит `PlanMode` в Task 2.

- [ ] **Step 3: Сборка + проверка деривации**

Run: `corepack pnpm --filter promo build` → зелёная.

В `browser_evaluate` на dev-сервере:

```js
const st = await import('/src/lib/distribution-store.ts');
const md = await import('/src/lib/promo-mock-data.ts');
const seeded = md.CAMPAIGNS.find(c => (c.categoryDistribution ?? []).length > 0);
st.setDistributionFor(seeded.id, [{ date: seeded.startDate, category: 'QA-категория', responsibleKmId: 'km-1' }]);
const merged = st.applyDistribution(md.CAMPAIGNS);
const after = merged.find(c => c.id === seeded.id).categoryDistribution;
st.clearDistributionFor(seeded.id);
const restored = st.applyDistribution(md.CAMPAIGNS).find(c => c.id === seeded.id).categoryDistribution;
return { overridden: after.length === 1 && after[0].category === 'QA-категория',
         dateIsDate: after[0].date instanceof Date,
         restoredToSeed: restored.length === seeded.categoryDistribution.length };
```

Expected: `overridden` true, `dateIsDate` true, `restoredToSeed` true.

- [ ] **Step 4: Коммит**

```bash
git add Promo/src/lib/distribution-store.ts Promo/src/app/components/short-calendar/ShortCalendarPage.tsx
git commit -m "feat(promo): Волна 6 T1 — стор распределения по категориям + слияние с сидом"
```

---

## Task 2: Действие КД, форма и сохранение

**Files:**
- Create: `Promo/src/app/components/short-calendar/CategoryDistributionDialog.tsx`
- Modify: `Promo/src/app/components/short-calendar/PlanApprovalTable.tsx`, `PlanMode.tsx`, `ShortCalendarPage.tsx`

**Interfaces:**
- Consumes: стор из Task 1; `CATEGORY_MANAGERS`, `NOMENCLATURE` (подсказки категорий); `canActAsKd`.
- Produces: проп `onDistribute?: (id: string) => void` + `canDistribute?: (id: string) => boolean` у `PlanApprovalTable`; компонент диалога.

- [ ] **Step 1: Диалог**

Компонент `CategoryDistributionDialog` с пропсами `{ open, onOpenChange, campaign, initial, onSave, onClear }`:
- строки состояния `RowDraft = { date: string; category: string; responsibleKmId: string }`;
- даты периода — `eachDayOfInterval({ start: campaign.startDate, end: campaign.endDate })`, подпись `format(d, "EEEEEE · dd.MM.yyyy", { locale: ru })`;
- категория — `<Input list="...">` + `<datalist>` из `CATEGORY_MANAGERS.map(k => k.category)` и категорий номенклатуры (уникальные, отсортированные);
- КМ — `Select` по `CATEGORY_MANAGERS`;
- валидация: все поля заполнены; пара «дата + категория» уникальна; иначе «Сохранить» disabled + текст ошибки;
- «Очистить распределение» — только когда строки есть.

- [ ] **Step 2: Кнопка в таблице**

`PlanApprovalTable`: колонка «Действия» 240 → 300px, кнопка «Распределить» (иконка `Users`) рядом с «История», видна при `canDistribute?.(id)`. Аффорданс и поведение вводятся одной задачей.

- [ ] **Step 3: Проводка в `PlanMode`**

```tsx
const canDistribute = React.useCallback((id: string) => {
  const isKd = currentRole === "Коммерческий директор" || canActAsKd(currentUser);
  return isKd && sendStatusOf(id) !== "draft";
}, [currentRole, currentUser, /* … */]);

const openDistribute = (id: string) => setTimeout(() => setDistributeId(id), 0);
```

Сохранение: `setDistributionFor(id, entries)` → `appendAuditEvent({ action: "изменение", objectType: "план", …, changes: [{ field: "Распределение по категориям", before: `${prev} позиц.`, after: `${next} позиц.` }] })` → `onDistributionSaved?.()` (бампит `distTick` на странице) → toast.

- [ ] **Step 4: Сборка + проверка настоящими кликами**

Run: `corepack pnpm --filter promo build` → зелёная.

Под ролью «Коммерческий директор» на вкладке «План акций»: кнопка есть на отправленной строке и отсутствует на черновике; клик открывает диалог (**и он не закрывается сам**); добавить строку, выбрать дату/категорию/КМ, сохранить; вернуться на «Промо-календарь», развернуть блок — запись видна; перезагрузить страницу — запись на месте; «Очистить распределение» → блок возвращается к сиду.

- [ ] **Step 5: Коммит**

```bash
git add Promo/src/app/components/short-calendar/CategoryDistributionDialog.tsx Promo/src/app/components/short-calendar/PlanApprovalTable.tsx Promo/src/app/components/short-calendar/PlanMode.tsx Promo/src/app/components/short-calendar/ShortCalendarPage.tsx
git commit -m "feat(promo): Волна 6 T2 — распределение промо по КМ/дням/категориям действием КД"
```

---

## Task 3: Индикатор для КМ

**Files:**
- Modify: `Promo/src/app/components/short-calendar/CalendarFilters.tsx`

- [ ] **Step 1: Индикатор**

Рядом с текстом кнопки-переключателя блока — зелёный кружок с `motion-safe:animate-pulse`, когда `!distExpanded && isKm && campaigns.some(c => (c.categoryDistribution ?? []).length > 0)`. Роль берётся через `useRole()` внутри компонента (проп не заводим — компонент уже читает контексты проекта). `title` — «По акциям есть распределение по категориям».

- [ ] **Step 2: Сборка + проверка кликами**

Под ролью КМ: индикатор виден при свёрнутом блоке; клик по кнопке разворачивает блок и индикатор исчезает. Под ролью КД индикатора нет.

- [ ] **Step 3: Коммит**

```bash
git add Promo/src/app/components/short-calendar/CalendarFilters.tsx
git commit -m "feat(promo): Волна 6 T3 — индикатор распределения для КМ на свёрнутом блоке"
```

---

## Task 4: Финальная проверка и документация

- [ ] **Step 1: Оба билда**

```bash
corepack pnpm --filter promo build
corepack pnpm --filter dashboard build
```

- [ ] **Step 2: QA-матрица**

1440 и 390 px, светлая и тёмная тема: диалог, блок распределения, индикатор; перезагрузка страницы сохраняет распределение; событие видно в `/audit` («Все действия» под Администратором); CSV-экспорт краткого календаря содержит введённое распределение.

- [ ] **Step 3: Документация**

`Promo/CLAUDE.md`, `docs/AI_CONTEXT.md`, `HISTORY.md`, `docs/promo_feedback_tracker.md` (строки 73–74 → закрыты), `tasks/lessons.md`.

- [ ] **Step 4: Коммит**

```bash
git add -A && git commit -m "docs(promo): Волна 6 — документация и уроки"
```

---

## Проверка плана против спеки

| Требование спеки | Задача |
|---|---|
| G1 действие КД | T2 |
| G2 форма | T2 |
| G3 хранение | T1 |
| G4 индикатор | T3 |
| G5 данные в блоке | T1 (слияние) + T2 (сохранение) |
| §2.5 аудит | T2 |
| §5 критерии готовности | T4 |
