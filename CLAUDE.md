# Texnomart Monorepo

Monorepo containing Texnomart web applications with a shared design system, component library, and reusable infrastructure.

**Figma source**: `https://www.figma.com/design/23kqh6Bgib8vYPsQx50xPh/Texnomart-AI-Dashboard`

## Projects

| Project | Path | Description | Status |
|---|---|---|---|
| **Broker Dashboard** | `Dashboard/` | BNPL credit broker admin panel (22 routes, React Router) | Active |
| **Texnomart Promo** | `Promo/` | Promo-calendar: planning & approval of promo campaigns (role-based, 15 routes) | Active — bootstrap + Master shell + S1 done; **S2 complete (Phases 1–5)**; **S3 complete (Phases 1–3)**; **S4 complete (Phases 1–3)**; **S5 complete**; **S6 complete**; **S7 complete**; **S8 complete** — prompt pack S1–S8 fully built; **3rd-round feedback #0+A (Авторизация и учётки) complete** — 2FA removed, localStorage user store, temp-password + forced first-login change, `/users` admin screen (≥2-admin guard), live audit of admin actions; **sub-project C (Профиль/Настройки) complete** — personal `/profile` (editable ФИО + voluntary password change reusing `NewPasswordForm`) + `/settings` (язык display-only · тема `.dark` toggle · role-gated cross-links), live «смена пароля»/«изменение профиля» audit; **sub-project B (тёмная тема) complete** — working end-to-end dark theme: `ThemeProvider` + no-FOUC boot script + persisted `promo:pref-theme`, rewritten `.dark` palette (brand `#FFD60A` preserved), additive controlled `theme` prop on the shared `AppShell` (header ↔ Settings synced; Dashboard untouched), hybrid color migration across all 49 screen files; **sub-project D (матрица прав) complete** — read-only **«Матрица прав»** at `/permissions` (КД + Администратор): prompt-pack **Appendix D** as a 9×5 access matrix («документ») + a new canonical `Promo/src/lib/permissions.ts` consolidating the scattered role→permission gating into one source of truth («консолидация»: `ACCESS_MATRIX` + `CAPABILITIES` whose `allowed(role)` is derived live from the existing `getXAccess`/`canX` helpers, which stay unchanged), two Pattern-J tabs, active role brand-highlighted, in-screen guard, Promo-local only. **All four 3rd-round sub-projects (#0+A, B, C, D) done.** **Полный промо-календарь client feedback (2026-07-01, 14 items) complete** — `/full-calendar` reworked: synced sticky top scrollbar + sticky header (§1/§2), gray/bold header + dividers (§9), unified alignment (§12), Тип/Название/Период as columns + band «PR-… · N позиций» + дедлайн removed (§4), «Показано: N промо · M позиций» + flat CSV export (§13), per-line Изменить/Удалить + autosave (§3), «Бренд» + «Наличие в магазинах, %» columns (§5/§6), КМ-only visibility (§7), «№ промо» multi-select + «Период акции» filters (§10), all column groups ON by default (§11), «Выбрать плановое промо» default in the create dialog (§14), gifts reworked to «Подарок №1/№2» columns + «подарок на выбор» variable-height sub-rows (§8); Promo-local only. **Согласование client feedback (2026-07-02, 10 items) complete** — `/approvals` (+ КМ «Мои участия») reworked: «Срок согласования» filter replaces the overdue toggle (§1), «№ промо» + «Период акции» filters (§2), «Статус согласования» stage filter (§3), «Плановое/внеплановое» filter (§5), «КМ» multi-select persisted per user (§4), Старший КМ + КД see both review stages while acting stays gated (§3); stage-separated SLA with «N раб. дн. (до DD.MM.YYYY)» / «+N дн. просрочено» (§7/§9), auto-escalated items display «На согл. у КД» + «Авто-передано: просрочка у старшего КМ» + senior-overdue note on card/history (§8/§9); queue table rewritten to the calendar band layout — page-sticky header + synced top/bottom scrollbars + dividers, single pane (§6); КМ «Мои участия» own-promos-only + card fields + «SLA КМ» + 4 filters + «Заявка о неучастии отправлена» → «Не участвует» transition (§10); Promo-local only. **5th-part feedback (Отчёты · Уведомления · Аудит-лог · Управление пользователями) — sub-project E-1 «Отчёты смежным отделам» complete (2026-07-06)** — `/reports` (S5) reworked per §1–§3: report columns projected from full-calendar `gridFields` per department (Marketing gains Бренд/Наличие %); band-layout table (frozen «Изменение»+«Номенклатура», sticky header, synced top/bottom scroll, gridlines) → mobile cards; «Изменение» column (Добавлено/Изменено/Исключено, excluded kept+struck) + before→after cell tooltip + version-total counters + «Всего позиций» + «Только изменения»; per-column typed «Фильтры» + «Сбросить фильтры» + «Показано: N»; real `.xlsx` export (SheetJS); per-version read-only snapshots + «Текущая версия»; per-user acknowledgement store + «Ознакомиться со всеми изменениями (N)»; role-gated «Кто ознакомился» drawer; Promo-local only. **Remaining: E-2 Уведомления, E-3 Аудит-лог (2→4 tabs), E-4 Управление пользователями (+ временное замещение КД).** |
| **Shared UI** | `packages/ui/` | shadcn/ui component library (46 components + 2 utilities) | Active |
| **Shared Patterns** | `packages/shared/` | Reusable pattern components, auth, hooks, formatters | Active |

