"use client";

import { cn } from "@texnomart/ui/utils";
import { PromoStatusBadge } from "../../../components/PromoStatusBadge";
import {
  campaignReadiness,
  type CampaignReadiness,
  type PromoCampaign,
} from "../../../lib/promo-mock-data";

/**
 * Merged «Общий статус / готовность акции» cell (client feedback §6 + §7): replaces
 * the two former columns «Готовность (индикаторы)» + «Статус акции». Shows the
 * campaign's overall status, the «X из Y КМ согласовано» summary (the denominator
 * excludes «Не участвует», §6), a segmented progress bar, and the per-status counts.
 */

const SEGMENTS: Array<{
  key: keyof Pick<
    CampaignReadiness,
    "accepted" | "atKd" | "notFilled" | "notParticipating"
  >;
  label: string;
  /** Bar fill (exact hex per design-rule «colors via style, never arbitrary classes»). */
  bar: string;
  dot: string;
}> = [
  { key: "accepted", label: "Согласовано", bar: "#10B981", dot: "bg-emerald-500" },
  { key: "atKd", label: "На согласовании", bar: "#F59E0B", dot: "bg-amber-500" },
  {
    key: "notFilled",
    label: "На корр./Не заполнено",
    bar: "#EF4444",
    dot: "bg-red-500",
  },
  {
    key: "notParticipating",
    label: "Не участвует",
    bar: "#9CA3AF",
    dot: "bg-gray-400",
  },
];

interface ReadinessCellProps {
  campaign: PromoCampaign;
  className?: string;
}

export function ReadinessCell({ campaign, className }: ReadinessCellProps) {
  const r = campaignReadiness(campaign);
  // Bar denominator includes «Не участвует» (the gray tail in the client's example).
  const barTotal = r.accepted + r.atKd + r.notFilled + r.notParticipating;

  return (
    <div className={cn("flex w-full flex-col gap-1", className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <PromoStatusBadge status={campaign.status} />
        <span className="text-xs font-medium tabular-nums text-gray-700">
          {r.total > 0 ? (
            <>
              {r.done} из {r.total} КМ согласовано
            </>
          ) : (
            "Нет участников"
          )}
        </span>
      </div>

      {/* Segmented progress bar */}
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        {barTotal > 0 &&
          SEGMENTS.map((s) =>
            r[s.key] > 0 ? (
              <div
                key={s.key}
                style={{
                  backgroundColor: s.bar,
                  width: `${(r[s.key] / barTotal) * 100}%`,
                }}
                title={`${s.label}: ${r[s.key]}`}
              />
            ) : null
          )}
      </div>

      {/* Per-status counts */}
      <div className="flex flex-wrap gap-x-2.5 gap-y-0 text-[10px] leading-tight text-muted-foreground">
        {SEGMENTS.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1">
            <span className={cn("size-1.5 shrink-0 rounded-full", s.dot)} />
            {s.label}:{" "}
            <span className="font-semibold tabular-nums text-gray-700">
              {r[s.key]}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
