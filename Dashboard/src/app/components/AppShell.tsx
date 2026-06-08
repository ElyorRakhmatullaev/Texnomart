"use client";

import * as React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Users,
  Handshake,
  Store,
  UserCog,
  Send,
  Bell,
  ShieldCheck,
  Settings,
  PanelLeft,
  Search,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  Menu,
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
  SidebarTrigger,
  useSidebar,
} from "@texnomart/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
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
import { Input } from "@texnomart/ui/input";
import { Separator } from "@texnomart/ui/separator";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@texnomart/ui/command";
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
import { useAuth } from "./auth/AuthContext";

// Mock user data
const currentUser = {
  name: "Сардор Мавлянов",
  role: "Superadmin",
  initials: "СМ",
};

// Navigation items
const navItems = [
  { label: "Дашборд", icon: LayoutDashboard, href: "/" },
  { label: "Аналитика", icon: BarChart3, href: "/analytics" },
  { label: "Заявки", icon: FileText, href: "/applications", badge: 12, badgeVariant: "default" as const },
  { label: "Клиенты", icon: Users, href: "/clients" },
  { label: "Партнёры", icon: Handshake, href: "/partners" },
  { label: "Филиалы", icon: Store, href: "/branches" },
  { label: "Пользователи", icon: UserCog, href: "/users" },
  { label: "Telegram-бот", icon: Send, href: "/telegram" },
  { label: "Уведомления", icon: Bell, href: "/notifications", badge: 3, badgeVariant: "destructive" as const },
];

const systemNavItems = [
  { label: "Аудит", icon: ShieldCheck, href: "/audit", roles: ["Superadmin", "Admin"] },
  { label: "Настройки", icon: Settings, href: "/settings", roles: ["Superadmin"] },
];

// Mock notifications
const mockNotifications = [
  { id: 1, title: "Новая заявка #12345", time: "2 мин назад", read: false },
  { id: 2, title: "Заявка #12340 одобрена", time: "15 мин назад", read: false },
  { id: 3, title: "Новый клиент зарегистрирован", time: "1 час назад", read: false },
  { id: 4, title: "Обновление системы завершено", time: "2 часа назад", read: true },
  { id: 5, title: "Заявка #12330 отклонена", time: "3 часа назад", read: true },
];

