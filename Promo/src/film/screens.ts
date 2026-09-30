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

/**
 * Прокручиваемая часть таблицы полного календаря (Pattern F: две синхронные
 * панели). Среди горизонтальных скроллеров со строками (`.min-w-max` прямым
 * потомком) — самый высокий: это тело таблицы, его onScroll синхронизирует шапку
 * и нижнюю полосу.
 */
const tableScroller: TargetFn = (doc) =>
  [...doc.querySelectorAll<HTMLElement>("div.overflow-x-auto")]
    .filter((el) => el.scrollWidth > el.clientWidth && el.querySelector(":scope > .min-w-max"))
    .sort((a, b) => b.clientHeight - a.clientHeight)[0] ?? null;

/**
 * «Каждая позиция: цена, подарки, рассрочка»: полный календарь под КД (8 акций,
 * 22 позиции — у КМ всего 5). Окно въезжает справа, камера подходит к таблице,
 * таблица панорамируется на всю ширину колонок.
 */
export const FULLCAL_SCREEN: ScreenSpec = {
  path: "full-calendar",
  role: "Коммерческий директор",
  user: "u-1",
  theme: "light",
  ready: h1("Полный промо-календарь"),
  home: { x: 720, y: 450 },
  cues: [
    {
      kind: "scroll",
      at: 0.8,
      until: 5.4,
      label: "прокрутка таблицы",
      target: tableScroller,
      to: (p, el) => easeInOutCubic(p) * (el.scrollWidth - el.clientWidth),
    },
  ],
  camera: [
    { at: 0, value: { ...WHOLE, cx: -320, ry: -8 } },
    { at: 0.7, value: WHOLE, ease: easeOutExpo },
    // zoom = 1920 / 1440: окно ровно во всю ширину кадра (tx = 960 − 720 · zoom = 0).
    // Низ окна — на 0,27 px ниже кадра (cy = 494,8, а не 900 − 540 / zoom = 495):
    // при целом сдвиге по обеим осям (ty = −120) Chrome считает окно выровненным по
    // пикселям и переиспользует растр прокрученной таблицы — кадр начинает зависеть
    // от пути перемотки (тест fullcal падал 3 из 3). ty = −119,73 — не целый.
    { at: 1.4, value: { ...WHOLE, cx: 720, cy: 494.8, zoom: 1920 / 1440 }, ease: easeInOutCubic },
  ],
};

const tab = (name: string): { label: string; target: TargetFn } => ({
  label: `вкладка «${name}»`,
  target: (doc) =>
    [...doc.querySelectorAll('[role="tab"]')].find((el) => el.textContent?.trim() === name) ?? null,
});

/**
 * «Сроки под контролем»: аудит, вкладка сроков по промо (чипы «В срок» /
 * «Просрочено»). На сильной доле (2 с) курсор кликает переключатель темы —
 * экран уходит в тёмную тему, камера подходит к колонке результатов.
 */
export const AUDIT_SCREEN: ScreenSpec = {
  path: "audit",
  role: "Коммерческий директор",
  user: "u-1",
  theme: "light",
  ready: h1("Аудит-лог и контроль сроков"),
  home: { x: 980, y: 420 },
  cues: [
    { kind: "click", at: 0, ...tab("Сроки по промо и отчётам") },
    {
      kind: "click",
      at: 2,
      cursor: true,
      label: "переключатель темы",
      target: (doc) => doc.querySelector('button[aria-label="Переключить тему"]'),
    },
  ],
  camera: [
    { at: 0, value: { ...WHOLE, zoom: 1.3, opacity: 0 } },
    { at: 0.4, value: WHOLE, ease: easeOutExpo },
    { at: 2.4, value: WHOLE },
    { at: 4, value: { ...WHOLE, cx: 800, cy: 540, zoom: 1.5 }, ease: easeInOutCubic },
  ],
};
