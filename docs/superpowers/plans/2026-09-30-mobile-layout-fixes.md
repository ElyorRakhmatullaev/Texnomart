# Promo + Broker · мобильная вёрстка 390px — план исправлений

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** убрать 23 дефекта вёрстки, найденных съёмкой мобильных скриншотов 30.09 (Promo — 16, Broker — 7), так, чтобы на 390px ни одна страница не уезжала вбок, ничего не обрезалось и все действия были достижимы.

**Architecture:** правки — классы Tailwind с мобильными вариантами поверх существующей вёрстки (десктоп ≥ md/lg не меняется). Единственная структурная правка — полный календарь Promo: на телефоне узкая закреплённая панель (одна колонка «Номенклатура» + ФИО КМ второй строкой) и одна кнопка строки 44px вместо набора иконок; действия полосы акции — в меню «⋯». Promo проверяется новыми e2e на 390×844 (TDD: тест падает на дефекте → правка → зелёный), Broker — скриптом замеров из scratchpad (своей e2e-инфраструктуры у Broker нет).

**Tech Stack:** React 18, Tailwind v4 (`@tailwindcss/vite`), shadcn/ui из `packages/ui` (не редактируется), Playwright (`Promo/e2e`, Chrome-канал).

**Spec:** отдельной спецификации нет. Требования — список дефектов ниже; доказательства — `Desktop\Texnomart\Promo_Broker_материалы\4_Скриншоты_мобильные\{Promo,Broker}` (снимки 30.09) и два отчёта разбора первопричин (сведены в задачи).

## Global Constraints

- `packages/ui/src/**` не редактируется — примитивы переопределяются классами в коде приложений (tailwind-merge побеждает `w-fit`, `h-9`, `border-input`; для `data-[size=default]:h-9` у SelectTrigger нужен `data-[size=default]:h-11` или `min-h-11`).
- Десктоп не меняется: всё новое — под `max-md:`/без префикса с `md:`-откатом (или `lg:` там, где раскладка уже переключается на lg). Весь существующий e2e-набор Promo (156 тестов на 1440×900) обязан остаться зелёным.
- Цвета — токенами (`border-border`, `bg-input-background`), никаких arbitrary hex-классов; тёмная тема должна остаться рабочей.
- Тап-таргеты, которые задача трогает, — не меньше 44×44px ниже md.
- Полный календарь Promo остаётся таблицей на всех ширинах (prompt pack «Mode A», `docs/promo_prompt_pack.md:295`) — карточками его не заменять.
- Правило Radix-меню из Волны 1: триггер `DropdownMenuTrigger asChild` — нативный `<button>` + `buttonVariants`, НЕ общий `<Button>` (иначе меню открывается за экраном).
- Тексты интерфейса — по-русски.
- Исполнители НЕ коммитят (три исполнителя работают параллельно в одном дереве — общий индекс git). Коммиты делает ведущий по темам, без Co-Authored-By.
- Порты: исполнитель Promo-общий — dev 5193, исполнитель полного календаря — 5194, исполнитель Broker — 5195. e2e гонять только против своего сервера: `BASE_URL=http://localhost:<порт>/ corepack pnpm --filter ... exec playwright test <файл>` (из `D:\Texnomart\Promo`: `$env:BASE_URL='http://localhost:5193/'; npx playwright test e2e/mobile.spec.ts`). Штатный порт e2e 5183 не занимать. Свои серверы гасить по PID.

## Review Focus

1. **Десктоп после мобильных классов.** Любой класс без префикса меняет и 1440px. Ожидание: на 1440 всё как было. Закрывает прогон всего набора e2e (Задача 4).
2. **Синхронизация высот строк полного календаря.** Новая мобильная ширина имени обязана считаться одной функцией для обеих панелей. Ожидание: на 390 высота каждой строки закреплённой панели равна высоте строки прокручиваемой. Тест — в Задаче 2.
3. **Узкий Android (360px).** Ожидание: полный календарь и верификация Broker не уезжают вбок и на 360. Тест/замер — в Задачах 2 и 3.
4. **Тёмная тема.** Новые рамки полей (`border-border`) видны и в `.dark`. Проверка скриншотом тёмной темы фильтров — в Задаче 4.
5. **Удаление строки на телефоне.** Иконка корзины уходит из строки — действие не должно пропасть. Ожидание: для удаляемой строки кнопка «Удалить номенклатуру» есть в панели «Редактировать строку». Тест — в Задаче 2.

