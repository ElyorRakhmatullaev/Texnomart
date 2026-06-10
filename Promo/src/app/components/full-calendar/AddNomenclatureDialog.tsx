"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@texnomart/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@texnomart/ui/command";
import { NOMENCLATURE, type NomenclatureItem } from "../../../lib/promo-mock-data";

/**
 * Searchable 1С-nomenclature picker (§8.2.1) — a Command list bound to the 1С
 * reference. NO free-text entry: a line/gift can only be a real reference item.
 * Reused for adding a promo line and for picking gift nomenclature.
 *
 * The Command lives inside a Dialog (not an `asChild` Popover trigger), so the
 * "shared <Button> can't take a ref under Radix asChild" pitfall doesn't apply.
 */
export function AddNomenclatureDialog({
  open,
  onOpenChange,
  title,
  description,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onPick: (nomenclatureId: string) => void;
}) {
  // Group the 1С reference by category for a scannable list.
  const groups = React.useMemo(() => {
    const map = new Map<string, NomenclatureItem[]>();
    for (const item of NOMENCLATURE) {
      const arr = map.get(item.category) ?? [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return [...map.entries()];
  }, []);

  const handlePick = (id: string) => {
    onPick(id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[620px]">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Поиск по названию или коду 1С…" />
          <CommandList className="max-h-[360px]">
            <CommandEmpty>Ничего не найдено в справочнике 1С</CommandEmpty>
            {groups.map(([category, items]) => (
              <CommandGroup key={category} heading={category}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    // value drives cmdk search — include name + 1С code.
                    value={`${item.name} ${item.id}`}
                    onSelect={() => handlePick(item.id)}
                  >
                    <span className="flex w-full items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-sm text-gray-900">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {item.id} · остаток {item.stock}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
