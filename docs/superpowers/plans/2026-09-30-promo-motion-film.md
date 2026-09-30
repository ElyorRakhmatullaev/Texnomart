# Promo · моушн-фильм для внешнего показа — план реализации (этап 1: 16:9)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 32-секундный моушн-фильм о Texnomart Promo (1920×1080, 60 кадров/с), который собирается покадровой записью в MP4 одной командой.

**Architecture:** Страница `/embed/film` рисует фильм как чистую функцию от времени и отдаёт `window.__capture` (`duration`, `chapters`, `seek`) — тот же контракт, что в образце `record-tour.mjs`. Сцены двух видов: «экран» — живой экран Promo во `<iframe>` в режиме кадра (данные в памяти, дата зафиксирована, анимации выключены) под камерой и курсором фильма; «фрагмент» — крупная композиция из настоящих примитивов Promo. `scripts/record-film.mjs` через протокол DevTools ставит каждый кадр, снимает PNG и отдаёт их ffmpeg.

**Tech Stack:** React 18 + TypeScript, Vite 6, React Router 7 (`lazy`), Tailwind v4, Node 24 (`node --test` со снятием типов, встроенный `WebSocket`), Chrome (DevTools Protocol), ffmpeg, Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-09-30-promo-motion-film-design.md`

**Этап 2 (9:16)** — отдельный короткий план после того, как пользователь согласует ролик 16:9: кадрирование вертикальной версии зависит от отзыва на горизонтальную. В этом плане `aspect` уже проходит через страницу и типы, а скрипт записи явно отказывает на `--aspect 9x16`.

**Уточнения спецификации при планировании (внесены в спецификацию тем же коммитом):**
1. Сцена `fullcal` снимается под **КД** (`u-1`), а не под КМ: КМ видит 3 акции и 5 позиций с пустой строкой, КД — 8 акций и 22 позиции; панораме «масштаба» нужен второй вид.
2. Логотип берётся из `shell-config.tsx`, где он объявлен без экспорта, — к двум константам добавляется `export` (третья точечная правка приложения, поведение не меняется).
3. На этапе 1 скрипт записи принимает только `--aspect 16x9`.
4. Вложенный экран открывается от корня приложения с параметром `film-path`, а не глубокой ссылкой: на GitHub Pages глубокая ссылка идёт через `404.html` и общий ключ `sessionStorage.spaRedirect`, и два окна, грузящиеся разом, перепутали бы экраны.
5. Сигналы — только `click` и `scroll` (наведение ни одной сцене не нужно); перемотка назад перезагружает окно, только если между моментами был клик.

## Global Constraints

- Экраны Promo не меняются. Правки приложения — только: первая строка `Promo/src/main.tsx`, ленивый маршрут в `Promo/src/app/routes.tsx`, `export` у `TexnomartLogoFull`/`TexnomartLogoIcon` в `Promo/src/app/shell-config.tsx`. `packages/ui` не редактируется.
- Холст 1920×1080, 60 кадров/с, 32 с; темп 120 BPM — удар 0,5 с, такт 2 с.
- «Сейчас» в кадре — `2026-09-28T12:00:00+05:00` (как `FIXED_NOW` в e2e); вьюпорт вложенного экрана 1440×900; часовой пояс записи `Asia/Tashkent`.
- Цвета — точные hex через `style={{}}` (не классы вида `bg-[#…]`); `#FFD60A` — только акцент (линии, кольцо курсора, полосы), не большие заливки. Сцена `#0E0E10`.
- Интерфейс в кадре (живые экраны и фрагменты) — русский; переводятся только титры: фразы хука, подписи сцен, строка и кредит финала.
- `Promo/src/film/timeline.ts` и `Promo/src/film/cues.ts` — без импортов и только «стираемый» TypeScript (без `enum`, `namespace`, параметров-свойств): их запускает `node --test`.
- Новых npm-зависимостей нет. ffmpeg — системный, ставится только с согласия пользователя.
- Коммиты — прямо в `main`, **без** строк `Co-Authored-By` и других AI-подписей.
- `pnpm` не в PATH — все команды через `corepack pnpm`, из корня `D:\Texnomart`.
- `vite build` не проверяет типы. Типы — `tsc` из scratchpad по рецепту `tasks/lessons.md` («Promo можно типизировать целиком — `tsc` из scratchpad»); базовая линия — ровно 3 известные ошибки (`plan-store.ts` ×2, `main.tsx`), всё сверх — новое и исправляется.
- Dev-серверы, запущенные в фоне, останавливать по PID.

## Review Focus

1. **Dev-сервер не запущен или неверный `--base`** → запись отказывает за секунды с адресом и подсказкой `corepack pnpm dev:promo`, а не висит 60 с. Проверка — Task 5, шаг «Отказы».
2. **Неизвестная глава `--chapter`** → ошибка со списком глав, а не молчаливая запись всего фильма (образец так делал). Проверка — Task 5, шаг «Отказы».
3. **Тёмная тема в браузере пользователя** → страница фильма всё равно светлая (иначе бейджи фрагментов перекрашиваются в тёмные варианты). Проверка — Task 4, тест «фильм всегда светлый».
4. **Деплой под подпутём GitHub Pages** (`/Texnomart/promo/`) → вложенные экраны открываются по `BASE_URL`, а не по корню сайта. Проверка — Task 9, шаг «Подпуть GitHub Pages».
5. **`corepack pnpm film:promo -- --lang ru`** (с `--`, как в спецификации) → параметры применяются, а не превращаются в позиционные аргументы. Проверка — Task 5, шаг «Отказы».

---

## Файлы

| Файл | Ответственность |
|---|---|
| `Promo/src/film/timeline.ts` | Время: такты, главы, сцена по моменту, плавности, ключевые кадры. Чистый. |
| `Promo/src/film/cues.ts` | Сигналы экрана: план перехода к моменту, поиск цели, путь курсора. Чистый. |
| `Promo/src/film/frame-mode.ts` | Режим кадра вложенного экрана (`?film-frame=1`). |
| `Promo/src/film/types.ts` | Типы сцен, холсты, контракт `__capture`. |
| `Promo/src/film/palette.ts` | Цвета фильма. |
| `Promo/src/film/frames.ts` | Ожидание кадров отрисовки. |
| `Promo/src/film/Caption.tsx` | Подпись сцены внизу слева. |
| `Promo/src/film/FilmPage.tsx` | Холст, проигрывание, `__capture`, монтирование сцен. |
| `Promo/src/film/ScreenScene.tsx` | Сцена «экран»: iframe, камера, курсор, сигналы. |
| `Promo/src/film/screens.ts` | Три экрана: маршрут, роль, камера, сигналы. |
| `Promo/src/film/credits.ts` | `STUDIO_CREDIT`. |
| `Promo/src/film/scenes.ts` | Сценарий: порядок, длительности, подписи RU/UZ. |
| `Promo/src/film/fragments/*.tsx` | `HookFragment`, `LogoMark`, `LogoFragment`, `GridFragment`, `ChangeFragment`, `FinalFragment`. |
| `Promo/scripts/film-timeline.test.ts`, `Promo/scripts/film-cues.test.ts` | `node --test` для чистых модулей. |
| `Promo/scripts/record-film.mjs` | Запись. |
| `Promo/e2e/film.spec.ts` | Режим кадра, контракт, детерминизм, изоляция. |

---

### Task 1: Модель времени `timeline.ts`

**Files:**
- Create: `Promo/src/film/timeline.ts`
- Create: `Promo/scripts/film-timeline.test.ts`
- Modify: `Promo/package.json` (скрипт `test:film`)

**Interfaces:**
- Consumes: —
- Produces:
  - `BPM = 120`; `beat(n: number): number`; `bar(n: number): number`
  - `interface TimedScene { key: string; duration: number }`, `interface Chapter { key: string; at: number; end: number }`, `interface Timeline { duration: number; chapters: Chapter[] }`
  - `buildTimeline(scenes: readonly TimedScene[]): Timeline`
  - `interface SceneAt { index: number; local: number }`; `sceneAt(tl: Timeline, t: number): SceneAt`
  - `type Ease = (x: number) => number`; `linear`, `easeOutExpo`, `easeInOutCubic`, `easeOutBack`
  - `clamp01(x)`, `lerp(a, b, p)`, `progress(t, from, to, ease?)`
  - `type Pose = Record<string, number>`; `interface Key<P extends Pose> { at: number; value: P; ease?: Ease }`; `keyframes<P extends Pose>(t: number, keys: readonly Key<P>[]): P`

- [ ] **Step 1: Скрипт тестов в `Promo/package.json`**

В `"scripts"` после `"test:e2e:report"` добавить:

```json
    "test:film": "node --test scripts/film-timeline.test.ts"
```

(не забыть запятую после предыдущей строки).

- [ ] **Step 2: Написать падающий тест**

`Promo/scripts/film-timeline.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bar,
  beat,
  buildTimeline,
  clamp01,
  easeInOutCubic,
  easeOutBack,
  easeOutExpo,
  keyframes,
  lerp,
  linear,
  progress,
  sceneAt,
} from "../src/film/timeline.ts";

test("beat и bar: 120 BPM", () => {
  assert.equal(beat(1), 0.5);
  assert.equal(bar(1), 2);
  assert.equal(bar(1.5), 3);
});

test("buildTimeline: главы подряд, длительность — сумма", () => {
  const tl = buildTimeline([
    { key: "a", duration: 3 },
    { key: "b", duration: 2 },
    { key: "c", duration: 6 },
  ]);
  assert.equal(tl.duration, 11);
  assert.deepEqual(tl.chapters, [
    { key: "a", at: 0, end: 3 },
    { key: "b", at: 3, end: 5 },
    { key: "c", at: 5, end: 11 },
  ]);
});

test("buildTimeline: пустой сценарий, нулевая длительность, повтор ключа — ошибки", () => {
  assert.throws(() => buildTimeline([]), /пустой сценарий/);
  assert.throws(() => buildTimeline([{ key: "a", duration: 0 }]), /«a»: длительность/);
  assert.throws(
    () => buildTimeline([{ key: "a", duration: 1 }, { key: "a", duration: 1 }]),
    /повтор ключа сцены «a»/,
  );
});

test("sceneAt: внутри, граница, до начала, за концом, NaN", () => {
  const tl = buildTimeline([{ key: "a", duration: 3 }, { key: "b", duration: 2 }]);
  assert.deepEqual(sceneAt(tl, 1.25), { index: 0, local: 1.25 });
  assert.deepEqual(sceneAt(tl, 3), { index: 1, local: 0 });
  assert.deepEqual(sceneAt(tl, 4.5), { index: 1, local: 1.5 });
  assert.deepEqual(sceneAt(tl, -1), { index: 0, local: 0 });
  assert.deepEqual(sceneAt(tl, 5), { index: 1, local: 2 });
  assert.deepEqual(sceneAt(tl, 99), { index: 1, local: 2 });
  assert.deepEqual(sceneAt(tl, Number.NaN), { index: 0, local: 0 });
});

test("плавности: 0 → 0, 1 → 1; easeOutBack перелетает", () => {
  for (const ease of [linear, easeOutExpo, easeInOutCubic, easeOutBack]) {
    assert.ok(Math.abs(ease(0)) < 1e-9, `${ease.name}(0)`);
    assert.ok(Math.abs(ease(1) - 1) < 1e-9, `${ease.name}(1)`);
  }
  assert.ok(easeOutBack(0.8) > 1);
});

test("progress, clamp01, lerp", () => {
  assert.equal(progress(0, 1, 3), 0);
  assert.equal(progress(2, 1, 3), 0.5);
  assert.equal(progress(5, 1, 3), 1);
  assert.equal(progress(2, 2, 2), 1);
  assert.equal(progress(1, 2, 2), 0);
  assert.equal(clamp01(-2), 0);
  assert.equal(clamp01(2), 1);
  assert.equal(lerp(10, 20, 0.25), 12.5);
});

test("keyframes: до, между, после; плавность ведущего ключа", () => {
  const keys = [
    { at: 1, value: { x: 0, y: 10 } },
    { at: 3, value: { x: 100, y: 20 } },
    { at: 5, value: { x: 100, y: 0 }, ease: easeInOutCubic },
  ];
  assert.deepEqual(keyframes(0, keys), { x: 0, y: 10 });
  assert.deepEqual(keyframes(2, keys), { x: 50, y: 15 });
  assert.equal(keyframes(3.5, keys).y, 18.75); // easeInOutCubic(0.25) = 0.0625
  assert.equal(keyframes(4, keys).y, 10);
  assert.deepEqual(keyframes(9, keys), { x: 100, y: 0 });
});

test("keyframes: без ключей и не по порядку — ошибки", () => {
  assert.throws(() => keyframes(0, []), /нет ключей/);
  assert.throws(
    () => keyframes(0, [{ at: 2, value: { x: 0 } }, { at: 1, value: { x: 1 } }]),
    /не по порядку/,
  );
});
```

- [ ] **Step 3: Убедиться, что тест падает**

Run: `corepack pnpm --filter promo test:film`
Expected: FAIL — `Cannot find module '…/src/film/timeline.ts'`.

- [ ] **Step 4: Реализация**

`Promo/src/film/timeline.ts`:

```ts
/**
 * Модель времени фильма (спецификация §3.3): сцены с длительностями → главы,
 * поиск сцены по моменту, плавности и ключевые кадры.
 *
 * Чистый модуль без импортов: его запускает `node --test`
 * (scripts/film-timeline.test.ts), поэтому только «стираемый» TypeScript —
 * без enum, namespace и параметров-свойств.
 */

/** Темп монтажа: 120 ударов в минуту. */
export const BPM = 120;
/** n ударов в секундах (удар = 0,5 с). */
export const beat = (n: number): number => (n * 60) / BPM;
/** n тактов 4/4 в секундах (такт = 2 с). */
export const bar = (n: number): number => beat(n * 4);

export interface TimedScene {
  key: string;
  duration: number;
}

export interface Chapter {
  key: string;
  at: number;
  end: number;
}

export interface Timeline {
  duration: number;
  chapters: Chapter[];
}

export function buildTimeline(scenes: readonly TimedScene[]): Timeline {
  if (scenes.length === 0) throw new Error("[film] пустой сценарий");
  const seen = new Set<string>();
  const chapters: Chapter[] = [];
  let at = 0;
  for (const s of scenes) {
    if (!(s.duration > 0)) {
      throw new Error(`[film] сцена «${s.key}»: длительность должна быть больше нуля`);
    }
    if (seen.has(s.key)) throw new Error(`[film] повтор ключа сцены «${s.key}»`);
    seen.add(s.key);
    chapters.push({ key: s.key, at, end: at + s.duration });
    at += s.duration;
  }
  return { duration: at, chapters };
}

export interface SceneAt {
  index: number;
  /** Время внутри сцены — от 0 до её длительности. */
  local: number;
}

/**
 * Сцена момента t. Граница принадлежит следующей сцене (t = end → её 0).
 * t ≤ 0 или NaN — начало первой сцены; t ≥ duration — последний кадр последней.
 */
export function sceneAt(tl: Timeline, t: number): SceneAt {
  const { chapters } = tl;
  if (!(t > 0)) return { index: 0, local: 0 };
  for (let i = 0; i < chapters.length; i++) {
    if (t < chapters[i].end) return { index: i, local: t - chapters[i].at };
  }
  const last = chapters.length - 1;
  return { index: last, local: chapters[last].end - chapters[last].at };
}

export type Ease = (x: number) => number;

export const linear: Ease = (x) => x;
export const easeOutExpo: Ease = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const easeInOutCubic: Ease = (x) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const easeOutBack: Ease = (x) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;

/** Прогресс участка [from, to] в момент t: 0 до начала, 1 после конца, между — по плавности. */
export function progress(t: number, from: number, to: number, ease: Ease = linear): number {
  if (to <= from) return t >= to ? 1 : 0;
  return ease(clamp01((t - from) / (to - from)));
}

/** Набор чисел, который интерполируется целиком (поза камеры, позиция). */
export type Pose = Record<string, number>;

export interface Key<P extends Pose> {
  at: number;
  value: P;
  /** Плавность участка, который ВЕДЁТ в этот ключ (от предыдущего). */
  ease?: Ease;
}

/**
 * Значение по ключевым кадрам: до первого ключа — первое, после последнего —
 * последнее, между — интерполяция каждого поля. Ключи — по возрастанию `at`.
 */
export function keyframes<P extends Pose>(t: number, keys: readonly Key<P>[]): P {
  if (keys.length === 0) throw new Error("[film] keyframes: нет ключей");
  for (let i = 1; i < keys.length; i++) {
    if (keys[i].at < keys[i - 1].at) throw new Error("[film] keyframes: ключи не по порядку");
  }
  if (t <= keys[0].at) return { ...keys[0].value };
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i];
    if (t < b.at) {
      const a = keys[i - 1];
      const p = progress(t, a.at, b.at, b.ease ?? linear);
      const out: Pose = {};
      for (const k of Object.keys(a.value)) out[k] = lerp(a.value[k], b.value[k], p);
      return out as P;
    }
  }
  return { ...keys[keys.length - 1].value };
}
```

- [ ] **Step 5: Тесты проходят**

Run: `corepack pnpm --filter promo test:film`
Expected: PASS, `# pass 8`, `# fail 0`. Предупреждение Node о снятии типов (`ExperimentalWarning`/`Type Stripping`) допустимо.

- [ ] **Step 6: Commit**

```bash
git add Promo/src/film/timeline.ts Promo/scripts/film-timeline.test.ts Promo/package.json
git commit -m "feat(promo-film): модель времени фильма (главы, такты, ключевые кадры)"
```

---

### Task 2: Сигналы экрана `cues.ts`

**Files:**
- Create: `Promo/src/film/cues.ts`
- Create: `Promo/scripts/film-cues.test.ts`
- Modify: `Promo/package.json` (`test:film` += второй файл)

**Interfaces:**
- Consumes: —
- Produces:
  - `type TargetFn = (doc: Document) => Element | null`
  - `interface ClickCue { kind: "click"; at: number; label: string; target: TargetFn; cursor?: boolean }`
  - `interface ScrollCue { kind: "scroll"; at: number; until: number; label: string; target: TargetFn; left: (p: number, el: Element) => number }`
  - `type Cue = ClickCue | ScrollCue`
  - `interface SettlePlan { reload: boolean; clicks: ClickCue[]; scrolls: { cue: ScrollCue; p: number }[] }`
  - `planSettle(cues: readonly Cue[], applied: number, t: number): SettlePlan`
  - `resolveTarget(doc: Document, cue: Cue, sceneKey: string): Element`
  - `interface Point { x: number; y: number }`; `CURSOR_LEAD = 0.8`; `CURSOR_TAIL = 0.6`
  - `interface CursorPath { from: Point; to: Point; move: number; press: number }`
  - `cursorPath(t: number, clicks: readonly (Point & { at: number })[], home: Point): CursorPath | null`

Правило перехода: `applied` — момент прошлого перехода (`NaN` — экран только что загружен). Вперёд — клики из `(applied, t]`. Назад — перезагрузка нужна, **только** если между `t` и `applied` был клик (его действие надо отменить); тогда после перезагрузки выполняются все клики с `at ≤ t`. Назад без кликов в промежутке — ни перезагрузки, ни кликов. Прокрутки идемпотентны и применяются всегда, с прогрессом, зажатым в `[0, 1]` (до `at` — 0, т. е. в начало).

- [ ] **Step 1: Добавить файл в `test:film`**

```json
    "test:film": "node --test scripts/film-timeline.test.ts scripts/film-cues.test.ts"
```

- [ ] **Step 2: Написать падающий тест**

`Promo/scripts/film-cues.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CURSOR_LEAD,
  CURSOR_TAIL,
  cursorPath,
  planSettle,
  resolveTarget,
  type Cue,
  type SettlePlan,
} from "../src/film/cues.ts";

const el = {} as Element;
const doc = {} as Document;
const CUES: Cue[] = [
  { kind: "click", at: 0, label: "вкладка", target: () => el },
  { kind: "click", at: 2, label: "тема", target: () => el, cursor: true },
  { kind: "scroll", at: 1, until: 3, label: "таблица", target: () => el, left: (p) => p * 100 },
];
const clickLabels = (p: SettlePlan) => p.clicks.map((c) => c.label);
const scrollP = (p: SettlePlan) => p.scrolls.map((s) => s.p);
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

test("первый переход после загрузки: клики с at ≤ t, включая 0", () => {
  const p = planSettle(CUES, Number.NaN, 0.5);
  assert.equal(p.reload, false);
  assert.deepEqual(clickLabels(p), ["вкладка"]);
  assert.deepEqual(scrollP(p), [0]);
});

test("вперёд: только клики из (applied, t]", () => {
  const p = planSettle(CUES, 0.5, 2);
  assert.equal(p.reload, false);
  assert.deepEqual(clickLabels(p), ["тема"]);
  assert.deepEqual(scrollP(p), [0.5]);
});

test("тот же момент повторно — без кликов", () => {
  assert.deepEqual(clickLabels(planSettle(CUES, 2, 2)), []);
});

test("назад через клик: перезагрузка и все клики с at ≤ t", () => {
  const p = planSettle(CUES, 2.5, 1.5);
  assert.equal(p.reload, true);
  assert.deepEqual(clickLabels(p), ["вкладка"]);
  assert.deepEqual(scrollP(p), [0.25]);
});

test("назад без клика в промежутке: ни перезагрузки, ни кликов", () => {
  const p = planSettle(CUES, 1.8, 1.2);
  assert.equal(p.reload, false);
  assert.deepEqual(clickLabels(p), []);
  assert.ok(near(p.scrolls[0].p, 0.1));
});

test("прокрутка: до начала 0, после конца 1, нулевой участок 1", () => {
  assert.deepEqual(scrollP(planSettle(CUES, Number.NaN, 5)), [1]);
  const zero: Cue[] = [{ kind: "scroll", at: 1, until: 1, label: "z", target: () => el, left: () => 0 }];
  assert.deepEqual(scrollP(planSettle(zero, Number.NaN, 1)), [1]);
  assert.deepEqual(scrollP(planSettle(zero, Number.NaN, 0.5)), [0]);
});

test("клики с одинаковым at — в порядке объявления", () => {
  const same: Cue[] = [
    { kind: "click", at: 1, label: "первый", target: () => el },
    { kind: "click", at: 1, label: "второй", target: () => el },
  ];
  assert.deepEqual(clickLabels(planSettle(same, Number.NaN, 1)), ["первый", "второй"]);
});

test("resolveTarget: найден — элемент; нет — ошибка со сценой и сигналом", () => {
  assert.equal(resolveTarget(doc, CUES[0], "audit"), el);
  assert.throws(
    () => resolveTarget(doc, { ...CUES[1], target: () => null } as Cue, "audit"),
    /сцена «audit»: не найден элемент «тема» \(сигнал на 2 с\)/,
  );
});

test("cursorPath: скрыт вне окна клика, подъезжает, жмёт, едет от прошлой цели", () => {
  const clicks = [
    { at: 2, x: 100, y: 50 },
    { at: 4, x: 300, y: 80 },
  ];
  const home = { x: 0, y: 0 };
  assert.equal(cursorPath(2 - CURSOR_LEAD - 0.01, clicks, home), null);
  const mid = cursorPath(1.5, clicks, home);
  assert.ok(mid);
  assert.deepEqual(mid.from, home);
  assert.deepEqual(mid.to, { x: 100, y: 50 });
  assert.ok(near(mid.move, 0.5));
  assert.equal(mid.press, 0);
  const pressed = cursorPath(2.3, clicks, home);
  assert.ok(pressed);
  assert.equal(pressed.move, 1);
  assert.ok(near(pressed.press, 0.5));
  assert.equal(cursorPath(2 + CURSOR_TAIL + 0.01, clicks, home), null);
  const second = cursorPath(3.5, clicks, home);
  assert.ok(second);
  assert.deepEqual(second.from, { x: 100, y: 50 });
});
```

- [ ] **Step 3: Убедиться, что тест падает**

Run: `corepack pnpm --filter promo test:film`
Expected: FAIL — `Cannot find module '…/src/film/cues.ts'` (тесты `timeline` — PASS).

- [ ] **Step 4: Реализация**

`Promo/src/film/cues.ts`:

```ts
/**
 * Сигналы сцены-экрана (спецификация §3.5): какие действия выполнить во
 * вложенном экране при переходе к моменту t и где в этот момент курсор фильма.
 *
 * Чистый модуль без импортов — его запускает `node --test`
 * (scripts/film-cues.test.ts). Только «стираемый» TypeScript.
 */

/** Находит элемент во вложенном документе; null — элемента нет. */
export type TargetFn = (doc: Document) => Element | null;

/** Клик в момент `at` (локальное время сцены). `cursor` — показать курсор фильма. */
export interface ClickCue {
  kind: "click";
  at: number;
  label: string;
  target: TargetFn;
  cursor?: boolean;
}

/** Горизонтальная прокрутка на участке [at, until]; `left` — позиция по прогрессу 0..1. */
export interface ScrollCue {
  kind: "scroll";
  at: number;
  until: number;
  label: string;
  target: TargetFn;
  left: (p: number, el: Element) => number;
}

export type Cue = ClickCue | ScrollCue;

export interface SettlePlan {
  /** Перемотка назад через клик: экран перезагружается и проигрывается заново. */
  reload: boolean;
  /** Клики к выполнению, по возрастанию времени. */
  clicks: ClickCue[];
  /** Все прокрутки с прогрессом, зажатым в [0, 1] (идемпотентны). */
  scrolls: { cue: ScrollCue; p: number }[];
}

/**
 * План перехода к моменту t. `applied` — момент прошлого перехода; NaN — экран
 * только что загружен. Вперёд — клики из (applied, t]. Назад — перезагрузка,
 * только если в (t, applied] был клик; тогда — все клики с at ≤ t.
 */
export function planSettle(cues: readonly Cue[], applied: number, t: number): SettlePlan {
  const fresh = Number.isNaN(applied);
  const backward = !fresh && t < applied;
  const reload =
    backward && cues.some((c) => c.kind === "click" && c.at > t && c.at <= applied);
  const from = fresh || reload ? -Infinity : backward ? Infinity : applied;
  const clicks = cues
    .filter((c): c is ClickCue => c.kind === "click" && c.at > from && c.at <= t)
    .sort((a, b) => a.at - b.at);
  const scrolls = cues
    .filter((c): c is ScrollCue => c.kind === "scroll")
    .map((cue) => {
      const span = cue.until - cue.at;
      const raw = span > 0 ? (t - cue.at) / span : t >= cue.at ? 1 : 0;
      return { cue, p: Math.min(1, Math.max(0, raw)) };
    });
  return { reload, clicks, scrolls };
}

/** Элемент сигнала. Не найден — ошибка с именем сцены и сигнала: кадр был бы неверным. */
export function resolveTarget(doc: Document, cue: Cue, sceneKey: string): Element {
  const el = cue.target(doc);
  if (!el) {
    throw new Error(
      `[film] сцена «${sceneKey}»: не найден элемент «${cue.label}» (сигнал на ${cue.at} с)`,
    );
  }
  return el;
}

export interface Point {
  x: number;
  y: number;
}

/** Курсор подъезжает к цели за CURSOR_LEAD с до клика и держится CURSOR_TAIL с после. */
export const CURSOR_LEAD = 0.8;
export const CURSOR_TAIL = 0.6;

export interface CursorPath {
  from: Point;
  to: Point;
  /** Прогресс подъезда 0..1, без плавности — её накладывает отрисовка. */
  move: number;
  /** Прогресс кольца клика 0..1; до момента клика — 0. */
  press: number;
}

/**
 * Где курсор в момент t. `clicks` — клики с курсором по возрастанию `at`, с
 * центрами целей в координатах окна. Вне окон кликов курсор скрыт (null).
 * Подъезд — от цели предыдущего клика, у первого — от `home`.
 */
export function cursorPath(
  t: number,
  clicks: readonly (Point & { at: number })[],
  home: Point,
): CursorPath | null {
  for (let i = 0; i < clicks.length; i++) {
    const c = clicks[i];
    const start = c.at - CURSOR_LEAD;
    if (t < start || t > c.at + CURSOR_TAIL) continue;
    const prev = i > 0 ? clicks[i - 1] : home;
    const move = Math.min(1, Math.max(0, (t - start) / (CURSOR_LEAD * 0.75)));
    const press = t < c.at ? 0 : Math.min(1, (t - c.at) / CURSOR_TAIL);
    return { from: { x: prev.x, y: prev.y }, to: { x: c.x, y: c.y }, move, press };
  }
  return null;
}
```

- [ ] **Step 5: Тесты проходят**

Run: `corepack pnpm --filter promo test:film`
Expected: PASS, `# pass 17`, `# fail 0`.

- [ ] **Step 6: Commit**

```bash
git add Promo/src/film/cues.ts Promo/scripts/film-cues.test.ts Promo/package.json
git commit -m "feat(promo-film): сигналы экрана — план перехода, цели, путь курсора"
```

---

### Task 3: Режим кадра `frame-mode.ts`

**Files:**
- Create: `Promo/src/film/frame-mode.ts`
- Modify: `Promo/src/main.tsx:1` (первая строка — импорт режима кадра)
- Create: `Promo/e2e/film.spec.ts`

**Interfaces:**
- Consumes: —
- Produces: `FILM_NOW: number` (эпоха мс), `isFilmFrame: boolean`. Адрес вложенного экрана: `<BASE_URL>?film-frame=1&film-path=<маршрут>&role=<роль>&user=<id>&theme=light|dark` — от **корня** приложения; режим кадра сам переставляет адрес на `<BASE_URL><маршрут>` до создания роутера. Глубокая ссылка `/<маршрут>?film-frame=1…` тоже работает (локально), но фильм её не использует: на GitHub Pages она идёт через `404.html` и общий для вкладки ключ `sessionStorage.spaRedirect`, и два окна, грузящиеся разом, перепутали бы экраны. Ключи хранилищ приложения, которые засеваются: `sessionStorage.auth = "true"`, `sessionStorage["promo:current-user-id"]`, `sessionStorage["promo:current-role"]`, `localStorage["promo:pref-theme"]`.

- [ ] **Step 1: Написать падающие e2e-тесты**

`Promo/e2e/film.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

/** «Сейчас» режима кадра — FILM_NOW в src/film/frame-mode.ts (= FIXED_NOW e2e). */
const FILM_NOW = Date.parse('2026-09-28T12:00:00+05:00');

function frameUrl(path: string, q: Record<string, string> = {}) {
  const query = new URLSearchParams({
    'film-frame': '1',
    role: 'Коммерческий директор',
    user: 'u-1',
    theme: 'light',
    ...q,
  });
  return `${path}?${query}`;
}

test.describe('режим кадра', () => {
  test('вход из адреса, зафиксированная дата, анимации выключены', async ({ page }) => {
    await page.goto(frameUrl('short-calendar'));
    await expect(page.getByRole('heading', { name: 'Краткий промо-календарь' })).toBeVisible();
    expect(await page.evaluate(() => Date.now())).toBe(FILM_NOW);
    expect(await page.evaluate(() => new Date().getTime())).toBe(FILM_NOW);
    expect(await page.evaluate(() => new Date(2026, 0, 15).getDate())).toBe(15);
    const toggle = page.getByRole('button', { name: 'Переключить тему' });
    expect(await toggle.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
  });

  test('роль, пользователь и тема берутся из адреса', async ({ page }) => {
    await page.goto(frameUrl('audit', { role: 'Администратор', user: 'u-2', theme: 'dark' }));
    await expect(page.getByRole('heading', { name: 'Аудит-лог и контроль сроков' })).toBeVisible();
    await expect(page.getByText('Администратор', { exact: true }).first()).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  });

  test('экран открывается от корня по film-path', async ({ page }) => {
    await page.goto(`?${new URLSearchParams({ 'film-frame': '1', 'film-path': 'audit', role: 'Коммерческий директор', user: 'u-1', theme: 'light' })}`);
    await expect(page.getByRole('heading', { name: 'Аудит-лог и контроль сроков' })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/audit');
  });

  test('кадр не пишет в хранилища вкладки', async ({ page, context }) => {
    await page.goto(frameUrl('short-calendar'));
    await expect(page.getByRole('heading', { name: 'Краткий промо-календарь' })).toBeVisible();
    await page.evaluate(() => localStorage.setItem('film-probe', '1'));
    // Контроль: в памяти кадра запись есть.
    expect(await page.evaluate(() => localStorage.getItem('film-probe'))).toBe('1');
    const other = await context.newPage();
    await other.goto('login');
    expect(await other.evaluate(() => localStorage.getItem('film-probe'))).toBeNull();
  });

  test('без film-frame приложение прежнее', async ({ page }) => {
    await page.goto('short-calendar');
    await expect(page).toHaveURL(/\/login/);
    const drift = Math.abs((await page.evaluate(() => Date.now())) - Date.now());
    expect(drift).toBeLessThan(60_000);
    const submit = page.getByRole('button', { name: 'Войти' });
    expect(await submit.evaluate((el) => getComputedStyle(el).transitionDuration)).not.toBe('0s');
  });
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts`
Expected: FAIL — первые четыре теста (экран уходит на `/login`, заголовка нет); пятый — PASS.

- [ ] **Step 3: Реализация режима кадра**

`Promo/src/film/frame-mode.ts`:

```ts
/**
 * Режим кадра фильма (спецификация §3.2): вложенный экран Promo, который фильм
 * показывает во <iframe>. Включается ТОЛЬКО параметром film-frame=1 в адресе;
 * без него модуль ничего не делает.
 *
 * Импортируется ПЕРВОЙ строкой main.tsx: ES-модули вычисляются в порядке
 * импорта, поэтому подмены ниже действуют раньше любого кода приложения.
 *
 * Адрес: <BASE_URL>?film-frame=1&film-path=<маршрут>&role=<роль>&user=<id>&theme=light|dark
 */

/** «Сейчас» в кадре — тот же момент, что FIXED_NOW в e2e: 28.09.2026 12:00, Ташкент. */
export const FILM_NOW = Date.parse("2026-09-28T12:00:00+05:00");

const params = new URLSearchParams(window.location.search);

export const isFilmFrame = params.get("film-frame") === "1";

/** Хранилище в памяти с API Storage: кадр не видит и не трогает хранилища вкладки. */
class MemoryStorage {
  #items = new Map<string, string>();

  get length(): number {
    return this.#items.size;
  }
  key(index: number): string | null {
    return [...this.#items.keys()][index] ?? null;
  }
  getItem(key: string): string | null {
    return this.#items.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.#items.set(key, String(value));
  }
  removeItem(key: string): void {
    this.#items.delete(key);
  }
  clear(): void {
    this.#items.clear();
  }
}

/** Состояние кадра не зависит от времени: анимаций и переходов приложения нет. */
const FRAME_CSS = `
*, *::before, *::after { animation: none !important; transition: none !important; }
* { scrollbar-width: none !important; }
*::-webkit-scrollbar { display: none !important; }
[data-sonner-toaster] { display: none !important; }
`;

function installFilmFrame(): void {
  // Экран открывается от корня приложения (?film-path=…), а не глубокой ссылкой:
  // на GitHub Pages глубокая ссылка идёт через 404.html и общий для вкладки
  // sessionStorage «spaRedirect» — два окна, грузящиеся разом, перепутали бы
  // экраны. Адрес переставляется до создания роутера (routes.tsx читает его при
  // импорте, а этот модуль импортируется первым).
  const filmPath = params.get("film-path");
  if (filmPath) {
    window.history.replaceState(
      null,
      "",
      `${import.meta.env.BASE_URL}${filmPath}${window.location.search}`,
    );
  }

  const session = new MemoryStorage();
  session.setItem("auth", "true");
  session.setItem("promo:current-user-id", params.get("user") ?? "u-1");
  session.setItem("promo:current-role", params.get("role") ?? "Коммерческий директор");
  const local = new MemoryStorage();
  local.setItem("promo:pref-theme", params.get("theme") === "dark" ? "dark" : "light");
  Object.defineProperty(window, "sessionStorage", { value: session, configurable: true });
  Object.defineProperty(window, "localStorage", { value: local, configurable: true });

  // «Сейчас» зафиксировано: new Date() без аргументов и Date.now(); остальное — как обычно.
  const RealDate = Date;
  RealDate.now = () => FILM_NOW;
  window.Date = new Proxy(RealDate, {
    construct: (target, args, newTarget) =>
      Reflect.construct(target, args.length === 0 ? [FILM_NOW] : args, newTarget),
    apply: () => new RealDate(FILM_NOW).toString(),
  });

  const style = document.createElement("style");
  style.textContent = FRAME_CSS;
  document.head.appendChild(style);
  document.documentElement.dataset.filmFrame = "1";
}

if (isFilmFrame) installFilmFrame();
```

- [ ] **Step 4: Подключить первой строкой `main.tsx`**

`Promo/src/main.tsx` целиком:

```tsx
// Режим кадра фильма — первым: подмены даты и хранилищ до любого кода приложения.
import "./film/frame-mode";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

- [ ] **Step 5: Тесты проходят**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts`
Expected: PASS, 5 passed. Если `transitionDuration` кнопки «Войти» в обычном режиме окажется `0s` (у неё нет перехода), заменить в последнем тесте контроль на кнопку показа пароля или любую кнопку с классом `transition-*` на экране входа — контроль должен доказывать, что обычный режим не выключает переходы.

- [ ] **Step 6: Регрессия всего набора**

Run: `corepack pnpm test:e2e:promo`
Expected: все тесты проходят (141 + 5 новых). Режим кадра не должен влиять ни на один прежний тест.

- [ ] **Step 7: Commit**

```bash
git add Promo/src/film/frame-mode.ts Promo/src/main.tsx Promo/e2e/film.spec.ts
git commit -m "feat(promo-film): режим кадра — вход из адреса, дата и хранилища в памяти, без анимаций"
```

---

### Task 4: Страница фильма, фрагменты «хук» и «логотип»

**Files:**
- Create: `Promo/src/film/types.ts`, `Promo/src/film/palette.ts`, `Promo/src/film/frames.ts`, `Promo/src/film/Caption.tsx`, `Promo/src/film/FilmPage.tsx`, `Promo/src/film/scenes.ts`
- Create: `Promo/src/film/fragments/HookFragment.tsx`, `Promo/src/film/fragments/LogoMark.tsx`, `Promo/src/film/fragments/LogoFragment.tsx`
- Modify: `Promo/src/app/routes.tsx` (ленивый маршрут `/embed/film`)
- Modify: `Promo/src/app/shell-config.tsx:18` и `:52` (`export` у констант логотипа)
- Modify: `Promo/e2e/film.spec.ts` (блок «фильм: запись»)

**Interfaces:**
- Consumes: `buildTimeline`, `sceneAt`, `progress`, `easeOutExpo` (Task 1)
- Produces:
  - `types.ts`: `type Lang = "ru" | "uz"`, `type Aspect = "16x9" | "9x16"`, `STAGE: Record<Aspect, { w: number; h: number }>`, `interface SceneProps { t; duration; aspect; lang }`, `interface FragmentScene { kind: "fragment"; key; duration; caption?: Record<Lang, string>; Component: ComponentType<SceneProps> }`, `type FilmScene = FragmentScene` (Task 6 расширит), `interface CaptureApi`, глобальный `window.__capture?: CaptureApi`
  - `palette.ts`: `FILM = { stage, text, muted, accent, card, shadow }`
  - `frames.ts`: `nextFrames(win: Window, n: number): Promise<void>`
  - `Caption({ text, t, duration })`
  - `LogoMark({ height })`
  - `SCENES: FilmScene[]`
  - маршрут `/embed/film?capture=1&lang=ru|uz&aspect=16x9`

- [ ] **Step 1: Написать падающие e2e-тесты**

Дописать в `Promo/e2e/film.spec.ts` (импорт — заменить первую строку на `import { test, expect, type Page } from '@playwright/test';`):

```ts
type Capture = {
  duration: number;
  chapters: { key: string; at: number; end: number }[];
  seek(t: number): Promise<void>;
};
declare global {
  interface Window {
    __capture?: Capture;
  }
}

async function openFilm(page: Page, query = '') {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`embed/film?capture=1${query}`);
  await page.waitForFunction(() => !!window.__capture);
}
const seek = (page: Page, t: number) => page.evaluate((t) => window.__capture!.seek(t), t);
const chapters = (page: Page) => page.evaluate(() => window.__capture!.chapters);
async function shotAt(page: Page, t: number) {
  await seek(page, t);
  return page.screenshot();
}
const same = (a: Buffer, b: Buffer) => Buffer.compare(a, b) === 0;

test.describe('фильм: запись', () => {
  test('__capture: главы подряд от «hook», длительность — конец последней', async ({ page }) => {
    await openFilm(page);
    const cap = await page.evaluate(() => ({
      duration: window.__capture!.duration,
      chapters: window.__capture!.chapters,
    }));
    expect(cap.chapters[0]).toMatchObject({ key: 'hook', at: 0 });
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
    await expect(page.getByText('9 ролей.')).toBeVisible();
    expect(await page.evaluate(() => window.__capture)).toBeUndefined();
    await expect(page.getByText('Сотни позиций.')).toBeVisible({ timeout: 5_000 });
  });
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts -g "фильм: запись"`
Expected: FAIL — `/embed/film` без маршрута уводит на `/login`, `waitForFunction` истекает.

- [ ] **Step 3: Экспорт логотипа**

В `Promo/src/app/shell-config.tsx` заменить `const TexnomartLogoFull = (` на `export const TexnomartLogoFull = (` и `const TexnomartLogoIcon = (` на `export const TexnomartLogoIcon = (`. Больше в файле ничего не менять.

- [ ] **Step 4: Типы, палитра, кадры**

`Promo/src/film/types.ts`:

```ts
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
```

`Promo/src/film/palette.ts`:

```ts
/** Цвета фильма — точные hex через style (правило .claude/rules/design.md). */
export const FILM = {
  stage: "#0E0E10",
  text: "#FFFFFF",
  muted: "#A1A1AA",
  /** Фирменный жёлтый — только акцент: линии, кольцо курсора, полосы. */
  accent: "#FFD60A",
  card: "#FFFFFF",
  shadow: "0 40px 120px rgba(0, 0, 0, 0.55)",
} as const;
```

`Promo/src/film/frames.ts`:

```ts
/** Ждёт n кадров отрисовки окна: после этого изменения DOM уже на экране. */
export function nextFrames(win: Window, n: number): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) => {
      if (left === 0) resolve();
      else win.requestAnimationFrame(() => step(left - 1));
    };
    step(n);
  });
}
```

- [ ] **Step 5: Подпись сцены**

`Promo/src/film/Caption.tsx`:

```tsx
"use client";

import { FILM } from "./palette";
import { easeOutExpo, progress } from "./timeline";

interface CaptionProps {
  text: string;
  /** Локальное время сцены. */
  t: number;
  duration: number;
}

/**
 * Подпись сцены внизу слева: въезжает с 0,3 по 0,7 с, гаснет за 0,3 с до конца.
 * Под ней — затемнение снизу, чтобы белый текст читался и поверх светлого экрана.
 */
export function Caption({ text, t, duration }: CaptionProps) {
  const enter = progress(t, 0.3, 0.7, easeOutExpo);
  const leave = progress(t, duration - 0.3, duration);
  const opacity = enter * (1 - leave);
  if (opacity <= 0) return null;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 360,
          opacity,
          background: `linear-gradient(to top, ${FILM.stage}E6, ${FILM.stage}00)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 96,
          bottom: 88,
          opacity,
          transform: `translateY(${(1 - enter) * 24}px)`,
        }}
      >
        <div
          style={{
            width: 56 * enter,
            height: 6,
            borderRadius: 3,
            background: FILM.accent,
            marginBottom: 20,
          }}
        />
        <p
          style={{
            margin: 0,
            maxWidth: 1200,
            color: FILM.text,
            fontSize: 52,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          {text}
        </p>
      </div>
    </>
  );
}
```

- [ ] **Step 6: Фрагменты «хук» и «логотип»**

`Promo/src/film/fragments/HookFragment.tsx`:

```tsx
"use client";

