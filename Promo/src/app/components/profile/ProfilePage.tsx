"use client";

import * as React from "react";
import { User, ShieldCheck, Info, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@texnomart/ui/card";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import { Badge } from "@texnomart/ui/badge";
import { Avatar, AvatarFallback } from "@texnomart/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@texnomart/ui/tabs";
import { cn } from "@texnomart/ui/utils";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { getInitials } from "@texnomart/shared/utils/formatters";
import { RuDate } from "../../../components/RuDate";
import { NewPasswordForm } from "../auth/NewPasswordForm";
import { useCurrentUser } from "../../current-user-context";
import { useRole } from "../../role-context";
import {
  authenticate,
  updatePassword,
  updateUserName,
  type PromoUser,
  type UserStatus,
} from "../../../lib/users-store";
import { appendAuditEvent } from "../../../lib/audit-store";
import type { AuditActionType } from "../../../lib/promo-mock-data";

const TAB_TRIGGER =
  "flex-none whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:shadow-none";

const STATUS_META: Record<UserStatus, { label: string; cls: string }> = {
  active: { label: "Активен", cls: "bg-emerald-50 text-emerald-700" },
  "temp-password": { label: "Временный пароль", cls: "bg-amber-50 text-amber-700" },
  blocked: { label: "Заблокирован", cls: "bg-gray-200 text-gray-600" },
};

function ReadRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-2.5 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-medium text-gray-900">{children}</span>
    </div>
  );
}

// ─── Tab 1: Основная информация ──────────────────────────────────────────────

function InfoTab({ user, onSaved }: { user: PromoUser; onSaved: (comment: string) => void }) {
  const [nameDraft, setNameDraft] = React.useState(user.fullName);

  // Re-sync the draft when the stored name changes (after a successful save → refresh).
  React.useEffect(() => {
    setNameDraft(user.fullName);
  }, [user.fullName]);

  const trimmed = nameDraft.trim();
  const dirty = trimmed.length > 0 && trimmed !== user.fullName;

  const handleSave = () => {
    if (!dirty) return;
    updateUserName(user.id, trimmed);
    onSaved(`ФИО изменено на «${trimmed}»`);
    toast.success("Профиль обновлён");
  };

  return (
    <div className="space-y-6">
      {/* Identity card */}
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6 sm:flex-row sm:items-center sm:gap-4">
          <Avatar className="size-16 text-xl">
            <AvatarFallback className="bg-[#FFD60A] text-black text-xl font-semibold">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <p className="text-lg font-semibold text-gray-900">{user.fullName}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium sm:ml-auto",
              STATUS_META[user.status].cls
            )}
          >
            {STATUS_META[user.status].label}
          </span>
        </CardContent>
      </Card>

      {/* Editable contact info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Контактные данные</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">ФИО</Label>
            <Input
              id="fullName"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Фамилия Имя Отчество"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (логин)</Label>
            <Input id="email" value={user.email} readOnly className="bg-gray-50" />
            <p className="text-xs text-gray-500">
              Email используется как логин и изменяется только администратором.
            </p>
          </div>
          <div className="flex justify-end pt-1">
            <Button disabled={!dirty} onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Read-only account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Учётная запись</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ReadRow label="Роль учётной записи">
            <Badge variant="outline" className="font-normal text-gray-700">
              {user.role}
            </Badge>
          </ReadRow>
          <ReadRow label="Статус">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                STATUS_META[user.status].cls
              )}
            >
              {STATUS_META[user.status].label}
            </span>
          </ReadRow>
          <ReadRow label="Дата создания">
            <RuDate value={new Date(user.createdAt)} className="tabular-nums" />
          </ReadRow>
          <ReadRow label="Последняя смена пароля">
            {user.lastPasswordChangeAt ? (
              <RuDate value={new Date(user.lastPasswordChangeAt)} withTime className="tabular-nums" />
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </ReadRow>
          <p className="pt-3 text-xs text-gray-500">
            Роль и права назначаются администратором в разделе «Управление пользователями».
            Активную роль интерфейса можно переключить в меню пользователя.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 2: Безопасность ─────────────────────────────────────────────────────

function SecurityTab({ user, onChanged }: { user: PromoUser; onChanged: () => void }) {
  // Bump to remount NewPasswordForm (clearing its fields) after a successful change.
  const [formKey, setFormKey] = React.useState(0);

  const handleChangePassword = (newPassword: string) => {
    updatePassword(user.id, newPassword);
    onChanged();
    setFormKey((k) => k + 1);
    toast.success("Пароль изменён");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-gray-500">
            Последнее изменение пароля:{" "}
            {user.lastPasswordChangeAt ? (
              <RuDate
                value={new Date(user.lastPasswordChangeAt)}
                withTime
                className="font-medium text-gray-700 tabular-nums"
              />
            ) : (
              <span className="text-gray-400">ещё не менялся</span>
            )}
          </p>
          <NewPasswordForm
            key={formKey}
            title="Изменить пароль"
            description="Укажите текущий пароль и придумайте новый — не менее 10 символов."
            submitLabel="Сменить пароль"
            verifyCurrentPassword={(current) => authenticate(user.email, current) !== null}
            onSubmit={handleChangePassword}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start gap-3 pt-6">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">Двухфакторная аутентификация</p>
            <p className="text-sm text-gray-500">
              Вход в систему выполняется по email и паролю. Двухфакторная аутентификация
              в текущей версии не используется.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Profile Page ───────────────────────────────────────────────────────

export function ProfilePage() {
  const { currentUser, refresh } = useCurrentUser();
  const { currentRole } = useRole();
  const [tab, setTab] = React.useState("info");

  const audit = React.useCallback(
    (action: AuditActionType, comment: string) => {
      if (!currentUser) return;
      appendAuditEvent({
        user: currentUser.fullName,
        role: currentRole,
        action,
        objectType: "пользователь",
        objectLabel: currentUser.fullName,
        comment,
      });
    },
    [currentUser, currentRole]
  );

  if (!currentUser) {
    return (
      <div className="flex flex-col">
        <PageHeader title="Мой профиль" showCompare={false} showExport={false} />
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 bg-white py-16 text-center">
          <User className="size-12 text-gray-300" />
          <p className="text-sm text-muted-foreground">Не удалось загрузить профиль пользователя.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <PageHeader
        title="Мой профиль"
        subtitle="Личные данные и безопасность учётной записи."
        showCompare={false}
        showExport={false}
      />

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="h-auto justify-start gap-1 rounded-none border-b bg-transparent p-0">
          <TabsTrigger value="info" className={TAB_TRIGGER}>
            <Info className="mr-1.5 size-4" />
            Основная информация
          </TabsTrigger>
          <TabsTrigger value="security" className={TAB_TRIGGER}>
            <KeyRound className="mr-1.5 size-4" />
            Безопасность
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-0 max-w-2xl">
          <InfoTab
            user={currentUser}
            onSaved={(comment) => {
              audit("изменение профиля", comment);
              refresh();
            }}
          />
        </TabsContent>
        <TabsContent value="security" className="mt-0 max-w-2xl">
          <SecurityTab
            user={currentUser}
            onChanged={() => {
              audit("смена пароля", "Пароль изменён владельцем учётной записи");
              refresh();
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
