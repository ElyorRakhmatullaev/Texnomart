"use client";

import { PromoStatusBadge } from "../../components/PromoStatusBadge";
import { RuDate } from "../../components/RuDate";
import { CAMPAIGNS, formatPromoNo } from "../../lib/promo-mock-data";
import { FILM } from "../palette";
import { easeOutBack, progress } from "../timeline";
import type { SceneProps } from "../types";

/** Шесть первых неотменённых акций посева — настоящие номера, названия, периоды и статусы. */
const ROWS = CAMPAIGNS.filter((c) => !c.cancelled).slice(0, 6);
// Фильм ничего не выдумывает: если посев изменится и неотменённых акций станет
// меньше шести — ошибка на старте, а не молчаливо укороченная сетка.
if (ROWS.length < 6) {
  throw new Error("[film] сцена «grid»: в посеве меньше 6 неотменённых акций");
}
const ROW_H = 52;
const ROW_STEP = 64;
const WIDTH = 880;
/** Композиция рисуется в размерах интерфейса и увеличивается целиком — текст остаётся векторным. */
const SCALE = 1.9;

/** Строки кампаний слетаются и защёлкиваются в сетку; бейджи загораются каскадом. */
export function GridFragment({ t }: SceneProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: WIDTH,
        height: (ROWS.length - 1) * ROW_STEP + ROW_H,
        transform: `translate(-50%, -50%) scale(${SCALE})`,
      }}
    >
      {ROWS.map((c, i) => {
        const land = progress(t, 0.12 * i, 0.12 * i + 0.7, easeOutBack);
        const fly = 1 - land;
        const dir = i % 2 === 0 ? -1 : 1;
        const lit = progress(t, 1.5 + 0.12 * i, 1.85 + 0.12 * i, easeOutBack);
        return (
          <div
            key={c.id}
            style={{
              position: "absolute",
              left: 0,
              top: i * ROW_STEP,
              width: WIDTH,
              height: ROW_H,
              display: "grid",
              gridTemplateColumns: "56px 1fr 210px 150px",
              alignItems: "center",
              gap: 12,
              padding: "0 16px",
              borderRadius: 10,
              background: FILM.card,
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
              opacity: Math.min(1, Math.max(0, land * 1.4)),
              transform: `translate(${dir * 420 * fly}px, ${60 * fly}px) rotate(${dir * 6 * fly}deg)`,
            }}
          >
            <span className="font-mono text-xs text-gray-500">{formatPromoNo(c.id)}</span>
            <span className="truncate text-sm font-semibold text-gray-900">{c.name}</span>
            <span className="text-xs tabular-nums text-gray-600">
              <RuDate value={c.startDate} /> — <RuDate value={c.endDate} />
            </span>
            <span
              style={{
                display: "inline-block",
                opacity: Math.min(1, Math.max(0, lit)),
                transform: `scale(${0.6 + 0.4 * lit})`,
                transformOrigin: "left center",
              }}
            >
              <PromoStatusBadge status={c.status} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
