"use client";

import { Link, useParams } from "react-router";
import { CalendarX2, ExternalLink, Lock } from "lucide-react";
import { DetailPageHero } from "@texnomart/shared/components/detail-page-hero";
import { InfoRow } from "@texnomart/shared/components/info-row";
import { Card, CardContent, CardHeader } from "@texnomart/ui/card";
import { Badge } from "@texnomart/ui/badge";
import { Button } from "@texnomart/ui/button";
import { cn } from "@texnomart/ui/utils";
import { PromoStatusBadge } from "../../../components/PromoStatusBadge";
import { OverdueTag } from "../../../components/OverdueTag";
import { RuDate } from "../../../components/RuDate";
import { DeadlineChips } from "../../../components/DeadlineChips";
import { AggregatedIndicators } from "./AggregatedIndicators";
import {
  aggregateKmStatuses,
  getCampaignById,
  getCategoryManager,
  getFillDeadline,
  getOverdueDays,
} from "../../../lib/promo-mock-data";

export function ShortCalendarDetailPage() {
  const { promoId } = useParams();
  const campaign = promoId ? getCampaignById(promoId) : undefined;

  if (!campaign) {
    return (
      <div className="space-y-4">
        <Link
          to="/short-calendar"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          ← Краткий промо-календарь
        </Link>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-20 text-center">
          <CalendarX2 className="size-12 text-muted-foreground/60" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Акция не найдена
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Акция «{promoId}» отсутствует в кратком календаре.
          </p>
        </div>
      </div>
    );
  }

  const deadline = getFillDeadline(campaign);
  const overdue = getOverdueDays(deadline);
  const agg = aggregateKmStatuses(campaign);

  return (
    <div className="space-y-4">
      <DetailPageHero
        backHref="/short-calendar"
        backLabel="Краткий промо-календарь"
        title={campaign.name}
        subtitle={
          <span className="tabular-nums">
            {campaign.id} · {campaign.type}
          </span>
        }
        badges={
          <>
            <PromoStatusBadge status={campaign.status} />
            <Badge variant="outline">
              {campaign.planned ? "Плановая" : "Внеплановая"}
            </Badge>
            {campaign.cancelled && (
              <Badge variant="outline" className="border-red-200 text-red-700">
                Отменена
              </Badge>
            )}
          </>
        }
        actions={
          <Button asChild variant="outline">
            <Link to="/full-calendar">
              <ExternalLink className="size-4" />
              Открыть в полном календаре
            </Link>
          </Button>
        }
      >
        <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
          <InfoRow
            label="Период акции"
            value={
              <span className="tabular-nums">
                <RuDate value={campaign.startDate} /> —{" "}
                <RuDate value={campaign.endDate} />
              </span>
            }
          />
          <InfoRow
            label="Крайний срок КМ"
            value={
              <span className="flex items-center gap-1.5">
                <span className="tabular-nums">
                  <RuDate value={deadline} />
                </span>
                <OverdueTag days={overdue} />
              </span>
            }
          />
          <InfoRow label="Тип промо" value={campaign.type} />
          <InfoRow
            label="Статус (авто)"
            value={
              <span className="flex items-center gap-1.5">
                <PromoStatusBadge status={campaign.status} />
                <Lock className="size-3 text-muted-foreground" />
              </span>
            }
          />
        </div>
      </DetailPageHero>

      {/* Aggregated readiness */}
      <Card>
        <CardHeader className="pb-2">
          <h2 className="text-sm font-semibold text-gray-900">
            Готовность по КМ
          </h2>
        </CardHeader>
        <CardContent>
          <AggregatedIndicators aggregate={agg} hideZero={false} />
        </CardContent>
      </Card>

      {/* Per-KM breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <h2 className="text-sm font-semibold text-gray-900">
            Детализация по категорийным менеджерам
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {campaign.participatingKmIds.map((id) => {
              const km = getCategoryManager(id);
              const status = campaign.kmStatuses[id];
              return (
                <div
                  key={id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {km?.name ?? id}
                      {km?.senior && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          Старший КМ
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {km?.category}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {status ? (
                      <PromoStatusBadge status={status} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Deadlines */}
      <Card className={cn(campaign.cancelled && "opacity-80")}>
        <CardHeader className="pb-2">
          <h2 className="text-sm font-semibold text-gray-900">
            Календарные дедлайны
          </h2>
        </CardHeader>
        <CardContent>
          <DeadlineChips startDate={campaign.startDate} />
        </CardContent>
      </Card>
    </div>
  );
}
