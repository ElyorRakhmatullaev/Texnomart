import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
import { Card, CardContent } from "@texnomart/ui/card";
import { Textarea } from "@texnomart/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@texnomart/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@texnomart/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@texnomart/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@texnomart/ui/avatar";
import { Separator } from "@texnomart/ui/separator";
import {
  ArrowLeft, Check, X, AlertCircle, ChevronDown, ChevronUp,
  Clock, Forward, UserX, Send, MoreVertical,
  CheckCircle2, XCircle, ArrowRight, Info, FileText,
} from "lucide-react";
import {
  type PromoCampaign,
  type PromoType,
  type CategoryManager,
  useApp,
  BilingualLabel,
  OverdueTag,
  ReasonDialog,
  Money,
} from "../App";

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

type ApprovalItemType = "data_review" | "non_participation";

type ApprovalItemStatus =
  | "pending_senior"
  | "pending_kd"
  | "approved"
  | "rejected"
  | "kd_direct_np";

interface ReviewComment {
  id: string;
  author: string;
  authorRole: string;
  date: string;
  text: string;
  lineIds?: string[];
}

interface SubmittedLine {
  id: string;
  nomenclatureName: string;
  stock: number;
  costPrice: number;
  oldPrice: number;
  newPrice: number;
  discountPercent: number;
  forecastSales: number | null;
  regularSales: number | null;
}

interface ApprovalItem {
  id: string;
  type: ApprovalItemType;
  promoId: string;
  promoName: string;
  promoType: PromoType;
  kmId: string;
  kmName: string;
  kmInitials: string;
  category: string;
  status: ApprovalItemStatus;
  submittedAt: string;
  slaDeadline: string;
  autoForwarded: boolean;
  kdOverdue: boolean;
  kdOverdueDays?: number;
  rejectedBy?: "senior_km" | "kd";
  npReason?: string;
  kdDirectSet?: boolean;
  lines: SubmittedLine[];
  comments: ReviewComment[];
}

// ════════════════════════════════════════════════════════════
// STATUS CONFIG
// ════════════════════════════════════════════════════════════

