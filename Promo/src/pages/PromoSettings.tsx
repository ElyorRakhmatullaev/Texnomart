import React, { useState, useMemo } from "react";
import { Badge } from "@texnomart/ui/badge";
import { Button } from "@texnomart/ui/button";
import { Card, CardContent } from "@texnomart/ui/card";
import { Input } from "@texnomart/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@texnomart/ui/dialog";
import { Textarea } from "@texnomart/ui/textarea";
import { ScrollArea } from "@texnomart/ui/scroll-area";
import { Separator } from "@texnomart/ui/separator";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@texnomart/ui/tooltip";
import {
  Settings, Search, Plus, Copy, Save, SendHorizontal,
  Archive, ChevronDown, ChevronRight, CheckSquare, Square,
  History, Shield, ShieldCheck, ShieldOff, Info, Clock, Check,
  AlertCircle,
} from "lucide-react";
import {
  useApp,
  BilingualLabel,
  type PromoRule,
  type PromoRuleStatus,
  type FullCalendarFieldDef,
  PROMO_RULE_STATUS_CONFIG,
  PROMO_TYPE_REFERENCE,
  FULL_CALENDAR_FIELDS,
  FIELD_GROUP_CONFIG,
  MOCK_PROMO_RULES,
  formatDate,
} from "@/App";

const MONO: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontVariantNumeric: "tabular-nums",
};

const FIELD_GROUPS = ["ident", "product", "sales", "installment", "marketing"] as const;

function RuleStatusBadge({ status }: { status: PromoRuleStatus }) {
  const cfg = PROMO_RULE_STATUS_CONFIG[status];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="whitespace-nowrap text-xs font-medium px-2 py-0.5"
          style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}
        >
          {cfg.ru}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top"><p>{cfg.en}</p></TooltipContent>
    </Tooltip>
  );
}

