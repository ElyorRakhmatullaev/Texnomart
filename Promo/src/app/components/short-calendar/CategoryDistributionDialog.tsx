"use client";

import * as React from "react";
import { Info, Plus, Trash2 } from "lucide-react";
import { eachDayOfInterval, format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@texnomart/ui/sheet";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { DatePickerField } from "../../../components/DatePickerField";
import { parseInputDate, toInputDate } from "../../../components/date-input-value";
import { Label } from "@texnomart/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { cn } from "@texnomart/ui/utils";
import {
  CATEGORY_MANAGERS,
  formatPromoNo,
  type CategoryDistributionEntry,
  type PromoCampaign,
} from "../../../lib/promo-mock-data";
import {
  PROMO_CATEGORIES,
  toDateOnly,
  parseDateOnly,
} from "../../../lib/distribution-store";

/**
 * «11-я часть» — переработка формы Волны 6 по визуалу PM: правая панель
 * «Распределение по категориям / КМ» с двумя вариантами заполнения:
 *
 * 1. Отдельный день — «+ Добавить дату»: конкретная дата из периода акции,
 *    категория вручную, КМ из списка.
 * 2. Период — выбор под-периода внутри срока акции; система формирует все
 *    входящие в него даты, затем пара «категория + КМ», указанная один раз,
 *    применяется ко всем сформированным датам («Применить ко всем датам»).
 *    После этого любая дата правится отдельно.
 *
 * Кнопок дней недели Пн–Вс больше нет (замечания №10 и №27 п.2 от 18.08): в
 * согласованной логике распределение идёт по дате или по периоду.
 *
 * На одну дату — несколько категорий, каждая со своим ответственным КМ
 * («+ Добавить категорию / КМ на этот день»). Хранилище прежнее: плоский
 * `CategoryDistributionEntry[]`, группировка по дням — только представление.
 */

/**
 * Что распределяется: акция из сида или строка плана, созданная в сессии, —
 * форме нужны только номер, название и период.
 */
export type DistributionTarget = Pick<
  PromoCampaign,
  "id" | "name" | "startDate" | "endDate"
>;

/** Черновик строки формы — даты держим строкой «YYYY-MM-DD», как в Select. */
interface RowDraft {
  /** Стабильный ключ, чтобы перегруппировка не сбрасывала фокус с инпутов. */
  key: number;
  date: string;
  category: string;
  responsibleKmId: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: DistributionTarget | null;
  /** Текущее распределение акции (сид или введённое ранее). */
  initial: CategoryDistributionEntry[];
  onSave: (entries: CategoryDistributionEntry[]) => void;
  /** Убрать распределение целиком — акция живёт по общей логике. */
  onClear: () => void;
  /**
   * Можно ли завести категорию вручную (свободный ввод с подсказками из
   * `PROMO_CATEGORIES`). Проверка прода 14–15.09, №27 п.1: создавать категории
   * могут и директор маркетинга, и коммерческий директор; без права — выбор из
   * согласованного списка.
   */
  canCreateCategory?: boolean;
}

function weekdayHeading(date: Date): string {
  const name = format(date, "EEEE", { locale: ru });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

const dupKey = (date: string, category: string) =>
  `${date}|${category.trim().toLowerCase()}`;

/**
 * Поле категории: с правом создания — свободный ввод с подсказками, без него —
 * выбор из согласованного списка (трекер, стр. 74 пп.5–6; права — №27 п.1).
 *
 * Длинное название обрезается многоточием, полное — в подсказке: без этого
 * `whitespace-nowrap` триггера распирал колонку и сдвигал поле КМ.
 */
function CategoryField({
  id,
  value,
  options,
  canCreate,
  onChange,
}: {
  id?: string;
  value: string;
  options: string[];
  canCreate: boolean;
  onChange: (v: string) => void;
}) {
  if (canCreate) {
    return (
      <Input
        id={id}
        aria-label="Категория"
        list="distribution-categories"
        value={value}
        title={value || undefined}
        placeholder="Категория"
        className="min-w-0"
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label="Категория" title={value || undefined} className="min-w-0">
        <SelectValue placeholder="Выберите категорию">
          {value ? <span className="block min-w-0 truncate">{value}</span> : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CategoryDistributionDialog({
  open,
  onOpenChange,
  campaign,
  initial,
  onSave,
  onClear,
  canCreateCategory = false,
}: Props) {
  const keyRef = React.useRef(0);
  const newKey = () => ++keyRef.current;

  const [rows, setRows] = React.useState<RowDraft[]>([]);
  // Вариант 2 — генерация по периоду.
  const [genStart, setGenStart] = React.useState("");
  const [genEnd, setGenEnd] = React.useState("");
  // Однократные «категория + КМ», применяемые ко всем датам сразу.
  const [fillCategory, setFillCategory] = React.useState("");
  const [fillKmId, setFillKmId] = React.useState("");

  React.useEffect(() => {
    if (!open || !campaign) return;
    setRows(
      initial.map((e) => ({
        key: newKey(),
        date: toDateOnly(e.date),
        category: e.category,
        responsibleKmId: e.responsibleKmId,
      }))
    );
    setGenStart(toDateOnly(campaign.startDate));
    setGenEnd(toDateOnly(campaign.endDate));
    setFillCategory("");
    setFillKmId("");
    // `initial` пересобирается на каждом рендере родителя — ключом берём id акции.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, campaign?.id]);

  /** Дни периода акции — источник дат для «+ Добавить дату». */
  const days = React.useMemo(() => {
    if (!campaign) return [];
    return eachDayOfInterval({ start: campaign.startDate, end: campaign.endDate });
  }, [campaign]);

  /**
   * Варианты категорий — согласованный список (стр. 74 п.5) плюс значения, уже
   * назначенные этой акции ранее: иначе строка со «старой» категорией потеряла бы
   * её при первом же сохранении.
   */
  const categoryOptions = React.useMemo(() => {
    const set = new Set<string>(PROMO_CATEGORIES);
    for (const r of rows) if (r.category.trim()) set.add(r.category.trim());
    for (const e of initial) if (e.category.trim()) set.add(e.category.trim());
    return [...set];
  }, [rows, initial]);

  /** Группировка по дате для отрисовки; ISO-строки сортируются лексикографически. */
  const groups = React.useMemo(() => {
    const map = new Map<string, RowDraft[]>();
    for (const r of rows) {
      const list = map.get(r.date) ?? [];
      list.push(r);
      map.set(r.date, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  const periodError = React.useMemo(() => {
    if (!campaign) return null;
    if (!genStart || !genEnd) return "Укажите обе даты периода распределения.";
    if (genStart > genEnd) return "Начало периода позже его окончания.";
    const min = toDateOnly(campaign.startDate);
    const max = toDateOnly(campaign.endDate);
    if (genStart < min || genEnd > max)
      return "Период должен быть в пределах срока акции.";
    return null;
  }, [campaign, genStart, genEnd]);

  const error = React.useMemo(() => {
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.date || !r.category.trim() || !r.responsibleKmId) {
        return "Заполните категорию и ответственного КМ во всех строках.";
      }
      const key = dupKey(r.date, r.category);
      if (seen.has(key)) {
        return "Категория уже распределена на эту дату — уберите дубль.";
      }
      seen.add(key);
    }
    return null;
  }, [rows]);

  if (!campaign) return null;

  /**
   * Вариант 2, «Сформировать даты»: пустая строка на каждую дату выбранного
   * периода, которой в форме ещё нет.
   */
  const generateDates = () => {
    if (periodError) return;
    const picked = eachDayOfInterval({
      start: parseDateOnly(genStart),
      end: parseDateOnly(genEnd),
    });
    setRows((prev) => {
      const existingDates = new Set(prev.map((r) => r.date));
      const added = picked
        .map(toDateOnly)
        .filter((date) => !existingDates.has(date))
        .map((date) => ({ key: newKey(), date, category: "", responsibleKmId: "" }));
      return [...prev, ...added];
    });
  };

  /** Однократная пара «категория + КМ» → на все даты формы (дубли пропускаются). */
  const applyToAllDates = () => {
    const category = fillCategory.trim();
    if (!category || !fillKmId) return;
    setRows((prev) => {
      const dates = [...new Set(prev.map((r) => r.date))];
      const taken = new Set(
        prev.filter((r) => r.category.trim()).map((r) => dupKey(r.date, r.category))
      );
      // Строка без категории заполняется на месте, даже если КМ в ней уже выбран
      // (его выбор сохраняется): раньше такая строка оставалась незаполненной
      // рядом с добавленной и блокировала сохранение.
      const next = prev.map((r) => {
        if (r.category.trim()) return r;
        const key = dupKey(r.date, category);
        if (taken.has(key)) return r;
        taken.add(key);
        return { ...r, category, responsibleKmId: r.responsibleKmId || fillKmId };
      });
      const covered = new Set(
        next.filter((r) => r.category.trim()).map((r) => dupKey(r.date, r.category))
      );
      const appended = dates
        .filter((date) => !covered.has(dupKey(date, category)))
        .map((date) => ({ key: newKey(), date, category, responsibleKmId: fillKmId }));
      return [...next, ...appended];
    });
  };

  /** Вариант 1 — отдельный день: пустая строка на выбранную дату. */
  const addDate = (date: string) =>
    setRows((prev) => [
      ...prev,
      { key: newKey(), date, category: "", responsibleKmId: "" },
    ]);

  const addCategoryToDay = (date: string) =>
    setRows((prev) => [
      ...prev,
      { key: newKey(), date, category: "", responsibleKmId: "" },
    ]);

  const patch = (key: number, next: Partial<RowDraft>) =>
    setRows((p) => p.map((r) => (r.key === key ? { ...r, ...next } : r)));

  const removeRow = (key: number) =>
    setRows((p) => p.filter((r) => r.key !== key));

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

  const minDate = toDateOnly(campaign.startDate);
  const maxDate = toDateOnly(campaign.endDate);
  const canGenerate = !periodError;
  const canApplyAll = !!fillCategory.trim() && !!fillKmId && rows.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 border-b p-4 pb-3">
          <SheetTitle>Распределение по категориям / КМ</SheetTitle>
          <SheetDescription asChild>
            <span className="block rounded-lg bg-primary/10 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
              <span className="block">
                Акция: {campaign.name} ({formatPromoNo(campaign.id)})
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Период акции: {format(campaign.startDate, "dd.MM.yyyy")} —{" "}
                {format(campaign.endDate, "dd.MM.yyyy")}
              </span>
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-blue-900 dark:bg-blue-500/15 dark:text-blue-200">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              Выберите период внутри срока акции — система сформирует входящие в него
              даты. Категорию и ответственного КМ можно указать один раз для всех дат, а
              затем изменить по отдельной дате. На одну дату можно добавить несколько
              категорий, у каждой — свой ответственный КМ. Распределение необязательно:
              без него акция отображается по общей логике.
            </span>
          </div>

          {/* Шаг 1 — период распределения (вариант «на период») → генерация дат. */}
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              1. Выберите период распределения
            </h3>
            {/* У триггера DatePickerField ширина `w-full`: без ячеек flex-1 первое
                поле забирало всю строку, а «—» и второе поле уезжали за край панели. */}
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <DatePickerField
                  value={parseInputDate(genStart)}
                  minDate={parseInputDate(minDate) ?? undefined}
                  maxDate={parseInputDate(maxDate) ?? undefined}
                  onChange={(d) => setGenStart(d ? toInputDate(d) : "")}
                  placeholder="Начало периода"
                />
              </div>
              <span className="text-muted-foreground">—</span>
              <div className="min-w-0 flex-1">
                <DatePickerField
                  value={parseInputDate(genEnd)}
                  minDate={parseInputDate(genStart || minDate) ?? undefined}
                  maxDate={parseInputDate(maxDate) ?? undefined}
                  onChange={(d) => setGenEnd(d ? toInputDate(d) : "")}
                  placeholder="Окончание периода"
                />
              </div>
            </div>
            <p
              className={cn(
                "text-xs",
                periodError ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
              )}
            >
              {periodError ?? "Период должен быть в пределах срока акции."}
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Будут сформированы все даты выбранного периода; уже добавленные даты не
                дублируются.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={!canGenerate}
                onClick={generateDates}
              >
                Сформировать даты
              </Button>
            </div>
          </section>

          {/* Шаг 2 — распределение по дням. */}
          <section className="space-y-2.5">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              2. Распределите категории и ответственных КМ
            </h3>

            {/* Однократное указание пары «категория + КМ» на все даты формы. */}
            {rows.length > 0 && (
              <div className="space-y-2 rounded-lg border border-dashed border-gray-300 p-2.5 dark:border-border">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground" htmlFor="fill-cat">
                      Категория для всех дат
                    </Label>
                    <CategoryField
                      id="fill-cat"
                      value={fillCategory}
                      options={categoryOptions}
                      canCreate={canCreateCategory}
                      onChange={setFillCategory}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Ответственный КМ
                    </Label>
                    <Select value={fillKmId} onValueChange={setFillKmId}>
                      <SelectTrigger aria-label="Ответственный КМ для всех дат">
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
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canApplyAll}
                    onClick={applyToAllDates}
                  >
                    Применить ко всем датам
                  </Button>
                </div>
              </div>
            )}

            {rows.length === 0 && (
              <p className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-muted-foreground dark:border-border">
                Распределение не задано. Сформируйте даты по периоду или добавьте
                отдельную дату ниже.
              </p>
            )}

            {groups.map(([date, groupRows]) => {
              const d = parseDateOnly(date);
              return (
                <div
                  key={date}
                  className="space-y-2 rounded-lg border border-gray-200 p-2.5 dark:border-border"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {weekdayHeading(d)} · {format(d, "dd.MM.yyyy")}
                  </div>
                  {groupRows.map((r) => (
                    <div
                      key={r.key}
                      className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
                    >
                      <CategoryField
                        value={r.category}
                        options={categoryOptions}
                        canCreate={canCreateCategory}
                        onChange={(v) => patch(r.key, { category: v })}
                      />
                      <Select
                        value={r.responsibleKmId}
                        onValueChange={(v) => patch(r.key, { responsibleKmId: v })}
                      >
                        <SelectTrigger aria-label="Ответственный КМ">
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Удалить строку распределения"
                        onClick={() => removeRow(r.key)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => addCategoryToDay(date)}
                  >
                    <Plus className="size-3.5" /> Добавить категорию / КМ на этот день
                  </Button>
                </div>
              );
            })}

            {/* Вариант 1 — распределение на отдельный день. */}
            <div className="flex items-center gap-2">
              <Select value="" onValueChange={addDate}>
                <SelectTrigger className="w-full sm:w-[260px]" aria-label="Добавить дату">
                  <SelectValue placeholder="+ Добавить дату" />
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

            <datalist id="distribution-categories">
              {categoryOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            {error && rows.length > 0 && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
          </section>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t p-4">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={rows.length === 0 && initial.length === 0}
            onClick={onClear}
          >
            Очистить распределение
          </Button>
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            {/* Пустой список — валидное сохранение: «распределения нет» (не то же,
                что «Очистить», возвращающее сид). */}
            <Button type="button" disabled={!!error} onClick={submit}>
              Сохранить распределение
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
