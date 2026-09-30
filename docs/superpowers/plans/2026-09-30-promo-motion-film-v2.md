# Promo · моушн-фильм v2 «Хаос → порядок» — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переделать 32-секундный ролик-обзор в 48-секундный фильм «Хаос → порядок»: четыре боли бизнеса в первом акте, одна акция (26-3) проходит путь в Promo во втором, поверх кадра — список болей, который перечёркивается по ходу, в итоге боли сменяются гарантиями продукта.

**Architecture:** Механика первой версии остаётся: страница `/embed/film`, `window.__capture`, режим кадра вложенных экранов, покадровая запись `record-film.mjs`. Меняются сценарий и сцены: новые фрагменты первого акта и итога, список болей поверх второго акта (чистые функции `painStrikes`/`trackerOpacity`), три новые возможности сцены-экрана — параметры адреса окна, вертикальная прокрутка, жёлтая рамка-подсветка — и ожидание целей, которые экран открывает по таймеру.

**Tech Stack:** React 18 + TypeScript, Vite 6, Node 24 (`node --test` со снятием типов), Playwright (e2e), headless Chrome по DevTools + ffmpeg (запись).

**Spec:** `docs/superpowers/specs/2026-09-30-promo-motion-film-v2-design.md` (основа — `docs/superpowers/specs/2026-09-30-promo-motion-film-design.md`; план первой версии — `docs/superpowers/plans/2026-09-30-promo-motion-film.md`).

**Уточнения спецификации при планировании** (замеры живых экранов 1440×900 30.09; внесены в спецификацию тем же коммитом, что и план):
1. **`approval`** — решение принимается кнопкой «Согласовать все изменения» в правой панели карточки, а не «Согласовать строку» → «Согласовать» в панели. Кнопка панели стоит вплотную под красным блоком «Просрочено на +40 раб. дн.», крупный план её не обходит, а страница прокручивается лишь на ~99 px. Панель «Изменение позиции» с «Было / Стало» в сцене остаётся: открывается кликом по строке, закрывается кнопкой закрытия. Итог на экране — статус «Согласовано КД», строка De'Longhi с замком «Согласовано ранее» и скидкой 18%, «Набор согласован коммерческим директором.». Решение распространяется и на запрос исключения блендера Bosch — это обычное решение директора по набору.
2. **`deadlines`** — вместо прокрутки к строкам 26-3 курсор выбирает в фильтре «Все ответственные» менеджера 26-3 «Рашидова Дилноза». Остаются три строки, из них две по 26-3: «Отправка данных КМ — В срок» и «Отправка первичного отчёта — Просрочено +8 кал. дн.». Строк «+55/+59 раб. дн.» нет. Курсор работает с настоящим фильтром продукта.
3. **`report`** — без клика «Ознакомиться со всеми изменениями (2)»: после него кнопка исчезает, а шапка перестраивается. Вместо этого рамка на «Изменено: 2» в начале сцены.
4. **`plan`** — страница прокручивается на 300 px во время наезда, иначе строка 26-3 оказывается под подписью.
5. Данные акции-героя (номер, менеджер, товар, цены «было → стало») — в одном модуле `film/hero.ts`, из посева. Ими пользуются и рекламный макет первого акта, и сцены-экраны.
6. Поле `ScreenSpec.query` добавляется только в построение адреса окна: режим кадра переносит всю строку запроса в адрес экрана сам, `frame-mode.ts` не меняется.

## Global Constraints

- Экраны Promo **не меняются**: правки только в `Promo/src/film/**`, `Promo/scripts/**`, `Promo/e2e/film.spec.ts`, `Promo/package.json`, документации. `packages/ui` не редактируется. Если сцене чего-то не хватает на экране — меняется сцена, а не экран.
- Холст 1920×1080, 60 кадров/с, **48 с**; темп 120 BPM — удар 0,5 с, такт 2 с. Ключи глав — ровно: `before-files, before-chat, before-deadlines, before-depts, before-pile, logo, plan, fullcal, approval, deadlines, report, recap, final`.
- «Сейчас» в кадре — `2026-09-28T12:00:00+05:00`; вьюпорт вложенного экрана 1440×900; часовой пояс записи `Asia/Tashkent`.
- Цвета — точные hex через `style={{}}` (не классы вида `bg-[#…]`); `#FFD60A` — только акцент (линии, рамки, кольцо курсора, маленькие значки), не большие заливки; текст на жёлтом — `#000000`. Сцена `#0E0E10`. Красный `#EF4444` — только в иллюстрациях первого акта.
- Интерфейс в кадре и тексты внутри иллюстраций (имена файлов, сообщения, штамп) — по-русски в обеих версиях; переводятся только титры: заголовки первого акта, подписи сцен, список болей, итог, финальная карточка. В титрах **нет** внутренних сокращений «КД» и «КМ».
- `Promo/src/film/timeline.ts` и `Promo/src/film/cues.ts` — без импортов; `Promo/src/film/story.ts` — только `import type`. Во всех трёх только «стираемый» TypeScript (без `enum`, `namespace`, параметров-свойств): их запускает `node --test`.
- Над прокручиваемым экраном у позы камеры хотя бы один сдвиг нецелый: `tx = 960 − cx·zoom`, `ty = 540 − cy·zoom` (урок 30.09 — при целых обоих Chrome переиспользует растр, и кадр начинает зависеть от пути перемотки).
- Новых npm-зависимостей нет.
- Коммиты — прямо в `main`, **без** строк `Co-Authored-By` и других AI-подписей.
- `pnpm` не в PATH — все команды через `corepack pnpm`, из корня `D:\Texnomart`.
- `vite build` не проверяет типы. Типы — `tsc` из scratchpad по рецепту `tasks/lessons.md` (2026-09-24); базовая линия — ровно 3 известные ошибки (`plan-store.ts` ×2, `main.tsx`), всё сверх — новое и исправляется.
- Инструментам Node/Playwright/Chrome на Windows — только настоящие Windows-пути (`D:\…`), не `/d/…`; перед любым рекурсивным удалением — посмотреть содержимое (урок 30.09). Dev-серверы, запущенные в фоне, — останавливать по PID.

## Review Focus

1. **Чужие просрочки в кадре.** Красные «+40 раб. дн.» (плашка и блок в панели карточки согласования) и «+55/+59 раб. дн.» (аудит) не должны попадать в кадр ни в покое, ни на серединах переходов камеры. Проверяется в Task 8 кадрами 24.0 / 24.5 / 26.5 / 27.6 / 31.5; позы и моменты задаются в Task 5 и Task 6.
2. **Список болей и подпись не закрывают главное.** Список болей (левый верхний угол, холст 48–468 × 48–248) и подпись (низ слева, текст от y ≈ 860) не должны закрывать рамку-подсветку и цель курсора. Проверяется в Task 8 кадрами на серединах каждой рамки и каждого клика.
3. **Узбекские строки длиннее русских.** Нужно проверить заголовки первого акта (перенос на две строки не должен наезжать на иллюстрацию), строки списка болей (карточка 440 px) и итог. Проверяется в Task 8 кадрами `--lang uz`.
4. **Детерминизм перемотки для каждой сцены-экрана.** e2e каждой сцены-экрана прогоняется с `--repeat-each=3` (Tasks 3–7).
5. **Фильм, открытый в браузере без записи** (так его увидят по ссылке GitHub Pages), доигрывает сигналы вживую: курсор открывает панель, директор согласует набор. Тест «просмотр без записи доигрывает сигналы» — Task 7.

## Файлы

```
Promo/src/film/
├── cues.ts                  # Task 1: ось прокрутки, HighlightCue, highlightLook, resolveArea
├── story.ts                 # Task 2: боли, фразы RU/UZ, painOf, painStrikes, trackerOpacity (новое)
├── hero.ts                  # Task 3: акция-герой 26-3 из посева (новое)
├── palette.ts               # Task 3: + INK (цвета иллюстраций)
├── types.ts                 # Task 3: ScreenSpec.query, SceneBase.tracker/solves
├── PainTracker.tsx          # Task 3: список болей (новое)
├── FilmPage.tsx             # Task 3: + PainTracker
├── ScreenScene.tsx          # Task 1: ось прокрутки · Task 3: query · Task 4: рамки, ожидание целей
├── screens.ts               # Task 3: пять экранов (заготовки) · Tasks 4–7: сигналы и позы
├── scenes.ts                # Task 3: 13 сцен
└── fragments/
    ├── before/              # Task 3: BeforeFrame, FilesBefore, ChatBefore, DeadlinesBefore, DeptsBefore, PileBefore (новое)
    ├── RecapFragment.tsx    # Task 3 (новое)
    ├── LogoFragment.tsx · LogoMark.tsx · FinalFragment.tsx   # без изменений
    └── HookFragment.tsx · GridFragment.tsx · ChangeFragment.tsx  # Task 3: удаляются
Promo/scripts/
├── film-cues.test.ts        # Task 1
├── film-story.test.ts       # Task 2 (новое)
└── record-film.mjs          # Task 3: только пример `--chapter` в шапке
Promo/e2e/film.spec.ts       # Tasks 3–7
Promo/package.json           # Task 2: test:film += film-story.test.ts
```

Команды проверки (из `D:\Texnomart`):
- модульные: `corepack pnpm --filter promo test:film`
- e2e фильма: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts` (Playwright сам поднимает Vite на :5183)
- весь e2e: `corepack pnpm test:e2e:promo`
- сборка: `corepack pnpm build:promo`

---

### Task 1: Сигналы — ось прокрутки и рамка-подсветка

**Files:**
- Modify: `Promo/src/film/cues.ts`
- Modify: `Promo/scripts/film-cues.test.ts`
- Modify: `Promo/src/film/screens.ts` (сигнал прокрутки `FULLCAL_SCREEN`: `left` → `to`)
- Modify: `Promo/src/film/ScreenScene.tsx` (применение прокрутки по оси)

**Interfaces:**
- Consumes: —
- Produces (`Promo/src/film/cues.ts`):
  - `interface ScrollCue { kind: "scroll"; at: number; until: number; label: string; target: TargetFn; axis?: "x" | "y"; to: (p: number, el: Element) => number }`
  - `interface Rect { x: number; y: number; w: number; h: number }`
  - `type AreaFn = (doc: Document) => Rect | null`
  - `interface HighlightCue { kind: "highlight"; at: number; until: number; label: string; area: AreaFn; pad?: number }`
  - `type Cue = ClickCue | ScrollCue | HighlightCue`
  - `resolveTarget(doc: Document, cue: ClickCue | ScrollCue, sceneKey: string): Element`
  - `resolveArea(doc: Document, cue: HighlightCue, sceneKey: string): Rect`
  - `HIGHLIGHT_IN = 0.25`, `HIGHLIGHT_OUT = 0.2`
  - `highlightLook(t: number, cue: HighlightCue): { opacity: number; scale: number } | null`

- [ ] **Step 1: Обновить и дописать тесты**

В `Promo/scripts/film-cues.test.ts`:

Импорт заменить на:

```ts
import {
  CURSOR_LEAD,
  CURSOR_TAIL,
  HIGHLIGHT_IN,
  HIGHLIGHT_OUT,
  cursorPath,
  highlightLook,
  planSettle,
  resolveArea,
  resolveTarget,
  type ClickCue,
  type Cue,
  type HighlightCue,
  type SettlePlan,
} from "../src/film/cues.ts";
```

В `CUES` сигнал прокрутки — `to` вместо `left`:

```ts
  { kind: "scroll", at: 1, until: 3, label: "таблица", target: () => el, to: (p) => p * 100 },
```

В тесте «прокрутка: до начала 0, после конца 1, нулевой участок 1» — `to: () => 0` вместо `left: () => 0`.

В тесте `resolveTarget` приведение `as Cue` → `as ClickCue`:

```ts
    () => resolveTarget(doc, { ...CUES[1], target: () => null } as ClickCue, "audit"),
```

В конец файла добавить:

```ts
test("прокрутка по оси y считается тем же прогрессом", () => {
  const cues: Cue[] = [
    { kind: "scroll", axis: "y", at: 0, until: 2, label: "страница", target: () => el, to: (p) => p * 300 },
  ];
  const p = planSettle(cues, Number.NaN, 1);
  assert.equal(p.scrolls[0].cue.axis, "y");
  assert.ok(near(p.scrolls[0].p, 0.5));
});

test("рамки не попадают ни в клики, ни в прокрутки", () => {
  const cues: Cue[] = [
    ...CUES,
    { kind: "highlight", at: 0, until: 5, label: "строка", area: () => ({ x: 0, y: 0, w: 10, h: 10 }) },
  ];
  const p = planSettle(cues, Number.NaN, 3);
  assert.deepEqual(clickLabels(p), ["вкладка", "тема"]);
  assert.equal(p.scrolls.length, 1);
});

