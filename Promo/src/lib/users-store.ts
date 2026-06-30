import type { PromoRole } from "../app/role-context";

export type UserStatus = "active" | "temp-password" | "blocked";

export interface PromoUser {
  id: string;
  fullName: string;
  email: string;
  role: PromoRole;
  status: UserStatus;
  /** Mock: простая строка, НЕ настоящий хэш (прототип, без бэкенда). */
  password: string;
  mustChangePassword: boolean;
  /** ISO-строка. */
  createdAt: string;
  /** ISO-строка последней смены пароля (добровольной или принудительной). */
  lastPasswordChangeAt?: string;
}

export interface NewUserInput {
  fullName: string;
  email: string;
  role: PromoRole;
}

const STORAGE_KEY = "promo:users";

// Стартовое состояние. >=2 активных Администратора (основной + резервный),
// «Сардор Мавлянов» (КД, под него же показываем имя в шапке по умолчанию),
// несколько функциональных ролей и один пользователь с временным паролём
// для демонстрации обязательной смены при первом входе.
const SEED_USERS: PromoUser[] = [
  { id: "u-1", fullName: "Сардор Мавлянов", email: "sardor@texnomart.uz", role: "Коммерческий директор", status: "active", password: "Director2026!", mustChangePassword: false, createdAt: "2026-01-10T09:00:00.000Z" },
  { id: "u-2", fullName: "Администратор Системы", email: "admin@texnomart.uz", role: "Администратор", status: "active", password: "Admin2026!", mustChangePassword: false, createdAt: "2026-01-10T09:00:00.000Z" },
  { id: "u-3", fullName: "Резервный Администратор", email: "reserv@texnomart.uz", role: "Администратор", status: "active", password: "Backup2026!", mustChangePassword: false, createdAt: "2026-01-10T09:00:00.000Z" },
  { id: "u-4", fullName: "Каримов Шохрух", email: "karimov@texnomart.uz", role: "Категорийный менеджер (КМ)", status: "active", password: "Manager2026!", mustChangePassword: false, createdAt: "2026-02-02T09:00:00.000Z" },
  { id: "u-5", fullName: "Исмаилов Жасур", email: "ismailov@texnomart.uz", role: "Старший КМ", status: "active", password: "Senior2026!", mustChangePassword: false, createdAt: "2026-02-02T09:00:00.000Z" },
  { id: "u-6", fullName: "Алиева Нигора", email: "alieva@texnomart.uz", role: "Сотрудник маркетинга", status: "active", password: "Market2026!", mustChangePassword: false, createdAt: "2026-03-15T09:00:00.000Z" },
  { id: "u-7", fullName: "Новый Сотрудник", email: "newuser@texnomart.uz", role: "Сотрудник закупа", status: "temp-password", password: "Temp1234!a", mustChangePassword: true, createdAt: "2026-06-20T09:00:00.000Z" },
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
    status: "temp-password",
    password: tempPassword,
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
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

/** Администраторы, способные войти (роль «Администратор» и не заблокированы). */
export function usableAdminCount(users: PromoUser[] = read()): number {
  return users.filter((u) => u.role === "Администратор" && u.status !== "blocked").length;
}

/** Можно ли отозвать у пользователя права администратора, не уронив пул < 2. */
export function canRevokeAdmin(id: string): boolean {
  const users = read();
  const target = users.find((u) => u.id === id);
  if (!target || target.role !== "Администратор") return false;
  const after = users.map((u) => (u.id === id ? { ...u, role: "Сотрудник закупа" as PromoRole } : u));
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