import { FILM } from "../palette";
import { easeOutExpo, progress } from "../timeline";
import type { Lang, SceneProps } from "../types";

/** Титры (переводятся). Узбекский — черновой перевод, нужна проверка носителем. */
const PHRASES: Record<Lang, string[]> = {
  ru: ["9 ролей.", "Сотни позиций.", "Каждая — через согласование."],
  uz: ["9 ta rol.", "Yuzlab pozitsiyalar.", "Har biri — kelishuv orqali."],
};

/** Фраза держится 1 с (два удара) и сменяет предыдущую на сильную долю. */
const STEP = 1;

export function HookFragment({ t, lang }: SceneProps) {
  const phrases = PHRASES[lang];
  const i = Math.min(phrases.length - 1, Math.floor(t / STEP));
  const enter = progress(t, i * STEP, i * STEP + 0.35, easeOutExpo);
  const underline = progress(t, i * STEP + 0.1, i * STEP + 0.6, easeOutExpo);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: 160 }}>
      <div style={{ opacity: enter, transform: `translateY(${(1 - enter) * 48}px)` }}>
        <p
          style={{
            margin: 0,
            maxWidth: 1600,
            color: FILM.text,
            fontSize: 132,
            fontWeight: 700,
            letterSpacing: "-0.035em",
            lineHeight: 1.02,
          }}
        >
          {phrases[i]}
        </p>
        <div
          style={{
            marginTop: 36,
            height: 10,
            width: 220 * underline,
            borderRadius: 5,
            background: FILM.accent,
          }}
        />
      </div>
    </div>
  );
}
```

`Promo/src/film/fragments/LogoMark.tsx`:

```tsx
"use client";

