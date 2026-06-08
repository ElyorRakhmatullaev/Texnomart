# Texnomart AI Dashboard

BNPL credit broker admin panel for Texnomart (Uzbekistan electronics retailer). Originated from Figma Make, continuing active development here.

**Figma source**: `https://www.figma.com/design/23kqh6Bgib8vYPsQx50xPh/Texnomart-AI-Dashboard`

## Tech Stack

- **Runtime**: React 18.3.1 + TypeScript
- **Build**: Vite 6.3.5, pnpm
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin, `@import` syntax — NOT `tailwind.config.js`)
- **UI Kit**: shadcn/ui (Radix primitives) via `@texnomart/ui` shared package (`packages/ui/`)
- **Charts**: Recharts 2.x
- **Routing**: React Router v7 (browser router, `createBrowserRouter`)
- **Icons**: Lucide React
- **Animations**: Motion (framer-motion successor), tw-animate-css
- **Drag-and-drop**: react-dnd + HTML5 backend
- **Dates**: date-fns with `ru` locale
- **Path aliases**: `@` -> `./src`, `@texnomart/ui` -> `../packages/ui/src` (configured in vite.config.ts)

## Commands

```
pnpm install      # install dependencies (requires allowBuilds in pnpm-workspace.yaml)
pnpm dev          # start dev server (Vite)
pnpm build        # production build
```

> **Note**: pnpm v11 requires build script approvals. `pnpm-workspace.yaml` has `allowBuilds` set to `true` for `@tailwindcss/oxide` and `esbuild`. If `pnpm install` fails with `ERR_PNPM_IGNORED_BUILDS`, check that file.

## Project Structure

```
src/
  main.tsx                          # Entry point
  app/
    App.tsx                         # RouterProvider + AuthProvider + Toaster
    routes.tsx                      # All routes (createBrowserRouter) + auth guards
    components/
      AppShell.tsx                  # Layout: sidebar + header + breadcrumbs + Outlet + logout
      Dashboard.tsx                 # Main dashboard page (scrollable, state-driven)
      PageHeader.tsx                # Dashboard header (controlled period, compare toggle, refresh, export)
      KpiStrip.tsx                  # 8 KPI cards (4-col grid); sparklines toggled by compare mode; cards link to /dashboard/:metricId
      dashboard/                    # Dashboard drill-down pages: KpiDetailPage (metric detail with trend chart, breakdown table, related metrics)
      ApplicationsDynamicsChart.tsx # Line chart (total vs approved)
      ApplicationStatusesChart.tsx  # Stacked bar chart
      PartnerDistributionDonut.tsx  # Donut chart (interactive hover on sectors + legend)
      TopBranchesChart.tsx          # Horizontal bar ranking
      RecentApplicationsWidget.tsx  # Live-updating recent applications table (navigates to /applications/:id)
      AlertsWidget.tsx              # Alerts/notifications panel
      GeographyMap.tsx              # SVG placeholder map (TODO: Yandex Maps)
      KeyboardShortcutsDialog.tsx   # Keyboard shortcuts help
      # ui/ removed — now shared via @texnomart/ui (packages/ui/)
      auth/                         # Auth module: Login, 2FA, ForgotPassword, ResetPassword, AuthContext, RequireAuth
      applications/                 # Applications module: list (ApplicationsPage), detail (7 tabs), kanban
      clients/                      # Clients module: list (ClientsPage, table + mobile cards), detail (5 tabs)
      partners/                     # Partners module: list (cards + table views), detail (6 tabs)
      branches/                     # Branches module: list (table + map views), detail (5 tabs incl. priorities editor)
      users/                        # Users module: list (UsersPage, table + mobile cards, filters, sync panel, invite modal), detail (5 tabs)
      analytics/                    # Analytics module: dense data page (KPIs, charts, grouping table, cohort heatmap, reports)
      telegram/                     # Telegram Bot module: settings, templates, broadcasts, subscribers, analytics, FAQ
      notifications/                # Notifications module: history list, settings drawer
      audit/                        # Audit module: 4-tab log page (user actions, system, integrations, security alerts), detail with diff viewer
      settings/                     # Settings module: 6-section Superadmin page (general, localization, integrations, security, API/webhooks, backup)
      profile/                      # Profile module: current user's own profile (5 tabs: info, security, notifications, sessions, interface)
      figma/                        # Figma-specific helpers (ImageWithFallback)
  lib/
    mock-data.ts                    # Dashboard mock data & types
    applications-mock-data.ts       # Applications module mock data & types
    clients-mock-data.ts            # Clients module mock data & types (20 clients)
    partners-mock-data.ts           # Partners module mock data & types (6 partners)
    branches-mock-data.ts           # Branches module mock data & types (10 branches)
    users-mock-data.ts              # Users module mock data & types (12 users)
    analytics-mock-data.ts          # Analytics module mock data & types (KPIs, grouping, cohort, reports)
    telegram-mock-data.ts           # Telegram Bot mock data & types (bot config, templates, broadcasts, subscribers, FAQ)
    notifications-mock-data.ts      # Notifications mock data & types (30 notifications, channel matrix)
    audit-mock-data.ts              # Audit mock data & types (50 entries, system/integration logs, security alerts, alert rules)
    settings-mock-data.ts           # Settings mock data & types (org, regional, languages, translations, integrations, security policies, API keys, webhooks, backups)
  styles/
    index.css                       # CSS entry (imports fonts, tailwind, theme)
    tailwind.css                    # Tailwind v4 config (@import 'tailwindcss')
    theme.css                       # Design tokens (CSS variables, light/dark)
    fonts.css                       # Inter font import
    globals.css                     # Global overrides (currently empty)
  imports/pasted_text/              # Design specs from Figma prompts
```

