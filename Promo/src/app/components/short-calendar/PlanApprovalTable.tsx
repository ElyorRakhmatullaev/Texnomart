"use client";

import { Check, Clock, FilePen, History, Pencil, Send, Trash2, TriangleAlert, Users, X } from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { Checkbox } from "@texnomart/ui/checkbox";
import { Button } from "@texnomart/ui/button";
import {
  formatPromoNo,
  PLAN_DIRECTOR_SLA_WORKING_DAYS,
  PLAN_MARKETING_REVIEW_LEAD_DAYS,
  PLAN_MARKETING_SUBMIT_LEAD_DAYS,
  type PlanStageStatus,
} from "../../../lib/promo-mock-data";
import {
  directorStageCell,
  marketingStageCell,
  type StageCellData,
} from "../../../lib/plan-approval";
import type { PlanRowJournal } from "../../../lib/plan-store";

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
//
// «10-я часть» Волна 4 (T4): stage cells are derived from the per-row approval journal
// (`lib/plan-approval.ts`) instead of the static `PLAN_APPROVALS` seed directly — the
// derivation layer falls back to the seed internally when a row has no live journal, so
// seed-only rows render exactly as before. Adds the «Удаление на согласовании» row state
// (R30.2) and an always-visible «История» action (all roles).

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
  /**
   * Журнал строки (Волна 4). Без него ячейки этапов читаются из сида
   * `PLAN_APPROVALS` — ровно сегодняшнее поведение.
   */
  journalFor?: (id: string) => PlanRowJournal | undefined;
  /** Открыть боковую панель истории строки (доступна всем ролям). */
  onShowHistory?: (id: string) => void;
  /** Волна 6: доступно ли КД распределение промо по КМ/дням/категориям для этой строки. */
  canDistribute?: (id: string) => boolean;
  /** Волна 6: открыть форму распределения. */
  onDistribute?: (id: string) => void;
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

const UNIT_LABEL: Record<"cal" | "work", string> = {
  cal: "кал. дн.",
  work: "раб. дн.",
};

function StageStatusBadge({
  status,
  overdueDays,
  unit = "work",
}: {
  status: PlanStageStatus;
  overdueDays?: number;
  unit?: "cal" | "work";
}) {
  const u = UNIT_LABEL[unit];
  if (status === "waiting") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-muted dark:text-gray-400">
        <Clock className="size-3" />
        Ожидает согласования
        {overdueDays ? (
          <span className="font-semibold text-red-600 dark:text-red-400">
            · просрочка +{overdueDays} {u}
          </span>
        ) : null}
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
      Просрочка +{overdueDays ?? 0} {u}
    </span>
  );
}

/**
 * The single «Статус строки» pill computed from the send state + reviewer decision
 * (№2/№4/№5/№7): «Черновик» → «Отправлено» → «Согласовано»/«Отклонено». Волна 4 (R30.2)
 * adds «Удаление на согласовании» as the top-priority branch — an active removal request
 * overrides every other row state.
 */
