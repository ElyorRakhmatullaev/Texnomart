"use client";

import * as React from "react";

export type ThemeOption = "light" | "dark" | "system";

export const THEME_KEY = "promo:pref-theme";

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolveIsDark(theme: ThemeOption): boolean {
  return theme === "dark" || (theme === "system" && systemPrefersDark());
}

function applyThemeClass(theme: ThemeOption): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveIsDark(theme));
}

export function readStoredTheme(): ThemeOption {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "light";
}

interface ThemeContextValue {
  /** The chosen preference (may be "system"). */
  theme: ThemeOption;
  /** Resolved value — true when the `.dark` class is currently applied. */
  isDark: boolean;
  setTheme: (t: ThemeOption) => void;
  /** Cycle light → dark → system (used by the header toggle). */
  cycleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const CYCLE_ORDER: ThemeOption[] = ["light", "dark", "system"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeOption>(() =>
    readStoredTheme()
  );
  const [isDark, setIsDark] = React.useState<boolean>(() =>
    resolveIsDark(theme)
  );

  const commit = React.useCallback((next: ThemeOption) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_KEY, next);
    }
    applyThemeClass(next);
    setIsDark(resolveIsDark(next));
  }, []);

  const setTheme = React.useCallback(
    (next: ThemeOption) => {
      setThemeState(next);
      commit(next);
    },
    [commit]
  );

  const cycleTheme = React.useCallback(() => {
    setThemeState((prev) => {
      const next = CYCLE_ORDER[(CYCLE_ORDER.indexOf(prev) + 1) % CYCLE_ORDER.length];
      commit(next);
      return next;
    });
  }, [commit]);

  // Re-apply on mount in case the inline boot script in index.html didn't run
  // (e.g. SSR/dev edge cases) and keep the resolved value in sync.
  React.useEffect(() => {
    applyThemeClass(theme);
    setIsDark(resolveIsDark(theme));
  }, [theme]);

  // Live OS-preference updates while in "system" mode.
  React.useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyThemeClass("system");
      setIsDark(systemPrefersDark());
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, isDark, setTheme, cycleTheme }),
    [theme, isDark, setTheme, cycleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
