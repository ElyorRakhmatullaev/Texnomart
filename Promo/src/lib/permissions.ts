"use client";

/**
 * Sub-project D — Матрица прав (документ + консолидация).
 *
 * Single source of truth for the role→permission picture. Two layers:
 *
 *  1. ACCESS_MATRIX — the high-level «Сводная таблица доступа» (prompt-pack
 *     Appendix D): 9 roles × 5 functional areas, each cell carrying an access
 *     LEVEL + the spec's own wording. This is the «документ».
 *
 *  2. CAPABILITIES — a granular capability list whose `allowed(role)` predicates
 *     are DERIVED LIVE from the real gating helpers scattered across
 *     `promo-mock-data.ts` (getFullCalendarAccess, getReportAccess,
 *     getPromoTypeSettingsAccess, canCancelCampaign, canApproveDeadline, …) plus
 *     the spec's documented chains. This is the «консолидация» — the screen
 *     reflects the code's actual gating rather than a hand-typed copy, so the
 *     two can't silently drift.
 *
 * Nothing here re-implements gating: the existing helpers stay the enforcement
 * points; this module reads them and presents them in one place.
 */

import { PROMO_ROLES, type PromoRole } from "../app/role-context";
import {
  getFullCalendarAccess,
  getReportAccess,
  getPromoTypeSettingsAccess,
  canCancelCampaign,
  canRequestLineRemoval,
  canApproveLineRemoval,
  canManageDeadline,
  canApproveDeadline,
} from "./promo-mock-data";

// ── Access levels ──────────────────────────────────────────────────────────

export type AccessLevel = "full" | "partial" | "view" | "none";

export interface AccessLevelMeta {
  label: string;
  /** Short legend description. */
  description: string;
  /** Soft tint (light + dark), matching the project status-badge convention. */
  bg: string;
  text: string;
}

