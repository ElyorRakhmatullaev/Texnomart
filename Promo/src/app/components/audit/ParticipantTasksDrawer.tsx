"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@texnomart/ui/sheet";
import { RuDate } from "../../../components/RuDate";
import {
  buildParticipantTasks, isPeriodSelected, overdueLabel, METRIC_LABEL,
  type MetricKey, type ParticipantFilters,
} from "../../../lib/audit-control";
import type { AuditScope } from "../../../lib/audit-access";
import type { PromoRole } from "../../role-context";

export function ParticipantTasksDrawer({
  name, role, scope, filters, metric = "all", open, onOpenChange,
}: {
  name: string | null;
  role: PromoRole;
  /** Область видимости по матрице прав (5C) — тот же скоуп, что у таблицы рейтинга. */
  scope?: AuditScope;
  /** Тот же отбор, что применён к рейтингу, — иначе панель покажет не те задачи. */
  filters?: ParticipantFilters;
  /** Показатель, по которому кликнули: панель раскрывает только его (п. 10). */
  metric?: MetricKey;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const tasks = React.useMemo(
    () => (name ? buildParticipantTasks(name, role, new Date(), { scope, filters }, metric) : []),
    [name, role, scope, filters, metric]
  );
  // №20 п.1: без выбранного периода «Все задачи» — только с наступившим
  // дедлайном, как в расчёте рейтинга; с периодом — все задачи периода.
  const periodSelected = isPeriodSelected(filters);
  const title =
    metric === "all" && !periodSelected
      ? "Задачи с наступившим дедлайном"
      : METRIC_LABEL[metric];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            Задачи: {name} — {title}: {tasks.length}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {metric !== "all"
              ? "Задачи, из которых складывается выбранный показатель."
              : periodSelected
                ? "Показаны все задачи выбранного периода; задачи, дедлайн которых ещё не наступил, в рейтинг не входят."
                : "Период не выбран — показаны только задачи с наступившим дедлайном, как в расчёте рейтинга."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2.5 px-4 pb-6">
          {tasks.length === 0 && <p className="text-sm text-muted-foreground">Нет задач за период.</p>}
          {tasks.map((t, i) => (
            <div key={`${t.campaignId}-${t.checkpoint}-${i}`} className="rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.checkpoint}</span>
                {!t.due
                  ? <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-gray-600 dark:bg-muted dark:text-gray-300">Дедлайн не наступил</span>
                  : t.overdueDays > 0
                    ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-red-700 dark:bg-red-500/15 dark:text-red-300">{overdueLabel(t)}</span>
                    : <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">В срок</span>}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400"><span className="font-mono">{t.promoNo}</span> · {t.promoName}</p>
              <div className="mt-1.5 grid grid-cols-2 gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                <span>Дедлайн: <RuDate value={t.deadline} /></span>
                <span>Факт: {t.actualAt ? <RuDate value={t.actualAt} /> : "—"}</span>
              </div>
              {t.comment && <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-300">{t.comment}</p>}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
