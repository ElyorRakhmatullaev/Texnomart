# Project History

## 2026-06-08 — Audit Log Module Implemented (Final Module)
- Created `src/pages/AuditLog.tsx` (~959 lines) — eighth and final module page, completing all UI modules
- **2-tab layout** (button-group tabs matching ChangeManagement pattern):
  - Tab 1: Аудит-лог / Action log
  - Tab 2: Свод контрольных событий / Control events
- **Tab 1 — Action Log**:
  - Dense table with 8 columns: Пользователь (avatar + name), Роль (abbr badge), Дата и время (mono DD.MM.YYYY HH:mm), Тип действия (ActionTypeBadge with icon), Объект (ObjectTypeBadge), ID объекта (mono blue), Статус до → после (StatusBadge pair with arrow), Комментарий (truncated + tooltip)
  - Sortable on 4 columns (datetime desc by default, user, action type, object type)
  - 6 filters: user Select, role Select, action type Select (8 types), object type Select (3 types), date from/to inputs
  - Desktop: full table at md+. Mobile: Mode B card list + filters in left Sheet with count badge + dismissible chips
  - Row count footer
- **Tab 2 — Control Events Timeline**:
  - Campaign selector (3 campaigns with timeline data)
  - Summary strip: 3 metric cards — milestones completed (N/total), overdue count (red if >0), average approval time (working days Mon–Fri)
  - Desktop: horizontal connected-node timeline — green (completed), gray (pending), red + AlertTriangle (overdue) with OverdueTag day count, responsible user + role badge below each node
  - Mobile: vertical left-aligned timeline with inline overdue flagging
  - Info note explaining timeline purpose
  - Campaign metadata card (period, type, version, status)
- **App.tsx additions** (~100 lines):
  - New types: `AuditActionType` (8 values), `AuditObjectType` (3 values), `AuditLogEntry`, `ControlEvent`
  - `AUDIT_ACTION_CONFIG`: 8 action types with bilingual labels, colors, icons (creation/modification/submit_for_approval/approval/rejection/cancellation/set_not_participating/report_sent)
  - `AUDIT_OBJECT_CONFIG`: 3 object types (campaign/line/report) with colors
  - `MOCK_AUDIT_LOG`: 20 entries spanning PROMO-2026-001/002/003/006, 6 users, all 8 action types, realistic status transitions and comments
  - `MOCK_CONTROL_EVENTS`: 15 milestones across 3 campaigns — PROMO-2026-001 (clean, all on time), PROMO-2026-003 (Senior KM approval 3 days overdue), PROMO-2026-005 (in progress, 3 pending milestones)
  - Import + routing for `AuditLogPage`
- **All 8 module pages now render** — no PagePlaceholder remaining
- Production build passes, zero TypeScript errors

## 2026-06-08 — Promo-type Settings Module Implemented
- Created `src/pages/PromoSettings.tsx` (~884 lines) — seventh module, full page
- **Left panel**: searchable rule list with Card per rule — name, promo-type badges, status badge (Черновик/Утверждено/Архив), field count, version, confirmed date. Yellow left border on selected rule. "Создать правило" (yellow primary) + "Копировать" (outline icon) buttons.
- **Right panel**: rule editor with sections:
  - Name input (Наименование правила)
  - Promo-type multi-select: 9 types from `PROMO_TYPE_REFERENCE` with checkbox toggle buttons (yellow tint when selected)
  - Field requirement checklist: 35 fields from `FULL_CALENDAR_FIELDS` grouped by 5 categories (Идентификация/Товар/Продажи/Рассрочка/Маркетинг), collapsible groups with group-level select-all toggle, per-group count badge
  - Effect preview: green info Card — "Для типа X станут обязательными N полей" + explanation of enforcement behavior
  - Change history: expandable timeline with version circles, author/role, summary
- **Actions**: sticky bottom bar with:
  - "Сохранить" (save draft), "Подтвердить" (КД only, Dialog confirmation), "Отправить на подтверждение" (admin, saves + notifies КД)
  - "Архивировать" (destructive Dialog with required reason)
  - Inline validation hints (empty name, no promo types, no fields selected)