import * as React from "react";
import { TexnomartLogoFull } from "../../app/shell-config";
import { FILM } from "../palette";

/** Логотип из шапки приложения + «Promo» фирменным жёлтым. */
export function LogoMark({ height }: { height: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: height * 0.23, color: FILM.text }}>
      <div style={{ height }}>
        {React.cloneElement(TexnomartLogoFull, { className: "h-full w-auto" })}
      </div>
      <span
        style={{
          color: FILM.accent,
          fontSize: height * 0.8,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 0.82,
        }}
      >
        Promo
      </span>
    </div>
  );
}
```

`Promo/src/film/fragments/LogoFragment.tsx`:

```tsx
"use client";

import { FILM } from "../palette";
import { easeOutExpo, progress } from "../timeline";
import type { SceneProps } from "../types";
import { LogoMark } from "./LogoMark";

/** Жёлтая линия прочерчивает кадр, над ней собирается логотип. */
export function LogoFragment({ t }: SceneProps) {
  const line = progress(t, 0, 0.6, easeOutExpo);
  const logo = progress(t, 0.35, 1.0, easeOutExpo);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ opacity: logo, transform: `scale(${0.92 + 0.08 * logo})` }}>
        <LogoMark height={120} />
      </div>
      <div style={{ marginTop: 48, height: 8, width: 760 * line, borderRadius: 4, background: FILM.accent }} />
    </div>
  );
}
```

- [ ] **Step 7: Сценарий (пока две сцены)**

`Promo/src/film/scenes.ts`:

```ts
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
```

- [ ] **Step 8: Страница фильма (фрагменты)**

`Promo/src/film/FilmPage.tsx`:

```tsx
"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { Caption } from "./Caption";
import { nextFrames } from "./frames";
import { FILM } from "./palette";
import { SCENES } from "./scenes";
import { buildTimeline, sceneAt } from "./timeline";
import { STAGE, type Aspect, type Lang } from "./types";

