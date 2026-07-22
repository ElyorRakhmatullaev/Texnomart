"use client";

import * as React from "react";
import { cn } from "@texnomart/ui/utils";
import { Card } from "@texnomart/ui/card";
import { Checkbox } from "@texnomart/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@texnomart/ui/tooltip";
import {
  AlertCircle,
  Ban,
  CalendarClock,
  Check,
  Clock,
  Copy,
  Gift,
  History,
  Lock,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Money } from "../../../components/Money";
import { RuDate } from "../../../components/RuDate";
import {
  formatPromoNo,
  getCategoryManager,
  getNomenclatureItem,
  installmentTerm,
  isApprovedCampaign,
  isCampaignFreshEditable,
  isGiftChoiceType,
  isGiftType,
  programMonthly,
  type FullCalendarAccess,
  type GiftItem,
  type NomenclatureItem,
  type PromoCampaign,
  type PromoLine,
} from "../../../lib/promo-mock-data";
import {
  COLUMNS,
  isLocked,
  lockHint,
  type ColumnDef,
  type ColumnGroupKey,
} from "./gridFields";
import { EditableCell } from "./EditableCell";
import { WarehousePopover } from "./WarehousePopover";
import { StoreAvailabilityCell } from "./StoreAvailabilityCell";

// Fixed heights keep the frozen pane and the scrolling pane aligned row-for-row
// (Pattern F: two synced divs, never position:sticky on a cell — see tasks/lessons.md).
// A «Подарок на выбор» line grows to one sub-row per gift (+ an «Добавить подарок»
// row); the SAME computed height is applied to BOTH panes so they never desync.
const HEADER_H = "h-11";
const BAND_H = "h-11";
const ROW_H = "h-14"; // empty-line placeholder rows
const ROW_H_PX = 56; // default line height (matches h-14)
const GIFT_SUBROW_H = 44; // per gift sub-row for «подарок на выбор»

// 7-я часть §3 — text cells wrap onto 2 lines instead of truncating (no cut-off),
// like the short calendar's Тип/Название. Fits the FIXED row heights (Pattern-F
// invariant): 2 × ~17px text-sm leading-tight ≈ 35px within the 56px row (44px
// gift sub-row / header). The webkit-box idiom matches ShortCalendarTable.
const CLAMP2 =
  "[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden leading-tight";

function isGift1Col(id: string): boolean {
  return id.startsWith("gift1");
}
function isGift2Col(id: string): boolean {
  return id.startsWith("gift2");
}
function isGiftCol(id: string): boolean {
  return isGift1Col(id) || isGift2Col(id);
}
type GiftField = "nom" | "avail" | "stock";
function giftField(id: string): GiftField {
  if (id.endsWith("Nomenclature")) return "nom";
  if (id.endsWith("Availability")) return "avail";
  return "stock";
}

/** Height of one line (choice lines grow to fit their gift sub-rows + add row). */
function lineHeightPx(line: PromoLine, isChoice: boolean, editable: boolean): number {
  if (!isChoice) return ROW_H_PX;
  const giftCount = line.gifts?.length ?? 0;
  const contentRows = Math.max(giftCount, 1);
  const addRow = editable ? 1 : 0;
  return Math.max(ROW_H_PX, (contentRows + addRow) * GIFT_SUBROW_H);
}

// Unified styling with the short calendar (feedback §9): a darker-gray, bold header
// over lighter bands over white rows, plus vertical column dividers on the cells.
const CELL = "border-r border-gray-100 dark:border-border";

// The 3 spec-frozen columns (§6, §8) — always visible in the frozen pane.
const FROZEN = {
  select: 40,
  promo: 108,
  km: 150,
  nomenclature: 240,
};

function colStyle(width: number): React.CSSProperties {
  return { width, minWidth: width };
}

function lastName(name: string): string {
  return name.split(" ")[0];
}

const Dash = () => <span className="text-muted-foreground">—</span>;

/**
 * Unified alignment (feedback §12): descriptive text columns (тип, название, УТП,
 * бренд…) align left; everything else — numbers, money, %, dates, checkboxes,
 * badges — is centered for a compact, uniform table. Money is never bold/enlarged.
 */
function isLeftAligned(col: ColumnDef): boolean {
  return col.kind === "text";
}
function cellJustify(col: ColumnDef): string {
  return isLeftAligned(col) ? "justify-start" : "justify-center";
}
function isNumericKind(col: ColumnDef): boolean {
  return col.kind === "money" || col.kind === "number" || col.kind === "percent";
}

/** Whether the current role may edit this column on a line (§3 + Phase 2 gating). */
function cellEditable(col: ColumnDef, ctx: CellCtx): boolean {
  // «В рекламу (выбрано маркетингом)» — Сотрудник маркетинга only (any status).
  if (col.id === "advSelectedMarketing") return ctx.access.marketingFlagOnly;
  if (!ctx.access.canEditOwnLines) return false;
  // §3: editing only before submit (fresh draft) or as an approved-campaign correction.
  if (!ctx.lineEditable) return false;
  // Only genuine КМ-entry fields are editable; auto / 1С / calc stay locked.
  return col.source === "km";
}

