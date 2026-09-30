import { HookFragment } from "./fragments/HookFragment";
import { LogoFragment } from "./fragments/LogoFragment";
import { AUDIT_SCREEN, FULLCAL_SCREEN, PLAN_SCREEN } from "./screens";
import { bar } from "./timeline";
import type { FilmScene } from "./types";

/**
 * Сценарий фильма (спецификация §4). Ключи сцен — ключи глав для `--chapter`.
 * Длительности — в тактах: 120 BPM, такт = 2 с.
 */
export const SCENES: FilmScene[] = [
  { kind: "fragment", key: "hook", duration: bar(1.5), Component: HookFragment },
  { kind: "fragment", key: "logo", duration: bar(1), Component: LogoFragment },
  {
    kind: "screen",
    key: "plan",
    duration: bar(3),
    screen: PLAN_SCREEN,
    caption: { ru: "План акций на год — в одном окне", uz: "Yillik aksiyalar rejasi — bitta oynada" },
  },
  {
    kind: "screen",
    key: "fullcal",
    duration: bar(3),
    screen: FULLCAL_SCREEN,
    caption: {
      ru: "Каждая позиция: цена, подарки, рассрочка",
      uz: "Har bir pozitsiya: narx, sovg'alar, muddatli to'lov",
    },
  },
  {
    kind: "screen",
    key: "audit",
    duration: bar(2),
    screen: AUDIT_SCREEN,
    caption: { ru: "Сроки под контролем", uz: "Muddatlar nazorat ostida" },
  },
];
