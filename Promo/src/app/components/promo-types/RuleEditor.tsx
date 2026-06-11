"use client";

import * as React from "react";
import { toast } from "sonner";
import { Archive, CheckCircle2, History, Info, Save, Send } from "lucide-react";
import { Card, CardContent } from "@texnomart/ui/card";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import { Checkbox } from "@texnomart/ui/checkbox";
import { ScrollArea } from "@texnomart/ui/scroll-area";
import { Separator } from "@texnomart/ui/separator";
import { buttonVariants } from "@texnomart/ui/button";
import { cn } from "@texnomart/ui/utils";
import { RuDate } from "../../../components/RuDate";
import type { PromoRole } from "../../role-context";
import {
  PROMO_TYPES,
  PROMO_TYPE_RULE_STATUS_LABEL,
  PROMO_TYPE_RULE_STATUS_TINT,
  promoTypeNamesFor,
  type PromoTypeRule,
  type PromoTypeSettingsAccess,
} from "../../../lib/promo-mock-data";
import { RULE_FIELD_GROUPS } from "./ruleFields";
import { usePromoTypes } from "./PromoTypesProvider";

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",");

interface RuleEditorProps {
  rule: PromoTypeRule;
  access: PromoTypeSettingsAccess;
  role: PromoRole;
}

