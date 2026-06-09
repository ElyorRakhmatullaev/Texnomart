"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@texnomart/ui/utils";

interface OverdueTagProps {
  /** Days overdue. */
  days: number;
  className?: string;
}

/**
 * Red micro-tag «+N дн.» for просрочка. It NEVER blocks an action — it is a
 * signal that is always logged (spec). Renders nothing for non-positive days.
 */
export function OverdueTag({ days, className }: OverdueTagProps) {
  if (days <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-700 tabular-nums",
        className
      )}
      title={`Просрочка: ${days} дн.`}
    >
      <AlertTriangle className="size-3" />
      +{days} дн.
    </span>
  );
}
