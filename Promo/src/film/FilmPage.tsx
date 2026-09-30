"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { Caption } from "./Caption";
import { nextFrames } from "./frames";
import { FILM } from "./palette";
import { PainTracker } from "./PainTracker";
import { SCENES } from "./scenes";
import { ScreenScene, type ScreenHandle } from "./ScreenScene";
import { painStrikes, trackerOpacity, type PainKey } from "./story";
import { buildTimeline, GRID_EPS, gridSteps, sceneAt } from "./timeline";
import { STAGE, type Aspect, type FilmScene, type Lang } from "./types";

/** Какую боль закрывает сцена и над какими сценами висит список болей — из сценария. */
const SOLVES: Record<string, PainKey> = Object.fromEntries(
  SCENES.flatMap((s) => (s.solves ? [[s.key, s.solves] as const] : [])),
);
const TRACKER_KEYS = SCENES.filter((s) => s.tracker).map((s) => s.key);

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
 * Смонтированы текущая сцена и следующая сцена-экран (скрыто — предзагрузка) —
 * кроме записи: там сцена-экран предзагрузки не получает (см. `seekTo`).
 */
export function FilmPage() {
  const params = React.useMemo(() => new URLSearchParams(window.location.search), []);
  const capture = params.get("capture") === "1";
  const lang: Lang = params.get("lang") === "uz" ? "uz" : "ru";
  // Записывающий передаёт свой --fps в адресе (record-film.mjs) — повтор пути
  // записи (см. seekTo ниже) идёт тактами 1/fps, а не всегда 1/60.
  const parsedFps = Number(params.get("fps"));
  const fps = parsedFps > 0 ? parsedFps : 60;
  // Раскладки сцен пока только под 16:9: ?aspect=9x16 — второй этап (спецификация §6).
  const aspect: Aspect = "16x9";
  const stage = STAGE[aspect];
  const timeline = React.useMemo(() => buildTimeline(SCENES), []);
  const [t, setT] = React.useState(0);
  const screens = React.useRef(new Map<string, ScreenHandle>());
  const fit = useFit(stage, capture);
  // Заход в сцену-экран в записи: какую сцену и с какого t занимает текущий
  // заход (для решения — продолжать обновлением или начать заново). Только
  // бухгалтерия для seekTo; никогда не читается и не пишется во время рендера.
  const occupancy = React.useRef<{ sceneKey: string; generation: number; lastLocal: number } | null>(null);
  // Номер захода — то же число, что occupancy.current.generation, но в состоянии:
  // ключ сцены-экрана и её оверлеев берёт его отсюда, а не из ref (правило «ключ
  // — из состояния»), поэтому смена номера всегда даёт настоящую пересборку.
  const [screenGen, setScreenGen] = React.useState(0);

  // Фильм показывает приложение светлым: класс .dark на <html> перекрасил бы
  // бейджи фрагментов. Страница грузится лениво — после эффекта ThemeProvider,
  // поэтому снятие класса здесь не перебивается.
  React.useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  React.useEffect(() => {
    if (!capture) return;
    let queue: Promise<void> = Promise.resolve();
    /**
     * Сцена-экран в записи повторяет тот же путь, что прошла бы настоящая
     * запись внутри этой сцены: такты 1/fps от её начала (или там, где
     * остановился прошлый заход) до запрошенного t — а не прыжок на t с
     * одним settle(local), как было раньше. У прыжка тот же итоговый DOM, но
     * другая история отрисовки: Chrome растрирует текст прокрученной таблицы
     * и трансформированный слой окна чуть иначе, если до этого они уже стояли
     * на другой позе/прокрутке (до правки — 23 уровня из 255 на 5 638
     * пикселях, видимо на глаз). Повтор пути убирает это конкретное
     * расхождение.
     *
     * Он НЕ делает кадр чистой функцией t целиком: раскладка ДО входа в эту
     * сцену (какие сцены шли раньше, в каком порядке шла перемотка) остаётся
     * частью истории растра страницы — измеренный остаточный шум ≤ 1–2
     * уровней на единицах-десятках пикселей, на глаз не виден. Поэтому
     * film.spec.ts сравнивает такие кадры с допуском спецификации
     * («Уточнено при реализации 30.09»: канал ≤ 2 уровня, отличающихся
     * пикселей ≤ 0,1 % кадра), а не побайтово.
     *
     * Пересборка (новый generation, заход с начала сцены) — только когда
     * сцена сменилась или перемотка ушла назад внутри той же сцены;
     * продолжение вперёд — обычные такты без пересборки, поэтому настоящая
     * покадровая запись (i/fps, i = 0, 1, 2, …) не платит за это ничего —
     * каждый её кадр делает ровно один шаг цикла ниже.
     */
    const seekTo = async (to: number) => {
      const atInfo = sceneAt(timeline, to);
      const targetScene = SCENES[atInfo.index];
      if (targetScene.kind !== "screen") {
        occupancy.current = null; // ушли со сцены-экрана — заход закрыт
        flushSync(() => setT(to));
        await document.fonts.ready;
        await nextFrames(window, 2);
        return;
      }
      const chapterAt = timeline.chapters[atInfo.index].at;
      const occ = occupancy.current;
      const needsFreshEntry = !occ || occ.sceneKey !== targetScene.key || atInfo.local < occ.lastLocal - GRID_EPS;
      const generation = needsFreshEntry ? (occ ? occ.generation + 1 : 0) : occ!.generation;
      const steps = gridSteps(needsFreshEntry ? null : occ!.lastLocal, atInfo.local, targetScene.duration, fps);
      try {
        for (let i = 0; i < steps.length; i++) {
          const screenLocal = steps[i];
          flushSync(() => {
            if (i === 0 && needsFreshEntry) setScreenGen(generation);
            setT(chapterAt + screenLocal);
          });
          const handle = screens.current.get(targetScene.key);
          if (!handle) throw new Error(`[film] сцена «${targetScene.key}» не смонтирована`);
          await handle.settle(screenLocal);
          await document.fonts.ready;
          await nextFrames(window, 2);
        }
      } catch (e) {
        // Незавершённый заход — не начало для следующей попытки (у записи есть
        // повтор при ошибке, record-film.mjs): его lastLocal не про реальную
        // историю рендера, продолжать от него нельзя.
        occupancy.current = null;
        throw e;
      }
      occupancy.current = { sceneKey: targetScene.key, generation, lastLocal: atInfo.local };
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

  // Предзагрузка следующей сцены-экрана — только вне записи (просмотр): в
  // записи вход в сцену-экран должен быть настоящим первым монтированием
  // (см. seekTo выше), а не превращением уже нагретого предзагруженного окна.
  const nextScreen = capture ? undefined : SCENES.slice(index + 1).find((s) => s.kind === "screen");
  const mounted: FilmScene[] = nextScreen ? [current, nextScreen] : [current];

  // Ключ оверлеев сцены-экрана (список болей, подпись) в записи включает номер
  // её захода (screenGen) — их пересборка идёт вместе с пересборкой сцены, см.
  // комментарий у seekTo. На фрагментах ключ не нужен — undefined оставляет
  // обычную сверку React, как и до этой правки. PainTracker и Caption ниже
  // добавляют к нему свой префикс («tracker-»/«caption-») — с одним и тем же
  // значением React иначе ругается на повтор ключа у соседних элементов.
  const screenOverlayKey =
    capture && current.kind === "screen" ? `${current.key}#${screenGen}` : undefined;

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
            const key = capture && isCurrent ? `${scene.key}#${screenGen}` : scene.key;
            return (
              <ScreenScene
                key={key}
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
          // В записи (capture) ключ включает t: фрагмент всегда монтируется заново
          // на целевой момент, а не обновляется с прежнего. Урок первого акта:
          // ротация + текст на GPU-слое у Chrome рисуются на волосок иначе, если до
          // этого слой уже существовал на другом t (кадр расходился по пути
          // перемотки, хотя пропсы совпадали байт в байт: правки CSS без изменения
          // структуры монтирования не помогали, помогает только «слоя не было»).
          // В живом просмотре t растёт непрерывно — пересборка на каждый кадр
          // была бы дороже без выигрыша, поэтому ключ там прежний.
          return (
            <SceneView
              key={capture ? `${scene.key}-${local}` : scene.key}
              t={local}
              duration={scene.duration}
              aspect={aspect}
              lang={lang}
            />
          );
        })}
        <PainTracker
          key={screenOverlayKey && `tracker-${screenOverlayKey}`}
          strikes={painStrikes(timeline.chapters, SOLVES, t)}
          opacity={trackerOpacity(timeline.chapters, TRACKER_KEYS, t)}
          lang={lang}
        />
        {current.caption && (
          <Caption
            key={screenOverlayKey && `caption-${screenOverlayKey}`}
            text={current.caption[lang]}
            t={local}
            duration={current.duration}
          />
        )}
      </div>
    </div>
  );
}
