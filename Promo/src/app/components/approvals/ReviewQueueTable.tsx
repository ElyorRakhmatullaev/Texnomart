"use client";

import { ChevronRight, Clock, UserMinus, Zap } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@texnomart/ui/table";
import { Card } from "@texnomart/ui/card";
import { cn } from "@texnomart/ui/utils";
import { MobileListCard } from "@texnomart/shared/components/mobile-list-card";
import { PromoStatusBadge } from "../../../components/PromoStatusBadge";
import { OverdueTag } from "../../../components/OverdueTag";
import { RuDate } from "../../../components/RuDate";
import {
  getCampaignById,
  getCategoryManager,
  isAutoEscalated,
  reviewSla,
  type ReviewItem,
} from "../../../lib/promo-mock-data";

/** Small inline tags shown next to an item — non-participation kind + auto-escalation. */
function ItemTags({ item }: { item: ReviewItem }) {
  return (
    <>
      {item.kind === "non-participation" && (
        <span className="inline-flex items-center gap-0.5 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700">
          <UserMinus className="size-3" />
          Не участвует
        </span>
      )}
      {isAutoEscalated(item) && (
        <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
          <Zap className="size-3" />
          Авто-передано
        </span>
      )}
    </>
  );
}

/** SLA timer cell — working days left, or an overdue tag once breached. */
function SlaTimer({ submittedAt }: { submittedAt: string }) {
  const sla = reviewSla(new Date(submittedAt));
  if (sla.overdue > 0) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <OverdueTag days={sla.overdue} />
        <span className="text-xs text-muted-foreground">просрочено</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm tabular-nums",
        sla.remaining <= 0 ? "text-red-700" : "text-gray-700"
      )}
      title="Рабочие дни (Пн–Пт) до истечения 2-рабочедневного срока"
    >
      <Clock className="size-3.5 text-muted-foreground" />
      {sla.remaining} раб. дн.
    </span>
  );
}

interface ReviewQueueTableProps {
  items: ReviewItem[];
  onOpen: (id: string) => void;
}

export function ReviewQueueTable({ items, onOpen }: ReviewQueueTableProps) {
  if (items.length === 0) {
    return (
      <Card className="p-12 text-center text-sm text-muted-foreground">
        Нет элементов на согласование
      </Card>
    );
  }

  return (
    <>
      {/* Desktop — Pattern C table */}
      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-gray-50">
              <TableRow>
                <TableHead className="w-[120px]">№ промо</TableHead>
                <TableHead className="w-[140px]">Тип</TableHead>
                <TableHead>Название</TableHead>
                <TableHead className="w-[180px]">КМ</TableHead>
                <TableHead className="w-[150px]">Отправлено</TableHead>
                <TableHead className="w-[200px]">Статус</TableHead>
                <TableHead className="w-[140px]">SLA</TableHead>
                <TableHead className="w-[44px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => {
                const c = getCampaignById(it.campaignId);
                const km = getCategoryManager(it.kmId);
                return (
                  <TableRow
                    key={it.id}
                    className="cursor-pointer"
                    onClick={() => onOpen(it.id)}
                  >
                    <TableCell className="font-medium tabular-nums">
                      {it.campaignId}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {c?.type ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <span className="block truncate">{c?.name ?? "—"}</span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {km?.name ?? it.kmId}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-700">
                      <RuDate value={new Date(it.submittedAt)} withTime />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <PromoStatusBadge status={it.kmStatus} />
                        <ItemTags item={it} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <SlaTimer submittedAt={it.submittedAt} />
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Mobile (Mode B) — card list */}
      <div className="space-y-3 md:hidden">
        {items.map((it) => {
          const c = getCampaignById(it.campaignId);
          const km = getCategoryManager(it.kmId);
          return (
            <MobileListCard
              key={it.id}
              onClick={() => onOpen(it.id)}
              title={c?.name ?? it.campaignId}
              subtitle={`${it.campaignId} · ${c?.type ?? ""}`}
              status={<PromoStatusBadge status={it.kmStatus} />}
            >
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <ItemTags item={it} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                <span>КМ: {km?.name ?? it.kmId}</span>
                <span className="inline-flex items-center gap-1">
                  Отправлено: <RuDate value={new Date(it.submittedAt)} withTime />
                </span>
                <SlaTimer submittedAt={it.submittedAt} />
              </div>
            </MobileListCard>
          );
        })}
      </div>
    </>
  );
}
