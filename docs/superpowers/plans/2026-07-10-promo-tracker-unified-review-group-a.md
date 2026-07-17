# Promo Tracker Unified-Review — Group A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address the 9 actionable follow-ups the BA raised on 08.07.2026 in the unified comment tracker («Трекер комментариев … единая вкладка»), all concentrated in the short-calendar (S1) review of sections «Краткий V1» + «Краткий V2».

**Architecture:** All changes are **Promo-local** (`Promo/src/**`). No `@texnomart/shared` or `@texnomart/ui` edits (Dashboard must stay unaffected). Table refinements follow the existing **Pattern F band-layout** (`ShortCalendarTable.tsx`) — a page-sticky header band over a body pane, with horizontal scrollers kept in sync via `scrollLeft` mirroring. Exports reuse the existing SheetJS helpers (`report-xlsx.ts` / `users-xlsx.ts`). № промо display reuses the existing `formatPromoNo(id)` helper.

**Tech Stack:** React 18 + TypeScript, Vite 6, Tailwind v4, shadcn/ui via `@texnomart/ui`, SheetJS (`xlsx`, already a Promo dep), lucide-react, date-fns/ru.

## Global Constraints

- **Promo-local only.** Do NOT edit `packages/ui/**` or `packages/shared/**`. Verify Dashboard is untouched (no shared diffs).
- **No unit-test harness in this repo.** `vite build` is **transpile-only** (esbuild, no `tsc`) — it does NOT catch type errors. Verification per task = (1) `corepack pnpm --filter promo build` green, (2) in-browser QA via Playwright MCP at **1440px and 390px**, driving the exact acceptance check. Types are verified by careful reading + QA, never by the build alone.
- **Commands run via corepack:** `corepack pnpm --filter promo build` and `corepack pnpm dev:promo` (pnpm is not on PATH; the root `build:promo` re-invokes bare `pnpm` and fails — always use `--filter promo`).
- **Colors:** exact hex via `style={{}}` OR semantic tokens (`text-muted-foreground`, `text-emerald-700`) + `dark:` variants. Never Tailwind arbitrary color classes like `bg-[#FFD60A]`. Brand `#FFD60A` preserved.
- **Russian UI text.** Dates via `<RuDate>`/date-fns `ru`. Numbers `toLocaleString("ru-RU")` + `tabular-nums`.
- **Tables = Pattern F** (two synced divs), never `position:sticky` on a `<td>`. **Lesson:** `overflow-x:auto` silently forces `overflow-y:auto` (one-axis-non-visible quirk) — an inner horizontal-scroll container traps a `sticky` header, which is why the header is a separate band pinned to the PAGE scroll (`sticky -top-4`).
- **Commit to `main`** directly (no feature branches in this repo). One commit per task.
- **Mock data is session-local** — reloads reseed. Do not add persistence unless a task says so (Task 12 adds «План акций» persistence deliberately).
- **Scope note on «уже сделано»:** tracker items V2-14…18 are already resolved by the 2026-07-10 «6-я часть» work; A6 (sidebar collapse) is already in the shared shell. Those are QA-only (Tasks 9–10), NOT re-implementation. Sections 3–6 of the tracker are prior-doc rows the BA has not re-reviewed and are already built in the mock — OUT OF SCOPE for this plan.

---

## File Structure

| File | Responsibility | Tasks |
|---|---|---|
| `Promo/src/app/components/short-calendar/ShortCalendarTable.tsx` | S1 grid: distribution sub-row filtering (A1), density/wrap (A2), sticky-bottom scroll (A5), report-send plashka (A8) | 1, 3, 4, 2 |
| `Promo/src/app/components/short-calendar/CalendarFilters.tsx` | S1 filter block: new «Отправка смежным отделам» filter (A8) | 2 |
| `Promo/src/app/components/short-calendar/ShortCalendarPage.tsx` | S1 filter application: pass dist filter to table (A1), apply report-send filter (A8) | 1, 2 |
| `Promo/src/app/components/short-calendar/PlanApprovalTable.tsx` | «План акций» table → page-sticky header band (A9) | 5 |
| `Promo/src/app/components/reports/ReportsPage.tsx` + `DepartmentReportView.tsx` | Reports adaptive full-width (A3) | 6 |
| `Promo/src/lib/audit-xlsx.ts` (new) + `audit/*` wiring | Аудит-лог export (A4) | 7 |
| `Promo/src/lib/permissions-xlsx.ts` (new) + `permissions/PermissionsMatrixPage.tsx` | Матрица прав export (A4) | 7 |
| Full-calendar / approvals / reports display surfaces | `26-N` № промо in the surfaces V2-9 names (A7) | 8 |

---

## Task order & mapping to tracker

1. **A1** 🐛 Distribution-filter sub-rows (V1-1b) — a real defect, do first
2. **A8** «Отправка смежным отделам» filter + example-accurate plashka (V2-12)
3. **A2** Column density + text wrap for Тип/Название (V1-3.3)
4. **A5** Sticky-**bottom** horizontal scrollbar, **keeping** the top one (V2-1; user decision 2026-07-10)
5. **A9** Sticky header on «План акций» tab (V2-13)
6. **A3** Adaptive full-width tables — Reports first (V1-3.4)
7. **A4** Export in Аудит-лог + Матрица прав (V1-8)
8. **A7** Unified `26-N` № промо in the V2-9-named surfaces (V2-9)
9. **A6** Verify sidebar collapse already works (V2-8) — QA only
10. **QA** Re-verify V2-14…18 already resolved by «6-я часть» — QA only
11. **A10** Role-gate «Срок отчёта» + «Отправка смежным отделам» columns/filter (V2-12 strict; user decision 2026-07-10)
12. **A11** Persist «План акций» lifecycle to localStorage (user decision 2026-07-10)

---

### Task 1: A1 — Filter distribution sub-rows inside the row (bug fix)

**Bug (tracker V1-1, «Частично сделано»):** selecting a День недели / Категория / Ответственный КМ in «Распределение по категориям» filters which *campaigns* appear (page-level, correct) but the expanded block still renders **all** of a campaign's distribution entries, so non-matching days/categories/КМ stay visible. The row-level sub-rows are never filtered.

