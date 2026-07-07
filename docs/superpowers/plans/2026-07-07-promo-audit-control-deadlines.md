# E-3 «Аудит-лог и контроль сроков» (2→4 tabs) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework Promo `/audit` from 2 tabs into a 4-tab **«Аудит-лог и контроль сроков»** screen (Сроки по плану · Сроки по промо и отчётам · Показатели участников · Аудит-лог) focused on deadlines, responsible people, and overdue reasons.

**Architecture:** Promo-local React (Vite + TS, Tailwind v4, shadcn via `@texnomart/ui`, patterns via `@texnomart/shared`). One new pure lib module (`audit-control.ts`) derives a flat `ControlPoint[]` from existing seeds; the deadline tabs (1–2) render filtered slices through a shared band-layout table + filter set, the metrics tab (3) aggregates the **same** records per participant (so numbers reconcile), and the audit-log tab (4) reworks the existing `AuditLogTable` with a «Ключевые/Все действия» toggle. Read-only, seed-stale, role-gated.

**Tech Stack:** React 18 + TypeScript, Vite 6, Tailwind v4, shadcn/ui, lucide-react, react-router, date-fns (`ru` locale).

## Global Constraints

- **Promo-local only.** No edits to `@texnomart/shared`, `@texnomart/ui`, or `Dashboard/`. Verify `build:dashboard` stays green at the end.
- **Verification model:** no unit-test harness (`vite build` catches import/syntax/type-import errors; it does NOT typecheck app logic). Each task ends with a green `corepack pnpm --filter promo build` + the task's explicit in-browser checks via `corepack pnpm --filter promo dev`. Do NOT add a test framework.
- **pnpm via corepack:** `pnpm` is not on PATH — always `corepack pnpm …`. Promo build `corepack pnpm --filter promo build`; dev `corepack pnpm --filter promo dev`; Dashboard build `corepack pnpm --filter dashboard build`.
- **RU only.** All UI copy in Russian. Numbers `toLocaleString("ru-RU")` + `tabular-nums`. Dates via the existing `<RuDate>` (`withTime` where шкала needs time).
- **Read-only + seed-stale.** No mutation of seeds; everything is derived deterministically from the existing mock (`PLAN_APPROVALS`, `buildReviewItems`, `getCampaignVersions`, report helpers, `CATEGORY_MANAGERS`). In-session actions on other screens are NOT appended (documented limit, same as S8).
- **Role labels (exact, from `PROMO_ROLES`):** `"Коммерческий директор"`, `"Операционный директор"`, `"Директор маркетинга"`, `"Категорийный менеджер (КМ)"`, `"Старший КМ"`, `"Сотрудник маркетинга"`, `"Сотрудник закупа"`, `"Сотрудник аналитики"`, `"Администратор"`. **КМ = `"Категорийный менеджер (КМ)"`.**
- **Access gating (meaningful subset):** plain КМ → only the representative-`ownKmId` rows (tabs 1–3); Старший КМ / Коммерческий директор / Администратор → all; «Все действия» (drafts/edits) → Администратор only. Representative КМ id = `"km-3"` (Каримов Шерзод) — matches the existing full-calendar §7 `ownKmId`.
- **Dark mode:** every surface pairs a light class with a `dark:` variant (follow the existing audit components' hybrid classes).
- **Spec:** `docs/superpowers/specs/2026-07-07-promo-audit-control-deadlines-design.md` is the source of truth.

---

## File Structure

| File | Responsibility |
|---|---|
| `Promo/src/lib/promo-mock-data.ts` | **Modify** — export `KM_FILL_SLA_CALENDAR_DAYS`; add optional plan return/resend/deliver fields to `CampaignPlanApproval` + seed one demo chain (PR-2026-006); add `ownAuditKmId` const `"km-3"`. |
| `Promo/src/lib/audit-control.ts` | **New** — `ControlPoint`/`ControlResult`/`ParticipantMetricRow`/`ParticipantTask` types + `buildPlanControlPoints` / `buildPromoControlPoints` / `buildControlPoints` / `buildParticipantMetrics` / `buildParticipantTasks` / `timelinessBand` / `PARTICIPANT_ROLES` / `ROLE_CHECKPOINTS`. |
| `Promo/src/app/components/audit/AuditPage.tsx` | **Modify** — H1 → «Аудит-лог и контроль сроков»; 4 tabs; page-level date-range + role select + «Сбросить фильтры»; resolve access from `useRole`. |
| `Promo/src/app/components/audit/ControlDeadlinesFilters.tsx` | **New** — shared deadline filter set (период / № промо / ответственный / роль / контрольная точка / результат) + mobile Sheet + `applyControlFilters` + `EMPTY_CONTROL_FILTERS` + `countActiveControlFilters`. |
| `Promo/src/app/components/audit/ControlDeadlinesTable.tsx` | **New** — shared band-layout table for tabs 1–2 (sticky header, synced top/bottom scroll, gridlines) → Mode-B cards below md. |
| `Promo/src/app/components/audit/PlanDeadlinesTab.tsx` | **New** — Tab 1 wiring (plan points + filters + table). |
| `Promo/src/app/components/audit/PromoDeadlinesTab.tsx` | **New** — Tab 2 wiring (promo points + filters + table). |
| `Promo/src/app/components/audit/ParticipantMetricsTab.tsx` | **New** — Tab 3 (role selector + rating table + «Справочно» block). |
| `Promo/src/app/components/audit/ParticipantTasksDrawer.tsx` | **New** — Tab 3 drill-down Sheet. |
| `Promo/src/app/components/audit/AuditLogTable.tsx` | **Modify** — «Ключевые действия» / «Все действия» toggle (Администратор-gated) + role-scoped rows. |
| `Promo/src/app/components/audit/ControlEventsTimeline.tsx` | **Delete** — superseded by Tab 2 (in Task 8, after Tab 2 lands). |

---

## PHASE 1 — Data layer + shell

## Task 1: Seed prep — export fill-SLA const, plan demo chain, representative КМ

**Files:**
- Modify: `Promo/src/lib/promo-mock-data.ts` (const near line 3846; `CampaignPlanApproval` interface ~line 1624; `PLAN_APPROVALS` PR-2026-006 entry ~line 1672)

**Interfaces:**
- Produces:
  - `export const KM_FILL_SLA_CALENDAR_DAYS = 21;` (was module-private)
  - `export const OWN_AUDIT_KM_ID = "km-3";`
  - `CampaignPlanApproval` gains: `returnedAt?: Date; returnedBy?: string; returnComment?: string; resentAt?: Date; deliveredToKmAt?: Date;`

- [ ] **Step 1: Export the fill-SLA constant.** Find `const KM_FILL_SLA_CALENDAR_DAYS = 21;` (~line 3846) and add `export`:

```ts
export const KM_FILL_SLA_CALENDAR_DAYS = 21; // «заполнение КМ»: start − 21 кал. дн. (mock)
```

- [ ] **Step 2: Add the representative-КМ id.** Immediately after `CATEGORY_MANAGERS` (after line 84) add:

```ts
/** E-3/§7 audit access: a plain КМ sees only this representative КМ's rows (no per-person identity in the mock). */
export const OWN_AUDIT_KM_ID = "km-3";
```

- [ ] **Step 3: Extend `CampaignPlanApproval`.** Replace the interface (lines 1624–1629) with:

```ts
export interface CampaignPlanApproval {
  campaignId: string;
  marketing: PlanStageMarketing;
  kd: PlanStageDirector;
  od: PlanStageDirector;
  /** Optional §11.9 correction chain — emitted as informational control points when present. */
  returnedAt?: Date;
  returnedBy?: string;
  returnComment?: string;
  resentAt?: Date;
  deliveredToKmAt?: Date;
}
```

- [ ] **Step 4: Seed the demo chain on PR-2026-006.** Replace the `PR-2026-006` entry (lines 1672–1682) with:

```ts
  {
    campaignId: "PR-2026-006",
    marketing: {
      reviewedAt: new Date(2026, 3, 20, 15, 20),
      sentAt: new Date(2026, 4, 4, 8, 45),
      status: "overdue",
      overdueDays: 1,
    },
    kd: { decidedAt: new Date(2026, 4, 7, 10, 0), status: "onTime" },
    od: { status: "waiting" },
    returnedAt: new Date(2026, 4, 5, 12, 30),
    returnedBy: "Коммерческий директор",
    returnComment: "План возвращён на корректировку: уточнить перечень категорий.",
    resentAt: new Date(2026, 4, 6, 9, 15),
    deliveredToKmAt: new Date(2026, 4, 8, 11, 0),
  },
```

- [ ] **Step 5: Build.**

Run: `corepack pnpm --filter promo build`
Expected: succeeds (exit 0), no TS import errors.

- [ ] **Step 6: Commit.**

```bash
git add Promo/src/lib/promo-mock-data.ts
git commit -m "feat(promo): E-3 seed prep — export fill-SLA, plan correction chain, representative КМ"
```

---

## Task 2: `audit-control.ts` — types + `buildPlanControlPoints`

**Files:**
- Create: `Promo/src/lib/audit-control.ts`

**Interfaces:**
- Consumes (existing exports in `promo-mock-data.ts`): `PLAN_APPROVALS`, `getCampaignById`, `formatPromoNo`, `addCalendarDays(date,days)`, `addWorkingDays(start,days)`, `getOverdueDays(deadline,ref)`, `PLAN_MARKETING_REVIEW_LEAD_DAYS` (63), `PLAN_MARKETING_SUBMIT_LEAD_DAYS` (60), `PLAN_DIRECTOR_SLA_WORKING_DAYS` (3), `PromoCampaign`; from `role-context`: `PromoRole`.
- Produces: `ControlScope`, `ControlResult`, `ControlPoint`, `buildPlanControlPoints(ref?): ControlPoint[]`.

- [ ] **Step 1: Create the module with types + plan builder.**

```ts
import { ru } from "date-fns/locale";
import { format } from "date-fns";
import type { PromoRole } from "../app/role-context";
import {
  PLAN_APPROVALS,
  PLAN_MARKETING_REVIEW_LEAD_DAYS,
  PLAN_MARKETING_SUBMIT_LEAD_DAYS,
  PLAN_DIRECTOR_SLA_WORKING_DAYS,
  addCalendarDays,
  addWorkingDays,
  getOverdueDays,
  getCampaignById,
  formatPromoNo,
} from "./promo-mock-data";

export type ControlScope = "plan" | "promo";
export type ControlResult = "В срок" | "Просрочено" | "Ожидается";

/** One deadline/control-point record (spec §11.9). Tabs 1–2 render these; Tab 3 aggregates them. */
export interface ControlPoint {
  id: string;
  scope: ControlScope;
  campaignId: string;
  promoNo: string;
  promoName: string;
  planPeriod?: string;
  promoPeriod?: { start: Date; end: Date };
  checkpoint: string;
  responsibleName: string;
  responsibleRole: PromoRole;
  deadline: Date;
  actualAt?: Date;
  result: ControlResult;
  overdueDays: number;
  comment?: string;
}

/** Capitalised «LLLL yyyy» plan period, e.g. «Июль 2026». */
function planPeriodLabel(d: Date): string {
  const s = format(d, "LLLL yyyy", { locale: ru });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Result + overdue days from a deadline and an actual/ref date. */
function resolve(
  deadline: Date,
  actualAt: Date | undefined,
  ref: Date
): { result: ControlResult; overdueDays: number } {
  if (!actualAt) {
    const overdueDays = getOverdueDays(deadline, ref); // 0 unless deadline already passed
    return { result: "Ожидается", overdueDays };
  }
  const overdueDays = getOverdueDays(deadline, actualAt);
  return { result: overdueDays > 0 ? "Просрочено" : "В срок", overdueDays };
}

/** Plan control points (spec §11.9 tab 1) from PLAN_APPROVALS. */
export function buildPlanControlPoints(ref: Date = new Date()): ControlPoint[] {
  const points: ControlPoint[] = [];
  for (const pa of PLAN_APPROVALS) {
    const c = getCampaignById(pa.campaignId);
    if (!c) continue;
    const base = {
      scope: "plan" as const,
      campaignId: c.id,
      promoNo: c.id,
      promoName: c.name,
      planPeriod: planPeriodLabel(c.startDate),
    };

    // 1) Ознакомление плана — deadline start − 63 кал. дн.
    const reviewDeadline = addCalendarDays(c.startDate, -PLAN_MARKETING_REVIEW_LEAD_DAYS);
    const r1 = resolve(reviewDeadline, pa.marketing.reviewedAt, ref);
    points.push({
      ...base, id: `cp-plan-${c.id}-review`,
      checkpoint: "Ознакомление плана (дир. маркетинга)",
      responsibleName: "Директор маркетинга", responsibleRole: "Директор маркетинга",
      deadline: reviewDeadline, actualAt: pa.marketing.reviewedAt, ...r1,
    });

    // 2) Отправка плана на согласование — deadline start − 60 кал. дн.
    const sendDeadline = addCalendarDays(c.startDate, -PLAN_MARKETING_SUBMIT_LEAD_DAYS);
    const r2 = resolve(sendDeadline, pa.marketing.sentAt, ref);
    points.push({
      ...base, id: `cp-plan-${c.id}-send`,
      checkpoint: "Отправка плана на согласование",
      responsibleName: "Директор маркетинга", responsibleRole: "Директор маркетинга",
      deadline: sendDeadline, actualAt: pa.marketing.sentAt, ...r2,
    });

    // Optional correction chain (informational milestones — deadline = event date).
    if (pa.returnedAt) {
      points.push({
        ...base, id: `cp-plan-${c.id}-return`,
        checkpoint: "Возврат плана на корректировку",
        responsibleName: pa.returnedBy ?? "Коммерческий директор",
        responsibleRole: "Коммерческий директор",
        deadline: pa.returnedAt, actualAt: pa.returnedAt, result: "В срок", overdueDays: 0,
        comment: pa.returnComment,
      });
    }
    if (pa.resentAt) {
      points.push({
        ...base, id: `cp-plan-${c.id}-resent`,
        checkpoint: "Повторная отправка плана",
        responsibleName: "Директор маркетинга", responsibleRole: "Директор маркетинга",
        deadline: pa.resentAt, actualAt: pa.resentAt, result: "В срок", overdueDays: 0,
      });
    }

    // 3) Согласование КД — deadline = отправка + 3 раб. дн.
    const kdDeadline = addWorkingDays(pa.marketing.sentAt, PLAN_DIRECTOR_SLA_WORKING_DAYS);
    const r3 = resolve(kdDeadline, pa.kd.decidedAt, ref);
    points.push({
      ...base, id: `cp-plan-${c.id}-kd`,
      checkpoint: "Согласование КД (план)",
      responsibleName: "Коммерческий директор", responsibleRole: "Коммерческий директор",
      deadline: kdDeadline, actualAt: pa.kd.decidedAt, ...r3,
    });

    // 4) Согласование ОД — deadline = согл. КД + 3 раб. дн.
    const odDeadline = addWorkingDays(pa.kd.decidedAt ?? pa.marketing.sentAt, PLAN_DIRECTOR_SLA_WORKING_DAYS);
    const r4 = resolve(odDeadline, pa.od.decidedAt, ref);
    points.push({
      ...base, id: `cp-plan-${c.id}-od`,
      checkpoint: "Согласование ОД (план)",
      responsibleName: "Операционный директор", responsibleRole: "Операционный директор",
      deadline: odDeadline, actualAt: pa.od.decidedAt, ...r4,
    });

    // Доведение плана до КМ (informational).
    if (pa.deliveredToKmAt) {
      points.push({
        ...base, id: `cp-plan-${c.id}-deliver`,
        checkpoint: "Доведение плана до КМ",
        responsibleName: "Директор маркетинга", responsibleRole: "Директор маркетинга",
        deadline: pa.deliveredToKmAt, actualAt: pa.deliveredToKmAt, result: "В срок", overdueDays: 0,
      });
    }
  }
  return points;
}
```

- [ ] **Step 2: Build.**

Run: `corepack pnpm --filter promo build`
Expected: succeeds. (`audit-control.ts` isn't imported by any screen yet — this proves it compiles.)

- [ ] **Step 3: Commit.**

```bash
git add Promo/src/lib/audit-control.ts
git commit -m "feat(promo): E-3 audit-control types + buildPlanControlPoints"
```

---

## Task 3: `audit-control.ts` — `buildPromoControlPoints`

**Files:**
- Modify: `Promo/src/lib/audit-control.ts`

**Interfaces:**
- Consumes (existing): `CAMPAIGNS` (or `getAuditCampaigns`), `getCampaignById`, `buildReviewItems(ref)`, `seniorOverdueInfo(item,ref)`, `stageSlaStart(item,ref)`, `getCategoryManager(id)`, `getCampaignVersions(id)`, `getReportDeadline(c)`, `getReportSentAt(c)`, `isApprovedCampaign(c)`, `addCalendarDays`, `addWorkingDays`, `getOverdueDays`, `REVIEW_SLA_WORKING_DAYS` (2), `KM_FILL_SLA_CALENDAR_DAYS` (21), `PromoCampaign`, `ReviewItem`.
- Produces: `buildPromoControlPoints(ref?): ControlPoint[]`, `buildControlPoints(ref?): ControlPoint[]` (plan+promo concatenated).

- [ ] **Step 1: Extend the imports** at the top of `audit-control.ts` — replace the existing import block from `./promo-mock-data` with:

```ts
import {
  PLAN_APPROVALS,
  PLAN_MARKETING_REVIEW_LEAD_DAYS,
  PLAN_MARKETING_SUBMIT_LEAD_DAYS,
  PLAN_DIRECTOR_SLA_WORKING_DAYS,
  REVIEW_SLA_WORKING_DAYS,
  KM_FILL_SLA_CALENDAR_DAYS,
  CAMPAIGNS,
  addCalendarDays,
  addWorkingDays,
  getOverdueDays,
  getCampaignById,
  getCategoryManager,
  getCampaignVersions,
  getReportDeadline,
  getReportSentAt,
  isApprovedCampaign,
  buildReviewItems,
  seniorOverdueInfo,
  stageSlaStart,
  formatPromoNo,
  type ReviewItem,
} from "./promo-mock-data";
```

> If `CAMPAIGNS` is not exported, use `getAuditCampaigns()` instead (it is exported and returns all campaigns). Confirm by grep before implementing: `grep -n "export const CAMPAIGNS" Promo/src/lib/promo-mock-data.ts`. If absent, replace `CAMPAIGNS` with `getAuditCampaigns()` and import `getAuditCampaigns`.

- [ ] **Step 2: Append the promo builder + combined builder** to `audit-control.ts`:

```ts
const KM_ROLE: PromoRole = "Категорийный менеджер (КМ)";

/** Promo/report control points (spec §11.9 tab 2). */
export function buildPromoControlPoints(ref: Date = new Date()): ControlPoint[] {
  const points: ControlPoint[] = [];
  const items = buildReviewItems(ref);
  const itemsByCampaign = new Map<string, ReviewItem[]>();
  for (const it of items) {
    const arr = itemsByCampaign.get(it.campaignId) ?? [];
    arr.push(it);
    itemsByCampaign.set(it.campaignId, arr);
  }

  for (const c of CAMPAIGNS) {
    if (c.cancelled) continue;
    const base = {
      scope: "promo" as const,
      campaignId: c.id,
      promoNo: c.id,
      promoName: c.name,
      promoPeriod: { start: c.startDate, end: c.endDate },
    };
    const fillDeadline = c.fillDeadlineOverride ?? addCalendarDays(c.startDate, -KM_FILL_SLA_CALENDAR_DAYS);
    const versions = getCampaignVersions(c.id);
    const firstSend = versions.find((v) => v.changeType === "Первичная отправка");
    const cItems = itemsByCampaign.get(c.id) ?? [];

    // 1) Отправка данных КМ — one row per КМ that has a submission signal.
    const kmSubmissions: { kmId: string; at: Date }[] = cItems.map((it) => ({
      kmId: it.kmId,
      at: new Date(it.submittedAt),
    }));
    if (kmSubmissions.length === 0 && (isApprovedCampaign(c) || firstSend)) {
      // Fully-approved campaigns have no pending review items — attribute the first send to the lead КМ.
      const leadKm = c.participatingKmIds[0];
      if (leadKm) kmSubmissions.push({ kmId: leadKm, at: firstSend?.date ?? getReportSentAt(c) });
    }
    for (const sub of kmSubmissions) {
      const km = getCategoryManager(sub.kmId);
      const overdueDays = getOverdueDays(fillDeadline, sub.at);
      points.push({
        ...base, id: `cp-promo-${c.id}-datakm-${sub.kmId}`,
        checkpoint: "Отправка данных КМ",
        responsibleName: km?.name ?? "Категорийный менеджер", responsibleRole: KM_ROLE,
        deadline: fillDeadline, actualAt: sub.at,
        result: overdueDays > 0 ? "Просрочено" : "В срок", overdueDays,
        comment: overdueDays > 0 ? "Данные поданы после дедлайна заполнения." : undefined,
      });
    }

    // 2) Решение старшего КМ + 3) авто-передача КД (per review item).
    for (const it of cItems) {
      const submitted = new Date(it.submittedAt);
      const seniorDeadline = addWorkingDays(submitted, REVIEW_SLA_WORKING_DAYS);
      const senior = seniorOverdueInfo(it, ref); // defined only when auto-escalated (senior missed)
      const km = getCategoryManager(it.kmId);
      const seniorName = "Старший КМ";
      if (senior) {
        // Senior missed → auto-forward. Attribute the overdue to the Старший КМ.
        points.push({
          ...base, id: `cp-promo-${c.id}-senior-${it.kmId}`,
          checkpoint: "Решение старшего КМ",
          responsibleName: seniorName, responsibleRole: "Старший КМ",
          deadline: seniorDeadline, actualAt: undefined,
          result: "Просрочено", overdueDays: senior.seniorSlaDays,
          comment: "Срок согласования старшего КМ истёк.",
        });
        points.push({
          ...base, id: `cp-promo-${c.id}-autofwd-${it.kmId}`,
          checkpoint: "Авто-передача КД (просрочка старшего КМ)",
          responsibleName: seniorName, responsibleRole: "Старший КМ",
          deadline: senior.autoForwardedAt, actualAt: senior.autoForwardedAt,
          result: "Просрочено", overdueDays: senior.seniorSlaDays,
          comment: `КМ: ${km?.name ?? "—"} · передано автоматически.`,
        });
      } else if (it.kmStatus === "На согласовании у старшего КМ") {
        points.push({
          ...base, id: `cp-promo-${c.id}-senior-${it.kmId}`,
          checkpoint: "Решение старшего КМ",
          responsibleName: seniorName, responsibleRole: "Старший КМ",
          deadline: seniorDeadline, actualAt: undefined, ...resolve(seniorDeadline, undefined, ref),
        });
      } else {
        // Passed senior → decided at the КД-stage start (or submitted for seeds starting at КД).
        const decided = stageSlaStart(it, ref);
        const overdueDays = getOverdueDays(seniorDeadline, decided);
        points.push({
          ...base, id: `cp-promo-${c.id}-senior-${it.kmId}`,
          checkpoint: "Решение старшего КМ",
          responsibleName: seniorName, responsibleRole: "Старший КМ",
          deadline: seniorDeadline, actualAt: decided,
          result: overdueDays > 0 ? "Просрочено" : "В срок", overdueDays,
        });
      }

      // 4) Решение КД.
      const kdStart = stageSlaStart(it, ref);
      const kdDeadline = addWorkingDays(kdStart, REVIEW_SLA_WORKING_DAYS);
      if (it.kmStatus === "Согласовано КД") {
        const decided = getReportSentAt(c);
        const overdueDays = getOverdueDays(kdDeadline, decided);
        points.push({
          ...base, id: `cp-promo-${c.id}-kd-${it.kmId}`,
          checkpoint: "Решение КД",
          responsibleName: "Коммерческий директор", responsibleRole: "Коммерческий директор",
          deadline: kdDeadline, actualAt: decided,
          result: overdueDays > 0 ? "Просрочено" : "В срок", overdueDays,
        });
      } else if (
        it.kmStatus === "На согласовании у коммерческого директора" || senior
      ) {
        points.push({
          ...base, id: `cp-promo-${c.id}-kd-${it.kmId}`,
          checkpoint: "Решение КД",
          responsibleName: "Коммерческий директор", responsibleRole: "Коммерческий директор",
          deadline: kdDeadline, actualAt: undefined, ...resolve(kdDeadline, undefined, ref),
        });
      }

      // 5) Возврат на корректировку.
      if (it.kmStatus === "Переотправлено на корректировку КМ") {
        points.push({
          ...base, id: `cp-promo-${c.id}-return-${it.kmId}`,
          checkpoint: "Возврат на корректировку",
          responsibleName: "Коммерческий директор", responsibleRole: "Коммерческий директор",
          deadline: submitted, actualAt: submitted, result: "В срок", overdueDays: 0,
          comment: `КМ: ${km?.name ?? "—"} · набор возвращён на корректировку.`,
        });
      }
    }

    // 6) Отправка первичного отчёта + 7) новые версии.
    const reportDeadline = getReportDeadline(c);
    if (isApprovedCampaign(c)) {
      const sentAt = firstSend?.date ?? getReportSentAt(c);
      const overdueDays = getOverdueDays(reportDeadline, sentAt);
      const leadKm = getCategoryManager(c.participatingKmIds[0] ?? "");
      points.push({
        ...base, id: `cp-promo-${c.id}-report`,
        checkpoint: "Отправка первичного отчёта",
        responsibleName: leadKm?.name ?? "Категорийный менеджер", responsibleRole: KM_ROLE,
        deadline: reportDeadline, actualAt: sentAt,
        result: overdueDays > 0 ? "Просрочено" : "В срок", overdueDays,
        comment: overdueDays > 0 ? "Отчёт отправлен после дедлайна (старт − 17 кал. дн.)." : undefined,
      });
      for (const v of versions.filter((vv) => vv.version > 1)) {
        points.push({
          ...base, id: `cp-promo-${c.id}-report-v${v.version}`,
          checkpoint: `Новая версия отчёта (в.${v.version})`,
          responsibleName: v.author || (leadKm?.name ?? "Категорийный менеджер"),
          responsibleRole: KM_ROLE,
          deadline: v.date, actualAt: v.date, result: "В срок", overdueDays: 0,
          comment: v.summary,
        });
      }
    }
  }
  return points;
}

/** All control points (plan + promo), newest deadline first. */
export function buildControlPoints(ref: Date = new Date()): ControlPoint[] {
  return [...buildPlanControlPoints(ref), ...buildPromoControlPoints(ref)].sort(
    (a, b) => b.deadline.getTime() - a.deadline.getTime()
  );
}
```

- [ ] **Step 3: Build.**

Run: `corepack pnpm --filter promo build`
Expected: succeeds. If it fails on a missing export (`getCampaignVersions`, `seniorOverdueInfo`, `stageSlaStart`, `getReportDeadline`, `getReportSentAt`, `isApprovedCampaign`, `CAMPAIGNS`), grep the symbol in `promo-mock-data.ts` and fix the import name (all confirmed present except `CAMPAIGNS`, which has the `getAuditCampaigns()` fallback in Step 1).

- [ ] **Step 4: Commit.**

```bash
git add Promo/src/lib/audit-control.ts
git commit -m "feat(promo): E-3 buildPromoControlPoints + combined buildControlPoints"
```

---

## Task 4: `audit-control.ts` — participant metrics + tasks + `timelinessBand`

**Files:**
- Modify: `Promo/src/lib/audit-control.ts`

**Interfaces:**
- Consumes (existing): `CATEGORY_MANAGERS`.
- Produces: `PARTICIPANT_ROLES: PromoRole[]`, `TimelinessBand`, `timelinessBand(pct): TimelinessBand`, `ParticipantMetricRow`, `ParticipantTask`, `buildParticipantMetrics(role, ref?): ParticipantMetricRow[]`, `buildParticipantTasks(responsibleName, role, ref?): ParticipantTask[]`.

- [ ] **Step 1: Add `CATEGORY_MANAGERS` to the import block** (append to the `./promo-mock-data` import list): `CATEGORY_MANAGERS,`.

- [ ] **Step 2: Append the metrics layer** to `audit-control.ts`:

```ts
export const PARTICIPANT_ROLES: PromoRole[] = [
  "Категорийный менеджер (КМ)",
  "Старший КМ",
  "Коммерческий директор",
  "Директор маркетинга",
  "Операционный директор",
];

/** Which checkpoints each participant role is measured on. */
const ROLE_CHECKPOINTS: Record<string, string[]> = {
  "Категорийный менеджер (КМ)": ["Отправка данных КМ"],
  "Старший КМ": ["Решение старшего КМ", "Авто-передача КД (просрочка старшего КМ)"],
  "Коммерческий директор": ["Решение КД"],
  "Директор маркетинга": ["Ознакомление плана (дир. маркетинга)", "Отправка плана на согласование"],
  "Операционный директор": ["Согласование ОД (план)"],
};

export type TimelinessBand = "Высокая" | "Средняя" | "Низкая";

export function timelinessBand(pct: number): TimelinessBand {
  if (pct >= 90) return "Высокая";
  if (pct >= 70) return "Средняя";
  return "Низкая";
}

export interface ParticipantMetricRow {
  rank: number;
  name: string;
  dueCount: number;      // промо/задач с наступившим дедлайном
  onTime: number;
  overdue: number;
  timelinessPct: number; // 0 when dueCount === 0
  band: TimelinessBand;
  avgOverdueDays: number;
  returns: number;       // возвраты на корректировку
  resends: number;       // повторные отправки
}

export interface ParticipantTask {
  campaignId: string;
  promoNo: string;
  promoName: string;
  checkpoint: string;
  deadline: Date;
  actualAt?: Date;
  overdueDays: number;
  comment?: string;
}

/** The control points a given role is measured on (across plan + promo). */
function roleControlPoints(role: PromoRole, ref: Date): ControlPoint[] {
  const checkpoints = ROLE_CHECKPOINTS[role] ?? [];
  return buildControlPoints(ref).filter((p) => checkpoints.includes(p.checkpoint));
}

/** Distinct measured people for a role. КМ → the roster; other roles → single representative row. */
function participantsFor(role: PromoRole): string[] {
  if (role === "Категорийный менеджер (КМ)") {
    return CATEGORY_MANAGERS.filter((m) => !m.senior).map((m) => m.name);
  }
  if (role === "Старший КМ") {
    return [CATEGORY_MANAGERS.find((m) => m.senior)?.name ?? "Старший КМ"];
  }
  return [role]; // КД / дир. маркетинга / ОД — role label as the single aggregate row
}

export function buildParticipantMetrics(
  role: PromoRole,
  ref: Date = new Date()
): ParticipantMetricRow[] {
  const points = roleControlPoints(role, ref);
  const returnPoints = buildControlPoints(ref).filter((p) =>
    p.checkpoint === "Возврат на корректировку" || p.checkpoint === "Возврат плана на корректировку"
  );
  const versionPoints = buildControlPoints(ref).filter((p) =>
    p.checkpoint.startsWith("Новая версия отчёта") || p.checkpoint === "Повторная отправка плана"
  );

  const rows = participantsFor(role).map((name) => {
    const mine = points.filter((p) => p.responsibleName === name);
    const due = mine.filter((p) => p.deadline.getTime() <= ref.getTime());
    const onTime = due.filter((p) => p.result === "В срок").length;
    const overdue = due.filter((p) => p.result === "Просрочено").length;
    const dueCount = due.length;
    const timelinessPct = dueCount ? Math.round((onTime / dueCount) * 100) : 0;
    const overdueDaysArr = due.filter((p) => p.overdueDays > 0).map((p) => p.overdueDays);
    const avgOverdueDays = overdueDaysArr.length
      ? Math.round(overdueDaysArr.reduce((s, d) => s + d, 0) / overdueDaysArr.length)
      : 0;
    // returns/resends: campaigns touching this participant (approximation; documented mock limit).
    const myCampaigns = new Set(mine.map((p) => p.campaignId));
    const returns = returnPoints.filter((p) => myCampaigns.has(p.campaignId)).length;
    const resends = versionPoints.filter((p) => myCampaigns.has(p.campaignId)).length;
    return {
      rank: 0, name, dueCount, onTime, overdue, timelinessPct,
      band: timelinessBand(timelinessPct), avgOverdueDays, returns, resends,
    };
  });

  return rows
    .sort((a, b) => b.timelinessPct - a.timelinessPct || b.dueCount - a.dueCount)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

/** Drill-down: the control points measured for one participant. */
export function buildParticipantTasks(
  responsibleName: string,
  role: PromoRole,
  ref: Date = new Date()
): ParticipantTask[] {
  return roleControlPoints(role, ref)
    .filter((p) => p.responsibleName === responsibleName)
    .sort((a, b) => b.deadline.getTime() - a.deadline.getTime())
    .map((p) => ({
      campaignId: p.campaignId, promoNo: p.promoNo, promoName: p.promoName,
      checkpoint: p.checkpoint, deadline: p.deadline, actualAt: p.actualAt,
      overdueDays: p.overdueDays, comment: p.comment,
    }));
}
```

- [ ] **Step 3: Build.**

Run: `corepack pnpm --filter promo build`
Expected: succeeds.

- [ ] **Step 4: Commit.**

```bash
git add Promo/src/lib/audit-control.ts
git commit -m "feat(promo): E-3 participant metrics + drill-down + timelinessBand"
```

---

## Task 5: Shell rework — `AuditPage.tsx` (H1 + 4 tabs + page-level filters + access)

**Files:**
- Modify: `Promo/src/app/components/audit/AuditPage.tsx`

**Interfaces:**
- Consumes: `useRole` from `../../role-context`; `OWN_AUDIT_KM_ID` from `promo-mock-data`; the four tab components (Tabs 6–10 add the real ones; here they are placeholders that render "—" until their task lands).
- Produces: `AuditAccess` object passed to tabs: `{ role: PromoRole; canSeeAll: boolean; ownKmId: string; isAdmin: boolean }`; `AuditGlobalFilters` `{ from: string; to: string; role: "all" | PromoRole }`.

- [ ] **Step 1: Replace `AuditPage.tsx`** with the 4-tab shell (tab bodies call placeholder components created in later tasks — for THIS task, render the existing `AuditLogTable` under tab 4 and simple "В разработке" placeholders under tabs 1–3 so the shell builds and is verifiable):

```tsx
"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@texnomart/ui/tabs";
import { Button } from "@texnomart/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@texnomart/ui/select";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { useRole } from "../../role-context";
import { OWN_AUDIT_KM_ID } from "../../../lib/promo-mock-data";
import type { PromoRole } from "../../role-context";
import { PARTICIPANT_ROLES } from "../../../lib/audit-control";
import { AuditLogTable } from "./AuditLogTable";

const TAB_TRIGGER =
  "flex-none whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 data-[state=active]:shadow-none";

export interface AuditAccess {
  role: PromoRole;
  canSeeAll: boolean;
  ownKmId: string;
  isAdmin: boolean;
}
export interface AuditGlobalFilters {
  from: string;
  to: string;
  role: "all" | PromoRole;
}
const EMPTY_GLOBAL: AuditGlobalFilters = { from: "", to: "", role: "all" };

export function AuditPage() {
  const { currentRole } = useRole();
  const [tab, setTab] = React.useState("plan");
  const [globals, setGlobals] = React.useState<AuditGlobalFilters>(EMPTY_GLOBAL);

  const access: AuditAccess = React.useMemo(() => {
    const isAdmin = currentRole === "Администратор";
    const canSeeAll =
      isAdmin || currentRole === "Коммерческий директор" || currentRole === "Старший КМ";
    return { role: currentRole, canSeeAll, ownKmId: OWN_AUDIT_KM_ID, isAdmin };
  }, [currentRole]);

  const patch = (p: Partial<AuditGlobalFilters>) => setGlobals((g) => ({ ...g, ...p }));
  const reset = () => setGlobals(EMPTY_GLOBAL);

  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Аудит-лог и контроль сроков"
        subtitle="Контроль сроков этапов, согласований и отправок отчётов: кто ответственный и из-за кого возникла просрочка."
        showCompare={false}
        showExport={false}
      />

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList className="h-auto justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="plan" className={TAB_TRIGGER}>Сроки по плану</TabsTrigger>
            <TabsTrigger value="promo" className={TAB_TRIGGER}>Сроки по промо и отчётам</TabsTrigger>
            <TabsTrigger value="metrics" className={TAB_TRIGGER}>Показатели участников</TabsTrigger>
            <TabsTrigger value="log" className={TAB_TRIGGER}>Аудит-лог</TabsTrigger>
          </TabsList>

          {tab !== "log" && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date" value={globals.from} onChange={(e) => patch({ from: e.target.value })}
                className="h-9 rounded-md border border-gray-200 dark:border-border bg-white dark:bg-card px-2 text-sm"
                aria-label="Дата с"
              />
              <span className="text-gray-400">—</span>
              <input
                type="date" value={globals.to} onChange={(e) => patch({ to: e.target.value })}
                className="h-9 rounded-md border border-gray-200 dark:border-border bg-white dark:bg-card px-2 text-sm"
                aria-label="Дата по"
              />
              <Select
                value={globals.role}
                onValueChange={(v) => patch({ role: v as AuditGlobalFilters["role"] })}
              >
                <SelectTrigger className="h-9 w-[190px] bg-white dark:bg-card text-sm">
                  <SelectValue placeholder="Все роли" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  {PARTICIPANT_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={reset}>
                <RotateCcw className="size-4" /> Сбросить фильтры
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="plan" className="mt-0">
          <TabPlaceholder label="Сроки по плану" />
        </TabsContent>
        <TabsContent value="promo" className="mt-0">
          <TabPlaceholder label="Сроки по промо и отчётам" />
        </TabsContent>
        <TabsContent value="metrics" className="mt-0">
          <TabPlaceholder label="Показатели участников" />
        </TabsContent>
        <TabsContent value="log" className="mt-0">
          <AuditLogTable access={access} globals={globals} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-16 text-center text-sm text-muted-foreground">
      {label} — в разработке
    </div>
  );
}
```

> Note: `AuditLogTable` doesn't accept `access`/`globals` yet — Task 10 adds them. For THIS task, temporarily call `<AuditLogTable />` without props and wire the props in Task 10. Use `<AuditLogTable />` here.

- [ ] **Step 2: Fix the тab-4 call** — since `AuditLogTable` has no props until Task 10, render `<AuditLogTable />` (no props) in the `log` TabsContent for now.

- [ ] **Step 3: Build.**

Run: `corepack pnpm --filter promo build`
Expected: succeeds.

- [ ] **Step 4: In-browser check.**

Run: `corepack pnpm --filter promo dev`, open `/audit`.
Expected: H1 «Аудит-лог и контроль сроков»; 4 tabs; tabs 1–3 show the placeholder; tab 4 shows the existing log; the date-range + role + «Сбросить фильтры» appear on tabs 1–3 and hide on tab 4.

- [ ] **Step 5: Commit.**

```bash
git add Promo/src/app/components/audit/AuditPage.tsx
git commit -m "feat(promo): E-3 audit shell — rename, 4 tabs, page-level filters + access"
```

---

## PHASE 2 — Tab 1 (Сроки по плану) + shared table/filters

## Task 6: Shared deadline filters — `ControlDeadlinesFilters.tsx`

**Files:**
- Create: `Promo/src/app/components/audit/ControlDeadlinesFilters.tsx`

**Interfaces:**
- Consumes: `ControlPoint` from `audit-control`; `AuditGlobalFilters` from `AuditPage`.
- Produces: `ControlFilters`, `EMPTY_CONTROL_FILTERS`, `countActiveControlFilters(f): number`, `applyControlFilters(points, filters, globals): ControlPoint[]`, `<ControlDeadlinesFilters>` (desktop row + mobile Sheet).

- [ ] **Step 1: Create the filter module.**

```tsx
"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@texnomart/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@texnomart/ui/sheet";
import type { ControlPoint, ControlResult } from "../../../lib/audit-control";
import type { AuditGlobalFilters } from "./AuditPage";

export interface ControlFilters {
  promo: string;           // № промо substring
  responsible: string;     // "all" | exact responsibleName
  checkpoint: string;      // "all" | exact checkpoint
  result: "all" | ControlResult | "overdue"; // overdue = «Только просроченные»
}
export const EMPTY_CONTROL_FILTERS: ControlFilters = {
  promo: "", responsible: "all", checkpoint: "all", result: "all",
};

export function countActiveControlFilters(f: ControlFilters): number {
  let n = 0;
  if (f.promo.trim()) n++;
  if (f.responsible !== "all") n++;
  if (f.checkpoint !== "all") n++;
  if (f.result !== "all") n++;
  return n;
}

export function applyControlFilters(
  points: ControlPoint[],
  f: ControlFilters,
  g: AuditGlobalFilters
): ControlPoint[] {
  const fromTs = g.from ? new Date(`${g.from}T00:00:00`).getTime() : null;
  const toTs = g.to ? new Date(`${g.to}T23:59:59`).getTime() : null;
  return points.filter((p) => {
    if (g.role !== "all" && p.responsibleRole !== g.role) return false;
    const ts = p.deadline.getTime();
    if (fromTs !== null && ts < fromTs) return false;
    if (toTs !== null && ts > toTs) return false;
    if (f.promo.trim()) {
      const q = f.promo.trim().toLowerCase();
      if (!p.promoNo.toLowerCase().includes(q) && !p.promoName.toLowerCase().includes(q)) return false;
    }
    if (f.responsible !== "all" && p.responsibleName !== f.responsible) return false;
    if (f.checkpoint !== "all" && p.checkpoint !== f.checkpoint) return false;
    if (f.result === "overdue" && p.overdueDays <= 0) return false;
    else if (f.result !== "all" && f.result !== "overdue" && p.result !== f.result) return false;
    return true;
  });
}

function Fields({
  values, onChange, responsibles, checkpoints, layout = "row",
}: {
  values: ControlFilters;
  onChange: (p: Partial<ControlFilters>) => void;
  responsibles: string[];
  checkpoints: string[];
  layout?: "row" | "stack";
}) {
  const wrap = layout === "row" ? "flex flex-wrap items-end gap-2" : "flex flex-col gap-3";
  return (
    <div className={wrap}>
      <Input
        placeholder="№ промо или название"
        value={values.promo}
        onChange={(e) => onChange({ promo: e.target.value })}
        className="h-9 w-full sm:w-56 bg-white dark:bg-card text-sm"
      />
      <Select value={values.responsible} onValueChange={(v) => onChange({ responsible: v })}>
        <SelectTrigger className="h-9 w-full sm:w-52 bg-white dark:bg-card text-sm"><SelectValue placeholder="Ответственный" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все ответственные</SelectItem>
          {responsibles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={values.checkpoint} onValueChange={(v) => onChange({ checkpoint: v })}>
        <SelectTrigger className="h-9 w-full sm:w-64 bg-white dark:bg-card text-sm"><SelectValue placeholder="Контрольная точка" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все контрольные точки</SelectItem>
          {checkpoints.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={values.result} onValueChange={(v) => onChange({ result: v as ControlFilters["result"] })}>
        <SelectTrigger className="h-9 w-full sm:w-44 bg-white dark:bg-card text-sm"><SelectValue placeholder="Результат" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все</SelectItem>
          <SelectItem value="В срок">В срок</SelectItem>
          <SelectItem value="Просрочено">Просрочено</SelectItem>
          <SelectItem value="overdue">Только просроченные</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function ControlDeadlinesFilters({
  values, onChange, onClear, points, shown,
}: {
  values: ControlFilters;
  onChange: (p: Partial<ControlFilters>) => void;
  onClear: () => void;
  points: ControlPoint[];
  shown: number;
}) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const responsibles = React.useMemo(
    () => Array.from(new Set(points.map((p) => p.responsibleName))).sort(),
    [points]
  );
  const checkpoints = React.useMemo(
    () => Array.from(new Set(points.map((p) => p.checkpoint))).sort(),
    [points]
  );
  const active = countActiveControlFilters(values);

  return (
    <>
      <div className="hidden md:flex md:flex-wrap md:items-end md:justify-between md:gap-3">
        <Fields values={values} onChange={onChange} responsibles={responsibles} checkpoints={checkpoints} />
        <div className="flex items-center gap-3">
          {active > 0 && (
            <Button variant="ghost" size="sm" className="h-9" onClick={onClear}>Очистить</Button>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">Показано: {shown.toLocaleString("ru-RU")}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 md:hidden">
        <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setTimeout(() => setSheetOpen(true), 0)}>
          <SlidersHorizontal className="size-4" /> Фильтры
          {active > 0 && <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-black">{active}</span>}
        </Button>
        <span className="text-xs text-gray-500 dark:text-gray-400">Показано: {shown.toLocaleString("ru-RU")}</span>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
          <SheetHeader><SheetTitle>Фильтры сроков</SheetTitle></SheetHeader>
          <div className="px-4 pb-6">
            <Fields values={values} onChange={onChange} responsibles={responsibles} checkpoints={checkpoints} layout="stack" />
            <div className="mt-5 flex gap-2">
              {active > 0 && <Button variant="outline" className="flex-1" onClick={onClear}>Очистить</Button>}
              <Button className="flex-1" onClick={() => setSheetOpen(false)}>Показать {shown.toLocaleString("ru-RU")}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

- [ ] **Step 2: Build.**

Run: `corepack pnpm --filter promo build`
Expected: succeeds. If `@texnomart/ui/input` isn't the right path, grep `Promo/src` for an existing `from "@texnomart/ui/input"` import to confirm; it's used elsewhere.

- [ ] **Step 3: Commit.**

```bash
git add Promo/src/app/components/audit/ControlDeadlinesFilters.tsx
git commit -m "feat(promo): E-3 shared deadline filter set (+ mobile Sheet)"
```

---

## Task 7: Shared table `ControlDeadlinesTable.tsx` + Tab 1 `PlanDeadlinesTab.tsx`

**Files:**
- Create: `Promo/src/app/components/audit/ControlDeadlinesTable.tsx`
- Create: `Promo/src/app/components/audit/PlanDeadlinesTab.tsx`
- Modify: `Promo/src/app/components/audit/AuditPage.tsx` (swap the plan placeholder for `<PlanDeadlinesTab>`)

**Interfaces:**
- Consumes: `ControlPoint` from `audit-control`; `AuditAccess`/`AuditGlobalFilters` from `AuditPage`; the filter module from Task 6.
- Produces: `<ControlDeadlinesTable points columns>` where `columns: ("period"|"promo")[]` picks the leading columns (plan → «Период плана»; promo → «№/название» + «Период акции»); `<PlanDeadlinesTab access globals>`.

- [ ] **Step 1: Create `ControlDeadlinesTable.tsx`** (sticky header, gridlines, horizontal scroll, Mode-B cards below md). Result cell is tinted:

```tsx
"use client";

import * as React from "react";
import { cn } from "@texnomart/ui/utils";
import { RuDate } from "../../../components/RuDate";
import type { ControlPoint, ControlResult } from "../../../lib/audit-control";

const RESULT_TINT: Record<ControlResult, string> = {
  "В срок": "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Просрочено": "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  "Ожидается": "bg-gray-100 text-gray-600 dark:bg-muted dark:text-gray-300",
};

function ResultChip({ p }: { p: ControlPoint }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", RESULT_TINT[p.result])}>
      {p.result}
    </span>
  );
}

export function ControlDeadlinesTable({
  points, lead,
}: {
  points: ControlPoint[];
  lead: "plan" | "promo";
}) {
  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-16 text-center text-sm text-muted-foreground">
        Нет записей по выбранным фильтрам.
      </div>
    );
  }
  const th = "border-b border-r border-gray-200 dark:border-border bg-gray-50 dark:bg-muted/40 px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap";
  const td = "border-b border-r border-gray-100 dark:border-border px-3 py-2 text-sm align-top";

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:block">
        <div className="max-h-[calc(100vh-320px)] overflow-auto [scrollbar-gutter:stable]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                {lead === "plan" ? (
                  <th className={th}>Период плана</th>
                ) : (
                  <>
                    <th className={th}>№ и название промо</th>
                    <th className={th}>Период акции</th>
                  </>
                )}
                <th className={th}>Контрольная точка</th>
                <th className={th}>Ответственный · роль</th>
                <th className={th}>Дедлайн</th>
                <th className={th}>Факт</th>
                <th className={th}>Результат</th>
                <th className={th}>Просрочка</th>
                <th className={th}>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60 dark:hover:bg-muted/20">
                  {lead === "plan" ? (
                    <td className={cn(td, "whitespace-nowrap font-medium text-gray-900 dark:text-gray-100")}>{p.planPeriod}</td>
                  ) : (
                    <>
                      <td className={td}>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{p.promoName}</p>
                        <p className="font-mono text-[11px] text-gray-400 dark:text-gray-500">{p.promoNo}</p>
                      </td>
                      <td className={cn(td, "tabular-nums whitespace-nowrap text-gray-600 dark:text-gray-300")}>
                        {p.promoPeriod && (<><RuDate value={p.promoPeriod.start} />{" — "}<RuDate value={p.promoPeriod.end} /></>)}
                      </td>
                    </>
                  )}
                  <td className={cn(td, "text-gray-900 dark:text-gray-100")}>{p.checkpoint}</td>
                  <td className={td}>
                    <p className="text-gray-900 dark:text-gray-100">{p.responsibleName}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">{p.responsibleRole}</p>
                  </td>
                  <td className={cn(td, "tabular-nums whitespace-nowrap text-gray-600 dark:text-gray-300")}><RuDate value={p.deadline} withTime /></td>
                  <td className={cn(td, "tabular-nums whitespace-nowrap text-gray-600 dark:text-gray-300")}>{p.actualAt ? <RuDate value={p.actualAt} withTime /> : <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                  <td className={td}><ResultChip p={p} /></td>
                  <td className={cn(td, "tabular-nums text-red-600 dark:text-red-400")}>{p.overdueDays > 0 ? `+${p.overdueDays} дн.` : <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                  <td className={cn(td, "min-w-[180px] text-gray-600 dark:text-gray-300")}>{p.comment ?? <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards (Mode B) */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {points.map((p) => (
          <div key={p.id} className="rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card p-3 shadow-[0px_2px_4px_rgba(204,204,204,0.25)]">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.checkpoint}</span>
              <ResultChip p={p} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lead === "plan" ? p.planPeriod : <><span className="font-mono">{p.promoNo}</span> · {p.promoName}</>}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
              <span>Ответственный: <span className="text-gray-700 dark:text-gray-200">{p.responsibleName}</span></span>
              <span>Просрочка: <span className="text-red-600 dark:text-red-400">{p.overdueDays > 0 ? `+${p.overdueDays} дн.` : "—"}</span></span>
              <span>Дедлайн: <RuDate value={p.deadline} /></span>
              <span>Факт: {p.actualAt ? <RuDate value={p.actualAt} /> : "—"}</span>
            </div>
            {p.comment && <p className="mt-2 border-t border-gray-100 dark:border-border pt-2 text-xs text-gray-600 dark:text-gray-300">{p.comment}</p>}
          </div>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create `PlanDeadlinesTab.tsx`.**

```tsx
"use client";

import * as React from "react";
import { buildPlanControlPoints } from "../../../lib/audit-control";
import { OWN_AUDIT_KM_ID } from "../../../lib/promo-mock-data";
import type { AuditAccess, AuditGlobalFilters } from "./AuditPage";
import {
  ControlDeadlinesFilters, EMPTY_CONTROL_FILTERS, applyControlFilters, type ControlFilters,
} from "./ControlDeadlinesFilters";
import { ControlDeadlinesTable } from "./ControlDeadlinesTable";

export function PlanDeadlinesTab({
  access, globals,
}: { access: AuditAccess; globals: AuditGlobalFilters }) {
  const all = React.useMemo(() => buildPlanControlPoints(), []);
  // Plan points have no per-КМ attribution → a plain КМ sees none (documented limit).
  const scoped = React.useMemo(
    () => (access.canSeeAll ? all : []),
    [all, access.canSeeAll]
  );
  const [filters, setFilters] = React.useState<ControlFilters>(EMPTY_CONTROL_FILTERS);
  const shownPoints = React.useMemo(
    () => applyControlFilters(scoped, filters, globals),
    [scoped, filters, globals]
  );

  if (!access.canSeeAll) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-16 text-center text-sm text-muted-foreground">
        Сроки по плану доступны старшему КМ, коммерческому директору и администратору.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <ControlDeadlinesFilters
        values={filters}
        onChange={(p) => setFilters((f) => ({ ...f, ...p }))}
        onClear={() => setFilters(EMPTY_CONTROL_FILTERS)}
        points={scoped}
        shown={shownPoints.length}
      />
      <ControlDeadlinesTable points={shownPoints} lead="plan" />
    </div>
  );
}
```

- [ ] **Step 3: Wire it into `AuditPage.tsx`.** Add the import `import { PlanDeadlinesTab } from "./PlanDeadlinesTab";` and replace the plan `TabsContent` body:

```tsx
        <TabsContent value="plan" className="mt-0">
          <PlanDeadlinesTab access={access} globals={globals} />
        </TabsContent>
```

- [ ] **Step 4: Build + browser check.**

Run: `corepack pnpm --filter promo build`, then `corepack pnpm --filter promo dev` → `/audit` → tab «Сроки по плану».
Expected: table with plan rows; **PR-2026-006** shows the «Возврат плана на корректировку» + «Повторная отправка плана» + «Доведение плана до КМ» rows and «Согласование ОД (план)» as «Ожидается»; result chips tinted; «Только просроченные» filter narrows to overdue; switch active role to «Категорийный менеджер (КМ)» → the tab shows the access notice.

- [ ] **Step 5: Commit.**

```bash
git add Promo/src/app/components/audit/ControlDeadlinesTable.tsx Promo/src/app/components/audit/PlanDeadlinesTab.tsx Promo/src/app/components/audit/AuditPage.tsx
git commit -m "feat(promo): E-3 Tab 1 «Сроки по плану» + shared deadline table"
```

---

## PHASE 3 — Tab 2 (Сроки по промо и отчётам)

## Task 8: `PromoDeadlinesTab.tsx` + delete the timeline

**Files:**
- Create: `Promo/src/app/components/audit/PromoDeadlinesTab.tsx`
- Modify: `Promo/src/app/components/audit/AuditPage.tsx` (swap the promo placeholder)
- Delete: `Promo/src/app/components/audit/ControlEventsTimeline.tsx`

**Interfaces:**
- Consumes: `buildPromoControlPoints`; the shared table/filters; `AuditAccess`/`AuditGlobalFilters`.
- Produces: `<PromoDeadlinesTab access globals>`.

- [ ] **Step 1: Create `PromoDeadlinesTab.tsx`** (same shape as Tab 1 but promo-scoped + КМ own-row gating):

```tsx
"use client";

import * as React from "react";
import { buildPromoControlPoints } from "../../../lib/audit-control";
import { getCategoryManager, OWN_AUDIT_KM_ID } from "../../../lib/promo-mock-data";
import type { AuditAccess, AuditGlobalFilters } from "./AuditPage";
import {
  ControlDeadlinesFilters, EMPTY_CONTROL_FILTERS, applyControlFilters, type ControlFilters,
} from "./ControlDeadlinesFilters";
import { ControlDeadlinesTable } from "./ControlDeadlinesTable";

export function PromoDeadlinesTab({
  access, globals,
}: { access: AuditAccess; globals: AuditGlobalFilters }) {
  const all = React.useMemo(() => buildPromoControlPoints(), []);
  const scoped = React.useMemo(() => {
    if (access.canSeeAll) return all;
    // Plain КМ → only rows where they are the responsible КМ (representative ownKmId).
    const myName = getCategoryManager(access.ownKmId)?.name;
    return all.filter((p) => p.responsibleName === myName);
  }, [all, access]);
  const [filters, setFilters] = React.useState<ControlFilters>(EMPTY_CONTROL_FILTERS);
  const shownPoints = React.useMemo(
    () => applyControlFilters(scoped, filters, globals),
    [scoped, filters, globals]
  );

  return (
    <div className="flex flex-col gap-3">
      <ControlDeadlinesFilters
        values={filters}
        onChange={(p) => setFilters((f) => ({ ...f, ...p }))}
        onClear={() => setFilters(EMPTY_CONTROL_FILTERS)}
        points={scoped}
        shown={shownPoints.length}
      />
      <ControlDeadlinesTable points={shownPoints} lead="promo" />
    </div>
  );
}
```

- [ ] **Step 2: Wire into `AuditPage.tsx`.** Add `import { PromoDeadlinesTab } from "./PromoDeadlinesTab";` and replace the promo `TabsContent`:

```tsx
        <TabsContent value="promo" className="mt-0">
          <PromoDeadlinesTab access={access} globals={globals} />
        </TabsContent>
```

- [ ] **Step 3: Delete the timeline.** Confirm no other importers first:

Run: `grep -rn "ControlEventsTimeline" Promo/src`
Expected: only `AuditPage.tsx` (already swapped — remove any leftover import) — then delete the file:

```bash
git rm Promo/src/app/components/audit/ControlEventsTimeline.tsx
```

- [ ] **Step 4: Build + browser check.**

Run: `corepack pnpm --filter promo build`, then dev → `/audit` → «Сроки по промо и отчётам».
Expected: promo rows with № промо / период / контрольная точка / ответственный / дедлайн / факт / результат / просрочка / комментарий; **PR-2026-002 km-5** (auto-escalation seed) shows «Решение старшего КМ» = Просрочено + «Авто-передача КД (просрочка старшего КМ)» attributed to «Старший КМ»; approved campaigns (e.g. PR-2026-003) show «Отправка первичного отчёта»; switch to КМ role → only Каримов Шерзод's rows.

- [ ] **Step 5: Commit.**

```bash
git add Promo/src/app/components/audit/PromoDeadlinesTab.tsx Promo/src/app/components/audit/AuditPage.tsx
git commit -m "feat(promo): E-3 Tab 2 «Сроки по промо и отчётам»; remove control-events timeline"
```

---

## PHASE 4 — Tab 3 (Показатели участников)

## Task 9: `ParticipantMetricsTab.tsx` + `ParticipantTasksDrawer.tsx`

**Files:**
- Create: `Promo/src/app/components/audit/ParticipantMetricsTab.tsx`
- Create: `Promo/src/app/components/audit/ParticipantTasksDrawer.tsx`
- Modify: `Promo/src/app/components/audit/AuditPage.tsx` (swap the metrics placeholder)

**Interfaces:**
- Consumes: `buildParticipantMetrics`, `buildParticipantTasks`, `PARTICIPANT_ROLES`, `timelinessBand`, `ParticipantMetricRow`, `ParticipantTask` from `audit-control`; `AuditAccess`/`AuditGlobalFilters`.
- Produces: `<ParticipantMetricsTab access globals>`, `<ParticipantTasksDrawer name role open onOpenChange>`.

- [ ] **Step 1: Create `ParticipantTasksDrawer.tsx`.**

```tsx
"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@texnomart/ui/sheet";
import { RuDate } from "../../../components/RuDate";
import { buildParticipantTasks } from "../../../lib/audit-control";
import type { PromoRole } from "../../role-context";

export function ParticipantTasksDrawer({
  name, role, open, onOpenChange,
}: {
  name: string | null;
  role: PromoRole;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const tasks = React.useMemo(
    () => (name ? buildParticipantTasks(name, role) : []),
    [name, role]
  );
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader><SheetTitle>Задачи: {name}</SheetTitle></SheetHeader>
        <div className="flex flex-col gap-2.5 px-4 pb-6">
          {tasks.length === 0 && <p className="text-sm text-muted-foreground">Нет задач за период.</p>}
          {tasks.map((t, i) => (
            <div key={`${t.campaignId}-${t.checkpoint}-${i}`} className="rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.checkpoint}</span>
                {t.overdueDays > 0
                  ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">+{t.overdueDays} дн.</span>
                  : <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">В срок</span>}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400"><span className="font-mono">{t.promoNo}</span> · {t.promoName}</p>
              <div className="mt-1.5 grid grid-cols-2 gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                <span>Дедлайн: <RuDate value={t.deadline} /></span>
                <span>Факт: {t.actualAt ? <RuDate value={t.actualAt} /> : "—"}</span>
              </div>
              {t.comment && <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-300">{t.comment}</p>}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Create `ParticipantMetricsTab.tsx`.**

```tsx
"use client";

import * as React from "react";
import { cn } from "@texnomart/ui/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@texnomart/ui/select";
import {
  buildParticipantMetrics, PARTICIPANT_ROLES, type ParticipantMetricRow, type TimelinessBand,
} from "../../../lib/audit-control";
import type { PromoRole } from "../../role-context";
import type { AuditAccess } from "./AuditPage";
import { ParticipantTasksDrawer } from "./ParticipantTasksDrawer";

const BAND_TINT: Record<TimelinessBand, string> = {
  "Высокая": "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Средняя": "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Низкая": "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

export function ParticipantMetricsTab({ access }: { access: AuditAccess }) {
  const [role, setRole] = React.useState<PromoRole>("Категорийный менеджер (КМ)");
  const [drillName, setDrillName] = React.useState<string | null>(null);
  const rows = React.useMemo(() => buildParticipantMetrics(role), [role]);
  const dueLabel = role === "Категорийный менеджер (КМ)" ? "Промо с дедлайном" : "Задач с дедлайном";

  const th = "border-b border-r border-gray-200 dark:border-border bg-gray-50 dark:bg-muted/40 px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap";
  const td = "border-b border-r border-gray-100 dark:border-border px-3 py-2 text-sm";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Роль</span>
        <Select value={role} onValueChange={(v) => setRole(v as PromoRole)}>
          <SelectTrigger className="h-9 w-full max-w-xs bg-white dark:bg-card text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PARTICIPANT_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop rating table */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>№</th>
                <th className={th}>{role === "Категорийный менеджер (КМ)" ? "ФИО КМ" : "Участник"}</th>
                <th className={th}>{dueLabel}</th>
                <th className={th}>Вовремя</th>
                <th className={th}>С просрочкой</th>
                <th className={th}>Своевременность</th>
                <th className={th}>Ср. просрочка, дн.</th>
                <th className={th}>Возвраты</th>
                <th className={th}>Повторные отправки</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <MetricRow key={r.name} r={r} td={td} onDrill={() => setDrillName(r.name)} bandTint={BAND_TINT} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {rows.map((r) => (
          <button key={r.name} onClick={() => setDrillName(r.name)} className="rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card p-3 text-left shadow-[0px_2px_4px_rgba(204,204,204,0.25)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.rank}. {r.name}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", BAND_TINT[r.band])}>{r.timelinessPct}% · {r.band}</span>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1 text-[11px] text-gray-500 dark:text-gray-400">
              <span>{dueLabel}: {r.dueCount}</span>
              <span>Вовремя: {r.onTime}</span>
              <span>С просрочкой: {r.overdue}</span>
              <span>Ср. просрочка: {r.avgOverdueDays} дн.</span>
              <span>Возвраты: {r.returns}</span>
              <span>Повторные: {r.resends}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Справочно — post-approval changes, explicitly outside the rating (§ PDF). */}
      <div className="rounded-lg border border-gray-200 dark:border-border bg-gray-50/60 dark:bg-muted/20 p-3 text-xs text-gray-500 dark:text-gray-400">
        Справочно: добавленные, изменённые и исключённые позиции после согласования не входят в рейтинг своевременности и учитываются отдельно.
      </div>

      <ParticipantTasksDrawer
        name={drillName}
        role={role}
        open={drillName !== null}
        onOpenChange={(v) => { if (!v) setDrillName(null); }}
      />
    </div>
  );
}

function MetricRow({
  r, td, onDrill, bandTint,
}: {
  r: ParticipantMetricRow; td: string; onDrill: () => void; bandTint: Record<TimelinessBand, string>;
}) {
  return (
    <tr className="cursor-pointer hover:bg-gray-50/60 dark:hover:bg-muted/20" onClick={onDrill}>
      <td className={cn(td, "tabular-nums text-gray-500 dark:text-gray-400")}>{r.rank}</td>
      <td className={cn(td, "font-medium text-gray-900 dark:text-gray-100")}>{r.name}</td>
      <td className={cn(td, "tabular-nums")}>{r.dueCount}</td>
      <td className={cn(td, "tabular-nums text-emerald-700 dark:text-emerald-300")}>{r.onTime}</td>
      <td className={cn(td, "tabular-nums text-red-700 dark:text-red-300")}>{r.overdue}</td>
      <td className={td}>
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", bandTint[r.band])}>{r.timelinessPct}% · {r.band}</span>
      </td>
      <td className={cn(td, "tabular-nums")}>{r.avgOverdueDays}</td>
      <td className={cn(td, "tabular-nums")}>{r.returns}</td>
      <td className={cn(td, "tabular-nums")}>{r.resends}</td>
    </tr>
  );
}
```

- [ ] **Step 3: Wire into `AuditPage.tsx`.** Add `import { ParticipantMetricsTab } from "./ParticipantMetricsTab";` and replace the metrics `TabsContent`:

```tsx
        <TabsContent value="metrics" className="mt-0">
          <ParticipantMetricsTab access={access} />
        </TabsContent>
```

- [ ] **Step 4: Build + browser check.**

Run: `corepack pnpm --filter promo build`, then dev → `/audit` → «Показатели участников».
Expected: КМ rating table sorted by своевременность ↓ with место + band chips; switching the role selector to «Коммерческий директор» / «Директор маркетинга» / «Операционный директор» shows a single aggregate row and «Старший КМ» shows Исмаилов Жасур; clicking a row opens the drill-down Sheet with that person's tasks; the «Справочно» note is present.

- [ ] **Step 5: Commit.**

```bash
git add Promo/src/app/components/audit/ParticipantMetricsTab.tsx Promo/src/app/components/audit/ParticipantTasksDrawer.tsx Promo/src/app/components/audit/AuditPage.tsx
git commit -m "feat(promo): E-3 Tab 3 «Показатели участников» + drill-down"
```

---

## PHASE 5 — Tab 4 (Аудит-лог) + gating polish

## Task 10: `AuditLogTable.tsx` — «Ключевые / Все действия» + role scoping

**Files:**
- Modify: `Promo/src/app/components/audit/AuditLogTable.tsx`
- Modify: `Promo/src/app/components/audit/AuditPage.tsx` (pass `access`/`globals` to `<AuditLogTable>`)

**Interfaces:**
- Consumes: `AuditAccess`/`AuditGlobalFilters` from `AuditPage`; `AuditEvent`, `getCategoryManager`, `OWN_AUDIT_KM_ID` from mock data.
- Produces: `<AuditLogTable access globals>`.

- [ ] **Step 1: Add the key-action set + props.** At the top of `AuditLogTable.tsx`, after the imports, add:

```ts
import type { AuditAccess, AuditGlobalFilters } from "./AuditPage";
import { getCategoryManager } from "../../../lib/promo-mock-data";

/** The 10 key action types (spec §11.9 tab 4). «Все действия» adds создание/изменение (drafts/edits). */
const KEY_ACTIONS = new Set<AuditEvent["action"]>([
  "отправка на согласование", "согласование", "отклонение", "повторная отправка" as AuditEvent["action"],
  "Не участвует", "отправка отчёта", "отмена", "изменение дедлайна" as AuditEvent["action"],
]);
```

> The `AuditActionType` union currently lacks `"повторная отправка"` and `"изменение дедлайна"` string literals. Before implementing, grep the union (`grep -n "export type AuditActionType" Promo/src/lib/promo-mock-data.ts` and read the following lines). Use ONLY action strings that exist in the union; drop the `as` casts. The confirmed existing key-relevant actions are: `"отправка на согласование"`, `"согласование"`, `"отклонение"`, `"отмена"`, `"Не участвует"`, `"отправка отчёта"`. The non-key actions to hide by default are `"создание"` and `"изменение"` (+ the account-module actions `"смена пароля"`, `"изменение профиля"`, which are non-key too). Define `KEY_ACTIONS` as **all action types EXCEPT** `создание`/`изменение`/`смена пароля`/`изменение профиля` — this is robust to the exact union and matches "drafts/ordinary edits only under Все действия":

```ts
const NON_KEY_ACTIONS = new Set<AuditEvent["action"]>([
  "создание", "изменение", "смена пароля", "изменение профиля",
]);
```

- [ ] **Step 2: Change the component signature + add the mode toggle.** Replace `export function AuditLogTable() {` with:

```tsx
export function AuditLogTable({
  access, globals,
}: { access?: AuditAccess; globals?: AuditGlobalFilters } = {}) {
  const isAdmin = access?.isAdmin ?? false;
  const [showAll, setShowAll] = React.useState(false); // «Все действия» (Администратор only)
```

- [ ] **Step 3: Apply action-scope + role-scope + global date/role to the events memo.** Replace the `filtered` memo's return filter to also apply: (a) key-action default unless `isAdmin && showAll`; (b) КМ own-scope; (c) the page-level `globals` date-range/role. Add after the existing `events` memo:

```tsx
  const scopedEvents = React.useMemo(() => {
    const myName = getCategoryManager(access?.ownKmId ?? "")?.name;
    return events.filter((e) => {
      // action scope
      if (!(isAdmin && showAll) && NON_KEY_ACTIONS.has(e.action)) return false;
      // role-scoped rows: plain КМ sees only their own
      if (access && !access.canSeeAll) {
        if (e.role !== "Категорийный менеджер (КМ)") return false;
        if (myName && e.user !== myName) return false;
      }
      // page-level date-range + role
      if (globals) {
        if (globals.role !== "all" && e.role !== globals.role) return false;
        if (globals.from && e.at.getTime() < new Date(`${globals.from}T00:00:00`).getTime()) return false;
        if (globals.to && e.at.getTime() > new Date(`${globals.to}T23:59:59`).getTime()) return false;
      }
      return true;
    });
  }, [events, isAdmin, showAll, access, globals]);
```

Then change the local `filters` `filtered` memo to iterate `scopedEvents` instead of `events` (replace `return events.filter(` with `return scopedEvents.filter(` and update its dep array `[events, filters]` → `[scopedEvents, filters]`). Update the `users`/`roles` option memos to read from `scopedEvents`.

- [ ] **Step 4: Render the mode toggle** (Администратор only) above the desktop filters row. Inside the `return (…)`, right after the opening `<div className="flex flex-col gap-3">`, add:

```tsx
      {isAdmin && (
        <div className="flex items-center gap-2">
          <Button variant={showAll ? "default" : "outline"} size="sm" className="h-8" onClick={() => setShowAll(false)}>Ключевые действия</Button>
          <Button variant={showAll ? "outline" : "default"} size="sm" className="h-8" onClick={() => setShowAll(true)}>Все действия</Button>
          <span className="text-[11px] text-muted-foreground">черновики, редактирование и автосохранение — только в «Все действия»</span>
        </div>
      )}
```

(The `Button` import already exists in the file.)

- [ ] **Step 5: Pass props from `AuditPage.tsx`.** Replace `<AuditLogTable />` with:

```tsx
          <AuditLogTable access={access} globals={globals} />
```

- [ ] **Step 6: Build + browser check.**

Run: `corepack pnpm --filter promo build`, then dev → `/audit` → «Аудит-лог».
Expected: as Администратор — the «Ключевые действия»/«Все действия» toggle shows; default hides `создание`/`изменение` rows, «Все действия» reveals them; as «Категорийный менеджер (КМ)» — no toggle, rows limited to Каримов Шерзод; global date-range/role on the other tabs doesn't affect tab 4 (tab 4 keeps its own filters, but the passed `globals` still narrows it consistently — acceptable).

- [ ] **Step 7: Commit.**

```bash
git add Promo/src/app/components/audit/AuditLogTable.tsx Promo/src/app/components/audit/AuditPage.tsx
git commit -m "feat(promo): E-3 Tab 4 audit-log «Ключевые/Все действия» + role scoping"
```

---

## Task 11: Final pass — §3 styling audit, access notices, doc updates

**Files:**
- Modify (as needed): the four tab components + `ControlDeadlinesTable.tsx`
- Modify: `Promo/CLAUDE.md`, `docs/AI_CONTEXT.md`, `tasks/lessons.md` (+ append the mock-limits note)

**Interfaces:** none new.

- [ ] **Step 1: §3 consistency pass.** Open `/audit` at 1440px and 390px, all four tabs. Verify: sticky table headers stay on vertical scroll; horizontal scroll works; gridlines (`border-r`/`border-b`) are uniform; result/band chips are legible in dark mode (toggle theme). Fix any class drift inline (match `ControlDeadlinesTable`'s `th`/`td` classes).

- [ ] **Step 2: Verify access matrix end-to-end.** Cycle the role switcher: Администратор (all 4 tabs, «Все действия» available), Коммерческий директор (all tabs, no «Все действия»), Старший КМ (all tabs), Категорийный менеджер (КМ) (Tab 1 access notice, Tabs 2 & 4 own-rows only, Tab 3 rating visible), Сотрудник закупа/аналитики/маркетинга (deadline tabs show all rows read-only — they are `canSeeAll: false` but not КМ; **confirm the intended behavior**: for non-КМ non-privileged roles, show all rows read-only rather than empty). Adjust `PlanDeadlinesTab`/`PromoDeadlinesTab`/`AuditLogTable` scoping so ONLY the КМ role is own-scoped; every other role sees all (update the `canSeeAll` gate to `isKm ? own : all`). Implement by replacing the КМ-scope conditions with an explicit `const isKm = access.role === "Категорийный менеджер (КМ)";` check.

```tsx
// In PlanDeadlinesTab: plan has no КМ attribution → КМ sees none; everyone else sees all.
const isKm = access.role === "Категорийный менеджер (КМ)";
const scoped = React.useMemo(() => (isKm ? [] : all), [all, isKm]);
// gate notice on isKm instead of !canSeeAll
```

```tsx
// In PromoDeadlinesTab + AuditLogTable: own-scope ONLY for КМ.
const isKm = access?.role === "Категорийный менеджер (КМ)";
// use isKm (not !canSeeAll) for the own-name filter; all other roles see all rows.
```

- [ ] **Step 3: Build both apps.**

Run: `corepack pnpm --filter promo build` then `corepack pnpm --filter dashboard build`
Expected: both succeed (Dashboard proves no shared regression).

- [ ] **Step 4: Update docs.** Append an E-3 completion note to `Promo/CLAUDE.md` status line, add a dated entry to `docs/AI_CONTEXT.md` (front matter + Known Issues checkbox), and record the mock limits in `tasks/lessons.md`:
  - seed-stale (reconstructed from `PLAN_APPROVALS`/`buildReviewItems`/version chains/report helpers);
  - КМ scoping via representative `OWN_AUDIT_KM_ID` (`km-3`); Старший КМ "assigned КМs" = all; КД/дир.маркетинга/ОД rating = single-representative row;
  - returns/resends metrics are per-campaign approximations;
  - «Все действия» gated to the Администратор active role.

- [ ] **Step 5: Commit.**

```bash
git add Promo/src/app/components/audit Promo/CLAUDE.md docs/AI_CONTEXT.md tasks/lessons.md
git commit -m "feat(promo): E-3 access-matrix pass, §3 styling audit, docs"
```

---

## Self-Review

**Spec coverage**

| Spec requirement | Task |
|---|---|
| Rename → «Аудит-лог и контроль сроков»; don't duplicate short-calendar statuses | Task 5 (H1; no status column added) |
| Four tabs | Task 5 (shell) + 7/8/9/10 (bodies) |
| Tab 1 «Сроки по плану» — period/checkpoint/responsible+role/deadline/факт/result/overdue/comment | Task 2 (builder) + Task 7 (table) |
| Tab 2 «Сроки по промо и отчётам» — №+name/period + same columns; auto-forward attributes ст.КМ | Task 3 (builder) + Task 8 |
| Tab 3 «Показатели участников» — role filter, КМ ranking (место…повторные), bands, director metrics, drill-down, «Справочно» outside rating | Task 4 (metrics) + Task 9 |
| Tab 4 «Аудит-лог» — key actions default, «Все действия» Администратор-only, existing columns/filters | Task 10 |
| Deadline-tab filters (период/№/ответственный/роль/точка/результат incl. Только просроченные) | Task 6 |
| Header date-range + role + «Сбросить фильтры» | Task 5 |
| Access matrix (КМ own / others all) | Task 7/8/10 + Task 11 pass |
| §3 styling (sticky header, scroll, gridlines) + responsive Mode-B | Task 7 (table) + Task 11 |
| Remove old timeline | Task 8 |

**Placeholder scan:** No "TBD"/"handle edge cases". The two grep-guards (Task 3 `CAMPAIGNS`, Task 10 action-union) are explicit verification steps with a concrete fallback, not deferrals.

**Type consistency:** `ControlPoint`/`ControlResult`/`ParticipantMetricRow`/`ParticipantTask`/`AuditAccess`/`AuditGlobalFilters`/`ControlFilters` names match across producer and consumer tasks. КМ role string `"Категорийный менеджер (КМ)"` used identically everywhere. `buildControlPoints`/`buildPlanControlPoints`/`buildPromoControlPoints`/`buildParticipantMetrics`/`buildParticipantTasks` signatures are consistent between definition (Tasks 2–4) and use (Tasks 7–10).

**One known approximation** (documented, not a gap): Tab 3 `returns`/`resends` are per-campaign counts attributed to the participant (no per-decision return ledger in the mock) — recorded in Task 11 mock-limits.
