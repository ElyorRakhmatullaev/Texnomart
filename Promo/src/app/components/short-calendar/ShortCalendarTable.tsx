"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { Card } from "@texnomart/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@texnomart/ui/tooltip";
import { RuDate } from "../../../components/RuDate";
import { OverdueTag } from "../../../components/OverdueTag";
import { PromoStatusBadge } from "../../../components/PromoStatusBadge";
import { ReadinessCell } from "./ReadinessCell";
import {
  CATEGORY_MANAGERS,
  formatPromoNo,
  getFillDeadline,
  getOverdueDays,
  getReportSendStatus,
  type CategoryDistributionEntry,
  type CategoryManager,
  type KmStatus,
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
// Compact density (client feedback §11): the collapsed «Статус готовности акции» cell
// (summary + bar + markers ≈ 52px) is the floor, so the base row is tightened from 104.
const HEADER_H = "h-10";
const BASE_ROW_H = 80; // px — fits the collapsed «Статус готовности акции» cell
const READINESS_EXPANDED_H = 148; // px — a row whose readiness block is expanded (labels under each segment)
const SUBROW_H = 32; // px per distribution sub-row (expanded)

const CELL = "border-r border-gray-100 dark:border-border";

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

/**
 * Row-level «Распределение по категориям» filter (tracker V1-1): the page's
 * `filtered` memo only narrows which CAMPAIGNS render, so the expanded block's
 * sub-rows must be filtered separately with this predicate, or non-matching
 * days/categories/КМ leak into a campaign that otherwise matches.
 */
function matchesDistFilter(
  e: CategoryDistributionEntry,
  f?: { weekday: string; category: string; km: string }
): boolean {
  if (!f) return true;
  if (f.weekday !== "all" && String(e.date.getDay()) !== f.weekday) return false;
  if (f.category !== "all" && e.category !== f.category) return false;
  if (f.km !== "all" && e.responsibleKmId !== f.km) return false;
  return true;
}

interface ShortCalendarTableProps {
  campaigns: PromoCampaign[];
  onRowClick: (id: string) => void;
  /** «Распределение по категориям» expanded → the 3 distribution columns are shown (§2). */
  expanded: boolean;
  /**
   * Selected «Статус КМ по акции» filter (§5). When set (≠ "all"), only КМ cells
   * with this exact status are shown; the rest render «—».
   */
  kmStatusFilter?: string;
  /** Click on a КМ-status cell → deep-link to /approvals or /full-calendar (§10). */
  onKmStatusClick?: (campaignId: string, kmId: string, status: KmStatus) => void;
  /** Active «Распределение по категориям» filter (§V1-1) — restricts which
   *  sub-rows render inside the expanded block. "all" = no restriction. */
  distFilter?: { weekday: string; category: string; km: string };
}

export function ShortCalendarTable({
  campaigns,
  onRowClick,
  expanded,
  kmStatusFilter,
  onKmStatusClick,
  distFilter,
}: ShortCalendarTableProps) {
  const kmFilterActive = !!kmStatusFilter && kmStatusFilter !== "all";
  const kmColumns: CategoryManager[] = CATEGORY_MANAGERS;

  // Per-cell «Статус готовности акции» expand state (§3) — collapsed by default.
  const [expandedReadiness, setExpandedReadiness] = React.useState<Set<string>>(
    () => new Set()
  );
  const toggleReadiness = React.useCallback((id: string) => {
    setExpandedReadiness((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Compute each row's height ONCE and apply it to both panes (alignment invariant):
  // the tallest of the base, the expanded distribution block, and an expanded readiness block.
  const rowHeights = campaigns.map((c) => {
    const entries = (c.categoryDistribution ?? []).filter((e) =>
      matchesDistFilter(e, distFilter)
    );
    const n = entries.length;
    const distH = expanded && n > 0 ? n * SUBROW_H : 0;
    const readinessH = expandedReadiness.has(c.id) ? READINESS_EXPANDED_H : 0;
    return Math.max(BASE_ROW_H, distH, readinessH);
  });

  // The header is sticky to the PAGE scroll (§3.2/§13) so vertical scrolling stays on
  // the main page. Three horizontal scrollers are kept in sync (client feedback §1): a
  // STICKY TOP scrollbar, the header band, and the body's bottom scrollbar — scrolling
  // any one moves the others. `syncing` guards against the scroll-event feedback loop.
  const headRef = React.useRef<HTMLDivElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const frozenHeadRef = React.useRef<HTMLDivElement>(null);

  // Width of the frozen identity pane (top-scrollbar spacer) and of the scrollable
  // content (top-scrollbar track) — measured so the top scrollbar lines up exactly with
  // the bottom one and its thumb has the same proportions.
  const [frozenW, setFrozenW] = React.useState(0);
  const [scrollW, setScrollW] = React.useState(0);

  React.useLayoutEffect(() => {
    function measure() {
      if (frozenHeadRef.current) setFrozenW(frozenHeadRef.current.offsetWidth);
      if (bodyRef.current) setScrollW(bodyRef.current.scrollWidth);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (bodyRef.current) ro.observe(bodyRef.current);
    if (frozenHeadRef.current) ro.observe(frozenHeadRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [campaigns, expanded, expandedReadiness, distFilter]);

  // Mirror one scroller's scrollLeft onto the other two. Writes are idempotent (only
  // when the value actually differs), so the resulting scroll events self-terminate —
  // no re-entrancy flag needed, and no dropped frames during fast scrolling.
  const syncScroll = React.useCallback((from: "top" | "body") => {
    const src = from === "top" ? topScrollRef.current : bodyRef.current;
    const x = src?.scrollLeft ?? 0;
    if (headRef.current && headRef.current.scrollLeft !== x)
      headRef.current.scrollLeft = x;
    if (
      from !== "top" &&
      topScrollRef.current &&
      topScrollRef.current.scrollLeft !== x
    )
      topScrollRef.current.scrollLeft = x;
    if (from !== "body" && bodyRef.current && bodyRef.current.scrollLeft !== x)
      bodyRef.current.scrollLeft = x;
  }, []);

  return (
    // `overflow-clip` clips to the rounded corners like `overflow-hidden` BUT is not a
    // scroll container, so it does NOT trap the page-sticky header below.
    <Card className="overflow-clip p-0">
      {/* ── STICKY TOP band — pinned to the page scroll (§13). `-top-4` cancels
            <main>'s p-4 (16px) so it sits flush at the content top. It stacks a synced
            top horizontal scrollbar (§1) over the column-title row. ───────────────── */}
      <div className="sticky -top-4 z-30 border-b bg-gray-50 dark:bg-muted/40">
        {/* Top horizontal scrollbar — synced with the body's bottom scrollbar (§1).
            A spacer the width of the frozen pane keeps it aligned with the scroll area;
            the inner track width = the scroll content width so the thumb matches. */}
        <div className="flex">
          <div className="shrink-0" style={{ width: frozenW }} />
          <div
            ref={topScrollRef}
            onScroll={() => syncScroll("top")}
            className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
          >
            <div style={{ width: scrollW, height: 1 }} />
          </div>
        </div>

        {/* Column-title row */}
        <div className="flex">
          <div
            ref={frozenHeadRef}
            className={cn(
              "flex shrink-0 items-center gap-2.5 border-r px-3 text-[13px] font-semibold text-gray-700 dark:text-gray-200",
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
                "flex min-w-max items-center text-[13px] font-semibold text-gray-700 dark:text-gray-200",
                HEADER_H
              )}
            >
            <span className={cn("w-[170px] px-3", CELL)}>Период акции</span>
            <span className={cn("w-[160px] px-3", CELL)}>
              Крайний срок заполнения КМ
            </span>
            <span className={cn("w-[140px] px-3", CELL)}>Срок отчёта</span>
            {expanded && (
              <>
                <span className={cn("w-[150px] px-3", CELL)}>День / дата</span>
                <span className={cn("w-[190px] px-3", CELL)}>Категория</span>
                <span className={cn("w-[180px] px-3", CELL)}>
                  Ответственный КМ
                </span>
              </>
            )}
            <span className={cn("w-[340px] px-3", CELL)}>
              Статус готовности акции
            </span>
            <span className={cn("w-[180px] px-3", CELL)}>
              Отправка смежным отделам
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
      </div>

      {/* ── BODY band — natural height; the MAIN PAGE handles vertical scroll ────── */}
      <div className="flex">
        {/* Frozen identity pane */}
        <div className="shrink-0 border-r bg-white dark:bg-card">
          {campaigns.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onRowClick(c.id)}
              style={{ height: rowHeights[i] }}
              className={cn(
                "flex w-full items-center gap-2.5 border-b px-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-accent",
                c.cancelled && "bg-red-50/60 hover:bg-red-50 dark:bg-red-500/15 dark:hover:bg-red-500/20"
              )}
            >
              <span className="w-[104px] text-xs font-medium tabular-nums text-muted-foreground">
                {formatPromoNo(c.id)}
              </span>
              <span className="w-[120px] truncate text-sm text-gray-700 dark:text-gray-200">
                {c.type}
              </span>
              <span
                className={cn(
                  "w-[200px] truncate text-sm font-semibold text-gray-900 dark:text-gray-100",
                  c.cancelled && "text-red-700 line-through dark:text-red-300"
                )}
              >
                {c.name}
              </span>
            </button>
          ))}
        </div>

        {/* Scrolling pane — the BOTTOM scrollbar; drives the header + top scrollbar (§1). */}
        <div
          ref={bodyRef}
          onScroll={() => syncScroll("body")}
          className="min-w-0 flex-1 overflow-x-auto"
        >
          <div className="min-w-max">
            {campaigns.map((c, i) => {
              const deadline = getFillDeadline(c);
              const overdue = getOverdueDays(deadline);
              const report = getReportSendStatus(c);
              const entries = (c.categoryDistribution ?? []).filter((e) =>
                matchesDistFilter(e, distFilter)
              );
              const groups = groupDistribution(entries);
              const hasDist = groups.length > 0;

              return (
                // A `<div role="button">` (not a real <button>) so the readiness
                // collapse toggle inside the cell isn't a nested button (§3).
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onRowClick(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(c.id);
                    }
                  }}
                  style={{ height: rowHeights[i] }}
                  className={cn(
                    "flex w-full cursor-pointer items-stretch overflow-hidden border-b text-left transition-colors hover:bg-gray-50 dark:hover:bg-accent",
                    c.cancelled && "bg-red-50/60 hover:bg-red-50 dark:bg-red-500/15 dark:hover:bg-red-500/20"
                  )}
                >
                  {/* Период + day-of-week strip */}
                  <div
                    className={cn(
                      "flex w-[170px] flex-col justify-center px-3",
                      CELL
                    )}
                  >
                    <div className="text-sm tabular-nums text-gray-900 dark:text-gray-100">
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
                    <span className="text-sm tabular-nums text-gray-900 dark:text-gray-100">
                      <RuDate value={deadline} />
                    </span>
                    <OverdueTag days={overdue} />
                  </div>

                  {/* Срок отчёта (№4) — крайняя дата отправки отчёта смежным отделам
                      (старт − 17 кал. дн.). Только дата: просрочка живёт в колонке
                      «Отправка смежным отделам» и только по факту отправки. */}
                  <div
                    className={cn(
                      "flex w-[140px] flex-col justify-center gap-1 px-3",
                      CELL
                    )}
                  >
                    <span className="text-sm tabular-nums text-gray-900 dark:text-gray-100">
                      <RuDate value={report.deadline} />
                    </span>
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
                                    "border-b border-gray-100 dark:border-border"
                                )}
                              >
                                <div
                                  style={{ height: SUBROW_H }}
                                  className="flex flex-col justify-center"
                                >
                                  <span className="text-xs font-medium text-gray-800 dark:text-gray-100">
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
                                  className="flex items-center border-b border-gray-100 text-xs text-gray-800 last:border-b-0 dark:border-border dark:text-gray-100"
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
                                  className="flex items-center border-b border-gray-100 text-xs text-gray-700 last:border-b-0 dark:border-border dark:text-gray-200"
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

                  {/* Статус готовности акции (§2 + §3) */}
                  <div className={cn("flex w-[340px] items-center px-3", CELL)}>
                    <ReadinessCell
                      campaign={c}
                      expanded={expandedReadiness.has(c.id)}
                      onToggle={() => toggleReadiness(c.id)}
                    />
                  </div>

                  {/* Отправка смежным отделам (№4) — только фактический статус:
                      «Не отправлено», либо «Отправлено» + дата/версия. Просрочку «+N дн.»
                      показываем ТОЛЬКО если отчёт фактически отправлен позже срока. */}
                  <div
                    className={cn(
                      "flex w-[180px] flex-col justify-center gap-1 px-3",
                      CELL
                    )}
                  >
                    {report.sent ? (
                      <>
                        <span className="flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="size-3.5 shrink-0" />
                          Отправлено
                        </span>
                        <span className="flex flex-wrap items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                          <RuDate value={report.sentAt!} /> · в.{report.versionNo}
                          <OverdueTag days={report.overdueDays} />
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Не отправлено
                      </span>
                    )}
                  </div>

                  {/* Статусы по КМ (union; §2 order — last). §5: when the «Статус КМ
                      по акции» filter is active, only cells with that status are shown. */}
                  {kmColumns.map((km) => {
                    const status = c.kmStatuses[km.id];
                    const shown =
                      status && (!kmFilterActive || status === kmStatusFilter)
                        ? status
                        : undefined;
                    return (
                      <div
                        key={km.id}
                        className={cn("flex w-[150px] items-center px-3", CELL)}
                      >
                        {shown ? (
                          onKmStatusClick ? (
                            // Clickable status (§10) — opens the relevant screen for
                            // this (promo, КМ). stopPropagation so the row's detail
                            // navigation doesn't also fire.
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onKmStatusClick(c.id, km.id, shown);
                              }}
                              title="Открыть статус по этой акции и КМ"
                              className="rounded-full transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                            >
                              <PromoStatusBadge status={shown} />
                            </button>
                          ) : (
                            <PromoStatusBadge status={shown} />
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
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
