"use client";

import { Check, Clock, FilePen, Pencil, Send, Trash2, TriangleAlert, X } from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { Checkbox } from "@texnomart/ui/checkbox";
import { Button } from "@texnomart/ui/button";
import {
  formatPromoNo,
  getPlanApproval,
  PLAN_DIRECTOR_SLA_WORKING_DAYS,
  PLAN_MARKETING_REVIEW_LEAD_DAYS,
  PLAN_MARKETING_SUBMIT_LEAD_DAYS,
  type PlanStageDirector,
  type PlanStageMarketing,
  type PlanStageStatus,
} from "../../../lib/promo-mock-data";

// Per-campaign plan approval (client feedback §5): for each plan row, the approval
// progress is shown separately across the three directors — when the stage was sent /
// decided, whether «В срок» or «Просрочка +N дн.», or «Ожидает этапа» when not reached.
//
// «6-я часть» feedback layers a per-row LIFECYCLE on top (№2/№5/№7): every row carries
// a «Статус строки» — «Черновик» (draft, тип optional) → «Отправлено» (sent for approval,
// can't be re-sent) → «Согласовано»/«Отклонено» (reviewer decision, №4). In send mode the
// leading checkbox targets the drafts the marketing director picks to send; in review mode
// it targets the sent rows the КД/ОД decides. The marketing director also gets per-row
// «Изменить»/«Удалить» (№6).

export interface PlanRowData {
  id: string;
  type: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

/** Live decision the current reviewer made for a row at the active stage (№3). */
export type RowDecision = "approved" | "rejected";

/** Per-row send lifecycle («6-я часть» №2/№5/№7). */
export type PlanRowSend = "draft" | "sent";

interface PlanApprovalTableProps {
  rows: PlanRowData[];
  /** Reviewer / send mode: render the leading checkbox column. */
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
  onToggleAll?: () => void;
  allSelected?: boolean;
  someSelected?: boolean;
  /** Whether THIS row shows a checkbox in the active mode (others show only the badge). */
  rowCheckable?: (id: string) => boolean;
  /** Live per-row reviewer decision at the active stage — drives the badge + row tint. */
  decisionFor?: (id: string) => RowDecision | undefined;
  /** Per-row send lifecycle badge («Черновик»/«Отправлено»). */
  sendStatusFor?: (id: string) => PlanRowSend | undefined;
  /** True when a draft row has no тип selected (№2 gate) — red marker in the тип cell. */
  typeMissing?: (id: string) => boolean;
  /** Marketing row management (№6): edit any row; delete drafts only. */
  canManage?: boolean;
  onEditRow?: (id: string) => void;
  onDeleteRow?: (id: string) => void;
}

function formatDateTime(d: Date): string {
  return (
    d.toLocaleDateString("ru-RU") +
    " " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("ru-RU");
}

function StageStatusBadge({
  status,
  overdueDays,
}: {
  status: PlanStageStatus;
  overdueDays?: number;
}) {
  if (status === "waiting") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-muted dark:text-gray-400">
        <Clock className="size-3" />
        Ожидает этапа
      </span>
    );
  }
  if (status === "onTime") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        <Check className="size-3" />В срок
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">
      <TriangleAlert className="size-3" />
      Просрочка +{overdueDays ?? 0} дн.
    </span>
  );
}

/**
 * The single «Статус строки» pill computed from the send state + reviewer decision
 * (№2/№4/№5/№7): «Черновик» → «Отправлено» → «Согласовано»/«Отклонено».
 */
function RowLifecycleBadge({
  send,
  decision,
}: {
  send?: PlanRowSend;
  decision?: RowDecision;
}) {
  if (send === "sent" && decision === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        <Check className="size-3" />
        Согласовано
      </span>
    );
  }
  if (send === "sent" && decision === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">
        <X className="size-3" />
        Отклонено
      </span>
    );
  }
  if (send === "sent") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
        <Send className="size-3" />
        Отправлено
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-muted dark:text-gray-300">
      <FilePen className="size-3" />
      Черновик
    </span>
  );
}

function MarketingCell({ stage }: { stage?: PlanStageMarketing }) {
  if (!stage) return <Dash />;
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs tabular-nums text-gray-700 dark:text-gray-200">
        <span className="text-muted-foreground">Озн.:</span>{" "}
        {formatDateTime(stage.reviewedAt)}
      </div>
      <div className="text-xs tabular-nums text-gray-700 dark:text-gray-200">
        <span className="text-muted-foreground">Отпр.:</span>{" "}
        {formatDateTime(stage.sentAt)}
      </div>
      <StageStatusBadge status={stage.status} overdueDays={stage.overdueDays} />
    </div>
  );
}

