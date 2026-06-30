"use client";

import { ChevronDown, Columns3 } from "lucide-react";
import { buttonVariants } from "@texnomart/ui/button";
import { Checkbox } from "@texnomart/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@texnomart/ui/popover";
import { cn } from "@texnomart/ui/utils";
import { COLUMN_GROUPS, type ColumnGroupKey } from "./gridFields";

interface ColumnGroupToggleProps {
  visible: ColumnGroupKey[];
  onChange: (groups: ColumnGroupKey[]) => void;
}

/**
 * Column-group chooser — a dropdown of checkboxes (the conventional "column
 * visibility" control). Reads clearly as an interactive selector and mirrors
 * the FilterBar dropdown style on this screen. At least one group stays on so
 * the grid is never empty.
 */
export function ColumnGroupToggle({ visible, onChange }: ColumnGroupToggleProps) {
  const total = COLUMN_GROUPS.length;

  const toggle = (key: ColumnGroupKey, checked: boolean) => {
    if (checked) {
      onChange([...visible, key]);
    } else {
      const next = visible.filter((k) => k !== key);
      if (next.length === 0) return; // keep at least one group visible
      onChange(next);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* Native <button> (not the shared <Button>) so Radix can attach its ref
            and anchor the popover correctly. */}
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 gap-2 bg-white dark:bg-card")}
        >
          <Columns3 className="size-4 text-muted-foreground" />
          <span>Колонки</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
            {visible.length} из {total}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <p className="px-2 pb-1 pt-1 text-xs font-medium text-muted-foreground">
          Показать группы колонок
        </p>
        <div className="space-y-0.5">
          {COLUMN_GROUPS.map((g) => {
            const checked = visible.includes(g.key);
            const isLastChecked = checked && visible.length === 1;
            return (
              <label
                key={g.key}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-accent has-[:disabled]:cursor-not-allowed"
              >
                <Checkbox
                  checked={checked}
                  disabled={isLastChecked}
                  onCheckedChange={(v) => toggle(g.key, v === true)}
                />
                <span>{g.label}</span>
              </label>
            );
          })}
        </div>
        <p className="border-t px-2 pb-1 pt-2 text-xs text-muted-foreground">
          Отметьте, какие группы колонок показывать в таблице.
        </p>
      </PopoverContent>
    </Popover>
  );
}
