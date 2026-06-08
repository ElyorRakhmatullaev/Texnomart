"use client";

import * as React from "react";
import {
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  FileText,
  Table as TableIcon,
  Handshake,
  Store,
  Wallet,
  Users,
  BarChart3,
  Plus,
  Calendar,
  Clock,
  Play,
  Pause,
  Trash2,
  Share2,
  BarChart2,
  LineChart as LineChartIcon,
  AreaChart,
  Eye,
} from "lucide-react";
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  LineChart,
  BarChart,
  AreaChart as RechartsAreaChart,
  TooltipProps,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@texnomart/ui/card";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
import { Switch } from "@texnomart/ui/switch";
import { Label } from "@texnomart/ui/label";
import { Separator } from "@texnomart/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@texnomart/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@texnomart/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@texnomart/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@texnomart/ui/popover";
import { Calendar as CalendarComponent } from "@texnomart/ui/calendar";
import { Checkbox } from "@texnomart/ui/checkbox";
import { Input } from "@texnomart/ui/input";
import { Skeleton } from "@texnomart/ui/skeleton";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@texnomart/ui/tooltip";
import { cn } from "@texnomart/ui/utils";
import {
  ANALYTICS_KPIS,
  PERIOD_OPTIONS,
  GROUPING_OPTIONS,
  GROUPING_DATA,
  COHORT_DATA,
  GENERATED_REPORTS,
  SCHEDULED_REPORTS,
  REPORT_TEMPLATES,
  REPORT_STATUS_CONFIG,
  FREQUENCY_LABELS,
  generateChartData,
  formatKpiValue,
  formatCompactCurrency,
  type AnalyticsKpi,
  type GroupingRow,
  type ChartPoint,
} from "@/lib/analytics-mock-data";

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  FileText, Table: TableIcon, Handshake, Store, Wallet, Users, BarChart3,
};

