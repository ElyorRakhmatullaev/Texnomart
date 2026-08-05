import type { PromoRole } from "../app/role-context";
import { activeRolesOf, type RoleAssignment } from "./user-roles";

export type { RoleAssignment, RoleKind, RoleCarrier } from "./user-roles";
export {
  ROLE_KIND_LABEL,
  assignmentsOf,
  permanentRolesOf,
  primaryRoleOf,
  temporaryAssignments,
  isAssignmentActive,
  isAssignmentExpired,
} from "./user-roles";

export type UserStatus = "active" | "temp-password" | "blocked";

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
  /**
   * Реестр ролей (5D): основная / дополнительные / временные с периодом.
   * Отсутствует у старых снапшотов localStorage — тогда строится из `roles`/`role`.
   */
  roleAssignments?: RoleAssignment[];
  /** ФИО создателя учётной записи (5D, стр. 66 п. 2). */
  createdBy?: string;
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

/**
 * Полный набор ДЕЙСТВУЮЩИХ ролей пользователя (E-4 · 5D). Читайте роли ТОЛЬКО
 * через этот хелпер: истёкшие временные роли сюда не попадают. Где нужны именно
 * постоянные роли (гварды администраторов) — `permanentRolesOf`.
 */
export function rolesOf(user: PromoUser): PromoRole[] {
  return activeRolesOf(user);
}

export interface NewUserInput {
  fullName: string;
  email: string;
  role: PromoRole;
  roles?: PromoRole[];
  department?: string;
  position?: string;
  managerId?: string;
}

const STORAGE_KEY = "promo:users";

// Стартовое состояние. >=2 активных Администратора (основной + резервный),
// «Сардор Мавлянов» (КД, под него же показываем имя в шапке по умолчанию),
// несколько функциональных ролей и один пользователь с временным паролём
// для демонстрации обязательной смены при первом входе.
const SEED_USERS: PromoUser[] = [
  { id: "u-1", fullName: "Сардор Мавлянов", email: "sardor@texnomart.uz", role: "Коммерческий директор", roles: ["Коммерческий директор"], status: "active", password: "Director2026!", mustChangePassword: false, createdAt: "2026-01-10T09:00:00.000Z", department: "Коммерческий департамент", position: "Коммерческий директор", createdBy: "Администратор Системы" },
  { id: "u-2", fullName: "Администратор Системы", email: "admin@texnomart.uz", role: "Администратор", roles: ["Администратор"], status: "active", password: "Admin2026!", mustChangePassword: false, createdAt: "2026-01-10T09:00:00.000Z", department: "ИТ / Администрирование", position: "Системный администратор", createdBy: "Первичная настройка системы" },
  { id: "u-3", fullName: "Резервный Администратор", email: "reserv@texnomart.uz", role: "Администратор", roles: ["Администратор"], status: "active", password: "Backup2026!", mustChangePassword: false, createdAt: "2026-01-10T09:00:00.000Z", department: "ИТ / Администрирование", position: "Системный администратор", createdBy: "Администратор Системы" },
  // u-4 — истёкшая временная роль: демонстрирует, что права по окончании периода не действуют.
  {
    id: "u-4", fullName: "Каримов Шохрух", email: "karimov@texnomart.uz", role: "Категорийный менеджер (КМ)", roles: ["Категорийный менеджер (КМ)"], status: "active", password: "Manager2026!", mustChangePassword: false, createdAt: "2026-02-02T09:00:00.000Z", department: "Категорийный менеджмент", position: "Категорийный менеджер", managerId: "u-5", kmId: "km-3", createdBy: "Администратор Системы",
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
  },
  { id: "u-5", fullName: "Исмаилов Жасур", email: "ismailov@texnomart.uz", role: "Старший КМ", roles: ["Старший КМ", "Категорийный менеджер (КМ)"], status: "active", password: "Senior2026!", mustChangePassword: false, createdAt: "2026-02-02T09:00:00.000Z", department: "Категорийный менеджмент", position: "Старший категорийный менеджер", managerId: "u-1", kmId: "km-6", createdBy: "Администратор Системы" },
  // u-6 — активная временная роль (окно вокруг демо-даты 2026-08-05).
  {
    id: "u-6", fullName: "Алиева Нигора", email: "alieva@texnomart.uz", role: "Сотрудник маркетинга", roles: ["Сотрудник маркетинга"], status: "active", password: "Market2026!", mustChangePassword: false, createdAt: "2026-03-15T09:00:00.000Z", department: "Маркетинг", position: "Маркетолог", managerId: "u-1", adminScope: { kind: "department", department: "Маркетинг" }, createdBy: "Администратор Системы",
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
  },
  { id: "u-7", fullName: "Новый Сотрудник", email: "newuser@texnomart.uz", role: "Сотрудник закупа", roles: ["Сотрудник закупа"], status: "temp-password", password: "Temp1234!a", mustChangePassword: true, createdAt: "2026-06-20T09:00:00.000Z", department: "Закуп", position: "Специалист по закупкам", managerId: "u-1", createdBy: "Алиева Нигора" },
  { id: "u-8", fullName: "Тошматов Фаррух", email: "toshmatov@texnomart.uz", role: "Категорийный менеджер (КМ)", roles: ["Категорийный менеджер (КМ)"], status: "active", password: "Manager2026!", mustChangePassword: false, createdAt: "2026-02-10T09:00:00.000Z", department: "Категорийный менеджмент", position: "Категорийный менеджер", managerId: "u-5", kmId: "km-5", createdBy: "Администратор Системы" },
];

