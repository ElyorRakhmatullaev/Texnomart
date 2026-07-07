# E-4 «Управление пользователями, ролями и временным замещением» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework Promo `/users` from the minimal #0+A account screen into a full **user / role / temporary-substitution** management module: employee model (подразделение / должность / руководитель / multi-role), «Администратор подразделения» tier, a temporary **«Уполномоченное лицо КД»** substitution wired **functionally** into the S3 approval flow (with a same-person conflict-of-interest guard), a per-user audit journal, a `/users/:id` detail page, and a real `.xlsx` export.

**Architecture:** Promo-local React (Vite + TS, Tailwind v4, shadcn via `@texnomart/ui`, patterns via `@texnomart/shared`). All data extensions are **additive/optional** on the existing localStorage `users-store` (every current export stays byte-compatible → `/profile`, auth, and the ≥2-admin guard don't regress). A new `kd-substitution-store` holds the zero-or-one active substitution; a pure `canActAsKd` / `isSubstituteConflicted` pair is consumed by the S3 detail page. The god-mode role switcher is untouched; admin **scope** and substitute **acting** derive from the logged-in `useCurrentUser()`.

**Tech Stack:** React 18 + TypeScript, Vite 6, Tailwind v4, shadcn/ui, lucide-react, react-router v7, date-fns (`ru` locale), SheetJS (`xlsx`, already a dep since E-1).

## Global Constraints

- **Promo-local only.** No edits to `@texnomart/shared`, `@texnomart/ui`, or `Dashboard/`. Verify `corepack pnpm --filter dashboard build` stays green at the end.
- **Additive / backward-compatible.** Every existing `users-store.ts` export keeps its signature and behavior. New `PromoUser` fields are **optional**. Existing readers of `user.role` keep working; new code reads `rolesOf(user)`. `/profile`, login (global-admin + temp-password user), and the ≥2-usable-admin guard MUST NOT regress.
- **God-mode switcher kept.** `role-context.tsx` is not changed. All existing S1–S8 gating (`currentRole`) is unaffected. Admin **scope** and substitute **acting** come from `useCurrentUser()`, never from the switcher.
- **Verification model:** no unit-test harness (`vite build` catches import/syntax/type-import errors; it does NOT typecheck app logic). Each task ends with a green `corepack pnpm --filter promo build` + the task's explicit in-browser checks via `corepack pnpm --filter promo dev`. Do NOT add a test framework.
- **pnpm via corepack:** `pnpm` is not on PATH — always `corepack pnpm …`. Promo build `corepack pnpm --filter promo build`; dev `corepack pnpm --filter promo dev`; Dashboard build `corepack pnpm --filter dashboard build`.
- **RU only.** All UI copy in Russian. Numbers `toLocaleString("ru-RU")` + `tabular-nums`. Dates via the existing `<RuDate>` primitive (`Promo/src/app/components/RuDate.tsx`).
- **Identity = seeds.** No real auth/identity backend. Passwords stay plain strings; temp password shown once on-screen. The representative-КМ mock (`kmId` links) is how per-person conflict is modeled.
- **Role labels (exact, from `PROMO_ROLES`):** `"Коммерческий директор"`, `"Операционный директор"`, `"Директор маркетинга"`, `"Категорийный менеджер (КМ)"`, `"Старший КМ"`, `"Сотрудник маркетинга"`, `"Сотрудник закупа"`, `"Сотрудник аналитики"`, `"Администратор"`. **КМ = `"Категорийный менеджер (КМ)"`.**
- **Dark mode:** every surface pairs a light class with a `dark:` variant (follow the existing `UsersTable.tsx` hybrid classes, e.g. `bg-white dark:bg-card`, `text-gray-900 dark:text-gray-100`, `border-gray-200 dark:border-border`).
- **Export = real `.xlsx`** via SheetJS — mirror `Promo/src/lib/report-xlsx.ts` + `exportStamp()` from `Promo/src/lib/promo-export.ts`.
- **Demo logins:** global admin `admin@texnomart.uz` / `Admin2026!` (u-2). Dept-admin + substitute demos use the seeded users defined in Tasks 1–2 (their passwords are set there).
- **Spec:** `docs/superpowers/specs/2026-07-07-promo-users-roles-substitution-design.md` is the source of truth.

---

## File Structure

| File | Responsibility |
|---|---|
| `Promo/src/lib/users-store.ts` | **Modify** — extend `PromoUser` (`roles?`, `department?`, `position?`, `managerId?`, `adminScope?`, `kmId?`); `DEPARTMENTS`; `rolesOf`; retarget `usableAdminCount`/`canRevokeAdmin`/`canDeactivate` to `rolesOf`; new mutators `updateUser`/`setUserRoles`/`setDeptAdmin`; scope helpers `effectiveAdminScope`/`canManageUser`; enrich seeds + add 2 users. |
| `Promo/src/lib/kd-substitution-store.ts` | **New** — `KdSubstitution` type + `getActiveSubstitution`/`getSubstitutionHistory`/`assignSubstitution`/`revokeSubstitution` + `canActAsKd`/`isSubstituteConflicted`; seeded active substitution. |
| `Promo/src/lib/promo-mock-data.ts` | **Modify** — `AuditEvent.targetUserId?`; add 3 `AuditActionType`s (`"изменение ролей"`, `"назначение замещения"`, `"снятие замещения"`) + their `AUDIT_ACTION_META` tints. |
| `Promo/src/lib/audit-store.ts` | **Modify** — nothing structural (already spreads `...rest`); confirm `targetUserId` flows through. |
| `Promo/src/lib/users-xlsx.ts` | **New** — `exportUsersXlsx(users)` mirroring `report-xlsx.ts`. |
| `Promo/src/lib/permissions.ts` | **Modify** — add 4 capabilities (global user-mgmt, dept user-mgmt, assign КД substitution, act as КД substitute). |
| `Promo/src/app/components/users/UsersFilters.tsx` | **New** — search / подразделение / роль / статус + `applyUserFilters` / `EMPTY_USER_FILTERS` / `countActiveUserFilters`. |
| `Promo/src/app/components/users/UserFormDialog.tsx` | **New** — create+edit dialog (multi-role, dept, position, manager, admin scope). Replaces `CreateUserDialog.tsx`. |
| `Promo/src/app/components/users/CreateUserDialog.tsx` | **Delete** — superseded by `UserFormDialog` (in Task 6). |
| `Promo/src/app/components/users/UsersTable.tsx` | **Modify** — new columns (Роли chips, Подразделение, Должность, Руководитель), «Открыть» row action, dept-admin scoping, mobile cards. |
| `Promo/src/app/components/users/UsersPage.tsx` | **Modify** — effective admin scope from `useCurrentUser()`; filters; export; substitution panel host; edit dialog; dept-admin notice. |
| `Promo/src/app/components/users/UserDetailPage.tsx` | **New** — `/users/:id` Pattern-D page with 3 tabs (Профиль / Роли и доступ / Журнал действий). |
| `Promo/src/app/components/users/KdSubstitutionPanel.tsx` | **New** — active substitution + assign/revoke + history. |
| `Promo/src/app/routes.tsx` | **Modify** — add `{ path: "users/:id", Component: UserDetailPage }`. |
| `Promo/src/app/components/approvals/ApprovalDetailPage.tsx` | **Modify** — substitute acting predicate + `actingAsRole` + banners. |
| `Promo/src/app/components/approvals/ReviewActionsPanel.tsx` | **Modify** — conflict-of-interest note + substitute indicator. |
| `Promo/src/app/components/approvals/ApprovalsPage.tsx` | **Modify** — an active substitute sees the КД review queue. |

---

## PHASE 1 — Data layer (stores + types); zero UI regressions

## Task 1: Extend `users-store.ts` (employee model, multi-role, scope helpers, seeds)

**Files:**
- Modify: `Promo/src/lib/users-store.ts`

**Interfaces:**
- Consumes: `PromoRole` from `../app/role-context`.
- Produces:
  - `PromoUser` gains optional `roles?: PromoRole[]`, `department?: string`, `position?: string`, `managerId?: string`, `adminScope?: AdminScope`, `kmId?: string`.
  - `export type AdminScope = { kind: "department"; department: string };`
  - `export const DEPARTMENTS: string[]`
  - `export function rolesOf(user: PromoUser): PromoRole[]`
  - `export function updateUser(id: string, patch: Partial<Pick<PromoUser,"fullName"|"email"|"department"|"position"|"managerId">>): void`
  - `export function setUserRoles(id: string, roles: PromoRole[]): void`
  - `export function setDeptAdmin(id: string, department: string | null): void`
  - `export function effectiveAdminScope(user: PromoUser | null): "global" | AdminScope | null`
  - `export function canManageUser(actor: PromoUser | null, target: PromoUser): boolean`

- [ ] **Step 1: Extend the `PromoUser` interface + add `AdminScope` + `DEPARTMENTS`.** After the `UserStatus` type, add `AdminScope`; extend `PromoUser`; after the interface add `DEPARTMENTS`:

```ts
export type AdminScope = { kind: "department"; department: string };

export interface PromoUser {
  id: string;
  fullName: string;
  email: string;
  /** Primary/display role — every existing screen reads this. `roles` is the full set. */
  role: PromoRole;
  /** Multi-role set (E-4). Always includes `role` as roles[0]. Optional for backward-compat. */
  roles?: PromoRole[];
  status: UserStatus;
  /** Mock: простая строка, НЕ настоящий хэш (прототип, без бэкенда). */
  password: string;
  mustChangePassword: boolean;
  createdAt: string;
  lastPasswordChangeAt?: string;
  /** Подразделение (E-4). */
  department?: string;
  /** Должность (E-4). */
  position?: string;
  /** Руководитель — ссылка на другого PromoUser.id (E-4). */
  managerId?: string;
  /** «Администратор подразделения» — доступ ограничен своим подразделением (E-4). */
  adminScope?: AdminScope;
  /** Связь с CATEGORY_MANAGERS.id — для конфликта интересов при замещении КД (E-4). */
  kmId?: string;
}

/** Подразделения (E-4). */
export const DEPARTMENTS: string[] = [
  "Коммерческий департамент",
  "Маркетинг",
  "Закуп",
  "Аналитика",
  "Категорийный менеджмент",
  "ИТ / Администрирование",
];
```

- [ ] **Step 2: Add `rolesOf` (backward-compat reader).** After `DEPARTMENTS`:

```ts
/** Полный набор ролей пользователя (E-4). Читайте роли ТОЛЬКО через этот хелпер. */
export function rolesOf(user: PromoUser): PromoRole[] {
  return user.roles && user.roles.length > 0 ? user.roles : [user.role];
}
```

- [ ] **Step 3: Enrich the 7 existing seeds + add 2 users.** Replace the whole `SEED_USERS` array with (adds department/position/managerId/roles; links КМ users to `kmId`; adds `u-8` Тошматов Фаррух → `km-5` for the substitution-conflict demo and `u-6` becomes «Администратор подразделения» Маркетинг):

```ts
const SEED_USERS: PromoUser[] = [
  { id: "u-1", fullName: "Сардор Мавлянов", email: "sardor@texnomart.uz", role: "Коммерческий директор", roles: ["Коммерческий директор"], status: "active", password: "Director2026!", mustChangePassword: false, createdAt: "2026-01-10T09:00:00.000Z", department: "Коммерческий департамент", position: "Коммерческий директор" },
  { id: "u-2", fullName: "Администратор Системы", email: "admin@texnomart.uz", role: "Администратор", roles: ["Администратор"], status: "active", password: "Admin2026!", mustChangePassword: false, createdAt: "2026-01-10T09:00:00.000Z", department: "ИТ / Администрирование", position: "Системный администратор" },
  { id: "u-3", fullName: "Резервный Администратор", email: "reserv@texnomart.uz", role: "Администратор", roles: ["Администратор"], status: "active", password: "Backup2026!", mustChangePassword: false, createdAt: "2026-01-10T09:00:00.000Z", department: "ИТ / Администрирование", position: "Системный администратор" },
  { id: "u-4", fullName: "Каримов Шохрух", email: "karimov@texnomart.uz", role: "Категорийный менеджер (КМ)", roles: ["Категорийный менеджер (КМ)"], status: "active", password: "Manager2026!", mustChangePassword: false, createdAt: "2026-02-02T09:00:00.000Z", department: "Категорийный менеджмент", position: "Категорийный менеджер", managerId: "u-5", kmId: "km-3" },
  { id: "u-5", fullName: "Исмаилов Жасур", email: "ismailov@texnomart.uz", role: "Старший КМ", roles: ["Старший КМ", "Категорийный менеджер (КМ)"], status: "active", password: "Senior2026!", mustChangePassword: false, createdAt: "2026-02-02T09:00:00.000Z", department: "Категорийный менеджмент", position: "Старший категорийный менеджер", managerId: "u-1", kmId: "km-6" },
  { id: "u-6", fullName: "Алиева Нигора", email: "alieva@texnomart.uz", role: "Сотрудник маркетинга", roles: ["Сотрудник маркетинга"], status: "active", password: "Market2026!", mustChangePassword: false, createdAt: "2026-03-15T09:00:00.000Z", department: "Маркетинг", position: "Маркетолог", managerId: "u-1", adminScope: { kind: "department", department: "Маркетинг" } },
  { id: "u-7", fullName: "Новый Сотрудник", email: "newuser@texnomart.uz", role: "Сотрудник закупа", roles: ["Сотрудник закупа"], status: "temp-password", password: "Temp1234!a", mustChangePassword: true, createdAt: "2026-06-20T09:00:00.000Z", department: "Закуп", position: "Специалист по закупкам", managerId: "u-1" },
  { id: "u-8", fullName: "Тошматов Фаррух", email: "toshmatov@texnomart.uz", role: "Категорийный менеджер (КМ)", roles: ["Категорийный менеджер (КМ)"], status: "active", password: "Manager2026!", mustChangePassword: false, createdAt: "2026-02-10T09:00:00.000Z", department: "Категорийный менеджмент", position: "Категорийный менеджер", managerId: "u-5", kmId: "km-5" },
];
```

- [ ] **Step 4: Retarget the admin-pool guard to `rolesOf`.** Replace `usableAdminCount` + `canRevokeAdmin` (the `after` map must clear ALL roles, not just `role`):

```ts
/** Администраторы, способные войти (роль «Администратор» в наборе ролей и не заблокированы). */
export function usableAdminCount(users: PromoUser[] = read()): number {
  return users.filter((u) => rolesOf(u).includes("Администратор") && u.status !== "blocked").length;
}

/** Можно ли отозвать у пользователя права администратора, не уронив пул < 2. */
export function canRevokeAdmin(id: string): boolean {
  const users = read();
  const target = users.find((u) => u.id === id);
  if (!target || !rolesOf(target).includes("Администратор")) return false;
  const after = users.map((u) =>
    u.id === id
      ? { ...u, role: "Сотрудник закупа" as PromoRole, roles: ["Сотрудник закупа" as PromoRole] }
      : u
  );
  return usableAdminCount(after) >= 2;
}
```

(`canDeactivate` already simulates `status:"blocked"` and calls `usableAdminCount`, which now reads `rolesOf` — leave it unchanged.)

- [ ] **Step 5: Keep the legacy `setUserRole` but add `setUserRoles`.** `setUserRole` (used by the existing row menu «назначить/отозвать admin») stays. After it add:

```ts
/** Multi-role edit (E-4) — roles[0] becomes the primary `role`. */
export function setUserRoles(id: string, roles: PromoRole[]): void {
  const next = roles.length > 0 ? roles : (["Сотрудник закупа"] as PromoRole[]);
  write(read().map((u) => (u.id === id ? { ...u, role: next[0], roles: next } : u)));
}

/** Grant/clear «Администратор подразделения» (E-4). */
export function setDeptAdmin(id: string, department: string | null): void {
  write(
    read().map((u) =>
      u.id === id
        ? { ...u, adminScope: department ? { kind: "department" as const, department } : undefined }
        : u
    )
  );
}

/** Edit employee fields (E-4). */
export function updateUser(
  id: string,
  patch: Partial<Pick<PromoUser, "fullName" | "email" | "department" | "position" | "managerId">>
): void {
  write(
    read().map((u) =>
      u.id === id
        ? {
            ...u,
            ...patch,
            ...(patch.fullName !== undefined ? { fullName: patch.fullName.trim() } : {}),
            ...(patch.email !== undefined ? { email: patch.email.trim() } : {}),
          }
        : u
    )
  );
}
```

- [ ] **Step 6: Add the scope helpers.** After the guards:

```ts
/** Эффективный административный доступ пользователя (E-4). */
export function effectiveAdminScope(user: PromoUser | null): "global" | AdminScope | null {
  if (!user) return null;
  if (rolesOf(user).includes("Администратор")) return "global";
  if (user.adminScope) return user.adminScope;
  return null;
}

/** Может ли `actor` управлять учёткой `target` (глобальный — всеми; админ подразделения — своим). */
export function canManageUser(actor: PromoUser | null, target: PromoUser): boolean {
  const scope = effectiveAdminScope(actor);
  if (scope === "global") return true;
  if (scope && scope.kind === "department") return target.department === scope.department;
  return false;
}
```

- [ ] **Step 7: Also extend `NewUserInput`** so create can carry the new fields:

```ts
export interface NewUserInput {
  fullName: string;
  email: string;
  role: PromoRole;
  roles?: PromoRole[];
  department?: string;
  position?: string;
  managerId?: string;
}
```

And in `createUser`, persist them (keep the temp-password behavior):

```ts
  const user: PromoUser = {
    id: `u-${Date.now()}`,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    role: input.role,
    roles: input.roles && input.roles.length > 0 ? input.roles : [input.role],
    status: "temp-password",
    password: tempPassword,
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
    department: input.department,
    position: input.position,
    managerId: input.managerId,
  };
```

- [ ] **Step 8: Build.** Run: `corepack pnpm --filter promo build` — Expected: exit 0, no import/type errors.

- [ ] **Step 9: Commit.**

```bash
git add Promo/src/lib/users-store.ts
git commit -m "feat(promo): E-4 users-store — employee model, multi-role, scope helpers, seeds"
```

---

## Task 2: New `kd-substitution-store.ts` (substitution store + acting/conflict helpers)

**Files:**
- Create: `Promo/src/lib/kd-substitution-store.ts`

**Interfaces:**
- Consumes: `getUsers`/`getUserById`/`rolesOf`/`PromoUser` from `./users-store`; `ReviewItem` from `./promo-mock-data`.
- Produces:
  - `export interface KdSubstitution { id; substituteUserId; from; to; reason; assignedBy; assignedAt; revokedAt? }` (all strings; dates ISO).
  - `export function getActiveSubstitution(ref?: Date): KdSubstitution | null`
  - `export function getSubstitutionHistory(): KdSubstitution[]` (newest-first)
  - `export function assignSubstitution(input: { substituteUserId; from; to; reason; assignedBy }): KdSubstitution`
  - `export function revokeSubstitution(id: string): void`
  - `export function canActAsKd(user: PromoUser | null, ref?: Date): boolean`
  - `export function isSubstituteConflicted(user: PromoUser | null, item: Pick<ReviewItem,"kmId">, ref?: Date): boolean`

- [ ] **Step 1: Write the store.** Create the file:

```ts
import { getUsers, rolesOf, type PromoUser } from "./users-store";
import type { ReviewItem } from "./promo-mock-data";

const STORAGE_KEY = "promo:kd-substitution";

/** Временное «Уполномоченное лицо КД» (E-4). Активна ноль или одна на момент времени. */
export interface KdSubstitution {
  id: string;
  substituteUserId: string;
  /** ISO-даты окна (включительно). */
  from: string;
  to: string;
  reason: string;
  /** ФИО назначившего. */
  assignedBy: string;
  assignedAt: string;
  revokedAt?: string;
}

// Seed: активное замещение, покрывающее «сегодня», на Тошматова Фарруха (u-8, km-5)
// — он владеет промо на этапе КД (конфликт интересов демонстрируется), а PR-2026-001
// (km-2/km-3) он согласовать может (happy-path). Даты — широкое окно вокруг демо-даты.
const SEED: KdSubstitution[] = [
  {
    id: "sub-1",
    substituteUserId: "u-8",
    from: "2026-06-15",
    to: "2026-12-31",
    reason: "Отпуск коммерческого директора.",
    assignedBy: "Администратор Системы",
    assignedAt: "2026-06-14T10:00:00.000Z",
  },
];

function read(): KdSubstitution[] {
  if (typeof window === "undefined") return [...SEED];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
    return [...SEED];
  }
  try {
    return JSON.parse(raw) as KdSubstitution[];
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
    return [...SEED];
  }
}

function write(list: KdSubstitution[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Локальная полночь из ISO-строки «YYYY-MM-DD» (без UTC-сдвига). */
function localMidnight(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).getTime();
}

/** Активное замещение, чьё окно [from,to] покрывает ref и которое не отозвано. */
export function getActiveSubstitution(ref: Date = new Date()): KdSubstitution | null {
  const day = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
  return (
    read().find(
      (s) => !s.revokedAt && localMidnight(s.from) <= day && day <= localMidnight(s.to)
    ) ?? null
  );
}

export function getSubstitutionHistory(): KdSubstitution[] {
  return [...read()].sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
}

export function assignSubstitution(input: {
  substituteUserId: string;
  from: string;
  to: string;
  reason: string;
  assignedBy: string;
}): KdSubstitution {
  const list = read();
  // Одно активное окно: закрываем текущее активное, если пересекается.
  const now = new Date();
  const active = list.find(
    (s) => !s.revokedAt && localMidnight(s.from) <= now.getTime() && now.getTime() <= localMidnight(s.to)
  );
  const next = list.map((s) =>
    active && s.id === active.id ? { ...s, revokedAt: now.toISOString() } : s
  );
  const created: KdSubstitution = {
    id: `sub-${Date.now()}`,
    substituteUserId: input.substituteUserId,
    from: input.from,
    to: input.to,
    reason: input.reason.trim(),
    assignedBy: input.assignedBy,
    assignedAt: now.toISOString(),
  };
  write([...next, created]);
  return created;
}

export function revokeSubstitution(id: string): void {
  write(read().map((s) => (s.id === id ? { ...s, revokedAt: new Date().toISOString() } : s)));
}

/** Может ли пользователь действовать как КД: он КД по роли ИЛИ активный заместитель. */
export function canActAsKd(user: PromoUser | null, ref: Date = new Date()): boolean {
  if (!user) return false;
  if (rolesOf(user).includes("Коммерческий директор")) return true;
  const active = getActiveSubstitution(ref);
  return !!active && active.substituteUserId === user.id;
}

/** Конфликт интересов: активный заместитель — тот же КМ, чья заявка на согласовании. */
export function isSubstituteConflicted(
  user: PromoUser | null,
  item: Pick<ReviewItem, "kmId">,
  ref: Date = new Date()
): boolean {
  if (!user || !user.kmId) return false;
  const active = getActiveSubstitution(ref);
  if (!active || active.substituteUserId !== user.id) return false;
  return user.kmId === item.kmId;
}

/** ФИО заместителя для баннеров. */
export function substituteName(sub: KdSubstitution | null): string {
  if (!sub) return "—";
  return getUsers().find((u) => u.id === sub.substituteUserId)?.fullName ?? "—";
}
```

- [ ] **Step 2: Build.** Run: `corepack pnpm --filter promo build` — Expected: exit 0.

- [ ] **Step 3: Commit.**

```bash
git add Promo/src/lib/kd-substitution-store.ts
git commit -m "feat(promo): E-4 kd-substitution store — active window, canActAsKd, conflict guard"
```

---

## Task 3: Audit types — `targetUserId` + new action types

**Files:**
- Modify: `Promo/src/lib/promo-mock-data.ts` (`AuditActionType` ~line 3517; `AUDIT_ACTION_META` ~line 3538; `AuditEvent` ~line 3568)

**Interfaces:**
- Produces: `AuditActionType` gains `"изменение ролей"` | `"назначение замещения"` | `"снятие замещения"`; `AuditEvent` gains optional `targetUserId?: string`.

- [ ] **Step 1: Add the 3 action types.** In the `AuditActionType` union (ends `| "изменение профиля";`), append before the semicolon terminator:

```ts
  | "изменение профиля"
  | "изменение ролей"
  | "назначение замещения"
  | "снятие замещения";
```

- [ ] **Step 2: Add their tints to `AUDIT_ACTION_META`.** After the `"изменение профиля"` entry add:

```ts
  "изменение ролей": { bg: "bg-purple-50 dark:bg-purple-500/15", text: "text-purple-700 dark:text-purple-300" },
  "назначение замещения": { bg: "bg-fuchsia-50 dark:bg-fuchsia-500/15", text: "text-fuchsia-700 dark:text-fuchsia-300" },
  "снятие замещения": { bg: "bg-stone-100 dark:bg-stone-500/20", text: "text-stone-700 dark:text-stone-300" },
```

- [ ] **Step 3: Add `targetUserId` to `AuditEvent`.** In the interface, after `comment?: string;`:

```ts
  /** Для журнала конкретного пользователя (E-4) — id затронутой учётки. */
  targetUserId?: string;
```

- [ ] **Step 4: Build.** `corepack pnpm --filter promo build` — Expected: exit 0. (`audit-store.ts` spreads `...rest`, so `targetUserId` already flows through `appendAuditEvent` and `getLiveAuditEvents` — no change needed there. Confirm by inspection.)

- [ ] **Step 5: Commit.**

```bash
git add Promo/src/lib/promo-mock-data.ts
git commit -m "feat(promo): E-4 audit — targetUserId + role/substitution action types"
```

---

## PHASE 2 — `/users` management surface

## Task 4: `.xlsx` export helper

**Files:**
- Create: `Promo/src/lib/users-xlsx.ts`

**Interfaces:**
- Consumes: `PromoUser`/`rolesOf` from `./users-store`; `exportStamp` from `./promo-export`.
- Produces: `export function exportUsersXlsx(users: PromoUser[]): void`

- [ ] **Step 1: Write it** (mirror `report-xlsx.ts`):

```ts
import * as XLSX from "xlsx";
import { rolesOf, type PromoUser } from "./users-store";
import { exportStamp } from "./promo-export";

const STATUS_RU: Record<PromoUser["status"], string> = {
  active: "Активен",
  "temp-password": "Временный пароль",
  blocked: "Заблокирован",
};

/** Реальный .xlsx текущего (отфильтрованного) списка пользователей. */
export function exportUsersXlsx(users: PromoUser[]): void {
  const byId = new Map(users.map((u) => [u.id, u.fullName] as const));
  const header = ["ФИО", "Email", "Роли", "Подразделение", "Должность", "Руководитель", "Статус", "Создан"];
  const rows = users.map((u) => [
    u.fullName,
    u.email,
    rolesOf(u).join(", "),
    u.department ?? "—",
    u.position ?? "—",
    u.managerId ? byId.get(u.managerId) ?? "—" : "—",
    STATUS_RU[u.status],
    new Date(u.createdAt).toLocaleDateString("ru-RU"),
  ]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Пользователи");
  XLSX.writeFile(wb, `Пользователи_${exportStamp()}.xlsx`);
}
```

- [ ] **Step 2: Build.** `corepack pnpm --filter promo build` — Expected: exit 0.

- [ ] **Step 3: Commit.**

```bash
git add Promo/src/lib/users-xlsx.ts
git commit -m "feat(promo): E-4 users .xlsx export (SheetJS)"
```

---

## Task 5: `UsersFilters.tsx` (search / подразделение / роль / статус)

**Files:**
- Create: `Promo/src/app/components/users/UsersFilters.tsx`

**Interfaces:**
- Produces:
  - `export interface UserFilterState { search: string; department: string | null; role: PromoRole | null; status: PromoUser["status"] | null }`
  - `export const EMPTY_USER_FILTERS: UserFilterState`
  - `export function applyUserFilters(users: PromoUser[], f: UserFilterState): PromoUser[]`
  - `export function countActiveUserFilters(f: UserFilterState): number`
  - `export function UsersFilters({ value, onChange }: { value: UserFilterState; onChange: (f: UserFilterState) => void }): JSX.Element`

- [ ] **Step 1: Write the pure logic + the FilterBar UI.** Use the shared `FilterBar` (`@texnomart/shared/components/filter-bar`) if the sibling screens do, else a `flex flex-wrap gap-2` of `Select`s + a search `Input`, matching `ReportFilters.tsx` / `CalendarFilters.tsx` styling. `applyUserFilters` = search over `fullName`+`email` (case-insensitive), `department` exact, `role` = `rolesOf(u).includes(role)`, `status` exact. `countActiveUserFilters` counts non-empty facets (search trimmed non-empty = 1). Roles list = `PROMO_ROLES`; departments = `DEPARTMENTS`; statuses = the 3 with RU labels («Активен»/«Временный пароль»/«Заблокирован»). Every surface pairs `dark:` variants.

```ts
import { PROMO_ROLES, type PromoRole } from "../../role-context";
import { DEPARTMENTS, type PromoUser } from "../../../lib/users-store";

export interface UserFilterState {
  search: string;
  department: string | null;
  role: PromoRole | null;
  status: PromoUser["status"] | null;
}
export const EMPTY_USER_FILTERS: UserFilterState = { search: "", department: null, role: null, status: null };

export function applyUserFilters(users: PromoUser[], f: UserFilterState): PromoUser[] {
  const q = f.search.trim().toLowerCase();
  return users.filter((u) => {
    if (q && !(`${u.fullName} ${u.email}`.toLowerCase().includes(q))) return false;
    if (f.department && u.department !== f.department) return false;
    if (f.role && !rolesOfSafe(u).includes(f.role)) return false;
    if (f.status && u.status !== f.status) return false;
    return true;
  });
}
function rolesOfSafe(u: PromoUser): PromoRole[] {
  return u.roles && u.roles.length > 0 ? u.roles : [u.role];
}
export function countActiveUserFilters(f: UserFilterState): number {
  return [f.search.trim().length > 0, !!f.department, !!f.role, !!f.status].filter(Boolean).length;
}
```

(Import `rolesOf` from the store instead of the local `rolesOfSafe` if you prefer — either is fine; keep one.) Then a `UsersFilters` component rendering a search `Input` + three `Select`s (each with an «Все …» reset option → maps to `null`) + a «Сбросить» ghost button shown when `countActiveUserFilters > 0`.

- [ ] **Step 2: Build.** `corepack pnpm --filter promo build` — Expected: exit 0.

- [ ] **Step 3: Commit.**

```bash
git add Promo/src/app/components/users/UsersFilters.tsx
git commit -m "feat(promo): E-4 UsersFilters — search/department/role/status"
```

---

## Task 6: `UserFormDialog.tsx` (create + edit) — replaces `CreateUserDialog`

**Files:**
- Create: `Promo/src/app/components/users/UserFormDialog.tsx`
- Delete: `Promo/src/app/components/users/CreateUserDialog.tsx`

**Interfaces:**
- Consumes: `NewUserInput`/`PromoUser`/`DEPARTMENTS`/`rolesOf` from `../../../lib/users-store`; `PROMO_ROLES`/`PromoRole`.
- Produces:
  - `export interface UserFormValue { fullName; email; roles: PromoRole[]; department?: string; position?: string; managerId?: string }`
  - `export function UserFormDialog({ open, onOpenChange, mode, initial, allUsers, onSubmit }): JSX.Element` where `mode: "create" | "edit"`, `initial?: PromoUser`, `allUsers: PromoUser[]` (for the руководитель select), `onSubmit: (value: UserFormValue) => void`.

- [ ] **Step 1: Write the dialog.** Pattern E (`Dialog` `sm:max-w-lg`), mirroring the current `CreateUserDialog` but with:
  - ФИО `Input`, Email `Input` (email regex validation as today).
  - **Роли** — a multi-select of `PROMO_ROLES` rendered as toggle chips (native `<button>` + `buttonVariants` per the Radix-asChild ref lesson if inside a Popover; simplest is an inline `flex flex-wrap gap-2` of chip buttons toggling membership). At least 1 role required; `roles[0]` is the primary.
  - Подразделение `Select` (`DEPARTMENTS`), Должность `Input`, Руководитель `Select` (options = `allUsers` excluding the edited user; plus a «— без руководителя —» → undefined).
  - Create mode → title «Новый пользователь», submit «Создать»; Edit mode → «Редактировать пользователя», submit «Сохранить», fields seeded from `initial` (roles from `rolesOf(initial)`).
  - `onSubmit(value)`; parent decides create vs update. Validation gate: name ≥ 2, valid email, ≥ 1 role.
  - Reset fields on `open` (create) / on `initial` change (edit) via `useEffect`.

- [ ] **Step 2: Delete `CreateUserDialog.tsx`** and grep for any remaining import: `Grep "CreateUserDialog"` over `Promo/src` — expect only `UsersPage.tsx` (fixed in Task 8). Remove the file.

- [ ] **Step 3: Build.** `corepack pnpm --filter promo build` — Expected: exit 0 (Task 8 rewires `UsersPage`; if building before Task 8, temporarily keep `CreateUserDialog` import compiling — but since Tasks 6→8 run in sequence under one reviewer, prefer to do the `UsersPage` import swap minimally here to keep the build green, or land Tasks 6–8 as one reviewable unit). **Note for the implementer:** if this task is reviewed independently, update `UsersPage.tsx`'s import + `<CreateUserDialog>` usage to `<UserFormDialog mode="create" …>` in this task so the build stays green.

- [ ] **Step 4: Commit.**

```bash
git add Promo/src/app/components/users/UserFormDialog.tsx
git rm Promo/src/app/components/users/CreateUserDialog.tsx
git commit -m "feat(promo): E-4 UserFormDialog (create+edit, multi-role, dept/position/manager)"
```

---

## Task 7: `UsersTable.tsx` rework (columns, scoping, «Открыть»)

**Files:**
- Modify: `Promo/src/app/components/users/UsersTable.tsx`

**Interfaces:**
- Consumes: `PromoUser`/`rolesOf` from the store.
- Produces: extended `UserRowAction` = `"reset" | "toggle-admin" | "toggle-status" | "open"`; `UsersTableProps` gains `allUsers: PromoUser[]` (to resolve manager names) + `canManage: (u: PromoUser) => boolean` (dept-admin scoping — hides the row menu / actions for users out of scope).

- [ ] **Step 1: Add the new columns.** Desktop table headers become ФИО · Email · **Роли** · Подразделение · Должность · Руководитель · Статус · Создан · (menu). Роли renders `rolesOf(u)` as small chips (`inline-flex flex-wrap gap-1`, each a `Badge variant="outline"`). Руководитель resolves `allUsers.find(a => a.id === u.managerId)?.fullName ?? "—"`. Keep the existing status chip + `formatDate`. Mobile cards add Подразделение + a roles chip row.
- [ ] **Step 2: Add «Открыть» to `RowMenu`** (a `DropdownMenuItem` with an `ExternalLink`/`Eye` icon → `onAction("open", user)`), placed first. Keep reset/toggle-admin/toggle-status.
- [ ] **Step 3: Scope by `canManage`.** When `!canManage(u)`, render the row **without** the `RowMenu` (or a disabled «Открыть»-only menu) so a dept-admin can't act on out-of-scope users. (The list itself is pre-filtered in `UsersPage`; `canManage` is a belt-and-suspenders on the actions.)
- [ ] **Step 4: Build.** `corepack pnpm --filter promo build` — Expected: exit 0.
- [ ] **Step 5: Commit.**

```bash
git add Promo/src/app/components/users/UsersTable.tsx
git commit -m "feat(promo): E-4 UsersTable — roles/dept/position/manager columns + open + scoping"
```

---

## Task 8: `UsersPage.tsx` rework (scope, filters, export, dialogs, notice)

**Files:**
- Modify: `Promo/src/app/components/users/UsersPage.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1/4/5/6/7 + `useCurrentUser`, `effectiveAdminScope`, `canManageUser`, `updateUser`, `setUserRoles`, `exportUsersXlsx`, `KdSubstitutionPanel` (Task 10 hosts here — leave a placeholder slot if Task 10 lands later, but prefer Task 10 before this task's final review).

- [ ] **Step 1: Compute the effective admin scope.** Replace the god-mode-only guard:

```ts
const { currentUser } = useCurrentUser();
const scope = effectiveAdminScope(currentUser) ?? (currentRole === "Администратор" ? "global" : null);
// scope: "global" | { kind:"department"; department } | null
```

Access-denied when `scope === null` (reuse the existing `ShieldAlert` empty state, copy: «Доступ только для администраторов»).

- [ ] **Step 2: Scope the list.** `const scoped = scope === "global" ? users : users.filter(u => u.department === scope.department);` Then apply `UsersFilters` over `scoped`. `canManage = (u) => canManageUser(currentUser ?? adminSurrogate, u)` — when `scope === "global"` via god-mode with `currentUser === null`, treat as global (return `true`).
- [ ] **Step 3: Header actions.** «Создать пользователя» (only when `scope === "global"` OR a dept-admin — dept-admins create within their dept, department pre-filled + locked in the dialog) + a self-rendered «Экспорт» button → `exportUsersXlsx(filtered)`. Add the «Фильтры»/filter bar (`UsersFilters`) below the header + a «Показано: N» count.
- [ ] **Step 4: Dept-admin notice.** When `scope !== "global"`, render an info `Alert`/banner: «Вы — администратор подразделения “{department}”: управление ограничено вашим подразделением.»
- [ ] **Step 5: Wire dialogs.** Replace `CreateUserDialog` with `UserFormDialog` (create + edit modes). Edit opens from `onAction("open", …)`? No — «Открыть» navigates to `/users/:id` (Task 9). Add a separate edit path: the detail page hosts «Редактировать». For the list, keep create here; row actions reset/toggle stay as today but call the audit with `targetUserId: user.id`.
- [ ] **Step 6: Host the substitution panel** (Task 10): render `<KdSubstitutionPanel />` above the table, only when `scope === "global"` OR god-mode «Коммерческий директор».
- [ ] **Step 7: Audit with `targetUserId`.** Every `audit(...)` call adds `targetUserId: target.id`. New role-edit action → `audit("изменение ролей", …)`.
- [ ] **Step 8: Build + in-browser.** `corepack pnpm --filter promo build`; then `corepack pnpm --filter promo dev` and, logged in as `admin@texnomart.uz`/`Admin2026!`: confirm the list shows the new columns + filters + «Показано: N» + «Экспорт» downloads an `.xlsx`; create a user (temp password shows once). Then log out, log in as `alieva@texnomart.uz`/`Market2026!`, navigate directly to `/users`: confirm only Маркетинг users show + the dept-admin notice + no substitution panel + no global-admin actions.
- [ ] **Step 9: Commit.**

```bash
git add Promo/src/app/components/users/UsersPage.tsx
git commit -m "feat(promo): E-4 UsersPage — scope by logged-in user, filters, export, edit, notice"
```

---

## PHASE 3 — `/users/:id` detail + substitution panel

## Task 9: `UserDetailPage.tsx` (`/users/:id`, 3 tabs) + route

**Files:**
- Create: `Promo/src/app/components/users/UserDetailPage.tsx`
- Modify: `Promo/src/app/routes.tsx` (add `{ path: "users/:id", Component: UserDetailPage }` inside the `/` children, after the `users` entry; import at top)

**Interfaces:**
- Consumes: `useParams`; `getUserById`/`rolesOf`/`updateUser`/`setUserRoles`/`setDeptAdmin`/`effectiveAdminScope`/`canManageUser`; `buildAuditLog` from `promo-mock-data`; `UserFormDialog`.

- [ ] **Step 1: Build the page.** Pattern D: `DetailPageHero` (`@texnomart/shared/components/detail-page-hero`) with `backHref="/users"`, title = ФИО, subtitle = primary role + status badge. Below, Pattern-J underline `Tabs` (reuse the class override from `.claude/rules` / existing detail pages — `TabsList` `bg-transparent border-b … h-12`, `TabsTrigger` `data-[state=active]:border-[#FFD60A]`):
  - **Профиль** — `InfoRow`s (`@texnomart/shared/components/info-row`): Email · Подразделение · Должность · Руководитель (name) · Создан · Последняя смена пароля. A «Редактировать» button (guarded by `canManageUser(currentUser, user)`) → `UserFormDialog mode="edit"`.
  - **Роли и доступ** — role chips (`rolesOf`), primary-role marker, admin scope (Глобальный / Подразделение “X” / —). Guarded actions: edit roles (opens a small roles multi-select or reuses the form), grant/clear dept-admin (global admin only), reset password / block-unblock (reuse the store mutators + ≥2 guard + audit with `targetUserId`).
  - **Журнал действий** — `buildAuditLog().filter(e => e.targetUserId === user.id)` rendered newest-first as a compact list (date+time via `<RuDate withTime>`, action chip via `AUDIT_ACTION_META`, comment). Empty state when none.
- [ ] **Step 2: Guard + not-found.** If `getUserById(id)` is undefined → a «Пользователь не найден» empty state + back link. If the viewer has no admin scope over this user (`!canManageUser` and not global) → read-only (hide edit actions) but still show Профиль/Журнал.
- [ ] **Step 3: Register the route** in `routes.tsx`.
- [ ] **Step 4: Build + in-browser.** `corepack pnpm --filter promo build`; dev, log in as admin, `/users` → «Открыть» a user → all 3 tabs render; edit ФИО → persists + a «изменение профиля» entry appears in the Журнал tab and in `/audit`.
- [ ] **Step 5: Commit.**

```bash
git add Promo/src/app/components/users/UserDetailPage.tsx Promo/src/app/routes.tsx
git commit -m "feat(promo): E-4 /users/:id detail page (Профиль/Роли и доступ/Журнал)"
```

---

## Task 10: `KdSubstitutionPanel.tsx` (assign / revoke / history)

**Files:**
- Create: `Promo/src/app/components/users/KdSubstitutionPanel.tsx`
- (Host already added in Task 8 Step 6.)

**Interfaces:**
- Consumes: `getActiveSubstitution`/`getSubstitutionHistory`/`assignSubstitution`/`revokeSubstitution`/`substituteName`/`KdSubstitution` from `kd-substitution-store`; `getUsers`/`rolesOf` from `users-store`; `appendAuditEvent`; `useCurrentUser`.

- [ ] **Step 1: Build the panel** — a `Card` titled «Уполномоченное лицо КД (временное замещение)»:
  - **Active state:** when `getActiveSubstitution()` → show substitute ФИО + window («c DD.MM.YYYY по DD.MM.YYYY») + «Назначил: …» + a «Снять замещение» button (`ReasonDialog` not required; a confirm) → `revokeSubstitution(id)` + audit `"снятие замещения"` (`targetUserId` = substitute).
  - **Empty state:** «Замещение не назначено» + «Назначить замещение».
  - **Assign dialog** (Pattern E): substitute `Select` (users excluding current КД; label = ФИО + primary role) + from/to date `Input type="date"` + reason `Textarea` (required) → `assignSubstitution({ substituteUserId, from, to, reason, assignedBy: currentUser?.fullName ?? "Администратор" })` + audit `"назначение замещения"` (`targetUserId` = substitute, comment = «Замещение КД: c … по …»).
  - **History** — a compact `getSubstitutionHistory()` list (substitute · window · assigned/revoked).
  - Re-read after each mutation via a local `tick` state.
- [ ] **Step 2: Build + in-browser.** `corepack pnpm --filter promo build`; dev, log in as admin → `/users`: the panel shows the seeded active substitution (Тошматов Фаррух). Assign a different substitute → active updates; revoke → empty.
- [ ] **Step 3: Commit.**

```bash
git add Promo/src/app/components/users/KdSubstitutionPanel.tsx Promo/src/app/components/users/UsersPage.tsx
git commit -m "feat(promo): E-4 KdSubstitutionPanel — assign/revoke/history + audit"
```

---

## PHASE 4 — S3 wiring (functional substitution)

## Task 11: `ApprovalDetailPage` substitute acting + conflict + banners

**Files:**
- Modify: `Promo/src/app/components/approvals/ApprovalDetailPage.tsx` (acting block ~lines 89–93; approve/reject calls; hero/action area)
- Modify: `Promo/src/app/components/approvals/ReviewActionsPanel.tsx` (props + a conflict/substitute note)

**Interfaces:**
- Consumes: `getActiveSubstitution`/`isSubstituteConflicted`/`substituteName` from `kd-substitution-store`; `useCurrentUser`.
- Produces: `ReviewActionsPanelProps` gains `substituteActing?: boolean` and `conflicted?: boolean`.

- [ ] **Step 1: Extend the acting predicate.** Replace lines 91–93:

```ts
const actingReviewer = effectiveReviewer(item);
const sub = getActiveSubstitution();
const substituteActing =
  actingReviewer === "Коммерческий директор" &&
  !!currentUser &&
  sub?.substituteUserId === currentUser.id;
const conflicted = substituteActing && isSubstituteConflicted(currentUser, item);
const canAct = actingReviewer === currentRole || (substituteActing && !conflicted);
const actingAsRole: PromoRole = substituteActing ? "Коммерческий директор" : currentRole;
const isKd = currentRole === "Коммерческий директор" || substituteActing;
```

Add `const { currentUser } = useCurrentUser();` near the `useRole()` line (import `useCurrentUser`).

- [ ] **Step 2: Route approve/reject through `actingAsRole`.** Replace every `approve(item!.id, currentRole)` / `reject(…, { actor: currentRole })` in the handlers with `actingAsRole` (so a substitute's transition is stamped as КД, not their god-mode role). Grep the file for `currentRole` inside `approve(`/`reject(` calls and swap to `actingAsRole`. **Leave** the toast-wording branches that read `currentRole === "Старший КМ"` as-is (a substitute is never Старший КМ here).
- [ ] **Step 3: Banner.** When `substituteActing && !conflicted`, render an info banner near the hero: «Вы действуете как уполномоченное лицо КД (замещение до DD.MM.YYYY)» (date = `sub.to`). Pass `substituteActing`/`conflicted` to `ReviewActionsPanel`.
- [ ] **Step 4: `ReviewActionsPanel` conflict note.** Add the two optional props; when `conflicted`, render a blocking warning (`AlertTriangle`, amber/red tint) «Конфликт интересов: нельзя согласовать собственную заявку — решение остаётся за коммерческим директором.» and render NO action buttons (treat like `canAct === false` but with this specific note instead of the generic `readonlyNote`). When `substituteActing && !conflicted`, prefix the panel with a small «Замещение КД» chip.
- [ ] **Step 5: Build + in-browser.** `corepack pnpm --filter promo build`; dev. Log in as `toshmatov@texnomart.uz`/`Manager2026!` (u-8, the seeded substitute). Navigate to `/approvals/PR-2026-001~km-3` (a КД-stage item NOT owned by km-5): confirm the «замещение» banner + Принять/Отклонить are enabled; approving stamps «Согласовано КД». Then `/approvals/UN-2026-014~km-5` (owned by km-5): confirm the conflict warning + disabled actions. (If the exact item ids differ, open `/approvals` and pick a КД-stage row; §Task-2 seed guarantees km-5 conflict + km-2/km-3 clear.)
- [ ] **Step 6: Commit.**

```bash
git add Promo/src/app/components/approvals/ApprovalDetailPage.tsx Promo/src/app/components/approvals/ReviewActionsPanel.tsx
git commit -m "feat(promo): E-4 wire КД substitution into S3 — acting predicate + conflict guard + banner"
```

---

## Task 12: `ApprovalsPage` — substitute sees the КД queue

**Files:**
- Modify: `Promo/src/app/components/approvals/ApprovalsPage.tsx` (~lines 74–93; the `isReviewer`/queue branch)

- [ ] **Step 1: Treat an active substitute as a reviewer.** Add `import { getActiveSubstitution } from "../../../lib/kd-substitution-store";`. After `const isReviewer = REVIEWER_ROLES.includes(currentRole);` compute:

```ts
const sub = getActiveSubstitution();
const isSubstitute = !!currentUser && sub?.substituteUserId === currentUser.id;
const showsQueue = isReviewer || isSubstitute;
```

Use `showsQueue` wherever the page decides queue-vs-«Мои участия»-vs-explainer (replace the `isReviewer` branch that renders the queue). Keep `queue = currentRole === "Администратор" ? items : visibleReviewQueue(items)` — a substitute in a non-admin god-mode role gets `visibleReviewQueue(items)` (both stages), and Task 11 gates *acting* to the КД stage. When `isSubstitute && !isReviewer`, the queue header count copy can stay the generic «На согласовании: N».
- [ ] **Step 2: Build + in-browser.** `corepack pnpm --filter promo build`; dev. Logged in as `toshmatov@texnomart.uz` (god-mode role defaults to КМ): `/approvals` now shows the **review queue** (not «Мои участия»); opening a КД-stage item behaves per Task 11.
- [ ] **Step 3: Commit.**

```bash
git add Promo/src/app/components/approvals/ApprovalsPage.tsx
git commit -m "feat(promo): E-4 approvals — active substitute sees the КД review queue"
```

---

## PHASE 5 — Permissions consolidation + final verification

## Task 13: `permissions.ts` — add the 4 capabilities

**Files:**
- Modify: `Promo/src/lib/permissions.ts` (imports from `./promo-mock-data`; the `CAPABILITIES` array)

- [ ] **Step 1: Add helpers/imports for the derivations.** Import `effectiveAdminScope`-style logic: the capability predicates read the *role* only (the D-screen is role×capability), so express them against roles:
  - «Управление пользователями (глобально)» → `allowed: (r) => r === "Администратор"`, `enforcedIn: "effectiveAdminScope · UsersPage · E-4"`.
  - «Управление пользователями (в подразделении)» → `allowed: (r) => r === "Администратор"` (a role-level view; note dept-admin is a per-user scope, documented) — set `enforcedIn: "adminScope · canManageUser · E-4"` and a `note` that it also covers «Администратор подразделения» (per-user).
  - «Назначение уполномоченного лица КД» → `allowed: (r) => r === "Администратор" || r === "Коммерческий директор"`, `enforcedIn: "KdSubstitutionPanel · E-4"`.
  - «Действие в качестве уполномоченного лица КД» → `allowed: (r) => r === "Коммерческий директор"` (in the mock, acting derives from the logged-in substitute, not a role; document via `note`), `enforcedIn: "canActAsKd · ApprovalDetailPage · E-4"`.
  Put them in a new group `"Пользователи и доступ"` (add the group label wherever `CapabilityGroup`/group labels are defined — follow the existing group pattern). Give each a stable `id` (`manage-users-global`, `manage-users-dept`, `assign-kd-substitute`, `act-kd-substitute`), `label`, `description`.
- [ ] **Step 2: Build + in-browser.** `corepack pnpm --filter promo build`; dev, log in as admin, `/permissions` → «Детальные права»: the 4 new capabilities appear under «Пользователи и доступ» with the right allowed-role chips.
- [ ] **Step 3: Commit.**

```bash
git add Promo/src/lib/permissions.ts
git commit -m "feat(promo): E-4 permissions — user-management + КД-substitution capabilities"
```

---

## Task 14: Final verification (backward-compat + both builds + full walk)

**Files:** none (verification only; fix-forward if anything fails).

- [ ] **Step 1: Both builds green.** `corepack pnpm --filter promo build` **and** `corepack pnpm --filter dashboard build` — both exit 0 (proves shared/Dashboard untouched).
- [ ] **Step 2: Backward-compat.** dev; verify: login as global admin (one click to app); login as `newuser@texnomart.uz`/`Temp1234!a` → forced `/change-password`; `/profile` edit ФИО + voluntary password change still work; the ≥2-admin guard still blocks revoking/deactivating the last two admins (try on u-2 with only u-2+u-3 admins).
- [ ] **Step 3: Feature walk (1440 + 390 px, light + dark).** `/users` list + filters + export + create + `/users/:id` tabs; dept-admin scope as u-6; substitution assign/revoke; the S3 substitute happy-path + conflict; per-user Журнал + `/audit` entries for user actions.
- [ ] **Step 4: Grep for stragglers.** `Grep "CreateUserDialog"` over `Promo/src` → no matches. `Grep "\.role\b"` sanity-scan of new files → they read `rolesOf`, not `.role`, except where primary is intended.
- [ ] **Step 5: Commit any fixes** with descriptive messages. (Docs — `Promo/CLAUDE.md`, `docs/AI_CONTEXT.md`, `HISTORY.md`, memory — are updated separately via `/doc_sync` after the whole-branch review, matching the E-1..E-3 flow.)

---

## Self-Review — spec coverage

- **§4.1 employee model / multi-role** → Task 1 (fields, `rolesOf`, seeds). ✅
- **§4.2 mutators / scope helpers** → Task 1 (`updateUser`/`setUserRoles`/`setDeptAdmin`/`effectiveAdminScope`/`canManageUser`). ✅
- **§4.3 substitution store** → Task 2. ✅
- **§5.1 list rework** → Tasks 5 (filters) + 7 (columns) + 8 (page/scope/export). ✅
- **§5.2 create/edit dialog** → Task 6. ✅
- **§5.3 `/users/:id`** → Task 9. ✅
- **§5.4 dept-admin tier** → Tasks 1 (`adminScope`/`effectiveAdminScope`) + 8 (scope+notice) + 7 (`canManage`). ✅
- **§5.5 audit journal** → Task 3 (`targetUserId` + types) + Task 9 (per-user tab) + audit calls in Tasks 8/9/10. ✅
- **§5.6 КД substitution → S3** → Task 2 (helpers) + Task 10 (panel) + Task 11 (acting/conflict/banner) + Task 12 (queue visibility). ✅
- **§5.7 permissions** → Task 13. ✅
- **§6 file manifest** → matches the File Structure table. ✅
- **§7 QA** → Task 14. ✅

**Type consistency:** `rolesOf` used uniformly; `effectiveAdminScope` returns `"global" | AdminScope | null` consistently in Tasks 1/8/9; `canActAsKd`/`isSubstituteConflicted`/`getActiveSubstitution` signatures identical across Tasks 2/11/12; `actingAsRole: PromoRole` stamped into `approve`/`reject`; `targetUserId` set by every user-management `audit(...)`. No placeholders — every code step shows the code; UI-only tasks reference the exact sibling component + classes to mirror.
