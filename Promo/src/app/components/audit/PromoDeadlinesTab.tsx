"use client";

import * as React from "react";
import { buildPromoControlPoints } from "../../../lib/audit-control";
import { getCategoryManager, OWN_AUDIT_KM_ID } from "../../../lib/promo-mock-data";
import type { AuditAccess, AuditGlobalFilters } from "./AuditPage";
import {
  ControlDeadlinesFilters, EMPTY_CONTROL_FILTERS, applyControlFilters, type ControlFilters,
} from "./ControlDeadlinesFilters";
import { ControlDeadlinesTable } from "./ControlDeadlinesTable";

export function PromoDeadlinesTab({
  access, globals,
}: { access: AuditAccess; globals: AuditGlobalFilters }) {
  const all = React.useMemo(() => buildPromoControlPoints(), []);
  const scoped = React.useMemo(() => {
    if (access.canSeeAll) return all;
    // Plain КМ → only rows where they are the responsible КМ (representative ownKmId).
    const myName = getCategoryManager(access.ownKmId)?.name;
    return all.filter((p) => p.responsibleName === myName);
  }, [all, access]);
  const [filters, setFilters] = React.useState<ControlFilters>(EMPTY_CONTROL_FILTERS);
  const shownPoints = React.useMemo(
    () => applyControlFilters(scoped, filters, globals),
    [scoped, filters, globals]
  );

  return (
    <div className="flex flex-col gap-3">
      <ControlDeadlinesFilters
        values={filters}
        onChange={(p) => setFilters((f) => ({ ...f, ...p }))}
        onClear={() => setFilters(EMPTY_CONTROL_FILTERS)}
        points={scoped}
        shown={shownPoints.length}
      />
      <ControlDeadlinesTable points={shownPoints} lead="promo" />
    </div>
  );
}
