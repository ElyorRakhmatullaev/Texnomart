"use client";

import { cn } from "@texnomart/ui/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@texnomart/ui/tooltip";
import type { KmAggregate } from "../../../lib/promo-mock-data";

/** The four aggregated indicators (spec §4.6), each a soft-tint count chip. */
const CHIPS: Array<{
  key: keyof KmAggregate;
  short: string;
  full: string;
  bg: string;
  text: string;
}> = [
  {
    key: "atKd",
    short: "На согл. с КД",
    full: "На согласовании с коммерческим директором",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  {
    key: "acceptedKd",
    short: "Принято КД",
    full: "Принято коммерческим директором",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  {
    key: "notFilled",
    short: "Не заполнено",
    full: "Не заполнено / Ожидание корректировки от КМ",
    bg: "bg-red-50",
    text: "text-red-700",
  },
  {
    key: "notParticipating",
    short: "Не участвует",
    full: "Не участвует",
    bg: "bg-gray-100",
    text: "text-gray-600",
  },
];

interface AggregatedIndicatorsProps {
  aggregate: KmAggregate;
  /** Hide chips whose count is 0 (table rows). When false, all four always show. */
  hideZero?: boolean;
  className?: string;
}

export function AggregatedIndicators({
  aggregate,
  hideZero = true,
  className,
}: AggregatedIndicatorsProps) {
  const chips = CHIPS.filter((c) => !hideZero || aggregate[c.key] > 0);

  if (chips.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {chips.map((c) => (
        <Tooltip key={c.key}>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                c.bg,
                c.text
              )}
            >
              {c.short}
              <span className="font-semibold">{aggregate[c.key]}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>{c.full}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
