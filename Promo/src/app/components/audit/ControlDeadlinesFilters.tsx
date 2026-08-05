"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@texnomart/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@texnomart/ui/sheet";
import { PromoNoFilter, type PromoNoOption } from "../short-calendar/PromoNoFilter";
import type { ControlPoint, ControlResult } from "../../../lib/audit-control";
import type { AuditGlobalFilters } from "./AuditPage";

export interface ControlFilters {
  /** Выбранные акции (id). Пусто = все. Подписи — «26-N · Название», как в кратком календаре. */
  promoIds: string[];
  planPeriod: string;      // "all" | подпись планового периода («Ноябрь 2026») — только вкладка 1
  /** Период ПРОВЕДЕНИЯ акции (ISO yyyy-mm-dd) — только вкладка 2, отдельно от периода дедлайна. */
  promoFrom: string;
  promoTo: string;
  responsible: string;     // "all" | exact responsibleName
  checkpoint: string;      // "all" | exact checkpoint
  result: "all" | ControlResult | "overdue"; // overdue = «Только просроченные»
}
export const EMPTY_CONTROL_FILTERS: ControlFilters = {
  promoIds: [], planPeriod: "all", promoFrom: "", promoTo: "",
  responsible: "all", checkpoint: "all", result: "all",
};

export function countActiveControlFilters(f: ControlFilters): number {
  let n = 0;
  if (f.promoIds.length) n++;
  if (f.planPeriod !== "all") n++;
  if (f.promoFrom || f.promoTo) n++;
  if (f.responsible !== "all") n++;
  if (f.checkpoint !== "all") n++;
  if (f.result !== "all") n++;
  return n;
}

export function applyControlFilters(
  points: ControlPoint[],
  f: ControlFilters,
  g: AuditGlobalFilters
): ControlPoint[] {
  const fromTs = g.from ? new Date(`${g.from}T00:00:00`).getTime() : null;
  const toTs = g.to ? new Date(`${g.to}T23:59:59`).getTime() : null;
  return points.filter((p) => {
    if (g.role !== "all" && p.responsibleRole !== g.role) return false;
    const ts = p.deadline.getTime();
    if (fromTs !== null && ts < fromTs) return false;
    if (toTs !== null && ts > toTs) return false;
    if (f.promoIds.length > 0 && !f.promoIds.includes(p.campaignId)) return false;
    if (f.planPeriod !== "all" && p.planPeriod?.label !== f.planPeriod) return false;
    // Пересечение с периодом проведения акции (акция попадает в выборку, если её период
    // пересекается с выбранным, а не только если целиком в него входит).
    if (f.promoFrom && p.promoPeriod && p.promoPeriod.end < new Date(`${f.promoFrom}T00:00:00`)) return false;
    if (f.promoTo && p.promoPeriod && p.promoPeriod.start > new Date(`${f.promoTo}T23:59:59`)) return false;
    if (f.responsible !== "all" && p.responsibleName !== f.responsible) return false;
    if (f.checkpoint !== "all" && p.checkpoint !== f.checkpoint) return false;
    if (f.result === "overdue" && p.overdueDays <= 0) return false;
    else if (f.result !== "all" && f.result !== "overdue" && p.result !== f.result) return false;
    return true;
  });
}