/** Is this column required for the given campaign (drives the red marker)? */
function isRequiredFor(colId: string, gift: boolean): boolean {
  if (colId === "salesForecast") return true;
  if (gift && (colId === "giftNomenclature" || colId === "giftStock")) return true;
  return false;
}

interface CellCtx {
  access: FullCalendarAccess;
  onEdit: (lineId: string, patch: Partial<PromoLine>) => void;
  /** Open the 1С picker for a gift slot/index on this line (§8.2.1 / §8.8 / §8). */
  onGiftPick: (lineId: string, slot: number) => void;
  /** Remove a «подарок на выбор» option by index (§8). */
  onRemoveGift?: (lineId: string, index: number) => void;
  gift: boolean;
  /** «Подарок на выбор» campaign — gifts render as sub-rows (§8). */
  giftChoice: boolean;
  /** КМ inline editing allowed for THIS campaign (fresh draft or approved correction). */
  lineEditable: boolean;
}

/** Heterogeneous per-field renderer — editable inputs for КМ fields, read-only for the rest. */
function CellValue({
  col,
  line,
  nom,
  campaign,
  ctx,
}: {
  col: ColumnDef;
  line: PromoLine;
  nom: NomenclatureItem | undefined;
  campaign: PromoCampaign;
  ctx: CellCtx;
}) {
  if (col.giftOnly && !ctx.gift) return <Dash />;
  const old = nom?.oldRetailPrice ?? 0;
  const editable = cellEditable(col, ctx);
  const required = isRequiredFor(col.id, ctx.gift);
  const edit = (patch: Partial<PromoLine>) => ctx.onEdit(line.id, patch);

  switch (col.id) {
    // ── Идентификация / calendar (auto, read-only) — shown as columns (§4) ──
    case "priznak":
      return (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            campaign.planned
              ? "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300"
              : "bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300"
          )}
        >
          {campaign.planned ? "Плановая" : "Внеплановая"}
        </span>
      );
    case "type":
      return <span className={CLAMP2}>{campaign.type}</span>;
    case "name":
      return <span className={CLAMP2}>{campaign.name}</span>;
    case "period":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 tabular-nums",
            campaign.periodChanged &&
              "font-bold text-gray-900 dark:text-gray-100"
          )}
        >
          <RuDate value={campaign.startDate} /> —{" "}
          <RuDate value={campaign.endDate} />
          {campaign.periodChanged && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Pencil className="size-3 text-amber-600 dark:text-amber-400" />
              </TooltipTrigger>
              <TooltipContent>
                Период изменён после согласования (§11.5)
              </TooltipContent>
            </Tooltip>
          )}
        </span>
      );

    // ── Товар ──
    case "brand":
      // Бренд из 1С (§6) — read-only, подтягивается по номенклатуре.
      return nom?.brand ? (
        <span className={CLAMP2}>{nom.brand}</span>
      ) : (
        <Dash />
      );
    case "storeAvailability":
      // Наличие в магазинах, % (§5) — из 1С, read-only.
      return <StoreAvailabilityCell nomenclatureId={line.nomenclatureId} />;
    case "stock":
      return (
        <span className="inline-flex w-full items-center justify-center gap-1">
          <EditableCell
            value={line.stock}
            kind="number"
            align="center"
            editable={editable}
            manualEdited={line.stockManual}
            manualHint="Значение изменено вручную, автообновление остановлено"
            onCommit={(v) =>
              edit({ stock: typeof v === "number" ? v : 0, stockManual: true })
            }
          />
          <WarehousePopover nomenclatureId={line.nomenclatureId} />
        </span>
      );
    case "cost":
      return nom ? <Money value={nom.cost} /> : <Dash />;
    case "oldPrice":
      return nom ? <Money value={old} /> : <Dash />;

    // ── Цены (КМ-editable) ──
    case "newPrice":
      return (
        <EditableCell
          value={line.newPrice}
          kind="money"
          align="center"
          editable={editable}
          onCommit={(v) => edit({ newPrice: typeof v === "number" ? v : 0 })}
        />
      );
    case "discountPct":
      return (
        <EditableCell
          value={line.discountPct}
          kind="percent"
          align="center"
          editable={editable}
          onCommit={(v) => edit({ discountPct: typeof v === "number" ? v : 0 })}
        />
      );
    case "regularSales":
      return (
        <EditableCell
          value={line.regularSales}
          kind="number"
          align="center"
          editable={editable}
          onCommit={(v) =>
            edit({ regularSales: typeof v === "number" ? v : undefined })
          }
        />
      );
    case "salesForecast":
      return (
        <EditableCell
          value={line.salesForecast}
          kind="number"
          align="center"
          editable={editable}
          required={required}
          onCommit={(v) =>
            edit({ salesForecast: typeof v === "number" ? v : undefined })
          }
        />
      );
    case "cashDiscountPct":
      return (
        <EditableCell
          value={line.cashDiscountPct}
          kind="percent"
          align="center"
          editable={editable}
          onCommit={(v) =>
            edit({ cashDiscountPct: typeof v === "number" ? v : undefined })
          }
        />
      );

    // ── Рассрочка (auto-calculated from the live new price, §8.5) ──
    case "inst006":
      return <Money value={programMonthly(line.newPrice, 6)} />;
    case "inst0012":
      return <Money value={programMonthly(line.newPrice, 12)} />;
    case "inst5002":
      return <Money value={programMonthly(line.newPrice, 2, 0.5)} />;
    case "t12old":
      return <Money value={installmentTerm(line, old, 12).oldMonthly} />;
    case "t12new":
      return <Money value={installmentTerm(line, old, 12).newMonthly} />;
    case "t12disc":
      return <Money value={installmentTerm(line, old, 12).discount} />;
    case "t12full":
      return <Money value={installmentTerm(line, old, 12).newFullPrice} />;
    case "t24old":
      return <Money value={installmentTerm(line, old, 24).oldMonthly} />;
    case "t24new":
      return <Money value={installmentTerm(line, old, 24).newMonthly} />;
    case "t24disc":
      return <Money value={installmentTerm(line, old, 24).discount} />;
    case "t24full":
      return <Money value={installmentTerm(line, old, 24).newFullPrice} />;
    case "t36old":
      return <Money value={installmentTerm(line, old, 36).oldMonthly} />;
    case "t36new":
      return <Money value={installmentTerm(line, old, 36).newMonthly} />;
    case "t36disc":
      return <Money value={installmentTerm(line, old, 36).discount} />;
    case "t36full":
      return <Money value={installmentTerm(line, old, 36).newFullPrice} />;

    // ── Маркетинг ── (gift columns are rendered by GiftCell, not here) ──
    case "supplierCompensation":
      return (
        <EditableCell
          value={line.supplierCompensation}
          kind="money"
          align="center"
          editable={editable}
          onCommit={(v) =>
            edit({ supplierCompensation: typeof v === "number" ? v : undefined })
          }
        />
      );
    case "compensationLimit":
      return (
        <EditableCell
          value={line.compensationLimit}
          kind="number"
          align="center"
          editable={editable}
          onCommit={(v) =>
            edit({ compensationLimit: typeof v === "number" ? v : undefined })
          }
        />
      );
    case "utp":
      return (
        <EditableCell
          value={line.utp}
          kind="text"
          editable={editable}
          onCommit={(v) => edit({ utp: typeof v === "string" ? v : undefined })}
        />
      );
    case "advRecommendedKm":
      return (
        <Checkbox
          checked={line.advRecommendedKm}
          disabled={!editable}
          aria-readonly={!editable}
          onCheckedChange={(c) => edit({ advRecommendedKm: c === true })}
        />
      );
    case "advSelectedMarketing":
      return (
        <Checkbox
          checked={line.advSelectedMarketing}
          disabled={!editable}
          aria-readonly={!editable}
          onCheckedChange={(c) => edit({ advSelectedMarketing: c === true })}
        />
      );
    default:
      return <Dash />;
  }
}

