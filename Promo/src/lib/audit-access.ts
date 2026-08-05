import type { PromoRole } from "../app/role-context";
import {
  CAMPAIGNS,
  CATEGORY_MANAGERS,
  OWN_AUDIT_KM_ID,
  getCategoryManager,
  type AuditEvent,
  type AuditObjectType,
} from "./promo-mock-data";
import type { ControlPoint } from "./audit-control";
import { getActiveSubstitution } from "./kd-substitution-store";

/**
 * Область видимости аудита для роли — «10-я часть», Волна 5, блок 5C, вкладка 4 п. 7
 * («Доступ к данным предоставлять согласно матрице прав»).
 *
 * Единственный источник скоупа для ВСЕХ четырёх вкладок `/audit`. Применяется к исходному
 * набору ДО пользовательских фильтров, поэтому фильтрами его не обойти, а списки значений
 * в самих фильтрах строятся из уже суженного набора (роль не видит чужих ФИО в выпадающем
 * списке). Разносить это по вкладкам нельзя: в E-3 ровно так разъехались вкладки.
 */
export interface AuditScope {
  /** Подпись для плашки «Показаны записи в рамках ваших прав: …». */
  label: string;
  /** Доступные типы объектов; "all" — без ограничения. */
  objectTypes: AuditObjectType[] | "all";
  /** Ограничение по КМ (ФИО ответственного/автора); "all" — без ограничения. */
  kmNames: string[] | "all";
  /**
   * Ограничение по акциям; "all" — без ограничения. Считается из состава участников
   * акции: без него роль с ограничением по КМ всё равно видела бы записи ДРУГИХ ролей
   * (например решения КД) по чужим промо — «только свои промо» так не выполняется.
   */
  campaignIds: string[] | "all";
}

/** Весь промо-контур без действий над учётными записями. */
const PROMO_OBJECTS: AuditObjectType[] = ["акция", "строка", "отчёт", "план"];

/**
 * То же без плана: цепочка согласования плана — Директор маркетинга → КД → ОД,
 * старший КМ и КМ в ней не участвуют, поэтому «свои промо» плановых точек не включают
 * (до 5C вкладка «Сроки по плану» и так показывала КМ пояснение вместо строк).
 */
const PROMO_OBJECTS_NO_PLAN: AuditObjectType[] = ["акция", "строка", "отчёт"];

const KM_ROLE: PromoRole = "Категорийный менеджер (КМ)";

/**
 * «Закреплённые КМ» старшего КМ. В моке старший КМ один (km-6), поэтому за ним закреплены
 * все остальные — отдельной привязки КМ→старший в данных нет (осознанное ограничение мока).
 */
function subordinateKmIds(): string[] {
  return CATEGORY_MANAGERS.filter((m) => !m.senior).map((m) => m.id);
}

function namesOf(kmIds: string[]): string[] {
  return kmIds
    .map((id) => getCategoryManager(id)?.name)
    .filter((n): n is string => !!n);
}

/** Акции, в которых участвует хотя бы один из указанных КМ. */
function campaignsOf(kmIds: string[]): string[] {
  const set = new Set(kmIds);
  return CAMPAIGNS.filter((c) => c.participatingKmIds.some((id) => set.has(id))).map((c) => c.id);
}

/**
 * Скоуп по активной роли. `currentUserId` нужен только чтобы активное уполномоченное лицо КД
 * (E-4) получило скоуп КД — оно ходит в системе под собственной ролью.
 */
export function auditScopeFor(role: PromoRole, currentUserId?: string): AuditScope {
  const sub = getActiveSubstitution();
  const actsAsKd =
    role === "Коммерческий директор" ||
    (!!sub && !!currentUserId && sub.substituteUserId === currentUserId);

  if (role === "Администратор") {
    return { label: "полный аудит", objectTypes: "all", kmNames: "all", campaignIds: "all" };
  }
  if (actsAsKd) {
    return {
      label: "аудит по коммерческому направлению (без действий над учётными записями)",
      objectTypes: PROMO_OBJECTS,
      kmNames: "all",
      campaignIds: "all",
    };
  }
  if (role === "Старший КМ") {
    const ids = subordinateKmIds();
    return {
      label: "промо закреплённых категорийных менеджеров",
      objectTypes: PROMO_OBJECTS_NO_PLAN,
      kmNames: namesOf(ids),
      campaignIds: campaignsOf(ids),
    };
  }
  if (role === KM_ROLE) {
    const ids = [OWN_AUDIT_KM_ID];
    return {
      label: "только ваши промо",
      objectTypes: PROMO_OBJECTS_NO_PLAN,
      kmNames: namesOf(ids),
      campaignIds: campaignsOf(ids),
    };
  }
  if (role === "Директор маркетинга") {
    return {
      label: "план акций и отчёты",
      objectTypes: ["план", "отчёт"],
      kmNames: "all",
      campaignIds: "all",
    };
  }
  if (role === "Операционный директор") {
    return {
      label: "согласование плана и сроки",
      objectTypes: ["план"],
      kmNames: "all",
      campaignIds: "all",
    };
  }
  // Сотрудник маркетинга / Сотрудник закупа / Сотрудник аналитики — зона ответственности
  // ограничена отчётами смежным отделам.
  return {
    label: "отчёты смежным отделам",
    objectTypes: ["отчёт"],
    kmNames: "all",
    campaignIds: "all",
  };
}

/**
 * Тип объекта контрольной точки — своего поля у `ControlPoint` нет, а скоуп задан
 * в терминах объектов аудита, поэтому маппинг держим здесь, рядом со скоупом.
 */
export function checkpointObjectType(p: ControlPoint): AuditObjectType {
  if (p.scope === "plan") return "план";
  if (p.checkpoint.startsWith("Отправка первичного отчёта")) return "отчёт";
  if (p.checkpoint.startsWith("Новая версия отчёта")) return "отчёт";
  return "акция";
}

function objectAllowed(scope: AuditScope, t: AuditObjectType): boolean {
  return scope.objectTypes === "all" || scope.objectTypes.includes(t);
}

function campaignAllowed(scope: AuditScope, campaignId: string | undefined): boolean {
  if (scope.campaignIds === "all") return true;
  if (!campaignId) return false; // запись вне акций доступна только неограниченным скоупам
  return scope.campaignIds.includes(campaignId);
}

/** Сужение контрольных точек (вкладки 1–3) под права роли. */
export function scopeControlPoints(points: ControlPoint[], scope: AuditScope): ControlPoint[] {
  return points.filter((p) => {
    if (!objectAllowed(scope, checkpointObjectType(p))) return false;
    if (!campaignAllowed(scope, p.campaignId)) return false;
    if (scope.kmNames !== "all" && p.responsibleRole === KM_ROLE) {
      return scope.kmNames.includes(p.responsibleName);
    }
    return true;
  });
}

/** Сужение событий аудит-лога (вкладка 4) под права роли. */
export function scopeAuditEvents(events: AuditEvent[], scope: AuditScope): AuditEvent[] {
  return events.filter((e) => {
    if (!objectAllowed(scope, e.objectType)) return false;
    if (!campaignAllowed(scope, e.campaignId)) return false;
    if (scope.kmNames !== "all" && e.role === KM_ROLE) {
      return scope.kmNames.includes(e.user);
    }
    return true;
  });
}
