# AI Context — Texnomart Promo Calendar

**Last updated**: 2026-06-08

## Current State
**Phase**: Module Implementation Complete
**UX Score**: N/A (pending visual QA pass)

## What Exists
- Technical specification (ТЗ v6.0) — 33 pages, fully analyzed
- Sample Excel data for both calendar views
- Claude configuration (rules, commands, settings)
- Figma design file linked in `.claude/rules/design.md`
- **Vite + React + TypeScript project** — fully initialized, production build passes
- **Application shell** (`src/App.tsx`, ~2814 lines) with:
  - Top bar (56px, dark) with brand, search (Ctrl+K), calendar mode toggle, notification bell (dynamic count), user/role menu
  - Left sidebar (240px, collapsible to 64px icons) with 8 bilingual nav items
  - Role switcher across all 9 roles with nav access matrix
  - Responsive: hamburger Sheet below lg, bottom nav on phones
  - Shared primitives (all exported): BilingualLabel, StatusBadge, OverdueTag, Money, RuDate, ReasonDialog, VersionHistoryDrawer, FilterBar
  - Mock data: 9 promo campaigns (5 planned with KM assignments, 3 unplanned, 1 cancelled planned), 6 category managers, 8 notifications, 3 promo rules, 20 audit log entries, 15 control events
  - Page routing: ShortCalendar, FullCalendar, Approvals, ChangeManagement, Reports, PromoSettings, and AuditLog render for their nav items; Notifications opens as Sheet overlay; no placeholders remain
  - Notification types: NotificationType (6 values), AppNotification, NOTIFICATION_TYPE_CONFIG, MOCK_NOTIFICATIONS; state + unread count exposed via AppContext
  - Department report types: DepartmentType, ReportLine (33 fields superset), DepartmentReport; MOCK_DEPARTMENT_REPORTS (2 campaigns with 7 lines total)
  - Promo rule types: PromoRuleStatus, FullCalendarFieldDef, PromoRuleHistoryEntry, PromoRule; PROMO_RULE_STATUS_CONFIG, PROMO_TYPE_REFERENCE (9 types), FULL_CALENDAR_FIELDS (35 fields), FIELD_GROUP_CONFIG; MOCK_PROMO_RULES (3 rules)
  - Audit log types: AuditActionType (8 values), AuditObjectType (3 values), AuditLogEntry, ControlEvent; AUDIT_ACTION_CONFIG, AUDIT_OBJECT_CONFIG; MOCK_AUDIT_LOG (20 entries), MOCK_CONTROL_EVENTS (15 milestones across 3 campaigns)
  - ~75 named exports (types, configs, primitives, hooks, formatters, mock data) for module consumption
- **Brief Promo Calendar** (`src/pages/ShortCalendar.tsx`, ~1588 lines):
  - Desktop table (md+): frozen identity columns (sticky), period + day strip, auto-computed deadline (21 days), per-KM status badges, aggregated indicator chips (4 counts), campaign status badge
  - Plan approval stepper: mode toggle (Таблица / План акций), 3-step ДМ→КД→ОД with role-gated actions, deadline chips (46/21/17 days), ReasonDialog for rejections
  - Campaign detail sheet: right-side Sheet with per-KM breakdown, deadlines, "Open in full calendar" link
  - Mobile Mode B (below md): campaign cards with collapsed KM summary, aggregated chips
  - Filters: planned-only (hardcoded + info tooltip), respects FilterBar (period, category, status, manager, hideCancelled)
  - Cancelled rows: red-tinted bg + strikethrough name
  - Data model: KmPromoStatus (6 values), CampaignStatus (5 values, auto-computed), PlanStatus (6 values)
