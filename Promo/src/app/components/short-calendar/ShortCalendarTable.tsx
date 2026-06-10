"use client";

import { cn } from "@texnomart/ui/utils";
import { Card } from "@texnomart/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@texnomart/ui/tooltip";
import { Lock } from "lucide-react";
import { RuDate } from "../../../components/RuDate";
import { OverdueTag } from "../../../components/OverdueTag";
import { PromoStatusBadge } from "../../../components/PromoStatusBadge";
import { AggregatedIndicators } from "./AggregatedIndicators";
import {
  CATEGORY_MANAGERS,
  aggregateKmStatuses,
  getFillDeadline,
  getOverdueDays,
  type CategoryManager,
  type PromoCampaign,
} from "../../../lib/promo-mock-data";

// Fixed heights keep the frozen pane and the scrolling pane aligned row-for-row
// (Pattern F: two synced divs, never position:sticky on a cell). The row height is
// FIXED (not min-h) — the two panes are independent, so a taller scrolling row would
// otherwise desync from its frozen counterpart; variable cells clamp to fit instead.
const HEADER_H = "h-12";
const ROW_H = "h-[72px]";

/** Capitalised short weekday, e.g. "Пн". */
function weekdayShort(date: Date): string {
  const w = new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(date);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function dayCount(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function lastName(name: string): string {
  return name.split(" ")[0];
}

interface ShortCalendarTableProps {
  campaigns: PromoCampaign[];
  onRowClick: (id: string) => void;
}

export function ShortCalendarTable({
  campaigns,
  onRowClick,
}: ShortCalendarTableProps) {
  // Per-KM status columns = the union of all КМ (sparse grid; «—» where absent).
  const kmColumns: CategoryManager[] = CATEGORY_MANAGERS;

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex">
        {/* ── Frozen identity pane ────────────────────────────────────── */}
        <div className="shrink-0 border-r bg-white">
          <div
            className={cn(
              "flex items-center gap-3 border-b bg-gray-50 px-4 text-xs font-medium text-gray-600",
              HEADER_H
            )}
          >
            <span className="w-[104px]">№ промо</span>
            <span className="w-[120px]">Тип промо</span>
            <span className="w-[200px]">Название акции</span>
          </div>
          {campaigns.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onRowClick(c.id)}
              className={cn(
                "flex w-full items-center gap-3 border-b px-4 text-left transition-colors hover:bg-gray-50",
                ROW_H,
                c.cancelled && "bg-red-50/60 hover:bg-red-50"
              )}
            >
              <span className="w-[104px] text-xs font-medium tabular-nums text-muted-foreground">
                {c.id}
              </span>
              <span className="w-[120px] truncate text-sm text-gray-700">
                {c.type}
              </span>
              <span
                className={cn(
                  "w-[200px] truncate text-sm font-semibold text-gray-900",
                  c.cancelled && "text-red-700 line-through"
                )}
              >
                {c.name}
              </span>
            </button>
          ))}
        </div>

        {/* ── Scrolling pane ──────────────────────────────────────────── */}
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="min-w-max">
            {/* header */}
            <div
              className={cn(
                "flex items-center border-b bg-gray-50 text-xs font-medium text-gray-600",
                HEADER_H
              )}
            >
              <span className="w-[180px] px-3">Период акции</span>
              <span className="w-[200px] px-3">Распределение по категориям</span>
              <span className="w-[200px] px-3">ФИО КМ</span>
              <span className="w-[170px] px-3">Крайний срок заполнения КМ</span>
              {kmColumns.map((km) => (
                <Tooltip key={km.id}>
                  <TooltipTrigger asChild>
                    <span className="w-[150px] truncate px-3">
                      {lastName(km.name)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {km.name} · {km.category}
                    {km.senior ? " · Старший КМ" : ""}
                  </TooltipContent>
                </Tooltip>
              ))}
              <span className="w-[260px] px-3">Готовность (индикаторы)</span>
              <span className="w-[200px] px-3">Статус акции</span>
            </div>

            {/* rows */}
            {campaigns.map((c) => {
              const deadline = getFillDeadline(c);
              const overdue = getOverdueDays(deadline);
              const agg = aggregateKmStatuses(c);
              const categories = c.participatingKmIds
                .map((id) => CATEGORY_MANAGERS.find((k) => k.id === id)?.category)
                .filter(Boolean) as string[];
              const kmNames = c.participatingKmIds
                .map((id) => CATEGORY_MANAGERS.find((k) => k.id === id)?.name)
                .filter(Boolean) as string[];

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onRowClick(c.id)}
                  className={cn(
                    "flex w-full items-center overflow-hidden border-b text-left transition-colors hover:bg-gray-50",
                    ROW_H,
                    c.cancelled && "bg-red-50/60 hover:bg-red-50"
                  )}
                >
                  {/* Период + day-of-week strip */}
                  <div className="w-[180px] px-3">
                    <div className="text-sm tabular-nums text-gray-900">
                      <RuDate value={c.startDate} /> — <RuDate value={c.endDate} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {weekdayShort(c.startDate)}–{weekdayShort(c.endDate)} ·{" "}
                      {dayCount(c.startDate, c.endDate)} дн.
                    </div>
                  </div>

                  {/* Распределение по категориям — cap at 2 chips + «+N» so the cell
                      never grows past the fixed row height (keeps panes aligned). */}
                  <div
                    className="flex w-[200px] flex-wrap content-center gap-1 px-3"
                    title={categories.join(", ")}
                  >
                    {categories.slice(0, 2).map((cat) => (
                      <span
                        key={cat}
                        className="max-w-full truncate rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {cat}
                      </span>
                    ))}
                    {categories.length > 2 && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        +{categories.length - 2}
                      </span>
                    )}
                  </div>

                  {/* ФИО КМ — clamp to 2 lines so long participant lists fit the row. */}
                  <div className="line-clamp-2 w-[200px] px-3 text-xs text-gray-700">
                    {kmNames.join(", ")}
                  </div>

                  {/* Крайний срок заполнения КМ */}
                  <div className="flex w-[170px] flex-wrap items-center gap-1.5 px-3">
                    <span className="text-sm tabular-nums text-gray-900">
                      <RuDate value={deadline} />
                    </span>
                    <OverdueTag days={overdue} />
                  </div>

                  {/* Per-KM status columns (union) */}
                  {kmColumns.map((km) => {
                    const status = c.kmStatuses[km.id];
                    return (
                      <div key={km.id} className="w-[150px] px-3">
                        {status ? (
                          <PromoStatusBadge status={status} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    );
                  })}

                  {/* Aggregated indicators */}
                  <div className="w-[260px] px-3">
                    <AggregatedIndicators aggregate={agg} />
                  </div>

                  {/* Campaign status (read-only, auto-computed) */}
                  <div className="flex w-[200px] items-center gap-1.5 px-3">
                    <PromoStatusBadge status={c.status} />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Lock className="size-3 shrink-0 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Статус вычисляется автоматически и доступен только для чтения
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
