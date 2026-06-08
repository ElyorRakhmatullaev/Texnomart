"use client";

import * as React from "react";
import {
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Send,
  Plus,
  Trash2,
  GripVertical,
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Users,
  BarChart3,
  Bot,
  Clock,
  Calendar,
  Globe,
  Check,
  X,
  Ban,
  RotateCw,
  Zap,
  HelpCircle,
  Link2,
  Variable,
  Filter,
  Edit3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@texnomart/ui/card";
import { Button } from "@texnomart/ui/button";
import { Badge } from "@texnomart/ui/badge";
import { Switch } from "@texnomart/ui/switch";
import { Label } from "@texnomart/ui/label";
import { Input } from "@texnomart/ui/input";
import { Textarea } from "@texnomart/ui/textarea";
import { Separator } from "@texnomart/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@texnomart/ui/tabs";
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
} from "@texnomart/ui/dialog";
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
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@texnomart/ui/tooltip";
import {
  BOT_CONFIG,
  MESSAGE_TEMPLATES,
  BROADCASTS,
  SUBSCRIBERS,
  TELEGRAM_KPIS,
  FUNNEL_DATA,
  TOP_COMMANDS,
  DAU_MAU_DATA,
  RETENTION_DATA,
  FAQ_ITEMS,
  AUTO_REPLY_RULES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_VARIABLES,
  BROADCAST_STATUS_CONFIG,
  type TemplateCategory,
  type MessageTemplate,
  type Broadcast,
  type Subscriber,
  type FaqItem,
  type AutoReplyRule,
  type BotCommand,
} from "@/lib/telegram-mock-data";

// ─── Settings Tab ────────────────────────────────────────────────────────────

