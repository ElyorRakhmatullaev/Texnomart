"use client";

import * as React from "react";
import { CalendarPlus, Link2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@texnomart/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@texnomart/ui/tabs";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { Button } from "@texnomart/ui/button";
import {
  MIN_UNPLANNED_LEAD_DAYS,
  PROMO_TYPES,
  minUnplannedStartDate,
  validateUnplannedInput,
  type PromoCampaign,
  type UnplannedCampaignInput,
} from "../../../lib/promo-mock-data";

/** Local <input type="date"> value (yyyy-mm-dd) ⇄ Date helpers (local-tz safe). */
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

type Mode = "new" | "integrate";

/**
 * Create-campaign dialog (S2 Phase 5, §10). Two modes:
 *  • «Новая внеплановая» — no № промо (the system generates one), признак auto
 *    «Внеплановая», тип chosen here, срок подачи ≥ 3 кал. дн. до старта.
 *  • «Встроить в плановую» — pick an existing planned campaign and add nomenclature
 *    to it (keeps признак «Плановая», existing № промо).
 *
 * When `editCampaign` is set, the dialog is in EDIT mode for an unplanned, not-yet-sent
 * campaign — only the «Новая внеплановая» form is shown, prefilled (тип editable until
 * first send, §10). Opened from a page-level button, so the parent defers the open by
 * a tick (controlled Radix dialog self-dismiss race — see tasks/lessons.md S2 Phase 3).
 */
export function CreateCampaignDialog({
  open,
  onOpenChange,
  plannedCampaigns,
  editCampaign,
  onCreate,
  onEdit,
  onIntegrate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Planned, non-cancelled campaigns available to integrate into. */
  plannedCampaigns: PromoCampaign[];
  /** Non-null → edit an existing unplanned campaign (тип/период) before first send. */
  editCampaign?: PromoCampaign | null;
  onCreate: (input: Omit<UnplannedCampaignInput, "kmId">) => void;
  onEdit: (
    campaignId: string,
    patch: { type: string; name: string; startDate: Date; endDate: Date }
  ) => void;
  onIntegrate: (campaignId: string) => void;
}) {
  const isEdit = Boolean(editCampaign);
  const minStart = React.useMemo(() => minUnplannedStartDate(), []);

  const [mode, setMode] = React.useState<Mode>("new");
  const [type, setType] = React.useState(PROMO_TYPES[0].name);
  const [name, setName] = React.useState("");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [integrateId, setIntegrateId] = React.useState("");

  // (Re)seed the form whenever the dialog opens — prefill in edit mode.
  React.useEffect(() => {
    if (!open) return;
    if (editCampaign) {
      setMode("new");
      setType(editCampaign.type);
      setName(editCampaign.name);
      setStart(toInputDate(editCampaign.startDate));
      setEnd(toInputDate(editCampaign.endDate));
    } else {
      setMode("new");
      setType(PROMO_TYPES[0].name);
      setName("");
      setStart("");
      setEnd("");
      setIntegrateId(plannedCampaigns[0]?.id ?? "");
    }
  }, [open, editCampaign, plannedCampaigns]);

  const startDate = fromInputDate(start);
  const endDate = fromInputDate(end);
  // In edit mode the campaign may already start sooner than today + 3 дн.; only
  // enforce the lead-time rule for brand-new campaigns.
  const validation = validateUnplannedInput(
    { name, startDate, endDate },
    isEdit ? new Date(0) : new Date()
  );

  const submitNew = () => {
    if (!validation.ok || !startDate || !endDate) return;
    if (isEdit && editCampaign) {
      onEdit(editCampaign.id, { type, name: name.trim(), startDate, endDate });
    } else {
      onCreate({ type, name: name.trim(), startDate, endDate });
    }
    onOpenChange(false);
  };

  const submitIntegrate = () => {
    if (!integrateId) return;
    onIntegrate(integrateId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[560px] max-sm:h-full max-sm:max-h-full max-sm:max-w-full max-sm:rounded-none">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle>
            {isEdit ? "Изменить внеплановую акцию" : "Создать акцию"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Тип и период можно менять до первой отправки на согласование."
              : "Создайте внеплановую акцию или встройте номенклатуру в существующую плановую."}
          </DialogDescription>
        </DialogHeader>

        {isEdit ? (
          <div className="overflow-y-auto px-5 py-4">
            <UnplannedForm
              type={type}
              setType={setType}
              name={name}
              setName={setName}
              start={start}
              setStart={setStart}
              end={end}
              setEnd={setEnd}
              minStart={isEdit ? undefined : minStart}
              errors={validation.errors}
            />
          </div>
        ) : (
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as Mode)}
            className="gap-0"
          >
            <div className="px-5 pt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new">
                  <CalendarPlus className="size-4" />
                  Новая внеплановая
                </TabsTrigger>
                <TabsTrigger value="integrate">
                  <Link2 className="size-4" />
                  Встроить в плановую
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="new" className="overflow-y-auto px-5 py-4">
              <UnplannedForm
                type={type}
                setType={setType}
                name={name}
                setName={setName}
                start={start}
                setStart={setStart}
                end={end}
                setEnd={setEnd}
                minStart={minStart}
                errors={validation.errors}
              />
            </TabsContent>

            <TabsContent value="integrate" className="overflow-y-auto px-5 py-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Номенклатура добавится в выбранную плановую акцию с её № промо;
                  признак остаётся «Плановая».
                </p>
                <div className="space-y-1.5">
                  <Label>Плановая акция</Label>
                  {plannedCampaigns.length > 0 ? (
                    <Select value={integrateId} onValueChange={setIntegrateId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите акцию" />
                      </SelectTrigger>
                      <SelectContent>
                        {plannedCampaigns.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.id} · {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="rounded-md border border-dashed bg-gray-50 px-3 py-4 text-center text-sm text-muted-foreground">
                      Нет доступных плановых акций.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="border-t px-5 py-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          {isEdit ? (
            <Button onClick={submitNew} disabled={!validation.ok}>
              Сохранить изменения
            </Button>
          ) : mode === "new" ? (
            <Button onClick={submitNew} disabled={!validation.ok}>
              <Plus className="size-4" />
              Создать акцию
            </Button>
          ) : (
            <Button onClick={submitIntegrate} disabled={!integrateId}>
              <Link2 className="size-4" />
              Встроить и добавить номенклатуру
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UnplannedForm({
  type,
  setType,
  name,
  setName,
  start,
  setStart,
  end,
  setEnd,
  minStart,
  errors,
}: {
  type: string;
  setType: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  start: string;
  setStart: (v: string) => void;
  end: string;
  setEnd: (v: string) => void;
  /** Min start for new campaigns (omit in edit mode where the rule isn't re-enforced). */
  minStart?: Date;
  errors: { name?: string; startDate?: string; endDate?: string };
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="unplanned-type">Тип промо</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="unplanned-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROMO_TYPES.map((t) => (
              <SelectItem key={t.id} value={t.name}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Тип можно изменить только до первой отправки на согласование.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="unplanned-name">Название акции</Label>
        <Input
          id="unplanned-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например: Срочная скидка на холодильники"
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="unplanned-start">Дата начала</Label>
          <Input
            id="unplanned-start"
            type="date"
            value={start}
            min={minStart ? toInputDate(minStart) : undefined}
            onChange={(e) => setStart(e.target.value)}
            aria-invalid={Boolean(errors.startDate)}
          />
          {errors.startDate && (
            <p className="text-xs text-red-600">{errors.startDate}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unplanned-end">Дата окончания</Label>
          <Input
            id="unplanned-end"
            type="date"
            value={end}
            min={start || undefined}
            onChange={(e) => setEnd(e.target.value)}
            aria-invalid={Boolean(errors.endDate)}
          />
          {errors.endDate && (
            <p className="text-xs text-red-600">{errors.endDate}</p>
          )}
        </div>
      </div>

      {minStart && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
          Срок подачи внеплановой акции — не менее {MIN_UNPLANNED_LEAD_DAYS}{" "}
          календарных дней до старта. № промо присвоится системой автоматически.
        </p>
      )}
    </div>
  );
}
