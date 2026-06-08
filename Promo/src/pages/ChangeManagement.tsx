import React, { useState, useMemo } from "react";
import { Badge } from "@texnomart/ui/badge";
import { Button } from "@texnomart/ui/button";
import { Card, CardContent } from "@texnomart/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@texnomart/ui/select";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@texnomart/ui/tooltip";
import { ScrollArea } from "@texnomart/ui/scroll-area";
import { Separator } from "@texnomart/ui/separator";
import {
  GitCompareArrows, Send, History, Clock, Ban,
  Pencil, ArrowRight, CalendarClock, AlertCircle,
  Package, Check, ChevronDown, ChevronRight, Info,
} from "lucide-react";
import {
  type PromoCampaign,
  type ChangeType,
  type VersionEntry,
  type DeadlineChangeRequest,
  type CancellationRecord,
  CHANGE_TYPE_CONFIG,
  MOCK_VERSION_HISTORY,
  MOCK_DEADLINE_CHANGES,
  MOCK_CANCELLATIONS,
  MOCK_CAMPAIGNS,
  MOCK_MANAGERS,
  useApp,
  formatDate,
  ChangeTypeBadge,
  BilingualLabel,
  labels,
} from "../App";

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const MONO: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontVariantNumeric: "tabular-nums",
};

type TabId = "versions" | "changes" | "sends" | "deadlines" | "cancellations";

