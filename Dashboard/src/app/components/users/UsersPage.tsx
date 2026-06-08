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
  KeyRound,
  UserX,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Badge } from "@texnomart/ui/badge";
import { Avatar, AvatarFallback } from "@texnomart/ui/avatar";
import { Card } from "@texnomart/ui/card";
import { Checkbox } from "@texnomart/ui/checkbox";
import { Switch } from "@texnomart/ui/switch";
import { Label } from "@texnomart/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@texnomart/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@texnomart/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@texnomart/ui/tooltip";
import {
  MOCK_USERS,
  USER_ROLES,
  USER_STATUSES,
  BRANCHES_LIST,
  type User,
  type UserRole,
  type UserStatus,
} from "@/lib/users-mock-data";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const PAGE_SIZES = [20, 50, 100] as const;

export function UsersPage() {
  const navigate = useNavigate();
  const [users] = React.useState<User[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<UserStatus | "all">("all");
  const [branchFilter, setBranchFilter] = React.useState<string>("all");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = React.useState<number>(20);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [syncExpanded, setSyncExpanded] = React.useState(false);

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (branchFilter !== "all" && (u.branch || "—") !== branchFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter, branchFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const activeCount = users.filter((u) => u.status === "active").length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedUsers.map((u) => u.id)));
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

  const hasActiveFilters = roleFilter !== "all" || statusFilter !== "all" || branchFilter !== "all";

  const clearFilters = () => {
    setRoleFilter("all");
    setStatusFilter("all");
    setBranchFilter("all");
    setCurrentPage(1);
  };

  const formatLastLogin = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 24) {
      return `Сегодня ${date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (hours < 48) {
      return `Вчера ${date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(date);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-gray-900">
            Пользователи
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Всего {users.length} · Активных {activeCount}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9"
            />
          </div>
          <Button variant="ghost" size="icon" className="shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Excel (.xlsx)</DropdownMenuItem>
              <DropdownMenuItem>CSV</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => setInviteOpen(true)} className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90 shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Пригласить пользователя
          </Button>
        </div>
      </div>

      {/* Sync Panel */}
      <Card className="p-4">
        <button
          onClick={() => setSyncExpanded(!syncExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Синхронизация с 1С / брокером / партнёрами</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${syncExpanded ? "rotate-180" : ""}`} />
        </button>
        {syncExpanded && (
          <div className="mt-4 space-y-3">
            {[
              { name: "1С", lastSync: "24.05.2026, 08:00", status: "ok" },
              { name: "Брокер", lastSync: "24.05.2026, 09:15", status: "ok" },
              { name: "Партнёры", lastSync: "23.05.2026, 23:00", status: "warning" },
            ].map((sync) => (
              <div key={sync.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${sync.status === "ok" ? "bg-green-500" : "bg-amber-500"}`} />
                  <span className="text-sm font-medium">{sync.name}</span>
                  <span className="text-xs text-gray-500">Последняя: {sync.lastSync}</span>
                </div>
                <Button variant="outline" size="sm">Запустить</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap bg-gray-50 p-3 rounded-lg">
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v as UserRole | "all"); setCurrentPage(1); }}>
          <SelectTrigger className="w-[150px] h-9 bg-white">
            <SelectValue placeholder="Роль" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            <SelectItem value="superadmin">Superadmin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="operator">Оператор</SelectItem>
            <SelectItem value="agent">Агент</SelectItem>
          </SelectContent>
        </Select>

        <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-[180px] h-9 bg-white">
            <SelectValue placeholder="Филиал" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все филиалы</SelectItem>
            {BRANCHES_LIST.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as UserStatus | "all"); setCurrentPage(1); }}>
          <SelectTrigger className="w-[160px] h-9 bg-white">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="active">Активен</SelectItem>
            <SelectItem value="deactivated">Деактивирован</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 ml-auto">
            <X className="h-3 w-3 mr-1" />
            Сбросить
          </Button>
        )}

        <span className="text-xs text-gray-500 ml-auto">
          Найдено: {filteredUsers.length}
        </span>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={paginatedUsers.length > 0 && selectedIds.size === paginatedUsers.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-700 uppercase">Сотрудник</TableHead>
              <TableHead className="text-xs font-medium text-gray-700 uppercase w-[140px]">Телефон</TableHead>
              <TableHead className="text-xs font-medium text-gray-700 uppercase w-[140px]">Роль</TableHead>
              <TableHead className="text-xs font-medium text-gray-700 uppercase w-[160px]">Филиал</TableHead>
              <TableHead className="text-xs font-medium text-gray-700 uppercase w-[120px]">Статус</TableHead>
              <TableHead className="text-xs font-medium text-gray-700 uppercase w-[160px]">Последний вход</TableHead>
              <TableHead className="text-xs font-medium text-gray-700 uppercase w-[140px]">Создан</TableHead>
              <TableHead className="w-[56px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow
                key={user.id}
                className={`h-16 cursor-pointer hover:bg-gray-50 ${selectedIds.has(user.id) ? "bg-[rgba(255,214,10,0.08)] border-l-2 border-l-[#FFD60A]" : ""}`}
                onClick={() => navigate(`/users/${user.id}`)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(user.id)}
                    onCheckedChange={(checked) => handleSelectOne(user.id, !!checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-gray-200">{user.avatarInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{user.fullName}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{user.phone}</TableCell>
                <TableCell>
                  <Badge className={`${USER_ROLES[user.role].bg} ${USER_ROLES[user.role].text} border-0`}>
                    {USER_ROLES[user.role].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-700">{user.branch || "—"}</TableCell>
                <TableCell>
                  <Badge className={`${USER_STATUSES[user.status].bg} ${USER_STATUSES[user.status].text} border-0`}>
                    {USER_STATUSES[user.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm">{formatLastLogin(user.lastLogin)}</span>
                    </TooltipTrigger>
                    <TooltipContent>IP: {user.lastLoginIp}</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="text-sm text-gray-500">{formatDate(user.createdAt)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/users/${user.id}`)}>
                        <Eye className="h-4 w-4 mr-2" /> Открыть
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <KeyRound className="h-4 w-4 mr-2" /> Сбросить пароль
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-amber-600">
                        <UserX className="h-4 w-4 mr-2" /> Деактивировать
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" /> Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Показывать</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">строк</span>
          </div>
          <span className="text-sm text-gray-600">
            {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredUsers.length)} из {filteredUsers.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {paginatedUsers.map((user) => (
          <Card
            key={user.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/users/${user.id}`)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm bg-gray-200">{user.avatarInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{user.fullName}</span>
                </div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={`${USER_ROLES[user.role].bg} ${USER_ROLES[user.role].text} border-0 text-[10px]`}>
                  {USER_ROLES[user.role].label}
                </Badge>
                <Badge className={`${USER_STATUSES[user.status].bg} ${USER_STATUSES[user.status].text} border-0 text-[10px]`}>
                  {USER_STATUSES[user.status].label}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Users className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Ничего не найдено</h3>
          <p className="text-sm text-gray-500 mt-1">Попробуйте изменить параметры поиска</p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
              Сбросить фильтры
            </Button>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-lg px-6 py-3 flex items-center gap-4 shadow-xl">
          <span className="text-sm">Выбрано: {selectedIds.size}</span>
          <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/10">
            Деактивировать
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/10">
            Экспорт
          </Button>
          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-white/10">
            Удалить
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:text-white hover:bg-white/10" onClick={() => setSelectedIds(new Set())}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Invite Modal */}
      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}

function InviteUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [inviteTab, setInviteTab] = React.useState("email");
  const [role, setRole] = React.useState<string>("");
  const [branch, setBranch] = React.useState<string>("");
  const [sendInstructions, setSendInstructions] = React.useState(true);

  const showBranch = role === "operator" || role === "agent";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Пригласить пользователя</DialogTitle>
          <DialogDescription>
            Добавьте нового пользователя в систему
          </DialogDescription>
        </DialogHeader>

        <Tabs value={inviteTab} onValueChange={setInviteTab}>
          <TabsList className="w-full">
            <TabsTrigger value="email" className="flex-1">Пригласить по email</TabsTrigger>
            <TabsTrigger value="password" className="flex-1">Создать с паролем</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>ФИО</Label>
              <Input placeholder="Фамилия Имя Отчество" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="user@texnomart.uz" />
            </div>
            <div className="space-y-2">
              <Label>Телефон</Label>
              <Input placeholder="+998 XX XXX-XX-XX" />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operator">Оператор</SelectItem>
                  <SelectItem value="agent">Агент</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {showBranch && (
              <div className="space-y-2">
                <Label>Филиал</Label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите филиал" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES_LIST.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="send-instructions"
                checked={sendInstructions}
                onCheckedChange={(v) => setSendInstructions(!!v)}
              />
              <Label htmlFor="send-instructions" className="text-sm">
                Отправить инструкцию по входу
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="password" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>ФИО</Label>
              <Input placeholder="Фамилия Имя Отчество" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="user@texnomart.uz" />
            </div>
            <div className="space-y-2">
              <Label>Телефон</Label>
              <Input placeholder="+998 XX XXX-XX-XX" />
            </div>
            <div className="space-y-2">
              <Label>Временный пароль</Label>
              <Input type="text" placeholder="Минимум 8 символов" />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operator">Оператор</SelectItem>
                  <SelectItem value="agent">Агент</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {showBranch && (
              <div className="space-y-2">
                <Label>Филиал</Label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите филиал" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCHES_LIST.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90">
            {inviteTab === "email" ? "Пригласить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
