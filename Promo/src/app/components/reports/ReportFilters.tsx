"use client";

// S5 — «Отчёты смежным отделам» rework (E-1 §1): a collapsible per-column typed
// filter panel. One control per visible report column (typed by `column.kind`),
// plus two synthetic filters («Изменение», «Ознакомление») that read derived
// per-line state rather than a column value. Markup follows the established
// grouped-filter-panel style in short-calendar/CalendarFilters.tsx (labels,
// Group blocks, Popover+Command multi-selects with native-<button> triggers —
// see short-calendar/PromoNoFilter.tsx for the Radix-defer-rule precedent).

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { buttonVariants } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@texnomart/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@texnomart/ui/command";
import { Card } from "@texnomart/ui/card";
import type { PromoCampaign, PromoLine } from "../../../lib/promo-mock-data";
import type { ReportColumn } from "./reportFields";

// ── filter model + logic ──────────────────────────────────────────────────────

export interface ColumnFilter {
  text?: string; // substring search (text columns)
  selected?: string[]; // enum multi-select (priznak/type) OR check ("yes"/"no")
  min?: number; // numeric range
  max?: number;
  from?: string; // yyyy-mm-dd (date range)
  to?: string;
}
export interface ReportFilterState {
  columns: Record<string, ColumnFilter>;
  change: string[]; // subset of ["added","changed","excluded","none"]
  ack: "all" | "acked" | "unacked";
}
export const EMPTY_REPORT_FILTERS: ReportFilterState = { columns: {}, change: [], ack: "all" };

// columns treated as enum multi-selects (low-cardinality); all other text = search
const ENUM_COLUMN_IDS = new Set(["priznak", "type"]);

function parseNum(s: string): number | null {
  const cleaned = s.replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}
function parseRuDate(s: string): number | null {
  const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime() : null;
}
function parseIsoLocal(s: string): number | null {
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() : null;
}

export function countActiveReportFilters(s: ReportFilterState): number {
  let n = 0;
  if (s.change.length) n++;
  if (s.ack !== "all") n++;
  for (const f of Object.values(s.columns)) {
    if (f.text?.trim()) n++;
    else if (f.selected?.length) n++;
    else if (f.min != null || f.max != null) n++;
    else if (f.from || f.to) n++;
  }
  return n;
}

export function applyReportFilters(
  lines: PromoLine[],
  columns: ReportColumn[],
  campaign: PromoCampaign,
  state: ReportFilterState,
  changeKind: (lineId: string) => "added" | "changed" | "excluded" | null,
  isAcked: (lineId: string) => boolean
): PromoLine[] {
  const colById = new Map(columns.map((c) => [c.id, c]));
  return lines.filter((line) => {
    if (state.change.length) {
      const k = changeKind(line.id) ?? "none";
      if (!state.change.includes(k)) return false;
    }
    if (state.ack !== "all") {
      const acked = isAcked(line.id);
      if (state.ack === "acked" && !acked) return false;
      if (state.ack === "unacked" && acked) return false;
    }
    for (const [id, f] of Object.entries(state.columns)) {
      const col = colById.get(id);
      if (!col) continue;
      const raw = col.value(line, campaign);
      if (col.kind === "check") {
        if (f.selected?.length) {
          const b = raw === true ? "yes" : "no";
          if (!f.selected.includes(b)) return false;
        }
        continue;
      }
      const sv = String(raw);
      if (col.kind === "text") {
        if (f.selected?.length) {
          if (!f.selected.includes(sv)) return false;
        } else if (f.text?.trim()) {
          if (!sv.toLowerCase().includes(f.text.trim().toLowerCase())) return false;
        }
        continue;
      }
      if (col.kind === "money" || col.kind === "number" || col.kind === "percent") {
        const n = parseNum(sv);
        if (f.min != null && (n == null || n < f.min)) return false;
        if (f.max != null && (n == null || n > f.max)) return false;
        continue;
      }
      if (col.kind === "date") {
        const t = parseRuDate(sv);
        if (f.from) {
          const ft = parseIsoLocal(f.from);
          if (ft != null && (t == null || t < ft)) return false;
        }
        if (f.to) {
          const tt = parseIsoLocal(f.to);
          if (tt != null && (t == null || t > tt + 86_400_000 - 1)) return false;
        }
      }
    }
    return true;
  });
}

