"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Check,
  ChevronRight,
  Plus,
  Send,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { Card, CardContent, CardHeader } from "@texnomart/ui/card";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@texnomart/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { DeadlineChips } from "../../../components/DeadlineChips";
import { ReasonDialog } from "../../../components/ReasonDialog";
import { PromoStatusBadge } from "../../../components/PromoStatusBadge";
import {
  PlanApprovalTable,
  type PlanRowSend,
  type RowDecision,
} from "./PlanApprovalTable";
import { PlanRejectionDrawer } from "./PlanRejectionDrawer";
import { useRole } from "../../role-context";
import { useCurrentUser } from "../../current-user-context";
import {
  PLAN_APPROVAL_CHAIN,
  PROMO_TYPES,
  actorForPlanStatus,
  findCoverageGaps,
  formatPromoNo,
  getPlanApproval,
  nextPlanPromoNo,
  type PlanStatus,
  type PromoCampaign,
} from "../../../lib/promo-mock-data";
import {
  getPlanState,
  persistPlanState,
  reviveOverrides,
  reviveRows,
  serializeOverrides,
  serializeRows,
  type PlanRejectionEvent,
} from "../../../lib/plan-store";

interface PlanRow {
  id: string;
  type: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

interface PlanModeProps {
  campaigns: PromoCampaign[];
}

/** Roles allowed to create/edit/send plan rows (the plan owner). */
const PLAN_EDITOR = "Директор маркетинга";

/** The two interactive reviewer stages that accept per-row decisions (№3). */
type ReviewerStage = "kd" | "od";
/** Live per-row decisions the reviewer makes, keyed by stage (mock, session-local). */
type DecisionMap = Record<string, Partial<Record<ReviewerStage, RowDecision>>>;

const fmt = (d: Date) => d.toLocaleDateString("ru-RU");
const hasType = (r: PlanRow) => Boolean(r.type && r.type.trim());

export function PlanMode({ campaigns }: PlanModeProps) {
  const { currentRole } = useRole();
  const { currentUser } = useCurrentUser();
  const isMarketing = currentRole === PLAN_EDITOR;

  // A11 — persisted lifecycle snapshot, read once on mount. Every slice below hydrates
  // lazily from it (or falls back to the seed-derived default) so nothing flashes seed
  // values before hydration; absent/malformed storage → `null` (seed defaults apply).
  const [initialStored] = React.useState(() => getPlanState());

  // The plan-level status drives the reviewer stepper + which stage is active. It starts
  // at «На согл. с КД» so the review chain is visible immediately (seed rows are sent).
  const [planStatus, setPlanStatus] = React.useState<PlanStatus>(
    () => initialStored?.planStatus ?? "На согл. с КД"
  );
  // Which reviewer stage rejected the plan — so the stepper marks THAT stage (№4).
  const [rejectedStage, setRejectedStage] = React.useState<
    ReviewerStage | undefined
  >(() => initialStored?.rejectedStage);

  // Rows created this session + per-row field edits + deletions (№6).
  const [extraRows, setExtraRows] = React.useState<PlanRow[]>(() =>
    initialStored ? reviveRows(initialStored.extraRows) : []
  );
  const [overrides, setOverrides] = React.useState<
    Record<string, Partial<PlanRow>>
  >(() => (initialStored ? reviveOverrides(initialStored.overrides) : {}));
  const [deletedIds, setDeletedIds] = React.useState<Set<string>>(
    () => new Set(initialStored?.deletedIds ?? [])
  );

  // Per-row send lifecycle (№2/№5/№7): seed rows that already carry a director-approval
  // record are «Отправлено» (in review); the enrichment campaigns without a record start
  // as «Черновик», so the marketing director sees the draft → выбрать → отправить flow.
  const [sendStatus, setSendStatus] = React.useState<
    Record<string, PlanRowSend>
  >(() => {
    if (initialStored) return initialStored.sendStatus;
    const m: Record<string, PlanRowSend> = {};
    for (const c of campaigns) m[c.id] = getPlanApproval(c.id) ? "sent" : "draft";
    return m;
  });

  // Per-row reviewer decisions (№3) + the current selection.
  const [decisions, setDecisions] = React.useState<DecisionMap>(
    () => initialStored?.decisions ?? {}
  );
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set()
  );

