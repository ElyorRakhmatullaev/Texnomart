"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Download, Inbox, SlidersHorizontal, Users } from "lucide-react";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { Tabs, TabsList, TabsTrigger } from "@texnomart/ui/tabs";
import { Button } from "@texnomart/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { Label } from "@texnomart/ui/label";
import { useRole } from "../../role-context";
import { useCurrentUser } from "../../current-user-context";
import { VersionHistoryDrawer } from "../../../components/VersionHistoryDrawer";
import { DepartmentReportView } from "./DepartmentReportView";
import { ReportAcknowledgeDrawer } from "./ReportAcknowledgeDrawer";
import { reportColumnsFor } from "./reportFields";
import { exportReportXlsx } from "../../../lib/report-xlsx";
import {
  ReportFilters,
  applyReportFilters,
  countActiveReportFilters,
  EMPTY_REPORT_FILTERS,
} from "./ReportFilters";
import {
  DEPARTMENT_SHORT,
  buildCampaignReport,
  getCampaignVersions,
  getPromoLines,
  getReportAccess,
  getReportChangeSet,
  getReportSnapshot,
  getReportVersionNo,
  getSentCampaigns,
  type ReportDepartment,
} from "../../../lib/promo-mock-data";
import {
  acknowledgeLine,
  acknowledgeLines,
  getAckedLines,
} from "../../../lib/report-ack-store";

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
  const fields = React.useMemo(() => reportColumnsFor(department), [department]);

  // «Изменение» classification for this campaign's report version, and the
  // «Показано: N» / filter-panel wiring below both key off it (E-1 §1).
  const changeSet = React.useMemo(() => getReportChangeSet(campaignId), [campaignId]);

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

  // Which change plashka a line shows — mirrors DepartmentReportView's own
  // `changeKind`, needed here (page level) for `applyReportFilters`.
  const changeKindPage = React.useCallback(
    (lineId: string): "added" | "changed" | "excluded" | null => {
      const line = lineById.get(lineId);
      if ((line && (line.removed || line.rejected)) || changeSet.removedLineIds.includes(lineId))
        return "excluded";
      if (changeSet.addedLineIds.includes(lineId)) return "added";
      if (changeSet.changedCells.some((c) => c.lineId === lineId)) return "changed";
      return null;
    },
    [changeSet, lineById]
  );

  // ── acknowledgement state — per-user, per (campaign + department + version),
  // backed by localStorage (`report-ack-store`) so it survives reload and stays
  // independent per logged-in user (E-1 §2). `viewKey` still keys the child's
  // `key=` prop below so per-view local UI state resets on tab/campaign switch.
  const viewKey = `${campaignId}:${department}`;
  const { currentUser } = useCurrentUser();
  const userId = currentUser?.id ?? "anon";
  const version = campaign ? getReportVersionNo(campaign) : 0;
  const [ackTick, setAckTick] = React.useState(0);
  const acknowledgedLines = React.useMemo(
    () =>
      campaign
        ? getAckedLines({ campaignId, department, version }, userId)
        : new Set<string>(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaignId, department, version, userId, ackTick, campaign]
  );
  const changedLineIds = React.useMemo(() => {
    const ids = new Set<string>([
      ...changeSet.addedLineIds,
      ...changeSet.removedLineIds,
    ]);
    changeSet.changedCells.forEach((c) => ids.add(c.lineId));
    return [...ids];
  }, [changeSet]);
  const onAcknowledgeLine = (lineId: string) => {
    acknowledgeLine({ campaignId, department, version }, userId, lineId);
    setAckTick((t) => t + 1);
  };
  const onAcknowledgeAll = () => {
    const ids = changedLineIds.filter((id) => !acknowledgedLines.has(id));
    acknowledgeLines({ campaignId, department, version }, userId, ids);
    setAckTick((t) => t + 1);
  };

  const isAckedPage = React.useCallback(
    (lineId: string) => acknowledgedLines.has(lineId),
    [acknowledgedLines]
  );

  // «Показать только изменённые» + column filters — both reset when the view changes.
  const [onlyChanged, setOnlyChanged] = React.useState(false);
  const [filters, setFilters] = React.useState(EMPTY_REPORT_FILTERS);
  React.useEffect(() => {
    setOnlyChanged(false);
    setFilters(EMPTY_REPORT_FILTERS);
  }, [campaignId, department]);

  // «Фильтры» panel toggle (E-1 §1).
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const filteredLines = React.useMemo(
    () =>
      campaign
        ? applyReportFilters(lines, fields, campaign, filters, changeKindPage, isAckedPage)
        : lines,
    [lines, fields, campaign, filters, changeKindPage, isAckedPage]
  );

  // «Показано: N позиций» — the final shown count, layering «Только изменения»
  // on top of the column filters (mirrors DepartmentReportView's own `isChangedLine`).
  const isChangedLine = (lineId: string) =>
    changeSet.addedLineIds.includes(lineId) ||
    changeSet.removedLineIds.includes(lineId) ||
    changeSet.changedCells.some((c) => c.lineId === lineId);
  const shownLines = onlyChanged
    ? filteredLines.filter((l) => isChangedLine(l.id))
    : filteredLines;
  const shownCount = shownLines.length;
  const activeFilterCount = countActiveReportFilters(filters);

  // Version-history drawer (deferred open — Radix self-dismiss guard).
  const [historyOpen, setHistoryOpen] = React.useState(false);

  // «Кто ознакомился» detail — visible only to the responsible manager /
  // Администратор (§2). Deferred open (Radix self-dismiss guard).
  const canSeeWhoAcked = [
    "Администратор",
    "Коммерческий директор",
    "Директор маркетинга",
    "Операционный директор",
    "Старший КМ",
  ].includes(currentRole);
  const [ackWhoOpen, setAckWhoOpen] = React.useState(false);

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

          {/* ── «Фильтры» toggle + «Экспорт» + «Показано: N» (E-1 §1) ── */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 min-w-[120px] justify-between"
                onClick={() => setFiltersOpen((o) => !o)}
                aria-expanded={filtersOpen}
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4" />
                  Фильтры
                  {activeFilterCount > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </span>
                {filtersOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                disabled={shownLines.length === 0}
                onClick={() =>
                  exportReportXlsx({
                    department,
                    campaign,
                    columns: fields,
                    lines: shownLines,
                    changeKind: changeKindPage,
                  })
                }
              >
                <Download className="size-4" />
                Экспорт
              </Button>
              {canSeeWhoAcked && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => setTimeout(() => setAckWhoOpen(true), 0)}
                >
                  <Users className="size-4" />
                  Кто ознакомился
                </Button>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              Показано:{" "}
              <span className="font-medium tabular-nums text-gray-900 dark:text-gray-100">
                {shownCount.toLocaleString("ru-RU")}
              </span>{" "}
              позиций
            </span>
          </div>

          <ReportFilters
            columns={fields}
            lines={lines}
            campaign={campaign}
            state={filters}
            onChange={setFilters}
            open={filtersOpen}
          />

          <DepartmentReportView
            key={viewKey}
            campaign={campaign}
            lines={filteredLines}
            totalCount={lines.length}
            department={department}
            fields={fields}
            onlyChanged={onlyChanged}
            onToggleOnlyChanged={setOnlyChanged}
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
            snapshotFor={(v) => getReportSnapshot(campaign.id, v)}
          />

          {canSeeWhoAcked && (
            <ReportAcknowledgeDrawer
              open={ackWhoOpen}
              onOpenChange={setAckWhoOpen}
              campaign={campaign}
              department={department}
              version={version}
              lines={lines}
            />
          )}
        </>
      )}
    </div>
  );
}
