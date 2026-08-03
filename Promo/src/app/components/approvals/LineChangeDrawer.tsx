"use client";

import * as React from "react";
import { AlertTriangle, Ban, Check, Clock, Pencil, Plus, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@texnomart/ui/sheet";
import { Button } from "@texnomart/ui/button";
import { RuDate } from "../../../components/RuDate";
import { Money } from "../../../components/Money";
import { rowMarkerLabel, type ApprovalRow } from "../../../lib/approval-card";
import {
  formatPromoNo,
  getCategoryManager,
  getNomenclatureItem,
  type PromoCampaign,
  type ReviewSla,
} from "../../../lib/promo-mock-data";

export interface LineChangeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: PromoCampaign;
  row?: ApprovalRow;
  /** Stage SLA of the review item — §10 requires the overdue state to be visible here. */
  sla?: ReviewSla;
  /** Whether the current user may decide on this row (§15). */
  canAct?: boolean;
  onApprove?: (lineId: string) => void;
  onReject?: (lineId: string) => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium text-gray-900 dark:text-gray-100">
        {value}
      </span>
    </div>
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
    <div className="border-t pt-3">
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

/** «Поле / Было / Стало» grid — shared by the change and the exclusion cases. */
function DiffGrid({
  entries,
}: {
  entries: { label: string; was: string; now: string }[];
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1 text-sm">
      <span className="text-xs font-semibold text-muted-foreground">Поле</span>
      <span className="text-right text-xs font-semibold text-muted-foreground">
        Было
      </span>
      <span className="text-right text-xs font-semibold text-muted-foreground">
        Стало
      </span>
      {entries.map((e) => (
        <React.Fragment key={e.label}>
          <span className="text-gray-700 dark:text-gray-200">{e.label}</span>
          <span className="text-right tabular-nums text-muted-foreground line-through">
            {e.was}
          </span>
          <span className="text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">
            {e.now}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Боковая панель проверяющего по строке с повторным действием (Волна 3, R57 §7–§10, §15).
 *
 * Показывает тип изменения, сравнение «Было / Стало», комментарий КМ, дату повторной
 * отправки и срок/просрочку, а также позволяет принять решение прямо здесь — без
 * переходов между экранами. Read-only панель КМ живёт отдельно (`LineDetailsDrawer`
 * в полном календаре): у них разные аудитории и разный набор действий.
 */
export function LineChangeDrawer({
  open,
  onOpenChange,
  campaign,
  row,
  sla,
  canAct = false,
  onApprove,
  onReject,
}: LineChangeDrawerProps) {
  const line = row?.line;
  const nom = line ? getNomenclatureItem(line.nomenclatureId) : undefined;
  const km = line ? getCategoryManager(line.kmId) : undefined;
  const Icon =
    row?.kind === "addition" ? Plus : row?.kind === "removal" ? Ban : Pencil;

  const diffEntries =
    row?.kind === "removal"
      ? [
          {
            label: "Участие в акции",
            was: "Согласована в акции",
            now: "Предложена к удалению",
          },
        ]
      : (line?.pending?.fields ?? []).map((f) => ({
          label: f.label,
          was: f.was,
          now: f.now,
        }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-[440px]">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2">
            <Icon className="size-4 text-orange-600 dark:text-orange-400" />
            {row ? rowMarkerLabel(row) : "Детали строки"}
          </SheetTitle>
          <SheetDescription>
            {nom?.name ?? line?.nomenclatureId ?? "Позиция акции"}
          </SheetDescription>
        </SheetHeader>

        {campaign && line && row && (
          <div className="mt-4 space-y-3">
            <Section title="Информация об акции">
              <Row label="№ промо" value={formatPromoNo(campaign.id)} />
              <Row label="Название акции" value={campaign.name} />
              <Row label="Номенклатура" value={nom?.name ?? line.nomenclatureId} />
              <Row label="ФИО КМ" value={km?.name ?? line.kmId} />
            </Section>

            {diffEntries.length > 0 && (
              <Section title="Было / Стало">
                <DiffGrid entries={diffEntries} />
              </Section>
            )}

            {row.kind === "addition" && (
              <Section title="Данные добавленной позиции">
                <Row
                  label="Остаток"
                  value={
                    <span className="tabular-nums">
                      {line.stock.toLocaleString("ru-RU")}
                    </span>
                  }
                />
                <Row label="Новая цена" value={<Money value={line.newPrice} />} />
                <Row
                  label="Скидка"
                  value={<span className="tabular-nums">{line.discountPct}%</span>}
                />
                <Row
                  label="Прогноз продаж"
                  value={
                    <span className="tabular-nums">
                      {line.salesForecast != null
                        ? line.salesForecast.toLocaleString("ru-RU")
                        : "—"}
                    </span>
                  }
                />
              </Section>
            )}

            <Section title="Детали запроса">
              <Row label="Тип изменения" value={rowMarkerLabel(row)} />
              {row.requestType && row.requestType !== rowMarkerLabel(row) && (
                <Row label="Тип запроса" value={row.requestType} />
              )}
              <Row
                label="Кто отправил"
                value={
                  line.pending?.by ??
                  line.removalRequestedBy ??
                  "Категорийный менеджер (КМ)"
                }
              />
              <Row
                label="Дата повторной отправки"
                value={
                  row.sentAt ? (
                    <RuDate value={new Date(row.sentAt)} withTime />
                  ) : (
                    "—"
                  )
                }
              />
              <Row label="Комментарий КМ" value={row.comment ?? "—"} />
            </Section>

            {/* §10 — срок/просрочка обязательно видны при принятии решения */}
            {sla && (
              <Section title="Срок согласования">
                {sla.overdue > 0 ? (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/15 px-3 py-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Просрочено на{" "}
                      <span className="font-semibold tabular-nums">
                        +{sla.overdue} раб. дн.
                      </span>{" "}
                      — срок был до{" "}
                      <span className="tabular-nums">
                        {sla.deadline.toLocaleDateString("ru-RU")}
                      </span>
                      .
                    </p>
                  </div>
                ) : (
                  <p className="flex items-center gap-1.5 text-sm tabular-nums text-gray-700 dark:text-gray-200">
                    <Clock className="size-3.5 text-muted-foreground" />
                    Осталось {sla.remaining} раб. дн. (до{" "}
                    {sla.deadline.toLocaleDateString("ru-RU")})
                  </p>
                )}
              </Section>
            )}

            {line.pending?.rejected && (
              <Section title="Отклонение">
                <Row label="Кто отклонил" value={line.pending.rejected.by} />
                <Row
                  label="Дата"
                  value={
                    <RuDate value={new Date(line.pending.rejected.at)} withTime />
                  }
                />
                <Row label="Причина" value={line.pending.rejected.reason} />
              </Section>
            )}

            {/* §15 — решение принимается прямо из панели */}
            {canAct && row.requiresDecision && (
              <div className="sticky bottom-0 -mx-6 mt-2 flex gap-2 border-t bg-white dark:bg-card px-6 py-3">
                <Button
                  className="flex-1"
                  onClick={() => onApprove?.(line.id)}
                >
                  <Check className="size-4" />
                  Согласовать строку
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/15"
                  onClick={() => onReject?.(line.id)}
                >
                  <X className="size-4" />
                  Отклонить строку
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