const APPROVAL_STATUS_CONFIG: Record<ApprovalItemStatus, {
  ru: string; en: string; bg: string; text: string; border: string;
}> = {
  pending_senior: { ru: "На согл. у ст. КМ", en: "Pending senior CM", bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
  pending_kd: { ru: "На согл. у КД", en: "Pending com. dir.", bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
  approved: { ru: "Принято КД", en: "Approved by com. dir.", bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0" },
  rejected: { ru: "Отклонено", en: "Rejected", bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" },
  kd_direct_np: { ru: "Не уч. (решение КД)", en: "Non-part. (CD decision)", bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" },
};

const ITEM_TYPE_CONFIG: Record<ApprovalItemType, { ru: string; en: string; bg: string; text: string; border: string }> = {
  data_review: { ru: "Данные", en: "Data", bg: "#DBEAFE", text: "#2563EB", border: "#BFDBFE" },
  non_participation: { ru: "Не участвует", en: "Non-part.", bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" },
};

// ════════════════════════════════════════════════════════════
// WORKING DAYS HELPERS (Mon–Fri, holidays NOT excluded per spec)
// ════════════════════════════════════════════════════════════

const REFERENCE_DATE = new Date("2026-06-04T12:00:00");

function isWorkingDay(d: Date): boolean {
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

function addWorkingDays(from: Date, days: number): Date {
  const r = new Date(from);
  let added = 0;
  while (added < days) {
    r.setDate(r.getDate() + 1);
    if (isWorkingDay(r)) added++;
  }
  return r;
}

function getWorkingDaysBetween(from: Date, to: Date): number {
  let count = 0;
  const d = new Date(from);
  const direction = to > from ? 1 : -1;
  if (direction === 1) {
    while (d < to) {
      d.setDate(d.getDate() + 1);
      if (isWorkingDay(d)) count++;
    }
  } else {
    while (d > to) {
      d.setDate(d.getDate() - 1);
      if (isWorkingDay(d)) count++;
    }
  }
  return count * direction;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

// ════════════════════════════════════════════════════════════
// MOCK DATA — built lazily inside component via useState init
// ════════════════════════════════════════════════════════════

function buildMockApprovalItems(): ApprovalItem[] {
  return [
    {
      id: "apr-01", type: "data_review", promoId: "PROMO-2026-002",
      promoName: "Скидки на стиральные машины", promoType: "planned",
      kmId: "km1", kmName: "Алишер Каримов", kmInitials: "АК",
      category: "Стиральные машины", status: "pending_senior",
      submittedAt: "2026-06-03T09:00:00", slaDeadline: "2026-06-05",
      autoForwarded: false, kdOverdue: false, comments: [],
      lines: [
        { id: "l01", nomenclatureName: "Samsung WW80T554DAW", stock: 45, costPrice: 3200000, oldPrice: 4499000, newPrice: 3899000, discountPercent: 13, forecastSales: 30, regularSales: 22 },
        { id: "l02", nomenclatureName: "LG F2V5HS9B", stock: 32, costPrice: 2800000, oldPrice: 3999000, newPrice: 3499000, discountPercent: 12, forecastSales: 25, regularSales: 18 },
        { id: "l03", nomenclatureName: "Bosch WGA254A0ME", stock: 18, costPrice: 4100000, oldPrice: 5299000, newPrice: 4699000, discountPercent: 11, forecastSales: 15, regularSales: 10 },
        { id: "l04", nomenclatureName: "Haier HW70-BP12929A", stock: 55, costPrice: 2200000, oldPrice: 2999000, newPrice: 2599000, discountPercent: 13, forecastSales: 40, regularSales: 28 },
      ],
    },
    {
      id: "apr-02", type: "data_review", promoId: "PROMO-2026-005",
      promoName: "Акция на телевизоры Samsung", promoType: "planned",
      kmId: "km6", kmName: "Севара Ташпулатова", kmInitials: "СТ",
      category: "Ноутбуки", status: "pending_senior",
      submittedAt: "2026-06-03T14:30:00", slaDeadline: "2026-06-05",
      autoForwarded: false, kdOverdue: false, comments: [],
      lines: [
        { id: "l05", nomenclatureName: "ASUS TUF Gaming F15", stock: 22, costPrice: 8500000, oldPrice: 11999000, newPrice: 10499000, discountPercent: 12, forecastSales: 12, regularSales: 8 },
        { id: "l06", nomenclatureName: "Lenovo IdeaPad 3 15ALC6", stock: 35, costPrice: 4200000, oldPrice: 5999000, newPrice: 5199000, discountPercent: 13, forecastSales: 20, regularSales: 15 },
        { id: "l07", nomenclatureName: "HP Pavilion 15-eg3000", stock: 28, costPrice: 5500000, oldPrice: 7499000, newPrice: 6499000, discountPercent: 13, forecastSales: 18, regularSales: 12 },
      ],
    },
    {
      id: "apr-03", type: "non_participation", promoId: "PROMO-2026-002",
      promoName: "Скидки на стиральные машины", promoType: "planned",
      kmId: "km2", kmName: "Дилнавоз Рахимова", kmInitials: "ДР",
      category: "Мелкая бытовая техника", status: "pending_senior",
      submittedAt: "2026-06-02T11:00:00", slaDeadline: "2026-06-04",
      autoForwarded: false, kdOverdue: false,
      npReason: "Нет подходящей номенклатуры в моей категории МБТ для данной акции на стиральные машины.",
      comments: [], lines: [],
    },
    {
      id: "apr-04", type: "data_review", promoId: "PROMO-2026-005",
      promoName: "Акция на телевизоры Samsung", promoType: "planned",
      kmId: "km5", kmName: "Рустам Мирзаев", kmInitials: "РМ",
      category: "Телевизоры", status: "pending_kd",
      submittedAt: "2026-05-29T10:00:00", slaDeadline: "2026-06-03",
      autoForwarded: false, kdOverdue: true, kdOverdueDays: 1,
      comments: [
        { id: "c01", author: "Бахтиёр Юлдашев", authorRole: "Ст. КМ", date: "2026-06-01T11:20:00", text: "Данные проверены, всё корректно. Направляю коммерческому директору." },
      ],
      lines: [
        { id: "l08", nomenclatureName: "Samsung QE55Q60CAUXCE", stock: 30, costPrice: 5800000, oldPrice: 7999000, newPrice: 6999000, discountPercent: 12, forecastSales: 20, regularSales: 14 },
        { id: "l09", nomenclatureName: "LG 55UP75006LF", stock: 42, costPrice: 4200000, oldPrice: 5499000, newPrice: 4799000, discountPercent: 12, forecastSales: 28, regularSales: 20 },
        { id: "l10", nomenclatureName: "Sony KD-55X75K", stock: 15, costPrice: 7200000, oldPrice: 9499000, newPrice: 8299000, discountPercent: 12, forecastSales: 10, regularSales: 7 },
      ],
    },
    {
      id: "apr-05", type: "data_review", promoId: "PROMO-2026-007",
      promoName: "Микроволновки и мультиварки", promoType: "planned",
      kmId: "km2", kmName: "Дилнавоз Рахимова", kmInitials: "ДР",
      category: "Мелкая бытовая техника", status: "pending_kd",
      submittedAt: "2026-05-28T16:00:00", slaDeadline: "2026-06-03",
      autoForwarded: true, kdOverdue: true, kdOverdueDays: 1,
      comments: [
        { id: "c02", author: "Система", authorRole: "Авто", date: "2026-06-01T18:00:00", text: "Автоматически передано коммерческому директору по истечении 2 рабочих дней без реакции старшего КМ." },
      ],
      lines: [
        { id: "l11", nomenclatureName: "Samsung ME83KRQS-3", stock: 60, costPrice: 850000, oldPrice: 1299000, newPrice: 999000, discountPercent: 23, forecastSales: 45, regularSales: 30 },
        { id: "l12", nomenclatureName: "LG MS-2042DB", stock: 48, costPrice: 780000, oldPrice: 1199000, newPrice: 899000, discountPercent: 25, forecastSales: 40, regularSales: 28 },
        { id: "l13", nomenclatureName: "Polaris PMC 0567AD", stock: 35, costPrice: 650000, oldPrice: 999000, newPrice: 799000, discountPercent: 20, forecastSales: 30, regularSales: 22 },
        { id: "l14", nomenclatureName: "Redmond RMC-M252", stock: 55, costPrice: 720000, oldPrice: 1099000, newPrice: 849000, discountPercent: 22, forecastSales: 35, regularSales: 24 },
      ],
    },
    {
      id: "apr-06", type: "non_participation", promoId: "PROMO-2026-004",
      promoName: "Ноутбуки к учебному году", promoType: "planned",
      kmId: "km5", kmName: "Рустам Мирзаев", kmInitials: "РМ",
      category: "Телевизоры", status: "pending_kd",
      submittedAt: "2026-06-01T09:00:00", slaDeadline: "2026-06-04",
      autoForwarded: false, kdOverdue: false,
      npReason: "Не планирую предоставлять данные по телевизорам для акции ноутбуков — категория не пересекается.",
      comments: [
        { id: "c03", author: "Бахтиёр Юлдашев", authorRole: "Ст. КМ", date: "2026-06-02T14:00:00", text: "Причина обоснована, согласен. Передаю на рассмотрение КД." },
      ],
      lines: [],
    },
    {
      id: "apr-07", type: "data_review", promoId: "PROMO-2026-001",
      promoName: "Летняя распродажа холодильников", promoType: "planned",
      kmId: "km1", kmName: "Алишер Каримов", kmInitials: "АК",
      category: "Холодильники", status: "approved",
      submittedAt: "2026-05-22T09:00:00", slaDeadline: "2026-05-26",
      autoForwarded: false, kdOverdue: false,
      comments: [
        { id: "c04", author: "Бахтиёр Юлдашев", authorRole: "Ст. КМ", date: "2026-05-23T16:00:00", text: "Данные корректны. Передаю КД." },
        { id: "c05", author: "Фарход Ибрагимов", authorRole: "КД", date: "2026-05-28T14:00:00", text: "Утверждаю." },
      ],
      lines: [
        { id: "l15", nomenclatureName: "Samsung RS76CG8003SLWT", stock: 20, costPrice: 9500000, oldPrice: 12999000, newPrice: 10999000, discountPercent: 15, forecastSales: 15, regularSales: 10 },
        { id: "l16", nomenclatureName: "LG GN-B422SQCL", stock: 35, costPrice: 4800000, oldPrice: 6499000, newPrice: 5499000, discountPercent: 15, forecastSales: 25, regularSales: 18 },
        { id: "l17", nomenclatureName: "Bosch KGN39AI32R", stock: 12, costPrice: 7200000, oldPrice: 9499000, newPrice: 7999000, discountPercent: 15, forecastSales: 8, regularSales: 5 },
      ],
    },
    {
      id: "apr-08", type: "data_review", promoId: "PROMO-2026-001",
      promoName: "Летняя распродажа холодильников", promoType: "planned",
      kmId: "km2", kmName: "Дилнавоз Рахимова", kmInitials: "ДР",
      category: "Мелкая бытовая техника", status: "approved",
      submittedAt: "2026-05-23T10:00:00", slaDeadline: "2026-05-27",
      autoForwarded: false, kdOverdue: false,
      comments: [
        { id: "c06", author: "Севара Ташпулатова", authorRole: "Ст. КМ", date: "2026-05-26T10:00:00", text: "Всё в порядке." },
        { id: "c07", author: "Фарход Ибрагимов", authorRole: "КД", date: "2026-05-29T11:00:00", text: "Принято." },
      ],
      lines: [
        { id: "l18", nomenclatureName: "Midea MDRS723MYF28", stock: 28, costPrice: 3800000, oldPrice: 4999000, newPrice: 4249000, discountPercent: 15, forecastSales: 20, regularSales: 14 },
        { id: "l19", nomenclatureName: "Haier CEF535ACG", stock: 18, costPrice: 6200000, oldPrice: 7999000, newPrice: 6799000, discountPercent: 15, forecastSales: 12, regularSales: 8 },
        { id: "l20", nomenclatureName: "Indesit DS 4180 W", stock: 45, costPrice: 2200000, oldPrice: 2999000, newPrice: 2549000, discountPercent: 15, forecastSales: 30, regularSales: 22 },
      ],
    },
    {
      id: "apr-09", type: "data_review", promoId: "PROMO-2026-002",
      promoName: "Скидки на стиральные машины", promoType: "planned",
      kmId: "km4", kmName: "Нодира Хасанова", kmInitials: "НХ",
      category: "Смартфоны", status: "rejected", rejectedBy: "senior_km",
      submittedAt: "2026-05-28T14:00:00", slaDeadline: "2026-05-30",
      autoForwarded: false, kdOverdue: false,
      comments: [
        { id: "c08", author: "Бахтиёр Юлдашев", authorRole: "Ст. КМ", date: "2026-05-30T16:00:00",
          text: "Скидка 20% не согласована для категории смартфонов в рамках данной акции. Максимально допустимая — 15%. Пересмотрите цены.",
          lineIds: ["l21", "l22"] },
      ],
      lines: [
        { id: "l21", nomenclatureName: "Samsung Galaxy A54 5G", stock: 80, costPrice: 2800000, oldPrice: 3999000, newPrice: 3199000, discountPercent: 20, forecastSales: 60, regularSales: 40 },
        { id: "l22", nomenclatureName: "Xiaomi Redmi Note 13 Pro", stock: 65, costPrice: 2100000, oldPrice: 2999000, newPrice: 2399000, discountPercent: 20, forecastSales: 50, regularSales: 35 },
      ],
    },
    {
      id: "apr-10", type: "data_review", promoId: "PROMO-2026-007",
      promoName: "Микроволновки и мультиварки", promoType: "planned",
      kmId: "km4", kmName: "Нодира Хасанова", kmInitials: "НХ",
      category: "Смартфоны", status: "rejected", rejectedBy: "kd",
      submittedAt: "2026-05-30T11:00:00", slaDeadline: "2026-06-03",
      autoForwarded: false, kdOverdue: false,
      comments: [
        { id: "c09", author: "Севара Ташпулатова", authorRole: "Ст. КМ", date: "2026-06-01T09:00:00", text: "Данные проверены, передаю КД." },
        { id: "c10", author: "Фарход Ибрагимов", authorRole: "КД", date: "2026-06-03T15:00:00",
          text: "Прогноз продаж завышен в 2 раза по сравнению с обычными продажами. Пересмотрите на основе реальных данных.",
          lineIds: ["l23", "l24", "l25"] },
      ],
      lines: [
        { id: "l23", nomenclatureName: "Samsung Galaxy A15 LTE", stock: 120, costPrice: 1200000, oldPrice: 1699000, newPrice: 1349000, discountPercent: 20, forecastSales: 100, regularSales: 55 },
        { id: "l24", nomenclatureName: "Xiaomi Redmi 13C", stock: 90, costPrice: 980000, oldPrice: 1399000, newPrice: 1099000, discountPercent: 21, forecastSales: 80, regularSales: 45 },
        { id: "l25", nomenclatureName: "Realme C55", stock: 70, costPrice: 1400000, oldPrice: 1899000, newPrice: 1499000, discountPercent: 21, forecastSales: 60, regularSales: 35 },
      ],
    },
    {
      id: "apr-11", type: "non_participation", promoId: "PROMO-2026-004",
      promoName: "Ноутбуки к учебному году", promoType: "planned",
      kmId: "km2", kmName: "Дилнавоз Рахимова", kmInitials: "ДР",
      category: "Мелкая бытовая техника", status: "rejected", rejectedBy: "kd",
      submittedAt: "2026-05-26T09:00:00", slaDeadline: "2026-05-30",
      autoForwarded: false, kdOverdue: false,
      npReason: "Категория МБТ не актуальна для акции ноутбуков.",
      comments: [
        { id: "c11", author: "Севара Ташпулатова", authorRole: "Ст. КМ", date: "2026-05-28T10:00:00", text: "Согласен, передаю КД." },
        { id: "c12", author: "Фарход Ибрагимов", authorRole: "КД", date: "2026-05-30T10:00:00", text: "Необходимы данные по МБТ для этой акции. Отклонено — предоставьте номенклатуру." },
      ],
      lines: [],
    },
    {
      id: "apr-12", type: "non_participation", promoId: "PROMO-2026-009",
      promoName: "Осенний фестиваль электроники", promoType: "planned",
      kmId: "km1", kmName: "Алишер Каримов", kmInitials: "АК",
      category: "Холодильники", status: "kd_direct_np", kdDirectSet: true,
      submittedAt: "2026-06-01T15:00:00", slaDeadline: "2026-06-03",
      autoForwarded: false, kdOverdue: false,
      npReason: "Категория холодильников не релевантна для фестиваля электроники.",
      comments: [
        { id: "c13", author: "Фарход Ибрагимов", authorRole: "КД", date: "2026-06-01T15:00:00", text: "Устанавливаю «Не участвует» — категория не релевантна." },
      ],
      lines: [],
    },
  ];
}

// ════════════════════════════════════════════════════════════
// SMALL UI COMPONENTS
// ════════════════════════════════════════════════════════════

function ApprovalStatusBadge({ item }: { item: ApprovalItem }) {
  let cfg = APPROVAL_STATUS_CONFIG[item.status];
  let label = cfg.ru;
  if (item.status === "rejected" && item.rejectedBy === "senior_km") label = "Отклонено ст. КМ";
  if (item.status === "rejected" && item.rejectedBy === "kd") label = "Отклонено КД";
  if (item.status === "pending_kd" && item.autoForwarded) {
    label = "Авто-передано КД";
    cfg = { ...cfg, bg: "#E0E7FF", text: "#4338CA", border: "#C7D2FE" };
  }
  const en = item.status === "rejected"
    ? `Rejected by ${item.rejectedBy === "senior_km" ? "Senior CM" : "Com. Dir."}`
    : item.autoForwarded ? "Auto-forwarded to CD" : APPROVAL_STATUS_CONFIG[item.status].en;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="whitespace-nowrap text-xs font-medium px-2 py-0.5"
          style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}
        >
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top"><p>{en}</p></TooltipContent>
    </Tooltip>
  );
}

function ItemTypeBadge({ type }: { type: ApprovalItemType }) {
  const cfg = ITEM_TYPE_CONFIG[type];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="text-xs font-medium px-1.5 py-0"
          style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border, fontSize: 11 }}
        >
          {cfg.ru}
        </Badge>
      </TooltipTrigger>
      <TooltipContent><p>{cfg.en}</p></TooltipContent>
    </Tooltip>
  );
}

function AutoForwardedTag() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="text-xs font-medium px-1.5 py-0"
          style={{ backgroundColor: "#E0E7FF", color: "#4338CA", borderColor: "#C7D2FE", fontSize: 11 }}
        >
          <Forward className="h-3 w-3 mr-0.5 inline" />
          авто-передано
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>Авто-передано по истечении срока</p>
        <p style={{ color: "#9CA3AF", fontSize: 12 }}>Auto-forwarded after deadline</p>
      </TooltipContent>
    </Tooltip>
  );
}

function KdOverdueNote({ days, date }: { days: number; date?: string }) {
  return (
    <div className="flex items-center gap-1 flex-wrap" style={{ color: "#DC2626", fontSize: 12 }}>
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span style={{ fontWeight: 500 }}>Просрочка КД: {days} раб. {days === 1 ? "день" : "дня"}</span>
      {date && (
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
          ({formatDateTime(date)})
        </span>
      )}
    </div>
  );
}

function SlaTimer({ deadline, isOverdue, overdueDays }: {
  deadline: string; isOverdue: boolean; overdueDays?: number;
}) {
  const deadlineDate = new Date(deadline + "T23:59:59");
  const remaining = getWorkingDaysBetween(REFERENCE_DATE, deadlineDate);

  if (isOverdue || remaining < 0) {
    const days = overdueDays || Math.max(1, Math.abs(remaining));
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <span style={{ color: "#DC2626", fontSize: 13, fontWeight: 500 }}>Просрочка</span>
        <OverdueTag days={days} />
      </div>
    );
  }

  if (remaining === 0) {
    return (
      <span style={{ color: "#DC2626", fontSize: 13, fontWeight: 500 }}>
        <Clock className="h-3.5 w-3.5 inline mr-1" style={{ verticalAlign: "-2px" }} />
        Истекает сегодня
      </span>
    );
  }

  const color = remaining <= 1 ? "#D97706" : "#16A34A";
  return (
    <span className="font-mono" style={{ color, fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: "tabular-nums" }}>
      <Clock className="h-3.5 w-3.5 inline mr-1" style={{ verticalAlign: "-2px", color }} />
      {remaining} раб. {remaining === 1 ? "день" : "дня"}
    </span>
  );
}

