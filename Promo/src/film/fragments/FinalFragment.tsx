"use client";

import { STUDIO_CREDIT } from "../credits";
import { FILM } from "../palette";
import { easeOutExpo, progress } from "../timeline";
import type { Lang, SceneProps } from "../types";
import { LogoMark } from "./LogoMark";

/** Титры (переводятся). Узбекский — черновой перевод, нужна проверка носителем. */
const TAGLINE: Record<Lang, string> = {
  ru: "Промо-календарь для сети Texnomart",
  uz: "Texnomart tarmog'i uchun promo-kalendar",
};
const CREDIT: Record<Lang, (studio: string) => string> = {
  ru: (studio) => `Дизайн и прототип — ${studio}`,
  uz: (studio) => `Dizayn va prototip — ${studio}`,
};

/** Логотип, строка о продукте и — если задан STUDIO_CREDIT — карточка студии. */
export function FinalFragment({ t, lang }: SceneProps) {
  const logo = progress(t, 0, 0.6, easeOutExpo);
  const tag = progress(t, 0.3, 0.8, easeOutExpo);
  const credit = progress(t, 0.8, 1.3, easeOutExpo);
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
      <div style={{ opacity: logo, transform: `scale(${0.94 + 0.06 * logo})` }}>
        <LogoMark height={104} />
      </div>
      <p
        style={{
          margin: "40px 0 0",
          color: FILM.text,
          fontSize: 44,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          opacity: tag,
          transform: `translateY(${(1 - tag) * 16}px)`,
        }}
      >
        {TAGLINE[lang]}
      </p>
      {STUDIO_CREDIT && (
        <p style={{ margin: "72px 0 0", color: FILM.muted, fontSize: 30, fontWeight: 500, opacity: credit }}>
          {CREDIT[lang](STUDIO_CREDIT)}
        </p>
      )}
    </div>
  );
}
