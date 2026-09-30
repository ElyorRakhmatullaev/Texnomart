"use client";

import { MessageCircle } from "lucide-react";
import { FILM, INK } from "../../palette";
import { painOf } from "../../story";
import { easeOutExpo, progress } from "../../timeline";
import type { SceneProps } from "../../types";
import { BeforeFrame } from "./BeforeFrame";

/**
 * Переписка — «интерфейс», по-русски в обеих версиях; подписи — роли, не имена.
 * 16% → 18% — та же правка De'Longhi, что директор согласует во втором акте.
 */
const MESSAGES = [
  { at: 0.2, left: true, who: "Менеджер категории", text: "Скидку 18% на кофемашину согласовали?" },
  { at: 0.9, left: false, who: "Старший менеджер", text: "Вроде да, директор говорил" },
  { at: 1.6, left: true, who: "Маркетинг", text: "А кто согласовал? В макете 16%" },
] as const;
/** Ответа нет — висит индикатор набора. */
const TYPING_AT = 2.2;

function TypingDots({ t }: { t: number }) {
  return (
    <div
      style={{
        alignSelf: "flex-start",
        display: "flex",
        gap: 8,
        padding: "18px 22px",
        borderRadius: 16,
        background: INK.gray100,
      }}
    >
      {[0, 1, 2].map((k) => (
        <span
          key={k}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: INK.gray400,
            opacity: 0.35 + 0.65 * Math.max(0, Math.sin((t * 2 - k * 0.25) * Math.PI)),
          }}
        />
      ))}
    </div>
  );
}

export function ChatIllustration({ t }: { t: number }) {
  const card = progress(t, 0, 0.3, easeOutExpo);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          left: 260,
          top: 0,
          width: 1080,
          height: 600,
          overflow: "hidden",
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
            alignItems: "center",
            gap: 12,
            height: 64,
            padding: "0 24px",
            borderBottom: `1px solid ${INK.gray200}`,
          }}
        >
          <MessageCircle size={24} color={INK.gray500} />
          <span style={{ fontSize: 20, fontWeight: 600, color: INK.gray900 }}>Промо — октябрь</span>
          <span style={{ fontSize: 16, color: INK.gray500 }}>14 участников</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: 28 }}>
          {MESSAGES.map((m) => {
            const p = progress(t, m.at, m.at + 0.3, easeOutExpo);
            if (p <= 0) return null;
            return (
              <div
                key={m.at}
                style={{
                  alignSelf: m.left ? "flex-start" : "flex-end",
                  maxWidth: 640,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 24}px)`,
                }}
              >
                <div
                  style={{ marginBottom: 6, fontSize: 15, color: INK.gray500, textAlign: m.left ? "left" : "right" }}
                >
                  {m.who}
                </div>
                <div
                  style={{
                    padding: "14px 20px",
                    borderRadius: 16,
                    fontSize: 24,
                    lineHeight: 1.3,
                    color: INK.gray900,
                    background: m.left ? INK.gray100 : INK.blue50,
                  }}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
          {t >= TYPING_AT && <TypingDots t={t - TYPING_AT} />}
        </div>
      </div>
    </div>
  );
}

export function ChatBefore({ t, lang }: SceneProps) {
  return (
    <BeforeFrame t={t} headline={painOf("chat").headline[lang]}>
      <ChatIllustration t={t} />
    </BeforeFrame>
  );
}