function RowLifecycleBadge({
  send,
  decision,
  removalPending,
  onRejectedClick,
  onRemovalClick,
}: {
  send?: PlanRowSend;
  decision?: RowDecision;
  /** R30.2 — активный запрос на удаление перекрывает остальные состояния. */
  removalPending?: boolean;
  /** When provided, the «Отклонено» pill becomes a button opening the details panel (§9). */
  onRejectedClick?: () => void;
  onRemovalClick?: () => void;
}) {
  if (removalPending) {
    return (
      <button
        type="button"
        onClick={onRemovalClick}
        title="Показать запрос на удаление"
        className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 underline decoration-orange-300 decoration-dotted underline-offset-2 transition-colors hover:bg-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:decoration-orange-500/50 dark:hover:bg-orange-500/25"
      >
        <Trash2 className="size-3" />
        Удаление на согласовании
      </button>
    );
  }
  if (send === "sent" && decision === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        <Check className="size-3" />
        Согласовано
      </span>
    );
  }
  if (send === "sent" && decision === "rejected") {
    if (onRejectedClick) {
      return (
        <button
          type="button"
          onClick={onRejectedClick}
          title="Показать детали отклонения"
          className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 underline decoration-red-300 decoration-dotted underline-offset-2 transition-colors hover:bg-red-100 dark:bg-red-500/15 dark:text-red-300 dark:decoration-red-500/50 dark:hover:bg-red-500/25"
        >
          <X className="size-3" />
          Отклонено
        </button>
      );
    }
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

/** Метка цикла — выводится ТОЛЬКО в маркетинговой колонке, чтобы не троиться. */
function CycleTag({ no }: { no?: number }) {
  if (!no) return null;
  return (
    <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
      Цикл {no}
    </span>
  );
}

function MarketingCell({ cell }: { cell?: StageCellData }) {
  if (!cell) return <Dash />;
  return (
    <div className="flex flex-col gap-1">
      {cell.reviewedAt && (
        <div className="text-xs tabular-nums text-gray-700 dark:text-gray-200">
          <span className="text-muted-foreground">Озн.:</span>{" "}
          {formatDateTime(cell.reviewedAt)}
        </div>
      )}
      {cell.sentAt && (
        <div className="text-xs tabular-nums text-gray-700 dark:text-gray-200">
          <span className="text-muted-foreground">Отпр.:</span>{" "}
          {formatDateTime(cell.sentAt)}
        </div>
      )}
      <StageStatusBadge
        status={cell.status}
        overdueDays={cell.overdueDays}
        unit={cell.unit}
      />
      <CycleTag no={cell.cycleNo} />
    </div>
  );
}

function DirectorCell({ cell }: { cell?: StageCellData }) {
  if (!cell) return <Dash />;
  return (
    <div className="flex flex-col gap-1">
      {cell.decidedAt && (
        <div className="text-xs tabular-nums text-gray-700 dark:text-gray-200">
          {formatDateTime(cell.decidedAt)}
        </div>
      )}
      <StageStatusBadge
        status={cell.status}
        overdueDays={cell.overdueDays}
        unit={cell.unit}
      />
      {cell.by && (
        <span className="text-[10px] text-muted-foreground">{cell.by}</span>
      )}
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

/**
 * Задача 7 (R30.2): «Удалить» гейтится только `canManage && !removalPending` —
 * для не-черновика `handleDelete` теперь открывает диалог запроса на удаление
 * через согласование, а не молча выходит, поэтому черновик-only гейт (Волна 4,
 * Задача 4) снят. «История» — всем ролям и всегда, «Изменить» — пока удаление
 * не на согласовании.
 */
function RowActions({
  id,
  canManage,
  removalPending,
  onHistory,
  onEdit,
  onDelete,
  canDistribute,
  onDistribute,
}: {
  id: string;
  canManage: boolean;
  removalPending: boolean;
  onHistory?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  canDistribute?: boolean;
  onDistribute?: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {/* Доступна всем ролям: история согласования — не действие владельца. */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs"
        onClick={() => onHistory?.(id)}
      >
        <History className="size-3.5" />
        История
      </Button>
      {/* Пока удаление на согласовании — строку не правят. */}
      {canManage && !removalPending && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => onEdit?.(id)}
        >
          <Pencil className="size-3.5" />
          Изменить
        </Button>
      )}
      {/* Удаление согласованной строки — через запрос (R30.2), см. handleDelete. */}
      {canManage && !removalPending && (
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
      {/* Волна 6: необязательное распределение промо по КМ / дням / категориям —
          действие коммерческого директора (или уполномоченного лица) на строке,
          уже отправленной на согласование. Обычная кнопка, не Radix-меню: меню
          под shared <Button> рендерится за экраном (уроки Волны 1). */}
      {canDistribute && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          title="Распределить по категориям / КМ"
          aria-label="Распределить по категориям / КМ"
          onClick={() => onDistribute?.(id)}
        >
          <Users className="size-3.5" />
          Распределить
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
  canDistribute,
  onDistribute,
  journalFor,
  onShowHistory,
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
          can stick to the page's vertical scroll (tracker V2-13, plan Option 2).
          I-1 (ревью Задачи 7): `w-fit` + `bg-card` — the ancestor `Card` lost
          `overflow-clip` (T7) and stays narrower than `min-w-[1320px]`, so without
          this the table's opaque sticky header (and the transparent body cells behind
          it) painted past the Card's own background/border onto the page's bg —
          a disconnected-looking patch. Sizing THIS wrapper to its own content (instead
          of 100% of Card) makes its `bg-card` extend exactly as wide as the table
          itself, closing the gap — Card's own box (and everything anchored to its
          width, incl. the sticky bottom action strip) is untouched. */}
      <div className="hidden md:block w-fit bg-card">
        <table className="w-full min-w-[1320px] border-separate border-spacing-0 text-sm">
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
              {/* 11-я часть R28.3: «№ промо» — единый термин вместо «Код акции». */}
              <th className={cn(HEAD, "w-[120px]")}>№ промо</th>
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
              <th className={cn(HEAD, "w-[300px]")}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const journal = journalFor?.(r.id);
              const rowRef = { id: r.id, startDate: r.startDate };
              const removalPending = Boolean(journal?.removal);
              const decision = decisionFor?.(r.id);
              const send = sendStatusFor?.(r.id);
              const checked = selectedIds?.has(r.id) ?? false;
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
                    <RowLifecycleBadge
                      send={send}
                      decision={decision}
                      removalPending={removalPending}
                      onRejectedClick={
                        onShowHistory ? () => onShowHistory(r.id) : undefined
                      }
                      onRemovalClick={
                        onShowHistory ? () => onShowHistory(r.id) : undefined
                      }
                    />
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
                    <MarketingCell cell={marketingStageCell(rowRef, journal)} />
                  </td>
                  <td className={CELL}>
                    <DirectorCell cell={directorStageCell("kd", rowRef, journal)} />
                  </td>
                  <td className={CELL}>
                    <DirectorCell cell={directorStageCell("od", rowRef, journal)} />
                  </td>
                  <td className={cn(CELL, "align-middle")}>
                    <RowActions
                      id={r.id}
                      canManage={canManage}
                      removalPending={removalPending}
                      onHistory={onShowHistory}
                      onEdit={onEditRow}
                      onDelete={onDeleteRow}
                      canDistribute={canDistribute?.(r.id)}
                      onDistribute={onDistribute}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 p-4 md:hidden">
        {rows.map((r) => {
          const journal = journalFor?.(r.id);
          const rowRef = { id: r.id, startDate: r.startDate };
          const removalPending = Boolean(journal?.removal);
          const decision = decisionFor?.(r.id);
          const send = sendStatusFor?.(r.id);
          const checked = selectedIds?.has(r.id) ?? false;
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
                  <RowLifecycleBadge
                    send={send}
                    decision={decision}
                    removalPending={removalPending}
                    onRejectedClick={
                      onShowHistory ? () => onShowHistory(r.id) : undefined
                    }
                    onRemovalClick={
                      onShowHistory ? () => onShowHistory(r.id) : undefined
                    }
                  />
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
                    <MarketingCell cell={marketingStageCell(rowRef, journal)} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Коммерческий директор
                  </dt>
                  <dd className="mt-1">
                    <DirectorCell cell={directorStageCell("kd", rowRef, journal)} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Операционный директор
                  </dt>
                  <dd className="mt-1">
                    <DirectorCell cell={directorStageCell("od", rowRef, journal)} />
                  </dd>
                </div>
              </dl>
              <div className="mt-3 border-t pt-2">
                <RowActions
                  id={r.id}
                  canManage={canManage}
                  removalPending={removalPending}
                  onHistory={onShowHistory}
                  onEdit={onEditRow}
                  onDelete={onDeleteRow}
                  canDistribute={canDistribute?.(r.id)}
                  onDistribute={onDistribute}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
