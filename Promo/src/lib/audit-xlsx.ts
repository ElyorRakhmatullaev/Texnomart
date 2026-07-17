// .xlsx export for «Аудит-лог и контроль сроков» (tracker V1-8). Generic serializer only —
// each tab builds its OWN header/rows from its already-filtered on-screen data (the same memo
// that feeds the visible table), so filter-awareness stays local to the tab and no filter state
// is lifted into the page. Mirrors the report-xlsx.ts / users-xlsx.ts SheetJS idiom.

import * as XLSX from "xlsx";
import { formatDateFull } from "@texnomart/shared/utils/formatters";

/** Writes a single-sheet .xlsx from an already-filtered header/rows pair. */
export function exportAuditXlsx(input: {
  sheetName: string;
  header: string[];
  rows: (string | number)[][];
  filename: string;
}): void {
  const ws = XLSX.utils.aoa_to_sheet([input.header, ...input.rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, input.sheetName);
  XLSX.writeFile(wb, input.filename);
}

/** DD.MM.YYYY, optionally with HH:mm — mirrors the on-screen `RuDate` formatting exactly. */
export function fmtAuditDate(d: Date, withTime = false): string {
  const date = formatDateFull(d);
  if (!withTime) return date;
  return `${date} ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
}