  // «7-я часть» §9 — per-row rejection/return history (newest first). Survives
  // «Вернуть на доработку» + re-sends: it IS the history the side panel shows.
  const [rejectionLog, setRejectionLog] = React.useState<
    Record<string, PlanRejectionEvent[]>
  >(() => initialStored?.rejectionLog ?? {});
  // Which row's rejection details are open in the side panel (null = closed).
  const [rejectionRowId, setRejectionRowId] = React.useState<string | null>(
    null
  );

  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  // null → create a new draft; an id → edit that row.
  const [editId, setEditId] = React.useState<string | null>(null);

  // Selection is mode-specific (send vs review) — reset it when the role changes.
  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [currentRole]);

  // A11 — persist the assembled lifecycle snapshot on any slice change. Resets
  // («Вернуть на доработку», delete, edit-sent-row→Черновик) persist naturally here
  // too, since they only ever mutate the slices below. Derived values (rows, coverage
  // gaps, readiness) are recomputed on load — never persisted.
  React.useEffect(() => {
    persistPlanState({
      planStatus,
      rejectedStage,
      extraRows: serializeRows(extraRows),
      overrides: serializeOverrides(overrides),
      deletedIds: [...deletedIds],
      sendStatus,
      decisions,
      rejectionLog,
    });
  }, [
    planStatus,
    rejectedStage,
    extraRows,
    overrides,
    deletedIds,
    sendStatus,
    decisions,
    rejectionLog,
  ]);

  const sendOf = (id: string): PlanRowSend => sendStatus[id] ?? "draft";

  const rows: PlanRow[] = React.useMemo(() => {
    const base: PlanRow[] = campaigns.map((c) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      startDate: c.startDate,
      endDate: c.endDate,
    }));
    // R29.7 (10-я часть): the plan reads in period order — nearest start date first —
    // so незакрытые промежутки between promos are easy to eyeball.
    return [...base, ...extraRows]
      .filter((r) => !deletedIds.has(r.id))
      .map((r) => ({ ...r, ...overrides[r.id] }))
      .sort(
        (a, b) =>
          a.startDate.getTime() - b.startDate.getTime() ||
          a.id.localeCompare(b.id)
      );
  }, [campaigns, extraRows, deletedIds, overrides]);

  const rowById = (id: string) => rows.find((r) => r.id === id);

  const currentActor = actorForPlanStatus(planStatus);
  const isApproved = planStatus === "Утверждён";
  const isRejected = planStatus === "Отклонён";
  const canAct = currentActor !== undefined && currentRole === currentActor;

  const reviewerStage: ReviewerStage | undefined =
    currentActor === "Коммерческий директор"
      ? "kd"
      : currentActor === "Операционный директор"
        ? "od"
        : undefined;
  const stageLabel = reviewerStage === "kd" ? "КД" : "ОД";

  // Sent rows participate in review; drafts are the marketing send pool.
  const sentRows = rows.filter((r) => sendOf(r.id) === "sent");
  const draftRows = rows.filter((r) => sendOf(r.id) === "draft");
  const sendableDrafts = draftRows.filter(hasType); // тип required to send (№2)
  const blockedDrafts = draftRows.filter((r) => !hasType(r)); // тип missing

  const reviewMode = canAct && reviewerStage !== undefined && sentRows.length > 0;
  const sendMode = isMarketing && draftRows.length > 0;
  const selectable = reviewMode || sendMode;

  // The rows that can be checked in the active mode.
  const selectablePool: PlanRow[] = reviewMode
    ? sentRows.filter((r) => !decisions[r.id]?.[reviewerStage!])
    : sendMode
      ? sendableDrafts
      : [];

  const rowCheckable = (id: string): boolean =>
    selectablePool.some((r) => r.id === id);

  const allSelected =
    selectablePool.length > 0 &&
    selectablePool.every((r) => selectedIds.has(r.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const approvedCount = reviewerStage
    ? sentRows.filter((r) => decisions[r.id]?.[reviewerStage] === "approved")
        .length
    : 0;

  /** Combined per-row lifecycle decision for the badge + row tint (№4). */
  function rowDecision(id: string): RowDecision | undefined {
    const d = decisions[id] ?? {};
    if (d.kd === "rejected" || d.od === "rejected") return "rejected";
    if (isApproved && sendOf(id) === "sent") return "approved";
    if (reviewerStage && d[reviewerStage] === "approved") return "approved";
    return undefined;
  }

  const typeMissing = (id: string): boolean => {
    const r = rowById(id);
    return Boolean(r && sendOf(id) === "draft" && !hasType(r));
  };

  // Live coverage-gap hint over the whole plan (№7) — surfaced to the plan owner.
  const planGaps = React.useMemo(
    () =>
      findCoverageGaps(
        rows.map((r) => ({ start: r.startDate, end: r.endDate }))
      ),
    [rows]
  );

  function advance(next: PlanStatus, message: string) {
    setPlanStatus(next);
    setRejectedStage(undefined);
    toast.success(message);
  }

  function resetReview() {
    setDecisions({});
    setSelectedIds(new Set());
    setRejectedStage(undefined);
  }

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) =>
      selectablePool.every((r) => prev.has(r.id))
        ? new Set()
        : new Set(selectablePool.map((r) => r.id))
    );
  }

  // ── Marketing: send selected drafts for approval (№5/№7) ──────────────────────
  function sendSelected() {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds].filter((id) => sendOf(id) === "draft");
    if (ids.length === 0) return;

    setSendStatus((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = "sent";
      return next;
    });
    setSelectedIds(new Set());

    // Sending (re)opens the review chain when the plan isn't already at a reviewer
    // stage: terminal states AND the post-return «На обсуждении»/«На ознакомлении»
    // (7-я часть §9.3 — повторная отправка после возврата снова уходит к КД; before
    // this the plan got stuck at «На обсуждении» and the КД never saw the rows).
    if (isApproved || isRejected || currentActor === PLAN_EDITOR) {
      setDecisions({});
      setRejectedStage(undefined);
      setPlanStatus("На согл. с КД");
    }

    // Warn about dates the whole plan leaves uncovered (№7).
    const afterSent = [
      ...sentRows,
      ...rows.filter((r) => ids.includes(r.id)),
    ];
    const gaps = findCoverageGaps(
      afterSent.map((r) => ({ start: r.startDate, end: r.endDate }))
    );
    if (gaps.length > 0) {
      const list = gaps
        .map((g) => `${fmt(g.start)}–${fmt(g.end)} (${g.days} дн.)`)
        .join(", ");
      toast.warning(
        `Отправлено на согласование: ${ids.length}. В плане есть незакрытые даты: ${list}`,
        { duration: 6000 }
      );
    } else {
      toast.success(`Отправлено на согласование акций: ${ids.length}`);
    }
  }

  // ── Reviewer: approve / reject selected sent rows (№3/№4) ──────────────────────
  function approveSelected() {
    if (!reviewerStage || selectedIds.size === 0) return;
    const ids = [...selectedIds];
    const next: DecisionMap = { ...decisions };
    for (const id of ids) next[id] = { ...next[id], [reviewerStage]: "approved" };
    setDecisions(next);
    setSelectedIds(new Set());

    const allApproved = sentRows.every(
      (r) => next[r.id]?.[reviewerStage] === "approved"
    );
    if (allApproved) {
      if (reviewerStage === "kd")
        advance(
          "На согл. с ОД",
          "План согласован КД и передан операционному директору"
        );
      else advance("Утверждён", "План утверждён");
    } else {
      const remaining = sentRows.filter(
        (r) => !next[r.id]?.[reviewerStage]
      ).length;
      toast.success(`Согласовано акций: ${ids.length}. Осталось: ${remaining}`);
    }
  }

  function rejectSelected(reason: string) {
    if (!reviewerStage || selectedIds.size === 0) return;
    const ids = [...selectedIds];
    const next: DecisionMap = { ...decisions };
    for (const id of ids) next[id] = { ...next[id], [reviewerStage]: "rejected" };
    setDecisions(next);
    setSelectedIds(new Set());
    setPlanStatus("Отклонён");
    setRejectedStage(reviewerStage); // №4 — mark the rejecting stage

    // «7-я часть» §9 — record WHO rejected, the role, when, and the comment,
    // so the clickable «Отклонено» badge can show the details + history.
    const event: PlanRejectionEvent = {
      kind: reviewerStage,
      by: currentUser?.fullName ?? currentActor ?? currentRole,
      role: currentActor ?? currentRole,
      at: new Date().toISOString(),
      comment: reason,
    };
    setRejectionLog((prev) => {
      const out = { ...prev };
      for (const id of ids) out[id] = [event, ...(out[id] ?? [])];
      return out;
    });

    toast.success(
      `Отклонено акций: ${ids.length}. План возвращён директору маркетинга`
    );
  }

  /** Marketing «Вернуть на доработку» — rejected rows drop to draft for edit + re-send. */
  function returnForRework() {
    const rejectedIds = rows
      .filter((r) => {
        const d = decisions[r.id];
        return d?.kd === "rejected" || d?.od === "rejected";
      })
      .map((r) => r.id);

    setSendStatus((prev) => {
      const next = { ...prev };
      for (const id of rejectedIds) next[id] = "draft";
      return next;
    });

    // §9.3 — the return is part of each row's rejection history (no comment field).
    const event: PlanRejectionEvent = {
      kind: "return",
      by: currentUser?.fullName ?? PLAN_EDITOR,
      role: PLAN_EDITOR,
      at: new Date().toISOString(),
      comment: "",
    };
    setRejectionLog((prev) => {
      const out = { ...prev };
      for (const id of rejectedIds) out[id] = [event, ...(out[id] ?? [])];
      return out;
    });

    resetReview();
    setPlanStatus("На обсуждении");
    toast.success("План возвращён на доработку");
  }

  // ── Row management (№1/№2/№6) ─────────────────────────────────────────────────
  // The dialog is controlled and opened from plain buttons (no DialogTrigger), so the
  // open is deferred past the opening pointer event — otherwise Radix DismissableLayer
  // treats that same click as an outside interaction and closes the dialog immediately
  // (see tasks/lessons.md, S2 Phase 3). R31.4: this made «Создать строку плана» look
  // like it did nothing.
  function openCreate() {
    setEditId(null);
    setTimeout(() => setDialogOpen(true), 0);
  }
  function openEdit(id: string) {
    setEditId(id);
    setTimeout(() => setDialogOpen(true), 0);
  }

  function handleCreate(row: PlanRow) {
    setExtraRows((prev) => [...prev, row]);
    // R31.4 — defensive: if this id was ever deleted (persisted tombstone), clear it,
    // otherwise the freshly created row would be filtered out and never show up.
    setDeletedIds((prev) => {
      if (!prev.has(row.id)) return prev;
      const next = new Set(prev);
      next.delete(row.id);
      return next;
    });
    setSendStatus((prev) => ({ ...prev, [row.id]: "draft" }));
    toast.success(
      hasType(row)
        ? `Черновик «${row.name}» добавлен`
        : `Черновик «${row.name}» добавлен — выберите тип промо перед отправкой`
    );
  }

  function handleEdit(id: string, patch: PlanRow) {
    const isExtra = extraRows.some((r) => r.id === id);
    if (isExtra) {
      setExtraRows((prev) =>
        prev.map((r) => (r.id === id ? { ...patch, id } : r))
      );
    } else {
      setOverrides((prev) => ({
        ...prev,
        [id]: {
          type: patch.type,
          name: patch.name,
          startDate: patch.startDate,
          endDate: patch.endDate,
        },
      }));
    }
    // Editing an already-sent row returns it to «Черновик» → re-approval (№6).
    if (sendOf(id) === "sent") {
      setSendStatus((prev) => ({ ...prev, [id]: "draft" }));
      setDecisions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.info(
        `Строка возвращена в черновик — требуется повторная отправка на согласование`
      );
    } else {
      toast.success(`Строка «${patch.name}» обновлена`);
    }
  }

  function handleDelete(id: string) {
    if (sendOf(id) !== "draft") return; // delete drafts only
    setDeletedIds((prev) => new Set(prev).add(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast.success("Черновик удалён");
  }

  const editingRow = editId ? rowById(editId) : undefined;
  // R31.4 — the number pool must include tombstoned (deleted) ids: `rows` excludes
  // them, so without this a new row could REUSE a deleted id and be instantly
  // filtered out by `deletedIds` («создал строку — а её не видно в таблице»).
  const autoNo = React.useMemo(
    () => nextPlanPromoNo([...rows.map((r) => r.id), ...deletedIds]),
    [rows, deletedIds]
  );

  return (
    <div className="space-y-4">
      {/* ── Approval chain stepper ──────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-0">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Согласование плана акций
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <PlanStepper
            planStatus={planStatus}
            currentActor={currentActor}
            rejectedStage={rejectedStage}
          />

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Текущий статус:</span>
              <PromoStatusBadge status={planStatus} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentActor && !canAct && !sendMode && (
                <span className="text-xs text-muted-foreground">
                  Сейчас действует:{" "}
                  <b className="text-gray-700 dark:text-gray-200">
                    {currentActor}
                  </b>
                </span>
              )}

              {/* Marketing (send mode): the plan owner picks drafts to send below. */}
              {sendMode && (
                <span className="text-xs text-muted-foreground">
                  Черновиков к отправке:{" "}
                  <b className="tabular-nums text-gray-700 dark:text-gray-200">
                    {draftRows.length}
                  </b>{" "}
                  — отметьте акции в таблице и отправьте на согласование
                </span>
              )}

              {/* КД / ОД — per-row review (№3): progress here, actions by the table. */}
              {reviewMode && (
                <span className="text-xs text-muted-foreground">
                  Согласовано{" "}
                  <b className="tabular-nums text-gray-700 dark:text-gray-200">
                    {approvedCount}
                  </b>{" "}
                  из{" "}
                  <b className="tabular-nums text-gray-700 dark:text-gray-200">
                    {sentRows.length}
                  </b>{" "}
                  на этапе {stageLabel} — отметьте акции в таблице ниже
                </span>
              )}

              {isApproved && (
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-300">
                  <Check className="size-4" />
                  План утверждён
                </span>
              )}
              {isRejected && isMarketing && (
                <Button variant="outline" onClick={returnForRework}>
                  Вернуть на доработку
                </Button>
              )}
            </div>
          </div>

          <DeadlineChips startDate={rows[0]?.startDate} />
        </CardContent>
      </Card>

      {/* ── Plan rows ───────────────────────────────────────────────────── */}
      {/* overflow-clip rounds the sticky strip's corners without trapping sticky. */}
      <Card className="overflow-clip">
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Строки плана
            <span className="ml-2 font-normal text-muted-foreground">
              {rows.length}
            </span>
          </h2>
          {isMarketing ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Создать строку плана
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              {reviewMode
                ? "Отметьте акции и примите решение — по одной, несколько или все сразу"
                : "Редактирование доступно директору маркетинга"}
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {/* №7 — coverage-gap hint for the plan owner. */}
          {isMarketing && planGaps.length > 0 && (
            <div className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>
                В плане есть незакрытые даты между акциями:{" "}
                <b>
                  {planGaps
                    .map((g) => `${fmt(g.start)}–${fmt(g.end)} (${g.days} дн.)`)
                    .join(", ")}
                </b>
                . Убедитесь, что это ожидаемо, прежде чем отправлять на согласование.
              </span>
            </div>
          )}

          {/* №2 — draft rows missing a тип can't be sent. */}
          {sendMode && blockedDrafts.length > 0 && (
            <div className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>
                Черновиков без типа промо:{" "}
                <b className="tabular-nums">{blockedDrafts.length}</b>. Выберите
                тип промо, чтобы отправить их на согласование.
              </span>
            </div>
          )}

          <PlanApprovalTable
            rows={rows}
            selectable={selectable}
            selectedIds={selectedIds}
            onToggle={toggle}
            onToggleAll={toggleAll}
            allSelected={allSelected}
            someSelected={someSelected}
            rowCheckable={rowCheckable}
            decisionFor={rowDecision}
            sendStatusFor={sendOf}
            typeMissing={typeMissing}
            canManage={isMarketing}
            onEditRow={openEdit}
            onDeleteRow={handleDelete}
            onShowRejection={setRejectionRowId}
          />

          {/* Selection strip — send mode (marketing) or review mode (КД/ОД).
              R29.2 (10-я часть): pinned to the viewport bottom while the table
              scrolls (sticky; negative offset cancels <main>'s bottom padding),
              so a decision never requires scrolling back up. Solid bg-card layer
              under the brand tint — content must not show through while pinned. */}
          {(sendMode || reviewMode) && (
            <div className="sticky bottom-[-0.75rem] z-30 border-t bg-card md:bottom-[-1rem]">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-primary/5 px-4 py-2.5">
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  Выбрано:{" "}
                  <b className="tabular-nums">{selectedIds.size}</b>
                  {selectablePool.length > 0 && (
                    <span className="text-muted-foreground">
                      {" "}
                      из {selectablePool.length}
                    </span>
                  )}
                </span>
                {sendMode ? (
                  <div className="ml-auto">
                    <Button
                      size="sm"
                      disabled={selectedIds.size === 0}
                      onClick={sendSelected}
                    >
                      <Send className="size-4" />
                      Отправить на согласование
                      {selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                    </Button>
                  </div>
                ) : (
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={selectedIds.size === 0}
                      onClick={() => setRejectOpen(true)}
                    >
                      <ThumbsDown className="size-4" />
                      Отклонить выбранные
                    </Button>
                    <Button
                      size="sm"
                      disabled={selectedIds.size === 0}
                      onClick={approveSelected}
                    >
                      <ThumbsUp className="size-4" />
                      Согласовать выбранные
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ReasonDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Отклонить выбранные акции"
        description="Укажите причину отклонения — план будет возвращён директору маркетинга на доработку."
        reasonLabel="Комментарий"
        confirmLabel="Отклонить"
        destructive
        onConfirm={rejectSelected}
      />

      {/* «7-я часть» §9 — rejection details behind the clickable «Отклонено» badge. */}
      <PlanRejectionDrawer
        open={rejectionRowId !== null}
        onOpenChange={(o) => !o && setRejectionRowId(null)}
        rowId={rejectionRowId}
        rowName={rejectionRowId ? rowById(rejectionRowId)?.name : undefined}
        events={rejectionRowId ? rejectionLog[rejectionRowId] ?? [] : []}
      />

      <PlanRowDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={editId ? "edit" : "create"}
        autoNo={autoNo}
        initial={editingRow}
        onSubmit={(row) => {
          if (editId) handleEdit(editId, row);
          else handleCreate(row);
        }}
      />
    </div>
  );
}

// ── Stepper ──────────────────────────────────────────────────────────────────

function PlanStepper({
  planStatus,
  currentActor,
  rejectedStage,
}: {
  planStatus: PlanStatus;
  currentActor: ReturnType<typeof actorForPlanStatus>;
  rejectedStage?: ReviewerStage;
}) {
  const isApproved = planStatus === "Утверждён";
  const isRejected = planStatus === "Отклонён";
  const activeIndex = currentActor
    ? PLAN_APPROVAL_CHAIN.indexOf(currentActor)
    : PLAN_APPROVAL_CHAIN.length;

  // The stage that rejected the plan (№4): kd → «Коммерческий директор», od → «ОД».
  const rejectIndex = isRejected
    ? rejectedStage === "od"
      ? PLAN_APPROVAL_CHAIN.indexOf("Операционный директор")
      : PLAN_APPROVAL_CHAIN.indexOf("Коммерческий директор")
    : -1;

  return (
    <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-1">
      {PLAN_APPROVAL_CHAIN.map((role, i) => {
        const rejectedHere = isRejected && i === rejectIndex;
        // When rejected, ONLY the stages before the rejecting one are «done» (green);
        // otherwise a stage is done when it's past the active one (or the plan is approved).
        const done = isRejected
          ? i < rejectIndex
          : i < activeIndex || isApproved;
        const active = !isRejected && !isApproved && i === activeIndex;

        return (
          <li key={role} className="flex items-center gap-1">
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2",
                active && "border-primary bg-primary/10",
                done && "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/15",
                rejectedHere && "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/15",
                !active && !done && !rejectedHere && "border-border bg-muted/40"
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  active && "bg-primary text-primary-foreground",
                  done && "bg-emerald-500 text-white",
                  rejectedHere && "bg-red-500 text-white",
                  !active &&
                    !done &&
                    !rejectedHere &&
                    "bg-gray-200 text-gray-600 dark:bg-muted dark:text-gray-300"
                )}
              >
                {done ? (
                  <Check className="size-3.5" />
                ) : rejectedHere ? (
                  <X className="size-3.5" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  rejectedHere
                    ? "text-red-700 dark:text-red-300"
                    : active
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-300"
                )}
              >
                {role}
                {rejectedHere && " — отклонил"}
              </span>
            </div>
            {i < PLAN_APPROVAL_CHAIN.length - 1 && (
              <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ── Create / edit-row dialog (Pattern E) ───────────────────────────────────────

function PlanRowDialog({
  open,
  onOpenChange,
  mode,
  autoNo,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  autoNo: string;
  initial?: PlanRow;
  onSubmit: (row: PlanRow) => void;
}) {
  const [type, setType] = React.useState("");
  const [name, setName] = React.useState("");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");

  const toInput = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setType(initial.type ?? "");
      setName(initial.name ?? "");
      setStart(toInput(initial.startDate));
      setEnd(toInput(initial.endDate));
    } else {
      setType("");
      setName("");
      setStart("");
      setEnd("");
    }
  }, [open, mode, initial]);

  // №2 — тип промо is OPTIONAL for a draft; only name + valid period are required.
  const valid = Boolean(name.trim() && start && end && start <= end);
  // The FULL id — persisted as the row's real identifier (`id: displayNo` below); never
  // shown to the user directly. `displayNoLabel` is the «26-N» text shown in the field.
  const displayNo = mode === "edit" && initial ? initial.id : autoNo;
  const displayNoLabel = formatPromoNo(displayNo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Изменить строку плана" : "Создать строку плана"}
          </DialogTitle>
          <DialogDescription>
            Тип промо можно выбрать позже — он обязателен только при отправке на
            согласование. Дни недели определяются автоматически по периоду акции.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan-num">№ промо</Label>
              <Input
                id="plan-num"
                value={displayNoLabel}
                readOnly
                disabled
                className="bg-muted/50 tabular-nums"
              />
              <p className="text-[11px] text-muted-foreground">
                {mode === "edit"
                  ? "Номер не изменяется."
                  : "Присваивается автоматически по порядку."}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>
                Тип промо{" "}
                <span className="font-normal text-muted-foreground">
                  (необязательно)
                </span>
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  {PROMO_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan-name">Название акции</Label>
            <Input
              id="plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Скидки на ноутбуки"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan-start">Дата начала</Label>
              <Input
                id="plan-start"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-end">Дата окончания</Label>
              <Input
                id="plan-end"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onSubmit({
                id: displayNo,
                type,
                name: name.trim(),
                startDate: new Date(start),
                endDate: new Date(end),
              });
              onOpenChange(false);
            }}
          >
            {mode === "edit" ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