function read(): PromoUser[] {
  if (typeof window === "undefined") return [...SEED_USERS];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_USERS));
    return [...SEED_USERS];
  }
  try {
    return JSON.parse(raw) as PromoUser[];
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_USERS));
    return [...SEED_USERS];
  }
}

function write(users: PromoUser[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function getUsers(): PromoUser[] {
  return read();
}

export function getUserById(id: string): PromoUser | undefined {
  return read().find((u) => u.id === id);
}

export function authenticate(email: string, password: string): PromoUser | null {
  const user = read().find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (!user || user.password !== password) return null;
  return user;
}

export function generateTempPassword(existing: string[] = []): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%*?";
  const all = upper + lower + digits + special;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  for (let attempt = 0; attempt < 50; attempt++) {
    let chars = [pick(upper), pick(lower), pick(digits), pick(special)];
    for (let i = 0; i < 8; i++) chars.push(pick(all));
    // перемешать, чтобы обязательные классы не стояли всегда в начале
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const pwd = chars.join("");
    if (!existing.includes(pwd)) return pwd;
  }
  // крайне маловероятный фолбэк
  return `Tmp${Date.now()}!a`;
}

export function createUser(input: NewUserInput): { user: PromoUser; tempPassword: string } {
  const users = read();
  const tempPassword = generateTempPassword(users.map((u) => u.password));
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
  write([...users, user]);
  return { user, tempPassword };
}

export function resetPassword(id: string): string {
  const users = read();
  const tempPassword = generateTempPassword(users.map((u) => u.password));
  write(
    users.map((u) =>
      u.id === id
        ? { ...u, password: tempPassword, status: "temp-password", mustChangePassword: true }
        : u
    )
  );
  return tempPassword;
}

export function setUserRole(id: string, role: PromoRole): void {
  write(read().map((u) => (u.id === id ? { ...u, role } : u)));
}

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

export function setUserStatus(id: string, status: UserStatus): void {
  write(read().map((u) => (u.id === id ? { ...u, status } : u)));
}

export function updatePassword(id: string, newPassword: string): void {
  write(
    read().map((u) =>
      u.id === id
        ? {
            ...u,
            password: newPassword,
            status: "active",
            mustChangePassword: false,
            lastPasswordChangeAt: new Date().toISOString(),
          }
        : u
    )
  );
}

/** Самостоятельное изменение ФИО (экран «Профиль»). */
export function updateUserName(id: string, fullName: string): void {
  const trimmed = fullName.trim();
  write(read().map((u) => (u.id === id ? { ...u, fullName: trimmed } : u)));
}

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

/** Можно ли деактивировать пользователя, не уронив пул админов < 2. */
export function canDeactivate(id: string): boolean {
  const users = read();
  const target = users.find((u) => u.id === id);
  if (!target) return false;
  if (target.status === "blocked") return false;
  const after = users.map((u) => (u.id === id ? { ...u, status: "blocked" as UserStatus } : u));
  return usableAdminCount(after) >= 2;
}

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
