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
