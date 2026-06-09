"use client";

import { formatDateFull } from "@texnomart/shared/utils/formatters";

interface RuDateProps {
  value: Date;
  /** Append HH:mm (audit/history format DD.MM.YYYY HH:mm). */
  withTime?: boolean;
  className?: string;
}

/** Thin wrapper over formatDateFull — DD.MM.YYYY, optionally with HH:mm. */
export function RuDate({ value, withTime, className }: RuDateProps) {
  const date = formatDateFull(value);
  const time = withTime
    ? " " +
      value.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : "";
  return (
    <span className={className}>
      {date}
      {time}
    </span>
  );
}
