"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { Caption } from "./Caption";
import { nextFrames } from "./frames";
import { FILM } from "./palette";
import { SCENES } from "./scenes";
import { buildTimeline, sceneAt } from "./timeline";
import { STAGE, type Aspect, type Lang } from "./types";

/** Холст вписывается в окно (просмотр) или совпадает с ним (запись). */
function useFit(stage: { w: number; h: number }, capture: boolean) {
  const calc = React.useCallback(() => {
    if (capture) return { scale: 1, left: 0, top: 0 };
    const scale = Math.min(window.innerWidth / stage.w, window.innerHeight / stage.h);
    return {
      scale,
      left: (window.innerWidth - stage.w * scale) / 2,
      top: (window.innerHeight - stage.h * scale) / 2,
    };
  }, [stage, capture]);
  const [fit, setFit] = React.useState(calc);
  React.useEffect(() => {
    const onResize = () => setFit(calc());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [calc]);
  return fit;
}

/**
 * Страница-фильм /embed/film (спецификация §3.4). Кадр — чистая функция от t.
 * ?capture=1 — запись: отдаёт window.__capture; иначе фильм играет в цикле.
 */
export function FilmPage() {
  const params = React.useMemo(() => new URLSearchParams(window.location.search), []);
  const capture = params.get("capture") === "1";
  const lang: Lang = params.get("lang") === "uz" ? "uz" : "ru";
  const aspect: Aspect = params.get("aspect") === "9x16" ? "9x16" : "16x9";
  const stage = STAGE[aspect];
  const timeline = React.useMemo(() => buildTimeline(SCENES), []);
  const [t, setT] = React.useState(0);
  const fit = useFit(stage, capture);

  // Фильм показывает приложение светлым: класс .dark на <html> перекрасил бы
  // бейджи фрагментов. Страница грузится лениво — после эффекта ThemeProvider,
  // поэтому снятие класса здесь не перебивается.
  React.useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  React.useEffect(() => {
    if (!capture) return;
    let queue: Promise<void> = Promise.resolve();
    const seekTo = async (to: number) => {
      flushSync(() => setT(to));
      await document.fonts.ready;
      await nextFrames(window, 2);
    };
    window.__capture = {
      duration: timeline.duration,
      chapters: timeline.chapters,
      seek(to: number) {
        const run = queue.catch(() => undefined).then(() => seekTo(to));
        queue = run;
        return run;
      },
    };
    return () => {
      delete window.__capture;
    };
  }, [capture, timeline]);

  React.useEffect(() => {
    if (capture) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT(((now - start) / 1000) % timeline.duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [capture, timeline]);

  const { index, local } = sceneAt(timeline, t);
  const current = SCENES[index];
  const SceneView = current.Component;

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: FILM.stage }}>
      <div
        style={{
          position: "absolute",
          left: fit.left,
          top: fit.top,
          width: stage.w,
          height: stage.h,
          overflow: "hidden",
          transformOrigin: "0 0",
          transform: `scale(${fit.scale})`,
          background: FILM.stage,
        }}
      >
        <SceneView key={current.key} t={local} duration={current.duration} aspect={aspect} lang={lang} />
        {current.caption && <Caption text={current.caption[lang]} t={local} duration={current.duration} />}
      </div>
    </div>
  );
}
