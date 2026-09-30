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