**Root cause:** `ShortCalendarTable` builds `groupDistribution(c.categoryDistribution ?? [])` from the full array (line ~303) — it never receives the active distribution filter. `ShortCalendarPage`'s `filtered` memo (lines ~131-146) filters campaigns only.

**Files:**
- Modify: `Promo/src/app/components/short-calendar/ShortCalendarTable.tsx`
- Modify: `Promo/src/app/components/short-calendar/ShortCalendarPage.tsx:308-316` (pass new props)

**Interfaces:**
- Produces: `ShortCalendarTableProps` gains `distFilter?: { weekday: string; category: string; km: string }` (values are the same `distWeekday`/`distCategory`/`distKm` strings, `"all"` = no filter). Consumed only by the table.

- [ ] **Step 1: Define the acceptance check (reproduce the bug)**

Run `corepack pnpm dev:promo`, log in, open `/short-calendar`, expand «Распределение по категориям», pick a single Категория that appears in only some sub-rows of a campaign that has ≥2 distinct categories. Confirm the OTHER categories' sub-rows still render (this is the bug). This is the behavior Step 4 must eliminate.

- [ ] **Step 2: Add the `distFilter` prop + per-row filtering in `ShortCalendarTable.tsx`**

Extend the props interface:

```tsx
interface ShortCalendarTableProps {
  campaigns: PromoCampaign[];
  onRowClick: (id: string) => void;
  expanded: boolean;
  kmStatusFilter?: string;
  onKmStatusClick?: (campaignId: string, kmId: string, status: KmStatus) => void;
  /** Active «Распределение по категориям» filter (§V1-1) — restricts which
   *  sub-rows render inside the expanded block. "all" = no restriction. */
  distFilter?: { weekday: string; category: string; km: string };
}
```

Destructure `distFilter` in the component signature. Before building groups per row, filter the entries with a pure helper (add near `groupDistribution`):

```tsx
function matchesDistFilter(
  e: CategoryDistributionEntry,
  f?: { weekday: string; category: string; km: string }
): boolean {
  if (!f) return true;
  if (f.weekday !== "all" && String(e.date.getDay()) !== f.weekday) return false;
  if (f.category !== "all" && e.category !== f.category) return false;
  if (f.km !== "all" && e.responsibleKmId !== f.km) return false;
  return true;
}
```

Then in the body render replace `const groups = groupDistribution(c.categoryDistribution ?? []);` with:

```tsx
const entries = (c.categoryDistribution ?? []).filter((e) =>
  matchesDistFilter(e, distFilter)
);
const groups = groupDistribution(entries);
const hasDist = groups.length > 0;
```

Also apply the same filter where `rowHeights` is computed (line ~123-128) so the row height matches the *filtered* count, not the raw count:

```tsx
const rowHeights = campaigns.map((c) => {
  const entries = (c.categoryDistribution ?? []).filter((e) =>
    matchesDistFilter(e, distFilter)
  );
  const n = entries.length;
  const distH = expanded && n > 0 ? n * SUBROW_H : 0;
  const readinessH = expandedReadiness.has(c.id) ? READINESS_EXPANDED_H : 0;
  return Math.max(BASE_ROW_H, distH, readinessH);
});
```

(Add `distFilter` to the `useLayoutEffect` measure deps array so the top-scrollbar re-measures when the filter changes width.)

- [ ] **Step 3: Pass the filter from `ShortCalendarPage.tsx`**

In the desktop `<ShortCalendarTable …>` (lines ~308-316) add:

```tsx
distFilter={{
  weekday: filters.distWeekday,
  category: filters.distCategory,
  km: filters.distKm,
}}
```

- [ ] **Step 4: Build + QA**

Run: `corepack pnpm --filter promo build` → Expected: green.
Browser QA at 1440px: repeat Step 1's scenario — only sub-rows matching the selected Категория/День/КМ now render; row heights collapse to the filtered count; the frozen pane stays row-aligned with the scroll pane. Clear the filter → all sub-rows return.

- [ ] **Step 5: Commit**

```bash
git add Promo/src/app/components/short-calendar/ShortCalendarTable.tsx Promo/src/app/components/short-calendar/ShortCalendarPage.tsx
git commit -m "fix(promo): S1 filter distribution sub-rows by active день/категория/КМ (tracker V1-1)"
```

---

### Task 2: A8 — «Отправка смежным отделам» filter + example-accurate plashka

**Tracker V2-12 («Частично сделано»):** (1) no dedicated «Отправка смежным отделам» filter — add one with «Все статусы / Отправлено / Не отправлено»; (2) the status cell must match the reference exactly: on-time → green «Отправлено» + gray date + **green check**; late → green «Отправлено» + gray date + **red «+N дн.»** and **NO green check**; not sent → red «Не отправлено».

Current state: the column exists (`ShortCalendarTable.tsx` lines ~462-487) and `getReportSendStatus` already returns `{ sent, sentAt, versionNo, deadline, overdueDays }` with `overdueDays > 0` only on late send. The plashka currently shows a green check whenever `sent` (regardless of lateness) and puts «Не отправлено» as muted text (not a red plashka). No filter exists.

