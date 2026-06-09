# Texnomart Credit Broker — Remaining Pages
## Prompt Pack Part 2 — shadcn/ui

> Use this pack AFTER the Dashboard pack. It assumes Prompt 0 (Foundation) and Prompt 2 (App Shell) are already built.
>
> **What's inside:** 14 prompts covering every remaining route in the spec — Login, Applications, Clients, Partners, Branches, Users, Analytics, Telegram Bot, Notifications, Audit, Settings, Profile.
>
> Each page prompt is self-contained and produces a list view + detail view + create/edit modal where applicable.

---

## 🔁 PROMPT 0a — FOUNDATION ADDENDUM & REUSABLE PATTERNS

> Paste this BEFORE generating any page in this pack. It corrects one item from Prompt 0 (based on the rendered sidebar) and registers the reusable patterns every page will reference.

```
You already have the Foundation (Prompt 0) and App Shell (Prompt 2) loaded. Two updates and a library of reusable patterns:

### CORRECTION — sidebar active state (CANONICAL)
The realized active state is: full primary yellow (#FFD60A) pill background, black icon and text, no left border, radius md. Apply this everywhere a "primary selected" state appears (sidebar items, tab pills, filter chips when selected, segmented controls).

### REUSABLE PATTERN A — PAGE HEADER
Every page begins with a PageHeader, 64px tall, no card chrome, sits directly under breadcrumbs:
- Left: H1 (32/40 Bold) + optional Caption below (12/16 gray-700) showing a counter ("Найдено 1 247 заявок") or a meta note ("Обновлено: 12:34")
- Right cluster (gap-12):
  - Optional Tabs / segmented control for view modes
  - Search input (320px, with Search icon left, ⌘F hint right)
  - Refresh icon Button (ghost)
  - Export DropdownMenu (variant secondary, Download icon + label)
  - Primary CTA Button (e.g. "Создать заявку")

### REUSABLE PATTERN B — FILTER BAR
Sits below PageHeader, on its own row, 56px tall, white surface with a subtle gray-100 background container, radius md, padding 12, gap-8 between controls:
- Filter chips (shadcn Badge variant outline, with chevron-down) — each opens a Popover with the filter options; selected state uses the canonical yellow pill
- "Очистить фильтры" ghost button on the right when ≥1 filter is active
- "Сохранить вид" DropdownMenu on the far right (Bookmark icon) — saves current filter+sort combo with a name
- A subtle horizontal scroll if chips overflow

### REUSABLE PATTERN C — DATA TABLE
Use shadcn Table inside a Card. Defaults:
- Row height: 56px (taller variant 72px when a row has avatar+subtext)
- Header: sticky, gray-100 bg, 12/16 Medium gray-700 uppercase letter-spacing-tight, sortable columns show ArrowUpDown 14px on hover
- Row hover: gray-100 bg, cursor-pointer
- Selected row: primary-tinted bg (rgba(255,214,10,0.08)) + 2px primary left border
- Checkbox column at left (40px wide) — appears on rows when bulk operations are enabled; column header has "select all" checkbox
- Actions column at right (56px wide, sticky) — MoreHorizontal icon button, opens DropdownMenu
- Empty cells: render "—" (em dash) in gray-400, never blank
- Numbers: always tabular-nums, right-aligned
- Long text: truncate with title attribute
- Footer: pagination bar (56px tall) — "Показывать [20 / 50 / 100] строк" Select left, "1–20 из 1 247" caption center, page nav right (ChevronLeft / 1 2 3 ... 62 / ChevronRight)

### REUSABLE PATTERN D — DETAIL PAGE (full route, NOT drawer)
Every entity detail view is a **full dedicated page** at `/entity/:id` — never a side drawer. This ensures enough room for rich content and works well on all screen sizes.
- **Back navigation**: "← Назад к списку" ghost link top-left (navigates to the list page, preserving filters via URL params)
- **Hero band** (white Card, padding 24): identity block left (avatar/logo + title H2 + subtitle + status Badge), action buttons right (primary CTA + secondary actions + MoreHorizontal dropdown)
- **Tabs** (Pattern J underline tabs): organize sections logically; each tab is a URL hash segment for deep linking (e.g. `/partners/1#api`)
- **Body**: padding 24, sections use Cards with section titles (14/16 SemiBold uppercase gray-700)
- **Sticky action bar** (bottom, 56px, gray-100 bg): secondary actions left, primary action right — visible when form fields have unsaved changes
- Open via: clicking a row in a data table → navigates to `/entity/:id`. Keyboard: Enter on focused row.

### REUSABLE PATTERN D2 — SETTINGS / CONFIG DRAWER (right-side, for non-entity panels only)
Use shadcn Sheet, anchored right. Width: 720px (60% on smaller screens, 100% on mobile). Reserved for settings panels, config overlays, and quick-edit forms — NOT for entity detail views.
- Header (sticky, 64px): close button (X) on the left, title H3, action buttons on the right
- Body: ScrollArea, padding 24, sections separated by Separator
- Footer (sticky, 56px, gray-100 bg): "Отмена" ghost left, "Сохранить" primary right
- Closes on Esc, click-outside, or close button

### REUSABLE PATTERN E — CREATE/EDIT MODAL
Use shadcn Dialog, max-width 560px (forms with 1 column) or 720px (2-column forms).
- Header: title H3 + close X
- Body: padding 24, form fields stacked, gap-16, labels above inputs (14/20 Medium), helper text below input (12/16 gray-700), error text below input (12/16 danger)
- Footer (gray-100 bg, padding 16): "Отмена" Button (variant ghost) left, primary "Сохранить" / "Создать" Button right
- All forms use inline validation, disable submit until valid, show loading state on submit

### REUSABLE PATTERN F — BULK ACTIONS TOOLBAR
Appears on top of the data table when ≥1 row is selected, replacing the page header. Smooth slide-down 200ms.
- Black bg (#0A0A0A), white text, 56px tall, radius md, padding 16, shadow-lg
- Left: "Выбрано: 3" + "Снять выделение" link (primary yellow text)
- Right: action buttons (icon + label, variant ghost on dark): Export, Deactivate, Delete, etc.

### REUSABLE PATTERN G — CONFIRMATION DIALOG
Use shadcn Dialog, max-width 440px. For any destructive or irreversible action.
- Icon top-left (AlertTriangle 24px in semantic color — danger for delete, warning for deactivate)
- Title H3 + Body M description
- For typed-confirmation (delete partner / delete user): require typing the entity name
- Footer: "Отмена" ghost + destructive primary ("Удалить" danger variant)

### REUSABLE PATTERN H — STATUS BADGE SYSTEM
Single source of truth. Use shadcn Badge with these tokens:

| Domain | Status | BG | Text |
|---|---|---|---|
| Application | Новая | gray-200 | gray-900 |
| Application | На скоринге | info @ 15% | info |
| Application | Одобрена | success @ 15% | success |
| Application | Частично одобрена | #DCFCE7 | success |
| Application | Отклонена | danger @ 15% | danger |
| Application | В работе у оператора | warning @ 15% | warning |
| Application | Ожидает документы | #FFEDD5 | #C2410C |
| Application | Подписан договор | #DCFCE7 | #166534 |
| Application | Завершена | success @ 10% | #65A30D |
| Application | Отменена | gray-100 | gray-700 |
| Application | Просрочена | #FEE2E2 | #991B1B |
| User/Entity | Активен | success @ 15% | success |
| User/Entity | Деактивирован | gray-100 | gray-700 |
| User/Entity | Заблокирован | danger @ 15% | danger |
| API health | Онлайн | success | white |
| API health | Офлайн | danger | white |
| API health | Деградация | warning | gray-900 |
| Client flag | VIP | primary | primary-foreground |
| Client flag | Чёрный список | danger | white |

All Badges: padding 4×8, radius full, 12/16 Medium, no shadow. Filled or tinted variants only — never outlined for statuses.

### REUSABLE PATTERN I — UNIFIED STATES (every list and detail view)
- Loading: shadcn Skeleton blocks matching the final shape (NEVER spinners). Show for ≥250ms even if data arrives faster, to avoid flashes.
- Empty (no results): Lucide Inbox icon 48px gray-400 + H3 "Ничего не найдено" + Body M (page-specific message) + primary Button (page-specific CTA like "Создать заявку")
- Empty (no filter results): Lucide SearchX icon 48px + "По вашим фильтрам ничего не найдено" + "Сбросить фильтры" Button (variant secondary)
- Error: Lucide WifiOff icon 48px + "Не удалось загрузить" + "Повторить" Button + caption "Если ошибка повторяется, обратитесь к администратору"

### REUSABLE PATTERN J — DETAIL VIEW SUB-COMPONENTS
- InfoRow: 2-column key/value, 8 gap, label 12/16 gray-700 left (160px fixed), value 14/20 Medium black right (flex-1). Used inside detail pages. On mobile: stack vertically (label full-width above value).
- Timeline: shadcn vertical stepper. Each step: 24px dot (filled when complete, ring when current, gray when pending) + line connector (2px gray-200, primary when complete) + content card (title 14 SemiBold, caption 12/16 gray-700 with time).
- Tabs (inside detail pages): horizontal underline tabs, 48px tall, active gets 2px bottom border primary + black label; inactive gray-700 label. Counter Badges allowed beside labels.

### REUSABLE PATTERN K — MOBILE RESPONSIVENESS (applies to ALL pages)
Every page must be fully responsive. Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px).

