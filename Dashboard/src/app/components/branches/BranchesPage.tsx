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
  List,
  MapPin,
  Users,
  X,
  Handshake,
  TrendingUp,
  Power,
} from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Badge } from "@texnomart/ui/badge";
import { Card } from "@texnomart/ui/card";
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
import { Avatar, AvatarFallback } from "@texnomart/ui/avatar";
import {
  MOCK_BRANCHES,
  BRANCH_STATUSES,
  ALL_REGIONS,
  type Branch,
  type BranchStatus,
} from "@/lib/branches-mock-data";

type ViewMode = "list" | "map";

export function BranchesPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = React.useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<BranchStatus | "all">("all");
  const [regionFilter, setRegionFilter] = React.useState<string>("all");

  const filteredBranches = React.useMemo(() => {
    return MOCK_BRANCHES.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (regionFilter !== "all" && b.region !== regionFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q) ||
          b.region.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, statusFilter, regionFilter]);

  const activeCount = MOCK_BRANCHES.filter((b) => b.status === "active").length;
  const hasFilters = statusFilter !== "all" || regionFilter !== "all";

  const clearFilters = () => {
    setStatusFilter("all");
    setRegionFilter("all");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-gray-900 pt-3">
            Филиалы
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Всего {MOCK_BRANCHES.length} · Активных {activeCount}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border bg-gray-50 p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-[#FFD60A] text-black shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <List className="h-4 w-4" />
              Список
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "map"
                  ? "bg-[#FFD60A] text-black shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <MapPin className="h-4 w-4" />
              Карта
            </button>
          </div>

          <Button variant="ghost" size="icon" className="h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                Экспорт
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Excel (.xlsx)</DropdownMenuItem>
              <DropdownMenuItem>CSV (.csv)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90">
            <Plus className="h-4 w-4 mr-1.5" />
            Добавить филиал
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap bg-gray-50 rounded-lg px-3 py-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск по названию, адресу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm bg-white"
          />
        </div>

        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
                statusFilter !== "all"
                  ? "bg-[#FFD60A] text-black border-[#FFD60A]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Статус
              {statusFilter !== "all" && `: ${BRANCH_STATUSES[statusFilter].label}`}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>Все</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("active")}>Активен</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>Неактивен</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Region filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
                regionFilter !== "all"
                  ? "bg-[#FFD60A] text-black border-[#FFD60A]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Регион
              {regionFilter !== "all" && `: ${regionFilter}`}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setRegionFilter("all")}>Все регионы</DropdownMenuItem>
            <DropdownMenuSeparator />
            {ALL_REGIONS.map((r) => (
              <DropdownMenuItem key={r} onClick={() => setRegionFilter(r)}>
                {r}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 ml-auto"
          >
            <X className="h-3.5 w-3.5" />
            Сбросить
          </button>
        )}
      </div>

      {/* Content */}
      {viewMode === "list" ? (
        <BranchTable branches={filteredBranches} onRowClick={(id) => navigate(`/branches/${id}`)} />
      ) : (
        <BranchMap branches={filteredBranches} onBranchClick={(id) => navigate(`/branches/${id}`)} />
      )}
    </div>
  );
}

