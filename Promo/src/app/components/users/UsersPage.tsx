"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { Download, Info, ShieldAlert, UserPlus } from "lucide-react";
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
  effectiveAdminScope,
  canManageUser,
  type PromoUser,
} from "../../../lib/users-store";
import { appendAuditEvent } from "../../../lib/audit-store";
import { exportUsersXlsx } from "../../../lib/users-xlsx";
import { UsersTable, type UserRowAction } from "./UsersTable";
import {
  UsersFilters,
  applyUserFilters,
  EMPTY_USER_FILTERS,
  type UserFilterState,
} from "./UsersFilters";
import { UserFormDialog, type UserFormValue } from "./UserFormDialog";
import { KdSubstitutionPanel } from "./KdSubstitutionPanel";
import { TempPasswordDialog } from "./TempPasswordDialog";
import type { AuditActionType } from "../../../lib/promo-mock-data";

export function UsersPage() {
  const { currentRole } = useRole();
  const { currentUser } = useCurrentUser();
  const navigate = useNavigate();

  const [users, setUsers] = React.useState<PromoUser[]>(() => getUsers());
  const [filters, setFilters] = React.useState<UserFilterState>(EMPTY_USER_FILTERS);
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
        targetUserId: target.id,
        comment,
      });
    },
    [currentUser, currentRole]
  );

  // Effective admin scope for the LOGGED-IN user (E-4). `effectiveAdminScope`
  // reads the multi-role set + `adminScope` off `currentUser`. The god-mode
  // role switcher can put the UI into role «Администратор» without a matching
  // seeded `currentUser` (dev/demo convenience) — fall back to a global scope
  // in that case so god-mode still works, exactly as the pre-E-4 guard did.
  const scope = effectiveAdminScope(currentUser) ?? (currentRole === "Администратор" ? "global" : null);

  // Scope the list BEFORE filters: a department admin only ever sees + acts on
  // their own department's accounts.
  const scoped = React.useMemo(
    () =>
      scope === "global"
        ? users
        : scope
        ? users.filter((u) => u.department === scope.department)
        : [],
    [users, scope]
  );

  const filtered = React.useMemo(() => applyUserFilters(scoped, filters), [scoped, filters]);

  // CONTROLLER RESOLUTION #1: «Создать пользователя» is GLOBAL-ADMIN-ONLY.
  // Department admins manage EXISTING accounts in their department (edit /
  // reset password / block via the row menu + the /users/:id detail page) but
  // never create new ones here — that would otherwise require threading a
  // locked-department prop through UserFormDialog's create path for no real
  // benefit (a dept admin can already ask a global admin to onboard someone
  // into their department). Keeps the create flow single-purpose.
  const canCreate = scope === "global";

  // Row-level manage gate passed to <UsersTable>: a global admin manages
  // everyone; a department admin only accounts inside their own department.
  const canManage = React.useCallback(
    (u: PromoUser) => (scope === "global" ? true : canManageUser(currentUser, u)),
    [scope, currentUser]
  );

  const handleCreate = React.useCallback(
    (value: UserFormValue) => {
      const { user, tempPassword: pwd } = createUser({
        fullName: value.fullName,
        email: value.email,
        role: value.roles[0],
        roles: value.roles,
        department: value.department,
        position: value.position,
        managerId: value.managerId,
      });
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
      if (action === "open") {
        navigate(`/users/${user.id}`);
        return;
      }
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
    [audit, reload, navigate]
  );

  if (scope === null) {
    return (
      <div className="flex flex-col">
        <PageHeader title="Управление пользователями" />
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-16 text-center">
          <ShieldAlert className="size-12 text-gray-300 dark:text-gray-500" />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Доступ только для администраторов</p>
            <p className="text-sm text-muted-foreground">
              Переключитесь на роль «Администратор», чтобы управлять учётными записями.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // The КД substitution panel is hosted here (E-4/Task 10) only for a global
  // admin, or — god-mode convenience, same reasoning as the `scope` fallback
  // above — the «Коммерческий директор» role itself. A department admin never
  // sees it: they have no business assigning who acts as КД.
  const showSubstitutionPanel = scope === "global" || currentRole === "Коммерческий директор";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Управление пользователями"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={filtered.length === 0}
              onClick={() => exportUsersXlsx(filtered)}
            >
              <Download className="size-4" /> Экспорт
            </Button>
            {canCreate && (
              <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
                <UserPlus className="size-4" /> Создать пользователя
              </Button>
            )}
          </div>
        }
      />

      {scope !== "global" && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/15 px-3 py-2.5 text-sm text-blue-800 dark:text-blue-300">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            Вы — администратор подразделения «{scope.department}»: управление ограничено вашим подразделением.
          </span>
        </div>
      )}

      {showSubstitutionPanel && <KdSubstitutionPanel />}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <UsersFilters value={filters} onChange={setFilters} />
        <span className="text-sm text-muted-foreground">
          Показано:{" "}
          <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">
            {filtered.length.toLocaleString("ru-RU")}
          </span>
        </span>
      </div>

      <UsersTable
        users={filtered}
        onAction={handleAction}
        canRevokeAdmin={canRevokeAdmin}
        canDeactivate={canDeactivate}
        allUsers={users}
        canManage={canManage}
      />

      {canCreate && (
        <UserFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          mode="create"
          allUsers={users}
          onSubmit={handleCreate}
        />
      )}
      <TempPasswordDialog
        open={tempOpen}
        onOpenChange={setTempOpen}
        userName={tempUserName}
        tempPassword={tempPassword}
      />
    </div>
  );
}
