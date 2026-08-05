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

/**
 * Минимальный носитель ролей: модуль намеренно НЕ импортирует `PromoUser`,
 * иначе получится цикл `users-store` → `user-roles` → `users-store`.
 */
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
 * Обратная совместимость по конструкции: старый снапшот localStorage
 * читается без миграции.
 */
export function assignmentsOf(user: RoleCarrier): RoleAssignment[] {
  const stored = user.roleAssignments;
  if (stored && stored.length > 0) {
    // Нормализация: ровно одна primary. Если её нет — первая постоянная запись становится основной.
    if (stored.some((a) => a.kind === "primary")) return stored;
    const firstPermanent = stored.findIndex((a) => a.kind !== "temporary");
    if (firstPermanent < 0) return stored;
    return stored.map((a, i) =>
      i === firstPermanent ? { ...a, kind: "primary" as RoleKind } : a
    );
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

/**
 * Постоянные роли (primary + additional) — база для гвардов администраторов:
 * временный «Администратор» не должен держать пул ≥2 (см. users-store).
 */
export function permanentRolesOf(user: RoleCarrier): PromoRole[] {
  return dedupe(
    assignmentsOf(user)
      .filter((a) => a.kind !== "temporary")
      .map((a) => a.role)
  );
}

/**
 * Постоянные + временные, ДЕЙСТВУЮЩИЕ на `ref`. Это «текущие права» пользователя.
 * Истечение временной роли считается здесь, при чтении, — планировщика в моке нет
 * и не требуется («после окончания периода роль снимается автоматически»).
 */
export function activeRolesOf(user: RoleCarrier, ref: Date = new Date()): PromoRole[] {
  return dedupe(
    assignmentsOf(user)
      .filter((a) => isAssignmentActive(a, ref))
      .map((a) => a.role)
  );
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
