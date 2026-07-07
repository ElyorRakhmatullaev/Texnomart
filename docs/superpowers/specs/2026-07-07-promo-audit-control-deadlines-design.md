# Promo E-3 — «Аудит-лог и контроль сроков» (2→4 tabs) — Design

> **Date:** 2026-07-07
> **Sub-project:** 5th-part feedback, **E-3** (after E-1 Reports, E-2/E-2b Notifications; before E-4 Users + КД temp-substitution)
> **Source:** «5я часть — Комментарии по отчётам, уведомлениям, аудит-логу и управлению», section **«Аудит-лог»** (client PDF, pages 5–8)
> **Status:** approved design, ready for implementation plan
> **Scope:** Promo-local only (`Promo/`) — no `@texnomart/shared` / Dashboard change

---

## 1. Context

The Promo `/audit` screen (S8) today has **two tabs**:

- **«Аудит-лог»** (`AuditLogTable`) — a filterable action log (seed events merged with the accounts-module localStorage live events), columns: id · дата/время · пользователь+роль · действие · объект · статус до→после · комментарий; filters пользователь/роль/действие/объект/дата.
- **«Свод контрольных событий»** (`ControlEventsTimeline`) — a per-campaign horizontal (→ vertical on mobile) milestone timeline with red overdue nodes + a 3-card summary strip.

The client wants the section reworked into **«Аудит-лог и контроль сроков»** with **four tabs**, refocused on **deadlines, responsible people, and overdue reasons** — explicitly *not* re-displaying the campaign statuses already shown in the short calendar.

All Promo data is mock. Consistent with S8 and the E-series decision (**identity = deterministic seeds**), the four tabs are **reconstructed deterministically from existing seeds** and are **seed-stale** (in-session actions on other screens are not appended). The screen stays **read-only**.

## 2. Goals / non-goals

**Goals**

- Rework `/audit` into a 4-tab **«Аудит-лог и контроль сроков»** screen: `Сроки по плану` · `Сроки по промо и отчётам` · `Показатели участников` · `Аудит-лог`.
- Reconcile all deadline/overdue numbers across tabs via one canonical derivation layer.
- Apply meaningful role-scoped data access + the Администратор-only «Все действия» mode.
- Apply the client's §3 "единое оформление" table styling (sticky header, synced top/bottom horizontal scroll, unified grid lines) + mobile Mode-B cards.

**Non-goals**

- No per-person identity / live persistence beyond what the seeds + accounts-live store already provide (deferred; overlaps E-4).
- No `@texnomart/shared` change; the nav item + route (`/audit`) are unchanged (only the page H1 changes).
- КД temporary substitution, multi-role dedup, and the users-management screen are **E-4**, not E-3.
- The existing horizontal timeline component is **removed** (superseded by the Tab 2 table).

## 3. Approach (chosen: A — unified control-point derivation layer)

Tabs 1, 2, and 3 are three views of the same underlying data — **control-point records** (a checkpoint with deadline · факт · result · overdue days · responsible person+role). Tab 1 = plan checkpoints, Tab 2 = promo/report checkpoints, Tab 3 = those same records aggregated per participant. Only Tab 4 (the action log) is a separate data source.

A single new lib module derives a flat `ControlPoint[]` from the existing seeds; the deadline tabs render filtered slices through a shared table + filter shell, and the metrics tab aggregates the **same** records — so a participant's "2 overdue" in Tab 2 always matches the rating in Tab 3.

