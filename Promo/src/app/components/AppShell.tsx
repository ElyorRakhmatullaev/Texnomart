"use client";

import * as React from "react";
import { CalendarRange, Table2, FileBarChart, Search } from "lucide-react";
import { Badge } from "@texnomart/ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@texnomart/ui/command";
import { AppShell as SharedAppShell } from "@texnomart/shared/components/app-shell";
import { createPromoShellConfig, promoNotifications } from "../shell-config";
import { useRole } from "../role-context";

function PromoCommandSearch() {
  const [commandOpen, setCommandOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <div className="relative flex-1 max-w-md hidden md:block">
        <button
          onClick={() => setCommandOpen(true)}
          className="flex h-9 w-full items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground hover:bg-accent transition-colors"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 text-left">
            Поиск акций, номенклатуры, отчётов...
          </span>
          <Badge variant="outline" className="text-xs">
            ⌘K
          </Badge>
        </button>
      </div>
      <button
        onClick={() => setCommandOpen(true)}
        className="inline-flex items-center justify-center rounded-md size-9 hover:bg-accent hover:text-accent-foreground md:hidden"
        aria-label="Поиск"
      >
        <Search className="size-5" />
      </button>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Поиск акций, номенклатуры, отчётов..." />
        <CommandList>
          <CommandEmpty>Ничего не найдено</CommandEmpty>
          <CommandGroup heading="Акции">
            <CommandItem>
              <CalendarRange className="mr-2 size-4" />
              <span>Чёрная пятница 2026</span>
            </CommandItem>
            <CommandItem>
              <CalendarRange className="mr-2 size-4" />
              <span>Распродажа ТВ</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Номенклатура">
            <CommandItem>
              <Table2 className="mr-2 size-4" />
              <span>Samsung 55&quot; QLED</span>
            </CommandItem>
            <CommandItem>
              <Table2 className="mr-2 size-4" />
              <span>Холодильник Artel</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Отчёты">
            <CommandItem>
              <FileBarChart className="mr-2 size-4" />
              <span>Отчёт для маркетинга</span>
            </CommandItem>
            <CommandItem>
              <FileBarChart className="mr-2 size-4" />
              <span>Отчёт для закупа</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

export function AppShell() {
  const { roles, currentRole, setCurrentRole } = useRole();

  const config = React.useMemo(
    () => createPromoShellConfig(currentRole),
    [currentRole]
  );

  return (
    <SharedAppShell
      config={config}
      notifications={promoNotifications}
      headerActions={<PromoCommandSearch />}
      roleSwitcher={{
        roles,
        current: currentRole,
        onChange: (role) => setCurrentRole(role as typeof currentRole),
      }}
    />
  );
}
