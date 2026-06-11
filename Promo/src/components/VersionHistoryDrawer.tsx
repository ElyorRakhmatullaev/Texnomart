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
import { AlertTriangle, MessageSquare } from "lucide-react";
import { Switch } from "@texnomart/ui/switch";
import { Label } from "@texnomart/ui/label";
import { Badge } from "@texnomart/ui/badge";
import { cn } from "@texnomart/ui/utils";
import { RuDate } from "./RuDate";
import type { ReviewComment } from "../lib/promo-mock-data";

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
  /** S3 review comments (rejections / «Не участвует») surfaced as a history log. */
  reviewComments?: ReviewComment[];
  /** Non-blocking просрочка note (КД exceeded the review SLA) — shown in red. */
  overdueDays?: number;
}

/**
 * Right-side Sheet listing report versions with a «Показать только изменения»
 * toggle. Stub for the bootstrap — full diff/rollback-as-correction lives in S4.
 * S3 additively surfaces the review-comment log + a non-blocking просрочка note.
 */
export function VersionHistoryDrawer({
  open,
  onOpenChange,
  versions = STUB_VERSIONS,
  reviewComments,
  overdueDays = 0,
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
          {overdueDays > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">
                Просрочка проверки: +{overdueDays}{" "}
                {overdueDays === 1 ? "рабочий день" : "раб. дн."}. Не блокирует
                отправку — зафиксировано в истории.
              </p>
            </div>
          )}

          {reviewComments && reviewComments.length > 0 && (
            <div className="rounded-lg border bg-card p-3">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                <MessageSquare className="size-4 text-muted-foreground" />
                Комментарии проверки
              </h3>
              <ul className="mt-2 space-y-2">
                {reviewComments.map((c, i) => (
                  <li
                    key={i}
                    className={cn(
                      "rounded-md border-l-2 bg-gray-50 px-2.5 py-1.5",
                      c.lineIds ? "border-l-red-300" : "border-l-gray-300"
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span className="font-medium text-gray-700">
                        {c.author}
                      </span>
                      <RuDate value={new Date(c.at)} withTime />
                      {c.lineIds && (
                        <span className="rounded bg-red-100 px-1 text-[11px] font-medium text-red-700">
                          строк: {c.lineIds.length}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-800">{c.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