- **Confirmation workflow**: rule takes effect only after КД confirms via Dialog. Editing a confirmed rule reverts it to draft with "Требует повторного подтверждения" badge — re-confirmation needed.
- **Role gating**: editing restricted to `commercial_director` + `admin` (NAV_ACCESS updated). Other roles see "Нет доступа" empty state.
- **App.tsx additions** (~160 lines):
  - New types: `PromoRuleStatus`, `FullCalendarFieldDef`, `PromoRuleHistoryEntry`, `PromoRule`
  - `PROMO_RULE_STATUS_CONFIG`: 3 statuses with soft-tint colors
  - `PROMO_TYPE_REFERENCE`: 9 promo types
  - `FULL_CALENDAR_FIELDS`: 35 field definitions mirroring FullCalendar columns, grouped by 5 categories
  - `FIELD_GROUP_CONFIG`: bilingual group names
  - `MOCK_PROMO_RULES`: 3 rules — confirmed (Рассрочка 0-0-12, 10 fields, v2), draft (Скидка стандарт, 8 fields, v1), archived (1+1 старый формат, 7 fields, v3)
  - NAV_ACCESS `"promo-settings"` updated from `["admin"]` to `["admin", "commercial_director"]`
  - Import + routing for `PromoSettingsPage`
- Production build passes, zero TypeScript errors

## 2026-06-08 — Notification Center Implemented
- Created `src/pages/Notifications.tsx` (~320 lines) — sixth module, Sheet overlay (not a full page)
- **Bell + sidebar wiring**: both open the same right-side Sheet instead of navigating to a placeholder page
- **6 notification types**: data_change, campaign_cancelled, line_removed, marketing_reapproval, km_assignment, adv_approval — each with `NOTIFICATION_TYPE_CONFIG` (icon string, colors, bilingual labels)
- **Role-based filtering**: `AppNotification.targetRoles[]` field; notifications filtered by `currentRole` in App component; unread count exposed via AppContext (`notificationCount`, `openNotifications`)
- **Date grouping**: unread items grouped into Сегодня / Вчера / Ранее sections with count badges
- **Per-item acknowledge**: hover reveals check button, marks single item as read
- **Bulk acknowledge**: "Ознакомиться со всем" button in sticky bottom bar marks all visible unread as read
- **Read items**: toggled via "Показать/скрыть прочитанные" button, shown in collapsible "Прочитано / Read" group with muted styling
- **Type filter**: Select dropdown filters by notification type, only shows types present for current role
- **Type badge + icon circle**: each notification has a colored 36px icon circle (left) and type badge chip (top line), version badge (blue mono), datetime (mono), campaign ID + name as clickable link, description, responsible user
- **Dynamic bell badge**: replaces hardcoded "5" — shows role-filtered unread count, hidden when 0. Updated in both top-bar bell and sidebar nav item (expanded + collapsed states)
- **App.tsx additions** (~100 lines): `NotificationType` union, `AppNotification` interface, `NOTIFICATION_TYPE_CONFIG` (6 types), `MOCK_NOTIFICATIONS` (8 items across all types with mixed read/unread states and various targetRoles), `notificationCount` + `openNotifications` added to AppContext, `notifications` state with acknowledge handler
- **Mock data**: 8 notifications — 5 unread (today: data_change + campaign_cancelled + marketing_reapproval; yesterday: km_assignment + line_removed) and 3 read (yesterday: adv_approval; earlier: data_change + km_assignment). Visible count varies by role (category_manager sees 3 unread, admin sees 5)
- Production build passes, zero TypeScript errors

