"use client";

import * as React from "react";
import {
  User,
  Shield,
  Bell,
  Monitor,
  Smartphone,
  Palette,
  Camera,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Download,
  RefreshCw,
  Check,
  CheckCircle2,
  LogOut,
  Sun,
  Moon,
  Laptop,
  Globe,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@texnomart/ui/card";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import { Switch } from "@texnomart/ui/switch";
import { Badge } from "@texnomart/ui/badge";
import { Avatar, AvatarFallback } from "@texnomart/ui/avatar";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@texnomart/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@texnomart/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@texnomart/ui/sheet";
import { cn } from "@texnomart/ui/utils";

// ─── Mock current user profile ───────────────────────────────────────────────

const CURRENT_USER = {
  id: "USR-003",
  firstName: "Сардор",
  lastName: "Мавлянов",
  middleName: "Рашидович",
  fullName: "Мавлянов Сардор Рашидович",
  email: "s.mavlyanov@texnomart.uz",
  emailVerified: true,
  phone: "+998 93 456-78-90",
  phoneVerified: true,
  role: "admin" as const,
  branch: "Главный офис",
  avatarInitials: "СМ",
  twoFactorEnabled: true,
  lastPasswordChange: new Date("2026-04-12"),
  createdAt: new Date("2024-06-01"),
  createdBy: "Каримов Р.А.",
};

const CURRENT_SESSIONS = [
  { id: "s1", device: "Windows 10", browser: "Chrome 125", ip: "192.168.1.45", location: "Ташкент", flag: "🇺🇿", loginTime: new Date("2026-05-24T09:30:00"), lastActivity: new Date("2026-05-24T14:22:00"), isCurrent: true },
  { id: "s2", device: "macOS 15", browser: "Safari 18", ip: "10.0.0.12", location: "Ташкент", flag: "🇺🇿", loginTime: new Date("2026-05-23T18:15:00"), lastActivity: new Date("2026-05-23T23:10:00"), isCurrent: false },
  { id: "s3", device: "iPhone 15", browser: "Safari Mobile", ip: "172.16.0.88", location: "Самарканд", flag: "🇺🇿", loginTime: new Date("2026-05-22T10:00:00"), lastActivity: new Date("2026-05-22T12:45:00"), isCurrent: false },
  { id: "s4", device: "Android 14", browser: "Chrome Mobile", ip: "192.168.2.100", location: "Бухара", flag: "🇺🇿", loginTime: new Date("2026-05-20T08:00:00"), lastActivity: new Date("2026-05-20T09:30:00"), isCurrent: false },
];

const BACKUP_CODES = [
  "A1B2-C3D4", "E5F6-G7H8", "I9J0-K1L2", "M3N4-O5P6",
  "Q7R8-S9T0", "U1V2-W3X4", "Y5Z6-A7B8", "C9D0-E1F2",
];

type ChannelMatrixRow = {
  type: string;
  channels: Record<string, boolean>;
};

const CHANNEL_KEYS = ["system", "email", "sms", "push", "telegram"] as const;
const CHANNEL_LABELS: Record<string, string> = {
  system: "В системе",
  email: "Email",
  sms: "SMS",
  push: "Push",
  telegram: "Telegram",
};

const INITIAL_CHANNEL_MATRIX: ChannelMatrixRow[] = [
  { type: "Новая заявка", channels: { system: true, email: false, sms: false, push: true, telegram: true } },
  { type: "Изменение статуса", channels: { system: true, email: true, sms: false, push: true, telegram: true } },
  { type: "Партнёр недоступен", channels: { system: true, email: true, sms: true, push: true, telegram: false } },
  { type: "Аномалия", channels: { system: true, email: true, sms: false, push: false, telegram: false } },
  { type: "Системные", channels: { system: true, email: false, sms: false, push: false, telegram: false } },
  { type: "Безопасность", channels: { system: true, email: true, sms: true, push: true, telegram: true } },
];

// ─── Nav items ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "info", label: "Основная информация", icon: User },
  { id: "security", label: "Безопасность", icon: Shield },
  { id: "notifications", label: "Уведомления", icon: Bell },
  { id: "sessions", label: "Сессии", icon: Monitor },
  { id: "interface", label: "Интерфейс", icon: Palette },
] as const;

