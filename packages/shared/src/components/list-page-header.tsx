"use client";

import * as React from "react";
import { RefreshCw, Download, Plus, Search } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";

interface ListPageHeaderProps {
  title: string;
  counts?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  createLabel?: string;
  createLabelShort?: string;
  onCreate?: () => void;
  actions?: React.ReactNode;
}

export function ListPageHeader({
  title,
  counts,
  searchPlaceholder = "Поиск...",
  searchValue,
  onSearchChange,
  onRefresh,
  onExport,
  createLabel,
  createLabelShort,
  onCreate,
  actions,
}: ListPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
      <div>
        <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-gray-900 dark:text-gray-100">
          {title}
        </h1>
        {counts && (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{counts}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {onSearchChange && (
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-3 h-10"
            />
          </div>
        )}
        {onRefresh && (
          <Button variant="ghost" size="icon" className="shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" className="shrink-0">
            <Download className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Экспорт</span>
          </Button>
        )}
        {onCreate && createLabel && (
          <Button
            size="sm"
            className="bg-[#FFD60A] text-black hover:bg-[#f0ca00] shrink-0"
            onClick={onCreate}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">{createLabel}</span>
            {createLabelShort && (
              <span className="sm:hidden">{createLabelShort}</span>
            )}
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
