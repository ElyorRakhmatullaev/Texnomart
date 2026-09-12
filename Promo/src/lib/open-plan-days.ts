"use client";

/**
 * Свободные дни плановой акции (трекер, п. 7 — «У КМ не отображаются доступные
 * плановые промо»).
 *
 * Требование говорит о трёх вещах, которые должны доходить до КМ при выборе
 * планового промо:
 *
 *  1. промо, где КМ участвует в распределении;
 *  2. согласованные промо БЕЗ распределения — доступны всем КМ;
 *  3. дни периода без заданного распределения — тоже доступны всем.
 *
 * Пункт (1) закрыт самим списком плановых акций. (2) и (3) до этого нигде не
 * показывались: КМ видел тип и период, но не то, разобран ли период кем-то
 * ещё. Здесь они считаются из распределения самой акции —
 * `campaign.categoryDistribution` плюс то, что ввёл КД
 * (`distribution-store`), никаких новых источников данных.
 */

import { getDistributionFor, toDateOnly } from "./distribution-store";
import type { PromoCampaign } from "./promo-mock-data";

const DAY_MS = 86_400_000;

export interface OpenDaysInfo {
  /** Распределения нет вовсе: весь период открыт любому КМ. */
  noDistribution: boolean;
  /** Дни периода, на которые не назначена ни одна категория. */
  openDates: Date[];
}

/**
 * Все календарные дни периода включительно. Счётчик ограничен: испорченный
 * период (конец сильно позже начала) не должен раскручивать цикл — список
 * нужен лишь для подписи в выпадающем списке.
 */
function datesInPeriod(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  const from = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  for (
    let t = from.getTime();
    t <= end.getTime() && out.length < 400;
    t += DAY_MS
  ) {
    out.push(new Date(t));
  }
  return out;
}

/**
 * Что из периода акции ещё не разобрано.
 *
 * Читаем и введённое КД распределение, и сидовое: `getDistributionFor`
 * отдаёт первое, `campaign.categoryDistribution` — второе. Брать только
 * сохранённое нельзя: у акций, распределение которых пришло из сидов, весь
 * период ошибочно выглядел бы свободным.
 */
export function openDaysFor(campaign: PromoCampaign): OpenDaysInfo {
  const stored = getDistributionFor(campaign.id);
  const entries = stored ?? campaign.categoryDistribution ?? [];
  if (entries.length === 0) {
    return { noDistribution: true, openDates: [] };
  }
  const covered = new Set(entries.map((e) => toDateOnly(e.date)));
  const openDates = datesInPeriod(campaign.startDate, campaign.endDate).filter(
    (d) => !covered.has(toDateOnly(d))
  );
  return { noDistribution: false, openDates };
}

/** «весь период» / «12.02.2027, 13.02.2027 (+3)» — подпись свободных дней. */
export function describeOpenDates(info: OpenDaysInfo): string {
  if (info.noDistribution) return "весь период";
  if (info.openDates.length === 0) return "нет — период разобран полностью";
  const shown = info.openDates
    .slice(0, 3)
    .map((d) => d.toLocaleDateString("ru-RU"))
    .join(", ");
  const rest = info.openDates.length - 3;
  return rest > 0 ? `${shown} (+${rest})` : shown;
}
