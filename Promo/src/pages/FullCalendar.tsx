import React, { useState, useMemo, useCallback, useRef } from "react";
import { cn } from "@texnomart/ui/utils";
import { Badge } from "@texnomart/ui/badge";
import { Button } from "@texnomart/ui/button";
import { Card, CardContent } from "@texnomart/ui/card";
import { Input } from "@texnomart/ui/input";
import { Textarea } from "@texnomart/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@texnomart/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@texnomart/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@texnomart/ui/select";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@texnomart/ui/tooltip";
import {
  CommandDialog, CommandInput, CommandList,
  CommandEmpty, CommandGroup, CommandItem,
} from "@texnomart/ui/command";
import { Label } from "@texnomart/ui/label";
import { Separator } from "@texnomart/ui/separator";
import { Switch } from "@texnomart/ui/switch";
import {
  Lock, Pencil, AlertCircle, Plus, Upload, Download,
  FileSpreadsheet, Search, ChevronDown, ChevronRight,
  Check, X as XIcon, AlertTriangle, Wifi, WifiOff,
  Copy, Trash2, Eye, EyeOff, Columns3,
  Package, Warehouse, CheckSquare, Square,
  Ban, GitCompareArrows, Send, History,
} from "lucide-react";
import {
  type PromoCampaign,
  type PromoStatus,
  type PromoType,
  type LineChangeStatus,
  STATUS_CONFIG,
  MOCK_CAMPAIGNS,
  MOCK_MANAGERS,
  MOCK_VERSION_HISTORY,
  useApp,
  formatMoney,
  formatDate,
  StatusBadge,
  BilingualLabel,
  OverdueTag,
  Money,
  RuDate,
  ReasonDialog,
  CancelCampaignDialog,
  VersionHistoryDrawer,
  ChangeTypeBadge,
  LineChangeBadge,
  labels,
} from "../App";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface Warehouse1C {
  name: string;
  qty: number;
}

interface Nomenclature1C {
  id: string;
  name: string;
  costPrice: number;
  retailPrice: number;
  stock: number;
  warehouses: Warehouse1C[];
}

type RowReviewStatus = "none" | "rejected" | "corrected";
type CorrectionMode = "none" | "draft" | "pending_marketing";

interface FullCalendarRow {
  id: string;
  campaignId: string;
  promoSign: "Плановая" | "Внеплановая";
  kmId: string;
  kmName: string;
  promoNumber: string;
  promoType: string;
  promoName: string;
  startDate: string;
  endDate: string;
  nomenclatureId: string;
  nomenclatureName: string;
  stock: number;
  stockManuallyEdited: boolean;
  warehouses: Warehouse1C[];
  costPrice: number;
  retailPriceOld: number;
  newPrice: number;
  discountPercent: number;
  regularSales: number | null;
  forecastSales: number | null;
  inst006: number | null;
  inst0012: number | null;
  inst502: number | null;
  monthlyOld12: number | null;
  monthlyNew12: number | null;
  discount12: number | null;
  fullPriceNew12: number | null;
  monthlyOld24: number | null;
  monthlyNew24: number | null;
  discount24: number | null;
  fullPriceNew24: number | null;
  monthlyOld36: number | null;
  monthlyNew36: number | null;
  discount36: number | null;
  fullPriceNew36: number | null;
  discountCash: number | null;
  giftNomenclature: string;
  giftStock: number | null;
  compensationSum: number | null;
  compensationLimit: number | null;
  utp: string;
  inAdKm: boolean;
  inAdMarketing: boolean;
  isDuplicate: boolean;
  reviewStatus: RowReviewStatus;
  reviewComment: string;
  pending1C: boolean;
  lineStatus: LineChangeStatus;
  lineChangeReason: string;
  isChanged: boolean;
}

interface ColumnGroup {
  id: string;
  ru: string;
  en: string;
  bg: string;
  borderColor: string;
}

// ═══════════════════════════════════════════════════════════
// PROMO TYPE VALUES
// ═══════════════════════════════════════════════════════════

const PROMO_TYPES = [
  "Скидка", "1+1", "Товар в подарок",
  "Рассрочка 0-0-6", "Рассрочка 0-0-12", "Рассрочка 0-0-24",
  "Рассрочка 0-0-36", "Скидки до 80%",
];

const GIFT_TYPES = ["1+1", "Товар в подарок"];

// ═══════════════════════════════════════════════════════════
// COLUMN GROUPS
// ═══════════════════════════════════════════════════════════

const COL_GROUPS: ColumnGroup[] = [
  { id: "ident", ru: "Идентификация", en: "Identity", bg: "#FFFFFF", borderColor: "#E5E7EB" },
  { id: "product", ru: "Товар", en: "Product", bg: "#FAFBFC", borderColor: "#E5E7EB" },
  { id: "sales", ru: "Продажи", en: "Sales", bg: "#FFFFFF", borderColor: "#E5E7EB" },
  { id: "installment", ru: "Рассрочка", en: "Installment", bg: "#F8F9FB", borderColor: "#E5E7EB" },
  { id: "marketing", ru: "Маркетинг", en: "Marketing", bg: "#FFFFFF", borderColor: "#E5E7EB" },
];

// ═══════════════════════════════════════════════════════════
// MOCK 1С NOMENCLATURE
// ═══════════════════════════════════════════════════════════

const MOCK_1C_NOMENCLATURE: Nomenclature1C[] = [
  { id: "n01", name: "Samsung RF50A5202B1 Холодильник", costPrice: 5200000, retailPrice: 8999000, stock: 145, warehouses: [{ name: "Ташкент-Центр", qty: 52 }, { name: "Ташкент-Юг", qty: 38 }, { name: "Самарканд", qty: 30 }, { name: "Наманган", qty: 25 }] },
  { id: "n02", name: "LG GA-B509CQTL Холодильник", costPrice: 4800000, retailPrice: 7499000, stock: 89, warehouses: [{ name: "Ташкент-Центр", qty: 30 }, { name: "Ташкент-Юг", qty: 25 }, { name: "Бухара", qty: 18 }, { name: "Фергана", qty: 16 }] },
  { id: "n03", name: "Bosch KGN39XW28R Холодильник", costPrice: 6100000, retailPrice: 10499000, stock: 63, warehouses: [{ name: "Ташкент-Центр", qty: 28 }, { name: "Ташкент-Юг", qty: 20 }, { name: "Самарканд", qty: 15 }] },
  { id: "n04", name: "Samsung WW80T554DAW Стир. машина", costPrice: 3600000, retailPrice: 5999000, stock: 112, warehouses: [{ name: "Ташкент-Центр", qty: 42 }, { name: "Ташкент-Юг", qty: 35 }, { name: "Самарканд", qty: 20 }, { name: "Наманган", qty: 15 }] },
  { id: "n05", name: "LG F4V5TG0W Стир. машина", costPrice: 4200000, retailPrice: 6799000, stock: 74, warehouses: [{ name: "Ташкент-Центр", qty: 30 }, { name: "Ташкент-Юг", qty: 24 }, { name: "Бухара", qty: 20 }] },
  { id: "n06", name: "iPhone 15 Pro 256GB", costPrice: 12500000, retailPrice: 16999000, stock: 210, warehouses: [{ name: "Ташкент-Центр", qty: 80 }, { name: "Ташкент-Юг", qty: 60 }, { name: "Самарканд", qty: 40 }, { name: "Наманган", qty: 30 }] },
  { id: "n07", name: "Samsung Galaxy S24 Ultra 512GB", costPrice: 11800000, retailPrice: 15999000, stock: 178, warehouses: [{ name: "Ташкент-Центр", qty: 65 }, { name: "Ташкент-Юг", qty: 50 }, { name: "Самарканд", qty: 35 }, { name: "Фергана", qty: 28 }] },
  { id: "n08", name: "Xiaomi 14 Pro 256GB", costPrice: 5900000, retailPrice: 8499000, stock: 320, warehouses: [{ name: "Ташкент-Центр", qty: 120 }, { name: "Ташкент-Юг", qty: 90 }, { name: "Самарканд", qty: 60 }, { name: "Бухара", qty: 50 }] },
  { id: "n09", name: "Samsung QE65QN85C Телевизор 65\"", costPrice: 9800000, retailPrice: 14999000, stock: 45, warehouses: [{ name: "Ташкент-Центр", qty: 20 }, { name: "Ташкент-Юг", qty: 15 }, { name: "Самарканд", qty: 10 }] },
  { id: "n10", name: "LG OLED55C3 Телевизор 55\"", costPrice: 11200000, retailPrice: 17499000, stock: 32, warehouses: [{ name: "Ташкент-Центр", qty: 15 }, { name: "Ташкент-Юг", qty: 10 }, { name: "Самарканд", qty: 7 }] },
  { id: "n11", name: "ASUS ROG Strix G16 Ноутбук", costPrice: 13500000, retailPrice: 18999000, stock: 28, warehouses: [{ name: "Ташкент-Центр", qty: 12 }, { name: "Ташкент-Юг", qty: 10 }, { name: "Самарканд", qty: 6 }] },
  { id: "n12", name: "Lenovo IdeaPad 5 Pro 16\"", costPrice: 7200000, retailPrice: 10999000, stock: 56, warehouses: [{ name: "Ташкент-Центр", qty: 22 }, { name: "Ташкент-Юг", qty: 18 }, { name: "Фергана", qty: 16 }] },
  { id: "n13", name: "Dyson V15 Detect Пылесос", costPrice: 5500000, retailPrice: 8999000, stock: 67, warehouses: [{ name: "Ташкент-Центр", qty: 30 }, { name: "Ташкент-Юг", qty: 22 }, { name: "Самарканд", qty: 15 }] },
  { id: "n14", name: "Philips EP2231 Кофемашина", costPrice: 3800000, retailPrice: 5499000, stock: 43, warehouses: [{ name: "Ташкент-Центр", qty: 18 }, { name: "Ташкент-Юг", qty: 15 }, { name: "Бухара", qty: 10 }] },
  { id: "n15", name: "Samsung Galaxy Buds3 Pro", costPrice: 1400000, retailPrice: 2299000, stock: 250, warehouses: [{ name: "Ташкент-Центр", qty: 100 }, { name: "Ташкент-Юг", qty: 80 }, { name: "Самарканд", qty: 40 }, { name: "Наманган", qty: 30 }] },
  { id: "n16", name: "Apple AirPods Pro 2", costPrice: 2200000, retailPrice: 3499000, stock: 185, warehouses: [{ name: "Ташкент-Центр", qty: 70 }, { name: "Ташкент-Юг", qty: 55 }, { name: "Самарканд", qty: 35 }, { name: "Фергана", qty: 25 }] },
  { id: "n17", name: "Midea MSMA-12HRN1 Кондиционер", costPrice: 3200000, retailPrice: 4999000, stock: 96, warehouses: [{ name: "Ташкент-Центр", qty: 35 }, { name: "Ташкент-Юг", qty: 30 }, { name: "Самарканд", qty: 18 }, { name: "Бухара", qty: 13 }] },
  { id: "n18", name: "Samsung Galaxy Watch6 Classic", costPrice: 2800000, retailPrice: 4299000, stock: 78, warehouses: [{ name: "Ташкент-Центр", qty: 30 }, { name: "Ташкент-Юг", qty: 25 }, { name: "Самарканд", qty: 13 }, { name: "Наманган", qty: 10 }] },
  { id: "n19", name: "JBL Charge 5 Колонка", costPrice: 800000, retailPrice: 1299000, stock: 340, warehouses: [{ name: "Ташкент-Центр", qty: 130 }, { name: "Ташкент-Юг", qty: 100 }, { name: "Самарканд", qty: 60 }, { name: "Фергана", qty: 50 }] },
  { id: "n20", name: "Roborock S8 Pro Ultra Робот-пылесос", costPrice: 7600000, retailPrice: 11999000, stock: 29, warehouses: [{ name: "Ташкент-Центр", qty: 12 }, { name: "Ташкент-Юг", qty: 10 }, { name: "Самарканд", qty: 7 }] },
];

