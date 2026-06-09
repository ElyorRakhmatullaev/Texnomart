# Texnomart Promo — Promo-Calendar System

## Prompt Pack — monorepo edition (`@texnomart/ui` + `@texnomart/shared`)

> A self-contained prompt library for generating the **Texnomart Promo** system — planning and approval of **planned & unplanned promo campaigns** in a promo calendar — as a **new sub-project** inside this monorepo.
>
> **Source of truth**: *ТЗ «Система учёта плановых и внеплановых промо-акций в промо-календаре» v6.0* (33 pages). This pack bakes the spec's rules (status taxonomy, SLA windows, versioning, role matrix, field dictionary) into screen prompts.
>
> **What's inside**: a Foundation prompt (monorepo design tokens), a Master prompt (the `Promo/` app shell + role switcher + shared primitives), 8 section prompts (S1–S8) covering every screen in the spec, and Appendices A–C (status taxonomy, glossary, full-calendar field dictionary + report routing).
>
> **How this differs from the original Claude-artifact prompts**: this pack targets the **Texnomart monorepo design system** — Inter font, `#FFD60A` yellow, `0.625rem` radius — and imports from `@texnomart/ui/*` (shadcn primitives) and `@texnomart/shared/*` (pattern components, auth, hooks, formatters) instead of `@/components/ui/...`. All UI text is **Russian-only**. It reuses the monorepo's Patterns A–K rather than inventing a parallel set.

---

## How to use this pack

These prompts are layered — each later layer assumes the rules of the earlier ones.

1. **Bootstrap the sub-project first** (see "Sub-project bootstrap" below), then paste **PROMPT 0 (Foundation)**. It pins the monorepo design tokens, formatting, status map, shared-package import rules, and responsive strategy. Treat it as the contract.
2. **Then PROMPT 1 (Master / App Shell)** to generate the `Promo/` application frame (top bar, sidebar nav, role switcher, breadcrumbs) via the shared `AppShell`, plus the Promo-specific shared primitives every screen reuses.
3. **Then any Section prompt (S1–S8).** Each is self-contained but references PROMPT 0 + PROMPT 1 and the Appendices.
4. **Paste the relevant Appendix** alongside a section prompt for maximum fidelity (status taxonomy, glossary, field dictionary).

> **Note on the brand palette**: this pack uses the monorepo's canonical `#FFD60A` (Texnomart yellow), **not** the `#FFDD2D` used in the original standalone prompts. Yellow is accent-only; on-yellow text is always `#000000`.

### Sub-project bootstrap (`Promo/`)

Before any screen prompt, the Promo app must exist as a monorepo sibling of `Dashboard/`. Follow the root CLAUDE.md "When Adding a New Sub-Project" steps:

```
1. Create `Promo/` with `package.json`, `vite.config.ts`, `index.html`, `src/`.
2. Add `Promo` to `pnpm-workspace.yaml` packages list.
3. Add root scripts: `dev:promo` and `build:promo`.
4. Configure path aliases in `Promo/vite.config.ts`:
     @            → ./src
     @texnomart/ui     → ../packages/ui/src
     @texnomart/shared → ../packages/shared/src
5. Add `@texnomart/ui` and `@texnomart/shared` as `workspace:*` deps in Promo/package.json.
6. Copy `src/styles/` from Dashboard (index.css, tailwind.css, theme.css, fonts.css).
   In tailwind.css keep the two @source lines:
     @source '../../../packages/ui/src/**/*.{js,ts,jsx,tsx}';
     @source '../../../packages/shared/src/**/*.{js,ts,jsx,tsx}';
7. Use React Router v7 (createBrowserRouter), AuthProvider + RequireAuth from
   @texnomart/shared/auth, Recharts, Lucide, date-fns (ru locale).
8. Create `Promo/CLAUDE.md` documenting routes, pages, mock data.
```

---
---

# PROMPT 0 — FOUNDATION (Design System)

> Paste this first, before any other prompt.

