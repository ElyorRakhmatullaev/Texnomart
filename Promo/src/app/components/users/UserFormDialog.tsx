"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@texnomart/ui/dialog";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { cn } from "@texnomart/ui/utils";
import { PROMO_ROLES, type PromoRole } from "../../role-context";
import { DEPARTMENTS, rolesOf, type PromoUser } from "../../../lib/users-store";

/** Sentinel values for the optional Select fields — Radix Select disallows an empty-string item value. */
const NO_DEPARTMENT = "__no_department__";
const NO_MANAGER = "__no_manager__";

const DEFAULT_ROLE: PromoRole = "Категорийный менеджер (КМ)";

export interface UserFormValue {
  fullName: string;
  email: string;
  roles: PromoRole[];
  department?: string;
  position?: string;
  managerId?: string;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  /** Seed data for edit mode. Ignored in create mode. */
  initial?: PromoUser;
  /** Full user list — options for «Руководитель» (excludes the edited user). */
  allUsers: PromoUser[];
  onSubmit: (value: UserFormValue) => void;
}

export function UserFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  allUsers,
  onSubmit,
}: UserFormDialogProps) {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [roles, setRoles] = React.useState<PromoRole[]>([DEFAULT_ROLE]);
  const [department, setDepartment] = React.useState<string | undefined>(undefined);
  const [position, setPosition] = React.useState("");
  const [managerId, setManagerId] = React.useState<string | undefined>(undefined);

  // Reset to blank defaults every time the create dialog opens.
  React.useEffect(() => {
    if (mode === "create" && open) {
      setFullName("");
      setEmail("");
      setRoles([DEFAULT_ROLE]);
      setDepartment(undefined);
      setPosition("");
      setManagerId(undefined);
    }
  }, [open, mode]);

  // Seed from `initial` every time the edit dialog opens (or the target user changes).
  React.useEffect(() => {
    if (mode === "edit" && initial && open) {
      setFullName(initial.fullName);
      setEmail(initial.email);
      setRoles(rolesOf(initial));
      setDepartment(initial.department);
      setPosition(initial.position ?? "");
      setManagerId(initial.managerId);
    }
  }, [initial, open, mode]);

  const emailValid = /\S+@\S+\.\S+/.test(email);
  const nameValid = fullName.trim().length >= 2;
  const rolesValid = roles.length > 0;
  const isValid = nameValid && emailValid && rolesValid;

  const toggleRole = (r: PromoRole) => {
    setRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const managerOptions = allUsers.filter((u) => !initial || u.id !== initial.id);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({
      fullName: fullName.trim(),
      email: email.trim(),
      roles,
      department,
      position: position.trim() || undefined,
      managerId,
    });
  };

  const title = mode === "create" ? "Новый пользователь" : "Редактировать пользователя";
  const submitLabel = mode === "create" ? "Создать" : "Сохранить";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="fullName">ФИО</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Иванов Иван"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (логин)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@texnomart.uz"
              required
            />
            {email && !emailValid && (
              <p className="text-xs text-red-600 dark:text-red-400">Введите корректный email.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Роли</Label>
            <div className="flex flex-wrap gap-2">
              {PROMO_ROLES.map((r) => {
                const checked = roles.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRole(r)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      checked
                        ? "border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300"
                        : "border-gray-200 dark:border-border bg-white dark:bg-card text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-accent"
                    )}
                  >
                    {checked && <CheckCircle2 className="size-3.5" />}
                    {r}
                  </button>
                );
              })}
            </div>
            {roles.length === 0 ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                Выберите хотя бы одну роль.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Основная роль: <span className="font-medium text-gray-700 dark:text-gray-200">{roles[0]}</span>
                {roles.length > 1 ? " (первая выбранная роль — основная)" : ""}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Подразделение</Label>
            <Select
              value={department ?? NO_DEPARTMENT}
              onValueChange={(v) => setDepartment(v === NO_DEPARTMENT ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_DEPARTMENT}>— не указано —</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Должность</Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Категорийный менеджер"
            />
          </div>

          <div className="space-y-2">
            <Label>Руководитель</Label>
            <Select
              value={managerId ?? NO_MANAGER}
              onValueChange={(v) => setManagerId(v === NO_MANAGER ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_MANAGER}>— без руководителя —</SelectItem>
                {managerOptions.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={!isValid}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