const HL: HighlightCue = {
  kind: "highlight",
  at: 1,
  until: 3,
  label: "строка 26-3",
  area: () => ({ x: 1, y: 2, w: 3, h: 4 }),
};

test("highlightLook: вне участка рамки нет; вход — из 1,06 и прозрачности; выход — угасание", () => {
  assert.equal(highlightLook(0.99, HL), null);
  assert.equal(highlightLook(3.01, HL), null);
  const start = highlightLook(1, HL);
  assert.ok(start);
  assert.equal(start.opacity, 0);
  assert.ok(near(start.scale, 1.06));
  const settled = highlightLook(1 + HIGHLIGHT_IN, HL);
  assert.ok(settled);
  assert.equal(settled.opacity, 1);
  assert.equal(settled.scale, 1);
  const leaving = highlightLook(3 - HIGHLIGHT_OUT / 2, HL);
  assert.ok(leaving);
  assert.ok(near(leaving.opacity, 0.5));
  assert.equal(highlightLook(3, HL)!.opacity, 0);
});

test("resolveArea: найдена — прямоугольник; нет — ошибка со сценой и рамкой", () => {
  assert.deepEqual(resolveArea(doc, HL, "plan"), { x: 1, y: 2, w: 3, h: 4 });
  assert.throws(
    () => resolveArea(doc, { ...HL, area: () => null }, "plan"),
    /сцена «plan»: не найдена область «строка 26-3» \(рамка на 1 с\)/,
  );
});
```

`near` в `leaving` нужен: `(3 − 2.9) / 0.2` в плавающей точке — не ровно 0,5.

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `corepack pnpm --filter promo test:film`
Expected: FAIL — `SyntaxError: The requested module '../src/film/cues.ts' does not provide an export named 'HIGHLIGHT_IN'`.

- [ ] **Step 3: Реализация в `cues.ts`**

Заменить объявления `ScrollCue` и `Cue`:

```ts
/**
 * Прокрутка на участке [at, until]: `to` — позиция по прогрессу 0..1, `axis` —
 * ось (по умолчанию "x", горизонтальная; "y" — вертикальная).
 */
export interface ScrollCue {
  kind: "scroll";
  at: number;
  until: number;
  label: string;
  target: TargetFn;
  axis?: "x" | "y";
  to: (p: number, el: Element) => number;
}

/** Прямоугольник в координатах окна — как у getBoundingClientRect. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Находит область во вложенном документе; null — области нет. */
export type AreaFn = (doc: Document) => Rect | null;

/** Жёлтая рамка вокруг области на участке [at, until]; `pad` — отступ рамки, пиксели окна. */
export interface HighlightCue {
  kind: "highlight";
  at: number;
  until: number;
  label: string;
  area: AreaFn;
  pad?: number;
}

export type Cue = ClickCue | ScrollCue | HighlightCue;
```

`planSettle` не меняется: клики и прокрутки он отбирает по `kind`, рамки в них не попадают.

Сигнатуру `resolveTarget` сузить (у рамки нет `target`):

```ts
export function resolveTarget(doc: Document, cue: ClickCue | ScrollCue, sceneKey: string): Element {
```

После `resolveTarget` добавить:

```ts
/** Область рамки. Не найдена — ошибка с именем сцены и рамки: кадр был бы неверным. */
export function resolveArea(doc: Document, cue: HighlightCue, sceneKey: string): Rect {
  const rect = cue.area(doc);
  if (!rect) {
    throw new Error(
      `[film] сцена «${sceneKey}»: не найдена область «${cue.label}» (рамка на ${cue.at} с)`,
    );
  }
  return rect;
}

/** Рамка входит за HIGHLIGHT_IN с (из масштаба 1,06) и гаснет за HIGHLIGHT_OUT с до `until`. */
export const HIGHLIGHT_IN = 0.25;
export const HIGHLIGHT_OUT = 0.2;

/** Плавность входа рамки; своя копия easeOutExpo — модуль без импортов. */
const easeOut = (x: number): number => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));

/** Вид рамки в момент t: прозрачность и масштаб. Вне [at, until] — null. */
export function highlightLook(t: number, cue: HighlightCue): { opacity: number; scale: number } | null {
  if (t < cue.at || t > cue.until) return null;
  const enter = easeOut(Math.min(1, (t - cue.at) / HIGHLIGHT_IN));
  const leave = Math.min(1, Math.max(0, (cue.until - t) / HIGHLIGHT_OUT));
  return { opacity: enter * leave, scale: 1 + 0.06 * (1 - enter) };
}
```

- [ ] **Step 4: Перевести места вызова на `to` и ось**

`Promo/src/film/screens.ts`, сигнал прокрутки `FULLCAL_SCREEN` — `left:` → `to:`:

```ts
      to: (p, el) => easeInOutCubic(p) * (el.scrollWidth - el.clientWidth),
```

`Promo/src/film/ScreenScene.tsx`, цикл прокруток в `run`:

```ts
      for (const { cue, p } of plan.scrolls) {
        const el = resolveTarget(doc, cue, scene.key);
        if (cue.axis === "y") el.scrollTop = cue.to(p, el);
        else el.scrollLeft = cue.to(p, el);
      }
```

- [ ] **Step 5: Модульные тесты, регрессия, сборка**

Run: `corepack pnpm --filter promo test:film` → Expected: PASS (все тесты обоих файлов).
Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts` → Expected: PASS (прежний фильм не изменился).
Run: `corepack pnpm build:promo` → Expected: сборка зелёная.

- [ ] **Step 6: Commit**

```bash
git add Promo/src/film/cues.ts Promo/scripts/film-cues.test.ts Promo/src/film/screens.ts Promo/src/film/ScreenScene.tsx
git commit -m "feat(promo-film): сигналы — ось прокрутки и рамка-подсветка"
```

---

### Task 2: Сюжет — боли, фразы, список болей

**Files:**
- Create: `Promo/src/film/story.ts`
- Create: `Promo/scripts/film-story.test.ts`
- Modify: `Promo/package.json` (скрипт `test:film`)

**Interfaces:**
- Consumes: `type Lang` из `Promo/src/film/types.ts` (только `import type`).
- Produces (`Promo/src/film/story.ts`):
  - `type PainKey = "files" | "chat" | "deadlines" | "depts"`
  - `interface Pain { key: PainKey; headline: Record<Lang, string>; short: Record<Lang, string>; fix: Record<Lang, string> }`
  - `PAINS: readonly Pain[]` (порядок сюжета), `painOf(key: PainKey): Pain`
  - `PILE_HEADLINE: Record<Lang, string>`
  - `interface ChapterSpan { key: string; at: number; end: number }`
  - `STRIKE_LEAD = 1.2`, `STRIKE_DURATION = 0.4`, `painStrikes(chapters: readonly ChapterSpan[], solves: Readonly<Record<string, PainKey>>, t: number): Record<PainKey, number>`
  - `TRACKER_IN = 0.4`, `TRACKER_OUT = 0.3`, `trackerOpacity(chapters: readonly ChapterSpan[], trackerKeys: readonly string[], t: number): number`

- [ ] **Step 1: Подключить файл к `test:film`**

`Promo/package.json`:

```json
    "test:film": "node --test scripts/film-timeline.test.ts scripts/film-cues.test.ts scripts/film-story.test.ts",
```

- [ ] **Step 2: Написать тесты `Promo/scripts/film-story.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PAINS,
  PILE_HEADLINE,
  STRIKE_DURATION,
  STRIKE_LEAD,
  TRACKER_IN,
  TRACKER_OUT,
  painOf,
  painStrikes,
  trackerOpacity,
} from "../src/film/story.ts";

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

test("четыре боли в порядке сюжета, у каждой все фразы на обоих языках", () => {
  assert.deepEqual(
    PAINS.map((p) => p.key),
    ["files", "chat", "deadlines", "depts"],
  );
  for (const pain of PAINS) {
    for (const field of ["headline", "short", "fix"] as const) {
      for (const lang of ["ru", "uz"] as const) {
        assert.ok(pain[field][lang].trim().length > 0, `${pain.key}.${field}.${lang}`);
      }
    }
  }
  assert.ok(PILE_HEADLINE.ru.trim() && PILE_HEADLINE.uz.trim());
});

test("в титрах нет внутренних сокращений КД и КМ", () => {
  // \b в JS считает кириллицу «не словом», поэтому граница — явный класс букв.
  const abbr = /(^|[^А-Яа-яЁё])(КД|КМ)([^А-Яа-яЁё]|$)/;
  const all = [
    ...PAINS.flatMap((p) => [p.headline, p.short, p.fix]).flatMap((r) => [r.ru, r.uz]),
    PILE_HEADLINE.ru,
    PILE_HEADLINE.uz,
  ];
  for (const s of all) assert.doesNotMatch(s, abbr, s);
  assert.match("Решение КД", abbr); // контроль: сокращение ловится
});

test("painOf: боль по ключу; неизвестный ключ — ошибка", () => {
  assert.equal(painOf("chat").key, "chat");
  assert.throws(() => painOf("nope" as never), /нет боли «nope»/);
});

const CH = [
  { key: "plan", at: 16, end: 19 },
  { key: "fullcal", at: 19, end: 23 },
  { key: "approval", at: 23, end: 29 },
];
const SOLVES = { fullcal: "files", approval: "chat" } as const;

test("painStrikes: 0 до начала, линейно за STRIKE_DURATION, дальше 1 до конца фильма", () => {
  const from = 23 - STRIKE_LEAD;
  assert.equal(painStrikes(CH, SOLVES, from).files, 0);
  assert.ok(near(painStrikes(CH, SOLVES, from + STRIKE_DURATION / 2).files, 0.5));
  assert.equal(painStrikes(CH, SOLVES, from + STRIKE_DURATION).files, 1);
  assert.equal(painStrikes(CH, SOLVES, 100).files, 1);
  assert.equal(painStrikes(CH, SOLVES, 100).chat, 1);
  assert.equal(painStrikes(CH, SOLVES, 20).chat, 0);
});

test("painStrikes: боль, которую не закрывает ни одна сцена, не перечёркивается", () => {
  const s = painStrikes(CH, SOLVES, 100);
  assert.equal(s.deadlines, 0);
  assert.equal(s.depts, 0);
});

test("trackerOpacity: входит с началом первой сцены, гаснет к концу последней, вне — 0", () => {
  const keys = ["plan", "fullcal", "approval"];
  assert.equal(trackerOpacity(CH, keys, 15.9), 0);
  assert.equal(trackerOpacity(CH, keys, 16), 0);
  assert.ok(near(trackerOpacity(CH, keys, 16 + TRACKER_IN / 2), 0.5));
  assert.equal(trackerOpacity(CH, keys, 20), 1);
  assert.ok(near(trackerOpacity(CH, keys, 29 - TRACKER_OUT / 2), 0.5));
  assert.equal(trackerOpacity(CH, keys, 29), 0);
  assert.equal(trackerOpacity(CH, [], 20), 0);
});
```

- [ ] **Step 3: Убедиться, что тесты падают**

Run: `corepack pnpm --filter promo test:film`
Expected: FAIL — `Cannot find module …\src\film\story.ts`.

- [ ] **Step 4: Реализация `Promo/src/film/story.ts`**

