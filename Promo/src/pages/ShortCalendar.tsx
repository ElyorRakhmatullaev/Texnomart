import React, { useState, useMemo } from "react";
import { cn } from "@texnomart/ui/utils";
import { Badge } from "@texnomart/ui/badge";
import { Button } from "@texnomart/ui/button";
import { Card, CardContent } from "@texnomart/ui/card";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@texnomart/ui/sheet";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@texnomart/ui/tooltip";
import { ScrollArea } from "@texnomart/ui/scroll-area";
import { Separator } from "@texnomart/ui/separator";
import {
  Lock, Info, ChevronRight, ExternalLink, Clock,
  Send, Check, X as XIcon, ArrowRight,
  CircleDot, Circle, CheckCircle2, Users,
  Ban, CalendarClock, History, Pencil, GitCompareArrows,
} from "lucide-react";
import {
  type PromoCampaign,
  type KmPromoStatus,
  type CampaignKmAssignment,
  type CategoryManager,
  type CampaignStatus,
  type PlanStatus,
  type PromoStatus,
  KM_STATUS_CONFIG,
  CAMPAIGN_STATUS_CONFIG,
  PLAN_STATUS_CONFIG,
  MOCK_VERSION_HISTORY,
  BilingualLabel,
  OverdueTag,
  ReasonDialog,
  CancelCampaignDialog,
  DeadlineChangeDialog,
  useApp,
  formatDate,
  labels,
} from "../App";

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const CURRENT_DATE = new Date(2026, 5, 2);
const DAY_LABELS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function computeDeadline(startDateStr: string) {
  const [y, m, d] = startDateStr.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() - 21);
  const diffDays = Math.floor(
    (CURRENT_DATE.getTime() - deadline.getTime()) / 86400000
  );
  const dd = String(deadline.getDate()).padStart(2, "0");
  const mm = String(deadline.getMonth() + 1).padStart(2, "0");
  return {
    dateStr: `${dd}.${mm}.${deadline.getFullYear()}`,
    overdueDays: diffDays > 0 ? diffDays : 0,
  };
}

function computeCampaignStatus(campaign: PromoCampaign): CampaignStatus {
  if (campaign.status === "cancelled") return "campaign_cancelled";
  const assignments = campaign.kmAssignments || [];
  if (assignments.length === 0) return "campaign_correction";
  const sts = assignments.map((a) => a.status);

  const allResolved = sts.every(
    (s) => s === "km_approved_kd" || s === "km_not_participating"
  );
  if (allResolved) return "campaign_approved_sent";

  const anyPendingSenior = sts.some((s) => s === "km_pending_senior");
  const anyApprovedSenior = sts.some((s) => s === "km_approved_senior");
  if (anyPendingSenior || anyApprovedSenior) return "campaign_pending_senior";

  const anyPendingKd = sts.some((s) => s === "km_pending_kd");
  if (anyPendingKd) return "campaign_pending_kd";

  return "campaign_correction";
}

function computeAggregates(assignments: CampaignKmAssignment[]) {
  let pendingKd = 0,
    approvedKd = 0,
    notFilled = 0,
    notParticipating = 0;
  for (const a of assignments) {
    switch (a.status) {
      case "km_not_filled":
      case "km_pending_senior":
        notFilled++;
        break;
      case "km_approved_senior":
      case "km_pending_kd":
        pendingKd++;
        break;
      case "km_approved_kd":
        approvedKd++;
        break;
      case "km_not_participating":
        notParticipating++;
        break;
    }
  }
  return { pendingKd, approvedKd, notFilled, notParticipating };
}

