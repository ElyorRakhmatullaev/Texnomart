"use client";

import * as React from "react";
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
  LucideIcon,
} from "lucide-react";
import { LineChart, Line, Area, ComposedChart, ResponsiveContainer } from "recharts";
import { Link } from "react-router";
import { Card } from "@texnomart/ui/card";
import { Skeleton } from "@texnomart/ui/skeleton";
import { cn } from "@texnomart/ui/utils";

interface KpiMetric {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  delta: number;
  invertDelta?: boolean; // For metrics where decrease is good (e.g., scoring time)
  sparklineData: Array<{ value: number }>;
}

// Generate realistic sparkline data trending in the direction of delta
function generateSparklineData(delta: number, baseValue: number = 100): Array<{ value: number }> {
  const points = 20;
  const data: Array<{ value: number }> = [];
  const trend = delta > 0 ? 1 : -1;
  const volatility = 0.15;

  let current = baseValue * (1 - Math.abs(delta) / 100 / 2);

  for (let i = 0; i < points; i++) {
    const randomness = (Math.random() - 0.5) * 2 * volatility * baseValue;
    const trendComponent = (trend * Math.abs(delta) / 100 * baseValue / points) * (i / points);
    current = current + trendComponent + randomness;
    data.push({ value: Math.max(0, current) });
  }

  return data;
}

const kpiMetrics: KpiMetric[] = [
  {
    id: "total-clients",
    label: "Всего клиентов",
    icon: Users,
    value: "124 580",
    delta: 3.2,
    sparklineData: generateSparklineData(3.2, 121000),
  },
  {
    id: "applications-24h",
    label: "Заявки за 24 часа",
    icon: FileText,
    value: "1 847",
    delta: 12.4,
    sparklineData: generateSparklineData(12.4, 1640),
  },
  {
    id: "applications-3h",
    label: "Заявки за 3 часа",
    icon: Clock,
    value: "234",
    delta: -4.1,
    sparklineData: generateSparklineData(-4.1, 244),
  },
  {
    id: "conversion",
    label: "Конверсия",
    icon: Target,
    value: "68.4%",
    delta: 2.1,
    sparklineData: generateSparklineData(2.1, 67),
  },
  {
    id: "total-amount",
    label: "Сумма выданных рассрочек",
    icon: Wallet,
    value: "4.2 млрд UZS",
    delta: 18.7,
    sparklineData: generateSparklineData(18.7, 3540),
  },
  {
    id: "average-check",
    label: "Средний чек",
    icon: Receipt,
    value: "2.27 млн UZS",
    delta: 5.3,
    sparklineData: generateSparklineData(5.3, 2150),
  },
  {
    id: "active-clients",
    label: "Активные клиенты",
    icon: UserCheck,
    value: "38 921",
    delta: 1.8,
    sparklineData: generateSparklineData(1.8, 38220),
  },
  {
    id: "scoring-time",
    label: "Среднее время скоринга",
    icon: Timer,
    value: "47 сек",
    delta: -8.2,
    invertDelta: true, // Decrease is good for scoring time
    sparklineData: generateSparklineData(-8.2, 51),
  },
];

interface KpiCardProps {
  metric: KpiMetric;
  loading?: boolean;
  showSparkline?: boolean;
}

function KpiCard({ metric, loading, showSparkline = true }: KpiCardProps) {
  const isPositive = metric.invertDelta ? metric.delta < 0 : metric.delta > 0;
  const DeltaIcon = isPositive ? TrendingUp : TrendingDown;
  const deltaColor = isPositive ? "text-[#10B981]" : "text-[#EF4444]";
  const sparklineColor = "#FFD60A";

  const ariaLabel = `${metric.label}: ${metric.value}, ${isPositive ? "рост" : "снижение"} ${Math.abs(metric.delta).toLocaleString("ru-RU")} процента`;

  if (loading) {
    return (
      <Card className="p-5 shadow-sm">
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-[60px] w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Link
      to={`/dashboard/${metric.id}`}
      aria-label={ariaLabel}
      data-kpi-card
      className="block group"
    >
      <Card className="p-5 sm:p-4 shadow-sm cursor-pointer transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 h-full">
        <div className="space-y-3">
          {/* Top row: icon + label */}
          <div className="flex items-center gap-2">
            <metric.icon className="size-5 text-gray-700 shrink-0" />
            <span className="text-xs leading-4 text-gray-700 uppercase tracking-tight font-medium">
              {metric.label}
            </span>
          </div>

          {/* Big value */}
          <div className="text-lg md:text-[1.75rem] leading-6 md:leading-9 font-bold tabular-nums text-black">
            {metric.value}
          </div>

          {/* Delta row */}
          <div className="flex items-center gap-1.5">
            <DeltaIcon className={cn("size-4", deltaColor)} aria-hidden="true" />
            <span className={cn("text-sm font-medium", deltaColor)}>
              {metric.delta > 0 ? "+" : ""}
              {metric.delta.toLocaleString("ru-RU")}%
            </span>
            <span className="text-xs text-gray-600 hidden sm:inline">vs прошлый период</span>
          </div>

          {/* Sparkline — only shown when compare mode is active */}
          {showSparkline && (
            <div className="h-[60px] w-full -mx-1 min-h-[60px]">
              <ResponsiveContainer width="100%" height={60}>
                <ComposedChart data={metric.sparklineData}>
                  <defs>
                    <linearGradient id={`gradient-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={sparklineColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="none"
                    fill={`url(#gradient-${metric.id})`}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={sparklineColor}
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, index, key } = props;
                      if (index === metric.sparklineData.length - 1) {
                        return (
                          <circle
                            key={key || `dot-${index}`}
                            cx={cx}
                            cy={cy}
                            r={3}
                            fill={sparklineColor}
                            stroke="#fff"
                            strokeWidth={1.5}
                          />
                        );
                      }
                      return null;
                    }}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

interface KpiStripProps {
  loading?: boolean;
  showSparklines?: boolean;
}

export function KpiStrip({ loading = false, showSparklines = false }: KpiStripProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      {kpiMetrics.map((metric) => (
        <KpiCard key={metric.id} metric={metric} loading={loading} showSparkline={showSparklines} />
      ))}
    </div>
  );
}
