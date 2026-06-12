import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./components/auth/AuthContext";
import { AppShell } from "./components/AppShell";
import { ShortCalendarPage } from "./components/short-calendar/ShortCalendarPage";
import { ShortCalendarDetailPage } from "./components/short-calendar/ShortCalendarDetailPage";
import { FullCalendarPage } from "./components/full-calendar/FullCalendarPage";
import { ApprovalsProvider } from "./components/approvals/ApprovalsProvider";
import { ApprovalsPage } from "./components/approvals/ApprovalsPage";
import { ApprovalDetailPage } from "./components/approvals/ApprovalDetailPage";
import { ReportsPage } from "./components/reports/ReportsPage";
import { NotificationsProvider } from "./components/notifications/NotificationsProvider";
import { NotificationsPage } from "./components/notifications/NotificationsPage";
import { PromoTypesProvider } from "./components/promo-types/PromoTypesProvider";
import { PromoTypesPage } from "./components/promo-types/PromoTypesPage";
import { AuditPage } from "./components/audit/AuditPage";
import { LoginPage } from "./components/auth/LoginPage";
import { Login2FAPage } from "./components/auth/Login2FAPage";
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/auth/ResetPasswordPage";

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // NotificationsProvider sits ABOVE the AppShell so the top-bar bell, the
  // sidebar «Уведомления» badge, and the /notifications page share one live
  // read/unread store (S6, spec §11.3).
  return (
    <NotificationsProvider>
      <AppShell />
    </NotificationsProvider>
  );
}

function GuestLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

// ── Module panels (placeholders for the bootstrap; real screens land in S1–S8) ──

/** Mounts the shared S3 review store above the queue + detail routes. */
function ApprovalsLayout() {
  return (
    <ApprovalsProvider>
      <Outlet />
    </ApprovalsProvider>
  );
}

/** Mounts the shared S7 rule store above the list + selected-rule routes. */
function PromoTypesLayout() {
  return (
    <PromoTypesProvider>
      <Outlet />
    </PromoTypesProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: GuestLayout,
    children: [
      { index: true, Component: LoginPage },
      { path: "2fa", Component: Login2FAPage },
      { path: "forgot-password", Component: ForgotPasswordPage },
      { path: "reset-password/:token", Component: ResetPasswordPage },
    ],
  },
  {
    path: "/",
    Component: ProtectedLayout,
    children: [
      { index: true, element: <Navigate to="/short-calendar" replace /> },
      { path: "short-calendar", Component: ShortCalendarPage },
      {
        path: "short-calendar/:promoId",
        Component: ShortCalendarDetailPage,
      },
      { path: "full-calendar", Component: FullCalendarPage },
      {
        path: "approvals",
        Component: ApprovalsLayout,
        children: [
          { index: true, Component: ApprovalsPage },
          { path: ":id", Component: ApprovalDetailPage },
        ],
      },
      { path: "reports", Component: ReportsPage },
      { path: "notifications", Component: NotificationsPage },
      { path: "audit", Component: AuditPage },
      {
        path: "promo-types",
        Component: PromoTypesLayout,
        children: [
          { index: true, Component: PromoTypesPage },
          { path: ":ruleId", Component: PromoTypesPage },
        ],
      },
    ],
  },
]);
