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
 * Низ окна — под затемнением подписи, но красная строка «3 строки: не заполнены
 * обязательные поля» сквозь затемнение читается (кадр 21.5). Это замечание
 * проверки заполнения 26-3, а не чужая просрочка (Review Focus #1 — про
 * просрочки других этапов), поэтому кадр ради неё не перестраивался.
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
    // оба нецелые. Детерминизм кадра обеспечивает не поза, а канонический
    // повтор пути записи — см. комментарий у seekTo в FilmPage.tsx.
    { at: 1.4, value: { ...WHOLE, cx: 846, cy: 567.3, zoom: 1.62 }, ease: easeInOutCubic },
  ],
};

/**
 * Карточка согласования: таблица «Номенклатура акции» и правая панель без
 * красной плашки просрочки. Края кадра в px окна (замер живьём 01.10): левый
 * 284,86 — левее текста карточки «Номенклатура акции» («На согласовании:»,
 * «Весь список…» с 297); правый 1401,14 — правее текста правой панели (до
 * 1386,33); верх 445,35 — ниже плашки просрочки (низ 442,67). tx = −489,96,
 * ty = −765,996 — оба нецелые.
 */
const APPROVAL_TABLE: CameraPose = { cx: 843, cy: 759.3, zoom: 1.72, rx: 0, ry: 0, opacity: 1 };

/**
 * Панель «Изменение позиции» — раздел «Было / Стало» крупно. Безопасна ТОЛЬКО
 * пока панель открыта: x ≥ ~1010 (внутри непрозрачной панели) закрывает собой
 * плашку просрочки над таблицей (397–442,67 px окна), y ≤ ~430 — выше
 * красного срока самой панели («Просрочено на +40 раб. дн.», 636–694).
 */
const APPROVAL_DRAWER: CameraPose = { cx: 1220, cy: 311.5, zoom: 4.571, rx: 0, ry: 0, opacity: 1 };

/**
 * Строка героя сама по себе — безопасна В ОБОИХ состояниях панели: x ≤ 1000
 * (левее панели) не показывает её красный срок, если панель открыта; y ≥ 503
 * (ниже плашки просрочки) не показывает плашку, если панель закрыта. Стоит по
 * обе стороны от `APPROVAL_DRAWER` в `camera` ниже — переход между ними
 * сделан склейкой (повтор `at`, не панорама): строка героя (693–738 px окна)
 * и красный срок панели (636–694) стоят почти вплотную, и непрерывная
 * панорама между ними держала бы один из двух в кадре в середине пути.
 */
const APPROVAL_ROW: CameraPose = { cx: 650, cy: 700, zoom: 2.743, rx: 0, ry: 0, opacity: 1 };

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
 * Прямоугольник элемента, обрезанный видимой областью его прокручиваемого
 * предка (тот же приём, что у `planHeroRow`): `getBoundingClientRect()` строки
 * не знает о клипе `overflow-x-auto` — без пересечения рамка может выйти за
 * карточку таблицы в соседнюю колонку.
 */
const clipToScroller = (el: Element): Rect => {
  const scroller = el.closest<HTMLElement>("div.overflow-x-auto") ?? (el.parentElement as HTMLElement);
  const r = el.getBoundingClientRect();
  const s = scroller.getBoundingClientRect();
  const x = Math.max(r.left, s.left);
  const y = Math.max(r.top, s.top);
  return { x, y, w: Math.max(0, Math.min(r.right, s.right) - x), h: Math.max(0, Math.min(r.bottom, s.bottom) - y) };
};

