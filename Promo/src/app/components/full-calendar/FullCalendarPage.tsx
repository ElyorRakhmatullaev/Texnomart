"use client";

import * as React from "react";
import { toast } from "sonner";
import { Ban, Check, Info, Plus, Send, Upload, X } from "lucide-react";
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
  PROMO_LINES,
  PROMO_TYPES,
  getCampaignsWithLines,
  getFullCalendarAccess,
  isLineValid,
  type PromoLine,
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

// ── Editable line store (Phase 2) ──────────────────────────────────────────────
// Lines are lifted into state so edits propagate to validation, the installment
// columns, and the action bar. Seeded from PROMO_LINES; insertion order preserved.
type LineMap = Map<string, PromoLine>;

function seedLineMap(): LineMap {
  return new Map(PROMO_LINES.map((l) => [l.id, { ...l }]));
}

type LineAction =
  | { type: "edit"; id: string; patch: Partial<PromoLine> }
  | { type: "bulkAdv"; ids: string[]; field: keyof PromoLine; value: boolean };

function lineReducer(state: LineMap, action: LineAction): LineMap {
  switch (action.type) {
    case "edit": {
      const cur = state.get(action.id);
      if (!cur) return state;
      const next = new Map(state);
      next.set(action.id, { ...cur, ...action.patch });
      return next;
    }
    case "bulkAdv": {
      const next = new Map(state);
      for (const id of action.ids) {
        const cur = next.get(id);
        if (cur) next.set(id, { ...cur, [action.field]: action.value });
      }
      return next;
    }
    default:
      return state;
  }
}

export function FullCalendarPage() {
  const { currentRole } = useRole();
  const access = getFullCalendarAccess(currentRole);
  const editorMode = access.canEditOwnLines || access.marketingFlagOnly;

  const [lines, dispatch] = React.useReducer(lineReducer, undefined, seedLineMap);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [visibleGroups, setVisibleGroups] = React.useState<ColumnGroupKey[]>(
    DEFAULT_VISIBLE_GROUPS
  );
  const [values, setValues] = React.useState<Record<string, string>>({
    type: ALL,
    status: ALL,
    km: ALL,
    priznak: ALL,
  });

  // Clear any selection when the role changes (gating differs per role).
  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [currentRole]);

  const linesFor = React.useCallback(
    (campaignId: string) => {
      const out: PromoLine[] = [];
      for (const l of lines.values()) {
        if (l.campaignId === campaignId) out.push(l);
      }
      return out;
    },
    [lines]
  );

  const filtered = React.useMemo(() => {
    return CAMPAIGNS_WITH_LINES.filter((c) => {
      if (values.type !== ALL && c.type !== values.type) return false;
      if (values.status !== ALL && c.status !== values.status) return false;
      if (values.priznak !== ALL) {
        if (values.priznak === "planned" && !c.planned) return false;
        if (values.priznak === "unplanned" && c.planned) return false;
      }
      if (values.km !== ALL) {
        if (!linesFor(c.id).some((l) => l.kmId === values.km)) return false;
      }
      return true;
    });
  }, [values, linesFor]);

  const totalLines = React.useMemo(
    () => filtered.reduce((s, c) => s + linesFor(c.id).length, 0),
    [filtered, linesFor]
  );

  // Live validation — lines missing any required field (forecast / gift fields).
  const invalidLines = React.useMemo(() => {
    let n = 0;
    for (const c of filtered) {
      for (const l of linesFor(c.id)) if (!isLineValid(l, c)) n++;
    }
    return n;
  }, [filtered, linesFor]);

  const onEdit = React.useCallback(
    (id: string, patch: Partial<PromoLine>) =>
      dispatch({ type: "edit", id, patch }),
    []
  );

  const onToggleSelect = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onToggleGroup = React.useCallback((ids: string[], select: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (select) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  if (!access.canView) {
    return <AccessDenied note={access.note} />;
  }

  // Bulk «В рекламу»: КМ toggles the recommendation, Маркетинг toggles its selection.
  const bulkField: keyof PromoLine = access.marketingFlagOnly
    ? "advSelectedMarketing"
    : "advRecommendedKm";
  const bulkLabel = access.marketingFlagOnly
    ? "В рекламу (маркетинг)"
    : "В рекламу (КМ)";

  const applyBulk = (value: boolean) => {
    const ids = [...selectedIds];
    dispatch({ type: "bulkAdv", ids, field: bulkField, value });
    toast.success(
      `${value ? "Отмечено" : "Снято"}: «${bulkLabel}» для ${ids.length} ${pluralLines(ids.length)}`
    );
    setSelectedIds(new Set());
  };

  const saveDraft = () => toast.success("Черновик сохранён");
  const submitForApproval = () =>
    toast.success("Отправлено на согласование старшему КМ");

  const phaseToast = () =>
    toast.info(
      "Действие появится на следующем шаге сборки полного календаря (S2)."
    );

  const canSubmit = access.canEditOwnLines && invalidLines === 0;

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
                {totalLines.toLocaleString("ru-RU")} строк
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

          {/* Bulk-select strip — appears once rows are selected (editor roles only). */}
          {editorMode && selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-[#FFD60A]/10 px-3 py-2 text-sm">
              <span className="font-medium text-gray-900">
                Выбрано {selectedIds.size} {pluralLines(selectedIds.size)}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{bulkLabel}:</span>
              <Button size="sm" variant="secondary" onClick={() => applyBulk(true)}>
                <Check className="size-4" />
                Отметить
              </Button>
              <Button size="sm" variant="ghost" onClick={() => applyBulk(false)}>
                Снять
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-muted-foreground"
                onClick={() => setSelectedIds(new Set())}
              >
                <X className="size-4" />
                Сбросить выбор
              </Button>
            </div>
          )}

          <FullCalendarGrid
            campaigns={filtered}
            visibleGroups={visibleGroups}
            access={access}
            linesFor={linesFor}
            onEdit={onEdit}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onToggleGroup={onToggleGroup}
          />
        </div>
      </div>

      {/* Sticky bottom action bar (fixed footer) — flush to the main edges. */}
      <div className="-mx-3 -mb-3 shrink-0 border-t bg-white px-3 py-3 md:-mx-4 md:-mb-4 md:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {invalidLines > 0 ? (
              <span className="text-red-600">
                {invalidLines} {pluralLines(invalidLines)}: не заполнены
                обязательные поля
              </span>
            ) : (
              "Все обязательные поля заполнены"
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={saveDraft}
              disabled={!access.canEditOwnLines}
              className="min-h-11 sm:min-h-9"
            >
              Сохранить черновик
            </Button>
            <SubmitButton
              canSubmit={canSubmit}
              canEdit={access.canEditOwnLines}
              invalidLines={invalidLines}
              onClick={submitForApproval}
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
  invalidLines,
  onClick,
}: {
  canSubmit: boolean;
  canEdit: boolean;
  invalidLines: number;
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
    : `Заполните обязательные поля (${invalidLines} ${pluralLines(invalidLines)})`;
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
