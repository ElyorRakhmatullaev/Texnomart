import React, { useState, useMemo } from "react";
import {
  useApp, BilingualLabel, StatusBadge, OverdueTag, Money, RuDate,
  ChangeTypeBadge, VersionHistoryDrawer, formatMoney, formatDate,
  labels, MOCK_CAMPAIGNS, MOCK_DEPARTMENT_REPORTS, ROLES,
  type DepartmentType, type DepartmentReport, type ReportLine, type PromoCampaign,
} from "@/App";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
import { Card, CardContent } from "@texnomart/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@texnomart/ui/select";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@texnomart/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@texnomart/ui/dialog";
import { Switch } from "@texnomart/ui/switch";
import { Label } from "@texnomart/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@texnomart/ui/sheet";
import { Separator } from "@texnomart/ui/separator";
import {
  BarChart3, History, Eye, CheckCircle2, Clock, AlertTriangle,
  Check, Minus, Info, ChevronDown, ChevronRight, FileText,
  CheckSquare, Square, Send,
} from "lucide-react";

// ════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════

const MONO: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontVariantNumeric: "tabular-nums",
};

const DEPT_TABS: { id: DepartmentType; ru: string; en: string }[] = [
  { id: "marketing", ru: "Маркетинг", en: "Marketing" },
  { id: "purchasing", ru: "Закуп", en: "Purchasing" },
  { id: "analytics", ru: "Аналитика", en: "Analytics" },
];

const DEPT_TAB_ACCESS: Record<DepartmentType, string[]> = {
  marketing: ["admin", "commercial_director", "operational_director", "marketing_director", "marketing_staff"],
  purchasing: ["admin", "commercial_director", "operational_director", "purchasing_staff"],
  analytics: ["admin", "commercial_director", "operational_director", "analytics_staff"],
};

const OVERDUE_THRESHOLD_DAYS = 17;

type MarketingField = {
  key: keyof ReportLine;
  ru: string;
  en: string;
  width: number;
  format?: "money" | "percent" | "date" | "check" | "text" | "number";
  group?: string;
};

const MARKETING_COLUMNS: MarketingField[] = [
  { key: "nomenclature", ru: "Номенклатура", en: "Nomenclature", width: 220, format: "text", group: "Идентификация" },
  { key: "promoType", ru: "Тип промо", en: "Promo type", width: 100, format: "text", group: "Идентификация" },
  { key: "startDate", ru: "Дата начала", en: "Start date", width: 110, format: "date", group: "Идентификация" },
  { key: "endDate", ru: "Дата окончания", en: "End date", width: 110, format: "date", group: "Идентификация" },
  { key: "stock", ru: "Остаток", en: "Stock", width: 80, format: "number", group: "Товар" },
  { key: "oldPrice", ru: "Розн. цена (старая)", en: "Old retail price", width: 150, format: "money", group: "Товар" },
  { key: "newPrice", ru: "Новая цена", en: "New price", width: 140, format: "money", group: "Цены" },
  { key: "discountPercent", ru: "Скидка %", en: "Discount %", width: 90, format: "percent", group: "Цены" },
  { key: "inst006", ru: "0-0-6 платёж", en: "0-0-6 payment", width: 120, format: "money", group: "Рассрочка" },
  { key: "inst0012", ru: "0-0-12 платёж", en: "0-0-12 payment", width: 120, format: "money", group: "Рассрочка" },
  { key: "inst5002", ru: "50-0-2 платёж", en: "50-0-2 payment", width: 120, format: "money", group: "Рассрочка" },
  { key: "oldPayment12", ru: "Платёж (стар.) 12м", en: "Old 12m pmt", width: 140, format: "money", group: "Рассрочка 12м" },
  { key: "newPayment12", ru: "Платёж (нов.) 12м", en: "New 12m pmt", width: 140, format: "money", group: "Рассрочка 12м" },
  { key: "discount12", ru: "Скидка 12м", en: "12m discount", width: 110, format: "money", group: "Рассрочка 12м" },
  { key: "fullPrice12", ru: "Полная цена 12м", en: "Full price 12m", width: 140, format: "money", group: "Рассрочка 12м" },
  { key: "oldPayment24", ru: "Платёж (стар.) 24м", en: "Old 24m pmt", width: 140, format: "money", group: "Рассрочка 24м" },
  { key: "newPayment24", ru: "Платёж (нов.) 24м", en: "New 24m pmt", width: 140, format: "money", group: "Рассрочка 24м" },
  { key: "discount24", ru: "Скидка 24м", en: "24m discount", width: 110, format: "money", group: "Рассрочка 24м" },
  { key: "fullPrice24", ru: "Полная цена 24м", en: "Full price 24m", width: 140, format: "money", group: "Рассрочка 24м" },
  { key: "oldPayment36", ru: "Платёж (стар.) 36м", en: "Old 36m pmt", width: 140, format: "money", group: "Рассрочка 36м" },
  { key: "newPayment36", ru: "Платёж (нов.) 36м", en: "New 36m pmt", width: 140, format: "money", group: "Рассрочка 36м" },
  { key: "discount36", ru: "Скидка 36м", en: "36m discount", width: 110, format: "money", group: "Рассрочка 36м" },
  { key: "fullPrice36", ru: "Полная цена 36м", en: "Full price 36m", width: 140, format: "money", group: "Рассрочка 36м" },
  { key: "cashDiscount", ru: "Скидка % за Cash", en: "Cash discount %", width: 130, format: "percent", group: "Маркетинг" },
  { key: "giftNomenclature", ru: "Подарок", en: "Gift item", width: 200, format: "text", group: "Маркетинг" },
  { key: "giftStock", ru: "Остаток подарка", en: "Gift stock", width: 120, format: "number", group: "Маркетинг" },
  { key: "utp", ru: "УТП", en: "USP", width: 200, format: "text", group: "Маркетинг" },
  { key: "inAdvKm", ru: "В рекламу (КМ)", en: "Adv (CM)", width: 120, format: "check", group: "Маркетинг" },
  { key: "inAdvMarketing", ru: "В рекламу (Маркетинг)", en: "Adv (Marketing)", width: 160, format: "check", group: "Маркетинг" },
  { key: "supplierCompensation", ru: "Компенсация поставщика", en: "Supplier compensation", width: 170, format: "money", group: "Маркетинг" },
  { key: "compensationLimit", ru: "Лимит компенсации", en: "Compensation limit", width: 140, format: "number", group: "Маркетинг" },
];

