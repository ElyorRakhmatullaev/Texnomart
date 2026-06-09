# Change History

Reverse chronological. One-line summaries — implementation details are in the code, structure in CLAUDE.md.

---

## 2026-06-09 — Texnomart Promo: Bootstrap + Master Shell
Scaffolded the **Texnomart Promo** sub-project (`Promo/`) as a monorepo sibling of `Dashboard/` — the runnable Master shell, with module screens (S1–S8) left as placeholders for follow-on tasks. Config (`package.json` lean deps, `vite.config.ts` 3 aliases, `index.html`, `main.tsx`, `src/styles/*` copied from Dashboard); workspace wired (`pnpm-workspace.yaml`, root `dev:promo`/`build:promo`). Auth flow copied from Dashboard (shared mock `AuthContext`, AuthLayout rebranded «Промо-календарь»). Shell: `shell-config.tsx` exposes `createPromoShellConfig(role)` with 7 nav items, breadcrumbs, role-aware badges (Согласование = items awaiting role, Уведомления = unread); thin `AppShell.tsx` wrapper adds command search. **9-role switcher**: new `RoleProvider`/`useRole` (sessionStorage-persisted) drives a global active role; the shared `AppShell` was extended **additively & backward-compatibly** with an optional `roleSwitcher` prop (new `RoleSwitcherConfig` type) rendering a pill beside the avatar + a switcher inside the user menu, and nav gating now uses the active role (Dashboard, passing no `roleSwitcher`, is unchanged). Seven Promo primitives (`PromoStatusBadge`, `OverdueTag`, `Money`, `RuDate`, `ReasonDialog`, `VersionHistoryDrawer` stub, `DeadlineChips`); `formatSum` added to shared formatters (UZS «сум»). Seed `promo-mock-data.ts` (8 campaigns incl. 2 unplanned + 1 cancelled, 6 КМ, 30 SKUs, 7 promo types). Verified: `build:promo` and `build:dashboard` both pass, dev server boots, role switching dynamically re-gates nav. `Promo/CLAUDE.md` added.

## 2026-06-09 — Texnomart Promo Prompt Pack
Added `docs/promo_prompt_pack.md` — a monorepo-adapted prompt library for the **Texnomart Promo** promo-calendar system (planning & approval of planned/unplanned campaigns), derived from the TZ v6.0 spec. Structured like `dashboard_prompt_pack_part2.md`: Foundation (monorepo tokens — Inter / `#FFD60A` / `0.625rem`, `@texnomart/ui` + `@texnomart/shared` imports, status map onto `--status-*`), Master (`Promo/` app shell + 9-role switcher + Promo primitives), 8 section prompts (S1–S8: short calendar, full calendar grid, approvals/SLA, change management & versioning, department reports, notifications, required-fields rules, audit log), and Appendices A–D (status taxonomy, glossary, field dictionary + report routing, role matrix). Russian-only. Planned sub-project — no code yet.

## 2026-06-09 — Detail Page Action Bars, Tab Bar Polish & Shell Colors
Fixed bottom action bars across 5 detail pages (Applications, Audit, Users, Partners, Branches): mobile-responsive (stacking buttons, 44px touch targets), flush to the viewport edge, correct negative margins per breakpoint. ApplicationDetailPage converted to the flex-column fixed-footer layout so its bar stays pinned at the bottom on short tabs. Tab bar restyled for a clearer active state (semibold + overlapping yellow underline, hover affordance), content-width tabs (`flex-none`), horizontal overflow scroll, and `scrollbar-gutter: stable` to stop content-width shift between tabs. AppShell: white sidebar (`--sidebar: #ffffff`), subtly gray main (`bg-gray-50`), content wrapper given `h-full` to enable fixed footers, and the collapse button rebuilt as a real button that shows a label in expanded mode.

## 2026-06-08 — Shared Patterns Package (`@texnomart/shared`)
Extracted 10 components, auth, hooks, utils from Dashboard into `packages/shared/` for cross-project reuse. Dashboard AppShell rewritten from 585 → ~115 lines (thin wrapper). Config-driven architecture: each sub-project passes its own nav/breadcrumbs/logos via `AppShellConfig`. Auth files use re-export pattern for zero-change migration.

## 2026-06-01 — Dashboard Mobile Card Contrast
Added `bg-gray-50/80` page background for white card visibility on mobile. Fixed pnpm v11 build approvals in `pnpm-workspace.yaml`.

## 2026-05-26 — Dashboard & AppShell Mobile Responsiveness
Hamburger sidebar (shadcn built-in Sheet), responsive grids (`grid-cols-2 md:grid-cols-4`), mobile card lists for RecentApplicationsWidget. Breadcrumbs hidden below `md`.

## 2026-05-25 — /commit Command & Page Title Standardization
Created `/commit` command (topic-grouped commits). Standardized all page H1 to `text-2xl md:text-[32px] font-bold leading-tight text-gray-900` across 9 pages.

## 2026-05-24 — KPI Drill-Down, Profile, Settings, Audit, Notifications, Telegram, Analytics, Users, Branches
Built all remaining prompt pack pages (Prompts 6a–13a + KPI drill-down). All 14 prompt pack pages complete. Key patterns: left-rail nav (Settings/Profile), drag-and-drop priorities (Branches), cohort heatmap (Analytics), 5-step broadcast wizard (Telegram), diff viewer (Audit), day-grouped list (Notifications).

## 2026-05-22 — Auth Routing, Clients, Partners, Dashboard Wiring & Fixes
Wired auth flow with route guards (`ProtectedLayout`/`GuestLayout`). Built Clients (Prompt 4a) and Partners (Prompt 5a) modules. Made dashboard controls functional (period syncing, interactive donut hover, real navigation). Fixed dashboard scroll (`h-full overflow-hidden` trap) and restructured chart grid to row-based layout. Fixed sticky bottom bar on ApplicationDetailPage.

## 2026-05-21 — Project Setup & Application Detail Rewrite
Initial Figma Make export. Created project documentation. Rewrote ApplicationDetailPage to match Prompt 3a spec (7 underline tabs, white Card hero). Updated prompt pack: Pattern D changed from drawer to full detail page, added Pattern K (mobile responsiveness).
