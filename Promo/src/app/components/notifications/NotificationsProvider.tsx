"use client";

import * as React from "react";
import {
  buildNotifications,
  type PromoNotification,
} from "../../../lib/promo-mock-data";

interface NotificationsContextValue {
  /** Full seed (all roles) — role filtering happens at read time in consumers. */
  notifications: PromoNotification[];
  /** Mark a single notification read. */
  acknowledge: (id: string) => void;
  /** Mark a set of notifications read (bulk «Ознакомлен»). */
  acknowledgeMany: (ids: string[]) => void;
}

const NotificationsContext = React.createContext<
  NotificationsContextValue | undefined
>(undefined);

/**
 * S6 notification store. Mounted ABOVE the AppShell (in `ProtectedLayout`) so the
 * top-bar bell, the sidebar «Уведомления» badge, AND the `/notifications` page all
 * read the same live read/unread state — acknowledging an item drops the bell
 * count immediately (spec §11.3). In-memory only: a reload reseeds (mock).
 */
export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = React.useState<PromoNotification[]>(
    () => buildNotifications()
  );

  const acknowledge = React.useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const acknowledgeMany = React.useCallback((ids: string[]) => {
    const set = new Set(ids);
    setNotifications((prev) =>
      prev.map((n) => (set.has(n.id) ? { ...n, read: true } : n))
    );
  }, []);

  const value = React.useMemo<NotificationsContextValue>(
    () => ({ notifications, acknowledge, acknowledgeMany }),
    [notifications, acknowledge, acknowledgeMany]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = React.useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return ctx;
}