type TabId = (typeof NAV_ITEMS)[number]["id"];

// ─── Tab 1: Основная информация ──────────────────────────────────────────────

function InfoTab() {
  const [firstName, setFirstName] = React.useState(CURRENT_USER.firstName);
  const [lastName, setLastName] = React.useState(CURRENT_USER.lastName);
  const [middleName, setMiddleName] = React.useState(CURRENT_USER.middleName);
  const [email] = React.useState(CURRENT_USER.email);
  const [phone] = React.useState(CURRENT_USER.phone);

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Фото</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Avatar className="w-[120px] h-[120px] text-3xl">
            <AvatarFallback className="bg-[#FFD60A] text-black text-3xl font-semibold">
              {CURRENT_USER.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-initial gap-2">
              <Camera className="w-4 h-4" />
              Загрузить фото
            </Button>
            <Button variant="ghost" className="flex-1 sm:flex-initial gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
              Удалить
            </Button>
          </div>
          <p className="text-xs text-gray-500">JPG или PNG, не более 5 МБ</p>
        </CardContent>
      </Card>

      {/* Contact info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Контактная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Фамилия</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Имя</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Отчество</Label>
            <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="flex gap-2 items-center">
              <Input value={email} readOnly className="flex-1 bg-gray-50" />
              {CURRENT_USER.emailVerified ? (
                <Badge className="bg-green-100 text-green-700 shrink-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Подтверждён
                </Badge>
              ) : (
                <Button variant="ghost" size="sm" className="shrink-0 text-blue-600">
                  Подтвердить
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Телефон</Label>
            <div className="flex gap-2 items-center">
              <Input value={phone} readOnly className="flex-1 bg-gray-50" />
              {CURRENT_USER.phoneVerified ? (
                <Badge className="bg-green-100 text-green-700 shrink-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Подтверждён
                </Badge>
              ) : (
                <Button variant="ghost" size="sm" className="shrink-0 text-blue-600">
                  Подтвердить
                </Button>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90"
              onClick={() => toast.success("Контактная информация сохранена")}
            >
              Сохранить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Work info (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Рабочая информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Роль" value={CURRENT_USER.role === "admin" ? "Admin" : CURRENT_USER.role} />
          <InfoRow label="Филиал" value={CURRENT_USER.branch} />
          <InfoRow label="Дата создания" value={format(CURRENT_USER.createdAt, "dd.MM.yyyy", { locale: ru })} />
          <InfoRow label="Создан пользователем" value={CURRENT_USER.createdBy} />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

// ─── Tab 2: Безопасность ─────────────────────────────────────────────────────

function SecurityTab() {
  const [changePasswordOpen, setChangePasswordOpen] = React.useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(CURRENT_USER.twoFactorEnabled);
  const [setupTwoFactorOpen, setSetupTwoFactorOpen] = React.useState(false);
  const [showBackupCodes, setShowBackupCodes] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Пароль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">
            Последнее изменение: {format(CURRENT_USER.lastPasswordChange, "dd.MM.yyyy", { locale: ru })}
          </p>
          <Button variant="outline" onClick={() => setChangePasswordOpen(true)}>
            Изменить пароль
          </Button>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Двухфакторная аутентификация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{twoFactorEnabled ? "2FA включена" : "2FA отключена"}</p>
              <p className="text-xs text-gray-500">Дополнительная защита при входе в систему</p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSetupTwoFactorOpen(true);
                } else {
                  setTwoFactorEnabled(false);
                  toast.success("2FA отключена");
                }
              }}
            />
          </div>

          {twoFactorEnabled && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Резервные коды (8 шт.)</p>
                  <p className="text-xs text-gray-500">Используйте если нет доступа к приложению</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowBackupCodes(!showBackupCodes)}>
                    {showBackupCodes ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {showBackupCodes ? "Скрыть" : "Показать"}
                  </Button>
                </div>
              </div>

              {showBackupCodes && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BACKUP_CODES.map((code) => (
                      <div key={code} className="bg-gray-50 rounded-lg px-3 py-2 text-center font-mono text-sm">
                        {code}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toast.success("Коды скопированы")}>
                      <Copy className="w-4 h-4 mr-1" />
                      Скопировать
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.success("Коды скачаны")}>
                      <Download className="w-4 h-4 mr-1" />
                      Скачать
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.success("Новые коды сгенерированы")}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Сгенерировать новые
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active connections preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Активные подключения</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CURRENT_SESSIONS.slice(0, 3).map((session) => (
            <div key={session.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
              {session.device.includes("iPhone") || session.device.includes("Android") ? (
                <Smartphone className="w-5 h-5 text-gray-400 shrink-0" />
              ) : (
                <Monitor className="w-5 h-5 text-gray-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.browser} · {session.device}</p>
                <p className="text-xs text-gray-500">{session.location} · {format(session.lastActivity, "dd.MM HH:mm", { locale: ru })}</p>
              </div>
              {session.isCurrent && (
                <Badge className="bg-green-100 text-green-700 shrink-0">Текущая</Badge>
              )}
            </div>
          ))}
          <p className="text-xs text-gray-500 pt-1">
            Перейдите во вкладку «Сессии» для управления всеми подключениями
          </p>
        </CardContent>
      </Card>

      {/* Change password dialog */}
      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />

      {/* 2FA setup dialog */}
      <TwoFactorSetupDialog
        open={setupTwoFactorOpen}
        onOpenChange={setSetupTwoFactorOpen}
        onComplete={() => {
          setTwoFactorEnabled(true);
          toast.success("2FA успешно включена");
        }}
      />
    </div>
  );
}

