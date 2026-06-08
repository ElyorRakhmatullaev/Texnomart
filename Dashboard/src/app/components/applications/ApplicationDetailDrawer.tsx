"use client";

import * as React from "react";
import {
  X,
  MoreHorizontal,
  Download,
  Eye,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
import { Avatar, AvatarFallback } from "@texnomart/ui/avatar";
import { Separator } from "@texnomart/ui/separator";
import { Progress } from "@texnomart/ui/progress";
import { Textarea } from "@texnomart/ui/textarea";
import { Switch } from "@texnomart/ui/switch";
import { Label } from "@texnomart/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@texnomart/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@texnomart/ui/table";
import {
  APPLICATION_STATUSES,
  type Application,
} from "@/lib/applications-mock-data";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface ApplicationDetailDrawerProps {
  application: Application | null;
  onClose: () => void;
}

export function ApplicationDetailDrawer({
  application,
  onClose,
}: ApplicationDetailDrawerProps) {
  const [comment, setComment] = React.useState("");
  const [isInternal, setIsInternal] = React.useState(true);
  const [showAudit, setShowAudit] = React.useState(false);

  if (!application) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const channelLabels = {
    online: "Онлайн",
    app: "Мобильное приложение",
    telegram: "Telegram",
    branch: "Филиал",
  };

  const scoringPercent = (application.client.scoring / 1000) * 100;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-[720px] bg-white shadow-2xl flex flex-col">
      {/* Header - Sticky */}
      <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="size-5" />
          </button>
          <h2 className="text-xl font-semibold">Заявка {application.id}</h2>
          <Badge
            className={`${APPLICATION_STATUSES[application.status].bg} ${
              APPLICATION_STATUSES[application.status].text
            } border-0`}
          >
            {APPLICATION_STATUSES[application.status].label}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
            Одобрить
          </Button>
          <Button size="sm" variant="destructive">
            Отклонить
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="size-8 p-0">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Переназначить</DropdownMenuItem>
              <DropdownMenuItem>Запросить документы</DropdownMenuItem>
              <DropdownMenuItem>Скопировать ссылку</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* 1. Сводка */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Сводка</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <InfoRow label="Сумма" value={`${application.amount.toLocaleString("ru-RU")} UZS`} />
            <InfoRow label="Срок" value={`${application.term} месяцев`} />
            <InfoRow label="Создана" value={formatDate(application.createdAt)} />
            <InfoRow label="Канал" value={channelLabels[application.channel]} />
            <InfoRow label="Филиал" value={application.branch.name} />
            <InfoRow
              label="Оператор"
              value={application.operator?.name || "Не назначен"}
            />
          </div>
        </section>

        <Separator />

        {/* 2. Клиент */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Клиент</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="size-12">
                <AvatarFallback className="text-sm bg-gray-200 text-gray-700">
                  {application.client.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-base font-semibold">{application.client.name}</div>
                <div className="text-sm text-gray-700">ПИНФЛ: {application.client.pinfl}</div>
                <div className="text-sm text-gray-700">{application.client.phone}</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-md p-4 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums">
                  {application.client.scoring}
                </span>
                <span className="text-sm text-gray-600">из 1000</span>
              </div>
              <Progress
                value={scoringPercent}
                className={`h-[3px] ${
                  application.client.scoring >= 700
                    ? "[&>div]:bg-green-600"
                    : "[&>div]:bg-orange-500"
                }`}
              />
              <div className="text-xs text-gray-600">Скоринг</div>
            </div>

            <a
              href="#"
              className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Открыть карточку клиента →
            </a>
          </div>
        </section>

        <Separator />

        {/* 3. Этапы обработки (Timeline) */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Этапы обработки</h3>
          <div className="space-y-3">
            <TimelineItem
              status="completed"
              title="Подача заявки"
              time="14:32"
            />
            <TimelineItem
              status="completed"
              title="Скоринг отправлен"
              time="14:33"
              duration="1 сек"
            />
            <TimelineItem
              status="completed"
              title="Получен ответ Alif Nasiya"
              time="14:34"
              duration="53 сек"
              note="Одобрено"
            />
            <TimelineItem
              status="in-progress"
              title="Подписание договора"
              time="в процессе"
            />
            <TimelineItem
              status="pending"
              title="Завершение"
              time="ожидается"
            />
          </div>
        </section>

        <Separator />

        {/* 4. Решения партнёров */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Решения партнёров</h3>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Партнёр</TableHead>
                  <TableHead>Отправка</TableHead>
                  <TableHead>Ответ</TableHead>
                  <TableHead>Решение</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Причина</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Alif Nasiya</TableCell>
                  <TableCell className="text-xs text-gray-600">14:33</TableCell>
                  <TableCell className="text-xs text-gray-600">14:34</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700 border-0">
                      Одобрено
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">4 200 000</TableCell>
                  <TableCell className="text-xs text-gray-600">—</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Anorbank</TableCell>
                  <TableCell className="text-xs text-gray-600">14:33</TableCell>
                  <TableCell className="text-xs text-gray-600">14:35</TableCell>
                  <TableCell>
                    <Badge className="bg-red-100 text-red-700 border-0">
                      Отклонено
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">—</TableCell>
                  <TableCell className="text-xs text-gray-600">Низкий скоринг</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Uzum Nasiya</TableCell>
                  <TableCell className="text-xs text-gray-600">14:33</TableCell>
                  <TableCell className="text-xs text-gray-600">—</TableCell>
                  <TableCell>
                    <Badge className="bg-gray-200 text-gray-700 border-0">
                      Не отвечает
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">—</TableCell>
                  <TableCell className="text-xs text-gray-600">—</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        <Separator />

        {/* 5. Документы клиента */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Документы клиента</h3>
          <div className="grid grid-cols-4 gap-3">
            <DocumentThumbnail label="Паспорт (лицевая)" />
            <DocumentThumbnail label="Паспорт (разворот)" />
            <DocumentThumbnail label="Селфи с паспортом" />
            <DocumentThumbnail label="ИНН" />
            <button className="aspect-square rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors">
              <Plus className="size-6" />
              <span className="text-xs">Загрузить</span>
            </button>
          </div>
        </section>

        <Separator />

        {/* 6. Банковские карты */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Банковские карты</h3>
          <div className="space-y-2">
            <CardRow
              type="visa"
              maskedNumber="**** 4521"
              bank="Kapitalbank"
              verified={true}
            />
            <CardRow
              type="mastercard"
              maskedNumber="**** 8832"
              bank="Uzum Bank"
              verified={true}
            />
          </div>
        </section>

        <Separator />

        {/* 7. Комментарии операторов */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Комментарии операторов</h3>
          <div className="space-y-3 mb-4">
            <CommentItem
              author="Алина П."
              time={new Date("2026-05-15T14:45:00")}
              text="Клиент подтвердил готовность подписать договор. Назначена встреча на завтра."
            />
            <CommentItem
              author="Бекзод К."
              time={new Date("2026-05-15T14:38:00")}
              text="Проведён дополнительный звонок для уточнения цели кредита."
            />
          </div>

          <div className="space-y-3 bg-gray-50 p-4 rounded-md">
            <div>
              <Textarea
                placeholder="Добавьте комментарий..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-20"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="internal-comment"
                  checked={isInternal}
                  onCheckedChange={setIsInternal}
                />
                <Label htmlFor="internal-comment" className="text-sm cursor-pointer">
                  Внутренний
                </Label>
              </div>
              <Button size="sm" disabled={!comment.trim()}>
                Добавить комментарий
              </Button>
            </div>
          </div>
        </section>

        <Separator />

        {/* 8. История изменений (audit) */}
        <section>
          <button
            onClick={() => setShowAudit(!showAudit)}
            className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 hover:text-gray-700"
          >
            История изменений
            <span className="text-xs text-gray-500">
              {showAudit ? "▼" : "▶"}
            </span>
          </button>
          {showAudit && (
            <div className="space-y-2 text-xs text-gray-600">
              <div>
                <span className="text-gray-400">15.05.2026 14:34</span> — Алина Петрова изменила
                статус: На скоринге → Одобрена
              </div>
              <div>
                <span className="text-gray-400">15.05.2026 14:33</span> — Система отправила заявку
                на скоринг в 3 партнёра
              </div>
              <div>
                <span className="text-gray-400">15.05.2026 14:32</span> — Заявка создана через
                Мобильное приложение
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer - Sticky */}
      <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
        <Button variant="ghost" size="sm">
          <Download className="size-4 mr-2" />
          Скачать PDF договора
        </Button>
        <Button size="sm" disabled>
          Сохранить изменения
        </Button>
      </div>
    </div>
    </>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

interface TimelineItemProps {
  status: "completed" | "in-progress" | "pending";
  title: string;
  time: string;
  duration?: string;
  note?: string;
}

function TimelineItem({ status, title, time, duration, note }: TimelineItemProps) {
  const icons = {
    completed: <CheckCircle2 className="size-5 text-green-600" />,
    "in-progress": <Clock className="size-5 text-amber-600" />,
    pending: <Circle className="size-5 text-gray-400" />,
  };

  return (
    <div className="flex gap-3">
      <div className="mt-0.5">{icons[status]}</div>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-gray-600">
          {time}
          {duration && <span className="ml-2">({duration})</span>}
          {note && <span className="ml-2 text-green-700">— {note}</span>}
        </div>
      </div>
    </div>
  );
}

function DocumentThumbnail({ label }: { label: string }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      className="relative aspect-square rounded-md border border-gray-300 bg-gray-100 overflow-hidden cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 p-2 text-center">
        {label}
      </div>
      {hovered && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4">
          <button className="text-white hover:text-gray-200">
            <Download className="size-5" />
          </button>
          <button className="text-white hover:text-gray-200">
            <Eye className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}

interface CardRowProps {
  type: "visa" | "mastercard";
  maskedNumber: string;
  bank: string;
  verified: boolean;
}

function CardRow({ type, maskedNumber, bank, verified }: CardRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-md">
      <div className="size-8 bg-gray-200 rounded flex items-center justify-center text-xs font-semibold">
        {type === "visa" ? "VISA" : "MC"}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium font-mono">{maskedNumber}</div>
        <div className="text-xs text-gray-600">{bank}</div>
      </div>
      <Badge
        className={`${
          verified
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        } border-0`}
      >
        {verified ? "Проверена" : "Отклонена"}
      </Badge>
    </div>
  );
}

interface CommentItemProps {
  author: string;
  time: Date;
  text: string;
}

function CommentItem({ author, time, text }: CommentItemProps) {
  return (
    <div className="flex gap-3">
      <Avatar className="size-7">
        <AvatarFallback className="text-xs bg-gray-200">
          {author
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium">{author}</span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(time, { addSuffix: true, locale: ru })}
          </span>
        </div>
        <div className="bg-gray-100 rounded-md p-3 text-sm">{text}</div>
      </div>
    </div>
  );
}