// ═══════════════════════════════════════════════════════════
// MOCK ROWS — ~15 rows across 4 campaigns
// ═══════════════════════════════════════════════════════════

function mkRow(partial: Partial<FullCalendarRow> & { id: string; campaignId: string; nomenclatureId: string }, campaignsRef: PromoCampaign[], managersRef: typeof MOCK_MANAGERS): FullCalendarRow {
  const nom = MOCK_1C_NOMENCLATURE.find((n) => n.id === partial.nomenclatureId);
  const campaign = campaignsRef.find((c) => c.id === partial.campaignId);
  const km = managersRef.find((m) => m.id === (partial.kmId || campaign?.managerId));
  return {
    promoSign: campaign?.type === "planned" ? "Плановая" : "Внеплановая",
    kmId: km?.id || "km1",
    kmName: km?.name || "—",
    promoNumber: campaign?.id || "",
    promoType: partial.promoType || "Скидка",
    promoName: campaign?.name || "",
    startDate: campaign?.startDate || "",
    endDate: campaign?.endDate || "",
    nomenclatureName: nom?.name || partial.nomenclatureName || "—",
    stock: nom?.stock || 0,
    stockManuallyEdited: false,
    warehouses: nom?.warehouses || [],
    costPrice: nom?.costPrice || 0,
    retailPriceOld: nom?.retailPrice || 0,
    newPrice: partial.newPrice || 0,
    discountPercent: partial.discountPercent || 0,
    regularSales: partial.regularSales ?? null,
    forecastSales: partial.forecastSales ?? null,
    inst006: partial.inst006 ?? null,
    inst0012: partial.inst0012 ?? null,
    inst502: partial.inst502 ?? null,
    monthlyOld12: partial.monthlyOld12 ?? null,
    monthlyNew12: partial.monthlyNew12 ?? null,
    discount12: partial.discount12 ?? null,
    fullPriceNew12: partial.fullPriceNew12 ?? null,
    monthlyOld24: partial.monthlyOld24 ?? null,
    monthlyNew24: partial.monthlyNew24 ?? null,
    discount24: partial.discount24 ?? null,
    fullPriceNew24: partial.fullPriceNew24 ?? null,
    monthlyOld36: partial.monthlyOld36 ?? null,
    monthlyNew36: partial.monthlyNew36 ?? null,
    discount36: partial.discount36 ?? null,
    fullPriceNew36: partial.fullPriceNew36 ?? null,
    discountCash: partial.discountCash ?? null,
    giftNomenclature: partial.giftNomenclature || "",
    giftStock: partial.giftStock ?? null,
    compensationSum: partial.compensationSum ?? null,
    compensationLimit: partial.compensationLimit ?? null,
    utp: partial.utp || "",
    inAdKm: partial.inAdKm ?? false,
    inAdMarketing: partial.inAdMarketing ?? false,
    isDuplicate: partial.isDuplicate ?? false,
    reviewStatus: partial.reviewStatus || "none",
    reviewComment: partial.reviewComment || "",
    pending1C: partial.pending1C ?? false,
    lineStatus: partial.lineStatus || "active",
    lineChangeReason: partial.lineChangeReason || "",
    isChanged: partial.isChanged ?? false,
    ...partial,
  };
}

function buildInitialRows(campaignsRef: PromoCampaign[], managersRef: typeof MOCK_MANAGERS): FullCalendarRow[] {
  const mk = (p: Partial<FullCalendarRow> & { id: string; campaignId: string; nomenclatureId: string }) => mkRow(p, campaignsRef, managersRef);
  return [
    mk({ id: "r01", campaignId: "PROMO-2026-001", nomenclatureId: "n01", kmId: "km1", newPrice: 7649000, discountPercent: 15, forecastSales: 40, regularSales: 25, inAdKm: true, inAdMarketing: true, compensationSum: 150000, compensationLimit: 100, utp: "Бесплатная доставка" }),
    mk({ id: "r02", campaignId: "PROMO-2026-001", nomenclatureId: "n02", kmId: "km1", newPrice: 6374000, discountPercent: 15, forecastSales: 30, regularSales: 18, inAdKm: true, compensationSum: 120000, compensationLimit: 80 }),
    mk({ id: "r03", campaignId: "PROMO-2026-001", nomenclatureId: "n03", kmId: "km1", newPrice: 8924000, discountPercent: 15, forecastSales: 20, inAdKm: false, reviewStatus: "rejected", reviewComment: "Скидка слишком высокая для данной позиции. Пересмотрите цену." }),
    mk({ id: "r04", campaignId: "PROMO-2026-001", nomenclatureId: "n13", kmId: "km2", promoType: "Скидка", newPrice: 7649000, discountPercent: 15, forecastSales: 15, regularSales: 8, inAdKm: true }),
    mk({ id: "r05", campaignId: "PROMO-2026-002", nomenclatureId: "n04", kmId: "km1", newPrice: 5399000, discountPercent: 10, forecastSales: 35, regularSales: 20, inAdKm: true, inAdMarketing: false }),
    mk({ id: "r06", campaignId: "PROMO-2026-002", nomenclatureId: "n05", kmId: "km1", newPrice: 6119000, discountPercent: 10, forecastSales: null, regularSales: 15 }),
    mk({ id: "r07", campaignId: "PROMO-2026-002", nomenclatureId: "n14", kmId: "km2", newPrice: 4949000, discountPercent: 10, forecastSales: 12, inAdKm: false }),
    mk({ id: "r08", campaignId: "PROMO-2026-003", nomenclatureId: "n06", kmId: "km4", promoType: "1+1", newPrice: 16999000, discountPercent: 0, forecastSales: 60, regularSales: 45, inAdKm: true, inAdMarketing: true, giftNomenclature: "Samsung Galaxy Buds3 Pro", giftStock: 250, compensationSum: 200000, compensationLimit: 150, utp: "Наушники в подарок!" }),
    mk({ id: "r09", campaignId: "PROMO-2026-003", nomenclatureId: "n07", kmId: "km4", promoType: "1+1", newPrice: 15999000, discountPercent: 0, forecastSales: 45, regularSales: 30, inAdKm: true, inAdMarketing: true, giftNomenclature: "Apple AirPods Pro 2", giftStock: 185, compensationSum: 180000, compensationLimit: 120 }),
    mk({ id: "r10", campaignId: "PROMO-2026-003", nomenclatureId: "n08", kmId: "km4", promoType: "Скидка", newPrice: 6799000, discountPercent: 20, forecastSales: 100, regularSales: 65, inAdKm: true, isDuplicate: true }),
    mk({ id: "r11", campaignId: "PROMO-2026-003", nomenclatureId: "n18", kmId: "km4", promoType: "Товар в подарок", newPrice: 4299000, discountPercent: 0, forecastSales: 25, giftNomenclature: "JBL Charge 5 Колонка", giftStock: 340 }),
    mk({ id: "r12", campaignId: "PROMO-2026-005", nomenclatureId: "n09", kmId: "km5", newPrice: 12749000, discountPercent: 15, forecastSales: 18, regularSales: 10, inAdKm: true, inAdMarketing: true, inst0012: 1062000, monthlyOld12: 1250000, monthlyNew12: 1062000, discount12: 2250000, fullPriceNew12: 12749000 }),
    mk({ id: "r13", campaignId: "PROMO-2026-005", nomenclatureId: "n10", kmId: "km5", newPrice: 14874000, discountPercent: 15, forecastSales: 12, regularSales: 6, inAdKm: true, inst0012: 1240000, monthlyOld12: 1458000, monthlyNew12: 1240000, discount12: 2625000, fullPriceNew12: 14874000, reviewStatus: "rejected", reviewComment: "Необходимо уточнить остатки по складам Самарканд." }),
    mk({ id: "r14", campaignId: "PROMO-2026-005", nomenclatureId: "n11", kmId: "km6", newPrice: 16149000, discountPercent: 15, forecastSales: 8, regularSales: 4, inAdKm: false, inst0012: 1346000, monthlyNew12: 1346000, fullPriceNew12: 16149000, pending1C: false }),
    mk({ id: "r15", campaignId: "PROMO-2026-007", nomenclatureId: "n13", kmId: "km2", newPrice: 7199000, discountPercent: 20, forecastSales: 22, regularSales: 12, inAdKm: true, compensationSum: 100000, compensationLimit: 50 }),
  ];
}

