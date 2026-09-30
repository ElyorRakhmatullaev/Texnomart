import {
  CAMPAIGNS,
  CATEGORY_MANAGERS,
  NOMENCLATURE,
  PROMO_LINES,
  formatPromoNo,
  getReportChangeSet,
} from "../lib/promo-mock-data";

/**
 * Акция-герой второго акта (спецификация v2 §1): 26-3 «1+1 на мелкую бытовую
 * технику», позиция L-0015 — кофемашина De'Longhi у менеджера km-4. Цена
 * «было → стало» — из набора изменений отчёта 26-3; тот же случай показывает
 * рекламный макет первого акта. Фильм ничего не выдумывает: изменится посев —
 * ошибка на старте, а не неверный кадр.
 */
function pickHero() {
  const campaign = CAMPAIGNS.find((c) => c.id === "PR-2026-003");
  const line = PROMO_LINES.find((l) => l.id === "L-0015");
  const item = line && NOMENCLATURE.find((n) => n.id === line.nomenclatureId);
  const km = line && CATEGORY_MANAGERS.find((k) => k.id === line.kmId);
  const price = getReportChangeSet("PR-2026-003").changedCells.find(
    (c) => c.lineId === "L-0015" && c.fieldId === "newPrice",
  );
  if (!campaign || !line || !item || !km || !price) {
    throw new Error(
      "[film] герой: в посеве нет акции PR-2026-003, строки L-0015, её менеджера или изменения её цены в отчёте",
    );
  }
  return {
    campaignId: campaign.id,
    promoNo: formatPromoNo(campaign.id),
    kmId: line.kmId,
    kmName: km.name,
    productName: item.name,
    priceWas: price.prevValue,
    priceNow: price.newValue,
  };
}

export const HERO = pickHero();
