import type {
  CampaignStatus,
  LinePendingChange,
  PromoCampaign,
  PromoLine,
} from "./promo-mock-data";

export type { LinePendingChange };

/** The concrete status a single line can have (what `lineDisplayStatus` returns). */
export type LineStatus =
  | "Черновик"
  | "На согласовании у старшего КМ"
  | "На согласовании у коммерческого директора"
  | "Переотправлено на корректировку КМ"
  | "Изменения на согласовании"
  | "Исключение на согласовании"
  | "Отклонённые изменения"
  | "Согласовано"
  | "Согласовано и отправлено смежным отделам"
  | "Отменена / Удалена";

/** Synthetic filter value — matches any line awaiting a decision (Блок 3.4/7.3). */
export const STATUS_FILTER_UMBRELLA = "На согласовании (общее)";

/** Statuses the umbrella «На согласовании (общее)» covers. */
export const PENDING_APPROVAL_STATUSES: LineStatus[] = [
  "На согласовании у старшего КМ",
  "На согласовании у коммерческого директора",
  "Изменения на согласовании",
  "Исключение на согласовании",
];

/** Dropdown options for the single «Все статусы» filter (Блок 7.2), in the spec order. */
export const STATUS_FILTER_OPTIONS: string[] = [
  "Черновик",
  STATUS_FILTER_UMBRELLA,
  "На согласовании у старшего КМ",
  "На согласовании у коммерческого директора",
  "Переотправлено на корректировку КМ",
  "Изменения на согласовании",
  "Исключение на согласовании",
  "Отклонённые изменения",
  "Согласовано",
  "Согласовано и отправлено смежным отделам",
  "Отменена / Удалена",
];

const APPROVED_STATUS: CampaignStatus = "Согласовано и отправлено смежным отделам";

/**
 * The one per-line status (10-я Блоки 1–7). Priority: removed → exclusion-pending →
 * rejected-repeat → pending-repeat → cancelled campaign → line draft → line rejected →
 * campaign.status.
 */
export function lineDisplayStatus(
  campaign: PromoCampaign,
  line: PromoLine
): LineStatus {
  if (line.removed) return "Отменена / Удалена";
  if (line.removalPending) return "Исключение на согласовании";
  if (line.pending?.rejected) return "Отклонённые изменения";
  if (line.pending) return "Изменения на согласовании"; // change OR addition (Блок 4)
  if (campaign.cancelled) return "Отменена / Удалена";
  // Позиция, которую КМ ещё не отправил (№13 п.1), — черновик при любом статусе
  // акции: иначе она наследовала «На согласовании…» и сразу была видна проверяющим.
  if (line.draft) return "Черновик";
  // Позиция, отклонённая проверяющим, — на корректировке у КМ при любом статусе
  // акции (№13 п.4). Прежде эта проверка стояла после `switch` и не срабатывала:
  // `switch` выходит раньше для всех статусов, кроме «Отменена».
  if (line.rejected) return "Переотправлено на корректировку КМ";

  switch (campaign.status) {
    case "Черновик":
      return "Черновик";
    case "Переотправлено на корректировку КМ":
      return "Переотправлено на корректировку КМ";
    case "На согласовании у старшего КМ":
      return "На согласовании у старшего КМ";
    case "На согласовании у коммерческого директора":
      return "На согласовании у коммерческого директора";
    case "Согласовано и отправлено смежным отделам":
      return "Согласовано и отправлено смежным отделам";
    default:
      break;
  }
  // Unplanned draft not yet sent → still a draft.
  if (!campaign.planned && !campaign.firstSendDone) return "Черновик";
  return campaign.status === APPROVED_STATUS
    ? "Согласовано и отправлено смежным отделам"
    : "Согласовано";
}

/** Filter predicate for the single «Все статусы» control. */
export function matchesStatusFilter(status: LineStatus, filter: string): boolean {
  if (!filter || filter === "all" || filter === "Все статусы") return true;
  if (filter === STATUS_FILTER_UMBRELLA)
    return PENDING_APPROVAL_STATUSES.includes(status);
  return status === filter;
}

