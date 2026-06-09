import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

export function formatDate(
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(
    "ru-RU",
    options ?? { day: "2-digit", month: "2-digit", year: "2-digit" }
  ).format(date);
}

export function formatDateFull(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: ru });
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("ru-RU")} UZS`;
}

export function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} млрд`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} млн`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)} тыс`;
  }
  return amount.toLocaleString("ru-RU");
}

export function formatNumber(value: number): string {
  return value.toLocaleString("ru-RU");
}

export function maskPhone(phone: string): string {
  return phone.replace(
    /(\+998 \d{2}) (\d)\d\d-\d\d-(\d\d)/,
    "$1 $2••-••-$3"
  );
}

export function maskPinfl(pinfl: string): string {
  return `••••${pinfl.slice(-4)}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

export function formatLastLogin(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 24) {
    return `Сегодня ${date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) {
    return `Вчера ${date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  return formatDate(date);
}
