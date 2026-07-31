# Полный промо-календарь: построчная модель статусов + подарки — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework `/full-calendar` to a per-line status model (single «Все статусы» filter, row-state highlighting, «Детали изменений» side panel, КМ rejection indicator) and relabel the gift blocks — per «10-я часть» Blocks 1–7 (R46) + R44.

**Architecture:** A new pure module derives one `LineStatus` per `PromoLine` from existing campaign/line flags + a new optional `line.pending` (unapproved repeat action). The grid renders approved data always, highlights only repeat-pending rows light-orange, shows a «Черновик» chip and gray/struck cancelled rows, drops the status plashки/badge/amber-cell, and adds an eye icon opening a read-only `LineDetailsDrawer`. The page swaps the per-campaign «Статус» filter for a per-line «Все статусы» filter, routes post-approval edits into `line.pending`, and hosts the drawer + a per-user rejection-seen store.

**Tech Stack:** React 18 + TypeScript, Vite 6, Tailwind v4, shadcn/ui via `@texnomart/ui`, lucide-react. Mock data in `Promo/src/lib/`. No test runner in the repo — pure logic is verified with a throwaway node smoke script (SheetJS-style `createRequire`), UI via `build:promo` + in-browser QA (Playwright).

## Global Constraints

- Commands run via `corepack pnpm --filter promo …` (pnpm not on PATH). Build: `corepack pnpm --filter promo build`. Vite build is transpile-only — it does NOT typecheck; verify types by reading + in-browser QA.
- Promo-local only — do NOT edit `packages/shared`, `packages/ui`, or `Dashboard/`. After the wave, `build:dashboard` must still pass.
- All UI text Russian. Money via `<Money>`/`formatSum` («… сум»); dates via `<RuDate>` (DD.MM.YYYY). Numbers `toLocaleString("ru-RU")` + `tabular-nums`.
- Dark theme: every new/changed surface works in both themes — soft tints as `bg-X-50 dark:bg-X-500/15` + `text-X-700 dark:text-X-300`; never `bg-[#hex]`; brand yellow = `primary` token.
- Radix `asChild` triggers must wrap a **native** `<button className={cn(buttonVariants({…}))}>`, never the shared `<Button>` (no forwardRef → off-screen portals; see tasks/lessons.md).
- A controlled Dialog/Sheet opened from a plain button (not a Trigger) must defer the open: `setTimeout(() => setOpen(true), 0)` (DismissableLayer self-close; see tasks/lessons.md).
- Pattern F invariant: the frozen pane and scrolling pane share fixed row heights — never change a row's height on only one pane.
- Commit after each task with a `feat(promo):`/`refactor(promo):` message ending `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. Commit to `main` (no feature branch).

---

## File map

| File | Create/Modify | Responsibility |
|---|---|---|
| `Promo/src/lib/full-calendar-status.ts` | Create | `LineStatus`, `lineDisplayStatus`, filter helpers, `isRepeatActionPending`, `lineHasRejection`, `mergePendingChange` |
| `Promo/src/lib/promo-mock-data.ts` | Modify | `LinePendingChange` type; `PromoLine.pending`; `LineSeed.pending` threaded through `PROMO_LINES`; new seed lines |
| `Promo/src/lib/full-calendar-rejection-store.ts` | Create | per-user «просмотренные отклонения» (localStorage) |
| `Promo/src/app/components/full-calendar/gridFields.ts` | Modify | gift column labels «Подарок (1)/(2)» |
| `Promo/src/app/components/full-calendar/LineDetailsDrawer.tsx` | Create | read-only «Детали изменений» Sheet |
| `Promo/src/app/components/full-calendar/FullCalendarGrid.tsx` | Modify | row-state highlight, eye icon + КМ red dot, «Черновик» chip, drop plashки/badge/amber, gift caption/chip |
| `Promo/src/app/components/full-calendar/FullCalendarPage.tsx` | Modify | «Все статусы» per-line filter; edit→pending routing; drawer host; rejection-seen state |

---

## Task 1: Gift block relabeling (R44)

**Files:**
- Modify: `Promo/src/app/components/full-calendar/gridFields.ts:132-137`
- Modify: `Promo/src/app/components/full-calendar/FullCalendarGrid.tsx` (GiftCell choice caption + band mechanic chip)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by later tasks (independent).

- [ ] **Step 1: Rename the gift column labels.** In `gridFields.ts`, change the six gift column `label`s so the group reads «Подарок (1)» / «Подарок (2)» instead of «Подарок №1» / «Подарок №2»:

```ts
  { id: "gift1Nomenclature", label: "Подарок (1)", width: 220, group: "marketing", source: "km", kind: "text", giftOnly: true },
  { id: "gift1Availability", label: "Подарок (1): наличие, %", width: 160, group: "marketing", source: "1c", kind: "percent", giftOnly: true },
  { id: "gift1Stock", label: "Подарок (1): остаток", width: 150, group: "marketing", source: "1c", kind: "number", giftOnly: true },
  { id: "gift2Nomenclature", label: "Подарок (2)", width: 220, group: "marketing", source: "km", kind: "text", giftOnly: true },
  { id: "gift2Availability", label: "Подарок (2): наличие, %", width: 160, group: "marketing", source: "1c", kind: "percent", giftOnly: true },
  { id: "gift2Stock", label: "Подарок (2): остаток", width: 150, group: "marketing", source: "1c", kind: "number", giftOnly: true },
