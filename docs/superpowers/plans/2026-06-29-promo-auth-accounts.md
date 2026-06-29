# Promo — Авторизация и учётные записи (#0 + A) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить демо-вход (2FA + случайный гейт + один захардкоженный пользователь) на реальный поток учётных записей: стор пользователей в localStorage, вход с проверкой пароля без 2FA, временный пароль + обязательная смена при первом входе, экран управления пользователями (создание/сброс пароля/назначение-отзыв админа/деактивация) и живая запись действий администратора в аудит-лог.

**Architecture:** Фронт-only прототип. Новый `users-store.ts` (localStorage) — единственный источник правды о пользователях; `current-user-context.tsx` хранит вошедшего пользователя; `audit-store.ts` дозаписывает живые события поверх S8-сидов. UI собирается из существующих `@texnomart/ui` примитивов и общих паттернов. Гейтинг управления учётками — по активной роли (`useRole`), консистентно со всем приложением; свободный демо-переключатель ролей сохраняется.

**Tech Stack:** React 18 + TypeScript, React Router v7, Vite 6, Tailwind v4, shadcn/ui (`@texnomart/ui`), общие паттерны (`@texnomart/shared`), Lucide, sonner (toasts).

## Спецификация

Полный спек: [docs/superpowers/specs/2026-06-29-promo-auth-accounts-design.md](../specs/2026-06-29-promo-auth-accounts-design.md). Этот план реализует его целиком.

## Global Constraints

- Весь UI-текст — **на русском**. Даты — `DD.MM.YYYY` (`RuDate`).
- **НЕ** редактировать файлы в `packages/ui/src/` (автогенерённые shadcn-примитивы).
- **НЕ** менять общий `packages/shared/src/auth/auth-context.tsx` (его использует и Dashboard). Завершение входа в Promo делается вызовом существующего `verify2FA()` (он ставит `isAuthenticated` + пишет `sessionStorage.auth=true`).
- Цвета — точные hex через токены/существующие классы; жёлтый `#FFD60A` — только акцент.
- Ветка работы: **`feat/promo-auth-accounts`** (уже создана; на ней лежит коммит со спеком).
- **Нет тест-фреймворка** в проекте. Критерий приёмки каждой задачи: `corepack pnpm build:promo` проходит без ошибок (TypeScript + Vite) **плюс** явная ручная проверка в браузере, где задача меняет поведение. Каждая задача заканчивается коммитом.
- Команда сборки: `corepack pnpm build:promo` (pnpm доступен через corepack). Дев-сервер: `corepack pnpm dev:promo`.
- localStorage-ключи (зафиксированы): пользователи — `promo:users`; живой аудит — `promo:audit-live`; текущий пользователь — `promo:current-user-id`. Существующий ключ активной роли — `promo:current-role` (не менять).
- Демо-учётки (сиды, документировать в CLAUDE.md): основной админ `admin@texnomart.uz` / `Admin2026!`; пользователь с временным паролем `newuser@texnomart.uz` / `Temp1234!a` (для демонстрации обязательной смены).

---

## File Structure

**Создаются:**
- `Promo/src/lib/users-store.ts` — модель `PromoUser`, сиды, генерация временного пароля, CRUD-API, guard «≥2 админа», localStorage.
- `Promo/src/lib/audit-store.ts` — дозапись и чтение живых аудит-событий (localStorage).
- `Promo/src/app/current-user-context.tsx` — `CurrentUserProvider` + `useCurrentUser()`.
- `Promo/src/app/components/auth/NewPasswordForm.tsx` — переиспользуемая форма нового пароля (поля + счётчик надёжности + совпадение).
- `Promo/src/app/components/auth/ForcePasswordChangePage.tsx` — принудительная смена пароля при первом входе.
- `Promo/src/app/components/users/UsersPage.tsx` — экран управления пользователями (shell + состояние + действия + гейтинг).
- `Promo/src/app/components/users/UsersTable.tsx` — таблица (desktop) + карточки (mobile).
- `Promo/src/app/components/users/CreateUserDialog.tsx` — диалог создания пользователя.
- `Promo/src/app/components/users/TempPasswordDialog.tsx` — показ временного пароля (создание + сброс).

**Изменяются:**
- `Promo/src/lib/promo-mock-data.ts` — расширить `AuditActionType`/`AuditObjectType` + их `*_META`/`*_LABEL`.
- `Promo/src/app/App.tsx` — смонтировать `CurrentUserProvider`.
- `Promo/src/app/routes.tsx` — убрать `/login/2fa`; добавить `/change-password` и `/users`; в `ProtectedLayout` — редирект на смену пароля.
- `Promo/src/app/components/auth/LoginPage.tsx` — проверка по стору, без 2FA/случайного гейта, ветки temp-password/blocked.
- `Promo/src/app/shell-config.tsx` — данные текущего пользователя в шапке + пункт меню `/users` (роль Администратор).
- `Promo/src/app/components/AppShell.tsx` — прокинуть текущего пользователя в `createPromoShellConfig`.
- `Promo/src/app/components/audit/AuditLogTable.tsx` — слить живые события с сидами.

**Удаляется:**
- `Promo/src/app/components/auth/Login2FAPage.tsx` — 2FA убирается из потока.

---

## Task 1: Стор пользователей (`users-store.ts`)

**Files:**
- Create: `Promo/src/lib/users-store.ts`

**Interfaces:**
- Consumes: `PromoRole` из `Promo/src/app/role-context.tsx`.
- Produces:
  - `type UserStatus = 'active' | 'temp-password' | 'blocked'`
  - `interface PromoUser { id: string; fullName: string; email: string; role: PromoRole; status: UserStatus; password: string; mustChangePassword: boolean; createdAt: string }`
  - `interface NewUserInput { fullName: string; email: string; role: PromoRole }`
  - `getUsers(): PromoUser[]`
  - `getUserById(id: string): PromoUser | undefined`
  - `authenticate(email: string, password: string): PromoUser | null`
  - `createUser(input: NewUserInput): { user: PromoUser; tempPassword: string }`
  - `resetPassword(id: string): string`
  - `setUserRole(id: string, role: PromoRole): void`
  - `setUserStatus(id: string, status: UserStatus): void`
  - `updatePassword(id: string, newPassword: string): void`
  - `usableAdminCount(users?: PromoUser[]): number`
  - `canRevokeAdmin(id: string): boolean`
  - `canDeactivate(id: string): boolean`
  - `generateTempPassword(existing?: string[]): string`

