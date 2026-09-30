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
