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
  type NotificationType,
  type PromoNotification,
} from "../../../lib/promo-mock-data";

const TYPE_ICONS: Record<NotificationType, LucideIcon> = {
  "data-changed": RefreshCw,
  "campaign-cancelled": Ban,
  "line-removed": CircleMinus,
  "marketing-reapproval": RotateCcw,
  "km-assignment": UserPlus,
  "ad-approval": Megaphone,
};

const LINK_LABEL: Record<string, string> = {
  "/reports": "Открыть отчёт",
  "/full-calendar": "Открыть акцию",
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

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border p-3 md:p-4 transition-colors",
        n.read ? "bg-gray-50/60 border-gray-100" : "bg-white border-gray-200"
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
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-destructive ring-2 ring-white" />
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
            <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 tabular-nums">
              отчёт v{n.reportVersion}
            </span>
          )}
          {!n.read && (
            <span className="text-xs font-medium text-destructive">Новое</span>
          )}
        </div>

        {n.campaignName && (
          <p className="text-sm font-semibold text-gray-900">
            {n.campaignName}
          </p>
        )}

        <p
          className={cn(
            "text-sm",
            n.read ? "text-muted-foreground" : "text-gray-700"
          )}
        >
          {n.description}
        </p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-gray-600">{n.actor.name}</span>
          <span aria-hidden>·</span>
          <span>{n.actor.role}</span>
          <span aria-hidden>·</span>
          <RuDate value={n.sentAt} withTime className="tabular-nums" />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link
            to={n.href}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8"
            )}
          >
            {LINK_LABEL[n.href] ?? "Открыть"}
          </Link>
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
