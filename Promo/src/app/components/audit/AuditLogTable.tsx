"use client";

import * as React from "react";
import { ArrowRight, Download, FileSearch, SlidersHorizontal } from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
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
import { PromoStatusBadge } from "../../../components/PromoStatusBadge";
import { RuDate } from "../../../components/RuDate";
import { getLiveAuditEvents } from "../../../lib/audit-store";
import { exportAuditXlsx, fmtAuditDate } from "../../../lib/audit-xlsx";
import { exportStamp } from "../../../lib/promo-export";
import {
  AUDIT_ACTION_META,
  AUDIT_OBJECT_LABEL,
  buildAuditLog,
  formatPromoNo,
  getCategoryManager,
  type AuditEvent,
} from "../../../lib/promo-mock-data";
import {
  AuditLogFilters,
  EMPTY_AUDIT_FILTERS,
  hasActiveAuditFilters,
  type AuditFilters,
} from "./AuditLogFilters";
import type { AuditAccess } from "./AuditPage";

const LOG_EXPORT_HEADER = [
  "ID", "Дата и время", "Пользователь", "Роль", "Действие",
  "Тип объекта", "Объект", "№ промо", "Статус до", "Статус после", "Комментарий",
];

function logExportRows(events: AuditEvent[]): (string | number)[][] {
  return events.map((e) => [
    e.id,
    fmtAuditDate(e.at, true),
    e.user,
    e.role,
    e.action,
    AUDIT_OBJECT_LABEL[e.objectType],
    e.objectLabel,
    e.campaignId ? formatPromoNo(e.campaignId) : "",
    e.statusFrom ?? "",
    e.statusTo ?? "",
    e.comment ?? "",
  ]);
}

/** Non-key action types — hidden by default; shown only under «Все действия» (Администратор only). */
const NON_KEY_ACTIONS = new Set<AuditEvent["action"]>([
  "создание", "изменение", "смена пароля", "изменение профиля",
]);

function ActionTag({ action }: { action: AuditEvent["action"] }) {
  const meta = AUDIT_ACTION_META[action];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        meta.bg,
        meta.text
      )}
    >
      {action}
    </span>
  );
}

function StatusTransition({ event }: { event: AuditEvent }) {
  if (!event.statusFrom && !event.statusTo) {
    return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {event.statusFrom && (
        <PromoStatusBadge status={event.statusFrom} className="text-[11px]" />
      )}
      {event.statusFrom && event.statusTo && (
        <ArrowRight className="size-3 shrink-0 text-gray-400 dark:text-gray-500" />
      )}
      {event.statusTo && (
        <PromoStatusBadge status={event.statusTo} className="text-[11px]" />
      )}
    </div>
  );
}

function ObjectCell({ event }: { event: AuditEvent }) {
  return (
    <div className="min-w-0">
      <Badge
        variant="outline"
        className="mb-0.5 text-[10px] font-normal text-gray-500 dark:text-gray-400"
      >
        {AUDIT_OBJECT_LABEL[event.objectType]}
      </Badge>
      <p className="truncate text-sm text-gray-900 dark:text-gray-100" title={event.objectLabel}>
        {event.objectLabel}
      </p>
      {event.campaignId && (
        <p className="font-mono text-[11px] text-gray-400 dark:text-gray-500">{formatPromoNo(event.campaignId)}</p>
      )}
    </div>
  );
}