// ═══════════════════════════════════════════════════════════
// MOCK EXCEL IMPORT DATA
// ═══════════════════════════════════════════════════════════

interface ExcelPreviewRow {
  rowNum: number;
  nomenclature: string;
  valid: boolean;
  errorReason?: string;
  newPrice?: number;
  forecast?: number;
}

const MOCK_EXCEL_PREVIEW: ExcelPreviewRow[] = [
  { rowNum: 1, nomenclature: "Samsung RF50A5202B1 Холодильник", valid: true, newPrice: 7649000, forecast: 40 },
  { rowNum: 2, nomenclature: "LG GA-B509CQTL Холодильник", valid: true, newPrice: 6374000, forecast: 30 },
  { rowNum: 3, nomenclature: "НеизвестныйТовар XYZ-123", valid: false, errorReason: "Номенклатура не найдена в справочнике 1С" },
  { rowNum: 4, nomenclature: "Bosch KGN39XW28R Холодильник", valid: true, newPrice: 8924000, forecast: 20 },
  { rowNum: 5, nomenclature: "Samsung WW80T554DAW Стир. машина", valid: false, errorReason: "Не заполнено обязательное поле: Прогноз продаж" },
];

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const fmt = (v: number | null) => {
  if (v === null || v === undefined) return "—";
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const fmtMoney = (v: number | null) => {
  if (v === null || v === undefined || v === 0) return "—";
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const fmtPct = (v: number | null) => {
  if (v === null || v === undefined || v === 0) return "—";
  return `${v}%`;
};

const fmtDate = (d: string) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
};

const MONO: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontVariantNumeric: "tabular-nums",
};

// ═══════════════════════════════════════════════════════════
// COMPONENT: WarehousePopover
// ═══════════════════════════════════════════════════════════

