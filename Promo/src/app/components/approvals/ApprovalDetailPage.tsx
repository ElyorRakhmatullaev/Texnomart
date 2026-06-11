"use client";

import * as React from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { AlertTriangle, Clock, FileX2, History, Zap } from "lucide-react";
import { DetailPageHero } from "@texnomart/shared/components/detail-page-hero";
import { InfoRow } from "@texnomart/shared/components/info-row";
import { Badge } from "@texnomart/ui/badge";
import { Button } from "@texnomart/ui/button";
import { Card, CardContent, CardHeader } from "@texnomart/ui/card";
import { PromoStatusBadge } from "../../../components/PromoStatusBadge";
import { OverdueTag } from "../../../components/OverdueTag";
import { RuDate } from "../../../components/RuDate";
import { ReasonDialog } from "../../../components/ReasonDialog";
import { VersionHistoryDrawer } from "../../../components/VersionHistoryDrawer";
import { useRole } from "../../role-context";
import { useApprovals } from "./ApprovalsProvider";
import { SubmittedLinesPanel } from "./SubmittedLinesPanel";
import { ReviewActionsPanel, MobileReviewActionBar } from "./ReviewActionsPanel";
import {
  campaignDecisionSummary,
  effectiveReviewer,
  getCampaignById,
  getCategoryManager,
  getPromoLines,
  isAutoEscalated,
  reviewSla,
} from "../../../lib/promo-mock-data";

/** The reason flow currently confirmed in the ReasonDialog. */
type ReasonFlow =
  | { kind: "reject-lines"; lineIds: string[] }
  | { kind: "reject-set" }
  | { kind: "reject-nonpart" }
  | { kind: "kd-set-nonpart" };

