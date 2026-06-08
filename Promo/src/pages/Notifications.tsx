import React, { useState, useMemo } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@texnomart/ui/sheet";
import { ScrollArea } from "@texnomart/ui/scroll-area";
import { Badge } from "@texnomart/ui/badge";
import { Button } from "@texnomart/ui/button";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@texnomart/ui/tooltip";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@texnomart/ui/select";
import { Separator } from "@texnomart/ui/separator";
import {
  FileEdit, Ban, Trash2, AlertTriangle, UserPlus, Megaphone,
  Check, ChevronDown, ChevronRight,
  ExternalLink, Clock, Bell, Eye, EyeOff, Filter,
} from "lucide-react";
import {
  type AppNotification,
  type NotificationType,
  NOTIFICATION_TYPE_CONFIG,
} from "@/App";

// ════════════════════════════════════════════════════════════
// ICON MAP
// ════════════════════════════════════════════════════════════

const ICON_MAP: Record<string, React.ElementType> = {
  "file-edit": FileEdit,
  ban: Ban,
  "trash-2": Trash2,
  "alert-triangle": AlertTriangle,
  "user-plus": UserPlus,
  megaphone: Megaphone,
};

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

const TODAY = "2026-06-08";

function formatDateTime(iso: string): string {
  const [datePart, timePart] = iso.split("T");
  const [y, m, d] = datePart.split("-");
  return `${d}.${m}.${y} ${timePart}`;
}

function dateOnly(iso: string): string {
  return iso.split("T")[0];
}

function getDateGroup(iso: string): "today" | "yesterday" | "earlier" {
  const date = dateOnly(iso);
  if (date === TODAY) return "today";
  const td = new Date(TODAY + "T00:00:00");
  td.setDate(td.getDate() - 1);
  const yy = td.getFullYear();
  const mm = String(td.getMonth() + 1).padStart(2, "0");
  const dd = String(td.getDate()).padStart(2, "0");
  if (date === `${yy}-${mm}-${dd}`) return "yesterday";
  return "earlier";
}

const GROUP_ORDER: ("today" | "yesterday" | "earlier")[] = ["today", "yesterday", "earlier"];

const GROUP_LABELS: Record<string, { ru: string; en: string }> = {
  today: { ru: "Сегодня", en: "Today" },
  yesterday: { ru: "Вчера", en: "Yesterday" },
  earlier: { ru: "Ранее", en: "Earlier" },
};

const labels = {
  title: { ru: "Центр уведомлений", en: "Notifications" },
  markAllRead: { ru: "Ознакомиться со всем", en: "Acknowledge all" },
  markRead: { ru: "Ознакомлен", en: "Acknowledged" },
  read: { ru: "Прочитано", en: "Read" },
  unread: { ru: "Непрочитанные", en: "Unread" },
  filterType: { ru: "Тип", en: "Type" },
  allTypes: { ru: "Все типы", en: "All types" },
  version: { ru: "Версия", en: "Version" },
  responsible: { ru: "Ответственный", en: "Responsible" },
  noNotifications: { ru: "Нет уведомлений", en: "No notifications" },
  noUnread: { ru: "Нет новых уведомлений", en: "No new notifications" },
  open: { ru: "Открыть", en: "Open" },
  showRead: { ru: "Показать прочитанные", en: "Show read" },
  hideRead: { ru: "Скрыть прочитанные", en: "Hide read" },
};

// ════════════════════════════════════════════════════════════
// TYPE BADGE
// ════════════════════════════════════════════════════════════

function NotificationTypeBadge({ type }: { type: NotificationType }) {
  const cfg = NOTIFICATION_TYPE_CONFIG[type];
  if (!cfg) return null;
  const Icon = ICON_MAP[cfg.icon];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="whitespace-nowrap text-xs font-medium px-2 py-0.5 gap-1 shrink-0"
          style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}
        >
          {Icon && <Icon className="h-3 w-3" />}
          {cfg.ru}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top"><p>{cfg.en}</p></TooltipContent>
    </Tooltip>
  );
}

// ════════════════════════════════════════════════════════════
// NOTIFICATION ITEM
// ════════════════════════════════════════════════════════════

