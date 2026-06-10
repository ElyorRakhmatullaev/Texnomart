"use client";

import * as React from "react";
import { Gift } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@texnomart/ui/sheet";
import { Button } from "@texnomart/ui/button";
import { Label } from "@texnomart/ui/label";
import { Checkbox } from "@texnomart/ui/checkbox";
import { cn } from "@texnomart/ui/utils";
import { Money } from "../../../components/Money";
import { RuDate } from "../../../components/RuDate";
import { EditableCell, type EditableKind } from "./EditableCell";
import { WarehousePopover } from "./WarehousePopover";
import {
  getNomenclatureItem,
  isGiftType,
  type FullCalendarAccess,
  type PromoCampaign,
  type PromoLine,
} from "../../../lib/promo-mock-data";

/**
 * Full-screen «редактировать строку» Sheet (S2 Phase 5, RESPONSIVE §). On phones the
 * dense grid is hard to edit cell-by-cell, so tapping a line opens this Sheet with the
 * line's editable fields STACKED BY GROUP (Товар / Цены / Маркетинг). Reuses EditableCell
 * so edits flow through the same page-level store and validation as the grid.
 *
 * Opened from a grid button, so the parent defers the open by a tick (controlled Radix
 * Sheet = react-dialog under the hood → same outside-pointer self-dismiss race as the
 * page-hosted dialogs; see tasks/lessons.md S2 Phases 3–4).
 */
