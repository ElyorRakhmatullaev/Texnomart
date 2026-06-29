"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Plus,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { Button } from "@texnomart/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@texnomart/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@texnomart/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@texnomart/ui/tooltip";
import { MobileListCard } from "@texnomart/shared/components/mobile-list-card";
import { PromoStatusBadge } from "../../../components/PromoStatusBadge";
import { OverdueTag } from "../../../components/OverdueTag";
import { RuDate } from "../../../components/RuDate";
import { useRole } from "../../role-context";
import { ShortCalendarTable } from "./ShortCalendarTable";
import { AggregatedIndicators } from "./AggregatedIndicators";
import { PlanMode } from "./PlanMode";
import {
  ALL,
  CalendarFilters,
  countActiveFilters,
  DEFAULT_FILTER_VALUES,
  hasDistributionFilter,
  type CalendarFilterValues,
} from "./CalendarFilters";
import {
  CAMPAIGNS,
  aggregateKmStatuses,
  formatPromoNo,
  getCategoryManager,
  getFillDeadline,
  getOverdueDays,
  getReportSendStatus,
  kmStatusDeepLink,
  type KmAggregate,
  type PromoCampaign,
} from "../../../lib/promo-mock-data";
import {
  buildCalendarCsv,
  buildPlanCsv,
  downloadCsv,
  exportStamp,
} from "../../../lib/promo-export";

// Only PLANNED campaigns appear in the short calendar (spec §4.1).
const PLANNED = CAMPAIGNS.filter((c) => c.planned);

/** Parse a yyyy-mm-dd input value to a local-tz Date (avoids the UTC day shift). */
function parseDate(value: string, endOfDay = false): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Inline «Готовность КМ» summary for mobile cards, e.g. "2 согласовано · 1 не заполнено". */
function readinessSummary(agg: KmAggregate): string {
  const parts: string[] = [];
  if (agg.acceptedKd) parts.push(`${agg.acceptedKd} согласовано`);
  if (agg.atKd) parts.push(`${agg.atKd} на согл. у КД`);
  if (agg.atSeniorKm) parts.push(`${agg.atSeniorKm} на согл. у ст. КМ`);
  if (agg.notFilled) parts.push(`${agg.notFilled} на корр./не заполнено`);
  if (agg.notParticipating) parts.push(`${agg.notParticipating} не участвует`);
  return parts.join(" · ") || "—";
}