export const ACCESS_LEVEL_META: Record<AccessLevel, AccessLevelMeta> = {
  full: {
    label: "Полный",
    description: "Полный доступ в рамках области.",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  partial: {
    label: "Частично",
    description: "Ограниченные действия (отдельные операции или этапы).",
    bg: "bg-amber-50 dark:bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-300",
  },
  view: {
    label: "Просмотр",
    description: "Только просмотр, без изменений.",
    bg: "bg-blue-50 dark:bg-blue-500/15",
    text: "text-blue-700 dark:text-blue-300",
  },
  none: {
    label: "Нет доступа",
    description: "Область недоступна для роли.",
    bg: "bg-gray-100 dark:bg-gray-700",
    text: "text-gray-500 dark:text-gray-400",
  },
};

export const ACCESS_LEVEL_ORDER: AccessLevel[] = ["full", "partial", "view", "none"];

// ── Functional areas (Appendix D columns) ────────────────────────────────────

export interface AccessArea {
  id: string;
  label: string;
  /** Where this area lives in the app (for the «открыть» hint / context). */
  href?: string;
}

export const ACCESS_AREAS: AccessArea[] = [
  { id: "shortCalendar", label: "Краткий календарь", href: "/short-calendar" },
  { id: "fullCalendar", label: "Полный календарь", href: "/full-calendar" },
  { id: "reports", label: "Отчёты", href: "/reports" },
  { id: "dataEditing", label: "Ред. данных" },
  { id: "approval", label: "Согласование", href: "/approvals" },
];

export interface AccessCell {
  level: AccessLevel;
  /** Spec wording from Appendix D — surfaced as the cell tooltip. */
  note: string;
}

type RoleMatrix = Record<string, AccessCell>;

/**
 * Appendix D — «Сводная таблица доступа». Cell `note`s reproduce the spec's own
 * phrasing so the document stays faithful to the source.
 */
export const ACCESS_MATRIX: Record<PromoRole, RoleMatrix> = {
  "Коммерческий директор": {
    shortCalendar: { level: "full", note: "Согласование плана + распределение по категориям." },
    fullCalendar: { level: "full", note: "Просмотр всех строк, согласование/отклонение версий КМ." },
    reports: { level: "full", note: "Просмотр всех отчётов, инициация отправки смежным отделам." },
    dataEditing: { level: "partial", note: "Распределение, назначение КМ, «Не участвует», правка типа на этапе согласования, инициация изменения дедлайнов." },
    approval: { level: "full", note: "План, отмена, утверждение правил типов; данные КМ с комментарием и доработкой (финальное согласование)." },
  },
  "Операционный директор": {
    shortCalendar: { level: "partial", note: "Утверждение плана." },
    fullCalendar: { level: "view", note: "Просмотр после утверждения коммерческим директором." },
    reports: { level: "view", note: "Просмотр после утверждения коммерческим директором." },
    dataEditing: { level: "none", note: "Нет прав на редактирование данных." },
    approval: { level: "partial", note: "Утверждение плана и распределения; утверждение изменения дедлайнов." },
  },
  "Администратор": {
    shortCalendar: { level: "full", note: "Технический доступ (полный)." },
    fullCalendar: { level: "full", note: "Технический доступ (полный)." },
    reports: { level: "full", note: "Технический доступ (полный)." },
    dataEditing: { level: "full", note: "Технический доступ (полный)." },
    approval: { level: "none", note: "Не участвует в согласовании (технический администратор)." },
  },
  "Директор маркетинга": {
    shortCalendar: { level: "full", note: "Создание и подтверждение плана." },
    fullCalendar: { level: "none", note: "Нет доступа к полному промо-календарю." },
    reports: { level: "view", note: "Просмотр отчёта для маркетинга." },
    dataEditing: { level: "partial", note: "Частично — план до согласования." },
    approval: { level: "partial", note: "Частично — план." },
  },
  "Категорийный менеджер (КМ)": {
    shortCalendar: { level: "partial", note: "Просмотр; установка «Не участвует»." },
    fullCalendar: { level: "full", note: "Заполнение и редактирование только своих строк." },
    reports: { level: "view", note: "Просмотр всех отчётов." },
    dataEditing: { level: "full", note: "Редактирование только своих данных." },
    approval: { level: "none", note: "Не согласует напрямую — направляет данные старшему КМ." },
  },
  "Старший КМ": {
    shortCalendar: { level: "view", note: "Просмотр (всех)." },
    fullCalendar: { level: "full", note: "Заполнение/редактирование своих строк + проверка данных КМ." },
    reports: { level: "view", note: "Просмотр всех отчётов." },
    dataEditing: { level: "full", note: "Редактирование только своих данных." },
    approval: { level: "partial", note: "Согласование данных КМ перед отправкой коммерческому директору." },
  },
  "Сотрудник маркетинга": {
    shortCalendar: { level: "partial", note: "Просмотр / создание плана при назначении." },
    fullCalendar: { level: "none", note: "Нет доступа к полному промо-календарю." },
    reports: { level: "view", note: "Просмотр отчёта для маркетинга; изменение «В рекламу (выбрано маркетингом)»." },
    dataEditing: { level: "partial", note: "Только поле «В рекламу (выбрано маркетингом)»." },
    approval: { level: "partial", note: "Частично — повторное согласование изменений." },
  },
  "Сотрудник закупа": {
    shortCalendar: { level: "none", note: "Нет доступа." },
    fullCalendar: { level: "none", note: "Нет доступа." },
    reports: { level: "view", note: "Просмотр отчёта для закупа." },
    dataEditing: { level: "none", note: "Нет прав на редактирование данных." },
    approval: { level: "none", note: "Не участвует в согласовании." },
  },
  "Сотрудник аналитики": {
    shortCalendar: { level: "none", note: "Нет доступа." },
    fullCalendar: { level: "none", note: "Нет доступа." },
    reports: { level: "view", note: "Просмотр отчёта для аналитики." },
    dataEditing: { level: "none", note: "Нет прав на редактирование данных." },
    approval: { level: "none", note: "Не участвует в согласовании." },
  },
};

/** §11.1 footnote — surfaced under the matrix. */
export const FINAL_APPROVAL_NOTE =
  "Финальное согласование может выполнять только Коммерческий директор или уполномоченное лицо коммерческого директора. Старший КМ не получает право финального согласования автоматически (spec §11.1).";

// ── Granular capabilities (live-derived consolidation) ───────────────────────

export interface Capability {
  id: string;
  label: string;
  /** What the capability lets the role do. */
  description: string;
  /** Grouping heading. */
  group: string;
  /** Where the rule is enforced in code — makes the consolidation auditable. */
  enforcedIn: string;
  /** LIVE predicate — calls the real gating helper (or the documented chain). */
  allowed: (role: PromoRole) => boolean;
}

// Plan workflow actors (mirrors PLAN_APPROVAL_CHAIN / actorForPlanStatus).
const isMarketingPlanner = (r: PromoRole) =>
  r === "Директор маркетинга" || r === "Сотрудник маркетинга";

export const CAPABILITY_GROUPS = [
  "Планирование",
  "Данные акции",
  "Согласование данных",
  "Изменения и отмена",
  "Настройки и администрирование",
] as const;

export const CAPABILITIES: Capability[] = [
  // ── Планирование ──────────────────────────────────────────────────────────
  {
    id: "plan-create",
    label: "Создание плана акций",
    description: "Формирование плана и распределения по категориям.",
    group: "Планирование",
    enforcedIn: "actorForPlanStatus · §4.2.6",
    allowed: isMarketingPlanner,
  },
  {
    id: "plan-approve-kd",
    label: "Согласование плана (КД)",
    description: "Согласование сформированного плана коммерческим директором.",
    group: "Планирование",
    enforcedIn: "PLAN_APPROVAL_CHAIN · §4.3.2",
    allowed: (r) => r === "Коммерческий директор",
  },
  {
    id: "plan-approve-od",
    label: "Утверждение плана (финальное)",
    description: "Финальное утверждение плана операционным директором.",
    group: "Планирование",
    enforcedIn: "PLAN_APPROVAL_CHAIN · §4.3.2",
    allowed: (r) => r === "Операционный директор",
  },

  // ── Данные акции ──────────────────────────────────────────────────────────
  {
    id: "fill-own-lines",
    label: "Заполнение/редактирование своих строк",
    description: "Ввод и правка данных промо-строк в полном календаре (только свои).",
    group: "Данные акции",
    enforcedIn: "getFullCalendarAccess().canEditOwnLines · §8.2",
    allowed: (r) => getFullCalendarAccess(r).canEditOwnLines,
  },
  {
    id: "marketing-flag",
    label: "Изменение «В рекламу (выбрано маркетингом)»",
    description: "Отметка позиций для рекламы — единственное редактируемое поле для маркетинга.",
    group: "Данные акции",
    enforcedIn: "getFullCalendarAccess().marketingFlagOnly · getReportAccess().canEditMarketingFlag · §7.2",
    allowed: (r) =>
      getFullCalendarAccess(r).marketingFlagOnly || getReportAccess(r).canEditMarketingFlag,
  },
  {
    id: "assign-km",
    label: "Назначение КМ и распределение по категориям",
    description: "Закрепление категорийных менеджеров и распределение акций по категориям.",
    group: "Данные акции",
    enforcedIn: "КД-поток краткого календаря · Appendix D",
    allowed: (r) => r === "Коммерческий директор",
  },

  // ── Согласование данных ──────────────────────────────────────────────────
  {
    id: "review-km-senior",
    label: "Проверка и согласование данных КМ",
    description: "Согласование данных КМ перед отправкой коммерческому директору.",
    group: "Согласование данных",
    enforcedIn: "ApprovalsProvider · reviewerForKmStatus · §11.1",
    allowed: (r) => r === "Старший КМ",
  },
  {
    id: "final-approval",
    label: "Финальное согласование и отправка смежным отделам",
    description: "Окончательное согласование данных и отправка отчётов смежным подразделениям.",
    group: "Согласование данных",
    enforcedIn: "ApprovalsProvider · §11.1 (только КД / уполномоченное лицо)",
    allowed: (r) => r === "Коммерческий директор",
  },
  {
    id: "marketing-reapprove",
    label: "Повторное согласование изменений (маркетинг)",
    description: "Подтверждение изменений уже отправленных данных со стороны маркетинга (§11.8).",
    group: "Согласование данных",
    enforcedIn: "FullCalendarPage re-approval · §11.8",
    allowed: (r) => r === "Сотрудник маркетинга",
  },

  // ── Изменения и отмена ───────────────────────────────────────────────────
  {
    id: "cancel-campaign",
    label: "Отмена акции",
    description: "Перевод акции в отдельное состояние «Отменена» с указанием причины.",
    group: "Изменения и отмена",
    enforcedIn: "canCancelCampaign() · §5.3",
    allowed: canCancelCampaign,
  },
  {
    id: "request-line-removal",
    label: "Запрос на исключение позиции",
    description: "Запрос исключения своей позиции из акции (подтверждает КД).",
    group: "Изменения и отмена",
    enforcedIn: "canRequestLineRemoval() · §5.3",
    allowed: canRequestLineRemoval,
  },
  {
    id: "approve-line-removal",
    label: "Подтверждение исключения позиции",
    description: "Утверждение запроса КМ на исключение позиции из акции.",
    group: "Изменения и отмена",
    enforcedIn: "canApproveLineRemoval() · §5.3",
    allowed: canApproveLineRemoval,
  },
  {
    id: "manage-deadline",
    label: "Инициация изменения дедлайна",
    description: "Запрос изменения дедлайна заполнения данных (утверждает ОД).",
    group: "Изменения и отмена",
    enforcedIn: "canManageDeadline() · §4.7",
    allowed: canManageDeadline,
  },
  {
    id: "approve-deadline",
    label: "Утверждение изменения дедлайна",
    description: "Утверждение запрошенного коммерческим директором изменения дедлайна.",
    group: "Изменения и отмена",
    enforcedIn: "canApproveDeadline() · §4.7",
    allowed: canApproveDeadline,
  },

  // ── Настройки и администрирование ────────────────────────────────────────
  {
    id: "promo-types-edit",
    label: "Изменение правил типов промо",
    description: "Создание и редактирование правил обязательных полей по типам промо.",
    group: "Настройки и администрирование",
    enforcedIn: "getPromoTypeSettingsAccess().canEdit · §9",
    allowed: (r) => getPromoTypeSettingsAccess(r).canEdit,
  },
  {
    id: "promo-types-confirm",
    label: "Утверждение правил типов промо",
    description: "Утверждение правил, чтобы они вступили в силу (§9).",
    group: "Настройки и администрирование",
    enforcedIn: "getPromoTypeSettingsAccess().canConfirm · §9",
    allowed: (r) => getPromoTypeSettingsAccess(r).canConfirm,
  },
  {
    id: "manage-users",
    label: "Управление пользователями",
    description: "Создание учёток, сброс паролей, назначение/отзыв прав, блокировка.",
    group: "Настройки и администрирование",
    enforcedIn: "users-store · nav gating (Администратор)",
    allowed: (r) => r === "Администратор",
  },
  {
    id: "view-audit",
    label: "Просмотр аудит-лога",
    description: "Доступ к журналу действий и своду контрольных событий (только чтение).",
    group: "Настройки и администрирование",
    enforcedIn: "/audit (все роли) · §11.9",
    allowed: () => true,
  },
];

/** Roles (in canonical order) that hold the given capability. */
export function rolesWithCapability(cap: Capability): PromoRole[] {
  return PROMO_ROLES.filter((r) => cap.allowed(r));
}

// ── Screen access (this matrix screen) — КД + Администратор ──────────────────

export interface PermissionsScreenAccess {
  canView: boolean;
  note: string;
}

/** Who may open the «Матрица прав» screen (sub-project D answer: КД + Администратор). */
export const PERMISSIONS_SCREEN_ROLES: PromoRole[] = [
  "Коммерческий директор",
  "Администратор",
];

export function getPermissionsScreenAccess(role: PromoRole): PermissionsScreenAccess {
  const canView = PERMISSIONS_SCREEN_ROLES.includes(role);
  return {
    canView,
    note: canView
      ? "Сводная матрица прав доступа по ролям и детальные права на действия."
      : "Матрица прав доступна только коммерческому директору и администратору.",
  };
}
