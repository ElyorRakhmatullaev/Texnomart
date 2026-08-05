# Промо 5D — «Пользователи, роли, временное замещение»: план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Закрыть 11 пробелов блока 5D — типизированные роли (основная / дополнительная / временная с периодом), происхождение учётки, статус «Деактивирован», сворачиваемая история замещений с состоянием «Срок истёк», и аудит с «было → стало» + основанием.

**Architecture:** Плоский `roles[]` заменяется реестром `RoleAssignment[]`, поверх которого работает одна чистая деривация `lib/user-roles.ts` (`activeRolesOf` / `permanentRolesOf`); `rolesOf` в сторе становится её обёрткой, поэтому существующие потребители не правятся. Замещение КД остаётся в своём сторе и проецируется только в отображение — гейтинг S3 не меняется. `AuditEvent` получает опциональные `changes[]` и `reason`.

**Tech Stack:** React 18 + TypeScript, Vite 6 (esbuild, **без `tsc`**), Tailwind v4, shadcn/ui через `@texnomart/ui`, localStorage-сторы, SheetJS (`xlsx`), date-fns/ru.

**Спека:** `docs/superpowers/specs/2026-08-05-promo-users-roles-5d-design.md` (коммит `9eab295`).

## Global Constraints

- Скоуп — **только `Promo/src/**`**. `packages/shared`, `packages/ui` и `Dashboard/` не трогать. `@texnomart/ui` редактировать запрещено.
- Весь UI-текст — на русском. Числа — `toLocaleString("ru-RU")` + `tabular-nums`. Даты — `RuDate` / `date-fns` с локалью `ru`.
- **Тестового раннера в проекте нет.** Цикл проверки задачи: (1) `corepack pnpm --filter promo build`; (2) проверка чистых деривации прямым импортом модуля в браузере (`await import('/src/lib/user-roles.ts')` в `browser_evaluate` на dev-сервере); (3) для UI — **настоящие клики** (`browser_click`), потому что Radix отсеивает `element.click()` и синтетические PointerEvent (урок 5C).
- Сборка транспайл-онли: она **не увидит** несовпадение типов. После каждой задачи открывать затронутый экран в браузере.
- `pnpm` вызывается через `corepack` (не на PATH). Билд промо: `corepack pnpm --filter promo build`; dev: `corepack pnpm --filter promo dev`.
- Роль «Уполномоченное лицо КД» **не добавляется** в `PROMO_ROLES` — она не роль, а отображаемый признак замещения.
- Каждая задача завершается коммитом на `main` (в этом репозитории ветки не заводим).
- Все даты периодов — строки `«YYYY-MM-DD»` (date-only), сравниваются через локальную полночь, как в `kd-substitution-store.localMidnight`. UTC-парсинг запрещён — он даёт сдвиг на день.

---

## File Structure

| Файл | Ответственность |
|---|---|
| `Promo/src/lib/user-roles.ts` (**создать**) | Чистая модель ролей: типы `RoleKind`/`RoleAssignment`/`RoleCarrier`, нормализация реестра, активность/истечение по дате, наборы ролей. Не знает про localStorage. |
| `Promo/src/lib/users-store.ts` | Хранение: `PromoUser += roleAssignments/createdBy`, сиды, запись реестра, гварды администраторов. `rolesOf` — обёртка над деривацией. |
| `Promo/src/lib/kd-substitution-store.ts` | + состояние записи замещения (`active`/`revoked`/`expired`) и проекция в отображаемый признак. |
| `Promo/src/lib/promo-mock-data.ts` | `AuditFieldChange`, `AuditEvent += changes/reason`, переименование двух типов действий. |
| `Promo/src/app/components/users/*.tsx` | Экраны: список, фильтры, форма, деталь, панель замещения. |
| `Promo/src/app/components/audit/AuditLogTable.tsx` | Отображение «было → стало» и основания; строки выгрузки. |
| `Promo/src/lib/users-xlsx.ts`, `Promo/src/lib/permissions.ts` | Выгрузка учёток; capability временной роли. |

---

## Task 1: Модель ролей и деривация

**Files:**
- Create: `Promo/src/lib/user-roles.ts`
- Modify: `Promo/src/lib/users-store.ts` (типы `PromoUser`, `SEED_USERS`, `rolesOf`)

**Interfaces:**
- Consumes: `PromoRole` из `Promo/src/app/role-context`.
- Produces: `RoleKind`, `RoleAssignment`, `RoleCarrier`, `ROLE_KIND_LABEL`, `assignmentsOf`, `isAssignmentActive`, `isAssignmentExpired`, `permanentRolesOf`, `activeRolesOf`, `primaryRoleOf`, `temporaryAssignments`; `PromoUser.roleAssignments`, `PromoUser.createdBy`.

- [ ] **Step 1: Создать `Promo/src/lib/user-roles.ts`**

