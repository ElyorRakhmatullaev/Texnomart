"use client";

import * as React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  PanelLeft,
  Search,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  Menu,
  Bell,
  Check,
  UserCog,
} from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@texnomart/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbUIItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@texnomart/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@texnomart/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@texnomart/ui/avatar";
import { Badge } from "@texnomart/ui/badge";
import { Button } from "@texnomart/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@texnomart/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@texnomart/ui/tooltip";
import type {
  NavGroup,
  BreadcrumbRoute,
  BreadcrumbItem,
  AppShellConfig,
  RoleSwitcherConfig,
} from "../types";
import { useAuth } from "../auth/auth-context";

interface AppSidebarProps {
  config: AppShellConfig;
  activeRole: string;
}

function AppSidebarNav({ config, activeRole }: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
        {isCollapsed ? config.logoCollapsed : config.logo}
      </SidebarHeader>

      <SidebarContent>
        {config.navGroups.map((group, gi) => (
          <SidebarGroup key={gi}>
            {group.label && (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .filter(
                    (item) =>
                      !item.roles ||
                      item.roles.includes(activeRole)
                  )
                  .map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.href}
                        tooltip={isCollapsed ? item.label : undefined}
                      >
                        <Link
                          to={item.href}
                          className="flex items-center gap-3"
                        >
                          <item.icon className="size-5" />
                          <span className="flex-1">{item.label}</span>
                          {item.badge !== undefined && (
                            <Badge
                              variant={item.badgeVariant || "default"}
                              className="ml-auto"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={config.collapseLabel ?? "Свернуть"}
              className={cn(
                "flex w-full items-center gap-2 h-8 rounded-md p-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                isCollapsed && "justify-center"
              )}
            >
              <PanelLeft className="size-4 shrink-0" />
              {!isCollapsed && (
                <span className="flex-1 truncate text-left">
                  {config.collapseLabel ?? "Свернуть"}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" hidden={!isCollapsed}>
            {config.collapseLabel ?? "Свернуть"}
          </TooltipContent>
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}

interface AppHeaderProps {
  config: AppShellConfig;
  notifications?: Array<{
    id: string | number;
    title: string;
    time: string;
    read: boolean;
  }>;
  commandContent?: React.ReactNode;
  headerActions?: React.ReactNode;
  roleSwitcher?: RoleSwitcherConfig;
  activeRole: string;
  notificationsHref?: string;
}

function AppHeader({
  config,
  notifications = [],
  headerActions,
  roleSwitcher,
  activeRole,
  notificationsHref,
}: AppHeaderProps) {
  const [notifOpen, setNotifOpen] = React.useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">(
    "light"
  );

  const cycleTheme = () => {
    const themes: Array<"light" | "dark" | "system"> = [
      "light",
      "dark",
      "system",
    ];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (nextTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const isDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.classList.toggle("dark", isDark);
    }
  };

  const ThemeIcon =
    theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 flex h-14 md:h-16 items-center gap-2 md:gap-4 border-b bg-background px-3 md:px-6">
      <button
        onClick={toggleSidebar}
        className="inline-flex items-center justify-center rounded-md size-9 hover:bg-accent hover:text-accent-foreground md:hidden"
        aria-label="Открыть меню"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex-1" />

      <div className="ml-auto flex items-center gap-1 md:gap-2">
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-green-500" />
          </span>
          <span>Онлайн</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hidden md:inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-8 px-3 hover:bg-accent hover:text-accent-foreground">
              RU
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Русский</DropdownMenuItem>
            <DropdownMenuItem>O'zbek (Кир.)</DropdownMenuItem>
            <DropdownMenuItem>O'zbek (Lat.)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={cycleTheme}
          className="inline-flex items-center justify-center rounded-md transition-all size-9 hover:bg-accent hover:text-accent-foreground"
        >
          <ThemeIcon className="size-5" />
        </button>

        {notifications.length > 0 && (
          <Popover open={notifOpen} onOpenChange={setNotifOpen}>
            <PopoverTrigger asChild>
              <button className="relative inline-flex items-center justify-center rounded-md transition-all size-9 hover:bg-accent hover:text-accent-foreground">
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 size-5 p-0 flex items-center justify-center text-[10px]"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b p-4">
                <h4 className="font-semibold">Уведомления</h4>
                <Badge variant="secondary">{notifications.length}</Badge>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 border-b p-4 hover:bg-accent transition-colors cursor-pointer last:border-b-0"
                  >
                    <span
                      className={cn(
                        "mt-1 size-2 rounded-full shrink-0",
                        notification.read ? "bg-muted" : "bg-destructive"
                      )}
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (notificationsHref) {
                      setNotifOpen(false);
                      navigate(notificationsHref);
                    }
                  }}
                >
                  Показать все
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {headerActions}

        {roleSwitcher && (
          <Badge
            variant="outline"
            className="hidden md:inline-flex max-w-[180px] truncate border-primary/40 bg-primary/10 text-foreground font-medium"
            title={activeRole}
          >
            <span className="truncate">{activeRole}</span>
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {config.user.initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{config.user.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {activeRole}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roleSwitcher && roleSwitcher.roles.length > 1 && (
              <>
                <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                  <UserCog className="size-3.5" />
                  Активная роль
                </DropdownMenuLabel>
                <div className="max-h-56 overflow-y-auto">
                  {roleSwitcher.roles.map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => roleSwitcher.onChange(role)}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{role}</span>
                      {role === activeRole && (
                        <Check className="size-4 shrink-0 text-foreground" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              Профиль
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Настройки
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function generateBreadcrumbs(
  pathname: string,
  routes: BreadcrumbRoute[]
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: "Главная", href: "/" }];

  for (const route of routes) {
    if (route.path.includes(":")) {
      const pattern = new RegExp(
        `^${route.path.replace(/:(\w+)/g, "([^/]+)")}$`
      );
      const match = pathname.match(pattern);
      if (match) {
        if (route.parent) {
          const parentRoute = routes.find((r) => r.path === route.parent);
          if (parentRoute) {
            items.push({ label: parentRoute.label, href: route.parent });
          }
        }
        const paramValue = match[1];
        const label = route.paramLabel
          ? route.paramLabel(paramValue)
          : `${route.label} ${paramValue}`;
        items.push({ label });
        return items;
      }
    } else if (pathname === route.path) {
      if (route.parent) {
        const parentRoute = routes.find((r) => r.path === route.parent);
        if (parentRoute) {
          items.push({ label: parentRoute.label, href: route.parent });
        }
      }
      items.push({ label: route.label });
      return items;
    }
  }

  return items;
}

interface AppBreadcrumbsProps {
  items: BreadcrumbItem[];
}

function AppBreadcrumbs({ items }: AppBreadcrumbsProps) {
  return (
    <div className="hidden md:flex h-10 items-center border-b bg-background px-6">
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="size-4" />
                </BreadcrumbSeparator>
              )}
              <BreadcrumbUIItem>
                {index === items.length - 1 ? (
                  <BreadcrumbPage className="text-foreground">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href || "#"}>
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbUIItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

interface AppShellProps {
  config: AppShellConfig;
  notifications?: Array<{
    id: string | number;
    title: string;
    time: string;
    read: boolean;
  }>;
  commandContent?: React.ReactNode;
  headerActions?: React.ReactNode;
  /** Optional role switcher for role-based apps; omit for single-role apps. */
  roleSwitcher?: RoleSwitcherConfig;
  maxWidth?: string;
  /** Where the bell popover's «Показать все» navigates; omit to keep it inert. */
  notificationsHref?: string;
}

export function AppShell({
  config,
  notifications,
  commandContent,
  headerActions,
  roleSwitcher,
  maxWidth = "1400px",
  notificationsHref,
}: AppShellProps) {
  const location = useLocation();
  const activeRole = roleSwitcher?.current ?? config.user.role;

  const breadcrumbs = React.useMemo(
    () => generateBreadcrumbs(location.pathname, config.breadcrumbRoutes),
    [location.pathname, config.breadcrumbRoutes]
  );

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebarNav config={config} activeRole={activeRole} />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <AppHeader
            config={config}
            notifications={notifications}
            commandContent={commandContent}
            headerActions={headerActions}
            roleSwitcher={roleSwitcher}
            activeRole={activeRole}
            notificationsHref={notificationsHref}
          />
          <AppBreadcrumbs items={breadcrumbs} />
          <main className="flex-1 p-3 md:p-4 overflow-auto min-h-0 bg-gray-50 dark:bg-background">
            <div className="mx-auto h-full" style={{ maxWidth }}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export { generateBreadcrumbs };
