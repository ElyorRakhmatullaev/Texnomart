import * as XLSX from "xlsx";
import {
  DEPARTMENT_SHORT,
  type PromoCampaign,
  type PromoLine,
  type ReportDepartment,
} from "./promo-mock-data";
import type { ReportColumn } from "../app/components/reports/reportFields";
import { exportStamp } from "./promo-export";

const CHANGE_LABEL = { added: "Добавлено", changed: "Изменено", excluded: "Исключено" } as const;

/** Build a real .xlsx of the current (filtered) report view, incl. the «Изменение» column. */
export function exportReportXlsx(params: {
  department: ReportDepartment;
  campaign: PromoCampaign;
  columns: ReportColumn[];
  lines: PromoLine[];
  changeKind: (lineId: string) => "added" | "changed" | "excluded" | null;
}): void {
  const { department, campaign, columns, lines, changeKind } = params;
  const header = ["Изменение", ...columns.map((c) => c.label)];
  const rows = lines.map((l) => {
    const k = changeKind(l.id);
    const cells = columns.map((c) => {
      const v = c.value(l, campaign);
      return typeof v === "boolean" ? (v ? "Да" : "—") : v;
    });
    return [k ? CHANGE_LABEL[k] : "", ...cells];
  });
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, DEPARTMENT_SHORT[department]);
  const file = `Отчёт_${DEPARTMENT_SHORT[department]}_${campaign.id}_${exportStamp()}.xlsx`;
  XLSX.writeFile(wb, file);
}
