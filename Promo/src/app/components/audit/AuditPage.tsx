"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@texnomart/ui/tabs";
import { Button } from "@texnomart/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@texnomart/ui/select";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { useRole } from "../../role-context";
import { OWN_AUDIT_KM_ID } from "../../../lib/promo-mock-data";
import type { PromoRole } from "../../role-context";
import { PARTICIPANT_ROLES } from "../../../lib/audit-control";
import { AuditLogTable } from "./AuditLogTable";
import { PlanDeadlinesTab } from "./PlanDeadlinesTab";
import { PromoDeadlinesTab } from "./PromoDeadlinesTab";

const TAB_TRIGGER =
  "flex-none whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 data-[state=active]:shadow-none";

export interface AuditAccess {
  role: PromoRole;
  canSeeAll: boolean;
  ownKmId: string;
  isAdmin: boolean;
}
export interface AuditGlobalFilters {
  from: string;
  to: string;
  role: "all" | PromoRole;
}
const EMPTY_GLOBAL: AuditGlobalFilters = { from: "", to: "", role: "all" };

export function AuditPage() {
  const { currentRole } = useRole();
  const [tab, setTab] = React.useState("plan");
  const [globals, setGlobals] = React.useState<AuditGlobalFilters>(EMPTY_GLOBAL);

  const access: AuditAccess = React.useMemo(() => {
    const isAdmin = currentRole === "Администратор";
    const canSeeAll =
      isAdmin || currentRole === "Коммерческий директор" || currentRole === "Старший КМ";
    return { role: currentRole, canSeeAll, ownKmId: OWN_AUDIT_KM_ID, isAdmin };
  }, [currentRole]);

  const patch = (p: Partial<AuditGlobalFilters>) => setGlobals((g) => ({ ...g, ...p }));
  const reset = () => setGlobals(EMPTY_GLOBAL);

  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Аудит-лог и контроль сроков"
        subtitle="Контроль сроков этапов, согласований и отправок отчётов: кто ответственный и из-за кого возникла просрочка."
        showCompare={false}
        showExport={false}
      />

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList className="h-auto justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="plan" className={TAB_TRIGGER}>Сроки по плану</TabsTrigger>
            <TabsTrigger value="promo" className={TAB_TRIGGER}>Сроки по промо и отчётам</TabsTrigger>
            <TabsTrigger value="metrics" className={TAB_TRIGGER}>Показатели участников</TabsTrigger>
            <TabsTrigger value="log" className={TAB_TRIGGER}>Аудит-лог</TabsTrigger>
          </TabsList>

          {tab !== "log" && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date" value={globals.from} onChange={(e) => patch({ from: e.target.value })}
                className="h-9 rounded-md border border-gray-200 dark:border-border bg-white dark:bg-card px-2 text-sm"
                aria-label="Дата с"
              />
              <span className="text-gray-400">—</span>
              <input
                type="date" value={globals.to} onChange={(e) => patch({ to: e.target.value })}
                className="h-9 rounded-md border border-gray-200 dark:border-border bg-white dark:bg-card px-2 text-sm"
                aria-label="Дата по"
              />
              <Select
                value={globals.role}
                onValueChange={(v) => patch({ role: v as AuditGlobalFilters["role"] })}
              >
                <SelectTrigger className="h-9 w-[190px] bg-white dark:bg-card text-sm">
                  <SelectValue placeholder="Все роли" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  {PARTICIPANT_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={reset}>
                <RotateCcw className="size-4" /> Сбросить фильтры
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="plan" className="mt-0">
          <PlanDeadlinesTab access={access} globals={globals} />
        </TabsContent>
        <TabsContent value="promo" className="mt-0">
          <PromoDeadlinesTab access={access} globals={globals} />
        </TabsContent>
        <TabsContent value="metrics" className="mt-0">
          <TabPlaceholder label="Показатели участников" />
        </TabsContent>
        <TabsContent value="log" className="mt-0">
          <AuditLogTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-16 text-center text-sm text-muted-foreground">
      {label} — в разработке
    </div>
  );
}
