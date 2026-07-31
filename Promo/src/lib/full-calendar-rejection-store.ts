"use client";

/**
 * Per-user set of rejection details the КМ has already viewed (10-я Блок 6.4): a red
 * indicator on a rejected line disappears once its «Детали изменений» panel is opened.
 * localStorage, keyed by user (anon fallback) — mock, per-browser.
 */
const KEY_PREFIX = "promo:fc-rejection-seen:";

function keyFor(userId: string | null): string {
  return KEY_PREFIX + (userId ?? "anon");
}

export function getSeenRejections(userId: string | null): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? new Set(arr.filter((x) => typeof x === "string"))
      : new Set();
  } catch {
    return new Set();
  }
}

export function markRejectionSeen(userId: string | null, lineId: string): void {
  if (typeof window === "undefined") return;
  try {
    const seen = getSeenRejections(userId);
    if (seen.has(lineId)) return;
    seen.add(lineId);
    window.localStorage.setItem(keyFor(userId), JSON.stringify([...seen]));
  } catch {
    // ignore quota / serialization errors (mock)
  }
}