function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm, variant = "default", requireReason = false }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (reason?: string) => void;
  variant?: "default" | "destructive";
  requireReason?: boolean;
}) {
  const [reason, setReason] = useState("");
  const canConfirm = !requireReason || reason.trim().length > 0;
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setReason(""); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {requireReason && (
          <Textarea
            placeholder="Укажите причину..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[80px]"
          />
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { setReason(""); onOpenChange(false); }}>Отмена</Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={!canConfirm}
            onClick={() => { onConfirm(reason || undefined); setReason(""); onOpenChange(false); }}
            style={variant !== "destructive" ? { backgroundColor: "#FFDD2D", color: "#16181D" } : undefined}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PromoSettingsPage() {
  const { currentRole } = useApp();
  const canEdit = currentRole === "commercial_director" || currentRole === "admin";
  const isKd = currentRole === "commercial_director";

  const [rules, setRules] = useState<PromoRule[]>(() => [...MOCK_PROMO_RULES]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>("rule-1");
  const [searchQuery, setSearchQuery] = useState("");

  // Editor state
  const [editName, setEditName] = useState("");
  const [editPromoTypes, setEditPromoTypes] = useState<string[]>([]);
  const [editRequiredFields, setEditRequiredFields] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // UI state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FIELD_GROUPS.map((g) => [g, true]))
  );
  const [showHistory, setShowHistory] = useState(false);
  const [confirmDialogType, setConfirmDialogType] = useState<"confirm" | "archive" | "reconfirm" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Filtered rule list
  const filteredRules = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return rules;
    return rules.filter(
      (r) => r.name.toLowerCase().includes(q) || r.promoTypes.some((t) => t.toLowerCase().includes(q))
    );
  }, [rules, searchQuery]);

  const selectedRule = useMemo(() => rules.find((r) => r.id === selectedRuleId) ?? null, [rules, selectedRuleId]);

  // Sync editor state when selection changes
  const loadRule = (rule: PromoRule | null) => {
    if (rule) {
      setEditName(rule.name);
      setEditPromoTypes([...rule.promoTypes]);
      setEditRequiredFields([...rule.requiredFields]);
    } else {
      setEditName("");
      setEditPromoTypes([]);
      setEditRequiredFields([]);
    }
    setIsDirty(false);
    setShowHistory(false);
  };

  const selectRule = (id: string) => {
    setSelectedRuleId(id);
    const rule = rules.find((r) => r.id === id) ?? null;
    loadRule(rule);
  };

  // Initialize editor on first render
  useState(() => {
    if (selectedRule) loadRule(selectedRule);
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Field checklist grouped
  const fieldsByGroup = useMemo(() => {
    const map: Record<string, FullCalendarFieldDef[]> = {};
    for (const g of FIELD_GROUPS) map[g] = [];
    for (const f of FULL_CALENDAR_FIELDS) map[f.group].push(f);
    return map;
  }, []);

  // Handlers
  const togglePromoType = (type: string) => {
    setEditPromoTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setIsDirty(true);
  };

  const toggleField = (key: string) => {
    setEditRequiredFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    setIsDirty(true);
  };

  const toggleGroupAll = (group: string) => {
    const groupFields = fieldsByGroup[group].map((f) => f.key);
    const allChecked = groupFields.every((k) => editRequiredFields.includes(k));
    if (allChecked) {
      setEditRequiredFields((prev) => prev.filter((k) => !groupFields.includes(k)));
    } else {
      setEditRequiredFields((prev) => [...new Set([...prev, ...groupFields])]);
    }
    setIsDirty(true);
  };

  const toggleGroupExpand = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const createNewRule = () => {
    const newId = `rule-${Date.now()}`;
    const newRule: PromoRule = {
      id: newId,
      name: "Новое правило",
      promoTypes: [],
      requiredFields: [],
      status: "draft",
      createdBy: isKd ? "Фарход Ибрагимов" : "Севара Ташпулатова",
      createdAt: "2026-06-08",
      version: 1,
      history: [
        { version: 1, date: "08.06.2026 " + new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }), author: isKd ? "Фарход Ибрагимов" : "Севара Ташпулатова", role: isKd ? "КД" : "Админ", summary: "Создано правило" },
      ],
    };
    setRules((prev) => [newRule, ...prev]);
    setSelectedRuleId(newId);
    loadRule(newRule);
    showToast("Правило создано");
  };

  const copyRule = () => {
    if (!selectedRule) return;
    const newId = `rule-${Date.now()}`;
    const copied: PromoRule = {
      ...selectedRule,
      id: newId,
      name: `${selectedRule.name} (копия)`,
      status: "draft",
      confirmedBy: undefined,
      confirmedAt: undefined,
      version: 1,
      history: [
        { version: 1, date: "08.06.2026 " + new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }), author: isKd ? "Фарход Ибрагимов" : "Севара Ташпулатова", role: isKd ? "КД" : "Админ", summary: `Скопировано из «${selectedRule.name}»` },
      ],
    };
    setRules((prev) => [copied, ...prev]);
    setSelectedRuleId(newId);
    loadRule(copied);
    showToast("Правило скопировано");
  };

  const saveDraft = () => {
    if (!selectedRule) return;
    const wasConfirmed = selectedRule.status === "confirmed";
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRuleId) return r;
        const newVersion = r.version + 1;
        return {
          ...r,
          name: editName,
          promoTypes: [...editPromoTypes],
          requiredFields: [...editRequiredFields],
          status: wasConfirmed ? "draft" as PromoRuleStatus : r.status,
          version: newVersion,
          confirmedBy: wasConfirmed ? undefined : r.confirmedBy,
          confirmedAt: wasConfirmed ? undefined : r.confirmedAt,
          history: [
            ...r.history,
            {
              version: newVersion,
              date: "08.06.2026 " + new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
              author: isKd ? "Фарход Ибрагимов" : "Севара Ташпулатова",
              role: isKd ? "КД" : "Админ",
              summary: wasConfirmed
                ? `Изменение утверждённого правила — требуется повторное подтверждение (${editRequiredFields.length} полей)`
                : `Обновлено — ${editRequiredFields.length} обязательных полей`,
            },
          ],
        };
      })
    );
    setIsDirty(false);
    showToast(wasConfirmed ? "Сохранено как черновик — требуется повторное подтверждение" : "Черновик сохранён");
  };

  const confirmRule = () => {
    if (!selectedRule) return;
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRuleId) return r;
        const newVersion = isDirty ? r.version + 1 : r.version;
        return {
          ...r,
          name: isDirty ? editName : r.name,
          promoTypes: isDirty ? [...editPromoTypes] : r.promoTypes,
          requiredFields: isDirty ? [...editRequiredFields] : r.requiredFields,
          status: "confirmed",
          confirmedBy: "Фарход Ибрагимов",
          confirmedAt: "2026-06-08",
          version: newVersion,
          history: [
            ...r.history,
            {
              version: newVersion,
              date: "08.06.2026 " + new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
              author: "Фарход Ибрагимов",
              role: "КД",
              summary: `Правило утверждено — ${(isDirty ? editRequiredFields : r.requiredFields).length} обязательных полей`,
            },
          ],
        };
      })
    );
    setIsDirty(false);
    setConfirmDialogType(null);
    showToast("Правило утверждено");
  };

  const archiveRule = (reason?: string) => {
    if (!selectedRule) return;
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRuleId) return r;
        const newVersion = r.version + 1;
        return {
          ...r,
          status: "archived",
          version: newVersion,
          history: [
            ...r.history,
            {
              version: newVersion,
              date: "08.06.2026 " + new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
              author: isKd ? "Фарход Ибрагимов" : "Севара Ташпулатова",
              role: isKd ? "КД" : "Админ",
              summary: `Архивировано${reason ? `: ${reason}` : ""}`,
            },
          ],
        };
      })
    );
    setIsDirty(false);
    setConfirmDialogType(null);
    showToast("Правило архивировано");
  };

  // Effect preview text
  const effectPreview = useMemo(() => {
    if (editPromoTypes.length === 0 || editRequiredFields.length === 0) return null;
    const typeList = editPromoTypes.length <= 2
      ? editPromoTypes.map((t) => `«${t}»`).join(" и ")
      : `${editPromoTypes.slice(0, 2).map((t) => `«${t}»`).join(", ")} и ещё ${editPromoTypes.length - 2}`;
    return { typeList, count: editRequiredFields.length };
  }, [editPromoTypes, editRequiredFields]);

  // Updated rule for status check (reflecting unsaved changes)
  const currentStatus = useMemo(() => {
    const r = rules.find((r) => r.id === selectedRuleId);
    return r?.status ?? "draft";
  }, [rules, selectedRuleId]);

  const isArchived = currentStatus === "archived";
  const isConfirmed = currentStatus === "confirmed";
  const needsReconfirm = isConfirmed && isDirty;

  // ────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Page title */}
      <BilingualLabel ru="Настройки типов промо" en="Promo-type settings" size="page" />

      {/* No-access fallback */}
      {!canEdit && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <ShieldOff className="h-12 w-12" style={{ color: "#9CA3AF" }} />
            <p style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: 16, color: "#16181D" }}>
              Нет доступа
            </p>
            <p style={{ fontSize: 13, color: "#6B7280" }}>
              Настройка правил доступна только Коммерческому директору и Администратору
            </p>
          </CardContent>
        </Card>
      )}

      {canEdit && (
        <div className="flex flex-col lg:flex-row gap-5" style={{ minHeight: 600 }}>
          {/* ═══════════════════════════════════════════════════
             LEFT PANEL — Rule list
             ═══════════════════════════════════════════════════ */}
          <div className="w-full lg:w-[340px] lg:shrink-0 flex flex-col gap-3">
            {/* Search + actions */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9CA3AF" }} />
                <Input
                  placeholder="Поиск правил..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                  style={{ fontSize: 13 }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-9"
                style={{ backgroundColor: "#FFDD2D", color: "#16181D", fontSize: 13, fontWeight: 600 }}
                onClick={createNewRule}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Создать правило
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    disabled={!selectedRule}
                    onClick={copyRule}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Копировать правило / Copy rule</TooltipContent>
              </Tooltip>
            </div>

            {/* Rule list */}
            <ScrollArea className="flex-1" style={{ maxHeight: "calc(100vh - 280px)" }}>
              <div className="flex flex-col gap-2 pr-1">
                {filteredRules.length === 0 && (
                  <div className="flex flex-col items-center py-10 gap-2">
                    <Settings className="h-10 w-10" style={{ color: "#D1D5DB" }} />
                    <p style={{ fontSize: 13, color: "#9CA3AF" }}>
                      {searchQuery ? "Ничего не найдено" : "Нет правил"}
                    </p>
                  </div>
                )}
                {filteredRules.map((rule) => {
                  const isSelected = rule.id === selectedRuleId;
                  return (
                    <Card
                      key={rule.id}
                      className="cursor-pointer transition-colors"
                      style={{
                        borderLeft: isSelected ? "3px solid #FFDD2D" : "3px solid transparent",
                        backgroundColor: isSelected ? "#FFFDF5" : "#FFFFFF",
                        borderColor: isSelected ? "#FFDD2D" : undefined,
                      }}
                      onClick={() => selectRule(rule.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p
                            className="font-medium leading-tight"
                            style={{
                              fontSize: 13,
                              fontFamily: "'IBM Plex Sans', sans-serif",
                              fontWeight: 600,
                              color: "#16181D",
                            }}
                          >
                            {rule.name}
                          </p>
                          <RuleStatusBadge status={rule.status} />
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {rule.promoTypes.map((type) => (
                            <Badge
                              key={type}
                              variant="outline"
                              className="text-xs"
                              style={{ fontSize: 10, color: "#6B7280", borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-3" style={{ fontSize: 11, color: "#9CA3AF" }}>
                          <span style={MONO}>{rule.requiredFields.length} полей</span>
                          <span>·</span>
                          <span style={MONO}>v{rule.version}</span>
                          {rule.confirmedAt && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-0.5">
                                <ShieldCheck className="h-3 w-3" style={{ color: "#16A34A" }} />
                                {formatDate(rule.confirmedAt)}
                              </span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* ═══════════════════════════════════════════════════
             RIGHT PANEL — Rule editor
             ═══════════════════════════════════════════════════ */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {!selectedRule ? (
              <Card className="flex-1">
                <CardContent className="flex flex-col items-center justify-center py-20 gap-3">
                  <Settings className="h-12 w-12" style={{ color: "#D1D5DB" }} />
                  <p style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: 15, color: "#6B7280" }}>
                    Выберите правило или создайте новое
                  </p>
                  <p style={{ fontSize: 13, color: "#9CA3AF" }}>
                    Select a rule or create a new one
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Editor header */}
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <RuleStatusBadge status={currentStatus} />
                        <span style={{ ...MONO, fontSize: 11, color: "#9CA3AF" }}>v{selectedRule.version}</span>
                        {isDirty && (
                          <Badge variant="outline" style={{ fontSize: 10, color: "#D97706", borderColor: "#FDE68A", backgroundColor: "#FEF3C7" }}>
                            Несохранённые изменения
                          </Badge>
                        )}
                        {needsReconfirm && (
                          <Badge variant="outline" style={{ fontSize: 10, color: "#DC2626", borderColor: "#FECACA", backgroundColor: "#FEE2E2" }}>
                            Требует повторного подтверждения
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 gap-1"
                        style={{ fontSize: 12, color: "#6B7280" }}
                        onClick={() => setShowHistory(!showHistory)}
                      >
                        <History className="h-3.5 w-3.5" />
                        История
                      </Button>
                    </div>

                    {/* Rule name */}
                    <div className="mb-4">
                      <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                        Наименование правила
                        <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 400, marginLeft: 6 }}>Rule name</span>
                      </label>
                      <Input
                        value={editName}
                        onChange={(e) => { setEditName(e.target.value); setIsDirty(true); }}
                        disabled={isArchived}
                        className="h-9"
                        style={{ fontSize: 14, fontWeight: 500 }}
                      />
                    </div>

                    {/* Promo types multi-select */}
                    <div>
                      <label className="block mb-1.5" style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                        Тип(ы) промо
                        <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 400, marginLeft: 6 }}>Promo type(s)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PROMO_TYPE_REFERENCE.map((type) => {
                          const isChecked = editPromoTypes.includes(type);
                          return (
                            <button
                              key={type}
                              disabled={isArchived}
                              onClick={() => togglePromoType(type)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-colors"
                              style={{
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: isArchived ? "default" : "pointer",
                                backgroundColor: isChecked ? "rgba(255,221,45,0.15)" : "#FFFFFF",
                                borderColor: isChecked ? "rgba(255,221,45,0.5)" : "#E5E7EB",
                                color: isChecked ? "#16181D" : "#6B7280",
                                opacity: isArchived ? 0.5 : 1,
                              }}
                            >
                              {isChecked
                                ? <CheckSquare className="h-3.5 w-3.5" style={{ color: "#F5C400" }} />
                                : <Square className="h-3.5 w-3.5" style={{ color: "#D1D5DB" }} />}
                              {type}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Effect preview */}
                {effectPreview && (
                  <Card style={{ backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2.5">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#16A34A" }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#16181D", marginBottom: 4 }}>
                            Для типа {effectPreview.typeList} станут обязательными {effectPreview.count} полей
                          </p>
                          <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
                            Когда правило утверждено, указанные поля подсвечиваются как обязательные в полном промо-календаре
                            и блокируют отправку на согласование, если не заполнены. Без утверждённого правила полнота
                            контролируется только процессом согласования.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Field checklist */}
                <Card className="flex-1">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Manrope', sans-serif", color: "#16181D" }}>
                          Перечень обязательных полей
                        </p>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>Required fields checklist</p>
                      </div>
                      <Badge variant="outline" style={{ ...MONO, fontSize: 11, color: "#16181D", borderColor: "#E5E7EB" }}>
                        {editRequiredFields.length} / {FULL_CALENDAR_FIELDS.length}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-1">
                      {FIELD_GROUPS.map((group) => {
                        const groupCfg = FIELD_GROUP_CONFIG[group];
                        const fields = fieldsByGroup[group];
                        const checkedCount = fields.filter((f) => editRequiredFields.includes(f.key)).length;
                        const allChecked = checkedCount === fields.length;
                        const someChecked = checkedCount > 0 && !allChecked;
                        const isExpanded = expandedGroups[group];

                        return (
                          <div key={group} className="rounded-lg border" style={{ borderColor: "#E5E7EB", marginBottom: 4 }}>
                            {/* Group header */}
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                              onClick={() => toggleGroupExpand(group)}
                              style={{ cursor: "pointer" }}
                            >
                              {isExpanded
                                ? <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "#6B7280" }} />
                                : <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "#6B7280" }} />}
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#16181D", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                                {groupCfg.ru}
                              </span>
                              <span style={{ fontSize: 11, color: "#9CA3AF" }}>{groupCfg.en}</span>
                              <span className="ml-auto flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  style={{
                                    ...MONO,
                                    fontSize: 10,
                                    color: checkedCount > 0 ? "#16A34A" : "#9CA3AF",
                                    borderColor: checkedCount > 0 ? "#BBF7D0" : "#E5E7EB",
                                    backgroundColor: checkedCount > 0 ? "#F0FDF4" : "#F9FAFB",
                                  }}
                                >
                                  {checkedCount}/{fields.length}
                                </Badge>
                                {!isArchived && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); toggleGroupAll(group); }}
                                        className="p-0.5 rounded hover:bg-gray-100 transition-colors"
                                      >
                                        {allChecked
                                          ? <CheckSquare className="h-4 w-4" style={{ color: "#16A34A" }} />
                                          : someChecked
                                          ? <CheckSquare className="h-4 w-4" style={{ color: "#D97706" }} />
                                          : <Square className="h-4 w-4" style={{ color: "#D1D5DB" }} />}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>{allChecked ? "Снять все" : "Выбрать все"}</TooltipContent>
                                  </Tooltip>
                                )}
                              </span>
                            </button>

                            {/* Fields */}
                            {isExpanded && (
                              <div className="px-3 pb-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                                  {fields.map((field) => {
                                    const isChecked = editRequiredFields.includes(field.key);
                                    return (
                                      <button
                                        key={field.key}
                                        disabled={isArchived}
                                        onClick={() => toggleField(field.key)}
                                        className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                                        style={{
                                          cursor: isArchived ? "default" : "pointer",
                                          opacity: isArchived ? 0.5 : 1,
                                        }}
                                      >
                                        {isChecked
                                          ? <CheckSquare className="h-4 w-4 shrink-0" style={{ color: "#16A34A" }} />
                                          : <Square className="h-4 w-4 shrink-0" style={{ color: "#D1D5DB" }} />}
                                        <div className="min-w-0">
                                          <span style={{ fontSize: 13, color: isChecked ? "#16181D" : "#6B7280", fontWeight: isChecked ? 500 : 400 }}>
                                            {field.ru}
                                          </span>
                                          <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: 6 }}>
                                            {field.en}
                                          </span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* History panel */}
                {showHistory && selectedRule.history.length > 0 && (
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <History className="h-4 w-4" style={{ color: "#6B7280" }} />
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#16181D" }}>
                          История изменений
                        </p>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>Change history</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {[...selectedRule.history].reverse().map((entry, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 py-2 px-3 rounded-md"
                            style={{ backgroundColor: idx === 0 ? "#F9FAFB" : "transparent" }}
                          >
                            <div
                              className="mt-1 shrink-0 flex items-center justify-center rounded-full"
                              style={{
                                width: 24, height: 24,
                                backgroundColor: idx === 0 ? "#DBEAFE" : "#F3F4F6",
                                color: idx === 0 ? "#2563EB" : "#9CA3AF",
                                fontSize: 10, fontWeight: 700,
                              }}
                            >
                              v{entry.version}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p style={{ fontSize: 13, color: "#16181D", fontWeight: 500 }}>
                                {entry.summary}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5" style={{ fontSize: 11, color: "#9CA3AF" }}>
                                <span>{entry.author}</span>
                                <span>·</span>
                                <span>{entry.role}</span>
                                <span>·</span>
                                <span style={MONO}>{entry.date}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action bar */}
                {!isArchived && (
                  <Card style={{ position: "sticky", bottom: 0, zIndex: 10 }}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Validation hint */}
                        {editName.trim() === "" && (
                          <span className="flex items-center gap-1" style={{ fontSize: 12, color: "#DC2626" }}>
                            <AlertCircle className="h-3.5 w-3.5" />
                            Укажите наименование
                          </span>
                        )}
                        {editPromoTypes.length === 0 && (
                          <span className="flex items-center gap-1" style={{ fontSize: 12, color: "#DC2626" }}>
                            <AlertCircle className="h-3.5 w-3.5" />
                            Выберите тип промо
                          </span>
                        )}
                        {editRequiredFields.length === 0 && (
                          <span className="flex items-center gap-1" style={{ fontSize: 12, color: "#DC2626" }}>
                            <AlertCircle className="h-3.5 w-3.5" />
                            Отметьте обязательные поля
                          </span>
                        )}

                        <div className="ml-auto flex items-center gap-2">
                          {/* Archive */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 gap-1.5"
                                style={{ fontSize: 13, color: "#6B7280" }}
                                onClick={() => setConfirmDialogType("archive")}
                              >
                                <Archive className="h-4 w-4" />
                                <span className="hidden sm:inline">Архивировать</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Archive rule</TooltipContent>
                          </Tooltip>

                          {/* Save draft */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 gap-1.5"
                            style={{ fontSize: 13 }}
                            disabled={!isDirty || editName.trim() === ""}
                            onClick={saveDraft}
                          >
                            <Save className="h-4 w-4" />
                            Сохранить
                          </Button>

                          {/* Confirm / send for confirmation */}
                          {isKd ? (
                            <Button
                              size="sm"
                              className="h-9 px-4 gap-1.5"
                              style={{ backgroundColor: "#FFDD2D", color: "#16181D", fontSize: 13, fontWeight: 600 }}
                              disabled={editName.trim() === "" || editPromoTypes.length === 0 || editRequiredFields.length === 0}
                              onClick={() => setConfirmDialogType("confirm")}
                            >
                              <ShieldCheck className="h-4 w-4" />
                              Подтвердить
                            </Button>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  className="h-9 px-4 gap-1.5"
                                  style={{ backgroundColor: "#FFDD2D", color: "#16181D", fontSize: 13, fontWeight: 600 }}
                                  disabled={editName.trim() === "" || editPromoTypes.length === 0 || editRequiredFields.length === 0 || !isDirty}
                                  onClick={() => { saveDraft(); showToast("Отправлено на подтверждение КД"); }}
                                >
                                  <SendHorizontal className="h-4 w-4" />
                                  Отправить на подтверждение
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Send for Commercial Director confirmation</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Archived notice */}
                {isArchived && (
                  <Card style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB" }}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4" style={{ color: "#9CA3AF" }} />
                        <p style={{ fontSize: 13, color: "#6B7280" }}>
                          Это правило архивировано и не может быть отредактировано. Используйте «Копировать» для создания нового правила на его основе.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
         DIALOGS
         ═══════════════════════════════════════════════════ */}

      <ConfirmDialog
        open={confirmDialogType === "confirm"}
        onOpenChange={(v) => { if (!v) setConfirmDialogType(null); }}
        title="Подтвердить правило"
        description={`Правило «${editName}» будет утверждено и начнёт действовать для типов: ${editPromoTypes.join(", ")}. ${editRequiredFields.length} полей станут обязательными в полном промо-календаре.`}
        confirmLabel="Подтвердить"
        onConfirm={() => confirmRule()}
      />

      <ConfirmDialog
        open={confirmDialogType === "archive"}
        onOpenChange={(v) => { if (!v) setConfirmDialogType(null); }}
        title="Архивировать правило"
        description={`Правило «${selectedRule?.name ?? ""}» будет перемещено в архив и перестанет действовать. Это действие обратимо через копирование.`}
        confirmLabel="Архивировать"
        onConfirm={(reason) => archiveRule(reason)}
        variant="destructive"
        requireReason
      />

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg"
          style={{ backgroundColor: "#16181D", color: "#FFFFFF", fontSize: 13, fontWeight: 500 }}
        >
          <Check className="h-4 w-4" style={{ color: "#FFDD2D" }} />
          {toast}
        </div>
      )}
    </div>
  );
}
