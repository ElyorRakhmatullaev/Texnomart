"use client";

import { Card, CardContent } from "@texnomart/ui/card";
import { cn } from "@texnomart/ui/utils";
import { CAMPAIGNS, getCategoryManager } from "../../lib/promo-mock-data";
import { PromoStatusBadge } from "../../components/PromoStatusBadge";
import { RuDate } from "../../components/RuDate";

/**
 * Lightweight preview of the seeded campaigns for the bootstrap — proves the
 * mock data and Promo primitives are wired. The real Pattern-F grid arrives in S1.
 */
export function ShortCalendarPreview() {
  // Only planned campaigns appear in the short calendar (spec §4.1).
  const campaigns = CAMPAIGNS.filter((c) => c.planned);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {campaigns.map((c) => {
            const km = c.participatingKmIds
              .map((id) => getCategoryManager(id)?.name)
              .filter(Boolean)
              .join(", ");
            return (
              <div
                key={c.id}
                className={cn(
                  "flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between",
                  c.cancelled && "bg-red-50/60"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {c.id}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {c.type}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-1 font-semibold text-gray-900",
                      c.cancelled && "line-through text-red-700"
                    )}
                  >
                    {c.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    <RuDate value={c.startDate} /> — <RuDate value={c.endDate} />
                    {km && <span> · КМ: {km}</span>}
                  </p>
                </div>
                <div className="shrink-0">
                  <PromoStatusBadge status={c.status} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
