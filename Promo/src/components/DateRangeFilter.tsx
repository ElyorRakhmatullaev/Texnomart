"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { ru } from "date-fns/locale";
import { Button } from "@texnomart/ui/button";
import { Calendar } from "@texnomart/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@texnomart/ui/popover";
import { formatDateFull } from "@texnomart/shared/utils/formatters";
import { CALENDAR_DROPDOWN_PROPS } from "./calendar-dropdown-props";

interface DateRangeFilterProps {
  value: [Date, Date] | null;
  onChange: (range: [Date, Date] | null) => void;
  placeholder?: string;
  /** Disables every day before this date (e.g. a minimum lead-time rule). */
  minDate?: Date;
  /** Disables every day after this date (e.g. the end of an allowed period). */
  maxDate?: Date;
  className?: string;
}

/**
 * Custom calendar-popover date-range filter — replaces the plain native
 * `<input type="date">` pair used for «Период акции» across the app (short
 * calendar's own range picker was already custom; the others used native
 * inputs before this).
 */
export function DateRangeFilter({
  value,
  onChange,
  placeholder = "Период акции",
  minDate,
  maxDate,
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = React.useState(false);
  const range = value ? { from: value[0], to: value[1] } : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className ?? "h-8 gap-1.5 bg-background text-sm font-normal"}
        >
          <CalendarIcon className="size-3.5 text-muted-foreground" />
          {value ? (
            <span className="tabular-nums">
              {formatDateFull(value[0])} — {formatDateFull(value[1])}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          numberOfMonths={2}
          locale={ru}
          selected={range}
          defaultMonth={range?.from ?? minDate}
          disabled={
            minDate || maxDate
              ? [
                  ...(minDate ? [{ before: minDate }] : []),
                  ...(maxDate ? [{ after: maxDate }] : []),
                ]
              : undefined
          }
          onSelect={(next) => {
            if (next?.from && next?.to) {
              onChange([next.from, next.to]);
              setOpen(false);
            } else if (next?.from) {
              onChange([next.from, next.from]);
            } else {
              onChange(null);
            }
          }}
          {...CALENDAR_DROPDOWN_PROPS}
        />
        {value && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-full text-xs text-muted-foreground"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Очистить период
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
