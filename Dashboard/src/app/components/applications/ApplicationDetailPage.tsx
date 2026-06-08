"use client";

import * as React from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Download,
  Eye,
  Upload,
  FileText,
  Copy,
  UserPlus,
  FileDown,
  Send,
  Link2,
} from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
import { Avatar, AvatarFallback } from "@texnomart/ui/avatar";
import { Progress } from "@texnomart/ui/progress";
import { Card, CardContent } from "@texnomart/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@texnomart/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@texnomart/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@texnomart/ui/dropdown-menu";
import { Textarea } from "@texnomart/ui/textarea";
import { Switch } from "@texnomart/ui/switch";
import {
  MOCK_APPLICATIONS,
  APPLICATION_STATUSES,
} from "@/lib/applications-mock-data";

const MOCK_PARTNER_DECISIONS = [
  {
    partner: "Alif Nasiya",
    sentAt: "14:32:15",
    respondedAt: "14:33:08",
    decision: "approved" as const,
    amount: 4200000,
    reason: null,
  },
  {
    partner: "Anorbank",
    sentAt: "14:32:15",
    respondedAt: "14:34:22",
    decision: "rejected" as const,
    amount: null,
    reason: "Низкий кредитный скоринг",
  },
  {
    partner: "Uzum Nasiya",
    sentAt: "14:32:15",
    respondedAt: null,
    decision: "pending" as const,
    amount: null,
    reason: null,
  },
];

const MOCK_BANK_CARDS = [
  {
    type: "Visa",
    masked: "**** **** **** 4521",
    bank: "Kapitalbank",
    verified: true,
  },
  {
    type: "Mastercard",
    masked: "**** **** **** 8734",
    bank: "NBU",
    verified: false,
  },
];

const MOCK_TIMELINE = [
  { status: "completed" as const, title: "Подача заявки", time: "14:32", duration: null, note: null },
  { status: "completed" as const, title: "Скоринг отправлен", time: "14:33", duration: "1 сек", note: null },
  { status: "completed" as const, title: "Получен ответ Alif Nasiya", time: "14:34", duration: "53 сек", note: "Одобрено" },
  { status: "in-progress" as const, title: "Подписание договора", time: "в процессе", duration: null, note: null },
  { status: "pending" as const, title: "Завершение", time: "ожидается", duration: null, note: null },
];

const MOCK_COMMENTS = [
  {
    id: 1,
    author: "Алина П.",
    avatar: "АП",
    time: "15.05.2026 14:45",
    text: "Клиент предоставил все необходимые документы. Скоринг положительный, рекомендую одобрение.",
    internal: true,
  },
  {
    id: 2,
    author: "Бекзод К.",
    avatar: "БК",
    time: "15.05.2026 15:10",
    text: "Подтверждаю, документы проверены. Отправлено на подписание.",
    internal: true,
  },
  {
    id: 3,
    author: "Алина П.",
    avatar: "АП",
    time: "15.05.2026 15:32",
    text: "Клиент подписал договор в отделении.",
    internal: false,
  },
];

const MOCK_HISTORY = [
  { time: "15.05.2026 14:32", user: "Система", action: "Заявка создана через мобильное приложение" },
  { time: "15.05.2026 14:32", user: "Система", action: "Запрос отправлен партнёрам: Alif Nasiya, Anorbank, Uzum Nasiya" },
  { time: "15.05.2026 14:33", user: "Система", action: "Получен ответ: Alif Nasiya — Одобрено" },
  { time: "15.05.2026 14:34", user: "Система", action: "Получен ответ: Anorbank — Отклонено" },
  { time: "15.05.2026 14:35", user: "Алина П.", action: "Назначена оператором" },
  { time: "15.05.2026 14:45", user: "Алина П.", action: "Изменила статус: На скоринге → Одобрена" },
  { time: "15.05.2026 15:10", user: "Бекзод К.", action: "Добавил комментарий" },
  { time: "15.05.2026 15:32", user: "Алина П.", action: "Изменила статус: Одобрена → Подписан договор" },
];

const MOCK_DOCUMENTS = [
  "Паспорт (лицевая)",
  "Паспорт (разворот)",
  "Селфи с паспортом",
  "ИНН",
];

