# E-2 «Уведомления» — live + persistent notifications — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Texnomart Promo notifications module (`/notifications`, S6) so notifications are **live** (emitted from existing S4/S5 action handlers) and **persistent** (localStorage: live list + per-user read-state), with a toast on each live emit.

**Architecture:** Promo-local React (Vite + TS, Tailwind v4, shadcn via `@texnomart/ui`, patterns via `@texnomart/shared`). The existing in-memory `NotificationsProvider` (mounted above the AppShell) becomes a persistent store exposing an imperative `notify(input)`. Seeds are rebuilt each load and merged with live notifications read from localStorage; per-user read-state is persisted. Five existing action handlers (4 in `FullCalendarPage`, 1 in `DepartmentReportView`) call `notify(...)`. The bell count already updates live via the shared shell — no shared change.

**Tech Stack:** React 18 + TypeScript, Vite 6, Tailwind v4, shadcn/ui, lucide-react, sonner (toasts), react-router.

## Global Constraints

- **Promo-local only.** No edits to `@texnomart/shared`, `@texnomart/ui`, or `Dashboard/`. Verify `build:dashboard` stays green at the end.
- **Verification model:** this project has **no unit-test harness** (`vite build` does not typecheck app logic but catches import/syntax/type-import errors). Each task ends with a green build via `corepack pnpm --filter promo build` **plus** the task's explicit in-browser checks where stated. Do **not** add a test framework.
- **pnpm via corepack:** `pnpm` is not on PATH — always `corepack pnpm …`. Build Promo with `corepack pnpm --filter promo build`; dev server `corepack pnpm --filter promo dev`; Dashboard `corepack pnpm --filter dashboard build`.
- **RU only.** All UI copy (incl. toast + notification `description`) in Russian.
- **No shared-package change → no bell animation.** The bell count updates for free via the existing `bellItems`/`unreadCount` path in `AppShell.tsx`. The toast (Promo-local `sonner`) is the live cue.
- **Radix defer rule / ref-under-`asChild` rule** — not exercised by this plan (no new dialogs/popovers), listed for awareness.
- **SPA navigation:** the app runs under a Router `basename` (GitHub Pages subpath). In-app navigation MUST use react-router (`useNavigate`), never `window.location`, or deep links break under the subpath.
- **Spec:** `docs/superpowers/specs/2026-07-06-promo-notifications-live-persistent-design.md` is the source of truth.

---

## File Structure

