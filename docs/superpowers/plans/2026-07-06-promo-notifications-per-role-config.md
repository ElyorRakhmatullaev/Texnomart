# E-2b «Уведомления» — per-role config + «для роли X» tag + deep-links — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the notification-configuration layer the E-2 build didn't cover: an editable role×category config (Администратор-only screen, persisted + applied live), a «для роли X» tag on each notification, and «Открыть промо/согласование/отчёт» deep-links.

**Architecture:** Promo-local React (Vite + TS, Tailwind v4, shadcn via `@texnomart/ui`, patterns via `@texnomart/shared`). A `RoleNotificationConfig` (role→categories) lives in a new localStorage store, exposed reactively by a `NotificationSettingsProvider` mounted above the AppShell (beside `NotificationsProvider`). `notificationsForRole` filters by that config (Администратор always sees all); an admin screen edits it. Notifications render a config-derived «для роли X» tag + per-category deep-links. Defaults reproduce E-2's exact visibility (no regression).

**Tech Stack:** React 18 + TypeScript, Vite 6, Tailwind v4, shadcn/ui, lucide-react, react-router.

## Global Constraints

- **Promo-local only.** No edits to `@texnomart/shared`, `@texnomart/ui`, or `Dashboard/`. Verify `build:dashboard` stays green at the end.
- **Verification model:** no unit-test harness (`vite build` doesn't typecheck app logic but catches import/syntax/type-import errors). Each task ends with a green `corepack pnpm --filter promo build` + the task's explicit in-browser checks. Do NOT add a test framework.
- **pnpm via corepack:** `pnpm` is not on PATH — always `corepack pnpm …`. Promo build `corepack pnpm --filter promo build`; dev `corepack pnpm --filter promo dev`; Dashboard `corepack pnpm --filter dashboard build`.
- **RU only.** All UI copy in Russian.
- **No-regression default:** `DEFAULT_ROLE_CONFIG` must be the faithful inversion of the current audiences (`km-assignment` → all 9 roles; `data-changed`/`campaign-cancelled`/`line-removed` → the 7 ADJ roles [everyone except КМ + Старший КМ]; `marketing-reapproval`/`ad-approval` → the 4 marketing roles [Сотрудник маркетинга, Директор маркетинга, Коммерческий директор, Администратор]). With defaults the app must behave exactly as after E-2.
- **Администратор** is never filtered (god-mode escape hatch): `notificationsForRole` short-circuits for it; its editor block is disabled.
- **SPA navigation** via react-router only (never `window.location`) — the app runs under a Router `basename`.
- **6 categories only** (`NotificationType`): no new notification types or emission points.
- **Spec:** `docs/superpowers/specs/2026-07-06-promo-notifications-per-role-config-design.md` is the source of truth.

---

## File Structure

| File | Responsibility |
|---|---|
| `Promo/src/lib/promo-mock-data.ts` | **Modify** — `RoleNotificationConfig` type; `notificationsForRole(role, list, config?)` (config path + audience fallback); `notificationLinksFor(n)` (+ `NotificationLink`). |
| `Promo/src/lib/notification-settings-store.ts` | **New** — localStorage `promo:notification-role-config`: `DEFAULT_ROLE_CONFIG`, `getRoleConfig`, `persistRoleConfig`, `resetRoleConfig`, `rolesForType`. |
| `Promo/src/app/components/notification-settings/NotificationSettingsProvider.tsx` | **New** — reactive config provider (`useNotificationSettings` → `config`/`setRoleCategory`/`resetConfig`). |
| `Promo/src/app/components/notification-settings/NotificationSettingsPage.tsx` | **New** — Админ-only per-role toggle blocks + «Сбросить к умолчаниям». |
| `Promo/src/app/routes.tsx` | **Modify** — wrap `NotificationSettingsProvider` above `NotificationsProvider`; add `/notification-settings` route. |
| `Promo/src/app/shell-config.tsx` | **Modify** — «Система»-group nav item (Админ-gated) + breadcrumb. |
| `Promo/src/app/components/AppShell.tsx` | **Modify** — bell filtering via config. |
| `Promo/src/app/components/notifications/NotificationsPage.tsx` | **Modify** — list filtering via config. |
| `Promo/src/app/components/notifications/NotificationItem.tsx` | **Modify** — «для роли X» chips + deep-link buttons. |
| `Promo/src/app/components/reports/ReportsPage.tsx` | **Modify** — `?promo=` pre-select. |

---

## Task 1: Config type + config-aware `notificationsForRole` + deep-links helper

**Files:**
- Modify: `Promo/src/lib/promo-mock-data.ts` (replace the existing `notificationsForRole`, ~line 3142; add helpers next to it)

**Interfaces:**
- Consumes (already in the file above the edit): `PromoRole`, `NotificationType`, `PromoNotification`.
- Produces:
  - `export type RoleNotificationConfig = Record<PromoRole, NotificationType[]>;`
  - `export function notificationsForRole(role: PromoRole, list: PromoNotification[], config?: RoleNotificationConfig): PromoNotification[];`
  - `export interface NotificationLink { label: string; href: string; kind: "promo" | "approval" | "report"; }`
  - `export function notificationLinksFor(n: PromoNotification): NotificationLink[];`

- [ ] **Step 1: Replace `notificationsForRole` and add the two helpers.**

Find the existing function:

```ts
export function notificationsForRole(
  role: PromoRole,
  list: PromoNotification[]
): PromoNotification[] {
  if (role === "Администратор") return list;
  return list.filter((n) => !n.visibleTo || n.visibleTo.includes(role));
}
```

Replace it with:

```ts
/** E-2b — per-role notification config: which categories each role receives. */
export type RoleNotificationConfig = Record<PromoRole, NotificationType[]>;

/**
 * Notifications a role may see. Администратор is never filtered (god-mode escape
 * hatch). With a `config` (E-2b), visibility = the role's configured categories;
 * without one, the pre-E-2b `visibleTo` audience behavior (back-compat until the
 * consumers pass the config).
 */
export function notificationsForRole(
  role: PromoRole,
  list: PromoNotification[],
  config?: RoleNotificationConfig
): PromoNotification[] {
  if (role === "Администратор") return list;
  if (config) {
    const allowed = config[role] ?? [];
    return list.filter((n) => allowed.includes(n.type));
  }
  return list.filter((n) => !n.visibleTo || n.visibleTo.includes(role));
}

/** E-2b — a context deep-link surfaced on a notification. */
export interface NotificationLink {
  label: string;
  href: string;
  kind: "promo" | "approval" | "report";
}

/**
 * Context deep-links for a notification (E-2b). Produced only when the item has a
 * `campaignId`; the target screens focus the campaign via `?promo=<id>`
 * (full-calendar/approvals show a banner, reports pre-selects the picker).
 */
export function notificationLinksFor(n: PromoNotification): NotificationLink[] {
  if (!n.campaignId) return [];
  const id = n.campaignId;
  const promo: NotificationLink = { label: "Открыть промо", href: `/full-calendar?promo=${id}`, kind: "promo" };
  const approval: NotificationLink = { label: "Открыть согласование", href: `/approvals?promo=${id}`, kind: "approval" };
  const report: NotificationLink = { label: "Открыть отчёт", href: `/reports?promo=${id}`, kind: "report" };
  switch (n.type) {
    case "data-changed":
      return [report, promo];
    case "campaign-cancelled":
    case "line-removed":
    case "marketing-reapproval":
      return [promo, approval];
    case "km-assignment":
      return [promo];
    case "ad-approval":
      return [report, promo];
  }
}
```

- [ ] **Step 2: Build.**

Run: `corepack pnpm --filter promo build`
Expected: success. The `config` param is optional, so the existing callers (AppShell, NotificationsPage) compile unchanged and keep the current behavior.

- [ ] **Step 3: Commit.**

```bash
git add Promo/src/lib/promo-mock-data.ts
git commit -m "feat(promo): config-aware notificationsForRole + notificationLinksFor (E-2b)"
```

---

## Task 2: Role×category config store

**Files:**
- Create: `Promo/src/lib/notification-settings-store.ts`

**Interfaces:**
- Consumes: `PROMO_ROLES`, `PromoRole` from `../app/role-context`; `NotificationType`, `RoleNotificationConfig` from `./promo-mock-data` (Task 1).
- Produces:
  - `export const DEFAULT_ROLE_CONFIG: RoleNotificationConfig;`
  - `export function getRoleConfig(): RoleNotificationConfig;`
  - `export function persistRoleConfig(config: RoleNotificationConfig): void;`
  - `export function resetRoleConfig(): RoleNotificationConfig;`
  - `export function rolesForType(type: NotificationType, config: RoleNotificationConfig): PromoRole[];`

- [ ] **Step 1: Create the store.**

```ts
// E-2b — per-role notification config (which categories each role receives).
// localStorage `promo:notification-role-config`. Defaults reproduce the pre-E-2b
// audiences EXACTLY (no regression); the Администратор edits from there.
import { PROMO_ROLES, type PromoRole } from "../app/role-context";
import type { NotificationType, RoleNotificationConfig } from "./promo-mock-data";

const STORAGE_KEY = "promo:notification-role-config";

const ALL: NotificationType[] = [
  "data-changed",
  "campaign-cancelled",
  "line-removed",
  "marketing-reapproval",
  "km-assignment",
  "ad-approval",
];
// ADJ_DEPARTMENTS types (cancel/removed/data) + km-assignment (all).
const ADJ: NotificationType[] = [
  "data-changed",
  "campaign-cancelled",
  "line-removed",
  "km-assignment",
];
const KM_ONLY: NotificationType[] = ["km-assignment"];

/** Faithful inversion of the pre-E-2b audiences → role→categories. */
export const DEFAULT_ROLE_CONFIG: RoleNotificationConfig = {
  "Коммерческий директор": [...ALL],
  "Операционный директор": [...ADJ],
  "Директор маркетинга": [...ALL],
  "Категорийный менеджер (КМ)": [...KM_ONLY],
  "Старший КМ": [...KM_ONLY],
  "Сотрудник маркетинга": [...ALL],
  "Сотрудник закупа": [...ADJ],
  "Сотрудник аналитики": [...ADJ],
  "Администратор": [...ALL],
};

function cloneDefault(): RoleNotificationConfig {
  return Object.fromEntries(
    (Object.keys(DEFAULT_ROLE_CONFIG) as PromoRole[]).map((r) => [r, [...DEFAULT_ROLE_CONFIG[r]]])
  ) as RoleNotificationConfig;
}

/** Stored config merged over defaults (any missing role falls back to default). */
export function getRoleConfig(): RoleNotificationConfig {
  if (typeof window === "undefined") return cloneDefault();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefault();
    const stored = JSON.parse(raw) as Partial<Record<PromoRole, unknown>>;
    const merged = cloneDefault();
    for (const role of PROMO_ROLES) {
      const v = stored[role];
      if (Array.isArray(v)) {
        merged[role] = v.filter((t): t is NotificationType => ALL.includes(t as NotificationType));
      }
    }
    return merged;
  } catch {
    return cloneDefault();
  }
}

export function persistRoleConfig(config: RoleNotificationConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore quota errors (mock) */
  }
}

/** Restore + persist the defaults; returns the fresh config. */
export function resetRoleConfig(): RoleNotificationConfig {
  const fresh = cloneDefault();
  persistRoleConfig(fresh);
  return fresh;
}

/** Roles configured to receive a category — drives the «для роли X» tag. */
export function rolesForType(
  type: NotificationType,
  config: RoleNotificationConfig
): PromoRole[] {
  return PROMO_ROLES.filter((r) => config[r]?.includes(type));
}
```

- [ ] **Step 2: Build.**

Run: `corepack pnpm --filter promo build`
Expected: success (exports unused so far).

- [ ] **Step 3: Commit.**

```bash
git add Promo/src/lib/notification-settings-store.ts
git commit -m "feat(promo): per-role notification config store + defaults (E-2b)"
```

---

## Task 3: Reactive settings provider + mount above the shell

**Files:**
- Create: `Promo/src/app/components/notification-settings/NotificationSettingsProvider.tsx`
- Modify: `Promo/src/app/routes.tsx` (import + wrap in `ProtectedLayout`)

**Interfaces:**
- Consumes: `getRoleConfig`, `persistRoleConfig`, `resetRoleConfig` from `../../../lib/notification-settings-store`; `RoleNotificationConfig`, `NotificationType` from `../../../lib/promo-mock-data`; `PromoRole` from `../../role-context`.
- Produces: `NotificationSettingsProvider`, `useNotificationSettings(): { config: RoleNotificationConfig; setRoleCategory(role: PromoRole, type: NotificationType, on: boolean): void; resetConfig(): void; }`.

- [ ] **Step 1: Create the provider.**

```tsx
"use client";

import * as React from "react";
import {
  getRoleConfig,
  persistRoleConfig,
  resetRoleConfig,
} from "../../../lib/notification-settings-store";
import type {
  NotificationType,
  RoleNotificationConfig,
} from "../../../lib/promo-mock-data";
import type { PromoRole } from "../../role-context";

interface NotificationSettingsValue {
  config: RoleNotificationConfig;
  setRoleCategory: (role: PromoRole, type: NotificationType, on: boolean) => void;
  resetConfig: () => void;
}

const Ctx = React.createContext<NotificationSettingsValue | undefined>(undefined);

/**
 * E-2b — holds the role×category notification config so the editor, the
 * notification center, and the top-bar bell all react to a toggle live. Mounted
 * ABOVE the AppShell (in ProtectedLayout). Persists every change to localStorage.
 */
export function NotificationSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = React.useState<RoleNotificationConfig>(() =>
    getRoleConfig()
  );

  const setRoleCategory = React.useCallback(
    (role: PromoRole, type: NotificationType, on: boolean) => {
      setConfig((prev) => {
        const current = prev[role] ?? [];
        const nextForRole = on
          ? current.includes(type)
            ? current
            : [...current, type]
          : current.filter((t) => t !== type);
        const next = { ...prev, [role]: nextForRole };
        persistRoleConfig(next);
        return next;
      });
    },
    []
  );

  const resetConfig = React.useCallback(() => {
    setConfig(resetRoleConfig());
  }, []);

  const value = React.useMemo<NotificationSettingsValue>(
    () => ({ config, setRoleCategory, resetConfig }),
    [config, setRoleCategory, resetConfig]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotificationSettings() {
  const ctx = React.useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useNotificationSettings must be used within a NotificationSettingsProvider"
    );
  }
  return ctx;
}
```

- [ ] **Step 2: Mount it above the AppShell in `routes.tsx`.**

Add the import near the other component imports:

```tsx
import { NotificationSettingsProvider } from "./components/notification-settings/NotificationSettingsProvider";
```

Change `ProtectedLayout`'s return (currently `<NotificationsProvider><AppShell /></NotificationsProvider>`) to:

```tsx
  return (
    <NotificationSettingsProvider>
      <NotificationsProvider>
        <AppShell />
      </NotificationsProvider>
    </NotificationSettingsProvider>
  );
```

- [ ] **Step 3: Build.**

Run: `corepack pnpm --filter promo build`
Expected: success. The provider is mounted but not yet consumed.

- [ ] **Step 4: Commit.**

```bash
git add Promo/src/app/components/notification-settings/NotificationSettingsProvider.tsx Promo/src/app/routes.tsx
git commit -m "feat(promo): NotificationSettingsProvider mounted above the shell (E-2b)"
```

---

## Task 4: Админ settings screen + route + nav

**Files:**
- Create: `Promo/src/app/components/notification-settings/NotificationSettingsPage.tsx`
- Modify: `Promo/src/app/routes.tsx` (import + route)
- Modify: `Promo/src/app/shell-config.tsx` (nav item + breadcrumb)

**Interfaces:**
- Consumes: `useNotificationSettings` (Task 3); `useRole`, `PROMO_ROLES`, `PromoRole` from `../../role-context`; `NOTIFICATION_TYPE_META`, `NotificationType` from `../../../lib/promo-mock-data`; `PageHeader`, `Card`, `Switch`, `Button`, `cn`.
- Produces: `NotificationSettingsPage`.

- [ ] **Step 1: Create the page.**

```tsx
"use client";

import * as React from "react";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { Card } from "@texnomart/ui/card";
import { Switch } from "@texnomart/ui/switch";
import { Button } from "@texnomart/ui/button";
import { cn } from "@texnomart/ui/utils";
import { useRole, PROMO_ROLES } from "../../role-context";
import { useNotificationSettings } from "./NotificationSettingsProvider";
import {
  NOTIFICATION_TYPE_META,
  type NotificationType,
} from "../../../lib/promo-mock-data";

const CATEGORIES = Object.keys(NOTIFICATION_TYPE_META) as NotificationType[];

export function NotificationSettingsPage() {
  const { currentRole } = useRole();
  const { config, setRoleCategory, resetConfig } = useNotificationSettings();

  if (currentRole !== "Администратор") {
    return (
      <div className="flex flex-col gap-4 pb-6">
        <PageHeader title="Настройки уведомлений" showCompare={false} showExport={false} />
        <Card className="p-8 text-center text-muted-foreground">
          Недостаточно прав. Экран доступен только роли «Администратор».
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Настройки уведомлений"
        subtitle="Какие категории уведомлений получает каждая роль."
        showCompare={false}
        showExport={false}
        actions={
          <Button variant="secondary" size="sm" className="h-9" onClick={resetConfig}>
            Сбросить к умолчаниям
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {PROMO_ROLES.map((role) => {
          const isAdmin = role === "Администратор";
          const set = config[role] ?? [];
          return (
            <Card key={role} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{role}</h3>
                {isAdmin && (
                  <span className="text-xs text-muted-foreground">видит все уведомления</span>
                )}
              </div>
              <div className="space-y-1">
                {CATEGORIES.map((type) => {
                  const meta = NOTIFICATION_TYPE_META[type];
                  const checked = isAdmin ? true : set.includes(type);
                  return (
                    <label
                      key={type}
                      className="flex min-h-11 cursor-pointer items-center justify-between gap-3"
                    >
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
                          meta.bg,
                          meta.text
                        )}
                      >
                        {meta.label}
                      </span>
                      <Switch
                        checked={checked}
                        disabled={isAdmin}
                        onCheckedChange={(on) => setRoleCategory(role, type, on)}
                        aria-label={`${role}: ${meta.label}`}
                      />
                    </label>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the route in `routes.tsx`.**

Add the import:

```tsx
import { NotificationSettingsPage } from "./components/notification-settings/NotificationSettingsPage";
```

Add a route inside the `ProtectedLayout` children (next to `{ path: "notifications", … }`):

```tsx
      { path: "notification-settings", Component: NotificationSettingsPage },
```

- [ ] **Step 3: Add the nav item + breadcrumb in `shell-config.tsx`.**

Add `BellCog` to the lucide import (the existing import block at the top):

```tsx
import {
  CalendarRange,
  Table2,
  CheckCircle2,
  FileBarChart,
  Bell,
  BellCog,
  ShieldCheck,
  SlidersHorizontal,
  KeyRound,
  Users,
} from "lucide-react";
```

In the «Система» group `items` array (after the «Матрица прав» item), add:

```tsx
          {
            label: "Настройки уведомлений",
            icon: BellCog,
            href: "/notification-settings",
            roles: ["Администратор"],
          },
```

In `breadcrumbRoutes` (after the `/notifications` entry), add:

```tsx
      { path: "/notification-settings", label: "Настройки уведомлений" },
```

- [ ] **Step 4: Build.**

Run: `corepack pnpm --filter promo build`
Expected: success.

- [ ] **Step 5: In-browser check (editor renders + persists).**

`corepack pnpm --filter promo dev`; sign in as `admin@texnomart.uz` / `Admin2026!` (role starts as Администратор). Open «Настройки уведомлений» from the «Система» nav. Confirm: 9 role blocks, each with 6 category switches; the Администратор block's switches are all on + disabled with «видит все уведомления». Toggle a category off for «Сотрудник закупа» → reload → the toggle stays off (persisted). Switch the god-mode role to a non-admin role → the nav item disappears; switch back to Администратор → it returns. Click «Сбросить к умолчаниям» → the toggle returns to on.

- [ ] **Step 6: Commit.**

```bash
git add Promo/src/app/components/notification-settings/NotificationSettingsPage.tsx Promo/src/app/routes.tsx Promo/src/app/shell-config.tsx
git commit -m "feat(promo): Админ notification-settings screen + route + nav (E-2b)"
```

---

## Task 5: Filter the bell + center by the live config

**Files:**
- Modify: `Promo/src/app/components/AppShell.tsx`
- Modify: `Promo/src/app/components/notifications/NotificationsPage.tsx`

**Interfaces:**
- Consumes: `useNotificationSettings` (Task 3); the config-aware `notificationsForRole` (Task 1).
- Produces: nothing new.

- [ ] **Step 1: Wire `AppShell.tsx`.**

Add the import near the other imports:

```tsx
import { useNotificationSettings } from "./notification-settings/NotificationSettingsProvider";
```

Inside the `AppShell` component, after `const { notifications } = useNotifications();`, add:

```tsx
  const { config } = useNotificationSettings();
```

Change the `visibleNotifications` memo to pass the config and depend on it:

```tsx
  const visibleNotifications = React.useMemo(
    () => notificationsForRole(currentRole, notifications, config),
    [currentRole, notifications, config]
  );
```

- [ ] **Step 2: Wire `NotificationsPage.tsx`.**

Add the import near the other imports (`NotificationsPage.tsx` is in `components/notifications/`, the provider in `components/notification-settings/` — hence the `../` path):

```tsx
import { useNotificationSettings } from "../notification-settings/NotificationSettingsProvider";
```

Inside `NotificationsPage`, after `const { notifications, acknowledge, acknowledgeMany } = useNotifications();`, add:

```tsx
  const { config } = useNotificationSettings();
```

Change the `visible` memo to pass the config and depend on it:

```tsx
  const visible = React.useMemo(
    () => notificationsForRole(currentRole, notifications, config),
    [currentRole, notifications, config]
  );
```

- [ ] **Step 3: Build.**

Run: `corepack pnpm --filter promo build`
Expected: success.

- [ ] **Step 4: In-browser check (live filtering).**

In dev, as Администратор open «Настройки уведомлений» and turn **off** «Отмена акции» (`campaign-cancelled`) for «Сотрудник закупа». Switch the god-mode role to «Сотрудник закупа», open `/notifications` → no «Акция отменена» items, and the bell count reflects the drop. Turn it back on (as Администратор) → they return live (no reload). Administrator still sees all regardless.

- [ ] **Step 5: Commit.**

```bash
git add Promo/src/app/components/AppShell.tsx Promo/src/app/components/notifications/NotificationsPage.tsx
git commit -m "feat(promo): filter bell + notifications center by role config (E-2b)"
```

---

## Task 6: «для роли X» tag + deep-links on each notification

**Files:**
- Modify: `Promo/src/app/components/notifications/NotificationItem.tsx`

**Interfaces:**
- Consumes: `useNotificationSettings` (Task 3); `notificationLinksFor` (Task 1); `rolesForType` from `../../../lib/notification-settings-store`; `useRole`.
- Produces: nothing new.

- [ ] **Step 1: Update imports.**

At the top of `NotificationItem.tsx`, the current data import is:

```tsx
import {
  NOTIFICATION_TYPE_META,
  type NotificationType,
  type PromoNotification,
} from "../../../lib/promo-mock-data";
```

Replace it with (adds `notificationLinksFor`):

```tsx
import {
  NOTIFICATION_TYPE_META,
  notificationLinksFor,
  type NotificationType,
  type PromoNotification,
} from "../../../lib/promo-mock-data";
import { rolesForType } from "../../../lib/notification-settings-store";
import { useRole } from "../../role-context";
import { useNotificationSettings } from "../notification-settings/NotificationSettingsProvider";
```

Delete the now-unused `LINK_LABEL` constant:

```tsx
const LINK_LABEL: Record<string, string> = {
  "/reports": "Открыть отчёт",
  "/full-calendar": "Открыть акцию",
};
```

- [ ] **Step 2: Compute the tag roles + links inside the component.**

Right after `const Icon = TYPE_ICONS[n.type];`, add:

```tsx
  const { config } = useNotificationSettings();
  const { currentRole } = useRole();
  const tagRoles = rolesForType(n.type, config);
  const links = notificationLinksFor(n);
  const currentIncluded = tagRoles.includes(currentRole);
```

- [ ] **Step 3: Add the «для роли X» chip row.**

Immediately AFTER the actor line block (the `<div>` that renders `n.actor.name` · `n.actor.role` · `<RuDate>`), insert:

```tsx
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-muted-foreground">Роли:</span>
          {tagRoles.length === 0 ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center rounded-md px-1.5 py-0.5 font-medium",
                currentIncluded
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 text-gray-600 dark:bg-muted dark:text-gray-300"
              )}
              title={tagRoles.join(", ")}
            >
              {tagRoles.slice(0, 2).join(", ")}
              {tagRoles.length > 2 ? ` +${tagRoles.length - 2}` : ""}
            </span>
          )}
        </div>
