"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@texnomart/ui/dialog";
import { Button } from "@texnomart/ui/button";

interface TempPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  tempPassword: string | null;
}

export function TempPasswordDialog({ open, onOpenChange, userName, tempPassword }: TempPasswordDialogProps) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (open) setCopied(false);
  }, [open]);

  const copy = async () => {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
    } catch {
      /* clipboard может быть недоступен — пароль виден на экране */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Временный пароль</DialogTitle>
          <DialogDescription>
            Передайте этот пароль пользователю <b>{userName}</b>. При первом входе система потребует его сменить. Пароль показывается один раз.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-md border border-gray-200 dark:border-border bg-gray-50 dark:bg-muted/40 px-3 py-2">
          <code className="flex-1 font-mono text-base tracking-wide text-gray-900 dark:text-gray-100">{tempPassword}</code>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={copy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Скопировано" : "Копировать"}
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Готово</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
