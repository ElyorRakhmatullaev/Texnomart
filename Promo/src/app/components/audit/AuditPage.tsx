"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@texnomart/ui/tabs";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { AuditLogTable } from "./AuditLogTable";
import { ControlEventsTimeline } from "./ControlEventsTimeline";

const TAB_TRIGGER =
  "flex-none whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:shadow-none";

export function AuditPage() {
  const [tab, setTab] = React.useState("log");

  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Аудит-лог"
        subtitle="Журнал действий и свод контрольных событий по акциям с отметками просрочки."
        showCompare={false}
        showExport={false}
      />

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="h-auto justify-start gap-1 rounded-none border-b bg-transparent p-0">
          <TabsTrigger value="log" className={TAB_TRIGGER}>
            Аудит-лог
          </TabsTrigger>
          <TabsTrigger value="events" className={TAB_TRIGGER}>
            Свод контрольных событий
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-0">
          <AuditLogTable />
        </TabsContent>
        <TabsContent value="events" className="mt-0">
          <ControlEventsTimeline />
        </TabsContent>
      </Tabs>
    </div>
  );
}