const PURCHASING_COLUMNS: MarketingField[] = [
  { key: "promoType", ru: "Тип промо", en: "Promo type", width: 120, format: "text" },
  { key: "promoName", ru: "Название акции", en: "Campaign name", width: 220, format: "text" },
  { key: "startDate", ru: "Дата начала", en: "Start date", width: 120, format: "date" },
  { key: "endDate", ru: "Дата окончания", en: "End date", width: 120, format: "date" },
  { key: "nomenclature", ru: "Номенклатура", en: "Nomenclature", width: 240, format: "text" },
  { key: "giftNomenclature", ru: "Номенклатура подарков", en: "Gift nomenclature", width: 220, format: "text" },
  { key: "supplierCompensation", ru: "Компенсация поставщика", en: "Supplier compensation", width: 180, format: "money" },
  { key: "compensationLimit", ru: "Лимит компенсации", en: "Compensation limit", width: 150, format: "number" },
];

const ANALYTICS_COLUMNS: MarketingField[] = [...PURCHASING_COLUMNS];

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function getAccessibleTabs(role: string): DepartmentType[] {
  return DEPT_TABS.filter((t) => DEPT_TAB_ACCESS[t.id].includes(role)).map((t) => t.id);
}

function isOverdue(sentDate: string, startDate: string): boolean {
  const sent = new Date(sentDate);
  const start = new Date(startDate);
  const diff = Math.floor((start.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24));
  return diff < OVERDUE_THRESHOLD_DAYS;
}

function formatCellValue(value: unknown, format?: string): string {
  if (value === undefined || value === null || value === "") return "—";
  switch (format) {
    case "money": return formatMoney(value as number);
    case "percent": return `${value}%`;
    case "date": return formatDate(value as string);
    case "number": return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    default: return String(value);
  }
}

function getColumnsForDept(dept: DepartmentType): MarketingField[] {
  switch (dept) {
    case "marketing": return MARKETING_COLUMNS;
    case "purchasing": return PURCHASING_COLUMNS;
    case "analytics": return ANALYTICS_COLUMNS;
  }
}

function getFrozenColumnsForDept(dept: DepartmentType): MarketingField[] {
  if (dept === "marketing") {
    return [
      { key: "kmName", ru: "ФИО КМ", en: "CM Name", width: 160, format: "text" },
      { key: "promoNumber", ru: "№ промо", en: "Promo #", width: 140, format: "text" },
    ];
  }
  return [];
}

// ════════════════════════════════════════════════════════════
// REPORT TABLE (DESKTOP)
// ════════════════════════════════════════════════════════════