function DirectorCell({ stage }: { stage?: PlanStageDirector }) {
  if (!stage) return <Dash />;
  return (
    <div className="flex flex-col gap-1">
      {stage.decidedAt && (
        <div className="text-xs tabular-nums text-gray-700 dark:text-gray-200">
          {formatDateTime(stage.decidedAt)}
        </div>
      )}
      <StageStatusBadge status={stage.status} overdueDays={stage.overdueDays} />
    </div>
  );
}

function Dash() {
  return <span className="text-xs text-muted-foreground">—</span>;
}

/** Тип cell — a red «Тип не выбран» marker when a draft is missing its type (№2). */
function TypeCell({ type, missing }: { type: string; missing?: boolean }) {
  if (missing) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
        <TriangleAlert className="size-3" />
        Тип не выбран
      </span>
    );
  }
  return <span className="text-gray-600 dark:text-gray-300">{type || "—"}</span>;
}

function RowActions({
  id,
  isDraft,
  onEdit,
  onDelete,
}: {
  id: string;
  isDraft: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs"
        onClick={() => onEdit?.(id)}
      >
        <Pencil className="size-3.5" />
        Изменить
      </Button>
      {isDraft && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-destructive hover:text-destructive"
          onClick={() => onDelete?.(id)}
        >
          <Trash2 className="size-3.5" />
          Удалить
        </Button>
      )}
    </div>
  );
}

function StageHeader({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">{title}</span>
      <span className="text-[10px] font-normal leading-tight text-muted-foreground">
        {note}
      </span>
    </div>
  );
}

// Sticky header (tracker V2-13): `sticky` is applied per-`<th>` (not `<thead>`/`<tr>`,
// unreliable across browsers) with a SOLID background so scrolling rows don't bleed
// through. `top-[-16px]` cancels the AppShell `<main>`'s `p-4` (16px) so the header sits
// flush at the content top — same trick as `ShortCalendarTable`'s `-top-4`. This only
// works because the desktop wrapper below no longer has `overflow-x-auto` (that inner
// scroll container would otherwise trap the sticky offset instead of the page).
const HEAD =
  "sticky top-[-16px] z-20 px-3 py-2 text-left align-bottom border-b bg-gray-100 dark:bg-muted text-[13px] font-semibold text-gray-700 dark:text-gray-200";
const CELL = "px-3 py-3 align-top border-b border-gray-100 dark:border-border";