function Fields({
  values, onChange, responsibles, checkpoints, planPeriods, promoOptions, showPromoPeriod, layout = "row",
}: {
  values: ControlFilters;
  onChange: (p: Partial<ControlFilters>) => void;
  responsibles: string[];
  checkpoints: string[];
  /** Плановые периоды — только вкладка «Сроки по плану»; на вкладке промо не передаются. */
  planPeriods: string[];
  promoOptions: PromoNoOption[];
  /** Период проведения акции — только вкладка «Сроки по промо и отчётам». */
  showPromoPeriod: boolean;
  layout?: "row" | "stack";
}) {
  const wrap = layout === "row" ? "flex flex-wrap items-end gap-2" : "flex flex-col gap-3";
  return (
    <div className={wrap}>
      <PromoNoFilter
        options={promoOptions}
        selected={values.promoIds}
        onChange={(ids) => onChange({ promoIds: ids })}
        width={layout === "row" ? "w-[240px]" : "w-full"}
      />
      {showPromoPeriod && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Период акции</span>
          <div className="flex items-center gap-2">
            <input
              type="date" value={values.promoFrom} onChange={(e) => onChange({ promoFrom: e.target.value })}
              className="h-9 rounded-md border border-gray-200 dark:border-border bg-white dark:bg-card px-2 text-sm"
              aria-label="Период акции, с"
            />
            <span className="text-gray-400">—</span>
            <input
              type="date" value={values.promoTo} onChange={(e) => onChange({ promoTo: e.target.value })}
              className="h-9 rounded-md border border-gray-200 dark:border-border bg-white dark:bg-card px-2 text-sm"
              aria-label="Период акции, по"
            />
          </div>
        </div>
      )}
      {planPeriods.length > 0 && (
        <Select value={values.planPeriod} onValueChange={(v) => onChange({ planPeriod: v })}>
          <SelectTrigger className="h-9 w-full sm:w-48 bg-white dark:bg-card text-sm"><SelectValue placeholder="Период плана" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все периоды плана</SelectItem>
            {planPeriods.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <Select value={values.responsible} onValueChange={(v) => onChange({ responsible: v })}>
        <SelectTrigger className="h-9 w-full sm:w-52 bg-white dark:bg-card text-sm"><SelectValue placeholder="Ответственный" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все ответственные</SelectItem>
          {responsibles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={values.checkpoint} onValueChange={(v) => onChange({ checkpoint: v })}>
        <SelectTrigger className="h-9 w-full sm:w-64 bg-white dark:bg-card text-sm"><SelectValue placeholder="Контрольная точка" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все контрольные точки</SelectItem>
          {checkpoints.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={values.result} onValueChange={(v) => onChange({ result: v as ControlFilters["result"] })}>
        <SelectTrigger className="h-9 w-full sm:w-44 bg-white dark:bg-card text-sm"><SelectValue placeholder="Результат" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все</SelectItem>
          <SelectItem value="В срок">В срок</SelectItem>
          <SelectItem value="Просрочено">Просрочено</SelectItem>
          <SelectItem value="overdue">Только просроченные</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function ControlDeadlinesFilters({
  values, onChange, onClear, points, shown,
}: {
  values: ControlFilters;
  onChange: (p: Partial<ControlFilters>) => void;
  onClear: () => void;
  points: ControlPoint[];
  shown: number;
}) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const responsibles = React.useMemo(
    () => Array.from(new Set(points.map((p) => p.responsibleName))).sort(),
    [points]
  );
  const checkpoints = React.useMemo(
    () => Array.from(new Set(points.map((p) => p.checkpoint))).sort(),
    [points]
  );
  // Пусто на вкладке промо (у её точек нет planPeriod) → фильтр там не рисуется.
  const planPeriods = React.useMemo(
    () =>
      Array.from(
        new Set(points.map((p) => p.planPeriod?.label).filter((l): l is string => !!l))
      ),
    [points]
  );
  // Значение опции — campaignId; форматируется только подпись («26-N»), как в кратком календаре.
  const promoOptions = React.useMemo<PromoNoOption[]>(() => {
    const map = new Map<string, PromoNoOption>();
    for (const p of points) {
      if (!map.has(p.campaignId)) {
        map.set(p.campaignId, { id: p.campaignId, no: p.promoNo, name: p.promoName });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.no.localeCompare(b.no, "ru", { numeric: true })
    );
  }, [points]);
  // Период проведения акции есть только у промо-точек.
  const showPromoPeriod = React.useMemo(() => points.some((p) => !!p.promoPeriod), [points]);
  const active = countActiveControlFilters(values);

  return (
    <>
      <div className="hidden md:flex md:flex-wrap md:items-end md:justify-between md:gap-3">
        <Fields values={values} onChange={onChange} responsibles={responsibles} checkpoints={checkpoints} planPeriods={planPeriods} promoOptions={promoOptions} showPromoPeriod={showPromoPeriod} />
        <div className="flex items-center gap-3">
          {active > 0 && (
            <Button variant="ghost" size="sm" className="h-9" onClick={onClear}>Очистить</Button>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">Показано: {shown.toLocaleString("ru-RU")}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 md:hidden">
        <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setTimeout(() => setSheetOpen(true), 0)}>
          <SlidersHorizontal className="size-4" /> Фильтры
          {active > 0 && <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-black">{active}</span>}
        </Button>
        <span className="text-xs text-gray-500 dark:text-gray-400">Показано: {shown.toLocaleString("ru-RU")}</span>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
          <SheetHeader><SheetTitle>Фильтры сроков</SheetTitle></SheetHeader>
          <div className="px-4 pb-6">
            <Fields values={values} onChange={onChange} responsibles={responsibles} checkpoints={checkpoints} planPeriods={planPeriods} promoOptions={promoOptions} showPromoPeriod={showPromoPeriod} layout="stack" />
            <div className="mt-5 flex gap-2">
              {active > 0 && <Button variant="outline" className="flex-1" onClick={onClear}>Очистить</Button>}
              <Button className="flex-1" onClick={() => setSheetOpen(false)}>Показать {shown.toLocaleString("ru-RU")}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