## Implemented Pages

| Route | Component | Status |
|---|---|---|
| `/` | Dashboard | Done — KPIs (compare toggle shows/hides sparklines), charts with synced period filters, interactive partner donut, navigable recent applications |
| `/dashboard/:metricId` | KpiDetailPage | Done — parameterized KPI drill-down (hero card, 30-day trend chart, breakdown table/cards, horizontal bar chart, related metrics); 8 metrics: total-clients, applications-24h, applications-3h, conversion, total-amount, average-check, active-clients, scoring-time |
| `/applications` | ApplicationsPage | Done — table + kanban views, bulk actions |
| `/applications/:id` | ApplicationDetailPage | Done — 7-tab detail page (Сводка, Клиент, Этапы, Партнёры, Документы, Комментарии, История) |
| `/login` | LoginPage | Done — brute-force protection, 2FA redirect |
| `/login/2fa` | Login2FAPage | Done — 6-digit OTP, auto-submit |
| `/login/forgot-password` | ForgotPasswordPage | Done — email/SMS tabs, success state |
| `/login/reset-password/:token` | ResetPasswordPage | Done — strength meter, criteria checklist |
| `/clients` | ClientsPage | Done — table + mobile cards, search, filters, pagination, bulk actions, phone masking |
| `/clients/:id` | ClientDetailPage | Done — 5-tab detail page (Профиль, Финансы, Заявки, Активность, Комментарии и теги) |
| `/partners` | PartnersPage | Done — cards + table views, filters (status/type/API), status toggles, mobile card list |
| `/partners/:id` | PartnerDetailPage | Done — 6-tab detail page (Обзор, Условия, API, Финансы, Статистика, История) |
| `/branches` | BranchesPage | Done — table + map views, search, filters (status/region), mobile card list |
| `/branches/:id` | BranchDetailPage | Done — 5-tab detail page (Общая информация, Сотрудники, Партнёры, Приоритеты, Статистика) |
| `/users` | UsersPage | Done — table + mobile cards, filters (role/branch/status), sync panel, invite modal, bulk actions |
| `/users/:id` | UserDetailPage | Done — 5-tab detail page (Информация, Безопасность, Сессии, Активность, Статистика) |
| `/analytics` | AnalyticsPage | Done — KPI grid (8 metrics, click-to-focus), main chart (line/bar/area + comparison), control bar (period/grouping), grouping table (8 dimensions), cohort heatmap, reports panel (generated/scheduled/templates), create report wizard |
| `/telegram` | TelegramPage | Done — 6 tabs (Настройки, Шаблоны, Рассылки, Подписчики, Аналитика, FAQ), bot config, 5-step broadcast wizard |
| `/notifications` | NotificationsPage | Done — day-grouped list, filter bar (status/type/severity), settings drawer (quiet hours, channel matrix, digests) |
| `/audit` | AuditPage | Done — 4-tab log page (user actions, system logs, integration logs, security alerts), filter bar, alerts config dialog |
| `/audit/:id` | AuditDetailPage | Done — detail page with diff viewer (side-by-side/unified), context card, related entries |
| `/settings` | SettingsPage | Done — 6-section Superadmin page (Общие, Локализация, Интеграции, Безопасность, API и Webhooks, Резервное копирование), left-rail nav, responsive |
| `/profile` | ProfilePage | Done — 5-tab personal profile (Основная информация, Безопасность, Уведомления, Сессии, Интерфейс), left-rail nav, responsive |

## Design System

### Brand & Colors
- **Primary**: `#FFD60A` (Texnomart yellow), foreground `#000000`
- **Font**: Inter (400, 500, 600, 700), base size 16px
- **Spacing scale**: 4/8/12/16/20/24/32/40/48px
- **Border radius**: 0.625rem (10px)
- **Card shadow**: `0px 2px 4px rgba(204, 204, 204, 0.25)`

