"use client";

import * as React from "react";
import { History, ShieldOff, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@texnomart/ui/card";
import { Button, buttonVariants } from "@texnomart/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@texnomart/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@texnomart/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import { Textarea } from "@texnomart/ui/textarea";
import { cn } from "@texnomart/ui/utils";
import { formatDateFull } from "@texnomart/shared/utils/formatters";
import { RuDate } from "../../../components/RuDate";
import { useCurrentUser } from "../../current-user-context";
import { useRole } from "../../role-context";
import { getUsers, rolesOf } from "../../../lib/users-store";
import { appendAuditEvent } from "../../../lib/audit-store";
import {
  getActiveSubstitution,
  getSubstitutionHistory,
  assignSubstitution,
  revokeSubstitution,
  substituteName,
  type KdSubstitution,
} from "../../../lib/kd-substitution-store";

/** ISO «YYYY-MM-DD» → local-midnight Date (avoids the UTC-parse off-by-one RuDate would show). */
function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** «Уполномоченное лицо КД (временное замещение)» — assign / revoke / history (E-4). */
export function KdSubstitutionPanel() {
  const { currentUser } = useCurrentUser();
  const { currentRole } = useRole();

  // Bumped after every mutation to force a fresh read from the store.
  const [tick, setTick] = React.useState(0);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [revokeOpen, setRevokeOpen] = React.useState(false);

  const active = React.useMemo(() => getActiveSubstitution(), [tick]);
  const history = React.useMemo(() => getSubstitutionHistory(), [tick]);
  const candidates = React.useMemo(
    () => getUsers().filter((u) => !rolesOf(u).includes("Коммерческий директор")),
    [tick]
  );

  const [substituteId, setSubstituteId] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (assignOpen) {
      setSubstituteId("");
      setFrom("");
      setTo("");
      setReason("");
    }
  }, [assignOpen]);

  const datesValid = from.length > 0 && to.length > 0 && to >= from;
  const isValid = substituteId.length > 0 && datesValid && reason.trim().length > 0;

  const audit = React.useCallback(
    (
      action: "назначение замещения" | "снятие замещения",
      targetUserId: string,
      objectLabel: string,
      comment: string
    ) => {
      appendAuditEvent({
        user: currentUser?.fullName ?? "—",
        role: currentRole,
        action,
        objectType: "пользователь",
        objectLabel,
        targetUserId,
        comment,
      });
    },
    [currentUser, currentRole]
  );

  const handleAssign = () => {
    if (!isValid) return;
    const substitute = candidates.find((u) => u.id === substituteId);
    assignSubstitution({
      substituteUserId: substituteId,
      from,
      to,
      reason,
      assignedBy: currentUser?.fullName ?? "Администратор",
    });
    audit(
      "назначение замещения",
      substituteId,
      substitute?.fullName ?? "—",
      `Замещение КД: c ${formatDateFull(parseDateOnly(from))} по ${formatDateFull(parseDateOnly(to))}`
    );
    setAssignOpen(false);
    setTick((t) => t + 1);
    toast.success("Замещение назначено");
  };

  const handleRevoke = () => {
    if (!active) return;
    const name = substituteName(active);
    revokeSubstitution(active.id);
    audit("снятие замещения", active.substituteUserId, name, "Снято замещение КД");
    setRevokeOpen(false);
    setTick((t) => t + 1);
    toast.success("Замещение снято");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Уполномоченное лицо КД (временное замещение)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {active ? (
          <div className="flex flex-col gap-3 rounded-lg border border-gray-200 dark:border-border bg-gray-50 dark:bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{substituteName(active)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                c <RuDate value={parseDateOnly(active.from)} /> по <RuDate value={parseDateOnly(active.to)} />
              </p>
              <p className="text-xs text-muted-foreground">Назначил: {active.assignedBy}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
                Назначить другого
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setRevokeOpen(true)}
              >
                <ShieldOff className="size-4" /> Снять замещение
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 dark:border-border py-8 text-center">
            <p className="text-sm text-muted-foreground">Замещение не назначено</p>
            <Button className="gap-1.5" onClick={() => setAssignOpen(true)}>
              <UserCog className="size-4" /> Назначить замещение
            </Button>
          </div>
        )}

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
            <History className="size-4" /> История замещений
          </p>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">История пуста.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {history.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col gap-0.5 rounded-md border border-gray-200 dark:border-border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">{substituteName(s)}</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    c <RuDate value={parseDateOnly(s.from)} /> по <RuDate value={parseDateOnly(s.to)} />
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      s.revokedAt
                        ? "text-gray-500 dark:text-gray-400"
                        : "font-medium text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {s.revokedAt ? (
                      <>Снято <RuDate value={new Date(s.revokedAt)} withTime /></>
                    ) : (
                      <>Назначено <RuDate value={new Date(s.assignedAt)} withTime /> · активно</>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      {/* Assign dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Назначить замещение КД</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Заместитель</Label>
              <Select value={substituteId} onValueChange={setSubstituteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите пользователя" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.fullName} — {u.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="sub-from">С даты</Label>
                <Input
                  id="sub-from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-to">По дату</Label>
                <Input
                  id="sub-to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  min={from || undefined}
                />
              </div>
            </div>
            {from && to && to < from && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Дата окончания раньше даты начала.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="sub-reason">
                Причина <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="sub-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Например, отпуск коммерческого директора"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Отмена
            </Button>
            <Button disabled={!isValid} onClick={handleAssign}>
              Назначить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirm — no reason required */}
      <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Снять замещение?</AlertDialogTitle>
            <AlertDialogDescription>
              {active
                ? `${substituteName(active)} перестанет действовать от имени коммерческого директора.`
                : undefined}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={handleRevoke}>
              Снять
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
