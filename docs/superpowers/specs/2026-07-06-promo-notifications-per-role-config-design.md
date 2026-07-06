# E-2b — «Уведомления»: per-role config + «для роли X» tag + deep-links (design)

> Date: 2026-07-06
> Module: Texnomart **Promo**, S6 `/notifications` (`Promo/src/app/components/notifications/`) + a new admin settings screen.
> Source: the original PDF E-2 «Уведомления» asks (per-role approval-workflow notification sets, admin per-role
> blocks, multi-role dedup + «для роли X» tag, «Открыть промо/согласование/отчёт» deep-links) that the E-2
> «live + persistent» build (2026-07-06) did **not** cover. Interpretation of the paraphrased asks was proposed
> and approved in brainstorming (the user delegated: "do what you think is best").
> Scope: **Promo-local only** — no changes to `@texnomart/shared` or Dashboard.
> Depends on: E-2 (the persistent `NotificationsProvider` + the notification store). Part of the E-series.

## Goal

E-2 made notifications live + persistent, but visibility is still governed by two hardcoded audiences
(`MARKETING_AUDIENCE` / `ADJ_DEPARTMENTS_AUDIENCE`) via each notification's `visibleTo`. E-2b delivers the PDF's
notification-configuration layer:

1. **Per-role sets** — which notification categories each of the 9 roles receives becomes a **role × category**
   matrix, seeded to exactly reproduce today's audiences (no regression) and then editable.
2. **Admin per-role blocks** — an **Администратор-only** screen where each role is a block of category toggles;
   edits persist and apply **live** to the notification center + the top-bar bell.
3. **«для роли X» tag** — each notification in the center shows which roles are configured to receive its
   category. The store already holds **one item per event** (that is the "dedup"); the tag makes the target
   roles explicit.
4. **Deep-links** — each notification offers up to 3 context links («Открыть промо / согласование / отчёт»),
   reusing the existing `?promo=` focus+banner infrastructure.

## Decisions locked in brainstorming

1. **Config shape** — **editable admin config** (not a read-only overview): a role×category store, admin-edited,
   applied live.
2. **Catalog** — reuse the **6 existing notification categories** (`NotificationType`). E-2b does **not** add new
   notification events or emission points — it is about delivery configuration, the tag, and deep-links.
3. **Multi-role** — the mock is **single-active-role** (god-mode switcher); a true multi-role *user* model is
   E-4. E-2b's "dedup" is the existing one-item-per-event store; the **«для роли X» tag** shows the full set of
   roles configured to receive that category (per-user multi-role filtering of the tag is deferred to E-4).
4. **Reactivity** — a **`NotificationSettingsProvider`** above the AppShell (beside `NotificationsProvider`) holds
   the config so the editor, the center, and the bell all update live. (Rejected: ad-hoc localStorage reads per
   consumer — no reactivity, stale bell.)
5. **No-regression default** — `DEFAULT_ROLE_CONFIG` is the faithful inversion of today's audiences, so with
   defaults the app behaves exactly as after E-2; the admin can then extend per role.

## Feature design

### A. Config model + store — new `Promo/src/lib/notification-settings-store.ts`

- **Type:** `RoleNotificationConfig = Record<PromoRole, NotificationType[]>` (per role, the categories it receives).
- **`DEFAULT_ROLE_CONFIG`** — computed once from the current audiences so E-2b defaults == E-2 behavior:
  - `km-assignment` → **all 9 roles** (today `visibleTo: undefined` = everyone).
  - `campaign-cancelled` / `line-removed` / `data-changed` → the 7 `ADJ_DEPARTMENTS_AUDIENCE` roles
    (Сотрудник маркетинга, Директор маркетинга, Сотрудник закупа, Сотрудник аналитики, Коммерческий директор,
    Операционный директор, Администратор).
  - `marketing-reapproval` / `ad-approval` → the 4 `MARKETING_AUDIENCE` roles
    (Сотрудник маркетинга, Директор маркетинга, Коммерческий директор, Администратор).
  - Net per role: КМ = `[km-assignment]`; Старший КМ = `[km-assignment]`; Операционный директор / Сотрудник закупа
    / Сотрудник аналитики = `[campaign-cancelled, line-removed, data-changed, km-assignment]`; Коммерческий
    директор / Директор маркетинга / Сотрудник маркетинга / Администратор = all 6.
