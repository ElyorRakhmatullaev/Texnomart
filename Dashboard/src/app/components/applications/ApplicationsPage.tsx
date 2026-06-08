"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { RefreshCw, Download, Plus, MoreHorizontal, Copy } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@texnomart/ui/tabs";
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
  MOCK_APPLICATIONS,
  APPLICATION_STATUSES,
  type Application,
} from "@/lib/applications-mock-data";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { KanbanView } from "./KanbanView";

export function ApplicationsPage() {
  const navigate = useNavigate();
  const [applications] = React.useState<Application[]>(MOCK_APPLICATIONS);
  const [viewMode, setViewMode] = React.useState<"table" | "kanban">("table");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(applications.map((app) => app.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    console.log(`Copied ${id} to clipboard`);
  };

  const handleRowClick = (id: string) => {
    navigate(`/applications/${id}`);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ru });
  };

  return (
    <div className="h-full flex flex-col gap-3 relative overflow-hidden">
      {/* Bulk Actions Toolbar (Pattern F) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white rounded-lg shadow-2xl px-6 py-4 flex items-center gap-6">
          <span className="font-medium">
            Выбрано: {selectedIds.size}
          </span>
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
              Переназначить оператора
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
              className="text-white hover:bg-white/10 hover:text-white text-red-400 hover:text-red-300"
            >
              Удалить
            </Button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-gray-900">Заявки</h1>
          <p className="text-xs text-gray-600 flex items-center gap-2 mt-0.5">
            Найдено {applications.length.toLocaleString("ru-RU")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "kanban")}>
            <TabsList className="h-8">
              <TabsTrigger value="table" className="text-xs h-7">Таблица</TabsTrigger>
              <TabsTrigger value="kanban" className="text-xs h-7">Канбан</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RefreshCw className="size-3.5" />
          </Button>

          <Button size="sm" className="h-8 text-xs">
            <Plus className="size-3.5 mr-1.5" />
            Новая
          </Button>
        </div>
      </div>

      {/* Filter Bar - Compact */}
      <div className="bg-gray-50 rounded p-2 flex items-center gap-2">
        <Badge variant="outline" className="cursor-pointer text-xs h-6">Статус</Badge>
        <Badge variant="outline" className="cursor-pointer text-xs h-6">Партнёр</Badge>
        <Badge variant="outline" className="cursor-pointer text-xs h-6">Филиал</Badge>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="text-xs h-6">
          Очистить
        </Button>
      </div>

      {/* Data Table */}
      {viewMode === "table" && (
        <Card className="flex-1 min-h-0 flex flex-col">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedIds.size === applications.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[110px]">ID</TableHead>
                  <TableHead className="w-[140px]">Создано</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead className="w-[140px]">Сумма</TableHead>
                  <TableHead className="w-[160px]">Партнёр(ы)</TableHead>
                  <TableHead className="w-[140px]">Филиал</TableHead>
                  <TableHead className="w-[130px]">Оператор</TableHead>
                  <TableHead className="w-[160px]">Статус</TableHead>
                  <TableHead className="w-[56px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="h-12 cursor-pointer hover:bg-gray-100"
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
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs bg-gray-200 text-gray-700">
                            {app.client.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{app.client.name}</div>
                          <div className="text-xs text-gray-700">{app.client.phone}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="tabular-nums">
                        <div className="text-sm font-semibold">
                          {app.amount.toLocaleString("ru-RU")}
                        </div>
                        <div className="text-xs text-gray-600">
                          UZS · на {app.term} мес
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {app.partners.slice(0, 3).map((partner) => (
                          <div
                            key={partner.id}
                            className="flex items-center gap-1 text-sm"
                          >
                            <div className="size-4 rounded bg-gray-200 shrink-0" />
                            <span className="truncate">{partner.name}</span>
                          </div>
                        ))}
                        {app.partners.length > 3 && (
                          <span className="text-xs text-gray-600">
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
                          <Avatar className="size-6">
                            <AvatarFallback className="text-xs bg-gray-200">
                              {app.operator.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{app.operator.name}</span>
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
                          <Button variant="ghost" size="sm" className="size-8 p-0">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Открыть</DropdownMenuItem>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <KanbanView
          applications={applications}
          onApplicationClick={handleRowClick}
        />
      )}
    </div>
  );
}
