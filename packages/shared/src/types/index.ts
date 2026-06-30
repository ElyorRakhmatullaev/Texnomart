import type { LucideIcon } from "lucide-react";

export interface StatusConfig {
  label: string;
  bg: string;
  text: string;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  badgeVariant?: "default" | "destructive";
  roles?: string[];
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface BreadcrumbRoute {
  path: string;
  label: string;
  parent?: string;
  paramLabel?: (param: string) => string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface AppShellConfig {
  logo: React.ReactNode;
  logoCollapsed: React.ReactNode;
  navGroups: NavGroup[];
  breadcrumbRoutes: BreadcrumbRoute[];
  user: {
    name: string;
    role: string;
    initials: string;
  };
  searchPlaceholder?: string;
  collapseLabel?: string;
  languages?: string[]; // display labels for the header language dropdown; defaults to RU + both Uzbek variants
}

/**
 * Optional role switcher for role-based apps (e.g. Texnomart Promo).
 * When provided to <AppShell>, the active role drives nav/role gating and is
 * shown as a pill next to the avatar plus a switcher inside the user menu.
 * When omitted, the shell falls back to config.user.role (unchanged behavior).
 */
export interface RoleSwitcherConfig {
  /** All roles the current user may act as. */
  roles: string[];
  /** The single role currently active. */
  current: string;
  /** Called when the user picks a different role. */
  onChange: (role: string) => void;
}

/**
 * Optional controlled theme toggle for the header. When provided to <AppShell>,
 * the header's theme button reflects `value` and calls `onCycle` (light → dark →
 * system) instead of using the shell's internal, non-persistent local state.
 * Lets an app own theme persistence (e.g. Promo's ThemeProvider). When omitted,
 * the header keeps its previous self-contained behavior (Dashboard unchanged).
 */
export interface ThemeController {
  value: "light" | "dark" | "system";
  onCycle: () => void;
}
