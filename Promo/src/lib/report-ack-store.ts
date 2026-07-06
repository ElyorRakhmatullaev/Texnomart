import type { ReportDepartment } from "./promo-mock-data";
import { getReportAckSeed } from "./promo-mock-data";

const STORAGE_KEY = "promo:report-ack";

export interface ReportAckKey {
  campaignId: string;
  department: ReportDepartment;
  version: number;
}
interface StoredAck {
  campaignId: string;
  department: ReportDepartment;
  version: number;
  userId: string;
  lineId: string;
  at: string; // ISO
}
function keyStr(k: ReportAckKey) {
  return `${k.campaignId}:${k.department}:${k.version}`;
}
function read(): StoredAck[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as StoredAck[];
  } catch {
    return [];
  }
}
function write(all: StoredAck[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
/** Seed (from mock) + live records for a report view. */
function recordsFor(k: ReportAckKey): StoredAck[] {
  const seed = getReportAckSeed(k.campaignId, k.department, k.version);
  return [...seed, ...read().filter((r) => keyStr(r) === keyStr(k))];
}
export function getAckedLines(k: ReportAckKey, userId: string): Set<string> {
  return new Set(recordsFor(k).filter((r) => r.userId === userId).map((r) => r.lineId));
}
export function acknowledgeLine(k: ReportAckKey, userId: string, lineId: string): void {
  acknowledgeLines(k, userId, [lineId]);
}
export function acknowledgeLines(k: ReportAckKey, userId: string, lineIds: string[]): void {
  if (typeof window === "undefined") return;
  if (lineIds.length === 0) return;
  const existing = recordsFor(k);
  const all = read();
  const at = new Date().toISOString();
  for (const lineId of lineIds) {
    if (existing.some((r) => r.userId === userId && r.lineId === lineId)) continue;
    all.push({ ...k, userId, lineId, at });
  }
  write(all);
}
export function getAckRecords(k: ReportAckKey): { userId: string; lineId: string; at: string }[] {
  const seen = new Set<string>();
  const out: { userId: string; lineId: string; at: string }[] = [];
  for (const r of recordsFor(k)) {
    const dedupeKey = `${r.userId}:${r.lineId}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    out.push({ userId: r.userId, lineId: r.lineId, at: r.at });
  }
  return out;
}