interface FullCalendarGridProps {
  campaigns: PromoCampaign[];
  visibleGroups: ColumnGroupKey[];
  access: FullCalendarAccess;
  /** Edited lines for a campaign (from the page-level store). */
  linesFor: (campaignId: string) => PromoLine[];
  onEdit: (lineId: string, patch: Partial<PromoLine>) => void;
  /** Open the 1С picker to add a line to a campaign (§8.2.1; editor roles only). */
  onAddRequest: (campaignId: string) => void;
  /** Open the 1С picker for a gift slot/index on a line (§8). */
  onGiftPick: (lineId: string, slot: number) => void;
  /** Remove a «подарок на выбор» option by index (§8). */
  onRemoveGift?: (lineId: string, index: number) => void;
  /** Open the full per-line edit Sheet — «Изменить» (§3, all sizes) + mobile tap. */
  onLineTap?: (lineId: string) => void;
  /** Hard-delete a draft line before submit (§3; fresh-editable campaigns only). */
  onDeleteLine?: (lineId: string) => void;
  /** Edit an unplanned, not-yet-sent campaign's тип/период (§10; editor roles only). */
  onEditCampaign?: (campaignId: string) => void;
  /** Open the version-history & changes drawer for a campaign (§5.1; all roles). */
  onHistory?: (campaignId: string) => void;
  /** Edit an approved campaign's period (§11.5; provided only for КД). */
  onEditPeriod?: (campaignId: string) => void;
  /** Cancel the whole campaign (§5.3; provided only for КД). */
  onCancelCampaign?: (campaignId: string) => void;
  /** Request exclusion of a line (§5.3; provided only for КМ). */
  onRequestRemoval?: (lineId: string) => void;
  /** Approve/reject a pending line exclusion (§5.3; provided only for КД). */
  onApproveRemoval?: (lineId: string) => void;
  onRejectRemoval?: (lineId: string) => void;
  /** `${lineId}:${field}` keys of cells changed after approval — amber highlight. */
  changedCells?: Set<string>;
  /** Per-campaign change-after-approval badge (count + awaiting-marketing). */
  changeBadges?: Map<string, { count: number; awaitingMarketing: boolean }>;
  /** Bulk-select state (shown only for editor roles). */
  selectedIds: Set<string>;
  onToggleSelect: (lineId: string) => void;
  onToggleGroup: (lineIds: string[], select: boolean) => void;
}