---

### Task 0 (ведущий): общий помощник мобильных e2e

**Files:**
- Create: `Promo/e2e/mobile.ts`

**Interfaces:**
- Produces: `PHONE`, `expectNoPageOverflow(page)`, `expectFits(locator, label)`, `expectInViewport(locator, label)`, `expectVisibleBorder(locator, label)` — используются в `e2e/mobile.spec.ts` и `e2e/mobile-full-calendar.spec.ts`.

- [ ] **Step 1: Написать помощник** (код — в файле `Promo/e2e/mobile.ts`: viewport 390×844 + `isMobile`/`hasTouch`; проверка боковой прокрутки `<main>`; «содержимое шире рамки» через `scrollWidth - clientWidth`; «в пределах окна» через `boundingBox`; «рамка видна» через `getComputedStyle(el).borderTopColor !== 'rgba(0, 0, 0, 0)'`).

---

### Task 1 (исполнитель «Promo-общий»): поля, вкладки, панели, раскладки — Promo №3–№16

**Files:**
- Test: `Promo/e2e/mobile.spec.ts` (новый; `test.use(PHONE)`; вход — фикстуры `session`/`app` из `e2e/fixtures.ts`, данные — `e2e/data.ts`)
- Modify (по пунктам ниже): `audit/AuditPage.tsx`, `audit/ControlDeadlinesFilters.tsx`, `audit/AuditLogFilters.tsx`, `audit/AuditLogTable.tsx`, `audit/ParticipantTasksDrawer.tsx`, `users/UserDetailPage.tsx`, `approvals/ApprovalDetailPage.tsx`, `approvals/ReviewActionsPanel.tsx`, `approvals/LineChangeDrawer.tsx`, `approvals/SubmittedLinesPanel.tsx`, `approvals/ApprovalsPage.tsx`, `reports/ReportFilters.tsx`, `promo-types/PromoTypesPage.tsx`, `promo-types/RuleEditor.tsx`, `promo-types/RuleListPanel.tsx`, `full-calendar/CreateCampaignDialog.tsx`, `src/components/DeadlineChips.tsx`, `src/components/VersionHistoryDrawer.tsx` (все пути `app/components/...` — от `Promo/src/`).
- НЕ трогать: `FullCalendarGrid.tsx`, `FullCalendarPage.tsx`, `LineEditSheet.tsx` (Задача 2).

**Interfaces:**
- Consumes: `Promo/e2e/mobile.ts` (Task 0).
- Produces: ничего для других задач.

Порядок для каждого пункта: тест в `mobile.spec.ts` → прогон, падает по ожидаемой причине → правка → зелёный. Имена тестов: `М-П<№> <что проверяется>`.

**Общая первопричина №12/№13:** в светлой теме `--input: transparent` (`Promo/src/styles/theme.css:22`); поле видно только по серой заливке `bg-input-background`. Где код ставит полю `bg-white` на белой поверхности (Sheet, Card) — у поля нет ни заливки, ни рамки. Лечение: добавить `border-border` к таким полям (tailwind-merge перебьёт `border-input`). После пунктов №12/№13 — короткий поиск `rg "SelectTrigger className=\"[^\"]*bg-white|<Input[^>]*bg-white"` по `Promo/src` и то же исправление там, где поле стоит на белой поверхности (Sheet/Card/Dialog); на `bg-gray-50` не трогать.

