import * as XLSX from "xlsx";
import { type PromoUser } from "./users-store";
import { assignmentsOf, isAssignmentExpired } from "./user-roles";
import { exportStamp } from "./promo-export";

const STATUS_RU: Record<PromoUser["status"], string> = {
  active: "Активен",
  "temp-password": "Временный пароль",
  blocked: "Деактивирован",
};

/** Реальный .xlsx текущего (отфильтрованного) списка пользователей. */
export function exportUsersXlsx(users: PromoUser[]): void {
  const byId = new Map(users.map((u) => [u.id, u.fullName] as const));
  const header = [
    "ФИО",
    "Email",
    // 5D: роли по типам — в одной колонке не видно, какие права постоянные,
    // а какие действуют только внутри периода.
    "Основная роль",
    "Дополнительные роли",
    "Временные роли",
    "Подразделение",
    "Должность",
    "Руководитель",
    "Статус",
    "Создан",
    "Кем создана",
  ];
  const rows = users.map((u) => {
    const a = assignmentsOf(u);
    return [
      u.fullName,
      u.email,
      a.find((x) => x.kind === "primary")?.role ?? u.role,
      a
        .filter((x) => x.kind === "additional")
        .map((x) => x.role)
        .join(", ") || "—",
      a
        .filter((x) => x.kind === "temporary")
        .map(
          (x) =>
            `${x.role} (${x.from ?? "—"}…${x.to ?? "—"}${
              isAssignmentExpired(x) ? ", срок истёк" : ""
            })`
        )
        .join("; ") || "—",
      u.department ?? "—",
      u.position ?? "—",
      u.managerId ? byId.get(u.managerId) ?? "—" : "—",
      STATUS_RU[u.status],
      new Date(u.createdAt).toLocaleDateString("ru-RU"),
      u.createdBy ?? "—",
    ];
  });
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Пользователи");
  XLSX.writeFile(wb, `Пользователи_${exportStamp()}.xlsx`);
}
