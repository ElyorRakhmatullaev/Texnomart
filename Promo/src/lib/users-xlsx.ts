import * as XLSX from "xlsx";
import { rolesOf, type PromoUser } from "./users-store";
import { exportStamp } from "./promo-export";

const STATUS_RU: Record<PromoUser["status"], string> = {
  active: "Активен",
  "temp-password": "Временный пароль",
  blocked: "Заблокирован",
};

/** Реальный .xlsx текущего (отфильтрованного) списка пользователей. */
export function exportUsersXlsx(users: PromoUser[]): void {
  const byId = new Map(users.map((u) => [u.id, u.fullName] as const));
  const header = ["ФИО", "Email", "Роли", "Подразделение", "Должность", "Руководитель", "Статус", "Создан"];
  const rows = users.map((u) => [
    u.fullName,
    u.email,
    rolesOf(u).join(", "),
    u.department ?? "—",
    u.position ?? "—",
    u.managerId ? byId.get(u.managerId) ?? "—" : "—",
    STATUS_RU[u.status],
    new Date(u.createdAt).toLocaleDateString("ru-RU"),
  ]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Пользователи");
  XLSX.writeFile(wb, `Пользователи_${exportStamp()}.xlsx`);
}
