import { formatDateFull } from "@texnomart/shared/utils/formatters";
import type { CategoryDistributionEntry, PromoCampaign } from "./promo-mock-data";

/**
 * Волна 6 — «Распределение промо по КМ, дням недели и категориям» (строки 73–74
 * трекера). Блок «Распределение по категориям» в кратком календаре существовал
 * с правок 19.06, но данные для него были только в сидах. Здесь живёт то, что
 * ввели директор маркетинга или коммерческий директор.
 *
 * Приём тот же, что у `line-decision-store` (Волна 3): общий факт → persist +
 * чистая свёртка `applyDistribution` на входе каждого потребителя. Никакого
 * провайдера и подъёма состояния — потребители (краткий календарь, его экспорт
 * и блок распределения на вкладке «План акций») сеются из одного места.
 */

const STORAGE_KEY = "promo:category-distribution";

/**
 * Согласованный список категорий (трекер, стр. 74 п.5 от 18.08.2026 — перечислен
 * клиентом дословно, «все остальные категории из текущего списка удалить»).
 *
 * Завести новую категорию вручную могут директор маркетинга и коммерческий
 * директор (проверка прода 14–15.09, №27 п.1: прежнее «только ДМ» аналитик
 * назвала своей ошибкой) — за это отвечает проп `canCreateCategory` в
 * `CategoryDistributionDialog`. Категория, назначенная раньше и отсутствующая
 * в списке, из строки не пропадает: диалог добавляет её к вариантам выбора.
 */
export const PROMO_CATEGORIES: string[] = [
  "Климатическая техника и техника для ухода за домом",
  "Крупно-бытовая техника для кухни",
  "Мелко-бытовая техника для дома, уход за одеждой, красота и здоровье",
  "Мелко-бытовая техника для кухни",
  "Аудио и видео техника, геймерские товары",
  "Техника для офиса, умный дом, компьютеры и периферия",
  "Персональная электроника",
  "Автотовары, спорт товары и товары для дома и сада",
  "Посуда для дома",
];

/**
 * Прежние посевные названия → согласованные (24.09.2026). Распределение,
 * сохранённое в браузере до перевода сидов, начиналось с этих названий, а
 * сохранённое перекрывает сид целиком — без перевода при чтении старые
 * категории остались бы у тех, кто уже сохранял форму. Ключ хранилища не
 * меняем: иначе пропали бы и распределения, введённые пользователем.
 */
// Map, а не объект: категорию вводят вручную, и «constructor» / «toString»
// нашли бы в объекте унаследованную функцию вместо строки.
const LEGACY_CATEGORY_NAMES = new Map<string, string>([
  ["Телевизоры и аудио", "Аудио и видео техника, геймерские товары"],
  ["Холодильники и крупная БТ", "Крупно-бытовая техника для кухни"],
  ["Смартфоны и гаджеты", "Персональная электроника"],
  ["Мелкая бытовая техника", "Мелко-бытовая техника для кухни"],
  ["Ноутбуки и ПК", "Техника для офиса, умный дом, компьютеры и периферия"],
  ["Климатическая техника", "Климатическая техника и техника для ухода за домом"],
]);

function currentCategoryName(category: string): string {
  return LEGACY_CATEGORY_NAMES.get(category.trim()) ?? category;
}

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
    if (!parsed || typeof parsed !== "object") return {};
    const map: StoredMap = {};
    for (const [id, entries] of Object.entries(parsed)) {
      map[id] = Array.isArray(entries)
        ? entries.map((e) =>
            typeof e?.category === "string"
              ? { ...e, category: currentCategoryName(e.category) }
              : e
          )
        : entries;
    }
    return map;
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

/** Строка распределения для показа: одна дата или период подряд идущих дат. */
export interface DistributionSpan {
  from: Date;
  to: Date;
  /** Календарных дней в строке (`to − from + 1`). */
  days: number;
  category: string;
  responsibleKmId: string;
}

function nextDateOnly(iso: string): string {
  const d = parseDateOnly(iso);
  return toDateOnly(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
}

/**
 * Компактный вид распределения (замечание №5 от 17.08): подряд идущие даты с
 * одной категорией и одним ответственным КМ сливаются в период, смена
 * категории или КМ начинает новую строку. Хранилище не меняется — это только
 * представление; порядок — по дате начала, затем по категории.
 */
export function compactDistribution(
  entries: CategoryDistributionEntry[]
): DistributionSpan[] {
  const byPair = new Map<string, { category: string; kmId: string; dates: Set<string> }>();
  for (const e of entries) {
    const key = `${e.category.trim().toLowerCase()}|${e.responsibleKmId}`;
    const pair = byPair.get(key) ?? {
      category: e.category.trim(),
      kmId: e.responsibleKmId,
      dates: new Set<string>(),
    };
    pair.dates.add(toDateOnly(e.date));
    byPair.set(key, pair);
  }

  const spans: DistributionSpan[] = [];
  for (const { category, kmId, dates } of byPair.values()) {
    const sorted = [...dates].sort();
    let start = sorted[0];
    let prev = sorted[0];
    const close = () => {
      const from = parseDateOnly(start);
      const to = parseDateOnly(prev);
      const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
      spans.push({ from, to, days, category, responsibleKmId: kmId });
    };
    for (const iso of sorted.slice(1)) {
      if (iso === nextDateOnly(prev)) {
        prev = iso;
        continue;
      }
      close();
      start = iso;
      prev = iso;
    }
    close();
  }
  return spans.sort(
    (a, b) =>
      a.from.getTime() - b.from.getTime() ||
      a.to.getTime() - b.to.getTime() ||
      a.category.localeCompare(b.category, "ru")
  );
}

/** Короткий день недели с заглавной: «Пн». Общий для подписей дат и периодов. */
export function weekdayShort(date: Date): string {
  const w = new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(date);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

/** «01.11.2026» для одной даты, «01.11.2026–05.11.2026» для периода. */
export function formatSpanDates(span: Pick<DistributionSpan, "from" | "to" | "days">): string {
  return span.days > 1
    ? `${formatDateFull(span.from)}–${formatDateFull(span.to)}`
    : formatDateFull(span.from);
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
