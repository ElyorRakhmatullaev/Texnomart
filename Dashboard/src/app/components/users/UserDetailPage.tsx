"use client";

import * as React from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  MoreHorizontal,
  KeyRound,
  ShieldOff,
  UserX,
  Trash2,
  Monitor,
  Smartphone,
  Globe,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
import { Avatar, AvatarFallback } from "@texnomart/ui/avatar";
import { Card } from "@texnomart/ui/card";
import { Switch } from "@texnomart/ui/switch";
import { Label } from "@texnomart/ui/label";
import { Input } from "@texnomart/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@texnomart/ui/tabs";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@texnomart/ui/table";
import {
  MOCK_USERS,
  USER_ROLES,
  USER_STATUSES,
  BRANCHES_LIST,
  type User,
} from "@/lib/users-mock-data";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = MOCK_USERS.find((u) => u.id === id);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-semibold text-gray-900">Пользователь не найден</h2>
        <p className="text-gray-500 mt-2">Пользователь с ID {id} не существует</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/users")}>
          Вернуться к списку
        </Button>
      </div>
    );
  }

  const showStats = user.role === "operator" || user.role === "agent";

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link to="/users" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Назад к пользователям
      </Link>

      {/* Hero Band */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-gray-200">{user.avatarInitials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold lg:text-2xl">{user.fullName}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={`${USER_ROLES[user.role].bg} ${USER_ROLES[user.role].text} border-0`}>
                  {USER_ROLES[user.role].label}
                </Badge>
                <Badge className={`${USER_STATUSES[user.status].bg} ${USER_STATUSES[user.status].text} border-0`}>
                  {USER_STATUSES[user.status].label}
                </Badge>
                {user.branch && (
                  <Badge variant="outline" className="text-gray-600">{user.branch}</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Switch checked={user.status === "active"} />
              <Label className="text-sm">{user.status === "active" ? "Активен" : "Деактивирован"}</Label>
            </div>
            <Button variant="outline" size="sm">
              <KeyRound className="h-4 w-4 mr-2" />
              Сбросить пароль
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-amber-600">
                  <UserX className="h-4 w-4 mr-2" /> Деактивировать
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ShieldOff className="h-4 w-4 mr-2" /> Сбросить 2FA
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" /> Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-12 w-full justify-start overflow-x-auto">
          <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent px-4">
            Информация
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent px-4">
            Безопасность
          </TabsTrigger>
          <TabsTrigger value="sessions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent px-4">
            Сессии
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent px-4">
            Активность
          </TabsTrigger>
          {showStats && (
            <TabsTrigger value="stats" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent px-4">
              Статистика
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab 1 — Информация */}
        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-base font-semibold mb-4">Личные данные</h3>
              <div className="space-y-4">
                <InfoRow label="ФИО" value={user.fullName} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Телефон" value={user.phone} />
                <InfoRow label="Дата создания" value={formatDate(user.createdAt)} />
                <InfoRow label="Кем создан" value={user.createdBy} />
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-base font-semibold mb-4">Роль и доступ</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-500">Роль</Label>
                  <Select defaultValue={user.role}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="operator">Оператор</SelectItem>
                      <SelectItem value="agent">Агент</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(user.role === "operator" || user.role === "agent") && (
                  <div>
                    <Label className="text-sm text-gray-500">Филиал</Label>
                    <Select defaultValue={user.branch || ""}>
                      <SelectTrigger className="mt-1">
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
                <div>
                  <Label className="text-sm text-gray-500">Дополнительные разрешения</Label>
                  <p className="text-sm mt-1 text-gray-700">Стандартные для роли</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2 — Безопасность */}
        <TabsContent value="security" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-base font-semibold mb-4">Аутентификация</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Двухфакторная аутентификация</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {user.twoFactorEnabled ? "Включена" : "Не настроена"}
                    </p>
                  </div>
                  <Switch checked={user.twoFactorEnabled} />
                </div>
                <div className="pt-2 border-t">
                  <InfoRow label="Пароль изменён" value={formatDate(user.lastPasswordChange)} />
                </div>
                <div className="pt-2 border-t">
                  <InfoRow
                    label="Неудачных попыток входа"
                    value={String(user.failedLoginAttempts)}
                    valueClass={user.failedLoginAttempts >= 3 ? "text-red-600 font-medium" : ""}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm">
                    <ShieldOff className="h-4 w-4 mr-2" /> Сбросить 2FA
                  </Button>
                  <Button variant="outline" size="sm">
                    <KeyRound className="h-4 w-4 mr-2" /> Сбросить пароль
                  </Button>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-base font-semibold mb-4">Политики безопасности</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Минимум 8 символов</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Смена пароля каждые 90 дней</span>
                </div>
                <div className="flex items-center gap-2">
                  {user.twoFactorEnabled ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">2FA обязательна для {user.role === "superadmin" || user.role === "admin" ? "администраторов" : "всех пользователей"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Блокировка после 5 неудачных попыток</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3 — Сессии */}
        <TabsContent value="sessions" className="mt-6 space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-semibold mb-4">Активные сессии</h3>
            {user.sessions.length === 0 ? (
              <p className="text-sm text-gray-500">Нет активных сессий</p>
            ) : (
              <div className="space-y-3">
                {user.sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {session.device.toLowerCase().includes("android") || session.device.toLowerCase().includes("iphone") ? (
                        <Smartphone className="h-5 w-5 text-gray-500" />
                      ) : (
                        <Monitor className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium">
                          {session.device} · {session.browser}
                          {session.isCurrent && (
                            <Badge className="ml-2 bg-green-100 text-green-700 border-0 text-[10px]">Текущая</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <Globe className="h-3 w-3" />
                          {session.ip} · {session.location} · {formatDateTime(session.loginTime)}
                        </div>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        Завершить
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-base font-semibold mb-4">История входов (последние 20)</h3>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs font-medium text-gray-700 uppercase">Дата/время</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 uppercase">IP</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 uppercase">Локация</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 uppercase">Устройство</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 uppercase">Результат</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.loginHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">{formatDateTime(entry.date)}</TableCell>
                      <TableCell className="text-sm font-mono">{entry.ip}</TableCell>
                      <TableCell className="text-sm">{entry.location}</TableCell>
                      <TableCell className="text-sm">{entry.device}</TableCell>
                      <TableCell>
                        <LoginResultBadge result={entry.result} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {user.loginHistory.map((entry) => (
                <div key={entry.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{entry.device}</div>
                    <div className="text-xs text-gray-500">{formatDateTime(entry.date)}</div>
                  </div>
                  <LoginResultBadge result={entry.result} />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 4 — Активность */}
        <TabsContent value="activity" className="mt-6">
          <Card className="p-6">
            <h3 className="text-base font-semibold mb-4">Последние действия</h3>
            <div className="relative pl-6">
              {user.activity.map((entry, idx) => (
                <div key={entry.id} className="relative pb-6 last:pb-0">
                  {idx < user.activity.length - 1 && (
                    <div className="absolute left-[-16px] top-6 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  <div className="absolute left-[-22px] top-1 h-3 w-3 rounded-full bg-[#FFD60A] border-2 border-white shadow-sm" />
                  <div>
                    <div className="text-sm font-medium">{entry.action}</div>
                    <div className="text-sm text-gray-600">{entry.target}</div>
                    {entry.details && (
                      <div className="text-xs text-gray-500 mt-0.5">{entry.details}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">{formatDateTime(entry.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t">
              <Link to="/audit" className="text-sm text-blue-600 hover:underline">
                Открыть полный аудит →
              </Link>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 5 — Статистика (only for Operator/Agent) */}
        {showStats && user.stats && (
          <TabsContent value="stats" className="mt-6 space-y-6">
            {/* KPI Tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiTile label="Обработано заявок" value={String(user.stats.processedApplications)} />
              <KpiTile label="Конверсия" value={`${user.stats.conversionRate}%`} />
              <KpiTile label="Среднее время (мин)" value={String(user.stats.avgResponseTime)} />
              <KpiTile label="Активные клиенты" value={String(user.stats.activeClients)} />
            </div>

            {/* Daily Applications Chart */}
            <Card className="p-6">
              <h3 className="text-base font-semibold mb-4">Обработанные заявки по дням</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={user.stats.dailyApplications}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#FFD60A"
                      strokeWidth={2}
                      dot={{ fill: "#FFD60A", r: 4 }}
                      name="Заявки"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Monthly Conversion Chart */}
            <Card className="p-6">
              <h3 className="text-base font-semibold mb-4">Конверсия по месяцам</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={user.stats.monthlyConversion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip formatter={(value: number) => [`${value}%`, "Конверсия"]} />
                    <Bar dataKey="rate" fill="#FFD60A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Sticky Action Bar */}
      <div className="sticky bottom-[-0.75rem] md:bottom-[-1rem] z-10 -mx-3 -mb-3 md:-mx-4 md:-mb-4 bg-white border-t border-gray-200 px-3 md:px-6 py-3">
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px] sm:min-h-0">
            <Trash2 className="h-4 w-4 mr-2" />
            Удалить пользователя
          </Button>
          <Button size="sm" className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90 min-h-[44px] sm:min-h-0" disabled>
            Сохранить изменения
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-1 tabular-nums">{value}</div>
    </Card>
  );
}

function LoginResultBadge({ result }: { result: "success" | "error" | "blocked" }) {
  if (result === "success") {
    return (
      <Badge className="bg-green-100 text-green-700 border-0">
        <CheckCircle2 className="h-3 w-3 mr-1" /> Успех
      </Badge>
    );
  }
  if (result === "error") {
    return (
      <Badge className="bg-red-100 text-red-700 border-0">
        <XCircle className="h-3 w-3 mr-1" /> Ошибка
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 border-0">
      <Ban className="h-3 w-3 mr-1" /> Блокировка
    </Badge>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