/**
 * «Каждая правка — с решением директора»: заявка 26-3 × менеджер героя.
 * Курсор нажимает строку De'Longhi — открывается панель «Изменение позиции»,
 * камера держит «Было / Стало» (скидка 16% → 18%, прогноз 40 → 55); панель
 * закрывается, курсор нажимает «Согласовать все изменения» — строка получает
 * замок «Согласовано ранее» и 18%, панель — «Набор согласован коммерческим
 * директором.». Камера между кликом и разделом «Было / Стало» (и обратно)
 * держит строку героя (`APPROVAL_ROW`) — см. комментарий у неё и у
 * `APPROVAL_DRAWER` про склейку вместо панорамы.
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
        // getClientRects — иначе первым совпадением может стать скрытый
        // (lg:hidden) дубль той же кнопки в мобильной нижней панели.
        [...doc.querySelectorAll("button")].find(
          (b) => b.getClientRects().length > 0 && norm(b.textContent) === "Согласовать все изменения",
        ) ?? null,
    },
    {
      kind: "highlight",
      at: 5,
      until: 6,
      label: `строка «${HERO.productName}» после решения`,
      area: (doc) => {
        const row = approvalHeroRow(doc);
        return row ? clipToScroller(row) : null;
      },
    },
  ],
  camera: [
    // cy: 805 (не 759,3 из APPROVAL_TABLE) — на zoom 1,5 центр APPROVAL_TABLE
    // поднял бы верх кадра до 399 px, выше плашки просрочки (низ 442,67).
    // Верх кадра cy − 540/zoom на участке 0–0.5 — не меньше 445 (445,0 в
    // начале, до 446,75 по пути, 445,35 в конце). Отъезд ROW → TABLE
    // (3,8–4,2) уменьшает его монотонно, с 503,1 до 445,35.
    { at: 0, value: { ...APPROVAL_TABLE, cy: 805, zoom: 1.5, opacity: 0 } },
    { at: 0.5, value: APPROVAL_TABLE, ease: easeOutExpo },
    { at: 0.9, value: APPROVAL_ROW, ease: easeInOutCubic },
    { at: 1.2, value: APPROVAL_ROW },
    // Склейка (повтор `at`) вместо панорамы — см. комментарий у APPROVAL_ROW.
    // keyframes() при t === at обеих записей пропускает нулевой отрезок и
    // берёт значение второй — блендинга нет ни при каком t (timeline.ts).
    { at: 1.2, value: APPROVAL_DRAWER },
    { at: 3.5, value: APPROVAL_DRAWER },
    { at: 3.5, value: APPROVAL_ROW },
    // Держим APPROVAL_ROW до закрытия панели (клик на 3,8): отъезд к
    // APPROVAL_TABLE раньше показал бы красный срок панели — он всё ещё в DOM.
    { at: 3.8, value: APPROVAL_ROW },
    { at: 4.2, value: APPROVAL_TABLE, ease: easeInOutCubic },
  ],
};

const tab = (name: string): { label: string; target: TargetFn } => ({
  label: `вкладка «${name}»`,
  target: (doc) =>
    [...doc.querySelectorAll('[role="tab"]')].find((el) => el.textContent?.trim() === name) ?? null,
});

/**
 * Строка таблицы сроков, содержащая все `parts`. Таблица шире карточки (1342 px
 * против 1151 px на 1440×900), поэтому рамка обрезается по видимой части
 * прокручиваемого блока — тот же приём, что у `clipToScroller`.
 */
const deadlineRow = (doc: Document, ...parts: string[]): Rect | null => {
  const tr = [...doc.querySelectorAll("tbody tr")].find(
    (row) => row.getClientRects().length > 0 && parts.every((p) => norm(row.textContent).includes(p)),
  );
  const box = tr?.closest(".overflow-auto");
  if (!tr || !box) return null;
  const r = tr.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  const x = Math.max(r.left, b.left);
  return { x, y: r.top, w: Math.min(r.right, b.right) - x, h: r.height };
};

/**
 * Кадрирование «до фильтра»: держит вкладку, панель фильтров и (открытый)
 * список «Все ответственные» — без колонок «Результат»/«Просрочка» (левый
 * край «Результат» — 1221,93 px окна, измерено живьём). До применения фильтра
 * в таблице 63 строки, среди которых есть чужие просрочки — не только именованные
 * в разборе ревью «+55/+59 раб. дн.» (решения директора по 26-3, они и правда вне
 * кадра — глубоко в несортированном списке, индексы 19/21 из 63, ниже видимой без
 * прокрутки части), но и «+4 раб. дн.» у совсем другой акции («Чёрная пятница
 * 2026», 26-1) — она как раз входит в первые ~7 видимых строк и была бы читаема
 * всё удержание камеры. Правый край кадра (1179,36 px окна) — с запасом левее
 * 1221,93; левый край уходит на 59 px за окно (тёмный фон сцены, не пустота —
 * тот же приём, что у входных поз FULLCAL/PLAN). По вертикали кадр одновременно
 * держит верх вкладки (236 px окна → 37,3 px холста, с запасом от края) и низ
 * открытого списка (752,33 px окна → 837,65 px холста, с запасом 22,4 px от
 * начала подписи на 860 px холста) — оба измерены живьём.
 */
const PRE_FILTER_CROP: CameraPose = { cx: 560, cy: 560.3, zoom: 1.55, rx: 0, ry: 0, opacity: 1 };

/**
 * «У каждого срока — ответственный»: аудит, вкладка сроков по промо. Курсор
 * выбирает в фильтре «Все ответственные» менеджера акции-героя — остаются её
 * сроки: 26-3 «Отправка данных КМ — В срок», 26-3 «Отправка первичного отчёта —
 * Просрочено +8 кал. дн.», 26-11 «В срок» (единственные три строки, где
 * ответственный — она). До выбора фильтра камера держит `PRE_FILTER_CROP` —
 * узкий кадр без правых колонок «Результат»/«Просрочка» (см. её комментарий):
 * без него в кадре ~1,8 с легко читалась бы чужая просрочка другой акции.
 * После выбора те же две колонки в кадре не нужны — но и не опасны: у всех
 * трёх оставшихся строк результат «В срок»/«Просрочено +8 кал. дн.», без
 * «раб. дн.» вовсе (26-3 — единственный участник кампании, её КМ-статус
 * терминален и не порождает точек согласования директора; 26-11 — точка того
 * же типа «Отправка данных КМ», её собственные точки согласования
 * приписаны другим ролям). Камера подходит к отфильтрованной таблице, рамки —
 * на двух строках 26-3.
 */
