// E-2b — per-role notification config (which categories each role receives).
// localStorage `promo:notification-role-config`. Defaults follow the agreed
// routing scheme (see below); the Администратор edits from there.
import { PROMO_ROLES, type PromoRole } from "../app/role-context";
import {
  roleReceivesNotification,
  type NotificationType,
  type PromoNotification,
  type RoleNotificationConfig,
} from "./promo-mock-data";

// `-v2`: маршрутизация смежных подразделений исправлена (трекер, стр. 61 п.2).
// `-v3`: КМ / старший КМ / КД приведены к согласованной схеме (проверка прода
// 14–15.09, №17 п.1). Сохранённый конфиг перекрывает дефолты, поэтому без смены
// ключа у тех, кто уже открывал экран настроек, осталась бы старая раскладка.
const STORAGE_KEY = "promo:notification-role-config-v3";

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
/*
 * КМ / старший КМ / КД — строго по согласованной схеме (трекер, D61; проверка
 * прода 14–15.09, №17 п.1 «по отдельным ролям отображаются лишние уведомления»).
 * Раньше КД получал все 15 типов, старший КМ — 9, КМ — 7.
 */
// КМ: возврат на корректировку (старшим КМ или КД), согласование КД, результат
// заявки о неучастии, назначение ответственным по промо.
const KM: NotificationType[] = [
  "review-returned",
  "kd-approved",
  "non-participation",
  "km-assignment",
];
// Старший КМ: новое промо на согласование, повторная отправка после
// корректировки, срок согласования истекает сегодня, передача КД по просрочке.
const SENIOR_KM: NotificationType[] = [
  "review-new",
  "review-resubmitted",
  "deadline-today",
  "auto-forwarded",
];
// КД: поступило на согласование КД, автопередача от старшего КМ, повторная
// отправка, срок истекает сегодня, срок просрочен.
const KD: NotificationType[] = [
  "review-new",
  "auto-forwarded",
  "review-resubmitted",
  "deadline-today",
  "sla-overdue",
];

export const DEFAULT_ROLE_CONFIG: RoleNotificationConfig = {
  "Коммерческий директор": [...KD],
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

/**
 * Кто получает КОНКРЕТНОЕ уведомление — с учётом адресата события, а не только
 * типа (см. `roleReceivesNotification`). Администратор — наблюдатель, не адресат.
 */
export function recipientsOf(
  n: Pick<PromoNotification, "type" | "visibleTo">,
  config: RoleNotificationConfig
): PromoRole[] {
  return PROMO_ROLES.filter(
    (r) => r !== "Администратор" && roleReceivesNotification(r, n, config)
  );
}
