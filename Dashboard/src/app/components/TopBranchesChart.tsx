"use client";

import * as React from "react";
import { ChevronDown, Store } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@texnomart/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@texnomart/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@texnomart/ui/popover";
import { Skeleton } from "@texnomart/ui/skeleton";
import { cn } from "@texnomart/ui/utils";

type SortBy = "count" | "amount" | "conversion";

interface BranchData {
  id: string;
  name: string;
  city: string;
  value: number;
  applications: number;
  conversion: number;
}

const SORT_OPTIONS: Record<SortBy, string> = {
  count: "По количеству",
  amount: "По сумме",
  conversion: "По конверсии",
};

// Mock data
const mockBranches: BranchData[] = [
  { id: "1", name: "ТЦ Малика, Ташкент", city: "Ташкент", value: 482, applications: 248, conversion: 71 },
  { id: "2", name: "Чорсу, Ташкент", city: "Ташкент", value: 421, applications: 235, conversion: 68 },
  { id: "3", name: "Алайский, Ташкент", city: "Ташкент", value: 389, applications: 221, conversion: 74 },
  { id: "4", name: "Самарканд центр", city: "Самарканд", value: 367, applications: 198, conversion: 69 },
  { id: "5", name: "Бухара филиал", city: "Бухара", value: 312, applications: 176, conversion: 72 },
  { id: "6", name: "Андижан-1", city: "Андижан", value: 287, applications: 164, conversion: 65 },
  { id: "7", name: "Фергана-парк", city: "Фергана", value: 268, applications: 152, conversion: 70 },
  { id: "8", name: "Наманган центр", city: "Наманган", value: 241, applications: 141, conversion: 67 },
  { id: "9", name: "Карши главный", city: "Карши", value: 219, applications: 128, conversion: 73 },
  { id: "10", name: "Нукус-плаза", city: "Нукус", value: 187, applications: 112, conversion: 66 },
];

interface BranchRowProps {
  branch: BranchData;
  rank: number;
  maxValue: number;
  onClick: (id: string) => void;
}

function BranchRow({ branch, rank, maxValue, onClick }: BranchRowProps) {
  const percentage = (branch.value / maxValue) * 100;

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-primary text-black";
    if (rank === 2) return "bg-gray-900 text-white";
    if (rank === 3) return "bg-gray-700 text-white";
    return "bg-gray-100 text-black";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={() => onClick(branch.id)}
          className="flex items-center gap-3 group hover:bg-gray-100 rounded-lg p-2 -m-2 transition-colors cursor-pointer"
        >
          {/* Rank pill */}
          <div
            className={cn(
              "flex items-center justify-center size-6 rounded-full text-xs font-semibold shrink-0",
              getRankStyle(rank)
            )}
          >
            {rank}
          </div>

          {/* Branch name */}
          <div
            className="w-[200px] text-sm font-medium text-gray-700 group-hover:text-black truncate text-left transition-colors"
            title={branch.name}
          >
            {branch.name}
          </div>

          {/* Bar */}
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all group-hover:shadow-[0_2px_8px_rgba(255,214,10,0.3)]"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Value */}
          <div className="w-20 text-right text-sm font-semibold tabular-nums">
            {branch.value.toLocaleString("ru-RU")}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="center">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">Заявок:</span>
            <span className="font-semibold">{branch.applications}</span>
          </div>
          <span className="text-gray-300">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">Конверсия:</span>
            <span className="font-semibold">{branch.conversion}%</span>
          </div>
          <span className="text-gray-300">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">Регион:</span>
            <span className="font-semibold">{branch.city}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface TopBranchesChartProps {
  data?: BranchData[];
  sortBy?: SortBy;
  onSortChange?: (sortBy: SortBy) => void;
  loading?: boolean;
}

export function TopBranchesChart({
  data = mockBranches,
  sortBy = "count",
  onSortChange,
  loading = false,
}: TopBranchesChartProps) {
  const maxValue = data.length > 0 ? Math.max(...data.map((b) => b.value)) : 0;

  const handleBranchClick = (id: string) => {
    console.log(`Navigate to /branches/${id}`);
    // In a real app: router.push(`/branches/${id}`)
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-5 w-[200px]" />
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
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
              <CardTitle className="text-xl font-semibold">Топ-10 филиалов</CardTitle>
              <CardDescription className="text-xs text-gray-700 mt-1">
                По количеству оформленных рассрочек
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Store className="size-12 text-gray-400 mb-4" />
          <p className="text-base font-medium text-gray-900">
            Филиалы пока не оформили рассрочек
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">Топ-10 филиалов</CardTitle>
            <CardDescription className="text-xs text-gray-700 mt-1">
              По количеству оформленных рассрочек
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                {SORT_OPTIONS[sortBy]}
                <ChevronDown className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onSortChange?.("count")}
                className={cn(sortBy === "count" && "bg-accent")}
              >
                По количеству
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSortChange?.("amount")}
                className={cn(sortBy === "amount" && "bg-accent")}
              >
                По сумме
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSortChange?.("conversion")}
                className={cn(sortBy === "conversion" && "bg-accent")}
              >
                По конверсии
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 10).map((branch, index) => (
            <BranchRow
              key={branch.id}
              branch={branch}
              rank={index + 1}
              maxValue={maxValue}
              onClick={handleBranchClick}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