## 2026-06-08 — Department Reports Module Implemented
- Created `src/pages/Reports.tsx` (~1040 lines) — fifth full module
- **3-tab department view**: Маркетинг (33 columns, widest), Закуп (8 cols), Аналитика (8 cols) — field sets match ТЗ Section 7
- **Tab access gated by role**: marketing_staff → Marketing only, purchasing_staff → Purchasing only, analytics_staff → Analytics only, directors + admin → all tabs
- **Campaign selector**: dropdown of campaigns with `sent_to_departments` / `approved_commercial_director` status, shows version badge + received date
- **Marketing tab**: split-pane layout (2 frozen identity cols + scrollable 31 data cols via onScroll sync), "В рекламу (выбрано от маркетинга)" is the sole editable checkbox (marketing_staff/marketing_director only), bulk select/deselect bar, "Сохранить и уведомить КМ" action with toast
- **Purchasing / Analytics tabs**: simple single table, all fields read-only, narrow 8-column layout
- **Versioning**: version badge (blue), "Только изменения" toggle, "История версий" button → VersionHistoryDrawer (reused from App.tsx)
- **Diff highlights**: `cell-added` (green) / `cell-modified` (amber) CSS on changed/added data; cleared after acknowledging
- **Acknowledge flow**: per-line checkboxes + "Ознакомлен" (selected) / "Ознакомиться со всем" buttons in sticky bottom bar. Info note: "Ознакомление не является согласованием" — acknowledgement does not change campaign status
- **Marketing re-approval note**: amber info banner explaining edits to sent data require marketing re-approval
- **Overdue marker**: red badge when report sent < 17 calendar days before campaign start
- **Received timeline**: "получено / received" date note with Clock icon
- **Responsive**: Mode B card list below md with tappable (≥44px) marketing checkbox and acknowledge action per card. Department Tabs collapse to Select on mobile.
- **App.tsx additions** (~200 lines):
  - New types: `DepartmentType`, `ReportLine` (33-field superset for all departments), `DepartmentReport`
  - `MOCK_DEPARTMENT_REPORTS`: 2 campaigns — PROMO-2026-003 (4 lines incl. 1 added + 1 modified) and PROMO-2026-001 (3 lines incl. 2 modified + 1 pre-acknowledged)
  - Import + routing for `ReportsPage`
- Production build passes, zero TypeScript errors

## 2026-06-06 — Change Management Layer Implemented
- **Change Management page** (`src/pages/ChangeManagement.tsx`, ~570 lines) — fourth full module
  - 5-tab view: История версий, Только изменения, Отправки в отделы, Изменения дедлайнов, Отмены
  - Campaign selector dropdown with version/period/item count info
  - Expandable version timeline: numbered version circles, ChangeTypeBadge chips, author+role, field-level diff tables
  - Changes-only tab: aggregate diff table with version, date, nomenclature, field, old→new, change type
  - Department sends tab: incremental send log with sent timestamps and change summaries
  - Deadline changes tab: old→new dates with approval status badges (pending/approved/rejected), initiator tracking
  - Cancellation journal: campaign and line cancellations with reasons, department notification status
  - "Создать корректировку" action (no rollback — explicit design choice per spec)
- **App.tsx enhancements** (~250 lines added):
  - New types: `ChangeType` (5 values), `VersionEntry`, `FieldChange`, `DeadlineChangeRequest`, `CancellationRecord`, `LineChangeStatus`
  - New status: `pending_marketing_reapproval` added to `PromoStatus` + STATUS_CONFIG
  - Config objects: `CHANGE_TYPE_CONFIG` (5 types with icons/colors), `LINE_CHANGE_STATUS_CONFIG`
  - Cancellation fields on `PromoCampaign`: `cancelledAt`, `cancelledBy`, `cancelReason`, `originalStartDate`, `originalEndDate`
  - Rich mock data: `MOCK_VERSION_HISTORY` (3 campaigns, 10 version entries with field-level changes), `MOCK_DEADLINE_CHANGES` (2 entries), `MOCK_CANCELLATIONS` (2 entries)
  - **VersionHistoryDrawer**: expanded from stub to full-featured wide Sheet (sm:max-w-2xl) with 3 view tabs (history/changes/full), version timeline with ChangeTypeBadge chips and author+role badges, diff table with cell-added/cell-modified/cell-removed highlights, department send indicators, "Создать корректировку" bottom action with no-rollback notice
  - **CancelCampaignDialog**: КД-only confirm dialog with required reason, notification preview, destructive variant
  - **DeadlineChangeDialog**: old/new deadline inputs, required reason, approval info (senior leadership required)
  - **ChangeTypeBadge**: 5-type badge with distinct color + icon (Send/Pencil/Plus/Ban/ArrowRight)
  - **LineChangeBadge**: badge for excluded/cancelled_line statuses
  - New nav item "История и изменения" with GitCompareArrows icon, access for admin/КД/Ст.КМ/КМ
