"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import type { FilterConfig } from "../types";

interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  resultCount?: number;
  children?: React.ReactNode;
}

export function FilterBar({
  filters,
  values,
  onFilterChange,
  onClear,
  resultCount,
  children,
}: FilterBarProps) {
  const hasActiveFilters = Object.values(values).some((v) => v !== "all");

  return (
    <div className="flex items-center gap-2 flex-wrap shrink-0 bg-gray-50 rounded-md px-3 py-2">
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={values[filter.key] ?? "all"}
          onValueChange={(v) => onFilterChange(filter.key, v)}
        >
          <SelectTrigger className="w-[160px] h-8 text-sm bg-white">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все {filter.label.toLowerCase()}</SelectItem>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {children}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-gray-500"
          onClick={onClear}
        >
          <X className="h-3 w-3 mr-1" />
          Очистить
        </Button>
      )}
      {resultCount !== undefined && (
        <div className="ml-auto text-xs text-gray-500">
          Найдено: {resultCount.toLocaleString("ru-RU")}
        </div>
      )}
    </div>
  );
}
