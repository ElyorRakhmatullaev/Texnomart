import type { ComponentType } from "react";

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

export type FilmScene = FragmentScene;

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