```ts
import type { PromoRole } from "../app/role-context";

/**
 * Тип назначения роли (5D, стр. 66 п. 3 / стр. 69 п. 2 трекера).
 * Ровно одна `primary`-запись на пользователя; `additional`/`temporary` — сколько угодно.
 */
export type RoleKind = "primary" | "additional" | "temporary";

export interface RoleAssignment {
  role: PromoRole;
  kind: RoleKind;
  /** Только для kind==="temporary". Date-only «YYYY-MM-DD», окно включительно. */
  from?: string;
  to?: string;
  /** ФИО назначившего — как `KdSubstitution.assignedBy`. */
  assignedBy?: string;
  assignedAt?: string;
  /** Основание/комментарий. */
  reason?: string;
}

/** Минимальный носитель ролей: модуль намеренно не импортирует `PromoUser` (иначе цикл стор ↔ деривация). */
export interface RoleCarrier {
  role: PromoRole;
  roles?: PromoRole[];
  roleAssignments?: RoleAssignment[];
}

export const ROLE_KIND_LABEL: Record<RoleKind, string> = {
  primary: "основная",
  additional: "дополнительная",
  temporary: "временная",
};

/** Локальная полночь из «YYYY-MM-DD» (тот же приём, что в kd-substitution-store — без UTC-сдвига). */
function localMidnight(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).getTime();
}

function dayOf(ref: Date): number {
  return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
}

/**
 * Реестр ролей пользователя. Если `roleAssignments` нет — строится из
 * legacy-полей: roles[0] (или `role`) → primary, остальные → additional.
 * Обратная совместимость по конструкции: старый снапшот localStorage читается без миграции.
 */
export function assignmentsOf(user: RoleCarrier): RoleAssignment[] {
  const stored = user.roleAssignments;
  if (stored && stored.length > 0) {
    // Нормализация: ровно одна primary. Если её нет — первая постоянная запись становится основной.
    const hasPrimary = stored.some((a) => a.kind === "primary");
    if (hasPrimary) return stored;
    const firstPermanent = stored.findIndex((a) => a.kind !== "temporary");
    if (firstPermanent < 0) return stored;
    return stored.map((a, i) => (i === firstPermanent ? { ...a, kind: "primary" as RoleKind } : a));
  }
  const flat = user.roles && user.roles.length > 0 ? user.roles : [user.role];
  return flat.map((role, i) => ({ role, kind: i === 0 ? "primary" : "additional" }));
}

/** Действует ли запись на момент `ref`. Постоянные — всегда. */
export function isAssignmentActive(a: RoleAssignment, ref: Date = new Date()): boolean {
  if (a.kind !== "temporary") return true;
  const day = dayOf(ref);
  if (a.from && localMidnight(a.from) > day) return false;
  if (a.to && localMidnight(a.to) < day) return false;
  return true;
}

/** Временная запись, чьё окно уже прошло. */
export function isAssignmentExpired(a: RoleAssignment, ref: Date = new Date()): boolean {
  return a.kind === "temporary" && !!a.to && localMidnight(a.to) < dayOf(ref);
}

function dedupe(roles: PromoRole[]): PromoRole[] {
  return Array.from(new Set(roles));
}

/** Постоянные роли (primary + additional). База для гвардов администраторов. */
export function permanentRolesOf(user: RoleCarrier): PromoRole[] {
  return dedupe(assignmentsOf(user).filter((a) => a.kind !== "temporary").map((a) => a.role));
}

/** Постоянные + временные, действующие на `ref`. Это «текущие права» пользователя. */
export function activeRolesOf(user: RoleCarrier, ref: Date = new Date()): PromoRole[] {
  return dedupe(assignmentsOf(user).filter((a) => isAssignmentActive(a, ref)).map((a) => a.role));
}

export function primaryRoleOf(user: RoleCarrier): PromoRole {
  return assignmentsOf(user).find((a) => a.kind === "primary")?.role ?? user.role;
}

/** Временные записи. `activeOnly` — только действующие на `ref`. */
export function temporaryAssignments(
  user: RoleCarrier,
  ref: Date = new Date(),
  activeOnly = false
): RoleAssignment[] {
  return assignmentsOf(user).filter(
    (a) => a.kind === "temporary" && (!activeOnly || isAssignmentActive(a, ref))
  );
}
```

- [ ] **Step 2: Расширить `PromoUser` и `rolesOf` в `users-store.ts`**

В шапке файла добавить импорт и ре-экспорт типов (потребители уже импортируют роли из стора — пусть продолжают):

```ts
import {
  activeRolesOf,
  assignmentsOf,
  permanentRolesOf as permanentRoles,
  type RoleAssignment,
} from "./user-roles";

export type { RoleAssignment, RoleKind } from "./user-roles";
export { ROLE_KIND_LABEL, assignmentsOf, primaryRoleOf, temporaryAssignments, isAssignmentActive, isAssignmentExpired } from "./user-roles";
```

В интерфейсе `PromoUser` — два новых опциональных поля (рядом с `kmId`):

```ts
  /** Реестр ролей (5D). Отсутствует у старых снапшотов — тогда строится из `roles`/`role`. */
  roleAssignments?: RoleAssignment[];
  /** ФИО создателя учётной записи (5D, стр. 66 п. 2). */
  createdBy?: string;
```

Заменить тело `rolesOf` (сигнатура не меняется — все 9 потребителей остаются как есть):

```ts
/** Полный набор ДЕЙСТВУЮЩИХ ролей (5D: истёкшие временные роли сюда не попадают). */
export function rolesOf(user: PromoUser): PromoRole[] {
  return activeRolesOf(user);
}
```

- [ ] **Step 3: Досеять `createdBy` и две временные роли**

Всем восьми записям `SEED_USERS` добавить `createdBy: "Администратор Системы"`, кроме `u-2` — ему `createdBy: "Первичная настройка системы"` (он сам первый администратор).

Двум записям добавить реестр — активную и истёкшую временную роль (без них ветки «действует до…» и «срок истёк» нечем показать):

```ts
// u-6 «Алиева Нигора» — активная временная роль (окно вокруг демо-даты 2026-08-05).
roleAssignments: [
  { role: "Сотрудник маркетинга", kind: "primary" },
  {
    role: "Директор маркетинга",
    kind: "temporary",
    from: "2026-08-01",
    to: "2026-08-31",
    assignedBy: "Администратор Системы",
    assignedAt: "2026-07-31T09:00:00.000Z",
    reason: "Замещение на период отпуска директора маркетинга.",
  },
],

// u-4 «Каримов Шохрух» — истёкшая временная роль.
roleAssignments: [
  { role: "Категорийный менеджер (КМ)", kind: "primary" },
  {
    role: "Старший КМ",
    kind: "temporary",
    from: "2026-05-01",
    to: "2026-05-31",
    assignedBy: "Администратор Системы",
    assignedAt: "2026-04-28T09:00:00.000Z",
    reason: "Исполнение обязанностей на период отсутствия старшего КМ.",
  },
],
```

- [ ] **Step 4: Собрать проект**

Run: `corepack pnpm --filter promo build`
Expected: сборка зелёная.

- [ ] **Step 5: Проверить деривацию прямым импортом**

Запустить dev-сервер (`corepack pnpm --filter promo dev`), открыть его адрес в браузере, выполнить в `browser_evaluate`:

```js
const m = await import('/src/lib/user-roles.ts');
const u6 = { role: "Сотрудник маркетинга", roleAssignments: [
  { role: "Сотрудник маркетинга", kind: "primary" },
  { role: "Директор маркетинга", kind: "temporary", from: "2026-08-01", to: "2026-08-31" },
]};
const legacy = { role: "Старший КМ", roles: ["Старший КМ", "Категорийный менеджер (КМ)"] };
return {
  inWindow:  m.activeRolesOf(u6, new Date(2026, 7, 5)),   // ожидание: обе роли
  afterWindow: m.activeRolesOf(u6, new Date(2026, 8, 5)), // ожидание: только «Сотрудник маркетинга»
  permanent: m.permanentRolesOf(u6),                       // ожидание: только «Сотрудник маркетинга»
  expired: m.isAssignmentExpired(u6.roleAssignments[1], new Date(2026, 8, 5)), // true
  legacyRoles: m.activeRolesOf(legacy),                    // обе legacy-роли, порядок сохранён
  legacyPrimary: m.primaryRoleOf(legacy),                  // «Старший КМ»
};
```

