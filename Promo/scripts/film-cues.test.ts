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