function getDaysOfWeek(startStr: string, endStr: string): boolean[] {
  const days = [false, false, false, false, false, false, false];
  const [sy, sm, sd] = startStr.split("-").map(Number);
  const [ey, em, ed] = endStr.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  if (Math.floor((end.getTime() - start.getTime()) / 86400000) >= 6) {
    return [true, true, true, true, true, true, true];
  }
  const cursor = new Date(start);
  while (cursor <= end) {
    let dow = cursor.getDay();
    dow = dow === 0 ? 6 : dow - 1;
    days[dow] = true;
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function getKmName(kmId: string, managers: CategoryManager[]): string {
  return managers.find((m) => m.id === kmId)?.name || kmId;
}

function getKmInitials(kmId: string, managers: CategoryManager[]): string {
  return managers.find((m) => m.id === kmId)?.initials || "??";
}

// ═══════════════════════════════════════════════════════════
// STATUS BADGE VARIANTS
// ═══════════════════════════════════════════════════════════

function KmStatusBadge({ status }: { status: KmPromoStatus }) {
  const cfg = KM_STATUS_CONFIG[status];
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

function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const cfg = CAMPAIGN_STATUS_CONFIG[status];
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

function PlanStatusBadge({ status }: { status: PlanStatus }) {
  const cfg = PLAN_STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
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
  );
}

// ═══════════════════════════════════════════════════════════
// SMALL UI COMPONENTS
// ═══════════════════════════════════════════════════════════

function AggregatedChips({
  assignments,
}: {
  assignments: CampaignKmAssignment[];
}) {
  const agg = computeAggregates(assignments);
  const items = [
    {
      label: "На согл. КД",
      labelEn: "Pending com. dir.",
      count: agg.pendingKd,
      bg: "#FEF3C7",
      text: "#D97706",
      border: "#FDE68A",
    },
    {
      label: "Принято КД",
      labelEn: "Approved by com. dir.",
      count: agg.approvedKd,
      bg: "#DCFCE7",
      text: "#16A34A",
      border: "#BBF7D0",
    },
    {
      label: "Не заполн.",
      labelEn: "Not filled",
      count: agg.notFilled,
      bg: "#FEE2E2",
      text: "#DC2626",
      border: "#FECACA",
    },
    {
      label: "Не уч.",
      labelEn: "Not participating",
      count: agg.notParticipating,
      bg: "#F3F4F6",
      text: "#6B7280",
      border: "#E5E7EB",
    },
  ];
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {items.map((item) => (
        <Tooltip key={item.label}>
          <TooltipTrigger asChild>
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: item.bg,
                color: item.text,
                border: `1px solid ${item.border}`,
                fontFamily: "'IBM Plex Mono', monospace",
                fontVariantNumeric: "tabular-nums",
                fontSize: 11,
              }}
            >
              {item.count}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {item.label}
              <span
                style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 4 }}
              >
                {item.labelEn}
              </span>
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function DayStrip({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const activeDays = getDaysOfWeek(startDate, endDate);
  return (
    <div className="flex gap-0.5 mt-1">
      {DAY_LABELS_SHORT.map((label, i) => (
        <span
          key={label}
          className="inline-flex items-center justify-center rounded"
          style={{
            width: 22,
            height: 18,
            fontSize: 9,
            fontWeight: 500,
            backgroundColor: activeDays[i] ? "#FFDD2D" : "#F3F4F6",
            color: activeDays[i] ? "#16181D" : "#9CA3AF",
          }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function DeadlineCell({ startDate }: { startDate: string }) {
  const { dateStr, overdueDays } = computeDeadline(startDate);
  return (
    <div className="flex items-center gap-1">
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontVariantNumeric: "tabular-nums",
          fontSize: 13,
        }}
      >
        {dateStr}
      </span>
      {overdueDays > 0 && <OverdueTag days={overdueDays} />}
    </div>
  );
}

function DeadlineChip({
  label,
  days,
  unit,
}: {
  label: string;
  days: number;
  unit: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md"
          style={{
            backgroundColor: "#F4F5F7",
            border: "1px solid #E5E7EB",
            fontSize: 12,
          }}
        >
          <Clock className="h-3 w-3" style={{ color: "#6B7280" }} />
          <span style={{ fontWeight: 500 }}>{label}</span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 600,
              color: "#16181D",
            }}
          >
            {days} дн.
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          За {days} {unit} дней до начала акции
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

// ═══════════════════════════════════════════════════════════
// PLAN APPROVAL STEPPER
// ═══════════════════════════════════════════════════════════

const PLAN_STEPS = [
  {
    key: "dm",
    label: "Директор маркетинга",
    labelEn: "Marketing Director",
    action: "Создаёт план",
    statuses: ["plan_review", "plan_discussion"] as PlanStatus[],
    role: "marketing_director",
  },
  {
    key: "kd",
    label: "Коммерческий директор",
    labelEn: "Commercial Director",
    action: "Распределение + согласование",
    statuses: ["plan_pending_kd"] as PlanStatus[],
    role: "commercial_director",
  },
  {
    key: "od",
    label: "Операционный директор",
    labelEn: "Operational Director",
    action: "Финальное согласование",
    statuses: ["plan_pending_od"] as PlanStatus[],
    role: "operational_director",
  },
];

function PlanStepper({
  planStatus,
  currentRole,
  onSendForApproval,
  onApprove,
  onReject,
}: {
  planStatus: PlanStatus;
  currentRole: string;
  onSendForApproval: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isApproved = planStatus === "plan_approved";
  const isRejected = planStatus === "plan_rejected";

  const getStepState = (
    step: (typeof PLAN_STEPS)[0],
    index: number
  ): "completed" | "active" | "upcoming" => {
    if (isApproved) return "completed";
    if (isRejected) return "upcoming";
    if (step.statuses.includes(planStatus)) return "active";
    const currentIdx = PLAN_STEPS.findIndex((s) =>
      s.statuses.includes(planStatus)
    );
    if (currentIdx === -1) return "upcoming";
    return index < currentIdx ? "completed" : "upcoming";
  };

  return (
    <div
      className="rounded-lg p-4 mb-4"
      style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BilingualLabel
            ru="План акций"
            en="Promo plan"
            size="default"
          />
          <PlanStatusBadge status={planStatus} />
          {isApproved && (
            <Lock className="h-4 w-4" style={{ color: "#16A34A" }} />
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-start gap-0 flex-col md:flex-row md:items-center">
        {PLAN_STEPS.map((step, i) => {
          const state = getStepState(step, i);
          return (
            <React.Fragment key={step.key}>
              {i > 0 && (
                <div className="hidden md:flex items-center mx-1 shrink-0">
                  <ArrowRight
                    className="h-4 w-4"
                    style={{
                      color:
                        state === "completed" ? "#16A34A" : "#D1D5DB",
                    }}
                  />
                </div>
              )}
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg shrink-0",
                  i > 0 && "mt-2 md:mt-0"
                )}
                style={{
                  backgroundColor:
                    state === "active"
                      ? "rgba(255, 221, 45, 0.12)"
                      : state === "completed"
                        ? "rgba(22, 163, 74, 0.06)"
                        : "#F9FAFB",
                  border:
                    state === "active"
                      ? "1px solid rgba(255, 221, 45, 0.4)"
                      : "1px solid transparent",
                }}
              >
                {state === "completed" ? (
                  <CheckCircle2
                    className="h-5 w-5 shrink-0"
                    style={{ color: "#16A34A" }}
                  />
                ) : state === "active" ? (
                  <CircleDot
                    className="h-5 w-5 shrink-0"
                    style={{ color: "#D97706" }}
                  />
                ) : (
                  <Circle
                    className="h-5 w-5 shrink-0"
                    style={{ color: "#D1D5DB" }}
                  />
                )}
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: state === "active" ? 600 : 400,
                    }}
                  >
                    {step.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>
                    {step.action}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Deadline chips */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <DeadlineChip label="План → КМ" days={46} unit="календарных" />
        <DeadlineChip
          label="Заполнение КМ"
          days={21}
          unit="календарных"
        />
        <DeadlineChip
          label="Отправка отчёта"
          days={17}
          unit="календарных"
        />
      </div>

      {/* Role-gated actions */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {(planStatus === "plan_review" ||
          planStatus === "plan_discussion") &&
          currentRole === "marketing_director" && (
            <Button
              size="sm"
              className="h-8"
              style={{
                backgroundColor: "#FFDD2D",
                color: "#16181D",
                fontSize: 13,
              }}
              onClick={onSendForApproval}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Отправить на согласование
            </Button>
          )}
        {planStatus === "plan_pending_kd" &&
          currentRole === "commercial_director" && (
            <>
              <Button
                size="sm"
                className="h-8"
                style={{
                  backgroundColor: "#FFDD2D",
                  color: "#16181D",
                  fontSize: 13,
                }}
                onClick={onApprove}
              >
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Согласовать
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                style={{
                  fontSize: 13,
                  color: "#DC2626",
                  borderColor: "#FECACA",
                }}
                onClick={onReject}
              >
                <XIcon className="h-3.5 w-3.5 mr-1.5" />
                Отклонить
              </Button>
            </>
          )}
        {planStatus === "plan_pending_od" &&
          currentRole === "operational_director" && (
            <>
              <Button
                size="sm"
                className="h-8"
                style={{
                  backgroundColor: "#FFDD2D",
                  color: "#16181D",
                  fontSize: 13,
                }}
                onClick={onApprove}
              >
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Согласовать
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                style={{
                  fontSize: 13,
                  color: "#DC2626",
                  borderColor: "#FECACA",
                }}
                onClick={onReject}
              >
                <XIcon className="h-3.5 w-3.5 mr-1.5" />
                Отклонить
              </Button>
            </>
          )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CAMPAIGN DETAIL SHEET
// ═══════════════════════════════════════════════════════════

function CampaignDetailSheet({
  campaign,
  open,
  onOpenChange,
  onCancelCampaign,
  onChangeDeadline,
}: {
  campaign: PromoCampaign | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCancelCampaign?: (c: PromoCampaign) => void;
  onChangeDeadline?: (c: PromoCampaign) => void;
}) {
  const { managers, navigate, currentRole } = useApp();
  if (!campaign) return null;

  const { dateStr: deadlineStr, overdueDays } = computeDeadline(
    campaign.startDate
  );
  const cStatus = computeCampaignStatus(campaign);
  const assignments = campaign.kmAssignments || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    color: "#6B7280",
                    marginBottom: 4,
                  }}
                >
                  {campaign.id}
                </div>
                <div
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  {campaign.name}
                </div>
              </div>
              <CampaignStatusBadge status={cStatus} />
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 pb-6 space-y-5">
            {/* Period + Deadline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6B7280",
                    marginBottom: 4,
                  }}
                >
                  Период акции
                </div>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: 13,
                  }}
                >
                  {formatDate(campaign.startDate)} —{" "}
                  {formatDate(campaign.endDate)}
                </div>
                <DayStrip
                  startDate={campaign.startDate}
                  endDate={campaign.endDate}
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6B7280",
                    marginBottom: 4,
                  }}
                >
                  Крайний срок КМ
                </div>
                <DeadlineCell startDate={campaign.startDate} />
              </div>
            </div>

            <Separator style={{ backgroundColor: "#E5E7EB" }} />

            {/* Per-KM breakdown */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Статус по КМ
                <span
                  style={{
                    fontSize: 11,
                    color: "#9CA3AF",
                    marginLeft: 8,
                  }}
                >
                  Status by CM
                </span>
              </div>
              <div className="space-y-2">
                {assignments.map((assignment) => {
                  const km = managers.find(
                    (m) => m.id === assignment.kmId
                  );
                  return (
                    <div
                      key={assignment.kmId}
                      className="flex items-center justify-between p-2.5 rounded-lg"
                      style={{ backgroundColor: "#F9FAFB" }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="flex items-center justify-center h-7 w-7 rounded-full shrink-0"
                          style={{
                            backgroundColor: "#FFDD2D",
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          {km?.initials || "??"}
                        </div>
                        <div className="min-w-0">
                          <div
                            className="truncate"
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          >
                            {km?.name || assignment.kmId}
                          </div>
                          <div
                            className="truncate"
                            style={{
                              fontSize: 11,
                              color: "#6B7280",
                            }}
                          >
                            {assignment.category}
                          </div>
                        </div>
                      </div>
                      <KmStatusBadge status={assignment.status} />
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator style={{ backgroundColor: "#E5E7EB" }} />

            {/* Aggregated indicators */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Сводные показатели
                <span
                  style={{
                    fontSize: 11,
                    color: "#9CA3AF",
                    marginLeft: 8,
                  }}
                >
                  Summary indicators
                </span>
              </div>
              <AggregatedChips assignments={assignments} />
            </div>

            <Separator style={{ backgroundColor: "#E5E7EB" }} />

            {/* Version info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCompareArrows className="h-4 w-4" style={{ color: "#6B7280" }} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>Версия</span>
                <Badge variant="outline" className="text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>
                  v{campaign.version}
                </Badge>
                {MOCK_VERSION_HISTORY[campaign.id] && (
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                    ({MOCK_VERSION_HISTORY[campaign.id].length} версий)
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                style={{ fontSize: 11 }}
                onClick={() => { onOpenChange(false); navigate("change-history"); }}
              >
                <History className="h-3 w-3 mr-1" />
                История
              </Button>
            </div>

            <Separator style={{ backgroundColor: "#E5E7EB" }} />

            {/* Actions: cancel campaign, change deadline */}
            <div className="space-y-2">
              {currentRole === "commercial_director" && campaign.status !== "cancelled" && (
                <>
                  <Button
                    variant="outline"
                    className="w-full h-9 justify-start"
                    style={{ fontSize: 12, color: "#DC2626", borderColor: "#FECACA" }}
                    onClick={() => {
                      if (onCancelCampaign) onCancelCampaign(campaign);
                    }}
                  >
                    <Ban className="h-3.5 w-3.5 mr-2" />
                    Отменить акцию
                    <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: "auto" }}>Cancel campaign</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-9 justify-start"
                    style={{ fontSize: 12, color: "#D97706", borderColor: "#FDE68A" }}
                    onClick={() => {
                      if (onChangeDeadline) onChangeDeadline(campaign);
                    }}
                  >
                    <CalendarClock className="h-3.5 w-3.5 mr-2" />
                    Изменить дедлайн
                    <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: "auto" }}>Change deadline</span>
                  </Button>
                </>
              )}
            </div>

            <Separator style={{ backgroundColor: "#E5E7EB" }} />

            {/* Link to full calendar */}
            <Button
              variant="outline"
              className="w-full h-10"
              style={{ fontSize: 13 }}
              onClick={() => {
                onOpenChange(false);
                navigate("full-calendar");
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Открыть в полном промо-календаре
              <span
                style={{
                  fontSize: 11,
                  color: "#9CA3AF",
                  marginLeft: 4,
                }}
              >
                Open in full calendar
              </span>
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ═══════════════════════════════════════════════════════════
// DESKTOP TABLE
// ═══════════════════════════════════════════════════════════

function ShortCalendarTable({
  campaigns,
  allKmIds,
  managers,
  onRowClick,
  planApproved,
}: {
  campaigns: PromoCampaign[];
  allKmIds: string[];
  managers: CategoryManager[];
  onRowClick: (c: PromoCampaign) => void;
  planApproved: boolean;
}) {
  const headerBg = "#F9FAFB";
  const stickyBg = "#FFFFFF";
  const hStyle = {
    fontSize: 12,
    fontWeight: 600 as const,
    color: "#6B7280",
    borderBottom: "1px solid #E5E7EB",
  };

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" }}
    >
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          style={{ minWidth: 900 + allKmIds.length * 140 }}
        >
          <thead>
            <tr style={{ backgroundColor: headerBg }}>
              {/* Frozen: № промо */}
              <th
                className="text-left px-3 py-2.5 whitespace-nowrap"
                style={{
                  ...hStyle,
                  position: "sticky",
                  left: 0,
                  zIndex: 20,
                  backgroundColor: headerBg,
                  width: 100,
                }}
              >
                № промо
              </th>
              {/* Frozen: Тип */}
              <th
                className="text-left px-3 py-2.5 whitespace-nowrap"
                style={{
                  ...hStyle,
                  position: "sticky",
                  left: 100,
                  zIndex: 20,
                  backgroundColor: headerBg,
                  width: 60,
                }}
              >
                Тип
              </th>
              {/* Frozen: Название */}
              <th
                className="text-left px-3 py-2.5"
                style={{
                  ...hStyle,
                  position: "sticky",
                  left: 160,
                  zIndex: 20,
                  backgroundColor: headerBg,
                  width: 200,
                  minWidth: 200,
                  boxShadow: "2px 0 4px rgba(0,0,0,0.06)",
                }}
              >
                Название акции
                {planApproved && (
                  <Lock
                    className="inline h-3 w-3 ml-1"
                    style={{ color: "#16A34A", verticalAlign: "-1px" }}
                  />
                )}
              </th>
              {/* Period */}
              <th
                className="text-left px-3 py-2.5 whitespace-nowrap"
                style={{ ...hStyle, minWidth: 180 }}
              >
                Период акции
              </th>
              {/* Deadline */}
              <th
                className="text-left px-3 py-2.5 whitespace-nowrap"
                style={{ ...hStyle, minWidth: 140 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>Крайний срок КМ</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Автоматически: 21 календарный день до начала акции
                    </p>
                  </TooltipContent>
                </Tooltip>
              </th>
              {/* Per-KM columns */}
              {allKmIds.map((kmId) => (
                <th
                  key={kmId}
                  className="text-center px-2 py-2.5 whitespace-nowrap"
                  style={{ ...hStyle, minWidth: 130 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>{getKmInitials(kmId, managers)}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getKmName(kmId, managers)}</p>
                    </TooltipContent>
                  </Tooltip>
                </th>
              ))}
              {/* Aggregated */}
              <th
                className="text-center px-2 py-2.5"
                style={{ ...hStyle, minWidth: 110 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>Показатели</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Aggregated indicators</p>
                  </TooltipContent>
                </Tooltip>
              </th>
              {/* Campaign status */}
              <th
                className="text-center px-3 py-2.5 whitespace-nowrap"
                style={{ ...hStyle, minWidth: 160 }}
              >
                Статус акции
              </th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 && (
              <tr>
                <td
                  colSpan={6 + allKmIds.length}
                  className="text-center py-12"
                  style={{ color: "#9CA3AF", fontSize: 14 }}
                >
                  Нет акций для отображения
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    No campaigns to display
                  </div>
                </td>
              </tr>
            )}
            {campaigns.map((campaign) => {
              const cStatus = computeCampaignStatus(campaign);
              const isCancelled = cStatus === "campaign_cancelled";
              const assignments = campaign.kmAssignments || [];

              return (
                <tr
                  key={campaign.id}
                  className="row-hover cursor-pointer"
                  onClick={() => onRowClick(campaign)}
                  style={{
                    backgroundColor: isCancelled
                      ? "rgba(220, 38, 38, 0.04)"
                      : undefined,
                  }}
                >
                  {/* Frozen: № промо */}
                  <td
                    className="px-3 py-2.5"
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 10,
                      backgroundColor: isCancelled
                        ? "#FEF2F2"
                        : stickyBg,
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontVariantNumeric: "tabular-nums",
                      fontSize: 12,
                      borderBottom: "1px solid #F3F4F6",
                    }}
                  >
                    {campaign.id.replace("PROMO-2026-", "")}
                  </td>
                  {/* Frozen: Тип */}
                  <td
                    className="px-3 py-2.5"
                    style={{
                      position: "sticky",
                      left: 100,
                      zIndex: 10,
                      backgroundColor: isCancelled
                        ? "#FEF2F2"
                        : stickyBg,
                      fontSize: 12,
                      borderBottom: "1px solid #F3F4F6",
                    }}
                  >
                    <Badge
                      variant="outline"
                      className="text-xs px-1.5 py-0"
                      style={{ fontSize: 10, fontWeight: 500 }}
                    >
                      ПЛ
                    </Badge>
                  </td>
                  {/* Frozen: Название */}
                  <td
                    className="px-3 py-2.5"
                    style={{
                      position: "sticky",
                      left: 160,
                      zIndex: 10,
                      backgroundColor: isCancelled
                        ? "#FEF2F2"
                        : stickyBg,
                      fontSize: 13,
                      fontWeight: 500,
                      maxWidth: 200,
                      boxShadow: "2px 0 4px rgba(0,0,0,0.06)",
                      textDecoration: isCancelled
                        ? "line-through"
                        : undefined,
                      color: isCancelled ? "#DC2626" : "#16181D",
                      borderBottom: "1px solid #F3F4F6",
                    }}
                  >
                    <div className="truncate">{campaign.name}</div>
                  </td>
                  {/* Period */}
                  <td
                    className="px-3 py-2.5"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontVariantNumeric: "tabular-nums",
                        fontSize: 12,
                      }}
                    >
                      {formatDate(campaign.startDate)} —{" "}
                      {formatDate(campaign.endDate)}
                    </div>
                    <DayStrip
                      startDate={campaign.startDate}
                      endDate={campaign.endDate}
                    />
                  </td>
                  {/* Deadline */}
                  <td
                    className="px-3 py-2.5"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <DeadlineCell startDate={campaign.startDate} />
                  </td>
                  {/* Per-KM status cells */}
                  {allKmIds.map((kmId) => {
                    const assignment = assignments.find(
                      (a) => a.kmId === kmId
                    );
                    return (
                      <td
                        key={kmId}
                        className="px-2 py-2.5 text-center"
                        style={{
                          borderBottom: "1px solid #F3F4F6",
                        }}
                      >
                        {assignment ? (
                          <KmStatusBadge status={assignment.status} />
                        ) : (
                          <span
                            style={{
                              fontSize: 12,
                              color: "#D1D5DB",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                  {/* Aggregated */}
                  <td
                    className="px-2 py-2.5 text-center"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <AggregatedChips assignments={assignments} />
                  </td>
                  {/* Campaign status */}
                  <td
                    className="px-3 py-2.5 text-center"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <CampaignStatusBadge status={cStatus} />
                      <Badge variant="outline" className="text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#9CA3AF", borderColor: "#E5E7EB" }}>
                        v{campaign.version}
                      </Badge>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MOBILE CARDS (Mode B)
// ═══════════════════════════════════════════════════════════

function ShortCalendarCards({
  campaigns,
  managers,
  onCardClick,
}: {
  campaigns: PromoCampaign[];
  managers: CategoryManager[];
  onCardClick: (c: PromoCampaign) => void;
}) {
  if (campaigns.length === 0) {
    return (
      <div
        className="text-center py-12"
        style={{ color: "#9CA3AF", fontSize: 14 }}
      >
        Нет акций для отображения
        <div style={{ fontSize: 12, marginTop: 4 }}>
          No campaigns to display
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => {
        const cStatus = computeCampaignStatus(campaign);
        const isCancelled = cStatus === "campaign_cancelled";
        const assignments = campaign.kmAssignments || [];
        const agg = computeAggregates(assignments);
        const { overdueDays } = computeDeadline(campaign.startDate);

        const summaryParts: string[] = [];
        if (agg.approvedKd > 0)
          summaryParts.push(`${agg.approvedKd} принято`);
        if (agg.pendingKd > 0)
          summaryParts.push(`${agg.pendingKd} на согл.`);
        if (agg.notFilled > 0)
          summaryParts.push(`${agg.notFilled} не заполн.`);
        if (agg.notParticipating > 0)
          summaryParts.push(`${agg.notParticipating} не уч.`);

        return (
          <Card
            key={campaign.id}
            className="cursor-pointer transition-colors"
            style={{
              borderColor: isCancelled ? "#FECACA" : "#E5E7EB",
              backgroundColor: isCancelled
                ? "rgba(220, 38, 38, 0.03)"
                : "#FFFFFF",
            }}
            onClick={() => onCardClick(campaign)}
          >
            <CardContent className="p-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 11,
                      color: "#6B7280",
                    }}
                  >
                    {campaign.id}
                  </div>
                  <div
                    className="mt-0.5"
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      textDecoration: isCancelled
                        ? "line-through"
                        : undefined,
                      color: isCancelled ? "#DC2626" : "#16181D",
                    }}
                  >
                    {campaign.name}
                  </div>
                </div>
                <CampaignStatusBadge status={cStatus} />
              </div>

              {/* Period */}
              <div
                className="mb-2"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: 12,
                  color: "#6B7280",
                }}
              >
                {formatDate(campaign.startDate)} —{" "}
                {formatDate(campaign.endDate)}
              </div>

              {/* Deadline */}
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: 12, color: "#6B7280" }}>
                  Срок:
                </span>
                <DeadlineCell startDate={campaign.startDate} />
              </div>

              {/* Aggregated chips */}
              <AggregatedChips assignments={assignments} />

              {/* KM summary */}
              {summaryParts.length > 0 && (
                <div
                  className="mt-2 pt-2"
                  style={{
                    borderTop: "1px solid #F3F4F6",
                    fontSize: 12,
                    color: "#6B7280",
                  }}
                >
                  <Users
                    className="inline h-3.5 w-3.5 mr-1"
                    style={{ verticalAlign: "-2px" }}
                  />
                  Готовность КМ: {summaryParts.join(" · ")}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════

interface ShortCalendarPageProps {
  hideCancelled: boolean;
  filterPeriod: string;
  filterCategory: string;
  filterStatus: string;
  filterManager: string;
}

export default function ShortCalendarPage({
  hideCancelled,
  filterPeriod,
  filterCategory,
  filterStatus,
  filterManager,
}: ShortCalendarPageProps) {
  const { campaigns, managers, currentRole } = useApp();

  const [selectedCampaign, setSelectedCampaign] =
    useState<PromoCampaign | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [planStatus, setPlanStatus] = useState<PlanStatus>("plan_pending_kd");
  const [mode, setMode] = useState<"table" | "plan">("table");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [cancelCampaignDialogOpen, setCancelCampaignDialogOpen] = useState(false);
  const [cancelCampaignTarget, setCancelCampaignTarget] = useState<PromoCampaign | null>(null);
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false);
  const [deadlineTarget, setDeadlineTarget] = useState<PromoCampaign | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredCampaigns = useMemo(() => {
    let result = campaigns.filter((c) => c.type === "planned");

    if (hideCancelled) {
      result = result.filter((c) => c.status !== "cancelled");
    }
    if (filterCategory !== "all") {
      result = result.filter((c) => c.category === filterCategory);
    }
    if (filterStatus !== "all") {
      result = result.filter((c) => c.status === filterStatus);
    }
    if (filterManager !== "all") {
      result = result.filter(
        (c) =>
          c.managerId === filterManager ||
          (c.kmAssignments || []).some((a) => a.kmId === filterManager)
      );
    }
    if (filterPeriod) {
      const [fy, fm] = filterPeriod.split("-").map(Number);
      const monthStart = new Date(fy, fm - 1, 1);
      const monthEnd = new Date(fy, fm, 0);
      result = result.filter((c) => {
        const [sy, sm, sd] = c.startDate.split("-").map(Number);
        const [ey, em, ed] = c.endDate.split("-").map(Number);
        const cStart = new Date(sy, sm - 1, sd);
        const cEnd = new Date(ey, em - 1, ed);
        return cStart <= monthEnd && cEnd >= monthStart;
      });
    }

    return result;
  }, [
    campaigns,
    hideCancelled,
    filterCategory,
    filterStatus,
    filterManager,
    filterPeriod,
  ]);

  const allKmIds = useMemo(() => {
    const set = new Set<string>();
    for (const c of filteredCampaigns) {
      for (const a of c.kmAssignments || []) {
        set.add(a.kmId);
      }
    }
    return Array.from(set);
  }, [filteredCampaigns]);

  const planApproved = planStatus === "plan_approved";

  const showPlanControls =
    currentRole === "marketing_director" ||
    currentRole === "commercial_director" ||
    currentRole === "operational_director" ||
    currentRole === "admin";

  const handleRowClick = (c: PromoCampaign) => {
    setSelectedCampaign(c);
    setDetailOpen(true);
  };

  const handleSendForApproval = () => {
    if (
      planStatus === "plan_review" ||
      planStatus === "plan_discussion"
    ) {
      setPlanStatus("plan_pending_kd");
    }
  };

  const handleApprove = () => {
    if (planStatus === "plan_pending_kd") setPlanStatus("plan_pending_od");
    else if (planStatus === "plan_pending_od")
      setPlanStatus("plan_approved");
  };

  const handleReject = (_reason: string) => {
    setPlanStatus("plan_rejected");
  };

  return (
    <div>
      {/* Info + mode toggle */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs"
              style={{
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                border: "1px solid #BFDBFE",
              }}
            >
              <Info className="h-3.5 w-3.5" />
              Только плановые акции
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>
              Внеплановые промо-акции отображаются и ведутся только в
              полном промо-календаре
            </p>
            <p
              style={{
                color: "#9CA3AF",
                fontSize: 11,
                marginTop: 4,
              }}
            >
              Unplanned campaigns are shown only in the full promo
              calendar
            </p>
          </TooltipContent>
        </Tooltip>

        {showPlanControls && (
          <div
            className="inline-flex rounded-md overflow-hidden"
            style={{ border: "1px solid #E5E7EB" }}
          >
            <button
              className="px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor:
                  mode === "table" ? "#FFDD2D" : "#FFFFFF",
                color: "#16181D",
              }}
              onClick={() => setMode("table")}
            >
              Таблица
            </button>
            <button
              className="px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor:
                  mode === "plan" ? "#FFDD2D" : "#FFFFFF",
                color: "#16181D",
                borderLeft: "1px solid #E5E7EB",
              }}
              onClick={() => setMode("plan")}
            >
              План акций
            </button>
          </div>
        )}

        <div className="ml-auto" style={{ fontSize: 12, color: "#6B7280" }}>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 500,
            }}
          >
            {filteredCampaigns.length}
          </span>{" "}
          акций
        </div>
      </div>

      {/* Plan stepper */}
      {showPlanControls && mode === "plan" && (
        <PlanStepper
          planStatus={planStatus}
          currentRole={currentRole}
          onSendForApproval={handleSendForApproval}
          onApprove={handleApprove}
          onReject={() => setRejectDialogOpen(true)}
        />
      )}

      {/* Desktop table */}
      <div className="hidden md:block">
        <ShortCalendarTable
          campaigns={filteredCampaigns}
          allKmIds={allKmIds}
          managers={managers}
          onRowClick={handleRowClick}
          planApproved={planApproved}
        />
      </div>

      {/* Mobile cards */}
      <div className="md:hidden">
        <ShortCalendarCards
          campaigns={filteredCampaigns}
          managers={managers}
          onCardClick={handleRowClick}
        />
      </div>

      {/* Campaign detail sheet */}
      <CampaignDetailSheet
        campaign={selectedCampaign}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onCancelCampaign={(c) => { setDetailOpen(false); setCancelCampaignTarget(c); setCancelCampaignDialogOpen(true); }}
        onChangeDeadline={(c) => { setDetailOpen(false); setDeadlineTarget(c); setDeadlineDialogOpen(true); }}
      />

      {/* Reject reason dialog */}
      <ReasonDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        title="Отклонить план"
        description="Укажите причину отклонения плана акций."
        confirmLabel="Отклонить"
        onConfirm={handleReject}
        variant="destructive"
      />

      {/* Cancel campaign dialog */}
      <CancelCampaignDialog
        open={cancelCampaignDialogOpen}
        onOpenChange={setCancelCampaignDialogOpen}
        campaignName={cancelCampaignTarget?.name || ""}
        onConfirm={(reason) => {
          setCancelCampaignDialogOpen(false);
          setCancelCampaignTarget(null);
          setToastMessage("Акция отменена. Уведомление отправлено во все отделы.");
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      {/* Deadline change dialog */}
      <DeadlineChangeDialog
        open={deadlineDialogOpen}
        onOpenChange={setDeadlineDialogOpen}
        currentDeadline={deadlineTarget ? formatDate(deadlineTarget.startDate) : ""}
        onConfirm={(reason, newDeadline) => {
          setDeadlineDialogOpen(false);
          setDeadlineTarget(null);
          setToastMessage("Запрос на изменение дедлайна отправлен на утверждение.");
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      {/* Toast notification */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg"
          style={{ backgroundColor: "#16181D", color: "#FFFFFF", fontSize: 13, maxWidth: 420 }}
        >
          <Check className="h-4 w-4 shrink-0" style={{ color: "#FFDD2D" }} />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
