"use client";

import * as React from "react";
import {
  History,
  MessageSquare,
  Send,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@texnomart/ui/sheet";
import { Button } from "@texnomart/ui/button";
import { cn } from "@texnomart/ui/utils";
import { formatPromoNo } from "../../../lib/promo-mock-data";
import { STAGE_LABEL } from "../../../lib/plan-approval";
import type {
  PlanApprovalCycle,
  PlanRejectionEvent,
  PlanReviewerStage,
  PlanRowJournal,
} from "../../../lib/plan-store";

// «10-я часть» Волна 4 — правая панель строки плана. Поглощает прежний
// `PlanRejectionDrawer` («7-я часть» §9): секция «Запрос на удаление» (R30.2,
// с кнопками решения для действующей роли), «Текущий цикл» и «История
// согласования» по всем прежним циклам (R30.1).
//
// Обратная совместимость: если журнала по строке нет, панель рендерит прежний
// вид из legacy `rejectionLog` — без слияния и дедупликации.

interface PlanRowHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rowId: string | null;
  rowName?: string;
  journal?: PlanRowJournal;
  /** Отклонения из legacy-слайса — показываются, когда журнала нет. */
  legacyEvents: PlanRejectionEvent[];
  /** Этап, на котором ТЕКУЩАЯ роль может решить судьбу запроса на удаление. */
  removalStage?: PlanReviewerStage;
  onApproveRemoval?: () => void;
  onRejectRemoval?: () => void;
}

function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString("ru-RU") +
    " " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
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

function CycleBlock({
  cycle,
  current,
}: {
  cycle: PlanApprovalCycle;
  current?: boolean;
}) {
  const stages: PlanReviewerStage[] = ["kd", "od"];
  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border p-3",
        current ? "border-primary/40 bg-primary/5" : "bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-200">
          <Send className="size-3.5" />
          Цикл {cycle.no}
          {current ? " — текущий" : ""}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {fmtDateTime(cycle.sentAt)}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        Отправил: {cycle.sentBy}
      </div>

      {stages.map((s) => {
        const d = cycle[s];
        if (!d) return null;
        const rejected = d.decision === "rejected";
        return (
          <div
            key={s}
            className={cn(
              "space-y-1 rounded-md border p-2",
              rejected
                ? "border-red-200 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/10"
                : "border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  rejected
                    ? "text-red-700 dark:text-red-300"
                    : "text-emerald-700 dark:text-emerald-300"
                )}
              >
                {rejected ? (
                  <ThumbsDown className="size-3.5" />
                ) : (
                  <ThumbsUp className="size-3.5" />
                )}
                {STAGE_LABEL[s]} — {rejected ? "отклонил" : "согласовал"}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {fmtDateTime(d.at)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">{d.by}</div>
            {d.comment && (
              <p className="flex items-start gap-1.5 text-sm leading-snug text-gray-900 dark:text-gray-100">
                <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                {d.comment}
              </p>
            )}
          </div>
        );
      })}

      {cycle.closedAt && (
        <div className="flex items-center gap-1.5 border-t pt-2 text-xs text-muted-foreground">
          <Undo2 className="size-3.5" />
          {cycle.closedReason === "edit"
            ? "Цикл закрыт правкой строки"
            : "Цикл закрыт возвратом на доработку"}{" "}
          · <span className="tabular-nums">{fmtDateTime(cycle.closedAt)}</span>
        </div>
      )}
    </div>
  );
}

