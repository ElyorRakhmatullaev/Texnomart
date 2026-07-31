"use client";

import * as React from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  Ban,
  Check,
  Clock,
  Copy,
  Download,
  Info,
  Link2,
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
import { Switch } from "@texnomart/ui/switch";
import { Label } from "@texnomart/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@texnomart/ui/tooltip";
import { ReasonDialog } from "../../../components/ReasonDialog";
import {
  buildFullCalendarCsv,
  downloadCsv,
  exportStamp,
} from "../../../lib/promo-export";
import { PromoNoFilter } from "../short-calendar/PromoNoFilter";
import { useRole } from "../../role-context";
import { useNotifications } from "../notifications/NotificationsProvider";
import { FullCalendarGrid } from "./FullCalendarGrid";
import { ColumnGroupToggle } from "./ColumnGroupToggle";
import { AddNomenclatureDialog } from "./AddNomenclatureDialog";
import { ExcelImportDialog } from "./ExcelImportDialog";
import { CreateCampaignDialog } from "./CreateCampaignDialog";
import { LineEditSheet } from "./LineEditSheet";
import { VersionHistoryDrawer } from "../../../components/VersionHistoryDrawer";
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
  buildCampaignReport,
  buildCancellationVersion,
  buildLineRemovalVersion,
  buildSentVersion,
  canApproveLineRemoval,
  canCancelCampaign,
  canRequestLineRemoval,
  createImportedLine,
  createPromoLine,
  createUnplannedCampaign,
  detectDuplicate,
  diffCampaignChanges,
  formatPromoNo,
  getCampaignVersions,
  getCampaignsWithLines,
  getFullCalendarAccess,
  getNomenclatureItem,
  isApprovedCampaign,
  isLineValid,
  parseImportCsv,
  type CampaignChangeSet,
  type CampaignStatus,
  type CampaignVersion,
  type DuplicateHit,
  type ImportParseResult,
  type LinePendingChange,
  type ParsedImportRow,
  type PromoCampaign,
  type PromoLine,
  type UnplannedCampaignInput,
} from "../../../lib/promo-mock-data";
import {
  STATUS_FILTER_OPTIONS,
  lineDisplayStatus,
  lineHasRejection,
  matchesStatusFilter,
  mergePendingChange,
} from "../../../lib/full-calendar-status";
import {
  getSeenRejections,
  markRejectionSeen,
} from "../../../lib/full-calendar-rejection-store";
import { LineDetailsDrawer } from "./LineDetailsDrawer";
import { useCurrentUser } from "../../current-user-context";

const ALL = "all";

// 10-я часть R46 — labels/formatters for the edit→pending diff (панель «Поле/Было/Стало»).
const TRACKED_FIELD_LABEL: Partial<Record<keyof PromoLine, string>> = {
  stock: "Остаток",
  newPrice: "Новая цена",
  discountPct: "Скидка",
  salesForecast: "Прогноз продаж",
  regularSales: "Регулярные продажи",
  cashDiscountPct: "Скидка за Cash",
  supplierCompensation: "Компенсация поставщика",
  compensationLimit: "Лимит компенсации",
  utp: "УТП",
};
function fmtPendingValue(field: keyof PromoLine, v: unknown): string {
  if (v == null || v === "") return "—";
  if (field === "newPrice" || field === "supplierCompensation")
    return `${Number(v).toLocaleString("ru-RU")} сум`;
  if (field === "discountPct" || field === "cashDiscountPct") return `${v}%`;
  if (typeof v === "number") return v.toLocaleString("ru-RU");
  return String(v);
}