export function FullCalendarGrid({
  campaigns,
  visibleGroups,
  access,
  linesFor,
  onEdit,
  onAddRequest,
  onGiftPick,
  onRemoveGift,
  onLineTap,
  onDeleteLine,
  onEditCampaign,
  onHistory,
  onEditPeriod,
  onCancelCampaign,
  onRequestRemoval,
  onApproveRemoval,
  onRejectRemoval,
  changedCells,
  changeBadges,
  selectedIds,
  onToggleSelect,
  onToggleGroup,
}: FullCalendarGridProps) {
  const editorMode = access.canEditOwnLines || access.marketingFlagOnly;

  const cols = React.useMemo(
    () => COLUMNS.filter((c) => visibleGroups.includes(c.group)),
    [visibleGroups]
  );

  // Keep empty campaigns (a freshly created/integrated one has no lines yet) so the
  // band + «+ Добавить номенклатуру» affordance is visible (Phase 5).
  const groups = React.useMemo(
    () => campaigns.map((campaign) => ({ campaign, lines: linesFor(campaign.id) })),
    [campaigns, linesFor]
  );

  // Sticky header + synced horizontal scroll (feedback §1/§2). A horizontal-overflow
  // container traps `position:sticky`, so — like the short calendar — the table is a
  // non-scrolling STICKY header band over a BODY band, with three horizontal scrollers
  // (the header + the body pane + a single STICKY BOTTOM viewport scrollbar, 7-я часть
  // §4 — the former top strip is removed) kept in sync.
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
  }, [campaigns, cols, editorMode]);

  // Mirror one scroller's scrollLeft onto the other two. Idempotent writes → the
  // resulting scroll events self-terminate (no re-entrancy flag needed).
  const syncScroll = React.useCallback((from: "body" | "bottom") => {
    const src = from === "bottom" ? bottomScrollRef.current : bodyRef.current;
    const x = src?.scrollLeft ?? 0;
    for (const ref of [headRef, bodyRef, bottomScrollRef]) {
      if (ref.current && ref.current !== src && ref.current.scrollLeft !== x)
        ref.current.scrollLeft = x;
    }
  }, []);

  if (groups.length === 0) {
    return (
      <Card className="p-0">
        <p className="py-16 text-center text-sm text-muted-foreground">
          Акции не найдены
        </p>
      </Card>
    );
  }

  return (
    // `overflow-clip` rounds the corners without becoming a scroll container, so it
    // does NOT trap the page-sticky header (feedback §2).
    <Card className="overflow-clip p-0">
      {/* ── STICKY header band — pinned to the page scroll (§1/§2): the darker-gray,
            bold column-title row. The former top scrollbar strip is removed (7-я часть
            §4 — один нижний закреплённый скролл). ─────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b bg-gray-100 dark:bg-muted">
        {/* Column-title row */}
        <div className="flex">
          <div
            ref={frozenHeadRef}
            className={cn(
              "flex shrink-0 items-center border-r text-xs font-semibold text-gray-700 dark:text-gray-200",
              HEADER_H
            )}
          >
            {editorMode && <span style={colStyle(FROZEN.select)} />}
            <span className="px-3 text-center" style={colStyle(FROZEN.promo)}>
              № промо
            </span>
            <span className="px-3" style={colStyle(FROZEN.km)}>
              ФИО КМ
            </span>
            <span className="px-3" style={colStyle(FROZEN.nomenclature)}>
              Номенклатура
            </span>
          </div>
          <div ref={headRef} className="min-w-0 flex-1 overflow-hidden">
            <div
              className={cn(
                "flex min-w-max items-center text-xs font-semibold text-gray-700 dark:text-gray-200",
                HEADER_H
              )}
            >
              {cols.map((col) => (
                <span
                  key={col.id}
                  className={cn("flex items-center gap-1 px-3", CELL, cellJustify(col))}
                  style={colStyle(col.width)}
                >
                  <span className={CLAMP2}>{col.label}</span>
                  {col.required && (
                    <span className="text-red-500 dark:text-red-400">*</span>
                  )}
                  {isLocked(col.source) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Lock className="size-3 shrink-0 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>{lockHint(col.source)}</TooltipContent>
                    </Tooltip>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY band ─────────────────────────────────────────────────────────── */}
      <div className="flex">
        {/* Frozen identity pane (select · № промо · ФИО КМ · Номенклатура) */}
        <div className="shrink-0 border-r bg-white dark:bg-card">
          {groups.map(({ campaign, lines }) => {
            const ids = lines.map((l) => l.id);
            const selCount = ids.filter((id) => selectedIds.has(id)).length;
            const groupChecked: boolean | "indeterminate" =
              selCount === 0
                ? false
                : selCount === ids.length
                  ? true
                  : "indeterminate";
            // §3: hard add/delete only before submit (fresh draft); «Изменить»
            // (the per-line Sheet) also serves approved-campaign corrections.
            const freshEditable =
              access.canEditOwnLines && isCampaignFreshEditable(campaign);
            const lineEditable =
              access.canEditOwnLines &&
              (isCampaignFreshEditable(campaign) || isApprovedCampaign(campaign));
            const choice = isGiftChoiceType(campaign.type);
            return (
              <div key={campaign.id}>
                {/* group band (frozen side) — № промо once + count (§13) */}
                <div
                  className={cn(
                    "flex items-center gap-2 border-b bg-gray-50 dark:bg-muted/40 px-3 text-xs font-semibold text-gray-700 dark:text-gray-200",
                    BAND_H,
                    campaign.cancelled && "bg-red-50 dark:bg-red-500/15"
                  )}
                >
                  {editorMode && (
                    <Checkbox
                      checked={groupChecked}
                      onCheckedChange={(c) => onToggleGroup(ids, c === true)}
                      aria-label="Выбрать все строки акции"
                    />
                  )}
                  <span className="tabular-nums">{formatPromoNo(campaign.id)}</span>
                  <span className="font-normal text-muted-foreground">
                    · {lines.length} {pluralPositions(lines.length)}
                  </span>
                  {access.canEditOwnLines && !campaign.cancelled && (
                    <button
                      type="button"
                      onClick={() => onAddRequest(campaign.id)}
                      className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-accent hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      <Plus className="size-3" />
                      Добавить номенклатуру
                    </button>
                  )}
                </div>

                {/* lines (frozen) */}
                {lines.map((line) => {
                  const nom = getNomenclatureItem(line.nomenclatureId);
                  // Merged height for a «подарок на выбор» line — the main nomenclature
                  // shows once, centered, spanning all its gift sub-rows (§8).
                  const h = lineHeightPx(line, choice, lineEditable);
                  return (
                    <div
                      key={line.id}
                      style={{ height: h }}
                      className={cn(
                        "group/row flex items-stretch border-b transition-colors hover:bg-gray-50 dark:hover:bg-accent",
                        selectedIds.has(line.id) &&
                          "bg-primary/5 dark:bg-primary/10",
                        line.pending1CCheck && "bg-amber-50/50 dark:bg-amber-500/10",
                        line.rejected &&
                          "bg-red-50/70 dark:bg-red-500/10 hover:bg-red-50 dark:hover:bg-red-500/15",
                        line.removalPending && "bg-orange-50/60 dark:bg-orange-500/10",
                        line.removed &&
                          "bg-red-50/70 dark:bg-red-500/10 opacity-70 hover:bg-red-50 dark:hover:bg-red-500/15"
                      )}
                    >
                      {editorMode && (
                        <span
                          className="flex items-center justify-center"
                          style={colStyle(FROZEN.select)}
                        >
                          <Checkbox
                            checked={selectedIds.has(line.id)}
                            onCheckedChange={() => onToggleSelect(line.id)}
                            aria-label="Выбрать строку"
                          />
                        </span>
                      )}
                      <span
                        className="flex items-center justify-center px-3 text-xs tabular-nums text-muted-foreground"
                        style={colStyle(FROZEN.promo)}
                      >
                        {formatPromoNo(campaign.id)}
                      </span>
                      <KmCell kmId={line.kmId} width={FROZEN.km} />
                      <div
                        className="flex min-w-0 items-center gap-1.5 px-3"
                        style={colStyle(FROZEN.nomenclature)}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={cn(
                                "min-w-0 text-sm font-medium text-gray-900 dark:text-gray-100",
                                CLAMP2
                              )}
                            >
                              {nom?.name ?? line.nomenclatureId}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {nom
                              ? `${nom.name} · ${line.nomenclatureId}`
                              : line.nomenclatureId}
                          </TooltipContent>
                        </Tooltip>
                        <LineMarkers line={line} />
                        <span className="ml-auto flex shrink-0 items-center gap-0.5">
                          <LineRowActions
                            line={line}
                            campaign={campaign}
                            onRequestRemoval={onRequestRemoval}
                            onApproveRemoval={onApproveRemoval}
                            onRejectRemoval={onRejectRemoval}
                          />
                          {/* §3: «Изменить» + «Удалить» — near the row, no scroll.
                              Изменить = the per-line Sheet (fresh draft or approved
                              correction); Удалить = hard delete, drafts only. */}
                          {lineEditable && !line.removed && onLineTap && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => onLineTap(line.id)}
                                  aria-label="Изменить строку"
                                  className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-gray-100 dark:hover:bg-accent hover:text-gray-900 dark:hover:text-gray-100"
                                >
                                  <Pencil className="size-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Изменить номенклатуру</TooltipContent>
                            </Tooltip>
                          )}
                          {freshEditable && !line.removed && onDeleteLine && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => onDeleteLine(line.id)}
                                  aria-label="Удалить строку"
                                  className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-400"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Удалить номенклатуру</TooltipContent>
                            </Tooltip>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {lines.length === 0 && (
                  <div
                    className={cn(
                      "flex items-center border-b px-3 text-xs text-muted-foreground",
                      ROW_H
                    )}
                  >
                    Нет строк
                  </div>
                )}
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
            {/* groups */}
            {groups.map(({ campaign, lines }) => {
              const gift = isGiftType(campaign.type);
              const choice = isGiftChoiceType(campaign.type);
              const lineEditable =
                access.canEditOwnLines &&
                (isCampaignFreshEditable(campaign) ||
                  isApprovedCampaign(campaign));
              const ctx: CellCtx = {
                access,
                onEdit,
                onGiftPick,
                onRemoveGift,
                gift,
                giftChoice: choice,
                lineEditable,
              };
              return (
                <div key={campaign.id}>
                  {/* group band (scroll side) — actions only; тип/название/период are
                      now columns (§4), the дедлайн chip/buttons are removed (§4). */}
                  <div
                    className={cn(
                      "flex w-full items-center gap-3 border-b bg-gray-50 dark:bg-muted/40 px-3 text-xs",
                      BAND_H,
                      campaign.cancelled && "bg-red-50 dark:bg-red-500/15"
                    )}
                  >
                    {changeBadges?.get(campaign.id) && (
                      <ChangeBadge info={changeBadges.get(campaign.id)!} />
                    )}
                    <div className="ml-auto flex shrink-0 items-center gap-1">
                      {onEditPeriod &&
                        campaign.planned &&
                        isApprovedCampaign(campaign) && (
                          <button
                            type="button"
                            onClick={() => onEditPeriod(campaign.id)}
                            className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-accent hover:text-gray-900 dark:hover:text-gray-100"
                          >
                            <CalendarClock className="size-3" />
                            Изменить период
                          </button>
                        )}
                      {onEditCampaign &&
                        !campaign.planned &&
                        !campaign.firstSendDone &&
                        !campaign.cancelled &&
                        access.canEditOwnLines && (
                          <button
                            type="button"
                            onClick={() => onEditCampaign(campaign.id)}
                            className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-accent hover:text-gray-900 dark:hover:text-gray-100"
                          >
                            <Pencil className="size-3" />
                            Изменить акцию
                          </button>
                        )}
                      {onHistory && (
                        <button
                          type="button"
                          onClick={() => onHistory(campaign.id)}
                          className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-accent hover:text-gray-900 dark:hover:text-gray-100"
                        >
                          <History className="size-3" />
                          История
                        </button>
                      )}
                      {/* КД: cancel the whole campaign (§5.3). */}
                      {onCancelCampaign && !campaign.cancelled && (
                        <button
                          type="button"
                          onClick={() => onCancelCampaign(campaign.id)}
                          className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <Ban className="size-3" />
                          Отменить акцию
                        </button>
                      )}
                      {campaign.cancelled && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-red-100 dark:bg-red-500/20 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-300">
                          <Ban className="size-3" />
                          Отменена
                        </span>
                      )}
                    </div>
                  </div>

                  {/* lines (scroll) */}
                  {lines.map((line) => {
                    const nom = getNomenclatureItem(line.nomenclatureId);
                    const h = lineHeightPx(line, choice, lineEditable);
                    return (
                      <div
                        key={line.id}
                        style={{ height: h }}
                        className={cn(
                          "flex items-stretch border-b text-sm transition-colors hover:bg-gray-50 dark:hover:bg-accent",
                          selectedIds.has(line.id) &&
                            "bg-primary/5 dark:bg-primary/10",
                          line.pending1CCheck &&
                            "bg-amber-50/50 dark:bg-amber-500/10",
                          line.rejected &&
                            "bg-red-50/70 dark:bg-red-500/10 hover:bg-red-50 dark:hover:bg-red-500/15",
                          line.removalPending &&
                            "bg-orange-50/60 dark:bg-orange-500/10",
                          line.removed &&
                            "bg-red-50/70 dark:bg-red-500/10 opacity-70 hover:bg-red-50 dark:hover:bg-red-500/15"
                        )}
                      >
                        {cols.map((col) =>
                          isGiftCol(col.id) ? (
                            // Gift columns (§8) — fixed №1/№2 or «подарок на выбор» sub-rows.
                            <GiftCell
                              key={col.id}
                              col={col}
                              line={line}
                              ctx={ctx}
                              editable={ctx.lineEditable}
                            />
                          ) : (
                            <div
                              key={col.id}
                              className={cn(
                                "flex items-center px-3 text-gray-800 dark:text-gray-100",
                                CELL,
                                cellJustify(col),
                                isNumericKind(col) && "tabular-nums",
                                isLocked(col.source) &&
                                  "text-gray-500 dark:text-gray-400",
                                changedCells?.has(`${line.id}:${col.id}`) &&
                                  "bg-amber-50 dark:bg-amber-500/15 ring-1 ring-inset ring-amber-300 dark:ring-amber-500/40"
                              )}
                              style={colStyle(col.width)}
                            >
                              <CellValue
                                col={col}
                                line={line}
                                nom={nom}
                                campaign={campaign}
                                ctx={ctx}
                              />
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                  {lines.length === 0 && (
                    <div
                      className={cn(
                        "flex items-center border-b px-3 text-xs text-muted-foreground",
                        ROW_H
                      )}
                    >
                      {access.canEditOwnLines
                        ? "Пока нет строк — добавьте номенклатуру кнопкой «+ Добавить номенклатуру»."
                        : "Нет строк"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky-BOTTOM synced horizontal scrollbar (7-я часть §4): pinned to the
          bottom of the visible area (the page's own scroll container), Excel-like —
          reachable from any vertical position. Spacer = frozen-pane width; inner
          track = scroll-content width so the thumb matches the body pane. */}
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
    </Card>
  );
}

/**
 * Gift columns (feedback §8). Renders a «Подарок №1/№2» cell for a line:
 *  • non-gift campaign → «—» (giftOnly).
 *  • fixed gift type («Товар в подарок» / «1+1») → gifts[slot] {номенклатура/наличие/остаток}.
 *  • «Подарок на выбор» → «Подарок №1» stacks one gift per sub-row (with a remove
 *    control + «+ Добавить подарок»); «Подарок №2» is unused («—»).
 */
function GiftCell({
  col,
  line,
  ctx,
  editable,
}: {
  col: ColumnDef;
  line: PromoLine;
  ctx: CellCtx;
  editable: boolean;
}) {
  const width = col.width;
  const slot = isGift1Col(col.id) ? 0 : 1;
  const field = giftField(col.id);

  // Non-gift campaign → placeholder.
  if (!ctx.gift) {
    return (
      <div
        className={cn("flex items-center justify-center px-3", CELL)}
        style={colStyle(width)}
      >
        <Dash />
      </div>
    );
  }

  // «Подарок на выбор» → only «Подарок №1» carries the per-gift sub-rows.
  if (ctx.giftChoice) {
    if (slot === 1) {
      return (
        <div
          className={cn("flex items-center justify-center px-3", CELL)}
          style={colStyle(width)}
        >
          <Dash />
        </div>
      );
    }
    const gifts = line.gifts ?? [];
    const rows: (GiftItem | null)[] = gifts.length > 0 ? gifts : [null];
    return (
      <div className={cn("flex flex-col", CELL)} style={colStyle(width)}>
        {rows.map((g, i) => (
          <div
            key={i}
            style={{ height: GIFT_SUBROW_H }}
            className={cn(
              "flex items-center gap-1 border-b border-gray-100 px-3 last:border-b-0 dark:border-border",
              field === "nom" ? "justify-start" : "justify-center tabular-nums"
            )}
          >
            <GiftSubCell
              g={g}
              field={field}
              index={i}
              lineId={line.id}
              ctx={ctx}
              editable={editable}
              required={field === "nom" && i === 0}
            />
          </div>
        ))}
        {editable && (
          <div
            style={{ height: GIFT_SUBROW_H }}
            className="flex items-center px-3"
          >
            {field === "nom" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => ctx.onGiftPick(line.id, gifts.length)}
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-accent dark:hover:text-gray-100"
                  >
                    <Plus className="size-3" />
                    Добавить подарок
                  </button>
                </TooltipTrigger>
                <TooltipContent>Добавить подарок на выбор</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    );
  }

  // Fixed gift → gifts[slot].
  const gift = line.gifts?.[slot];
  return (
    <div
      className={cn(
        "flex items-center px-3",
        CELL,
        field === "nom" ? "justify-start" : "justify-center tabular-nums",
        isLocked(col.source) && "text-gray-500 dark:text-gray-400"
      )}
      style={colStyle(width)}
    >
      <GiftSubCell
        g={gift ?? null}
        field={field}
        index={slot}
        lineId={line.id}
        ctx={ctx}
        editable={editable}
        required={slot === 0 && field === "nom"}
      />
    </div>
  );
}

/** One gift value — nomenclature (pickable), наличие в магазинах %, or остаток (1С). */
function GiftSubCell({
  g,
  field,
  index,
  lineId,
  ctx,
  editable,
  required,
}: {
  g: GiftItem | null;
  field: GiftField;
  index: number;
  lineId: string;
  ctx: CellCtx;
  editable: boolean;
  required: boolean;
}) {
  if (field === "avail") {
    return g ? (
      <StoreAvailabilityCell nomenclatureId={g.nomenclatureId} />
    ) : (
      <Dash />
    );
  }
  if (field === "stock") {
    if (!g) return <Dash />;
    const stock = getNomenclatureItem(g.nomenclatureId)?.stock ?? 0;
    return <span className="tabular-nums">{stock.toLocaleString("ru-RU")}</span>;
  }
  // field === "nom"
  const nom = g ? getNomenclatureItem(g.nomenclatureId) : undefined;
  if (!editable) {
    if (nom) return <span className={CLAMP2}>{nom.name}</span>;
    return required ? (
      <span className="text-xs font-medium text-red-500 dark:text-red-400">
        не заполнено
      </span>
    ) : (
      <Dash />
    );
  }
  return (
    <span className="flex w-full items-center gap-1">
      <button
        type="button"
        onClick={() => ctx.onGiftPick(lineId, index)}
        className={cn(
          "min-w-0 flex-1 rounded px-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-accent",
          nom ? "text-gray-900 dark:text-gray-100" : "text-muted-foreground"
        )}
      >
        {nom ? (
          <span className={CLAMP2}>{nom.name}</span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              required && "font-medium text-red-500 dark:text-red-400"
            )}
          >
            <Gift className="size-3.5" />
            {required ? "не заполнено" : "выбрать"}
          </span>
        )}
      </button>
      {nom && ctx.onRemoveGift && (
        <button
          type="button"
          onClick={() => ctx.onRemoveGift!(lineId, index)}
          aria-label="Убрать подарок"
          className="shrink-0 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
        >
          <X className="size-3.5" />
        </button>
      )}
    </span>
  );
}

function KmCell({ kmId, width }: { kmId: string; width: number }) {
  const km = getCategoryManager(kmId);
  return (
    <div className="flex items-center px-3" style={colStyle(width)}>
      {km ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn("text-xs text-gray-700 dark:text-gray-200", CLAMP2)}>
              {lastName(km.name)}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {km.name} · {km.category}
            {km.senior ? " · Старший КМ" : ""}
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </div>
  );
}

/** Band badge for a campaign with un-sent changes after approval (§5.1 / §11.8). */
function ChangeBadge({
  info,
}: {
  info: { count: number; awaitingMarketing: boolean };
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-300">
        <Pencil className="size-2.5" />
        {info.count} изм. после согл.
      </span>
      {info.awaitingMarketing && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 text-[10px] font-medium text-orange-800 dark:text-orange-300">
              Ожидает маркетинга
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px]">
            Изменения (кроме добавления новых товаров) требуют повторного
            согласования маркетинга перед отправкой смежным отделам (§11.8).
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

/** Compact review/state markers shown next to the nomenclature name. */
function LineMarkers({ line }: { line: PromoLine }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {line.duplicate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 dark:bg-amber-500/20 px-1 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-300">
              <Copy className="size-2.5" />
              дубль
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px]">
            {line.duplicateInfo ? (
              <span className="space-y-0.5">
                <span className="block font-medium">
                  {line.duplicateInfo.samePromo
                    ? "Уже добавлена в эту акцию."
                    : `Уже участвует в акции ${formatPromoNo(line.duplicateInfo.promoId)} «${line.duplicateInfo.promoName}».`}
                </span>
                {line.duplicateInfo.overlap && (
                  <span className="block">
                    Пересечение периодов: {line.duplicateInfo.overlap}
                  </span>
                )}
                <span className="block text-muted-foreground">
                  Добавление не блокируется — отметка видна проверяющим.
                </span>
              </span>
            ) : (
              "Номенклатура уже участвует в промо-акции (или в акции с пересекающимся периодом). Добавление не блокируется — отметка видна проверяющим."
            )}
          </TooltipContent>
        </Tooltip>
      )}
      {line.pending1CCheck && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Clock className="size-3.5 text-orange-500 dark:text-orange-400" />
          </TooltipTrigger>
          <TooltipContent>Ожидает проверки 1С</TooltipContent>
        </Tooltip>
      )}
      {line.rejected && (
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertCircle className="size-3.5 text-red-500 dark:text-red-400" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px]">
            {line.rejectComment ?? "Строка отклонена проверяющим"}
          </TooltipContent>
        </Tooltip>
      )}
      {line.removalPending && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-0.5 rounded bg-orange-100 dark:bg-orange-500/20 px-1 py-0.5 text-[10px] font-medium text-orange-800 dark:text-orange-300">
              <Ban className="size-2.5" />
              ожидает исключения
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px]">
            {line.removalReason
              ? `Запрошено исключение из акции: ${line.removalReason} Ожидает согласования коммерческого директора.`
              : "Запрошено исключение из акции — ожидает согласования коммерческого директора (§5.3)."}
          </TooltipContent>
        </Tooltip>
      )}
      {line.removed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-0.5 rounded bg-red-100 dark:bg-red-500/20 px-1 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-300">
              <Ban className="size-2.5" />
              исключена
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px]">
            {line.removalReason
              ? `Исключена из акции: ${line.removalReason} Сохраняется в истории и отчётах с отметкой.`
              : "Позиция исключена из акции (§5.3). Сохраняется в истории и отчётах с отметкой."}
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

/**
 * Trailing per-line removal controls in the frozen pane (§5.3): КМ requests
 * exclusion (hover-revealed, approved campaigns only); КД confirms/rejects a
 * pending exclusion (always visible while pending).
 */
function LineRowActions({
  line,
  campaign,
  onRequestRemoval,
  onApproveRemoval,
  onRejectRemoval,
}: {
  line: PromoLine;
  campaign: PromoCampaign;
  onRequestRemoval?: (lineId: string) => void;
  onApproveRemoval?: (lineId: string) => void;
  onRejectRemoval?: (lineId: string) => void;
}) {
  if (line.removed) return null;

  if (line.removalPending) {
    if (!onApproveRemoval && !onRejectRemoval) return null;
    return (
      <>
        {onApproveRemoval && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onApproveRemoval(line.id)}
                aria-label="Подтвердить исключение"
                className="inline-flex size-7 items-center justify-center rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/15"
              >
                <Check className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Подтвердить исключение</TooltipContent>
          </Tooltip>
        )}
        {onRejectRemoval && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onRejectRemoval(line.id)}
                aria-label="Отклонить исключение"
                className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-gray-100 dark:hover:bg-accent hover:text-gray-900 dark:hover:text-gray-100"
              >
                <X className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Отклонить исключение — позиция остаётся</TooltipContent>
          </Tooltip>
        )}
      </>
    );
  }

  // Active line — КМ may request exclusion of an already-approved campaign's line.
  if (onRequestRemoval && isApprovedCampaign(campaign)) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onRequestRemoval(line.id)}
            aria-label="Исключить из акции"
            className="hidden size-7 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-red-50 dark:hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-400 group-hover/row:opacity-100 md:inline-flex"
          >
            <Ban className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Исключить позицию из акции (§5.3)</TooltipContent>
      </Tooltip>
    );
  }

  return null;
}

/** «N позиций» plural (feedback §13). */
function pluralPositions(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "позиция";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "позиции";
  return "позиций";
}