**Global responsive rules:**
- **Sidebar**: collapses to a hamburger menu (Sheet left) below lg. Bottom navigation bar (56px, 5 key icons) on mobile as alternative.
- **PageHeader (Pattern A)**: H1 shrinks to 24/32, right cluster wraps to a second row below md. Search input goes full-width. CTA button stays full-width on mobile.
- **FilterBar (Pattern B)**: horizontal scroll on mobile, chips wrap to 2 rows max at md. "Сохранить вид" moves into overflow DropdownMenu.
- **DataTable (Pattern C)**: below md, tables transform to **card list** layout — each row becomes a stacked Card showing key fields (identity + status + amount). Tap card → navigates to detail page. Checkbox selection hidden on mobile. Pagination becomes "Загрузить ещё" Button.
- **Detail Page (Pattern D)**: hero band stacks vertically (avatar/title above, actions below as full-width buttons). Tabs become horizontally scrollable. 2-column InfoRow grids become single-column. Action bar becomes a sticky bottom sheet.
- **Create/Edit Modal (Pattern E)**: becomes full-screen Sheet on mobile (100vh). Footer buttons stack full-width.
- **Bulk Actions (Pattern F)**: becomes a sticky bottom sheet (full-width, rounded top corners) on mobile.
- **Charts**: resize to container width, reduce to essential labels. Legends move below chart. Brush/zoom disabled on touch — use pinch instead.
- **KPI tiles**: 4-col → 2-col at md → 1-col at sm. Sparklines hidden at sm.
- **Tabs (Pattern J)**: become horizontally scrollable with fade indicators on overflow edges.
- **Typography scale**: H1 32→24, H2 24→20, H3 20→18 below md.
- **Touch targets**: all interactive elements minimum 44×44px on mobile.
- **Spacing**: padding 24→16 on mobile, gap-24→gap-12.

Confirm understanding of the addendum and patterns A–K, then wait for the Master Prompt 1a.
```

---

## 🧭 PROMPT 1a — MASTER (Multi-Page Brief)

```
With Foundation (Prompt 0) + App Shell (Prompt 2) + Patterns Addendum (Prompt 0a) loaded, here is the multi-page brief.

### SCOPE OF THIS BATCH
Build the following routes, each composed using the reusable patterns:

| Route                   | Title              | Roles allowed             |
|-------------------------|--------------------|---------------------------|
| /login                  | Вход               | Public                    |
| /applications           | Заявки             | All (Agent: branch-scoped)|
| /applications/:id       | Карточка заявки    | All                       |
| /clients                | Клиенты            | All (Agent: branch-scoped)|
| /clients/:id            | Карточка клиента   | All                       |
| /partners               | Партнёры           | Superadmin, Admin         |
| /partners/:id           | Карточка партнёра  | Superadmin, Admin         |
| /branches               | Филиалы            | Superadmin, Admin         |
| /branches/:id           | Карточка филиала   | Superadmin, Admin         |
| /users                  | Пользователи       | Superadmin, Admin         |
| /users/:id              | Карточка сотрудника| Superadmin, Admin         |
| /analytics              | Аналитика          | Superadmin, Admin, Op(view)|
| /telegram               | Telegram-бот       | Superadmin, Admin         |
| /notifications          | Центр уведомлений  | All                       |
| /audit                  | Журнал аудита      | Superadmin, Admin(view)   |
| /settings               | Настройки          | Superadmin                |
| /profile                | Профиль            | All                       |

### PAGE STRUCTURE TEMPLATE (every list page)
<AppShell>
  <PageHeader title + counter + actions />
  <FilterBar chips + clear + saved-views />
  <Card>
    <DataTable />
  </Card>
</AppShell>

When a row is clicked → **always navigates to a full detail page** at `/entity/:id` (Pattern D). No side drawers for entity details — every entity gets its own route with tabs and rich content.

### PERMISSION GATING
Render Superadmin's full view. Mark role-gated UI with a comment `{/* role:Superadmin */}` for fields hidden from lower roles. Do not duplicate components per role.

### URL STATE
Filters, sort, pagination, search query → URL query params (?status=approved&partner=alif&page=2). Allows shareable links.

### CONSISTENCY RULES
- Same column order across all tables: identity columns first (ID, avatar, name), domain attributes middle, status near end, actions last
- Same DropdownMenu actions across rows: View → Edit → Separator → role-gated destructive (Delete/Deactivate)
- Same keyboard shortcuts: `N` = new entity · `F` = focus filter · `/` = focus search · `Esc` = close dialog
- Same Toast pattern: success Toast top-right, auto-dismiss 4s, includes Undo button when applicable
- **All entity details are full pages** (Pattern D), never side drawers. Only config/settings panels use drawers (Pattern D2).
- **Every page is mobile responsive** (Pattern K) — tables → card lists, modals → full-screen sheets, layouts stack vertically, 44px touch targets.

### DELIVERY ORDER
I'll now send Prompts 2a–14a, one per page. Build each as a route component with the patterns library imported. Use realistic Russian mock data. After all pages are built, set up basic routing in `App.tsx`.

Confirm the brief and wait for Prompt 2a.
```

---

## 🔐 PROMPT 2a — LOGIN & AUTH SCREENS

```
Build the authentication flow at `/login`, `/login/2fa`, `/login/forgot-password`, `/login/reset-password/:token`.