/** Холст вписывается в окно (просмотр) или совпадает с ним (запись). */
function useFit(stage: { w: number; h: number }, capture: boolean) {
  const calc = React.useCallback(() => {
    if (capture) return { scale: 1, left: 0, top: 0 };
    const scale = Math.min(window.innerWidth / stage.w, window.innerHeight / stage.h);
    return {
      scale,
      left: (window.innerWidth - stage.w * scale) / 2,
      top: (window.innerHeight - stage.h * scale) / 2,
    };
  }, [stage, capture]);
  const [fit, setFit] = React.useState(calc);
  React.useEffect(() => {
    const onResize = () => setFit(calc());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [calc]);
  return fit;
}

/**
 * Страница-фильм /embed/film (спецификация §3.4). Кадр — чистая функция от t.
 * ?capture=1 — запись: отдаёт window.__capture; иначе фильм играет в цикле.
 */
export function FilmPage() {
  const params = React.useMemo(() => new URLSearchParams(window.location.search), []);
  const capture = params.get("capture") === "1";
  const lang: Lang = params.get("lang") === "uz" ? "uz" : "ru";
  const aspect: Aspect = params.get("aspect") === "9x16" ? "9x16" : "16x9";
  const stage = STAGE[aspect];
  const timeline = React.useMemo(() => buildTimeline(SCENES), []);
  const [t, setT] = React.useState(0);
  const fit = useFit(stage, capture);

  // Фильм показывает приложение светлым: класс .dark на <html> перекрасил бы
  // бейджи фрагментов. Страница грузится лениво — после эффекта ThemeProvider,
  // поэтому снятие класса здесь не перебивается.
  React.useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  React.useEffect(() => {
    if (!capture) return;
    let queue: Promise<void> = Promise.resolve();
    const seekTo = async (to: number) => {
      flushSync(() => setT(to));
      await document.fonts.ready;
      await nextFrames(window, 2);
    };
    window.__capture = {
      duration: timeline.duration,
      chapters: timeline.chapters,
      seek(to: number) {
        const run = queue.catch(() => undefined).then(() => seekTo(to));
        queue = run;
        return run;
      },
    };
    return () => {
      delete window.__capture;
    };
  }, [capture, timeline]);

  React.useEffect(() => {
    if (capture) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT(((now - start) / 1000) % timeline.duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [capture, timeline]);

  const { index, local } = sceneAt(timeline, t);
  const current = SCENES[index];
  const SceneView = current.Component;

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: FILM.stage }}>
      <div
        style={{
          position: "absolute",
          left: fit.left,
          top: fit.top,
          width: stage.w,
          height: stage.h,
          overflow: "hidden",
          transformOrigin: "0 0",
          transform: `scale(${fit.scale})`,
          background: FILM.stage,
        }}
      >
        <SceneView key={current.key} t={local} duration={current.duration} aspect={aspect} lang={lang} />
        {current.caption && <Caption text={current.caption[lang]} t={local} duration={current.duration} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Маршрут**

В `Promo/src/app/routes.tsx` первым элементом массива `createBrowserRouter([` вставить:

```tsx
  {
    // Моушн-фильм для внешнего показа (src/film/, спецификация 2026-09-30).
    // Вне защищённой части: вложенные экраны фильма входят сами, в режиме кадра.
    path: "/embed/film",
    lazy: async () => ({ Component: (await import("../film/FilmPage")).FilmPage }),
  },
```

- [ ] **Step 10: Тесты проходят**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts`
Expected: PASS, 9 passed.

- [ ] **Step 11: Визуальная проверка**

Запустить dev-сервер в фоне (`corepack pnpm dev:promo`, запомнить PID), открыть через Playwright MCP `http://localhost:5173/embed/film?capture=1` во вьюпорте 1920×1080, в консоли `await __capture.seek(0.5)`, снимок; то же для 2.5 и 4.5. Проверить: фразы хука не обрезаны, третья («Каждая — через согласование.») в две строки целиком; линия под фразой жёлтая; логотип белый, «Promo» жёлтым, по центру, под ним жёлтая линия. Остановить dev-сервер по PID.

- [ ] **Step 12: Commit**

```bash
git add Promo/src/film Promo/src/app/routes.tsx Promo/src/app/shell-config.tsx Promo/e2e/film.spec.ts
git commit -m "feat(promo-film): страница /embed/film с __capture, фрагменты «хук» и «логотип»"
```

---

### Task 5: Скрипт записи `record-film.mjs`

**Files:**
- Create: `Promo/scripts/record-film.mjs`
- Modify: `Promo/package.json` (скрипт `film`), `package.json` (корень: `film:promo`), `.gitignore`

**Interfaces:**
- Consumes: `window.__capture` (Task 4)
- Produces: команда `corepack pnpm film:promo [--lang ru|uz] [--chapter key] [--stills t1,t2] [--audio file] [--4k] [--codec h264|hevc|prores] [--crf n] [--fps n] [--base url] [--out file]`; файлы в `Promo/film-out/`: `film-<lang>-16x9[-<chapter>][-4k].mp4|.mov`, кадры `film-<lang>-16x9-<t>.png`.

- [ ] **Step 1: Скрипты и игнор**

`Promo/package.json`, в `"scripts"`:

```json
    "film": "node scripts/record-film.mjs",
```

Корневой `package.json`, после `"test:e2e:promo"`:

```json
    "film:promo": "pnpm --filter promo film",
```

`.gitignore`, в конец секции `# Playwright e2e (Promo)`:

```
# Моушн-фильм Promo: готовые ролики и кадры
Promo/film-out/
```

- [ ] **Step 2: Скрипт записи**

`Promo/scripts/record-film.mjs`:

```js
// Записывает моушн-фильм Promo (страница /embed/film, src/film/) в MP4 — без
// видеоредактора и без лишних пакетов: headless Chrome по протоколу DevTools
// ставит каждый кадр на точный момент (window.__capture.seek), снимает PNG,
// ffmpeg собирает видео. Образец — record-tour.mjs; спецификация —
// docs/superpowers/specs/2026-09-30-promo-motion-film-design.md.
//
//   corepack pnpm film:promo                        # film-out/film-ru-16x9.mp4
//   corepack pnpm film:promo --lang uz
//   corepack pnpm film:promo --chapter change       # одна сцена
//   corepack pnpm film:promo --audio D:\music.mp3   # с треком, затухание в конце
//   corepack pnpm film:promo --4k                   # 3840×2160
//   corepack pnpm film:promo --stills 1.2,8,23      # кадры PNG, без видео
//
// Dev-сервер Promo должен быть запущен (corepack pnpm dev:promo).
// Параметры: --base http://localhost:5173 (dev-сервер или деплой GitHub Pages),
// --out файл, --fps (60), --aspect 16x9 (9x16 — второй этап), --4k,
// --codec h264|hevc|prores (H.264 играет везде; HEVC — 10 бит и меньше;
// ProRes 4444 — мастер для монтажа, .mov), --crf, --audio.
// Chrome: $CHROME или стандартные пути Windows/macOS/Linux; ffmpeg: $FFMPEG или PATH.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

// «pnpm film:promo -- --lang ru» передаёт «--» скрипту: без этой строки
// parseArgs счёл бы всё после него позиционными аргументами.
const argv = process.argv.slice(2);
if (argv[0] === "--") argv.shift();

const { values: opt } = parseArgs({
  args: argv,
  options: {
    lang: { type: "string", default: "ru" },
    aspect: { type: "string", default: "16x9" },
    base: { type: "string", default: "http://localhost:5173" },
    chapter: { type: "string" },
    out: { type: "string" },
    fps: { type: "string", default: "60" },
    stills: { type: "string" },
    audio: { type: "string" },
    "4k": { type: "boolean", default: false },
    codec: { type: "string", default: "h264" },
    crf: { type: "string" },
  },
});

if (!["ru", "uz"].includes(opt.lang)) throw new Error(`--lang ru|uz, а не ${opt.lang}`);
// Раскладки сцен пока только под 16:9; 9:16 — второй этап (спецификация §6).
if (opt.aspect !== "16x9") {
  throw new Error(`--aspect: сейчас только 16x9 (9x16 — второй этап), а не ${opt.aspect}`);
}
const [width, height] = { "16x9": [1920, 1080], "9x16": [1080, 1920] }[opt.aspect];
// 4K — тот же холст, нарисованный вдвое плотнее.
const scale = opt["4k"] ? 2 : 1;
const fps = Number(opt.fps);
if (!(fps > 0)) throw new Error(`--fps: положительное число, а не ${opt.fps}`);
const codec = opt.codec;
const pix = { h264: "yuv420p", hevc: "yuv420p10le", prores: "yuva444p10le" }[codec];
if (!pix) throw new Error(`--codec h264|hevc|prores, а не ${codec}`);

// pnpm запускает скрипт из Promo/: пути пользователя — от папки, где он набрал команду.
const userPath = (p) => resolve(process.env.INIT_CWD ?? process.cwd(), p);
const OUT_DIR = resolve(import.meta.dirname, "..", "film-out");
mkdirSync(OUT_DIR, { recursive: true });

const CHROMES = [
  process.env.CHROME,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.LOCALAPPDATA &&
    join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"),
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const chromePath = CHROMES.find((p) => existsSync(p));
if (!chromePath) throw new Error("Chrome не найден: задайте CHROME=путь\\к\\chrome.exe");

const ffmpegPath = process.env.FFMPEG ?? "ffmpeg";
if (!opt.stills && spawnSync(ffmpegPath, ["-version"]).error) {
  throw new Error(
    "ffmpeg не найден: установите его (winget install Gyan.FFmpeg) или задайте FFMPEG=путь\\к\\ffmpeg.exe",
  );
}

// ---- Chrome и протокол DevTools ----
const profile = mkdtempSync(join(tmpdir(), "promo-film-"));
const chrome = spawn(chromePath, [
  "--headless=new",
  "--remote-debugging-port=0",
  `--user-data-dir=${profile}`,
  "--hide-scrollbars",
  "--mute-audio",
  "--no-first-run",
  "--no-default-browser-check",
  "--force-color-profile=srgb",
  `--window-size=${width},${height}`,
  "about:blank",
]);
// Любой выход (в том числе с ошибкой) не оставляет Chrome висеть.
process.on("exit", () => {
  try {
    chrome.kill();
  } catch {
    /* уже закрыт */
  }
});
const wsUrl = await new Promise((resolve, reject) => {
  let log = "";
  chrome.stderr.on("data", (d) => {
    log += d;
    const m = /DevTools listening on (ws:\/\/\S+)/.exec(log);
    if (m) resolve(m[1]);
  });
  chrome.on("exit", () => reject(new Error(`Chrome завершился:\n${log}`)));
});

const ws = new WebSocket(wsUrl);
await new Promise((ok) => ws.addEventListener("open", ok, { once: true }));
let nextId = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  const p = pending.get(msg.id);
  if (!p) return;
  pending.delete(msg.id);
  if (msg.error) p.reject(new Error(msg.error.message));
  else p.resolve(msg.result);
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const page = (method, params) => send(method, params, sessionId);
const evaluate = async (expression) => {
  const r = await page("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception?.description ?? expression);
  }
  return r.result.value;
};

await page("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: scale,
  mobile: false,
});
await page("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-color-scheme", value: "light" }],
});
// Даты в кадре не зависят от машины: часовой пояс — как в e2e.
await page("Emulation.setTimezoneOverride", { timezoneId: "Asia/Tashkent" });

const query = new URLSearchParams({ capture: "1", lang: opt.lang, aspect: opt.aspect });
const url = `${opt.base.replace(/\/+$/, "")}/embed/film?${query}`;
const nav = await page("Page.navigate", { url });
if (nav.errorText) {
  throw new Error(
    `не открылась ${url} (${nav.errorText}) — запущен ли dev-сервер Promo: corepack pnpm dev:promo?`,
  );
}
console.log(`запись ${url}`);

// Страница готова, когда фильм отвечает и шрифты загружены.
const ready = async () => {
  for (let i = 0; ; i++) {
    if (await evaluate("!!window.__capture").catch(() => false)) return;
    if (i > 600) throw new Error(`страница не загрузилась за 60 с: ${url}`);
    await new Promise((r) => setTimeout(r, 100));
  }
};
await ready();
await evaluate("document.fonts.ready.then(() => true)");
const { duration, chapters } = await evaluate(
  "({ duration: window.__capture.duration, chapters: window.__capture.chapters })",
);
console.log(chapters.map((c) => `${c.key} ${c.at.toFixed(1)}–${c.end.toFixed(1)} с`).join(" · "));
const chapter = opt.chapter ? chapters.find((c) => c.key === opt.chapter) : undefined;
if (opt.chapter && !chapter) {
  throw new Error(`--chapter: нет главы «${opt.chapter}»; есть: ${chapters.map((c) => c.key).join(", ")}`);
}
const from = chapter?.at ?? 0;
const to = chapter?.end ?? duration;

// PNG — без потерь до кодека; быстрый zlib важен в 4K (8 млн пикселей на кадр).
const shot = async () =>
  Buffer.from(
    (await page("Page.captureScreenshot", { format: "png", optimizeForSpeed: true })).data,
    "base64",
  );
// Dev-сервер перезагружает страницу при правке файла: дождаться и нарисовать
// кадр заново, а не потерять запись.
const seek = async (t) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await evaluate(`window.__capture.seek(${t})`);
    } catch (e) {
      if (attempt > 2) throw e;
      await ready();
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
};

// Вложенные экраны грузятся по требованию: дать им загрузиться до первого кадра.
await seek(from);
await new Promise((r) => setTimeout(r, 1500));

if (opt.stills) {
  for (const t of opt.stills.split(",").map(Number)) {
    // Проиграть подход к моменту: то, что входило перед ним, успевает войти.
    for (let x = Math.max(0, t - 2); x < t; x += 1 / 15) await seek(x);
    await seek(t);
    const file = join(OUT_DIR, `film-${opt.lang}-${opt.aspect}-${t}.png`);
    writeFileSync(file, await shot());
    console.log(`кадр ${file}`);
  }
} else {
  const big = opt["4k"];
  const out = opt.out
    ? userPath(opt.out)
    : join(
        OUT_DIR,
        `film-${opt.lang}-${opt.aspect}${opt.chapter ? `-${opt.chapter}` : ""}${big ? "-4k" : ""}${codec === "prores" ? ".mov" : ".mp4"}`,
      );
  const length = to - from;
  // Трек обрезается по картинке и затухает последние 2 с.
  const audio = opt.audio
    ? [
        "-i",
        userPath(opt.audio),
        "-af",
        `afade=t=out:st=${Math.max(0, length - 2)}:d=2`,
        ...(codec === "prores" ? ["-c:a", "pcm_s16le"] : ["-c:a", "aac", "-b:a", "256k"]),
        "-shortest",
      ]
    : [];
  // Скриншоты — sRGB: перевести матрицей HD (BT.709) и записать это в файл, иначе
  // плееры сдвигают цвета; aq-mode 3 тратит биты на тёмные зоны, где иначе полосит.
  const colour = [
    "scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int",
    `format=${pix}`,
    "setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709",
  ];
  const crf = opt.crf ?? (codec === "hevc" ? "16" : big ? "14" : "18");
  const encoder = {
    h264: ["-c:v", "libx264", "-preset", "slow", "-crf", crf, "-profile:v", "high", "-x264-params", "aq-mode=3"],
    hevc: ["-c:v", "libx265", "-preset", "slow", "-crf", crf, "-tag:v", "hvc1", "-x265-params", "aq-mode=3:log-level=error"],
    prores: ["-c:v", "prores_ks", "-profile:v", "4444", "-vendor", "apl0"],
  }[codec];
  const ffmpeg = spawn(
    ffmpegPath,
    [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "image2pipe",
      "-framerate",
      String(fps),
      "-c:v",
      "png",
      "-i",
      "-",
      ...audio,
      "-vf",
      colour.join(","),
      ...encoder,
      "-movflags",
      "+faststart",
      out,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const frames = Math.ceil(length * fps);
  const started = Date.now();
  for (let i = 0; i <= frames; i++) {
    await seek(from + i / fps);
    const png = await shot();
    if (!ffmpeg.stdin.write(png)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
    if (i % fps === 0) {
      process.stdout.write(
        `\r${Math.round((i / frames) * 100)}% · ${Math.round((Date.now() - started) / 1000)} с`,
      );
    }
  }
  ffmpeg.stdin.end();
  const code = await new Promise((r) => ffmpeg.on("exit", r));
  if (code !== 0) throw new Error(`ffmpeg завершился с кодом ${code}`);
  console.log(
    `\nзаписан ${out} (${length.toFixed(1)} с, ${width * scale}×${height * scale}, ${fps} к/с, ${codec})`,
  );
}

ws.close();
chrome.kill();
await new Promise((r) => chrome.once("exit", r));
rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
```

- [ ] **Step 3: Кадры (без ffmpeg)**

Запустить dev-сервер в фоне: `corepack pnpm dev:promo` (запомнить PID; если порт 5173 занят, Vite возьмёт следующий — тогда во всех командах ниже добавить `--base http://localhost:<порт>`).

Run: `corepack pnpm film:promo --stills 0.5,2.5,4.5`
Expected: вывод `hook 0.0–3.0 с · logo 3.0–5.0 с`, три строки `кадр …\film-out\film-ru-16x9-<t>.png`. Открыть PNG (Read) — те же критерии, что в Task 4, шаг 11; размер кадра 1920×1080.

- [ ] **Step 4: Отказы (Review Focus 1, 2, 5)**

Run: `corepack pnpm film:promo -- --stills 1 --lang uz`
Expected: кадр `film-uz-16x9-1.png` с фразой «9 ta rol.» — `--` не ломает разбор параметров.

Run: `corepack pnpm film:promo --stills 1 --chapter nope`
Expected: ошибка `--chapter: нет главы «nope»; есть: hook, logo`, код выхода не 0, процессов `chrome.exe` с профилем `promo-film-` не осталось (проверить `Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object CommandLine -like '*promo-film-*'` — пусто).

Run: `corepack pnpm film:promo --stills 1 --base http://localhost:1`
Expected: за несколько секунд — `не открылась http://localhost:1/embed/film?… (net::ERR_CONNECTION_REFUSED) — запущен ли dev-сервер Promo: corepack pnpm dev:promo?`.

Run: `corepack pnpm film:promo --stills 1 --aspect 9x16`
Expected: `--aspect: сейчас только 16x9 (9x16 — второй этап), а не 9x16`.

- [ ] **Step 5: ffmpeg**

Run: `ffmpeg -version`. Если команда не найдена — **остановиться и спросить пользователя** разрешения на `winget install Gyan.FFmpeg` (установка в систему). После установки новый PATH текущим оболочкам не виден: найти путь — `Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Links\ffmpeg.exe"` (или `Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter ffmpeg.exe | Select-Object -First 1`) и дальше передавать `$env:FFMPEG = '<путь>'`.

- [ ] **Step 6: Короткое видео**

Run: `corepack pnpm film:promo --chapter hook`
Expected: `записан …\film-out\film-ru-16x9-hook.mp4 (3.0 с, 1920×1080, 60 к/с, h264)`.

Run: `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,pix_fmt,color_space -of default=nw=1 Promo/film-out/film-ru-16x9-hook.mp4` (ffprobe лежит рядом с ffmpeg)
Expected: `width=1920`, `height=1080`, `r_frame_rate=60/1`, `pix_fmt=yuv420p`, `color_space=bt709`.

Остановить dev-сервер по PID.

- [ ] **Step 7: Commit**

```bash
git add Promo/scripts/record-film.mjs Promo/package.json package.json .gitignore
git commit -m "feat(promo-film): покадровая запись фильма в MP4 (Chrome DevTools + ffmpeg)"
```

---

### Task 6: Сцена «экран» и первый экран «План»

**Files:**
- Create: `Promo/src/film/ScreenScene.tsx`, `Promo/src/film/screens.ts`
- Modify: `Promo/src/film/types.ts` (сцена-экран), `Promo/src/film/FilmPage.tsx` (целиком), `Promo/src/film/scenes.ts` (+ `plan`)
- Modify: `Promo/e2e/film.spec.ts` (блок «фильм: сцены-экраны»)

**Interfaces:**
- Consumes: `planSettle`, `resolveTarget`, `cursorPath`, `CURSOR_LEAD`, `ClickCue`, `CursorPath`, `Point`, `Cue`, `TargetFn` (Task 2); `keyframes`, `Key`, `easeInOutCubic`, `easeOutExpo`, `lerp` (Task 1); `nextFrames`, `FILM`, `Caption` (Task 4); `PromoRole` из `Promo/src/app/role-context.tsx`
- Produces:
  - `types.ts`: `type CameraPose = { cx; cy; zoom; rx; ry; opacity }` (все `number`), `interface ScreenSpec { path; role: PromoRole; user; theme: "light" | "dark"; ready: { label: string; target: TargetFn }; camera: Key<CameraPose>[]; cues: Cue[]; home: Point }`, `interface ScreenSceneDef { kind: "screen"; key; duration; caption?; screen: ScreenSpec }`, `type FilmScene = FragmentScene | ScreenSceneDef`
  - `ScreenScene.tsx`: `FRAME_W = 1440`, `FRAME_H = 900`, `interface ScreenHandle { settle(local: number): Promise<void> }`, `ScreenScene` (forwardRef, props `{ scene; t; stage; hidden }`), iframe с `title={scene.key}`
  - `screens.ts`: `WHOLE: CameraPose`, `h1(text)`, `PLAN_SCREEN: ScreenSpec`

- [ ] **Step 1: Написать падающий e2e-тест**

Дописать в `Promo/e2e/film.spec.ts`:

```ts
test.describe('фильм: сцены-экраны', () => {
  test.setTimeout(120_000);

  test('plan: живой экран, кадр детерминирован, хранилища вкладки чистые', async ({ page }) => {
    await openFilm(page);
    const plan = (await chapters(page)).find((c) => c.key === 'plan')!;
    const a = await shotAt(page, plan.at + 4);
    await seek(page, plan.at + 5.5);
    await seek(page, plan.at + 1);
    const b = await shotAt(page, plan.at + 4);
    expect(same(a, b)).toBe(true);
    const c = await shotAt(page, plan.at + 4.5);
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
});
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts -g "сцены-экраны"`
Expected: FAIL — главы `plan` нет (`Cannot read properties of undefined (reading 'at')`).

- [ ] **Step 3: Типы сцены-экрана**

В `Promo/src/film/types.ts`: добавить импорты и типы, заменить `FilmScene`:

```ts
import type { ComponentType } from "react";
import type { PromoRole } from "../app/role-context";
import type { Cue, Point, TargetFn } from "./cues";
import type { Key } from "./timeline";
```

```ts
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
```

- [ ] **Step 4: Сцена «экран»**

`Promo/src/film/ScreenScene.tsx`:

```tsx
"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import {
  CURSOR_LEAD,
  cursorPath,
  planSettle,
  resolveTarget,
  type ClickCue,
  type CursorPath,
  type Point,
} from "./cues";
import { nextFrames } from "./frames";
import { FILM } from "./palette";
import { easeInOutCubic, keyframes, lerp } from "./timeline";
import type { ScreenSceneDef } from "./types";

/** Вьюпорт вложенного экрана — как у e2e и скриншотов. */
export const FRAME_W = 1440;
export const FRAME_H = 900;
const READY_TIMEOUT_MS = 15_000;

export interface ScreenHandle {
  /** Привести экран к локальному моменту сцены; выполняется, когда кадр готов. */
  settle(local: number): Promise<void>;
}

interface ScreenSceneProps {
  scene: ScreenSceneDef;
  /** Локальное время сцены. */
  t: number;
  stage: { w: number; h: number };
  /** Предзагрузка: окно грузится заранее, но не видно. */
  hidden: boolean;
}

/**
 * Адрес окна — от корня приложения, маршрут в film-path (режим кадра сам
 * переставит адрес): глубокая ссылка на GitHub Pages шла бы через 404.html.
 * BASE_URL — «/» локально и «/Texnomart/promo/» на GitHub Pages.
 */
function frameUrl(scene: ScreenSceneDef): string {
  const { path, role, user, theme } = scene.screen;
  const query = new URLSearchParams({ "film-frame": "1", "film-path": path, role, user, theme });
  return `${import.meta.env.BASE_URL}?${query}`;
}

/**
 * Документ окна, когда экран отрисован (есть элемент `ready`). `stale` — прежний
 * документ при перезагрузке: пока навигация не завершилась, окно отдаёт его.
 */
async function waitReady(
  frame: HTMLIFrameElement,
  scene: ScreenSceneDef,
  stale: Document | null,
): Promise<Document> {
  const started = performance.now();
  for (;;) {
    const doc = frame.contentDocument;
    if (doc && doc !== stale && doc.readyState !== "loading" && scene.screen.ready.target(doc)) {
      await doc.fonts.ready;
      return doc;
    }
    if (performance.now() - started > READY_TIMEOUT_MS) {
      throw new Error(
        `[film] сцена «${scene.key}»: экран не отрисовался за ${READY_TIMEOUT_MS / 1000} с (ждал «${scene.screen.ready.label}»)`,
      );
    }
    await new Promise((r) => setTimeout(r, 50));
  }
}

/** Полная последовательность указателя: вкладки Radix срабатывают по mousedown, меню — по pointerdown. */
function pointerClick(el: Element): void {
  const win = el.ownerDocument.defaultView;
  if (!win) return;
  const r = el.getBoundingClientRect();
  const base = {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: win,
    button: 0,
    clientX: r.left + r.width / 2,
    clientY: r.top + r.height / 2,
  };
  const pointer = { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true };
  el.dispatchEvent(new win.PointerEvent("pointerdown", { ...pointer, buttons: 1 }));
  el.dispatchEvent(new win.MouseEvent("mousedown", { ...base, buttons: 1 }));
  el.dispatchEvent(new win.PointerEvent("pointerup", { ...pointer, buttons: 0 }));
  el.dispatchEvent(new win.MouseEvent("mouseup", { ...base, buttons: 0 }));
  el.dispatchEvent(new win.MouseEvent("click", { ...base, buttons: 0 }));
}

/** Курсор фильма: одного размера при любом наезде камеры, жёлтое кольцо на клике. */
function FilmCursor({ path, zoom }: { path: CursorPath; zoom: number }) {
  const m = easeInOutCubic(path.move);
  const x = lerp(path.from.x, path.to.x, m);
  const y = lerp(path.from.y, path.to.y, m);
  const ring = 16 + 56 * path.press;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        pointerEvents: "none",
        transformOrigin: "0 0",
        transform: `translate(${x}px, ${y}px) scale(${1.3 / zoom})`,
      }}
    >
      {path.press > 0 && path.press < 1 && (
        <div
          style={{
            position: "absolute",
            left: -ring / 2,
            top: -ring / 2,
            width: ring,
            height: ring,
            borderRadius: "50%",
            border: `3px solid ${FILM.accent}`,
            opacity: 1 - path.press,
          }}
        />
      )}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        style={{
          position: "absolute",
          left: -4,
          top: -3,
          overflow: "visible",
          filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35))",
        }}
      >
        <path
          d="M4 3 L4 23 L9.5 17.5 L13.5 26 L17 24.5 L13 16 L21 16 Z"
          fill="#111111"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Сцена «экран» (спецификация §3.5): живой экран Promo во <iframe> в режиме
 * кадра, камера — transform окна, курсор и сигналы — поверх.
 */
export const ScreenScene = React.forwardRef<ScreenHandle, ScreenSceneProps>(function ScreenScene(
  { scene, t, stage, hidden },
  ref,
) {
  const { camera, cues, home } = scene.screen;
  const src = React.useMemo(() => frameUrl(scene), [scene]);
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const ready = React.useRef<Promise<Document> | null>(null);
  const applied = React.useRef(Number.NaN);
  const busy = React.useRef<Promise<void> | null>(null);
  const wanted = React.useRef<number | null>(null);
  const [points, setPoints] = React.useState<(Point & { at: number })[]>([]);
  const cursorClicks = React.useMemo(
    () => cues.filter((c): c is ClickCue => c.kind === "click" && c.cursor === true),
    [cues],
  );

  const run = React.useCallback(
    async (local: number) => {
      const frame = frameRef.current;
      if (!frame) throw new Error(`[film] сцена «${scene.key}»: окно не смонтировано`);
      ready.current ??= waitReady(frame, scene, null);
      let doc = await ready.current;
      const plan = planSettle(cues, applied.current, local);
      if (plan.reload) {
        ready.current = waitReady(frame, scene, doc);
        applied.current = Number.NaN;
        frame.contentWindow?.location.reload();
        doc = await ready.current;
      }
      for (const cue of plan.clicks) pointerClick(resolveTarget(doc, cue, scene.key));
      for (const { cue, p } of plan.scrolls) {
        const el = resolveTarget(doc, cue, scene.key);
        el.scrollLeft = cue.left(p, el);
      }
      applied.current = local;
      // Центры целей курсора — только у кликов, чьё окно курсора уже началось.
      const measured = cursorClicks
        .filter((c) => local >= c.at - CURSOR_LEAD)
        .map((c) => {
          const r = resolveTarget(doc, c, scene.key).getBoundingClientRect();
          return { at: c.at, x: r.left + r.width / 2, y: r.top + r.height / 2 };
        });
      flushSync(() => setPoints(measured));
      await doc.fonts.ready;
      const win = doc.defaultView;
      if (win) await nextFrames(win, 2);
    },
    [cues, cursorClicks, scene],
  );

  // Запросы склеиваются: пока идёт переход, новый момент ждёт, промежуточные отбрасываются.
  React.useImperativeHandle(
    ref,
    () => ({
      settle(local: number) {
        wanted.current = local;
        if (!busy.current) {
          busy.current = (async () => {
            try {
              while (wanted.current !== null) {
                const next = wanted.current;
                wanted.current = null;
                await run(next);
              }
            } finally {
              busy.current = null;
            }
          })();
        }
        return busy.current;
      },
    }),
    [run],
  );

  const pose = keyframes(t, camera);
  const tx = stage.w / 2 - pose.cx * pose.zoom;
  const ty = stage.h / 2 - pose.cy * pose.zoom;
  const cursor = cursorPath(t, points, home);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        visibility: hidden ? "hidden" : "visible",
        perspective: 2400,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: "0 0",
          transform:
            `translate(${tx}px, ${ty}px) scale(${pose.zoom}) ` +
            `translate(${pose.cx}px, ${pose.cy}px) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) ` +
            `translate(${-pose.cx}px, ${-pose.cy}px)`,
          opacity: pose.opacity,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: FILM.shadow,
          background: "#FFFFFF",
        }}
      >
        <iframe
          ref={frameRef}
          src={src}
          title={scene.key}
          width={FRAME_W}
          height={FRAME_H}
          tabIndex={-1}
          style={{ display: "block", border: 0, pointerEvents: "none" }}
        />
        {cursor && <FilmCursor path={cursor} zoom={pose.zoom} />}
      </div>
    </div>
  );
});
```

- [ ] **Step 5: Экран «План»**

`Promo/src/film/screens.ts`:

```ts
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
```

- [ ] **Step 6: Сценарий + сцена**

`Promo/src/film/scenes.ts` — добавить импорт `import { PLAN_SCREEN } from "./screens";` и третью сцену:

```ts
  {
    kind: "screen",
    key: "plan",
    duration: bar(3),
    screen: PLAN_SCREEN,
    caption: { ru: "План акций на год — в одном окне", uz: "Yillik aksiyalar rejasi — bitta oynada" },
  },
```

- [ ] **Step 7: Страница фильма со сценами-экранами**

`Promo/src/film/FilmPage.tsx` целиком:

```tsx
"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { Caption } from "./Caption";
import { nextFrames } from "./frames";
import { FILM } from "./palette";
import { SCENES } from "./scenes";
import { ScreenScene, type ScreenHandle } from "./ScreenScene";
import { buildTimeline, sceneAt } from "./timeline";
import { STAGE, type Aspect, type FilmScene, type Lang } from "./types";

/** Холст вписывается в окно (просмотр) или совпадает с ним (запись). */
function useFit(stage: { w: number; h: number }, capture: boolean) {
  const calc = React.useCallback(() => {
    if (capture) return { scale: 1, left: 0, top: 0 };
    const scale = Math.min(window.innerWidth / stage.w, window.innerHeight / stage.h);
    return {
      scale,
      left: (window.innerWidth - stage.w * scale) / 2,
      top: (window.innerHeight - stage.h * scale) / 2,
    };
  }, [stage, capture]);
  const [fit, setFit] = React.useState(calc);
  React.useEffect(() => {
    const onResize = () => setFit(calc());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [calc]);
  return fit;
}

/**
 * Страница-фильм /embed/film (спецификация §3.4). Кадр — чистая функция от t.
 * ?capture=1 — запись: отдаёт window.__capture; иначе фильм играет в цикле.
 * Смонтированы текущая сцена и следующая сцена-экран (скрыто — предзагрузка).
 */
export function FilmPage() {
  const params = React.useMemo(() => new URLSearchParams(window.location.search), []);
  const capture = params.get("capture") === "1";
  const lang: Lang = params.get("lang") === "uz" ? "uz" : "ru";
  const aspect: Aspect = params.get("aspect") === "9x16" ? "9x16" : "16x9";
  const stage = STAGE[aspect];
  const timeline = React.useMemo(() => buildTimeline(SCENES), []);
  const [t, setT] = React.useState(0);
  const screens = React.useRef(new Map<string, ScreenHandle>());
  const fit = useFit(stage, capture);

  // Фильм показывает приложение светлым: класс .dark на <html> перекрасил бы
  // бейджи фрагментов. Страница грузится лениво — после эффекта ThemeProvider,
  // поэтому снятие класса здесь не перебивается.
  React.useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  React.useEffect(() => {
    if (!capture) return;
    let queue: Promise<void> = Promise.resolve();
    const seekTo = async (to: number) => {
      flushSync(() => setT(to));
      const at = sceneAt(timeline, to);
      const scene = SCENES[at.index];
      if (scene.kind === "screen") {
        const handle = screens.current.get(scene.key);
        if (!handle) throw new Error(`[film] сцена «${scene.key}» не смонтирована`);
        await handle.settle(at.local);
      }
      await document.fonts.ready;
      await nextFrames(window, 2);
    };
    window.__capture = {
      duration: timeline.duration,
      chapters: timeline.chapters,
      seek(to: number) {
        const run = queue.catch(() => undefined).then(() => seekTo(to));
        queue = run;
        return run;
      },
    };
    return () => {
      delete window.__capture;
    };
  }, [capture, timeline]);

  React.useEffect(() => {
    if (capture) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT(((now - start) / 1000) % timeline.duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [capture, timeline]);

  const { index, local } = sceneAt(timeline, t);
  const current = SCENES[index];

  // В просмотре сигналы экрана выполняются по ходу, без ожидания.
  React.useEffect(() => {
    if (capture || current.kind !== "screen") return;
    screens.current
      .get(current.key)
      ?.settle(local)
      .catch((e) => console.error(e));
  }, [capture, current, local]);

  const nextScreen = SCENES.slice(index + 1).find((s) => s.kind === "screen");
  const mounted: FilmScene[] = nextScreen ? [current, nextScreen] : [current];

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: FILM.stage }}>
      <div
        style={{
          position: "absolute",
          left: fit.left,
          top: fit.top,
          width: stage.w,
          height: stage.h,
          overflow: "hidden",
          transformOrigin: "0 0",
          transform: `scale(${fit.scale})`,
          background: FILM.stage,
        }}
      >
        {mounted.map((scene) => {
          const isCurrent = scene === current;
          if (scene.kind === "screen") {
            return (
              <ScreenScene
                key={scene.key}
                ref={(h) => {
                  if (h) screens.current.set(scene.key, h);
                  else screens.current.delete(scene.key);
                }}
                scene={scene}
                t={isCurrent ? local : 0}
                stage={stage}
                hidden={!isCurrent}
              />
            );
          }
          const SceneView = scene.Component;
          return (
            <SceneView key={scene.key} t={local} duration={scene.duration} aspect={aspect} lang={lang} />
          );
        })}
        {current.caption && <Caption text={current.caption[lang]} t={local} duration={current.duration} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Тесты проходят**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts`
Expected: PASS, 10 passed.

- [ ] **Step 9: Кадры и подгонка камеры**

Dev-сервер в фоне, затем:

Run: `corepack pnpm film:promo --stills 5.3,5.9,7.2,9.0,10.9`
Открыть PNG. Критерии:
- 5.3 — окно в наклоне, полупрозрачное, **без артефактов** 3D (рваные края, чёрные полосы, пустое окно). Артефакты — заменить в `PLAN_SCREEN.camera` ключ `at: 0` на `{ ...WHOLE, zoom: 0.8, opacity: 0 }` (плоский влёт с масштабом, спецификация §8) и снять заново;
- 5.9 и 7.2 — окно целиком, по центру, скруглено, с тенью; интерфейс краткого календаря под КД (роль в шапке — «Коммерческий директор»), таблица акций видна;
- 9.0 и 10.9 — наезд: читаются название акции, период, полосы «Статус готовности акции»; справа нет тёмной полосы шире 40 px; подпись «План акций на год — в одном окне» внизу слева, над затемнением, не наезжает на важные ячейки.
Правки — только числа в `PLAN_SCREEN.camera` (`cx`, `cy`, `zoom`, времена ключей). После каждой правки — повторный снимок. Остановить dev-сервер по PID.

- [ ] **Step 10: Commit**

```bash
git add Promo/src/film Promo/e2e/film.spec.ts
git commit -m "feat(promo-film): сцена «экран» (iframe, камера, курсор, сигналы) и экран «План»"
```

---

### Task 7: Экраны «Полный календарь» и «Аудит»

**Files:**
- Modify: `Promo/src/film/screens.ts` (+ `FULLCAL_SCREEN`, `AUDIT_SCREEN`)
- Modify: `Promo/src/film/scenes.ts` (+ `fullcal`, `audit`)
- Modify: `Promo/e2e/film.spec.ts`

**Interfaces:**
- Consumes: `ScreenSpec`, `WHOLE`, `h1` (Task 6); `ClickCue`, `ScrollCue` (Task 2)
- Produces: `FULLCAL_SCREEN: ScreenSpec`, `AUDIT_SCREEN: ScreenSpec`

- [ ] **Step 1: Написать падающие e2e-тесты**

Дописать внутрь `test.describe('фильм: сцены-экраны', …)`:

```ts
  test('fullcal: панорама прокручивает таблицу, кадр детерминирован', async ({ page }) => {
    await openFilm(page);
    const fc = (await chapters(page)).find((c) => c.key === 'fullcal')!;
    const a = await shotAt(page, fc.at + 3);
    await seek(page, fc.at + 5);
    await seek(page, fc.at + 1.5);
    const b = await shotAt(page, fc.at + 3);
    expect(same(a, b)).toBe(true);
    const frame = page.frames().find((f) => f.url().includes('/full-calendar?'))!;
    const maxScroll = () =>
      frame.evaluate(() =>
        Math.max(...[...document.querySelectorAll('div.overflow-x-auto')].map((el) => el.scrollLeft)),
      );
    expect(await maxScroll()).toBeGreaterThan(0);
    await seek(page, fc.at + 0.5); // до начала прокрутки — таблица в начале
    expect(await maxScroll()).toBe(0);
  });

  test('audit: вкладка и тема переключаются кликами, перемотка назад отменяет тему', async ({ page }) => {
    await openFilm(page);
    const au = (await chapters(page)).find((c) => c.key === 'audit')!;
    const frame = () => page.frames().find((f) => f.url().includes('/audit?'))!;
    const isDark = () => frame().evaluate(() => document.documentElement.classList.contains('dark'));
    const activeTab = () =>
      frame().evaluate(() => document.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim());
    const a = await shotAt(page, au.at + 3);
    expect(await isDark()).toBe(true);
    expect(await activeTab()).toBe('Сроки по промо и отчётам');
    await seek(page, au.at + 1); // до клика по теме — окно перезагружается
    expect(await isDark()).toBe(false);
    expect(await activeTab()).toBe('Сроки по промо и отчётам');
    const b = await shotAt(page, au.at + 3);
    expect(same(a, b)).toBe(true);
  });
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts -g "fullcal|audit"`
Expected: FAIL — глав `fullcal`/`audit` нет.

- [ ] **Step 3: Экраны**

Дописать в `Promo/src/film/screens.ts`:

```ts
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
      left: (p, el) => easeInOutCubic(p) * (el.scrollWidth - el.clientWidth),
    },
  ],
  camera: [
    { at: 0, value: { ...WHOLE, cx: -320, ry: -8 } },
    { at: 0.7, value: WHOLE, ease: easeOutExpo },
    { at: 1.4, value: { ...WHOLE, cx: 760, cy: 560, zoom: 1.3 }, ease: easeInOutCubic },
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
    { at: 4, value: { ...WHOLE, cx: 800, cy: 560, zoom: 1.5 }, ease: easeInOutCubic },
  ],
};
```

- [ ] **Step 4: Сценарий**

`Promo/src/film/scenes.ts` — импорт `import { AUDIT_SCREEN, FULLCAL_SCREEN, PLAN_SCREEN } from "./screens";` и после `plan`:

```ts
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
```

- [ ] **Step 5: Тесты проходят**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts`
Expected: PASS, 12 passed. Если во вкладке КД нет «Сроки по промо и отчётам» или таблица пуста (область видимости аудита КД), заменить в `AUDIT_SCREEN` роль и пользователя на `"Администратор"` / `"u-2"` и повторить.

- [ ] **Step 6: Кадры и подгонка камеры**

Главы сейчас: `hook 0–3 · logo 3–5 · plan 5–11 · fullcal 11–17 · audit 17–21`.

Run: `corepack pnpm film:promo --stills 11.3,12.4,14,16.8,17.3,18.5,19.1,19.4,20.9`
Критерии:
- 11.3 → 12.4 — окно въезжает справа и встаёт по центру; интерфейс полного календаря под КД, 8 акций;
- 14, 16.8 — таблица панорамирована (видны колонки правее «Название акции»: бренд, наличие, цены), замороженная левая часть (№ промо, ФИО КМ, номенклатура) на месте, шапка таблицы синхронна с телом;
- 17.3 — аудит, активна вкладка «Сроки по промо и отчётам», видны чипы результата;
- 18.5 — курсор подъезжает к кнопке темы; 19.1 — жёлтое кольцо клика на кнопке, экран тёмный; 19.4 — тёмная тема, курсор ещё виден;
- 20.9 — наезд на колонки «Результат»/«Просрочка», справа нет тёмной полосы шире 40 px; подпись «Сроки под контролем».
Правки — только числа камер и `home` в `screens.ts`. Остановить dev-сервер по PID.

- [ ] **Step 7: Commit**

```bash
git add Promo/src/film Promo/e2e/film.spec.ts
git commit -m "feat(promo-film): экраны «Полный календарь» (панорама) и «Аудит» (клик по теме)"
```

---

### Task 8: Фрагменты «сетка», «было → стало», «финал» и полный сценарий

**Files:**
- Create: `Promo/src/film/credits.ts`, `Promo/src/film/fragments/GridFragment.tsx`, `Promo/src/film/fragments/ChangeFragment.tsx`, `Promo/src/film/fragments/FinalFragment.tsx`
- Modify: `Promo/src/film/scenes.ts` (итоговый сценарий), `Promo/e2e/film.spec.ts`

**Interfaces:**
- Consumes: `SceneProps`, `Lang` (Task 4); `LogoMark` (Task 4); `progress`, `easeOutExpo`, `easeOutBack`, `easeInOutCubic` (Task 1); `PromoStatusBadge` (`Promo/src/components/PromoStatusBadge.tsx`, props `{ status: string }`), `Money` (`{ value: number }`), `RuDate` (`{ value: Date }`); `CAMPAIGNS`, `NOMENCLATURE`, `PROMO_LINES`, `formatPromoNo` из `Promo/src/lib/promo-mock-data.ts`
- Produces: `STUDIO_CREDIT: string`; `GridFragment`, `ChangeFragment`, `FinalFragment`; итоговый `SCENES` (8 сцен, 32 с)

- [ ] **Step 1: Написать падающие e2e-тесты**

Дописать в `Promo/e2e/film.spec.ts`:

```ts
test.describe('фильм: сценарий', () => {
  test.setTimeout(120_000);

  test('32 с, восемь глав по порядку', async ({ page }) => {
    await openFilm(page);
    const cap = await page.evaluate(() => ({
      duration: window.__capture!.duration,
      keys: window.__capture!.chapters.map((c) => c.key),
    }));
    expect(cap).toEqual({
      duration: 32,
      keys: ['hook', 'logo', 'plan', 'grid', 'fullcal', 'change', 'audit', 'final'],
    });
  });

  test('фрагменты «сетка» и «было → стало» детерминированы и показывают посев', async ({ page }) => {
    await openFilm(page);
    const list = await chapters(page);
    const grid = list.find((c) => c.key === 'grid')!;
    const change = list.find((c) => c.key === 'change')!;
    const a = await shotAt(page, grid.at + 1);
    await seek(page, change.at + 3);
    const b = await shotAt(page, grid.at + 1);
    expect(same(a, b)).toBe(true);
    await expect(page.getByText('Чёрная пятница 2026')).toBeVisible();
    await seek(page, change.at + 3);
    await expect(page.getByText("Кофемашина De'Longhi Magnifica")).toBeVisible();
    await expect(page.getByText('Согласовано КД')).toBeVisible();
  });

  test('узбекская версия: переводятся титры, интерфейс остаётся русским', async ({ page }) => {
    await openFilm(page, '&lang=uz');
    const list = await chapters(page);
    await seek(page, list.find((c) => c.key === 'plan')!.at + 2);
    await expect(page.getByText('Yillik aksiyalar rejasi — bitta oynada')).toBeVisible();
    await seek(page, list.find((c) => c.key === 'change')!.at + 3);
    await expect(page.getByText('Цена по акции')).toBeVisible();
  });
});
```

- [ ] **Step 2: Убедиться, что тесты падают**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts -g "сценарий"`
Expected: FAIL — ключи `['hook','logo','plan','fullcal','audit']`, длительность 21.

- [ ] **Step 3: Кредит студии**

`Promo/src/film/credits.ts`:

```ts
/**
 * Название студии для финальной карточки (спецификация §1). Пустая строка —
 * карточки студии нет. Заполняет пользователь.
 */
export const STUDIO_CREDIT = "";
```

- [ ] **Step 4: Фрагмент «сетка»**

`Promo/src/film/fragments/GridFragment.tsx`:

```tsx
"use client";

import { PromoStatusBadge } from "../../components/PromoStatusBadge";
import { RuDate } from "../../components/RuDate";
import { CAMPAIGNS, formatPromoNo } from "../../lib/promo-mock-data";
import { FILM } from "../palette";
import { easeOutBack, progress } from "../timeline";
import type { SceneProps } from "../types";

/** Шесть первых неотменённых акций посева — настоящие номера, названия, периоды и статусы. */
const ROWS = CAMPAIGNS.filter((c) => !c.cancelled).slice(0, 6);
const ROW_H = 52;
const ROW_STEP = 64;
const WIDTH = 880;
/** Композиция рисуется в размерах интерфейса и увеличивается целиком — текст остаётся векторным. */
const SCALE = 1.9;

/** Строки кампаний слетаются и защёлкиваются в сетку; бейджи загораются каскадом. */
export function GridFragment({ t }: SceneProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: WIDTH,
        height: (ROWS.length - 1) * ROW_STEP + ROW_H,
        transform: `translate(-50%, -50%) scale(${SCALE})`,
      }}
    >
      {ROWS.map((c, i) => {
        const land = progress(t, 0.12 * i, 0.12 * i + 0.7, easeOutBack);
        const fly = 1 - land;
        const dir = i % 2 === 0 ? -1 : 1;
        const lit = progress(t, 1.5 + 0.12 * i, 1.85 + 0.12 * i, easeOutBack);
        return (
          <div
            key={c.id}
            style={{
              position: "absolute",
              left: 0,
              top: i * ROW_STEP,
              width: WIDTH,
              height: ROW_H,
              display: "grid",
              gridTemplateColumns: "56px 1fr 210px 150px",
              alignItems: "center",
              gap: 12,
              padding: "0 16px",
              borderRadius: 10,
              background: FILM.card,
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
              opacity: Math.min(1, Math.max(0, land * 1.4)),
              transform: `translate(${dir * 420 * fly}px, ${60 * fly}px) rotate(${dir * 6 * fly}deg)`,
            }}
          >
            <span className="font-mono text-xs text-gray-500">{formatPromoNo(c.id)}</span>
            <span className="truncate text-sm font-semibold text-gray-900">{c.name}</span>
            <span className="text-xs tabular-nums text-gray-600">
              <RuDate value={c.startDate} /> — <RuDate value={c.endDate} />
            </span>
            <span
              style={{
                display: "inline-block",
                opacity: Math.min(1, Math.max(0, lit)),
                transform: `scale(${0.6 + 0.4 * lit})`,
                transformOrigin: "left center",
              }}
            >
              <PromoStatusBadge status={c.status} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Фрагмент «было → стало»**

`Promo/src/film/fragments/ChangeFragment.tsx`:

```tsx
"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Money } from "../../components/Money";
import { PromoStatusBadge } from "../../components/PromoStatusBadge";
import { CAMPAIGNS, NOMENCLATURE, PROMO_LINES, formatPromoNo } from "../../lib/promo-mock-data";
import { FILM } from "../palette";
import { easeInOutCubic, easeOutBack, easeOutExpo, progress } from "../timeline";
import type { SceneProps } from "../types";

/** Цвета — токены дизайн-системы (styles-config.md), hex через style. */
const GRAY_400 = "#9CA3AF";
const GRAY_900 = "#111827";
const REJECTED = "#EF4444";
const APPROVED = "#10B981";

/**
 * Посевная правка КМ из «10-й части» (Блок 4.1): строка L-0015 — кофемашина
 * De'Longhi в акции 26-3, скидка 16% → 18%, прогноз 40 → 55. Фильм ничего не
 * выдумывает: всё берётся из посева; если посев изменится — ошибка на старте.
 */
function pickChange() {
  const line = PROMO_LINES.find((l) => l.id === "L-0015");
  const item = line && NOMENCLATURE.find((n) => n.id === line.nomenclatureId);
  const campaign = line && CAMPAIGNS.find((c) => c.id === line.campaignId);
  const discount = line?.pending?.fields?.find((f) => f.field === "discountPct");
  const forecast = line?.pending?.fields?.find((f) => f.field === "salesForecast");
  if (!line || !item || !campaign || !discount || !forecast) {
    throw new Error("[film] сцена «change»: в посеве нет правки L-0015 (скидка и прогноз)");
  }
  // Та же формула, что у посева (promo-mock-data.ts): roundTo(старая цена × (1 − скидка), 10 000).
  const newPrice =
    Math.round((item.oldRetailPrice * (1 - Number(discount.value) / 100)) / 10_000) * 10_000;
  return { line, item, campaign, discount, forecast, newPrice };
}
const DATA = pickChange();

/**
 * Главный момент фильма: карточка «Было → Стало». Старые значения
 * зачёркиваются, новые въезжают; бейдж «На согл. у КД» перетекает в
 * «Согласовано КД» с пульсом галочки. Надписи — интерфейс, всегда по-русски.
 */
export function ChangeFragment({ t }: SceneProps) {
  const card = progress(t, 0, 0.5, easeOutExpo);
  const strike = progress(t, 0.7, 1.0, easeInOutCubic);
  const arrive = (delay: number) => progress(t, 1.0 + delay, 1.4 + delay, easeOutExpo);
  const oldBadge = 1 - progress(t, 2.1, 2.35);
  const newBadge = progress(t, 2.25, 2.6, easeOutBack);
  const check = progress(t, 2.4, 2.8, easeOutBack);
  const ring = progress(t, 2.5, 3.3);
  const { line, item, campaign, discount, forecast, newPrice } = DATA;
  const rows: { label: string; was: React.ReactNode; now: React.ReactNode; delay: number }[] = [
    { label: "Цена по акции", was: <Money value={line.newPrice} />, now: <Money value={newPrice} />, delay: 0 },
    { label: discount.label, was: discount.was, now: discount.now, delay: 0.1 },
    { label: forecast.label, was: forecast.was, now: forecast.now, delay: 0.2 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "46%",
        width: 560,
        opacity: card,
        transform: `translate(-50%, -50%) scale(1.9) translateY(${(1 - card) * 40}px)`,
      }}
    >
      <div
        style={{
          padding: "18px 20px",
          borderRadius: 14,
          background: FILM.card,
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.45)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-500">
            {formatPromoNo(campaign.id)} · {campaign.name}
          </span>
          <span className="relative inline-flex h-6 items-center">
            <span
              style={{
                position: "absolute",
                right: 0,
                whiteSpace: "nowrap",
                opacity: oldBadge,
                transform: `scale(${0.8 + 0.2 * oldBadge})`,
                transformOrigin: "right center",
              }}
            >
              <PromoStatusBadge status="На согласовании у коммерческого директора" />
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                opacity: Math.min(1, Math.max(0, newBadge)),
                transform: `scale(${1.25 - 0.25 * newBadge})`,
                transformOrigin: "right center",
              }}
            >
              <PromoStatusBadge status="Согласовано КД" />
              <span
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: APPROVED,
                  transform: `scale(${Math.max(0, check)})`,
                }}
              >
                <Check className="size-3.5" color="#FFFFFF" strokeWidth={3} />
                {ring > 0 && ring < 1 && (
                  <span
                    style={{
                      position: "absolute",
                      inset: -12 * ring,
                      borderRadius: "50%",
                      border: `2px solid ${APPROVED}`,
                      opacity: 1 - ring,
                    }}
                  />
                )}
              </span>
            </span>
          </span>
        </div>
        <p className="mt-2 text-lg font-semibold text-gray-900">{item.name}</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr 24px 1fr",
            alignItems: "center",
            rowGap: 10,
            marginTop: 14,
          }}
        >
          <span />
          <span className="text-xs text-gray-400">Было</span>
          <span />
          <span className="text-xs text-gray-400">Стало</span>
          {rows.map((r) => {
            const p = arrive(r.delay);
            return (
              <React.Fragment key={r.label}>
                <span className="text-sm text-gray-500">{r.label}</span>
                <span
                  className="relative justify-self-start text-sm tabular-nums"
                  style={{ color: strike > 0.5 ? GRAY_400 : GRAY_900 }}
                >
                  {r.was}
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "52%",
                      height: 2,
                      width: `${strike * 100}%`,
                      background: REJECTED,
                    }}
                  />
                </span>
                <span className="text-sm text-gray-400" style={{ opacity: p }}>
                  →
                </span>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{
                    display: "inline-block",
                    color: GRAY_900,
                    opacity: p,
                    transform: `translateX(${(1 - p) * 28}px)`,
                  }}
                >
                  {r.now}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Фрагмент «финал»**

`Promo/src/film/fragments/FinalFragment.tsx`:

```tsx
"use client";

import { STUDIO_CREDIT } from "../credits";
import { FILM } from "../palette";
import { easeOutExpo, progress } from "../timeline";
import type { Lang, SceneProps } from "../types";
import { LogoMark } from "./LogoMark";

/** Титры (переводятся). Узбекский — черновой перевод, нужна проверка носителем. */
const TAGLINE: Record<Lang, string> = {
  ru: "Промо-календарь для сети Texnomart",
  uz: "Texnomart tarmog'i uchun promo-kalendar",
};
const CREDIT: Record<Lang, (studio: string) => string> = {
  ru: (studio) => `Дизайн и прототип — ${studio}`,
  uz: (studio) => `Dizayn va prototip — ${studio}`,
};

/** Логотип, строка о продукте и — если задан STUDIO_CREDIT — карточка студии. */
export function FinalFragment({ t, lang }: SceneProps) {
  const logo = progress(t, 0, 0.6, easeOutExpo);
  const tag = progress(t, 0.3, 0.8, easeOutExpo);
  const credit = progress(t, 0.8, 1.3, easeOutExpo);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ opacity: logo, transform: `scale(${0.94 + 0.06 * logo})` }}>
        <LogoMark height={104} />
      </div>
      <p
        style={{
          margin: "40px 0 0",
          color: FILM.text,
          fontSize: 44,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          opacity: tag,
          transform: `translateY(${(1 - tag) * 16}px)`,
        }}
      >
        {TAGLINE[lang]}
      </p>
      {STUDIO_CREDIT && (
        <p style={{ margin: "72px 0 0", color: FILM.muted, fontSize: 30, fontWeight: 500, opacity: credit }}>
          {CREDIT[lang](STUDIO_CREDIT)}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Итоговый сценарий**

`Promo/src/film/scenes.ts` целиком:

```ts
import { ChangeFragment } from "./fragments/ChangeFragment";
import { FinalFragment } from "./fragments/FinalFragment";
import { GridFragment } from "./fragments/GridFragment";
import { HookFragment } from "./fragments/HookFragment";
import { LogoFragment } from "./fragments/LogoFragment";
import { AUDIT_SCREEN, FULLCAL_SCREEN, PLAN_SCREEN } from "./screens";
import { bar } from "./timeline";
import type { FilmScene } from "./types";

/**
 * Сценарий фильма (спецификация §4): 16 тактов по 2 с при 120 BPM = 32 с.
 * Ключи сцен — ключи глав для `--chapter`. Узбекские подписи — черновой
 * перевод, нужна проверка носителем.
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
  { kind: "fragment", key: "grid", duration: bar(2), Component: GridFragment },
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
    kind: "fragment",
    key: "change",
    duration: bar(2),
    Component: ChangeFragment,
    caption: { ru: "Любая правка — через согласование", uz: "Har qanday o'zgarish — kelishuv orqali" },
  },
  {
    kind: "screen",
    key: "audit",
    duration: bar(2),
    screen: AUDIT_SCREEN,
    caption: { ru: "Сроки под контролем", uz: "Muddatlar nazorat ostida" },
  },
  { kind: "fragment", key: "final", duration: bar(1.5), Component: FinalFragment },
];
```

- [ ] **Step 8: Тесты проходят**

Run: `corepack pnpm --filter promo exec playwright test e2e/film.spec.ts`
Expected: PASS, 15 passed.

- [ ] **Step 9: Кадры всех сцен**

Главы: `hook 0–3 · logo 3–5 · plan 5–11 · grid 11–15 · fullcal 15–21 · change 21–25 · audit 25–29 · final 29–32`.

Run: `corepack pnpm film:promo --stills 0.5,2.6,4.2,6,10.8,11.4,12.6,14.8,15.5,19,21.3,22.2,23.4,24.8,26,27.1,28.8,29.5,31.8`
Критерии (сверх Task 6/7):
- `grid` 11.4 — строки в полёте, 12.6 — сетка собрана, 14.8 — все бейджи горят; названия акций не обрезаны до многоточия (иначе — уменьшить `gridTemplateColumns` третьей колонки или `SCALE`);
- `change` 21.3 — карточка въезжает; 22.2 — старые значения зачёркнуты, новые въехали; 23.4 — бейдж «Согласовано КД» и галочка; 24.8 — подпись «Любая правка — через согласование» не перекрывает карточку;
- `final` 29.5, 31.8 — логотип и строка по центру, карточки студии нет (`STUDIO_CREDIT` пуст);
- стыки сцен (6, 15.5, 26) — без пустых кадров: окно следующего экрана загружено заранее.
Самопроверка вёрстки: одинаковые отступы у карточек, выравнивание строк сетки, ничего не срезано фиксированной высотой.

- [ ] **Step 10: Commit**

```bash
git add Promo/src/film Promo/e2e/film.spec.ts
git commit -m "feat(promo-film): фрагменты «сетка», «было → стало», «финал» — сценарий 32 с"
```

---

### Task 9: Запись, проверки, документация

**Files:**
- Modify: `Promo/CLAUDE.md`, `CLAUDE.md` (корень), `HISTORY.md`, `docs/AI_CONTEXT.md`, при уроках — `tasks/lessons.md`

**Interfaces:**
- Consumes: всё выше.
- Produces: `Promo/film-out/film-ru-16x9.mp4`, `Promo/film-out/film-uz-16x9.mp4` (вне git), документация.

- [ ] **Step 1: Полная запись RU и UZ**

Dev-сервер в фоне.

Run: `corepack pnpm film:promo`
Expected: `записан …\film-out\film-ru-16x9.mp4 (32.0 с, 1920×1080, 60 к/с, h264)`; время записи — записать в отчёт.

Run: `corepack pnpm film:promo --lang uz`
Expected: `записан …\film-out\film-uz-16x9.mp4 (32.0 с, …)`.

Run: `ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate -of default=nw=1 Promo/film-out/film-ru-16x9.mp4`
Expected: `width=1920`, `height=1080`, `r_frame_rate=60/1`, `duration≈32.0`.

Контрольные кадры из готового видео (проверка, что кодек не испортил цвета и тёмные зоны): `ffmpeg -v error -ss 23.4 -i Promo/film-out/film-ru-16x9.mp4 -frames:v 1 Promo/film-out/check-23.4.png` и то же для 1.5 и 28.8; открыть, сравнить с кадрами `--stills` — без полос на тёмном фоне, жёлтый не ушёл в оранжевый.

- [ ] **Step 2: Подпуть GitHub Pages (Review Focus 4)**

```powershell
$env:BASE_PATH = '/Texnomart/promo/'
corepack pnpm --filter promo exec vite build --outDir "$env:TEMP\promo-film-pages"
corepack pnpm --filter promo exec vite preview --outDir "$env:TEMP\promo-film-pages" --port 4173 --strictPort   # в фоне, PID
```

Run: `corepack pnpm film:promo --base http://localhost:4173/Texnomart/promo --stills 8,27`
Expected: оба кадра — с живыми экранами (краткий календарь, аудит), не пустые окна и не экран входа. Остановить preview по PID, удалить `$env:TEMP\promo-film-pages`, убрать `BASE_PATH` (`Remove-Item Env:BASE_PATH`).

- [ ] **Step 3: Регрессия и типы**

Run: `corepack pnpm --filter promo test:film` → PASS (17).
Run: `corepack pnpm test:e2e:promo` → все проходят (141 прежних + 15 фильма).
Run: `corepack pnpm build:promo` → зелёная; в выводе — отдельный чанк `FilmPage-*.js` (фильм не в основном бандле).
Run: `tsc` по рецепту `tasks/lessons.md` (scratchpad) → ровно 3 известные ошибки; любая новая в `src/film/**`, `routes.tsx`, `main.tsx`, `shell-config.tsx` — исправить и повторить.

Остановить dev-сервер по PID.

- [ ] **Step 4: Документация**

- `Promo/CLAUDE.md` — раздел «Моушн-фильм (`/embed/film`)»: назначение (внешний показ), устройство (`src/film/`: режим кадра, сцены «экран»/«фрагмент», `__capture`), команды (`corepack pnpm film:promo …`, `--stills`, `--chapter`, `--audio`, `--4k`), где лежат ролики (`Promo/film-out/`, вне git), ffmpeg (`FFMPEG`), `STUDIO_CREDIT`, узбекские титры — черновик, этап 2 (9:16) впереди; маршрут `/embed/film` — в список маршрутов.
- Корневой `CLAUDE.md` — в блок «Commands» строку `pnpm film:promo  # Record the Promo motion film (dev server must run)`; в строку Promo таблицы проектов — одно предложение о фильме.
- `HISTORY.md` — запись за дату завершения: что сделано, проверка (тесты, запись, подпуть), что открыто (9:16, `STUDIO_CREDIT`, проверка узбекского носителем, музыка).
- `docs/AI_CONTEXT.md` — строка «Last updated» и пункт в Next Steps (согласование ролика, этап 2).
- `tasks/lessons.md` — только если по ходу нашлись неочевидные вещи (например, поведение 3D-наклона с iframe в headless Chrome, `Object.defineProperty` для хранилищ, нажатие вкладок Radix по `mousedown`).

- [ ] **Step 5: Commit**

```bash
git add Promo/CLAUDE.md CLAUDE.md HISTORY.md docs/AI_CONTEXT.md tasks/lessons.md
git commit -m "docs: моушн-фильм Promo — устройство, команды, история"
```

- [ ] **Step 6: Передача пользователю**

Сообщить пути к `film-ru-16x9.mp4` и `film-uz-16x9.mp4`, длительность записи, что проверено (кадры, e2e, подпуть) и что остаётся за пользователем: просмотреть темп в движении, дать название студии для `STUDIO_CREDIT`, трек (`--audio`), проверку узбекских титров носителем, решение о переходе к этапу 2 (9:16). В `origin` не отправлять без просьбы пользователя.
