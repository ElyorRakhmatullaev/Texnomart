"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@texnomart/ui/card";
import { Skeleton } from "@texnomart/ui/skeleton";
import { cn } from "@texnomart/ui/utils";
import { MOCK_PARTNER_DISTRIBUTION } from "@/lib/mock-data";

function ActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 3}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}

interface PartnerDistributionDonutProps {
  loading?: boolean;
}

export function PartnerDistributionDonut({ loading = false }: PartnerDistributionDonutProps) {
  const data = MOCK_PARTNER_DISTRIBUTION;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-7 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full rounded-full" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">Распределение по партнёрам</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                activeIndex={activeIndex !== null ? activeIndex : undefined}
                activeShape={ActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={activeIndex !== null && activeIndex !== index ? 0.4 : 1}
                    style={{ transition: "opacity 150ms" }}
                    cursor="pointer"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-1">
            {data.map((item, index) => (
              <div
                key={item.name}
                className={cn(
                  "flex items-center justify-between text-xs rounded-md px-2 py-1.5 cursor-pointer transition-colors",
                  activeIndex === index ? "bg-gray-100" : "hover:bg-gray-50"
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="size-3 rounded-full shrink-0 transition-transform"
                    style={{
                      backgroundColor: item.color,
                      transform: activeIndex === index ? "scale(1.3)" : "scale(1)",
                    }}
                  />
                  <span className={cn(
                    "transition-colors",
                    activeIndex === index ? "text-black font-medium" : "text-gray-700"
                  )}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums">{item.value}</span>
                  <span className={cn(
                    "w-10 text-right tabular-nums transition-colors",
                    activeIndex === index ? "text-black font-medium" : "text-gray-600"
                  )}>
                    {((item.value / total) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
