# E-2 — «Уведомления»: live + persistent notifications (design)

> Date: 2026-07-06
> Module: Texnomart **Promo**, S6 `/notifications` (`Promo/src/app/components/notifications/`)
> Source: 5th-part client feedback, section «Уведомления». No discrete client items were
> supplied for this section, so the scope was **proposed and approved in brainstorming**
> (direction: make the mock screen behave "real", consistent with the E-series theme set by E-1).
> Scope: **Promo-local only** — no changes to `@texnomart/shared` or Dashboard.
> Part of the E-series (5th-part feedback). Build order: E-1 Reports (done) → **E-2 Notifications** → E-3 Audit → E-4 Users.

## Goal

The S6 «Центр уведомлений» is functionally complete but **seed-stale and in-memory**: notifications
are ~8 fixed seeds, read-state resets on reload, and actions on other screens (КД cancels a campaign,
КМ line is excluded, a report is sent) do **not** actually produce a notification. Rework S6 so that:

1. **Live** — the existing S4/S5 action handlers that model "something changed for other departments"
   emit a real notification into the shared store the moment the action runs, and a toast surfaces it.
2. **Persistent** — live-emitted notifications and per-user read-state survive a page reload
   (localStorage), the same way E-1's `report-ack-store` persists acknowledgements.

Everything else about the screen (grouping, «Непрочитанные»/«Прочитано» sections, type filter,
role-scoped visibility §11.3.1, mobile cards, empty state) already works and stays as-is.

## Decisions locked in brainstorming

1. **Thrust** — **Live + persistent** (not merely UX polish).
2. **Emission breadth** — the existing **S4/S5** action handlers only (best coverage-to-effort). Covers
   5 of the 6 notification types. `km-assignment` stays **seed-only** (no assignment UI exists).
3. **UX additions** — **live toast + live bell count only.** Explicitly **out of scope**: specific
   per-row deep-links, richer filters (campaign/role/date-range), per-user mute preferences.
