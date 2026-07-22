# Texnomart Monorepo

Monorepo containing Texnomart web applications with a shared design system, component library, and reusable infrastructure.

**Figma source**: `https://www.figma.com/design/23kqh6Bgib8vYPsQx50xPh/Texnomart-AI-Dashboard`

## Projects

| Project | Path | Description | Status |
|---|---|---|---|
| **Broker Dashboard** | `Dashboard/` | BNPL credit broker admin panel (22 routes, React Router) | Active |
| **Texnomart Promo** | `Promo/` | Promo-calendar: planning & approval of promo campaigns (role-based, 16 routes) | Active — bootstrap + Master shell + S1 done; **S2 complete (Phases 1–5)**; **S3 complete (Phases 1–3)**; **S4 complete (Phases 1–3)**; **S5 complete**; **S6 complete**; **S7 complete**; **S8 complete** — prompt pack S1–S8 fully built; **3rd-round feedback #0+A (Авторизация и учётки) complete** — 2FA removed, localStorage user store, temp-password + forced first-login change, `/users` admin screen (≥2-admin guard), live audit of admin actions; **sub-project C (Профиль/Настройки) complete** — personal `/profile` (editable ФИО + voluntary password change reusing `NewPasswordForm`) + `/settings` (язык display-only · тема `.dark` toggle · role-gated cross-links), live «смена пароля»/«изменение профиля» audit; **sub-project B (тёмная тема) complete** — working end-to-end dark theme: `ThemeProvider` + no-FOUC boot script + persisted `promo:pref-theme`, rewritten `.dark` palette (brand `#FFD60A` preserved), additive controlled `theme` prop on the shared `AppShell` (header ↔ Settings synced; Dashboard untouched), hybrid color migration across all 49 screen files; **sub-project D (матрица прав) complete** — read-only **«Матрица прав»** at `/permissions` (КД + Администратор): prompt-pack **Appendix D** as a 9×5 access matrix («документ») + a new canonical `Promo/src/lib/permissions.ts` consolidating the scattered role→permission gating into one source of truth («консолидация»: `ACCESS_MATRIX` + `CAPABILITIES` whose `allowed(role)` is derived live from the existing `getXAccess`/`canX` helpers, which stay unchanged), two Pattern-J tabs, active role brand-highlighted, in-screen guard, Promo-local only. **All four 3rd-round sub-projects (#0+A, B, C, D) done.** **Полный промо-календарь client feedback (2026-07-01, 14 items) complete** — `/full-calendar` reworked: synced sticky top scrollbar + sticky header (§1/§2), gray/bold header + dividers (§9), unified alignment (§12), Тип/Название/Период as columns + band «PR-… · N позиций» + дедлайн removed (§4), «Показано: N промо · M позиций» + flat CSV export (§13), per-line Изменить/Удалить + autosave (§3), «Бренд» + «Наличие в магазинах, %» columns (§5/§6), КМ-only visibility (§7), «№ промо» multi-select + «Период акции» filters (§10), all column groups ON by default (§11), «Выбрать плановое промо» default in the create dialog (§14), gifts reworked to «Подарок №1/№2» columns + «подарок на выбор» variable-height sub-rows (§8); Promo-local only. **Согласование client feedback (2026-07-02, 10 items) complete** — `/approvals` (+ КМ «Мои участия») reworked: «Срок согласования» filter replaces the overdue toggle (§1), «№ промо» + «Период акции» filters (§2), «Статус согласования» stage filter (§3), «Плановое/внеплановое» filter (§5), «КМ» multi-select persisted per user (§4), Старший КМ + КД see both review stages while acting stays gated (§3); stage-separated SLA with «N раб. дн. (до DD.MM.YYYY)» / «+N дн. просрочено» (§7/§9), auto-escalated items display «На согл. у КД» + «Авто-передано: просрочка у старшего КМ» + senior-overdue note on card/history (§8/§9); queue table rewritten to the calendar band layout — page-sticky header + synced top/bottom scrollbars + dividers, single pane (§6); КМ «Мои участия» own-promos-only + card fields + «SLA КМ» + 4 filters + «Заявка о неучастии отправлена» → «Не участвует» transition (§10); Promo-local only. **5th-part feedback (Отчёты · Уведомления · Аудит-лог · Управление пользователями) — sub-project E-1 «Отчёты смежным отделам» complete (2026-07-06)** — `/reports` (S5) reworked per §1–§3: report columns projected from full-calendar `gridFields` per department (Marketing gains Бренд/Наличие %); band-layout table (frozen «Изменение»+«Номенклатура», sticky header, synced top/bottom scroll, gridlines) → mobile cards; «Изменение» column (Добавлено/Изменено/Исключено, excluded kept+struck) + before→after cell tooltip + version-total counters + «Всего позиций» + «Только изменения»; per-column typed «Фильтры» + «Сбросить фильтры» + «Показано: N»; real `.xlsx` export (SheetJS); per-version read-only snapshots + «Текущая версия»; per-user acknowledgement store + «Ознакомиться со всеми изменениями (N)»; role-gated «Кто ознакомился» drawer; Promo-local only. **5th-part feedback — sub-project E-2 «Уведомления» complete (2026-07-06)** — `/notifications` (S6) reworked from seed-stale/in-memory to **live + persistent**: a persistent `NotificationsProvider` exposing `notify(input)` (merges rebuilt seeds with a localStorage live-list [`promo:notifications-live`, cap 50] + a per-user read-set [`promo:notifications-read:<userId>`, anon fallback], fires one SPA-safe sonner toast, no toast on load); live emission wired into 5 existing handlers — `FullCalendarPage` (cancel/line-exclusion/period-change/send) + `DepartmentReportView` (marketingApprove), each replacing its `toast.success`; the shared-shell bell count already updated live → **no `@texnomart/shared` change**, no bell animation. **Scope note:** no discrete client items were in the session docs, so the scope (**Live + persistent + toast**, deliberately lean UX) was proposed+approved in brainstorming; the original PDF E-2 asks were then built as **sub-project E-2b «Уведомления» per-role config, complete (2026-07-06)** — an Администратор-editable **per-role notification config** (`/notification-settings`: which of the 6 categories each of the 9 roles receives; `notification-settings-store.ts` + a `NotificationSettingsProvider` above the shell; `notificationsForRole(role,list,config)` filters by it, Администратор bypasses; `DEFAULT_ROLE_CONFIG` faithfully inverts the old audiences → no regression), a **«для роли X» tag** per notification (`rolesForType`), and **«Открыть промо/согласование/отчёт» deep-links** (`notificationLinksFor`, report link gated on sent campaigns; `/reports` `?promo=` pre-select). The «для роли X» tag shows the full configured target set — per-user multi-role filtering is deferred to E-4. Promo-local only. **With E-2 + E-2b, «Уведомления» is fully covered. sub-project E-3 «Аудит-лог и контроль сроков» (2→4 tabs) complete (2026-07-07)** — `/audit` (S8) renamed «Аудит-лог и контроль сроков» and reworked from 2 tabs to **4** (focus: сроки/ответственные/просрочки): **Сроки по плану** + **Сроки по промо и отчётам** (shared band-layout `ControlDeadlinesTable` + `ControlDeadlinesFilters`; old `ControlEventsTimeline` deleted) · **Показатели участников** (role-filtered timeliness ratings — КМ ranked, director roles aggregated — + `ParticipantTasksDrawer` drill-down + «Справочно») · **Аудит-лог** («Ключевые действия» default / «Все действия» Администратор-only). A new pure `lib/audit-control.ts` derives a flat `ControlPoint[]` from existing seeds (`PLAN_APPROVALS`, `buildReviewItems`, version/report helpers, `CATEGORY_MANAGERS`) so Tab 3 metrics reconcile with the Tab 1–2 rows by construction; auto-forward attributes overdue to Старший КМ; access-gated (КМ own rows only via `OWN_AUDIT_KM_ID="km-3"` + plan-tab notice; others see all); read-only + seed-stale; Promo-local only. **sub-project E-4 «Управление пользователями, ролями и временным замещением» complete (2026-07-07)** — `/users` reworked from the #0+A account screen into a full user/role/substitution module: extended `users-store` (employee model подразделение/должность/руководитель + multi-role `roles[]` read via `rolesOf` + «Администратор подразделения» `adminScope` + `kmId` link, all additive/backward-compatible), a new `kd-substitution-store` for a temporary **«Уполномоченное лицо КД»** wired **functionally** into S3 approvals (`ApprovalDetailPage` substitute-acting predicate `substituteActing/conflicted/canAct/actingAsRole` + same-person conflict-of-interest guard + banner; `ApprovalsPage` shows the substitute the КД queue; approve/reject stamped «Коммерческий директор»), a reworked `/users` (scope by the logged-in `useCurrentUser()`, filters, real `.xlsx` export via SheetJS, `UserFormDialog` create+edit replacing `CreateUserDialog`, `KdSubstitutionPanel` host, dept-admin notice) + a new `/users/:id` detail page (Профиль / Роли и доступ / Журнал действий), a per-user audit journal (`AuditEvent.targetUserId` + 3 new action types), and `permissions.ts` +4 capabilities. Identity = seeds (u-6 dept-admin «Маркетинг», u-8 «Тошматов Фаррух» km-5 = seeded substitute); god-mode switcher kept; create is global-admin-only; the dept-admin/substitute experiences are reached by logging in as the seeded users. The whole-branch opus review caught a cross-task **Critical** (the `/users/:id` edit dialog bypassed the admin-grant + ≥2-admin gates the row-menu enforced) + a scope-precedence mismatch + a duplicate export → fixed + re-reviewed; both builds green; in-browser QA passed. Promo-local only. **With E-4, all four 5th-part sub-projects (E-1 Reports · E-2/E-2b Notifications · E-3 Audit · E-4 Users) are complete.** **Краткий промо-календарь «8-я часть» client feedback complete (2026-07-09, 5 items)** — the feedback screenshots are from `promo.tm.uz` (a **backend-integrated** deploy — server-loading text, raw role codes, real data), not this mock repo (GitHub Pages); fixed in the mock per user confirmation. **№4** report-send: «Срок отчёта» = crayний-срок date only, «Отправка смежным отделам» = fact only («Не отправлено» / «Отправлено · дата · в.N» + «+N дн.» only when sent late), «отчёт просрочен» removed (`getReportSendStatus` + `ShortCalendarTable` + mobile card + CSV). **№3 (+№1+№2)** plan approval: `PlanApprovalTable` gained a `selectable` mode (checkbox column + «Выбрать все» + per-row «Согласовано/Отклонено» badge) + `PlanMode` per-row decisions per reviewer stage (КД/ОД) with «Согласовать/Отклонить выбранные (N)» — approve one/several/all, advance only when all approved; the same table shows № / тип / название / период (covers №1+№2). **№5** КМ visibility: new `isPlanApprovedByDirectors(c)` gates the calendar for «Категорийный менеджер (КМ)» → only fully-approved plans (fixes «Найдено 0 акций»). 6 files, Promo-local; `build:promo` green + in-browser QA (КД/ОД/КМ, 1440/390px). **Краткий промо-календарь «6-я часть» client feedback complete (2026-07-10, 7 items)** — the «Комментарии общие» PDF (08.07.2026), i.e. the тракер's «🆕 новое» items V2·14–18 + two new asks, applied to the **S1** «План акций» tab by layering a **per-row send lifecycle** (`Черновик → выбрать → Отправлено → Согласовано/Отклонено`) over the «8-я часть» reviewer decisions. **№1** auto № промо (`nextPlanPromoNo` → read-only field, no free-text). **№2** черновой план без типа: тип необязателен при создании → «Черновик» (ред./удал.), red «Тип не выбран» marker + banner, тип обязателен при отправке. **№3** «Директор маркетинга» получил доступ к `/promo-types` (nav-роль + `getPromoTypeSettingsAccess` `canEdit`; утверждение остаётся за КД). **№4** fixed the rejected-plan stepper bug (all stages showed green ✓ when rejected) — `rejectedStage` → red ✗ «— отклонил» at the rejecting stage + per-row «Отклонено». **№5** explicit «Отправить на согласование» (не авто-отправка при создании). **№6** правка черновиков + правка отправленной строки → возврат в «Черновик» + повторная отправка. **№7** чекбоксы выбора черновиков + «Отправлено» блокирует повтор + **подсказка о пропущенных датах** (`findCoverageGaps` → баннер + toast). 4 files (`PlanMode.tsx`, `PlanApprovalTable.tsx`, `promo-mock-data.ts`, `shell-config.tsx`), Promo-local; `build:promo` green + in-browser QA (Дир. маркетинга/КД, 1440/390px). **«Группа A» — сводный тракер комментариев complete (2026-07-17, 10 пунктов + 2 решения, subagent-driven, 11 commits)** — all open tracker items closed: dist-filter sub-rows bug (V1-1), «Отправка смежным отделам» filter + reference plashka (V2-12), compact columns + 2-line wrap (V1-3.3), **sticky-bottom** viewport scrollbar as a 4th synced scroller (V2-1, top kept), «План акций» sticky header (V2-13), `/reports`+`/approvals`+`/audit` full-width (V1-3.4), filter-aware `.xlsx` export in 4 audit tabs + two-sheet «Матрица прав» export (V1-8, new `audit-xlsx.ts`/`permissions-xlsx.ts`), unified **«26-N»** № промо across 18 files incl. exports/breadcrumbs (V2-9, internal ids stay full), strict role-gating of «Срок отчёта»/«Отправка смежным» (КД/уполномоченное лицо/маркетинг/Админ), and **«План акций» persistence** (`promo:plan-state`, new `plan-store.ts`) — plan drafts/sends/decisions now **survive reload**. Final whole-branch opus review READY (0 Critical/Important); gap analysis in `docs/promo_feedback_tracker.md`. **«7-я часть» client feedback complete (2026-07-22, 6 items)** — the client's review of «Группа A» (screenshots from OUR GitHub Pages deploy): §1.2 «Крайний срок заполнения КМ» = только дата (premature OverdueTag dropped everywhere); §1.3 on-time-sent example (seed PR-2026-007 → sent 30.05 < deadline → green «Отправлено ✓» in the short calendar, PR-2026-003 stays the late example); §3/§6.3 2-line wrap instead of truncation (full calendar/reports/approvals, fixed Pattern-F row heights); §4 **один нижний закреплённый скролл** (top strips removed incl. the short calendar, sticky-bottom track added to full calendar/approvals/reports); §6.2 compact columns (approvals/reports/audit); **§9 — история отклонений плана** (the deferred product decision): persisted `rejectionLog` in `plan-store.ts`, reject comment saved, clickable «Отклонено» → new `PlanRejectionDrawer` (latest comment + история), plan CSV += отклонение columns + effective persisted rows; bonus fix — re-send after «Вернуть на доработку» re-opens the КД stage. Promo-local only. |
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