export const DEADLINES_SCREEN: ScreenSpec = {
  path: "audit",
  role: "Коммерческий директор",
  user: "u-1",
  theme: "light",
  ready: h1("Аудит-лог и контроль сроков"),
  home: { x: 980, y: 300 },
  cues: [
    { kind: "click", at: 0, ...tab("Сроки по промо и отчётам") },
    {
      kind: "click",
      at: 1.2,
      cursor: true,
      label: "фильтр «Все ответственные»",
      target: (doc) =>
        [...doc.querySelectorAll('button[role="combobox"]')].find(
          (b) => norm(b.textContent) === "Все ответственные",
        ) ?? null,
    },
    {
      kind: "click",
      at: 2,
      cursor: true,
      label: `пункт «${HERO.kmName}»`,
      target: (doc) =>
        [...doc.querySelectorAll('[role="option"]')].find((o) => norm(o.textContent) === HERO.kmName) ?? null,
    },
    {
      kind: "highlight",
      at: 2.9,
      until: 3.9,
      label: "строка «Отправка данных КМ»",
      area: (doc) => deadlineRow(doc, HERO.promoNo, "Отправка данных КМ"),
    },
    {
      kind: "highlight",
      at: 3.9,
      until: 5,
      label: "строка «Отправка первичного отчёта»",
      area: (doc) => deadlineRow(doc, HERO.promoNo, "Отправка первичного отчёта"),
    },
  ],
  camera: [
    // Тот же центр, что у PRE_FILTER_CROP, — крупнее и прозрачно: раз центр не
    // меняется, кадр всю растяжку входа (0–0.4) строже самого PRE_FILTER_CROP
    // (выше zoom ⇒ у́же видимая полоса), так что вход тоже без «Результат»/
    // «Просрочка» даже на полупрозрачности (урок ревью раунда 1 — проверять
    // и вход, не только устоявшуюся позу).
    { at: 0, value: { ...PRE_FILTER_CROP, zoom: 1.8, opacity: 0 } },
    { at: 0.4, value: PRE_FILTER_CROP, ease: easeOutExpo },
    { at: 2.2, value: PRE_FILTER_CROP },
    // Отфильтрованная таблица (шапка 528–560, строки 560–829 px окна); низ
    // окна (900) — у низа кадра, как в исходном замере. tx = −413,76,
    // ty = −378,54 — оба нецелые (урок 30.09: при целых обоих Chrome
    // переиспользует растр, и кадр начинает зависеть от пути перемотки).
    { at: 2.9, value: { cx: 848, cy: 567, zoom: 1.62, rx: 0, ry: 0, opacity: 1 }, ease: easeInOutCubic },
  ],
};

/** Шапка отчёта маркетингу: «Версия 4 · Изменено: 2» и переключатель «Только изменения». */
const REPORT_HEAD: CameraPose = { cx: 700, cy: 380.3, zoom: 1.45, rx: 0, ry: 0, opacity: 1 };

/**
 * Таблица отчёта после «Только изменения»: строки De'Longhi и Dyson (741 и 793 px
 * окна). Страница после фильтра короче окна и не прокручивается, поэтому низ окна
 * (900 px) виден над подписью — под её затемнением. tx = −240, ty = −480,45.
 * Правый край кадра — правый край окна (1440 px): после прокрутки к цене
 * (`priceScrollLeft`) её рамка — 1630,5–1903,5 px холста, целиком в кадре.
 */
const REPORT_TABLE: CameraPose = { cx: 800, cy: 680.3, zoom: 1.5, rx: 0, ry: 0, opacity: 1 };

/** Тело таблицы отчёта: самый высокий горизонтальный скроллер (шапка и нижняя полоса — низкие). */
const reportBody: TargetFn = (doc) =>
  [...doc.querySelectorAll<HTMLElement>("div.overflow-x-auto")]
    .filter((el) => el.scrollWidth > el.clientWidth && el.clientHeight > 50)
    .sort((a, b) => b.clientHeight - a.clientHeight)[0] ?? null;

