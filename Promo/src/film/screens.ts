import type { Rect, TargetFn } from "./cues";
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

/** Прямоугольник элемента в координатах окна. */
export const rectOf = (el: Element): Rect => {
  const b = el.getBoundingClientRect();
  return { x: b.left, y: b.top, w: b.width, h: b.height };
};

/** Страница прокручивается в <main> общей оболочки AppShell. */
export const pageScroller: TargetFn = (doc) => doc.querySelector("main");

/**
 * Строка акции-героя в кратком календаре (Pattern F): кнопка строки лежит в
 * замороженной панели, рамка — на ширину обеих панелей (их общий контейнер).
 */
const planHeroRow = (doc: Document): Rect | null => {
  const button = byText(doc, HERO.promoNo)?.closest("button");
  const panes = button?.parentElement?.parentElement;
  if (!button || !panes) return null;
  const b = button.getBoundingClientRect();
  const p = panes.getBoundingClientRect();
  return { x: p.left, y: b.top, w: p.width, h: b.height };
};

/**
 * «Один план. Одна версия.»: краткий календарь под КД; акция-герой 26-3 —
 * третья строка. Окно влетает с 3D-наклоном и выравнивается; пока камера
 * наезжает, страница прокручивается на 300 px — строка 26-3 встаёт на 432–512 px
 * окна, в середину кадра, выше подписи; на ней загорается рамка.
 */
export const PLAN_SCREEN: ScreenSpec = {
  path: "short-calendar",
  role: "Коммерческий директор",
  user: "u-1",
  theme: "light",
  ready: h1("Краткий промо-календарь"),
  home: { x: 720, y: 450 },
  cues: [
    {
      kind: "scroll",
      axis: "y",
      at: 0.9,
      until: 2.2,
      label: "прокрутка страницы к таблице",
      target: pageScroller,
      to: (p) => easeInOutCubic(p) * 300,
    },
    { kind: "highlight", at: 1.6, until: 3, label: `строка ${HERO.promoNo}`, area: planHeroRow },
  ],
  camera: [
    { at: 0, value: { ...WHOLE, zoom: 0.9, rx: 14, ry: -22, opacity: 0 } },
    { at: 0.7, value: WHOLE, ease: easeOutExpo },
    // tx = −311 (целый), ty = −111,465 — нецелый.
    { at: 2.2, value: { ...WHOLE, cx: 820, cy: 420.3, zoom: 1.55 }, ease: easeInOutCubic },
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
    // заблуждение: значение было в 0,026 px от целого; проверено отдельно —
    // само по себе это не источник кадровой недетерминированности ниже, но
    // округление маскировало, насколько близко). Поза здесь не отвечает за
    // детерминизм кадра — им управляет то, как FilmPage.tsx проходит сцену в
    // записи (см. комментарий у seekTo там): Chrome иначе растрирует текст
    // прокрученной таблицы и трансформированный слой окна, если до этого они
    // уже стояли на другой позе/прокрутке. Повтор пути записи внутри сцены
    // убрал видимое расхождение (было 23 уровня из 255 на 5 638 пикселях), но
    // не сделал растр чистой функцией t: остаётся шум от истории страницы ДО
    // входа в сцену и от нагрузки на видеокарту (до 50 уровней в одном столбце
    // у края окна, PSNR ≈ 46–60 дБ — на глаз не виден). film.spec.ts поэтому
    // сравнивает кадры по PSNR ≥ 40 дБ (спецификация v2, §1 п. 3).
    { at: 1.4, value: { ...WHOLE, cx: 846, cy: 567.3, zoom: 1.62 }, ease: easeInOutCubic },
  ],
};

/**
 * Карточка согласования: таблица «Номенклатура акции» и правая панель без
 * красной плашки просрочки (её низ — 442 px окна, верх кадра — 447 px).
 */
const APPROVAL_TABLE: CameraPose = { cx: 852, cy: 756.2, zoom: 1.75, rx: 0, ry: 0, opacity: 1 };

/**
 * Живой экран изменился после замеров плана (правки моб. вёрстки, см. бриф
 * задачи 5): проверено на живом экране 1440×900 — «Было / Стало» лежит по-прежнему
 * у общего родителя с заголовком (0 детей), но красный срок панели («Просрочено
 * на +40 раб. дн.») стоит на 636–694 px окна (не «635+», как в прежнем
 * комментарии), а плашка просрочки над таблицей — 397–442,67 (низ соответствует
 * прежнему замеру). Поза `{cx:1040,cy:320.4,zoom:2.4}` из брифа держит и то, и
 * другое в кадре одновременно (Review Focus #1) — заменена на пару ниже.
 */

/** Панель «Изменение позиции» крупно: «Было / Стало» (193–430 px окна); оба красных — вне кадра (§ ниже). */
const APPROVAL_DRAWER: CameraPose = { cx: 1220, cy: 311.5, zoom: 4.571, rx: 0, ry: 0, opacity: 1 };

