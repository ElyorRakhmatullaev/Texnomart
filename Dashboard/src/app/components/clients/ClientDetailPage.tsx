"use client";

import * as React from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Ban,
  AlertTriangle,
  Trash2,
  KeyRound,
  Download,
  Eye,
  Upload,
  CreditCard,
  ShieldCheck,
  ShieldX,
  Send,
  LogIn,
  FileText,
  UserCog,
  HelpCircle,
  X,
  Plus,
} from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
import { Avatar, AvatarFallback } from "@texnomart/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@texnomart/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@texnomart/ui/tabs";
import { Progress } from "@texnomart/ui/progress";
import { Switch } from "@texnomart/ui/switch";
import { Textarea } from "@texnomart/ui/textarea";
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
  MOCK_CLIENTS,
  CLIENT_STATUSES,
  getScoringColor,
  AVAILABLE_TAGS,
  type Client,
  type ActivityEntry,
} from "@/lib/clients-mock-data";
import { format, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const ACTIVITY_ICONS: Record<ActivityEntry["type"], React.ReactNode> = {
  login: <LogIn className="h-4 w-4" />,
  application: <FileText className="h-4 w-4" />,
  support: <HelpCircle className="h-4 w-4" />,
  profile: <UserCog className="h-4 w-4" />,
};

const ACTIVITY_COLORS: Record<ActivityEntry["type"], string> = {
  login: "bg-blue-100 text-blue-600",
  application: "bg-green-100 text-green-600",
  support: "bg-orange-100 text-orange-600",
  profile: "bg-purple-100 text-purple-600",
};

const ACTIVITY_FILTERS = [
  { value: "all", label: "Все" },
  { value: "login", label: "Входы" },
  { value: "application", label: "Заявки" },
  { value: "support", label: "Поддержка" },
  { value: "profile", label: "Профиль" },
] as const;

const CARD_LOGOS: Record<string, string> = {
  uzcard: "UzCard",
  humo: "Humo",
  visa: "Visa",
  mastercard: "MC",
};

const PAYMENT_STATUSES: Record<string, { label: string; bg: string; text: string }> = {
  paid: { label: "Оплачен", bg: "bg-green-100", text: "text-green-700" },
  pending: { label: "Ожидает", bg: "bg-yellow-100", text: "text-yellow-700" },
  overdue: { label: "Просрочен", bg: "bg-red-100", text: "text-red-700" },
};

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = MOCK_CLIENTS.find((c) => c.id === id);

  const [activityFilter, setActivityFilter] = React.useState<string>("all");
  const [commentText, setCommentText] = React.useState("");
  const [isInternal, setIsInternal] = React.useState(false);
  const [clientTags, setClientTags] = React.useState<string[]>(client?.tags ?? []);

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">Клиент не найден</h2>
          <p className="text-gray-600">Клиент с ID {id} не существует</p>
          <Button variant="outline" onClick={() => navigate("/clients")}>
            Вернуться к списку
          </Button>
        </div>
      </div>
    );
  }

  const scoring = getScoringColor(client.scoring);

  const filteredActivity =
    activityFilter === "all"
      ? client.activity
      : client.activity.filter((a) => a.type === activityFilter);

  const addTag = (tag: string) => {
    if (!clientTags.includes(tag)) setClientTags([...clientTags, tag]);
  };

  const removeTag = (tag: string) => {
    setClientTags(clientTags.filter((t) => t !== tag));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto min-h-0">
        <div className="space-y-6 pb-6">
          {/* Back nav */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 -ml-2"
            onClick={() => navigate("/clients")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Клиенты
          </Button>

          {/* Hero band */}
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Left: Avatar + info */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <Avatar className="h-20 w-20 shrink-0">
                  <AvatarFallback className="text-xl bg-gray-100 font-semibold">
                    {client.fullName
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-semibold truncate">
                    {client.fullName}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                    <span>ПИНФЛ {client.pinfl}</span>
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge
                      className={`${CLIENT_STATUSES[client.status].bg} ${CLIENT_STATUSES[client.status].text}`}
                    >
                      {CLIENT_STATUSES[client.status].label}
                    </Badge>
                    {client.isVip && (
                      <Badge className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]">
                        VIP
                      </Badge>
                    )}
                    {client.isBlacklisted && (
                      <Badge variant="destructive">Чёрный список</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-1.5" />
                      Связаться
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Phone className="h-4 w-4 mr-2" />
                      Позвонить
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      SMS
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Send className="h-4 w-4 mr-2" />
                      Telegram
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="sm">
                  <KeyRound className="h-4 w-4 mr-1.5" />
                  Сбросить пароль
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-red-600">
                      <Ban className="h-4 w-4 mr-2" />
                      Заблокировать
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Добавить в чёрный список
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div>
                <div className="text-sm text-gray-500">Скоринг</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-2xl font-bold tabular-nums ${scoring.text}`}>
                    {client.scoring}
                  </span>
                  <span className="text-xs text-gray-400">/ 1000</span>
                </div>
                <Progress
                  value={client.scoring / 10}
                  className="h-1.5 mt-2"
                />
              </div>
              <div>
                <div className="text-sm text-gray-500">Активных рассрочек</div>
                <div className="text-2xl font-bold mt-1 tabular-nums">
                  {client.activeInstallments}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Всего заявок</div>
                <div className="text-2xl font-bold mt-1 tabular-nums">
                  {client.applicationsCount}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">LTV</div>
                <div className="text-2xl font-bold mt-1 tabular-nums">
                  {client.ltv > 0
                    ? `${(client.ltv / 1_000_000).toFixed(1)} млн`
                    : "—"}
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs (Pattern J underline) */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-12 w-full justify-start overflow-x-auto">
              <TabsTrigger
                value="profile"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
              >
                Профиль
              </TabsTrigger>
              <TabsTrigger
                value="finance"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
              >
                Финансы
              </TabsTrigger>
              <TabsTrigger
                value="applications"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
              >
                Заявки
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {client.applicationsCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
              >
                Активность
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
              >
                Комментарии и теги
              </TabsTrigger>
            </TabsList>

            {/* Tab 1 — Profile */}
            <TabsContent value="profile" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Персональные данные</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow label="ФИО" value={client.fullName} />
                    <InfoRow
                      label="Дата рождения"
                      value={format(client.birthDate, "dd.MM.yyyy", { locale: ru })}
                    />
                    <InfoRow
                      label="Пол"
                      value={client.gender === "male" ? "Мужской" : "Женский"}
                    />
                    <InfoRow label="ПИНФЛ" value={client.pinfl} />
                    <InfoRow
                      label="Паспорт"
                      value={`${client.passportSeries} ${client.passportNumber}`}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Контакты</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow label="Телефон основной" value={client.phone} />
                    <InfoRow
                      label="Телефон дополн."
                      value={client.phoneAdditional ?? "—"}
                    />
                    <InfoRow label="Email" value={client.email ?? "—"} />
                    <InfoRow label="Адрес" value={client.address} />
                    <InfoRow label="Регион" value={client.region} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-base">Документы</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {["Паспорт", "Разворот", "Селфи", "ИНН"].map((doc) => (
                        <div
                          key={doc}
                          className="group relative aspect-[3/4] rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden"
                        >
                          <span className="text-xs text-gray-400">{doc}</span>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gray-400 transition-colors">
                        <Upload className="h-5 w-5 text-gray-400" />
                        <span className="text-xs text-gray-400">Загрузить</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Дополнительно</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow label="Семейное положение" value={client.maritalStatus} />
                    <InfoRow label="Иждивенцы" value={String(client.dependents)} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 2 — Finance */}
            <TabsContent value="finance" className="mt-6">
              <div className="space-y-6">
                {/* Cards */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Привязанные карты
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {client.cards.length === 0 ? (
                      <p className="text-sm text-gray-400">Нет привязанных карт</p>
                    ) : (
                      <div className="space-y-3">
                        {client.cards.map((card) => (
                          <div
                            key={card.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                          >
                            <div className="h-8 w-12 rounded bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-500">
                              {CARD_LOGOS[card.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium tabular-nums">
                                {card.masked}
                              </div>
                              <div className="text-xs text-gray-500">{card.bank}</div>
                            </div>
                            {card.verified ? (
                              <Badge className="bg-green-100 text-green-700 gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                Проверена
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-500 gap-1">
                                <ShieldX className="h-3 w-3" />
                                Не проверена
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Active installments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Активные рассрочки</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {client.installments.length === 0 ? (
                      <p className="text-sm text-gray-400">Нет активных рассрочек</p>
                    ) : (
                      <div className="space-y-3">
                        {client.installments.map((inst) => (
                          <div
                            key={inst.id}
                            className="flex items-center gap-4 p-3 rounded-lg bg-gray-50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{inst.partnerName}</div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                Остаток:{" "}
                                {inst.remainingAmount.toLocaleString("ru-RU")} UZS · до{" "}
                                {format(inst.dueDate, "dd.MM.yyyy")}
                              </div>
                            </div>
                            <div className="w-24 shrink-0">
                              <Progress
                                value={(inst.monthsPaid / inst.totalMonths) * 100}
                                className="h-1.5"
                              />
                              <div className="text-[10px] text-gray-400 mt-1 text-center tabular-nums">
                                {inst.monthsPaid}/{inst.totalMonths} мес
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment history */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">История платежей</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {client.payments.length === 0 ? (
                      <p className="text-sm text-gray-400">Нет платежей</p>
                    ) : (
                      <>
                        {/* Desktop table */}
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead className="text-xs font-medium text-gray-500 uppercase">
                                  Дата
                                </TableHead>
                                <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">
                                  Сумма
                                </TableHead>
                                <TableHead className="text-xs font-medium text-gray-500 uppercase">
                                  Рассрочка
                                </TableHead>
                                <TableHead className="text-xs font-medium text-gray-500 uppercase">
                                  Статус
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {client.payments.slice(0, 10).map((p) => {
                                const st = PAYMENT_STATUSES[p.status];
                                return (
                                  <TableRow key={p.id}>
                                    <TableCell className="text-sm">
                                      {format(p.date, "dd.MM.yyyy")}
                                    </TableCell>
                                    <TableCell className="text-sm text-right tabular-nums">
                                      {p.amount.toLocaleString("ru-RU")} UZS
                                    </TableCell>
                                    <TableCell className="text-sm font-mono text-gray-500">
                                      {p.installmentId}
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={`${st.bg} ${st.text}`}>
                                        {st.label}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                        {/* Mobile cards */}
                        <div className="md:hidden space-y-2">
                          {client.payments.slice(0, 10).map((p) => {
                            const st = PAYMENT_STATUSES[p.status];
                            return (
                              <div
                                key={p.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                              >
                                <div>
                                  <div className="text-sm font-medium tabular-nums">
                                    {p.amount.toLocaleString("ru-RU")} UZS
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {format(p.date, "dd.MM.yyyy")}
                                  </div>
                                </div>
                                <Badge className={`${st.bg} ${st.text}`}>
                                  {st.label}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Credit score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Кредитный рейтинг</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div>
                        <div className={`text-5xl font-bold tabular-nums ${scoring.text}`}>
                          {client.scoring}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">из 1 000</div>
                      </div>
                      <div className="flex-1">
                        <Progress value={client.scoring / 10} className="h-3" />
                        <div className="flex justify-between mt-2 text-xs text-gray-400">
                          <span>0</span>
                          <span>500</span>
                          <span>1000</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1.5 text-sm text-gray-600">
                      <div>
                        • Кредитная история:{" "}
                        {client.scoring > 700 ? "Отличная" : client.scoring > 500 ? "Хорошая" : "Низкая"}
                      </div>
                      <div>
                        • Активные просрочки:{" "}
                        {client.payments.filter((p) => p.status === "overdue").length}
                      </div>
                      <div>• Общая задолженность: {client.totalInstallmentSum.toLocaleString("ru-RU")} UZS</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 3 — Applications */}
            <TabsContent value="applications" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Заявки клиента ({client.applicationsCount})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {client.applicationsCount === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto text-gray-300" />
                        <p className="text-gray-500 mt-2">Нет заявок</p>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        <p>
                          Для просмотра всех заявок клиента перейдите в{" "}
                          <Link
                            to="/applications"
                            className="text-blue-600 hover:underline"
                          >
                            раздел Заявки
                          </Link>{" "}
                          с фильтром по данному клиенту.
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="p-4 rounded-lg bg-gray-50 text-center">
                            <div className="text-2xl font-bold text-gray-900 tabular-nums">
                              {client.applicationsCount}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Всего заявок</div>
                          </div>
                          <div className="p-4 rounded-lg bg-gray-50 text-center">
                            <div className="text-2xl font-bold text-green-600 tabular-nums">
                              {Math.round(client.applicationsCount * 0.6)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Одобрено</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab 4 — Activity */}
            <TabsContent value="activity" className="mt-6">
              <div className="space-y-4">
                {/* Filter tabs */}
                <div className="flex items-center gap-1 flex-wrap">
                  {ACTIVITY_FILTERS.map((f) => (
                    <Button
                      key={f.value}
                      variant={activityFilter === f.value ? "default" : "ghost"}
                      size="sm"
                      className={
                        activityFilter === f.value
                          ? "bg-[#FFD60A] text-black hover:bg-[#f0ca00]"
                          : ""
                      }
                      onClick={() => setActivityFilter(f.value)}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>

                {/* Timeline (Pattern J) */}
                <div className="relative pl-8">
                  <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gray-200" />
                  {filteredActivity.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4">Нет записей</p>
                  ) : (
                    filteredActivity.map((entry, i) => (
                      <div key={entry.id} className="relative pb-6 last:pb-0">
                        <div
                          className={`absolute left-[-17px] top-1 flex items-center justify-center h-6 w-6 rounded-full ${ACTIVITY_COLORS[entry.type]}`}
                        >
                          {ACTIVITY_ICONS[entry.type]}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{entry.description}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {format(entry.timestamp, "dd.MM.yyyy HH:mm", { locale: ru })}
                            {" · "}
                            {formatDistanceToNow(entry.timestamp, {
                              addSuffix: true,
                              locale: ru,
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab 5 — Comments & Tags */}
            <TabsContent value="comments" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Comments */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-base font-semibold">Комментарии</h3>
                  <div className="space-y-3">
                    {client.comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-[10px] bg-gray-100">
                            {c.author
                              .split(" ")
                              .map((w) => w[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{c.author}</span>
                              <span className="text-xs text-gray-400">{c.authorRole}</span>
                              {c.isInternal && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  Внутренний
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">{c.text}</p>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1 px-1">
                            {format(c.createdAt, "dd.MM.yyyy HH:mm", { locale: ru })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Compose */}
                  <div className="border rounded-lg p-3 space-y-3">
                    <Textarea
                      placeholder="Написать комментарий..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isInternal}
                          onCheckedChange={setIsInternal}
                          id="internal-comment"
                        />
                        <label
                          htmlFor="internal-comment"
                          className="text-sm text-gray-500 cursor-pointer"
                        >
                          Внутренний
                        </label>
                      </div>
                      <Button
                        size="sm"
                        disabled={!commentText.trim()}
                        className="bg-[#FFD60A] text-black hover:bg-[#f0ca00]"
                      >
                        Отправить
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold">Теги</h3>
                  <div className="flex flex-wrap gap-2">
                    {clientTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-0.5 rounded-full hover:bg-gray-300/50 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {clientTags.length === 0 && (
                      <span className="text-sm text-gray-400">Нет тегов</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Предложенные</div>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_TAGS.filter((t) => !clientTags.includes(t)).map(
                        (tag) => (
                          <button
                            key={tag}
                            onClick={() => addTag(tag)}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            {tag}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right">{value}</span>
    </div>
  );
}
