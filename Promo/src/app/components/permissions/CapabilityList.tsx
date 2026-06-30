"use client";

import { Card } from "@texnomart/ui/card";
import { cn } from "@texnomart/ui/utils";
import type { PromoRole } from "../../role-context";
import {
  CAPABILITIES,
  CAPABILITY_GROUPS,
  rolesWithCapability,
} from "../../../lib/permissions";

function RoleChip({ role, active }: { role: PromoRole; active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
      )}
    >
      {role}
    </span>
  );
}

/**
 * Granular «Детальные права» — the «консолидация». Each capability row lists the
 * roles that hold it, computed LIVE via `rolesWithCapability` (which calls the
 * real gating helpers). The active role's chips are brand-highlighted, and each
 * row footnotes where the rule is actually enforced in code.
 */
export function CapabilityList({ activeRole }: { activeRole: PromoRole }) {
  return (
    <div className="flex flex-col gap-5">
      {CAPABILITY_GROUPS.map((group) => {
        const caps = CAPABILITIES.filter((c) => c.group === group);
        if (caps.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {group}
            </h3>
            <Card className="gap-0 p-0">
              {caps.map((cap, i) => {
                const roles = rolesWithCapability(cap);
                return (
                  <div
                    key={cap.id}
                    className={cn(
                      "flex flex-col gap-2 p-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6",
                      i > 0 && "border-t border-border"
                    )}
                  >
                    <div className="min-w-0 lg:max-w-[52%]">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cap.label}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {cap.description}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-gray-400 dark:text-gray-500">
                        {cap.enforcedIn}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 lg:justify-end">
                      {roles.length > 0 ? (
                        roles.map((role) => (
                          <RoleChip
                            key={role}
                            role={role}
                            active={role === activeRole}
                          />
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
