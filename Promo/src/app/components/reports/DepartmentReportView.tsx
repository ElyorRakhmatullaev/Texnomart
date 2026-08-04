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
import { Tooltip, TooltipContent, TooltipTrigger } from "@texnomart/ui/tooltip";
import { cn } from "@texnomart/ui/utils";
import { RuDate } from "../../../components/RuDate";
import { OverdueTag } from "../../../components/OverdueTag";
import { useNotifications } from "../notifications/NotificationsProvider";
import {
  DEPARTMENT_LABELS,
  getOverdueDays,
  getReportChangeSet,
  getReportDeadline,
  getReportSentAt,
  getReportVersionNo,
  reportCellChange,
  type PromoCampaign,
  type PromoLine,
  type ReportCellChange,
  type ReportDepartment,
} from "../../../lib/promo-mock-data";
import {
  MARKETING_EDITABLE_FIELD,
  type ReportField,
} from "./reportFields";
import {
  ReportAckHeaderFilter,
  ReportChangeHeaderFilter,
  ReportHeaderFilter,
  buildEnumOptions,
  type ColumnFilter,
  type ReportFilterState,
} from "./ReportFilters";

/** Which change plashka a line shows in the «Изменение» column. */
type ChangeKind = "added" | "changed" | "excluded" | null;

function ChangePlashka({ kind }: { kind: ChangeKind }) {
  if (!kind) return <span className="text-xs text-muted-foreground">—</span>;
  const meta = {
    added: {
      label: "Добавлено",
      cls: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300",
    },
    changed: {
      label: "Изменено",
      cls: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300",
    },
    excluded: {
      label: "Исключено",
      cls: "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300",
    },
  }[kind];
  return (
    <Badge className={cn("rounded-full border-0 text-[11px] font-medium", meta.cls)}>
      {meta.label}
    </Badge>
  );
}

interface DepartmentReportViewProps {
  campaign: PromoCampaign;
  lines: PromoLine[];
  /** Full (unfiltered) line count for «Всего позиций» — a stable version total. */
  totalCount: number;
  department: ReportDepartment;
  fields: ReportField[];
  /** «Показать только изменённые/добавленные данные». */
  onlyChanged: boolean;
  onToggleOnlyChanged: (v: boolean) => void;
  /** Acknowledgement (§11.4): per-user, per-line (backed by report-ack-store). */
  acknowledgedLines: Set<string>;
  onAcknowledgeAll: () => void;
  onAcknowledgeLine: (lineId: string) => void;
  onOpenHistory: () => void;
  /** Marketing — the only editable field (§7.2). */
  canEditMarketingFlag: boolean;
  flagFor: (lineId: string) => boolean;
  onToggleFlag: (lineId: string) => void;
  onBulkFlag: (lineIds: string[], value: boolean) => void;
  /**
   * Волна 5 (5A) — фильтры «как в Excel»: воронка в заголовке каждой колонки.
   * Состояние живёт на странице (там же применяется `applyReportFilters`),
   * поэтому таблица получает его пропсами. `allLines` — НЕотфильтрованный набор:
   * список значений enum-колонки не должен схлопываться по мере фильтрации.
   */
  filters: ReportFilterState;
  onFiltersChange: (s: ReportFilterState) => void;
  allLines: PromoLine[];
}