- **FullCalendar.tsx enhancements** (~170 lines added):
  - Line cancellation: КМ can exclude lines via ReasonDialog → `lineStatus: "excluded"`, red bg + strikethrough + "исключена" badge, requires КД re-approval
  - CancelCampaignDialog integration: КД can cancel campaigns from group headers
  - "Скрыть отменённое" toggle: filters excluded/cancelled lines, ON by default, shows count badge
  - Correction mode: "Создать корректировку" button appears post-approval, bottom bar shows draft/pending_marketing state badge, submit button text changes
  - Marketing re-approval indicator: amber badge when correction mode is `pending_marketing`
  - Version history per campaign: `v{N}` badge in group header opens VersionHistoryDrawer for that campaign
  - Period change indicator: pencil icon when `originalStartDate` differs, bold period text in right pane header
  - Toast notifications for cancel/exclude actions
- **ShortCalendar.tsx enhancements** (~80 lines added):
  - Campaign detail sheet: version info section (version badge + history count + "История" link to change-history page)
  - КД actions in detail sheet: "Отменить акцию" (red, opens CancelCampaignDialog), "Изменить дедлайн" (amber, opens DeadlineChangeDialog)
  - CancelCampaignDialog and DeadlineChangeDialog wired with toast notifications
  - Version badge `v{N}` next to campaign status in table rows
- **CSS**: diff highlight utilities (`cell-added`, `cell-modified`, `cell-removed`) with green/amber/red left borders and tinted backgrounds
- Production build passes, zero TypeScript errors

## 2026-06-04 — Approvals Module Implemented
- Created `src/pages/Approvals.tsx` (~1520 lines) — third full module
- **Review Queue**: role-aware table (Senior KM sees pending_senior, KD sees pending_kd), columns: № промо, тип, название, КМ, отправлено, SLA-таймер, статус. Mode B card list below md.
- **SLA Timer**: 2-working-day window (Mon–Fri), green/yellow/red states, OverdueTag when exceeded. Holidays not excluded per spec.
- **Auto-escalation visual**: "авто-передано" badge (indigo tint) + system comment when Senior KM doesn't act within 2 working days.
- **Split Review View**: desktop (lg+) side-by-side layout — left pane with read-only submitted lines table (checkbox multi-select, nomenclature + pricing + forecast), right pane with approval chain stepper + action buttons + comment thread. Stacks vertically below lg with collapsible data panel and sticky bottom action bar.
- **Approval Chain Stepper**: 3-step visual (КМ → Ст. КМ → КД) with done/active/skipped/rejected/upcoming states. Auto-forwarded shows "skipped" for Senior KM.
- **Review Actions**: "Согласовать всё" (approve), "Отклонить" / "Отклонить выбранные" (reject with mandatory comment for data, optional for NP). Rejecting any line returns the WHOLE КМ dataset.
- **"Не участвует" full lifecycle**: КМ sets with mandatory reason → Senior KM (2 working days): accept/reject/auto-forward → KD: accept/reject → final status. КД can also set directly (reason optional, КМ cannot override, Ст.КМ notified).
- **Comment Model**: author + role + datetime + text + optional lineIds[]. Mandatory for data rejections, optional for NP rejections. Shown in comment thread and line tooltips (AlertCircle).
- **KD Overdue handling**: records просрочка (days + date) but does NOT block — KD can still act. Shown as red note.
- **KM View** (when role = category_manager): "Мои отправки" list with statuses + rejection feedback, "Установить «Не участвует»" section for unsubmitted campaign assignments.
- **Role gating**: all actions via currentRole — KM submits/sets NP, Senior KM reviews at pending_senior, KD reviews at pending_kd + direct NP, Admin sees all.
- **Mock data**: 12 items seeded across all states (pending_senior ×3, pending_kd ×3, approved ×2, rejected_by_senior ×1, rejected_by_kd ×2, kd_direct_np ×1) with realistic nomenclature lines and comments.
- Added "category_manager" to NAV_ACCESS for "approvals" (KM needs access for submission tracking)
- Wired into App.tsx routing: ApprovalsPage renders for "approvals" nav item
- Production build passes, zero TypeScript errors

