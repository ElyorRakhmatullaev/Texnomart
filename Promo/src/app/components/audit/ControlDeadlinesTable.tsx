"use client";

import * as React from "react";
import { cn } from "@texnomart/ui/utils";
import { RuDate } from "../../../components/RuDate";
import type { ControlPoint, ControlResult } from "../../../lib/audit-control";

const RESULT_TINT: Record<ControlResult, string> = {
  "В срок": "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Просрочено": "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  "Ожидается": "bg-gray-100 text-gray-600 dark:bg-muted dark:text-gray-300",
};

function ResultChip({ p }: { p: ControlPoint }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", RESULT_TINT[p.result])}>
      {p.result}
    </span>
  );
}

export function ControlDeadlinesTable({
  points, lead,
}: {
  points: ControlPoint[];
  lead: "plan" | "promo";
}) {
  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-16 text-center text-sm text-muted-foreground">
        Нет записей по выбранным фильтрам.
      </div>
    );
  }
  const th = "border-b border-r border-gray-200 dark:border-border bg-gray-50 dark:bg-muted/40 px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap";
  const td = "border-b border-r border-gray-100 dark:border-border px-3 py-2 text-sm align-top";

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:block">
        <div className="max-h-[calc(100vh-320px)] overflow-auto [scrollbar-gutter:stable]">
          {/* 7-я часть §6.2 — explicit compact widths on the short-value columns so a
              full-width table doesn't pad them with dead space; the remaining width
              goes to «Комментарий» (long text stays readable, §6.3). */}
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                {lead === "plan" ? (
                  <th className={cn(th, "w-[190px]")}>Период плана</th>
                ) : (
                  <>
                    <th className={cn(th, "w-[240px]")}>№ и название промо</th>
                    <th className={cn(th, "w-[200px]")}>Период акции</th>
                  </>
                )}
                <th className={cn(th, "w-[210px]")}>Контрольная точка</th>
                <th className={cn(th, "w-[180px]")}>Ответственный · роль</th>
                <th className={cn(th, "w-[140px]")}>Дедлайн</th>
                <th className={cn(th, "w-[140px]")}>Факт</th>
                <th className={cn(th, "w-[110px]")}>Результат</th>
                <th className={cn(th, "w-[90px]")}>Просрочка</th>
                <th className={th}>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60 dark:hover:bg-muted/20">
                  {lead === "plan" ? (
                    <td className={cn(td, "whitespace-nowrap font-medium text-gray-900 dark:text-gray-100")}>
                      {p.planPeriod && (
                        <>
                          <span className="tabular-nums">
                            <RuDate value={p.planPeriod.start} /> — <RuDate value={p.planPeriod.end} />
                          </span>
                          <span className="block text-[11px] font-normal text-gray-400 dark:text-gray-500">
                            {p.planPeriod.label}
                          </span>
                        </>
                      )}
                    </td>
                  ) : (
                    <>
                      <td className={td}>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{p.promoName}</p>
                        <p className="font-mono text-[11px] text-gray-400 dark:text-gray-500">{p.promoNo}</p>
                      </td>
                      <td className={cn(td, "tabular-nums whitespace-nowrap text-gray-600 dark:text-gray-300")}>
                        {p.promoPeriod && (<><RuDate value={p.promoPeriod.start} />{" — "}<RuDate value={p.promoPeriod.end} /></>)}
                      </td>
                    </>
                  )}
                  <td className={cn(td, "text-gray-900 dark:text-gray-100")}>{p.checkpoint}</td>
                  <td className={td}>
                    <p className="text-gray-900 dark:text-gray-100">{p.responsibleName}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">{p.responsibleRole}</p>
                  </td>
                  <td className={cn(td, "tabular-nums whitespace-nowrap text-gray-600 dark:text-gray-300")}><RuDate value={p.deadline} withTime /></td>
                  <td className={cn(td, "tabular-nums whitespace-nowrap text-gray-600 dark:text-gray-300")}>{p.actualAt ? <RuDate value={p.actualAt} withTime /> : <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                  <td className={td}><ResultChip p={p} /></td>
                  <td className={cn(td, "tabular-nums text-red-600 dark:text-red-400")}>{p.overdueDays > 0 ? `+${p.overdueDays} дн.` : <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                  <td className={cn(td, "min-w-[180px] text-gray-600 dark:text-gray-300")}>{p.comment ?? <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards (Mode B) */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {points.map((p) => (
          <div key={p.id} className="rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card p-3 shadow-[0px_2px_4px_rgba(204,204,204,0.25)]">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.checkpoint}</span>
              <ResultChip p={p} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lead === "plan" ? (
                p.planPeriod && (
                  <>
                    <span className="tabular-nums">
                      <RuDate value={p.planPeriod.start} /> — <RuDate value={p.planPeriod.end} />
                    </span>
                    {" · "}{p.planPeriod.label}
                  </>
                )
              ) : (
                <><span className="font-mono">{p.promoNo}</span> · {p.promoName}</>
              )}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
              <span>Ответственный: <span className="text-gray-700 dark:text-gray-200">{p.responsibleName}</span></span>
              <span>Просрочка: <span className="text-red-600 dark:text-red-400">{p.overdueDays > 0 ? `+${p.overdueDays} дн.` : "—"}</span></span>
              <span>Дедлайн: <RuDate value={p.deadline} /></span>
              <span>Факт: {p.actualAt ? <RuDate value={p.actualAt} /> : "—"}</span>
            </div>
            {p.comment && <p className="mt-2 border-t border-gray-100 dark:border-border pt-2 text-xs text-gray-600 dark:text-gray-300">{p.comment}</p>}
          </div>
        ))}
      </div>
    </>
  );
}
