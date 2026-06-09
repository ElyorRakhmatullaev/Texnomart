"use client";

import * as React from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  MoreHorizontal,
  MapPin,
  Phone,
  Clock,
  Power,
  Trash2,
  Users,
  Plus,
  GripVertical,
  ChevronDown,
  TrendingUp,
  BarChart3,
  X,
} from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@texnomart/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@texnomart/ui/tabs";
import { Switch } from "@texnomart/ui/switch";
import { Avatar, AvatarFallback } from "@texnomart/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@texnomart/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@texnomart/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@texnomart/ui/popover";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  MOCK_BRANCHES,
  BRANCH_STATUSES,
  type Branch,
  type BranchPartnerConfig,
  type PrioritySlot,
  type DaySchedule,
} from "@/lib/branches-mock-data";

export function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const branch = MOCK_BRANCHES.find((b) => b.id === id);

  const [activeTab, setActiveTab] = React.useState("info");
  const [branchStatus, setBranchStatus] = React.useState(branch?.status ?? "active");

  if (!branch) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">Филиал не найден</h2>
          <p className="text-gray-600">Филиал с ID {id} не существует</p>
          <Button variant="outline" onClick={() => navigate("/branches")}>
            Вернуться к списку
          </Button>
        </div>
      </div>
    );
  }

  const status = BRANCH_STATUSES[branchStatus];

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <button
        onClick={() => navigate("/branches")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к филиалам
      </button>

      {/* Hero band */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{branch.name}</h2>
              <Badge className={`${status.bg} ${status.text} text-xs px-2 py-0.5 rounded-full`}>
                {status.label}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                {branch.address}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 shrink-0" />
                {branch.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0" />
                {branch.workingHours}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {branchStatus === "active" ? "Активен" : "Неактивен"}
              </span>
              <Switch
                checked={branchStatus === "active"}
                onCheckedChange={(checked) =>
                  setBranchStatus(checked ? "active" : "inactive")
                }
              />
            </div>
            <Button variant="outline" size="sm">
              <MapPin className="h-4 w-4 mr-1.5" />
              На карте
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Редактировать</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-12 w-full justify-start overflow-x-auto">
          <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4">
            Общая информация
          </TabsTrigger>
          <TabsTrigger value="employees" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4">
            Сотрудники
            <Badge variant="secondary" className="ml-1.5 text-xs">{branch.employees.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="partners" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4">
            Партнёры филиала
          </TabsTrigger>
          <TabsTrigger value="priorities" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4">
            Приоритеты
          </TabsTrigger>
          <TabsTrigger value="stats" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4">
            Статистика
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <InfoTab branch={branch} />
        </TabsContent>
        <TabsContent value="employees" className="mt-6">
          <EmployeesTab branch={branch} />
        </TabsContent>
        <TabsContent value="partners" className="mt-6">
          <PartnersTab branch={branch} />
        </TabsContent>
        <TabsContent value="priorities" className="mt-6">
          <PrioritiesTab branch={branch} />
        </TabsContent>
        <TabsContent value="stats" className="mt-6">
          <StatsTab branch={branch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ────────────────────────────────────────────
   Tab 1 — Общая информация
   ──────────────────────────────────────────── */

function InfoTab({ branch }: { branch: Branch }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Основное
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Название" value={branch.name} />
          <InfoRow label="Адрес" value={branch.address} />
          <InfoRow label="Координаты" value={`${branch.coordinates.lat}, ${branch.coordinates.lng}`} />
          <InfoRow label="Телефон" value={branch.phone} />
          <InfoRow label="Режим работы" value={branch.workingHours} />
          <div className="flex items-start gap-4">
            <span className="text-sm text-gray-500 w-[140px] shrink-0">Руководитель</span>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-gray-200 text-gray-700">
                  {branch.manager.initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-900">{branch.manager.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Локация
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
            <svg viewBox="0 0 400 200" className="w-full h-full">
              <rect width="400" height="200" fill="#f3f4f6" />
              <circle cx="200" cy="100" r="6" fill="#FFD60A" stroke="white" strokeWidth="2" />
              <circle cx="200" cy="100" r="20" fill="none" stroke="#FFD60A" strokeWidth="1" opacity="0.3" />
              <circle cx="200" cy="100" r="40" fill="none" stroke="#FFD60A" strokeWidth="1" opacity="0.15" />
              <text x="200" y="80" textAnchor="middle" className="text-[10px] fill-gray-500">
                {branch.name}
              </text>
              <text x="200" y="140" textAnchor="middle" className="text-[10px] fill-gray-400">
                {branch.coordinates.lat.toFixed(4)}, {branch.coordinates.lng.toFixed(4)}
              </text>
            </svg>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <span className="text-sm text-gray-500 sm:w-[140px] shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

/* ────────────────────────────────────────────
   Tab 2 — Сотрудники
   ──────────────────────────────────────────── */

function EmployeesTab({ branch }: { branch: Branch }) {
  const roleLabels: Record<string, string> = {
    operator: "Оператор",
    agent: "Агент",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Сотрудники ({branch.employees.length})
        </h3>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1.5" />
          Прикрепить сотрудника
        </Button>
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">Сотрудник</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide w-[120px]">Роль</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide w-[160px]">Телефон</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide w-[140px]">Заявок/мес</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide w-[56px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {branch.employees.map((emp) => (
              <TableRow key={emp.id} className="h-[56px]">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-gray-200 text-gray-700">
                        {emp.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-gray-900">{emp.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {roleLabels[emp.role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">{emp.phone}</TableCell>
                <TableCell className="text-sm font-medium tabular-nums">{emp.applicationsMonth}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Открыть профиль</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Открепить</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {branch.employees.map((emp) => (
          <Card key={emp.id} className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm bg-gray-200 text-gray-700">
                  {emp.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{emp.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs">
                    {roleLabels[emp.role]}
                  </Badge>
                  <span className="text-xs text-gray-500">{emp.applicationsMonth} заявок/мес</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Tab 3 — Партнёры филиала
   ──────────────────────────────────────────── */

function PartnersTab({ branch }: { branch: Branch }) {
  const [partners, setPartners] = React.useState<BranchPartnerConfig[]>(branch.partners);
  const allTerms = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36];
  const [expandedPartner, setExpandedPartner] = React.useState<string | null>(null);
  const [hasChanges, setHasChanges] = React.useState(false);

  const handleTogglePartner = (partnerId: string) => {
    setPartners((prev) =>
      prev.map((p) =>
        p.partnerId === partnerId ? { ...p, enabled: !p.enabled } : p
      )
    );
    setHasChanges(true);
  };

  const handleToggleTerm = (partnerId: string, term: number) => {
    setPartners((prev) =>
      prev.map((p) => {
        if (p.partnerId !== partnerId) return p;
        const terms = p.availableTerms.includes(term)
          ? p.availableTerms.filter((t) => t !== term)
          : [...p.availableTerms, term].sort((a, b) => a - b);
        return { ...p, availableTerms: terms };
      })
    );
    setHasChanges(true);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {partners.map((partner) => (
          <Card key={partner.partnerId} className="overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className={`h-10 w-10 rounded-lg ${partner.logoColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {partner.logoInitials}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900">{partner.partnerName}</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Сроки: {partner.availableTerms.length > 0 ? partner.availableTerms.map((t) => `${t} мес`).join(", ") : "не выбраны"}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Switch
                  checked={partner.enabled}
                  onCheckedChange={() => handleTogglePartner(partner.partnerId)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setExpandedPartner(
                      expandedPartner === partner.partnerId ? null : partner.partnerId
                    )
                  }
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      expandedPartner === partner.partnerId ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </div>
            </div>

            {expandedPartner === partner.partnerId && (
              <div className="border-t px-4 py-4 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-3">Доступные сроки рассрочки</p>
                <div className="flex flex-wrap gap-2">
                  {allTerms.map((term) => {
                    const isActive = partner.availableTerms.includes(term);
                    return (
                      <button
                        key={term}
                        onClick={() => handleToggleTerm(partner.partnerId, term)}
                        disabled={!partner.enabled}
                        className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-[#FFD60A] text-black"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        } ${!partner.enabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        {term} мес
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {hasChanges && (
        <div className="sticky bottom-[-0.75rem] md:bottom-[-1rem] z-10 -mx-3 -mb-3 md:-mx-4 md:-mb-4 bg-white border-t border-gray-200 px-3 md:px-4 py-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
            <Button variant="ghost" className="min-h-[44px] sm:min-h-0" onClick={() => { setPartners(branch.partners); setHasChanges(false); }}>
              Отменить
            </Button>
            <Button className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90 min-h-[44px] sm:min-h-0" onClick={() => setHasChanges(false)}>
              Сохранить изменения
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Tab 4 — Приоритеты (the complex one)
   ──────────────────────────────────────────── */

function PrioritiesTab({ branch }: { branch: Branch }) {
  const [schedule, setSchedule] = React.useState<DaySchedule[]>(branch.schedule);
  const [selectedDay, setSelectedDay] = React.useState(0);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  const currentDay = schedule[selectedDay];
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0

  const activePriority = React.useMemo(() => {
    const todaySchedule = schedule[dayOfWeek];
    if (!todaySchedule) return null;
    return todaySchedule.slots
      .filter((s) => currentHour >= s.startHour && currentHour < s.endHour)
      .sort((a, b) => a.priority - b.priority);
  }, [schedule, dayOfWeek, currentHour]);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    setSchedule((prev) => {
      const updated = [...prev];
      const daySlots = [...updated[selectedDay].slots];
      const [moved] = daySlots.splice(dragIndex, 1);
      daySlots.splice(index, 0, moved);
      const reordered = daySlots.map((s, i) => ({ ...s, priority: i + 1 }));
      updated[selectedDay] = { ...updated[selectedDay], slots: reordered };
      return updated;
    });
    setDragIndex(index);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const handleTimeChange = (slotIndex: number, field: "startHour" | "endHour", value: number) => {
    setSchedule((prev) => {
      const updated = [...prev];
      const daySlots = [...updated[selectedDay].slots];
      daySlots[slotIndex] = { ...daySlots[slotIndex], [field]: value };
      updated[selectedDay] = { ...updated[selectedDay], slots: daySlots };
      return updated;
    });
    setHasChanges(true);
  };

  const handleRemoveSlot = (slotIndex: number) => {
    setSchedule((prev) => {
      const updated = [...prev];
      const daySlots = updated[selectedDay].slots.filter((_, i) => i !== slotIndex);
      const reordered = daySlots.map((s, i) => ({ ...s, priority: i + 1 }));
      updated[selectedDay] = { ...updated[selectedDay], slots: reordered };
      return updated;
    });
    setHasChanges(true);
  };

  const handleAddPartner = () => {
    const usedPartnerIds = currentDay.slots.map((s) => s.partnerId);
    const availablePartners = branch.partners.filter(
      (p) => p.enabled && !usedPartnerIds.includes(p.partnerId)
    );
    if (availablePartners.length === 0) return;
    const next = availablePartners[0];
    setSchedule((prev) => {
      const updated = [...prev];
      const daySlots = [
        ...updated[selectedDay].slots,
        {
          partnerId: next.partnerId,
          partnerName: next.partnerName,
          logoColor: next.logoColor,
          logoInitials: next.logoInitials,
          priority: updated[selectedDay].slots.length + 1,
          startHour: 9,
          endHour: 18,
        },
      ];
      updated[selectedDay] = { ...updated[selectedDay], slots: daySlots };
      return updated;
    });
    setHasChanges(true);
  };

  const handleApplyToAllDays = () => {
    setSchedule((prev) =>
      prev.map((d) => ({ ...d, slots: currentDay.slots.map((s) => ({ ...s })) }))
    );
    setHasChanges(true);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-6">
      {/* Card A — Current active priority */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Текущий активный приоритет
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Сейчас {String(currentHour).padStart(2, "0")}:{String(currentMinute).padStart(2, "0")}{" "}
            ({schedule[dayOfWeek]?.day}) — действующий приоритет:
          </p>
          {activePriority && activePriority.length > 0 ? (
            <div className="flex items-end gap-4">
              {activePriority.map((slot, i) => (
                <div key={slot.partnerId} className="flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">#{slot.priority}</span>
                  <div
                    className={`${slot.logoColor} rounded-xl flex items-center justify-center text-white font-bold ${
                      i === 0 ? "h-16 w-16 text-xl" : i === 1 ? "h-12 w-12 text-base" : "h-10 w-10 text-sm"
                    }`}
                  >
                    {slot.logoInitials}
                  </div>
                  <span className="text-xs text-gray-700 font-medium text-center max-w-[80px] truncate">
                    {slot.partnerName}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Нет активных партнёров в текущее время</p>
          )}
        </CardContent>
      </Card>

      {/* Card B — Schedule editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Редактор расписания
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Day tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {schedule.map((day, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedDay === i
                    ? "bg-[#FFD60A] text-black"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {day.dayShort}
              </button>
            ))}
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <button
              onClick={handleApplyToAllDays}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100 whitespace-nowrap"
            >
              Все дни
            </button>
          </div>

          {/* 24-hour timeline visualization (desktop only) */}
          <div className="hidden md:block">
            <div className="relative">
              {/* Hour markers */}
              <div className="flex border-b border-gray-200 mb-2">
                {hours.map((h) => (
                  <div
                    key={h}
                    className="flex-1 text-center text-[10px] text-gray-400 pb-1"
                    style={{ minWidth: "0" }}
                  >
                    {h % 3 === 0 ? `${String(h).padStart(2, "0")}` : ""}
                  </div>
                ))}
              </div>

              {/* Partner rows */}
              {currentDay.slots.map((slot) => (
                <div key={slot.partnerId} className="flex items-center gap-2 mb-1.5">
                  <div className="w-[100px] shrink-0 flex items-center gap-1.5">
                    <div className={`h-5 w-5 rounded ${slot.logoColor} flex items-center justify-center text-white text-[8px] font-bold`}>
                      {slot.logoInitials}
                    </div>
                    <span className="text-xs text-gray-700 truncate">{slot.partnerName}</span>
                  </div>
                  <div className="flex-1 relative h-6 bg-gray-50 rounded overflow-hidden">
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute top-0 bottom-0 border-l border-gray-100"
                        style={{ left: `${(h / 24) * 100}%` }}
                      />
                    ))}
                    <div
                      className={`absolute top-0.5 bottom-0.5 rounded ${slot.logoColor} opacity-80`}
                      style={{
                        left: `${(slot.startHour / 24) * 100}%`,
                        width: `${((slot.endHour - slot.startHour) / 24) * 100}%`,
                      }}
                      title={`${slot.partnerName}: ${String(slot.startHour).padStart(2, "0")}:00–${String(slot.endHour).padStart(2, "0")}:00, приоритет ${slot.priority}`}
                    />
                  </div>
                </div>
              ))}

              {/* Current time indicator */}
              <div
                className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                style={{ left: `calc(100px + 8px + ${(currentHour / 24) * 100}% * (1 - (108px / 100%)))` }}
              />
            </div>
          </div>

          {/* Drag-and-drop ranked list */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Порядок приоритета ({currentDay.day})
            </p>
            {currentDay.slots.map((slot, index) => (
              <div
                key={slot.partnerId}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-lg border bg-white transition-all ${
                  dragIndex === index
                    ? "opacity-50 border-[#FFD60A] shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing shrink-0" />
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gray-100 text-sm font-bold text-gray-700 shrink-0">
                  {slot.priority}
                </div>
                <div className={`h-8 w-8 rounded-lg ${slot.logoColor} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                  {slot.logoInitials}
                </div>
                <span className="font-medium text-gray-900 text-sm flex-1 min-w-0 truncate">
                  {slot.partnerName}
                </span>

                {/* Time range */}
                <div className="flex items-center gap-1 shrink-0">
                  <TimeSelect
                    value={slot.startHour}
                    onChange={(v) => handleTimeChange(index, "startHour", v)}
                  />
                  <span className="text-gray-400 text-xs">—</span>
                  <TimeSelect
                    value={slot.endHour}
                    onChange={(v) => handleTimeChange(index, "endHour", v)}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-red-500 shrink-0"
                  onClick={() => handleRemoveSlot(index)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={handleAddPartner} className="mt-2">
              <Plus className="h-4 w-4 mr-1.5" />
              Добавить партнёра
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      {hasChanges && (
        <div className="sticky bottom-[-0.75rem] md:bottom-[-1rem] z-10 -mx-3 -mb-3 md:-mx-4 md:-mb-4 bg-white border-t border-gray-200 px-3 md:px-4 py-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <Button variant="secondary" size="sm" className="min-h-[44px] sm:min-h-0" onClick={handleApplyToAllDays}>
              Применить ко всем дням
            </Button>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button variant="ghost" className="min-h-[44px] sm:min-h-0" onClick={() => { setSchedule(branch.schedule); setHasChanges(false); }}>
                Отменить
              </Button>
              <Button className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90 min-h-[44px] sm:min-h-0" onClick={() => setHasChanges(false)}>
                Сохранить расписание
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimeSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 tabular-nums">
          {String(value).padStart(2, "0")}:00
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[120px] p-1 max-h-[200px] overflow-auto" align="start">
        {Array.from({ length: 24 }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 tabular-nums ${
              value === i ? "bg-[#FFD60A]/20 font-medium" : ""
            }`}
          >
            {String(i).padStart(2, "0")}:00
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────
   Tab 5 — Статистика
   ──────────────────────────────────────────── */

function StatsTab({ branch }: { branch: Branch }) {
  const stats = branch.stats;

  const kpis = [
    { label: "Заявок за день", value: stats.applicationsToday, icon: BarChart3 },
    { label: "Заявок за месяц", value: stats.applicationsMonth, icon: TrendingUp },
    { label: "Конверсия", value: `${stats.conversionRate}%`, icon: TrendingUp },
    { label: "Топ-партнёр", value: stats.topPartner, icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <kpi.icon className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">{kpi.label}</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 tabular-nums">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Applications dynamics line chart */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Динамика заявок
        </h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
              />
              <Area
                type="monotone"
                dataKey="applications"
                stroke="#FFD60A"
                fill="#FFD60A"
                fillOpacity={0.15}
                strokeWidth={2}
                name="Заявки"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Bottom row: top agents + top partners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Топ агентов филиала
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topAgents} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                />
                <Bar dataKey="applications" fill="#FFD60A" radius={[0, 4, 4, 0]} name="Заявки" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Топ партнёров филиала
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topPartners} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                />
                <Bar dataKey="applications" radius={[0, 4, 4, 0]} name="Заявки">
                  {stats.topPartners.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