- **Full Promo Calendar** (`src/pages/FullCalendar.tsx`, ~1424 lines):
  - Split-pane data grid: fixed left panel (3 frozen cols) + scrollable right panel, synced vertical scroll
  - 15 mock data rows across 4 campaigns, 20-item 1С nomenclature catalog
  - Rows grouped by campaign with collapsible group headers (признак, №, тип, название, период, статус)
  - 3 frozen columns (ФИО КМ, № промо, Номенклатура) in separate left pane — never scrolls horizontally
  - 5 column groups with visual banding + visibility toggles: Идентификация, Товар, Продажи, Рассрочка (12/24/36-month banding), Маркетинг
  - Cell behaviors: locked fields (Lock icon), editable stock with ✏️ pencil + warehouse popover, required forecast (red asterisk), gift fields conditional on promo type, bulk-select checkboxes
  - Nomenclature entry: Command-palette search bound to 1С catalog, duplicate detection with warning dialog + persistent "дубль" badge
  - Excel bulk import: Dialog with template download, drag-drop, per-row validation preview
  - 1С availability: mock toggle, yellow Alert banner when down, «Ожидает проверки 1С» badges, approval blocked
  - Unplanned campaigns: new or embed-in-planned mode, promo type select, date validation (≥3 days)
  - Rejected rows: red-tinted bg + AlertCircle + reviewer comment tooltip
  - Sticky bottom action bar: validation summary + "Сохранить черновик" + "Отправить на согласование" (disabled until valid, role-gated)
  - Mobile: tap row → full-screen edit Sheet with fields stacked by group
- **Approvals** (`src/pages/Approvals.tsx`, ~1433 lines):
  - Review queue: role-aware table (Senior KM sees pending_senior, KD sees pending_kd), SLA timers with 2-working-day window (Mon–Fri), auto-forwarded badge, KD overdue tracking. Mode B card list below md.
  - Split review view: desktop (lg+) side-by-side — left pane with read-only submitted lines table + checkbox multi-select, right pane with approval chain stepper + action buttons + comment thread. Stacks vertically below lg with collapsible data panel and sticky bottom action bar.
  - Approval chain stepper: 3-step visual (КМ → Ст. КМ → КД) with done/active/skipped/rejected states
  - Review actions: "Согласовать всё" / "Отклонить" with comment binding to selected lines. Rejecting any line returns whole КМ dataset.
  - "Не участвует" full lifecycle: КМ mandatory reason → Ст.КМ (2-day SLA, auto-forward) → КД final. КД can set directly (reason optional).
  - Comment model: author + role + datetime + text + optional lineIds[]. Mandatory for data rejections, optional for NP.
  - KM view: "Мои отправки" list + "Установить «Не участвует»" for unsubmitted assignments
  - 12 mock items across all states, 5 local types (ApprovalItemType, ApprovalItemStatus, ReviewComment, SubmittedLine, ApprovalItem)
- **Change Management** (`src/pages/ChangeManagement.tsx`, ~641 lines):
  - 5-tab view: version history, changes only, department sends, deadline changes, cancellation journal
  - Campaign selector with metadata (period, version, item count)
  - Expandable version timeline with field-level diffs (ChangeTypeBadge: initial_submission/correction/addition/cancellation/report_sent)
  - Diff table with cell-added/cell-modified/cell-removed CSS highlights
  - Incremental send log showing which versions went to departments
  - Deadline change requests with pending/approved/rejected status
  - Cancellation journal for campaign and line cancellations
  - "Создать корректировку" action — no rollback supported (by design)
- **Department Reports** (`src/pages/Reports.tsx`, ~1036 lines):
  - 3-tab view: Маркетинг (33 cols, widest), Закуп (8 cols), Аналитика (8 cols) — tab access gated by currentRole
  - Campaign selector for campaigns with sent_to_departments / approved_commercial_director status
  - Marketing tab: split-pane table (2 frozen identity cols + scrollable 31 data cols), "В рекламу (маркетинг)" is the only editable checkbox for marketing_staff/marketing_director, bulk select/deselect, save + notify KMs
  - Purchasing/Analytics tabs: simple single table, all fields read-only
  - Versioning: version badge, "Только изменения" toggle, "История версий" → VersionHistoryDrawer
  - Diff highlights: cell-added/cell-modified CSS on changed/added data, cleared after acknowledging
  - Acknowledge flow: per-line checkbox + "Ознакомлен" / "Ознакомиться со всем" buttons; info note that acknowledgement ≠ approval
  - Timeline: "получено / received" date, overdue badge if sent < 17 days before start
  - Marketing re-approval info note
  - Responsive: Mode B cards below md (marketing checkbox + acknowledge ≥44px tappable), department Tabs → Select on mobile
  - Mock data: 2 campaigns (PROMO-2026-003 with added line + PROMO-2026-001 with modified lines), one pre-acknowledged line
