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
