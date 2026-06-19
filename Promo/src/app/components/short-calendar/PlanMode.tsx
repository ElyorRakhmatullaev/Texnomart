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
import { PlanApprovalTable } from "./PlanApprovalTable";
import { useRole } from "../../role-context";
import {
  PLAN_APPROVAL_CHAIN,
  PROMO_TYPES,
  actorForPlanStatus,
  type PlanStatus,
  type PromoCampaign,
} from "../../../lib/promo-mock-data";

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

/** Roles allowed to create/edit plan rows before the plan is sent for approval. */
const PLAN_EDITOR = "Директор маркетинга";

export function PlanMode({ campaigns }: PlanModeProps) {
  const { currentRole } = useRole();

  // The plan is modelled as a single object in local (mock) state. It starts
  // mid-flow at «На согл. с КД» so the multi-level chain is visible immediately.
  const [planStatus, setPlanStatus] = React.useState<PlanStatus>("На согл. с КД");
  const [extraRows, setExtraRows] = React.useState<PlanRow[]>([]);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  const currentActor = actorForPlanStatus(planStatus);
  const isApproved = planStatus === "Утверждён";
  const isRejected = planStatus === "Отклонён";
  const canAct = currentActor !== undefined && currentRole === currentActor;
  const canEditRows = !isApproved && !isRejected && currentRole === PLAN_EDITOR;

  const rows: PlanRow[] = [
    ...campaigns.map((c) => ({
      id: c.id,
      type: c.type,
      name: c.name,
      startDate: c.startDate,
      endDate: c.endDate,
    })),
    ...extraRows,
  ];

  function advance(next: PlanStatus, message: string) {
    setPlanStatus(next);
    toast.success(message);
  }

  return (
    <div className="space-y-4">
      {/* ── Approval chain stepper ──────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-0">
          <h2 className="text-sm font-semibold text-gray-900">
            Согласование плана акций
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <PlanStepper planStatus={planStatus} currentActor={currentActor} />

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Текущий статус:</span>
              <PromoStatusBadge status={planStatus} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentActor && !canAct && (
                <span className="text-xs text-muted-foreground">
                  Сейчас действует: <b className="text-gray-700">{currentActor}</b>
                </span>
              )}

              {/* Директор маркетинга — drafting / send for approval */}
              {canAct && currentActor === "Директор маркетинга" && (
                <Button
                  onClick={() =>
                    advance("На согл. с КД", "План отправлен на согласование КД")
                  }
                >
                  <Send className="size-4" />
                  Отправить на согласование
                </Button>
              )}

              {/* Коммерческий директор — approve → ОД, or reject */}
              {canAct && currentActor === "Коммерческий директор" && (
                <>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setRejectOpen(true)}
                  >
                    <ThumbsDown className="size-4" />
                    Отклонить
                  </Button>
                  <Button
                    onClick={() =>
                      advance(
                        "На согл. с ОД",
                        "План согласован КД и передан операционному директору"
                      )
                    }
                  >
                    <ThumbsUp className="size-4" />
                    Согласовать
                  </Button>
                </>
              )}

              {/* Операционный директор — final approve, or reject */}
              {canAct && currentActor === "Операционный директор" && (
                <>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setRejectOpen(true)}
                  >
                    <ThumbsDown className="size-4" />
                    Отклонить
                  </Button>
                  <Button
                    onClick={() => advance("Утверждён", "План утверждён")}
                  >
                    <ThumbsUp className="size-4" />
                    Утвердить план
                  </Button>
                </>
              )}

              {isApproved && (
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
                  <Check className="size-4" />
                  План утверждён — поля переведены в режим только чтения
                </span>
              )}
              {isRejected && (
                <Button
                  variant="outline"
                  onClick={() =>
                    advance("На обсуждении", "План возвращён на доработку")
                  }
                >
                  Вернуть на доработку
                </Button>
              )}
            </div>
          </div>

          <DeadlineChips startDate={rows[0]?.startDate} />
        </CardContent>
      </Card>

      {/* ── Plan rows ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <h2 className="text-sm font-semibold text-gray-900">
            Строки плана
            <span className="ml-2 font-normal text-muted-foreground">
              {rows.length}
            </span>
          </h2>
          {canEditRows ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Создать строку плана
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              {isApproved
                ? "План утверждён — редактирование закрыто"
                : "Редактирование доступно директору маркетинга до отправки"}
            </span>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <PlanApprovalTable rows={rows} />
        </CardContent>
      </Card>

      <ReasonDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Отклонить план акций"
        description="Укажите причину — она будет сохранена в истории и направлена директору маркетинга."
        confirmLabel="Отклонить"
        destructive
        onConfirm={() => advance("Отклонён", "План отклонён, причина сохранена")}
      />

      <CreatePlanRowDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={(row) => {
          setExtraRows((prev) => [...prev, row]);
          toast.success(`Строка плана «${row.name}» добавлена`);
        }}
      />
    </div>
  );
}

// ── Stepper ──────────────────────────────────────────────────────────────────

function PlanStepper({
  planStatus,
  currentActor,
}: {
  planStatus: PlanStatus;
  currentActor: ReturnType<typeof actorForPlanStatus>;
}) {
  const isApproved = planStatus === "Утверждён";
  const isRejected = planStatus === "Отклонён";
  const activeIndex = currentActor
    ? PLAN_APPROVAL_CHAIN.indexOf(currentActor)
    : PLAN_APPROVAL_CHAIN.length; // approved/rejected → past the end

  return (
    <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-1">
      {PLAN_APPROVAL_CHAIN.map((role, i) => {
        const done = i < activeIndex || isApproved;
        const active = i === activeIndex && !isApproved && !isRejected;
        const rejectedHere = isRejected && i === activeIndex;

        return (
          <li key={role} className="flex items-center gap-1">
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2",
                active && "border-primary bg-primary/10",
                done && "border-emerald-200 bg-emerald-50",
                rejectedHere && "border-red-200 bg-red-50",
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
                    "bg-gray-200 text-gray-600"
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  active ? "text-gray-900" : "text-gray-600"
                )}
              >
                {role}
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

// ── Create-row dialog (Pattern E) ──────────────────────────────────────────────

function CreatePlanRowDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (row: PlanRow) => void;
}) {
  const [num, setNum] = React.useState("");
  const [type, setType] = React.useState("");
  const [name, setName] = React.useState("");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setNum("");
      setType("");
      setName("");
      setStart("");
      setEnd("");
    }
  }, [open]);

  const valid =
    num.trim() && type && name.trim() && start && end && start <= end;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Создать строку плана</DialogTitle>
          <DialogDescription>
            Дни недели определяются автоматически по периоду акции.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan-num">№ промо</Label>
              <Input
                id="plan-num"
                value={num}
                onChange={(e) => setNum(e.target.value)}
                placeholder="PR-2026-00X"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Тип промо</Label>
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
              onCreate({
                id: num.trim(),
                type,
                name: name.trim(),
                startDate: new Date(start),
                endDate: new Date(end),
              });
              onOpenChange(false);
            }}
          >
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
