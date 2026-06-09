"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { Info, Plus } from "lucide-react";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { FilterBar } from "@texnomart/shared/components/filter-bar";
import type { FilterConfig } from "@texnomart/shared/types";
import { Button } from "@texnomart/ui/button";
import { Switch } from "@texnomart/ui/switch";
import { Label } from "@texnomart/ui/label";
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
  CAMPAIGNS,
  CATEGORY_MANAGERS,
  PROMO_TYPES,
  aggregateKmStatuses,
  getCategoryManager,
  getFillDeadline,
  getOverdueDays,
  type KmAggregate,
  type PromoCampaign,
} from "../../../lib/promo-mock-data";

const ALL = "all";
const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

// Only PLANNED campaigns appear in the short calendar (spec §4.1).
const PLANNED = CAMPAIGNS.filter((c) => c.planned);

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildFilters(): FilterConfig[] {
  const monthsSeen = new Map<string, Date>();
  for (const c of PLANNED) {
    const k = monthKey(c.startDate);
    if (!monthsSeen.has(k)) monthsSeen.set(k, c.startDate);
  }
  const months = [...monthsSeen.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return [
    {
      key: "type",
      label: "Тип",
      options: PROMO_TYPES.map((t) => ({ value: t.name, label: t.name })),
    },
    {
      key: "status",
      label: "Статус",
      options: [
        "На согласовании у старшего КМ",
        "На согласовании у коммерческого директора",
        "Переотправлено на корректировку КМ",
        "Согласовано и отправлено смежным отделам",
        "Отменена",
      ].map((s) => ({ value: s, label: s })),
    },
    {
      key: "km",
      label: "КМ",
      options: CATEGORY_MANAGERS.map((k) => ({ value: k.id, label: k.name })),
    },
    {
      key: "month",
      label: "Месяц",
      options: months.map(([k, d]) => ({
        value: k,
        label: `${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`,
      })),
    },
  ];
}

const FILTERS = buildFilters();

/** Inline «Готовность КМ» summary for mobile cards, e.g. "2 принято · 1 не заполнено". */
function readinessSummary(agg: KmAggregate): string {
  const parts: string[] = [];
  if (agg.acceptedKd) parts.push(`${agg.acceptedKd} принято`);
  if (agg.atKd) parts.push(`${agg.atKd} на согл. с КД`);
  if (agg.notFilled) parts.push(`${agg.notFilled} не заполнено`);
  if (agg.notParticipating) parts.push(`${agg.notParticipating} не участвует`);
  return parts.join(" · ") || "—";
}

export function ShortCalendarPage() {
  const navigate = useNavigate();
  const { currentRole } = useRole();
  const [mode, setMode] = React.useState<"calendar" | "plan">("calendar");
  const [values, setValues] = React.useState<Record<string, string>>({
    type: ALL,
    status: ALL,
    km: ALL,
    month: ALL,
  });
  const [hideCancelled, setHideCancelled] = React.useState(true);

  const canCreatePlan = currentRole === "Директор маркетинга";

  const filtered = React.useMemo(() => {
    return PLANNED.filter((c) => {
      if (hideCancelled && c.cancelled) return false;
      if (values.type !== ALL && c.type !== values.type) return false;
      if (values.status !== ALL && c.status !== values.status) return false;
      if (values.km !== ALL && !c.participatingKmIds.includes(values.km))
        return false;
      if (values.month !== ALL && monthKey(c.startDate) !== values.month)
        return false;
      return true;
    });
  }, [values, hideCancelled]);

  return (
    <div className="space-y-4">
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
          canCreatePlan ? (
            <Button onClick={() => setMode("plan")}>
              <Plus className="size-4" />
              Создать план
            </Button>
          ) : undefined
        }
      />

      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <TabsList>
          <TabsTrigger value="calendar">Промо-календарь</TabsTrigger>
          <TabsTrigger value="plan">План акций</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <FilterBar
            filters={FILTERS}
            values={values}
            onFilterChange={(key, value) =>
              setValues((prev) => ({ ...prev, [key]: value }))
            }
            onClear={() =>
              setValues({ type: ALL, status: ALL, km: ALL, month: ALL })
            }
            resultCount={filtered.length}
          >
            <div className="flex items-center gap-2">
              <Switch
                id="hide-cancelled"
                checked={hideCancelled}
                onCheckedChange={setHideCancelled}
              />
              <Label htmlFor="hide-cancelled" className="text-sm font-normal">
                Скрыть отменённое
              </Label>
            </div>
          </FilterBar>

          {/* Desktop: Pattern F frozen-column grid */}
          <div className="hidden md:block">
            <ShortCalendarTable
              campaigns={filtered}
              onRowClick={(id) => navigate(`/short-calendar/${id}`)}
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
  const kmNames = c.participatingKmIds
    .map((id) => getCategoryManager(id)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <MobileListCard
      onClick={onClick}
      title={c.name}
      subtitle={`${c.id} · ${c.type}`}
      status={<PromoStatusBadge status={c.status} />}
    >
      <div className="mt-2 space-y-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-1.5">
          <RuDate value={c.startDate} /> — <RuDate value={c.endDate} />
          <span>· срок КМ:</span>
          <RuDate value={deadline} />
          <OverdueTag days={overdue} />
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