- [ ] **Step 1: Создать файл стора**

Create `Promo/src/lib/users-store.ts`:

```ts
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
        ? { ...u, password: newPassword, status: "active", mustChangePassword: false }
        : u
    )
  );
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
```

- [ ] **Step 2: Проверить сборку**

Run: `corepack pnpm build:promo`
Expected: PASS (нет ошибок TypeScript; новый модуль ещё ни откуда не импортируется — это нормально).

- [ ] **Step 3: Коммит**

```bash
git add Promo/src/lib/users-store.ts
git commit -m "feat(promo): user store with localStorage + temp-password + >=2-admin guard"
```

---

## Task 2: Живой аудит-стор + расширение типов аудита

**Files:**
- Modify: `Promo/src/lib/promo-mock-data.ts:3079-3112` (типы и мета аудита)
- Create: `Promo/src/lib/audit-store.ts`

**Interfaces:**
- Consumes: `AuditEvent`, `AuditActionType`, `AuditObjectType` из `promo-mock-data.ts`.
- Produces:
  - `appendAuditEvent(input: Omit<AuditEvent, "id" | "at"> & { at?: Date }): void`
  - `getLiveAuditEvents(): AuditEvent[]`

- [ ] **Step 1: Расширить `AuditActionType` и его мету**

В `Promo/src/lib/promo-mock-data.ts` заменить блок `export type AuditActionType = …` (строки 3079-3087) на:

```ts
export type AuditActionType =
  | "создание"
  | "изменение"
  | "отправка на согласование"
  | "согласование"
  | "отклонение"
  | "отмена"
  | "Не участвует"
  | "отправка отчёта"
  | "сброс пароля"
  | "назначение прав"
  | "отзыв прав"
  | "блокировка"
  | "разблокировка";
```

В `AUDIT_ACTION_META` (после строки `"отправка отчёта": { … },`, перед закрывающей `};`) добавить:

```ts
  "сброс пароля": { bg: "bg-sky-50", text: "text-sky-700" },
  "назначение прав": { bg: "bg-indigo-50", text: "text-indigo-700" },
  "отзыв прав": { bg: "bg-orange-50", text: "text-orange-700" },
  "блокировка": { bg: "bg-rose-100", text: "text-rose-800" },
  "разблокировка": { bg: "bg-green-50", text: "text-green-700" },
```

- [ ] **Step 2: Расширить `AuditObjectType` и его лейбл**

Заменить строку 3090:

```ts
export type AuditObjectType = "акция" | "строка" | "отчёт" | "план" | "пользователь";
```

В `AUDIT_OBJECT_LABEL` добавить в объект:

```ts
  "пользователь": "Пользователь",
```

- [ ] **Step 3: Создать `audit-store.ts`**

Create `Promo/src/lib/audit-store.ts`:

```ts
import type { AuditEvent } from "./promo-mock-data";

const STORAGE_KEY = "promo:audit-live";

/** Сериализуемый вид (Date → ISO-строка). */
type StoredEvent = Omit<AuditEvent, "id" | "at"> & { at: string };

function read(): StoredEvent[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredEvent[];
  } catch {
    return [];
  }
}

export function appendAuditEvent(
  input: Omit<AuditEvent, "id" | "at"> & { at?: Date }
): void {
  if (typeof window === "undefined") return;
  const { at, ...rest } = input;
  const stored: StoredEvent = { ...rest, at: (at ?? new Date()).toISOString() };
  const all = read();
  all.push(stored);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/** Живые события с восстановленными Date и стабильными id (AUD-L####). */
export function getLiveAuditEvents(): AuditEvent[] {
  return read().map((e, i) => ({
    ...e,
    id: `AUD-L${String(i + 1).padStart(4, "0")}`,
    at: new Date(e.at),
  }));
}
```

- [ ] **Step 4: Проверить сборку**

Run: `corepack pnpm build:promo`
Expected: PASS. (Если `AuditLogFilters` строит список действий не из `AUDIT_ACTION_META`, новые типы всё равно компилируются; визуальную проверку фильтра делаем в Task 8.)

- [ ] **Step 5: Коммит**

```bash
git add Promo/src/lib/promo-mock-data.ts Promo/src/lib/audit-store.ts
git commit -m "feat(promo): live audit-log store + user-management audit action/object types"
```

---

## Task 3: Контекст текущего пользователя

**Files:**
- Create: `Promo/src/app/current-user-context.tsx`
- Modify: `Promo/src/app/App.tsx`

**Interfaces:**
- Consumes: `PromoUser`, `getUserById` из `users-store.ts`.
- Produces:
  - `CurrentUserProvider` (React component)
  - `useCurrentUser(): { currentUser: PromoUser | null; login(user: PromoUser): void; logout(): void; refresh(): void }`

- [ ] **Step 1: Создать контекст**

Create `Promo/src/app/current-user-context.tsx`:

```tsx
"use client";

import * as React from "react";
import { getUserById, type PromoUser } from "../lib/users-store";

const STORAGE_KEY = "promo:current-user-id";

interface CurrentUserValue {
  currentUser: PromoUser | null;
  login: (user: PromoUser) => void;
  logout: () => void;
  /** Перечитать текущего пользователя из стора (после смены пароля и т.п.). */
  refresh: () => void;
}

const CurrentUserContext = React.createContext<CurrentUserValue | undefined>(undefined);

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<PromoUser | null>(() => {
    if (typeof window === "undefined") return null;
    const id = window.sessionStorage.getItem(STORAGE_KEY);
    return id ? getUserById(id) ?? null : null;
  });

  const login = React.useCallback((user: PromoUser) => {
    window.sessionStorage.setItem(STORAGE_KEY, user.id);
    setCurrentUser(user);
  }, []);

  const logout = React.useCallback(() => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
  }, []);

  const refresh = React.useCallback(() => {
    setCurrentUser((prev) => (prev ? getUserById(prev.id) ?? null : null));
  }, []);

  const value = React.useMemo<CurrentUserValue>(
    () => ({ currentUser, login, logout, refresh }),
    [currentUser, login, logout, refresh]
  );

  return (
    <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = React.useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  return ctx;
}
```

- [ ] **Step 2: Смонтировать провайдер в `App.tsx`**

Заменить содержимое `Promo/src/app/App.tsx` на:

