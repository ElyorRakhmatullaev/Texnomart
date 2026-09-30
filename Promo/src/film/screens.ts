import type { TargetFn } from "./cues";
import { HERO } from "./hero";
import { easeInOutCubic, easeOutExpo } from "./timeline";
import type { CameraPose, ScreenSpec } from "./types";

/** Цель «заголовок страницы, содержащий текст». */
export const h1 = (text: string): { label: string; target: TargetFn } => ({
  label: `заголовок «${text}»`,
  target: (doc) => [...doc.querySelectorAll("h1")].find((h) => h.textContent?.includes(text)) ?? null,
});

/** Текст без лишних пробелов. */
export const norm = (s: string | null | undefined): string => (s ?? "").replace(/\s+/g, " ").trim();

/**
 * Самый глубокий видимый элемент с точным текстом. querySelectorAll идёт в
 * порядке документа (предок раньше потомка), поэтому последнее совпадение —
 * самое глубокое. Невидимые (мобильные списки под md:hidden) пропускаются.
 */
export const byText = (root: ParentNode, text: string): Element | null =>
  [...root.querySelectorAll("*")]
    .filter((e) => e.getClientRects().length > 0 && norm(e.textContent) === text)
    .at(-1) ?? null;

/** Окно целиком в кадре: 1440×900 × 1,12 ≈ 1613×1008 на холсте 1920×1080. */
export const WHOLE: CameraPose = { cx: 720, cy: 450, zoom: 1.12, rx: 0, ry: 0, opacity: 1 };

/**
 * «Один план. Одна версия.»: краткий календарь под КД; акция-герой 26-3 —
 * третья строка. Окно влетает с 3D-наклоном и выравнивается, камера наезжает
 * на таблицу. Прокрутка и рамка на строке — Task 4.
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
    { at: 0.7, value: WHOLE, ease: easeOutExpo },
    { at: 2.2, value: { ...WHOLE, cx: 820, cy: 570.3, zoom: 1.55 }, ease: easeInOutCubic },
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
 * «Все позиции — в одной таблице»: полный календарь под КД, отфильтрованный по
 * ссылке до акции-героя (`?promo=` — 5 позиций 26-3). Окно въезжает справа,
 * камера подходит к таблице, таблица панорамируется на всю ширину колонок.
 * Низ окна (красная строка «не заполнены обязательные поля») — под затемнением
 * подписи.
 */
export const FULLCAL_SCREEN: ScreenSpec = {
  path: "full-calendar",
  role: "Коммерческий директор",
  user: "u-1",
  theme: "light",
  query: { promo: HERO.campaignId },
  ready: h1("Полный промо-календарь"),
  home: { x: 720, y: 450 },
  cues: [
    {
      kind: "scroll",
      at: 1.2,
      until: 3.8,
      label: "прокрутка таблицы",
      target: tableScroller,
      to: (p, el) => easeInOutCubic(p) * (el.scrollWidth - el.clientWidth),
    },
  ],
  camera: [
    { at: 0, value: { ...WHOLE, cx: -320, ry: -8 } },
    { at: 0.7, value: WHOLE, ease: easeOutExpo },
    // Таблица (строки 527–807 px окна) во весь кадр; tx = −410,52, ty = −379,026 —
    // оба нецелые (округление «−379,0» в прежнем комментарии вводило в
    // заблуждение: значение было в 0,026 px от целого — этого недостаточно,
    // чтобы задеть ошибку ниже, но само округление маскировало, насколько
    // близко). Кадр окна прокрученной сцены-экрана детерминирован не позой —
    // её отвечает пересборка `<iframe>` при повторном t в FilmPage.tsx
    // (см. комментарий там): Chrome иначе растрирует текст прокрученной
    // таблицы, если окно уже стояло на другом scrollLeft раньше, даже когда
    // итоговые DOM и transform совпадают побайтово — там же и разбор, почему
    // не помогали ни нецелые сдвиги позы, ни перезагрузка одного <iframe>.
    { at: 1.4, value: { ...WHOLE, cx: 846, cy: 567.3, zoom: 1.62 }, ease: easeInOutCubic },
  ],
};

/**
 * Карточка согласования: таблица «Номенклатура акции» и правая панель без
 * красной плашки просрочки (её низ — 442 px окна, верх кадра — 447 px).
 */
const APPROVAL_TABLE: CameraPose = { cx: 852, cy: 756.2, zoom: 1.75, rx: 0, ry: 0, opacity: 1 };

/** «Каждая правка — с решением директора»: заявка 26-3 × менеджер героя. Сигналы — Task 5. */
export const APPROVAL_SCREEN: ScreenSpec = {
  path: `approvals/${HERO.campaignId}~${HERO.kmId}`,
  role: "Коммерческий директор",
  user: "u-1",
  theme: "light",
  ready: { label: "блок «Номенклатура акции»", target: (doc) => byText(doc, "Номенклатура акции") },
  home: { x: 700, y: 560 },
  cues: [],
  camera: [
    { at: 0, value: { ...APPROVAL_TABLE, zoom: 1.5, opacity: 0 } },
    { at: 0.5, value: APPROVAL_TABLE, ease: easeOutExpo },
  ],
};

const tab = (name: string): { label: string; target: TargetFn } => ({
  label: `вкладка «${name}»`,
  target: (doc) =>
    [...doc.querySelectorAll('[role="tab"]')].find((el) => el.textContent?.trim() === name) ?? null,
});

/** «У каждого срока — ответственный»: аудит, вкладка сроков по промо. Фильтр и рамки — Task 6. */
export const DEADLINES_SCREEN: ScreenSpec = {
  path: "audit",
  role: "Коммерческий директор",
  user: "u-1",
  theme: "light",
  ready: h1("Аудит-лог и контроль сроков"),
  home: { x: 980, y: 300 },
  cues: [{ kind: "click", at: 0, ...tab("Сроки по промо и отчётам") }],
  camera: [
    { at: 0, value: { ...WHOLE, zoom: 1.3, opacity: 0 } },
    { at: 0.4, value: WHOLE, ease: easeOutExpo },
  ],
};

/** Шапка отчёта маркетингу: «Версия 4 · Изменено: 2» и переключатель «Только изменения». */
const REPORT_HEAD: CameraPose = { cx: 700, cy: 380.3, zoom: 1.45, rx: 0, ry: 0, opacity: 1 };

/** «Маркетинг видит изменения сразу»: отчёт 26-3 под сотрудником маркетинга. Сигналы — Task 7. */
export const REPORT_SCREEN: ScreenSpec = {
  path: "reports",
  role: "Сотрудник маркетинга",
  user: "u-6",
  theme: "light",
  ready: h1("Отчёты смежным отделам"),
  home: { x: 820, y: 560 },
  cues: [],
  camera: [
    { at: 0, value: { ...REPORT_HEAD, cx: -320, ry: -8 } },
    { at: 0.7, value: REPORT_HEAD, ease: easeOutExpo },
  ],
};