4. **Mechanism (Approach A)** — extend `NotificationsProvider` into a persistent store exposing an
   imperative `notify(input)`; screen handlers call it. (Rejected: B — diffing domain state, which
   isn't centralized; C — a module-level event-bus singleton, more moving parts for no benefit.)
5. **Identity** — deterministic seeds + the god-mode role switcher (E-series convention). Read-state is
   keyed to the logged-in `currentUser`, with an **anon fallback** when none (auth-bypass sessions).
6. **Bell** — the shared AppShell bell already reads Promo's live count, so it updates for free with
   **no shared change**. A bell *animation* would require editing shared code and is therefore **not**
   done; the **toast** is the attention cue.

## Feature design

### A. Data model — `promo-mock-data.ts` (additive only)

The existing `PromoNotification` interface, the 6 `NotificationType`s, `NOTIFICATION_TYPE_META`, the two
audience arrays (`MARKETING_AUDIENCE` / `ADJ_DEPARTMENTS_AUDIENCE`), `buildNotifications`,
`notificationsForRole`, and `groupNotificationsByDate` are unchanged. **No new notification type.** Add:

- **`NotificationInput`** — what a caller passes:
  `{ type: NotificationType; campaignId?: string; campaignName?: string; reportVersion?: number; description: string; href?: string; visibleTo?: PromoRole[] }`.
- **`notificationAudienceFor(type): PromoRole[] | undefined`** — default audience per type so callers
  rarely pass `visibleTo`:
  - `campaign-cancelled`, `line-removed`, `data-changed` → `ADJ_DEPARTMENTS_AUDIENCE`
  - `marketing-reapproval`, `ad-approval` → `MARKETING_AUDIENCE`
  - `km-assignment` → `undefined` (all roles) — not emitted live, listed for completeness.
  (Both audiences include `Коммерческий директор`; `MARKETING_AUDIENCE` includes `Сотрудник маркетинга`.
  So the actor of every wired emission is in the resulting audience and sees their own notification.)
- **`createLiveNotification(input, actor, seq, at): PromoNotification`** — a **pure** factory:
  `id = "live-" + at.getTime() + "-" + seq`, `sentAt = at`, `read = false`, `actor`,
  `visibleTo = input.visibleTo ?? notificationAudienceFor(input.type)`, `href = input.href ?? "/notifications"`.
  Pure (takes `at`/`seq` as args) so it stays unit-testable and free of `Date.now()` at the data layer.

### B. Persistence — new `Promo/src/lib/notifications-store.ts`

Mirrors E-1's `report-ack-store.ts` (localStorage, defensive JSON, SSR-safe `typeof window` guards):

- **`promo:notifications-live`** — array of live-emitted notifications. `sentAt` serialized as ISO
  string; rehydrated to `Date` on read. **Capped to the most recent 50** on append (drop oldest) to
  keep localStorage bounded — the cap is logged as a mock limitation.
- **`promo:notifications-read:<userId>`** — array of read notification ids for that user;
  key falls back to **`promo:notifications-read:anon`** when `currentUser` is null.
- Helpers:
  - `getLiveNotifications(): PromoNotification[]`
  - `appendLiveNotification(n: PromoNotification): void` (prepend + cap 50 + persist)
  - `getReadIds(userId: string | null): Set<string>`
  - `addReadIds(userId: string | null, ids: string[]): void`

### C. Store — `NotificationsProvider.tsx` rework

Keep the mount point (above the AppShell, in `ProtectedLayout`) and the public shape
(`notifications`, `acknowledge`, `acknowledgeMany`) **plus** one new method `notify`.

- **Load (state initializer):** `notifications = [...getLiveNotifications(), ...buildNotifications()]`
  sorted by `sentAt` **descending**; then the persisted per-user read-set is applied (`read: true`
  for any id in `getReadIds(userId)`) to seeds **and** live. Seeds are still built here — **never via
  `notify`** — so **no toast fires on initial load**.
- **`notify(input: NotificationInput): PromoNotification`:**
  1. build via `createLiveNotification(input, { name: currentUser?.fullName ?? currentRole, role: currentRole }, seq, new Date())`
     (a `React.useRef` counter provides `seq`, keeping ids unique within a session);
  2. `setNotifications(prev => [n, ...prev])`;
  3. `appendLiveNotification(n)`;
  4. fire the toast (see D);
  5. return `n`.
- **`acknowledge(id)` / `acknowledgeMany(ids)`:** update state to `read: true` **and**
  `addReadIds(userId, ids)` so the read survives reload.
- The provider reads `useCurrentUser()` for the read-key and `useRole()` for the actor role.
  **Confirmed** available: `App.tsx` nests `RoleProvider → CurrentUserProvider → RouterProvider`, and
  `NotificationsProvider` sits below the router in `ProtectedLayout`, so both hooks resolve inside it.

### D. Toast — fired centrally in `notify()`

- `sonner`'s `toast(...)` — the themed `<Toaster>` is already mounted Promo-local in `App.tsx`.
- Content: the type label (`NOTIFICATION_TYPE_META[type].label`) as the title, the campaign name +
  short description as the body, and an «Открыть» action navigating to `/notifications`.
- Firing it inside `notify()` guarantees **every** live emission toasts consistently, and only live
  emissions do (seeds bypass `notify`).

### E. Emission points (the "live" wiring) — call `notify()` in existing handlers

All handlers already exist; each gets one `notify(...)` call inside it. **Decision (exactly one toast
per action):** if the handler currently shows its own `toast.success(...)`, **remove it** and pass its
message text into `notify()` as the notification `description` — so `notify`'s single toast carries the
same wording. If the handler has no success toast today, `notify`'s toast is simply the only one. Either
way there is exactly one toast per wired action, and every wired action routes through one code path.
(Non-wired `toast.success` calls elsewhere in these files — e.g. add-nomenclature, 1С re-check — are
untouched.)

| # | Existing handler | File | Type | Notes |
|---|---|---|---|---|
| 1 | `onCancelConfirm` (~816) | `full-calendar/FullCalendarPage.tsx` | `campaign-cancelled` | КД-only; `href: "/full-calendar"`, campaign ctx from `cancelCampaignId` |
| 2 | КД line-removal confirm → dispatch `approveRemoval` (~204/handler) | `full-calendar/FullCalendarPage.tsx` | `line-removed` | line → campaign ctx; describe excluded nomenclature |
| 3 | `onPeriodApply` (~739) | `full-calendar/FullCalendarPage.tsx` | `marketing-reapproval` | period change of an approved campaign requires marketing re-approval (§11.5/§11.8). Value-change re-approval is a *derived* state with no discrete handler, so it is **not** a separate emit point — documented. |
| 4 | `onSendToDepartments` (~764) | `full-calendar/FullCalendarPage.tsx` | `data-changed` | `reportVersion: nextNo`, `href: "/reports"` |
| 5 | `marketingApprove` (211) | `reports/DepartmentReportView.tsx` | `ad-approval` | S5 §7.2; `href: "/reports"`, department/campaign ctx from props |

### F. UI — page + item essentially unchanged

`NotificationsPage.tsx` and `NotificationItem.tsx` read from the store and already render grouping,
sections, the type filter, mobile cards, and the empty state — they update live for free. **No layout
rework.** At most, verify the «Непрочитанные» section and bell reflect a freshly emitted item without a
reload (they will, since both derive from the same live `notifications` array).

## Files

```
[M] Promo/src/lib/promo-mock-data.ts               — NotificationInput, notificationAudienceFor, createLiveNotification (additive)
[C] Promo/src/lib/notifications-store.ts            — localStorage: live list (cap 50) + per-user read-set (anon fallback)
[M] Promo/src/app/components/notifications/NotificationsProvider.tsx
                                                    — persistent store: merge seeds+live, apply read-set, notify()+toast, per-user keying
[M] Promo/src/app/components/full-calendar/FullCalendarPage.tsx
                                                    — notify() in onCancelConfirm / approveRemoval confirm / onPeriodApply / onSendToDepartments
[M] Promo/src/app/components/reports/DepartmentReportView.tsx
                                                    — notify() in marketingApprove
```

No `@texnomart/shared` or Dashboard changes. `NotificationsPage.tsx` / `NotificationItem.tsx` unchanged
unless verification turns up a gap.

## Out of scope (YAGNI)

- New notification types; `km-assignment` live emission (no assignment UI).
- Specific per-row deep-links (notifications keep the current module-level `href`).
- Richer filters (campaign / actor-role / date-range) and per-user mute preferences.
- Any bell **animation** (would need a shared-package change).
- Emission from S3 approval flow, or any screen outside the 5 wired handlers.
- Wiring notifications into the S8 audit log or the sidebar badge beyond the existing live count.

## Mock limitations (to carry into CLAUDE.md / AI_CONTEXT)

- Persistence is **per-browser localStorage**, not a backend.
- Read-state is keyed to the logged-in user; in an auth-bypass session it falls back to an **anon** key.
- Seeds are rebuilt each load (so seed edits reflect), while **live** notifications accumulate in
  localStorage until they age past the **50-item cap** (oldest dropped).
- Live emission fires **only** from the 5 wired S4/S5 handlers; every other screen still doesn't emit.
- `km-assignment` remains seed-only.
- No bell animation (shared constraint) — the **toast** is the live cue; the bell count still updates.
- An emitted notification is only visible to the actor if their active role is in the type's audience
  (true for the wired КД/marketing actors); switching god-mode roles may hide/show items by §11.3.1.

## Verification

- `corepack pnpm --filter promo build` **and** `corepack pnpm --filter dashboard build` both green
  (additive shared-untouched change must not regress Dashboard).
- In-browser (`pnpm dev:promo`): as КД, cancel a campaign on `/full-calendar` → a toast appears, the
  bell count increments, and the item shows under «Непрочитанные» on `/notifications`; **reload** →
  the emitted item and its read-state persist. Repeat for line-exclusion, period change (marketing
  re-approval), send-to-departments (data-changed), and marketing «Согласовать выбор» on `/reports`.
- Acknowledge an item → it moves to «Прочитано», bell count drops, and the read survives a reload.