## Tech Stack

- **Runtime**: React 18 + TypeScript
- **Build**: Vite 6, pnpm workspace monorepo
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, `@import` syntax — NO `tailwind.config.js`)
- **UI Kit**: shadcn/ui (Radix primitives) — shared via `@texnomart/ui` workspace package
- **Routing**: React Router v7 (browser router, `createBrowserRouter`)
- **Charts**: Recharts 2.x
- **Icons**: Lucide React
- **Animations**: Motion (framer-motion successor), tw-animate-css
- **Drag-and-drop**: react-dnd + HTML5 backend
- **Dates**: date-fns with `ru` locale
- **Font**: Inter (400, 500, 600, 700)
- **Primary Color**: `#FFD60A` (Texnomart yellow)

## Monorepo Structure

```
Texnomart/
├── .claude/                    # Shared Claude commands & rules
│   ├── commands/               # Custom slash commands (all sub-projects)
│   └── rules/                  # Layer-specific rules (design, etc.)
├── docs/                       # Global documentation
│   ├── AI_CONTEXT.md           # Current project state snapshot
│   ├── dashboard_prompt_pack_part2.md  # Broker Dashboard page specs
│   ├── promo_prompt_pack.md    # Texnomart Promo prompt pack (Foundation + Master + S1–S8)
│   └── superpowers/            # Brainstorm specs (specs/) + implementation plans (plans/)
├── tasks/
│   └── lessons.md              # Shared lessons & gotchas
├── packages/
│   ├── ui/                     # @texnomart/ui — shared shadcn/ui components
│   │   ├── package.json
│   │   └── src/                # 46 component files + utils.ts + use-mobile.ts
│   └── shared/                 # @texnomart/shared — reusable pattern components
│       ├── package.json
│       └── src/
│           ├── components/     # AppShell, PageHeader, InfoRow, StatusBadge, etc.
│           ├── auth/           # AuthProvider, RequireAuth guards
│           ├── hooks/          # usePagination, useTableFilters
│           ├── utils/          # formatters, status-config
│           └── types/          # Shared interfaces
├── Dashboard/                  # Broker Dashboard app
│   ├── CLAUDE.md               # Broker Dashboard-specific context
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
├── Promo/                      # Texnomart Promo app (promo-calendar)
│   ├── CLAUDE.md               # Promo-specific context (routes, roles, primitives)
│   ├── package.json
│   ├── vite.config.ts
│   └── src/                    # app/ (shell, routes, role-context), components/ (primitives), lib/ (mock data)
├── CLAUDE.md                   # This file — monorepo root
├── HISTORY.md                  # Change history (all projects)
├── styles-config.md            # Unified design token reference
├── package.json                # Root workspace config
└── pnpm-workspace.yaml         # Workspace definition
```

### Shared vs Project-Specific

