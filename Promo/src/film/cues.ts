/**
 * Сигналы сцены-экрана (спецификация §3.5): какие действия выполнить во
 * вложенном экране при переходе к моменту t и где в этот момент курсор фильма.
 *
 * Чистый модуль без импортов — его запускает `node --test`
 * (scripts/film-cues.test.ts). Только «стираемый» TypeScript.
 */

/** Находит элемент во вложенном документе; null — элемента нет. */
export type TargetFn = (doc: Document) => Element | null;

/** Клик в момент `at` (локальное время сцены). `cursor` — показать курсор фильма. */
export interface ClickCue {
  kind: "click";
  at: number;
  label: string;
  target: TargetFn;
  cursor?: boolean;
}

/**
 * Прокрутка на участке [at, until]: `to` — позиция по прогрессу 0..1, `axis` —
 * ось (по умолчанию "x", горизонтальная; "y" — вертикальная).
 */
export interface ScrollCue {
  kind: "scroll";
  at: number;
  until: number;
  label: string;
  target: TargetFn;
  axis?: "x" | "y";
  to: (p: number, el: Element) => number;
}

/** Прямоугольник в координатах окна — как у getBoundingClientRect. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Находит область во вложенном документе; null — области нет. */
export type AreaFn = (doc: Document) => Rect | null;

/** Жёлтая рамка вокруг области на участке [at, until]; `pad` — отступ рамки, пиксели окна. */
export interface HighlightCue {
  kind: "highlight";
  at: number;
  until: number;
  label: string;
  area: AreaFn;
  pad?: number;
}

export type Cue = ClickCue | ScrollCue | HighlightCue;

export interface SettlePlan {
  /** Перемотка назад через клик: экран перезагружается и проигрывается заново. */
  reload: boolean;
  /** Клики к выполнению, по возрастанию времени. */
  clicks: ClickCue[];
  /** Все прокрутки с прогрессом, зажатым в [0, 1] (идемпотентны). */
  scrolls: { cue: ScrollCue; p: number }[];
}

/**
 * План перехода к моменту t. `applied` — момент прошлого перехода; NaN — экран
 * только что загружен. Вперёд — клики из (applied, t]. Назад — перезагрузка,
 * только если в (t, applied] был клик; тогда — все клики с at ≤ t.
 */
export function planSettle(cues: readonly Cue[], applied: number, t: number): SettlePlan {
  const fresh = Number.isNaN(applied);
  const backward = !fresh && t < applied;
  const reload =
    backward && cues.some((c) => c.kind === "click" && c.at > t && c.at <= applied);
  const from = fresh || reload ? -Infinity : backward ? Infinity : applied;
  const clicks = cues
    .filter((c): c is ClickCue => c.kind === "click" && c.at > from && c.at <= t)
    .sort((a, b) => a.at - b.at);
  const scrolls = cues
    .filter((c): c is ScrollCue => c.kind === "scroll")
    .map((cue) => {
      const span = cue.until - cue.at;
      const raw = span > 0 ? (t - cue.at) / span : t >= cue.at ? 1 : 0;
      return { cue, p: Math.min(1, Math.max(0, raw)) };
    });
  return { reload, clicks, scrolls };
}

/** Элемент сигнала. Не найден — ошибка с именем сцены и сигнала: кадр был бы неверным. */
export function resolveTarget(doc: Document, cue: ClickCue | ScrollCue, sceneKey: string): Element {
  const el = cue.target(doc);
  if (!el) {
    throw new Error(
      `[film] сцена «${sceneKey}»: не найден элемент «${cue.label}» (сигнал на ${cue.at} с)`,
    );
  }
  return el;
}

/** Область рамки. Не найдена — ошибка с именем сцены и рамки: кадр был бы неверным. */
export function resolveArea(doc: Document, cue: HighlightCue, sceneKey: string): Rect {
  const rect = cue.area(doc);
  if (!rect) {
    throw new Error(
      `[film] сцена «${sceneKey}»: не найдена область «${cue.label}» (рамка на ${cue.at} с)`,
    );
  }
  return rect;
}

/** Рамка входит за HIGHLIGHT_IN с (из масштаба 1,06) и гаснет за HIGHLIGHT_OUT с до `until`. */
export const HIGHLIGHT_IN = 0.25;
export const HIGHLIGHT_OUT = 0.2;

/** Плавность входа рамки; своя копия easeOutExpo — модуль без импортов. */
const easeOut = (x: number): number => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));

/** Вид рамки в момент t: прозрачность и масштаб. Вне [at, until] — null. */
export function highlightLook(t: number, cue: HighlightCue): { opacity: number; scale: number } | null {
  if (t < cue.at || t > cue.until) return null;
  const enter = easeOut(Math.min(1, (t - cue.at) / HIGHLIGHT_IN));
  const leave = Math.min(1, Math.max(0, (cue.until - t) / HIGHLIGHT_OUT));
  return { opacity: enter * leave, scale: 1 + 0.06 * (1 - enter) };
}

export interface Point {
  x: number;
  y: number;
}

/** Курсор подъезжает к цели за CURSOR_LEAD с до клика и держится CURSOR_TAIL с после. */
export const CURSOR_LEAD = 0.8;
export const CURSOR_TAIL = 0.6;

export interface CursorPath {
  from: Point;
  to: Point;
  /** Прогресс подъезда 0..1, без плавности — её накладывает отрисовка. */
  move: number;
  /** Прогресс кольца клика 0..1; до момента клика — 0. */
  press: number;
}

/**
 * Где курсор в момент t. `clicks` — клики с курсором по возрастанию `at`, с
 * центрами целей в координатах окна. Вне окон кликов курсор скрыт (null).
 * Подъезд — от цели предыдущего клика, у первого — от `home`.
 */
export function cursorPath(
  t: number,
  clicks: readonly (Point & { at: number })[],
  home: Point,
): CursorPath | null {
  for (let i = 0; i < clicks.length; i++) {
    const c = clicks[i];
    const start = c.at - CURSOR_LEAD;
    if (t < start || t > c.at + CURSOR_TAIL) continue;
    const prev = i > 0 ? clicks[i - 1] : home;
    const move = Math.min(1, Math.max(0, (t - start) / (CURSOR_LEAD * 0.75)));
    const press = t < c.at ? 0 : Math.min(1, (t - c.at) / CURSOR_TAIL);
    return { from: { x: prev.x, y: prev.y }, to: { x: c.x, y: c.y }, move, press };
  }
  return null;
}
