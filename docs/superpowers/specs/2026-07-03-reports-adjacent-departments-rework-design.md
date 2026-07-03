# E-1 — «Отчёты смежным отделам» rework (design)

> Date: 2026-07-03
> Module: Texnomart **Promo**, S5 `/reports` (`Promo/src/app/components/reports/`)
> Source: 5th-part client feedback, section «Отчёты смежным отделам» (items §1–§3)
> Scope: **Promo-local only** — no changes to `@texnomart/shared` or Dashboard.
> Part of the E-series (5th-part feedback). Build order: **E-1 Reports** → E-2 Notifications → E-3 Audit → E-4 Users.

## Goal

Rework the read-only department reports screen so sm. departments (Маркетинг / Закуп / Аналитика)
see promo data in the same field composition and order as the full promo-calendar, can filter every
displayed column, export a real `.xlsx` honoring filters, clearly see what **changed** since the previous
sent version (added / changed / excluded nomenclature, with per-cell before→after detail), acknowledge those
changes per-user, and browse prior report versions as read-only snapshots — all under the unified table
styling (sticky header, synced top+bottom scroll, unified gridlines) already used by the calendar screens.

## Decisions locked in brainstorming

1. **Fields** — report columns are **derived from the full-calendar dictionary `gridFields.ts`** (single source
   of truth), filtered to each department's subset. Order/labels/formatting therefore always match the full
   calendar, and fields added in the last full-calendar round (**Бренд**, **Наличие в магазинах, %**) flow into
   the Marketing report automatically.
2. **Filters** — **one filter per visible column**, typed by column kind; the available filter set mirrors the
   currently-displayed columns.
3. **Identity** — **deterministic seeds** (keep the god-mode role switcher + representative КМ). Per-user
   acknowledgement is real (localStorage, keyed to the logged-in user); the "who acknowledged" roster is seeded.
4. **Export** — **real `.xlsx`** via SheetJS (new `xlsx` dependency in Promo).
5. **Table** — rewrite onto the **band-layout Pattern-F split pane**; freeze **«Изменение» + «Номенклатура»**,
   scroll the value columns.

---

## Feature design

### A. Table (§3) — band-layout Pattern-F split pane

Replace the plain `<table>` in `DepartmentReportView` with the band-layout used by
`ShortCalendarTable` / `FullCalendarGrid` / `ReviewQueueTable`:

- **Two synced panes.** Frozen left pane = **«Изменение»** + **«Номенклатура»** (row identity). Scrolling right
  pane = the department's value columns (+ trailing **«Ознакомление»** column).
- **Sticky page header** (`sticky -top-4`, `overflow-clip` Card) carrying a **synced TOP horizontal scrollbar**
  over the column titles; a **bottom scrollbar** under the body. Three scrollers (top + header + body) kept in
  sync via idempotent `scrollLeft` writes + `ResizeObserver` (same implementation as the calendar tables).
- **Unified gridlines** — `border-r` column dividers + `border-b` row dividers; darker-gray **bold** header.
- **Fixed row height** on both panes (Pattern-F invariant), variable only where a line has choice-gift sub-rows
  (reuse the full-calendar approach if such lines appear in a report; otherwise fixed).
- **Mobile (< md)** — Mode-B cards (as today): a card per line showing «Изменение» plashka, key fields, and the
  «Ознакомиться» action.

### B. Columns — derived from `gridFields.ts`

- `reportFields.ts` becomes a **projection over `gridFields` `COLUMNS`** rather than a hand-authored parallel
  dictionary. A per-department **allow-list of `gridFields` column ids** (Marketing = wide subset incl. `brand`,
  `storeAvailability`, installment block, both «В рекламу»; Закуп + Аналитика = компенсация subset) selects and
  orders columns; labels, widths, kind (text/number/money/percent/date/checkbox), and formatting come from
  `gridFields`. Value accessors reuse the existing report accessors / mock helpers.
- **Leading columns:** «Изменение» (new, see C) → «Номенклатура» (frozen).
- **Trailing column:** «Ознакомление» (new, see G).
- The Marketing group-header row (category bands) is preserved, derived from the `gridFields` `group` metadata.

### C. Change model (§2) — Добавлено / Изменено / Исключено

Extend the seeded change model:

```ts
// promo-mock-data.ts
interface ReportCellChange {
  lineId: string;
  fieldId: string;          // gridFields column id
  prevValue: string;        // preformatted display string
  newValue: string;         // preformatted display string
  changedAt: Date;
}
interface ReportChangeSet {
  addedLineIds: string[];
  removedLineIds: string[];   // NEW — excluded nomenclature (kept in the report)
  changedCells: ReportCellChange[];  // NEW shape — was bare `${lineId}:${fieldId}` strings
}
```

