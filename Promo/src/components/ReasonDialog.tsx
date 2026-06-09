"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@texnomart/ui/dialog";
import { Button } from "@texnomart/ui/button";
import { Label } from "@texnomart/ui/label";
import { Textarea } from "@texnomart/ui/textarea";

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Whether the reason text is mandatory (spec's mandatory-comment rule). */
  reasonRequired?: boolean;
  reasonLabel?: string;
  confirmLabel?: string;
  destructive?: boolean;
  /** Called with the entered reason on confirm. */
  onConfirm: (reason: string) => void;
}

/**
 * Confirm Dialog with a (by default required) reason Textarea — used by
 * reject / cancel / «Не участвует» / deadline-change flows. The caller persists
 * author + date/time alongside the returned reason.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  reasonRequired = true,
  reasonLabel = "Причина",
  confirmLabel = "Подтвердить",
  destructive = false,
  onConfirm,
}: ReasonDialogProps) {
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const canConfirm = !reasonRequired || reason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {destructive && (
              <AlertTriangle className="size-5 text-destructive shrink-0" />
            )}
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="reason-textarea">
            {reasonLabel}
            {reasonRequired && <span className="text-destructive"> *</span>}
          </Label>
          <Textarea
            id="reason-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Укажите причину…"
            rows={4}
            autoFocus
          />
          {reasonRequired && (
            <p className="text-xs text-muted-foreground">
              Поле обязательно для заполнения.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={!canConfirm}
            onClick={() => {
              onConfirm(reason.trim());
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
