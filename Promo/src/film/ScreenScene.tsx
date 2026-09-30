"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import {
  CURSOR_LEAD,
  cursorPath,
  highlightLook,
  planSettle,
  resolveArea,
  resolveTarget,
  type ClickCue,
  type CursorPath,
  type HighlightCue,
  type Point,
  type Rect,
  type ScrollCue,
} from "./cues";
import { nextFrames } from "./frames";
import { FILM } from "./palette";
import { easeInOutCubic, keyframes, lerp } from "./timeline";
import type { ScreenSceneDef } from "./types";

/** Вьюпорт вложенного экрана — как у e2e и скриншотов. */
export const FRAME_W = 1440;
export const FRAME_H = 900;
const READY_TIMEOUT_MS = 15_000;
/** Панель и диалог в экранах открываются через setTimeout: цель следующего сигнала — не в том же кадре. */
const TARGET_WAIT_MS = 1_000;

export interface ScreenHandle {
  /** Привести экран к локальному моменту сцены; выполняется, когда кадр готов. */
  settle(local: number): Promise<void>;
}

interface ScreenSceneProps {
  scene: ScreenSceneDef;
  /** Локальное время сцены. */
  t: number;
  stage: { w: number; h: number };
  /** Предзагрузка: окно грузится заранее, но не видно. */
  hidden: boolean;
}

/**
 * Адрес окна — от корня приложения, маршрут в film-path (режим кадра сам
 * переставит адрес): глубокая ссылка на GitHub Pages шла бы через 404.html.
 * BASE_URL — «/» локально и «/Texnomart/promo/» на GitHub Pages. Режим кадра
 * переносит всю строку запроса в адрес экрана, поэтому `query` (например,
 * `promo`) экран читает как обычно.
 */
function frameUrl(scene: ScreenSceneDef): string {
  const { path, role, user, theme, query } = scene.screen;
  const params = new URLSearchParams({ "film-frame": "1", "film-path": path, role, user, theme, ...query });
  return `${import.meta.env.BASE_URL}?${params}`;
}

/**
 * Документ окна, когда экран отрисован (есть элемент `ready`). `stale` — прежний
 * документ при перезагрузке: пока навигация не завершилась, окно отдаёт его.
 */
async function waitReady(
  frame: HTMLIFrameElement,
  scene: ScreenSceneDef,
  stale: Document | null,
): Promise<Document> {
  const started = performance.now();
  for (;;) {
    const doc = frame.contentDocument;
    if (doc && doc !== stale && doc.readyState !== "loading" && scene.screen.ready.target(doc)) {
      await doc.fonts.ready;
      return doc;
    }
    if (performance.now() - started > READY_TIMEOUT_MS) {
      throw new Error(
        `[film] сцена «${scene.key}»: экран не отрисовался за ${READY_TIMEOUT_MS / 1000} с (ждал «${scene.screen.ready.label}»)`,
      );
    }
    await new Promise((r) => setTimeout(r, 50));
  }
}

/** Окно документа; нет — документ отсоединён, и действие дало бы неверный кадр молча. */
function viewOf(doc: Document, sceneKey: string): Window & typeof globalThis {
  const win = doc.defaultView;
  if (!win) throw new Error(`[film] сцена «${sceneKey}»: документ окна отсоединён — действие некуда выполнить`);
  return win;
}

/** Ищет покадрово до TARGET_WAIT_MS; не нашлось — `fail` бросает понятную ошибку. */
async function waitFor<T>(doc: Document, sceneKey: string, find: () => T | null, fail: () => T): Promise<T> {
  const win = viewOf(doc, sceneKey);
  const deadline = performance.now() + TARGET_WAIT_MS;
  for (;;) {
    const found = find();
    if (found) return found;
    if (performance.now() > deadline) return fail();
    await nextFrames(win, 1);
  }
}

const waitTarget = (doc: Document, cue: ClickCue | ScrollCue, sceneKey: string): Promise<Element> =>
  waitFor(doc, sceneKey, () => cue.target(doc), () => resolveTarget(doc, cue, sceneKey));

const waitArea = (doc: Document, cue: HighlightCue, sceneKey: string): Promise<Rect> =>
  waitFor(doc, sceneKey, () => cue.area(doc), () => resolveArea(doc, cue, sceneKey));

