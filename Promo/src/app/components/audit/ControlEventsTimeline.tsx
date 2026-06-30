"use client";

import * as React from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { PromoStatusBadge } from "../../../components/PromoStatusBadge";
import { OverdueTag } from "../../../components/OverdueTag";
import { RuDate } from "../../../components/RuDate";
import {
  auditSummary,
  buildControlTimeline,
  getAuditCampaigns,
  type ControlMilestone,
} from "../../../lib/promo-mock-data";

function dotClass(m: ControlMilestone): string {
  if ((m.overdueDays ?? 0) > 0) return "bg-red-500 ring-red-100 dark:ring-red-500/20";
  if (m.state === "completed") return "bg-emerald-500 ring-emerald-100 dark:ring-emerald-500/20";
  if (m.state === "current") return "bg-amber-500 ring-amber-100 dark:ring-amber-500/20";
  return "bg-gray-300 ring-gray-100 dark:ring-gray-500/20";
}

function lineClass(reached: boolean): string {
  return reached ? "bg-emerald-200 dark:bg-emerald-900" : "bg-gray-200 dark:bg-gray-700";
}

export function ControlEventsTimeline() {
  const campaigns = React.useMemo(() => getAuditCampaigns(), []);
  const summary = React.useMemo(() => auditSummary(), []);
  const [campaignId, setCampaignId] = React.useState(
    () => campaigns.find((c) => c.id === "PR-2026-003")?.id ?? campaigns[0]?.id ?? ""
  );

  const campaign = campaigns.find((c) => c.id === campaignId);
  const milestones = React.useMemo(
    () => buildControlTimeline(campaignId),
    [campaignId]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Summary strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={<CalendarClock className="size-5 text-gray-400 dark:text-gray-500" />}
          label="Кампаний в своде"
          value={summary.campaignCount.toLocaleString("ru-RU")}
        />
        <SummaryCard
          icon={<AlertTriangle className="size-5 text-red-500" />}
          label="Просроченных событий"
          value={summary.overdueEvents.toLocaleString("ru-RU")}
          tone={summary.overdueEvents > 0 ? "danger" : "default"}
        />
        <SummaryCard
          icon={<Clock className="size-5 text-gray-400 dark:text-gray-500" />}
          label="Среднее время согласования"
          value={
            summary.avgApprovalWorkingDays === null
              ? "—"
              : `${summary.avgApprovalWorkingDays.toLocaleString("ru-RU")} раб. дн.`
          }
        />
      </div>

      {/* Campaign picker */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          Кампания
        </span>
        <Select value={campaignId} onValueChange={setCampaignId}>
          <SelectTrigger className="h-9 w-full max-w-md bg-white dark:bg-card text-sm">
            <SelectValue placeholder="Выберите кампанию" />
          </SelectTrigger>
          <SelectContent>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="font-mono text-xs text-gray-400 dark:text-gray-500">{c.id}</span>
                {"  "}
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {campaign && (
        <div className="rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card p-4 shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {campaign.name}
            </h3>
            <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
              {campaign.id}
            </span>
            <PromoStatusBadge status={campaign.status} className="ml-auto" />
          </div>

          {/* Horizontal timeline (md+) */}
          <div className="hidden md:block">
            <div className="flex items-start">
              {milestones.map((m, i) => {
                const isFirst = i === 0;
                const isLast = i === milestones.length - 1;
                const prevReached =
                  i > 0 && milestones[i - 1].state === "completed";
                const reached = m.state === "completed";
                const overdue = (m.overdueDays ?? 0) > 0;
                return (
                  <div
                    key={m.key}
                    className="flex min-w-0 flex-1 flex-col items-center"
                  >
                    <div className="relative flex h-4 w-full items-center justify-center">
                      {!isFirst && (
                        <span
                          className={cn(
                            "absolute left-0 top-1/2 h-0.5 w-1/2 -translate-y-1/2",
                            lineClass(prevReached)
                          )}
                        />
                      )}
                      {!isLast && (
                        <span
                          className={cn(
                            "absolute right-0 top-1/2 h-0.5 w-1/2 -translate-y-1/2",
                            lineClass(reached)
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          "relative z-10 size-3.5 rounded-full ring-4",
                          dotClass(m)
                        )}
                      />
                    </div>
                    <div className="mt-2 px-1.5 text-center">
                      <p
                        className={cn(
                          "text-xs font-medium leading-tight",
                          overdue ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-gray-100"
                        )}
                      >
                        {m.label}
                      </p>
                      {m.date && (
                        <p className="mt-0.5 text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
                          <RuDate value={m.date} />
                        </p>
                      )}
                      {overdue && (
                        <div className="mt-1 flex flex-col items-center gap-0.5">
                          <OverdueTag days={m.overdueDays!} />
                          {m.responsible && (
                            <span className="text-[10px] text-red-600 dark:text-red-400">
                              {m.responsible}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vertical timeline (mobile) */}
          <div className="md:hidden">
            {milestones.map((m, i) => {
              const isLast = i === milestones.length - 1;
              const overdue = (m.overdueDays ?? 0) > 0;
              return (
                <div key={m.key} className="relative flex gap-3 pb-5 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "mt-0.5 size-3.5 shrink-0 rounded-full ring-4",
                        dotClass(m)
                      )}
                    />
                    {!isLast && (
                      <span
                        className={cn(
                          "mt-1 w-0.5 flex-1",
                          lineClass(m.state === "completed")
                        )}
                      />
                    )}
                  </div>
                  <div className="-mt-0.5 flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          overdue ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-gray-100"
                        )}
                      >
                        {m.label}
                      </span>
                      {m.date && (
                        <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                          <RuDate value={m.date} />
                        </span>
                      )}
                      {overdue && <OverdueTag days={m.overdueDays!} />}
                    </div>
                    {overdue && m.responsible && (
                      <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                        Ответственный: {m.responsible}
                      </p>
                    )}
                    {m.note && (
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{m.note}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes legend (desktop — notes don't fit under horizontal nodes) */}
          {milestones.some((m) => m.note) && (
            <div className="mt-5 hidden flex-col gap-1.5 border-t border-gray-100 dark:border-border pt-4 md:flex">
              {milestones
                .filter((m) => m.note)
                .map((m) => (
                  <div
                    key={m.key}
                    className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400"
                  >
                    {(m.overdueDays ?? 0) > 0 ? (
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-gray-300 dark:text-gray-600" />
                    )}
                    <span>
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {m.label}:
                      </span>{" "}
                      {m.note}
                      {(m.overdueDays ?? 0) > 0 && m.responsible && (
                        <span className="text-red-600 dark:text-red-400">
                          {" "}
                          · {m.responsible}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-white dark:bg-card p-3.5 shadow-[0px_2px_4px_rgba(204,204,204,0.25)]",
        tone === "danger" ? "border-red-100 dark:border-red-500/20" : "border-gray-200 dark:border-border"
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-gray-50 dark:bg-muted/40">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-lg font-semibold tabular-nums",
            tone === "danger" ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-gray-100"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
