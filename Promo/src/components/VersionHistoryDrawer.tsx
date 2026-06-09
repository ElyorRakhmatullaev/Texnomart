"use client";

import * as React from "react";
import { History } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@texnomart/ui/sheet";
import { Switch } from "@texnomart/ui/switch";
import { Label } from "@texnomart/ui/label";
import { Badge } from "@texnomart/ui/badge";
import { RuDate } from "./RuDate";

/** Change-type chip values (spec §5.1). */
export type ChangeType =
  | "Первичная отправка"
  | "Корректировка"
  | "Добавление"
  | "Отмена"
  | "Отправка отчёта";

export interface VersionEntry {
  id: string;
  date: Date;
  author: string;
  role: string;
  changeType: ChangeType;
  /** Short summary of changed fields. */
  summary: string;
}

const CHANGE_TYPE_STYLE: Record<ChangeType, string> = {
  "Первичная отправка": "bg-blue-50 text-blue-700",
  "Корректировка": "bg-amber-50 text-amber-700",
  "Добавление": "bg-emerald-50 text-emerald-700",
  "Отмена": "bg-red-50 text-red-700",
  "Отправка отчёта": "bg-violet-50 text-violet-700",
};

// Stub content — fleshed out in S4 (real versioning + diff).
const STUB_VERSIONS: VersionEntry[] = [
  {
    id: "v3",
    date: new Date(2026, 10, 24, 14, 32),
    author: "Алиев Бекзод",
    role: "Категорийный менеджер (КМ)",
    changeType: "Корректировка",
    summary: "Изменена новая цена по 3 позициям",
  },
  {
    id: "v2",
    date: new Date(2026, 10, 22, 9, 15),
    author: "Исмаилов Жасур",
    role: "Старший КМ",
    changeType: "Добавление",
    summary: "Добавлена 1 позиция номенклатуры",
  },
  {
    id: "v1",
    date: new Date(2026, 10, 20, 17, 48),
    author: "Алиев Бекзод",
    role: "Категорийный менеджер (КМ)",
    changeType: "Первичная отправка",
    summary: "Первичная отправка данных на согласование",
  },
];

interface VersionHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions?: VersionEntry[];
}

/**
 * Right-side Sheet listing report versions with a «Показать только изменения»
 * toggle. Stub for the bootstrap — full diff/rollback-as-correction lives in S4.
 */
export function VersionHistoryDrawer({
  open,
  onOpenChange,
  versions = STUB_VERSIONS,
}: VersionHistoryDrawerProps) {
  const [onlyChanges, setOnlyChanges] = React.useState(false);

  const shown = onlyChanges
    ? versions.filter((v) => v.changeType !== "Первичная отправка")
    : versions;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            <History className="size-5" />
            История версий
          </SheetTitle>
          <SheetDescription>
            Предыдущие версии не удаляются. Откат не поддерживается — изменения
            вносятся новой корректировкой.
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center justify-between border-b px-4 py-3">
          <Label htmlFor="only-changes" className="text-sm font-normal">
            Показать только изменения
          </Label>
          <Switch
            id="only-changes"
            checked={onlyChanges}
            onCheckedChange={setOnlyChanges}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {shown.map((v) => (
            <div
              key={v.id}
              className="rounded-lg border bg-card p-3 shadow-[0px_2px_4px_rgba(204,204,204,0.25)]"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge className={`${CHANGE_TYPE_STYLE[v.changeType]} border-0 rounded-full text-xs`}>
                  {v.changeType}
                </Badge>
                <span className="text-xs text-muted-foreground tabular-nums">
                  <RuDate value={v.date} withTime />
                </span>
              </div>
              <p className="mt-2 text-sm">{v.summary}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {v.author} · {v.role}
              </p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
