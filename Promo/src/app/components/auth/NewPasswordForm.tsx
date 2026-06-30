"use client";

import * as React from "react";
import { Lock, Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import { cn } from "@texnomart/ui/utils";

interface NewPasswordFormProps {
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (password: string) => void | Promise<void>;
  /**
   * When provided, renders a «Текущий пароль» field above the new-password
   * fields and verifies it before submit (used by the voluntary change in the
   * Профиль screen). Omitted by the forced first-login flow, which has no
   * current password to confirm — keeps that caller unchanged.
   */
  verifyCurrentPassword?: (current: string) => boolean;
  currentPasswordLabel?: string;
}

export function NewPasswordForm({
  title,
  description,
  submitLabel,
  onSubmit,
  verifyCurrentPassword,
  currentPasswordLabel = "Текущий пароль",
}: NewPasswordFormProps) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [currentError, setCurrentError] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const criteria = React.useMemo(
    () => ({
      minLength: password.length >= 10,
      hasUpperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }),
    [password]
  );
  const strength = React.useMemo(() => Object.values(criteria).filter(Boolean).length, [criteria]);
  const strengthColor = React.useMemo(() => {
    if (strength === 0) return "bg-gray-200";
    if (strength === 1) return "bg-red-500";
    if (strength === 2) return "bg-orange-500";
    if (strength === 3) return "bg-yellow-500";
    return "bg-green-500";
  }, [strength]);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const currentFilled = !verifyCurrentPassword || currentPassword.length > 0;
  const isValid = Object.values(criteria).every(Boolean) && passwordsMatch && currentFilled;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    if (verifyCurrentPassword && !verifyCurrentPassword(currentPassword)) {
      setCurrentError(true);
      return;
    }
    setLoading(true);
    await onSubmit(password);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-base text-gray-700">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {verifyCurrentPassword && (
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{currentPasswordLabel}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="••••••••••"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setCurrentError(false);
                }}
                disabled={loading}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {currentError && (
              <p className="text-sm text-red-600">Текущий пароль неверён</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">Новый пароль</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {password && (
            <div className="space-y-2 pt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((segment) => (
                  <div
                    key={segment}
                    className={cn(
                      "h-2 flex-1 rounded-full transition-colors",
                      segment <= strength ? strengthColor : "bg-gray-200"
                    )}
                  />
                ))}
              </div>
            </div>
          )}

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
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {confirmPassword && (
            <div className="flex items-center gap-2 text-sm">
              {passwordsMatch ? (
                <>
                  <CheckCircle2 className="size-4 text-green-600" />
                  <span className="text-green-600">Пароли совпадают</span>
                </>
              ) : (
                <>
                  <Circle className="size-4 text-red-600" />
                  <span className="text-red-600">Пароли не совпадают</span>
                </>
              )}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={!isValid || loading}>
          {loading ? "Сохранение..." : submitLabel}
        </Button>
      </form>
    </div>
  );
}

function CriteriaItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle2 className={cn("size-4", met ? "text-green-600" : "text-gray-400")} />
      <span className={cn(met ? "text-green-600" : "text-gray-600")}>{text}</span>
    </div>
  );
}
