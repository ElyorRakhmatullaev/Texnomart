"use client";

import { CalendarClock } from "lucide-react";
import { formatDateFull } from "@texnomart/shared/utils/formatters";
import { cn } from "@texnomart/ui/utils";

interface DeadlineChipsProps {
  /** Campaign start date; when given, each chip shows the computed deadline date. */
  startDate?: Date;
  className?: string;
}

const DEADLINES: Array<{ label: string; days: number }> = [
  { label: "План → КМ", days: 46 },
  { label: "Заполнение КМ", days: 21 },
  { label: "Отправка отчёта", days: 17 },
];

function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Chips for the spec calendar deadlines — all «календарные дни» (tied to a date),
 * never «рабочие». Non-blocking, informational.
 */
export function DeadlineChips({ startDate, className }: DeadlineChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {DEADLINES.map((d) => (
        <span
          key={d.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
        >
          <CalendarClock className="size-3.5 shrink-0" />
          <span className="font-medium text-foreground">{d.label}</span>
          <span className="tabular-nums">за {d.days} дн.</span>
          {startDate && (
            <span className="tabular-nums">
              · {formatDateFull(subtractDays(startDate, d.days))}
            </span>
          )}
          <span className="text-muted-foreground">(календарные)</span>
        </span>
      ))}
    </div>
  );
}
