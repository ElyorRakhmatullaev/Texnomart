"use client";

import * as React from "react";
import { cn } from "@texnomart/ui/utils";
import { Card } from "@texnomart/ui/card";
import { Checkbox } from "@texnomart/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@texnomart/ui/tooltip";
import {
  AlertCircle,
  CalendarClock,
  ChevronRight,
  Clock,
  Copy,
  Gift,
  History,
  Lock,
  Pencil,
  Plus,
} from "lucide-react";
import { Money } from "../../../components/Money";
import { RuDate } from "../../../components/RuDate";
import {
  getCategoryManager,
  getNomenclatureItem,
  installmentTerm,
  isApprovedCampaign,
  isGiftType,
  programMonthly,
  type FullCalendarAccess,
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

// Fixed heights keep the frozen pane and the scrolling pane aligned row-for-row
// (Pattern F: two synced divs, never position:sticky on a cell — see tasks/lessons.md).
const HEADER_H = "h-11";
const BAND_H = "h-11";
const ROW_H = "h-14";

// The 3 spec-frozen columns (§6, §8) — always visible in the frozen pane.
const FROZEN = {
  select: 40,
  promo: 96,
  km: 150,
  nomenclature: 230,
};

function colStyle(width: number): React.CSSProperties {
  return { width, minWidth: width };
}

function lastName(name: string): string {
  return name.split(" ")[0];
}

const Dash = () => <span className="text-muted-foreground">—</span>;

function alignClass(col: ColumnDef): string {
  return col.kind === "money" ||
    col.kind === "number" ||
    col.kind === "percent"
    ? "text-right tabular-nums"
    : "text-left";
}

/** Whether the current role may edit this column on a line (Phase 2 gating). */
function cellEditable(col: ColumnDef, access: FullCalendarAccess): boolean {
  // «В рекламу (выбрано маркетингом)» — Сотрудник маркетинга only.
  if (col.id === "advSelectedMarketing") return access.marketingFlagOnly;
  if (!access.canEditOwnLines) return false;
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
  /** Open the 1С picker to (re)select this line's gift nomenclature (§8.2.1 / §8.8). */
  onGiftPick: (lineId: string) => void;
  gift: boolean;
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
  const editable = cellEditable(col, ctx.access);
  const required = isRequiredFor(col.id, ctx.gift);
  const edit = (patch: Partial<PromoLine>) => ctx.onEdit(line.id, patch);

  switch (col.id) {
    // ── Идентификация / calendar (auto, read-only) ──
    case "priznak":
      return <span>{campaign.planned ? "Плановая" : "Внеплановая"}</span>;
    case "type":
      return <span className="truncate">{campaign.type}</span>;
    case "name":
      return <span className="truncate">{campaign.name}</span>;
    case "start":
      return <RuDate value={campaign.startDate} />;
    case "end":
      return <RuDate value={campaign.endDate} />;

    // ── Товар ──
    case "stock":
      return (
        <span className="inline-flex w-full items-center justify-end gap-1">
          <EditableCell
            value={line.stock}
            kind="number"
            align="right"
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
          align="right"
          editable={editable}
          onCommit={(v) => edit({ newPrice: typeof v === "number" ? v : 0 })}
        />
      );
    case "discountPct":
      return (
        <EditableCell
          value={line.discountPct}
          kind="percent"
          align="right"
          editable={editable}
          onCommit={(v) => edit({ discountPct: typeof v === "number" ? v : 0 })}
        />
      );
    case "regularSales":
      return (
        <EditableCell
          value={line.regularSales}
          kind="number"
          align="right"
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
          align="right"
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
          align="right"
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

    // ── Маркетинг ──
    case "giftNomenclature": {
      // КМ selects gift nomenclature from the 1С reference (no free-text, §8.2.1).
      const gift = line.giftNomenclatureId
        ? getNomenclatureItem(line.giftNomenclatureId)
        : undefined;
      if (!editable) {
        // Read-only roles: show the name, or the required marker when empty.
        if (gift) return <span className="truncate">{gift.name}</span>;
        return required ? (
          <span className="text-xs font-medium text-red-500">не заполнено</span>
        ) : (
          <Dash />
        );
      }
      return (
        <button
          type="button"
          onClick={() => ctx.onGiftPick(line.id)}
          className={cn(
            "flex h-7 w-full items-center gap-1 truncate rounded px-1 text-left text-sm hover:bg-gray-100",
            gift ? "text-gray-900" : "text-muted-foreground"
          )}
        >
          {gift ? (
            <span className="truncate">{gift.name}</span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                required && "font-medium text-red-500"
              )}
            >
              <Gift className="size-3.5" />
              {required ? "не заполнено" : "выбрать"}
            </span>
          )}
        </button>
      );
    }
    case "giftStock":
      return (
        <EditableCell
          value={line.giftStock}
          kind="number"
          align="right"
          editable={editable}
          required={required}
          onCommit={(v) =>
            edit({ giftStock: typeof v === "number" ? v : undefined })
          }
        />
      );
    case "supplierCompensation":
      return (
        <EditableCell
          value={line.supplierCompensation}
          kind="money"
          align="right"
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
          align="right"
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
          onCommit={(v) =>
            edit({ utp: typeof v === "string" ? v : undefined })
          }
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
  /** Open the 1С picker to (re)select a line's gift nomenclature. */
  onGiftPick: (lineId: string) => void;
  /** Mobile: open the full-screen per-line edit Sheet (Phase 5). */
  onLineTap?: (lineId: string) => void;
  /** Edit an unplanned, not-yet-sent campaign's тип/период (§10; editor roles only). */
  onEditCampaign?: (campaignId: string) => void;
  /** Open the version-history & changes drawer for a campaign (§5.1; all roles). */
  onHistory?: (campaignId: string) => void;
  /** Edit an approved campaign's period (§11.5; provided only for КД). */
  onEditPeriod?: (campaignId: string) => void;
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
  onLineTap,
  onEditCampaign,
  onHistory,
  onEditPeriod,
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
    <Card className="overflow-hidden p-0">
      <div className="flex">
        {/* ── Frozen identity pane (select · № промо · ФИО КМ · Номенклатура) ── */}
        <div className="shrink-0 border-r bg-white">
          <div
            className={cn(
              "flex items-center border-b bg-gray-50 text-xs font-medium text-gray-600",
              HEADER_H
            )}
          >
            {editorMode && <span style={colStyle(FROZEN.select)} />}
            <span className="px-3" style={colStyle(FROZEN.promo)}>
              № промо
            </span>
            <span className="px-3" style={colStyle(FROZEN.km)}>
              ФИО КМ
            </span>
            <span className="px-3" style={colStyle(FROZEN.nomenclature)}>
              Номенклатура
            </span>
          </div>

          {groups.map(({ campaign, lines }) => {
            const ids = lines.map((l) => l.id);
            const selCount = ids.filter((id) => selectedIds.has(id)).length;
            const groupChecked: boolean | "indeterminate" =
              selCount === 0 ? false : selCount === ids.length ? true : "indeterminate";
            return (
              <div key={campaign.id}>
                {/* group band (frozen side) */}
                <div
                  className={cn(
                    "flex items-center gap-2 border-b bg-gray-100/70 px-3 text-xs font-semibold text-gray-700",
                    BAND_H,
                    campaign.cancelled && "bg-red-50"
                  )}
                >
                  {editorMode && (
                    <Checkbox
                      checked={groupChecked}
                      onCheckedChange={(c) => onToggleGroup(ids, c === true)}
                      aria-label="Выбрать все строки акции"
                    />
                  )}
                  <span className="tabular-nums">{campaign.id}</span>
                  <span className="font-normal text-muted-foreground">
                    · {lines.length} стр.
                  </span>
                  {access.canEditOwnLines && !campaign.cancelled && (
                    <button
                      type="button"
                      onClick={() => onAddRequest(campaign.id)}
                      className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-white hover:text-gray-900"
                    >
                      <Plus className="size-3" />
                      Добавить номенклатуру
                    </button>
                  )}
                </div>

                {/* lines */}
                {lines.map((line) => {
                  const nom = getNomenclatureItem(line.nomenclatureId);
                  return (
                    <div
                      key={line.id}
                      className={cn(
                        "group/row flex items-center border-b transition-colors hover:bg-gray-50",
                        ROW_H,
                        selectedIds.has(line.id) && "bg-[#FFD60A]/5",
                        line.pending1CCheck && "bg-amber-50/50",
                        line.rejected && "bg-red-50/70 hover:bg-red-50"
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
                        className="px-3 text-xs tabular-nums text-muted-foreground"
                        style={colStyle(FROZEN.promo)}
                      >
                        {campaign.id}
                      </span>
                      <KmCell kmId={line.kmId} width={FROZEN.km} />
                      <div
                        className="flex min-w-0 items-center gap-1.5 px-3"
                        style={colStyle(FROZEN.nomenclature)}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="min-w-0 truncate text-sm font-medium text-gray-900">
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
                        {onLineTap && (
                          <button
                            type="button"
                            onClick={() => onLineTap(line.id)}
                            aria-label="Редактировать строку"
                            className="ml-auto inline-flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-gray-100 hover:text-gray-900 md:hidden"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        )}
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

        {/* ── Scrolling pane ─────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-gutter:stable]">
          <div className="min-w-max">
            {/* header */}
            <div
              className={cn(
                "flex items-center border-b bg-gray-50 text-xs font-medium text-gray-600",
                HEADER_H
              )}
            >
              {cols.map((col) => (
                <span
                  key={col.id}
                  className={cn(
                    "flex items-center gap-1 px-3",
                    alignClass(col) === "text-right"
                      ? "justify-end"
                      : "justify-start"
                  )}
                  style={colStyle(col.width)}
                >
                  <span className="truncate">{col.label}</span>
                  {col.required && <span className="text-red-500">*</span>}
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

            {/* groups */}
            {groups.map(({ campaign, lines }) => {
              const gift = isGiftType(campaign.type);
              const ctx: CellCtx = { access, onEdit, onGiftPick, gift };
              return (
                <div key={campaign.id}>
                  {/* group band (scroll side) — campaign context */}
                  <div
                    className={cn(
                      "flex w-full items-center gap-3 border-b bg-gray-100/70 px-3 text-xs",
                      BAND_H,
                      campaign.cancelled && "bg-red-50"
                    )}
                  >
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        campaign.planned
                          ? "bg-blue-50 text-blue-700"
                          : "bg-purple-50 text-purple-700"
                      )}
                    >
                      {campaign.planned ? "Плановая" : "Внеплановая"}
                    </span>
                    <span className="text-muted-foreground">{campaign.type}</span>
                    <span
                      className={cn(
                        "font-semibold text-gray-900",
                        campaign.cancelled && "text-red-700 line-through"
                      )}
                    >
                      {campaign.name}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 tabular-nums",
                        campaign.periodChanged
                          ? "font-bold text-gray-900"
                          : "text-muted-foreground"
                      )}
                    >
                      <RuDate value={campaign.startDate} /> —{" "}
                      <RuDate value={campaign.endDate} />
                      {campaign.periodChanged && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Pencil className="size-3 text-amber-600" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Период изменён после согласования (§11.5)
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </span>
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
                            className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-white hover:text-gray-900"
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
                            className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-white hover:text-gray-900"
                          >
                            <Pencil className="size-3" />
                            Изменить
                          </button>
                        )}
                      {onHistory && (
                        <button
                          type="button"
                          onClick={() => onHistory(campaign.id)}
                          className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-white hover:text-gray-900"
                        >
                          <History className="size-3" />
                          История
                        </button>
                      )}
                    </div>
                  </div>

                  {/* lines */}
                  {lines.map((line) => {
                    const nom = getNomenclatureItem(line.nomenclatureId);
                    return (
                      <div
                        key={line.id}
                        className={cn(
                          "flex items-center border-b text-sm transition-colors hover:bg-gray-50",
                          ROW_H,
                          selectedIds.has(line.id) && "bg-[#FFD60A]/5",
                          line.pending1CCheck && "bg-amber-50/50",
                          line.rejected && "bg-red-50/70 hover:bg-red-50"
                        )}
                      >
                        {cols.map((col) => (
                          <div
                            key={col.id}
                            className={cn(
                              "flex items-center px-3 text-gray-800",
                              alignClass(col) === "text-right"
                                ? "justify-end tabular-nums"
                                : "justify-start",
                              isLocked(col.source) && "text-gray-500",
                              changedCells?.has(`${line.id}:${col.id}`) &&
                                "bg-amber-50 ring-1 ring-inset ring-amber-300"
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
                        ))}
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
    </Card>
  );
}

function KmCell({ kmId, width }: { kmId: string; width: number }) {
  const km = getCategoryManager(kmId);
  return (
    <div className="px-3" style={colStyle(width)}>
      {km ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="truncate text-xs text-gray-700">
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
      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
        <Pencil className="size-2.5" />
        {info.count} изм. после согл.
      </span>
      {info.awaitingMarketing && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-800">
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
            <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-800">
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
                    : `Уже участвует в акции ${line.duplicateInfo.promoId} «${line.duplicateInfo.promoName}».`}
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
            <Clock className="size-3.5 text-orange-500" />
          </TooltipTrigger>
          <TooltipContent>Ожидает проверки 1С</TooltipContent>
        </Tooltip>
      )}
      {line.rejected && (
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertCircle className="size-3.5 text-red-500" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px]">
            {line.rejectComment ?? "Строка отклонена проверяющим"}
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}