Expected: `inWindow` = 2 роли, `afterWindow` = 1, `permanent` = 1, `expired` = true, `legacyRoles` = 2 роли в исходном порядке, `legacyPrimary` = «Старший КМ».

- [ ] **Step 6: Коммит**

```bash
git add Promo/src/lib/user-roles.ts Promo/src/lib/users-store.ts
git commit -m "feat(promo): 5D T1 — реестр ролей RoleAssignment + чистая деривация user-roles"
```

---

## Task 2: Запись реестра и гварды администраторов

**Files:**
- Modify: `Promo/src/lib/users-store.ts` (`NewUserInput`, `createUser`, `setUserRoles`, новые функции записи, `usableAdminCount`, `canRevokeAdmin`)

**Interfaces:**
- Consumes: `assignmentsOf`, `permanentRolesOf` (Task 1).
- Produces: `setRoleAssignments(id, assignments)`, `addTemporaryRole(id, input)`, `removeAssignment(id, role, kind)`, `NewUserInput += createdBy?/assignments?`.

- [ ] **Step 1: Синхронизация legacy-полей при записи реестра**

Добавить приватный хелпер и публичную запись:

```ts
/**
 * Реестр — источник истины; `role`/`roles` синхронизируются, чтобы ни один
 * существующий потребитель (auth, /profile, экспорт, уведомления) не увидел
 * рассинхрона. `roles` держит ПОСТОЯННЫЕ роли: временные живут только в реестре
 * и попадают в набор через `activeRolesOf` по дате.
 */
function withAssignments(user: PromoUser, assignments: RoleAssignment[]): PromoUser {
  const permanent = permanentRoles({ ...user, roleAssignments: assignments });
  const primary = assignments.find((a) => a.kind === "primary")?.role ?? permanent[0] ?? user.role;
  return { ...user, roleAssignments: assignments, role: primary, roles: permanent };
}

export function setRoleAssignments(id: string, assignments: RoleAssignment[]): void {
  write(read().map((u) => (u.id === id ? withAssignments(u, assignments) : u)));
}

export function addTemporaryRole(
  id: string,
  input: { role: PromoRole; from: string; to: string; assignedBy: string; reason?: string }
): void {
  write(
    read().map((u) => {
      if (u.id !== id) return u;
      const next: RoleAssignment[] = [
        ...assignmentsOf(u),
        {
          role: input.role,
          kind: "temporary",
          from: input.from,
          to: input.to,
          assignedBy: input.assignedBy,
          assignedAt: new Date().toISOString(),
          reason: input.reason?.trim() || undefined,
        },
      ];
      return withAssignments(u, next);
    })
  );
}

/** Снять запись реестра (по роли и типу). Для досрочного снятия временной роли. */
export function removeAssignment(id: string, role: PromoRole, kind: RoleAssignment["kind"]): void {
  write(
    read().map((u) =>
      u.id === id
        ? withAssignments(u, assignmentsOf(u).filter((a) => !(a.role === role && a.kind === kind)))
        : u
    )
  );
}
```

- [ ] **Step 2: `setUserRoles` сохраняет временные роли**

Существующий вызов `setUserRoles(id, roles)` в `UsersPage` передаёт плоский список постоянных ролей. Он не должен стирать временные записи:

```ts
/** Плоский список ПОСТОЯННЫХ ролей → реестр (roles[0] — основная). Временные записи сохраняются. */
export function setUserRoles(id: string, roles: PromoRole[]): void {
  const next = roles.length > 0 ? roles : (["Сотрудник закупа"] as PromoRole[]);
  write(
    read().map((u) => {
      if (u.id !== id) return u;
      const temporary = assignmentsOf(u).filter((a) => a.kind === "temporary");
      const permanent: RoleAssignment[] = next.map((role, i) => ({
        role,
        kind: i === 0 ? "primary" : "additional",
      }));
      return withAssignments(u, [...permanent, ...temporary]);
    })
  );
}
```

- [ ] **Step 3: `createUser` фиксирует автора**

В `NewUserInput` добавить:

```ts
  /** ФИО создателя (5D). */
  createdBy?: string;
```

В теле `createUser` при формировании объекта пользователя добавить `createdBy: input.createdBy` и реестр из переданных ролей:

```ts
    createdBy: input.createdBy,
    roleAssignments: (input.roles && input.roles.length > 0 ? input.roles : [input.role]).map(
      (role, i) => ({ role, kind: i === 0 ? "primary" : "additional" } as RoleAssignment)
    ),
```

- [ ] **Step 4: Гварды — только постоянные роли**

```ts
/** Администраторы, способные войти. Считаются ПОСТОЯННЫЕ роли: временный
 *  «Администратор» не держит пул ≥2 — в день истечения окна система осталась
 *  бы без администраторов, а гвард отчитался бы, что всё в порядке. */
export function usableAdminCount(users: PromoUser[] = read()): number {
  return users.filter((u) => permanentRoles(u).includes("Администратор") && u.status !== "blocked").length;
}

export function canRevokeAdmin(id: string): boolean {
  const users = read();
  const target = users.find((u) => u.id === id);
  if (!target || !permanentRoles(target).includes("Администратор")) return false;
  // Симуляция отзыва: снимаем только ПОСТОЯННУЮ запись «Администратор»,
  // временные записи сохраняем — иначе гвард посчитает не то состояние, которое наступит.
  const after = users.map((u) =>
    u.id === id
      ? withAssignments(
          u,
          assignmentsOf(u).filter((a) => !(a.role === "Администратор" && a.kind !== "temporary"))
        )
      : u
  );
  return usableAdminCount(after) >= 2;
}
```

`canDeactivate` не меняется — он считает через `usableAdminCount`.

- [ ] **Step 5: Собрать и проверить гварды в браузере**

Run: `corepack pnpm --filter promo build` → зелёная.

В `browser_evaluate` на dev-сервере:

```js
const s = await import('/src/lib/users-store.ts');
const r = await import('/src/lib/user-roles.ts');
const before = s.getUsers().length;
s.addTemporaryRole('u-4', { role: 'Администратор', from: '2026-08-01', to: '2026-08-31', assignedBy: 'QA', reason: 'проверка' });
const u4 = s.getUserById('u-4');
return {
  activeHasAdmin: r.activeRolesOf(u4).includes('Администратор'),   // true — окно покрывает демо-дату
  permanentHasAdmin: r.permanentRolesOf(u4).includes('Администратор'), // false
  adminCount: s.usableAdminCount(),                                 // 2 — временный админ НЕ учтён
  users: before,
};
```

Expected: `activeHasAdmin` = true, `permanentHasAdmin` = false, `adminCount` = 2.

Затем очистить состояние: `localStorage.removeItem('promo:users'); location.reload();`

- [ ] **Step 6: Коммит**

