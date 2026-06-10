"use client";

import { Check, Info, MessageSquare, X } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { cn } from "@texnomart/ui/utils";
import { RuDate } from "../../../components/RuDate";
import type { PromoRole } from "../../role-context";
import { type ReviewItem } from "../../../lib/promo-mock-data";

interface ReviewActionsPanelProps {
  item: ReviewItem;
  /** Whether the current role may act on this item now. */
  canAct: boolean;
  /** The role that must act (for the «Сейчас действует» note). */
  actingReviewer?: PromoRole;
  lineCount: number;
  selectedCount: number;
  onApproveAll: () => void;
  onRejectSelected: () => void;
  onRejectSet: () => void;
}

/** A short note for why the panel is read-only (terminal status or wrong role). */
function readonlyNote(item: ReviewItem, actingReviewer?: PromoRole): string {
  switch (item.kmStatus) {
    case "Принято коммерческим директором":
      return "Набор принят коммерческим директором.";
    case "Согласовано старшим КМ (ожидает КД)":
      return "Согласовано старшим КМ — ожидает коммерческого директора.";
    case "Не заполнено / Ожидание корректировки от КМ":
      return "Набор возвращён КМ на корректировку.";
    default:
      return actingReviewer
        ? `Сейчас действует: ${actingReviewer}.`
        : "Действия недоступны.";
  }
}

export function ReviewActionsPanel({
  item,
  canAct,
  actingReviewer,
  lineCount,
  selectedCount,
  onApproveAll,
  onRejectSelected,
  onRejectSet,
}: ReviewActionsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">
          Действия согласования
        </h2>

        {canAct ? (
          <>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              Строк: {lineCount} · Выбрано: {selectedCount}
            </p>

            <div className="mt-3 space-y-2">
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

            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Отклонение любой строки требует комментарий и возвращает весь набор
              КМ на корректировку (§4.5.2).
            </p>
          </>
        ) : (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            {readonlyNote(item, actingReviewer)}
          </p>
        )}
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
