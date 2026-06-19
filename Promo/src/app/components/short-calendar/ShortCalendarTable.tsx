"use client";

import * as React from "react";
import { cn } from "@texnomart/ui/utils";
import { Card } from "@texnomart/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@texnomart/ui/tooltip";
import { RuDate } from "../../../components/RuDate";
import { OverdueTag } from "../../../components/OverdueTag";
import { PromoStatusBadge } from "../../../components/PromoStatusBadge";
import { ReadinessCell } from "./ReadinessCell";
import {
  CATEGORY_MANAGERS,
  getFillDeadline,
  getOverdueDays,
  type CategoryDistributionEntry,
  type CategoryManager,
  type PromoCampaign,
} from "../../../lib/promo-mock-data";

// Pattern F (two synced divs, never position:sticky on a cell). The base row height
// is FIXED; when «Распределение по категориям» is EXPANDED, a row with N distribution
// sub-rows grows to N·SUBROW_H — the SAME computed height is applied to BOTH panes, so
// the two independent panes never desync.
//
// Sticky header + synced horizontal scroll (client feedback §3.1, §3.2): a horizontal
// overflow container traps `position:sticky`, so instead of relying on sticky we split
// the table into a non-scrolling HEADER band over a vertically-scrolling BODY band, and
// keep three horizontal scrollers in sync (a top scrollbar + the header + the body).
const HEADER_H = "h-12";
const BASE_ROW_H = 104; // px — fits the merged status/readiness cell (status + «X из Y» + bar + counts)
const SUBROW_H = 34; // px per distribution sub-row (expanded)

const CELL = "border-r border-gray-100";

