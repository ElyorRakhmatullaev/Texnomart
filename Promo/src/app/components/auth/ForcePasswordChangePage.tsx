"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { AuthLayout } from "./AuthLayout";
import { NewPasswordForm } from "./NewPasswordForm";
import { useCurrentUser } from "../../current-user-context";
import { updatePassword } from "../../../lib/users-store";

export function ForcePasswordChangePage() {
  const navigate = useNavigate();
  const { currentUser, refresh } = useCurrentUser();

  const handleSubmit = async (password: string) => {
    if (!currentUser) return;
    await new Promise((resolve) => setTimeout(resolve, 400));
    updatePassword(currentUser.id, password);
    refresh();
    toast.success("Пароль изменён. Добро пожаловать!");
    navigate("/", { replace: true });
  };

  return (
    <AuthLayout>
      <NewPasswordForm
        title="Смена пароля"
        description="Это первый вход — задайте постоянный пароль, чтобы продолжить."
        submitLabel="Сохранить и войти"
        onSubmit={handleSubmit}
      />
    </AuthLayout>
  );
}
