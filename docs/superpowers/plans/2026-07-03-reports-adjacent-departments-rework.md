# E-1 «Отчёты смежным отделам» rework — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Texnomart Promo department-reports screen (`/reports`, S5) so departments see full-calendar-aligned columns with per-column filters, a real `.xlsx` export, an explicit change layer (Добавлено/Изменено/Исключено + per-cell before→after), per-user acknowledgement with a "who acknowledged" detail, and per-version read-only snapshots — under the unified band-table styling.

**Architecture:** Promo-local React (Vite + TS, Tailwind v4, shadcn via `@texnomart/ui`, patterns via `@texnomart/shared`). Report columns are projected from the full-calendar dictionary `gridFields.ts`. The table is rewritten to the band-layout Pattern-F split pane already used by `ShortCalendarTable`/`FullCalendarGrid`. Change data, per-version snapshots, and department rosters are seeded in `promo-mock-data.ts`; per-user acknowledgement lives in a new localStorage store. Export uses SheetJS.

**Tech Stack:** React 18 + TypeScript, Vite 6, Tailwind v4, shadcn/ui, lucide-react, sonner, `xlsx` (SheetJS — new dep).

## Global Constraints

- **Promo-local only.** No edits to `@texnomart/shared`, `@texnomart/ui`, or `Dashboard/`. Verify `build:dashboard` stays green.
- **Verification model:** this project has **no unit-test harness** (`vite build` does not typecheck app logic, but catches import/syntax/type-import errors). Each task ends with a green build via `corepack pnpm --filter promo build` **plus** the task's explicit in-browser checks. Do **not** add a test framework.
- **pnpm via corepack:** `pnpm` is not on PATH — always `corepack pnpm …`. Build the Promo app with `corepack pnpm --filter promo build` (bypasses the nested-pnpm root script). Dev server: `corepack pnpm --filter promo dev`.
- **RU only.** All UI copy in Russian. Currency via `formatSum` / `<Money>` (`… сум`), dates `ru-RU`, numbers `toLocaleString("ru-RU")` + `tabular-nums`.
- **Colors:** exact hex only via `style={{}}` if ever needed; otherwise semantic Tailwind tokens + `dark:` variants (this rework should need no raw hex). Brand `#FFD60A` = the `primary` token.
- **Design tokens & patterns:** Pattern F split pane (fixed row height on both panes), Pattern H status/plashka tints, Pattern K mobile (tables → Mode-B cards below md, 44px touch targets). Page title/`PageHeader` unchanged.
- **Radix defer rule:** any controlled Dialog/Sheet opened by an outside pointer click must be opened via `setTimeout(() => setOpen(true), 0)` (see the existing `onOpenHistory` in `ReportsPage.tsx:234`).
- **Ref-under-`asChild` rule:** for a Popover/Tooltip/Dropdown trigger, use a native `<button>` styled with `buttonVariants({...})` + `cn` — never the shared `<Button>` under `asChild`.
- **Spec:** `docs/superpowers/specs/2026-07-03-reports-adjacent-departments-rework-design.md` is the source of truth.

---

## File Structure

| File | Responsibility |
|---|---|
| `Promo/src/app/components/reports/reportFields.ts` | **Rewrite** — project report columns from `gridFields.ts` per department (allow-list + local identity columns + value accessors). Exports `ReportColumn`, `reportColumnsFor`, `MARKETING_EDITABLE_FIELD`. |
| `Promo/src/app/components/reports/DepartmentReportView.tsx` | **Rewrite** — band-layout split pane (frozen «Изменение»+«Номенклатура», scrolling value cols, trailing «Ознакомление»), change plashki + cell tooltip, three counters, «Только изменения», mobile cards, who-acknowledged trigger. |
| `Promo/src/app/components/reports/ReportsPage.tsx` | **Modify** — filter state + panel, export, per-user ack store wiring, who-acknowledged drawer host, «Только изменения» rename. |
| `Promo/src/app/components/reports/ReportFilters.tsx` | **New** — collapsible per-column typed filter panel + «Сбросить фильтры»; exports the filter model + `applyReportFilters` + `countActiveReportFilters`. |
| `Promo/src/app/components/reports/ReportAcknowledgeDrawer.tsx` | **New** — role-gated "кто ознакомился" detail Sheet. |
| `Promo/src/lib/report-ack-store.ts` | **New** — `promo:report-ack` per-user acknowledgement store. |
| `Promo/src/lib/report-xlsx.ts` | **New** — SheetJS `.xlsx` export honoring filters + «Только изменения». |
| `Promo/src/lib/promo-mock-data.ts` | **Modify** — extend `ReportChangeSet` (`removedLineIds` + `ReportCellChange[]`); seed per-version report snapshots; seed department roster + partial acks; `getReportChangeSet`, `getReportSnapshot`, `getReportRoster`, `getReportAckSeed`. |
| `Promo/src/components/VersionHistoryDrawer.tsx` | **Modify** — clickable per-version snapshot + «Текущая версия» marker (additive optional props). |
| `Promo/package.json` | **Modify** — add `xlsx` dependency. |

---

## Phase 1 — Columns from gridFields + band-layout table

### Task 1.1: Project report columns from `gridFields.ts`

**Files:**
- Modify (rewrite): `Promo/src/app/components/reports/reportFields.ts`

**Interfaces:**
- Consumes: `COLUMNS`, `ColumnDef`, `CellKind` from `../full-calendar/gridFields`; mock helpers `getCategoryManager`, `getNomenclatureItem`, `installmentTerm`, `programMonthly`, `getStoreAvailability`, `formatAvailabilityPct`, types `PromoCampaign`, `PromoLine`, `ReportDepartment`; `formatSum`.
- Produces:
  - `export type ReportFieldKind = "text" | "money" | "number" | "percent" | "date" | "check";`
  - `export interface ReportColumn { id: string; label: string; kind: ReportFieldKind; group?: string; width: number; value: (line: PromoLine, campaign: PromoCampaign) => string | boolean; }`
  - `export function reportColumnsFor(department: ReportDepartment): ReportColumn[];`
  - `export const MARKETING_EDITABLE_FIELD = "advSelectedMarketing";`
  - Keep the existing `ReportField` name as a type alias `export type ReportField = ReportColumn;` so the current `DepartmentReportView` import keeps compiling until Task 1.2 rewrites it.

- [ ] **Step 1: Rewrite `reportFields.ts`.**

Replace the whole file with the projection below. `GRID_BY_ID` gives label/width/kind/group from `gridFields`; `ACCESSORS` holds the RU value function per id; report-local identity columns (промо №, ФИО КМ, Начало, Окончание, Номенклатура, подарки) are defined locally because they are not 1:1 scrolling `gridFields` columns. Per-department ordered id lists select + order the columns.

