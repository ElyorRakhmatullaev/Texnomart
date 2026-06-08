"use client";

import * as React from "react";
import {
  LineChart,
  MoreHorizontal,
  Download,
  Maximize2,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  Area,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@texnomart/ui/dropdown-menu";
import { Skeleton } from "@texnomart/ui/skeleton";
import { Separator } from "@texnomart/ui/separator";
import { Button } from "@texnomart/ui/button";
import { cn } from "@texnomart/ui/utils";

type Period = "24h" | "7d" | "30d";

interface ChartDataPoint {
  label: string;
  total: number;
  approved: number;
  approvedArea: number; // Duplicate for area fill to avoid key conflicts
  timestamp?: string;
}

// Generate mock data based on period
function generateMockData(period: Period): ChartDataPoint[] {
  if (period === "7d") {
    return [
      { label: "Пн", total: 1847, approved: 1265, approvedArea: 1265, timestamp: "Понедельник, 14 мая" },
      { label: "Вт", total: 2142, approved: 1456, approvedArea: 1456, timestamp: "Вторник, 15 мая" },
      { label: "Ср", total: 1923, approved: 1301, approvedArea: 1301, timestamp: "Среда, 16 мая" },
      { label: "Чт", total: 2089, approved: 1398, approvedArea: 1398, timestamp: "Четверг, 17 мая" },
      { label: "Пт", total: 2267, approved: 1534, approvedArea: 1534, timestamp: "Пятница, 18 мая" },
      { label: "Сб", total: 1658, approved: 1087, approvedArea: 1087, timestamp: "Суббота, 19 мая" },
      { label: "Вс", total: 1521, approved: 991, approvedArea: 991, timestamp: "Воскресенье, 20 мая" },
    ];
  }

  if (period === "24h") {
    return [
      { label: "00:00", total: 124, approved: 82, approvedArea: 82 },
      { label: "06:00", total: 98, approved: 67, approvedArea: 67 },
      { label: "12:00", total: 187, approved: 128, approvedArea: 128 },
      { label: "18:00", total: 213, approved: 145, approvedArea: 145 },
    ];
  }

  // 30d - every 5 days
  return [
    { label: "1 мая", total: 1523, approved: 1021, approvedArea: 1021 },
    { label: "6 мая", total: 1789, approved: 1198, approvedArea: 1198 },
    { label: "11 мая", total: 1934, approved: 1287, approvedArea: 1287 },
    { label: "16 мая", total: 2043, approved: 1378, approvedArea: 1378 },
    { label: "21 мая", total: 1876, approved: 1254, approvedArea: 1254 },
    { label: "26 мая", total: 1967, approved: 1312, approvedArea: 1312 },
  ];
}

// Calculate summary stats
function calculateStats(data: ChartDataPoint[]) {
  const totalSum = data.reduce((sum, d) => sum + d.total, 0);
  const approvedSum = data.reduce((sum, d) => sum + d.approved, 0);
  const avgPerDay = Math.round(totalSum / data.length);
  const maxEntry = data.reduce((max, d) => (d.total > max.total ? d : max), data[0]);

  return {
    total: totalSum,
    avgPerDay,
    peak: maxEntry.total,
    peakLabel: maxEntry.label,
    conversion: totalSum > 0 ? Math.round((approvedSum / totalSum) * 100) : 0,
  };
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  const total = payload.find((p) => p.dataKey === "total")?.value || 0;
  const approved = payload.find((p) => p.dataKey === "approved")?.value || 0;
  const conversion = total > 0 ? Math.round((Number(approved) / Number(total)) * 100) : 0;

  // Get timestamp if available
  const timestamp = payload[0]?.payload?.timestamp || label;

  return (
    <Card className="shadow-md p-3 border">
      <div className="space-y-2">
        <p className="text-xs text-gray-700">{timestamp}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#FFD60A]" />
            <span className="text-sm text-gray-700">Одобрено:</span>
            <span className="ml-auto text-sm font-semibold tabular-nums">
              {Number(approved).toLocaleString("ru-RU")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#525252]" />
            <span className="text-sm text-gray-700">Всего:</span>
            <span className="ml-auto text-sm font-semibold tabular-nums">
              {Number(total).toLocaleString("ru-RU")}
            </span>
          </div>
        </div>
        <Separator />
        <p className="text-xs text-gray-600">Конверсия: {conversion}%</p>
      </div>
    </Card>
  );
}

interface ApplicationsDynamicsChartProps {
  period?: Period;
  onPeriodChange?: (period: Period) => void;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function ApplicationsDynamicsChart({
  period = "7d",
  onPeriodChange,
  loading = false,
  error = false,
  onRetry,
}: ApplicationsDynamicsChartProps) {
  const data = generateMockData(period);
  const stats = calculateStats(data);

  const handleDownloadCSV = () => {
    console.log("Downloading CSV...");
  };

  const handleDownloadPNG = () => {
    console.log("Downloading PNG...");
  };

  const handleFullscreen = () => {
    console.log("Opening fullscreen...");
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[320px] w-full" />
            <div className="flex items-center justify-center gap-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <LineChart className="size-12 text-gray-400 mb-4" />
          <p className="text-base font-medium text-gray-900 mb-2">
            Не удалось загрузить данные
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Попробуйте обновить страницу или повторите попытку позже
          </p>
          <Button variant="secondary" onClick={onRetry}>
            Повторить
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">Динамика заявок</CardTitle>
              <CardDescription className="text-xs text-gray-700 mt-1">
                Всего поданных и одобренных заявок
              </CardDescription>
            </div>
            <Tabs value={period} onValueChange={(v) => onPeriodChange?.(v as Period)}>
              <TabsList className="h-8">
                <TabsTrigger value="24h" className="text-xs px-3">
                  24 часа
                </TabsTrigger>
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
          <p className="text-base font-medium text-gray-900 mb-2">
            Нет данных за выбранный период
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Выберите другой период или проверьте фильтры
          </p>
          <Button variant="secondary">Изменить период</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">Динамика заявок</CardTitle>
            <CardDescription className="text-xs text-gray-700 mt-1">
              Всего поданных и одобренных заявок
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={period} onValueChange={(v) => onPeriodChange?.(v as Period)}>
              <TabsList className="h-8">
                <TabsTrigger value="24h" className="text-xs px-3">
                  24 часа
                </TabsTrigger>
                <TabsTrigger value="7d" className="text-xs px-3">
                  7 дней
                </TabsTrigger>
                <TabsTrigger value="30d" className="text-xs px-3">
                  30 дней
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-md transition-all size-8 hover:bg-accent hover:text-accent-foreground">
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadCSV}>
                  <Download className="mr-2 size-4" />
                  Скачать CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPNG}>
                  <Download className="mr-2 size-4" />
                  Скачать PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFullscreen}>
                  <Maximize2 className="mr-2 size-4" />
                  Открыть в полном экране
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chart */}
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height={320}>
              <RechartsLineChart
                data={data}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                id="applications-dynamics-chart"
              >
                <defs>
                  <linearGradient id="approvedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD60A" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#FFD60A" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#E5E7EB" }} />
                <Area
                  type="monotone"
                  dataKey="approvedArea"
                  fill="url(#approvedGradient)"
                  stroke="none"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#525252"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: "#525252",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="approved"
                  stroke="#FFD60A"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: "#FFD60A",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 bg-[#FFD60A]" />
              <span className="text-sm text-gray-700">Одобренные заявки</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 bg-[#525252]" />
              <span className="text-sm text-gray-700">Всего заявок</span>
            </div>
          </div>

          {/* Summary stats */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Сумма за период:</span>
              <span className="font-semibold tabular-nums">
                {stats.total.toLocaleString("ru-RU")}
              </span>
            </div>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Среднее в день:</span>
              <span className="font-semibold tabular-nums">
                {stats.avgPerDay.toLocaleString("ru-RU")}
              </span>
            </div>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Пик:</span>
              <span className="font-semibold tabular-nums">
                {stats.peak.toLocaleString("ru-RU")}
              </span>
              <span className="text-gray-500">({stats.peakLabel})</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
