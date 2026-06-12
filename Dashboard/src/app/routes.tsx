import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./components/auth/AuthContext";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./components/Dashboard";
import { ApplicationsPage } from "./components/applications/ApplicationsPage";
import { ApplicationDetailPage } from "./components/applications/ApplicationDetailPage";
import { ClientsPage } from "./components/clients/ClientsPage";
import { ClientDetailPage } from "./components/clients/ClientDetailPage";
import { PartnersPage } from "./components/partners/PartnersPage";
import { PartnerDetailPage } from "./components/partners/PartnerDetailPage";
import { BranchesPage } from "./components/branches/BranchesPage";
import { BranchDetailPage } from "./components/branches/BranchDetailPage";
import { UsersPage } from "./components/users/UsersPage";
import { UserDetailPage } from "./components/users/UserDetailPage";
import { AnalyticsPage } from "./components/analytics/AnalyticsPage";
import { TelegramPage } from "./components/telegram/TelegramPage";
import { NotificationsPage } from "./components/notifications/NotificationsPage";
import { AuditPage } from "./components/audit/AuditPage";
import { AuditDetailPage } from "./components/audit/AuditDetailPage";
import { SettingsPage } from "./components/settings/SettingsPage";
import { ProfilePage } from "./components/profile/ProfilePage";
import { KpiDetailPage } from "./components/dashboard/KpiDetailPage";
import { LoginPage } from "./components/auth/LoginPage";
import { Login2FAPage } from "./components/auth/Login2FAPage";
import { ForgotPasswordPage } from "./components/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/auth/ResetPasswordPage";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        <p className="text-gray-600">Эта страница в разработке</p>
      </div>
    </div>
  );
}

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

// Under GitHub Pages the app is served from a subpath (BASE_URL =
// '/Texnomart/dashboard/'); strip the trailing slash for the router basename.
// Stays '/' for local dev and plain builds.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

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
      { index: true, Component: Dashboard },
      { path: "dashboard/:metricId", Component: KpiDetailPage },
      { path: "applications", Component: ApplicationsPage },
      { path: "applications/:id", Component: ApplicationDetailPage },
      { path: "analytics", Component: AnalyticsPage },
      { path: "clients", Component: ClientsPage },
      { path: "clients/:id", Component: ClientDetailPage },
      { path: "partners", Component: PartnersPage },
      { path: "partners/:id", Component: PartnerDetailPage },
      { path: "branches", Component: BranchesPage },
      { path: "branches/:id", Component: BranchDetailPage },
      { path: "users", Component: UsersPage },
      { path: "users/:id", Component: UserDetailPage },
      { path: "telegram", Component: TelegramPage },
      { path: "notifications", Component: NotificationsPage },
      { path: "audit", Component: AuditPage },
      { path: "audit/:id", Component: AuditDetailPage },
      { path: "settings", Component: SettingsPage },
      { path: "profile", Component: ProfilePage },
    ],
  },
], { basename });
