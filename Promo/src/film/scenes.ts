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
 * путь в Promo (список болей поверх; каждая сцена, кроме `plan`, закрывает свою
 * боль), итог и финал. Ключи сцен — ключи глав для `--chapter`.
 *
 * Подписи сцен второго акта — гарантии из story.ts (их же повторяет итог),
 * кроме `fullcal`: гарантию боли «files» несёт подпись `plan`, который боль не
 * закрывает (без `solves`), а закрывает её `fullcal` — со своей подписью «Все
 * позиции — в одной таблице». У approval, deadlines и report подпись — гарантия
 * той боли, которую сцена закрывает.
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