```
You are building "Texnomart Promo" — an internal, role-based B2B workspace for planning and approving retail promo campaigns for Texnomart (an electronics & appliances retailer in Uzbekistan). It is a data-dense productivity tool, NOT a marketing site. Optimize for clarity, scanability, and dense tabular data over decoration.

This app is a NEW sub-project inside the Texnomart pnpm monorepo. It MUST follow the monorepo's shared design system and conventions exactly.

== TECH & IMPORTS (NON-NEGOTIABLE) ==
- React 18 + TypeScript, Vite 6, React Router v7 (createBrowserRouter, browser router).
- Tailwind CSS v4 (@import syntax, NO tailwind.config.js). Charts: Recharts. Icons: lucide-react. Dates: date-fns with the `ru` locale. Animations: Motion + tw-animate-css (subtle, fast — row highlight, drawer open). Drag-and-drop (calendar/grid reorder): react-dnd + HTML5 backend.
- Use shadcn/ui primitives from `@texnomart/ui/*` — e.g.
    import { Button } from "@texnomart/ui/button"
    import { Card, CardContent } from "@texnomart/ui/card"
    import { Table } from "@texnomart/ui/table"
    import { Badge } from "@texnomart/ui/badge"
    import { Dialog } from "@texnomart/ui/dialog"
    import { Sheet } from "@texnomart/ui/sheet"
    import { Tabs } from "@texnomart/ui/tabs"
    import { Popover } from "@texnomart/ui/popover"
    import { Command } from "@texnomart/ui/command"
    import { cn } from "@texnomart/ui/utils"
  DO NOT manually edit files under packages/ui/src — they are auto-generated.
- Use pattern components, auth, hooks, formatters from `@texnomart/shared/*` — e.g.
    import { AppShell } from "@texnomart/shared/components/app-shell"
    import { PageHeader } from "@texnomart/shared/components/page-header"
    import { ListPageHeader } from "@texnomart/shared/components/list-page-header"
    import { DetailPageHero } from "@texnomart/shared/components/detail-page-hero"
    import { FilterBar } from "@texnomart/shared/components/filter-bar"
    import { StatusBadge } from "@texnomart/shared/components/status-badge"
    import { InfoRow } from "@texnomart/shared/components/info-row"
    import { Timeline } from "@texnomart/shared/components/timeline"
    import { MobileListCard } from "@texnomart/shared/components/mobile-list-card"
    import { AuthProvider, useAuth } from "@texnomart/shared/auth/auth-context"
    import { RequireAuth } from "@texnomart/shared/auth/require-auth"
    import { usePagination } from "@texnomart/shared/hooks/use-pagination"
    import { useTableFilters } from "@texnomart/shared/hooks/use-table-filters"
    import { formatCurrency, formatDate } from "@texnomart/shared/utils/formatters"
  @texnomart/shared components are freely editable; extend them or add new ones when a pattern is missing.
- All data is MOCK, defined in `Promo/src/lib/*.ts`. No API integration. Components may keep the "use client" directive (Figma Make convention, safe).

== LANGUAGE & LOCALE (RUSSIAN-ONLY) ==
- All UI text is in Russian (Русский). No bilingual sublabels.
- Currency: Uzbek so'm (UZS). Format with space thousands separators via toLocaleString("ru-RU") + " сум", e.g. 1 299 000 сум. Installments: "от 89 848 сум / мес".
- Dates: DD.MM.YYYY. Date+time in audit/history: DD.MM.YYYY HH:mm. Use date-fns `ru`.
- ALWAYS label which kind of day a deadline uses: «календарные дни» (tied to a date) vs «рабочие дни» (Mon–Fri). The spec mixes both.
- Percent: "15 %". Quantities: integers with space separators. Numbers in tables: `tabular-nums`, right-aligned.

== BRAND & COLOR (MONOREPO TOKENS) ==
- Primary (yellow): #FFD60A. On-yellow / primary-foreground text: #000000. Yellow is an ACCENT (primary buttons, brand, active nav/tab/chip) — NEVER a large background fill.
- Background #ffffff; muted surface #ececf0; muted text #717182; border rgba(0,0,0,0.1); destructive #d4183d.
- Layout surfaces: sidebar = white; header/breadcrumb = white; main content area = bg-gray-50 (#f9fafb) so white cards stand out.
- Font: Inter (400/500/600/700), base 16px. Border radius: 0.625rem (10px) for cards/inputs; badges/pills fully rounded. Card shadow: 0px 2px 4px rgba(204,204,204,0.25).
- Colors in code: exact hex via style={{}} when needed; NEVER Tailwind arbitrary classes like bg-[#FFD60A]. Theme tokens live in Promo/src/styles/theme.css as CSS variables.

== STATUS COLOR MAP (use everywhere a status appears) ==
Render statuses with the shared <StatusBadge> — soft tint (light bg + colored text), never loud solid fills. Pair color with text/icon (color is never the only signal). Map the spec's promo statuses onto the monorepo `--status-*` CSS variables (defined in theme.css):

  Spec status (RU)                                   → token            → hex
  Не заполнено / Ожидание корректировки от КМ        → --status-rejected   #EF4444 (destructive)
  На согласовании у старшего КМ                      → --status-pending    #F59E0B (warning)
  Согласовано старшим КМ (ожидает КД)                → --status-new        #3B82F6 (info/blue)
  На согласовании у коммерческого директора          → --status-pending    #F59E0B (warning)
  Принято коммерческим директором / Согласовано       → --status-approved   #10B981 (green)
  Согласовано и отправлено смежным отделам           → --status-completed  #059669 (green, + last-sent date)
  Не участвует                                       → --status-cancelled  #6B7280 (neutral gray)
  Переотправлено на корректировку КМ                 → --status-rejected   #EF4444 (destructive)
  Отменена                                           → --status-expired    #DC2626 (red; row tinted, name struck-through)
  Ожидает проверки 1С                                → --status-on-hold    #F97316 (orange)
  Ожидает повторного согласования маркетинга          → --status-returned   #EC4899 (pink)

Plan-level statuses (plan workflow): На ознакомлении → На обсуждении → На согл. с КД → На согл. с ОД → Утверждён / Отклонён.
Overdue (просрочка): a small red micro-tag with day count (e.g. "+3 дн."). It NEVER blocks an action; it is always logged.

== DATA FORMATTING DETAILS ==
- Use formatCurrency / formatDate from @texnomart/shared/utils/formatters; extend them if a format is missing rather than re-implementing inline.
- Manual-edit marker: a ✏️ pencil icon next to a value means "изменено вручную, автообновление остановлено" (used for Остаток).
- Lock marker: a small lock icon means the field is read-only / pulled from 1С (Себестоимость, Розничная цена (старая)).

== COMPONENT CONVENTIONS ==
- Primary action button = yellow (#FFD60A) dark text. Secondary = outline. Destructive = red (destructive variant).
- Every destructive or approval action opens a confirm Dialog. Rejection / cancellation / «Не участвует» / deadline-change dialogs REQUIRE a reason Textarea (the spec's mandatory-comment rule) — implement once as <ReasonDialog> (PROMPT 1).
- Tables: sticky header, no zebra (use hover highlight), left-align text, right-align numbers, freeze the first 1–2 identity columns in wide grids and horizontally scroll the rest.
- Loading: Skeleton blocks matching the final shape, NEVER spinners. Empty: Lucide icon 48px + RU heading + description + CTA. Error: icon + message + "Повторить" button.

== RESPONSIVE STRATEGY (WEB-FIRST, MOBILE-RESPONSIVE) — Pattern K ==
Desktop-first; every screen usable down to ~375px. Breakpoints sm 640 / md 768 / lg 1024 / xl 1280; design at lg+ first, adapt down.
- Sidebar: fixed at lg+; hamburger-triggered left Sheet below lg.
- Top bar: condense below md (search collapses to an icon).
- FilterBar: inline row at lg+; a "Фильтры" Sheet below lg with active-filter chips shown inline.
- Sheets/Dialogs: full-width (full-screen) below sm; side drawers go full-width below md.
- Touch targets ≥ 44px under md; replace hover-only affordances with tap-to-reveal.

Dense tables use one of two modes (each screen states which):
- MODE A "scroll grid" (data-entry grids, e.g. full calendar): keep the table; freeze the first 1–2 identity columns; the rest scroll horizontally with a sticky header + visible scroll cue; add a column-group visibility toggle.
- MODE B "card list" (overview/management tables, e.g. short calendar, review queue, reports, audit log): below md, render each row as a Card (identity + status + 2–3 priority fields) with the rest behind «Подробнее»; tapping the card opens the same detail page/Sheet used on desktop. Use the shared <MobileListCard>.
Charts: wrap Recharts in ResponsiveContainer; stack stat clusters vertically below md. Never drop text below 12px to force-fit a table.

== MONOREPO PATTERNS (reuse, do not reinvent) ==
Follow the shared Patterns A–K:
  A PageHeader (64px, H1 + controls)      B FilterBar (chips + popovers)
  C DataTable (Table in Card, sticky)     D Detail Page (full route /entity/:id, NEVER drawers)
  D2 Config Drawer (drawers ONLY for settings/config)   E Create/Edit Modal (Dialog 560–720px, Sheet on mobile)
  F Frozen Columns (split-pane, NOT position:sticky on <td>)   G Confirmation Dialog (AlertTriangle + typed confirm)
  H Status Badge   I Unified States (skeleton/empty/error)   J Detail Sub-components (InfoRow, Timeline, Tabs)   K Mobile Responsive
Page title (H1): text-2xl md:text-[32px] font-bold leading-tight text-gray-900.

Acknowledge these rules and apply them to every subsequent screen. Do not build anything yet — wait for the next prompt.
```

---
---

# PROMPT 1 — MASTER (Application Shell)

> Paste after PROMPT 0. Builds the `Promo/` app frame all screens live in.

```
Using the Foundation rules (PROMPT 0), build the application shell for "Texnomart Promo" as a navigable React Router app, by configuring the shared AppShell from @texnomart/shared. Build the frame + an empty content area with placeholder panels per module; we fill modules in later prompts.

APP ENTRY
- Promo/src/app/App.tsx: <AuthProvider> + <RouterProvider> + Toaster (sonner from @texnomart/ui/sonner).
- Promo/src/app/routes.tsx: createBrowserRouter with a protected layout (RequireAuth) wrapping the AppShell, and guest routes for /login.
- Reuse the shared auth flow: /login → /login/2fa → / (same AuthContext/RequireAuth as Dashboard).

SHELL CONFIG (Promo/src/app/shell-config.tsx)
Provide an AppShellConfig object (type from @texnomart/shared/types) to <AppShell>:
- logo / logoCollapsed: reuse the Texnomart SVG wordmark + icon (copy from Dashboard's shell-config.tsx).
- searchPlaceholder: "Поиск акций, номенклатуры, отчётов...".
- user: a seeded current user with name, role, initials.
- navGroups (Russian-only labels, Lucide icons):
    1. Краткий промо-календарь   (icon CalendarRange)   href /short-calendar
    2. Полный промо-календарь    (icon Table2)          href /full-calendar
    3. Согласование              (icon CheckCircle2)    href /approvals     badge = count awaiting current role
    4. Отчёты смежным отделам    (icon FileBarChart)    href /reports
    5. Уведомления               (icon Bell)            href /notifications badge = unread, badgeVariant destructive
    6. Аудит-лог                 (icon ShieldCheck)     href /audit
    7. Настройки типов промо     (icon SlidersHorizontal) href /promo-types   roles: ["Коммерческий директор","Администратор"]
- breadcrumbRoutes: data-driven entries for each route + detail routes (/short-calendar/:promoId, /full-calendar, /approvals/:id, /reports, /audit, /promo-types/:ruleId).

ROLE SWITCHER (CRITICAL — this app is role-based)
Implement a role switcher in the AppShell user menu that drives a global `currentRole`. Roles (spec access matrix, RU):
  Коммерческий директор · Операционный директор · Директор маркетинга ·
  Категорийный менеджер (КМ) · Старший КМ · Сотрудник маркетинга ·
  Сотрудник закупа · Сотрудник аналитики · Администратор
Selecting a role updates `currentRole` (React context/state). Nav items, buttons, and editable fields show/hide or enable/disable per role (see Appendix — role matrix). Show the active role as a pill next to the avatar. One user may hold several roles — allow multi-select but act as exactly one at a time.

SHARED PRIMITIVES (define once in Promo/src/components/, reuse everywhere)
Prefer the existing @texnomart/shared components; add these Promo-specific ones where none exists:
- <PromoStatusBadge status=... />  — wraps the shared <StatusBadge>; implements the full status map from PROMPT 0 (campaign-, KM-, and plan-level).
- <OverdueTag days=... />          — red micro-badge "+N дн.", never blocking.
- <Money value=... /> and <RuDate value=... /> — thin wrappers over formatCurrency / formatDate.
- <ReasonDialog />                 — confirm Dialog with a REQUIRED reason Textarea (used by reject / cancel / «Не участвует» / deadline-change). Persists author + date/time.
- <VersionHistoryDrawer />         — right-side Sheet listing versions (date/time, author + role, change-type chip: Первичная отправка / Корректировка / Добавление / Отмена / Отправка отчёта) with a "Показать только изменения" toggle. Stub content for now (fleshed out in S4).
- <DeadlineChips />                — chips surfacing the spec calendar deadlines: «план → КМ за 46 дней», «заполнение КМ за 21 день», «отправка отчёта за 17 дней» (all labelled «календарные»).
Reuse the shared <FilterBar>; ensure it includes a "Скрыть отменённое" switch that is ON by default.

BEHAVIOR
- Clicking a nav item swaps the content panel (router navigation). For now each panel shows a titled placeholder + the FilterBar.
- Seed a small GLOBAL mock dataset later screens reuse: ~8 promo campaigns (mix of planned/unplanned, several statuses, one cancelled), ~6 category managers (КМ) with categories, a 1С nomenclature reference (~30 SKUs), and a promo-type reference. Put it in Promo/src/lib/promo-mock-data.ts.

RESPONSIVE: AppShell already handles sidebar→hamburger Sheet below lg and top-bar condensing below md (Pattern K). Confirm the shell renders, nav works, role switching gates the placeholders, then wait for the section prompts.
```

---
---

# PROMPT 2 — SECTION PROMPTS (S1–S8)

Each references the Foundation (PROMPT 0) + Master (PROMPT 1) + the Appendices. Paste the relevant Appendix alongside for best fidelity.

---

## S1 — Краткий промо-календарь + формирование и согласование плана

```
Build the "Краткий промо-календарь / Short promo calendar" screen at /short-calendar into the shell. This is a MANAGEMENT/CONTROL table — it shows planned campaigns, their dates, approval stage, and per-KM readiness. It holds NO nomenclature/price data (that lives in the full calendar); statuses here are AUTO-computed and read-only (spec §4.4). Only PLANNED campaigns appear here — unplanned ones never show in the short calendar (state this in an info tooltip, spec §4.1).

LAYOUT: shared <PageHeader> (H1 "Краткий промо-календарь", counter "Найдено N акций", a "План акций / Promo plan" mode toggle, primary CTA gated to Директор маркетинга) → shared <FilterBar> → Card with the table (Pattern C). Use Pattern F (split-pane) for frozen columns, NOT position:sticky on <td>.

TABLE (one row per promo campaign)
- Frozen identity columns (left): № промо | Тип промо | Название акции.
- Calendar columns: Период акции (date range + a day-of-week strip) | Распределение по дням (by category) | ФИО КМ (responsible per category).
- Deadline column: «Крайний срок заполнения КМ» = auto = 21 calendar days before start; show the date + an <OverdueTag> if passed.
- Per-KM status columns: one column per participating КМ, each cell a <PromoStatusBadge> with the KM-level status (Appendix A). Horizontal scroll if many КМ.
- Aggregated indicators (right): a compact stat cluster per row (spec §4.6) — «На согл. с КД» / «Принято КД» / «Не заполнено» / «Не участвует», each a small count chip in its status color. The intermediate senior-KM step is NOT a separate chip; its results roll into these.
- Single campaign status column: the auto-computed campaign-level <PromoStatusBadge> (Appendix A). Read-only.

INTERACTIONS
- Row click → navigates to a full detail page /short-calendar/:promoId (Pattern D — NOT a drawer): hero band (№ + name + campaign status), per-KM breakdown, deadlines (<DeadlineChips>), and a "Открыть в полном календаре" link.
- FilterBar chips: тип, статус, КМ, месяц; "Скрыть отменённое" ON by default. Cancelled rows tinted red + struck-through name when shown.

PLAN CREATION & MULTI-LEVEL APPROVAL (role-aware "План акций" mode)
A stepper showing the approval chain and who acts now (spec §4.2.6, §4.3.2):
  Директор маркетинга (создаёт/правит план) → Коммерческий директор (распределение по категориям + согласование) → Операционный директор (финальное согласование).
- Директор маркетинга: create/edit plan rows (№ промо, тип, название, период; days-of-week auto from period) before approval; "Отправить на согласование".
- Коммерческий директор: edit category distribution + assign КМ, then Согласовать / Отклонить (Отклонить uses <ReasonDialog>).
- Операционный директор: final Согласовать / Отклонить (ReasonDialog).
- Plan-level statuses: На ознакомлении → На обсуждении → На согл. с КД → На согл. с ОД → Утверждён / Отклонён.
- After the plan is approved, identity/calendar fields switch to read-only with a lock icon (spec §4.3.1).
- Surface calendar deadlines as chips via <DeadlineChips> (план → КМ за 46 дней; заполнение КМ за 21 день; отправка отчёта за 17 дней — labelled «календарные»).
Gate every action by currentRole. Use the seeded mock campaigns. Keep numbers tabular and aligned.

RESPONSIVE (Mode B): below md, render each campaign as a <MobileListCard> stacking № + название + campaign StatusBadge + the aggregated chips; collapse per-KM columns into one "Готовность КМ" summary (e.g. "3 принято · 1 не заполнено · 1 не участвует"), full breakdown on the detail page. Plan stepper stacks vertically; deadline chips wrap.
```

---

## S2 — Полный промо-календарь (грид) + загрузка Excel + состояния 1С + внеплановые

```
Build the "Полный промо-календарь / Full promo calendar" at /full-calendar — the detailed editable DATA GRID where category managers enter nomenclature, prices, installments, compensations, and marketing flags (spec §6, §8). This is the most complex screen; prioritize a fast, dense, spreadsheet-like grid.

GRID (Pattern F frozen columns + Mode A scroll grid)
- One row per nomenclature line within a campaign. Group rows by campaign (group header showing № промо, тип, название, период, признак план/внеплан).
- Columns = the FULL field dictionary (Appendix C, 38 fields). Freeze the first columns (ФИО КМ, № промо, Номенклатура); horizontally scroll the wide price/installment block; right-align all numeric/money columns with tabular figures.
- Identity & calendar fields (№ промо, тип, название, dates, признак) are AUTO-FILLED from the short calendar for planned campaigns and read-only here (lock icon); editable only for unplanned (spec §8.1).
- Себестоимость: pulled from 1С, locked (lock icon). Розничная цена (старая): auto, KM-department-only, locked.
- Остаток: editable by КМ; if edited manually show a ✏️ pencil + tooltip "значение изменено вручную, автообновление остановлено"; clicking the value opens a Popover with per-warehouse breakdown (from 1С, read-only) + total (spec §8.2.2).
- Installments: render the three programs (0-0-6, 0-0-12, 50-0-2 ежемесячный платёж) and the 12/24/36-month sets (old/new monthly, discount, new full price) as a grouped, visually banded column section; monthly payments auto-calculated from full price (spec §8.5).
- Прогноз продаж = REQUIRED (red asterisk; block "отправить на согласование" if empty). УТП, Регулярные продажи = optional (spec §8.6).
- Gift fields (Номенклатура по подаркам, Остаток подарка): only shown/required when тип = «1+1» or «Товар в подарок» (spec §8.8).
- "В рекламу (рекомендация КМ)" and "В рекламу (выбрано маркетингом)" = checkboxes with a bulk-select affordance (spec §8.7).

NOMENCLATURE ENTRY (spec §8.2.1)
- Adding a line: a Command-style searchable Select (@texnomart/ui/command) bound to the 1С nomenclature reference (mock). NO free-text entry.
- Duplicate check: when a nomenclature already exists in this promo, or in another promo with an overlapping period, highlight the row and show a warning Dialog: «Данная номенклатура уже участвует в промо-акции. Вы уверены, что хотите добавить дубль?» — adding is NOT blocked; keep a persistent «дубль» marker visible to reviewers, and store {what, which promo, overlap period, user, date/time} in history.

EXCEL BULK IMPORT (spec §8.2.1)
- "Загрузить из Excel" button → Dialog with template download, drag-drop, and a per-row validation preview table: valid rows → draft; error rows highlighted with reason (неверная номенклатура / нет в 1С / не заполнены обязательные поля / нарушена структура шаблона). Block "отправить на согласование" until errors fixed or removed.

1С AVAILABILITY STATES (spec §8.3)
- If 1С is unavailable, allow saving a draft with badge «Ожидает проверки 1С» + a non-blocking Alert banner. Sending for approval is disabled until a 1С re-check passes; failed rows highlight with reason.

UNPLANNED CAMPAIGNS (внеплановые, spec §10)
- "Создать внеплановую акцию": created directly here with NO № промо (system generates an id), признак auto = «Внеплановая», type chosen manually (editable only until first send for approval), deadline ≥ 3 calendar days before start.
- Also support "встроить в существующую плановую акцию" (same type, existing № промо, keeps признак «Плановая»).

ROW-LEVEL REVIEW FEEDBACK (shared with S3)
- Rejected lines render with a tinted background + icon; hovering/selecting shows the reviewer's comment. Corrected lines clear the highlight after re-submit (spec §4.5.2).

STICKY BOTTOM ACTION BAR: validation summary (e.g. "3 обязательных поля не заполнены") + "Сохранить черновик" + "Отправить на согласование" (disabled until valid). Gate editing by currentRole (КМ edits own lines only). Use Appendix C for exact columns, Appendix B for terms.

RESPONSIVE (Mode A): keep the grid tabular at all sizes; freeze ФИО КМ / № промо / Номенклатура; the price + installment blocks scroll horizontally with sticky header + scroll cue. Add a column-group visibility toggle (Идентификация / Товар / Цены / Рассрочка / Маркетинг). The bottom action bar stays sticky full-width on mobile; Excel-import and warehouse-breakdown popovers become full-screen Sheets below sm. For single-line editing on phones, tapping a line opens a full-screen "редактировать строку" Sheet with fields stacked by group.
```

---

## S3 — Согласование и проверка (КМ → Старший КМ → КД) + «Не участвует» + SLA

```
Build the "Согласование / Approvals" workspace at /approvals — the review interface for Старший КМ and Коммерческий директор, plus КМ submission and the «Не участвует» flow. Statuses computed per (Promo + КМ) (spec §4.5).

REVIEW QUEUE (Pattern C; Mode B below md)
- A table of items awaiting the current reviewer (role-aware): columns № промо, тип, название, КМ, отправлено (date+time), SLA-таймер (working days left of the 2-working-day window, note «рабочие дни (Пн–Пт)») with an <OverdueTag> when exceeded.
- Open an item → split view: left = the КМ's submitted lines (read-only snapshot of the submitted version, spec §11.2), right = review actions. Below lg, stack vertically: submitted lines on top in a collapsible panel; review actions in a sticky bottom bar.

REVIEW ACTIONS (spec §4.5.2, §4.7)
- Per line: Принять / Отклонить. Отклонить requires a comment (<ReasonDialog>) and can attach the comment to specific selected lines (multi-select) OR a general comment for the whole set. Rejecting ANY line returns the WHOLE КМ data set to «Не заполнено / Ожидание корректировки от КМ».
- Bulk: «Согласовать всё» / «Отклонить выбранные».
- Старший КМ approve → auto-forwards to КД («Согласовано старшим КМ (ожидает КД)»).
- КД approve → «Принято коммерческим директором».
- Auto-escalation: if Старший КМ doesn't act within 2 working days, the item auto-forwards to КД — show an «авто-передано по истечении срока» tag.
- Overdue by КД does NOT block sending — record просрочка (date/time + day count) but allow completion later. Show it as a red note in history, not a hard stop.

«НЕ УЧАСТВУЕТ» FLOW (full lifecycle, spec §4.5.1)
- КМ sets «Не участвует» → REQUIRED reason (Textarea) → routed to Старший КМ.
- Старший КМ (2 working days): Принять (→ КД) or Отклонить (comment optional; КМ must then provide nomenclature). No reaction in 2 working days → auto-forward to КД.
- КД: Принять (КМ released) or Отклонить (comment optional; КМ must provide data).
- КД can also SET «Не участвует» for any КМ directly (reason optional but recommended; КМ cannot override; Старший КМ is notified).
- Make clear in the UI that «Не участвует» is itself an approval object that must reach a final decision before the campaign advances (a campaign can't move to the next level until every КМ has a final decision).

COMMENT MODEL: all rejection comments are content-required where the spec mandates; persist with author + date/time and show them in the line tooltip and the <VersionHistoryDrawer>.

Gate all actions by currentRole. Reuse <PromoStatusBadge> / <OverdueTag> / <ReasonDialog>. Seed a few items in each state so all paths are visible.

RESPONSIVE: review queue uses Mode B below md. ReasonDialog is full-screen below sm. SLA timers and «авто-передано» tags wrap rather than truncate.
```

---

## S4 — Управление изменениями, версионирование и отмена

```
Build the change-management layer (spec §5, §11.5, §11.8): editing AFTER approval, versioning, incremental re-send to departments, and cancellation. A dedicated "История и изменения" view plus dialogs reused across the full calendar.

VERSIONING & DIFF (spec §5.1, §7.1)
- Flesh out <VersionHistoryDrawer>: a vertical list of versions, each with date/time, author (user + role), change-type chip (Первичная отправка / Корректировка / Добавление / Отмена / Отправка отчёта), and a summary of changed fields. A "Показать только изменения" toggle filters to changed/added cells.
- Provide three views: «Только изменения», «Полный актуальный отчёт», «История версий». Previous versions are never deleted.
- State clearly: rollback is NOT supported (spec §5.2.1) — reverting is done as a NEW correction that goes through approval again (offer a "Создать корректировку" action, not a "revert").

EDIT-AFTER-APPROVAL RULES (spec §5.1, §5.2, §11.8)
- Any edit to approved data is a tracked change detected by comparing to the last saved version; until it passes approval (Старший КМ → КД, + Маркетинг where required), it is a draft and is NOT sent to departments.
- After КД approval, each change IMMEDIATELY forms an updated report version and is sent INCREMENTALLY (only changed/added data) to departments, with highlight + notification. Show a confirmation toast + a new version entry.
- Period change of a planned campaign: show a ✏️ pencil next to the period and render the period in bold (spec §11.5).
- Changes (EXCEPT adding new products) require RE-APPROVAL by Маркетинг (spec §11.8) before going to departments — surface a «Ожидает повторного согласования маркетинга» state.

CANCELLATION (spec §5.3)
- Cancel whole campaign: only Коммерческий директор (or authorized). Confirm dialog with REQUIRED reason (<ReasonDialog>). Result: status «Отменена», row tinted red, name struck-through, a separate «Акция отменена» notification to all departments. Model cancellation as a SEPARATE state field, NOT inside «Признак акции» (which holds план/внеплан only).
- Cancel/remove a nomenclature line: КМ with required reason → requires КД re-approval → line marked «Исключена из акции / Отменена», highlighted red, departments notified incrementally; campaign status stays «Согласовано», aggregated counts may drop.
- Filters: show/hide cancelled campaigns and removed lines; "Скрыть отменённое" ON by default; full list (with cancelled) available on toggle for analytics/history; cancelled data stays in reports with markers and in an archive.

DEADLINE CHANGE (spec §4.7 "Изменение дедлайнов"): add an "Изменить дедлайн" action — Коммерческий директор initiates with required reason; takes effect only after approval by senior leadership (первый зам / зам директора / уполномоченное лицо); log initiator, reason, date, old & new deadline.

Reuse <VersionHistoryDrawer> / <ReasonDialog> / <PromoStatusBadge>. Gate by currentRole.
```

---

## S5 — Отчёты для смежных подразделений (Маркетинг / Закуп / Аналитика) + ознакомление

```
Build "Отчёты смежным отделам / Department reports" at /reports — READ-ONLY, versioned reports auto-generated when a campaign reaches «Согласовано и отправлено смежным отделам» (spec §7). Three department views via Tabs; currentRole determines which tab is accessible (Appendix — role matrix).

COMMON (spec §7.1)
- Each report shows its own field subset (Appendix C report routing M/P/A), not editable by recipients (except the one marketing field below), informational only.
- Versioned: current version + "Показать только изменённые/добавленные данные" + "История версий" (reuse <VersionHistoryDrawer>). New highlighted cells for changed/added data.
- Acknowledgement: "Ознакомлен с изменениями" — either all at once or per selected line; after acknowledging, the highlight clears (spec §11.4). Make explicit (info note) that ознакомление is NOT согласование and does not change campaign status (spec §11.7).

MARKETING TAB (Отчёт для маркетинга, spec §7.2)
- Widest field set (identity + prices + full installment block + gifts + УТП + both "В рекламу" checkboxes — see Appendix C M column).
- The ONLY editable field for Сотрудник маркетинга: «В рекламу (выбрано маркетингом)» checkbox, with convenient bulk-select; everything else read-only. On marketing approval, КМ are notified.
- Note the re-approval rule: edits to already-sent data require marketing re-approval (link to S4 / spec §11.8).

PURCHASING TAB (Отчёт для закупа, spec §7.2.1)
- Narrow set: тип, название, dates, номенклатура, номенклатура по подаркам, компенсация от поставщика, лимит компенсируемого количества. All read-only.

ANALYTICS TAB (Отчёт для аналитики, spec §7.2.2)
- Same narrow compensation/limit set as purchasing, read-only.

Show a small «получено» timeline note and an overdue marker if the report was sent later than 17 calendar days before start (spec §4.7). Gate tab access by currentRole. Seed one campaign sent + one with a later incremental change so the diff/acknowledge flow is visible.

RESPONSIVE: report tables use Mode B below md, keeping the marketing checkbox and acknowledge action tappable (≥44px) on each card. Department Tabs collapse into a Select on small screens. <VersionHistoryDrawer> opens full-screen below sm.
```

---

## S6 — Центр уведомлений

```
Build the notifications system (spec §11.3): the top-bar bell (unread count) opens a Sheet/Popover "Центр уведомлений" at /notifications.
- Notification list grouped by date; each item shows: type icon, № версии отчёта, дата и время отправки, ответственный пользователь, краткое описание изменений, and a quick link to the related campaign/report.
- Types: новые/изменённые данные, «Акция отменена», «Удалена позиция», «Требуется повторное согласование маркетинга», назначение КМ, утверждение «В рекламу».
- Per-item and bulk "Ознакомлен"; acknowledged items move to a muted "Прочитано" group; bell count updates.
- Filtering by type/role; note that available notifications depend on the user's role and rights (spec §11.3.1).
- Reuse <RuDate> and <PromoStatusBadge>. Seed ~8 notifications across types and read/unread states. Keep it lightweight.

RESPONSIVE: full-width Sheet below sm; date groups and filters stack.
```

---

## S7 — Гибкая настройка обязательных полей для типов промо (Настройки)

```
Build "Настройки типов промо / Promo-type settings" at /promo-types (spec §9) — where Коммерческий директор (or assigned Администратор) defines which full-calendar fields are REQUIRED per promo type, saved as reusable rules.

LAYOUT (two-pane; Pattern D2 config drawer only for quick edits)
- Left: list of existing rules (name, applied promo type(s), status: Черновик / Утверждено / Архив) with search + "Создать правило" + "Копировать".
- Right: rule editor:
  - Наименование правила (e.g. «Рассрочка 0-0-12»).
  - Тип(ы) промо — multi-select from the promo-type reference.
  - Перечень обязательных полей — a checklist of the full-calendar fields (Appendix C); checked = required. Group the checklist by field category (идентификация / товарные / цены / рассрочка / маркетинг) for scanability.
  - Actions: Сохранить, Отправить на подтверждение, Архивировать (no hard delete).
- A rule takes effect ONLY after Коммерческий директор confirmation; until then it doesn't affect data entry. Any edit to an existing rule needs re-confirmation. Keep rule change history (spec §9.5).

EFFECT PREVIEW: a small note — "Для типа X станут обязательными N полей" — and explain that when a rule exists, those fields are highlighted/required in the full calendar and block «отправить на согласование» if empty; when no rule exists, completeness is controlled only via the approval process (spec §9.3).

Gate editing by currentRole (Коммерческий директор / assigned Администратор). Reuse Card, Checkbox, Badge, Dialog. Seed 2–3 rules in different statuses.
```

---

## S8 — Аудит-лог и свод контрольных событий

```
Build "Аудит-лог / Audit log" at /audit with two tabs (spec §11.9).

TAB 1 — Аудит-лог (action log)
- A dense filterable table: пользователь, роль, дата и время, тип действия (создание / изменение / отправка на согласование / согласование / отклонение / отмена / установка «Не участвует» / отправка отчёта), объект действия (акция / строка / отчёт), статус до → после, комментарий/причина (if any).
- Filters: пользователь, роль, тип действия, объект, диапазон дат. Sticky header, tabular date/time, monospace ids.

TAB 2 — Свод контрольных событий (control-events timeline)
- Per campaign, a horizontal timeline of key milestones with dates (reuse the shared <Timeline>): создание/утверждение плана → отправка данных КМ → согласование/отклонение старшим КМ → согласование/отклонение КД → установка «Не участвует» → отправка отчёта смежным отделам.
- Mark any breached deadline with a red node + day-count of просрочка, attributed to the responsible participant.
- A summary strip: count of overdue events, average approval time (рабочие дни).

Read-only. Reuse <PromoStatusBadge> / <OverdueTag> / <RuDate>. Seed a campaign whose timeline includes one overdue step so the breach styling shows.

RESPONSIVE: the action-log table uses Mode B below md, with filters in a "Фильтры" Sheet. The control-events timeline switches from horizontal to vertical on mobile, with overdue nodes flagged inline.
```

---
---

# APPENDICES

## Appendix A — Status taxonomy & color map

**Campaign-level status** (short calendar, auto-computed, read-only — spec §4.4)

| Status (RU) | Token | Hex |
|---|---|---|
| На согласовании у старшего КМ | `--status-pending` | `#F59E0B` |
| На согласовании у коммерческого директора | `--status-pending` | `#F59E0B` |
| Переотправлено на корректировку КМ | `--status-rejected` | `#EF4444` |
| Согласовано и отправлено смежным отделам (+ дата последней отправки) | `--status-completed` | `#059669` |
| Отменена (строка красная, название зачёркнуто) | `--status-expired` | `#DC2626` |

**KM-level status** (per Promo + КМ — spec §4.5)

| Status (RU) | Token | Hex |
|---|---|---|
| Не заполнено / Ожидание корректировки от КМ | `--status-rejected` | `#EF4444` |
| На согласовании у старшего КМ | `--status-pending` | `#F59E0B` |
| Согласовано старшим КМ (ожидает КД) | `--status-new` | `#3B82F6` |
| На согласовании у коммерческого директора | `--status-pending` | `#F59E0B` |
| Принято коммерческим директором | `--status-approved` | `#10B981` |
| Не участвует | `--status-cancelled` | `#6B7280` |

**Aggregated indicators** (right of short-calendar row — spec §4.6): «На согл. с КД», «Принято КД», «Не заполнено / Ожидание корректировки», «Не участвует». The senior-KM intermediate step is NOT a separate indicator; its results roll into these.

**Plan-level status** (spec §4.2.6 / §4.3.2): На ознакомлении → На обсуждении → На согл. с КД → На согл. с ОД → Утверждён / Отклонён.

**Overdue (просрочка)**: red micro-tag with day count via `<OverdueTag>`; never blocks, always logged.

> All statuses render through `<PromoStatusBadge>` (wrapping the shared `<StatusBadge>`): soft tint, color + text/icon together, never color alone.

---

## Appendix B — Glossary (RU), key terms

- **КМ** — Категорийный менеджер. **Старший КМ** — старший категорийный менеджер.
- **КД** — Коммерческий директор. **ОД** — Операционный директор.
- **Промо-акция** — promo campaign. **Плановая / Внеплановая** — planned / unplanned.
- **Краткий / Полный промо-календарь** — management/control table vs. detailed data grid.
- **Номенклатура** — SKU/product line (from the 1С reference). **Остаток** — stock balance.
- **Себестоимость** — cost price (1С, locked). **Розничная цена (старая)** — old retail price (KM-only, locked).
- **Компенсация от поставщика** — supplier compensation. **Лимит компенсируемого количества** — compensated-quantity limit.
- **Рассрочка** — installment plan. **УТП** — unique selling proposition.
- **Признак акции** — campaign flag (план/внеплан ONLY — cancellation is a separate state).
- **Согласование ≠ Ознакомление** — approval is NOT acknowledgement (spec §11.7).
- **Версионирование / Инкрементальная отправка** — versioning / incremental send (only changed/added data).
- **Календарные / Рабочие дни** — calendar days (tied to a date) vs working days (Mon–Fri). Always label which.
- **1С** — accounting/ERP system: source for nomenclature, stock, cost, old price.

---

## Appendix C — Full-calendar field dictionary & report routing (spec §6.2, §7)

Order = grid column order. M = Marketing report, P = Purchasing, A = Analytics.

| # | Field (RU) | Edit / source | M | P | A |
|---|---|---|:--:|:--:|:--:|
| 1 | Признак акции (план/внеплан) | auto | ✓ | | |
| 2 | ФИО категорийного менеджера | auto/assigned | ✓ | | |
| 3 | № промо | auto (planned) | ✓ | | |
| 4 | Тип промо | auto / manual (unplanned) | ✓ | ✓ | ✓ |
| 5 | Название акции | auto/manual | ✓ | ✓ | ✓ |
| 6 | Дата начала акции | auto/manual | ✓ | ✓ | ✓ |
| 7 | Дата окончания акции | auto/manual | ✓ | ✓ | ✓ |
| 8 | Номенклатура (осн. товар) | 1С select | ✓ | ✓ | ✓ |
| 9 | Остаток | 1С + manual (✏️) | ✓ | | |
| 10 | Себестоимость | 1С, locked | | | |
| 11 | Розничная цена (старая) | auto, KM-only, locked | ✓ | | |
| 12 | Новая цена (розничная) | manual | ✓ | | |
| 13 | Скидка, % (от полной оплаты) | manual | ✓ | | |
| 14 | Регулярные продажи | optional | | | |
| 15 | Прогноз продаж | manual, REQUIRED | | | |
| 16 | 0-0-6 (ежемес. платёж) | auto-calc | ✓ | | |
| 17 | 0-0-12 (ежемес. платёж) | auto-calc | ✓ | | |
| 18 | 50-0-2 (ежемес. платёж) | auto-calc | ✓ | | |
| 19 | Ежемес. платёж (старая) 12 мес | manual | ✓ | | |
| 20 | Ежемес. платёж (новая) 12 мес | manual/calc | ✓ | | |
| 21 | Размер скидки (12 мес) | manual | ✓ | | |
| 22 | Полная цена (новая) 12 мес | manual/calc | ✓ | | |
| 23–26 | …те же 4 поля для 24 мес | | ✓ | | |
| 27–30 | …те же 4 поля для 36 мес | | ✓ | | |
| 31 | Скидка, % за Cash | manual | ✓ | | |
| 32 | Номенклатура по подаркам | 1С select (1+1/подарок) | ✓ | ✓ | ✓ |
| 33 | Остаток подарка | auto | ✓ | | |
| 34 | Компенсация от поставщика, сумма | manual | | ✓ | ✓ |
| 35 | Лимит компенсируемого количества | manual | | ✓ | ✓ |
| 36 | УТП | optional | ✓ (if present) | | |
| 37 | В рекламу (рекомендация КМ) — checkbox | КМ | ✓ | | |
| 38 | В рекламу (выбрано маркетингом) — checkbox | Marketing-editable | ✓ (editable) | | |

> Marketing receives the widest set; Purchasing and Analytics receive only: тип, название, dates, номенклатура, номенклатура по подаркам, компенсация, лимит (spec §7.2.1, §7.2.2).

---

## Appendix D — Role access matrix (spec, "Сводная таблица доступа")

| Роль | Краткий календарь | Полный календарь | Отчёты | Ред. данных | Согласование |
|---|---|---|---|---|---|
| Коммерческий директор | Согл. плана + распределение по категориям | Просмотр всех, согл./откл. версий КМ | Просмотр всех, инициация отправки | Распределение, назначение КМ, «Не участвует», правка типа в этапе согл., инициация изменения дедлайнов | Да (план, отмена, утверждение правил типов; данные КМ с комм. и доработкой) |
| Операционный директор | Утверждение плана | Просмотр после утв. КД | Просмотр после утв. КД | Нет | Да (план + распределение) |
| Администратор | Технический (полный) | Технический (полный) | Технический (полный) | Да (тех.) | Нет |
| Директор маркетинга | Создание + подтверждение плана | Нет доступа | Просмотр (маркетинг) | Частично (план до согл.) | Частично (план) |
| Категорийный менеджер (КМ) | Просмотр, установка «Не участвует» | Заполнение/ред. (свои) | Просмотр всех | Да (только свои) | Нет (направляет старшему КМ) |
| Старший КМ | Просмотр (всех) | Заполнение/ред. (свои) + проверка данных КМ | Просмотр всех | Да (только свои) | Согл. данных КМ перед отправкой КД |
| Сотрудник маркетинга | Просмотр/создание плана при назначении | Нет доступа | Просмотр (маркетинг) | Только «В рекламу (выбрано маркетингом)» | Частично (повт. согл. изменений) |
| Сотрудник закупа | Нет доступа | Нет доступа | Просмотр (закуп) | Нет | Нет |
| Сотрудник аналитики | Нет доступа | Нет доступа | Просмотр (аналитика) | Нет | Нет |

> Финальное согласование КД может выполнять только КД или «Уполномоченное лицо коммерческого директора». Старший КМ не получает право финального согласования автоматически (spec §11.1).

---

## Spec-correctness notes baked into these prompts

- **Cancellation is a SEPARATE state**, not stuffed into «Признак акции» (which is план/внеплан only).
- **Calendar vs working days** are always labelled (deadlines = календарные; review SLAs = рабочие, Пн–Пт; holidays count as working days).
- **«Ознакомление» (acknowledgement) is kept distinct from «Согласование» (approval)** in every screen — acknowledgement never changes campaign status.
- **Rollback is not supported** — reverting is a new correction through the full approval cycle.
- **Re-approval by Маркетинг** is required for edits to already-sent data, except adding new products (spec §11.8).
- **Unplanned campaigns** never appear in the short calendar; they live only in the full calendar (spec §4.1, §10).
- **Department report routing** follows Appendix C M/P/A columns exactly (Marketing §7.2, Purchasing §7.2.1, Analytics §7.2.2).
- **Design system**: monorepo tokens (Inter, `#FFD60A`, `0.625rem`), `@texnomart/ui` + `@texnomart/shared` imports, Russian-only labels.
```