**Files:**
- Modify: `Promo/src/app/components/short-calendar/CalendarFilters.tsx` (new filter facet)
- Modify: `Promo/src/app/components/short-calendar/ShortCalendarPage.tsx` (apply the filter)
- Modify: `Promo/src/app/components/short-calendar/ShortCalendarTable.tsx` (plashka rendering; desktop + it's already reused; mobile card lives in ShortCalendarPage `MobileCampaignCard`)

**Interfaces:**
- Produces: `CalendarFilterValues` gains `reportSend: string` where value ∈ `{ "all", "sent", "not-sent" }` (`ALL` = "all"). `DEFAULT_FILTER_VALUES.reportSend = ALL`. `countActiveFilters` counts it when `!== ALL`.

- [ ] **Step 1: Add the `reportSend` facet to `CalendarFilters.tsx`**

In `CalendarFilterValues` add `reportSend: string;` (under Контрольные). In `DEFAULT_FILTER_VALUES` add `reportSend: ALL,`. In `countActiveFilters` add `if (v.reportSend !== ALL) n += 1;`. Add a constant near `KM_STATUSES`:

```tsx
const REPORT_SEND_OPTIONS: Option[] = [
  { value: "sent", label: "Отправлено" },
  { value: "not-sent", label: "Не отправлено" },
];
```

Render it inside the «Контрольные» `<Group>` (after the Период акции range), so control filters group together (§V1-1 filter grouping):

```tsx
<FilterSelect
  label="Отправка смежным отделам"
  placeholder="Все статусы"
  value={values.reportSend}
  onChange={(v) => onChange("reportSend", v)}
  options={REPORT_SEND_OPTIONS}
  width="w-[210px]"
/>
```

- [ ] **Step 2: Apply the filter in `ShortCalendarPage.tsx`**

Import `getReportSendStatus` is already present. In the `filtered` memo, after the period-range checks, add:

```tsx
// Отправка смежным отделам (§V2-12)
if (filters.reportSend !== ALL) {
  const sent = getReportSendStatus(c).sent;
  if (filters.reportSend === "sent" && !sent) return false;
  if (filters.reportSend === "not-sent" && sent) return false;
}
```

- [ ] **Step 3: Rework the plashka in `ShortCalendarTable.tsx` (desktop cell ~462-487)**

Replace the «Отправка смежным отделам» cell body so the green check appears ONLY on-time and «Не отправлено» is a red plashka:

```tsx
{report.sent ? (
  <>
    <span className="inline-flex w-fit items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-sm font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
      Отправлено
      {report.overdueDays === 0 && (
        <CheckCircle2 className="size-3.5 shrink-0" />
      )}
    </span>
    <span className="flex flex-wrap items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
      <RuDate value={report.sentAt!} /> · в.{report.versionNo}
      <OverdueTag days={report.overdueDays} />
    </span>
  </>
) : (
  <span className="inline-flex w-fit items-center rounded-md bg-red-50 px-1.5 py-0.5 text-sm font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">
    Не отправлено
  </span>
)}
```

`OverdueTag` already renders nothing when `days === 0` and a red «+N дн.» when `> 0`, so it covers the late branch. `CheckCircle2` is already imported.

- [ ] **Step 4: Mirror the plashka in the mobile card (`ShortCalendarPage.tsx` `MobileCampaignCard` ~379-389)**

Apply the same rule — green check only when `report.overdueDays === 0`, and a red «Не отправлено» plashka:

```tsx
<div className="flex flex-wrap items-center gap-1.5">
  <span>Отправка смежным:</span>
  {report.sent ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
      Отправлено
      {report.overdueDays === 0 && <CheckCircle2 className="size-3 shrink-0" />}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">
      Не отправлено
    </span>
  )}
</div>
{report.sent && (
  <div className="flex flex-wrap items-center gap-1.5 text-xs tabular-nums">
    <RuDate value={report.sentAt!} /> · в.{report.versionNo}
    <OverdueTag days={report.overdueDays} />
  </div>
)}
```

Add `import { CheckCircle2 } from "lucide-react";` to `ShortCalendarPage.tsx` if absent.

- [ ] **Step 5: Build + QA**

Run: `corepack pnpm --filter promo build` → green.
QA at 1440px + 390px: the «Отправка смежным отделам» filter shows «Все статусы / Отправлено / Не отправлено» and narrows the list; a sent-on-time row shows green «Отправлено» plashka + green check; a sent-late row (there is one seeded) shows green «Отправлено» + red «+N дн.» + **no** check; a not-sent row shows a red «Не отправлено» plashka; the «Фильтры» badge count increments when the filter is set.

- [ ] **Step 6: Commit**

```bash
git add Promo/src/app/components/short-calendar/CalendarFilters.tsx Promo/src/app/components/short-calendar/ShortCalendarPage.tsx Promo/src/app/components/short-calendar/ShortCalendarTable.tsx
git commit -m "feat(promo): S1 «Отправка смежным отделам» filter + example-accurate plashka (tracker V2-12)"
```

---

### Task 3: A2 — Column density + text wrap for Тип промо / Название акции

**Tracker V1-3.3 («Частично сделано»):** date/срок columns («Период акции», «Крайний срок заполнения КМ», «Срок отчёта») carry too much empty width → make them compact; «Тип промо» and «Название акции» truncate → enable text wrap so the full value is readable; redistribute freed width to text columns.

Current widths in `ShortCalendarTable.tsx`: № промо `104`, Тип `120` (`truncate`), Название `200` (`truncate`), Период `170`, Крайний срок `160`, Срок отчёта `140`. Wrapping needs the row to grow, but the base row height is fixed (`BASE_ROW_H = 80`) and shared across both panes — a two-line Название fits within 80px, so no height change is needed if we clamp to 2 lines.

**Files:**
- Modify: `Promo/src/app/components/short-calendar/ShortCalendarTable.tsx` (header widths + frozen-pane cells + scroll-pane date columns)

**Interfaces:** none (self-contained CSS/width changes).

- [ ] **Step 1: Narrow the date/срок columns (header + body must match)**

In BOTH the header row and the body cells, change:
- «Период акции» `w-[170px]` → `w-[150px]`
- «Крайний срок заполнения КМ» `w-[160px]` → `w-[132px]`
- «Срок отчёта» `w-[140px]` → `w-[120px]`

There are two places per column (header `<span>` and body `<div>`); update all. Keep the `px-3` padding but the tabular date («DD.MM.YYYY») fits ~120px.

- [ ] **Step 2: Enable 2-line wrap on Тип промо + Название акции (frozen pane)**

Widen and switch from `truncate` to a 2-line clamp. In the header (frozen `frozenHeadRef` block ~210-213): `Тип промо` `w-[120px]` → `w-[132px]`, `Название акции` `w-[200px]` → `w-[240px]`. In the frozen body cells (~277-287):

```tsx
<span className="w-[132px] text-sm leading-tight text-gray-700 dark:text-gray-200 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
  {c.type}
</span>
<span
  className={cn(
    "w-[240px] text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden",
    c.cancelled && "text-red-700 line-through dark:text-red-300"
  )}
>
  {c.name}
</span>
```

Adjust the frozen pane's `items-center` (it already centers vertically — the 2-line clamp sits centered within the 80px row). Keep the frozen header `frozenHeadRef` widths (`№ промо` `w-[104px]`, Тип `w-[132px]`, Название `w-[240px]`) in exact sync with the body so the top-scrollbar spacer (`frozenW`) stays correct.

- [ ] **Step 3: Build + QA**

Run: `corepack pnpm --filter promo build` → green.
QA at 1440px: a long Название («…») now wraps to 2 lines and is fully readable (or clamps at 2 with ellipsis if longer); date columns are visibly tighter with less empty space; the frozen pane and scroll pane rows stay aligned; the sticky top-scrollbar thumb still matches the bottom one (the ResizeObserver re-measures `frozenW`/`scrollW`).

- [ ] **Step 4: Commit**

```bash
git add Promo/src/app/components/short-calendar/ShortCalendarTable.tsx
git commit -m "feat(promo): S1 compact date columns + 2-line wrap for тип/название (tracker V1-3.3)"
```

---

### Task 4: A5 — Sticky-bottom horizontal scrollbar (KEEP the top one)

**Tracker V2-1 («Частично сделано») + user decision 2026-07-10:** the BA clarified they meant a horizontal scrollbar **pinned to the bottom of the visible area** (Excel-style) that stays reachable while scrolling the page vertically, synced with the table's horizontal scroll. Decision: **add** the sticky-bottom scrollbar and **keep** the existing top one (it was built per the BA's own earlier request, doesn't conflict, minimizes regression risk).

Current mechanism (`ShortCalendarTable.tsx`): a `sticky -top-4` band holds a top scrollbar (`topScrollRef`) synced with the header (`headRef`) and the body's own bottom scrollbar (`bodyRef`). The header band + top scrollbar stay as-is; a fourth synced scroller is added, pinned to the viewport bottom.

**Files:**
- Modify: `Promo/src/app/components/short-calendar/ShortCalendarTable.tsx`

**Interfaces:** none (internal DOM/scroll refactor).

- [ ] **Step 1: Keep the top scrollbar strip untouched**

Do NOT remove the «Top horizontal scrollbar» strip in the sticky header band (~186-199). It remains a synced scroller. Keep `sticky -top-4` on the header band.

- [ ] **Step 2: Add a sticky-bottom synced scrollbar as the LAST child of the `Card`**

After the BODY band `<div className="flex">…</div>` (before `</Card>`, ~532), add:

```tsx
{/* Sticky-BOTTOM synced horizontal scrollbar (§V2-1): pinned to the bottom of
    the viewport so the table can be scrolled horizontally from anywhere while
    the page scrolls vertically (Excel-like). Spacer = frozen-pane width; inner
    track = scroll-content width so the thumb matches the body's own scrollbar. */}
<div className="sticky bottom-0 z-30 flex border-t bg-gray-50 dark:bg-muted/40">
  <div className="shrink-0" style={{ width: frozenW }} />
  <div
    ref={bottomScrollRef}
    onScroll={() => syncScroll("bottom")}
    className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
  >
    <div style={{ width: scrollW, height: 1 }} />
  </div>
</div>
```

- [ ] **Step 3: Add `bottomScrollRef` as a FOURTH synced scroller**

Declare `const bottomScrollRef = React.useRef<HTMLDivElement>(null);` (keep `topScrollRef`). Extend `syncScroll` so all four scrollers (`top`, `head`, `body`, `bottom`) mirror the same `scrollLeft` with idempotent writes:

```tsx
const syncScroll = React.useCallback((from: "top" | "body" | "bottom") => {
  const src =
    from === "top" ? topScrollRef.current
    : from === "bottom" ? bottomScrollRef.current
    : bodyRef.current;
  const x = src?.scrollLeft ?? 0;
  for (const ref of [topScrollRef, headRef, bodyRef, bottomScrollRef]) {
    if (ref.current && ref.current !== src && ref.current.scrollLeft !== x)
      ref.current.scrollLeft = x;
  }
}, []);
```

Existing `onScroll` handlers stay (`top` strip → `syncScroll("top")`, body → `syncScroll("body")`); the new bottom strip passes `"bottom"`. (The body pane keeps `overflow-x-auto` so its native scrollbar still exists at the table's true bottom; the sticky-bottom strip is the always-visible mirror. If a doubled scrollbar looks off during QA, hide the body's native one with `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden` on the body pane and rely solely on the sticky-bottom strip — decide during QA.)

- [ ] **Step 4: Build + QA**

Run: `corepack pnpm --filter promo build` → green.
QA at 1440px with the browser window short enough that the table overflows the viewport vertically: scroll the page down — a horizontal scrollbar stays pinned at the bottom of the viewport and dragging it scrolls the table columns; the header + top strip stay pinned at the top; all four scrollers stay in sync. QA at 390px (mobile card view — table hidden, no regression).

- [ ] **Step 5: Commit**

```bash
git add Promo/src/app/components/short-calendar/ShortCalendarTable.tsx
git commit -m "feat(promo): S1 sticky-bottom horizontal scrollbar synced with the top one (tracker V2-1)"
```

---

### Task 5: A9 — Sticky header on the «План акций» tab

**Tracker V2-13 («Частично сделано»):** sticky header works on the «Промо-календарь» tab but NOT «План акций». `PlanApprovalTable.tsx` renders a plain `<table className="w-full min-w-[1200px]">` inside `<div className="hidden overflow-x-auto md:block">` — the `overflow-x-auto` wrapper forces `overflow-y:auto` (lessons quirk), so a naïve `sticky top-0` on `<thead>` would pin to that wrapper (table top), not the page. The robust fix consistent with the codebase is to pin the `<thead>` to the PAGE scroll.

**Approach (minimal, consistent):** make the table's `<thead>` sticky to the page by giving the wrapper `overflow-x-auto` a `sticky`-friendly structure. Since the `<main>` is the vertical scroll container and the plan table wrapper only scrolls horizontally, apply `sticky top-[-1rem] z-20` to the `<thead>`'s `<tr>`/`<th>` cells with a solid background, AND ensure the horizontal-scroll wrapper does not clip vertically: set the wrapper to `overflow-x-auto overflow-y-visible` is insufficient (quirk), so instead **do not wrap the header in the horizontal scroller** — split into the band layout like `ShortCalendarTable`. Given the plan table is a single `<table>`, the pragmatic robust move is:

1. Keep the `<table>` but move horizontal overflow to the PAGE is not possible for a wide table. So adopt the band split: render a non-scrolling sticky header row + a horizontally-scrolling body, mirroring `ShortCalendarTable`'s three-scroller sync, OR
2. Simpler acceptable fallback: apply `className="sticky top-[-16px] z-20 bg-gray-100 dark:bg-muted"` to each `<th>` and change the wrapper from `overflow-x-auto` to a NON-scrolling `overflow-visible`, letting the wide table overflow into the page's own horizontal scroll. This makes `<thead>` sticky to the page (works because there's no inner scroll container to trap it) at the cost of a page-level horizontal scrollbar for this tab.