- [ ] **№3 `/audit` — полоса вкладок 657px, страница уезжает на 267px.** `AuditPage.tsx:73`: к `TabsList` добавить `max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden` (примитивный `w-fit` делает полосу шириной содержимого, поэтому свой `overflow-x-auto` не срабатывал). Тест (u-2, `/audit`): `expectNoPageOverflow`; вкладка «Аудит-лог» после `scrollIntoViewIfNeeded` кликабельна и открывает вкладку.
- [ ] **№4 `/users/u-6` — вкладки шире экрана на 76px.** `UserDetailPage.tsx:391`: тот же набор классов, что в №3. Тест (u-2): `expectNoPageOverflow`; клик по «Журнал действий» открывает панель.
- [ ] **№10 «История и изменения» / «История версий» — вкладка «История версий» обрезана.** `VersionHistoryDrawer.tsx:186`: к `TabsList` добавить `overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`. Тест (u-1, `/reports?promo=PR-2026-003` → «История версий»): `expectFits(TabsList)` либо последняя вкладка достижима прокруткой и кликабельна.
- [ ] **№9 `ParticipantTasksDrawer` — заголовок под «×».** `ParticipantTasksDrawer.tsx:46-50`: `<SheetHeader className="pr-12">`. Тест (u-2, `/audit` → «Показатели участников» → ФИО): правый край заголовка ≤ левого края кнопки закрытия (`getByRole('button', { name: 'Close' })` или `[data-slot=sheet-close]` — проверить разметку примитива).
- [ ] **№8 `LineChangeDrawer` — «Отклонить строку» обрезана.** `LineChangeDrawer.tsx:299`: `className="flex flex-col gap-2 sm:flex-row"`. Тест (u-1, `/approvals/PR-2026-003~km-4` → иконка-глаз строки): обе кнопки `expectInViewport`.
- [ ] **№5 `/approvals/:id` — нижняя панель закрывает последнюю карточку.** Панель (`ReviewActionsPanel.tsx:320`, `MobileReviewActionBar`) — три кнопки `h-9` столбиком ≈150px, а у контента `pb-24` (`ApprovalDetailPage.tsx:365`). Правка: кнопкам мобильной панели высота 44px (`h-11`, через проп/класс только в `MobileReviewActionBar`, десктопная панель `ActionButtons` не меняется), нижний отступ контента — `pb-52 lg:pb-6` (3×44 + 2×8 + 24 + 1 ≈ 173px + запас). Тест (u-1, `/approvals/PR-2026-002~km-5`): прокрутить `<main>` до конца; низ последнего блока контента ≤ верха панели; кнопки панели ≥ 44px высотой.
- [ ] **№14 карточка согласования — таблица строк 878px в 314px, статусы срезаны.** `SubmittedLinesPanel.tsx:179-335`: таблицу обернуть в `hidden md:block`, добавить `md:hidden` список карточек по образцу `AuditLogTable.tsx:377`: чекбокс (если `selectable`), имя с переносом, бейджи `flex-wrap` (маркер/«дубль»/«отклонено»), `dl` 2×2 из четырёх чисел (Остаток · Новая цена · Скидка · Прогноз продаж, теми же форматтерами, что ячейки), кнопка-глаз 44px → тот же `onOpenRow`. Тест (u-1, `/approvals/PR-2026-003~km-4`): `expectNoPageOverflow`; карточка с «Кофемашина De'Longhi Magnifica» видна; глаз в ней открывает ту же панель, что в №8.
- [ ] **№6 «Календарные дедлайны» — части плашки сжаты в столбики.** `DeadlineChips.tsx:35`: плашка `flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-lg sm:rounded-full`; внутренним `<span>` (подпись, «за N дн.», «· дата», «(календарные)») — `whitespace-nowrap`. Тест (u-1, `/short-calendar/PR-2026-001`): каждая плашка `expectInViewport`, у каждого внутреннего `span` высота ≤ 20px (одна строка).
- [ ] **№7 «Создать акцию» — иконки наезжают на текст переключателя.** `CreateCampaignDialog.tsx:189-198`: `TabsList` → `grid h-auto w-full grid-cols-2`; оба `TabsTrigger` → `h-auto min-h-11 min-w-0 whitespace-normal leading-tight`. Тест (u-4, `/full-calendar` → «Создать акцию»): оба триггера `expectFits`, `expectInViewport`.
- [ ] **№11 «Аудит-лог» — пояснение у «Ключевые / Все действия» столбиком за экраном.** `AuditLogTable.tsx:232-236`: контейнер `flex flex-wrap items-center gap-2`, `span` → `basis-full md:basis-auto`. Тест (u-2, `/audit` → «Аудит-лог»): пояснение `expectInViewport`, `expectNoPageOverflow`.
- [ ] **№12 «Фильтры сроков» / «Фильтры аудита» — поля без подписей и без рамки.** `ControlDeadlinesFilters.tsx`: в раскладке `layout="stack"` обернуть каждый контрол в подпись по образцу `Field` из `AuditLogFilters.tsx:191-206` («№ промо», «Этап», «Ответственный», «Статус», «Результат» — точные названия взять из плейсхолдеров/смысла каждого Select); у пункта «all» фильтра «Результат» (`:168`) текст «Все» → «Все результаты»; к триггерам `:139/:152/:159/:166` добавить `border-border`. `AuditLogFilters.tsx:89/105/124/143` — `border-border`; неиспользуемую константу `FIELD` (`:65-66`) удалить. Тест (u-2, `/audit`, кнопка «Фильтры» в каждой из вкладок сроков и в «Аудит-лог»): в листе у каждого `[data-slot=select-trigger]` `expectVisibleBorder`; подписи видны (`getByText('Результат')` и т. д.).
- [ ] **№13 `/reports` «Фильтры» — поля без рамки.** `ReportFilters.tsx:515` (текстовое поле), `:470`/`:481` («от — до»), `:446` и `:797` (Select) — добавить `border-border`. Тест (u-1, `/reports?promo=PR-2026-003` → «Фильтры»): `expectVisibleBorder` для первого текстового поля, пары «от — до» и обоих Select.
- [ ] **№15 редактор правила — двойная прокрутка.** Фиксированная высота — только с `lg`: `PromoTypesPage.tsx:44` `h-full` → `lg:h-full`; `:52` `min-h-0 flex-1` → `lg:min-h-0 lg:flex-1`; `RuleEditor.tsx:103` → `flex flex-col gap-4 pb-6 lg:h-full lg:overflow-y-auto`; `RuleListPanel.tsx:60` — то же для `h-full` (`lg:h-full`, `min-h-[320px]` оставить). Тест (u-1, `/promo-types/rule-installment-12`): корень редактора `scrollHeight - clientHeight ≤ 1` (не внутренний скроллер) на 390.
- [ ] **№16 `/approvals` — «Все статусы согласован…» обрезано.** `ApprovalsPage.tsx:350`: `w-[220px]` → `w-full sm:w-[250px]`. Тест (u-1, `/approvals`): у `[data-slot=select-value]` этого триггера `expectFits`.
- [ ] **Прогон и проверка глазами.** `npx playwright test e2e/mobile.spec.ts` против своего сервера — всё зелёное. Затем снимки 390 изменённых экранов (скрипт `scratchpad\mobile-shots\promo\shots.mjs`/`dialogs.mjs`, запуск `node shots.mjs all` с сервером на порту из `lib.mjs` — порт передать/поправить на свой) и 1440 тех же экранов — открыть и сравнить: мобильное исправлено, десктоп не изменился.