export function PlanApprovalTable({
  rows,
  selectable = false,
  selectedIds,
  onToggle,
  onToggleAll,
  allSelected = false,
  someSelected = false,
  rowCheckable,
  decisionFor,
  sendStatusFor,
  typeMissing,
  canManage = false,
  onEditRow,
  onDeleteRow,
}: PlanApprovalTableProps) {
  const marketingNote = `ознакомление: за ${PLAN_MARKETING_REVIEW_LEAD_DAYS} кал. дн · отправка на согл.: за ${PLAN_MARKETING_SUBMIT_LEAD_DAYS} кал. дн`;
  const directorNote = `согласование: ${PLAN_DIRECTOR_SLA_WORKING_DAYS} раб. дн`;

  const headerCheck: boolean | "indeterminate" = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;

  // A row shows a checkbox only when the active mode says it's selectable; by default
  // (no predicate) every row is checkable (backward-compatible with the plain reviewer).
  const showCheckbox = (id: string) =>
    selectable && (rowCheckable ? rowCheckable(id) : true);

  return (
    <>
      {/* Desktop: table. No `overflow-x-auto` here on purpose — that inner scroll
          container would trap `position:sticky` on the header (CSS one-axis quirk:
          `overflow-x-auto` silently sets `overflow-y:auto` too). A wide table now
          overflows into the PAGE's own horizontal scrollbar instead, so the `<thead>`
          can stick to the page's vertical scroll (tracker V2-13, plan Option 2). */}
      <div className="hidden md:block">
        <table className="w-full min-w-[1200px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              {selectable && (
                <th className={cn(HEAD, "w-[52px]")}>
                  <Checkbox
                    checked={headerCheck}
                    onCheckedChange={() => onToggleAll?.()}
                    aria-label="Выбрать все акции"
                  />
                </th>
              )}
              <th className={cn(HEAD, "w-[130px]")}>Статус строки</th>
              <th className={cn(HEAD, "w-[120px]")}>Код акции</th>
              <th className={cn(HEAD, "w-[140px]")}>Тип акции</th>
              <th className={cn(HEAD, "min-w-[200px]")}>Наименование акции</th>
              <th className={cn(HEAD, "w-[180px]")}>Период действия</th>
              <th className={cn(HEAD, "w-[200px]")}>
                <StageHeader title="Директор маркетинга" note={marketingNote} />
              </th>
              <th className={cn(HEAD, "w-[170px]")}>
                <StageHeader title="Коммерческий директор" note={directorNote} />
              </th>
              <th className={cn(HEAD, "w-[170px]")}>
                <StageHeader title="Операционный директор" note={directorNote} />
              </th>
              {canManage && <th className={cn(HEAD, "w-[160px]")}>Действия</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const appr = getPlanApproval(r.id);
              const decision = decisionFor?.(r.id);
              const send = sendStatusFor?.(r.id);
              const checked = selectedIds?.has(r.id) ?? false;
              const isDraft = send === "draft";
              return (
                <tr
                  key={r.id}
                  className={cn(
                    "hover:bg-gray-50/60 dark:hover:bg-accent",
                    decision === "approved" &&
                      "bg-emerald-50/40 dark:bg-emerald-500/10",
                    decision === "rejected" && "bg-red-50/40 dark:bg-red-500/10"
                  )}
                >
                  {selectable && (
                    <td className={cn(CELL, "align-middle")}>
                      {showCheckbox(r.id) ? (
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => onToggle?.(r.id)}
                          aria-label={`Выбрать акцию ${formatPromoNo(r.id)}`}
                        />
                      ) : null}
                    </td>
                  )}
                  <td className={cn(CELL, "align-middle")}>
                    <RowLifecycleBadge send={send} decision={decision} />
                  </td>
                  <td
                    className={cn(
                      CELL,
                      "text-xs font-medium tabular-nums text-muted-foreground"
                    )}
                  >
                    {formatPromoNo(r.id)}
                  </td>
                  <td className={CELL}>
                    <TypeCell type={r.type} missing={typeMissing?.(r.id)} />
                  </td>
                  <td className={cn(CELL, "font-medium text-gray-900 dark:text-gray-100")}>
                    {r.name}
                  </td>
                  <td className={cn(CELL, "tabular-nums text-gray-700 dark:text-gray-200")}>
                    {formatDate(r.startDate)} — {formatDate(r.endDate)}
                  </td>
                  <td className={CELL}>
                    <MarketingCell stage={appr?.marketing} />
                  </td>
                  <td className={CELL}>
                    <DirectorCell stage={appr?.kd} />
                  </td>
                  <td className={CELL}>
                    <DirectorCell stage={appr?.od} />
                  </td>
                  {canManage && (
                    <td className={cn(CELL, "align-middle")}>
                      <RowActions
                        id={r.id}
                        isDraft={isDraft}
                        onEdit={onEditRow}
                        onDelete={onDeleteRow}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 p-4 md:hidden">
        {rows.map((r) => {
          const appr = getPlanApproval(r.id);
          const decision = decisionFor?.(r.id);
          const send = sendStatusFor?.(r.id);
          const checked = selectedIds?.has(r.id) ?? false;
          const isDraft = send === "draft";
          return (
            <div
              key={r.id}
              className={cn(
                "rounded-lg border bg-white p-3 dark:bg-card",
                decision === "approved" &&
                  "border-emerald-200 bg-emerald-50/40 dark:border-emerald-500/30 dark:bg-emerald-500/10",
                decision === "rejected" &&
                  "border-red-200 bg-red-50/40 dark:border-red-500/30 dark:bg-red-500/10"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {showCheckbox(r.id) && (
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggle?.(r.id)}
                      aria-label={`Выбрать акцию ${formatPromoNo(r.id)}`}
                    />
                  )}
                  <RowLifecycleBadge send={send} decision={decision} />
                </div>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {formatPromoNo(r.id)}
                </span>
              </div>
              <div className="mt-1.5 font-medium text-gray-900 dark:text-gray-100">{r.name}</div>
              <div className="mt-0.5">
                <TypeCell type={r.type} missing={typeMissing?.(r.id)} />
              </div>
              <div className="text-xs tabular-nums text-muted-foreground">
                {formatDate(r.startDate)} — {formatDate(r.endDate)}
              </div>
              <dl className="mt-3 space-y-2 border-t pt-3">
                <div>
                  <dt className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Директор маркетинга
                  </dt>
                  <dd className="mt-1">
                    <MarketingCell stage={appr?.marketing} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Коммерческий директор
                  </dt>
                  <dd className="mt-1">
                    <DirectorCell stage={appr?.kd} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Операционный директор
                  </dt>
                  <dd className="mt-1">
                    <DirectorCell stage={appr?.od} />
                  </dd>
                </div>
              </dl>
              {canManage && (
                <div className="mt-3 border-t pt-2">
                  <RowActions
                    id={r.id}
                    isDraft={isDraft}
                    onEdit={onEditRow}
                    onDelete={onDeleteRow}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
