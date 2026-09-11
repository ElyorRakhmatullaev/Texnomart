// E-2b — per-role notification config (which categories each role receives).
// localStorage `promo:notification-role-config`. Defaults reproduce the pre-E-2b
// audiences EXACTLY (no regression); the Администратор edits from there.
import { PROMO_ROLES, type PromoRole } from "../app/role-context";
import type { NotificationType, RoleNotificationConfig } from "./promo-mock-data";

// `-v2`: маршрутизация смежных подразделений исправлена (трекер, стр. 61 п.2).
// Сохранённый конфиг перекрывает дефолты, поэтому без смены ключа у тех, кто уже
// открывал экран настроек, осталась бы старая — неверная — раскладка.
const STORAGE_KEY = "promo:notification-role-config-v2";

// Операционные события промо (отмена, исключение позиции, маркетинг, назначение).
const OPS: NotificationType[] = [
  "campaign-cancelled",
  "line-removed",
  "marketing-reapproval",
  "km-assignment",
  "ad-approval",
];
// Отчётные события: первый отчёт и новая версия.
const REPORTS: NotificationType[] = ["report-new", "data-changed"];
/**
 * Волна 5 (5B) — контур согласования. Клиент перечислил события, которые
 * обязаны приходить КМ, старшему КМ и коммерческому директору: возврат на
 * корректировку, согласование КД, заявка о неучастии, назначение КМ, новое
 * промо на согласование, повторная отправка, окончание срока сегодня,
 * автопередача КД и просрочка SLA.
 */
const REVIEW: NotificationType[] = [
  "review-new",
  "review-returned",
  "review-resubmitted",
  "kd-approved",
  "non-participation",
  "auto-forwarded",
  "sla-overdue",
  "deadline-today",
];

/** Полный перечень — используется и для валидации сохранённого конфига. */
const ALL: NotificationType[] = [...OPS, ...REPORTS, ...REVIEW];
/**
 * Смежные подразделения (Маркетинг / Закуп / Аналитика) — ТОЛЬКО отчётные события.
 *
 * Трекер, стр. 61 п.2 (18.08.2026): «должны получать только уведомления "Новый
 * отчёт по акции" и "Новая версия отчёта" по отчётам своего подразделения. Сейчас
 * дополнительно приходят несвязанные события: назначение КМ, удаление позиции,
 * отмена акции и др.» Раньше набор включал `campaign-cancelled`, `line-removed` и
 * `km-assignment`, а сотрудник маркетинга получал вдобавок весь блок OPS.
 *
 * Операционный директор остаётся на своём наборе (`OD`) — он не смежное
 * подразделение, а участник цепочки согласования плана.
 */
const ADJACENT: NotificationType[] = [...REPORTS];
// Операционный директор: отчёты + отмена/исключение позиции + назначение КМ.
const OD: NotificationType[] = [
  ...REPORTS,
  "campaign-cancelled",
  "line-removed",
  "km-assignment",
];
// Старший КМ: весь контур согласования + назначение КМ.
const SENIOR_KM: NotificationType[] = [...REVIEW, "km-assignment"];
// КМ: то же, минус два события, адресованные проверяющим («поступило на
// согласование» и «повторно отправлено») — их инициирует сам КМ.
const KM: NotificationType[] = SENIOR_KM.filter(
  (t) => t !== "review-new" && t !== "review-resubmitted"
);

export const DEFAULT_ROLE_CONFIG: RoleNotificationConfig = {
  "Коммерческий директор": [...ALL],
  "Операционный директор": [...OD],
  "Директор маркетинга": [...OPS, ...REPORTS],
  "Категорийный менеджер (КМ)": [...KM],
  "Старший КМ": [...SENIOR_KM],
  "Сотрудник маркетинга": [...ADJACENT],
  "Сотрудник закупа": [...ADJACENT],
  "Сотрудник аналитики": [...ADJACENT],
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
