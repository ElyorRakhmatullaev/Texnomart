"use client";

// E-4: search / подразделение / роль / статус filter bar for `/users`.
// Flat `flex flex-wrap` row (no groups needed — 4 facets), mirroring the
// FilterSelect label+Select pattern from short-calendar/CalendarFilters.tsx
// and audit/ControlDeadlinesFilters.tsx (h-9 controls, bg-white dark:bg-card,
// «Все …» reset option → null, ghost «Сбросить» shown only when active).

import * as React from "react";
import { Search, X } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { PROMO_ROLES, type PromoRole } from "../../role-context";
import { DEPARTMENTS, rolesOf, type PromoUser } from "../../../lib/users-store";

// ── pure filter model + logic ──────────────────────────────────────────────

export interface UserFilterState {
  search: string;
  department: string | null;
  role: PromoRole | null;
  status: PromoUser["status"] | null;
}

export const EMPTY_USER_FILTERS: UserFilterState = {
  search: "",
  department: null,
  role: null,
  status: null,
};

export function applyUserFilters(users: PromoUser[], f: UserFilterState): PromoUser[] {
  const q = f.search.trim().toLowerCase();
  return users.filter((u) => {
    if (q && !`${u.fullName} ${u.email}`.toLowerCase().includes(q)) return false;
    if (f.department && u.department !== f.department) return false;
    if (f.role && !rolesOf(u).includes(f.role)) return false;
    if (f.status && u.status !== f.status) return false;
    return true;
  });
}

export function countActiveUserFilters(f: UserFilterState): number {
  return [f.search.trim().length > 0, !!f.department, !!f.role, !!f.status].filter(Boolean).length;
}

// ── component ───────────────────────────────────────────────────────────────

const ALL = "all";

const STATUS_OPTIONS: { value: PromoUser["status"]; label: string }[] = [
  { value: "active", label: "Активен" },
  { value: "temp-password", label: "Временный пароль" },
  { value: "blocked", label: "Заблокирован" },
];

export function UsersFilters({
  value,
  onChange,
}: {
  value: UserFilterState;
  onChange: (f: UserFilterState) => void;
}): JSX.Element {
  const active = countActiveUserFilters(value);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-muted-foreground">Поиск</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            placeholder="ФИО или email…"
            className="h-9 w-full bg-white pl-8 text-sm dark:bg-card sm:w-56"
          />
        </div>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-muted-foreground">Подразделение</span>
        <Select
          value={value.department ?? ALL}
          onValueChange={(v) => onChange({ ...value, department: v === ALL ? null : v })}
        >
          <SelectTrigger className="h-9 w-full bg-white text-sm dark:bg-card sm:w-52">
            <SelectValue placeholder="Все подразделения" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все подразделения</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-muted-foreground">Роль</span>
        <Select
          value={value.role ?? ALL}
          onValueChange={(v) => onChange({ ...value, role: v === ALL ? null : (v as PromoRole) })}
        >
          <SelectTrigger className="h-9 w-full bg-white text-sm dark:bg-card sm:w-56">
            <SelectValue placeholder="Все роли" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все роли</SelectItem>
            {PROMO_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-muted-foreground">Статус</span>
        <Select
          value={value.status ?? ALL}
          onValueChange={(v) =>
            onChange({ ...value, status: v === ALL ? null : (v as PromoUser["status"]) })
          }
        >
          <SelectTrigger className="h-9 w-full bg-white text-sm dark:bg-card sm:w-44">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все статусы</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      {active > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-xs text-gray-500 dark:text-gray-400"
          onClick={() => onChange(EMPTY_USER_FILTERS)}
        >
          <X className="mr-1 size-3" />
          Сбросить
        </Button>
      )}
    </div>
  );
}
