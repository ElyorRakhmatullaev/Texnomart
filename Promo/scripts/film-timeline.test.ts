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
  gridSteps,
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

test("gridSteps: from начала сцены (local = 0)", () => {
  assert.deepEqual(gridSteps(null, 0, 4, 60), [0]);
});

test("gridSteps: to точно на такте — без лишнего шага", () => {
  const steps = gridSteps(null, 1, 4, 60);
  assert.equal(steps.length, 61); // 0, 1/60, …, 60/60 = 1
  assert.equal(steps[0], 0);
  assert.equal(steps[steps.length - 1], 1);
});

test("gridSteps: to не на такте — сетка плюс сам to последним шагом", () => {
  const steps = gridSteps(null, 1.505, 4, 60);
  assert.equal(steps[steps.length - 1], 1.505); // не на сетке — добавлен как есть
  assert.ok(steps[steps.length - 2] < 1.505); // предыдущий шаг — такт сетки
});

test("gridSteps: продолжение с lastLocal — без повтора, без пропуска", () => {
  const first = gridSteps(null, 0.5, 4, 60);
  const rest = gridSteps(0.5, 1, 4, 60);
  assert.equal(first[first.length - 1], 0.5);
  assert.equal(rest[0], 0.5 + 1 / 60);
});

test("gridSteps: to у самого конца сцены — такты не заходят в конец (репро обвала)", () => {
  // Повтор боевого случая: fc.at=19, duration=4, to=22.999999999999993 → local
  // почти 4, но строго меньше — такты должны остановиться раньше конца сцены.
  const to = 22.999999999999993 - 19;
  const steps = gridSteps(3.9, to, 4, 60);
  for (const s of steps) assert.ok(s < 4, `шаг ${s} не должен достигать конца сцены (4)`);
  assert.equal(steps[steps.length - 1], to); // итог — ровно запрошенный момент
});

test("gridSteps: to у самого конца сцены без истории (fresh entry) — тоже не заходит в конец", () => {
  const to = 18.999999999999993 - 16; // повтор прямого захода: plan.at=16, duration=3
  const steps = gridSteps(null, to, 3, 60);
  for (const s of steps) assert.ok(s < 3, `шаг ${s} не должен достигать конца сцены (3)`);
  assert.equal(steps[steps.length - 1], to);
});

test("gridSteps: другой fps — сетка 1/fps", () => {
  const steps = gridSteps(null, 1, 4, 30);
  assert.equal(steps.length, 31); // 0, 1/30, …, 30/30 = 1
  assert.equal(steps[1], 1 / 30);
});
