"use client";

import * as React from "react";
import { Sun, Moon, Laptop, Globe, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@texnomart/ui/card";
import { cn } from "@texnomart/ui/utils";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { useRole } from "../../role-context";
import { useTheme, type ThemeOption } from "../../theme-context";

const LANG_KEY = "promo:pref-language";

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

export function SettingsPage() {
  const { currentRole } = useRole();
  const { theme, setTheme } = useTheme();

  const [language, setLanguage] = React.useState<string>(() => {
    if (typeof window === "undefined") return "ru";
    return window.localStorage.getItem(LANG_KEY) ?? "ru";
  });

  const handleLanguage = (id: string) => {
    setLanguage(id);
    window.localStorage.setItem(LANG_KEY, id);
    toast.success("Язык интерфейса сохранён");
  };

  const handleTheme = (id: ThemeOption) => {
    setTheme(id);
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
                  ? "border-primary bg-primary/10"
                  : "border-transparent hover:bg-accent"
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
              <Globe className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{lang.label}</span>
            </label>
          ))}
          <p className="pt-1 text-xs text-muted-foreground">
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
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-muted-foreground/40"
                  )}
                >
                  <div className="flex h-16 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-7 text-muted-foreground" />
                  </div>
                  <p
                    className={cn(
                      "mb-1 mt-2 text-sm font-medium",
                      active ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {t.label}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Тема применяется сразу и сохраняется между сессиями. «Системная»
            следует за настройкой оформления вашей ОС.
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
      className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0 hover:bg-accent"
    >
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
