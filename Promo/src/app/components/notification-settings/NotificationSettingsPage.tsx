"use client";

import * as React from "react";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { Card } from "@texnomart/ui/card";
import { Switch } from "@texnomart/ui/switch";
import { Button } from "@texnomart/ui/button";
import { cn } from "@texnomart/ui/utils";
import { useRole, PROMO_ROLES } from "../../role-context";
import { useNotificationSettings } from "./NotificationSettingsProvider";
import {
  NOTIFICATION_TYPE_META,
  type NotificationType,
} from "../../../lib/promo-mock-data";

const CATEGORIES = Object.keys(NOTIFICATION_TYPE_META) as NotificationType[];

export function NotificationSettingsPage() {
  const { currentRole } = useRole();
  const { config, setRoleCategory, resetConfig } = useNotificationSettings();

  if (currentRole !== "Администратор") {
    return (
      <div className="flex flex-col gap-4 pb-6">
        <PageHeader title="Настройки уведомлений" showCompare={false} showExport={false} />
        <Card className="p-8 text-center text-muted-foreground">
          Недостаточно прав. Экран доступен только роли «Администратор».
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Настройки уведомлений"
        subtitle="Какие категории уведомлений получает каждая роль."
        showCompare={false}
        showExport={false}
        actions={
          <Button variant="secondary" size="sm" className="h-9" onClick={resetConfig}>
            Сбросить к умолчаниям
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {PROMO_ROLES.map((role) => {
          const isAdmin = role === "Администратор";
          const set = config[role] ?? [];
          return (
            <Card key={role} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{role}</h3>
                {isAdmin && (
                  <span className="text-xs text-muted-foreground">видит все уведомления</span>
                )}
              </div>
              <div className="space-y-1">
                {CATEGORIES.map((type) => {
                  const meta = NOTIFICATION_TYPE_META[type];
                  const checked = isAdmin ? true : set.includes(type);
                  return (
                    <label
                      key={type}
                      className="flex min-h-11 cursor-pointer items-center justify-between gap-3"
                    >
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
                          meta.bg,
                          meta.text
                        )}
                      >
                        {meta.label}
                      </span>
                      <Switch
                        checked={checked}
                        disabled={isAdmin}
                        onCheckedChange={(on) => setRoleCategory(role, type, on)}
                        aria-label={`${role}: ${meta.label}`}
                      />
                    </label>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
