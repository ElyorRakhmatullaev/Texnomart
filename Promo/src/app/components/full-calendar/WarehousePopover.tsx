"use client";

import * as React from "react";
import { Warehouse } from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { buttonVariants } from "@texnomart/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@texnomart/ui/popover";
import { getWarehouseBreakdown } from "../../../lib/promo-mock-data";

/**
 * Per-warehouse остаток breakdown (spec §8.2.2) — read-only, pulled from 1С.
 * A small icon trigger sits beside the editable остаток value so editing and
 * viewing the breakdown stay unambiguous. Native <button> under asChild — the
 * shared <Button> can't take Radix's ref (see tasks/lessons.md S2 Phase 1).
 */
export function WarehousePopover({
  nomenclatureId,
}: {
  nomenclatureId: string;
}) {
  const rows = React.useMemo(
    () => getWarehouseBreakdown(nomenclatureId),
    [nomenclatureId]
  );
  const total = rows.reduce((s, r) => s + r.qty, 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Остаток по складам"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "size-6 shrink-0 text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100"
          )}
        >
          <Warehouse className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b px-3 py-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Остаток по складам</p>
          <p className="text-xs text-muted-foreground">Из 1С · только для чтения</p>
        </div>
        <ul className="divide-y">
          {rows.map((r) => (
            <li
              key={r.warehouse}
              className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm"
            >
              <span className="truncate text-gray-700 dark:text-gray-200">{r.warehouse}</span>
              <span className="tabular-nums text-gray-900 dark:text-gray-100">
                {r.qty.toLocaleString("ru-RU")}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t bg-gray-50 dark:bg-muted/40 px-3 py-2 text-sm font-semibold">
          <span className="text-gray-700 dark:text-gray-200">Итого</span>
          <span className="tabular-nums text-gray-900 dark:text-gray-100">
            {total.toLocaleString("ru-RU")}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
