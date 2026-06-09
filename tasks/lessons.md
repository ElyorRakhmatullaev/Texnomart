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
