import type { ComponentType } from "react";
import type { PromoRole } from "../app/role-context";
import type { Cue, Point, TargetFn } from "./cues";
import type { Key } from "./timeline";

export type Lang = "ru" | "uz";
export type Aspect = "16x9" | "9x16";

/** Холст в CSS-пикселях. 9:16 — второй этап (спецификация §6). */
export const STAGE: Record<Aspect, { w: number; h: number }> = {
  "16x9": { w: 1920, h: 1080 },
  "9x16": { w: 1080, h: 1920 },
};

/** Что получает любая сцена: локальное время, её длительность, формат, язык. */
export interface SceneProps {
  t: number;
  duration: number;
  aspect: Aspect;
  lang: Lang;
}

interface SceneBase {
  key: string;
  duration: number;
  /** Подпись внизу слева; нет — сцена без подписи. */
  caption?: Record<Lang, string>;
}

export interface FragmentScene extends SceneBase {
  kind: "fragment";
  Component: ComponentType<SceneProps>;
}

/**
 * Поза камеры: какая точка окна (cx, cy — пиксели экрана 1440×900) стоит в
 * центре холста, масштаб, наклон в градусах, прозрачность.
 */
export type CameraPose = {
  cx: number;
  cy: number;
  zoom: number;
  rx: number;
  ry: number;
  opacity: number;
};

export interface ScreenSpec {
  /** Маршрут приложения без базового пути и без «/», например "short-calendar". */
  path: string;
  role: PromoRole;
  /** id пользователя из users-store: u-1 — КД, u-2 — Администратор. */
  user: string;
  theme: "light" | "dark";
  /** По какому элементу понять, что экран отрисован. */
  ready: { label: string; target: TargetFn };
  camera: Key<CameraPose>[];
  cues: Cue[];
  /** Откуда курсор выезжает к первому клику (координаты окна). */
  home: Point;
}

export interface ScreenSceneDef extends SceneBase {
  kind: "screen";
  screen: ScreenSpec;
}

export type FilmScene = FragmentScene | ScreenSceneDef;

/** Контракт записи — тот же, что в образце record-tour.mjs. */
export interface CaptureApi {
  duration: number;
  chapters: { key: string; at: number; end: number }[];
  seek(t: number): Promise<void>;
}

declare global {
  interface Window {
    __capture?: CaptureApi;
  }
}
