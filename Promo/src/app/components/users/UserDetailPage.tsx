"use client";

import * as React from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import {
  FileX2,
  History,
  KeyRound,
  Pencil,
  ShieldCheck,
  User,
  UserCheck,
  UserX,
} from "lucide-react";
import { DetailPageHero } from "@texnomart/shared/components/detail-page-hero";
import { InfoRow } from "@texnomart/shared/components/info-row";
import { getInitials } from "@texnomart/shared/utils/formatters";
import { Button } from "@texnomart/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@texnomart/ui/card";
import { Label } from "@texnomart/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@texnomart/ui/tabs";
import { cn } from "@texnomart/ui/utils";
import { RuDate } from "../../../components/RuDate";
import { useCurrentUser } from "../../current-user-context";
import { useRole, type PromoRole } from "../../role-context";
import {
  canDeactivate,
  canManageUser,
  canRevokeAdmin,
  DEPARTMENTS,
  effectiveAdminScope,
  getUserById,
  getUsers,
  resetPassword,
  setDeptAdmin,
  setRoleAssignments,
  setUserStatus,
  updateUser,
  usableAdminCount,
  type UserStatus,
} from "../../../lib/users-store";
import {
  assignmentsOf,
  isAssignmentExpired,
  permanentRolesOf,
  primaryRoleOf,
} from "../../../lib/user-roles";
import { substitutionBadgeFor } from "../../../lib/kd-substitution-store";
import { getLiveAuditEvents, appendAuditEvent } from "../../../lib/audit-store";
import {
  AUDIT_ACTION_META,
  buildAuditLog,
  type AuditActionType,
} from "../../../lib/promo-mock-data";
import { UserFormDialog, type UserFormValue } from "./UserFormDialog";
import { TempPasswordDialog } from "./TempPasswordDialog";

const TAB_TRIGGER =
  "flex-none whitespace-nowrap rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 data-[state=active]:shadow-none";