/** Полная последовательность указателя: вкладки Radix срабатывают по mousedown, меню — по pointerdown. */
function pointerClick(el: Element, sceneKey: string): void {
  const win = viewOf(el.ownerDocument, sceneKey);
  const r = el.getBoundingClientRect();
  const base = {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: win,
    button: 0,
    clientX: r.left + r.width / 2,
    clientY: r.top + r.height / 2,
  };
  const pointer = { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true };
  el.dispatchEvent(new win.PointerEvent("pointerdown", { ...pointer, buttons: 1 }));
  el.dispatchEvent(new win.MouseEvent("mousedown", { ...base, buttons: 1 }));
  el.dispatchEvent(new win.PointerEvent("pointerup", { ...pointer, buttons: 0 }));
  el.dispatchEvent(new win.MouseEvent("mouseup", { ...base, buttons: 0 }));
  el.dispatchEvent(new win.MouseEvent("click", { ...base, buttons: 0 }));
}

/** Курсор фильма: одного размера при любом наезде камеры, жёлтое кольцо на клике. */
function FilmCursor({ path, zoom }: { path: CursorPath; zoom: number }) {
  const m = easeInOutCubic(path.move);
  const x = lerp(path.from.x, path.to.x, m);
  const y = lerp(path.from.y, path.to.y, m);
  const ring = 16 + 56 * path.press;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        pointerEvents: "none",
        transformOrigin: "0 0",
        transform: `translate(${x}px, ${y}px) scale(${1.3 / zoom})`,
      }}
    >
      {path.press > 0 && path.press < 1 && (
        <div
          style={{
            position: "absolute",
            left: -ring / 2,
            top: -ring / 2,
            width: ring,
            height: ring,
            borderRadius: "50%",
            border: `3px solid ${FILM.accent}`,
            opacity: 1 - path.press,
          }}
        />
      )}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        style={{
          position: "absolute",
          left: -4,
          top: -3,
          overflow: "visible",
          filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35))",
        }}
      >
        <path
          d="M4 3 L4 23 L9.5 17.5 L13.5 26 L17 24.5 L13 16 L21 16 Z"
          fill="#111111"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Сцена «экран» (спецификация §3.5): живой экран Promo во <iframe> в режиме
 * кадра, камера — transform окна, курсор и сигналы — поверх.
 */