### Status Colors (Application Lifecycle)
| Status | CSS Variable | Hex |
|---|---|---|
| New | `--status-new` | `#3B82F6` |
| Scoring | `--status-pending` | `#F59E0B` |
| In Progress | `--status-in-progress` | `#8B5CF6` |
| Approved | `--status-approved` | `#10B981` |
| Rejected | `--status-rejected` | `#EF4444` |
| Cancelled | `--status-cancelled` | `#6B7280` |
| Completed | `--status-completed` | `#059669` |
| Awaiting Docs | `--status-on-hold` | `#F97316` |
| Partially Approved | `--status-returned` | `#EC4899` |
| Expired | `--status-expired` | `#DC2626` |
| Archived | `--status-archived` | `#9CA3AF` |

### UI Patterns
Documented in `src/imports/pasted_text/ui-patterns.md` (Patterns A-J) and extended in `docs/dashboard_prompt_pack_part2.md` (Patterns A-K):
- **A** PageHeader — 64px, H1 (`text-2xl md:text-[32px] font-bold leading-tight text-gray-900`) + controls
- **B** FilterBar — chips with popover filters
- **C** DataTable — shadcn Table in Card, 56-72px rows, sticky header
- **D** Detail Page — full route `/entity/:id` with back nav, hero band, tabs (NO side drawers for entity details)
- **D2** Settings/Config Drawer — Sheet right, 720px (only for non-entity panels like notification settings)
- **E** Create/Edit Modal — Dialog 560-720px (full-screen Sheet on mobile)
- **F** Bulk Actions Toolbar — black floating bar (sticky bottom sheet on mobile)
- **G** Confirmation Dialog — AlertTriangle + typed confirmation
- **H** Status Badge System — consistent badge styling per domain
- **I** Unified States — Skeleton loading, empty, error states
- **J** Detail View Sub-components — InfoRow, Timeline, Tabs
- **K** Mobile Responsiveness — breakpoints sm/md/lg/xl, tables→card lists, 44px touch targets

## Language & Locale

- All UI text is in **Russian** (Русский)
- Currency: **UZS** (Uzbekistani som), formatted with `toLocaleString("ru-RU")`
- Phone format: `+998 XX XXX-XX-XX`
- Date locale: `date-fns/locale/ru`
- Supported languages (selector exists): RU, O'zbek (Кирилл.), O'zbek (Лат.)

## Conventions

- All data is currently **mock** — defined in `src/lib/` files. No API integration yet.
- Components use `"use client"` directive (Figma Make convention, safe to keep).
- Keyboard shortcuts: `⌘K` search, `R` refresh, `?` shortcuts help, `1-8` KPI focus.
- Sidebar navigation has role-based filtering (Superadmin/Admin for Audit, Superadmin for Settings).
- Auth flow: `/login` → `/login/2fa` → `/` (Dashboard). Mock auth state in `AuthContext` (sessionStorage). `ProtectedLayout` guards app routes, `GuestLayout` guards auth routes. Toast notifications via `sonner`.
- Dark mode: theme toggle exists in header, CSS variables defined in theme.css.
- **Detail views are always full pages** at `/entity/:id` — never side drawers. Only config/settings panels use drawers.
- **Mobile responsive**: all pages must work at sm/md/lg/xl breakpoints (Pattern K). Tables become card lists below md, modals become full-screen sheets, 44px minimum touch targets.

## Custom Commands

| Command | File | Purpose |
|---|---|---|
| `/start_task` | `.claude/commands/start_task.md` | Load context, review state, propose approach before coding |
| `/doc_sync` | `.claude/commands/doc_sync.md` | Scan project and update all documentation files |
| `/commit` | `.claude/commands/commit.md` | Group changes by topic, create separate commits, push |
| `/ux-analysis` | `.claude/commands/ux-analysis.md` | Comprehensive UX analysis of Figma designs |
| `/ux-designer` | `.claude/commands/ux-designer.md` | Expert UX analysis via subagent |

## Prompt Pack

All 14 page specs from `docs/dashboard_prompt_pack_part2.md` (prompts 0a–13a) have been implemented. The prompt pack remains useful as a reference for expected behavior and responsive requirements.

## When Adding New Pages

1. Add route in `src/app/routes.tsx`
2. Create component in `src/app/components/<feature>/`
3. Follow Patterns A-K from ui-patterns.md and prompt pack
4. Add breadcrumb mapping in `AppShell.tsx` (`breadcrumbs` useMemo)
5. Use mock data from `src/lib/` or create new mock file
6. All text in Russian
7. Use existing shadcn/ui components from `@texnomart/ui/` (shared package)
8. Use status colors from theme.css CSS variables
9. **Detail views must be full pages** at `/entity/:id` with back nav + hero + tabs — no side drawers
10. **Mobile responsive** — test at sm/md/lg breakpoints, tables→card lists below md