```ts
// S5 — Department-report columns, PROJECTED from the full-calendar dictionary
// (gridFields.ts) so labels/order/formatting stay in sync with the full calendar
// (feedback §1) and new fields (Бренд, Наличие в магазинах, %) flow in automatically.
// Each department shows its own ordered subset; report-local identity columns
// (№ промо, ФИО КМ, Начало, Окончание, Номенклатура, подарки) are defined here
// because they are not 1:1 scrolling gridFields columns. Value accessors live here.

import {
  COLUMNS as GRID_COLUMNS,
  type CellKind,
  type ColumnDef,
} from "../full-calendar/gridFields";
import {
  formatAvailabilityPct,
  getCategoryManager,
  getNomenclatureItem,
  getStoreAvailability,
  installmentTerm,
  programMonthly,
  type PromoCampaign,
  type PromoLine,
  type ReportDepartment,
} from "../../../lib/promo-mock-data";
import { formatSum } from "@texnomart/shared/utils/formatters";

export type ReportFieldKind =
  | "text"
  | "money"
  | "number"
  | "percent"
  | "date"
  | "check";

export interface ReportColumn {
  /** Stable id — the suffix in a `${lineId}:${fieldId}` changed-cell key. */
  id: string;
  label: string;
  kind: ReportFieldKind;
  /** Group header for the wide marketing table; omitted for the narrow reports. */
  group?: string;
  /** px column width (frozen/scroll pane alignment). */
  width: number;
  /** RU-formatted display value (string), or a boolean for checkbox fields. */
  value: (line: PromoLine, campaign: PromoCampaign) => string | boolean;
}

/** Back-compat alias so existing imports keep compiling. */
export type ReportField = ReportColumn;

export const MARKETING_EDITABLE_FIELD = "advSelectedMarketing";

// ── value helpers ──────────────────────────────────────────────────────────────
const DASH = "—";
const ruDate = (d: Date) => d.toLocaleDateString("ru-RU");
const money = (v: number | undefined) => (v != null ? formatSum(v) : DASH);
const num = (v: number | undefined) => (v != null ? v.toLocaleString("ru-RU") : DASH);
const pct = (v: number | undefined) => (v != null ? `${v}%` : DASH);
const nomName = (id: string | undefined) =>
  !id ? DASH : getNomenclatureItem(id)?.name ?? id;
const oldPriceOf = (line: PromoLine) =>
  getNomenclatureItem(line.nomenclatureId)?.oldRetailPrice ?? 0;

// gridFields CellKind ("checkbox") → ReportFieldKind ("check").
function mapKind(k: CellKind): ReportFieldKind {
  return k === "checkbox" ? "check" : k;
}
const GRID_GROUP_LABEL: Record<string, string> = {
  identity: "Идентификация",
  product: "Товар",
  prices: "Цены",
  installments: "Рассрочка",
  marketing: "Маркетинг",
};

// ── value accessors, keyed by column id ──────────────────────────────────────────
type Accessor = (l: PromoLine, c: PromoCampaign) => string | boolean;

const ACCESSORS: Record<string, Accessor> = {
  // report-local identity
  priznak: (_l, c) => (c.planned ? "Плановая" : "Внеплановая"),
  km: (l) => getCategoryManager(l.kmId)?.name ?? l.kmId,
  promoNo: (_l, c) => c.id,
  type: (_l, c) => c.type,
  name: (_l, c) => c.name,
  start: (_l, c) => ruDate(c.startDate),
  end: (_l, c) => ruDate(c.endDate),
  nomenclature: (l) => nomName(l.nomenclatureId),
  giftNomenclature: (l) =>
    l.gifts && l.gifts.length
      ? l.gifts.map((g) => nomName(g.nomenclatureId)).join(", ")
      : DASH,
  // product (from gridFields)
  brand: (l) => getNomenclatureItem(l.nomenclatureId)?.brand ?? DASH,
  storeAvailability: (l) =>
    formatAvailabilityPct(getStoreAvailability(l.nomenclatureId).pct),
  stock: (l) => num(l.stock),
  oldPrice: (l) => money(oldPriceOf(l)),
  // prices
  newPrice: (l) => money(l.newPrice),
  discountPct: (l) => pct(l.discountPct),
  cashDiscountPct: (l) => pct(l.cashDiscountPct),
  // installments (representative subset)
  inst006: (l) => money(programMonthly(l.newPrice, 6)),
  inst0012: (l) => money(programMonthly(l.newPrice, 12)),
  inst5002: (l) => money(programMonthly(l.newPrice, 2, 0.5)),
  t12new: (l) => money(installmentTerm(l, oldPriceOf(l), 12).newMonthly),
  t12full: (l) => money(installmentTerm(l, oldPriceOf(l), 12).newFullPrice),
  t24new: (l) => money(installmentTerm(l, oldPriceOf(l), 24).newMonthly),
  t24full: (l) => money(installmentTerm(l, oldPriceOf(l), 24).newFullPrice),
  t36new: (l) => money(installmentTerm(l, oldPriceOf(l), 36).newMonthly),
  t36full: (l) => money(installmentTerm(l, oldPriceOf(l), 36).newFullPrice),
  // marketing
  giftStock: (l) => num(getNomenclatureItem(l.gifts?.[0]?.nomenclatureId ?? "")?.stock),
  utp: (l) => l.utp ?? DASH,
  advRecommendedKm: (l) => l.advRecommendedKm,
  advSelectedMarketing: (l) => l.advSelectedMarketing,
  // compensation (Закуп/Аналитика)
  supplierCompensation: (l) => money(l.supplierCompensation),
  compensationLimit: (l) => num(l.compensationLimit),
};

// Report-local identity/extra columns not present (or not 1:1) in gridFields.
const LOCAL_COLUMNS: Record<string, Omit<ReportColumn, "value">> = {
  priznak: { id: "priznak", label: "Признак", kind: "text", group: "Идентификация", width: 130 },
  km: { id: "km", label: "ФИО КМ", kind: "text", group: "Идентификация", width: 180 },
  promoNo: { id: "promoNo", label: "№ промо", kind: "text", group: "Идентификация", width: 130 },
  start: { id: "start", label: "Начало", kind: "date", group: "Идентификация", width: 120 },
  end: { id: "end", label: "Окончание", kind: "date", group: "Идентификация", width: 120 },
  nomenclature: { id: "nomenclature", label: "Номенклатура", kind: "text", group: "Товар", width: 260 },
  giftNomenclature: { id: "giftNomenclature", label: "Номенклатура по подаркам", kind: "text", group: "Товар", width: 220 },
  giftStock: { id: "giftStock", label: "Остаток подарка", kind: "number", group: "Маркетинг", width: 150 },
};

const GRID_BY_ID = new Map<string, ColumnDef>(GRID_COLUMNS.map((c) => [c.id, c]));

function buildColumn(id: string): ReportColumn {
  const value = ACCESSORS[id];
  if (!value) throw new Error(`reportFields: no accessor for column "${id}"`);
  const local = LOCAL_COLUMNS[id];
  if (local) return { ...local, value };
  const g = GRID_BY_ID.get(id);
  if (!g) throw new Error(`reportFields: "${id}" is neither local nor a gridFields column`);
  return {
    id: g.id,
    label: g.label,
    kind: mapKind(g.kind),
    group: GRID_GROUP_LABEL[g.group],
    width: g.width,
    value,
  };
}

// Ordered per-department id lists (subset of gridFields + local identity columns).
const MARKETING_IDS = [
  "priznak", "km", "promoNo", "type", "name", "start", "end",
  "nomenclature", "brand", "storeAvailability", "stock", "oldPrice",
  "newPrice", "discountPct", "cashDiscountPct",
  "inst006", "inst0012", "inst5002",
  "t12new", "t12full", "t24new", "t24full", "t36new", "t36full",
  "giftNomenclature", "giftStock", "utp", "advRecommendedKm", "advSelectedMarketing",
];
const COMPENSATION_IDS = [
  "type", "name", "start", "end",
  "nomenclature", "giftNomenclature", "supplierCompensation", "compensationLimit",
];

const MARKETING_COLUMNS = MARKETING_IDS.map(buildColumn);
const COMPENSATION_COLUMNS = COMPENSATION_IDS.map(buildColumn);

export function reportColumnsFor(department: ReportDepartment): ReportColumn[] {
  return department === "marketing" ? MARKETING_COLUMNS : COMPENSATION_COLUMNS;
}
```