function RemovalBlock({
  journal,
  removalStage,
  onApprove,
  onReject,
}: {
  journal: PlanRowJournal;
  removalStage?: PlanReviewerStage;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const req = journal.removal;
  if (!req) return null;
  return (
    <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50/60 p-3 dark:border-orange-500/30 dark:bg-orange-500/10">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-orange-800 dark:text-orange-200">
        <Trash2 className="size-4" />
        Запрос на удаление строки
      </div>
      <div className="space-y-2">
        <DetailRow label="Кто запросил" value={req.requestedBy} />
        <DetailRow
          label="Дата и время"
          value={<span className="tabular-nums">{fmtDateTime(req.requestedAt)}</span>}
        />
      </div>
      <div className="space-y-1 border-t border-orange-200/60 pt-2 dark:border-orange-500/20">
        <span className="text-xs text-muted-foreground">Причина</span>
        <p className="text-sm leading-snug text-gray-900 dark:text-gray-100">
          {req.reason || "—"}
        </p>
      </div>

      <div className="space-y-1.5 border-t border-orange-200/60 pt-2 dark:border-orange-500/20">
        <span className="text-xs text-muted-foreground">
          Требуется согласование
        </span>
        <ul className="space-y-1">
          {req.requiredStages.map((s) => {
            const d = req[s];
            return (
              <li key={s} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-900 dark:text-gray-100">
                  {STAGE_LABEL[s]}
                </span>
                {d ? (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      d.decision === "approved"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-red-700 dark:text-red-300"
                    )}
                  >
                    {d.decision === "approved" ? "Согласовал" : "Отклонил"} ·{" "}
                    <span className="tabular-nums">{fmtDateTime(d.at)}</span>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Ожидает решения
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {removalStage && (
        <div className="flex flex-wrap gap-2 border-t border-orange-200/60 pt-2 dark:border-orange-500/20">
          <Button size="sm" onClick={onApprove}>
            <ThumbsUp className="size-4" />
            Согласовать удаление
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onReject}
          >
            <ThumbsDown className="size-4" />
            Отклонить удаление
          </Button>
        </div>
      )}
    </div>
  );
}

/** Прежний вид «7-й части» §9 — используется, когда журнала по строке нет. */
function LegacyRejections({ events }: { events: PlanRejectionEvent[] }) {
  const latest = events.find((e) => e.kind !== "return");
  return (
    <div className="space-y-4">
      {latest ? (
        <div className="space-y-2.5 rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-500/30 dark:bg-red-500/10">
          <DetailRow label="Кто отклонил" value={latest.by} />
          <DetailRow label="Роль согласующего" value={latest.role} />
          <DetailRow
            label="Дата и время"
            value={<span className="tabular-nums">{fmtDateTime(latest.at)}</span>}
          />
          <div className="space-y-1 border-t border-red-200/60 pt-2.5 dark:border-red-500/20">
            <span className="text-xs text-muted-foreground">Комментарий</span>
            <p className="text-sm leading-snug text-gray-900 dark:text-gray-100">
              {latest.comment || "—"}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          По этой строке ещё нет событий согласования. Они появятся здесь после
          отправки на согласование и решений согласующих.
        </div>
      )}

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
                      {isReturn ? "Возврат на доработку" : "Отклонение"}
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
  );
}

export function PlanRowHistoryDrawer({
  open,
  onOpenChange,
  rowId,
  rowName,
  journal,
  legacyEvents,
  removalStage,
  onApproveRemoval,
  onRejectRemoval,
}: PlanRowHistoryDrawerProps) {
  const cycles = journal?.cycles ?? [];
  const hasJournal = cycles.length > 0 || Boolean(journal?.removal);
  const current = cycles[cycles.length - 1];
  const previous = cycles.slice(0, -1).reverse(); // новые сверху

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            <History className="size-5 text-muted-foreground" />
            История согласования строки
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
          {journal?.removal && (
            <RemovalBlock
              journal={journal}
              removalStage={removalStage}
              onApprove={onApproveRemoval}
              onReject={onRejectRemoval}
            />
          )}

          {hasJournal ? (
            <>
              {current && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Текущий цикл
                  </h3>
                  <CycleBlock cycle={current} current />
                </div>
              )}

              {previous.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    История согласования
                  </h3>
                  <div className="space-y-2">
                    {previous.map((c) => (
                      <CycleBlock key={c.no} cycle={c} />
                    ))}
                  </div>
                </div>
              )}

              {(journal?.removalHistory?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Завершённые запросы на удаление
                  </h3>
                  <ol className="space-y-2">
                    {journal?.removalHistory?.map((r, i) => (
                      <li
                        key={`${r.requestedAt}-${i}`}
                        className="space-y-1 rounded-lg border bg-muted/30 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-200">
                            <Trash2 className="size-3.5" />
                            Запрос на удаление
                          </span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {fmtDateTime(r.requestedAt)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.requestedBy}
                        </div>
                        <p className="text-sm leading-snug text-gray-900 dark:text-gray-100">
                          {r.reason}
                        </p>
                        {r.requiredStages.map((s) => {
                          const d = r[s];
                          if (!d) return null;
                          return (
                            <div key={s} className="text-xs text-muted-foreground">
                              {STAGE_LABEL[s]}:{" "}
                              {d.decision === "approved" ? "согласовал" : "отклонил"}
                              {d.comment ? ` — ${d.comment}` : ""}
                            </div>
                          );
                        })}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          ) : (
            <LegacyRejections events={legacyEvents} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
