"use client";

import * as React from "react";
import {
  getRoleConfig,
  persistRoleConfig,
  resetRoleConfig,
} from "../../../lib/notification-settings-store";
import type {
  NotificationType,
  RoleNotificationConfig,
} from "../../../lib/promo-mock-data";
import type { PromoRole } from "../../role-context";

interface NotificationSettingsValue {
  config: RoleNotificationConfig;
  setRoleCategory: (role: PromoRole, type: NotificationType, on: boolean) => void;
  resetConfig: () => void;
}

const Ctx = React.createContext<NotificationSettingsValue | undefined>(undefined);

/**
 * E-2b — holds the role×category notification config so the editor, the
 * notification center, and the top-bar bell all react to a toggle live. Mounted
 * ABOVE the AppShell (in ProtectedLayout). Persists every change to localStorage.
 */
export function NotificationSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = React.useState<RoleNotificationConfig>(() =>
    getRoleConfig()
  );

  const setRoleCategory = React.useCallback(
    (role: PromoRole, type: NotificationType, on: boolean) => {
      setConfig((prev) => {
        const current = prev[role] ?? [];
        const nextForRole = on
          ? current.includes(type)
            ? current
            : [...current, type]
          : current.filter((t) => t !== type);
        const next = { ...prev, [role]: nextForRole };
        persistRoleConfig(next);
        return next;
      });
    },
    []
  );

  const resetConfig = React.useCallback(() => {
    setConfig(resetRoleConfig());
  }, []);

  const value = React.useMemo<NotificationSettingsValue>(
    () => ({ config, setRoleCategory, resetConfig }),
    [config, setRoleCategory, resetConfig]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotificationSettings() {
  const ctx = React.useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useNotificationSettings must be used within a NotificationSettingsProvider"
    );
  }
  return ctx;
}