export function ShortCalendarPage() {
  const navigate = useNavigate();
  const { currentRole } = useRole();
  const [mode, setMode] = React.useState<"calendar" | "plan">("calendar");
  const [filters, setFilters] =
    React.useState<CalendarFilterValues>(DEFAULT_FILTER_VALUES);
  const [hideCancelled, setHideCancelled] = React.useState(true);
  // «Распределение по категориям» collapsed by default — «используется не во всех акциях» (§2).
  const [distExpanded, setDistExpanded] = React.useState(false);
  // The whole filter block is collapsible (§7) — open by default, with the active-facet
  // count surfaced on the toggle so a collapsed block still signals it's filtering.
  const [filtersOpen, setFiltersOpen] = React.useState(true);
  const activeFilterCount = countActiveFilters(filters);

  const canCreatePlan = currentRole === "Директор маркетинга";

  function setFilter<K extends keyof CalendarFilterValues>(
    key: K,
    value: CalendarFilterValues[K]
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const filtered = React.useMemo(() => {
    const from = parseDate(filters.periodFrom);
    const to = parseDate(filters.periodTo, true);

    return PLANNED.filter((c) => {
      if (hideCancelled && c.cancelled) return false;
      // Операционные
      if (filters.promoIds.length > 0 && !filters.promoIds.includes(c.id))
        return false;
      if (filters.type !== ALL && c.type !== filters.type) return false;
      if (filters.km !== ALL && !c.participatingKmIds.includes(filters.km))
        return false;
      if (
        filters.kmStatus !== ALL &&
        !c.participatingKmIds.some((id) => c.kmStatuses[id] === filters.kmStatus)
      )
        return false;
      // Контрольные — период акции (overlap with the selected range)
      if (from && c.endDate < from) return false;
      if (to && c.startDate > to) return false;
      // Распределение по категориям
      const dist = c.categoryDistribution ?? [];
      if (
        filters.distWeekday !== ALL &&
        !dist.some((e) => String(e.date.getDay()) === filters.distWeekday)
      )
        return false;
      if (
        filters.distCategory !== ALL &&
        !dist.some((e) => e.category === filters.distCategory)
      )
        return false;
      if (
        filters.distKm !== ALL &&
        !dist.some((e) => e.responsibleKmId === filters.distKm)
      )
        return false;
      return true;
    });
  }, [filters, hideCancelled]);

  // A distribution filter implies the block is relevant — auto-expand so the
  // matching rows are visible (§1, §2).
  const effectiveExpanded = distExpanded || hasDistributionFilter(filters);

  // Plan-tab export rows = the same non-cancelled planned campaigns the plan shows
  // (session-added plan rows live inside PlanMode and aren't reflected here — mock).
  const planRows = React.useMemo(
    () =>
      PLANNED.filter((c) => !c.cancelled).map((c) => ({
        id: c.id,
        type: c.type,
        name: c.name,
        startDate: c.startDate,
        endDate: c.endDate,
      })),
    []
  );

  // Export by the CURRENT tab, respecting the active filters (§8). Mock: client-side
  // CSV; «Excel» reuses the CSV (opens in Excel); PDF isn't rendered in the prototype.
  function handleExport(format: string) {
    if (format === "pdf") {
      toast.info("Экспорт в PDF недоступен в прототипе — используйте CSV или Excel.");
      return;
    }
    const stamp = exportStamp();
    if (mode === "calendar") {
      downloadCsv(
        `краткий-промо-календарь_${stamp}.csv`,
        buildCalendarCsv(filtered)
      );
      toast.success(
        `Экспортировано: ${filtered.length} акций (с учётом фильтров)`
      );
    } else {
      downloadCsv(`план-акций_${stamp}.csv`, buildPlanCsv(planRows));
      toast.success(`Экспортировано: план акций (${planRows.length} строк)`);
    }
  }

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        title="Краткий промо-календарь"
        showCompare={false}
        showExport={false}
        subtitle={
          <span className="flex items-center gap-2">
            Найдено {filtered.length.toLocaleString("ru-RU")} акций
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px]">
                Внеплановые акции не отображаются в кратком календаре — они ведутся
                только в полном промо-календаре (§4.1).
              </TooltipContent>
            </Tooltip>
          </span>
        }
        actions={
          <>
            {/* Filter toggle beside the title (§7) — calendar tab only; carries the
                active-facet count + a «Очистить» when collapsed with active filters.
                Rendered BEFORE «Экспорт» so the order reads «Фильтры → Экспорт». */}
            {mode === "calendar" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 min-w-[140px] justify-between"
                  onClick={() => setFiltersOpen((o) => !o)}
                  aria-expanded={filtersOpen}
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="size-4" />
                    Фильтры
                    {activeFilterCount > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                        {activeFilterCount}
                      </span>
                    )}
                  </span>
                  {filtersOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
                {!filtersOpen && activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs text-gray-500"
                    onClick={() => setFilters(DEFAULT_FILTER_VALUES)}
                  >
                    <X className="mr-1 size-3" />
                    Очистить
                  </Button>
                )}
              </div>
            )}
            {/* Export rendered here (PageHeader's built-in export is disabled) so it
                sits AFTER «Фильтры». */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="h-9">
                  <Download className="mr-2 size-4" />
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
            {canCreatePlan && (
              <Button onClick={() => setMode("plan")}>
                <Plus className="size-4" />
                Создать план
              </Button>
            )}
          </>
        }
      />

      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <TabsList>
          <TabsTrigger value="calendar">Промо-календарь</TabsTrigger>
          <TabsTrigger value="plan">План акций</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          {/* Filter block (§7) — toggled by the «Фильтры» button beside the page
              title; the toggle carries the active-facet count. */}
          {filtersOpen && (
            <CalendarFilters
              values={filters}
              onChange={setFilter}
              onClear={() => setFilters(DEFAULT_FILTER_VALUES)}
              hideCancelled={hideCancelled}
              onHideCancelledChange={setHideCancelled}
              distExpanded={distExpanded}
              onDistExpandedChange={setDistExpanded}
              campaigns={PLANNED}
            />
          )}

          {/* Desktop: Pattern F frozen-column grid */}
          <div className="hidden md:block">
            <ShortCalendarTable
              campaigns={filtered}
              onRowClick={(id) => navigate(`/short-calendar/${id}`)}
              expanded={effectiveExpanded}
              kmStatusFilter={filters.kmStatus}
              onKmStatusClick={(campaignId, kmId, status) =>
                navigate(kmStatusDeepLink(campaignId, kmId, status))
              }
            />
          </div>

          {/* Mobile (Mode B): card list */}
          <div className="space-y-3 md:hidden">
            {filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Акции не найдены
              </p>
            ) : (
              filtered.map((c) => (
                <MobileCampaignCard
                  key={c.id}
                  campaign={c}
                  onClick={() => navigate(`/short-calendar/${c.id}`)}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="plan">
          <PlanMode campaigns={PLANNED.filter((c) => !c.cancelled)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MobileCampaignCard({
  campaign: c,
  onClick,
}: {
  campaign: PromoCampaign;
  onClick: () => void;
}) {
  const agg = aggregateKmStatuses(c);
  const deadline = getFillDeadline(c);
  const overdue = getOverdueDays(deadline);
  const report = getReportSendStatus(c);
  const kmNames = c.participatingKmIds
    .map((id) => getCategoryManager(id)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <MobileListCard
      onClick={onClick}
      title={c.name}
      subtitle={`№ ${formatPromoNo(c.id)} · ${c.type}`}
      status={<PromoStatusBadge status={c.status} />}
    >
      <div className="mt-2 space-y-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-1.5">
          <RuDate value={c.startDate} /> — <RuDate value={c.endDate} />
          <span>· срок КМ:</span>
          <RuDate value={deadline} />
          <OverdueTag days={overdue} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span>Отчёт смежным:</span>
          {report.sent ? (
            <span className="font-medium text-emerald-700">
              отправлено <RuDate value={report.sentAt!} /> · в.{report.versionNo}
            </span>
          ) : (
            <>
              <span>срок</span>
              <RuDate value={report.deadline} />
              <OverdueTag days={report.overdueDays} />
            </>
          )}
        </div>
        {kmNames && <div>КМ: {kmNames}</div>}
        <div className="font-medium text-gray-700">
          Готовность КМ: {readinessSummary(agg)}
        </div>
        <AggregatedIndicators aggregate={agg} />
      </div>
    </MobileListCard>
  );
}
