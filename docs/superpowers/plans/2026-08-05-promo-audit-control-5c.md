# «Аудит-лог и контроль сроков» (Волна 5, блок 5C) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Закрыть 20 гапов клиентского блока 5C на экране `/audit` — прежде всего ограничить видимость аудита по матрице прав для всех 9 ролей, а также довести фильтры, деривацию сроков и показатели участников до формулировок трекера.

**Architecture:** Скоуп прав живёт в одном новом чистом модуле `lib/audit-access.ts` и применяется ко всем четырём вкладкам ДО пользовательских фильтров — так вкладки не могут разъехаться (дефект E-3). Деривация контрольных точек остаётся единственным источником для таблиц, рейтинга и экспорта: правки вносятся в `lib/audit-control.ts`, а вкладки только рендерят.

**Tech Stack:** React 18 + TypeScript, Vite 6, Tailwind v4, shadcn/ui (`@texnomart/ui`), date-fns (`ru`), SheetJS (`xlsx`), Playwright MCP для QA.

## Global Constraints

- **Тестов в репозитории нет и мы их не заводим.** Цикл задачи: правка → `corepack pnpm --filter promo build` → **проверка в браузере настоящими кликами** (Playwright MCP, `browser_click`, а не `element.click()`) → коммит. Ищущий `pytest`/`vitest` не найдёт ничего — это ожидаемо.
- **Сборка транспайл-онли** (esbuild, `tsc` в проекте нет): несовпадение типов, неисчерпывающий `switch` и импорт несуществующего экспорта сборку НЕ роняют. После каждой задачи открывать затронутую вкладку в браузере.
- **`pnpm` не на PATH** — только `corepack pnpm --filter promo build` (корневой `build:promo` вызывает вложенный голый `pnpm` и падает).
- **Promo-local.** `packages/shared`, `packages/ui`, `Dashboard/` не трогать. В конце — `corepack pnpm --filter dashboard build` для доказательства отсутствия регресса.
- **Русский UI**, `toLocaleString("ru-RU")` + `tabular-nums` для чисел, даты через существующий `<RuDate>`.
- **Тёмная тема обязательна:** каждый новый цвет — парой `светлый dark:тёмный`, как в соседних строках файла.
- **Radix-триггеры:** под `asChild` использовать нативный `<button className={cn(buttonVariants({...}))}>`, а НЕ shared `<Button>` (не forwardRef → меню уезжает за экран). Контролируемый `Dialog`/`Sheet`, открываемый обычной кнопкой, открывать через `setTimeout(..., 0)`.
- **Единицы срока:** дедлайны плана — календарные дни, SLA согласования — рабочие. Подпись единицы выводится из данных, а не хардкодится.
- Коммиты — по одной задаче, сообщение вида `feat(promo): Волна 5 (5C-T<N>) — <суть>`, в конце строка `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`. Работаем прямо в `main`.

---

## File Structure

| Файл | Ответственность |
|---|---|
| `Promo/src/lib/audit-access.ts` | **Создать.** Модель `AuditScope`, `auditScopeFor(role, user)`, `checkpointObjectType(point)`, `scopeControlPoints`, `scopeAuditEvents`. Чистый, без React. |
| `Promo/src/lib/audit-control.ts` | Деривация `ControlPoint[]`: период плана диапазоном, `unit`, результат «Просрочено», текст автопередачи, новая точка «Повторная отправка после корректировки», фильтры/метрики вкладки 3. |
| `Promo/src/lib/promo-mock-data.ts` | 4 новых `AuditActionType` + `AUDIT_ACTION_META` + сиды событий; сид повторной отправки. |
| `Promo/src/app/components/audit/AuditPage.tsx` | Считает `scope`, раздаёт его вкладкам; подпись «Период дедлайна». |
| `.../ControlDeadlinesFilters.tsx` | `ControlFilters`: `promo` → `promoIds`, `planPeriod`, `promoPeriodFrom/To`; `PromoNoFilter`. |
| `.../ControlDeadlinesTable.tsx` | Период плана диапазоном, подпись единицы просрочки, нижний скролл. |
| `.../PlanDeadlinesTab.tsx`, `.../PromoDeadlinesTab.tsx` | Применение скоупа, плашка «в рамках ваших прав», экспорт. |
| `.../ParticipantMetricsTab.tsx` | 4 фильтра, «Нет данных», drill-down по числовым ячейкам. |
| `.../ParticipantTasksDrawer.tsx` | Заголовок с показателем и количеством, фильтрация по показателю. |
| `.../AuditLogTable.tsx`, `.../AuditLogFilters.tsx` | Скоуп событий, состав «Ключевых действий». |

---

### Task 1: Скоуп доступа по матрице прав (все 4 вкладки)

**Files:**
- Create: `Promo/src/lib/audit-access.ts`
- Modify: `Promo/src/app/components/audit/AuditPage.tsx:35-47` (вычисление `access` → `scope`), `:100-111` (передача во вкладки)
- Modify: `Promo/src/app/components/audit/PlanDeadlinesTab.tsx:36-52`, `PromoDeadlinesTab.tsx:40-52`, `ParticipantMetricsTab.tsx:26-36`, `AuditLogTable.tsx:136-159`

