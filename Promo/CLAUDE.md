# Texnomart Promo Calendar System

## Project Overview
Enterprise system for managing planned and unplanned promotional campaigns at Texnomart.
Eight main interfaces: Brief Promo Calendar (management view), Full Promo Calendar (detailed data entry with 39 columns), Approvals (review queue with SLA-tracked approval chain), Change Management (versioning + diffs), Department Reports (read-only versioned reports per department), Notifications (role-filtered notification center as Sheet overlay), Promo-type Settings (field requirement rules per promo type), and Audit Log (action log + control events timeline).

## Status
**Module Implementation Complete** — Application shell and all 8 module pages implemented: Brief Promo Calendar, Full Promo Calendar, Approvals, Change Management, Department Reports, Notifications, Promo-type Settings, and Audit Log.

## Technical Specification
- Source: `files/ТЗ_СИСТЕМЫ_УЧЁТА_ПЛАНОВЫХ_И_ВНЕПЛАНОВЫХ_ПРОМО_АКЦИЙ_V_6_0.docx`
- Extracted text: `files/tz_extracted.txt`
- Sample data (brief calendar): `files/План промо-календаря КМ VS 3.xlsx`
- Sample data (full calendar): `files/План_Полный_промо_календарь_КМ_VS_3.xlsx`

## Stack
- **Framework**: Vite 6 + React 18
- **UI**: shadcn/ui via `@texnomart/ui` shared package + Tailwind CSS v4
- **Icons**: Lucide React
- **Charts**: Recharts
- **Language**: TypeScript
- **Path aliases**: `@` -> `./src`, `@texnomart/ui` -> `../packages/ui/src`
- **All UI text**: Bilingual — Russian primary, English secondary (muted)
- **Currency**: сум (`1 299 000 сум`)

## Key Files
- `src/App.tsx` — Application shell (~2814 lines): layout, navigation, role switcher, shared primitives (~75 named exports), mock data (9 campaigns, 6 KMs, version history, deadline changes, cancellations, 2 department reports with 7 lines, 8 notifications, 3 promo rules, 20 audit log entries, 15 control events), page routing for 7 module pages + 1 Sheet overlay, VersionHistoryDrawer, CancelCampaignDialog, DeadlineChangeDialog, ChangeTypeBadge, LineChangeBadge, ActionTypeBadge configs, PromoRule types, FULL_CALENDAR_FIELDS, PROMO_TYPE_REFERENCE
- `src/pages/ShortCalendar.tsx` — Brief Promo Calendar module (~1588 lines): management table, plan approval stepper, campaign detail sheet with version info + cancel/deadline actions, responsive cards
- `src/pages/FullCalendar.tsx` — Full Promo Calendar module (~1424 lines): split-pane data grid (frozen left + scrollable right), nomenclature entry, Excel import, warehouse popover, installment banding, 1С status, unplanned campaigns, review feedback, mobile edit sheet, line cancellation, correction mode, marketing re-approval, hide excluded toggle, version history per campaign
- `src/pages/Approvals.tsx` — Approvals module (~1433 lines): review queue with SLA timers, split review view (submitted lines + actions), "Не участвует" full lifecycle, approval chain stepper, comment model, role-gated actions, KM submissions view, responsive Mode B cards
- `src/pages/ChangeManagement.tsx` — Change Management module (~641 lines): 5-tab view (version history, changes only, department sends, deadline changes, cancellation log), campaign selector, expandable version timeline with field-level diffs, incremental send log, deadline change requests with approval status, cancellation journal
- `src/pages/Reports.tsx` — Department Reports module (~1036 lines): 3-tab view (Маркетинг/Закуп/Аналитика), role-gated tab access, campaign selector, marketing split-pane table with editable "В рекламу" checkbox + bulk select, versioning with diff highlights + acknowledge flow, overdue marker, responsive Mode B cards
- `src/pages/Notifications.tsx` — Notification Center (~452 lines): right-side Sheet overlay, 6 notification types with type badges + icon circles, date-grouped (today/yesterday/earlier), per-item and bulk acknowledge, type filter dropdown, show/hide read toggle, role-filtered notification list, campaign quick-links
- `src/pages/PromoSettings.tsx` — Promo-type Settings module (~884 lines): left list + right editor layout, rule CRUD (create/copy/save/confirm/archive), field requirement checklist grouped by 5 categories, promo-type multi-select, effect preview, rule change history, role-gated (КД + admin), 3 mock rules seeded
- `src/pages/AuditLog.tsx` — Audit Log module (~959 lines): 2-tab view (Аудит-лог / Свод контрольных событий), dense filterable action log table with 8 columns + sorting, 6 filters (user/role/action type/object/date range), horizontal control events timeline per campaign with overdue node styling, summary strip (milestones/overdue count/avg approval time), Mode B cards below md, mobile filter Sheet, vertical timeline on mobile, 20 mock audit entries + 15 control events across 3 campaigns
- `src/main.tsx` — React entry point
- `src/index.css` — Tailwind directives + base layer + frozen-pane scrollbar utility + diff highlight CSS (cell-added, cell-modified, cell-removed)
- `src/lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)
- `src/components/ui/` — 16 shadcn/ui component files (button, badge, card, dialog, sheet, dropdown-menu, select, tooltip, command, etc.)
- `tailwind.config.ts` — Tailwind with shadcn CSS variable colors
- `vite.config.ts` — Vite with `@/` path alias

## Design Tokens (Unified with Dashboard)
- **Primary**: `#FFD60A` (Texnomart yellow, accent only)
- **Font**: Inter (400, 500, 600, 700), base 16px
- **Card specs**: white bg, 10px radius (`--radius: 0.625rem`)
- **Spacing scale**: 4px base grid. Page gutters 24px. Card padding 16–20px.
- **Status colors**: success `#16A34A`, warning `#F59E0B`, destructive `#DC2626`, info `#2563EB`, neutral `#9CA3AF`
- **Theme**: CSS variables in `src/styles/theme.css` (Tailwind v4 @theme inline)
- See `styles-config.md` (root) for full token reference.

