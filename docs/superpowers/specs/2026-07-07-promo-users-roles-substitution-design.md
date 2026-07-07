# Texnomart Promo — E-4 «Управление пользователями, ролями и временным замещением» — Design

> Date: 2026-07-07 · Sub-project **E-4** (the last of the 5th-part feedback: E-1 Reports · E-2/E-2b Notifications · E-3 Audit · **E-4 Users**).
> Status: design (brainstorming output) — pending spec review → writing-plans → subagent-driven-development.
> Scope: **Promo-local only.** No `@texnomart/shared` or `@texnomart/ui` edits (verify with `build:dashboard`). Identity = deterministic seeds. God-mode role switcher kept. Export = real `.xlsx` (SheetJS, already a dep since E-1).

---

## 1. Background & current state

`/users` was built in the 3rd-round sub-project **#0+A** (auth & accounts) as an Администратор-gated screen:

- `Promo/src/lib/users-store.ts` — a localStorage store (`promo:users`) with a minimal `PromoUser` (`id, fullName, email, role (single), status, password, mustChangePassword, createdAt, lastPasswordChangeAt`), CRUD-ish mutators (`createUser`, `resetPassword`, `setUserRole`, `setUserStatus`, `updatePassword`, `updateUserName`), and the **≥2-usable-admins invariant** (`usableAdminCount` / `canRevokeAdmin` / `canDeactivate`).
- `users/UsersPage.tsx` + `UsersTable.tsx` + `CreateUserDialog.tsx` + `TempPasswordDialog.tsx` — list + row menu (reset password / grant-revoke admin / block-unblock), gated on god-mode `currentRole === "Администратор"`; every mutation appends a live event to `audit-store` (`promo:audit-live`) which merges into S8 `/audit`.

Two independent identity signals exist and are the linchpin of this design:

- **`useRole()`** (`role-context.tsx`) — the **god-mode** switcher: a single active role out of the 9 `PROMO_ROLES`, sessionStorage `promo:current-role`. Drives **all** nav/button/field gating across S1–S8. (Its own comment already notes: “One user may hold several roles but acts as exactly one at a time.”)
- **`useCurrentUser()`** (`current-user-context.tsx`) — the actually **logged-in** `PromoUser` (sessionStorage `promo:current-user-id`, seeded from the store on login). Exposes `{ currentUser, login, logout, refresh }`. Already used by `/profile`, the header identity, and approvals §4 (per-user KM-filter persistence).

S3 approval gating (`promo-mock-data.ts`):
- `reviewerForKmStatus(status)` → the role that must act on a KM-level status.
- `effectiveReviewer(item, ref)` → who acts **now**, auto-escalation aware (a breached Старший-КМ item → `"Коммерческий директор"`).
- `ApprovalDetailPage`: `actingReviewer = effectiveReviewer(item)`; `canAct = actingReviewer === currentRole`; `approve(item.id, currentRole)` / `reject(…, { actor: currentRole })` stamp transitions by the **actor role**.
- Review items are **per-(campaign × КМ)** and carry `kmId` (the КМ whose submission is under review).

## 2. Goals

1. **Full employee model** — подразделение / должность / руководитель / **multi-role**.
2. **«Администратор подразделения»** tier — a department-scoped admin below the global «Администратор».
3. **Temporary «Уполномоченное лицо КД»** substitution — designate a person to act as Commercial Director in the S3 approval flow for a window, **wired functionally** into `canAct`, with a **same-person conflict-of-interest guard**.
4. **User audit journal** — a per-user account-action history (reuses the existing live audit log).
5. Reworked `/users` management surface + a `/users/:id` detail page + real `.xlsx` export.

## 3. Non-goals / explicit mock limitations

- **No real identity/authorization backend.** The god-mode switcher stays the demo device; per-person identity remains seed-driven + the representative-КМ mock.
- Passwords stay plain strings; temp password shown once on-screen (no email).
- **Admin scope + substitute acting derive from the logged-in `useCurrentUser()`**, not god-mode. Consequence: to *experience* the dept-admin tier or substitute-acting you log in as the seeded user (default login is the global admin `u-2`, so the global experience is one click). Documented as a mock limitation.
- Substitution is **singular** (zero-or-one active at a time) with a history list; no approval workflow to *grant* a substitution (an admin/КД just sets it).
- Seed-stale where it overlaps other screens; new behavior reads its own authoritative stores.

