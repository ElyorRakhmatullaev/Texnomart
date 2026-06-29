"use client";

import * as React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Info, Link2, ShieldCheck, X } from "lucide-react";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { FilterBar } from "@texnomart/shared/components/filter-bar";
import type { FilterConfig } from "@texnomart/shared/types";
import { Switch } from "@texnomart/ui/switch";
import { Label } from "@texnomart/ui/label";
import { Button } from "@texnomart/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@texnomart/ui/tooltip";
import { useRole } from "../../role-context";
import { useApprovals } from "./ApprovalsProvider";
import { ReviewQueueTable } from "./ReviewQueueTable";
import { MyParticipationsPanel } from "./MyParticipationsPanel";
import {
  CATEGORY_MANAGERS,
  PROMO_TYPES,
  formatPromoNo,
  getCampaignById,
  getCategoryManager,
  reviewSla,
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
    key: "km",
    label: "КМ",
    options: CATEGORY_MANAGERS.map((k) => ({ value: k.id, label: k.name })),
  },
];

/** The roles that act as reviewers in the approval workspace (spec §4.5). */
const REVIEWER_ROLES = ["Старший КМ", "Коммерческий директор", "Администратор"];

export function ApprovalsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentRole } = useRole();
  const { items, queueFor } = useApprovals();
  const [values, setValues] = React.useState<Record<string, string>>({
    type: ALL,
    km: ALL,
  });
  const [onlyOverdue, setOnlyOverdue] = React.useState(false);

  const isReviewer = REVIEWER_ROLES.includes(currentRole);
  const isKm = currentRole === "Категорийный менеджер (КМ)";

  // Deep link from the short calendar's КМ-status cell (§10) — ?promo=&km=. When
  // present we show the matching item(s) across ALL items (not just the current
  // role's queue) so the link always lands on the item; the detail page still
  // gates actions by role.
  const promoParam = searchParams.get("promo");
  const kmParam = searchParams.get("km");
  const deepLinked = !!(promoParam || kmParam);

  // Администратор has full technical access → sees every item; others see their queue.
  const queue = React.useMemo<ReviewItem[]>(
    () => (currentRole === "Администратор" ? items : queueFor(currentRole)),
    [currentRole, items, queueFor]
  );

  const filtered = React.useMemo(() => {
    if (deepLinked) {
      return items.filter((it) => {
        if (promoParam && it.campaignId !== promoParam) return false;
        if (kmParam && it.kmId !== kmParam) return false;
        return true;
      });
    }
    return queue.filter((it) => {
      const c = getCampaignById(it.campaignId);
      if (values.type !== ALL && c?.type !== values.type) return false;
      if (values.km !== ALL && it.kmId !== values.km) return false;
      if (onlyOverdue && reviewSla(new Date(it.submittedAt)).overdue <= 0)
        return false;
      return true;
    });
  }, [deepLinked, items, promoParam, kmParam, queue, values, onlyOverdue]);

  const deepLinkLabel = deepLinked
    ? [
        promoParam ? `№ ${formatPromoNo(promoParam)}` : null,
        kmParam ? `КМ ${getCategoryManager(kmParam)?.name ?? kmParam}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

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
            <Link2 className="size-4 shrink-0 text-gray-500" />
            <span className="text-sm text-gray-700">
              Показано по ссылке: <span className="font-medium">{deepLinkLabel}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-8 text-xs text-gray-500"
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
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
              <ShieldCheck className="size-12 text-muted-foreground" />
              <div>
                <p className="font-medium text-gray-900">
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
            onClear={() => {
              setValues({ type: ALL, km: ALL });
              setOnlyOverdue(false);
            }}
            resultCount={filtered.length}
            className="bg-transparent px-0"
          >
            <div className="flex items-center gap-2">
              <Switch
                id="only-overdue"
                checked={onlyOverdue}
                onCheckedChange={setOnlyOverdue}
              />
              <Label htmlFor="only-overdue" className="text-sm font-normal">
                Только просроченные
              </Label>
            </div>
          </FilterBar>

          <ReviewQueueTable
            items={filtered}
            onOpen={(id) => navigate(`/approvals/${encodeURIComponent(id)}`)}
          />
        </>
      ) : isKm ? (
        <MyParticipationsPanel />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <ShieldCheck className="size-12 text-muted-foreground" />
          <div>
            <p className="font-medium text-gray-900">
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
