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
                // 24, а не 26: при 26 самая длинная русская строка («Кто
                // согласовал — неизвестно», 384,5 px) выходила за край карточки
                // 440 px на 6,5 px (замер 01.10); при 24 она кончается у её
                // внутреннего отступа (≈465 из 464 px холста).
                fontSize: 24,
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