## 4. Data model

### 4.1 `PromoUser` extension (all additive/optional — existing `.role` readers unaffected)

```ts
export interface PromoUser {
  // …existing…
  role: PromoRole;              // KEPT: primary/display role every existing screen reads
  roles?: PromoRole[];          // NEW: full multi-role set (always includes `role`); read as `user.roles ?? [user.role]`
  department?: string;          // NEW: подразделение (from DEPARTMENTS)
  position?: string;            // NEW: должность (free text)
  managerId?: string;           // NEW: руководитель (ref to another PromoUser.id)
  adminScope?: { kind: "department"; department: string }; // NEW: marks «Администратор подразделения»
  kmId?: string;                // NEW: links a user to a CATEGORY_MANAGERS id (conflict guard + own-scope)
}
```

- **`DEPARTMENTS`** — a seeded const list (~6): «Коммерческий департамент», «Маркетинг», «Закуп», «Аналитика», «Категорийный менеджмент», «ИТ / Администрирование».
- **Backward-compat rule:** a helper `rolesOf(user) = user.roles ?? [user.role]`. All existing exports keep working; `usableAdminCount` changes to count `rolesOf(u).includes("Администратор")` (a considered change so multi-role admins count — verified against the ≥2 invariant).
- Seeds: fill the 7 existing users with department/position/manager; ensure `roles` includes the primary; link КМ users to `kmId` (Каримов→`km-1`, and one user→`OWN_AUDIT_KM_ID="km-3"`); add **2–3 new users** to exercise multi-role, a dept-admin, and the substitute-conflict case.

### 4.2 New mutators / helpers in `users-store.ts`

- `updateUser(id, patch)` — edit ФИО/email/department/position/managerId.
- `setUserRoles(id, roles)` — multi-role edit (keeps `role` = primary = `roles[0]`).
- `setDeptAdmin(id, department | null)` — grant/clear «Администратор подразделения».
- `effectiveAdminScope(user)` → `"global" | { department } | null` — global if `rolesOf` has «Администратор» (and no dept scope), else the dept scope, else null.
- `canManageUser(actor, target)` — global admin ⇒ any; dept admin ⇒ same department only.
- Keep `canRevokeAdmin`/`canDeactivate` (retargeted to `rolesOf`).

### 4.3 New `kd-substitution-store.ts` (localStorage `promo:kd-substitution`)

```ts
interface KdSubstitution {
  id: string; substituteUserId: string;
  from: string; to: string;         // ISO dates (inclusive window)
  reason: string; assignedBy: string; assignedAt: string;
  revokedAt?: string;
}
```

- `getActiveSubstitution(ref?)` → the current non-revoked substitution whose `[from,to]` covers `ref` (else null).
- `getSubstitutionHistory()` → all, newest-first.
- `assignSubstitution(input)` / `revokeSubstitution(id)`.
- **`canActAsKd(user, ref?)`** → `rolesOf(user).includes("Коммерческий директор")` **or** `getActiveSubstitution(ref)?.substituteUserId === user.id`.
- **`isSubstituteConflicted(user, item, ref?)`** → the active substitute is acting **and** `user.kmId === item.kmId` (they’d approve their own submission).

## 5. Feature detail

### 5.1 `/users` list (rework `UsersPage` + `UsersTable`)

- Columns: ФИО · Email · **Роли** (chips) · Подразделение · Должность · Руководитель · Статус · Создан · row menu. Mobile → cards (Pattern K).
- **`UsersFilters`** (new, Pattern B): search (ФИО/email) · подразделение · роль · статус.
- **Scope by effective admin context** (from `useCurrentUser()`): dept admins see/act only within their department; the create/grant-global-admin/substitution controls hide for them.
- **Real `.xlsx` export** (SheetJS) of the filtered rows.
- Row menu keeps reset-password / block-unblock / grant-revoke-global-admin (guarded by ≥2 invariant + `canManageUser`), adds «Открыть» (→ `/users/:id`) and «Администратор подразделения» toggle (global admin only).

