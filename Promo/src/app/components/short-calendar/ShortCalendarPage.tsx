"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Plus,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { Button, buttonVariants } from "@texnomart/ui/button";
import { cn } from "@texnomart/ui/utils";
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
import { useRole, type PromoRole } from "../../role-context";
import { useCurrentUser } from "../../current-user-context";
import { getActiveSubstitution } from "../../../lib/kd-substitution-store";
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
  getReportSendStatus,
  isPlanApprovedByDirectors,
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
import {
  getPlanState,
  reviveOverrides,
  reviveRows,
} from "../../../lib/plan-store";

// Only PLANNED campaigns appear in the short calendar (spec §4.1).
const PLANNED = CAMPAIGNS.filter((c) => c.planned);

// «Срок отчёта» / «Отправка смежным отделам» (columns + filter) are visible ONLY to
// these roles, plus the active «уполномоченное лицо КД» (checked separately below) —
// tracker V2-12, «строго по ТЗ». Администратор is included deliberately, mirroring the
// app-wide god-mode convention (see permissions.ts ACCESS_MATRIX).
const REPORT_SEND_ROLES: PromoRole[] = [
  "Коммерческий директор",
  "Сотрудник маркетинга",
  "Администратор",
];

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
  const { currentUser } = useCurrentUser();
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
  // №5 — a Категорийный менеджер sees a planned campaign only AFTER its plan is
  // approved by all responsible directors; other roles see the full plan.
  const isKm = currentRole === "Категорийный менеджер (КМ)";

  // «Срок отчёта» + «Отправка смежным отделам» (columns, filter, mobile card, CSV) —
  // gated per V2-12: КД / Сотрудник маркетинга / Администратор by role, or the current
  // logged-in user acting as the active «уполномоченное лицо КД».
  const canSeeReportSend = React.useMemo(() => {
    if (REPORT_SEND_ROLES.includes(currentRole)) return true;
    const sub = getActiveSubstitution();
    return !!sub && sub.substituteUserId === currentUser?.id;
  }, [currentRole, currentUser]);

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
      // №5 — КМ видит только полностью утверждённые руководителями планы.
      if (isKm && !isPlanApprovedByDirectors(c)) return false;
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
      // Отправка смежным отделам (§V2-12) — gated: skip even if somehow set while
      // the facet is hidden for the current role/substitution (defence-in-depth).
      if (canSeeReportSend && filters.reportSend !== ALL) {
        const sent = getReportSendStatus(c).sent;
        if (filters.reportSend === "sent" && !sent) return false;
        if (filters.reportSend === "not-sent" && sent) return false;
      }
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
  }, [filters, hideCancelled, isKm, canSeeReportSend]);

  // A distribution filter implies the block is relevant — auto-expand so the
  // matching rows are visible (§1, §2).
  const effectiveExpanded = distExpanded || hasDistributionFilter(filters);

  // Plan-tab export: seed rows + the persisted plan lifecycle (`promo:plan-state`) —
  // created drafts, edits and deletions are reflected, so the CSV matches the tab
  // («7-я часть» §9.5). Read fresh at export time (not memoized).
  function effectivePlanRows() {
    const base = PLANNED.filter((c) => !c.cancelled).map((c) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      startDate: c.startDate,
      endDate: c.endDate,
    }));
    const state = getPlanState();
    if (!state) return base;
    const overrides = reviveOverrides(state.overrides);
    const deleted = new Set(state.deletedIds);
    return [...base, ...reviveRows(state.extraRows)]
      .filter((r) => !deleted.has(r.id))
      .map((r) => ({ ...r, ...overrides[r.id] }));
  }

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
        buildCalendarCsv(filtered, { includeReportColumns: canSeeReportSend })
      );
      toast.success(
        `Экспортировано: ${filtered.length} акций (с учётом фильтров)`
      );
    } else {
      const rows = effectivePlanRows();
      downloadCsv(`план-акций_${stamp}.csv`, buildPlanCsv(rows));
      toast.success(`Экспортировано: план акций (${rows.length} строк)`);
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
                    className="h-9 text-xs text-gray-500 dark:text-gray-400"
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
              {/* R29.3: native <button> under asChild — the shared Button has no
                  forwardRef, so Radix couldn't measure the anchor and the menu
                  portalled off-screen («Экспорт» looked dead; see tasks/lessons.md). */}
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "h-9"
                  )}
                >
                  <Download className="mr-2 size-4" />
                  Экспорт
                </button>
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
              showReportSend={canSeeReportSend}
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
              distFilter={{
                weekday: filters.distWeekday,
                category: filters.distCategory,
                km: filters.distKm,
              }}
              showReportColumns={canSeeReportSend}
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
                  showReportSend={canSeeReportSend}
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
  showReportSend,
}: {
  campaign: PromoCampaign;
  onClick: () => void;
  /** Gate «Срок отчёта» / «Отправка смежным» lines per V2-12. */
  showReportSend: boolean;
}) {
  const agg = aggregateKmStatuses(c);
  const deadline = getFillDeadline(c);
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
        </div>
        {showReportSend && (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <span>Срок отчёта:</span>
              <RuDate value={report.deadline} />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span>Отправка смежным:</span>
              {report.sent ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  Отправлено
                  {report.overdueDays === 0 && <CheckCircle2 className="size-3 shrink-0" />}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">
                  Не отправлено
                </span>
              )}
            </div>
            {report.sent && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs tabular-nums">
                <RuDate value={report.sentAt!} />
                <OverdueTag days={report.overdueDays} />
              </div>
            )}
          </>
        )}
        {kmNames && <div>КМ: {kmNames}</div>}
        <div className="font-medium text-gray-700 dark:text-gray-200">
          Готовность КМ: {readinessSummary(agg)}
        </div>
        <AggregatedIndicators aggregate={agg} />
      </div>
    </MobileListCard>
  );
}
