# Broker Dashboard

BNPL credit broker admin panel for Texnomart (Uzbekistan electronics retailer). Originated from Figma Make, continuing active development.

> For shared tech stack, design system, patterns, and conventions see the root [CLAUDE.md](../CLAUDE.md).
> For current state and known issues see [docs/AI_CONTEXT.md](../docs/AI_CONTEXT.md).
> For page specs see [docs/dashboard_prompt_pack_part2.md](../docs/dashboard_prompt_pack_part2.md).
> For lessons and gotchas see [tasks/lessons.md](../tasks/lessons.md).

## Commands

```
pnpm install      # install dependencies
pnpm dev          # start dev server (Vite)
pnpm build        # production build
```

## Project Structure

```
Dashboard/
  src/
    main.tsx                          # Entry point
    app/
      App.tsx                         # RouterProvider + AuthProvider + Toaster
      routes.tsx                      # All routes (createBrowserRouter) + auth guards
      shell-config.tsx                # Dashboard-specific AppShell config (nav, breadcrumbs, logos)
      components/
        AppShell.tsx                  # Thin wrapper around @texnomart/shared AppShell + command search
        Dashboard.tsx                 # Main dashboard page
        PageHeader.tsx                # Dashboard header (period, compare toggle, refresh, export)
        KpiStrip.tsx                  # 8 KPI cards (4-col grid, linked to /dashboard/:metricId)
        dashboard/                    # KpiDetailPage (metric drill-down)
        ApplicationsDynamicsChart.tsx # Line chart (total vs approved)
        ApplicationStatusesChart.tsx  # Stacked bar chart
        PartnerDistributionDonut.tsx  # Donut chart (interactive hover)
        TopBranchesChart.tsx          # Horizontal bar ranking
        RecentApplicationsWidget.tsx  # Live-updating recent applications table
        AlertsWidget.tsx              # Alerts/notifications panel
        GeographyMap.tsx              # SVG placeholder map (TODO: Yandex Maps)
        KeyboardShortcutsDialog.tsx   # Keyboard shortcuts help
        auth/                         # Login, ForgotPassword, ResetPassword, AuthContext (no 2FA)
        applications/                 # List (table only — filters/sort/search/pagination), detail (7 tabs)
        clients/                      # List (table + mobile cards), detail (5 tabs)
        partners/                     # List (cards + table), detail (6 tabs)
        branches/                     # List (table + map), detail (5 tabs incl. priorities editor)
        users/                        # List (table + mobile cards, sync panel), detail (5 tabs)
        analytics/                    # Dense data page (KPIs, charts, grouping, cohort, reports)
        telegram/                     # Bot settings, templates, broadcasts, subscribers, analytics, FAQ
        notifications/                # History list, settings drawer
        audit/                        # 4-tab log page, detail with diff viewer
        settings/                     # 6-section Superadmin page
        profile/                      # Current user's profile (5 tabs)
    lib/
      mock-data.ts                    # Dashboard mock data & types
      applications-mock-data.ts       # Applications module
      clients-mock-data.ts            # Clients module (20 clients)
      partners-mock-data.ts           # Partners module (6 partners)
      branches-mock-data.ts           # Branches module (10 branches)
      users-mock-data.ts              # Users module (12 users)
      analytics-mock-data.ts          # Analytics module
      telegram-mock-data.ts           # Telegram Bot module
      notifications-mock-data.ts      # Notifications module
      audit-mock-data.ts              # Audit module
      settings-mock-data.ts           # Settings module
    styles/
      index.css                       # CSS entry (imports fonts, tailwind, theme)
      tailwind.css                    # Tailwind v4 config
      theme.css                       # Design tokens (CSS variables, light/dark)
      fonts.css                       # Inter font import
      globals.css                     # Global overrides
    imports/pasted_text/              # Design specs from Figma prompts
```

## Implemented Pages

| Route | Component | Status |
|---|---|---|
| `/` | Dashboard | Done |
| `/dashboard/:metricId` | KpiDetailPage | Done — 8 metrics with drill-down |
| `/applications` | ApplicationsPage | Done — table only, filters/sort/search/pagination, bulk actions |
| `/applications/:id` | ApplicationDetailPage | Done — 7 tabs |
| `/login` | LoginPage | Done — email/password only, no 2FA |
| `/login/forgot-password` | ForgotPasswordPage | Done |
| `/login/reset-password/:token` | ResetPasswordPage | Done |
| `/clients` | ClientsPage | Done — table + mobile cards |
| `/clients/:id` | ClientDetailPage | Done — 5 tabs |
| `/partners` | PartnersPage | Done — cards + table views |
| `/partners/:id` | PartnerDetailPage | Done — 6 tabs |
| `/branches` | BranchesPage | Done — table + map views |
| `/branches/:id` | BranchDetailPage | Done — 5 tabs |
| `/users` | UsersPage | Done — table, sync panel (no invite) |
| `/users/:id` | UserDetailPage | Done — 5 tabs |
| `/analytics` | AnalyticsPage | Done — KPIs, charts, cohort, reports |
| `/telegram` | TelegramPage | Done — 6 tabs |
| `/notifications` | NotificationsPage | Done — day-grouped list |
| `/audit` | AuditPage | Done — 4-tab log page |
| `/audit/:id` | AuditDetailPage | Done — diff viewer |
| `/settings` | SettingsPage | Done — 6-section Superadmin |
| `/profile` | ProfilePage | Done — 5-tab personal profile |

All 14 prompt pack pages are complete.

## Auth Flow

`/login` → `/` (Dashboard) — **email/password only, no 2FA** (removed per client feedback). The mock login always succeeds.

> **Demo login**: the inputs are prefilled — `admin@texnomart.uz` / `Texnomart2026` (any value works; not validated). Submitting always logs in.

- `AuthContext`: re-exports from `@texnomart/shared/auth/auth-context` (mock auth state in sessionStorage). `LoginPage` calls `verify2FA()` directly to authenticate and navigates to `/` — the shared context still exposes `login()`/`verify2FA()`/`needsTwoFactor`, which **Promo** uses for its own 2FA step (the shared context was not changed).
- There is no `/login/2fa` route in the Dashboard anymore (`Login2FAPage.tsx` deleted).
- `ProtectedLayout`: redirects unauthenticated → `/login`
- `GuestLayout`: redirects authenticated → `/`
- Logout wired in AppShell header user dropdown

## Keyboard Shortcuts

`⌘K` search, `R` refresh, `?` shortcuts help, `1-8` KPI focus

## When Adding New Pages

1. Add route in `src/app/routes.tsx`
2. Create component in `src/app/components/<feature>/`
3. Follow Patterns A-K (see root CLAUDE.md)
4. Add breadcrumb route to `src/app/shell-config.tsx` `breadcrumbRoutes` array
5. Use mock data from `src/lib/` or create new mock file
6. All text in Russian
7. Use `@texnomart/ui/` for primitives (Button, Card, Table, etc.)
8. Use `@texnomart/shared/` for patterns (InfoRow, StatusBadge, FilterBar, PageHeader, etc.)
9. Use status colors from `theme.css` CSS variables
10. Detail views must be full pages at `/entity/:id` — no side drawers
11. Mobile responsive — test at sm/md/lg breakpoints
