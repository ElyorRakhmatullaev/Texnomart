"use client";

import * as React from "react";

/**
 * The nine Promo roles from the spec access matrix (Appendix D).
 * One user may hold several roles but acts as exactly one at a time —
 * the active role is held here and drives nav/button/field gating across the app.
 */
export const PROMO_ROLES = [
  "Коммерческий директор",
  "Операционный директор",
  "Директор маркетинга",
  "Категорийный менеджер (КМ)",
  "Старший КМ",
  "Сотрудник маркетинга",
  "Сотрудник закупа",
  "Сотрудник аналитики",
  "Администратор",
] as const;

export type PromoRole = (typeof PROMO_ROLES)[number];

const STORAGE_KEY = "promo:current-role";

interface RoleContextValue {
  /** Roles the seeded user may switch among (here: all of them, for the demo). */
  roles: PromoRole[];
  /** The single active role. */
  currentRole: PromoRole;
  setCurrentRole: (role: PromoRole) => void;
}

const RoleContext = React.createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRoleState] = React.useState<PromoRole>(() => {
    if (typeof window !== "undefined") {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored && (PROMO_ROLES as readonly string[]).includes(stored)) {
        return stored as PromoRole;
      }
    }
    return "Коммерческий директор";
  });

  const setCurrentRole = React.useCallback((role: PromoRole) => {
    setCurrentRoleState(role);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, role);
    }
  }, []);

  const value = React.useMemo<RoleContextValue>(
    () => ({ roles: [...PROMO_ROLES], currentRole, setCurrentRole }),
    [currentRole, setCurrentRole]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = React.useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return ctx;
}
