"use client";

import * as React from "react";
import { Link } from "react-router";
import {
  Ban,
  CalendarClock,
  Check,
  CheckCheck,
  CircleMinus,
  FileText,
  Forward,
  Inbox,
  Megaphone,
  RefreshCw,
  RotateCcw,
  Send,
  TriangleAlert,
  Undo2,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { Button } from "@texnomart/ui/button";
import { buttonVariants } from "@texnomart/ui/button";
import { RuDate } from "../../../components/RuDate";
import {
  NOTIFICATION_TYPE_META,
  formatPromoNo,
  notificationLinksFor,
  type NotificationType,
  type PromoNotification,
} from "../../../lib/promo-mock-data";
import { rolesForType } from "../../../lib/notification-settings-store";
import { rolesOf } from "../../../lib/users-store";
import { useCurrentUser } from "../../current-user-context";
import { useRole } from "../../role-context";
import { useNotificationSettings } from "../notification-settings/NotificationSettingsProvider";

const TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  "data-changed": RefreshCw,
  "campaign-cancelled": Ban,
  "line-removed": CircleMinus,
  "marketing-reapproval": RotateCcw,
  "km-assignment": UserPlus,
  "ad-approval": Megaphone,
  // Волна 5 (5B)
  "report-new": FileText,
  "review-new": Inbox,
  "review-returned": Undo2,
  "review-resubmitted": Send,
  "kd-approved": CheckCheck,
  "non-participation": UserMinus,
  "auto-forwarded": Forward,
  "sla-overdue": TriangleAlert,
  "deadline-today": CalendarClock,
};

interface NotificationItemProps {
  notification: PromoNotification;
  onAcknowledge: (id: string) => void;
}

export function NotificationItem({
  notification: n,
  onAcknowledge,
}: NotificationItemProps) {
  const meta = NOTIFICATION_TYPE_META[n.type];
  const Icon = TYPE_ICONS[n.type];
  const { config } = useNotificationSettings();
  const { currentRole } = useRole();
  const { currentUser } = useCurrentUser();
  const tagRoles = rolesForType(n.type, config);
  const links = notificationLinksFor(n);

  // Волна 5 (5B): у пользователя может быть несколько ролей, и клиенту важно
  // видеть, В РАМКАХ КАКОЙ роли пришло это уведомление, а не весь целевой набор.
  // Берём пересечение ролей пользователя (плюс активная роль god-mode-переключателя)
  // с ролями, которым этот тип настроен. Полный набор остаётся в подсказке.
  const myRoles = React.useMemo(() => {
    const own = currentUser ? rolesOf(currentUser) : [];
    return Array.from(new Set<string>([...own, currentRole]));
  }, [currentUser, currentRole]);
  const receivingRoles = myRoles.filter((r) => tagRoles.includes(r as never));
  const isAdmin = myRoles.includes("Администратор");

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border p-3 md:p-4 transition-colors",
        n.read ? "bg-gray-50/60 dark:bg-muted/40 border-gray-100 dark:border-border" : "bg-white dark:bg-card border-gray-200 dark:border-border"
      )}
    >
      {/* Unread dot + type icon */}
      <div className="relative shrink-0">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-full",
            meta.bg,
            meta.text
          )}
        >
          <Icon className="size-[18px]" />
        </span>
        {!n.read && (
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-destructive ring-2 ring-white dark:ring-card" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
              meta.bg,
              meta.text
            )}
          >
            {meta.label}
          </span>
          {n.reportVersion != null && (
            <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-muted px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300 tabular-nums">
              отчёт v{n.reportVersion}
            </span>
          )}
          {!n.read && (
            <span className="text-xs font-medium text-destructive">Новое</span>
          )}
        </div>

        {/* № промо + название — клиент требует оба во ВСЕХ уведомлениях (5B). */}
        {(n.campaignId || n.campaignName) && (
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {n.campaignId && (
              <span className="tabular-nums text-muted-foreground">
                № {formatPromoNo(n.campaignId)}
                {n.campaignName ? " · " : ""}
              </span>
            )}
            {n.campaignName}
          </p>
        )}

        <p
          className={cn(
            "text-sm",
            n.read ? "text-muted-foreground" : "text-gray-700 dark:text-gray-200"
          )}
        >
          {n.description}
        </p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-gray-600 dark:text-gray-300">{n.actor.name}</span>
          <span aria-hidden>·</span>
          <span>{n.actor.role}</span>
          <span aria-hidden>·</span>
          <RuDate value={n.sentAt} withTime className="tabular-nums" />
        </div>

        <div className="flex flex-wrap items-center gap-1 text-xs">
          {/* Администратор видит всё в обход конфига — он наблюдатель, а не
              адресат, поэтому ему показываем целевые роли, а не «Вам как». */}
          {receivingRoles.length > 0 && !isAdmin ? (
            <>
              <span className="text-muted-foreground">Вам как:</span>
              <span
                className="inline-flex items-center rounded-md bg-primary px-1.5 py-0.5 font-medium text-primary-foreground"
                title={`Получатели категории: ${tagRoles.join(", ")}`}
              >
                {receivingRoles.join(", ")}
              </span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">
                {isAdmin ? "Получают роли:" : "Для роли:"}
              </span>
              {tagRoles.length === 0 ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <span
                  className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600 dark:bg-muted dark:text-gray-300"
                  title={tagRoles.join(", ")}
                >
                  {tagRoles.slice(0, 2).join(", ")}
                  {tagRoles.length > 2 ? ` +${tagRoles.length - 2}` : ""}
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {links.map((lnk) => (
            <Link
              key={lnk.kind}
              to={lnk.href}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8"
              )}
            >
              {lnk.label}
            </Link>
          ))}
          {/* 5B: в центре уведомлений — только статус ПРОЧТЕНИЯ. «Ознакомлен»
              относится к отчёту смежного отдела и живёт внутри самого отчёта. */}
          {!n.read && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => onAcknowledge(n.id)}
            >
              <Check className="size-4" />
              Отметить прочитанным
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
