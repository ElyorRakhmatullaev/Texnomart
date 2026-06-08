import React, { useState, useMemo } from "react";
import { Badge } from "@texnomart/ui/badge";
import { Button } from "@texnomart/ui/button";
import { Card, CardContent } from "@texnomart/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@texnomart/ui/select";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@texnomart/ui/tooltip";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@texnomart/ui/sheet";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import { Separator } from "@texnomart/ui/separator";
import {
  ScrollText, ClipboardList, Filter, X,
  Plus, Pencil, Send, Check, Ban, UserX,
  ArrowRight, XCircle, ChevronRight, AlertTriangle,
  Clock, CalendarDays, TrendingUp, Info, Timer,
} from "lucide-react";
import {
  type AuditActionType,
  type AuditObjectType,
  type AuditLogEntry,
  type ControlEvent,
  type PromoStatus,
  AUDIT_ACTION_CONFIG,
  AUDIT_OBJECT_CONFIG,
  MOCK_AUDIT_LOG,
  MOCK_CONTROL_EVENTS,
  MOCK_CAMPAIGNS,
  MOCK_MANAGERS,
  STATUS_CONFIG,
  ROLES,
  useApp,
  formatDate,
  BilingualLabel,
  StatusBadge,
  OverdueTag,
  RuDate,
  labels,
} from "../App";

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const MONO: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontVariantNumeric: "tabular-nums",
};

type TabId = "log" | "events";

const TABS: { id: TabId; ru: string; en: string }[] = [
  { id: "log", ru: "Аудит-лог", en: "Action log" },
  { id: "events", ru: "Свод контрольных событий", en: "Control events" },
];

const ACTION_ICONS: Record<AuditActionType, React.ElementType> = {
  creation: Plus,
  modification: Pencil,
  submit_for_approval: Send,
  approval: Check,
  rejection: XCircle,
  cancellation: Ban,
  set_not_participating: UserX,
  report_sent: ArrowRight,
};

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function ActionTypeBadge({ type }: { type: AuditActionType }) {
  const cfg = AUDIT_ACTION_CONFIG[type];
  const Icon = ACTION_ICONS[type];
  return (
    <Badge
      variant="outline"
      className="gap-1 text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      <Icon className="w-3 h-3" />
      {cfg.ru}
    </Badge>
  );
}

function ObjectTypeBadge({ type }: { type: AuditObjectType }) {
  const cfg = AUDIT_OBJECT_CONFIG[type];
  return (
    <Badge
      variant="outline"
      className="text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      {cfg.ru}
    </Badge>
  );
}

function RoleBadge({ roleId }: { roleId: string }) {
  const role = ROLES.find(r => r.id === roleId);
  if (!role) return null;
  return (
    <Badge variant="outline" className="text-xs font-medium" style={{ backgroundColor: "#F4F5F7", color: "#6B7280", borderColor: "#E5E7EB" }}>
      {role.abbr}
    </Badge>
  );
}

function StatusTransition({ before, after }: { before?: PromoStatus; after?: PromoStatus }) {
  if (!before && !after) return <span style={{ color: "#9CA3AF" }}>—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      {before ? <StatusBadge status={before} /> : <span style={{ color: "#9CA3AF" }}>—</span>}
      <ArrowRight className="w-3 h-3 shrink-0" style={{ color: "#9CA3AF" }} />
      {after ? <StatusBadge status={after} /> : <span style={{ color: "#9CA3AF" }}>—</span>}
    </span>
  );
}

function formatDateTime(dt: string): string {
  const [datePart, timePart] = dt.split(" ");
  const formatted = formatDate(datePart);
  return timePart ? `${formatted} ${timePart}` : formatted;
}

function countWorkingDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(0, count - 1);
}

// ═══════════════════════════════════════════════════════════
// FILTERS
// ═══════════════════════════════════════════════════════════