---

### Task 2 (исполнитель «Полный календарь»): полный календарь на телефоне — Promo №1, №2

**Files:**
- Test: `Promo/e2e/mobile-full-calendar.spec.ts` (новый)
- Modify: `Promo/src/app/components/full-calendar/FullCalendarGrid.tsx`, `FullCalendarPage.tsx`, `LineEditSheet.tsx`

**Interfaces:**
- Consumes: `Promo/e2e/mobile.ts`; `useIsMobile` из `@texnomart/ui/use-mobile` (порог 768).
- Produces (внутри модуля полного календаря): `export function lineRowAccess(access, campaign, line): { editable: boolean; deletable: boolean }` в `FullCalendarGrid.tsx` — единственное место правил «правится/удаляется» строки (сейчас `rowEditable`/`rowDeletable` считаются инлайном на `:684-734`); `LineEditSheet` получает необязательный проп `onDelete?: () => void`.

Первопричина №1: ширины закреплённой панели — инлайн-стили из `FROZEN = { select: 40, promo: 108, km: 150, nomenclature: 320 }` (`:154-160`), итого 618/578px при 366px контента на 390; `shrink-0` панель съедает всё, прокручиваемой панели (`min-w-0 flex-1`, `:887`) остаётся 0px, `overflow-clip` у Card режет закреплённую на 366px. Иконки строки (глаз, исключение, карандаш, корзина — `:803-861`) стоят в конце колонки «Номенклатура» (x≈530–618) и срезаны. Действия полосы акции («Изменить период», «Изменить акцию», «История», «Отменить акцию» — `:928-981`) стоят `ml-auto` в полосе шириной всех колонок и на телефоне недостижимы. Классами `md:` инлайн-ширины не перебить — нужен `useIsMobile()`.

