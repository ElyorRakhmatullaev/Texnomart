You already have the Foundation (Prompt 0) and App Shell (Prompt 2) loaded. Two updates and a library of reusable patterns:

### CORRECTION — sidebar active state (CANONICAL)
The realized active state is: full primary yellow (#FFD60A) pill background, black icon and text, no left border, radius md. Apply this everywhere a "primary selected" state appears (sidebar items, tab pills, filter chips when selected, segmented controls).

### REUSABLE PATTERN A — PAGE HEADER
Every page begins with a PageHeader, 64px tall, no card chrome, sits directly under breadcrumbs:
- Left: H1 (32/40 Bold) + optional Caption below (12/16 gray-700) showing a counter ("Найдено 1 247 заявок") or a meta note ("Обновлено: 12:34")
- Right cluster (gap-12):
  - Optional Tabs / segmented control for view modes
  - Search input (320px, with Search icon left, ⌘F hint right)
  - Refresh icon Button (ghost)
  - Export DropdownMenu (variant secondary, Download icon + label)
  - Primary CTA Button (e.g. "Создать заявку")

### REUSABLE PATTERN B — FILTER BAR
Sits below PageHeader, on its own row, 56px tall, white surface with a subtle gray-100 background container, radius md, padding 12, gap-8 between controls:
- Filter chips (shadcn Badge variant outline, with chevron-down) — each opens a Popover with the filter options; selected state uses the canonical yellow pill
- "Очистить фильтры" ghost button on the right when ≥1 filter is active
- "Сохранить вид" DropdownMenu on the far right (Bookmark icon) — saves current filter+sort combo with a name
- A subtle horizontal scroll if chips overflow

### REUSABLE PATTERN C — DATA TABLE
Use shadcn Table inside a Card. Defaults:
- Row height: 56px (taller variant 72px when a row has avatar+subtext)
- Header: sticky, gray-100 bg, 12/16 Medium gray-700 uppercase letter-spacing-tight, sortable columns show ArrowUpDown 14px on hover
- Row hover: gray-100 bg, cursor-pointer
- Selected row: primary-tinted bg (rgba(255,214,10,0.08)) + 2px primary left border
- Checkbox column at left (40px wide) — appears on rows when bulk operations are enabled; column header has "select all" checkbox
- Actions column at right (56px wide, sticky) — MoreHorizontal icon button, opens DropdownMenu
- Empty cells: render "—" (em dash) in gray-400, never blank
- Numbers: always tabular-nums, right-aligned
- Long text: truncate with title attribute
- Footer: pagination bar (56px tall) — "Показывать [20 / 50 / 100] строк" Select left, "1–20 из 1 247" caption center, page nav right (ChevronLeft / 1 2 3 ... 62 / ChevronRight)

### REUSABLE PATTERN D — DETAIL DRAWER (right-side)
Use shadcn Sheet, anchored right. Width: 720px (60% on smaller screens, 100% on mobile).
- Header (sticky, 64px): close button (X) on the left, title H3, status Badge inline, action buttons on the right (icon-only ghost buttons + a primary CTA)
- Body: ScrollArea, padding 24, sections separated by Separator with section title (12/16 Medium uppercase gray-700)
- Footer (sticky, 56px, gray-100 bg): secondary actions left, primary action right
- Open via: clicking a row in a data table. Closes on Esc, click-outside, or close button.
- Detail-page alternative: when content is too rich for a drawer (Partners, Branches), use a full route /entity/:id with Tabs instead — note this in each page's prompt.

### REUSABLE PATTERN E — CREATE/EDIT MODAL
Use shadcn Dialog, max-width 560px (forms with 1 column) or 720px (2-column forms).
- Header: title H3 + close X
- Body: padding 24, form fields stacked, gap-16, labels above inputs (14/20 Medium), helper text below input (12/16 gray-700), error text below input (12/16 danger)
- Footer (gray-100 bg, padding 16): "Отмена" Button (variant ghost) left, primary "Сохранить" / "Создать" Button right
- All forms use inline validation, disable submit until valid, show loading state on submit

### REUSABLE PATTERN F — BULK ACTIONS TOOLBAR
Appears on top of the data table when ≥1 row is selected, replacing the page header. Smooth slide-down 200ms.
- Black bg (#0A0A0A), white text, 56px tall, radius md, padding 16, shadow-lg
- Left: "Выбрано: 3" + "Снять выделение" link (primary yellow text)
- Right: action buttons (icon + label, variant ghost on dark): Export, Deactivate, Delete, etc.

### REUSABLE PATTERN G — CONFIRMATION DIALOG
Use shadcn Dialog, max-width 440px. For any destructive or irreversible action.
- Icon top-left (AlertTriangle 24px in semantic color — danger for delete, warning for deactivate)
- Title H3 + Body M description
- For typed-confirmation (delete partner / delete user): require typing the entity name
- Footer: "Отмена" ghost + destructive primary ("Удалить" danger variant)

### REUSABLE PATTERN H — STATUS BADGE SYSTEM
Single source of truth. Use shadcn Badge with these tokens:

| Domain | Status | BG | Text |
|---|---|---|---|
| Application | Новая | gray-200 | gray-900 |
| Application | На скоринге | info @ 15% | info |
| Application | Одобрена | success @ 15% | success |
| Application | Частично одобрена | #DCFCE7 | success |
| Application | Отклонена | danger @ 15% | danger |
| Application | В работе у оператора | warning @ 15% | warning |
| Application | Ожидает документы | #FFEDD5 | #C2410C |
| Application | Подписан договор | #DCFCE7 | #166534 |
| Application | Завершена | success @ 10% | #65A30D |
| Application | Отменена | gray-100 | gray-700 |
| Application | Просрочена | #FEE2E2 | #991B1B |
| User/Entity | Активен | success @ 15% | success |
| User/Entity | Деактивирован | gray-100 | gray-700 |
| User/Entity | Заблокирован | danger @ 15% | danger |
| API health | Онлайн | success | white |
| API health | Офлайн | danger | white |
| API health | Деградация | warning | gray-900 |
| Client flag | VIP | primary | primary-foreground |
| Client flag | Чёрный список | danger | white |

All Badges: padding 4×8, radius full, 12/16 Medium, no shadow. Filled or tinted variants only — never outlined for statuses.

### REUSABLE PATTERN I — UNIFIED STATES (every list and detail view)
- Loading: shadcn Skeleton blocks matching the final shape (NEVER spinners). Show for ≥250ms even if data arrives faster, to avoid flashes.
- Empty (no results): Lucide Inbox icon 48px gray-400 + H3 "Ничего не найдено" + Body M (page-specific message) + primary Button (page-specific CTA like "Создать заявку")
- Empty (no filter results): Lucide SearchX icon 48px + "По вашим фильтрам ничего не найдено" + "Сбросить фильтры" Button (variant secondary)
- Error: Lucide WifiOff icon 48px + "Не удалось загрузить" + "Повторить" Button + caption "Если ошибка повторяется, обратитесь к администратору"

### REUSABLE PATTERN J — DETAIL VIEW SUB-COMPONENTS
- InfoRow: 2-column key/value, 8 gap, label 12/16 gray-700 left (160px fixed), value 14/20 Medium black right (flex-1). Used inside detail drawers.
- Timeline: shadcn vertical stepper. Each step: 24px dot (filled when complete, ring when current, gray when pending) + line connector (2px gray-200, primary when complete) + content card (title 14 SemiBold, caption 12/16 gray-700 with time).
- Tabs (inside detail pages): horizontal underline tabs, 48px tall, active gets 2px bottom border primary + black label; inactive gray-700 label. Counter Badges allowed beside labels.

Confirm understanding of the addendum and patterns A–J, then wait for the Master Prompt 1a.