"use client";

import * as React from "react";
import { ShieldAlert, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@texnomart/ui/tabs";
import { Card } from "@texnomart/ui/card";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { useRole } from "../../role-context";
import { getPermissionsScreenAccess, FINAL_APPROVAL_NOTE } from "../../../lib/permissions";
import { AccessMatrixTable, AccessLevelLegend } from "./AccessMatrixTable";
import { CapabilityList } from "./CapabilityList";

const TAB_TRIGGER =
  "flex-none whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 data-[state=active]:shadow-none";

export function PermissionsMatrixPage() {
  const { currentRole } = useRole();
  const access = getPermissionsScreenAccess(currentRole);
  const [tab, setTab] = React.useState("matrix");

  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Матрица прав"
        subtitle="Сводная таблица доступа по ролям и детальные права на действия."
        showCompare={false}
        showExport={false}
      />

      {!access.canView ? (
        <Card className="items-center gap-3 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <ShieldAlert className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Недостаточно прав
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">{access.note}</p>
          </div>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Активная роль:{" "}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {currentRole}
            </span>{" "}
            — выделена в матрице.
          </p>

          <Tabs value={tab} onValueChange={setTab} className="gap-4">
            <TabsList className="h-auto justify-start gap-1 rounded-none border-b bg-transparent p-0">
              <TabsTrigger value="matrix" className={TAB_TRIGGER}>
                Сводная матрица
              </TabsTrigger>
              <TabsTrigger value="capabilities" className={TAB_TRIGGER}>
                Детальные права
              </TabsTrigger>
            </TabsList>

            <TabsContent value="matrix" className="mt-0 flex flex-col gap-4">
              <AccessLevelLegend />
              <AccessMatrixTable activeRole={currentRole} />
              <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{FINAL_APPROVAL_NOTE}</p>
              </div>
            </TabsContent>

            <TabsContent value="capabilities" className="mt-0 flex flex-col gap-4">
              <p className="text-xs text-muted-foreground">
                Права на конкретные действия. Перечень строится по фактическим
                правилам гейтинга в коде — для каждого действия указаны роли,
                которым оно доступно, и место его проверки.
              </p>
              <CapabilityList activeRole={currentRole} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
