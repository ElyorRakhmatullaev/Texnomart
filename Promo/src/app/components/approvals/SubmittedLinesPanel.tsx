"use client";

import { AlertTriangle, Copy, X } from "lucide-react";
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
  getNomenclatureItem,
  type LineFeedback,
  type PromoLine,
} from "../../../lib/promo-mock-data";

interface SubmittedLinesPanelProps {
  lines: PromoLine[];
  /** Per-line reviewer feedback (rejection + comment), keyed by line id. */
  feedback: Record<string, LineFeedback>;
  /** Reviewer mode — show the select column + per-line reject affordance. */
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (lineId: string) => void;
  onToggleAll?: (checked: boolean) => void;
  onRejectLine?: (lineId: string) => void;
}

/** Whether a line reads as rejected — reviewer feedback wins over the seed flag. */
function isRejected(line: PromoLine, fb?: LineFeedback): boolean {
  return fb ? fb.rejected : !!line.rejected;
}
function rejectComment(line: PromoLine, fb?: LineFeedback): string | undefined {
  return fb?.comment ?? line.rejectComment;
}

/**
 * Snapshot of the КМ's submitted lines (the «submitted version», spec §11.2).
 * Rejected lines render tinted with the reviewer comment in a tooltip (row-level
 * review feedback, shared with the full calendar §4.5.2). In reviewer mode it adds
 * a select column and a per-line «Отклонить».
 */
export function SubmittedLinesPanel({
  lines,
  feedback,
  selectable = false,
  selectedIds,
  onToggle,
  onToggleAll,
  onRejectLine,
}: SubmittedLinesPanelProps) {
  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-white py-12 text-center text-sm text-muted-foreground">
        КМ ещё не добавил номенклатуру.
      </div>
    );
  }

  const selectableIds = lines.map((l) => l.id);
  const selectedCount = selectableIds.filter((id) => selectedIds?.has(id)).length;
  const allChecked =
    selectedCount === selectableIds.length && selectableIds.length > 0;
  const headerChecked: boolean | "indeterminate" = allChecked
    ? true
    : selectedCount > 0
      ? "indeterminate"
      : false;

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              {selectable && (
                <TableHead className="w-[44px]">
                  <Checkbox
                    checked={headerChecked}
                    onCheckedChange={(c) => onToggleAll?.(c === true)}
                    aria-label="Выбрать все строки"
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
            {lines.map((line) => {
              const nom = getNomenclatureItem(line.nomenclatureId);
              const fb = feedback[line.id];
              const rejected = isRejected(line, fb);
              const comment = rejectComment(line, fb);
              return (
                <TableRow
                  key={line.id}
                  className={rejected ? "bg-red-50/70" : undefined}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds?.has(line.id) ?? false}
                        onCheckedChange={() => onToggle?.(line.id)}
                        aria-label="Выбрать строку"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-start gap-1.5">
                      <span className="min-w-0">
                        <span className="block font-medium text-gray-900">
                          {nom?.name ?? line.nomenclatureId}
                        </span>
                        <span className="block text-xs tabular-nums text-muted-foreground">
                          {line.nomenclatureId}
                        </span>
                      </span>
                      {line.duplicate && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.5 text-[11px] font-medium text-amber-800">
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
                            <span className="inline-flex items-center gap-0.5 rounded bg-red-100 px-1 py-0.5 text-[11px] font-medium text-red-700">
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
                      <span className="text-xs font-medium text-red-600">
                        не заполнено
                      </span>
                    )}
                  </TableCell>
                  {selectable && (
                    <TableCell>
                      {!rejected && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => onRejectLine?.(line.id)}
                              className={cn(
                                "inline-flex size-7 items-center justify-center rounded-md",
                                "text-muted-foreground hover:bg-red-50 hover:text-red-700"
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
  );
}