export function AuditLogTable({
  access,
}: { access?: AuditAccess } = {}) {
  const isAdmin = access?.isAdmin ?? false;
  const [showAll, setShowAll] = React.useState(false); // «Все действия» (Администратор only)

  // Сиды (S8) + живые события модуля учёток (localStorage), новые сверху.
  const events = React.useMemo(() => {
    const merged = [...getLiveAuditEvents(), ...buildAuditLog()];
    return merged.sort((a, b) => b.at.getTime() - a.at.getTime());
  }, []);
  const [filters, setFilters] = React.useState<AuditFilters>(EMPTY_AUDIT_FILTERS);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const isKm = access?.role === "Категорийный менеджер (КМ)";

  const scopedEvents = React.useMemo(() => {
    const myName = getCategoryManager(access?.ownKmId ?? "")?.name;
    return events.filter((e) => {
      // action scope
      if (!(isAdmin && showAll) && NON_KEY_ACTIONS.has(e.action)) return false;
      // role-scoped rows: only the КМ role is own-scoped — every other role sees all
      if (isKm) {
        if (e.role !== "Категорийный менеджер (КМ)") return false;
        if (myName && e.user !== myName) return false;
      }
      return true;
    });
  }, [events, isAdmin, showAll, isKm, access]);

  const users = React.useMemo(
    () => Array.from(new Set(scopedEvents.map((e) => e.user))).sort(),
    [scopedEvents]
  );
  const roles = React.useMemo(
    () => Array.from(new Set(scopedEvents.map((e) => e.role))).sort(),
    [scopedEvents]
  );

  const filtered = React.useMemo(() => {
    const fromTs = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : null;
    const toTs = filters.to ? new Date(`${filters.to}T23:59:59`).getTime() : null;
    return scopedEvents.filter((e) => {
      if (filters.user !== "all" && e.user !== filters.user) return false;
      if (filters.role !== "all" && e.role !== filters.role) return false;
      if (filters.action !== "all" && e.action !== filters.action) return false;
      if (filters.object !== "all" && e.objectType !== filters.object) return false;
      const ts = e.at.getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      return true;
    });
  }, [scopedEvents, filters]);

  const patch = (p: Partial<AuditFilters>) =>
    setFilters((prev) => ({ ...prev, ...p }));
  const clear = () => setFilters(EMPTY_AUDIT_FILTERS);

  const activeCount = hasActiveAuditFilters(filters);

  const handleExport = () => {
    exportAuditXlsx({
      sheetName: "Аудит-лог",
      header: LOG_EXPORT_HEADER,
      rows: logExportRows(filtered),
      filename: `Аудит-лог_${exportStamp()}.xlsx`,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {isAdmin && (
        <div className="flex items-center gap-2">
          <Button variant={showAll ? "outline" : "default"} size="sm" className="h-8" onClick={() => setShowAll(false)}>Ключевые действия</Button>
          <Button variant={showAll ? "default" : "outline"} size="sm" className="h-8" onClick={() => setShowAll(true)}>Все действия</Button>
          <span className="text-[11px] text-muted-foreground">черновики, редактирование и автосохранение — только в «Все действия»</span>
        </div>
      )}

      {/* Desktop filters — flush-left with the page title/table */}
      <div className="hidden md:block">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <AuditLogFilters
            values={filters}
            onChange={patch}
            onClear={clear}
            users={users}
            roles={roles}
          />
          <div className="ml-auto flex items-center gap-3 pb-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Записей: {filtered.length.toLocaleString("ru-RU")}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="h-9 gap-1.5"
              disabled={filtered.length === 0}
              onClick={handleExport}
            >
              <Download className="size-4" /> Экспорт
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile filter trigger */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => setTimeout(() => setSheetOpen(true), 0)}
        >
          <SlidersHorizontal className="size-4" />
          Фильтры
          {activeCount && (
            <span className="ml-0.5 size-2 rounded-full bg-primary" />
          )}
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Записей: {filtered.length.toLocaleString("ru-RU")}
          </span>
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9"
            disabled={filtered.length === 0}
            onClick={handleExport}
            aria-label="Экспорт"
          >
            <Download className="size-4" />
          </Button>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Фильтры аудита</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <AuditLogFilters
              values={filters}
              onChange={patch}
              onClear={clear}
              users={users}
              roles={roles}
              layout="stack"
            />
            <Button
              className="mt-5 w-full"
              onClick={() => setSheetOpen(false)}
            >
              Показать {filtered.length.toLocaleString("ru-RU")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {filtered.length === 0 ? (
        <EmptyState onClear={clear} hasFilters={!!activeCount} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:block">
            <div className="max-h-[calc(100vh-280px)] overflow-auto [scrollbar-gutter:stable]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-gray-50 dark:bg-muted/40">
                  <TableRow>
                    {/* 7-я часть §6.2 — short-value columns kept compact; the
                        min-w text columns take the remaining full-bleed width. */}
                    <TableHead className="w-[84px]">ID</TableHead>
                    <TableHead className="w-[140px]">Дата и время</TableHead>
                    <TableHead className="w-[170px]">Пользователь</TableHead>
                    <TableHead className="w-[150px]">Действие</TableHead>
                    <TableHead className="min-w-[200px]">Объект</TableHead>
                    <TableHead className="min-w-[220px]">Статус до → после</TableHead>
                    <TableHead className="min-w-[200px]">Комментарий</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id} className="align-top">
                      <TableCell className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {e.id}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm whitespace-nowrap text-gray-700 dark:text-gray-200">
                        <RuDate value={e.at} withTime />
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {e.user}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">{e.role}</p>
                      </TableCell>
                      <TableCell>
                        <ActionTag action={e.action} />
                      </TableCell>
                      <TableCell>
                        <ObjectCell event={e} />
                      </TableCell>
                      <TableCell>
                        <StatusTransition event={e} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                        {e.comment ?? (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile cards (Mode B) */}
          <div className="flex flex-col gap-2.5 md:hidden">
            {filtered.map((e) => (
              <div
                key={e.id}
                className="rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card p-3 shadow-[0px_2px_4px_rgba(204,204,204,0.25)]"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <ActionTag action={e.action} />
                  <span className="font-mono text-[11px] text-gray-400 dark:text-gray-500">
                    {e.id}
                  </span>
                </div>
                <ObjectCell event={e} />
                <div className="mt-2">
                  <StatusTransition event={e} />
                </div>
                {e.comment && (
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{e.comment}</p>
                )}
                <div className="mt-2 flex items-center justify-between border-t border-gray-100 dark:border-border pt-2 text-[11px] text-gray-500 dark:text-gray-400">
                  <span>
                    {e.user} · {e.role}
                  </span>
                  <span className="tabular-nums">
                    <RuDate value={e.at} withTime />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState({
  onClear,
  hasFilters,
}: {
  onClear: () => void;
  hasFilters: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-16 text-center">
      <FileSearch className="size-12 text-gray-300 dark:text-gray-600" />
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">Записей не найдено</p>
        <p className="text-sm text-muted-foreground">
          По выбранным фильтрам нет действий в журнале.
        </p>
      </div>
      {hasFilters && (
        <Button variant="secondary" size="sm" onClick={onClear}>
          Сбросить фильтры
        </Button>
      )}
    </div>
  );
}
