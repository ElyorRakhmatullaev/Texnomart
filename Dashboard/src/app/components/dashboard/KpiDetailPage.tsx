"use client";

import * as React from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  Users,
  FileText,
  Clock,
  Target,
  Wallet,
  Receipt,
  UserCheck,
  Timer,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Download,
  RefreshCw,
  LucideIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@texnomart/ui/card";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@texnomart/ui/table";
import { Progress } from "@texnomart/ui/progress";
import { cn } from "@texnomart/ui/utils";

interface MetricConfig {
  label: string;
  icon: LucideIcon;
  value: string;
  rawValue: number;
  delta: number;
  invertDelta?: boolean;
  unit: string;
  chartLabel: string;
  breakdownLabel: string;
  breakdownDimension: string;
  breakdownData: BreakdownRow[];
  trendData: TrendPoint[];
  relatedIds: string[];
}

interface BreakdownRow {
  name: string;
  value: number;
  formattedValue: string;
  share: number;
  delta: number;
}

interface TrendPoint {
  date: string;
  value: number;
  prev?: number;
}

function generateTrend(base: number, days: number, delta: number): TrendPoint[] {
  const points: TrendPoint[] = [];
  const volatility = 0.08;
  const dailyGrowth = delta / 100 / days;

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const label = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
    const factor = 1 + dailyGrowth * i + (Math.random() - 0.5) * volatility;
    const prev = base * (1 + (Math.random() - 0.5) * volatility * 0.5);
    points.push({
      date: label,
      value: Math.round(base * factor),
      prev: Math.round(prev * 0.92),
    });
  }
  return points;
}

const PARTNER_NAMES = ["Alif Nasiya", "Anorbank", "Uzum Nasiya", "Iman", "Multicard", "Asia Alliance"];
const REGION_NAMES = ["Ташкент", "Самарканд", "Бухара", "Андижан", "Фергана", "Наманган", "Кашкадарья", "Хорезм"];
const CATEGORY_NAMES = ["Смартфоны", "Ноутбуки", "Телевизоры", "Бытовая техника", "Аудио", "Аксессуары", "Планшеты", "Игровые консоли"];

function makeBreakdown(names: string[], total: number, format: (v: number) => string): BreakdownRow[] {
  let remaining = total;
  return names.map((name, i) => {
    const isLast = i === names.length - 1;
    const share = isLast ? remaining / total : (0.08 + Math.random() * 0.22);
    const value = isLast ? remaining : Math.round(total * share);
    remaining -= value;
    if (remaining < 0) remaining = 0;
    const actualShare = Math.round((value / total) * 100);
    return {
      name,
      value,
      formattedValue: format(value),
      share: actualShare,
      delta: Math.round((Math.random() * 20 - 5) * 10) / 10,
    };
  }).sort((a, b) => b.value - a.value);
}

function formatNumber(v: number): string {
  return v.toLocaleString("ru-RU");
}

function formatCurrency(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} млрд UZS`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} млн UZS`;
  return `${v.toLocaleString("ru-RU")} UZS`;
}

function formatSeconds(v: number): string {
  return `${v} сек`;
}

function formatPercent(v: number): string {
  return `${v.toFixed(1)}%`;
}

