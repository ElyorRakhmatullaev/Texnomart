"use client";

import * as React from "react";
import { AlertTriangle, Ban, Copy, Lock, Pencil, Plus, X } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@texnomart/ui/table";
import { Checkbox } from "@texnomart/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@texnomart/ui/tooltip";
import { cn } from "@texnomart/ui/utils";
import { Money } from "../../../components/Money";
import {
  ROW_KIND_LABEL,
  approvalCounters,
  pluralRows,
  type ApprovalRow,
  type ApprovalRowKind,
} from "../../../lib/approval-card";
import {
  getNomenclatureItem,
  type LineFeedback,
  type PromoLine,
} from "../../../lib/promo-mock-data";

interface SubmittedLinesPanelProps {
  /** Whole-promo rows (§4), already classified. */
  rows: ApprovalRow[];
  /** Per-line reviewer feedback (rejection + comment), keyed by line id. */
  feedback: Record<string, LineFeedback>;
  /** Reviewer mode — show the select column + per-line reject affordance. */
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (lineId: string) => void;
  onToggleAll?: (checked: boolean) => void;
  onRejectLine?: (lineId: string) => void;
  /** §7/§15 — open the side panel with «Было/Стало» + decisions. */
  onOpenRow?: (lineId: string) => void;
  /** §12 — counters belong to the repeat-approval card; the primary flow stays as-is. */
  showCounters?: boolean;
}

/** Whether a line reads as rejected — reviewer feedback wins over the seed flag. */
function isRejected(line: PromoLine, fb?: LineFeedback): boolean {
  return fb ? fb.rejected : !!line.rejected;
}
function rejectComment(line: PromoLine, fb?: LineFeedback): string | undefined {
  return fb?.comment ?? line.rejectComment;
}

const REPEAT_ICON: Partial<Record<ApprovalRowKind, React.ElementType>> = {
  change: Pencil,
  addition: Plus,
  removal: Ban,
};

/** «Согласовано ранее» + замок / тип повторного действия — вместо колонки статуса (§13). */
function RowMarker({ row }: { row: ApprovalRow }) {
  const label = ROW_KIND_LABEL[row.kind] || row.status;
  if (row.isRepeat) {
    const Icon = REPEAT_ICON[row.kind] ?? Pencil;
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded bg-orange-100 dark:bg-orange-500/20 px-1.5 py-0.5 text-[11px] font-medium text-orange-800 dark:text-orange-300">
        <Icon className="size-3" />
        {label}
      </span>
    );
  }
  if (row.kind === "approved-earlier") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded bg-gray-100 dark:bg-muted px-1.5 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300">
        <Lock className="size-3" />
        Согласовано ранее
      </span>
    );
  }
  if (row.kind === "primary") return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded bg-gray-100 dark:bg-muted px-1.5 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300">
      {label}
    </span>
  );
}

/**
 * Список номенклатур промо в карточке согласования (Волна 3, R57 §4–§6, §11–§14).
 *
 * Показывает ВЕСЬ список позиций акции для полного контекста; решения возможны только
 * по строкам с повторным действием текущего КМ (или по первичному набору — прежний
 * поток S3). Ранее согласованные строки — только просмотр, с замком и без чекбокса.
 * Отдельной колонки статуса нет: признак повторного действия — светло-оранжевая
 * подсветка и детали в боковой панели.
 */