## 2026-06-05 — Full Promo Calendar Visual Overhaul
- Rebuilt data grid from single-table-with-sticky to **split-pane layout** (fixed left + scrollable right)
- **Root cause**: `position: sticky` on `<td>` elements fails inside App.tsx's `<main overflow-auto>` nested scroll context
- **Left pane** (530px): 3 frozen columns (ФИО КМ, № промо, Номенклатура), hidden scrollbar, synced vertical scroll
- **Right pane**: all scrollable column groups (Идентификация, Товар, Продажи, Рассрочка, Маркетинг), horizontal + vertical scroll
- **Scroll sync**: `onScroll` handlers keep both panes' `scrollTop` aligned
- Both tables use `border-collapse: separate` so `<th>` headers can stick vertically (`position: sticky; top: 0/40px`)
- Left pane shadow (`3px 0 8px rgba(0,0,0,0.07)`) creates clear visual edge between frozen and scrollable areas
- Campaign group headers rendered in both panes — left shows name/status, right shows ID/dates/controls
- Row height increased to 44px, cell padding to 10px for better readability
- Installment sub-bands (12m/24m/36m) use alternating tint backgrounds
- Added `fc-left-pane` CSS utility in `index.css` to hide left pane scrollbar
- File reduced from ~1650 to ~1265 lines (simpler rendering without sticky workarounds)
- Production build passes, zero TypeScript errors

## 2026-06-04 — Full Promo Calendar Module Implemented
- Created `src/pages/FullCalendar.tsx` (1650+ lines) — most complex module, spreadsheet-like data grid
- **Data grid (Mode A)**: 39 columns, 15 mock rows across 4 campaigns, 20-item 1С nomenclature catalog
- **Rows grouped by campaign**: collapsible group headers with признак badge, № промо, тип, название, период, status badge, row count, "Добавить" button
- **3 frozen sticky columns**: ФИО КМ, № промо, Номенклатура — stay visible during horizontal scroll
- **5 column groups** with visual banding + visibility toggle buttons: Идентификация (4 cols), Товар (3+2 cols), Продажи (2 cols), Рассрочка (15 cols with 12/24/36-month sub-bands), Маркетинг (8 cols)
- **Cell behaviors**: locked fields with Lock icon (себестоимость, розн. цена старая), editable stock with ✏️ pencil icon + warehouse breakdown Popover, required forecast field (red asterisk + validation), gift fields conditional on "1+1" / "Товар в подарок" type, bulk-select checkboxes for "В рекламу"
- **Nomenclature entry**: Command-palette dialog bound to 1С catalog, duplicate detection with warning dialog + persistent "дубль" badge
- **Excel bulk import**: Dialog with template download, drag-drop zone, per-row validation preview (valid/error rows)
- **1С availability**: mock toggle switch, yellow Alert banner when unavailable, «Ожидает проверки 1С» badges, approval blocked until 1С restored
- **Unplanned campaigns**: Dialog with "Новая акция" / "Встроить в плановую" modes, promo type select, date validation (≥3 calendar days)
- **Review feedback**: rejected rows with red-tinted bg + AlertCircle icon + reviewer comment Tooltip
- **Sticky bottom action bar**: validation summary (empty required fields, pending 1С rows) + "Сохранить черновик" + "Отправить на согласование" (disabled until valid, role-gated for KM only)
- **Mobile**: tap row → full-screen "Редактирование строки" Sheet with fields stacked by group sections
- **Bug fix**: circular import crash — `mkRow()` was called at module top level accessing `MOCK_CAMPAIGNS` before App.tsx finished loading; fixed with lazy `buildInitialRows()` inside `useState` callback
- Wired into App.tsx routing: FullCalendarPage renders for "full-calendar" nav item
- Production build passes cleanly, zero TypeScript errors