function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
        {isCollapsed ? (
          <svg width="32" height="32" viewBox="160 0 20 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M179.653 12.0021L177.301 15.8257L172.596 13.2016V18.4497H167.891V13.2016L163.186 15.8257L160.834 12.0021L165.617 9.37804L160.912 6.75401L163.186 2.93043L167.891 5.55446V0.306396H172.596V5.55446L177.301 2.93043L179.575 6.75401L174.87 9.37804L179.653 12.0021Z" fill="currentColor"/>
          </svg>
        ) : (
          <svg width="180" height="38" viewBox="0 0 180 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto shrink-0">
            <g clipPath="url(#clip0_30_5793)">
              <path d="M2.67517 24.5973V17.175H0.714844V13.3515H2.67517V9.37793H7.30156V13.3515H11.1438V17.175H7.30156V23.8476C7.30156 24.8972 7.77204 25.347 8.79141 25.347C9.65395 25.347 10.4381 25.1221 11.0654 24.8222V28.4209C10.1244 28.9457 8.94823 29.3206 7.37997 29.3206C4.55709 29.3206 2.67517 28.2709 2.67517 24.5973Z" fill="currentColor"/>
              <path d="M13.3379 21.2235C13.3379 16.7252 16.7097 13.0515 21.4145 13.0515C26.9034 13.0515 29.4126 17.1 29.4126 21.5984C29.4126 21.9732 29.4126 22.3481 29.3342 22.7979H17.9643C18.4348 24.8222 19.9246 25.8718 21.9634 25.8718C23.5316 25.8718 24.6294 25.4219 25.9624 24.2974L28.6285 26.5465C27.0602 28.3459 24.8646 29.4704 21.9634 29.4704C16.9449 29.3955 13.3379 26.0967 13.3379 21.2235ZM24.8646 20.0239C24.551 17.9997 23.3748 16.7252 21.4145 16.7252C19.4541 16.7252 18.1995 18.0747 17.8859 20.0239H24.8646Z" fill="currentColor"/>
              <path d="M36.3143 21.0735L30.747 13.3513H35.7654L38.8235 17.9246L41.8817 13.3513H46.7433L41.1759 20.9985L46.9785 29.0205H41.9601L38.6667 24.1473L35.3733 29.0205H30.5117L36.3143 21.0735Z" fill="currentColor"/>
              <path d="M49.8008 13.3514H54.4272V15.6006C55.525 14.2511 56.858 13.0515 59.2104 13.0515C62.739 13.0515 64.7777 15.3007 64.7777 18.8994V29.0206H60.1513V20.3238C60.1513 18.2246 59.132 17.1 57.3285 17.1C55.5249 17.1 54.4272 18.1496 54.4272 20.3238V29.0956H49.8008V13.3514Z" fill="currentColor"/>
              <path d="M68.0723 21.2235C68.0723 16.7252 71.8361 13.0515 77.0114 13.0515C82.1083 13.0515 85.8721 16.6502 85.8721 21.2235C85.8721 25.7218 82.1082 29.3955 76.933 29.3955C71.8361 29.3955 68.0723 25.7968 68.0723 21.2235ZM81.2457 21.2235C81.2457 18.8994 79.5206 16.8751 76.933 16.8751C74.2669 16.8751 72.6987 18.8244 72.6987 21.2235C72.6987 23.5476 74.4237 25.5719 77.0114 25.5719C79.6774 25.5719 81.2457 23.6226 81.2457 21.2235Z" fill="currentColor"/>
              <path d="M89.1641 13.3514H93.7904V15.6006C94.8882 14.2511 96.2997 13.0515 98.6521 13.0515C100.769 13.0515 102.416 13.9512 103.278 15.5256C104.69 13.9512 106.415 13.0515 108.689 13.0515C112.139 13.0515 114.256 15.0758 114.256 18.8244V29.0206H109.63V20.3238C109.63 18.2246 108.689 17.1 106.885 17.1C105.16 17.1 104.063 18.1496 104.063 20.3238V29.0956H99.4362V20.3238C99.4362 18.2246 98.4952 17.1 96.6917 17.1C94.9666 17.1 93.8689 18.1496 93.8689 20.3238V29.0956H89.2425V13.3514H89.1641Z" fill="currentColor"/>
              <path d="M117.236 24.5225C117.236 21.0738 119.981 19.4993 123.823 19.4993C125.47 19.4993 126.646 19.7992 127.822 20.1741V19.8742C127.822 17.9999 126.646 17.0252 124.294 17.0252C122.49 17.0252 121.235 17.3251 119.746 17.8499L118.569 14.4762C120.373 13.7265 122.176 13.2017 124.921 13.2017C127.43 13.2017 129.312 13.8764 130.488 14.926C131.743 16.1256 132.292 17.8499 132.292 19.9492V29.0208H127.822V27.2965C126.724 28.496 125.156 29.3207 122.882 29.3207C119.824 29.3207 117.236 27.6713 117.236 24.5225ZM127.979 23.5478V22.7231C127.195 22.3483 126.175 22.1234 124.999 22.1234C123.039 22.1234 121.784 22.8731 121.784 24.3725C121.784 25.5721 122.804 26.2468 124.294 26.2468C126.489 26.2468 127.979 25.1223 127.979 23.5478Z" fill="currentColor"/>
              <path d="M136.369 13.3512H140.996V16.5001C141.936 14.3259 143.505 12.9014 146.249 13.0513V17.6996H146.014C142.956 17.6996 140.996 19.4989 140.996 23.2476V29.0204H136.369V13.3512Z" fill="currentColor"/>
              <path d="M149.935 24.5973V17.175H147.975V13.3515H149.935V9.37793H154.561V13.3515H158.404V17.175H154.561V23.8476C154.561 24.8972 155.032 25.347 156.051 25.347C156.914 25.347 157.698 25.1221 158.325 24.8222V28.4209C157.384 28.9457 156.208 29.3206 154.64 29.3206C151.817 29.3206 149.935 28.2709 149.935 24.5973Z" fill="currentColor"/>
              <path d="M179.653 12.0021L177.301 15.8257L172.596 13.2016V18.4497H167.891V13.2016L163.186 15.8257L160.834 12.0021L165.617 9.37804L160.912 6.75401L163.186 2.93043L167.891 5.55446V0.306396H172.596V5.55446L177.301 2.93043L179.575 6.75401L174.87 9.37804L179.653 12.0021Z" fill="currentColor"/>
            </g>
            <defs>
              <clipPath id="clip0_30_5793">
                <rect width="180" height="37.9339" fill="white"/>
              </clipPath>
            </defs>
          </svg>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.href}
                    tooltip={isCollapsed ? item.label : undefined}
                  >
                    <Link to={item.href} className="flex items-center gap-3">
                      <item.icon className="size-5" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
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

        <SidebarGroup>
          <SidebarGroupLabel>Система</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNavItems
                .filter((item) => !item.roles || item.roles.includes(currentUser.role))
                .map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.href}
                      tooltip={isCollapsed ? item.label : undefined}
                    >
                      <Link to={item.href} className="flex items-center gap-3">
                        <item.icon className="size-5" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <SidebarTrigger className="flex w-full items-center gap-2 h-8 rounded-md p-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                <PanelLeft className="size-4 shrink-0" />
                {!isCollapsed && (
                  <span className="flex-1 truncate">
                    Свернуть
                  </span>
                )}
              </SidebarTrigger>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" hidden={!isCollapsed}>
            Свернуть
          </TooltipContent>
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}

