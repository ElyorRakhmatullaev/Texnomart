"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  RefreshCw,
  Download,
  Bell,
  Eye,
  Search,
  ArrowRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Shield,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { Button } from "@texnomart/ui/button";
import { Card } from "@texnomart/ui/card";
import { Badge } from "@texnomart/ui/badge";
import { Input } from "@texnomart/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@texnomart/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@texnomart/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@texnomart/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@texnomart/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@texnomart/ui/dropdown-menu";
import { Switch } from "@texnomart/ui/switch";
import {
  type AuditEntry,
  type AuditActionType,
  type AuditObjectType,
  type SystemLogEntry,
  type SystemLogLevel,
  type IntegrationLogEntry,
  type IntegrationSource,
  type SecurityAlert,
  type SecurityAlertStatus,
  type AlertRule,
  AUDIT_ENTRIES,
  SYSTEM_LOGS,
  INTEGRATION_LOGS,
  SECURITY_ALERTS,
  ALERT_RULES,
  ACTION_TYPE_STYLES,
  OBJECT_TYPE_LABELS,
  LOG_LEVEL_STYLES,
  ALERT_SEVERITY_STYLES,
  INTEGRATION_SOURCE_LABELS,
  ALERT_TRIGGERS,
} from "@/lib/audit-mock-data";

// ── Helpers ────────────────────────────────────────────────────────────

const PAGE_SIZES = [20, 50, 100];

function formatTimestamp(date: Date): string {
  return format(date, "dd.MM.yyyy HH:mm:ss", { locale: ru });
}

function formatTimestampShort(date: Date): string {
  return format(date, "HH:mm:ss", { locale: ru });
}

function getStatusCodeColor(code: number): string {
  if (code >= 200 && code < 300) return "text-green-600";
  if (code >= 400 && code < 500) return "text-amber-600";
  return "text-red-600";
}

function getDurationColor(ms: number): string {
  if (ms < 1000) return "text-green-600";
  if (ms < 5000) return "text-amber-600";
  return "text-red-600";
}

// ── Filter Bar ─────────────────────────────────────────────────────────

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  actionFilter: AuditActionType | "all";
  onActionFilterChange: (v: AuditActionType | "all") => void;
  objectFilter: AuditObjectType | "all";
  onObjectFilterChange: (v: AuditObjectType | "all") => void;
  onReset: () => void;
  hasFilters: boolean;
}

