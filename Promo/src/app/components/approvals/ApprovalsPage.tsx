"use client";

import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Info, Link2, ShieldCheck, X } from "lucide-react";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { FilterBar } from "@texnomart/shared/components/filter-bar";
import type { FilterConfig } from "@texnomart/shared/types";
import { Button } from "@texnomart/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@texnomart/ui/tooltip";
import { useRole } from "../../role-context";
import { useCurrentUser } from "../../current-user-context";
import { useApprovals } from "./ApprovalsProvider";
import { ReviewQueueTable } from "./ReviewQueueTable";
import { MyParticipationsPanel } from "./MyParticipationsPanel";
import { PromoNoFilter } from "../short-calendar/PromoNoFilter";
import { KmMultiSelect } from "./KmMultiSelect";
import {
  CATEGORY_MANAGERS,
  PROMO_TYPES,
  formatPromoNo,
  getCampaignById,
  getCategoryManager,
  reviewSla,
  reviewStageOf,
  visibleReviewQueue,
  type ReviewItem,
} from "../../../lib/promo-mock-data";

const ALL = "all";

const FILTERS: FilterConfig[] = [
  {
    key: "type",
    label: "Тип",
    options: PROMO_TYPES.map((t) => ({ value: t.name, label: t.name })),
  },
  {
    key: "priznak",
    label: "Признак",
    options: [
      { value: "planned", label: "Плановая" },
      { value: "unplanned", label: "Внеплановая" },
    ],
  },
];

/** The roles that act as reviewers in the approval workspace (spec §4.5). */
const REVIEWER_ROLES = ["Старший КМ", "Коммерческий директор", "Администратор"];