Rejected: **B** (per-tab independent builders — metrics drift from the deadline tables, duplicated overdue logic) and **C** (static hand-seeded metrics — disconnected from the real records, won't reconcile).

## 4. Data layer — `Promo/src/lib/audit-control.ts` (new)

```ts
type ControlScope = "plan" | "promo";
type ControlResult = "В срок" | "Просрочено" | "Ожидается";

interface ControlPoint {
  id: string;                 // stable, e.g. "cp-plan-PR-2026-001-kd"
  scope: ControlScope;
  campaignId: string;
  promoNo: string;            // PR-/UN- form (full calendar convention)
  promoName: string;
  planPeriod?: string;        // "Июль 2026" — plan rows
  promoPeriod?: { start: Date; end: Date }; // promo rows
  checkpoint: string;         // «Отправка данных КМ», «Согласование КД», …
  responsibleName: string;    // ФИО or role label when no person is attributed
  responsibleRole: PromoRole;
  deadline: Date;
  actualAt?: Date;            // факт — undefined when not yet done
  result: ControlResult;
  overdueDays: number;        // 0 when on time / pending
  comment?: string;
}
```

**Builders** (all deterministic, `ref: Date = new Date()`):

- `buildPlanControlPoints()` — from `PLAN_APPROVALS` + `PLAN_MARKETING_REVIEW_LEAD_DAYS` (63 cal.), `PLAN_MARKETING_SUBMIT_LEAD_DAYS` (60 cal.), `PLAN_DIRECTOR_SLA_WORKING_DAYS` (3 раб.) + `campaign.startDate`. Checkpoints per campaign: **Ознакомление дир. маркетинга** (`marketing.reviewedAt`, deadline `start − 63`) → **Отправка плана на согласование** (`marketing.sentAt`, deadline `start − 60`) → **Согласование КД** (`kd.decidedAt` / waiting, deadline = +3 раб. дн. from send) → **Согласование ОД** (`od.decidedAt` / waiting, deadline = +3 раб. дн. from KD). `result`/`overdueDays` taken from the seeded `status`/`overdueDays`; `Ожидается` for `waiting` stages (`decidedAt` undefined). Responsible = дир. маркетинга / КД / ОД role labels. «Возврат на корректировку / повторная отправка / доведение до КМ» are emitted only where seeded (add one such chain to a demo campaign so the states are visible).
- `buildPromoControlPoints()` — from `buildControlTimeline` + `CAMPAIGN_VERSIONS` + report helpers (`getReportDeadline`, `getReportSentAt`) + `REVIEW_SLA_WORKING_DAYS` (2 раб.) + the review-item seeds (`submittedAt`, `autoForwardedAt`, `kdStageStartedAt`). Checkpoints per campaign: **Отправка данных КМ** (deadline `start − 21` cal.; responsible = first participating КМ) → **Решение старшего КМ** (deadline `submitted + 2` раб.) → **Авто-передача КД** (only when senior overdue; responsible attributed to **старший КМ**, per the PDF) → **Решение КД** (deadline `kdStageStart + 2` раб.) → **Повторная отправка после корректировки** (from the version chain «Переотправлено») → **Отправка отчёта смежным отделам** + **Новая версия отчёта** (deadline `start − 17` cal.). Reached checkpoints get `actualAt` + `result`; the next un-reached one renders `Ожидается`.
- `buildParticipantMetrics(role, range)` — aggregates the промо/план control points attributed to each person in `role`:
  - **КМ** (over `CATEGORY_MANAGERS`, non-senior): rows sorted by timeliness ↓ — `место`, `ФИО`, `промо с наступившим дедлайном` (data-send checkpoints whose `deadline ≤ ref`), `вовремя`, `с просрочкой`, `своевременность %` (= вовремя / наступивших), `средняя просрочка, дн.` (avg `overdueDays` over overdue), `возвраты на корректировку`, `повторные отправки`.
  - **старший КМ** (senior in `CATEGORY_MANAGERS`) / **КД** / **директор маркетинга** / **операционный директор**: analogous per-stage metrics (`задач`, `вовремя`, `с просрочкой`, `средняя просрочка`, `возвраты`, `повторные отправки`) over the checkpoints they own. Director roles have one representative each (no roster) → single-row aggregate.
  - `timelinessBand(pct)` → `Высокая` (≥90) / `Средняя` (70–89) / `Низкая` (<70).
  - Separate `referenceCounts` (Добавлено/Изменено/Исключено after approval) — computed but **excluded** from the timeliness figures (shown in a «Справочно» block).
  - `buildParticipantTasks(personId, range)` — the drill-down: that person's control points with контрольная точка · дедлайн · факт · просрочка · причина возврата.

## 5. Screen shell — `AuditPage.tsx` (rework)

- Page **H1 → «Аудит-лог и контроль сроков»**; subtitle ~ «Контроль сроков выполнения этапов, согласований и отправок отчётов; кто ответственный и из-за кого возникла просрочка.» (Nav label + `/audit` route unchanged.)
- **Four** underline tabs (Pattern J, existing `TAB_TRIGGER` style): `Сроки по плану · Сроки по промо и отчётам · Показатели участников · Аудит-лог`.
- Page-level header controls (per the screenshot): a **date-range**, a **роль** `Select`, and **«Сбросить фильтры»**. These drive the deadline tabs (1–2) + the metrics tab (3). Tab 4 keeps its own filter row.
- Access gate resolved once from `useRole()` (+ representative `ownKmId`) and passed to the tabs.

## 6. Tabs

### Tab 1 — «Сроки по плану»
Table over `scope === "plan"` control points. Columns: **период плана · контрольная точка · ответственный + роль · дедлайн · факт (дата+время) · результат** (В срок / Просрочено / Ожидается — tinted) **· дней просрочки · комментарий**. Shared deadline filter set (§8). Band-layout table (§7) → Mode-B cards below md.

### Tab 2 — «Сроки по промо и отчётам»
Table over `scope === "promo"` control points. Columns: **№ + название промо · период акции · контрольная точка · ответственный + роль · дедлайн · факт · результат · дней просрочки · комментарий**. The auto-forward row attributes overdue to **старший КМ**. Same shared filter set + styling.

### Tab 3 — «Показатели участников»
A **role selector** (КМ / старший КМ / КД / директор маркетинга / операционный директор). Renders `buildParticipantMetrics(role)`:
- **КМ:** rating table sorted by `своевременность %` ↓ — место · ФИО · промо с наступившим дедлайном · вовремя · с просрочкой · своевременность % **+ band chip** · средняя просрочка, дн. · возвраты · повторные отправки.
- **director roles:** the analogous per-stage metric row(s).
- Clicking a person opens a **drill-down drawer** (`buildParticipantTasks`): контрольная точка · дедлайн · факт · просрочка · причина возврата.
- A **«Справочно»** block: post-approval Добавлено/Изменено/Исключено counts, explicitly outside the rating.

### Tab 4 — «Аудит-лог»
Rework of `AuditLogTable`: add an **action-scope toggle** — **«Ключевые действия»** (default) shows only the 10 key action types (отправка на согласование · согласование · возврат на корректировку · авто-передача по SLA · повторная отправка · установка/согласование/отклонение «Не участвует» · отправка первичного отчёта · отправка новой версии отчёта · отмена промо/номенклатуры · изменение дедлайна); **«Все действия»** additionally surfaces черновики / обычное редактирование / автосохранение (maps to hiding `создание` + `изменение` by default) and is **Администратор-only**. Existing пользователь/роль/действие/объект/дата filters + статус до→после are kept. No duplicate "current campaign status" column.

## 7. Cross-cutting

- **Access gating (meaningful subset):** plain **КМ** → only the representative-`ownKmId`'s rows across tabs 1–3; **старший КМ / КД / Администратор** → all; **«Все действия»** → Администратор only. Where a role's data isn't person-resolvable (старший КМ "assigned КМs", director rosters), fall back to the full set — noted as a mock limit.
- **§3 table styling:** sticky header + synced **top + bottom** horizontal scroll + unified horizontal/vertical grid lines — reuse the established short-calendar / reports band-layout (`ShortCalendarTable` / `DepartmentReportView` pattern). Correct fit on monitors & laptops.
- **Responsive (Pattern K):** deadline/metrics tables → Mode-B cards below md; the shared deadline filter set collapses into a «Фильтры» Sheet on mobile (mirrors the existing `AuditLogFilters` Sheet).
- **Read-only, seed-stale, Promo-local.** Reuse `PromoStatusBadge` / `OverdueTag` / `RuDate` / `Money` and existing filter/table primitives.

## 8. Shared deadline filter set (tabs 1–2)

`период · № промо · ответственный · роль · контрольная точка · результат` (Все / В срок / Просрочено / **Только просроченные**) + **«Сбросить фильтры»**. Filter options derive from the visible control points. The page-level date-range + role select feed in as the outer bounds.

## 9. Files

**Create**
- `Promo/src/lib/audit-control.ts` — `ControlPoint` model + `buildPlanControlPoints` / `buildPromoControlPoints` / `buildParticipantMetrics` / `buildParticipantTasks` + `timelinessBand`.
- `Promo/src/app/components/audit/PlanDeadlinesTab.tsx` — Tab 1.
- `Promo/src/app/components/audit/PromoDeadlinesTab.tsx` — Tab 2.
- `Promo/src/app/components/audit/ControlDeadlinesTable.tsx` — shared band-layout table for tabs 1–2.
- `Promo/src/app/components/audit/ControlDeadlinesFilters.tsx` — shared deadline filter set (+ mobile Sheet).
- `Promo/src/app/components/audit/ParticipantMetricsTab.tsx` — Tab 3 (role selector + rating table + «Справочно»).
- `Promo/src/app/components/audit/ParticipantTasksDrawer.tsx` — Tab 3 drill-down.

**Modify**
- `Promo/src/app/components/audit/AuditPage.tsx` — H1 rename, 4 tabs, page-level date-range/role/reset.
- `Promo/src/app/components/audit/AuditLogTable.tsx` — «Ключевые действия» / «Все действия» toggle + Администратор gate.
- (possibly) `Promo/src/app/components/audit/AuditLogFilters.tsx` — action-scope wiring.
- `Promo/src/lib/promo-mock-data.ts` — small seed additions (one plan return/resend chain; ensure promo control points spread across `CATEGORY_MANAGERS` for a meaningful rating). May re-export helpers used by `audit-control.ts`.

**Remove**
- `Promo/src/app/components/audit/ControlEventsTimeline.tsx` — superseded by Tab 2 (delete after Tab 2 lands).

## 10. Phasing

1. **Data layer + shell** — `audit-control.ts` (`ControlPoint` + builders) + `AuditPage` rework (H1, 4 tab scaffolds, page-level date-range/role/reset).
2. **Tab 1** «Сроки по плану» + `ControlDeadlinesTable` + `ControlDeadlinesFilters`.
3. **Tab 2** «Сроки по промо и отчётам» (reuse the shared table/filters); delete `ControlEventsTimeline`.
4. **Tab 3** «Показатели участников» + `ParticipantTasksDrawer` + «Справочно».
5. **Tab 4** key/all-actions toggle + access gating across tabs 1–3 + §3 styling / responsive polish.

Each phase ends green on `build:promo` (+ `build:dashboard` as the no-regression check).

## 11. Mock limitations (to record in docs on completion)

- Seed-stale: reconstructed from `PLAN_APPROVALS` / `CAMPAIGN_VERSIONS` / control-timeline / report seeds; in-session actions elsewhere aren't appended (same as S8).
- No per-person identity beyond `CATEGORY_MANAGERS`: КМ scoping uses the representative `ownKmId`; старший КМ "assigned КМs" = all КМ; КД/директор-маркетинга/ОД rating rows are single-representative aggregates.
- Timeliness ratings are as dense as the seed allows — some participants have few due-deadline promos.
- Deadlines use the existing mock SLAs (КМ-fill 21 кал., review 2 раб., report 17 кал., plan 63/60 кал. + 3 раб.).
- Access gating is enforced on the god-mode active role (no auth-backed identity); «Все действия» is gated to the Администратор role.