| Layer | Shared (root) | Per-project |
|---|---|---|
| **Components** | `packages/ui/` — shadcn/ui primitives, `packages/shared/` — pattern components | `<project>/src/app/components/` — feature components |
| **Styles** | `styles-config.md` — design tokens | `<project>/src/styles/` — project CSS entry, theme overrides |
| **Docs** | `docs/` — AI context, prompt packs | `<project>/CLAUDE.md` — routes, pages, mock data |
| **Rules** | `.claude/rules/` — design, patterns | — |
| **Commands** | `.claude/commands/` — all slash commands | — |
| **Lessons** | `tasks/lessons.md` | — |
| **History** | `HISTORY.md` | — |

## Commands

```bash
pnpm install                    # Install all dependencies
pnpm dev:dashboard              # Start Broker Dashboard dev server
pnpm build:dashboard            # Build Broker Dashboard
pnpm dev:promo                  # Start Texnomart Promo dev server
pnpm build:promo                # Build Texnomart Promo
pnpm build                      # Build all projects
pnpm dev                        # Start all dev servers in parallel
```

> **Note**: `pnpm` may not be on PATH; if so, prefix commands with `corepack` (e.g. `corepack pnpm install`). corepack ships with Node.

> **Note**: pnpm v11 requires build script approvals. `pnpm-workspace.yaml` has `allowBuilds` set to `true` for `@tailwindcss/oxide` and `esbuild`. If `pnpm install` fails with `ERR_PNPM_IGNORED_BUILDS`, check that file.

## Deployment (GitHub Pages)

Both apps deploy to GitHub Pages via `.github/workflows/deploy.yml` (push to `main` + manual `workflow_dispatch`), under subpaths on one site (no root landing page):

| App | URL |
|---|---|
| **Broker Dashboard** | `https://elyorrakhmatullaev.github.io/Texnomart/dashboard/` |
| **Texnomart Promo** | `https://elyorrakhmatullaev.github.io/Texnomart/promo/` |

The workflow builds each app with a `BASE_PATH` env (`/Texnomart/dashboard/`, `/Texnomart/promo/`), assembles `_site/{dashboard,promo}` + a shared root `404.html`, and publishes via `actions/deploy-pages`.

Three things make the React-Router SPAs work under a Pages subpath:
- **Vite `base`** — each `vite.config.ts` reads `base: process.env.BASE_PATH ?? '/'` (local dev/build stay `/`).
- **Router `basename`** — each `routes.tsx` passes `createBrowserRouter(routes, { basename })` with `basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/"`.
- **SPA deep-link fallback** — the root `404.html` (GitHub Pages serves it for any unmatched path) detects the app segment, stashes the in-app path in `sessionStorage`, and redirects to the app root; a snippet in each `index.html` restores the URL via `history.replaceState` before React boots.

> **One-time manual setup**: in the repo, **Settings → Pages → Build and deployment → Source = "GitHub Actions"**. Without it the deploy job fails.

## Shared Patterns Package (`@texnomart/shared`)

Reusable pattern components in `packages/shared/src/`. Import from `@texnomart/shared/`:

```typescript
import { AppShell } from "@texnomart/shared/components/app-shell"
import { PageHeader } from "@texnomart/shared/components/page-header"
import { ListPageHeader } from "@texnomart/shared/components/list-page-header"
import { DetailPageHero } from "@texnomart/shared/components/detail-page-hero"
import { InfoRow } from "@texnomart/shared/components/info-row"
import { StatusBadge } from "@texnomart/shared/components/status-badge"
import { Timeline } from "@texnomart/shared/components/timeline"
import { FilterBar } from "@texnomart/shared/components/filter-bar"
import { MobileListCard } from "@texnomart/shared/components/mobile-list-card"
import { DocumentThumbnail, DocumentUploadTile } from "@texnomart/shared/components/document-thumbnail"
import { AuthProvider, useAuth } from "@texnomart/shared/auth/auth-context"
import { RequireAuth, RedirectIfAuthenticated } from "@texnomart/shared/auth/require-auth"
import { usePagination } from "@texnomart/shared/hooks/use-pagination"
import { useTableFilters } from "@texnomart/shared/hooks/use-table-filters"
import { formatDate, formatCurrency, maskPhone, getInitials } from "@texnomart/shared/utils/formatters"
import { getScoringColor } from "@texnomart/shared/utils/status-config"
import type { AppShellConfig, NavGroup, StatusConfig } from "@texnomart/shared/types"
```

