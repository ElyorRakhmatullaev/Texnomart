import type { CategoryDistributionEntry, PromoCampaign } from "./promo-mock-data";

/**
 * Волна 6 — «Распределение промо по КМ, дням недели и категориям» (строки 73–74
 * трекера). Блок «Распределение по категориям» в кратком календаре существовал
 * с правок 19.06, но данные для него были только в сидах. Здесь живёт то, что
 * ввёл коммерческий директор.
 *
 * Приём тот же, что у `line-decision-store` (Волна 3): общий факт → persist +
 * чистая свёртка `applyDistribution` на входе каждого потребителя. Никакого
 * провайдера и подъёма состояния — потребителей всего два (краткий календарь и
 * его экспорт), и оба сеются из одного места.
 */

const STORAGE_KEY = "promo:category-distribution";

/** Сериализуемый вид записи: Date → «YYYY-MM-DD». */
interface StoredEntry {
  date: string;
  category: string;
  responsibleKmId: string;
}

type StoredMap = Record<string, StoredEntry[]>;

function read(): StoredMap {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as StoredMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(map: StoredMap): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** «YYYY-MM-DD» → локальная полночь (без UTC-сдвига на день). */
export function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Date → «YYYY-MM-DD» по локальному календарю. */
export function toDateOnly(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Введённое распределение акции. `undefined` — записи нет (действует сид). */
export function getDistributionFor(
  campaignId: string
): CategoryDistributionEntry[] | undefined {
  const stored = read()[campaignId];
  if (!stored) return undefined;
  return stored.map((e) => ({
    date: parseDateOnly(e.date),
    category: e.category,
    responsibleKmId: e.responsibleKmId,
  }));
}

/**
 * Записать распределение акции. Пустой массив — валидное значение: «распределения
 * нет», что НЕ то же самое, что отсутствие записи (возврат к сиду) — см. `clearDistributionFor`.
 */
export function setDistributionFor(
  campaignId: string,
  entries: CategoryDistributionEntry[]
): void {
  const map = read();
  map[campaignId] = entries.map((e) => ({
    date: toDateOnly(e.date),
    category: e.category.trim(),
    responsibleKmId: e.responsibleKmId,
  }));
  write(map);
}

/** Удалить запись — акция возвращается к сиду. */
export function clearDistributionFor(campaignId: string): void {
  const map = read();
  delete map[campaignId];
  write(map);
}

export function hasStoredDistribution(campaignId: string): boolean {
  return campaignId in read();
}

/**
 * Слияние введённого распределения с сидом. Сохранённое перекрывает сид
 * ЦЕЛИКОМ: запись по акции — полный список позиций, а не патч, поэтому
 * «убрал строку в форме» означает «строки больше нет», а не «вернулась сидовая».
 */
export function applyDistribution(campaigns: PromoCampaign[]): PromoCampaign[] {
  const map = read();
  if (Object.keys(map).length === 0) return campaigns;
  return campaigns.map((c) => {
    const stored = map[c.id];
    if (!stored) return c;
    return {
      ...c,
      categoryDistribution: stored.map((e) => ({
        date: parseDateOnly(e.date),
        category: e.category,
        responsibleKmId: e.responsibleKmId,
      })),
    };
  });
}
