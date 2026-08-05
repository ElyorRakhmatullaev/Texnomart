"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { eachDayOfInterval, format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@texnomart/ui/dialog";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import {
  CATEGORY_MANAGERS,
  NOMENCLATURE,
  formatPromoNo,
  type CategoryDistributionEntry,
  type PromoCampaign,
} from "../../../lib/promo-mock-data";
import { toDateOnly, parseDateOnly } from "../../../lib/distribution-store";

/** Черновик строки формы — даты держим строкой «YYYY-MM-DD», как в Select. */
interface RowDraft {
  date: string;
  category: string;
  responsibleKmId: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: PromoCampaign | null;
  /** Текущее распределение акции (сид или введённое ранее). */
  initial: CategoryDistributionEntry[];
  onSave: (entries: CategoryDistributionEntry[]) => void;
  /** Убрать распределение целиком — акция живёт по общей логике. */
  onClear: () => void;
}

/**
 * Волна 6 (строки 73–74 трекера) — «Распределить по КМ / по категориям».
 * Необязательное действие коммерческого директора на этапе согласования плана:
 * какие категории участвуют в какие дни и кто из КМ за них отвечает.
 *
 * Даты подтягиваются из периода акции (стр. 73 п. 5), КМ — из справочника,
 * категория вводится вручную с подсказками из существующих данных (стр. 74 п. 4).
 */
export function CategoryDistributionDialog({
  open,
  onOpenChange,
  campaign,
  initial,
  onSave,
  onClear,
}: Props) {
  const [rows, setRows] = React.useState<RowDraft[]>([]);

  React.useEffect(() => {
    if (!open || !campaign) return;
    setRows(
      initial.map((e) => ({
        date: toDateOnly(e.date),
        category: e.category,
        responsibleKmId: e.responsibleKmId,
      }))
    );
    // `initial` пересобирается на каждом рендере родителя — ключом берём id акции.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, campaign?.id]);

  /** Дни периода акции — «автоматическое подтягивание дат из периода». */
  const days = React.useMemo(() => {
    if (!campaign) return [];
    return eachDayOfInterval({ start: campaign.startDate, end: campaign.endDate });
  }, [campaign]);

  /** Подсказки категорий: справочник КМ + категории номенклатуры. Ввод остаётся свободным. */
  const categorySuggestions = React.useMemo(() => {
    const set = new Set<string>();
    for (const km of CATEGORY_MANAGERS) set.add(km.category);
    for (const item of NOMENCLATURE) if (item.category) set.add(item.category);
    return [...set].sort((a, b) => a.localeCompare(b, "ru"));
  }, []);

  const error = React.useMemo(() => {
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.date || !r.category.trim() || !r.responsibleKmId) {
        return "Заполните дату, категорию и ответственного КМ во всех строках.";
      }
      const key = `${r.date}|${r.category.trim().toLowerCase()}`;
      if (seen.has(key)) {
        return "Категория уже распределена на эту дату — уберите дубль.";
      }
      seen.add(key);
    }
    return null;
  }, [rows]);

  if (!campaign) return null;

  const addRow = () =>
    setRows((p) => [
      ...p,
      { date: days[0] ? toDateOnly(days[0]) : "", category: "", responsibleKmId: "" },
    ]);

  const patch = (i: number, next: Partial<RowDraft>) =>
    setRows((p) => p.map((r, j) => (j === i ? { ...r, ...next } : r)));

  const submit = () => {
    if (error) return;
    onSave(
      rows.map((r) => ({
        date: parseDateOnly(r.date),
        category: r.category.trim(),
        responsibleKmId: r.responsibleKmId,
      }))
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Распределение по категориям</DialogTitle>
          <DialogDescription>
            {formatPromoNo(campaign.id)} · {campaign.name} ·{" "}
            {format(campaign.startDate, "dd.MM.yyyy")} —{" "}
            {format(campaign.endDate, "dd.MM.yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          <p className="text-xs text-muted-foreground">
            Распределение необязательно: если оставить его пустым, акция отображается по
            общей логике — без привязки категорий к дням и ответственным КМ.
          </p>

          {rows.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-200 dark:border-border px-3 py-6 text-center text-sm text-muted-foreground">
              Распределение не задано.
            </p>
          )}

          {rows.map((r, i) => (
            <div
              key={i}
              className="grid gap-2 rounded-lg border border-gray-200 dark:border-border p-2.5 sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">День участия</Label>
                <Select value={r.date} onValueChange={(v) => patch(i, { date: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Дата" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((d) => {
                      const value = toDateOnly(d);
                      return (
                        <SelectItem key={value} value={value}>
                          {format(d, "EEEEEE", { locale: ru })} · {format(d, "dd.MM.yyyy")}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground" htmlFor={`cat-${i}`}>
                  Категория
                </Label>
                <Input
                  id={`cat-${i}`}
                  list="distribution-categories"
                  value={r.category}
                  placeholder="Например, Смартфоны и гаджеты"
                  onChange={(e) => patch(i, { category: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Ответственный КМ</Label>
                <Select
                  value={r.responsibleKmId}
                  onValueChange={(v) => patch(i, { responsibleKmId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите КМ" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_MANAGERS.map((km) => (
                      <SelectItem key={km.id} value={km.id}>
                        {km.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Удалить строку распределения"
                  onClick={() => setRows((p) => p.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}

          <datalist id="distribution-categories">
            {categorySuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addRow}>
            <Plus className="size-4" /> Добавить строку
          </Button>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={rows.length === 0 && initial.length === 0}
            onClick={onClear}
          >
            Очистить распределение
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="button" disabled={!!error} onClick={submit}>
              Сохранить
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