```

- [ ] **Step 2: Caption the choice block «Подарок на выбор».** In `FullCalendarGrid.tsx` `GiftCell`, inside the `ctx.giftChoice && slot === 0` branch, prepend a caption sub-row above the options list. Find the choice branch (the `if (ctx.giftChoice) { if (slot === 1) … return (<div className={cn("flex flex-col", CELL)} …>` block) and insert, as the FIRST child of the `flex-col` container, before `{rows.map(…)}`:

```tsx
        <div
          className="flex items-center gap-1 border-b border-gray-100 px-3 text-[11px] font-semibold text-orange-700 dark:border-border dark:text-orange-300"
          style={{ height: GIFT_SUBROW_H - 8 }}
        >
          <Gift className="size-3" />
          Подарок на выбор
        </div>
```

Then bump `lineHeightPx` for choice lines by one caption row so the panes stay aligned — in `lineHeightPx`, change the choice branch to add the caption:

```ts
function lineHeightPx(line: PromoLine, isChoice: boolean, editable: boolean): number {
  if (!isChoice) return ROW_H_PX;
  const giftCount = line.gifts?.length ?? 0;
  const contentRows = Math.max(giftCount, 1);
  const addRow = editable ? 1 : 0;
  const captionRow = 1; // «Подарок на выбор» caption (Part A)
  return Math.max(ROW_H_PX, (captionRow + contentRows + addRow) * GIFT_SUBROW_H);
}
```

Because the caption occupies `GIFT_SUBROW_H - 8` but the height budget adds a full `GIFT_SUBROW_H`, the block has a small breathing gap — acceptable. Verify visually in Step 4 that the frozen pane (main nomenclature, merged) and the gift pane stay row-aligned.

- [ ] **Step 3: Band mechanic chip.** In `FullCalendarGrid.tsx`, in the SCROLL-side band (the `<div>` with `{changeBadges?.get(campaign.id) && …}`), add — as the first child, before the ChangeBadge — a mechanic chip for gift campaigns:

```tsx
                    {isGiftType(campaign.type) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                        <Gift className="size-2.5" />
                        {isGiftChoiceType(campaign.type)
                          ? "Подарки: на выбор"
                          : "Подарки: 2 фиксированных"}
                      </span>
                    )}
```

`isGiftType`, `isGiftChoiceType`, `Gift` are already imported in this file.

- [ ] **Step 4: Verify build + in-browser.** Run:

```
corepack pnpm --filter promo build
```

Expected: `built in …s`, no errors. Then `corepack pnpm --filter promo dev`, log in (`admin@texnomart.uz` / `Admin2026!`), open `/full-calendar` as Администратор. Confirm: PR-2026-014 («Подарок на выбор к телевизорам») shows the «Подарки: на выбор» band chip + a «Подарок на выбор» caption above its options list; a fixed-gift campaign (PR-2026-003 «1+1») shows «Подарки: 2 фиксированных» and column headers «Подарок (1)» / «Подарок (2)»; «+ Добавить подарок» opens the 1С picker and adds an option (row height grows on BOTH panes). No horizontal desync.

- [ ] **Step 5: Commit.**

```
git add Promo/src/app/components/full-calendar/gridFields.ts Promo/src/app/components/full-calendar/FullCalendarGrid.tsx
git commit -m "feat(promo): 10-я часть R44 — подписи механик подарков (Подарок (1)/(2) + «на выбор» + чип в band)"
```

---

## Task 2: `LineStatus` derivation + `line.pending` model

**Files:**
- Create: `Promo/src/lib/full-calendar-status.ts`
- Modify: `Promo/src/lib/promo-mock-data.ts` (add `LinePendingChange`, `PromoLine.pending`, `LineSeed.pending` + thread it in `PROMO_LINES.map`)
- Test: `scratchpad/status-smoke.js` (throwaway node smoke script)

**Interfaces:**
- Consumes: `PromoCampaign`, `PromoLine`, `CampaignStatus` from `promo-mock-data`.
- Produces (used by Tasks 4–7):
  - `type LineStatus` (10 concrete values)
  - `const STATUS_FILTER_UMBRELLA = "На согласовании (общее)"`
  - `const STATUS_FILTER_OPTIONS: string[]`
  - `function lineDisplayStatus(campaign: PromoCampaign, line: PromoLine): LineStatus`
  - `function matchesStatusFilter(status: LineStatus, filter: string): boolean`
  - `function isRepeatActionPending(line: PromoLine): boolean`
  - `function lineHasRejection(line: PromoLine): boolean`
  - `function mergePendingChange(line, patch, actor, atISO): LinePendingChange`
  - `interface LinePendingChange` (exported from `promo-mock-data`, re-exported here)

- [ ] **Step 1: Add the `LinePendingChange` type + `PromoLine.pending` in `promo-mock-data.ts`.** Immediately BEFORE `export interface PromoLine {` (around line 855) insert:

```ts
/**
 * An unapproved repeat action on an already-approved line (feedback 10-я, Блоки 2/4):
 * the main table keeps showing the last APPROVED values; the new values live only here
 * + in the «Детали изменений» side panel until re-approval. `rejected` set → the repeat
 * action was declined → status «Отклонённые изменения» + red КМ indicator.
 */
export interface LinePendingChange {
  action: "change" | "addition";
  /** For action==="change": per-field diff vs the approved value. */
  fields?: { field: keyof PromoLine; label: string; was: string; now: string }[];
  /** Role label (no per-person identity in the mock). */
  by: string;
  /** ISO date the repeat action was sent for approval. */
  at: string;
  comment?: string;
  /** «Тип запроса» shown in the panel, e.g. «Изменение цен и прогноза» / «Добавлена номенклатура». */
  requestType: string;
  /** Set when the repeat action was rejected (→ «Отклонённые изменения» + КМ indicator). */
  rejected?: { by: string; at: string; reason: string };
}
```

Then inside `PromoLine`, after the `removalRequestedBy?: string;` line (≈916), add:

```ts
  /** Unapproved repeat action (10-я Блоки 2/4) — table still shows approved data. */
  pending?: LinePendingChange;
```

- [ ] **Step 2: Thread `pending` through the seed.** In `LineSeed` (≈935), after `removalReason?: string;` add:

```ts
  pending?: LinePendingChange;
```

In the `PROMO_LINES.map` return object (≈1031), after `removalRequestedBy: …,` add:

```ts
    pending: s.pending,
```

- [ ] **Step 3: Create `full-calendar-status.ts`.** Full file:

```ts
import type {
  CampaignStatus,
  LinePendingChange,
  PromoCampaign,
  PromoLine,
} from "./promo-mock-data";

export type { LinePendingChange };

/** The concrete status a single line can have (what `lineDisplayStatus` returns). */
export type LineStatus =
  | "Черновик"
  | "На согласовании у старшего КМ"
  | "На согласовании у коммерческого директора"
  | "Переотправлено на корректировку КМ"
  | "Изменения на согласовании"
  | "Исключение на согласовании"
  | "Отклонённые изменения"
  | "Согласовано"
  | "Согласовано и отправлено смежным отделам"
  | "Отменена / Удалена";

/** Synthetic filter value — matches any line awaiting a decision (Блок 3.4/7.3). */
export const STATUS_FILTER_UMBRELLA = "На согласовании (общее)";

/** Statuses the umbrella «На согласовании (общее)» covers. */
export const PENDING_APPROVAL_STATUSES: LineStatus[] = [
  "На согласовании у старшего КМ",
  "На согласовании у коммерческого директора",
  "Изменения на согласовании",
  "Исключение на согласовании",
];

/** Dropdown options for the single «Все статусы» filter (Блок 7.2), in the spec order. */
export const STATUS_FILTER_OPTIONS: string[] = [
  "Черновик",
  STATUS_FILTER_UMBRELLA,
  "На согласовании у старшего КМ",
  "На согласовании у коммерческого директора",
  "Переотправлено на корректировку КМ",
  "Изменения на согласовании",
  "Исключение на согласовании",
  "Отклонённые изменения",
  "Согласовано",
  "Согласовано и отправлено смежным отделам",
  "Отменена / Удалена",
];

const APPROVED_STATUS: CampaignStatus = "Согласовано и отправлено смежным отделам";

/**
 * The one per-line status (10-я Блоки 1–7). Priority: removed → exclusion-pending →
 * rejected-repeat → pending-repeat → cancelled campaign → campaign.status/line.rejected.
 */
export function lineDisplayStatus(
  campaign: PromoCampaign,
  line: PromoLine
): LineStatus {
  if (line.removed) return "Отменена / Удалена";
  if (line.removalPending) return "Исключение на согласовании";
  if (line.pending?.rejected) return "Отклонённые изменения";
  if (line.pending) return "Изменения на согласовании"; // change OR addition (Блок 4)
  if (campaign.cancelled) return "Отменена / Удалена";

  switch (campaign.status) {
    case "Черновик":
      return "Черновик";
    case "Переотправлено на корректировку КМ":
      return "Переотправлено на корректировку КМ";
    case "На согласовании у старшего КМ":
      return "На согласовании у старшего КМ";
    case "На согласовании у коммерческого директора":
      return "На согласовании у коммерческого директора";
    case "Согласовано и отправлено смежным отделам":
      return "Согласовано и отправлено смежным отделам";
    default:
      break;
  }
  // A primary-flow rejected line on a still-under-review campaign.
  if (line.rejected) return "Переотправлено на корректировку КМ";
  // Unplanned draft not yet sent, or any other → treat as draft unless approved.
  if (!campaign.planned && !campaign.firstSendDone) return "Черновик";
  return campaign.status === APPROVED_STATUS
    ? "Согласовано и отправлено смежным отделам"
    : "Согласовано";
}

/** Filter predicate for the single «Все статусы» control. */
export function matchesStatusFilter(status: LineStatus, filter: string): boolean {
  if (!filter || filter === "all" || filter === "Все статусы") return true;
  if (filter === STATUS_FILTER_UMBRELLA)
    return PENDING_APPROVAL_STATUSES.includes(status);
  return status === filter;
}

/** Light-orange highlight (Блок 1.3): only active repeat actions awaiting approval. */
export function isRepeatActionPending(line: PromoLine): boolean {
  return Boolean(
    (line.pending && !line.pending.rejected) ||
      (line.removalPending && !line.removed)
  );
}

/** Whether a negative decision exists (drives the КМ red indicator, Блок 6). */
export function lineHasRejection(line: PromoLine): boolean {
  return Boolean(line.rejected || line.pending?.rejected);
}

/** Compact «Черновик» chip condition (Блок 3.1). */
export function isDraftLine(campaign: PromoCampaign, line: PromoLine): boolean {
  return lineDisplayStatus(campaign, line) === "Черновик";
}

/**
 * Fold an edit patch into a `LinePendingChange` for an approved line (Блок 2/4): the
 * table keeps the approved values, the diff accumulates here. `fmt` renders values as
 * plain strings for the panel; the caller supplies field labels via `labelOf`.
 */
export function mergePendingChange(
  line: PromoLine,
  patch: Partial<PromoLine>,
  labelOf: (field: keyof PromoLine) => string,
  fmt: (field: keyof PromoLine, value: unknown) => string,
  actor: string,
  atISO: string
): LinePendingChange {
  const prev = line.pending;
  const fields = [...(prev?.fields ?? [])];
  for (const key of Object.keys(patch) as (keyof PromoLine)[]) {
    const was = fmt(key, line[key]);
    const now = fmt(key, patch[key]);
    if (was === now) continue;
    const existing = fields.find((f) => f.field === key);
    if (existing) existing.now = now;
    else fields.push({ field: key, label: labelOf(key), was, now });
  }
  return {
    action: prev?.action ?? "change",
    fields,
    by: actor,
    at: atISO,
    requestType: prev?.requestType ?? "Изменение данных позиции",
    comment: prev?.comment,
  };
}
```

- [ ] **Step 4: Write the smoke script** `scratchpad/status-smoke.js` (throwaway; the scratchpad dir is in the system prompt):

```js
const { createRequire } = require("module");
// esbuild-transpile the TS on the fly via the app's own dev deps is overkill; instead
// re-implement the 3 assertions against the compiled logic by importing through Vite is
// not available in plain node. So we assert the PURE priority table by hand-porting the
// switch is brittle. Simpler: rely on the in-browser evaluate() check in Step 6 instead.
console.log("Pure-logic checks run in-browser (Step 6) — no node harness in this repo.");
```

Rationale: the repo has no TS test runner and `full-calendar-status.ts` imports app types; a faithful node harness would need the Vite/esbuild pipeline. The pure priority is instead asserted **in-browser** in Step 6 via `page.evaluate` over the live module. (This step exists to make the decision explicit, not to add a framework.)

- [ ] **Step 5: Verify build.** Run `corepack pnpm --filter promo build`. Expected: green. This confirms the new module + type changes transpile and are import-consistent.

- [ ] **Step 6: In-browser pure-logic check.** With dev running and `/full-calendar` open as Администратор, run in the browser console (or Playwright `evaluate`) a check that every option is derivable — this is validated concretely after Task 3 seeds land; for now assert the module loaded:

```js
// Placeholder assertion — real status coverage verified in Task 8 QA after seeds exist.
document.body.innerText.includes("Полный промо-календарь")
```

- [ ] **Step 7: Commit.**

```
git add Promo/src/lib/full-calendar-status.ts Promo/src/lib/promo-mock-data.ts
git commit -m "feat(promo): 10-я часть R46 — построчная деривация LineStatus + модель line.pending"
```

---

## Task 3: Seed all repeat-action states

**Files:**
- Modify: `Promo/src/lib/promo-mock-data.ts` (LINE_SEED — add `pending` to L-0015; add L-0022/L-0023 on PR-2026-003, km-1)

**Interfaces:**
- Consumes: `LinePendingChange` (Task 2), the `LineSeed` shape.
- Produces: seeded lines that make «Изменения на согласовании», «Отклонённые изменения», new-position-after-approval, and the КМ red-dot demonstrable. Consumed by Task 8 QA.

Preconditions to confirm while implementing: PR-2026-003.status === «Согласовано и отправлено смежным отделам» and it is not cancelled (grep `id: "PR-2026-003"` in `CAMPAIGNS`). If it is not the approved campaign, use whichever campaign IS approved and has km-1 or km-4 lines, and adjust ids/comments accordingly.

- [ ] **Step 1: Add `pending` (change) to L-0015.** In `LINE_SEED`, replace the L-0015 entry with the same fields + a `pending` (a price/forecast change awaiting re-approval):

```ts
  { id: "L-0015", campaignId: "PR-2026-003", kmId: "km-4", nomenclatureId: "1C-10017", off: 0.16, forecast: 40, regular: 14, gifts: ["1C-10018", "1C-10019"], utp: "Гарантия 3 года", advKm: true, advMkt: true, supplierCompensation: 400000, compensationLimit: 50,
    pending: {
      action: "change",
      requestType: "Изменение цены и прогноза",
      by: "Категорийный менеджер (КМ)",
      at: new Date(2026, 6, 28, 11, 40).toISOString(),
      comment: "Просим снизить цену для увеличения продаж в период подготовки к акции.",
      fields: [
        { field: "salesForecast", label: "Прогноз продаж", was: "40", now: "55" },
        { field: "discountPct", label: "Скидка", was: "16%", now: "18%" },
      ],
    } },
```

- [ ] **Step 2: Add two new km-1 lines on PR-2026-003 (addition + rejected change).** Immediately after the L-0016 seed line, add:

```ts
  // 10-я часть демо: новая позиция после согласования (Блок 4.4) — светло-оранжевая, у КМ km-1.
  { id: "L-0022", campaignId: "PR-2026-003", kmId: "km-1", nomenclatureId: "1C-10002", off: 0.12, forecast: 30, advKm: true,
    pending: {
      action: "addition",
      requestType: "Добавлена номенклатура",
      by: "Категорийный менеджер (КМ)",
      at: new Date(2026, 6, 29, 9, 20).toISOString(),
      comment: "Добавляю позицию в уже согласованную акцию — прошу согласовать.",
    } },
  // 10-я часть демо: отклонённые повторные изменения (Блок 6.6) → красный индикатор у КМ km-1.
  { id: "L-0023", campaignId: "PR-2026-003", kmId: "km-1", nomenclatureId: "1C-10005", off: 0.14, forecast: 45, regular: 20,
    pending: {
      action: "change",
      requestType: "Изменение цены",
      by: "Категорийный менеджер (КМ)",
      at: new Date(2026, 6, 27, 15, 5).toISOString(),
      comment: "Снижение цены под конкурента.",
      fields: [{ field: "discountPct", label: "Скидка", was: "14%", now: "20%" }],
      rejected: {
        by: "Коммерческий директор",
        at: new Date(2026, 6, 28, 10, 15).toISOString(),
        reason: "Скидка ниже минимальной маржи по категории — верните к 16%.",
      },
    } },
```

(Nomenclature ids `1C-10002` / `1C-10005` exist in `NOMENCLATURE`; confirm by grep while implementing — if absent, use any two valid ids.)

- [ ] **Step 3: Verify build.** `corepack pnpm --filter promo build` → green.

- [ ] **Step 4: In-browser sanity.** Dev + `/full-calendar` as Администратор: PR-2026-003 now shows L-0015/L-0022/L-0023 as light-orange rows (except L-0023, which is rejected → NOT highlighted; see Task 6). Full visual behavior lands after Tasks 6–7; here just confirm the rows exist and the build is green.

- [ ] **Step 5: Commit.**

```
git add Promo/src/lib/promo-mock-data.ts
git commit -m "feat(promo): 10-я часть R46 — сиды повторных действий (изменение/добавление/отклонение) на PR-2026-003"
```

---

## Task 4: Per-user rejection-seen store

**Files:**
- Create: `Promo/src/lib/full-calendar-rejection-store.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (used by Task 7):
  - `function getSeenRejections(userId: string | null): Set<string>`
  - `function markRejectionSeen(userId: string | null, lineId: string): void`

- [ ] **Step 1: Create the store.** Mirrors `report-ack-store.ts`'s defensive idiom. Full file:

```ts
"use client";

/**
 * Per-user set of rejection details the КМ has already viewed (10-я Блок 6.4): a red
 * indicator on a rejected line disappears once its «Детали изменений» panel is opened.
 * localStorage, keyed by user (anon fallback) — mock, per-browser.
 */
const KEY_PREFIX = "promo:fc-rejection-seen:";

function keyFor(userId: string | null): string {
  return KEY_PREFIX + (userId ?? "anon");
}

export function getSeenRejections(userId: string | null): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((x) => typeof x === "string")) : new Set();
  } catch {
    return new Set();
  }
}

export function markRejectionSeen(userId: string | null, lineId: string): void {
  if (typeof window === "undefined") return;
  try {
    const seen = getSeenRejections(userId);
    if (seen.has(lineId)) return;
    seen.add(lineId);
    window.localStorage.setItem(keyFor(userId), JSON.stringify([...seen]));
  } catch {
    // ignore quota / serialization errors (mock)
  }
}
```

- [ ] **Step 2: Verify build.** `corepack pnpm --filter promo build` → green.

- [ ] **Step 3: Commit.**

```
git add Promo/src/lib/full-calendar-rejection-store.ts
git commit -m "feat(promo): 10-я часть R46 — стор просмотренных отклонений (per-user, localStorage)"
```

---

## Task 5: `LineDetailsDrawer` (read-only «Детали изменений»)

**Files:**
- Create: `Promo/src/app/components/full-calendar/LineDetailsDrawer.tsx`

**Interfaces:**
- Consumes: `LineStatus`/`lineDisplayStatus` (Task 2), `PromoCampaign`/`PromoLine`/`getNomenclatureItem`/`getCategoryManager`/`formatPromoNo` (mock-data), `RuDate`.
- Produces (used by Task 7):
  - `interface LineDetailsDrawerProps { open: boolean; onOpenChange: (o: boolean) => void; campaign?: PromoCampaign; line?: PromoLine; }`
  - `function LineDetailsDrawer(props): JSX.Element`

- [ ] **Step 1: Create the component.** Full file:

```tsx
"use client";

import * as React from "react";
import { Eye, Ban, Plus, Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@texnomart/ui/sheet";
import { RuDate } from "../../../components/RuDate";
import {
  formatPromoNo,
  getCategoryManager,
  getNomenclatureItem,
  type PromoCampaign,
  type PromoLine,
} from "../../../lib/promo-mock-data";
import { lineDisplayStatus } from "../../../lib/full-calendar-status";

export interface LineDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: PromoCampaign;
  line?: PromoLine;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium text-gray-900 dark:text-gray-100">
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t pt-3">
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * Read-only «Детали изменений» panel (10-я Блоки 4.3/5.3/6.7). Action decisions
 * (Согласовать/Отклонить строку) belong to the approval card (Волна 3 / R57).
 */
export function LineDetailsDrawer({
  open,
  onOpenChange,
  campaign,
  line,
}: LineDetailsDrawerProps) {
  const status = campaign && line ? lineDisplayStatus(campaign, line) : undefined;
  const nom = line ? getNomenclatureItem(line.nomenclatureId) : undefined;
  const km = line ? getCategoryManager(line.kmId) : undefined;
  const pending = line?.pending;
  const isExclusion = Boolean(line?.removalPending || line?.removed);
  const rejected = pending?.rejected;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-[420px]">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2">
            <Eye className="size-4 text-muted-foreground" />
            Детали изменений
          </SheetTitle>
          <SheetDescription>
            {status ? (
              <span className="inline-flex items-center gap-1.5">
                {pending?.action === "addition" && <Plus className="size-3.5 text-orange-600" />}
                {isExclusion && <Ban className="size-3.5 text-orange-600" />}
                {pending?.action === "change" && <Pencil className="size-3.5 text-orange-600" />}
                {status}
              </span>
            ) : (
              "Позиция"
            )}
          </SheetDescription>
        </SheetHeader>

        {campaign && line && (
          <div className="mt-4 space-y-3">
            <Section title="Информация об акции">
              <Row label="№ промо" value={formatPromoNo(campaign.id)} />
              <Row label="Номенклатура" value={nom?.name ?? line.nomenclatureId} />
              <Row label="ФИО КМ" value={km?.name ?? line.kmId} />
              <Row label="Тип промо" value={campaign.type} />
              <Row label="Название акции" value={campaign.name} />
              <Row
                label="Период акции"
                value={
                  <span className="tabular-nums">
                    <RuDate value={campaign.startDate} /> — <RuDate value={campaign.endDate} />
                  </span>
                }
              />
            </Section>

            {pending?.action === "change" && pending.fields && pending.fields.length > 0 && (
              <Section title="Изменение">
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1 text-sm">
                  <span className="text-xs font-semibold text-muted-foreground">Поле</span>
                  <span className="text-xs font-semibold text-muted-foreground">Было</span>
                  <span className="text-xs font-semibold text-muted-foreground">Стало</span>
                  {pending.fields.map((f) => (
                    <React.Fragment key={String(f.field)}>
                      <span className="text-gray-700 dark:text-gray-200">{f.label}</span>
                      <span className="text-right tabular-nums text-muted-foreground line-through">
                        {f.was}
                      </span>
                      <span className="text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">
                        {f.now}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </Section>
            )}

            {pending?.action === "addition" && (
              <Section title="Изменение">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  Добавлена номенклатура в уже согласованную акцию. Данные позиции — в
                  основной таблице; станут актуальными после согласования.
                </p>
              </Section>
            )}

            {isExclusion && (
              <Section title="Изменение">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  Тип действия: <b>Запрос на исключение из промо</b>. Ранее согласованная
                  позиция — КМ предлагает исключить её из акции.
                </p>
              </Section>
            )}

            <Section title="Детали запроса">
              <Row
                label="Тип запроса"
                value={
                  pending?.requestType ??
                  (isExclusion ? "Запрос на исключение из промо" : "—")
                }
              />
              <Row
                label="Кто отправил"
                value={pending?.by ?? line.removalRequestedBy ?? "—"}
              />
              <Row
                label="Дата отправки"
                value={pending ? <RuDate value={new Date(pending.at)} withTime /> : "—"}
              />
              <Row
                label="Комментарий"
                value={pending?.comment ?? line.removalReason ?? "—"}
              />
            </Section>

            {rejected && (
              <Section title="Отклонение">
                <Row label="Кто отклонил" value={rejected.by} />
                <Row label="Дата" value={<RuDate value={new Date(rejected.at)} withTime />} />
                <Row label="Причина" value={rejected.reason} />
              </Section>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

Confirm `RuDate` supports a `withTime` prop (it's used across the app, e.g. `MyParticipationsPanel`). If its prop name differs, match the existing usage.

- [ ] **Step 2: Verify build.** `corepack pnpm --filter promo build` → green.

- [ ] **Step 3: Commit.**

```
git add Promo/src/app/components/full-calendar/LineDetailsDrawer.tsx
git commit -m "feat(promo): 10-я часть R46 — панель «Детали изменений» (Поле/Было/Стало · запрос · отклонение)"
```

---

## Task 6: Grid row-state + eye icon + drop plashки/badge/amber

**Files:**
- Modify: `Promo/src/app/components/full-calendar/FullCalendarGrid.tsx`

**Interfaces:**
- Consumes: `lineDisplayStatus`, `isRepeatActionPending`, `LineStatus` (Task 2); `LineDetailsDrawer` is hosted by the page (Task 7), the grid only calls back.
- Produces (new props consumed by Task 7):
  - `onOpenDetails?: (lineId: string) => void`
  - `rejectionLineIds?: Set<string>` (red КМ dot)
  - Removed props: `changedCells`, `changeBadges` (page stops passing them).

- [ ] **Step 1: Import the status helpers.** Add to the `full-calendar-status` import (create the import if absent):

```ts
import {
  isRepeatActionPending,
  lineDisplayStatus,
} from "../../../lib/full-calendar-status";
```

Add `Eye` to the lucide import list.

- [ ] **Step 2: Extend the grid props.** In the grid's props interface, add:

```ts
  onOpenDetails?: (lineId: string) => void;
  rejectionLineIds?: Set<string>;
```

and REMOVE `changedCells?: Set<string>` and `changeBadges?: Map<…>` from the props type and the destructure (they are superseded). Also delete the `ChangeBadge` component and its render site in the scroll-side band (the `{changeBadges?.get(campaign.id) && <ChangeBadge …/>}` line).

- [ ] **Step 3: Replace the row highlight classes (both panes).** In the FROZEN-pane line `<div>` (≈655) and the SCROLL-pane line `<div>` (≈873), replace the status-tint block:

```tsx
                        line.pending1CCheck && "bg-amber-50/50 dark:bg-amber-500/10",
                        line.rejected &&
                          "bg-red-50/70 dark:bg-red-500/10 hover:bg-red-50 dark:hover:bg-red-500/15",
                        line.removalPending && "bg-orange-50/60 dark:bg-orange-500/10",
                        line.removed &&
                          "bg-red-50/70 dark:bg-red-500/10 opacity-70 hover:bg-red-50 dark:hover:bg-red-500/15"
```

with (10-я Блок 1.3/1.4/5.5 — light-orange ONLY for repeat-pending; cancelled gray+struck):

```tsx
                        isRepeatActionPending(line) &&
                          "bg-orange-50/70 dark:bg-orange-500/10",
                        line.removed &&
                          "text-gray-400 line-through opacity-70 dark:text-gray-500"
```

Do this in BOTH panes identically. (`line.pending1CCheck` tint is dropped — the «ожидает 1С» clock marker in `LineMarkers` stays as a data-quality signal.)

- [ ] **Step 4: Drop the amber changed-cell ring.** In the SCROLL-pane cell `<div>` (≈901), remove the line:

```tsx
                                changedCells?.has(`${line.id}:${col.id}`) &&
                                  "bg-amber-50 dark:bg-amber-500/15 ring-1 ring-inset ring-amber-300 dark:ring-amber-500/40"
```

- [ ] **Step 5: Slim `LineMarkers` to data-quality only (Блок 1.2).** Replace the `LineMarkers` component body so it renders ONLY `duplicate` + `pending1CCheck` (drop `rejected`, `removalPending`, `removed` plashки — those states now read from row state + the eye panel):

```tsx
function LineMarkers({ line }: { line: PromoLine }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {line.duplicate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 dark:bg-amber-500/20 px-1 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-300">
              <Copy className="size-2.5" />
              дубль
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px]">
            {line.duplicateInfo
              ? line.duplicateInfo.samePromo
                ? "Уже добавлена в эту акцию. Добавление не блокируется."
                : `Уже участвует в акции ${formatPromoNo(line.duplicateInfo.promoId)} «${line.duplicateInfo.promoName}». Добавление не блокируется.`
              : "Номенклатура уже участвует в промо-акции. Добавление не блокируется."}
          </TooltipContent>
        </Tooltip>
      )}
      {line.pending1CCheck && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Clock className="size-3.5 text-orange-500 dark:text-orange-400" />
          </TooltipTrigger>
          <TooltipContent>Ожидает проверки 1С</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}
```

(`AlertCircle` / `Ban` imports may become unused after this + Step 3; leave `Ban` if still used by `LineRowActions`, remove `AlertCircle` from the import if the build warns — it won't error, but keep the import list clean.)

- [ ] **Step 6: Add the «Черновик» chip + eye icon (+ КМ red dot) in the frozen pane.** In the frozen-pane name cell, inside the trailing `<span className="ml-auto flex shrink-0 items-center gap-0.5">`, BEFORE `<LineRowActions …/>`, insert the «Черновик» chip and the eye button. First compute the status once per line (add near the top of the `lines.map((line) => {` body in the FROZEN pane, after `const nom = …`):

```tsx
                  const status = lineDisplayStatus(campaign, line);
                  const showRejectDot = rejectionLineIds?.has(line.id) ?? false;
```

Then render (chip before the actions span, eye as the first action):

```tsx
                        {status === "Черновик" && (
                          <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-muted dark:text-gray-300">
                            Черновик
                          </span>
                        )}
```

and inside the actions `<span …>`, as the first child:

```tsx
                          {onOpenDetails && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => onOpenDetails(line.id)}
                                  aria-label="Просмотр деталей"
                                  className="relative inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-accent dark:hover:text-gray-100"
                                >
                                  <Eye className="size-4" />
                                  {showRejectDot && (
                                    <span className="absolute right-0.5 top-0.5 size-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-card" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Просмотр деталей</TooltipContent>
                            </Tooltip>
                          )}
```

- [ ] **Step 7: Verify build.** `corepack pnpm --filter promo build` → green. Fix any now-unused imports the transpile flags (it won't fail the build, but remove dead imports).

- [ ] **Step 8: Commit.**

```
git add Promo/src/app/components/full-calendar/FullCalendarGrid.tsx
git commit -m "feat(promo): 10-я часть R46 — грид: подсветка строки по статусу, иконка-глаз + красный индикатор КМ, «Черновик», убраны плашки/бейдж/янтарная обводка"
```

---

## Task 7: Page — «Все статусы» filter, edit→pending, drawer host, rejection state

**Files:**
- Modify: `Promo/src/app/components/full-calendar/FullCalendarPage.tsx`

**Interfaces:**
- Consumes: `lineDisplayStatus`, `matchesStatusFilter`, `STATUS_FILTER_OPTIONS`, `STATUS_FILTER_UMBRELLA`, `lineHasRejection`, `mergePendingChange` (Task 2); `getSeenRejections`/`markRejectionSeen` (Task 4); `LineDetailsDrawer` (Task 5); grid props `onOpenDetails`/`rejectionLineIds` (Task 6).
- Produces: the finished screen.

- [ ] **Step 1: Imports + filter option source.** Add:

```ts
import { LineDetailsDrawer } from "./LineDetailsDrawer";
import {
  STATUS_FILTER_OPTIONS,
  lineDisplayStatus,
  lineHasRejection,
  matchesStatusFilter,
  mergePendingChange,
} from "../../../lib/full-calendar-status";
import {
  getSeenRejections,
  markRejectionSeen,
} from "../../../lib/full-calendar-rejection-store";
import { useCurrentUser } from "../../current-user-context";
```

Replace the `status` filter's options in `FILTERS` (≈110-114): change

```ts
  {
    key: "status",
    label: "Статус",
    options: CAMPAIGN_STATUSES.map((s) => ({ value: s, label: s })),
  },
```

to

```ts
  {
    key: "status",
    label: "Все статусы",
    options: STATUS_FILTER_OPTIONS.map((s) => ({ value: s, label: s })),
  },
```

(If `CAMPAIGN_STATUSES` is now unused, remove it from the import to keep the build clean.)

- [ ] **Step 2: Apply the filter PER LINE.** Find where lines are derived for display (the `displayLinesFor` / `linesForDisplay` memo that already handles КМ own-line filtering + «Скрыть отменённое»). Add a per-line status filter using the row's campaign. Concretely, wherever a campaign's visible lines are computed, add:

```ts
      .filter((line) => {
        const c = campaignById.get(line.campaignId);
        if (!c) return false;
        return matchesStatusFilter(lineDisplayStatus(c, line), values.status);
      })
```

`campaignById` = a `Map` of `[campaign.id, campaign]` over `visibleCampaigns ∪ CAMPAIGNS` (build it once via `React.useMemo`). Ensure the per-campaign group is dropped when it has zero passing lines (the existing empty-group handling already covers this; if not, filter `groups` to those with ≥1 line unless the campaign itself matches a campaign-level filter). Keep the existing `hideCancelled`, `ownKmId`, тип/КМ/признак/№/период filters intact and AND-combined.

- [ ] **Step 3: Tighten «Скрыть отменённые» (Блок 5.6).** Find the line filter for `hideCancelled` on lines (≈354): it currently hides `removed` lines. Confirm it hides ONLY `line.removed`, NOT `line.removalPending`. If it hides `removalPending` too, change the predicate to `!(hideCancelled && line.removed)`. (Campaign-level `hideCancelled && c.cancelled` stays.)

- [ ] **Step 4: Route post-approval edits into `line.pending`.** Find the grid's `onEdit` handler (the callback passed to `<FullCalendarGrid onEdit=… />`, likely `handleEdit` dispatching `{ type: "edit", … }`). Wrap it so an edit on an APPROVED campaign accumulates a pending change instead of mutating fields:

```ts
  const handleEdit = React.useCallback(
    (lineId: string, patch: Partial<PromoLine>) => {
      const line = lines.get(lineId);
      const c = line ? campaignById.get(line.campaignId) : undefined;
      if (line && c && isApprovedCampaign(c)) {
        const pending = mergePendingChange(
          line,
          patch,
          (f) => TRACKED_FIELD_LABEL[f] ?? String(f),
          (f, v) => fmtPendingValue(f, v),
          currentRole,
          new Date().toISOString()
        );
        dispatch({ type: "setPending", id: lineId, pending });
        toast.info("Изменение отправлено на повторное согласование — в таблице пока показаны согласованные данные.");
        return;
      }
      dispatch({ type: "edit", id: lineId, patch });
    },
    [lines, campaignById, currentRole]
  );
```

Add two small local helpers near the top of the file (module scope), reusing the money/percent/number formatting the grid uses:

```ts
const TRACKED_FIELD_LABEL: Partial<Record<keyof PromoLine, string>> = {
  stock: "Остаток",
  newPrice: "Новая цена",
  discountPct: "Скидка",
  salesForecast: "Прогноз продаж",
  regularSales: "Регулярные продажи",
  cashDiscountPct: "Скидка за Cash",
  supplierCompensation: "Компенсация поставщика",
  compensationLimit: "Лимит компенсации",
  utp: "УТП",
};
function fmtPendingValue(field: keyof PromoLine, v: unknown): string {
  if (v == null || v === "") return "—";
  if (field === "newPrice" || field === "supplierCompensation")
    return `${Number(v).toLocaleString("ru-RU")} сум`;
  if (field === "discountPct" || field === "cashDiscountPct") return `${v}%`;
  if (typeof v === "number") return v.toLocaleString("ru-RU");
  return String(v);
}
```

Add the reducer actions `setPending` / `clearPending` to `lineReducer`:

```ts
  | { type: "setPending"; id: string; pending: LinePendingChange }
  | { type: "clearPending"; id: string };
```

```ts
    case "setPending": {
      const cur = state.get(action.id);
      if (!cur) return state;
      const next = new Map(state);
      next.set(action.id, { ...cur, pending: action.pending });
      return next;
    }
    case "clearPending": {
      const cur = state.get(action.id);
      if (!cur) return state;
      const next = new Map(state);
      const { pending, ...rest } = cur;
      next.set(action.id, rest as PromoLine);
      return next;
    }
```

Import `isApprovedCampaign` and `LinePendingChange` from mock-data (add to the existing import if not present).

- [ ] **Step 5: Drawer state + rejection-seen.** Add state:

```ts
  const { currentUser } = useCurrentUser();
  const [detailsLineId, setDetailsLineId] = React.useState<string | null>(null);
  const [seenTick, setSeenTick] = React.useState(0);

  const isKm = currentRole === "Категорийный менеджер (КМ)";
  const seenRejections = React.useMemo(
    () => (isKm ? getSeenRejections(currentUser?.id ?? null) : new Set<string>()),
    [isKm, currentUser?.id, seenTick]
  );
  const rejectionLineIds = React.useMemo(() => {
    if (!isKm) return new Set<string>();
    const out = new Set<string>();
    for (const line of lines.values())
      if (lineHasRejection(line) && !seenRejections.has(line.id)) out.add(line.id);
    return out;
  }, [isKm, lines, seenRejections]);

  const handleOpenDetails = React.useCallback(
    (lineId: string) => {
      const line = lines.get(lineId);
      if (isKm && line && lineHasRejection(line)) {
        markRejectionSeen(currentUser?.id ?? null, lineId);
        setSeenTick((t) => t + 1);
      }
      setTimeout(() => setDetailsLineId(lineId), 0); // defer past the click (DismissableLayer)
    },
    [lines, isKm, currentUser?.id]
  );

  const detailsLine = detailsLineId ? lines.get(detailsLineId) : undefined;
  const detailsCampaign = detailsLine
    ? campaignById.get(detailsLine.campaignId)
    : undefined;
```

- [ ] **Step 6: Wire the grid + host the drawer.** On `<FullCalendarGrid …>`, remove the `changedCells={…}` and `changeBadges={…}` props, replace the `onEdit` with the new `handleEdit`, and add:

```tsx
          onOpenDetails={handleOpenDetails}
          rejectionLineIds={rejectionLineIds}
```

After the grid (near the other hosted dialogs/drawers at the end of the returned JSX), add:

```tsx
      <LineDetailsDrawer
        open={detailsLineId !== null}
        onOpenChange={(o) => !o && setDetailsLineId(null)}
        campaign={detailsCampaign}
        line={detailsLine}
      />
```

- [ ] **Step 7: Verify build (both apps).** Run:

```
corepack pnpm --filter promo build
corepack pnpm --filter dashboard build
```

Expected: both green. Read the diff once more for type consistency (`values.status`, reducer action names, `campaignById` defined before use).

- [ ] **Step 8: Commit.**

```
git add Promo/src/app/components/full-calendar/FullCalendarPage.tsx
git commit -m "feat(promo): 10-я часть R46 — «Все статусы» построчный фильтр, edit→line.pending, хост панели деталей, красный индикатор КМ"
```

---

## Task 8: Full in-browser QA + fixes

**Files:** none new (fix-forward in the Task 1–7 files if QA finds issues).

- [ ] **Step 1: Boot dev + log in.** `corepack pnpm --filter promo dev`; Playwright to `http://localhost:5173/login`; click «Войти»; go to `/full-calendar`.

- [ ] **Step 2: Statuses + filter (Администратор).** Clear `promo:plan-state` isn't relevant here. Turn OFF «Скрыть отменённое». Verify via the «Все статусы» filter that each option narrows the list correctly and «На согласовании (общее)» shows every pending row (ст.КМ + КД + Изменения + Исключение). Confirm PR-2026-003: L-0015 row = light-orange + eye→panel «Изменение» (Прогноз 40→55, Скидка 16%→18%); L-0022 = light-orange, eye→«Добавлена номенклатура»; L-0023 = NOT highlighted (rejected), eye→«Отклонение» (кто/дата/причина); UN-2026-015 L-0020 = light-orange «Исключение на согласовании», eye→«Запрос на исключение» + reason; PR-2026-004 lines (Скрыть off) = gray + struck «Отменена / Удалена».

- [ ] **Step 3: Block 2 — table shows approved data.** Confirm L-0015's «Прогноз продаж» / «Скидка» cells in the MAIN table still show the approved 40 / 16% (NOT 55 / 18%) — the new values appear ONLY in the panel. No amber cell rings anywhere. No band «N изм.» badge, no rejected/removal plashки next to names (only «дубль»/«ожидает 1С» may remain).

- [ ] **Step 4: КМ red indicator.** Switch role to «Категорийный менеджер (КМ)» (representative km-1). Confirm the eye on L-0023 (km-1, rejected) shows a red dot; L-0022 (km-1, addition) is light-orange with NO red dot (awaiting, not rejected). Open L-0023's panel → red dot disappears. Reload → red dot stays gone (localStorage). Switch to Администратор → no red dots anywhere (indicator is КМ-only).

- [ ] **Step 5: «Черновик» + primary stages.** Confirm a «Черновик»-status campaign's lines show the compact «Черновик» chip and NO highlight; «На согласовании у старшего КМ» / «…коммерческого директора» campaigns' lines show NO highlight and are reachable via the filter.

- [ ] **Step 6: «Скрыть отменённые».** Toggle ON → `removed` lines (PR-2026-004) hidden; the `removalPending` line (L-0020) STAYS visible (Блок 5.6). Toggle OFF → cancelled reappear gray/struck.

- [ ] **Step 7: Gifts (from Task 1) regression.** Re-confirm the Part A behavior still holds after all changes.

- [ ] **Step 8: Mobile 390px smoke.** Resize to 390px; the drawer opens full-width; rows/gifts render without horizontal body scroll of the page.

- [ ] **Step 9: Console.** Only the pre-existing shared-Button/DialogOverlay ref warnings are acceptable; no new errors.

- [ ] **Step 10: Fix-forward + commit any QA fixes,** then a final:

```
corepack pnpm --filter promo build && corepack pnpm --filter dashboard build
```

Expected: both green.

---

## Self-review notes (author)

- **Spec coverage:** Блок 1 → Tasks 6 (highlight/plashки) + 7 (filter). Блок 2 → Task 7 Step 4 (edit→pending) + Task 8 Step 3 (approved data shown). Блок 3 → Task 6 Step 6 («Черновик» chip) + Task 2 (stage statuses) + Task 7 (umbrella filter). Блок 4 → Tasks 3 (addition seed) + 5 (panel) + 6 (highlight). Блок 5 → Tasks 6 (gray/struck) + 7 Step 3 («Скрыть» only removed). Блок 6 → Tasks 4 (store) + 6 (red dot) + 7 (КМ-gated). Блок 7 → Task 7 (single «Все статусы» filter). R44 → Task 1.
- **Out of scope (spec §«Не входит»):** Block 4.4 reports tail (Волна 5), R57 approval card (Волна 3), R74 distribution (Волна 6), reports alignment (Волна 5). No task covers them — intentional.
- **Type consistency:** reducer actions `setPending`/`clearPending`; grid props `onOpenDetails`/`rejectionLineIds`; filter key stays `"status"` with new options; `LinePendingChange` exported from mock-data, re-exported by the status module.