- [ ] **Тесты (падают до правки)**, u-1 (КД) и u-4 (КМ), 390×844:
  - `М-К1 нет боковой прокрутки`: `/full-calendar` — `expectNoPageOverflow`; ширина прокручиваемой панели (`bodyRef`, найти по классу `overflow-x-auto` внутри Card таблицы или добавить `data-testid="fc-scroll"`) ≥ 140px.
  - `М-К2 высоты панелей совпадают`: для каждой строки закреплённой панели (`div.group\/row`) высота равна высоте строки с тем же индексом в прокручиваемой панели (`div.flex.items-stretch.border-b.text-sm`) — Review Focus 2.
  - `М-К3 КД открывает «Детали изменений» с телефона`: `/full-calendar?promo=PR-2026-003`, в строке «Кофемашина De'Longhi Magnifica» кнопка `getByRole('button', { name: 'Открыть строку' })` (44×44, `expectInViewport`) → видна панель «Детали изменений».
  - `М-К4 КМ открывает панель строки и удаляет черновик`: u-4 добавляет номенклатуру в свою акцию-черновик (как в существующих тестах `full-calendar.spec.ts` — найти готовый путь) → «Открыть строку» → лист «Редактировать строку» → кнопка «Удалить номенклатуру» есть и удаляет строку (Review Focus 5). Для неудаляемой (согласованной) строки кнопки нет.
  - `М-К5 действия акции из меню`: у полосы акции кнопка `getByRole('button', { name: 'Действия акции' })` (`expectInViewport`) → пункт «История» открывает «История и изменения»; для КМ в меню есть «Добавить номенклатуру».
  - `М-К6 шапка КМ`: u-4 — «Создать акцию» `expectInViewport`, `expectNoPageOverflow` (№2).
  - `М-К7 360px`: `М-К1` повторить с viewport 360×780 (Review Focus 3).
  - `М-К8 десктоп не изменился`: 1440×900, u-1 — в строке есть «Просмотр деталей», нет «Открыть строку»; колонки «№ промо» и «ФИО КМ» в шапке есть.
- [ ] **Мобильные ширины.** В `FullCalendarGrid`:
  ```tsx
  const FROZEN_MOBILE = { select: 40, promo: 0, km: 0, nomenclature: 172 };
  // ширина имени на телефоне: 172 − px-2 (16) − кнопка 44 − зазор 4
  const NAME_MEASURE_W_MOBILE = 104;
  ```
  `nameLineCount(name, measureW = NAME_MEASURE_W)`; `lineHeightPx(line, isChoice, editable, mobile = false)`: на телефоне `nameH = (nameLineCount(name, NAME_MEASURE_W_MOBILE) + 1) * NAME_LINE_H + 16` (+1 строка — ФИО КМ под именем). Внутри компонента `const isMobile = useIsMobile(); const F = isMobile ? FROZEN_MOBILE : FROZEN;` — все `colStyle(FROZEN.x)` → `colStyle(F.x)`; обе панели вызывают `lineHeightPx(..., isMobile)`; `isMobile` в зависимости `useLayoutEffect` замера (`:571`). На телефоне колонки «№ промо» и «ФИО КМ» не рендерятся вовсе (ни в шапке, ни в строках — № уже есть на полосе акции); шапка закреплённой панели — «Номенклатура / КМ».
- [ ] **Строка на телефоне.** В ячейке «Номенклатура» при `isMobile`: `px-2`; под именем — `<span className="text-xs text-muted-foreground">{фамилия КМ}</span>` (тот же источник, что `KmCell`: `getCategoryManager(kmId)` + `lastName`); вместо кластера `:803-861` — одна кнопка:
  ```tsx
  <button type="button" aria-label="Открыть строку" onClick={openRow}
    className="relative inline-flex size-11 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-gray-100 dark:hover:bg-accent">
    <ChevronRight className="size-5" />
    {showRejectDot && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-card" />}
  </button>
  ```
  `openRow`: если `editable && !line.removed && onLineTap` → `onLineTap(line.id)` (лист «Редактировать строку» уже содержит «Детали изменений» и «Исключить позицию»); иначе если `onOpenDetails` → `onOpenDetails(line.id)`; иначе кнопки нет. Десктопный кластер без изменений.
