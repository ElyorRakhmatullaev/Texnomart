"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  FileClock,
  FilePlus2,
  History,
  Info,
  MessageSquare,
  Minus,
  Plus,
  Send,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@texnomart/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@texnomart/ui/tabs";
import { Badge } from "@texnomart/ui/badge";
import { Button } from "@texnomart/ui/button";
import { cn } from "@texnomart/ui/utils";
import { RuDate } from "./RuDate";
import type {
  CampaignReportRow,
  CampaignVersion,
  DeadlineChangeRequest,
  ReviewComment,
  VersionChangeType,
  VersionFieldChange,
} from "../lib/promo-mock-data";

const CHANGE_TYPE_STYLE: Record<VersionChangeType, string> = {
  "Первичная отправка": "bg-blue-50 text-blue-700",
  "Корректировка": "bg-amber-50 text-amber-700",
  "Добавление": "bg-emerald-50 text-emerald-700",
  "Отмена": "bg-red-50 text-red-700",
  "Отправка отчёта": "bg-violet-50 text-violet-700",
};

// Stub fallback so consumers that don't pass versions (e.g. the approvals detail
// page, which only surfaces review comments) still render a non-empty history.
const STUB_VERSIONS: CampaignVersion[] = [
  {
    id: "stub-v2",
    campaignId: "stub",
    version: 2,
    date: new Date(2026, 10, 24, 14, 32),
    author: "Алиев Бекзод",
    role: "Категорийный менеджер (КМ)",
    changeType: "Корректировка",
    summary: "Изменена новая цена по 3 позициям.",
    changes: [],
  },
  {
    id: "stub-v1",
    campaignId: "stub",
    version: 1,
    date: new Date(2026, 10, 20, 17, 48),
    author: "Алиев Бекзод",
    role: "Категорийный менеджер (КМ)",
    changeType: "Первичная отправка",
    summary: "Первичная отправка данных на согласование.",
    changes: [],
  },
];

type ViewKey = "changes" | "report" | "history";

interface VersionHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Header context, e.g. «PR-2026-001 · Чёрная пятница 2026». */
  campaignLabel?: string;
  /** Full version history, newest-first. Falls back to a stub when omitted. */
  versions?: CampaignVersion[];
  /** Current snapshot rows for «Полный актуальный отчёт». */
  currentReport?: CampaignReportRow[];
  /**
   * «Создать корректировку» — shown only when provided (editor roles on the full
   * calendar, when there are no pending edit-after-approval changes). Rollback is
   * NOT supported (§5.2.1): a revert is a new correction that re-enters approval.
   */
  onCreateCorrection?: () => void;
  /**
   * Live edit-after-approval draft (§5.1) — un-sent changes vs the last sent
   * version. Surfaced as a «Черновик (не отправлено)» section + footer actions.
   */
  pendingChanges?: VersionFieldChange[];
  /** Re-approval routing state for the pending draft (§11.8). */
  reapprovalState?: "none" | "awaiting-marketing" | "ready";
  /** Маркетинг re-approval action (provided only for the marketing role). */
  onMarketingReapprove?: () => void;
  /** КД «Согласовать и отправить смежным отделам» (provided only for КД). */
  onSendToDepartments?: () => void;
  /** S3 review comments (rejections / «Не участвует») surfaced as a log. */
  reviewComments?: ReviewComment[];
  /** Non-blocking просрочка note (КД exceeded the review SLA) — shown in red. */
  overdueDays?: number;
  /** S4 Phase 3 deadline-change request (§4.7) — surfaced as a log entry. */
  deadlineChange?: DeadlineChangeRequest;
}

/**
 * Right-side Sheet with three views over a campaign's version history (spec §5.1,
 * §7.1): «Только изменения» (the per-field diff), «Полный актуальный отчёт» (the
 * current snapshot), «История версий» (the full version list). Previous versions
 * are never deleted; rollback is unsupported — «Создать корректировку» starts a
 * new correction instead. Additively surfaces the S3 review-comment log + a
 * non-blocking просрочка note.
 */
