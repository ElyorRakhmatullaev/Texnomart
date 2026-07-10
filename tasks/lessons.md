# Lessons Learned

Documented mistakes, gotchas, and learnings from project work. Never remove old entries.

---

## 2026-05-21 — Project Bootstrap

### Figma Make Codegen Conventions
- All components include `"use client"` directive — this is harmless in a Vite SPA and should be kept for consistency
- shadcn/ui components are in `src/app/components/ui/` — these are auto-generated and should not be manually edited
- The `figmaAssetResolver` Vite plugin resolves `figma:asset/` imports to `src/assets/` — keep this in `vite.config.ts`
- Tailwind v4 uses `@import` syntax, not `tailwind.config.js` — PostCSS config is intentionally empty

### Mock Data Strategy
- All mock data lives in `src/lib/` — each module has its own file
- Types are co-located with mock data (e.g., `ApplicationStatus` type is in `applications-mock-data.ts`)
- Dashboard widgets generate their own inline mock data; only `PartnerDistributionDonut` imports from centralized `mock-data.ts`

### Command Files
- `.claude/commands/` reference files that don't exist yet (`docs/AI_CONTEXT.md`, `tasks/lessons.md`, `HISTORY.md`, `texno-docs/docs.md`) — they handle missing files gracefully with "note that and continue"
- Do not modify command files to match current state — they are forward-looking by design

---

## 2026-05-21 — Architecture Decisions: Detail Pages & Mobile

### Detail Pages over Drawers
- Side drawers (Pattern D original) are insufficient for entity detail views — not enough room for tabs, rich content, and mobile layouts
- All entity detail views should be full routed pages at `/entity/:id` (Pattern D revised)
- Drawers are still appropriate for settings/config panels (Pattern D2) — these are quick overlays, not deep content
- `ApplicationDetailDrawer.tsx` is now legacy — the detail page approach supersedes it

### Mobile Responsiveness (Pattern K)
- Responsiveness must be planned per-prompt, not bolted on after — each page has unique responsive breakpoints
- Tables → card lists below md is the universal mobile pattern
- Modals → full-screen Sheets on mobile
- Minimum 44×44px touch targets everywhere
- Complex UI (priorities timeline editor, cohort heatmaps) needs explicit mobile fallback defined upfront
- Charts: hide brush/zoom on touch, legends below, resize to container

---

## 2026-05-21 — Application Detail Page Rewrite

### Prompt Spec Compliance
- The Figma Make codegen detail page used a blue gradient hero and flat vertical layout — this deviated heavily from the Prompt 3a spec which requires a white Card hero + 7 underline tabs
- When a page "works" but doesn't match the prompt spec, it needs a full rewrite, not incremental fixes — the structural differences (no tabs, wrong hero, wrong patterns) are too fundamental for patching
- Always cross-reference the prompt pack (`docs/dashboard_prompt_pack_part2.md`) before accepting a page as "done"

### shadcn Tabs Underline Style (Pattern J)
- The default shadcn TabsList uses a pill/rounded-xl style with `bg-muted` background — Pattern J requires underline tabs
- Override with: `bg-transparent border-b border-gray-200 rounded-none p-0 h-12` on TabsList and `rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent` on TabsTrigger
- Full-width layout (`max-w-5xl` removed) is preferred for detail pages — content should fill the available space within the AppShell

### View-Specific Mock Data
- When a detail page needs data beyond the core entity type (comments, history, bank cards, partner decisions with timestamps), define it inline as constants in the component file rather than bloating the shared mock data module
- Keep shared mock data (`src/lib/`) focused on the entity types used across multiple components

---

## 2026-05-22 — Auth Routing Integration

### Route Guards with createBrowserRouter
- `createBrowserRouter` uses route objects, not JSX — auth guards work best as layout route components (`ProtectedLayout`, `GuestLayout`) that conditionally render `<Outlet>` or `<Navigate>`
- Don't try to wrap `Component` in JSX inside route config — instead, create a layout component that calls `useAuth()` and renders the original layout (e.g. `AppShell`) or redirects
- `AuthProvider` must wrap `RouterProvider` in `App.tsx` so `useAuth()` works inside all route components

### Auth Pages Already Include Their Own Layout
- Each auth page wraps itself in `<AuthLayout>` — so the `GuestLayout` route component only needs to render `<Outlet>`, not provide any visual layout
- This is the opposite of how AppShell works (AppShell IS the layout, pages render inside its `<Outlet>`)

### Replace `<a href>` with React Router Navigation
- Figma Make codegen uses raw `<a href>` tags for links — these cause full-page reloads and lose React state (including auth context)
- Always replace with `<Link to>` (for declarative navigation) or `useNavigate()` (for programmatic redirects after form submission)
- Auth flow navigation (login → 2FA → dashboard) must use `useNavigate()` since it happens inside async handlers

---

## 2026-05-22 — Sticky vs Fixed Bottom Bars

### Sticky Positioning Pitfalls
- `sticky bottom-0` inside nested scroll containers with padding (`pb-8`) on the wrapper does not reliably stick — the bottom padding pushes the element away from the viewport edge
- When there are multiple `overflow-auto` ancestors (e.g., `<main>` and an inner page wrapper), sticky behavior becomes unpredictable
- **Fix**: restructure to a flex column layout where the bar is a sibling of the scroll container, not inside it — use `flex-1 overflow-auto min-h-0` for the scrollable area and `shrink-0` for the fixed bar
- To break out of a parent's padding, use negative margins on the bar (e.g., `-mx-4 -mb-4` to negate main's `p-4`) and adjust inner padding accordingly

---

## 2026-05-22 — Dashboard Scroll & Layout

### `overflow-hidden` + `h-full` Scroll Trap
- A page root with `h-full flex flex-col overflow-hidden` constrains all content to viewport height — nothing can scroll even if the parent `<main>` has `overflow-auto`
- Inner containers with `flex-1 min-h-0` compound the issue by squeezing charts into whatever space remains
- **Fix**: remove `h-full` and `overflow-hidden` from the page root, remove `flex-1 min-h-0` from inner containers, let content flow at natural height. The AppShell's `<main overflow-auto>` handles scrolling.
- Also check wrapper divs — a `max-w-[1400px] h-full` wrapper can force children to match main height exactly, preventing overflow

### Stale Grid Classes on Extracted Components
- When refactoring a grid layout, child components may still carry `col-span-*` classes from the old grid (e.g. `col-span-12 md:col-span-8` from a 12-column grid used in a 3-column parent). These classes silently break or are ignored — always clean them up when restructuring the parent grid.

---

## 2026-05-22 — State Management: Controlled vs Uncontrolled Components

### Avoid Dual State Sources
- When a child component (e.g. PageHeader) manages its own state for `period` and `compareEnabled` AND the parent (Dashboard) also manages the same state, they fall out of sync — changing one doesn't update the other
- **Fix**: make the child fully controlled — accept `period` and `compareEnabled` as props, call `onPeriodChange` / `onCompareToggle` callbacks to update the parent. No `useState` in the child for values owned by the parent.
- This applies to any case where the same value is modified from multiple sources (header dropdown + chart tabs both changing period)

### Recharts Interactive Donut (Active Shape)
- Recharts `<Pie>` supports `activeIndex`, `activeShape`, `onMouseEnter`, `onMouseLeave` for sector hover effects
- To sync hover between chart and a custom legend, share an `activeIndex` state between both — set it on Pie mouse events AND on legend row hover
- Use `Cell` opacity to dim non-active sectors, and `Sector` with expanded radius for the active shape
- `activeIndex` must be `undefined` (not `null`) when nothing is active, otherwise Recharts renders the active shape on index 0

---

## 2026-05-26 — Dashboard Mobile Responsiveness

