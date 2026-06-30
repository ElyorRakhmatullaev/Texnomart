"use client";

import * as React from "react";
import { useLocation } from "react-router";
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
import { createPromoShellConfig } from "../shell-config";
import { useRole } from "../role-context";
import { useCurrentUser } from "../current-user-context";
import { useTheme } from "../theme-context";
import { getInitials } from "@texnomart/shared/utils/formatters";
import { useNotifications } from "./notifications/NotificationsProvider";
import { notificationsForRole } from "../../lib/promo-mock-data";

/** «5 мин назад» / «2 ч назад» / «3 дн назад» — compact relative time for the bell. */
function relativeTime(date: Date): string {
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.round(hours / 24);
  return days === 1 ? "вчера" : `${days} дн назад`;
}

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
  const { currentUser } = useCurrentUser();
  const { pathname } = useLocation();
  const { notifications } = useNotifications();
  const { theme, cycleTheme } = useTheme();

  // Bell shows only what the active role may see (§11.3.1); the nav badge + bell
  // count both come from this live, role-filtered set so acknowledging updates them.
  const visibleNotifications = React.useMemo(
    () => notificationsForRole(currentRole, notifications),
    [currentRole, notifications]
  );
  const bellItems = React.useMemo(
    () =>
      visibleNotifications.map((n) => ({
        id: n.id,
        title: n.campaignName ? `${n.campaignName}: ${n.description}` : n.description,
        time: relativeTime(n.sentAt),
        read: n.read,
      })),
    [visibleNotifications]
  );
  const unreadCount = visibleNotifications.filter((n) => !n.read).length;

  const config = React.useMemo(
    () =>
      createPromoShellConfig(
        currentRole,
        unreadCount,
        currentUser
          ? { name: currentUser.fullName, initials: getInitials(currentUser.fullName) }
          : undefined
      ),
    [currentRole, unreadCount, currentUser]
  );

  // Dense, wide data grids use the full main width (no 1400px cap; §3.4 of the short-
  // calendar feedback): the full promo-calendar and the short-calendar LIST (its detail
  // page keeps the centered default). Other Promo screens stay centered.
  const maxWidth =
    pathname.startsWith("/full-calendar") || pathname === "/short-calendar"
      ? "100%"
      : "1400px";

  return (
    <SharedAppShell
      config={config}
      notifications={bellItems}
      notificationsHref="/notifications"
      headerActions={<PromoCommandSearch />}
      maxWidth={maxWidth}
      theme={{ value: theme, onCycle: cycleTheme }}
      roleSwitcher={{
        roles,
        current: currentRole,
        onChange: (role) => setCurrentRole(role as typeof currentRole),
      }}
    />
  );
}
