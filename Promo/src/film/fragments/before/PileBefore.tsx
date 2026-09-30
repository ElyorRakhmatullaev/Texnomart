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
