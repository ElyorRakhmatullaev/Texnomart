"use client";

import * as React from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@texnomart/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import { Button } from "@texnomart/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@texnomart/ui/alert";
import { cn } from "@texnomart/ui/utils";
import {
  IMPORT_COLUMNS,
  buildImportSampleCsv,
  buildImportTemplateCsv,
  type ImportParseResult,
  type ParsedImportRow,
  type PromoCampaign,
} from "../../../lib/promo-mock-data";

/**
 * Excel/CSV bulk-import dialog (§8.2.1): pick a target campaign, download the
 * template, drop a CSV, and review a per-row validation preview before importing
 * the valid rows as draft lines. Error rows are excluded; duplicate rows import
 * with the «дубль» marker. (CSV is the mock stand-in for .xlsx — see mock-data.)
 */
export function ExcelImportDialog({
  open,
  onOpenChange,
  campaigns,
  validate,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Campaigns the current КМ can import into (non-cancelled, with the grid open). */
  campaigns: PromoCampaign[];
  validate: (campaignId: string, text: string) => ImportParseResult;
  onImport: (campaignId: string, rows: ParsedImportRow[]) => void;
}) {
  const [campaignId, setCampaignId] = React.useState<string>(
    campaigns[0]?.id ?? ""
  );
  const [text, setText] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset transient state each time the dialog is opened.
  React.useEffect(() => {
    if (open) {
      setText(null);
      setFileName(null);
      setCampaignId((cur) =>
        campaigns.some((c) => c.id === cur) ? cur : campaigns[0]?.id ?? ""
      );
    }
  }, [open, campaigns]);

  const result: ImportParseResult | null = React.useMemo(
    () => (text != null && campaignId ? validate(campaignId, text) : null),
    [text, campaignId, validate]
  );

  const importable = result?.rows.filter((r) => r.status !== "error") ?? [];
  const errorCount = result?.rows.filter((r) => r.status === "error").length ?? 0;

  const downloadTemplate = () => {
    triggerDownload(buildImportTemplateCsv(), "promo-import-template.csv");
  };

  const readFile = async (file: File) => {
    setFileName(file.name);
    setText(await file.text());
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void readFile(file);
  };

  const doImport = () => {
    if (!campaignId || importable.length === 0) return;
    onImport(campaignId, importable);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[680px] max-sm:h-full max-sm:max-h-full max-sm:max-w-full max-sm:rounded-none">
        {/* Full-screen Sheet-style layout below sm (Phase 5 RESPONSIVE §). */}
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Загрузить из Excel</DialogTitle>
          <DialogDescription>
            Импорт номенклатуры из файла CSV. Скачайте шаблон, заполните и
            загрузите — строки с ошибками не импортируются.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* Target campaign + template */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="flex-1 space-y-1.5 text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-200">Акция для импорта</span>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите акцию" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.id} · {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <Button variant="secondary" onClick={downloadTemplate}>
              <Download className="size-4" />
              Скачать шаблон
            </Button>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-gray-50 dark:bg-muted/40 px-4 py-6 text-center"
          >
            <FileSpreadsheet className="size-8 text-muted-foreground/70" />
            <p className="text-sm text-gray-700 dark:text-gray-200">
              {fileName ? (
                <span className="font-medium">{fileName}</span>
              ) : (
                "Перетащите CSV-файл сюда или выберите вручную"
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-4" />
                Выбрать файл
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFileName("пример.csv");
                  setText(buildImportSampleCsv());
                }}
              >
                Вставить пример
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void readFile(file);
                e.target.value = "";
              }}
            />
          </div>

          {/* Structure error */}
          {result?.structureError && (
            <Alert variant="destructive">
              <AlertTitle>Ошибка структуры файла</AlertTitle>
              <AlertDescription>{result.structureError}</AlertDescription>
            </Alert>
          )}

          {/* Per-row preview */}
          {result && !result.structureError && result.rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Предпросмотр: {result.rows.length} строк
                </span>
                <span className="text-green-700 dark:text-green-300">
                  к импорту: {importable.length}
                </span>
                {errorCount > 0 && (
                  <span className="text-red-600 dark:text-red-400">с ошибками: {errorCount}</span>
                )}
              </div>
              <div className="max-h-[240px] overflow-y-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-muted/40 text-xs text-gray-600 dark:text-gray-300">
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium">№</th>
                      <th className="px-3 py-2 text-left font-medium">
                        Номенклатура
                      </th>
                      <th className="px-3 py-2 text-left font-medium">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => (
                      <tr
                        key={row.row}
                        className={cn(
                          "border-b last:border-0",
                          row.status === "error" && "bg-red-50/60 dark:bg-red-500/10",
                          row.status === "duplicate" && "bg-amber-50/60 dark:bg-amber-500/10"
                        )}
                      >
                        <td className="px-3 py-2 tabular-nums text-muted-foreground">
                          {row.row}
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-gray-900 dark:text-gray-100">
                            {row.name ?? row.nomenclatureId}
                          </span>
                          {row.name && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              {row.nomenclatureId}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <RowStatus row={row} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-5 py-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={doImport} disabled={importable.length === 0}>
            <Upload className="size-4" />
            Импортировать {importable.length || ""} строк
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RowStatus({ row }: { row: ParsedImportRow }) {
  if (row.status === "ok") {
    return (
      <span className="inline-flex rounded bg-green-100 dark:bg-green-500/20 px-1.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
        Готово
      </span>
    );
  }
  const tone =
    row.status === "duplicate"
      ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300"
      : "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300";
  return (
    <span className="flex flex-col gap-0.5">
      <span
        className={cn(
          "inline-flex w-fit rounded px-1.5 py-0.5 text-xs font-medium",
          tone
        )}
      >
        {row.status === "duplicate" ? "Дубль" : "Ошибка"}
      </span>
      {row.reason && (
        <span className="text-xs text-muted-foreground">{row.reason}</span>
      )}
    </span>
  );
}

function triggerDownload(content: string, filename: string) {
  // Prepend a BOM so Excel opens the Cyrillic CSV in UTF-8.
  const blob = new Blob(["﻿" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
