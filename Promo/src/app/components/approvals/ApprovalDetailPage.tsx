"use client";

import * as React from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Clock, FileX2 } from "lucide-react";
import { DetailPageHero } from "@texnomart/shared/components/detail-page-hero";
import { InfoRow } from "@texnomart/shared/components/info-row";
import { Badge } from "@texnomart/ui/badge";
import { Card, CardContent, CardHeader } from "@texnomart/ui/card";
import { PromoStatusBadge } from "../../../components/PromoStatusBadge";
import { OverdueTag } from "../../../components/OverdueTag";
import { RuDate } from "../../../components/RuDate";
import { ReasonDialog } from "../../../components/ReasonDialog";
import { useRole } from "../../role-context";
import { useApprovals } from "./ApprovalsProvider";
import { SubmittedLinesPanel } from "./SubmittedLinesPanel";
import { ReviewActionsPanel } from "./ReviewActionsPanel";
import {
  getCampaignById,
  getCategoryManager,
  getPromoLines,
  reviewSla,
  reviewerForKmStatus,
} from "../../../lib/promo-mock-data";

/** The reject flow being confirmed in the ReasonDialog. */
interface RejectTarget {
  lineIds: string[];
  general: boolean;
}

export function ApprovalDetailPage() {
  const { id } = useParams();
  const { currentRole } = useRole();
  const { getItem, approve, reject } = useApprovals();

  const itemId = id ? decodeURIComponent(id) : "";
  const item = itemId ? getItem(itemId) : undefined;
  const campaign = item ? getCampaignById(item.campaignId) : undefined;

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = React.useState<RejectTarget | null>(
    null
  );

  // Reset the selection whenever we move to a different item.
  React.useEffect(() => {
    setSelected(new Set());
  }, [itemId]);

  if (!item || !campaign) {
    return (
      <div className="space-y-4">
        <Link
          to="/approvals"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          ← Согласование
        </Link>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-20 text-center">
          <FileX2 className="size-12 text-muted-foreground/60" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Заявка не найдена
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Элемент «{itemId}» отсутствует в очереди согласования.
          </p>
        </div>
      </div>
    );
  }

  const km = getCategoryManager(item.kmId);
  const sla = reviewSla(new Date(item.submittedAt));
  const lines = getPromoLines(item.campaignId).filter(
    (l) => l.kmId === item.kmId
  );

  // КД acts on items auto-escalated to it; otherwise the status determines the reviewer.
  const actingReviewer = item.escalatedToKD
    ? "Коммерческий директор"
    : reviewerForKmStatus(item.kmStatus);
  const canAct = actingReviewer === currentRole;

  function toggle(lineId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  }
  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(lines.map((l) => l.id)) : new Set());
  }

  function handleApproveAll() {
    approve(item!.id, currentRole);
    toast.success(
      currentRole === "Старший КМ"
        ? "Набор согласован и передан коммерческому директору."
        : "Набор принят коммерческим директором."
    );
    setSelected(new Set());
  }

  // Defer opening the controlled dialog past the click that opened it (Radix
  // DismissableLayer otherwise dismisses it — see S2 Phase 3 lesson).
  function openReject(target: RejectTarget) {
    setTimeout(() => setRejectTarget(target), 0);
  }

  function confirmReject(reason: string) {
    if (!rejectTarget) return;
    reject(item!.id, {
      lineIds: rejectTarget.lineIds,
      comment: reason,
      actor: currentRole,
    });
    const n = rejectTarget.lineIds.length;
    toast.success(
      n > 0
        ? `Отклонено строк: ${n}. Набор возвращён КМ на корректировку.`
        : "Набор возвращён КМ на корректировку."
    );
    setSelected(new Set());
    setRejectTarget(null);
  }

  const rejectIsSet = rejectTarget?.general ?? false;

  return (
    <div className="space-y-4 pb-6">
      <DetailPageHero
        backHref="/approvals"
        backLabel="Согласование"
        title={campaign.name}
        subtitle={
          <span className="tabular-nums">
            {campaign.id} · {campaign.type} · {km?.name ?? item.kmId}
          </span>
        }
        badges={
          <>
            <PromoStatusBadge status={item.kmStatus} />
            <Badge variant="outline">
              {campaign.planned ? "Плановая" : "Внеплановая"}
            </Badge>
          </>
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
            label="Отправлено на согласование"
            value={
              <span className="tabular-nums">
                <RuDate value={new Date(item.submittedAt)} withTime />
              </span>
            }
          />
          <InfoRow label="Текущий проверяющий" value={actingReviewer ?? "—"} />
          <InfoRow
            label="Срок проверки (раб. дни)"
            value={
              sla.overdue > 0 ? (
                <span className="flex items-center gap-1.5">
                  <OverdueTag days={sla.overdue} />
                  <span className="text-sm text-muted-foreground">
                    из 2 раб. дн.
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm tabular-nums text-gray-700">
                  <Clock className="size-3.5 text-muted-foreground" />
                  осталось {sla.remaining} раб. дн.
                </span>
              )
            }
          />
        </div>
      </DetailPageHero>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-sm font-semibold text-gray-900">
              Отправленные строки КМ
            </h2>
            <p className="text-xs text-muted-foreground">
              Снимок отправленной версии (только чтение){" "}
              {canAct
                ? "— выберите строки для отклонения или согласуйте весь набор."
                : "."}
            </p>
          </CardHeader>
          <CardContent>
            <SubmittedLinesPanel
              lines={lines}
              feedback={item.lineFeedback}
              selectable={canAct}
              selectedIds={selected}
              onToggle={toggle}
              onToggleAll={toggleAll}
              onRejectLine={(lineId) =>
                openReject({ lineIds: [lineId], general: false })
              }
            />
          </CardContent>
        </Card>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <ReviewActionsPanel
            item={item}
            canAct={canAct}
            actingReviewer={actingReviewer}
            lineCount={lines.length}
            selectedCount={selected.size}
            onApproveAll={handleApproveAll}
            onRejectSelected={() =>
              openReject({ lineIds: [...selected], general: false })
            }
            onRejectSet={() => openReject({ lineIds: [], general: true })}
          />
        </div>
      </div>

      <ReasonDialog
        open={rejectTarget !== null}
        onOpenChange={(o) => {
          if (!o) setRejectTarget(null);
        }}
        title={rejectIsSet ? "Отклонить весь набор" : "Отклонить строки"}
        description={
          rejectIsSet
            ? "Весь набор данных КМ будет возвращён на корректировку."
            : `Будет отклонено строк: ${rejectTarget?.lineIds.length ?? 0}. Весь набор КМ вернётся на корректировку.`
        }
        reasonRequired
        reasonLabel="Причина отклонения"
        confirmLabel="Отклонить"
        destructive
        onConfirm={confirmReject}
      />
    </div>
  );
}