## Key Business Entities
- Promo Campaign (плановая / внеплановая)
- Nomenclature (from 1C integration)
- Approval Chain (КМ → Старший КМ → Коммерческий директор)
- Reports (Marketing / Procurement / Analytics)
- Audit Log

## Roles (9)
1. Коммерческий директор (КД)
2. Операционный директор (ОД)
3. Директор маркетинга (ДМ)
4. Старший КМ (Ст.КМ)
5. КМ — Категорийный менеджер
6. Сотрудник маркетинга
7. Сотрудник закупа
8. Сотрудник аналитики
9. Администратор

## Commands
- `/start_task` — load context and propose approach before coding
- `/doc_sync` — update all documentation files
- `/commit` — group changes by topic and commit
- `/ux-analysis` — UX audit of Figma designs
- `/ux-designer` — delegated UX analysis via subagent

## Conventions
- **Bilingual labels**: Russian on top, English smaller/muted underneath. Single `labels` object for consistency. Buttons/badges: Russian only, English via tooltip.
- **Numbers**: space thousands + `" сум"` for currency. `IBM Plex Mono` with `tabular-nums`.
- **Dates**: DD.MM.YYYY. Date+time: DD.MM.YYYY HH:mm.
- **Page titles**: Manrope 24px bold via `<BilingualLabel size="page" />`
- **Statuses**: `<StatusBadge>` with soft-tint (light bg + colored text + 1px colored border)
- **Loading**: skeleton blocks, never spinners
- **Empty states**: Lucide icon 48px + heading + description + CTA
- **Error states**: icon + message + "Повторить" button
- **Colors**: exact hex via `style={{}}`, never Tailwind arbitrary color classes like `bg-[#FFDD2D]`
- **Responsive**: desktop-first (lg+), sidebar collapses to Sheet below lg, bottom nav on phones
- **Module files**: each module in `src/pages/`, imports shared primitives from `src/App.tsx` via named exports
- **Frozen columns**: use split-pane layout (two synced divs), NOT `position: sticky` on `<td>` — sticky breaks inside App.tsx's `overflow-auto` main container
- **Status badge variants**: `StatusBadge` (legacy PromoStatus), `KmStatusBadge` (per-KM), `CampaignStatusBadge` (campaign-level), `PlanStatusBadge` (plan approval), `ApprovalStatusBadge` (approval queue, local to Approvals.tsx)
- **Approval patterns**: SLA timer (2 working days Mon–Fri), auto-forwarded tag (indigo `#E0E7FF`/`#4338CA`), approval chain stepper (3-step: КМ → Ст.КМ → КД), split review view (left data + right actions at lg+, stacked below)
- **Versioning**: `VersionHistoryDrawer` (wide Sheet, 3 tabs: history/changes/full), `ChangeTypeBadge` (5 types with distinct colors), `VersionEntry` type. No rollback — corrections create new versions via "Создать корректировку". Field-level diffs with `cell-added`/`cell-modified`/`cell-removed` CSS classes.
- **Cancellation**: campaign-level (КД only, `CancelCampaignDialog` with required reason, separate `cancelledAt`/`cancelReason` fields on PromoCampaign) and line-level (КМ, `ReasonDialog`, `lineStatus: "excluded"`, requires КД re-approval). Cancellation is a separate state field, not inside `признак акции`.
- **Edit after approval**: edits to approved data tracked as draft corrections, `CorrectionMode` state in FullCalendar. Changes (except new products) require marketing re-approval (`pending_marketing_reapproval` status). After КД approval → incremental report sent to departments with toast notification.
- **Deadline change**: `DeadlineChangeDialog` (КД initiates, old/new dates + required reason), requires approval by senior leadership. `DeadlineChangeRequest` type with `approvalStatus`.
- **Change management page**: `ChangeManagement.tsx` with 5 tabs — version history (expandable timeline), changes only (diff table), department sends (incremental send log), deadline changes, cancellation journal.
- **Department reports**: `Reports.tsx` with 3 department tabs (Marketing/Purchasing/Analytics) gated by `currentRole`. Reports are read-only except Marketing's "В рекламу (маркетинг)" checkbox. Versioned with `cell-added`/`cell-modified` diff highlights; acknowledge flow (per-line or bulk) clears highlights. Info note: acknowledgement ≠ approval. Overdue marker if sent < 17 days before start. Marketing split-pane for wide table; Purchasing/Analytics use simple single table.
- **Promo-type settings**: `PromoSettings.tsx` with left-list + right-editor layout (lg+ side-by-side, stacked below lg). Rules define which full-calendar fields are required per promo type. `PromoRule` type with `PromoRuleStatus` (draft/confirmed/archived). `PROMO_RULE_STATUS_CONFIG` for badge colors. `PROMO_TYPE_REFERENCE` (9 types), `FULL_CALENDAR_FIELDS` (35 fields in 5 groups), `FIELD_GROUP_CONFIG`. Rule takes effect only after КД confirms; editing confirmed rule reverts to draft. Archive with reason (no hard delete). Role-gated to `commercial_director` + `admin`.
- **Notifications**: Bell icon and sidebar "Уведомления" both open a right-side Sheet (not a page). 6 types: `data_change`, `campaign_cancelled`, `line_removed`, `marketing_reapproval`, `km_assignment`, `adv_approval` — each with `NOTIFICATION_TYPE_CONFIG` (icon, colors, labels). `AppNotification` type with `targetRoles[]` for role-based filtering. Notifications state (`useState`) lives in App component; unread count exposed via `AppContext` (`notificationCount`, `openNotifications`). Acknowledge marks items as read; bell badge and sidebar badge update dynamically.
- **Audit log**: `AuditLog.tsx` with 2 tabs (button-group pattern from ChangeManagement). Tab 1: dense action log table with `AuditActionType` (8 types), `AuditObjectType` (3 types), `ActionTypeBadge` + `ObjectTypeBadge` local components, `StatusTransition` (before→after with arrow), sortable columns, 6 local filters (user/role/action type/object/date range) with mobile Sheet. Tab 2: per-campaign horizontal timeline with `ControlEvent` milestones, overdue nodes (red + `OverdueTag`), `SummaryStrip` (3 metric cards), campaign selector. Role-gated to admin/КД/ОД/analytics_staff. Types + configs + mock data exported from App.tsx.