const STATUS_META: Record<UserStatus, { label: string; cls: string }> = {
  active: { label: "Активен", cls: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  "temp-password": { label: "Временный пароль", cls: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  blocked: { label: "Деактивирован", cls: "bg-gray-200 dark:bg-muted text-gray-600 dark:text-gray-300" },
};

const ROLE_GROUP_LABEL = {
  primary: "Основная роль",
  additional: "Дополнительные роли",
  temporary: "Временные роли",
} as const;

/** «01.09.2026» из date-only «2026-09-01». */
function ruDateOnly(iso?: string): string {
  if (!iso) return "—";
  return iso.slice(0, 10).split("-").reverse().join(".");
}

/** Sentinel for the optional department Select — Radix disallows an empty-string item value. */
const NO_DEPT = "__no_department__";

export function UserDetailPage() {
  const { id } = useParams();
  const { currentUser } = useCurrentUser();
  const { currentRole } = useRole();

  const rawId = id ? decodeURIComponent(id) : "";

  // A plain re-render tick — users-store/audit-store are localStorage-backed with
  // no reactive subscription, so every mutation below bumps this to force a re-read.
  const [tick, setTick] = React.useState(0);
  const refresh = React.useCallback(() => setTick((t) => t + 1), []);

  const user = React.useMemo(
    () => (rawId ? getUserById(rawId) : undefined),
    [rawId, tick]
  );
  const allUsers = React.useMemo(() => getUsers(), [tick]);

  const [tab, setTab] = React.useState("profile");
  const [editOpen, setEditOpen] = React.useState(false);
  const [deptDraft, setDeptDraft] = React.useState<string | undefined>(() =>
    user?.adminScope?.kind === "department" ? user.adminScope.department : undefined
  );
  const [tempPassword, setTempPassword] = React.useState<string | null>(null);
  const [tempOpen, setTempOpen] = React.useState(false);

  // Re-sync the department draft whenever the viewed user changes.
  React.useEffect(() => {
    setDeptDraft(
      user?.adminScope && user.adminScope.kind === "department"
        ? user.adminScope.department
        : undefined
    );
  }, [user?.id, user?.adminScope]);

  const audit = React.useCallback(
    (action: AuditActionType, comment: string) => {
      if (!user) return;
      appendAuditEvent({
        user: currentUser?.fullName ?? "—",
        role: currentRole,
        action,
        objectType: "пользователь",
        objectLabel: user.fullName,
        targetUserId: user.id,
        comment,
      });
    },
    [user, currentUser, currentRole]
  );

  // Журнал действий — merges the live audit-store events with the S8 seed log
  // (same idiom as AuditLogTable), scoped to this user via targetUserId. Declared
  // before the not-found early-return so hook order stays stable across renders.
  const events = React.useMemo(() => {
    if (!user) return [];
    const merged = [...getLiveAuditEvents(), ...buildAuditLog()];
    return merged
      .filter((e) => e.targetUserId === user.id)
      .sort((a, b) => b.at.getTime() - a.at.getTime());
  }, [user, tick]);

  if (!user) {
    return (
      <div className="space-y-4">
        <Link
          to="/users"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          ← Пользователи
        </Link>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-20 text-center">
          <FileX2 className="size-12 text-muted-foreground/60" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Пользователь не найден
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Учётная запись «{rawId}» отсутствует в системе.
          </p>
        </div>
      </div>
    );
  }

  const assignments = assignmentsOf(user);
  const roles = permanentRolesOf(user);
  const primary = primaryRoleOf(user);
  const substitution = substitutionBadgeFor(user);
  // Scope of the VIEWED user's own admin grant (for the "Область
  // администрирования" display below) — distinct from the ACTOR's scope.
  const targetScope = effectiveAdminScope(user);
  // Effective admin scope for the LOGGED-IN user (actor), mirroring
  // UsersPage's derivation exactly: `effectiveAdminScope` reads the
  // multi-role set + `adminScope` off `currentUser`, with a god-mode
  // fallback to "global" when the role switcher is on «Администратор»
  // without a matching seeded `currentUser` (dev/demo convenience).
  // Without this fallback a non-admin god-moded into «Администратор» would
  // see a working /users list but a dead /users/:id detail page.
  const scope = effectiveAdminScope(currentUser) ?? (currentRole === "Администратор" ? "global" : null);
  const isGlobalAdmin = scope === "global";
  const canManage = scope === "global" ? true : scope ? canManageUser(currentUser, user) : false;
  const adminCount = usableAdminCount(allUsers);
  const deactivateBlocked = user.status !== "blocked" && !canDeactivate(user.id);
  const managerName = allUsers.find((u) => u.id === user.managerId)?.fullName ?? "—";

  function handleEditSubmit(value: UserFormValue) {
    if (!user) return;
    // ПОСТОЯННЫЕ роли: гейты ниже касаются постоянных прав администратора.
    const prevAssignments = assignmentsOf(user);
    const prevRoles = permanentRolesOf(user);

    // Belt-and-suspenders gate on the «Администратор» role: the form dialog
    // already locks the chip for non-global-admins (adminRoleLocked below),
    // but the parent still re-checks here — both because a non-global-admin
    // must never grant/revoke global admin rights, and because only this
    // scope knows the live ≥2-admin invariant (`canRevokeAdmin`).
    const wouldGrantAdmin =
      !prevRoles.includes("Администратор") && value.roles.includes("Администратор");
    const wouldRemoveAdmin =
      prevRoles.includes("Администратор") && !value.roles.includes("Администратор");

    if ((wouldGrantAdmin || wouldRemoveAdmin) && !isGlobalAdmin) {
      toast.error("Изменять роль «Администратор» может только глобальный администратор.");
      return;
    }
    if (wouldRemoveAdmin && !canRevokeAdmin(user.id)) {
      toast.error("Должно остаться не менее двух администраторов.");
      return;
    }

    const profileChanged =
      value.fullName !== user.fullName ||
      value.email !== user.email ||
      (value.department ?? "") !== (user.department ?? "") ||
      (value.position ?? "") !== (user.position ?? "") ||
      (value.managerId ?? "") !== (user.managerId ?? "");
    // Сравниваем РЕЕСТР, а не плоский список: иначе правка периода или
    // основания временной роли не считалась бы изменением.
    const rolesChanged =
      JSON.stringify(prevAssignments) !== JSON.stringify(value.assignments);

    updateUser(user.id, {
      fullName: value.fullName,
      email: value.email,
      department: value.department,
      position: value.position,
      managerId: value.managerId,
    });
    setRoleAssignments(user.id, value.assignments);

    if (profileChanged) {
      audit("изменение профиля", `Изменены данные профиля пользователя «${value.fullName}»`);
    }
    if (rolesChanged) {
      audit("изменение ролей", `Новый набор ролей: ${value.roles.join(", ")}`);
    }
    setEditOpen(false);
    refresh();
    toast.success("Пользователь обновлён");
  }

  function handleResetPassword() {
    if (!user) return;
    const pwd = resetPassword(user.id);
    audit("сброс пароля", "Сброшен пароль, выдан новый временный");
    setTempPassword(pwd);
    setTempOpen(true);
    refresh();
    toast.success("Пароль сброшен");
  }

  function handleToggleStatus() {
    if (!user) return;
    if (user.status === "blocked") {
      setUserStatus(user.id, "active");
      audit("разблокировка", "Учётная запись активирована");
      toast.success("Пользователь активирован");
    } else {
      if (!canDeactivate(user.id)) {
        toast.error("Должно остаться не менее двух администраторов");
        return;
      }
      setUserStatus(user.id, "blocked");
      audit("блокировка", "Учётная запись деактивирована");
      toast.success("Пользователь деактивирован");
    }
    refresh();
  }

  function handleSaveDeptAdmin() {
    if (!user || !deptDraft) return;
    setDeptAdmin(user.id, deptDraft);
    audit("назначение прав", `Назначены права администратора подразделения «${deptDraft}»`);
    refresh();
    toast.success("Права администратора подразделения назначены");
  }

  function handleClearDeptAdmin() {
    if (!user) return;
    setDeptAdmin(user.id, null);
    audit("отзыв прав", "Отозваны права администратора подразделения");
    refresh();
    toast.success("Права администратора подразделения отозваны");
  }

  return (
    <div className="space-y-4 pb-6">
      <DetailPageHero
        backHref="/users"
        backLabel="Пользователи"
        avatar={{ fallback: getInitials(user.fullName) }}
        title={user.fullName}
        subtitle={primary}
        badges={
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              STATUS_META[user.status].cls
            )}
          >
            {STATUS_META[user.status].label}
          </span>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="h-auto justify-start gap-1 rounded-none border-b bg-transparent p-0">
          <TabsTrigger value="profile" className={TAB_TRIGGER}>
            <User className="mr-1.5 size-4" />
            Профиль
          </TabsTrigger>
          <TabsTrigger value="roles" className={TAB_TRIGGER}>
            <ShieldCheck className="mr-1.5 size-4" />
            Роли и доступ
          </TabsTrigger>
          <TabsTrigger value="log" className={TAB_TRIGGER}>
            <History className="mr-1.5 size-4" />
            Журнал действий
          </TabsTrigger>
        </TabsList>

        {/* ── Профиль ─────────────────────────────────────────────────────── */}
        <TabsContent value="profile" className="mt-0 max-w-2xl">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Основные данные</CardTitle>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-4" />
                  Редактировать
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Подразделение" value={user.department ?? "—"} />
              <InfoRow label="Должность" value={user.position ?? "—"} />
              <InfoRow label="Руководитель" value={managerName} />
              <InfoRow label="Создан" value={<RuDate value={new Date(user.createdAt)} />} />
              <InfoRow label="Кем создана" value={user.createdBy ?? "—"} />
              {user.lastPasswordChangeAt && (
                <InfoRow
                  label="Последняя смена пароля"
                  value={<RuDate value={new Date(user.lastPasswordChangeAt)} withTime />}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Роли и доступ ───────────────────────────────────────────────── */}
        <TabsContent value="roles" className="mt-0 max-w-2xl space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Роли</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {(["primary", "additional", "temporary"] as const).map((kind) => {
                const items = assignments.filter((a) => a.kind === kind);
                if (items.length === 0) return null;
                return (
                  <div key={kind} className="space-y-1.5">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {ROLE_GROUP_LABEL[kind]}
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {items.map((a, i) => {
                        const expired = isAssignmentExpired(a);
                        return (
                          <li
                            key={`${a.role}-${i}`}
                            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
                          >
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                                kind === "primary"
                                  ? "bg-primary text-primary-foreground"
                                  : kind === "temporary"
                                  ? "border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300"
                                  : "bg-gray-100 dark:bg-muted text-gray-700 dark:text-gray-200",
                                expired && "opacity-60"
                              )}
                            >
                              {a.role}
                            </span>
                            {kind === "temporary" && (
                              <span className="text-xs text-muted-foreground">
                                с {ruDateOnly(a.from)} по {ruDateOnly(a.to)}
                              </span>
                            )}
                            {expired && (
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                срок истёк
                              </span>
                            )}
                            {a.assignedBy && (
                              <span className="text-xs text-muted-foreground">
                                · назначил(а): {a.assignedBy}
                              </span>
                            )}
                            {a.reason && (
                              <span className="text-xs text-muted-foreground">· {a.reason}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
              {substitution && (
                <div className="space-y-1.5 border-t border-gray-100 dark:border-border pt-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Временное замещение
                  </p>
                  <p className="text-sm text-violet-800 dark:text-violet-300">
                    {substitution.label} — с {ruDateOnly(substitution.from)} по{" "}
                    {ruDateOnly(substitution.to)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Права ограничены этапом согласования КД: администрирование учётных записей
                    замещение не даёт.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Административный доступ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <InfoRow
                label="Область администрирования"
                value={
                  targetScope === "global"
                    ? "Глобальный"
                    : targetScope
                    ? `Подразделение «${targetScope.department}»`
                    : "—"
                }
              />
              {isGlobalAdmin && !roles.includes("Администратор") && (
                <div className="flex flex-col gap-2 border-t border-gray-100 dark:border-border pt-4 sm:flex-row sm:items-end sm:gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Администратор подразделения
                    </Label>
                    <Select
                      value={deptDraft ?? NO_DEPT}
                      onValueChange={(v) => setDeptDraft(v === NO_DEPT ? undefined : v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_DEPT}>— не назначено —</SelectItem>
                        {DEPARTMENTS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={
                        !deptDraft ||
                        (user.adminScope?.kind === "department" &&
                          deptDraft === user.adminScope.department)
                      }
                      onClick={handleSaveDeptAdmin}
                    >
                      Назначить
                    </Button>
                    {user.adminScope && (
                      <Button size="sm" variant="outline" onClick={handleClearDeptAdmin}>
                        Отозвать
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Учётная запись</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 pt-0">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  STATUS_META[user.status].cls
                )}
              >
                {STATUS_META[user.status].label}
              </span>
              {canManage && (
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleResetPassword}
                  >
                    <KeyRound className="size-4" />
                    Сбросить пароль
                  </Button>
                  {user.status === "blocked" ? (
                    <Button size="sm" className="gap-1.5" onClick={handleToggleStatus}>
                      <UserCheck className="size-4" />
                      Активировать
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1.5"
                      disabled={deactivateBlocked}
                      title={
                        deactivateBlocked
                          ? `Должно остаться не менее двух администраторов (сейчас: ${adminCount})`
                          : undefined
                      }
                      onClick={handleToggleStatus}
                    >
                      <UserX className="size-4" />
                      Деактивировать
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Журнал действий ─────────────────────────────────────────────── */}
        <TabsContent value="log" className="mt-0 max-w-3xl">
          <Card>
            <CardContent className="p-0">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                  <History className="size-10 text-gray-300 dark:text-gray-500" />
                  <p className="text-sm text-muted-foreground">Действий пока нет</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-border">
                  {events.map((e) => (
                    <li
                      key={e.id}
                      className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-3"
                    >
                      <RuDate
                        value={e.at}
                        withTime
                        className="w-[150px] shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400"
                      />
                      <span
                        className={cn(
                          "inline-flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          AUDIT_ACTION_META[e.action].bg,
                          AUDIT_ACTION_META[e.action].text
                        )}
                      >
                        {e.action}
                      </span>
                      <span className="min-w-0 flex-1 text-sm text-gray-700 dark:text-gray-200">
                        {e.comment ?? "—"}
                      </span>
                      <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500 sm:ml-auto">
                        {e.user} · {e.role}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UserFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        initial={user}
        allUsers={allUsers}
        onSubmit={handleEditSubmit}
        lockedRoles={
          isGlobalAdmin
            ? []
            : (["Администратор", "Коммерческий директор"] as PromoRole[])
        }
      />

      <TempPasswordDialog
        open={tempOpen}
        onOpenChange={setTempOpen}
        userName={user.fullName}
        tempPassword={tempPassword}
      />
    </div>
  );
}
