import type { TargetFn } from "./cues";
import { easeInOutCubic, easeOutExpo } from "./timeline";
import type { CameraPose, ScreenSpec } from "./types";

/** Цель «заголовок страницы, содержащий текст». */
export const h1 = (text: string): { label: string; target: TargetFn } => ({
  label: `заголовок «${text}»`,
  target: (doc) => [...doc.querySelectorAll("h1")].find((h) => h.textContent?.includes(text)) ?? null,
});

/** Окно целиком в кадре: 1440×900 × 1,12 ≈ 1613×1008 на холсте 1920×1080. */
export const WHOLE: CameraPose = { cx: 720, cy: 450, zoom: 1.12, rx: 0, ry: 0, opacity: 1 };

/**
 * «План акций на год — в одном окне»: краткий календарь под КД. Окно влетает с
 * 3D-наклоном, выравнивается, затем камера наезжает на таблицу акций (правый край
 * окна у правого края кадра: cx = 1440 − 1920 / 1,8 / 2 ≈ 906).
 */
export const PLAN_SCREEN: ScreenSpec = {
  path: "short-calendar",
  role: "Коммерческий директор",
  user: "u-1",
  theme: "light",
  ready: h1("Краткий промо-календарь"),
  home: { x: 720, y: 450 },
  cues: [],
  camera: [
    { at: 0, value: { ...WHOLE, zoom: 0.9, rx: 14, ry: -22, opacity: 0 } },
    { at: 0.9, value: WHOLE, ease: easeOutExpo },
    { at: 2.2, value: WHOLE },
    { at: 5.4, value: { ...WHOLE, cx: 906, cy: 600, zoom: 1.8 }, ease: easeInOutCubic },
  ],
};
