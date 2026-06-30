"use client";

import { StatusBadge } from "@texnomart/shared/components/status-badge";
import type { StatusConfig } from "@texnomart/shared/types";

/**
 * Full Promo status map (Appendix A + PROMPT 0): campaign-, KM-, and plan-level.
 * Soft tints (light bg + colored text) — color is paired with the status text,
 * never used alone. Keys are the exact RU status strings used in mock data.
 */
export const PROMO_STATUS_CONFIG: Record<string, StatusConfig> = {
  // Campaign-level (labels shortened per client feedback §6a)
  "Черновик": { label: "Черновик", bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-300" },
  "На согласовании у старшего КМ": { label: "На согл. у ст. КМ", bg: "bg-amber-50 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-300" },
  "На согласовании у коммерческого директора": { label: "На согл. у КД", bg: "bg-orange-50 dark:bg-orange-500/15", text: "text-orange-700 dark:text-orange-300" },
  "Переотправлено на корректировку КМ": { label: "Переотправлено КМ", bg: "bg-red-50 dark:bg-red-500/15", text: "text-red-700 dark:text-red-300" },
  "Согласовано и отправлено смежным отделам": { label: "Согл. и отправлено", bg: "bg-emerald-50 dark:bg-emerald-500/15", text: "text-emerald-800 dark:text-emerald-300" },
  "Отменена": { label: "Отменена", bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-500 dark:text-gray-400" },

  // KM-level (taxonomy per client feedback §5)
  "Не заполнено": { label: "Не заполнено", bg: "bg-red-50 dark:bg-red-500/15", text: "text-red-700 dark:text-red-300" },
  "Согласовано КД": { label: "Согласовано КД", bg: "bg-emerald-50 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300" },
  "Не участвует": { label: "Не участвует", bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-300" },

  // Other states (PROMPT 0)
  "Ожидает проверки 1С": { label: "Ожидает проверки 1С", bg: "bg-orange-50 dark:bg-orange-500/15", text: "text-orange-700 dark:text-orange-300" },
  "Ожидает повторного согласования маркетинга": { label: "Ожидает согл. маркетинга", bg: "bg-pink-50 dark:bg-pink-500/15", text: "text-pink-700 dark:text-pink-300" },

  // Plan-level
  "На ознакомлении": { label: "На ознакомлении", bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-300" },
  "На обсуждении": { label: "На обсуждении", bg: "bg-blue-50 dark:bg-blue-500/15", text: "text-blue-700 dark:text-blue-300" },
  "На согл. с КД": { label: "На согл. с КД", bg: "bg-amber-50 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-300" },
  "На согл. с ОД": { label: "На согл. с ОД", bg: "bg-amber-50 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-300" },
  "Утверждён": { label: "Утверждён", bg: "bg-emerald-50 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300" },
  "Отклонён": { label: "Отклонён", bg: "bg-red-50 dark:bg-red-500/15", text: "text-red-700 dark:text-red-300" },
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
