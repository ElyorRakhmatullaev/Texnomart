"use client";

import * as React from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "./AuthContext";
import { Button } from "@texnomart/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@texnomart/ui/input-otp";

export function Login2FAPage() {
  const navigate = useNavigate();
  const { needsTwoFactor, verify2FA } = useAuth();
  const [value, setValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!needsTwoFactor) navigate("/login", { replace: true });
  }, [needsTwoFactor, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (value.length !== 6) return;

    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    verify2FA();
    toast.success("Добро пожаловать в систему!");
    navigate("/");

    setLoading(false);
  };

  // Auto-submit when 6 digits entered
  React.useEffect(() => {
    if (value.length === 6 && !loading) {
      handleSubmit(new Event("submit") as any);
    }
  }, [value]);

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Двухфакторная аутентификация</h2>
          <p className="text-base text-gray-700">
            Введите 6-значный код из приложения Google Authenticator
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={value}
              onChange={setValue}
              disabled={loading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-12 h-12 text-xl" />
                <InputOTPSlot index={1} className="w-12 h-12 text-xl" />
                <InputOTPSlot index={2} className="w-12 h-12 text-xl" />
                <InputOTPSlot index={3} className="w-12 h-12 text-xl" />
                <InputOTPSlot index={4} className="w-12 h-12 text-xl" />
                <InputOTPSlot index={5} className="w-12 h-12 text-xl" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-700">Не получили код? </span>
            <a href="#" className="text-primary hover:underline">
              Использовать резервный код
            </a>
          </div>

          <Button type="submit" className="w-full" disabled={value.length !== 6 || loading}>
            {loading ? "Проверка..." : "Подтвердить"}
          </Button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-sm text-gray-700 hover:text-gray-900">
            ← Вернуться к входу
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
