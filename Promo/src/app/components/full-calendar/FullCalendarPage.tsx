"use client";

import * as React from "react";
import { toast } from "sonner";
import { Ban, Info, Plus, Send, Upload } from "lucide-react";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { FilterBar } from "@texnomart/shared/components/filter-bar";
import type { FilterConfig } from "@texnomart/shared/types";
import { Button } from "@texnomart/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@texnomart/ui/tooltip";
import { useRole } from "../../role-context";
import { FullCalendarGrid } from "./FullCalendarGrid";
import { ColumnGroupToggle } from "./ColumnGroupToggle";
import { DEFAULT_VISIBLE_GROUPS, type ColumnGroupKey } from "./gridFields";
import {
  CATEGORY_MANAGERS,
  PROMO_TYPES,
  getCampaignsWithLines,
  getFullCalendarAccess,
  getPromoLines,
} from "../../../lib/promo-mock-data";

const ALL = "all";

const CAMPAIGN_STATUSES = [
  "На согласовании у старшего КМ",
  "На согласовании у коммерческого директора",
  "Переотправлено на корректировку КМ",
  "Согласовано и отправлено смежным отделам",
  "Отменена",
];

const FILTERS: FilterConfig[] = [
  {
    key: "type",
    label: "Тип",
    options: PROMO_TYPES.map((t) => ({ value: t.name, label: t.name })),
  },
  {
    key: "status",
    label: "Статус",
    options: CAMPAIGN_STATUSES.map((s) => ({ value: s, label: s })),
  },
  {
    key: "km",
    label: "КМ",
    options: CATEGORY_MANAGERS.map((k) => ({ value: k.id, label: k.name })),
  },
  {
    key: "priznak",
    label: "Признак",
    options: [
      { value: "planned", label: "Плановая" },
      { value: "unplanned", label: "Внеплановая" },
    ],
  },
];

const CAMPAIGNS_WITH_LINES = getCampaignsWithLines();

export function FullCalendarPage() {
  const { currentRole } = useRole();
  const access = getFullCalendarAccess(currentRole);

  const [visibleGroups, setVisibleGroups] = React.useState<ColumnGroupKey[]>(
    DEFAULT_VISIBLE_GROUPS
  );
  const [values, setValues] = React.useState<Record<string, string>>({
    type: ALL,
    status: ALL,
    km: ALL,
    priznak: ALL,
  });

  const filtered = React.useMemo(() => {
    return CAMPAIGNS_WITH_LINES.filter((c) => {
      if (values.type !== ALL && c.type !== values.type) return false;
      if (values.status !== ALL && c.status !== values.status) return false;
      if (values.priznak !== ALL) {
        if (values.priznak === "planned" && !c.planned) return false;
        if (values.priznak === "unplanned" && c.planned) return false;
      }
      if (values.km !== ALL) {
        const hasKm = getPromoLines(c.id).some((l) => l.kmId === values.km);
        if (!hasKm) return false;
      }
      return true;
    });
  }, [values]);

  // Validation summary for the action bar — lines missing the required forecast.
  const missingRequired = React.useMemo(
    () =>
      filtered.reduce(
        (sum, c) =>
          sum +
          getPromoLines(c.id).filter((l) => l.salesForecast == null).length,
        0
      ),
    [filtered]
  );

  if (!access.canView) {
    return <AccessDenied note={access.note} />;
  }

  const phaseToast = () =>
    toast.info("Действие появится на следующем шаге сборки полного календаря (S2).");

  const canSubmit = access.canEditOwnLines && missingRequired === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="space-y-4 pb-4">
          <PageHeader
            title="Полный промо-календарь"
            showCompare={false}
            showExport={false}
            subtitle={
              <span className="flex items-center gap-2">
                {filtered.length.toLocaleString("ru-RU")} акций ·{" "}
                {filtered
                  .reduce((s, c) => s + getPromoLines(c.id).length, 0)
                  .toLocaleString("ru-RU")}{" "}
                строк
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px]">
                    {access.note}
                  </TooltipContent>
                </Tooltip>
              </span>
            }
            actions={
              access.canEditOwnLines ? (
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={phaseToast}>
                    <Upload className="size-4" />
                    Загрузить из Excel
                  </Button>
                  <Button onClick={phaseToast}>
                    <Plus className="size-4" />
                    Создать внеплановую акцию
                  </Button>
                </div>
              ) : undefined
            }
          />

          <ColumnGroupToggle
            visible={visibleGroups}
            onChange={setVisibleGroups}
          />

          <FilterBar
            filters={FILTERS}
            values={values}
            onFilterChange={(key, value) =>
              setValues((prev) => ({ ...prev, [key]: value }))
            }
            onClear={() =>
              setValues({ type: ALL, status: ALL, km: ALL, priznak: ALL })
            }
            resultCount={filtered.length}
          />

          <FullCalendarGrid
            campaigns={filtered}
            visibleGroups={visibleGroups}
          />
        </div>
      </div>

      {/* Sticky bottom action bar (fixed footer) — flush to the main edges. */}
      <div className="-mx-3 -mb-3 shrink-0 border-t bg-white px-3 py-3 md:-mx-4 md:-mb-4 md:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {missingRequired > 0 ? (
              <span className="text-red-600">
                {missingRequired}{" "}
                {pluralLines(missingRequired)}: не заполнены обязательные поля
                («Прогноз продаж»)
              </span>
            ) : (
              "Все обязательные поля заполнены"
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={phaseToast}
              disabled={!access.canEditOwnLines}
              className="min-h-11 sm:min-h-9"
            >
              Сохранить черновик
            </Button>
            <SubmitButton
              canSubmit={canSubmit}
              canEdit={access.canEditOwnLines}
              missingRequired={missingRequired}
              onClick={phaseToast}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmitButton({
  canSubmit,
  canEdit,
  missingRequired,
  onClick,
}: {
  canSubmit: boolean;
  canEdit: boolean;
  missingRequired: number;
  onClick: () => void;
}) {
  const btn = (
    <Button
      onClick={onClick}
      disabled={!canSubmit}
      className="min-h-11 sm:min-h-9"
    >
      <Send className="size-4" />
      Отправить на согласование
    </Button>
  );
  if (canSubmit) return btn;

  const reason = !canEdit
    ? "Доступно только для категорийного менеджера, заполняющего свои строки"
    : `Заполните обязательные поля (${missingRequired})`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* span wrapper so the tooltip works on a disabled button */}
        <span tabIndex={0}>{btn}</span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}

function AccessDenied({ note }: { note: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold leading-tight text-gray-900 md:text-[32px]">
        Полный промо-календарь
      </h1>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-20 text-center">
        <Ban className="size-12 text-muted-foreground/60" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Нет доступа
        </h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{note}</p>
      </div>
    </div>
  );
}

function pluralLines(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "строка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "строки";
  return "строк";
}
