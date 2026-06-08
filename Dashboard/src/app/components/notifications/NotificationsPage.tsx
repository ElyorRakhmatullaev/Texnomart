"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import {
  Settings,
  BellOff,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Eye,
  EyeOff,
  Archive,
  Trash2,
  Clock,
  X,
} from "lucide-react";
import { Card } from "@texnomart/ui/card";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
import { Switch } from "@texnomart/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@texnomart/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@texnomart/ui/table";
import { cn } from "@texnomart/ui/utils";
import {
  type AppNotification,
  type NotificationType,
  type NotificationSeverity,
  mockNotifications,
  NOTIFICATION_TYPES,
  NOTIFICATION_SEVERITIES,
  defaultChannelMatrix,
  CHANNEL_LABELS,
  type NotificationChannel,
} from "@/lib/notifications-mock-data";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";
import { ru } from "date-fns/locale";

type ReadFilter = "all" | "unread" | "read";

const SEVERITY_ICONS: Record<NotificationSeverity, React.ElementType> = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
  normal: CheckCircle2,
};

function formatDayGroup(date: Date): string {
  if (isToday(date)) return "Сегодня";
  if (isYesterday(date)) return "Вчера";
  return format(date, "EEEE, d MMMM", { locale: ru });
}

function groupByDay(notifications: AppNotification[]): Map<string, AppNotification[]> {
  const groups = new Map<string, AppNotification[]>();
  for (const n of notifications) {
    const key = format(n.timestamp, "yyyy-MM-dd");
    const existing = groups.get(key);
    if (existing) {
      existing.push(n);
    } else {
      groups.set(key, [n]);
    }
  }
  return groups;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = React.useState(mockNotifications);
  const [readFilter, setReadFilter] = React.useState<ReadFilter>("all");
  const [selectedTypes, setSelectedTypes] = React.useState<Set<NotificationType>>(new Set());
  const [selectedSeverities, setSelectedSeverities] = React.useState<Set<NotificationSeverity>>(new Set());
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalCount = notifications.length;

  const filtered = React.useMemo(() => {
    return notifications.filter((n) => {
      if (readFilter === "unread" && n.read) return false;
      if (readFilter === "read" && !n.read) return false;
      if (selectedTypes.size > 0 && !selectedTypes.has(n.type)) return false;
      if (selectedSeverities.size > 0 && !selectedSeverities.has(n.severity)) return false;
      return true;
    });
  }, [notifications, readFilter, selectedTypes, selectedSeverities]);

  const grouped = React.useMemo(() => groupByDay(filtered), [filtered]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function toggleRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  }

  function archiveNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function handleRowClick(n: AppNotification) {
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );
    }
    if (n.sourceHref) {
      navigate(n.sourceHref);
    }
  }

  function toggleType(type: NotificationType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function toggleSeverity(severity: NotificationSeverity) {
    setSelectedSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(severity)) next.delete(severity);
      else next.add(severity);
      return next;
    });
  }

  const hasFilters = selectedTypes.size > 0 || selectedSeverities.size > 0 || readFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-gray-900">
            Уведомления
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Непрочитано: {unreadCount} · Всего за месяц: {totalCount}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            Прочитать все
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="mr-2 size-4" />
            Настройки уведомлений
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg bg-gray-50 p-3">
        <div className="flex flex-col gap-3">
          {/* Read filter segmented control */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              {(["all", "unread", "read"] as ReadFilter[]).map((f) => {
                const labels: Record<ReadFilter, string> = {
                  all: "Все",
                  unread: "Непрочитанные",
                  read: "Прочитанные",
                };
                return (
                  <button
                    key={f}
                    onClick={() => setReadFilter(f)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      readFilter === f
                        ? "bg-[#FFD60A] text-black"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    {labels[f]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type & severity chips */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
            <span className="shrink-0 text-xs font-medium text-gray-500">Тип:</span>
            {(Object.entries(NOTIFICATION_TYPES) as [NotificationType, { label: string }][]).map(
              ([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => toggleType(key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    selectedTypes.has(key)
                      ? "border-[#FFD60A] bg-[#FFD60A] text-black"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  )}
                >
                  {label}
                </button>
              )
            )}

            <span className="ml-2 shrink-0 text-xs font-medium text-gray-500">Важность:</span>
            {(Object.entries(NOTIFICATION_SEVERITIES) as [NotificationSeverity, { label: string; text: string }][]).map(
              ([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => toggleSeverity(key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    selectedSeverities.has(key)
                      ? "border-[#FFD60A] bg-[#FFD60A] text-black"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  )}
                >
                  {label}
                </button>
              )
            )}

            {hasFilters && (
              <button
                onClick={() => {
                  setSelectedTypes(new Set());
                  setSelectedSeverities(new Set());
                  setReadFilter("all");
                }}
                className="ml-auto shrink-0 text-xs text-gray-500 hover:text-gray-700"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BellOff className="mb-4 size-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900">Уведомлений нет</h3>
          <p className="mt-1 text-sm text-gray-500">
            Все важные события будут появляться здесь
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from(grouped.entries()).map(([dateKey, items]) => (
            <div key={dateKey}>
              {/* Day group header */}
              <div className="sticky top-0 z-10 bg-gray-50/95 px-4 py-2 backdrop-blur-sm">
                <span className="text-sm font-semibold text-gray-700">
                  {formatDayGroup(items[0].timestamp)} · {items.length}{" "}
                  {items.length === 1 ? "уведомление" : items.length < 5 ? "уведомления" : "уведомлений"}
                </span>
              </div>

              {/* Notification rows */}
              <div className="space-y-px">
                {items.map((n) => {
                  const SeverityIcon = SEVERITY_ICONS[n.severity];
                  const severityStyle = NOTIFICATION_SEVERITIES[n.severity];
                  const typeStyle = NOTIFICATION_TYPES[n.type];
                  const isHovered = hoveredId === n.id;

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleRowClick(n)}
                      onMouseEnter={() => setHoveredId(n.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={cn(
                        "group relative flex cursor-pointer items-start gap-4 rounded-lg px-4 py-4 transition-colors",
                        !n.read
                          ? "border-l-[3px] border-l-[#FFD60A] bg-white"
                          : "border-l-[3px] border-l-transparent bg-gray-50"
                      )}
                      style={{ minHeight: 80 }}
                    >
                      {/* Severity icon */}
                      <div
                        className={cn(
                          "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full",
                          severityStyle.bg
                        )}
                      >
                        <SeverityIcon className={cn("size-5", severityStyle.icon)} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm leading-5",
                              !n.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                            )}
                          >
                            {n.title}
                          </p>

                          {/* Right cluster - desktop */}
                          <div className="hidden shrink-0 items-center gap-2 sm:flex">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(n.timestamp, { addSuffix: true, locale: ru })}
                            </span>

                            {n.actionLabel && n.actionHref && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(n.actionHref!);
                                }}
                              >
                                {n.actionLabel}
                              </Button>
                            )}

                            {!n.read && (
                              <div className="size-2 shrink-0 rounded-full bg-[#FFD60A]" />
                            )}

                            {/* Hover actions */}
                            {isHovered && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-7 p-0"
                                  title={n.read ? "Отметить непрочитанным" : "Отметить прочитанным"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRead(n.id);
                                  }}
                                >
                                  {n.read ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-7 p-0"
                                  title="Архивировать"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    archiveNotification(n.id);
                                  }}
                                >
                                  <Archive className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="size-7 p-0 text-red-500 hover:text-red-600"
                                  title="Удалить"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    archiveNotification(n.id);
                                  }}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <p
                          className={cn(
                            "mt-1 line-clamp-2 text-xs leading-4",
                            !n.read ? "text-gray-600" : "text-gray-500"
                          )}
                        >
                          {n.body}
                        </p>

                        {/* Tags + mobile time */}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className={cn("text-[10px]", typeStyle.color)}>
                            {typeStyle.label}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px]", severityStyle.bg, severityStyle.text)}
                          >
                            {NOTIFICATION_SEVERITIES[n.severity].label}
                          </Badge>

                          {/* Mobile: time + action + dot */}
                          <div className="flex items-center gap-2 sm:hidden">
                            <span className="text-[10px] text-gray-400">
                              {formatDistanceToNow(n.timestamp, { addSuffix: true, locale: ru })}
                            </span>
                            {!n.read && (
                              <div className="size-2 shrink-0 rounded-full bg-[#FFD60A]" />
                            )}
                          </div>
                        </div>

                        {/* Mobile action chip */}
                        {n.actionLabel && n.actionHref && (
                          <div className="mt-2 sm:hidden">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(n.actionHref!);
                              }}
                            >
                              {n.actionLabel}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings Drawer */}
      <NotificationSettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}

function NotificationSettingsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [quietHoursEnabled, setQuietHoursEnabled] = React.useState(false);
  const [quietFrom, setQuietFrom] = React.useState("22:00");
  const [quietTo, setQuietTo] = React.useState("08:00");
  const [quietDays, setQuietDays] = React.useState<Set<string>>(
    new Set(["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"])
  );
  const [channelMatrix, setChannelMatrix] = React.useState(defaultChannelMatrix);
  const [dailyDigest, setDailyDigest] = React.useState(true);
  const [dailyDigestTime, setDailyDigestTime] = React.useState("09:00");
  const [weeklyReport, setWeeklyReport] = React.useState(false);

  function toggleQuietDay(day: string) {
    setQuietDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function toggleChannel(rowIndex: number, channel: NotificationChannel) {
    setChannelMatrix((prev) =>
      prev.map((row, i) =>
        i === rowIndex
          ? {
              ...row,
              channels: { ...row.channels, [channel]: !row.channels[channel] },
            }
          : row
      )
    );
  }

  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const channels: NotificationChannel[] = ["system", "email", "sms", "push", "telegram"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[720px]">
        <SheetHeader>
          <SheetTitle>Настройки уведомлений</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-8">
          {/* Quiet Hours */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Тихие часы</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Включить тихие часы</span>
              <Switch
                checked={quietHoursEnabled}
                onCheckedChange={setQuietHoursEnabled}
              />
            </div>

            {quietHoursEnabled && (
              <>
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">С</label>
                    <input
                      type="time"
                      value={quietFrom}
                      onChange={(e) => setQuietFrom(e.target.value)}
                      className="block rounded-md border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <span className="mt-5 text-gray-400">—</span>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">До</label>
                    <input
                      type="time"
                      value={quietTo}
                      onChange={(e) => setQuietTo(e.target.value)}
                      className="block rounded-md border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {days.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleQuietDay(day)}
                      className={cn(
                        "min-h-[44px] min-w-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                        quietDays.has(day)
                          ? "border-[#FFD60A] bg-[#FFD60A] text-black"
                          : "border-gray-200 bg-white text-gray-600"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Channel Matrix */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Матрица каналов</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="sticky left-0 z-10 min-w-[160px] bg-gray-50 text-xs">
                      Тип уведомления
                    </TableHead>
                    {channels.map((ch) => (
                      <TableHead key={ch} className="text-center text-xs">
                        {CHANNEL_LABELS[ch]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channelMatrix.map((row, rowIndex) => (
                    <TableRow key={row.type}>
                      <TableCell className="sticky left-0 z-10 bg-white text-sm font-medium">
                        {row.type}
                      </TableCell>
                      {channels.map((ch) => (
                        <TableCell key={ch} className="text-center">
                          <div className="flex min-h-[44px] items-center justify-center">
                            <Switch
                              checked={row.channels[ch]}
                              onCheckedChange={() => toggleChannel(rowIndex, ch)}
                            />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          {/* Digest settings */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Сводки</h3>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                Получать ежедневную сводку на email
              </span>
              <Switch checked={dailyDigest} onCheckedChange={setDailyDigest} />
            </div>

            {dailyDigest && (
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Время отправки</label>
                <input
                  type="time"
                  value={dailyDigestTime}
                  onChange={(e) => setDailyDigestTime(e.target.value)}
                  className="block rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                Получать еженедельный отчёт
              </span>
              <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
            </div>
          </section>
        </div>

        {/* Save footer */}
        <div className="sticky bottom-0 mt-8 border-t bg-white pb-4 pt-4">
          <Button
            className="w-full bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90"
            onClick={() => onOpenChange(false)}
          >
            Сохранить настройки
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
