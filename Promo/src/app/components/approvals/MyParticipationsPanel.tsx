"use client";

import * as React from "react";
import { toast } from "sonner";
import { UserMinus } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Card } from "@texnomart/ui/card";
import { FilterBar } from "@texnomart/shared/components/filter-bar";
import type { FilterConfig } from "@texnomart/shared/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { PromoStatusBadge } from "../../../components/PromoStatusBadge";
import { ReasonDialog } from "../../../components/ReasonDialog";
import { RuDate } from "../../../components/RuDate";
import { useApprovals } from "./ApprovalsProvider";
import { PromoNoFilter } from "../short-calendar/PromoNoFilter";
import {
  CATEGORY_MANAGERS,
  PROMO_TYPES,
  canRequestNonParticipation,
  displayKmStatus,
  formatPromoNo,
  getCampaignById,
  kmSubmissionSla,
  participationsForKm,
  reviewItemId,
  type KmSubmissionSla,
} from "../../../lib/promo-mock-data";

const ALL = "all";

const FILTERS: FilterConfig[] = [
  {
    key: "type",
    label: "Тип",
    options: PROMO_TYPES.map((t) => ({ value: t.name, label: t.name })),
  },
];

/**
 * §10 «Статус» filter — the KM-facing statuses. A pending non-participation request
 * reads as «Заявка о неучастии отправлена»; an auto-escalated set reads as its КД
 * stage (via `displayKmStatus`), so both are offered as filter values.
 */
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "Не заполнено", label: "Не заполнено" },
  { value: "На согласовании у старшего КМ", label: "На согл. у старшего КМ" },
  { value: "На согласовании у коммерческого директора", label: "На согл. у КД" },
  { value: "Переотправлено на корректировку КМ", label: "На корректировке у КМ" },
  { value: "Согласовано КД", label: "Согласовано КД" },
  { value: "Заявка о неучастии отправлена", label: "Заявка о неучастии отправлена" },
  { value: "Не участвует", label: "Не участвует" },
];

/** «SLA КМ» chip — did the КМ send the promo for approval on time (§10). */
function KmSla({ sla }: { sla: KmSubmissionSla }) {
  if (sla.state === "none")
    return <span className="text-muted-foreground">—</span>;
  if (sla.state === "overdue")
    return (
      <span className="font-medium text-red-700 dark:text-red-300">
        +{sla.days} раб. дн. просрочено
      </span>
    );
  return (
    <span className="font-medium text-emerald-700 dark:text-emerald-300">
      В срок
    </span>
  );
}

interface Row {
  campaignId: string;
  kmId: string;
}

/**
 * КМ self-service view (spec §4.5.1, 4th-round §10): the КМ sees ONLY their own promos
 * (no per-person identity in the mock, so «свой КМ» = a representative КМ — the same
 * `CATEGORY_MANAGERS[0]` the full calendar uses for §7). The «КМ» column is dropped for
 * this role; each card shows № промо / тип / название / период / дата отправки /
 * текущий статус / SLA КМ, and the КМ can raise a «Не участвует» request (required
 * reason → routed to Старший КМ). After sending, the button becomes «Заявка о
 * неучастии отправлена»; after the final decision it becomes «Не участвует».
 */