```ts
/**
 * Сюжет второй версии фильма (спецификация v2 §4.1): четыре боли бизнеса и их
 * фразы — единственный источник текста для первого акта, списка болей поверх
 * второго акта и итога. Здесь же — чистые функции списка болей.
 *
 * Модуль запускает `node --test` (scripts/film-story.test.ts): только «стираемый»
 * TypeScript, из импортов — только `import type` (Node его вырезает).
 */
import type { Lang } from "./types";

export type PainKey = "files" | "chat" | "deadlines" | "depts";

export interface Pain {
  key: PainKey;
  /** Заголовок сцены первого акта. */
  headline: Record<Lang, string>;
  /** Строка списка болей поверх второго акта и в итоге. */
  short: Record<Lang, string>;
  /** Гарантия продукта в итоге — и подпись сцены второго акта, которая её показывает. */
  fix: Record<Lang, string>;
}

/**
 * Порядок — порядок сюжета. В титрах нет внутренних сокращений (КД, КМ):
 * зритель без контекста Texnomart их не знает. Узбекский — черновой перевод,
 * нужна проверка носителем.
 */
export const PAINS: readonly Pain[] = [
  {
    key: "files",
    headline: { ru: "План акций — в десяти файлах.", uz: "Aksiyalar rejasi — o'nta faylda." },
    short: { ru: "План в десяти файлах", uz: "Reja o'nta faylda" },
    fix: { ru: "Один план. Одна версия.", uz: "Bitta reja. Bitta versiya." },
  },
  {
    key: "chat",
    headline: { ru: "Кто согласовал? Никто не знает.", uz: "Kim tasdiqladi? Hech kim bilmaydi." },
    short: { ru: "Кто согласовал — неизвестно", uz: "Kim tasdiqlagani noma'lum" },
    fix: { ru: "Каждая правка — с решением директора", uz: "Har bir o'zgarish — direktor qarori bilan" },
  },
  {
    key: "deadlines",
    headline: { ru: "Сроки горят. Спросить не с кого.", uz: "Muddatlar yonmoqda. So'raydigan odam yo'q." },
    short: { ru: "Сроки горят", uz: "Muddatlar yonmoqda" },
    fix: { ru: "У каждого срока — ответственный", uz: "Har bir muddatning mas'uli bor" },
  },
  {
    key: "depts",
    headline: { ru: "Маркетинг узнаёт последним.", uz: "Marketing oxirgi bo'lib biladi." },
    short: { ru: "Маркетинг узнаёт последним", uz: "Marketing oxirgi bo'lib biladi" },
    fix: { ru: "Маркетинг видит изменения сразу", uz: "Marketing o'zgarishlarni darhol ko'radi" },
  },
];

export function painOf(key: PainKey): Pain {
  const pain = PAINS.find((p) => p.key === key);
  if (!pain) throw new Error(`[film] нет боли «${key}»`);
  return pain;
}

/** Заголовок кульминации первого акта (сцена-куча). */
export const PILE_HEADLINE: Record<Lang, string> = {
  ru: "И так — каждую акцию.",
  uz: "Va shunday — har bir aksiyada.",
};

export interface ChapterSpan {
  key: string;
  at: number;
  end: number;
}

/** Боль перечёркивается за STRIKE_LEAD с до конца своей сцены — после её главного действия. */
export const STRIKE_LEAD = 1.2;
export const STRIKE_DURATION = 0.4;

/** Прогресс перечёркивания каждой боли 0..1 в момент t. `solves` — ключ сцены → боль, которую она закрывает. */
export function painStrikes(
  chapters: readonly ChapterSpan[],
  solves: Readonly<Record<string, PainKey>>,
  t: number,
): Record<PainKey, number> {
  const out: Record<PainKey, number> = { files: 0, chat: 0, deadlines: 0, depts: 0 };
  for (const c of chapters) {
    const pain = solves[c.key];
    if (!pain) continue;
    const p = (t - (c.end - STRIKE_LEAD)) / STRIKE_DURATION;
    out[pain] = Math.max(out[pain], p <= 0 ? 0 : p >= 1 ? 1 : p);
  }
  return out;
}

/** Список болей въезжает за TRACKER_IN с и гаснет за TRACKER_OUT с. */
export const TRACKER_IN = 0.4;
export const TRACKER_OUT = 0.3;

/**
 * Прозрачность списка болей: от начала первой сцены из `trackerKeys` до конца
 * последней (сцены второго акта идут подряд); вне этого участка — 0.
 */
export function trackerOpacity(
  chapters: readonly ChapterSpan[],
  trackerKeys: readonly string[],
  t: number,
): number {
  const spans = chapters.filter((c) => trackerKeys.includes(c.key));
  if (spans.length === 0) return 0;
  const from = spans[0].at;
  const to = spans[spans.length - 1].end;
  if (t <= from || t >= to) return 0;
  return Math.min(1, (t - from) / TRACKER_IN, (to - t) / TRACKER_OUT);
}
```

- [ ] **Step 5: Тесты проходят**

Run: `corepack pnpm --filter promo test:film`
Expected: PASS — все тесты трёх файлов.

- [ ] **Step 6: Commit**

```bash
git add Promo/src/film/story.ts Promo/scripts/film-story.test.ts Promo/package.json
git commit -m "feat(promo-film): сюжет версии 2 — боли, фразы RU/UZ, список болей"
```

---

### Task 3: Первый акт, итог, список болей — сценарий переходит на версию 2

После задачи фильм — 13 сцен, 48 с. Первый акт, логотип, итог и финал готовы полностью. Второй акт — пять живых экранов. `plan` и `fullcal` уже с данными 26-3, но у `plan` пока без прокрутки и рамки. `approval`, `deadlines` и `report` пока только заготовки: экран и камера без сигналов, кроме вкладки аудита. Эти сцены доводят Tasks 4–7.

**Files:**
- Create: `Promo/src/film/hero.ts`
- Create: `Promo/src/film/PainTracker.tsx`
- Create: `Promo/src/film/fragments/before/BeforeFrame.tsx`
- Create: `Promo/src/film/fragments/before/FilesBefore.tsx`
- Create: `Promo/src/film/fragments/before/ChatBefore.tsx`
- Create: `Promo/src/film/fragments/before/DeadlinesBefore.tsx`
- Create: `Promo/src/film/fragments/before/DeptsBefore.tsx`
- Create: `Promo/src/film/fragments/before/PileBefore.tsx`
- Create: `Promo/src/film/fragments/RecapFragment.tsx`
- Modify: `Promo/src/film/palette.ts`, `Promo/src/film/types.ts`, `Promo/src/film/ScreenScene.tsx` (`frameUrl`), `Promo/src/film/FilmPage.tsx`, `Promo/src/film/screens.ts`, `Promo/src/film/scenes.ts`, `Promo/scripts/record-film.mjs` (шапка), `Promo/e2e/film.spec.ts`
- Delete: `Promo/src/film/fragments/HookFragment.tsx`, `Promo/src/film/fragments/GridFragment.tsx`, `Promo/src/film/fragments/ChangeFragment.tsx`

**Interfaces:**
- Consumes: `PAINS`, `painOf`, `PILE_HEADLINE`, `painStrikes`, `trackerOpacity`, `type PainKey` (Task 2); `Rect`, `TargetFn` (Task 1); из `Promo/src/lib/promo-mock-data.ts` — `CAMPAIGNS`, `CATEGORY_MANAGERS`, `NOMENCLATURE`, `PROMO_LINES`, `formatPromoNo`, `getReportChangeSet`.
- Produces:
  - `Promo/src/film/hero.ts`: `HERO: { campaignId: string; promoNo: string; kmId: string; kmName: string; productName: string; priceWas: string; priceNow: string }` (значения по посеву: `"PR-2026-003"`, `"26-3"`, `"km-4"`, `"Рашидова Дилноза"`, `"Кофемашина De'Longhi Magnifica"`, `"4 990 000 сум"`, `"4 440 000 сум"`)
  - `Promo/src/film/palette.ts`: `INK` (цвета иллюстраций)
  - `Promo/src/film/types.ts`: `ScreenSpec.query?: Record<string, string>`; `SceneBase.tracker?: boolean`; `SceneBase.solves?: PainKey`
  - `Promo/src/film/fragments/before/BeforeFrame.tsx`: `ART = { w: 1600, h: 620 }`, `BeforeHeadline({ text, t })`, `BeforeFrame({ t, headline, children })`
  - Иллюстрации `FilesIllustration`, `ChatIllustration`, `DeadlinesIllustration`, `DeptsIllustration` (`{ t: number }`) и сцены `FilesBefore`, `ChatBefore`, `DeadlinesBefore`, `DeptsBefore`, `PileBefore` (`SceneProps`); `PILE_CUT = 1.75`
  - `Promo/src/film/screens.ts`: `h1`, `byText(root: ParentNode, text: string): Element | null`, `norm(s)`, `WHOLE`, `PLAN_SCREEN`, `FULLCAL_SCREEN`, `APPROVAL_SCREEN`, `DEADLINES_SCREEN`, `REPORT_SCREEN`
  - Разметка для тестов: `[data-film="pain-tracker"]`, у строк списка — `data-pain="<ключ>"` и `data-struck="true|false"`; у строк итога — `data-recap="<ключ>"`

- [ ] **Step 1: Переписать e2e под новый сценарий**

В `Promo/e2e/film.spec.ts` блок `test.describe('режим кадра', …)`, тип `Capture`, `declare global` и помощники (`openFilm`, `seek`, `chapters`, `shotAt`, `same`) не трогать. Три блока `фильм: запись`, `фильм: сцены-экраны` и `фильм: сценарий` заменить целиком на:

```ts
const at = async (page: Page, key: string) => (await chapters(page)).find((c) => c.key === key)!;

test.describe('фильм: запись', () => {
  test('__capture: главы подряд от «before-files», длительность — конец последней', async ({ page }) => {
    await openFilm(page);
    const cap = await page.evaluate(() => ({
      duration: window.__capture!.duration,
      chapters: window.__capture!.chapters,
    }));
    expect(cap.chapters[0]).toMatchObject({ key: 'before-files', at: 0 });
    for (let i = 1; i < cap.chapters.length; i++) {
      expect(cap.chapters[i].at).toBe(cap.chapters[i - 1].end);
    }
    expect(cap.chapters.at(-1)!.end).toBe(cap.duration);
  });

  test('кадр фрагмента не зависит от пути перемотки', async ({ page }) => {
    await openFilm(page);
    const a = await shotAt(page, 1.2);
    await seek(page, 4);
    await seek(page, 0.2);
    const b = await shotAt(page, 1.2);
    expect(same(a, b)).toBe(true);
    const c = await shotAt(page, 1.5);
    expect(same(a, c)).toBe(false); // контроль: кадр меняется во времени
  });

  test('фильм всегда светлый, даже при тёмной теме вкладки', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('promo:pref-theme', 'dark'));
    await page.goto('login');
    await expect(page.locator('html')).toHaveClass(/\bdark\b/); // контроль: тема вкладки тёмная
    await openFilm(page);
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  });

  test('без capture фильм играет сам и не отдаёт __capture', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('embed/film');
    await expect(page.getByText('План акций — в десяти файлах.')).toBeVisible();
    expect(await page.evaluate(() => window.__capture)).toBeUndefined();
    await expect(page.getByText('Кто согласовал? Никто не знает.')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('фильм: сценарий', () => {
  test.setTimeout(120_000);

  test('48 с, тринадцать глав по порядку', async ({ page }) => {
    await openFilm(page);
    const cap = await page.evaluate(() => ({
      duration: window.__capture!.duration,
      keys: window.__capture!.chapters.map((c) => c.key),
    }));
    expect(cap).toEqual({
      duration: 48,
      keys: [
        'before-files', 'before-chat', 'before-deadlines', 'before-depts', 'before-pile',
        'logo', 'plan', 'fullcal', 'approval', 'deadlines', 'report', 'recap', 'final',
      ],
    });
  });

  test('первый акт: боли по очереди, цена на макете — из посева 26-3', async ({ page }) => {
    await openFilm(page);
    await seek(page, (await at(page, 'before-chat')).at + 2.5);
    await expect(page.getByText('Кто согласовал? Никто не знает.')).toBeVisible();
    await expect(page.getByText('А кто согласовал? В макете 16%')).toBeVisible();
    await seek(page, (await at(page, 'before-depts')).at + 2.5);
    await expect(page.getByText('Маркетинг узнаёт последним.')).toBeVisible();
    await expect(page.getByText('4 990 000 сум')).toBeVisible();
    await expect(page.getByText('4 440 000 сум')).toBeVisible();
    await expect(page.getByText('Цена устарела')).toBeVisible();
  });

  test('куча обрывается в чёрное на последний удар', async ({ page }) => {
    await openFilm(page);
    const pile = await at(page, 'before-pile');
    await seek(page, pile.at + 1);
    await expect(page.getByText('И так — каждую акцию.')).toBeVisible();
    await expect(page.getByText('Цена устарела')).toBeVisible(); // контроль: иллюстрации в куче
    await seek(page, pile.at + 1.9);
    await expect(page.getByText('И так — каждую акцию.')).toHaveCount(0);
    await expect(page.getByText('Цена устарела')).toHaveCount(0);
  });

  test('список болей: пуст в начале второго акта, перечёркивается по сценам, гаснет к итогу', async ({ page }) => {
    await openFilm(page);
    const tracker = page.locator('[data-film="pain-tracker"]');
    const struck = tracker.locator('[data-struck="true"]');
    await seek(page, (await at(page, 'before-pile')).at + 1);
    await expect(tracker).toHaveCount(0);
    await seek(page, (await at(page, 'plan')).at + 1);
    await expect(tracker.locator('[data-pain]')).toHaveCount(4);
    await expect(struck).toHaveCount(0);
    await seek(page, (await at(page, 'approval')).at + 0.5);
    await expect(struck).toHaveCount(1);
    await expect(tracker.locator('[data-pain="files"]')).toHaveAttribute('data-struck', 'true');
    await seek(page, (await at(page, 'report')).at + 5.5);
    await expect(struck).toHaveCount(4);
    await seek(page, (await at(page, 'recap')).at + 1);
    await expect(tracker).toHaveCount(0);
  });

  test('итог: гарантии на месте болей', async ({ page }) => {
    await openFilm(page);
    const recap = await at(page, 'recap');
    await seek(page, recap.at + 0.4);
    await expect(page.getByText('План в десяти файлах')).toBeVisible(); // контроль: сначала — боли
    await seek(page, recap.at + 3.5);
    for (const fix of [
      'Один план. Одна версия.',
      'Каждая правка — с решением директора',
      'У каждого срока — ответственный',
      'Маркетинг видит изменения сразу',
    ]) {
      await expect(page.getByText(fix)).toBeVisible();
    }
    await expect(page.getByText('План в десяти файлах')).toHaveCount(0);
  });

  test('фрагменты детерминированы', async ({ page }) => {
    await openFilm(page);
    const depts = await at(page, 'before-depts');
    const recap = await at(page, 'recap');
    const a = await shotAt(page, depts.at + 2);
    await seek(page, recap.at + 2);
    const b = await shotAt(page, depts.at + 2);
    expect(same(a, b)).toBe(true);
  });

  test('узбекская версия: переводятся титры, интерфейс и иллюстрации — русские', async ({ page }) => {
    await openFilm(page, '&lang=uz');
    await seek(page, (await at(page, 'before-files')).at + 1);
    await expect(page.getByText("Aksiyalar rejasi — o'nta faylda.")).toBeVisible();
    await expect(page.getByText('План_акций_октябрь.xlsx')).toBeVisible();
    await seek(page, (await at(page, 'plan')).at + 1.5);
    await expect(page.getByText('Bitta reja. Bitta versiya.')).toBeVisible();
    await expect(page.locator('[data-film="pain-tracker"]')).toContainText("Reja o'nta faylda");
  });
});

test.describe('фильм: сцены-экраны', () => {
  test.setTimeout(120_000);

  test('plan: живой экран, кадр детерминирован, хранилища вкладки чистые', async ({ page }) => {
    await openFilm(page);
    const plan = await at(page, 'plan');
    const a = await shotAt(page, plan.at + 2.5);
    await seek(page, plan.at + 2.9);
    await seek(page, plan.at + 0.5);
    const b = await shotAt(page, plan.at + 2.5);
    expect(same(a, b)).toBe(true);
    const c = await shotAt(page, plan.at + 1.5);
    expect(same(a, c)).toBe(false); // контроль: камера движется
    await expect(
      page.frameLocator('iframe[title="plan"]').getByRole('heading', { name: 'Краткий промо-календарь' }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => [sessionStorage.getItem('auth'), sessionStorage.getItem('promo:current-role')]),
    ).toEqual([null, null]);
    // Контроль: внутри кадра вход есть — в его памяти.
    const inner = page.frames().find((f) => f.url().includes('film-frame=1'))!;
    expect(await inner.evaluate(() => sessionStorage.getItem('auth'))).toBe('true');
  });

  test('fullcal: только акция 26-3, панорама прокручивает таблицу, кадр детерминирован', async ({ page }) => {
    await openFilm(page);
    const fc = await at(page, 'fullcal');
    const a = await shotAt(page, fc.at + 3);
    await seek(page, fc.at + 3.8);
    await seek(page, fc.at + 1.5);
    const b = await shotAt(page, fc.at + 3);
    expect(same(a, b)).toBe(true);
    await expect(page.frameLocator('iframe[title="fullcal"]').getByText(/Показано: 1 промо/)).toBeVisible();
    const frame = page.frames().find((f) => f.url().includes('/full-calendar?'))!;
    expect(frame.url()).toContain('promo=PR-2026-003');
    const maxScroll = () =>
      frame.evaluate(() =>
        Math.max(...[...document.querySelectorAll('div.overflow-x-auto')].map((el) => el.scrollLeft)),
      );
    expect(await maxScroll()).toBeGreaterThan(0);
    await seek(page, fc.at + 0.5); // до начала прокрутки — таблица в начале
    expect(await maxScroll()).toBe(0);
  });
});
```

