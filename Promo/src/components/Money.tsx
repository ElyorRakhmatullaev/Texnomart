"use client";

import { formatSum } from "@texnomart/shared/utils/formatters";
import { cn } from "@texnomart/ui/utils";

interface MoneyProps {
  /** Amount in UZS; rendered as "1 299 000 сум". */
  value: number;
  className?: string;
}

/** Thin wrapper over formatSum — UZS with «сум» suffix, tabular figures. */
export function Money({ value, className }: MoneyProps) {
  return (
    <span className={cn("tabular-nums", className)}>{formatSum(value)}</span>
  );
}
