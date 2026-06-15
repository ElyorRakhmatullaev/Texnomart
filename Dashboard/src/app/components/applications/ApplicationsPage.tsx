"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import {
  RefreshCw,
  Search,
  MoreHorizontal,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@texnomart/ui/dropdown-menu";
import { Checkbox } from "@texnomart/ui/checkbox";
import { Badge } from "@texnomart/ui/badge";
import { Avatar, AvatarFallback } from "@texnomart/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@texnomart/ui/table";
import { Card } from "@texnomart/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import {
  MOCK_APPLICATIONS,
  APPLICATION_STATUSES,
  type Application,
  type ApplicationStatus,
} from "@/lib/applications-mock-data";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const PAGE_SIZES = [10, 20, 50, 100] as const;

type SortKey = "createdAt" | "amount" | "status";
type SortDir = "asc" | "desc";

export function ApplicationsPage() {
  const navigate = useNavigate();
  const [applications] = React.useState<Application[]>(MOCK_APPLICATIONS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ApplicationStatus | "all">("all");
  const [partnerFilter, setPartnerFilter] = React.useState<string>("all");
  const [branchFilter, setBranchFilter] = React.useState<string>("all");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = React.useState<number>(20);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  // Unique partner names + branch names derived from the data
  const partnerOptions = React.useMemo(() => {
    const names = new Set<string>();
    applications.forEach((app) => app.partners.forEach((p) => names.add(p.name)));
    return Array.from(names).sort((a, b) => a.localeCompare(b, "ru"));
  }, [applications]);

  const branchOptions = React.useMemo(() => {
    const names = new Set<string>();
    applications.forEach((app) => names.add(app.branch.name));
    return Array.from(names).sort((a, b) => a.localeCompare(b, "ru"));
  }, [applications]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    partnerFilter !== "all" ||
    branchFilter !== "all";

  // 1) Filter
  const filteredApplications = React.useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (partnerFilter !== "all" && !app.partners.some((p) => p.name === partnerFilter))
        return false;
      if (branchFilter !== "all" && app.branch.name !== branchFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          app.client.name.toLowerCase().includes(q) ||
          app.client.phone.toLowerCase().includes(q) ||
          app.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [applications, searchQuery, statusFilter, partnerFilter, branchFilter]);

  // 2) Sort
  const sortedApplications = React.useMemo(() => {
    const arr = [...filteredApplications];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "createdAt") {
        cmp = a.createdAt.getTime() - b.createdAt.getTime();
      } else if (sortKey === "amount") {
        cmp = a.amount - b.amount;
      } else {
        cmp = APPLICATION_STATUSES[a.status].label.localeCompare(
          APPLICATION_STATUSES[b.status].label,
          "ru"
        );
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filteredApplications, sortKey, sortDir]);

  // 3) Paginate
  const totalPages = Math.max(1, Math.ceil(sortedApplications.length / pageSize));
  const paginatedApplications = React.useMemo(
    () =>
      sortedApplications.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedApplications, currentPage, pageSize]
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" || key === "amount" ? "desc" : "asc");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPartnerFilter("all");
    setBranchFilter("all");
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedApplications.map((app) => app.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
  };

  const handleRowClick = (id: string) => {
    navigate(`/applications/${id}`);
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  const formatRelativeTime = (date: Date) =>
    formatDistanceToNow(date, { addSuffix: true, locale: ru });

  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("");

  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <ChevronDown className="size-3 text-gray-300" />;
    }
    return sortDir === "asc" ? (
      <ChevronUp className="size-3 text-gray-700" />
    ) : (
      <ChevronDown className="size-3 text-gray-700" />
    );
  };

  const allCurrentSelected =
    paginatedApplications.length > 0 &&
    paginatedApplications.every((app) => selectedIds.has(app.id));

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* PageHeader (Pattern A) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-gray-900">
            Заявки
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Найдено {filteredApplications.length.toLocaleString("ru-RU")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск по клиенту, телефону, ID"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3 h-10"
            />
          </div>
          <Button variant="ghost" size="icon" className="shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* FilterBar (Pattern B) */}
      <div className="flex items-center gap-2 flex-wrap shrink-0 bg-gray-50 rounded-md px-3 py-2">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as ApplicationStatus | "all");
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px] h-8 text-sm bg-white">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {(Object.keys(APPLICATION_STATUSES) as ApplicationStatus[]).map((key) => (
              <SelectItem key={key} value={key}>
                {APPLICATION_STATUSES[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={partnerFilter}
          onValueChange={(v) => {
            setPartnerFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px] h-8 text-sm bg-white">
            <SelectValue placeholder="Партнёр" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все партнёры</SelectItem>
            {partnerOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={branchFilter}
          onValueChange={(v) => {
            setBranchFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px] h-8 text-sm bg-white">
            <SelectValue placeholder="Филиал" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все филиалы</SelectItem>
            {branchOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-gray-500"
            onClick={resetFilters}
          >
            <X className="h-3 w-3 mr-1" />
            Сбросить
          </Button>
        )}

        <div className="ml-auto text-xs text-gray-500">
          Найдено: {filteredApplications.length.toLocaleString("ru-RU")}
        </div>
      </div>

      {/* Data Table (Pattern C) */}
      <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allCurrentSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[110px]">ID</TableHead>
                <TableHead className="w-[150px]">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => handleSort("createdAt")}
                  >
                    Создано
                    <SortIndicator column="createdAt" />
                  </button>
                </TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead className="w-[150px]">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => handleSort("amount")}
                  >
                    Сумма
                    <SortIndicator column="amount" />
                  </button>
                </TableHead>
                <TableHead className="w-[170px]">Партнёр(ы)</TableHead>
                <TableHead className="w-[150px]">Филиал</TableHead>
                <TableHead className="w-[140px]">Оператор</TableHead>
                <TableHead className="w-[180px]">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => handleSort("status")}
                  >
                    Статус
                    <SortIndicator column="status" />
                  </button>
                </TableHead>
                <TableHead className="w-[56px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-sm text-gray-500">
                    Заявки не найдены
                  </TableCell>
                </TableRow>
              ) : (
                paginatedApplications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="h-12 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(app.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(app.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(app.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell
                      className="font-mono text-xs text-gray-700 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyId(app.id);
                      }}
                      title="Копировать ID"
                    >
                      {app.id}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm" title={formatRelativeTime(app.createdAt)}>
                        {formatDate(app.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarFallback className="text-xs bg-gray-100 text-gray-700">
                            {getInitials(app.client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {app.client.name}
                          </div>
                          <div className="text-xs text-gray-500">{app.client.phone}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="tabular-nums">
                        <div className="text-sm font-semibold">
                          {app.amount.toLocaleString("ru-RU")}
                        </div>
                        <div className="text-xs text-gray-500">
                          UZS · на {app.term} мес
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {app.partners.slice(0, 3).map((partner) => (
                          <div
                            key={partner.id}
                            className="flex items-center gap-1 text-sm min-w-0"
                          >
                            <div className="size-4 rounded bg-gray-200 shrink-0" />
                            <span className="truncate">{partner.name}</span>
                          </div>
                        ))}
                        {app.partners.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{app.partners.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm truncate" title={app.branch.name}>
                        {app.branch.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {app.operator ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6 shrink-0">
                            <AvatarFallback className="text-xs bg-gray-100">
                              {getInitials(app.operator.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">{app.operator.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${APPLICATION_STATUSES[app.status].bg} ${
                          APPLICATION_STATUSES[app.status].text
                        } border-0`}
                      >
                        {APPLICATION_STATUSES[app.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRowClick(app.id)}>
                            Открыть
                          </DropdownMenuItem>
                          <DropdownMenuItem>Одобрить</DropdownMenuItem>
                          <DropdownMenuItem>Отклонить</DropdownMenuItem>
                          <DropdownMenuItem>Переназначить</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleCopyId(app.id)}>
                            <Copy className="size-4 mr-2" />
                            Скопировать ID
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Показывать</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[80px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">строк</span>
          </div>
          <span className="text-sm text-gray-500 tabular-nums">
            {filteredApplications.length === 0
              ? "0"
              : ((currentPage - 1) * pageSize + 1).toLocaleString("ru-RU")}
            –
            {Math.min(currentPage * pageSize, filteredApplications.length).toLocaleString(
              "ru-RU"
            )}{" "}
            из {filteredApplications.length.toLocaleString("ru-RU")}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Bulk Actions Toolbar (Pattern F) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white rounded-lg shadow-2xl px-6 py-4 flex items-center gap-6">
          <span className="font-medium">Выбрано: {selectedIds.size}</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              Одобрить
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              Отклонить
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              Переназначить
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              Экспорт
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:bg-white/10 hover:text-red-300"
            >
              Удалить
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:bg-white/10 hover:text-white"
            onClick={() => setSelectedIds(new Set())}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
