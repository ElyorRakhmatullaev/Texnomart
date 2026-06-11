"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Check,
  CheckCheck,
  History,
  Info,
  Minus,
  ShieldAlert,
} from "lucide-react";
import { Card } from "@texnomart/ui/card";
import { Badge } from "@texnomart/ui/badge";
import { Button, buttonVariants } from "@texnomart/ui/button";
import { Checkbox } from "@texnomart/ui/checkbox";
import { Switch } from "@texnomart/ui/switch";
import { Label } from "@texnomart/ui/label";
import { cn } from "@texnomart/ui/utils";
import { RuDate } from "../../../components/RuDate";
import { OverdueTag } from "../../../components/OverdueTag";
import {
  DEPARTMENT_LABELS,
  getOverdueDays,
  getReportChangeSet,
  getReportDeadline,
  getReportSentAt,
  getReportVersionNo,
  type PromoCampaign,
  type PromoLine,
  type ReportDepartment,
} from "../../../lib/promo-mock-data";
import {
  MARKETING_EDITABLE_FIELD,
  type ReportField,
} from "./reportFields";

interface DepartmentReportViewProps {
  campaign: PromoCampaign;
  lines: PromoLine[];
  department: ReportDepartment;
  fields: ReportField[];
  /** «Показать только изменённые/добавленные данные». */
  onlyChanged: boolean;
  onToggleOnlyChanged: (v: boolean) => void;
  /** Acknowledgement (§11.4): whole report or per line. */
  acknowledgedAll: boolean;
  acknowledgedLines: Set<string>;
  onAcknowledgeAll: () => void;
  onAcknowledgeLine: (lineId: string) => void;
  onOpenHistory: () => void;
  /** Marketing — the only editable field (§7.2). */
  canEditMarketingFlag: boolean;
  flagFor: (lineId: string) => boolean;
  onToggleFlag: (lineId: string) => void;
  onBulkFlag: (lineIds: string[], value: boolean) => void;
}