// ── synthetic-filter options ───────────────────────────────────────────────────

const CHANGE_OPTIONS: { value: string; label: string }[] = [
  { value: "added", label: "Добавлено" },
  { value: "changed", label: "Изменено" },
  { value: "excluded", label: "Исключено" },
  { value: "none", label: "Без изменений" },
];

// ── small local building blocks (mirrors CalendarFilters' Group/FilterSelect) ──

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {title}
      </span>
      <div className="flex flex-wrap items-end gap-2">{children}</div>
    </div>
  );
}

/** Multi-select toggle chips for «Изменение» — plain buttons, no Popover needed. */
function ChangeChips({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  }
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">Изменение</span>
      <div className="flex flex-wrap gap-1.5">
        {CHANGE_OPTIONS.map((o) => {
          const active = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              className={cn(
                "h-8 rounded-full border px-3 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-gray-200 dark:border-border bg-white dark:bg-card text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-muted/40"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </label>
  );
}

/** Enum multi-select (priznak/type) — Popover+Command checkbox list, native
 * <button> trigger + `buttonVariants` (Radix defer rule — the shared <Button>
 * is not forwardRef, so it must not sit under a Popover `asChild` trigger). */
function EnumMultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  }
  const triggerLabel =
    selected.length === 0
      ? "Все"
      : selected.length === 1
        ? selected[0]
        : `Выбрано: ${selected.length}`;

  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Фильтр по «${label}»`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 w-[170px] justify-between bg-white font-normal dark:bg-card"
            )}
          >
            <span className={cn("truncate", selected.length === 0 && "text-muted-foreground")}>
              {triggerLabel}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Поиск…" className="h-9" />
            <CommandList>
              <CommandEmpty>Ничего не найдено</CommandEmpty>
              <CommandGroup>
                {options.map((o) => {
                  const checked = selected.includes(o);
                  return (
                    <CommandItem key={o} value={o} onSelect={() => toggle(o)} className="gap-2">
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-gray-300 dark:border-gray-600"
                        )}
                      >
                        {checked && <Check className="size-3" />}
                      </span>
                      <span className="truncate text-sm">{o}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
          {selected.length > 0 && (
            <div className="border-t p-1">
              <button
                type="button"
                onClick={() => onChange([])}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "h-7 w-full justify-start text-xs text-muted-foreground"
                )}
              >
                Очистить выбор ({selected.length})
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </label>
  );
}

// ── panel ───────────────────────────────────────────────────────────────────────

export function ReportFilters({
  columns,
  lines,
  campaign,
  state,
  onChange,
  open,
}: {
  columns: ReportColumn[];
  lines: PromoLine[];
  campaign: PromoCampaign;
  state: ReportFilterState;
  onChange: (s: ReportFilterState) => void;
  open: boolean;
}): JSX.Element | null {
  // Distinct values for every ENUM column, derived from the currently visible lines.
  const enumOptions = React.useMemo(() => {
    const map = new Map<string, string[]>();
    for (const col of columns) {
      if (!ENUM_COLUMN_IDS.has(col.id)) continue;
      const set = new Set<string>();
      for (const l of lines) set.add(String(col.value(l, campaign)));
      map.set(col.id, [...set].sort((a, b) => a.localeCompare(b, "ru")));
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, lines, campaign]);

  // Group columns by `column.group`, merging only ADJACENT same-label runs —
  // mirrors ReportBandTable's own group-header computation so a repeated label
  // (e.g. «Товар» appearing again after «Рассрочка») renders as its own block.
  const grouped = React.useMemo(() => {
    const out: { label: string; columns: ReportColumn[] }[] = [];
    for (const c of columns) {
      const label = c.group ?? "";
      const last = out[out.length - 1];
      if (last && last.label === label) last.columns.push(c);
      else out.push({ label, columns: [c] });
    }
    return out;
  }, [columns]);

  if (!open) return null;

  function updateColumn(id: string, patch: Partial<ColumnFilter>) {
    const current = state.columns[id] ?? {};
    onChange({
      ...state,
      columns: { ...state.columns, [id]: { ...current, ...patch } },
    });
  }

  function renderColumnControl(col: ReportColumn) {
    const filter = state.columns[col.id] ?? {};

    if (ENUM_COLUMN_IDS.has(col.id)) {
      return (
        <EnumMultiSelect
          key={col.id}
          label={col.label}
          options={enumOptions.get(col.id) ?? []}
          selected={filter.selected ?? []}
          onChange={(v) => updateColumn(col.id, { selected: v })}
        />
      );
    }

    if (col.kind === "check") {
      const value = filter.selected?.length ? filter.selected[0] : "all";
      return (
        <label key={col.id} className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">{col.label}</span>
          <Select
            value={value}
            onValueChange={(v) => updateColumn(col.id, { selected: v === "all" ? [] : [v] })}
          >
            <SelectTrigger className="h-8 w-[130px] bg-white text-sm dark:bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="yes">Да</SelectItem>
              <SelectItem value="no">Нет</SelectItem>
            </SelectContent>
          </Select>
        </label>
      );
    }

    if (col.kind === "money" || col.kind === "number" || col.kind === "percent") {
      return (
        <label key={col.id} className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">{col.label}</span>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              inputMode="numeric"
              value={filter.min ?? ""}
              onChange={(e) =>
                updateColumn(col.id, {
                  min: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              placeholder="от"
              className="h-8 w-[80px] bg-white text-sm dark:bg-card"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="number"
              inputMode="numeric"
              value={filter.max ?? ""}
              onChange={(e) =>
                updateColumn(col.id, {
                  max: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              placeholder="до"
              className="h-8 w-[80px] bg-white text-sm dark:bg-card"
            />
          </div>
        </label>
      );
    }

    if (col.kind === "date") {
      return (
        <label key={col.id} className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">{col.label}</span>
          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={filter.from ?? ""}
              onChange={(e) => updateColumn(col.id, { from: e.target.value || undefined })}
              className="h-8 w-[140px] bg-white text-sm dark:bg-card"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="date"
              value={filter.to ?? ""}
              onChange={(e) => updateColumn(col.id, { to: e.target.value || undefined })}
              className="h-8 w-[140px] bg-white text-sm dark:bg-card"
            />
          </div>
        </label>
      );
    }

    // plain "text" column — substring search
    return (
      <label key={col.id} className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-muted-foreground">{col.label}</span>
        <Input
          value={filter.text ?? ""}
          onChange={(e) => updateColumn(col.id, { text: e.target.value || undefined })}
          placeholder={col.label}
          className="h-8 w-[170px] bg-white text-sm dark:bg-card"
        />
      </label>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
          {/* ── synthetic filters ────────────────────────────────────────── */}
          <Group title="Изменение / Ознакомление">
            <ChangeChips
              selected={state.change}
              onChange={(v) => onChange({ ...state, change: v })}
            />
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">Ознакомление</span>
              <Select
                value={state.ack}
                onValueChange={(v) => onChange({ ...state, ack: v as ReportFilterState["ack"] })}
              >
                <SelectTrigger className="h-8 w-[160px] bg-white text-sm dark:bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="acked">Ознакомлен</SelectItem>
                  <SelectItem value="unacked">Не ознакомлен</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </Group>

          {/* ── per-column filters, grouped like the report table itself ───── */}
          {grouped.map((g, i) => (
            <React.Fragment key={`${g.label}-${i}`}>
              <div className="hidden self-stretch border-l border-gray-200 lg:block dark:border-border" />
              <Group title={g.label || "Прочее"}>{g.columns.map(renderColumnControl)}</Group>
            </React.Fragment>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onChange(EMPTY_REPORT_FILTERS)}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-8 text-xs text-gray-500 dark:text-gray-400"
            )}
          >
            <X className="mr-1 size-3" />
            Сбросить фильтры
          </button>
        </div>
      </div>
    </Card>
  );
}