/** Light-orange highlight (Блок 1.3): only active repeat actions awaiting approval. */
export function isRepeatActionPending(line: PromoLine): boolean {
  return Boolean(
    (line.pending && !line.pending.rejected) ||
      (line.removalPending && !line.removed)
  );
}

/**
 * Позиция, которую можно исключить из согласованной акции (№13 п.2): сама акция
 * согласована, а позиция — не черновик и не добавление, ждущее или получившее
 * отказ. Исключать можно только то, что реально было согласовано.
 */
export function isApprovedPosition(campaign: PromoCampaign, line: PromoLine): boolean {
  if (campaign.cancelled || campaign.status !== APPROVED_STATUS) return false;
  if (line.removed || line.draft) return false;
  return line.pending?.action !== "addition";
}

/**
 * Позиция в составе акции для отчёта смежным отделам: без черновиков и без
 * добавлений, которые ещё не согласованы (или отклонены), — иначе они попадали
 * в новую версию отчёта как «добавлена после согласования».
 */
export function countsForReport(line: PromoLine): boolean {
  return !line.draft && line.pending?.action !== "addition";
}

/** Whether a negative decision exists (drives the КМ red indicator, Блок 6). */
export function lineHasRejection(line: PromoLine): boolean {
  return Boolean(line.rejected || line.pending?.rejected);
}

/** Compact «Черновик» chip condition (Блок 3.1). */
export function isDraftLine(campaign: PromoCampaign, line: PromoLine): boolean {
  return lineDisplayStatus(campaign, line) === "Черновик";
}

/**
 * 11-я часть (06.08, Блок 3): акция-черновик до отправки на согласование — КД и
 * старший КМ её не видят. Ветвление ТОЧНО зеркалит `lineDisplayStatus`: статусы
 * согласования/отправки решают сами по себе, и только для «прочих» статусов
 * внеплановая без первой отправки считается черновиком (иначе прятались бы
 * акции, уже находящиеся на решении у КД или согласованные).
 */
export function isCampaignDraft(campaign: PromoCampaign): boolean {
  if (campaign.cancelled) return false;
  switch (campaign.status) {
    case "Черновик":
      return true;
    case "Переотправлено на корректировку КМ":
    case "На согласовании у старшего КМ":
    case "На согласовании у коммерческого директора":
    case "Согласовано и отправлено смежным отделам":
      return false;
    default:
      return !campaign.planned && !campaign.firstSendDone;
  }
}

/** Отклонённый запрос на исключение позиции (см. `applyLineDecisions`). */
export function isRejectedExclusion(pending: LinePendingChange): boolean {
  return !!pending.rejected && !!pending.fields?.some((f) => f.field === "removed");
}

/**
 * Fold an edit patch into a `LinePendingChange` for an approved line (Блок 2/4): the
 * table keeps the approved values, the diff accumulates here. `fmt` renders values as
 * plain strings for the panel; `labelOf` supplies the field labels.
 */
export function mergePendingChange(
  line: PromoLine,
  patch: Partial<PromoLine>,
  labelOf: (field: keyof PromoLine) => string,
  fmt: (field: keyof PromoLine, value: unknown) => string,
  actor: string,
  atISO: string
): LinePendingChange {
  // Отклонённый запрос на исключение `applyLineDecisions` хранит как «изменение» с
  // полем `removed` («Предложена к удалению») — это не правка данных. Новая правка
  // КМ начинает свой запрос с нуля: иначе поле, тип запроса и причина исключения
  // переехали бы в неё, и согласование цены исключило бы позицию из акции.
  const prev = line.pending && isRejectedExclusion(line.pending) ? undefined : line.pending;
  const fields = (prev?.fields ?? []).map((f) => ({ ...f }));
  for (const key of Object.keys(patch) as (keyof PromoLine)[]) {
    const was = fmt(key, line[key]);
    const now = fmt(key, patch[key]);
    if (was === now) continue;
    const existing = fields.find((f) => f.field === key);
    if (existing) existing.now = now;
    else fields.push({ field: key, label: labelOf(key), was, now });
  }
  return {
    action: prev?.action ?? "change",
    fields,
    by: actor,
    at: atISO,
    requestType: prev?.requestType ?? "Изменение данных позиции",
    comment: prev?.comment,
  };
}
