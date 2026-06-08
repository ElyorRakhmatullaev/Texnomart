"use client";

import * as React from "react";
import { LineChart } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@texnomart/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@texnomart/ui/tabs";
import { Badge } from "@texnomart/ui/badge";
import { Skeleton } from "@texnomart/ui/skeleton";
import { Separator } from "@texnomart/ui/separator";
import { cn } from "@texnomart/ui/utils";

type Period = "7d" | "30d";

interface StatusConfig {
  key: string;
  label: string;
  color: string;
}

// 11 statuses in fixed order (bottom to top in stack)
const STATUSES: StatusConfig[] = [
  { key: "new", label: "Новая", color: "#3B82F6" },
  { key: "scoring", label: "На скоринге", color: "#F59E0B" },
  { key: "inProgress", label: "В работе у оператора", color: "#8B5CF6" },
  { key: "awaitingDocs", label: "Ожидает документы", color: "#F97316" },
  { key: "approved", label: "Одобрена", color: "#10B981" },
  { key: "partiallyApproved", label: "Частично одобрена", color: "#EC4899" },
  { key: "contractSigned", label: "Подписан договор", color: "#9CA3AF" },
  { key: "completed", label: "Завершена", color: "#059669" },
  { key: "rejected", label: "Отклонена", color: "#EF4444" },
  { key: "expired", label: "Просрочена", color: "#DC2626" },
  { key: "cancelled", label: "Отменена", color: "#6B7280" },
];

interface ChartDataPoint {
  date: string;
  label: string;
  [key: string]: number | string;
}

// Generate mock data based on period
function generateMockData(period: Period): ChartDataPoint[] {
  const days = period === "7d" ? 7 : 30;
  const data: ChartDataPoint[] = [];

  const baseDate = new Date(2024, 4, 14); // May 14, 2024
  const weekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() + i);

    const dayOfWeek = weekdays[currentDate.getDay()];
    const dateStr = `${String(currentDate.getDate()).padStart(2, "0")}.${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

    // Generate realistic distribution
    const totalForDay = 150 + Math.floor(Math.random() * 100);

    const point: ChartDataPoint = {
      date: currentDate.toISOString(),
      label: period === "7d" ? `${dayOfWeek} ${dateStr}` : dateStr,
      new: Math.floor(totalForDay * 0.1),
      scoring: Math.floor(totalForDay * 0.15),
      inProgress: Math.floor(totalForDay * 0.08),
      awaitingDocs: Math.floor(totalForDay * 0.05),
      approved: Math.floor(totalForDay * 0.35),
      partiallyApproved: Math.floor(totalForDay * 0.03),
      contractSigned: Math.floor(totalForDay * 0.04),
      completed: Math.floor(totalForDay * 0.1),
      rejected: Math.floor(totalForDay * 0.2),
      expired: Math.floor(totalForDay * 0.02),
      cancelled: Math.floor(totalForDay * 0.03),
    };

    data.push(point);
  }

  return data;
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);

  return (
    <Card className="shadow-md p-3 border">
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-700">{label}</p>
        <div className="space-y-1">
          {payload
            .filter((entry) => Number(entry.value) > 0)
            .reverse()
            .map((entry, index) => {
              const status = STATUSES.find((s) => s.key === entry.dataKey);
              if (!status) return null;

              return (
                <div key={index} className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-xs text-gray-700 flex-1">{status.label}:</span>
                  <span className="text-xs font-semibold tabular-nums">
                    {Number(entry.value).toLocaleString("ru-RU")}
                  </span>
                </div>
              );
            })}
        </div>
        {total > 0 && (
          <>
            <Separator className="my-1" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Всего:</span>
              <span className="text-sm font-semibold tabular-nums">
                {total.toLocaleString("ru-RU")}
              </span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

interface ApplicationStatusesChartProps {
  period?: Period;
  onPeriodChange?: (period: Period) => void;
  loading?: boolean;
}

export function ApplicationStatusesChart({
  period = "7d",
  onPeriodChange,
  loading = false,
}: ApplicationStatusesChartProps) {
  const [hiddenStatuses, setHiddenStatuses] = React.useState<Set<string>>(new Set());
  const data = generateMockData(period);

  const toggleStatus = (statusKey: string) => {
    setHiddenStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(statusKey)) {
        next.delete(statusKey);
      } else {
        next.add(statusKey);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-8 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-[320px] flex items-end justify-around gap-2">
              {[65, 80, 70, 85, 60, 75, 70].map((height, i) => (
                <Skeleton key={i} className="flex-1" style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-24" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">Статусы заявок</CardTitle>
              <CardDescription className="text-xs text-gray-700 mt-1">
                Распределение за период по дням
              </CardDescription>
            </div>
            <Tabs value={period} onValueChange={(v) => onPeriodChange?.(v as Period)}>
              <TabsList className="h-8">
                <TabsTrigger value="7d" className="text-xs px-3">
                  7 дней
                </TabsTrigger>
                <TabsTrigger value="30d" className="text-xs px-3">
                  30 дней
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <LineChart className="size-12 text-gray-400 mb-4" />
          <p className="text-base font-medium text-gray-900">Нет заявок за период</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">Статусы заявок</CardTitle>
            <CardDescription className="text-xs text-gray-700 mt-1">
              Распределение за период по дням
            </CardDescription>
          </div>
          <Tabs value={period} onValueChange={(v) => onPeriodChange?.(v as Period)}>
            <TabsList className="h-8">
              <TabsTrigger value="7d" className="text-xs px-3">
                7 дней
              </TabsTrigger>
              <TabsTrigger value="30d" className="text-xs px-3">
                30 дней
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chart */}
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={data}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                barCategoryGap="16%"
                id="application-statuses-chart"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#525252", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#525252", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => value.toLocaleString("ru-RU")}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                {STATUSES.filter((status) =>
                  ['new', 'scoring', 'approved', 'rejected'].includes(status.key)
                ).map((status, index, array) => (
                  <Bar
                    key={`bar-${status.key}-${index}`}
                    dataKey={status.key}
                    stackId="statuses"
                    fill={status.color}
                    radius={index === array.length - 1 ? [4, 4, 0, 0] : 0}
                    isAnimationActive={false}
                    hide={hiddenStatuses.has(status.key)}
                    fillOpacity={hiddenStatuses.has(status.key) ? 0 : 1}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {STATUSES.filter((status) =>
              ['new', 'scoring', 'approved', 'rejected'].includes(status.key)
            ).map((status) => {
              const isHidden = hiddenStatuses.has(status.key);
              return (
                <button
                  key={status.key}
                  onClick={() => toggleStatus(status.key)}
                  className={cn(
                    "transition-opacity",
                    isHidden && "opacity-40"
                  )}
                >
                  <Badge
                    style={{
                      backgroundColor: status.color,
                      borderColor: status.color,
                      color: "#fff",
                    }}
                    className="text-xs cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {status.label}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
