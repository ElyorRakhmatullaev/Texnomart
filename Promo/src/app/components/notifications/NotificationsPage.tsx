"use client";

import * as React from "react";
import { Link } from "react-router";
import { BellOff, CheckCheck, ChevronDown } from "lucide-react";
import { Button, buttonVariants } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
import { cn } from "@texnomart/ui/utils";
import { FilterBar } from "@texnomart/shared/components/filter-bar";
import { PageHeader } from "@texnomart/shared/components/page-header";
import type { FilterConfig } from "@texnomart/shared/types";
import { useRole, type PromoRole } from "../../role-context";
import { useNotifications } from "./NotificationsProvider";
import { useNotificationSettings } from "../notification-settings/NotificationSettingsProvider";
import { NotificationItem } from "./NotificationItem";
import { RuDate } from "../../../components/RuDate";
import {
  NOTIFICATION_TYPE_META,
  formatPromoNo,
  groupNotificationsByDate,
  notificationLinksFor,
  notificationsForRole,
  roleReceivesNotification,
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
 * коммерческий директор и смежные отделы (трекер, D61). Одно событие может
 * попасть в несколько блоков: это не дубль, а разные адресаты одного события.
 *
 * Проверка прода 14–15.09, №17 п.4: блоки должны быть компактными и обзорными,
 * а не длинным вертикальным списком полных карточек. «Смежные отделы» — только
 * маркетинг, закуп и аналитика (раньше туда попадали ДМ и ОД, а с ними отмены и
 * исключения позиций); события директоров вынесены в отдельный блок.
 */
const ADMIN_BLOCKS: { key: string; label: string; roles: PromoRole[] }[] = [
  { key: "km", label: "КМ", roles: ["Категорийный менеджер (КМ)"] },
  { key: "senior", label: "Старший КМ", roles: ["Старший КМ"] },
  { key: "kd", label: "Коммерческий директор", roles: ["Коммерческий директор"] },
  {
    key: "adj",
    label: "Смежные отделы",
    roles: ["Сотрудник маркетинга", "Сотрудник закупа", "Сотрудник аналитики"],
  },
  {
    key: "directors",
    label: "Директор маркетинга и операционный директор",
    roles: ["Директор маркетинга", "Операционный директор"],
  },
];

/** Сколько строк блока видно до «Показать все». */
const BLOCK_PREVIEW = 5;

/** Компактная строка события в блоке Администратора. */
function CompactNotificationRow({
  n,
  onAcknowledge,
}: {
  n: PromoNotification;
  onAcknowledge: (id: string) => void;
}) {
  const meta = NOTIFICATION_TYPE_META[n.type];
  const link = notificationLinksFor(n)[0];
  return (
    <li className="flex items-start gap-2.5 px-3 py-2">
      <span
        aria-label={n.read ? "Прочитано" : "Новое"}
        className={cn(
          "mt-1.5 size-2 shrink-0 rounded-full",
          n.read ? "bg-transparent" : "bg-primary"
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center rounded px-1.5 py-0.5 font-medium",
              meta.bg,
              meta.text
            )}
          >
            {meta.label}
          </span>
          {n.campaignId && (
            <span className="min-w-0 truncate text-gray-700 dark:text-gray-200">
              <span className="font-medium tabular-nums">{formatPromoNo(n.campaignId)}</span>
              {n.campaignName ? ` · ${n.campaignName}` : ""}
            </span>
          )}
        </div>
        <p
          className={cn(
            "mt-0.5 line-clamp-2 text-sm",
            n.read ? "text-gray-600 dark:text-gray-300" : "text-gray-900 dark:text-gray-100"
          )}
          title={n.description}
        >
          {n.description}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <RuDate
          value={n.sentAt}
          withTime
          className="text-[11px] tabular-nums text-muted-foreground"
        />
        {link && (
          <Link
            to={link.href}
            onClick={() => {
              if (!n.read) onAcknowledge(n.id);
            }}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 px-2 text-xs")}
          >
            {link.label}
          </Link>
        )}
      </div>
    </li>
  );
}

/** Блок роли: заголовок со счётчиками и первые события, остальное — по кнопке. */
function AdminRoleBlock({
  label,
  items,
  onAcknowledge,
}: {
  label: string;
  items: PromoNotification[];
  onAcknowledge: (id: string) => void;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const unread = items.filter((n) => !n.read).length;
  const visible = showAll ? items : items.slice(0, BLOCK_PREVIEW);
  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-border dark:bg-card">
      <header className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2 dark:border-border dark:bg-muted/40">
        <h2 className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
          {label}
        </h2>
        <Badge variant="secondary" className="tabular-nums">
          {items.length}
        </Badge>
        {unread > 0 && (
          <Badge variant="destructive" className="tabular-nums">
            {unread} новых
          </Badge>
        )}
      </header>
      <ul className="divide-y divide-gray-100 dark:divide-border">
        {visible.map((n) => (
          <CompactNotificationRow key={n.id} n={n} onAcknowledge={onAcknowledge} />
        ))}
      </ul>
      {items.length > BLOCK_PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="flex min-h-10 items-center justify-center gap-1 border-t border-gray-100 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:border-border dark:text-gray-300 dark:hover:bg-muted/40 dark:hover:text-gray-100"
        >
          {showAll ? "Свернуть" : `Показать все (${items.length})`}
          <ChevronDown className={cn("size-3.5 transition-transform", showAll && "rotate-180")} />
        </button>
      )}
    </section>
  );
}

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
      // То же правило адресата, что у самих ролей: тип в настройке + этап события.
      items: filtered.filter((n) =>
        b.roles.some((r) => roleReceivesNotification(r, n, notificationConfig))
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
        <div className="grid items-start gap-4 xl:grid-cols-2">
          {adminBlocks.map((b) => (
            <AdminRoleBlock
              key={b.key}
              label={b.label}
              items={b.items}
              onAcknowledge={acknowledge}
            />
          ))}
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
