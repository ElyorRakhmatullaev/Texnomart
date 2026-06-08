# AI Context — Texnomart AI Dashboard

> Last updated: 2026-06-01 (doc sync #19)

## Current State

The project was bootstrapped from Figma Make and is now under active development. All UI is implemented with mock data — no backend or API integration exists yet.

### UX Maturity: **Prototype stage**
- Core navigation and layout: complete
- Dashboard with live-feel widgets: complete
- Applications CRUD module: partially complete (list, detail, kanban — no create/edit forms)
- Clients module: list + detail with 5 tabs, search, filters, pagination, mobile cards
- Partners module: list (cards + table views) + detail with 6 tabs, Recharts stats
- Branches module: list (table + map views) + detail with 5 tabs, drag-and-drop priorities editor
- Users module: list (table + mobile cards, filters, sync panel, invite modal) + detail with 5 tabs, Recharts stats for operators/agents
- Auth flow: fully routed with mock auth state, route guards, toast notifications
- Analytics page: full dense data view with KPIs, charts, grouping, cohort analysis, reports
- Telegram Bot page: 6-tab management interface with settings, templates, broadcasts, subscribers, analytics, FAQ
- Audit Log: 4-tab page (user actions, system logs, integration logs, security alerts) + detail page with diff viewer
- Settings page: 6-section Superadmin config (general, localization, integrations, security, API/webhooks, backup) with left-rail nav
- All prompt pack pages implemented (14/14 complete)

## Architecture Decisions

| Decision | Rationale |
|---|---|
| Tailwind v4 via Vite plugin | Figma Make default; no `tailwind.config.js` — uses `@import` syntax in CSS |
| shadcn/ui (Radix) | Full component library already scaffolded; 40+ primitives in `src/app/components/ui/` |
| Mock data in `src/lib/` | Enables full UI development without a backend; easy to swap for API calls later |
| React Router v7 browser router | SPA with client-side routing; all routes in single `routes.tsx`; `ProtectedLayout`/`GuestLayout` guards |
| Russian-only UI | Primary market is Uzbekistan; language selector exists but i18n is not implemented |
| `"use client"` directives | Artifact of Figma Make codegen; harmless in Vite SPA context |
| **Full detail pages, no drawers** | All entity details use dedicated `/entity/:id` routes with tabs — drawers reserved for settings/config only. Better for mobile, richer content, deep-linkable. |
| **Mobile responsive (Pattern K)** | All pages must work at sm/md/lg/xl breakpoints. Tables→card lists, modals→sheets, 44px touch targets. Not a native app — responsive web only. |

## Implemented Modules

### Dashboard (`/`, `/dashboard/:metricId`)
- Scrollable layout (content flows naturally, `<main>` handles overflow), `bg-gray-50/80` page background for card contrast
- PageHeader with controlled period selector (synced to all charts), "Сравнить с прошлым" toggle, refresh, export dropdown
- 8 KPI cards in responsive grid (`grid-cols-2 md:grid-cols-4`); sparkline mini-charts shown/hidden by compare toggle; **each card links to `/dashboard/:metricId` drill-down page**
- Chart layout in stacked rows with responsive breakpoints:
  - Row 1: Applications Dynamics (2/3 on lg, full on mobile) + Partner Distribution (1/3 on lg, full on mobile)
  - Row 2: Application Statuses (1/2 on md, full on mobile) + Top 10 Branches (1/2 on md, full on mobile)
  - Row 3: Recent Applications (full width, live table on desktop with 12s polling / mobile card list, rows navigate to `/applications/:id`, "Все заявки" navigates to `/applications`)
- Period state is centralized in Dashboard and flows to all chart sub-components bidirectionally (header dropdown ↔ chart tabs)
- Keyboard shortcuts: R (refresh), ? (help), 1-8 (KPI focus), ⌘K (search)
- Geography Map widget exists but uses placeholder SVG rectangles (not in current layout)
- **KPI Detail Page** (`/dashboard/:metricId`): single parameterized page for all 8 metrics (total-clients, applications-24h, applications-3h, conversion, total-amount, average-check, active-clients, scoring-time). Each page has: back nav, hero card (icon, value, delta, period selector), 30-day area chart with previous period comparison, breakdown table (desktop) / card list (mobile) with share bars and deltas, horizontal bar chart of top items, 3 related metric mini-cards. Breakdown dimensions vary by metric (regions, partners, categories). Mock data inline in component.

### Applications (`/applications`, `/applications/:id`)
- Table view with 10 columns, checkbox selection, row click → detail page
- Kanban view with 6 status columns, drag-and-drop
- Bulk actions toolbar (fixed bottom bar when rows selected)
- Detail page fully rebuilt to match Prompt 3a spec (Pattern D):
  - White Card hero band with status Badge + action buttons + MoreHorizontal dropdown
  - 7 underline tabs: Сводка, Клиент, Этапы, Партнёры, Документы, Комментарии, История
  - Pattern J timeline with 24px dots and 2px connectors
  - Partners tab uses DataTable (desktop) / card list (mobile)
  - Documents tab with hover overlays (Eye/Download) + upload tile
  - Comments tab with thread + compose box + "Внутренний" Switch
  - History tab with compact audit timeline
  - Full-width layout, mobile responsive (Pattern K)
- Legacy `ApplicationDetailDrawer.tsx` still exists — candidate for removal

### Clients (`/clients`, `/clients/:id`)
- List page with PageHeader (H1 + count + search + refresh + export + CTA)
- FilterBar with status filter + search across name/phone/PINFL/ID
- DataTable with 11 columns: checkbox, ID, client (avatar+name+PINFL), phone (masked, click-to-reveal), scoring (colored dot), applications count, installment sum, registration date, last activity, flags (VIP/blacklist/status badges), actions dropdown
- Pagination (20/50/100 per page)
- Mobile card list below md (Pattern K): avatar + name + scoring + activity
- Bulk actions toolbar (SMS, export, block)
- Detail page (Pattern D) with hero band: 80px avatar, full name, PINFL, phone, status/VIP/blacklist badges, action cluster (Связаться dropdown, Сбросить пароль, MoreHorizontal)
- 4 stat tiles: scoring (with progress bar), active installments, total applications, LTV
- 5 underline tabs (Pattern J):
  - Профиль: 2-col grid — personal data, contacts, documents (hover overlay), additional info
  - Финансы: linked cards (with verified badge), active installments (progress bars), payment history (table/mobile cards), credit score gauge
  - Заявки: summary stats + link to filtered applications list
  - Активность: Pattern J vertical timeline with type filters (all/login/application/support/profile)
  - Комментарии и теги: comment thread + compose box with internal switch; tag editor with suggested tags
- Mock data: 20 clients, featured "Алиев Озодбек CL-00428" per spec

### Partners (`/partners`, `/partners/:id`)
- List page with PageHeader (H1, counts, view toggle, refresh, export, CTA)
- Two view modes: Cards (default, 3→2→1 col grid) and Table (desktop table + mobile card list)
- FilterBar with status/type/API-status filter chips (yellow active state)
- Card view: logo + name + legal name + 3 mini-metrics (applications today, conversion, avg time) + API health badge + status toggle Switch
- Table view: 8 columns (partner, active switch, API status, applications, conversion, avg time, regions, actions)
- Mobile card list below md (Pattern K)
- Detail page (Pattern D) with hero band: 64px logo, name, legal name, description, status/API badges, status Switch, "Проверить подключение" button, MoreHorizontal dropdown
- 6 underline tabs (Pattern J):
  - Обзор: company info (InfoRow) + regions with toggle Switches + category chip selector
  - Условия кредитования: 15 term chips (toggleable months) + limit inputs (min/max amount, min/max age) + sticky save bar
  - API-настройки (Superadmin): Production/Sandbox toggle, masked API key/secret with eye/copy/rotate, webhook URL, schedule per weekday, timeout/retry config, connection test with result alert
  - Финансы: commission type selector (fixed/percent/hybrid) with conditional inputs + settlements history table (desktop table + mobile cards)
  - Статистика: 4 KPI tiles + Recharts area chart (applications by day) + donut (status distribution) + bar chart (hourly applications)
  - История изменений: Pattern J vertical timeline with user, field, old→new values, timestamps
- Mock data: 6 partners (Alif Nasiya, Anorbank, Uzum Nasiya, Iman, Multicard, Asia Alliance) with full stats, settlements, API config, change history

### Branches (`/branches`, `/branches/:id`)
- List page with PageHeader (H1, counts for total/active, view toggle List/Map, refresh, export, CTA)
- Two view modes: List (default, DataTable) and Map (SVG Uzbekistan with positioned markers)
- FilterBar with search, status filter, region filter — yellow active state
- DataTable with 8 columns: name, address, region, employees (count + avatar group), active partners, daily applications, status badge, actions
- Mobile card list below md (Pattern K): name, region, status, employee count, partner count, daily applications
- Map view: SVG markers color-coded by status (yellow active, gray inactive), hover tooltips with branch info, linked branch list below map
- Detail page (Pattern D) with hero band: branch name, address/phone/hours, status badge, status Switch, "На карте" button, MoreHorizontal dropdown
- 5 underline tabs (Pattern J):
  - Общая информация: 2-col grid — InfoRow card (name, address, coordinates, phone, hours, manager with avatar) + mini map with pin
  - Сотрудники: DataTable (desktop) / cards (mobile) with avatar, role badge, phone, monthly applications; "Прикрепить сотрудника" button
  - Партнёры филиала: expandable partner cards with enable/disable Switch per partner + term chip selector (15 terms, yellow active pills), sticky save bar
  - Приоритеты: live priority preview ("podium" display of current active partners) + schedule editor with day-of-week tabs, 24-hour timeline visualization (desktop), drag-and-drop ranked partner list with grip handles, time range selectors (Popover), add/remove partners, "Применить ко всем дням", sticky save bar
  - Статистика: 4 KPI tiles + Recharts area chart (daily applications) + 2 horizontal bar charts (top agents + top partners with per-partner colors)
- Mock data: 10 branches across Uzbekistan regions (Ташкент ×2, Самарканд, Бухара, Андижан, Фергана, Наманган, Кашкадарья, Хорезм, Сурхандарья), 1 inactive (Ургенч)

### Users (`/users`, `/users/:id`)
- List page with PageHeader (H1, counts, search, refresh, export, "+ Пригласить пользователя" CTA)
- Collapsible sync panel (1С / Брокер / Партнёры) with status indicators and "Запустить" buttons
- FilterBar with role/branch/status filters — yellow active state, clear all button
- DataTable with 9 columns: checkbox, employee (avatar+name+email), phone, role (styled Badge per role), branch, status, last login (with IP tooltip), created date, actions dropdown
- Row height 64px, click navigates to `/users/:id`
- Mobile card list below md (Pattern K): avatar + name + role Badge + status Badge
- Bulk actions toolbar (deactivate, export, delete)
- Invite modal (Pattern E): tabs "Пригласить по email" / "Создать с паролем", role Select conditionally shows branch
- Pagination (20/50/100 per page)
- Detail page (Pattern D) with hero band: 64px avatar, name, email, role Badge, status Badge, branch, status Switch, "Сбросить пароль" button, MoreHorizontal dropdown
- 5 underline tabs (Pattern J):
  - Информация: 2-col grid — personal data (InfoRow) + role & access (role Select, branch Select if applicable)
  - Безопасность: 2FA Switch, last password change, failed attempts, security policy checklist (green/red icons)
  - Сессии: active sessions (device + browser + IP + location + terminate button) + login history table (desktop table + mobile cards) with success/error/blocked badges
  - Активность: Pattern J vertical timeline with yellow 12px dots + "Открыть полный аудит →" link
  - Статистика (Operator/Agent only): 4 KPI tiles + Recharts line chart (daily applications) + bar chart (monthly conversion)
- Sticky action bar: "Удалить пользователя" destructive left + "Сохранить изменения" primary right (disabled until changes)
- Mock data: 12 users (1 superadmin, 2 admins, 5 operators, 4 agents), 1 deactivated (USR-012)

### Analytics (`/analytics`)
- Dense data view — deepest analytical page in the app
- PageHeader with "Сравнить с прошлым" Switch + Export + "Создать отчёт" CTA
- Control bar: period segmented control (8 options incl. custom date range picker Popover), comparison period display, grouping Select (8 dimensions: partners/branches/operators/statuses/products/terms/age/regions), refresh
- KPI Grid: 8 metric tiles (applications, requested sum, approved sum, issued sum, conversion, avg time, repeat rate, LTV) with deltas and comparison values; click any tile to focus the main chart on that metric
- Main Chart: Recharts ComposedChart (480px lg / 320px md / 240px sm), Line/Bar/Area toggle (ToggleGroup on desktop, Select dropdown on mobile), granularity tabs (hours/days/weeks), Brush zoom for 30+ datapoints, comparison dashed line when enabled
- Grouping Table: DataTable with sparklines, conversion bar visuals, share-of-total bars, delta column; mobile card list (Pattern K)
- Cohort Analysis: collapsible Card with heatmap table — rows = acquisition month, columns = months 0–5, cells = retention % color-coded (yellow gradient), hover tooltips with absolute counts, sticky first column for horizontal scroll
- Reports Panel: 3 sub-tabs:
  - Сгенерированные: DataTable (10 reports) with status badges (Готов/В процессе/Ошибка), download/share/delete actions; mobile card list
  - Расписание: card list of scheduled reports with frequency badges, recipient lists, enable Switch
  - Шаблоны: grid of 7 report-type cards (Сводный, Детализированный, По партнёрам, По филиалам, Финансовый, По операторам, Когортный) with icons and "Сгенерировать" button
- Create Report Dialog: 3-step wizard (template selection → parameters → format/delivery with schedule option)
- Responsive (Pattern K): control bar stacks at md, period→Select at sm, KPI grid 4×2→2×4→1-col, chart height reduces, Brush hidden at sm, grouping table→card list below md, cohort heatmap horizontal scroll, reports table→card list
- Mock data: `src/lib/analytics-mock-data.ts` — 8 KPIs, 8 grouping dimensions with sparklines, 6-month cohort data, 10 generated reports, 3 scheduled, 7 templates

### Telegram Bot (`/telegram`)
- Single-route page with 6 underline tabs (Pattern J)
- PageHeader with bot username caption, master enabled/disabled Switch, refresh, "Создать рассылку" CTA
- Tab 1 — Общие настройки: token card (masked + eye/copy/rotate), webhook URL + check button, welcome message with RU/UZ language tabs + Telegram-style dark preview bubble, draggable bot commands list with enable/disable Switches
- Tab 2 — Шаблоны сообщений: 5 category sub-tabs (Все/Приветствия/Статусы заявок/Напоминания/Маркетинг), 3-col responsive card grid, click opens edit Dialog with RU/UZ/UZ-lat language tabs + variable picker (tooltips) + live Telegram preview + test send input
- Tab 3 — Рассылки: DataTable with progress bars (sent/total), delivery %, read %, clicks, status Badges; 5-step create broadcast Dialog (audience segment → template selection with preview → schedule now/later → A/B test optional → confirm summary); mobile card list (Pattern K)
- Tab 4 — Подписчики: DataTable with search + status filter, avatar, @username, linked client, subscription date, last activity, message count, status Badge, ban/unban action; mobile card list
- Tab 5 — Аналитика: 4 KPI tiles (DAU, MAU, subscribers, daily clicks) with deltas, Recharts area chart (DAU/MAU over 30 days), horizontal funnel (Подписка → Первый клик → Первая заявка → Одобрено), bar chart (top 7 commands), line chart (retention D1/D7/D14/D30)
- Tab 6 — FAQ и автоответы: 50/50 split — FAQ expandable list with RU/UZ language tabs + active toggles; auto-reply rules (IF keyword/regex THEN template) with active toggles
- Mock data: `src/lib/telegram-mock-data.ts` — bot config, 15 templates (4 categories), 8 broadcasts, 20 subscribers, 4 KPIs, funnel data, retention data, 8 FAQ items, 5 auto-reply rules
- Responsive (Pattern K): tabs scroll at sm, settings cards stack, templates 3→2→1 col, broadcasts table→cards, subscribers table→cards, analytics charts stack, FAQ 50/50→stacked

### Notifications (`/notifications`)
- Full notification history page with day-grouped list (sticky day headers)
- PageHeader with unread/total counts, "Прочитать все" ghost button, "Настройки уведомлений" button
- Filter bar: segmented control (Все/Непрочитанные/Прочитанные), type chips (Заявки/Партнёры/Безопасность/Система/Аномалии), severity chips (Критично/Внимание/Информация/Норма), reset button
- Each notification row (80px): severity icon in colored circle, title + body (2-line truncate) + type/severity badges, relative time, unread dot, action chip, hover actions (mark read/unread, archive, delete)
- Unread rows: white bg + yellow left border; read rows: gray-50 bg
- Row click: marks read + navigates to source
- Settings drawer (Pattern D2, Sheet 720px): quiet hours (Switch + time range + day chips), channel matrix table (6 notification types × 5 channels with Switch toggles, sticky first column), digest settings (daily email + weekly report Switches)
- Empty state: BellOff icon + "Уведомлений нет"
- Mock data: 30 notifications across types/severities, channel matrix defaults
- Responsive (Pattern K): action chips stack below title on sm, severity chips horizontally scrollable, settings drawer full-screen on mobile, channel matrix horizontal scroll with sticky first column

### Audit Log (`/audit`, `/audit/:id`)
- 4-tab page with shared filter bar
- Tab 1 — Действия пользователей: dense DataTable (48px rows, 7 columns: timestamp, user+avatar+role, IP+geo flag, action Badge, object link, changes with old→new, Eye button), row click → `/audit/:id`, search + action type + object type filters, pagination (20/50/100), mobile card list (Pattern K)
- Tab 2 — Системные логи (Superadmin): severity sub-tabs (Все/Error/Warning/Info/Debug), Live mode toggle Switch, expandable rows with full stack trace in mono code block, mobile card list
- Tab 3 — Логи интеграций (Superadmin): 4 sub-tabs (1С/BNPL/SMS/Email), table with timestamp, direction icon (incoming/outgoing), endpoint, status code Badge (color-coded), duration (color-coded), retry count; expandable rows with request/response JSON payloads (copyable), mobile card list
- Tab 4 — Алерты безопасности (Superadmin): card list with severity icon (AlertTriangle/Info), title, description, status Badge (Активен/Разобран), resolved info; filter tabs (Все/Активные/Разобранные); empty state with Shield icon
- Alerts Config Dialog (Pattern E, 720px): list of editable alert rules — trigger Select (8 options), threshold + unit, time window, recipients, enabled Switch, add/remove rules
- Detail page (Pattern D): hero band (timestamp H2, user avatar+name+role, action Badge, object link), context Card (IP+geo, user-agent, request ID, session ID), changes Card (human-readable field changes + JSON diff viewer — side-by-side on desktop with red/green highlights, unified diff on mobile with +/− markers), related entries Card (clickable linked audit entries from same session), sticky bottom "Открыть объект" button
- Mock data: 50 audit entries (diverse action types across 8 users, 7 IPs), 20 system logs (4 levels, 10 components, stack traces), 15 integration logs (4 sources with request/response JSON), 10 security alerts (3 severities, mixed statuses), 5 alert rules

### Settings (`/settings`)
- Superadmin-only system settings page with left-rail nav (240px, sticky)
- Responsive nav: left rail on desktop (lg+), horizontal scrollable chips (sm–lg), Select dropdown (sm)
- 6 sections:
  - Общие: organization card (logo uploader, 6 form fields) + regional settings (timezone, date format, time format toggle, currency, first day of week)
  - Локализация: language list with enable/disable switches + default selector, translations table (20 keys) with search + sticky key column + Import/Export JSON
  - Интеграции: 7 collapsible integration cards (1С, SMS, Email, Telegram, GA, Yandex Metrika, Sentry), per-card enable switch, test/save buttons, custom fields per type
  - Безопасность: password policy (min length slider 8–32, requirement switches, expiration, history), session policy (timeout, single session, new device alerts), access control (IP whitelist textarea, 2FA role chips, brute-force thresholds)
  - API и Webhooks: API keys table (desktop) / card list (mobile) with create dialog + copy/rotate/revoke actions; webhooks table with create dialog + delivery history drawer (Pattern D2); Swagger link
  - Резервное копирование: schedule card (frequency, time, retention, storage), backups table with download/restore/delete, create backup, restore confirmation dialog (Pattern G with typed confirmation)
- Sticky save bars per section, all actions produce toast notifications
- Mock data: `src/lib/settings-mock-data.ts` — organization, regional, 3 languages, 20 translation keys, 7 integrations, password/session/access policies, 4 API keys, 3 webhooks with delivery history, 8 backups

### Profile (`/profile`)
- Current user's own profile page (distinct from admin `/users/:id` view)
- Left-rail nav (280px) with 5 tabs — responsive: horizontal chips (sm–lg), Select dropdown (sm)
- Tab 1 — Основная информация: avatar uploader (120px, upload/delete), contact info form (ФИО, email/phone with verified badges, confirm buttons), read-only work info card (role, branch, created date, created by)
- Tab 2 — Безопасность: change password dialog (strength meter + criteria), 2FA toggle with setup wizard dialog (QR placeholder + secret + 6-digit verify), backup codes (8 codes, show/copy/download/regenerate), active connections preview (last 3 sessions)
- Tab 3 — Уведомления: channel matrix table (6 types × 5 channels with Switches, sticky first column), quiet hours (Switch + time range + day chips), digest settings (daily/weekly toggles)
- Tab 4 — Сессии: active sessions list (device icon + browser/OS + IP + city with flag + login time + "Текущая" badge + "Завершить" button), "Завершить все кроме текущей" destructive button
- Tab 5 — Интерфейс: language radio (RU/UZ-Cyr/UZ-Lat), theme preview tiles (Светлая/Тёмная/Системная), density radio with live preview card, accessibility switches (reduce animations, high contrast, large text)
- Mock user: "Мавлянов Сардор Рашидович" (admin role), inline mock data
- Dialogs use full-screen Sheet on mobile (Pattern K)
- Accessible from header user dropdown → "Профиль"

### Auth (`/login`, `/login/2fa`, `/login/forgot-password`, `/login/reset-password/:token`)
- Login page with brute-force protection (5 attempts → 15min lock)
- 2FA page (6-digit OTP, auto-submit, guard requires step 1 completion)
- Forgot password (email/SMS tabs, success state with toast)
- Reset password (strength meter, criteria checklist, redirects to login)
- AuthLayout: 60/40 split with brand panel (brand panel hides below lg)
- AuthContext: mock auth state in sessionStorage (`isAuthenticated`, `needsTwoFactor`)
- Route guards: `ProtectedLayout` redirects to `/login`, `GuestLayout` redirects to `/`
- Toast notifications via sonner on login, 2FA, forgot password, reset password
- Logout wired in AppShell header user dropdown

## Known Issues & TODOs

- [ ] Geography map uses SVG rectangles — needs Yandex Maps API integration
- [x] ~~Auth pages not wired into routes~~ — Done (2026-05-22)
- [ ] Dark mode CSS variables defined but dark theme may have visual issues (untested)
- [ ] No pagination on Applications table
- [ ] No real filter functionality (filter chips are visual only)
- [ ] `ApplicationDetailDrawer.tsx` is legacy — detail views now use full pages (Pattern D), drawer can be removed
- [ ] No i18n system — language selector is non-functional
- [ ] MUI Material is in dependencies but not used — candidate for removal
- [ ] `globals.css` is empty
- [ ] No tests exist
- [ ] No API layer — all data is mock
- [ ] Mobile responsiveness partially implemented — Dashboard (AppShell + all widgets), ProfilePage, ApplicationDetailPage, ClientsPage/ClientDetailPage, PartnersPage/PartnerDetailPage, BranchesPage/BranchDetailPage, UsersPage/UserDetailPage, AnalyticsPage, TelegramPage, NotificationsPage, AuditPage/AuditDetailPage, and SettingsPage have Pattern K; ApplicationsPage list still needs it

## Active Work

**All 14 prompt pack pages are complete.** The full build order has been implemented:
~~Clients (4a)~~ → ~~Partners (5a)~~ → ~~Branches (6a)~~ → ~~Users (7a)~~ → ~~Analytics (8a)~~ → ~~Telegram (9a)~~ → ~~Notifications (10a)~~ → ~~Audit (11a)~~ → ~~Settings (12a)~~ → ~~Profile (13a)~~

### Recent completions
- KPI drill-down pages (`/dashboard/:metricId`) — 2026-05-24
- Profile page (13a, last prompt pack page) — 2026-05-24
- Page title standardization (9 pages fixed) — 2026-05-25
- `/commit` command added — 2026-05-25: groups changes by topic, creates separate commits per group, pushes
- Dashboard + AppShell mobile responsiveness — 2026-05-26: hamburger sidebar drawer, responsive header, KPI 2-col grid, stacked charts, mobile card list for recent applications
- Dashboard mobile card contrast — 2026-06-01: `bg-gray-50/80` page background, mobile cards styled with `bg-gray-50 rounded-lg` for contrast against white Card containers

### Next steps
- Mobile responsiveness for ApplicationsPage list (last page without Pattern K)
- API integration layer (replace mock data with real endpoints)
- Cleanup: remove legacy `ApplicationDetailDrawer.tsx`, unused MUI dependency
- Dark mode visual QA (CSS variables defined but untested)
- i18n system for Uzbek language support