export function ApprovalDetailPage() {
  const { id } = useParams();
  const { currentRole } = useRole();
  const { items, getItem, approve, reject, setNonParticipationByKd } =
    useApprovals();

  const itemId = id ? decodeURIComponent(id) : "";
  const item = itemId ? getItem(itemId) : undefined;
  const campaign = item ? getCampaignById(item.campaignId) : undefined;

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [flow, setFlow] = React.useState<ReasonFlow | null>(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);

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
  const isNonPart = item.kind === "non-participation";

  // Live auto-escalation (a breached Старший-КМ item is now acted on by the КД).
  const autoEscalated = isAutoEscalated(item);
  const actingReviewer = effectiveReviewer(item);
  const canAct = actingReviewer === currentRole;
  const isKd = currentRole === "Коммерческий директор";

  const decision = campaignDecisionSummary(item.campaignId, items);

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
    if (isNonPart) {
      toast.success(
        currentRole === "Старший КМ"
          ? "Неучастие согласовано и передано коммерческому директору."
          : "Неучастие подтверждено — КМ освобождён от участия."
      );
    } else {
      toast.success(
        currentRole === "Старший КМ"
          ? "Набор согласован и передан коммерческому директору."
          : "Набор принят коммерческим директором."
      );
    }
    setSelected(new Set());
  }

  // Defer opening the controlled dialog past the click that opened it (Radix
  // DismissableLayer otherwise dismisses it — see tasks/lessons.md S2 Phase 3).
  function openFlow(next: ReasonFlow) {
    setTimeout(() => setFlow(next), 0);
  }

  function confirmReason(reason: string) {
    if (!flow) return;
    if (flow.kind === "kd-set-nonpart") {
      setNonParticipationByKd(item!.campaignId, item!.kmId, reason);
      toast.success("«Не участвует» установлено коммерческим директором.");
    } else if (flow.kind === "reject-nonpart") {
      reject(item!.id, { lineIds: [], comment: reason, actor: currentRole });
      toast.success("Заявка отклонена — КМ должен заполнить данные.");
    } else {
      const lineIds = flow.kind === "reject-lines" ? flow.lineIds : [];
      reject(item!.id, { lineIds, comment: reason, actor: currentRole });
      toast.success(
        lineIds.length > 0
          ? `Отклонено строк: ${lineIds.length}. Набор возвращён КМ на корректировку.`
          : "Набор возвращён КМ на корректировку."
      );
    }
    setSelected(new Set());
    setFlow(null);
  }

  const reasonCopy: Record<
    ReasonFlow["kind"],
    { title: string; description: string; required: boolean; confirm: string }
  > = {
    "reject-lines": {
      title: "Отклонить строки",
      description: `Будет отклонено строк: ${flow?.kind === "reject-lines" ? flow.lineIds.length : 0}. Весь набор КМ вернётся на корректировку.`,
      required: true,
      confirm: "Отклонить",
    },
    "reject-set": {
      title: "Отклонить весь набор",
      description: "Весь набор данных КМ будет возвращён на корректировку.",
      required: true,
      confirm: "Отклонить",
    },
    "reject-nonpart": {
      title: "Отклонить «Не участвует»",
      description:
        "Заявка на неучастие будет отклонена — КМ должен будет заполнить номенклатуру. Комментарий по желанию.",
      required: false,
      confirm: "Отклонить заявку",
    },
    "kd-set-nonpart": {
      title: "Установить «Не участвует»",
      description:
        "КМ будет освобождён от участия в акции (финальное решение КД). Комментарий рекомендуется.",
      required: false,
      confirm: "Установить",
    },
  };
  const copy = flow ? reasonCopy[flow.kind] : null;

  return (
    <div className={canAct ? "space-y-4 pb-24 lg:pb-6" : "space-y-4 pb-6"}>
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
            {isNonPart && (
              <Badge className="border-0 bg-gray-100 text-gray-700">
                Заявка «Не участвует»
              </Badge>
            )}
            {autoEscalated && (
              <Badge className="border-0 bg-amber-100 text-amber-800">
                <Zap className="mr-1 size-3" />
                Авто-передано КД
              </Badge>
            )}
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

      {/* Non-blocking просрочка note (spec §4.5.2): record, never hard-stop. */}
      {sla.overdue > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">
            Просрочка проверки: +{sla.overdue} раб. дн. сверх срока. Это{" "}
            <span className="font-medium">не блокирует</span> завершение —
            зафиксировано в истории и может быть согласовано позже.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {isNonPart ? "Заявка на неучастие" : "Отправленные строки КМ"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isNonPart
                  ? "КМ запросил освобождение от участия в акции."
                  : `Снимок отправленной версии (только чтение)${
                      canAct
                        ? " — выберите строки для отклонения или согласуйте весь набор."
                        : "."
                    }`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setTimeout(() => setHistoryOpen(true), 0)}
            >
              <History className="size-4" />
              История
            </Button>
          </CardHeader>
          <CardContent>
            {isNonPart ? (
              <div className="rounded-lg border bg-gray-50 p-4">
                <p className="text-xs font-medium text-gray-600">
                  {item.nonParticipationByKd
                    ? "Причина (установлено КД)"
                    : "Причина неучастия (КМ)"}
                </p>
                <p className="mt-1 text-sm text-gray-800">
                  {item.nonParticipationReason ?? "Причина не указана."}
                </p>
              </div>
            ) : (
              <SubmittedLinesPanel
                lines={lines}
                feedback={item.lineFeedback}
                selectable={canAct}
                selectedIds={selected}
                onToggle={toggle}
                onToggleAll={toggleAll}
                onRejectLine={(lineId) =>
                  openFlow({ kind: "reject-lines", lineIds: [lineId] })
                }
              />
            )}
          </CardContent>
        </Card>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <ReviewActionsPanel
            item={item}
            canAct={canAct}
            actingReviewer={actingReviewer}
            autoEscalated={autoEscalated}
            isKd={isKd}
            decision={decision}
            lineCount={lines.length}
            selectedCount={selected.size}
            onApproveAll={handleApproveAll}
            onRejectSelected={() =>
              openFlow({ kind: "reject-lines", lineIds: [...selected] })
            }
            onRejectSet={() => openFlow({ kind: "reject-set" })}
            onApproveNonParticipation={handleApproveAll}
            onRejectNonParticipation={() => openFlow({ kind: "reject-nonpart" })}
            onKdSetNonParticipation={() => openFlow({ kind: "kd-set-nonpart" })}
          />
        </div>
      </div>

      {canAct && (
        <MobileReviewActionBar
          item={item}
          selectedCount={selected.size}
          onApproveAll={handleApproveAll}
          onRejectSelected={() =>
            openFlow({ kind: "reject-lines", lineIds: [...selected] })
          }
          onRejectSet={() => openFlow({ kind: "reject-set" })}
          onApproveNonParticipation={handleApproveAll}
          onRejectNonParticipation={() => openFlow({ kind: "reject-nonpart" })}
        />
      )}

      <ReasonDialog
        open={flow !== null}
        onOpenChange={(o) => {
          if (!o) setFlow(null);
        }}
        title={copy?.title ?? ""}
        description={copy?.description}
        reasonRequired={copy?.required ?? true}
        reasonLabel={
          flow?.kind === "kd-set-nonpart" ? "Причина (рекомендуется)" : "Причина"
        }
        confirmLabel={copy?.confirm ?? "Подтвердить"}
        destructive={flow?.kind !== "kd-set-nonpart"}
        onConfirm={confirmReason}
      />

      <VersionHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        reviewComments={item.comments}
        overdueDays={sla.overdue}
      />
    </div>
  );
}