### LAYOUT (shared by all auth screens)
Two-column, full viewport:
- Left (60%): brand panel
  - Background: primary yellow (#FFD60A)
  - Texnomart logo top-left (40px square + wordmark, black)
  - Centered: large illustration placeholder (a simple SVG of credit cards/wallet — use a Lucide icon 96px for now)
  - Below illustration: H1 "Кредитный брокер" black + Body L "Административная панель управления BNPL-агрегатором" gray-900
  - Bottom-left: caption "© Texnomart, 2026" + small links "Документация" "Поддержка"
- Right (40%): form panel
  - White bg, centered vertically and horizontally
  - Max-width 400px
  - Language selector top-right (DropdownMenu RU / O'zbek)

### SCREEN 1 — /login
Form panel content:
- H2 "Добро пожаловать" + Body M gray-700 "Войдите в свою учётную запись"
- Input: Email или телефон (with User icon left)
- Input: Пароль (with Lock icon left, eye toggle right)
- Row: shadcn Checkbox "Запомнить меня" + Link right "Забыли пароль?"
- Primary Button full-width "Войти"
- After 3 failed attempts: show Alert (warning variant) "Осталось 2 попытки. После блокировка на 15 минут."
- After 5 failed attempts: replace inputs with shadcn CAPTCHA placeholder + countdown "Заблокировано. Повторите через 14:23"

### SCREEN 2 — /login/2fa
- H2 "Двухфакторная аутентификация" + Body M "Введите 6-значный код из приложения Google Authenticator"
- shadcn InputOTP (6 boxes, 48×48, mono font 20px, primary focus ring)
- Caption "Не получили код?" + Link "Использовать резервный код"
- Primary Button "Подтвердить" full-width
- Bottom ghost link "← Вернуться к входу"

### SCREEN 3 — /login/forgot-password
- H2 "Восстановление пароля" + Body M "Введите email и мы пришлём ссылку для сброса"
- Tabs at top: "По email" / "По SMS" (segmented control)
- Input: Email (or phone, when SMS tab)
- Primary Button "Отправить инструкцию" full-width
- Success state: green CheckCircle2 icon 48px + "Письмо отправлено" + "Проверьте вашу почту. Ссылка действительна 30 минут."
- Bottom ghost link "← Вернуться к входу"

### SCREEN 4 — /login/reset-password/:token
- H2 "Новый пароль" + Body M "Придумайте надёжный пароль"
- Input: Новый пароль (with strength meter below — 4 segments, fills with red→orange→yellow→green as criteria are met)
- Helper rules below input (each row has CheckCircle2 16px in gray-400 → success when met):
   • Минимум 10 символов
   • Заглавные и строчные буквы
   • Хотя бы одна цифра
   • Хотя бы один спецсимвол
- Input: Подтвердите пароль (with match indicator)
- Primary Button "Сохранить пароль" full-width

### RESPONSIVE (Pattern K)
- Below lg (1024px): brand panel hides, form panel takes full width, Texnomart logo moves to top-center of form panel.
- Below md: form max-width becomes 100% with padding 16. Inputs and buttons go full-width.
- OTP input boxes: stay 48×48 but gap reduces. On very small screens (< 360px), boxes shrink to 40×40.
- Password strength meter: full-width below input, criteria list single-column.
- Language selector: moves from top-right to below the form on mobile.

### A11Y
- All inputs have visible labels above (not just placeholders)
- Error messages tied to inputs via aria-describedby
- Caps Lock indicator on password fields
- OTP input announces "Цифра X из 6" to screen readers

### DELIVERABLE
A `<AuthLayout>` with 4 child routes. Mock submit: 1.5s delay → success Toast or error Alert.
```

---

## 📄 PROMPT 3a — APPLICATIONS (List + Detail Drawer)

```
Build the Applications module at `/applications` (list) and `/applications/:id` (full detail page). This is the operational heart of the panel — optimize for speed and information density.

### PAGE HEADER
- H1 "Заявки" + Caption with live counter "Найдено 1 247 · обновлено только что" + pulsing green dot
- Right cluster: Tabs view-mode "Таблица" / "Канбан" (default Table) · Refresh icon Button · Export DropdownMenu · primary "+ Новая заявка"

### FILTER BAR (Pattern B)
Chips, in this order:
- Статус (multi-select, 11 application statuses from Pattern H)
- Партнёр (multi-select, list of partners)
- Филиал (multi-select)
- Оператор/Агент (multi-select)
- Период (date range picker; presets: Сегодня, Вчера, 7 дней, 30 дней)
- Сумма (range slider: 100k–50M UZS)
- Срок рассрочки (multi-select 1/3/6/12/24 мес)
- Канал поступления (multi-select: Онлайн, Приложение, Telegram, Филиал)

Active filter chips fill with the canonical yellow pill style. "Очистить фильтры" ghost button appears right.

### DATA TABLE (Pattern C)
Columns:
| Width | Column | Content |
|---|---|---|
| 40  | Checkbox | bulk |
| 110 | ID | mono "BR-12483", gray-700; copy-on-click |
| 140 | Создано | "15.05.26 14:32" with relative tooltip ("2 ч назад") |
| flex| Клиент | Avatar 32 + ФИО (14 Medium) + телефон below (12 gray-700) |
| 140 | Сумма | tabular-nums 14 SemiBold + "UZS" caption + срок ("на 6 мес" 12 gray-700) |
| 160 | Партнёр(ы) | small logo 16 + name; if multiple partners → AvatarGroup of partner logos (max 3 + "+2") |
| 140 | Филиал | name; truncate; tooltip on overflow |
| 130 | Оператор | Avatar 24 + name; "—" if unassigned |
| 160 | Статус | Pattern H Badge |
| 56  | Actions | MoreHorizontal → Открыть, Одобрить, Отклонить, Переназначить, Скопировать ID |

Row height: 72px (taller because of client subtext + amount stack).
Row click → navigates to `/applications/:id` detail page.

### KANBAN VIEW (toggle)
- 6 columns: Новая · На скоринге · В работе у оператора · Ожидает документы · Одобрена · Отклонена
- Each column: header with status Badge + count
- Cards (radius md, padding 12, gap-8 between): ID, client name, amount, partner logo, time-since
- Drag-and-drop to change status (Operator/Admin only)
- Column scroll independently

### BULK ACTIONS TOOLBAR (Pattern F, appears when rows selected)
"Выбрано: N" + actions: Одобрить, Отклонить, Переназначить оператора, Экспорт, Удалить.

### DETAIL PAGE — /applications/:id (Pattern D, full route)

**Back navigation:** "← Назад к заявкам" ghost link top-left, preserves list filters via URL params.

**Hero band (white Card, padding 24):**
- Left: "Заявка BR-12483" H2 + Status Badge inline + created date caption
- Right actions: "Одобрить" (success Button), "Отклонить" (danger Button), MoreHorizontal (Переназначить, Запросить документы, Скопировать ссылку)

**Tabs:** Сводка · Клиент · Этапы · Партнёры · Документы · Комментарии · История

**Tab 1 — Сводка:**
- 2-column grid of InfoRow Cards:
  - Card "Основные данные": Сумма: 4 200 000 UZS, Срок: 6 месяцев, Создана: 15.05.2026 14:32, Канал: Мобильное приложение
  - Card "Назначение": Филиал: ТЦ Малика, Ташкент, Оператор: Алина Петрова (Avatar inline)
- Card "Банковские карты": list of cards — Visa/Mastercard logo + maskedNumber "**** 4521" + bank name + проверка status (Pattern H Badge: Проверена/Отклонена)

**Tab 2 — Клиент:**
- Card with composite block:
  - Avatar 48 + ФИО (16 SemiBold) + ПИНФЛ + телефон
  - Скоринг inline: large number "742" + caption "из 1000" + horizontal progress bar (3px, fills success green for ≥700)
  - Link "Открыть карточку клиента →" (primary, navigates to `/clients/:id`)
- Card "Контактная информация": телефон, email, адрес

**Tab 3 — Этапы обработки:**
- Pattern J Timeline (full-width Card):
  - ✓ Подача заявки — 14:32
  - ✓ Скоринг отправлен — 14:33 (длительность 1 сек)
  - ✓ Получен ответ Alif Nasiya — 14:34 (53 сек) — "Одобрено"
  - ◐ Подписание договора — в процессе
  - ○ Завершение — ожидается

**Tab 4 — Решения партнёров:**
- DataTable inside Card:
  | Партнёр | Время отправки | Время ответа | Решение | Сумма одобрения | Причина |
  3 rows: Alif (Одобрено 4 200 000), Anorbank (Отклонено — низкий скоринг), Uzum (Не отвечает)

**Tab 5 — Документы клиента:**
- Grid of doc thumbnails (120×120, radius md, border):
  - Паспорт (лицевая), Паспорт (разворот), Селфи с паспортом, ИНН
  - Hover: dark overlay with Download + Eye icons
  - "+ Загрузить" tile (dashed border, primary on hover)

**Tab 6 — Комментарии операторов:**
- Comment thread (full-width Card):
  - Each: Avatar 28 + name + timestamp + comment text in a gray-100 bubble
  - Compose box at bottom: Textarea + "Добавить комментарий" Button + "Внутренний" Switch (default on)

**Tab 7 — История изменений (audit):**
- Compact timeline list: 12px timestamp + "Алина Петрова изменила статус: На скоринге → Одобрена"
- Link "Открыть полный аудит →"

**Sticky action bar (bottom, visible when changes pending):**
- Left ghost: "Скачать PDF договора"
- Right primary: "Сохранить изменения" (disabled until something changed)

### MOCK DATA (10 applications, sample first 3)
1. BR-12483 · 15.05 14:32 · Алиев Озодбек +998 90 123 45 67 · 4 200 000 UZS / 6 мес · Alif · ТЦ Малика · Алина П. · Одобрена
2. BR-12482 · 15.05 14:28 · Каримова Дилнура +998 91 234 56 78 · 1 850 000 UZS / 3 мес · Uzum · Чорсу · — · На скоринге
3. BR-12481 · 15.05 14:21 · Юсупов Жасур +998 93 345 67 89 · 7 600 000 UZS / 12 мес · Anorbank · Самарканд · Бекзод К. · В работе у оператора
(generate 7 more, varied)

### RESPONSIVE (Pattern K)
- Below md: table transforms to card list — each card shows ID, client name, amount, status Badge, partner logo. Tap → `/applications/:id`.
- Kanban: below lg collapses to a single column with status filter tabs above (horizontally scrollable).
- Detail page: hero band stacks vertically, tabs scroll horizontally, InfoRow grids go single-column, action bar becomes sticky bottom sheet with full-width buttons.
- Document grid: 2-col at sm, 3-col at md, 4-col at lg.

### DELIVERABLE
Two routes: `/applications` (list with table + kanban views) and `/applications/:id` (full detail page with tabs).
```

---

## 👥 PROMPT 4a — CLIENTS (List + Detail Page)

```
Build Clients at `/clients` (list) and `/clients/:id` (full detail page with tabs — too rich for a drawer).

### LIST PAGE — /clients

**PageHeader:**
- H1 "Клиенты" + Caption "Всего 124 580 · Активных 38 921"
- Right: Search 320px ("Поиск по ФИО, телефону, ПИНФЛ"), Refresh, Export, primary "+ Добавить клиента"

**FilterBar chips:**
- Статус (Активен, Неактивен, Заблокирован)
- Скоринг (range slider 0–1000)
- Регион (multi-select)
- Наличие заявок (Toggle: Есть / Нет)
- Чёрный список (Toggle)
- VIP (Toggle)
- Дата регистрации (range)
- Последняя активность (presets: 24ч / 7д / 30д / нет активности)
- Сумма рассрочек (range)

**Table columns:**
| Width | Column | Content |
|---|---|---|
| 40 | ☐ | bulk |
| 80 | ID | "CL-00428" mono |
| flex | Клиент | Avatar 36 + ФИО Medium + "ПИНФЛ ••••5821" 12 gray-700 |
| 140 | Телефон | "+998 90 ••• 45 67" + masked icon, click to reveal |
| 100 | Скоринг | number 14 SemiBold + colored dot (red <500, yellow 500-700, green >700) |
| 100 | Заявок | count + tooltip breakdown |
| 160 | Сумма рассрочек | tabular-nums + UZS |
| 140 | Регистрация | "12.03.24" + relative tooltip |
| 140 | Активность | "2 ч назад" or gray "30+ дней" |
| 120 | Флаги | Pattern H Badges: VIP (primary), Чёрный список (danger), inline gap-4 |
| 56 | Actions | Открыть, Отправить SMS, Заблокировать, Добавить в чёрный список |

Row height 64px. Click → routes to `/clients/:id`.

### DETAIL PAGE — /clients/:id

**Page header with hero band (white card, padding 24):**
- Left: Avatar 80px + (ФИО 24 SemiBold, ПИНФЛ + телефон 14 gray-700, flags inline as Badges)
- Right: action cluster — "Связаться" DropdownMenu (Позвонить, SMS, Telegram), "Сбросить пароль" ghost, MoreHorizontal (Заблокировать, Добавить в чёрный список, Удалить — destructive)
- Below hero: 4-up stat tiles (no card, just InfoRow style) — Скоринг (with progress bar), Активных рассрочек, Всего заявок, LTV

**Tabs (Pattern J):**
1. Профиль · 2. Финансы · 3. Заявки (counter Badge) · 4. Активность · 5. Комментарии и теги

**Tab 1 — Профиль:**
- 2-column grid of section Cards (padding 24, radius lg):
  - Card "Персональные данные": InfoRow ФИО, дата рождения, пол, ПИНФЛ, паспорт серия/номер
  - Card "Контакты": телефон основной/доп, email, адрес проживания (with mini map preview if address geocodable)
  - Card "Документы": grid of thumbnails (паспорт, разворот, селфи, ИНН) with Download/View on hover + "+ Загрузить"
  - Card "Дополнительно": семейное положение, иждивенцы

**Tab 2 — Финансы:**
- Card "Привязанные карты": list of cards (logo + masked + bank + проверка Badge)
- Card "Активные рассрочки": list of active installments — partner logo + remaining sum + due date + progress bar
- Card "История платежей": Table (дата, сумма, рассрочка ID, статус)
- Card "Кредитный рейтинг": large number + Recharts mini gauge + breakdown bullets

**Tab 3 — Заявки:**
- Same DataTable as the global Applications list, filtered to this client
- Above table: 2 Recharts mini-charts — "Заявки по месяцам" (line) + "Доля одобрений" (donut)

**Tab 4 — Активность:**
- Vertical Timeline (Pattern J) — entries: входы, попытки заявок, обращения в поддержку, изменения профиля
- Filter Tabs above timeline: Все / Входы / Заявки / Поддержка / Профиль

**Tab 5 — Комментарии и теги:**
- Left column: Comment thread (same composer as Applications drawer)
- Right column: Tags editor — chip input, suggested tags ("VIP", "Проблемный", "Новый"), each tag has × to remove

### CREATE/EDIT MODAL (Pattern E)
2-column form (720px wide). Sections inside the Dialog: Персональные данные, Контакты, Документы (upload tiles).
On mobile: full-screen Sheet, single-column form.

### RESPONSIVE (Pattern K)
- Below md: table → card list (Avatar + ФИО + скоринг dot + last activity). Tap → `/clients/:id`.
- Detail page hero: stacks vertically, stat tiles go 2×2 grid at sm.
- Tabs: horizontally scrollable at sm.
- Profile tab: 2-col grid → single column at md.
- Finance tab: card list and charts stack vertically, charts resize to container.

### DELIVERABLE
Two routes. Use mock client "Алиев Озодбек, CL-00428" as the default detail view.
```

---

## 🤝 PROMPT 5a — PARTNERS (List + Detail Page)

```
Build Partners at `/partners` and `/partners/:id`.

### LIST PAGE — /partners

**PageHeader:**
- H1 "Партнёры" + Caption "Всего 8 · Активных 7 · Офлайн 1"
- Right: Tabs view-mode "Карточки" / "Таблица" (default Cards) · Refresh · Export · primary "+ Добавить партнёра"

**FilterBar chips:**
- Статус (Активен / Деактивирован)
- Тип партнёра (BNPL / Банк / МФО)
- API-статус (Онлайн / Офлайн / Деградация)
- Регионы покрытия (multi)

**CARDS VIEW (default):**
Grid 3 cols at xl, 2 at md, 1 at sm. Each Card (radius lg, padding 24, hover shadow-md):
- Top row: Logo 48×48 (rounded sm) + (Name 16 SemiBold, Legal name 12 gray-700) + status toggle Switch on the right
- Middle row: 3 mini-metrics inline — Заявки сегодня (number + label), Конверсия (% + label), Среднее время (sec + label)
- API health pill: Pattern H Badge Онлайн/Офлайн/Деградация — bottom-left
- Bottom right: "Открыть →" ghost link primary

**TABLE VIEW (toggle):**
Columns: Logo+Name, Активен (Switch), API-статус, Заявок сегодня, Конверсия, Среднее время скоринга, Регионы (count + tooltip), Actions.

### DETAIL PAGE — /partners/:id

**Hero band:**
- Logo 64 + (Name H2, Legal name + description 14 gray-700 max-w-prose)
- Right: status Switch (large), "Проверить подключение" Button (variant secondary, with Plug icon), MoreHorizontal (Деактивировать, История изменений, Удалить)

**Tabs:**
1. Обзор · 2. Условия кредитования · 3. API-настройки (Superadmin only) · 4. Финансы · 5. Статистика · 6. История изменений

**Tab 1 — Обзор:**
- 2-column. Left Card "Основная информация" — InfoRow ЮрНаименование, Описание, Контакты, SLA, Ответственный
- Right Card "Регионы покрытия" — list with toggle Switches per region; "Выбрать все" link top-right
- Bottom Card "Категории товаров" — chip multi-select

**Tab 2 — Условия кредитования:**
- Card "Сроки рассрочки":
  - Grid 15 chips for terms 1/2/3/4/5/6/7/8/9/10/11/12/18/24/36 мес
  - Each chip is a toggleable button: yellow pill when active, gray outline when off
  - Live preview below: "Доступные сроки для клиента: 3, 6, 12 мес"
- Card "Лимиты": InfoRow with Inputs — Минимальная сумма, Максимальная сумма, Минимальный возраст, Максимальный возраст
- Save bar sticky bottom: "Отменить" ghost + "Сохранить изменения" primary

**Tab 3 — API-настройки (Superadmin only — wrap in role check):**
- Card "Конфигурация API":
  - Tabs Production / Sandbox
  - Input API URL
  - Input API Key (password-masked with eye toggle + Copy button + RefreshCw "Ротация" Button → triggers confirm Dialog)
  - Input Secret (same pattern)
  - Input Webhook URL
- Card "Расписание работы":
  - Time range pickers per weekday — Пн–Пт 09:00–22:00, Сб 10:00–20:00, etc.
- Card "Таймауты и retry":
  - Input Timeout (ms)
  - Input Retry count
  - Input Retry delay (ms)
- Right top: "Проверить подключение" Button → shows result Alert below ("Соединение установлено, время отклика 124 мс")

**Tab 4 — Финансы:**
- Card "Комиссия партнёра":
  - Radio group: Фикс / Процент / Гибрид
  - Conditional Inputs based on choice
- Card "Условия выплат": rules editor
- Card "История взаиморасчётов": Table (период, выдано, комиссия, выплачено, остаток, статус)

**Tab 5 — Статистика:**
- 4 KPI tiles (smaller variant of Dashboard KPIs): Всего заявок, Одобрено, Конверсия, Средний чек
- Recharts area chart "Заявки по дням" full-width, period switcher Tabs
- Donut "Распределение по статусам"
- Bar "Заявки по часам суток"

**Tab 6 — История изменений:**
- Pattern J Timeline — каждое изменение: кто, когда, что (old → new)
- Filter: тип изменения

### CREATE/EDIT MODAL (Pattern E, 720px)
Stepper-style multi-step Dialog (3 steps): Основная информация → Условия → API. Stepper at top (Pattern J horizontal). "Назад" / "Далее" / "Создать" buttons.
On mobile: full-screen Sheet, vertical stepper, single-column.

### RESPONSIVE (Pattern K)
- Cards view: 3-col → 2-col at md → 1-col at sm. Cards become full-width.
- Table view: below md → card list (Logo + Name + API status + conversion).
- Detail page hero: stacks vertically, status Switch below name.
- Tabs: horizontally scrollable at sm.
- API settings tab: Production/Sandbox tabs stay, form inputs go full-width single-column.
- Statistics tab: KPI tiles 2×2 at sm, charts stack vertically and resize.
- Time range pickers (schedule): stack vertically per day at sm.

### DELIVERABLE
Two routes. Mock 6 partners: Alif Nasiya, Anorbank, Uzum Nasiya, Iman, Multicard, Asia Alliance.
```

---

## 🏪 PROMPT 6a — BRANCHES (List + Detail Page + Priorities)

```
Build Branches at `/branches` and `/branches/:id`. The priorities-with-schedule feature is the unique complexity here — give it special care.

### LIST PAGE — /branches

**PageHeader:**
- H1 "Филиалы" + Caption "Всего 47 · Активных 45"
- Right: Tabs "Список" / "Карта" (default List) · Refresh · Export · primary "+ Добавить филиал"

**FilterBar chips:**
- Регион (multi)
- Статус (Активен / Неактивен)
- Наличие активных партнёров (toggle)
- Количество сотрудников (range)

**Table columns:**
| Col | Width |
|---|---|
| Название | flex |
| Адрес | flex (truncate, tooltip full) |
| Регион | 140 |
| Сотрудников | 100 (count + AvatarGroup max 3) |
| Активные партнёры | 140 (count + "Alif, Uzum, +3" tooltip) |
| Заявок за день | 100 (number + delta) |
| Статус | 120 (Pattern H Badge) |
| Actions | 56 |

Row click → `/branches/:id`.

**MAP VIEW (toggle):**
- Full-area Uzbekistan map (same SVG approach as Dashboard Geography)
- Markers per branch, color by status (yellow active, gray inactive)
- Click marker → popup Card (compact summary + "Открыть филиал" Button)
- Filters from FilterBar apply to map markers

### DETAIL PAGE — /branches/:id

**Hero band:**
- Left: H2 branch name + Caption with address + region · Phone · Hours
- Right: Status Switch, "На карте" Button (opens Popover with mini map), MoreHorizontal

**Tabs:**
1. Общая информация · 2. Сотрудники · 3. Партнёры филиала · 4. Приоритеты (★ unique) · 5. Статистика

**Tab 1 — Общая информация:**
- 2-col grid. Card "Основное" — InfoRow Название, Адрес, Координаты, Телефон, Режим работы, Руководитель (Avatar + name). Card "Локация" — embedded mini map (200px tall) with single pin.

**Tab 2 — Сотрудники:**
- Mini table of assigned agents: Avatar+name, role, телефон, заявок за месяц, действия
- "+ Прикрепить сотрудника" Button top-right → opens Dialog with search of all users

**Tab 3 — Партнёры филиала:**
- List of all partners (same as global list but with toggle per partner to enable for this branch)
- Each row expanded shows term selection (chip grid from Partner Conditions, but scoped to this branch)

**Tab 4 — Приоритеты (the special one):**
Layout: two stacked Cards.

**Card A — "Текущий активный приоритет":**
- Live preview based on current time
- Reads: "Сейчас 14:32 (Среда) — действующий приоритет:"
- Below: ordered list of partners 1–N with logos, like a podium
- "Открыть редактор расписания ↓" link scrolls to Card B

**Card B — "Редактор расписания":**
- Top: Tabs for day-of-week (Пн / Вт / Ср / Чт / Пт / Сб / Вс) + "Все дни" tab
- Below tabs: 24-hour timeline visualization
  - Horizontal band 80px tall, divided into 24 hourly columns
  - Each partner has a row above the timeline
  - Drag handles to set start/end of priority window for each partner
  - Overlapping windows show in a stacked manner
  - Active range: filled with partner brand color; inactive: gray-100
  - Tooltip on drag: "Alif Nasiya: 10:00–18:00, приоритет 1"

- Below timeline: drag-and-drop ranked list of partners
  - Each row: drag handle (GripVertical icon 16, ghost), priority number badge (1–10), partner logo + name, time range chips (editable Popover), action menu (Удалить из расписания)
  - Drag to reorder priority (1 = highest)
  - "+ Добавить партнёра" Button at bottom of list

- Bottom of card: sticky save bar "Отменить" / "Сохранить расписание" + "Применить ко всем дням" secondary action

**Tab 5 — Статистика:**
- 4 KPI tiles: Заявок за день, Заявок за месяц, Конверсия, Топ-партнёр
- Recharts line "Динамика заявок"
- Bar "Топ агентов филиала"
- Bar "Топ партнёров филиала"

### CREATE/EDIT MODAL (Pattern E)
Form fields: Название, Адрес (with autocomplete + map preview pin draggable), Регион, Телефон, Режим работы (time pickers per day), Руководитель (User picker).
On mobile: full-screen Sheet, single-column, map preview below address input.

### RESPONSIVE (Pattern K)
- Below md: table → card list (Name + Region + status + employee count). Tap → `/branches/:id`.
- Map view: takes full width, markers stay interactive, popup Card becomes bottom sheet on mobile.
- Detail page hero: stacks vertically, "На карте" opens full-screen map overlay on mobile.
- Priorities editor (Tab 4): 24-hour timeline becomes a vertical scrollable list on mobile — each partner row shows time range as text chips (not drag handles). Drag-reorder still works via touch-and-hold on the grip handle. Timeline visualization hidden below md, replaced by compact list.
- Statistics tab: KPI tiles 2×2, charts stack vertically.
- Employees tab: mini table → card list on mobile.

### DELIVERABLE
Two routes. Use 10 mock branches across UZ regions. Priorities editor must work — drag-reorder and time-range edit are both functional with local state.
```

---

## 👤 PROMPT 7a — SYSTEM USERS (List + Detail Drawer)

```
Build Users at `/users` (list) and `/users/:id` (full detail page).

### PAGE HEADER
- H1 "Пользователи" + Caption "Всего 124 · Активных 118"
- Right: Search · Refresh · Export · primary "+ Пригласить пользователя"

### FILTER BAR
- Роль (Superadmin / Admin / Operator / Agent)
- Филиал (multi, only relevant for Agent/Operator)
- Статус (Активен / Деактивирован)
- Дата создания (range)
- Последний вход (presets)

### DATA TABLE
| Col | Width |
|---|---|
| ☐ | 40 |
| Сотрудник | flex (Avatar 36 + ФИО 14 Medium + email 12 gray-700) |
| Телефон | 140 |
| Роль | 140 (Pattern H Badge styled per role: Superadmin black bg / Admin yellow / Operator info-blue / Agent gray) |
| Филиал | 160 ("—" if N/A) |
| Статус | 120 (Активен / Деактивирован) |
| Последний вход | 160 ("Сегодня 09:14" + tooltip with IP) |
| Создан | 140 |
| Actions | 56 (Открыть, Сбросить пароль, Деактивировать, Удалить) |

Row height 64. Click → navigates to `/users/:id` detail page.

### DETAIL PAGE — /users/:id (Pattern D, full route)

**Back navigation:** "← Назад к пользователям" ghost link top-left.

**Hero band (white Card, padding 24):**
- Left: Avatar 64 + ФИО H2 + email caption + role Badge + status Badge
- Right: status Switch (large) + "Сбросить пароль" Button + MoreHorizontal (Деактивировать, Сбросить 2FA, Удалить — destructive)

**Tabs:** Информация · Безопасность · Сессии · Активность · Статистика

**Tab 1 — Информация:**
- Card "Личные данные" — 2-col InfoRow: ФИО, email, телефон, дата создания, кем создан
- Card "Роль и доступ" — Роль (Select for Superadmin/Admin), Филиал (Select if role is Operator/Agent), доп. разрешения

**Tab 2 — Безопасность:**
- Card "Аутентификация": 2FA включена (Switch), последний пароль изменён, кол-во неудачных входов · "Сбросить 2FA" Button · "Сбросить пароль" Button
- Card "Политики безопасности": applied password policy summary, compliance status

**Tab 3 — Сессии:**
- Card "Активные сессии": list of session rows — device + browser + IP + location + login time + "Завершить" Button per row
- Card "История входов (последние 20)": Table (дата/время, IP, локация, устройство, результат: успех/ошибка/блокировка)

**Tab 4 — Активность (audit):**
- Timeline of last 20 audit entries
- Link "Открыть полный аудит →" (navigates to `/audit` filtered by this user)

**Tab 5 — Статистика (only for Operator/Agent):**
- KPI tiles: Обработано заявок, Конверсия, Среднее время отклика, Активные клиенты
- Recharts line "Обработанные заявки по дням"
- Bar "Конверсия по месяцам"

**Sticky action bar:**
- Left: "Удалить пользователя" destructive ghost
- Right: "Сохранить изменения" primary (disabled until changes)

### CREATE/INVITE MODAL (Pattern E)
- Tabs at top: "Пригласить по email" (default) / "Создать с временным паролем"
- Fields: Avatar uploader, ФИО, email, телефон, роль (Select), филиал (Select if role requires), checkbox "Отправить инструкцию по входу"
- Bottom: "Отмена" / "Пригласить"

### SYNC PANEL (special section above the table when expanded)
- Collapsible Card "Синхронизация с 1С / брокером / партнёрами"
- Inside: 3 sync status rows (1С / Брокер / Партнёры), each with last-sync time, "Запустить" Button, expand to see log
- Configure schedule Button → opens Dialog with cron-style picker

### RESPONSIVE (Pattern K)
- Below md: table → card list (Avatar + ФИО + role Badge + status). Tap → `/users/:id`.
- Detail page hero: stacks vertically, action buttons become full-width.
- Tabs: horizontally scrollable at sm.
- Sessions list: compact layout, IP hidden, device + time shown.
- Statistics tab: KPI tiles 2×2, charts stack and resize.
- Invite modal: full-screen Sheet on mobile, single-column.

### DELIVERABLE
Two routes: `/users` (list) and `/users/:id` (detail page with tabs). 12 mock users across all roles.
```

---

## 📈 PROMPT 8a — ANALYTICS (Full Page)

```
Build the Analytics page at `/analytics`. This is the deepest data view in the app — denser than the Dashboard, focused on comparisons and segmentation.

### PAGE HEADER
- H1 "Аналитика" + Caption period summary "01.05.2026 – 18.05.2026 · 18 дней"
- Right: "Сравнить с прошлым" Switch + label · Export DropdownMenu · primary "Создать отчёт"

### CONTROL BAR (just below header, gray-100 surface, padding 16, radius md)
Three groups separated by Separators (vertical):
1. **Период** — segmented control "Сегодня / Вчера / 7 дней / 30 дней / 3 мес / 6 мес / 1 год / Произвольный..."
   - "Произвольный" opens a date range picker Popover
2. **Сравнение** — when ON: shows the comparison period to the right ("vs 13.04–30.04, +12.4% общая динамика")
3. **Группировка** — Select dropdown:
   - По партнёрам (default)
   - По филиалам
   - По операторам / агентам
   - По статусам
   - По продуктам / категориям
   - По срокам рассрочки
   - По возрастным группам
   - По регионам

### METRICS GRID (4×2, expandable)
8 KPI tiles, same pattern as Dashboard but with comparison values:
1. Количество заявок — value + delta + comparison line
2. Сумма заявок (запрошено) — value + delta
3. Сумма одобрено — value + delta
4. Сумма выдано — value + delta
5. Конверсия (Approval Rate) — value + delta
6. Среднее время рассмотрения — value + delta (inverted: down = good)
7. Доля повторных заявок (Repeat Rate) — value + delta
8. LTV клиента — value + delta

Click any tile → that metric becomes the focus of the main chart below.

### MAIN CHART (full-width, 480px tall)
- Recharts composed chart for the currently focused KPI
- Two series when "Сравнение" is on: current period (primary line) + comparison period (gray-700 dashed)
- Brush component at the bottom for zooming time range
- Tabs above chart: "По дням" / "По часам" / "По неделям" (granularity)
- Right above chart: chart-type toggle (Line / Bar / Area) ToggleGroup

### GROUPING TABLE (below main chart)
Title "Разбивка: По партнёрам" (matches Группировка selector).
A DataTable showing rows per group with these columns:
- Group name (e.g., "Alif Nasiya" with logo)
- Заявок (count + sparkline 60×16)
- Конверсия (% + horizontal bar visual, fills primary)
- Среднее время (sec)
- Сумма выдано (UZS, tabular)
- Доля от общего (% bar)
- Δ vs прошлый период (signed %, color-coded)
- Click row → drills into that group (chart re-scopes)

Sort by any column. "Показать все" / "Свернуть" if >10 rows.

### COHORT ANALYSIS BLOCK (collapsible Card, default closed)
Title "Когортный анализ"
- Heatmap table: rows = month of acquisition, columns = months 0–11 since acquisition, cells = retention % colored on a scale (light yellow → dark yellow → black)
- Hover cell: Tooltip with absolute counts

### REPORTS PANEL (lower section, full-width Card)
Title "Отчёты" + "Создать отчёт" primary right.

**Sub-tabs:** Сгенерированные / Расписание / Шаблоны

- **Сгенерированные:** Table of last 10 generated reports — Название, Тип, Период, Автор, Дата создания, Статус (Готов / В процессе / Ошибка — Pattern H), Размер, Действия (Скачать, Поделиться, Удалить)
- **Расписание:** list of scheduled reports — name, frequency (Daily/Weekly/Monthly with cron-friendly display), recipients (AvatarGroup), next run time, on/off Switch, Edit/Delete actions
- **Шаблоны:** Grid of report-type cards — for each: icon + title + description + "Сгенерировать" Button. Templates: Сводный, Детализированный, По партнёрам, По филиалам, Финансовый, По операторам, Когортный

### CREATE REPORT MODAL (Pattern E, 720px)
Multi-step:
1. Тип отчёта (radio grid of templates)
2. Параметры (period, group-by, partners filter, branches filter, metrics include)
3. Формат и доставка (Excel/CSV/PDF, email recipients, schedule on/off, frequency)

### RESPONSIVE (Pattern K)
- Control bar: stacks vertically at md — period selector full-width, comparison and grouping below.
- KPI grid: 4×2 → 2×4 at md → single column at sm. Comparison values shown inline below main value.
- Main chart: full-width, height reduces to 320px at md, 240px at sm. Brush hidden at sm. Chart-type toggle → dropdown on mobile.
- Grouping table: below md → card list (group name + key metric + delta). Sparklines hidden.
- Cohort heatmap: horizontal scroll with sticky first column (month labels).
- Reports panel: table → card list on mobile. Create report modal → full-screen Sheet.
- Period segmented control: becomes a Select dropdown at sm.

### DELIVERABLE
One route, dense layout. Mock data for all comparisons. Comparison switch state controls visibility of comparison series and delta indicators globally.
```

---

## 🤖 PROMPT 9a — TELEGRAM BOT

```
Build Telegram Bot management at `/telegram`. Tabs structure inside a single route.

### PAGE HEADER
- H1 "Telegram-бот" + Caption with bot username "@texnomart_bot · Подписчиков 8 423"
- Right: master Switch (large) "Бот включён" + Refresh + primary "Создать рассылку"

### TABS
1. Общие настройки · 2. Шаблоны сообщений · 3. Рассылки · 4. Подписчики · 5. Аналитика · 6. FAQ и автоответы

### TAB 1 — Общие настройки
- Card "Подключение":
  - Token (password-masked, eye toggle, Copy, RefreshCw ротация)
  - Webhook URL (read-only with Copy)
  - "Проверить webhook" Button → status Alert below
- Card "Приветствие":
  - Language tabs RU / O'zbek
  - Textarea for welcome message + variable hints panel right ({{name}}, {{branch}}...)
  - Preview Card on the right side showing how the message renders in Telegram-style bubble
- Card "Меню бота (команды)":
  - Editable list: command + description, drag-to-reorder, add/remove
- Card "Разрешённые команды":
  - Toggleable list of commands with descriptions

### TAB 2 — Шаблоны сообщений
- Grid of template Cards (3 per row): each shows template name, language Badges (RU / UZ), preview snippet, last edited
- Categories Tabs above grid: Все / Приветствия / Статусы заявок / Напоминания / Маркетинг
- Click card → opens Edit Drawer (Pattern D):
  - Language tabs RU / UZ (Cyr) / UZ (Lat)
  - Textarea with variable picker dropdown
  - Live preview on right side
  - Test send: input phone/username + "Отправить тест" Button

### TAB 3 — Рассылки
- DataTable: Название, Сегмент аудитории (chip), Шаблон (link), Запланировано на, Прогресс (progress bar + "Отправлено 1 234 / 8 423"), Доставлено %, Прочитано %, Кликов, Статус, Actions
- "+ Создать рассылку" primary opens multi-step Dialog:
  1. Аудитория (segment builder: all / by status / by sum / by region / by tags)
  2. Шаблон (pick from library or compose new)
  3. Время отправки (now / scheduled with date-time)
  4. A/B test (optional: 2 variants with traffic split slider)
  5. Превью и подтверждение

### TAB 4 — Подписчики
- DataTable: Avatar (TG photo placeholder), @username, ФИО (if linked to client), дата подписки, последняя активность, кол-во сообщений, статус (Подписан / Заблокирован), Actions (Бан / Разбан)
- FilterBar: статус, дата подписки, активность

### TAB 5 — Аналитика
- KPI tiles: DAU, MAU, Подписчиков, Активность (нажатий за день)
- Recharts area "DAU / MAU за период"
- Funnel chart: Подписка → Первый клик → Первая заявка → Одобрено
- Recharts bar "Топ команд"
- Recharts line "Retention rate (D1, D7, D30)"

### TAB 6 — FAQ и автоответы
- Two sub-sections, 50/50 split:
  - **FAQ:** sortable list — Q & A, language tabs, Active toggle per item, "+ Добавить вопрос"
  - **Автоответы:** rule rows — IF (keyword/regex) THEN (template), Active toggle, "+ Добавить правило"

### RESPONSIVE (Pattern K)
- Tabs: horizontally scrollable at sm.
- Settings tab: welcome message textarea + preview stack vertically. Preview Card below textarea.
- Templates tab: grid 3-col → 2-col at md → 1-col at sm. Edit view: language tabs + textarea + preview stack vertically.
- Broadcasts tab: table → card list (Name + status + progress bar + delivery %). Create broadcast dialog → full-screen Sheet with vertical steps.
- Subscribers tab: table → card list (avatar + username + status).
- Analytics tab: KPI tiles 2×2, charts stack vertically, funnel chart simplifies.
- FAQ tab: 50/50 split → stacks vertically at md. FAQ above, auto-replies below.

### DELIVERABLE
One route with 6 tabs. Use realistic mock subscriber counts and message templates.
```

---

## 🔔 PROMPT 10a — NOTIFICATIONS CENTER

```
Build `/notifications` — the full notifications history page (the bell in the header opens a Popover preview; this is the detailed view).

### PAGE HEADER
- H1 "Уведомления" + Caption "Непрочитано: 7 · Всего за месяц: 312"
- Right: "Прочитать все" ghost · "Настройки уведомлений" Button (Settings icon) → opens Drawer (see below)

### FILTER BAR
- Status: Все / Непрочитанные / Прочитанные (segmented control)
- Type chips (multi-select): Заявки, Партнёры, Безопасность, Система, Аномалии
- Severity chips: Критично / Внимание / Информация / Норма (Pattern H severity colors)
- Date range

### NOTIFICATIONS LIST (single column, full-width)
- Group by day (sticky day header "Сегодня · 14 уведомлений", "Вчера", "Понедельник 12.05", ...)
- Each row 80px tall:
  - Left: severity icon (24px) in colored circular badge (semantic bg @ 15%)
  - Middle (flex-1): Title 14 SemiBold + Body 12 gray-700 (truncate to 2 lines) + tags inline (small Badges for type)
  - Right cluster: relative time (12 gray-700) + Action chip Button (if applicable) + unread dot (8×8 primary)
- Unread row: white bg with subtle yellow accent on left (3px primary border-left)
- Read row: gray-100 bg, dimmed text
- Row hover: shows secondary icon-buttons at far right (Mark read/unread, Archive, Delete)
- Row click: marks read + routes to source

### EMPTY STATE
Lucide BellOff icon 48 + "Уведомлений нет" + "Все важные события будут появляться здесь"

### NOTIFICATIONS SETTINGS DRAWER (Pattern D2 — config drawer, opens from "Настройки уведомлений" button)
Width 720. Inside:

- Section "Тихие часы":
  - Switch "Включить тихие часы"
  - Time range picker (from–to)
  - Day selector chips (Пн–Вс, multi-select)

- Section "Матрица каналов" — Table:
  - Rows = notification types (Новая заявка, Изменение статуса, Партнёр недоступен, Аномалия, Системные, Безопасность)
  - Columns = channels (В системе, Email, SMS, Push, Telegram)
  - Cells = Switch toggles
  - Header row sticky inside drawer

- Section "Сводки":
  - Switch "Получать ежедневную сводку на email"
  - Time picker for delivery
  - Switch "Получать еженедельный отчёт"

- Footer: "Сохранить настройки" primary

### RESPONSIVE (Pattern K)
- Notification list: full-width works well on mobile. Row height stays 80px. Action chips stack below title on sm.
- Day group headers: sticky on scroll.
- Filter bar: severity chips become horizontally scrollable. Segmented control (All/Unread/Read) stays top.
- Settings drawer: becomes full-screen Sheet on mobile. Channel matrix table: horizontal scroll with sticky first column (notification type). Switches stay tappable (44×44 touch target).
- Empty state: icon + text centered, CTA full-width.

### DELIVERABLE
One route + settings Drawer (Pattern D2). Mock 30 notifications across types, severities, statuses.
```

---

## 📜 PROMPT 11a — AUDIT LOG

```
Build `/audit` — the audit log and system logs view. Superadmin sees all tabs; Admin sees only the user-actions tab.

### PAGE HEADER
- H1 "Журнал аудита" + Caption "Всего записей: 124 580"
- Right: Refresh · Export · "Настроить алерты" Button (Bell icon, Superadmin only) → opens Dialog

### TABS
1. Действия пользователей · 2. Системные логи (Superadmin) · 3. Логи интеграций (Superadmin) · 4. Алерты безопасности (Superadmin)

### FILTER BAR (shared across tabs, adapts contextually)
- Пользователь (multi-select autocomplete of users)
- Тип действия (multi-select: Вход, Выход, Создание, Изменение, Удаление, Экспорт, ...)
- Объект (multi-select: Заявка, Клиент, Партнёр, Филиал, Пользователь, Настройки)
- IP (Input with validation)
- Период (range)
- Search input (320px, "Поиск по записям...")

### TAB 1 — Действия пользователей

**DataTable, denser than usual (row height 48):**
| Col | Width |
|---|---|
| Дата/время | 160 (with ms precision tooltip) |
| Пользователь | flex (Avatar 24 + name 14 Medium + role Badge inline) |
| IP | 140 (with geo flag emoji + city tooltip on hover) |
| Действие | 140 (Pattern H Badge per type — colored by severity) |
| Объект | 200 ("Заявка BR-12483" — link to source) |
| Изменения | flex ("Статус: На скоринге → Одобрена" — gray-700 with arrow icon between old → new) |
| Действия | 40 (Eye icon → Drawer with full diff) |

Row click → navigates to `/audit/:id` detail page:

### AUDIT DETAIL PAGE — /audit/:id (Pattern D)
**Back navigation:** "← Назад к журналу" ghost link top-left.

**Hero band:** timestamp H2 + user (Avatar + name + role Badge) + action Badge + object link

**Sections (stacked Cards):**
- Card "Контекст": InfoRow — IP, user-agent, request ID, session ID
- Card "Изменения": diff viewer — left old JSON, right new JSON, changed lines highlighted (added green, removed red). On mobile: unified diff (single column, additions green bg, removals red bg).
- Card "Связанные записи": list of related audit entries (same session), each clickable
- Sticky bottom: "Открыть объект" primary Button (navigates to the affected entity)

### TAB 2 — Системные логи (Superadmin)
- Severity Tabs at top: Все / Error / Warning / Info / Debug
- Real-time toggle Switch "Live режим" (pause/resume)
- Table: timestamp · level (Pattern H Badge) · component · message (truncate, expand on click)
- Row click: expand inline showing full stack trace in mono code block

### TAB 3 — Логи интеграций (Superadmin)
- Sub-tabs: 1С / BNPL-партнёры / SMS / Email
- For each sub-tab, a Table of integration calls:
  - timestamp, направление (исходящий/входящий — icon), endpoint, статус код (Badge), длительность (ms, with color coding), retry count
- Row click: inline expand showing request/response payload (formatted JSON, copyable) — not a separate page for log entries, inline accordion is sufficient here

### TAB 4 — Алерты безопасности (Superadmin)
- Card list (not table) of triggered alerts: severity icon + title + description + timestamp + "Просмотреть" Button
- Filter Tabs at top: Все / Активные / Разобранные

### ALERTS CONFIG DIALOG (from header Button, Pattern E, 720px)
- List of alert rules, each editable:
  - Trigger: dropdown (Массовое удаление, Множественные входы, Изменение критических настроек, Подозрительный IP, ...)
  - Threshold: numeric input + unit
  - Window: time picker
  - Recipients: multi-Select of Superadmin users
  - Enabled Switch
- "+ Добавить правило" Button

### RESPONSIVE (Pattern K)
- Tabs: horizontally scrollable at sm.
- User actions table: below md → card list (timestamp + user avatar/name + action Badge + object). Tap → `/audit/:id`.
- Audit detail page: diff viewer switches to unified single-column diff on mobile. Context InfoRow stacks vertically.
- System logs: message column truncates more aggressively, expand inline on tap. Stack trace in horizontal-scrollable code block.
- Integration logs: table → card list (timestamp + direction icon + status code Badge + duration). Inline expand for payload.
- Security alerts: card list already works on mobile, just ensure full-width.
- Alerts config dialog: full-screen Sheet on mobile.

### DELIVERABLE
Two routes: `/audit` (list with 4 tabs) and `/audit/:id` (detail page with diff viewer). Mock 50 audit entries with diverse actions.
```

---

## ⚙️ PROMPT 12a — SETTINGS

```
Build `/settings` — Superadmin-only system settings, organized into a left-rail nav layout.

### PAGE LAYOUT
Two-column inside the main content:
- Left rail (240px): vertical nav with sections (sticky)
- Right (flex-1): content for the selected section

### LEFT RAIL ITEMS
1. Общие
2. Локализация
3. Интеграции
4. Безопасность
5. API и Webhooks
6. Резервное копирование

Active item: canonical yellow pill style. Section headings within each item.

### SECTION 1 — Общие
Stacked Cards:
- Card "Организация":
  - Logo uploader (drag-and-drop tile, current logo preview)
  - Inputs: Название, Юридическое наименование, ИНН, Контактный email, Телефон, Адрес
- Card "Региональные настройки":
  - Часовой пояс Select (default Asia/Tashkent)
  - Формат даты Select (DD.MM.YYYY / YYYY-MM-DD / ...)
  - Формат времени Switch (24h / 12h)
  - Валюта Select (UZS default)
  - Первый день недели Switch (Понедельник / Воскресенье)
- Sticky save bar at bottom of content area

### SECTION 2 — Локализация
- Card "Языки":
  - List of languages with on/off Switch each: Русский (default), O'zbek (Cyr), O'zbek (Lat)
  - "Язык по умолчанию" Select
- Card "Переводы интерфейса (i18n)":
  - Search input for translation keys
  - Table of keys: key (mono) + RU + UZ (Cyr) + UZ (Lat) — inline editable cells
  - "Импорт JSON" / "Экспорт JSON" Buttons

### SECTION 3 — Интеграции
Subsection Cards per integration, each collapsible:
- **1С** — URL, API key, частота синхронизации (Select), последняя синхронизация (read-only with "Запустить сейчас" Button), enable Switch
- **SMS-провайдер** — Provider Select (Eskiz / Playmobile), API key, sender ID, test "Отправить тестовое SMS" Button + phone input
- **Email (SMTP)** — Host, Port, Username, Password, From, TLS Switch, "Отправить тестовое письмо"
- **Telegram** — Token (link to Telegram tab), Webhook
- **Google Analytics** — Measurement ID
- **Yandex Metrika** — Counter ID
- **Sentry** — DSN, environment, traces sample rate
- Each card has its own "Сохранить" / "Тестировать" Buttons

### SECTION 4 — Безопасность
- Card "Политика паролей":
  - Min length slider (8–32, default 10)
  - Switches: заглавные, строчные, цифры, спецсимволы
  - Срок действия (days) numeric Input (0 = бессрочный)
  - История паролей (last N) numeric Input
- Card "Сессии":
  - Тайм-аут (minutes) Input
  - Switch "Одна активная сессия на пользователя"
  - Switch "Уведомлять о входе с нового устройства"
- Card "Доступ":
  - IP-белый список — multi-line Textarea with one IP/CIDR per line, validation, "+ Добавить IP" Button
  - "Принудительная 2FA для ролей" — multi-select chips of roles
  - "Защита от брутфорса" Switches + thresholds

### SECTION 5 — API и Webhooks
- Card "API-ключи":
  - Table of API keys: name, key (masked), scopes (Badges), created, last used, status, Actions (Rotate / Revoke)
  - "+ Создать ключ" opens Dialog (name, scopes multi-select, expiration)
- Card "Исходящие Webhooks":
  - Table: name, URL, events subscribed (Badges), secret (masked), retry policy, status, last delivery
  - Row click: Drawer with delivery history (timestamp, event, response code, retries, payload)
  - "+ Создать webhook" opens Dialog
- Card "Документация API": prominent link to Swagger/OpenAPI

### SECTION 6 — Резервное копирование
- Card "Расписание":
  - Frequency Select (Ежедневно / Еженедельно / Ежемесячно)
  - Time picker
  - Retention (days) Input
  - Storage Select (S3 / Local / Yandex Object Storage)
- Card "Доступные бэкапы":
  - Table: дата/время, размер, тип (Авто/Ручной), статус, Actions (Скачать, Восстановить, Удалить)
  - "Восстановить" → Confirmation Dialog (Pattern G, typed-confirm with backup ID)
  - "+ Создать бэкап" primary Button

### RESPONSIVE (Pattern K)
- Left rail (240px): below lg, collapses to a horizontal scrollable tab bar at the top of the content area (same items, horizontal chips). At sm, becomes a Select dropdown.
- Form inputs: 2-column form grids → single column at md.
- Integration cards: collapsible cards already work on mobile. Test buttons go full-width.
- Security section: IP whitelist Textarea goes full-width. Switches maintain 44px touch targets.
- API keys table: below md → card list (name + scopes + status). Actions via MoreHorizontal.
- Webhooks table: same treatment — card list on mobile.
- Backup table: card list on mobile (date + size + status + actions).
- Translations table (Localization): horizontal scroll with sticky key column.
- Save bars: full-width sticky bottom on all screens.
- Modals/dialogs: full-screen Sheet on mobile.

### DELIVERABLE
One route, 6-section nav, persistent left-rail. Save bars per section.
```

---

## 🪪 PROMPT 13a — USER PROFILE

```
Build `/profile` — the current user's own profile page (different from `/users/:id` which is the admin view of any user).

### PAGE HEADER
- H1 "Мой профиль" + Caption "Управление личной информацией и настройками"

### LAYOUT
Two-column inside main content:
- Left (280px): vertical Tabs nav (sticky)
- Right (flex-1): tab content

### TABS
1. Основная информация
2. Безопасность
3. Уведомления
4. Сессии
5. Интерфейс

### TAB 1 — Основная информация
- Card "Фото":
  - Avatar 120px center + "Загрузить фото" / "Удалить" Buttons
  - Acceptable: JPG/PNG, max 5MB
- Card "Контактная информация":
  - Inputs: ФИО, email (verified Badge inline if verified), телефон (verified Badge)
  - "Подтвердить email" / "Подтвердить телефон" ghost Buttons if not verified
- Card "Рабочая информация" (read-only):
  - InfoRow: Роль, Филиал, Дата создания, Создан пользователем

### TAB 2 — Безопасность
- Card "Пароль":
  - "Изменить пароль" Button → Dialog (текущий, новый, подтвердить — with strength meter from Auth flow)
  - Caption: "Последнее изменение: 12.04.2026"
- Card "Двухфакторная аутентификация":
  - Status row: 2FA enabled Switch (large)
  - When enabling: Setup wizard inside Dialog (QR code + secret + 6-digit verify)
  - When enabled: "Резервные коды (8 шт)" — show generated list with "Скачать" + "Сгенерировать новые" Buttons
- Card "Активные подключения" (devices): preview of last 3 sessions + link to Tab 4

### TAB 3 — Уведомления
- Matrix Table (same as Notifications Center settings drawer, but here it's the user's own preferences):
  - Rows: notification types
  - Columns: каналы (В системе / Email / SMS / Push / Telegram)
  - Cells: Switch
- Card "Тихие часы" toggle + time range + days
- Card "Сводки": daily/weekly email summary toggles with time

### TAB 4 — Сессии
- List of active sessions: device icon + browser/OS + IP + city (with flag) + login time + last activity + "Текущая" Badge for current session
- "Завершить" Button per row (disabled for current session)
- "Завершить все сессии кроме текущей" destructive ghost Button at the top

### TAB 5 — Интерфейс
- Card "Язык":
  - Radio group: Русский · O'zbek (Кириллица) · O'zbek (Lotin)
- Card "Тема":
  - 3 large preview tiles (radius lg, 120×80, border on selected): Светлая / Тёмная / Системная
- Card "Плотность интерфейса":
  - Radio group: Компактная / Стандартная / Свободная (with live preview of a sample card)
- Card "Доступность":
  - Switch "Уменьшить анимации"
  - Switch "Высокая контрастность"
  - Switch "Увеличенный текст"

### SAVE BEHAVIOR
- Most changes save inline on toggle/blur (Toast "Сохранено")
- Multi-field forms have explicit "Сохранить" Button at section bottom
- Cancel discards changes since last save

### RESPONSIVE (Pattern K)
- Left tab rail (280px): below lg, collapses to horizontal scrollable tabs at top. At sm, becomes a Select dropdown.
- Avatar uploader: centered on mobile, full-width action buttons below.
- Contact info forms: single-column at md.
- Security tab: 2FA setup dialog → full-screen Sheet. Backup codes grid → single column list.
- Notifications matrix: horizontal scroll with sticky first column (notification type). Minimum 44px switch touch targets.
- Sessions list: compact layout — IP hidden on sm, device + time + "Завершить" shown. "Завершить все" button full-width at top.
- Interface tab: theme tiles 3-col → 1-col stack at sm (full-width tiles with radio selection). Density preview stacks below radio.
- Change password dialog: full-screen Sheet on mobile.

### DELIVERABLE
One route. Use current logged-in user "Сардор Мавлянов" as the mock subject.
```

---

## ✅ Build Checklist (Part 2)

- [ ] Every page has PageHeader (Pattern A) + FilterBar (Pattern B) when applicable
- [ ] All list views use DataTable (Pattern C) with consistent column order
- [ ] **All entity detail views are full pages at `/entity/:id` (Pattern D) — NO side drawers for details**
- [ ] Only settings/config panels use drawers (Pattern D2)
- [ ] All create/edit forms use Modal (Pattern E)
- [ ] Bulk actions toolbar (Pattern F) appears whenever rows are selected
- [ ] All destructive actions use Confirmation Dialog (Pattern G)
- [ ] All statuses use Badge system (Pattern H) — no rogue colors
- [ ] All loading/empty/error states match Pattern I — no spinners
- [ ] All keyboard shortcuts work: N (new), F (filter focus), / (search), Esc (close)
- [ ] All filters serialize to URL query params
- [ ] Branches priorities editor: drag-reorder + time-range edit both functional
- [ ] Audit log diff viewer renders side-by-side JSON (unified diff on mobile)
- [ ] Notifications settings matrix is a real Switch grid
- [ ] Auth flow has working CAPTCHA fallback after 5 failed attempts
- [ ] All routes work in light AND dark theme
- [ ] All Russian labels are correct — no machine-translated phrasing
- [ ] Role gating comments marked `{/* role:Superadmin */}` etc.
- [ ] **Mobile responsive (Pattern K)**: every page tested at sm/md/lg breakpoints
- [ ] Tables → card lists on mobile (below md)
- [ ] Modals → full-screen Sheets on mobile
- [ ] Touch targets minimum 44×44px
- [ ] Sidebar → hamburger/bottom nav on mobile
- [ ] Charts resize to container, legends below, brush/zoom disabled on touch
- [ ] 2-column layouts stack to single column at md
- [ ] Horizontal scroll with sticky first column for wide tables/matrices on mobile

---

## 📦 What's NOT in this pack (out of scope but worth noting)

- Onboarding/welcome flow (post-invitation first login)
- Native mobile app — responsive web covers mobile browsers (Pattern K), but no PWA/native shell
- Real Yandex Maps integration (placeholders only)
- Real WebSocket wiring (mock intervals only)
- Charts beyond Recharts defaults (no custom canvas/SVG)
- Internationalization (i18n) library setup — only UI strings shown in Russian

If you want any of those added, just ask.
