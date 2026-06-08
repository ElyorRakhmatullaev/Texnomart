"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { ChevronRight, Inbox } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@texnomart/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@texnomart/ui/table";
import { Badge } from "@texnomart/ui/badge";
import { Button } from "@texnomart/ui/button";
import { Avatar, AvatarFallback } from "@texnomart/ui/avatar";
import { Skeleton } from "@texnomart/ui/skeleton";
import { cn } from "@texnomart/ui/utils";

interface Application {
  id: string;
  client: {
    name: string;
    phone: string;
    initials: string;
  };
  amount: number;
  partner: {
    name: string;
    logo?: string;
  };
  status: {
    key: string;
    label: string;
    color: string;
  };
  timeAgo: string;
  isNew?: boolean;
}

// Status colors matching the design system
const STATUSES = {
  new: { label: "Новая", color: "#3B82F6" },
  scoring: { label: "На скоринге", color: "#F59E0B" },
  inProgress: { label: "В работе у оператора", color: "#8B5CF6" },
  approved: { label: "Одобрена", color: "#10B981" },
  rejected: { label: "Отклонена", color: "#EF4444" },
  awaitingDocs: { label: "Ожидает документы", color: "#F97316" },
};

// Mock data generator
function generateMockApplication(idNumber: number): Application {
  const clients = [
    { name: "Алиев Озодбек", phone: "+998 90 123-45-67", initials: "АО" },
    { name: "Каримова Дилнура", phone: "+998 91 234-56-78", initials: "КД" },
    { name: "Юсупов Жасур", phone: "+998 93 345-67-89", initials: "ЮЖ" },
    { name: "Рахимов Шерзод", phone: "+998 94 456-78-90", initials: "РШ" },
    { name: "Назарова Малика", phone: "+998 97 567-89-01", initials: "НМ" },
    { name: "Мирзаев Акбар", phone: "+998 90 678-90-12", initials: "МА" },
    { name: "Усманова Гулнора", phone: "+998 91 789-01-23", initials: "УГ" },
    { name: "Хамидов Фаррух", phone: "+998 93 890-12-34", initials: "ХФ" },
  ];

  const partners = [
    { name: "Alif Nasiya" },
    { name: "Uzum Nasiya" },
    { name: "Anorbank" },
    { name: "Kapitalbank" },
    { name: "Ipoteka Bank" },
  ];

  const statusKeys = Object.keys(STATUSES);
  const randomClient = clients[Math.floor(Math.random() * clients.length)];
  const randomPartner = partners[Math.floor(Math.random() * partners.length)];
  const randomStatusKey = statusKeys[Math.floor(Math.random() * statusKeys.length)];
  const randomAmount = Math.floor(Math.random() * 8000000) + 1000000;
  const randomTimeAgo = `${Math.floor(Math.random() * 30) + 2} мин назад`;

  return {
    id: `BR-${String(idNumber).padStart(5, "0")}`,
    client: randomClient,
    amount: randomAmount,
    partner: randomPartner,
    status: {
      key: randomStatusKey,
      label: STATUSES[randomStatusKey as keyof typeof STATUSES].label,
      color: STATUSES[randomStatusKey as keyof typeof STATUSES].color,
    },
    timeAgo: randomTimeAgo,
  };
}

// Generate initial 10 applications
function generateInitialApplications(): Application[] {
  return Array.from({ length: 10 }, (_, i) => generateMockApplication(12483 - i));
}

interface RecentApplicationsWidgetProps {
  loading?: boolean;
}

export function RecentApplicationsWidget({ loading = false }: RecentApplicationsWidgetProps) {
  const navigate = useNavigate();
  const [applications, setApplications] = React.useState<Application[]>(() =>
    generateInitialApplications()
  );
  const [nextId, setNextId] = React.useState(12484);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const newApp = generateMockApplication(nextId);
      newApp.isNew = true;

      setApplications((prev) => {
        const updated = [newApp, ...prev.slice(0, 9)];
        return updated;
      });

      setNextId((prev) => prev + 1);

      setTimeout(() => {
        setApplications((prev) =>
          prev.map((app) => ({ ...app, isNew: false }))
        );
      }, 400);
    }, 12000);

    return () => clearInterval(interval);
  }, [nextId]);

  const handleRowClick = (id: string) => {
    navigate(`/applications/${id}`);
  };

  const handleViewAll = () => {
    navigate("/applications");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Последние заявки</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Inbox className="size-12 text-gray-400 mb-4" />
          <p className="text-base font-medium text-gray-900 mb-4">Пока нет заявок</p>
          <Button>Создать заявку</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Последние заявки</CardTitle>
            <CardDescription className="flex items-center gap-2 text-xs text-gray-700 mt-1">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-green-500" />
              </span>
              Обновляется в реальном времени
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary hover:bg-primary/10 gap-1"
            onClick={handleViewAll}
          >
            Все заявки
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead className="w-[120px]">Сумма</TableHead>
                <TableHead className="w-[140px]">Партнёр</TableHead>
                <TableHead className="w-[140px]">Статус</TableHead>
                <TableHead className="w-[80px]">Время</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow
                  key={app.id}
                  className={cn(
                    "h-16 cursor-pointer transition-all duration-300 hover:bg-gray-100 relative",
                    app.isNew && "bg-primary/20 animate-in fade-in slide-in-from-top-2"
                  )}
                  onClick={() => handleRowClick(app.id)}
                >
                  <TableCell className="font-mono text-xs text-gray-700">
                    {app.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                          {app.client.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{app.client.name}</div>
                        <div className="text-xs text-gray-700">{app.client.phone}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <div className="text-sm font-semibold">
                      {app.amount.toLocaleString("ru-RU")}
                    </div>
                    <div className="text-xs text-gray-600">UZS</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="size-4 shrink-0 rounded bg-gray-200" />
                      <span className="text-sm">{app.partner.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      style={{
                        backgroundColor: app.status.color,
                        color: "#fff",
                        borderColor: app.status.color,
                      }}
                      className="text-xs"
                    >
                      {app.status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-700">
                    {app.timeAgo}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden flex flex-col gap-2">
          {applications.map((app) => (
            <div
              key={app.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors",
                app.isNew && "bg-primary/10 animate-in fade-in slide-in-from-top-2"
              )}
              onClick={() => handleRowClick(app.id)}
            >
              <Avatar className="size-9 shrink-0">
                <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                  {app.client.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{app.client.name}</span>
                  <span className="text-xs text-gray-500 shrink-0">{app.timeAgo}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-sm font-semibold tabular-nums">{app.amount.toLocaleString("ru-RU")} UZS</span>
                  <Badge
                    style={{ backgroundColor: app.status.color, color: "#fff", borderColor: app.status.color }}
                    className="text-[10px] shrink-0"
                  >
                    {app.status.label}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  <span className="font-mono">{app.id}</span> · {app.partner.name}
                </div>
              </div>
              <ChevronRight className="size-4 text-gray-400 shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
