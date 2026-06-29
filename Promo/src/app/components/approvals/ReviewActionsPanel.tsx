"use client";

import { Check, Info, MessageSquare, UserMinus, X, Zap } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { cn } from "@texnomart/ui/utils";
import { RuDate } from "../../../components/RuDate";
import type { PromoRole } from "../../role-context";
import {
  type CampaignDecisionSummary,
  type ReviewItem,
} from "../../../lib/promo-mock-data";

interface ReviewActionsPanelProps {
  item: ReviewItem;
  /** Whether the current role may act on this item now. */
  canAct: boolean;
  /** The role that must act (for the «Сейчас действует» note). */
  actingReviewer?: PromoRole;
  /** Live auto-escalation: a breached Старший-КМ item now acted on by the КД. */
  autoEscalated: boolean;
  /** Current role is the Коммерческий директор (may set «Не участвует» directly). */
  isKd: boolean;
  /** Campaign-level advance gate (every КМ needs a final decision). */
  decision: CampaignDecisionSummary;
  lineCount: number;
  selectedCount: number;
  // data-set actions
  onApproveAll: () => void;
  onRejectSelected: () => void;
  onRejectSet: () => void;
  // «Не участвует» actions
  onApproveNonParticipation: () => void;
  onRejectNonParticipation: () => void;
  /** КД sets «Не участвует» directly for this КМ (only shown for КД on a data set). */
  onKdSetNonParticipation: () => void;
}

/** A short note for why the panel is read-only (terminal status or wrong role). */
function readonlyNote(item: ReviewItem, actingReviewer?: PromoRole): string {
  switch (item.kmStatus) {
    case "Согласовано КД":
      return "Набор согласован коммерческим директором.";
    case "Не участвует":
      return item.nonParticipationByKd
        ? "«Не участвует» установлено коммерческим директором — финальное решение."
        : "«Не участвует» согласовано — КМ освобождён от участия.";
    case "Переотправлено на корректировку КМ":
      return "Набор возвращён КМ на корректировку.";
    case "Отменена":
      return "Акция отменена — согласование закрыто.";
    default:
      return actingReviewer
        ? `Сейчас действует: ${actingReviewer}.`
        : "Действия недоступны.";
  }
}

