// E-2 — persistence for the live notifications store (localStorage, per-browser).
// Two keys:
//   promo:notifications-live          — live-emitted notifications (capped 50, newest first)
//   promo:notifications-read:<userId> — read notification ids for that user (anon fallback)
// Mirrors report-ack-store.ts: defensive JSON, SSR-safe `typeof window` guard.

import type { PromoNotification } from "./promo-mock-data";

const LIVE_KEY = "promo:notifications-live";
const READ_KEY_PREFIX = "promo:notifications-read:";
const LIVE_CAP = 50;

function readKey(userId: string | null): string {
  return `${READ_KEY_PREFIX}${userId ?? "anon"}`;
}

/** A live notification serialized for storage (sentAt as ISO string). */
type StoredNotification = Omit<PromoNotification, "sentAt"> & { sentAt: string };

/** Live notifications, newest-first, with `sentAt` rehydrated to a Date. */
export function getLiveNotifications(): PromoNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(LIVE_KEY) ?? "[]"
    ) as StoredNotification[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((n) => ({ ...n, sentAt: new Date(n.sentAt) }));
  } catch {
    return [];
  }
}

/** Prepend a live notification, cap to the most recent 50, persist. */
export function appendLiveNotification(n: PromoNotification): void {
  if (typeof window === "undefined") return;
  try {
    const next = [n, ...getLiveNotifications()].slice(0, LIVE_CAP);
    const serialized: StoredNotification[] = next.map((x) => ({
      ...x,
      sentAt: x.sentAt.toISOString(),
    }));
    window.localStorage.setItem(LIVE_KEY, JSON.stringify(serialized));
  } catch {
    /* ignore quota / serialization errors (mock) */
  }
}

/** Read notification ids for a user (anon fallback when signed-out). */
export function getReadIds(userId: string | null): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(readKey(userId)) ?? "[]"
    ) as string[];
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

/** Add read ids for a user (deduped), persist. */
export function addReadIds(userId: string | null, ids: string[]): void {
  if (typeof window === "undefined" || ids.length === 0) return;
  try {
    const set = getReadIds(userId);
    for (const id of ids) set.add(id);
    window.localStorage.setItem(readKey(userId), JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}
