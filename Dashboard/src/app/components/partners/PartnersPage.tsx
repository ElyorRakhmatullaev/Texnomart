"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import {
  RefreshCw,
  Download,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  LayoutGrid,
  List,
  Power,
  X,
} from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Badge } from "@texnomart/ui/badge";
import { Card } from "@texnomart/ui/card";
import { Switch } from "@texnomart/ui/switch";
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
  MOCK_PARTNERS,
  PARTNER_STATUSES,
  PARTNER_TYPES,
  API_STATUSES,
  type Partner,
  type PartnerStatus,
  type PartnerType,
  type ApiStatus,
} from "@/lib/partners-mock-data";

type ViewMode = "cards" | "table";

export function PartnersPage() {
  const navigate = useNavigate();
  const [partners, setPartners] = React.useState<Partner[]>(MOCK_PARTNERS);
  const [viewMode, setViewMode] = React.useState<ViewMode>("cards");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<PartnerStatus | "all">("all");
  const [typeFilter, setTypeFilter] = React.useState<PartnerType | "all">("all");
  const [apiFilter, setApiFilter] = React.useState<ApiStatus | "all">("all");

  const filteredPartners = React.useMemo(() => {
    return partners.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (apiFilter !== "all" && p.apiStatus !== apiFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.legalName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [partners, searchQuery, statusFilter, typeFilter, apiFilter]);

  const activeCount = partners.filter((p) => p.status === "active").length;
  const offlineCount = partners.filter((p) => p.apiStatus === "offline").length;
  const hasFilters = statusFilter !== "all" || typeFilter !== "all" || apiFilter !== "all";

  const handleToggleStatus = (id: string) => {
    setPartners((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "active" ? "deactivated" : "active" }
          : p
      )
    );
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setApiFilter("all");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-gray-900 pt-3">
            Партнёры
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Всего {partners.length} · Активных {activeCount} · Офлайн {offlineCount}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center rounded-lg border bg-gray-50 p-1">
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "cards"
                  ? "bg-[#FFD60A] text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Карточки</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-[#FFD60A] text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Таблица</span>
            </button>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Экспорт</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Экспорт в Excel</DropdownMenuItem>
              <DropdownMenuItem>Экспорт в CSV</DropdownMenuItem>
              <DropdownMenuItem>Экспорт в PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90 gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Добавить партнёра</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap bg-gray-50 rounded-lg p-3">
        <FilterChip
          label="Статус"
          active={statusFilter !== "all"}
          value={statusFilter !== "all" ? PARTNER_STATUSES[statusFilter].label : undefined}
          options={[
            { value: "all", label: "Все" },
            ...Object.entries(PARTNER_STATUSES).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
          onChange={(v) => setStatusFilter(v as PartnerStatus | "all")}
        />
        <FilterChip
          label="Тип"
          active={typeFilter !== "all"}
          value={typeFilter !== "all" ? PARTNER_TYPES[typeFilter].label : undefined}
          options={[
            { value: "all", label: "Все" },
            ...Object.entries(PARTNER_TYPES).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
          onChange={(v) => setTypeFilter(v as PartnerType | "all")}
        />
        <FilterChip
          label="API-статус"
          active={apiFilter !== "all"}
          value={apiFilter !== "all" ? API_STATUSES[apiFilter].label : undefined}
          options={[
            { value: "all", label: "Все" },
            ...Object.entries(API_STATUSES).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
          onChange={(v) => setApiFilter(v as ApiStatus | "all")}
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 gap-1 ml-auto">
            <X className="h-3 w-3" />
            Очистить фильтры
          </Button>
        )}
      </div>

      {/* Content */}
      {filteredPartners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Ничего не найдено</h3>
          <p className="text-sm text-gray-500 mt-1">По вашим фильтрам ничего не найдено</p>
          {hasFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Сбросить фильтры
            </Button>
          )}
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPartners.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              onToggle={() => handleToggleStatus(partner.id)}
              onClick={() => navigate(`/partners/${partner.id}`)}
            />
          ))}
        </div>
      ) : (
        <PartnersTable
          partners={filteredPartners}
          onToggle={handleToggleStatus}
          onRowClick={(id) => navigate(`/partners/${id}`)}
        />
      )}
    </div>
  );
}