**Chosen:** Option 2 (fallback) — smallest diff, matches acceptance («шапка закреплена при вертикальной прокрутке»); the horizontal scroll moves to the page. Reconsider Option 1 only if QA shows the page-level horizontal scroll is unacceptable.

**Files:**
- Modify: `Promo/src/app/components/short-calendar/PlanApprovalTable.tsx:283-312` (wrapper + `<thead>` cells)

**Interfaces:** none.

- [ ] **Step 1: Read the current header block**

Read `PlanApprovalTable.tsx` lines 283-330 to capture the exact `<thead>`/`<th>` markup (there are `selectable`/lifecycle columns). Preserve all existing columns and cell content; only the wrapper + `<th>` sticky classes change.

- [ ] **Step 2: Make the wrapper non-scrolling + `<thead>` cells page-sticky**

Change the wrapper (line ~283) from:

```tsx
<div className="hidden overflow-x-auto md:block">
```

to:

```tsx
<div className="hidden md:block">
```

On every `<th>` in the `<thead>` add sticky + a solid background so rows scroll under it. If the existing `<th>` className is e.g. `"… px-3 py-2 text-left …"`, extend to:

```tsx
className="sticky top-[-16px] z-20 bg-gray-100 dark:bg-muted … (existing) …"
```

Use `top-[-16px]` to cancel `<main>`'s `p-4` (16px) so the header sits flush at the content top (matching `ShortCalendarTable`'s `-top-4`). Keep the darker-gray + bold header styling per the §3.5 «шапка» requirement already applied elsewhere.