/** The action buttons (data set vs «Не участвует» request). */
function ActionButtons({
  item,
  selectedCount,
  onApproveAll,
  onRejectSelected,
  onRejectSet,
  onApproveNonParticipation,
  onRejectNonParticipation,
}: Pick<
  ReviewActionsPanelProps,
  | "item"
  | "selectedCount"
  | "onApproveAll"
  | "onRejectSelected"
  | "onRejectSet"
  | "onApproveNonParticipation"
  | "onRejectNonParticipation"
>) {
  if (item.kind === "non-participation") {
    return (
      <div className="space-y-2">
        <Button className="w-full" onClick={onApproveNonParticipation}>
          <Check className="size-4" />
          Согласовать неучастие
        </Button>
        <Button
          variant="outline"
          className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
          onClick={onRejectNonParticipation}
        >
          <X className="size-4" />
          Отклонить — КМ заполняет данные
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={onApproveAll}>
        <Check className="size-4" />
        Согласовать всё
      </Button>
      <Button
        variant="outline"
        className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
        disabled={selectedCount === 0}
        onClick={onRejectSelected}
      >
        <X className="size-4" />
        Отклонить выбранные{selectedCount > 0 ? ` (${selectedCount})` : ""}
      </Button>
      <Button
        variant="ghost"
        className="w-full text-red-700 hover:bg-red-50 hover:text-red-700"
        onClick={onRejectSet}
      >
        Отклонить весь набор
      </Button>
    </div>
  );
}

export function ReviewActionsPanel(props: ReviewActionsPanelProps) {
  const {
    item,
    canAct,
    actingReviewer,
    autoEscalated,
    isKd,
    decision,
    lineCount,
    selectedCount,
    onKdSetNonParticipation,
  } = props;

  const isNonPart = item.kind === "non-participation";
  // КД may set «Не участвует» directly for a КМ whose data set isn't yet final.
  const kdCanSetNonPart =
    isKd && !isNonPart && item.kmStatus !== "Согласовано КД";

  return (
    <div className="space-y-4">
      {/* Actions — buttons hidden below lg (mobile uses the fixed bottom bar). */}
      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">
          {isNonPart ? "Решение по «Не участвует»" : "Действия согласования"}
        </h2>

        {autoEscalated && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
            <Zap className="mt-0.5 size-3.5 shrink-0" />
            Авто-передано КД по истечении срока (Старший КМ не отреагировал за 2
            раб. дн.).
          </p>
        )}

        {isNonPart && item.nonParticipationReason && (
          <div className="mt-2 rounded-lg border-l-2 border-l-gray-300 bg-gray-50 px-2.5 py-1.5">
            <p className="text-xs font-medium text-gray-600">
              {item.nonParticipationByKd
                ? "Причина (установлено КД)"
                : "Причина неучастия (КМ)"}
            </p>
            <p className="mt-0.5 text-sm text-gray-800">
              {item.nonParticipationReason}
            </p>
          </div>
        )}

        {canAct ? (
          <>
            {!isNonPart && (
              <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                Строк: {lineCount} · Выбрано: {selectedCount}
              </p>
            )}

            <div className="mt-3 hidden lg:block">
              <ActionButtons {...props} />
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              {isNonPart
                ? "«Не участвует» — это объект согласования: кампания не перейдёт дальше, пока по нему нет финального решения (§4.5.1)."
                : "Отклонение любой строки требует комментарий и возвращает весь набор КМ на корректировку (§4.5.2)."}
            </p>
          </>
        ) : (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            {readonlyNote(item, actingReviewer)}
          </p>
        )}

        {kdCanSetNonPart && (
          <div className="mt-3 border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-gray-700"
              onClick={onKdSetNonParticipation}
            >
              <UserMinus className="size-4" />
              Установить «Не участвует» для КМ
            </Button>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Финальное решение КД — КМ не может его отменить.
            </p>
          </div>
        )}
      </div>

      {/* Advance gate — every КМ needs a final decision before the campaign moves on. */}
      <div className="rounded-xl border bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900">Готовность кампании</h3>
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          Финальных решений КМ: {decision.finalised} из {decision.total}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn(
              "h-full rounded-full",
              decision.canAdvance ? "bg-emerald-500" : "bg-amber-400"
            )}
            style={{
              width: `${decision.total ? (decision.finalised / decision.total) * 100 : 0}%`,
            }}
          />
        </div>
        <p
          className={cn(
            "mt-2 text-xs",
            decision.canAdvance ? "text-emerald-700" : "text-amber-700"
          )}
        >
          {decision.canAdvance
            ? "Все КМ имеют финальное решение — кампания может перейти на следующий уровень."
            : `Кампания не может перейти дальше: по ${decision.pending} КМ нет финального решения (§4.5.1).`}
        </p>
      </div>

      {item.comments.length > 0 && (
        <div className="rounded-xl border bg-white p-4">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
            <MessageSquare className="size-4 text-muted-foreground" />
            Комментарии проверки
          </h3>
          <ul className="mt-3 space-y-3">
            {item.comments.map((c, i) => (
              <li
                key={i}
                className={cn(
                  "rounded-lg border-l-2 bg-gray-50 px-3 py-2",
                  c.lineIds ? "border-l-red-300" : "border-l-gray-300"
                )}
              >
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <span className="font-medium text-gray-700">{c.author}</span>
                  <RuDate value={new Date(c.at)} withTime />
                  {c.lineIds && (
                    <span className="rounded bg-red-100 px-1 text-[11px] font-medium text-red-700">
                      строк: {c.lineIds.length}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-800">{c.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Mobile/tablet fixed bottom action bar (below lg) — the spec's «sticky bottom bar»
 * for the stacked layout. A fixed bar is more reliable than sticky on short pages
 * (see tasks/lessons.md). Rendered only when the current role may act.
 */
export function MobileReviewActionBar(
  props: Pick<
    ReviewActionsPanelProps,
    | "item"
    | "selectedCount"
    | "onApproveAll"
    | "onRejectSelected"
    | "onRejectSet"
    | "onApproveNonParticipation"
    | "onRejectNonParticipation"
  >
) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white p-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] lg:hidden">
      <ActionButtons {...props} />
    </div>
  );
}
