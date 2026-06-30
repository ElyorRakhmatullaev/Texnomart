"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { Lock, Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import { cn } from "@texnomart/ui/utils";

interface PasswordCriteria {
  minLength: boolean;
  hasUpperLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const criteria: PasswordCriteria = React.useMemo(() => {
    return {
      minLength: password.length >= 10,
      hasUpperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const strength = React.useMemo(() => {
    const met = Object.values(criteria).filter(Boolean).length;
    return met;
  }, [criteria]);

  const strengthColor = React.useMemo(() => {
    if (strength === 0) return "bg-gray-200 dark:bg-gray-700";
    if (strength === 1) return "bg-red-500";
    if (strength === 2) return "bg-orange-500";
    if (strength === 3) return "bg-yellow-500";
    return "bg-green-500";
  }, [strength]);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const isValid = Object.values(criteria).every(Boolean) && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) return;

    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Пароль успешно изменён!");
    navigate("/login");

    setLoading(false);
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Новый пароль</h2>
          <p className="text-base text-gray-700 dark:text-gray-200">Придумайте надёжный пароль</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Новый пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 dark:text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Password strength meter */}
            {password && (
              <div className="space-y-2 pt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((segment) => (
                    <div
                      key={segment}
                      className={cn(
                        "h-2 flex-1 rounded-full transition-colors",
                        segment <= strength ? strengthColor : "bg-gray-200 dark:bg-gray-700"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Password criteria */}
            <div className="space-y-2 pt-2">
              <CriteriaItem met={criteria.minLength} text="Минимум 10 символов" />
              <CriteriaItem met={criteria.hasUpperLower} text="Заглавные и строчные буквы" />
              <CriteriaItem met={criteria.hasNumber} text="Хотя бы одна цифра" />
              <CriteriaItem met={criteria.hasSpecial} text="Хотя бы один спецсимвол" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 dark:text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Match indicator */}
            {confirmPassword && (
              <div className="flex items-center gap-2 text-sm">
                {passwordsMatch ? (
                  <>
                    <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400">Пароли совпадают</span>
                  </>
                ) : (
                  <>
                    <Circle className="size-4 text-red-600 dark:text-red-400" />
                    <span className="text-red-600 dark:text-red-400">Пароли не совпадают</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={!isValid || loading}>
            {loading ? "Сохранение..." : "Сохранить пароль"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}

interface CriteriaItemProps {
  met: boolean;
  text: string;
}

function CriteriaItem({ met, text }: CriteriaItemProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle2
        className={cn("size-4", met ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500")}
      />
      <span className={cn(met ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-300")}>{text}</span>
    </div>
  );
}