export function AnalyticsPage() {
  const [period, setPeriod] = React.useState("30d");
  const [compareEnabled, setCompareEnabled] = React.useState(false);
  const [grouping, setGrouping] = React.useState("partners");
  const [focusedKpi, setFocusedKpi] = React.useState("applications");
  const [chartType, setChartType] = React.useState<"line" | "bar" | "area">("line");
  const [granularity, setGranularity] = React.useState("days");
  const [cohortOpen, setCohortOpen] = React.useState(false);
  const [showAllRows, setShowAllRows] = React.useState(false);
  const [createReportOpen, setCreateReportOpen] = React.useState(false);
  const [reportStep, setReportStep] = React.useState(1);
  const [selectedTemplate, setSelectedTemplate] = React.useState("");
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date }>({});
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const chartData = React.useMemo(
    () => generateChartData(period, focusedKpi),
    [period, focusedKpi]
  );

  const groupingRows = GROUPING_DATA[grouping] || GROUPING_DATA.partners;
  const visibleRows = showAllRows ? groupingRows : groupingRows.slice(0, 10);
  const groupingLabel = GROUPING_OPTIONS.find((g) => g.value === grouping)?.label || "";
  const focusedKpiData = ANALYTICS_KPIS.find((k) => k.id === focusedKpi);

  const periodLabel = React.useMemo(() => {
    if (period === "custom" && dateRange.from && dateRange.to) {
      const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
      return `${fmt(dateRange.from)} – ${fmt(dateRange.to)}`;
    }
    const opt = PERIOD_OPTIONS.find((p) => p.value === period);
    return opt ? opt.label : "30 дней";
  }, [period, dateRange]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 pb-2">
        <div>
          <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-gray-900">Аналитика</h1>
          <p className="text-sm text-gray-600 mt-1">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="analytics-compare"
              checked={compareEnabled}
              onCheckedChange={setCompareEnabled}
            />
            <Label htmlFor="analytics-compare" className="text-sm cursor-pointer whitespace-nowrap">
              Сравнить с прошлым
            </Label>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-9">
                <Download className="size-4 mr-2" />
                Экспорт
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Excel (.xlsx)</DropdownMenuItem>
              <DropdownMenuItem>CSV</DropdownMenuItem>
              <DropdownMenuItem>PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" className="h-9 bg-[#FFD60A] text-black hover:bg-[#e6c109]" onClick={() => { setReportStep(1); setCreateReportOpen(true); }}>
            <Plus className="size-4 mr-2" />
            Создать отчёт
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      <ControlBar
        period={period}
        onPeriodChange={setPeriod}
        compareEnabled={compareEnabled}
        grouping={grouping}
        onGroupingChange={setGrouping}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ANALYTICS_KPIS.map((kpi) => (
          <KpiTile
            key={kpi.id}
            kpi={kpi}
            focused={focusedKpi === kpi.id}
            compareEnabled={compareEnabled}
            onClick={() => setFocusedKpi(kpi.id)}
          />
        ))}
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold">
              {focusedKpiData?.label || "Количество заявок"}
            </CardTitle>
            <div className="flex items-center gap-3">
              <Tabs value={granularity} onValueChange={setGranularity}>
                <TabsList className="h-8">
                  <TabsTrigger value="hours" className="text-xs px-3 h-7">По часам</TabsTrigger>
                  <TabsTrigger value="days" className="text-xs px-3 h-7">По дням</TabsTrigger>
                  <TabsTrigger value="weeks" className="text-xs px-3 h-7">По неделям</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="hidden sm:flex items-center border rounded-md">
                <Button
                  variant={chartType === "line" ? "default" : "ghost"}
                  size="sm"
                  className={cn("h-8 px-2 rounded-r-none", chartType === "line" && "bg-[#FFD60A] text-black hover:bg-[#e6c109]")}
                  onClick={() => setChartType("line")}
                >
                  <LineChartIcon className="size-4" />
                </Button>
                <Button
                  variant={chartType === "bar" ? "default" : "ghost"}
                  size="sm"
                  className={cn("h-8 px-2 rounded-none", chartType === "bar" && "bg-[#FFD60A] text-black hover:bg-[#e6c109]")}
                  onClick={() => setChartType("bar")}
                >
                  <BarChart2 className="size-4" />
                </Button>
                <Button
                  variant={chartType === "area" ? "default" : "ghost"}
                  size="sm"
                  className={cn("h-8 px-2 rounded-l-none", chartType === "area" && "bg-[#FFD60A] text-black hover:bg-[#e6c109]")}
                  onClick={() => setChartType("area")}
                >
                  <AreaChart className="size-4" />
                </Button>
              </div>

              {/* Mobile chart type dropdown */}
              <div className="sm:hidden">
                <Select value={chartType} onValueChange={(v) => setChartType(v as "line" | "bar" | "area")}>
                  <SelectTrigger className="h-8 w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Линия</SelectItem>
                    <SelectItem value="bar">Столбцы</SelectItem>
                    <SelectItem value="area">Область</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MainChart
            data={chartData}
            chartType={chartType}
            compareEnabled={compareEnabled}
            kpiFormat={focusedKpiData?.format || "number"}
          />
        </CardContent>
      </Card>

      {/* Grouping Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Разбивка: {groupingLabel}
            </CardTitle>
            {groupingRows.length > 10 && (
              <Button variant="ghost" size="sm" onClick={() => setShowAllRows(!showAllRows)}>
                {showAllRows ? "Свернуть" : "Показать все"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Название</TableHead>
                  <TableHead className="text-right">Заявок</TableHead>
                  <TableHead className="text-right w-[160px]">Конверсия</TableHead>
                  <TableHead className="text-right">Ср. время</TableHead>
                  <TableHead className="text-right">Сумма выдано</TableHead>
                  <TableHead className="text-right">Доля</TableHead>
                  {compareEnabled && <TableHead className="text-right">Δ период</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => (
                  <GroupingTableRow key={row.id} row={row} compareEnabled={compareEnabled} />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {visibleRows.map((row) => (
              <GroupingMobileCard key={row.id} row={row} compareEnabled={compareEnabled} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cohort Analysis */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setCohortOpen(!cohortOpen)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Когортный анализ</CardTitle>
            {cohortOpen ? <ChevronDown className="size-5 text-gray-500" /> : <ChevronRight className="size-5 text-gray-500" />}
          </div>
        </CardHeader>
        {cohortOpen && (
          <CardContent>
            <CohortHeatmap />
          </CardContent>
        )}
      </Card>

      {/* Reports Panel */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold">Отчёты</CardTitle>
            <Button size="sm" className="bg-[#FFD60A] text-black hover:bg-[#e6c109]" onClick={() => { setReportStep(1); setCreateReportOpen(true); }}>
              <Plus className="size-4 mr-2" />
              Создать отчёт
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ReportsPanel />
        </CardContent>
      </Card>

      {/* Create Report Modal */}
      <CreateReportDialog
        open={createReportOpen}
        onOpenChange={setCreateReportOpen}
        step={reportStep}
        onStepChange={setReportStep}
        selectedTemplate={selectedTemplate}
        onTemplateChange={setSelectedTemplate}
      />
    </div>
  );
}

/* ─── Control Bar ─── */

function ControlBar({
  period,
  onPeriodChange,
  compareEnabled,
  grouping,
  onGroupingChange,
  dateRange,
  onDateRangeChange,
  isRefreshing,
  onRefresh,
}: {
  period: string;
  onPeriodChange: (v: string) => void;
  compareEnabled: boolean;
  grouping: string;
  onGroupingChange: (v: string) => void;
  dateRange: { from?: Date; to?: Date };
  onDateRangeChange: (v: { from?: Date; to?: Date }) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);

  const handlePeriodChange = (value: string) => {
    if (value === "custom") {
      setDatePickerOpen(true);
    } else {
      onPeriodChange(value);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
      {/* Period */}
      <div className="flex-1 w-full md:w-auto">
        <p className="text-xs text-gray-500 mb-1.5 font-medium">Период</p>
        {/* Desktop: segmented buttons */}
        <div className="hidden sm:flex flex-wrap gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <React.Fragment key={opt.value}>
              {opt.value === "custom" ? (
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={period === "custom" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-8 text-xs",
                        period === "custom" && "bg-[#FFD60A] text-black hover:bg-[#e6c109] border-[#FFD60A]"
                      )}
                      onClick={() => setDatePickerOpen(true)}
                    >
                      <Calendar className="size-3.5 mr-1" />
                      {period === "custom" && dateRange.from
                        ? `${dateRange.from.getDate()}.${dateRange.from.getMonth() + 1} – ${dateRange.to?.getDate()}.${dateRange.to?.getMonth()! + 1}`
                        : opt.label}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                      onSelect={(range: any) => {
                        if (range?.from && range?.to) {
                          onDateRangeChange({ from: range.from, to: range.to });
                          onPeriodChange("custom");
                          setDatePickerOpen(false);
                        } else if (range?.from) {
                          onDateRangeChange({ from: range.from });
                        }
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <Button
                  variant={period === opt.value ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 text-xs",
                    period === opt.value && "bg-[#FFD60A] text-black hover:bg-[#e6c109] border-[#FFD60A]"
                  )}
                  onClick={() => handlePeriodChange(opt.value)}
                >
                  {opt.label}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>
        {/* Mobile: Select dropdown */}
        <div className="sm:hidden">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Период" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.filter(o => o.value !== "custom").map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator orientation="vertical" className="hidden md:block h-10" />

      {/* Comparison info */}
      {compareEnabled && (
        <>
          <div className="shrink-0">
            <p className="text-xs text-gray-500 mb-1.5 font-medium">Сравнение</p>
            <p className="text-sm text-gray-700">
              vs прошлый период · <span className="text-green-600 font-medium">+12.4%</span> общая динамика
            </p>
          </div>
          <Separator orientation="vertical" className="hidden md:block h-10" />
        </>
      )}

      {/* Grouping */}
      <div className="shrink-0 w-full md:w-auto">
        <p className="text-xs text-gray-500 mb-1.5 font-medium">Группировка</p>
        <Select value={grouping} onValueChange={onGroupingChange}>
          <SelectTrigger className="h-9 w-full md:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GROUPING_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-9 shrink-0"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
      </Button>
    </div>
  );
}

/* ─── KPI Tile ─── */

function KpiTile({
  kpi,
  focused,
  compareEnabled,
  onClick,
}: {
  kpi: AnalyticsKpi;
  focused: boolean;
  compareEnabled: boolean;
  onClick: () => void;
}) {
  const isPositive = kpi.invertDelta ? kpi.delta < 0 : kpi.delta > 0;
  const displayValue = kpi.format === "currency"
    ? formatCompactCurrency(kpi.value)
    : formatKpiValue(kpi.value, kpi.format);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        focused && "ring-2 ring-[#FFD60A] shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <p className="text-xs text-gray-500 font-medium mb-1 truncate">{kpi.label}</p>
        <p className="text-xl font-bold tabular-nums">{displayValue}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium",
            isPositive ? "text-green-600" : "text-red-500"
          )}>
            {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {kpi.delta > 0 ? "+" : ""}{kpi.delta}%
          </span>
          {compareEnabled && (
            <span className="text-xs text-gray-400 tabular-nums">
              vs {kpi.format === "currency" ? formatCompactCurrency(kpi.previousValue) : formatKpiValue(kpi.previousValue, kpi.format)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main Chart ─── */

function MainChart({
  data,
  chartType,
  compareEnabled,
  kpiFormat,
}: {
  data: ChartPoint[];
  chartType: "line" | "bar" | "area";
  compareEnabled: boolean;
  kpiFormat: string;
}) {
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="tabular-nums" style={{ color: entry.color }}>
            {entry.name}: {entry.value?.toLocaleString("ru-RU")}
          </p>
        ))}
      </div>
    );
  };

  const commonProps = {
    data,
    margin: { top: 5, right: 20, left: 10, bottom: 5 },
  };

  const renderChart = () => {
    if (chartType === "bar") {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Текущий" fill="#FFD60A" radius={[4, 4, 0, 0]} />
          {compareEnabled && <Bar dataKey="comparison" name="Прошлый" fill="#d1d5db" radius={[4, 4, 0, 0]} />}
          {data.length > 30 && <Brush dataKey="date" height={30} stroke="#FFD60A" className="hidden sm:block" />}
        </BarChart>
      );
    }

    if (chartType === "area") {
      return (
        <RechartsAreaChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <defs>
            <linearGradient id="gradientValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFD60A" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FFD60A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" name="Текущий" stroke="#FFD60A" fill="url(#gradientValue)" strokeWidth={2} />
          {compareEnabled && <Area type="monotone" dataKey="comparison" name="Прошлый" stroke="#9ca3af" fill="none" strokeWidth={1.5} strokeDasharray="5 5" />}
          {data.length > 30 && <Brush dataKey="date" height={30} stroke="#FFD60A" className="hidden sm:block" />}
        </RechartsAreaChart>
      );
    }

    return (
      <LineChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={60} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="value" name="Текущий" stroke="#FFD60A" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#FFD60A" }} />
        {compareEnabled && <Line type="monotone" dataKey="comparison" name="Прошлый" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />}
        {data.length > 30 && <Brush dataKey="date" height={30} stroke="#FFD60A" className="hidden sm:block" />}
      </LineChart>
    );
  };

  return (
    <div className="h-[240px] sm:h-[320px] lg:h-[480px]">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Grouping Table Row (Desktop) ─── */

function GroupingTableRow({ row, compareEnabled }: { row: GroupingRow; compareEnabled: boolean }) {
  return (
    <TableRow className="hover:bg-gray-50 cursor-pointer">
      <TableCell className="font-medium">{row.name}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="tabular-nums">{row.applications.toLocaleString("ru-RU")}</span>
          <MiniSparkline data={row.sparklineData} />
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="tabular-nums">{row.conversion}%</span>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FFD60A] rounded-full"
              style={{ width: `${row.conversion}%` }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">{row.avgTime} сек</TableCell>
      <TableCell className="text-right tabular-nums">{formatCompactCurrency(row.totalIssued)}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="tabular-nums">{row.sharePercent}%</span>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-400 rounded-full"
              style={{ width: `${row.sharePercent}%` }}
            />
          </div>
        </div>
      </TableCell>
      {compareEnabled && (
        <TableCell className="text-right">
          <span className={cn(
            "tabular-nums text-sm font-medium",
            row.deltaPercent > 0 ? "text-green-600" : row.deltaPercent < 0 ? "text-red-500" : "text-gray-500"
          )}>
            {row.deltaPercent > 0 ? "+" : ""}{row.deltaPercent}%
          </span>
        </TableCell>
      )}
    </TableRow>
  );
}

/* ─── Grouping Mobile Card ─── */

function GroupingMobileCard({ row, compareEnabled }: { row: GroupingRow; compareEnabled: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm">{row.name}</span>
          {compareEnabled && (
            <span className={cn(
              "text-xs font-medium",
              row.deltaPercent > 0 ? "text-green-600" : row.deltaPercent < 0 ? "text-red-500" : "text-gray-500"
            )}>
              {row.deltaPercent > 0 ? "+" : ""}{row.deltaPercent}%
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-gray-500">Заявок</p>
            <p className="font-medium tabular-nums">{row.applications.toLocaleString("ru-RU")}</p>
          </div>
          <div>
            <p className="text-gray-500">Конверсия</p>
            <p className="font-medium tabular-nums">{row.conversion}%</p>
          </div>
          <div>
            <p className="text-gray-500">Выдано</p>
            <p className="font-medium tabular-nums">{formatCompactCurrency(row.totalIssued)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Mini Sparkline ─── */

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 16;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke="#FFD60A"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Cohort Heatmap ─── */

function CohortHeatmap() {
  const maxMonths = Math.max(...COHORT_DATA.map((r) => r.cells.length));
  const monthHeaders = Array.from({ length: maxMonths }, (_, i) => `M${i}`);

  const getColor = (retention: number): string => {
    if (retention >= 90) return "bg-yellow-500 text-white";
    if (retention >= 70) return "bg-yellow-400 text-black";
    if (retention >= 50) return "bg-yellow-300 text-black";
    if (retention >= 35) return "bg-yellow-200 text-black";
    if (retention >= 20) return "bg-yellow-100 text-gray-800";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white text-left p-2 font-medium text-gray-600 min-w-[100px]">Когорта</th>
            <th className="p-2 text-right font-medium text-gray-600 min-w-[70px]">Всего</th>
            {monthHeaders.map((h) => (
              <th key={h} className="p-2 text-center font-medium text-gray-600 min-w-[56px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COHORT_DATA.map((row) => (
            <tr key={row.cohortMonth}>
              <td className="sticky left-0 bg-white p-2 font-medium whitespace-nowrap">{row.cohortMonth}</td>
              <td className="p-2 text-right tabular-nums">{row.totalUsers.toLocaleString("ru-RU")}</td>
              {monthHeaders.map((_, i) => {
                const cell = row.cells[i];
                if (!cell) return <td key={i} className="p-2" />;
                return (
                  <TooltipProvider key={i}>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <td className="p-1">
                          <div className={cn(
                            "rounded px-2 py-1.5 text-center tabular-nums font-medium",
                            getColor(cell.retention)
                          )}>
                            {cell.retention.toFixed(1)}%
                          </div>
                        </td>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{cell.count.toLocaleString("ru-RU")} пользователей ({cell.retention.toFixed(1)}%)</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Reports Panel ─── */

function ReportsPanel() {
  return (
    <Tabs defaultValue="generated">
      <TabsList className="mb-4">
        <TabsTrigger value="generated">Сгенерированные</TabsTrigger>
        <TabsTrigger value="schedule">Расписание</TabsTrigger>
        <TabsTrigger value="templates">Шаблоны</TabsTrigger>
      </TabsList>

      <TabsContent value="generated">
        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Период</TableHead>
                <TableHead>Автор</TableHead>
                <TableHead>Создан</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Размер</TableHead>
                <TableHead className="w-[56px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {GENERATED_REPORTS.map((report) => {
                const statusConfig = REPORT_STATUS_CONFIG[report.status];
                return (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell className="text-gray-600">{report.type}</TableCell>
                    <TableCell className="text-gray-600 tabular-nums">{report.period}</TableCell>
                    <TableCell className="text-gray-600">{report.author}</TableCell>
                    <TableCell className="text-gray-600 tabular-nums">{report.createdAt}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", statusConfig.className)}>{statusConfig.label}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 tabular-nums">{report.size}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronDown className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {report.status === "ready" && (
                            <>
                              <DropdownMenuItem><Download className="size-4 mr-2" />Скачать</DropdownMenuItem>
                              <DropdownMenuItem><Share2 className="size-4 mr-2" />Поделиться</DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem className="text-red-600"><Trash2 className="size-4 mr-2" />Удалить</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden space-y-3">
          {GENERATED_REPORTS.map((report) => {
            const statusConfig = REPORT_STATUS_CONFIG[report.status];
            return (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-medium text-sm">{report.name}</span>
                    <Badge className={cn("text-xs shrink-0", statusConfig.className)}>{statusConfig.label}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Тип: {report.type}</div>
                    <div>Размер: {report.size}</div>
                    <div>Период: {report.period}</div>
                    <div>{report.createdAt}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="schedule">
        <div className="space-y-3">
          {SCHEDULED_REPORTS.map((sched) => (
            <Card key={sched.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{sched.name}</span>
                      <Badge variant="outline" className="text-xs">{FREQUENCY_LABELS[sched.frequency]}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {sched.recipients.join(", ")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        Следующий: {sched.nextRun}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={sched.enabled} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ChevronDown className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="size-4 mr-2" />Редактировать</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600"><Trash2 className="size-4 mr-2" />Удалить</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="templates">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {REPORT_TEMPLATES.map((tpl) => {
            const IconComp = TEMPLATE_ICONS[tpl.icon] || FileText;
            return (
              <Card key={tpl.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center">
                    <IconComp className="size-6 text-yellow-700" />
                  </div>
                  <div>
                    <p className="font-medium text-sm mb-1">{tpl.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{tpl.description}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-auto">
                    Сгенерировать
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>
    </Tabs>
  );
}

/* ─── Create Report Dialog ─── */

function CreateReportDialog({
  open,
  onOpenChange,
  step,
  onStepChange,
  selectedTemplate,
  onTemplateChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  step: number;
  onStepChange: (v: number) => void;
  selectedTemplate: string;
  onTemplateChange: (v: string) => void;
}) {
  const [reportPeriod, setReportPeriod] = React.useState("30d");
  const [reportGrouping, setReportGrouping] = React.useState("partners");
  const [reportFormat, setReportFormat] = React.useState("xlsx");
  const [scheduleEnabled, setScheduleEnabled] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreate = () => {
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      onOpenChange(false);
      onStepChange(1);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать отчёт</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step >= s ? "bg-[#FFD60A] text-black" : "bg-gray-200 text-gray-500"
              )}>
                {s}
              </div>
              {s < 3 && <div className={cn("flex-1 h-0.5", step > s ? "bg-[#FFD60A]" : "bg-gray-200")} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Template selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {REPORT_TEMPLATES.map((tpl) => {
              const IconComp = TEMPLATE_ICONS[tpl.icon] || FileText;
              return (
                <div
                  key={tpl.id}
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-all hover:border-[#FFD60A]",
                    selectedTemplate === tpl.id && "border-[#FFD60A] ring-1 ring-[#FFD60A] bg-yellow-50/50"
                  )}
                  onClick={() => onTemplateChange(tpl.id)}
                >
                  <div className="flex items-start gap-3">
                    <IconComp className="size-5 text-gray-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{tpl.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{tpl.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Step 2: Parameters */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-1.5 block">Период</Label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.filter(o => o.value !== "custom").map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Группировка</Label>
              <Select value={reportGrouping} onValueChange={setReportGrouping}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUPING_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Фильтр по партнёрам</Label>
              <p className="text-xs text-gray-500">Все партнёры включены по умолчанию</p>
            </div>
          </div>
        )}

        {/* Step 3: Format & delivery */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-1.5 block">Формат</Label>
              <div className="flex gap-2">
                {["xlsx", "csv", "pdf"].map((fmt) => (
                  <Button
                    key={fmt}
                    variant={reportFormat === fmt ? "default" : "outline"}
                    size="sm"
                    className={cn(reportFormat === fmt && "bg-[#FFD60A] text-black hover:bg-[#e6c109]")}
                    onClick={() => setReportFormat(fmt)}
                  >
                    {fmt.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Email получателей</Label>
              <Input placeholder="user@texnomart.uz" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
              <Label className="text-sm cursor-pointer">Запланировать регулярную генерацию</Label>
            </div>
            {scheduleEnabled && (
              <div>
                <Label className="text-sm mb-1.5 block">Частота</Label>
                <Select defaultValue="weekly">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Ежедневно</SelectItem>
                    <SelectItem value="weekly">Еженедельно</SelectItem>
                    <SelectItem value="monthly">Ежемесячно</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step > 1 && (
            <Button variant="ghost" onClick={() => onStepChange(step - 1)}>Назад</Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Отмена</Button>
          {step < 3 ? (
            <Button
              className="bg-[#FFD60A] text-black hover:bg-[#e6c109]"
              disabled={step === 1 && !selectedTemplate}
              onClick={() => onStepChange(step + 1)}
            >
              Далее
            </Button>
          ) : (
            <Button
              className="bg-[#FFD60A] text-black hover:bg-[#e6c109]"
              onClick={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? "Создание..." : "Создать"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