export const ScreenScene = React.forwardRef<ScreenHandle, ScreenSceneProps>(function ScreenScene(
  { scene, t, stage, hidden },
  ref,
) {
  const { camera, cues, home } = scene.screen;
  const src = React.useMemo(() => frameUrl(scene), [scene]);
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const ready = React.useRef<Promise<Document> | null>(null);
  const applied = React.useRef(Number.NaN);
  const busy = React.useRef<Promise<void> | null>(null);
  const wanted = React.useRef<number | null>(null);
  /** Центры целей курсора по `at` клика: замер один раз, сброс — с документом окна. */
  const centers = React.useRef(new Map<number, Point>());
  const [points, setPoints] = React.useState<(Point & { at: number })[]>([]);
  /** Рамки, активные в момент последнего перехода: индекс в `highlights` и область в координатах окна. */
  const [boxes, setBoxes] = React.useState<{ i: number; rect: Rect }[]>([]);
  const highlights = React.useMemo(
    () => cues.filter((c): c is HighlightCue => c.kind === "highlight"),
    [cues],
  );
  const cursorClicks = React.useMemo(
    () =>
      cues
        .filter((c): c is ClickCue => c.kind === "click" && c.cursor === true)
        .sort((a, b) => a.at - b.at),
    [cues],
  );

  const run = React.useCallback(
    async (local: number) => {
      const frame = frameRef.current;
      if (!frame) throw new Error(`[film] сцена «${scene.key}»: окно не смонтировано`);
      ready.current ??= waitReady(frame, scene, null);
      let doc = await ready.current;
      // Окно само сменило документ (например, полная перезагрузка Vite в dev):
      // прежний отсоединён — экран проигрывается заново, как после перезагрузки.
      if (frame.contentDocument !== doc) {
        ready.current = waitReady(frame, scene, doc);
        applied.current = Number.NaN;
        centers.current.clear();
        doc = await ready.current;
      }
      const plan = planSettle(cues, applied.current, local);
      if (plan.reload) {
        // От корня с film-path, как при первой загрузке: адрес окна уже переставлен
        // на глубокую ссылку, а она на GitHub Pages шла бы через 404.html.
        ready.current = waitReady(frame, scene, doc);
        applied.current = Number.NaN;
        centers.current.clear();
        viewOf(doc, scene.key).location.replace(src);
        doc = await ready.current;
      }
      // Центр цели курсора замеряется один раз: по раскладке после кликов, сделанных
      // до начала подъезда (at − CURSOR_LEAD), — до клика `before` и до своего клика.
      const measure = async (before: number) => {
        for (const c of cursorClicks) {
          const start = c.at - CURSOR_LEAD;
          if (start > local || start >= before || centers.current.has(c.at)) continue;
          const r = (await waitTarget(doc, c, scene.key)).getBoundingClientRect();
          centers.current.set(c.at, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
        }
      };
      // Клики — по одному, с кадром между ними: React фиксирует обновление клика
      // в микрозадаче, и цель следующего (строка после вкладки, пункт после меню)
      // появляется только после отрисовки.
      for (const cue of plan.clicks) {
        await measure(cue.at);
        pointerClick(await waitTarget(doc, cue, scene.key), scene.key);
        await nextFrames(viewOf(doc, scene.key), 1);
      }
      for (const { cue, p } of plan.scrolls) {
        const el = await waitTarget(doc, cue, scene.key);
        if (cue.axis === "y") el.scrollTop = cue.to(p, el);
        else el.scrollLeft = cue.to(p, el);
      }
      await measure(Number.POSITIVE_INFINITY);
      // Рамки — после кликов и прокруток: положение области зависит от них.
      const measuredBoxes: { i: number; rect: Rect }[] = [];
      for (let i = 0; i < highlights.length; i++) {
        const h = highlights[i];
        if (local < h.at || local > h.until) continue;
        measuredBoxes.push({ i, rect: await waitArea(doc, h, scene.key) });
      }
      applied.current = local;
      // Курсор — только у кликов, чьё окно уже началось; центры — из замеров.
      const measured = cursorClicks
        .filter((c) => local >= c.at - CURSOR_LEAD)
        .map((c) => ({ at: c.at, ...centers.current.get(c.at)! }));
      flushSync(() => {
        setPoints(measured);
        setBoxes(measuredBoxes);
      });
      await doc.fonts.ready;
      await nextFrames(viewOf(doc, scene.key), 2);
    },
    [cues, cursorClicks, highlights, scene, src],
  );

  // Запросы склеиваются: пока идёт переход, новый момент ждёт, промежуточные отбрасываются.
  React.useImperativeHandle(
    ref,
    () => ({
      settle(local: number) {
        wanted.current = local;
        if (!busy.current) {
          busy.current = (async () => {
            try {
              while (wanted.current !== null) {
                const next = wanted.current;
                wanted.current = null;
                await run(next);
              }
            } finally {
              busy.current = null;
            }
          })();
        }
        return busy.current;
      },
    }),
    [run],
  );

  const pose = keyframes(t, camera);
  const tx = stage.w / 2 - pose.cx * pose.zoom;
  const ty = stage.h / 2 - pose.cy * pose.zoom;
  const cursor = cursorPath(t, points, home);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        visibility: hidden ? "hidden" : "visible",
        perspective: 2400,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: "0 0",
          transform:
            `translate(${tx}px, ${ty}px) scale(${pose.zoom}) ` +
            `translate(${pose.cx}px, ${pose.cy}px) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) ` +
            `translate(${-pose.cx}px, ${-pose.cy}px)`,
          opacity: pose.opacity,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: FILM.shadow,
          background: "#FFFFFF",
        }}
      >
        <iframe
          ref={frameRef}
          src={src}
          title={scene.key}
          width={FRAME_W}
          height={FRAME_H}
          tabIndex={-1}
          style={{ display: "block", border: 0, pointerEvents: "none" }}
        />
        {boxes.map(({ i, rect }) => {
          const cue = highlights[i];
          const look = cue ? highlightLook(t, cue) : null;
          if (!cue || !look) return null;
          const pad = cue.pad ?? 6;
          return (
            <div
              key={i}
              data-film="highlight"
              style={{
                position: "absolute",
                left: rect.x - pad,
                top: rect.y - pad,
                width: rect.w + pad * 2,
                height: rect.h + pad * 2,
                boxSizing: "border-box",
                // 3 px на холсте при любом наезде камеры.
                border: `${3 / pose.zoom}px solid ${FILM.accent}`,
                borderRadius: 10,
                opacity: look.opacity,
                transform: `scale(${look.scale})`,
                pointerEvents: "none",
              }}
            />
          );
        })}
        {cursor && <FilmCursor path={cursor} zoom={pose.zoom} />}
      </div>
    </div>
  );
});
