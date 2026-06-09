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
}