function ApprovalChain({ item }: { item: ApprovalItem }) {
  const isAutoFwd = item.autoForwarded;
  const isApproved = item.status === "approved" || item.status === "kd_direct_np";
  const isRejectedBySenior = item.status === "rejected" && item.rejectedBy === "senior_km";
  const isRejectedByKd = item.status === "rejected" && item.rejectedBy === "kd";
  const isPendingSenior = item.status === "pending_senior";
  const isPendingKd = item.status === "pending_kd";

  const step1Done = true;
  const step2State: "done" | "active" | "skipped" | "rejected" | "upcoming" =
    isAutoFwd ? "skipped"
    : isRejectedBySenior ? "rejected"
    : isPendingSenior ? "active"
    : (isPendingKd || isApproved || isRejectedByKd) ? "done"
    : "upcoming";
  const step3State: "done" | "active" | "rejected" | "upcoming" =
    isApproved ? "done"
    : isRejectedByKd ? "rejected"
    : (isPendingKd) ? "active"
    : "upcoming";

  const stepStyle = (state: string) => {
    switch (state) {
      case "done": return { bg: "#DCFCE7", border: "#BBF7D0", text: "#16A34A" };
      case "active": return { bg: "#FEF3C7", border: "#FDE68A", text: "#D97706" };
      case "skipped": return { bg: "#E0E7FF", border: "#C7D2FE", text: "#4338CA" };
      case "rejected": return { bg: "#FEE2E2", border: "#FECACA", text: "#DC2626" };
      default: return { bg: "#F3F4F6", border: "#E5E7EB", text: "#9CA3AF" };
    }
  };

  const StepIcon = ({ state }: { state: string }) => {
    if (state === "done") return <Check className="h-4 w-4" />;
    if (state === "active") return <Clock className="h-4 w-4" />;
    if (state === "skipped") return <Forward className="h-4 w-4" />;
    if (state === "rejected") return <X className="h-4 w-4" />;
    return <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#D1D5DB" }} />;
  };

  const steps = [
    { label: "КМ отправил", en: "KM submitted", state: step1Done ? "done" : "upcoming" },
    { label: isAutoFwd ? "Ст. КМ (пропущен)" : "Ст. КМ", en: isAutoFwd ? "Senior CM (skipped)" : "Senior CM", state: step2State },
    { label: "Ком. директор", en: "Com. Director", state: step3State },
  ];

  if (item.kdDirectSet) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 rounded-lg" style={{ backgroundColor: "#F4F5F7" }}>
        <div className="flex items-center justify-center h-7 w-7 rounded-full" style={{ backgroundColor: "#F3F4F6", border: "1.5px solid #E5E7EB", color: "#6B7280" }}>
          <UserX className="h-4 w-4" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Установлено КД напрямую</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Set directly by Com. Director</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 py-3 flex-wrap">
      {steps.map((s, i) => {
        const st = stepStyle(s.state);
        return (
          <React.Fragment key={i}>
            {i > 0 && <ArrowRight className="h-4 w-4 shrink-0 mx-1" style={{ color: "#D1D5DB" }} />}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md" style={{ backgroundColor: st.bg, border: `1px solid ${st.border}` }}>
                  <div style={{ color: st.text }}><StepIcon state={s.state} /></div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: st.text, whiteSpace: "nowrap" }}>{s.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>{s.en}</p></TooltipContent>
            </Tooltip>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function CommentThread({ comments }: { comments: ReviewComment[] }) {
  if (!comments.length) return (
    <div className="py-4 text-center" style={{ color: "#9CA3AF", fontSize: 13 }}>
      Комментариев нет
    </div>
  );
  return (
    <div className="space-y-2">
      {comments.map((c) => (
        <div key={c.id} className="p-3 rounded-lg" style={{ backgroundColor: "#F4F5F7" }}>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontWeight: 500, fontSize: 13 }}>{c.author}</span>
            <Badge variant="outline" className="text-xs px-1.5 py-0" style={{ fontSize: 11 }}>{c.authorRole}</Badge>
          </div>
          <div className="font-mono" style={{ fontSize: 12, color: "#6B7280", fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: "tabular-nums" }}>
            {formatDateTime(c.date)}
          </div>
          <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{c.text}</div>
          {c.lineIds && c.lineIds.length > 0 && (
            <div className="flex items-center gap-1 mt-2" style={{ fontSize: 12, color: "#6B7280" }}>
              <FileText className="h-3 w-3" />
              <span>Позиции: {c.lineIds.map((_, idx) => `#${idx + 1}`).join(", ")}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function OptionalReasonDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const handleConfirm = () => { onConfirm(reason); setReason(""); onOpenChange(false); };
  const handleClose = (v: boolean) => { if (!v) setReason(""); onOpenChange(v); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Manrope', sans-serif" }}>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Укажите причину (необязательно)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[100px]"
          style={{ fontSize: 14 }}
        />
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleClose(false)}>Отмена</Button>
          <Button variant="default" onClick={handleConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ════════════════════════════════════════════════════════════
// QUEUE TABLE (desktop, md+)
// ════════════════════════════════════════════════════════════

function QueueTable({ items, onSelect, currentRole, onKdSetNp }: {
  items: ApprovalItem[];
  onSelect: (item: ApprovalItem) => void;
  currentRole: string;
  onKdSetNp: (item: ApprovalItem) => void;
}) {
  const isKd = currentRole === "commercial_director";
  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" }}>
      <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
        <thead>
          <tr style={{ backgroundColor: "#F4F5F7" }}>
            <th className="text-left px-3 py-2.5" style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>№ промо</th>
            <th className="text-left px-3 py-2.5" style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>Тип</th>
            <th className="text-left px-3 py-2.5" style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>Название</th>
            <th className="text-left px-3 py-2.5" style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>КМ</th>
            <th className="text-left px-3 py-2.5" style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>Отправлено</th>
            <th className="text-left px-3 py-2.5" style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>SLA</th>
            <th className="text-left px-3 py-2.5" style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>Статус</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="row-hover cursor-pointer"
              style={{ borderTop: "1px solid #E5E7EB", height: 44 }}
              onClick={() => onSelect(item)}
            >
              <td className="px-3 py-2" style={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: "tabular-nums" }}>
                {item.promoId}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <ItemTypeBadge type={item.type} />
                  {item.autoForwarded && <AutoForwardedTag />}
                </div>
              </td>
              <td className="px-3 py-2" style={{ fontSize: 13, maxWidth: 220 }}>
                <div className="truncate">{item.promoName}</div>
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback style={{ fontSize: 10, backgroundColor: "#F4F5F7" }}>{item.kmInitials}</AvatarFallback>
                  </Avatar>
                  <span style={{ fontSize: 13 }}>{item.kmName}</span>
                </div>
              </td>
              <td className="px-3 py-2 font-mono" style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: "tabular-nums", color: "#6B7280" }}>
                {formatDateTime(item.submittedAt)}
              </td>
              <td className="px-3 py-2">
                {(item.status === "pending_senior" || item.status === "pending_kd") && (
                  <SlaTimer deadline={item.slaDeadline} isOverdue={item.kdOverdue} overdueDays={item.kdOverdueDays} />
                )}
              </td>
              <td className="px-3 py-2">
                <ApprovalStatusBadge item={item} />
              </td>
              <td className="px-3 py-1" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreVertical className="h-4 w-4" style={{ color: "#9CA3AF" }} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onSelect(item)}>
                      <FileText className="h-3.5 w-3.5 mr-2" /> Открыть
                    </DropdownMenuItem>
                    {isKd && item.type === "data_review" && (item.status === "pending_kd" || item.status === "pending_senior") && (
                      <DropdownMenuItem onClick={() => onKdSetNp(item)} style={{ color: "#6B7280" }}>
                        <UserX className="h-3.5 w-3.5 mr-2" /> Установить «Не участвует»
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-12" style={{ color: "#9CA3AF" }}>
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
                <div style={{ fontSize: 15, fontWeight: 500, fontFamily: "'Manrope', sans-serif" }}>Нет элементов</div>
                <div style={{ fontSize: 13 }}>No items to display</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// QUEUE CARDS (mobile, < md) — Mode B
// ════════════════════════════════════════════════════════════

function QueueCards({ items, onSelect }: { items: ApprovalItem[]; onSelect: (item: ApprovalItem) => void }) {
  if (!items.length) return (
    <div className="text-center py-12" style={{ color: "#9CA3AF" }}>
      <CheckCircle2 className="h-12 w-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
      <div style={{ fontSize: 15, fontWeight: 500, fontFamily: "'Manrope', sans-serif" }}>Нет элементов</div>
      <div style={{ fontSize: 13 }}>No items to display</div>
    </div>
  );

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Card key={item.id} className="cursor-pointer" onClick={() => onSelect(item)} style={{ borderColor: "#E5E7EB" }}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono" style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: "#6B7280" }}>{item.promoId}</span>
                <ItemTypeBadge type={item.type} />
                {item.autoForwarded && <AutoForwardedTag />}
              </div>
              <ApprovalStatusBadge item={item} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }} className="mb-1 line-clamp-1">{item.promoName}</div>
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback style={{ fontSize: 9, backgroundColor: "#F4F5F7" }}>{item.kmInitials}</AvatarFallback>
              </Avatar>
              <span style={{ fontSize: 13, color: "#6B7280" }}>{item.kmName} · {item.category}</span>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-mono" style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'IBM Plex Mono', monospace" }}>
                {formatDateTime(item.submittedAt)}
              </span>
              {(item.status === "pending_senior" || item.status === "pending_kd") && (
                <SlaTimer deadline={item.slaDeadline} isOverdue={item.kdOverdue} overdueDays={item.kdOverdueDays} />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// REVIEW VIEW — split pane (lg+) or stacked (<lg)
// ════════════════════════════════════════════════════════════

function SubmittedLinesTable({ lines, selectedIds, onToggle, onToggleAll, comments }: {
  lines: SubmittedLine[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  comments: ReviewComment[];
}) {
  const allSelected = lines.length > 0 && lines.every((l) => selectedIds.has(l.id));
  const commentedLineIds = new Set(comments.flatMap((c) => c.lineIds || []));

  return (
    <div className="rounded-lg border overflow-auto" style={{ borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" }}>
      <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 700 }}>
        <thead>
          <tr style={{ backgroundColor: "#F4F5F7" }}>
            <th className="px-2 py-2 w-8">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                className="h-4 w-4 rounded cursor-pointer"
                style={{ accentColor: "#FFDD2D" }}
              />
            </th>
            <th className="text-left px-2 py-2" style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>#</th>
            <th className="text-left px-2 py-2" style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>Номенклатура</th>
            <th className="text-right px-2 py-2" style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>Остаток</th>
            <th className="text-right px-2 py-2" style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>Себест.</th>
            <th className="text-right px-2 py-2" style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>Розн.(ст.)</th>
            <th className="text-right px-2 py-2" style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>Новая цена</th>
            <th className="text-right px-2 py-2" style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>Скидка</th>
            <th className="text-right px-2 py-2" style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>Прогноз</th>
            <th className="text-right px-2 py-2" style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>Обычн.</th>
            <th className="w-6"></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, idx) => {
            const hasComment = commentedLineIds.has(line.id);
            const isSelected = selectedIds.has(line.id);
            return (
              <tr
                key={line.id}
                className="row-hover"
                style={{
                  borderTop: "1px solid #E5E7EB",
                  height: 40,
                  backgroundColor: hasComment ? "#FEF2F2" : isSelected ? "#FFFBEB" : undefined,
                }}
              >
                <td className="px-2 py-1.5 text-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(line.id)}
                    className="h-4 w-4 rounded cursor-pointer"
                    style={{ accentColor: "#FFDD2D" }}
                  />
                </td>
                <td className="px-2 py-1.5 font-mono" style={{ fontSize: 12, color: "#6B7280", fontFamily: "'IBM Plex Mono', monospace" }}>{idx + 1}</td>
                <td className="px-2 py-1.5" style={{ fontSize: 13, maxWidth: 200 }}>
                  <div className="truncate">{line.nomenclatureName}</div>
                </td>
                <td className="px-2 py-1.5 text-right font-mono" style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: "tabular-nums" }}>{line.stock}</td>
                <td className="px-2 py-1.5 text-right"><Money value={line.costPrice} /></td>
                <td className="px-2 py-1.5 text-right"><Money value={line.oldPrice} /></td>
                <td className="px-2 py-1.5 text-right" style={{ fontWeight: 500 }}><Money value={line.newPrice} /></td>
                <td className="px-2 py-1.5 text-right font-mono" style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: "#DC2626" }}>-{line.discountPercent}%</td>
                <td className="px-2 py-1.5 text-right font-mono" style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: "tabular-nums" }}>{line.forecastSales ?? "—"}</td>
                <td className="px-2 py-1.5 text-right font-mono" style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: "tabular-nums", color: "#6B7280" }}>{line.regularSales ?? "—"}</td>
                <td className="px-2 py-1.5">
                  {hasComment && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="h-3.5 w-3.5" style={{ color: "#DC2626" }} />
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        {comments.filter((c) => c.lineIds?.includes(line.id)).map((c) => (
                          <div key={c.id}>
                            <p style={{ fontSize: 12, fontWeight: 500 }}>{c.author} ({c.authorRole}):</p>
                            <p style={{ fontSize: 12 }}>{c.text}</p>
                          </div>
                        ))}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NonParticipationCard({ item }: { item: ApprovalItem }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB", backgroundColor: "#FAFBFC" }}>
      <div className="flex items-center gap-2 mb-3">
        <UserX className="h-5 w-5" style={{ color: "#6B7280" }} />
        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Manrope', sans-serif" }}>Запрос «Не участвует»</span>
        <span style={{ fontSize: 12, color: "#9CA3AF" }}>Non-participation request</span>
      </div>
      <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", marginBottom: 4 }}>Причина КМ / KM reason:</div>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>{item.npReason}</div>
      </div>
      <div className="flex items-center gap-4" style={{ fontSize: 12, color: "#6B7280" }}>
        <div className="flex items-center gap-1">
          <Avatar className="h-5 w-5"><AvatarFallback style={{ fontSize: 9, backgroundColor: "#F4F5F7" }}>{item.kmInitials}</AvatarFallback></Avatar>
          <span>{item.kmName}</span>
        </div>
        <span className="font-mono" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{formatDateTime(item.submittedAt)}</span>
      </div>
    </div>
  );
}

function ReviewView({ item, onBack, onAction, currentRole }: {
  item: ApprovalItem;
  onBack: () => void;
  onAction: (itemId: string, action: string, reason?: string, lineIds?: string[]) => void;
  currentRole: string;
}) {
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [npDialogOpen, setNpDialogOpen] = useState(false);
  const [mobileDataOpen, setMobileDataOpen] = useState(true);

  const isSeniorKm = currentRole === "senior_category_manager";
  const isKd = currentRole === "commercial_director";
  const isAdmin = currentRole === "admin";
  const canAct = (isSeniorKm && item.status === "pending_senior") ||
                 (isKd && item.status === "pending_kd") ||
                 (isAdmin && (item.status === "pending_senior" || item.status === "pending_kd"));

  const toggleLine = useCallback((id: string) => {
    setSelectedLines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAllLines = useCallback(() => {
    setSelectedLines((prev) => {
      if (prev.size === item.lines.length) return new Set();
      return new Set(item.lines.map((l) => l.id));
    });
  }, [item.lines]);

  const handleApprove = () => onAction(item.id, "approve");
  const handleReject = (reason: string) => {
    const lineIds = selectedLines.size > 0 ? Array.from(selectedLines) : undefined;
    onAction(item.id, "reject", reason, lineIds);
    setSelectedLines(new Set());
  };
  const handleKdNp = (reason: string) => onAction(item.id, "kd_direct_np", reason);

  const isCommentRequired = item.type === "data_review";
  const rejectDescription = selectedLines.size > 0
    ? `Комментарий будет привязан к ${selectedLines.size} выбранным позициям. Весь набор данных будет возвращён КМ.`
    : "Общий комментарий ко всему набору данных КМ. Данные будут возвращены на корректировку.";

  const actionsContent = canAct ? (
    <div className="space-y-3">
      <Button
        className="w-full justify-center"
        onClick={handleApprove}
        style={{ backgroundColor: "#FFDD2D", color: "#16181D", fontWeight: 500 }}
      >
        <Check className="h-4 w-4 mr-2" />
        {item.type === "non_participation" ? "Принять «Не участвует»" : "Согласовать всё"}
      </Button>
      <Button
        variant="destructive"
        className="w-full justify-center"
        onClick={() => setRejectDialogOpen(true)}
      >
        <X className="h-4 w-4 mr-2" />
        {selectedLines.size > 0
          ? `Отклонить выбранные (${selectedLines.size})`
          : "Отклонить"}
      </Button>
      {isKd && item.type === "data_review" && (
        <>
          <Separator />
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => setNpDialogOpen(true)}
            style={{ color: "#6B7280" }}
          >
            <UserX className="h-4 w-4 mr-2" />
            Установить «Не участвует»
          </Button>
        </>
      )}
    </div>
  ) : (
    <div className="py-4 text-center rounded-lg" style={{ backgroundColor: "#F4F5F7", color: "#6B7280", fontSize: 13 }}>
      {item.status === "approved" ? (
        <div className="flex flex-col items-center gap-1">
          <CheckCircle2 className="h-6 w-6" style={{ color: "#16A34A" }} />
          <span>Данные утверждены</span>
        </div>
      ) : item.status === "rejected" ? (
        <div className="flex flex-col items-center gap-1">
          <XCircle className="h-6 w-6" style={{ color: "#DC2626" }} />
          <span>Отклонено — возвращено КМ</span>
        </div>
      ) : item.status === "kd_direct_np" ? (
        <div className="flex flex-col items-center gap-1">
          <UserX className="h-6 w-6" style={{ color: "#6B7280" }} />
          <span>«Не участвует» (решение КД)</span>
        </div>
      ) : (
        <span>Нет доступных действий для текущей роли</span>
      )}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4 mr-1" /> Назад
        </Button>
      </div>

      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono" style={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", color: "#6B7280" }}>{item.promoId}</span>
            <ItemTypeBadge type={item.type} />
            <ApprovalStatusBadge item={item} />
            {item.autoForwarded && <AutoForwardedTag />}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Manrope', sans-serif" }}>{item.promoName}</div>
          <div className="flex items-center gap-3 mt-1 flex-wrap" style={{ fontSize: 13, color: "#6B7280" }}>
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5"><AvatarFallback style={{ fontSize: 9, backgroundColor: "#F4F5F7" }}>{item.kmInitials}</AvatarFallback></Avatar>
              <span>{item.kmName}</span>
            </div>
            <span>·</span>
            <span>{item.category}</span>
            <span>·</span>
            <span className="font-mono" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{formatDateTime(item.submittedAt)}</span>
          </div>
        </div>
        {(item.status === "pending_senior" || item.status === "pending_kd") && (
          <div className="shrink-0">
            <SlaTimer deadline={item.slaDeadline} isOverdue={item.kdOverdue} overdueDays={item.kdOverdueDays} />
          </div>
        )}
      </div>

      {item.kdOverdue && item.status === "pending_kd" && (
        <div className="mb-3">
          <KdOverdueNote days={item.kdOverdueDays || 1} />
        </div>
      )}

      <ApprovalChain item={item} />
      <Separator className="my-3" />

      {/* Desktop: side-by-side (lg+) */}
      <div className="hidden lg:flex gap-4">
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Manrope', sans-serif", marginBottom: 8 }}>
            {item.type === "data_review" ? "Отправленные данные" : "Запрос «Не участвует»"}
            {item.type === "data_review" && (
              <span style={{ color: "#9CA3AF", fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
                {item.lines.length} {item.lines.length === 1 ? "позиция" : "позиций"}
              </span>
            )}
          </div>
          {item.type === "data_review" ? (
            <SubmittedLinesTable
              lines={item.lines}
              selectedIds={selectedLines}
              onToggle={toggleLine}
              onToggleAll={toggleAllLines}
              comments={item.comments}
            />
          ) : (
            <NonParticipationCard item={item} />
          )}
        </div>
        <div className="w-80 shrink-0 space-y-4 rounded-lg border p-4" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Manrope', sans-serif" }}>Действия</div>
          {actionsContent}
          <Separator />
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Manrope', sans-serif" }}>
            Комментарии ({item.comments.length})
          </div>
          <CommentThread comments={item.comments} />
        </div>
      </div>

      {/* Mobile/Tablet: stacked (<lg) */}
      <div className="lg:hidden">
        <button
          className="flex items-center gap-2 w-full py-2 text-left"
          onClick={() => setMobileDataOpen(!mobileDataOpen)}
          style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Manrope', sans-serif" }}
        >
          {mobileDataOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {item.type === "data_review" ? `Отправленные данные (${item.lines.length})` : "Запрос «Не участвует»"}
        </button>
        {mobileDataOpen && (
          <div className="mb-4">
            {item.type === "data_review" ? (
              <SubmittedLinesTable
                lines={item.lines}
                selectedIds={selectedLines}
                onToggle={toggleLine}
                onToggleAll={toggleAllLines}
                comments={item.comments}
              />
            ) : (
              <NonParticipationCard item={item} />
            )}
          </div>
        )}

        <div className="mb-4 rounded-lg border p-4" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Manrope', sans-serif", marginBottom: 8 }}>
            Комментарии ({item.comments.length})
          </div>
          <CommentThread comments={item.comments} />
        </div>

        {/* Sticky bottom action bar */}
        {canAct && (
          <div
            className="sticky bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-2 px-4 py-3 rounded-t-lg border-t"
            style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", boxShadow: "0 -2px 8px rgba(0,0,0,0.04)" }}
          >
            <Button
              size="sm"
              onClick={handleApprove}
              style={{ backgroundColor: "#FFDD2D", color: "#16181D", fontWeight: 500 }}
            >
              <Check className="h-4 w-4 mr-1" />
              {item.type === "non_participation" ? "Принять" : "Согласовать"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setRejectDialogOpen(true)}
            >
              <X className="h-4 w-4 mr-1" />
              {selectedLines.size > 0 ? `Отклонить (${selectedLines.size})` : "Отклонить"}
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {isCommentRequired ? (
        <ReasonDialog
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          title="Отклонить данные"
          description={rejectDescription}
          confirmLabel="Отклонить"
          onConfirm={handleReject}
        />
      ) : (
        <OptionalReasonDialog
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          title="Отклонить «Не участвует»"
          description="Комментарий не обязателен. КМ будет обязан предоставить номенклатуру."
          confirmLabel="Отклонить"
          onConfirm={handleReject}
        />
      )}
      <OptionalReasonDialog
        open={npDialogOpen}
        onOpenChange={setNpDialogOpen}
        title="Установить «Не участвует»"
        description={`КМ ${item.kmName} будет освобождён от предоставления данных. Причина рекомендуется, но не обязательна. Старший КМ будет уведомлён.`}
        confirmLabel="Установить"
        onConfirm={handleKdNp}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// KM VIEW — submissions + "Не участвует" action
// ════════════════════════════════════════════════════════════

function KmSubmissionsView({ items, campaigns, managers, onSelectItem, onSetNonParticipation }: {
  items: ApprovalItem[];
  campaigns: PromoCampaign[];
  managers: CategoryManager[];
  onSelectItem: (item: ApprovalItem) => void;
  onSetNonParticipation: (promoId: string, kmId: string, reason: string) => void;
}) {
  const [npDialogOpen, setNpDialogOpen] = useState(false);
  const [npTarget, setNpTarget] = useState<{ promoId: string; promoName: string; kmId: string; kmName: string; category: string } | null>(null);

  const unsubmittedAssignments = useMemo(() => {
    const submittedKeys = new Set(items.map((i) => `${i.promoId}|${i.kmId}`));
    const result: { promoId: string; promoName: string; kmId: string; kmName: string; category: string; deadline: string }[] = [];
    for (const c of campaigns) {
      if (c.status === "cancelled") continue;
      for (const a of c.kmAssignments || []) {
        if (a.status !== "km_not_filled") continue;
        if (submittedKeys.has(`${c.id}|${a.kmId}`)) continue;
        const mgr = managers.find((m) => m.id === a.kmId);
        if (mgr) {
          result.push({
            promoId: c.id, promoName: c.name, kmId: a.kmId,
            kmName: mgr.name, category: a.category, deadline: c.startDate,
          });
        }
      }
    }
    return result;
  }, [items, campaigns, managers]);

  const openNpDialog = (target: typeof npTarget) => {
    setNpTarget(target);
    setNpDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Submissions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Send className="h-4 w-4" style={{ color: "#6B7280" }} />
          <span style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Manrope', sans-serif" }}>Мои отправки</span>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>My submissions</span>
        </div>
        {items.length === 0 ? (
          <div className="text-center py-8 rounded-lg" style={{ backgroundColor: "#F4F5F7", color: "#9CA3AF", fontSize: 13 }}>
            <Send className="h-10 w-10 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
            <div>Нет отправленных данных</div>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item.id} className="cursor-pointer" onClick={() => onSelectItem(item)} style={{ borderColor: item.status === "rejected" ? "#FECACA" : "#E5E7EB", backgroundColor: item.status === "rejected" ? "#FFFBFB" : undefined }}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono" style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: "#6B7280" }}>{item.promoId}</span>
                      <ItemTypeBadge type={item.type} />
                    </div>
                    <ApprovalStatusBadge item={item} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }} className="mb-1">{item.promoName}</div>
                  <div style={{ fontSize: 13, color: "#6B7280" }}>{item.kmName} · {item.category}</div>
                  {item.status === "rejected" && item.comments.length > 0 && (
                    <div className="flex items-start gap-1.5 mt-2 p-2 rounded" style={{ backgroundColor: "#FEF2F2" }}>
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#DC2626" }} />
                      <div style={{ fontSize: 12, color: "#DC2626", lineHeight: 1.4 }}>
                        {item.comments[item.comments.length - 1].text}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* "Не участвует" actions */}
      {unsubmittedAssignments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <UserX className="h-4 w-4" style={{ color: "#6B7280" }} />
            <span style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Manrope', sans-serif" }}>Установить «Не участвует»</span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>Set non-participation</span>
          </div>
          <div className="rounded-lg border p-3 mb-2" style={{ borderColor: "#E5E7EB", backgroundColor: "#F4F5F7" }}>
            <div className="flex items-start gap-2" style={{ fontSize: 12, color: "#6B7280" }}>
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Если вы не планируете предоставлять номенклатуру, укажите причину. Запрос будет направлен на согласование старшему КМ, затем КД.</span>
            </div>
          </div>
          <div className="space-y-2">
            {unsubmittedAssignments.map((a) => (
              <div key={`${a.promoId}-${a.kmId}`} className="flex items-center justify-between gap-3 p-3 rounded-lg border" style={{ borderColor: "#E5E7EB" }}>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono" style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: "#6B7280" }}>{a.promoId}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{a.promoName}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>{a.kmName} · {a.category}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openNpDialog(a)}
                  style={{ color: "#6B7280", fontSize: 12, whiteSpace: "nowrap" }}
                >
                  <UserX className="h-3.5 w-3.5 mr-1" />
                  Не участвую
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {npTarget && (
        <ReasonDialog
          open={npDialogOpen}
          onOpenChange={(v) => { setNpDialogOpen(v); if (!v) setNpTarget(null); }}
          title="Установить «Не участвует»"
          description={`Укажите причину неучастия в акции «${npTarget.promoName}». Это обязательное поле.`}
          confirmLabel="Отправить на согласование"
          onConfirm={(reason) => {
            onSetNonParticipation(npTarget.promoId, npTarget.kmId, reason);
            setNpTarget(null);
          }}
          variant="default"
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ════════════════════════════════════════════════════════════

type QueueTab = "pending" | "processed" | "all";

export default function ApprovalsPage() {
  const { currentRole, campaigns, managers } = useApp();
  const [items, setItems] = useState<ApprovalItem[]>(() => buildMockApprovalItems());
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [activeTab, setActiveTab] = useState<QueueTab>("pending");
  const [kdNpDialogOpen, setKdNpDialogOpen] = useState(false);
  const [kdNpTarget, setKdNpTarget] = useState<ApprovalItem | null>(null);

  const isKm = currentRole === "category_manager";
  const isSeniorKm = currentRole === "senior_category_manager";
  const isKd = currentRole === "commercial_director";

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (isSeniorKm) {
      if (activeTab === "pending") filtered = filtered.filter((i) => i.status === "pending_senior");
      else if (activeTab === "processed") filtered = filtered.filter((i) => i.status !== "pending_senior" && i.status !== "pending_kd");
    } else if (isKd) {
      if (activeTab === "pending") filtered = filtered.filter((i) => i.status === "pending_kd");
      else if (activeTab === "processed") filtered = filtered.filter((i) => i.status !== "pending_kd" && i.status !== "pending_senior");
    }

    return filtered;
  }, [items, activeTab, isSeniorKm, isKd]);

  const pendingCount = useMemo(() => {
    if (isSeniorKm) return items.filter((i) => i.status === "pending_senior").length;
    if (isKd) return items.filter((i) => i.status === "pending_kd").length;
    return 0;
  }, [items, isSeniorKm, isKd]);

  const handleAction = useCallback((itemId: string, action: string, reason?: string, lineIds?: string[]) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      const now = new Date().toISOString();
      const newComment: ReviewComment | null = reason ? {
        id: `c-${Date.now()}`,
        author: "Фарход Ибрагимов",
        authorRole: isSeniorKm ? "Ст. КМ" : "КД",
        date: now,
        text: reason,
        lineIds,
      } : null;
      const comments = newComment ? [...item.comments, newComment] : item.comments;

      if (action === "approve") {
        if (isSeniorKm) {
          const deadline = addWorkingDays(new Date(), 2);
          const dl = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, "0")}-${String(deadline.getDate()).padStart(2, "0")}`;
          return { ...item, status: "pending_kd" as const, slaDeadline: dl, comments };
        }
        return { ...item, status: "approved" as const, comments };
      }
      if (action === "reject") {
        return {
          ...item, status: "rejected" as const,
          rejectedBy: isSeniorKm ? "senior_km" as const : "kd" as const,
          comments,
        };
      }
      if (action === "kd_direct_np") {
        const npComment: ReviewComment = {
          id: `c-${Date.now()}`,
          author: "Фарход Ибрагимов",
          authorRole: "КД",
          date: now,
          text: reason || "Установлено коммерческим директором.",
        };
        return { ...item, status: "kd_direct_np" as const, kdDirectSet: true, comments: [...item.comments, npComment] };
      }
      return item;
    }));
    setSelectedItem(null);
  }, [isSeniorKm]);

  const handleKmSetNonParticipation = useCallback((promoId: string, kmId: string, reason: string) => {
    const campaign = campaigns.find((c) => c.id === promoId);
    const mgr = managers.find((m) => m.id === kmId);
    if (!campaign || !mgr) return;
    const assignment = campaign.kmAssignments?.find((a) => a.kmId === kmId);
    const deadline = addWorkingDays(new Date(), 2);
    const dl = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, "0")}-${String(deadline.getDate()).padStart(2, "0")}`;
    const newItem: ApprovalItem = {
      id: `apr-new-${Date.now()}`,
      type: "non_participation",
      promoId,
      promoName: campaign.name,
      promoType: campaign.type,
      kmId,
      kmName: mgr.name,
      kmInitials: mgr.initials,
      category: assignment?.category || mgr.department,
      status: "pending_senior",
      submittedAt: new Date().toISOString(),
      slaDeadline: dl,
      autoForwarded: false,
      kdOverdue: false,
      npReason: reason,
      comments: [],
      lines: [],
    };
    setItems((prev) => [newItem, ...prev]);
  }, [campaigns, managers]);

  const handleKdSetNpFromQueue = (item: ApprovalItem) => {
    setKdNpTarget(item);
    setKdNpDialogOpen(true);
  };

  const handleKdNpConfirm = (reason: string) => {
    if (kdNpTarget) {
      handleAction(kdNpTarget.id, "kd_direct_np", reason);
      setKdNpTarget(null);
    }
  };

  if (selectedItem) {
    const currentItem = items.find((i) => i.id === selectedItem.id) || selectedItem;
    return (
      <div>
        <BilingualLabel ru="Согласование" en="Approvals" size="page" className="mb-4" />
        <ReviewView
          item={currentItem}
          onBack={() => setSelectedItem(null)}
          onAction={handleAction}
          currentRole={currentRole}
        />
      </div>
    );
  }

  if (isKm) {
    return (
      <div>
        <BilingualLabel ru="Согласование" en="Approvals" size="page" className="mb-4" />
        <KmSubmissionsView
          items={items}
          campaigns={campaigns}
          managers={managers}
          onSelectItem={setSelectedItem}
          onSetNonParticipation={handleKmSetNonParticipation}
        />
      </div>
    );
  }

  const tabs: { id: QueueTab; label: string; count?: number }[] = [
    { id: "pending", label: "Ожидает", count: pendingCount },
    { id: "processed", label: "Обработано" },
    { id: "all", label: "Все" },
  ];

  return (
    <div>
      <BilingualLabel ru="Согласование" en="Approvals" size="page" className="mb-4" />

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeTab === tab.id ? "#16181D" : "#F4F5F7",
              color: activeTab === tab.id ? "#FFFFFF" : "#6B7280",
              fontSize: 13,
            }}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <Badge
                className="ml-1.5 px-1.5 py-0 text-xs"
                style={{
                  backgroundColor: activeTab === tab.id ? "#FFDD2D" : "#E5E7EB",
                  color: "#16181D",
                  fontSize: 11,
                  border: "none",
                }}
              >
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Desktop Table (md+) */}
      <div className="hidden md:block">
        <QueueTable
          items={filteredItems}
          onSelect={setSelectedItem}
          currentRole={currentRole}
          onKdSetNp={handleKdSetNpFromQueue}
        />
      </div>

      {/* Mobile Cards (<md) */}
      <div className="md:hidden">
        <QueueCards items={filteredItems} onSelect={setSelectedItem} />
      </div>

      {/* KD direct non-participation dialog from queue */}
      {kdNpTarget && (
        <OptionalReasonDialog
          open={kdNpDialogOpen}
          onOpenChange={(v) => { setKdNpDialogOpen(v); if (!v) setKdNpTarget(null); }}
          title="Установить «Не участвует»"
          description={`КМ ${kdNpTarget.kmName} будет освобождён от предоставления данных по ${kdNpTarget.promoName}. Причина рекомендуется.`}
          confirmLabel="Установить"
          onConfirm={handleKdNpConfirm}
        />
      )}
    </div>
  );
}