## 2026-06-02 — Brief Promo Calendar Module Implemented
- Created `src/pages/ShortCalendar.tsx` (1550+ lines) — first module with real content
- **Desktop table** (md+): frozen left columns (№ промо, тип, название) via CSS sticky, period column with day-of-week strip (Пн–Вс), auto-computed deadline (21 calendar days before start) with OverdueTag, per-KM status badge columns with horizontal scroll, aggregated indicator chips (На согл. КД / Принято КД / Не заполн. / Не уч.), auto-computed campaign status badge
- **Plan approval stepper**: mode toggle (Таблица / План акций), 3-step chain ДМ → КД → ОД with completed/active/upcoming visual states, deadline chips (46/21/17 calendar days), role-gated action buttons (Отправить на согласование / Согласовать / Отклонить with ReasonDialog)
- **Campaign detail sheet**: right-side Sheet on row click — per-KM breakdown (avatar, name, category, status), period/deadline, aggregated indicators, "Open in full calendar" link
- **Mobile Mode B** (below md): campaign cards with id + name + status badge + period + deadline + aggregated chips + collapsed KM summary text ("3 принято · 1 не заполн. · 1 не уч.")
- **Data model extensions** in App.tsx: 4 new types (KmPromoStatus, CampaignStatus, PlanStatus, CampaignKmAssignment), 3 new status configs, PromoCampaign extended with optional `kmAssignments` field
- **Mock data enrichment**: 5 planned campaigns with 2–4 KM assignments each (varied statuses), added PROMO-2026-009 (cancelled planned campaign), total 9 campaigns
- **29 named exports** from App.tsx for module consumption (types, configs, primitives, hooks, formatters)
- Filters: only planned campaigns shown (info tooltip), cancelled rows red-tinted + strikethrough, respects existing FilterBar (period, category, status, manager, hideCancelled)
- Production build passes cleanly, zero TypeScript errors

## 2026-06-02 — Application Shell Built
- Initialized Vite 6 + React 18 + TypeScript project
- Configured Tailwind CSS 3 with shadcn/ui CSS variable theme system
- Created 16 shadcn/ui component files (button, badge, card, dialog, sheet, dropdown-menu, select, tooltip, command, scroll-area, avatar, separator, switch, label, input, textarea)
- Built complete application shell in `src/App.tsx` (1500+ lines, single-file artifact):
  - Top bar (56px, ink-dark): texnomart wordmark, global search (Ctrl+K), calendar mode toggle, notifications bell, user/role dropdown
  - Left sidebar (240px → 64px collapse): 7 bilingual nav items with role-based visibility
  - Role switcher: all 9 roles selectable, nav items dynamically filtered by access matrix
  - Shared primitives: BilingualLabel, StatusBadge (9 statuses), OverdueTag, Money, RuDate, ReasonDialog, VersionHistoryDrawer, FilterBar
  - Mock data: 8 promo campaigns across all statuses, 6 category managers
  - Responsive: hamburger Sheet sidebar below lg, bottom nav on phones, collapsible search below md
  - Page placeholders for all 7 modules with FilterBar
- Design system: Manrope (headings) + IBM Plex Sans (body) + IBM Plex Mono (numbers), brand yellow #FFDD2D as accent
- Dev server running at localhost:5173

## 2026-06-02 — Project Initialization
- Analyzed ТЗ v6.0 (33 pages) for Promo Calendar System
- Extracted DOCX and XLSX files to readable text format
- Created initial project documentation (CLAUDE.md, AI_CONTEXT.md, HISTORY.md)
- Identified 10 key modules, 9 user roles, and core business workflows
- Planning phase: framework selection and UI design approach TBD