export function DepartmentReportView({
  campaign,
  lines,
  department,
  fields,
  onlyChanged,
  onToggleOnlyChanged,
  acknowledgedAll,
  acknowledgedLines,
  onAcknowledgeAll,
  onAcknowledgeLine,
  onOpenHistory,
  canEditMarketingFlag,
  flagFor,
  onToggleFlag,
  onBulkFlag,
}: DepartmentReportViewProps) {
  const changeSet = getReportChangeSet(campaign.id);
  const sentAt = getReportSentAt(campaign);
  const versionNo = getReportVersionNo(campaign);
  const overdueDays = getOverdueDays(getReportDeadline(campaign), sentAt);

  const hasChangeData =
    changeSet.changedCells.length > 0 || changeSet.addedLineIds.length > 0;

  const isAcked = React.useCallback(
    (lineId: string) => acknowledgedAll || acknowledgedLines.has(lineId),
    [acknowledgedAll, acknowledgedLines]
  );
  const cellChanged = (lineId: string, fieldId: string) =>
    changeSet.changedCells.includes(`${lineId}:${fieldId}`) && !isAcked(lineId);
  const rowAdded = (lineId: string) =>
    changeSet.addedLineIds.includes(lineId) && !isAcked(lineId);
  const lineHasUnacked = (lineId: string) =>
    (changeSet.addedLineIds.includes(lineId) ||
      changeSet.changedCells.some((k) => k.startsWith(`${lineId}:`))) &&
    !isAcked(lineId);

  const unackedCount = lines.filter((l) => lineHasUnacked(l.id)).length;

  // «Только изменённые» filters to lines with an unacknowledged change/addition.
  const displayLines = React.useMemo(
    () => (onlyChanged ? lines.filter((l) => lineHasUnacked(l.id)) : lines),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lines, onlyChanged, acknowledgedAll, acknowledgedLines]
  );

  // ── marketing bulk-select (§7.2) ──
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  React.useEffect(() => {
    setSelected(new Set());
  }, [campaign.id, department]);
  const toggleSelected = (lineId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(lineId) ? next.delete(lineId) : next.add(lineId);
      return next;
    });
  const applyBulk = (value: boolean) => {
    if (!selected.size) return;
    onBulkFlag([...selected], value);
    toast.success(
      `«В рекламу» ${value ? "отмечено" : "снято"} для ${selected.size} поз.`
    );
    setSelected(new Set());
  };

  const ackAll = () => {
    onAcknowledgeAll();
    toast.success("Изменения отмечены как прочитанные. Статус акции не изменён.");
  };
  const ackLine = (lineId: string) => {
    onAcknowledgeLine(lineId);
    toast.success("Позиция отмечена прочитанной.");
  };
  const marketingApprove = () => {
    toast.success("Выбор «В рекламу» согласован. Категорийные менеджеры уведомлены.");
  };

  const showAck = canEditMarketingFlag;

  return (
    <div className="space-y-4">
      {/* ── header strip ── */}
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">
                {DEPARTMENT_LABELS[department]}
              </h2>
              <Badge className="rounded-full border-0 bg-blue-50 text-xs text-blue-700">
                Версия {versionNo}
              </Badge>
              {hasChangeData && unackedCount > 0 && (
                <Badge className="rounded-full border-0 bg-amber-100 text-xs text-amber-800">
                  Новых/изменённых: {unackedCount}
                </Badge>
              )}
            </div>
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <span>
                Получено: <RuDate value={sentAt} className="tabular-nums text-gray-700" />
              </span>
              {overdueDays > 0 && (
                <>
                  <OverdueTag days={overdueDays} />
                  <span className="text-xs text-red-600">
                    отправлено позже срока (17 кал. дн. до старта)
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasChangeData && (
              <div className="flex items-center gap-2 rounded-md border bg-gray-50 px-2.5 py-1.5">
                <Switch
                  id="only-changed"
                  checked={onlyChanged}
                  onCheckedChange={onToggleOnlyChanged}
                />
                <Label htmlFor="only-changed" className="text-xs font-normal">
                  Только изменённые
                </Label>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={onOpenHistory}>
              <History className="size-4" />
              История версий
            </Button>
            {unackedCount > 0 && (
              <Button size="sm" onClick={ackAll}>
                <CheckCheck className="size-4" />
                Ознакомиться со всеми ({unackedCount})
              </Button>
            )}
          </div>
        </div>

        {/* Ознакомление ≠ согласование (§11.7) */}
        <div className="mt-3 flex items-start gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Ознакомление не является согласованием и не меняет статус акции (§11.7).
            Отчёт доступен только для чтения
            {canEditMarketingFlag
              ? "; маркетинг может изменить только поле «В рекламу (выбрано маркетингом)»."
              : "."}
          </span>
        </div>

        {/* §11.8 re-approval reminder + marketing approve action */}
        {canEditMarketingFlag && (
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2 rounded-md bg-orange-50 px-3 py-2 text-xs text-orange-800">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Изменение уже отправленных данных требует повторного согласования
                маркетинга (§11.8). Добавление новых товаров — без повторного
                согласования.
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={marketingApprove}
            >
              <BadgeCheck className="size-4" />
              Согласовать выбор (маркетинг)
            </Button>
          </div>
        )}
      </Card>

      {/* ── marketing bulk-select strip ── */}
      {canEditMarketingFlag && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <span className="text-sm font-medium text-amber-900">
            Выбрано: {selected.size}
          </span>
          <span className="text-sm text-amber-800">· «В рекламу»:</span>
          <Button size="sm" onClick={() => applyBulk(true)}>
            Включить
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyBulk(false)}>
            Выключить
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
          >
            Сбросить
          </Button>
        </div>
      )}

      {/* ── desktop table ── */}
      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <ReportTable
            campaign={campaign}
            lines={displayLines}
            fields={fields}
            canEditMarketingFlag={canEditMarketingFlag}
            showAck={showAck}
            selected={selected}
            onToggleSelected={toggleSelected}
            flagFor={flagFor}
            onToggleFlag={onToggleFlag}
            cellChanged={cellChanged}
            rowAdded={rowAdded}
            lineHasUnacked={lineHasUnacked}
            onAcknowledgeLine={ackLine}
          />
        </div>
      </Card>

      {/* ── mobile cards (Mode B) ── */}
      <div className="space-y-3 md:hidden">
        {displayLines.length === 0 ? (
          <EmptyNote onlyChanged={onlyChanged} />
        ) : (
          displayLines.map((line) => (
            <ReportCard
              key={line.id}
              campaign={campaign}
              line={line}
              fields={fields}
              canEditMarketingFlag={canEditMarketingFlag}
              selected={selected.has(line.id)}
              onToggleSelected={() => toggleSelected(line.id)}
              flagFor={flagFor}
              onToggleFlag={onToggleFlag}
              cellChanged={cellChanged}
              added={rowAdded(line.id)}
              hasUnacked={lineHasUnacked(line.id)}
              onAcknowledge={() => ackLine(line.id)}
            />
          ))
        )}
      </div>

      {displayLines.length === 0 && (
        <div className="hidden md:block">
          <EmptyNote onlyChanged={onlyChanged} />
        </div>
      )}
    </div>
  );
}

// ── desktop table ───────────────────────────────────────────────────────────────

