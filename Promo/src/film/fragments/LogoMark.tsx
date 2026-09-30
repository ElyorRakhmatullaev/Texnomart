"use client";

import * as React from "react";
import { TexnomartLogoFull } from "../../app/shell-config";
import { FILM } from "../palette";

/** Логотип из шапки приложения + «Promo» фирменным жёлтым. */
export function LogoMark({ height }: { height: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: height * 0.23, color: FILM.text }}>
      <div style={{ height }}>
        {React.cloneElement(TexnomartLogoFull, { className: "h-full w-auto" })}
      </div>
      <span
        style={{
          color: FILM.accent,
          fontSize: height * 0.8,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 0.82,
        }}
      >
        Promo
      </span>
    </div>
  );
}