```bash
git add Promo/src/lib/users-store.ts
git commit -m "feat(promo): 5D T2 — запись реестра ролей + гварды администраторов по постоянным ролям"
```

---

## Task 3: Проекция замещения и список пользователей

**Files:**
- Modify: `Promo/src/lib/kd-substitution-store.ts` (новые `substitutionState`, `substitutionBadgeFor`)
- Modify: `Promo/src/app/components/users/UsersTable.tsx`
- Modify: `Promo/src/app/components/users/UsersFilters.tsx` (метка статуса)

**Interfaces:**
- Consumes: `assignmentsOf`, `temporaryAssignments`, `isAssignmentExpired`, `ROLE_KIND_LABEL` (Task 1); `getActiveSubstitution` (существующий).
- Produces: `SubstitutionState`, `substitutionState(sub, ref)`, `substitutionBadgeFor(user, ref)`; типизированный рендер ролей в списке.

- [ ] **Step 1: Состояние и проекция в `kd-substitution-store.ts`**

```ts
/** Состояние записи замещения для истории (5D, стр. 70 п. 3). */
export type SubstitutionState = "active" | "revoked" | "expired";

export function substitutionState(s: KdSubstitution, ref: Date = new Date()): SubstitutionState {
  if (s.revokedAt) return "revoked";
  const day = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
  if (localMidnight(s.to) < day) return "expired";
  return "active";
}

/**
 * Отображаемый признак «Уполномоченное лицо КД» (5D, стр. 70 п. 2).
 * НАМЕРЕННО не роль: «Уполномоченное лицо КД» нет в PROMO_ROLES, а маппинг на
 * «Коммерческий директор» расширил бы права (permissions/матрица/навигация),
 * тогда как замещение ограничено этапом согласования КД. Гейтинг остаётся за `canActAsKd`.
 */
export function substitutionBadgeFor(
  user: Pick<PromoUser, "id"> | null,
  ref: Date = new Date()
): { label: string; from: string; to: string } | null {
  if (!user) return null;
  const active = getActiveSubstitution(ref);
  if (!active || active.substituteUserId !== user.id) return null;
  return { label: "Уполномоченное лицо КД", from: active.from, to: active.to };
}
```

- [ ] **Step 2: Типизированные чипы ролей + колонка «Кем создана» + «Деактивирован» в `UsersTable.tsx`**

Заменить метку статуса:

```ts
  blocked: { label: "Деактивирован", cls: "bg-gray-200 dark:bg-muted text-gray-600 dark:text-gray-300" },
```

Добавить импорты и общий рендер чипов (перед `RowMenu`):

```tsx
import { Clock } from "lucide-react";
import { assignmentsOf, isAssignmentExpired } from "../../../lib/user-roles";
import { substitutionBadgeFor } from "../../../lib/kd-substitution-store";

/** «01.09» — короткая дата окончания временной роли. */
function shortDate(iso?: string): string {
  if (!iso) return "";
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}`;
}

function RoleChips({ user }: { user: PromoUser }) {
  const badge = substitutionBadgeFor(user);
  return (
    <div className="flex flex-wrap gap-1">
      {assignmentsOf(user)
        .filter((a) => a.kind !== "temporary" || !isAssignmentExpired(a))
        .map((a) => (
          <span
            key={`${a.role}-${a.kind}`}
            title={a.kind === "temporary" ? `Временная роль до ${shortDate(a.to)}` : undefined}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
              a.kind === "primary"
                ? "bg-primary text-primary-foreground font-medium"
                : a.kind === "temporary"
                ? "border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300"
                : "border border-gray-200 dark:border-border text-gray-600 dark:text-gray-300"
            )}
          >
            {a.kind === "temporary" && <Clock className="size-3" />}
            {a.role}
            {a.kind === "temporary" && a.to && <span className="opacity-70">до {shortDate(a.to)}</span>}
          </span>
        ))}
      {badge && (
        <span className="inline-flex items-center gap-1 rounded-full border border-violet-300 dark:border-violet-500/40 px-2 py-0.5 text-xs text-violet-800 dark:text-violet-300">
          <Clock className="size-3" />
          {badge.label} <span className="opacity-70">до {shortDate(badge.to)}</span>
        </span>
      )}
    </div>
  );
}
```

Заменить обе `rolesOf(u).map(...)`-разметки (десктоп, строка ~151, и мобильная карточка, строка ~191) на `<RoleChips user={u} />`.

Добавить колонку «Кем создана» — в `TableHeader` после `<TableHead className="w-[110px]">Создан</TableHead>`:

```tsx
              <TableHead className="w-[160px]">Кем создана</TableHead>
```

и соответствующую ячейку после ячейки с `formatDate(u.createdAt)`:

```tsx
                <TableCell className="text-sm text-gray-600 dark:text-gray-300">{u.createdBy ?? "—"}</TableCell>
```

В мобильной карточке — строкой под датой:

```tsx
            {u.createdBy && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Создал(а): {u.createdBy}</p>
            )}
```

- [ ] **Step 3: Метка статуса в `UsersFilters.tsx`**

```ts
  { value: "blocked", label: "Деактивирован" },
```

- [ ] **Step 4: Сборка + проверка в браузере**

Run: `corepack pnpm --filter promo build` → зелёная.

Открыть `/users` под ролью «Администратор» (переключатель ролей в шапке — **настоящим кликом**). Проверить:
- у «Алиева Нигора» виден янтарный чип «Директор маркетинга · до 31.08» с иконкой часов;
- у «Каримов Шохрух» истёкшая временная роль **не** показывается;
- у «Тошматов Фаррух» виден фиолетовый чип «Уполномоченное лицо КД · до 31.12»;
- колонка «Кем создана» заполнена;
- в фильтре «Статус» есть «Деактивирован».

- [ ] **Step 5: Коммит**

```bash
git add Promo/src/lib/kd-substitution-store.ts Promo/src/app/components/users/UsersTable.tsx Promo/src/app/components/users/UsersFilters.tsx
git commit -m "feat(promo): 5D T3 — типы ролей в списке, признак замещения, «Кем создана», «Деактивирован»"
```

---

## Task 4: Форма пользователя — реестр ролей и временные роли

**Files:**
- Modify: `Promo/src/app/components/users/UserFormDialog.tsx`

**Interfaces:**
- Consumes: `RoleAssignment`, `assignmentsOf`, `ROLE_KIND_LABEL` (Task 1).
- Produces: `UserFormValue.assignments: RoleAssignment[]` (поле `roles: PromoRole[]` **сохраняется** как производное — постоянные роли, чтобы не ломать `UsersPage.handleCreate`); проп `lockedRoles?: PromoRole[]` вместо `adminRoleLocked?: boolean`.

- [ ] **Step 1: Расширить контракт формы**

```ts
export interface UserFormValue {
  fullName: string;
  email: string;
  /** Постоянные роли, roles[0] — основная. Производное от `assignments`. */
  roles: PromoRole[];
  /** Полный реестр, включая временные роли с периодом (5D). */
  assignments: RoleAssignment[];
  department?: string;
  position?: string;
  managerId?: string;
}
```

Заменить проп `adminRoleLocked?: boolean` на:

```ts
  /**
   * Роли, которые нельзя ни выдать, ни снять в этой форме. Для администратора
   * подразделения — ["Администратор", "Коммерческий директор"] (5D, стр. 67:
   * он не может создавать/изменять администраторов и назначать роль КД).
   */
  lockedRoles?: PromoRole[];