function SettingsTab() {
  const [showToken, setShowToken] = React.useState(false);
  const [botEnabled, setBotEnabled] = React.useState(BOT_CONFIG.isEnabled);
  const [webhookStatus, setWebhookStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [welcomeLang, setWelcomeLang] = React.useState("ru");
  const [commands, setCommands] = React.useState<BotCommand[]>(BOT_CONFIG.commands);
  const [welcomeText, setWelcomeText] = React.useState(BOT_CONFIG.welcomeMessages.ru);
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);

  const maskedToken = BOT_CONFIG.token.slice(0, 10) + "•".repeat(30);

  const handleCheckWebhook = () => {
    setWebhookStatus("idle");
    setTimeout(() => setWebhookStatus("success"), 800);
  };

  const handleWelcomeLangChange = (lang: string) => {
    setWelcomeLang(lang);
    setWelcomeText(BOT_CONFIG.welcomeMessages[lang] || "");
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...commands];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    setCommands(updated);
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  return (
    <div className="space-y-6">
      {/* Connection */}
      <Card>
        <CardHeader><CardTitle className="text-base">Подключение</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Bot Token</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={showToken ? BOT_CONFIG.token : maskedToken}
                className="font-mono text-sm flex-1"
              />
              <Button variant="ghost" size="icon" onClick={() => setShowToken(!showToken)}>
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(BOT_CONFIG.token)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon"><RotateCw className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Webhook URL</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={BOT_CONFIG.webhookUrl} className="font-mono text-sm flex-1" />
              <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(BOT_CONFIG.webhookUrl)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleCheckWebhook}>
              <Zap className="h-4 w-4 mr-2" />Проверить webhook
            </Button>
            {webhookStatus === "success" && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Check className="h-4 w-4" />Webhook активен
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Welcome Message */}
      <Card>
        <CardHeader><CardTitle className="text-base">Приветствие</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <Tabs value={welcomeLang} onValueChange={handleWelcomeLangChange}>
                <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-10">
                  <TabsTrigger value="ru" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent">RU</TabsTrigger>
                  <TabsTrigger value="uz" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent">O'zbek</TabsTrigger>
                </TabsList>
              </Tabs>
              <Textarea
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.slice(0, 4).map((v) => (
                  <Badge key={v.variable} variant="outline" className="cursor-pointer text-xs font-mono">
                    {v.variable}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="lg:w-80 w-full">
              <div className="bg-[#1B2836] rounded-xl p-4 text-white text-sm">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                  <Bot className="h-5 w-5 text-[#FFD60A]" />
                  <span className="font-medium">Texnomart Bot</span>
                </div>
                <div className="bg-[#2B5278] rounded-lg rounded-tl-none p-3 text-[13px] leading-relaxed whitespace-pre-line">
                  {welcomeText}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bot Commands */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Меню бота (команды)</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />Добавить
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {commands.map((cmd, idx) => (
              <div
                key={cmd.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-lg border ${dragIdx === idx ? "border-[#FFD60A] bg-yellow-50" : "border-transparent hover:bg-gray-50"} cursor-grab`}
              >
                <GripVertical className="h-4 w-4 text-gray-400 shrink-0" />
                <code className="text-sm font-medium text-blue-600 w-28 shrink-0">{cmd.command}</code>
                <span className="text-sm text-gray-600 flex-1">{cmd.description}</span>
                <Switch
                  checked={cmd.enabled}
                  onCheckedChange={(checked) => {
                    const updated = [...commands];
                    updated[idx] = { ...cmd, enabled: checked };
                    setCommands(updated);
                  }}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Templates Tab ───────────────────────────────────────────────────────────

function TemplatesTab() {
  const [category, setCategory] = React.useState<TemplateCategory>("all");
  const [selectedTemplate, setSelectedTemplate] = React.useState<MessageTemplate | null>(null);
  const [editLang, setEditLang] = React.useState("ru");

  const filtered = category === "all"
    ? MESSAGE_TEMPLATES
    : MESSAGE_TEMPLATES.filter((t) => t.category === category);

  return (
    <div className="space-y-6">
      <Tabs value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-10 w-full justify-start overflow-x-auto">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <TabsTrigger
              key={cat.value}
              value={cat.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent whitespace-nowrap"
            >
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => { setSelectedTemplate(template); setEditLang("ru"); }}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-sm leading-tight">{template.name}</h3>
                <div className="flex gap-1 shrink-0 ml-2">
                  {template.languages.map((lang) => (
                    <Badge key={lang} variant="outline" className="text-[10px] px-1.5 py-0">{lang}</Badge>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{template.preview}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{template.editedBy}</span>
                <span>{template.lastEdited}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <Tabs value={editLang} onValueChange={setEditLang}>
                <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-10">
                  <TabsTrigger value="ru" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent">RU</TabsTrigger>
                  <TabsTrigger value="uz" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent">UZ (Кир.)</TabsTrigger>
                  <TabsTrigger value="uz_lat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent">UZ (Лат.)</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  <Textarea
                    defaultValue={selectedTemplate.content[editLang] || ""}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Переменные</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {TEMPLATE_VARIABLES.map((v) => (
                        <UITooltip key={v.variable}>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="cursor-pointer text-xs font-mono hover:bg-gray-100">
                              {v.variable}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>{v.description}</TooltipContent>
                        </UITooltip>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="lg:w-72">
                  <div className="bg-[#1B2836] rounded-xl p-4 text-white text-sm">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                      <Bot className="h-5 w-5 text-[#FFD60A]" />
                      <span className="font-medium">Texnomart Bot</span>
                    </div>
                    <div className="bg-[#2B5278] rounded-lg rounded-tl-none p-3 text-[13px] leading-relaxed whitespace-pre-line">
                      {selectedTemplate.content[editLang] || "Перевод не добавлен"}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Тестовая отправка</Label>
                <div className="flex gap-2">
                  <Input placeholder="@username или номер телефона" className="flex-1" />
                  <Button variant="outline">
                    <Send className="h-4 w-4 mr-2" />Отправить тест
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>Отмена</Button>
            <Button className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90">Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Broadcasts Tab ──────────────────────────────────────────────────────────

function BroadcastsTab() {
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [createStep, setCreateStep] = React.useState(1);

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs uppercase text-gray-500 font-medium">Название</TableHead>
              <TableHead className="text-xs uppercase text-gray-500 font-medium">Сегмент</TableHead>
              <TableHead className="text-xs uppercase text-gray-500 font-medium">Шаблон</TableHead>
              <TableHead className="text-xs uppercase text-gray-500 font-medium">Запланировано</TableHead>
              <TableHead className="text-xs uppercase text-gray-500 font-medium">Прогресс</TableHead>
              <TableHead className="text-xs uppercase text-gray-500 font-medium text-right tabular-nums">Доставл.</TableHead>
              <TableHead className="text-xs uppercase text-gray-500 font-medium text-right tabular-nums">Прочит.</TableHead>
              <TableHead className="text-xs uppercase text-gray-500 font-medium text-right tabular-nums">Кликов</TableHead>
              <TableHead className="text-xs uppercase text-gray-500 font-medium">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BROADCASTS.map((bc) => {
              const cfg = BROADCAST_STATUS_CONFIG[bc.status];
              const progress = bc.totalCount > 0 ? (bc.sentCount / bc.totalCount) * 100 : 0;
              return (
                <TableRow key={bc.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-sm">{bc.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{bc.segment}</Badge></TableCell>
                  <TableCell className="text-sm text-blue-600">{bc.templateName}</TableCell>
                  <TableCell className="text-sm text-gray-600">{bc.scheduledAt || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FFD60A] rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">{bc.sentCount.toLocaleString("ru-RU")} / {bc.totalCount.toLocaleString("ru-RU")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{bc.deliveredPercent > 0 ? `${bc.deliveredPercent}%` : "—"}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{bc.readPercent > 0 ? `${bc.readPercent}%` : "—"}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{bc.clickCount > 0 ? bc.clickCount.toLocaleString("ru-RU") : "—"}</TableCell>
                  <TableCell><Badge className={`${cfg.className} text-xs`}>{cfg.label}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {BROADCASTS.map((bc) => {
          const cfg = BROADCAST_STATUS_CONFIG[bc.status];
          const progress = bc.totalCount > 0 ? (bc.sentCount / bc.totalCount) * 100 : 0;
          return (
            <Card key={bc.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-sm">{bc.name}</h3>
                  <Badge className={`${cfg.className} text-xs shrink-0`}>{cfg.label}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FFD60A] rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 tabular-nums">{bc.sentCount.toLocaleString("ru-RU")} / {bc.totalCount.toLocaleString("ru-RU")}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-gray-500">Доставл.</div>
                    <div className="text-sm font-medium tabular-nums">{bc.deliveredPercent > 0 ? `${bc.deliveredPercent}%` : "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Прочит.</div>
                    <div className="text-sm font-medium tabular-nums">{bc.readPercent > 0 ? `${bc.readPercent}%` : "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Кликов</div>
                    <div className="text-sm font-medium tabular-nums">{bc.clickCount > 0 ? bc.clickCount.toLocaleString("ru-RU") : "—"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Broadcast Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) setCreateStep(1); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать рассылку</DialogTitle>
          </DialogHeader>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === createStep ? "bg-[#FFD60A] text-black" : step < createStep ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {step < createStep ? <Check className="h-4 w-4" /> : step}
                </div>
                {step < 5 && <div className={`w-8 h-0.5 ${step < createStep ? "bg-green-500" : "bg-gray-200"}`} />}
              </React.Fragment>
            ))}
          </div>
          <div className="text-center text-sm text-gray-500 mb-4">
            {createStep === 1 && "Шаг 1 из 5 — Аудитория"}
            {createStep === 2 && "Шаг 2 из 5 — Шаблон"}
            {createStep === 3 && "Шаг 3 из 5 — Время отправки"}
            {createStep === 4 && "Шаг 4 из 5 — A/B тест (необязательно)"}
            {createStep === 5 && "Шаг 5 из 5 — Превью и подтверждение"}
          </div>

          {createStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Сегмент аудитории</Label>
                <Select defaultValue="all">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все подписчики</SelectItem>
                    <SelectItem value="active">С активными договорами</SelectItem>
                    <SelectItem value="overdue">С просрочкой</SelectItem>
                    <SelectItem value="inactive">Неактивные 30+ дней</SelectItem>
                    <SelectItem value="region">По региону</SelectItem>
                    <SelectItem value="completed">Завершившие сделку</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Размер аудитории</div>
                <div className="text-2xl font-semibold tabular-nums">8 423</div>
                <div className="text-xs text-gray-500">подписчиков соответствуют критериям</div>
              </div>
            </div>
          )}
          {createStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Выберите шаблон</Label>
                <Select defaultValue="tpl-8">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MESSAGE_TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-[#1B2836] rounded-xl p-4 text-white text-sm">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                  <Bot className="h-5 w-5 text-[#FFD60A]" />
                  <span className="font-medium">Превью</span>
                </div>
                <div className="bg-[#2B5278] rounded-lg rounded-tl-none p-3 text-[13px] leading-relaxed">
                  {MESSAGE_TEMPLATES[7].content.ru}
                </div>
              </div>
            </div>
          )}
          {createStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Когда отправить</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="sendTime" value="now" defaultChecked className="accent-[#FFD60A]" />
                    <div>
                      <div className="text-sm font-medium">Сейчас</div>
                      <div className="text-xs text-gray-500">Отправить немедленно</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="sendTime" value="scheduled" className="accent-[#FFD60A]" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Запланировать</div>
                      <div className="text-xs text-gray-500">Выберите дату и время</div>
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs text-gray-500">Дата</Label>
                  <Input type="date" defaultValue="2026-06-01" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs text-gray-500">Время</Label>
                  <Input type="time" defaultValue="10:00" />
                </div>
              </div>
            </div>
          )}
          {createStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">A/B тестирование</div>
                  <div className="text-xs text-gray-500">Сравните два варианта сообщения</div>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Вариант A (50%)</Label>
                  <Textarea placeholder="Текст варианта A..." rows={4} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Вариант B (50%)</Label>
                  <Textarea placeholder="Текст варианта B..." rows={4} />
                </div>
              </div>
            </div>
          )}
          {createStep === 5 && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Аудитория</span>
                  <span className="font-medium">Все подписчики (8 423)</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Шаблон</span>
                  <span className="font-medium">Акция: Электроника</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Отправка</span>
                  <span className="font-medium">Сейчас</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">A/B тест</span>
                  <span className="font-medium">Нет</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {createStep > 1 && (
              <Button variant="ghost" onClick={() => setCreateStep(createStep - 1)}>Назад</Button>
            )}
            <div className="flex-1" />
            {createStep < 5 ? (
              <Button className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90" onClick={() => setCreateStep(createStep + 1)}>
                Далее
              </Button>
            ) : (
              <Button className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90" onClick={() => setShowCreateDialog(false)}>
                <Send className="h-4 w-4 mr-2" />Отправить
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating CTA for mobile */}
      <Button
        className="md:hidden fixed bottom-6 right-6 bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90 shadow-lg rounded-full h-14 w-14 p-0"
        onClick={() => setShowCreateDialog(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}

// ─── Subscribers Tab ─────────────────────────────────────────────────────────

function SubscribersTab() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filtered = SUBSCRIBERS.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.username.toLowerCase().includes(q) || s.displayName.toLowerCase().includes(q) || (s.linkedClientName?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск по username или имени..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="subscribed">Подписан</SelectItem>
            <SelectItem value="blocked">Заблокирован</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-xs uppercase text-gray-500 font-medium w-10" />
              <TableHead className="text-xs uppercase text-gray-500 font-medium">Username</TableHead>
              <TableHead className="text-xs uppercase text-gray-500 font-medium">Клиент</TableHead>
              <TableHead className="text-xs uppercase text-gray-500 font-medium">Подписка</TableHead>
              <TableHead className="text-xs uppercase text-gray-500 font-medium">Последняя актив.</TableHead>
              <TableHead className="text-xs uppercase text-gray-500 font-medium text-right tabular-nums">Сообщений</TableHead>
              <TableHead className="text-xs uppercase text-gray-500 font-medium">Статус</TableHead>
              <TableHead className="text-xs uppercase text-gray-500 font-medium w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((sub) => (
              <TableRow key={sub.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                    {sub.displayName.charAt(0)}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-sm text-blue-600">{sub.username}</TableCell>
                <TableCell className="text-sm">
                  {sub.linkedClientName ? (
                    <span className="text-gray-900">{sub.linkedClientName} <span className="text-gray-400 text-xs">({sub.linkedClientId})</span></span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-600">{sub.subscribedAt}</TableCell>
                <TableCell className="text-sm text-gray-600">{sub.lastActivity}</TableCell>
                <TableCell className="text-sm text-right tabular-nums">{sub.messageCount}</TableCell>
                <TableCell>
                  <Badge className={`text-xs ${sub.status === "subscribed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {sub.status === "subscribed" ? "Подписан" : "Заблокирован"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {sub.status === "subscribed" ? <Ban className="h-4 w-4 text-gray-400" /> : <RotateCw className="h-4 w-4 text-gray-400" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((sub) => (
          <Card key={sub.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                  {sub.displayName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-blue-600 truncate">{sub.username}</span>
                    <Badge className={`text-[10px] shrink-0 ${sub.status === "subscribed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {sub.status === "subscribed" ? "Подписан" : "Заблокирован"}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{sub.displayName}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-sm text-gray-500 text-center">
        Показано {filtered.length} из {SUBSCRIBERS.length} подписчиков
      </div>
    </div>
  );
}

// ─── Analytics Tab ───────────────────────────────────────────────────────────

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {TELEGRAM_KPIS.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-1">{kpi.label}</div>
              <div className="text-2xl font-semibold tabular-nums">{kpi.value.toLocaleString("ru-RU")}</div>
              <div className={`flex items-center gap-1 text-xs mt-1 ${kpi.delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                {kpi.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {kpi.delta >= 0 ? "+" : ""}{kpi.delta}%
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DAU / MAU Chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">DAU / MAU за период</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DAU_MAU_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="mau" name="MAU" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="dau" name="DAU" stroke="#FFD60A" fill="#FFD60A" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <Card>
          <CardHeader><CardTitle className="text-base">Воронка конверсии</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {FUNNEL_DATA.map((step, idx) => {
              const widthPercent = step.percent;
              return (
                <div key={step.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{step.label}</span>
                    <span className="font-medium tabular-nums">{step.value.toLocaleString("ru-RU")} <span className="text-gray-400 text-xs">({step.percent}%)</span></span>
                  </div>
                  <div className="h-8 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: idx === 0 ? "#FFD60A" : idx === 1 ? "#FBBF24" : idx === 2 ? "#F59E0B" : "#D97706",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Top Commands */}
        <Card>
          <CardHeader><CardTitle className="text-base">Топ команд</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TOP_COMMANDS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="command" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" name="Вызовов" fill="#FFD60A" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retention */}
      <Card>
        <CardHeader><CardTitle className="text-base">Retention Rate</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={RETENTION_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                <Tooltip formatter={(value: number) => [`${value}%`, "Retention"]} />
                <Line type="monotone" dataKey="value" stroke="#FFD60A" strokeWidth={3} dot={{ r: 6, fill: "#FFD60A", stroke: "#fff", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── FAQ Tab ─────────────────────────────────────────────────────────────────

function FaqTab() {
  const [faqItems, setFaqItems] = React.useState<FaqItem[]>(FAQ_ITEMS);
  const [rules, setRules] = React.useState<AutoReplyRule[]>(AUTO_REPLY_RULES);
  const [faqLang, setFaqLang] = React.useState("ru");
  const [expandedFaq, setExpandedFaq] = React.useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* FAQ Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">FAQ</h3>
          <div className="flex items-center gap-2">
            <Tabs value={faqLang} onValueChange={setFaqLang}>
              <TabsList className="h-8">
                <TabsTrigger value="ru" className="text-xs px-2 py-1">RU</TabsTrigger>
                <TabsTrigger value="uz" className="text-xs px-2 py-1">UZ</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />Добавить
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {faqItems.map((item) => (
            <Card key={item.id} className={!item.active ? "opacity-50" : ""}>
              <CardContent className="p-0">
                <button
                  className="flex items-center gap-3 w-full p-4 text-left"
                  onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                >
                  <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform shrink-0 ${expandedFaq === item.id ? "rotate-90" : ""}`} />
                  <span className="text-sm font-medium flex-1">{item.question[faqLang] || item.question.ru}</span>
                  <Switch
                    checked={item.active}
                    onCheckedChange={(checked) => {
                      setFaqItems(faqItems.map((f) => f.id === item.id ? { ...f, active: checked } : f));
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </button>
                {expandedFaq === item.id && (
                  <div className="px-4 pb-4 pl-11">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.answer[faqLang] || item.answer.ru}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Auto-replies Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">Автоответы</h3>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />Добавить правило
          </Button>
        </div>

        <div className="space-y-2">
          {rules.map((rule) => (
            <Card key={rule.id} className={!rule.active ? "opacity-50" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">IF</Badge>
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{rule.keyword}</code>
                      {rule.isRegex && <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-200">regex</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">THEN</Badge>
                      <span className="text-sm text-gray-600">{rule.templateName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={rule.active}
                      onCheckedChange={(checked) => {
                        setRules(rules.map((r) => r.id === rule.id ? { ...r, active: checked } : r));
                      }}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function TelegramPage() {
  const [botEnabled, setBotEnabled] = React.useState(BOT_CONFIG.isEnabled);
  const [showCreateBroadcast, setShowCreateBroadcast] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[32px] font-bold leading-tight">Telegram-бот</h1>
          <p className="text-sm text-gray-500 mt-1">
            {BOT_CONFIG.username} · Подписчиков {BOT_CONFIG.subscriberCount.toLocaleString("ru-RU")}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch
              checked={botEnabled}
              onCheckedChange={setBotEnabled}
              className="data-[state=checked]:bg-green-500"
            />
            <Label className="text-sm font-medium whitespace-nowrap">
              {botEnabled ? "Бот включён" : "Бот выключен"}
            </Label>
          </div>
          <Button variant="ghost" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90 hidden sm:inline-flex"
            onClick={() => setShowCreateBroadcast(true)}
          >
            <Send className="h-4 w-4 mr-2" />Создать рассылку
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="settings">
        <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-12 w-full justify-start overflow-x-auto">
          <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent whitespace-nowrap px-4">
            Общие настройки
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent whitespace-nowrap px-4">
            Шаблоны сообщений
          </TabsTrigger>
          <TabsTrigger value="broadcasts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent whitespace-nowrap px-4">
            Рассылки
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent whitespace-nowrap px-4">
            Подписчики
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent whitespace-nowrap px-4">
            Аналитика
          </TabsTrigger>
          <TabsTrigger value="faq" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FFD60A] data-[state=active]:bg-transparent whitespace-nowrap px-4">
            FAQ и автоответы
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <SettingsTab />
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <TemplatesTab />
        </TabsContent>
        <TabsContent value="broadcasts" className="mt-6">
          <BroadcastsTab />
        </TabsContent>
        <TabsContent value="subscribers" className="mt-6">
          <SubscribersTab />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsTab />
        </TabsContent>
        <TabsContent value="faq" className="mt-6">
          <FaqTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
