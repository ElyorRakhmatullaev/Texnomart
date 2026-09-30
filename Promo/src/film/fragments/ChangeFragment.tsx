"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Money } from "../../components/Money";
import { PromoStatusBadge } from "../../components/PromoStatusBadge";
import { CAMPAIGNS, NOMENCLATURE, PROMO_LINES, formatPromoNo } from "../../lib/promo-mock-data";
import { FILM } from "../palette";
import { easeInOutCubic, easeOutBack, easeOutExpo, progress } from "../timeline";
import type { SceneProps } from "../types";

/** Цвета — токены дизайн-системы (styles-config.md), hex через style. */
const GRAY_400 = "#9CA3AF";
const GRAY_900 = "#111827";
const REJECTED = "#EF4444";
const APPROVED = "#10B981";

/**
 * Посевная правка КМ из «10-й части» (Блок 4.1): строка L-0015 — кофемашина
 * De'Longhi в акции 26-3, скидка 16% → 18%, прогноз 40 → 55. Фильм ничего не
 * выдумывает: всё берётся из посева; если посев изменится — ошибка на старте.
 */
function pickChange() {
  const line = PROMO_LINES.find((l) => l.id === "L-0015");
  const item = line && NOMENCLATURE.find((n) => n.id === line.nomenclatureId);
  const campaign = line && CAMPAIGNS.find((c) => c.id === line.campaignId);
  const discount = line?.pending?.fields?.find((f) => f.field === "discountPct");
  const forecast = line?.pending?.fields?.find((f) => f.field === "salesForecast");
  if (!line || !item || !campaign || !discount || !forecast) {
    throw new Error("[film] сцена «change»: в посеве нет правки L-0015 (скидка и прогноз)");
  }
  // Та же формула, что у посева (promo-mock-data.ts): roundTo(старая цена × (1 − скидка), 10 000).
  const newPrice =
    Math.round((item.oldRetailPrice * (1 - Number(discount.value) / 100)) / 10_000) * 10_000;
  return { line, item, campaign, discount, forecast, newPrice };
}
const DATA = pickChange();

/**
 * Главный момент фильма: карточка «Было → Стало». Старые значения
 * зачёркиваются, новые въезжают; бейдж «На согл. у КД» перетекает в
 * «Согласовано КД» с пульсом галочки. Надписи — интерфейс, всегда по-русски.
 */
export function ChangeFragment({ t }: SceneProps) {
  const card = progress(t, 0, 0.5, easeOutExpo);
  const strike = progress(t, 0.7, 1.0, easeInOutCubic);
  const arrive = (delay: number) => progress(t, 1.0 + delay, 1.4 + delay, easeOutExpo);
  const oldBadge = 1 - progress(t, 2.1, 2.35);
  const newBadge = progress(t, 2.25, 2.6, easeOutBack);
  const check = progress(t, 2.4, 2.8, easeOutBack);
  const ring = progress(t, 2.5, 3.3);
  const { line, item, campaign, discount, forecast, newPrice } = DATA;
  const rows: { label: string; was: React.ReactNode; now: React.ReactNode; delay: number }[] = [
    { label: "Цена по акции", was: <Money value={line.newPrice} />, now: <Money value={newPrice} />, delay: 0 },
    { label: discount.label, was: discount.was, now: discount.now, delay: 0.1 },
    { label: forecast.label, was: forecast.was, now: forecast.now, delay: 0.2 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "46%",
        width: 560,
        opacity: card,
        transform: `translate(-50%, -50%) scale(1.9) translateY(${(1 - card) * 40}px)`,
      }}
    >
      <div
        style={{
          padding: "18px 20px",
          borderRadius: 14,
          background: FILM.card,
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.45)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-gray-500">
            {formatPromoNo(campaign.id)} · {campaign.name}
          </span>
          <span className="relative inline-flex h-6 items-center">
            <span
              style={{
                position: "absolute",
                right: 0,
                whiteSpace: "nowrap",
                opacity: oldBadge,
                transform: `scale(${0.8 + 0.2 * oldBadge})`,
                transformOrigin: "right center",
              }}
            >
              <PromoStatusBadge status="На согласовании у коммерческого директора" />
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                opacity: Math.min(1, Math.max(0, newBadge)),
                transform: `scale(${1.25 - 0.25 * newBadge})`,
                transformOrigin: "right center",
              }}
            >
              <PromoStatusBadge status="Согласовано КД" />
              <span
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: APPROVED,
                  transform: `scale(${Math.max(0, check)})`,
                }}
              >
                <Check className="size-3.5" color="#FFFFFF" strokeWidth={3} />
                {ring > 0 && ring < 1 && (
                  <span
                    style={{
                      position: "absolute",
                      inset: -12 * ring,
                      borderRadius: "50%",
                      border: `2px solid ${APPROVED}`,
                      opacity: 1 - ring,
                    }}
                  />
                )}
              </span>
            </span>
          </span>
        </div>
        <p className="mt-2 text-lg font-semibold text-gray-900">{item.name}</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr 24px 1fr",
            alignItems: "center",
            rowGap: 10,
            marginTop: 14,
          }}
        >
          <span />
          <span className="text-xs text-gray-400">Было</span>
          <span />
          <span className="text-xs text-gray-400">Стало</span>
          {rows.map((r) => {
            const p = arrive(r.delay);
            return (
              <React.Fragment key={r.label}>
                <span className="text-sm text-gray-500">{r.label}</span>
                <span
                  className="relative justify-self-start text-sm tabular-nums"
                  style={{ color: strike > 0.5 ? GRAY_400 : GRAY_900 }}
                >
                  {r.was}
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "52%",
                      height: 2,
                      width: `${strike * 100}%`,
                      background: REJECTED,
                    }}
                  />
                </span>
                <span className="text-sm text-gray-400" style={{ opacity: p }}>
                  →
                </span>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{
                    display: "inline-block",
                    color: GRAY_900,
                    opacity: p,
                    transform: `translateX(${(1 - p) * 28}px)`,
                  }}
                >
                  {r.now}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