const TABS: { id: TabId; ru: string; en: string }[] = [
  { id: "versions", ru: "История версий", en: "Version history" },
  { id: "changes", ru: "Только изменения", en: "Changes only" },
  { id: "sends", ru: "Отправки в отделы", en: "Department sends" },
  { id: "deadlines", ru: "Изменения дедлайнов", en: "Deadline changes" },
  { id: "cancellations", ru: "Отмены", en: "Cancellations" },
];

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function ApprovalStatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const cfg: Record<string, { ru: string; bg: string; text: string; border: string }> = {
    pending: { ru: "Ожидает", bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
    approved: { ru: "Утверждено", bg: "#DCFCE7", text: "#16A34A", border: "#BBF7D0" },
    rejected: { ru: "Отклонено", bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" },
  };
  const c = cfg[status];
  return (
    <Badge variant="outline" className="text-xs font-medium px-2 py-0.5"
      style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}>
      {c.ru}
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ChangeManagementPage() {
  const { currentRole, campaigns, managers } = useApp();
  const isKm = currentRole === "category_manager";
  const isKd = currentRole === "commercial_director";

  const [activeTab, setActiveTab] = useState<TabId>("versions");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("PROMO-2026-001");
  const [expandedVersions, setExpandedVersions] = useState<Record<number, boolean>>({});

  const campaignsWithHistory = useMemo(() =>
    campaigns.filter((c) => MOCK_VERSION_HISTORY[c.id]),
  [campaigns]);

  const allCampaignsForSelect = useMemo(() => {
    const withHistory = campaignsWithHistory.map((c) => c.id);
    return campaigns.filter((c) =>
      withHistory.includes(c.id) || c.status !== "not_filled"
    );
  }, [campaigns, campaignsWithHistory]);

  const versions = useMemo(() =>
    MOCK_VERSION_HISTORY[selectedCampaign] || [],
  [selectedCampaign]);

  const allChanges = useMemo(() =>
    versions.flatMap((v) =>
      v.fieldChanges.map((fc) => ({ ...fc, version: v.version, date: v.date, author: v.author }))
    ),
  [versions]);

  const sentVersions = useMemo(() =>
    versions.filter((v) => v.sentToDepartments),
  [versions]);

  const campaignDeadlineChanges = useMemo(() =>
    MOCK_DEADLINE_CHANGES.filter((d) => d.campaignId === selectedCampaign),
  [selectedCampaign]);

  const campaignCancellations = useMemo(() =>
    MOCK_CANCELLATIONS.filter((c) =>
      c.targetId === selectedCampaign ||
      c.targetName.includes(selectedCampaign)
    ),
  [selectedCampaign]);

  const allCancellations = MOCK_CANCELLATIONS;

  const toggleVersion = (v: number) =>
    setExpandedVersions((prev) => ({ ...prev, [v]: !prev[v] }));

  const selectedCampaignData = campaigns.find((c) => c.id === selectedCampaign);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="space-y-4">
      {/* ── Campaign selector + info ── */}
      <Card className="border" style={{ borderColor: "#E5E7EB" }}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>Выберите акцию</label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="h-9 mt-1" style={{ fontSize: 13 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCampaignsForSelect.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span style={{ ...MONO, fontSize: 11, color: "#9CA3AF" }}>{c.id}</span>
                      <span className="ml-2">{c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCampaignData && (
              <div className="flex items-center gap-4 flex-wrap" style={{ fontSize: 12 }}>
                <div>
                  <span style={{ color: "#9CA3AF" }}>Период: </span>
                  <span style={{ ...MONO, color: "#16181D" }}>
                    {formatDate(selectedCampaignData.startDate)} — {formatDate(selectedCampaignData.endDate)}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#9CA3AF" }}>Версия: </span>
                  <span style={{ ...MONO, color: "#16181D", fontWeight: 600 }}>
                    v{selectedCampaignData.version}
                  </span>
                </div>
                <div>
                  <span style={{ color: "#9CA3AF" }}>Позиций: </span>
                  <span style={{ ...MONO, color: "#16181D" }}>
                    {selectedCampaignData.itemCount}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: activeTab === tab.id ? "rgba(255,221,45,0.15)" : "#FFFFFF",
              color: activeTab === tab.id ? "#16181D" : "#6B7280",
              border: activeTab === tab.id ? "1px solid rgba(255,221,45,0.4)" : "1px solid #E5E7EB",
            }}
          >
            {tab.ru}
            <span className="ml-1" style={{ fontSize: 10, color: "#9CA3AF" }}>{tab.en}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
           TAB: Versions
         ══════════════════════════════════════════════════ */}
      {activeTab === "versions" && (
        <Card className="border" style={{ borderColor: "#E5E7EB" }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" style={{ color: "#6B7280" }} />
                <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 600 }}>
                  История версий
                </span>
                <Badge variant="outline" className="text-xs" style={{ ...MONO, fontSize: 10 }}>
                  {versions.length} версий
                </Badge>
              </div>
              <div className="flex items-center gap-1" style={{ fontSize: 11, color: "#9CA3AF" }}>
                <Info className="h-3 w-3" />
                {labels.noRollback.ru}
              </div>
            </div>

            <div className="space-y-3">
              {versions.map((v, idx) => {
                const isExpanded = expandedVersions[v.version];
                return (
                  <div key={v.version} className="relative">
                    {idx < versions.length - 1 && (
                      <div className="absolute left-5 top-16 bottom-0 w-px" style={{ backgroundColor: "#E5E7EB" }} />
                    )}
                    <div className="rounded-lg border" style={{ borderColor: "#E5E7EB", backgroundColor: "#FAFBFC" }}>
                      <button
                        className="w-full flex items-start gap-3 p-4 text-left"
                        onClick={() => toggleVersion(v.version)}
                      >
                        <div
                          className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full mt-0.5"
                          style={{
                            backgroundColor: CHANGE_TYPE_CONFIG[v.changeType].bg,
                            color: CHANGE_TYPE_CONFIG[v.changeType].text,
                            fontSize: 12,
                            fontWeight: 700,
                            ...MONO,
                          }}
                        >
                          {v.version}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#16181D" }}>
                              Версия {v.version}
                            </span>
                            <ChangeTypeBadge type={v.changeType} />
                            {v.sentToDepartments && (
                              <Badge className="text-xs gap-1" style={{ backgroundColor: "#DCFCE7", color: "#16A34A", border: "1px solid #BBF7D0", fontSize: 9 }}>
                                <Send className="h-2.5 w-2.5" />отправлено
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span style={{ ...MONO, fontSize: 12, color: "#6B7280" }}>{v.date}</span>
                            <span style={{ fontSize: 12, color: "#16181D", fontWeight: 500 }}>{v.author}</span>
                            <Badge variant="outline" className="text-xs px-1.5 py-0" style={{ fontSize: 10, color: "#6B7280", borderColor: "#E5E7EB" }}>
                              {v.role}
                            </Badge>
                          </div>
                          <div className="mt-1.5" style={{ fontSize: 13, color: "#6B7280" }}>
                            {v.summary}
                          </div>
                        </div>
                        <div className="shrink-0 mt-1">
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4" style={{ color: "#9CA3AF" }} />
                            : <ChevronRight className="h-4 w-4" style={{ color: "#9CA3AF" }} />
                          }
                        </div>
                      </button>

                      {isExpanded && v.fieldChanges.length > 0 && (
                        <div className="px-4 pb-4">
                          <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
                            <table className="w-full" style={{ fontSize: 12 }}>
                              <thead>
                                <tr style={{ backgroundColor: "#F4F5F7" }}>
                                  <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280" }}>Номенклатура</th>
                                  <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280" }}>Поле</th>
                                  <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280" }}>Было</th>
                                  <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280" }}>Стало</th>
                                  <th className="text-center px-3 py-2 font-medium" style={{ color: "#6B7280", width: 70 }}>Тип</th>
                                </tr>
                              </thead>
                              <tbody>
                                {v.fieldChanges.map((ch, ci) => (
                                  <tr key={ci} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                                    <td className="px-3 py-1.5" style={{ fontSize: 12, color: "#16181D", maxWidth: 200 }}>
                                      <span className="truncate block">{ch.nomenclature}</span>
                                    </td>
                                    <td className="px-3 py-1.5" style={{ fontSize: 12, color: "#6B7280" }}>{ch.field}</td>
                                    <td className="px-3 py-1.5">
                                      {ch.oldValue ? (
                                        <span className="cell-removed inline-block px-1 rounded" style={{ ...MONO, fontSize: 12 }}>
                                          {ch.oldValue}
                                        </span>
                                      ) : (
                                        <span style={{ color: "#D1D5DB" }}>—</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-1.5">
                                      <span className={`inline-block px-1 rounded ${ch.changeKind === "added" ? "cell-added" : "cell-modified"}`} style={{ ...MONO, fontSize: 12 }}>
                                        {ch.newValue}
                                      </span>
                                    </td>
                                    <td className="px-3 py-1.5 text-center">
                                      <Badge variant="outline" className="text-xs" style={{
                                        fontSize: 9,
                                        backgroundColor: ch.changeKind === "added" ? "#DCFCE7" : ch.changeKind === "removed" ? "#FEE2E2" : "#FEF3C7",
                                        color: ch.changeKind === "added" ? "#16A34A" : ch.changeKind === "removed" ? "#DC2626" : "#D97706",
                                        borderColor: ch.changeKind === "added" ? "#BBF7D0" : ch.changeKind === "removed" ? "#FECACA" : "#FDE68A",
                                      }}>
                                        {ch.changeKind === "added" ? "добавлено" : ch.changeKind === "removed" ? "удалено" : "изменено"}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {isExpanded && v.fieldChanges.length === 0 && (
                        <div className="px-4 pb-4">
                          <div className="p-3 rounded" style={{ backgroundColor: "#F4F5F7", fontSize: 12, color: "#9CA3AF" }}>
                            Нет детальных изменений полей для этой версии
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {versions.length === 0 && (
                <div className="text-center py-16">
                  <History className="h-12 w-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 600, color: "#6B7280" }}>
                    Нет истории версий
                  </p>
                  <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
                    Выберите акцию с историей изменений
                  </p>
                </div>
              )}
            </div>

            {/* Create correction action */}
            {versions.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: "#E5E7EB" }}>
                <div style={{ fontSize: 11, color: "#9CA3AF", maxWidth: 340 }}>
                  {labels.noRollback.ru}
                </div>
                <Button
                  size="sm"
                  className="h-8"
                  style={{ backgroundColor: "#FFDD2D", color: "#16181D", fontSize: 12, fontWeight: 600 }}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  {labels.createCorrection.ru}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════
           TAB: Changes only
         ══════════════════════════════════════════════════ */}
      {activeTab === "changes" && (
        <Card className="border" style={{ borderColor: "#E5E7EB" }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <GitCompareArrows className="h-4 w-4" style={{ color: "#6B7280" }} />
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 600 }}>
                Все изменения полей
              </span>
              <Badge variant="outline" className="text-xs" style={{ ...MONO, fontSize: 10 }}>
                {allChanges.length} изменений
              </Badge>
            </div>

            {allChanges.length > 0 ? (
              <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
                <table className="w-full" style={{ fontSize: 12 }}>
                  <thead>
                    <tr style={{ backgroundColor: "#F9FAFB" }}>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280", width: 50 }}>v</th>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280", width: 130 }}>Дата</th>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280" }}>Номенклатура</th>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280" }}>Поле</th>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280" }}>Было</th>
                      <th className="text-left px-3 py-2 font-medium" style={{ color: "#6B7280" }}>Стало</th>
                      <th className="text-center px-3 py-2 font-medium" style={{ color: "#6B7280", width: 70 }}>Тип</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allChanges.map((ch, i) => (
                      <tr key={i} className="border-t" style={{ borderColor: "#F3F4F6" }}>
                        <td className="px-3 py-1.5" style={{ ...MONO, fontSize: 11, color: "#9CA3AF" }}>{ch.version}</td>
                        <td className="px-3 py-1.5" style={{ ...MONO, fontSize: 11, color: "#6B7280" }}>{ch.date}</td>
                        <td className="px-3 py-1.5" style={{ maxWidth: 180 }}>
                          <span className="truncate block" style={{ fontSize: 12, color: "#16181D" }}>{ch.nomenclature}</span>
                        </td>
                        <td className="px-3 py-1.5" style={{ fontSize: 12, color: "#6B7280" }}>{ch.field}</td>
                        <td className="px-3 py-1.5">
                          {ch.oldValue ? (
                            <span className="cell-removed inline-block px-1 rounded" style={{ ...MONO, fontSize: 12 }}>{ch.oldValue}</span>
                          ) : (
                            <span style={{ color: "#D1D5DB" }}>—</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5">
                          <span className={`inline-block px-1 rounded ${ch.changeKind === "added" ? "cell-added" : "cell-modified"}`} style={{ ...MONO, fontSize: 12 }}>
                            {ch.newValue}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <Badge variant="outline" className="text-xs" style={{
                            fontSize: 9,
                            backgroundColor: ch.changeKind === "added" ? "#DCFCE7" : ch.changeKind === "removed" ? "#FEE2E2" : "#FEF3C7",
                            color: ch.changeKind === "added" ? "#16A34A" : ch.changeKind === "removed" ? "#DC2626" : "#D97706",
                            borderColor: ch.changeKind === "added" ? "#BBF7D0" : ch.changeKind === "removed" ? "#FECACA" : "#FDE68A",
                          }}>
                            {ch.changeKind === "added" ? "добавлено" : ch.changeKind === "removed" ? "удалено" : "изменено"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <GitCompareArrows className="h-12 w-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "#6B7280" }}>Нет зафиксированных изменений</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>Изменения появятся после корректировок данных</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════
           TAB: Department sends
         ══════════════════════════════════════════════════ */}
      {activeTab === "sends" && (
        <Card className="border" style={{ borderColor: "#E5E7EB" }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Send className="h-4 w-4" style={{ color: "#6B7280" }} />
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 600 }}>
                Инкрементальные отправки в отделы
              </span>
              <Badge variant="outline" className="text-xs" style={{ ...MONO, fontSize: 10 }}>
                {sentVersions.length} отправок
              </Badge>
            </div>

            {sentVersions.length > 0 ? (
              <div className="space-y-3">
                {sentVersions.map((v) => (
                  <div key={v.version} className="p-4 rounded-lg border" style={{ borderColor: "#E5E7EB", backgroundColor: "#FAFBFC" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge style={{ backgroundColor: "#DCFCE7", color: "#16A34A", border: "1px solid #BBF7D0", fontSize: 10, ...MONO }}>
                            v{v.version}
                          </Badge>
                          <ChangeTypeBadge type={v.changeType} />
                        </div>
                        <div className="mt-2" style={{ fontSize: 13, color: "#16181D" }}>
                          {v.summary}
                        </div>
                        <div className="mt-1 flex items-center gap-2" style={{ fontSize: 12, color: "#6B7280" }}>
                          <span>{v.author} ({v.role})</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1.5" style={{ color: "#16A34A", fontSize: 11 }}>
                          <Check className="h-3 w-3" />
                          Отправлено
                        </div>
                        <div style={{ ...MONO, fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                          {v.departmentsSentDate}
                        </div>
                      </div>
                    </div>
                    {v.fieldChanges.length > 0 && (
                      <div className="mt-3 flex items-center gap-1" style={{ fontSize: 11, color: "#9CA3AF" }}>
                        <GitCompareArrows className="h-3 w-3" />
                        Инкрементально: {v.fieldChanges.length} изменённых полей отправлено в маркетинг, закуп и аналитику
                      </div>
                    )}
                    {v.fieldChanges.length === 0 && v.changeType === "initial_submission" && (
                      <div className="mt-3 flex items-center gap-1" style={{ fontSize: 11, color: "#9CA3AF" }}>
                        <Package className="h-3 w-3" />
                        Полный набор данных отправлен во все отделы
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Send className="h-12 w-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "#6B7280" }}>Нет отправок</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                  Данные отправляются в отделы после утверждения КД
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════
           TAB: Deadline changes
         ══════════════════════════════════════════════════ */}
      {activeTab === "deadlines" && (
        <Card className="border" style={{ borderColor: "#E5E7EB" }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock className="h-4 w-4" style={{ color: "#6B7280" }} />
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 600 }}>
                Изменения дедлайнов
              </span>
            </div>

            {/* Show all deadline changes, not just for selected campaign */}
            {MOCK_DEADLINE_CHANGES.length > 0 ? (
              <div className="space-y-3">
                {MOCK_DEADLINE_CHANGES.map((dc) => {
                  const camp = campaigns.find((c) => c.id === dc.campaignId);
                  return (
                    <div key={dc.id} className="p-4 rounded-lg border" style={{ borderColor: "#E5E7EB", backgroundColor: "#FAFBFC" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ ...MONO, fontSize: 11, color: "#9CA3AF" }}>{dc.campaignId}</span>
                            {camp && <span style={{ fontSize: 13, fontWeight: 500, color: "#16181D" }}>{camp.name}</span>}
                            <ApprovalStatusBadge status={dc.approvalStatus} />
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1.5">
                              <span style={{ fontSize: 12, color: "#6B7280" }}>Было:</span>
                              <span className="cell-removed inline-block px-1 rounded" style={{ ...MONO, fontSize: 12 }}>
                                {formatDate(dc.oldDeadline)}
                              </span>
                            </div>
                            <ArrowRight className="h-3 w-3" style={{ color: "#9CA3AF" }} />
                            <div className="flex items-center gap-1.5">
                              <span style={{ fontSize: 12, color: "#6B7280" }}>Стало:</span>
                              <span className="cell-added inline-block px-1 rounded" style={{ ...MONO, fontSize: 12, fontWeight: 600 }}>
                                {formatDate(dc.newDeadline)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2" style={{ fontSize: 12, color: "#6B7280" }}>
                            <span style={{ fontWeight: 500 }}>Причина:</span> {dc.reason}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2" style={{ fontSize: 11, color: "#9CA3AF" }}>
                            <span>Инициатор: {dc.initiator} ({dc.initiatorRole})</span>
                            <span>·</span>
                            <span style={MONO}>{dc.requestDate}</span>
                          </div>
                        </div>
                      </div>
                      {dc.approvalStatus === "approved" && dc.approvedBy && (
                        <div className="mt-3 flex items-center gap-1.5 px-2 py-1.5 rounded" style={{ backgroundColor: "#DCFCE7", fontSize: 11, color: "#16A34A" }}>
                          <Check className="h-3 w-3" />
                          Утверждено: {dc.approvedBy} · {dc.approvedDate}
                        </div>
                      )}
                      {dc.approvalStatus === "pending" && (
                        <div className="mt-3 flex items-center gap-1.5 px-2 py-1.5 rounded" style={{ backgroundColor: "#FEF3C7", fontSize: 11, color: "#92400E" }}>
                          <Clock className="h-3 w-3" />
                          Ожидает утверждения первым заместителем / уполномоченным лицом
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <CalendarClock className="h-12 w-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "#6B7280" }}>Нет запросов на изменение дедлайнов</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════
           TAB: Cancellations
         ══════════════════════════════════════════════════ */}
      {activeTab === "cancellations" && (
        <Card className="border" style={{ borderColor: "#E5E7EB" }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Ban className="h-4 w-4" style={{ color: "#DC2626" }} />
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 600 }}>
                Журнал отмен
              </span>
              <Badge variant="outline" className="text-xs" style={{ ...MONO, fontSize: 10 }}>
                {allCancellations.length} записей
              </Badge>
            </div>

            {allCancellations.length > 0 ? (
              <div className="space-y-3">
                {allCancellations.map((c) => (
                  <div key={c.id} className="p-4 rounded-lg border" style={{ borderColor: "#FECACA", backgroundColor: "#FEF2F2" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs" style={{
                            backgroundColor: c.target === "campaign" ? "#FEE2E2" : "#FFF7ED",
                            color: c.target === "campaign" ? "#DC2626" : "#C2410C",
                            borderColor: c.target === "campaign" ? "#FECACA" : "#FDBA74",
                            fontSize: 10,
                          }}>
                            {c.target === "campaign" ? "Акция" : "Позиция"}
                          </Badge>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#16181D" }}>
                            {c.targetName}
                          </span>
                        </div>
                        <div className="mt-2" style={{ fontSize: 12, color: "#6B7280" }}>
                          <span style={{ fontWeight: 500 }}>Причина:</span> {c.reason}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2" style={{ fontSize: 11, color: "#9CA3AF" }}>
                          <span>{c.cancelledBy} ({c.cancelledByRole})</span>
                          <span>·</span>
                          <span style={MONO}>{c.date}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {c.notifiedDepartments ? (
                          <div className="flex items-center gap-1" style={{ color: "#16A34A", fontSize: 11 }}>
                            <Send className="h-3 w-3" />
                            Уведомлены
                          </div>
                        ) : (
                          <div className="flex items-center gap-1" style={{ color: "#D97706", fontSize: 11 }}>
                            <Clock className="h-3 w-3" />
                            Ожидает КД
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Ban className="h-12 w-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: "#6B7280" }}>Нет отменённых акций или позиций</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
