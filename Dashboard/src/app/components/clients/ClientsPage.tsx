"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import {
  RefreshCw,
  Download,
  Search,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Ban,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Badge } from "@texnomart/ui/badge";
import { Avatar, AvatarFallback } from "@texnomart/ui/avatar";
import { Card } from "@texnomart/ui/card";
import { Checkbox } from "@texnomart/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";
import {
  MOCK_CLIENTS,
  CLIENT_STATUSES,
  getScoringColor,
  type Client,
  type ClientStatus,
} from "@/lib/clients-mock-data";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const PAGE_SIZES = [20, 50, 100] as const;

export function ClientsPage() {
  const navigate = useNavigate();
  const [clients] = React.useState<Client[]>(MOCK_CLIENTS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ClientStatus | "all">("all");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [revealedPhones, setRevealedPhones] = React.useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = React.useState<number>(20);
  const [currentPage, setCurrentPage] = React.useState(1);

  const filteredClients = React.useMemo(() => {
    return clients.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.fullName.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.pinfl.includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [clients, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredClients.length / pageSize);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const activeCount = clients.filter((c) => c.status === "active").length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedClients.map((c) => c.id)));
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

  const togglePhone = (id: string) => {
    const next = new Set(revealedPhones);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRevealedPhones(next);
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(date);

  const formatRelative = (date: Date) =>
    formatDistanceToNow(date, { addSuffix: true, locale: ru });

  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("");

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* PageHeader (Pattern A) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-gray-900">
            Клиенты
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Всего {clients.length.toLocaleString("ru-RU")} · Активных{" "}
            {activeCount.toLocaleString("ru-RU")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск по ФИО, телефону, ПИНФЛ"
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
          <Button variant="outline" size="sm" className="shrink-0">
            <Download className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Экспорт</span>
          </Button>
        </div>
      </div>

      {/* FilterBar (Pattern B) */}
      <div className="flex items-center gap-2 flex-wrap shrink-0 bg-gray-50 rounded-md px-3 py-2">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as ClientStatus | "all");
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[160px] h-8 text-sm bg-white">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="active">Активен</SelectItem>
            <SelectItem value="inactive">Неактивен</SelectItem>
            <SelectItem value="blocked">Заблокирован</SelectItem>
          </SelectContent>
        </Select>
        {statusFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-gray-500"
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
          >
            <X className="h-3 w-3 mr-1" />
            Очистить
          </Button>
        )}
        <div className="ml-auto text-xs text-gray-500">
          Найдено: {filteredClients.length.toLocaleString("ru-RU")}
        </div>
      </div>

      {/* Desktop Table (Pattern C) — hidden below md */}
      <Card className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={
                      paginatedClients.length > 0 &&
                      paginatedClients.every((c) => selectedIds.has(c.id))
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[90px] text-xs font-medium text-gray-500 uppercase">
                  ID
                </TableHead>
                <TableHead className="text-xs font-medium text-gray-500 uppercase">
                  Клиент
                </TableHead>
                <TableHead className="w-[160px] text-xs font-medium text-gray-500 uppercase">
                  Телефон
                </TableHead>
                <TableHead className="w-[100px] text-xs font-medium text-gray-500 uppercase">
                  Скоринг
                </TableHead>
                <TableHead className="w-[90px] text-xs font-medium text-gray-500 uppercase text-right">
                  Заявок
                </TableHead>
                <TableHead className="w-[160px] text-xs font-medium text-gray-500 uppercase text-right">
                  Сумма рассрочек
                </TableHead>
                <TableHead className="w-[110px] text-xs font-medium text-gray-500 uppercase">
                  Регистрация
                </TableHead>
                <TableHead className="w-[130px] text-xs font-medium text-gray-500 uppercase">
                  Активность
                </TableHead>
                <TableHead className="w-[140px] text-xs font-medium text-gray-500 uppercase">
                  Флаги
                </TableHead>
                <TableHead className="w-[56px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((client) => {
                const scoring = getScoringColor(client.scoring);
                return (
                  <TableRow
                    key={client.id}
                    className="h-16 cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(client.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(client.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-600">
                      {client.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="text-xs bg-gray-100">
                            {getInitials(client.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {client.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            ПИНФЛ {client.pinflMasked}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button
                        className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
                        onClick={() => togglePhone(client.id)}
                      >
                        {revealedPhones.has(client.id)
                          ? client.phone
                          : client.phoneMasked}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${scoring.dot}`}
                        />
                        <span
                          className={`text-sm font-semibold tabular-nums ${scoring.text}`}
                        >
                          {client.scoring}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {client.applicationsCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {client.totalInstallmentSum > 0
                        ? `${client.totalInstallmentSum.toLocaleString("ru-RU")} UZS`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(client.registeredAt)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatRelative(client.lastActivityAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {client.isVip && (
                          <Badge className="bg-[#FFD60A] text-black hover:bg-[#FFD60A] text-[10px] px-1.5 py-0">
                            VIP
                          </Badge>
                        )}
                        {client.isBlacklisted && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Чёрный список
                          </Badge>
                        )}
                        {client.status !== "active" && (
                          <Badge
                            className={`${CLIENT_STATUSES[client.status].bg} ${CLIENT_STATUSES[client.status].text} text-[10px] px-1.5 py-0`}
                          >
                            {CLIENT_STATUSES[client.status].label}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Открыть
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Отправить SMS
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Ban className="h-4 w-4 mr-2" />
                            Заблокировать
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Добавить в чёрный список
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
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
              <SelectTrigger className="w-[70px] h-8 text-sm">
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
            {((currentPage - 1) * pageSize + 1).toLocaleString("ru-RU")}–
            {Math.min(currentPage * pageSize, filteredClients.length).toLocaleString("ru-RU")}{" "}
            из {filteredClients.length.toLocaleString("ru-RU")}
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

      {/* Mobile Card List (Pattern K) — visible below md */}
      <div className="flex flex-col gap-2 flex-1 overflow-auto min-h-0 md:hidden">
        {paginatedClients.map((client) => {
          const scoring = getScoringColor(client.scoring);
          return (
            <Card
              key={client.id}
              className="p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="text-xs bg-gray-100">
                    {getInitials(client.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">
                        {client.fullName}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {client.id} · ПИНФЛ {client.pinflMasked}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`h-2 w-2 rounded-full ${scoring.dot}`} />
                      <span className={`text-sm font-semibold tabular-nums ${scoring.text}`}>
                        {client.scoring}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {client.isVip && (
                      <Badge className="bg-[#FFD60A] text-black hover:bg-[#FFD60A] text-[10px] px-1.5 py-0">
                        VIP
                      </Badge>
                    )}
                    {client.isBlacklisted && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        Чёрный список
                      </Badge>
                    )}
                    <span className="text-xs text-gray-400">
                      {formatRelative(client.lastActivityAt)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {/* Mobile pagination */}
        <div className="flex items-center justify-between py-3 shrink-0">
          <span className="text-xs text-gray-500 tabular-nums">
            {((currentPage - 1) * pageSize + 1)}–
            {Math.min(currentPage * pageSize, filteredClients.length)}{" "}
            из {filteredClients.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions (Pattern F) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white rounded-lg shadow-2xl px-6 py-4 flex items-center gap-6">
          <span className="font-medium">Выбрано: {selectedIds.size}</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              Отправить SMS
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
              Заблокировать
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