- **Persistence:** localStorage `promo:notification-role-config`; SSR-safe + defensive JSON (mirrors
  `report-ack-store.ts`). Helpers: `getRoleConfig(): RoleNotificationConfig` (falls back to
  `DEFAULT_ROLE_CONFIG`, merged so a newly-added role/type is never missing), `persistRoleConfig(cfg)`,
  `rolesForType(type, cfg): PromoRole[]` (roles whose set includes `type` — drives the «для роли X» tag).

### B. Visibility rework — `promo-mock-data.ts`

- **`notificationsForRole(role, list, config)`** gains the `config` argument and filters by it:
  Администратор still short-circuits to the full list (god-mode escape hatch — never filtered); every other role
  keeps `n` iff `config[role]?.includes(n.type)`. The per-notification `visibleTo` field is now **unused for
  filtering** (kept on the type for back-compat / seed provenance; the config is the source of truth).
- **`notificationLinksFor(n): { label: string; href: string; kind: "promo" | "approval" | "report" }[]`** —
  per-category deep-links, only when `n.campaignId` is set (else empty → the item shows no context links):
  - `data-changed` → Отчёт (`/reports?promo=<id>`) + Промо (`/full-calendar?promo=<id>`)
  - `campaign-cancelled` / `line-removed` / `marketing-reapproval` → Промо + Согласование (`/approvals?promo=<id>`)
  - `km-assignment` → Промо
  - `ad-approval` → Отчёт + Промо
  (`ROLE_LABEL_SHORT` / existing labels reused; hrefs are plain app paths — navigated via react-router.)

### C. Reactive provider — new `Promo/src/app/components/notification-settings/NotificationSettingsProvider.tsx`

- Mounted in `ProtectedLayout` **above** the AppShell, wrapping `NotificationsProvider`. Order between the two
  providers is immaterial — `NotificationsProvider` does **not** consume the config (it holds the raw,
  unfiltered notification list; filtering happens in the consumers §F) — but both MUST sit above the AppShell so
  `AppShell`, `NotificationsPage`, `NotificationItem`, and the admin screen can all call
  `useNotificationSettings()`. Holds `config` in `useState(() => getRoleConfig())`.
- Exposes `useNotificationSettings()` → `{ config, setRoleCategory(role, type, on), resetConfig() }`. Each mutation
  updates state **and** persists via `persistRoleConfig`. `resetConfig()` restores `DEFAULT_ROLE_CONFIG`.

### D. Admin screen — new `notification-settings/NotificationSettingsPage.tsx` (+ route/nav)

- **Route** `/notification-settings`, **role-gated to Администратор** (nav item + in-screen guard «Недостаточно
  прав», matching the `/permissions` / `/users` pattern).
- **Layout:** `PageHeader` («Настройки уведомлений») + a «Сбросить к умолчаниям» action; then **one block per
  role** (Card) — the role name + a row of the 6 categories, each a `Switch` labelled from
  `NOTIFICATION_TYPE_META[type].label` with its tint. Toggling calls `setRoleCategory` (live).
- The **Администратор** block renders its switches **disabled** with a note «Администратор всегда видит все
  уведомления» (reflects the god-mode short-circuit in §B).
- Mobile (Pattern K): blocks stack; each category toggle is a full-width row (44px targets).

### E. Notification item — `NotificationItem.tsx`

- **«для роли X» tag:** a compact chip row computed via `rolesForType(n.type, config)` (from
  `useNotificationSettings()`): «Роли: A, B +N» (first 2 short role labels + «+N» with a Tooltip listing all);
  if the current active role is in the set, that chip is brand-highlighted. Empty set → «Роли: —».