- **Notification Center** (`src/pages/Notifications.tsx`, ~452 lines):
  - Right-side Sheet overlay (not a full page) — bell icon and sidebar both open it
  - 6 notification types: data_change, campaign_cancelled, line_removed, marketing_reapproval, km_assignment, adv_approval
  - Role-based filtering via AppNotification.targetRoles[] — count varies by role (e.g., КМ sees 3 unread, admin sees 5)
  - Date-grouped unread items (Сегодня / Вчера / Ранее) with count badges
  - Each item: 36px type icon circle, type badge, version badge (blue mono), datetime (mono DD.MM.YYYY HH:mm), campaign ID + name link, description, responsible user
  - Per-item acknowledge (hover check button) + bulk "Ознакомиться со всем" in sticky bottom bar
  - Read items toggled via show/hide button, displayed in collapsible "Прочитано / Read" group with muted styling
  - Type filter dropdown (only shows types present for current role)
  - Dynamic bell badge: role-filtered unread count, hidden when 0, updated in top-bar + sidebar (expanded + collapsed)
  - Mock data: 8 notifications across all 6 types, 5 unread + 3 read, various targetRoles
- **Promo-type Settings** (`src/pages/PromoSettings.tsx`, ~884 lines):
  - Left panel: searchable rule list with name, promo-type badges, status badge (Черновик/Утверждено/Архив), field count, version, confirmed date
  - Right panel: rule editor with name input, promo-type multi-select (9 types from PROMO_TYPE_REFERENCE), field requirement checklist grouped by 5 categories (Идентификация/Товар/Продажи/Рассрочка/Маркетинг) — 35 fields from FULL_CALENDAR_FIELDS
  - Actions: Сохранить (draft), Подтвердить (КД only, via Dialog), Архивировать (with required reason), Отправить на подтверждение (admin), Копировать, Создать правило
  - Effect preview: green info card showing "Для типа X станут обязательными N полей" with explanation
  - Rule change history: expandable version timeline with author, role, summary
  - Role-gated: КД and admin can edit; others see no-access message
  - Editing a confirmed rule reverts it to draft (requires re-confirmation)
  - Mock data: 3 rules — 1 confirmed (Рассрочка 0-0-12), 1 draft (Скидка стандарт), 1 archived (1+1 старый формат)
  - NAV_ACCESS: admin + commercial_director
- **Audit Log** (`src/pages/AuditLog.tsx`, ~959 lines):
  - 2-tab view: Аудит-лог (action log) + Свод контрольных событий (control events timeline)
  - Tab 1: dense filterable table with 8 columns (user, role badge, datetime mono, action type badge, object type badge, object ID mono, status before→after, comment tooltip), 4-column sorting, 6 filters (user/role/action type/object/date from-to)
  - Tab 1 responsive: Mode B card list below md, filters in left Sheet with count badge + dismissible chips
  - Tab 2: campaign selector, summary strip (3 metric cards: milestones/overdue/avg approval time), horizontal timeline (green completed/gray pending/red overdue nodes with OverdueTag), campaign metadata card
  - Tab 2 responsive: vertical left-aligned timeline on mobile with inline overdue flagging
  - Local components: ActionTypeBadge (8 types with icons), ObjectTypeBadge (3 types), RoleBadge, StatusTransition, FilterControls, SummaryStrip, HorizontalTimeline, VerticalTimeline
  - Mock data: 20 audit entries spanning 5 campaigns and 6 users; 15 control events across 3 campaigns (PROMO-2026-001 clean, PROMO-2026-003 with 3-day overdue on Senior KM step, PROMO-2026-005 in progress)
  - NAV_ACCESS: admin + commercial_director + operational_director + analytics_staff
- **16 shadcn/ui components** in `src/components/ui/`
- **Tailwind CSS** with shadcn CSS variable color system

