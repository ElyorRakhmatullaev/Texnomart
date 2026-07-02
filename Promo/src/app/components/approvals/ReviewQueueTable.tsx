"use client";

import * as React from "react";
import { ChevronRight, Clock, UserMinus, Zap } from "lucide-react";
import { Card } from "@texnomart/ui/card";
import { cn } from "@texnomart/ui/utils";
import { MobileListCard } from "@texnomart/shared/components/mobile-list-card";
import { PromoStatusBadge } from "../../../components/PromoStatusBadge";
import { OverdueTag } from "../../../components/OverdueTag";
import { RuDate } from "../../../components/RuDate";
import {
  displayKmStatus,
  getCampaignById,
  getCategoryManager,
  isAutoEscalated,
  itemSla,
  type ReviewItem,
} from "../../../lib/promo-mock-data";

// Unified table styling (4th-round feedback §6): the same requirements applied to the
// short/full calendars — a header pinned to the PAGE scroll, a synced TOP + bottom
// horizontal scrollbar, and unified row/column dividers. A horizontal overflow
// container traps `position:sticky`, so (per the calendar precedent) the header lives
// in its own non-scrolling band over a horizontally-scrolling body, and three
// scrollers (top scrollbar · header · body) are kept in sync. Unlike the calendars
// there are NO frozen columns here, so rows flow at natural height (single pane) — no
// dual-pane height sync needed.

const HEADER_H = "h-10";
/** Divider between columns — matches the calendars' unified line treatment (§6/§9). */
const CELL = "border-r border-gray-100 dark:border-border";

/** Column widths — one source of truth so the header band and body rows stay aligned. */
const COLS = {
  no: "w-[130px]",
  type: "w-[140px]",
  name: "w-[280px]",
  km: "w-[170px]",
  sent: "w-[160px]",
  status: "w-[240px]",
  sla: "w-[230px]",
  chevron: "w-[44px]",
};

/** Small inline tags shown next to an item — non-participation kind + auto-escalation. */
function ItemTags({ item }: { item: ReviewItem }) {
  return (
    <>
      {item.kind === "non-participation" && (
        <span className="inline-flex items-center gap-0.5 rounded bg-gray-100 dark:bg-muted px-1.5 py-0.5 text-[11px] font-medium text-gray-700 dark:text-gray-200">
          <UserMinus className="size-3" />
          Не участвует
        </span>
      )}
      {isAutoEscalated(item) && (
        <span
          className="inline-flex items-center gap-0.5 rounded bg-amber-100 dark:bg-amber-500/20 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300"
          title="Авто-передано: просрочка у старшего КМ (§8)"
        >
          <Zap className="size-3" />
          Авто-передано
        </span>
      )}
    </>
  );
}

/**
 * SLA timer cell (§7/§9) — working days left for the item's CURRENT stage, with the
 * deadline date in parentheses; an overdue tag once breached. КД-stage items count
 * from the auto-forward / forward moment, not the original submit.
 */
function SlaTimer({ item }: { item: ReviewItem }) {
  const sla = itemSla(item);
  if (sla.overdue > 0) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <OverdueTag days={sla.overdue} />
        <span className="text-xs text-muted-foreground">просрочено</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap text-sm tabular-nums",
        sla.remaining <= 0 ? "text-red-700 dark:text-red-300" : "text-gray-700 dark:text-gray-200"
      )}
      title="Рабочие дни (Пн–Пт) до истечения срока текущего этапа согласования"
    >
      <Clock className="size-3.5 text-muted-foreground" />
      {sla.remaining} раб. дн.{" "}
      <span className="text-muted-foreground">
        (до {sla.deadline.toLocaleDateString("ru-RU")})
      </span>
    </span>
  );
}

interface ReviewQueueTableProps {
  items: ReviewItem[];
  onOpen: (id: string) => void;
}

