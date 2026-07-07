"use client";

import * as React from "react";
import { buildPlanControlPoints } from "../../../lib/audit-control";
import { OWN_AUDIT_KM_ID } from "../../../lib/promo-mock-data";
import type { AuditAccess, AuditGlobalFilters } from "./AuditPage";
import {
  ControlDeadlinesFilters, EMPTY_CONTROL_FILTERS, applyControlFilters, type ControlFilters,
} from "./ControlDeadlinesFilters";
import { ControlDeadlinesTable } from "./ControlDeadlinesTable";

export function PlanDeadlinesTab({
  access, globals,
}: { access: AuditAccess; globals: AuditGlobalFilters }) {
  const all = React.useMemo(() => buildPlanControlPoints(), []);
  // Plan points have no per-КМ attribution → a plain КМ sees none (documented limit).
  const scoped = React.useMemo(
    () => (access.canSeeAll ? all : []),
    [all, access.canSeeAll]
  );
  const [filters, setFilters] = React.useState<ControlFilters>(EMPTY_CONTROL_FILTERS);
  const shownPoints = React.useMemo(
    () => applyControlFilters(scoped, filters, globals),
    [scoped, filters, globals]
  );

  if (!access.canSeeAll) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-16 text-center text-sm text-muted-foreground">
        Сроки по плану доступны старшему КМ, коммерческому директору и администратору.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <ControlDeadlinesFilters
        values={filters}
        onChange={(p) => setFilters((f) => ({ ...f, ...p }))}
        onClear={() => setFilters(EMPTY_CONTROL_FILTERS)}
        points={scoped}
        shown={shownPoints.length}
      />
      <ControlDeadlinesTable points={shownPoints} lead="plan" />
    </div>
  );
}
