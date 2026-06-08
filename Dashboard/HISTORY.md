# Change History

Reverse chronological order. Each entry: date, title, bullet points.

---

## 2026-06-01 — Dashboard Mobile Card Contrast

**Added visual contrast to dashboard cards on mobile by introducing a grey page background and styled mobile card items.**

### What changed
- **Dashboard.tsx** — added `bg-gray-50/80` page background with negative margins (`-m-3 md:-m-4`) to fill edge-to-edge, making white `Card` components visually distinct from the background
- **RecentApplicationsWidget.tsx** — mobile card list restyled: replaced `divide-y` flat rows with individually styled cards (`bg-gray-50 rounded-lg p-3`), changed layout from divider-separated to `flex flex-col gap-2` spaced cards, updated touch feedback from `active:bg-gray-50` to `active:bg-gray-100`
- **pnpm-workspace.yaml** — approved build scripts for `@tailwindcss/oxide` and `esbuild` (required by pnpm v11 for `pnpm install` / `pnpm dev` to succeed)

---

## 2026-05-26 — Dashboard & AppShell Mobile Responsiveness

**Made the dashboard and app shell mobile-friendly with hamburger sidebar, responsive grids, and mobile card lists.**

### What changed
- **AppShell header** — added hamburger `Menu` icon (visible below `md`) that opens the sidebar as a slide-over Sheet drawer (uses shadcn sidebar's built-in mobile Sheet behavior via `useIsMobile()`). Search bar collapses to icon on mobile. Language selector and "Онлайн" indicator hidden on mobile. Header height reduced to `h-14` on mobile. Main content padding reduced to `p-3` on mobile.
- **Breadcrumbs** — hidden below `md` breakpoint to save vertical space.
- **KpiStrip** — grid changed from fixed `grid-cols-4` to `grid-cols-2 md:grid-cols-4`. KPI value font scales down on mobile (`text-lg md:text-[1.75rem]`). "vs прошлый период" text hidden on small screens.
- **Dashboard chart grids** — Row 1 (Dynamics + Donut): `grid-cols-1 lg:grid-cols-3` (stacks below `lg`). Row 2 (Statuses + Branches): `grid-cols-1 md:grid-cols-2` (stacks below `md`).
- **RecentApplicationsWidget** — desktop table hidden below `md`, replaced with compact card list showing avatar, client name, amount, status badge, time, and partner info. Cards use `active:bg-gray-50` for touch feedback.

---

## 2026-05-25 — /commit Command

**Created custom `/commit` command for topic-grouped commits.**

### What changed
- Created `.claude/commands/commit.md` — 5-step workflow: analyze changes → group by topic (26 categories mapped to project structure) → present plan for approval → commit each group with specific files → push
- Grouping rules cover all project directories: mock data, styles, UI primitives, auth, dashboard, 10 feature modules, layout, routing, docs, rules, commands, config, build, dist
- Safety rules: no `git add -A`, no `node_modules/.vite/` cache, no AI signatures, skip `dist/` by default
- Commit message format: conventional commits (`feat:`, `fix:`, `docs:`, etc.) with scope

---

## 2026-05-25 — Page Title Standardization

**Standardized all page H1 title sizes to a single consistent class across 9 pages.**

### What changed
- Standardized all page titles to `text-2xl md:text-[32px] font-bold leading-tight text-gray-900`
- Fixed `ApplicationsPage.tsx` — title was `text-xl` (too small compared to all other pages)
- Fixed `PageHeader.tsx` (Dashboard) — was `text-3xl` without responsive scaling
- Fixed `AnalyticsPage.tsx` — was `text-2xl md:text-3xl` (different target size than other pages)
- Fixed `AuditPage.tsx` — was `text-2xl sm:text-3xl` (wrong breakpoint and target size)
- Fixed `NotificationsPage.tsx` — was scaling at `sm` breakpoint instead of `md`
- Fixed `ClientsPage.tsx` — was scaling at `sm` breakpoint instead of `md`
- Fixed `SettingsPage.tsx` — was `font-semibold` instead of `font-bold`, no responsive scaling
- Fixed `ProfilePage.tsx` — was `font-semibold` instead of `font-bold`, no responsive scaling
- Fixed `UsersPage.tsx` — standardized leading from `md:leading-10` to `leading-tight`
- PartnersPage, BranchesPage, TelegramPage already had the correct pattern — unchanged
- Updated `CLAUDE.md` Pattern A description with exact H1 class
- Updated `.claude/rules/design.md` with page title convention

---

## 2026-05-24 — KPI Drill-Down Pages

**Built parameterized detail pages for all 8 dashboard KPI cards — click any card to see trends, breakdowns, and related metrics.**

### What changed
- Created `src/app/components/dashboard/KpiDetailPage.tsx` — single parameterized page at `/dashboard/:metricId` for all 8 KPI metrics:
  - Back nav "← Назад к дашборду"
  - Hero card: metric icon in yellow circle, label, big value, delta with TrendingUp/Down icon, period selector (7д/30д/90д), refresh + export buttons
  - 30-day trend AreaChart: yellow fill + stroke for current period, dashed gray line for previous period, CartesianGrid, custom Tooltip, responsive height (300px sm / 360px default)
  - Breakdown table: desktop DataTable (rank #, dimension name, formatted value, Progress share bar with yellow fill + percentage, delta with color) + mobile card list (Pattern K)
  - Horizontal BarChart: top 6 breakdown items, gold/yellow/gray Cell colors by rank
  - Related metrics: row of 3 mini-cards linking to sibling KPI pages with icon, value, delta
  - 404 fallback for unknown metric IDs
  - 8 metric configs with metric-specific breakdown dimensions:
    - total-clients / active-clients → by region (8 regions)
    - applications-24h / applications-3h / conversion / total-amount / scoring-time → by partner (6 partners)
    - average-check → by product category (8 categories)
  - All mock data generated inline (trend generator, breakdown builder, formatted values)
- Updated `src/app/components/KpiStrip.tsx` — replaced `<a href="/analytics/...">` with React Router `<Link to="/dashboard/...">` (fixes full-page reload on click)
- Updated `src/app/routes.tsx` — added `{ path: "dashboard/:metricId", Component: KpiDetailPage }` route
- Updated `src/app/components/AppShell.tsx` — added breadcrumb mapping for `/dashboard/:metricId` (Главная → Дашборд → metric label)

---

## 2026-05-24 — Profile Page (Prompt 13a)

**Built the Profile page — 5-tab personal profile with left-rail navigation. Last prompt pack page.**

### What changed
- Created `src/app/components/profile/ProfilePage.tsx` — single-route page with left-rail nav (280px, sticky) and 5 tabs:
  - Tab 1 — Основная информация: avatar Card (120px AvatarFallback, upload/delete buttons, 5MB JPG/PNG hint), contact Card (ФИО inputs in 2-col grid, email + phone with verified green Badges or "Подтвердить" ghost buttons, save button), read-only work info Card (role, branch, created date, created by as InfoRow items)
  - Tab 2 — Безопасность: password Card (last change date, "Изменить пароль" opens ChangePasswordDialog with strength meter + 5 criteria checklist + confirm match validation), 2FA Card (enable Switch → TwoFactorSetupDialog 2-step wizard with QR placeholder + secret key copy + 6-digit verification, backup codes grid with show/copy/download/regenerate), active connections preview (last 3 sessions with device icons + "Текущая" Badge, link to Tab 4)
  - Tab 3 — Уведомления: channel matrix Table (6 notification types × 5 channels with Switch toggles, sticky first column, horizontal scroll on mobile), quiet hours Card (Switch + time range inputs + day chips with 44px targets and yellow active state), digests Card (daily email + weekly report Switch toggles with toast feedback)
  - Tab 4 — Сессии: active sessions Card (device icon Monitor/Smartphone, browser + OS, IP + city with flag emoji, login time with lastActivity Tooltip, "Текущая" green Badge, "Завершить" destructive ghost button), "Завершить все кроме текущей" button, IP hidden on sm
  - Tab 5 — Интерфейс: language Card (radio group with yellow active border for RU/UZ-Кир/UZ-Lat), theme Card (3 preview tiles with icon + colored preview, yellow ring on selected), density Card (3 radio options + live preview card showing sample user data at chosen density), accessibility Card (3 Switch toggles: reduce animations, high contrast, large text)
  - Responsive (Pattern K): left rail → horizontal scrollable chips (sm–lg) → Select dropdown (sm), ChangePasswordDialog/TwoFactorSetupDialog → full-screen Sheet on mobile, theme tiles 3-col → 1-col at sm
  - Mock user "Мавлянов Сардор Рашидович" (admin) with 4 sessions, 8 backup codes — all inline mock data
- Updated `routes.tsx` — added `{ path: "profile", Component: ProfilePage }`
- Updated `AppShell.tsx` — added `/profile` breadcrumb ("Мой профиль"), wired header user dropdown "Профиль" → `navigate("/profile")` and "Настройки" → `navigate("/settings")`

---

## 2026-05-24 — Settings Page (Prompt 12a)

**Built the Settings page — 6-section Superadmin system configuration with left-rail navigation.**

### What changed
- Created `src/lib/settings-mock-data.ts` — types and mock data for all 6 sections: `OrganizationSettings` (name, legal name, INN, contacts), `RegionalSettings` (timezone, date/time format, currency, first day of week), `LanguageEntry` (3 languages with enable/default), `TranslationRow` (20 i18n keys with RU/UZ-Cyr/UZ-Lat), `IntegrationConfig` (7 integrations: 1С, SMS, Email, Telegram, GA, Yandex Metrika, Sentry), `PasswordPolicy` (min length, requirements, expiration, history), `SessionPolicy` (timeout, single session, new device alerts), `AccessPolicy` (IP whitelist, forced 2FA roles, brute-force config), `ApiKey` (4 keys with scopes and statuses), `Webhook` (3 webhooks with delivery history), `BackupSchedule` + `BackupEntry` (8 backups), constant arrays for Selects (timezones, date formats, currencies, scopes, events, providers, frequencies, storages)
- Created `src/app/components/settings/SettingsPage.tsx` — single-route page with 6 sections:
  - Left-rail nav (240px, sticky) with yellow active pill styling — responsive: horizontal scrollable chips at sm–lg, Select dropdown at sm
  - Section 1 — Общие: organization Card (drag-and-drop logo uploader tile + 6 form inputs in 2-col grid) + regional settings Card (timezone/dateFormat/currency Selects, 24h/12h time toggle, first day of week toggle) + sticky save bar
  - Section 2 — Локализация: languages Card (3 languages with enable/disable Switch, default language Select) + translations Card (20 keys, search input, sticky-column Table with key/RU/UZ-Cyr/UZ-Lat, Import/Export JSON buttons)
  - Section 3 — Интеграции: 7 Collapsible integration Cards (1С with sync freq/last sync/run button, SMS with provider Select/test send, Email with SMTP fields/TLS/test send, Telegram with token/webhook/link, GA with measurement ID, Yandex Metrika with counter ID, Sentry with DSN/env/traces), each with enable Switch + Badge + test/save buttons
  - Section 4 — Безопасность: password policy Card (min length Slider 8–32, 4 requirement Switches, expiration days, history count) + sessions Card (timeout input, single session Switch, new device Switch) + access Card (IP whitelist Textarea, 2FA role chip multi-select with yellow active, brute-force Switch with conditional threshold inputs) + sticky save bar
  - Section 5 — API и Webhooks: API keys Card (desktop Table with 7 columns + mobile card list, create Dialog with name/scopes chip selector/expiration, copy/rotate/revoke actions via DropdownMenu) + webhooks Card (desktop Table with 7 columns + mobile card list, row click opens delivery history Sheet/drawer with event badges/response codes/JSON payloads, create Dialog with name/URL/events chip selector) + Swagger link Card
  - Section 6 — Резервное копирование: schedule Card (frequency/time/retention/storage form) + backups Card (desktop Table + mobile card list, download/restore/delete actions with Tooltips, create backup button) + restore confirmation Dialog (Pattern G with AlertTriangle, typed-confirm with backup ID) + sticky save bar
  - All interactions produce toast notifications via sonner
- Updated `routes.tsx` — replaced settings placeholder with `SettingsPage` import

---

## 2026-05-24 — Audit Log (Prompt 11a)

**Built the Audit Log page — 4-tab log viewer with detail page and diff viewer.**

### What changed
- Created `src/lib/audit-mock-data.ts` — `AuditEntry` type (id, timestamp, user, IP+geo, user-agent, request/session IDs, action type, object type/label/href, changes array, old/new JSON, related entry IDs), `AuditActionType` (login/logout/create/update/delete/export/import/view/approve/reject) with colored Badge styles, `AuditObjectType` (application/client/partner/branch/user/settings), `SystemLogEntry` (level/component/message/stack trace), `IntegrationLogEntry` (source/direction/endpoint/status/duration/retry/payloads), `SecurityAlert` (severity/title/description/status/resolved info), `AlertRule` (trigger/threshold/window/recipients/enabled), 50 audit entries across 8 users and 7 IPs, 20 system logs (4 levels), 15 integration logs (4 sources), 10 security alerts, 5 alert rules
- Created `src/app/components/audit/AuditPage.tsx` — single-route page with 4 underline tabs:
  - Действия пользователей: shared FilterBar (search + action type Select + object type Select + reset), dense desktop DataTable (48px rows, 7 columns: timestamp with ms tooltip, user avatar+name+role Badge, IP with geo flag emoji+city tooltip, action Badge, object link, changes with arrow old→new, Eye button) + mobile card list (Pattern K), pagination (20/50/100 per page)
  - Системные логи (Superadmin): severity filter buttons (Все/Error/Warning/Info/Debug with yellow active state), Live mode toggle Switch, desktop Table + mobile card list, expandable rows with stack trace in dark mono code block
  - Логи интеграций (Superadmin): 4 source sub-tabs (1С/BNPL/SMS/Email), desktop Table (timestamp, direction icon with tooltip, endpoint mono, status code Badge color-coded, duration color-coded, retry count) + mobile card list, expandable rows with request/response JSON payloads (side-by-side on desktop, stacked on mobile, Copy button)
  - Алерты безопасности (Superadmin): status filter buttons (Все/Активные/Разобранные with counts), card list with severity-colored Card backgrounds, AlertTriangle/Info icons, title, description, timestamp, resolved info, empty state with Shield icon
  - PageHeader (H1 "Журнал аудита", entry count caption, Refresh, Export dropdown, "Настроить алерты" button)
  - AlertsConfigDialog (720px Dialog): editable rule list with trigger Select (8 triggers), threshold + unit inputs, time window input, recipient Badges, enabled Switch, add/remove rules
- Created `src/app/components/audit/AuditDetailPage.tsx` — detail page (Pattern D) with:
  - Back nav "← Назад к журналу" ghost Link
  - Hero band Card: timestamp H2 (dd MMMM yyyy, HH:mm:ss.SSS), user avatar+name+role Badge, action Badge, object link, entry ID Badge
  - Context Card: 2×2 grid InfoRow — IP+geo (Globe icon), User-Agent (Monitor icon), Request ID (Hash icon, mono), Session ID (Key icon, mono)
  - Changes Card: human-readable field changes (old strikethrough red → new green) + JSON diff viewer — side-by-side on desktop (red "Было" / green "Стало" headers, changed lines highlighted) + unified diff on mobile (−/+ markers, red/green backgrounds)
  - Related entries Card: clickable linked audit entries with ID Badge + time + action Badge + object label
  - Sticky bottom bar: "Открыть объект" primary yellow Button
- Updated `routes.tsx` — replaced audit placeholder with `AuditPage` import + added `audit/:id` route with `AuditDetailPage`
- Updated `AppShell.tsx` — added `/audit/:id` breadcrumb mapping ("Аудит" → "Запись AUD-XXX")

---

## 2026-05-24 — Notifications Center (Prompt 10a)

**Built the Notifications page — day-grouped notification list with filters and settings drawer.**

### What changed
- Created `src/lib/notifications-mock-data.ts` — `AppNotification` type (id, type, severity, title, body, timestamp, read, optional action/source hrefs), `NotificationType` enum (applications/partners/security/system/anomalies) with colored Badge styles, `NotificationSeverity` enum (critical/warning/info/normal) with icon/color mappings, 30 mock notifications spanning 7 days across all types and severities (7 unread), `ChannelMatrixRow` type with 6 notification types × 5 channels (system/email/sms/push/telegram), `defaultChannelMatrix` with realistic defaults, `CHANNEL_LABELS` map
- Created `src/app/components/notifications/NotificationsPage.tsx` — single-route page with:
  - PageHeader (H1 "Уведомления", unread/total caption, "Прочитать все" ghost button, "Настройки уведомлений" button with Settings icon)
  - Filter bar (gray-50 surface): segmented control (Все/Непрочитанные/Прочитанные with yellow active state), type chips (5 multi-select, yellow when active), severity chips (4 multi-select, yellow when active), "Сбросить фильтры" clear button
  - Notification list grouped by day (sticky day headers with count, date-fns formatting with ru locale): each row 80px with severity icon in colored circular badge, title (semibold when unread) + 2-line body + type/severity Badge tags, relative time, action chip Button (if applicable), unread dot (8px yellow), 3px yellow left border for unread rows / gray-50 bg for read rows
  - Row hover: reveals icon-buttons (mark read/unread with Eye/EyeOff, Archive, Delete with red tint)
  - Row click: marks read + navigates to sourceHref via useNavigate
  - Mark all read: batch updates all notifications
  - Archive/delete: removes notification from state
  - Empty state: BellOff 48px icon + "Уведомлений нет" + descriptive text
  - Mobile (Pattern K): action chips stack below title on sm, time/unread dot inline with badges on mobile, hover actions hidden (mobile only has tap-to-navigate)
  - Internal sub-component: `NotificationSettingsDrawer`
- Settings drawer (Pattern D2, Sheet right, 720px desktop / full-screen mobile):
  - "Тихие часы" section: enabled Switch, time range pickers (from–to), day selector chips (Пн–Вс multi-select, 44px touch targets, yellow active state)
  - "Матрица каналов" section: Table with sticky first column, 6 rows (Новая заявка/Изменение статуса/Партнёр недоступен/Аномалия/Системные/Безопасность) × 5 channel columns with Switch toggles, 44px min-height cells
  - "Сводки" section: daily digest Switch + time picker, weekly report Switch
  - Sticky save footer with full-width yellow primary button
- Updated `routes.tsx` — replaced notifications placeholder with `NotificationsPage` import and route

---

## 2026-05-24 — Telegram Bot Page (Prompt 9a)

**Built the Telegram Bot management page — single route with 6 tabs covering bot configuration, messaging, and analytics.**

### What changed
- Created `src/lib/telegram-mock-data.ts` — `BotConfig` type (token, webhook, welcome messages, commands), `MessageTemplate` type with multi-language content (15 templates across 4 categories: greetings/statuses/reminders/marketing), `Broadcast` type with progress tracking (8 broadcasts with various statuses), `Subscriber` type with linked clients (20 subscribers, 2 blocked), `TelegramKpi` type (DAU/MAU/subscribers/clicks), `FaqItem` type with RU/UZ translations (8 items), `AutoReplyRule` type with regex support (5 rules), funnel data (4 steps), retention data (D1/D7/D14/D30), top commands (7 entries), DAU/MAU chart data (30 days), template variables list (16 variables with descriptions)
- Created `src/app/components/telegram/TelegramPage.tsx` — single-route page with 6 underline tabs:
  - Общие настройки: connection Card (masked token with eye/copy/rotate, webhook URL with check button + success alert), welcome message Card (RU/UZ language tabs, Textarea with variable hints, Telegram-style dark bubble preview on right/below), bot commands Card (draggable list with GripVertical handles, command + description + enabled Switch + delete, reorder via HTML5 drag API)
  - Шаблоны сообщений: 5 category sub-tabs (Все/Приветствия/Статусы заявок/Напоминания/Маркетинг), responsive card grid (3→2→1 col) showing name + language Badges + preview snippet + editor info, click opens Dialog (RU/UZ-Кир/UZ-Лат tabs, Textarea + variable picker with Tooltips, live Telegram preview, test send input)
  - Рассылки: desktop DataTable (name, segment Badge, template link, scheduled date, progress bar with sent/total count, delivery %, read %, clicks, status Badge) + mobile card list (name + status + progress bar + 3-col stats), 5-step create broadcast Dialog (audience segment Select with size preview → template Select with Telegram preview → schedule now/later with date/time → A/B test toggle with split variants → summary confirmation), step indicator with yellow progress dots
  - Подписчики: search input + status Select filter, desktop DataTable (avatar, @username, linked client with ID, subscription date, last activity, message count, status Badge, ban/unban button) + mobile card list (avatar + username + status Badge)
  - Аналитика: 4 KPI tiles (DAU/MAU/subscribers/clicks with delta TrendingUp/Down), Recharts AreaChart (DAU+MAU over 30 days, yellow+gray), conversion funnel (4 horizontal bars: Подписка→Первый клик→Первая заявка→Одобрено with percentages), BarChart (top 7 commands, horizontal layout), LineChart (retention D1/D7/D14/D30 with dot markers)
  - FAQ и автоответы: 50/50 grid — FAQ section (expandable accordion items with RU/UZ language tabs, active Switch per item, "+ Добавить" button) + auto-replies section (IF keyword/regex THEN template cards with active Switch + delete, "+ Добавить правило" button)
  - Internal sub-components: SettingsTab, TemplatesTab, BroadcastsTab, SubscribersTab, AnalyticsTab, FaqTab
- Updated `routes.tsx` — replaced telegram placeholder with `TelegramPage` import and route

---

## 2026-05-24 — Analytics Page (Prompt 8a)

**Built the Analytics page — densest data view in the app with KPIs, charts, grouping, cohort analysis, and reports.**

### What changed
- Created `src/lib/analytics-mock-data.ts` — `AnalyticsKpi` type (8 metrics: applications, requested/approved/issued sums, conversion, avg time, repeat rate, LTV), `GroupingRow` type with sparkline data, `CohortRow`/`CohortCell` types, `GeneratedReport`/`ScheduledReport`/`ReportTemplate` types, `GROUPING_DATA` with 8 dimensions (partners/branches/operators/statuses/products/terms/age/regions), 6-month cohort retention data, 10 generated reports (3 statuses), 3 scheduled reports, 7 report templates, `generateChartData()` function for dynamic chart points, `formatKpiValue()`/`formatCompactCurrency()` helpers
- Created `src/app/components/analytics/AnalyticsPage.tsx` — single-route dense analytics page with:
  - PageHeader (H1 "Аналитика", period caption, "Сравнить с прошлым" Switch, Export dropdown, "Создать отчёт" CTA)
  - Control Bar (gray-50 surface): period segmented buttons (8 options: Сегодня/Вчера/7д/30д/3м/6м/1г/Произвольный with Calendar range picker Popover), comparison period display when enabled, grouping Select (8 dimensions), refresh button. Mobile: period becomes Select dropdown.
  - KPI Grid (4×2): 8 metric tiles with formatted values, delta percentages (TrendingUp/TrendingDown icons, green/red), comparison previous values when compare enabled, click-to-focus ring highlight drives the main chart
  - Main Chart: Recharts Line/Bar/Area chart via ToggleGroup (desktop) or Select dropdown (mobile), granularity tabs (По часам/По дням/По неделям), comparison dashed gray line when enabled, Brush zoom component for 30+ datapoints (hidden on sm), responsive height (480px lg / 320px md / 240px sm), custom Tooltip
  - Grouping Table: DataTable with columns (name, applications count + SVG sparkline, conversion % + bar visual, avg time, total issued, share % + bar, delta when comparing); mobile card list (3-col grid: applications/conversion/issued)
  - Cohort Analysis: collapsible Card (default closed), heatmap table with sticky first column, cells color-coded by retention (yellow gradient scale), Tooltip with absolute counts
  - Reports Panel with 3 sub-tabs:
    - Сгенерированные: DataTable (10 reports) with status Badges (Готов/В процессе/Ошибка), actions dropdown (download/share/delete); mobile card list
    - Расписание: card list of 3 scheduled reports with frequency Badge, recipient list, next run time, enable Switch, edit/delete dropdown
    - Шаблоны: responsive grid (4→3→2→1 col) of 7 template cards with Lucide icons, descriptions, "Сгенерировать" button
  - Create Report Dialog (720px, 3-step wizard): Step 1 template selection grid → Step 2 parameters (period, grouping, filters) → Step 3 format (XLSX/CSV/PDF) + email + optional schedule with frequency Select; step indicator with yellow progress dots
  - Internal sub-components: ControlBar, KpiTile, MainChart, GroupingTableRow, GroupingMobileCard, MiniSparkline (SVG polyline), CohortHeatmap, ReportsPanel, CreateReportDialog
- Updated `routes.tsx` — replaced analytics placeholder with `AnalyticsPage` import and route

---

## 2026-05-24 — Users Module (Prompt 7a)

**Built Users list page and detail page with 5 tabs — table with role-based features, sync panel, and invite modal.**

### What changed
- Created `src/lib/users-mock-data.ts` — `User` type with full schema (personal info, role, branch, security config, sessions, login history, activity, stats), `UserRole` (superadmin/admin/operator/agent) and `UserStatus` (active/deactivated) types with Badge styling, 12 mock users (1 superadmin, 2 admins, 5 operators, 4 agents), 1 deactivated user (USR-012, blocked after 5 failed attempts), helper types for sessions/login history/activity/stats, branches list constant
- Created `src/app/components/users/UsersPage.tsx` — list page with:
  - PageHeader (H1, counts for total/active, search, refresh, export, "+ Пригласить пользователя" CTA)
  - Collapsible sync panel Card (1С / Брокер / Партнёры) with green/amber status dots, last sync time, "Запустить" button per source
  - FilterBar with 3 Select filters (role, branch, status) — bg-gray-50 container, result count, "Сбросить" clear button
  - Desktop DataTable with 9 columns: checkbox, employee (36px avatar + name + email), phone, role Badge (Superadmin=black, Admin=yellow, Operator=blue, Agent=gray), branch, status Badge, last login with IP Tooltip, created date, actions dropdown (Открыть, Сбросить пароль, Деактивировать, Удалить)
  - Row height 64px, click navigates to `/users/:id`, selected row yellow tint + left border
  - Pagination (20/50/100 per page) with page nav
  - Mobile card list below md (Pattern K): avatar + name + email + role Badge + status Badge
  - Bulk actions floating toolbar (Деактивировать, Э��спорт, Удалить)
  - Invite modal (Dialog, Pattern E): two-tab interface "Пригласить по email" / "Создать с временным паролем", fields: ФИО, email, phone, role Select, branch Select (conditional on role=operator/agent), checkbox "Отправить инструкцию по входу"
- Created `src/app/components/users/UserDetailPage.tsx` — detail page with:
  - Back nav "← Назад к пользователям" ghost Link
  - Hero band (64px avatar, fullName H2, email caption, role Badge, status Badge, branch Badge, status Switch, "Сбросить пароль" button, MoreHorizontal dropdown with Деактивировать/Сбросить 2FA/Удалить)
  - 5 underline tabs (Pattern J): Информация, Безопасность, Сессии, Активность, Статистика
  - Информация tab: 2-col grid — "Личные данные" Card (InfoRow: ФИО, email, phone, created date, created by) + "Роль и доступ" Card (role Select, branch Select if applicable, permissions)
  - Безопасность tab: 2-col grid — "Аутентификация" Card (2FA Switch, last password change, failed attempts with red highlight if ≥3, Сбросить 2FA/пароль buttons) + "Политики безопасности" Card (4-item checklist with green CheckCircle2/red XCircle icons)
  - Сессии tab: "Активные сес��ии" Card (device rows with Monitor/Smartphone icons, browser, IP, location, time, "Текущая" badge, "Завершить" button) + "История входов" Card (desktop Table with 5 columns + mobile cards, LoginResultBadge: success=green, error=red, blocked=amber)
  - Активность tab: Pattern J vertical timeline with 12px yellow dots, action + target + details + timestamp, "Открыть полный аудит →" link to `/audit`
  - Статистика tab (conditional, Operator/Agent only): 4 KPI tiles (processed apps, conversion %, avg response time, active clients) + Recharts LineChart (daily applications, yellow stroke) + Recharts BarChart (monthly conversion, yellow fill)
  - Sticky action bar: "Удалить пользователя" destructive ghost left + "Сохранить изменения" primary disabled right
- Updated `routes.tsx` — replaced users placeholder with `UsersPage` + added `users/:id` route with `UserDetailPage`
- Updated `AppShell.tsx` — added `/users/:id` breadcrumb mapping

---

## 2026-05-24 — Branches Module (Prompt 6a)

**Built Branches list page and detail page with 5 tabs — table + map views with drag-and-drop priorities editor.**

### What changed
- Created `src/lib/branches-mock-data.ts` — `Branch` type with full schema (employees, partner configs, day schedules with priority slots, stats), 10 mock branches across Uzbekistan regions (Ташкент ×2, Самарканд, Бухара, Андижан, Фергана, Наманган, Кашкадарья, Хорезм, Сурхандарья), 1 inactive (Ургенч), helper types for employees/partner configs/priority slots/day schedules
- Created `src/app/components/branches/BranchesPage.tsx` — list page with:
  - PageHeader (H1, counts for total/active, view toggle List/Map, refresh, export, "+ Добавить филиал" CTA)
  - FilterBar with search input + status filter chip + region filter chip — yellow active state, clear all button
  - List view (default): desktop DataTable with 8 columns (name, address, region, employees with avatar group, active partners, daily applications with trend icon, status badge, actions dropdown) + mobile card list (Pattern K)
  - Map view: SVG Uzbekistan outline with positioned markers (yellow=active, gray=inactive), hover tooltips (branch name + employee count + daily applications), linked branch list below map with hover sync, legend
  - Empty state with MapPin icon
- Created `src/app/components/branches/BranchDetailPage.tsx` — detail page with:
  - Hero band (branch name, status badge, address/phone/hours with icons, status Switch, "На карте" button, MoreHorizontal dropdown)
  - 5 underline tabs (Pattern J): Общая информация, Сотрудники, Партнёры филиала, Приоритеты, Статистика
  - Общая информация tab: 2-col grid — InfoRow card (name, address, coordinates, phone, hours, manager with avatar) + mini SVG map with pin and radius rings
  - Сотрудники tab: DataTable (desktop) / cards (mobile) with avatar, role badge (Оператор/Агент), phone, monthly applications; "Прикрепить сотрудника" button
  - Партнёры филиала tab: expandable partner cards with enable/disable Switch per partner + 15 term chips (toggleable months, yellow active pills), sticky save bar with cancel/save
  - Приоритеты tab (★ unique complexity):
    - Card A — live priority preview: shows current time/day + "podium" display of active partners sorted by priority (sized by rank)
    - Card B — schedule editor: day-of-week tabs (Пн–Вс + "Все дни"), 24-hour timeline visualization (desktop only — partner rows with colored time range bars), drag-and-drop ranked partner list (HTML5 drag API, grip handles, priority numbers, time range Popover selectors), add/remove partners, "Применить ко всем дням"
    - Sticky save bar with cancel/save
  - Статистика tab: 4 KPI tiles (daily/monthly applications, conversion, top partner) + Recharts area chart (daily applications) + 2 horizontal bar charts (top agents with yellow bars + top partners with per-partner colors via Cell components)
- Updated `routes.tsx` — replaced branches placeholder with `BranchesPage` + added `branches/:id` route with `BranchDetailPage`
- Updated `AppShell.tsx` — added `/branches/:id` breadcrumb mapping

---

## 2026-05-22 — Partners Module (Prompt 5a)

**Built Partners list page and detail page with 6 tabs — cards + table views with full Recharts statistics.**

### What changed
- Created `src/lib/partners-mock-data.ts` — `Partner` type with full schema (company info, API config, regions, terms, commission, settlements, stats, change history), 6 mock partners (Alif Nasiya, Anorbank, Uzum Nasiya, Iman, Multicard, Asia Alliance), helper types for settlements/API statuses/term options
- Created `src/app/components/partners/PartnersPage.tsx` — list page with:
  - PageHeader (H1, counts for total/active/offline, view toggle Cards/Table, refresh, export, "+ Добавить партнёра" CTA)
  - FilterBar with 3 filter chips (status, type, API status) — yellow active state, clear all button
  - Cards view (default): 3→2→1 col responsive grid, each card with logo, name, legal name, 3 mini-metrics, API health badge, status toggle Switch, hover "Открыть →" link
  - Table view: desktop DataTable with 8 columns + mobile card list (Pattern K)
  - Empty state with "Ничего не найдено"
- Created `src/app/components/partners/PartnerDetailPage.tsx` — detail page with:
  - Hero band (64px logo, name, legal name, description, status/API badges, status Switch, "Проверить подключение" button, MoreHorizontal dropdown)
  - 6 underline tabs (Pattern J): Обзор, Условия, API, Финансы, Статистика, История
  - Обзор tab: 2-col grid — company info (InfoRow) + regions with toggle Switches (select all/none) + category chip multi-select
  - Условия tab: 15 term chips (toggleable 1–36 months with live preview) + limit inputs (min/max amount, min/max age) + sticky save bar
  - API tab (Superadmin): Production/Sandbox toggle, masked keys with eye/copy/rotate buttons, webhook URL, weekday schedule display, timeout/retry config inputs, connection test with green success alert
  - Финансы tab: commission type radio (fixed/percent/hybrid) with conditional inputs + settlements table (desktop table + mobile cards) with period/amounts/status badges
  - Статистика tab: 4 KPI tiles (total apps, approved, conversion, avg check) + Recharts area chart (applications by day, period switcher) + donut (status distribution with legend) + bar chart (hourly applications)
  - История tab: Pattern J vertical timeline with 24px yellow dots, user who changed, field changed, old→new values with strikethrough/green styling, formatted dates
- Updated `routes.tsx` — added `/partners` (PartnersPage) and `/partners/:id` (PartnerDetailPage) routes
- Updated `AppShell.tsx` — added `/partners/:id` breadcrumb mapping

---

## 2026-05-22 — Dashboard Interactivity & Wiring

**Wired dashboard controls, navigation, and chart interactivity — everything is now functional, not just visual.**

### What changed
- **PageHeader** made fully controlled — `period` and `compareEnabled` props from parent Dashboard, no internal state duplication. Added `pt-3` top padding on title.
- **Dashboard** owns centralized `period` and `compareEnabled` state. `chartPeriod` derived value maps header dropdown values (`today`/`7days`/`30days`) to chart period values (`24h`/`7d`/`30d`).
- **KpiStrip** — new `showSparklines` prop. Sparkline mini-charts under KPI cards are hidden by default, shown only when "Сравнить с прошлым" toggle is active.
- **Period syncing** — changing the header dropdown updates all chart tab periods; changing a chart's own tab updates the header dropdown. Bidirectional via callbacks.
- **RecentApplicationsWidget** — replaced `console.log` navigation stubs with real `useNavigate()` calls. Row clicks go to `/applications/:id`, "Все заявки" button goes to `/applications`.
- **PartnerDistributionDonut** — full interactive hover rewrite. Shared `activeIndex` state between Recharts Pie (via `activeShape` / `onMouseEnter` / `onMouseLeave`) and custom legend rows. Active sector expands (outerRadius+6, innerRadius-3), inactive sectors dim to 40% opacity. Legend rows get `bg-gray-100` highlight, color dot scales up, text bolds.
- Removed leftover `col-span-12 md:col-span-*` classes from all chart Card components (ApplicationsDynamicsChart, PartnerDistributionDonut, ApplicationStatusesChart, TopBranchesChart, RecentApplicationsWidget) — these referenced a 12-column grid that no longer exists.

---

## 2026-05-22 — Dashboard Scroll Fix & Layout Restructure

**Fixed non-scrollable dashboard and restructured chart grid into row-based layout.**

### What changed
- **Dashboard.tsx** — removed `h-full overflow-hidden` from root div, removed `flex-1 min-h-0` from inner containers. Content now flows at natural height; `<main>` element's `overflow-auto` handles scrolling.
- **AppShell.tsx** — removed `h-full` from `max-w-[1400px]` content wrapper (was forcing content to match main height exactly).
- **Chart layout restructured** from single 3-column grid with `row-span-2` to three separate rows:
  - Row 1: `grid-cols-3` — Динамика заявок (`col-span-2`, 2/3 width) + Распределение по партнёрам (1/3 width), both `h-full` for equal height
  - Row 2: `grid-cols-2` — Статусы заявок + Топ-10 филиалов, balanced 50/50 width
  - Row 3: Последние заявки at full width

---

## 2026-05-22 — Clients Module (Prompt 4a)

**Built Clients list page and detail page with 5 tabs — first entity module beyond Applications.**

### What changed
- Created `src/lib/clients-mock-data.ts` — `Client` type with full schema (personal data, contacts, cards, installments, payments, activity, comments, tags), 20 mock clients, featured "Алиев Озодбек CL-00428", scoring color helper
- Created `src/app/components/clients/ClientsPage.tsx` — list page with:
  - PageHeader (H1, counts, search, refresh, export, "+ Добавить клиента" CTA)
  - FilterBar with status filter + result count
  - DataTable with 11 columns (checkbox, ID, avatar+name+PINFL, masked phone click-to-reveal, scoring colored dot, applications, installment sum, registration, activity, VIP/blacklist/status flags, actions dropdown)
  - Pagination (20/50/100 per page)
  - Mobile card list below md (Pattern K)
  - Bulk actions toolbar (SMS, export, block)
- Created `src/app/components/clients/ClientDetailPage.tsx` — detail page with:
  - Hero band (80px avatar, full info, status/VIP/blacklist badges, action cluster)
  - 4 stat tiles (scoring with progress, active installments, total applications, LTV)
  - 5 underline tabs (Pattern J): Профиль, Финансы, Заявки, Активность, Комментарии и теги
  - Profile tab: 2-col grid (personal data, contacts, documents with hover overlay, additional)
  - Finance tab: linked cards (verified badges), active installments (progress bars), payment history (desktop table + mobile cards), credit score gauge
  - Applications tab: summary stats + link to filtered applications
  - Activity tab: Pattern J timeline with type filters
  - Comments tab: thread + compose box + internal switch; tag editor with suggestions
- Updated `routes.tsx` — added `/clients` (ClientsPage) and `/clients/:id` (ClientDetailPage)
- Updated `AppShell.tsx` — added `/clients/:id` breadcrumb mapping

---

## 2026-05-22 — Auth Routing (Prompt 2a)

**Wired all 4 auth pages into React Router with mock auth state, route guards, and toast notifications.**

### What changed
- Created `AuthContext.tsx` — mock auth state with `isAuthenticated`, `needsTwoFactor`, `login()`, `verify2FA()`, `logout()` using sessionStorage
- Created `RequireAuth.tsx` — `RequireAuth` and `RedirectIfAuthenticated` guard components
- Updated `routes.tsx` — added `/login` route tree with `GuestLayout` (redirects authenticated users to `/`), wrapped app routes in `ProtectedLayout` (redirects unauthenticated users to `/login`)
- Updated `LoginPage.tsx` — `useNavigate` to `/login/2fa` on success, `<Link>` for forgot password, toast notification
- Updated `Login2FAPage.tsx` — `useNavigate` to `/` on success, guard redirects to `/login` if step 1 not completed
- Updated `ForgotPasswordPage.tsx` — `<Link>` for back navigation, toast on submit
- Updated `ResetPasswordPage.tsx` — `useNavigate` to `/login` after reset, toast notification
- Updated `App.tsx` — wrapped with `AuthProvider` + sonner `Toaster`
- Updated `AppShell.tsx` — "Выйти" dropdown item wired to `logout()` + navigate to `/login`

### Auth flow
`/login` → (1.5s mock, 30% success) → `/login/2fa` → (OTP auto-submit) → `/` (Dashboard)

---

## 2026-05-22 — Application Detail Page Bottom Bar Fix

**Fixed the bottom action bar on ApplicationDetailPage that was scrolling with content instead of staying fixed.**

### What changed
- Restructured page layout from single scroll container to flex column (`h-full flex flex-col`)
- Content area now uses `flex-1 overflow-auto min-h-0` for independent scrolling
- Bottom bar moved outside scroll area with `shrink-0`
- Bar uses `-mx-4 -mb-4` negative margins to break out of main's `p-4` padding
- Bar padding adjusted to `px-8 md:px-10` to align content with page content above

---

## 2026-05-21 — Application Detail Page Rewrite

**Complete rewrite of `ApplicationDetailPage.tsx` to match Prompt 3a spec and Patterns D/J/K.**

### What changed
- Removed blue gradient hero — replaced with white Card hero band (Pattern D) with H2 + status Badge + date + action buttons + MoreHorizontal dropdown
- Added 7 underline tabs (Pattern J): Сводка, Клиент, Этапы, Партнёры, Документы, Комментарии, История
- Сводка tab: 2-column InfoRow cards (Основные данные + Назначение) + банковские карты with verification badges
- Клиент tab: avatar + ФИО + ПИНФЛ + scoring progress bar + contacts + link to `/clients/:id`
- Этапы tab: Pattern J vertical stepper timeline (24px dots, 2px connectors)
- Партнёры tab: DataTable on desktop, card list on mobile (Pattern K)
- Документы tab: thumbnail grid with dark hover overlay (Eye/Download icons) + dashed upload tile
- Комментарии tab: comment thread with avatars + gray bubbles + compose box with "Внутренний" Switch
- История tab: compact audit timeline with timestamps + "Открыть полный аудит" link
- Back nav moved outside hero as standalone ghost link
- Made layout full-width (removed `max-w-5xl mx-auto`)
- Removed overflow-x-auto from tab bar
- Added mobile responsive layout throughout (Pattern K)
- Added inline mock data for comments, history, bank cards, partner decisions

---

## 2026-05-21 — Prompt Pack Update: Detail Pages & Mobile Responsiveness

**Updated `docs/dashboard_prompt_pack_part2.md` with two major architectural changes across all 14 prompts.**

### Drawer → Detail Page migration
- Rewrote Pattern D from "Detail Drawer (right-side)" to "Detail Page (full route)"
- Added Pattern D2 for settings/config drawers only (non-entity panels)
- Updated Prompt 3a (Applications): drawer → full `/applications/:id` page with 7 tabs
- Updated Prompt 7a (Users): drawer → full `/users/:id` page with 5 tabs
- Updated Prompt 11a (Audit): drawer → `/audit/:id` detail page with diff viewer; integration logs use inline accordion
- Prompt 10a (Notifications): settings drawer kept as Pattern D2
- Updated Master Prompt 1a: mandates full pages, never drawers for entity details

### Mobile Responsiveness (Pattern K)
- Added global Pattern K with breakpoints (sm/md/lg/xl) and responsive rules
- Added `### RESPONSIVE (Pattern K)` section to every page prompt (2a through 13a)
- Key rules: tables→card lists below md, modals→full-screen sheets, 44px touch targets, charts resize, sidebar→hamburger
- Updated Build Checklist with 8 new mobile responsiveness items
- Removed "desktop-first" caveat from out-of-scope section

---

## 2026-05-21 — Project Setup & Doc Sync

**Initial bootstrap from Figma Make export + documentation creation.**

- Exported codebase from Figma Make (Texnomart AI Dashboard)
- Created `CLAUDE.md` with full project documentation (tech stack, structure, design system, conventions)
- Updated `.claude/rules/design.md` with comprehensive design token and pattern references
- Created `docs/AI_CONTEXT.md` — current state snapshot with known issues and TODOs
- Created `tasks/lessons.md` — initial lessons from Figma Make codegen patterns
- Created `HISTORY.md` (this file)
- Created `texno-docs/docs.md` — consolidated design specification reference
- Existing commands (`start_task`, `doc_sync`, `ux-analysis`, `ux-designer`) confirmed functional

### Implemented at export time
- Dashboard page: 8 KPI cards, 5 chart widgets, alerts panel, keyboard shortcuts
- Applications module: table + kanban views, detail page, detail drawer, bulk actions
- Auth pages: login, 2FA, forgot password, reset password (not routed)
- App shell: sidebar navigation, header with search/notifications/theme, breadcrumbs
- 40+ shadcn/ui primitive components
- Design tokens in `theme.css` (light + dark mode variables)
