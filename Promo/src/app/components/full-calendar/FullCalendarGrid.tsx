"use client";

import * as React from "react";
import { cn } from "@texnomart/ui/utils";
import { Card } from "@texnomart/ui/card";
import { Checkbox } from "@texnomart/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@texnomart/ui/tooltip";
import { AlertCircle, Clock, Copy, Lock, Pencil } from "lucide-react";
import { Money } from "../../../components/Money";
import { RuDate } from "../../../components/RuDate";
import {
  PROMO_TYPES,
  getCategoryManager,
  getNomenclatureItem,
  getPromoLines,
  installmentTerm,
  programMonthly,
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

// Fixed heights keep the frozen pane and the scrolling pane aligned row-for-row
// (Pattern F: two synced divs, never position:sticky on a cell — see tasks/lessons.md).
const HEADER_H = "h-11";
const BAND_H = "h-11";
const ROW_H = "h-14";

// The 3 spec-frozen columns (§6, §8) — always visible in the frozen pane.
const FROZEN = {
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

function isGiftCampaign(campaign: PromoCampaign): boolean {
  return Boolean(PROMO_TYPES.find((t) => t.name === campaign.type)?.giftType);
}

const Dash = () => <span className="text-muted-foreground">—</span>;

function alignClass(col: ColumnDef): string {
  return col.kind === "money" ||
    col.kind === "number" ||
    col.kind === "percent"
    ? "text-right tabular-nums"
    : "text-left";
}

/** Heterogeneous per-field value renderer (read-only in Phase 1). */
function CellValue({
  col,
  line,
  nom,
  campaign,
}: {
  col: ColumnDef;
  line: PromoLine;
  nom: NomenclatureItem | undefined;
  campaign: PromoCampaign;
}) {
  if (col.giftOnly && !isGiftCampaign(campaign)) return <Dash />;
  const old = nom?.oldRetailPrice ?? 0;

  switch (col.id) {
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

    case "stock":
      return (
        <span className="inline-flex items-center justify-end gap-1">
          <span className="tabular-nums">{line.stock.toLocaleString("ru-RU")}</span>
          {line.stockManual && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Pencil className="size-3 shrink-0 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent>
                Значение изменено вручную, автообновление остановлено
              </TooltipContent>
            </Tooltip>
          )}
        </span>
      );
    case "cost":
      return nom ? <Money value={nom.cost} /> : <Dash />;
    case "oldPrice":
      return nom ? <Money value={old} /> : <Dash />;

    case "newPrice":
      return <Money value={line.newPrice} />;
    case "discountPct":
      return <span>{line.discountPct}%</span>;
    case "regularSales":
      return line.regularSales != null ? (
        <span>{line.regularSales.toLocaleString("ru-RU")}</span>
      ) : (
        <Dash />
      );
    case "salesForecast":
      return line.salesForecast != null ? (
        <span>{line.salesForecast.toLocaleString("ru-RU")}</span>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-700">
              <AlertCircle className="size-3" />
              не заполнено
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Обязательное поле — без него нельзя отправить на согласование
          </TooltipContent>
        </Tooltip>
      );
    case "cashDiscountPct":
      return line.cashDiscountPct != null ? (
        <span>{line.cashDiscountPct}%</span>
      ) : (
        <Dash />
      );

    // Installment programs (auto-calculated, §8.5)
    case "inst006":
      return <Money value={programMonthly(line.newPrice, 6)} />;
    case "inst0012":
      return <Money value={programMonthly(line.newPrice, 12)} />;
    case "inst5002":
      return <Money value={programMonthly(line.newPrice, 2, 0.5)} />;

    // 12/24/36-мес sets
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

    // Маркетинг
    case "giftNomenclature": {
      const gift = line.giftNomenclatureId
        ? getNomenclatureItem(line.giftNomenclatureId)
        : undefined;
      return gift ? <span className="truncate">{gift.name}</span> : <Dash />;
    }
    case "giftStock":
      return line.giftStock != null ? (
        <span>{line.giftStock.toLocaleString("ru-RU")}</span>
      ) : (
        <Dash />
      );
    case "supplierCompensation":
      return line.supplierCompensation != null ? (
        <Money value={line.supplierCompensation} />
      ) : (
        <Dash />
      );
    case "compensationLimit":
      return line.compensationLimit != null ? (
        <span>{line.compensationLimit.toLocaleString("ru-RU")}</span>
      ) : (
        <Dash />
      );
    case "utp":
      return line.utp ? <span className="truncate">{line.utp}</span> : <Dash />;
    case "advRecommendedKm":
      return (
        <Checkbox checked={line.advRecommendedKm} disabled aria-readonly />
      );
    case "advSelectedMarketing":
      return (
        <Checkbox checked={line.advSelectedMarketing} disabled aria-readonly />
      );
    default:
      return <Dash />;
  }
}

interface FullCalendarGridProps {
  campaigns: PromoCampaign[];
  visibleGroups: ColumnGroupKey[];
}

export function FullCalendarGrid({
  campaigns,
  visibleGroups,
}: FullCalendarGridProps) {
  const cols = React.useMemo(
    () => COLUMNS.filter((c) => visibleGroups.includes(c.group)),
    [visibleGroups]
  );

  const groups = React.useMemo(
    () =>
      campaigns
        .map((campaign) => ({ campaign, lines: getPromoLines(campaign.id) }))
        .filter((g) => g.lines.length > 0),
    [campaigns]
  );

  if (groups.length === 0) {
    return (
      <Card className="p-0">
        <p className="py-16 text-center text-sm text-muted-foreground">
          Строки не найдены
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex">
        {/* ── Frozen identity pane (№ промо · ФИО КМ · Номенклатура) ──────── */}
        <div className="shrink-0 border-r bg-white">
          <div
            className={cn(
              "flex items-center border-b bg-gray-50 text-xs font-medium text-gray-600",
              HEADER_H
            )}
          >
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

          {groups.map(({ campaign, lines }) => (
            <div key={campaign.id}>
              {/* group band (frozen side) */}
              <div
                className={cn(
                  "flex items-center gap-2 border-b bg-gray-100/70 px-3 text-xs font-semibold text-gray-700",
                  BAND_H,
                  campaign.cancelled && "bg-red-50"
                )}
              >
                <span className="tabular-nums">{campaign.id}</span>
                <span className="font-normal text-muted-foreground">
                  · {lines.length} стр.
                </span>
              </div>

              {/* lines */}
              {lines.map((line) => {
                const km = line.kmId;
                const nom = getNomenclatureItem(line.nomenclatureId);
                return (
                  <div
                    key={line.id}
                    className={cn(
                      "group/row flex items-center border-b transition-colors hover:bg-gray-50",
                      ROW_H,
                      line.rejected && "bg-red-50/70 hover:bg-red-50"
                    )}
                  >
                    <span
                      className="px-3 text-xs tabular-nums text-muted-foreground"
                      style={colStyle(FROZEN.promo)}
                    >
                      {campaign.id}
                    </span>
                    <KmCell kmId={km} width={FROZEN.km} />
                    <div
                      className="flex items-center gap-1.5 px-3"
                      style={colStyle(FROZEN.nomenclature)}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate text-sm font-medium text-gray-900">
                            {nom?.name ?? line.nomenclatureId}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {nom ? `${nom.name} · ${line.nomenclatureId}` : line.nomenclatureId}
                        </TooltipContent>
                      </Tooltip>
                      <LineMarkers line={line} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
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
            {groups.map(({ campaign, lines }) => (
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
                  <span className="tabular-nums text-muted-foreground">
                    <RuDate value={campaign.startDate} /> —{" "}
                    <RuDate value={campaign.endDate} />
                  </span>
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
                            isLocked(col.source) && "text-gray-500"
                          )}
                          style={colStyle(col.width)}
                        >
                          <CellValue
                            col={col}
                            line={line}
                            nom={nom}
                            campaign={campaign}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
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
          <TooltipContent className="max-w-[240px]">
            Номенклатура уже участвует в промо-акции (или в акции с пересекающимся
            периодом). Добавление не блокируется — отметка видна проверяющим.
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
