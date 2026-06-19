"use client";

import * as React from "react";
import { ChevronsLeftRight, ChevronsRightLeft, X } from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import { Switch } from "@texnomart/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import {
  CATEGORY_MANAGERS,
  PROMO_TYPES,
  type PromoCampaign,
} from "../../../lib/promo-mock-data";

// Filters split by purpose (client feedback §1): operational (№ промо, тип, КМ,
// статус КМ по акции) · control (период-диапазон, общий статус акции) · distribution
// (день недели, категория, ответственный КМ по категории). Order mirrors the table.

export const ALL = "all";

export interface CalendarFilterValues {
  // Операционные
  promoId: string;
  type: string;
  km: string;
  kmStatus: string;
  // Контрольные
  periodFrom: string; // yyyy-mm-dd
  periodTo: string; // yyyy-mm-dd
  status: string;
  // Распределение по категориям
  distWeekday: string; // Date.getDay() as string, or ALL
  distCategory: string;
  distKm: string;
}

export const DEFAULT_FILTER_VALUES: CalendarFilterValues = {
  promoId: "",
  type: ALL,
  km: ALL,
  kmStatus: ALL,
  periodFrom: "",
  periodTo: "",
  status: ALL,
  distWeekday: ALL,
  distCategory: ALL,
  distKm: ALL,
};

/** True when any distribution filter is set — used to auto-expand the block. */
export function hasDistributionFilter(v: CalendarFilterValues): boolean {
  return (
    v.distWeekday !== ALL || v.distCategory !== ALL || v.distKm !== ALL
  );
}

export function isFilterActive(v: CalendarFilterValues): boolean {
  return (
    v.promoId.trim() !== "" ||
    v.type !== ALL ||
    v.km !== ALL ||
    v.kmStatus !== ALL ||
    v.periodFrom !== "" ||
    v.periodTo !== "" ||
    v.status !== ALL ||
    hasDistributionFilter(v)
  );
}

const KM_STATUSES: string[] = [
  "Не заполнено / Ожидание корректировки от КМ",
  "На согласовании у старшего КМ",
  "Согласовано старшим КМ (ожидает КД)",
  "На согласовании у коммерческого директора",
  "Принято коммерческим директором",
  "Не участвует",
];

const CAMPAIGN_STATUSES: string[] = [
  "На согласовании у старшего КМ",
  "На согласовании у коммерческого директора",
  "Переотправлено на корректировку КМ",
  "Согласовано и отправлено смежным отделам",
  "Отменена",
];

// Пн..Вс mapped to Date.getDay() (Sun = 0).
const WEEKDAYS: Array<{ value: string; label: string }> = [
  { value: "1", label: "Понедельник" },
  { value: "2", label: "Вторник" },
  { value: "3", label: "Среда" },
  { value: "4", label: "Четверг" },
  { value: "5", label: "Пятница" },
  { value: "6", label: "Суббота" },
  { value: "0", label: "Воскресенье" },
];

interface Option {
  value: string;
  label: string;
}

function FilterSelect({
  label,
  placeholder,
  value,
  onChange,
  options,
  width = "w-[170px]",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  width?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn("h-8 bg-white text-sm", width)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{placeholder}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </span>
      <div className="flex flex-wrap items-end gap-2">{children}</div>
    </div>
  );
}

interface CalendarFiltersProps {
  values: CalendarFilterValues;
  onChange: <K extends keyof CalendarFilterValues>(
    key: K,
    value: CalendarFilterValues[K]
  ) => void;
  onClear: () => void;
  hideCancelled: boolean;
  onHideCancelledChange: (v: boolean) => void;
  distExpanded: boolean;
  onDistExpandedChange: (v: boolean) => void;
  /** Campaigns the option lists are derived from (distinct categories). */
  campaigns: PromoCampaign[];
}

