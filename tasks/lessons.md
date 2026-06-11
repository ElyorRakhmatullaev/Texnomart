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
