"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@texnomart/ui/tooltip";
import {
  formatAvailabilityPct,
  getStoreAvailability,
} from "../../../lib/promo-mock-data";

/**
 * «Наличие в магазинах, %» (feedback §5) — read-only, «из 1С». Shows the coverage
 * percent (e.g. «94,87%») over the active-stores directory; the tooltip explains
 * the ratio (N из M магазинов, центральные склады не учитываются). Reused for the
 * main nomenclature AND gift nomenclature (§8), which share the same 1С logic.
 */
export function StoreAvailabilityCell({
  nomenclatureId,
}: {
  nomenclatureId: string | undefined;
}) {
  if (!nomenclatureId) {
    return <span className="text-muted-foreground">—</span>;
  }
  const a = getStoreAvailability(nomenclatureId);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="tabular-nums text-gray-900 dark:text-gray-100">
          {formatAvailabilityPct(a.pct)}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[240px]">
        Товар в наличии в {a.inStock.toLocaleString("ru-RU")} из{" "}
        {a.activeStores.toLocaleString("ru-RU")} активных магазинов. Расчёт из 1С;
        центральные склады не учитываются.
      </TooltipContent>
    </Tooltip>
  );
}