export function CalendarFilters({
  values,
  onChange,
  onClear,
  hideCancelled,
  onHideCancelledChange,
  distExpanded,
  onDistExpandedChange,
  campaigns,
}: CalendarFiltersProps) {
  const categoryOptions: Option[] = React.useMemo(() => {
    const set = new Set<string>();
    for (const c of campaigns)
      for (const e of c.categoryDistribution ?? []) set.add(e.category);
    return [...set].sort().map((c) => ({ value: c, label: c }));
  }, [campaigns]);

  const typeOptions = PROMO_TYPES.map((t) => ({ value: t.name, label: t.name }));
  const kmOptions = CATEGORY_MANAGERS.map((k) => ({ value: k.id, label: k.name }));
  const kmStatusOptions = KM_STATUSES.map((s) => ({ value: s, label: s }));
  const statusOptions = CAMPAIGN_STATUSES.map((s) => ({ value: s, label: s }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
        {/* ── Операционные ─────────────────────────────────────────── */}
        <Group title="Операционные">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              № промо
            </span>
            <Input
              value={values.promoId}
              onChange={(e) => onChange("promoId", e.target.value)}
              placeholder="PR-2026-…"
              className="h-8 w-[140px] bg-white text-sm"
            />
          </label>
          <FilterSelect
            label="Тип промо"
            placeholder="Все типы"
            value={values.type}
            onChange={(v) => onChange("type", v)}
            options={typeOptions}
          />
          <FilterSelect
            label="КМ"
            placeholder="Все КМ"
            value={values.km}
            onChange={(v) => onChange("km", v)}
            options={kmOptions}
          />
          <FilterSelect
            label="Статус КМ по акции"
            placeholder="Все статусы КМ"
            value={values.kmStatus}
            onChange={(v) => onChange("kmStatus", v)}
            options={kmStatusOptions}
            width="w-[210px]"
          />
        </Group>

        <div className="hidden self-stretch border-l border-gray-200 lg:block" />

        {/* ── Контрольные ──────────────────────────────────────────── */}
        <Group title="Контрольные">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Период акции
            </span>
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={values.periodFrom}
                onChange={(e) => onChange("periodFrom", e.target.value)}
                className="h-8 w-[140px] bg-white text-sm"
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="date"
                value={values.periodTo}
                onChange={(e) => onChange("periodTo", e.target.value)}
                className="h-8 w-[140px] bg-white text-sm"
              />
            </div>
          </label>
          <FilterSelect
            label="Общий статус акции"
            placeholder="Все статусы"
            value={values.status}
            onChange={(v) => onChange("status", v)}
            options={statusOptions}
            width="w-[210px]"
          />
        </Group>

        <div className="hidden self-stretch border-l border-gray-200 lg:block" />

        {/* ── Распределение по категориям ──────────────────────────── */}
        <Group title="Распределение по категориям">
          <FilterSelect
            label="День недели"
            placeholder="Все дни"
            value={values.distWeekday}
            onChange={(v) => onChange("distWeekday", v)}
            options={WEEKDAYS}
            width="w-[150px]"
          />
          <FilterSelect
            label="Категория"
            placeholder="Все категории"
            value={values.distCategory}
            onChange={(v) => onChange("distCategory", v)}
            options={categoryOptions}
            width="w-[190px]"
          />
          <FilterSelect
            label="Ответственный КМ"
            placeholder="Все КМ"
            value={values.distKm}
            onChange={(v) => onChange("distKm", v)}
            options={kmOptions}
          />
        </Group>
      </div>

      {/* ── Toggles + clear ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="hide-cancelled"
            checked={hideCancelled}
            onCheckedChange={onHideCancelledChange}
          />
          <Label htmlFor="hide-cancelled" className="text-sm font-normal">
            Скрыть отменённое
          </Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="hidden md:inline-flex"
          onClick={() => onDistExpandedChange(!distExpanded)}
        >
          {distExpanded ? (
            <ChevronsRightLeft className="size-4" />
          ) : (
            <ChevronsLeftRight className="size-4" />
          )}
          Распределение по категориям — {distExpanded ? "свернуть" : "развернуть"}
        </Button>
        {isFilterActive(values) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-gray-500"
            onClick={onClear}
          >
            <X className="mr-1 size-3" />
            Очистить
          </Button>
        )}
      </div>
    </div>
  );
}