function NotificationItem({
  notification,
  onAcknowledge,
  onNavigate,
}: {
  notification: AppNotification;
  onAcknowledge: (id: string) => void;
  onNavigate: (campaignId: string) => void;
}) {
  const n = notification;
  const cfg = NOTIFICATION_TYPE_CONFIG[n.type];
  const Icon = ICON_MAP[cfg.icon];

  return (
    <div
      className="flex gap-3 px-4 py-3 transition-colors group"
      style={{
        backgroundColor: n.read ? "#F9FAFB" : "#FFFFFF",
        opacity: n.read ? 0.7 : 1,
      }}
    >
      {/* Type icon circle */}
      <div
        className="flex items-center justify-center rounded-full shrink-0 mt-0.5"
        style={{
          width: 36,
          height: 36,
          backgroundColor: cfg.bg,
          color: cfg.text,
        }}
      >
        {Icon && <Icon className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top line: type badge + version + time */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <NotificationTypeBadge type={n.type} />
          <Badge
            variant="outline"
            className="text-xs font-medium px-1.5 py-0 shrink-0"
            style={{
              backgroundColor: "#DBEAFE",
              color: "#2563EB",
              borderColor: "#BFDBFE",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
            }}
          >
            v{n.version}
          </Badge>
          <span
            className="text-xs shrink-0 ml-auto"
            style={{
              color: "#9CA3AF",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
            }}
          >
            {formatDateTime(n.sentAt)}
          </span>
        </div>

        {/* Campaign name + link */}
        <button
          onClick={() => onNavigate(n.campaignId)}
          className="flex items-center gap-1 hover:underline mb-0.5 text-left"
          style={{ fontSize: 13, fontWeight: 600, color: "#16181D" }}
        >
          <span className="truncate">{n.campaignId}</span>
          <span className="truncate" style={{ fontWeight: 400, color: "#6B7280" }}>
            — {n.campaignName}
          </span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#2563EB" }} />
        </button>

        {/* Description */}
        <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.4 }}>
          {n.description}
        </p>

        {/* Responsible */}
        <div className="flex items-center gap-1 mt-1" style={{ fontSize: 12, color: "#9CA3AF" }}>
          <Clock className="h-3 w-3" />
          <span>{n.responsible}</span>
        </div>
      </div>

      {/* Acknowledge button */}
      {!n.read && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 mt-0.5 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "#16A34A" }}
              onClick={() => onAcknowledge(n.id)}
            >
              <Check className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{labels.markRead.en}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// NOTIFICATION CENTER
// ════════════════════════════════════════════════════════════

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  notifications: AppNotification[];
  currentRole: string;
  onAcknowledge: (ids: string[]) => void;
  onNavigate: (page: string) => void;
}