export function LineEditSheet({
  open,
  onOpenChange,
  line,
  campaign,
  access,
  onEdit,
  onGiftPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line: PromoLine | undefined;
  campaign: PromoCampaign | undefined;
  access: FullCalendarAccess;
  onEdit: (lineId: string, patch: Partial<PromoLine>) => void;
  onGiftPick: (lineId: string) => void;
}) {
  const nom = line ? getNomenclatureItem(line.nomenclatureId) : undefined;
  const gift = campaign ? isGiftType(campaign.type) : false;
  const kmEditable = access.canEditOwnLines;
  const mktEditable = access.marketingFlagOnly;

  const edit = (patch: Partial<PromoLine>) => {
    if (line) onEdit(line.id, patch);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b">
          <SheetTitle>Редактировать строку</SheetTitle>
          <SheetDescription>
            {nom?.name ?? line?.nomenclatureId ?? ""}
            {line && (
              <span className="ml-1 tabular-nums">· {line.nomenclatureId}</span>
            )}
          </SheetDescription>
        </SheetHeader>

        {line && campaign ? (
          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            {/* Read-only campaign + 1С context */}
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg border bg-gray-50 p-3 text-sm">
              <Info label="Признак">
                {campaign.planned ? "Плановая" : "Внеплановая"}
              </Info>
              <Info label="Тип">{campaign.type}</Info>
              <Info label="Период">
                <span className="tabular-nums">
                  <RuDate value={campaign.startDate} /> —{" "}
                  <RuDate value={campaign.endDate} />
                </span>
              </Info>
              <Info label="Себестоимость">
                {nom ? <Money value={nom.cost} /> : "—"}
              </Info>
              <Info label="Розничная цена (старая)">
                {nom ? <Money value={nom.oldRetailPrice} /> : "—"}
              </Info>
            </dl>

            {/* ── Товар ── */}
            <Section title="Товар">
              <Field label="Остаток">
                <span className="inline-flex w-full items-center gap-2">
                  <span className="min-w-0 flex-1">
                    <EditableCell
                      value={line.stock}
                      kind="number"
                      editable={kmEditable}
                      manualEdited={line.stockManual}
                      manualHint="Значение изменено вручную, автообновление остановлено"
                      onCommit={(v) =>
                        edit({
                          stock: typeof v === "number" ? v : 0,
                          stockManual: true,
                        })
                      }
                    />
                  </span>
                  <WarehousePopover nomenclatureId={line.nomenclatureId} />
                </span>
              </Field>
            </Section>

            {/* ── Цены ── */}
            <Section title="Цены">
              <NumField
                label="Новая цена (розничная)"
                value={line.newPrice}
                kind="money"
                editable={kmEditable}
                onCommit={(v) => edit({ newPrice: typeof v === "number" ? v : 0 })}
              />
              <NumField
                label="Скидка, %"
                value={line.discountPct}
                kind="percent"
                editable={kmEditable}
                onCommit={(v) =>
                  edit({ discountPct: typeof v === "number" ? v : 0 })
                }
              />
              <NumField
                label="Регулярные продажи"
                value={line.regularSales}
                kind="number"
                editable={kmEditable}
                onCommit={(v) =>
                  edit({ regularSales: typeof v === "number" ? v : undefined })
                }
              />
              <NumField
                label="Прогноз продаж"
                required
                value={line.salesForecast}
                kind="number"
                editable={kmEditable}
                onCommit={(v) =>
                  edit({ salesForecast: typeof v === "number" ? v : undefined })
                }
              />
              <NumField
                label="Скидка, % за Cash"
                value={line.cashDiscountPct}
                kind="percent"
                editable={kmEditable}
                onCommit={(v) =>
                  edit({ cashDiscountPct: typeof v === "number" ? v : undefined })
                }
              />
            </Section>

            {/* ── Маркетинг ── */}
            <Section title="Маркетинг">
              {gift && (
                <>
                  <Field label="Номенклатура по подаркам" required>
                    {kmEditable ? (
                      <button
                        type="button"
                        onClick={() => onGiftPick(line.id)}
                        className={cn(
                          "flex h-9 w-full items-center gap-1.5 rounded-md border px-3 text-left text-sm hover:bg-gray-50",
                          line.giftNomenclatureId
                            ? "text-gray-900"
                            : "text-red-600"
                        )}
                      >
                        <Gift className="size-4 shrink-0" />
                        <span className="truncate">
                          {line.giftNomenclatureId
                            ? getNomenclatureItem(line.giftNomenclatureId)?.name ??
                              line.giftNomenclatureId
                            : "Выбрать подарок (не заполнено)"}
                        </span>
                      </button>
                    ) : (
                      <ReadOnlyText
                        text={
                          line.giftNomenclatureId
                            ? getNomenclatureItem(line.giftNomenclatureId)?.name
                            : undefined
                        }
                        required
                      />
                    )}
                  </Field>
                  <NumField
                    label="Остаток подарка"
                    required
                    value={line.giftStock}
                    kind="number"
                    editable={kmEditable}
                    onCommit={(v) =>
                      edit({ giftStock: typeof v === "number" ? v : undefined })
                    }
                  />
                </>
              )}
              <NumField
                label="Компенсация поставщика"
                value={line.supplierCompensation}
                kind="money"
                editable={kmEditable}
                onCommit={(v) =>
                  edit({
                    supplierCompensation: typeof v === "number" ? v : undefined,
                  })
                }
              />
              <NumField
                label="Лимит компенс. кол-ва"
                value={line.compensationLimit}
                kind="number"
                editable={kmEditable}
                onCommit={(v) =>
                  edit({
                    compensationLimit: typeof v === "number" ? v : undefined,
                  })
                }
              />
              <Field label="УТП">
                <EditableCell
                  value={line.utp}
                  kind="text"
                  editable={kmEditable}
                  onCommit={(v) =>
                    edit({ utp: typeof v === "string" ? v : undefined })
                  }
                />
              </Field>
              <CheckField
                label="В рекламу (рекомендация КМ)"
                checked={line.advRecommendedKm}
                disabled={!kmEditable}
                onChange={(c) => edit({ advRecommendedKm: c })}
              />
              <CheckField
                label="В рекламу (выбрано маркетингом)"
                checked={line.advSelectedMarketing}
                disabled={!mktEditable}
                onChange={(c) => edit({ advSelectedMarketing: c })}
              />
            </Section>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <SheetFooter className="border-t">
          <Button onClick={() => onOpenChange(false)} className="min-h-11">
            Готово
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

/** A number/money/percent field — EditableCell wrapped in a bordered box for the Sheet. */
function NumField({
  label,
  required,
  value,
  kind,
  editable,
  onCommit,
}: {
  label: string;
  required?: boolean;
  value: number | undefined;
  kind: EditableKind;
  editable: boolean;
  onCommit: (next: number | string | undefined) => void;
}) {
  return (
    <Field label={label} required={required}>
      <div className="rounded-md border px-2 py-1">
        <EditableCell
          value={value}
          kind={kind}
          editable={editable}
          required={required}
          onCommit={onCommit}
        />
      </div>
    </Field>
  );
}

function CheckField({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-2.5 text-sm",
        disabled ? "text-muted-foreground" : "text-gray-900"
      )}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(c) => onChange(c === true)}
      />
      {label}
    </label>
  );
}

function Info({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium text-gray-900">{children}</dd>
    </div>
  );
}

function ReadOnlyText({ text, required }: { text?: string; required?: boolean }) {
  if (text)
    return <p className="text-sm text-gray-900">{text}</p>;
  return required ? (
    <p className="text-sm font-medium text-red-600">не заполнено</p>
  ) : (
    <p className="text-sm text-muted-foreground">—</p>
  );
}
