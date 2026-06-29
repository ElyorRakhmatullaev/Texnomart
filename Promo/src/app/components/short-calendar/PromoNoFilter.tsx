"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { buttonVariants } from "@texnomart/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@texnomart/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@texnomart/ui/command";

// «№ промо» filter (client feedback §9): a searchable MULTI-select — the kit has no
// MultiSelect primitive, so (per the S7/S2 precedent) a Popover button opens a
// `Command` checkbox list searchable by «26-N» number OR campaign name. The selected
// VALUES are campaign ids; the trigger is a native <button> + buttonVariants so the
// Radix `asChild` ref attaches (the shared <Button> isn't forwardRef — see lessons).

export interface PromoNoOption {
  /** Campaign id — the filter value. */
  id: string;
  /** «26-N» display number (§6b). */
  no: string;
  name: string;
}

interface PromoNoFilterProps {
  options: PromoNoOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  width?: string;
}

export function PromoNoFilter({
  options,
  selected,
  onChange,
  width = "w-[200px]",
}: PromoNoFilterProps) {
  const [open, setOpen] = React.useState(false);

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );
  }

  const label =
    selected.length === 0
      ? "Все номера"
      : selected.length === 1
        ? (options.find((o) => o.id === selected[0])?.no ?? "1 выбран")
        : `Выбрано: ${selected.length}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Фильтр по № промо"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-8 justify-between bg-white font-normal",
            width
          )}
        >
          <span
            className={cn(
              "truncate",
              selected.length === 0 && "text-muted-foreground"
            )}
          >
            {label}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Поиск № или названия…" className="h-9" />
          <CommandList>
            <CommandEmpty>Ничего не найдено</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const checked = selected.includes(o.id);
                return (
                  <CommandItem
                    key={o.id}
                    value={`${o.no} ${o.id} ${o.name}`}
                    onSelect={() => toggle(o.id)}
                    className="gap-2"
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-gray-300"
                      )}
                    >
                      {checked && <Check className="size-3" />}
                    </span>
                    <span className="w-[44px] shrink-0 text-xs font-semibold tabular-nums text-gray-700">
                      {o.no}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {o.name}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {selected.length > 0 && (
          <div className="border-t p-1">
            <button
              type="button"
              onClick={() => onChange([])}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-7 w-full justify-start text-xs text-muted-foreground"
              )}
            >
              Очистить выбор ({selected.length})
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
