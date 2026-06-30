"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@texnomart/ui/tooltip";
import {
  campaignReadiness,
  type CampaignReadiness,
  type PromoCampaign,
} from "../../../lib/promo-mock-data";

/**
 * «Статус готовности акции» cell (client feedback §2 + §3).
 *
 * §2 — the separate overall status badge above the bar is removed.
 * §3 — a collapsible block (collapsed by default):
 *   • summary row «N из M КМ согласовано» (M excludes «Не участвует»/«Отменена»);
 *   • a continuous 5-segment bar — green «Согласовано КД» · orange «На согл. у КД» ·
 *     yellow «На согл. у ст. КМ» · red «На корр. / Не заполнено» · gray «Не участвует»;
 *   • segment width grows with the КМ count (0 = min width; 1 wider than 0; 3 > 2 > 1;
 *     equal counts → equal widths) — modelled by `flex-grow: count` over a min-width floor;
 *   • collapsed: colored markers + counts (no names) with a tooltip per segment;
 *   • expanded: a labeled block (circle + name on top, count below) strictly within
 *     each segment's width.
 */

interface Segment {
  key: keyof Pick<
    CampaignReadiness,
    "accepted" | "atKd" | "atSeniorKm" | "notFilled" | "notParticipating"
  >;
  label: string;
  /** Bar fill (exact hex per design-rule «colors via style, never arbitrary classes»). */
  bar: string;
  dot: string;
}

// Order matches the client's example: green → orange → yellow → red → gray.
const SEGMENTS: Segment[] = [
  { key: "accepted", label: "Согласовано КД", bar: "#10B981", dot: "bg-emerald-500" },
  { key: "atKd", label: "На согл. у КД", bar: "#F97316", dot: "bg-orange-500" },
  { key: "atSeniorKm", label: "На согл. у ст. КМ", bar: "#FACC15", dot: "bg-yellow-400" },
  { key: "notFilled", label: "На корр. / Не заполнено", bar: "#EF4444", dot: "bg-red-500" },
  { key: "notParticipating", label: "Не участвует", bar: "#9CA3AF", dot: "bg-gray-400" },
];

// Min-width floor per segment (px). Collapsed only needs a dot + 1–2 digits; expanded
// must be wide enough for the longest label «На корр. / Не заполнено» (wraps to 2–3 lines).
const MIN_W_COLLAPSED = 30;
const MIN_W_EXPANDED = 58;

interface ReadinessCellProps {
  campaign: PromoCampaign;
  expanded: boolean;
  onToggle: () => void;
  className?: string;
}

export function ReadinessCell({
  campaign,
  expanded,
  onToggle,
  className,
}: ReadinessCellProps) {
  const r = campaignReadiness(campaign);
  // The bar denominator includes «Не участвует» (the gray tail in the client's example);
  // «Отменена» is excluded (a cancelled campaign is struck/hidden).
  const barTotal =
    r.accepted + r.atKd + r.atSeniorKm + r.notFilled + r.notParticipating;
  const minW = expanded ? MIN_W_EXPANDED : MIN_W_COLLAPSED;

  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {/* Summary row + collapse/expand toggle (§3) */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium tabular-nums text-gray-700 dark:text-gray-200">
          {r.total > 0 ? (
            <>
              {r.done} из {r.total} КМ согласовано
            </>
          ) : (
            "Нет участников"
          )}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={expanded ? "Свернуть блок" : "Развернуть блок"}
          aria-expanded={expanded}
          className="flex size-5 shrink-0 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 dark:border-border dark:bg-card dark:text-gray-400 dark:hover:bg-accent"
        >
          {expanded ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>
      </div>

      {/* Continuous 5-segment bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-muted">
        {barTotal > 0
          ? SEGMENTS.map((s) => (
              <Tooltip key={s.key}>
                <TooltipTrigger asChild>
                  <div
                    style={{
                      backgroundColor: s.bar,
                      flexGrow: r[s.key],
                      flexBasis: 0,
                      minWidth: minW,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {s.label}: {r[s.key]}
                </TooltipContent>
              </Tooltip>
            ))
          : null}
      </div>

      {/* Below the bar — collapsed: markers + counts (no names); expanded: labeled blocks.
          Both share the SAME flex weights + min-width as the bar, so each block sits
          strictly under its own segment and never bleeds into a neighbour. */}
      <div className="flex w-full">
        {SEGMENTS.map((s) =>
          expanded ? (
            <div
              key={s.key}
              style={{ flexGrow: r[s.key], flexBasis: 0, minWidth: minW }}
              className="flex flex-col items-center px-0.5 text-center"
            >
              <span className="flex items-center gap-1 leading-tight">
                <span className={cn("size-1.5 shrink-0 rounded-full", s.dot)} />
                <span className="text-[10px] leading-[1.1] text-gray-600 dark:text-gray-300">
                  {s.label}
                </span>
              </span>
              <span className="mt-0.5 text-[11px] font-semibold tabular-nums text-gray-800 dark:text-gray-100">
                {r[s.key]}
              </span>
            </div>
          ) : (
            <Tooltip key={s.key}>
              <TooltipTrigger asChild>
                <div
                  style={{ flexGrow: r[s.key], flexBasis: 0, minWidth: minW }}
                  className="flex items-center justify-center gap-1"
                >
                  <span className={cn("size-1.5 shrink-0 rounded-full", s.dot)} />
                  <span className="text-[11px] font-semibold tabular-nums text-gray-700 dark:text-gray-200">
                    {r[s.key]}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {s.label}: {r[s.key]}
              </TooltipContent>
            </Tooltip>
          )
        )}
      </div>
    </div>
  );
}
