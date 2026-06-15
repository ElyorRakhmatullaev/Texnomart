"use client";

import * as React from "react";
import {
  Settings,
  Globe,
  Plug,
  Shield,
  Key,
  Database,
  Upload,
  Eye,
  EyeOff,
  Copy,
  RotateCcw,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Send,
  Check,
  AlertTriangle,
  MoreHorizontal,
  X,
  Search,
  FileJson,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@texnomart/ui/card";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import { Switch } from "@texnomart/ui/switch";
import { Textarea } from "@texnomart/ui/textarea";
import { Badge } from "@texnomart/ui/badge";
import { Separator } from "@texnomart/ui/separator";
import { Slider } from "@texnomart/ui/slider";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@texnomart/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@texnomart/ui/collapsible";
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
  DropdownMenuTrigger,
} from "@texnomart/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@texnomart/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@texnomart/ui/sheet";
import { cn } from "@texnomart/ui/utils";
import {
  type OrganizationSettings,
  type RegionalSettings,
  type LanguageEntry,
  type TranslationRow,
  type IntegrationConfig,
  type PasswordPolicy,
  type SessionPolicy,
  type AccessPolicy,
  type ApiKey,
  type Webhook,
  type BackupEntry,
  type BackupSchedule,
  TIMEZONES,
  DATE_FORMATS,
  CURRENCIES,
  API_SCOPES,
  WEBHOOK_EVENTS,
  SMS_PROVIDERS,
  BACKUP_FREQUENCIES,
  BACKUP_STORAGES,
  mockOrganization,
  mockRegional,
  mockLanguages,
  mockTranslations,
  mockIntegrations,
  mockPasswordPolicy,
  mockSessionPolicy,
  mockAccessPolicy,
  mockApiKeys,
  mockWebhooks,
  mockBackupSchedule,
  mockBackups,
} from "@/lib/settings-mock-data";

const NAV_ITEMS = [
  { id: "general", label: "Общие", icon: Settings },
  { id: "localization", label: "Локализация", icon: Globe },
  { id: "integrations", label: "Интеграции", icon: Plug },
  { id: "security", label: "Безопасность", icon: Shield },
  { id: "api", label: "API и Webhooks", icon: Key },
  { id: "backup", label: "Резервное копирование", icon: Database },
] as const;

type SectionId = (typeof NAV_ITEMS)[number]["id"];

// ─── SECTION 1: Общие ───────────────────────────────────────────────────────

