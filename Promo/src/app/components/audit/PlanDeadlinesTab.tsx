"use client";

import * as React from "react";
import { buildPlanControlPoints } from "../../../lib/audit-control";
import type { AuditAccess, AuditGlobalFilters } from "./AuditPage";
import {
  ControlDeadlinesFilters, EMPTY_CONTROL_FILTERS, applyControlFilters, type ControlFilters,
} from "./ControlDeadlinesFilters";
import { ControlDeadlinesTable } from "./ControlDeadlinesTable";

export function PlanDeadlinesTab({
  access, globals,
}: { access: AuditAccess; globals: AuditGlobalFilters }) {
  const all = React.useMemo(() => buildPlanControlPoints(), []);
  const isKm = access.role === "Категорийный менеджер (КМ)";
  // Plan points have no per-КМ attribution → a plain КМ sees none (documented limit).
  const scoped = React.useMemo(() => (isKm ? [] : all), [all, isKm]);
  const [filters, setFilters] = React.useState<ControlFilters>(EMPTY_CONTROL_FILTERS);
  const shownPoints = React.useMemo(
    () => applyControlFilters(scoped, filters, globals),
    [scoped, filters, globals]
  );

  if (isKm) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-16 text-center text-sm text-muted-foreground">
        Раздел «Сроки по плану» относится к согласованию плана руководителями и не содержит данных по вашим промо.
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