- [ ] **Step 2: Убедиться, что новые тесты падают**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts`
Expected: FAIL — среди прочего «48 с, тринадцать глав» (сейчас 32 и `hook`…), тексты первого акта не найдены. Блок «режим кадра» проходит.

- [ ] **Step 3: Цвета иллюстраций — `Promo/src/film/palette.ts`**

В конец файла:

```ts
/** Цвета иллюстраций первого акта — токены дизайн-системы (styles-config.md). */
export const INK = {
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray900: "#111827",
  red: "#EF4444",
  red50: "#FEF2F2",
  amber100: "#FEF3C7",
  blue50: "#EFF6FF",
} as const;
```

- [ ] **Step 4: Акция-герой — `Promo/src/film/hero.ts`**

```ts
import {
  CAMPAIGNS,
  CATEGORY_MANAGERS,
  NOMENCLATURE,
  PROMO_LINES,
  formatPromoNo,
  getReportChangeSet,
} from "../lib/promo-mock-data";

/**
 * Акция-герой второго акта (спецификация v2 §1): 26-3 «1+1 на мелкую бытовую
 * технику», позиция L-0015 — кофемашина De'Longhi у менеджера km-4. Цена
 * «было → стало» — из набора изменений отчёта 26-3; тот же случай показывает
 * рекламный макет первого акта. Фильм ничего не выдумывает: изменится посев —
 * ошибка на старте, а не неверный кадр.
 */
function pickHero() {
  const campaign = CAMPAIGNS.find((c) => c.id === "PR-2026-003");
  const line = PROMO_LINES.find((l) => l.id === "L-0015");
  const item = line && NOMENCLATURE.find((n) => n.id === line.nomenclatureId);
  const km = line && CATEGORY_MANAGERS.find((k) => k.id === line.kmId);
  const price = getReportChangeSet("PR-2026-003").changedCells.find(
    (c) => c.lineId === "L-0015" && c.fieldId === "newPrice",
  );
  if (!campaign || !line || !item || !km || !price) {
    throw new Error(
      "[film] герой: в посеве нет акции PR-2026-003, строки L-0015, её менеджера или изменения её цены в отчёте",
    );
  }
  return {
    campaignId: campaign.id,
    promoNo: formatPromoNo(campaign.id),
    kmId: line.kmId,
    kmName: km.name,
    productName: item.name,
    priceWas: price.prevValue,
    priceNow: price.newValue,
  };
}

export const HERO = pickHero();
```

- [ ] **Step 5: Типы — `Promo/src/film/types.ts`**

К импортам:

```ts
import type { PainKey } from "./story";
```

`SceneBase`:

```ts
interface SceneBase {
  key: string;
  duration: number;
  /** Подпись внизу слева; нет — сцена без подписи. */
  caption?: Record<Lang, string>;
  /** Показывать поверх сцены список болей (второй акт). */
  tracker?: boolean;
  /** Боль, которую закрывает сцена: перечёркивается в её конце (story.painStrikes). */
  solves?: PainKey;
}
```

В `ScreenSpec` после `theme`:

```ts
  /** Дополнительные параметры адреса окна, например { promo: "PR-2026-003" }. */
  query?: Record<string, string>;
```

- [ ] **Step 6: Параметры адреса — `Promo/src/film/ScreenScene.tsx`**

В `frameUrl`:

```ts
function frameUrl(scene: ScreenSceneDef): string {
  const { path, role, user, theme, query } = scene.screen;
  const params = new URLSearchParams({ "film-frame": "1", "film-path": path, role, user, theme, ...query });
  return `${import.meta.env.BASE_URL}?${params}`;
}
```

Комментарий над функцией дополнить строкой: «Режим кадра переносит всю строку запроса в адрес экрана, поэтому `query` (например, `promo`) экран читает как обычно.»

- [ ] **Step 7: Кадр первого акта — `Promo/src/film/fragments/before/BeforeFrame.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import { FILM } from "../../palette";
import { easeOutExpo, progress } from "../../timeline";

/** Область иллюстрации: её рисуют и сцена боли, и сцена-куча (там — уменьшенной). */
export const ART = { w: 1600, h: 620 } as const;

