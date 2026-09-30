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