/** Capitalised short weekday, e.g. "Пн". */
function weekdayShort(date: Date): string {
  const w = new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(date);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

/** Capitalised full weekday, e.g. "Понедельник". */
function weekdayFull(date: Date): string {
  const w = new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(date);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function dayCount(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function lastName(name: string): string {
  return name.split(" ")[0];
}

/** Group distribution entries by day (one date label per group; §2 «не дублировать дату»). */
interface DistGroup {
  key: number;
  date: Date;
  items: CategoryDistributionEntry[];
}
function groupDistribution(entries: CategoryDistributionEntry[]): DistGroup[] {
  const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());
  const groups: DistGroup[] = [];
  for (const e of sorted) {
    const key = e.date.getTime();
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(e);
    else groups.push({ key, date: e.date, items: [e] });
  }
  return groups;
}

function kmName(id: string): string {
  return CATEGORY_MANAGERS.find((k) => k.id === id)?.name ?? id;
}

interface ShortCalendarTableProps {
  campaigns: PromoCampaign[];
  onRowClick: (id: string) => void;
  /** «Распределение по категориям» expanded → the 3 distribution columns are shown (§2). */
  expanded: boolean;
}

export function ShortCalendarTable({
  campaigns,
  onRowClick,
  expanded,
}: ShortCalendarTableProps) {
  const kmColumns: CategoryManager[] = CATEGORY_MANAGERS;

  // Compute each row's height ONCE and apply it to both panes (alignment invariant).
  const rowHeights = campaigns.map((c) => {
    const n = c.categoryDistribution?.length ?? 0;
    return expanded && n > 0 ? Math.max(BASE_ROW_H, n * SUBROW_H) : BASE_ROW_H;
  });

  // The header is sticky to the PAGE scroll (§3.2) so vertical scrolling stays on the
  // main page; its horizontal offset just mirrors the body's single BOTTOM scrollbar
  // (no separate top scrollbar). One bottom scrollbar drives the whole table.
  const headRef = React.useRef<HTMLDivElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  return (
    // `overflow-clip` clips to the rounded corners like `overflow-hidden` BUT is not a
    // scroll container, so it does NOT trap the page-sticky header below.
    <Card className="overflow-clip p-0">
      {/* ── HEADER band — sticky to the page scroll (§3.2); horizontal offset mirrors
            the body's bottom scrollbar (no separate top scrollbar, §3.1). `-top-4`
            cancels <main>'s p-4 (16px) so the pinned header sits flush at the content
            top with no padding gap above it. ──────────────────────────────────────── */}
      <div className="sticky -top-4 z-30 flex border-b bg-gray-50">
        <div
          className={cn(
            "flex shrink-0 items-center gap-3 border-r px-4 text-[13px] font-semibold text-gray-700",
            HEADER_H
          )}
        >
          <span className="w-[104px]">№ промо</span>
          <span className="w-[120px]">Тип промо</span>
          <span className="w-[200px]">Название акции</span>
        </div>
        <div ref={headRef} className="min-w-0 flex-1 overflow-hidden">
          <div
            className={cn(
              "flex min-w-max items-center text-[13px] font-semibold text-gray-700",
              HEADER_H
            )}
          >
            <span className={cn("w-[170px] px-3", CELL)}>Период акции</span>
            <span className={cn("w-[160px] px-3", CELL)}>
              Крайний срок заполнения КМ
            </span>
            {expanded && (
              <>
                <span className={cn("w-[150px] px-3", CELL)}>День / дата</span>
                <span className={cn("w-[190px] px-3", CELL)}>Категория</span>
                <span className={cn("w-[180px] px-3", CELL)}>
                  Ответственный КМ
                </span>
              </>
            )}
            <span className={cn("w-[300px] px-3", CELL)}>
              Общий статус / готовность акции
            </span>
            {kmColumns.map((km) => (
              <Tooltip key={km.id}>
                <TooltipTrigger asChild>
                  <span className={cn("w-[150px] truncate px-3", CELL)}>
                    {lastName(km.name)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {km.name} · {km.category}
                  {km.senior ? " · Старший КМ" : ""}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>

      {/* ── BODY band — natural height; the MAIN PAGE handles vertical scroll ────── */}
      <div className="flex">
        {/* Frozen identity pane */}
        <div className="shrink-0 border-r bg-white">
          {campaigns.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onRowClick(c.id)}
              style={{ height: rowHeights[i] }}
              className={cn(
                "flex w-full items-center gap-3 border-b px-4 text-left transition-colors hover:bg-gray-50",
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

        {/* Scrolling pane */}
        <div
          ref={bodyRef}
          onScroll={(e) => {
            if (headRef.current)
              headRef.current.scrollLeft = e.currentTarget.scrollLeft;
          }}
          className="min-w-0 flex-1 overflow-x-auto"
        >
          <div className="min-w-max">
            {campaigns.map((c, i) => {
              const deadline = getFillDeadline(c);
              const overdue = getOverdueDays(deadline);
              const groups = groupDistribution(c.categoryDistribution ?? []);
              const hasDist = groups.length > 0;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onRowClick(c.id)}
                  style={{ height: rowHeights[i] }}
                  className={cn(
                    "flex w-full items-stretch overflow-hidden border-b text-left transition-colors hover:bg-gray-50",
                    c.cancelled && "bg-red-50/60 hover:bg-red-50"
                  )}
                >
                  {/* Период + day-of-week strip */}
                  <div
                    className={cn(
                      "flex w-[170px] flex-col justify-center px-3",
                      CELL
                    )}
                  >
                    <div className="text-sm tabular-nums text-gray-900">
                      <RuDate value={c.startDate} /> — <RuDate value={c.endDate} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {weekdayShort(c.startDate)}–{weekdayShort(c.endDate)} ·{" "}
                      {dayCount(c.startDate, c.endDate)} дн.
                    </div>
                  </div>

                  {/* Крайний срок заполнения КМ */}
                  <div
                    className={cn(
                      "flex w-[160px] flex-col justify-center gap-1 px-3",
                      CELL
                    )}
                  >
                    <span className="text-sm tabular-nums text-gray-900">
                      <RuDate value={deadline} />
                    </span>
                    <OverdueTag days={overdue} />
                  </div>

                  {/* «Распределение по категориям» — collapsible structured block (§2).
                      Three columns; each centres a block of identical total height
                      (entries·SUBROW_H), so the sub-rows line up across the columns.
                      The day is shown once per group (not duplicated). */}
                  {expanded && (
                    <>
                      {/* День / дата */}
                      <div className={cn("w-[150px] px-3", CELL)}>
                        {hasDist ? (
                          <div className="flex h-full flex-col justify-center">
                            {groups.map((g, gi) => (
                              <div
                                key={g.key}
                                style={{ height: g.items.length * SUBROW_H }}
                                className={cn(
                                  gi < groups.length - 1 &&
                                    "border-b border-gray-100"
                                )}
                              >
                                <div
                                  style={{ height: SUBROW_H }}
                                  className="flex flex-col justify-center"
                                >
                                  <span className="text-xs font-medium text-gray-800">
                                    {weekdayFull(g.date)}
                                  </span>
                                  <span className="text-[11px] tabular-nums text-muted-foreground">
                                    <RuDate value={g.date} />
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Dash />
                        )}
                      </div>

                      {/* Категория */}
                      <div className={cn("w-[190px] px-3", CELL)}>
                        {hasDist ? (
                          <div className="flex h-full flex-col justify-center">
                            {groups.flatMap((g) =>
                              g.items.map((it, idx) => (
                                <div
                                  key={`${g.key}-cat-${idx}`}
                                  style={{ height: SUBROW_H }}
                                  className="flex items-center border-b border-gray-100 text-xs text-gray-800 last:border-b-0"
                                >
                                  <span className="truncate">{it.category}</span>
                                </div>
                              ))
                            )}
                          </div>
                        ) : (
                          <Dash />
                        )}
                      </div>

                      {/* Ответственный КМ */}
                      <div className={cn("w-[180px] px-3", CELL)}>
                        {hasDist ? (
                          <div className="flex h-full flex-col justify-center">
                            {groups.flatMap((g) =>
                              g.items.map((it, idx) => (
                                <div
                                  key={`${g.key}-km-${idx}`}
                                  style={{ height: SUBROW_H }}
                                  className="flex items-center border-b border-gray-100 text-xs text-gray-700 last:border-b-0"
                                >
                                  <span className="truncate">
                                    {kmName(it.responsibleKmId)}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        ) : (
                          <Dash />
                        )}
                      </div>
                    </>
                  )}

                  {/* Общий статус / готовность акции (merged §6 + §7) */}
                  <div className={cn("flex w-[300px] items-center px-3", CELL)}>
                    <ReadinessCell campaign={c} />
                  </div>

                  {/* Статусы по КМ (union; §2 order — last) */}
                  {kmColumns.map((km) => {
                    const status = c.kmStatuses[km.id];
                    return (
                      <div
                        key={km.id}
                        className={cn("flex w-[150px] items-center px-3", CELL)}
                      >
                        {status ? (
                          <PromoStatusBadge status={status} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    );
                  })}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Dash() {
  return (
    <div className="flex h-full items-center">
      <span className="text-xs text-muted-foreground">—</span>
    </div>
  );
}