function FilterBar({
  search,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
  objectFilter,
  onObjectFilterChange,
  onReset,
  hasFilters,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 p-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Поиск по записям..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
      <Select
        value={actionFilter}
        onValueChange={(v) => onActionFilterChange(v as AuditActionType | "all")}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Тип действия" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все действия</SelectItem>
          {Object.entries(ACTION_TYPE_STYLES).map(([key, { label }]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={objectFilter}
        onValueChange={(v) => onObjectFilterChange(v as AuditObjectType | "all")}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Объект" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все объекты</SelectItem>
          {Object.entries(OBJECT_TYPE_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} className="text-gray-500">
          Сбросить
        </Button>
      )}
    </div>
  );
}

// ── Tab 1: User Actions ────────────────────────────────────────────────

function UserActionsTab() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState<AuditActionType | "all">("all");
  const [objectFilter, setObjectFilter] = React.useState<AuditObjectType | "all">("all");
  const [pageSize, setPageSize] = React.useState(20);
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    return AUDIT_ENTRIES.filter((e) => {
      if (actionFilter !== "all" && e.actionType !== actionFilter) return false;
      if (objectFilter !== "all" && e.objectType !== objectFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.userName.toLowerCase().includes(q) ||
          e.objectLabel.toLowerCase().includes(q) ||
          e.ip.includes(q) ||
          e.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, actionFilter, objectFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const hasFilters = search !== "" || actionFilter !== "all" || objectFilter !== "all";

  return (
    <div className="space-y-4">
      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        actionFilter={actionFilter}
        onActionFilterChange={(v) => { setActionFilter(v); setPage(1); }}
        objectFilter={objectFilter}
        onObjectFilterChange={(v) => { setObjectFilter(v); setPage(1); }}
        onReset={() => { setSearch(""); setActionFilter("all"); setObjectFilter("all"); setPage(1); }}
        hasFilters={hasFilters}
      />

      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[160px] text-xs font-medium text-gray-500 uppercase">Дата/время</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase">Пользователь</TableHead>
              <TableHead className="w-[140px] text-xs font-medium text-gray-500 uppercase">IP</TableHead>
              <TableHead className="w-[140px] text-xs font-medium text-gray-500 uppercase">Действие</TableHead>
              <TableHead className="w-[200px] text-xs font-medium text-gray-500 uppercase">Объект</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase">Изменения</TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((entry) => (
              <TableRow
                key={entry.id}
                className="h-12 cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/audit/${entry.id}`)}
              >
                <TableCell className="text-sm tabular-nums text-gray-600">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{formatTimestamp(entry.timestamp)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {format(entry.timestamp, "dd.MM.yyyy HH:mm:ss.SSS")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600 shrink-0">
                      {entry.userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <span className="text-sm font-medium truncate">{entry.userName}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                      {entry.userRole}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm tabular-nums text-gray-600">
                          {entry.ipCountry !== "—" && (
                            <span className="mr-1">{entry.ipCountry === "UZ" ? "🇺🇿" : entry.ipCountry === "RU" ? "🇷🇺" : "🏳️"}</span>
                          )}
                          {entry.ip}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{entry.ipCity}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs", ACTION_TYPE_STYLES[entry.actionType].className)}>
                    {ACTION_TYPE_STYLES[entry.actionType].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button
                    className="text-sm text-blue-600 hover:underline truncate block max-w-[200px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(entry.objectHref);
                    }}
                  >
                    {entry.objectLabel}
                  </button>
                </TableCell>
                <TableCell>
                  {entry.changes.length > 0 ? (
                    <span className="text-sm text-gray-700 truncate block">
                      {entry.changes[0].field}: {entry.changes[0].oldValue}{" "}
                      <ArrowRight className="inline h-3 w-3 text-gray-400" />{" "}
                      {entry.changes[0].newValue}
                      {entry.changes.length > 1 && (
                        <span className="text-gray-400 ml-1">+{entry.changes.length - 1}</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/audit/${entry.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                  Записи не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {paginated.map((entry) => (
          <Card
            key={entry.id}
            className="p-3 cursor-pointer hover:bg-gray-50"
            onClick={() => navigate(`/audit/${entry.id}`)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                  {entry.userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{entry.userName}</p>
                  <p className="text-xs text-gray-500 tabular-nums">
                    {formatTimestamp(entry.timestamp)}
                  </p>
                </div>
              </div>
              <Badge className={cn("text-[10px] shrink-0", ACTION_TYPE_STYLES[entry.actionType].className)}>
                {ACTION_TYPE_STYLES[entry.actionType].label}
              </Badge>
            </div>
            <p className="text-sm text-blue-600 mt-2 truncate">{entry.objectLabel}</p>
            {entry.changes.length > 0 && (
              <p className="text-xs text-gray-500 mt-1 truncate">
                {entry.changes[0].field}: {entry.changes[0].oldValue} → {entry.changes[0].newValue}
              </p>
            )}
          </Card>
        ))}
        {paginated.length === 0 && (
          <div className="py-12 text-center text-gray-500">Записи не найдены</div>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Показывать</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">строк</span>
          </div>
          <span className="text-sm text-gray-500 tabular-nums">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} из {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="icon"
                  className={cn("h-8 w-8", pageNum === page && "bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90")}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: System Logs ─────────────────────────────────────────────────

function SystemLogsTab() {
  const [levelFilter, setLevelFilter] = React.useState<SystemLogLevel | "all">("all");
  const [liveMode, setLiveMode] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    if (levelFilter === "all") return SYSTEM_LOGS;
    return SYSTEM_LOGS.filter((l) => l.level === levelFilter);
  }, [levelFilter]);

  const levels: Array<{ key: SystemLogLevel | "all"; label: string }> = [
    { key: "all", label: "Все" },
    { key: "error", label: "Error" },
    { key: "warning", label: "Warning" },
    { key: "info", label: "Info" },
    { key: "debug", label: "Debug" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {levels.map((l) => (
            <Button
              key={l.key}
              variant={levelFilter === l.key ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8",
                levelFilter === l.key && "bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90"
              )}
              onClick={() => setLevelFilter(l.key)}
            >
              {l.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {liveMode ? (
            <Pause className="h-4 w-4 text-green-600" />
          ) : (
            <Play className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-sm text-gray-600">Live режим</span>
          <Switch checked={liveMode} onCheckedChange={setLiveMode} />
        </div>
      </div>

      <Card className="overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[160px] text-xs font-medium text-gray-500 uppercase">Время</TableHead>
                <TableHead className="w-[80px] text-xs font-medium text-gray-500 uppercase">Уровень</TableHead>
                <TableHead className="w-[160px] text-xs font-medium text-gray-500 uppercase">Компонент</TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase">Сообщение</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow
                    className={cn("h-12 cursor-pointer hover:bg-gray-50", log.stackTrace && "cursor-pointer")}
                    onClick={() => log.stackTrace && setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <TableCell className="text-sm tabular-nums text-gray-600">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", LOG_LEVEL_STYLES[log.level].className)}>
                        {LOG_LEVEL_STYLES[log.level].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-gray-700">
                      {log.component}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 truncate">{log.message}</span>
                        {log.stackTrace && (
                          expandedId === log.id
                            ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                            : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === log.id && log.stackTrace && (
                    <TableRow>
                      <TableCell colSpan={4} className="p-0">
                        <pre className="bg-gray-900 text-green-400 p-4 text-xs font-mono overflow-x-auto whitespace-pre">
                          {log.stackTrace}
                        </pre>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y">
          {filtered.map((log) => (
            <div
              key={log.id}
              className="p-3 cursor-pointer"
              onClick={() => log.stackTrace && setExpandedId(expandedId === log.id ? null : log.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-[10px]", LOG_LEVEL_STYLES[log.level].className)}>
                    {LOG_LEVEL_STYLES[log.level].label}
                  </Badge>
                  <span className="text-xs font-mono text-gray-500">{log.component}</span>
                </div>
                <span className="text-xs text-gray-400 tabular-nums">{formatTimestampShort(log.timestamp)}</span>
              </div>
              <p className="text-sm text-gray-700 mt-1 line-clamp-2">{log.message}</p>
              {expandedId === log.id && log.stackTrace && (
                <pre className="bg-gray-900 text-green-400 p-3 text-xs font-mono overflow-x-auto whitespace-pre mt-2 rounded">
                  {log.stackTrace}
                </pre>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Tab 3: Integration Logs ────────────────────────────────────────────

function IntegrationLogsTab() {
  const [source, setSource] = React.useState<IntegrationSource>("1c");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    return INTEGRATION_LOGS.filter((l) => l.source === source);
  }, [source]);

  const sources: Array<{ key: IntegrationSource; label: string }> = [
    { key: "1c", label: "1С" },
    { key: "bnpl", label: "BNPL-партнёры" },
    { key: "sms", label: "SMS" },
    { key: "email", label: "Email" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {sources.map((s) => (
          <Button
            key={s.key}
            variant={source === s.key ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8",
              source === s.key && "bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90"
            )}
            onClick={() => { setSource(s.key); setExpandedId(null); }}
          >
            {s.label}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[160px] text-xs font-medium text-gray-500 uppercase">Время</TableHead>
                <TableHead className="w-[40px] text-xs font-medium text-gray-500 uppercase" />
                <TableHead className="text-xs font-medium text-gray-500 uppercase">Endpoint</TableHead>
                <TableHead className="w-[80px] text-xs font-medium text-gray-500 uppercase">Статус</TableHead>
                <TableHead className="w-[100px] text-xs font-medium text-gray-500 uppercase text-right">Время (мс)</TableHead>
                <TableHead className="w-[60px] text-xs font-medium text-gray-500 uppercase text-right">Retry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow
                    className="h-12 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <TableCell className="text-sm tabular-nums text-gray-600">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {log.direction === "outgoing" ? (
                              <ArrowUpRight className="h-4 w-4 text-blue-500" />
                            ) : (
                              <ArrowDownLeft className="h-4 w-4 text-green-500" />
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            {log.direction === "outgoing" ? "Исходящий" : "Входящий"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-gray-700 truncate max-w-[300px]">
                      {log.endpoint}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs tabular-nums", getStatusCodeColor(log.statusCode))}
                      >
                        {log.statusCode}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("text-sm text-right tabular-nums", getDurationColor(log.durationMs))}>
                      {log.durationMs.toLocaleString("ru-RU")}
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums text-gray-600">
                      {log.retryCount > 0 ? log.retryCount : "—"}
                    </TableCell>
                  </TableRow>
                  {expandedId === log.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500 uppercase">Request</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(log.requestPayload);
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <pre className="bg-gray-50 p-3 text-xs font-mono rounded overflow-x-auto whitespace-pre max-h-[200px]">
                              {log.requestPayload}
                            </pre>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500 uppercase">Response</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(log.responsePayload);
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <pre className="bg-gray-50 p-3 text-xs font-mono rounded overflow-x-auto whitespace-pre max-h-[200px]">
                              {log.responsePayload}
                            </pre>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                    Нет записей
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y">
          {filtered.map((log) => (
            <div
              key={log.id}
              className="p-3 cursor-pointer"
              onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {log.direction === "outgoing" ? (
                    <ArrowUpRight className="h-4 w-4 text-blue-500" />
                  ) : (
                    <ArrowDownLeft className="h-4 w-4 text-green-500" />
                  )}
                  <Badge
                    variant="outline"
                    className={cn("text-xs tabular-nums", getStatusCodeColor(log.statusCode))}
                  >
                    {log.statusCode}
                  </Badge>
                  <span className={cn("text-xs tabular-nums", getDurationColor(log.durationMs))}>
                    {log.durationMs.toLocaleString("ru-RU")} мс
                  </span>
                </div>
                <span className="text-xs text-gray-400 tabular-nums">{formatTimestampShort(log.timestamp)}</span>
              </div>
              <p className="text-sm font-mono text-gray-700 mt-1 truncate">{log.endpoint}</p>
              {expandedId === log.id && (
                <div className="mt-3 space-y-3">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase">Request</span>
                    <pre className="bg-gray-50 p-2 text-xs font-mono rounded overflow-x-auto whitespace-pre mt-1 max-h-[150px]">
                      {log.requestPayload}
                    </pre>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase">Response</span>
                    <pre className="bg-gray-50 p-2 text-xs font-mono rounded overflow-x-auto whitespace-pre mt-1 max-h-[150px]">
                      {log.responsePayload}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Tab 4: Security Alerts ─────────────────────────────────────────────

function SecurityAlertsTab() {
  const [statusFilter, setStatusFilter] = React.useState<SecurityAlertStatus | "all">("all");

  const filtered = React.useMemo(() => {
    if (statusFilter === "all") return SECURITY_ALERTS;
    return SECURITY_ALERTS.filter((a) => a.status === statusFilter);
  }, [statusFilter]);

  const statuses: Array<{ key: SecurityAlertStatus | "all"; label: string; count: number }> = [
    { key: "all", label: "Все", count: SECURITY_ALERTS.length },
    { key: "active", label: "Активные", count: SECURITY_ALERTS.filter((a) => a.status === "active").length },
    { key: "resolved", label: "Разобранные", count: SECURITY_ALERTS.filter((a) => a.status === "resolved").length },
  ];

  function SeverityIcon({ severity }: { severity: SecurityAlert["severity"] }) {
    if (severity === "critical" || severity === "warning") {
      return <AlertTriangle className={cn("h-5 w-5", ALERT_SEVERITY_STYLES[severity].className)} />;
    }
    return <Info className={cn("h-5 w-5", ALERT_SEVERITY_STYLES[severity].className)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {statuses.map((s) => (
          <Button
            key={s.key}
            variant={statusFilter === s.key ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8",
              statusFilter === s.key && "bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90"
            )}
            onClick={() => setStatusFilter(s.key)}
          >
            {s.label}
            <span className="ml-1 text-xs opacity-70">({s.count})</span>
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((alert) => (
          <Card
            key={alert.id}
            className={cn("p-4 border", ALERT_SEVERITY_STYLES[alert.severity].bgClassName)}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <SeverityIcon severity={alert.severity} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold">{alert.title}</h4>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] shrink-0",
                      alert.status === "active" ? "border-red-300 text-red-700" : "border-green-300 text-green-700"
                    )}
                  >
                    {alert.status === "active" ? "Активен" : "Разобран"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-xs text-gray-500 tabular-nums">
                    {formatTimestamp(alert.timestamp)}
                  </span>
                  {alert.resolvedAt && (
                    <span className="text-xs text-green-600">
                      Разобран: {alert.resolvedBy}, {formatDistanceToNow(alert.resolvedAt, { locale: ru, addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">Нет алертов</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Alerts Config Dialog ───────────────────────────────────────────────

function AlertsConfigDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [rules, setRules] = React.useState<AlertRule[]>(ALERT_RULES);

  function addRule() {
    setRules((prev) => [
      ...prev,
      {
        id: `RULE-${String(prev.length + 1).padStart(3, "0")}`,
        trigger: ALERT_TRIGGERS[0],
        threshold: 5,
        unit: "раз",
        windowMinutes: 10,
        recipients: ["USR-001"],
        enabled: true,
      },
    ]);
  }

  function removeRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  function toggleRule(id: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройка алертов безопасности</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {rules.map((rule) => (
            <Card
              key={rule.id}
              className={cn("p-4", !rule.enabled && "opacity-50")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Select
                      value={rule.trigger}
                      onValueChange={(v) =>
                        setRules((prev) =>
                          prev.map((r) => (r.id === rule.id ? { ...r, trigger: v } : r))
                        )
                      }
                    >
                      <SelectTrigger className="flex-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALERT_TRIGGERS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600">Порог:</span>
                    <Input
                      type="number"
                      value={rule.threshold}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((r) =>
                            r.id === rule.id
                              ? { ...r, threshold: Number(e.target.value) }
                              : r
                          )
                        )
                      }
                      className="w-[80px] h-8"
                    />
                    <span className="text-sm text-gray-500">{rule.unit}</span>
                    <span className="text-sm text-gray-600 ml-2">за</span>
                    <Input
                      type="number"
                      value={rule.windowMinutes}
                      onChange={(e) =>
                        setRules((prev) =>
                          prev.map((r) =>
                            r.id === rule.id
                              ? { ...r, windowMinutes: Number(e.target.value) }
                              : r
                          )
                        )
                      }
                      className="w-[80px] h-8"
                    />
                    <span className="text-sm text-gray-500">мин</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Получатели:</span>
                    {rule.recipients.map((r) => (
                      <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => removeRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          <Button variant="outline" className="w-full" onClick={addRule}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить правило
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export function AuditPage() {
  const [alertsOpen, setAlertsOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-gray-900">Журнал аудита</h1>
          <p className="text-sm text-gray-500 mt-1">
            Всего записей: {AUDIT_ENTRIES.length.toLocaleString("ru-RU")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Экспорт в CSV</DropdownMenuItem>
              <DropdownMenuItem>Экспорт в XLSX</DropdownMenuItem>
              <DropdownMenuItem>Экспорт в JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAlertsOpen(true)}
          >
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Настроить алерты</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="actions">
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-12 w-full justify-start overflow-x-auto">
          <TabsTrigger
            value="actions"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent px-4"
          >
            Действия пользователей
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent px-4"
          >
            Системные логи
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent px-4"
          >
            Логи интеграций
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent px-4"
          >
            Алерты безопасности
          </TabsTrigger>
        </TabsList>

        <TabsContent value="actions" className="mt-4">
          <UserActionsTab />
        </TabsContent>
        <TabsContent value="system" className="mt-4">
          <SystemLogsTab />
        </TabsContent>
        <TabsContent value="integrations" className="mt-4">
          <IntegrationLogsTab />
        </TabsContent>
        <TabsContent value="security" className="mt-4">
          <SecurityAlertsTab />
        </TabsContent>
      </Tabs>

      {/* Alerts Config Dialog */}
      <AlertsConfigDialog open={alertsOpen} onOpenChange={setAlertsOpen} />
    </div>
  );
}
