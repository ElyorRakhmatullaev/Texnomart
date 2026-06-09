"use client";

import * as React from "react";
import { RefreshCw, Download } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@texnomart/ui/dropdown-menu";
import { Switch } from "@texnomart/ui/switch";
import { Label } from "@texnomart/ui/label";

interface PeriodOption {
  value: string;
  label: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  period?: string;
  periodOptions?: PeriodOption[];
  compareEnabled?: boolean;
  onRefresh?: () => void;
  onPeriodChange?: (period: string) => void;
  onCompareToggle?: (enabled: boolean) => void;
  onExport?: (format: string) => void;
  lastUpdated?: string;
  showCompare?: boolean;
  showExport?: boolean;
  actions?: React.ReactNode;
}

const DEFAULT_PERIODS: PeriodOption[] = [
  { value: "today", label: "Сегодня" },
  { value: "yesterday", label: "Вчера" },
  { value: "7days", label: "7 дней" },
  { value: "30days", label: "30 дней" },
  { value: "custom", label: "Произвольный..." },
];

export function PageHeader({
  title,
  subtitle,
  period = "7days",
  periodOptions = DEFAULT_PERIODS,
  compareEnabled = false,
  onRefresh,
  onPeriodChange,
  onCompareToggle,
  onExport,
  lastUpdated,
  showCompare = true,
  showExport = true,
  actions,
}: PageHeaderProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = (format: string) => {
    onExport?.(format);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 h-auto sm:h-14 pt-3 pb-6">
      <div>
        <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-gray-900">
          {title}
        </h1>
        {subtitle ? (
          <div className="text-sm text-gray-600 mt-1">{subtitle}</div>
        ) : lastUpdated ? (
          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            Обновлено: {lastUpdated}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {onPeriodChange && (
          <Select value={period} onValueChange={(v) => onPeriodChange(v)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Период" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {showCompare && onCompareToggle && (
          <div className="flex items-center gap-2">
            <Switch
              id="compare-mode"
              checked={compareEnabled}
              onCheckedChange={(checked) => onCompareToggle(checked)}
            />
            <Label htmlFor="compare-mode" className="text-sm cursor-pointer">
              Сравнить с прошлым
            </Label>
          </div>
        )}

        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9"
          >
            <RefreshCw
              className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        )}

        {showExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-9">
                <Download className="size-4 mr-2" />
                Экспорт
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("xlsx")}>
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {actions}
      </div>
    </div>
  );
}