- [ ] **`lineRowAccess`.** Вынести правила `freshEditable`/`lineEditable`/`ownDraft`/`ownUnapprovedAddition` → `{ editable, deletable }` в экспортируемую функцию, использовать её в закреплённой панели (поведение на десктопе прежнее) и в `FullCalendarPage` при монтировании `LineEditSheet` (`:1762-1783`): `onDelete` передаётся, только если `deletable && !line.removed && onDeleteLine`-обработчик страницы существует; он вызывает тот же обработчик, что корзина в строке, и закрывает лист. В `LineEditSheet` — кнопка `variant="outline"` с красным текстом «Удалить номенклатуру» (иконка `Trash2`) рядом с «Исключить позицию из акции».
- [ ] **Действия полосы акции на телефоне.** Условия пяти действий (добавить номенклатуру, изменить период, изменить акцию, история, отменить акцию — `:711-719`, `:929-975`) собрать в одну функцию `bandActions(campaign)` → `{ key, label, icon, onSelect, destructive? }[]`, которую используют и десктопная полоса (разметка прежняя), и мобильное меню. На телефоне в закреплённой полосе после «· N позиций»: «Добавить номенклатуру» не показывается текстом; справа `DropdownMenu` с триггером — нативный `<button aria-label="Действия акции" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "ml-auto size-11")}>` (`MoreHorizontal`), пункты — из `bandActions`. Кластер действий в прокручиваемой полосе — `hidden md:flex` (чип «Подарки: …» остаётся). Бейдж «Отменена» — остаётся в полосе на всех ширинах.
- [ ] **№2 шапка КМ.** `FullCalendarPage.tsx:1473`: `className="flex flex-wrap items-center gap-2"`.
- [ ] **Прогон**: `npx playwright test e2e/mobile-full-calendar.spec.ts e2e/full-calendar.spec.ts` против своего сервера — зелёное (десктопный `full-calendar.spec.ts` обязан не сломаться). Снимки 390 (КД, КМ, 360) и 1440 — открыть и проверить глазами.

---

### Task 3 (исполнитель «Broker»): Broker №1–№7

**Files (от `Broker/src/app/components/`):** `scoring/VerificationPage.tsx`, `scoring/BanksPage.tsx`, `scoring/BankCard.tsx`, `scoring/MyIdPhotoPage.tsx`, `scoring/CardOtpDialog.tsx`, `checkout/AlifCheckoutDialog.tsx`, `checkout/ApplicationPhase.tsx`, `checkout/CardAttachPhase.tsx`, `checkout/CreditOtpPhase.tsx`, `checkout/OfferPhase.tsx`, `checkout/DetailsPhase.tsx`, `checkout/RelativeFields.tsx`, `alif/OtpPanel.tsx`, `shell/BrokerShell.tsx`, `shell/ActionRail.tsx`, новый `shell/EndScoringDialog.tsx`.

