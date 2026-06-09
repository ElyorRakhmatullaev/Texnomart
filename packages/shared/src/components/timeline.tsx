"use client";

import * as React from "react";

export interface TimelineStep {
  status: "completed" | "in-progress" | "pending";
  title: string;
  time: string;
  duration?: string | null;
  note?: string | null;
}

interface TimelineProps {
  steps: TimelineStep[];
}

const STATUS_STYLES: Record<
  TimelineStep["status"],
  { dot: string; line: string }
> = {
  completed: { dot: "bg-green-600", line: "bg-green-200" },
  "in-progress": { dot: "bg-amber-500", line: "bg-gray-200" },
  pending: { dot: "bg-gray-200", line: "bg-gray-200" },
};

export function Timeline({ steps }: TimelineProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const style = STATUS_STYLES[step.status];
        const isLast = i === steps.length - 1;
        return (
          <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <div
                className={`h-3 w-3 rounded-full shrink-0 mt-0.5 ${style.dot}`}
              />
              {!isLast && (
                <div className={`w-0.5 flex-1 mt-1 ${style.line}`} />
              )}
            </div>
            <div className="flex-1 min-w-0 -mt-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {step.title}
                </span>
                <span className="text-xs text-gray-500 shrink-0">
                  {step.time}
                </span>
              </div>
              {step.duration && (
                <p className="text-xs text-gray-500 mt-0.5">{step.duration}</p>
              )}
              {step.note && (
                <p className="text-xs text-gray-400 mt-0.5">{step.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
