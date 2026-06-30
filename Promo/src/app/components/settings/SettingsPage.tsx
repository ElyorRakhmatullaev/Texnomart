"use client";

import * as React from "react";
import { Sun, Moon, Laptop, Globe, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@texnomart/ui/card";
import { cn } from "@texnomart/ui/utils";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { useRole } from "../../role-context";

type ThemeOption = "light" | "dark" | "system";

const LANG_KEY = "promo:pref-language";
const THEME_KEY = "promo:pref-theme";

const LANGUAGES = [
  { id: "ru", label: "Русский" },
  { id: "uz-cyr", label: "O'zbek (Кирилл.)" },
  { id: "uz-lat", label: "O'zbek (Лат.)" },
] as const;

const THEMES: { id: ThemeOption; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Светлая", icon: Sun },
  { id: "dark", label: "Тёмная", icon: Moon },
  { id: "system", label: "Системная", icon: Laptop },
];

function applyTheme(theme: ThemeOption) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", isDark);
  }
}

export function SettingsPage() {
  const { currentRole } = useRole();

  const [language, setLanguage] = React.useState<string>(() => {
    if (typeof window === "undefined") return "ru";
    return window.localStorage.getItem(LANG_KEY) ?? "ru";
  });

  const [theme, setTheme] = React.useState<ThemeOption>(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(THEME_KEY) as ThemeOption | null;
    if (stored) return stored;
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  const handleLanguage = (id: string) => {
    setLanguage(id);
    window.localStorage.setItem(LANG_KEY, id);
    toast.success("Язык интерфейса сохранён");
  };

  const handleTheme = (id: ThemeOption) => {
    setTheme(id);
    window.localStorage.setItem(THEME_KEY, id);
    applyTheme(id);
    toast.success(`Тема: ${THEMES.find((t) => t.id === id)?.label}`);
  };

  const canPromoTypes =
    currentRole === "Коммерческий директор" || currentRole === "Администратор";
  const canUsers = currentRole === "Администратор";

  return (
    <div className="flex max-w-2xl flex-col gap-4 pb-6">
      <PageHeader
        title="Настройки"
        subtitle="Персональные настройки интерфейса."
        showCompare={false}
        showExport={false}
      />

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Язык интерфейса</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {LANGUAGES.map((lang) => (
            <label
              key={lang.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                language === lang.id
                  ? "border-[#FFD60A] bg-[#FFD60A]/10"
                  : "border-transparent hover:bg-gray-50"
              )}
            >
              <input
                type="radio"
                name="language"
                value={lang.id}
                checked={language === lang.id}
                onChange={() => handleLanguage(lang.id)}
                className="accent-[#FFD60A]"
              />
              <Globe className="size-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">{lang.label}</span>
            </label>
          ))}
          <p className="pt-1 text-xs text-gray-500">
            Выбор сохраняется, но перевод интерфейса появится в следующих версиях
            (сейчас все экраны на русском).
          </p>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Тема оформления</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {THEMES.map((t) => {
              const Icon = t.icon;
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTheme(t.id)}
                  className={cn(
                    "rounded-xl border-2 p-1 transition-all",
                    active
                      ? "border-[#FFD60A] ring-2 ring-[#FFD60A]/30"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex h-16 items-center justify-center rounded-lg bg-gray-50">
                    <Icon className="size-7 text-gray-600" />
                  </div>
                  <p
                    className={cn(
                      "mb-1 mt-2 text-sm font-medium",
                      active ? "text-gray-900" : "text-gray-600"
                    )}
                  >
                    {t.label}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500">
            Полноценная тёмная тема дорабатывается — переключатель меняет режим,
            визуальная отделка дорабатывается отдельно.
          </p>
        </CardContent>
      </Card>

      {/* Related settings (honest cross-links, not duplicated controls) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Связанные настройки</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SettingsLink to="/notifications" label="Уведомления" hint="Центр уведомлений и отметки о прочтении" />
          {canPromoTypes && (
            <SettingsLink
              to="/promo-types"
              label="Настройки типов промо"
              hint="Обязательные поля по типам акций"
            />
          )}
          {canUsers && (
            <SettingsLink
              to="/users"
              label="Управление пользователями"
              hint="Учётные записи, роли и пароли"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsLink({ to, label, hint }: { to: string; label: string; hint: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-0 hover:bg-gray-50"
    >
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-gray-400" />
    </Link>
  );
}