export function DepartmentReportView({
  campaign,
  lines,
  totalCount,
  department,
  fields,
  onlyChanged,
  onToggleOnlyChanged,
  acknowledgedLines,
  onAcknowledgeAll,
  onAcknowledgeLine,
  onOpenHistory,
  canEditMarketingFlag,
  flagFor,
  onToggleFlag,
  onBulkFlag,
  filters,
  onFiltersChange,
  allLines,
}: DepartmentReportViewProps) {
  const { notify } = useNotifications();
  const changeSet = getReportChangeSet(campaign.id);
  const sentAt = getReportSentAt(campaign);
  const versionNo = getReportVersionNo(campaign);
  const overdueDays = getOverdueDays(getReportDeadline(campaign), sentAt);

  const hasChangeData =
    changeSet.changedCells.length > 0 ||
    changeSet.addedLineIds.length > 0 ||
    changeSet.removedLineIds.length > 0;

  const excludedIds = React.useMemo(
    () => new Set(changeSet.removedLineIds),
    [changeSet]
  );

  // Волна 5 (5A) — значения enum-колонок для воронок; считаются по ВСЕМ строкам
  // отчёта, а не по отфильтрованным, иначе выбранное значение исчезнет из списка.
  const enumOptions = React.useMemo(
    () => buildEnumOptions(fields, allLines, campaign),
    [fields, allLines, campaign]
  );
  const patchColumnFilter = React.useCallback(
    (id: string, patch: Partial<ColumnFilter>) => {
      onFiltersChange({
        ...filters,
        columns: { ...filters.columns, [id]: { ...(filters.columns[id] ?? {}), ...patch } },
      });
    },
    [filters, onFiltersChange]
  );

  const isAcked = React.useCallback(
    (lineId: string) => acknowledgedLines.has(lineId),
    [acknowledgedLines]
  );
  const cellChanged = (lineId: string, fieldId: string) =>
    !!reportCellChange(changeSet, lineId, fieldId) && !isAcked(lineId);
  const cellChangeFor = (lineId: string, fieldId: string) =>
    isAcked(lineId) ? undefined : reportCellChange(changeSet, lineId, fieldId);
  const rowAdded = (lineId: string) =>
    changeSet.addedLineIds.includes(lineId) && !isAcked(lineId);
  const lineHasUnacked = (lineId: string) =>
    (changeSet.addedLineIds.includes(lineId) ||
      changeSet.removedLineIds.includes(lineId) ||
      changeSet.changedCells.some((c) => c.lineId === lineId)) &&
    !isAcked(lineId);
  const lineById = React.useMemo(
    () => new Map(lines.map((l) => [l.id, l])),
    [lines]
  );
  // Which change plashka a line shows in the «Изменение» column.
  const changeKind = (lineId: string): ChangeKind => {
    const line = lineById.get(lineId);
    if ((line && (line.removed || line.rejected)) || changeSet.removedLineIds.includes(lineId))
      return "excluded";
    if (changeSet.addedLineIds.includes(lineId)) return "added";
    if (changeSet.changedCells.some((c) => c.lineId === lineId)) return "changed";
    return null;
  };

  // Version-wide unacked count (NOT filtered by the visible `lines` prop) — the
  // header button reflects the whole report version's changes, not just what's
  // currently shown after column/only-changed filters (E-1 §2).
  const allChangedIds = React.useMemo(() => {
    const ids = new Set<string>([
      ...changeSet.addedLineIds,
      ...changeSet.removedLineIds,
    ]);
    changeSet.changedCells.forEach((c) => ids.add(c.lineId));
    return [...ids];
  }, [changeSet]);
  const unackedChangesCount = allChangedIds.filter((id) => !isAcked(id)).length;

  // Version totals (§2) — do NOT decrease as the user acknowledges; they
  // describe the change composition of this report version, not read state.
  const addedCount = changeSet.addedLineIds.length;
  const changedCount = new Set(changeSet.changedCells.map((c) => c.lineId)).size;
  const excludedCount = changeSet.removedLineIds.length;

  // «Только изменения» keeps any added/changed/excluded line of this version,
  // independent of acknowledgement — a view of the version's change
  // composition, not of unread state.
  const isChangedLine = (lineId: string) =>
    changeSet.addedLineIds.includes(lineId) ||
    changeSet.removedLineIds.includes(lineId) ||
    changeSet.changedCells.some((c) => c.lineId === lineId);
  const displayLines = React.useMemo(
    () => (onlyChanged ? lines.filter((l) => isChangedLine(l.id)) : lines),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lines, onlyChanged]
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
    notify({
      type: "ad-approval",
      campaignId: campaign.id,
      campaignName: campaign.name,
      description: "Маркетинг согласовал выбор позиций «В рекламу».",
      href: "/reports",
    });
  };

  return (
    <div className="space-y-4">
      {/* ── header strip ── */}
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {DEPARTMENT_LABELS[department]}
              </h2>
              <Badge className="rounded-full border-0 bg-blue-50 dark:bg-blue-500/15 text-xs text-blue-700 dark:text-blue-300">
                Версия {versionNo}
              </Badge>
              {hasChangeData && (
                <>
                  <Badge className="rounded-full border-0 bg-emerald-100 dark:bg-emerald-500/20 text-xs tabular-nums text-emerald-800 dark:text-emerald-300">
                    Добавлено: {addedCount}
                  </Badge>
                  <Badge className="rounded-full border-0 bg-amber-100 dark:bg-amber-500/20 text-xs tabular-nums text-amber-800 dark:text-amber-300">
                    Изменено: {changedCount}
                  </Badge>
                  <Badge className="rounded-full border-0 bg-red-100 dark:bg-red-500/20 text-xs tabular-nums text-red-800 dark:text-red-300">
                    Исключено: {excludedCount}
                  </Badge>
                  <Badge className="rounded-full border-0 bg-gray-100 dark:bg-muted text-xs tabular-nums text-gray-700 dark:text-gray-300">
                    Всего позиций: {totalCount}
                  </Badge>
                </>
              )}
            </div>
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <span>
                Получено: <RuDate value={sentAt} className="tabular-nums text-gray-700 dark:text-gray-200" />
              </span>
              {overdueDays > 0 && (
                <>
                  <OverdueTag days={overdueDays} />
                  <span className="text-xs text-red-600 dark:text-red-400">
                    отправлено позже срока (17 кал. дн. до старта)
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasChangeData && (
              <div className="flex items-center gap-2 rounded-md border bg-gray-50 dark:bg-muted/40 px-2.5 py-1.5">
                <Switch
                  id="only-changes"
                  checked={onlyChanged}
                  onCheckedChange={onToggleOnlyChanged}
                  aria-label="Только изменения"
                />
                <Label htmlFor="only-changes" className="text-xs font-normal">
                  Только изменения
                </Label>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={onOpenHistory}>
              <History className="size-4" />
              История версий
            </Button>
            {unackedChangesCount > 0 && (
              <Button size="sm" onClick={ackAll}>
                <CheckCheck className="size-4" />
                Ознакомиться со всеми изменениями ({unackedChangesCount})
              </Button>
            )}
          </div>
        </div>

        {/* Ознакомление ≠ согласование (§11.7) */}
        <div className="mt-3 flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-500/15 px-3 py-2 text-xs text-blue-800 dark:text-blue-300">
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
            <div className="flex items-start gap-2 rounded-md bg-orange-50 dark:bg-orange-500/15 px-3 py-2 text-xs text-orange-800 dark:text-orange-300">
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
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/15 px-3 py-2">
          <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Выбрано: {selected.size}
          </span>
          <span className="text-sm text-amber-800 dark:text-amber-300">· «В рекламу»:</span>
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

      {/* ── desktop table (Pattern F band layout — sticky header + synced
            top/bottom scrollbars; «Изменение»+«Номенклатура» frozen) ── */}
      <Card className="hidden overflow-clip p-0 md:block">
        <ReportBandTable
          campaign={campaign}
          lines={displayLines}
          fields={fields}
          canEditMarketingFlag={canEditMarketingFlag}
          selected={selected}
          onToggleSelected={toggleSelected}
          flagFor={flagFor}
          onToggleFlag={onToggleFlag}
          cellChanged={cellChanged}
          cellChangeFor={cellChangeFor}
          changeKind={changeKind}
          lineHasUnacked={lineHasUnacked}
          onAcknowledgeLine={ackLine}
          excludedIds={excludedIds}
          filters={filters}
          onFiltersChange={onFiltersChange}
          enumOptions={enumOptions}
          patchColumnFilter={patchColumnFilter}
        />
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
              cellChangeFor={cellChangeFor}
              added={rowAdded(line.id)}
              kind={changeKind(line.id)}
              hasUnacked={lineHasUnacked(line.id)}
              onAcknowledge={() => ackLine(line.id)}
              excludedIds={excludedIds}
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

// ── desktop table — Pattern F band layout ───────────────────────────────────────
// Ported from ShortCalendarTable: a horizontal overflow container traps
// position:sticky, so the table is split into a non-scrolling HEADER band over a
// vertically-scrolling BODY band, with three horizontal scrollers kept in sync (a
// STICKY TOP scrollbar, the header, and the body's own scrollbar). «Изменение» +
// «Номенклатура» are frozen; the rest of `fields` scrolls, followed by a trailing
// «Ознакомление» action column.
const ROW_H = 52;
const CELL = "border-r border-gray-100 dark:border-border";
const HEADER_H = "h-11";
const GROUP_H = "h-7";
const CHANGE_COL_W = 130;
const ACK_COL_W = 150;

// 7-я часть §3/§6.3 — text cells wrap onto 2 lines instead of truncating (no
// cut-off) within the fixed 52px row (Pattern-F invariant), like the short and
// full calendars.
const CLAMP2 =
  "[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden leading-tight";

interface ReportBandTableProps {
  campaign: PromoCampaign;
  lines: PromoLine[];
  fields: ReportField[];
  canEditMarketingFlag: boolean;
  selected: Set<string>;
  onToggleSelected: (lineId: string) => void;
  flagFor: (lineId: string) => boolean;
  onToggleFlag: (lineId: string) => void;
  cellChanged: (lineId: string, fieldId: string) => boolean;
  cellChangeFor: (lineId: string, fieldId: string) => ReportCellChange | undefined;
  changeKind: (lineId: string) => ChangeKind;
  lineHasUnacked: (lineId: string) => boolean;
  onAcknowledgeLine: (lineId: string) => void;
  excludedIds: Set<string>;
  /** Волна 5 (5A) — воронки фильтров в заголовках столбцов. */
  filters: ReportFilterState;
  onFiltersChange: (s: ReportFilterState) => void;
  enumOptions: Map<string, string[]>;
  patchColumnFilter: (id: string, patch: Partial<ColumnFilter>) => void;
}

function ReportBandTable({
  campaign,
  lines,
  fields,
  canEditMarketingFlag,
  selected,
  onToggleSelected,
  flagFor,
  onToggleFlag,
  cellChanged,
  cellChangeFor,
  changeKind,
  lineHasUnacked,
  onAcknowledgeLine,
  excludedIds,
  filters,
  onFiltersChange,
  enumOptions,
  patchColumnFilter,
}: ReportBandTableProps) {
  // «Номенклатура» is frozen with «Изменение»; everything else in `fields` scrolls.
  const scrollingFields = fields.filter((f) => f.id !== "nomenclature");
  const nomField = fields.find((f) => f.id === "nomenclature");
  const nomWidth = nomField?.width ?? 260;

  // Group header (marketing only — narrow reports have no field.group). Widths
  // (not colSpan, since flexbox divs replace the old <table>'s <th colSpan>) —
  // computed over the SCROLLING columns only («Изменение»/«Номенклатура» are frozen).
  const groups = React.useMemo(() => {
    const out: { label: string; width: number }[] = [];
    for (const f of scrollingFields) {
      const label = f.group ?? "";
      const last = out[out.length - 1];
      if (last && last.label === label) last.width += f.width;
      else out.push({ label, width: f.width });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);
  const hasGroups = fields.some((f) => f.group);

  // Sticky header + synced horizontal scroll (Pattern F, ported verbatim from
  // ShortCalendarTable) — the header is sticky to the PAGE scroll; three
  // horizontal scrollers are kept in sync: the header band, the body pane, and a
  // single STICKY BOTTOM viewport scrollbar (7-я часть §4 — the former top strip
  // is removed).
  const headRef = React.useRef<HTMLDivElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const bottomScrollRef = React.useRef<HTMLDivElement>(null);
  const frozenHeadRef = React.useRef<HTMLDivElement>(null);

  const [frozenW, setFrozenW] = React.useState(0);
  const [scrollW, setScrollW] = React.useState(0);

  React.useLayoutEffect(() => {
    function measure() {
      if (frozenHeadRef.current) setFrozenW(frozenHeadRef.current.offsetWidth);
      if (bodyRef.current) setScrollW(bodyRef.current.scrollWidth);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (bodyRef.current) ro.observe(bodyRef.current);
    if (frozenHeadRef.current) ro.observe(frozenHeadRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [lines, fields, canEditMarketingFlag]);

  // Mirror one scroller's scrollLeft onto the other two (idempotent writes, so
  // the resulting scroll events self-terminate — no re-entrancy flag needed).
  const syncScroll = React.useCallback((from: "body" | "bottom") => {
    const src = from === "bottom" ? bottomScrollRef.current : bodyRef.current;
    const x = src?.scrollLeft ?? 0;
    for (const ref of [headRef, bodyRef, bottomScrollRef]) {
      if (ref.current && ref.current !== src && ref.current.scrollLeft !== x)
        ref.current.scrollLeft = x;
    }
  }, []);

  if (lines.length === 0) {
    return null;
  }

  return (
    <>
      {/* ── STICKY TOP band — pinned to the page scroll. `-top-4` cancels
            <main>'s p-4 (16px) so it sits flush at the content top. The former
            top scrollbar strip is removed (7-я часть §4). ────────────────────── */}
      <div className="sticky -top-4 z-30 border-b bg-gray-50 dark:bg-muted/40">
        {/* Group header (marketing only) + column-title rows */}
        <div className="flex">
          <div
            ref={frozenHeadRef}
            className="flex shrink-0 flex-col border-r"
          >
            {hasGroups && (
              <div className={cn("flex items-center border-b", GROUP_H)} />
            )}
            <div className={cn("flex items-center", HEADER_H)}>
              {canEditMarketingFlag && <div className="w-10 shrink-0" />}
              <div
                className={cn(
                  "flex h-full shrink-0 items-center px-3 text-xs font-semibold text-gray-700 dark:text-gray-200",
                  CELL
                )}
                style={{ width: CHANGE_COL_W }}
              >
                Изменение
                <ReportChangeHeaderFilter
                  selected={filters.change}
                  onChange={(v) => onFiltersChange({ ...filters, change: v })}
                />
              </div>
              <div
                className="flex h-full shrink-0 items-center px-3 text-xs font-semibold text-gray-700 dark:text-gray-200"
                style={{ width: nomWidth }}
              >
                Номенклатура
                {nomField && (
                  <ReportHeaderFilter
                    col={nomField}
                    options={enumOptions.get(nomField.id) ?? []}
                    filter={filters.columns[nomField.id]}
                    onChange={(patch) => patchColumnFilter(nomField.id, patch)}
                  />
                )}
              </div>
            </div>
          </div>
          <div ref={headRef} className="min-w-0 flex-1 overflow-hidden">
            <div className="min-w-max">
              {hasGroups && (
                <div className={cn("flex items-center border-b", GROUP_H)}>
                  {groups.map((g, i) => (
                    <div
                      key={i}
                      style={{ width: g.width }}
                      className="shrink-0 border-l px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:border-l-0"
                    >
                      {g.label}
                    </div>
                  ))}
                  <div style={{ width: ACK_COL_W }} className="shrink-0" />
                </div>
              )}
              <div className={cn("flex items-center", HEADER_H)}>
                {scrollingFields.map((f) => (
                  <div
                    key={f.id}
                    style={{ width: f.width }}
                    className={cn(
                      "flex h-full shrink-0 items-center overflow-hidden px-3 text-xs font-semibold text-gray-700 dark:text-gray-200",
                      CELL,
                      cellJustify(f.kind)
                    )}
                  >
                    <span className={CLAMP2}>{f.label}</span>
                    <ReportHeaderFilter
                      col={f}
                      options={enumOptions.get(f.id) ?? []}
                      filter={filters.columns[f.id]}
                      onChange={(patch) => patchColumnFilter(f.id, patch)}
                    />
                  </div>
                ))}
                <div
                  style={{ width: ACK_COL_W }}
                  className={cn(
                    "flex h-full shrink-0 items-center px-3 text-xs font-semibold text-gray-700 dark:text-gray-200",
                    CELL
                  )}
                >
                  Ознакомление
                  <ReportAckHeaderFilter
                    value={filters.ack}
                    onChange={(v) => onFiltersChange({ ...filters, ack: v })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY band — natural height; the MAIN PAGE handles vertical scroll ── */}
      <div className="flex">
        {/* Frozen pane — bulk-select checkbox (marketing) + «Изменение» + «Номенклатура» */}
        <div className="shrink-0 border-r bg-white dark:bg-card">
          {lines.map((line) => {
            const struck = line.removed || line.rejected || excludedIds.has(line.id);
            const nomValue = nomField
              ? String(nomField.value(line, campaign))
              : line.nomenclatureId;
            return (
              <div
                key={line.id}
                style={{ height: ROW_H }}
                className="flex items-center border-b last:border-b-0"
              >
                {canEditMarketingFlag && (
                  <div className="flex w-10 shrink-0 items-center justify-center">
                    <Checkbox
                      checked={selected.has(line.id)}
                      onCheckedChange={() => onToggleSelected(line.id)}
                      aria-label="Выбрать строку"
                    />
                  </div>
                )}
                <div
                  className={cn("flex h-full shrink-0 items-center px-3", CELL)}
                  style={{ width: CHANGE_COL_W }}
                >
                  <ChangePlashka kind={changeKind(line.id)} />
                </div>
                <div
                  className={cn(
                    "flex h-full shrink-0 items-center px-3 text-sm text-gray-900 dark:text-gray-100",
                    struck && "text-gray-400 dark:text-gray-500 line-through"
                  )}
                  style={{ width: nomWidth }}
                >
                  <span className={CLAMP2}>{nomValue}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrolling pane — its native h-scrollbar is hidden (still scrollable via
            wheel/drag) so it doesn't double up with the sticky-bottom strip below. */}
        <div
          ref={bodyRef}
          onScroll={() => syncScroll("body")}
          className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="min-w-max">
            {lines.map((line) => {
              const struck = line.removed || line.rejected || excludedIds.has(line.id);
              return (
                <div
                  key={line.id}
                  style={{ height: ROW_H }}
                  className="flex items-center border-b last:border-b-0"
                >
                  {scrollingFields.map((f) => {
                    const changed = cellChanged(line.id, f.id);
                    const chg = cellChangeFor(line.id, f.id);
                    return (
                      <div
                        key={f.id}
                        style={{ width: f.width }}
                        className={cn(
                          "flex h-full shrink-0 items-center overflow-hidden px-3 text-sm text-gray-800 dark:text-gray-100",
                          CELL,
                          cellJustify(f.kind),
                          isNumericKind(f.kind) && "tabular-nums",
                          struck && "text-gray-400 dark:text-gray-500 line-through",
                          changed &&
                            "bg-amber-100 dark:bg-amber-500/15 ring-1 ring-inset ring-amber-300 dark:ring-amber-500/40"
                        )}
                      >
                        {chg ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help underline decoration-dotted decoration-amber-400 underline-offset-2">
                                <CellValue
                                  field={f}
                                  line={line}
                                  campaign={campaign}
                                  canEditMarketingFlag={canEditMarketingFlag}
                                  flagFor={flagFor}
                                  onToggleFlag={onToggleFlag}
                                />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">
                              <div>Было: <span className="tabular-nums">{chg.prevValue}</span></div>
                              <div>Стало: <span className="tabular-nums font-medium">{chg.newValue}</span></div>
                              <div className="mt-0.5 text-muted-foreground tabular-nums">
                                {chg.changedAt.toLocaleDateString("ru-RU")}{" "}
                                {chg.changedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : f.kind === "text" ? (
                          // §3/§6.3 — long text values wrap onto 2 lines, no cut-off.
                          <span className={CLAMP2}>
                            <CellValue
                              field={f}
                              line={line}
                              campaign={campaign}
                              canEditMarketingFlag={canEditMarketingFlag}
                              flagFor={flagFor}
                              onToggleFlag={onToggleFlag}
                            />
                          </span>
                        ) : (
                          <CellValue
                            field={f}
                            line={line}
                            campaign={campaign}
                            canEditMarketingFlag={canEditMarketingFlag}
                            flagFor={flagFor}
                            onToggleFlag={onToggleFlag}
                          />
                        )}
                      </div>
                    );
                  })}
                  <div
                    style={{ width: ACK_COL_W }}
                    className={cn("flex h-full shrink-0 items-center px-3", CELL)}
                  >
                    {lineHasUnacked(line.id) && (
                      <button
                        type="button"
                        onClick={() => onAcknowledgeLine(line.id)}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "h-8 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/15"
                        )}
                      >
                        <Check className="size-3.5" />
                        Ознакомлен
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky-BOTTOM synced horizontal scrollbar (7-я часть §4): pinned to the
          bottom of the viewport, Excel-like — reachable from any scroll position.
          Spacer = frozen-pane width; track = scroll-content width. */}
      <div className="sticky bottom-0 z-30 flex border-t bg-gray-50 dark:bg-muted/40">
        <div className="shrink-0" style={{ width: frozenW }} />
        <div
          ref={bottomScrollRef}
          onScroll={() => syncScroll("bottom")}
          className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
        >
          <div style={{ width: scrollW, height: 1 }} />
        </div>
      </div>
    </>
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
  cellChangeFor: (lineId: string, fieldId: string) => ReportCellChange | undefined;
  added: boolean;
  kind: ChangeKind;
  hasUnacked: boolean;
  onAcknowledge: () => void;
  excludedIds: Set<string>;
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
  cellChangeFor,
  added,
  kind,
  hasUnacked,
  onAcknowledge,
  excludedIds,
}: ReportCardProps) {
  const struck = line.removed || line.rejected || excludedIds.has(line.id);
  const title =
    fields.find((f) => f.id === "nomenclature")?.value(line, campaign) ??
    line.nomenclatureId;
  // Skip the nomenclature field in the body (it's the card title).
  const bodyFields = fields.filter((f) => f.id !== "nomenclature");

  return (
    <Card
      className={cn(
        "p-4",
        added && "border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-500/10",
        struck && "border-red-200 dark:border-red-500/30 bg-red-50/40 dark:bg-red-500/10"
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
                "text-sm font-medium text-gray-900 dark:text-gray-100",
                struck && "text-red-700 dark:text-red-300 line-through"
              )}
            >
              {String(title)}
            </div>
            <div className="text-[11px] tabular-nums text-muted-foreground">
              {line.nomenclatureId}
            </div>
          </div>
        </div>
        <ChangePlashka kind={kind} />
      </div>

      <dl className="mt-3 space-y-1.5">
        {bodyFields.map((f) => {
          const changed = cellChanged(line.id, f.id);
          const chg = cellChangeFor(line.id, f.id);
          const editableFlag =
            canEditMarketingFlag && f.id === MARKETING_EDITABLE_FIELD;
          return (
            <div
              key={f.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md px-2",
                editableFlag ? "min-h-11 py-1" : "py-0.5",
                changed && "bg-amber-100 dark:bg-amber-500/15 ring-1 ring-inset ring-amber-300 dark:ring-amber-500/40"
              )}
            >
              <dt className="text-xs text-muted-foreground">{f.label}</dt>
              <dd
                className={cn(
                  "text-sm text-gray-800 dark:text-gray-100",
                  isNumericKind(f.kind) && "tabular-nums",
                  struck && f.kind !== "check" && "text-gray-400 dark:text-gray-500 line-through"
                )}
              >
                {chg ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help underline decoration-dotted decoration-amber-400 underline-offset-2">
                        <CellValue
                          field={f}
                          line={line}
                          campaign={campaign}
                          canEditMarketingFlag={canEditMarketingFlag}
                          flagFor={flagFor}
                          onToggleFlag={onToggleFlag}
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      <div>Было: <span className="tabular-nums">{chg.prevValue}</span></div>
                      <div>Стало: <span className="tabular-nums font-medium">{chg.newValue}</span></div>
                      <div className="mt-0.5 text-muted-foreground tabular-nums">
                        {chg.changedAt.toLocaleDateString("ru-RU")}{" "}
                        {chg.changedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <CellValue
                    field={f}
                    line={line}
                    campaign={campaign}
                    canEditMarketingFlag={canEditMarketingFlag}
                    flagFor={flagFor}
                    onToggleFlag={onToggleFlag}
                  />
                )}
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
            "mt-3 h-11 w-full text-emerald-700 dark:text-emerald-300"
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
    <Minus className="inline size-4 text-gray-300 dark:text-gray-600" />
  );
}

function EmptyNote({ onlyChanged }: { onlyChanged: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-12 text-center">
      <Info className="size-8 text-muted-foreground/50" />
      <p className="max-w-[280px] text-sm text-muted-foreground">
        {onlyChanged
          ? "В этой версии отчёта нет изменений — все позиции без добавлений, изменений и исключений."
          : "В отчёте пока нет строк."}
      </p>
    </div>
  );
}

function isNumericKind(kind: ReportField["kind"]): boolean {
  return kind === "money" || kind === "number" || kind === "percent";
}

/**
 * Волна 5 (5A, PDF 30.07): выравнивание «по аналогии с полным промо-календарём».
 * Там правило одно — текст влево, всё остальное (суммы, цены, проценты,
 * количества, даты, чекбоксы) по центру (`FullCalendarGrid.cellJustify`).
 * Отчёт до этого прижимал числа вправо, из-за чего колонки визуально «плыли».
 * Одна функция на шапку и на ячейки — иначе они снова разъедутся.
 */
function cellJustify(kind: ReportField["kind"]): string {
  return kind === "text" ? "justify-start" : "justify-center";
}
