"use client";

import * as React from "react";
import { Construction } from "lucide-react";
import { FilterBar } from "@texnomart/shared/components/filter-bar";
import type { FilterConfig } from "@texnomart/shared/types";
import { Switch } from "@texnomart/ui/switch";
import { Label } from "@texnomart/ui/label";
import { Badge } from "@texnomart/ui/badge";
import { useRole } from "../role-context";

const DEMO_FILTERS: FilterConfig[] = [
  {
    key: "type",
    label: "Тип",
    options: [
      { value: "discount", label: "Скидка" },
      { value: "installment", label: "Рассрочка" },
      { value: "gift", label: "Товар в подарок" },
    ],
  },
  {
    key: "status",
    label: "Статус",
    options: [
      { value: "pending", label: "На согласовании" },
      { value: "approved", label: "Согласовано" },
      { value: "cancelled", label: "Отменена" },
    ],
  },
];

interface ModulePlaceholderProps {
  title: string;
  description?: string;
  /** Module-specific preview content; falls back to an in-progress empty state. */
  children?: React.ReactNode;
  /** Hide the demo FilterBar (e.g. settings/notification panels). */
  showFilterBar?: boolean;
}

export function ModulePlaceholder({
  title,
  description,
  children,
  showFilterBar = true,
}: ModulePlaceholderProps) {
  const { currentRole } = useRole();
  const [values, setValues] = React.useState<Record<string, string>>({
    type: "all",
    status: "all",
  });
  const [hideCancelled, setHideCancelled] = React.useState(true);

  return (
    <div className="space-y-4 pb-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-gray-900 dark:text-gray-100">
          {title}
        </h1>
        {description && <p className="text-muted-foreground">{description}</p>}
        <p className="text-sm text-muted-foreground">
          Активная роль:{" "}
          <Badge variant="outline" className="font-medium">
            {currentRole}
          </Badge>
        </p>
      </div>

      {showFilterBar && (
        <FilterBar
          filters={DEMO_FILTERS}
          values={values}
          onFilterChange={(key, value) =>
            setValues((prev) => ({ ...prev, [key]: value }))
          }
          onClear={() => setValues({ type: "all", status: "all" })}
        >
          <div className="flex items-center gap-2">
            <Switch
              id="hide-cancelled"
              checked={hideCancelled}
              onCheckedChange={setHideCancelled}
            />
            <Label htmlFor="hide-cancelled" className="text-sm font-normal">
              Скрыть отменённое
            </Label>
          </div>
        </FilterBar>
      )}

      {children ?? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-20 text-center">
          <Construction className="size-12 text-muted-foreground/60" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Раздел в разработке
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Каркас приложения готов. Экран будет реализован в следующих шагах
            (S1–S8).
          </p>
        </div>
      )}
    </div>
  );
}
