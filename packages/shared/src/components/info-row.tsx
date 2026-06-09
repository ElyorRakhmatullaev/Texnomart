"use client";

import * as React from "react";

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
  layout?: "stacked" | "between";
}

export function InfoRow({
  label,
  value,
  bold,
  layout = "stacked",
}: InfoRowProps) {
  if (layout === "between") {
    return (
      <div className="flex items-start justify-between gap-4">
        <span className="text-sm text-gray-500 shrink-0">{label}</span>
        <span className="text-sm text-gray-900 text-right">{value}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <span className="text-xs text-gray-500 sm:w-[140px] shrink-0">
        {label}
      </span>
      <span
        className={`text-sm text-gray-900 ${bold ? "font-semibold" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}