## What Doesn't Exist Yet
- No git repository
- No routing (single-page with state-based navigation)
- No API layer or backend
- No authentication
- No real data / 1C integration

## Active Work
- All 8 module pages complete (Brief Calendar, Full Calendar, Approvals, Change Management, Reports, Notifications, Promo Settings, Audit Log)
- No placeholder pages remain

## Architecture Decisions
- **Vite + React** (decided, not Next.js — no SSR needed for internal tool)
- shadcn/ui confirmed as component library
- **Per-module file structure**: each module in `src/pages/`, shared primitives exported from `src/App.tsx`
- **Circular import pattern**: modules import from App.tsx and App.tsx imports modules — works via ESM live bindings BUT top-level code in modules must NOT call functions that access App.tsx exports (use lazy init inside components instead)
- Bilingual UI: Russian primary, English secondary
- Brand colors: `#FFDD2D` (not `#FFD60A`)
- Typography: Manrope + IBM Plex Sans + IBM Plex Mono (not Inter)
- CSS variables via injected `<style>` block in App.tsx
- Role-based nav visibility with access matrix
- Status badge hierarchy: legacy PromoStatus (shell), KmPromoStatus (per-KM), CampaignStatus (auto-computed), PlanStatus (plan approval), ApprovalItemStatus (local to Approvals.tsx)
- **Module-local types**: Approvals.tsx defines its own types (ApprovalItem, ReviewComment, etc.) rather than adding to App.tsx — pattern for module-specific data models that don't need cross-module sharing
- 1C integration required for nomenclature, stock, cost price (future)
- Multi-role access control with 9 distinct roles
- **Frozen columns via split-pane**: `<main>` in App.tsx has `overflow-auto` which creates a nested scroll context that breaks CSS sticky on table cells. Solution: two side-by-side divs (fixed-width left + flex-grow right) with `onScroll` sync handlers. Both use `border-collapse: separate` so headers can be sticky vertically within each pane.
- **Notifications as Sheet overlay**: Notifications are NOT a routed page — the bell icon and sidebar "Уведомления" nav item both open a right-side Sheet. State (`notifications`, `notificationCount`, `openNotifications`) lives in App component and is exposed via AppContext. The `NotificationCenter` component is rendered in the overlays section of App.tsx alongside VersionHistoryDrawer.

## Key Modules (from ТЗ)
1. **Brief Promo Calendar** ✅ — management table, plan approval stepper, KM status tracking
2. **Full Promo Calendar** ✅ — 39-column data grid, nomenclature entry, Excel import, 1С status, review feedback
3. **Approval Workflow** ✅ — review queue, split review view, "Не участвует" lifecycle, SLA timers, comment model
4. **Change Management** ✅ — versioning, edit-after-approval, correction mode, marketing re-approval, cancellation (campaign + line), deadline changes, incremental department sends
5. **Reports Module** ✅ — auto-generated reports for 3 departments, versioned, acknowledge flow, marketing editable checkbox
6. **Versioning System** ✅ — integrated into Change Management module
7. **Notifications** ✅ — bell opens Sheet, 6 types, role-filtered, date-grouped, acknowledge flow
8. **Audit Log** ✅ — action log table (8 action types, 6 filters, sorting) + control events timeline (per-campaign milestones with overdue tracking)
9. **Promo-type Settings** ✅ — rule CRUD, field requirement checklist, КД confirmation, change history
10. **1C Integration** — nomenclature sync, stock, prices
11. **Excel Import** ✅ — bulk nomenclature upload with validation (integrated into Full Calendar)

## Known Issues
- Circular import between App.tsx and page modules — works for render-time access but crashes if module-level code accesses App.tsx exports before App.tsx finishes loading. Use lazy initialization (useState callback or useMemo) for mock data that references App.tsx exports.
- `position: sticky` on `<td>` elements fails inside the App.tsx `<main className="overflow-auto">` container. Any table needing frozen columns must use the split-pane pattern (two synced `<div>` scroll containers) instead.

## Dependencies
- 1C ERP system (external, for nomenclature/stock/price data — future)
- Figma design file (for UI reference)
