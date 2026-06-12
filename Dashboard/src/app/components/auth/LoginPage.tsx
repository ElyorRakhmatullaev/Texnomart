"use client";

import * as React from "react";
import { useNavigate, Link } from "react-router";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "./AuthContext";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Checkbox } from "@texnomart/ui/checkbox";
import { Label } from "@texnomart/ui/label";
import { Alert, AlertDescription } from "@texnomart/ui/alert";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = React.useState("admin@texnomart.uz");
  const [password, setPassword] = React.useState("Texnomart2026");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [failedAttempts, setFailedAttempts] = React.useState(0);
  const [blockedUntil, setBlockedUntil] = React.useState<number | null>(null);
  const [countdown, setCountdown] = React.useState("");

  // Countdown timer for blocked state
  React.useEffect(() => {
    if (!blockedUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = blockedUntil - now;

      if (remaining <= 0) {
        setBlockedUntil(null);
        setFailedAttempts(0);
        setCountdown("");
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setCountdown(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [blockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (blockedUntil) return;

    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock: fail login to demonstrate error states
    const success = Math.random() > 0.7; // 30% success rate for demo

    if (success) {
      login();
      toast.success("Успешный вход. Подтвердите 2FA.");
      navigate("/login/2fa");
      setLoading(false);
      return;
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 5) {
        // Block for 15 minutes
        setBlockedUntil(Date.now() + 15 * 60 * 1000);
      }
    }

    setLoading(false);
  };

  const isBlocked = blockedUntil !== null;
  const showWarning = failedAttempts >= 3 && failedAttempts < 5;

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Добро пожаловать</h2>
          <p className="text-base text-gray-700">Войдите в свою учётную запись</p>
        </div>

        {showWarning && (
          <Alert variant="warning">
            <AlertDescription>
              Осталось {5 - failedAttempts} {5 - failedAttempts === 1 ? "попытка" : "попытки"}. После
              блокировка на 15 минут.
            </AlertDescription>
          </Alert>
        )}

        {isBlocked && (
          <Alert variant="destructive">
            <AlertDescription>
              Заблокировано. Повторите через {countdown}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email или телефон</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <Input
                id="email"
                type="text"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isBlocked || loading}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isBlocked || loading}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isBlocked}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={isBlocked}
              />
              <Label htmlFor="remember" className="cursor-pointer text-sm font-normal">
                Запомнить меня
              </Label>
            </div>
            <Link
              to="/login/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Забыли пароль?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isBlocked || loading}>
            {loading ? "Вход..." : "Войти"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
