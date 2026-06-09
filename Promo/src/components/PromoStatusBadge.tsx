"use client";

import { StatusBadge } from "@texnomart/shared/components/status-badge";
import type { StatusConfig } from "@texnomart/shared/types";

/**
 * Full Promo status map (Appendix A + PROMPT 0): campaign-, KM-, and plan-level.
 * Soft tints (light bg + colored text) — color is paired with the status text,
 * never used alone. Keys are the exact RU status strings used in mock data.
 */
export const PROMO_STATUS_CONFIG: Record<string, StatusConfig> = {
  // Campaign-level
  "На согласовании у старшего КМ": { label: "На согл. у старшего КМ", bg: "bg-amber-50", text: "text-amber-700" },
  "На согласовании у коммерческого директора": { label: "На согл. у КД", bg: "bg-amber-50", text: "text-amber-700" },
  "Переотправлено на корректировку КМ": { label: "Переотправлено КМ", bg: "bg-red-50", text: "text-red-700" },
  "Согласовано и отправлено смежным отделам": { label: "Согласовано и отправлено", bg: "bg-emerald-50", text: "text-emerald-800" },
  "Отменена": { label: "Отменена", bg: "bg-red-100", text: "text-red-800" },

  // KM-level
  "Не заполнено / Ожидание корректировки от КМ": { label: "Не заполнено / на корректировке", bg: "bg-red-50", text: "text-red-700" },
  "Согласовано старшим КМ (ожидает КД)": { label: "Согл. старшим КМ (ожидает КД)", bg: "bg-blue-50", text: "text-blue-700" },
  "Принято коммерческим директором": { label: "Принято КД", bg: "bg-emerald-50", text: "text-emerald-700" },
  "Не участвует": { label: "Не участвует", bg: "bg-gray-100", text: "text-gray-600" },

  // Other states (PROMPT 0)
  "Ожидает проверки 1С": { label: "Ожидает проверки 1С", bg: "bg-orange-50", text: "text-orange-700" },
  "Ожидает повторного согласования маркетинга": { label: "Ожидает согл. маркетинга", bg: "bg-pink-50", text: "text-pink-700" },

  // Plan-level
  "На ознакомлении": { label: "На ознакомлении", bg: "bg-gray-100", text: "text-gray-600" },
  "На обсуждении": { label: "На обсуждении", bg: "bg-blue-50", text: "text-blue-700" },
  "На согл. с КД": { label: "На согл. с КД", bg: "bg-amber-50", text: "text-amber-700" },
  "На согл. с ОД": { label: "На согл. с ОД", bg: "bg-amber-50", text: "text-amber-700" },
  "Утверждён": { label: "Утверждён", bg: "bg-emerald-50", text: "text-emerald-700" },
  "Отклонён": { label: "Отклонён", bg: "bg-red-50", text: "text-red-700" },
};

interface PromoStatusBadgeProps {
  status: string;
  className?: string;
}

export function PromoStatusBadge({ status, className }: PromoStatusBadgeProps) {
  return (
    <StatusBadge config={PROMO_STATUS_CONFIG} status={status} className={className} />
  );
}