**Interfaces:**
- Consumes: `ControlPoint` из `lib/audit-control`, `AuditEvent`/`AuditObjectType`/`CATEGORY_MANAGERS`/`OWN_AUDIT_KM_ID` из `lib/promo-mock-data`, `getActiveSubstitution`/`canActAsKd` из `lib/kd-substitution-store`, `useCurrentUser()`.
- Produces: `AuditScope`, `auditScopeFor(role, currentUserId?): AuditScope`, `checkpointObjectType(p: ControlPoint): AuditObjectType`, `scopeControlPoints(points: ControlPoint[], scope: AuditScope): ControlPoint[]`, `scopeAuditEvents(events: AuditEvent[], scope: AuditScope): AuditEvent[]`.

- [ ] **Step 1: Создать `Promo/src/lib/audit-access.ts`**

```ts
import type { PromoRole } from "../app/role-context";
import {
  CATEGORY_MANAGERS,
  OWN_AUDIT_KM_ID,
  getCategoryManager,
  type AuditEvent,
  type AuditObjectType,
} from "./promo-mock-data";
import type { ControlPoint } from "./audit-control";
import { getActiveSubstitution } from "./kd-substitution-store";

/** Область видимости аудита для роли (5C, вкладка 4, п. 7). */
export interface AuditScope {
  /** Подпись для плашки «Показаны записи в рамках ваших прав: …». */
  label: string;
  /** Доступные типы объектов; "all" — без ограничения. */
  objectTypes: AuditObjectType[] | "all";
  /** Ограничение по КМ (ФИО); "all" — без ограничения. */
  kmNames: string[] | "all";
}

const PROMO_OBJECTS: AuditObjectType[] = ["акция", "строка", "отчёт", "план"];

/** Все не-старшие КМ — в моке они и есть «закреплённые» за единственным старшим КМ. */
function subordinateKmNames(): string[] {
  return CATEGORY_MANAGERS.filter((m) => !m.senior).map((m) => m.name);
}

export function auditScopeFor(role: PromoRole, currentUserId?: string): AuditScope {
  // Активное уполномоченное лицо КД получает скоуп КД (E-4).
  const sub = getActiveSubstitution();
  const actsAsKd =
    role === "Коммерческий директор" ||
    (!!sub && !!currentUserId && sub.userId === currentUserId);

  if (role === "Администратор") {
    return { label: "полный аудит", objectTypes: "all", kmNames: "all" };
  }
  if (actsAsKd) {
    return {
      label: "аудит по коммерческому направлению (без действий над учётными записями)",
      objectTypes: PROMO_OBJECTS,
      kmNames: "all",
    };
  }
  if (role === "Старший КМ") {
    return {
      label: "промо закреплённых категорийных менеджеров",
      objectTypes: PROMO_OBJECTS,
      kmNames: subordinateKmNames(),
    };
  }
  if (role === "Категорийный менеджер (КМ)") {
    const own = getCategoryManager(OWN_AUDIT_KM_ID)?.name;
    return {
      label: "только ваши промо",
      objectTypes: PROMO_OBJECTS,
      kmNames: own ? [own] : [],
    };
  }
  if (role === "Директор маркетинга") {
    return { label: "план акций и отчёты", objectTypes: ["план", "отчёт"], kmNames: "all" };
  }
  if (role === "Операционный директор") {
    return { label: "согласование плана и сроки", objectTypes: ["план"], kmNames: "all" };
  }
  // Сотрудник маркетинга / закупа / аналитики
  return { label: "отчёты смежным отделам", objectTypes: ["отчёт"], kmNames: "all" };
}

const KM_ROLE: PromoRole = "Категорийный менеджер (КМ)";

/** Тип объекта контрольной точки — у ControlPoint своего поля нет. */
export function checkpointObjectType(p: ControlPoint): AuditObjectType {
  if (p.scope === "plan") return "план";
  if (p.checkpoint.startsWith("Отправка первичного отчёта")) return "отчёт";
  if (p.checkpoint.startsWith("Новая версия отчёта")) return "отчёт";
  return "акция";
}

function objectAllowed(scope: AuditScope, t: AuditObjectType): boolean {
  return scope.objectTypes === "all" || scope.objectTypes.includes(t);
}

export function scopeControlPoints(points: ControlPoint[], scope: AuditScope): ControlPoint[] {
  return points.filter((p) => {
    if (!objectAllowed(scope, checkpointObjectType(p))) return false;
    if (scope.kmNames !== "all" && p.responsibleRole === KM_ROLE) {
      return scope.kmNames.includes(p.responsibleName);
    }
    return true;
  });
}

export function scopeAuditEvents(events: AuditEvent[], scope: AuditScope): AuditEvent[] {
  return events.filter((e) => {
    if (!objectAllowed(scope, e.objectType)) return false;
    if (scope.kmNames !== "all" && e.role === KM_ROLE) {
      return scope.kmNames.includes(e.user);
    }
    return true;
  });
}
```

- [ ] **Step 2: Прокинуть скоуп в `AuditPage`**

В `AuditPage.tsx` рядом с `access` добавить (импорт `useCurrentUser` из `../../current-user-context`, `auditScopeFor` из `../../../lib/audit-access`):

```tsx
const { user } = useCurrentUser();
const scope = React.useMemo(
  () => auditScopeFor(currentRole, user?.id),
  [currentRole, user?.id]
);
```

Расширить `AuditAccess` полем `scope: AuditScope` и класть его в тот же `useMemo`, что уже строит `access` — чтобы вкладки получали ОДИН объект и не могли разойтись.

- [ ] **Step 3: Применить скоуп на всех четырёх вкладках**

В `PlanDeadlinesTab` и `PromoDeadlinesTab` заменить существующую `scoped`-логику (там сейчас ручной `isKm`-фильтр) на общий вызов:

```tsx
const scoped = React.useMemo(
  () => scopeControlPoints(all, access.scope),
  [all, access.scope]
);
```

В `AuditLogTable` в `scopedEvents` убрать ручную ветку `if (isKm) {…}` и оставить:

```tsx
const scopedEvents = React.useMemo(() => {
  const byScope = scopeAuditEvents(events, access.scope);
  return byScope.filter((e) => (isAdmin && showAll) || !NON_KEY_ACTIONS.has(e.action));
}, [events, isAdmin, showAll, access.scope]);
```

В `ParticipantMetricsTab` пробросить скоуп в расчёт (полная переработка фильтров — Task 6; здесь достаточно сузить исходный набор точек тем же `scopeControlPoints`).

**Важно:** списки значений фильтров (`users`, `roles`, `responsibles`, `checkpoints`) уже строятся из `scopedEvents`/`scoped` — проверить, что это так и осталось, иначе роль увидит чужие ФИО в выпадающем списке.

- [ ] **Step 4: Плашка вместо пустого состояния**

Там, где вкладка отдаёт пустой набор из-за скоупа, показывать поясняющую плашку вместо «Нет записей по выбранным фильтрам»:

```tsx
{scoped.length === 0 && (
  <div className="rounded-lg border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-16 text-center text-sm text-muted-foreground">
    Показаны записи в рамках ваших прав: {access.scope.label}. По этой вкладке доступных записей нет.
  </div>
)}
```

Удалить прежний КМ-специфичный текст в `PlanDeadlinesTab.tsx:46-52` — он стал частным случаем.

- [ ] **Step 5: Сборка**

Run: `corepack pnpm --filter promo build`
Expected: exit 0.

- [ ] **Step 6: Проверка в браузере — матрица ролей**

`corepack pnpm --filter promo dev`, залогиниться, пройти god-mode переключателем по ролям **Администратор → Коммерческий директор → Старший КМ → КМ → Директор маркетинга → Операционный директор → Сотрудник маркетинга** и на КАЖДОЙ открыть все 4 вкладки. Записать количество строк по каждой паре (роль × вкладка).
Expected: Администратор ≥ КД > Старший КМ > КМ; маркетинг/закуп/аналитика видят только отчётные записи; ни у одной роли, кроме Администратора, во вкладке «Аудит-лог» нет записей с объектом «пользователь».

- [ ] **Step 7: Проверка, что фильтрами скоуп не обойти**

Под ролью КМ во вкладке «Аудит-лог» открыть фильтр «Пользователь» и «Роль».
Expected: в списках только собственное ФИО и роль КМ — чужих значений нет; выбор любого значения не увеличивает число записей.

- [ ] **Step 8: Коммит**

```bash
git add Promo/src/lib/audit-access.ts Promo/src/app/components/audit/
git commit -m "feat(promo): Волна 5 (5C-T1) — доступ к аудиту по матрице прав на всех вкладках"
```

---

### Task 2: «Период плана» диапазоном + фильтр по плановому периоду

**Files:**
- Modify: `Promo/src/lib/audit-control.ts:39` (тип `planPeriod`), `:51-55` (`planPeriodLabel`), `:77-83` (`base`)
- Modify: `Promo/src/app/components/audit/ControlDeadlinesTable.tsx:50,70`
- Modify: `Promo/src/app/components/audit/ControlDeadlinesFilters.tsx` (новое поле фильтра)
- Modify: `Promo/src/app/components/audit/PlanDeadlinesTab.tsx:20-31` (экспорт)

**Interfaces:**
- Consumes: `ControlPoint` (Task 1 его не менял).
- Produces: `ControlPoint.planPeriod?: { start: Date; end: Date; label: string }` — `label` остаётся «Ноябрь 2026» и используется как группировка/подпись; `ControlFilters.planPeriod: string` (значение = `label`, `"all"` = все).

- [ ] **Step 1: Заменить месяц на диапазон в деривации**

В `audit-control.ts` заменить `planPeriodLabel` на:

```ts
/** Плановый период = календарный месяц старта акции: границы + подпись-группировка. */
function planPeriodOf(d: Date): { start: Date; end: Date; label: string } {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const m = format(d, "LLLL yyyy", { locale: ru });
  return { start, end, label: m.charAt(0).toUpperCase() + m.slice(1) };
}
```

В `ControlPoint` изменить поле на `planPeriod?: { start: Date; end: Date; label: string }`,
в `base` (строка ~82) — `planPeriod: planPeriodOf(c.startDate)`.

- [ ] **Step 2: Отрендерить диапазон в таблице**

В `ControlDeadlinesTable.tsx` расширить колонку (`w-[130px]` → `w-[190px]`) и заменить ячейку:

```tsx
<td className={cn(td, "whitespace-nowrap font-medium text-gray-900 dark:text-gray-100")}>
  {p.planPeriod && (
    <>
      <span className="tabular-nums">
        <RuDate value={p.planPeriod.start} /> — <RuDate value={p.planPeriod.end} />
      </span>
      <span className="block text-[11px] font-normal text-gray-400 dark:text-gray-500">
        {p.planPeriod.label}
      </span>
    </>
  )}
</td>
```

Мобильную карточку (`ControlDeadlinesTable.tsx:108`) поправить аналогично: `p.planPeriod?.label` → диапазон.

- [ ] **Step 3: Фильтр «Период плана» (только вкладка 1)**