```

и во всём файле заменить проверку `adminRoleLocked && r === ADMIN_ROLE` на `lockedRoles.includes(r)`; подпись блокировки — «Изменять эту роль может только глобальный администратор».

- [ ] **Step 2: Состояние временных ролей**

```tsx
const [temporary, setTemporary] = React.useState<RoleAssignment[]>([]);

// в эффекте create-режима:
setTemporary([]);
// в эффекте edit-режима:
setTemporary(assignmentsOf(initial).filter((a) => a.kind === "temporary"));
```

- [ ] **Step 3: Блок «Временные роли» под чипами постоянных ролей**

```tsx
<div className="space-y-2">
  <Label>Временные роли</Label>
  {temporary.length === 0 && (
    <p className="text-xs text-muted-foreground">Временные роли не назначены.</p>
  )}
  <div className="flex flex-col gap-2">
    {temporary.map((a, i) => (
      <div key={i} className="grid gap-2 rounded-lg border border-gray-200 dark:border-border p-2.5 sm:grid-cols-[1fr_auto]">
        <div className="grid gap-2 sm:grid-cols-3">
          <Select
            value={a.role}
            onValueChange={(v) => setTemporary((p) => p.map((x, j) => (j === i ? { ...x, role: v as PromoRole } : x)))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROMO_ROLES.filter((r) => !lockedRoles.includes(r)).map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={a.from ?? ""}
            onChange={(e) => setTemporary((p) => p.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)))}
          />
          <Input
            type="date"
            value={a.to ?? ""}
            min={a.from || undefined}
            onChange={(e) => setTemporary((p) => p.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))}
          />
        </div>
        <div className="flex items-start gap-2">
          <Input
            placeholder="Основание"
            value={a.reason ?? ""}
            onChange={(e) => setTemporary((p) => p.map((x, j) => (j === i ? { ...x, reason: e.target.value } : x)))}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => setTemporary((p) => p.filter((_, j) => j !== i))}>
            <X className="size-4" />
          </Button>
        </div>
      </div>
    ))}
  </div>
  <Button
    type="button"
    variant="outline"
    size="sm"
    onClick={() =>
      setTemporary((p) => [...p, { role: DEFAULT_ROLE, kind: "temporary", from: "", to: "" }])
    }
  >
    + Добавить временную роль
  </Button>
  {temporaryError && <p className="text-xs text-red-600 dark:text-red-400">{temporaryError}</p>}
</div>
```

Импортировать `X` из `lucide-react`.

- [ ] **Step 4: Валидация и сборка значения**

```tsx
const temporaryError = React.useMemo(() => {
  for (const a of temporary) {
    if (!a.from || !a.to) return "У временной роли укажите обе даты периода.";
    if (a.to < a.from) return "Дата окончания временной роли раньше даты начала.";
    if (roles.includes(a.role)) return `Роль «${a.role}» уже назначена постоянно — временная не нужна.`;
  }
  return null;
}, [temporary, roles]);

const isValid = nameValid && emailValid && rolesValid && !temporaryError;
```

В `submit` отдавать реестр:

```tsx
    const assignments: RoleAssignment[] = [
      ...roles.map((role, i) => ({ role, kind: (i === 0 ? "primary" : "additional") as RoleAssignment["kind"] })),
      ...temporary,
    ];
    onSubmit({ fullName: fullName.trim(), email: email.trim(), roles, assignments, department, position: position.trim() || undefined, managerId });
```

- [ ] **Step 5: Сборка + проверка формы кликами**

Run: `corepack pnpm --filter promo build` → зелёная.

На `/users` под «Администратор» открыть «Создать пользователя» **настоящим кликом**, добавить временную роль, оставить пустой период → кнопка «Создать» заблокирована и видна подсказка; заполнить период → форма проходит.

- [ ] **Step 6: Коммит**

```bash
git add Promo/src/app/components/users/UserFormDialog.tsx
git commit -m "feat(promo): 5D T4 — временные роли с периодом в форме пользователя + lockedRoles"
```

---

## Task 5: Проводка страниц — создание, редактирование, вкладка «Роли и доступ»

**Files:**
- Modify: `Promo/src/app/components/users/UsersPage.tsx`
- Modify: `Promo/src/app/components/users/UserDetailPage.tsx`

**Interfaces:**
- Consumes: `UserFormValue.assignments`, `lockedRoles` (Task 4); `setRoleAssignments`, `createUser({createdBy})` (Task 2); `assignmentsOf`, `isAssignmentExpired`, `ROLE_KIND_LABEL` (Task 1).
- Produces: сохранение реестра из обеих точек редактирования; отображение групп ролей в детали.

- [ ] **Step 1: `UsersPage.handleCreate` фиксирует автора**

```tsx
      const { user, tempPassword: pwd } = createUser({
        fullName: value.fullName,
        email: value.email,
        role: value.roles[0],
        roles: value.roles,
        department: value.department,
        position: value.position,
        managerId: value.managerId,
        createdBy: currentUser?.fullName ?? "Администратор",
      });
```

- [ ] **Step 2: `UserDetailPage.handleEditSubmit` пишет реестр, а не плоский список**

Заменить сравнение и запись ролей (существующие `prevRoles`/`rolesChanged`/`setUserRoles`):

```tsx
    const prevAssignments = assignmentsOf(user);
    const prevRoles = permanentRolesOf(user);
    // ...гейты на «Администратор» остаются без изменений, но читают prevRoles (постоянные)

    const rolesChanged =
      JSON.stringify(prevAssignments) !== JSON.stringify(value.assignments);

    updateUser(user.id, { /* без изменений */ });
    setRoleAssignments(user.id, value.assignments);

    if (rolesChanged) {
      audit("изменение ролей", `Новый набор ролей: ${value.roles.join(", ")}`);
    }