Rendering:

- **«Изменение» column** — a colored plashka per row:
  - green **«Добавлено»** — line in `addedLineIds` (new nomenclature this version);
  - amber **«Изменено»** — line has ≥1 `changedCells` entry this version;
  - red **«Исключено»** — line in `removedLineIds`; the row is **kept** in the report, struck-through, so the
    department sees the position no longer participates;
  - empty (no plashka) — unchanged line.
- **Changed-cell highlight + tooltip** — for «Изменено» rows, only the changed cells get the amber background +
  inset ring; hovering shows a tooltip **«Было: {prevValue} → Стало: {newValue} · {DD.MM.YYYY HH:MM}»**.
- **Header counters** — replace the single «Новых/изменённых: N» badge with **three counters**:
  **«Добавлено: N · Изменено: N · Исключено: N»** reflecting the **current version's total change composition**
  (stable — not decremented by acknowledgement), alongside a **«Всего позиций: N»** count (per the screenshot).
  The unacknowledged count lives only on the **«Ознакомиться со всеми изменениями (N)»** button (see G).
- **Toggle rename** — «Только изменённые» → **«Только изменения»**; when on, show only lines that are added,
  changed, or excluded **in the current version vs the previous sent version**.

### D. Per-column filters (§1)

- A collapsible **«Фильтры»** panel (new `ReportFilters.tsx`), toggled from the header (matching the
  short-calendar «Фильтры» toggle + active-facet count badge).
- **One filter per visible column**, auto-generated and typed by the column's `gridFields` kind:
  - text → search input (substring);
  - enum-like (тип, признак, and any small fixed-domain field) → multi-select;
  - number / money / percent → **min–max** range;
  - date → **date-range**.
- Plus two synthetic-column filters: **«Изменение»** (multi-select Добавлено/Изменено/Исключено/Без изменений)
  and **«Ознакомление»** (Ознакомлен / Не ознакомлен — for the current user).
- Filters appear/disappear together with their columns (so "состав фильтров = отображаемые поля").
- **«Сбросить фильтры»** — clears all filters and returns the default column visibility + «Только изменения» off.
- A **«Показано: N позиций»** counter reflects the filtered row count.

### E. Export — real `.xlsx` (§1)

- Add **`xlsx` (SheetJS)** to `Promo/package.json`.
- New `report-xlsx.ts` (or a function in `promo-export.ts`): build a workbook with **one sheet** named for the
  department, columns = **currently-visible (filtered) columns** including «Изменение», rows = **currently-filtered
  rows** respecting the **«Только изменения»** toggle. Cell values are the same preformatted display strings the
  table shows. Cyrillic-safe (SheetJS handles UTF-8 natively).
- The **«Экспорт»** button re-enabled in the report `PageHeader` (currently `showExport={false}`), wired to this.

### F. Version history + per-version snapshot (§2)

- **Seed an explicit row-snapshot per version** (deterministic — not diff-replay). Each seeded `CampaignVersion`
  gains (or is paired with) the full `CampaignReportRow[]` as of that version.
- The **«История версий»** view (in `VersionHistoryDrawer`) lists versions (№, date/time, sender, brief change
  description). **Clicking a version** renders that version's snapshot **read-only** in the "Полный актуальный
  отчёт"-style view.
- The **current (latest) version** is marked distinctly — **«Текущая версия»** badge + highlight.
- Keep the existing «Только изменения» and live-snapshot views in the drawer.

### G. Per-user acknowledgement + "who acknowledged" (§2)

- New localStorage store **`promo:report-ack`** (`report-ack-store.ts`, mirrors `users-store` / `audit-store`).
  Acknowledgement recorded per **(campaignId, department, version, lineId, userId)**, keyed to the logged-in user
  via `useCurrentUser`. Survives reload; **resets per version** (a new sent version re-raises acknowledgement).
- **Per-row** action **«Ознакомиться» → «Ознакомлен»** on changed/added/excluded rows; acknowledging clears that
  row's highlight **for the current user only**.
- **Header** action **«Ознакомиться со всеми изменениями (N)»** — acknowledges every changed/added/excluded line
  of the current version for the current user.
- Acknowledgement is explicitly **not** approval and does **not** change the campaign status (keep the existing
  «Ознакомление не является согласованием…» banner, §11.7).
