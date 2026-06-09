"use client";

import { Badge } from "@texnomart/ui/badge";
import type { StatusConfig } from "../types";

interface StatusBadgeProps {
  config: Record<string, StatusConfig>;
  status: string;
  className?: string;
}

export function StatusBadge({ config, status, className }: StatusBadgeProps) {
  const style = config[status] ?? {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-700",
  };

  return (
    <Badge
      className={`${style.bg} ${style.text} hover:${style.bg} text-xs px-2 py-0.5 rounded-full border-0 ${className ?? ""}`}
    >
      {style.label}
    </Badge>
  );
}
