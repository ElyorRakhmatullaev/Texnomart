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
