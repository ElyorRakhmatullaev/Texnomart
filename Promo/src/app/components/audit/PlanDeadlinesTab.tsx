"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { buildPlanControlPoints, type ControlPoint } from "../../../lib/audit-control";
import { exportAuditXlsx, fmtAuditDate } from "../../../lib/audit-xlsx";
import { exportStamp } from "../../../lib/promo-export";
import type { AuditAccess, AuditGlobalFilters } from "./AuditPage";
import {
  ControlDeadlinesFilters, EMPTY_CONTROL_FILTERS, applyControlFilters, type ControlFilters,
} from "./ControlDeadlinesFilters";
import { ControlDeadlinesTable } from "./ControlDeadlinesTable";

const PLAN_EXPORT_HEADER = [
  "Период плана", "Контрольная точка", "Ответственный · роль",
  "Дедлайн", "Факт", "Результат", "Просрочка", "Комментарий",
];

function planExportRows(points: ControlPoint[]): (string | number)[][] {
  return points.map((p) => [
    p.planPeriod ?? "",
    p.checkpoint,
    `${p.responsibleName} · ${p.responsibleRole}`,
    fmtAuditDate(p.deadline, true),
    p.actualAt ? fmtAuditDate(p.actualAt, true) : "—",
    p.result,
    p.overdueDays > 0 ? `+${p.overdueDays} дн.` : "—",
    p.comment ?? "",
  ]);
}

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
  const handleExport = () => {
    exportAuditXlsx({
      sheetName: "Сроки по плану",
      header: PLAN_EXPORT_HEADER,
      rows: planExportRows(shownPoints),
      filename: `Сроки_по_плану_${exportStamp()}.xlsx`,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <ControlDeadlinesFilters
        values={filters}
        onChange={(p) => setFilters((f) => ({ ...f, ...p }))}
        onClear={() => setFilters(EMPTY_CONTROL_FILTERS)}
        points={scoped}
        shown={shownPoints.length}
      />
      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          className="h-9 gap-1.5"
          disabled={shownPoints.length === 0}
          onClick={handleExport}
        >
          <Download className="size-4" /> Экспорт
        </Button>
      </div>
      <ControlDeadlinesTable points={shownPoints} lead="plan" />
    </div>
  );
}
