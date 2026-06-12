"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { Button } from "@texnomart/ui/button";
import {
  AUDIT_ACTION_META,
  AUDIT_OBJECT_LABEL,
  type AuditActionType,
  type AuditObjectType,
} from "../../../lib/promo-mock-data";

export interface AuditFilters {
  user: string;
  role: string;
  action: string;
  object: string;
  from: string;
  to: string;
}

export const EMPTY_AUDIT_FILTERS: AuditFilters = {
  user: "all",
  role: "all",
  action: "all",
  object: "all",
  from: "",
  to: "",
};

export function hasActiveAuditFilters(f: AuditFilters): boolean {
  return (
    f.user !== "all" ||
    f.role !== "all" ||
    f.action !== "all" ||
    f.object !== "all" ||
    f.from !== "" ||
    f.to !== ""
  );
}

const ACTION_OPTIONS = Object.keys(AUDIT_ACTION_META) as AuditActionType[];
const OBJECT_OPTIONS = Object.keys(AUDIT_OBJECT_LABEL) as AuditObjectType[];

interface AuditLogFiltersProps {
  values: AuditFilters;
  onChange: (patch: Partial<AuditFilters>) => void;
  onClear: () => void;
  /** Available users + roles, derived from the log. */
  users: string[];
  roles: string[];
  /** Stack vertically (mobile Sheet) vs inline row (desktop). */
  layout?: "row" | "stack";
}

const FIELD =
  "h-8 rounded-md border border-input bg-white px-2 text-sm text-gray-900 shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function AuditLogFilters({
  values,
  onChange,
  onClear,
  users,
  roles,
  layout = "row",
}: AuditLogFiltersProps) {
  const stack = layout === "stack";
  const triggerW = stack ? "w-full" : "w-[150px]";

  return (
    <div
      className={
        stack
          ? "flex flex-col gap-3"
          : "flex flex-wrap items-end gap-2"
      }
    >
      <Field label="Пользователь" stack={stack}>
        <Select value={values.user} onValueChange={(v) => onChange({ user: v })}>
          <SelectTrigger className={`${triggerW} h-8 bg-white text-sm`}>
            <SelectValue placeholder="Пользователь" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все пользователи</SelectItem>
            {users.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Роль" stack={stack}>
        <Select value={values.role} onValueChange={(v) => onChange({ role: v })}>
          <SelectTrigger className={`${triggerW} h-8 bg-white text-sm`}>
            <SelectValue placeholder="Роль" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Тип действия" stack={stack}>
        <Select
          value={values.action}
          onValueChange={(v) => onChange({ action: v })}
        >
          <SelectTrigger className={`${triggerW} h-8 bg-white text-sm`}>
            <SelectValue placeholder="Тип действия" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все действия</SelectItem>
            {ACTION_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Объект" stack={stack}>
        <Select
          value={values.object}
          onValueChange={(v) => onChange({ object: v })}
        >
          <SelectTrigger className={`${triggerW} h-8 bg-white text-sm`}>
            <SelectValue placeholder="Объект" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все объекты</SelectItem>
            {OBJECT_OPTIONS.map((o) => (
              <SelectItem key={o} value={o}>
                {AUDIT_OBJECT_LABEL[o]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Дата, с" stack={stack}>
        <input
          type="date"
          value={values.from}
          onChange={(e) => onChange({ from: e.target.value })}
          className={`${triggerW} ${FIELD} tabular-nums`}
        />
      </Field>

      <Field label="Дата, по" stack={stack}>
        <input
          type="date"
          value={values.to}
          onChange={(e) => onChange({ to: e.target.value })}
          className={`${triggerW} ${FIELD} tabular-nums`}
        />
      </Field>

      {hasActiveAuditFilters(values) && (
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 text-xs text-gray-500 ${stack ? "self-start" : ""}`}
          onClick={onClear}
        >
          <X className="mr-1 h-3 w-3" />
          Очистить
        </Button>
      )}
    </div>
  );
}

function Field({
  label,
  stack,
  children,
}: {
  label: string;
  stack: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={stack ? "flex flex-col gap-1.5" : "flex flex-col gap-1"}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
