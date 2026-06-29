"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { useRole } from "../../role-context";
import { getUsers, type PromoUser } from "../../../lib/users-store";
import { UsersTable, type UserRowAction } from "./UsersTable";

export function UsersPage() {
  const { currentRole } = useRole();
  const [users, setUsers] = React.useState<PromoUser[]>(() => getUsers());

  const reload = React.useCallback(() => setUsers(getUsers()), []);

  // Заглушки действий — реальные обработчики добавляются в Task 7b.
  const handleAction = React.useCallback((_action: UserRowAction, _user: PromoUser) => {
    reload();
  }, [reload]);

  if (currentRole !== "Администратор") {
    return (
      <div className="flex flex-col">
        <PageHeader title="Управление пользователями" />
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 bg-white py-16 text-center">
          <ShieldAlert className="size-12 text-gray-300" />
          <div>
            <p className="font-medium text-gray-900">Доступ только для администраторов</p>
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
      <PageHeader title="Управление пользователями" />
      <UsersTable
        users={users}
        onAction={handleAction}
        canRevokeAdmin={() => true}
        canDeactivate={() => true}
      />
    </div>
  );
}
