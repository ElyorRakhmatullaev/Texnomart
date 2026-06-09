"use client";

import * as React from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  MoreHorizontal,
  Plug,
  Power,
  Trash2,
  History,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@texnomart/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@texnomart/ui/tabs";
import { Switch } from "@texnomart/ui/switch";
import { Input } from "@texnomart/ui/input";
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
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  MOCK_PARTNERS,
  API_STATUSES,
  PARTNER_STATUSES,
  SETTLEMENT_STATUSES,
  ALL_TERM_OPTIONS,
  type Partner,
} from "@/lib/partners-mock-data";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const partner = MOCK_PARTNERS.find((p) => p.id === id);

  const [activeTab, setActiveTab] = React.useState("overview");
  const [partnerStatus, setPartnerStatus] = React.useState(partner?.status ?? "active");

  if (!partner) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">Партнёр не найден</h2>
          <p className="text-gray-600">Партнёр с ID {id} не существует</p>
          <Button variant="outline" onClick={() => navigate("/partners")}>
            Вернуться к списку
          </Button>
        </div>
      </div>
    );
  }

  const apiStatus = API_STATUSES[partner.apiStatus];

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <button
        onClick={() => navigate("/partners")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к партнёрам
      </button>

      {/* Hero band */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`h-16 w-16 rounded-xl ${partner.logoColor} flex items-center justify-center text-white font-bold text-xl shrink-0`}>
              {partner.logoInitials}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{partner.name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{partner.legalName}</p>
              <p className="text-sm text-gray-600 mt-1 max-w-prose">{partner.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${apiStatus.bg} ${apiStatus.text} text-xs px-2 py-0.5 rounded-full`}>
                  {apiStatus.label}
                </Badge>
                <Badge className={`${PARTNER_STATUSES[partnerStatus].bg} ${PARTNER_STATUSES[partnerStatus].text} text-xs px-2 py-0.5 rounded-full`}>
                  {PARTNER_STATUSES[partnerStatus].label}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Label htmlFor="partner-status" className="text-sm text-gray-600">Активен</Label>
              <Switch
                id="partner-status"
                checked={partnerStatus === "active"}
                onCheckedChange={(checked) =>
                  setPartnerStatus(checked ? "active" : "deactivated")
                }
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Plug className="h-4 w-4" />
              <span className="hidden sm:inline">Проверить подключение</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Power className="h-4 w-4 mr-2" />
                  {partnerStatus === "active" ? "Деактивировать" : "Активировать"}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <History className="h-4 w-4 mr-2" />
                  История изменений
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
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-12 w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
            Обзор
          </TabsTrigger>
          <TabsTrigger value="terms" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
            Условия
          </TabsTrigger>
          <TabsTrigger value="api" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
            API {/* role:Superadmin */}
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
            Финансы
          </TabsTrigger>
          <TabsTrigger value="stats" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
            Статистика
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
            История
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab partner={partner} />
        </TabsContent>
        <TabsContent value="terms" className="mt-6">
          <TermsTab partner={partner} />
        </TabsContent>
        <TabsContent value="api" className="mt-6">
          <ApiTab partner={partner} />
        </TabsContent>
        <TabsContent value="finance" className="mt-6">
          <FinanceTab partner={partner} />
        </TabsContent>
        <TabsContent value="stats" className="mt-6">
          <StatsTab partner={partner} />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <HistoryTab partner={partner} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Tab 1: Обзор ── */
function OverviewTab({ partner }: { partner: Partner }) {
  const [regions, setRegions] = React.useState(partner.regions);
  const [categories, setCategories] = React.useState(partner.categories);

  const allCategories = [
    "Смартфоны", "Ноутбуки", "Телевизоры", "Бытовая техника",
    "Климатическая техника", "Аудио и видео", "Аксессуары", "Мебель", "Спорт",
  ];

  const toggleRegion = (name: string) => {
    setRegions((prev) =>
      prev.map((r) => (r.name === name ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase text-gray-500">Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Юр. наименование" value={partner.legalName} />
            <InfoRow label="Описание" value={partner.description} />
            <InfoRow label="Контактное лицо" value={partner.contactPerson} />
            <InfoRow label="Email" value={partner.contactEmail} />
            <InfoRow label="Телефон" value={partner.contactPhone} />
            <InfoRow label="SLA ответа" value={partner.sla} />
          </CardContent>
        </Card>

        {/* Regions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase text-gray-500">Регионы покрытия</CardTitle>
              <button
                className="text-xs text-[#FFD60A] font-medium hover:underline"
                onClick={() =>
                  setRegions((prev) => {
                    const allEnabled = prev.every((r) => r.enabled);
                    return prev.map((r) => ({ ...r, enabled: !allEnabled }));
                  })
                }
              >
                {regions.every((r) => r.enabled) ? "Снять все" : "Выбрать все"}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {regions.map((region) => (
                <div key={region.name} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-700">{region.name}</span>
                  <Switch
                    checked={region.enabled}
                    onCheckedChange={() => toggleRegion(region.name)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase text-gray-500">Категории товаров</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  categories.includes(cat)
                    ? "bg-[#FFD60A] border-[#FFD60A] text-black"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Tab 2: Условия кредитования ── */
function TermsTab({ partner }: { partner: Partner }) {
  const [selectedTerms, setSelectedTerms] = React.useState(partner.terms.availableMonths);
  const [minAmount, setMinAmount] = React.useState(String(partner.terms.minAmount));
  const [maxAmount, setMaxAmount] = React.useState(String(partner.terms.maxAmount));
  const [minAge, setMinAge] = React.useState(String(partner.terms.minAge));
  const [maxAge, setMaxAge] = React.useState(String(partner.terms.maxAge));

  const toggleTerm = (month: number) => {
    setSelectedTerms((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month].sort((a, b) => a - b)
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase text-gray-500">Сроки рассрочки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ALL_TERM_OPTIONS.map((month) => (
              <button
                key={month}
                onClick={() => toggleTerm(month)}
                className={`min-w-[52px] px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  selectedTerms.includes(month)
                    ? "bg-[#FFD60A] border-[#FFD60A] text-black"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {month} мес
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            Доступные сроки для клиента:{" "}
            <span className="font-medium text-gray-900">
              {selectedTerms.length > 0 ? selectedTerms.map((m) => `${m} мес`).join(", ") : "не выбрано"}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase text-gray-500">Лимиты</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Минимальная сумма (UZS)</Label>
              <Input
                type="text"
                value={Number(minAmount).toLocaleString("ru-RU")}
                onChange={(e) => setMinAmount(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Максимальная сумма (UZS)</Label>
              <Input
                type="text"
                value={Number(maxAmount).toLocaleString("ru-RU")}
                onChange={(e) => setMaxAmount(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Минимальный возраст</Label>
              <Input type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Максимальный возраст</Label>
              <Input type="number" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      <div className="sticky bottom-[-0.75rem] md:bottom-[-1rem] z-10 -mx-3 -mb-3 md:-mx-4 md:-mb-4 bg-white border-t border-gray-200 px-3 md:px-6 py-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
          <Button variant="ghost" className="min-h-[44px] sm:min-h-0">Отменить</Button>
          <Button className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90 min-h-[44px] sm:min-h-0">
            Сохранить изменения
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Tab 3: API-настройки ── */
function ApiTab({ partner }: { partner: Partner }) {
  const [env, setEnv] = React.useState<"production" | "sandbox">("production");
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [showSecret, setShowSecret] = React.useState(false);
  const [connectionResult, setConnectionResult] = React.useState<string | null>(null);

  const config = partner.apiConfig;
  const url = env === "production" ? config.productionUrl : config.sandboxUrl;

  const handleTestConnection = () => {
    setConnectionResult(null);
    setTimeout(() => {
      setConnectionResult("Соединение установлено, время отклика 124 мс");
    }, 1000);
  };

  const maskValue = (val: string) => val.slice(0, 8) + "•".repeat(16);

  return (
    <div className="space-y-6">
      {/* role:Superadmin */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 uppercase">API-настройки</h3>
        <Button variant="outline" className="gap-2" onClick={handleTestConnection}>
          <Plug className="h-4 w-4" />
          Проверить подключение
        </Button>
      </div>

      {connectionResult && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {connectionResult}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase text-gray-500">Конфигурация API</CardTitle>
            <div className="flex items-center rounded-lg border bg-gray-50 p-1">
              <button
                onClick={() => setEnv("production")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  env === "production" ? "bg-[#FFD60A] text-black" : "text-gray-600"
                }`}
              >
                Production
              </button>
              <button
                onClick={() => setEnv("sandbox")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  env === "sandbox" ? "bg-[#FFD60A] text-black" : "text-gray-600"
                }`}
              >
                Sandbox
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">API URL</Label>
            <Input value={url} readOnly />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">API Key</Label>
            <div className="flex gap-2">
              <Input
                value={showApiKey ? config.apiKey : maskValue(config.apiKey)}
                readOnly
                className="font-mono text-sm flex-1"
              />
              <Button variant="ghost" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(config.apiKey)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Ротация ключа">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Secret</Label>
            <div className="flex gap-2">
              <Input
                value={showSecret ? config.secret : maskValue(config.secret)}
                readOnly
                className="font-mono text-sm flex-1"
              />
              <Button variant="ghost" size="icon" onClick={() => setShowSecret(!showSecret)}>
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(config.secret)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Ротация секрета">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Webhook URL</Label>
            <Input value={config.webhookUrl} readOnly />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase text-gray-500">Расписание работы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {config.schedule.map((s) => (
              <div key={s.day} className="flex items-center gap-4 py-1.5">
                <span className="w-8 text-sm font-medium text-gray-700">{s.day}</span>
                {s.from && s.to ? (
                  <div className="flex items-center gap-2">
                    <Input className="w-24 text-center text-sm" value={s.from} readOnly />
                    <span className="text-gray-400">—</span>
                    <Input className="w-24 text-center text-sm" value={s.to} readOnly />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Выходной</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase text-gray-500">Таймауты и retry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Timeout (мс)</Label>
              <Input type="number" defaultValue={config.timeoutMs} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Retry count</Label>
              <Input type="number" defaultValue={config.retryCount} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">Retry delay (мс)</Label>
              <Input type="number" defaultValue={config.retryDelayMs} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Tab 4: Финансы ── */
function FinanceTab({ partner }: { partner: Partner }) {
  const [commissionType, setCommissionType] = React.useState(partner.commission.type);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase text-gray-500">Комиссия партнёра</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {(["fixed", "percent", "hybrid"] as const).map((type) => {
              const labels = { fixed: "Фикс", percent: "Процент", hybrid: "Гибрид" };
              return (
                <button
                  key={type}
                  onClick={() => setCommissionType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    commissionType === type
                      ? "bg-[#FFD60A] border-[#FFD60A] text-black"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {labels[type]}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {(commissionType === "fixed" || commissionType === "hybrid") && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Фиксированная сумма (UZS)</Label>
                <Input
                  type="text"
                  defaultValue={
                    commissionType === "fixed"
                      ? partner.commission.fixedAmount?.toLocaleString("ru-RU")
                      : partner.commission.hybridFixed?.toLocaleString("ru-RU")
                  }
                />
              </div>
            )}
            {(commissionType === "percent" || commissionType === "hybrid") && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Процент (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  defaultValue={
                    commissionType === "percent"
                      ? partner.commission.percent
                      : partner.commission.hybridPercent
                  }
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase text-gray-500">История взаиморасчётов</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-medium text-gray-500 uppercase">Период</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Выдано (UZS)</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Комиссия (UZS)</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Выплачено (UZS)</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase text-right">Остаток (UZS)</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 uppercase w-[110px]">Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partner.settlements.map((s) => {
                  const status = SETTLEMENT_STATUSES[s.status];
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.period}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.issued.toLocaleString("ru-RU")}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.commission.toLocaleString("ru-RU")}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.paid.toLocaleString("ru-RU")}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.balance.toLocaleString("ru-RU")}</TableCell>
                      <TableCell>
                        <Badge className={`${status.bg} ${status.text} text-xs px-2 py-0.5 rounded-full`}>
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {partner.settlements.map((s) => {
              const status = SETTLEMENT_STATUSES[s.status];
              return (
                <div key={s.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{s.period}</span>
                    <Badge className={`${status.bg} ${status.text} text-xs px-2 py-0.5 rounded-full`}>
                      {status.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">Выдано:</span> <span className="tabular-nums">{s.issued.toLocaleString("ru-RU")}</span></div>
                    <div><span className="text-gray-500">Комиссия:</span> <span className="tabular-nums">{s.commission.toLocaleString("ru-RU")}</span></div>
                    <div><span className="text-gray-500">Выплачено:</span> <span className="tabular-nums">{s.paid.toLocaleString("ru-RU")}</span></div>
                    <div><span className="text-gray-500">Остаток:</span> <span className="tabular-nums">{s.balance.toLocaleString("ru-RU")}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Tab 5: Статистика ── */
function StatsTab({ partner }: { partner: Partner }) {
  const [chartPeriod, setChartPeriod] = React.useState("30d");
  const stats = partner.stats;

  const kpis = [
    { label: "Всего заявок", value: stats.totalApplications.toLocaleString("ru-RU"), icon: FileText },
    { label: "Одобрено", value: stats.approved.toLocaleString("ru-RU"), icon: CheckCircle2 },
    { label: "Конверсия", value: `${stats.conversionRate}%`, icon: TrendingUp },
    { label: "Средний чек", value: `${stats.avgCheck.toLocaleString("ru-RU")} UZS`, icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <kpi.icon className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{kpi.label}</p>
                <p className="text-lg font-bold tabular-nums">{kpi.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Area chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-sm font-semibold uppercase text-gray-500">Заявки по дням</CardTitle>
            <div className="flex items-center rounded-lg border bg-gray-50 p-1">
              {["7d", "30d", "90d"].map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    chartPeriod === p ? "bg-[#FFD60A] text-black" : "text-gray-600"
                  }`}
                >
                  {p === "7d" ? "7 дней" : p === "30d" ? "30 дней" : "90 дней"}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip />
                <Area type="monotone" dataKey="applications" stroke="#FFD60A" fill="#FFD60A" fillOpacity={0.15} name="Заявки" />
                <Area type="monotone" dataKey="approved" stroke="#10B981" fill="#10B981" fillOpacity={0.1} name="Одобрено" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase text-gray-500">Распределение по статусам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                  >
                    {stats.statusDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString("ru-RU")} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {stats.statusDistribution.map((s) => (
                <div key={s.status} className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-gray-600">{s.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourly bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase text-gray-500">Заявки по часам суток</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#9CA3AF" tickFormatter={(h) => `${h}:00`} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <Tooltip labelFormatter={(h) => `${h}:00`} />
                  <Bar dataKey="count" fill="#FFD60A" radius={[2, 2, 0, 0]} name="Заявки" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── Tab 6: История изменений ── */
function HistoryTab({ partner }: { partner: Partner }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase text-gray-500">История изменений</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {partner.changes.map((change, i) => (
              <div key={change.id} className="flex gap-4 pb-6 last:pb-0">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div className="h-6 w-6 rounded-full bg-[#FFD60A] flex items-center justify-center shrink-0">
                    <Settings className="h-3 w-3 text-black" />
                  </div>
                  {i < partner.changes.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{change.user}</span>
                    {" "}изменил{" "}
                    <span className="font-medium">{change.field}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <span className="line-through text-red-400">{change.oldValue}</span>
                    {" → "}
                    <span className="text-green-600">{change.newValue}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(change.date, "d MMMM yyyy, HH:mm", { locale: ru })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Shared sub-components ── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <span className="text-sm text-gray-500 sm:w-[160px] shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