```tsx
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "./components/auth/AuthContext";
import { RoleProvider } from "./role-context";
import { CurrentUserProvider } from "./current-user-context";
import { router } from "./routes";

export default function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <CurrentUserProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors />
        </CurrentUserProvider>
      </RoleProvider>
    </AuthProvider>
  );
}
```

- [ ] **Step 3: Проверить сборку**

Run: `corepack pnpm build:promo`
Expected: PASS.

- [ ] **Step 4: Браузерная проверка**

Run: `corepack pnpm dev:promo`, открыть приложение, войти (пока старым путём — это исправит Task 4) и убедиться, что приложение грузится без ошибок в консоли.
Expected: приложение работает как раньше (провайдер пока пассивен).

- [ ] **Step 5: Коммит**

```bash
git add Promo/src/app/current-user-context.tsx Promo/src/app/App.tsx
git commit -m "feat(promo): current-user context (sessionStorage-backed identity)"
```

---

## Task 4: Переустройство входа (без 2FA, проверка по стору)

**Files:**
- Modify: `Promo/src/app/components/auth/LoginPage.tsx`
- Modify: `Promo/src/app/routes.tsx`
- Delete: `Promo/src/app/components/auth/Login2FAPage.tsx`

**Interfaces:**
- Consumes: `authenticate` (Task 1), `useCurrentUser` (Task 3), `useRole` (existing), `verify2FA` из `useAuth` (existing).

- [ ] **Step 1: Переписать `LoginPage.tsx`**

Заменить содержимое `Promo/src/app/components/auth/LoginPage.tsx` на:

```tsx
"use client";

import * as React from "react";
import { useNavigate, Link } from "react-router";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "./AuthContext";
import { useRole } from "../../role-context";
import { useCurrentUser } from "../../current-user-context";
import { authenticate } from "../../../lib/users-store";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Checkbox } from "@texnomart/ui/checkbox";
import { Label } from "@texnomart/ui/label";
import { Alert, AlertDescription } from "@texnomart/ui/alert";

export function LoginPage() {
  const navigate = useNavigate();
  // verify2FA() — единственный вызов из общего контекста, который ставит
  // isAuthenticated=true; 2FA-шаг в Promo убран, поэтому завершаем вход им.
  const { verify2FA } = useAuth();
  const { setCurrentRole } = useRole();
  const { login: setCurrentUser } = useCurrentUser();

  const [email, setEmail] = React.useState("admin@texnomart.uz");
  const [password, setPassword] = React.useState("Admin2026!");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = React.useState(0);
  const [blockedUntil, setBlockedUntil] = React.useState<number | null>(null);
  const [countdown, setCountdown] = React.useState("");

  React.useEffect(() => {
    if (!blockedUntil) return;
    const interval = setInterval(() => {
      const remaining = blockedUntil - Date.now();
      if (remaining <= 0) {
        setBlockedUntil(null);
        setFailedAttempts(0);
        setCountdown("");
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setCountdown(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [blockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockedUntil) return;

    setLoading(true);
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const user = authenticate(email, password);

    if (!user) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setError("Неверный email или пароль.");
      if (newAttempts >= 5) setBlockedUntil(Date.now() + 15 * 60 * 1000);
      setLoading(false);
      return;
    }

    if (user.status === "blocked") {
      setError("Учётная запись заблокирована. Обратитесь к администратору.");
      setLoading(false);
      return;
    }

    // Успех: фиксируем личность и активную роль, завершаем вход.
    setCurrentUser(user);
    setCurrentRole(user.role);
    verify2FA();
    setLoading(false);

    // Пользователь с временным паролём попадёт на принудительную смену
    // (редирект делает ProtectedLayout, Task 5); остальные — в систему.
    toast.success("Добро пожаловать в систему!");
    navigate("/");
  };

  const isBlocked = blockedUntil !== null;
  const showWarning = failedAttempts >= 3 && failedAttempts < 5;

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Добро пожаловать</h2>
          <p className="text-base text-gray-700">Войдите в свою учётную запись</p>
        </div>

        {error && !isBlocked && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showWarning && (
          <Alert variant="warning">
            <AlertDescription>
              Осталось {5 - failedAttempts} {5 - failedAttempts === 1 ? "попытка" : "попытки"}. После
              блокировка на 15 минут.
            </AlertDescription>
          </Alert>
        )}

        {isBlocked && (
          <Alert variant="destructive">
            <AlertDescription>Заблокировано. Повторите через {countdown}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email или телефон</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <Input
                id="email"
                type="text"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isBlocked || loading}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isBlocked || loading}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isBlocked}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={isBlocked}
              />
              <Label htmlFor="remember" className="cursor-pointer text-sm font-normal">
                Запомнить меня
              </Label>
            </div>
            <Link to="/login/forgot-password" className="text-sm text-primary hover:underline">
              Забыли пароль?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isBlocked || loading}>
            {loading ? "Вход..." : "Войти"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
```

- [ ] **Step 2: Убрать роут `/login/2fa` и импорт**

В `Promo/src/app/routes.tsx` удалить строку импорта:

```tsx
import { Login2FAPage } from "./components/auth/Login2FAPage";
```

и удалить дочерний роут `{ path: "2fa", Component: Login2FAPage },` из массива `children` ветки `/login` (строка 80).

- [ ] **Step 3: Удалить файл 2FA**

```bash
git rm Promo/src/app/components/auth/Login2FAPage.tsx
```

- [ ] **Step 4: Проверить сборку**

Run: `corepack pnpm build:promo`
Expected: PASS (нет ссылок на `Login2FAPage`).

- [ ] **Step 5: Браузерная проверка**

`corepack pnpm dev:promo`:
- Войти с предзаполненными `admin@texnomart.uz` / `Admin2026!` → сразу попадаешь в систему, **без 2FA**, с первого клика.
- Ввести неверный пароль → сообщение «Неверный email или пароль»; после 5 неудач — блокировка с обратным отсчётом.
- Перейти на `/login/2fa` вручную → больше нет такого экрана (роут не существует, GuestLayout/Router отдаёт fallback).

- [ ] **Step 6: Коммит**

```bash
git add Promo/src/app/components/auth/LoginPage.tsx Promo/src/app/routes.tsx
git commit -m "feat(promo): real login against user store, drop 2FA + random-success gate"
```

---

## Task 5: Принудительная смена пароля при первом входе

**Files:**
- Create: `Promo/src/app/components/auth/NewPasswordForm.tsx`
- Create: `Promo/src/app/components/auth/ForcePasswordChangePage.tsx`
- Modify: `Promo/src/app/routes.tsx`