- **Seed a department roster + partial acknowledgements** so the detail view shows a realistic mix.
- **"Кто ознакомился" detail** — a new drawer/dialog (`ReportAcknowledgeDrawer.tsx`) visible only to the
  **responsible manager / Администратор** (role-gated): lists each changed/added/excluded line and, per line, the
  department users who acknowledged it + timestamp (and who hasn't).

---

## Data / seed changes (`lib/promo-mock-data.ts`)

- `ReportChangeSet` extended: `+ removedLineIds`, `changedCells` becomes `ReportCellChange[]` with
  prev/new/`changedAt`.
- Per-version **row snapshots** attached to the seeded `CampaignVersion` chains (UN-2026-015, PR-2026-003).
- A **department user roster** seed (reuse `users-store` users where possible; otherwise a small seed) so
  "who acknowledged" has people to list, with partial acknowledgements seeded.
- `getReportChangeSet` updated to the new shape; excluded lines derived from existing `line.removed` where
  present, promoted into `removedLineIds`.

## Files touched (all Promo-local)

| File | Change |
|---|---|
| `reports/DepartmentReportView.tsx` | Rewrite to band-layout split pane; «Изменение» + «Ознакомление» columns; counters; tooltip; mobile cards |
| `reports/ReportsPage.tsx` | Filter state + panel wiring; export; ack-store wiring; who-acknowledged drawer host; «Только изменения» rename |
| `reports/reportFields.ts` | Project columns from `gridFields` per department (allow-list + order) |
| `reports/ReportFilters.tsx` | **New** — collapsible per-column typed filter panel + «Сбросить фильтры» |
| `reports/ReportAcknowledgeDrawer.tsx` | **New** — "кто ознакомился" detail (role-gated) |
| `lib/report-ack-store.ts` | **New** — `promo:report-ack` per-user acknowledgement store |
| `lib/promo-mock-data.ts` | Extend `ReportChangeSet`; seed per-version snapshots, removed lines, per-cell payloads, department roster |
| `lib/report-xlsx.ts` (or `promo-export.ts`) | **New** — SheetJS `.xlsx` export honoring filters + «Только изменения» |
| `components/VersionHistoryDrawer.tsx` | Clickable per-version snapshot + «Текущая версия» marker |
| `Promo/package.json` | `+ xlsx` (SheetJS) |

No `@texnomart/shared`, `@texnomart/ui`, or Dashboard changes.

## Proposed phasing (each phase ends on a green `build:promo`)

- **Phase 1 — Fields & table shell.** `reportFields` derived from `gridFields`; band-layout split pane (§3
  sticky header, synced top+bottom scroll, gridlines) + mobile cards. No behavior change to data yet.
- **Phase 2 — Change model & display.** Extend `ReportChangeSet`; «Изменение» column + plashki; changed-cell
  highlight + tooltip; three counters; «Только изменения» rename + filter semantics; excluded rows kept.
- **Phase 3 — Filters & export.** Per-column typed filter panel + «Сбросить фильтры» + «Показано: N»; SheetJS
  `.xlsx` export honoring filters + «Только изменения».
- **Phase 4 — Versions & acknowledgement.** Per-version seeded snapshots + clickable version + «Текущая версия»
  marker; `report-ack-store` per-user acknowledgement (row + all-N); "кто ознакомился" role-gated detail drawer.

## Acceptance criteria

- Each department report shows the full-calendar field subset in full-calendar order; Marketing includes Бренд
  and Наличие в магазинах, %.
- Every visible column has a working, correctly-typed filter; «Сбросить фильтры» restores defaults; hidden
  columns' filters disappear.
- «Экспорт» downloads a real `.xlsx` whose columns/rows match the current filters and «Только изменения» state.
- «Изменение» column shows Добавлено/Изменено/Исключено; excluded rows remain (struck); changed cells highlight
  with a before→after + timestamp tooltip; header shows the three separate counters; toggle reads «Только
  изменения».
- «История версий» lists versions; clicking one opens its read-only snapshot; the current version is marked.
- Per-row «Ознакомиться» and header «Ознакомиться со всеми изменениями (N)» record acknowledgement for the
  logged-in user (persisted, per-version), clearing that user's highlight; a responsible-manager/Администратор
  can open a "кто ознакомился" detail.
- §3 styling: sticky header, synced top+bottom scrollbars, unified gridlines; works on laptop + monitor widths;
  mobile cards below md.
- `build:promo` and `build:dashboard` pass; no `@texnomart/shared`/Dashboard diff.

## Out of scope / mock limits

- Per-user acknowledgement is per-browser localStorage (no backend); "who acknowledged" rosters are seeded.
- Version snapshots are seeded, not reconstructed from live in-session edits; unseeded campaigns show a single
  current version.
- Export reflects only the visible/filtered rows of the current department + campaign.
- No runtime i18n (RU only); god-mode role switcher stays the demo driver (no per-person promo attribution beyond
  the seeded rosters).
- This spec covers **E-1 only**; E-2/E-3/E-4 (Notifications / Audit / Users) get their own spec → plan cycles.
