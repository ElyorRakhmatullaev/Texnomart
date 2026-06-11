import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./components/auth/AuthContext";
import { AppShell } from "./components/AppShell";
import { ModulePlaceholder } from "./components/ModulePlaceholder";
import { ShortCalendarPage } from "./components/short-calendar/ShortCalendarPage";
import { ShortCalendarDetailPage } from "./components/short-calendar/ShortCalendarDetailPage";
import { FullCalendarPage } from "./components/full-calendar/FullCalendarPage";
import { ApprovalsProvider } from "./components/approvals/ApprovalsProvider";
import { ApprovalsPage } from "./components/approvals/ApprovalsPage";
import { ApprovalDetailPage } from "./components/approvals/ApprovalDetailPage";
import { ReportsPage } from "./components/reports/ReportsPage";
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

  return <AppShell />;
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

function NotificationsPage() {
  return (
    <ModulePlaceholder
      title="Уведомления"
      description="Центр уведомлений: новые/изменённые данные, отмена акций, повторное согласование маркетинга."
      showFilterBar={false}
    />
  );
}

function AuditPage() {
  return (
    <ModulePlaceholder
      title="Аудит-лог"
      description="Журнал действий и свод контрольных событий по акциям с отметками просрочки."
    />
  );
}

function PromoTypesPage() {
  return (
    <ModulePlaceholder
      title="Настройки типов промо"
      description="Гибкая настройка обязательных полей для типов промо. Доступно коммерческому директору и администратору."
    />
  );
}

function DetailPlaceholder({ title }: { title: string }) {
  return (
    <ModulePlaceholder title={title} showFilterBar={false} />
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
      { path: "promo-types", Component: PromoTypesPage },
      {
        path: "promo-types/:ruleId",
        element: <DetailPlaceholder title="Правило типа промо" />,
      },
    ],
  },
]);