### 5.2 Create/Edit user (`UserFormDialog`, replaces `CreateUserDialog`)

Pattern E dialog serving **create and edit**: ФИО, email, **multi-role** chip-select (≥1), подразделение (Select), должность (Input), руководитель (Select of users), admin scope (None / Department). Create keeps the temp-password-shown-once flow (`TempPasswordDialog` reused). Validation: name ≥ 2, valid email, ≥1 role.

### 5.3 `/users/:id` detail page (`UserDetailPage`, new — Pattern D full page)

Pattern-D hero (ФИО + status + primary role) + back nav + Pattern-J tabs:
- **Профиль** — employee info (InfoRow), «Редактировать» → `UserFormDialog`.
- **Роли и доступ** — role chips, admin scope, primary-role indicator, block/reset actions (guarded).
- **Журнал действий** — this user’s audit (§5.5).

Route added to `routes.tsx` under the protected layout.

### 5.4 «Администратор подразделения» tier

- Data-driven (§4.1/§4.2). **Effective admin context from `useCurrentUser()`**: global ⇒ manage all + grant/revoke global admin + assign dept-admin + manage substitution; department ⇒ own-department users only, no global-admin grant, no substitution.
- Nav visibility stays god-mode `currentRole === "Администратор"`; the *scope of actions* comes from the logged-in user. A small in-screen notice states the active scope («Вы — администратор подразделения “Маркетинг”: управление ограничено вашим подразделением»). Seed one dept-admin user so the tier is demonstrable by logging in as them.

### 5.5 User audit journal

- Reuse live `audit-store` + `buildAuditLog` (already surfaces in S8 `/audit`).
- Add optional **`targetUserId?: string`** to `AuditEvent`; user-management actions set it → reliable per-user filtering (not by fragile name match).
- New additive `AuditActionType`s: **«назначение замещения»**, **«снятие замещения»**, **«изменение ролей»** (+ reuse «создание»/«изменение профиля»/«назначение прав»/«отзыв прав»/«блокировка»/«разблокировка»/«сброс пароля»). Extend `AUDIT_ACTION_META` with soft tints for the new types.
- Per-user tab = `buildAuditLog()` filtered to `targetUserId === user.id`.

### 5.6 КД substitution → S3 wiring (the functional core)

- **Management** — `KdSubstitutionPanel` on `/users` (a card/section, global admin or god-mode КД only): shows the active substitution (substitute · window · assigned-by) + assign (user select + date range + reason) + revoke + a history list. Assign/revoke append audit events (`targetUserId` = the substitute).
- **`ApprovalDetailPage` acting predicate** becomes:
  ```
  const sub = getActiveSubstitution();
  const substituteActing = actingReviewer === "Коммерческий директор"
        && sub?.substituteUserId === currentUser?.id;
  const conflicted = substituteActing && currentUser?.kmId === item.kmId;
  const canAct = (actingReviewer === currentRole) || (substituteActing && !conflicted);
  const actingAsRole: PromoRole = substituteActing ? "Коммерческий директор" : currentRole;
  ```
  All `approve(item.id, actingAsRole)` / `reject(…, { actor: actingAsRole })` calls use **`actingAsRole`** so a substitute’s transition is stamped as КД (not their god-mode role) — otherwise the reducer routes it wrong.
- **Banner** when `substituteActing`: «Вы действуете как уполномоченное лицо КД (замещение до DD.MM.YYYY)». When `conflicted`: a blocking note «Конфликт интересов: нельзя согласовать собственную заявку — решение остаётся за коммерческим директором», actions disabled (surfaced in `ReviewActionsPanel`).
- **Queue visibility** — `ApprovalsPage` today routes by god-mode role (reviewers get the queue; a КМ role gets «Мои участия»; others an explainer). A substitute is usually **not** in a reviewer god-mode role, so without a change they’d wrongly land on «Мои участия». **Explicit change:** `ApprovalsPage` shows the reviewer queue when `currentRole` is a reviewer **OR** the logged-in user is an active substitute; `visibleReviewQueue` already lists both stages, and the substitute gains **acting** on the КД stage via §5.6’s predicate.
- **Seed** — an active substitution covering “today” whose substitute is a КМ (`kmId` set) that owns **one** promo currently at the КД review stage → the conflict guard is demonstrable; and at least one other КД-stage item the substitute is **not** conflicted on → the happy path is demonstrable.