**Interfaces:**
- Consumes: `useCurrentUser` (Task 3), `updatePassword` (Task 1), `useAuth` (existing).
- Produces: `NewPasswordForm` — переиспользуемая форма с пропсами `{ title: string; description: string; submitLabel: string; onSubmit: (password: string) => void | Promise<void> }`.

- [ ] **Step 1: Создать `NewPasswordForm.tsx`**

Create `Promo/src/app/components/auth/NewPasswordForm.tsx`:

```tsx
"use client";

import * as React from "react";
import { Lock, Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import { cn } from "@texnomart/ui/utils";

interface NewPasswordFormProps {
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (password: string) => void | Promise<void>;
}

export function NewPasswordForm({ title, description, submitLabel, onSubmit }: NewPasswordFormProps) {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const criteria = React.useMemo(
    () => ({
      minLength: password.length >= 10,
      hasUpperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }),
    [password]
  );
  const strength = React.useMemo(() => Object.values(criteria).filter(Boolean).length, [criteria]);
  const strengthColor = React.useMemo(() => {
    if (strength === 0) return "bg-gray-200";
    if (strength === 1) return "bg-red-500";
    if (strength === 2) return "bg-orange-500";
    if (strength === 3) return "bg-yellow-500";
    return "bg-green-500";
  }, [strength]);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const isValid = Object.values(criteria).every(Boolean) && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    await onSubmit(password);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-base text-gray-700">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Новый пароль</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {password && (
            <div className="space-y-2 pt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((segment) => (
                  <div
                    key={segment}
                    className={cn(
                      "h-2 flex-1 rounded-full transition-colors",
                      segment <= strength ? strengthColor : "bg-gray-200"
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <CriteriaItem met={criteria.minLength} text="Минимум 10 символов" />
            <CriteriaItem met={criteria.hasUpperLower} text="Заглавные и строчные буквы" />
            <CriteriaItem met={criteria.hasNumber} text="Хотя бы одна цифра" />
            <CriteriaItem met={criteria.hasSpecial} text="Хотя бы один спецсимвол" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {confirmPassword && (
            <div className="flex items-center gap-2 text-sm">
              {passwordsMatch ? (
                <>
                  <CheckCircle2 className="size-4 text-green-600" />
                  <span className="text-green-600">Пароли совпадают</span>
                </>
              ) : (
                <>
                  <Circle className="size-4 text-red-600" />
                  <span className="text-red-600">Пароли не совпадают</span>
                </>
              )}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={!isValid || loading}>
          {loading ? "Сохранение..." : submitLabel}
        </Button>
      </form>
    </div>
  );
}

function CriteriaItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle2 className={cn("size-4", met ? "text-green-600" : "text-gray-400")} />
      <span className={cn(met ? "text-green-600" : "text-gray-600")}>{text}</span>
    </div>
  );
}
```

- [ ] **Step 2: Создать `ForcePasswordChangePage.tsx`**

Create `Promo/src/app/components/auth/ForcePasswordChangePage.tsx`:

```tsx
"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { AuthLayout } from "./AuthLayout";
import { NewPasswordForm } from "./NewPasswordForm";
import { useCurrentUser } from "../../current-user-context";
import { updatePassword } from "../../../lib/users-store";

export function ForcePasswordChangePage() {
  const navigate = useNavigate();
  const { currentUser, refresh } = useCurrentUser();

  const handleSubmit = async (password: string) => {
    if (!currentUser) return;
    await new Promise((resolve) => setTimeout(resolve, 400));
    updatePassword(currentUser.id, password);
    refresh();
    toast.success("Пароль изменён. Добро пожаловать!");
    navigate("/", { replace: true });
  };

  return (
    <AuthLayout>
      <NewPasswordForm
        title="Смена пароля"
        description="Это первый вход — задайте постоянный пароль, чтобы продолжить."
        submitLabel="Сохранить и войти"
        onSubmit={handleSubmit}
      />
    </AuthLayout>
  );
}
```

- [ ] **Step 3: Добавить роут + редирект в `routes.tsx`**

В `Promo/src/app/routes.tsx`:

(a) Добавить импорты рядом с прочими auth-импортами:

```tsx
import { ForcePasswordChangePage } from "./components/auth/ForcePasswordChangePage";
import { useCurrentUser } from "./current-user-context";
```

(b) Заменить функцию `ProtectedLayout` на:

```tsx
function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  const { currentUser } = useCurrentUser();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Первый вход по временному паролю — никуда, кроме смены пароля.
  if (currentUser?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  return (
    <NotificationsProvider>
      <AppShell />
    </NotificationsProvider>
  );
}
```

(c) Добавить лёгкий гейт для полноэкранной смены пароля (после `GuestLayout`):

```tsx
/** Authenticated-only, но БЕЗ shell — для полноэкранной принудительной смены пароля. */
function RequireAuthBare() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

(d) Добавить роут верхнего уровня в массив `createBrowserRouter([...])` (между веткой `/login` и веткой `/`):

```tsx
  {
    path: "/change-password",
    Component: RequireAuthBare,
    children: [{ index: true, Component: ForcePasswordChangePage }],
  },