### Sidebar as Mobile Drawer
- The shadcn `<Sidebar>` component already has built-in mobile Sheet support via `useIsMobile()` (768px breakpoint) — when `isMobile` is true, the sidebar renders as a `<Sheet>` instead of a fixed panel. No custom drawer implementation needed.
- The missing piece was a **trigger button** — on mobile, the desktop collapse toggle in the sidebar footer is hidden, so the header needs a visible hamburger `Menu` button that calls `toggleSidebar()` from `useSidebar()`.
- Access `useSidebar()` in `AppHeader` (it's already inside `SidebarProvider`) rather than prop-drilling.

### Mobile-First Grid Patterns for Dashboards
- Fixed-column grids (`grid-cols-4`, `grid-cols-3`) break on mobile — charts overflow or get squished to unusable widths.
- **Pattern**: use `grid-cols-1` as the base, then add breakpoint columns (`md:grid-cols-2`, `lg:grid-cols-3`). The "stacking" breakpoint should match the minimum useful width for the content (charts need ~300px, so stack below `md`; KPI cards are small, so 2-col works at mobile widths).
- Tables with 5+ columns should switch to card lists below `md` — show the 3-4 most important fields per card, hide the rest.

---

## 2026-06-01 — Dashboard Card Contrast & pnpm Build Approvals

### Mobile Card Visual Contrast
- White `Card` components on a white/near-white page background are indistinguishable on mobile — they need a contrasting surface behind them
- **Fix**: add `bg-gray-50/80` to the page root and use negative margins (`-m-3 md:-m-4 p-3 md:p-4`) to fill edge-to-edge within the `<main>` padding. White cards then pop against the grey surface.
- For mobile card lists inside a white Card container (e.g., RecentApplicationsWidget), give each item `bg-gray-50 rounded-lg p-3` with `gap-2` spacing instead of flat `divide-y` rows — this creates visual separation without relying on thin divider lines that are hard to see on small screens

### pnpm v11 Build Script Approvals
- pnpm v11 requires explicit approval of native build scripts — `pnpm install` fails with `ERR_PNPM_IGNORED_BUILDS` if `@tailwindcss/oxide` and `esbuild` aren't approved
- **Fix**: set `allowBuilds` in `pnpm-workspace.yaml` to `true` for each package (not `"set this to true or false"` placeholder text)
- This blocks `pnpm dev` because install is a prerequisite — the error message is clear but easy to miss if you jump straight to `pnpm dev`

---

## 2026-05-25 — Page Title Consistency

### Standardize Repeating UI Elements Across Pages
- When multiple pages share the same structural element (e.g., page H1 title), the class/style must be identical everywhere — each page being built by a separate prompt leads to drift (different `text-*` sizes, `font-semibold` vs `font-bold`, `sm:` vs `md:` breakpoints)
- **Fix**: define a single canonical class for shared elements (e.g., `text-2xl md:text-[32px] font-bold leading-tight text-gray-900` for page titles) and document it in `.claude/rules/design.md` so new pages follow the same pattern
- When adding a new page, grep existing pages for the same structural element to match their styling rather than choosing a size ad hoc

---

## 2026-06-08 — Shared Package Extraction

### Re-export Pattern for Backwards-Compatible Extraction
- When extracting a module (e.g., auth) from a project into a shared package, existing consumers don't need to change if the original file becomes a re-export: `export { AuthProvider, useAuth } from "@texnomart/shared/auth/auth-context"`
- This avoids a large, risky diff across many files — the real import path change is confined to one file per module
- Works well when the shared module's API is identical to the original; if the API changes, consumer updates are unavoidable anyway

### Config-Driven AppShell over Hardcoded Routes
- A layout shell with hardcoded nav items, breadcrumb routes, and logos can only serve one project — extracting it as a shared component requires making everything configurable via a data object (`AppShellConfig`)
- Breadcrumb generation with 27+ if/else cases should be replaced with a route table + regex matching for parameterized routes (`:id` patterns) — this scales to any number of routes and sub-projects
- Each sub-project defines a `shell-config.tsx` file with its own nav groups, breadcrumb routes, logos, and user info — the shared AppShell renders whatever config it receives

### Three-Tier Component Architecture
- `@texnomart/ui` (shadcn primitives, auto-generated, DO NOT edit) → `@texnomart/shared` (hand-written pattern components like AppShell, InfoRow, StatusBadge) → per-project feature components
- The middle tier (`@texnomart/shared`) is where components that implement project-wide patterns (Patterns A–K) live — they are editable, unlike ui primitives
- When deciding where a new component belongs: if it's a shadcn/ui primitive → `@texnomart/ui`; if it implements a shared pattern used across projects → `@texnomart/shared`; if it's specific to one project's business logic → that project's `src/app/components/`

### pnpm Workspace Package Exports
- The `"exports": {"./*": "./src/*"}` pattern in package.json enables deep imports like `@texnomart/shared/components/info-row` without an index barrel file
- This avoids circular dependencies and keeps tree-shaking effective — consumers import exactly what they need
- Vite path aliases must match: `'@texnomart/shared': path.resolve(__dirname, '../packages/shared/src')`

---

## 2026-06-09 — Detail Page Bars, Tabs & AppShell Polish

### Sticky Bottom Bar Inside a Padded Scroll Container
- A `sticky bottom-0` bar pins to the *inner* edge of the scroll container's bottom padding (`<main>` has `p-3 md:p-4`), leaving a gap where content scrolls through behind it. Offset with a negative bottom equal to the padding: `bottom-[-0.75rem] md:bottom-[-1rem]`, paired with `-mb-3 md:-mb-4` for the at-rest state.
- Negative horizontal margins must match the actual main padding per breakpoint: `-mx-3 md:-mx-4` (NOT a flat `-mx-4`, which overflows by 4px on mobile where main is `p-3`).
- Sticky bars only pin when there is scroll overflow — on a SHORT tab/page they float mid-screen. For an always-present bar, use the flex-column fixed-footer pattern instead.

### Fixed-Footer Pattern Needs a Definite-Height Ancestor
- The flex-column pattern (`h-full flex flex-col` root → `flex-1 min-h-0 overflow-auto` scroll area → `shrink-0` bar) only works if the page root has a definite height. A percentage height (`h-full`) resolves to `auto` when the parent chain is content-height.
- Fix in AppShell: the content wrapper (`<div className="mx-auto">`) needs `h-full` so pages can fill `<main>`'s flex-derived definite height. Backward-compatible — block-layout pages still overflow into `<main>`'s scroll, and app-like pages (`h-full flex flex-col` + inner scroll) finally work as designed (sticky headers, internal scroll).

### overflow-x-auto Silently Enables Vertical Scroll
- Setting `overflow-x: auto` while `overflow-y` stays `visible` makes the browser compute `overflow-y: auto` (the one-axis-non-visible quirk), adding a stray vertical scrollbar. Pair it with an explicit `overflow-y-hidden`.

### scrollbar-gutter Prevents Tab-Switch Layout Shift
- An inner scroll container shows a scrollbar only on overflowing tabs, eating ~15px and shifting content width when switching between long and short tabs. `[scrollbar-gutter:stable]` reserves the gutter always, keeping width constant. Overlay scrollbars (mobile) are unaffected.

### shadcn TabsTrigger Stretches; SidebarTrigger Ignores Children
- `TabsTrigger` carries a base `flex-1` (equal-width stretch). For content-width tabs use `flex-none` — NOT `min-w-fit`, which only blocks shrinking, not growing.
- `SidebarTrigger` hardcodes its own icon + `sr-only` text and renders as a fixed `size-7` icon button — any children passed to it are ignored. To show a custom icon **and** label (e.g. a collapse button with text in expanded mode), use a plain `<button>` wired to `toggleSidebar()` from `useSidebar()`.

### AppShell Surface Colors
- Sidebar + header + breadcrumb = white; `<main>` = `bg-gray-50` so white cards have a surface to sit against. The sidebar token changed from off-white `oklch(0.985 0 0)` to `#ffffff`; `--sidebar-border` (light gray) provides the divider against the gray main. Main uses `dark:bg-background` to avoid a stuck light panel in dark mode.

---

## 2026-06-09 — Texnomart Promo Bootstrap

### Extend Shared Components Additively, Never Breaking Existing Consumers
- Promo needed a role switcher *inside* the shared `AppShell` user menu — but `AppShell` is consumed by Dashboard too. Adding a new **optional** prop (`roleSwitcher?: RoleSwitcherConfig`) keeps the change backward-compatible: `activeRole = roleSwitcher?.current ?? config.user.role`, so consumers that pass nothing render exactly as before.
- Verify the additive change with a build of every existing consumer (`build:dashboard`) — not just the new one. A passing build of the new project alone does not prove you didn't regress the old.
- When dynamic per-state config is needed (role-aware nav badges), make the project's `shell-config` a **factory** (`createPromoShellConfig(role)`) that the thin wrapper rebuilds via `useMemo` on state change, rather than a static exported object.

### New Sub-Project = Copy Dashboard's Scaffold, Drop Unused Deps
- Fastest reliable bootstrap: mirror Dashboard's `vite.config.ts`, `index.html`, `main.tsx`, and `src/styles/*` verbatim (theme.css already carries all `--status-*` tokens), then trim the dependency list — Dashboard still ships unused `@mui/*`, `@emotion/*`, `react-slick`, `react-responsive-masonry`, `@popperjs/core`, `canvas-confetti`; a new project should not copy them.
- No `tsconfig.json` is needed — Vite/esbuild compiles without one (Dashboard has none). `vite build` catches import/syntax errors but does NOT typecheck.
- Auth pages live in each project (`src/app/components/auth/`), not in shared — copy them and re-export `AuthContext`/`RequireAuth` from `@texnomart/shared/auth`. Rebrand only `AuthLayout`'s hero text.

### Currency Suffix Differs Per Project
- Dashboard formats currency as `… UZS` (`formatCurrency`); Promo's spec wants `… сум`. Rather than re-implement inline, add a sibling `formatSum` to shared formatters and wrap it in a Promo `<Money>` primitive. Don't change `formatCurrency` — Dashboard depends on the `UZS` suffix.

### pnpm Is Invoked via corepack Here
- `pnpm` is not on PATH in this environment (and absent from the Bash tool). Use `corepack pnpm …` from the PowerShell tool (Node tooling is on the Windows PATH there). Applies to install/dev/build.
- The root `build:promo`/`dev:promo` scripts run `pnpm --filter …`, which re-invokes a bare `pnpm` and fails. Bypass them: run `corepack pnpm --filter promo build` (the per-project `build`/`dev` scripts call `vite` directly, so no nested pnpm).

---

## 2026-06-09 — Texnomart Promo S1 (Краткий промо-календарь)

### Pattern F Frozen Columns = Split-Pane With Fixed Row Heights
- Implement frozen columns as **two sibling divs** in a flex row: a `shrink-0` frozen pane (identity columns) + an `overflow-x-auto` scrolling pane (everything else). Do **not** use `position:sticky` on cells — even though Dashboard's cohort table does, the project rule/lesson prefers the split-pane (sticky-on-`<td>` is buggy across browsers).
- The catch: two independent panes don't auto-align row heights. Fix it with a shared fixed header height + fixed row `min-h-[..]` on **both** panes, and truncate identity text to one line. Row content in the scroll pane lays out on one line (badges, chips) so a fixed height never clips it.
- Per-entity status columns (one per КМ) read cleanest as the **union** of all entities (sparse grid, render «—» where absent) rather than per-row variable columns — that keeps every row's column boundaries aligned.

### Mock Approval State Machines: Local State + Toast, Seeded Mid-Flow
- For role-based approval chains (Дир. маркетинга → КД → ОД), model the plan as a single `useState` status and derive the current actor with a pure helper (`actorForPlanStatus`). Gate action buttons by `currentRole === actor`; show «Сейчас действует: X» otherwise. Initialise the status **mid-flow** (e.g. «На согл. с КД») so the default role immediately sees actionable buttons and the chain is visible without setup.

### Verify Behind a Random/2FA Login by Seeding sessionStorage
- Promo's mock login has a 30 % random success rate + a 2FA step — painful to automate. The shared `AuthProvider` reads `sessionStorage.getItem("auth") === "true"`, so for a browser smoke test just `sessionStorage.setItem('auth','true')` then navigate to the protected route. (A stale Playwright `mcp-chrome-*` profile can lock the browser; kill those chrome PIDs by `--user-data-dir` match to recover.)

---

## 2026-06-09 — Texnomart Promo S2 (Полный промо-календарь, Phase 1)

### Radix `asChild` Trigger + Shared `<Button>` = Ref Not Attached → Popover Renders Off-Screen
- The shared `@texnomart/ui` `Button` is a plain function component (no `forwardRef`). Under a Radix `asChild` trigger (`PopoverTrigger`/`DropdownMenuTrigger`/`TooltipTrigger`), Radix clones the child and passes a ref — which silently fails (the "Function components cannot be given refs" console warning). For `DropdownMenu` it usually still works, but for **`Popover` the missing trigger ref means Radix can't measure the anchor, so the content portals to the origin / off-screen** (looks "open" in the DOM but `getBoundingClientRect()` is outside the viewport).
- **Fix without editing the DO-NOT-EDIT `@texnomart/ui/button`**: render a native `<button>` styled with `buttonVariants({ variant, size })` (exported from `button.tsx`) + `cn` under `asChild`. A DOM element forwards refs, so the popover anchors correctly and the warning disappears. The pre-existing warnings elsewhere (PageHeader export dropdown, login screen) are the same root cause — tolerated only because DropdownMenu degrades gracefully.

### shadcn `ToggleGroupItem` Has a Base `flex-1 min-w-0` That Squeezes Items
- `ToggleGroupItem` carries `min-w-0 flex-1 shrink-0` in its base class, so every item is forced to equal width regardless of content. Labels with `white-space: nowrap` then overflow their squeezed box and visually overlap the next item (looked like broken/stacked tabs). Override with `flex-none whitespace-nowrap` to size each chip to its content.
- Bigger lesson: a connected segmented `ToggleGroup` also reads as passive labels, not a selector. For a **column-visibility / multi-select** control, a dropdown button («Колонки N из 5») opening a **checkbox popover** is clearer to non-technical users and matches the FilterBar dropdown style already on the screen. Checkboxes universally signal "select multiple".

### Taming a 38-Column Grid (Appendix C) — Data-Driven Columns + Group Band + Visibility Chooser
- Keep a single column dictionary (`gridFields.ts`: `{ id, label, width, group, source, kind, required, giftOnly }`) so headers (label, lock icon from `source`, required `*`) stay consistent and the visibility chooser can show/hide whole groups. Render cell VALUES via a heterogeneous accessor `switch (col.id)` in the grid (installments computed via helpers) — the config owns metadata, the grid owns rendering.
- Campaign-level identity/calendar fields (признак, тип, название, период) belong in a **per-campaign group band** spanning the scroll pane, not repeated on every line — the frozen pane then only needs the 3 spec-frozen columns (№ промо / ФИО КМ / Номенклатура). Default the wide groups (Идентификация, Рассрочка) OFF so the initial grid width stays manageable.
- Gift-only columns (32–33) render in the union grid for all rows but show «—» when the line's campaign isn't a gift type — same union approach as S1's per-КМ status columns.

---

## 2026-06-10 — Texnomart Promo S2 (Полный промо-календарь, Phase 2 — inline editing)

### Make a Read-Only Grid Editable = Lift Rows Into a Page-Level Store, Don't Edit-in-Cell
- Phase 1 read each campaign's lines straight from the `PROMO_LINES` module constant inside the grid. To make editing reactive (a cell edit must re-derive the installment columns, the per-line validity, the action-bar invalid-count, and the submit-gate), the lines have to live in React state **above** the grid. A `useReducer` over a `Map<lineId, PromoLine>` seeded from the constant works well: `edit` merges a patch, `bulkAdv` sets one field across many ids; both return a **new** Map so memo deps fire. Pass the grid a `linesFor(campaignId)` accessor (a `useCallback` over the map) instead of having it import the data — one source of truth, edits flow everywhere.
- Cell-local `useState` per editable cell would scatter the data and leave the action bar unable to see edits. Keep cell components stateless except for the transient edit-buffer (`draft` string while an input is focused); commit bubbles up via `onEdit(id, patch)`.

### Inline Editing in a Pattern-F Split Pane: Fixed Row Height Is the Invariant
- The two synced panes only stay row-aligned because both use a fixed `ROW_H` (`h-14`). An inline `<input>` must NOT change row height — size it `h-7` inside the existing `items-center` cell so it sits centered without growing the row. Verified by editing a cell and confirming the frozen pane didn't drift.
- One `EditableCell` handles number/money/percent/text: show formatted value (read mode) ↔ raw value in an input (edit mode); commit on blur/Enter, cancel on Esc. Parse numbers by stripping non-digits so a user can type «7 640 000» or «7640000». For a required+empty cell, show the red «не заполнено» marker in BOTH read-only and click-to-edit states (the marker doubles as the affordance).

### Editability Is Per-(Column-Source × Role), Computed — Not a Static Flag
- Reuse the `gridFields` `source` to decide editability: `source === 'km'` → editable by `canEditOwnLines` roles; the single `advSelectedMarketing` column → editable only by `marketingFlagOnly` (Сотрудник маркетинга); everything `auto`/`1c`/`calc` stays locked for everyone. This keeps the lock icon (driven by `source`) and the edit affordance consistent automatically.
- Fallout: columns that LOOK like KM-entry but are actually derived in render (the «платёж (старая)» installment columns compute from old retail price via `installmentTerm`, ignoring any stored value) must be re-tagged `source:'calc'`, or they'd render an edit affordance that silently does nothing. Tag by how the cell is actually produced, not by the spec's field category.

### остаток Needs BOTH Inline Edit AND a Read-Only Breakdown — Split the Affordances
- Spec §8.2.2 wants остаток editable by КМ (→ `stockManual` + ✏️, autoupdate stopped) AND clickable to see the per-warehouse breakdown. Putting both on the same target is ambiguous. Resolution: the value is the click-to-edit input; a **separate small icon button** beside it opens the breakdown Popover. (Popover trigger = native `<button>` + `buttonVariants`, per the Phase 1 ref lesson — confirmed no new "Function components cannot be given refs" warning, unlike the pre-existing login-screen DropdownMenu one.)

### Bulk-Select = Leading Checkbox Column + Contextual Strip; Label Switches by Role
- A leading select column in the frozen pane (row checkbox + a per-campaign group checkbox with `indeterminate` when partially selected) plus a strip that appears only when `selectedIds.size > 0`. The bulk action targets a different field per role — `advRecommendedKm` for КМ, `advSelectedMarketing` for Маркетинг — so derive both the dispatched field and the strip label from `access` rather than hardcoding. Clear the selection on role change (`useEffect` on `currentRole`) since gating differs.

---

## 2026-06-10 — Texnomart Promo S2 (Полный промо-календарь, Phase 3 — nomenclature entry + duplicate check)

### A Controlled Radix Dialog Opened From an Outside Click Dismisses Itself — Defer the Open
- A `<Dialog open={state}>` toggled by `setState(true)` in a plain button's `onClick` (NOT a `DialogTrigger`) **mounts and then immediately closes** when opened by a pointer click — the same interaction that opened it is caught by Radix's DismissableLayer as an interact/focus-outside (there's no trigger element for Radix to exclude). Diagnosed decisively: opening the SAME dialog via keyboard (`focus()` the button + Enter) **stays open**, pointer-click closes it — so it's pointer/focus-specific, not a render error. (A red herring alongside it: the benign pre-existing "Function components cannot be given refs" warning on the shared `DialogOverlay`, which fires for ANY shared Dialog open and is not the cause.)
- **Fix**: defer the state set past the current event — `setTimeout(() => setOpen(campaignId), 0)`. The click fully settles before the dialog mounts, so DismissableLayer never sees the opening interaction. Cleaner than `stopPropagation` (Radix listens on `document` in capture, so a React-synthetic stop won't reach it). Use a `DialogTrigger` instead whenever the trigger is co-located with the dialog; defer only when the opener is a separate, deep-in-the-tree element (here: a "+ Добавить номенклатуру" button inside the grid band, dialog hosted at page level).

### Nomenclature Entry = Reuse the 1С Reference + a Command Picker; No Free-Text, One Component for Line AND Gift
- Spec §8.2.1 forbids free-text — a line/gift can only be a real 1С reference item. A `@texnomart/ui/command` list (grouped by category, `value` = `name + 1С code` so search matches either) inside a Dialog gives exactly that. The Command lives INSIDE a Dialog (not an `asChild` Popover trigger), so the Phase-1 "shared `<Button>` can't take a ref under Radix `asChild`" pitfall doesn't apply here.
- The same picker serves both adding a promo line and (re)selecting gift nomenclature — parameterize by `title`/`description`/`onPick` and host two instances at page level, keyed by `addCampaignId` / `giftLineId` state. Picking a gift also auto-fills `giftStock` from the 1С item, mirroring how a new line seeds остаток.

### Duplicate Check = Detect Against the LIVE Store, Confirm (Never Block), Mark + Historize
- Detection must run over the current page-level line store (`[...lines.values()]`), not the `PROMO_LINES` constant — otherwise lines added this session are invisible to the check. Two cases (§8.2.1): same nomenclature already in THIS promo, or in another **non-cancelled** promo with an **overlapping period** (`a.start <= b.end && b.start <= a.end`); return `{promoId, promoName, overlap, samePromo}`.
- Adding is never blocked: on a hit, stash a `pendingDup` and open a confirm Dialog «…Добавить дубль?»; on confirm, create the line with `duplicate:true` + `duplicateInfo` (feeds the existing «дубль» marker's tooltip) + a `history` entry `{what, promoId, overlap, user, at}`. New lines seed `salesForecast: undefined` so the required-red marker shows and the action-bar invalid-count ticks up immediately — proving the add flowed through validation. Note: with seed data no two campaigns' periods overlap, so the cross-promo-overlap branch isn't reachable from the seed UI (same-promo path is; the overlap branch is plain date math).

---

## 2026-06-10 — Texnomart Promo S2 (Полный промо-календарь, Phase 4 — Excel import + 1С states)

### Mock "Excel" Import = Client-Side CSV, Pure Validation, Preview-Then-Commit
- No xlsx parser is in the deps and adding one isn't worth it for a mock. Semicolon-delimited **CSV** (Excel-RU's native delimiter) parses with a one-liner `split(/\r?\n/)` + `split(';')` — zero deps, and the per-row validation UX (the part the spec actually cares about) is identical to a real .xlsx flow. The button keeps its «Загрузить из Excel» label; the template download writes a `.csv` with a UTF-8 BOM (`﻿`) so Excel opens the Cyrillic correctly.
- Keep parsing+validation a **pure** function in mock-data (`parseImportCsv(text, campaign, liveLines, campaignsById) → {rows, structureError}`), so the dialog just renders the preview reactively (`useMemo` over text+campaign). Validate in priority order: header structure → per-row column count → «нет в 1С» (code ∉ NOMENCLATURE) → «не заполнены обязательные поля» (forecast) → duplicate (non-blocking warning, reuse `detectDuplicate`). Importable = rows whose status ≠ `error` (duplicates DO import, with the marker). Validate against the **live store** (`[...lines.values()]`), not the seed constant, or session-added lines are invisible to the dup check — same rule as Phase 3.
- A «Вставить пример» button that injects `buildImportSampleCsv()` (a deliberately mixed valid/«нет в 1С»/missing-forecast set) makes the whole flow testable in the browser without a real file picker — much easier to smoke-test than `<input type=file>`.

### 1С Availability = a Field on the Line, a Derived Banner, and a Submit Gate — No Global Flag
- Don't model "1С unavailable" as a separate app-level boolean. Reuse the per-line `pending1CCheck` flag (§8.3): imported lines are created with `pending1CCheck:true`, the seed already has one, and a `pending1CCount` memo over the visible lines **derives** the non-blocking `<Alert variant="warning">` banner and the submit gate (`canSubmit = canEdit && invalidLines===0 && pending1CCount===0`). The "re-check" is a `recheck1C` reducer action that clears the flag on every pending row (mock pass). This keeps one source of truth and means the grid's existing per-line «Ожидает проверки 1С» Clock marker, the banner, and the gate all move together for free.
- Gate the banner's «Повторить проверку 1С» action and the «Загрузить из Excel» button on `access.canEditOwnLines` — a read-only role (КД) still SEES the banner (informational) but gets neither button. The action-bar summary needs a three-way state now: invalid > pending-1С > all-clear, and the disabled-submit tooltip computes its reason in the same priority (compute the reason string in the parent and pass it in, rather than branching inside the button).

### The Phase-3 Radix Deferral Applies to Every Page-Hosted Dialog
- The «Загрузить из Excel» dialog is opened by a PageHeader button (not a `DialogTrigger`), so it hits the same "controlled dialog opened by an outside pointer click self-dismisses" race — `setTimeout(() => setImportOpen(true), 0)` again. Any new page-level dialog opened from a toolbar/grid button needs this defer; the only exception is a dialog opened from inside another dialog's `onSelect` (the dup-confirm in Phase 3), where no fresh outside-pointer interaction is in flight.

---

## 2026-06-10 — Texnomart Promo S2 (Полный промо-календарь, Phase 5 — unplanned creation + mobile per-line Sheet)

### To Render a Newly-Created Row Group, the GROUP Collection Must Be State Too — Not Just the Rows
- Phases 1–4 lifted only the *lines* into state; the *campaigns* were still read from the `getCampaignsWithLines()` module constant. A created/integrated campaign therefore never appeared no matter how many lines you added to it. Fix: add a `visibleCampaigns` state slice (seeded from the same constant) and derive `filtered`/`campaignsById`/duplicate-detection from `CAMPAIGNS ∪ visibleCampaigns`. The rule generalizes: when "add a new top-level entity" is in scope, the entity COLLECTION has to be stateful, not only its children — otherwise the child store has nowhere to hang the new parent.
- Keep the seed path byte-identical (same initializer) so the prior phases' behavior is provably unchanged; only the *new* prepend path is new code. The grid's group memo also had to stop filtering out zero-line groups (`.filter(g => g.lines.length > 0)`) — a freshly created campaign is legitimately empty until the КМ adds nomenclature, so render the band + an empty-hint row in BOTH Pattern-F panes (same ROW_H) to keep them aligned.

### A Sheet Is a Radix Dialog — the Page-Hosted-Dialog Defer Applies to Sheets Too
- `@texnomart/ui/sheet` wraps `@radix-ui/react-dialog`, so a controlled `<Sheet open>` opened from a grid/toolbar button self-dismisses on the opening pointer click exactly like the Phase-3/4 dialogs. Every new opener in Phase 5 (create-campaign, edit-campaign, mobile line-tap) uses the same `setTimeout(() => setX(...), 0)` defer. Treat "opened by an outside pointer click" — not "is a Dialog" — as the trigger for the deferral.

### Reuse the Cell Editor in a Stacked Mobile Form Instead of Re-implementing Inputs
- The mobile «редактировать строку» Sheet renders the line's editable fields stacked by group, but it reuses the SAME `EditableCell` (click-to-edit, commit on blur/Enter) the grid uses — so a forecast typed in the Sheet flows through the identical `onEdit(id, patch)` → page store → validation path, and the action-bar invalid-count updates with zero extra wiring. Verified by editing the forecast in the Sheet and watching the footer count drop. Don't fork a second input implementation for mobile; wrap the shared one in a full-width container.

### "Editable Until First Send" = a Per-Entity Flag Flipped on Submit, Surfaced as a Conditional Affordance
- Spec §10 «тип editable only until first send» is modeled as `firstSendDone` on the campaign, flipped true inside the submit handler for every unplanned campaign. The concrete UI manifestation is a band-level «Изменить» button gated on `!planned && !firstSendDone && canEditOwnLines` that reopens the create dialog in edit mode (prefilled, no mode tabs). Because submit is a mock (no persistence) the flag is in-memory only — but the rule is still visible/testable. The deadline guard (≥3 кал. дн. before start) is enforced only for NEW campaigns (`validateUnplannedInput(..., ref)` with `ref = epoch` in edit mode) since an existing campaign may already start sooner.

### `<input type="date">` Is the Pragmatic Date Picker for a Mock — Convert via Local-TZ Helpers
- No date-picker component is in the kit and date-fns alone doesn't give a calendar UI; a native `<input type="date">` (value `yyyy-mm-dd`, with a `min` attribute mirroring the validator) is zero-dep, accessible, and locale-aware. Convert with explicit local-tz helpers (`new Date(\`${s}T00:00:00\`)` and a `getFullYear/Month/Date` formatter) — NOT `toISOString().slice(0,10)`, which shifts the day across the UTC boundary for non-UTC users.

---

## 2026-06-10 — Texnomart Promo: Layout polish (full-bleed, header height, padding, Pattern F)

### Per-Route Full-Bleed Without Touching the Shared AppShell — Drive `maxWidth` From the Thin Wrapper
- The shared `AppShell` centers content in a `mx-auto h-full` wrapper with a `maxWidth` prop (default `1400px`). To make ONE route full-width (the dense full-calendar grid) without affecting other pages or other apps, compute `maxWidth` in the project's thin `AppShell` wrapper via `useLocation()`: `pathname.startsWith("/full-calendar") ? "100%" : "1400px"`. `maxWidth:100%` + `mx-auto` → zero auto-margins → true full-bleed, and a page's existing `-mx-3 md:-mx-4` action-bar negative margins then break out of `<main>`'s padding to the full width. No shared-component change needed.

### A Fixed-Height Header (`h-14`) Clips a Tall Title — Use `min-h-14`
- `@texnomart/shared` `PageHeader` had `sm:h-14` (56px) with `items-center`. A 32px title + subtitle + `pt-3 pb-6` needs ~64–100px, so the content overflowed the fixed 56px box and, being centered, spilled ABOVE the container where the scroll-area top edge clipped it (h1 top measured 10px above the header's own top). Fix: `sm:h-14` → **`sm:min-h-14`** (grows to fit; pages with shorter content still render at 56px, so it's backward-compatible). Rule: never put a fixed `h-*` on a container whose text content can exceed it — use `min-h-*`.

### A Scroll Container's `padding-bottom` Is Swallowed When an `h-full` Child Overflows It
- `<main overflow-auto p-4>` → `<div mx-auto h-full>` → page. For a tall block-flow page, the `h-full` wrapper is fixed at main's height and the page content overflows IT (not main), so main's `padding-bottom` sits at the wrapper's edge mid-scroll, not after the content — the last card ends flush against the viewport (measured gap 0). The `h-full` wrapper can't be dropped (app-like pages with internal fixed footers need a definite-height ancestor). Fix: add bottom padding to the *page content* itself (`pb-6`), which flows past the wrapper and IS respected (gap → 24px). Apply the same value to every block-flow page for consistency; app-like pages (own fixed footer) don't need it.

### Pattern F: `min-h` Does NOT Keep the Two Panes Aligned — the Row Height Must Be FIXED
- Reiterating the S1 Pattern-F lesson with a concrete regression: `ShortCalendarTable` used `min-h-[72px]` on rows. The frozen pane (single-line truncated columns) stayed at 72px, but the scrolling pane's rows GREW past 72px when content wrapped (3–4 category chips, long КМ-name lists) — the two independent panes then desynced row-for-row. `min-h` lets each pane size independently; only a FIXED `h-[72px]` on both panes guarantees alignment. Pair it with clamping so nothing overflows the fixed height: cap wrapping chip lists at N + «+N» (full list on `title`), `line-clamp-2` long text, and `overflow-hidden` as a safety net. Verified: all rows exactly 72px in both panes, 0px top-delta.

### Extend a Shared Layout Component With an Optional `className`, Not a Fork
- Needed the FilterBar's gray box + `px-3` gone on one screen (so filters align flush with the header/grid). Rather than fork it, added an optional `className?: string` to `@texnomart/shared` FilterBar merged via `cn(base, className)` — the screen passes `bg-transparent px-0`. Default (no className) is byte-identical, so Dashboard's usages are unchanged. Same additive pattern as the AppShell `roleSwitcher`/`maxWidth` props: extend shared components with optional overrides, never breaking existing consumers.

---

## 2026-06-10 — Texnomart Promo S3 (Согласование и проверка, Phases 1–2)

### State Shared Across Sibling Routes = a Provider on a Layout Route, Not Page-Level `useState`
- S1/S2 each lived on ONE route, so their reducer store sat in the page component. S3 spans `/approvals` (queue) AND `/approvals/:id` (detail), and an action on the detail must reflect back in the queue — so the store has to live ABOVE both. Mount an `ApprovalsProvider` on a **layout route** (`{ path: "approvals", Component: ApprovalsLayout, children: [index, ":id"] }` where `ApprovalsLayout` renders `<ApprovalsProvider><Outlet/></ApprovalsProvider>`). Navigating *between* the two routes keeps the layout (and its `useReducer` state) mounted; navigating away and back remounts → reseeds (acceptable mock behavior). Verified: rejecting an item on the detail dropped the queue 4→3 after in-app back-navigation.
- Caveat (left as a known mock limit): the sidebar nav **badge** is built in the AppShell, which sits ABOVE the provider — so a badge fed by the same data must use a fresh seed (`buildReviewItems()`), and it therefore shows the *baseline* count, not in-session mutations. Fixing it would mean hoisting the provider above the whole shell; not worth it for a mock. Rule: a count rendered above the store can't reflect the store — decide whether baseline-vs-live matters before wiring it.

### A Working-Days (Пн–Пт) SLA Model, Seeded Relative to "now" So Timers Are Live
- The spec's review SLA is **рабочие дни** (vs the calendar-day fill deadlines). Model it with `isWeekend` + `addWorkingDays(d, ±n)` (step day-by-day, skip Sat/Sun; handle negative for "n working days ago") + `workingDaysBetween(from,to)` over the half-open interval; `reviewSla(submittedAt) → {deadline, remaining, overdue}`. Always label «раб. дн.» / «рабочие дни (Пн–Пт)» so it's not confused with the календарные deadlines.
- Seed `submittedAt` as `addWorkingDays(now, -offset)` (NOT a fixed past date) so that at today's date the queue always shows an in-time item, a breached-Старший-КМ item, and an overdue-КД item — the SLA/overdue paths stay visible without time travel. Same live-`new Date()` approach as the seeded overdue short-calendar campaign. (`new Date()` is fine in app code — the no-`Date.now()` rule is only for Workflow scripts.)

### A Review Item Is per (Promo + КМ); Reject Returns the WHOLE Set; Feedback Overrides the Seed Flag
- Statuses are per (Promo + КМ) (§4.5), so the review "item" key is `${campaignId}~${kmId}` and the queue is built by walking each campaign's `participatingKmIds`, keeping only KM-statuses that map to a reviewer (`reviewerForKmStatus`). КД also picks up items auto-escalated to it.
- Rejecting ANY line returns the WHOLE КМ set to «Не заполнено / Ожидание корректировки от КМ» (§4.5.2) — one reducer action marks the targeted lines, appends a timestamped `ReviewComment` (scoped to lineIds, or general when empty), AND flips the item status. The item then leaves every reviewer queue (its status no longer maps to a reviewer).
- Store reviewer decisions as `ReviewItem.lineFeedback[lineId]` rather than mutating `PROMO_LINES`; the lines panel displays "rejected" as `feedback[id]?.rejected ?? line.rejected` (reviewer decision wins over the seed flag) and prefers the feedback comment. Keeps S3 self-contained and reload-resettable.
- Make sure every pending review item actually HAS lines — the S1/S2 seed had КМ marked «На согласовании» with no lines in `LINE_SEED`, so the snapshot was empty. Added line seeds so each pending (campaign, КМ) pair has nomenclature (one deliberately missing a forecast to exercise the red required marker in the reviewer's snapshot).

### The Page-Hosted-Dialog Defer Applies to `ReasonDialog` Too
- The reject `ReasonDialog` is a controlled `<Dialog open>` opened by a button click (per-line «Отклонить» X / bulk / whole-set) — same self-dismiss race as the S2 Phase 3/4/5 dialogs. Open it via `setTimeout(() => setRejectTarget(target), 0)`. Confirmed the dialog stays open. (The benign shared-`DialogOverlay` "Function components cannot be given refs" warning still fires on any shared Dialog open — not the cause, ignore it.)

---

## 2026-06-11 — Texnomart Promo S3 (Согласование и проверка, Phase 3 — «Не участвует» + auto-escalation)

### Derive Auto-Escalation From the SLA, Don't Store It — But Route THROUGH the Derived Reviewer Everywhere
- The 2-working-day auto-escalation (Старший КМ → КД on breach) is best **derived** from `reviewSla(submittedAt).overdue > 0`, not tracked as a flag that some background job flips — there's no scheduler in a mock, and a live derivation means the seeded "breached" items escalate automatically at today's date without time travel. `isAutoEscalated(item)` ORs the derivation with the seed flag (so an explicitly-seeded escalation still works).
- The catch: once escalation is derived, EVERY place that asks "who acts on this?" must go through one `effectiveReviewer(item)` helper, not `reviewerForKmStatus(item.kmStatus)` directly. The item's stored `kmStatus` is still «На согл. у старшего КМ», so the raw status-based reviewer would wrongly keep it in the Старший-КМ queue. `reviewQueueFor`, the detail's `canAct`, and the «Авто-передано» tag all derive from `effectiveReviewer`/`isAutoEscalated` — fix it in one helper and the queue, the КД pickup, and the badge move together.

### Model a Sub-Lifecycle by Reusing the Existing Review Statuses + a `kind` Discriminator — Diverge Only at the Terminal
- «Не участвует» has its own КМ→Старший КМ→КД approval flow, but adding parallel statuses for it would double the `KmStatus` enum and every switch over it. Instead a `ReviewItem.kind: "data" | "non-participation"` rides the SAME in-flight statuses («На согл. у старшего КМ» → «…ожидает КД»); only the КД-approval **terminal** differs — `approvedKmStatusFor(actor, kind)` returns «Не участвует» for a non-participation request vs «Принято КД» for data. Routing, SLA, queue, and escalation code stay identical; only the terminal status + the panel copy branch on `kind`. Rejecting a non-participation request flips `kind` back to `"data"` (the КМ must now fill nomenclature), so the same item cleanly re-enters the data flow.

### A КМ-Initiated Action Lives Where the КМ Already Is — Even in a "Reviewer" Workspace; Create-or-Update by Composite Key
- The approvals workspace is reviewer-facing, but the КМ must raise «Не участвует» somewhere — putting a «Мои участия» panel on the same `/approvals` route (shown when `currentRole` is the КМ) keeps S3 self-contained rather than reaching back into the S2 calendar. The КМ may raise it on a participation that has NO pending review item yet (e.g. status «Не заполнено»), so the reducer action keys off `(campaignId, kmId)` and **creates the item if absent, updates it if present** — don't assume the store already has a row for every (campaign, КМ) pair the user can act on.

### Extend the Stub Drawer Additively for Cross-Phase Reuse
- `VersionHistoryDrawer` is an S4 stub, but S3 needed to surface review comments + the просрочка note in it now. Added optional `reviewComments?: ReviewComment[]` + `overdueDays?: number` props rendered above the (still-stub) version list — same additive pattern as the shared AppShell/FilterBar props. S4 can flesh out the version list later without touching the S3 wiring. Mobile sticky → use a `fixed bottom-0 lg:hidden` bar (not `sticky`, which floats on short detail pages — see the S2 Phase-5 / detail-page lessons); pair it with `pb-24` on the page root so content clears the bar.

---

## 2026-06-11 — Texnomart Promo S4 (Управление изменениями, Phase 1 — versioning, diff, «Создать корректировку»)

### Refactor a Shared-by-Two-Routes Stub Into a Richer Component by Keeping Every New Prop Optional + a Stub Fallback
- `VersionHistoryDrawer` is consumed by BOTH the S4 full calendar (rich: `versions`, `currentReport`, `onCreateCorrection`) and the S3 approvals detail (thin: only `reviewComments`/`overdueDays`, no campaign). Turning the single stub list into a 3-tab drawer (Только изменения / Полный актуальный отчёт / История версий) stayed backward-compatible because **every new prop is optional and `versions` falls back to an internal `STUB_VERSIONS`** — the approvals usage rendered unchanged (default «История версий» tab, stub list, no «Создать корректировку» since `onCreateCorrection` is absent). Verified BOTH consumers in the browser, not just the new one. Same rule as the AppShell/FilterBar additive props: a component shared across phases/routes is extended by optional props + sane defaults, never by a required-prop change.
- The local `VersionEntry`/`ChangeType` types the stub had defined were only used inside the file (the approvals page imports the component, not the types), so it was safe to replace them with the canonical `CampaignVersion`/`VersionChangeType` now living in `promo-mock-data.ts`. Grep for type importers before moving a type out of a component.

### Seed Demo-Critical Data on a Campaign the UI Can Actually Reach
- The richest version seed (PR-2026-003: a full Первичная→Добавление→Корректировка→«Отправка отчёта» chain) was **invisible** because the full-calendar grid lists only `getCampaignsWithLines()` and PR-2026-003 has no `PROMO_LINES`. The reachable prominent campaign is PR-2026-001 (5 lines), so the multi-version + diff seed has to live THERE to be demoable. Rule: when a seed exists to demonstrate a UI path, put it on an entity the screen's own filter/derivation will surface — otherwise the seed is dead. (Left PR-2026-003's seed in place for when reports/S5 make it reachable, but the demo seed is on PR-2026-001.)

### Decide Live-vs-Seed Per View — the Snapshot Is Live, the Version Log Is Seed-Stale
- «Полный актуальный отчёт» derives from the **live page-level line store** (`buildCampaignReport(linesFor(id))`), so it reflects in-session edits immediately — a pure function over the current lines, no caching. But the version ENTRIES (`getCampaignVersions`) are seed-stale: editing a cell does NOT append a new version yet (that's Phase 2's edit-after-approval tracking). Surfacing this split explicitly in the model keeps Phase 1 honest — the snapshot is truthful, the history is illustrative. Don't conflate "the data the view reads" with "the data the view mutates"; a read-only derived view can be live while the audit trail behind it is still mocked.

### A Page-Hosted Drawer Opened From a Grid-Band Button Is Still the Radix-Sheet Defer Case
- The new per-campaign «История» button lives deep in the full-calendar grid band and opens a page-level `<Sheet>` (= Radix Dialog) — exactly the "controlled layer opened by an outside pointer click self-dismisses" race from S2 Ph3–5 / S3. Reused the `setTimeout(() => setHistoryCampaignId(id), 0)` defer; confirmed the drawer stays open. The benign shared-`SheetOverlay` "Function components cannot be given refs" warning fires on open (same root as the `DialogOverlay` one) — not the cause, ignore.

---

## 2026-06-11 — Texnomart Promo S4 (Управление изменениями, Phase 2 — edit-after-approval + re-approval + incremental send)

### Track Edits as a Live Diff Against a Frozen Baseline, Not as Mutation Flags
- "What changed after approval" is computed by diffing the live line store against a **baseline** (the last sent version), NOT by setting a `changedByEdit` flag on each edited cell. A baseline diff handles revert-to-original for free (edit a price then type the old value back → no change shows), survives multi-field edits, and yields the exact `from → to` pairs the drawer's «Только изменения» needs — all from one pure `diffCampaignChanges(campaign, currentLines, baselineLines, baselinePeriod)`. The page keeps `baseline` as **state** (a `Map<lineId, PromoLine>`), not a frozen ref, precisely so КД «send» can **re-baseline** (copy current → baseline) and the draft/badge/highlight all clear with no per-field cleanup.
- The diff drives everything downstream: the grid's amber changed-cell ring (`changedCells: Set<\`${lineId}:${field}\`>`), the band's «N изм. после согл.» badge, the drawer's draft section, AND the re-approval routing — one source of truth, recomputed via `useCallback`/`useMemo`, so a single edit lights up every surface at once.

### Re-approval Routing Is Derived From the Diff's Shape, Not a Separate Status
- §11.8 «changes EXCEPT adding new products require Маркетинг re-approval» maps cleanly onto the diff: `hasValueChange` (an existing line/period changed) → «Ожидает повторного согласования маркетинга»; `hasAddition` only → skip straight to «ready». So `reapprovalStateFor(id)` is `"none" | "awaiting-marketing" | "ready"` derived from `changeSetFor(id)` + a `marketingReapproved: Set<campaignId>`, never a stored enum. КД «send» is gated `disabled={state === "awaiting-marketing"}`. Deriving it means adding a new line and editing a price compose correctly (a campaign with both still needs marketing, because `hasValueChange` is true).

### Lift Versions Into State the Moment They Become Mutable (the Phase-1 "decide live-vs-seed" rule, paid off)
- Phase 1 read versions from the `getCampaignVersions` seed; Phase 2 needs КД «send» to **append** a new version. So versions moved into a `liveVersions: Map<campaignId, CampaignVersion[]>` page state with `versionsFor(id) = liveVersions.get(id) ?? getCampaignVersions(id)` — the seed is the fallback until the first live correction, then the live list wins. `buildSentVersion` stamps it with `new Date()` (fine in app code; the no-`Date.now()` rule is only for Workflow scripts) and `version = (prev[0]?.version ?? 0) + 1`. The drawer reads `versions` as a prop, so it shows the new entry instantly with zero drawer changes.

### Switch Roles via the In-App Switcher to Preserve In-Memory State Across a Multi-Role Flow
- The edit-after-approval loop spans THREE roles (КМ edits → Маркетинг re-approves → КД sends). The store (line edits, baseline, `marketingReapproved`) lives in `FullCalendarPage`'s state, and `RoleContext` sits ABOVE the router — so changing role via the **avatar dropdown** re-renders without remounting the route, keeping all in-session edits. Re-seeding the role via `sessionStorage` + reload would reset the store and break the flow. Smoke-testing a multi-role workflow therefore means driving the in-app switcher, not navigating/reloading. (Verified the full chain end-to-end this way: КМ edit → «Ожидает маркетинга» → Маркетинг «Согласовать» → «Готово к отправке» → КД «Согласовать и отправить» → live в.5 appended, draft cleared.)

### A `<input type="date">` Edit Must Be Fed Through the React onChange Path When Driven by a Test
- The native date input in `PeriodEditDialog` is controlled; Playwright's `.fill()` triggers the input event React listens to, so the value flows to `onApply` correctly. (Setting `.value` via raw `evaluate` would NOT fire React's synthetic onChange — use the real Playwright fill, or dispatch a native `input` event, when driving controlled inputs in a smoke test.) Period change is then just another tracked change: comparing `campaign.startDate/endDate` to `baselinePeriods` inside `diffCampaignChanges`, so the period ✏️/bold + «Ожидает маркетинга» reuse the exact same machinery as a cell edit.

---

## 2026-06-11 — Texnomart Promo S4 (Управление изменениями, Phase 3 — cancellation of campaign/line + «Скрыть отменённое» + deadline change)

### Cancellation Is a Separate State on Both the Entity AND Each Line — and the Hide Filter Must Drop Both
- Campaign cancellation (§5.3) is a separate `cancelled` flag + `status:"Отменена"`, NOT a value inside «Признак акции» (which stays план/внеплан). Line exclusion is a SEPARATE pair of flags (`removalPending` → `removed`) deliberately kept distinct from the S3 reviewer `rejected` flag — they have different lifecycles (КМ-requests-КД-approves vs reviewer-rejects-line), different markers, and a removed line must drop out of validation/the submit-gate while a rejected line still counts. The «Скрыть отменённое» switch (ON by default) hides BOTH layers: filter cancelled *campaigns* out of `filtered`, AND filter `removed` *lines* out of a `displayLinesFor` accessor passed to the grid (keep the full `linesFor` for the version report so excluded positions stay in history with a strike). One switch, two filter points — easy to wire only one and wonder why excluded lines still show.
- Counts (`invalidLines`, `pending1CCount`, header `totalLines`) must skip `removed` lines regardless of the hide switch — an excluded position is out of the promo and shouldn't gate the send or inflate the row count. Tag the skip in the count memos, not just the display filter.

### A Two-Step Mock Approval (КМ request → КД approve) = `pending` Flag + Role-Gated Inline Actions, Versioned on Approval
- Line exclusion routes through `removalPending` (КМ sets it with a required reason via `ReasonDialog`) → КД sees inline confirm/reject actions on the pending row → approve sets `removed:true` and appends a live «Корректировка» version (`buildLineRemovalVersion`, "departments notified incrementally"); reject clears the flag. The per-line controls live as a hover-revealed Ban button in the **frozen pane** (mirrors the existing mobile chevron's trailing `ml-auto` slot) for КМ, and always-visible Check/X for КД while pending — gate each by a prop the page provides only for the right role (`onRequestRemoval` for КМ via `canRequestLineRemoval`, `onApproveRemoval`/`onRejectRemoval` for КД via `canApproveLineRemoval`). Same actions duplicated in the mobile `LineEditSheet` as a «Участие в акции» section for parity.
- Deadline change (§4.7) is the same shape one level up: КД «Изменить дедлайн» writes a `deadlineChange` request (`pending`, with old→new + reason + initiator) that does NOT move `effectiveFillDeadline` until **Операционный директор** «Утвердить дедлайн» flips it to `approved` and sets `fillDeadlineOverride`. Model "effective vs requested" explicitly (`effectiveFillDeadline = fillDeadlineOverride ?? getFillDeadline`) so a pending request is visible (amber band chip «old → new · на утверждении») without yet taking effect — the approval is the only thing that mutates the effective value.

### Smoke-Testing a Multi-Role Approval Means Driving the In-App Switcher, Never Reloading (reconfirmed for КД→ОД)
- The deadline/cancellation state lives in `FullCalendarPage`'s `visibleCampaigns`/line-store state; `RoleContext` sits ABOVE the router, so switching role via the avatar dropdown re-renders without remounting the route — the pending `deadlineChange` survives the КД→Операционный директор hop so ОД can approve it. Reloading (or seeding the role via `sessionStorage`) would reset the page state and lose the request. Confirmed end-to-end: КД request «дедлайн 24.11 → 01.05 · на утверждении» → switch to ОД (state intact) → «Утвердить дедлайн» appears → approve → emerald «дедлайн: 01.05.2026». The avatar trigger keeps the SEEDED user's initials («СМ») regardless of active role (the avatar isn't role-derived), so target it by `aria-haspopup="menu"`, not by expecting the initials to change.

### Seed the Demo on Entities the Grid's Own Filter Will Surface (reconfirmed for cancellation)
- The cancelled seed campaign PR-2026-004 had NO lines, so `getCampaignsWithLines()` never surfaced it and the «Скрыть отменённое» switch had nothing to hide on load. Added 2 lines to PR-2026-004 (filter demo) + a `removalPending` line on the approved UN-2026-015 (КД-approval demo) — both now reachable. Same rule as the Phase-1 PR-2026-003 version seed: a seed that exists to demo a UI path must live on an entity the screen's derivation actually renders, or it's dead.

---

## 2026-06-11 — Texnomart Promo S5 (Отчёты для смежных подразделений + ознакомление)

### A Read-Only Versioned Report = Live Values + a Seed-Stale Change-Set + Acknowledge-Clears-Highlight
- The report's current cell VALUES derive live from the line store (per-department accessors over `PromoLine`), but the «изменённые/добавленные» highlight comes from a **seeded `ReportChangeSet`** (`{changedCells: \`${lineId}:${fieldId}\`[], addedLineIds}`) — same live-vs-seed split as S4's «снапшот живой, история seed-stale». Ознакомление (§11.4) is then pure local state: a cell/row is highlighted iff it's in the change-set AND the line isn't acknowledged (`ackAll` set keyed `${campaignId}:${department}` ∪ per-line `ackLines`). «Ознакомиться со всеми» / per-row «Ознакомлен» just add to those sets; the highlight clears without mutating data, and the change still shows in «История версий» — exactly the spec's «ознакомление ≠ согласование, статус не меняется» (§11.7). Keep ack state **keyed per (campaign + department)** — each department acknowledges its own report independently.
- For the overdue marker the report's «sent» date must be the **«Первичная отправка»** version date (the first send), NOT the newest version — an incremental correction sent later is a separate event and shouldn't retroactively mark the original send late. `getReportSentAt` finds the `changeType === "Первичная отправка"` entry; the 17-кал.-дн. deadline (`start − 17`) compares against THAT. (Seeded PR-2026-003 first-sent 22.09 vs deadline 14.09 → «+8 дн.»; UN-2026-015 first-sent 05.06 vs 08.06 → on-time, even though its в.2 correction is 12.06.)

### Per-Department Field Routing = One Field Dictionary With Accessors, Not Three Hand-Built Tables
- Appendix-C M/P/A subsets are a single `ReportField[]` per department (`{id, label, kind, group?, value:(line,campaign)=>string|boolean}`), where `id` doubles as the `${lineId}:${id}` change-cell key suffix and `group` drives the wide marketing table's group-header row (narrow Закуп/Аналитика reports just give every field a group too, or the group header shows a blank cell — give compensation fields an explicit «Компенсация» group so the header isn't empty). Installment columns reuse `installmentTerm`/`programMonthly` from mock-data rather than re-deriving. One `CellValue` renderer branches only on `kind === "check"` (and on `id === MARKETING_EDITABLE_FIELD` for the single editable field) — everything else is `String(value(...))`. Adding a department or moving a field is a list edit, not new table code.

### The Marketing-Only Editable Field Needs a Page-Level Override Store, Like the Full Calendar
- §7.2 makes «В рекламу (выбрано маркетингом)» the ONE field a recipient (Сотрудник маркетинга) can edit. Model it exactly like S2's line edits: a page-level `Map<lineId, boolean>` of OVERRIDES (not a full copy), `flagFor(id) = override.has(id) ? override.get(id) : line.advSelectedMarketing`, so the default reads from the seed and only toggled lines carry state. The «convenient bulk-select» is a leading select column (rendered only in `canEditMarketingFlag` mode, to avoid colliding with the per-row «Ознакомлен» acknowledge action) + a contextual strip. Gate the whole edit path on `access.canEditMarketingFlag && department === "marketing"` — КД/КМ/etc. viewing the marketing report see the checkbox read-only (a green check / grey dash), never an input.

### Department-Tab Gating: Tabs on sm+, Select on Mobile, Pill When There's Only One
- Appendix-D «Отчёты» gives «Просмотр всех» roles all three department tabs but single-department roles (Закуп → Закуп only, etc.) just one. Render the chooser three ways from `access.departments`: a Pattern-J underline `Tabs` (sm+) / a `Select` (mobile, `sm:hidden`) when there's >1, and a static pill when there's exactly 1 — so a Закуп user sees «Закуп» as a label, not a pointless single-tab strip. Keep the active `department` valid across role switches with a `useEffect` that resets it to `access.departments[0]` when it falls out of the set (the in-app role switcher changes `access` without remounting).

---

## 2026-06-11 — Texnomart Promo S6 (Центр уведомлений)

### A Count Shown in the Shell Header/Sidebar Must Be Fed by a Store Mounted ABOVE the Shell
- S3 left a known caveat: the sidebar «Согласование» badge reads the seed baseline because the `ApprovalsProvider` sits BELOW the AppShell (on a child route), so in-session decisions don't reach it. S6 makes read/unread the whole point («bell count updates», §11.3), so the `NotificationsProvider` must sit **above** the AppShell. Cleanest mount without a shared-component change: `ProtectedLayout` returns `<NotificationsProvider><AppShell/></NotificationsProvider>` — the bell (inside the shared AppShell, fed via the Promo wrapper's `useNotifications()`) AND the page (inside AppShell's `<Outlet>`) are both under the provider, so one `acknowledge` updates the bell badge, the sidebar nav badge, and the page section counts together. Rule: decide whether a header/sidebar count must be live BEFORE choosing where the store mounts — a store below the shell can never feed a count rendered by the shell.
- The nav badge is built inside `createPromoShellConfig`, which the wrapper rebuilds via `useMemo`. Pass the live unread count INTO the factory (`createPromoShellConfig(role, unreadCount)`) rather than letting the config compute it from a static array — the static `promoNotifications` array in `shell-config` was the old source and had to go.

### Filtering by Role at READ Time, Not by Reseeding — So Read State Survives Role Switches
- §11.3.1 makes notification visibility role-dependent. Seed the FULL set once in the provider and filter per role at read time (`notificationsForRole(role, notifications)`), in BOTH the bell wrapper and the page. If you instead reseeded on role change, acknowledging an item and then switching roles and back would resurrect it as unread. Model per-item visibility as an optional `visibleTo: PromoRole[]` (undefined → everyone; Администратор bypasses the filter) — a data field on the seed, not a parallel access table.

### Style a React-Router `<Link>` as a Button via `buttonVariants` — Sidesteps the Shared-`<Button>` `asChild` Ref Trap
- The recurring Promo pitfall: the shared `@texnomart/ui` `<Button>` is a plain function component, so under a Radix `asChild` (or anywhere a ref is forwarded) it logs «Function components cannot be given refs». A notification's quick link wants button styling but must be a real `<a>` (router navigation). Use `<Link className={cn(buttonVariants({variant, size}), …)}>` — a native anchor with the button's classes, no ref forwarded, no warning. Confirmed the notifications screen adds zero new console errors (the only one is the pre-existing login-page `DropdownMenu` warning, on a different route).

### Shared FilterBar Renders «Все {label.toLowerCase()}» — Pick a Label That Reads Right
- The shared `FilterBar`'s default «all» option is `Все {filter.label.toLowerCase()}`. A label «Тип» yields the ungrammatical «Все тип»; «Типы» yields «Все типы». When reusing a component that interpolates your label into a fixed phrase, choose the label for how it reads in THAT phrase, not in isolation. (Caught only in the browser — the build doesn't flag copy.)

### Wiring a Previously-Inert Shared Control = One Optional Prop + Make the Surrounding Primitive Controlled
- The shared AppShell bell popover already had a dead «Показать все» button. To wire it without breaking Dashboard: add an optional `notificationsHref?: string`; when present, the button closes the popover and navigates. The catch — to close the popover programmatically the `<Popover>` had to become controlled (`open={notifOpen} onOpenChange={setNotifOpen}`); an uncontrolled Popover can't be dismissed from a child click handler. Backward-compatible: Dashboard passes no `notificationsHref`, the button stays inert, and the controlled-vs-uncontrolled switch is invisible to it. Same additive-optional-prop discipline as `roleSwitcher`/`maxWidth`/`className` — verify with `build:dashboard`, not just `build:promo`.

---

## 2026-06-11 — Texnomart Promo S7 (Настройки типов промо)

### Derive a Config Checklist From the Existing Column Dictionary — Don't Re-list the Fields
- S7's required-field checklist IS the full-calendar field set (Appendix C). Re-typing those ~33 fields + categories in a new constant would drift from `gridFields.ts` the first time a column is renamed/added. Instead derive `RULE_FIELD_GROUPS` from the single `COLUMNS`/`COLUMN_GROUPS` dictionary at module load (map each group → its columns), and only **prepend** the 3 spec-frozen identity columns (№ промо / ФИО КМ / Номенклатура) that live in the grid's frozen pane and aren't in `COLUMNS`. One source of truth: the checklist labels/categories track the actual calendar columns for free.

### Two Sibling Routes Sharing a Store = a Layout Route With the Provider (Same as S3) — Not Page State
- `/promo-types` (list) and `/promo-types/:ruleId` (selected rule) are siblings; if each rendered its own page with a local `useReducer`, navigating between them (which is how you select a rule) would remount and reset the store. Reuse the S3 `ApprovalsLayout` pattern: a `PromoTypesLayout` renders `<PromoTypesProvider><Outlet/></PromoTypesProvider>` with both routes as children, so selection-navigation keeps the provider mounted. Selecting a rule is just `navigate(\`/promo-types/${id}\`)`; deep-links work, and a stale `:ruleId` after a reload-reseed falls back to the list via an effect.

### `create`/`copy` Must Mint the Id OUTSIDE the Reducer So the Caller Can Navigate to the New Row
- A reducer can't return the new id, but the UX needs to navigate to the freshly created/copied rule. Generate the id in the action-creator (`nextRuleId(rulesRef.current)` — a `useRef` mirroring the live array so it's not a stale closure), dispatch it INTO the action, and return it from `create()`/`copy()` so the panel does `navigate(\`/promo-types/${create(role)}\`)`. Mirrors the S2 unplanned-campaign id-generation approach.

### Model «Edit Invalidates Approval» (§9.5) Inside the Save Reducer, Keyed on Status + Actual Change
- The re-confirmation rule (editing an approved rule needs КД to re-confirm) is cleanest as a pure transition in the `save` case: if `status === 'approved'` AND the fields/types actually changed (compare sorted id arrays, not a dirty flag — a no-op save shouldn't invalidate), drop to `draft`, clear `confirmedBy/At`, and append a history note containing «повторного». The editor then surfaces an amber banner by detecting that note. Keep the detection in data (status + history), not a separate `needsReconfirm` boolean that can desync.

### No MultiSelect Primitive in the Kit → Toggle Chips Over a Small Fixed Set
- Promo-types is a 7-item set, so a row of toggle **chips** (native `<button>` with a checked tint + a CheckCircle2 icon) is clearer and zero-dep vs. wiring a Command/Popover multi-select. For the field checklist (larger, categorized) the shadcn `Checkbox` with a per-group select-all that computes `indeterminate` (`allOn ? true : someOn ? "indeterminate" : false`) reads better than chips. Match the control to the set size: chips for a handful, grouped checkboxes for many.

### A Clickable Card Containing Another Button Must Be a `div role="button"`, Not a `<button>`
- The rule-list row is clickable (selects the rule) AND contains a «Копировать» `<button>`. A `<button>` inside a `<button>` is invalid HTML (and the inner click is unreliable). Make the row a `<div role="button" tabIndex={0}>` with `onClick` + an Enter/Space `onKeyDown`, so the nested real button is valid and keyboard access is preserved. The a11y tree still reports it as a button.

---

## 2026-06-12 — Texnomart Promo S8 (Аудит-лог и свод контрольных событий)

### A Read-Only Audit Log Is Best a Curated Seed That's *Consistent With* the Other Screens — Not Fully Derived
- S8's action log could in theory be derived by walking every campaign's statuses + version chains + review comments, but the seeds have no per-event timestamps for the КМ/КД status transitions, so a pure derivation would have to fabricate dates anyway and gets messy fast. A hand-authored `AUDIT_EVENTS_SEED` (~21 events) whose campaigns/КМ/version-dates/statuses **match** the existing seeds is cleaner, denser, and guarantees coverage of every action type + object type for the filters — at the honest cost of being **seed-stale** (in-session actions on other screens aren't appended). Assign the monospace ids deterministically (`AUD-####`, oldest-first) inside `buildAuditLog` so they're stable across renders. The filter option lists (users, roles) derive from the log at runtime, so adding a seed row never desyncs the dropdowns.

### Reuse a Fallback-Bearing Helper Carefully — a Generic Fallback Can Fabricate Data When Repurposed
- `getCampaignVersions(id)` returns a **generic single version dated 2026-09-01** for any unseeded campaign (fine for the S4 drawer, which just needs *something* to show). But S8's control timeline computed the «отправка данных КМ» breach as `firstSend.date > fillDeadline` — so every unseeded campaign inherited the 2026-09-01 date and showed a **spurious overdue** against its own (often much earlier) dates, e.g. +73 дн., inflating «Просроченных событий» from 4 real breaches to 9. Fix: read the **seeded chain directly** (`CAMPAIGN_VERSIONS[id]`, the module-local const — buildControlTimeline is in the same file) for the send date, so unseeded campaigns get a dateless node and no fabricated breach. Lesson: when a helper has a "good enough placeholder" fallback, a NEW consumer that does arithmetic on the returned value can turn that placeholder into wrong data — bypass the fallback for the precise computation. (Caught only by eyeballing the rendered «+73 дн.» — the build/types were happy.)

### Separate the Node's "Has a Date" From Its "Is Completed" — Derive State From Status, Date From the Seed
- Once the send DATE comes only from the seeded chain, an unseeded-but-clearly-progressed campaign (e.g. one at «Переотправлено») would wrongly show its «отправка данных» node as *not done* if completion were keyed on `firstSend`. Split the two: the node's **date** is the seeded version date (or absent), but its **state** comes from a `dataSent` boolean derived from the campaign/КМ statuses (`sent || anySeniorDone || anyNonPart || status==="Переотправлено..." || any "На согл. у старшего КМ"`). A milestone's "when" and its "whether" have different sources here — don't conflate them.

### The Shared `<Timeline>` Is Vertical-Only With No Overdue Support — Build a Dedicated One for Horizontal + Red Nodes
- The S8 spec wants a horizontal-on-desktop / vertical-on-mobile timeline with **red breach nodes**; the shared `@texnomart/shared` `<Timeline>` is vertical-only and its status palette is completed/in-progress/pending (no red). Rather than force-fit it, build a dedicated `ControlEventsTimeline` reusing the shared `TimelineStep` status *semantics* (completed/current/pending) plus an overdue branch, rendering horizontal (flex columns + half-line connectors behind centered dots) on md+ and vertical (dot + connector + content) below. Connectors color emerald when the adjacent node is completed, gray otherwise. Horizontal nodes have no room for notes, so surface per-milestone notes in a separate desktop legend below the strip. Reach for the shared component when it fits; when the required shape diverges (orientation + a new state), a focused local component is cleaner than overloading the shared one.

### The Page-Hosted-Sheet Defer Applies to the Mobile «Фильтры» Sheet Too (reconfirmed S8)
- The action-log's mobile «Фильтры» `<Sheet>` is opened by a toolbar button (not a `SheetTrigger`), so it's the same "controlled Radix layer opened by an outside pointer click self-dismisses" race seen since S2 Ph3 — `setTimeout(() => setSheetOpen(true), 0)`. Confirmed it stays open. The benign shared-`SheetOverlay` "Function components cannot be given refs" warning fires on open (same root as every shared Dialog/Sheet) — not the cause, ignore. Treat "opened by an outside pointer click" as the trigger for the defer, regardless of which screen.

---

## 2026-06-12 — Monorepo: Deploying two React-Router SPAs to a GitHub Pages subpath

### Three Independent Pieces Are Needed for a Browser-Router SPA Under a Pages Subpath — `base` ≠ `basename` ≠ 404 Fallback
- A Vite SPA served from `…/Texnomart/promo/` (not the domain root) needs all three, and missing any one fails differently: (1) **Vite `base`** rewrites **asset URLs** in `index.html` — without it the built `/assets/…` paths 404 because they resolve to the domain root, not the subpath; (2) **React-Router `basename`** strips the prefix before **route matching** — without it the router sees `/Texnomart/promo/full-calendar` and matches nothing (defined routes are `/full-calendar`), so the app shell loads but every route is blank/404; (3) a **404 fallback** is needed because GitHub Pages is a static file server — only `/promo/index.html` exists on disk, so deep links like `/promo/full-calendar` have no file and hit Pages' 404 handler. Fixing only `base` gives loading assets + broken routing; fixing only `basename` gives correct routing but 404'd assets. You need both, plus the fallback for refresh/deep-link.

### Keep `base`/`basename` Env-Driven So Local Dev Is Untouched
- Hardcoding `base: '/Texnomart/promo/'` would break `pnpm dev` (dev server would serve under that path) and any non-Pages host. Instead read it from an env the **workflow** sets: `base: process.env.BASE_PATH ?? '/'` in `vite.config.ts`, and derive the router basename from the build-time `import.meta.env.BASE_URL.replace(/\/$/, "") || "/"` (BASE_URL is Vite's echo of `base`, always trailing-slashed; RR wants no trailing slash, and `'/'`→`''`→fallback `'/'` for dev). Local dev/build stay `'/'` with zero config; only CI injects the subpath. Same "extend additively, never break existing usage" rule as the shared-component props.

### GitHub Pages Serves ONE Root `404.html` for All Unmatched Paths — Not Per-Directory
- Pages does **not** serve `/promo/404.html` for a miss under `/promo/`; it serves the single site-root `/404.html` for every unmatched path. So with two apps in subdirs you can't drop a per-app 404 copy and rely on it. The portable fix: one root `404.html` that reads `location.pathname`, splits off the app segment (`/Texnomart/<app>/…`), stashes the remaining in-app path in `sessionStorage`, and `location.replace`s to that app's real `index.html` (which exists on disk); a tiny synchronous snippet in **each** `index.html` `<head>` reads the stash back and `history.replaceState`s the full URL before React boots, so React Router (with its `basename`) matches the intended route. Works for N apps from one root 404, survives refresh/direct-open, and is a no-op in dev (empty `sessionStorage`). This is the generalized `spa-github-pages` technique adapted for a multi-app subpath layout.

### The Root npm Scripts Re-Invoke Bare `pnpm` — Build via the Filter in CI Too
- Same gotcha as local (see Promo bootstrap lesson): `build:dashboard` = `pnpm --filter dashboard build`, so calling it through a wrapper where `pnpm` isn't directly on PATH fails. In the workflow, `pnpm/action-setup@v4` puts a real `pnpm` shim on PATH so `pnpm build:dashboard` works there — but when reproducing the CI build **locally** to verify, use `corepack pnpm --filter <app> build` (the per-project `build` calls `vite` directly, no nested pnpm). Pin `pnpm/action-setup` `version:` explicitly (there's no `packageManager` field in `package.json`); `version: 10` reads the repo's `lockfileVersion 9.0` and `--frozen-lockfile` passes.

---

## 2026-06-12 — Monorepo: prefilled demo login credentials

### Prefilling a Controlled OTP Triggers the "6 digits → auto-submit" Effect on Mount — Guard the Initial Render
- The 2FA page auto-submits via `useEffect(() => { if (value.length === 6) handleSubmit() }, [value])`. Seeding the OTP state with a full 6-digit default (`useState("123456")`) makes that effect fire **on the first render**, so the page logs in and navigates away instantly — the prefilled code is never visible and the 2FA screen flashes. Fix: a `didMountRef` that the effect checks and sets on its first run, returning early — auto-submit then only fires on *subsequent* value changes (a real retype), and the seeded code stays on screen for a manual «Подтвердить». General rule: any effect keyed on a value that now has a non-empty default will run once on mount against that default — if that's not wanted, gate the first render with a mount ref.

### Prefilled Demo Creds Don't Bypass a Random-Success Mock — They're Independent
- The login inputs are prefilled for demo convenience (`admin@texnomart.uz` / `Texnomart2026`), but the mock `handleSubmit` still gates on `Math.random() > 0.7` (30% success) and never reads the email/password — so prefilling the fields does NOT make login deterministic; «Войти» can still need several clicks. If a one-click reliable demo login is wanted, that's a separate change to the success condition (e.g. succeed when the default creds are present), not a side effect of prefilling. Kept the random gate as-is (only the input defaults were requested).

---

## 2026-06-19 — Texnomart Promo: Sticky table header that scrolls with the page

### A Horizontal-Scroll Pane Traps `position:sticky` — Split the Header Out, Don't Fight It
- A Pattern-F table where the right pane is `overflow-x-auto` cannot host a vertical sticky header that sticks to the **page** scroll: any ancestor with `overflow` ≠ `visible` becomes the sticky containing block, so a header inside the horizontal-scroll pane sticks to *that pane* (which scrolls away with the page), not the page. First attempt over-engineered around it (split header/body bands + an internal `max-h` vertical scroll + a synced *top* scrollbar) — which the client rejected: they wanted vertical scroll on the **page** and only the **bottom** horizontal scrollbar. The clean structure: a separate **header band** (frozen-header + an `overflow-hidden` scroll-header) as a sibling **above** the body, the body's single `overflow-x-auto` pane owning the one bottom scrollbar, and a one-line `onScroll` that mirrors `body.scrollLeft → header.scrollLeft`. The header band gets `position: sticky` and the page (the `<main overflow-auto>`) owns vertical scroll. No top scrollbar, no internal vertical scroll.

### `overflow-clip` Rounds the Corners WITHOUT Trapping the Page-Sticky Header (unlike `overflow-hidden`)
- To clip a `Card` to its `rounded-xl` corners you normally use `overflow-hidden` — but `overflow:hidden` **is** a scroll container, so it traps the sticky header (sticks to the Card, which doesn't scroll → header scrolls away). `overflow: clip` (Tailwind `overflow-clip`) clips to the border-radius **exactly like hidden** but is **not** a scroll container, so a descendant `sticky` element still resolves against `<main>`. Verified: with `overflow-clip` the corners round (computed `border-radius: 14px`, border intact) AND the header still pins on page scroll. Use `overflow-clip` whenever you need rounded clipping over a sticky/positioned descendant.

### Negative Sticky `top` Cancels the Scroll Container's Padding So a Pinned Header Sits Flush
- `<main>` has `p-3 md:p-4` (16px). A header with `sticky top-0` pins at the **content-box** top — i.e. 16px below `<main>`'s border-box top — leaving a 16px band where rows scroll visibly *above* the pinned header. Setting `sticky -top-4` (`top: -16px`, matching the container's padding-top) pins it flush at the container's top edge, covering the padding gap. Negative `top` only affects the *stuck* position, never the at-rest flow, so there's no layout shift. Measured: pinned header `top` went 120 → **104** (== `main.getBoundingClientRect().top`).

---

## 2026-06-29 — Texnomart Promo: Краткий промо-календарь client feedback V2

### Client Feedback Reverses Itself — Re-Add the Synced Top Scrollbar the Prior Round Removed
- The 2026-06-19 round explicitly removed a synced *top* horizontal scrollbar (client wanted bottom-only + page vertical scroll); the V2 round (§1) asks for the **top sticky scrollbar back**, synced with the bottom. Don't treat a removed feature as permanently settled — feedback flip-flops. Re-added it *inside the existing page-sticky header band* (so it pins with the header, §13) rather than reintroducing an internal vertical scroll: a spacer the width of the frozen pane + a track whose inner width = the body's `scrollWidth`, both **measured via `ResizeObserver`** (re-measured on data/column/expand changes since `scrollWidth` changes aren't size-observed on the pane itself — add the deps).

### Three Synced Horizontal Scrollers: Idempotent `scrollLeft` Writes Beat a Re-Entrancy Flag
- Keeping a top scrollbar, a header band (`overflow-hidden`), and the body's bottom scrollbar in sync is a feedback-loop risk: scroller A sets B's `scrollLeft` → B fires `scroll` → sets A back. A `syncing` ref + `requestAnimationFrame` release works but can **drop frames during fast scroll** (events within the same frame are swallowed). Cleaner: write the other scrollers' `scrollLeft` **only when the value actually differs** (`if (el.scrollLeft !== x) el.scrollLeft = x`). Setting `scrollLeft` to its current value fires no event, so the cascade self-terminates on the first equal write — no flag, no rAF, no dropped frames. (The `overflow-hidden` header never user-scrolls, so it never originates an event.)

### A Per-Cell Collapsible Block in a Pattern-F Grid Must Feed the SHARED Row-Height Calc
- §3 wants each «Статус готовности акции» cell independently collapsible/expandable, and expanding makes the cell taller. In a Pattern-F split-pane the two panes only stay row-aligned because both read one `rowHeights[i]`. So track the expanded cells in a `Set<campaignId>` **in the table** (not inside the cell) and fold it into that same height calc: `Math.max(BASE, distributionH, expandedReadiness.has(id) ? 150 : 0)`. Both panes re-render and grow together — verified aligned at the taller height. A cell that owned its own height (local `useState`) would desync the frozen pane.

### To Host a Toggle Button Inside a Clickable Row, the Row Can't Be a `<button>`
- The scrolling-pane row was a `<button>` (navigates to the detail page on click). The §3 collapse toggle is a real `<button>` that lives *inside* the readiness cell → a button nested in a button (invalid HTML; React/browser misbehaves). Fix: make the row a `<div role="button" tabIndex={0}>` with an `onClick` + an Enter/Space `onKeyDown`, and `e.stopPropagation()` on the inner toggle so it doesn't also navigate. (This is the same restructure §10's clickable per-КМ-status cells will need — do it once.)

### Proportional Segment Widths = `flex-grow: count` Over a Min-Width Floor
- §3's bar needs widths where 0 → minimum, 1 wider than 0, 3 > 2 > 1, and equal counts equal — driven by the КМ count per status. `style={{ flexGrow: count, flexBasis: 0, minWidth }}` does exactly this: a 0-count segment falls back to `minWidth` (the floor, sized to fit the longest expanded label), and the leftover space is split **proportionally to count**, so every ordering rule holds with one line. The label block under each segment uses the *same* `flexGrow`/`minWidth`, so it sits strictly under its segment and never bleeds into a neighbour.

### Renaming a String-Union Status Needs an Exhaustive Grep — `vite build` Won't Catch Stragglers
- `vite build` transpiles but does **not** typecheck (no `tsc` in the pipeline), so a stale `case "Принято коммерческим директором"` after renaming that `KmStatus` member compiles fine and silently never matches. When reworking a status taxonomy globally, grep the whole app for every old literal (and partial substrings) rather than trusting the compiler — and remember **audit-log/history `statusFrom`/`statusTo` are typed `string`**, so they won't even surface as type errors; update them for display consistency too. Then re-verify in-browser (the dropdown lists the right statuses, badges render, the readiness counts add up).

---

## 2026-06-29 — Texnomart Promo: Краткий промо-календарь client feedback V2 (Фазы B–D)

### Searchable Multi-Select Without a MultiSelect Primitive = Popover + `Command` Checkbox List
- The kit has no multi-select. The S7 precedent (toggle chips over a fixed 7-item set) doesn't scale to a searchable list. For «выбрать несколько № промо» (§9): a `Popover` whose trigger is a native `<button>`+`buttonVariants` (the shared `<Button>` can't take a Radix `asChild` ref — same lesson as every other popover here) opening a `Command` list where each `CommandItem` renders its own checkbox square and `onSelect` toggles an **array** value (`selected.includes(id) ? filter : [...selected, id]`). Set `CommandItem value` to `"<no> <id> <name>"` so cmdk's built-in filter matches either the «26-N» number or the campaign name. The trigger label collapses to «Все …» / the single value / «Выбрано: N».
- Changing the filter value from `string` to `string[]` ripples: `DEFAULT_FILTER_VALUES`, `isFilterActive`, and the page predicate (`promoIds.length > 0 && !promoIds.includes(c.id)`). Add a `countActiveFilters()` helper at the same time — a collapsible filter block (§7) needs the active-facet count for its toggle badge, and it's the natural home for it. (Test-harness note: clicking cmdk items by stale DOM refs fails after the first toggle because the list re-renders and replaces nodes — re-query `[cmdk-item]` before each click; it's a test artifact, not a code bug.)

### Cross-Screen Deep-Link Into a Role-Scoped Queue: Filter ALL Items, Not the Role's Queue
- §10 deep-links a (promo, КМ) status into `/approvals?promo=&km=`. The approvals queue is normally **role-scoped** (`queueFor(currentRole)`), so a link to an item at a stage the current role doesn't own would land on an empty queue. Fix: when the deep-link params are present, filter the provider's **full `items` set** (which the Администратор branch already uses) instead of the role queue — the link always shows its item; the detail page's existing `canAct` gating keeps actions role-correct. The status→target split is a pure helper in mock-data (`kmStatusDeepLink`): review-stage statuses → `/approvals`, final/data-entry → `/full-calendar?promo=`.
- Read params with `useSearchParams()` and use them **directly** in the filter memo (don't copy into `useState` — it desyncs on back/forward and on a fresh deep-link while mounted). Pair each deep-linked screen with a dismissible banner whose clear button calls `setSearchParams({})`; on the full calendar the focus filter should **override «Скрыть отменённое»** so a cancelled campaign reached by link is still visible.

### Compactness Has a Floor: the Tallest Required Cell, Not an Arbitrary Row Height
- §11 «сделать компактнее» tempts you to just shrink `BASE_ROW_H`. But in this grid the **collapsed «Статус готовности акции» cell** (summary line + 8px bar + markers ≈ 52px) is the real floor — drop the row below it and that cell clips in *both* Pattern-F panes. Took 104→80 (fits with margin), header `h-12`→`h-10`, frozen `gap-3 px-4`→`gap-2.5 px-3`; left the expanded-readiness (148) and dist-sub-row (32) heights driving the shared `rowHeights[i]` calc untouched. Rule: pick the new fixed height by measuring the tallest always-present cell content, not by eye.

### Adding Display-Only Report State (§12) — Derive From Seeds, Flag It Seed-Stale
- «Отправка смежным отделам» / «Срок отчёта» reuse the existing S5 report helpers via one new `getReportSendStatus(campaign)` (sent? = `isApprovedCampaign && has lines` — same rule as `getSentCampaigns`; + `getReportSentAt`/`getReportVersionNo` + the start−17-кал.-дн. deadline + `getOverdueDays` when unsent). No new state, no store — a pure read folded into the table/mobile/CSV. Like S5/S8 it's **seed-stale** (reflects the seeded version chains, not in-session edits); document that limit rather than pretending it's live, and only show the «отчёт просрочен» tag when *not yet sent* (a sent report is never overdue).

---

## 2026-06-29 — Texnomart Promo: short-calendar header buttons + seed expansion

### `PageHeader` Renders Its Built-in Export BEFORE `actions` — To Reorder, Disable It and Re-Render Export Yourself
- The shared `@texnomart/shared` `PageHeader` lays out its right side as `[period?] [compare?] [refresh?] [built-in Экспорт] {actions}` — the built-in export dropdown is hardcoded *before* the `actions` slot. So you can't make a button in `actions` appear to the LEFT of «Экспорт» just by ordering your JSX. To get «Фильтры → Экспорт», set `showExport={false}` and re-render the export `DropdownMenu` (Excel/CSV/PDF → the same `handleExport`) as the first/second child inside `actions`, in the order you want. Don't reorder the children of the shared `PageHeader` itself — that's used by Dashboard too.
- "Make a button a little longer" in this kit = `min-w-[Npx]` + `justify-between` on the `<Button>`, with the icon+label(+badge) wrapped in a left `<span className="flex items-center gap-2">` and the trailing chevron as the second flex child. `justify-between` (className) overrides the Button base `justify-center` via tailwind-merge, so the chevron pins to the right edge and the button reads like a dropdown trigger instead of a tight content-width button.

### Enriching ONE Screen's List Without Polluting the Others — Add Line-Less Campaigns
- To pad the short calendar from 6→15 rows, add planned campaigns to the shared `CAMPAIGNS` but give them **no `PROMO_LINES`**. The blast radius is naturally contained because the other screens already gate on lines: the full calendar seeds `visibleCampaigns` from `getCampaignsWithLines()` (line-less campaigns never appear), and reports use `getSentCampaigns()` (also requires lines). Line-less campaigns render «—» plan stages in the «План ак行» tab (the cells already do `appr?.marketing`/`?.kd`/`?.od`), and `buildReviewItems`/`getAuditCampaigns` just pick up a few extra mock items. Always trace every consumer of a shared seed array (`grep CAMPAIGNS`) before extending it — the lines-gate is what makes this safe, and it's worth confirming, not assuming.
- The short calendar's visible count = planned − (cancelled hidden by default). 16 planned − 1 cancelled (PR-2026-004, `hideCancelled` ON) = 15 rows. Give the new campaigns per-КМ `kmStatuses` spanning the full taxonomy so the readiness 5-segment bar and the «Статус КМ по акции» filter actually exercise their variety, not just one colour.

---

## 2026-06-29 — Texnomart Promo: Auth & accounts (#0+A, 3rd-round feedback)

### Drop Promo's 2FA Without Touching the Shared AuthContext — Finalize Login via `verify2FA()`
- The shared `@texnomart/shared` `AuthContext` (used by Dashboard too) flips `isAuthenticated` **only** inside `verify2FA()`; `login()` merely sets `needsTwoFactor`. To remove the 2FA *screen* from Promo without editing the shared context (which would risk Dashboard), the Promo `LoginPage` validates email+password against the new `users-store`, then calls `verify2FA()` directly to complete the session and navigates to `/`. The shared context stays unchanged (still exposes a 2FA path nobody renders). Delete the `/login/2fa` route + `Login2FAPage.tsx` and grep `Login2FAPage`/`login/2fa`/`needsTwoFactor` across `Promo/src` to prove no dangling refs.

### The Shared Shell's «Выйти» Doesn't Know About Per-Project Identity — Clear It Reactively
- Promo added a `CurrentUserProvider` (sessionStorage `promo:current-user-id`) for the logged-in user, but the «Выйти» button lives in the shared AppShell and only calls `useAuth().logout()` (clears `sessionStorage.auth`). So the Promo identity never got torn down on logout — the provider sits above the router and never unmounts, leaving a stale per-tab identity. Fix without editing the shared package: have `CurrentUserProvider` read `useAuth().isAuthenticated` and, in a `useEffect([isAuthenticated])`, clear identity when it flips to `false` (guard on a ref so it's a no-op when already null, and so login's false→true transition never clears). Rule: when a project layers state on top of shared auth, the project must subscribe to the shared auth state to tear its own state down — the shared logout can't reach it.

### Mock Accounts = One localStorage Store as Source of Truth + Guards That Simulate the Mutation
- Model users in a single `users-store.ts` (localStorage `promo:users`, seeded). Each mutator reads → maps → writes a fresh array, so `getUsers()` always reflects the latest. The «≥2 admins» invariant is enforced by guard helpers (`canRevokeAdmin`/`canDeactivate`) that **simulate the post-op array** and re-count `usableAdminCount` (role Администратор and `status !== 'blocked'`) — not by arithmetic — and the UI double-enforces (disabled menu item + a handler re-check before mutating, with a toast on rejection). Live admin actions append to a separate `audit-store` (localStorage `promo:audit-live`) and merge into the existing S8 `/audit` newest-first. Passwords are plain strings and the temp password is shown on-screen once (no email backend) — prototype-grade, documented as such.

### The Locked Playwright `mcp-chrome` Profile Still Bites — and the Old 2FA Bypass Trick Is Now Moot
- The `2026-06-09 S1` lesson's "seed `sessionStorage.auth=true` to skip the random/2FA login" no longer applies (no random gate, no 2FA — just log in with the seeded demo creds `admin@texnomart.uz` / `Admin2026!`, or `newuser@texnomart.uz` / `Temp1234!a` to exercise the forced change). But the other half of that lesson persists: a stale `mcp-chrome-*` profile lock makes even `browser_navigate`/`browser_close` fail with "Browser is already in use … use --isolated"; you can't pass `--isolated` through the MCP tool, so a profile held by another process blocks the automated smoke test entirely — fall back to the passing `build:promo` + a documented manual click-through.

---

## 2026-06-29 — Texnomart Promo: Профиль/Настройки (C, 3rd-round feedback)

### Check What the Shared Shell Already Wires Before Building Nav/Routes
- The shared `@texnomart/shared` AppShell avatar dropdown already had «Профиль» → `navigate("/profile")` and «Настройки» → `navigate("/settings")` hardcoded — but Promo had no such routes, so both links silently dead-ended (no match under `/`). Sub-project C was therefore *just* "add the two routes + screens" — **zero shared-package change**, no nav-config edit. Before adding navigation for a new screen, grep the shared shell (`navigate(`, dropdown items, `*Href` props) for an existing entry point; the shell often already points somewhere that just needs a destination. (Same shape as the S6 bell `notificationsHref` and the #0+A `/users` nav item — the shell anticipates routes the project hasn't built yet.)

### Extend a Shared Form With an OPTIONAL Verifier — Keep the Existing Caller Byte-Identical
- The voluntary password change reuses A's `NewPasswordForm` rather than forking a second password UI. Added two **optional** props: `verifyCurrentPassword?: (current) => boolean` and `currentPasswordLabel?`. When `verifyCurrentPassword` is set, the form renders a «Текущий пароль» field, folds `currentFilled` into `isValid`, and on submit calls the verifier → on `false` shows an inline «Текущий пароль неверён» and aborts (no submit). The forced-first-login caller (`ForcePasswordChangePage`) passes neither prop, so it renders and behaves exactly as before (`currentFilled = !verifyCurrentPassword || …` ⇒ `true`). Keep the *verification* in the parent (it knows the user → `authenticate(email, current)`) and the *error UI* in the form (a returned bool, not a thrown error). After a successful in-page change, bump a `key` on the form to remount it and clear the fields.

### #0+A's Identity Layer Changes the Smoke-Test Bypass — Seed `promo:current-user-id` Too
- Post-#0+A, seeding only `sessionStorage.auth=true` is no longer enough to land on a protected page: `ProtectedLayout` also reads `useCurrentUser()`, and a `mustChangePassword` user (or a null identity) bounces to `/change-password`. For a Playwright smoke test, seed **both** `auth=true` **and** `promo:current-user-id=<an active, non-temp user id>` (e.g. `u-2` admin), plus optionally `promo:current-role` to exercise role-gated UI — then navigate straight to `/profile`. Verified the live wiring by inspecting `localStorage['promo:users']` / `['promo:audit-live']` after each action (ФИО edit → `fullName` updated + «изменение профиля» event; password change → wrong-current rejected with no write, correct-current updated `status`/`lastPasswordChangeAt` + «смена пароля» event) — asserting against the store is more decisive than reading the toast.

---

## 2026-06-30 — Texnomart Promo: Dark theme (B, 3rd-round feedback)

### A Theme Toggle Without a Boot Script + a Provider Is Theatre — It Reverts on Reload
- The pre-existing «Тема» toggle flipped the `.dark` class on click but nothing re-applied it on load, so every reload/deep-link reverted to light (and «Системная» was never re-evaluated). Two pieces make a theme *persist*: (1) an **inline `<script>` in `index.html` that runs BEFORE React** — reads `localStorage['promo:pref-theme']` and adds `.dark` synchronously so there's no flash-of-light (FOUC); React/CSS can't do this without a paint flicker. (2) a **`ThemeProvider`** that owns the preference, writes localStorage, applies the class, and (only while «Системная») subscribes to `matchMedia('(prefers-color-scheme: dark)')`. The boot script and the provider must encode the *same* resolution logic (`dark` OR (`system` AND OS-dark)). Mount the provider ABOVE the router so both the header toggle (inside the shell) and the Settings page read one `useTheme()` — two independent `useState` toggles silently desync.

### Texnomart Dark = Override Stock shadcn `.dark`, Don't Inherit It — Keep the Brand Yellow
- The Figma-Make `.dark` block is stock shadcn: it sets `--primary` to near-white and `--primary-foreground` to dark. Inheriting it makes every primary button/active-state white-on-dark and **erases the brand**. For a branded dark theme, override `.dark` to keep `--primary: #FFD60A` / `--primary-foreground: #000000` (and `--sidebar-primary` so the active nav item stays yellow). Build surfaces as a **layered neutral scale** — `--background` darkest (main area), `--card`/`--popover`/`--sidebar` a step lighter — i.e. the inverse of light's white-cards-on-`gray-50`, so `<Card>`s read against the page. AppShell's `<main>` already had `dark:bg-background`, which assumes this layering.

### Extend the Shared Shell's Theme Toggle With an OPTIONAL Controlled Prop (Same Move as roleSwitcher/notificationsHref)
- The header theme button lives in the shared `AppShell` (Dashboard uses it too) and held its own non-persistent `useState`. To let Promo own persistence without forking the shell or breaking Dashboard: add an optional `theme?: ThemeController` ({ value, onCycle }). `const theme = themeController?.value ?? localTheme; const onToggle = themeController?.onCycle ?? cycleLocalTheme` — provided ⇒ controlled by the project's provider (header ↔ Settings in sync); omitted ⇒ byte-identical legacy behavior. Verify with `build:dashboard`. This is the established additive-shared-prop pattern in this repo.

### shadcn `Badge` Hover BG Is Gated on `[a&]:hover` — a `<span>` Badge Needs No Hover Neutralization
- `StatusBadge` rendered `` `${bg} ${text} hover:${bg} …` `` to stop the Badge's hover from changing the soft tint. But the shadcn `Badge` variants gate every hover bg on `[a&]:hover:` (i.e. only when the badge is an `<a>`). `StatusBadge` is a `<span>`, so that hover never fires and `hover:${bg}` was dead weight — worse, it blocks putting `dark:` variants in the config `bg`/`text` strings (`` hover:${"bg-amber-50 dark:bg-amber-500/15"} `` mangles the dark token). Dropping it let each status config carry `bg: "bg-amber-50 dark:bg-amber-500/15"`, `text: "text-amber-700 dark:text-amber-300"` cleanly. Always check whether a "defensive" hover override is even reachable before working around it.

### Hybrid Color Migration at Scale = Cheat-Sheet + Parallel Agents + Negative-Lookahead Verification
- ~270 hardcoded light utilities across 49 files is too much to hand-edit reliably and too mechanical to think hard about each. The winning shape: write ONE cheat-sheet (keep light class, append `dark:`; map each `gray-N`/tint hue; brand `#FFD60A`/`bg-[#…]` → `primary` token; LEAVE solid `-500` fills + already-adapting tokens + layout classes), then dispatch one **parallel agent per disjoint folder** (no two agents share a file; the lib tint-maps owned by exactly one agent). Hand-do the central primitives yourself so the conventions are anchored. Verify centrally, not per-agent: `build:promo`, then **negative-lookahead greps** (`bg-white(?![/.\w-])(?!.*dark:bg)`, `text-gray-900(?!.*dark:text)`, `(?:text-gray-[4-8]00|bg-gray-50(?![0-9])|bg-gray-100|border-gray-[123]00)(?!.*dark:)`, `#FFD60A`, `style=\{\{.*color`) — these pinpoint any unpaired class an agent missed. (The Grep tool's ripgrep supports PCRE2 lookahead here.) Beware `bg-gray-50` is a prefix of `bg-gray-500` — add `(?![0-9])` so a naive sweep doesn't corrupt `bg-gray-500`.

### Recovering the Locked Playwright `mcp-chrome` Profile (recurring)
- The stale `mcp-chrome-*` profile lock again blocked `browser_navigate`/`browser_close` ("Browser is already in use … use --isolated"). Recovery that works: `Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like '*mcp-chrome-<id>*' } | Stop-Process -Force` (child PIDs die with their parents — the "process not found" errors for the children are expected), then re-`browser_navigate`. After that the full dark-mode walk ran fine. Seed `sessionStorage.auth=true` + `localStorage['promo:current-user-id']` + `['promo:pref-theme']='dark'` before navigating to land authenticated in dark with no FOUC.

---

## 2026-06-30 — Texnomart Promo: Матрица прав (D, 3rd-round feedback)

### "Документ + консолидация" = Live-Derive the Presentation Layer From Existing Helpers, Don't Rewrite Them
- The brief was a permissions-matrix *screen* (документ) **plus** consolidating the scattered role-gating (`getFullCalendarAccess`/`getReportAccess`/`getPromoTypeSettingsAccess`/`canCancelCampaign`/`canApproveDeadline`/…) into one source of truth (консолидация). The tempting-but-risky reading is "refactor every helper onto a new master table" — that rewrites S2–S8 gating and needs every screen re-verified. The low-risk reading that still delivers genuine consolidation: a new `permissions.ts` whose granular `CAPABILITIES[].allowed(role)` predicates **call the real helpers** (`allowed: (r) => getFullCalendarAccess(r).canEditOwnLines`), so the screen reflects the code's *actual* gating and can't silently drift — while the helpers stay the untouched enforcement points (zero regression). Give each capability an `enforcedIn` string (the helper/spec pointer) so the consolidation is auditable, not just a parallel copy. When a brief says "consolidate", default to *reading* the existing logic into one view, not *replacing* it — confirm the deeper refactor is wanted before taking on the regression surface.

### A Read-Only Reference Matrix Is the Exception Where a Sticky-First-Column `<table>` Beats Pattern-F
- The project rule/lesson prefers the Pattern-F split-pane over `position:sticky` on cells — but that rule exists because dense **editable** grids have variable-height rows that two independent panes can't keep aligned. A read-only access matrix has **uniform-height cells** (one chip per cell), so a single semantic `<table>` inside `overflow-x-auto` with `sticky left-0 z-10 bg-card` on the first column (role/capability name) is simpler, fully accessible (real `<th scope>`), and has none of the row-sync pitfalls. Pick the frozen-column technique by whether the cells vary in height, not by "is the table wide" — sticky-`<td>` is only buggy for the editable-grid case the original lesson was about. (Mobile: the same data collapses to one card per row — `hidden md:block` table + `md:hidden` cards — rather than horizontally scrolling a matrix on a phone.)

### God-Mode-Switchable Role Gating Needs BOTH the Nav `roles` Filter AND an In-Screen Guard
- Gating a screen to {КД, Администратор} via the shell-config nav item's `roles` array hides it from the sidebar — but the header role switcher is free god-mode, so any role can switch and deep-navigate to `/permissions` directly (the route isn't role-guarded in `routes.tsx`). The page itself must therefore re-check the active role (`getPermissionsScreenAccess(currentRole).canView`) and render a «Недостаточно прав» state otherwise — mirroring `/users` and `/promo-types`. Nav gating is presentation; the in-screen guard is the actual access control. Verified by switching to Сотрудник закупа: nav item gone AND direct nav shows the guard.

### Playwright Tab-Switch via `browser_evaluate('…click()')` Races the Screenshot — Use the Click Tool + a Locator
- Switching a Radix `Tabs` by `browser_evaluate(() => button.click())` then immediately `browser_take_screenshot` captured the *old* tab — the synthetic click fired but the React re-render hadn't flushed before the shot (and a bare DOM `.click()` doesn't always carry the interaction Radix expects). `browser_click` with a `button:has-text("…")` locator (which waits for the element and settles) then screenshot showed the switched tab correctly. For state-changing UI interactions in a smoke test, prefer the dedicated click tool over an `evaluate`-d `.click()` so the harness waits for the resulting render.

---

## 2026-07-01 — Texnomart Promo: Полный промо-календарь client feedback (14 items)

### The Short-Calendar Sticky-Header Pattern Ports to the Full Calendar — Only the Scroll Ancestor (and the `top` offset) Changes
- §1/§2 (synced top scrollbar + sticky header) is the exact `ShortCalendarTable` technique (a `Card overflow-clip` with a `sticky` header band + 3 `scrollLeft`-synced scrollers, `frozenW`/`scrollW` via `ResizeObserver`). The ONE difference that matters: the short calendar sticks to `<main>` (the page scroll) and cancels its `p-4` with `-top-4`; the full calendar lives inside its OWN internal `min-h-0 flex-1 overflow-auto` (needed for the fixed-footer action bar), so its `position:sticky` header anchors to THAT container and wants a plain `top-0` (no negative offset — the inner scroll container has no top padding). `overflow-clip` on the intermediate `Card` does NOT trap the sticky in either case (it clips but isn't a scroll container). When reusing a sticky pattern, re-identify the nearest scroll ancestor and set `top` to cancel *that* ancestor's top padding, not the original's.

### Variable-Height "Merged Cell" Across a Pattern-F Split Pane = Compute the Height Once, Apply to Both Panes; Sub-Rows Live Only in the Varying Columns
- §8's «подарок на выбор» needs the main nomenclature (frozen pane) + every non-gift column merged (row-spanned) over N gift sub-rows. There are no real rowspans in a flex-div grid, so reuse the short-calendar distribution trick: a pure `lineHeightPx(line, isChoice, editable)` computes the line's height (`max(giftCount,1) + addRow) * GIFT_SUBROW_H`), and BOTH panes' line divs get `style={{height}}` + `items-stretch`. Merged columns are `items-center` (content centers in the tall cell → looks row-spanned); only the gift-1 column renders a `flex-col` of fixed-`GIFT_SUBROW_H` sub-rows (+ the «Добавить подарок» row) whose count×height equals the computed line height. The alignment invariant is "same height on both panes", enforced by calling the SAME pure function in each pane's map — never by eyeballing row classes. Fixed gift types (1–2 gifts) skip all this and render normal single-height `«Подарок №1/№2»` columns.

### Changing a Line's Gift Shape (single field → array) Has a Fan-Out; Grep the Field Name First, Migrate Every Consumer in One Pass
- Replacing `PromoLine.giftNomenclatureId`/`giftStock` with `gifts: GiftItem[]` touched 6 live consumers a build won't flag until runtime: the seed mapping, `missingRequiredFields`, the S4 `TRACKED_FIELDS` diff list, S5 `reportFields` accessors, `buildFullCalendarCsv`, and the mobile `LineEditSheet` — plus the S7 rule seed's required-field IDs (which are gridFields column ids, so renaming `giftNomenclature`→`gift1Nomenclature` in `gridFields` silently orphaned the seed until updated). Grep the exact field name (`\.giftStock`, `giftNomenclature`) across `src` BEFORE editing the interface, list the hits, and change them together; `vite build` passing proves nothing here because it doesn't typecheck. Also: when a number becomes 1С-derived (gift остаток now from the gift nomenclature), drop it from the KM-editable diff/tracked lists or the diff will surface phantom "changes".

### "No per-person identity" Blocks a Literal §7 — Ship a Representative-Actor Mock and Say So
- §7 wanted a КМ to see only *their own* promos/lines, but the app's role is a single god-mode «Категорийный менеджер (КМ)» with no mapping to a specific `km-N`. Rather than fake an identity system, gate on the active *role* and pick a representative КМ (`ownKmId = CATEGORY_MANAGERS[0].id` when `currentRole === "Категорийный менеджер (КМ)"`), filter campaigns/lines by it, and keep empty (freshly-created) campaigns visible so the create-then-add flow still works. Старший КМ/КД/Администратор branch to the full view. Document the simplification as a mock limit. The value is demonstrating the *rule* (КМ is scoped, seniors aren't) without inventing a login-to-КМ backend — but seed at least one campaign owned by that representative КМ (here PR-2026-014 → km-1) or the role sees an empty screen.

### "Autosave" in an In-Memory Mock = Delete the Save Button + Add a Reassuring Indicator; Don't Add Persistence
- §3 «changes should autosave, no need to press Сохранить черновик» is already true in a `useReducer`-store prototype (every edit is live state). The correct implementation is UX, not plumbing: remove the «Сохранить черновик» button and render an «Изменения сохраняются автоматически» line so the user trusts it. Pair it with the real behavioral rule the client actually cares about — status-gated edit/delete (`isCampaignFreshEditable`: draft/returned → free add/edit/delete; approved → tracked correction only; under-review → read-only) — which IS new logic worth writing.

---

## 2026-07-02 — Texnomart Promo: Согласование client feedback (10 items)

### The Sticky-Header + Synced-Scrollbar Pattern Simplifies When There Are NO Frozen Columns — Drop the Dual-Pane Height Sync
- The «unified table styling» ask (§6) was "apply the short-calendar requirements" (page-sticky header + top&bottom synced scroll + dividers) to the approvals queue. But the calendars carry all that complexity to support a **frozen identity pane** — and the reason the calendars compute a per-row height and apply it to *both* panes is that two independent scroll panes can't otherwise stay row-aligned. The approvals queue has **no frozen columns**, so the whole layout collapses to a **single** horizontally-scrolling pane: keep the band split (a `sticky -top-4` header band with a synced TOP scrollbar over a `overflow-x-auto` body, 3 scrollers via idempotent `scrollLeft` + one `ResizeObserver`-measured `scrollW`) but rows now flow at **natural height** — no `rowHeights` array, no `frozenW`, no `items-stretch`. Recognizing "single pane ⇒ no height-sync invariant" turned a scary Pattern-F port into a ~120-line rewrite. Convert a shadcn `<Table>` to div-bands (fixed `w-[…]` columns shared between the header row and each body row via one `COLS` map) rather than fighting `sticky` inside a `<table>` whose `overflow-x-auto` wrapper traps it.

### "Show the КД status but route by the КМ status" — Derive a DISPLAY value, Never Mutate the Routing Field
- §8/§9: an auto-escalated item must *appear* as «На согласовании у коммерческого директора» in the list and hero, but auto-escalation is derived live from the SLA (`isAutoEscalated`) — its underlying `kmStatus` is still «На согласовании у старшего КМ», and that field is what `reviewerForKmStatus`/`effectiveReviewer` route on. Mutating `kmStatus` to the КД value to "fix" the label would break the fact that it was the Старший КМ who lapsed (and re-derivation). The clean split: a pure `displayKmStatus(item)` returns the КД status when escalated, else `item.kmStatus`, used ONLY for the badge; routing/gating keeps reading the real `kmStatus`. Same principle for the stage SLA — `itemSla` computes from a derived `stageSlaStart` (КД stage counts from the auto-forward moment = the Старший-КМ deadline, or a stamped `kdStageStartedAt` on a live forward) without ever rewriting `submittedAt` (the hero still shows the original «Отправлено» time).

### "Sees but can't act" = Broaden the VISIBLE Queue, Keep the ACTIONABLE Predicate — Two Different Selectors
- §3 wanted Старший КМ and КД to *see* promos at both review stages while each only *acts* at their own. The existing `reviewQueueFor(role)` conflated the two (it returned only items whose `effectiveReviewer === role`). The fix is two selectors, not a gate rewrite: a new `visibleReviewQueue(items)` (everything still in a review stage) drives the LIST, while the untouched `effectiveReviewer`/`canAct` on the detail page still decides the BUTTONS. The queue got bigger; nobody gained an action. When a spec says "role X can now view Y but not change it", resist widening the permission that guards mutations — add a separate read predicate and leave the write predicate alone (verified: Старший КМ opens an auto-escalated item and sees a read-only «Сейчас действует: КД»).

### Persist a Filter Per-User Without Clobbering It on First Mount — Guard the Write Behind a Hydration Flag
- §4 «save the КМ filter for the user across logins» = `localStorage['promo:approvals-km-filter:'+userId]`. The trap with a lazy-init-plus-effect setup: the persist effect fires on the FIRST commit (with the still-empty initial state) and overwrites the saved selection before the hydrate effect's `setKmIds` re-render lands. Guard with a `hydrated` ref — the hydrate effect sets it true and loads storage; the persist effect early-returns until it's true (and only writes when a real user id is present, so an auth-bypass QA session with `currentUser === null` no-ops instead of writing to a `…:undefined` key). Key the storage by the user id from `useCurrentUser()`, which seeds from the users-store on login (empty when you bypass auth via `sessionStorage.auth=true`).

---

## 2026-07-06 — Texnomart Promo: Отчёты смежным отделам (5th-part feedback, E-1)

### Projecting Columns From a Shared Dictionary Drags Context-Specific Metadata With Them — Override, Don't Blindly Copy
- E-1 §1 «report fields should match the full promo-calendar» → the cleanest implementation is to project the report columns from the single `gridFields` dictionary (so order/labels/formatting stay in sync and new fields like Бренд/Наличие flow in for free). But `gridFields` groups `supplierCompensation`/`compensationLimit` under its **"marketing"** group (correct for the full-calendar layout), so a naive projection put a **«Маркетинг» super-header over the Закуп/Аналитика compensation columns** (was «Компенсация»), and merged `giftStock` into «Маркетинг» instead of «Подарки». Lesson: when you derive a view from a shared source of truth, the *values/labels* transfer safely but *grouping/positioning that is context-specific* does not — add a small `GROUP_OVERRIDE` (per-id) and keep report-only identity columns in a local map. Type the group-label map `Record<GroupKey, string>` (not `Record<string,string>`) so a future group key fails at compile time instead of rendering a blank header.

### Repurposing a Seed Row for a New Demo Can Silently Kill Another Sub-Project's Demo — Key New Behavior Off Your Own Data
- E-1 §2 needed an «Исключено» line on UN-2026-015. The tempting move — flip an existing line's `removed: true` — broke two things: the full calendar's `hideCancelled` (ON by default) filters `removed` lines so the line *vanished*, and that line was the **only** seeded `removalPending` demo for the S4 «Подтвердить исключение» flow (grep `removalPending: true` → zero hits after). Fix: leave the shared seed's own flags alone and drive the report's «Исключено» (badge + strike) off the **report change set** (`removedLineIds`), not the line's `removed`/`rejected` flags. Lesson: a feature should read its own authoritative data (here the versioned `ReportChangeSet`), not mutate a shared seed that other features derive their state from. Grep the flag you're about to flip across the repo before flipping it.

### A Change Tooltip Must Show What the Cell Actually Renders — Reconcile Seed Strings With the Live Accessor
- The «Было → Стало» tooltip was seeded with hand-authored prev/new strings (`newPrice 5 200 000 → 4 990 000`), but the cell renders the **live** accessor (`money(l.newPrice)` = `12 450 000`). Result: the highlighted cell read `12 450 000 сум` while its tooltip claimed «Стало 4 990 000 сум» — an immediately-visible contradiction (the current god-mode user isn't the seeded acker, so the highlight never clears). Lesson: whenever a seeded annotation (`newValue`) sits on top of a live-computed display, the `newValue` must equal what the accessor produces for that line — compute it from the same source, or read the real line and copy the exact formatted output. Only `prevValue` (the historical value) is free to invent.

### Filtering Over ru-RU Formatted Strings: Digit-Strip Loses Decimals; Local vs UTC Dates Cause Off-By-One
- The per-column numeric filter parsed the **formatted display string** (`money`/`pct` output) rather than the raw field. `s.replace(/[^\d]/g,"")` turned `"94,87%"` into `9487` (100× off — the «Наличие в магазинах, %» range became unusable). Strip only the currency/percent noise and convert the ru-RU decimal comma: `s.replace(/[^\d,.-]/g,"").replace(",",".")` → `parseFloat`. And the date-range filter compared a line date built with **local** `new Date(y,m,d)` against `new Date("yyyy-mm-dd")` which JS parses as **UTC midnight** — so in Asia/Tashkent (UTC+5) a line dated exactly on the "from" day was dropped. Parse both sides the same way (a local-midnight helper from the ISO string). Lesson: filtering a value you only have in *display* form is a smell — but when unavoidable, be locale- and timezone-consistent on both operands.

### Extending a SHARED Component = Additive Optional Prop + Gate ALL New Behavior Behind Its Presence (and count the consumers)
- `VersionHistoryDrawer` is used by **three** screens (reports, approvals detail, full calendar). Adding clickable per-version snapshots stayed zero-regression by making it one optional prop (`snapshotFor?`) and gating every new branch on it: `if (!snapshotFor) return <the exact old markup>` for the version card, `snapshotRows = snapshotFor && selectedVersion != null ? … : currentReport`, and the newest-version «Текущая версия» badge only when snapshots are on. Two catches worth internalizing: (1) the brief named only one consumer to verify — a review found a **third** (`FullCalendarPage`); always grep for every `<SharedComponent` usage, don't trust the task's named list. (2) Don't "helpfully" change a shared default (e.g. the drawer's default open tab) to match your new snippet — the pre-existing default (`"history"`) is load-bearing for the other consumers.

### Header Counters = Stable Version Totals; the Acknowledge Button's (N) = the Only Thing That Decrements
- The client screenshot shows fixed «Добавлено: 1 · Изменено: 1 · Исключено: 1 · Всего позиций: 4» beside a separate «Ознакомиться со всеми изменениями (N)». Two different quantities: the three change counters + «Всего позиций» are **version totals** (from the change set / full line count — never ack- or filter-decremented), while only the button's `(N)` counts *unacknowledged* changes. The trap: «Всего позиций» was rendered from the `lines` prop, but the page passes the **filtered** lines, so it dropped under a column filter and contradicted the stable counters — pass an explicit unfiltered `totalCount`. Lesson: separate "what this version contains" (stable) from "what's left for me to read" (per-user, shrinks); don't source a stable total from a prop that's actually the filtered set.

---

## 2026-07-06 — Texnomart Promo: Уведомления live + persistent (5th-part feedback, E-2)

### Making a Seed-Stale Mock "Live" = One Imperative `notify()` Funnel Called From Existing Handlers — Replace the Toast, Don't Add a Second
- To make notifications fire from real actions, the cleanest shape (in an app whose domain state is NOT centralized — full-calendar lines in a page reducer, approvals in one provider, reports in another) is a single imperative `notify(input)` on the store provider that every action handler calls. The 5 emission points already showed a `toast.success(...)`; the funnel's own toast would then double up. Decision that kept it clean: at each wired site **replace** the existing `toast.success` with `notify({…, description: <the old message>})` so `notify`'s single toast carries the same wording — exactly one toast per action, one code path. Don't leave the old toast in "to be safe"; and don't route the seeds through `notify` (build them in the `useState` initializer) or every reload toasts its whole seed set.

### A Notification's Audience and Its Copy Must Agree — «X уведомлены» Only If X Is In `visibleTo`
- The `ad-approval` notification's description said «…Категорийные менеджеры уведомлены», but its audience (`notificationAudienceFor('ad-approval')` = `MARKETING_AUDIENCE`) does **not** include КМ/Старший КМ, and `notificationsForRole` filters by that audience — so the very role the text names would never see it. The final review caught it; the seed of the same type (`ntf-07`) had correctly omitted the clause, making the live copy the outlier. Lesson: whenever a notification's body claims "role Y was notified", that claim is only true if Y is in the item's `visibleTo` — reconcile the copy with the audience map (or widen the audience, a deliberate scope call). Cross-check new live copy against the existing seed of the same type.

### Persist the Machine-Generated Data + a Separate Per-User Read-Set; Rebuild the Seeds Each Load — Don't Freeze the Whole Store
- "Live + persistent" over a seeded mock does NOT mean serializing the entire notification list to localStorage (that freezes the seeds — a seed-code edit would never show again). The model that stays maintainable, mirroring E-1's `report-ack-store`: **persist only what has no other source** — the live-emitted items (`promo:notifications-live`, cap 50, `sentAt` Date↔ISO) — and rebuild the seeds from `buildNotifications()` every load, merging newest-first. Read-state is a **separate per-user id-set** (`promo:notifications-read:<userId>`, anon fallback), applied over both seeds and live at load — NOT a `read` flag mutated on the persisted item (verified in-browser: the stored live item keeps `read:false`, yet renders read + drops the bell count, because `buildInitial` applies the read-set). Cap the append list so localStorage can't grow unbounded, and `log`/document the cap.

### A Recalled-Memory INDEX Line Is Not the Memory — Read the Full File Before Scoping a Task Derived From Prior Feedback
- The session started with only the one-line MEMORY.md index entry for the E-series in context ("4 sub-projects; E-1 done, E-2..E-4 remain; identity=seeds, export=SheetJS"). The *full* `5th-part-feedback-e-series.md` memory body held the actual E-2 PDF asks (per-role notification sets, admin per-role blocks, multi-role dedup «для роли X», specific deep-links) — but that body was never loaded, so during brainstorming I (correctly, given what was visible) concluded "no discrete client items were supplied" and, with the user's go-ahead, proposed a *different* scope (Live + persistent + toast). Both are legitimate, but they don't overlap much — the shipped E-2 doesn't cover the PDF's E-2. Lesson: when a task derives from earlier feedback and a memory index line hints a fuller record exists, **open the full memory file before defining scope** (or explicitly ask the user for the source doc); an index line summarizes relevance, not requirements. When scope is delegated without the source, state plainly that what shipped may not equal the original ask, and surface the divergence at hand-off.

---

## 2026-07-06 — Texnomart Promo: Уведомления per-role config (5th-part feedback, E-2b)

### Make Existing Hardcoded Behavior Configurable = A Config Whose Default IS a Faithful Inversion of the Current Rule → Zero-Regression by Construction
- E-2b turned notification visibility (two hardcoded audiences, `MARKETING_AUDIENCE`/`ADJ_DEPARTMENTS_AUDIENCE`, applied via each item's `visibleTo`) into an editable **role×category** config. The trap in "make X configurable" is silently changing X's behavior. The safe move: compute the config's **default** mechanically from the *existing* source of truth so defaults reproduce today's behavior exactly — `DEFAULT_ROLE_CONFIG` is the literal inversion of `notificationAudienceFor` (km-assignment→all 9; ADJ trio→the 7 ADJ roles; marketing pair→the 4 marketing roles). Then `notificationsForRole(role, list, config)` filters by the config, and with defaults the app is byte-for-byte unchanged — the feature is purely "the existing rule is now editable." The final review's single highest-value check was verifying all 9 default entries against the real audiences; because they were derived, not hand-authored, they held. Keep the old code path (`visibleTo` fallback when `config` is omitted) so the signature can evolve without breaking callers before they're wired.

### A Deep-Link Must Be GATED on the Destination Being Able to Honor It — a Link the Target Can't Focus Is Worse Than No Link
- `notificationLinksFor` offered «Открыть отчёт» (`/reports?promo=<id>`) for every `data-changed`/`ad-approval` item, but `/reports` can only focus a campaign in `getSentCampaigns()`. A seed (`ntf-01` data-changed for the non-sent PR-2026-001) therefore produced a button that opened `/reports` showing a **different** campaign's report with no signal — silent wrong data, which is worse than an empty state or a missing button. The in-browser pass caught it (navigating to the link's href landed on the default campaign, not the promised one) and the final review flagged it independently. Fix: gate the link on the destination's precondition (`getSentCampaigns().some(c => c.id === id) ? [report, promo] : [promo]`), so a link is only offered when the target screen can actually deliver the focus it promises. Generalizes: when you emit a deep-link, check the destination can honor the param; don't just string-build the URL.

### Alias a Destructured Context Value to Dodge a Same-Named Local — `const { config: notificationConfig } = useNotificationSettings()`
- Wiring the new config into `AppShell` collided with its pre-existing `const config = useMemo(() => createPromoShellConfig(...))` (the shell config). A plain `const { config } = useNotificationSettings()` would shadow it and silently feed the wrong object to `notificationsForRole`. The implementer correctly aliased on destructure (`config: notificationConfig`) — a deviation from the brief's literal code for a real reason. Lesson: when injecting a hook's value into an existing component, grep the component for the destructured name first; alias on destructure rather than renaming the whole existing local. (Review must then confirm the alias carries the RIGHT value, not just that it compiles.)

### Sequential SDD Sub-Projects Share the `task-N-*` Workspace Filenames — Prefix Per Sub-Project or the Stale Report Confuses the Reviewer
- Running E-2b's SDD right after E-2's in the same repo, the `scripts/task-brief` default output (`task-1-brief.md`) and the implementer's `task-1-report.md` **collided with E-2's leftovers**. The E-2b Task-1 reviewer read a *stale E-2* report (about a different commit) and (correctly) flagged it Critical — a real audit-trail defect, though the code itself was fine (the reviewer independently re-built to confirm). Lesson: when chaining sub-projects, give each its own brief/report basenames (`task-e2b-N-*` via the optional `task-brief OUTFILE` arg + a matching report path in the dispatch) and delete the previous project's stale `task-*` files at the start. The ledger (durable, per-sub-project section) is the real audit trail; the per-task report files are transient and collision-prone.

### A Plan That Names a Specific Icon/API Should Carry a Fallback — Verify Against the Installed Version, Not Docs
- The plan specified the lucide icon `BellCog`; it isn't exported by the installed `lucide-react@0.487.0`, so a naive transcription would have failed the build. Because the plan (and the dispatch) included an explicit sanctioned fallback («if `BellCog` isn't exported, substitute `BellRing`»), the implementer substituted + noted it in one pass — no BLOCKED round-trip. Lesson: when a plan pins a specific icon/component/API from a fast-moving library, either verify it against the installed version while writing the plan or bake in a named fallback; don't make the implementer guess whether a substitution is in-bounds.

---

## 2026-07-07 — Texnomart Promo: Аудит-лог и контроль сроков (5th-part feedback, E-3, 2→4 tabs)

### Per-Task Reviews Verify a Tab in Isolation; a Shared Derivation Layer Fails Where Tabs DISAGREE — Only a Whole-Branch Review Catches It
- E-3's whole premise (Approach A) was that Tab 3's «Показатели участников» ratings aggregate the SAME `ControlPoint[]` that Tabs 1–2 render, so the numbers reconcile by construction. Every one of the 11 per-task reviews passed spec✅/quality-approved — because each verified its tab against its own brief. The **whole-branch opus review** then found the reconciliation was silently broken for 2 of 5 participant roles: **Старший КМ** rating was permanently blank because `participantsFor` keyed on the person's *name* (`Исмаилов Жасур`) while the emitted points used the role *label* (`"Старший КМ"`) — a producer/consumer identity mismatch that spans two files no single task owns; and **КД** was stuck at 0% because its completed data lives in the *plan* checkpoint (`"Согласование КД (план)"`), which `ROLE_CHECKPOINTS["Коммерческий директор"]` didn't list, while its promo checkpoint is seed-unreachable. Lesson: when tabs/screens share a derivation layer, a green per-task pass proves each tab renders — it does NOT prove they agree. Budget a whole-branch review (or an explicit cross-tab reconciliation check) precisely at the seams between independently-reviewed units; the reconciliation invariant is the thing to test, and it's invisible from inside any one task.

### "Due but Pending-Past-Deadline" Is a Third State — Count It as Overdue, or the Columns Don't Sum
- The timeliness rating counted `dueCount` = points whose deadline ≤ now, `onTime` = `result === "В срок"`, `overdue` = `result === "Просрочено"`. A point still `"Ожидается"` whose deadline already passed is due-but-neither → `onTime + overdue < dueCount` (a КД sitting on a breached decision showed 0 on-time / 0 overdue / N due). Fix: derive `overdue` from `overdueDays > 0` (which covers completed-late AND pending-past-deadline), so every due point is exactly on-time (overdueDays 0) or overdue (>0) and the columns reconcile, while `timelinessPct = onTime/dueCount` is unchanged. Lesson: when a metric partitions rows by a status enum, enumerate ALL states a due row can be in (incl. "not acted yet, already late") — a predicate that only matches the "completed-late" state silently drops the "pending-late" rows from the count.

### Access Gating Applied Per-Tab Must Be Applied to EVERY Tab — an Unread `access` Prop Is a §-Violation the Build Won't Flag
- Tabs 1/2/4 honored the §7 КМ own-scope (plan-tab notice, own-rows filter), but Tab 3 destructured `access` and never read it — so a plain КМ saw the full leaderboard AND could switch the in-tab role selector to inspect КД/ОД metrics ("sees too much"). No build error, no per-task-review flag (the tab met its own brief, which didn't emphasize scoping). Lesson: a cross-cutting rule (access, i18n, theme) implemented tab-by-tab needs a final matrix pass that exercises the rule on EVERY surface, not just the ones whose brief mentioned it; an accepted-but-unused `access`/`scope` prop on one screen is a red flag that the rule was wired unevenly.

### Page-Level Filters That "Apply to Tabs 1–3" Must Not Bleed onto a Tab With Its Own Controls — Scope the Filter Row to the Tabs It Drives
- The header date-range + role Select rendered on `tab !== "log"`, so it also appeared on «Показатели участников» — where it was inert AND duplicated that tab's own role selector — and its `globals` were still passed to (and silently applied by) the hidden Tab 4's log. Two symmetric bugs: a control shown where it does nothing, and a control's effect applied where it isn't shown. Resolution: render the page-level filter row only on the tabs it actually drives (`tab === "plan" || tab === "promo"`) and stop passing `globals` to the tab that has its own complete filter set. Lesson: "global filters apply to some tabs" means BOTH — only render them on those tabs, and only feed them to those tabs; a filter the user can't see must never be silently in effect.

---

## 2026-07-07 — Texnomart Promo: Управление пользователями/ролями/замещением (5th-part feedback, E-4)

### The Vite Build Is Transpile-Only (esbuild, No `tsc`) — It Does NOT Catch Type Errors; Every Reviewer Must Type-Check by Reading
- The whole verification model assumed `corepack pnpm --filter promo build` would flag type mismatches. It does NOT: this monorepo has no `tsconfig.json`/`typescript`/`vite-plugin-checker` anywhere — `vite build` is esbuild transpile-only. Proven empirically mid-run: an implementer deleted an `AUDIT_ACTION_META` entry (making a `Record<AuditActionType,…>` non-exhaustive) and the build still exited 0. So a **non-exhaustive Record → runtime `undefined`**, a **wrong prop type**, an **import of a non-existent named export**, and a **missing switch case** are all invisible to the build. Consequence for the SDD loop: every per-task reviewer prompt must include explicit type-level named checks — "confirm this map is exhaustive over its key union", "confirm these imports resolve to real exports", "confirm the prop types match" — because the green build proves only that the file parses + bundles. Bake this into the reviewer dispatch from task 1, not after a near-miss.

### Whole-Branch Review Is Where Gate-Parity Across Sibling Surfaces Is Caught — Per-Task Reviews Pass Because Each Surface Meets Its Own Brief
- The same access rule was enforced on TWO surfaces built by different tasks: the `/users` **row-menu** (T8 — correctly gated the global-admin grant on `canToggleGlobalAdmin` and the revoke on `canRevokeAdmin`/≥2-guard) and the `/users/:id` **edit dialog** (T9 — rendered «Администратор» as a free role chip and called `setUserRoles` with NO gate). Both passed their own per-task reviews. Only the whole-branch **opus** review, reading both files together, found the edit dialog was a **privilege-escalation** path (a dept-admin grants themselves global admin) AND a **≥2-admin-guard regression** (a global admin drops the last-but-one admin) — because the guard T8 added was invisible from inside T9's brief. Lesson (recurring across E-3/E-4): when a cross-cutting rule (access, an invariant, i18n) is implemented on multiple surfaces across tasks, budget a whole-branch pass whose explicit job is *gate parity* — "every surface that can mutate X enforces the SAME guard". A green per-task review proves each surface meets its brief; it never proves two surfaces agree. Fix both the dialog (lock the chip via an `adminRoleLocked` prop) AND the parent handler (`handleEditSubmit` re-checks `wouldGrant/RemoveAdmin` against `isGlobalAdmin`+`canRevokeAdmin` before saving) — defense in depth, since the form can't know the ≥2 rule.

### Adding a Multi-Role SET Alongside a Legacy Single-Role Field Silently Breaks Every Legacy Single-Role Writer
- E-4 added `PromoUser.roles?: PromoRole[]` (read everywhere via `rolesOf(u) = u.roles ?? [u.role]`) and switched all access gating (`usableAdminCount`/`effectiveAdminScope`/…) to read `rolesOf`. But the pre-existing row-menu "toggle admin" handler still called the **legacy `setUserRole(id, role)`**, which writes only `.role` and leaves `.roles` stale. Result: granting admin set `.role="Администратор"` but `rolesOf` still returned the OLD `roles` → the grant was a **silent no-op** for every `rolesOf`-based check (not counted, chips unchanged, guard blind); revoking left `.roles` still containing "Администратор" → access never dropped. Lesson: the moment you make a `.roles`-derived read path load-bearing, every WRITER must maintain the set — grep the old single-field setter (`setUserRole`) and switch each call site to the set-aware one (`setUserRoles` with `rolesOf(user)` ± the role), or the read/write halves disagree. The build won't catch it (both fields are valid types); a per-task review caught this one, and the whole-branch sweep confirmed no sibling instance remained.

### Two Screens That Answer the Same Access Question Must Compute Scope Identically — Copy the Whole Expression, Fallback Included
- `/users` derived `scope = effectiveAdminScope(currentUser) ?? (currentRole === "Администратор" ? "global" : null)` (a god-mode fallback so the screen is reachable in the demo), but `/users/:id` derived its `isGlobalAdmin`/`canManage` from `effectiveAdminScope(currentUser)` with NO fallback. A non-admin who flips the god-mode switcher to «Администратор» then saw a fully-working list but a **dead detail page** (every control hidden). Lesson: when a second surface re-derives the same gating predicate, copy the *entire* expression — including the fallback branch — not just the helper call; a subtly different scope derivation between list and detail is a real inconsistency even when the intended login flow never triggers it.

### `PageHeader` Renders a Built-In Export — a Self-Rendered «Экспорт» Duplicates It Unless You Pass `showExport={false}`
- The reworked `/users` added a self-rendered «Экспорт» button (wired to `exportUsersXlsx`) in the header but left the shared `PageHeader`'s built-in export on → **two «Экспорт» buttons** (only visible at runtime; the build is clean). Same root cause as the 2026-06-29 short-calendar note: `PageHeader` renders its own export before `actions`. Fix: `showExport={false}` on the `PageHeader` and keep the self-rendered one. Lesson: whenever a screen renders its own export/refresh/filter control, check whether the shared `PageHeader` already renders that control and disable the built-in — grep other screens (`showExport={false}`) for the pattern. This is the kind of duplicate the transpile-only build never flags — only an in-browser (or DOM-count) QA pass catches it.

### Wiring a Mock "Substitution" Into a Real State Machine = Stamp the Delegated ACTOR, Not the God-Mode Role
- The «Уполномоченное лицо КД» substitute is a logged-in user in some other god-mode role (e.g. a КМ). When they act on a КД-stage approval, `approve(item.id, currentRole)` would stamp the transition with their god-mode role (КМ) and route it wrong. The wiring that makes a delegated actor correct: compute `actingAsRole = substituteActing ? "Коммерческий директор" : currentRole` and pass `actingAsRole` to EVERY `approve`/`reject` call — the state machine sees the КД it expects. And since `isKd` was widened to `currentRole === "Коммерческий директор" || substituteActing`, EVERY `isKd`-gated action had to be re-checked for conflict-safety (a conflicted substitute must not act on their OWN submission via ANY surface — bulk, per-line, mobile, the КД-only «Не участвует» button). Lesson: delegating authority into an existing actor-routed reducer means (1) stamp the delegated role at every mutation site, and (2) enumerate every predicate that widened to include the delegate and re-apply the conflict/scope guard to each — the widening is the seam where a delegate leaks extra power.

---

## 2026-07-09 — Texnomart Promo: Краткий промо-календарь «8-я часть» client feedback

### Client Feedback Screenshots Can Be From a DIFFERENT (Backend-Integrated) Build Than This Repo — Reconcile Before Scoping
- The «8я часть» PDF's screenshots were shot on **`promo.tm.uz`** — a **backend-connected** deployment: telltales were server-loading copy («Статусы/решения загружаются из сервера», «Сервер пока не вернул записей»), **raw backend enums** in the UI («Пользователь #undefined · `marketing_director: approved`», types «Chegirma»/«Bonus»), real data («Мазза нарх тест», «Найдено 2 акций»). None of it exists in this repo — a single grep (`загружаются из сервера|Мазза|marketing_director|fetch\(|/api/`) returned **zero hits**. This repo is the **mock prototype** (deploys to GitHub Pages `…/Texnomart/promo/`), NOT the promo.tm.uz build. They've diverged: the plan-approval UI in the screenshots is a server rewrite absent here, while the calendar grid IS still this repo's `ShortCalendarTable`. Lesson: when a feedback screenshot shows a URL or strings that don't exist in the repo, **surface the divergence and ask which codebase** before scoping — then map each замечание to requirement → this repo's code → gap (some items were already satisfied in the mock and had only regressed on the backend; others were real work here). Confirmed with the user: fix in the mock, backend team mirrors. Recorded in memory `promo-tmuz-is-separate-backend-build`.

### Turning a Plan-Level Status Into Per-Row Partial Approval = a Per-(Stage×Row) Decision Map, Advance Only When ALL Decided; Don't Rebuild the Chain
- The plan was one `useState<PlanStatus>` advanced whole-plan (Дир.маркетинга → КД → ОД). The client wanted «согласовать одну / несколько / все» акции. The lightweight model that satisfied it WITHOUT rebuilding into N independent per-campaign chains: a `DecisionMap = Record<rowId, {kd?: "approved"|"rejected"; od?: "approved"|"rejected"}>` keyed by the two interactive reviewer stages; `reviewerStage` derives from `currentActor` (КД→"kd", ОД→"od", else none); `selectable = canAct && reviewerStage`. Approving the selected subset marks those rows at the stage and **advances the plan only when `rows.every(r => decision[r.id][stage] === "approved")`** — so partial approval leaves the status put (approve a few now, the rest later), full approval flips КД→ОД→«Утверждён»; rejecting selected halts the whole plan to «Отклонён» (reason) with «Вернуть на доработку» → `resetReview()`. Compute the advance decision **synchronously against the just-built `next` map**, not the async state, or the last approval won't advance. The Дир.маркетинга "send" stays atomic (no selection — sending is one action). Backward-compat: the display table (`PlanApprovalTable`) got an OPT-IN `selectable` prop (leading checkbox column + «Выбрать все» via `allSelected`/`someSelected`→indeterminate + a per-row decision badge that replaces the checkbox once decided) — off by default, so it stays a plain read-only table for non-reviewers. Bonus: because that table already showed № / тип / название / период, making it the decision surface satisfied the "show full data where the decision is made" asks (№1+№2) for free.

### `getOverdueDays(deadline, ref)` Already Takes an Actual-Date Arg — Use It So "Overdue" Means "Sent Late", Not "Past Deadline Now"
- The «Отправка смежным отделам» column showed «+N дн.» просрочку for un-sent reports whose deadline had merely passed — the client wanted просрочка ONLY when the report was **actually sent late**. `getReportSendStatus` computed `overdueDays: getOverdueDays(deadline)` (defaulting `ref = new Date()` → "days past deadline as of now") on the not-sent branch. The fix is one arg: on the SENT branch return `getOverdueDays(deadline, sentAt)` (real lateness), and on the not-sent branch return `0`. Then the grid/mobile/CSV render просрочку only where it's now non-zero (sent-late), and the «Срок отчёта» column carries just the date. Lesson: a "deadline vs now" overdue and a "delivered vs deadline" overdue are different questions sharing one helper — pass the actual event date as `ref` and let 0 mean "no fact to be late about yet", so the UI never has to special-case `!sent`.

---

## 2026-07-10 — Texnomart Promo: Краткий промо-календарь «6-я часть» client feedback

### A "Terminal" Status That Maps To `actorForPlanStatus === undefined` Makes a Stepper's `i < activeIndex` Light EVERY Node Green — Track the Rejecting Stage Explicitly
- The plan stepper computed `activeIndex = currentActor ? CHAIN.indexOf(currentActor) : CHAIN.length` and `done = i < activeIndex || isApproved`. For an **approved** plan `isApproved` makes every node green — correct. But **«Отклонён»** ALSO maps `actorForPlanStatus → undefined` → `activeIndex = CHAIN.length`, so `done = i < length` was **true for every node** → a rejected plan rendered as fully-approved (all green ✓), the exact bug the client circled. The two terminal states share one "no current actor" sentinel but need opposite rendering. Fix: carry a separate `rejectedStage: "kd"|"od"` (set at reject time from the acting `reviewerStage`), derive `rejectIndex` from it, and branch the node state — `done = isRejected ? i < rejectIndex : (i < activeIndex || isApproved)`, plus a `rejectedHere = isRejected && i === rejectIndex` red-✗ node. Lesson: when several distinct outcomes collapse to the same `undefined`/`length` sentinel in an index computation, a boolean like `i < activeIndex` can't distinguish "done because finished" from "done because it never applies" — thread the discriminator (which stage produced the terminal state) rather than inferring it from the sentinel.

### Adding a Draft→Sent Lifecycle Without Rebuilding the Plan: Layer a Per-Row `sendStatus` Over the Shared Plan Status, Seed It From an Existing Signal, Scope the Reviewer Logic to `sentRows`
- The «8-я часть» model already had a shared plan status + a per-(stage×row) `DecisionMap`. The «6-я часть» asks (черновик без типа, явная отправка, выбор что отправить, не отправлять повторно) needed a per-row **send** state too — but rebuilding into N independent per-row chains would have thrown away the working reviewer flow. What worked: add `sendStatus: Record<id, "draft"|"sent">` **alongside** the plan status, seed it from an existing signal (`getPlanApproval(id) ? "sent" : "draft"` — campaigns with a `PLAN_APPROVALS` record are already in review, the rest are drafts, so both КД (review) and Дир.маркетинга (draft→send) have live rows on first load with zero new seed data), and then **scope the reviewer "advance when all approved" check to `sentRows` only** (`sentRows.every(...)`) — otherwise the ever-present draft rows have no decision and the plan can never advance. The two selection modes (marketing "send" over draft rows / reviewer "approve-reject" over undecided sent rows) reuse ONE opt-in `selectable` table by passing a `rowCheckable(id)` predicate + a `sendStatusFor`/`decisionFor` pair the table renders as a single «Статус строки» badge — the checkbox appears only for the mode's actionable rows, everything else shows its lifecycle pill. Two more seams: (1) making тип **optional at create but required at send** is a validation split — the create dialog drops тип from `valid`, and the send pool filters `drafts.filter(hasType)` with a red per-cell marker + a blocked-count banner for the rest; (2) editing an already-**sent** row must revert it to «Черновик» + clear its decision so re-approval is forced (a lifecycle transition on edit, not a silent field patch). Lesson: to extend a state machine with an orthogonal axis, add a parallel per-item map seeded from an existing derivation, and re-scope every "all items" aggregate (advance gates, counts) to the axis-relevant subset — the bug surface is the aggregates that silently now include the new-axis items.