function ReportTable({
  report, dept, showOnlyChanged, selectedLines, onToggleLine, onToggleAll,
  onToggleInAdvMarketing, currentRole,
}: {
  report: DepartmentReport;
  dept: DepartmentType;
  showOnlyChanged: boolean;
  selectedLines: Set<string>;
  onToggleLine: (id: string) => void;
  onToggleAll: () => void;
  onToggleInAdvMarketing: (id: string) => void;
  currentRole: string;
}) {
  const columns = getColumnsForDept(dept);
  const frozenCols = getFrozenColumnsForDept(dept);
  const hasFrozen = frozenCols.length > 0;

  const lines = showOnlyChanged
    ? report.lines.filter((l) => l.changeKind && !l.acknowledged)
    : report.lines;

  const unacknowledgedLines = lines.filter((l) => l.changeKind && !l.acknowledged);
  const allUnackSelected = unacknowledgedLines.length > 0 &&
    unacknowledgedLines.every((l) => selectedLines.has(l.id));

  const isMarketingEditor = dept === "marketing" &&
    (currentRole === "marketing_staff" || currentRole === "marketing_director");

  const leftRef = React.useRef<HTMLDivElement>(null);
  const rightRef = React.useRef<HTMLDivElement>(null);

  const syncScroll = (source: "left" | "right") => {
    const from = source === "left" ? leftRef.current : rightRef.current;
    const to = source === "left" ? rightRef.current : leftRef.current;
    if (from && to) to.scrollTop = from.scrollTop;
  };

  const frozenWidth = frozenCols.reduce((sum, c) => sum + c.width, 0) + (unacknowledgedLines.length > 0 ? 44 : 0);

  const TH: React.CSSProperties = {
    position: "sticky", top: 0, zIndex: 10,
    backgroundColor: "#F9FAFB", borderBottom: "2px solid #E5E7EB",
    padding: "10px 12px", fontSize: 12, fontWeight: 600, textAlign: "left",
    whiteSpace: "nowrap", color: "#374151",
  };
  const TD: React.CSSProperties = {
    padding: "10px 12px", fontSize: 13, borderBottom: "1px solid #F3F4F6",
    whiteSpace: "nowrap", color: "#16181D",
  };

  function renderCell(line: ReportLine, col: MarketingField): React.ReactNode {
    const val = line[col.key];

    if (col.key === "inAdvMarketing" && isMarketingEditor) {
      return (
        <button
          onClick={() => onToggleInAdvMarketing(line.id)}
          className="flex items-center justify-center w-8 h-8 rounded"
          style={{
            backgroundColor: val ? "#DCFCE7" : "#F3F4F6",
            color: val ? "#16A34A" : "#9CA3AF",
            minWidth: 32, minHeight: 32,
          }}
        >
          {val ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
        </button>
      );
    }

    if (col.format === "check") {
      return val
        ? <Check className="h-4 w-4" style={{ color: "#16A34A" }} />
        : <Minus className="h-4 w-4" style={{ color: "#9CA3AF" }} />;
    }

    const isChanged = line.changedFields?.includes(col.key as string) && !line.acknowledged;
    const isAddedRow = line.changeKind === "added" && !line.acknowledged;

    return (
      <span
        className={isAddedRow ? "cell-added" : isChanged ? "cell-modified" : ""}
        style={col.format === "money" || col.format === "number" || col.format === "percent" || col.format === "date" ? MONO : undefined}
      >
        {formatCellValue(val, col.format)}
      </span>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-12 w-12 mb-3" style={{ color: "#9CA3AF" }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
          Нет изменённых данных
        </p>
        <p style={{ fontSize: 12, color: "#9CA3AF" }}>
          No changed data to display
        </p>
      </div>
    );
  }

  if (!hasFrozen) {
    return (
      <div className="overflow-auto border rounded-lg" style={{ borderColor: "#E5E7EB" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%" }}>
          <thead>
            <tr>
              {unacknowledgedLines.length > 0 && (
                <th style={{ ...TH, width: 44 }}>
                  <button onClick={onToggleAll} className="flex items-center justify-center w-6 h-6">
                    {allUnackSelected
                      ? <CheckSquare className="h-4 w-4" style={{ color: "#16A34A" }} />
                      : <Square className="h-4 w-4" style={{ color: "#9CA3AF" }} />}
                  </button>
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} style={{ ...TH, minWidth: col.width }}>
                  <div>{col.ru}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 400 }}>{col.en}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const isAdded = line.changeKind === "added" && !line.acknowledged;
              return (
                <tr
                  key={line.id}
                  className="row-hover"
                  style={isAdded ? { backgroundColor: "#F0FDF4" } : undefined}
                >
                  {unacknowledgedLines.length > 0 && (
                    <td style={{ ...TD, width: 44 }}>
                      {line.changeKind && !line.acknowledged ? (
                        <button
                          onClick={() => onToggleLine(line.id)}
                          className="flex items-center justify-center w-6 h-6"
                        >
                          {selectedLines.has(line.id)
                            ? <CheckSquare className="h-4 w-4" style={{ color: "#16A34A" }} />
                            : <Square className="h-4 w-4" style={{ color: "#9CA3AF" }} />}
                        </button>
                      ) : null}
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} style={TD}>{renderCell(line, col)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Split-pane for marketing (wide table)
  return (
    <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
      {/* Frozen left pane */}
      <div
        ref={leftRef}
        className="shrink-0 overflow-y-auto fc-left-pane"
        style={{ width: frozenWidth, borderRight: "2px solid #E5E7EB", maxHeight: 600 }}
        onScroll={() => syncScroll("left")}
      >
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%" }}>
          <thead>
            <tr>
              {unacknowledgedLines.length > 0 && (
                <th style={{ ...TH, width: 44 }}>
                  <button onClick={onToggleAll} className="flex items-center justify-center w-6 h-6">
                    {allUnackSelected
                      ? <CheckSquare className="h-4 w-4" style={{ color: "#16A34A" }} />
                      : <Square className="h-4 w-4" style={{ color: "#9CA3AF" }} />}
                  </button>
                </th>
              )}
              {frozenCols.map((col) => (
                <th key={col.key} style={{ ...TH, minWidth: col.width }}>
                  <div>{col.ru}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 400 }}>{col.en}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const isAdded = line.changeKind === "added" && !line.acknowledged;
              return (
                <tr
                  key={line.id}
                  className="row-hover"
                  style={{ ...(isAdded ? { backgroundColor: "#F0FDF4" } : {}), height: 44 }}
                >
                  {unacknowledgedLines.length > 0 && (
                    <td style={{ ...TD, width: 44 }}>
                      {line.changeKind && !line.acknowledged ? (
                        <button
                          onClick={() => onToggleLine(line.id)}
                          className="flex items-center justify-center w-6 h-6"
                        >
                          {selectedLines.has(line.id)
                            ? <CheckSquare className="h-4 w-4" style={{ color: "#16A34A" }} />
                            : <Square className="h-4 w-4" style={{ color: "#9CA3AF" }} />}
                        </button>
                      ) : null}
                    </td>
                  )}
                  {frozenCols.map((col) => (
                    <td key={col.key} style={TD}>
                      <span style={col.key === "promoNumber" ? MONO : undefined}>
                        {String(line[col.key] ?? "—")}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Scrollable right pane */}
      <div
        ref={rightRef}
        className="flex-1 overflow-auto"
        style={{ maxHeight: 600 }}
        onScroll={() => syncScroll("right")}
      >
        <table style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ ...TH, minWidth: col.width }}>
                  <div>{col.ru}</div>
                  <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 400 }}>{col.en}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const isAdded = line.changeKind === "added" && !line.acknowledged;
              return (
                <tr
                  key={line.id}
                  className="row-hover"
                  style={{ ...(isAdded ? { backgroundColor: "#F0FDF4" } : {}), height: 44 }}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={TD}>{renderCell(line, col)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// REPORT CARD (MOBILE / MODE B)
// ════════════════════════════════════════════════════════════

function ReportCard({
  line, dept, selected, onToggle, onToggleInAdvMarketing, currentRole,
}: {
  line: ReportLine;
  dept: DepartmentType;
  selected: boolean;
  onToggle: () => void;
  onToggleInAdvMarketing: () => void;
  currentRole: string;
}) {
  const isAdded = line.changeKind === "added" && !line.acknowledged;
  const isModified = line.changeKind === "modified" && !line.acknowledged;
  const isMarketingEditor = dept === "marketing" &&
    (currentRole === "marketing_staff" || currentRole === "marketing_director");
  const hasChange = (isAdded || isModified) && !line.acknowledged;

  return (
    <Card
      className="border"
      style={{
        borderColor: isAdded ? "#BBF7D0" : isModified ? "#FDE68A" : "#E5E7EB",
        backgroundColor: isAdded ? "#F0FDF4" : isModified ? "#FFFBEB" : "#FFFFFF",
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 14, fontWeight: 600, color: "#16181D" }} className="truncate">
              {line.nomenclature}
            </p>
            <p style={{ fontSize: 12, color: "#6B7280" }}>
              {line.kmName} · <span style={MONO}>{line.promoNumber}</span>
            </p>
          </div>
          {isAdded && (
            <Badge variant="outline" style={{ backgroundColor: "#DCFCE7", color: "#16A34A", borderColor: "#BBF7D0", fontSize: 11 }}>
              Новая
            </Badge>
          )}
          {isModified && (
            <Badge variant="outline" style={{ backgroundColor: "#FEF3C7", color: "#D97706", borderColor: "#FDE68A", fontSize: 11 }}>
              Изменена
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
          <div>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>Тип</span>
            <p style={{ fontSize: 13 }}>{line.promoType}</p>
          </div>
          <div>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>Период</span>
            <p style={{ ...MONO, fontSize: 13 }}>{formatDate(line.startDate)} – {formatDate(line.endDate)}</p>
          </div>

          {dept === "marketing" && (
            <>
              <div>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>Новая цена</span>
                <p style={{ ...MONO, fontSize: 13, fontWeight: 600 }}>
                  <span className={line.changedFields?.includes("newPrice") && !line.acknowledged ? "cell-modified" : ""}>
                    {formatMoney(line.newPrice)}
                  </span>
                </p>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>Скидка</span>
                <p style={{ ...MONO, fontSize: 13, color: "#DC2626" }}>{line.discountPercent}%</p>
              </div>
              {line.giftNomenclature && (
                <div className="col-span-2">
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>Подарок</span>
                  <p style={{ fontSize: 13 }}>{line.giftNomenclature}</p>
                </div>
              )}
              {line.utp && (
                <div className="col-span-2">
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>УТП</span>
                  <p style={{ fontSize: 13 }}>{line.utp}</p>
                </div>
              )}
            </>
          )}

          {(dept === "purchasing" || dept === "analytics") && (
            <>
              <div>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>Компенсация</span>
                <p style={{ ...MONO, fontSize: 13 }}>{formatMoney(line.supplierCompensation)}</p>
              </div>
              <div>
                <span style={{ fontSize: 11, color: "#9CA3AF" }}>Лимит</span>
                <p style={{ ...MONO, fontSize: 13 }}>{line.compensationLimit}</p>
              </div>
              {line.giftNomenclature && (
                <div className="col-span-2">
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>Подарок</span>
                  <p style={{ fontSize: 13 }}>{line.giftNomenclature}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Marketing checkbox + acknowledge — tappable ≥44px */}
        <div className="flex items-center gap-3 pt-2" style={{ borderTop: "1px solid #F3F4F6" }}>
          {isMarketingEditor && (
            <button
              onClick={onToggleInAdvMarketing}
              className="flex items-center gap-2 px-3 rounded-md"
              style={{
                minHeight: 44,
                backgroundColor: line.inAdvMarketing ? "#DCFCE7" : "#F3F4F6",
                color: line.inAdvMarketing ? "#16A34A" : "#6B7280",
                fontSize: 13,
              }}
            >
              {line.inAdvMarketing ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              В рекламу
            </button>
          )}
          {hasChange && (
            <button
              onClick={onToggle}
              className="flex items-center gap-2 px-3 rounded-md ml-auto"
              style={{
                minHeight: 44,
                backgroundColor: selected ? "#DBEAFE" : "#F3F4F6",
                color: selected ? "#2563EB" : "#6B7280",
                fontSize: 13,
              }}
            >
              {selected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              Ознакомлен
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════
// MARKETING BULK SELECT BAR
// ════════════════════════════════════════════════════════════

function MarketingBulkBar({
  lines, onBulkToggle,
}: {
  lines: ReportLine[];
  onBulkToggle: (value: boolean) => void;
}) {
  const allSelected = lines.every((l) => l.inAdvMarketing);
  const noneSelected = lines.every((l) => !l.inAdvMarketing);
  const count = lines.filter((l) => l.inAdvMarketing).length;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 rounded-lg mb-3"
      style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}
    >
      <FileText className="h-4 w-4 shrink-0" style={{ color: "#D97706" }} />
      <span style={{ fontSize: 13, color: "#92400E" }}>
        «В рекламу (маркетинг)» — выбрано {count} из {lines.length}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          style={{ fontSize: 12 }}
          onClick={() => onBulkToggle(true)}
          disabled={allSelected}
        >
          Выбрать все
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          style={{ fontSize: 12 }}
          onClick={() => onBulkToggle(false)}
          disabled={noneSelected}
        >
          Снять все
        </Button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════

export default function ReportsPage() {
  const { currentRole, campaigns } = useApp();

  // ── Eligible campaigns (sent_to_departments or approved_commercial_director) ──
  const sentCampaigns = useMemo(
    () => campaigns.filter(
      (c) => c.status === "sent_to_departments" || c.status === "approved_commercial_director"
    ),
    [campaigns],
  );

  // ── State ──
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(() =>
    MOCK_DEPARTMENT_REPORTS[0]?.campaignId ?? ""
  );
  const [activeTab, setActiveTab] = useState<DepartmentType>(() => {
    const tabs = getAccessibleTabs(currentRole);
    return tabs[0] ?? "marketing";
  });
  const [showOnlyChanged, setShowOnlyChanged] = useState(false);
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [reportLines, setReportLines] = useState<ReportLine[]>(() =>
    MOCK_DEPARTMENT_REPORTS.flatMap((r) => r.lines)
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Reset tab when role changes
  React.useEffect(() => {
    const tabs = getAccessibleTabs(currentRole);
    if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0] ?? "marketing");
    }
  }, [currentRole]);

  // ── Derived ──
  const accessibleTabs = useMemo(() => getAccessibleTabs(currentRole), [currentRole]);

  const currentReport = useMemo(() => {
    const found = MOCK_DEPARTMENT_REPORTS.find((r) => r.campaignId === selectedCampaignId);
    if (!found) return null;
    return { ...found, lines: reportLines.filter((l) => l.promoNumber === found.campaignId) };
  }, [selectedCampaignId, reportLines]);

  const currentCampaign = sentCampaigns.find((c) => c.id === selectedCampaignId);
  const baseReport = MOCK_DEPARTMENT_REPORTS.find((r) => r.campaignId === selectedCampaignId);
  const overdueFlag = baseReport && currentCampaign
    ? isOverdue(baseReport.sentDate, currentCampaign.startDate)
    : false;

  const unacknowledgedCount = currentReport
    ? currentReport.lines.filter((l) => l.changeKind && !l.acknowledged).length
    : 0;

  // ── Handlers ──
  const handleToggleLine = (id: string) => {
    setSelectedLines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (!currentReport) return;
    const unack = currentReport.lines.filter((l) => l.changeKind && !l.acknowledged);
    const allSelected = unack.every((l) => selectedLines.has(l.id));
    if (allSelected) {
      setSelectedLines(new Set());
    } else {
      setSelectedLines(new Set(unack.map((l) => l.id)));
    }
  };

  const handleAcknowledge = () => {
    if (selectedLines.size === 0) return;
    setReportLines((prev) =>
      prev.map((l) => selectedLines.has(l.id) ? { ...l, acknowledged: true } : l)
    );
    const count = selectedLines.size;
    setSelectedLines(new Set());
    showToast(`Ознакомление подтверждено для ${count} строк`);
  };

  const handleAcknowledgeAll = () => {
    if (!currentReport) return;
    const ids = currentReport.lines.filter((l) => l.changeKind && !l.acknowledged).map((l) => l.id);
    setReportLines((prev) =>
      prev.map((l) => ids.includes(l.id) ? { ...l, acknowledged: true } : l)
    );
    setSelectedLines(new Set());
    showToast(`Ознакомление подтверждено для ${ids.length} строк`);
  };

  const handleToggleInAdvMarketing = (id: string) => {
    setReportLines((prev) =>
      prev.map((l) => l.id === id ? { ...l, inAdvMarketing: !l.inAdvMarketing } : l)
    );
  };

  const handleBulkInAdvMarketing = (value: boolean) => {
    if (!currentReport) return;
    const ids = new Set(currentReport.lines.map((l) => l.id));
    setReportLines((prev) =>
      prev.map((l) => ids.has(l.id) ? { ...l, inAdvMarketing: value } : l)
    );
  };

  const handleSaveMarketing = () => {
    showToast("Данные сохранены. КМ уведомлены об изменениях в «В рекламу»");
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // ── No access ──
  if (accessibleTabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BarChart3 className="h-12 w-12 mb-3" style={{ color: "#9CA3AF" }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>Нет доступа</p>
        <p style={{ fontSize: 13, color: "#9CA3AF" }}>No department reports available for your role</p>
      </div>
    );
  }

  // ── No campaigns sent ──
  if (sentCampaigns.length === 0 && MOCK_DEPARTMENT_REPORTS.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Send className="h-12 w-12 mb-3" style={{ color: "#9CA3AF" }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>Нет отправленных отчётов</p>
        <p style={{ fontSize: 13, color: "#9CA3AF" }}>
          Reports appear after a campaign reaches «Согласовано и отправлено смежным отделам»
        </p>
      </div>
    );
  }

  const isMarketingEditor = activeTab === "marketing" &&
    (currentRole === "marketing_staff" || currentRole === "marketing_director");

  return (
    <div className="space-y-4">
      {/* ── Page Title ── */}
      <BilingualLabel ru="Отчёты смежным отделам" en="Department reports" size="page" />

      {/* ── Campaign Selector + Meta ── */}
      <Card className="border" style={{ borderColor: "#E5E7EB" }}>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <Label style={{ fontSize: 12, color: "#6B7280" }}>Акция / Campaign</Label>
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger className="mt-1 h-9" style={{ fontSize: 13 }}>
                  <SelectValue placeholder="Выберите акцию..." />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_DEPARTMENT_REPORTS.map((r) => (
                    <SelectItem key={r.campaignId} value={r.campaignId}>
                      <span style={MONO}>{r.campaignId}</span>
                      <span className="ml-2">{r.campaignName}</span>
                      <span className="ml-2" style={{ color: "#9CA3AF", fontSize: 12 }}>v{r.version}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {baseReport && (
              <div className="flex flex-wrap items-center gap-3">
                {/* Version */}
                <Badge
                  variant="outline"
                  className="text-xs font-medium"
                  style={{ backgroundColor: "#DBEAFE", color: "#2563EB", borderColor: "#BFDBFE" }}
                >
                  v{baseReport.version}
                </Badge>

                {/* Received timeline */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "#6B7280" }}>
                      <Clock className="h-3.5 w-3.5" />
                      <span>получено</span>
                      <span style={MONO}>{formatDate(baseReport.receivedDate)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Received on {formatDate(baseReport.receivedDate)}</TooltipContent>
                </Tooltip>

                {/* Overdue marker */}
                {overdueFlag && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="text-xs gap-1"
                        style={{ backgroundColor: "#FEE2E2", color: "#DC2626", borderColor: "#FECACA" }}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Отправлено с опозданием
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Report was sent less than {OVERDUE_THRESHOLD_DAYS} calendar days before campaign start
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Unacknowledged count */}
                {unacknowledgedCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{ backgroundColor: "#FEF3C7", color: "#D97706", borderColor: "#FDE68A" }}
                  >
                    {unacknowledgedCount} не ознакомлено
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Department Tabs (desktop) / Select (mobile) ── */}
      <div>
        {/* Desktop tabs */}
        <div className="hidden md:flex items-center gap-1 mb-4">
          {DEPT_TABS.filter((t) => accessibleTabs.includes(t.id)).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  backgroundColor: isActive ? "#FFDD2D" : "#FFFFFF",
                  color: "#16181D",
                  border: isActive ? "1px solid #F5C400" : "1px solid #E5E7EB",
                }}
              >
                {tab.ru}
                <span className="ml-1.5" style={{ fontSize: 11, color: isActive ? "#92400E" : "#9CA3AF" }}>
                  {tab.en}
                </span>
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-3">
            {/* Show only changed toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="show-changed"
                checked={showOnlyChanged}
                onCheckedChange={setShowOnlyChanged}
              />
              <Label htmlFor="show-changed" style={{ fontSize: 12, color: "#6B7280", cursor: "pointer" }}>
                Только изменения
              </Label>
            </div>

            {/* Version history button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              style={{ fontSize: 12 }}
              onClick={() => setVersionDrawerOpen(true)}
            >
              <History className="h-3.5 w-3.5" />
              История версий
            </Button>
          </div>
        </div>

        {/* Mobile: Select + controls */}
        <div className="md:hidden space-y-3 mb-4">
          <Select
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as DepartmentType)}
          >
            <SelectTrigger className="h-10" style={{ fontSize: 13 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEPT_TABS.filter((t) => accessibleTabs.includes(t.id)).map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  {tab.ru} / {tab.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Switch
                id="show-changed-m"
                checked={showOnlyChanged}
                onCheckedChange={setShowOnlyChanged}
              />
              <Label htmlFor="show-changed-m" style={{ fontSize: 12, color: "#6B7280" }}>
                Только изменения
              </Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              style={{ fontSize: 12 }}
              onClick={() => setVersionDrawerOpen(true)}
            >
              <History className="h-3.5 w-3.5" />
              Версии
            </Button>
          </div>
        </div>
      </div>

      {/* ── Info: acknowledgement ≠ approval ── */}
      {unacknowledgedCount > 0 && (
        <div
          className="flex items-start gap-2.5 px-4 py-3 rounded-lg"
          style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}
        >
          <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#2563EB" }} />
          <div>
            <p style={{ fontSize: 13, color: "#1E40AF", fontWeight: 500 }}>
              Ознакомление не является согласованием
            </p>
            <p style={{ fontSize: 12, color: "#3B82F6" }}>
              Acknowledgement does not change the campaign status and is not an approval action.
            </p>
          </div>
        </div>
      )}

      {/* ── Marketing re-approval note ── */}
      {activeTab === "marketing" && (
        <div
          className="flex items-start gap-2.5 px-4 py-3 rounded-lg"
          style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#D97706" }} />
          <div>
            <p style={{ fontSize: 13, color: "#92400E", fontWeight: 500 }}>
              Изменения в уже отправленных данных требуют повторного согласования маркетинга
            </p>
            <p style={{ fontSize: 12, color: "#B45309" }}>
              Edits to previously sent data require marketing re-approval before being distributed.
            </p>
          </div>
        </div>
      )}

      {/* ── Marketing bulk select bar ── */}
      {isMarketingEditor && currentReport && (
        <MarketingBulkBar
          lines={currentReport.lines}
          onBulkToggle={handleBulkInAdvMarketing}
        />
      )}

      {/* ── Report content ── */}
      {currentReport ? (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <ReportTable
              report={currentReport}
              dept={activeTab}
              showOnlyChanged={showOnlyChanged}
              selectedLines={selectedLines}
              onToggleLine={handleToggleLine}
              onToggleAll={handleToggleAll}
              onToggleInAdvMarketing={handleToggleInAdvMarketing}
              currentRole={currentRole}
            />
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {(showOnlyChanged
              ? currentReport.lines.filter((l) => l.changeKind && !l.acknowledged)
              : currentReport.lines
            ).map((line) => (
              <ReportCard
                key={line.id}
                line={line}
                dept={activeTab}
                selected={selectedLines.has(line.id)}
                onToggle={() => handleToggleLine(line.id)}
                onToggleInAdvMarketing={() => handleToggleInAdvMarketing(line.id)}
                currentRole={currentRole}
              />
            ))}
            {showOnlyChanged && currentReport.lines.filter((l) => l.changeKind && !l.acknowledged).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-10 w-10 mb-2" style={{ color: "#9CA3AF" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Нет изменённых данных</p>
                <p style={{ fontSize: 12, color: "#9CA3AF" }}>No changed data to display</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 mb-3" style={{ color: "#9CA3AF" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Выберите акцию для просмотра отчёта</p>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>Select a campaign to view the report</p>
        </div>
      )}

      {/* ── Bottom action bar ── */}
      {currentReport && (unacknowledgedCount > 0 || isMarketingEditor) && (
        <div
          className="sticky bottom-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 py-3 -mx-6 mt-4 rounded-t-lg border-t"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", zIndex: 20 }}
        >
          {/* Acknowledge actions */}
          {unacknowledgedCount > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                style={{ fontSize: 13 }}
                disabled={selectedLines.size === 0}
                onClick={handleAcknowledge}
              >
                <Eye className="h-4 w-4" />
                Ознакомлен ({selectedLines.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                style={{ fontSize: 13 }}
                onClick={handleAcknowledgeAll}
              >
                <CheckCircle2 className="h-4 w-4" />
                Ознакомиться со всем
              </Button>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                Acknowledge
              </span>
            </div>
          )}

          {/* Marketing save */}
          {isMarketingEditor && (
            <Button
              size="sm"
              className="h-9 gap-1.5 sm:ml-auto"
              style={{
                fontSize: 13, fontWeight: 600,
                backgroundColor: "#FFDD2D", color: "#16181D",
              }}
              onClick={handleSaveMarketing}
            >
              <Send className="h-4 w-4" />
              Сохранить и уведомить КМ
            </Button>
          )}
        </div>
      )}

      {/* ── Version History Drawer ── */}
      <VersionHistoryDrawer
        open={versionDrawerOpen}
        onOpenChange={setVersionDrawerOpen}
        campaignId={selectedCampaignId}
      />

      {/* ── Toast ── */}
      {toastMsg && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg z-50"
          style={{ backgroundColor: "#16181D", color: "#FFFFFF", fontSize: 13, maxWidth: 420 }}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#4ADE80" }} />
          {toastMsg}
        </div>
      )}
    </div>
  );
}