/**
 * Строка-герой сама по себе (700–1322 px окна) — ниже красного срока панели
 * (636–694) и выше плашки просрочки незачем: она вне кадра по построению
 * (плашка — 397–442, эта поза начинается на 700). Используется как «безопасная»
 * точка по обе стороны от `APPROVAL_DRAWER`: на неё наведена камера, пока
 * панель уже открыта, но ещё не показывает «Было / Стало» (после клика по
 * строке, до 1,8 с) и снова после (после 3,2 с, до закрытия в 3,8 с).
 *
 * Между этой позой и `APPROVAL_DRAWER` — жёсткая склейка (см. `camera` ниже),
 * а не панорама: строка героя (693–738) и красный срок панели (636–694) стоят
 * почти вплотную — окно, куда можно вписать кадр между «показывает строку» и
 * «выше плашки просрочки» (397–442) одновременно с «ниже среза панели»
 * (636–694), при этом не обрезая раздел «Было / Стало» по ширине (391 px окна),
 * требует зума ≈8–9× — на глаз это выглядело бы как дёрганый зум-рывок
 * посередине панорамы, а не как движение камеры. Один кадр разницы на 60 к/с
 * (1/60 с между соседними ключами) человеческий глаз не видит и покадровая
 * запись его не рендерит (между двумя соседними кадрами сетки нет
 * промежуточного кадра) — поэтому смена позы здесь читается как обычная склейка
 * между планами, а не как мигание.
 */
const APPROVAL_CLICK: CameraPose = { cx: 852, cy: 1013.6, zoom: 1.75, rx: 0, ry: 0, opacity: 1 };

/** Строка героя в таблице «Номенклатура акции». */
const approvalHeroRow = (doc: Document): Element | null =>
  byText(doc.querySelector("tbody") ?? doc, HERO.productName)?.closest("tr") ?? null;

/** Раздел «Было / Стало» открытой панели: заголовок раздела и таблица полей — у общего родителя. */
const changeBlock = (doc: Document): Rect | null => {
  const dialog = doc.querySelector('[role="dialog"]');
  const heading =
    dialog &&
    [...dialog.querySelectorAll("*")].find(
      (e) => e.children.length === 0 && /^было\s*\/\s*стало$/i.test(norm(e.textContent)),
    );
  const block = heading?.parentElement;
  return block ? rectOf(block) : null;
};

/**
 * «Каждая правка — с решением директора»: заявка 26-3 × менеджер героя.
 * Курсор нажимает строку De'Longhi — открывается панель «Изменение позиции»,
 * камера держит «Было / Стало» (скидка 16% → 18%, прогноз 40 → 55); панель
 * закрывается, курсор нажимает «Согласовать все изменения» — строка получает
 * замок «Согласовано ранее» и 18%, панель — «Набор согласован коммерческим
 * директором.». Камера между кликом по строке и разделом «Было / Стало» (и
 * обратно) держит строку героя (`APPROVAL_CLICK`), а не саму таблицу целиком —
 * см. комментарий у неё: строка панели «Просрочено на +40 раб. дн.» стоит
 * почти вплотную к строке героя, и панорама через оба конца одновременно
 * выводила бы её в кадр (Review Focus #1); склейка между `APPROVAL_CLICK` и
 * `APPROVAL_DRAWER` — на один кадр записи (1/60 с), не панорама.
 */
export const APPROVAL_SCREEN: ScreenSpec = {
  path: `approvals/${HERO.campaignId}~${HERO.kmId}`,
  role: "Коммерческий директор",
  user: "u-1",
  theme: "light",
  ready: { label: "блок «Номенклатура акции»", target: (doc) => byText(doc, "Номенклатура акции") },
  home: { x: 700, y: 560 },
  cues: [
    {
      kind: "click",
      at: 1,
      cursor: true,
      label: `строка «${HERO.productName}»`,
      target: (doc) => {
        const row = approvalHeroRow(doc);
        return row && byText(row, HERO.productName);
      },
    },
    { kind: "highlight", at: 1.8, until: 3.2, label: "раздел «Было / Стало»", area: changeBlock },
    {
      kind: "click",
      at: 3.8,
      label: "закрыть панель",
      // У кнопки закрытия панели (packages/ui, sheet.tsx) скрытый текст «Close».
      target: (doc) =>
        [...doc.querySelectorAll('[role="dialog"] button')].find((b) => norm(b.textContent) === "Close") ?? null,
    },
    {
      kind: "click",
      at: 4.6,
      cursor: true,
      label: "«Согласовать все изменения»",
      target: (doc) =>
        [...doc.querySelectorAll("button")].find((b) => norm(b.textContent) === "Согласовать все изменения") ?? null,
    },
    {
      kind: "highlight",
      at: 5,
      until: 6,
      label: `строка «${HERO.productName}» после решения`,
      area: (doc) => {
        const row = approvalHeroRow(doc);
        return row ? rectOf(row) : null;
      },
    },
  ],
  camera: [
    { at: 0, value: { ...APPROVAL_TABLE, zoom: 1.5, opacity: 0 } },
    { at: 0.5, value: APPROVAL_TABLE, ease: easeOutExpo },
    // Наезд на строку героя ДО клика (1 с) — оба красных вне кадра всю дорогу
    // (плашка просрочки — 397–442,67, эта поза начинается на 700).
    { at: 0.9, value: APPROVAL_CLICK, ease: easeInOutCubic },
    { at: 1.2, value: APPROVAL_CLICK },
    // Склейка на один кадр записи (1/60 с) в APPROVAL_DRAWER, не панорама —
    // см. комментарий у APPROVAL_CLICK.
    { at: 1.8 - 1 / 60, value: APPROVAL_CLICK },
    { at: 1.8, value: APPROVAL_DRAWER },
    { at: 3.2, value: APPROVAL_DRAWER },
    // Склейка обратно, тем же приёмом.
    { at: 3.2 + 1 / 60, value: APPROVAL_CLICK },
    { at: 3.8, value: APPROVAL_CLICK },
    // Обратный отъезд к таблице — ПОСЛЕ закрытия панели (клик на 3,8 с уже
    // применён): красный срок панели снят вместе с ней, в кадре — только
    // плашка просрочки, а APPROVAL_TABLE её не показывает (кадр по построению).
    { at: 4.2, value: APPROVAL_TABLE, ease: easeInOutCubic },
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