function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);

  const strength = React.useMemo(() => {
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  }, [newPassword]);

  const strengthLabel = ["", "Слабый", "Слабый", "Средний", "Хороший", "Отличный"][strength];
  const strengthColor = ["", "bg-red-500", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"][strength];

  const criteria = [
    { label: "Минимум 8 символов", met: newPassword.length >= 8 },
    { label: "Заглавная буква", met: /[A-Z]/.test(newPassword) },
    { label: "Строчная буква", met: /[a-z]/.test(newPassword) },
    { label: "Цифра", met: /[0-9]/.test(newPassword) },
    { label: "Спецсимвол", met: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  const handleSubmit = () => {
    if (newPassword !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }
    toast.success("Пароль успешно изменён");
    onOpenChange(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Текущий пароль</Label>
        <div className="relative">
          <Input
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setShowCurrent(!showCurrent)}
          >
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Новый пароль</Label>
        <div className="relative">
          <Input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setShowNew(!showNew)}
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {newPassword && (
          <>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={cn("h-1 flex-1 rounded-full", i <= strength ? strengthColor : "bg-gray-200")}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500">{strengthLabel}</p>
          </>
        )}
        <div className="space-y-1">
          {criteria.map((c) => (
            <div key={c.label} className="flex items-center gap-2 text-xs">
              {c.met ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <X className="w-3 h-3 text-gray-300" />
              )}
              <span className={c.met ? "text-green-600" : "text-gray-400"}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Подтвердите пароль</Label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {confirmPassword && confirmPassword !== newPassword && (
          <p className="text-xs text-red-500">Пароли не совпадают</p>
        )}
      </div>
    </div>
  );

  const footer = (
    <div className="flex gap-2 justify-end">
      <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
      <Button
        className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90"
        disabled={!currentPassword || strength < 3 || newPassword !== confirmPassword}
        onClick={handleSubmit}
      >
        Изменить пароль
      </Button>
    </div>
  );

  return (
    <>
      {/* Desktop dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="hidden sm:block sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Изменить пароль</DialogTitle>
            <DialogDescription>Введите текущий пароль и придумайте новый</DialogDescription>
          </DialogHeader>
          {content}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Mobile full-screen sheet */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="sm:hidden h-full">
          <SheetHeader>
            <SheetTitle>Изменить пароль</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{content}</div>
          <div className="mt-6">{footer}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function TwoFactorSetupDialog({ open, onOpenChange, onComplete }: { open: boolean; onOpenChange: (open: boolean) => void; onComplete: () => void }) {
  const [step, setStep] = React.useState(1);
  const [code, setCode] = React.useState("");
  const secretKey = "JBSWY3DPEHPK3PXP";

  const handleVerify = () => {
    if (code.length === 6) {
      onComplete();
      onOpenChange(false);
      setStep(1);
      setCode("");
    }
  };

  React.useEffect(() => {
    if (!open) {
      setStep(1);
      setCode("");
    }
  }, [open]);

  const content = (
    <div className="space-y-4">
      {step === 1 && (
        <>
          <p className="text-sm text-gray-600">
            Отсканируйте QR-код в приложении Google Authenticator или Authy:
          </p>
          <div className="flex justify-center py-4">
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-400">QR-код</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Или введите секретный ключ вручную:</Label>
            <div className="flex gap-2">
              <Input value={secretKey} readOnly className="font-mono text-sm bg-gray-50" />
              <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(secretKey); toast.success("Ключ скопирован"); }}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button
            className="w-full bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90"
            onClick={() => setStep(2)}
          >
            Далее
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <p className="text-sm text-gray-600">
            Введите 6-значный код из приложения для подтверждения:
          </p>
          <div className="space-y-2">
            <Label>Код подтверждения</Label>
            <Input
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
              }}
              placeholder="000000"
              className="text-center text-2xl tracking-[0.5em] font-mono"
              maxLength={6}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Назад</Button>
            <Button
              className="flex-1 bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90"
              disabled={code.length !== 6}
              onClick={handleVerify}
            >
              Подтвердить
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="hidden sm:block sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Настройка 2FA</DialogTitle>
            <DialogDescription>Шаг {step} из 2</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="sm:hidden h-full">
          <SheetHeader>
            <SheetTitle>Настройка 2FA — Шаг {step} из 2</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{content}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── Tab 3: Уведомления ──────────────────────────────────────────────────────

function NotificationsTab() {
  const [matrix, setMatrix] = React.useState<ChannelMatrixRow[]>(INITIAL_CHANNEL_MATRIX);
  const [quietHoursEnabled, setQuietHoursEnabled] = React.useState(false);
  const [quietFrom, setQuietFrom] = React.useState("22:00");
  const [quietTo, setQuietTo] = React.useState("08:00");
  const [quietDays, setQuietDays] = React.useState<string[]>(["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]);
  const [dailyDigest, setDailyDigest] = React.useState(true);
  const [weeklyReport, setWeeklyReport] = React.useState(false);

  const ALL_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const toggleChannel = (rowIdx: number, channel: string) => {
    setMatrix((prev) =>
      prev.map((row, i) =>
        i === rowIdx
          ? { ...row, channels: { ...row.channels, [channel]: !row.channels[channel] } }
          : row
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Channel matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Матрица каналов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white z-10 min-w-[160px]">Тип</TableHead>
                  {CHANNEL_KEYS.map((ch) => (
                    <TableHead key={ch} className="text-center min-w-[80px]">{CHANNEL_LABELS[ch]}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrix.map((row, rowIdx) => (
                  <TableRow key={row.type}>
                    <TableCell className="sticky left-0 bg-white z-10 text-sm font-medium">{row.type}</TableCell>
                    {CHANNEL_KEYS.map((ch) => (
                      <TableCell key={ch} className="text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={row.channels[ch]}
                            onCheckedChange={() => toggleChannel(rowIdx, ch)}
                            className="data-[state=checked]:bg-[#FFD60A]"
                          />
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quiet hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Тихие часы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Не беспокоить</p>
              <p className="text-xs text-gray-500">Уведомления будут накапливаться и отправлены после</p>
            </div>
            <Switch
              checked={quietHoursEnabled}
              onCheckedChange={setQuietHoursEnabled}
              className="data-[state=checked]:bg-[#FFD60A]"
            />
          </div>

          {quietHoursEnabled && (
            <>
              <div className="flex gap-3 items-center">
                <div className="space-y-1">
                  <Label className="text-xs">С</Label>
                  <Input type="time" value={quietFrom} onChange={(e) => setQuietFrom(e.target.value)} className="w-28" />
                </div>
                <span className="text-gray-400 mt-5">—</span>
                <div className="space-y-1">
                  <Label className="text-xs">До</Label>
                  <Input type="time" value={quietTo} onChange={(e) => setQuietTo(e.target.value)} className="w-28" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() =>
                      setQuietDays((prev) =>
                        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                      )
                    }
                    className={cn(
                      "w-11 h-11 rounded-lg text-sm font-medium transition-colors",
                      quietDays.includes(day)
                        ? "bg-[#FFD60A] text-black"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Digests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Сводки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Ежедневная сводка на email</p>
              <p className="text-xs text-gray-500">Получать итоги дня каждое утро в 09:00</p>
            </div>
            <Switch
              checked={dailyDigest}
              onCheckedChange={(v) => { setDailyDigest(v); toast.success(v ? "Ежедневная сводка включена" : "Ежедневная сводка отключена"); }}
              className="data-[state=checked]:bg-[#FFD60A]"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Еженедельный отчёт</p>
              <p className="text-xs text-gray-500">Полный отчёт по понедельникам в 10:00</p>
            </div>
            <Switch
              checked={weeklyReport}
              onCheckedChange={(v) => { setWeeklyReport(v); toast.success(v ? "Еженедельный отчёт включён" : "Еженедельный отчёт отключён"); }}
              className="data-[state=checked]:bg-[#FFD60A]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 4: Сессии ───────────────────────────────────────────────────────────

function SessionsTab() {
  const [sessions, setSessions] = React.useState(CURRENT_SESSIONS);

  const terminateSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Сессия завершена");
  };

  const terminateAll = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    toast.success("Все сессии кроме текущей завершены");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Активные сессии ({sessions.length})</CardTitle>
          {sessions.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto mt-2 sm:mt-0"
              onClick={terminateAll}
            >
              <LogOut className="w-4 h-4 mr-1" />
              Завершить все кроме текущей
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="shrink-0">
                  {session.device.includes("iPhone") || session.device.includes("Android") ? (
                    <Smartphone className="w-6 h-6 text-gray-400" />
                  ) : (
                    <Monitor className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{session.browser}</p>
                    <span className="text-xs text-gray-400">·</span>
                    <p className="text-xs text-gray-500">{session.device}</p>
                    {session.isCurrent && (
                      <Badge className="bg-green-100 text-green-700">Текущая</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className="text-xs text-gray-500 hidden sm:inline">{session.ip}</span>
                    <span className="text-xs text-gray-500">{session.flag} {session.location}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-gray-500">
                          Вход: {format(session.loginTime, "dd.MM HH:mm", { locale: ru })}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Последняя активность: {format(session.lastActivity, "dd.MM.yyyy HH:mm", { locale: ru })}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div className="shrink-0">
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => terminateSession(session.id)}
                    >
                      Завершить
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {sessions.length === 1 && sessions[0].isCurrent && (
            <p className="text-sm text-gray-500 text-center py-4">
              Активна только текущая сессия
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab 5: Интерфейс ────────────────────────────────────────────────────────

function InterfaceTab() {
  const [language, setLanguage] = React.useState("ru");
  const [theme, setTheme] = React.useState("light");
  const [density, setDensity] = React.useState("standard");
  const [reduceAnimations, setReduceAnimations] = React.useState(false);
  const [highContrast, setHighContrast] = React.useState(false);
  const [largeText, setLargeText] = React.useState(false);

  const themes = [
    { id: "light", label: "Светлая", icon: Sun, bg: "bg-white", border: "border-gray-200" },
    { id: "dark", label: "Тёмная", icon: Moon, bg: "bg-gray-900", border: "border-gray-700" },
    { id: "system", label: "Системная", icon: Laptop, bg: "bg-gradient-to-r from-white to-gray-900", border: "border-gray-300" },
  ];

  const densities = [
    { id: "compact", label: "Компактная", padding: "py-1 px-3", text: "text-xs", gap: "gap-1" },
    { id: "standard", label: "Стандартная", padding: "py-2 px-4", text: "text-sm", gap: "gap-2" },
    { id: "comfortable", label: "Свободная", padding: "py-3 px-5", text: "text-base", gap: "gap-3" },
  ];

  return (
    <div className="space-y-6">
      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Язык</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { id: "ru", label: "Русский" },
              { id: "uz-cyr", label: "Ўзбек (Кириллица)" },
              { id: "uz-lat", label: "O'zbek (Lotin)" },
            ].map((lang) => (
              <label
                key={lang.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                  language === lang.id ? "bg-[#FFD60A]/10 border border-[#FFD60A]" : "hover:bg-gray-50 border border-transparent"
                )}
              >
                <input
                  type="radio"
                  name="language"
                  value={lang.id}
                  checked={language === lang.id}
                  onChange={() => { setLanguage(lang.id); toast.success("Язык изменён"); }}
                  className="accent-[#FFD60A]"
                />
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{lang.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Тема</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themes.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); toast.success(`Тема: ${t.label}`); }}
                  className={cn(
                    "rounded-xl border-2 p-1 transition-all",
                    theme === t.id ? "border-[#FFD60A] ring-2 ring-[#FFD60A]/30" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className={cn("h-20 rounded-lg flex items-center justify-center", t.bg, t.border, "border")}>
                    <Icon className={cn("w-8 h-8", t.id === "dark" ? "text-white" : "text-gray-600")} />
                  </div>
                  <p className={cn("text-sm font-medium mt-2 mb-1", theme === t.id ? "text-black" : "text-gray-600")}>{t.label}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Density */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Плотность интерфейса</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {densities.map((d) => (
              <label
                key={d.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                  density === d.id ? "bg-[#FFD60A]/10 border border-[#FFD60A]" : "hover:bg-gray-50 border border-transparent"
                )}
              >
                <input
                  type="radio"
                  name="density"
                  value={d.id}
                  checked={density === d.id}
                  onChange={() => { setDensity(d.id); toast.success(`Плотность: ${d.label}`); }}
                  className="accent-[#FFD60A]"
                />
                <span className="text-sm font-medium">{d.label}</span>
              </label>
            ))}
          </div>

          {/* Live preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-xs text-gray-400 mb-2">Предпросмотр</p>
            {(() => {
              const d = densities.find((x) => x.id === density)!;
              return (
                <div className={cn("bg-white rounded-lg border", d.padding, d.gap, "flex flex-col")}>
                  <div className="flex justify-between items-center">
                    <span className={cn("font-medium", d.text)}>Иванов И.И.</span>
                    <Badge className="bg-green-100 text-green-700">Активен</Badge>
                  </div>
                  <span className={cn("text-gray-500", d.text)}>s.ivanov@texnomart.uz</span>
                  <span className={cn("text-gray-400", d.text)}>+998 90 123-45-67</span>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Доступность</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Уменьшить анимации</p>
              <p className="text-xs text-gray-500">Отключить переходы и анимации</p>
            </div>
            <Switch
              checked={reduceAnimations}
              onCheckedChange={(v) => { setReduceAnimations(v); toast.success(v ? "Анимации отключены" : "Анимации включены"); }}
              className="data-[state=checked]:bg-[#FFD60A]"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Высокая контрастность</p>
              <p className="text-xs text-gray-500">Увеличить контраст элементов</p>
            </div>
            <Switch
              checked={highContrast}
              onCheckedChange={(v) => { setHighContrast(v); toast.success(v ? "Высокая контрастность включена" : "Высокая контрастность отключена"); }}
              className="data-[state=checked]:bg-[#FFD60A]"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Увеличенный текст</p>
              <p className="text-xs text-gray-500">Увеличить размер шрифта на 20%</p>
            </div>
            <Switch
              checked={largeText}
              onCheckedChange={(v) => { setLargeText(v); toast.success(v ? "Увеличенный текст включён" : "Увеличенный текст отключён"); }}
              className="data-[state=checked]:bg-[#FFD60A]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Profile Page ───────────────────────────────────────────────────────

export function ProfilePage() {
  const [activeTab, setActiveTab] = React.useState<TabId>("info");

  const renderTab = () => {
    switch (activeTab) {
      case "info":
        return <InfoTab />;
      case "security":
        return <SecurityTab />;
      case "notifications":
        return <NotificationsTab />;
      case "sessions":
        return <SessionsTab />;
      case "interface":
        return <InterfaceTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl md:text-[32px] font-bold leading-tight text-gray-900 pt-3">Мой профиль</h1>
        <p className="text-sm text-gray-500 mt-1">Управление личной информацией и настройками</p>
      </div>

      {/* Mobile: Select dropdown (sm) */}
      <div className="sm:hidden">
        <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
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
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                activeTab === item.id
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
        <nav className="hidden lg:block w-[280px] shrink-0">
          <div className="sticky top-0 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors",
                    activeTab === item.id
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
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