| File | Responsibility |
|---|---|
| `Promo/src/lib/promo-mock-data.ts` | **Modify (additive)** — add `NotificationInput`, `notificationAudienceFor(type)`, and the pure `createLiveNotification(input, actor, seq, at)` factory near the existing notification block. Nothing existing changes. |
| `Promo/src/lib/notifications-store.ts` | **New** — localStorage persistence: live list (`promo:notifications-live`, capped 50, newest-first) + per-user read-set (`promo:notifications-read:<userId>`, anon fallback). Mirrors `report-ack-store.ts`. |
| `Promo/src/app/components/notifications/NotificationsProvider.tsx` | **Modify (rework)** — persistent store: merge seeds + live at load, apply the per-user read-set, add `notify(input)` (build via factory, persist, toast), persist reads in `acknowledge`/`acknowledgeMany`. Keep the mount point + existing public methods. |
| `Promo/src/app/components/full-calendar/FullCalendarPage.tsx` | **Modify** — `const { notify } = useNotifications()`; call `notify(...)` in `onCancelConfirm`, `onApproveRemoval`, `onPeriodApply`, `onSendToDepartments` (replacing each handler's own `toast.success`). |
| `Promo/src/app/components/reports/DepartmentReportView.tsx` | **Modify** — `const { notify } = useNotifications()`; call `notify(...)` in `marketingApprove` (replacing its `toast.success`). |

`NotificationsPage.tsx` and `NotificationItem.tsx` are **not modified** — they read from the store and update live for free.

---

## Task 1: Notification factory + input type in the data layer

**Files:**
- Modify: `Promo/src/lib/promo-mock-data.ts` (insert immediately after the `ADJ_DEPARTMENTS_AUDIENCE` const, ~line 3025, before `buildNotifications`)

**Interfaces:**
- Consumes (all already defined above the insertion point): `NotificationType`, `PromoNotification`, `PromoRole`, `MARKETING_AUDIENCE`, `ADJ_DEPARTMENTS_AUDIENCE`.
- Produces:
  - `export interface NotificationInput { type: NotificationType; campaignId?: string; campaignName?: string; reportVersion?: number; description: string; href?: string; visibleTo?: PromoRole[]; }`
  - `export function notificationAudienceFor(type: NotificationType): PromoRole[] | undefined;`
  - `export function createLiveNotification(input: NotificationInput, actor: { name: string; role: PromoRole }, seq: number, at: Date): PromoNotification;`

- [ ] **Step 1: Insert the input type + audience map + factory.**

Insert this block right after the `ADJ_DEPARTMENTS_AUDIENCE` array declaration (the two audience consts must be in scope above):

```ts
/**
 * E-2 — what an action handler passes to `notify()`. The store fills in
 * id / sentAt / actor / read; audience defaults from `notificationAudienceFor`.
 */
export interface NotificationInput {
  type: NotificationType;
  campaignId?: string;
  campaignName?: string;
  reportVersion?: number;
  description: string;
  /** In-app quick link; defaults to "/notifications". */
  href?: string;
  /** Override the type's default audience (§11.3.1). */
  visibleTo?: PromoRole[];
}

/**
 * Default audience per notification type (§11.3.1) so callers rarely pass
 * `visibleTo`. Both audiences include Коммерческий директор; MARKETING_AUDIENCE
 * includes Сотрудник маркетинга — so the actor of every wired emission is inside
 * the resulting audience and sees their own item. `km-assignment` → undefined
 * (visible to all); it is not emitted live.
 */
export function notificationAudienceFor(
  type: NotificationType
): PromoRole[] | undefined {
  switch (type) {
    case "campaign-cancelled":
    case "line-removed":
    case "data-changed":
      return ADJ_DEPARTMENTS_AUDIENCE;
    case "marketing-reapproval":
    case "ad-approval":
      return MARKETING_AUDIENCE;
    case "km-assignment":
      return undefined;
  }
}

/**
 * Pure factory for a live-emitted notification. `at` / `seq` are passed in (no
 * `Date.now()` at the data layer) so ids are unique within a session:
 * `live-<epoch>-<seq>`.
 */
export function createLiveNotification(
  input: NotificationInput,
  actor: { name: string; role: PromoRole },
  seq: number,
  at: Date
): PromoNotification {
  return {
    id: `live-${at.getTime()}-${seq}`,
    type: input.type,
    campaignId: input.campaignId,
    campaignName: input.campaignName,
    reportVersion: input.reportVersion,
    actor,
    description: input.description,
    sentAt: at,
    read: false,
    href: input.href ?? "/notifications",
    visibleTo: input.visibleTo ?? notificationAudienceFor(input.type),
  };
}
```

- [ ] **Step 2: Build.**

Run: `corepack pnpm --filter promo build`
Expected: build succeeds (no import/type errors). The new exports are unused so far — that's fine.

- [ ] **Step 3: Commit.**

```bash
git add Promo/src/lib/promo-mock-data.ts
git commit -m "feat(promo): notification input type + live-notification factory (E-2)"
```

---

## Task 2: localStorage persistence store

**Files:**
- Create: `Promo/src/lib/notifications-store.ts`

**Interfaces:**
- Consumes: `PromoNotification` (type-only) from `./promo-mock-data`.
- Produces:
  - `export function getLiveNotifications(): PromoNotification[];`
  - `export function appendLiveNotification(n: PromoNotification): void;`
  - `export function getReadIds(userId: string | null): Set<string>;`
  - `export function addReadIds(userId: string | null, ids: string[]): void;`

- [ ] **Step 1: Create `notifications-store.ts`.**

```ts
// E-2 — persistence for the live notifications store (localStorage, per-browser).
// Two keys:
//   promo:notifications-live          — live-emitted notifications (capped 50, newest first)
//   promo:notifications-read:<userId> — read notification ids for that user (anon fallback)
// Mirrors report-ack-store.ts: defensive JSON, SSR-safe `typeof window` guard.

import type { PromoNotification } from "./promo-mock-data";

const LIVE_KEY = "promo:notifications-live";
const READ_KEY_PREFIX = "promo:notifications-read:";
const LIVE_CAP = 50;

function readKey(userId: string | null): string {
  return `${READ_KEY_PREFIX}${userId ?? "anon"}`;
}

/** A live notification serialized for storage (sentAt as ISO string). */
type StoredNotification = Omit<PromoNotification, "sentAt"> & { sentAt: string };

/** Live notifications, newest-first, with `sentAt` rehydrated to a Date. */
export function getLiveNotifications(): PromoNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(LIVE_KEY) ?? "[]"
    ) as StoredNotification[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((n) => ({ ...n, sentAt: new Date(n.sentAt) }));
  } catch {
    return [];
  }
}

/** Prepend a live notification, cap to the most recent 50, persist. */
export function appendLiveNotification(n: PromoNotification): void {
  if (typeof window === "undefined") return;
  try {
    const next = [n, ...getLiveNotifications()].slice(0, LIVE_CAP);
    const serialized: StoredNotification[] = next.map((x) => ({
      ...x,
      sentAt: x.sentAt.toISOString(),
    }));
    window.localStorage.setItem(LIVE_KEY, JSON.stringify(serialized));
  } catch {
    /* ignore quota / serialization errors (mock) */
  }
}

/** Read notification ids for a user (anon fallback when signed-out). */
export function getReadIds(userId: string | null): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(readKey(userId)) ?? "[]"
    ) as string[];
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

/** Add read ids for a user (deduped), persist. */
export function addReadIds(userId: string | null, ids: string[]): void {
  if (typeof window === "undefined" || ids.length === 0) return;
  try {
    const set = getReadIds(userId);
    for (const id of ids) set.add(id);
    window.localStorage.setItem(readKey(userId), JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}
```

- [ ] **Step 2: Build.**

Run: `corepack pnpm --filter promo build`
Expected: build succeeds. Exports unused so far — fine.

- [ ] **Step 3: Commit.**

```bash
git add Promo/src/lib/notifications-store.ts
git commit -m "feat(promo): localStorage store for live notifications + per-user reads (E-2)"
```

---

## Task 3: Persistent NotificationsProvider with `notify()` + toast

**Files:**
- Modify (rework): `Promo/src/app/components/notifications/NotificationsProvider.tsx`

**Interfaces:**
- Consumes: `buildNotifications`, `createLiveNotification`, `NotificationInput`, `PromoNotification`, `NOTIFICATION_TYPE_META` from `../../../lib/promo-mock-data`; `getLiveNotifications`, `appendLiveNotification`, `getReadIds`, `addReadIds` from `../../../lib/notifications-store`; `useCurrentUser` from `../../current-user-context`; `useRole` from `../../role-context`; `useNavigate` from `react-router`; `toast` from `sonner`.
- Produces (context value): `notifications: PromoNotification[]`, `acknowledge(id)`, `acknowledgeMany(ids)`, **`notify(input: NotificationInput): PromoNotification`**. `useNotifications()` unchanged.

- [ ] **Step 1: Replace the file with the persistent store.**

```tsx
"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  buildNotifications,
  createLiveNotification,
  NOTIFICATION_TYPE_META,
  type NotificationInput,
  type PromoNotification,
} from "../../../lib/promo-mock-data";
import {
  addReadIds,
  appendLiveNotification,
  getLiveNotifications,
  getReadIds,
} from "../../../lib/notifications-store";
import { useCurrentUser } from "../../current-user-context";
import { useRole } from "../../role-context";

interface NotificationsContextValue {
  /** Full store (seeds + live), newest-first — role filtering happens in consumers. */
  notifications: PromoNotification[];
  /** Mark a single notification read (persisted per user). */
  acknowledge: (id: string) => void;
  /** Mark a set of notifications read (bulk «Ознакомлен», persisted per user). */
  acknowledgeMany: (ids: string[]) => void;
  /** Emit a live notification from an action handler: persists + toasts. */
  notify: (input: NotificationInput) => PromoNotification;
}

const NotificationsContext = React.createContext<
  NotificationsContextValue | undefined
>(undefined);

/**
 * Merge persisted live notifications with the rebuilt seeds, newest-first, and
 * apply the persisted per-user read-set. Seeds are rebuilt here (never via
 * `notify`) so NO toast fires on load — only real actions toast.
 */
function buildInitial(userId: string | null): PromoNotification[] {
  const readIds = getReadIds(userId);
  return [...getLiveNotifications(), ...buildNotifications()]
    .map((n) => (readIds.has(n.id) ? { ...n, read: true } : n))
    .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
}

/**
 * S6 / E-2 notification store. Mounted ABOVE the AppShell (in `ProtectedLayout`)
 * so the top-bar bell, the sidebar «Уведомления» badge, and the `/notifications`
 * page share one live read/unread state. Live-emitted notifications + per-user
 * read-state persist to localStorage (E-2); seeds rebuild each load. Read-state
 * is keyed to the user at mount (the provider mounts post-login), anon otherwise.
 */
export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser } = useCurrentUser();
  const { currentRole } = useRole();
  const navigate = useNavigate();
  const userId = currentUser?.id ?? null;

  const [notifications, setNotifications] = React.useState<PromoNotification[]>(
    () => buildInitial(userId)
  );

  // Per-session sequence → unique live ids within a session.
  const seqRef = React.useRef(0);

  const acknowledge = React.useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      addReadIds(userId, [id]);
    },
    [userId]
  );

  const acknowledgeMany = React.useCallback(
    (ids: string[]) => {
      const set = new Set(ids);
      setNotifications((prev) =>
        prev.map((n) => (set.has(n.id) ? { ...n, read: true } : n))
      );
      addReadIds(userId, ids);
    },
    [userId]
  );

  const notify = React.useCallback(
    (input: NotificationInput): PromoNotification => {
      const actor = {
        name: currentUser?.fullName ?? currentRole,
        role: currentRole,
      };
      const n = createLiveNotification(
        input,
        actor,
        seqRef.current++,
        new Date()
      );
      setNotifications((prev) =>
        [n, ...prev].sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      );
      appendLiveNotification(n);
      const meta = NOTIFICATION_TYPE_META[n.type];
      toast(meta.label, {
        description: n.campaignName
          ? `${n.campaignName}: ${n.description}`
          : n.description,
        action: { label: "Открыть", onClick: () => navigate(n.href) },
      });
      return n;
    },
    [currentUser, currentRole, navigate]
  );

  const value = React.useMemo<NotificationsContextValue>(
    () => ({ notifications, acknowledge, acknowledgeMany, notify }),
    [notifications, acknowledge, acknowledgeMany, notify]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = React.useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return ctx;
}
```

- [ ] **Step 2: Build.**

Run: `corepack pnpm --filter promo build`
Expected: build succeeds. `NotificationsPage.tsx` and `AppShell.tsx` already destructure only `notifications`/`acknowledge`/`acknowledgeMany` — still present, so they compile unchanged.

- [ ] **Step 3: In-browser smoke check (persistence of reads).**

Run `corepack pnpm --filter promo dev`, open the app, sign in (`admin@texnomart.uz` / `Admin2026!`), go to `/notifications`. Click «Ознакомлен» on one item → it moves to «Прочитано» and the bell count drops. **Reload** → that item is still read (bell count unchanged). No toast appears on load.

- [ ] **Step 4: Commit.**

```bash
git add Promo/src/app/components/notifications/NotificationsProvider.tsx
git commit -m "feat(promo): persistent notifications store + notify()/toast (E-2)"
```

---

## Task 4: Emit live notifications from the full-calendar S4 handlers

**Files:**
- Modify: `Promo/src/app/components/full-calendar/FullCalendarPage.tsx`

**Interfaces:**
- Consumes: `notify` from `useNotifications()` (`../notifications/NotificationsProvider`); existing in-scope: `campaignsById`, `getNomenclatureItem`, `currentRole`.
- Produces: nothing new (wires emissions into existing handlers).

- [ ] **Step 1: Import + call the hook.**

Add the import near the other app imports (e.g. below the `useRole` import at line 38):

```tsx
import { useNotifications } from "../notifications/NotificationsProvider";
```

Add the hook call immediately after `const { currentRole } = useRole();` (line 229):

```tsx
  const { notify } = useNotifications();
```

- [ ] **Step 2: `onCancelConfirm` → `campaign-cancelled`.**

In `onCancelConfirm` (~816), replace the trailing `toast.success(...)` (lines ~848–850):

```tsx
      toast.success(
        "Акция отменена. Отдельное уведомление «Акция отменена» направлено всем смежным отделам."
      );
```

with:

```tsx
      notify({
        type: "campaign-cancelled",
        campaignId,
        campaignName: campaignsById.get(campaignId)?.name,
        description: `Акция отменена. Причина: ${reason}. Смежные подразделения уведомлены.`,
        href: "/full-calendar",
      });
```

Then add `notify` and `campaignsById` to the callback deps: `[cancelCampaignId, versionsFor, currentRole]` → `[cancelCampaignId, versionsFor, currentRole, notify, campaignsById]`.

- [ ] **Step 3: `onApproveRemoval` → `line-removed`.**

In `onApproveRemoval` (~873), replace `toast.success(...)` (lines ~893–895):

```tsx
      toast.success(
        `Позиция исключена из акции: ${name}. Отделы уведомлены инкрементально.`
      );
```

with (`name` and `line.campaignId` are already in scope above):

```tsx
      notify({
        type: "line-removed",
        campaignId: line.campaignId,
        campaignName: campaignsById.get(line.campaignId)?.name,
        description: `Из акции исключена позиция «${name}» по запросу КМ. Отделы уведомлены инкрементально.`,
        href: "/full-calendar",
      });
```

Then update deps: `[lines, versionsFor, currentRole]` → `[lines, versionsFor, currentRole, notify, campaignsById]`.

- [ ] **Step 4: `onPeriodApply` → `marketing-reapproval`.**

In `onPeriodApply` (~739), replace `toast.success(...)` (lines ~749–751):

```tsx
      toast.success(
        "Период изменён. Изменение требует повторного согласования маркетинга перед отправкой."
      );
```

with:

```tsx
      notify({
        type: "marketing-reapproval",
        campaignId,
        campaignName: campaignsById.get(campaignId)?.name,
        description:
          "Изменён период акции — требуется повторное согласование выбора «В рекламу» маркетингом перед отправкой.",
        href: "/full-calendar",
      });
```

Then update deps: `[]` → `[notify, campaignsById]`.

- [ ] **Step 5: `onSendToDepartments` → `data-changed`.**

In `onSendToDepartments` (~764), replace `toast.success(...)` (lines ~804–806):

```tsx
      toast.success(
        `Версия ${nextNo} сформирована и отправлена смежным отделам (инкрементально). Отделы уведомлены.`
      );
```

with (`nextNo` is in scope above):

```tsx
      notify({
        type: "data-changed",
        campaignId,
        campaignName: campaignsById.get(campaignId)?.name,
        reportVersion: nextNo,
        description: `Сформирована и отправлена версия ${nextNo} смежным отделам (инкрементально).`,
        href: "/reports",
      });
```

Then add `notify` to the deps (which already include `campaignsById`): `[changeSetFor, versionsFor, linesFor, campaignsById, currentRole]` → `[changeSetFor, versionsFor, linesFor, campaignsById, currentRole, notify]`.

- [ ] **Step 6: Build.**

Run: `corepack pnpm --filter promo build`
Expected: build succeeds. (`toast` is still imported and used by the untouched success toasts elsewhere in the file — no unused-import removal needed.)

- [ ] **Step 7: In-browser check (live emission).**

In dev, sign in, switch the god-mode role to **Коммерческий директор**. On `/full-calendar`:
- Cancel a campaign → a toast «Акция отменена» appears; the bell count increments; `/notifications` shows the item under «Непрочитанные» with type «Акция отменена».
- Approve a pending line exclusion (seeded on UN-2026-015) → toast «Удалена позиция»; bell increments.
- Change an approved campaign's period → toast «Повторное согласование маркетинга».
- «Согласовать и отправить смежным отделам» → toast «Новые/изменённые данные» with «отчёт v…».
Then **reload** → all four items persist on `/notifications`.

- [ ] **Step 8: Commit.**

```bash
git add Promo/src/app/components/full-calendar/FullCalendarPage.tsx
git commit -m "feat(promo): emit live notifications from full-calendar S4 actions (E-2)"
```

---

## Task 5: Emit from the reports marketing-approval handler + final verification

**Files:**
- Modify: `Promo/src/app/components/reports/DepartmentReportView.tsx`

**Interfaces:**
- Consumes: `notify` from `useNotifications()` (`../notifications/NotificationsProvider`); existing in-scope prop `campaign: PromoCampaign`.
- Produces: nothing new.

- [ ] **Step 1: Import + call the hook.**

Add the import near the other component imports (e.g. below the `OverdueTag` import at line 23):

```tsx
import { useNotifications } from "../notifications/NotificationsProvider";
```

Inside the `DepartmentReportView` component body (top, alongside its other hooks), add:

```tsx
  const { notify } = useNotifications();
```

- [ ] **Step 2: `marketingApprove` → `ad-approval`.**

Replace the body of `marketingApprove` (line ~211):

```tsx
  const marketingApprove = () => {
    toast.success("Выбор «В рекламу» согласован. Категорийные менеджеры уведомлены.");
  };
```

with:

```tsx
  const marketingApprove = () => {
    notify({
      type: "ad-approval",
      campaignId: campaign.id,
      campaignName: campaign.name,
      description:
        "Маркетинг согласовал выбор позиций «В рекламу». Категорийные менеджеры уведомлены.",
      href: "/reports",
    });
  };
```

(`toast` stays imported — it's still used by the acknowledge toasts at lines ~197/205/209.)

- [ ] **Step 3: Build (Promo).**

Run: `corepack pnpm --filter promo build`
Expected: build succeeds.

- [ ] **Step 4: In-browser check (reports emission).**

In dev, switch the god-mode role to **Сотрудник маркетинга**, go to `/reports`, department **Маркетинг**, pick a sent campaign, and click «Согласовать выбор (маркетинг)» → a toast «Утверждение «В рекламу»» appears; the bell increments; `/notifications` shows the item; reload → it persists.

- [ ] **Step 5: Final verification — Dashboard build stays green.**

Run: `corepack pnpm --filter dashboard build`
Expected: build succeeds (this change is Promo-local; Dashboard must be unaffected).

- [ ] **Step 6: Commit.**

```bash
git add Promo/src/app/components/reports/DepartmentReportView.tsx
git commit -m "feat(promo): emit live notification on marketing ad-choice approval (E-2)"
```

---

## Self-Review (author checklist — completed)

**Spec coverage** — every spec section maps to a task:
- §A data model (`NotificationInput` / `notificationAudienceFor` / `createLiveNotification`) → **Task 1**.
- §B persistence (`notifications-store.ts`, cap 50, anon fallback) → **Task 2**.
- §C store rework (merge, read-set, `notify`, per-user keying) → **Task 3**.
- §D toast fired centrally in `notify()` → **Task 3** (with SPA-safe `navigate`).
- §E five emission points (4 full-calendar + 1 reports) → **Tasks 4 & 5**.
- §F page/item unchanged → no task (verified: no import churn).
- Verification (Promo build + in-browser + Dashboard build) → per-task Steps + Task 5 Step 5.

**Placeholder scan** — no TBD/TODO; every code step shows full code.

**Type consistency** — `notify(input: NotificationInput): PromoNotification` and the four store helper signatures are identical across Tasks 1–5. `createLiveNotification(input, actor, seq, at)` argument order matches its call in Task 3. Context value adds `notify` without changing `notifications`/`acknowledge`/`acknowledgeMany`, so `NotificationsPage.tsx`/`AppShell.tsx` compile unchanged.

**Deferred decisions** — `marketing-reapproval` emits on period change only (value-change re-approval is a derived state, no discrete handler — documented in spec §E); `km-assignment` stays seed-only (no assignment UI).
