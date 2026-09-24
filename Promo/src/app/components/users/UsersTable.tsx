"use client";

import * as React from "react";
import { MoreVertical, Eye, KeyRound, ShieldCheck, ShieldOff, UserX, UserCheck, Clock } from "lucide-react";
import { buttonVariants } from "@texnomart/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@texnomart/ui/dropdown-menu";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@texnomart/ui/table";
import { cn } from "@texnomart/ui/utils";
import { type PromoUser } from "../../../lib/users-store";
import { assignmentsOf, isAssignmentExpired, permanentRolesOf } from "../../../lib/user-roles";
import { substitutionBadgeFor } from "../../../lib/kd-substitution-store";

export type UserRowAction = "reset" | "toggle-admin" | "toggle-status" | "open";

const STATUS_META: Record<PromoUser["status"], { label: string; cls: string }> = {
  active: { label: "Активен", cls: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  "temp-password": { label: "Временный пароль", cls: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  blocked: { label: "Деактивирован", cls: "bg-gray-200 dark:bg-muted text-gray-600 dark:text-gray-300" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU");
}

/** «31.08» — короткая дата окончания срочного права. */
function shortDate(iso?: string): string {
  if (!iso) return "";
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}`;
}

/**
 * Роли по типам (5D): основная — заливка, дополнительная — контур,
 * временная — контур + часы + «до DD.MM». Истёкшие временные не показываются
 * (они уже не действуют — см. `activeRolesOf`). Отдельным чипом — признак
 * замещения КД: это НЕ роль, а отображаемая проекция (`substitutionBadgeFor`).
 */
function RoleChips({ user }: { user: PromoUser }) {
  const badge = substitutionBadgeFor(user);
  return (
    <div className="flex flex-wrap gap-1">
      {assignmentsOf(user)
        .filter((a) => a.kind !== "temporary" || !isAssignmentExpired(a))
        .map((a, i) => (
          <span
            key={`${a.role}-${a.kind}-${i}`}
            title={
              a.kind === "temporary"
                ? `Временная роль${a.from ? ` с ${shortDate(a.from)}` : ""}${a.to ? ` по ${shortDate(a.to)}` : ""}`
                : a.kind === "primary"
                ? "Основная роль"
                : "Дополнительная роль"
            }
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
              a.kind === "primary"
                ? "bg-primary font-medium text-primary-foreground"
                : a.kind === "temporary"
                ? "border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300"
                : "border border-gray-200 dark:border-border text-gray-600 dark:text-gray-300"
            )}
          >
            {a.kind === "temporary" && <Clock className="size-3" />}
            {a.role}
            {a.kind === "temporary" && a.to && (
              <span className="opacity-70">до {shortDate(a.to)}</span>
            )}
          </span>
        ))}
      {badge && (
        <span
          title="Временное замещение: права ограничены этапом согласования КД"
          className="inline-flex items-center gap-1 rounded-full border border-violet-300 dark:border-violet-500/40 px-2 py-0.5 text-xs text-violet-800 dark:text-violet-300"
        >
          <Clock className="size-3" />
          {badge.label}
          <span className="opacity-70">до {shortDate(badge.to)}</span>
        </span>
      )}
    </div>
  );
}

interface UsersTableProps {
  users: PromoUser[];
  onAction: (action: UserRowAction, user: PromoUser) => void;
  canRevokeAdmin: (id: string) => boolean;
  canDeactivate: (id: string) => boolean;
  /** All users (E-4) — used to resolve «Руководитель» names. Optional, defaults to []. */
  allUsers?: PromoUser[];
  /** Dept-admin scoping (E-4) — hides mutating row actions for out-of-scope users. Optional, defaults to allow-all. */
  canManage?: (u: PromoUser) => boolean;
  /** Global-admin gate (E-4) — only a global admin may grant/revoke the GLOBAL «Администратор» role. Optional, defaults to false (dept admins never see the toggle). */
  canToggleGlobalAdmin?: boolean;
}

function RowMenu({
  user,
  onAction,
  canRevokeAdmin,
  canDeactivate,
  canManage = () => true,
  canToggleGlobalAdmin = false,
}: UsersTableProps & { user: PromoUser }) {
  // ПОСТОЯННЫЕ роли: пункт меню выдаёт/отзывает постоянные права администратора,
  // и по временной роли отзывать нечего (5D — тот же принцип, что в гвардах стора).
  const isAdmin = permanentRolesOf(user).includes("Администратор");
  const isBlocked = user.status === "blocked";
  const revokeBlocked = isAdmin && !canRevokeAdmin(user.id);
  const deactivateBlocked = !isBlocked && !canDeactivate(user.id);
  const managed = canManage(user);
  return (
    <DropdownMenu>
      {/* R69.2: native <button> under asChild — the shared Button forwards no ref,
          so Radix rendered this menu off-screen and «Сбросить пароль» looked
          missing (see tasks/lessons.md). */}
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "size-8"
          )}
          aria-label="Действия"
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onAction("open", user)}>
          <Eye className="mr-2 size-4" /> Открыть
        </DropdownMenuItem>
        {managed && (
          <>
            <DropdownMenuItem onClick={() => onAction("reset", user)}>
              <KeyRound className="mr-2 size-4" /> Сбросить пароль
            </DropdownMenuItem>
            {canToggleGlobalAdmin &&
              (isAdmin ? (
                <DropdownMenuItem
                  disabled={revokeBlocked}
                  title={revokeBlocked ? "Должно остаться не менее двух администраторов" : undefined}
                  onClick={() => onAction("toggle-admin", user)}
                >
                  <ShieldOff className="mr-2 size-4" /> Отозвать права администратора
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onAction("toggle-admin", user)}>
                  <ShieldCheck className="mr-2 size-4" /> Назначить администратором
                </DropdownMenuItem>
              ))}
            {isBlocked ? (
              <DropdownMenuItem onClick={() => onAction("toggle-status", user)}>
                <UserCheck className="mr-2 size-4" /> Активировать
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                disabled={deactivateBlocked}
                title={deactivateBlocked ? "Должно остаться не менее двух администраторов" : undefined}
                onClick={() => onAction("toggle-status", user)}
              >
                <UserX className="mr-2 size-4" /> Деактивировать
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UsersTable(props: UsersTableProps) {
  const { users, allUsers = [] } = props;
  const managerName = (u: PromoUser): string =>
    allUsers.find((a) => a.id === u.managerId)?.fullName ?? "—";

  // Проверка прода 14–15.09, №21 п.2: собственная горизонтальная полоса таблицы
  // уезжает под сгиб вместе с последней строкой. Дублируем её закреплённой у
  // нижнего края видимой области дорожкой — тот же приём, что в аудит-логе и
  // отчётах; родная полоса тела скрыта, чтобы две полосы не стояли друг над другом.
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dims, setDims] = React.useState({ scroll: 0, client: 0 });
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Обе величины в состоянии: при изменении ширины окна `scrollWidth` может не
    // поменяться, а `clientWidth` — да, и решение «нужна ли дорожка» устареет.
    const measure = () =>
      setDims((d) =>
        d.scroll === el.scrollWidth && d.client === el.clientWidth
          ? d
          : { scroll: el.scrollWidth, client: el.clientWidth }
      );
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [users]);
  const needsTrack = dims.scroll > dims.client + 1;
  // Присваивание того же значения событие scroll не порождает — цикла нет.
  const syncFromBody = () => {
    if (scrollRef.current && trackRef.current)
      trackRef.current.scrollLeft = scrollRef.current.scrollLeft;
  };
  const syncFromTrack = () => {
    if (scrollRef.current && trackRef.current)
      scrollRef.current.scrollLeft = trackRef.current.scrollLeft;
  };

  const TEXT = "whitespace-normal break-words text-gray-700 dark:text-gray-200";
  return (
    <>
      {/* Desktop */}
      {/* Проверка прода 14–15.09, №21 п.1: таблица не помещалась по ширине — десять
          колонок с `whitespace-nowrap` давали ~1540px минимума при ~1130px на экране
          1440. Связанные данные сведены в двухстрочные ячейки (ФИО + email,
          подразделение + должность, дата + кем создана), текст переносится.
          Трекер, стр. 70 п.1: колонка «ФИО» закреплена слева (`sticky left-0` с
          непрозрачным фоном) — относительно собственного скроллера тела таблицы.
          `overflow-clip`, а не `overflow-hidden`: hidden создал бы контейнер
          прокрутки, и закреплённая снизу дорожка прилипла бы к низу карточки. */}
      <div className="hidden overflow-clip rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:block">
        <div
          ref={scrollRef}
          onScroll={syncFromBody}
          className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <table className="w-full caption-bottom text-sm">
            <TableHeader className="bg-gray-50 dark:bg-muted/40">
              <TableRow>
                <TableHead className="sticky left-0 z-20 min-w-[210px] bg-gray-50 dark:bg-muted/40">
                  ФИО · email
                </TableHead>
                <TableHead className="min-w-[190px]">Роли</TableHead>
                <TableHead className="min-w-[180px]">Подразделение · должность</TableHead>
                <TableHead className="min-w-[140px]">Руководитель</TableHead>
                <TableHead className="w-[150px]">Статус</TableHead>
                <TableHead className="min-w-[150px]">Создана · кем</TableHead>
                <TableHead className="w-[52px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="sticky left-0 z-10 max-w-[260px] bg-white whitespace-normal dark:bg-card">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{u.fullName}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400" title={u.email}>
                      {u.email}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <RoleChips user={u} />
                  </TableCell>
                  <TableCell className={TEXT}>
                    <p>{u.department ?? "—"}</p>
                    {u.position && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{u.position}</p>
                    )}
                  </TableCell>
                  <TableCell className={TEXT}>{managerName(u)}</TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[u.status].cls)}>
                      {STATUS_META[u.status].label}
                    </span>
                  </TableCell>
                  <TableCell className={TEXT}>
                    <p className="tabular-nums text-gray-600 dark:text-gray-300">{formatDate(u.createdAt)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{u.createdBy ?? "—"}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <RowMenu {...props} user={u} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </table>
        </div>

        {needsTrack && (
          <div
            ref={trackRef}
            onScroll={syncFromTrack}
            className="sticky bottom-0 z-30 overflow-x-auto overflow-y-hidden border-t border-gray-200 dark:border-border bg-white dark:bg-card"
            aria-hidden="true"
          >
            <div style={{ width: dims.scroll, height: 1 }} />
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {users.map((u) => (
          <div key={u.id} className="rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-card p-3 shadow-[0px_2px_4px_rgba(204,204,204,0.25)]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100">{u.fullName}</p>
                <p className="truncate text-sm text-gray-600 dark:text-gray-300">{u.email}</p>
                {u.department && (
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{u.department}</p>
                )}
              </div>
              <RowMenu {...props} user={u} />
            </div>
            <div className="mt-2">
              <RoleChips user={u} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[u.status].cls)}>
                {STATUS_META[u.status].label}
              </span>
              <span className="ml-auto tabular-nums text-xs text-gray-500 dark:text-gray-400">{formatDate(u.createdAt)}</span>
            </div>
            {u.createdBy && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Создал(а): {u.createdBy}</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
