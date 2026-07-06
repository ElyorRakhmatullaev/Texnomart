"use client";

import * as React from "react";
import { Check, Users } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@texnomart/ui/sheet";
import { Badge } from "@texnomart/ui/badge";
import { cn } from "@texnomart/ui/utils";
import { RuDate } from "../../../components/RuDate";
import {
  DEPARTMENT_LABELS,
  getNomenclatureItem,
  getReportChangeSet,
  getReportRoster,
  type PromoCampaign,
  type PromoLine,
  type ReportDepartment,
} from "../../../lib/promo-mock-data";
import { getAckRecords } from "../../../lib/report-ack-store";

interface ReportAcknowledgeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: PromoCampaign;
  department: ReportDepartment;
  version: number;
  lines: PromoLine[];
}

type ChangeKind = "added" | "changed" | "excluded";

const KIND_META: Record<ChangeKind, { label: string; cls: string }> = {
  added: { label: "Добавлено", cls: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300" },
  changed: { label: "Изменено", cls: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300" },
  excluded: { label: "Исключено", cls: "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300" },
};

/**
 * «Кто ознакомился» (§2) — read-only detail for the responsible manager /
 * Администратор: for each changed / added / excluded position of the current
 * report version, which department users have acknowledged it (+ timestamp) and
 * who has not. Fed by the seeded roster + the per-user acknowledgement store.
 */
export function ReportAcknowledgeDrawer({
  open,
  onOpenChange,
  campaign,
  department,
  version,
  lines,
}: ReportAcknowledgeDrawerProps) {
  const changeSet = getReportChangeSet(campaign.id);
  const roster = getReportRoster(department);
  const lineById = React.useMemo(
    () => new Map(lines.map((l) => [l.id, l])),
    [lines]
  );

  // The changed positions of this version, tagged with their change kind.
  const changedLines = React.useMemo(() => {
    const out: { lineId: string; kind: ChangeKind }[] = [];
    for (const id of changeSet.addedLineIds) out.push({ lineId: id, kind: "added" });
    const changedIds = new Set(changeSet.changedCells.map((c) => c.lineId));
    for (const id of changedIds) out.push({ lineId: id, kind: "changed" });
    for (const id of changeSet.removedLineIds) out.push({ lineId: id, kind: "excluded" });
    return out;
  }, [changeSet]);

  // lineId → (userId → acknowledgement timestamp).
  const ackByLine = React.useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    for (const r of getAckRecords({ campaignId: campaign.id, department, version })) {
      if (!map.has(r.lineId)) map.set(r.lineId, new Map());
      map.get(r.lineId)!.set(r.userId, r.at);
    }
    return map;
    // ackTick isn't available here; the drawer re-reads on each open (key not needed
    // because the store read is synchronous in render).
  }, [campaign.id, department, version, open]);

  const nomName = (lineId: string) => {
    const line = lineById.get(lineId);
    if (!line) return lineId;
    return getNomenclatureItem(line.nomenclatureId)?.name ?? line.nomenclatureId;
  };
  const nomCode = (lineId: string) => lineById.get(lineId)?.nomenclatureId ?? "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            Кто ознакомился с изменениями
          </SheetTitle>
          <SheetDescription className="tabular-nums">
            {DEPARTMENT_LABELS[department]} · {campaign.id} · Версия {version}
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-3 border-b bg-gray-50 dark:bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          <span>
            Изменённых позиций:{" "}
            <span className="font-medium tabular-nums text-gray-800 dark:text-gray-200">
              {changedLines.length}
            </span>
          </span>
          <span>
            Пользователей:{" "}
            <span className="font-medium tabular-nums text-gray-800 dark:text-gray-200">
              {roster.length}
            </span>
          </span>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {changedLines.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 dark:border-border p-6 text-center text-sm text-muted-foreground">
              В текущей версии отчёта нет изменённых позиций.
            </div>
          ) : (
            changedLines.map(({ lineId, kind }) => {
              const acked = ackByLine.get(lineId);
              const ackedCount = roster.filter((u) => acked?.has(u.id)).length;
              return (
                <div key={`${lineId}:${kind}`} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {nomName(lineId)}
                      </div>
                      <div className="text-[11px] tabular-nums text-muted-foreground">
                        {nomCode(lineId)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge className={cn("rounded-full border-0 text-[11px] font-medium", KIND_META[kind].cls)}>
                        {KIND_META[kind].label}
                      </Badge>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {ackedCount}/{roster.length}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-2.5 space-y-1.5">
                    {roster.map((u) => {
                      const at = acked?.get(u.id);
                      return (
                        <li
                          key={u.id}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="min-w-0 truncate text-gray-700 dark:text-gray-200">
                            {u.name}
                          </span>
                          {at ? (
                            <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                              <Check className="size-3.5" />
                              Ознакомлен ·{" "}
                              <RuDate value={new Date(at)} withTime className="tabular-nums" />
                            </span>
                          ) : (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              Не ознакомлен
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
