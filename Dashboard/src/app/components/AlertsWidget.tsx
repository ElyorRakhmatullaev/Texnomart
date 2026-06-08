"use client";

import * as React from "react";
import { ChevronRight, AlertOctagon, AlertTriangle, Info, CheckCircle2, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@texnomart/ui/card";
import { Badge } from "@texnomart/ui/badge";
import { Button } from "@texnomart/ui/button";
import { ScrollArea } from "@texnomart/ui/scroll-area";
import { Skeleton } from "@texnomart/ui/skeleton";
import { cn } from "@texnomart/ui/utils";

type SeverityType = "danger" | "warning" | "info" | "success";

interface Alert {
  id: string;
  severity: SeverityType;
  title: string;
  description: string;
  timeAgo: string;
  action?: {
    label: string;
    route: string;
  };
}

const SEVERITY_CONFIG = {
  danger: {
    label: "Критично",
    color: "#DC2626",
    bgColor: "bg-red-600",
    borderColor: "border-l-red-600",
    icon: AlertOctagon,
  },
  warning: {
    label: "Внимание",
    color: "#F59E0B",
    bgColor: "bg-amber-500",
    borderColor: "border-l-amber-500",
    icon: AlertTriangle,
  },
  info: {
    label: "Информация",
    color: "#0EA5E9",
    bgColor: "bg-sky-500",
    borderColor: "border-l-sky-500",
    icon: Info,
  },
  success: {
    label: "Норма",
    color: "#16A34A",
    bgColor: "bg-green-600",
    borderColor: "border-l-green-600",
    icon: CheckCircle2,
  },
};

// Mock data generator
function generateMockAlerts(): Alert[] {
  return [
    {
      id: "1",
      severity: "danger",
      title: "Партнёр Anorbank недоступен",
      description: "Не отвечает на запросы API более 2 минут. Заявки перенаправлены резервным партнёрам.",
      timeAgo: "3 минуты назад",
      action: {
        label: "Открыть партнёра",
        route: "/partners/anorbank",
      },
    },
    {
      id: "2",
      severity: "danger",
      title: "Критическая ошибка скоринга",
      description: "Модуль скоринга вернул ошибку для 15 заявок. Требуется вмешательство администратора.",
      timeAgo: "12 минут назад",
      action: {
        label: "Открыть заявки",
        route: "/applications?error=scoring",
      },
    },
    {
      id: "3",
      severity: "warning",
      title: "Рост отказов Alif Nasiya",
      description: "Доля отказов за последний час: 42% (норма 15%). Рекомендуется проверка.",
      timeAgo: "18 минут назад",
      action: {
        label: "Открыть аналитику",
        route: "/analytics/partners/alif-nasiya",
      },
    },
    {
      id: "4",
      severity: "warning",
      title: "Высокая нагрузка на сервер",
      description: "CPU использование: 87%. Время отклика API увеличено на 230ms.",
      timeAgo: "25 минут назад",
    },
    {
      id: "5",
      severity: "warning",
      title: "Превышен лимит заявок",
      description: "Филиал «Чорсу» превысил дневной лимит на 12 заявок.",
      timeAgo: "34 минуты назад",
      action: {
        label: "Открыть филиал",
        route: "/branches/chorsu",
      },
    },
    {
      id: "6",
      severity: "warning",
      title: "Задержка в обработке документов",
      description: "8 заявок ожидают документы более 3 часов.",
      timeAgo: "45 минут назад",
    },
    {
      id: "7",
      severity: "warning",
      title: "Низкий процент одобрения",
      description: "Одобрено только 34% заявок за последние 2 часа (норма 58%).",
      timeAgo: "52 минуты назад",
    },
    {
      id: "8",
      severity: "info",
      title: "Новый филиал зарегистрирован",
      description: "Филиал «Самарканд-Регистан» добавлен в систему.",
      timeAgo: "1 час назад",
    },
    {
      id: "9",
      severity: "info",
      title: "Обновление системы запланировано",
      description: "Плановое обновление состоится завтра в 03:00. Ожидаемое время простоя: 15 минут.",
      timeAgo: "1 час 20 минут назад",
    },
    {
      id: "10",
      severity: "info",
      title: "Новая версия API доступна",
      description: "API v2.4 включает улучшенную валидацию и новые эндпоинты для статистики.",
      timeAgo: "1 час 35 минут назад",
    },
    {
      id: "11",
      severity: "info",
      title: "Отчёт за месяц готов",
      description: "Ежемесячный отчёт по заявкам сформирован и доступен для скачивания.",
      timeAgo: "1 час 48 минут назад",
      action: {
        label: "Скачать отчёт",
        route: "/reports/monthly",
      },
    },
    {
      id: "12",
      severity: "success",
      title: "Резервная копия выполнена",
      description: "Backup БД успешно сохранён (12.4 GB).",
      timeAgo: "2 часа назад",
    },
    {
      id: "13",
      severity: "success",
      title: "Все сервисы в норме",
      description: "Мониторинг показывает стабильную работу всех компонентов системы.",
      timeAgo: "2 часа 15 минут назад",
    },
    {
      id: "14",
      severity: "success",
      title: "Интеграция с Kapitalbank активна",
      description: "Подключение к новому партнёру прошло успешно. Обработано 23 заявки.",
      timeAgo: "2 часа 30 минут назад",
    },
    {
      id: "15",
      severity: "success",
      title: "Превышен план по заявкам",
      description: "Обработано на 18% больше заявок, чем планировалось на сегодня.",
      timeAgo: "2 часа 45 минут назад",
    },
    {
      id: "16",
      severity: "success",
      title: "Скоринг работает оптимально",
      description: "Среднее время обработки скоринга: 1.2 секунды (на 15% быстрее нормы).",
      timeAgo: "3 часа назад",
    },
    {
      id: "17",
      severity: "success",
      title: "Документы загружены",
      description: "Все ожидаемые документы получены и обработаны системой.",
      timeAgo: "3 часа 12 минут назад",
    },
    {
      id: "18",
      severity: "success",
      title: "Операторы онлайн",
      description: "Все 24 оператора находятся онлайн и обрабатывают заявки.",
      timeAgo: "3 часа 28 минут назад",
    },
    {
      id: "19",
      severity: "success",
      title: "База данных оптимизирована",
      description: "Выполнена плановая оптимизация индексов. Производительность запросов улучшена.",
      timeAgo: "3 часа 40 минут назад",
    },
    {
      id: "20",
      severity: "success",
      title: "Метрики в норме",
      description: "Все ключевые показатели находятся в пределах целевых значений.",
      timeAgo: "3 часа 55 минут назад",
    },
  ];
}

interface AlertsWidgetProps {
  loading?: boolean;
}

export function AlertsWidget({ loading = false }: AlertsWidgetProps) {
  const [alerts, setAlerts] = React.useState<Alert[]>(() => generateMockAlerts());
  const [selectedSeverities, setSelectedSeverities] = React.useState<Set<SeverityType>>(
    new Set(["danger", "warning", "info", "success"])
  );
  const [hoveredAlert, setHoveredAlert] = React.useState<string | null>(null);

  // Calculate counts by severity
  const severityCounts = React.useMemo(() => {
    return {
      danger: alerts.filter((a) => a.severity === "danger").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
      success: alerts.filter((a) => a.severity === "success").length,
    };
  }, [alerts]);

  // Filter alerts by selected severities
  const filteredAlerts = React.useMemo(() => {
    return alerts
      .filter((alert) => selectedSeverities.has(alert.severity))
      .slice(0, 8);
  }, [alerts, selectedSeverities]);

  const handleSeverityToggle = (severity: SeverityType) => {
    setSelectedSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(severity)) {
        next.delete(severity);
      } else {
        next.add(severity);
      }
      // If nothing selected, select all
      if (next.size === 0) {
        return new Set(["danger", "warning", "info", "success"]);
      }
      return next;
    });
  };

  const handleDismiss = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const handleAlertClick = (alert: Alert) => {
    if (alert.action) {
      console.log(`Navigate to ${alert.action.route}`);
    } else {
      console.log(`Navigate to /alerts/${alert.id}`);
    }
  };

  const handleViewAll = () => {
    console.log("Navigate to /alerts");
  };

  if (loading) {
    return (
      <Card className="col-span-12 md:col-span-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredAlerts.length === 0) {
    return (
      <Card className="col-span-12 md:col-span-4">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Алерты и уведомления</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="size-12 text-green-600 mb-4" />
          <p className="text-base font-medium text-gray-900 mb-2">Нет активных алертов</p>
          <p className="text-sm text-gray-600">Всё работает в штатном режиме</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-12 md:col-span-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-xl font-semibold">Алерты и уведомления</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary hover:bg-primary/10 gap-1 -mr-2"
            onClick={handleViewAll}
          >
            Все
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Badge
            variant={selectedSeverities.has("danger") ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-all",
              selectedSeverities.has("danger")
                ? "bg-red-600 hover:bg-red-700 border-red-600 text-white"
                : "border-red-600 text-red-600 hover:bg-red-50"
            )}
            onClick={() => handleSeverityToggle("danger")}
          >
            {severityCounts.danger}
          </Badge>
          <Badge
            variant={selectedSeverities.has("warning") ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-all",
              selectedSeverities.has("warning")
                ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white"
                : "border-amber-500 text-amber-600 hover:bg-amber-50"
            )}
            onClick={() => handleSeverityToggle("warning")}
          >
            {severityCounts.warning}
          </Badge>
          <Badge
            variant={selectedSeverities.has("success") ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-all",
              selectedSeverities.has("success")
                ? "bg-green-600 hover:bg-green-700 border-green-600 text-white"
                : "border-green-600 text-green-600 hover:bg-green-50"
            )}
            onClick={() => handleSeverityToggle("success")}
          >
            {severityCounts.success}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[480px] pr-4">
          <div className="space-y-1">
            {filteredAlerts.map((alert) => {
              const config = SEVERITY_CONFIG[alert.severity];
              const Icon = config.icon;

              return (
                <div
                  key={alert.id}
                  className={cn(
                    "relative border-l-[3px] pl-3 py-3 cursor-pointer transition-colors rounded-r",
                    config.borderColor,
                    "hover:bg-gray-100"
                  )}
                  onClick={() => handleAlertClick(alert)}
                  onMouseEnter={() => setHoveredAlert(alert.id)}
                  onMouseLeave={() => setHoveredAlert(null)}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Icon
                        className="size-4 shrink-0 mt-0.5"
                        style={{ color: config.color }}
                      />
                      <span className="text-sm font-semibold leading-5 flex-1">
                        {alert.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-700 leading-4">
                        {alert.timeAgo}
                      </span>
                      {hoveredAlert === alert.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-5 p-0 hover:bg-gray-200"
                          onClick={(e) => handleDismiss(alert.id, e)}
                        >
                          <X className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 leading-4 mb-2 line-clamp-2">
                    {alert.description}
                  </p>
                  {alert.action && (
                    <Badge
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-gray-50"
                    >
                      {alert.action.label}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
