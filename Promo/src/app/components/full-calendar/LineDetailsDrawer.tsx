"use client";

import * as React from "react";
import { Ban, Check, Eye, Pencil, Plus, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@texnomart/ui/sheet";
import { Button } from "@texnomart/ui/button";
import { Textarea } from "@texnomart/ui/textarea";
import { RuDate } from "../../../components/RuDate";
import {
  getLineEditComment,
  setLineEditComment,
  type LineEditComment,
} from "../../../lib/line-edit-comment-store";
import {
  formatPromoNo,
  getCategoryManager,
  getNomenclatureItem,
  type PromoCampaign,
  type PromoLine,
} from "../../../lib/promo-mock-data";
import {
  isRepeatActionPending,
  lineDisplayStatus,
} from "../../../lib/full-calendar-status";

export interface LineDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: PromoCampaign;
  line?: PromoLine;
  /**
   * Может ли смотрящий приложить комментарий к правке (трекер стр. 57 п. 2) —
   * это КМ-владелец строки. Остальным тот же комментарий показывается текстом.
   */
  canComment?: boolean;
  /** Роль-подпись под сохранённым комментарием (персональной идентичности нет). */
  commentAuthor?: string;
  /**
   * Решение по повторному действию — только из этой панели (проверка прода
   * 14–15.09, №13 п.3): в строке таблицы остаётся просмотр. Передаются, только
   * если текущая роль решает по строке; согласование страница подтверждает
   * диалогом, отклонение требует причину.
   */
  onApprove?: (lineId: string) => void;
  onReject?: (lineId: string) => void;
}

/** Что именно решается — подпись над кнопками. */
function decisionSubject(line: PromoLine): string {
  if (line.removalPending) return "исключение позиции из акции";
  if (line.pending?.action === "addition") return "добавление номенклатуры";
  return "изменение данных позиции";
}

/**
 * Комментарий КМ к правке. Кнопка сохранения появляется только когда текст
 * отличается от сохранённого — пустое нажатие исключено; пустой текст снимает
 * комментарий, а не сохраняет пустую строку.
 */
function EditCommentField({
  lineId,
  canComment,
  author,
}: {
  lineId: string;
  canComment: boolean;
  author: string;
}) {
  const [saved, setSaved] = React.useState<LineEditComment | undefined>(() =>
    getLineEditComment(lineId)
  );
  const [draft, setDraft] = React.useState(saved?.comment ?? "");

  // Панель переиспользуется между строками — при смене строки подтягиваем её
  // собственный комментарий, иначе в поле остался бы текст от предыдущей.
  React.useEffect(() => {
    const next = getLineEditComment(lineId);
    setSaved(next);
    setDraft(next?.comment ?? "");
  }, [lineId]);

  if (!canComment) {
    return <Row label="Комментарий КМ к правке" value={saved?.comment ?? "—"} />;
  }

  const dirty = draft.trim() !== (saved?.comment ?? "");
  return (
    <div className="pt-1">
      <p className="mb-1 text-sm text-muted-foreground">Комментарий КМ к правке</p>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Комментарий к правке (необязательно)"
        className="min-h-16 text-sm"
      />
      {saved && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {saved.by} · <RuDate value={new Date(saved.at)} withTime />
        </p>
      )}
      {dirty && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="mt-1.5 h-7 text-xs"
          onClick={() => {
            setLineEditComment(lineId, draft, author);
            setSaved(getLineEditComment(lineId));
          }}
        >
          Сохранить комментарий
        </Button>
      )}
    </div>
  );
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
 * «Детали изменений» panel (10-я Блоки 4.3/5.3/6.7). For the deciding role it also
 * carries the decision on a pending repeat action (№13 п.3 — decisions live in the
 * panel, never in the table row); for everyone else it stays read-only. The approval
 * card (Волна 3 / R57) decides the same repeat actions through the same
 * `line-decision-store`.
 */
export function LineDetailsDrawer({
  open,
  onOpenChange,
  campaign,
  line,
  canComment = false,
  commentAuthor = "Категорийный менеджер (КМ)",
  onApprove,
  onReject,
}: LineDetailsDrawerProps) {
  const status =
    campaign && line ? lineDisplayStatus(campaign, line) : undefined;
  const nom = line ? getNomenclatureItem(line.nomenclatureId) : undefined;
  const km = line ? getCategoryManager(line.kmId) : undefined;
  const pending = line?.pending;
  const isExclusion = Boolean(line?.removalPending || line?.removed);
  const rejected = pending?.rejected;
  // Дата отправки запроса: у повторного действия она в `pending.at`, у запроса на
  // исключение — в `removalRequestedAt` (трекер, стр. 46).
  const requestedAtIso = pending?.at ?? line?.removalRequestedAt;
  const requestedAt = requestedAtIso ? new Date(requestedAtIso) : undefined;
  // Панель с решением заканчивается закреплённым футером — нижний отступ ему не нужен.
  const decidable = Boolean(
    (onApprove || onReject) && line && isRepeatActionPending(line)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* 11-я часть (06.08, Блок 4): у SheetContent нет собственного паддинга —
          телу панели нужны явные горизонтальные отступы, иначе текст прилипает
          к краям. */}
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-[440px]">
        <SheetHeader className="space-y-1 px-6 pt-5">
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
          <div className={decidable ? "mt-2 space-y-3 px-6" : "mt-2 space-y-3 px-6 pb-6"}>
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
              {/* Трекер, стр. 46 (проверка Б/А 09.09.26): у запроса на исключение
                  даты отправки не было — панель читала только `pending.at`, а
                  посев исключения хранит её в `removalRequestedAt`. */}
              <Row
                label="Дата отправки"
                value={
                  requestedAt ? (
                    <RuDate value={requestedAt} withTime />
                  ) : (
                    "—"
                  )
                }
              />
              <Row
                label="Комментарий"
                value={pending?.comment ?? line.removalReason ?? "—"}
              />
              {/* Комментарий КМ к правке — в отличие от комментария выше,
                  приходящего вместе с запросом, этот КМ пишет сам. */}
              <EditCommentField
                lineId={line.id}
                canComment={canComment}
                author={commentAuthor}
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

            {decidable && (
              <div className="sticky bottom-0 -mx-6 space-y-2 border-t bg-white px-6 py-3 dark:bg-card">
                <p className="text-sm text-muted-foreground">
                  Решение: {decisionSubject(line)}
                </p>
                <div className="flex gap-2">
                  {onApprove && (
                    <Button className="min-h-11 flex-1" onClick={() => onApprove(line.id)}>
                      <Check className="size-4" />
                      Согласовать
                    </Button>
                  )}
                  {onReject && (
                    <Button
                      variant="outline"
                      className="min-h-11 flex-1 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/15"
                      onClick={() => onReject(line.id)}
                    >
                      <X className="size-4" />
                      Отклонить
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