```

Импортировать `assignmentsOf`, `permanentRolesOf`, `setRoleAssignments` из `../../../lib/users-store`.

Передать форме заблокированные роли:

```tsx
        lockedRoles={isGlobalAdmin ? [] : (["Администратор", "Коммерческий директор"] as PromoRole[])}
```

(заменяет прежний `adminRoleLocked={!isGlobalAdmin}`).

- [ ] **Step 3: Вкладка «Роли и доступ» — три группы**

Заменить карточку «Роли» на группировку по типу:

```tsx
<Card>
  <CardHeader><CardTitle className="text-base">Роли</CardTitle></CardHeader>
  <CardContent className="space-y-4 pt-0">
    {(["primary", "additional", "temporary"] as const).map((kind) => {
      const items = assignmentsOf(user).filter((a) => a.kind === kind);
      if (items.length === 0) return null;
      return (
        <div key={kind} className="space-y-1.5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {kind === "primary" ? "Основная роль" : kind === "additional" ? "Дополнительные роли" : "Временные роли"}
          </p>
          <ul className="flex flex-col gap-1.5">
            {items.map((a, i) => {
              const expired = isAssignmentExpired(a);
              return (
                <li key={`${a.role}-${i}`} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                    kind === "primary" ? "bg-primary text-primary-foreground" : "bg-gray-100 dark:bg-muted text-gray-700 dark:text-gray-200",
                    expired && "opacity-60"
                  )}>
                    {a.role}
                  </span>
                  {a.from && a.to && (
                    <span className="text-xs text-muted-foreground">
                      с {a.from.split("-").reverse().join(".")} по {a.to.split("-").reverse().join(".")}
                    </span>
                  )}
                  {expired && <span className="text-xs text-gray-500 dark:text-gray-400">срок истёк</span>}
                  {a.assignedBy && <span className="text-xs text-muted-foreground">· назначил(а): {a.assignedBy}</span>}
                  {a.reason && <span className="text-xs text-muted-foreground">· {a.reason}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      );
    })}
    {substitutionBadgeFor(user) && (
      <p className="text-xs text-violet-800 dark:text-violet-300">
        Действует временное замещение: «Уполномоченное лицо КД» — права ограничены этапом согласования КД.
      </p>
    )}
  </CardContent>
</Card>
```

Добавить `InfoRow` «Кем создана» в карточку «Основные данные» (после «Создан»):

```tsx
              <InfoRow label="Кем создана" value={user.createdBy ?? "—"} />
```

Метку статуса `blocked` в `STATUS_META` заменить на «Деактивирован».

- [ ] **Step 4: Сборка + сквозная проверка кликами**

Run: `corepack pnpm --filter promo build` → зелёная.

1. `/users` → «Создать пользователя» → заполнить → создать. В списке у новой строки «Кем создана» = ФИО текущего пользователя.
2. Открыть `/users/u-6` → вкладка «Роли и доступ» (**настоящий клик** по табу) → три группы, у временной роли период и основание.
3. «Редактировать» → сохранить без изменений ролей → перезагрузить страницу → временная роль **на месте** (регресс-проверка на потерю реестра).
4. Войти под `alieva@texnomart.uz` (администратор подразделения) → открыть чужую учётку своего подразделения → в форме роли «Администратор» и «Коммерческий директор» заблокированы.

- [ ] **Step 5: Коммит**

```bash
git add Promo/src/app/components/users/UsersPage.tsx Promo/src/app/components/users/UserDetailPage.tsx
git commit -m "feat(promo): 5D T5 — сохранение реестра ролей, группы ролей в профиле, «Кем создана»"
```

---

## Task 6: Панель замещения — сворачиваемая история, «Срок истёк», причина в аудит

**Files:**
- Modify: `Promo/src/app/components/users/KdSubstitutionPanel.tsx`

**Interfaces:**
- Consumes: `substitutionState` (Task 3); `Collapsible` из `@texnomart/ui/collapsible`.
- Produces: —

- [ ] **Step 1: Сворачиваемая история со счётчиком**

```tsx
import { ChevronDown, History, ShieldOff, UserCog } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@texnomart/ui/collapsible";
import { substitutionState } from "../../../lib/kd-substitution-store";

const [historyOpen, setHistoryOpen] = React.useState(false);
```

Обернуть блок истории:

```tsx
<Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
  <CollapsibleTrigger asChild>
    <button
      type="button"
      className="flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-accent"
    >
      <History className="size-4" />
      История замещений
      <span className="tabular-nums text-muted-foreground">({history.length})</span>
      <ChevronDown className={cn("ml-auto size-4 transition-transform", historyOpen && "rotate-180")} />
    </button>
  </CollapsibleTrigger>
  <CollapsibleContent className="pt-2">
    {/* существующий список <ul> без изменений, кроме статуса записи (Step 2) */}
  </CollapsibleContent>
</Collapsible>
```

`packages/ui/src/collapsible.tsx` в пакете есть — импорт валиден. Триггер — **нативный `<button>`**, а не shared `<Button>`: под `asChild` shared-кнопка не передаёт ref (уроки 2026-06-09 и Волны 1).

- [ ] **Step 2: Третье состояние записи**

Заменить тернарник `s.revokedAt ? … : …` на разбор состояния:

```tsx
{(() => {
  const state = substitutionState(s);
  if (state === "revoked")
    return <span className="text-xs text-gray-500 dark:text-gray-400">Снято <RuDate value={new Date(s.revokedAt!)} withTime /></span>;
  if (state === "expired")
    return <span className="text-xs text-gray-500 dark:text-gray-400">Срок истёк <RuDate value={parseDateOnly(s.to)} /></span>;
  return (
    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
      Назначено <RuDate value={new Date(s.assignedAt)} withTime /> · активно
    </span>
  );
})()}
```

- [ ] **Step 3: Причина в карточке активного замещения и в аудите**

В карточку активного замещения добавить строку под «Назначил»:

```tsx
              {active.reason && (
                <p className="text-xs text-muted-foreground">Основание: {active.reason}</p>
              )}
```

В `handleAssign` передать основание в событие (поле `reason` появится в Task 7; до него — в комментарий):

```tsx
    audit(
      "назначение замещения",
      substituteId,
      substitute?.fullName ?? "—",
      `Замещение КД: c ${formatDateFull(parseDateOnly(from))} по ${formatDateFull(parseDateOnly(to))}`,
      reason.trim()
    );
```

и расширить локальный `audit`-колбэк пятым аргументом `reason?: string`, прокидывая его в `appendAuditEvent({ …, reason })`.

- [ ] **Step 4: Сборка + проверка кликами**

Run: `corepack pnpm --filter promo build` → зелёная.

На `/users`: история свёрнута, в заголовке счётчик; клик разворачивает; активная запись «активно», прошедшая — «Срок истёк». Назначить замещение с причиной → в карточке видно «Основание: …».

- [ ] **Step 5: Коммит**

```bash
git add Promo/src/app/components/users/KdSubstitutionPanel.tsx
git commit -m "feat(promo): 5D T6 — сворачиваемая история замещений, состояние «Срок истёк», основание"
```

---

## Task 7: Аудит — «было → стало», основание, переименование действий

**Files:**
- Modify: `Promo/src/lib/promo-mock-data.ts` (`AuditFieldChange`, `AuditEvent`, `AuditActionType`, `AUDIT_ACTION_META`, сиды)
- Modify: `Promo/src/app/components/audit/AuditLogTable.tsx` (`NON_KEY_ACTIONS`, ячейка комментария, строки выгрузки)
- Modify: `Promo/src/app/components/users/UsersPage.tsx`, `UserDetailPage.tsx` (вызовы переименованных действий, `changes[]` при правке профиля)

**Interfaces:**
- Consumes: `appendAuditEvent` (существующий).
- Produces: `AuditFieldChange { field, before, after }`; `AuditEvent += changes?, reason?`; типы действий «деактивация»/«восстановление».

- [ ] **Step 1: Типы в `promo-mock-data.ts`**

```ts
/** Одно изменённое поле в аудит-записи (5D, стр. 71 п. 3). */
export interface AuditFieldChange {
  field: string;
  before: string;
  after: string;
}
```

В `AuditEvent` добавить:

```ts
  /** Изменённые поля «прежнее → новое» (5D). Для парольных действий НЕ заполняется. */
  changes?: AuditFieldChange[];
  /** Основание/комментарий действия (5D). */
  reason?: string;
```

В `AuditActionType` заменить `"блокировка"` → `"деактивация"`, `"разблокировка"` → `"восстановление"`; те же ключи заменить в `AUDIT_ACTION_META` (цвета не менять) и в сидах `AUDIT_EVENTS_SEED`, если они там встречаются.

- [ ] **Step 2: `NON_KEY_ACTIONS` в `AuditLogTable.tsx`**

```ts
  "деактивация", "восстановление", "изменение ролей",
```

(вместо `"блокировка", "разблокировка", "изменение ролей",`)

- [ ] **Step 3: Отображение изменений в ячейке «Комментарий»**

Колонку не добавляем — таблица уже сжата по «7-й части» §6.2; «было → стало» рендерится под комментарием:

```tsx
function CommentCell({ event }: { event: AuditEvent }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-gray-700 dark:text-gray-200">{event.comment ?? "—"}</span>
      {event.changes?.map((c, i) => (
        <span key={i} className="text-xs text-gray-500 dark:text-gray-400">
          {c.field}: <span className="line-through">{c.before || "—"}</span> → <span className="text-gray-700 dark:text-gray-200">{c.after || "—"}</span>
        </span>
      ))}
      {event.reason && (
        <span className="text-xs text-muted-foreground">Основание: {event.reason}</span>
      )}
    </div>
  );
}
```

Использовать её в ячейке комментария десктопной таблицы и в мобильной карточке.

В функции строк выгрузки (`e.comment ?? ""`) добавить последним элементом строку изменений:

```ts
    (e.changes ?? []).map((c) => `${c.field}: ${c.before || "—"} → ${c.after || "—"}`).join("; "),
    e.reason ?? "",
```

и соответствующие заголовки «Изменения», «Основание» в шапке выгрузки.

- [ ] **Step 4: Заполнение `changes[]` при правке профиля**

В `UserDetailPage.handleEditSubmit` собрать изменения до записи:

```tsx
    const changes: AuditFieldChange[] = [];
    const track = (field: string, before?: string, after?: string) => {
      if ((before ?? "") !== (after ?? "")) changes.push({ field, before: before ?? "—", after: after ?? "—" });
    };
    track("ФИО", user.fullName, value.fullName);
    track("Email", user.email, value.email);
    track("Подразделение", user.department, value.department);
    track("Должность", user.position, value.position);
    track("Руководитель", allUsers.find((u) => u.id === user.managerId)?.fullName,
                          allUsers.find((u) => u.id === value.managerId)?.fullName);
```

и передать их в событие «изменение профиля»; для «изменение ролей» — одну запись:

```tsx
      changes: [{ field: "Роли", before: prevRoles.join(", "), after: value.roles.join(", ") }],
```

Локальный `audit`-колбэк в обоих файлах расширить необязательными `changes`/`reason`, прокидывая в `appendAuditEvent`.

- [ ] **Step 5: Переименованные действия в вызовах**

`UsersPage.handleAction` и `UserDetailPage.handleToggleStatus`: `audit("блокировка", …)` → `audit("деактивация", …)`, `audit("разблокировка", …)` → `audit("восстановление", …)`.

- [ ] **Step 6: Сборка + проверка кликами**

Run: `corepack pnpm --filter promo build` → зелёная.

1. `/users/:id` → «Редактировать» → сменить должность → сохранить. Вкладка «Журнал действий»: запись «изменение профиля» со строкой «Должность: было → стало».
2. `/audit` → вкладка «Аудит-лог» (**настоящий клик** по табу) → переключатель «Все действия» (роль «Администратор») → та же запись видна, изменения под комментарием.
3. Грепнуть проект на остатки: `rg "блокировка|разблокировка" Promo/src` — только текст про блокировку входа в `LoginPage` и описания в `permissions.ts`.

- [ ] **Step 7: Коммит**

```bash
git add Promo/src/lib/promo-mock-data.ts Promo/src/app/components/audit/AuditLogTable.tsx Promo/src/app/components/users/UsersPage.tsx Promo/src/app/components/users/UserDetailPage.tsx
git commit -m "feat(promo): 5D T7 — аудит «было → стало» + основание, «деактивация»/«восстановление»"
```

---

## Task 8: Выгрузка учёток и матрица прав

**Files:**
- Modify: `Promo/src/lib/users-xlsx.ts`
- Modify: `Promo/src/lib/permissions.ts`

**Interfaces:**
- Consumes: `assignmentsOf`, `isAssignmentExpired` (Task 1).
- Produces: колонки выгрузки; capability `assign-temporary-role`.

- [ ] **Step 1: Колонки выгрузки**

Заменить единственную колонку ролей на три, добавить «Кем создана» и переименовать статус (это **четвёртый** сайт метки «Заблокирован», помимо трёх из T3/T5):

```ts
import * as XLSX from "xlsx";
import { type PromoUser } from "./users-store";
import { assignmentsOf, isAssignmentExpired } from "./user-roles";
import { exportStamp } from "./promo-export";

const STATUS_RU: Record<PromoUser["status"], string> = {
  active: "Активен",
  "temp-password": "Временный пароль",
  blocked: "Деактивирован",
};

export function exportUsersXlsx(users: PromoUser[]): void {
  const byId = new Map(users.map((u) => [u.id, u.fullName] as const));
  const header = [
    "ФИО", "Email", "Основная роль", "Дополнительные роли", "Временные роли",
    "Подразделение", "Должность", "Руководитель", "Статус", "Создан", "Кем создана",
  ];
  const rows = users.map((u) => {
    const a = assignmentsOf(u);
    return [
      u.fullName,
      u.email,
      a.find((x) => x.kind === "primary")?.role ?? u.role,
      a.filter((x) => x.kind === "additional").map((x) => x.role).join(", ") || "—",
      a
        .filter((x) => x.kind === "temporary")
        .map((x) => `${x.role} (${x.from ?? "—"}…${x.to ?? "—"}${isAssignmentExpired(x) ? ", срок истёк" : ""})`)
        .join("; ") || "—",
      u.department ?? "—",
      u.position ?? "—",
      u.managerId ? byId.get(u.managerId) ?? "—" : "—",
      STATUS_RU[u.status],
      new Date(u.createdAt).toLocaleDateString("ru-RU"),
      u.createdBy ?? "—",
    ];
  });
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Пользователи");
  XLSX.writeFile(wb, `Пользователи_${exportStamp()}.xlsx`);
}
```

Импорт `rolesOf` из этого файла уходит — он больше не используется.

- [ ] **Step 2: Capability**

В группу «Пользователи и доступ» `permissions.ts` добавить:

```ts
  {
    id: "assign-temporary-role",
    label: "Назначение временной роли с периодом",
    description: "Выдача роли на срок (дата начала и окончания); по истечении срок действия прекращается автоматически.",
    group: "Пользователи и доступ",
    enforcedIn: "addTemporaryRole · activeRolesOf · 5D",
    allowed: (r) => r === "Администратор",
  },
```

Заодно в описаниях `manage-users-global`/`manage-users-dept` слово «блокировка» заменить на «деактивация» (синхронно с Task 7).

- [ ] **Step 3: Сборка + проверка**

Run: `corepack pnpm --filter promo build` → зелёная.

На `/users` нажать «Экспорт» (**настоящий клик**), открыть скачанный `.xlsx` и убедиться, что шапка содержит 11 колонок, а у «Алиева Нигора» в «Временные роли» стоит «Директор маркетинга (2026-08-01…2026-08-31)». На `/permissions` → вкладка «Детальные права» → новая строка присутствует.

- [ ] **Step 4: Коммит**

```bash
git add Promo/src/lib/users-xlsx.ts Promo/src/lib/permissions.ts
git commit -m "feat(promo): 5D T8 — выгрузка учёток по типам ролей + capability временной роли"
```

---

## Task 9: Финальная проверка и документация

**Files:**
- Modify: `Promo/CLAUDE.md`, `docs/AI_CONTEXT.md`, `HISTORY.md`, `docs/promo_feedback_tracker.md`, `tasks/lessons.md`

- [ ] **Step 1: Оба билда**

```bash
corepack pnpm --filter promo build
corepack pnpm --filter dashboard build
```
Expected: обе зелёные (dashboard — доказательство, что общие пакеты не задеты).

- [ ] **Step 2: Матрица QA настоящими кликами**

| Проверка | Ожидание |
|---|---|
| `/users` под «Администратор», 1440px | Типы ролей, «Кем создана», «Деактивирован» в фильтре, свёрнутая история замещений |
| То же, 390px | Карточки не переполняются: `document.documentElement.scrollWidth === window.innerWidth` |
| Тёмная тема (переключатель в шапке) | Чипы ролей и статусы читаемы |
| Вход под `alieva@texnomart.uz` | Скоуп подразделения; роли «Администратор»/«Коммерческий директор» в форме заблокированы |
| Деактивация последнего админа | Блокируется гвардом «не менее двух администраторов» |
| Временная роль после перезагрузки | Сохранилась (localStorage), период и основание на месте |
| `/approvals` под `toshmatov@texnomart.uz` | Замещение работает как раньше: действует на этапе КД, конфликт интересов блокирует свою заявку — **регресс-проверка S3** |
| `/audit` → «Аудит-лог» → «Все действия» | Записи по учёткам с «было → стало» и основанием |

- [ ] **Step 3: Проверить 4 пункта «на проверку» из спеки**

1. Сброс пароля из меню действий `/users` — меню открывается в вьюпорте (`menu.getBoundingClientRect().top > 0`), пункт кликается, диалог с временным паролём появляется.
2. Изменение подразделения/должности/руководителя — попадает в журнал как «изменение профиля» с полями.
3. Замещение не даёт админ-прав: под `toshmatov@texnomart.uz` пункт «Пользователи» в навигации отсутствует / `/users` показывает заглушку доступа.
4. Назначение замещения не сдвигает сроки: до и после назначения значение SLA у элемента очереди `/approvals` одинаково.

- [ ] **Step 4: Обновить документацию**

`Promo/CLAUDE.md` (раздел Status), `docs/AI_CONTEXT.md` (шапка + перевод 5D в «complete», следующий шаг — Волна 6), `HISTORY.md` (запись блока), `docs/promo_feedback_tracker.md` (строка 5D в таблице блоков Волны 5), `tasks/lessons.md` (уроки блока — минимум: почему временная роль не проецируется в `activeRolesOf` и почему гварды считают постоянные роли).

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "docs(promo): 5D — документация и уроки блока «Пользователи, роли, замещение»"
```

---

## Проверка плана против спеки (выполнена)

| Требование спеки | Задача |
|---|---|
| G1 «кем создана» | T2 (запись), T3 (список), T5 (профиль), T8 (выгрузка) |
| G2 типы ролей | T1 (модель), T3 (список), T4 (форма), T5 (профиль), T8 (выгрузка) |
| G3 период временной роли | T1, T4, T5 |
| G4 «Деактивирован» | T3 (список, фильтр), T5 (деталь) |
| G5 сворачиваемая история | T6 |
| G6 «Срок истёк» | T3 (`substitutionState`), T6 (рендер) |
| G7 причина замещения в аудит | T6, T7 (поле `reason`) |
| G8 админ подразделения и роль КД | T4 (`lockedRoles`), T5 (проводка) |
| G9 «было → стало» | T7 |
| G10 основание и период в аудите | T6, T7 |
| G11 видимость временной роли и замещения | T3, T5 |
| §2.3 гварды по постоянным ролям | T2 |
| §4 сиды | T1 |
| §7 критерии готовности | T9 |