В `ControlFilters` добавить `planPeriod: string` (по умолчанию `"all"`), учесть в `EMPTY_CONTROL_FILTERS`, `countActiveControlFilters` и `applyControlFilters`:

```ts
if (f.planPeriod !== "all" && p.planPeriod?.label !== f.planPeriod) return false;
```

В `Fields` добавить `Select`, отрисовываемый только когда передан проп `planPeriods` (вкладка 2 его не передаёт):

```tsx
{planPeriods && planPeriods.length > 0 && (
  <Select value={values.planPeriod} onValueChange={(v) => onChange({ planPeriod: v })}>
    <SelectTrigger className="h-9 w-full sm:w-52 bg-white dark:bg-card text-sm">
      <SelectValue placeholder="Период плана" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Все периоды плана</SelectItem>
      {planPeriods.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
    </SelectContent>
  </Select>
)}
```

Список строить в `ControlDeadlinesFilters` из `points`: `Array.from(new Set(points.map((p) => p.planPeriod?.label).filter(Boolean)))`.

- [ ] **Step 4: Экспорт**

В `PlanDeadlinesTab.tsx` `PLAN_EXPORT_HEADER` первую колонку разбить на две — `"Период плана (начало)"`, `"Период плана (окончание)"` — и в `planExportRows` отдавать `fmtAuditDate(p.planPeriod.start)` / `fmtAuditDate(p.planPeriod.end)`.

- [ ] **Step 5: Сборка + браузер**

Run: `corepack pnpm --filter promo build`, затем открыть вкладку «Сроки по плану».
Expected: в колонке «Период плана» — «01.11.2026 — 30.11.2026» и серым «Ноябрь 2026»; фильтр «Период плана» сужает список; счётчик «Показано: N» уменьшается. Выгрузить `.xlsx` и убедиться, что там две колонки периода.

- [ ] **Step 6: Коммит**

```bash
git add Promo/src/lib/audit-control.ts Promo/src/app/components/audit/
git commit -m "feat(promo): Волна 5 (5C-T2) — период плана диапазоном дат + фильтр по плановому периоду"
```

---

### Task 3: «Период дедлайна», № промо мультиселектом, «Период акции»

**Files:**
- Modify: `Promo/src/app/components/audit/AuditPage.tsx:66-97`
- Modify: `Promo/src/app/components/audit/ControlDeadlinesFilters.tsx:14-100`
- Modify: `Promo/src/app/components/audit/PromoDeadlinesTab.tsx`

**Interfaces:**
- Consumes: `PromoNoFilter`, `PromoNoOption` из `../short-calendar/PromoNoFilter`; `formatPromoNo` из `lib/promo-mock-data`.
- Produces: `ControlFilters.promoIds: string[]` (вместо `promo: string`), `ControlFilters.promoFrom: string`, `ControlFilters.promoTo: string` (ISO `yyyy-mm-dd`, период проведения акции).

- [ ] **Step 1: Подписать фильтр дат «Период дедлайна»**

В `AuditPage.tsx` обернуть пару `input[type=date]` в блок с видимой подписью:

```tsx
<div className="flex flex-col gap-1.5">
  <span className="text-xs font-medium text-muted-foreground">Период дедлайна</span>
  <div className="flex items-center gap-2">
    {/* существующие два input[type=date] без изменений */}
  </div>
</div>
```

Роль-селект и «Сбросить фильтры» оставить как есть.

- [ ] **Step 2: № промо — мультиселект вместо подстроки**

В `ControlFilters` заменить `promo: string` на `promoIds: string[]` (`[]` = все). В `applyControlFilters`:

```ts
if (f.promoIds.length > 0 && !f.promoIds.includes(p.campaignId)) return false;
```

`countActiveControlFilters`: `if (f.promoIds.length) n++;`.

В `Fields` вместо `<Input placeholder="№ промо или название">`:

```tsx
<PromoNoFilter
  options={promoOptions}
  selected={values.promoIds}
  onChange={(ids) => onChange({ promoIds: ids })}
  width="w-[240px]"
/>
```

`promoOptions` собирать в `ControlDeadlinesFilters` из `points` — по одному варианту на кампанию, подпись «26-5» + название:

```tsx
const promoOptions: PromoNoOption[] = React.useMemo(() => {
  const map = new Map<string, PromoNoOption>();
  for (const p of points) {
    if (!map.has(p.campaignId)) {
      map.set(p.campaignId, { id: p.campaignId, no: p.promoNo, name: p.promoName });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.no.localeCompare(b.no, "ru"));
}, [points]);
```

`p.promoNo` уже формат «26-N» (`formatPromoNo` применён в деривации) — **значением остаётся `campaignId`**, форматируется только подпись.

- [ ] **Step 3: Фильтр «Период акции» (только вкладка 2)**

Добавить в `ControlFilters` поля `promoFrom`/`promoTo` и в `applyControlFilters`:

```ts
if (f.promoFrom && p.promoPeriod && p.promoPeriod.end < new Date(`${f.promoFrom}T00:00:00`)) return false;
if (f.promoTo && p.promoPeriod && p.promoPeriod.start > new Date(`${f.promoTo}T23:59:59`)) return false;
```

(Пересечение диапазонов, а не вхождение — акция попадает в выборку, если её период пересекается с выбранным.)

Контрол рисовать только при `showPromoPeriod` (проп, передаёт `PromoDeadlinesTab`), с подписью «Период акции», по образцу блока «Период дедлайна» из шага 1.

- [ ] **Step 4: Сборка + браузер**

