"use client";

import * as React from "react";
import { BellOff, CheckCheck } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
import { cn } from "@texnomart/ui/utils";
import { FilterBar } from "@texnomart/shared/components/filter-bar";
import { PageHeader } from "@texnomart/shared/components/page-header";
import type { FilterConfig } from "@texnomart/shared/types";
import { useRole, type PromoRole } from "../../role-context";
import { useNotifications } from "./NotificationsProvider";
import { useNotificationSettings } from "../notification-settings/NotificationSettingsProvider";
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
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
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

/**
 * Волна 5 (5B): Администратор видит все уведомления, и сплошным списком это
 * нечитаемо. Клиент просит разделить их на блоки по ролям — КМ, старший КМ,
 * коммерческий директор и смежные отделы. Одно событие может попасть в
 * несколько блоков: это не дубль, а разные адресаты одного события.
 */
const ADMIN_BLOCKS: { key: string; label: string; roles: PromoRole[] }[] = [
  { key: "km", label: "Категорийные менеджеры", roles: ["Категорийный менеджер (КМ)"] },
  { key: "senior", label: "Старший КМ", roles: ["Старший КМ"] },
  { key: "kd", label: "Коммерческий директор", roles: ["Коммерческий директор"] },
  {
    key: "adj",
    label: "Смежные отделы",
    roles: [
      "Директор маркетинга",
      "Сотрудник маркетинга",
      "Сотрудник закупа",
      "Сотрудник аналитики",
      "Операционный директор",
    ],
  },
];

export function NotificationsPage() {
  const { currentRole } = useRole();
  const { notifications, acknowledge, acknowledgeMany } = useNotifications();
  const { config: notificationConfig } = useNotificationSettings();
  const [typeFilter, setTypeFilter] = React.useState<Record<string, string>>({
    type: "all",
  });

  // §11.3.1 — what the active role may see, then the type filter.
  const visible = React.useMemo(
    () => notificationsForRole(currentRole, notifications, notificationConfig),
    [currentRole, notifications, notificationConfig]
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

  // 5B — Администратору доступны два вида: блоки по ролям (по умолчанию,
  // как просил клиент) и прежний сплошной список «Непрочитанные / Прочитано».
  const isAdmin = currentRole === "Администратор";
  const [adminView, setAdminView] = React.useState<"roles" | "flat">("roles");
  const adminBlocks = React.useMemo(() => {
    if (!isAdmin) return [];
    return ADMIN_BLOCKS.map((b) => ({
      ...b,
      items: filtered.filter((n) =>
        b.roles.some((r) => notificationConfig[r]?.includes(n.type))
      ),
    })).filter((b) => b.items.length > 0);
  }, [isAdmin, filtered, notificationConfig]);

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
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <div className="inline-flex overflow-hidden rounded-md border">
                {(
                  [
                    ["roles", "По ролям"],
                    ["flat", "Единым списком"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAdminView(value)}
                    className={cn(
                      "h-9 px-3 text-sm font-medium transition-colors",
                      adminView === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-card dark:text-gray-300 dark:hover:bg-muted/40"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
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
          </div>
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
        className="bg-transparent px-0"
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-16 text-center">
          <BellOff className="size-12 text-gray-300 dark:text-gray-600" />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Уведомлений нет</p>
            <p className="text-sm text-muted-foreground">
              Для выбранной роли и фильтра уведомления отсутствуют.
            </p>
          </div>
        </div>
      ) : isAdmin && adminView === "roles" ? (
        <div className="space-y-8">
          {adminBlocks.map((b) => {
            const blockUnread = b.items.filter((n) => !n.read).length;
            return (
              <section key={b.key} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {b.label}
                  </h2>
                  <Badge variant="secondary" className="tabular-nums">
                    {b.items.length}
                  </Badge>
                  {blockUnread > 0 && (
                    <Badge variant="destructive" className="tabular-nums">
                      {blockUnread} непрочит.
                    </Badge>
                  )}
                </div>
                <GroupedList notifications={b.items} onAcknowledge={acknowledge} />
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Непрочитанные */}
          {unread.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
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
                <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500">
                  Прочитано
                </h2>
                <Badge variant="outline" className="tabular-nums text-gray-400 dark:text-gray-500">
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
