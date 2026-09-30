"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import {
  CURSOR_LEAD,
  cursorPath,
  planSettle,
  resolveTarget,
  type ClickCue,
  type CursorPath,
  type Point,
} from "./cues";
import { nextFrames } from "./frames";
import { FILM } from "./palette";
import { easeInOutCubic, keyframes, lerp } from "./timeline";
import type { ScreenSceneDef } from "./types";

/** Вьюпорт вложенного экрана — как у e2e и скриншотов. */
export const FRAME_W = 1440;
export const FRAME_H = 900;
const READY_TIMEOUT_MS = 15_000;

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
 * BASE_URL — «/» локально и «/Texnomart/promo/» на GitHub Pages.
 */
function frameUrl(scene: ScreenSceneDef): string {
  const { path, role, user, theme } = scene.screen;
  const query = new URLSearchParams({ "film-frame": "1", "film-path": path, role, user, theme });
  return `${import.meta.env.BASE_URL}?${query}`;
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

/** Полная последовательность указателя: вкладки Radix срабатывают по mousedown, меню — по pointerdown. */
function pointerClick(el: Element): void {
  const win = el.ownerDocument.defaultView;
  if (!win) return;
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
  const [points, setPoints] = React.useState<(Point & { at: number })[]>([]);
  const cursorClicks = React.useMemo(
    () => cues.filter((c): c is ClickCue => c.kind === "click" && c.cursor === true),
    [cues],
  );

  const run = React.useCallback(
    async (local: number) => {
      const frame = frameRef.current;
      if (!frame) throw new Error(`[film] сцена «${scene.key}»: окно не смонтировано`);
      ready.current ??= waitReady(frame, scene, null);
      let doc = await ready.current;
      const plan = planSettle(cues, applied.current, local);
      if (plan.reload) {
        ready.current = waitReady(frame, scene, doc);
        applied.current = Number.NaN;
        frame.contentWindow?.location.reload();
        doc = await ready.current;
      }
      for (const cue of plan.clicks) pointerClick(resolveTarget(doc, cue, scene.key));
      for (const { cue, p } of plan.scrolls) {
        const el = resolveTarget(doc, cue, scene.key);
        el.scrollLeft = cue.left(p, el);
      }
      applied.current = local;
      // Центры целей курсора — только у кликов, чьё окно курсора уже началось.
      const measured = cursorClicks
        .filter((c) => local >= c.at - CURSOR_LEAD)
        .map((c) => {
          const r = resolveTarget(doc, c, scene.key).getBoundingClientRect();
          return { at: c.at, x: r.left + r.width / 2, y: r.top + r.height / 2 };
        });
      flushSync(() => setPoints(measured));
      await doc.fonts.ready;
      const win = doc.defaultView;
      if (win) await nextFrames(win, 2);
    },
    [cues, cursorClicks, scene],
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
        {cursor && <FilmCursor path={cursor} zoom={pose.zoom} />}
      </div>
    </div>
  );
});