Run: `corepack pnpm --filter promo build`, открыть обе вкладки сроков.
Expected: подпись «Период дедлайна» видна; «№ промо» — поповер с чекбоксами «26-N · Название», выбор двух промо сужает таблицу и счётчик; на вкладке 2 появился «Период акции», на вкладке 1 его нет; «Очистить» сбрасывает всё.

- [ ] **Step 5: Коммит**

```bash
git add Promo/src/app/components/audit/
git commit -m "feat(promo): Волна 5 (5C-T3) — «Период дедлайна», № промо мультиселектом, фильтр периода акции"
```

---

### Task 4: Результат «Просрочено», текст автопередачи, единицы срока

**Files:**
- Modify: `Promo/src/lib/audit-control.ts:30` (тип), `:57-69` (`resolve`), `:225-232` (комментарий автопередачи), `:33-49` (`ControlPoint.unit`)
- Modify: `Promo/src/app/components/audit/ControlDeadlinesTable.tsx:90,112`
- Modify: `Promo/src/app/components/audit/ParticipantTasksDrawer.tsx:32`

**Interfaces:**
- Produces: `ControlPoint.unit: "cal" | "work"`; хелпер `export function overdueLabel(p: Pick<ControlPoint,"overdueDays"|"unit">): string` → `«+3 раб. дн.»` / `«+4 кал. дн.»`.

- [ ] **Step 1: «Ожидается» → «Просрочено» при пройденном дедлайне**

В `audit-control.ts` заменить тело `resolve`:

```ts
function resolve(
  deadline: Date,
  actualAt: Date | undefined,
  ref: Date
): { result: ControlResult; overdueDays: number } {
  if (!actualAt) {
    const overdueDays = getOverdueDays(deadline, ref);
    // 5C §2.5: дедлайн прошёл, а факта нет — это «Просрочено», а не «Ожидается».
    return { result: overdueDays > 0 ? "Просрочено" : "Ожидается", overdueDays };
  }
  const overdueDays = getOverdueDays(deadline, actualAt);
  return { result: overdueDays > 0 ? "Просрочено" : "В срок", overdueDays };
}
```

Проверить обе прямые ветки, которые считают результат в обход `resolve` (строки ~197-205 и ~243-250) — они уже дают «Просрочено» при `overdueDays > 0`, менять не нужно.

- [ ] **Step 2: Текст автопередачи**

В блоке `if (senior) {…}` заменить комментарий точки `«Авто-передача КД …»`:

```ts
comment: `Старший КМ: ${seniorName} — просрочил срок согласования, промо автоматически передано КД (КМ: ${km?.name ?? "—"}).`,
```

- [ ] **Step 3: Единица срока в данных**

В `ControlPoint` добавить `unit: "cal" | "work"`. Проставить: план-точки «Ознакомление плана» и «Отправка плана на согласование» — `"cal"`; «Согласование КД (план)» / «Согласование ОД (план)» — `"work"`; «Отправка данных КМ» и обе отчётные точки — `"cal"`; «Решение старшего КМ» / «Решение КД» / «Авто-передача КД» — `"work"`; информационные точки (возврат, повторная отправка, доведение до КМ) — `"cal"`.

Добавить экспортируемый хелпер:

```ts
export function overdueLabel(p: { overdueDays: number; unit: "cal" | "work" }): string {
  if (p.overdueDays <= 0) return "—";
  return `+${p.overdueDays} ${p.unit === "work" ? "раб." : "кал."} дн.`;
}
```

- [ ] **Step 4: Подписи в UI**

В `ControlDeadlinesTable.tsx` (десктоп ~строка 90 и мобильная карточка ~112) и в `ParticipantTasksDrawer.tsx` (~32) заменить хардкод `+${…} дн.` на `overdueLabel(p)` / `overdueLabel(t)`. В `ParticipantTask` добавить `unit` и пробрасывать его в `buildParticipantTasks`.

- [ ] **Step 5: Сборка + браузер**

Run: `corepack pnpm --filter promo build`, открыть вкладку «Сроки по промо и отчётам».
Expected: нет ни одной строки с «Ожидается» и «+N дн.» одновременно; в строке «Авто-передача КД» комментарий начинается со «Старший КМ:»; просрочка подписана единицей («раб.»/«кал.»).

- [ ] **Step 6: Коммит**

```bash
git add Promo/src/lib/audit-control.ts Promo/src/app/components/audit/
git commit -m "fix(promo): Волна 5 (5C-T4) — «Просрочено» при пройденном дедлайне, текст автопередачи, единицы срока"
```

---

### Task 5: Контрольная точка «Повторная отправка после корректировки»

**Files:**
- Modify: `Promo/src/lib/audit-control.ts:280-290` (рядом с «Возврат на корректировку»)
- Modify: `Promo/src/lib/promo-mock-data.ts` (сид повторной отправки)

**Interfaces:**
- Consumes: `ReviewItem` (`submittedAt`, `kmStatus`), `KM_FILL_SLA_CALENDAR_DAYS`.
- Produces: точка с `checkpoint: "Повторная отправка после корректировки"`, попадающая в `versionPoints` метрик (счётчик «Повторные отправки»).

- [ ] **Step 1: Найти источник факта повторной отправки**

`ReviewItem` уже несёт `submittedAt`. Нужен признак «этот набор отправлялся повторно после возврата». Проверить, есть ли на `ReviewItem`/сиде поле возврата (`returnedAt`, `resubmittedAt`); если нет — добавить в сид опциональные `returnedAt?: Date; resubmittedAt?: Date` на те записи ревью, где `kmStatus` проходил через возврат, минимум на две кампании, чтобы точка была видна в UI и попала в рейтинг.

