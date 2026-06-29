// CSV export utilities for the short promo-calendar (client feedback §8). Mock:
// client-side CSV with a UTF-8 BOM (Excel-RU opens Cyrillic correctly), semicolon-
// delimited to match the S2 import. Export works per visible tab/block and reflects
// the CURRENT filters (the caller passes the already-filtered rows). Access rights are
// a mock no-op here — only the rows the user already sees are exported.

import {
  campaignReadiness,
  formatPromoNo,
  getCategoryManager,
  getFillDeadline,
  getPlanApproval,
  getReportSendStatus,
  type PlanStageStatus,
  type PromoCampaign,
} from "./promo-mock-data";

function csvCell(v: string): string {
  return /[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCsv(rows: string[][]): string {
  const body = rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
  return "﻿" + body; // BOM so Excel detects UTF-8
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("ru-RU");
}

function fmtDateTime(d: Date): string {
  return (
    d.toLocaleDateString("ru-RU") +
    " " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
}

function stageLabel(status: PlanStageStatus, overdueDays?: number): string {
  if (status === "waiting") return "Ожидает этапа";
  if (status === "onTime") return "В срок";
  return `Просрочка +${overdueDays ?? 0} дн.`;
}

/** Промо-календарь tab → one row per campaign with status, readiness counts, distribution. */
export function buildCalendarCsv(campaigns: PromoCampaign[]): string {
  const header = [
    "№ промо",
    "Тип промо",
    "Название акции",
    "Период (начало)",
    "Период (окончание)",
    "Крайний срок заполнения КМ",
    "Срок отчёта",
    "Общий статус акции",
    "Отправка смежным отделам",
    "Согласовано КМ",
    "Всего КМ (без «Не участвует»)",
    "Согласовано КД",
    "На согл. у КД",
    "На согл. у ст. КМ",
    "На корр. / Не заполнено",
    "Не участвует",
    "Распределение по категориям",
  ];
  const rows = campaigns.map((c) => {
    const r = campaignReadiness(c);
    const rs = getReportSendStatus(c);
    const sendLabel = rs.sent
      ? `Отправлено ${fmtDate(rs.sentAt!)} (в.${rs.versionNo})`
      : rs.overdueDays > 0
        ? `Не отправлено (просрочка +${rs.overdueDays} дн.)`
        : "Не отправлено";
    const dist = (c.categoryDistribution ?? [])
      .map(
        (e) =>
          `${fmtDate(e.date)}: ${e.category} — ${
            getCategoryManager(e.responsibleKmId)?.name ?? e.responsibleKmId
          }`
      )
      .join(" | ");
    return [
      formatPromoNo(c.id),
      c.type,
      c.name,
      fmtDate(c.startDate),
      fmtDate(c.endDate),
      fmtDate(getFillDeadline(c)),
      fmtDate(rs.deadline),
      c.status,
      sendLabel,
      String(r.done),
      String(r.total),
      String(r.accepted),
      String(r.atKd),
      String(r.atSeniorKm),
      String(r.notFilled),
      String(r.notParticipating),
      dist,
    ];
  });
  return toCsv([header, ...rows]);
}

export interface PlanExportRow {
  id: string;
  type: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

/** План акций tab → one row per campaign with the three directors' approval stages. */
export function buildPlanCsv(rows: PlanExportRow[]): string {
  const header = [
    "Код акции",
    "Тип акции",
    "Наименование акции",
    "Период (начало)",
    "Период (окончание)",
    "Маркетинг: ознакомление",
    "Маркетинг: отправка на согл.",
    "Маркетинг: статус",
    "КД: согласование",
    "КД: статус",
    "ОД: согласование",
    "ОД: статус",
  ];
  const out = rows.map((r) => {
    const a = getPlanApproval(r.id);
    const m = a?.marketing;
    const kd = a?.kd;
    const od = a?.od;
    return [
      r.id,
      r.type,
      r.name,
      fmtDate(r.startDate),
      fmtDate(r.endDate),
      m ? fmtDateTime(m.reviewedAt) : "—",
      m ? fmtDateTime(m.sentAt) : "—",
      m ? stageLabel(m.status, m.overdueDays) : "—",
      kd?.decidedAt ? fmtDateTime(kd.decidedAt) : "—",
      kd ? stageLabel(kd.status, kd.overdueDays) : "—",
      od?.decidedAt ? fmtDateTime(od.decidedAt) : "—",
      od ? stageLabel(od.status, od.overdueDays) : "—",
    ];
  });
  return toCsv([header, ...out]);
}

/** `YYYY-MM-DD` stamp for export filenames. */
export function exportStamp(ref: Date = new Date()): string {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}-${String(
    ref.getDate()
  ).padStart(2, "0")}`;
}