- **Deep-links:** replace the single generic link with the `notificationLinksFor(n)` set — up to 3
  `buttonVariants`-styled `<Link>`s («Открыть промо» / «Открыть согласование» / «Открыть отчёт»); keep the
  «Ознакомлен» action. When there are no links (no `campaignId`), show none.

### F. Consumers switch to the config

- `AppShell.tsx` and `NotificationsPage.tsx` call `notificationsForRole(currentRole, notifications, config)` with
  `config` from `useNotificationSettings()` — so toggling a category in the editor immediately changes the bell
  count/items and the page list.
- `ReportsPage.tsx` gains light **`?promo=` pre-select**: on mount (via `useSearchParams`), if `?promo=<id>`
  matches a sent campaign, select it in the existing campaign picker. The picker selection **is** the focus
  signal — no separate banner is required (unlike full-calendar/approvals, where the row must be highlighted in
  a long list). If `?promo=<id>` doesn't match a sent campaign, the picker keeps its default selection.

### Files

```
[C] Promo/src/lib/notification-settings-store.ts                              — role×category config + DEFAULT_ROLE_CONFIG + rolesForType
[C] Promo/src/app/components/notification-settings/NotificationSettingsProvider.tsx  — reactive config provider
[C] Promo/src/app/components/notification-settings/NotificationSettingsPage.tsx      — Админ per-role toggle blocks + reset
[M] Promo/src/lib/promo-mock-data.ts                                          — notificationsForRole(role,list,config); notificationLinksFor
[M] Promo/src/app/components/notifications/NotificationItem.tsx               — «для роли X» chips + deep-link buttons
[M] Promo/src/app/components/AppShell.tsx                                     — filter bell via config
[M] Promo/src/app/components/notifications/NotificationsPage.tsx              — filter list via config
[M] Promo/src/app/routes.tsx                                                  — mount NotificationSettingsProvider + /notification-settings route
[M] Promo/src/app/shell-config.tsx                                           — «Система»-group nav item (Админ-gated)
[M] Promo/src/app/components/reports/ReportsPage.tsx                          — ?promo= pre-select
```

No `@texnomart/shared` or Dashboard changes. `build:promo` + `build:dashboard` must stay green.

## Out of scope (YAGNI)

- New notification categories or emission points (the 6 E-2 categories + 5 emitters are unchanged).
- A true multi-role **user** model / per-user role-set filtering of the «для роли X» tag (that is E-4).
- Per-person targeting (mock has no per-person identity — config is role-level).
- Notification-type mute *preferences per end-user* (this is admin role-config, not personal preferences).
- Any change to the bell rendering in `@texnomart/shared` (the tag/links live in the Promo page item only).

## Mock limitations (to carry into CLAUDE.md / AI_CONTEXT)

- Role-config is **per-browser localStorage**, not a backend; «Сбросить к умолчаниям» restores the seed.
- Администратор always sees everything (god-mode escape hatch) regardless of config.
- The **«для роли X» tag** shows the full configured target set for the category — it is **not** filtered to a
  single user's held roles (no multi-role user model until E-4).
- Deep-links reuse `?promo=` focus; a notification without a `campaignId` shows no context links.
- Defaults reproduce E-2's exact visibility; any richer per-role set is something the admin turns on.

## Verification

- `corepack pnpm --filter promo build` + `corepack pnpm --filter dashboard build` both green.
- In-browser (`pnpm dev:promo`): as Администратор open `/notification-settings`, toggle a category **off** for a
  role → switch the god-mode role to that role → the bell count + `/notifications` list drop that category live;
  toggle back on → they return; «Сбросить к умолчаниям» restores; reload → the edited config persists.
- On `/notifications`, each item shows the «для роли X» chips (current role highlighted when included) and the
  correct deep-links; clicking «Открыть промо/согласование/отчёт» lands on the focused campaign (banner) on the
  target screen, incl. `/reports` pre-selecting the campaign.