- [ ] **Step 2: Эмитировать точку**

В цикле `for (const it of cItems)`, сразу после блока «Возврат на корректировку»:

```ts
if (it.resubmittedAt) {
  const km = getCategoryManager(it.kmId);
  const deadline = it.returnedAt
    ? addWorkingDays(it.returnedAt, REVIEW_SLA_WORKING_DAYS)
    : fillDeadline;
  const overdueDays = getOverdueDays(deadline, it.resubmittedAt);
  points.push({
    ...base, id: `cp-promo-${c.id}-resubmit-${it.kmId}`,
    checkpoint: "Повторная отправка после корректировки",
    responsibleName: km?.name ?? "Категорийный менеджер", responsibleRole: KM_ROLE,
    deadline, actualAt: it.resubmittedAt, unit: "work",
    result: overdueDays > 0 ? "Просрочено" : "В срок", overdueDays,
    comment: "Набор отправлен повторно после возврата на корректировку.",
  });
}
```

- [ ] **Step 3: Учесть в метриках**

В `buildParticipantMetrics` в `versionPoints` добавить новую точку, чтобы столбец «Повторные отправки» её считал:

```ts
p.checkpoint.startsWith("Новая версия отчёта") ||
p.checkpoint === "Повторная отправка плана" ||
p.checkpoint === "Повторная отправка после корректировки"
```

- [ ] **Step 4: Сборка + браузер**

Run: `corepack pnpm --filter promo build`.
Expected: во вкладке 2 в списке фильтра «Контрольная точка» появился пункт «Повторная отправка после корректировки», по нему находятся строки; во вкладке 3 у соответствующего КМ вырос счётчик «Повторные отправки».

- [ ] **Step 5: Коммит**

```bash
git add Promo/src/lib/
git commit -m "feat(promo): Волна 5 (5C-T5) — контрольная точка «Повторная отправка после корректировки»"
```

---

### Task 6: Фильтры вкладки «Показатели участников»

**Files:**
- Modify: `Promo/src/lib/audit-control.ts:378-430` (сигнатуры `buildParticipantMetrics`/`buildParticipantTasks`)
- Modify: `Promo/src/app/components/audit/ParticipantMetricsTab.tsx:26-81`

**Interfaces:**
- Produces:
  ```ts
  export interface ParticipantFilters {
    from: string;        // ISO yyyy-mm-dd, «Период дедлайна» — от
    to: string;          // «Период дедлайна» — до
    promoIds: string[];  // [] = все
    checkpoint: string;  // "all" | точное название этапа
    participant: string; // "all" | ФИО
  }
  export const EMPTY_PARTICIPANT_FILTERS: ParticipantFilters;
  buildParticipantMetrics(role, ref?, opts?: { scope?: AuditScope; filters?: ParticipantFilters })
  buildParticipantTasks(name, role, ref?, opts?: { scope?; filters?; metric?: "all" | "onTime" | "overdue" | "due" })
  ```

- [ ] **Step 1: Прокинуть фильтры в деривацию**

`roleControlPoints(role, ref)` получает третий аргумент `opts` и применяет по порядку: скоуп (`scopeControlPoints`), затем период дедлайна, `promoIds`, `checkpoint`, `participant`. Без выбранного периода — все точки с наступившим дедлайном (это уже делает `due`-фильтр внутри `buildParticipantMetrics`, дублировать не нужно).

- [ ] **Step 2: Контролы на вкладке**

Над таблицей рейтинга, в одну строку с селектом «Роль», добавить: «Период дедлайна» (пара `input[type=date]` с подписью — тот же блок, что в Task 3 шаг 1), `PromoNoFilter` по `promoIds`, `Select` «Тип задачи / этап» (варианты — `ROLE_CHECKPOINTS[effectiveRole]`), `Select` «Участник» (варианты — `rows.map(r => r.name)` до фильтрации). Кнопка «Сбросить фильтры» рядом.

- [ ] **Step 3: Пересчёт**

`rows` пересобирать с `filters` в зависимостях `useMemo`. Счётчик «Показано: N» не нужен — таблица рейтинга и так короткая.

- [ ] **Step 4: Сборка + браузер**

Run: `corepack pnpm --filter promo build`.
Expected: выбор одного промо в «№ промо» пересчитывает «Промо с дедлайном»/«Вовремя»/«С просрочкой»; выбор этапа сужает набор; «Участник» оставляет одну строку; «Сбросить» возвращает исходные цифры. Под ролью КМ фильтры работают внутри собственного скоупа (одна строка).

- [ ] **Step 5: Коммит**

```bash
git add Promo/src/lib/audit-control.ts Promo/src/app/components/audit/ParticipantMetricsTab.tsx
git commit -m "feat(promo): Волна 5 (5C-T6) — фильтры показателей участников (период, промо, этап, участник)"
```

---

### Task 7: «Нет данных», сортировка и drill-down по показателю

**Files:**
- Modify: `Promo/src/lib/audit-control.ts:353-364` (`ParticipantMetricRow`), `:406-430`
- Modify: `Promo/src/app/components/audit/ParticipantMetricsTab.tsx:100-165`
- Modify: `Promo/src/app/components/audit/ParticipantTasksDrawer.tsx`

