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
    bg: "bg-gray-100 dark:bg-gray-700",
    text: "text-gray-700 dark:text-gray-200",
  };

  // Note: the shadcn Badge's hover background change is gated on `[a&]:hover`
  // (anchors only), so a plain <span> badge needs no hover neutralization — this
  // lets `style.bg`/`style.text` safely carry `dark:` variants.
  return (
    <Badge
      className={`${style.bg} ${style.text} text-xs px-2 py-0.5 rounded-full border-0 ${className ?? ""}`}
    >
      {style.label}
    </Badge>
  );
}