const FILTERS: FilterConfig[] = [
  {
    key: "type",
    label: "Тип",
    options: PROMO_TYPES.map((t) => ({ value: t.name, label: t.name })),
  },
  {
    key: "status",
    // FilterBar renders the all-option as «Все {label.toLowerCase()}» → «Все статусы»
    // (10-я Блок 7.1 wording); a selected value shows that status.
    label: "Статусы",
    options: STATUS_FILTER_OPTIONS.map((s) => ({ value: s, label: s })),
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
  // Hard-delete a draft line before submit (feedback §3).
  | { type: "delete"; id: string }
  | { type: "recheck1C" }
  | { type: "bulkAdv"; ids: string[]; field: keyof PromoLine; value: boolean }
  // Line cancellation / removal (§5.3): КМ requests, КД approves/rejects.
  | { type: "requestRemoval"; id: string; reason: string; by: string }
  | { type: "approveRemoval"; id: string }
  | { type: "rejectRemoval"; id: string }
  // 10-я часть R46: an edit on an approved line accumulates as a pending repeat action
  // (the table keeps showing approved data); clearPending merges/discards on re-approval.
  | { type: "setPending"; id: string; pending: LinePendingChange }
  | { type: "clearPending"; id: string };

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
    case "delete": {
      if (!state.has(action.id)) return state;
      const next = new Map(state);
      next.delete(action.id);
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
    case "requestRemoval": {
      const cur = state.get(action.id);
      if (!cur) return state;
      const next = new Map(state);
      next.set(action.id, {
        ...cur,
        removalPending: true,
        removalReason: action.reason,
        removalRequestedBy: action.by,
      });
      return next;
    }
    case "approveRemoval": {
      const cur = state.get(action.id);
      if (!cur) return state;
      const next = new Map(state);
      next.set(action.id, { ...cur, removed: true, removalPending: false });
      return next;
    }
    case "rejectRemoval": {
      const cur = state.get(action.id);
      if (!cur) return state;
      const next = new Map(state);
      next.set(action.id, {
        ...cur,
        removalPending: false,
        removalReason: undefined,
        removalRequestedBy: undefined,
      });
      return next;
    }
    case "setPending": {
      const cur = state.get(action.id);
      if (!cur) return state;
      const next = new Map(state);
      next.set(action.id, { ...cur, pending: action.pending });
      return next;
    }
    case "clearPending": {
      const cur = state.get(action.id);
      if (!cur) return state;
      const next = new Map(state);
      const { pending: _pending, ...rest } = cur;
      next.set(action.id, rest as PromoLine);
      return next;
    }
    default:
      return state;
  }
}

export function FullCalendarPage() {
  const { currentRole } = useRole();
  const { notify } = useNotifications();
  const access = getFullCalendarAccess(currentRole);
  const editorMode = access.canEditOwnLines || access.marketingFlagOnly;

  const [lines, dispatch] = React.useReducer(lineReducer, undefined, seedLineMap);
  // Campaigns are lifted into state too (Phase 5): a created/integrated campaign must
  // appear in the grid. Seeded with the campaigns that have lines; session-added ones
  // are prepended. The full reference (CAMPAIGNS ∪ visible) backs duplicate detection.
  const [visibleCampaigns, setVisibleCampaigns] = React.useState<PromoCampaign[]>(
    () => getCampaignsWithLines()
  );
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
  // §10: № промо multi-select + период date-range (mirrors the short calendar).
  const [promoIds, setPromoIds] = React.useState<string[]>([]);
  const [periodStart, setPeriodStart] = React.useState("");
  const [periodEnd, setPeriodEnd] = React.useState("");

  // §7: a plain КМ sees ONLY their own filled promos/lines. No per-person identity in
  // the mock, so «свой КМ» = a representative КМ (the first one). Старший КМ /
  // Коммерческий директор / Администратор keep the full view + the «КМ» filter.
  const ownKmId =
    currentRole === "Категорийный менеджер (КМ)"
      ? CATEGORY_MANAGERS[0].id
      : null;
  // Deep link from the short calendar's КМ-status cell (§10) — ?promo= focuses one
  // campaign; a banner offers to clear it back to the full list.
  const [searchParams, setSearchParams] = useSearchParams();
  const focusPromo = searchParams.get("promo");

  // Nomenclature-entry state (§8.2.1): which campaign's add-picker is open, which
  // line's gift-picker is open, and a pending duplicate awaiting confirmation.
  const [addCampaignId, setAddCampaignId] = React.useState<string | null>(null);
  // §8: which line + gift slot/index the 1С gift picker targets.
  const [giftTarget, setGiftTarget] = React.useState<{
    lineId: string;
    slot: number;
  } | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  // Unplanned creation / per-line mobile editing (Phase 5).
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editCampaignId, setEditCampaignId] = React.useState<string | null>(null);
  const [editLineId, setEditLineId] = React.useState<string | null>(null);
  // Version-history & changes drawer (S4 §5.1) — which campaign's history is open.
  const [historyCampaignId, setHistoryCampaignId] = React.useState<string | null>(
    null
  );
  // ── Edit-after-approval (S4 Phase 2, §5.1/§11.8) ────────────────────────────
  // Baseline = the last sent version. Edits to an approved campaign are diffed
  // against it; КД «send» re-baselines (clears the draft). Seeded from the seed
  // lines/periods; per-campaign live version lists override the seed once a
  // correction is sent. Marketing re-approval is tracked per campaign.
  const [baseline, setBaseline] = React.useState<Map<string, PromoLine>>(() =>
    new Map(PROMO_LINES.map((l) => [l.id, { ...l }]))
  );
  const [baselinePeriods, setBaselinePeriods] = React.useState<
    Map<string, { startDate: Date; endDate: Date }>
  >(() => new Map(CAMPAIGNS.map((c) => [c.id, { startDate: c.startDate, endDate: c.endDate }])));
  const [liveVersions, setLiveVersions] = React.useState<
    Map<string, CampaignVersion[]>
  >(() => new Map());
  const [marketingReapproved, setMarketingReapproved] = React.useState<Set<string>>(
    new Set()
  );
  const [periodEditId, setPeriodEditId] = React.useState<string | null>(null);
  // ── Cancellation + line removal (S4 Phase 3, §5.3) ──────────────────────────
  // «Скрыть отменённое» — ON by default; hides cancelled campaigns AND removed lines.
  const [hideCancelled, setHideCancelled] = React.useState(true);
  // Page-hosted dialogs (deferred open): cancel-campaign reason + КМ line-removal
  // reason. (Deadline change was dropped from the full calendar per feedback §4.)
  const [cancelCampaignId, setCancelCampaignId] = React.useState<string | null>(null);
  const [removalLineId, setRemovalLineId] = React.useState<string | null>(null);
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

  // Full reference for duplicate detection + лookups — all seed campaigns plus any
  // session-created/integrated ones (the latter win, carrying status/firstSendDone edits).
  const campaignsById = React.useMemo(() => {
    const m = new Map<string, PromoCampaign>();
    for (const c of CAMPAIGNS) m.set(c.id, c);
    for (const c of visibleCampaigns) m.set(c.id, c);
    return m;
  }, [visibleCampaigns]);

  // Planned, non-cancelled campaigns available to integrate nomenclature into (§10).
  const plannedCampaigns = React.useMemo(
    () => CAMPAIGNS.filter((c) => c.planned && !c.cancelled),
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

  // Lines as shown in the grid — removed («исключённые») lines drop out while
  // «Скрыть отменённое» is ON (§5.3). The full set (linesFor) still backs the
  // version report so excluded positions stay in history with a marker.
  const displayLinesFor = React.useCallback(
    (campaignId: string) => {
      let out = hideCancelled
        ? linesFor(campaignId).filter((l) => !l.removed)
        : linesFor(campaignId);
      // §7: a plain КМ only sees their own nomenclature within a shared campaign.
      if (ownKmId) out = out.filter((l) => l.kmId === ownKmId);
      // 10-я часть R46/Блок 7: single «Все статусы» filter, applied PER LINE.
      const c = campaignsById.get(campaignId);
      if (c && values.status !== ALL)
        out = out.filter((l) =>
          matchesStatusFilter(lineDisplayStatus(c, l), values.status)
        );
      return out;
    },
    [linesFor, hideCancelled, ownKmId, campaignsById, values.status]
  );

  // ── Edit-after-approval diff (§5.1) ──────────────────────────────────────────
  // For an approved campaign, diff its live lines/period against the baseline.
  // Returns null when the campaign isn't approved or has no pending changes.
  const changeSetFor = React.useCallback(
    (campaignId: string): CampaignChangeSet | null => {
      const c = campaignsById.get(campaignId);
      if (!c || !isApprovedCampaign(c)) return null;
      const baseLines = [...baseline.values()].filter(
        (l) => l.campaignId === campaignId
      );
      const basePeriod =
        baselinePeriods.get(campaignId) ?? {
          startDate: c.startDate,
          endDate: c.endDate,
        };
      const cs = diffCampaignChanges(c, linesFor(campaignId), baseLines, basePeriod);
      return cs.changes.length === 0 ? null : cs;
    },
    [campaignsById, baseline, baselinePeriods, linesFor]
  );

  // Re-approval routing (§11.8): a value/period change needs Маркетинг re-approval
  // before КД can send; additions-only skip straight to «ready».
  type ReapprovalState = "none" | "awaiting-marketing" | "ready";
  const reapprovalStateFor = React.useCallback(
    (campaignId: string): ReapprovalState => {
      const cs = changeSetFor(campaignId);
      if (!cs) return "none";
      if (cs.hasValueChange && !marketingReapproved.has(campaignId))
        return "awaiting-marketing";
      return "ready";
    },
    [changeSetFor, marketingReapproved]
  );

  const versionsFor = React.useCallback(
    (campaignId: string): CampaignVersion[] =>
      liveVersions.get(campaignId) ?? getCampaignVersions(campaignId),
    [liveVersions]
  );

  // Campaigns a plain КМ may see at all (§7): ones they participate in, plus fresh
  // empty ones (just created/integrated). Also the option source for the № filter.
  const kmVisibleCampaigns = React.useMemo(() => {
    if (!ownKmId) return visibleCampaigns;
    return visibleCampaigns.filter((c) => {
      const ls = linesFor(c.id);
      return ls.length === 0 || ls.some((l) => l.kmId === ownKmId);
    });
  }, [visibleCampaigns, ownKmId, linesFor]);

  // № промо filter options (§10) — «26-N» short format (tracker V2-9), КМ-scoped (§7).
  const promoNoOptions = React.useMemo(
    () =>
      kmVisibleCampaigns.map((c) => ({ id: c.id, no: formatPromoNo(c.id), name: c.name })),
    [kmVisibleCampaigns]
  );

  const filtered = React.useMemo(() => {
    const from = periodStart ? new Date(`${periodStart}T00:00:00`) : null;
    const to = periodEnd ? new Date(`${periodEnd}T23:59:59`) : null;
    return kmVisibleCampaigns.filter((c) => {
      // Deep-link focus (§10) — when ?promo= is set, show only that campaign
      // (overrides «Скрыть отменённое» so a cancelled campaign is still reachable).
      if (focusPromo) return c.id === focusPromo;
      // «Скрыть отменённое» (§5.3) — ON by default, hides cancelled campaigns.
      if (hideCancelled && c.cancelled) return false;
      // §10: № промо multi-select.
      if (promoIds.length > 0 && !promoIds.includes(c.id)) return false;
      // §10: период date-range (overlap with the campaign period).
      if (from && !Number.isNaN(from.getTime()) && c.endDate < from) return false;
      if (to && !Number.isNaN(to.getTime()) && c.startDate > to) return false;
      if (values.type !== ALL && c.type !== values.type) return false;
      // 10-я часть R46/Блок 7: status is per-line now — keep a campaign only if it has
      // at least one displayed line matching the «Все статусы» filter.
      if (values.status !== ALL && displayLinesFor(c.id).length === 0) return false;
      if (values.priznak !== ALL) {
        if (values.priznak === "planned" && !c.planned) return false;
        if (values.priznak === "unplanned" && c.planned) return false;
      }
      // «КМ» filter — only for roles that see all КМ (ignored when ownKmId is set, §7).
      if (!ownKmId && values.km !== ALL) {
        if (!linesFor(c.id).some((l) => l.kmId === values.km)) return false;
      }
      return true;
    });
  }, [
    values,
    linesFor,
    displayLinesFor,
    kmVisibleCampaigns,
    hideCancelled,
    focusPromo,
    ownKmId,
    promoIds,
    periodStart,
    periodEnd,
  ]);

  const totalLines = React.useMemo(
    () => filtered.reduce((s, c) => s + displayLinesFor(c.id).length, 0),
    [filtered, displayLinesFor]
  );

  // Live validation — lines missing any required field (forecast / gift fields).
  // Removed («исключённые») lines are out of the promo and never gate the send.
  const invalidLines = React.useMemo(() => {
    let n = 0;
    for (const c of filtered) {
      for (const l of displayLinesFor(c.id))
        if (!l.removed && !isLineValid(l, c)) n++;
    }
    return n;
  }, [filtered, displayLinesFor]);

  // Lines saved as draft awaiting a 1С re-check (§8.3) — block send until cleared.
  const pending1CCount = React.useMemo(() => {
    let n = 0;
    for (const c of filtered) {
      for (const l of displayLinesFor(c.id))
        if (!l.removed && l.pending1CCheck) n++;
    }
    return n;
  }, [filtered, displayLinesFor]);

  // Campaigns the КМ can import into (visible + non-cancelled).
  const importTargets = React.useMemo(
    () => filtered.filter((c) => !c.cancelled),
    [filtered]
  );

  // 10-я часть R46/Блок 2: an edit on an APPROVED line does NOT overwrite the shown
  // (approved) values — it accumulates as a pending repeat action (light-orange row +
  // «Детали изменений» panel), applied to the table only after re-approval. Edits to a
  // draft/under-review line mutate fields directly (primary заполнение, no highlight).
  const onEdit = React.useCallback(
    (id: string, patch: Partial<PromoLine>) => {
      const line = lines.get(id);
      const c = line ? campaignsById.get(line.campaignId) : undefined;
      if (line && c && isApprovedCampaign(c)) {
        const pending = mergePendingChange(
          line,
          patch,
          (f) => TRACKED_FIELD_LABEL[f] ?? String(f),
          (f, v) => fmtPendingValue(f, v),
          currentRole,
          new Date().toISOString()
        );
        dispatch({ type: "setPending", id, pending });
        toast.info(
          "Изменение отправлено на повторное согласование — в таблице пока показаны согласованные данные."
        );
        return;
      }
      dispatch({ type: "edit", id, patch });
    },
    [lines, campaignsById, currentRole]
  );

  // 10-я часть R46 — «Детали изменений» panel + per-user КМ rejection indicator (Блок 6).
  const { currentUser } = useCurrentUser();
  const [detailsLineId, setDetailsLineId] = React.useState<string | null>(null);
  const [seenTick, setSeenTick] = React.useState(0);

  const isKm = currentRole === "Категорийный менеджер (КМ)";
  const seenRejections = React.useMemo(
    () => (isKm ? getSeenRejections(currentUser?.id ?? null) : new Set<string>()),
    // seenTick forces a re-read after markRejectionSeen.
    [isKm, currentUser?.id, seenTick]
  );
  const rejectionLineIds = React.useMemo(() => {
    if (!isKm) return new Set<string>();
    const out = new Set<string>();
    for (const line of lines.values())
      if (lineHasRejection(line) && !seenRejections.has(line.id)) out.add(line.id);
    return out;
  }, [isKm, lines, seenRejections]);

  const handleOpenDetails = React.useCallback(
    (lineId: string) => {
      const line = lines.get(lineId);
      if (isKm && line && lineHasRejection(line)) {
        markRejectionSeen(currentUser?.id ?? null, lineId);
        setSeenTick((t) => t + 1);
      }
      // Defer past the opening click (Radix DismissableLayer — see tasks/lessons.md).
      setTimeout(() => setDetailsLineId(lineId), 0);
    },
    [lines, isKm, currentUser?.id]
  );

  const detailsLine = detailsLineId ? lines.get(detailsLineId) : undefined;
  const detailsCampaign = detailsLine
    ? campaignsById.get(detailsLine.campaignId)
    : undefined;

  // §3: hard-delete a draft line before submit (autosave — no «Сохранить» needed).
  const onDeleteLine = React.useCallback(
    (id: string) => {
      const line = lines.get(id);
      dispatch({ type: "delete", id });
      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      const name = line
        ? getNomenclatureItem(line.nomenclatureId)?.name ?? line.nomenclatureId
        : "";
      toast.success(
        `Номенклатура удалена${name ? `: ${name}` : ""}. Изменения сохранены автоматически.`
      );
    },
    [lines]
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

  // §8: pick/replace/add a gift at a given slot (fixed №1/№2 or a choice option).
  const onGiftPick = React.useCallback((lineId: string, slot: number) => {
    setTimeout(() => setGiftTarget({ lineId, slot }), 0);
  }, []);

  const onPickForGift = React.useCallback(
    (nomenclatureId: string) => {
      if (!giftTarget) return;
      const line = lines.get(giftTarget.lineId);
      const gifts = [...(line?.gifts ?? [])];
      gifts[giftTarget.slot] = { nomenclatureId };
      dispatch({
        type: "edit",
        id: giftTarget.lineId,
        // filter(Boolean) closes any gap if the slot was past the end.
        patch: { gifts: gifts.filter(Boolean) },
      });
      const nom = getNomenclatureItem(nomenclatureId);
      toast.success(`Подарок выбран: ${nom?.name ?? nomenclatureId}`);
    },
    [giftTarget, lines]
  );

  // §8: remove a gift option (by index) from a line.
  const onRemoveGift = React.useCallback(
    (lineId: string, index: number) => {
      const line = lines.get(lineId);
      const gifts = (line?.gifts ?? []).filter((_, i) => i !== index);
      dispatch({
        type: "edit",
        id: lineId,
        patch: { gifts: gifts.length ? gifts : undefined },
      });
    },
    [lines]
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

  // ── Unplanned creation + integrate + per-line edit (Phase 5, §10) ────────────
  // Page-hosted dialogs/sheets opened from a toolbar/grid button: defer the open a
  // tick so the opening pointer click doesn't dismiss the controlled Radix layer
  // (see tasks/lessons.md S2 Phases 3–4).
  const onCreateRequest = React.useCallback(() => {
    setTimeout(() => setCreateOpen(true), 0);
  }, []);

  const onEditCampaignRequest = React.useCallback((campaignId: string) => {
    setTimeout(() => setEditCampaignId(campaignId), 0);
  }, []);

  const onLineTap = React.useCallback((lineId: string) => {
    setTimeout(() => setEditLineId(lineId), 0);
  }, []);

  // Version history & changes (§5.1) — opened from the campaign band, all roles.
  const onHistoryRequest = React.useCallback((campaignId: string) => {
    setTimeout(() => setHistoryCampaignId(campaignId), 0);
  }, []);

  // ── Period change of an approved campaign (§11.5) ────────────────────────────
  const onPeriodEditRequest = React.useCallback((campaignId: string) => {
    setTimeout(() => setPeriodEditId(campaignId), 0);
  }, []);

  const onPeriodApply = React.useCallback(
    (campaignId: string, startDate: Date, endDate: Date) => {
      setVisibleCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId
            ? { ...c, startDate, endDate, periodChanged: true }
            : c
        )
      );
      setPeriodEditId(null);
      notify({
        type: "marketing-reapproval",
        campaignId,
        campaignName: campaignsById.get(campaignId)?.name,
        description:
          "Изменён период акции — требуется повторное согласование выбора «В рекламу» маркетингом перед отправкой.",
        href: "/full-calendar",
      });
    },
    [notify, campaignsById]
  );

  // ── Re-approval + incremental send (§5.1 / §11.8) ────────────────────────────
  const onMarketingReapprove = React.useCallback((campaignId: string) => {
    setMarketingReapproved((prev) => new Set(prev).add(campaignId));
    toast.success(
      "Изменения согласованы маркетингом. Доступна отправка коммерческим директором."
    );
  }, []);

  const onSendToDepartments = React.useCallback(
    (campaignId: string) => {
      const cs = changeSetFor(campaignId);
      if (!cs) return;
      const prevVersions = versionsFor(campaignId);
      const nextNo = (prevVersions[0]?.version ?? 0) + 1;
      const version = buildSentVersion(
        campaignId,
        cs,
        nextNo,
        new Date(),
        currentRole
      );
      setLiveVersions((prev) =>
        new Map(prev).set(campaignId, [version, ...prevVersions])
      );
      // Re-baseline: the current lines/period become the new last-sent version,
      // so the draft diff clears and the period ✏️/bold resets.
      setBaseline((prev) => {
        const next = new Map(prev);
        for (const l of linesFor(campaignId)) next.set(l.id, { ...l });
        return next;
      });
      const c = campaignsById.get(campaignId);
      if (c) {
        setBaselinePeriods((prev) =>
          new Map(prev).set(campaignId, {
            startDate: c.startDate,
            endDate: c.endDate,
          })
        );
      }
      setVisibleCampaigns((prev) =>
        prev.map((x) => (x.id === campaignId ? { ...x, periodChanged: false } : x))
      );
      setMarketingReapproved((prev) => {
        const next = new Set(prev);
        next.delete(campaignId);
        return next;
      });
      notify({
        type: "data-changed",
        campaignId,
        campaignName: campaignsById.get(campaignId)?.name,
        reportVersion: nextNo,
        description: `Сформирована и отправлена версия ${nextNo} смежным отделам (инкрементально).`,
        href: "/reports",
      });
    },
    [changeSetFor, versionsFor, linesFor, campaignsById, currentRole, notify]
  );

  // ── Campaign cancellation (§5.3) — КД only, required reason ──────────────────
  const onCancelRequest = React.useCallback((campaignId: string) => {
    setTimeout(() => setCancelCampaignId(campaignId), 0);
  }, []);

  const onCancelConfirm = React.useCallback(
    (reason: string) => {
      const campaignId = cancelCampaignId;
      if (!campaignId) return;
      const prevVersions = versionsFor(campaignId);
      const nextNo = (prevVersions[0]?.version ?? 0) + 1;
      const version = buildCancellationVersion(
        campaignId,
        reason,
        nextNo,
        new Date(),
        currentRole
      );
      setLiveVersions((prev) =>
        new Map(prev).set(campaignId, [version, ...prevVersions])
      );
      setVisibleCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId
            ? {
                ...c,
                cancelled: true,
                status: "Отменена" as CampaignStatus,
                cancelReason: reason,
                cancelledBy: currentRole,
                cancelledAt: new Date().toISOString(),
              }
            : c
        )
      );
      setSelectedIds(new Set());
      setCancelCampaignId(null);
      notify({
        type: "campaign-cancelled",
        campaignId,
        campaignName: campaignsById.get(campaignId)?.name,
        description: `Акция отменена. Причина: ${reason}. Смежные подразделения уведомлены.`,
        href: "/full-calendar",
      });
    },
    [cancelCampaignId, versionsFor, currentRole, notify, campaignsById]
  );

  // ── Line removal / exclusion (§5.3) — КМ requests, КД approves ───────────────
  const onRemovalRequest = React.useCallback((lineId: string) => {
    setTimeout(() => setRemovalLineId(lineId), 0);
  }, []);

  const onRemovalConfirm = React.useCallback(
    (reason: string) => {
      const lineId = removalLineId;
      if (!lineId) return;
      dispatch({ type: "requestRemoval", id: lineId, reason, by: currentRole });
      setRemovalLineId(null);
      toast.success(
        "Запрос на исключение позиции отправлен на согласование коммерческому директору."
      );
    },
    [removalLineId, currentRole]
  );

  const onApproveRemoval = React.useCallback(
    (lineId: string) => {
      const line = lines.get(lineId);
      if (!line) return;
      dispatch({ type: "approveRemoval", id: lineId });
      const name =
        getNomenclatureItem(line.nomenclatureId)?.name ?? line.nomenclatureId;
      const prevVersions = versionsFor(line.campaignId);
      const nextNo = (prevVersions[0]?.version ?? 0) + 1;
      const version = buildLineRemovalVersion(
        line.campaignId,
        name,
        line.removalReason ?? "—",
        nextNo,
        new Date(),
        currentRole
      );
      setLiveVersions((prev) =>
        new Map(prev).set(line.campaignId, [version, ...prevVersions])
      );
      notify({
        type: "line-removed",
        campaignId: line.campaignId,
        campaignName: campaignsById.get(line.campaignId)?.name,
        description: `Из акции исключена позиция «${name}» по запросу КМ. Отделы уведомлены инкрементально.`,
        href: "/full-calendar",
      });
    },
    [lines, versionsFor, currentRole, notify, campaignsById]
  );

  const onRejectRemoval = React.useCallback((lineId: string) => {
    dispatch({ type: "rejectRemoval", id: lineId });
    toast.success("Запрос на исключение отклонён — позиция остаётся в акции.");
  }, []);

  const onCreateUnplanned = React.useCallback(
    (input: Omit<UnplannedCampaignInput, "kmId">) => {
      // No per-person КМ identity in the mock — attach the new campaign to a default КМ.
      const created = createUnplannedCampaign({
        ...input,
        kmId: CATEGORY_MANAGERS[0].id,
      });
      setVisibleCampaigns((prev) => [created, ...prev]);
      toast.success(
        `Внеплановая акция создана: ${created.id} «${created.name}». № промо присвоен системой.`
      );
      // Open the add-nomenclature picker for the new (empty) campaign right away.
      setTimeout(() => setAddCampaignId(created.id), 0);
    },
    []
  );

  const onEditCampaignSave = React.useCallback(
    (
      campaignId: string,
      patch: { type: string; name: string; startDate: Date; endDate: Date }
    ) => {
      setVisibleCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? { ...c, ...patch } : c))
      );
      toast.success("Изменения внеплановой акции сохранены.");
    },
    []
  );

  const onIntegrate = React.useCallback(
    (campaignId: string) => {
      const c = campaignsById.get(campaignId);
      if (!c) return;
      // Make sure the planned campaign is in the grid, then open its add-picker.
      setVisibleCampaigns((prev) =>
        prev.some((x) => x.id === c.id) ? prev : [c, ...prev]
      );
      toast.success(`Встраивание в плановую акцию ${formatPromoNo(c.id)} «${c.name}».`);
      setTimeout(() => setAddCampaignId(campaignId), 0);
    },
    [campaignsById]
  );

  const editCampaign = editCampaignId
    ? campaignsById.get(editCampaignId) ?? null
    : null;
  const cancelCampaign = cancelCampaignId
    ? campaignsById.get(cancelCampaignId) ?? null
    : null;
  const removalLine = removalLineId ? lines.get(removalLineId) : undefined;
  const removalNom = removalLine
    ? getNomenclatureItem(removalLine.nomenclatureId)
    : undefined;
  const editLine = editLineId ? lines.get(editLineId) : undefined;
  const editLineCampaign = editLine
    ? campaignsById.get(editLine.campaignId)
    : undefined;

  // History drawer data — live versions + the current-report snapshot + the
  // pending edit-after-approval draft (§5.1) and its re-approval state.
  const historyCampaign = historyCampaignId
    ? campaignsById.get(historyCampaignId) ?? null
    : null;
  const historyVersions = React.useMemo(
    () => (historyCampaignId ? versionsFor(historyCampaignId) : undefined),
    [historyCampaignId, versionsFor]
  );
  const historyReport = React.useMemo(
    () =>
      historyCampaignId
        ? buildCampaignReport(linesFor(historyCampaignId))
        : undefined,
    [historyCampaignId, linesFor]
  );
  const historyChangeSet = historyCampaignId
    ? changeSetFor(historyCampaignId)
    : null;
  const historyReapproval = historyCampaignId
    ? reapprovalStateFor(historyCampaignId)
    : "none";

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

  // §10: hide the «КМ» filter for a plain КМ (they only see their own, §7).
  const filters = React.useMemo(
    () => (ownKmId ? FILTERS.filter((f) => f.key !== "km") : FILTERS),
    [ownKmId]
  );

  // §13: flat CSV export of the currently-filtered lines (№ промо per line).
  const onExport = React.useCallback(() => {
    const csv = buildFullCalendarCsv(filtered, displayLinesFor);
    downloadCsv(`Полный_промо-календарь_${exportStamp()}.csv`, csv);
    toast.success("Экспорт в CSV сформирован (по текущим фильтрам).");
  }, [filtered, displayLinesFor]);

  const clearFilters = () => {
    setValues({ type: ALL, status: ALL, km: ALL, priznak: ALL });
    setPromoIds([]);
    setPeriodStart("");
    setPeriodEnd("");
  };

  const submitForApproval = () => {
    // First send locks the тип/период of unplanned campaigns (§10).
    setVisibleCampaigns((prev) =>
      prev.map((c) =>
        !c.planned && !c.firstSendDone ? { ...c, firstSendDone: true } : c
      )
    );
    toast.success("Отправлено на согласование старшему КМ");
  };

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
                Показано: {filtered.length.toLocaleString("ru-RU")} промо ·{" "}
                {totalLines.toLocaleString("ru-RU")} {pluralPositions(totalLines)}
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
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={onExport}>
                  <Download className="size-4" />
                  Экспорт
                </Button>
                {access.canEditOwnLines && (
                  <>
                    <Button variant="secondary" onClick={onImportRequest}>
                      <Upload className="size-4" />
                      Загрузить из Excel
                    </Button>
                    <Button onClick={onCreateRequest}>
                      <Plus className="size-4" />
                      Создать акцию
                    </Button>
                  </>
                )}
              </div>
            }
          />

          <FilterBar
            filters={filters}
            values={values}
            onFilterChange={(key, value) =>
              setValues((prev) => ({ ...prev, [key]: value }))
            }
            onClear={clearFilters}
            resultCount={filtered.length}
            className="bg-transparent px-0"
          >
            {/* §10: № промо searchable multi-select («26-N» short format). */}
            <PromoNoFilter
              options={promoNoOptions}
              selected={promoIds}
              onChange={setPromoIds}
            />
            {/* §10: Период акции date-range. */}
            <div className="flex h-9 items-center gap-1.5 rounded-md border bg-white dark:bg-card px-2.5 text-sm">
              <span className="text-xs text-muted-foreground">Период</span>
              <input
                type="date"
                aria-label="Период акции — с"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="bg-transparent text-xs tabular-nums outline-none"
              />
              <span className="text-xs text-muted-foreground">—</span>
              <input
                type="date"
                aria-label="Период акции — по"
                value={periodEnd}
                min={periodStart || undefined}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="bg-transparent text-xs tabular-nums outline-none"
              />
            </div>
            <label className="flex h-9 items-center gap-2 rounded-md border bg-white dark:bg-card px-3">
              <Switch
                id="hide-cancelled"
                checked={hideCancelled}
                onCheckedChange={setHideCancelled}
              />
              <Label
                htmlFor="hide-cancelled"
                className="cursor-pointer text-sm text-muted-foreground"
              >
                Скрыть отменённое
              </Label>
            </label>
            <ColumnGroupToggle
              visible={visibleGroups}
              onChange={setVisibleGroups}
            />
          </FilterBar>

          {focusPromo && (
            // Deep-link banner (§10) — arrived from the short calendar's КМ-status cell.
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
              <Link2 className="size-4 shrink-0 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-200">
                Показана акция по ссылке из календаря готовности:{" "}
                <span className="font-medium">
                  № {formatPromoNo(focusPromo)}
                  {visibleCampaigns.find((c) => c.id === focusPromo)?.name
                    ? ` · ${visibleCampaigns.find((c) => c.id === focusPromo)?.name}`
                    : ""}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-8 text-xs text-gray-500 dark:text-gray-400"
                onClick={() => setSearchParams({})}
              >
                <X className="mr-1 size-3" />
                Показать все акции
              </Button>
            </div>
          )}

          {/* Bulk-select strip — appears once rows are selected (editor roles only). */}
          {editorMode && selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-primary/10 px-3 py-2 text-sm">
              <span className="font-medium text-gray-900 dark:text-gray-100">
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
            linesFor={displayLinesFor}
            onEdit={onEdit}
            onDeleteLine={onDeleteLine}
            onAddRequest={onAddRequest}
            onGiftPick={onGiftPick}
            onRemoveGift={onRemoveGift}
            onLineTap={onLineTap}
            onEditCampaign={onEditCampaignRequest}
            onHistory={onHistoryRequest}
            onEditPeriod={
              currentRole === "Коммерческий директор"
                ? onPeriodEditRequest
                : undefined
            }
            onCancelCampaign={
              canCancelCampaign(currentRole) ? onCancelRequest : undefined
            }
            onRequestRemoval={
              canRequestLineRemoval(currentRole) ? onRemovalRequest : undefined
            }
            onApproveRemoval={
              canApproveLineRemoval(currentRole) ? onApproveRemoval : undefined
            }
            onRejectRemoval={
              canApproveLineRemoval(currentRole) ? onRejectRemoval : undefined
            }
            onOpenDetails={handleOpenDetails}
            rejectionLineIds={rejectionLineIds}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onToggleGroup={onToggleGroup}
          />
        </div>
      </div>

      {/* 10-я часть R46 — «Детали изменений» panel (Поле/Было/Стало · запрос · отклонение). */}
      <LineDetailsDrawer
        open={detailsLineId !== null}
        onOpenChange={(o) => !o && setDetailsLineId(null)}
        campaign={detailsCampaign}
        line={detailsLine}
      />

      {/* Add-a-line picker (§8.2.1) — searchable 1С reference, no free-text. */}
      <AddNomenclatureDialog
        open={addCampaignId !== null}
        onOpenChange={(open) => !open && setAddCampaignId(null)}
        title="Добавить номенклатуру"
        description="Выберите товар из справочника 1С — свободный ввод недоступен."
        onPick={onPickForAdd}
      />

      {/* Gift-nomenclature picker (§8.8 / §8) — same 1С reference. */}
      <AddNomenclatureDialog
        open={giftTarget !== null}
        onOpenChange={(open) => !open && setGiftTarget(null)}
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

      {/* Create unplanned / integrate into planned / edit unplanned (§10). */}
      <CreateCampaignDialog
        open={createOpen || editCampaignId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditCampaignId(null);
          }
        }}
        plannedCampaigns={plannedCampaigns}
        editCampaign={editCampaign}
        onCreate={onCreateUnplanned}
        onEdit={onEditCampaignSave}
        onIntegrate={onIntegrate}
      />

      {/* Mobile per-line edit Sheet (Phase 5 RESPONSIVE §). */}
      <LineEditSheet
        open={editLineId !== null}
        onOpenChange={(open) => !open && setEditLineId(null)}
        line={editLine}
        campaign={editLineCampaign}
        access={access}
        onEdit={onEdit}
        onGiftPick={onGiftPick}
        onRequestRemoval={
          canRequestLineRemoval(currentRole)
            ? (id) => {
                setEditLineId(null);
                onRemovalRequest(id);
              }
            : undefined
        }
        onApproveRemoval={
          canApproveLineRemoval(currentRole)
            ? (id) => {
                setEditLineId(null);
                onApproveRemoval(id);
              }
            : undefined
        }
        onRejectRemoval={
          canApproveLineRemoval(currentRole)
            ? (id) => {
                setEditLineId(null);
                onRejectRemoval(id);
              }
            : undefined
        }
      />

      {/* Version history & changes (§5.1) — 3 views + diff; «Создать корректировку»
          for editor roles (rollback is not supported, §5.2.1). */}
      <VersionHistoryDrawer
        open={historyCampaignId !== null}
        onOpenChange={(open) => !open && setHistoryCampaignId(null)}
        campaignLabel={
          historyCampaign
            ? `${formatPromoNo(historyCampaign.id)} · ${historyCampaign.name}`
            : undefined
        }
        versions={historyVersions}
        currentReport={historyReport}
        deadlineChange={historyCampaign?.deadlineChange}
        pendingChanges={historyChangeSet?.changes}
        reapprovalState={historyReapproval}
        onMarketingReapprove={
          access.marketingFlagOnly && historyCampaignId
            ? () => onMarketingReapprove(historyCampaignId)
            : undefined
        }
        onSendToDepartments={
          currentRole === "Коммерческий директор" && historyCampaignId
            ? () => onSendToDepartments(historyCampaignId)
            : undefined
        }
        onCreateCorrection={
          access.canEditOwnLines && !historyChangeSet
            ? () => {
                toast.info(
                  "Чтобы внести корректировку, отредактируйте ячейки строки прямо в календаре — изменения отслеживаются автоматически."
                );
              }
            : undefined
        }
      />

      {/* Period change of an approved campaign (§11.5) — КД only. */}
      <PeriodEditDialog
        campaign={periodEditId ? campaignsById.get(periodEditId) ?? null : null}
        onOpenChange={(open) => !open && setPeriodEditId(null)}
        onApply={onPeriodApply}
      />

      {/* Cancel whole campaign (§5.3) — КД only, required reason. */}
      <ReasonDialog
        open={cancelCampaignId !== null}
        onOpenChange={(open) => !open && setCancelCampaignId(null)}
        title="Отменить акцию"
        description={
          cancelCampaign
            ? `${cancelCampaign.id} «${cancelCampaign.name}». Все смежные отделы получат отдельное уведомление «Акция отменена». Отмена — отдельное состояние; отменённую акцию можно посмотреть, сняв «Скрыть отменённое».`
            : undefined
        }
        destructive
        reasonLabel="Причина отмены"
        confirmLabel="Отменить акцию"
        onConfirm={onCancelConfirm}
      />

      {/* Request line exclusion (§5.3) — КМ, required reason → КД re-approval. */}
      <ReasonDialog
        open={removalLineId !== null}
        onOpenChange={(open) => !open && setRemovalLineId(null)}
        title="Исключить позицию из акции"
        description={
          removalLine
            ? `${removalNom?.name ?? removalLine.nomenclatureId}. Исключение требует повторного согласования коммерческим директором; после согласования смежные отделы уведомляются инкрементально, позиция помечается «Исключена из акции».`
            : undefined
        }
        destructive
        reasonLabel="Причина исключения"
        confirmLabel="Отправить на согласование"
        onConfirm={onRemovalConfirm}
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
                  <div className="rounded-md bg-amber-50 dark:bg-amber-500/15 px-3 py-2 text-amber-900 dark:text-amber-200">
                    {pendingDup.hit.samePromo ? (
                      <span>Уже добавлена в эту акцию ({formatPromoNo(pendingDup.campaignId)}).</span>
                    ) : (
                      <span>
                        Уже участвует в акции {formatPromoNo(pendingDup.hit.promoId)} «
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

      {/* Sticky bottom action bar (fixed footer) — full-bleed past the main padding;
          on sm+ its height (h-14 + border) matches the sidebar collapse-button block. */}
      <div className="-mx-3 -mb-3 shrink-0 border-t bg-white dark:bg-card px-3 py-3 sm:h-14 sm:py-0 md:-mx-4 md:-mb-4 md:px-4">
        <div className="flex h-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-muted-foreground">
              {invalidLines > 0 ? (
                <span className="text-red-600 dark:text-red-400">
                  {invalidLines} {pluralLines(invalidLines)}: не заполнены
                  обязательные поля
                </span>
              ) : pending1CCount > 0 ? (
                <span className="text-amber-700 dark:text-amber-300">
                  {pending1CCount} {pluralLines(pending1CCount)} ожидают проверки 1С
                </span>
              ) : (
                "Все обязательные поля заполнены"
              )}
            </p>
            {/* §3: no «Сохранить черновик» button — changes autosave until submit. */}
            {access.canEditOwnLines && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                Изменения номенклатуры и полей сохраняются автоматически
              </span>
            )}
          </div>
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
  );
}

