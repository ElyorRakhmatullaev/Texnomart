import {
  CalendarRange,
  Table2,
  CheckCircle2,
  FileBarChart,
  Bell,
  BellRing,
  ShieldCheck,
  SlidersHorizontal,
  KeyRound,
  Users,
} from "lucide-react";
import type { AppShellConfig } from "@texnomart/shared/types";
import type { PromoRole } from "./role-context";
import { countApprovalsAwaiting } from "../lib/promo-mock-data";

const TexnomartLogoFull = (
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
);

const TexnomartLogoIcon = (
  <svg width="32" height="32" viewBox="160 0 20 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M179.653 12.0021L177.301 15.8257L172.596 13.2016V18.4497H167.891V13.2016L163.186 15.8257L160.834 12.0021L165.617 9.37804L160.912 6.75401L163.186 2.93043L167.891 5.55446V0.306396H172.596V5.55446L177.301 2.93043L179.575 6.75401L174.87 9.37804L179.653 12.0021Z" fill="currentColor"/>
  </svg>
);

/**
 * Builds the Promo AppShell config for the given active role.
 * Badges (Согласование, Уведомления) and role-gated nav items depend on the
 * active role, so this is a factory rather than a static object. The unread
 * notification count is passed in live from the NotificationsProvider (S6) so
 * the «Уведомления» badge updates when items are acknowledged.
 */
export function createPromoShellConfig(
  currentRole: PromoRole,
  unreadNotifications = 0,
  user?: { name: string; initials: string }
): AppShellConfig {
  const approvalsCount = countApprovalsAwaiting(currentRole);

  return {
    logo: TexnomartLogoFull,
    logoCollapsed: TexnomartLogoIcon,
    user: {
      name: user?.name ?? "Сардор Мавлянов",
      role: currentRole,
      initials: user?.initials ?? "СМ",
    },
    searchPlaceholder: "Поиск акций, номенклатуры, отчётов...",
    collapseLabel: "Свернуть",
    navGroups: [
      {
        items: [
          { label: "Краткий промо-календарь", icon: CalendarRange, href: "/short-calendar" },
          { label: "Полный промо-календарь", icon: Table2, href: "/full-calendar" },
          {
            label: "Согласование",
            icon: CheckCircle2,
            href: "/approvals",
            ...(approvalsCount > 0
              ? { badge: approvalsCount, badgeVariant: "default" as const }
              : {}),
          },
          { label: "Отчёты смежным отделам", icon: FileBarChart, href: "/reports" },
          {
            label: "Уведомления",
            icon: Bell,
            href: "/notifications",
            ...(unreadNotifications > 0
              ? { badge: unreadNotifications, badgeVariant: "destructive" as const }
              : {}),
          },
        ],
      },
      {
        label: "Система",
        items: [
          { label: "Аудит-лог", icon: ShieldCheck, href: "/audit" },
          {
            label: "Управление пользователями",
            icon: Users,
            href: "/users",
            roles: ["Администратор"],
          },
          {
            label: "Настройки типов промо",
            icon: SlidersHorizontal,
            href: "/promo-types",
            roles: ["Коммерческий директор", "Администратор"],
          },
          {
            label: "Матрица прав",
            icon: KeyRound,
            href: "/permissions",
            roles: ["Коммерческий директор", "Администратор"],
          },
          {
            label: "Настройки уведомлений",
            icon: BellRing,
            href: "/notification-settings",
            roles: ["Администратор"],
          },
        ],
      },
    ],
    breadcrumbRoutes: [
      { path: "/short-calendar", label: "Краткий промо-календарь" },
      { path: "/short-calendar/:promoId", label: "Акция", parent: "/short-calendar", paramLabel: (id) => `Акция ${id}` },
      { path: "/full-calendar", label: "Полный промо-календарь" },
      { path: "/approvals", label: "Согласование" },
      { path: "/approvals/:id", label: "Заявка на согласование", parent: "/approvals", paramLabel: (id) => `Заявка ${id}` },
      { path: "/reports", label: "Отчёты смежным отделам" },
      { path: "/notifications", label: "Уведомления" },
      { path: "/notification-settings", label: "Настройки уведомлений" },
      { path: "/audit", label: "Аудит-лог" },
      { path: "/permissions", label: "Матрица прав" },
      { path: "/users", label: "Управление пользователями" },
      { path: "/promo-types", label: "Настройки типов промо" },
      { path: "/promo-types/:ruleId", label: "Правило", parent: "/promo-types", paramLabel: (id) => `Правило ${id}` },
    ],
  };
}