function AppHeader() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toggleSidebar, isMobile } = useSidebar();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("light");

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

  const cycleTheme = () => {
    const themes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);

    // Apply theme
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (nextTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System preference
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", isDark);
    }
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 md:h-16 items-center gap-2 md:gap-4 border-b bg-background px-3 md:px-6">
        {/* Mobile hamburger menu */}
        <button
          onClick={toggleSidebar}
          className="inline-flex items-center justify-center rounded-md size-9 hover:bg-accent hover:text-accent-foreground md:hidden"
          aria-label="Открыть меню"
        >
          <Menu className="size-5" />
        </button>

        {/* Search — icon-only on mobile, full bar on md+ */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <button
            onClick={() => setCommandOpen(true)}
            className="flex h-9 w-full items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            <Search className="size-4 shrink-0" />
            <span className="flex-1 text-left">Поиск заявок, клиентов, партнёров...</span>
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

        <div className="ml-auto flex items-center gap-1 md:gap-2">
          {/* Live indicator — hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            <span>Онлайн</span>
          </div>

          {/* Language selector — hidden on mobile */}
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

          {/* Theme toggle */}
          <button
            onClick={cycleTheme}
            className="inline-flex items-center justify-center rounded-md transition-all size-9 hover:bg-accent hover:text-accent-foreground"
          >
            <ThemeIcon className="size-5" />
          </button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative inline-flex items-center justify-center rounded-md transition-all size-9 hover:bg-accent hover:text-accent-foreground">
                <Bell className="size-5" />
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 size-5 p-0 flex items-center justify-center text-[10px]"
                >
                  3
                </Badge>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b p-4">
                <h4 className="font-semibold">Уведомления</h4>
                <Badge variant="secondary">{mockNotifications.length}</Badge>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {mockNotifications.map((notification) => (
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
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t p-2">
                <Button variant="ghost" size="sm" className="w-full">
                  Показать все
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* User avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {currentUser.initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>Профиль</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>Настройки</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/profile")}>2FA</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => { logout(); navigate("/login"); }}>Выйти</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Dialog */}
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

interface BreadcrumbItem {
  label: string;
  href?: string;
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
              <BreadcrumbItem>
                {index === items.length - 1 ? (
                  <BreadcrumbPage className="text-foreground">{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href || "#"}>
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

export function AppShell() {
  const location = useLocation();

  // Generate breadcrumbs based on current location
  const breadcrumbs = React.useMemo(() => {
    const items: BreadcrumbItem[] = [{ label: "Главная", href: "/" }];

    if (location.pathname === "/") {
      items.push({ label: "Дашборд" });
    } else if (location.pathname.startsWith("/dashboard/")) {
      items.push({ label: "Дашборд", href: "/" });
      const metricLabels: Record<string, string> = {
        "total-clients": "Всего клиентов",
        "applications-24h": "Заявки за 24ч",
        "applications-3h": "Заявки за 3ч",
        "conversion": "Конверсия",
        "total-amount": "Сумма рассрочек",
        "average-check": "Средний чек",
        "active-clients": "Активные клиенты",
        "scoring-time": "Время скоринга",
      };
      const mId = location.pathname.split("/")[2];
      items.push({ label: metricLabels[mId] || mId });
    } else if (location.pathname === "/applications") {
      items.push({ label: "Заявки" });
    } else if (location.pathname.startsWith("/applications/")) {
      items.push({ label: "Заявки", href: "/applications" });
      const id = location.pathname.split("/")[2];
      items.push({ label: `Заявка ${id}` });
    } else if (location.pathname === "/analytics") {
      items.push({ label: "Аналитика" });
    } else if (location.pathname === "/clients") {
      items.push({ label: "Клиенты" });
    } else if (location.pathname.startsWith("/clients/")) {
      items.push({ label: "Клиенты", href: "/clients" });
      const clientId = location.pathname.split("/")[2];
      items.push({ label: `Клиент ${clientId}` });
    } else if (location.pathname === "/partners") {
      items.push({ label: "Партнёры" });
    } else if (location.pathname.startsWith("/partners/")) {
      items.push({ label: "Партнёры", href: "/partners" });
      const partnerId = location.pathname.split("/")[2];
      items.push({ label: `Партнёр ${partnerId}` });
    } else if (location.pathname === "/branches") {
      items.push({ label: "Филиалы" });
    } else if (location.pathname.startsWith("/branches/")) {
      items.push({ label: "Филиалы", href: "/branches" });
      const branchId = location.pathname.split("/")[2];
      items.push({ label: `Филиал ${branchId}` });
    } else if (location.pathname === "/users") {
      items.push({ label: "Пользователи" });
    } else if (location.pathname.startsWith("/users/")) {
      items.push({ label: "Пользователи", href: "/users" });
      const userId = location.pathname.split("/")[2];
      items.push({ label: `Пользователь ${userId}` });
    } else if (location.pathname === "/telegram") {
      items.push({ label: "Telegram-бот" });
    } else if (location.pathname === "/notifications") {
      items.push({ label: "Уведомления" });
    } else if (location.pathname === "/audit") {
      items.push({ label: "Аудит" });
    } else if (location.pathname.startsWith("/audit/")) {
      items.push({ label: "Аудит", href: "/audit" });
      const auditId = location.pathname.split("/")[2];
      items.push({ label: `Запись ${auditId}` });
    } else if (location.pathname === "/settings") {
      items.push({ label: "Настройки" });
    } else if (location.pathname === "/profile") {
      items.push({ label: "Мой профиль" });
    }

    return items;
  }, [location.pathname]);

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <AppHeader />
          <AppBreadcrumbs items={breadcrumbs} />
          <main className="flex-1 p-3 md:p-4 overflow-auto min-h-0">
            <div className="mx-auto max-w-[1400px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
