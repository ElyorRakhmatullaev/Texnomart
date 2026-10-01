"use client";

import { Coffee } from "lucide-react";
import { HERO } from "../../hero";
import { FILM, INK } from "../../palette";
import { painOf } from "../../story";
import { easeOutBack, easeOutExpo, progress } from "../../timeline";
import type { SceneProps } from "../../types";
import { BeforeFrame } from "./BeforeFrame";

/** Центр штампа в координатах карточки макета (цифры старой цены — ≈ 350–418 по y). */
const STAMP_CENTER = { x: 620, y: 480 };

/**
 * Рекламный макет со старой ценой De'Longhi, штамп «Цена устарела», сбоку — цена
 * на кассе. Цены — из отчёта 26-3 (HERO): второй акт показывает, как это
 * изменение доходит до маркетинга.
 */
export function DeptsIllustration({ t }: { t: number }) {
  const card = progress(t, 0, 0.3, easeOutExpo);
  const stamp = progress(t, 0.9, 1.2, easeOutBack);
  const till = progress(t, 1.5, 1.85, easeOutExpo);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 0,
          display: "flex",
          gap: 40,
          width: 980,
          height: 560,
          padding: 40,
          boxSizing: "border-box",
          borderRadius: 16,
          background: FILM.card,
          boxShadow: FILM.shadow,
          opacity: card,
          transform: `translateY(${(1 - card) * 40}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            flex: "none",
            alignItems: "center",
            justifyContent: "center",
            width: 380,
            borderRadius: 12,
            background: INK.gray100,
          }}
        >
          <Coffee size={140} strokeWidth={1.5} color={INK.gray400} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
          <span
            style={{
              alignSelf: "flex-start",
              padding: "6px 14px",
              border: `2px solid ${FILM.accent}`,
              borderRadius: 8,
              fontSize: 20,
              fontWeight: 700,
              color: INK.gray900,
            }}
          >
            Акция 1+1
          </span>
          <span style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.15, color: INK.gray900 }}>{HERO.productName}</span>
          <span style={{ fontSize: 20, color: INK.gray500 }}>Цена по акции</span>
          <span style={{ fontSize: 64, fontWeight: 800, letterSpacing: "-0.02em", color: INK.gray900 }}>
            {HERO.priceWas}
          </span>
        </div>
        {stamp > 0 && (
          <span
            style={{
              position: "absolute",
              // Центр штампа — под ценой, а не на ней: верхний правый угол
              // (выше всего при наклоне −10°) остаётся ниже цифр старой цены,
              // нижний левый — внутри карточки, и к 1,9 с сцены обе цены —
              // макета и кассы — читаются рядом.
              left: STAMP_CENTER.x,
              top: STAMP_CENTER.y,
              padding: "10px 22px",
              border: `5px solid ${INK.red}`,
              borderRadius: 10,
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              color: INK.red,
              // Почти прозрачная заливка: при ударе штамп въезжает крупным
              // (scale 1,8) и не должен гасить старую цену под собой.
              background: "rgba(255, 255, 255, 0.2)",
              opacity: Math.min(1, stamp),
              transform: `translate(-50%, -50%) rotate(-10deg) scale(${1.8 - 0.8 * stamp})`,
            }}
          >
            Цена устарела
          </span>
        )}
      </div>
      {till > 0 && (
        <div
          style={{
            position: "absolute",
            left: 1140,
            top: 190,
            width: 440,
            padding: "28px 32px",
            boxSizing: "border-box",
            borderRadius: 16,
            background: FILM.card,
            boxShadow: FILM.shadow,
            opacity: till,
            transform: `translateX(${(1 - till) * 60}px)`,
          }}
        >
          <div style={{ fontSize: 22, color: INK.gray500 }}>На кассе</div>
          <div style={{ marginTop: 8, fontSize: 48, fontWeight: 800, letterSpacing: "-0.02em", color: INK.gray900 }}>
            {HERO.priceNow}
          </div>
        </div>
      )}
    </div>
  );
}

export function DeptsBefore({ t, lang }: SceneProps) {
  return (
    <BeforeFrame t={t} headline={painOf("depts").headline[lang]}>
      <DeptsIllustration t={t} />
    </BeforeFrame>
  );
}