interface ReportTableProps {
  campaign: PromoCampaign;
  lines: PromoLine[];
  fields: ReportField[];
  canEditMarketingFlag: boolean;
  showAck: boolean;
  selected: Set<string>;
  onToggleSelected: (lineId: string) => void;
  flagFor: (lineId: string) => boolean;
  onToggleFlag: (lineId: string) => void;
  cellChanged: (lineId: string, fieldId: string) => boolean;
  rowAdded: (lineId: string) => boolean;
  lineHasUnacked: (lineId: string) => boolean;
  onAcknowledgeLine: (lineId: string) => void;
}

function ReportTable({
  campaign,
  lines,
  fields,
  canEditMarketingFlag,
  selected,
  onToggleSelected,
  flagFor,
  onToggleFlag,
  cellChanged,
  rowAdded,
  lineHasUnacked,
  onAcknowledgeLine,
}: ReportTableProps) {
  // Group header (marketing only — narrow reports have no field.group).
  const groups = React.useMemo(() => {
    const out: { label: string; span: number }[] = [];
    for (const f of fields) {
      const label = f.group ?? "";
      const last = out[out.length - 1];
      if (last && last.label === label) last.span += 1;
      else out.push({ label, span: 1 });
    }
    return out;
  }, [fields]);
  const hasGroups = fields.some((f) => f.group);

  if (lines.length === 0) {
    return null;
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        {hasGroups && (
          <tr className="border-b bg-gray-50/80">
            {canEditMarketingFlag && <th className="w-10" />}
            {groups.map((g, i) => (
              <th
                key={i}
                colSpan={g.span}
                className="border-l px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:border-l-0"
              >
                {g.label}
              </th>
            ))}
            <th />
          </tr>
        )}
        <tr className="border-b bg-gray-50/80">
          {canEditMarketingFlag && (
            <th className="sticky left-0 z-10 w-10 bg-gray-50/80 px-2 py-2" />
          )}
          {fields.map((f) => (
            <th
              key={f.id}
              className={cn(
                "whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-700",
                isNumericKind(f.kind) && "text-right",
                f.kind === "check" && "text-center"
              )}
            >
              {f.label}
            </th>
          ))}
          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">
            {/* acknowledge action column */}
          </th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => {
          const struck = line.removed || line.rejected;
          const added = rowAdded(line.id);
          return (
            <tr
              key={line.id}
              className={cn(
                "border-b last:border-0 hover:bg-gray-50/50",
                added && "bg-emerald-50/60"
              )}
            >
              {canEditMarketingFlag && (
                <td
                  className={cn(
                    "sticky left-0 z-10 bg-white px-2 py-2",
                    added && "bg-emerald-50"
                  )}
                >
                  <Checkbox
                    checked={selected.has(line.id)}
                    onCheckedChange={() => onToggleSelected(line.id)}
                    aria-label="Выбрать строку"
                  />
                </td>
              )}
              {fields.map((f) => {
                const changed = cellChanged(line.id, f.id);
                return (
                  <td
                    key={f.id}
                    className={cn(
                      "whitespace-nowrap px-3 py-2 align-middle",
                      isNumericKind(f.kind) && "text-right tabular-nums",
                      f.kind === "check" && "text-center",
                      struck && "text-gray-400 line-through",
                      changed && "bg-amber-100 ring-1 ring-inset ring-amber-300"
                    )}
                  >
                    <CellValue
                      field={f}
                      line={line}
                      campaign={campaign}
                      canEditMarketingFlag={canEditMarketingFlag}
                      flagFor={flagFor}
                      onToggleFlag={onToggleFlag}
                    />
                  </td>
                );
              })}
              <td className="whitespace-nowrap px-3 py-2 text-right">
                {lineHasUnacked(line.id) && (
                  <button
                    type="button"
                    onClick={() => onAcknowledgeLine(line.id)}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "h-8 text-xs text-emerald-700 hover:bg-emerald-50"
                    )}
                  >
                    <Check className="size-3.5" />
                    Ознакомлен
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── mobile card (Mode B) ─────────────────────────────────────────────────────────

interface ReportCardProps {
  campaign: PromoCampaign;
  line: PromoLine;
  fields: ReportField[];
  canEditMarketingFlag: boolean;
  selected: boolean;
  onToggleSelected: () => void;
  flagFor: (lineId: string) => boolean;
  onToggleFlag: (lineId: string) => void;
  cellChanged: (lineId: string, fieldId: string) => boolean;
  added: boolean;
  hasUnacked: boolean;
  onAcknowledge: () => void;
}

function ReportCard({
  campaign,
  line,
  fields,
  canEditMarketingFlag,
  selected,
  onToggleSelected,
  flagFor,
  onToggleFlag,
  cellChanged,
  added,
  hasUnacked,
  onAcknowledge,
}: ReportCardProps) {
  const struck = line.removed || line.rejected;
  const title =
    fields.find((f) => f.id === "nomenclature")?.value(line, campaign) ??
    line.nomenclatureId;
  // Skip the nomenclature field in the body (it's the card title).
  const bodyFields = fields.filter((f) => f.id !== "nomenclature");

  return (
    <Card
      className={cn(
        "p-4",
        added && "border-emerald-300 bg-emerald-50/50",
        struck && "border-red-200 bg-red-50/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {canEditMarketingFlag && (
            <Checkbox
              checked={selected}
              onCheckedChange={onToggleSelected}
              className="mt-0.5"
              aria-label="Выбрать строку"
            />
          )}
          <div className="min-w-0">
            <div
              className={cn(
                "text-sm font-medium text-gray-900",
                struck && "text-red-700 line-through"
              )}
            >
              {String(title)}
            </div>
            <div className="text-[11px] tabular-nums text-muted-foreground">
              {line.nomenclatureId}
            </div>
          </div>
        </div>
        {added && (
          <Badge className="shrink-0 rounded-full border-0 bg-emerald-100 text-[10px] text-emerald-800">
            добавлено
          </Badge>
        )}
      </div>

      <dl className="mt-3 space-y-1.5">
        {bodyFields.map((f) => {
          const changed = cellChanged(line.id, f.id);
          const editableFlag =
            canEditMarketingFlag && f.id === MARKETING_EDITABLE_FIELD;
          return (
            <div
              key={f.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md px-2",
                editableFlag ? "min-h-11 py-1" : "py-0.5",
                changed && "bg-amber-100 ring-1 ring-inset ring-amber-300"
              )}
            >
              <dt className="text-xs text-muted-foreground">{f.label}</dt>
              <dd
                className={cn(
                  "text-sm text-gray-800",
                  isNumericKind(f.kind) && "tabular-nums",
                  struck && f.kind !== "check" && "text-gray-400 line-through"
                )}
              >
                <CellValue
                  field={f}
                  line={line}
                  campaign={campaign}
                  canEditMarketingFlag={canEditMarketingFlag}
                  flagFor={flagFor}
                  onToggleFlag={onToggleFlag}
                />
              </dd>
            </div>
          );
        })}
      </dl>

      {hasUnacked && (
        <button
          type="button"
          onClick={onAcknowledge}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mt-3 h-11 w-full text-emerald-700"
          )}
        >
          <Check className="size-4" />
          Ознакомлен с изменениями
        </button>
      )}
    </Card>
  );
}

// ── shared cell renderer ─────────────────────────────────────────────────────────

interface CellValueProps {
  field: ReportField;
  line: PromoLine;
  campaign: PromoCampaign;
  canEditMarketingFlag: boolean;
  flagFor: (lineId: string) => boolean;
  onToggleFlag: (lineId: string) => void;
}

function CellValue({
  field,
  line,
  campaign,
  canEditMarketingFlag,
  flagFor,
  onToggleFlag,
}: CellValueProps) {
  if (field.kind === "check") {
    // The marketing-selected flag is the one editable field (§7.2).
    if (field.id === MARKETING_EDITABLE_FIELD) {
      const checked = flagFor(line.id);
      if (canEditMarketingFlag) {
        return (
          <span className="inline-flex justify-center">
            <Checkbox
              checked={checked}
              onCheckedChange={() => onToggleFlag(line.id)}
              aria-label="В рекламу (выбрано маркетингом)"
            />
          </span>
        );
      }
      return <ReadonlyCheck on={checked} />;
    }
    return <ReadonlyCheck on={field.value(line, campaign) === true} />;
  }
  return <>{String(field.value(line, campaign))}</>;
}

function ReadonlyCheck({ on }: { on: boolean }) {
  return on ? (
    <Check className="inline size-4 text-emerald-600" />
  ) : (
    <Minus className="inline size-4 text-gray-300" />
  );
}

function EmptyNote({ onlyChanged }: { onlyChanged: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
      <Info className="size-8 text-muted-foreground/50" />
      <p className="max-w-[280px] text-sm text-muted-foreground">
        {onlyChanged
          ? "Непрочитанных изменений нет — все данные отмечены как прочитанные."
          : "В отчёте пока нет строк."}
      </p>
    </div>
  );
}

function isNumericKind(kind: ReportField["kind"]): boolean {
  return kind === "money" || kind === "number" || kind === "percent";
}
