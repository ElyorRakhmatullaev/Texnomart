"use client";

import * as React from "react";
import { Link } from "react-router";
import { Mail, Phone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@texnomart/ui/button";
import { Input } from "@texnomart/ui/input";
import { Label } from "@texnomart/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@texnomart/ui/tabs";

export function ForgotPasswordPage() {
  const [method, setMethod] = React.useState<"email" | "sms">("email");
  const [emailValue, setEmailValue] = React.useState("");
  const [phoneValue, setPhoneValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSuccess(true);
    setLoading(false);
    toast.success("Инструкция отправлена!");
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="space-y-6 text-center">
          <CheckCircle2 className="size-12 text-green-600 dark:text-green-400 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Письмо отправлено</h2>
            <p className="text-base text-gray-700 dark:text-gray-200">
              Проверьте вашу почту. Ссылка действительна 30 минут.
            </p>
          </div>

          <div className="text-center pt-4">
            <Link to="/login" className="text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100">
              ← Вернуться к входу
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Восстановление пароля</h2>
          <p className="text-base text-gray-700 dark:text-gray-200">
            Введите {method === "email" ? "email" : "номер телефона"} и мы пришлём{" "}
            {method === "email" ? "ссылку для сброса" : "код подтверждения"}
          </p>
        </div>

        <Tabs
          value={method}
          onValueChange={(value) => setMethod(value as "email" | "sms")}
          className="w-full"
        >
          <TabsList className="w-full">
            <TabsTrigger value="email" className="flex-1">
              По email
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex-1">
              По SMS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    disabled={loading}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Отправка..." : "Отправить инструкцию"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="sms" className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Номер телефона</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+998 90 123-45-67"
                    value={phoneValue}
                    onChange={(e) => setPhoneValue(e.target.value)}
                    disabled={loading}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Отправка..." : "Отправить код"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center pt-2">
          <Link to="/login" className="text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100">
            ← Вернуться к входу
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
