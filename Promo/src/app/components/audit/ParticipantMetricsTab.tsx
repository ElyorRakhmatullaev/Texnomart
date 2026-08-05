"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { Button } from "@texnomart/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@texnomart/ui/select";
import {
  buildParticipantMetrics, PARTICIPANT_ROLES, type ParticipantMetricRow, type TimelinessBand,
} from "../../../lib/audit-control";
import { exportAuditXlsx } from "../../../lib/audit-xlsx";
import { exportStamp } from "../../../lib/promo-export";
import type { PromoRole } from "../../role-context";
import type { AuditAccess } from "./AuditPage";
import { ParticipantTasksDrawer } from "./ParticipantTasksDrawer";

const BAND_TINT: Record<TimelinessBand, string> = {
  "Высокая": "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Средняя": "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Низкая": "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

export function ParticipantMetricsTab({ access }: { access: AuditAccess }) {
  const isKm = access.role === "Категорийный менеджер (КМ)";

  const [role, setRole] = React.useState<PromoRole>("Категорийный менеджер (КМ)");
  const effectiveRole = isKm ? "Категорийный менеджер (КМ)" : role;
  const [drillName, setDrillName] = React.useState<string | null>(null);
  // Скоуп по матрице прав (5C) сужает набор точек внутри деривации, поэтому строка КМ,
  // которому записи не видны, здесь просто не появится — отдельный фильтр по ФИО не нужен.
  const rows = React.useMemo(
    () => buildParticipantMetrics(effectiveRole, new Date(), access.scope),
    [effectiveRole, access.scope]
  );
  const dueLabel = effectiveRole === "Категорийный менеджер (КМ)" ? "Промо с дедлайном" : "Задач с дедлайном";

  const th = "border-b border-r border-gray-200 dark:border-border bg-gray-50 dark:bg-muted/40 px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap";
  const td = "border-b border-r border-gray-100 dark:border-border px-3 py-2 text-sm align-top";

  const handleExport = () => {
    const participantLabel = effectiveRole === "Категорийный менеджер (КМ)" ? "ФИО КМ" : "Участник";
    const header = [
      "№", participantLabel, dueLabel, "Вовремя", "С просрочкой",
      "Своевременность, %", "Уровень своевременности", "Ср. просрочка, дн.", "Возвраты", "Повторные отправки",
    ];
    const exportRows: (string | number)[][] = rows.map((r) => [
      r.rank, r.name, r.dueCount, r.onTime, r.overdue,
      r.timelinessPct, r.band, r.avgOverdueDays, r.returns, r.resends,
    ]);
    exportAuditXlsx({
      sheetName: "Показатели участников",
      header,
      rows: exportRows,
      filename: `Показатели_участников_${exportStamp()}.xlsx`,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Роль</span>
          <Select value={effectiveRole} onValueChange={(v) => setRole(v as PromoRole)} disabled={isKm}>
            <SelectTrigger className="h-9 w-full max-w-xs bg-white dark:bg-card text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PARTICIPANT_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="h-9 gap-1.5"
          disabled={rows.length === 0}
          onClick={handleExport}
        >
          <Download className="size-4" /> Экспорт
        </Button>
      </div>

      {/* Desktop rating table */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>№</th>
                <th className={th}>{effectiveRole === "Категорийный менеджер (КМ)" ? "ФИО КМ" : "Участник"}</th>
                <th className={th}>{dueLabel}</th>
                <th className={th}>Вовремя</th>
                <th className={th}>С просрочкой</th>
                <th className={th}>Своевременность</th>
                <th className={th}>Ср. просрочка, дн.</th>
                <th className={th}>Возвраты</th>
                <th className={th}>Повторные отправки</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <MetricRow key={r.name} r={r} td={td} onDrill={() => setDrillName(r.name)} bandTint={BAND_TINT} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {rows.map((r) => (
          <button key={r.name} onClick={() => setDrillName(r.name)} className="rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card p-3 text-left shadow-[0px_2px_4px_rgba(204,204,204,0.25)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.rank}. {r.name}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", BAND_TINT[r.band])}>{r.timelinessPct}% · {r.band}</span>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1 text-[11px] text-gray-500 dark:text-gray-400">
              <span>{dueLabel}: {r.dueCount}</span>
              <span>Вовремя: {r.onTime}</span>
              <span>С просрочкой: {r.overdue}</span>
              <span>Ср. просрочка: {r.avgOverdueDays} дн.</span>
              <span>Возвраты: {r.returns}</span>
              <span>Повторные: {r.resends}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Справочно — post-approval changes, explicitly outside the rating (§ PDF). */}
      <div className="rounded-lg border border-gray-200 dark:border-border bg-gray-50/60 dark:bg-muted/20 p-3 text-xs text-gray-500 dark:text-gray-400">
        Справочно: добавленные, изменённые и исключённые позиции после согласования не входят в рейтинг своевременности и учитываются отдельно.
      </div>

      <ParticipantTasksDrawer
        name={drillName}
        role={effectiveRole}
        scope={access.scope}
        open={drillName !== null}
        onOpenChange={(v) => { if (!v) setDrillName(null); }}
      />
    </div>
  );
}

function MetricRow({
  r, td, onDrill, bandTint,
}: {
  r: ParticipantMetricRow; td: string; onDrill: () => void; bandTint: Record<TimelinessBand, string>;
}) {
  return (
    <tr className="cursor-pointer hover:bg-gray-50/60 dark:hover:bg-muted/20" onClick={onDrill}>
      <td className={cn(td, "tabular-nums text-gray-500 dark:text-gray-400")}>{r.rank}</td>
      <td className={cn(td, "font-medium text-gray-900 dark:text-gray-100")}>{r.name}</td>
      <td className={cn(td, "tabular-nums")}>{r.dueCount}</td>
      <td className={cn(td, "tabular-nums text-emerald-700 dark:text-emerald-300")}>{r.onTime}</td>
      <td className={cn(td, "tabular-nums text-red-700 dark:text-red-300")}>{r.overdue}</td>
      <td className={td}>
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", bandTint[r.band])}>{r.timelinessPct}% · {r.band}</span>
      </td>
      <td className={cn(td, "tabular-nums")}>{r.avgOverdueDays}</td>
      <td className={cn(td, "tabular-nums")}>{r.returns}</td>
      <td className={cn(td, "tabular-nums")}>{r.resends}</td>
    </tr>
  );
}
