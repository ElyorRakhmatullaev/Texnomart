"use client";

import * as React from "react";
import { MessageSquare, ThumbsDown, Undo2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@texnomart/ui/sheet";
import { cn } from "@texnomart/ui/utils";
import { formatPromoNo } from "../../../lib/promo-mock-data";
import type { PlanRejectionEvent } from "../../../lib/plan-store";

// «7-я часть» §9 — the right side panel behind the clickable «Отклонено» status in
// «План акций»: on top — the LATEST actual rejection (кто отклонил · роль согласующего ·
// дата и время · комментарий, the client's единое поле «Комментарий», §9.2); below —
// the full rejection/return history when the plan bounced more than once (§9.3).

interface PlanRejectionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rowId: string | null;
  rowName?: string;
  /** Newest-first rejection/return events of the row (from `plan-store`). */
  events: PlanRejectionEvent[];
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString("ru-RU") +
    " " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
}

function kindLabel(kind: PlanRejectionEvent["kind"]): string {
  return kind === "return" ? "Возврат на доработку" : "Отклонение";
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm text-gray-900 dark:text-gray-100">
        {value}
      </span>
    </div>
  );
}

export function PlanRejectionDrawer({
  open,
  onOpenChange,
  rowId,
  rowName,
  events,
}: PlanRejectionDrawerProps) {
  // The latest ACTUAL rejection (returns are history, not the headline).
  const latest = events.find((e) => e.kind !== "return");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            <ThumbsDown className="size-5 text-red-500" />
            Детали отклонения
          </SheetTitle>
          <SheetDescription>
            {rowId ? (
              <span className="tabular-nums">
                № {formatPromoNo(rowId)}
                {rowName ? ` · ${rowName}` : ""}
              </span>
            ) : (
              "Строка плана"
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Latest rejection — the headline block (§9.2). */}
          {latest ? (
            <div className="space-y-2.5 rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-500/30 dark:bg-red-500/10">
              <DetailRow label="Кто отклонил" value={latest.by} />
              <DetailRow label="Роль согласующего" value={latest.role} />
              <DetailRow label="Дата и время" value={<span className="tabular-nums">{fmtDateTime(latest.at)}</span>} />
              <div className="space-y-1 border-t border-red-200/60 pt-2.5 dark:border-red-500/20">
                <span className="text-xs text-muted-foreground">Комментарий</span>
                <p className="text-sm leading-snug text-gray-900 dark:text-gray-100">
                  {latest.comment || "—"}
                </p>
              </div>
            </div>
          ) : (
            // Pre-«7-я часть» snapshots may hold a rejected decision without a logged
            // event — degrade gracefully instead of showing an empty panel.
            <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
              Комментарий этого отклонения не был сохранён (отклонение выполнено до
              включения журнала). Новые отклонения будут записываться с деталями.
            </div>
          )}

          {/* Full history (§9.3) — shown when there is more than the headline event. */}
          {events.length > (latest ? 1 : 0) && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                История отклонений
              </h3>
              <ol className="space-y-2">
                {events.map((e, i) => {
                  const isReturn = e.kind === "return";
                  return (
                    <li
                      key={`${e.at}-${i}`}
                      className={cn(
                        "rounded-lg border p-3",
                        isReturn
                          ? "bg-muted/30"
                          : "border-red-100 bg-red-50/30 dark:border-red-500/20 dark:bg-red-500/5"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium",
                            isReturn
                              ? "text-gray-600 dark:text-gray-300"
                              : "text-red-700 dark:text-red-300"
                          )}
                        >
                          {isReturn ? (
                            <Undo2 className="size-3.5" />
                          ) : (
                            <ThumbsDown className="size-3.5" />
                          )}
                          {kindLabel(e.kind)}
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {fmtDateTime(e.at)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {e.by} · {e.role}
                      </div>
                      {e.comment && (
                        <p className="mt-1.5 flex items-start gap-1.5 text-sm leading-snug text-gray-900 dark:text-gray-100">
                          <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                          {e.comment}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