/**
 * Ячейка изменённого поля отчёта: подчёркнутое значение под подсказкой «было →
 * стало» (`.cursor-help` в DepartmentReportView.tsx — тот же класс на десктопной
 * ячейке и на мобильной карточке; на 1440×900 карточка скрыта и отфильтрована
 * невидимостью, как и в `byText`). Обычный `byText` здесь не годится: измерено
 * живьём (1440×900, «Только изменения» выключены) — число «4 440 000 сум» в
 * строке De'Longhi встречается ДВАЖДЫ: один раз — в изменённой ячейке цены
 * (жёлтая подсветка, `.cursor-help`), второй — случайно, в независимой ячейке
 * рассрочки дальше в той же строке («12 мес: полная цена (новая)» — без
 * переплаты численно совпадает с самой ценой; уточнено замером 01.10).
 * `byText` берёт последнее совпадение по документу —
 * это случайный дубль, а не изменённая цена; `.cursor-help` — однозначный
 * маркер именно изменённой ячейки.
 */
const changedValueCell = (root: ParentNode, text: string): Element | null =>
  [...root.querySelectorAll<HTMLElement>(".cursor-help")]
    .filter((e) => e.getClientRects().length > 0 && norm(e.textContent) === text)
    .at(-1)?.parentElement ?? null;

/**
 * Прокрутка тела отчёта, при которой «Новая цена» — крайняя правая целиком
 * видимая колонка, а следующая за ней «Скидка, %» — за правым краем видимой
 * части. «Скидка 16%» в кадре спорила бы с сюжетом: директор только что
 * согласовал 18% (сцена approval), а окно отчёта этого решения не видит — у
 * каждого экрана фильма своё состояние в памяти, в отчёте посевные 16%.
 * Считается по правому краю изменённой ячейки цены в координатах содержимого,
 * поэтому не зависит ни от текущей прокрутки, ни от «Только изменения». Замер
 * 01.10 (1440×900): видимая часть — 719 px (704–1423 px окна), ячейка цены —
 * 1554–1724 px содержимого, «Скидка, %» — 1724–1834 → прокрутка 1005.
 */
const priceScrollLeft = (el: Element): number => {
  const cell = changedValueCell(el, HERO.priceNow);
  if (!cell) throw new Error(`[film] сцена «report»: не найдена ячейка новой цены «${HERO.priceNow}»`);
  const right = cell.getBoundingClientRect().right - el.getBoundingClientRect().left - el.clientLeft + el.scrollLeft;
  return Math.max(0, Math.min(right - el.clientWidth, el.scrollWidth - el.clientWidth));
};

/**
 * «Маркетинг видит изменения сразу»: отчёт 26-3 открывается сотруднику маркетинга
 * по умолчанию — «Версия 4 · Изменено: 2» (рамка). Курсор включает «Только
 * изменения», таблица прокручивается к ценам — до «Новой цены» у правого края,
 * «Скидка, %» вне кадра (см. `priceScrollLeft`), рамка — на новой цене
 * De'Longhi, той же, что на кассе в первом акте.
 */
export const REPORT_SCREEN: ScreenSpec = {
  path: "reports",
  role: "Сотрудник маркетинга",
  user: "u-6",
  theme: "light",
  ready: h1("Отчёты смежным отделам"),
  home: { x: 820, y: 560 },
  cues: [
    {
      kind: "highlight",
      at: 0.8,
      until: 1.9,
      label: "«Изменено: 2»",
      area: (doc) => {
        const badge = byText(doc, "Изменено: 2");
        return badge ? rectOf(badge) : null;
      },
    },
    {
      kind: "click",
      at: 1.6,
      cursor: true,
      label: "переключатель «Только изменения»",
      target: (doc) => doc.querySelector('[aria-label="Только изменения"]'),
    },
    {
      kind: "scroll",
      at: 2,
      until: 3.2,
      label: "прокрутка таблицы к ценам",
      target: reportBody,
      // До начала прокрутки (p = 0) прокручивать нечего, и ячейку не ищем:
      // `to` вызывается и на первых кадрах сцены, сразу после готовности
      // экрана, когда строк таблицы может ещё не быть.
      to: (p, el) => (p > 0 ? easeInOutCubic(p) * priceScrollLeft(el) : 0),
    },
    {
      kind: "highlight",
      at: 3.4,
      until: 6,
      label: `новая цена «${HERO.priceNow}»`,
      // Ячейка стоит вплотную к правому краю видимой части — рамка обрезается
      // по ней (`clipToScroller`), а не по ячейке целиком.
      area: (doc) => {
        const body = reportBody(doc);
        const cell = body && changedValueCell(body, HERO.priceNow);
        return cell ? clipToScroller(cell) : null;
      },
    },
  ],
  camera: [
    { at: 0, value: { ...REPORT_HEAD, cx: -320, ry: -8 } },
    { at: 0.7, value: REPORT_HEAD, ease: easeOutExpo },
    { at: 2, value: REPORT_HEAD },
    { at: 3.2, value: REPORT_TABLE, ease: easeInOutCubic },
  ],
};