### What goes where

| Layer | `@texnomart/ui` | `@texnomart/shared` |
|---|---|---|
| **Origin** | shadcn/ui auto-generated | Hand-written pattern implementations |
| **Components** | Button, Card, Dialog, Table, Tabs... | AppShell, PageHeader, InfoRow, StatusBadge, FilterBar... |
| **Editing** | **DO NOT** manually edit | Freely editable |
| **Auth** | — | AuthProvider, useAuth, RequireAuth guards |
| **Hooks** | use-mobile | usePagination, useTableFilters |
| **Utils** | cn() | formatters, status-config, getScoringColor |

### AppShell Configuration

Each sub-project provides its own config to the shared `AppShell`:

```typescript
import { AppShell } from "@texnomart/shared/components/app-shell"
import { myConfig, myNotifications } from "./shell-config"

export function MyShell() {
  return <AppShell config={myConfig} notifications={myNotifications} />
}
```

The config object (`AppShellConfig`) includes:
- `logo` / `logoCollapsed` — brand SVGs
- `navGroups` — sidebar navigation items with icons, badges, role filtering
- `breadcrumbRoutes` — data-driven breadcrumb generation (replaces hardcoded if/else)
- `user` — current user info for avatar/role display

## Shared UI Package (`@texnomart/ui`)

46 shadcn/ui components in `packages/ui/src/`. Import from `@texnomart/ui/`:

```typescript
import { Button } from "@texnomart/ui/button"
import { Card, CardContent } from "@texnomart/ui/card"
import { cn } from "@texnomart/ui/utils"
```

**DO NOT** manually edit files in `packages/ui/src/` — they are shadcn/ui auto-generated primitives.

### Path Aliases (per project)

Configured in each project's `vite.config.ts`:
- `@` → `./src` (project-local sources)
- `@texnomart/ui` → `../packages/ui/src` (shared UI primitives)
- `@texnomart/shared` → `../packages/shared/src` (shared pattern components)

### Tailwind Content Scanning

Each project's `src/styles/tailwind.css` must include both shared packages:
```css
@source '../../../packages/ui/src/**/*.{js,ts,jsx,tsx}';
@source '../../../packages/shared/src/**/*.{js,ts,jsx,tsx}';
```

## Design System

See `styles-config.md` for the complete design token reference.

Key values:
- **Primary**: `#FFD60A` (yellow), foreground `#000000`
- **Font**: Inter, base 16px
- **Border radius**: 0.625rem (10px)
- **Spacing**: 4/8/12/16/20/24/32/40/48px
- **Card shadow**: `0px 2px 4px rgba(204, 204, 204, 0.25)`
- **Surfaces**: sidebar + header + breadcrumb = white; main content area = `bg-gray-50` (white cards sit on a subtly gray surface)

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

Status colors are defined as CSS variables in each project's `src/styles/theme.css`.

### UI Patterns (Shared Across Projects)

- **Page title (H1)**: `text-2xl md:text-[32px] font-bold leading-tight text-gray-900`
- **Pattern A** — PageHeader: 64px, H1 + controls
- **Pattern B** — FilterBar: chips with popover filters
- **Pattern C** — DataTable: shadcn Table in Card, sticky header
- **Pattern D** — Detail Page: full route `/entity/:id` with back nav, hero band, tabs — NEVER side drawers
- **Pattern D2** — Config Drawer: side drawers only for settings/config panels
- **Pattern E** — Create/Edit Modal: Dialog 560-720px (full-screen Sheet on mobile)
- **Pattern F** — Frozen Columns: split-pane layout (two synced divs), NOT `position: sticky` on `<td>`
- **Pattern G** — Confirmation Dialog: AlertTriangle + typed confirmation
- **Pattern H** — Status Badge: consistent soft-tint styling per domain
- **Pattern I** — Unified States: skeleton loading, empty, error
- **Pattern J** — Detail Sub-components: InfoRow, Timeline, Tabs
- **Pattern K** — Mobile Responsive: sm/md/lg/xl breakpoints, tables→card lists, 44px touch targets

## Language & Locale

