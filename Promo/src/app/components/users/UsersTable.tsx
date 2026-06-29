"use client";

import * as React from "react";
import { MoreVertical, KeyRound, ShieldCheck, ShieldOff, UserX, UserCheck } from "lucide-react";
import { Badge } from "@texnomart/ui/badge";
import { Button } from "@texnomart/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@texnomart/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@texnomart/ui/table";
import { cn } from "@texnomart/ui/utils";
import type { PromoUser } from "../../../lib/users-store";

export type UserRowAction = "reset" | "toggle-admin" | "toggle-status";

const STATUS_META: Record<PromoUser["status"], { label: string; cls: string }> = {
  active: { label: "Активен", cls: "bg-emerald-50 text-emerald-700" },
  "temp-password": { label: "Временный пароль", cls: "bg-amber-50 text-amber-700" },
  blocked: { label: "Заблокирован", cls: "bg-gray-200 text-gray-600" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU");
}

interface UsersTableProps {
  users: PromoUser[];
  onAction: (action: UserRowAction, user: PromoUser) => void;
  canRevokeAdmin: (id: string) => boolean;
  canDeactivate: (id: string) => boolean;
}

function RowMenu({ user, onAction, canRevokeAdmin, canDeactivate }: UsersTableProps & { user: PromoUser }) {
  const isAdmin = user.role === "Администратор";
  const isBlocked = user.status === "blocked";
  const revokeBlocked = isAdmin && !canRevokeAdmin(user.id);
  const deactivateBlocked = !isBlocked && !canDeactivate(user.id);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Действия">
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onAction("reset", user)}>
          <KeyRound className="mr-2 size-4" /> Сбросить пароль
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem
            disabled={revokeBlocked}
            title={revokeBlocked ? "Должно остаться не менее двух администраторов" : undefined}
            onClick={() => onAction("toggle-admin", user)}
          >
            <ShieldOff className="mr-2 size-4" /> Отозвать права администратора
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onAction("toggle-admin", user)}>
            <ShieldCheck className="mr-2 size-4" /> Назначить администратором
          </DropdownMenuItem>
        )}
        {isBlocked ? (
          <DropdownMenuItem onClick={() => onAction("toggle-status", user)}>
            <UserCheck className="mr-2 size-4" /> Активировать
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            disabled={deactivateBlocked}
            title={deactivateBlocked ? "Должно остаться не менее двух администраторов" : undefined}
            onClick={() => onAction("toggle-status", user)}
          >
            <UserX className="mr-2 size-4" /> Деактивировать
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UsersTable(props: UsersTableProps) {
  const { users } = props;
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:block">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="min-w-[200px]">ФИО</TableHead>
              <TableHead className="min-w-[200px]">Email</TableHead>
              <TableHead className="min-w-[200px]">Роль</TableHead>
              <TableHead className="w-[170px]">Статус</TableHead>
              <TableHead className="w-[130px]">Создан</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-gray-900">{u.fullName}</TableCell>
                <TableCell className="text-gray-700">{u.email}</TableCell>
                <TableCell className="text-gray-700">{u.role}</TableCell>
                <TableCell>
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[u.status].cls)}>
                    {STATUS_META[u.status].label}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums text-sm text-gray-600">{formatDate(u.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <RowMenu {...props} user={u} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {users.map((u) => (
          <div key={u.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-[0px_2px_4px_rgba(204,204,204,0.25)]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{u.fullName}</p>
                <p className="truncate text-sm text-gray-600">{u.email}</p>
              </div>
              <RowMenu {...props} user={u} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline" className="font-normal text-gray-600">{u.role}</Badge>
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[u.status].cls)}>
                {STATUS_META[u.status].label}
              </span>
              <span className="ml-auto tabular-nums text-xs text-gray-500">{formatDate(u.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
