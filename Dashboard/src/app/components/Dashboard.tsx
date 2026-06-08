"use client";

import * as React from "react";
import { LayoutDashboard, AlertTriangle } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { KpiStrip } from "./KpiStrip";
import { ApplicationsDynamicsChart } from "./ApplicationsDynamicsChart";
import { PartnerDistributionDonut } from "./PartnerDistributionDonut";
import { ApplicationStatusesChart } from "./ApplicationStatusesChart";
import { TopBranchesChart } from "./TopBranchesChart";
import { GeographyMap } from "./GeographyMap";
import { RecentApplicationsWidget } from "./RecentApplicationsWidget";
import { AlertsWidget } from "./AlertsWidget";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { Card, CardContent } from "@texnomart/ui/card";
import { Button } from "@texnomart/ui/button";

export function Dashboard() {
  const [loading, setLoading] = React.useState(false);
  const [hasData, setHasData] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [lastSyncTime] = React.useState("12:34");
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [compareEnabled, setCompareEnabled] = React.useState(false);
  const [period, setPeriod] = React.useState("7days");

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // R for refresh
      if (e.key === "r" || e.key === "R") {
        if (!e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== "INPUT") {
          e.preventDefault();
          handleRefresh();
        }
      }

      // ? for shortcuts help
      if (e.key === "?") {
        if (document.activeElement?.tagName !== "INPUT") {
          e.preventDefault();
          setShortcutsOpen(true);
        }
      }

      // 1-8 for KPI focus
      if (e.key >= "1" && e.key <= "8") {
        if (!e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== "INPUT") {
          e.preventDefault();
          const cards = document.querySelectorAll('[data-kpi-card]');
          const index = parseInt(e.key) - 1;
          if (cards[index]) {
            (cards[index] as HTMLElement).focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    console.log("Refreshing dashboard data...");
    setTimeout(() => setLoading(false), 1000);
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
  };

  const handleCompareToggle = (enabled: boolean) => {
    setCompareEnabled(enabled);
  };

  const chartPeriod = period === "today" || period === "yesterday" ? "24h"
    : period === "30days" ? "30d" : "7d";

  // Global empty state
  if (!hasData && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <LayoutDashboard className="size-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Здесь пока нет данных</h2>
            <p className="text-base text-gray-600 mb-6">
              Как только начнут поступать первые заявки, статистика появится автоматически.
            </p>
            <Button onClick={() => setHasData(true)}>
              Создать тестовую заявку
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 -m-3 md:-m-4 p-3 md:p-4 min-h-full bg-gray-50/80">
      {/* Compact Header */}
      <PageHeader
        period={period}
        compareEnabled={compareEnabled}
        onRefresh={handleRefresh}
        onPeriodChange={handlePeriodChange}
        onCompareToggle={handleCompareToggle}
      />

      <div id="main-content" className="flex flex-col gap-3">
        {/* KPI Strip */}
        <KpiStrip loading={loading} showSparklines={compareEnabled} />

        {/* Row 1: Dynamics (2/3) + Partners (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <ApplicationsDynamicsChart loading={loading} period={chartPeriod} onPeriodChange={(p) => setPeriod(p === "24h" ? "today" : p === "30d" ? "30days" : "7days")} />
          </div>
          <PartnerDistributionDonut loading={loading} />
        </div>

        {/* Row 2: Statuses (1/2) + Top Branches (1/2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ApplicationStatusesChart loading={loading} period={chartPeriod === "24h" ? "7d" : chartPeriod === "30d" ? "30d" : "7d"} onPeriodChange={(p) => setPeriod(p === "30d" ? "30days" : "7days")} />
          <TopBranchesChart loading={loading} />
        </div>

        {/* Row 3: Recent Applications */}
        <RecentApplicationsWidget loading={loading} />
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </div>
  );
}