- [ ] **Step 3: Build + QA**

Run: `corepack pnpm --filter promo build` → green.
QA at 1440px: on the «План акций» tab, scroll the page vertically past the first rows — the column header stays pinned at the top of the viewport with a solid background (rows scroll under it). Confirm the calendar tab is unchanged. If the table is wider than the viewport, confirm the page's own horizontal scrollbar reaches all columns.

- [ ] **Step 4: Commit**

```bash
git add Promo/src/app/components/short-calendar/PlanApprovalTable.tsx
git commit -m "feat(promo): sticky header on «План акций» tab (tracker V2-13)"
```

---

### Task 6: A3 — Adaptive full-width tables (Reports first)

**Tracker V1-3.4 («Частично сделано»):** adaptive width must apply to ALL table sections; specifically «Отчёты смежным отделам» is in a fixed narrow container on big monitors. The calendar tables already fill width; Reports is the named offender.

**Investigation first:** the global `<main>` wraps content in `<div className="mx-auto h-full" style={{ maxWidth: "1400px" }}>` (shared AppShell) — that is the SAME cap every screen has, so «fixed narrow» likely comes from a Reports-local wrapper (a `max-w-*`/`Card` narrower than full width) rather than the shell. `DepartmentReportView` uses Pattern-F `overflow-x-auto flex-1` panes (already width-filling), so the culprit is probably a wrapping container in `ReportsPage.tsx` or a `Card` with `max-w-*`.

**Files:**
- Modify: `Promo/src/app/components/reports/ReportsPage.tsx` (page wrapper width) and/or `DepartmentReportView.tsx` (table container width)

**Interfaces:** none (layout CSS).

- [ ] **Step 1: Locate the width constraint**

Read `ReportsPage.tsx` top-to-bottom and grep both files for `max-w-`, `w-[`, `container`. Identify the wrapper narrower than `w-full` that holds the department table. (`DepartmentReportView.tsx` grep already shows only `overflow-x-auto flex-1` panes + a `max-w-[280px]` empty-state text — that empty-state cap is fine, not the table.)

- [ ] **Step 2: Remove/relax the constraint**

