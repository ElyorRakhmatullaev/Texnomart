/**
 * Сюжет второй версии фильма (спецификация v2 §4.1): четыре боли бизнеса и их
 * фразы — единственный источник текста для первого акта, списка болей поверх
 * второго акта и итога. Здесь же — чистые функции списка болей.
 *
 * Модуль запускает `node --test` (scripts/film-story.test.ts): только «стираемый»
 * TypeScript, из импортов — только `import type` (Node его вырезает).
 */
import type { Lang } from "./types";

export type PainKey = "files" | "chat" | "deadlines" | "depts";

export interface Pain {
  key: PainKey;
  /** Заголовок сцены первого акта. */
  headline: Record<Lang, string>;
  /** Строка списка болей поверх второго акта и в итоге. */
  short: Record<Lang, string>;
  /** Гарантия продукта в итоге — и подпись сцены второго акта, которая её показывает. */
  fix: Record<Lang, string>;
}

/**
 * Порядок — порядок сюжета. В титрах нет внутренних сокращений (КД, КМ):
 * зритель без контекста Texnomart их не знает. Узбекский — черновой перевод,
 * нужна проверка носителем.
 */
export const PAINS: readonly Pain[] = [
  {
    key: "files",
    headline: { ru: "План акций — в десяти файлах.", uz: "Aksiyalar rejasi — o'nta faylda." },
    short: { ru: "План в десяти файлах", uz: "Reja o'nta faylda" },
    fix: { ru: "Один план. Одна версия.", uz: "Bitta reja. Bitta versiya." },
  },
  {
    key: "chat",
    headline: { ru: "Кто согласовал? Никто не знает.", uz: "Kim tasdiqladi? Hech kim bilmaydi." },
    short: { ru: "Кто согласовал — неизвестно", uz: "Kim tasdiqlagani noma'lum" },
    fix: { ru: "Каждая правка — с решением директора", uz: "Har bir o'zgarish — direktor qarori bilan" },
  },
  {
    key: "deadlines",
    headline: { ru: "Сроки горят. Спросить не с кого.", uz: "Muddatlar yonmoqda. So'raydigan odam yo'q." },
    short: { ru: "Сроки горят", uz: "Muddatlar yonmoqda" },
    fix: { ru: "У каждого срока — ответственный", uz: "Har bir muddatning mas'uli bor" },
  },
  {
    key: "depts",
    headline: { ru: "Маркетинг узнаёт последним.", uz: "Marketing oxirgi bo'lib biladi." },
    short: { ru: "Маркетинг узнаёт последним", uz: "Marketing oxirgi bo'lib biladi" },
    fix: { ru: "Маркетинг видит изменения сразу", uz: "Marketing o'zgarishlarni darhol ko'radi" },
  },
];

export function painOf(key: PainKey): Pain {
  const pain = PAINS.find((p) => p.key === key);
  if (!pain) throw new Error(`[film] нет боли «${key}»`);
  return pain;
}

/** Заголовок кульминации первого акта (сцена-куча). */
export const PILE_HEADLINE: Record<Lang, string> = {
  ru: "И так — каждую акцию.",
  uz: "Va shunday — har bir aksiyada.",
};

export interface ChapterSpan {
  key: string;
  at: number;
  end: number;
}

/** Боль перечёркивается за STRIKE_LEAD с до конца своей сцены — после её главного действия. */
export const STRIKE_LEAD = 1.2;
export const STRIKE_DURATION = 0.4;

/** Прогресс перечёркивания каждой боли 0..1 в момент t. `solves` — ключ сцены → боль, которую она закрывает. */
export function painStrikes(
  chapters: readonly ChapterSpan[],
  solves: Readonly<Record<string, PainKey>>,
  t: number,
): Record<PainKey, number> {
  const out: Record<PainKey, number> = { files: 0, chat: 0, deadlines: 0, depts: 0 };
  for (const c of chapters) {
    const pain = solves[c.key];
    if (!pain) continue;
    const p = (t - (c.end - STRIKE_LEAD)) / STRIKE_DURATION;
    out[pain] = Math.max(out[pain], p <= 1e-9 ? 0 : p > 1 - 1e-9 ? 1 : p);
  }
  return out;
}

/** Список болей въезжает за TRACKER_IN с и гаснет за TRACKER_OUT с. */
export const TRACKER_IN = 0.4;
export const TRACKER_OUT = 0.3;

/**
 * Прозрачность списка болей: от начала первой сцены из `trackerKeys` до конца
 * последней (сцены второго акта идут подряд); вне этого участка — 0.
 */
export function trackerOpacity(
  chapters: readonly ChapterSpan[],
  trackerKeys: readonly string[],
  t: number,
): number {
  const spans = chapters.filter((c) => trackerKeys.includes(c.key));
  if (spans.length === 0) return 0;
  const from = spans[0].at;
  const to = spans[spans.length - 1].end;
  if (t <= from || t >= to) return 0;
  return Math.min(1, (t - from) / TRACKER_IN, (to - t) / TRACKER_OUT);
}
