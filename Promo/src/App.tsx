import React, { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { cn } from "@texnomart/ui/utils";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@texnomart/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@texnomart/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@texnomart/ui/tooltip";
import { ScrollArea } from "@texnomart/ui/scroll-area";
import { Avatar, AvatarFallback } from "@texnomart/ui/avatar";
import { Separator } from "@texnomart/ui/separator";
import { Switch } from "@texnomart/ui/switch";
import { Label } from "@texnomart/ui/label";
import {
  CommandDialog, CommandInput, CommandList,
  CommandEmpty, CommandGroup, CommandItem,
} from "@texnomart/ui/command";
import {
  CalendarDays, Table2, CheckCircle2, BarChart3,
  Bell, ScrollText, Settings, Search, Menu, X,
  ChevronDown, User, LogOut, ChevronsLeft, ChevronsRight,
  History, Filter, EyeOff, Plus, Clock, CalendarRange,
  Package, Home, GitCompareArrows, Send, Ban,
  Pencil, CalendarClock, ArrowRight,
} from "lucide-react";
import ShortCalendarPage from "@/pages/ShortCalendar";
import FullCalendarPage from "@/pages/FullCalendar";
import ApprovalsPage from "@/pages/Approvals";
import ChangeManagementPage from "@/pages/ChangeManagement";
import ReportsPage from "@/pages/Reports";
import NotificationCenter from "@/pages/Notifications";
import PromoSettingsPage from "@/pages/PromoSettings";
import AuditLogPage from "@/pages/AuditLog";

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

export type PromoStatus =
  | "not_filled"
  | "awaiting_correction"
  | "pending_senior_km"
  | "approved_senior_km"
  | "pending_commercial_director"
  | "approved_commercial_director"
  | "sent_to_departments"
  | "not_participating"
  | "pending_marketing_reapproval"
  | "cancelled";

export type PromoType = "planned" | "unplanned";

export type KmPromoStatus =
  | "km_not_filled"
  | "km_pending_senior"
  | "km_approved_senior"
  | "km_pending_kd"
  | "km_approved_kd"
  | "km_not_participating";

export type CampaignStatus =
  | "campaign_pending_senior"
  | "campaign_pending_kd"
  | "campaign_correction"
  | "campaign_approved_sent"
  | "campaign_cancelled";

export type PlanStatus =
  | "plan_review"
  | "plan_discussion"
  | "plan_pending_kd"
  | "plan_pending_od"
  | "plan_approved"
  | "plan_rejected";

export interface CampaignKmAssignment {
  kmId: string;
  category: string;
  status: KmPromoStatus;
  days: number[];
}

export interface PromoCampaign {
  id: string;
  name: string;
  category: string;
  type: PromoType;
  status: PromoStatus;
  startDate: string;
  endDate: string;
  managerId: string;
  budget: number;
  discount: number;
  version: number;
  itemCount: number;
  sentDate?: string;
  overdueDays?: number;
  kmAssignments?: CampaignKmAssignment[];
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  originalStartDate?: string;
  originalEndDate?: string;
}

// ════════════════════════════════════════════════════════════
// NOTIFICATION TYPES
// ════════════════════════════════════════════════════════════

export type NotificationType =
  | "data_change"
  | "campaign_cancelled"
  | "line_removed"
  | "marketing_reapproval"
  | "km_assignment"
  | "adv_approval";

export interface AppNotification {
  id: string;
  type: NotificationType;
  campaignId: string;
  campaignName: string;
  version: number;
  sentAt: string;
  responsible: string;
  description: string;
  read: boolean;
  targetRoles: string[];
}

// ════════════════════════════════════════════════════════════
// CHANGE MANAGEMENT TYPES
// ════════════════════════════════════════════════════════════

export type ChangeType =
  | "initial_submission"
  | "correction"
  | "addition"
  | "cancellation"
  | "report_sent";

export interface FieldChange {
  rowId: string;
  nomenclature: string;
  field: string;
  oldValue: string;
  newValue: string;
  changeKind: "added" | "modified" | "removed";
}

export interface VersionEntry {
  version: number;
  date: string;
  author: string;
  role: string;
  changeType: ChangeType;
  summary: string;
  fieldChanges: FieldChange[];
  sentToDepartments?: boolean;
  departmentsSentDate?: string;
}

export interface DeadlineChangeRequest {
  id: string;
  campaignId: string;
  initiator: string;
  initiatorRole: string;
  reason: string;
  oldDeadline: string;
  newDeadline: string;
  requestDate: string;
  approvalStatus: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedDate?: string;
}

export interface CancellationRecord {
  id: string;
  target: "campaign" | "line";
  targetId: string;
  targetName: string;
  reason: string;
  cancelledBy: string;
  cancelledByRole: string;
  date: string;
  notifiedDepartments: boolean;
}

export type LineChangeStatus = "active" | "excluded" | "cancelled_line";

// ════════════════════════════════════════════════════════════
// PROMO RULE TYPES (Promo-type settings)
// ════════════════════════════════════════════════════════════

export type PromoRuleStatus = "draft" | "confirmed" | "archived";

export interface FullCalendarFieldDef {
  key: string;
  ru: string;
  en: string;
  group: "ident" | "product" | "sales" | "installment" | "marketing";
}

export interface PromoRuleHistoryEntry {
  version: number;
  date: string;
  author: string;
  role: string;
  summary: string;
}

export interface PromoRule {
  id: string;
  name: string;
  promoTypes: string[];
  requiredFields: string[];
  status: PromoRuleStatus;
  createdBy: string;
  createdAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
  version: number;
  history: PromoRuleHistoryEntry[];
}

export const PROMO_RULE_STATUS_CONFIG: Record<PromoRuleStatus, { ru: string; en: string; bg: string; text: string; border: string }> = {
  draft: { ru: "Черновик", en: "Draft", bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" },
  confirmed: { ru: "Утверждено", en: "Confirmed", bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0" },
  archived: { ru: "Архив", en: "Archived", bg: "#F3F4F6", text: "#9CA3AF", border: "#E5E7EB" },
};

export const PROMO_TYPE_REFERENCE = [
  "Скидка", "1+1", "Рассрочка 0-0-6", "Рассрочка 0-0-12", "Рассрочка 0-0-24",
  "Рассрочка 50-0-2", "Товар в подарок", "Кэшбэк", "Комплект",
];

export const FULL_CALENDAR_FIELDS: FullCalendarFieldDef[] = [
  { key: "promoSign", ru: "Признак", en: "Sign", group: "ident" },
  { key: "promoType", ru: "Тип промо", en: "Promo type", group: "ident" },
  { key: "startDate", ru: "Дата начала", en: "Start date", group: "ident" },
  { key: "endDate", ru: "Дата окончания", en: "End date", group: "ident" },
  { key: "nomenclatureName", ru: "Номенклатура", en: "Nomenclature", group: "product" },
  { key: "stock", ru: "Остаток", en: "Stock", group: "product" },
  { key: "costPrice", ru: "Себестоимость", en: "Cost price", group: "product" },
  { key: "retailPriceOld", ru: "Розничная цена (старая)", en: "Retail price (old)", group: "product" },
  { key: "newPrice", ru: "Новая цена", en: "New price", group: "sales" },
  { key: "discountPercent", ru: "Скидка %", en: "Discount %", group: "sales" },
  { key: "regularSales", ru: "Регулярные продажи", en: "Regular sales", group: "sales" },
  { key: "forecastSales", ru: "Прогноз продаж", en: "Forecast sales", group: "sales" },
  { key: "inst006", ru: "Рассрочка 0-0-6", en: "Installment 0-0-6", group: "installment" },
  { key: "inst0012", ru: "Рассрочка 0-0-12", en: "Installment 0-0-12", group: "installment" },
  { key: "inst502", ru: "Рассрочка 50-0-2", en: "Installment 50-0-2", group: "installment" },
  { key: "monthlyOld12", ru: "Старый платёж 12м", en: "Old payment 12m", group: "installment" },
  { key: "monthlyNew12", ru: "Новый платёж 12м", en: "New payment 12m", group: "installment" },
  { key: "discount12", ru: "Скидка 12м", en: "Discount 12m", group: "installment" },
  { key: "fullPriceNew12", ru: "Полная цена 12м", en: "Full price 12m", group: "installment" },
  { key: "monthlyOld24", ru: "Старый платёж 24м", en: "Old payment 24m", group: "installment" },
  { key: "monthlyNew24", ru: "Новый платёж 24м", en: "New payment 24m", group: "installment" },
  { key: "discount24", ru: "Скидка 24м", en: "Discount 24m", group: "installment" },
  { key: "fullPriceNew24", ru: "Полная цена 24м", en: "Full price 24m", group: "installment" },
  { key: "monthlyOld36", ru: "Старый платёж 36м", en: "Old payment 36m", group: "installment" },
  { key: "monthlyNew36", ru: "Новый платёж 36м", en: "New payment 36m", group: "installment" },
  { key: "discount36", ru: "Скидка 36м", en: "Discount 36m", group: "installment" },
  { key: "fullPriceNew36", ru: "Полная цена 36м", en: "Full price 36m", group: "installment" },
  { key: "discountCash", ru: "Cash %", en: "Cash %", group: "marketing" },
  { key: "giftNomenclature", ru: "Подарок (номенклатура)", en: "Gift nomenclature", group: "marketing" },
  { key: "giftStock", ru: "Остаток подарка", en: "Gift stock", group: "marketing" },
  { key: "compensationSum", ru: "Компенсация поставщика", en: "Supplier compensation", group: "marketing" },
  { key: "compensationLimit", ru: "Лимит компенсации", en: "Compensation limit", group: "marketing" },
  { key: "utp", ru: "УТП", en: "USP", group: "marketing" },
  { key: "inAdKm", ru: "В рекламу (КМ)", en: "In ad (CM)", group: "marketing" },
  { key: "inAdMarketing", ru: "В рекламу (маркетинг)", en: "In ad (marketing)", group: "marketing" },
];

export const FIELD_GROUP_CONFIG: Record<string, { ru: string; en: string }> = {
  ident: { ru: "Идентификация", en: "Identity" },
  product: { ru: "Товар", en: "Product" },
  sales: { ru: "Продажи / Цены", en: "Sales / Prices" },
  installment: { ru: "Рассрочка", en: "Installment" },
  marketing: { ru: "Маркетинг", en: "Marketing" },
};

// ════════════════════════════════════════════════════════════
// DEPARTMENT REPORT TYPES
// ════════════════════════════════════════════════════════════

export type DepartmentType = "marketing" | "purchasing" | "analytics";

export interface ReportLine {
  id: string;
  kmName: string;
  promoNumber: string;
  promoType: string;
  promoName: string;
  startDate: string;
  endDate: string;
  nomenclature: string;
  stock: number;
  oldPrice: number;
  newPrice: number;
  discountPercent: number;
  inst006: number;
  inst0012: number;
  inst5002: number;
  oldPayment12: number;
  newPayment12: number;
  discount12: number;
  fullPrice12: number;
  oldPayment24: number;
  newPayment24: number;
  discount24: number;
  fullPrice24: number;
  oldPayment36: number;
  newPayment36: number;
  discount36: number;
  fullPrice36: number;
  cashDiscount: number;
  giftNomenclature: string;
  giftStock: number;
  utp: string;
  inAdvKm: boolean;
  inAdvMarketing: boolean;
  supplierCompensation: number;
  compensationLimit: number;
  changeKind?: "added" | "modified";
  changedFields?: string[];
  acknowledged?: boolean;
}

export interface DepartmentReport {
  campaignId: string;
  campaignName: string;
  version: number;
  sentDate: string;
  receivedDate: string;
  lines: ReportLine[];
}

export interface CategoryManager {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: string;
}

interface RoleConfig {
  id: string;
  ru: string;
  en: string;
  abbr: string;
}

interface NavItem {
  id: string;
  ru: string;
  en: string;
  icon: React.ElementType;
}

// ════════════════════════════════════════════════════════════
// LABELS — single source of truth for bilingual text
// ════════════════════════════════════════════════════════════

export const labels = {
  app: { ru: "Dashboard", en: "Dashboard" },
  brand: "texnomart",
  search: { ru: "Поиск...", en: "Search..." },
  filters: { ru: "Фильтры", en: "Filters" },
  hideCancelled: { ru: "Скрыть отменённое", en: "Hide cancelled" },
  period: { ru: "Период", en: "Period" },
  category: { ru: "Категория", en: "Category" },
  status: { ru: "Статус", en: "Status" },
  manager: { ru: "Менеджер", en: "Manager" },
  all: { ru: "Все", en: "All" },
  collapse: { ru: "Свернуть", en: "Collapse" },
  expand: { ru: "Развернуть", en: "Expand" },
  calendarMode: {
    month: { ru: "Месяц", en: "Month" },
    quarter: { ru: "Квартал", en: "Quarter" },
  },
  versionHistory: { ru: "История версий", en: "Version history" },
  onlyChanges: { ru: "Только изменения", en: "Only changes" },
  confirm: { ru: "Подтвердить", en: "Confirm" },
  cancel: { ru: "Отмена", en: "Cancel" },
  reasonPlaceholder: { ru: "Укажите причину...", en: "Enter reason..." },
  changeHistory: { ru: "История и изменения", en: "History & changes" },
  createCorrection: { ru: "Создать корректировку", en: "Create correction" },
  noRollback: { ru: "Откат не поддерживается — изменения создаются как новая корректировка", en: "Rollback not supported — changes are submitted as a new correction" },
  cancelCampaign: { ru: "Отменить акцию", en: "Cancel campaign" },
  cancelLine: { ru: "Исключить из акции", en: "Exclude from campaign" },
  changeDeadline: { ru: "Изменить дедлайн", en: "Change deadline" },
  pendingMarketingReapproval: { ru: "Ожидает повторного согласования маркетинга", en: "Pending marketing re-approval" },
  sentToDepartments: { ru: "Отправлено в отделы", en: "Sent to departments" },
  fullReport: { ru: "Полный актуальный отчёт", en: "Full current report" },
  viewModes: { ru: "Режим просмотра", en: "View mode" },
  emptyModule: { ru: "Модуль будет реализован в следующем этапе", en: "Module coming in next phase" },
  startWork: { ru: "Начать работу", en: "Start working" },
  switchRole: { ru: "Сменить роль", en: "Switch role" },
  actingAs: { ru: "Действует как", en: "Acting as" },
  signOut: { ru: "Выйти", en: "Sign out" },
  notifications: { ru: "Уведомления", en: "Notifications" },
} as const;

// ════════════════════════════════════════════════════════════
// STATUS CONFIG — color mapping for all statuses
// ════════════════════════════════════════════════════════════

export const STATUS_CONFIG: Record<PromoStatus, {
  ru: string;
  en: string;
  bg: string;
  text: string;
  border: string;
}> = {
  not_filled: {
    ru: "Не заполнено", en: "Not filled",
    bg: "#FEE2E2", text: "#DC2626", border: "#FECACA",
  },
  awaiting_correction: {
    ru: "Ожидание корректировки", en: "Awaiting correction",
    bg: "#FEE2E2", text: "#DC2626", border: "#FECACA",
  },
  pending_senior_km: {
    ru: "На согласовании у ст. КМ", en: "Pending senior CM",
    bg: "#FEF3C7", text: "#D97706", border: "#FDE68A",
  },
  approved_senior_km: {
    ru: "Согласовано ст. КМ", en: "Approved by senior CM",
    bg: "#DBEAFE", text: "#2563EB", border: "#BFDBFE",
  },
  pending_commercial_director: {
    ru: "На согласовании у КД", en: "Pending commercial dir.",
    bg: "#FEF3C7", text: "#D97706", border: "#FDE68A",
  },
  approved_commercial_director: {
    ru: "Принято КД", en: "Approved by com. dir.",
    bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0",
  },
  sent_to_departments: {
    ru: "Отправлено смежным отделам", en: "Sent to departments",
    bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0",
  },
  not_participating: {
    ru: "Не участвует", en: "Not participating",
    bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB",
  },
  pending_marketing_reapproval: {
    ru: "Ожидает повт. согл. маркетинга", en: "Pending marketing re-approval",
    bg: "#FEF3C7", text: "#D97706", border: "#FDE68A",
  },
  cancelled: {
    ru: "Отменена", en: "Cancelled",
    bg: "#FEE2E2", text: "#DC2626", border: "#FECACA",
  },
};

export const KM_STATUS_CONFIG: Record<KmPromoStatus, {
  ru: string; en: string; bg: string; text: string; border: string;
}> = {
  km_not_filled: { ru: "Не заполнено", en: "Not filled", bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" },
  km_pending_senior: { ru: "На согл. у ст. КМ", en: "Pending senior CM", bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
  km_approved_senior: { ru: "Согласовано ст. КМ", en: "Approved by senior CM", bg: "#DBEAFE", text: "#2563EB", border: "#BFDBFE" },
  km_pending_kd: { ru: "На согл. у КД", en: "Pending com. dir.", bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
  km_approved_kd: { ru: "Принято КД", en: "Approved by com. dir.", bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0" },
  km_not_participating: { ru: "Не участвует", en: "Not participating", bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" },
};

export const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, {
  ru: string; en: string; bg: string; text: string; border: string;
}> = {
  campaign_pending_senior: { ru: "На согл. у ст. КМ", en: "Pending senior CM", bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
  campaign_pending_kd: { ru: "На согл. у КД", en: "Pending com. dir.", bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
  campaign_correction: { ru: "На корректировке КМ", en: "KM correction", bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" },
  campaign_approved_sent: { ru: "Согласовано и отправлено", en: "Approved & sent", bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0" },
  campaign_cancelled: { ru: "Отменена", en: "Cancelled", bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" },
};

export const PLAN_STATUS_CONFIG: Record<PlanStatus, {
  ru: string; en: string; bg: string; text: string; border: string;
}> = {
  plan_review: { ru: "На ознакомлении", en: "Under review", bg: "#DBEAFE", text: "#2563EB", border: "#BFDBFE" },
  plan_discussion: { ru: "На обсуждении", en: "Under discussion", bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
  plan_pending_kd: { ru: "На согл. у КД", en: "Pending com. dir.", bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
  plan_pending_od: { ru: "На согл. у ОД", en: "Pending ops. dir.", bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
  plan_approved: { ru: "Утверждён", en: "Approved", bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0" },
  plan_rejected: { ru: "Отклонён", en: "Rejected", bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" },
};

export const CHANGE_TYPE_CONFIG: Record<ChangeType, {
  ru: string; en: string; bg: string; text: string; border: string; icon: string;
}> = {
  initial_submission: { ru: "Первичная отправка", en: "Initial submission", bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0", icon: "send" },
  correction: { ru: "Корректировка", en: "Correction", bg: "#FEF3C7", text: "#D97706", border: "#FDE68A", icon: "pencil" },
  addition: { ru: "Добавление", en: "Addition", bg: "#DBEAFE", text: "#2563EB", border: "#BFDBFE", icon: "plus" },
  cancellation: { ru: "Отмена", en: "Cancellation", bg: "#FEE2E2", text: "#DC2626", border: "#FECACA", icon: "ban" },
  report_sent: { ru: "Отправка отчёта", en: "Report sent", bg: "#E0E7FF", text: "#4338CA", border: "#C7D2FE", icon: "arrow-right" },
};

export const LINE_CHANGE_STATUS_CONFIG: Record<LineChangeStatus, {
  ru: string; en: string; bg: string; text: string; border: string;
}> = {
  active: { ru: "Активна", en: "Active", bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0" },
  excluded: { ru: "Исключена из акции", en: "Excluded from campaign", bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" },
  cancelled_line: { ru: "Отменена", en: "Cancelled", bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" },
};

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, {
  ru: string; en: string; bg: string; text: string; border: string; icon: string;
}> = {
  data_change: { ru: "Изменение данных", en: "Data change", bg: "#DBEAFE", text: "#2563EB", border: "#BFDBFE", icon: "file-edit" },
  campaign_cancelled: { ru: "Акция отменена", en: "Campaign cancelled", bg: "#FEE2E2", text: "#DC2626", border: "#FECACA", icon: "ban" },
  line_removed: { ru: "Удалена позиция", en: "Line removed", bg: "#FEE2E2", text: "#DC2626", border: "#FECACA", icon: "trash-2" },
  marketing_reapproval: { ru: "Повторное согласование", en: "Marketing re-approval", bg: "#FEF3C7", text: "#D97706", border: "#FDE68A", icon: "alert-triangle" },
  km_assignment: { ru: "Назначение КМ", en: "KM assignment", bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0", icon: "user-plus" },
  adv_approval: { ru: "Утверждено «В рекламу»", en: "Ad approval", bg: "#E0E7FF", text: "#4338CA", border: "#C7D2FE", icon: "megaphone" },
};

// ════════════════════════════════════════════════════════════
// ROLES
// ════════════════════════════════════════════════════════════

export const ROLES: RoleConfig[] = [
  { id: "commercial_director", ru: "Коммерческий директор", en: "Commercial Director", abbr: "КД" },
  { id: "operational_director", ru: "Операционный директор", en: "Operational Director", abbr: "ОД" },
  { id: "marketing_director", ru: "Директор маркетинга", en: "Marketing Director", abbr: "ДМ" },
  { id: "category_manager", ru: "Категорийный менеджер", en: "Category Manager", abbr: "КМ" },
  { id: "senior_category_manager", ru: "Старший КМ", en: "Senior Category Manager", abbr: "Ст.КМ" },
  { id: "marketing_staff", ru: "Сотрудник маркетинга", en: "Marketing Staff", abbr: "Марк" },
  { id: "purchasing_staff", ru: "Сотрудник закупа", en: "Purchasing Staff", abbr: "Закуп" },
  { id: "analytics_staff", ru: "Сотрудник аналитики", en: "Analytics Staff", abbr: "Анал" },
  { id: "admin", ru: "Администратор", en: "Admin", abbr: "Админ" },
];

// ════════════════════════════════════════════════════════════
// NAVIGATION ITEMS
// ════════════════════════════════════════════════════════════

const NAV_ITEMS: NavItem[] = [
  { id: "short-calendar", ru: "Краткий промо-календарь", en: "Short calendar", icon: CalendarDays },
  { id: "full-calendar", ru: "Полный промо-календарь", en: "Full calendar", icon: Table2 },
  { id: "approvals", ru: "Согласование", en: "Approvals", icon: CheckCircle2 },
  { id: "change-history", ru: "История и изменения", en: "History & changes", icon: GitCompareArrows },
  { id: "reports", ru: "Отчёты смежным отделам", en: "Department reports", icon: BarChart3 },
  { id: "notifications", ru: "Уведомления", en: "Notifications", icon: Bell },
  { id: "audit-log", ru: "Аудит-лог", en: "Audit log", icon: ScrollText },
  { id: "promo-settings", ru: "Настройки типов промо", en: "Promo-type settings", icon: Settings },
];

const NAV_ACCESS: Record<string, string[]> = {
  "short-calendar": ["all"],
  "full-calendar": ["admin", "commercial_director", "senior_category_manager", "category_manager"],
  "approvals": ["admin", "commercial_director", "senior_category_manager", "category_manager"],
  "change-history": ["admin", "commercial_director", "senior_category_manager", "category_manager"],
  "reports": ["admin", "commercial_director", "operational_director", "marketing_director", "marketing_staff", "purchasing_staff", "analytics_staff"],
  "notifications": ["all"],
  "audit-log": ["admin", "commercial_director", "operational_director", "analytics_staff"],
  "promo-settings": ["admin", "commercial_director"],
};

function hasNavAccess(navId: string, roleId: string): boolean {
  const access = NAV_ACCESS[navId];
  if (!access) return false;
  return access.includes("all") || access.includes(roleId);
}

// ════════════════════════════════════════════════════════════
// PERIODS
// ════════════════════════════════════════════════════════════

export const PERIODS = [
  { value: "2026-05", label: "Май 2026" },
  { value: "2026-06", label: "Июнь 2026" },
  { value: "2026-07", label: "Июль 2026" },
  { value: "2026-08", label: "Август 2026" },
  { value: "2026-09", label: "Сентябрь 2026" },
];

export const CATEGORIES = [
  "Холодильники", "Стиральные машины", "Смартфоны", "Ноутбуки",
  "Телевизоры", "Кондиционеры", "Мелкая бытовая техника", "Компьютеры",
];

// ════════════════════════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════════════════════════

export const MOCK_MANAGERS: CategoryManager[] = [
  { id: "km1", name: "Алишер Каримов", initials: "АК", role: "category_manager", department: "Крупная бытовая техника" },
  { id: "km2", name: "Дилнавоз Рахимова", initials: "ДР", role: "category_manager", department: "Мелкая бытовая техника" },
  { id: "km3", name: "Бахтиёр Юлдашев", initials: "БЮ", role: "senior_category_manager", department: "Электроника" },
  { id: "km4", name: "Нодира Хасанова", initials: "НХ", role: "category_manager", department: "Смартфоны и планшеты" },
  { id: "km5", name: "Рустам Мирзаев", initials: "РМ", role: "category_manager", department: "Телевизоры" },
  { id: "km6", name: "Севара Ташпулатова", initials: "СТ", role: "senior_category_manager", department: "Компьютеры и ноутбуки" },
];

export const MOCK_CAMPAIGNS: PromoCampaign[] = [
  {
    id: "PROMO-2026-001", name: "Летняя распродажа холодильников",
    category: "Холодильники", type: "planned", status: "approved_commercial_director",
    startDate: "2026-06-15", endDate: "2026-07-15", managerId: "km1",
    budget: 45000000, discount: 15, version: 3, itemCount: 24,
    kmAssignments: [
      { kmId: "km1", category: "Холодильники", status: "km_approved_kd", days: [0,1,2,3,4,5,6] },
      { kmId: "km2", category: "Мелкая бытовая техника", status: "km_approved_kd", days: [0,2,4] },
      { kmId: "km5", category: "Телевизоры", status: "km_not_participating", days: [] },
    ],
  },
  {
    id: "PROMO-2026-002", name: "Скидки на стиральные машины",
    category: "Стиральные машины", type: "planned", status: "pending_senior_km",
    startDate: "2026-06-20", endDate: "2026-07-20", managerId: "km2",
    budget: 32000000, discount: 10, version: 1, itemCount: 18,
    kmAssignments: [
      { kmId: "km1", category: "Стиральные машины", status: "km_pending_senior", days: [0,1,2,3,4,5,6] },
      { kmId: "km2", category: "Мелкая бытовая техника", status: "km_not_filled", days: [1,3] },
      { kmId: "km4", category: "Смартфоны", status: "km_approved_senior", days: [0,2,4] },
    ],
  },
  {
    id: "PROMO-2026-003", name: "Флэш-распродажа смартфонов",
    category: "Смартфоны", type: "unplanned", status: "sent_to_departments",
    startDate: "2026-06-01", endDate: "2026-06-07", managerId: "km4",
    budget: 120000000, discount: 20, version: 5, itemCount: 42, sentDate: "2026-05-28",
    kmAssignments: [],
  },
  {
    id: "PROMO-2026-004", name: "Ноутбуки к учебному году",
    category: "Ноутбуки", type: "planned", status: "not_filled",
    startDate: "2026-08-15", endDate: "2026-09-15", managerId: "km6",
    budget: 0, discount: 0, version: 1, itemCount: 0,
    kmAssignments: [
      { kmId: "km6", category: "Ноутбуки", status: "km_not_filled", days: [0,1,2,3,4,5,6] },
      { kmId: "km4", category: "Смартфоны", status: "km_not_filled", days: [0,2] },
      { kmId: "km5", category: "Телевизоры", status: "km_not_filled", days: [1,3] },
      { kmId: "km2", category: "Мелкая бытовая техника", status: "km_not_filled", days: [4,5] },
    ],
  },
  {
    id: "PROMO-2026-005", name: "Акция на телевизоры Samsung",
    category: "Телевизоры", type: "planned", status: "approved_senior_km",
    startDate: "2026-06-25", endDate: "2026-07-25", managerId: "km5",
    budget: 85000000, discount: 12, version: 2, itemCount: 16,
    kmAssignments: [
      { kmId: "km5", category: "Телевизоры", status: "km_pending_kd", days: [0,1,2,3,4,5,6] },
      { kmId: "km1", category: "Холодильники", status: "km_approved_kd", days: [0,1,2] },
      { kmId: "km6", category: "Ноутбуки", status: "km_pending_senior", days: [3,4,5] },
    ],
  },
  {
    id: "PROMO-2026-006", name: "Кондиционеры — летний бонус",
    category: "Кондиционеры", type: "unplanned", status: "cancelled",
    startDate: "2026-06-01", endDate: "2026-06-30", managerId: "km1",
    budget: 28000000, discount: 8, version: 2, itemCount: 12,
    kmAssignments: [],
  },
  {
    id: "PROMO-2026-007", name: "Микроволновки и мультиварки",
    category: "Мелкая бытовая техника", type: "planned", status: "pending_commercial_director",
    startDate: "2026-07-01", endDate: "2026-07-31", managerId: "km2",
    budget: 15000000, discount: 18, version: 1, itemCount: 30, overdueDays: 3,
    kmAssignments: [
      { kmId: "km2", category: "Мелкая бытовая техника", status: "km_pending_kd", days: [0,1,2,3,4,5,6] },
      { kmId: "km4", category: "Смартфоны", status: "km_approved_kd", days: [0,2,4] },
    ],
  },
  {
    id: "PROMO-2026-008", name: "Геймерская неделя",
    category: "Компьютеры", type: "unplanned", status: "not_participating",
    startDate: "2026-07-10", endDate: "2026-07-17", managerId: "km6",
    budget: 55000000, discount: 25, version: 1, itemCount: 8,
    kmAssignments: [],
  },
  {
    id: "PROMO-2026-009", name: "Осенний фестиваль электроники",
    category: "Электроника", type: "planned", status: "cancelled",
    startDate: "2026-09-01", endDate: "2026-09-30", managerId: "km3",
    budget: 0, discount: 0, version: 1, itemCount: 0,
    kmAssignments: [
      { kmId: "km1", category: "Холодильники", status: "km_not_participating", days: [] },
      { kmId: "km3", category: "Электроника", status: "km_not_participating", days: [] },
    ],
  },
];

export const MOCK_VERSION_HISTORY: Record<string, VersionEntry[]> = {
  "PROMO-2026-001": [
    {
      version: 3, date: "02.06.2026 14:30", author: "Алишер Каримов", role: "КМ",
      changeType: "correction", summary: "Скорректирована цена на Bosch KGN39XW28R и прогноз продаж LG GA-B509CQTL",
      fieldChanges: [
        { rowId: "r03", nomenclature: "Bosch KGN39XW28R Холодильник", field: "Новая цена", oldValue: "9 449 000", newValue: "8 924 000", changeKind: "modified" },
        { rowId: "r03", nomenclature: "Bosch KGN39XW28R Холодильник", field: "Скидка %", oldValue: "10%", newValue: "15%", changeKind: "modified" },
        { rowId: "r02", nomenclature: "LG GA-B509CQTL Холодильник", field: "Прогноз продаж", oldValue: "25", newValue: "30", changeKind: "modified" },
      ],
      sentToDepartments: true, departmentsSentDate: "02.06.2026 16:45",
    },
    {
      version: 2, date: "01.06.2026 10:15", author: "Алишер Каримов", role: "КМ",
      changeType: "addition", summary: "Добавлены 2 позиции: Dyson V15 Detect и Philips EP2231",
      fieldChanges: [
        { rowId: "r04", nomenclature: "Dyson V15 Detect Пылесос", field: "Номенклатура", oldValue: "", newValue: "Dyson V15 Detect Пылесос", changeKind: "added" },
        { rowId: "r04", nomenclature: "Dyson V15 Detect Пылесос", field: "Новая цена", oldValue: "", newValue: "7 649 000", changeKind: "added" },
      ],
      sentToDepartments: true, departmentsSentDate: "01.06.2026 15:30",
    },
    {
      version: 1, date: "28.05.2026 09:00", author: "Алишер Каримов", role: "КМ",
      changeType: "initial_submission", summary: "Первичная отправка: 3 позиции холодильников для летней распродажи",
      fieldChanges: [],
      sentToDepartments: true, departmentsSentDate: "28.05.2026 11:00",
    },
  ],
  "PROMO-2026-003": [
    {
      version: 5, date: "31.05.2026 16:00", author: "Нодира Хасанова", role: "КМ",
      changeType: "report_sent", summary: "Обновлённый отчёт отправлен в отделы после корректировки цен",
      fieldChanges: [],
      sentToDepartments: true, departmentsSentDate: "31.05.2026 16:00",
    },
    {
      version: 4, date: "30.05.2026 11:30", author: "Нодира Хасанова", role: "КМ",
      changeType: "correction", summary: "Корректировка цены Samsung Galaxy S24 Ultra, обновлён прогноз Xiaomi 14 Pro",
      fieldChanges: [
        { rowId: "r09", nomenclature: "Samsung Galaxy S24 Ultra 512GB", field: "Новая цена", oldValue: "14 999 000", newValue: "15 999 000", changeKind: "modified" },
        { rowId: "r10", nomenclature: "Xiaomi 14 Pro 256GB", field: "Прогноз продаж", oldValue: "80", newValue: "100", changeKind: "modified" },
      ],
    },
    {
      version: 3, date: "29.05.2026 14:00", author: "Нодира Хасанова", role: "КМ",
      changeType: "addition", summary: "Добавлены Samsung Galaxy Watch6 Classic",
      fieldChanges: [
        { rowId: "r11", nomenclature: "Samsung Galaxy Watch6 Classic", field: "Номенклатура", oldValue: "", newValue: "Samsung Galaxy Watch6 Classic", changeKind: "added" },
      ],
    },
    {
      version: 2, date: "28.05.2026 15:00", author: "Нодира Хасанова", role: "КМ",
      changeType: "correction", summary: "Изменён тип промо для iPhone 15 Pro с «Скидка» на «1+1»",
      fieldChanges: [
        { rowId: "r08", nomenclature: "iPhone 15 Pro 256GB", field: "Тип промо", oldValue: "Скидка", newValue: "1+1", changeKind: "modified" },
        { rowId: "r08", nomenclature: "iPhone 15 Pro 256GB", field: "Подарок", oldValue: "—", newValue: "Samsung Galaxy Buds3 Pro", changeKind: "added" },
      ],
    },
    {
      version: 1, date: "27.05.2026 09:00", author: "Нодира Хасанова", role: "КМ",
      changeType: "initial_submission", summary: "Первичная отправка: 3 позиции смартфонов для флэш-распродажи",
      fieldChanges: [],
      sentToDepartments: true, departmentsSentDate: "27.05.2026 12:00",
    },
  ],
  "PROMO-2026-006": [
    {
      version: 2, date: "01.06.2026 09:30", author: "Фарход Ибрагимов", role: "КД",
      changeType: "cancellation", summary: "Акция отменена по решению коммерческого директора. Причина: изменение рыночных условий",
      fieldChanges: [],
    },
    {
      version: 1, date: "25.05.2026 10:00", author: "Алишер Каримов", role: "КМ",
      changeType: "initial_submission", summary: "Первичная отправка: 12 позиций кондиционеров",
      fieldChanges: [],
    },
  ],
};

export const MOCK_DEADLINE_CHANGES: DeadlineChangeRequest[] = [
  {
    id: "dc-1", campaignId: "PROMO-2026-001",
    initiator: "Фарход Ибрагимов", initiatorRole: "КД",
    reason: "Поставка задерживается на 5 дней из-за логистических проблем",
    oldDeadline: "2026-06-15", newDeadline: "2026-06-20",
    requestDate: "03.06.2026 10:00",
    approvalStatus: "approved", approvedBy: "Зам. директора", approvedDate: "03.06.2026 14:30",
  },
  {
    id: "dc-2", campaignId: "PROMO-2026-005",
    initiator: "Фарход Ибрагимов", initiatorRole: "КД",
    reason: "Необходимо согласовать маркетинговые материалы",
    oldDeadline: "2026-06-25", newDeadline: "2026-06-30",
    requestDate: "04.06.2026 11:00",
    approvalStatus: "pending",
  },
];

export const MOCK_CANCELLATIONS: CancellationRecord[] = [
  {
    id: "cancel-1", target: "campaign", targetId: "PROMO-2026-006",
    targetName: "Кондиционеры — летний бонус",
    reason: "Изменение рыночных условий — поставщик отозвал специальные условия",
    cancelledBy: "Фарход Ибрагимов", cancelledByRole: "КД",
    date: "01.06.2026 09:30", notifiedDepartments: true,
  },
  {
    id: "cancel-2", target: "line", targetId: "r10",
    targetName: "Xiaomi 14 Pro 256GB (PROMO-2026-003)",
    reason: "Дублирующая позиция — товар уже участвует в другой акции",
    cancelledBy: "Нодира Хасанова", cancelledByRole: "КМ",
    date: "30.05.2026 14:00", notifiedDepartments: false,
  },
];

export const MOCK_DEPARTMENT_REPORTS: DepartmentReport[] = [
  {
    campaignId: "PROMO-2026-003", campaignName: "Флэш-распродажа смартфонов",
    version: 5, sentDate: "2026-05-28", receivedDate: "2026-05-28",
    lines: [
      {
        id: "rl-01", kmName: "Нодира Хасанова", promoNumber: "PROMO-2026-003", promoType: "Скидка",
        promoName: "Флэш-распродажа смартфонов", startDate: "2026-06-01", endDate: "2026-06-07",
        nomenclature: "Samsung Galaxy S24 Ultra 512GB", stock: 145, oldPrice: 18999000, newPrice: 15999000,
        discountPercent: 16, inst006: 2666500, inst0012: 1333250, inst5002: 8249500,
        oldPayment12: 1583250, newPayment12: 1333250, discount12: 250000, fullPrice12: 15999000,
        oldPayment24: 791625, newPayment24: 666625, discount24: 125000, fullPrice24: 15999000,
        oldPayment36: 527750, newPayment36: 444361, discount36: 83389, fullPrice36: 15997000,
        cashDiscount: 18, giftNomenclature: "", giftStock: 0, utp: "Лучшая цена на флагман Samsung",
        inAdvKm: true, inAdvMarketing: true, supplierCompensation: 1500000, compensationLimit: 50,
      },
      {
        id: "rl-02", kmName: "Нодира Хасанова", promoNumber: "PROMO-2026-003", promoType: "1+1",
        promoName: "Флэш-распродажа смартфонов", startDate: "2026-06-01", endDate: "2026-06-07",
        nomenclature: "iPhone 15 Pro 256GB", stock: 89, oldPrice: 16499000, newPrice: 14999000,
        discountPercent: 9, inst006: 2499833, inst0012: 1249917, inst5002: 7749500,
        oldPayment12: 1374917, newPayment12: 1249917, discount12: 125000, fullPrice12: 14999000,
        oldPayment24: 687458, newPayment24: 624958, discount24: 62500, fullPrice24: 14999000,
        oldPayment36: 458306, newPayment36: 416639, discount36: 41667, fullPrice36: 14999000,
        cashDiscount: 12, giftNomenclature: "Samsung Galaxy Buds3 Pro", giftStock: 60,
        utp: "iPhone + наушники в подарок", inAdvKm: true, inAdvMarketing: false,
        supplierCompensation: 800000, compensationLimit: 30,
      },
      {
        id: "rl-03", kmName: "Нодира Хасанова", promoNumber: "PROMO-2026-003", promoType: "Скидка",
        promoName: "Флэш-распродажа смартфонов", startDate: "2026-06-01", endDate: "2026-06-07",
        nomenclature: "Xiaomi 14 Pro 256GB", stock: 210, oldPrice: 9999000, newPrice: 7999000,
        discountPercent: 20, inst006: 1333167, inst0012: 666583, inst5002: 4249500,
        oldPayment12: 833250, newPayment12: 666583, discount12: 166667, fullPrice12: 7999000,
        oldPayment24: 416625, newPayment24: 333292, discount24: 83333, fullPrice24: 7999000,
        oldPayment36: 277750, newPayment36: 222194, discount36: 55556, fullPrice36: 7999000,
        cashDiscount: 22, giftNomenclature: "", giftStock: 0, utp: "",
        inAdvKm: true, inAdvMarketing: true, supplierCompensation: 500000, compensationLimit: 100,
        changeKind: "modified", changedFields: ["newPrice", "discountPercent", "newPayment12", "newPayment24", "newPayment36"],
      },
      {
        id: "rl-04", kmName: "Нодира Хасанова", promoNumber: "PROMO-2026-003", promoType: "Скидка",
        promoName: "Флэш-распродажа смартфонов", startDate: "2026-06-01", endDate: "2026-06-07",
        nomenclature: "Samsung Galaxy Watch6 Classic", stock: 75, oldPrice: 4499000, newPrice: 3599000,
        discountPercent: 20, inst006: 599833, inst0012: 299917, inst5002: 2049500,
        oldPayment12: 374917, newPayment12: 299917, discount12: 75000, fullPrice12: 3599000,
        oldPayment24: 187458, newPayment24: 149958, discount24: 37500, fullPrice24: 3599000,
        oldPayment36: 124972, newPayment36: 99972, discount36: 25000, fullPrice36: 3599000,
        cashDiscount: 22, giftNomenclature: "", giftStock: 0, utp: "Смарт-часы по цене фитнес-браслета",
        inAdvKm: false, inAdvMarketing: false, supplierCompensation: 200000, compensationLimit: 40,
        changeKind: "added",
      },
    ],
  },
  {
    campaignId: "PROMO-2026-001", campaignName: "Летняя распродажа холодильников",
    version: 3, sentDate: "2026-06-02", receivedDate: "2026-06-02",
    lines: [
      {
        id: "rl-05", kmName: "Алишер Каримов", promoNumber: "PROMO-2026-001", promoType: "Скидка",
        promoName: "Летняя распродажа холодильников", startDate: "2026-06-15", endDate: "2026-07-15",
        nomenclature: "Samsung RB37A5200SA/WT Холодильник", stock: 320, oldPrice: 7299000, newPrice: 6199000,
        discountPercent: 15, inst006: 1033167, inst0012: 516583, inst5002: 3349500,
        oldPayment12: 608250, newPayment12: 516583, discount12: 91667, fullPrice12: 6199000,
        oldPayment24: 304125, newPayment24: 258292, discount24: 45833, fullPrice24: 6199000,
        oldPayment36: 202750, newPayment36: 172194, discount36: 30556, fullPrice36: 6199000,
        cashDiscount: 17, giftNomenclature: "", giftStock: 0, utp: "Инверторный компрессор, 10 лет гарантии",
        inAdvKm: true, inAdvMarketing: true, supplierCompensation: 700000, compensationLimit: 80,
      },
      {
        id: "rl-06", kmName: "Алишер Каримов", promoNumber: "PROMO-2026-001", promoType: "Скидка",
        promoName: "Летняя распродажа холодильников", startDate: "2026-06-15", endDate: "2026-07-15",
        nomenclature: "LG GA-B509CQTL Холодильник", stock: 185, oldPrice: 8499000, newPrice: 7199000,
        discountPercent: 15, inst006: 1199833, inst0012: 599917, inst5002: 3849500,
        oldPayment12: 708250, newPayment12: 599917, discount12: 108333, fullPrice12: 7199000,
        oldPayment24: 354125, newPayment24: 299958, discount24: 54167, fullPrice24: 7199000,
        oldPayment36: 236083, newPayment36: 199972, discount36: 36111, fullPrice36: 7199000,
        cashDiscount: 17, giftNomenclature: "", giftStock: 0, utp: "",
        inAdvKm: true, inAdvMarketing: false, supplierCompensation: 600000, compensationLimit: 60,
        changeKind: "modified", changedFields: ["stock"],
      },
      {
        id: "rl-07", kmName: "Алишер Каримов", promoNumber: "PROMO-2026-001", promoType: "Скидка",
        promoName: "Летняя распродажа холодильников", startDate: "2026-06-15", endDate: "2026-07-15",
        nomenclature: "Bosch KGN39XW28R Холодильник", stock: 92, oldPrice: 10499000, newPrice: 8924000,
        discountPercent: 15, inst006: 1487333, inst0012: 743667, inst5002: 4712000,
        oldPayment12: 874917, newPayment12: 743667, discount12: 131250, fullPrice12: 8924000,
        oldPayment24: 437458, newPayment24: 371833, discount24: 65625, fullPrice24: 8924000,
        oldPayment36: 291639, newPayment36: 247889, discount36: 43750, fullPrice36: 8924000,
        cashDiscount: 17, giftNomenclature: "", giftStock: 0, utp: "Немецкое качество, VitaFresh зона",
        inAdvKm: true, inAdvMarketing: true, supplierCompensation: 900000, compensationLimit: 45,
        changeKind: "modified", changedFields: ["newPrice", "discountPercent"],
        acknowledged: true,
      },
    ],
  },
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1", type: "data_change",
    campaignId: "PROMO-2026-003", campaignName: "Флэш-распродажа смартфонов",
    version: 5, sentAt: "2026-06-08T14:30",
    responsible: "Нодира Хасанова",
    description: "Изменена цена и условия рассрочки для Xiaomi 14 Pro 256GB",
    read: false,
    targetRoles: ["marketing_staff", "purchasing_staff", "analytics_staff", "marketing_director", "admin"],
  },
  {
    id: "notif-2", type: "campaign_cancelled",
    campaignId: "PROMO-2026-009", campaignName: "Распродажа кондиционеров — конец сезона",
    version: 2, sentAt: "2026-06-08T11:15",
    responsible: "Фарход Ибрагимов",
    description: "Акция отменена: изменение рыночных условий — поставщик отозвал специальные условия",
    read: false,
    targetRoles: ["all"],
  },
  {
    id: "notif-3", type: "marketing_reapproval",
    campaignId: "PROMO-2026-001", campaignName: "Летняя распродажа холодильников",
    version: 3, sentAt: "2026-06-08T09:00",
    responsible: "Алишер Каримов",
    description: "Корректировка данных после согласования — требуется повторное одобрение маркетинга",
    read: false,
    targetRoles: ["marketing_staff", "marketing_director", "admin"],
  },
  {
    id: "notif-4", type: "km_assignment",
    campaignId: "PROMO-2026-005", campaignName: "Back-to-School ноутбуки",
    version: 1, sentAt: "2026-06-07T16:45",
    responsible: "Севара Ташпулатова",
    description: "Вы назначены КМ на акцию «Back-to-School ноутбуки» (категория: Ноутбуки)",
    read: false,
    targetRoles: ["category_manager", "admin"],
  },
  {
    id: "notif-5", type: "line_removed",
    campaignId: "PROMO-2026-003", campaignName: "Флэш-распродажа смартфонов",
    version: 5, sentAt: "2026-06-07T14:20",
    responsible: "Нодира Хасанова",
    description: "Удалена позиция: Xiaomi 14 Pro 256GB — дублирующая позиция в другой акции",
    read: false,
    targetRoles: ["category_manager", "senior_category_manager", "commercial_director", "admin"],
  },
  {
    id: "notif-6", type: "adv_approval",
    campaignId: "PROMO-2026-003", campaignName: "Флэш-распродажа смартфонов",
    version: 5, sentAt: "2026-06-07T10:00",
    responsible: "Марина Алексеева",
    description: "Утверждено «В рекламу» для 3 позиций: Samsung Galaxy S24 Ultra, Xiaomi 14 Pro, Galaxy Watch6",
    read: true,
    targetRoles: ["category_manager", "senior_category_manager", "marketing_staff", "marketing_director", "admin"],
  },
  {
    id: "notif-7", type: "data_change",
    campaignId: "PROMO-2026-001", campaignName: "Летняя распродажа холодильников",
    version: 3, sentAt: "2026-06-06T15:30",
    responsible: "Алишер Каримов",
    description: "Обновлены остатки на складе для LG GA-B509CQTL Холодильник",
    read: true,
    targetRoles: ["marketing_staff", "purchasing_staff", "analytics_staff", "marketing_director", "admin"],
  },
  {
    id: "notif-8", type: "km_assignment",
    campaignId: "PROMO-2026-002", campaignName: "Сезон стирки — скидки на стиральные машины",
    version: 1, sentAt: "2026-06-05T09:00",
    responsible: "Бахтиёр Юлдашев",
    description: "Вы назначены КМ на акцию «Сезон стирки» (категория: Стиральные машины)",
    read: true,
    targetRoles: ["category_manager", "admin"],
  },
];

export const MOCK_PROMO_RULES: PromoRule[] = [
  {
    id: "rule-1",
    name: "Рассрочка 0-0-12 стандарт",
    promoTypes: ["Рассрочка 0-0-12"],
    requiredFields: ["nomenclatureName", "stock", "newPrice", "forecastSales", "inst0012", "monthlyOld12", "monthlyNew12", "discount12", "fullPriceNew12", "inAdKm"],
    status: "confirmed",
    createdBy: "Фарход Ибрагимов",
    createdAt: "2026-05-20",
    confirmedBy: "Фарход Ибрагимов",
    confirmedAt: "2026-05-22",
    version: 2,
    history: [
      { version: 1, date: "20.05.2026 10:00", author: "Фарход Ибрагимов", role: "КД", summary: "Создано правило — 8 обязательных полей" },
      { version: 2, date: "22.05.2026 14:30", author: "Фарход Ибрагимов", role: "КД", summary: "Добавлены поля «В рекламу (КМ)» и «Прогноз продаж», утверждено" },
    ],
  },
  {
    id: "rule-2",
    name: "Скидка стандарт",
    promoTypes: ["Скидка"],
    requiredFields: ["nomenclatureName", "stock", "retailPriceOld", "newPrice", "discountPercent", "forecastSales", "discountCash", "utp"],
    status: "draft",
    createdBy: "Севара Ташпулатова",
    createdAt: "2026-06-05",
    version: 1,
    history: [
      { version: 1, date: "05.06.2026 11:20", author: "Севара Ташпулатова", role: "Админ", summary: "Создано правило — 8 обязательных полей" },
    ],
  },
  {
    id: "rule-3",
    name: "1+1 старый формат",
    promoTypes: ["1+1", "Товар в подарок"],
    requiredFields: ["nomenclatureName", "stock", "newPrice", "forecastSales", "giftNomenclature", "giftStock", "compensationSum"],
    status: "archived",
    createdBy: "Фарход Ибрагимов",
    createdAt: "2026-03-10",
    confirmedBy: "Фарход Ибрагимов",
    confirmedAt: "2026-03-12",
    version: 3,
    history: [
      { version: 1, date: "10.03.2026 09:00", author: "Фарход Ибрагимов", role: "КД", summary: "Создано правило — 5 обязательных полей" },
      { version: 2, date: "12.03.2026 16:00", author: "Фарход Ибрагимов", role: "КД", summary: "Добавлены поля «Компенсация» и «Прогноз», утверждено" },
      { version: 3, date: "01.06.2026 10:00", author: "Фарход Ибрагимов", role: "КД", summary: "Архивировано — заменено новыми правилами" },
    ],
  },
];

// ════════════════════════════════════════════════════════════
// AUDIT LOG TYPES & DATA
// ════════════════════════════════════════════════════════════

export type AuditActionType =
  | "creation"
  | "modification"
  | "submit_for_approval"
  | "approval"
  | "rejection"
  | "cancellation"
  | "set_not_participating"
  | "report_sent";

export type AuditObjectType = "campaign" | "line" | "report";

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  datetime: string;
  actionType: AuditActionType;
  objectType: AuditObjectType;
  objectId: string;
  objectName?: string;
  statusBefore?: PromoStatus;
  statusAfter?: PromoStatus;
  comment?: string;
}

export interface ControlEvent {
  id: string;
  campaignId: string;
  milestone: string;
  milestoneRu: string;
  milestoneEn: string;
  expectedDate: string;
  actualDate?: string;
  responsibleUser: string;
  responsibleRole: string;
  isOverdue: boolean;
  overdueDays?: number;
}

export const AUDIT_ACTION_CONFIG: Record<AuditActionType, { ru: string; en: string; bg: string; text: string; border: string; icon: string }> = {
  creation:              { ru: "Создание",                en: "Creation",              bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0", icon: "plus" },
  modification:          { ru: "Изменение",               en: "Modification",          bg: "#DBEAFE", text: "#2563EB", border: "#BFDBFE", icon: "pencil" },
  submit_for_approval:   { ru: "Отправка на согласование", en: "Submit for approval",   bg: "#FEF3C7", text: "#D97706", border: "#FDE68A", icon: "send" },
  approval:              { ru: "Согласование",             en: "Approval",              bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0", icon: "check" },
  rejection:             { ru: "Отклонение",               en: "Rejection",             bg: "#FEE2E2", text: "#DC2626", border: "#FECACA", icon: "x" },
  cancellation:          { ru: "Отмена",                   en: "Cancellation",          bg: "#FEE2E2", text: "#DC2626", border: "#FECACA", icon: "ban" },
  set_not_participating: { ru: "Установка «Не участвует»", en: "Set not participating", bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB", icon: "user-x" },
  report_sent:           { ru: "Отправка отчёта",          en: "Report sent",           bg: "#E0E7FF", text: "#4338CA", border: "#C7D2FE", icon: "arrow-right" },
};

export const AUDIT_OBJECT_CONFIG: Record<AuditObjectType, { ru: string; en: string; bg: string; text: string; border: string }> = {
  campaign: { ru: "Акция",  en: "Campaign", bg: "#DBEAFE", text: "#2563EB", border: "#BFDBFE" },
  line:     { ru: "Строка", en: "Line",     bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
  report:   { ru: "Отчёт",  en: "Report",   bg: "#E0E7FF", text: "#4338CA", border: "#C7D2FE" },
};

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  { id: "al-01", userId: "km1", userName: "Алишер Каримов", userRole: "category_manager", datetime: "2026-06-08 09:12", actionType: "creation", objectType: "campaign", objectId: "PROMO-2026-001", objectName: "Летняя распродажа холодильников", statusAfter: "not_filled" },
  { id: "al-02", userId: "km1", userName: "Алишер Каримов", userRole: "category_manager", datetime: "2026-06-08 10:45", actionType: "modification", objectType: "line", objectId: "PROMO-2026-001/R03", objectName: "Bosch KGN39XW28R", statusBefore: "not_filled", statusAfter: "not_filled", comment: "Изменена цена: 9 449 000 → 8 924 000" },
  { id: "al-03", userId: "km1", userName: "Алишер Каримов", userRole: "category_manager", datetime: "2026-06-07 14:30", actionType: "submit_for_approval", objectType: "campaign", objectId: "PROMO-2026-001", statusBefore: "not_filled", statusAfter: "pending_senior_km" },
  { id: "al-04", userId: "km3", userName: "Бахтиёр Юлдашев", userRole: "senior_category_manager", datetime: "2026-06-07 16:05", actionType: "approval", objectType: "campaign", objectId: "PROMO-2026-001", statusBefore: "pending_senior_km", statusAfter: "approved_senior_km" },
  { id: "al-05", userId: "u-kd", userName: "Фарход Ибрагимов", userRole: "commercial_director", datetime: "2026-06-07 17:20", actionType: "approval", objectType: "campaign", objectId: "PROMO-2026-001", statusBefore: "pending_commercial_director", statusAfter: "approved_commercial_director" },
  { id: "al-06", userId: "u-kd", userName: "Фарход Ибрагимов", userRole: "commercial_director", datetime: "2026-06-07 17:25", actionType: "report_sent", objectType: "report", objectId: "PROMO-2026-001", objectName: "Летняя распродажа холодильников", statusBefore: "approved_commercial_director", statusAfter: "sent_to_departments" },
  { id: "al-07", userId: "km4", userName: "Нодира Хасанова", userRole: "category_manager", datetime: "2026-06-06 11:00", actionType: "creation", objectType: "campaign", objectId: "PROMO-2026-003", objectName: "Флэш-распродажа смартфонов", statusAfter: "not_filled" },
  { id: "al-08", userId: "km4", userName: "Нодира Хасанова", userRole: "category_manager", datetime: "2026-06-06 13:30", actionType: "submit_for_approval", objectType: "campaign", objectId: "PROMO-2026-003", statusBefore: "not_filled", statusAfter: "pending_senior_km" },
  { id: "al-09", userId: "km3", userName: "Бахтиёр Юлдашев", userRole: "senior_category_manager", datetime: "2026-06-06 15:10", actionType: "rejection", objectType: "campaign", objectId: "PROMO-2026-003", statusBefore: "pending_senior_km", statusAfter: "awaiting_correction", comment: "Прогнозы продаж завышены, пересмотрите данные по Galaxy S25" },
  { id: "al-10", userId: "km4", userName: "Нодира Хасанова", userRole: "category_manager", datetime: "2026-06-06 16:40", actionType: "modification", objectType: "line", objectId: "PROMO-2026-003/R08", objectName: "Samsung Galaxy S25 Ultra", comment: "Прогноз: 150 → 95 шт" },
  { id: "al-11", userId: "km4", userName: "Нодира Хасанова", userRole: "category_manager", datetime: "2026-06-06 16:50", actionType: "submit_for_approval", objectType: "campaign", objectId: "PROMO-2026-003", statusBefore: "awaiting_correction", statusAfter: "pending_senior_km" },
  { id: "al-12", userId: "km3", userName: "Бахтиёр Юлдашев", userRole: "senior_category_manager", datetime: "2026-06-05 09:00", actionType: "approval", objectType: "campaign", objectId: "PROMO-2026-003", statusBefore: "pending_senior_km", statusAfter: "approved_senior_km" },
  { id: "al-13", userId: "u-kd", userName: "Фарход Ибрагимов", userRole: "commercial_director", datetime: "2026-06-05 10:15", actionType: "approval", objectType: "campaign", objectId: "PROMO-2026-003", statusBefore: "pending_commercial_director", statusAfter: "approved_commercial_director" },
  { id: "al-14", userId: "u-kd", userName: "Фарход Ибрагимов", userRole: "commercial_director", datetime: "2026-06-05 10:20", actionType: "report_sent", objectType: "report", objectId: "PROMO-2026-003", objectName: "Флэш-распродажа смартфонов", statusBefore: "approved_commercial_director", statusAfter: "sent_to_departments" },
  { id: "al-15", userId: "km5", userName: "Рустам Мирзаев", userRole: "category_manager", datetime: "2026-06-05 11:30", actionType: "set_not_participating", objectType: "campaign", objectId: "PROMO-2026-001", objectName: "Летняя распродажа холодильников", comment: "Категория телевизоров не релевантна для данной акции" },
  { id: "al-16", userId: "u-kd", userName: "Фарход Ибрагимов", userRole: "commercial_director", datetime: "2026-06-04 14:00", actionType: "cancellation", objectType: "campaign", objectId: "PROMO-2026-006", objectName: "Кондиционеры — летний бонус", statusBefore: "pending_commercial_director", statusAfter: "cancelled", comment: "Поставщик не подтвердил условия компенсации" },
  { id: "al-17", userId: "km2", userName: "Дилнавоз Рахимова", userRole: "category_manager", datetime: "2026-06-04 10:15", actionType: "creation", objectType: "campaign", objectId: "PROMO-2026-002", objectName: "Скидки на стиральные машины", statusAfter: "not_filled" },
  { id: "al-18", userId: "km2", userName: "Дилнавоз Рахимова", userRole: "category_manager", datetime: "2026-06-04 12:30", actionType: "submit_for_approval", objectType: "campaign", objectId: "PROMO-2026-002", statusBefore: "not_filled", statusAfter: "pending_senior_km" },
  { id: "al-19", userId: "km1", userName: "Алишер Каримов", userRole: "category_manager", datetime: "2026-06-03 09:00", actionType: "cancellation", objectType: "line", objectId: "PROMO-2026-001/R05", objectName: "Samsung RT38CG6000 Холодильник", comment: "Товар снят с продажи поставщиком" },
  { id: "al-20", userId: "u-dm", userName: "Малика Усманова", userRole: "marketing_director", datetime: "2026-06-03 15:00", actionType: "modification", objectType: "report", objectId: "PROMO-2026-001", objectName: "Летняя распродажа — маркетинг", comment: "Отмечено «В рекламу» для 5 позиций" },
];

export const MOCK_CONTROL_EVENTS: ControlEvent[] = [
  { id: "ce-01", campaignId: "PROMO-2026-001", milestone: "plan_created", milestoneRu: "Создание плана", milestoneEn: "Plan created", expectedDate: "2026-05-20", actualDate: "2026-05-20", responsibleUser: "Алишер Каримов", responsibleRole: "КМ", isOverdue: false },
  { id: "ce-02", campaignId: "PROMO-2026-001", milestone: "km_data_sent", milestoneRu: "Отправка данных КМ", milestoneEn: "KM data submitted", expectedDate: "2026-05-25", actualDate: "2026-05-25", responsibleUser: "Алишер Каримов", responsibleRole: "КМ", isOverdue: false },
  { id: "ce-03", campaignId: "PROMO-2026-001", milestone: "senior_km_approval", milestoneRu: "Согласование ст. КМ", milestoneEn: "Senior KM approval", expectedDate: "2026-05-27", actualDate: "2026-05-27", responsibleUser: "Бахтиёр Юлдашев", responsibleRole: "Ст.КМ", isOverdue: false },
  { id: "ce-04", campaignId: "PROMO-2026-001", milestone: "kd_approval", milestoneRu: "Согласование КД", milestoneEn: "CD approval", expectedDate: "2026-05-29", actualDate: "2026-05-29", responsibleUser: "Фарход Ибрагимов", responsibleRole: "КД", isOverdue: false },
  { id: "ce-05", campaignId: "PROMO-2026-001", milestone: "report_sent", milestoneRu: "Отправка отчёта", milestoneEn: "Report sent", expectedDate: "2026-05-30", actualDate: "2026-05-30", responsibleUser: "Фарход Ибрагимов", responsibleRole: "КД", isOverdue: false },

  { id: "ce-06", campaignId: "PROMO-2026-003", milestone: "plan_created", milestoneRu: "Создание плана", milestoneEn: "Plan created", expectedDate: "2026-05-15", actualDate: "2026-05-15", responsibleUser: "Нодира Хасанова", responsibleRole: "КМ", isOverdue: false },
  { id: "ce-07", campaignId: "PROMO-2026-003", milestone: "km_data_sent", milestoneRu: "Отправка данных КМ", milestoneEn: "KM data submitted", expectedDate: "2026-05-17", actualDate: "2026-05-17", responsibleUser: "Нодира Хасанова", responsibleRole: "КМ", isOverdue: false },
  { id: "ce-08", campaignId: "PROMO-2026-003", milestone: "senior_km_approval", milestoneRu: "Согласование ст. КМ", milestoneEn: "Senior KM approval", expectedDate: "2026-05-19", actualDate: "2026-05-24", responsibleUser: "Бахтиёр Юлдашев", responsibleRole: "Ст.КМ", isOverdue: true, overdueDays: 3 },
  { id: "ce-09", campaignId: "PROMO-2026-003", milestone: "kd_approval", milestoneRu: "Согласование КД", milestoneEn: "CD approval", expectedDate: "2026-05-26", actualDate: "2026-05-28", responsibleUser: "Фарход Ибрагимов", responsibleRole: "КД", isOverdue: false },
  { id: "ce-10", campaignId: "PROMO-2026-003", milestone: "report_sent", milestoneRu: "Отправка отчёта", milestoneEn: "Report sent", expectedDate: "2026-05-28", actualDate: "2026-05-28", responsibleUser: "Фарход Ибрагимов", responsibleRole: "КД", isOverdue: false },

  { id: "ce-11", campaignId: "PROMO-2026-005", milestone: "plan_created", milestoneRu: "Создание плана", milestoneEn: "Plan created", expectedDate: "2026-06-01", actualDate: "2026-06-01", responsibleUser: "Рустам Мирзаев", responsibleRole: "КМ", isOverdue: false },
  { id: "ce-12", campaignId: "PROMO-2026-005", milestone: "km_data_sent", milestoneRu: "Отправка данных КМ", milestoneEn: "KM data submitted", expectedDate: "2026-06-03", actualDate: "2026-06-04", responsibleUser: "Рустам Мирзаев", responsibleRole: "КМ", isOverdue: false },
  { id: "ce-13", campaignId: "PROMO-2026-005", milestone: "senior_km_approval", milestoneRu: "Согласование ст. КМ", milestoneEn: "Senior KM approval", expectedDate: "2026-06-06", actualDate: undefined, responsibleUser: "Севара Ташпулатова", responsibleRole: "Ст.КМ", isOverdue: false },
  { id: "ce-14", campaignId: "PROMO-2026-005", milestone: "kd_approval", milestoneRu: "Согласование КД", milestoneEn: "CD approval", expectedDate: "2026-06-08", actualDate: undefined, responsibleUser: "Фарход Ибрагимов", responsibleRole: "КД", isOverdue: false },
  { id: "ce-15", campaignId: "PROMO-2026-005", milestone: "report_sent", milestoneRu: "Отправка отчёта", milestoneEn: "Report sent", expectedDate: "2026-06-10", actualDate: undefined, responsibleUser: "Фарход Ибрагимов", responsibleRole: "КД", isOverdue: false },
];

const CURRENT_USER = { name: "Фарход Ибрагимов", initials: "ФИ" };

// ════════════════════════════════════════════════════════════
// APP CONTEXT
// ════════════════════════════════════════════════════════════

interface AppContextValue {
  currentRole: string;
  activePage: string;
  sidebarCollapsed: boolean;
  campaigns: PromoCampaign[];
  managers: CategoryManager[];
  navigate: (page: string) => void;
  setCurrentRole: (role: string) => void;
  notificationCount: number;
  openNotifications: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppContext");
  return ctx;
}

// ════════════════════════════════════════════════════════════
// FORMATTERS
// ════════════════════════════════════════════════════════════

export function formatMoney(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " сум";
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

// ════════════════════════════════════════════════════════════
// SHARED PRIMITIVES
// ════════════════════════════════════════════════════════════

export function BilingualLabel({ ru, en, size = "default", className }: {
  ru: string; en: string; size?: "default" | "sm" | "page"; className?: string;
}) {
  return (
    <div className={className}>
      <div
        className="font-heading leading-tight"
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontWeight: size === "page" ? 700 : 600,
          fontSize: size === "page" ? 24 : size === "sm" ? 13 : 14,
          lineHeight: size === "page" ? 1.2 : 1.3,
        }}
      >
        {ru}
      </div>
      <div
        style={{
          fontSize: size === "page" ? 14 : size === "sm" ? 11 : 12,
          color: "#9CA3AF",
          lineHeight: 1.4,
        }}
      >
        {en}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: PromoStatus }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="whitespace-nowrap text-xs font-medium px-2 py-0.5"
          style={{
            backgroundColor: cfg.bg,
            color: cfg.text,
            borderColor: cfg.border,
          }}
        >
          {cfg.ru}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{cfg.en}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function OverdueTag({ days }: { days: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          className="text-xs font-medium px-1.5 py-0 ml-1"
          style={{
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
            borderColor: "#FECACA",
            border: "1px solid #FECACA",
            fontSize: 11,
          }}
        >
          +{days} дн.
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>Overdue by {days} day{days !== 1 ? "s" : ""}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function ChangeTypeBadge({ type }: { type: ChangeType }) {
  const cfg = CHANGE_TYPE_CONFIG[type];
  if (!cfg) return null;
  const IconMap: Record<string, React.ElementType> = {
    send: Send, pencil: Pencil, plus: Plus, ban: Ban, "arrow-right": ArrowRight,
  };
  const Icon = IconMap[cfg.icon];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="whitespace-nowrap text-xs font-medium px-2 py-0.5 gap-1"
          style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}
        >
          {Icon && <Icon className="h-3 w-3" />}
          {cfg.ru}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top"><p>{cfg.en}</p></TooltipContent>
    </Tooltip>
  );
}

export function LineChangeBadge({ status }: { status: LineChangeStatus }) {
  const cfg = LINE_CHANGE_STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <Badge
      variant="outline"
      className="whitespace-nowrap text-xs font-medium px-2 py-0.5"
      style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}
    >
      {cfg.ru}
    </Badge>
  );
}

export function Money({ value }: { value: number }) {
  return (
    <span className="font-mono" style={{ fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: "tabular-nums" }}>
      {formatMoney(value)}
    </span>
  );
}

export function RuDate({ value }: { value: string }) {
  return (
    <span className="font-mono" style={{ fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: "tabular-nums" }}>
      {formatDate(value)}
    </span>
  );
}

// ════════════════════════════════════════════════════════════
// REASON DIALOG — confirm with mandatory reason textarea
// ════════════════════════════════════════════════════════════

export function ReasonDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm, variant = "destructive" }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (reason: string) => void;
  variant?: "destructive" | "default";
}) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason);
    setReason("");
    onOpenChange(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) setReason("");
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Manrope', sans-serif" }}>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder={labels.reasonPlaceholder.ru}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[100px]"
          style={{ fontSize: 14 }}
        />
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleClose(false)}>
            {labels.cancel.ru}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ════════════════════════════════════════════════════════════
// CANCEL CAMPAIGN DIALOG — КД only, required reason + notification preview
// ════════════════════════════════════════════════════════════

export function CancelCampaignDialog({ open, onOpenChange, campaignName, onConfirm }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaignName: string;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason);
    setReason("");
    onOpenChange(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) setReason("");
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Manrope', sans-serif" }}>
            <div className="flex items-center gap-2">
              <Ban className="h-5 w-5" style={{ color: "#DC2626" }} />
              {labels.cancelCampaign.ru}
            </div>
          </DialogTitle>
          <DialogDescription>
            Отмена акции «{campaignName}». Все отделы получат уведомление.
          </DialogDescription>
        </DialogHeader>
        <div className="p-3 rounded-lg" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", fontSize: 12, color: "#DC2626" }}>
          Статус акции изменится на «Отменена». Номенклатурные строки останутся в архиве для отчётности.
        </div>
        <Textarea
          placeholder={labels.reasonPlaceholder.ru}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[100px]"
          style={{ fontSize: 14 }}
        />
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleClose(false)}>
            {labels.cancel.ru}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason.trim()}>
            Отменить акцию
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ════════════════════════════════════════════════════════════
// DEADLINE CHANGE DIALOG — КД initiates, requires reason + old/new dates
// ════════════════════════════════════════════════════════════

export function DeadlineChangeDialog({ open, onOpenChange, currentDeadline, onConfirm }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentDeadline: string;
  onConfirm: (reason: string, newDeadline: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  const handleConfirm = () => {
    onConfirm(reason, newDeadline);
    setReason("");
    setNewDeadline("");
    onOpenChange(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) { setReason(""); setNewDeadline(""); }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Manrope', sans-serif" }}>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" style={{ color: "#D97706" }} />
              {labels.changeDeadline.ru}
            </div>
          </DialogTitle>
          <DialogDescription>
            Изменение дедлайна вступит в силу только после утверждения первым заместителем / уполномоченным лицом.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label style={{ fontSize: 12, color: "#6B7280" }}>Текущий дедлайн</Label>
            <Input
              disabled
              value={currentDeadline}
              className="h-9 mt-1"
              style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}
            />
          </div>
          <div>
            <Label style={{ fontSize: 12, color: "#6B7280" }}>Новый дедлайн</Label>
            <Input
              type="date"
              className="h-9 mt-1"
              style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
            />
          </div>
        </div>
        <Textarea
          placeholder="Укажите причину изменения дедлайна..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[80px]"
          style={{ fontSize: 14 }}
        />
        <div className="flex items-center gap-1.5 p-2 rounded" style={{ backgroundColor: "#FEF3C7", fontSize: 11, color: "#92400E" }}>
          <Clock className="h-3.5 w-3.5 shrink-0" />
          Требуется утверждение: первый зам / зам директора / уполномоченное лицо
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleClose(false)}>
            {labels.cancel.ru}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason.trim() || !newDeadline}
            style={{
              backgroundColor: reason.trim() && newDeadline ? "#FFDD2D" : undefined,
              color: reason.trim() && newDeadline ? "#16181D" : undefined,
            }}
          >
            Запросить изменение
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ════════════════════════════════════════════════════════════
// VERSION HISTORY DRAWER — wide sheet with 3 view modes
// ════════════════════════════════════════════════════════════

export function VersionHistoryDrawer({ open, onOpenChange, campaignId, onNavigateToHistory }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId?: string;
  onNavigateToHistory?: () => void;
}) {
  type ViewMode = "history" | "changes" | "full";
  const [viewMode, setViewMode] = useState<ViewMode>("history");

  const versions = campaignId
    ? (MOCK_VERSION_HISTORY[campaignId] || [])
    : (MOCK_VERSION_HISTORY["PROMO-2026-001"] || []);

  const MONO_S: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: "tabular-nums" };

  const viewTabs: { id: ViewMode; ru: string; en: string }[] = [
    { id: "history", ru: "История версий", en: "Version history" },
    { id: "changes", ru: "Только изменения", en: "Only changes" },
    { id: "full", ru: "Полный отчёт", en: "Full report" },
  ];

  const allChanges = versions.flatMap((v) =>
    v.fieldChanges.map((fc) => ({ ...fc, version: v.version, date: v.date }))
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-0 shrink-0">
          <SheetTitle>
            <BilingualLabel ru={labels.versionHistory.ru} en={labels.versionHistory.en} />
          </SheetTitle>
          {campaignId && (
            <div style={{ fontSize: 12, color: "#6B7280", ...MONO_S }}>{campaignId}</div>
          )}
        </SheetHeader>

        {/* View mode tabs */}
        <div className="flex gap-1 px-6 pt-4 pb-2 shrink-0">
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                backgroundColor: viewMode === tab.id ? "rgba(255,221,45,0.15)" : "#F3F4F6",
                color: viewMode === tab.id ? "#16181D" : "#6B7280",
                border: viewMode === tab.id ? "1px solid rgba(255,221,45,0.4)" : "1px solid transparent",
              }}
            >
              {tab.ru}
            </button>
          ))}
        </div>

        <ScrollArea className="flex-1 px-6">
          {/* ── History view ── */}
          {viewMode === "history" && (
            <div className="space-y-3 pb-6 pt-2">
              {versions.map((v, idx) => (
                <div key={v.version} className="relative">
                  {idx < versions.length - 1 && (
                    <div className="absolute left-4 top-14 bottom-0 w-px" style={{ backgroundColor: "#E5E7EB" }} />
                  )}
                  <div className="p-4 rounded-lg" style={{ backgroundColor: "#F4F5F7" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium" style={{ fontSize: 14 }}>
                            Версия {v.version}
                          </span>
                          <ChangeTypeBadge type={v.changeType} />
                        </div>
                        <div className="mt-1.5" style={{ ...MONO_S, fontSize: 12, color: "#6B7280" }}>
                          {v.date}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span style={{ fontSize: 13, color: "#16181D", fontWeight: 500 }}>{v.author}</span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0" style={{ fontSize: 10, color: "#6B7280", borderColor: "#E5E7EB" }}>
                            {v.role}
                          </Badge>
                        </div>
                        <div className="mt-2" style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
                          {v.summary}
                        </div>
                        {v.fieldChanges.length > 0 && (
                          <div className="mt-2 flex items-center gap-1" style={{ fontSize: 11, color: "#9CA3AF" }}>
                            <GitCompareArrows className="h-3 w-3" />
                            {v.fieldChanges.length} изменённых полей
                          </div>
                        )}
                      </div>
                    </div>
                    {v.sentToDepartments && (
                      <div
                        className="flex items-center gap-1.5 mt-3 px-2 py-1.5 rounded"
                        style={{ backgroundColor: "#DCFCE7", fontSize: 11, color: "#16A34A" }}
                      >
                        <Send className="h-3 w-3" />
                        Отправлено в отделы {v.departmentsSentDate}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {versions.length === 0 && (
                <div className="text-center py-12">
                  <History className="h-10 w-10 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#6B7280" }}>Нет истории версий</p>
                </div>
              )}
            </div>
          )}

          {/* ── Changes-only view ── */}
          {viewMode === "changes" && (
            <div className="pb-6 pt-2">
              {allChanges.length > 0 ? (
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
                  <table className="w-full" style={{ fontSize: 12 }}>
                    <thead>
                      <tr style={{ backgroundColor: "#F9FAFB" }}>
                        <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280", width: 50 }}>v</th>
                        <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280" }}>Номенклатура</th>
                        <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280" }}>Поле</th>
                        <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280" }}>Было</th>
                        <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280" }}>Стало</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allChanges.map((ch, i) => (
                        <tr key={i} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                          <td className="px-3 py-1.5" style={{ ...MONO_S, fontSize: 11, color: "#9CA3AF" }}>{ch.version}</td>
                          <td className="px-3 py-1.5" style={{ fontSize: 12, color: "#16181D", maxWidth: 160 }}>
                            <span className="truncate block">{ch.nomenclature}</span>
                          </td>
                          <td className="px-3 py-1.5" style={{ fontSize: 12, color: "#6B7280" }}>{ch.field}</td>
                          <td className="px-3 py-1.5">
                            <span
                              className="cell-removed inline-block px-1 rounded"
                              style={{ fontSize: 12, ...MONO_S }}
                            >
                              {ch.oldValue || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-1.5">
                            <span
                              className={`inline-block px-1 rounded ${ch.changeKind === "added" ? "cell-added" : "cell-modified"}`}
                              style={{ fontSize: 12, ...MONO_S }}
                            >
                              {ch.newValue}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <GitCompareArrows className="h-10 w-10 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#6B7280" }}>Нет зафиксированных изменений</p>
                </div>
              )}
            </div>
          )}

          {/* ── Full report view ── */}
          {viewMode === "full" && (
            <div className="pb-6 pt-2">
              <div className="p-4 rounded-lg" style={{ backgroundColor: "#F4F5F7" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge style={{ backgroundColor: "#DCFCE7", color: "#16A34A", border: "1px solid #BBF7D0", fontSize: 10 }}>
                    Версия {versions[0]?.version || 1}
                  </Badge>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>
                    Актуальная версия от {versions[0]?.date || "—"}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
                  Полный отчёт содержит все текущие данные акции, включая все ранее принятые изменения.
                  Просмотрите полную таблицу в «Полном промо-календаре» или откройте страницу «История и изменения» для подробного анализа.
                </p>
                {onNavigateToHistory && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-8"
                    style={{ fontSize: 12 }}
                    onClick={() => { onOpenChange(false); onNavigateToHistory(); }}
                  >
                    <ArrowRight className="h-3.5 w-3.5 mr-1" />
                    Открыть «История и изменения»
                  </Button>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Bottom action */}
        <div className="shrink-0 border-t px-6 py-4" style={{ borderColor: "#E5E7EB" }}>
          <div className="flex items-center justify-between gap-3">
            <div style={{ fontSize: 11, color: "#9CA3AF", maxWidth: 280 }}>
              {labels.noRollback.ru}
            </div>
            <Button
              size="sm"
              className="h-8 shrink-0"
              style={{ backgroundColor: "#FFDD2D", color: "#16181D", fontSize: 12, fontWeight: 600 }}
            >
              <Pencil className="h-3 w-3 mr-1" />
              {labels.createCorrection.ru}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ════════════════════════════════════════════════════════════
// FILTER BAR — inline at lg+, sheet below lg
// ════════════════════════════════════════════════════════════

export function FilterBar({ hideCancelled, onHideCancelledChange, period, onPeriodChange, category, onCategoryChange, statusFilter, onStatusFilterChange, manager, onManagerChange }: {
  hideCancelled: boolean;
  onHideCancelledChange: (v: boolean) => void;
  period: string;
  onPeriodChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  manager: string;
  onManagerChange: (v: string) => void;
}) {
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const activeFilterCount = [
    period !== "2026-06" ? 1 : 0,
    category !== "all" ? 1 : 0,
    statusFilter !== "all" ? 1 : 0,
    manager !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const filterControls = (
    <>
      <div className="space-y-1.5 lg:space-y-0">
        <Label className="text-xs lg:hidden" style={{ color: "#6B7280" }}>{labels.period.ru}</Label>
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-full lg:w-[160px] h-9" style={{ fontSize: 13 }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 lg:space-y-0">
        <Label className="text-xs lg:hidden" style={{ color: "#6B7280" }}>{labels.category.ru}</Label>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full lg:w-[180px] h-9" style={{ fontSize: 13 }}>
            <SelectValue placeholder={labels.category.ru} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{labels.all.ru}</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 lg:space-y-0">
        <Label className="text-xs lg:hidden" style={{ color: "#6B7280" }}>{labels.status.ru}</Label>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full lg:w-[200px] h-9" style={{ fontSize: 13 }}>
            <SelectValue placeholder={labels.status.ru} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{labels.all.ru}</SelectItem>
            {(Object.keys(STATUS_CONFIG) as PromoStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].ru}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 lg:space-y-0">
        <Label className="text-xs lg:hidden" style={{ color: "#6B7280" }}>{labels.manager.ru}</Label>
        <Select value={manager} onValueChange={onManagerChange}>
          <SelectTrigger className="w-full lg:w-[180px] h-9" style={{ fontSize: 13 }}>
            <SelectValue placeholder={labels.manager.ru} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{labels.all.ru}</SelectItem>
            {MOCK_MANAGERS.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2 pt-2 lg:pt-0">
        <Switch checked={hideCancelled} onCheckedChange={onHideCancelledChange} id="hide-cancelled" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Label htmlFor="hide-cancelled" className="text-sm cursor-pointer whitespace-nowrap" style={{ fontSize: 13 }}>
              <EyeOff className="inline h-3.5 w-3.5 mr-1" style={{ verticalAlign: "-2px" }} />
              {labels.hideCancelled.ru}
            </Label>
          </TooltipTrigger>
          <TooltipContent>{labels.hideCancelled.en}</TooltipContent>
        </Tooltip>
      </div>
    </>
  );

  return (
    <div className="mb-6">
      {/* Desktop: inline row */}
      <div className="hidden lg:flex items-center gap-3 flex-wrap">
        {filterControls}
      </div>

      {/* Mobile: button + sheet */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setFilterSheetOpen(true)}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            {labels.filters.ru}
            {activeFilterCount > 0 && (
              <Badge
                className="ml-1.5 h-5 min-w-5 px-1 text-xs"
                style={{ backgroundColor: "#FFDD2D", color: "#16181D" }}
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {/* Active filter chips */}
          {category !== "all" && (
            <Badge variant="secondary" className="text-xs">
              {category}
              <button className="ml-1" onClick={() => onCategoryChange("all")}><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="text-xs">
              {STATUS_CONFIG[statusFilter as PromoStatus]?.ru}
              <button className="ml-1" onClick={() => onStatusFilterChange("all")}><X className="h-3 w-3" /></button>
            </Badge>
          )}
        </div>
        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
          <SheetContent side="left" className="w-full sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>
                <BilingualLabel ru={labels.filters.ru} en={labels.filters.en} />
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              {filterControls}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SEARCH DIALOG — command palette
// ════════════════════════════════════════════════════════════

function SearchDialog({ open, onOpenChange }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { navigate, campaigns, managers } = useApp();

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={`${labels.search.ru} (${labels.search.en})`} />
      <CommandList>
        <CommandEmpty>Ничего не найдено / Nothing found</CommandEmpty>
        <CommandGroup heading="Навигация / Navigation">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={() => { navigate(item.id); onOpenChange(false); }}
            >
              <item.icon className="mr-2 h-4 w-4" style={{ color: "#6B7280" }} />
              <span>{item.ru}</span>
              <span className="ml-2" style={{ fontSize: 12, color: "#9CA3AF" }}>{item.en}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Акции / Campaigns">
          {campaigns.map((c) => (
            <CommandItem key={c.id} onSelect={() => onOpenChange(false)}>
              <Package className="mr-2 h-4 w-4" style={{ color: "#6B7280" }} />
              <span>{c.name}</span>
              <span className="ml-auto font-mono" style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "'IBM Plex Mono', monospace" }}>
                {c.id}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// ════════════════════════════════════════════════════════════
// TOP BAR — 56px, ink/near-black
// ════════════════════════════════════════════════════════════

function TopBar({ onMenuClick, searchOpen, onSearchOpen, calendarMode, onCalendarModeChange, versionDrawerOpen, onVersionDrawerOpen }: {
  onMenuClick: () => void;
  searchOpen: boolean;
  onSearchOpen: (v: boolean) => void;
  calendarMode: "month" | "quarter";
  onCalendarModeChange: (v: "month" | "quarter") => void;
  versionDrawerOpen: boolean;
  onVersionDrawerOpen: (v: boolean) => void;
}) {
  const { currentRole, setCurrentRole, navigate: appNavigate, notificationCount, openNotifications } = useApp();
  const role = ROLES.find((r) => r.id === currentRole);

  return (
    <header
      className="flex items-center h-14 px-4 gap-3 shrink-0 relative z-50"
      style={{ backgroundColor: "#16181D" }}
    >
      {/* Hamburger (mobile) */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        style={{ color: "rgba(255,255,255,0.8)" }}
        onClick={onMenuClick}
        title="Menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Brand */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="font-heading font-bold tracking-tight"
          style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, color: "#FFDD2D" }}
        >
          texnomart
        </span>
        <div className="hidden sm:block w-px h-5" style={{ backgroundColor: "#FFDD2D", opacity: 0.5 }} />
        <span
          className="hidden sm:inline font-heading font-semibold"
          style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, color: "rgba(255,255,255,0.9)" }}
        >
          {labels.app.ru}
        </span>
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex justify-center mx-4">
        {/* Desktop search trigger */}
        <button
          onClick={() => onSearchOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 h-9 rounded-md text-sm w-full max-w-md transition-colors"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span>{labels.search.ru}</span>
          <kbd
            className="ml-auto text-xs px-1.5 py-0.5 rounded font-mono"
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
            }}
          >
            Ctrl+K
          </kbd>
        </button>
        {/* Mobile search icon */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          style={{ color: "rgba(255,255,255,0.8)" }}
          onClick={() => onSearchOpen(true)}
          title={labels.search.en}
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Calendar mode toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
              style={{ color: "rgba(255,255,255,0.8)" }}
              title="Calendar mode"
            >
              <CalendarRange className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs" style={{ color: "#6B7280" }}>
              Режим календаря
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={calendarMode} onValueChange={(v) => onCalendarModeChange(v as "month" | "quarter")}>
              <DropdownMenuRadioItem value="month">
                {labels.calendarMode.month.ru}
                <span className="ml-1" style={{ fontSize: 11, color: "#9CA3AF" }}>{labels.calendarMode.month.en}</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="quarter">
                {labels.calendarMode.quarter.ru}
                <span className="ml-1" style={{ fontSize: 11, color: "#9CA3AF" }}>{labels.calendarMode.quarter.en}</span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Version history */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
              style={{ color: "rgba(255,255,255,0.8)" }}
              onClick={() => onVersionDrawerOpen(true)}
            >
              <History className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{labels.versionHistory.en}</TooltipContent>
        </Tooltip>

        {/* Notifications bell */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              style={{ color: "rgba(255,255,255,0.8)" }}
              onClick={openNotifications}
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: "#DC2626", fontSize: 10, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", padding: "0 4px", height: 18, minWidth: 18 }}
                >
                  {notificationCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{labels.notifications.en}</TooltipContent>
        </Tooltip>

        {/* User / Role menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 ml-1 px-2 py-1.5 rounded-md transition-colors hover:bg-white/10">
              <Avatar className="h-8 w-8" style={{ backgroundColor: "#FFDD2D" }}>
                <AvatarFallback
                  className="font-medium"
                  style={{ backgroundColor: "#FFDD2D", color: "#16181D", fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  {CURRENT_USER.initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.2 }}>
                  {CURRENT_USER.name}
                </span>
                <Badge
                  className="mt-0.5 text-xs h-5 px-1.5 font-medium"
                  style={{
                    backgroundColor: "rgba(255, 221, 45, 0.15)",
                    color: "#FFDD2D",
                    borderColor: "rgba(255, 221, 45, 0.3)",
                    border: "1px solid rgba(255, 221, 45, 0.3)",
                    fontSize: 10,
                  }}
                >
                  {role?.abbr}
                </Badge>
              </div>
              <ChevronDown className="h-4 w-4 hidden md:block" style={{ color: "rgba(255,255,255,0.5)" }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="font-medium" style={{ fontSize: 14 }}>{CURRENT_USER.name}</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>{role?.ru}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs" style={{ color: "#6B7280" }}>
              {labels.switchRole.ru}
              <span className="ml-1" style={{ fontSize: 11, color: "#9CA3AF" }}>/ {labels.switchRole.en}</span>
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={currentRole} onValueChange={setCurrentRole}>
              {ROLES.map((r) => (
                <DropdownMenuRadioItem key={r.id} value={r.id} className="cursor-pointer">
                  <div className="flex flex-col">
                    <span style={{ fontSize: 13 }}>{r.ru}</span>
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{r.en}</span>
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" style={{ color: "#DC2626" }}>
              <LogOut className="h-4 w-4 mr-2" />
              {labels.signOut.ru}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ════════════════════════════════════════════════════════════
// SIDEBAR CONTENT
// ════════════════════════════════════════════════════════════

function SidebarContent({ collapsed, onToggleCollapse, mobile = false }: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobile?: boolean;
}) {
  const { currentRole, activePage, navigate, notificationCount, openNotifications } = useApp();

  const accessibleItems = NAV_ITEMS.filter((item) => hasNavAccess(item.id, currentRole));

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#FFFFFF" }}>
      <ScrollArea className="flex-1 py-2">
        <nav className="flex flex-col gap-0.5 px-2">
          {accessibleItems.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;

            if (collapsed && !mobile) {
              return (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => item.id === "notifications" ? openNotifications() : navigate(item.id)}
                      className={cn(
                        "flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-colors relative",
                        isActive ? "" : "hover:bg-muted"
                      )}
                      style={isActive ? { backgroundColor: "rgba(255, 221, 45, 0.12)" } : undefined}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: isActive ? "#16181D" : "#6B7280" }}
                      />
                      {item.id === "notifications" && notificationCount > 0 && (
                        <span
                          className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: "#DC2626", fontSize: 9, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", padding: "0 3px", height: 16, minWidth: 16 }}
                        >
                          {notificationCount}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium">{item.ru}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{item.en}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => item.id === "notifications" ? openNotifications() : navigate(item.id)}
                className={cn(
                  "flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors w-full",
                  isActive ? "" : "hover:bg-muted"
                )}
                style={
                  isActive
                    ? { backgroundColor: "rgba(255, 221, 45, 0.12)", borderLeft: "3px solid #FFDD2D", paddingLeft: 9 }
                    : { borderLeft: "3px solid transparent", paddingLeft: 9 }
                }
                title={item.en}
              >
                <Icon
                  className="h-5 w-5 mt-0.5 shrink-0"
                  style={{ color: isActive ? "#16181D" : "#6B7280" }}
                />
                <div className="min-w-0">
                  <div
                    className="truncate"
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#16181D" : "#16181D",
                      lineHeight: 1.3,
                    }}
                  >
                    {item.ru}
                  </div>
                  <div className="truncate" style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.3 }}>
                    {item.en}
                  </div>
                </div>
                {item.id === "notifications" && notificationCount > 0 && (
                  <Badge
                    className="ml-auto shrink-0 h-5 min-w-5 px-1 text-xs font-medium"
                    style={{ backgroundColor: "#DC2626", color: "#fff", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {notificationCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Collapse toggle (desktop only) */}
      {!mobile && (
        <div className="border-t px-2 py-2" style={{ borderColor: "#E5E7EB" }}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapse}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full hover:bg-muted transition-colors"
                style={{ color: "#6B7280" }}
              >
                {collapsed ? (
                  <ChevronsRight className="h-4 w-4 mx-auto" />
                ) : (
                  <>
                    <ChevronsLeft className="h-4 w-4" />
                    <span style={{ fontSize: 13 }}>{labels.collapse.ru}</span>
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? labels.expand.en : labels.collapse.en}
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// BOTTOM NAV — phones (below md)
// ════════════════════════════════════════════════════════════

function BottomNav() {
  const { currentRole, activePage, navigate } = useApp();
  const accessibleItems = NAV_ITEMS.filter((item) => hasNavAccess(item.id, currentRole));
  const bottomItems = accessibleItems.slice(0, 4);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t"
      style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB", height: 56 }}
    >
      {bottomItems.map((item) => {
        const isActive = activePage === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 min-w-0"
            style={{ minHeight: 44 }}
          >
            <Icon
              className="h-5 w-5"
              style={{ color: isActive ? "#FFDD2D" : "#6B7280" }}
            />
            <span
              className="truncate w-full text-center px-1"
              style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#16181D" : "#6B7280",
              }}
            >
              {item.ru.split(" ")[0]}
            </span>
            {isActive && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                style={{ backgroundColor: "#FFDD2D" }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE HEADER — breadcrumb + bilingual title + actions
// ════════════════════════════════════════════════════════════

function PageHeader({ reasonDialogOpen, onReasonDialogOpen }: {
  reasonDialogOpen: boolean;
  onReasonDialogOpen: (v: boolean) => void;
}) {
  const { activePage, currentRole } = useApp();
  const navItem = NAV_ITEMS.find((item) => item.id === activePage);
  if (!navItem) return null;

  const canCreate = ["admin", "category_manager", "senior_category_manager"].includes(currentRole);

  return (
    <div className="px-6 pt-6 pb-4" style={{ backgroundColor: "#F4F5F7" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-3" style={{ fontSize: 12, color: "#6B7280" }}>
        <Home className="h-3.5 w-3.5" />
        <span>/</span>
        <span style={{ color: "#16181D", fontWeight: 500 }}>{navItem.ru}</span>
      </div>

      {/* Title + actions row */}
      <div className="flex items-start justify-between gap-4">
        <BilingualLabel ru={navItem.ru} en={navItem.en} size="page" />
        <div className="flex items-center gap-2 shrink-0">
          {(activePage === "short-calendar" || activePage === "full-calendar") && canCreate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="h-9 font-medium"
                  style={{ backgroundColor: "#FFDD2D", color: "#16181D", fontSize: 13 }}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Создать акцию</span>
                  <span className="sm:hidden">Создать</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create campaign</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE PLACEHOLDERS
// ════════════════════════════════════════════════════════════

const PAGE_ICONS: Record<string, React.ElementType> = {
  "short-calendar": CalendarDays,
  "full-calendar": Table2,
  approvals: CheckCircle2,
  "change-history": GitCompareArrows,
  reports: BarChart3,
  notifications: Bell,
  "audit-log": ScrollText,
  "promo-settings": Settings,
};

const PAGE_DESCRIPTIONS: Record<string, { ru: string; en: string }> = {
  "short-calendar": {
    ru: "Краткий план промо-календаря с ключевыми показателями и статусами акций",
    en: "Brief promo calendar with key metrics and campaign statuses",
  },
  "full-calendar": {
    ru: "Полная таблица с 39 колонками для детального ввода данных промо-акций",
    en: "Full 39-column data entry table for promo campaigns",
  },
  approvals: {
    ru: "Цепочка согласования: КМ → Старший КМ → Коммерческий директор",
    en: "Approval chain: CM → Senior CM → Commercial Director",
  },
  "change-history": {
    ru: "Версионность, корректировки после согласования, инкрементальная отправка, отмена",
    en: "Versioning, post-approval corrections, incremental sends, cancellation",
  },
  reports: {
    ru: "Автогенерируемые отчёты для маркетинга, закупа и аналитики",
    en: "Auto-generated reports for marketing, procurement, and analytics",
  },
  notifications: {
    ru: "Системные уведомления, изменения статусов и комментарии",
    en: "System notifications, status changes, and comments",
  },
  "audit-log": {
    ru: "Журнал всех действий пользователей с временными метками",
    en: "Full audit trail of user actions with timestamps",
  },
  "promo-settings": {
    ru: "Настройка типов промо-акций, правил и полей ввода",
    en: "Configure promo types, rules, and input fields",
  },
};

function PagePlaceholder({ pageId }: { pageId: string }) {
  const { campaigns } = useApp();
  const Icon = PAGE_ICONS[pageId] ?? Package;
  const desc = PAGE_DESCRIPTIONS[pageId];
  const navItem = NAV_ITEMS.find((n) => n.id === pageId);

  const statusCounts = pageId === "short-calendar"
    ? Object.entries(
        campaigns.reduce((acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
    : [];

  return (
    <Card className="border" style={{ borderColor: "#E5E7EB" }}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div
          className="flex items-center justify-center h-16 w-16 rounded-2xl mb-4"
          style={{ backgroundColor: "#F4F5F7" }}
        >
          <Icon className="h-8 w-8" style={{ color: "#9CA3AF" }} />
        </div>
        <h3
          className="font-heading mb-1"
          style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 600 }}
        >
          {navItem?.ru}
        </h3>
        <p style={{ fontSize: 12, color: "#9CA3AF", maxWidth: 360 }}>
          {desc?.en}
        </p>
        <p className="mt-2" style={{ fontSize: 13, color: "#6B7280", maxWidth: 420 }}>
          {desc?.ru}
        </p>

        {/* Mini stats for short calendar */}
        {pageId === "short-calendar" && statusCounts.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {statusCounts.map(([status, count]) => (
              <div key={status} className="flex items-center gap-1.5">
                <StatusBadge status={status as PromoStatus} />
                <span
                  className="font-mono"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 500 }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="mt-6 h-9"
          style={{ fontSize: 13 }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          {labels.startWork.ru}
        </Button>
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════

export default function App() {
  // ── State ──
  const [currentRole, setCurrentRole] = useState("category_manager");
  const [activePage, setActivePage] = useState("short-calendar");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [calendarMode, setCalendarMode] = useState<"month" | "quarter">("month");
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);

  // Filter state
  const [hideCancelled, setHideCancelled] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState("2026-06");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterManager, setFilterManager] = useState("all");

  // ── Navigation ──
  const navigate = (page: string) => {
    setActivePage(page);
    setMobileSidebarOpen(false);
  };

  // Reset page if role changes and current page is inaccessible
  useEffect(() => {
    if (!hasNavAccess(activePage, currentRole)) {
      const first = NAV_ITEMS.find((item) => hasNavAccess(item.id, currentRole));
      if (first) setActivePage(first.id);
    }
  }, [currentRole, activePage]);

  // Keyboard shortcut: Ctrl+K for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Context value ──
  const roleNotifications = notifications.filter(
    (n) => n.targetRoles.includes("all") || n.targetRoles.includes(currentRole),
  );
  const notificationCount = roleNotifications.filter((n) => !n.read).length;

  const handleAcknowledgeNotifications = (ids: string[]) => {
    setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));
  };

  const ctxValue: AppContextValue = {
    currentRole,
    activePage,
    sidebarCollapsed,
    campaigns: MOCK_CAMPAIGNS,
    managers: MOCK_MANAGERS,
    navigate,
    setCurrentRole,
    notificationCount,
    openNotifications: () => setNotificationSheetOpen(true),
  };

  return (
    <AppContext.Provider value={ctxValue}>
      <TooltipProvider delayDuration={200}>

        <div
          className="h-screen flex flex-col overflow-hidden"
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
        >
          {/* ── Top Bar ── */}
          <TopBar
            onMenuClick={() => setMobileSidebarOpen(true)}
            searchOpen={searchOpen}
            onSearchOpen={setSearchOpen}
            calendarMode={calendarMode}
            onCalendarModeChange={setCalendarMode}
            versionDrawerOpen={versionDrawerOpen}
            onVersionDrawerOpen={setVersionDrawerOpen}
          />

          <div className="flex flex-1 overflow-hidden">
            {/* ── Desktop Sidebar ── */}
            <aside
              className="hidden lg:flex flex-col border-r shrink-0 sidebar-transition"
              style={{
                width: sidebarCollapsed ? 64 : 240,
                borderColor: "#E5E7EB",
              }}
            >
              <SidebarContent
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
              />
            </aside>

            {/* ── Mobile Sidebar (Sheet) ── */}
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="px-4 pt-4 pb-2">
                  <SheetTitle>
                    <span style={{ fontFamily: "'Manrope', sans-serif", color: "#FFDD2D", fontWeight: 700 }}>
                      texnomart
                    </span>
                    <span className="ml-2" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, color: "#16181D" }}>
                      Promo
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <SidebarContent
                  collapsed={false}
                  onToggleCollapse={() => {}}
                  mobile
                />
              </SheetContent>
            </Sheet>

            {/* ── Main Content ── */}
            <main className="flex-1 overflow-auto pb-16 md:pb-0" style={{ backgroundColor: "#F4F5F7" }}>
              <PageHeader
                reasonDialogOpen={reasonDialogOpen}
                onReasonDialogOpen={setReasonDialogOpen}
              />
              <div className="px-6 pb-6">
                <FilterBar
                  hideCancelled={hideCancelled}
                  onHideCancelledChange={setHideCancelled}
                  period={filterPeriod}
                  onPeriodChange={setFilterPeriod}
                  category={filterCategory}
                  onCategoryChange={setFilterCategory}
                  statusFilter={filterStatus}
                  onStatusFilterChange={setFilterStatus}
                  manager={filterManager}
                  onManagerChange={setFilterManager}
                />
                {activePage === "short-calendar" ? (
                  <ShortCalendarPage
                    hideCancelled={hideCancelled}
                    filterPeriod={filterPeriod}
                    filterCategory={filterCategory}
                    filterStatus={filterStatus}
                    filterManager={filterManager}
                  />
                ) : activePage === "full-calendar" ? (
                  <FullCalendarPage
                    hideCancelled={hideCancelled}
                    filterPeriod={filterPeriod}
                    filterCategory={filterCategory}
                    filterStatus={filterStatus}
                    filterManager={filterManager}
                  />
                ) : activePage === "approvals" ? (
                  <ApprovalsPage />
                ) : activePage === "change-history" ? (
                  <ChangeManagementPage />
                ) : activePage === "reports" ? (
                  <ReportsPage />
                ) : activePage === "promo-settings" ? (
                  <PromoSettingsPage />
                ) : activePage === "audit-log" ? (
                  <AuditLogPage />
                ) : (
                  <PagePlaceholder pageId={activePage} />
                )}
              </div>
            </main>
          </div>

          {/* ── Mobile Bottom Nav ── */}
          <BottomNav />
        </div>

        {/* ── Overlays ── */}
        <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
        <ReasonDialog
          open={reasonDialogOpen}
          onOpenChange={setReasonDialogOpen}
          title="Отклонить акцию"
          description="Укажите причину отклонения. Это обязательное поле."
          confirmLabel="Отклонить"
          onConfirm={(reason) => console.log("Rejected with reason:", reason)}
        />
        <VersionHistoryDrawer
          open={versionDrawerOpen}
          onOpenChange={setVersionDrawerOpen}
          onNavigateToHistory={() => navigate("change-history")}
        />
        <NotificationCenter
          open={notificationSheetOpen}
          onOpenChange={setNotificationSheetOpen}
          notifications={notifications}
          currentRole={currentRole}
          onAcknowledge={handleAcknowledgeNotifications}
          onNavigate={navigate}
        />
      </TooltipProvider>
    </AppContext.Provider>
  );
}