/** «Статус согласования» filter (§3) — the review stage an item currently sits in. */
type StatusFilter = "all" | "senior" | "kd";
/** «Срок согласования» filter (§1) — replaces the old «Только просроченные» toggle. */
type DeadlineFilter = "all" | "today" | "overdue";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function ApprovalsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentRole } = useRole();
  const { currentUser } = useCurrentUser();
  const { items } = useApprovals();

  const [values, setValues] = React.useState<Record<string, string>>({
    type: ALL,
    priznak: ALL,
  });
  // §2: № промо multi-select + Период акции date-range (mirrors the calendars).
  const [promoIds, setPromoIds] = React.useState<string[]>([]);
  const [periodStart, setPeriodStart] = React.useState("");
  const [periodEnd, setPeriodEnd] = React.useState("");
  // §3: «Статус согласования» stage filter · §1: «Срок согласования».
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>(ALL);
  const [deadline, setDeadline] = React.useState<DeadlineFilter>(ALL);
  // §4: «КМ» multi-select, persisted per user (see the hydrate/persist effects below).
  const [kmIds, setKmIds] = React.useState<string[]>([]);

  const isReviewer = REVIEWER_ROLES.includes(currentRole);
  const isKm = currentRole === "Категорийный менеджер (КМ)";

  // §4 — persist the КМ filter per user so a Старший КМ needn't re-pick their КМ each
  // login. Key by the current user id; hydrate once (guarded so the empty initial
  // state never overwrites a saved selection before hydration runs).
  const kmStorageKey = currentUser
    ? `promo:approvals-km-filter:${currentUser.id}`
    : null;
  const hydrated = React.useRef(false);
  React.useEffect(() => {
    if (hydrated.current || !kmStorageKey) return;
    hydrated.current = true;
    try {
      const saved = JSON.parse(localStorage.getItem(kmStorageKey) ?? "[]");
      if (Array.isArray(saved) && saved.length > 0) setKmIds(saved);
    } catch {
      /* ignore malformed storage */
    }
  }, [kmStorageKey]);
  React.useEffect(() => {
    if (!hydrated.current || !kmStorageKey) return;
    localStorage.setItem(kmStorageKey, JSON.stringify(kmIds));
  }, [kmStorageKey, kmIds]);

  // Stable "now" for the day-granular deadline comparison (avoids re-memo churn).
  const now = React.useMemo(() => new Date(), []);

  // Deep link from the short calendar's КМ-status cell (§10) — ?promo=&km=. When
  // present we show the matching item(s) across ALL items (not just the current
  // role's queue) so the link always lands on the item; the detail page still
  // gates actions by role.
  const promoParam = searchParams.get("promo");
  const kmParam = searchParams.get("km");
  const deepLinked = !!(promoParam || kmParam);

  // §3 — reviewers now SEE both review stages (Старший КМ & КД); acting stays gated
  // on the detail page. Администратор keeps full technical visibility of every item.
  const queue = React.useMemo<ReviewItem[]>(
    () =>
      currentRole === "Администратор" ? items : visibleReviewQueue(items),
    [currentRole, items]
  );

  // № промо options — the campaigns present in the visible queue (full PR-/UN- format).
  const promoNoOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const opts: { id: string; no: string; name: string }[] = [];
    for (const it of queue) {
      if (seen.has(it.campaignId)) continue;
      seen.add(it.campaignId);
      const c = getCampaignById(it.campaignId);
      opts.push({ id: it.campaignId, no: it.campaignId, name: c?.name ?? it.campaignId });
    }
    return opts;
  }, [queue]);

  const kmOptions = React.useMemo(
    () => CATEGORY_MANAGERS.map((k) => ({ id: k.id, name: k.name })),
    []
  );

  const filtered = React.useMemo(() => {
    if (deepLinked) {
      return items.filter((it) => {
        if (promoParam && it.campaignId !== promoParam) return false;
        if (kmParam && it.kmId !== kmParam) return false;
        return true;
      });
    }
    const from = periodStart ? new Date(periodStart) : null;
    const to = periodEnd ? new Date(periodEnd) : null;
    return queue.filter((it) => {
      const c = getCampaignById(it.campaignId);
      // Тип
      if (values.type !== ALL && c?.type !== values.type) return false;
      // §5: Плановое / внеплановое
      if (values.priznak !== ALL) {
        if (values.priznak === "planned" && !c?.planned) return false;
        if (values.priznak === "unplanned" && c?.planned) return false;
      }
      // §2: № промо multi-select
      if (promoIds.length > 0 && !promoIds.includes(it.campaignId)) return false;
      // §2: Период акции (overlap with the campaign period)
      if (from && !Number.isNaN(from.getTime()) && c && c.endDate < from) return false;
      if (to && !Number.isNaN(to.getTime()) && c && c.startDate > to) return false;
      // §4: КМ multi-select
      if (kmIds.length > 0 && !kmIds.includes(it.kmId)) return false;
      // §3: Статус согласования (current review stage, auto-escalation aware)
      if (statusFilter !== ALL && reviewStageOf(it, now) !== statusFilter) return false;
      // §1: Срок согласования (by computed SLA)
      if (deadline !== ALL) {
        const sla = reviewSla(new Date(it.submittedAt), now);
        if (deadline === "overdue" && sla.overdue <= 0) return false;
        if (
          deadline === "today" &&
          !(sla.overdue > 0 || isSameDay(sla.deadline, now))
        )
          return false;
      }
      return true;
    });
  }, [
    deepLinked,
    items,
    promoParam,
    kmParam,
    queue,
    values,
    promoIds,
    periodStart,
    periodEnd,
    kmIds,
    statusFilter,
    deadline,
    now,
  ]);

  const deepLinkLabel = deepLinked
    ? [
        promoParam ? `№ ${formatPromoNo(promoParam)}` : null,
        kmParam ? `КМ ${getCategoryManager(kmParam)?.name ?? kmParam}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  function clearFilters() {
    setValues({ type: ALL, priznak: ALL });
    setPromoIds([]);
    setPeriodStart("");
    setPeriodEnd("");
    setStatusFilter(ALL);
    setDeadline(ALL);
    setKmIds([]);
  }

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        title="Согласование и проверка"
        showCompare={false}
        showExport={false}
        subtitle={
          <span className="flex items-center gap-2">
            {deepLinked
              ? "Переход по ссылке из календаря готовности"
              : isReviewer
                ? `На согласовании: ${filtered.length.toLocaleString("ru-RU")}`
                : isKm
                  ? "Ваши участия и заявки о неучастии"
                  : "Очередь проверки доступна старшему КМ и коммерческому директору"}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[280px]">
                Статусы рассчитываются по паре «Промо + КМ» (§4.5). Срок проверки —
                2 рабочих дня (Пн–Пт); по истечении элемент авто-передаётся
                коммерческому директору.
              </TooltipContent>
            </Tooltip>
          </span>
        }
      />

      {deepLinked ? (
        <>
          {/* Deep-link banner (§10) — shows what the link filtered to + a clear action. */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
            <Link2 className="size-4 shrink-0 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-200">
              Показано по ссылке: <span className="font-medium">{deepLinkLabel}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-8 text-xs text-gray-500 dark:text-gray-400"
              onClick={() => setSearchParams({})}
            >
              <X className="mr-1 size-3" />
              Показать всю очередь
            </Button>
          </div>

          {filtered.length > 0 ? (
            <ReviewQueueTable
              items={filtered}
              onOpen={(id) => navigate(`/approvals/${encodeURIComponent(id)}`)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-16 text-center">
              <ShieldCheck className="size-12 text-muted-foreground" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Элемент согласования не найден
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  По этой паре «акция + КМ» нет активного элемента в очереди
                  проверки — возможно, статус уже изменился.
                </p>
              </div>
            </div>
          )}
        </>
      ) : isReviewer ? (
        <>
          <FilterBar
            filters={FILTERS}
            values={values}
            onFilterChange={(key, value) =>
              setValues((prev) => ({ ...prev, [key]: value }))
            }
            onClear={clearFilters}
            resultCount={filtered.length}
            className="bg-transparent px-0"
          >
            {/* §2: № промо searchable multi-select (full PR-/UN- format). */}
            <PromoNoFilter
              options={promoNoOptions}
              selected={promoIds}
              onChange={setPromoIds}
            />
            {/* §2: Период акции date-range. */}
            <div className="flex h-8 items-center gap-1.5 rounded-md border bg-white dark:bg-card px-2.5 text-sm">
              <span className="text-xs text-muted-foreground">Период</span>
              <input
                type="date"
                aria-label="Период акции — с"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="bg-transparent text-xs tabular-nums outline-none"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <input
                type="date"
                aria-label="Период акции — по"
                value={periodEnd}
                min={periodStart || undefined}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="bg-transparent text-xs tabular-nums outline-none"
              />
            </div>
            {/* §4: «КМ» multi-select (persisted per user). */}
            <KmMultiSelect
              options={kmOptions}
              selected={kmIds}
              onChange={setKmIds}
            />
            {/* §3: «Статус согласования» stage filter. */}
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="h-8 w-[220px] bg-white text-sm dark:bg-card">
                <SelectValue placeholder="Статус согласования" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы согласования</SelectItem>
                <SelectItem value="senior">На согласовании у старшего КМ</SelectItem>
                <SelectItem value="kd">
                  На согласовании у коммерческого директора
                </SelectItem>
              </SelectContent>
            </Select>
            {/* §1: «Срок согласования» (replaces «Только просроченные»). */}
            <Select
              value={deadline}
              onValueChange={(v) => setDeadline(v as DeadlineFilter)}
            >
              <SelectTrigger className="h-8 w-[200px] bg-white text-sm dark:bg-card">
                <SelectValue placeholder="Срок согласования" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все сроки</SelectItem>
                <SelectItem value="today">Требуют решения сегодня</SelectItem>
                <SelectItem value="overdue">Только просроченные</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>

          <ReviewQueueTable
            items={filtered}
            onOpen={(id) => navigate(`/approvals/${encodeURIComponent(id)}`)}
          />
        </>
      ) : isKm ? (
        <MyParticipationsPanel />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-16 text-center">
          <ShieldCheck className="size-12 text-muted-foreground" />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              В роли «{currentRole}» нет элементов на согласование
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Очередь проверки предназначена для старшего КМ и коммерческого
              директора. Категорийный менеджер отправляет данные на согласование
              из полного промо-календаря.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