- All UI text in **Russian** (Русский)
- Currency: **UZS** (Uzbekistani som), formatted with `toLocaleString("ru-RU")`
- Phone format: `+998 XX XXX-XX-XX`
- Date locale: `date-fns/locale/ru`
- Supported languages (per-app, selector exists): **Dashboard** — RU, O'zbek (Лат.) only (Cyrillic dropped per client feedback); **Promo** — RU, O'zbek (Кирилл.), O'zbek (Лат.). The AppShell language list is configurable via `AppShellConfig.languages` (defaults to all three when omitted; the selector is display-only — no runtime i18n yet).

## Conventions

- All data is currently **mock** — defined in each project's `src/lib/` files. No API integration yet.
- Components use `"use client"` directive (Figma Make convention, safe to keep).
- **Detail views are always full pages** at `/entity/:id` — never side drawers. Only config/settings panels use drawers.
- **Mobile responsive**: all pages must work at sm/md/lg/xl breakpoints (Pattern K).
- Auth flow: **Dashboard** `/login` → `/` (email/password only, **no 2FA**, always succeeds); **Promo** `/login` → `/` (email/password validated against a localStorage **user store**, **no 2FA** since the 3rd-round feedback — temp-password users are forced through `/change-password` on first login). The shared `AuthContext` is unchanged (still exposes a 2FA path; Promo finalizes login via `verify2FA()` but no longer renders the 2FA step).
- Dark mode: **Promo** has a full working dark theme (sub-project B) — `ThemeProvider` (`Promo/src/app/theme-context.tsx`) + a no-FOUC boot script in `index.html` persist `promo:pref-theme`, the `.dark` palette in `theme.css` keeps the brand `#FFD60A`, and the header + Settings toggles share the provider via the shared `AppShell`'s optional controlled `theme` prop. **Dashboard**: theme toggle exists, CSS variables defined, but dark not yet built/verified (its light mode is untouched). The shared `AppShell` theme toggle is self-contained unless an app passes the controlled `theme` prop.

## When Adding a New Sub-Project

1. Create `<ProjectName>/` directory with `package.json`, `vite.config.ts`
2. Add to `pnpm-workspace.yaml` packages list
3. Add `dev:<name>` and `build:<name>` scripts to root `package.json`
4. Configure path aliases in `vite.config.ts` (`@` → `./src`, `@texnomart/ui` → `../packages/ui/src`, `@texnomart/shared` → `../packages/shared/src`)
5. Add `@texnomart/ui` and `@texnomart/shared` as `workspace:*` dependencies in `package.json`
6. Add Tailwind `@source` for both `packages/ui/` and `packages/shared/` in project's `tailwind.css`
7. Create `<ProjectName>/CLAUDE.md` with project-specific routes, pages, mock data
8. Copy `src/styles/` structure (index.css, tailwind.css, theme.css, fonts.css)
9. Create `shell-config.tsx` with project-specific nav, breadcrumbs, and logos
10. Use `AppShell` from `@texnomart/shared` — pass project config (see Dashboard's `shell-config.tsx` as reference)
11. Use shared auth (`AuthProvider`, `RequireAuth`) from `@texnomart/shared/auth/`
12. Follow all shared patterns (A–K), design tokens, and locale conventions

## Project-Specific Docs

- `Dashboard/CLAUDE.md` — Broker Dashboard routes, pages, mock data, conventions
- `Promo/CLAUDE.md` — Texnomart Promo routes, 9-role switcher, primitives, mock data (bootstrap + Master shell + S1 done; S2 complete — Phases 1–5; S3 complete — Phases 1–3; S4 complete — Phases 1–3; S5 complete; S6 complete; S7 complete; S8 complete)
- `docs/AI_CONTEXT.md` — Current state snapshot, known issues, next steps
- `docs/dashboard_prompt_pack_part2.md` — Broker Dashboard page specs (14 prompts)
- `docs/promo_prompt_pack.md` — Texnomart Promo (promo-calendar) prompt pack: Foundation + Master + S1–S8 sections + Appendices, monorepo-adapted

## Custom Commands

| Command | Purpose |
|---|---|
| `/start_task` | Load context, review state, propose approach |
| `/doc_sync` | Scan project, update documentation |
| `/commit` | Group changes by topic, create commits |
| `/ux-analysis` | UX audit of Figma designs |
| `/ux-designer` | Expert UX analysis via subagent |
