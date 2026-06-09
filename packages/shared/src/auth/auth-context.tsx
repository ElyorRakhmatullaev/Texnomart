"use client";

import * as React from "react";

export interface AuthContextType {
  isAuthenticated: boolean;
  needsTwoFactor: boolean;
  login: () => void;
  verify2FA: () => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(
    () => sessionStorage.getItem("auth") === "true"
  );
  const [needsTwoFactor, setNeedsTwoFactor] = React.useState(false);

  const login = React.useCallback(() => {
    setNeedsTwoFactor(true);
  }, []);

  const verify2FA = React.useCallback(() => {
    setNeedsTwoFactor(false);
    setIsAuthenticated(true);
    sessionStorage.setItem("auth", "true");
  }, []);

  const logout = React.useCallback(() => {
    setIsAuthenticated(false);
    setNeedsTwoFactor(false);
    sessionStorage.removeItem("auth");
  }, []);

  const value = React.useMemo(
    () => ({ isAuthenticated, needsTwoFactor, login, verify2FA, logout }),
    [isAuthenticated, needsTwoFactor, login, verify2FA, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
