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

// «КМ» filter (4th-round feedback §4): a searchable MULTI-select so a Старший КМ can
// pin one or several of their КМ. Mirrors PromoNoFilter (the kit has no MultiSelect):
// a Popover button opens a `Command` checkbox list; selected VALUES are КМ ids. The
// trigger is a native <button> + buttonVariants so the Radix `asChild` ref attaches
// (the shared <Button> isn't forwardRef — see lessons). The page persists the
// selection per user (localStorage), so the reviewer keeps their КМ across logins.

export interface KmOption {
  id: string;
  name: string;
}

interface KmMultiSelectProps {
  options: KmOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  width?: string;
}

export function KmMultiSelect({
  options,
  selected,
  onChange,
  width = "w-[180px]",
}: KmMultiSelectProps) {
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
      ? "Все КМ"
      : selected.length === 1
        ? (options.find((o) => o.id === selected[0])?.name ?? "1 выбран")
        : `Выбрано КМ: ${selected.length}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Фильтр по КМ"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-8 justify-between bg-white font-normal dark:bg-card",
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
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Поиск КМ…" className="h-9" />
          <CommandList>
            <CommandEmpty>Ничего не найдено</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const checked = selected.includes(o.id);
                return (
                  <CommandItem
                    key={o.id}
                    value={o.name}
                    onSelect={() => toggle(o.id)}
                    className="gap-2"
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border",
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-gray-300 dark:border-gray-600"
                      )}
                    >
                      {checked && <Check className="size-3" />}
                    </span>
                    <span className="truncate text-sm text-gray-700 dark:text-gray-200">
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