export function VersionHistoryDrawer({
  open,
  onOpenChange,
  campaignLabel,
  versions = STUB_VERSIONS,
  currentReport,
  onCreateCorrection,
  pendingChanges,
  reapprovalState = "none",
  onMarketingReapprove,
  onSendToDepartments,
  reviewComments,
  overdueDays = 0,
  deadlineChange,
}: VersionHistoryDrawerProps) {
  const [view, setView] = React.useState<ViewKey>("history");
  const hasPending = !!pendingChanges && pendingChanges.length > 0;

  // Versions that actually carry a field-level diff (for «Только изменения»).
  const changeVersions = React.useMemo(
    () => versions.filter((v) => v.changes.length > 0),
    [versions]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            <History className="size-5" />
            История и изменения
          </SheetTitle>
          <SheetDescription>
            {campaignLabel ? `${campaignLabel}. ` : ""}Предыдущие версии не
            удаляются. Откат не поддерживается — изменения вносятся новой
            корректировкой.
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={view}
          onValueChange={(v) => setView(v as ViewKey)}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b bg-transparent p-0 px-4">
            <ViewTab value="changes" label="Только изменения" />
            <ViewTab value="report" label="Полный актуальный отчёт" />
            <ViewTab value="history" label="История версий" />
          </TabsList>

          {/* ── Только изменения — per-field diff per version ── */}
          <TabsContent
            value="changes"
            className="m-0 flex-1 overflow-y-auto p-4"
          >
            {hasPending && (
              <div className="mb-3 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                    <FileClock className="size-4" />
                    Черновик — не отправлено
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-amber-700">
                  Изменения после согласования. До отправки смежным отделам не
                  передаются.
                </p>
                <ul className="mt-2 space-y-1.5">
                  {pendingChanges!.map((c, i) => (
                    <DiffRow key={i} change={c} />
                  ))}
                </ul>
              </div>
            )}
            {changeVersions.length === 0 && !hasPending ? (
              <EmptyNote text="Изменённых полей пока нет — есть только первичная отправка." />
            ) : (
              <div className="space-y-3">
                {changeVersions.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-lg border bg-card p-3 shadow-[0px_2px_4px_rgba(204,204,204,0.25)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <Badge
                          className={`${CHANGE_TYPE_STYLE[v.changeType]} border-0 rounded-full text-xs`}
                        >
                          {v.changeType}
                        </Badge>
                        <span className="text-xs font-medium text-gray-500">
                          в. {v.version}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        <RuDate value={v.date} withTime />
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {v.changes.map((c, i) => (
                        <DiffRow key={i} change={c} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Полный актуальный отчёт — current snapshot ── */}
          <TabsContent
            value="report"
            className="m-0 flex-1 overflow-y-auto p-4"
          >
            {!currentReport || currentReport.length === 0 ? (
              <EmptyNote text="Актуальный отчёт недоступен — в акции пока нет строк." />
            ) : (
              <div className="space-y-2">
                {currentReport.map((row) => (
                  <div
                    key={row.lineId}
                    className={cn(
                      "rounded-lg border bg-card p-3",
                      row.removed && "border-red-200 bg-red-50/60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-sm font-medium text-gray-900",
                          row.removed && "text-red-700 line-through"
                        )}
                      >
                        {row.nomenclature}
                      </span>
                      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                        {row.code}
                      </span>
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                      {row.fields.map((f) => (
                        <div key={f.label} className="flex flex-col">
                          <dt className="text-[11px] text-muted-foreground">
                            {f.label}
                          </dt>
                          <dd
                            className={cn(
                              "text-sm tabular-nums text-gray-800",
                              f.value === "не заполнено" &&
                                "font-medium text-red-500"
                            )}
                          >
                            {f.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── История версий — full version list + S3 surfacing ── */}
          <TabsContent
            value="history"
            className="m-0 flex-1 space-y-3 overflow-y-auto p-4"
          >
            {overdueDays > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
                <p className="text-sm text-red-700">
                  Просрочка проверки: +{overdueDays}{" "}
                  {overdueDays === 1 ? "рабочий день" : "раб. дн."}. Не блокирует
                  отправку — зафиксировано в истории.
                </p>
              </div>
            )}

            {deadlineChange && (
              <div
                className={cn(
                  "rounded-lg border p-3",
                  deadlineChange.status === "approved"
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                )}
              >
                <h3
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-semibold",
                    deadlineChange.status === "approved"
                      ? "text-emerald-800"
                      : "text-amber-800"
                  )}
                >
                  <CalendarClock className="size-4" />
                  Изменение дедлайна заполнения
                  <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium">
                    {deadlineChange.status === "approved"
                      ? "утверждено"
                      : "на утверждении"}
                  </span>
                </h3>
                <p className="mt-1.5 text-sm tabular-nums text-gray-800">
                  {deadlineChange.oldDeadline.toLocaleDateString("ru-RU")} →{" "}
                  <span className="font-semibold">
                    {deadlineChange.newDeadline.toLocaleDateString("ru-RU")}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-gray-600">
                  Причина: {deadlineChange.reason}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Инициатор: {deadlineChange.initiator}
                  {deadlineChange.approvedBy
                    ? ` · Утвердил: ${deadlineChange.approvedBy}`
                    : " · Требуется утверждение вышестоящего руководства (§4.7)"}
                </p>
              </div>
            )}

            {reviewComments && reviewComments.length > 0 && (
              <div className="rounded-lg border bg-card p-3">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  Комментарии проверки
                </h3>
                <ul className="mt-2 space-y-2">
                  {reviewComments.map((c, i) => (
                    <li
                      key={i}
                      className={cn(
                        "rounded-md border-l-2 bg-gray-50 px-2.5 py-1.5",
                        c.lineIds ? "border-l-red-300" : "border-l-gray-300"
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span className="font-medium text-gray-700">
                          {c.author}
                        </span>
                        <RuDate value={new Date(c.at)} withTime />
                        {c.lineIds && (
                          <span className="rounded bg-red-100 px-1 text-[11px] font-medium text-red-700">
                            строк: {c.lineIds.length}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-800">{c.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {versions.map((v) => (
              <div
                key={v.id}
                className="rounded-lg border bg-card p-3 shadow-[0px_2px_4px_rgba(204,204,204,0.25)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Badge
                      className={`${CHANGE_TYPE_STYLE[v.changeType]} border-0 rounded-full text-xs`}
                    >
                      {v.changeType}
                    </Badge>
                    <span className="text-xs font-medium text-gray-500">
                      в. {v.version}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    <RuDate value={v.date} withTime />
                  </span>
                </div>
                <p className="mt-2 text-sm">{v.summary}</p>
                {v.changes.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Изменённых полей: {v.changes.length}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {v.author} · {v.role}
                </p>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {hasPending ? (
          <SheetFooter className="border-t p-4">
            {reapprovalState === "awaiting-marketing" ? (
              <div className="flex items-start gap-2 rounded-md bg-orange-50 px-3 py-2 text-xs text-orange-800">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Ожидает повторного согласования маркетинга (§11.8). Изменения
                  (кроме добавления товаров) не отправятся, пока маркетинг не
                  согласует.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Готово к отправке смежным отделам — будут переданы только
                  изменённые/добавленные данные (инкрементально).
                </span>
              </div>
            )}
            {onMarketingReapprove && reapprovalState === "awaiting-marketing" && (
              <Button className="w-full" onClick={onMarketingReapprove}>
                <Check className="size-4" />
                Согласовать изменения (маркетинг)
              </Button>
            )}
            {onSendToDepartments && (
              <Button
                className="w-full"
                disabled={reapprovalState === "awaiting-marketing"}
                onClick={onSendToDepartments}
              >
                <Send className="size-4" />
                Согласовать и отправить смежным отделам
              </Button>
            )}
          </SheetFooter>
        ) : (
          onCreateCorrection && (
            <SheetFooter className="border-t p-4">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Откат к предыдущей версии не выполняется. Чтобы внести
                  изменения, отредактируйте ячейки строки прямо в календаре —
                  корректировка пройдёт согласование заново.
                </span>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={onCreateCorrection}
              >
                <FilePlus2 className="size-4" />
                Как создать корректировку
              </Button>
            </SheetFooter>
          )
        )}
      </SheetContent>
    </Sheet>
  );
}

function ViewTab({ value, label }: { value: ViewKey; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="flex-none whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-2 py-2.5 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:shadow-none"
    >
      {label}
    </TabsTrigger>
  );
}

function DiffRow({ change }: { change: VersionFieldChange }) {
  const tint =
    change.kind === "added"
      ? "text-emerald-700"
      : change.kind === "removed"
        ? "text-red-700"
        : "text-amber-700";
  const Icon =
    change.kind === "added" ? Plus : change.kind === "removed" ? Minus : ArrowRight;
  return (
    <li className="rounded-md bg-gray-50 px-2.5 py-1.5 text-sm">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className={cn("size-3", tint)} />
        <span className="truncate font-medium text-gray-700">
          {change.scope}
        </span>
        <span>·</span>
        <span>{change.field}</span>
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 tabular-nums">
        {change.from != null && (
          <span className="text-gray-400 line-through">{change.from}</span>
        )}
        {change.from != null && change.to != null && (
          <ArrowRight className="size-3 text-muted-foreground" />
        )}
        {change.to != null && (
          <span className={cn("font-medium", tint)}>{change.to}</span>
        )}
      </div>
    </li>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Info className="size-8 text-muted-foreground/50" />
      <p className="mt-2 max-w-[260px] text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