export default function NotificationCenter({
  open,
  onOpenChange,
  notifications,
  currentRole,
  onAcknowledge,
  onNavigate,
}: NotificationCenterProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showRead, setShowRead] = useState(false);
  const [readExpanded, setReadExpanded] = useState(true);

  // Filter by role
  const roleFiltered = useMemo(
    () => notifications.filter((n) => n.targetRoles.includes("all") || n.targetRoles.includes(currentRole)),
    [notifications, currentRole],
  );

  // Filter by type
  const typeFiltered = useMemo(
    () => (typeFilter === "all" ? roleFiltered : roleFiltered.filter((n) => n.type === typeFilter)),
    [roleFiltered, typeFilter],
  );

  const unread = typeFiltered.filter((n) => !n.read);
  const read = typeFiltered.filter((n) => n.read);

  // Group unread by date
  const grouped = useMemo(() => {
    const g: Record<string, AppNotification[]> = { today: [], yesterday: [], earlier: [] };
    unread.forEach((n) => {
      g[getDateGroup(n.sentAt)].push(n);
    });
    return g;
  }, [unread]);

  // Available types for filter (only types present in role-filtered list)
  const availableTypes = useMemo(() => {
    const types = new Set(roleFiltered.map((n) => n.type));
    return Array.from(types);
  }, [roleFiltered]);

  const handleAcknowledgeOne = (id: string) => onAcknowledge([id]);

  const handleAcknowledgeAll = () => {
    const ids = unread.map((n) => n.id);
    if (ids.length > 0) onAcknowledge(ids);
  };

  const handleNavigate = (campaignId: string) => {
    onOpenChange(false);
    onNavigate("short-calendar");
  };

  const unreadTotal = roleFiltered.filter((n) => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col p-0 w-full sm:max-w-md"
      >
        {/* ── Header ── */}
        <SheetHeader className="px-4 pt-5 pb-3 border-b" style={{ borderColor: "#E5E7EB" }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg font-heading" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, color: "#16181D" }}>
                {labels.title.ru}
              </SheetTitle>
              {unreadTotal > 0 && (
                <Badge
                  className="h-5 min-w-5 px-1.5 text-xs font-medium"
                  style={{
                    backgroundColor: "#DC2626",
                    color: "#fff",
                    fontSize: 10,
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  {unreadTotal}
                </Badge>
              )}
            </div>
          </div>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{labels.title.en}</p>

          {/* ── Filter row ── */}
          <div className="flex items-center gap-2 mt-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger
                className="h-8 text-xs flex-1"
                style={{ fontSize: 12, maxWidth: 220 }}
              >
                <Filter className="h-3 w-3 mr-1 shrink-0" style={{ color: "#6B7280" }} />
                <SelectValue placeholder={labels.allTypes.ru} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.allTypes.ru}</SelectItem>
                {availableTypes.map((t) => {
                  const cfg = NOTIFICATION_TYPE_CONFIG[t];
                  return (
                    <SelectItem key={t} value={t}>
                      <span style={{ color: cfg.text }}>{cfg.ru}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs shrink-0"
                  style={{ color: "#6B7280", fontSize: 12 }}
                  onClick={() => setShowRead((v) => !v)}
                >
                  {showRead ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                  {showRead ? labels.hideRead.ru : labels.showRead.ru}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showRead ? labels.hideRead.en : labels.showRead.en}</TooltipContent>
            </Tooltip>
          </div>
        </SheetHeader>

        {/* ── Content ── */}
        <ScrollArea className="flex-1">
          {/* Unread groups */}
          {unread.length === 0 && !showRead && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Bell className="h-12 w-12 mb-3" style={{ color: "#D1D5DB" }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>
                {labels.noUnread.ru}
              </p>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
                {labels.noUnread.en}
              </p>
            </div>
          )}

          {GROUP_ORDER.map((groupKey) => {
            const items = grouped[groupKey];
            if (!items || items.length === 0) return null;
            const gl = GROUP_LABELS[groupKey];
            return (
              <div key={groupKey}>
                <div
                  className="flex items-center gap-2 px-4 py-2"
                  style={{ backgroundColor: "#F9FAFB" }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{gl.ru}</span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{gl.en}</span>
                  <Badge
                    variant="outline"
                    className="ml-auto h-4 min-w-4 px-1 text-xs"
                    style={{
                      fontSize: 10,
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: "#6B7280",
                      borderColor: "#E5E7EB",
                    }}
                  >
                    {items.length}
                  </Badge>
                </div>
                {items.map((n) => (
                  <React.Fragment key={n.id}>
                    <NotificationItem
                      notification={n}
                      onAcknowledge={handleAcknowledgeOne}
                      onNavigate={handleNavigate}
                    />
                    <Separator style={{ backgroundColor: "#F3F4F6" }} />
                  </React.Fragment>
                ))}
              </div>
            );
          })}

          {/* Read group */}
          {showRead && read.length > 0 && (
            <div>
              <button
                onClick={() => setReadExpanded((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-50 transition-colors"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                {readExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" style={{ color: "#9CA3AF" }} />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" style={{ color: "#9CA3AF" }} />
                )}
                <span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>{labels.read.ru}</span>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>{labels.read.en}</span>
                <Badge
                  variant="outline"
                  className="ml-auto h-4 min-w-4 px-1 text-xs"
                  style={{
                    fontSize: 10,
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: "#9CA3AF",
                    borderColor: "#E5E7EB",
                  }}
                >
                  {read.length}
                </Badge>
              </button>
              {readExpanded &&
                read.map((n) => (
                  <React.Fragment key={n.id}>
                    <NotificationItem
                      notification={n}
                      onAcknowledge={handleAcknowledgeOne}
                      onNavigate={handleNavigate}
                    />
                    <Separator style={{ backgroundColor: "#F3F4F6" }} />
                  </React.Fragment>
                ))}
            </div>
          )}
        </ScrollArea>

        {/* ── Bottom action bar ── */}
        {unread.length > 0 && (
          <div
            className="border-t px-4 py-3 flex items-center justify-between gap-2"
            style={{ borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" }}
          >
            <span style={{ fontSize: 12, color: "#6B7280" }}>
              {unread.length} {labels.unread.ru.toLowerCase()}
            </span>
            <Button
              size="sm"
              className="h-8 text-xs font-medium"
              style={{ backgroundColor: "#FFDD2D", color: "#16181D", fontSize: 12 }}
              onClick={handleAcknowledgeAll}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              {labels.markAllRead.ru}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