Change the offending wrapper to `w-full` (drop any `max-w-*` on the table/results container). Keep card padding + the Pattern-F band. Do NOT touch the shared `<main>` 1400px cap (that's global and intentional; other screens share it).

- [ ] **Step 3: Build + QA**

Run: `corepack pnpm --filter promo build` → green.
QA at 1440px (or wider if available): `/reports` table fills the available content width like `/short-calendar` and `/full-calendar`; no narrow fixed column of whitespace on the right. QA at 390px: mobile cards unaffected.

- [ ] **Step 4: Commit**

```bash
git add Promo/src/app/components/reports/ReportsPage.tsx Promo/src/app/components/reports/DepartmentReportView.tsx
git commit -m "feat(promo): Reports table fills available width on large monitors (tracker V1-3.4)"
```

---

### Task 7: A4 — Export in «Аудит-лог и контроль сроков» + «Матрица прав»

**Tracker V1-8 («Частично сделано»):** add data export to (1) Аудит-лог и контроль сроков — respecting the active filters (период/роль/ответственный/контрольная точка/результат) and the active tab; (2) Матрица прав — export the current access matrix by roles/sections/actions. Reuse the SheetJS pattern from `report-xlsx.ts` / `users-xlsx.ts`.

**Files:**
- Create: `Promo/src/lib/audit-xlsx.ts`
- Create: `Promo/src/lib/permissions-xlsx.ts`
- Modify: `Promo/src/app/components/audit/AuditPage.tsx` (an «Экспорт» button per tab, filter-aware)
- Modify: `Promo/src/app/components/permissions/PermissionsMatrixPage.tsx` (an «Экспорт» button)

**Interfaces:**
- `audit-xlsx.ts` produces `exportAuditXlsx(input: { tab: string; rows: unknown[]; filename: string })` — writes an `.xlsx` from already-filtered rows the page passes in (so filter-awareness lives in the page, the helper just serializes).
- `permissions-xlsx.ts` produces `exportPermissionsXlsx(matrix: { roles: string[]; rows: Array<{ section: string; cells: string[] }> }, filename: string)`.

- [ ] **Step 1: Read the export pattern + the two pages**

Read `Promo/src/lib/report-xlsx.ts` (SheetJS usage: `XLSX.utils.aoa_to_sheet` / `json_to_sheet`, `book_new`, `book_append_sheet`, `writeFile`). Read `AuditPage.tsx` to find the 4 tabs, their filtered row arrays, and where a header action button mounts. Read `PermissionsMatrixPage.tsx` + `AccessMatrixTable.tsx` to get the matrix shape (roles × sections, cell access levels).

- [ ] **Step 2: Write `audit-xlsx.ts`**

Mirror `report-xlsx.ts`. Build an array-of-arrays with a header row matching the visible columns of the active tab (Сроки по плану / Сроки по промо и отчётам → период/контрольная точка/ответственный/роль/дедлайн/факт/результат/дней просрочки/комментарий; Показатели участников → место/ФИО/… ; Аудит-лог → дата/пользователь/роль/действие/объект/статус до→после/комментарий). Example skeleton:

```ts
import * as XLSX from "xlsx";

export function exportAuditXlsx(input: {
  sheetName: string;
  header: string[];
  rows: (string | number)[][];
  filename: string;
}) {
  const ws = XLSX.utils.aoa_to_sheet([input.header, ...input.rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, input.sheetName);
  XLSX.writeFile(wb, input.filename);
}
```

- [ ] **Step 3: Wire the «Экспорт» button in `AuditPage.tsx`**

Add a `Button` (secondary, `Download` icon) in the page header. On click, map the CURRENT tab's already-filtered rows to `{ header, rows }` and call `exportAuditXlsx({ sheetName, header, rows, filename: \`аудит-лог_${stamp}.xlsx\` })` using the existing `exportStamp()` from `promo-export.ts`. The rows must be the filtered ones (respect период/роль/ответственный/точка/результат) — pull from the same memo that feeds the visible table so the export matches the screen.

- [ ] **Step 4: Write `permissions-xlsx.ts` + wire the button**

```ts
import * as XLSX from "xlsx";

export function exportPermissionsXlsx(
  matrix: { roles: string[]; rows: Array<{ section: string; cells: string[] }> },
  filename: string
) {
  const header = ["Раздел / действие", ...matrix.roles];
  const body = matrix.rows.map((r) => [r.section, ...r.cells]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Матрица прав");
  XLSX.writeFile(wb, filename);
}
```

In `PermissionsMatrixPage.tsx`, add an «Экспорт» button that reads the `ACCESS_MATRIX` (from `lib/permissions.ts`) into `{ roles, rows }` (map each matrix row's per-role cell to its access-level label) and calls `exportPermissionsXlsx(...)`. Export the current tab (Сводная матрица by default; if the Детальные права tab is active, export the capability list as a second sheet — optional, decide during Step 5).

- [ ] **Step 5: Build + QA**

Run: `corepack pnpm --filter promo build` → green.
QA at 1440px: on `/audit`, set a filter (e.g. роль = КМ), click «Экспорт» → an `.xlsx` downloads whose rows match the filtered on-screen table for the active tab; switch tabs and re-export → columns match that tab. On `/permissions` (log in as КД or Администратор), click «Экспорт» → an `.xlsx` with roles as columns and section/action rows matching the on-screen matrix.

- [ ] **Step 6: Commit**

```bash
git add Promo/src/lib/audit-xlsx.ts Promo/src/lib/permissions-xlsx.ts Promo/src/app/components/audit/AuditPage.tsx Promo/src/app/components/permissions/PermissionsMatrixPage.tsx
git commit -m "feat(promo): .xlsx export in Аудит-лог + Матрица прав (tracker V1-8)"
```

---

### Task 8: A7 — Unified `26-N` № промо in the surfaces V2-9 names

**Tracker V2-9 («Частично сделано»):** show the short `26-N` number in «таблицах, фильтрах, карточках промо, разделах согласования, отчётах и экспорте». Keep the full `PR-YYYY-NNN` / `UN-YYYY-NNN` as the technical identifier stored in the data. **Scope decision (user: «только там, где просили явно»):** apply to exactly the surfaces V2-9 enumerates — this reverses the earlier 2026-07-01 decision that «full calendar keeps PR-/UN-». `formatPromoNo(id)` already exists and handles both `PR-`/`UN-` prefixes.

**⚠️ Confirm before executing:** this touches full-calendar, approvals, and reports display. If the user wants it truly minimal (short calendar only, already done), this task is a no-op. Surface list below is the «explicitly asked» set from the comment text.

**Files (display only — the id value stays full):**
- Modify: `Promo/src/app/components/full-calendar/FullCalendarGrid.tsx` (band «PR-… · N позиций» + № промо filter label + any № column)
- Modify: `Promo/src/app/components/full-calendar/FullCalendarPage.tsx` (`PromoNoFilter` options label, «Показано» counter if it prints ids, CSV export header value)
- Modify: `Promo/src/lib/promo-export.ts` `buildFullCalendarCsv` (№ промо column → `formatPromoNo`)
- Modify: approvals — `ReviewQueueTable.tsx` / `MyParticipationsPanel.tsx` / `ApprovalDetailPage.tsx` (card/queue «№ промо»)
- Modify: reports — `DepartmentReportView.tsx` / `ReportsPage.tsx` campaign picker + any printed № промо

**Interfaces:** none (all use existing `formatPromoNo`; keep the full id as the React key / lookup key — only the *rendered text* changes).

- [ ] **Step 1: Inventory the raw-id render sites**

Grep the named surfaces for raw id printing:

```
grep -rn "PR-\|UN-\|campaign.id}\|c.id}\|\.promoId}" Promo/src/app/components/full-calendar Promo/src/app/components/approvals Promo/src/app/components/reports Promo/src/lib/promo-export.ts
```

List each place that renders the id as user-visible text (NOT as a React `key`, route param, or lookup key — those keep the full id).

- [ ] **Step 2: Replace visible id text with `formatPromoNo(id)`**

At each display site import `formatPromoNo` from `lib/promo-mock-data` and wrap the rendered value: `{formatPromoNo(c.id)}` (e.g. the full-calendar band `«PR-2026-001 · N позиций»` → `«{formatPromoNo(c.id)} · N позиций»`). In `buildFullCalendarCsv`, change the № промо column value to `formatPromoNo(line.campaignId)`. Leave `PromoNoFilter` search matching on both `26-N` and name (it already builds `no: formatPromoNo(...)`) — verify full-calendar's `PromoNoFilter` options use `formatPromoNo` (short calendar's already does).

- [ ] **Step 3: Build + QA**

Run: `corepack pnpm --filter promo build` → green.
QA at 1440px: `/full-calendar` band shows «26-1 · N позиций», the «№ промо» filter lists 26-N, CSV export's № column is 26-N; `/approvals` queue + «Мои участия» cards show 26-N; `/reports` campaign picker shows 26-N. Deep-links / row navigation still work (they use the full id under the hood). Full `PR-`/`UN-` no longer shown to the user in these surfaces.

- [ ] **Step 4: Commit**

```bash
git add Promo/src/app/components/full-calendar Promo/src/app/components/approvals Promo/src/app/components/reports Promo/src/lib/promo-export.ts
git commit -m "feat(promo): unified 26-N № промо across full-calendar/approvals/reports/export (tracker V2-9)"
```

---

### Task 9: A6 — Verify sidebar collapse (QA only, no code expected)

**Tracker V2-8 («Не сделано»):** collapse/expand the sidebar to icons-only with an arrow toggle, main area expands. **Already implemented** in the shared `AppShell` (`Sidebar collapsible="icon"` + footer «Свернуть» button → `toggleSidebar()`, collapsed shows icons + tooltips). The BA's «Не сделано» reflects the `promo.tm.uz` backend build, not our mock.

**Files:** none expected. If QA reveals a gap (e.g. the toggle is hard to discover), STOP and report — do NOT modify the shared shell without explicit approval (Promo-local invariant).

- [ ] **Step 1: QA the existing collapse**

Run `corepack pnpm dev:promo`, log into Promo. Click the «Свернуть» button in the sidebar footer → the sidebar collapses to icons only, labels hide, the main content area widens; tooltips appear on icon hover; clicking again expands. Confirm at 1440px.

- [ ] **Step 2: Record the outcome**

If it works: note «V2-8 already satisfied in the mock (shared AppShell collapse); backend build needs the same» for the BA reply. No commit. If it does NOT work, report the gap and await direction (shared-shell change needs approval).

---

### Task 10: Re-verify V2-14…18 already resolved by «6-я часть» (QA only)

**Tracker V2-14…18 («Не сделано» on 08.07):** these were fixed on 2026-07-10 in «6-я часть» (auto № промо, draft-without-type, rejected-plan marker, plan editing with stages, per-акция send checkboxes + missed-dates hint), AFTER the BA's review. QA-confirm they hold; no re-implementation.

- [ ] **Step 1: QA each on the «План акций» tab (log in as «Директор маркетинга», then «Коммерческий директор»)**

- V2-14: creating a plan row auto-assigns a read-only № (`PR-2026-0NN`), no free-text.
- V2-15: a draft without тип промо is allowed, marked «Черновик» + «Тип не выбран», editable/deletable, excluded from the send pool; тип required to send.
- V2-16: rejecting a plan shows a red ✗ «— отклонил» at the rejecting stage (not a green check).
- V2-17: an already-sent plan row can be edited → reverts to «Черновик» + re-send.
- V2-18: send-stage checkboxes select which drafts to send; «Отправлено» rows can't be re-sent; sending a partial month shows the coverage-gap banner/toast.

- [ ] **Step 2: Record outcomes for the BA reply**

Note which hold (expected: all). No commit. If any regressed, open a defect and handle outside this plan.

---

### Task 11: A10 — Role-gate «Срок отчёта» + «Отправка смежным отделам» (strict per V2-12)

**Tracker V2-12, first bullet + user decision 2026-07-10 («Строго по ТЗ»):** the «Крайний срок отправки отчёта…» (=«Срок отчёта») column, the «Отправка смежным отделам» column, and the Task-2 filter are available ONLY to: Коммерческий директор, уполномоченное лицо КД, and сотрудники отдела маркетинга. All other roles must not see them.

**Gating rule (mock mapping):** visible when `currentRole` ∈ {«Коммерческий директор», «Сотрудник маркетинга», «Администратор»} OR the logged-in user is the active КД-substitute (`getActiveSubstitution()` + `canActAsKd` from `lib/kd-substitution-store.ts`). Администратор is included deliberately — the god-mode convention everywhere else in the app (`permissions.ts` ACCESS_MATRIX); note it in the commit body.

**Files:**
- Modify: `Promo/src/app/components/short-calendar/ShortCalendarTable.tsx` (conditionally render both columns — header + body cells; widths participate in the pane measure, so the ResizeObserver re-measures on toggle)
- Modify: `Promo/src/app/components/short-calendar/ShortCalendarPage.tsx` (compute `canSeeReportSend` once — role + substitution check; pass to the table; hide the Task-2 filter facet + skip its application when false; gate the mobile-card lines; gate the two CSV columns in the export handler)
- Modify: `Promo/src/app/components/short-calendar/CalendarFilters.tsx` (accept `showReportSend?: boolean` and hide the facet)
- Modify: `Promo/src/lib/promo-export.ts` (`buildCalendarCsv` gains an option to omit the report columns)

**Interfaces:**
- `ShortCalendarTableProps` gains `showReportColumns?: boolean` (default `true`).
- `CalendarFiltersProps` gains `showReportSend?: boolean` (default `true`); `countActiveFilters` unchanged (the facet can't be set when hidden).
- `buildCalendarCsv(campaigns, opts?: { includeReportColumns?: boolean })`.

- [ ] **Step 1: Compute the gate in `ShortCalendarPage.tsx`**

```tsx
const canSeeReportSend = React.useMemo(() => {
  if (["Коммерческий директор", "Сотрудник маркетинга", "Администратор"].includes(currentRole)) return true;
  const sub = getActiveSubstitution();
  return !!sub && sub.substituteUserId === currentUser?.id;
}, [currentRole, currentUser]);
```

Pass `showReportColumns={canSeeReportSend}` to the table, `showReportSend={canSeeReportSend}` to the filters; skip the `reportSend` filter application when false; gate the mobile-card «Срок отчёта»/«Отправка смежным» lines; call `buildCalendarCsv(rows, { includeReportColumns: canSeeReportSend })`.

- [ ] **Step 2: Conditionally render the two columns in `ShortCalendarTable.tsx`**

Wrap the «Срок отчёта» header `<span>`/body cell and the «Отправка смежным отделам» header/body cell in `{showReportColumns && (…)}`. The scroll-content width shrinks automatically; verify the ResizeObserver re-measures (`scrollW`) — add `showReportColumns` to the measure effect deps.

- [ ] **Step 3: Build + QA**

Run: `corepack pnpm --filter promo build` → green.
QA at 1440px: as КД / Сотрудник маркетинга / Администратор — both columns + the filter visible; as КМ / Старший КМ / ОД / Дир. маркетинга / закуп / аналитика — columns and filter absent, table stays aligned, export CSV has no report columns; as the seeded substitute (login `u-8`'s email) — columns visible. 390px: mobile card lines gated the same way.

- [ ] **Step 4: Commit**

```bash
git add Promo/src/app/components/short-calendar/ShortCalendarTable.tsx Promo/src/app/components/short-calendar/ShortCalendarPage.tsx Promo/src/app/components/short-calendar/CalendarFilters.tsx Promo/src/lib/promo-export.ts
git commit -m "feat(promo): role-gate Срок отчёта + Отправка смежным отделам per V2-12 (КД/уполномоченное лицо/маркетинг)"
```

---

### Task 12: A11 — Persist «План акций» lifecycle to localStorage

**User decision 2026-07-10:** plan state (drafts, edits, deletions, sent set, per-stage decisions, rejections) is session-local — a reload reseeds and looks like data loss on client demos. Persist it, mirroring the `users-store`/`notifications-store` idiom.

**Files:**
- Create: `Promo/src/lib/plan-store.ts`
- Modify: `Promo/src/app/components/short-calendar/PlanMode.tsx` (hydrate initial state from the store; write-through on every mutation)

**Interfaces:**
- `plan-store.ts` produces `getPlanState(): PersistedPlanState | null`, `persistPlanState(s: PersistedPlanState)`, `clearPlanState()`, key `promo:plan-state`. `PersistedPlanState` = JSON-safe snapshot of PlanMode's session state: `{ addedRows, overrides, deletedIds, sentIds, decisions, rejectedStage, rejectReason, planStatus }` (exact field set = whatever `PlanMode` currently keeps in `useState`s — enumerate while implementing; dates serialized ISO, revived on load — follow `notifications-store.ts`'s Date↔ISO idiom).

- [ ] **Step 1: Enumerate PlanMode session state**

Read `PlanMode.tsx` top-to-bottom; list every `useState`/`useReducer` that holds plan lifecycle data (added rows, overrides, deletedIds, send set, per-stage `DecisionMap`, rejected stage/reason, current plan status). That exact set becomes `PersistedPlanState`.

- [ ] **Step 2: Write `plan-store.ts`**

Defensive `typeof window` + try/catch JSON (mirror `notifications-store.ts`). Serialize `Date` fields to ISO strings; revive on read. One key: `promo:plan-state`.

- [ ] **Step 3: Hydrate + write-through in `PlanMode.tsx`**

Initialize each state slice from `getPlanState()` (fallback to the current seed-derived defaults). Add one `React.useEffect` that persists the assembled snapshot whenever any slice changes. «Вернуть на доработку» and other resets persist naturally through the same effect. Do NOT persist derived values (readiness, gaps) — recompute.

- [ ] **Step 4: Build + QA**

Run: `corepack pnpm --filter promo build` → green.
QA at 1440px: as Дир. маркетинга create a draft + edit a row + send a subset → reload → drafts/sent statuses survive; as КД approve some rows → reload → decisions survive; «Вернуть на доработку» then reload → reset state survives. Clear the key in DevTools → seeds return (no crash on malformed JSON).

- [ ] **Step 5: Commit**

```bash
git add Promo/src/lib/plan-store.ts Promo/src/app/components/short-calendar/PlanMode.tsx
git commit -m "feat(promo): persist План акций lifecycle to localStorage (survives reload)"
```

---

## Self-Review

**1. Spec coverage** (actionable tracker items → task):

| Tracker item | Task |
|---|---|
| V1-1 distribution filter bug | 1 |
| V1-3.3 density + wrap | 3 |
| V1-3.4 adaptive width (Reports) | 6 |
| V1-8 export Аудит + Матрица | 7 |
| V2-1 sticky-bottom scroll | 4 |
| V2-8 sidebar collapse | 9 (verify) |
| V2-9 unified 26-N | 8 |
| V2-12 report-send filter + plashka | 2 |
| V2-12 strict role-gating (columns/filter) | 11 |
| V2-13 sticky header план акций | 5 |
| V2-14…18 | 10 (verify) |
| Plan persistence (demo robustness, user ask) | 12 |

Cross-cutting «единое оформление» (sticky header / bottom scroll / adaptive) on Полный календарь / Согласование / Аудит is intentionally **deferred** (user scope = Group A / sections 1–2 only). Flagged for a possible Group B.

**2. Placeholder scan:** no «TBD»/«add error handling»/«similar to Task N». Each code step shows the actual change. Task 5 (A9) and Task 6 (A3) begin with a read/investigate step because the exact current markup must be captured before the minimal diff — the change itself is specified (sticky classes / drop `max-w-*`).

**3. Type consistency:** `distFilter` (Task 1), `reportSend`/`REPORT_SEND_OPTIONS` (Task 2), `exportAuditXlsx`/`exportPermissionsXlsx` (Task 7) are defined where introduced and consumed consistently. `formatPromoNo`/`getReportSendStatus`/`OverdueTag`/`CheckCircle2` are existing exports used as-is.

**Known deviation from the skill's TDD default:** this repo has no unit-test harness and `vite build` is transpile-only, so each task's verification is **build-green + in-browser QA at 1440/390px** (the established method for every prior Promo feedback round), not `pytest`/`jest`. This is intentional and correct for the codebase.
