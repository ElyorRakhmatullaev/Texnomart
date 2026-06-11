"use client";

import * as React from "react";
import { BellOff, CheckCheck } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
import { FilterBar } from "@texnomart/shared/components/filter-bar";
import { PageHeader } from "@texnomart/shared/components/page-header";
import type { FilterConfig } from "@texnomart/shared/types";
import { useRole } from "../../role-context";
import { useNotifications } from "./NotificationsProvider";
import { NotificationItem } from "./NotificationItem";
import {
  NOTIFICATION_TYPE_META,
  groupNotificationsByDate,
  notificationsForRole,
  type NotificationType,
  type PromoNotification,
} from "../../../lib/promo-mock-data";

const TYPE_FILTER: FilterConfig = {
  key: "type",
  label: "Типы",
  options: (Object.keys(NOTIFICATION_TYPE_META) as NotificationType[]).map(
    (t) => ({ value: t, label: NOTIFICATION_TYPE_META[t].label })
  ),
};

function GroupedList({
  notifications,
  onAcknowledge,
}: {
  notifications: PromoNotification[];
  onAcknowledge: (id: string) => void;
}) {
  const groups = React.useMemo(
    () => groupNotificationsByDate(notifications),
    [notifications]
  );
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.key} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {group.key}
          </h3>
          <div className="space-y-2">
            {group.items.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onAcknowledge={onAcknowledge}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationsPage() {
  const { currentRole } = useRole();
  const { notifications, acknowledge, acknowledgeMany } = useNotifications();
  const [typeFilter, setTypeFilter] = React.useState<Record<string, string>>({
    type: "all",
  });

  // §11.3.1 — what the active role may see, then the type filter.
  const visible = React.useMemo(
    () => notificationsForRole(currentRole, notifications),
    [currentRole, notifications]
  );
  const filtered = React.useMemo(() => {
    const t = typeFilter.type ?? "all";
    return t === "all" ? visible : visible.filter((n) => n.type === t);
  }, [visible, typeFilter]);

  const unread = React.useMemo(
    () => filtered.filter((n) => !n.read),
    [filtered]
  );
  const read = React.useMemo(() => filtered.filter((n) => n.read), [filtered]);
  const unreadCount = unread.length;

  const markAllRead = () =>
    acknowledgeMany(unread.map((n) => n.id));

  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Центр уведомлений"
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>
              Новые и изменённые данные, отмены, повторные согласования.
            </span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="tabular-nums">
                {unreadCount} непрочит.
              </Badge>
            )}
          </span>
        }
        showCompare={false}
        showExport={false}
        actions={
          <Button
            variant="secondary"
            size="sm"
            className="h-9 gap-1.5"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="size-4" />
            Отметить все прочитанными
          </Button>
        }
      />

      <FilterBar
        filters={[TYPE_FILTER]}
        values={typeFilter}
        onFilterChange={(key, value) =>
          setTypeFilter((prev) => ({ ...prev, [key]: value }))
        }
        onClear={() => setTypeFilter({ type: "all" })}
        resultCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 bg-white py-16 text-center">
          <BellOff className="size-12 text-gray-300" />
          <div>
            <p className="font-medium text-gray-900">Уведомлений нет</p>
            <p className="text-sm text-muted-foreground">
              Для выбранной роли и фильтра уведомления отсутствуют.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Непрочитанные */}
          {unread.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900">
                  Непрочитанные
                </h2>
                <Badge variant="secondary" className="tabular-nums">
                  {unread.length}
                </Badge>
              </div>
              <GroupedList
                notifications={unread}
                onAcknowledge={acknowledge}
              />
            </section>
          )}

          {/* Прочитано (muted) */}
          {read.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-400">
                  Прочитано
                </h2>
                <Badge variant="outline" className="tabular-nums text-gray-400">
                  {read.length}
                </Badge>
              </div>
              <div className="opacity-80">
                <GroupedList notifications={read} onAcknowledge={acknowledge} />
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
