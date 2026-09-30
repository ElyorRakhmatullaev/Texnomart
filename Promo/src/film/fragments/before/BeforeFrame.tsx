"use client";

import type { ReactNode } from "react";
import { FILM } from "../../palette";
import { easeOutExpo, progress } from "../../timeline";

/** Область иллюстрации: её рисуют и сцена боли, и сцена-куча (там — уменьшенной). */
export const ART = { w: 1600, h: 620 } as const;

/** Крупный заголовок первого акта: въезжает снизу, под ним прочерчивается жёлтая линия. */
export function BeforeHeadline({ text, t }: { text: string; t: number }) {
  const enter = progress(t, 0, 0.35, easeOutExpo);
  const underline = progress(t, 0.1, 0.6, easeOutExpo);
  return (
    <div
      style={{
        position: "absolute",
        left: 160,
        top: 100,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 40}px)`,
      }}
    >
      <p
        style={{
          margin: 0,
          maxWidth: 1600,
          color: FILM.text,
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: "-0.035em",
          lineHeight: 1.04,
        }}
      >
        {text}
      </p>
      <div style={{ marginTop: 28, height: 8, width: 200 * underline, borderRadius: 4, background: FILM.accent }} />
    </div>
  );
}

/** Сцена боли: заголовок сверху, иллюстрация — в нижней части кадра (420…1040 px). */
export function BeforeFrame({ t, headline, children }: { t: number; headline: string; children: ReactNode }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <BeforeHeadline text={headline} t={t} />
      <div style={{ position: "absolute", left: 160, top: 420, width: ART.w, height: ART.h }}>{children}</div>
    </div>
  );
}
