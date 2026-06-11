# Texnomart Monorepo

Monorepo containing Texnomart web applications with a shared design system, component library, and reusable infrastructure.

**Figma source**: `https://www.figma.com/design/23kqh6Bgib8vYPsQx50xPh/Texnomart-AI-Dashboard`

## Projects

| Project | Path | Description | Status |
|---|---|---|---|
| **Broker Dashboard** | `Dashboard/` | BNPL credit broker admin panel (23 routes, React Router) | Active |
| **Texnomart Promo** | `Promo/` | Promo-calendar: planning & approval of promo campaigns (role-based, 10 routes) | Active — bootstrap + Master shell + S1 done; **S2 complete (Phases 1–5)**; **S3 complete (Phases 1–3)**; **S4 complete (Phases 1–3)**; **S5 complete**; **S6 complete**; **S7 complete**; S8 pending |
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
│   └── promo_prompt_pack.md    # Texnomart Promo prompt pack (Foundation + Master + S1–S8)
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
- Supported languages (selector exists): RU, O'zbek (Кирилл.), O'zbek (Лат.)

## Conventions

- All data is currently **mock** — defined in each project's `src/lib/` files. No API integration yet.
- Components use `"use client"` directive (Figma Make convention, safe to keep).
- **Detail views are always full pages** at `/entity/:id` — never side drawers. Only config/settings panels use drawers.
- **Mobile responsive**: all pages must work at sm/md/lg/xl breakpoints (Pattern K).
- Auth flow: `/login` → `/login/2fa` → `/` (Dashboard). Mock auth state in `AuthContext`.
- Dark mode: theme toggle exists, CSS variables defined in theme.css.

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
- `Promo/CLAUDE.md` — Texnomart Promo routes, 9-role switcher, primitives, mock data (bootstrap + Master shell + S1 done; S2 complete — Phases 1–5; S3 complete — Phases 1–3; S4 complete — Phases 1–3; S5 complete; S6 complete; S7 complete; S8 pending)
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
