"use client";

import * as React from "react";
import { useNavigate, Link } from "react-router";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "./AuthContext";
import { useRole } from "../../role-context";
import { useCurrentUser } from "../../current-user-context";
import { authenticate } from "../../../lib/users-store";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Checkbox } from "@texnomart/ui/checkbox";
import { Label } from "@texnomart/ui/label";
import { Alert, AlertDescription } from "@texnomart/ui/alert";

export function LoginPage() {
  const navigate = useNavigate();
  // verify2FA() — единственный вызов из общего контекста, который ставит
  // isAuthenticated=true; 2FA-шаг в Promo убран, поэтому завершаем вход им.
  const { verify2FA } = useAuth();
  const { setCurrentRole } = useRole();
  const { login: setCurrentUser } = useCurrentUser();

  const [email, setEmail] = React.useState("admin@texnomart.uz");
  const [password, setPassword] = React.useState("Admin2026!");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = React.useState(0);
  const [blockedUntil, setBlockedUntil] = React.useState<number | null>(null);
  const [countdown, setCountdown] = React.useState("");

  React.useEffect(() => {
    if (!blockedUntil) return;
    const interval = setInterval(() => {
      const remaining = blockedUntil - Date.now();
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
    setError(null);
    await new Promise((resolve) => setTimeout(resolve, 600));

    const user = authenticate(email, password);

    if (!user) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setError("Неверный email или пароль.");
      if (newAttempts >= 5) setBlockedUntil(Date.now() + 15 * 60 * 1000);
      setLoading(false);
      return;
    }

    if (user.status === "blocked") {
      setError("Учётная запись заблокирована. Обратитесь к администратору.");
      setLoading(false);
      return;
    }

    // Успех: фиксируем личность и активную роль, завершаем вход.
    setCurrentUser(user);
    setCurrentRole(user.role);
    verify2FA();
    setLoading(false);

    // Пользователь с временным паролём попадёт на принудительную смену
    // (редирект делает ProtectedLayout, Task 5); остальные — в систему.
    toast.success("Добро пожаловать в систему!");
    navigate("/");
  };

  const isBlocked = blockedUntil !== null;
  const showWarning = failedAttempts >= 3 && failedAttempts < 5;

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Добро пожаловать</h2>
          <p className="text-base text-gray-700 dark:text-gray-200">Войдите в свою учётную запись</p>
        </div>

        {error && !isBlocked && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
            <AlertDescription>Заблокировано. Повторите через {countdown}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email или телефон</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 dark:text-gray-400" />
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
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 dark:text-gray-400" />
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
            <Link to="/login/forgot-password" className="text-sm text-primary hover:underline">
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
