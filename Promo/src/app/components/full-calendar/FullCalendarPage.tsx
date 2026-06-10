"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Ban,
  Check,
  Clock,
  Copy,
  Info,
  Plus,
  RefreshCw,
  Send,
  Upload,
  X,
} from "lucide-react";
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
import { AddNomenclatureDialog } from "./AddNomenclatureDialog";
import { ExcelImportDialog } from "./ExcelImportDialog";
import { DEFAULT_VISIBLE_GROUPS, type ColumnGroupKey } from "./gridFields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@texnomart/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@texnomart/ui/alert";
import {
  CAMPAIGNS,
  CATEGORY_MANAGERS,
  PROMO_LINES,
  PROMO_TYPES,
  createImportedLine,
  createPromoLine,
  detectDuplicate,
  getCampaignsWithLines,
  getFullCalendarAccess,
  getNomenclatureItem,
  isLineValid,
  parseImportCsv,
  type DuplicateHit,
  type ImportParseResult,
  type ParsedImportRow,
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
  | { type: "add"; line: PromoLine }
  | { type: "addMany"; lines: PromoLine[] }
  | { type: "recheck1C" }
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
    case "add": {
      const next = new Map(state);
      next.set(action.line.id, action.line);
      return next;
    }
    case "addMany": {
      const next = new Map(state);
      for (const line of action.lines) next.set(line.id, line);
      return next;
    }
    case "recheck1C": {
      // Mock 1С re-check: every pending row passes and clears its badge (§8.3).
      const next = new Map(state);
      for (const [id, l] of next) {
        if (l.pending1CCheck) next.set(id, { ...l, pending1CCheck: false });
      }
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

  // Nomenclature-entry state (§8.2.1): which campaign's add-picker is open, which
  // line's gift-picker is open, and a pending duplicate awaiting confirmation.
  const [addCampaignId, setAddCampaignId] = React.useState<string | null>(null);
  const [giftLineId, setGiftLineId] = React.useState<string | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [pendingDup, setPendingDup] = React.useState<{
    campaignId: string;
    kmId: string;
    nomenclatureId: string;
    hit: DuplicateHit;
  } | null>(null);

  // Clear any selection when the role changes (gating differs per role).
  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [currentRole]);

  const campaignsById = React.useMemo(
    () => new Map(CAMPAIGNS.map((c) => [c.id, c])),
    []
  );

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

  // Lines saved as draft awaiting a 1С re-check (§8.3) — block send until cleared.
  const pending1CCount = React.useMemo(() => {
    let n = 0;
    for (const c of filtered) {
      for (const l of linesFor(c.id)) if (l.pending1CCheck) n++;
    }
    return n;
  }, [filtered, linesFor]);

  // Campaigns the КМ can import into (visible + non-cancelled).
  const importTargets = React.useMemo(
    () => filtered.filter((c) => !c.cancelled),
    [filtered]
  );

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

  // ── Nomenclature entry (§8.2.1) ──────────────────────────────────────────────
  // КМ for a new line: no per-person identity in the mock, so we attach the line
  // to the campaign's first existing КМ (else its first participant / a default).
  const kmForCampaign = React.useCallback(
    (campaignId: string): string => {
      const existing = lines.values();
      for (const l of existing) if (l.campaignId === campaignId) return l.kmId;
      const c = campaignsById.get(campaignId);
      return c?.participatingKmIds[0] ?? CATEGORY_MANAGERS[0].id;
    },
    [lines, campaignsById]
  );

  const commitAdd = React.useCallback(
    (campaignId: string, nomenclatureId: string, hit: DuplicateHit | null) => {
      const kmId = kmForCampaign(campaignId);
      const line = createPromoLine(campaignId, kmId, nomenclatureId);
      if (hit) {
        line.duplicate = true;
        line.duplicateInfo = hit;
        line.history = [
          {
            what: "Добавлен дубль номенклатуры",
            promoId: hit.promoId,
            promoName: hit.promoName,
            overlap: hit.overlap,
            user: currentRole,
            at: new Date().toISOString(),
          },
        ];
      }
      dispatch({ type: "add", line });
      const name = getNomenclatureItem(nomenclatureId)?.name ?? nomenclatureId;
      toast.success(`${hit ? "Дубль добавлен" : "Номенклатура добавлена"}: ${name}`);
    },
    [kmForCampaign, currentRole]
  );

  // Picking a nomenclature for the add-picker: run duplicate detection first.
  const onPickForAdd = React.useCallback(
    (nomenclatureId: string) => {
      const campaignId = addCampaignId;
      if (!campaignId) return;
      const campaign = campaignsById.get(campaignId);
      if (!campaign) return;
      const hit = detectDuplicate(
        nomenclatureId,
        campaign,
        [...lines.values()],
        campaignsById
      );
      if (hit) {
        // Don't block — ask for confirmation, then mark «дубль» (§8.2.1).
        setPendingDup({
          campaignId,
          kmId: kmForCampaign(campaignId),
          nomenclatureId,
          hit,
        });
      } else {
        commitAdd(campaignId, nomenclatureId, null);
      }
    },
    [addCampaignId, campaignsById, lines, kmForCampaign, commitAdd]
  );

  const confirmDup = () => {
    if (!pendingDup) return;
    commitAdd(pendingDup.campaignId, pendingDup.nomenclatureId, pendingDup.hit);
    setPendingDup(null);
  };

  // Defer the open past the current click: a controlled Radix dialog opened from an
  // outside button (no DialogTrigger to exclude it) is otherwise dismissed by the
  // same pointer interaction. setTimeout(0) lets the click fully settle first.
  const onAddRequest = React.useCallback((campaignId: string) => {
    setTimeout(() => setAddCampaignId(campaignId), 0);
  }, []);

  const onGiftPick = React.useCallback((lineId: string) => {
    setTimeout(() => setGiftLineId(lineId), 0);
  }, []);

  const onPickForGift = React.useCallback(
    (nomenclatureId: string) => {
      if (!giftLineId) return;
      const nom = getNomenclatureItem(nomenclatureId);
      dispatch({
        type: "edit",
        id: giftLineId,
        patch: { giftNomenclatureId: nomenclatureId, giftStock: nom?.stock },
      });
      toast.success(`Подарок выбран: ${nom?.name ?? nomenclatureId}`);
    },
    [giftLineId]
  );

  // ── Excel import + 1С availability (§8.2.1 / §8.3) ───────────────────────────
  const onImportRequest = React.useCallback(() => {
    setTimeout(() => setImportOpen(true), 0);
  }, []);

  // Validate a pasted/dropped CSV against the live store (pure preview).
  const validateImport = React.useCallback(
    (cid: string, text: string): ImportParseResult => {
      const campaign = campaignsById.get(cid);
      if (!campaign) return { rows: [], structureError: "Акция не найдена." };
      return parseImportCsv(text, campaign, [...lines.values()], campaignsById);
    },
    [campaignsById, lines]
  );

  const onImport = React.useCallback(
    (cid: string, rows: ParsedImportRow[]) => {
      const kmId = kmForCampaign(cid);
      const created = rows.map((r) => createImportedLine(cid, kmId, r));
      dispatch({ type: "addMany", lines: created });
      const dupCount = created.filter((l) => l.duplicate).length;
      toast.success(
        `Импортировано строк: ${created.length}` +
          (dupCount ? ` (из них дублей: ${dupCount})` : "") +
          ". Ожидают проверки 1С."
      );
    },
    [kmForCampaign]
  );

  const recheck1C = () => {
    dispatch({ type: "recheck1C" });
    toast.success("Проверка 1С пройдена — данные подтверждены.");
  };

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

  const canSubmit =
    access.canEditOwnLines && invalidLines === 0 && pending1CCount === 0;

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
                  <Button variant="secondary" onClick={onImportRequest}>
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

          {/* 1С availability (§8.3) — non-blocking; send is gated until re-check passes. */}
          {pending1CCount > 0 && (
            <Alert variant="warning">
              <Clock className="size-4" />
              <AlertTitle>Ожидают проверки 1С: {pending1CCount}</AlertTitle>
              <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Данные сохранены как черновик. Отправка на согласование недоступна,
                  пока не пройдена повторная проверка в 1С.
                </span>
                {access.canEditOwnLines && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shrink-0"
                    onClick={recheck1C}
                  >
                    <RefreshCw className="size-4" />
                    Повторить проверку 1С
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          <FullCalendarGrid
            campaigns={filtered}
            visibleGroups={visibleGroups}
            access={access}
            linesFor={linesFor}
            onEdit={onEdit}
            onAddRequest={onAddRequest}
            onGiftPick={onGiftPick}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onToggleGroup={onToggleGroup}
          />
        </div>
      </div>

      {/* Add-a-line picker (§8.2.1) — searchable 1С reference, no free-text. */}
      <AddNomenclatureDialog
        open={addCampaignId !== null}
        onOpenChange={(open) => !open && setAddCampaignId(null)}
        title="Добавить номенклатуру"
        description="Выберите товар из справочника 1С — свободный ввод недоступен."
        onPick={onPickForAdd}
      />

      {/* Gift-nomenclature picker (§8.8) — same 1С reference. */}
      <AddNomenclatureDialog
        open={giftLineId !== null}
        onOpenChange={(open) => !open && setGiftLineId(null)}
        title="Выбор подарочной номенклатуры"
        description="Выберите подарочный товар из справочника 1С."
        onPick={onPickForGift}
      />

      {/* Excel/CSV bulk import (§8.2.1). */}
      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        campaigns={importTargets}
        validate={validateImport}
        onImport={onImport}
      />

      {/* Duplicate-confirmation dialog (§8.2.1) — adding is NOT blocked. */}
      <Dialog
        open={pendingDup !== null}
        onOpenChange={(open) => !open && setPendingDup(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Дубль номенклатуры</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Данная номенклатура уже участвует в промо-акции. Вы уверены, что
                  хотите добавить дубль?
                </p>
                {pendingDup && (
                  <div className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
                    {pendingDup.hit.samePromo ? (
                      <span>Уже добавлена в эту акцию ({pendingDup.campaignId}).</span>
                    ) : (
                      <span>
                        Уже участвует в акции {pendingDup.hit.promoId} «
                        {pendingDup.hit.promoName}».
                      </span>
                    )}
                    {pendingDup.hit.overlap && (
                      <span className="mt-0.5 block">
                        Пересечение периодов: {pendingDup.hit.overlap}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-muted-foreground">
                  Отметка «дубль» останется видна проверяющим, запись добавится в
                  историю строки.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPendingDup(null)}>
              Отмена
            </Button>
            <Button onClick={confirmDup}>
              <Copy className="size-4" />
              Добавить дубль
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sticky bottom action bar (fixed footer) — flush to the main edges. */}
      <div className="-mx-3 -mb-3 shrink-0 border-t bg-white px-3 py-3 md:-mx-4 md:-mb-4 md:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {invalidLines > 0 ? (
              <span className="text-red-600">
                {invalidLines} {pluralLines(invalidLines)}: не заполнены
                обязательные поля
              </span>
            ) : pending1CCount > 0 ? (
              <span className="text-amber-700">
                {pending1CCount} {pluralLines(pending1CCount)} ожидают проверки 1С
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
              reason={
                !access.canEditOwnLines
                  ? "Доступно только для категорийного менеджера, заполняющего свои строки"
                  : invalidLines > 0
                    ? `Заполните обязательные поля (${invalidLines} ${pluralLines(invalidLines)})`
                    : pending1CCount > 0
                      ? `Дождитесь проверки 1С (${pending1CCount} ${pluralLines(pending1CCount)})`
                      : ""
              }
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
  reason,
  onClick,
}: {
  canSubmit: boolean;
  reason: string;
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
