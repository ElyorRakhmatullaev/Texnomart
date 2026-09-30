/**
 * Модель времени фильма (спецификация §3.3): сцены с длительностями → главы,
 * поиск сцены по моменту, плавности и ключевые кадры.
 *
 * Чистый модуль без импортов: его запускает `node --test`
 * (scripts/film-timeline.test.ts), поэтому только «стираемый» TypeScript —
 * без enum, namespace и параметров-свойств.
 */

/** Темп монтажа: 120 ударов в минуту. */
export const BPM = 120;
/** n ударов в секундах (удар = 0,5 с). */
export const beat = (n: number): number => (n * 60) / BPM;
/** n тактов 4/4 в секундах (такт = 2 с). */
export const bar = (n: number): number => beat(n * 4);

export interface TimedScene {
  key: string;
  duration: number;
}

export interface Chapter {
  key: string;
  at: number;
  end: number;
}

export interface Timeline {
  duration: number;
  chapters: Chapter[];
}

export function buildTimeline(scenes: readonly TimedScene[]): Timeline {
  if (scenes.length === 0) throw new Error("[film] пустой сценарий");
  const seen = new Set<string>();
  const chapters: Chapter[] = [];
  let at = 0;
  for (const s of scenes) {
    if (!(s.duration > 0)) {
      throw new Error(`[film] сцена «${s.key}»: длительность должна быть больше нуля`);
    }
    if (seen.has(s.key)) throw new Error(`[film] повтор ключа сцены «${s.key}»`);
    seen.add(s.key);
    chapters.push({ key: s.key, at, end: at + s.duration });
    at += s.duration;
  }
  return { duration: at, chapters };
}

export interface SceneAt {
  index: number;
  /** Время внутри сцены — от 0 до её длительности. */
  local: number;
}

/**
 * Сцена момента t. Граница принадлежит следующей сцене (t = end → её 0).
 * t ≤ 0 или NaN — начало первой сцены; t ≥ duration — последний кадр последней.
 */
export function sceneAt(tl: Timeline, t: number): SceneAt {
  const { chapters } = tl;
  if (!(t > 0)) return { index: 0, local: 0 };
  for (let i = 0; i < chapters.length; i++) {
    if (t < chapters[i].end) return { index: i, local: t - chapters[i].at };
  }
  const last = chapters.length - 1;
  return { index: last, local: chapters[last].end - chapters[last].at };
}

export type Ease = (x: number) => number;

export const linear: Ease = (x) => x;
export const easeOutExpo: Ease = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const easeInOutCubic: Ease = (x) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const easeOutBack: Ease = (x) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;

/** Прогресс участка [from, to] в момент t: 0 до начала, 1 после конца, между — по плавности. */
export function progress(t: number, from: number, to: number, ease: Ease = linear): number {
  if (to <= from) return t >= to ? 1 : 0;
  return ease(clamp01((t - from) / (to - from)));
}

/** Набор чисел, который интерполируется целиком (поза камеры, позиция). */
export type Pose = Record<string, number>;

export interface Key<P extends Pose> {
  at: number;
  value: P;
  /** Плавность участка, который ВЕДЁТ в этот ключ (от предыдущего). */
  ease?: Ease;
}

/**
 * Значение по ключевым кадрам: до первого ключа — первое, после последнего —
 * последнее, между — интерполяция каждого поля. Ключи — по возрастанию `at`.
 */
export function keyframes<P extends Pose>(t: number, keys: readonly Key<P>[]): P {
  if (keys.length === 0) throw new Error("[film] keyframes: нет ключей");
  for (let i = 1; i < keys.length; i++) {
    if (keys[i].at < keys[i - 1].at) throw new Error("[film] keyframes: ключи не по порядку");
  }
  if (t <= keys[0].at) return { ...keys[0].value };
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i];
    if (t < b.at) {
      const a = keys[i - 1];
      const p = progress(t, a.at, b.at, b.ease ?? linear);
      const out: Pose = {};
      for (const k of Object.keys(a.value)) out[k] = lerp(a.value[k], b.value[k], p);
      return out as P;
    }
  }
  return { ...keys[keys.length - 1].value };
}
