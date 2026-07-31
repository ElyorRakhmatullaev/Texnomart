"use client";

import * as React from "react";
import { Ban, Eye, Pencil, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@texnomart/ui/sheet";
import { RuDate } from "../../../components/RuDate";
import {
  formatPromoNo,
  getCategoryManager,
  getNomenclatureItem,
  type PromoCampaign,
  type PromoLine,
} from "../../../lib/promo-mock-data";
import { lineDisplayStatus } from "../../../lib/full-calendar-status";

export interface LineDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: PromoCampaign;
  line?: PromoLine;
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

/**
 * Read-only «Детали изменений» panel (10-я Блоки 4.3/5.3/6.7). Action decisions
 * (Согласовать/Отклонить строку) belong to the approval card (Волна 3 / R57).
 */
export function LineDetailsDrawer({
  open,
  onOpenChange,
  campaign,
  line,
}: LineDetailsDrawerProps) {
  const status =
    campaign && line ? lineDisplayStatus(campaign, line) : undefined;
  const nom = line ? getNomenclatureItem(line.nomenclatureId) : undefined;
  const km = line ? getCategoryManager(line.kmId) : undefined;
  const pending = line?.pending;
  const isExclusion = Boolean(line?.removalPending || line?.removed);
  const rejected = pending?.rejected;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-[420px]">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2">
            <Eye className="size-4 text-muted-foreground" />
            Детали изменений
          </SheetTitle>
          <SheetDescription>
            {status ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-orange-700 dark:text-orange-300">
                {pending?.action === "addition" && <Plus className="size-3.5" />}
                {isExclusion && <Ban className="size-3.5" />}
                {pending?.action === "change" && <Pencil className="size-3.5" />}
                {status}
              </span>
            ) : (
              "Позиция"
            )}
          </SheetDescription>
        </SheetHeader>

        {campaign && line && (
          <div className="mt-4 space-y-3">
            <Section title="Информация об акции">
              <Row label="№ промо" value={formatPromoNo(campaign.id)} />
              <Row label="Номенклатура" value={nom?.name ?? line.nomenclatureId} />
              <Row label="ФИО КМ" value={km?.name ?? line.kmId} />
              <Row label="Тип промо" value={campaign.type} />
              <Row label="Название акции" value={campaign.name} />
              <Row
                label="Период акции"
                value={
                  <span className="tabular-nums">
                    <RuDate value={campaign.startDate} /> —{" "}
                    <RuDate value={campaign.endDate} />
                  </span>
                }
              />
            </Section>

            {pending?.action === "change" &&
              pending.fields &&
              pending.fields.length > 0 && (
                <Section title="Изменение">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1 text-sm">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Поле
                    </span>
                    <span className="text-right text-xs font-semibold text-muted-foreground">
                      Было
                    </span>
                    <span className="text-right text-xs font-semibold text-muted-foreground">
                      Стало
                    </span>
                    {pending.fields.map((f) => (
                      <React.Fragment key={String(f.field)}>
                        <span className="text-gray-700 dark:text-gray-200">
                          {f.label}
                        </span>
                        <span className="text-right tabular-nums text-muted-foreground line-through">
                          {f.was}
                        </span>
                        <span className="text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">
                          {f.now}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </Section>
              )}

            {pending?.action === "addition" && (
              <Section title="Изменение">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  Добавлена номенклатура в уже согласованную акцию. Данные позиции —
                  в основной таблице; станут актуальными после согласования.
                </p>
              </Section>
            )}

            {isExclusion && (
              <Section title="Изменение">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  Тип действия: <b>Запрос на исключение из промо</b>. Ранее
                  согласованная позиция — КМ предлагает исключить её из акции.
                </p>
              </Section>
            )}

            <Section title="Детали запроса">
              <Row
                label="Тип запроса"
                value={
                  pending?.requestType ??
                  (isExclusion ? "Запрос на исключение из промо" : "—")
                }
              />
              <Row
                label="Кто отправил"
                value={pending?.by ?? line.removalRequestedBy ?? "—"}
              />
              <Row
                label="Дата отправки"
                value={
                  pending ? (
                    <RuDate value={new Date(pending.at)} withTime />
                  ) : (
                    "—"
                  )
                }
              />
              <Row
                label="Комментарий"
                value={pending?.comment ?? line.removalReason ?? "—"}
              />
            </Section>

            {rejected && (
              <Section title="Отклонение">
                <Row label="Кто отклонил" value={rejected.by} />
                <Row
                  label="Дата"
                  value={<RuDate value={new Date(rejected.at)} withTime />}
                />
                <Row label="Причина" value={rejected.reason} />
              </Section>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
