"use client";

import * as React from "react";
import { getUserById, type PromoUser } from "../lib/users-store";

const STORAGE_KEY = "promo:current-user-id";

interface CurrentUserValue {
  currentUser: PromoUser | null;
  login: (user: PromoUser) => void;
  logout: () => void;
  /** Перечитать текущего пользователя из стора (после смены пароля и т.п.). */
  refresh: () => void;
}

const CurrentUserContext = React.createContext<CurrentUserValue | undefined>(undefined);

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = React.useState<PromoUser | null>(() => {
    if (typeof window === "undefined") return null;
    const id = window.sessionStorage.getItem(STORAGE_KEY);
    return id ? getUserById(id) ?? null : null;
  });

  const login = React.useCallback((user: PromoUser) => {
    window.sessionStorage.setItem(STORAGE_KEY, user.id);
    setCurrentUser(user);
  }, []);

  const logout = React.useCallback(() => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
  }, []);

  const refresh = React.useCallback(() => {
    setCurrentUser((prev) => (prev ? getUserById(prev.id) ?? null : null));
  }, []);

  const value = React.useMemo<CurrentUserValue>(
    () => ({ currentUser, login, logout, refresh }),
    [currentUser, login, logout, refresh]
  );

  return (
    <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = React.useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within a CurrentUserProvider");
  return ctx;
}
