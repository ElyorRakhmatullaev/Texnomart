"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  buildNotifications,
  createLiveNotification,
  NOTIFICATION_TYPE_META,
  type NotificationInput,
  type PromoNotification,
} from "../../../lib/promo-mock-data";
import {
  addReadIds,
  appendLiveNotification,
  getLiveNotifications,
  getReadIds,
} from "../../../lib/notifications-store";
import { useCurrentUser } from "../../current-user-context";
import { useRole } from "../../role-context";

interface NotificationsContextValue {
  /** Full store (seeds + live), newest-first — role filtering happens in consumers. */
  notifications: PromoNotification[];
  /** Mark a single notification read (persisted per user). */
  acknowledge: (id: string) => void;
  /** Mark a set of notifications read (bulk «Ознакомлен», persisted per user). */
  acknowledgeMany: (ids: string[]) => void;
  /** Emit a live notification from an action handler: persists + toasts. */
  notify: (input: NotificationInput) => PromoNotification;
}

const NotificationsContext = React.createContext<
  NotificationsContextValue | undefined
>(undefined);

/**
 * Merge persisted live notifications with the rebuilt seeds, newest-first, and
 * apply the persisted per-user read-set. Seeds are rebuilt here (never via
 * `notify`) so NO toast fires on load — only real actions toast.
 */
function buildInitial(userId: string | null): PromoNotification[] {
  const readIds = getReadIds(userId);
  return [...getLiveNotifications(), ...buildNotifications()]
    .map((n) => (readIds.has(n.id) ? { ...n, read: true } : n))
    .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
}

/**
 * S6 / E-2 notification store. Mounted ABOVE the AppShell (in `ProtectedLayout`)
 * so the top-bar bell, the sidebar «Уведомления» badge, and the `/notifications`
 * page share one live read/unread state. Live-emitted notifications + per-user
 * read-state persist to localStorage (E-2); seeds rebuild each load. Read-state
 * is keyed to the user at mount (the provider mounts post-login), anon otherwise.
 */
export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser } = useCurrentUser();
  const { currentRole } = useRole();
  const navigate = useNavigate();
  const userId = currentUser?.id ?? null;

  const [notifications, setNotifications] = React.useState<PromoNotification[]>(
    () => buildInitial(userId)
  );

  // Per-session sequence → unique live ids within a session.
  const seqRef = React.useRef(0);

  const acknowledge = React.useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      addReadIds(userId, [id]);
    },
    [userId]
  );

  const acknowledgeMany = React.useCallback(
    (ids: string[]) => {
      const set = new Set(ids);
      setNotifications((prev) =>
        prev.map((n) => (set.has(n.id) ? { ...n, read: true } : n))
      );
      addReadIds(userId, ids);
    },
    [userId]
  );

  const notify = React.useCallback(
    (input: NotificationInput): PromoNotification => {
      const actor = {
        name: currentUser?.fullName ?? currentRole,
        role: currentRole,
      };
      const n = createLiveNotification(
        input,
        actor,
        seqRef.current++,
        new Date()
      );
      setNotifications((prev) =>
        [n, ...prev].sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      );
      appendLiveNotification(n);
      const meta = NOTIFICATION_TYPE_META[n.type];
      toast(meta.label, {
        description: n.campaignName
          ? `${n.campaignName}: ${n.description}`
          : n.description,
        action: { label: "Открыть", onClick: () => navigate(n.href) },
      });
      return n;
    },
    [currentUser, currentRole, navigate]
  );

  const value = React.useMemo<NotificationsContextValue>(
    () => ({ notifications, acknowledge, acknowledgeMany, notify }),
    [notifications, acknowledge, acknowledgeMany, notify]
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
