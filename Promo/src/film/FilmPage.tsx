"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { Caption } from "./Caption";
import { nextFrames } from "./frames";
import { FILM } from "./palette";
import { SCENES } from "./scenes";
import { ScreenScene, type ScreenHandle } from "./ScreenScene";
import { buildTimeline, sceneAt } from "./timeline";
import { STAGE, type Aspect, type FilmScene, type Lang } from "./types";

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
 * Смонтированы текущая сцена и следующая сцена-экран (скрыто — предзагрузка).
 */
export function FilmPage() {
  const params = React.useMemo(() => new URLSearchParams(window.location.search), []);
  const capture = params.get("capture") === "1";
  const lang: Lang = params.get("lang") === "uz" ? "uz" : "ru";
  // Раскладки сцен пока только под 16:9: ?aspect=9x16 — второй этап (спецификация §6).
  const aspect: Aspect = "16x9";
  const stage = STAGE[aspect];
  const timeline = React.useMemo(() => buildTimeline(SCENES), []);
  const [t, setT] = React.useState(0);
  const screens = React.useRef(new Map<string, ScreenHandle>());
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
      const at = sceneAt(timeline, to);
      const scene = SCENES[at.index];
      if (scene.kind === "screen") {
        const handle = screens.current.get(scene.key);
        if (!handle) throw new Error(`[film] сцена «${scene.key}» не смонтирована`);
        await handle.settle(at.local);
      }
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
    let stopped = false;
    // Часы стартуют, когда предзагруженные экраны отрисованы: окно грузит
    // приложение в том же потоке, что и фильм, и иначе съело бы начало хука.
    const preload = [...screens.current.values()].map((s) => s.settle(0));
    void Promise.allSettled(preload).then(() => {
      if (stopped) return;
      const start = performance.now();
      const tick = (now: number) => {
        setT(((now - start) / 1000) % timeline.duration);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [capture, timeline]);

  const { index, local } = sceneAt(timeline, t);
  const current = SCENES[index];

  // В просмотре сигналы экрана выполняются по ходу, без ожидания.
  React.useEffect(() => {
    if (capture || current.kind !== "screen") return;
    screens.current
      .get(current.key)
      ?.settle(local)
      .catch((e) => console.error(e));
  }, [capture, current, local]);

  const nextScreen = SCENES.slice(index + 1).find((s) => s.kind === "screen");
  const mounted: FilmScene[] = nextScreen ? [current, nextScreen] : [current];

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
        {mounted.map((scene) => {
          const isCurrent = scene === current;
          if (scene.kind === "screen") {
            return (
              <ScreenScene
                key={scene.key}
                ref={(h) => {
                  if (h) screens.current.set(scene.key, h);
                  else screens.current.delete(scene.key);
                }}
                scene={scene}
                t={isCurrent ? local : 0}
                stage={stage}
                hidden={!isCurrent}
              />
            );
          }
          const SceneView = scene.Component;
          return (
            <SceneView key={scene.key} t={local} duration={scene.duration} aspect={aspect} lang={lang} />
          );
        })}
        {current.caption && <Caption text={current.caption[lang]} t={local} duration={current.duration} />}
      </div>
    </div>
  );
}
