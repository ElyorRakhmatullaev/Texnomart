"use client";

import { Navigate, useLocation } from "react-router";
import { useAuth } from "./auth-context";

interface RequireAuthProps {
  children: React.ReactNode;
  loginPath?: string;
}

export function RequireAuth({
  children,
  loginPath = "/login",
}: RequireAuthProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

interface RedirectIfAuthenticatedProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function RedirectIfAuthenticated({
  children,
  redirectTo = "/",
}: RedirectIfAuthenticatedProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