/** Крупный заголовок первого акта: въезжает снизу, под ним прочерчивается жёлтая линия. */
export function BeforeHeadline({ text, t }: { text: string; t: number }) {
  const enter = progress(t, 0, 0.35, easeOutExpo);
  const underline = progress(t, 0.1, 0.6, easeOutExpo);
  return (
    <div
      style={{
        position: "absolute",
        left: 160,
        top: 100,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 40}px)`,
      }}
    >
      <p
        style={{
          margin: 0,
          maxWidth: 1600,
          color: FILM.text,
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: "-0.035em",
          lineHeight: 1.04,
        }}
      >
        {text}
      </p>
      <div style={{ marginTop: 28, height: 8, width: 200 * underline, borderRadius: 4, background: FILM.accent }} />
    </div>
  );
}

/** Сцена боли: заголовок сверху, иллюстрация — в нижней части кадра (420…1040 px). */
export function BeforeFrame({ t, headline, children }: { t: number; headline: string; children: ReactNode }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <BeforeHeadline text={headline} t={t} />
      <div style={{ position: "absolute", left: 160, top: 420, width: ART.w, height: ART.h }}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 8: Файлы — `Promo/src/film/fragments/before/FilesBefore.tsx`**

```tsx
"use client";

import { FileSpreadsheet } from "lucide-react";
import { FILM, INK } from "../../palette";
import { painOf } from "../../story";
import { easeOutExpo, progress } from "../../timeline";
import type { SceneProps } from "../../types";
import { BeforeFrame } from "./BeforeFrame";

/** Имена файлов — «интерфейс», по-русски в обеих версиях. */
const FILES = [
  "План_акций_октябрь.xlsx",
  "План_акций_октябрь_v2.xlsx",
  "План_акций_октябрь_финал.xlsx",
  "План_акций_октябрь_финал_ИСПР.xlsx",
  "План_акций_октябрь_финал_ТОЧНО.xlsx",
];
/** Новое окно — каждые 0,42 с: чуть чаще удара, нарастание. */
const STEP = 0.42;

/** Сетка таблицы; часть ячеек подсвечена — правки, которые расходятся между копиями. */
function SheetGrid({ seed }: { seed: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gridAutoRows: 40, padding: 12 }}>
      {Array.from({ length: 35 }, (_, k) => (
        <div
          key={k}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            borderRight: `1px solid ${INK.gray200}`,
            borderBottom: `1px solid ${INK.gray200}`,
            background: (k * 7 + seed * 3) % 11 === 0 ? INK.amber100 : "transparent",
          }}
        >
          <span
            style={{
              height: 8,
              width: `${40 + ((k * 13 + seed) % 5) * 10}%`,
              borderRadius: 4,
              background: INK.gray200,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/** Окна-таблицы множатся каскадом; у последнего — «Изменён другим пользователем». */
export function FilesIllustration({ t }: { t: number }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {FILES.map((name, i) => {
        const p = progress(t, i * STEP, i * STEP + 0.3, easeOutExpo);
        if (p <= 0) return null;
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: 120 + i * 150,
              top: i * 48,
              width: 640,
              height: 380,
              overflow: "hidden",
              borderRadius: 12,
              background: FILM.card,
              boxShadow: FILM.shadow,
              opacity: p,
              transform: `translateY(${(1 - p) * 60}px) rotate(${-4 + i * 2}deg)`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 44,
                padding: "0 16px",
                background: INK.gray100,
                borderBottom: `1px solid ${INK.gray200}`,
              }}
            >
              <FileSpreadsheet size={20} color={INK.gray500} />
              <span style={{ fontSize: 17, fontWeight: 600, color: INK.gray900, whiteSpace: "nowrap" }}>{name}</span>
            </div>
            <SheetGrid seed={i} />
            {i === FILES.length - 1 && (
              <span
                style={{
                  position: "absolute",
                  right: 16,
                  bottom: 16,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: INK.red50,
                  color: INK.red,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Изменён другим пользователем
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FilesBefore({ t, lang }: SceneProps) {
  return (
    <BeforeFrame t={t} headline={painOf("files").headline[lang]}>
      <FilesIllustration t={t} />
    </BeforeFrame>
  );
}
```

- [ ] **Step 9: Переписка — `Promo/src/film/fragments/before/ChatBefore.tsx`**

```tsx
"use client";

import { MessageCircle } from "lucide-react";
import { FILM, INK } from "../../palette";
import { painOf } from "../../story";
import { easeOutExpo, progress } from "../../timeline";
import type { SceneProps } from "../../types";
import { BeforeFrame } from "./BeforeFrame";

/**
 * Переписка — «интерфейс», по-русски в обеих версиях; подписи — роли, не имена.
 * 16% → 18% — та же правка De'Longhi, что директор согласует во втором акте.
 */
const MESSAGES = [
  { at: 0.2, left: true, who: "Менеджер категории", text: "Скидку 18% на кофемашину согласовали?" },
  { at: 0.9, left: false, who: "Старший менеджер", text: "Вроде да, директор говорил" },
  { at: 1.6, left: true, who: "Маркетинг", text: "А кто согласовал? В макете 16%" },
] as const;
/** Ответа нет — висит индикатор набора. */
const TYPING_AT = 2.2;

function TypingDots({ t }: { t: number }) {
  return (
    <div
      style={{
        alignSelf: "flex-start",
        display: "flex",
        gap: 8,
        padding: "18px 22px",
        borderRadius: 16,
        background: INK.gray100,
      }}
    >
      {[0, 1, 2].map((k) => (
        <span
          key={k}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: INK.gray400,
            opacity: 0.35 + 0.65 * Math.max(0, Math.sin((t * 2 - k * 0.25) * Math.PI)),
          }}
        />
      ))}
    </div>
  );
}

export function ChatIllustration({ t }: { t: number }) {
  const card = progress(t, 0, 0.3, easeOutExpo);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          left: 260,
          top: 0,
          width: 1080,
          height: 600,
          overflow: "hidden",
          borderRadius: 16,
          background: FILM.card,
          boxShadow: FILM.shadow,
          opacity: card,
          transform: `translateY(${(1 - card) * 40}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            height: 64,
            padding: "0 24px",
            borderBottom: `1px solid ${INK.gray200}`,
          }}
        >
          <MessageCircle size={24} color={INK.gray500} />
          <span style={{ fontSize: 20, fontWeight: 600, color: INK.gray900 }}>Промо — октябрь</span>
          <span style={{ fontSize: 16, color: INK.gray500 }}>14 участников</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: 28 }}>
          {MESSAGES.map((m) => {
            const p = progress(t, m.at, m.at + 0.3, easeOutExpo);
            if (p <= 0) return null;
            return (
              <div
                key={m.at}
                style={{
                  alignSelf: m.left ? "flex-start" : "flex-end",
                  maxWidth: 640,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 24}px)`,
                }}
              >
                <div
                  style={{ marginBottom: 6, fontSize: 15, color: INK.gray500, textAlign: m.left ? "left" : "right" }}
                >
                  {m.who}
                </div>
                <div
                  style={{
                    padding: "14px 20px",
                    borderRadius: 16,
                    fontSize: 24,
                    lineHeight: 1.3,
                    color: INK.gray900,
                    background: m.left ? INK.gray100 : INK.blue50,
                  }}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
          {t >= TYPING_AT && <TypingDots t={t - TYPING_AT} />}
        </div>
      </div>
    </div>
  );
}

export function ChatBefore({ t, lang }: SceneProps) {
  return (
    <BeforeFrame t={t} headline={painOf("chat").headline[lang]}>
      <ChatIllustration t={t} />
    </BeforeFrame>
  );
}
```

- [ ] **Step 10: Сроки — `Promo/src/film/fragments/before/DeadlinesBefore.tsx`**

```tsx
"use client";

import { Clock } from "lucide-react";
import { FILM, INK } from "../../palette";
import { painOf } from "../../story";
import { easeOutBack, easeOutExpo, progress } from "../../timeline";
import type { SceneProps } from "../../types";
import { BeforeFrame } from "./BeforeFrame";

/** Задачи краснеют по ударам; ответственного нет ни у одной. */
const TASKS = [
  { at: 0.8, text: "Данные менеджеров — не заполнены" },
  { at: 1.3, text: "Согласование цен — ждёт 6 дней" },
  { at: 1.8, text: "Отчёт отделам — не отправлен" },
] as const;

export function DeadlinesIllustration({ t }: { t: number }) {
  const card = progress(t, 0, 0.3, easeOutExpo);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          left: 260,
          top: 0,
          width: 1080,
          height: 520,
          overflow: "hidden",
          borderRadius: 16,
          background: FILM.card,
          boxShadow: FILM.shadow,
          opacity: card,
          transform: `translateY(${(1 - card) * 40}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            height: 120,
            padding: "0 32px",
            borderBottom: `1px solid ${INK.gray200}`,
          }}
        >
          <Clock size={40} color={INK.red} />
          <span style={{ fontSize: 30, fontWeight: 600, color: INK.gray900 }}>Старт акции через</span>
          <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: "-0.02em", color: INK.red }}>3 дня</span>
        </div>
        {TASKS.map((task) => {
          const late = t >= task.at;
          const pop = progress(t, task.at, task.at + 0.25, easeOutBack);
          return (
            <div
              key={task.text}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 250px 190px",
                alignItems: "center",
                height: 130,
                padding: "0 32px",
                borderBottom: `1px solid ${INK.gray200}`,
                background: late ? INK.red50 : "transparent",
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 600, color: INK.gray900 }}>{task.text}</span>
              <span style={{ fontSize: 22, color: INK.gray500 }}>Ответственный: —</span>
              <span
                style={{
                  justifySelf: "end",
                  padding: "8px 18px",
                  borderRadius: 999,
                  fontSize: 22,
                  fontWeight: 600,
                  color: late ? "#FFFFFF" : INK.gray500,
                  background: late ? INK.red : INK.gray100,
                  transform: `scale(${late ? 0.85 + 0.15 * pop : 1})`,
                }}
              >
                {late ? "Просрочено" : "В работе"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DeadlinesBefore({ t, lang }: SceneProps) {
  return (
    <BeforeFrame t={t} headline={painOf("deadlines").headline[lang]}>
      <DeadlinesIllustration t={t} />
    </BeforeFrame>
  );
}
```

- [ ] **Step 11: Отделы — `Promo/src/film/fragments/before/DeptsBefore.tsx`**

```tsx
"use client";

import { Coffee } from "lucide-react";
import { HERO } from "../../hero";
import { FILM, INK } from "../../palette";
import { painOf } from "../../story";
import { easeOutBack, easeOutExpo, progress } from "../../timeline";
import type { SceneProps } from "../../types";
import { BeforeFrame } from "./BeforeFrame";

/**
 * Рекламный макет со старой ценой De'Longhi, штамп «Цена устарела», сбоку — цена
 * на кассе. Цены — из отчёта 26-3 (HERO): второй акт показывает, как это
 * изменение доходит до маркетинга.
 */
export function DeptsIllustration({ t }: { t: number }) {
  const card = progress(t, 0, 0.3, easeOutExpo);
  const stamp = progress(t, 0.9, 1.2, easeOutBack);
  const till = progress(t, 1.5, 1.85, easeOutExpo);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 0,
          display: "flex",
          gap: 40,
          width: 980,
          height: 560,
          padding: 40,
          boxSizing: "border-box",
          borderRadius: 16,
          background: FILM.card,
          boxShadow: FILM.shadow,
          opacity: card,
          transform: `translateY(${(1 - card) * 40}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            flex: "none",
            alignItems: "center",
            justifyContent: "center",
            width: 380,
            borderRadius: 12,
            background: INK.gray100,
          }}
        >
          <Coffee size={140} strokeWidth={1.5} color={INK.gray400} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
          <span
            style={{
              alignSelf: "flex-start",
              padding: "6px 14px",
              border: `2px solid ${FILM.accent}`,
              borderRadius: 8,
              fontSize: 20,
              fontWeight: 700,
              color: INK.gray900,
            }}
          >
            Акция 1+1
          </span>
          <span style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.15, color: INK.gray900 }}>{HERO.productName}</span>
          <span style={{ fontSize: 20, color: INK.gray500 }}>Цена по акции</span>
          <span style={{ fontSize: 64, fontWeight: 800, letterSpacing: "-0.02em", color: INK.gray900 }}>
            {HERO.priceWas}
          </span>
        </div>
        {stamp > 0 && (
          <span
            style={{
              position: "absolute",
              left: 480,
              top: 330,
              padding: "10px 22px",
              border: `5px solid ${INK.red}`,
              borderRadius: 10,
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              color: INK.red,
              background: "rgba(255, 255, 255, 0.85)",
              opacity: Math.min(1, stamp),
              transform: `rotate(-12deg) scale(${1.8 - 0.8 * stamp})`,
            }}
          >
            Цена устарела
          </span>
        )}
      </div>
      {till > 0 && (
        <div
          style={{
            position: "absolute",
            left: 1140,
            top: 190,
            width: 440,
            padding: "28px 32px",
            boxSizing: "border-box",
            borderRadius: 16,
            background: FILM.card,
            boxShadow: FILM.shadow,
            opacity: till,
            transform: `translateX(${(1 - till) * 60}px)`,
          }}
        >
          <div style={{ fontSize: 22, color: INK.gray500 }}>На кассе</div>
          <div style={{ marginTop: 8, fontSize: 48, fontWeight: 800, letterSpacing: "-0.02em", color: INK.gray900 }}>
            {HERO.priceNow}
          </div>
        </div>
      )}
    </div>
  );
}

export function DeptsBefore({ t, lang }: SceneProps) {
  return (
    <BeforeFrame t={t} headline={painOf("depts").headline[lang]}>
      <DeptsIllustration t={t} />
    </BeforeFrame>
  );
}
```

- [ ] **Step 12: Куча — `Promo/src/film/fragments/before/PileBefore.tsx`**

```tsx
"use client";

import type { ComponentType } from "react";
import { PILE_HEADLINE } from "../../story";
import { easeInOutCubic, lerp, progress } from "../../timeline";
import type { SceneProps } from "../../types";
import { ART, BeforeHeadline } from "./BeforeFrame";
import { ChatIllustration } from "./ChatBefore";
import { DeadlinesIllustration } from "./DeadlinesBefore";
import { DeptsIllustration } from "./DeptsBefore";
import { FilesIllustration } from "./FilesBefore";

const PARTS: ComponentType<{ t: number }>[] = [
  FilesIllustration,
  ChatIllustration,
  DeadlinesIllustration,
  DeptsIllustration,
];
/** Иллюстрации — в конечном состоянии: момент далеко за концом их анимаций. */
const SETTLED = 10;
/** Откуда (четверти кадра) и куда (центр, внахлёст) съезжаются иллюстрации; r — поворот, градусы. */
const FROM = [
  { x: -440, y: -170, r: -4 },
  { x: 440, y: -170, r: 3 },
  { x: -440, y: 170, r: 3 },
  { x: 440, y: 170, r: -3 },
];
const TO = [
  { x: -70, y: -30, r: -12 },
  { x: 60, y: -50, r: 8 },
  { x: -50, y: 40, r: -6 },
  { x: 80, y: 30, r: 14 },
];
const SCALE = 0.42;
/** Обрыв в чёрное — на последний удар сцены (2 с): после него кадр пуст. */
export const PILE_CUT = 1.75;

/** Кульминация первого акта: все четыре боли валятся в кучу, кадр дрожит, резкий обрыв. */
export function PileBefore({ t, lang }: SceneProps) {
  if (t >= PILE_CUT) return null;
  const gather = progress(t, 0, 0.8, easeInOutCubic);
  const amp = t > 0.8 && t < 1.5 ? 12 * (1 - (t - 0.8) / 0.7) : 0;
  const shake = Math.sin(t * 95) * amp;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translate(${shake}px, ${shake * 0.4}px)` }}>
      {PARTS.map((Part, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 960 - ART.w / 2,
            top: 660 - ART.h / 2,
            width: ART.w,
            height: ART.h,
            transform:
              `translate(${lerp(FROM[i].x, TO[i].x, gather)}px, ${lerp(FROM[i].y, TO[i].y, gather)}px) ` +
              `rotate(${lerp(FROM[i].r, TO[i].r, gather)}deg) scale(${SCALE})`,
          }}
        >
          <Part t={SETTLED} />
        </div>
      ))}
      <BeforeHeadline text={PILE_HEADLINE[lang]} t={t} />
    </div>
  );
}
```

- [ ] **Step 13: Итог — `Promo/src/film/fragments/RecapFragment.tsx`**

```tsx
"use client";

import { Check } from "lucide-react";
import { FILM } from "../palette";
import { PAINS } from "../story";
import { easeInOutCubic, easeOutExpo, progress } from "../timeline";
import type { SceneProps } from "../types";

/** Каждая следующая боль перечёркивается на удар (0,5 с) позже. */
const STEP = 0.5;

/** Итог (спецификация v2 §4.5): четыре боли на весь кадр; каждая перечёркивается и сменяется гарантией. */
export function RecapFragment({ t, lang }: SceneProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: 200,
        top: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 36,
      }}
    >
      {PAINS.map((pain, i) => {
        const at = STEP + STEP * i;
        const enter = progress(t, 0.08 * i, 0.08 * i + 0.35, easeOutExpo);
        const strike = progress(t, at, at + 0.3, easeInOutCubic);
        const fade = progress(t, at + 0.3, at + 0.5);
        const fix = progress(t, at + 0.25, at + 0.65, easeOutExpo);
        return (
          <div key={pain.key} data-recap={pain.key} style={{ position: "relative", height: 84 }}>
            {fade < 1 && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 6,
                  whiteSpace: "nowrap",
                  color: FILM.muted,
                  fontSize: 60,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  opacity: enter * (1 - fade),
                }}
              >
                {pain.short[lang]}
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "54%",
                    height: 6,
                    width: `${strike * 100}%`,
                    borderRadius: 3,
                    background: FILM.accent,
                  }}
                />
              </span>
            )}
            {fix > 0 && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 24,
                  whiteSpace: "nowrap",
                  color: FILM.text,
                  fontSize: 60,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  opacity: fix,
                  transform: `translateX(${(1 - fix) * 60}px)`,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    flex: "none",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: FILM.accent,
                  }}
                >
                  <Check size={32} strokeWidth={3} color="#000000" />
                </span>
                {pain.fix[lang]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 14: Список болей — `Promo/src/film/PainTracker.tsx`**

```tsx
"use client";

import { Check } from "lucide-react";
import { FILM } from "./palette";
import { PAINS, type PainKey } from "./story";
import type { Lang } from "./types";

interface PainTrackerProps {
  strikes: Record<PainKey, number>;
  opacity: number;
  lang: Lang;
}

/**
 * Список болей поверх второго акта (спецификация v2 §4.2), левый верхний угол:
 * закрытая боль перечёркивается жёлтой линией, слева загорается галочка.
 * Связывает боли первого акта с решениями второго — их не нужно помнить.
 */
export function PainTracker({ strikes, opacity, lang }: PainTrackerProps) {
  if (opacity <= 0) return null;
  return (
    <div
      data-film="pain-tracker"
      style={{
        position: "absolute",
        left: 48,
        top: 48,
        width: 440,
        padding: "18px 24px",
        boxSizing: "border-box",
        borderRadius: 14,
        background: "rgba(14, 14, 16, 0.82)",
        boxShadow: "0 16px 48px rgba(0, 0, 0, 0.35)",
        opacity,
        transform: `translateY(${(1 - opacity) * -12}px)`,
      }}
    >
      {PAINS.map((pain) => {
        const p = strikes[pain.key];
        const done = p >= 1;
        return (
          <div
            key={pain.key}
            data-pain={pain.key}
            data-struck={done ? "true" : "false"}
            style={{ display: "flex", alignItems: "center", gap: 14, height: 44 }}
          >
            <span
              style={{
                display: "inline-flex",
                flex: "none",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                boxSizing: "border-box",
                borderRadius: "50%",
                border: `2px solid ${p > 0 ? FILM.accent : FILM.muted}`,
                background: done ? FILM.accent : "transparent",
              }}
            >
              {done && <Check size={15} strokeWidth={3} color="#000000" />}
            </span>
            <span
              style={{
                position: "relative",
                whiteSpace: "nowrap",
                color: FILM.text,
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                opacity: 1 - 0.45 * p,
              }}
            >
              {pain.short[lang]}
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "54%",
                  height: 4,
                  width: `${p * 100}%`,
                  borderRadius: 2,
                  background: FILM.accent,
                }}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 15: Страница-фильм — `Promo/src/film/FilmPage.tsx`**

К импортам:

```ts
import { PainTracker } from "./PainTracker";
import { painStrikes, trackerOpacity, type PainKey } from "./story";
```

После импортов, перед `useFit`:

```ts
/** Какую боль закрывает сцена и над какими сценами висит список болей — из сценария. */
const SOLVES: Record<string, PainKey> = Object.fromEntries(
  SCENES.flatMap((s) => (s.solves ? [[s.key, s.solves] as const] : [])),
);
const TRACKER_KEYS = SCENES.filter((s) => s.tracker).map((s) => s.key);
```

В разметке холста — перед строкой `{current.caption && <Caption … />}`:

```tsx
        <PainTracker
          strikes={painStrikes(timeline.chapters, SOLVES, t)}
          opacity={trackerOpacity(timeline.chapters, TRACKER_KEYS, t)}
          lang={lang}
        />
```

- [ ] **Step 16: Экраны — `Promo/src/film/screens.ts` целиком**

`plan` здесь без прокрутки и рамки (Task 4). `approval`, `deadlines` и `report` — заготовки: экран, роль, признак готовности и камера. Сигналы и итоговые позы им дают Tasks 5–7.

```ts
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
    // Таблица (строки 527–807 px окна) во весь кадр; tx = −410,5 и ty = −379,0 — нецелые.
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
```

- [ ] **Step 17: Сценарий — `Promo/src/film/scenes.ts` целиком**

```ts
import { ChatBefore } from "./fragments/before/ChatBefore";
import { DeadlinesBefore } from "./fragments/before/DeadlinesBefore";
import { DeptsBefore } from "./fragments/before/DeptsBefore";
import { FilesBefore } from "./fragments/before/FilesBefore";
import { PileBefore } from "./fragments/before/PileBefore";
import { FinalFragment } from "./fragments/FinalFragment";
import { LogoFragment } from "./fragments/LogoFragment";
import { RecapFragment } from "./fragments/RecapFragment";
import { APPROVAL_SCREEN, DEADLINES_SCREEN, FULLCAL_SCREEN, PLAN_SCREEN, REPORT_SCREEN } from "./screens";
import { painOf } from "./story";
import { bar } from "./timeline";
import type { FilmScene } from "./types";

/**
 * Сценарий версии 2 «Хаос → порядок» (спецификация v2 §3): 24 такта по 2 с при
 * 120 BPM = 48 с. Первый акт — четыре боли и куча, второй — акция 26-3 проходит
 * путь в Promo (список болей поверх, каждая сцена закрывает свою боль), итог и
 * финал. Ключи сцен — ключи глав для `--chapter`. Подписи сцен, закрывающих
 * боль, — её гарантия из story.ts: итог повторяет ровно их.
 */
export const SCENES: FilmScene[] = [
  { kind: "fragment", key: "before-files", duration: bar(1.5), Component: FilesBefore },
  { kind: "fragment", key: "before-chat", duration: bar(1.5), Component: ChatBefore },
  { kind: "fragment", key: "before-deadlines", duration: bar(1.5), Component: DeadlinesBefore },
  { kind: "fragment", key: "before-depts", duration: bar(1.5), Component: DeptsBefore },
  { kind: "fragment", key: "before-pile", duration: bar(1), Component: PileBefore },
  { kind: "fragment", key: "logo", duration: bar(1), Component: LogoFragment },
  {
    kind: "screen",
    key: "plan",
    duration: bar(1.5),
    screen: PLAN_SCREEN,
    tracker: true,
    caption: painOf("files").fix,
  },
  {
    kind: "screen",
    key: "fullcal",
    duration: bar(2),
    screen: FULLCAL_SCREEN,
    tracker: true,
    solves: "files",
    caption: { ru: "Все позиции — в одной таблице", uz: "Barcha pozitsiyalar — bitta jadvalda" },
  },
  {
    kind: "screen",
    key: "approval",
    duration: bar(3),
    screen: APPROVAL_SCREEN,
    tracker: true,
    solves: "chat",
    caption: painOf("chat").fix,
  },
  {
    kind: "screen",
    key: "deadlines",
    duration: bar(2.5),
    screen: DEADLINES_SCREEN,
    tracker: true,
    solves: "deadlines",
    caption: painOf("deadlines").fix,
  },
  {
    kind: "screen",
    key: "report",
    duration: bar(3),
    screen: REPORT_SCREEN,
    tracker: true,
    solves: "depts",
    caption: painOf("depts").fix,
  },
  { kind: "fragment", key: "recap", duration: bar(2), Component: RecapFragment },
  { kind: "fragment", key: "final", duration: bar(2), Component: FinalFragment },
];
```

- [ ] **Step 18: Удалить фрагменты первой версии и обновить пример в шапке `record-film.mjs`**

```bash
git rm Promo/src/film/fragments/HookFragment.tsx Promo/src/film/fragments/GridFragment.tsx Promo/src/film/fragments/ChangeFragment.tsx
```

Проверить, что ссылок не осталось: Grep по `Promo/src` и `Promo/e2e` на `HookFragment|GridFragment|ChangeFragment` → пусто.

В шапке `Promo/scripts/record-film.mjs` строку-пример:

```js
//   corepack pnpm film:promo --chapter change       # одна сцена
```

заменить на:

```js
//   corepack pnpm film:promo --chapter approval     # одна сцена
```

- [ ] **Step 19: Тесты проходят**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts`
Expected: PASS — все тесты файла.

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts -g "сцены-экраны" --repeat-each=3`
Expected: PASS — 6 из 6.

Run: `corepack pnpm --filter promo test:film` → PASS.
Run: `corepack pnpm build:promo` → зелёная, в выводе — отдельный чанк `FilmPage-*.js`.
Run: `tsc` из scratchpad → ровно 3 известные ошибки.

- [ ] **Step 20: Commit**

```bash
git add Promo/src/film Promo/e2e/film.spec.ts Promo/scripts/record-film.mjs
git commit -m "feat(promo-film): версия 2 — первый акт, список болей, итог, 13 сцен на 48 с"
```

---

### Task 4: Рамки и ожидание целей в сцене-экране; сцена `plan`

**Files:**
- Modify: `Promo/src/film/ScreenScene.tsx`
- Modify: `Promo/src/film/screens.ts` (`PLAN_SCREEN`, помощники `rectOf`, `pageScroller`)
- Modify: `Promo/e2e/film.spec.ts`

**Interfaces:**
- Consumes: `HighlightCue`, `Rect`, `highlightLook`, `resolveArea`, `resolveTarget` (Task 1); `HERO`, `byText`, `WHOLE` (Task 3).
- Produces:
  - Разметка рамки на холсте: `[data-film="highlight"]` (по элементу на рамку, активную в момент `t`).
  - `Promo/src/film/screens.ts`: `rectOf(el: Element): Rect`, `pageScroller: TargetFn` (`<main>` оболочки AppShell).
  - Поведение: цель клика или прокрутки и область рамки ищутся покадрово до 1 с. Не нашлась — прежняя ошибка с именем сцены и сигнала.

- [ ] **Step 1: Тест прокрутки и рамки в `plan`**

В `Promo/e2e/film.spec.ts`, в блок `фильм: сцены-экраны`:

```ts
  test('plan: страница прокручивается к таблице, рамка — на строке 26-3', async ({ page }) => {
    await openFilm(page);
    const plan = await at(page, 'plan');
    const frame = () => page.frames().find((f) => f.url().includes('/short-calendar?'))!;
    const scrollTop = () => frame().evaluate(() => document.querySelector('main')!.scrollTop);
    const highlight = page.locator('[data-film="highlight"]');
    await seek(page, plan.at + 0.5);
    expect(await scrollTop()).toBe(0);
    await expect(highlight).toHaveCount(0);
    await seek(page, plan.at + 2.6);
    expect(await scrollTop()).toBeCloseTo(300, 0);
    await expect(highlight).toHaveCount(1);
    const box = (await highlight.boundingBox())!;
    expect(box.width).toBeGreaterThan(1500); // строка — во всю ширину таблицы (1151 px окна × 1,55)
  });
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts -g "plan: страница"`
Expected: FAIL — `scrollTop` равен 0 на `plan.at + 2.6`.

- [ ] **Step 3: `ScreenScene.tsx` — импорты и ожидание целей**

Импорт из `./cues`:

```ts
import {
  CURSOR_LEAD,
  cursorPath,
  highlightLook,
  planSettle,
  resolveArea,
  resolveTarget,
  type ClickCue,
  type CursorPath,
  type HighlightCue,
  type Point,
  type Rect,
  type ScrollCue,
} from "./cues";
```

После `const READY_TIMEOUT_MS = 15_000;`:

```ts
/** Панель и диалог в экранах открываются через setTimeout: цель следующего сигнала — не в том же кадре. */
const TARGET_WAIT_MS = 1_000;
```

После функции `viewOf`:

```ts
/** Ищет покадрово до TARGET_WAIT_MS; не нашлось — `fail` бросает понятную ошибку. */
async function waitFor<T>(doc: Document, sceneKey: string, find: () => T | null, fail: () => T): Promise<T> {
  const win = viewOf(doc, sceneKey);
  const deadline = performance.now() + TARGET_WAIT_MS;
  for (;;) {
    const found = find();
    if (found) return found;
    if (performance.now() > deadline) return fail();
    await nextFrames(win, 1);
  }
}

const waitTarget = (doc: Document, cue: ClickCue | ScrollCue, sceneKey: string): Promise<Element> =>
  waitFor(doc, sceneKey, () => cue.target(doc), () => resolveTarget(doc, cue, sceneKey));

const waitArea = (doc: Document, cue: HighlightCue, sceneKey: string): Promise<Rect> =>
  waitFor(doc, sceneKey, () => cue.area(doc), () => resolveArea(doc, cue, sceneKey));
```

- [ ] **Step 4: `ScreenScene.tsx` — рамки в состоянии и в `run`**

После `const [points, setPoints] = …`:

```ts
  /** Рамки, активные в момент последнего перехода: индекс в `highlights` и область в координатах окна. */
  const [boxes, setBoxes] = React.useState<{ i: number; rect: Rect }[]>([]);
  const highlights = React.useMemo(
    () => cues.filter((c): c is HighlightCue => c.kind === "highlight"),
    [cues],
  );
```

В `run` — всё от комментария «Центр цели курсора замеряется один раз» до `flushSync(() => setPoints(measured));` включительно заменить на:

```ts
      // Центр цели курсора замеряется один раз: по раскладке после кликов, сделанных
      // до начала подъезда (at − CURSOR_LEAD), — до клика `before` и до своего клика.
      const measure = async (before: number) => {
        for (const c of cursorClicks) {
          const start = c.at - CURSOR_LEAD;
          if (start > local || start >= before || centers.current.has(c.at)) continue;
          const r = (await waitTarget(doc, c, scene.key)).getBoundingClientRect();
          centers.current.set(c.at, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
        }
      };
      // Клики — по одному, с кадром между ними: React фиксирует обновление клика
      // в микрозадаче, и цель следующего (строка после вкладки, пункт после меню)
      // появляется только после отрисовки.
      for (const cue of plan.clicks) {
        await measure(cue.at);
        pointerClick(await waitTarget(doc, cue, scene.key), scene.key);
        await nextFrames(viewOf(doc, scene.key), 1);
      }
      for (const { cue, p } of plan.scrolls) {
        const el = await waitTarget(doc, cue, scene.key);
        if (cue.axis === "y") el.scrollTop = cue.to(p, el);
        else el.scrollLeft = cue.to(p, el);
      }
      await measure(Number.POSITIVE_INFINITY);
      // Рамки — после кликов и прокруток: положение области зависит от них.
      const measuredBoxes: { i: number; rect: Rect }[] = [];
      for (let i = 0; i < highlights.length; i++) {
        const h = highlights[i];
        if (local < h.at || local > h.until) continue;
        measuredBoxes.push({ i, rect: await waitArea(doc, h, scene.key) });
      }
      applied.current = local;
      // Курсор — только у кликов, чьё окно уже началось; центры — из замеров.
      const measured = cursorClicks
        .filter((c) => local >= c.at - CURSOR_LEAD)
        .map((c) => ({ at: c.at, ...centers.current.get(c.at)! }));
      flushSync(() => {
        setPoints(measured);
        setBoxes(measuredBoxes);
      });
```

Массив зависимостей `useCallback` у `run`: `[cues, cursorClicks, highlights, scene, src]`.

- [ ] **Step 5: `ScreenScene.tsx` — отрисовка рамок**

В контейнере окна, между `<iframe … />` и `{cursor && <FilmCursor … />}`:

```tsx
        {boxes.map(({ i, rect }) => {
          const cue = highlights[i];
          const look = cue ? highlightLook(t, cue) : null;
          if (!cue || !look) return null;
          const pad = cue.pad ?? 6;
          return (
            <div
              key={i}
              data-film="highlight"
              style={{
                position: "absolute",
                left: rect.x - pad,
                top: rect.y - pad,
                width: rect.w + pad * 2,
                height: rect.h + pad * 2,
                boxSizing: "border-box",
                // 3 px на холсте при любом наезде камеры.
                border: `${3 / pose.zoom}px solid ${FILM.accent}`,
                borderRadius: 10,
                opacity: look.opacity,
                transform: `scale(${look.scale})`,
                pointerEvents: "none",
              }}
            />
          );
        })}
```

- [ ] **Step 6: `screens.ts` — помощники и итоговая сцена `plan`**

Импорт типов:

```ts
import type { Rect, TargetFn } from "./cues";
```

После `byText`:

```ts
/** Прямоугольник элемента в координатах окна. */
export const rectOf = (el: Element): Rect => {
  const b = el.getBoundingClientRect();
  return { x: b.left, y: b.top, w: b.width, h: b.height };
};

/** Страница прокручивается в <main> общей оболочки AppShell. */
export const pageScroller: TargetFn = (doc) => doc.querySelector("main");
```

`PLAN_SCREEN` заменить целиком:

```ts
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
```

- [ ] **Step 7: Тесты проходят**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts -g "сцены-экраны" --repeat-each=3`
Expected: PASS — все тесты блока, трижды.

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts` → PASS.
Run: `corepack pnpm build:promo` → зелёная; `tsc` → 3 известные ошибки.

- [ ] **Step 8: Commit**

```bash
git add Promo/src/film/ScreenScene.tsx Promo/src/film/screens.ts Promo/e2e/film.spec.ts
git commit -m "feat(promo-film): рамки и ожидание целей в сцене-экране; план — прокрутка и рамка на 26-3"
```

---

### Task 5: Сцена `approval` — «Было / Стало» и решение директора

**Files:**
- Modify: `Promo/src/film/screens.ts` (`APPROVAL_SCREEN`)
- Modify: `Promo/e2e/film.spec.ts`

**Interfaces:**
- Consumes: `HERO`, `byText`, `norm`, `rectOf` (Tasks 3–4); рамки и ожидание целей (Task 4).
- Produces: итоговая `APPROVAL_SCREEN`. Моменты (локальное время сцены, 6 с):
  - 1,0 — клик по строке De'Longhi (с курсором);
  - 1,8–3,2 — рамка на «Было / Стало»;
  - 3,8 — закрытие панели (без курсора);
  - 4,6 — «Согласовать все изменения» (с курсором);
  - 5,0–6,0 — рамка на строке после решения.
  - Боль «chat» перечёркивается с 4,8.

- [ ] **Step 1: Тест**

В блок `фильм: сцены-экраны`:

```ts
  test('approval: панель «Было / Стало», директор согласует набор, перемотка назад отменяет', async ({ page }) => {
    await openFilm(page);
    const ap = await at(page, 'approval');
    const frame = page.frameLocator('iframe[title="approval"]');
    await seek(page, ap.at + 2.5);
    await expect(frame.getByRole('dialog')).toContainText(/Было\s*\/\s*Стало/i);
    const box = (await page.locator('[data-film="highlight"]').boundingBox())!;
    expect(box.height).toBeGreaterThan(150); // рамка — вокруг всего раздела (~90 px окна × 2,4), не одного заголовка
    const a = await shotAt(page, ap.at + 5.5);
    await expect(frame.getByRole('dialog')).toHaveCount(0);
    await expect(frame.getByText('Набор согласован коммерческим директором.')).toBeVisible();
    await expect(frame.getByRole('row', { name: /De'Longhi/ })).toContainText('Согласовано ранее');
    await seek(page, ap.at + 2.5); // до решения (4,6 с): окно перезагружается, клики до 2,5 с — заново
    await expect(frame.getByRole('dialog')).toHaveCount(1);
    await expect(frame.getByRole('button', { name: 'Согласовать все изменения' })).toBeVisible();
    const b = await shotAt(page, ap.at + 5.5);
    expect(same(a, b)).toBe(true);
  });
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts -g "approval:"`
Expected: FAIL — панели нет: сигналов у сцены ещё нет.

- [ ] **Step 3: `APPROVAL_SCREEN` в `screens.ts`**

Константу `APPROVAL_TABLE` оставить, объявление `APPROVAL_SCREEN` заменить на:

```ts
/** Панель «Изменение позиции» крупно: «Было / Стало» (275–365 px окна); её красный срок (635+ px) — ниже кадра. */
const APPROVAL_DRAWER: CameraPose = { cx: 1040, cy: 320.4, zoom: 2.4, rx: 0, ry: 0, opacity: 1 };

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
 * камера держит «Было / Стало» (скидка 16% → 18%, прогноз 40 → 55); камера
 * возвращается к таблице, пока панель открыта (красная плашка просрочки над
 * таблицей притушена затемнением и уходит из кадра до закрытия панели);
 * панель закрывается, курсор нажимает «Согласовать все изменения» — строка
 * получает замок «Согласовано ранее» и 18%, панель — «Набор согласован
 * коммерческим директором.».
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
    { at: 1.2, value: APPROVAL_TABLE },
    { at: 1.8, value: APPROVAL_DRAWER, ease: easeInOutCubic },
    { at: 3.2, value: APPROVAL_DRAWER },
    { at: 3.8, value: APPROVAL_TABLE, ease: easeInOutCubic },
  ],
};
```

Сдвиги поз: `APPROVAL_TABLE` — `tx = −531` (целый), `ty = −783,35`; `APPROVAL_DRAWER` — `tx = −1536` (целый), `ty = −228,96`. У обеих одна ось нецелая.

- [ ] **Step 4: Тесты проходят**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts -g "approval:" --repeat-each=3`
Expected: PASS ×3.

Если падает на поиске области «раздел „Было / Стало“», значит у заголовка раздела есть дочерние элементы. Открыть экран вручную в режиме кадра: `http://localhost:5183/?film-frame=1&film-path=approvals/PR-2026-003~km-4&role=Коммерческий%20директор&user=u-1&theme=light`, кликнуть строку De'Longhi и посмотреть разметку раздела. Затем поправить в `changeBlock` только способ найти заголовок — например, `e.children.length <= 1`. Выбор общего родителя не менять.

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add Promo/src/film/screens.ts Promo/e2e/film.spec.ts
git commit -m "feat(promo-film): согласование — «Было / Стало» и решение директора по набору"
```

---

### Task 6: Сцена `deadlines` — фильтр по ответственному

**Files:**
- Modify: `Promo/src/film/screens.ts` (`DEADLINES_SCREEN`)
- Modify: `Promo/e2e/film.spec.ts`

**Interfaces:**
- Consumes: `HERO` (`promoNo`, `kmName`), `norm`, `tab`, `WHOLE` (Tasks 3–4); ожидание целей (Task 4) — пункты выпадающего списка появляются в портале после клика по фильтру.
- Produces: итоговая `DEADLINES_SCREEN`. Моменты (локальное время сцены, 5 с):
  - 0 — вкладка «Сроки по промо и отчётам»;
  - 1,2 — фильтр «Все ответственные» (с курсором);
  - 2,0 — пункт «Рашидова Дилноза» (с курсором);
  - 2,9–3,9 — рамка на «Отправка данных КМ»;
  - 3,9–5,0 — рамка на «Отправка первичного отчёта».
  - Боль «deadlines» перечёркивается с 3,8.

- [ ] **Step 1: Тест**

```ts
  test('deadlines: фильтр по ответственному — строки менеджера 26-3, без «раб. дн.»', async ({ page }) => {
    await openFilm(page);
    const dl = await at(page, 'deadlines');
    const frame = page.frameLocator('iframe[title="deadlines"]');
    await seek(page, dl.at + 1); // до фильтра
    await expect(frame.getByRole('tab', { name: 'Сроки по промо и отчётам' })).toHaveAttribute('aria-selected', 'true');
    await expect(frame.locator('tbody')).toContainText('раб. дн.'); // контроль: без фильтра такие строки есть
    const a = await shotAt(page, dl.at + 4.5);
    await expect(frame.getByRole('combobox').filter({ hasText: 'Рашидова Дилноза' })).toBeVisible();
    await expect(frame.locator('tbody tr')).toHaveCount(3);
    await expect(frame.locator('tbody')).toContainText('+8 кал. дн.');
    await expect(frame.locator('tbody')).not.toContainText('раб. дн.');
    await expect(page.locator('[data-film="highlight"]')).toHaveCount(1);
    await seek(page, dl.at + 1); // до фильтра — окно перезагружается
    await expect(frame.getByRole('combobox').filter({ hasText: 'Все ответственные' })).toBeVisible();
    const b = await shotAt(page, dl.at + 4.5);
    expect(same(a, b)).toBe(true);
  });
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts -g "deadlines:"`
Expected: FAIL — фильтр не выбран, строк больше трёх.

- [ ] **Step 3: `DEADLINES_SCREEN` в `screens.ts`**

Заменить объявление `DEADLINES_SCREEN`:

```ts
/**
 * Строка таблицы сроков, содержащая все `parts`. Таблица шире карточки (1360 px
 * против 1151 px), поэтому рамка обрезается по видимой части прокручиваемого блока.
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
 * «У каждого срока — ответственный»: аудит, вкладка сроков по промо. Курсор
 * выбирает в фильтре «Все ответственные» менеджера акции-героя — остаются её
 * сроки: 26-3 «Отправка данных КМ — В срок», 26-3 «Отправка первичного отчёта —
 * Просрочено +8 кал. дн.», 26-11 «В срок». Строки «+55/+59 раб. дн.» (решения
 * директора по 26-3) под фильтр не попадают. Камера подходит к таблице, рамки —
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
        [...doc.querySelectorAll('button[role="combobox"]')].find((b) => norm(b.textContent) === "Все ответственные") ??
        null,
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
    { at: 0, value: { ...WHOLE, zoom: 1.3, opacity: 0 } },
    { at: 0.4, value: WHOLE, ease: easeOutExpo },
    { at: 2.2, value: WHOLE },
    // Отфильтрованная таблица (шапка 520, строки 553–821 px окна); низ окна — у низа кадра.
    // tx = −410,52, ty = −379,03 — нецелые.
    { at: 2.9, value: { cx: 846, cy: 567.3, zoom: 1.62, rx: 0, ry: 0, opacity: 1 }, ease: easeInOutCubic },
  ],
};
```

Фильтр — Radix Select. Он открывается по `pointerdown`, а пункт выбирается по `pointerup`. `pointerClick` отправляет полную последовательность указателя, поэтому специальной обработки не нужно.

- [ ] **Step 4: Тесты проходят**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts -g "deadlines:" --repeat-each=3`
Expected: PASS ×3.

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add Promo/src/film/screens.ts Promo/e2e/film.spec.ts
git commit -m "feat(promo-film): сроки — фильтр по ответственному и рамки на строках 26-3"
```

---

### Task 7: Сцена `report` и проигрывание без записи

**Files:**
- Modify: `Promo/src/film/screens.ts` (`REPORT_SCREEN`)
- Modify: `Promo/e2e/film.spec.ts`

**Interfaces:**
- Consumes: `HERO.priceNow`, `byText`, `rectOf`, `REPORT_HEAD` (Tasks 3–4).
- Produces: итоговая `REPORT_SCREEN`. Моменты (локальное время сцены, 6 с):
  - 0,8–1,9 — рамка на «Изменено: 2»;
  - 1,6 — переключатель «Только изменения» (с курсором);
  - 2,0–3,2 — горизонтальная прокрутка таблицы к ценам;
  - 3,4–6,0 — рамка на ячейке новой цены De'Longhi.
  - Боль «depts» перечёркивается с 4,8.

- [ ] **Step 1: Тесты**

```ts
  test('report: маркетинг видит изменения — «Только изменения», цены, рамка на новой цене', async ({ page }) => {
    await openFilm(page);
    const rp = await at(page, 'report');
    const frame = page.frameLocator('iframe[title="report"]');
    const toggle = frame.getByRole('switch', { name: 'Только изменения' });
    await seek(page, rp.at + 1);
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(page.locator('[data-film="highlight"]')).toHaveCount(1); // «Изменено: 2»
    const a = await shotAt(page, rp.at + 4.5);
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(frame.getByText('Сотрудник маркетинга').first()).toBeVisible();
    const inner = page.frames().find((f) => f.url().includes('/reports?'))!;
    expect(
      await inner.evaluate(() =>
        Math.max(...[...document.querySelectorAll('div.overflow-x-auto')].map((el) => el.scrollLeft)),
      ),
    ).toBeGreaterThan(0);
    await expect(page.locator('[data-film="highlight"]')).toHaveCount(1); // новая цена
    await seek(page, rp.at + 1); // до переключателя (1,6 с) — окно перезагружается
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    const b = await shotAt(page, rp.at + 4.5);
    expect(same(a, b)).toBe(true);
  });

  test('просмотр без записи доигрывает сигналы: директор согласует набор', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('embed/film');
    await expect(
      page.frameLocator('iframe[title="approval"]').getByText('Набор согласован коммерческим директором.'),
    ).toBeVisible({ timeout: 90_000 });
  });
```

- [ ] **Step 2: Убедиться, что тест `report:` падает**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts -g "report:"`
Expected: FAIL — рамки нет, переключатель не включён.

- [ ] **Step 3: `REPORT_SCREEN` в `screens.ts`**

Константу `REPORT_HEAD` оставить, объявление `REPORT_SCREEN` заменить на:

```ts
/**
 * Таблица отчёта после «Только изменения»: строки De'Longhi и Dyson (741 и 793 px
 * окна). Страница после фильтра короче окна и не прокручивается, поэтому низ окна
 * (900 px) виден над подписью — под её затемнением. tx = −240, ty = −480,45.
 */
const REPORT_TABLE: CameraPose = { cx: 800, cy: 680.3, zoom: 1.5, rx: 0, ry: 0, opacity: 1 };

/** Тело таблицы отчёта: самый высокий горизонтальный скроллер (шапка и нижняя полоса — низкие). */
const reportBody: TargetFn = (doc) =>
  [...doc.querySelectorAll<HTMLElement>("div.overflow-x-auto")]
    .filter((el) => el.scrollWidth > el.clientWidth && el.clientHeight > 50)
    .sort((a, b) => b.clientHeight - a.clientHeight)[0] ?? null;

/**
 * «Маркетинг видит изменения сразу»: отчёт 26-3 открывается сотруднику маркетинга
 * по умолчанию — «Версия 4 · Изменено: 2» (рамка). Курсор включает «Только
 * изменения», таблица прокручивается к ценам, рамка — на новой цене De'Longhi,
 * той же, что на кассе в первом акте.
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
      to: (p, el) => easeInOutCubic(p) * Math.min(1400, el.scrollWidth - el.clientWidth),
    },
    {
      kind: "highlight",
      at: 3.4,
      until: 6,
      label: `новая цена «${HERO.priceNow}»`,
      area: (doc) => {
        const body = reportBody(doc);
        const cell = body && byText(body, HERO.priceNow)?.parentElement;
        return cell ? rectOf(cell) : null;
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
```

`byText(body, HERO.priceNow)` находит подчёркнутое значение в ячейке (подсказка «было → стало» висит на нём). Его родитель — сама ячейка шириной ~170 px окна. Рамка — вокруг ячейки.

- [ ] **Step 4: Тесты проходят**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts -g "report:" --repeat-each=3` → PASS ×3.
Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts -g "просмотр без записи"` → PASS.
Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add Promo/src/film/screens.ts Promo/e2e/film.spec.ts
git commit -m "feat(promo-film): отчёт маркетингу — изменения, цены, рамка на новой цене"
```

---

### Task 8: Кадры, подстройка поз, запись, документация

**Files:**
- Modify (только если кадры требуют): `Promo/src/film/screens.ts` — значения `CameraPose` и моменты сигналов; `Promo/src/film/fragments/before/*.tsx` — отступы и размеры.
- Modify: `Promo/CLAUDE.md`, `CLAUDE.md`, `HISTORY.md`, `docs/AI_CONTEXT.md`.
- Output (вне git): `Promo/film-out/film-ru-16x9.mp4`, `Promo/film-out/film-uz-16x9.mp4`, PNG-кадры.

**Interfaces:**
- Consumes: весь фильм (Tasks 1–7).
- Produces: проверенные ролики RU/UZ; документация.

- [ ] **Step 1: Dev-сервер**

Запустить в фоне `corepack pnpm dev:promo` из `D:\Texnomart`. Лог писать в scratchpad сессии, записать PID. Дождаться строки `Local: http://localhost:5173/`.

- [ ] **Step 2: Кадры первого акта и логотипа**

Run: `corepack pnpm film:promo -- --stills 0.4,1.5,2.8,3.4,4.5,5.8,6.4,7.5,8.8,9.4,10.5,11.8,12.4,13.0,13.7,15.0`

Каждый PNG из `Promo/film-out/` посмотреть как изображение. Условия приёмки:
- заголовок не наезжает на иллюстрацию;
- текст не обрезан;
- к концу своей сцены все пять окон-файлов, три сообщения и три задачи в кадре;
- штамп лежит поверх старой цены;
- в куче видны все четыре иллюстрации;
- на 13.7 заголовок кучи ещё есть, а после обрыва на 13.75 кадр чёрный.

- [ ] **Step 3: Кадры второго акта**

Run: `corepack pnpm film:promo -- --stills 16.4,17.5,18.8,19.4,20.4,21.5,22.8,23.4,24.0,24.5,25.5,26.5,27.6,28.5,29.4,30.2,31.0,31.5,32.3,33.4,34.4,35.2,35.6,36.6,38.0,39.5`

Условия приёмки (Review Focus 1–2):
- **Чужие просрочки.** Ни в одном кадре нет «+40», «+55», «+59», «раб. дн.» и красной плашки «Просрочка проверки». Особенно проверить 24.0 / 24.5 / 26.5 / 27.6 (`approval`) и 31.5 (`deadlines`, переход камеры).
- **Список болей** (холст 48–468 × 48–248) не закрывает рамку, цель курсора и строку/ячейку, о которой сцена.
- **Подпись** (текст от y ≈ 860, слева) не закрывает рамку и цель курсора.
- **Окна.** Нет пустых окон и индикаторов загрузки. Край окна виден только внизу под затемнением подписи (`approval`, `report`) и при влёте.
- **Рамки** стоят ровно на своих элементах: строка 26-3, «Было / Стало», строка De'Longhi, две строки аудита, «Изменено: 2», ячейка новой цены.
- **Список болей** на 22.8 перечёркнул «План в десяти файлах», на 28.5 — и «Кто согласовал», на 33.4 — три строки, на 39.5 — все четыре.

Если кадр не проходит, править только значения поз (`cx`, `cy`, `zoom`) и моменты сигналов в `screens.ts`. Экраны Promo не трогать. У новой позы хотя бы один из сдвигов `tx = 960 − cx·zoom` и `ty = 540 − cy·zoom` должен быть нецелым. После правки:
- прогнать тест этой сцены с `--repeat-each=3`;
- снять кадры этой сцены заново.

- [ ] **Step 4: Кадры итога, финала и узбекской версии**

Run: `corepack pnpm film:promo -- --stills 40.4,42.0,43.8,45.5`
Run: `corepack pnpm film:promo -- --lang uz --stills 1.5,4.5,7.5,10.5,13.0,17.5,25.5,33.4,39.5,43.8`

Условия приёмки (Review Focus 3):
- узбекский заголовок в две строки не наезжает на иллюстрацию (верх иллюстрации — 420 px);
- строки списка болей помещаются в карточку 440 px;
- строки итога не выходят за правый край холста;
- интерфейс и тексты иллюстраций в узбекской версии — русские.

- [ ] **Step 5: Полная регрессия**

Run: `corepack pnpm --filter promo test:film` → PASS.
Run: `corepack pnpm test:e2e:promo` → весь набор проходит, без `test.fail`.
Run: `corepack pnpm build:promo` → зелёная, отдельный чанк `FilmPage-*.js`.
`tsc` из scratchpad → ровно 3 известные ошибки.

- [ ] **Step 6: Запись RU и UZ**

В PowerShell (одна команда на язык, в фоне, около 8 мин каждая):

```powershell
$env:FFMPEG = "C:\Users\User\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"; corepack pnpm film:promo -- --lang ru
```

Затем то же с `--lang uz`.

Проверка (путь к `ffprobe.exe` — рядом с `ffmpeg.exe`):

```powershell
& "C:\Users\User\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffprobe.exe" -v error -count_frames -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_read_frames -of csv=p=0 D:\Texnomart\Promo\film-out\film-ru-16x9.mp4
```

Expected: `1920,1080,60/1,2880` (и то же для `film-uz-16x9.mp4`).

- [ ] **Step 7: Остановить dev-сервер** по записанному PID (`taskkill /PID <pid> /T /F`).

- [ ] **Step 8: Документация**

- **`Promo/CLAUDE.md`, раздел «Моушн-фильм (`/embed/film`)».** Переписать описание сцен: версия 2 «Хаос → порядок», 48 с, 13 глав (ключи — как в Global Constraints). Описать акцию-героя (`film/hero.ts`), список болей (`PainTracker`, `story.ts`), три новых возможности сцены-экрана (`query`, `axis: "y"`, `HighlightCue`) и ожидание целей до 1 с. Пример главы для `--chapter` — `approval`.
- **Корневой `CLAUDE.md`, строка Promo в таблице проектов.** В предложении о моушн-фильме «8 сцен … 32 с» заменить на «версия 2 „Хаос → порядок“: 13 сцен, 48 с, четыре боли бизнеса → акция 26-3 в Promo».
- **`HISTORY.md`.** Новая запись сверху: «2026-09-30 — Promo: моушн-фильм, версия 2 „Хаос → порядок“». Что изменилось и почему — отзыв: не было видно, как продукт решает проблему. Три уточнения спецификации (согласование через «Согласовать все изменения», фильтр по ответственному, без «Ознакомиться»). Проверки с цифрами: `test:film`, e2e, `tsc`, `ffprobe`.
- **`docs/AI_CONTEXT.md`.** Новая строка «Last updated». В пункте Next Steps про моушн-фильм — «версия 2 записана», и дальше прежние открытые вопросы: темп, `STUDIO_CREDIT`, музыка, проверка узбекских титров, этап 9:16. Новый открытый вопрос: в аудите по 26-3 «+55/+59 раб. дн.» считаются, по данным проверки, в календарных днях. Это возможный дефект приложения, проверить отдельно.

- [ ] **Step 9: Commit**

```bash
git add Promo/src/film Promo/CLAUDE.md CLAUDE.md HISTORY.md docs/AI_CONTEXT.md
git commit -m "docs(promo-film): версия 2 «Хаос → порядок» — сцены, запись, история"
```

(Если в Step 3–4 позы не правились, `Promo/src/film` в коммит ничего не добавит — это нормально.)
