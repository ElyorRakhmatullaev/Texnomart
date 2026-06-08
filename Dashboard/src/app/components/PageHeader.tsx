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

interface PageHeaderProps {
  period?: string;
  compareEnabled?: boolean;
  onRefresh?: () => void;
  onPeriodChange?: (period: string) => void;
  onCompareToggle?: (enabled: boolean) => void;
  lastUpdated?: string;
}

export function PageHeader({
  period = "7days",
  compareEnabled = false,
  onRefresh,
  onPeriodChange,
  onCompareToggle,
  lastUpdated = "только что",
}: PageHeaderProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = (format: string) => {
    console.log(`Export as ${format}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 h-auto sm:h-14 pt-3 pb-6">
      <div>
        <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-gray-900">Дашборд</h1>
        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-green-500" />
          </span>
          Обновлено: {lastUpdated}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={period} onValueChange={(v) => onPeriodChange?.(v)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Период" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Сегодня</SelectItem>
            <SelectItem value="yesterday">Вчера</SelectItem>
            <SelectItem value="7days">7 дней</SelectItem>
            <SelectItem value="30days">30 дней</SelectItem>
            <SelectItem value="custom">Произвольный...</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Switch
            id="compare-mode"
            checked={compareEnabled}
            onCheckedChange={(checked) => onCompareToggle?.(checked)}
          />
          <Label htmlFor="compare-mode" className="text-sm cursor-pointer">
            Сравнить с прошлым
          </Label>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-9"
        >
          <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>

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
      </div>
    </div>
  );
}