export function SubmittedLinesPanel({
  rows,
  feedback,
  selectable = false,
  selectedIds,
  onToggle,
  onToggleAll,
  onRejectLine,
  onOpenRow,
  showCounters = false,
}: SubmittedLinesPanelProps) {
  const [onlyChanges, setOnlyChanges] = React.useState(false);

  const counters = approvalCounters(rows);
  const hasRepeat = rows.some((r) => r.isRepeat);
  const visible = onlyChanges ? rows.filter((r) => r.requiresDecision) : rows;

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-white dark:bg-card py-12 text-center text-sm text-muted-foreground">
        КМ ещё не добавил номенклатуру.
      </div>
    );
  }

  const decidableIds = rows.filter((r) => r.requiresDecision).map((r) => r.line.id);
  const selectedCount = decidableIds.filter((id) => selectedIds?.has(id)).length;
  const allChecked =
    selectedCount === decidableIds.length && decidableIds.length > 0;
  const headerChecked: boolean | "indeterminate" = allChecked
    ? true
    : selectedCount > 0
      ? "indeterminate"
      : false;

  return (
    <div className="space-y-3">
      {/* §12 счётчик + §11 переключатель «Все строки / Только изменения» */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          showCounters ? "justify-between" : "justify-end"
        )}
      >
        <p className={cn("text-xs text-muted-foreground", !showCounters && "hidden")}>
          На согласовании:{" "}
          <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {counters.pending}
          </span>{" "}
          {pluralRows(counters.pending)} ·{" "}
          <span className="whitespace-nowrap">
            Согласовано ранее:{" "}
            <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
              {counters.approvedEarlier}
            </span>{" "}
            {pluralRows(counters.approvedEarlier)}
          </span>
        </p>
        {hasRepeat && (
          <div className="inline-flex rounded-md border bg-white dark:bg-card p-0.5">
            {[
              { value: false, label: "Все строки" },
              { value: true, label: "Только изменения" },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setOnlyChanges(opt.value)}
                className={cn(
                  "flex-none whitespace-nowrap rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  onlyChanges === opt.value
                    ? "bg-gray-900 dark:bg-primary text-white dark:text-primary-foreground"
                    : "text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border bg-white dark:bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-muted/40">
              <TableRow>
                {selectable && (
                  <TableHead className="w-[44px]">
                    <Checkbox
                      checked={headerChecked}
                      onCheckedChange={(c) => onToggleAll?.(c === true)}
                      aria-label="Выбрать все строки, требующие решения"
                      disabled={decidableIds.length === 0}
                    />
                  </TableHead>
                )}
                <TableHead className="min-w-[220px]">Номенклатура</TableHead>
                <TableHead className="text-right">Остаток</TableHead>
                <TableHead className="text-right">Новая цена</TableHead>
                <TableHead className="text-right">Скидка</TableHead>
                <TableHead className="text-right">Прогноз продаж</TableHead>
                {selectable && <TableHead className="w-[44px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((row) => {
                const line = row.line;
                const nom = getNomenclatureItem(line.nomenclatureId);
                const fb = feedback[line.id];
                const rejected = isRejected(line, fb);
                const comment = rejectComment(line, fb);
                const decidable = selectable && row.requiresDecision;
                const clickable = Boolean(onOpenRow) && row.isRepeat;
                return (
                  <TableRow
                    key={line.id}
                    onClick={clickable ? () => onOpenRow?.(line.id) : undefined}
                    className={cn(
                      // §6 — светло-оранжевая подсветка только для повторных действий
                      row.isRepeat && "bg-orange-50/70 dark:bg-orange-500/10",
                      rejected && "bg-red-50/70 dark:bg-red-500/10",
                      row.kind === "context" &&
                        line.removed &&
                        "text-muted-foreground line-through",
                      clickable && "cursor-pointer"
                    )}
                  >
                    {selectable && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {decidable ? (
                          <Checkbox
                            checked={selectedIds?.has(line.id) ?? false}
                            onCheckedChange={() => onToggle?.(line.id)}
                            aria-label="Выбрать строку"
                          />
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex size-7 items-center justify-center text-muted-foreground/60">
                                <Lock className="size-3.5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[260px]">
                              Строка не требует решения на этом этапе.
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-start gap-1.5">
                        <span className="min-w-0">
                          <span className="block font-medium text-gray-900 dark:text-gray-100">
                            {nom?.name ?? line.nomenclatureId}
                          </span>
                          <span className="block text-xs tabular-nums text-muted-foreground">
                            {line.nomenclatureId}
                          </span>
                        </span>
                        <RowMarker row={row} />
                        {line.duplicate && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 dark:bg-amber-500/20 px-1 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                                <Copy className="size-3" />
                                дубль
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[260px]">
                              {line.duplicateInfo?.samePromo
                                ? "Номенклатура уже добавлена в эту акцию."
                                : `Дубль с акцией ${line.duplicateInfo?.promoName ?? ""}.`}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {rejected && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-0.5 rounded bg-red-100 dark:bg-red-500/20 px-1 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-300">
                                <AlertTriangle className="size-3" />
                                отклонено
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[280px]">
                              {comment ?? "Строка отклонена."}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.stock.toLocaleString("ru-RU")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Money value={line.newPrice} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.discountPct}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.salesForecast != null ? (
                        line.salesForecast.toLocaleString("ru-RU")
                      ) : (
                        <span className="text-xs font-medium text-red-600 dark:text-red-400">
                          не заполнено
                        </span>
                      )}
                    </TableCell>
                    {selectable && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {decidable && !rejected && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => onRejectLine?.(line.id)}
                                className={cn(
                                  "inline-flex size-7 items-center justify-center rounded-md",
                                  "text-muted-foreground hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-red-700 dark:hover:text-red-300"
                                )}
                                aria-label="Отклонить строку"
                              >
                                <X className="size-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Отклонить строку</TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