function GeneralSection() {
  const [org, setOrg] = React.useState<OrganizationSettings>(mockOrganization);
  const [regional, setRegional] = React.useState<RegionalSettings>(mockRegional);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Организация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Перетащите логотип или нажмите для загрузки</p>
            <p className="text-xs text-gray-400">PNG, JPG до 2 МБ</p>
            <Button variant="outline" size="sm" className="mt-3">
              Выбрать файл
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Юридическое наименование</Label>
              <Input value={org.legalName} onChange={(e) => setOrg({ ...org, legalName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>ИНН</Label>
              <Input value={org.inn} onChange={(e) => setOrg({ ...org, inn: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Контактный email</Label>
              <Input type="email" value={org.email} onChange={(e) => setOrg({ ...org, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Телефон</Label>
              <Input value={org.phone} onChange={(e) => setOrg({ ...org, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Адрес</Label>
              <Input value={org.address} onChange={(e) => setOrg({ ...org, address: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Региональные настройки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Часовой пояс</Label>
              <Select value={regional.timezone} onValueChange={(v) => setRegional({ ...regional, timezone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Формат даты</Label>
              <Select value={regional.dateFormat} onValueChange={(v) => setRegional({ ...regional, dateFormat: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((df) => (
                    <SelectItem key={df.value} value={df.value}>{df.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Валюта</Label>
              <Select value={regional.currency} onValueChange={(v) => setRegional({ ...regional, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Формат времени</Label>
              <div className="flex items-center gap-3 pt-1">
                <span className={cn("text-sm", regional.timeFormat === "24h" && "font-medium")}>24ч</span>
                <Switch
                  checked={regional.timeFormat === "12h"}
                  onCheckedChange={(checked) =>
                    setRegional({ ...regional, timeFormat: checked ? "12h" : "24h" })
                  }
                />
                <span className={cn("text-sm", regional.timeFormat === "12h" && "font-medium")}>12ч</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Первый день недели</Label>
            <div className="flex items-center gap-3">
              <span className={cn("text-sm", regional.firstDayOfWeek === "monday" && "font-medium")}>Понедельник</span>
              <Switch
                checked={regional.firstDayOfWeek === "sunday"}
                onCheckedChange={(checked) =>
                  setRegional({ ...regional, firstDayOfWeek: checked ? "sunday" : "monday" })
                }
              />
              <span className={cn("text-sm", regional.firstDayOfWeek === "sunday" && "font-medium")}>Воскресенье</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <StickyBar onSave={() => toast.success("Общие настройки сохранены")} />
    </div>
  );
}

// ─── SECTION 2: Локализация ──────────────────────────────────────────────────

function LocalizationSection() {
  const [languages, setLanguages] = React.useState<LanguageEntry[]>(mockLanguages);
  const [defaultLang, setDefaultLang] = React.useState("ru");
  const [translations] = React.useState<TranslationRow[]>(mockTranslations);
  const [translationSearch, setTranslationSearch] = React.useState("");

  const filteredTranslations = translations.filter(
    (t) =>
      t.key.toLowerCase().includes(translationSearch.toLowerCase()) ||
      t.ru.toLowerCase().includes(translationSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Языки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {languages.map((lang) => (
            <div key={lang.code} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-sm">{lang.name}</p>
                <p className="text-xs text-gray-500">{lang.code}</p>
              </div>
              <div className="flex items-center gap-3">
                {lang.isDefault && (
                  <Badge variant="outline" className="text-xs">По умолчанию</Badge>
                )}
                <Switch
                  checked={lang.enabled}
                  disabled={lang.isDefault}
                  onCheckedChange={(checked) =>
                    setLanguages(languages.map((l) =>
                      l.code === lang.code ? { ...l, enabled: checked } : l
                    ))
                  }
                />
              </div>
            </div>
          ))}
          <Separator />
          <div className="space-y-2">
            <Label>Язык по умолчанию</Label>
            <Select value={defaultLang} onValueChange={setDefaultLang}>
              <SelectTrigger className="w-full md:w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                {languages.filter((l) => l.enabled).map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Переводы интерфейса (i18n)</CardTitle>
              <CardDescription>{translations.length} ключей</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FileJson className="w-4 h-4 mr-1.5" />
                Импорт JSON
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1.5" />
                Экспорт JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Поиск по ключам..."
                value={translationSearch}
                onChange={(e) => setTranslationSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="overflow-x-auto -mx-6">
            <div className="min-w-[640px] px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white z-10 font-medium">Ключ</TableHead>
                    <TableHead className="font-medium">RU</TableHead>
                    <TableHead className="font-medium">UZ (Лат)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTranslations.map((t) => (
                    <TableRow key={t.key}>
                      <TableCell className="sticky left-0 bg-white z-10 font-mono text-xs text-gray-600">
                        {t.key}
                      </TableCell>
                      <TableCell className="text-sm">{t.ru}</TableCell>
                      <TableCell className="text-sm">{t.uzLat}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── SECTION 3: Интеграции ───────────────────────────────────────────────────

function IntegrationsSection() {
  const [integrations, setIntegrations] = React.useState<IntegrationConfig[]>(mockIntegrations);
  const [openIds, setOpenIds] = React.useState<Set<string>>(new Set(["int-1c"]));

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEnabled = (id: string, enabled: boolean) => {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, enabled } : i))
    );
  };

  const renderFields = (integration: IntegrationConfig) => {
    const { type, config } = integration;

    switch (type) {
      case "1c":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>URL</Label>
                <Input value={config.url} readOnly />
              </div>
              <div className="space-y-2">
                <Label>API-ключ</Label>
                <Input value={config.apiKey} readOnly />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Частота синхронизации (мин)</Label>
                <Select defaultValue={config.syncFrequency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 минут</SelectItem>
                    <SelectItem value="15">15 минут</SelectItem>
                    <SelectItem value="30">30 минут</SelectItem>
                    <SelectItem value="60">1 час</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Последняя синхронизация</Label>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-sm text-gray-600">
                    {integration.lastSync
                      ? format(new Date(integration.lastSync), "dd.MM.yyyy HH:mm", { locale: ru })
                      : "—"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.success("Синхронизация запущена")}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Запустить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case "sms":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Провайдер</Label>
                <Select defaultValue={config.provider}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SMS_PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>API-ключ</Label>
                <Input value={config.apiKey} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Sender ID</Label>
                <Input value={config.senderId} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Тестовое SMS</Label>
                <div className="flex gap-2">
                  <Input placeholder="+998 XX XXX-XX-XX" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => toast.success("Тестовое SMS отправлено")}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case "email":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SMTP Host</Label>
                <Input value={config.host} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input value={config.port} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={config.username} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input value={config.password} type="password" readOnly />
              </div>
              <div className="space-y-2">
                <Label>From</Label>
                <Input value={config.from} readOnly />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={config.tls === "true"} />
                <Label>TLS</Label>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full md:w-auto"
              onClick={() => toast.success("Тестовое письмо отправлено")}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Отправить тестовое письмо
            </Button>
          </div>
        );

      case "telegram":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Token</Label>
                <Input value={config.token} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Webhook</Label>
                <Input value={config.webhook} readOnly />
              </div>
            </div>
            <Button variant="link" size="sm" className="px-0 text-blue-600" onClick={() => {}}>
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Перейти к настройкам Telegram
            </Button>
          </div>
        );

      case "ga":
        return (
          <div className="space-y-2">
            <Label>Measurement ID</Label>
            <Input placeholder="G-XXXXXXXXXX" value={config.measurementId} />
          </div>
        );

      case "yandex":
        return (
          <div className="space-y-2">
            <Label>Counter ID</Label>
            <Input placeholder="12345678" value={config.counterId} />
          </div>
        );

      case "sentry":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>DSN</Label>
                <Input value={config.dsn} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Environment</Label>
                <Input value={config.environment} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Traces Sample Rate</Label>
                <Input value={config.tracesSampleRate} readOnly />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {integrations.map((integration) => (
        <Collapsible
          key={integration.id}
          open={openIds.has(integration.id)}
          onOpenChange={() => toggle(integration.id)}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg">
                <div className="flex items-center gap-3">
                  {openIds.has(integration.id) ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="font-medium">{integration.name}</span>
                  <Badge
                    variant={integration.enabled ? "default" : "secondary"}
                    className={cn(
                      "text-xs",
                      integration.enabled
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : ""
                    )}
                  >
                    {integration.enabled ? "Активна" : "Отключена"}
                  </Badge>
                </div>
                <Switch
                  checked={integration.enabled}
                  onCheckedChange={(checked) => toggleEnabled(integration.id, checked)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 pt-0">
                <Separator className="mb-4" />
                {renderFields(integration)}
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.success(`${integration.name}: подключение проверено`)}
                  >
                    Тестировать
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90"
                    onClick={() => toast.success(`${integration.name}: настройки сохранены`)}
                  >
                    Сохранить
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}

// ─── SECTION 4: Безопасность ─────────────────────────────────────────────────

function SecuritySection() {
  const [password, setPassword] = React.useState<PasswordPolicy>(mockPasswordPolicy);
  const [session, setSession] = React.useState<SessionPolicy>(mockSessionPolicy);
  const [access, setAccess] = React.useState<AccessPolicy>(mockAccessPolicy);

  const allRoles = ["Superadmin", "Admin", "Operator", "Agent"];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Политика паролей</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Минимальная длина: {password.minLength}</Label>
            </div>
            <Slider
              value={[password.minLength]}
              onValueChange={([v]) => setPassword({ ...password, minLength: v })}
              min={8}
              max={32}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>8</span>
              <span>32</span>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            {[
              { key: "requireUppercase" as const, label: "Заглавные буквы (A-Z)" },
              { key: "requireLowercase" as const, label: "Строчные буквы (a-z)" },
              { key: "requireDigits" as const, label: "Цифры (0-9)" },
              { key: "requireSpecial" as const, label: "Спецсимволы (!@#$...)" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="font-normal">{label}</Label>
                <Switch
                  checked={password[key]}
                  onCheckedChange={(checked) => setPassword({ ...password, [key]: checked })}
                />
              </div>
            ))}
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Срок действия (дней)</Label>
              <Input
                type="number"
                value={password.expirationDays}
                onChange={(e) => setPassword({ ...password, expirationDays: Number(e.target.value) })}
              />
              <p className="text-xs text-gray-400">0 = бессрочный</p>
            </div>
            <div className="space-y-2">
              <Label>История паролей (последних N)</Label>
              <Input
                type="number"
                value={password.historyCount}
                onChange={(e) => setPassword({ ...password, historyCount: Number(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Сессии</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Тайм-аут сессии (мин)</Label>
            <Input
              type="number"
              value={session.timeoutMinutes}
              onChange={(e) => setSession({ ...session, timeoutMinutes: Number(e.target.value) })}
              className="w-full md:w-48"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="font-normal">Одна активная сессия на пользователя</Label>
            <Switch
              checked={session.singleSession}
              onCheckedChange={(checked) => setSession({ ...session, singleSession: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="font-normal">Уведомлять о входе с нового устройства</Label>
            <Switch
              checked={session.notifyNewDevice}
              onCheckedChange={(checked) => setSession({ ...session, notifyNewDevice: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Доступ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>IP-белый список</Label>
            <Textarea
              rows={4}
              value={access.ipWhitelist}
              onChange={(e) => setAccess({ ...access, ipWhitelist: e.target.value })}
              placeholder="Один IP/CIDR на строку"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-400">Один IP или CIDR-диапазон на строку</p>
          </div>

          <div className="space-y-2">
            <Label>Принудительная 2FA для ролей</Label>
            <div className="flex flex-wrap gap-2">
              {allRoles.map((role) => (
                <button
                  key={role}
                  onClick={() =>
                    setAccess({
                      ...access,
                      forced2faRoles: access.forced2faRoles.includes(role)
                        ? access.forced2faRoles.filter((r) => r !== role)
                        : [...access.forced2faRoles, role],
                    })
                  }
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    access.forced2faRoles.includes(role)
                      ? "bg-[#FFD60A] text-black"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-normal">Защита от брутфорса</Label>
              <Switch
                checked={access.bruteForceEnabled}
                onCheckedChange={(checked) => setAccess({ ...access, bruteForceEnabled: checked })}
              />
            </div>
            {access.bruteForceEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-0 md:pl-4">
                <div className="space-y-2">
                  <Label>Макс. попыток</Label>
                  <Input
                    type="number"
                    value={access.bruteForceMaxAttempts}
                    onChange={(e) =>
                      setAccess({ ...access, bruteForceMaxAttempts: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Блокировка (мин)</Label>
                  <Input
                    type="number"
                    value={access.bruteForceLockMinutes}
                    onChange={(e) =>
                      setAccess({ ...access, bruteForceLockMinutes: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <StickyBar onSave={() => toast.success("Настройки безопасности сохранены")} />
    </div>
  );
}

// ─── SECTION 5: API и Webhooks ───────────────────────────────────────────────

function ApiSection() {
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>(mockApiKeys);
  const [webhooks, setWebhooks] = React.useState<Webhook[]>(mockWebhooks);
  const [createKeyOpen, setCreateKeyOpen] = React.useState(false);
  const [createWebhookOpen, setCreateWebhookOpen] = React.useState(false);
  const [deliveryDrawer, setDeliveryDrawer] = React.useState<Webhook | null>(null);

  const [newKeyName, setNewKeyName] = React.useState("");
  const [newKeyScopes, setNewKeyScopes] = React.useState<string[]>([]);
  const [newKeyExpiration, setNewKeyExpiration] = React.useState("90");

  const [newWhName, setNewWhName] = React.useState("");
  const [newWhUrl, setNewWhUrl] = React.useState("");
  const [newWhEvents, setNewWhEvents] = React.useState<string[]>([]);

  const handleCreateKey = () => {
    const key: ApiKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      key: `txm_new_sk_${"•".repeat(20)}`,
      scopes: newKeyScopes,
      createdAt: new Date().toISOString().split("T")[0],
      lastUsed: null,
      status: "active",
    };
    setApiKeys([key, ...apiKeys]);
    setCreateKeyOpen(false);
    setNewKeyName("");
    setNewKeyScopes([]);
    toast.success("API-ключ создан");
  };

  const handleCreateWebhook = () => {
    const wh: Webhook = {
      id: `wh-${Date.now()}`,
      name: newWhName,
      url: newWhUrl,
      events: newWhEvents,
      secret: `whsec_${"•".repeat(16)}`,
      retryPolicy: "3 попытки, 30с интервал",
      status: "active",
      lastDelivery: null,
      deliveryHistory: [],
    };
    setWebhooks([wh, ...webhooks]);
    setCreateWebhookOpen(false);
    setNewWhName("");
    setNewWhUrl("");
    setNewWhEvents([]);
    toast.success("Webhook создан");
  };

  return (
    <div className="space-y-6">
      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">API-ключи</CardTitle>
            <Button
              size="sm"
              className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90"
              onClick={() => setCreateKeyOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Создать ключ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Ключ</TableHead>
                  <TableHead>Права</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead>Последнее использование</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">{k.key}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {k.scopes.slice(0, 2).map((s) => (
                          <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                        ))}
                        {k.scopes.length > 2 && (
                          <Badge variant="outline" className="text-[10px]">+{k.scopes.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{k.createdAt}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {k.lastUsed
                        ? format(new Date(k.lastUsed), "dd.MM.yyyy HH:mm", { locale: ru })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "text-xs",
                          k.status === "active"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-red-100 text-red-700 hover:bg-red-100"
                        )}
                      >
                        {k.status === "active" ? "Активен" : "Отозван"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.success("Ключ скопирован")}>
                            <Copy className="w-4 h-4 mr-2" /> Копировать
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.success("Ключ ротирован")}>
                            <RotateCcw className="w-4 h-4 mr-2" /> Ротировать
                          </DropdownMenuItem>
                          {k.status === "active" && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setApiKeys(apiKeys.map((ak) =>
                                  ak.id === k.id ? { ...ak, status: "revoked" as const } : ak
                                ));
                                toast.success("Ключ отозван");
                              }}
                            >
                              <X className="w-4 h-4 mr-2" /> Отозвать
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {apiKeys.map((k) => (
              <div key={k.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{k.name}</span>
                  <Badge
                    className={cn(
                      "text-xs",
                      k.status === "active"
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : "bg-red-100 text-red-700 hover:bg-red-100"
                    )}
                  >
                    {k.status === "active" ? "Активен" : "Отозван"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {k.scopes.map((s) => (
                    <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Создан: {k.createdAt}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast.success("Ключ скопирован")}>
                        <Copy className="w-4 h-4 mr-2" /> Копировать
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.success("Ключ ротирован")}>
                        <RotateCcw className="w-4 h-4 mr-2" /> Ротировать
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">Исходящие Webhooks</CardTitle>
            <Button
              size="sm"
              className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90"
              onClick={() => setCreateWebhookOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Создать webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>События</TableHead>
                  <TableHead>Secret</TableHead>
                  <TableHead>Retry</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Последняя доставка</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((wh) => (
                  <TableRow
                    key={wh.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setDeliveryDrawer(wh)}
                  >
                    <TableCell className="font-medium">{wh.name}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-500 max-w-[200px] truncate">
                      {wh.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {wh.events.slice(0, 2).map((e) => (
                          <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                        ))}
                        {wh.events.length > 2 && (
                          <Badge variant="outline" className="text-[10px]">+{wh.events.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">{wh.secret}</TableCell>
                    <TableCell className="text-xs text-gray-600">{wh.retryPolicy}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "text-xs",
                          wh.status === "active"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {wh.status === "active" ? "Активен" : "Неактивен"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {wh.lastDelivery
                        ? format(new Date(wh.lastDelivery), "dd.MM HH:mm", { locale: ru })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="border rounded-lg p-3 space-y-2 cursor-pointer hover:bg-gray-50"
                onClick={() => setDeliveryDrawer(wh)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{wh.name}</span>
                  <Badge
                    className={cn(
                      "text-xs",
                      wh.status === "active"
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {wh.status === "active" ? "Активен" : "Неактивен"}
                  </Badge>
                </div>
                <p className="font-mono text-xs text-gray-500 truncate">{wh.url}</p>
                <div className="flex flex-wrap gap-1">
                  {wh.events.map((e) => (
                    <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Swagger link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Документация API</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full md:w-auto">
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Открыть Swagger / OpenAPI
          </Button>
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={createKeyOpen} onOpenChange={setCreateKeyOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать API-ключ</DialogTitle>
            <DialogDescription>Укажите название и права доступа для нового ключа</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Например: Mobile App"
              />
            </div>
            <div className="space-y-2">
              <Label>Права доступа (scopes)</Label>
              <div className="flex flex-wrap gap-2">
                {API_SCOPES.map((scope) => (
                  <button
                    key={scope}
                    onClick={() =>
                      setNewKeyScopes(
                        newKeyScopes.includes(scope)
                          ? newKeyScopes.filter((s) => s !== scope)
                          : [...newKeyScopes, scope]
                      )
                    }
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      newKeyScopes.includes(scope)
                        ? "bg-[#FFD60A] text-black"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Срок действия (дней)</Label>
              <Select value={newKeyExpiration} onValueChange={setNewKeyExpiration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 дней</SelectItem>
                  <SelectItem value="90">90 дней</SelectItem>
                  <SelectItem value="180">180 дней</SelectItem>
                  <SelectItem value="365">1 год</SelectItem>
                  <SelectItem value="0">Бессрочный</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateKeyOpen(false)}>Отменить</Button>
            <Button
              className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90"
              disabled={!newKeyName || newKeyScopes.length === 0}
              onClick={handleCreateKey}
            >
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Webhook Dialog */}
      <Dialog open={createWebhookOpen} onOpenChange={setCreateWebhookOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать Webhook</DialogTitle>
            <DialogDescription>Укажите URL и события для нового webhook</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={newWhName}
                onChange={(e) => setNewWhName(e.target.value)}
                placeholder="Например: CRM Integration"
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={newWhUrl}
                onChange={(e) => setNewWhUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Подписка на события</Label>
              <div className="flex flex-wrap gap-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <button
                    key={event}
                    onClick={() =>
                      setNewWhEvents(
                        newWhEvents.includes(event)
                          ? newWhEvents.filter((e) => e !== event)
                          : [...newWhEvents, event]
                      )
                    }
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      newWhEvents.includes(event)
                        ? "bg-[#FFD60A] text-black"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {event}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateWebhookOpen(false)}>Отменить</Button>
            <Button
              className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90"
              disabled={!newWhName || !newWhUrl || newWhEvents.length === 0}
              onClick={handleCreateWebhook}
            >
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery History Drawer */}
      <Sheet open={!!deliveryDrawer} onOpenChange={() => setDeliveryDrawer(null)}>
        <SheetContent className="w-full sm:max-w-[720px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              История доставки — {deliveryDrawer?.name}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {deliveryDrawer?.deliveryHistory.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Нет записей</p>
                <p className="text-sm">Доставки пока не выполнялись</p>
              </div>
            )}
            {deliveryDrawer?.deliveryHistory.map((d) => (
              <div key={d.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{d.event}</Badge>
                  <span className="text-xs text-gray-500">
                    {format(new Date(d.timestamp), "dd.MM.yyyy HH:mm:ss", { locale: ru })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Badge
                    className={cn(
                      "text-xs",
                      d.responseCode < 400
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : "bg-red-100 text-red-700 hover:bg-red-100"
                    )}
                  >
                    {d.responseCode}
                  </Badge>
                  {d.retries > 0 && (
                    <span className="text-xs text-amber-600">{d.retries} повтор(а)</span>
                  )}
                </div>
                <pre className="bg-gray-50 rounded p-2 text-xs font-mono overflow-x-auto">
                  {d.payload}
                </pre>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── SECTION 6: Резервное копирование ────────────────────────────────────────

function BackupSection() {
  const [schedule, setSchedule] = React.useState<BackupSchedule>(mockBackupSchedule);
  const [backups, setBackups] = React.useState<BackupEntry[]>(mockBackups);
  const [confirmRestore, setConfirmRestore] = React.useState<BackupEntry | null>(null);
  const [confirmText, setConfirmText] = React.useState("");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Расписание</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Периодичность</Label>
              <Select
                value={schedule.frequency}
                onValueChange={(v) => setSchedule({ ...schedule, frequency: v as BackupSchedule["frequency"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BACKUP_FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Время</Label>
              <Input
                type="time"
                value={schedule.time}
                onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Хранить (дней)</Label>
              <Input
                type="number"
                value={schedule.retentionDays}
                onChange={(e) => setSchedule({ ...schedule, retentionDays: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Хранилище</Label>
              <Select
                value={schedule.storage}
                onValueChange={(v) => setSchedule({ ...schedule, storage: v as BackupSchedule["storage"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BACKUP_STORAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">Доступные бэкапы</CardTitle>
            <Button
              size="sm"
              className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90"
              onClick={() => {
                const entry: BackupEntry = {
                  id: `bkp-${Date.now()}`,
                  date: new Date().toISOString(),
                  size: "—",
                  type: "manual",
                  status: "in_progress",
                };
                setBackups([entry, ...backups]);
                toast.success("Бэкап запущен");
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Создать бэкап
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата/время</TableHead>
                  <TableHead>Размер</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-sm">
                      {format(new Date(b.date), "dd.MM.yyyy HH:mm", { locale: ru })}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{b.size}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {b.type === "auto" ? "Авто" : "Ручной"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "text-xs",
                          b.status === "success" && "bg-green-100 text-green-700 hover:bg-green-100",
                          b.status === "in_progress" && "bg-blue-100 text-blue-700 hover:bg-blue-100",
                          b.status === "error" && "bg-red-100 text-red-700 hover:bg-red-100"
                        )}
                      >
                        {b.status === "success" ? "Успешно" : b.status === "in_progress" ? "В процессе" : "Ошибка"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={b.status !== "success"}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Скачать</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={b.status !== "success"}
                              onClick={() => setConfirmRestore(b)}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Восстановить</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => {
                                setBackups(backups.filter((bk) => bk.id !== b.id));
                                toast.success("Бэкап удалён");
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Удалить</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {backups.map((b) => (
              <div key={b.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {format(new Date(b.date), "dd.MM.yyyy HH:mm", { locale: ru })}
                  </span>
                  <Badge
                    className={cn(
                      "text-xs",
                      b.status === "success" && "bg-green-100 text-green-700 hover:bg-green-100",
                      b.status === "in_progress" && "bg-blue-100 text-blue-700 hover:bg-blue-100",
                      b.status === "error" && "bg-red-100 text-red-700 hover:bg-red-100"
                    )}
                  >
                    {b.status === "success" ? "Успешно" : b.status === "in_progress" ? "В процессе" : "Ошибка"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{b.size} · {b.type === "auto" ? "Авто" : "Ручной"}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={b.status !== "success"}>
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={b.status !== "success"}
                      onClick={() => setConfirmRestore(b)}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500"
                      onClick={() => {
                        setBackups(backups.filter((bk) => bk.id !== b.id));
                        toast.success("Бэкап удалён");
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <StickyBar onSave={() => toast.success("Расписание бэкапов сохранено")} />

      {/* Restore Confirmation Dialog (Pattern G) */}
      <Dialog open={!!confirmRestore} onOpenChange={() => { setConfirmRestore(null); setConfirmText(""); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Восстановление из бэкапа
            </DialogTitle>
            <DialogDescription>
              Это действие заменит текущие данные данными из бэкапа{" "}
              <span className="font-mono font-medium">{confirmRestore?.id}</span> от{" "}
              {confirmRestore && format(new Date(confirmRestore.date), "dd.MM.yyyy HH:mm", { locale: ru })}.
              Это действие необратимо.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>
              Введите <span className="font-mono font-medium">{confirmRestore?.id}</span> для подтверждения
            </Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={confirmRestore?.id}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmRestore(null); setConfirmText(""); }}>
              Отменить
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== confirmRestore?.id}
              onClick={() => {
                setConfirmRestore(null);
                setConfirmText("");
                toast.success("Восстановление запущено");
              }}
            >
              Восстановить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Shared: Sticky save bar ─────────────────────────────────────────────────

function StickyBar({ onSave }: { onSave: () => void }) {
  return (
    <div className="sticky bottom-0 bg-white border-t py-3 px-4 -mx-4 flex justify-end gap-3 z-10">
      <Button variant="outline">Отменить</Button>
      <Button className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90" onClick={onSave}>
        Сохранить
      </Button>
    </div>
  );
}

// ─── Main Settings Page ──────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeSection, setActiveSection] = React.useState<SectionId>("general");

  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return <GeneralSection />;
      case "localization":
        return <LocalizationSection />;
      case "integrations":
        return <IntegrationsSection />;
      case "security":
        return <SecuritySection />;
      case "api":
        return <ApiSection />;
      case "backup":
        return <BackupSection />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-gray-900 pt-3">Настройки</h1>
        <p className="text-sm text-gray-500 mt-1">Системные настройки платформы</p>
      </div>

      {/* Mobile: Select dropdown (sm) */}
      <div className="sm:hidden">
        <Select value={activeSection} onValueChange={(v) => setActiveSection(v as SectionId)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NAV_ITEMS.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tablet: Horizontal tabs (sm–lg) */}
      <div className="hidden sm:flex lg:hidden overflow-x-auto gap-1 pb-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                activeSection === item.id
                  ? "bg-[#FFD60A] text-black"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Desktop: Two-column layout with left rail */}
      <div className="flex gap-6">
        {/* Left rail — hidden below lg */}
        <nav className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-0 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors",
                    activeSection === item.id
                      ? "bg-[#FFD60A] text-black"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
