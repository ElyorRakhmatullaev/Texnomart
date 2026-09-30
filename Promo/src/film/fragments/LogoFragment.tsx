"use client";

import { FILM } from "../palette";
import { easeOutExpo, progress } from "../timeline";
import type { SceneProps } from "../types";
import { LogoMark } from "./LogoMark";

/** Жёлтая линия прочерчивает кадр, над ней собирается логотип. */
export function LogoFragment({ t }: SceneProps) {
  const line = progress(t, 0, 0.6, easeOutExpo);
  const logo = progress(t, 0.35, 1.0, easeOutExpo);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ opacity: logo, transform: `scale(${0.92 + 0.08 * logo})` }}>
        <LogoMark height={120} />
      </div>
      <div style={{ marginTop: 48, height: 8, width: 760 * line, borderRadius: 4, background: FILM.accent }} />
    </div>
  );
}