```

- [ ] **Step 4: Проверить сборку**

Run: `corepack pnpm build:promo`
Expected: PASS.

- [ ] **Step 5: Браузерная проверка**

`corepack pnpm dev:promo`:
- Войти как `newuser@texnomart.uz` / `Temp1234!a` → редирект на `/change-password`; в систему не пускает.
- Попробовать вручную открыть `/short-calendar` будучи на смене пароля → возвращает на `/change-password`.
- Задать новый пароль (например `Newpass2026!`) → попадаешь в систему. Выйти, войти снова `newuser@texnomart.uz` / `Newpass2026!` → входит сразу, без смены (флаг снят).

- [ ] **Step 6: Коммит**

```bash
git add Promo/src/app/components/auth/NewPasswordForm.tsx Promo/src/app/components/auth/ForcePasswordChangePage.tsx Promo/src/app/routes.tsx
git commit -m "feat(promo): forced password change on first login (temp-password flow)"
```

---

## Task 6: Имя текущего пользователя в шапке

**Files:**
- Modify: `Promo/src/app/shell-config.tsx`
- Modify: `Promo/src/app/components/AppShell.tsx`

**Interfaces:**
- Consumes: `useCurrentUser` (Task 3), `getInitials` из `@texnomart/shared/utils/formatters`.
- `createPromoShellConfig` получает третий аргумент `user`.

- [ ] **Step 1: Расширить `createPromoShellConfig`**

В `Promo/src/app/shell-config.tsx` заменить сигнатуру и блок `user` (строки 49-62).

Сигнатуру:

```tsx
export function createPromoShellConfig(
  currentRole: PromoRole,
  unreadNotifications = 0,
  user?: { name: string; initials: string }
): AppShellConfig {
```

Блок `user:` внутри возвращаемого объекта:

```tsx
    user: {
      name: user?.name ?? "Сардор Мавлянов",
      role: currentRole,
      initials: user?.initials ?? "СМ",
    },
```

- [ ] **Step 2: Прокинуть текущего пользователя из `AppShell.tsx`**

В `Promo/src/app/components/AppShell.tsx`:

(a) Добавить импорты:

```tsx
import { useCurrentUser } from "../current-user-context";
import { getInitials } from "@texnomart/shared/utils/formatters";
```

(b) Внутри `AppShell()` после `const { roles, currentRole, setCurrentRole } = useRole();` добавить:

```tsx
  const { currentUser } = useCurrentUser();
```

(c) Заменить мемо `config`:

```tsx
  const config = React.useMemo(
    () =>
      createPromoShellConfig(
        currentRole,
        unreadCount,
        currentUser
          ? { name: currentUser.fullName, initials: getInitials(currentUser.fullName) }
          : undefined
      ),
    [currentRole, unreadCount, currentUser]
  );
```

- [ ] **Step 3: Проверить сборку**

Run: `corepack pnpm build:promo`
Expected: PASS. (Если `getInitials` имеет другую сигнатуру — открыть `packages/shared/src/utils/formatters.ts` и вызвать согласно ей; ожидается `getInitials(fullName: string): string`.)

- [ ] **Step 4: Браузерная проверка**

`corepack pnpm dev:promo`: войти как `admin@texnomart.uz` → в правом верхнем меню имя «Администратор Системы» с инициалами «АС»; войти как `sardor@texnomart.uz` / `Director2026!` → «Сардор Мавлянов» / «СМ».

- [ ] **Step 5: Коммит**

```bash
git add Promo/src/app/shell-config.tsx Promo/src/app/components/AppShell.tsx
git commit -m "feat(promo): show logged-in user in the app shell header"
```

---

## Task 7a: Экран «Управление пользователями» — список + гейтинг + роут

**Files:**
- Create: `Promo/src/app/components/users/UsersPage.tsx`
- Create: `Promo/src/app/components/users/UsersTable.tsx`
- Modify: `Promo/src/app/routes.tsx`
- Modify: `Promo/src/app/shell-config.tsx`

**Interfaces:**
- Consumes: `getUsers`, `PromoUser`, `UserStatus` (Task 1), `useRole` (existing), общие `PageHeader`.
- Produces: `UsersPage`; `UsersTable` с пропсами `{ users: PromoUser[]; onAction: (action: UserRowAction, user: PromoUser) => void; canRevokeAdmin: (id: string) => boolean; canDeactivate: (id: string) => boolean }`; `type UserRowAction = "reset" | "toggle-admin" | "toggle-status"`.

- [ ] **Step 1: Создать `UsersTable.tsx`**

Create `Promo/src/app/components/users/UsersTable.tsx`:

```tsx
"use client";

import * as React from "react";
import { MoreVertical, KeyRound, ShieldCheck, ShieldOff, UserX, UserCheck } from "lucide-react";
import { Badge } from "@texnomart/ui/badge";
import { Button } from "@texnomart/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@texnomart/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@texnomart/ui/table";
import { cn } from "@texnomart/ui/utils";
import type { PromoUser } from "../../../lib/users-store";

export type UserRowAction = "reset" | "toggle-admin" | "toggle-status";

const STATUS_META: Record<PromoUser["status"], { label: string; cls: string }> = {
  active: { label: "Активен", cls: "bg-emerald-50 text-emerald-700" },
  "temp-password": { label: "Временный пароль", cls: "bg-amber-50 text-amber-700" },
  blocked: { label: "Заблокирован", cls: "bg-gray-200 text-gray-600" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU");
}

interface UsersTableProps {
  users: PromoUser[];
  onAction: (action: UserRowAction, user: PromoUser) => void;
  canRevokeAdmin: (id: string) => boolean;
  canDeactivate: (id: string) => boolean;
}

function RowMenu({ user, onAction, canRevokeAdmin, canDeactivate }: UsersTableProps & { user: PromoUser }) {
  const isAdmin = user.role === "Администратор";
  const isBlocked = user.status === "blocked";
  const revokeBlocked = isAdmin && !canRevokeAdmin(user.id);
  const deactivateBlocked = !isBlocked && !canDeactivate(user.id);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Действия">
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onAction("reset", user)}>
          <KeyRound className="mr-2 size-4" /> Сбросить пароль
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem
            disabled={revokeBlocked}
            title={revokeBlocked ? "Должно остаться не менее двух администраторов" : undefined}
            onClick={() => onAction("toggle-admin", user)}
          >
            <ShieldOff className="mr-2 size-4" /> Отозвать права администратора
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onAction("toggle-admin", user)}>
            <ShieldCheck className="mr-2 size-4" /> Назначить администратором
          </DropdownMenuItem>
        )}
        {isBlocked ? (
          <DropdownMenuItem onClick={() => onAction("toggle-status", user)}>
            <UserCheck className="mr-2 size-4" /> Активировать
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            disabled={deactivateBlocked}
            title={deactivateBlocked ? "Должно остаться не менее двух администраторов" : undefined}
            onClick={() => onAction("toggle-status", user)}
          >
            <UserX className="mr-2 size-4" /> Деактивировать
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UsersTable(props: UsersTableProps) {
  const { users } = props;
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:block">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="min-w-[200px]">ФИО</TableHead>
              <TableHead className="min-w-[200px]">Email</TableHead>
              <TableHead className="min-w-[200px]">Роль</TableHead>
              <TableHead className="w-[170px]">Статус</TableHead>
              <TableHead className="w-[130px]">Создан</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-gray-900">{u.fullName}</TableCell>
                <TableCell className="text-gray-700">{u.email}</TableCell>
                <TableCell className="text-gray-700">{u.role}</TableCell>
                <TableCell>
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[u.status].cls)}>
                    {STATUS_META[u.status].label}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums text-sm text-gray-600">{formatDate(u.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <RowMenu {...props} user={u} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {users.map((u) => (
          <div key={u.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-[0px_2px_4px_rgba(204,204,204,0.25)]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{u.fullName}</p>
                <p className="truncate text-sm text-gray-600">{u.email}</p>
              </div>
              <RowMenu {...props} user={u} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline" className="font-normal text-gray-600">{u.role}</Badge>
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[u.status].cls)}>
                {STATUS_META[u.status].label}
              </span>
              <span className="ml-auto tabular-nums text-xs text-gray-500">{formatDate(u.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Создать `UsersPage.tsx` (список + гейтинг; действия — заглушка-тост, заполним в 7b)**

Create `Promo/src/app/components/users/UsersPage.tsx`:

```tsx
"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { useRole } from "../../role-context";
import { getUsers, type PromoUser } from "../../../lib/users-store";
import { UsersTable, type UserRowAction } from "./UsersTable";

export function UsersPage() {
  const { currentRole } = useRole();
  const [users, setUsers] = React.useState<PromoUser[]>(() => getUsers());

  const reload = React.useCallback(() => setUsers(getUsers()), []);

  // Заглушки действий — реальные обработчики добавляются в Task 7b.
  const handleAction = React.useCallback((_action: UserRowAction, _user: PromoUser) => {
    reload();
  }, [reload]);

  if (currentRole !== "Администратор") {
    return (
      <div className="flex flex-col">
        <PageHeader title="Управление пользователями" />
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 bg-white py-16 text-center">
          <ShieldAlert className="size-12 text-gray-300" />
          <div>
            <p className="font-medium text-gray-900">Доступ только для администраторов</p>
            <p className="text-sm text-muted-foreground">
              Переключитесь на роль «Администратор», чтобы управлять учётными записями.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Управление пользователями" />
      <UsersTable
        users={users}
        onAction={handleAction}
        canRevokeAdmin={() => true}
        canDeactivate={() => true}
      />
    </div>
  );
}
```

- [ ] **Step 3: Добавить роут `/users`**

В `Promo/src/app/routes.tsx`:

(a) импорт:

```tsx
import { UsersPage } from "./components/users/UsersPage";
```

(b) в `children` ветки `/` (рядом с `{ path: "audit", … }`) добавить:

```tsx
      { path: "users", Component: UsersPage },
```

- [ ] **Step 4: Добавить пункт меню (роль Администратор)**

В `Promo/src/app/shell-config.tsx`:

(a) добавить иконку в импорт из `lucide-react`: `Users`.

(b) в группе «Система» (`navGroups`, после пункта «Аудит-лог») добавить:

```tsx
          {
            label: "Управление пользователями",
            icon: Users,
            href: "/users",
            roles: ["Администратор"],
          },
```

(c) в `breadcrumbRoutes` добавить:

```tsx
      { path: "/users", label: "Управление пользователями" },
```

- [ ] **Step 5: Проверить сборку**

Run: `corepack pnpm build:promo`
Expected: PASS.

- [ ] **Step 6: Браузерная проверка**

`corepack pnpm dev:promo`, войти как `admin@texnomart.uz`:
- В левом меню под «Система» виден пункт «Управление пользователями»; переключиться на роль «Коммерческий директор» → пункт исчезает; на странице (`/users` напрямую) — заглушка «Доступ только для администраторов».
- Под ролью «Администратор» страница показывает таблицу из 7 сид-пользователей; на мобильной ширине — карточки.

- [ ] **Step 7: Коммит**

```bash
git add Promo/src/app/components/users/UsersTable.tsx Promo/src/app/components/users/UsersPage.tsx Promo/src/app/routes.tsx Promo/src/app/shell-config.tsx
git commit -m "feat(promo): user-management screen (list + role gating + nav)"
```

---

## Task 7b: Действия над пользователями + аудит + guard

**Files:**
- Create: `Promo/src/app/components/users/CreateUserDialog.tsx`
- Create: `Promo/src/app/components/users/TempPasswordDialog.tsx`
- Modify: `Promo/src/app/components/users/UsersPage.tsx`

**Interfaces:**
- Consumes: `createUser`, `resetPassword`, `setUserRole`, `setUserStatus`, `canRevokeAdmin`, `canDeactivate` (Task 1), `appendAuditEvent` (Task 2), `useCurrentUser` (Task 3), `useRole` (existing), `PROMO_ROLES` (existing).
- Produces: `CreateUserDialog`, `TempPasswordDialog`.

- [ ] **Step 1: Создать `TempPasswordDialog.tsx`**

Create `Promo/src/app/components/users/TempPasswordDialog.tsx`:

```tsx
"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@texnomart/ui/dialog";
import { Button } from "@texnomart/ui/button";

interface TempPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  tempPassword: string | null;
}

export function TempPasswordDialog({ open, onOpenChange, userName, tempPassword }: TempPasswordDialogProps) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (open) setCopied(false);
  }, [open]);

  const copy = async () => {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
    } catch {
      /* clipboard может быть недоступен — пароль виден на экране */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Временный пароль</DialogTitle>
          <DialogDescription>
            Передайте этот пароль пользователю <b>{userName}</b>. При первом входе система потребует его сменить. Пароль показывается один раз.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <code className="flex-1 font-mono text-base tracking-wide text-gray-900">{tempPassword}</code>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={copy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Скопировано" : "Копировать"}
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Готово</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Создать `CreateUserDialog.tsx`**

Create `Promo/src/app/components/users/CreateUserDialog.tsx`:

```tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@texnomart/ui/dialog";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { PROMO_ROLES, type PromoRole } from "../../role-context";
import type { NewUserInput } from "../../../lib/users-store";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: NewUserInput) => void;
}

