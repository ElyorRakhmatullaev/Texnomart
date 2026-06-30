"use client";

import { Check, Clock, TriangleAlert } from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import {
  getPlanApproval,
  PLAN_DIRECTOR_SLA_WORKING_DAYS,
  PLAN_MARKETING_REVIEW_LEAD_DAYS,
  PLAN_MARKETING_SUBMIT_LEAD_DAYS,
  type PlanStageDirector,
  type PlanStageMarketing,
  type PlanStageStatus,
} from "../../../lib/promo-mock-data";

// Per-campaign plan approval (client feedback §5): for each plan row, the approval
// progress is shown separately across the three directors — when the stage was sent /
// decided, whether «В срок» or «Просрочка +N дн.», or «Ожидает этапа» when not reached.

export interface PlanRowData {
  id: string;
  type: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

function formatDateTime(d: Date): string {
  return (
    d.toLocaleDateString("ru-RU") +
    " " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("ru-RU");
}

function StageStatusBadge({
  status,
  overdueDays,
}: {
  status: PlanStageStatus;
  overdueDays?: number;
}) {
  if (status === "waiting") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-muted dark:text-gray-400">
        <Clock className="size-3" />
        Ожидает этапа
      </span>
    );
  }
  if (status === "onTime") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        <Check className="size-3" />В срок
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">
      <TriangleAlert className="size-3" />
      Просрочка +{overdueDays ?? 0} дн.
    </span>
  );
}

function MarketingCell({ stage }: { stage?: PlanStageMarketing }) {
  if (!stage) return <Dash />;
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs tabular-nums text-gray-700 dark:text-gray-200">
        <span className="text-muted-foreground">Озн.:</span>{" "}
        {formatDateTime(stage.reviewedAt)}
      </div>
      <div className="text-xs tabular-nums text-gray-700 dark:text-gray-200">
        <span className="text-muted-foreground">Отпр.:</span>{" "}
        {formatDateTime(stage.sentAt)}
      </div>
      <StageStatusBadge status={stage.status} overdueDays={stage.overdueDays} />
    </div>
  );
}

function DirectorCell({ stage }: { stage?: PlanStageDirector }) {
  if (!stage) return <Dash />;
  return (
    <div className="flex flex-col gap-1">
      {stage.decidedAt && (
        <div className="text-xs tabular-nums text-gray-700 dark:text-gray-200">
          {formatDateTime(stage.decidedAt)}
        </div>
      )}
      <StageStatusBadge status={stage.status} overdueDays={stage.overdueDays} />
    </div>
  );
}

function Dash() {
  return <span className="text-xs text-muted-foreground">—</span>;
}

function StageHeader({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">{title}</span>
      <span className="text-[10px] font-normal leading-tight text-muted-foreground">
        {note}
      </span>
    </div>
  );
}

const HEAD =
  "px-3 py-2 text-left align-bottom border-b bg-gray-50 text-[13px] font-semibold text-gray-700 dark:bg-muted/40 dark:text-gray-200";
const CELL = "px-3 py-3 align-top border-b border-gray-100 dark:border-border";

export function PlanApprovalTable({ rows }: { rows: PlanRowData[] }) {
  const marketingNote = `ознакомление: за ${PLAN_MARKETING_REVIEW_LEAD_DAYS} кал. дн · отправка на согл.: за ${PLAN_MARKETING_SUBMIT_LEAD_DAYS} кал. дн`;
  const directorNote = `согласование: ${PLAN_DIRECTOR_SLA_WORKING_DAYS} раб. дн`;

  return (
    <>
      {/* Desktop: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1040px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className={cn(HEAD, "w-[120px]")}>Код акции</th>
              <th className={cn(HEAD, "w-[130px]")}>Тип акции</th>
              <th className={cn(HEAD, "min-w-[200px]")}>Наименование акции</th>
              <th className={cn(HEAD, "w-[180px]")}>Период действия</th>
              <th className={cn(HEAD, "w-[200px]")}>
                <StageHeader title="Директор маркетинга" note={marketingNote} />
              </th>
              <th className={cn(HEAD, "w-[170px]")}>
                <StageHeader title="Коммерческий директор" note={directorNote} />
              </th>
              <th className={cn(HEAD, "w-[170px]")}>
                <StageHeader title="Операционный директор" note={directorNote} />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const appr = getPlanApproval(r.id);
              return (
                <tr key={r.id} className="hover:bg-gray-50/60 dark:hover:bg-accent">
                  <td
                    className={cn(
                      CELL,
                      "text-xs font-medium tabular-nums text-muted-foreground"
                    )}
                  >
                    {r.id}
                  </td>
                  <td className={cn(CELL, "text-gray-600 dark:text-gray-300")}>{r.type}</td>
                  <td className={cn(CELL, "font-medium text-gray-900 dark:text-gray-100")}>
                    {r.name}
                  </td>
                  <td className={cn(CELL, "tabular-nums text-gray-700 dark:text-gray-200")}>
                    {formatDate(r.startDate)} — {formatDate(r.endDate)}
                  </td>
                  <td className={CELL}>
                    <MarketingCell stage={appr?.marketing} />
                  </td>
                  <td className={CELL}>
                    <DirectorCell stage={appr?.kd} />
                  </td>
                  <td className={CELL}>
                    <DirectorCell stage={appr?.od} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 p-4 md:hidden">
        {rows.map((r) => {
          const appr = getPlanApproval(r.id);
          return (
            <div key={r.id} className="rounded-lg border bg-white p-3 dark:bg-card">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {r.id}
                </span>
                <span className="text-xs text-muted-foreground">{r.type}</span>
              </div>
              <div className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">{r.name}</div>
              <div className="text-xs tabular-nums text-muted-foreground">
                {formatDate(r.startDate)} — {formatDate(r.endDate)}
              </div>
              <dl className="mt-3 space-y-2 border-t pt-3">
                <div>
                  <dt className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Директор маркетинга
                  </dt>
                  <dd className="mt-1">
                    <MarketingCell stage={appr?.marketing} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Коммерческий директор
                  </dt>
                  <dd className="mt-1">
                    <DirectorCell stage={appr?.kd} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Операционный директор
                  </dt>
                  <dd className="mt-1">
                    <DirectorCell stage={appr?.od} />
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </>
  );
}
