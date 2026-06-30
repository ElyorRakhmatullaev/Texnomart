"use client";

import * as React from "react";
import { Inbox } from "lucide-react";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { Tabs, TabsList, TabsTrigger } from "@texnomart/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { Label } from "@texnomart/ui/label";
import { useRole } from "../../role-context";
import { VersionHistoryDrawer } from "../../../components/VersionHistoryDrawer";
import { DepartmentReportView } from "./DepartmentReportView";
import { reportFieldsFor } from "./reportFields";
import {
  DEPARTMENT_SHORT,
  buildCampaignReport,
  getCampaignVersions,
  getPromoLines,
  getReportAccess,
  getSentCampaigns,
  type ReportDepartment,
} from "../../../lib/promo-mock-data";

const EMPTY_SET: ReadonlySet<string> = new Set();

export function ReportsPage() {
  const { currentRole } = useRole();
  const access = React.useMemo(() => getReportAccess(currentRole), [currentRole]);
  const sentCampaigns = React.useMemo(() => getSentCampaigns(), []);

  // Active department — kept within the role's accessible set.
  const [department, setDepartment] = React.useState<ReportDepartment>(
    access.departments[0] ?? "marketing"
  );
  React.useEffect(() => {
    if (!access.departments.includes(department)) {
      setDepartment(access.departments[0] ?? "marketing");
    }
  }, [access.departments, department]);

  // Active campaign (one of the sent reports).
  const [campaignId, setCampaignId] = React.useState<string>(
    sentCampaigns[0]?.id ?? ""
  );
  React.useEffect(() => {
    if (!sentCampaigns.some((c) => c.id === campaignId)) {
      setCampaignId(sentCampaigns[0]?.id ?? "");
    }
  }, [sentCampaigns, campaignId]);

  const campaign = sentCampaigns.find((c) => c.id === campaignId);
  const lines = React.useMemo(
    () => (campaign ? getPromoLines(campaign.id) : []),
    [campaign]
  );
  const fields = React.useMemo(() => reportFieldsFor(department), [department]);

  // ── marketing «В рекламу (выбрано маркетингом)» store (in-memory overrides) ──
  const [flags, setFlags] = React.useState<Map<string, boolean>>(new Map());
  const lineById = React.useMemo(
    () => new Map(lines.map((l) => [l.id, l])),
    [lines]
  );
  const flagFor = React.useCallback(
    (lineId: string) =>
      flags.has(lineId)
        ? flags.get(lineId)!
        : lineById.get(lineId)?.advSelectedMarketing ?? false,
    [flags, lineById]
  );
  const toggleFlag = React.useCallback(
    (lineId: string) =>
      setFlags((prev) => {
        const next = new Map(prev);
        next.set(lineId, !flagFor(lineId));
        return next;
      }),
    [flagFor]
  );
  const bulkFlag = React.useCallback(
    (ids: string[], value: boolean) =>
      setFlags((prev) => {
        const next = new Map(prev);
        ids.forEach((id) => next.set(id, value));
        return next;
      }),
    []
  );

  // ── acknowledgement state, keyed per (campaign + department) view ──
  const viewKey = `${campaignId}:${department}`;
  const [ackAll, setAckAll] = React.useState<Set<string>>(new Set());
  const [ackLines, setAckLines] = React.useState<Map<string, Set<string>>>(
    new Map()
  );
  const acknowledgedAll = ackAll.has(viewKey);
  const acknowledgedLines = (ackLines.get(viewKey) ?? EMPTY_SET) as Set<string>;
  const onAcknowledgeAll = () =>
    setAckAll((prev) => new Set(prev).add(viewKey));
  const onAcknowledgeLine = (lineId: string) =>
    setAckLines((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(viewKey) ?? []);
      set.add(lineId);
      next.set(viewKey, set);
      return next;
    });

  // «Показать только изменённые» — reset when the view changes.
  const [onlyChanged, setOnlyChanged] = React.useState(false);
  React.useEffect(() => setOnlyChanged(false), [campaignId, department]);

  // Version-history drawer (deferred open — Radix self-dismiss guard).
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const subtitle = `${access.note} Отправлено отчётов: ${sentCampaigns.length.toLocaleString("ru-RU")}.`;

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        title="Отчёты смежным отделам"
        showCompare={false}
        showExport={false}
        subtitle={subtitle}
      />

      {sentCampaigns.length === 0 || !campaign ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-16 text-center">
          <Inbox className="size-12 text-muted-foreground" />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Отчётов пока нет</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Отчёты формируются автоматически, когда акция переходит в статус
              «Согласовано и отправлено смежным отделам».
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ── controls: department + campaign pickers ── */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            {/* Department: Tabs on sm+, Select on mobile */}
            <div className="min-w-0">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Подразделение
              </span>
              {access.departments.length > 1 ? (
                <>
                  <Tabs
                    value={department}
                    onValueChange={(v) => setDepartment(v as ReportDepartment)}
                    className="hidden sm:block"
                  >
                    <TabsList className="h-auto justify-start gap-1 rounded-none border-b bg-transparent p-0">
                      {access.departments.map((dep) => (
                        <TabsTrigger
                          key={dep}
                          value={dep}
                          className="flex-none whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 data-[state=active]:shadow-none"
                        >
                          {DEPARTMENT_SHORT[dep]}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <div className="sm:hidden">
                    <Select
                      value={department}
                      onValueChange={(v) => setDepartment(v as ReportDepartment)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {access.departments.map((dep) => (
                          <SelectItem key={dep} value={dep}>
                            {DEPARTMENT_SHORT[dep]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-muted px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200">
                  {DEPARTMENT_SHORT[department]}
                </span>
              )}
            </div>

            {/* Campaign picker */}
            <div className="w-full lg:w-auto">
              <Label
                htmlFor="report-campaign"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Акция
              </Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger id="report-campaign" className="w-full lg:w-[360px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sentCampaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="tabular-nums text-muted-foreground">
                        {c.id}
                      </span>{" "}
                      · {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DepartmentReportView
            key={viewKey}
            campaign={campaign}
            lines={lines}
            department={department}
            fields={fields}
            onlyChanged={onlyChanged}
            onToggleOnlyChanged={setOnlyChanged}
            acknowledgedAll={acknowledgedAll}
            acknowledgedLines={acknowledgedLines}
            onAcknowledgeAll={onAcknowledgeAll}
            onAcknowledgeLine={onAcknowledgeLine}
            onOpenHistory={() => setTimeout(() => setHistoryOpen(true), 0)}
            canEditMarketingFlag={
              access.canEditMarketingFlag && department === "marketing"
            }
            flagFor={flagFor}
            onToggleFlag={toggleFlag}
            onBulkFlag={bulkFlag}
          />

          <VersionHistoryDrawer
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            campaignLabel={`${campaign.id} · ${campaign.name}`}
            versions={getCampaignVersions(campaign.id)}
            currentReport={buildCampaignReport(lines)}
          />
        </>
      )}
    </div>
  );
}