interface FilterState {
  user: string;
  role: string;
  actionType: string;
  objectType: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: FilterState = { user: "", role: "", actionType: "", objectType: "", dateFrom: "", dateTo: "" };

function activeFilterCount(f: FilterState): number {
  let n = 0;
  if (f.user) n++;
  if (f.role) n++;
  if (f.actionType) n++;
  if (f.objectType) n++;
  if (f.dateFrom) n++;
  if (f.dateTo) n++;
  return n;
}

function FilterControls({ filters, onChange, users, vertical }: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  users: { id: string; name: string }[];
  vertical?: boolean;
}) {
  const cls = vertical ? "flex flex-col gap-4" : "flex flex-wrap items-end gap-3";

  return (
    <div className={cls}>
      <div className={vertical ? "space-y-1.5" : ""}>
        {vertical && <Label className="text-xs" style={{ color: "#6B7280" }}>Пользователь / User</Label>}
        <Select value={filters.user || "__all"} onValueChange={v => onChange({ ...filters, user: v === "__all" ? "" : v })}>
          <SelectTrigger className="h-9 w-[180px] text-sm">
            <SelectValue placeholder="Пользователь" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Все пользователи</SelectItem>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={vertical ? "space-y-1.5" : ""}>
        {vertical && <Label className="text-xs" style={{ color: "#6B7280" }}>Роль / Role</Label>}
        <Select value={filters.role || "__all"} onValueChange={v => onChange({ ...filters, role: v === "__all" ? "" : v })}>
          <SelectTrigger className="h-9 w-[170px] text-sm">
            <SelectValue placeholder="Роль" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Все роли</SelectItem>
            {ROLES.map(r => (
              <SelectItem key={r.id} value={r.id}>{r.ru}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={vertical ? "space-y-1.5" : ""}>
        {vertical && <Label className="text-xs" style={{ color: "#6B7280" }}>Тип действия / Action type</Label>}
        <Select value={filters.actionType || "__all"} onValueChange={v => onChange({ ...filters, actionType: v === "__all" ? "" : v })}>
          <SelectTrigger className="h-9 w-[200px] text-sm">
            <SelectValue placeholder="Тип действия" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Все действия</SelectItem>
            {(Object.keys(AUDIT_ACTION_CONFIG) as AuditActionType[]).map(k => (
              <SelectItem key={k} value={k}>{AUDIT_ACTION_CONFIG[k].ru}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={vertical ? "space-y-1.5" : ""}>
        {vertical && <Label className="text-xs" style={{ color: "#6B7280" }}>Объект / Object</Label>}
        <Select value={filters.objectType || "__all"} onValueChange={v => onChange({ ...filters, objectType: v === "__all" ? "" : v })}>
          <SelectTrigger className="h-9 w-[140px] text-sm">
            <SelectValue placeholder="Объект" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Все объекты</SelectItem>
            {(Object.keys(AUDIT_OBJECT_CONFIG) as AuditObjectType[]).map(k => (
              <SelectItem key={k} value={k}>{AUDIT_OBJECT_CONFIG[k].ru}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={vertical ? "space-y-1.5" : ""}>
        {vertical && <Label className="text-xs" style={{ color: "#6B7280" }}>Дата с / Date from</Label>}
        <Input
          type="date"
          className="h-9 w-[150px] text-sm"
          value={filters.dateFrom}
          onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
        />
      </div>

      <div className={vertical ? "space-y-1.5" : ""}>
        {vertical && <Label className="text-xs" style={{ color: "#6B7280" }}>Дата по / Date to</Label>}
        <Input
          type="date"
          className="h-9 w-[150px] text-sm"
          value={filters.dateTo}
          onChange={e => onChange({ ...filters, dateTo: e.target.value })}
        />
      </div>

      {activeFilterCount(filters) > 0 && (
        <Button variant="ghost" size="sm" className="h-9 text-xs gap-1" style={{ color: "#DC2626" }} onClick={() => onChange(EMPTY_FILTERS)}>
          <X className="w-3.5 h-3.5" />
          Сбросить
        </Button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 1 — ACTION LOG TABLE (DESKTOP)
// ═══════════════════════════════════════════════════════════

type SortKey = "datetime" | "user" | "actionType" | "objectType";
type SortDir = "asc" | "desc";

function ActionLogTable({ entries }: { entries: AuditLogEntry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("datetime");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "datetime" ? "desc" : "asc");
    }
  }

  const sorted = useMemo(() => {
    const arr = [...entries];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "datetime") cmp = a.datetime.localeCompare(b.datetime);
      else if (sortKey === "user") cmp = a.userName.localeCompare(b.userName);
      else if (sortKey === "actionType") cmp = a.actionType.localeCompare(b.actionType);
      else if (sortKey === "objectType") cmp = a.objectType.localeCompare(b.objectType);
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [entries, sortKey, sortDir]);

  const SortIndicator = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return <span className="ml-1 text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const thClass = "px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap cursor-pointer select-none";
  const tdClass = "px-3 py-2.5 text-sm";

  return (
    <div className="overflow-auto rounded-lg border" style={{ borderColor: "#E5E7EB" }}>
      <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
        <thead>
          <tr style={{ backgroundColor: "#F9FAFB" }}>
            <th className={thClass} onClick={() => toggleSort("user")} style={{ color: "#374151", minWidth: 160 }}>
              Пользователь<SortIndicator col="user" />
            </th>
            <th className={thClass} style={{ color: "#374151", minWidth: 60 }}>
              Роль
            </th>
            <th className={thClass} onClick={() => toggleSort("datetime")} style={{ color: "#374151", minWidth: 150 }}>
              Дата и время<SortIndicator col="datetime" />
            </th>
            <th className={thClass} onClick={() => toggleSort("actionType")} style={{ color: "#374151", minWidth: 200 }}>
              Тип действия<SortIndicator col="actionType" />
            </th>
            <th className={thClass} onClick={() => toggleSort("objectType")} style={{ color: "#374151", minWidth: 120 }}>
              Объект<SortIndicator col="objectType" />
            </th>
            <th className={thClass} style={{ color: "#374151", minWidth: 120 }}>
              ID объекта
            </th>
            <th className={thClass} style={{ color: "#374151", minWidth: 260 }}>
              Статус до → после
            </th>
            <th className={thClass} style={{ color: "#374151", minWidth: 200 }}>
              Комментарий
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, idx) => (
            <tr key={entry.id} style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
              <td className={tdClass}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0" style={{ backgroundColor: "#F4F5F7", color: "#6B7280" }}>
                    {entry.userName.split(" ").map(w => w[0]).join("").slice(0, 2)}
                  </div>
                  <span className="font-medium truncate" style={{ color: "#16181D" }}>{entry.userName}</span>
                </div>
              </td>
              <td className={tdClass}>
                <RoleBadge roleId={entry.userRole} />
              </td>
              <td className={tdClass}>
                <span style={{ ...MONO, color: "#374151", fontSize: 13 }}>{formatDateTime(entry.datetime)}</span>
              </td>
              <td className={tdClass}>
                <ActionTypeBadge type={entry.actionType} />
              </td>
              <td className={tdClass}>
                <ObjectTypeBadge type={entry.objectType} />
              </td>
              <td className={tdClass}>
                <span style={{ ...MONO, color: "#2563EB", fontSize: 12 }}>{entry.objectId}</span>
              </td>
              <td className={tdClass}>
                <StatusTransition before={entry.statusBefore} after={entry.statusAfter} />
              </td>
              <td className={tdClass}>
                {entry.comment ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs truncate block max-w-[200px] cursor-help" style={{ color: "#6B7280" }}>
                        {entry.comment}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-sm">
                      {entry.comment}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <span style={{ color: "#D1D5DB" }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 1 — ACTION LOG CARDS (MOBILE)
// ═══════════════════════════════════════════════════════════

function ActionLogCards({ entries }: { entries: AuditLogEntry[] }) {
  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => b.datetime.localeCompare(a.datetime));
  }, [entries]);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <ClipboardList className="w-12 h-12" style={{ color: "#D1D5DB" }} />
        <p className="text-sm font-medium" style={{ color: "#6B7280" }}>Нет записей</p>
        <p className="text-xs" style={{ color: "#9CA3AF" }}>No entries found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map(entry => (
        <Card key={entry.id}>
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0" style={{ backgroundColor: "#F4F5F7", color: "#6B7280" }}>
                  {entry.userName.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </div>
                <span className="text-sm font-medium truncate" style={{ color: "#16181D" }}>{entry.userName}</span>
                <RoleBadge roleId={entry.userRole} />
              </div>
              <span className="text-xs shrink-0" style={{ ...MONO, color: "#9CA3AF" }}>
                {formatDateTime(entry.datetime)}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <ActionTypeBadge type={entry.actionType} />
              <ObjectTypeBadge type={entry.objectType} />
              <span className="text-xs" style={{ ...MONO, color: "#2563EB" }}>{entry.objectId}</span>
            </div>

            {(entry.statusBefore || entry.statusAfter) && (
              <StatusTransition before={entry.statusBefore} after={entry.statusAfter} />
            )}

            {entry.comment && (
              <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                {entry.comment}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 2 — CONTROL EVENTS: HORIZONTAL TIMELINE (DESKTOP)
// ═══════════════════════════════════════════════════════════

function HorizontalTimeline({ events }: { events: ControlEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-start pt-2 pb-6 px-4" style={{ minWidth: events.length * 160 }}>
        {events.map((ev, idx) => {
          const isLast = idx === events.length - 1;
          const isCompleted = !!ev.actualDate;
          const isPending = !ev.actualDate && !ev.isOverdue;

          let nodeColor = "#E5E7EB";
          let nodeBorder = "#D1D5DB";
          let nodeBg = "#FFFFFF";
          if (ev.isOverdue) {
            nodeColor = "#DC2626";
            nodeBorder = "#DC2626";
            nodeBg = "#FEE2E2";
          } else if (isCompleted) {
            nodeColor = "#16A34A";
            nodeBorder = "#16A34A";
            nodeBg = "#DCFCE7";
          }

          return (
            <div key={ev.id} className="flex items-start" style={{ flex: isLast ? "0 0 auto" : "1 1 0%" }}>
              <div className="flex flex-col items-center" style={{ width: 140 }}>
                {/* Date above */}
                <div className="text-center mb-2 h-10 flex flex-col justify-end">
                  {ev.actualDate ? (
                    <span className="text-xs font-medium" style={{ ...MONO, color: ev.isOverdue ? "#DC2626" : "#374151" }}>
                      {formatDate(ev.actualDate)}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ ...MONO, color: "#9CA3AF" }}>
                      {formatDate(ev.expectedDate)}
                    </span>
                  )}
                  {ev.isOverdue && ev.overdueDays && (
                    <div className="mt-0.5">
                      <OverdueTag days={ev.overdueDays} />
                    </div>
                  )}
                </div>

                {/* Node + line */}
                <div className="flex items-center w-full">
                  <div className="flex-1 h-px" style={{ backgroundColor: idx === 0 ? "transparent" : "#E5E7EB" }} />
                  <div
                    className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center"
                    style={{ borderColor: nodeBorder, backgroundColor: nodeBg }}
                  >
                    {isCompleted && !ev.isOverdue && <Check className="w-3 h-3" style={{ color: nodeColor }} />}
                    {ev.isOverdue && <AlertTriangle className="w-3 h-3" style={{ color: "#DC2626" }} />}
                  </div>
                  <div className="flex-1 h-px" style={{ backgroundColor: isLast ? "transparent" : "#E5E7EB" }} />
                </div>

                {/* Label below */}
                <div className="text-center mt-2 px-1">
                  <p className="text-xs font-medium leading-tight" style={{ color: isPending ? "#9CA3AF" : "#374151" }}>
                    {ev.milestoneRu}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{ev.milestoneEn}</p>
                  <p className="text-[10px] mt-1" style={{ color: ev.isOverdue ? "#DC2626" : "#6B7280" }}>
                    {ev.responsibleUser}
                  </p>
                  <Badge variant="outline" className="text-[10px] mt-0.5 px-1.5 py-0" style={{ backgroundColor: "#F4F5F7", color: "#6B7280", borderColor: "#E5E7EB" }}>
                    {ev.responsibleRole}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 2 — CONTROL EVENTS: VERTICAL TIMELINE (MOBILE)
// ═══════════════════════════════════════════════════════════

function VerticalTimeline({ events }: { events: ControlEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="relative pl-6 space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-px" style={{ backgroundColor: "#E5E7EB" }} />

      {events.map((ev) => {
        const isCompleted = !!ev.actualDate;

        let nodeBg = "#FFFFFF";
        let nodeBorder = "#D1D5DB";
        if (ev.isOverdue) { nodeBg = "#FEE2E2"; nodeBorder = "#DC2626"; }
        else if (isCompleted) { nodeBg = "#DCFCE7"; nodeBorder = "#16A34A"; }

        return (
          <div key={ev.id} className="relative flex items-start gap-3 pb-4">
            <div
              className="absolute left-[-13px] top-1 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center z-10"
              style={{ borderColor: nodeBorder, backgroundColor: nodeBg }}
            >
              {isCompleted && !ev.isOverdue && <Check className="w-2.5 h-2.5" style={{ color: "#16A34A" }} />}
              {ev.isOverdue && <AlertTriangle className="w-2.5 h-2.5" style={{ color: "#DC2626" }} />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium" style={{ color: ev.isOverdue ? "#DC2626" : "#374151" }}>
                  {ev.milestoneRu}
                </span>
                {ev.isOverdue && ev.overdueDays && <OverdueTag days={ev.overdueDays} />}
              </div>
              <p className="text-[10px]" style={{ color: "#9CA3AF" }}>{ev.milestoneEn}</p>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs" style={{ ...MONO, color: ev.isOverdue ? "#DC2626" : "#6B7280" }}>
                  {ev.actualDate ? formatDate(ev.actualDate) : formatDate(ev.expectedDate)}
                </span>
                {!ev.actualDate && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ backgroundColor: "#FEF3C7", color: "#D97706", borderColor: "#FDE68A" }}>
                    ожидается
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs" style={{ color: "#6B7280" }}>{ev.responsibleUser}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ backgroundColor: "#F4F5F7", color: "#6B7280", borderColor: "#E5E7EB" }}>
                  {ev.responsibleRole}
                </Badge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB 2 — SUMMARY STRIP
// ═══════════════════════════════════════════════════════════

function SummaryStrip({ events }: { events: ControlEvent[] }) {
  const completed = events.filter(e => e.actualDate);
  const overdueCount = events.filter(e => e.isOverdue).length;

  const approvalEvents = completed.filter(e =>
    e.milestone === "senior_km_approval" || e.milestone === "kd_approval"
  );
  let avgApprovalDays = 0;
  if (approvalEvents.length > 0) {
    const kmDataEvents = events.filter(e => e.milestone === "km_data_sent" && e.actualDate);
    const totalDays = approvalEvents.reduce((sum, ae) => {
      const campaignKmData = kmDataEvents.find(k => k.campaignId === ae.campaignId);
      if (campaignKmData && campaignKmData.actualDate && ae.actualDate) {
        return sum + countWorkingDays(campaignKmData.actualDate, ae.actualDate);
      }
      return sum;
    }, 0);
    avgApprovalDays = Math.round(totalDays / approvalEvents.length * 10) / 10;
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Card className="flex-1 min-w-[140px]">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#DBEAFE" }}>
            <CalendarDays className="w-4.5 h-4.5" style={{ color: "#2563EB" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "#6B7280" }}>Этапов пройдено</p>
            <p className="text-lg font-bold" style={{ ...MONO, color: "#16181D" }}>{completed.length}<span className="text-sm font-normal" style={{ color: "#9CA3AF" }}>/{events.length}</span></p>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 min-w-[140px]">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: overdueCount > 0 ? "#FEE2E2" : "#DCFCE7" }}>
            <AlertTriangle className="w-4.5 h-4.5" style={{ color: overdueCount > 0 ? "#DC2626" : "#16A34A" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "#6B7280" }}>Просрочки</p>
            <p className="text-lg font-bold" style={{ ...MONO, color: overdueCount > 0 ? "#DC2626" : "#16A34A" }}>{overdueCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 min-w-[140px]">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEF3C7" }}>
            <Timer className="w-4.5 h-4.5" style={{ color: "#D97706" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "#6B7280" }}>Среднее время согласования</p>
            <p className="text-lg font-bold" style={{ ...MONO, color: "#16181D" }}>
              {avgApprovalDays > 0 ? avgApprovalDays : "—"}
              {avgApprovalDays > 0 && <span className="text-xs font-normal ml-1" style={{ color: "#6B7280" }}>раб. дн.</span>}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════

export default function AuditLogPage() {
  const { campaigns, managers } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>("log");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState("PROMO-2026-003");

  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>();
    MOCK_AUDIT_LOG.forEach(e => map.set(e.userId, e.userName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, []);

  const filteredLog = useMemo(() => {
    return MOCK_AUDIT_LOG.filter(e => {
      if (filters.user && e.userId !== filters.user) return false;
      if (filters.role && e.userRole !== filters.role) return false;
      if (filters.actionType && e.actionType !== filters.actionType) return false;
      if (filters.objectType && e.objectType !== filters.objectType) return false;
      if (filters.dateFrom) {
        const entryDate = e.datetime.split(" ")[0];
        if (entryDate < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const entryDate = e.datetime.split(" ")[0];
        if (entryDate > filters.dateTo) return false;
      }
      return true;
    });
  }, [filters]);

  const campaignEvents = useMemo(() => {
    return MOCK_CONTROL_EVENTS.filter(e => e.campaignId === selectedCampaignId);
  }, [selectedCampaignId]);

  const timelineCampaigns = useMemo(() => {
    const ids = new Set(MOCK_CONTROL_EVENTS.map(e => e.campaignId));
    return campaigns.filter(c => ids.has(c.id));
  }, [campaigns]);

  const filterCount = activeFilterCount(filters);

  return (
    <div className="space-y-5">
      {/* Page title */}
      <BilingualLabel ru="Аудит-лог" en="Audit log" size="page" />

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: "#F4F5F7" }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? "#FFFFFF" : "transparent",
                color: isActive ? "#16181D" : "#6B7280",
                boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <span>{tab.ru}</span>
              <span className="hidden sm:inline text-xs ml-1.5" style={{ color: "#9CA3AF" }}>
                {tab.en}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─────────────── TAB 1: ACTION LOG ─────────────── */}
      {activeTab === "log" && (
        <div className="space-y-4">
          {/* Desktop filters */}
          <div className="hidden md:block">
            <FilterControls filters={filters} onChange={setFilters} users={uniqueUsers} />
          </div>

          {/* Mobile filter button */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setFilterSheetOpen(true)}
            >
              <Filter className="w-4 h-4" />
              Фильтры
              {filterCount > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs" style={{ backgroundColor: "#FFDD2D", color: "#16181D" }}>
                  {filterCount}
                </Badge>
              )}
            </Button>

            {filterCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-8" style={{ color: "#DC2626" }} onClick={() => setFilters(EMPTY_FILTERS)}>
                <X className="w-3.5 h-3.5" /> Сбросить
              </Button>
            )}
          </div>

          {/* Mobile filter Sheet */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetContent side="left" className="w-[320px] sm:w-[380px]">
              <SheetHeader>
                <SheetTitle>
                  <span style={{ color: "#16181D" }}>Фильтры</span>
                  <span className="text-sm font-normal ml-2" style={{ color: "#9CA3AF" }}>Filters</span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterControls filters={filters} onChange={setFilters} users={uniqueUsers} vertical />
              </div>
              <div className="mt-6">
                <Button className="w-full" style={{ backgroundColor: "#FFDD2D", color: "#16181D" }} onClick={() => setFilterSheetOpen(false)}>
                  Применить
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Active filter chips (mobile) */}
          {filterCount > 0 && (
            <div className="md:hidden flex flex-wrap gap-1.5">
              {filters.user && (
                <Badge variant="outline" className="gap-1 text-xs">
                  {uniqueUsers.find(u => u.id === filters.user)?.name}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, user: "" })} />
                </Badge>
              )}
              {filters.role && (
                <Badge variant="outline" className="gap-1 text-xs">
                  {ROLES.find(r => r.id === filters.role)?.ru}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, role: "" })} />
                </Badge>
              )}
              {filters.actionType && (
                <Badge variant="outline" className="gap-1 text-xs">
                  {AUDIT_ACTION_CONFIG[filters.actionType as AuditActionType].ru}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, actionType: "" })} />
                </Badge>
              )}
              {filters.objectType && (
                <Badge variant="outline" className="gap-1 text-xs">
                  {AUDIT_OBJECT_CONFIG[filters.objectType as AuditObjectType].ru}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, objectType: "" })} />
                </Badge>
              )}
              {filters.dateFrom && (
                <Badge variant="outline" className="gap-1 text-xs">
                  с {formatDate(filters.dateFrom)}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, dateFrom: "" })} />
                </Badge>
              )}
              {filters.dateTo && (
                <Badge variant="outline" className="gap-1 text-xs">
                  по {formatDate(filters.dateTo)}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, dateTo: "" })} />
                </Badge>
              )}
            </div>
          )}

          {/* Desktop table */}
          <div className="hidden md:block">
            {filteredLog.length > 0 ? (
              <ActionLogTable entries={filteredLog} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <ClipboardList className="w-12 h-12" style={{ color: "#D1D5DB" }} />
                <p className="text-sm font-medium" style={{ color: "#6B7280" }}>Нет записей</p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>No entries match current filters</p>
              </div>
            )}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            <ActionLogCards entries={filteredLog} />
          </div>

          {/* Row count */}
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              Показано {filteredLog.length} из {MOCK_AUDIT_LOG.length} записей
            </p>
          </div>
        </div>
      )}

      {/* ─────────────── TAB 2: CONTROL EVENTS ─────────────── */}
      {activeTab === "events" && (
        <div className="space-y-4">
          {/* Campaign selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Label className="text-sm font-medium shrink-0" style={{ color: "#374151" }}>
              Акция / Campaign
            </Label>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger className="h-9 w-full sm:w-[400px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timelineCampaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <span style={{ ...MONO, fontSize: 12, marginRight: 8, color: "#2563EB" }}>{c.id}</span>
                    <span>{c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary strip */}
          <SummaryStrip events={campaignEvents} />

          {/* Info note */}
          <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#2563EB" }} />
            <div>
              <p className="text-xs" style={{ color: "#1E40AF" }}>
                Таймлайн показывает ключевые контрольные точки прохождения акции. Красные узлы — просрочка с указанием количества дней и ответственного.
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "#60A5FA" }}>
                Timeline shows key milestones. Red nodes indicate breached deadlines with day count and responsible party.
              </p>
            </div>
          </div>

          {/* Desktop: horizontal timeline */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-4">
                <HorizontalTimeline events={campaignEvents} />
              </CardContent>
            </Card>
          </div>

          {/* Mobile: vertical timeline */}
          <div className="md:hidden">
            <Card>
              <CardContent className="p-4">
                <VerticalTimeline events={campaignEvents} />
              </CardContent>
            </Card>
          </div>

          {/* Campaign metadata */}
          {campaignEvents.length > 0 && (() => {
            const camp = campaigns.find(c => c.id === selectedCampaignId);
            if (!camp) return null;
            return (
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span style={{ color: "#6B7280" }}>Период: </span>
                      <span style={{ ...MONO, color: "#374151" }}>{formatDate(camp.startDate)} — {formatDate(camp.endDate)}</span>
                    </div>
                    <div>
                      <span style={{ color: "#6B7280" }}>Тип: </span>
                      <span style={{ color: "#374151" }}>{camp.type === "planned" ? "Плановая" : "Внеплановая"}</span>
                    </div>
                    <div>
                      <span style={{ color: "#6B7280" }}>Версия: </span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0" style={{ ...MONO, backgroundColor: "#DBEAFE", color: "#2563EB", borderColor: "#BFDBFE" }}>
                        v{camp.version}
                      </Badge>
                    </div>
                    <div>
                      <span style={{ color: "#6B7280" }}>Статус: </span>
                      <StatusBadge status={camp.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}
    </div>
  );
}