const METRIC_CONFIGS: Record<string, MetricConfig> = {
  "total-clients": {
    label: "Всего клиентов",
    icon: Users,
    value: "124 580",
    rawValue: 124580,
    delta: 3.2,
    unit: "",
    chartLabel: "Клиенты",
    breakdownLabel: "Распределение по регионам",
    breakdownDimension: "Регион",
    breakdownData: makeBreakdown(REGION_NAMES, 124580, formatNumber),
    trendData: generateTrend(4150, 30, 3.2),
    relatedIds: ["active-clients", "applications-24h", "conversion"],
  },
  "applications-24h": {
    label: "Заявки за 24 часа",
    icon: FileText,
    value: "1 847",
    rawValue: 1847,
    delta: 12.4,
    unit: "",
    chartLabel: "Заявки",
    breakdownLabel: "Распределение по партнёрам",
    breakdownDimension: "Партнёр",
    breakdownData: makeBreakdown(PARTNER_NAMES, 1847, formatNumber),
    trendData: generateTrend(1640, 30, 12.4),
    relatedIds: ["applications-3h", "conversion", "total-amount"],
  },
  "applications-3h": {
    label: "Заявки за 3 часа",
    icon: Clock,
    value: "234",
    rawValue: 234,
    delta: -4.1,
    unit: "",
    chartLabel: "Заявки",
    breakdownLabel: "Распределение по партнёрам",
    breakdownDimension: "Партнёр",
    breakdownData: makeBreakdown(PARTNER_NAMES, 234, formatNumber),
    trendData: generateTrend(244, 30, -4.1),
    relatedIds: ["applications-24h", "conversion", "scoring-time"],
  },
  "conversion": {
    label: "Конверсия",
    icon: Target,
    value: "68.4%",
    rawValue: 68.4,
    delta: 2.1,
    unit: "%",
    chartLabel: "Конверсия, %",
    breakdownLabel: "Конверсия по партнёрам",
    breakdownDimension: "Партнёр",
    breakdownData: [
      { name: "Alif Nasiya", value: 74.2, formattedValue: "74.2%", share: 100, delta: 3.1 },
      { name: "Uzum Nasiya", value: 71.8, formattedValue: "71.8%", share: 97, delta: 1.5 },
      { name: "Anorbank", value: 68.9, formattedValue: "68.9%", share: 93, delta: -0.4 },
      { name: "Iman", value: 65.3, formattedValue: "65.3%", share: 88, delta: 4.2 },
      { name: "Multicard", value: 62.1, formattedValue: "62.1%", share: 84, delta: -1.8 },
      { name: "Asia Alliance", value: 58.7, formattedValue: "58.7%", share: 79, delta: 2.6 },
    ],
    trendData: generateTrend(67, 30, 2.1),
    relatedIds: ["applications-24h", "total-amount", "scoring-time"],
  },
  "total-amount": {
    label: "Сумма выданных рассрочек",
    icon: Wallet,
    value: "4.2 млрд UZS",
    rawValue: 4_200_000_000,
    delta: 18.7,
    unit: "UZS",
    chartLabel: "Сумма, млн UZS",
    breakdownLabel: "Распределение по партнёрам",
    breakdownDimension: "Партнёр",
    breakdownData: makeBreakdown(PARTNER_NAMES, 4_200_000_000, formatCurrency),
    trendData: generateTrend(140_000_000, 30, 18.7),
    relatedIds: ["average-check", "applications-24h", "conversion"],
  },
  "average-check": {
    label: "Средний чек",
    icon: Receipt,
    value: "2.27 млн UZS",
    rawValue: 2_270_000,
    delta: 5.3,
    unit: "UZS",
    chartLabel: "Средний чек, тыс. UZS",
    breakdownLabel: "Средний чек по категориям",
    breakdownDimension: "Категория",
    breakdownData: [
      { name: "Ноутбуки", value: 5_840_000, formattedValue: "5.84 млн UZS", share: 100, delta: 3.2 },
      { name: "Телевизоры", value: 4_120_000, formattedValue: "4.12 млн UZS", share: 71, delta: 1.1 },
      { name: "Игровые консоли", value: 3_650_000, formattedValue: "3.65 млн UZS", share: 63, delta: 8.4 },
      { name: "Смартфоны", value: 2_890_000, formattedValue: "2.89 млн UZS", share: 49, delta: 6.7 },
      { name: "Планшеты", value: 2_340_000, formattedValue: "2.34 млн UZS", share: 40, delta: -2.1 },
      { name: "Бытовая техника", value: 1_780_000, formattedValue: "1.78 млн UZS", share: 30, delta: 4.5 },
      { name: "Аудио", value: 980_000, formattedValue: "980 тыс. UZS", share: 17, delta: -1.3 },
      { name: "Аксессуары", value: 450_000, formattedValue: "450 тыс. UZS", share: 8, delta: 12.1 },
    ],
    trendData: generateTrend(2_150_000, 30, 5.3),
    relatedIds: ["total-amount", "applications-24h", "total-clients"],
  },
  "active-clients": {
    label: "Активные клиенты",
    icon: UserCheck,
    value: "38 921",
    rawValue: 38921,
    delta: 1.8,
    unit: "",
    chartLabel: "Активные клиенты",
    breakdownLabel: "Распределение по регионам",
    breakdownDimension: "Регион",
    breakdownData: makeBreakdown(REGION_NAMES, 38921, formatNumber),
    trendData: generateTrend(1297, 30, 1.8),
    relatedIds: ["total-clients", "conversion", "applications-24h"],
  },
  "scoring-time": {
    label: "Среднее время скоринга",
    icon: Timer,
    value: "47 сек",
    rawValue: 47,
    delta: -8.2,
    invertDelta: true,
    unit: "сек",
    chartLabel: "Время, сек",
    breakdownLabel: "Время скоринга по партнёрам",
    breakdownDimension: "Партнёр",
    breakdownData: [
      { name: "Alif Nasiya", value: 32, formattedValue: "32 сек", share: 100, delta: -12.4 },
      { name: "Uzum Nasiya", value: 38, formattedValue: "38 сек", share: 84, delta: -6.1 },
      { name: "Anorbank", value: 44, formattedValue: "44 сек", share: 73, delta: -9.8 },
      { name: "Iman", value: 51, formattedValue: "51 сек", share: 63, delta: -3.2 },
      { name: "Multicard", value: 58, formattedValue: "58 сек", share: 55, delta: -7.5 },
      { name: "Asia Alliance", value: 63, formattedValue: "63 сек", share: 51, delta: -11.0 },
    ],
    trendData: generateTrend(51, 30, -8.2),
    relatedIds: ["conversion", "applications-24h", "applications-3h"],
  },
};

