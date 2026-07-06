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