export function ReviewQueueTable({ items, onOpen }: ReviewQueueTableProps) {
  // Three synced horizontal scrollers (§6) — a sticky top scrollbar, the header band,
  // and the body's bottom scrollbar. `syncScroll` mirrors one onto the other two;
  // idempotent writes make the resulting scroll events self-terminate (no loop flag).
  const headRef = React.useRef<HTMLDivElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollW, setScrollW] = React.useState(0);

  React.useLayoutEffect(() => {
    function measure() {
      if (bodyRef.current) setScrollW(bodyRef.current.scrollWidth);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (bodyRef.current) ro.observe(bodyRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items]);

  const syncScroll = React.useCallback((from: "top" | "body") => {
    const src = from === "top" ? topScrollRef.current : bodyRef.current;
    const x = src?.scrollLeft ?? 0;
    if (headRef.current && headRef.current.scrollLeft !== x)
      headRef.current.scrollLeft = x;
    if (from !== "top" && topScrollRef.current && topScrollRef.current.scrollLeft !== x)
      topScrollRef.current.scrollLeft = x;
    if (from !== "body" && bodyRef.current && bodyRef.current.scrollLeft !== x)
      bodyRef.current.scrollLeft = x;
  }, []);

  if (items.length === 0) {
    return (
      <Card className="p-12 text-center text-sm text-muted-foreground">
        Нет элементов на согласование
      </Card>
    );
  }

  return (
    <>
      {/* Desktop — band layout with a page-sticky header + synced dual scrollbars (§6).
          `overflow-clip` rounds the corners like `overflow-hidden` but is NOT a scroll
          container, so it doesn't trap the sticky header below. */}
      <Card className="hidden overflow-clip p-0 md:block">
        {/* Sticky header band — pinned to the page scroll; `-top-4` cancels <main>'s p-4. */}
        <div className="sticky -top-4 z-30 border-b bg-gray-50 dark:bg-muted/40">
          {/* Synced TOP horizontal scrollbar (§6) — track width = the body scroll width. */}
          <div
            ref={topScrollRef}
            onScroll={() => syncScroll("top")}
            className="overflow-x-auto overflow-y-hidden"
          >
            <div style={{ width: scrollW, height: 1 }} />
          </div>
          {/* Column-title row (driven — mirrors the body scrollLeft). */}
          <div ref={headRef} className="overflow-hidden">
            <div
              className={cn(
                "flex min-w-max items-center text-[13px] font-semibold text-gray-700 dark:text-gray-200",
                HEADER_H
              )}
            >
              <span className={cn(COLS.no, "px-3", CELL)}>№ промо</span>
              <span className={cn(COLS.type, "px-3", CELL)}>Тип</span>
              <span className={cn(COLS.name, "px-3", CELL)}>Название</span>
              <span className={cn(COLS.km, "px-3", CELL)}>КМ</span>
              <span className={cn(COLS.sent, "px-3", CELL)}>Отправлено</span>
              <span className={cn(COLS.status, "px-3", CELL)}>Статус</span>
              <span className={cn(COLS.sla, "px-3", CELL)}>SLA</span>
              <span className={COLS.chevron} />
            </div>
          </div>
        </div>

        {/* Body — the MAIN PAGE handles vertical scroll; this band scrolls horizontally. */}
        <div
          ref={bodyRef}
          onScroll={() => syncScroll("body")}
          className="overflow-x-auto"
        >
          <div className="min-w-max">
            {items.map((it) => {
              const c = getCampaignById(it.campaignId);
              const km = getCategoryManager(it.kmId);
              return (
                <div
                  key={it.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(it.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpen(it.id);
                    }
                  }}
                  className="flex min-w-max cursor-pointer items-center border-b border-gray-100 text-sm hover:bg-gray-50 dark:border-border dark:hover:bg-muted/30"
                >
                  <span
                    className={cn(
                      COLS.no,
                      "px-3 py-2.5 font-medium tabular-nums text-gray-900 dark:text-gray-100",
                      CELL
                    )}
                  >
                    {it.campaignId}
                  </span>
                  <span className={cn(COLS.type, "px-3 py-2.5 text-gray-700 dark:text-gray-200", CELL)}>
                    {c?.type ?? "—"}
                  </span>
                  <span className={cn(COLS.name, "truncate px-3 py-2.5 text-gray-700 dark:text-gray-200", CELL)}>
                    {c?.name ?? "—"}
                  </span>
                  <span className={cn(COLS.km, "truncate px-3 py-2.5 text-gray-700 dark:text-gray-200", CELL)}>
                    {km?.name ?? it.kmId}
                  </span>
                  <span className={cn(COLS.sent, "whitespace-nowrap px-3 py-2.5 text-gray-700 dark:text-gray-200", CELL)}>
                    <RuDate value={new Date(it.submittedAt)} withTime />
                  </span>
                  <span className={cn(COLS.status, "px-3 py-2.5", CELL)}>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <PromoStatusBadge status={displayKmStatus(it)} />
                      <ItemTags item={it} />
                    </span>
                  </span>
                  <span className={cn(COLS.sla, "px-3 py-2.5", CELL)}>
                    <SlaTimer item={it} />
                  </span>
                  <span className={cn(COLS.chevron, "flex items-center justify-center py-2.5")}>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Mobile (Mode B) — card list */}
      <div className="space-y-3 md:hidden">
        {items.map((it) => {
          const c = getCampaignById(it.campaignId);
          const km = getCategoryManager(it.kmId);
          return (
            <MobileListCard
              key={it.id}
              onClick={() => onOpen(it.id)}
              title={c?.name ?? it.campaignId}
              subtitle={`${it.campaignId} · ${c?.type ?? ""}`}
              status={<PromoStatusBadge status={displayKmStatus(it)} />}
            >
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <ItemTags item={it} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                <span>КМ: {km?.name ?? it.kmId}</span>
                <span className="inline-flex items-center gap-1">
                  Отправлено: <RuDate value={new Date(it.submittedAt)} withTime />
                </span>
                <SlaTimer item={it} />
              </div>
            </MobileListCard>
          );
        })}
      </div>
    </>
  );
}