const ALL_METRIC_IDS = Object.keys(METRIC_CONFIGS);

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "90 дней" },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toLocaleString("ru-RU")}
        </p>
      ))}
    </div>
  );
}

export function KpiDetailPage() {
  const { metricId } = useParams<{ metricId: string }>();
  const navigate = useNavigate();
  const [period, setPeriod] = React.useState("30d");

  const config = metricId ? METRIC_CONFIGS[metricId] : undefined;

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h2 className="text-2xl font-semibold">Метрика не найдена</h2>
        <p className="text-muted-foreground">Запрошенная метрика «{metricId}» не существует.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="size-4 mr-2" />
          Вернуться на дашборд
        </Button>
      </div>
    );
  }

  const Icon = config.icon;
  const isPositive = config.invertDelta ? config.delta < 0 : config.delta > 0;
  const DeltaIcon = isPositive ? TrendingUp : TrendingDown;
  const deltaColor = isPositive ? "text-emerald-600" : "text-red-500";

  const relatedMetrics = config.relatedIds
    .map((id) => ({ id, ...METRIC_CONFIGS[id] }))
    .filter(Boolean);

  const maxBreakdownValue = Math.max(...config.breakdownData.map((r) => r.value));

  return (
    <div className="flex flex-col gap-6">
      {/* Back nav */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="size-4" />
        Назад к дашборду
      </Link>

      {/* Hero card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center size-12 rounded-xl bg-[#FFD60A]/10 shrink-0">
                <Icon className="size-6 text-[#FFD60A]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-tight">
                  {config.label}
                </p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl sm:text-4xl font-bold tabular-nums">{config.value}</span>
                  <div className="flex items-center gap-1">
                    <DeltaIcon className={cn("size-4", deltaColor)} />
                    <span className={cn("text-sm font-semibold", deltaColor)}>
                      {config.delta > 0 ? "+" : ""}{config.delta}%
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">vs прошлый период</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <RefreshCw className="size-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main trend chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{config.chartLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] sm:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={config.trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="kpiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD60A" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#FFD60A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="prevGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9CA3AF" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#9CA3AF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="prev"
                  name="Прошлый период"
                  stroke="#9CA3AF"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="url(#prevGradient)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Текущий период"
                  stroke="#FFD60A"
                  strokeWidth={2.5}
                  fill="url(#kpiGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#FFD60A", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{config.breakdownLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>{config.breakdownDimension}</TableHead>
                  <TableHead className="text-right">Значение</TableHead>
                  <TableHead className="w-[200px]">Доля</TableHead>
                  <TableHead className="text-right">Изменение</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.breakdownData.map((row, i) => {
                  const rowPositive = config.invertDelta ? row.delta < 0 : row.delta > 0;
                  return (
                    <TableRow key={row.name}>
                      <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.formattedValue}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={row.share}
                            className="h-2 flex-1 [&>div]:bg-[#FFD60A]"
                          />
                          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                            {row.share}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "text-sm font-medium tabular-nums",
                          rowPositive ? "text-emerald-600" : "text-red-500"
                        )}>
                          {row.delta > 0 ? "+" : ""}{row.delta}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {config.breakdownData.map((row, i) => {
              const rowPositive = config.invertDelta ? row.delta < 0 : row.delta > 0;
              return (
                <div key={row.name} className="flex items-center gap-3 p-3 rounded-lg border">
                  <span className="text-sm text-muted-foreground tabular-nums w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{row.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={row.share} className="h-1.5 flex-1 [&>div]:bg-[#FFD60A]" />
                      <span className="text-xs text-muted-foreground tabular-nums">{row.share}%</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums">{row.formattedValue}</p>
                    <p className={cn("text-xs tabular-nums", rowPositive ? "text-emerald-600" : "text-red-500")}>
                      {row.delta > 0 ? "+" : ""}{row.delta}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Horizontal bar chart for breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Топ по {config.breakdownDimension.toLowerCase()}ам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={config.breakdownData.slice(0, 6)}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Значение" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {config.breakdownData.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#FFD60A" : i < 3 ? "#FBBF24" : "#E5E7EB"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Related metrics */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-tight mb-3">
          Связанные метрики
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {relatedMetrics.map((m) => {
            const RelIcon = m.icon;
            const relPositive = m.invertDelta ? m.delta < 0 : m.delta > 0;
            const RelDelta = relPositive ? TrendingUp : TrendingDown;
            return (
              <Link key={m.id} to={`/dashboard/${m.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <RelIcon className="size-4 text-gray-600" />
                    <span className="text-xs text-muted-foreground uppercase tracking-tight font-medium truncate">
                      {m.label}
                    </span>
                  </div>
                  <div className="text-xl font-bold tabular-nums">{m.value}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <RelDelta className={cn("size-3.5", relPositive ? "text-emerald-600" : "text-red-500")} />
                    <span className={cn("text-xs font-medium", relPositive ? "text-emerald-600" : "text-red-500")}>
                      {m.delta > 0 ? "+" : ""}{m.delta}%
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