**Interfaces:**
- Produces: `ParticipantMetricRow.band: TimelinessBand | null` и `timelinessPct: number | null` (`null` = нет задач с наступившим дедлайном); `MetricKey = "due" | "onTime" | "overdue"`.

- [ ] **Step 1: `null` вместо нулевой своевременности**

```ts
const timelinessPct = dueCount ? Math.round((onTime / dueCount) * 100) : null;
const band = timelinessPct === null ? null : timelinessBand(timelinessPct);
```

Сортировка — строки без данных уходят вниз:

```ts
.sort((a, b) => {
  if (a.timelinessPct === null && b.timelinessPct === null) return 0;
  if (a.timelinessPct === null) return 1;
  if (b.timelinessPct === null) return -1;
  return b.timelinessPct - a.timelinessPct || b.dueCount - a.dueCount;
})
```

- [ ] **Step 2: Рендер «Нет данных»**

В `MetricRow` и в мобильной карточке:

```tsx
{r.timelinessPct === null || r.band === null ? (
  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-muted dark:text-gray-400">
    Нет данных
  </span>
) : (
  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", bandTint[r.band])}>
    {r.timelinessPct}% · {r.band}
  </span>
)}
```

В экспорте (`handleExport`) отдавать `r.timelinessPct ?? "—"` и `r.band ?? "Нет данных"`.

- [ ] **Step 3: Drill-down по числовым ячейкам**

Заменить `drillName: string | null` на `drill: { name: string; metric: MetricKey | "all" } | null`. Клик по ФИО → `{ name, metric: "all" }`; клик по ячейкам «Промо с дедлайном» / «Вовремя» / «С просрочкой» → соответствующий `metric`, с `e.stopPropagation()`, чтобы не сработал клик по строке. Числовые ячейки сделать визуально кликабельными (`cursor-pointer underline-offset-2 hover:underline`).

- [ ] **Step 4: Панель — фильтрация и заголовок**

`ParticipantTasksDrawer` принимает `metric` и фильтрует задачи: `"onTime"` → `overdueDays === 0 && actualAt`, `"overdue"` → `overdueDays > 0`, `"due"`/`"all"` → все с наступившим дедлайном. Заголовок:

```tsx
const METRIC_LABEL: Record<MetricKey | "all", string> = {
  all: "Все задачи", due: "Промо с дедлайном", onTime: "Вовремя", overdue: "С просрочкой",
};
<SheetTitle>Задачи: {name} — {METRIC_LABEL[metric]}: {tasks.length}</SheetTitle>
```

- [ ] **Step 5: Сборка + браузер**

Run: `corepack pnpm --filter promo build`.
Expected: у участника без задач с наступившим дедлайном — «Нет данных», и он внизу таблицы; клик по «С просрочкой: 2» открывает панель «Задачи: Юсупова Нигора — С просрочкой: 2» ровно с двумя карточками, все с красной плашкой; клик по ФИО открывает полный список.

- [ ] **Step 6: Коммит**

```bash
git add Promo/src/lib/audit-control.ts Promo/src/app/components/audit/
git commit -m "feat(promo): Волна 5 (5C-T7) — «Нет данных», сортировка и drill-down по показателю"
```

---

### Task 8: Состав «Ключевых действий» + 4 новых типа действий

**Files:**
- Modify: `Promo/src/lib/promo-mock-data.ts:4026-4072` (тип + `AUDIT_ACTION_META`), сиды `buildAuditLog`
- Modify: `Promo/src/app/components/audit/AuditLogTable.tsx:64-67` (`NON_KEY_ACTIONS`)

**Interfaces:**
- Produces: `AuditActionType` += `"автопередача по SLA" | "повторная отправка" | "новая версия отчёта" | "изменение дедлайна"`.

- [ ] **Step 1: Расширить тип и мету**

Добавить 4 значения в `AuditActionType` и **в тот же коммит** — 4 записи в `AUDIT_ACTION_META` (`Record` по типу упадёт на глазах при первом рендере, если забыть):

```ts
"автопередача по SLA": { bg: "bg-orange-100 dark:bg-orange-500/20", text: "text-orange-800 dark:text-orange-300" },
"повторная отправка": { bg: "bg-cyan-50 dark:bg-cyan-500/15", text: "text-cyan-700 dark:text-cyan-300" },
"новая версия отчёта": { bg: "bg-teal-100 dark:bg-teal-500/20", text: "text-teal-800 dark:text-teal-300" },
"изменение дедлайна": { bg: "bg-amber-100 dark:bg-amber-500/20", text: "text-amber-800 dark:text-amber-300" },
```

`ACTION_OPTIONS` в `AuditLogFilters.tsx:49` строится из `Object.keys(AUDIT_ACTION_META)` — правки не требует, проверить в браузере.

- [ ] **Step 2: Грепнуть все места, обязанные исчерпывать тип**

Run: `rg -n "AuditActionType" Promo/src`
Для каждого попадания проверить, что это `Record` (тогда достаточно добавить ключ) или `switch`, который надо дополнить. Урок 5B: забытое место молча отфильтрует новый тип.

- [ ] **Step 3: Посеять события**

В `buildAuditLog` добавить по одному событию каждого нового типа, привязанные к уже существующим кампаниям (автопередача — к той, где `seniorOverdueInfo` даёт эскалацию; новая версия отчёта — к кампании с `version > 1`; изменение дедлайна — к кампании с `fillDeadlineOverride`; повторная отправка — к кампании из Task 5). Даты брать из тех же сидов, чтобы аудит не расходился с вкладками сроков.