export function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [commentText, setCommentText] = React.useState("");
  const [isInternal, setIsInternal] = React.useState(true);

  const application = MOCK_APPLICATIONS.find((app) => app.id === id);

  if (!application) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">
            Заявка не найдена
          </h2>
          <Button onClick={() => navigate("/applications")} size="sm">
            Вернуться к списку
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  const channelLabels: Record<string, string> = {
    online: "Онлайн",
    app: "Мобильное приложение",
    telegram: "Telegram",
    branch: "Филиал",
  };

  const scoringPercent = (application.client.scoring / 1000) * 100;

  const initials = application.client.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto min-h-0">
      <div className="space-y-6 pb-8 px-4 md:px-6">
        {/* Back Navigation */}
        <button
          onClick={() => navigate("/applications")}
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors pt-2 min-h-[44px]"
        >
          <ArrowLeft className="size-4" />
          Назад к заявкам
        </button>

        {/* Hero Band */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Заявка {application.id}
                  </h1>
                  <Badge
                    className={`${APPLICATION_STATUSES[application.status].bg} ${APPLICATION_STATUSES[application.status].text} border-0 px-2 py-0.5 text-xs font-medium rounded-full`}
                  >
                    {APPLICATION_STATUSES[application.status].label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Создана {formatDate(application.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Одобрить
                </Button>
                <Button size="sm" variant="destructive">
                  Отклонить
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <UserPlus className="size-4" />
                      Переназначить
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="size-4" />
                      Запросить документы
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link2 className="size-4" />
                      Скопировать ссылку
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="summary">
          <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-12 w-full justify-start gap-0">
            {[
              { value: "summary", label: "Сводка" },
              { value: "client", label: "Клиент" },
              { value: "timeline", label: "Этапы" },
              { value: "partners", label: "Партнёры" },
              { value: "documents", label: "Документы" },
              { value: "comments", label: "Комментарии" },
              { value: "history", label: "История" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:shadow-none text-gray-500 hover:text-gray-700 px-4 h-12 text-sm font-medium min-w-fit"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab 1 — Сводка */}
          <TabsContent value="summary" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
                    Основные данные
                  </h3>
                  <div className="space-y-3">
                    <InfoRow
                      label="Сумма"
                      value={`${application.amount.toLocaleString("ru-RU")} UZS`}
                      bold
                    />
                    <InfoRow
                      label="Срок"
                      value={`${application.term} месяцев`}
                    />
                    <InfoRow
                      label="Создана"
                      value={formatDate(application.createdAt)}
                    />
                    <InfoRow
                      label="Канал"
                      value={channelLabels[application.channel]}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
                    Назначение
                  </h3>
                  <div className="space-y-3">
                    <InfoRow
                      label="Филиал"
                      value={`${application.branch.name}, Ташкент`}
                    />
                    <InfoRow
                      label="Оператор"
                      value={
                        application.operator ? (
                          <span className="inline-flex items-center gap-2">
                            <Avatar className="size-5">
                              <AvatarFallback className="text-[10px] bg-gray-200">
                                {application.operator.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {application.operator.name}
                          </span>
                        ) : (
                          "Не назначен"
                        )
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bank Cards */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
                  Банковские карты
                </h3>
                <div className="space-y-3">
                  {MOCK_BANK_CARDS.map((card, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-[10px] font-bold text-gray-600">
                            {card.type === "Visa" ? "VISA" : "MC"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium tabular-nums">
                            {card.masked}
                          </p>
                          <p className="text-xs text-gray-500">{card.bank}</p>
                        </div>
                      </div>
                      <Badge
                        className={`border-0 text-xs rounded-full px-2 py-0.5 ${card.verified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {card.verified ? "Проверена" : "Отклонена"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2 — Клиент */}
          <TabsContent value="client" className="mt-6 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <Avatar className="size-12">
                    <AvatarFallback className="text-base bg-gray-200 font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.client.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      ПИНФЛ: {application.client.pinfl}
                    </p>
                    <p className="text-sm text-gray-500">
                      {application.client.phone}
                    </p>

                    {/* Scoring */}
                    <div className="mt-4 flex items-center gap-4">
                      <span className="text-3xl font-bold tabular-nums">
                        {application.client.scoring}
                      </span>
                      <span className="text-sm text-gray-500">из 1000</span>
                      <Progress
                        value={scoringPercent}
                        className={`h-[3px] flex-1 max-w-[200px] ${
                          application.client.scoring >= 700
                            ? "[&>div]:bg-green-600"
                            : application.client.scoring >= 500
                              ? "[&>div]:bg-amber-500"
                              : "[&>div]:bg-red-500"
                        }`}
                      />
                    </div>

                    <button
                      onClick={() =>
                        navigate(`/clients/${application.client.id}`)
                      }
                      className="mt-4 text-sm font-medium text-[#B8A000] hover:text-[#8C7900] transition-colors"
                    >
                      Открыть карточку клиента →
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
                  Контактная информация
                </h3>
                <div className="space-y-3">
                  <InfoRow
                    label="Телефон"
                    value={
                      <span className="inline-flex items-center gap-2">
                        <Phone className="size-3.5 text-gray-400" />
                        {application.client.phone}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Email"
                    value={
                      <span className="inline-flex items-center gap-2">
                        <Mail className="size-3.5 text-gray-400" />
                        aliev.ozodbek@mail.uz
                      </span>
                    }
                  />
                  <InfoRow
                    label="Адрес"
                    value={
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="size-3.5 text-gray-400" />
                        г. Ташкент, Юнусабадский р-н, ул. Амира Тимура, 42
                      </span>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3 — Этапы */}
          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-6">
                  Этапы обработки
                </h3>
                <div className="relative">
                  {MOCK_TIMELINE.map((step, i) => (
                    <div key={i} className="flex gap-4 pb-6 last:pb-0">
                      {/* Connector line + dot */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`size-6 rounded-full flex items-center justify-center shrink-0 ${
                            step.status === "completed"
                              ? "bg-green-600"
                              : step.status === "in-progress"
                                ? "bg-amber-500 ring-4 ring-amber-100"
                                : "bg-gray-200"
                          }`}
                        >
                          {step.status === "completed" ? (
                            <CheckCircle2 className="size-3.5 text-white" />
                          ) : step.status === "in-progress" ? (
                            <Clock className="size-3.5 text-white" />
                          ) : (
                            <Circle className="size-3 text-gray-400" />
                          )}
                        </div>
                        {i < MOCK_TIMELINE.length - 1 && (
                          <div
                            className={`w-0.5 flex-1 mt-1 ${
                              step.status === "completed"
                                ? "bg-green-600"
                                : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="pb-2 min-w-0">
                        <p
                          className={`text-sm font-semibold ${step.status === "pending" ? "text-gray-400" : "text-gray-900"}`}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {step.time}
                          {step.duration && (
                            <span className="text-gray-400">
                              {" "}
                              · {step.duration}
                            </span>
                          )}
                        </p>
                        {step.note && (
                          <Badge className="mt-1.5 bg-green-100 text-green-700 border-0 text-xs rounded-full px-2 py-0.5">
                            {step.note}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4 — Партнёры */}
          <TabsContent value="partners" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
                  Решения партнёров
                </h3>
                {/* Desktop: DataTable */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Партнёр
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Время отправки
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Время ответа
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Решение
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide text-right">
                          Сумма одобрения
                        </TableHead>
                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Причина
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_PARTNER_DECISIONS.map((pd, i) => (
                        <TableRow key={i} className="h-14">
                          <TableCell className="font-medium text-sm">
                            {pd.partner}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 tabular-nums">
                            {pd.sentAt}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 tabular-nums">
                            {pd.respondedAt || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`border-0 text-xs rounded-full px-2 py-0.5 ${
                                pd.decision === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : pd.decision === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {pd.decision === "approved"
                                ? "Одобрено"
                                : pd.decision === "rejected"
                                  ? "Отклонено"
                                  : "Ожидает"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-semibold tabular-nums text-right">
                            {pd.amount
                              ? `${pd.amount.toLocaleString("ru-RU")} UZS`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {pd.reason || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile: card list */}
                <div className="space-y-3 md:hidden">
                  {MOCK_PARTNER_DECISIONS.map((pd, i) => (
                    <div
                      key={i}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {pd.partner}
                        </span>
                        <Badge
                          className={`border-0 text-xs rounded-full px-2 py-0.5 ${
                            pd.decision === "approved"
                              ? "bg-green-100 text-green-700"
                              : pd.decision === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {pd.decision === "approved"
                            ? "Одобрено"
                            : pd.decision === "rejected"
                              ? "Отклонено"
                              : "Ожидает"}
                        </Badge>
                      </div>
                      {pd.amount && (
                        <p className="text-sm font-semibold tabular-nums">
                          {pd.amount.toLocaleString("ru-RU")} UZS
                        </p>
                      )}
                      {pd.reason && (
                        <p className="text-xs text-gray-500 mt-1">
                          {pd.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 5 — Документы */}
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
                  Документы клиента
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {MOCK_DOCUMENTS.map((doc, i) => (
                    <div
                      key={i}
                      className="group relative aspect-[3/4] rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-4 gap-2 cursor-pointer overflow-hidden"
                    >
                      <FileText className="size-10 text-gray-400" />
                      <p className="text-xs text-gray-600 text-center font-medium">
                        {doc}
                      </p>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button className="size-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors min-h-[44px] min-w-[44px]">
                          <Eye className="size-5 text-white" />
                        </button>
                        <button className="size-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors min-h-[44px] min-w-[44px]">
                          <Download className="size-5 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Upload tile */}
                  <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center p-4 gap-2 cursor-pointer hover:border-[#FFD60A] hover:bg-amber-50/30 transition-colors min-h-[44px]">
                    <Upload className="size-8 text-gray-400" />
                    <p className="text-xs text-gray-500 font-medium">
                      Загрузить
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 6 — Комментарии */}
          <TabsContent value="comments" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
                  Комментарии операторов
                </h3>
                <div className="space-y-4">
                  {MOCK_COMMENTS.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="text-[10px] bg-gray-200">
                          {comment.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {comment.author}
                          </span>
                          <span className="text-xs text-gray-400">
                            {comment.time}
                          </span>
                          {comment.internal && (
                            <Badge className="bg-gray-100 text-gray-500 border-0 text-[10px] rounded-full px-1.5 py-0">
                              Внутренний
                            </Badge>
                          )}
                        </div>
                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                          <p className="text-sm text-gray-700">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Compose box */}
                <div className="mt-6 border-t pt-4">
                  <Textarea
                    placeholder="Напишите комментарий..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[80px] text-sm"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        checked={isInternal}
                        onCheckedChange={setIsInternal}
                      />
                      <span className="text-sm text-gray-600">Внутренний</span>
                    </label>
                    <Button
                      size="sm"
                      disabled={!commentText.trim()}
                      className="gap-2"
                    >
                      <Send className="size-3.5" />
                      Добавить комментарий
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 7 — История */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
                  История изменений
                </h3>
                <div className="space-y-3">
                  {MOCK_HISTORY.map((entry, i) => (
                    <div
                      key={i}
                      className="flex gap-3 text-sm py-1.5 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-xs text-gray-400 tabular-nums shrink-0 w-[120px] pt-0.5">
                        {entry.time}
                      </span>
                      <span className="text-gray-700">
                        <span className="font-medium text-gray-900">
                          {entry.user}
                        </span>{" "}
                        {entry.action}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="mt-4 text-sm font-medium text-[#B8A000] hover:text-[#8C7900] transition-colors">
                  Открыть полный аудит →
                </button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>

      {/* Fixed Action Bar */}
      <div className="shrink-0 -mx-4 -mb-4 bg-gray-50 border-t border-gray-200 px-8 md:px-10 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
          <FileDown className="size-4" />
          Скачать PDF договора
        </Button>
        <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
          <Copy className="size-4" />
          Скопировать ID
        </Button>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <span className="text-xs text-gray-500 sm:w-[140px] shrink-0">
        {label}
      </span>
      <span
        className={`text-sm text-gray-900 ${bold ? "font-semibold" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}