**Проверка:** своего e2e у Broker нет. Скрипт замеров — `scratchpad\mobile-shots\broker\` (`lib.mjs`, `main-flow.mjs`, `camera-flow.mjs`, `probe-*.mjs`; в `diag\*.json` — замеры переполнения до правок). Сначала запустить против своего сервера (порт 5195; поправить порт в `lib.mjs`) и записать исходные замеры, после правок — повторить: ширина документа ≤ 390, ни один элемент не выходит за окно, тап-таргеты из списка ≥ 44px. Плюс прогон на 360px для верификации и банков.

- [ ] **№1 верификация шире телефона.** `VerificationPage.tsx:122` → `mt-6 grid grid-cols-1 gap-8 md:grid-cols-2` (`grid-cols-1` = `minmax(0,1fr)` — колонка больше не растягивается по содержимому); карточный отступ `:118` `p-6 md:p-8` → `p-4 md:p-8`; в строке карты (`:163-190`) бейдж статуса на телефоне — под номером (`<Badge className="mt-1 w-fit sm:hidden">` внутри `:168`, текущему — `hidden sm:inline-flex`); корзина `:188` → `flex size-11 shrink-0 items-center justify-center -my-2 -mr-2 rounded-md` (как `RelativeFields.tsx:89`).
- [ ] **№2 «×» поверх бейджа шапки попапа.** `AlifCheckoutDialog.tsx:71`: к классам `DialogContent` добавить `[&>button:last-child]:hidden` (встроенный «×» — всегда последний ребёнок); в правую группу шапки `:92` последним элементом — `<DialogClose className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"><X className="size-4" /><span className="sr-only">Закрыть</span></DialogClose>` (закрытие идёт через тот же `onOpenChange`, блокировка при удержанной предоплате сохраняется — проверить). `CardOtpDialog.tsx:19`: увеличить встроенный «×» до 44px — `[&>button:last-child]:flex [&>button:last-child]:size-11 [&>button:last-child]:items-center [&>button:last-child]:justify-center [&>button:last-child]:top-1.5 [&>button:last-child]:right-1.5`.
- [ ] **№3 длинные значения выходят из рамок.** `ApplicationPhase.tsx:100` и `CardAttachPhase.tsx:69`: `grid-cols-2` → `grid-cols-[auto_1fr]` (подписи короткие, значения помещаются одной строкой); значение IMEI в `CreditOtpPhase.tsx:54` — `break-all` (длина не ограничена); на тех же контейнерах и `ApplicationPhase.tsx:158`, `HoldPhase.tsx:110`, `OfferPhase.tsx:106` — `wrap-anywhere` как страховка.
- [ ] **№4 карточки банков шире полосы клиента.** `BanksPage.tsx:39` → `grid grid-cols-1 gap-4 md:grid-cols-2`; шапка `BankCard.tsx:36` → `flex flex-wrap items-center gap-x-3 gap-y-2`, заголовок `flex-1 whitespace-nowrap`, два бейджа — в `<div className="flex flex-wrap gap-1.5">`.
- [ ] **№5 тап-таргеты < 44px (ниже md).** Демо-чипы MyID `MyIdPhotoPage.tsx:174` → `inline-flex min-h-11 items-center`; «Вернуться к предыдущему шагу» `:344` → `mt-4 flex min-h-11 w-full items-center justify-center`; «Использовать демо-фото» `:207` `h-10` → `h-11`; `OfferPhase.tsx:136`/`:142` `flex-1` → `sm:flex-1` (в колонке `DialogFooter` `flex-basis:0` отменяет `h-11`); «Добавить» `VerificationPage.tsx:230` `h-9` → `h-11 md:h-9`; текстовые поля — `h-11 md:h-9` (`VerificationPage.tsx:47` `readOnlyFieldClass`, `:206`, `:212-218`; `ApplicationPhase.tsx:117-132`, `:140`; `RelativeFields.tsx:115`, `:124`); Select-триггеры — `min-h-11 md:min-h-0` (`DetailsPhase.tsx:105`, `:121`; `RelativeFields.tsx:100`); «Запрос лимита у партнеров» `BanksPage.tsx:58` → `min-h-11`; логотип `BrokerShell.tsx:17` — кнопка `size-11` с жёлтым квадратом 32px внутри (визуально без изменений); «Отправить код повторно» `OtpPanel.tsx:158-164` → `inline-flex min-h-11 items-center`; «Понятно» `VerificationPage.tsx:266` → `h-11`.
- [ ] **№6 действия скоринга недоступны на телефоне.** Вынести подтверждение «Завершить скоринг?» и `handleFinish` (`ActionRail.tsx:28-32`, `:60-82`) в контролируемый `shell/EndScoringDialog.tsx` (`open`, `onOpenChange`; подтверждение → `resetFlow()` + `navigate("/scoring/verification")`); `ActionRail` открывает его из состояния (обычная кнопка вместо `AlertDialogTrigger`). В шапке `BrokerShell.tsx:35` (правая группа) — `lg:hidden` кнопка-меню: нативный `<button aria-label="Действия скоринга" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-11")}>` (`MoreVertical`) → `DropdownMenu` с тремя пунктами: «Новая вкладка» и «Отправить лимиты в Telegram» — тот же `toast("Действие вне прототипа")`, «Завершить скоринг» — открывает `EndScoringDialog` из `onSelect` (без вложенного триггера).
- [ ] **№7 белая полоса под короткими страницами.** `BrokerShell.tsx:57` `min-h-[calc(100vh-128px)]` → `flex-1` (родитель `:10` уже `flex min-h-screen flex-col`); `:10` `min-h-screen` → `min-h-dvh`.
- [ ] **Проверка.** Замеры после правок (390 и 360) — чисто; `corepack pnpm build:broker` зелёный; весь поток пройти кликами и снять 390 + 1440 (десктоп не изменился: карточки банков в две колонки, ActionRail справа, поля 36px). Открыть снимки глазами.