- [ ] **Step 2: Update the `ReportsPage` import name.**

In `Promo/src/app/components/reports/ReportsPage.tsx:18` change `import { reportFieldsFor } from "./reportFields";` to `import { reportColumnsFor } from "./reportFields";` and at `:61` change `reportFieldsFor(department)` → `reportColumnsFor(department)`.

- [ ] **Step 3: Build.**

Run: `corepack pnpm --filter promo build`
Expected: PASS (no unresolved `type`/import errors). If it fails with "no accessor for column …", add the missing id to `ACCESSORS`.

- [ ] **Step 4: In-browser check.**

Run `corepack pnpm --filter promo dev`, open `/reports`. As **Сотрудник маркетинга** confirm the Marketing report now shows **Бренд** and **Наличие в магазинах, %** columns (before Остаток) and columns read in full-calendar order. As **Сотрудник закупа** confirm the компенсация set is unchanged. (Verify by seeding `sessionStorage.setItem('auth','true')` then navigating, per lessons.)

- [ ] **Step 5: Commit.**

```bash
git add Promo/src/app/components/reports/reportFields.ts Promo/src/app/components/reports/ReportsPage.tsx
git commit -m "feat(reports): derive report columns from gridFields (E-1 §1)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.2: Rewrite the report table to the band-layout split pane (§3)

**Files:**
- Modify (rewrite the table + cards): `Promo/src/app/components/reports/DepartmentReportView.tsx`

**Interfaces:**
- Consumes: `reportColumnsFor` output (`ReportColumn[]`) via the `fields` prop (rename prop uses `ReportColumn`), the existing `getReportChangeSet` (old shape still: `{changedCells: string[], addedLineIds: string[]}`), `getReportSentAt`, `getReportVersionNo`, `getReportDeadline`, `getOverdueDays`, `DEPARTMENT_LABELS`.
- Produces: same `DepartmentReportViewProps` (unchanged signature — `ReportsPage` keeps working). Internally introduces a `changeKind(lineId): "added" | "changed" | "excluded" | null` helper used by the «Изменение» plashka.

- [ ] **Step 1: Port the band-layout scroll skeleton.**

Replace the desktop `Card` + `<table>` block (`DepartmentReportView.tsx:260-279`, the `ReportTable` component `:315-474`, and the `isNumericKind` usage) with a split-pane band layout copied/adapted from `Promo/src/app/components/short-calendar/ShortCalendarTable.tsx:130-297` (the three-scroller refs, `useLayoutEffect` measure, `syncScroll`, sticky `-top-4` top-scrollbar band, frozen pane, scrolling pane). Adapt:
  - **Frozen pane columns** = «Изменение» (width 130) + «Номенклатура» (width from the `nomenclature` column, 260). Render the nomenclature value via the `nomenclature` column's accessor; render «Изменение» via `<ChangePlashka kind={changeKind(line.id)} />` (Step 3).
  - **Scrolling pane columns** = every `field` EXCEPT `nomenclature` (it's frozen), each `width: f.width`, cell content via `<CellValue …>` (keep the existing `CellValue`/`ReadonlyCheck` renderers `:606-653`), plus a **trailing «Ознакомление» column** (width 150) holding the per-row «Ознакомиться»→«Ознакомлен» control (keep the existing button from `:453-467`, gated on `lineHasUnacked`).
  - **Group header row** (marketing) — keep the group band, computed from `field.group` as today (`:348-357`), rendered inside the sticky header band above the column-title row, aligned to the scrolling columns.
  - **Gridlines**: apply the `CELL = "border-r border-gray-100 dark:border-border"` divider to each scrolling cell + header cell; `border-b` per row; gray/bold header (`bg-gray-50 dark:bg-muted/40`, `font-semibold`), same as ShortCalendarTable.
  - **Fixed row height**: define `const ROW_H = 52;` and apply `style={{ height: ROW_H }}` to BOTH panes' rows (Pattern-F invariant). Truncate nomenclature to one line.
  - **Marketing select checkbox**: keep the bulk-select leading checkbox — put it in the frozen pane BEFORE «Изменение» when `canEditMarketingFlag`.

- [ ] **Step 2: Keep the mobile cards.**

Leave the `ReportCard` mobile block (`:281-304`, `:476-604`) working; it already shows an «добавлено» badge + «Ознакомлен» — in Step 3 generalize its badge to `<ChangePlashka kind={changeKind(line.id)} compact />`.

- [ ] **Step 3: Add the «Изменение» plashka + `changeKind`.**

Add near the top of the component body:

```tsx
// Which change plashka a line shows in the «Изменение» column.
// (Phase 1 uses the existing change model; Phase 2 enriches it.)
const changeKind = (lineId: string): "added" | "changed" | "excluded" | null => {
  const line = lines.find((l) => l.id === lineId);
  if (line && (line.removed || line.rejected)) return "excluded";
  if (changeSet.addedLineIds.includes(lineId)) return "added";
  if (changeSet.changedCells.some((k) => k.startsWith(`${lineId}:`))) return "changed";
  return null;
};
```

Add a `ChangePlashka` component at file scope:

```tsx
function ChangePlashka({
  kind,
}: {
  kind: "added" | "changed" | "excluded" | null;
}) {
  if (!kind) return <span className="text-xs text-muted-foreground">—</span>;
  const meta = {
    added: { label: "Добавлено", cls: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300" },
    changed: { label: "Изменено", cls: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300" },
    excluded: { label: "Исключено", cls: "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300" },
  }[kind];
  return (
    <Badge className={cn("rounded-full border-0 text-[11px] font-medium", meta.cls)}>
      {meta.label}
    </Badge>
  );
}
```

Excluded rows keep the existing strike-through (`struck = line.removed || line.rejected`).

- [ ] **Step 4: Build.**

Run: `corepack pnpm --filter promo build`
Expected: PASS.

- [ ] **Step 5: In-browser check.**

`/reports` at 1440px: the header sticks on vertical page scroll; the **top scrollbar** and **bottom scrollbar** move together and move the header; «Изменение» + «Номенклатура» stay frozen while value columns scroll; column dividers + gray bold header present; rows stay aligned across panes. At 390px the Mode-B cards render with the «Изменение» plashka. Check on UN-2026-015 (has seeded changes) that added/changed/excluded plashki appear.

- [ ] **Step 6: Commit.**

```bash
git add Promo/src/app/components/reports/DepartmentReportView.tsx
git commit -m "feat(reports): band-layout split-pane table + Изменение column (E-1 §3/§2)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2 — Change model & display

### Task 2.1: Extend `ReportChangeSet` (removed lines + per-cell payloads)

**Files:**
- Modify: `Promo/src/lib/promo-mock-data.ts` (`ReportChangeSet` `:2842-2867`)

**Interfaces:**
- Produces:
  - `export interface ReportCellChange { lineId: string; fieldId: string; prevValue: string; newValue: string; changedAt: Date; }`
  - `ReportChangeSet` now: `{ addedLineIds: string[]; removedLineIds: string[]; changedCells: ReportCellChange[]; }`
  - `getReportChangeSet(campaignId): ReportChangeSet` (unchanged signature, new shape).
  - Helper `export function reportCellChange(set: ReportChangeSet, lineId: string, fieldId: string): ReportCellChange | undefined;`

- [ ] **Step 1: Replace the interface + seed + getter.**

Replace `:2842-2867` with:

```ts
export interface ReportCellChange {
  lineId: string;
  fieldId: string;
  /** Pre-formatted display strings for the tooltip. */
  prevValue: string;
  newValue: string;
  changedAt: Date;
}

export interface ReportChangeSet {
  /** Lines added in the latest version → green «Добавлено» plashka. */
  addedLineIds: string[];
  /** Lines excluded in the latest version → red «Исключено» plashka (kept, struck). */
  removedLineIds: string[];
  /** Per-cell changes → amber highlight + before→after tooltip. */
  changedCells: ReportCellChange[];
}

const REPORT_CHANGE_SETS: Record<string, ReportChangeSet> = {
  // UN-2026-015 received a later incremental correction: a price/discount change on
  // L-0019, one added position (L-0021), and one excluded position (L-0020).
  "UN-2026-015": {
    addedLineIds: ["L-0021"],
    removedLineIds: ["L-0020"],
    changedCells: [
      { lineId: "L-0019", fieldId: "newPrice", prevValue: "5 200 000 сум", newValue: "4 990 000 сум", changedAt: new Date(2026, 5, 5, 10, 40) },
      { lineId: "L-0019", fieldId: "discountPct", prevValue: "8%", newValue: "12%", changedAt: new Date(2026, 5, 5, 10, 40) },
      { lineId: "L-0019", fieldId: "supplierCompensation", prevValue: "250 000 сум", newValue: "300 000 сум", changedAt: new Date(2026, 5, 5, 10, 40) },
      { lineId: "L-0019", fieldId: "compensationLimit", prevValue: "30", newValue: "40", changedAt: new Date(2026, 5, 5, 10, 40) },
    ],
  },
};

const EMPTY_CHANGE_SET: ReportChangeSet = {
  addedLineIds: [],
  removedLineIds: [],
  changedCells: [],
};

export function getReportChangeSet(campaignId: string): ReportChangeSet {
  return REPORT_CHANGE_SETS[campaignId] ?? EMPTY_CHANGE_SET;
}

export function reportCellChange(
  set: ReportChangeSet,
  lineId: string,
  fieldId: string
): ReportCellChange | undefined {
  return set.changedCells.find((c) => c.lineId === lineId && c.fieldId === fieldId);
}
```

- [ ] **Step 2: Ensure `L-0020` exists on UN-2026-015 (excluded demo).**

Grep for the UN-2026-015 line seeds (`grep -n "UN-2026-015" Promo/src/lib/promo-mock-data.ts` and search `L-0019`/`L-0020`/`L-0021`). If `L-0020` is not present as a line of UN-2026-015, add a seed line `L-0020` to UN-2026-015 with `removed: true` (mirror an existing UN-2026-015 line's shape). If it already exists, set/confirm `removed: true` on it.

- [ ] **Step 3: Build.**

Run: `corepack pnpm --filter promo build`
Expected: PASS (this breaks `DepartmentReportView`'s old `changeSet.changedCells.includes(...)` string usage — that is fixed in Task 2.2; if you run the build before 2.2 it will error on `.includes` over objects. Acceptable to sequence 2.1→2.2 and build once at the end of 2.2. To keep this task independently green, temporarily update the two call sites in `DepartmentReportView` to the new shape as part of Step 4 below.)

- [ ] **Step 4: Point `DepartmentReportView` change helpers at the new shape (minimal).**

In `DepartmentReportView.tsx` update the change helpers to the object shape:
```tsx
const cellChanged = (lineId: string, fieldId: string) =>
  !!reportCellChange(changeSet, lineId, fieldId) && !isAcked(lineId);
const lineHasUnacked = (lineId: string) =>
  (changeSet.addedLineIds.includes(lineId) ||
    changeSet.removedLineIds.includes(lineId) ||
    changeSet.changedCells.some((c) => c.lineId === lineId)) &&
  !isAcked(lineId);
```
Update `changeKind` (Task 1.2) to use `changeSet.removedLineIds.includes(lineId)` for the excluded branch (in addition to `line.removed || line.rejected`). Import `reportCellChange`.

- [ ] **Step 5: Build → PASS. Commit.**

```bash
git add Promo/src/lib/promo-mock-data.ts Promo/src/app/components/reports/DepartmentReportView.tsx
git commit -m "feat(reports): extend ReportChangeSet (removed lines + per-cell payloads) (E-1 §2)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.2: Change display — tooltip, three counters, «Только изменения»

**Files:**
- Modify: `Promo/src/app/components/reports/DepartmentReportView.tsx`

**Interfaces:**
- Consumes: `ReportCellChange`, `reportCellChange`, the extended `changeSet`.
- Produces: a `changed-cell` tooltip; header counters `Добавлено/Изменено/Исключено/Всего позиций`; the renamed «Только изменения» toggle with excluded-aware filtering.

- [ ] **Step 1: Changed-cell tooltip.**

Wrap a changed scrolling cell's content in a Tooltip (import `Tooltip, TooltipContent, TooltipTrigger` from `@texnomart/ui/tooltip`). Trigger = a native `<span>` (no ref pitfall). Content:
```tsx
const chg = reportCellChange(changeSet, line.id, f.id);
// …inside the changed cell:
<Tooltip>
  <TooltipTrigger asChild>
    <span className="cursor-help underline decoration-dotted decoration-amber-400 underline-offset-2">
      <CellValue field={f} line={line} campaign={campaign} … />
    </span>
  </TooltipTrigger>
  <TooltipContent className="text-xs">
    <div>Было: <span className="tabular-nums">{chg!.prevValue}</span></div>
    <div>Стало: <span className="tabular-nums font-medium">{chg!.newValue}</span></div>
    <div className="mt-0.5 text-muted-foreground tabular-nums">
      {chg!.changedAt.toLocaleDateString("ru-RU")}{" "}
      {chg!.changedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
    </div>
  </TooltipContent>
</Tooltip>
```
Only render the Tooltip when `chg` exists and `!isAcked(line.id)`; otherwise render `<CellValue …>` plainly. Keep the amber cell background/ring.

- [ ] **Step 2: Three counters + «Всего позиций».**

Replace the single «Новых/изменённых: N» badge (`:154-158`) with:
```tsx
const addedCount = changeSet.addedLineIds.length;
const changedCount = new Set(changeSet.changedCells.map((c) => c.lineId)).size;
const excludedCount = changeSet.removedLineIds.length;
```
Render three badges (green/amber/red tints, same palette as `ChangePlashka`) «Добавлено: N» / «Изменено: N» / «Исключено: N» plus a neutral «Всего позиций: {lines.length}». These are **version totals** — do NOT decrement on acknowledgement.

- [ ] **Step 3: Rename toggle + excluded-aware filter.**

Change the toggle label (`:183-185`) «Только изменённые» → **«Только изменения»**. Update `displayLines` so «Только изменения» keeps any line that is added, changed, OR excluded in this version (regardless of ack — it is a view of the version's change composition):
```tsx
const isChangedLine = (lineId: string) =>
  changeSet.addedLineIds.includes(lineId) ||
  changeSet.removedLineIds.includes(lineId) ||
  changeSet.changedCells.some((c) => c.lineId === lineId);
const displayLines = React.useMemo(
  () => (onlyChanged ? lines.filter((l) => isChangedLine(l.id)) : lines),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [lines, onlyChanged]
);
```
Show the toggle whenever `hasChangeData` (now = `addedCount + changedCount + excludedCount > 0`).

- [ ] **Step 4: Build → PASS.**

Run: `corepack pnpm --filter promo build`

- [ ] **Step 5: In-browser check (UN-2026-015).**

Three counters show «Добавлено: 1 · Изменено: 1 · Исключено: 1 · Всего позиций: N»; the excluded line (L-0020) is kept and struck; hovering a changed cell shows the «Было → Стало · дата/время» tooltip; «Только изменения» filters to the 3 changed lines; acknowledging a line clears its highlight but the counters don't drop.

- [ ] **Step 6: Commit.**

```bash
git add Promo/src/app/components/reports/DepartmentReportView.tsx
git commit -m "feat(reports): change tooltip + 3 counters + «Только изменения» (E-1 §2)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3 — Filters & export

### Task 3.1: Per-column typed filter panel + «Сбросить фильтры» + «Показано: N»

**Files:**
- Create: `Promo/src/app/components/reports/ReportFilters.tsx`
- Modify: `Promo/src/app/components/reports/ReportsPage.tsx`

**Interfaces:**
- Produces (in `ReportFilters.tsx`):
  - `export interface ColumnFilter { text?: string; selected?: string[]; min?: number; max?: number; from?: string; to?: string; }`
  - `export type ReportFilterState = { columns: Record<string, ColumnFilter>; change: string[]; ack: "all" | "acked" | "unacked"; };`
  - `export const EMPTY_REPORT_FILTERS: ReportFilterState;`
  - `export function countActiveReportFilters(s: ReportFilterState): number;`
  - `export function applyReportFilters(lines: PromoLine[], columns: ReportColumn[], campaign: PromoCampaign, state: ReportFilterState, changeKind: (id: string) => "added"|"changed"|"excluded"|null, isAcked: (id: string) => boolean): PromoLine[];`
  - `export function ReportFilters(props: { columns: ReportColumn[]; state: ReportFilterState; onChange: (s: ReportFilterState) => void; open: boolean; }): JSX.Element;`
- Consumes: `ReportColumn` from `./reportFields`; `PromoLine`, `PromoCampaign` types.

- [ ] **Step 1: Create `ReportFilters.tsx`.**

Implement typed filters keyed by column kind. Numeric parse strips non-digits (like `EditableCell`). `applyReportFilters` evaluates each active column filter against the column's `value(line, campaign)` (string) — for numeric kinds, parse the raw line value; simplest is to compare against the digits in the formatted string. Enum multi-selects are built from the distinct values present in the current lines. The panel renders a labeled control per visible column (text → `<Input>`; enum → checkbox list in a popover with a native-`<button>` trigger; number/money/percent → two `<Input>` min/max; date → two `<input type="date">`), plus the synthetic «Изменение» multi-select (Добавлено/Изменено/Исключено/Без изменений) and «Ознакомление» select (Все/Ознакомлен/Не ознакомлен). Include a **«Сбросить фильтры»** button that calls `onChange(EMPTY_REPORT_FILTERS)`. Wrap the whole thing in a `hidden`/shown container driven by `open`. Follow `CalendarFilters.tsx` for grouping/markup conventions (read `Promo/src/app/components/short-calendar/CalendarFilters.tsx` for the established filter-panel style, `countActiveFilters`, «Очистить»). Determine enum columns as: `kind === "text"` AND the column id is one of `["priznak","type"]` → multi-select; other text columns → search. `check` columns → a Да/Нет/Все select.

- [ ] **Step 2: Wire into `ReportsPage`.**

Add state `const [filters, setFilters] = React.useState<ReportFilterState>(EMPTY_REPORT_FILTERS);` reset on view change (`React.useEffect(() => setFilters(EMPTY_REPORT_FILTERS), [campaignId, department]);`). Add a **«Фильтры»** toggle in the header area (before/near the department picker) showing `countActiveReportFilters(filters)` as a badge (mirror the short-calendar toggle). Pass `filters`/`setFilters` to a rendered `<ReportFilters …>` (open-gated). Compute `filteredLines = applyReportFilters(lines, fields, campaign, filters, changeKind, isAcked)` and pass **`filteredLines`** to `DepartmentReportView` (add a `filteredLines`/`totalShown` prop, or filter inside — simplest: keep filtering in the page and pass the already-filtered array as `lines`). Note: `changeKind`/`isAcked` need to be lifted or duplicated in the page — extract a tiny page-level `changeKind` using `getReportChangeSet(campaignId)` and the current ack state. Add a **«Показано: N позиций»** count near the header, from the post-filter, post-«Только изменения» length.

- [ ] **Step 3: Build → PASS.**

Run: `corepack pnpm --filter promo build`

- [ ] **Step 4: In-browser check.**

«Фильтры» toggles the panel; filters exist for every visible column and change with department; text/enum/range/date filters narrow the rows; «Изменение» and «Ознакомление» filters work; «Сбросить фильтры» restores defaults; «Показано: N» reflects the filtered count; the badge count matches active facets.

- [ ] **Step 5: Commit.**

```bash
git add Promo/src/app/components/reports/ReportFilters.tsx Promo/src/app/components/reports/ReportsPage.tsx Promo/src/app/components/reports/DepartmentReportView.tsx
git commit -m "feat(reports): per-column typed filters + reset + «Показано: N» (E-1 §1)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.2: Real `.xlsx` export (SheetJS) honoring filters + «Только изменения»

**Files:**
- Modify: `Promo/package.json` (add `xlsx`)
- Create: `Promo/src/lib/report-xlsx.ts`
- Modify: `Promo/src/app/components/reports/ReportsPage.tsx`

**Interfaces:**
- Produces: `export function exportReportXlsx(params: { department: ReportDepartment; campaign: PromoCampaign; columns: ReportColumn[]; lines: PromoLine[]; changeKind: (id: string) => "added"|"changed"|"excluded"|null; }): void;`

- [ ] **Step 1: Add the dependency.**

Edit `Promo/package.json` `dependencies` — add `"xlsx": "^0.18.5"`. Then install:
Run: `corepack pnpm install`
Expected: adds `xlsx`. If `ERR_PNPM_IGNORED_BUILDS` appears, it is unrelated to `xlsx` (pure JS, no build script) — re-run; check `pnpm-workspace.yaml` `allowBuilds` only lists oxide/esbuild.

- [ ] **Step 2: Create `report-xlsx.ts`.**

```ts
import * as XLSX from "xlsx";
import { DEPARTMENT_SHORT, type PromoCampaign, type PromoLine, type ReportDepartment } from "./promo-mock-data";
import type { ReportColumn } from "../app/components/reports/reportFields";
import { exportStamp } from "./promo-export";

const CHANGE_LABEL = { added: "Добавлено", changed: "Изменено", excluded: "Исключено" } as const;

/** Build a real .xlsx of the current (filtered) report view, incl. the «Изменение» column. */
export function exportReportXlsx(params: {
  department: ReportDepartment;
  campaign: PromoCampaign;
  columns: ReportColumn[];
  lines: PromoLine[];
  changeKind: (lineId: string) => "added" | "changed" | "excluded" | null;
}): void {
  const { department, campaign, columns, lines, changeKind } = params;
  const header = ["Изменение", ...columns.map((c) => c.label)];
  const rows = lines.map((l) => {
    const k = changeKind(l.id);
    const cells = columns.map((c) => {
      const v = c.value(l, campaign);
      return typeof v === "boolean" ? (v ? "Да" : "—") : v;
    });
    return [k ? CHANGE_LABEL[k] : "", ...cells];
  });
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, DEPARTMENT_SHORT[department]);
  const file = `Отчёт_${DEPARTMENT_SHORT[department]}_${campaign.id}_${exportStamp()}.xlsx`;
  XLSX.writeFile(wb, file);
}
```

- [ ] **Step 3: Wire the «Экспорт» button.**

In `ReportsPage.tsx`, re-enable export: keep `showExport={false}` on `PageHeader` (its built-in export is generic) and instead render an **«Экспорт»** `<Button>` in the header row that calls `exportReportXlsx({ department, campaign, columns: fields, lines: <the same post-filter+onlyChanged array the table shows>, changeKind })`. Pass exactly the visible/filtered lines so the file honors filters + «Только изменения».

- [ ] **Step 4: Build → PASS.**

Run: `corepack pnpm --filter promo build`
Expected: PASS (SheetJS is ESM/CJS-interop friendly with Vite; `import * as XLSX` works).

- [ ] **Step 5: In-browser check.**

Apply a filter + turn on «Только изменения», click «Экспорт» → a `.xlsx` downloads and opens in Excel with Cyrillic intact, an «Изменение» column, and only the visible rows/columns.

- [ ] **Step 6: Commit.**

```bash
git add Promo/package.json Promo/pnpm-lock.yaml Promo/src/lib/report-xlsx.ts Promo/src/app/components/reports/ReportsPage.tsx
git commit -m "feat(reports): real .xlsx export via SheetJS honoring filters (E-1 §1)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

> If `pnpm-lock.yaml` lives at the repo root rather than `Promo/`, add the root lockfile instead.

---

## Phase 4 — Versions & acknowledgement

### Task 4.1: Per-version report snapshots + clickable version + «Текущая версия» marker

**Files:**
- Modify: `Promo/src/lib/promo-mock-data.ts` (seed snapshots + `getReportSnapshot`)
- Modify: `Promo/src/components/VersionHistoryDrawer.tsx`
- Modify: `Promo/src/app/components/reports/ReportsPage.tsx`

**Interfaces:**
- Produces: `export function getReportSnapshot(campaignId: string, version: number): CampaignReportRow[] | undefined;` seeded for UN-2026-015 + PR-2026-003 versions.
- `VersionHistoryDrawer` gains optional props: `snapshotFor?: (version: number) => CampaignReportRow[] | undefined;` and marks the newest version «Текущая версия».

- [ ] **Step 1: Seed per-version snapshots.**

In `promo-mock-data.ts`, after `CAMPAIGN_VERSIONS`, add a `Record<campaignId, Record<version, CampaignReportRow[]>>` seed for UN-2026-015 (each of its versions) and PR-2026-003 (its 4 versions), reusing `buildCampaignReport`-shaped rows (lineId/nomenclature/code/fields). For versions where you don't want to hand-author every row, snapshot = `buildCampaignReport(getPromoLines(campaignId))` with the version's known deltas applied (e.g. earlier version shows the pre-change price). Keep it small but distinct enough that clicking v2 vs v4 visibly differs on ≥1 field. Add:
```ts
export function getReportSnapshot(
  campaignId: string,
  version: number
): CampaignReportRow[] | undefined {
  return REPORT_SNAPSHOTS[campaignId]?.[version];
}
```

- [ ] **Step 2: Clickable versions + current marker in the drawer.**

In `VersionHistoryDrawer.tsx`: add the optional prop `snapshotFor`. In the «История версий» list (`:394-424`), make each version card a `<button>` (only when `snapshotFor` is provided) that sets local `selectedVersion` state; the newest version (`versions[0].version`) shows a «Текущая версия» badge and is highlighted. When a `selectedVersion` is chosen, switch the drawer's active tab to «Полный актуальный отчёт» but render `snapshotFor(selectedVersion) ?? currentReport` instead of `currentReport`, with a read-only banner «Просмотр версии N (на момент отправки)» and a «Вернуться к актуальной» control that clears `selectedVersion`. Keep all existing props/behavior when `snapshotFor` is omitted (backward-compatible with the S3 approvals usage).

- [ ] **Step 3: Pass `snapshotFor` from `ReportsPage`.**

At the `<VersionHistoryDrawer …>` usage (`ReportsPage.tsx:243-249`) add `snapshotFor={(v) => getReportSnapshot(campaign.id, v)}` and import `getReportSnapshot`.

- [ ] **Step 4: Build → PASS. In-browser check.**

Open «История версий»; the newest version shows «Текущая версия»; clicking an older version renders its snapshot read-only with the banner; «Вернуться к актуальной» restores the live snapshot. Confirm the S3 approvals detail page (`/approvals/:id` → История) still works (no `snapshotFor` there).

- [ ] **Step 5: Commit.**

```bash
git add Promo/src/lib/promo-mock-data.ts Promo/src/components/VersionHistoryDrawer.tsx Promo/src/app/components/reports/ReportsPage.tsx
git commit -m "feat(reports): per-version read-only snapshots + current-version marker (E-1 §2)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4.2: Per-user acknowledgement store

**Files:**
- Create: `Promo/src/lib/report-ack-store.ts`
- Modify: `Promo/src/lib/promo-mock-data.ts` (department roster + ack seed)
- Modify: `Promo/src/app/components/reports/ReportsPage.tsx`

**Interfaces:**
- Produces (`report-ack-store.ts`):
  - `export interface ReportAckKey { campaignId: string; department: ReportDepartment; version: number; }`
  - `export function getAckedLines(key: ReportAckKey, userId: string): Set<string>;`
  - `export function acknowledgeLine(key: ReportAckKey, userId: string, lineId: string): void;`
  - `export function acknowledgeLines(key: ReportAckKey, userId: string, lineIds: string[]): void;`
  - `export function getAckRecords(key: ReportAckKey): { userId: string; lineId: string; at: string }[];` (for the who-acknowledged view — merges seed + live).

- [ ] **Step 1: Create the store** (mirror `audit-store.ts` localStorage shape, key `promo:report-ack`):

```ts
import type { ReportDepartment } from "./promo-mock-data";
import { getReportAckSeed } from "./promo-mock-data";

const STORAGE_KEY = "promo:report-ack";

export interface ReportAckKey {
  campaignId: string;
  department: ReportDepartment;
  version: number;
}
interface StoredAck {
  campaignId: string;
  department: ReportDepartment;
  version: number;
  userId: string;
  lineId: string;
  at: string; // ISO
}
function keyStr(k: ReportAckKey) {
  return `${k.campaignId}:${k.department}:${k.version}`;
}
function read(): StoredAck[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as StoredAck[];
  } catch {
    return [];
  }
}
function write(all: StoredAck[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
/** Seed (from mock) + live records for a report view. */
function recordsFor(k: ReportAckKey): StoredAck[] {
  const seed = getReportAckSeed(k.campaignId, k.department, k.version);
  return [...seed, ...read().filter((r) => keyStr(r) === keyStr(k))];
}
export function getAckedLines(k: ReportAckKey, userId: string): Set<string> {
  return new Set(recordsFor(k).filter((r) => r.userId === userId).map((r) => r.lineId));
}
export function acknowledgeLine(k: ReportAckKey, userId: string, lineId: string): void {
  acknowledgeLines(k, userId, [lineId]);
}
export function acknowledgeLines(k: ReportAckKey, userId: string, lineIds: string[]): void {
  if (typeof window === "undefined") return;
  const all = read();
  const at = new Date().toISOString();
  for (const lineId of lineIds) {
    if (all.some((r) => keyStr(r) === keyStr(k) && r.userId === userId && r.lineId === lineId)) continue;
    all.push({ ...k, userId, lineId, at });
  }
  write(all);
}
export function getAckRecords(k: ReportAckKey): { userId: string; lineId: string; at: string }[] {
  return recordsFor(k).map((r) => ({ userId: r.userId, lineId: r.lineId, at: r.at }));
}
```

- [ ] **Step 2: Seed roster + acks in `promo-mock-data.ts`.**

Add, in the S5 region:
```ts
export interface ReportRosterUser { id: string; name: string; }
const REPORT_ROSTER: Record<ReportDepartment, ReportRosterUser[]> = {
  marketing: [
    { id: "u-mkt-1", name: "Ахмедова Дилноза" },
    { id: "u-mkt-2", name: "Юсупов Тимур" },
    { id: "u-mkt-3", name: "Каримова Севара" },
  ],
  purchasing: [
    { id: "u-buy-1", name: "Сотрудник закупа АС" },
    { id: "u-buy-2", name: "Рахимов Джасур" },
  ],
  analytics: [
    { id: "u-an-1", name: "Аналитик КР" },
    { id: "u-an-2", name: "Собиров Азиз" },
  ],
};
export function getReportRoster(department: ReportDepartment): ReportRosterUser[] {
  return REPORT_ROSTER[department] ?? [];
}
// Partial acknowledgements so the «кто ознакомился» view has a realistic mix.
const REPORT_ACK_SEED: { campaignId: string; department: ReportDepartment; version: number; userId: string; lineId: string; at: string }[] = [
  { campaignId: "UN-2026-015", department: "marketing", version: 2, userId: "u-mkt-1", lineId: "L-0019", at: new Date(2026, 5, 5, 12, 10).toISOString() },
  { campaignId: "UN-2026-015", department: "marketing", version: 2, userId: "u-mkt-1", lineId: "L-0021", at: new Date(2026, 5, 5, 12, 11).toISOString() },
];
export function getReportAckSeed(campaignId: string, department: ReportDepartment, version: number) {
  return REPORT_ACK_SEED.filter(
    (r) => r.campaignId === campaignId && r.department === department && r.version === version
  );
}
```
(Use the actual latest version number of UN-2026-015 for the seed — check `getReportVersionNo`.)

- [ ] **Step 3: Replace the ephemeral ack state in `ReportsPage`.**

Remove the in-memory `ackAll`/`ackLines` view-keyed state (`ReportsPage.tsx:95-112`). Instead:
```tsx
const { currentUser } = useCurrentUser();
const userId = currentUser?.id ?? "anon";
const version = getReportVersionNo(campaign);
const ackKey = { campaignId, department, version };
const [ackTick, setAckTick] = React.useState(0); // re-read trigger
const acknowledgedLines = React.useMemo(
  () => getAckedLines(ackKey, userId),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [campaignId, department, version, userId, ackTick]
);
const changeSet = getReportChangeSet(campaignId);
const changedLineIds = React.useMemo(() => {
  const ids = new Set<string>([...changeSet.addedLineIds, ...changeSet.removedLineIds]);
  changeSet.changedCells.forEach((c) => ids.add(c.lineId));
  return [...ids];
}, [changeSet]);
const onAcknowledgeLine = (lineId: string) => { acknowledgeLine(ackKey, userId, lineId); setAckTick((t) => t + 1); };
const onAcknowledgeAll = () => {
  const ids = changedLineIds.filter((id) => !acknowledgedLines.has(id));
  acknowledgeLines(ackKey, userId, ids); setAckTick((t) => t + 1);
};
```
Drop the `acknowledgedAll` boolean concept — `isAcked(lineId) = acknowledgedLines.has(lineId)`. Update `DepartmentReportViewProps` accordingly (remove `acknowledgedAll`/`onAcknowledgeAll`-as-view-set; keep `acknowledgedLines: Set<string>`, `onAcknowledgeLine`, `onAcknowledgeAll`). The header button becomes **«Ознакомиться со всеми изменениями (N)»** where N = count of unacknowledged changed/added/excluded lines.

- [ ] **Step 4: Build → PASS. In-browser check.**

As a marketing user, «Ознакомиться со всеми изменениями (N)» and per-row «Ознакомлен» persist across reload (localStorage); switching to a different god-mode user id (via re-login) shows independent ack state; the button label reads «…изменениями (N)».

- [ ] **Step 5: Commit.**

```bash
git add Promo/src/lib/report-ack-store.ts Promo/src/lib/promo-mock-data.ts Promo/src/app/components/reports/ReportsPage.tsx Promo/src/app/components/reports/DepartmentReportView.tsx
git commit -m "feat(reports): per-user acknowledgement store (E-1 §2)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4.3: "Кто ознакомился" role-gated detail drawer

**Files:**
- Create: `Promo/src/app/components/reports/ReportAcknowledgeDrawer.tsx`
- Modify: `Promo/src/app/components/reports/ReportsPage.tsx` (host + gating + trigger)
- Modify: `Promo/src/app/components/reports/DepartmentReportView.tsx` (header button when allowed)

**Interfaces:**
- Consumes: `getReportRoster`, `getAckRecords`, `getReportChangeSet`, `ReportColumn`.
- Produces: `export function ReportAcknowledgeDrawer(props: { open: boolean; onOpenChange: (o: boolean) => void; campaign: PromoCampaign; department: ReportDepartment; version: number; lines: PromoLine[]; }): JSX.Element;`

- [ ] **Step 1: Create the drawer.**

A `<Sheet>` (right side) listing each changed/added/excluded line of the current version; per line, show each roster user of the department with a ✓ (acknowledged, + timestamp from `getAckRecords`) or a muted «не ознакомлен». Header summary «Ознакомились: X из Y пользователей». Read-only. Follow `VersionHistoryDrawer.tsx` markup conventions.

- [ ] **Step 2: Gate + host in `ReportsPage`.**

Compute `const canSeeAck = currentRole === "Администратор" || currentRole === "Директор маркетинга" || currentRole === "Старший КМ" || currentRole === "Коммерческий директор";` (responsible manager / Администратор — align to the roles that already have full report access via `getReportAccess`). When `canSeeAck`, render a **«Кто ознакомился»** button (in the header actions) that opens `ReportAcknowledgeDrawer` (deferred open per the Radix rule). Host the drawer at page level.

- [ ] **Step 3: Build → PASS. In-browser check.**

As **Администратор** / **Директор маркетинга**, a «Кто ознакомился» button appears and opens a detail listing roster users per changed line with ✓/timestamp; as **Сотрудник закупа** the button is absent. Seeded acks (u-mkt-1) show as acknowledged; others as not.

- [ ] **Step 4: Commit.**

```bash
git add Promo/src/app/components/reports/ReportAcknowledgeDrawer.tsx Promo/src/app/components/reports/ReportsPage.tsx Promo/src/app/components/reports/DepartmentReportView.tsx
git commit -m "feat(reports): «кто ознакомился» role-gated detail drawer (E-1 §2)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification (after Phase 4)

- [ ] `corepack pnpm --filter promo build` → PASS
- [ ] `corepack pnpm --filter dashboard build` → PASS (no shared regression)
- [ ] `git status` shows only Promo-local files + the design/plan docs changed; no `packages/` or `Dashboard/` diff.
- [ ] In-browser walk of `/reports` (1440 + 390px, light + dark) exercising every acceptance criterion in the spec §"Acceptance criteria".
- [ ] Update `docs/AI_CONTEXT.md`, `Promo/CLAUDE.md`, `HISTORY.md` (via `/doc_sync`) — E-1 complete; note mock limits (per-browser ack, seeded rosters/snapshots).

---

## Self-review notes (author)

- **Spec coverage:** §1 fields → T1.1; per-column filters + reset → T3.1; xlsx → T3.2. §2 «Изменение» plashki → T1.2/T2.2; excluded kept → T2.1/T2.2; per-cell tooltip → T2.2; three counters → T2.2; «Только изменения» rename → T2.2; version snapshot + current marker → T4.1; per-user ack + «все изменения (N)» → T4.2; who-acknowledged → T4.3. §3 table styling → T1.2. All spec sections map to a task.
- **Type consistency:** `ReportColumn` (T1.1) is used as `fields`/`columns` everywhere; `ReportField` kept as an alias to avoid churn. `ReportChangeSet.changedCells` becomes `ReportCellChange[]` (T2.1) and every consumer (`cellChanged`, `lineHasUnacked`, counters, tooltip, xlsx `changeKind`) uses the object shape. `changeKind` signature `(lineId) => "added"|"changed"|"excluded"|null` is identical in `DepartmentReportView`, `ReportFilters.applyReportFilters`, and `report-xlsx`.
- **Ack model:** acknowledgement is per-`(campaign, department, version, line, user)`; counters are version totals (not ack-decremented); the header button's `(N)` is the unacked count — consistent across T2.2 and T4.2.
- **No-test reality:** every task verifies via build + explicit browser checks (no fabricated unit tests), per Global Constraints.
