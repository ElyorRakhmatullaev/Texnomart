"use client";

import * as React from "react";
import {
  FileText,
  Users,
  Handshake,
  Store,
  Search,
} from "lucide-react";
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
import {
  dashboardShellConfig,
  dashboardNotifications,
} from "../shell-config";

function DashboardCommandSearch() {
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
            Поиск заявок, клиентов, партнёров...
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
        <CommandInput placeholder="Поиск заявок, клиентов, партнёров..." />
        <CommandList>
          <CommandEmpty>Ничего не найдено</CommandEmpty>
          <CommandGroup heading="Заявки">
            <CommandItem>
              <FileText className="mr-2 size-4" />
              <span>Заявка #12345 - Иванов И.И.</span>
            </CommandItem>
            <CommandItem>
              <FileText className="mr-2 size-4" />
              <span>Заявка #12344 - Петров П.П.</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Клиенты">
            <CommandItem>
              <Users className="mr-2 size-4" />
              <span>Иванов Иван Иванович</span>
            </CommandItem>
            <CommandItem>
              <Users className="mr-2 size-4" />
              <span>Петров Петр Петрович</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Партнёры">
            <CommandItem>
              <Handshake className="mr-2 size-4" />
              <span>Alif</span>
            </CommandItem>
            <CommandItem>
              <Handshake className="mr-2 size-4" />
              <span>Anorbank</span>
            </CommandItem>
            <CommandItem>
              <Handshake className="mr-2 size-4" />
              <span>Uzum Nasiya</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Филиалы">
            <CommandItem>
              <Store className="mr-2 size-4" />
              <span>Филиал Ташкент - Центр</span>
            </CommandItem>
            <CommandItem>
              <Store className="mr-2 size-4" />
              <span>Филиал Самарканд</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

export function AppShell() {
  return (
    <SharedAppShell
      config={dashboardShellConfig}
      notifications={dashboardNotifications}
      headerActions={<DashboardCommandSearch />}
    />
  );
}