export function RuleEditor({ rule, access, role }: RuleEditorProps) {
  const { save, send, confirm, archive } = usePromoTypes();
  const { canEdit, canConfirm } = access;

  // Local draft (remounts per rule via the page's key prop → fresh seed).
  const [name, setName] = React.useState(rule.name);
  const [typeIds, setTypeIds] = React.useState<string[]>(rule.promoTypeIds);
  const [fieldIds, setFieldIds] = React.useState<string[]>(
    rule.requiredFieldIds
  );

  const dirty =
    name.trim() !== rule.name ||
    !sameSet(typeIds, rule.promoTypeIds) ||
    !sameSet(fieldIds, rule.requiredFieldIds);

  const tint = PROMO_TYPE_RULE_STATUS_TINT[rule.status];
  const isArchived = rule.status === "archived";
  const readOnly = !canEdit || isArchived;

  // An edited approved rule was knocked back to «Черновик» (re-confirmation).
  const reconfirmNote = rule.history[rule.history.length - 1]?.note;
  const needsReconfirm =
    rule.status === "draft" && reconfirmNote?.includes("повторного");

  const toggleType = (id: string) =>
    setTypeIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  const toggleField = (id: string) =>
    setFieldIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  const toggleGroup = (groupFieldIds: string[], on: boolean) =>
    setFieldIds((prev) => {
      const set = new Set(prev);
      groupFieldIds.forEach((id) => (on ? set.add(id) : set.delete(id)));
      return [...set];
    });

  const typeNames = promoTypeNamesFor(typeIds);

  // ── actions ──────────────────────────────────────────────────────────────
  const onSave = () => {
    if (!name.trim()) {
      toast.error("Укажите наименование правила.");
      return;
    }
    save(rule.id, { name: name.trim(), promoTypeIds: typeIds, requiredFieldIds: fieldIds }, role);
    toast.success("Правило сохранено.");
  };
  const onSend = () => {
    if (dirty) onSave();
    send(rule.id, role);
    toast.success("Правило отправлено на подтверждение коммерческому директору.");
  };
  const onConfirm = () => {
    if (dirty) onSave();
    confirm(rule.id, role);
    toast.success("Правило утверждено и вступило в силу.");
  };
  const onArchive = () => {
    archive(rule.id, role);
    toast.success("Правило перемещено в архив.");
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pb-6">
      {/* ── status banner ── */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-gray-900">
                {rule.name}
              </h2>
              <span
                className={cn(
                  "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                  tint.bg,
                  tint.text
                )}
              >
                {PROMO_TYPE_RULE_STATUS_LABEL[rule.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {rule.status === "approved" && rule.confirmedAt ? (
                <>
                  Утверждено{rule.confirmedBy ? ` (${rule.confirmedBy})` : ""} ·{" "}
                  <RuDate value={rule.confirmedAt} />
                </>
              ) : rule.status === "pending" ? (
                "Ожидает подтверждения коммерческого директора."
              ) : rule.status === "archived" ? (
                "Правило в архиве и не влияет на заполнение данных."
              ) : (
                "Черновик — не влияет на заполнение данных до утверждения."
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {needsReconfirm && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            Правило изменено после утверждения и требует повторного утверждения
            коммерческим директором.
          </span>
        </div>
      )}

      {/* ── editable form ── */}
      <Card>
        <CardContent className="space-y-5 p-4">
          {/* name */}
          <div className="space-y-1.5">
            <Label htmlFor="rule-name">Наименование правила</Label>
            <Input
              id="rule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, «Рассрочка 0-0-12»"
              disabled={readOnly}
            />
          </div>

          {/* promo types */}
          <div className="space-y-2">
            <Label>Типы промо</Label>
            <div className="flex flex-wrap gap-2">
              {PROMO_TYPES.map((t) => {
                const checked = typeIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => toggleType(t.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                      checked
                        ? "border-amber-300 bg-amber-50 text-amber-900"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {checked && <CheckCircle2 className="size-3.5" />}
                    {t.name}
                  </button>
                );
              })}
            </div>
            {typeIds.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Выберите хотя бы один тип промо, к которому применяется правило.
              </p>
            )}
          </div>

          <Separator />

          {/* required fields checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Перечень обязательных полей</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                Выбрано: {fieldIds.length}
              </span>
            </div>

            <div className="space-y-4">
              {RULE_FIELD_GROUPS.map((group) => {
                const ids = group.fields.map((f) => f.id);
                const selectedCount = ids.filter((id) =>
                  fieldIds.includes(id)
                ).length;
                const allOn = selectedCount === ids.length;
                const groupChecked = allOn
                  ? true
                  : selectedCount > 0
                    ? "indeterminate"
                    : false;
                return (
                  <div key={group.key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`grp-${group.key}`}
                        checked={groupChecked}
                        disabled={readOnly}
                        onCheckedChange={(v) => toggleGroup(ids, v === true)}
                      />
                      <Label
                        htmlFor={`grp-${group.key}`}
                        className="text-sm font-semibold text-gray-800"
                      >
                        {group.label}
                      </Label>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {selectedCount}/{ids.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-2 pl-6 sm:grid-cols-2">
                      {group.fields.map((f) => {
                        const checked = fieldIds.includes(f.id);
                        return (
                          <label
                            key={f.id}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 text-sm text-gray-700",
                              readOnly && "cursor-not-allowed opacity-70"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              disabled={readOnly}
                              onCheckedChange={() => toggleField(f.id)}
                            />
                            <span className="line-clamp-1">{f.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── effect preview (§9.3) ── */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-900">
        <Info className="mt-0.5 size-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">
            {typeNames.length > 0 && fieldIds.length > 0
              ? `Для типа${typeNames.length > 1 ? "ов" : ""} «${typeNames.join("», «")}» станут обязательными ${fieldIds.length} ${fieldIds.length === 1 ? "поле" : "полей"}.`
              : "Правило ни на что не влияет: выберите типы промо и обязательные поля."}
          </p>
          <p className="text-blue-800">
            После утверждения коммерческим директором эти поля подсвечиваются и
            становятся обязательными в полном промо-календаре, блокируя «отправить
            на согласование», если они не заполнены. Пока правило не задано,
            полнота данных контролируется только в процессе согласования.
          </p>
        </div>
      </div>

      {/* ── actions ── */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty}
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
          >
            <Save className="size-4" />
            Сохранить
          </button>
          {rule.status === "draft" && (
            <button
              type="button"
              onClick={onSend}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Send className="size-4" />
              Отправить на подтверждение
            </button>
          )}
          {canConfirm && (rule.status === "pending" || rule.status === "draft") && (
            <button
              type="button"
              onClick={onConfirm}
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-emerald-600 text-white hover:bg-emerald-700"
              )}
            >
              <CheckCircle2 className="size-4" />
              Утвердить правило
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onArchive}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground hover:text-red-700"
            )}
          >
            <Archive className="size-4" />
            Архивировать
          </button>
        </div>
      )}

      {!canConfirm && rule.status === "pending" && canEdit && (
        <p className="text-xs text-muted-foreground">
          Правило отправлено. Утверждение выполняет коммерческий директор.
        </p>
      )}

      {/* ── change history (§9.5) ── */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-gray-800">
              История изменений
            </h3>
          </div>
          <ScrollArea className="max-h-64">
            <ol className="space-y-3">
              {[...rule.history].reverse().map((h, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <div className="mt-1 size-2 shrink-0 rounded-full bg-amber-300" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{h.action}</p>
                    {h.note && (
                      <p className="text-muted-foreground">{h.note}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {h.by} · <RuDate value={h.at} withTime />
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