```

- [ ] **Step 4: Replace the single quick-link with the mapped deep-links.**

Find the actions block:

```tsx
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link
            to={n.href}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8"
            )}
          >
            {LINK_LABEL[n.href] ?? "Открыть"}
          </Link>
          {!n.read && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => onAcknowledge(n.id)}
            >
              <Check className="size-4" />
              Ознакомлен
            </Button>
          )}
        </div>
```

Replace it with:

```tsx
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {links.map((lnk) => (
            <Link
              key={lnk.kind}
              to={lnk.href}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8"
              )}
            >
              {lnk.label}
            </Link>
          ))}
          {!n.read && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => onAcknowledge(n.id)}
            >
              <Check className="size-4" />
              Ознакомлен
            </Button>
          )}
        </div>
```

- [ ] **Step 5: Build.**

Run: `corepack pnpm --filter promo build`
Expected: success (`LINK_LABEL`, and the old single-`href` usage, are gone — `n.href` may now be unused in this file, which is fine).

- [ ] **Step 6: In-browser check (tag + links).**

In dev, open `/notifications`. Each item shows a «Роли: …» chip (hover → the full role list; when the active role is in the set, the chip is yellow) and up to 3 context buttons («Открыть промо/согласование/отчёт») for items with a campaign. Click «Открыть согласование» on a «Акция отменена» item → lands on `/approvals?promo=<id>` (focused). Click «Открыть промо» → `/full-calendar?promo=<id>` (focused + banner).

- [ ] **Step 7: Commit.**

```bash
git add Promo/src/app/components/notifications/NotificationItem.tsx
git commit -m "feat(promo): «для роли X» tag + context deep-links on notifications (E-2b)"
```

---

## Task 7: `?promo=` pre-select on Reports + final verification

**Files:**
- Modify: `Promo/src/app/components/reports/ReportsPage.tsx`

**Interfaces:**
- Consumes: `useSearchParams` from `react-router`; the existing `sentCampaigns` + `setCampaignId` state.
- Produces: nothing new.

- [ ] **Step 1: Import `useSearchParams`.**

At the top of `ReportsPage.tsx`, add the react-router import (the file doesn't currently import from `react-router`):

```tsx
import { useSearchParams } from "react-router";
```

- [ ] **Step 2: Add the mount-time pre-select effect.**

Inside `ReportsPage`, right AFTER the existing campaign effect (the `React.useEffect` that resets `campaignId` when it's not in `sentCampaigns`, ~lines 66–70), add:

```tsx
  // E-2b — a notification deep-link (`/reports?promo=<id>`) pre-selects the campaign
  // in the picker. Runs once on mount; later picker changes stay user-driven.
  const [searchParams] = useSearchParams();
  React.useEffect(() => {
    const promo = searchParams.get("promo");
    if (promo && sentCampaigns.some((c) => c.id === promo)) {
      setCampaignId(promo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

- [ ] **Step 3: Build (Promo).**

Run: `corepack pnpm --filter promo build`
Expected: success.

- [ ] **Step 4: In-browser check (reports deep-link).**

In dev, open `/notifications`, find a `data-changed` («Новые/изменённые данные») item for a sent campaign, click «Открыть отчёт» → `/reports?promo=<id>` opens with that campaign selected in the picker (not the default first campaign).

- [ ] **Step 5: Final verification — Dashboard build stays green.**

Run: `corepack pnpm --filter dashboard build`
Expected: success (Promo-local change; Dashboard unaffected).

- [ ] **Step 6: Commit.**

```bash
git add Promo/src/app/components/reports/ReportsPage.tsx
git commit -m "feat(promo): reports ?promo= pre-select for notification deep-links (E-2b)"
```

---

## Self-Review (author checklist — completed)

**Spec coverage** — every spec section maps to a task:
- §A config store (`DEFAULT_ROLE_CONFIG`, `getRoleConfig`, `persistRoleConfig`, `resetRoleConfig`, `rolesForType`) → **Task 2**.
- §B visibility rework (`notificationsForRole(role, list, config)`) + `notificationLinksFor` → **Task 1**.
- §C reactive provider + mount → **Task 3**.
- §D admin screen + route + nav (Администратор-gated, disabled Админ block) → **Task 4**.
- §E item «для роли X» tag + deep-links → **Task 6**.
- §F consumers switch to config → **Task 5**; reports `?promo=` → **Task 7**.
- Verification (Promo build + in-browser + Dashboard build) → per-task Steps + Task 7 Step 5.

**Placeholder scan** — no TBD/TODO; every code step shows full code.

**Type consistency** — `RoleNotificationConfig = Record<PromoRole, NotificationType[]>` defined in Task 1, imported by Tasks 2/3. `notificationsForRole(role, list, config?)` signature identical across Tasks 1/5. `useNotificationSettings()` shape (`config`/`setRoleCategory`/`resetConfig`) identical across Tasks 3/4/5/6. `rolesForType(type, config)` / `notificationLinksFor(n)` signatures match their call sites. `DEFAULT_ROLE_CONFIG` values satisfy the Global-Constraints no-regression rule (km-assignment → all 9; ADJ trio → 7 ADJ roles; marketing pair → 4 marketing roles).

**Build-green ordering** — `notificationsForRole`'s `config` is optional with the old-audience fallback (Task 1), so Tasks 1–4 build green before the consumers pass the config (Task 5). The provider (Task 3) precedes every `useNotificationSettings()` consumer (Tasks 4–6).

**Deferred/mock** — «для роли X» shows the full configured target set (per-user multi-role filtering is E-4); Администратор bypasses the config; role-config is per-browser localStorage.