export function CreateUserDialog({ open, onOpenChange, onCreate }: CreateUserDialogProps) {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<PromoRole>("Категорийный менеджер (КМ)");

  React.useEffect(() => {
    if (open) {
      setFullName("");
      setEmail("");
      setRole("Категорийный менеджер (КМ)");
    }
  }, [open]);

  const emailValid = /\S+@\S+\.\S+/.test(email);
  const isValid = fullName.trim().length > 1 && emailValid;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onCreate({ fullName, email, role });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Новый пользователь</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">ФИО</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иванов Иван" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (логин)</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@texnomart.uz" required />
            {email && !emailValid && <p className="text-xs text-red-600">Введите корректный email.</p>}
          </div>
          <div className="space-y-2">
            <Label>Роль</Label>
            <Select value={role} onValueChange={(v) => setRole(v as PromoRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROMO_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={!isValid}>Создать</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Подключить действия в `UsersPage.tsx`**

Заменить содержимое `Promo/src/app/components/users/UsersPage.tsx` на:

```tsx
"use client";

import * as React from "react";
import { ShieldAlert, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@texnomart/ui/button";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { useRole } from "../../role-context";
import { useCurrentUser } from "../../current-user-context";
import {
  getUsers,
  createUser,
  resetPassword,
  setUserRole,
  setUserStatus,
  canRevokeAdmin,
  canDeactivate,
  type PromoUser,
  type NewUserInput,
} from "../../../lib/users-store";
import { appendAuditEvent } from "../../../lib/audit-store";
import { UsersTable, type UserRowAction } from "./UsersTable";
import { CreateUserDialog } from "./CreateUserDialog";
import { TempPasswordDialog } from "./TempPasswordDialog";
import type { AuditActionType } from "../../../lib/promo-mock-data";

export function UsersPage() {
  const { currentRole } = useRole();
  const { currentUser } = useCurrentUser();
  const [users, setUsers] = React.useState<PromoUser[]>(() => getUsers());
  const [createOpen, setCreateOpen] = React.useState(false);
  const [tempPassword, setTempPassword] = React.useState<string | null>(null);
  const [tempUserName, setTempUserName] = React.useState("");
  const [tempOpen, setTempOpen] = React.useState(false);

  const reload = React.useCallback(() => setUsers(getUsers()), []);

  const audit = React.useCallback(
    (action: AuditActionType, target: PromoUser, comment: string) => {
      appendAuditEvent({
        user: currentUser?.fullName ?? "—",
        role: currentRole,
        action,
        objectType: "пользователь",
        objectLabel: target.fullName,
        comment,
      });
    },
    [currentUser, currentRole]
  );

  const handleCreate = React.useCallback(
    (input: NewUserInput) => {
      const { user, tempPassword: pwd } = createUser(input);
      audit("создание", user, `Создан пользователь · роль «${user.role}»`);
      setCreateOpen(false);
      setTempUserName(user.fullName);
      setTempPassword(pwd);
      setTempOpen(true);
      reload();
      toast.success("Пользователь создан");
    },
    [audit, reload]
  );

  const handleAction = React.useCallback(
    (action: UserRowAction, user: PromoUser) => {
      if (action === "reset") {
        const pwd = resetPassword(user.id);
        audit("сброс пароля", user, "Сброшен пароль, выдан новый временный");
        setTempUserName(user.fullName);
        setTempPassword(pwd);
        setTempOpen(true);
        reload();
        toast.success("Пароль сброшен");
        return;
      }
      if (action === "toggle-admin") {
        if (user.role === "Администратор") {
          if (!canRevokeAdmin(user.id)) {
            toast.error("Должно остаться не менее двух администраторов");
            return;
          }
          setUserRole(user.id, "Сотрудник закупа");
          audit("отзыв прав", user, "Отозваны права администратора");
          toast.success("Права администратора отозваны");
        } else {
          setUserRole(user.id, "Администратор");
          audit("назначение прав", { ...user, role: "Администратор" }, "Назначены права администратора");
          toast.success("Назначены права администратора");
        }
        reload();
        return;
      }
      if (action === "toggle-status") {
        if (user.status === "blocked") {
          setUserStatus(user.id, "active");
          audit("разблокировка", user, "Учётная запись активирована");
          toast.success("Пользователь активирован");
        } else {
          if (!canDeactivate(user.id)) {
            toast.error("Должно остаться не менее двух администраторов");
            return;
          }
          setUserStatus(user.id, "blocked");
          audit("блокировка", user, "Учётная запись деактивирована");
          toast.success("Пользователь деактивирован");
        }
        reload();
      }
    },
    [audit, reload]
  );

  if (currentRole !== "Администратор") {
    return (
      <div className="flex flex-col">
        <PageHeader title="Управление пользователями" />
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 bg-white py-16 text-center">
          <ShieldAlert className="size-12 text-gray-300" />
          <div>
            <p className="font-medium text-gray-900">Доступ только для администраторов</p>
            <p className="text-sm text-muted-foreground">
              Переключитесь на роль «Администратор», чтобы управлять учётными записями.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Управление пользователями"
        actions={
          <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <UserPlus className="size-4" /> Создать пользователя
          </Button>
        }
      />
      <UsersTable
        users={users}
        onAction={handleAction}
        canRevokeAdmin={canRevokeAdmin}
        canDeactivate={canDeactivate}
      />
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />
      <TempPasswordDialog
        open={tempOpen}
        onOpenChange={setTempOpen}
        userName={tempUserName}
        tempPassword={tempPassword}
      />
    </div>
  );
}
```

> Примечание: `PageHeader` принимает `actions` (см. использование в других Promo-экранах, напр. `ShortCalendarPage`). Если проп называется иначе — открыть `packages/shared/src/components/page-header.tsx` и подставить корректное имя.

- [ ] **Step 4: Проверить сборку**

Run: `corepack pnpm build:promo`
Expected: PASS.

- [ ] **Step 5: Браузерная проверка**

`corepack pnpm dev:promo`, роль «Администратор», `/users`:
- «Создать пользователя» → форма → создаётся → появляется диалог с временным паролём, «Копировать» работает; в списке появился новый пользователь со статусом «Временный пароль».
- «Сбросить пароль» у любого → диалог с новым временным паролём; статус строки → «Временный пароль».
- «Назначить администратором» у обычного → роль становится «Администратор».
- Попробовать «Отозвать права администратора» когда активных админов всего два → пункт задизейблен (тултип про «не менее двух»). Сначала назначить третьего админа → теперь отзыв у одного из исходных доступен.
- «Деактивировать» обычного → статус «Заблокирован»; «Активировать» возвращает «Активен». Деактивация админа, оставляющая < 2 активных админов, заблокирована.
- Выйти и войти под только что созданным пользователем с показанным временным паролём → принудительная смена пароля (поток Task 5).

- [ ] **Step 6: Коммит**

```bash
git add Promo/src/app/components/users/CreateUserDialog.tsx Promo/src/app/components/users/TempPasswordDialog.tsx Promo/src/app/components/users/UsersPage.tsx
git commit -m "feat(promo): user actions (create/reset/assign-revoke-admin/deactivate) + audit + >=2-admin guard"
```

---

## Task 8: Слияние живого аудита в журнал

**Files:**
- Modify: `Promo/src/app/components/audit/AuditLogTable.tsx:90-91`

**Interfaces:**
- Consumes: `getLiveAuditEvents` (Task 2), `buildAuditLog` (existing).

- [ ] **Step 1: Слить живые события с сидами**

В `Promo/src/app/components/audit/AuditLogTable.tsx`:

(a) добавить импорт:

```tsx
import { getLiveAuditEvents } from "../../../lib/audit-store";
```

(b) заменить строку 91:

```tsx
  const events = React.useMemo(() => buildAuditLog(), []);
```

на:

```tsx
  // Сиды (S8) + живые события модуля учёток (localStorage), новые сверху.
  const events = React.useMemo(() => {
    const merged = [...getLiveAuditEvents(), ...buildAuditLog()];
    return merged.sort((a, b) => b.at.getTime() - a.at.getTime());
  }, []);
```

- [ ] **Step 2: Проверить сборку**

Run: `corepack pnpm build:promo`
Expected: PASS.

- [ ] **Step 3: Браузерная проверка**

`corepack pnpm dev:promo`, роль «Администратор»:
- На `/users` создать пользователя и сбросить кому-то пароль.
- Перейти на `/audit` → вверху журнала видны свежие записи: объект «Пользователь», действия «создание» / «сброс пароля», колонка «Пользователь» = имя текущего админа + роль «Администратор», корректные дата/время.
- Открыть фильтр «Тип действия» — проверить, что новые типы (сброс пароля / назначение прав / отзыв прав / блокировка) доступны для фильтрации. Если их нет — в `AuditLogFilters` список действий строить из `Object.keys(AUDIT_ACTION_META)` (открыть `Promo/src/app/components/audit/AuditLogFilters.tsx` и поправить источник опций).

- [ ] **Step 4: Коммит**

```bash
git add Promo/src/app/components/audit/AuditLogTable.tsx
git commit -m "feat(promo): surface live admin actions in the audit log"
```

---

## Task 9: Синхронизация документации

**Files:**
- Modify: `Promo/CLAUDE.md`
- Modify: `docs/AI_CONTEXT.md`
- Modify: `HISTORY.md`

- [ ] **Step 1: Обновить `Promo/CLAUDE.md`**

- В блоке Routes добавить строки для `/users` (Управление пользователями — Администратор) и `/change-password` (принудительная смена пароля).
- В строке демо-входа заменить описание «2FA `123456` + 30%-random» на новый поток: вход без 2FA, реальная проверка по стору; демо-учётки `admin@texnomart.uz` / `Admin2026!` (Администратор) и `newuser@texnomart.uz` / `Temp1234!a` (демонстрация обязательной смены пароля).
- В Project Structure упомянуть `lib/users-store.ts`, `lib/audit-store.ts`, `app/current-user-context.tsx`, `components/users/*`, `components/auth/NewPasswordForm.tsx` + `ForcePasswordChangePage.tsx`.
- Отметить: аудит-лог теперь дозаписывает живые действия модуля учёток (остальные экраны по-прежнему seed-stale).

- [ ] **Step 2: Обновить `docs/AI_CONTEXT.md`**

- Обновить шапку «Last updated» (дата 2026-06-29) с одним абзацем про под-проект #0+A.
- В «Демо login» заменить описание Promo-входа на новый (без 2FA, проверка по стору, демо-учётки).
- В «Known Issues & TODOs» добавить выполненный пункт про auth/accounts и отметить, что остаются под-проекты B (тёмная тема), C (Профиль/Настройки), D (матрица прав) из 3-го раунда фидбэка.

- [ ] **Step 3: Обновить `HISTORY.md`**

Добавить запись (дата 2026-06-29) с резюме: декомпозиция 3-го раунда фидбэка на 4 под-проекта; реализован #0+A — стор пользователей (localStorage), вход без 2FA с проверкой пароля, временный пароль + обязательная смена, экран управления учётками с guard «≥2 админа», живой аудит админ-действий. Перечислить mock-ограничения (localStorage на браузер, пароли-строки, god-mode переключатель).

- [ ] **Step 4: Проверить сборку (документация не ломает билд, но прогнать для чистоты)**

Run: `corepack pnpm build:promo`
Expected: PASS.

- [ ] **Step 5: Коммит**

```bash
git add Promo/CLAUDE.md docs/AI_CONTEXT.md HISTORY.md
git commit -m "docs(promo): sync for auth & accounts (#0+A)"
```

---

## Self-Review (выполнено при написании плана)

**1. Покрытие спека:**
- Отключение 2FA → Task 4. ✓
- ≥2 администратора (сиды + guard) → Task 1 (сиды `u-2`/`u-3`, `usableAdminCount`, `canRevokeAdmin`, `canDeactivate`), Task 7b (применение guard). ✓
- Создание пользователей / сброс пароля / назначение-отзыв админа → Task 7b. ✓
- Уникальный временный пароль + обязательная смена при первом входе → Task 1 (`generateTempPassword`, `createUser`), Task 5 (принудительная смена). ✓
- Фиксация действий администратора в аудит-логе (пользователь + роль) → Task 2 (стор + типы), Task 7b (append), Task 8 (отображение). ✓
- «Текущий пользователь» (фундамент) → Task 3 + Task 6 (отображение в шапке). ✓
- localStorage-персистентность → Tasks 1, 2, 3. ✓
- Сохранение свободного демо-переключателя ролей → не трогается (роль ставится при входе, переключатель остаётся). ✓

**2. Placeholder scan:** заглушек нет; обработчики действий заполняются в Task 7b (в 7a временно отдают reload — это явно помечено, а не «TODO»).

**3. Type consistency:** `PromoUser`/`UserStatus`/`NewUserInput`/`UserRowAction` согласованы между Task 1, 7a, 7b; `appendAuditEvent` принимает `Omit<AuditEvent,"id"|"at">` — поля (`user`, `role`, `action`, `objectType`, `objectLabel`, `comment`) совпадают с расширенным `AuditEvent`; `objectType: "пользователь"` и новые `AuditActionType` добавлены в Task 2 до их использования в Task 7b; `verify2FA` берётся из существующего `useAuth`.

**Точки, требующие сверки при исполнении (помечены в шагах):** сигнатура `getInitials` (Task 6), имя пропа `actions`/`PageHeader` (Task 7b), источник опций «Тип действия» в `AuditLogFilters` (Task 8).