- [ ] **Step 4: Пересобрать состав «Ключевых действий»**

```ts
/** Технические и административные действия — только в режиме «Все действия» (Администратор). */
const NON_KEY_ACTIONS = new Set<AuditEvent["action"]>([
  "создание", "изменение", "смена пароля", "изменение профиля",
  "сброс пароля", "назначение прав", "отзыв прав",
  "блокировка", "разблокировка", "изменение ролей",
  "назначение замещения", "снятие замещения",
]);
```

- [ ] **Step 5: Сборка + браузер**

Run: `corepack pnpm --filter promo build`.
Expected: под Администратором в «Ключевые действия» нет записей со сбросом пароля/назначением прав, в «Все действия» они появляются; в фильтре «Тип действия» есть все 4 новых пункта и по каждому находится минимум одна запись; чипы действий окрашены (не прозрачные — признак дыры в `AUDIT_ACTION_META`).

- [ ] **Step 6: Коммит**

```bash
git add Promo/src/lib/promo-mock-data.ts Promo/src/app/components/audit/AuditLogTable.tsx
git commit -m "feat(promo): Волна 5 (5C-T8) — 4 ключевых действия в аудите + состав режима «Ключевые»"
```

---

### Task 9: Нижний скролл, экспорт и сквозная проверка матрицы

**Files:**
- Modify: `Promo/src/app/components/audit/ControlDeadlinesTable.tsx` (при необходимости)
- Modify: `Promo/src/app/components/audit/PromoDeadlinesTab.tsx`, `PlanDeadlinesTab.tsx`, `ParticipantMetricsTab.tsx` (заголовки экспорта)
- Modify: `docs/AI_CONTEXT.md`, `HISTORY.md`, `CLAUDE.md`, `Promo/CLAUDE.md`, `tasks/lessons.md`

- [ ] **Step 1: Проверить горизонтальный скролл на 1440**

Открыть вкладку «Сроки по промо и отчётам» на 1440px и выполнить в браузере:

```js
const box = document.querySelector('[class*="max-h-[calc(100vh"]');
({ scrollW: box.scrollWidth, clientW: box.clientWidth, rect: box.getBoundingClientRect().bottom, vh: window.innerHeight })
```

Если `scrollW <= clientW` — переполнения нет, пункт закрывается как «не воспроизводится», зафиксировать это в отчёте. Если переполнение есть, а полоса ниже кромки вьюпорта — добавить синхронизированную `sticky bottom-0` дорожку по образцу `FullCalendarGrid` (спейсер + трек шириной `scrollWidth`, `syncScroll` по двум рефам, нативную полосу тела скрыть `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`).

- [ ] **Step 2: Экспорт — новые колонки**

Добавить в `PROMO_EXPORT_HEADER` колонку «Единица срока» (или подписывать единицу прямо в значении просрочки через `overdueLabel`), проверить, что «Период плана» выгружается двумя колонками (Task 2), а рейтинг — с «Нет данных» вместо `0`.

- [ ] **Step 3: Сквозная матрица «9 ролей × 4 вкладки»**

Пройти god-mode переключателем по ВСЕМ девяти ролям, на каждой открыть все 4 вкладки, записать количество строк и убедиться, что:
скоуп совпадает с таблицей §2.1 спеки; ни одна роль, кроме Администратора, не видит объект «пользователь»; ни один фильтр не увеличивает набор сверх скоупа; пустые вкладки показывают плашку со `scope.label`, а не «Нет записей».

- [ ] **Step 4: Мобильная и тёмная проверка**

390px + `.dark`: обе таблицы сроков (карточки), рейтинг (карточки), панель задач, все новые фильтры в мобильном Sheet.

- [ ] **Step 5: Обе сборки**

Run: `corepack pnpm --filter promo build` и `corepack pnpm --filter dashboard build`
Expected: обе exit 0 (доказательство, что shared не задет).

- [ ] **Step 6: Документация**

`/doc_sync`: обновить `docs/AI_CONTEXT.md` (шапка + Known Issues — **сверять существующие пункты против кода, а не только дописывать**), `HISTORY.md`, оба `CLAUDE.md`, добавить уроки блока в `tasks/lessons.md`.

- [ ] **Step 7: Коммит**

```bash
git add -A
git commit -m "docs(promo): doc_sync — «10-я часть» Волна 5, блок 5C «Аудит»"
```

---

## Self-Review

**Покрытие спеки:** §2.1 → T1 (+T9 шаг 3 сквозная проверка); §2.2 → T2, T3; §2.3 → T2 (период плана), T4 (результат, автопередача, единицы), T5 (повторная отправка); §2.4 → T6, T7; §2.5 → T8; §2.6 → T9. Все 20 гапов покрыты.

**Согласованность типов:** `AuditScope`/`scopeControlPoints`/`scopeAuditEvents` (T1) используются в T6 через `opts.scope`. `ControlPoint.planPeriod` меняется один раз (T2) и читается в T2/T9. `ControlPoint.unit` вводится в T4 и потребляется `overdueLabel` в T4/T9 и `ParticipantTask` в T4/T7. `ControlFilters.promoIds` вводится в T3 — Task 2 (`planPeriod`) правит ту же структуру и должен идти ПЕРЕД T3, порядок соблюдён. `timelinessPct: number | null` вводится в T7 после того, как T6 закончил править сигнатуру `buildParticipantMetrics`.

**Риск порядка:** T1 меняет `AuditAccess`, T6 меняет сигнатуру той же функции метрик — выполнять строго по номерам.