function WarehousePopover({ warehouses, stock, manuallyEdited, onClose }: {
  warehouses: Warehouse1C[];
  stock: number;
  manuallyEdited: boolean;
  onClose: () => void;
}) {
  const total = warehouses.reduce((s, w) => s + w.qty, 0);
  return (
    <div
      className="absolute z-50 rounded-lg border p-0 shadow-lg"
      style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", minWidth: 280, top: "100%", left: 0 }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "#E5E7EB" }}>
        <div className="flex items-center gap-1.5">
          <Warehouse className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#16181D" }}>Остатки по складам</span>
        </div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-gray-100">
          <XIcon className="h-3.5 w-3.5" style={{ color: "#9CA3AF" }} />
        </button>
      </div>
      <div className="divide-y" style={{ borderColor: "#F3F4F6" }}>
        {warehouses.map((w, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-1.5">
            <span style={{ fontSize: 12, color: "#6B7280" }}>{w.name}</span>
            <span style={{ ...MONO, fontSize: 12, fontWeight: 500, color: "#16181D" }}>{fmt(w.qty)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#16181D" }}>Итого (1С)</span>
        <span style={{ ...MONO, fontSize: 12, fontWeight: 600, color: "#16181D" }}>{fmt(total)}</span>
      </div>
      {manuallyEdited && (
        <div className="px-3 py-1.5" style={{ backgroundColor: "#FFFBEB", fontSize: 11, color: "#D97706" }}>
          <Pencil className="inline h-3 w-3 mr-1" style={{ verticalAlign: "-1px" }} />
          Текущее значение ({fmt(stock)}) задано вручную
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENT: ExcelImportDialog
// ═══════════════════════════════════════════════════════════

function ExcelImportDialog({ open, onOpenChange }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [hasFile, setHasFile] = useState(false);
  const validCount = MOCK_EXCEL_PREVIEW.filter((r) => r.valid).length;
  const errorCount = MOCK_EXCEL_PREVIEW.filter((r) => !r.valid).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Manrope', sans-serif" }}>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" style={{ color: "#16A34A" }} />
              Загрузить из Excel
            </div>
          </DialogTitle>
          <DialogDescription>
            Загрузите файл Excel по установленному шаблону. Система проверит каждую строку.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button variant="outline" size="sm" className="h-8" style={{ fontSize: 12 }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Скачать шаблон
          </Button>

          {!hasFile ? (
            <div
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors hover:border-yellow-400"
              style={{ borderColor: "#D1D5DB", backgroundColor: "#FAFBFC" }}
              onClick={() => setHasFile(true)}
            >
              <Upload className="h-8 w-8 mb-3" style={{ color: "#9CA3AF" }} />
              <p style={{ fontSize: 13, fontWeight: 500, color: "#16181D" }}>
                Перетащите файл или нажмите для выбора
              </p>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                .xlsx, .xls — максимум 5MB
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 p-2 rounded" style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <FileSpreadsheet className="h-4 w-4" style={{ color: "#16A34A" }} />
                <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 500 }}>promo_data.xlsx</span>
                <button className="ml-auto p-1" onClick={() => setHasFile(false)}>
                  <XIcon className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                </button>
              </div>

              <div className="flex items-center gap-3" style={{ fontSize: 12 }}>
                <Badge style={{ backgroundColor: "#DCFCE7", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                  {validCount} корректных
                </Badge>
                {errorCount > 0 && (
                  <Badge style={{ backgroundColor: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA" }}>
                    {errorCount} с ошибками
                  </Badge>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
                <table className="w-full" style={{ fontSize: 12 }}>
                  <thead>
                    <tr style={{ backgroundColor: "#F9FAFB" }}>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280", width: 40 }}>№</th>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280" }}>Номенклатура</th>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280", width: 80 }}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_EXCEL_PREVIEW.map((row) => (
                      <tr
                        key={row.rowNum}
                        style={!row.valid ? { backgroundColor: "#FEF2F2" } : undefined}
                        className="border-t"
                      >
                        <td className="px-3 py-1.5" style={{ ...MONO, color: "#9CA3AF" }}>{row.rowNum}</td>
                        <td className="px-3 py-1.5">
                          <div style={{ color: "#16181D" }}>{row.nomenclature}</div>
                          {!row.valid && (
                            <div className="flex items-center gap-1 mt-0.5" style={{ color: "#DC2626", fontSize: 11 }}>
                              <AlertCircle className="h-3 w-3" />
                              {row.errorReason}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          {row.valid ? (
                            <Check className="h-4 w-4 mx-auto" style={{ color: "#16A34A" }} />
                          ) : (
                            <XIcon className="h-4 w-4 mx-auto" style={{ color: "#DC2626" }} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} style={{ fontSize: 13 }}>
            Отмена
          </Button>
          <Button
            disabled={!hasFile || errorCount > 0}
            style={{
              backgroundColor: hasFile && errorCount === 0 ? "#FFDD2D" : undefined,
              color: hasFile && errorCount === 0 ? "#16181D" : undefined,
              fontSize: 13,
            }}
          >
            Загрузить {validCount} строк
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENT: NewUnplannedDialog
// ═══════════════════════════════════════════════════════════

function NewUnplannedDialog({ open, onOpenChange }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [mode, setMode] = useState<"new" | "embed">("new");
  const [promoType, setPromoType] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [embedPromo, setEmbedPromo] = useState("");

  const plannedCampaigns = MOCK_CAMPAIGNS.filter((c) => c.type === "planned" && c.status !== "cancelled");

  const minDaysValid = useMemo(() => {
    if (!startDate) return true;
    const start = new Date(startDate);
    const now = new Date(2026, 5, 4);
    const diff = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 3;
  }, [startDate]);

  const canSubmit = mode === "new"
    ? (promoType && name && startDate && endDate && minDaysValid)
    : !!embedPromo;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setMode("new"); setPromoType(""); setName(""); setStartDate(""); setEndDate(""); setEmbedPromo(""); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Manrope', sans-serif" }}>
            Внеплановая акция
          </DialogTitle>
          <DialogDescription>
            Создайте новую внеплановую акцию или встройте в существующую плановую.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === "new" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            style={mode === "new" ? { backgroundColor: "#FFDD2D", color: "#16181D" } : {}}
            onClick={() => setMode("new")}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Новая акция
          </Button>
          <Button
            variant={mode === "embed" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            style={mode === "embed" ? { backgroundColor: "#FFDD2D", color: "#16181D" } : {}}
            onClick={() => setMode("embed")}
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            Встроить в плановую
          </Button>
        </div>

        {mode === "new" ? (
          <div className="space-y-3">
            <div>
              <Label style={{ fontSize: 12, color: "#6B7280" }}>Тип промо</Label>
              <Select value={promoType} onValueChange={setPromoType}>
                <SelectTrigger className="h-9 mt-1" style={{ fontSize: 13 }}>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {PROMO_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ fontSize: 12, color: "#6B7280" }}>Название акции</Label>
              <Input className="h-9 mt-1" style={{ fontSize: 13 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Введите название" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label style={{ fontSize: 12, color: "#6B7280" }}>Дата начала</Label>
                <Input type="date" className="h-9 mt-1" style={{ fontSize: 12, ...MONO }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label style={{ fontSize: 12, color: "#6B7280" }}>Дата окончания</Label>
                <Input type="date" className="h-9 mt-1" style={{ fontSize: 12, ...MONO }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            {startDate && !minDaysValid && (
              <div className="flex items-center gap-1.5 p-2 rounded" style={{ backgroundColor: "#FEF2F2", fontSize: 11, color: "#DC2626" }}>
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Минимум 3 календарных дня до начала акции
              </div>
            )}
          </div>
        ) : (
          <div>
            <Label style={{ fontSize: 12, color: "#6B7280" }}>Выберите плановую акцию</Label>
            <Select value={embedPromo} onValueChange={setEmbedPromo}>
              <SelectTrigger className="h-9 mt-1" style={{ fontSize: 13 }}>
                <SelectValue placeholder="Выберите акцию" />
              </SelectTrigger>
              <SelectContent>
                {plannedCampaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span style={{ ...MONO, fontSize: 11, color: "#9CA3AF" }}>{c.id}</span>
                    <span className="ml-2">{c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2" style={{ fontSize: 11, color: "#6B7280" }}>
              Акция сохранит признак «Плановая» с существующим номером промо.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} style={{ fontSize: 13 }}>
            Отмена
          </Button>
          <Button
            disabled={!canSubmit}
            style={{
              backgroundColor: canSubmit ? "#FFDD2D" : undefined,
              color: canSubmit ? "#16181D" : undefined,
              fontSize: 13,
            }}
            onClick={() => onOpenChange(false)}
          >
            {mode === "new" ? "Создать" : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENT: NomenclatureSearchDialog
// ═══════════════════════════════════════════════════════════

function NomenclatureSearchDialog({ open, onOpenChange, existingNomenclatureIds, onSelect }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existingNomenclatureIds: string[];
  onSelect: (nom: Nomenclature1C, isDuplicate: boolean) => void;
}) {
  const [pendingDuplicate, setPendingDuplicate] = useState<Nomenclature1C | null>(null);

  const handleSelect = (nom: Nomenclature1C) => {
    const isDup = existingNomenclatureIds.includes(nom.id);
    if (isDup) {
      setPendingDuplicate(nom);
    } else {
      onSelect(nom, false);
      onOpenChange(false);
    }
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput placeholder="Поиск номенклатуры в справочнике 1С..." />
        <CommandList>
          <CommandEmpty>Номенклатура не найдена</CommandEmpty>
          <CommandGroup heading="Справочник 1С">
            {MOCK_1C_NOMENCLATURE.map((nom) => {
              const isDup = existingNomenclatureIds.includes(nom.id);
              return (
                <CommandItem key={nom.id} onSelect={() => handleSelect(nom)} className="cursor-pointer">
                  <Package className="mr-2 h-4 w-4 shrink-0" style={{ color: "#6B7280" }} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate" style={{ fontSize: 13 }}>{nom.name}</div>
                    <div className="flex items-center gap-3 mt-0.5" style={{ fontSize: 11, color: "#9CA3AF" }}>
                      <span>Остаток: {fmt(nom.stock)}</span>
                      <span style={MONO}>{fmtMoney(nom.retailPrice)} сум</span>
                    </div>
                  </div>
                  {isDup && (
                    <Badge className="ml-2 shrink-0" style={{ backgroundColor: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", fontSize: 10 }}>
                      дубль
                    </Badge>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <Dialog open={!!pendingDuplicate} onOpenChange={(v) => { if (!v) setPendingDuplicate(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Manrope', sans-serif" }}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" style={{ color: "#D97706" }} />
                Дубль номенклатуры
              </div>
            </DialogTitle>
            <DialogDescription>
              Данная номенклатура уже участвует в промо-акции. Вы уверены, что хотите добавить дубль?
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A", fontSize: 13 }}>
            {pendingDuplicate?.name}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPendingDuplicate(null)} style={{ fontSize: 13 }}>
              Отмена
            </Button>
            <Button
              style={{ backgroundColor: "#FFDD2D", color: "#16181D", fontSize: 13 }}
              onClick={() => {
                if (pendingDuplicate) {
                  onSelect(pendingDuplicate, true);
                  setPendingDuplicate(null);
                  onOpenChange(false);
                }
              }}
            >
              Добавить дубль
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENT: MobileEditSheet
// ═══════════════════════════════════════════════════════════

function MobileEditSheet({ row, open, onOpenChange }: {
  row: FullCalendarRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!row) return null;
  const isGift = GIFT_TYPES.includes(row.promoType);

  const Field = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
    <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#F3F4F6" }}>
      <span style={{ fontSize: 12, color: "#6B7280" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: "#16181D", ...(mono ? MONO : {}) }}>{value || "—"}</span>
    </div>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-4">
      <div className="px-4 py-2" style={{ backgroundColor: "#F4F5F7" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{title}</span>
      </div>
      <div className="px-4">{children}</div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-2xl overflow-auto">
        <SheetHeader className="px-4 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5E7EB" }}>
          <SheetTitle style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16 }}>
            Редактирование строки
          </SheetTitle>
          <div style={{ fontSize: 12, color: "#6B7280" }}>{row.nomenclatureName}</div>
        </SheetHeader>

        <Section title="Идентификация">
          <Field label="Признак" value={row.promoSign} />
          <Field label="ФИО КМ" value={row.kmName} />
          <Field label="№ промо" value={row.promoNumber} mono />
          <Field label="Тип промо" value={row.promoType} />
          <Field label="Название" value={row.promoName} />
          <Field label="Дата начала" value={fmtDate(row.startDate)} mono />
          <Field label="Дата окончания" value={fmtDate(row.endDate)} mono />
        </Section>

        <Section title="Товар">
          <Field label="Номенклатура" value={row.nomenclatureName} />
          <Field label="Остаток" value={fmt(row.stock)} mono />
          <Field label="Себестоимость" value={`${fmtMoney(row.costPrice)} сум`} mono />
          <Field label="Розн. цена (старая)" value={`${fmtMoney(row.retailPriceOld)} сум`} mono />
          <Field label="Новая цена" value={`${fmtMoney(row.newPrice)} сум`} mono />
          <Field label="Скидка %" value={fmtPct(row.discountPercent)} mono />
        </Section>

        <Section title="Продажи">
          <Field label="Регулярные продажи" value={fmt(row.regularSales)} mono />
          <Field label="Прогноз продаж *" value={fmt(row.forecastSales)} mono />
        </Section>

        <Section title="Рассрочка">
          <Field label="0-0-6 платёж" value={fmtMoney(row.inst006)} mono />
          <Field label="0-0-12 платёж" value={fmtMoney(row.inst0012)} mono />
          <Field label="50-0-2 платёж" value={fmtMoney(row.inst502)} mono />
        </Section>

        <Section title="Маркетинг">
          <Field label="Скидка % за Cash" value={fmtPct(row.discountCash)} mono />
          {isGift && <Field label="Подарок" value={row.giftNomenclature} />}
          {isGift && <Field label="Остаток подарка" value={fmt(row.giftStock)} mono />}
          <Field label="Компенсация поставщика" value={fmtMoney(row.compensationSum)} mono />
          <Field label="Лимит компенсации" value={fmt(row.compensationLimit)} mono />
          <Field label="УТП" value={row.utp} />
        </Section>

        <div className="px-4 pb-6" />
      </SheetContent>
    </Sheet>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

interface FullCalendarPageProps {
  hideCancelled: boolean;
  filterPeriod: string;
  filterCategory: string;
  filterStatus: string;
  filterManager: string;
}

export default function FullCalendarPage({
  hideCancelled,
  filterPeriod,
  filterCategory,
  filterStatus,
  filterManager,
}: FullCalendarPageProps) {
  const { currentRole, campaigns, managers } = useApp();
  const isKm = currentRole === "category_manager";
  const isSeniorKm = currentRole === "senior_category_manager";
  const isKd = currentRole === "commercial_director";
  const canEdit = isKm || isSeniorKm;

  // ── State ──
  const [rows, setRows] = useState<FullCalendarRow[]>(() => buildInitialRows(campaigns, managers));
  const [is1CAvailable, setIs1CAvailable] = useState(true);
  const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>({
    ident: true, product: true, sales: true, installment: true, marketing: true,
  });
  const [collapsedCampaigns, setCollapsedCampaigns] = useState<Record<string, boolean>>({});
  const [nomDialogOpen, setNomDialogOpen] = useState(false);
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);
  const [unplannedDialogOpen, setUnplannedDialogOpen] = useState(false);
  const [warehousePopover, setWarehousePopover] = useState<string | null>(null);
  const [mobileEditRow, setMobileEditRow] = useState<FullCalendarRow | null>(null);
  const [mobileEditOpen, setMobileEditOpen] = useState(false);
  const [bulkAdKm, setBulkAdKm] = useState(false);
  const [activeCampaignForAdd, setActiveCampaignForAdd] = useState<string>("");

  // Change management state
  const [correctionMode, setCorrectionMode] = useState<CorrectionMode>("none");
  const [hideExcluded, setHideExcluded] = useState(true);
  const [cancelLineDialogOpen, setCancelLineDialogOpen] = useState(false);
  const [cancelLineTarget, setCancelLineTarget] = useState<FullCalendarRow | null>(null);
  const [cancelCampaignDialogOpen, setCancelCampaignDialogOpen] = useState(false);
  const [cancelCampaignTarget, setCancelCampaignTarget] = useState<PromoCampaign | null>(null);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [versionDrawerCampaignId, setVersionDrawerCampaignId] = useState<string>("");
  const [showToast, setShowToast] = useState<string | null>(null);


  // ── Filter rows by campaign filters ──
  const campaignMap = useMemo(() => {
    const m = new Map<string, PromoCampaign>();
    campaigns.forEach((c) => m.set(c.id, c));
    return m;
  }, [campaigns]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const campaign = campaignMap.get(row.campaignId);
      if (!campaign) return false;
      if (hideCancelled && campaign.status === "cancelled") return false;
      if (hideExcluded && (row.lineStatus === "excluded" || row.lineStatus === "cancelled_line")) return false;
      if (filterCategory !== "all" && campaign.category !== filterCategory) return false;
      if (filterStatus !== "all" && campaign.status !== filterStatus) return false;
      if (filterManager !== "all" && row.kmId !== filterManager) return false;
      if (filterPeriod) {
        const [y, m] = filterPeriod.split("-");
        const periodStart = `${y}-${m}-01`;
        const periodEnd = `${y}-${m}-31`;
        if (campaign.endDate < periodStart || campaign.startDate > periodEnd) return false;
      }
      return true;
    });
  }, [rows, campaignMap, hideCancelled, hideExcluded, filterCategory, filterStatus, filterManager, filterPeriod]);

  // ── Group rows by campaign ──
  const groupedRows = useMemo(() => {
    const groups: { campaign: PromoCampaign; rows: FullCalendarRow[] }[] = [];
    const seen = new Set<string>();
    filteredRows.forEach((row) => {
      if (!seen.has(row.campaignId)) {
        seen.add(row.campaignId);
        const campaign = campaignMap.get(row.campaignId);
        if (campaign) {
          groups.push({
            campaign,
            rows: filteredRows.filter((r) => r.campaignId === row.campaignId),
          });
        }
      }
    });
    return groups;
  }, [filteredRows, campaignMap]);

  // ── Validation ──
  const validationErrors = useMemo(() => {
    let emptyRequired = 0;
    let pending1CCount = 0;
    filteredRows.forEach((row) => {
      if (row.forecastSales === null || row.forecastSales === undefined) emptyRequired++;
      if (row.pending1C) pending1CCount++;
    });
    return { emptyRequired, pending1CCount };
  }, [filteredRows]);

  const canSendForApproval = validationErrors.emptyRequired === 0 && validationErrors.pending1CCount === 0 && is1CAvailable;

  // ── Toggle helpers ──
  const toggleGroup = (id: string) => {
    setVisibleGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCampaignCollapse = (id: string) => {
    setCollapsedCampaigns((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBulkAdKm = () => {
    const next = !bulkAdKm;
    setBulkAdKm(next);
    setRows((prev) => prev.map((r) => ({ ...r, inAdKm: next })));
  };

  // ── Existing nomenclature IDs for duplicate check ──
  const existingNomIds = useMemo(() => rows.map((r) => r.nomenclatureId), [rows]);

  // ── Change management helpers ──
  const excludedLineCount = useMemo(() =>
    rows.filter((r) => r.lineStatus === "excluded" || r.lineStatus === "cancelled_line").length,
  [rows]);

  const hasApprovedCampaigns = useMemo(() =>
    campaigns.some((c) => c.status === "approved_commercial_director" || c.status === "sent_to_departments"),
  [campaigns]);

  const handleExcludeLine = (reason: string) => {
    if (!cancelLineTarget) return;
    setRows((prev) => prev.map((r) =>
      r.id === cancelLineTarget.id
        ? { ...r, lineStatus: "excluded" as LineChangeStatus, lineChangeReason: reason }
        : r
    ));
    setCancelLineTarget(null);
    setCancelLineDialogOpen(false);
    setShowToast("Позиция исключена из акции. Требуется повторное согласование КД.");
    setTimeout(() => setShowToast(null), 4000);
  };

  const handleCancelCampaign = (reason: string) => {
    setCancelCampaignDialogOpen(false);
    setCancelCampaignTarget(null);
    setShowToast("Акция отменена. Уведомление отправлено во все отделы.");
    setTimeout(() => setShowToast(null), 4000);
  };

  const openVersionDrawer = (campaignId: string) => {
    setVersionDrawerCampaignId(campaignId);
    setVersionDrawerOpen(true);
  };

  // ── Cell rendering helpers ──
  const CellMono = ({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
    <span className={className} style={{ ...MONO, fontSize: 12, ...style }}>{children}</span>
  );

  const FROZEN_W = [160, 130, 240] as const;
  const FROZEN_TOTAL = FROZEN_W[0] + FROZEN_W[1] + FROZEN_W[2];

  const cellPad: React.CSSProperties = { padding: "0 10px" };
  const ROW_H = 44;
  const HDR1_H = 40;
  const HDR2_H = 36;

  const hdrCell: React.CSSProperties = {
    ...cellPad, backgroundColor: "#EBEDF0", height: HDR2_H,
    whiteSpace: "nowrap" as const, borderBottom: "2px solid #E5E7EB",
    fontSize: 11, fontWeight: 600, color: "#6B7280",
    position: "sticky" as const, top: HDR1_H, zIndex: 10,
  };

  const dataCell = (group: string): React.CSSProperties => ({
    ...cellPad,
    backgroundColor: COL_GROUPS.find((g) => g.id === group)?.bg || "#FFF",
    height: ROW_H, whiteSpace: "nowrap" as const,
    borderBottom: "1px solid #F0F1F3",
  });

  const scrollRightRef = useRef<HTMLDivElement>(null);
  const scrollLeftRef = useRef<HTMLDivElement>(null);

  const syncScroll = useCallback((source: "left" | "right") => {
    const l = scrollLeftRef.current;
    const r = scrollRightRef.current;
    if (!l || !r) return;
    if (source === "right") l.scrollTop = r.scrollTop;
    else r.scrollTop = l.scrollTop;
  }, []);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="relative">
      {/* ── 1С Status Banner ── */}
      {!is1CAvailable && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg mb-4"
          style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}
        >
          <WifiOff className="h-4 w-4 shrink-0" style={{ color: "#D97706" }} />
          <span style={{ fontSize: 13, color: "#92400E" }}>
            1С временно недоступен. Данные сохранены как черновик. Отправка на согласование недоступна.
          </span>
          <Badge className="ml-auto shrink-0" style={{ backgroundColor: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", fontSize: 10 }}>
            Ожидает проверки 1С
          </Badge>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Column group toggles */}
        <div className="flex items-center gap-1 mr-2">
          <Columns3 className="h-3.5 w-3.5" style={{ color: "#9CA3AF" }} />
          {COL_GROUPS.map((g) => (
            <Tooltip key={g.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => toggleGroup(g.id)}
                  className="px-2 py-1 rounded text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: visibleGroups[g.id] ? "rgba(255,221,45,0.15)" : "#F3F4F6",
                    color: visibleGroups[g.id] ? "#16181D" : "#9CA3AF",
                    border: visibleGroups[g.id] ? "1px solid rgba(255,221,45,0.4)" : "1px solid #E5E7EB",
                    fontSize: 11,
                  }}
                >
                  {g.ru}
                </button>
              </TooltipTrigger>
              <TooltipContent>{g.en}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        {/* 1С mock toggle */}
        <div className="flex items-center gap-1.5">
          <Switch checked={is1CAvailable} onCheckedChange={setIs1CAvailable} id="1c-toggle" />
          <Label htmlFor="1c-toggle" style={{ fontSize: 11, color: "#6B7280" }}>
            {is1CAvailable ? <Wifi className="inline h-3 w-3 mr-0.5" style={{ color: "#16A34A" }} /> : <WifiOff className="inline h-3 w-3 mr-0.5" style={{ color: "#DC2626" }} />}
            1С
          </Label>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        {/* Hide excluded lines toggle */}
        <div className="flex items-center gap-1.5">
          <Switch checked={hideExcluded} onCheckedChange={setHideExcluded} id="hide-excluded" />
          <Label htmlFor="hide-excluded" style={{ fontSize: 11, color: "#6B7280" }} className="cursor-pointer whitespace-nowrap">
            <EyeOff className="inline h-3 w-3 mr-0.5" style={{ verticalAlign: "-1px" }} />
            Скрыть отменённое
            {excludedLineCount > 0 && (
              <Badge className="ml-1 text-xs h-4 min-w-4 px-1" style={{ backgroundColor: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", fontSize: 9 }}>
                {excludedLineCount}
              </Badge>
            )}
          </Label>
        </div>

        {/* Correction mode indicator */}
        {correctionMode !== "none" && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
            <Badge className="text-xs gap-1" style={{
              backgroundColor: correctionMode === "pending_marketing" ? "#FEF3C7" : "#DBEAFE",
              color: correctionMode === "pending_marketing" ? "#D97706" : "#2563EB",
              border: `1px solid ${correctionMode === "pending_marketing" ? "#FDE68A" : "#BFDBFE"}`,
              fontSize: 10,
            }}>
              <Pencil className="h-3 w-3" />
              {correctionMode === "pending_marketing" ? labels.pendingMarketingReapproval.ru : "Режим корректировки"}
            </Badge>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {canEdit && (
            <>
              <Button variant="outline" size="sm" className="h-8" style={{ fontSize: 12 }} onClick={() => setExcelDialogOpen(true)}>
                <Upload className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Загрузить из Excel</span>
                <span className="sm:hidden">Excel</span>
              </Button>
              <Button variant="outline" size="sm" className="h-8" style={{ fontSize: 12 }} onClick={() => setUnplannedDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span className="hidden md:inline">Внеплановая акция</span>
                <span className="md:hidden">Внепл.</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── DATA GRID — split-pane: frozen left + scrollable right ── */}
      <div className="flex border rounded-lg" style={{ borderColor: "#E0E2E6", backgroundColor: "#FFF", maxHeight: "calc(100vh - 320px)" }}>

        {/* ═══ LEFT: Frozen columns ═══ */}
        <div
          ref={scrollLeftRef}
          onScroll={() => syncScroll("left")}
          className="fc-left-pane shrink-0 overflow-y-auto overflow-x-hidden"
          style={{ width: FROZEN_TOTAL, borderRight: "2px solid #D1D5DB", boxShadow: "3px 0 8px rgba(0,0,0,0.07)" }}
        >
          <table className="w-full" style={{ fontSize: 13, borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr><th colSpan={3} style={{ ...cellPad, position: "sticky" as const, top: 0, zIndex: 10, backgroundColor: "#EBEDF0", height: HDR1_H, borderBottom: "1px solid #D1D5DB", fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left" }}>Закреплённые</th></tr>
              <tr>
                <th className="text-left" style={{ ...cellPad, position: "sticky" as const, top: HDR1_H, zIndex: 10, backgroundColor: "#EBEDF0", height: HDR2_H, borderBottom: "2px solid #E5E7EB", fontSize: 11, fontWeight: 600, color: "#6B7280", minWidth: FROZEN_W[0], width: FROZEN_W[0], borderRight: "1px solid #D1D5DB" }}>ФИО КМ</th>
                <th className="text-left" style={{ ...cellPad, position: "sticky" as const, top: HDR1_H, zIndex: 10, backgroundColor: "#EBEDF0", height: HDR2_H, borderBottom: "2px solid #E5E7EB", fontSize: 11, fontWeight: 600, color: "#6B7280", minWidth: FROZEN_W[1], width: FROZEN_W[1], borderRight: "1px solid #D1D5DB" }}>№ промо</th>
                <th className="text-left" style={{ ...cellPad, position: "sticky" as const, top: HDR1_H, zIndex: 10, backgroundColor: "#EBEDF0", height: HDR2_H, borderBottom: "2px solid #E5E7EB", fontSize: 11, fontWeight: 600, color: "#6B7280", minWidth: FROZEN_W[2], width: FROZEN_W[2] }}>Номенклатура</th>
              </tr>
            </thead>
            <tbody>
              {groupedRows.map(({ campaign, rows: campaignRows }) => {
                const isCollapsed = collapsedCampaigns[campaign.id];
                const statusCfg = STATUS_CONFIG[campaign.status];
                return (
                  <React.Fragment key={campaign.id}>
                    <tr className="cursor-pointer select-none" onClick={() => toggleCampaignCollapse(campaign.id)}>
                      <td colSpan={3} style={{ padding: "8px 12px", backgroundColor: campaign.status === "cancelled" ? "#FEF2F2" : "#F0F1F4", borderBottom: "2px solid #E0E2E6", borderTop: "2px solid #E0E2E6" }}>
                        <div className="flex items-center gap-2 flex-nowrap overflow-hidden">
                          {isCollapsed ? <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "#6B7280" }} /> : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "#6B7280" }} />}
                          <Badge className="text-xs shrink-0" style={{ backgroundColor: campaign.type === "planned" ? "#DBEAFE" : "#FEF3C7", color: campaign.type === "planned" ? "#1D4ED8" : "#B45309", border: `1px solid ${campaign.type === "planned" ? "#BFDBFE" : "#FDE68A"}`, fontSize: 10, fontWeight: 600 }}>
                            {campaign.type === "planned" ? "План" : "Внепл"}
                          </Badge>
                          <span className="truncate" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 600, color: campaign.status === "cancelled" ? "#DC2626" : "#16181D", textDecoration: campaign.status === "cancelled" ? "line-through" : undefined }}>{campaign.name}</span>
                          {statusCfg && <Badge variant="outline" className="text-xs shrink-0" style={{ backgroundColor: statusCfg.bg, color: statusCfg.text, borderColor: statusCfg.border, fontSize: 10 }}>{statusCfg.ru}</Badge>}
                          {campaign.originalStartDate && campaign.originalStartDate !== campaign.startDate && (
                            <Tooltip><TooltipTrigger asChild><Pencil className="h-3 w-3 shrink-0" style={{ color: "#D97706" }} /></TooltipTrigger><TooltipContent>Период изменён</TooltipContent></Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                    {!isCollapsed && campaignRows.map((row, rowIdx) => {
                      const isRejected = row.reviewStatus === "rejected";
                      const isExcluded = row.lineStatus === "excluded" || row.lineStatus === "cancelled_line";
                      const isLast = rowIdx === campaignRows.length - 1;
                      const bg = isExcluded ? "#FEF2F2" : isRejected ? "#FCE8E8" : row.pending1C ? "#FFF8E1" : "#FAFBFC";
                      const bb = isLast ? "2px solid #E0E2E6" : "1px solid #F0F1F3";
                      return (
                        <tr key={row.id} onClick={() => { if (window.innerWidth < 640) { setMobileEditRow(row); setMobileEditOpen(true); } }}>
                          <td style={{ ...cellPad, backgroundColor: bg, height: ROW_H, whiteSpace: "nowrap", minWidth: FROZEN_W[0], width: FROZEN_W[0], borderRight: "1px solid #E5E7EB", borderBottom: bb }}>
                            <div className="flex items-center gap-1.5">
                              {isExcluded && <Tooltip><TooltipTrigger asChild><Ban className="h-3.5 w-3.5 shrink-0" style={{ color: "#DC2626" }} /></TooltipTrigger><TooltipContent side="right" className="max-w-xs"><p style={{ fontSize: 12, fontWeight: 500 }}>Исключена:</p><p style={{ fontSize: 12 }}>{row.lineChangeReason || "Без причины"}</p></TooltipContent></Tooltip>}
                              {isRejected && !isExcluded && <Tooltip><TooltipTrigger asChild><AlertCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "#DC2626" }} /></TooltipTrigger><TooltipContent side="right" className="max-w-xs"><p style={{ fontSize: 12, fontWeight: 500 }}>Замечание:</p><p style={{ fontSize: 12 }}>{row.reviewComment}</p></TooltipContent></Tooltip>}
                              <span className="truncate" style={{ fontSize: 12, fontWeight: 500, textDecoration: isExcluded ? "line-through" : undefined, color: isExcluded ? "#DC2626" : undefined }}>{row.kmName}</span>
                            </div>
                          </td>
                          <td style={{ ...cellPad, backgroundColor: bg, height: ROW_H, whiteSpace: "nowrap", minWidth: FROZEN_W[1], width: FROZEN_W[1], borderRight: "1px solid #E5E7EB", borderBottom: bb }}><CellMono style={isExcluded ? { textDecoration: "line-through", color: "#DC2626" } : undefined}>{row.promoNumber}</CellMono></td>
                          <td style={{ ...cellPad, backgroundColor: bg, height: ROW_H, whiteSpace: "nowrap", minWidth: FROZEN_W[2], width: FROZEN_W[2], borderBottom: bb }}>
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="truncate" style={{ fontSize: 12, textDecoration: isExcluded ? "line-through" : undefined, color: isExcluded ? "#DC2626" : undefined }}>{row.nomenclatureName}</span>
                              {isExcluded && <Badge className="shrink-0" style={{ backgroundColor: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", fontSize: 9, padding: "0 4px", height: 16 }}>исключена</Badge>}
                              {!isExcluded && row.isDuplicate && <Badge className="shrink-0" style={{ backgroundColor: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", fontSize: 9, padding: "0 4px", height: 16 }}>дубль</Badge>}
                              {!isExcluded && row.pending1C && <Badge className="shrink-0" style={{ backgroundColor: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", fontSize: 9, padding: "0 4px", height: 16 }}>1С</Badge>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {groupedRows.length === 0 && (
                <tr><td colSpan={3} className="text-center py-16"><Package className="h-10 w-10 mx-auto mb-3" style={{ color: "#D1D5DB" }} /><p style={{ fontSize: 14, fontWeight: 500, color: "#6B7280" }}>Нет данных</p></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ═══ RIGHT: Scrollable columns ═══ */}
        <div
          ref={scrollRightRef}
          onScroll={() => syncScroll("right")}
          className="flex-1 overflow-auto"
        >
          <table className="w-max min-w-full" style={{ fontSize: 13, borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              {/* Group headers */}
              <tr>
                {COL_GROUPS.map((g) => {
                  if (!visibleGroups[g.id]) return null;
                  const colCount = g.id === "ident" ? 4 : g.id === "product" ? 3 : g.id === "sales" ? (visibleGroups.product ? 4 : 2) : g.id === "installment" ? 15 : g.id === "marketing" ? 8 : 0;
                  return (
                    <th key={g.id} colSpan={colCount} className="text-center" style={{ ...cellPad, position: "sticky" as const, top: 0, zIndex: 10, backgroundColor: "#EBEDF0", height: HDR1_H, borderBottom: "1px solid #D1D5DB", borderRight: "2px solid #D1D5DB", fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {g.ru}
                      <span style={{ display: "block", fontSize: 9, fontWeight: 500, color: "#9CA3AF", letterSpacing: "0.02em", textTransform: "none" as const, marginTop: 1 }}>{g.en}</span>
                    </th>
                  );
                })}
              </tr>
              {/* Column headers */}
              <tr>
                {visibleGroups.ident && (<>
                  <th style={{ ...hdrCell, minWidth: 95 }}>Признак</th>
                  <th style={{ ...hdrCell, minWidth: 115 }}>Тип промо</th>
                  <th style={{ ...hdrCell, minWidth: 100 }}>Дата начала</th>
                  <th style={{ ...hdrCell, minWidth: 100, borderRight: "2px solid #D1D5DB" }}>Дата оконч.</th>
                </>)}
                {visibleGroups.product && (<>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 85 }}>Остаток</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 115 }}><Lock className="inline h-3 w-3 mr-0.5" style={{ verticalAlign: "-1px", color: "#C0C4CC" }} />Себест.</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 115, borderRight: visibleGroups.sales ? undefined : "2px solid #D1D5DB" }}><Lock className="inline h-3 w-3 mr-0.5" style={{ verticalAlign: "-1px", color: "#C0C4CC" }} />Розн. (стар.)</th>
                </>)}
                {visibleGroups.sales && (<>
                  {visibleGroups.product && (<>
                    <th className="text-right" style={{ ...hdrCell, minWidth: 115 }}>Новая цена</th>
                    <th className="text-right" style={{ ...hdrCell, minWidth: 75 }}>Скидка %</th>
                  </>)}
                  <th className="text-right" style={{ ...hdrCell, minWidth: 85 }}>Рег. прод.</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 85, borderRight: "2px solid #D1D5DB" }}>Прогноз <span style={{ color: "#DC2626" }}>*</span></th>
                </>)}
                {visibleGroups.installment && (<>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 90 }}>0-0-6</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 90 }}>0-0-12</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 90, borderRight: "1px solid #C5C9D1" }}>50-0-2</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 95, backgroundColor: "#EDEFF2" }}>Стар. 12м</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 95, backgroundColor: "#EDEFF2" }}>Нов. 12м</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 85, backgroundColor: "#EDEFF2" }}>Скидка 12м</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 105, backgroundColor: "#EDEFF2", borderRight: "1px solid #C5C9D1" }}>Полн. 12м</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 95 }}>Стар. 24м</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 95 }}>Нов. 24м</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 85 }}>Скидка 24м</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 105, borderRight: "1px solid #C5C9D1" }}>Полн. 24м</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 95, backgroundColor: "#EDEFF2" }}>Стар. 36м</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 95, backgroundColor: "#EDEFF2" }}>Нов. 36м</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 85, backgroundColor: "#EDEFF2" }}>Скидка 36м</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 105, backgroundColor: "#EDEFF2", borderRight: "2px solid #D1D5DB" }}>Полн. 36м</th>
                </>)}
                {visibleGroups.marketing && (<>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 75 }}>Cash %</th>
                  <th style={{ ...hdrCell, minWidth: 165 }}>Подарок</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 75 }}>Ост. подарка</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 105 }}>Компенс.</th>
                  <th className="text-right" style={{ ...hdrCell, minWidth: 75 }}>Лимит</th>
                  <th style={{ ...hdrCell, minWidth: 145 }}>УТП</th>
                  <th className="text-center" style={{ ...hdrCell, minWidth: 54 }}>
                    <Tooltip><TooltipTrigger asChild><button onClick={canEdit ? toggleBulkAdKm : undefined} className="flex items-center gap-1 mx-auto">{bulkAdKm ? <CheckSquare className="h-3.5 w-3.5" style={{ color: "#FFDD2D" }} /> : <Square className="h-3.5 w-3.5" style={{ color: "#9CA3AF" }} />}<span>КМ</span></button></TooltipTrigger><TooltipContent>В рекламу (рекомендация КМ) — выбрать все</TooltipContent></Tooltip>
                  </th>
                  <th className="text-center" style={{ ...hdrCell, minWidth: 54 }}>Марк</th>
                </>)}
              </tr>
            </thead>
            <tbody>
              {groupedRows.map(({ campaign, rows: campaignRows }) => {
                const isCollapsed = collapsedCampaigns[campaign.id];
                const statusCfg = STATUS_CONFIG[campaign.status];
                const visibleColCount = (visibleGroups.ident ? 4 : 0) + (visibleGroups.product ? 3 : 0) + (visibleGroups.sales ? (visibleGroups.product ? 4 : 2) : 0) + (visibleGroups.installment ? 15 : 0) + (visibleGroups.marketing ? 8 : 0);
                return (
                  <React.Fragment key={campaign.id}>
                    <tr className="cursor-pointer select-none" onClick={() => toggleCampaignCollapse(campaign.id)}>
                      <td colSpan={visibleColCount || 1} style={{ padding: "8px 12px", backgroundColor: "#F0F1F4", borderBottom: "2px solid #E0E2E6", borderTop: "2px solid #E0E2E6" }}>
                        <div className="flex items-center gap-2.5 flex-nowrap" style={{ whiteSpace: "nowrap" }}>
                          <span style={{ ...MONO, fontSize: 11, color: "#9CA3AF" }}>{campaign.id}</span>
                          <span style={{ fontSize: 11, color: "#6B7280" }}>·</span>
                          <span style={{ fontSize: 11, color: "#6B7280" }}>{campaign.category}</span>
                          <span style={{ ...MONO, fontSize: 11, color: "#9CA3AF" }}>{fmtDate(campaign.startDate)} — {fmtDate(campaign.endDate)}</span>
                          {campaign.overdueDays && <OverdueTag days={campaign.overdueDays} />}
                          {campaign.originalStartDate && campaign.originalStartDate !== campaign.startDate && (
                            <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: "#16181D" }}>{fmtDate(campaign.startDate)} — {fmtDate(campaign.endDate)}</span>
                          )}
                          <span style={{ ...MONO, fontSize: 11, color: "#9CA3AF" }}>{campaignRows.length} поз.</span>
                          <Badge variant="outline" className="text-xs shrink-0 cursor-pointer" style={{ fontSize: 9, color: "#6B7280", borderColor: "#E5E7EB" }} onClick={(e) => { e.stopPropagation(); openVersionDrawer(campaign.id); }}>
                            <History className="h-2.5 w-2.5 mr-0.5" />v{campaign.version}
                          </Badge>
                          {canEdit && <Button variant="ghost" size="sm" className="h-6 px-2" style={{ fontSize: 11 }} onClick={(e) => { e.stopPropagation(); setActiveCampaignForAdd(campaign.id); setNomDialogOpen(true); }}><Plus className="h-3 w-3 mr-0.5" />Добавить</Button>}
                          {isKd && campaign.status !== "cancelled" && (
                            <Button variant="ghost" size="sm" className="h-6 px-2" style={{ fontSize: 11, color: "#DC2626" }} onClick={(e) => { e.stopPropagation(); setCancelCampaignTarget(campaign); setCancelCampaignDialogOpen(true); }}>
                              <Ban className="h-3 w-3 mr-0.5" />Отменить
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {!isCollapsed && campaignRows.map((row, rowIdx) => {
                      const isRejected = row.reviewStatus === "rejected";
                      const isExcluded = row.lineStatus === "excluded" || row.lineStatus === "cancelled_line";
                      const isGift = GIFT_TYPES.includes(row.promoType);
                      const missingForecast = row.forecastSales === null || row.forecastSales === undefined;
                      const isLast = rowIdx === campaignRows.length - 1;
                      const rowBg = isExcluded ? "#FEF2F2" : isRejected ? "#FEF2F2" : row.pending1C ? "#FFFBEB" : "#FFFFFF";
                      const bb = isLast ? "2px solid #E0E2E6" : "1px solid #F0F1F3";
                      const dc = (g: string) => ({ ...dataCell(g), backgroundColor: rowBg, borderBottom: bb });
                      const bandBg = isExcluded ? "#FBE9E9" : isRejected ? "#FBE9E9" : row.pending1C ? "#FFF6D6" : "#F6F7FA";
                      const excludedStyle: React.CSSProperties = isExcluded ? { textDecoration: "line-through", color: "#DC2626", opacity: 0.7 } : {};
                      return (
                        <tr key={row.id}>
                          {visibleGroups.ident && (<>
                            <td style={dc("ident")}><Badge className="text-xs" style={{ backgroundColor: row.promoSign === "Плановая" ? "#DBEAFE" : "#FEF3C7", color: row.promoSign === "Плановая" ? "#1D4ED8" : "#B45309", border: `1px solid ${row.promoSign === "Плановая" ? "#BFDBFE" : "#FDE68A"}`, fontSize: 10 }}>{row.promoSign}</Badge></td>
                            <td style={dc("ident")}><span style={{ fontSize: 12 }}>{row.promoType}</span></td>
                            <td style={dc("ident")}><CellMono style={{ fontSize: 11 }}>{fmtDate(row.startDate)}</CellMono></td>
                            <td style={{ ...dc("ident"), borderRight: "2px solid #E0E2E6" }}><CellMono style={{ fontSize: 11 }}>{fmtDate(row.endDate)}</CellMono></td>
                          </>)}
                          {visibleGroups.product && (<>
                            <td className="text-right relative" style={dc("product")}>
                              <button className="inline-flex items-center gap-0.5 hover:underline" onClick={(e) => { e.stopPropagation(); setWarehousePopover(warehousePopover === row.id ? null : row.id); }}>
                                <CellMono style={{ fontSize: 12 }}>{fmt(row.stock)}</CellMono>
                                {row.stockManuallyEdited && <Tooltip><TooltipTrigger asChild><Pencil className="h-3 w-3 ml-0.5" style={{ color: "#D97706" }} /></TooltipTrigger><TooltipContent>Изменено вручную</TooltipContent></Tooltip>}
                              </button>
                              {warehousePopover === row.id && <WarehousePopover warehouses={row.warehouses} stock={row.stock} manuallyEdited={row.stockManuallyEdited} onClose={() => setWarehousePopover(null)} />}
                            </td>
                            <td className="text-right" style={dc("product")}><div className="flex items-center justify-end gap-0.5"><CellMono style={{ fontSize: 12, color: "#8C919A" }}>{fmtMoney(row.costPrice)}</CellMono><Lock className="h-3 w-3 shrink-0" style={{ color: "#D1D5DB" }} /></div></td>
                            <td className="text-right" style={{ ...dc("product"), borderRight: visibleGroups.sales ? undefined : "2px solid #E0E2E6" }}><div className="flex items-center justify-end gap-0.5"><CellMono style={{ fontSize: 12, color: "#8C919A" }}>{fmtMoney(row.retailPriceOld)}</CellMono><Lock className="h-3 w-3 shrink-0" style={{ color: "#D1D5DB" }} /></div></td>
                          </>)}
                          {visibleGroups.sales && (<>
                            {visibleGroups.product && (<>
                              <td className="text-right" style={dc("sales")}><CellMono style={{ fontSize: 12, fontWeight: 600, color: "#16181D" }}>{fmtMoney(row.newPrice)}</CellMono></td>
                              <td className="text-right" style={dc("sales")}><CellMono style={{ fontSize: 12, color: row.discountPercent > 0 ? "#DC2626" : "#8C919A", fontWeight: row.discountPercent > 0 ? 600 : 400 }}>{fmtPct(row.discountPercent)}</CellMono></td>
                            </>)}
                            <td className="text-right" style={dc("sales")}><CellMono style={{ fontSize: 12, color: "#6B7280" }}>{fmt(row.regularSales)}</CellMono></td>
                            <td className="text-right" style={{ ...dc("sales"), borderRight: "2px solid #E0E2E6" }}><div className="flex items-center justify-end gap-1"><CellMono style={{ fontSize: 12, fontWeight: 500, color: missingForecast ? "#DC2626" : "#16181D" }}>{fmt(row.forecastSales)}</CellMono>{missingForecast && <span style={{ color: "#DC2626", fontSize: 12, fontWeight: 700 }}>*</span>}</div></td>
                          </>)}
                          {visibleGroups.installment && (<>
                            <td className="text-right" style={{ ...dc("installment") }}><CellMono style={{ fontSize: 11 }}>{fmtMoney(row.inst006)}</CellMono></td>
                            <td className="text-right" style={{ ...dc("installment") }}><CellMono style={{ fontSize: 11 }}>{fmtMoney(row.inst0012)}</CellMono></td>
                            <td className="text-right" style={{ ...dc("installment"), borderRight: "1px solid #D1D5DB" }}><CellMono style={{ fontSize: 11 }}>{fmtMoney(row.inst502)}</CellMono></td>
                            <td className="text-right" style={{ ...dc("installment"), backgroundColor: bandBg }}><CellMono style={{ fontSize: 11 }}>{fmtMoney(row.monthlyOld12)}</CellMono></td>
                            <td className="text-right" style={{ ...dc("installment"), backgroundColor: bandBg }}><CellMono style={{ fontSize: 11 }}>{fmtMoney(row.monthlyNew12)}</CellMono></td>
                            <td className="text-right" style={{ ...dc("installment"), backgroundColor: bandBg }}><CellMono style={{ fontSize: 11 }}>{fmtMoney(row.discount12)}</CellMono></td>
                            <td className="text-right" style={{ ...dc("installment"), backgroundColor: bandBg, borderRight: "1px solid #D1D5DB" }}><CellMono style={{ fontSize: 11 }}>{fmtMoney(row.fullPriceNew12)}</CellMono></td>
                            <td className="text-right" style={{ ...dc("installment") }}><CellMono style={{ fontSize: 11 }}>{fmtMoney(row.monthlyOld24)}</CellMono></td>
                            <td className="text-right" style={{ ...dc("installment") }}><CellMono style={{ fontSize: 11 }}>{fmtMoney(row.monthlyNew24)}</CellMono></td>
                            <td className="text-right" style={{ ...dc("installment") }}><CellMono style={{ fontSize: 11 }}>{fmtMoney(row.discount24)}</CellMono></td>
                            <td className="text-right" style={{ ...dc("installment"), borderRight: "1px solid #D1D5DB" }}><CellMono style={{ fontSize: 11 }}>{fmtMoney(row.fullPriceNew24)}</CellMono></td>
                            <td className="text-right" style={{ ...dc("installment"), backgroundColor: bandBg }}><CellMono style={{ fontSize: 11 }}>{fmtMoney(row.monthlyOld36)}</CellMono></td>
                            <td className="text-right" style={{ ...dc("installment"), backgroundColor: bandBg }}><CellMono style={{ fontSize: 11 }}>{fmtMoney(row.monthlyNew36)}</CellMono></td>
                            <td className="text-right" style={{ ...dc("installment"), backgroundColor: bandBg }}><CellMono style={{ fontSize: 11 }}>{fmtMoney(row.discount36)}</CellMono></td>
                            <td className="text-right" style={{ ...dc("installment"), backgroundColor: bandBg, borderRight: "2px solid #D1D5DB" }}><CellMono style={{ fontSize: 11 }}>{fmtMoney(row.fullPriceNew36)}</CellMono></td>
                          </>)}
                          {visibleGroups.marketing && (<>
                            <td className="text-right" style={dc("marketing")}><CellMono style={{ fontSize: 12 }}>{fmtPct(row.discountCash)}</CellMono></td>
                            <td style={dc("marketing")}><span className="truncate block" style={{ fontSize: 12, maxWidth: 155, color: isGift ? "#16181D" : "#D1D5DB" }}>{isGift ? row.giftNomenclature || "—" : "—"}</span></td>
                            <td className="text-right" style={dc("marketing")}><CellMono style={{ fontSize: 12, color: isGift ? "#16181D" : "#D1D5DB" }}>{isGift ? fmt(row.giftStock) : "—"}</CellMono></td>
                            <td className="text-right" style={dc("marketing")}><CellMono style={{ fontSize: 12 }}>{fmtMoney(row.compensationSum)}</CellMono></td>
                            <td className="text-right" style={dc("marketing")}><CellMono style={{ fontSize: 12 }}>{fmt(row.compensationLimit)}</CellMono></td>
                            <td style={dc("marketing")}><span className="truncate block" style={{ fontSize: 12, maxWidth: 135 }}>{row.utp || "—"}</span></td>
                            <td className="text-center" style={dc("marketing")}><div className="flex justify-center">{row.inAdKm ? <Check className="h-4 w-4" style={{ color: "#FFDD2D" }} /> : <span style={{ color: "#D1D5DB" }}>—</span>}</div></td>
                            <td className="text-center" style={dc("marketing")}><div className="flex justify-center">{row.inAdMarketing ? <Check className="h-4 w-4" style={{ color: "#16A34A" }} /> : <span style={{ color: "#D1D5DB" }}>—</span>}</div></td>
                          </>)}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {groupedRows.length === 0 && (
                <tr><td colSpan={999} className="text-center py-16"><Package className="h-10 w-10 mx-auto mb-3" style={{ color: "#D1D5DB" }} /><p style={{ fontSize: 14, fontWeight: 500, color: "#6B7280" }}>Нет данных по выбранным фильтрам</p><p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>Попробуйте изменить параметры фильтрации</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Sticky Bottom Action Bar ── */}
      <div
        className="sticky bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-3 px-4 py-3 mt-3 rounded-lg border"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", boxShadow: "0 -2px 8px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: 12 }}>
          {validationErrors.emptyRequired > 0 && (
            <div className="flex items-center gap-1" style={{ color: "#DC2626" }}>
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{validationErrors.emptyRequired} обязательных полей не заполнены</span>
            </div>
          )}
          {validationErrors.pending1CCount > 0 && (
            <div className="flex items-center gap-1" style={{ color: "#D97706" }}>
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{validationErrors.pending1CCount} строк ожидают проверки 1С</span>
            </div>
          )}
          {validationErrors.emptyRequired === 0 && validationErrors.pending1CCount === 0 && is1CAvailable && (
            <div className="flex items-center gap-1" style={{ color: "#16A34A" }}>
              <Check className="h-3.5 w-3.5" />
              <span>Все данные заполнены корректно</span>
            </div>
          )}
          <span style={{ color: "#9CA3AF", ...MONO, fontSize: 11 }}>
            {filteredRows.length} строк · {groupedRows.length} акций
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {correctionMode !== "none" && (
            <Badge className="text-xs gap-1 mr-1" style={{
              backgroundColor: correctionMode === "pending_marketing" ? "#FEF3C7" : "#DBEAFE",
              color: correctionMode === "pending_marketing" ? "#D97706" : "#2563EB",
              border: `1px solid ${correctionMode === "pending_marketing" ? "#FDE68A" : "#BFDBFE"}`,
              fontSize: 10,
            }}>
              <Pencil className="h-3 w-3" />
              {correctionMode === "pending_marketing" ? "Ожидает согл. маркетинга" : "Корректировка (черновик)"}
            </Badge>
          )}
          {hasApprovedCampaigns && correctionMode === "none" && canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              style={{ fontSize: 12 }}
              onClick={() => setCorrectionMode("draft")}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              {labels.createCorrection.ru}
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8" style={{ fontSize: 12 }}>
            Сохранить черновик
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  size="sm"
                  className="h-8"
                  disabled={!canSendForApproval || !canEdit}
                  style={{
                    backgroundColor: canSendForApproval && canEdit ? "#FFDD2D" : undefined,
                    color: canSendForApproval && canEdit ? "#16181D" : undefined,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {correctionMode !== "none" ? "Отправить корректировку" : "Отправить на согласование"}
                </Button>
              </span>
            </TooltipTrigger>
            {(!canSendForApproval || !canEdit) && (
              <TooltipContent>
                {!canEdit
                  ? "Только КМ может отправлять данные"
                  : !is1CAvailable
                    ? "1С недоступен — дождитесь восстановления"
                    : "Заполните все обязательные поля"}
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <NomenclatureSearchDialog
        open={nomDialogOpen}
        onOpenChange={setNomDialogOpen}
        existingNomenclatureIds={existingNomIds}
        onSelect={(nom, isDup) => {
          console.log("Selected nomenclature:", nom.name, isDup ? "(duplicate)" : "");
        }}
      />
      <ExcelImportDialog open={excelDialogOpen} onOpenChange={setExcelDialogOpen} />
      <NewUnplannedDialog open={unplannedDialogOpen} onOpenChange={setUnplannedDialogOpen} />
      <MobileEditSheet row={mobileEditRow} open={mobileEditOpen} onOpenChange={setMobileEditOpen} />

      {/* Line cancel dialog */}
      <ReasonDialog
        open={cancelLineDialogOpen}
        onOpenChange={setCancelLineDialogOpen}
        title="Исключить из акции"
        description={`Позиция «${cancelLineTarget?.nomenclatureName || ""}» будет исключена. Требуется повторное согласование КД.`}
        confirmLabel="Исключить"
        onConfirm={handleExcludeLine}
      />

      {/* Campaign cancel dialog */}
      <CancelCampaignDialog
        open={cancelCampaignDialogOpen}
        onOpenChange={setCancelCampaignDialogOpen}
        campaignName={cancelCampaignTarget?.name || ""}
        onConfirm={handleCancelCampaign}
      />

      {/* Version history drawer */}
      <VersionHistoryDrawer
        open={versionDrawerOpen}
        onOpenChange={setVersionDrawerOpen}
        campaignId={versionDrawerCampaignId}
      />

      {/* Toast notification */}
      {showToast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg"
          style={{ backgroundColor: "#16181D", color: "#FFFFFF", fontSize: 13, maxWidth: 420 }}
        >
          <Send className="h-4 w-4 shrink-0" style={{ color: "#FFDD2D" }} />
          {showToast}
        </div>
      )}
    </div>
  );
}
