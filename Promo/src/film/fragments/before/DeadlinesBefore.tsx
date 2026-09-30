"use client";

import { Clock } from "lucide-react";
import { FILM, INK } from "../../palette";
import { painOf } from "../../story";
import { easeOutBack, easeOutExpo, progress } from "../../timeline";
import type { SceneProps } from "../../types";
import { BeforeFrame } from "./BeforeFrame";

/** Задачи краснеют по ударам; ответственного нет ни у одной. */
const TASKS = [
  { at: 0.8, text: "Данные менеджеров — не заполнены" },
  { at: 1.3, text: "Согласование цен — ждёт 6 дней" },
  { at: 1.8, text: "Отчёт отделам — не отправлен" },
] as const;

export function DeadlinesIllustration({ t }: { t: number }) {
  const card = progress(t, 0, 0.3, easeOutExpo);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          left: 260,
          top: 0,
          width: 1080,
          height: 520,
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
            gap: 20,
            height: 120,
            padding: "0 32px",
            borderBottom: `1px solid ${INK.gray200}`,
          }}
        >
          <Clock size={40} color={INK.red} />
          <span style={{ fontSize: 30, fontWeight: 600, color: INK.gray900 }}>Старт акции через</span>
          <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: "-0.02em", color: INK.red }}>3 дня</span>
        </div>
        {TASKS.map((task) => {
          const late = t >= task.at;
          const pop = progress(t, task.at, task.at + 0.25, easeOutBack);
          return (
            <div
              key={task.text}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 250px 190px",
                alignItems: "center",
                height: 130,
                padding: "0 32px",
                borderBottom: `1px solid ${INK.gray200}`,
                background: late ? INK.red50 : "transparent",
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 600, color: INK.gray900 }}>{task.text}</span>
              <span style={{ fontSize: 22, color: INK.gray500 }}>Ответственный: —</span>
              <span
                style={{
                  justifySelf: "end",
                  padding: "8px 18px",
                  borderRadius: 999,
                  fontSize: 22,
                  fontWeight: 600,
                  color: late ? "#FFFFFF" : INK.gray500,
                  background: late ? INK.red : INK.gray100,
                  transform: `scale(${late ? 0.85 + 0.15 * pop : 1})`,
                }}
              >
                {late ? "Просрочено" : "В работе"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DeadlinesBefore({ t, lang }: SceneProps) {
  return (
    <BeforeFrame t={t} headline={painOf("deadlines").headline[lang]}>
      <DeadlinesIllustration t={t} />
    </BeforeFrame>
  );
}
