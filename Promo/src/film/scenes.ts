import { HookFragment } from "./fragments/HookFragment";
import { LogoFragment } from "./fragments/LogoFragment";
import { bar } from "./timeline";
import type { FilmScene } from "./types";

/**
 * Сценарий фильма (спецификация §4). Ключи сцен — ключи глав для `--chapter`.
 * Длительности — в тактах: 120 BPM, такт = 2 с.
 */
export const SCENES: FilmScene[] = [
  { kind: "fragment", key: "hook", duration: bar(1.5), Component: HookFragment },
  { kind: "fragment", key: "logo", duration: bar(1), Component: LogoFragment },
];
