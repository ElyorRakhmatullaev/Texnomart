"use client";

import * as React from "react";
import { toast } from "sonner";
import { UserMinus } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Card } from "@texnomart/ui/card";
import { PromoStatusBadge } from "../../../components/PromoStatusBadge";
import { ReasonDialog } from "../../../components/ReasonDialog";
import { RuDate } from "../../../components/RuDate";
import { useApprovals } from "./ApprovalsProvider";
import {
  CATEGORY_MANAGERS,
  canRequestNonParticipation,
  getCampaignById,
  participationsForKm,
} from "../../../lib/promo-mock-data";

interface Row {
  campaignId: string;
  kmId: string;
}

/**
 * КМ self-service view (spec §4.5.1): every participation the КМ has, with the
 * ability to raise a «Не участвует» request (required reason → routed to Старший
 * КМ). No per-person identity in the mock, so the КМ role sees all participations.
 */
export function MyParticipationsPanel() {
  const { items, requestNonParticipation } = useApprovals();
  const [target, setTarget] = React.useState<Row | null>(null);

  // All (campaign, КМ) participations, live status from the store where present.
  const rows = React.useMemo(
    () =>
      CATEGORY_MANAGERS.flatMap((km) =>
        participationsForKm(km.id, items).map((p) => ({
          ...p,
          kmName: km.name,
        }))
      ),
    [items]
  );

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

  return (
    <>
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Мои участия</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Категорийный менеджер отправляет данные из полного промо-календаря. Здесь
          можно заявить о неучастии в акции — заявка уйдёт старшему КМ.
        </p>

        <ul className="mt-4 space-y-2">
          {rows.map((row) => {
            const c = getCampaignById(row.campaignId);
            const canRequest = canRequestNonParticipation(row.kmStatus);
            return (
              <li
                key={`${row.campaignId}~${row.kmId}`}
                className="flex flex-col gap-2 rounded-lg border bg-gray-50 dark:bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {c?.name ?? row.campaignId}
                    </span>
                    <PromoStatusBadge status={row.kmStatus} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground tabular-nums">
                    <span>{row.campaignId}</span>
                    <span>{row.kmName}</span>
                    {c && (
                      <span>
                        <RuDate value={c.startDate} /> — <RuDate value={c.endDate} />
                      </span>
                    )}
                  </div>
                </div>
                {canRequest ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-gray-700 dark:text-gray-200"
                    onClick={() => openRequest(row)}
                  >
                    <UserMinus className="size-4" />
                    Заявить о неучастии
                  </Button>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {row.kmStatus === "Не участвует"
                      ? "Неучастие оформлено"
                      : "Финальное решение принято"}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
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
