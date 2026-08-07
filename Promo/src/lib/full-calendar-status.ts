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
 * rejected-repeat → pending-repeat → cancelled campaign → campaign.status/line.rejected.
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
  // A primary-flow rejected line on a still-under-review campaign.
  if (line.rejected) return "Переотправлено на корректировку КМ";
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
  const prev = line.pending;
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