---

### Task 4 (ведущий): ревью, регрессия, пересъёмка, документация, коммиты

- [ ] Ревью всего диффа (агент-ревьюер на самой сильной модели): корректность, десктоп не задет, пропущенные экраны с той же первопричиной.
- [ ] `corepack pnpm build:promo`, `build:broker`, `build:dashboard` — зелёные; `tsc` Promo из scratchpad — ровно 3 известные ошибки.
- [ ] Весь набор `corepack pnpm test:e2e:promo` — зелёный (156 прежних + новые мобильные).
- [ ] Пересъёмка мобильного набора обоих приложений теми же скриптами → замена файлов в `4_Скриншоты_мобильные` (списки `_Список.txt` — обновить описания изменившихся экранов, дату, убрать пометки о программных кликах 03/04); тёмная тема фильтров — контрольный снимок.
- [ ] Документация: `HISTORY.md`, `docs/AI_CONTEXT.md` (в т. ч. устаревшая фраза про «row chevron (shown below md)» на `:104`), строки Promo/Broker в корневом `CLAUDE.md`, `Promo/CLAUDE.md`/`Broker/CLAUDE.md` (мобильная раскладка полного календаря, меню скоринга), `tasks/lessons.md` (урок: `--input: transparent` + `bg-white` = невидимое поле; `w-fit` у TabsList глушит `overflow-x-auto`; `flex-1` в колонке отменяет `h-11`; неявная `auto`-колонка грида растёт по min-content).
- [ ] Коммиты по темам на `main` (Promo общий, Promo полный календарь, Broker, e2e, docs), без AI-трейлеров. Пуш — только по просьбе пользователя.

---

## Итог выполнения (30.09)

Все четыре задачи выполнены; отклонения от плана:

- **Порог узкой раскладки полного календаря — lg, а не md**, и через `matchMedia('(width < 64rem)')` (`useNarrowGrid`), а не `useIsMobile()`: на телефоне первая десктопная отрисовка уменьшает масштаб, `innerWidth` ≈1560, флаг `useIsMobile` застывал в `false`; на планшете 800px (меню AppShell уже на экране) прокручиваемой панели тоже оставалось 0px. Кнопка «Детали изменений» листа строки — `lg:hidden` в пару.
- **Высота строки** на телефоне — не `(nameLines+1)*17+16`: строка под именем несёт фамилию КМ и пометки и может переноситься — `mobileMetaLines` раскладывает её канвой (`LineMarkers` — один неразрывный элемент, по ревью).
- **Лист строки** получил и «Детали изменений» (у редактируемых строк их на телефоне было не открыть — КМ не мог погасить красную точку) — тест М-К9 добавлен после правки.
- **`/audit`**: вкладки вынесены в свою строку на всех ширинах — на 1024–1440 «Аудит-лог» обрезался и на десктопе (тест М-П3б).
- **Ширина закреплённой панели** задана явно в шапке и теле (Important из ревью: длинная полоса акции раздвигала тело).
- **Broker**: «×» попапа — в поток шапки + `onOpenAutoFocus`, чтобы первый фокус остался прежним; фокус после `EndScoringDialog` возвращается на открывшую кнопку (ревью).
- **Не сделано осознанно:** высота фильтров-контролов 32–36px на телефоне (частичное увеличение ломало бы ряды — нужен общий проход); отзыв неодобренного добавления в отменённой акции на телефоне.

Проверка: три сборки зелёные; весь e2e Promo — 190 passed + 2 падения `film.spec.ts` от незакоммиченной работы над фильмом v2 (не связаны); после правок ревью затронутые наборы — 87 passed; `tsc` — базовая линия; Broker — замеры 390/360 и снимки 1440; мобильный набор переснят.
