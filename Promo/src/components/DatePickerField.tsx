"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { ru } from "date-fns/locale";
import { buttonVariants } from "@texnomart/ui/button";
import { Calendar } from "@texnomart/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@texnomart/ui/popover";
import { cn } from "@texnomart/ui/utils";
import { formatDateFull } from "@texnomart/shared/utils/formatters";
import { CALENDAR_DROPDOWN_PROPS } from "./calendar-dropdown-props";

interface DatePickerFieldProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  /** Disables every day before this date (e.g. a minimum lead-time rule). */
  minDate?: Date;
  /** Disables every day after this date (e.g. the end of an allowed period). */
  maxDate?: Date;
  invalid?: boolean;
  id?: string;
}

/**
 * Single-date custom calendar-popover field — replaces a plain native
 * `<input type="date">` when two separate labeled date fields (start/end)
 * are needed side by side, rather than one combined range control.
 */
export function DatePickerField({
  value,
  onChange,
  placeholder = "Выберите дату",
  minDate,
  maxDate,
  invalid,
  id,
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Нативная <button>, а не общий <Button>: он не пробрасывает ref, и Radix
          не находил якорь — календарь открывался за экраном (translate -200%),
          дату было не выбрать. Тот же дефект и лечение, что в Волне 1
          (tasks/lessons.md, «off-screen Radix-контент»). */}
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-invalid={invalid}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-9 w-full justify-start gap-1.5 bg-background text-sm font-normal",
            invalid && "border-red-500"
          )}
        >
          <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
          {value ? (
            <span className="tabular-nums">{formatDateFull(value)}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={ru}
          selected={value ?? undefined}
          defaultMonth={value ?? minDate}
          disabled={
            minDate || maxDate
              ? [
                  ...(minDate ? [{ before: minDate }] : []),
                  ...(maxDate ? [{ after: maxDate }] : []),
                ]
              : undefined
          }
          onSelect={(next) => {
            onChange(next ?? null);
            setOpen(false);
          }}
          {...CALENDAR_DROPDOWN_PROPS}
        />
      </PopoverContent>
    </Popover>
  );
}