export function MyParticipationsPanel() {
  const { items, requestNonParticipation } = useApprovals();
  const [target, setTarget] = React.useState<Row | null>(null);

  // Filters (§10): № промо · тип промо · период акции · статус.
  const [promoIds, setPromoIds] = React.useState<string[]>([]);
  const [values, setValues] = React.useState<Record<string, string>>({ type: ALL });
  const [periodStart, setPeriodStart] = React.useState("");
  const [periodEnd, setPeriodEnd] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>(ALL);

  const ownKmId = CATEGORY_MANAGERS[0].id;

  // All own participations, enriched with the live review item, campaign, the KM-facing
  // status, the submission time, and the «SLA КМ».
  const rows = React.useMemo(() => {
    return participationsForKm(ownKmId, items).map((p) => {
      const item = items.find((it) => it.id === reviewItemId(p.campaignId, p.kmId));
      const campaign = getCampaignById(p.campaignId);
      const isNonPartPending =
        item?.kind === "non-participation" && p.kmStatus !== "Не участвует";
      const shownStatus = isNonPartPending
        ? "Заявка о неучастии отправлена"
        : item
          ? displayKmStatus(item)
          : p.kmStatus;
      return {
        ...p,
        campaign,
        submittedAt: item?.submittedAt,
        isNonPartPending,
        shownStatus,
        sla: kmSubmissionSla(p.campaignId, p.kmId, p.kmStatus),
      };
    });
  }, [items, ownKmId]);

  const promoNoOptions = React.useMemo(() => {
    const seen = new Set<string>();
    return rows.flatMap((r) => {
      if (seen.has(r.campaignId)) return [];
      seen.add(r.campaignId);
      return [{ id: r.campaignId, no: formatPromoNo(r.campaignId), name: r.campaign?.name ?? formatPromoNo(r.campaignId) }];
    });
  }, [rows]);

  const filtered = React.useMemo(() => {
    const from = periodStart ? new Date(periodStart) : null;
    const to = periodEnd ? new Date(periodEnd) : null;
    return rows.filter((r) => {
      const c = r.campaign;
      if (values.type !== ALL && c?.type !== values.type) return false;
      if (promoIds.length > 0 && !promoIds.includes(r.campaignId)) return false;
      if (from && !Number.isNaN(from.getTime()) && c && c.endDate < from) return false;
      if (to && !Number.isNaN(to.getTime()) && c && c.startDate > to) return false;
      if (statusFilter !== ALL && r.shownStatus !== statusFilter) return false;
      return true;
    });
  }, [rows, values, promoIds, periodStart, periodEnd, statusFilter]);

  function openRequest(row: Row) {
    // Defer past the opening click (Radix DismissableLayer — see lessons).
    setTimeout(() => setTarget(row), 0);
  }

  function confirm(reason: string) {
    if (!target) return;
    requestNonParticipation(target.campaignId, target.kmId, reason);
    toast.success("Заявка на «Не участвует» отправлена старшему КМ.");
    setTarget(null);
  }

  function clearFilters() {
    setPromoIds([]);
    setValues({ type: ALL });
    setPeriodStart("");
    setPeriodEnd("");
    setStatusFilter(ALL);
  }

  return (
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
        {/* §10: № промо searchable multi-select. */}
        <PromoNoFilter
          options={promoNoOptions}
          selected={promoIds}
          onChange={setPromoIds}
        />
        {/* §10: Период акции date-range. */}
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
        {/* §10: Статус. */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[220px] bg-white text-sm dark:bg-card">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Мои участия и заявки о неучастии
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Категорийный менеджер отправляет данные из полного промо-календаря. Здесь
          виден статус, этап согласования и решение по каждой акции, а также можно
          заявить о неучастии — заявка уйдёт старшему КМ.
        </p>

        {filtered.length === 0 ? (
          <p className="mt-6 py-8 text-center text-sm text-muted-foreground">
            По выбранным фильтрам участий не найдено.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {filtered.map((row) => {
              const c = row.campaign;
              const canRequest =
                canRequestNonParticipation(row.kmStatus) && !row.isNonPartPending;
              return (
                <li
                  key={`${row.campaignId}~${row.kmId}`}
                  className="flex flex-col gap-3 rounded-lg border bg-gray-50 dark:bg-muted/40 p-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {c?.name ?? formatPromoNo(row.campaignId)}
                      </span>
                      <PromoStatusBadge status={row.shownStatus} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        {formatPromoNo(row.campaignId)}
                      </span>
                      {c && <span>{c.type}</span>}
                      {c && (
                        <span>
                          <RuDate value={c.startDate} /> — <RuDate value={c.endDate} />
                        </span>
                      )}
                      <span>
                        Отправлено:{" "}
                        {row.submittedAt ? (
                          <RuDate value={new Date(row.submittedAt)} withTime />
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground">SLA КМ:</span>
                      <KmSla sla={row.sla} />
                    </div>
                  </div>

                  <div className="shrink-0 self-start">
                    {canRequest ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-700 dark:text-gray-200"
                        onClick={() => openRequest(row)}
                      >
                        <UserMinus className="size-4" />
                        Заявить о неучастии
                      </Button>
                    ) : row.isNonPartPending ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-500/15 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                        Заявка о неучастии отправлена
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {row.kmStatus === "Не участвует"
                          ? "Неучастие оформлено"
                          : "Финальное решение принято"}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-4 border-t pt-3 text-[11px] text-muted-foreground">
          SLA КМ — это срок, в который вы должны отправить промо на согласование после
          создания.
        </p>
      </Card>

      <ReasonDialog
        open={target !== null}
        onOpenChange={(o) => {
          if (!o) setTarget(null);
        }}
        title="Заявить о неучастии"
        description="Укажите причину — заявка будет направлена старшему КМ на согласование."
        reasonRequired
        reasonLabel="Причина неучастия"
        confirmLabel="Отправить заявку"
        onConfirm={confirm}
      />
    </>
  );
}