/** Local <input type="date"> value (yyyy-mm-dd) ⇄ Date, local-tz safe (§11.5). */
function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fromInputDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Minimal date-range editor for an approved campaign's period (§11.5). */
function PeriodEditDialog({
  campaign,
  onOpenChange,
  onApply,
}: {
  campaign: PromoCampaign | null;
  onOpenChange: (open: boolean) => void;
  onApply: (campaignId: string, startDate: Date, endDate: Date) => void;
}) {
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");

  React.useEffect(() => {
    if (campaign) {
      setStart(toInputDate(campaign.startDate));
      setEnd(toInputDate(campaign.endDate));
    }
  }, [campaign]);

  const s = fromInputDate(start);
  const e = fromInputDate(end);
  const valid = !!s && !!e && s.getTime() <= e.getTime();
  const changed =
    !!campaign &&
    !!s &&
    !!e &&
    (s.getTime() !== campaign.startDate.getTime() ||
      e.getTime() !== campaign.endDate.getTime());

  return (
    <Dialog open={campaign !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Изменить период акции</DialogTitle>
          <DialogDescription>
            Изменение периода уже согласованной акции отслеживается как
            корректировка и требует повторного согласования маркетинга перед
            отправкой смежным отделам.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Начало</span>
            <input
              type="date"
              value={start}
              onChange={(ev) => setStart(ev.target.value)}
              className="h-9 rounded-md border px-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Окончание</span>
            <input
              type="date"
              value={end}
              min={start || undefined}
              onChange={(ev) => setEnd(ev.target.value)}
              className="h-9 rounded-md border px-2 text-sm"
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            disabled={!valid || !changed}
            onClick={() => campaign && s && e && onApply(campaign.id, s, e)}
          >
            Применить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-100 md:text-[32px]">
        Полный промо-календарь
      </h1>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-20 text-center">
        <Ban className="size-12 text-muted-foreground/60" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
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

/** «N позиций» plural for the selection counter (feedback §13). */
function pluralPositions(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "позиция";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "позиции";
  return "позиций";
}