### 5.7 `permissions.ts` (D-screen consolidation, keep it honest)

Add capabilities so the read-only «Матрица прав» reflects the new gating: «Управление пользователями (глобально)», «Управление пользователями (подразделение)», «Назначение уполномоченного лица КД», «Действие в качестве уполномоченного лица КД». Their `allowed(role)` derive from the real helpers (no rewrite), each with an `enforcedIn` pointer — matching the D-screen pattern.

## 6. Component / file manifest

**Lib (Promo/src/lib):**
- `users-store.ts` — extend `PromoUser`, `DEPARTMENTS`, `rolesOf`, new mutators/helpers, retarget guards. *(backward-compatible)*
- `kd-substitution-store.ts` — **new**.
- `promo-mock-data.ts` — `AuditEvent.targetUserId?`, 3 new `AuditActionType`s + `AUDIT_ACTION_META`; a `userIdForKm` / seed linkage if needed.
- `audit-store.ts` — pass through `targetUserId` (type only; logic already generic).
- `permissions.ts` — add the 4 capabilities.

**UI (Promo/src/app/components/users):**
- `UsersPage.tsx` — rework (filters, export, substitution panel host, scope-by-logged-in-user, dialog hosts).
- `UsersTable.tsx` — new columns + scoping + «Открыть».
- `UsersFilters.tsx` — **new**.
- `UserFormDialog.tsx` — **new** (replaces `CreateUserDialog.tsx`; delete the old file).
- `UserDetailPage.tsx` — **new** (`/users/:id`).
- `KdSubstitutionPanel.tsx` — **new**.
- `usersExport.ts` — **new** (SheetJS `.xlsx`).
- `TempPasswordDialog.tsx` — reused unchanged.

**S3 (Promo/src/app/components/approvals):**
- `ApprovalDetailPage.tsx` — substitute acting predicate + `actingAsRole` + banners.
- `ReviewActionsPanel.tsx` — conflict-of-interest note + substitute indicator.
- `ApprovalsPage.tsx` — confirm substitute sees the КД queue (likely no change).

**Routing:** `routes.tsx` — add `/users/:id`.

## 7. Testing / QA plan

- `build:promo` **and** `build:dashboard` green (prove shared untouched).
- **Backward-compat:** `/profile` edit ФИО + voluntary password change still work; auth login (global admin + temp-password user) still works; ≥2-admin guard still blocks the last-two admins.
- **Users:** create (temp password once) · edit (multi-role, dept, manager) · filters · `.xlsx` export · `/users/:id` tabs.
- **Dept-admin:** logged in as the seeded dept admin → sees only own-department users, no global-admin/substitution controls; global admin sees all.
- **Substitution:** assign a substitute (window covers today) → log in as them → `/approvals` КД-stage item shows the «замещение» banner + can Принять/Отклонить (transition stamped as КД); the conflict-seeded item blocks with the conflict note; revoke → acting rights gone.
- **Audit:** each action appears in S8 `/audit` and in the user’s per-user journal (`targetUserId`).
- In-browser walk at 1440 + 390 px, light + dark.

## 8. Execution

Spec → `writing-plans` → `subagent-driven-development` (per-task review + whole-branch opus review + one fix wave + in-browser QA), mirroring E-1..E-3. Commit to `main`.

## 9. Open items to confirm at spec review

- `usableAdminCount` retarget to `rolesOf` (multi-role admins count) — intended.
- Who may assign the КД substitution: global «Администратор» **and** god-mode «Коммерческий директор» — intended.
- `/users/:id` as a full page (Pattern D) vs. a config drawer — chosen full page for the richer content (employee + roles + journal).
