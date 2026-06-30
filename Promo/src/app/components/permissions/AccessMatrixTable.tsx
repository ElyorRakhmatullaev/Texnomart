"use client";

import { Card } from "@texnomart/ui/card";
import { cn } from "@texnomart/ui/utils";
import { PROMO_ROLES, type PromoRole } from "../../role-context";
import {
  ACCESS_AREAS,
  ACCESS_MATRIX,
  ACCESS_LEVEL_META,
  ACCESS_LEVEL_ORDER,
  type AccessLevel,
} from "../../../lib/permissions";

function LevelChip({ level, title }: { level: AccessLevel; title?: string }) {
  const meta = ACCESS_LEVEL_META[level];
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        meta.bg,
        meta.text
      )}
    >
      {meta.label}
    </span>
  );
}

/** Legend of the four access levels. */
export function AccessLevelLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {ACCESS_LEVEL_ORDER.map((level) => {
        const meta = ACCESS_LEVEL_META[level];
        return (
          <div key={level} className="flex items-center gap-2">
            <LevelChip level={level} />
            <span className="text-xs text-muted-foreground">{meta.description}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Appendix D «Сводная таблица доступа» — roles (rows) × functional areas (columns).
 * Desktop: a single semantic table with a sticky role column; the active role's
 * row is brand-tinted. Below md: per-role cards (each area as a labelled row).
 */
export function AccessMatrixTable({ activeRole }: { activeRole: PromoRole }) {
  return (
    <>
      {/* Desktop / tablet grid */}
      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="sticky left-0 z-10 bg-muted/40 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">
                  Роль
                </th>
                {ACCESS_AREAS.map((area) => (
                  <th
                    key={area.id}
                    className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200"
                  >
                    {area.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROMO_ROLES.map((role) => {
                const isActive = role === activeRole;
                return (
                  <tr
                    key={role}
                    className={cn(
                      "border-b border-border last:border-0",
                      isActive
                        ? "bg-primary/5 dark:bg-primary/10"
                        : "hover:bg-muted/30"
                    )}
                  >
                    <th
                      scope="row"
                      className={cn(
                        "sticky left-0 z-10 px-4 py-3 text-left align-middle font-medium",
                        isActive
                          ? "bg-primary/5 dark:bg-primary/10"
                          : "bg-card",
                        "text-gray-900 dark:text-gray-100"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {role}
                        {isActive && (
                          <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                            Вы
                          </span>
                        )}
                      </span>
                    </th>
                    {ACCESS_AREAS.map((area) => {
                      const cell = ACCESS_MATRIX[role][area.id];
                      return (
                        <td key={area.id} className="px-4 py-3 align-middle">
                          <LevelChip level={cell.level} title={cell.note} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {PROMO_ROLES.map((role) => {
          const isActive = role === activeRole;
          return (
            <Card
              key={role}
              className={cn(
                "gap-3 p-4",
                isActive && "border-primary/40 bg-primary/5 dark:bg-primary/10"
              )}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {role}
                </h3>
                {isActive && (
                  <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                    Вы
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {ACCESS_AREAS.map((area) => {
                  const cell = ACCESS_MATRIX[role][area.id];
                  return (
                    <div key={area.id} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {area.label}
                        </span>
                        <LevelChip level={cell.level} />
                      </div>
                      <span className="text-xs text-muted-foreground">{cell.note}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
