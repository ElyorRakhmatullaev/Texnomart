"use client";

import { Link } from "react-router";
import {
  Ban,
  Check,
  CircleMinus,
  Megaphone,
  RefreshCw,
  RotateCcw,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { Button } from "@texnomart/ui/button";
import { buttonVariants } from "@texnomart/ui/button";
import { RuDate } from "../../../components/RuDate";
import {
  NOTIFICATION_TYPE_META,
  notificationLinksFor,
  type NotificationType,
  type PromoNotification,
} from "../../../lib/promo-mock-data";
import { rolesForType } from "../../../lib/notification-settings-store";
import { useRole } from "../../role-context";
import { useNotificationSettings } from "../notification-settings/NotificationSettingsProvider";

const TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  "data-changed": RefreshCw,
  "campaign-cancelled": Ban,
  "line-removed": CircleMinus,
  "marketing-reapproval": RotateCcw,
  "km-assignment": UserPlus,
  "ad-approval": Megaphone,
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
  const tagRoles = rolesForType(n.type, config);
  const links = notificationLinksFor(n);
  const currentIncluded = tagRoles.includes(currentRole);

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

        {n.campaignName && (
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
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
          <span className="text-muted-foreground">Роли:</span>
          {tagRoles.length === 0 ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center rounded-md px-1.5 py-0.5 font-medium",
                currentIncluded
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 text-gray-600 dark:bg-muted dark:text-gray-300"
              )}
              title={tagRoles.join(", ")}
            >
              {tagRoles.slice(0, 2).join(", ")}
              {tagRoles.length > 2 ? ` +${tagRoles.length - 2}` : ""}
            </span>
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
          {!n.read && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => onAcknowledge(n.id)}
            >
              <Check className="size-4" />
              Ознакомлен
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