function PartnerCard({
  partner,
  onToggle,
  onClick,
}: {
  partner: Partner;
  onToggle: () => void;
  onClick: () => void;
}) {
  const apiStatus = API_STATUSES[partner.apiStatus];

  return (
    <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer group" onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-lg ${partner.logoColor} flex items-center justify-center text-white font-bold text-sm`}>
            {partner.logoInitials}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{partner.name}</p>
            <p className="text-xs text-gray-500">{partner.legalName}</p>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={partner.status === "active"}
            onCheckedChange={onToggle}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Заявки сегодня</p>
          <p className="text-lg font-semibold tabular-nums">{partner.applicationsToday}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Конверсия</p>
          <p className="text-lg font-semibold tabular-nums">{partner.conversionRate}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Ср. время</p>
          <p className="text-lg font-semibold tabular-nums">{partner.avgScoringTime} сек</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Badge className={`${apiStatus.bg} ${apiStatus.text} text-xs px-2 py-0.5 rounded-full`}>
          {apiStatus.label}
        </Badge>
        <span className="text-sm font-medium text-[#FFD60A] opacity-0 group-hover:opacity-100 transition-opacity">
          Открыть →
        </span>
      </div>
    </Card>
  );
}

function PartnersTable({
  partners,
  onToggle,
  onRowClick,
}: {
  partners: Partner[];
  onToggle: (id: string) => void;
  onRowClick: (id: string) => void;
}) {
  return (
    <>
      {/* Desktop table */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-medium text-gray-500 uppercase">Партнёр</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase w-[100px]">Активен</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase w-[120px]">API-статус</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase w-[120px] text-right">Заявок сегодня</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase w-[100px] text-right">Конверсия</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase w-[120px] text-right">Ср. время</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase w-[100px] text-right">Регионы</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase w-[56px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((partner) => {
              const apiStatus = API_STATUSES[partner.apiStatus];
              const activeRegions = partner.regions.filter((r) => r.enabled).length;

              return (
                <TableRow
                  key={partner.id}
                  className="cursor-pointer hover:bg-gray-50 h-16"
                  onClick={() => onRowClick(partner.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg ${partner.logoColor} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                        {partner.logoInitials}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{partner.name}</p>
                        <p className="text-xs text-gray-500">{partner.legalName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={partner.status === "active"}
                      onCheckedChange={() => onToggle(partner.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge className={`${apiStatus.bg} ${apiStatus.text} text-xs px-2 py-0.5 rounded-full`}>
                      {apiStatus.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {partner.applicationsToday}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {partner.conversionRate}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-gray-600">
                    {partner.avgScoringTime} сек
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-gray-600">
                    {activeRegions}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onRowClick(partner.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Открыть
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onToggle(partner.id)}>
                          <Power className="h-4 w-4 mr-2" />
                          {partner.status === "active" ? "Деактивировать" : "Активировать"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {partners.map((partner) => {
          const apiStatus = API_STATUSES[partner.apiStatus];
          return (
            <Card
              key={partner.id}
              className="p-4 cursor-pointer active:bg-gray-50"
              onClick={() => onRowClick(partner.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${partner.logoColor} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                  {partner.logoInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{partner.name}</p>
                    <Badge className={`${apiStatus.bg} ${apiStatus.text} text-[10px] px-1.5 py-0 rounded-full shrink-0`}>
                      {apiStatus.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Конверсия {partner.conversionRate}% · {partner.applicationsToday} заявок
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function FilterChip({
  label,
  active,
  value,
  options,
  onChange,
}: {
  label: string;
  active: boolean;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
          active
            ? "bg-[#FFD60A] border-[#FFD60A] text-black"
            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
        }`}
      >
        {active ? value : label}
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-50 py-1 min-w-[160px]">
            {options.map((opt) => (
              <button
                key={opt.value}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