function BranchTable({ branches, onRowClick }: { branches: Branch[]; onRowClick: (id: string) => void }) {
  if (branches.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16">
        <MapPin className="h-12 w-12 text-gray-300 mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Ничего не найдено</h3>
        <p className="text-sm text-gray-500">Попробуйте изменить параметры фильтрации</p>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">Название</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">Адрес</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide w-[140px]">Регион</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide w-[120px]">Сотрудников</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide w-[160px]">Активные партнёры</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide w-[120px]">Заявок/день</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide w-[120px]">Статус</TableHead>
              <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide w-[56px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((branch) => {
              const status = BRANCH_STATUSES[branch.status];
              const activePartners = branch.partners.filter((p) => p.enabled);
              const partnerNames = activePartners.map((p) => p.partnerName);
              const displayPartners = partnerNames.slice(0, 2).join(", ");
              const moreCount = partnerNames.length - 2;

              return (
                <TableRow
                  key={branch.id}
                  className="cursor-pointer hover:bg-gray-50 h-[56px]"
                  onClick={() => onRowClick(branch.id)}
                >
                  <TableCell className="font-medium text-gray-900">{branch.name}</TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-[200px] truncate" title={branch.address}>
                    {branch.address}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{branch.region}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular-nums">{branch.employees.length}</span>
                      <div className="flex -space-x-1.5">
                        {branch.employees.slice(0, 3).map((e) => (
                          <Avatar key={e.id} className="h-6 w-6 border-2 border-white">
                            <AvatarFallback className="text-[10px] bg-gray-200 text-gray-700">
                              {e.initials}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-700">
                      {displayPartners}
                      {moreCount > 0 && (
                        <span className="text-gray-400"> +{moreCount}</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium tabular-nums">{branch.stats.applicationsToday}</span>
                      {branch.stats.applicationsToday > 0 && (
                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${status.bg} ${status.text} text-xs px-2 py-0.5 rounded-full`}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onRowClick(branch.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Открыть
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Power className="h-4 w-4 mr-2" />
                          {branch.status === "active" ? "Деактивировать" : "Активировать"}
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
        {branches.map((branch) => {
          const status = BRANCH_STATUSES[branch.status];
          return (
            <Card
              key={branch.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow active:bg-gray-50"
              onClick={() => onRowClick(branch.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{branch.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">{branch.region}</p>
                </div>
                <Badge className={`${status.bg} ${status.text} text-xs px-2 py-0.5 rounded-full shrink-0`}>
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{branch.employees.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Handshake className="h-3.5 w-3.5" />
                  <span>{branch.partners.filter((p) => p.enabled).length}</span>
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  <span className="font-medium tabular-nums">{branch.stats.applicationsToday}</span>
                  <span className="text-gray-400">заявок/день</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function BranchMap({ branches, onBranchClick }: { branches: Branch[]; onBranchClick: (id: string) => void }) {
  const [hoveredBranch, setHoveredBranch] = React.useState<string | null>(null);

  return (
    <Card className="overflow-hidden">
      <div className="relative bg-gray-100" style={{ height: "500px" }}>
        {/* SVG Map placeholder */}
        <svg viewBox="0 0 800 500" className="w-full h-full">
          <rect width="800" height="500" fill="#f3f4f6" />
          {/* Uzbekistan simplified outline */}
          <path
            d="M100 100 L300 60 L500 80 L700 120 L720 200 L680 300 L600 350 L500 380 L350 400 L200 380 L120 300 L80 200 Z"
            fill="#e5e7eb"
            stroke="#d1d5db"
            strokeWidth="2"
          />
          <text x="400" y="35" textAnchor="middle" className="text-sm fill-gray-500 font-medium">
            Карта филиалов Узбекистана
          </text>

          {/* Branch markers */}
          {branches.map((branch) => {
            const x = ((branch.coordinates.lng - 56) / 17) * 650 + 75;
            const y = ((43 - branch.coordinates.lat) / 8) * 400 + 50;
            const isActive = branch.status === "active";
            const isHovered = hoveredBranch === branch.id;

            return (
              <g
                key={branch.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredBranch(branch.id)}
                onMouseLeave={() => setHoveredBranch(null)}
                onClick={() => onBranchClick(branch.id)}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 10 : 7}
                  fill={isActive ? "#FFD60A" : "#9CA3AF"}
                  stroke="white"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
                {isHovered && (
                  <>
                    <rect
                      x={x - 80}
                      y={y - 60}
                      width="160"
                      height="48"
                      rx="6"
                      fill="white"
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      filter="url(#shadow)"
                    />
                    <text x={x} y={y - 40} textAnchor="middle" className="text-xs fill-gray-900 font-medium">
                      {branch.name}
                    </text>
                    <text x={x} y={y - 24} textAnchor="middle" className="text-[10px] fill-gray-500">
                      {branch.employees.length} сотр. · {branch.stats.applicationsToday} заявок
                    </text>
                  </>
                )}
              </g>
            );
          })}
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
            </filter>
          </defs>
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg border px-3 py-2 flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#FFD60A]" />
            Активен
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-gray-400" />
            Неактивен
          </div>
        </div>
      </div>

      {/* Branch list below map */}
      <div className="border-t divide-y max-h-[300px] overflow-auto">
        {branches.map((branch) => {
          const status = BRANCH_STATUSES[branch.status];
          return (
            <div
              key={branch.id}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                hoveredBranch === branch.id ? "bg-gray-50" : ""
              }`}
              onClick={() => onBranchClick(branch.id)}
              onMouseEnter={() => setHoveredBranch(branch.id)}
              onMouseLeave={() => setHoveredBranch(null)}
            >
              <MapPin className={`h-4 w-4 shrink-0 ${branch.status === "active" ? "text-[#FFD60A]" : "text-gray-400"}`} />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900">{branch.name}</span>
                <span className="text-sm text-gray-500 ml-2">{branch.region}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 shrink-0">
                <span className="hidden sm:inline">{branch.employees.length} сотр.</span>
                <span className="tabular-nums">{branch.stats.applicationsToday} заявок</span>
                <Badge className={`${status.bg} ${status.text} text-xs px-2 py-0.5 rounded-full`}>
                  {status.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
