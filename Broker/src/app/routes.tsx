import { createBrowserRouter, Navigate, Outlet } from "react-router"
import { useScoringFlow } from "./scoring-flow"
import { BrokerShell } from "./components/shell/BrokerShell"
import { BanksPage } from "./components/scoring/BanksPage"
import { CardAttachPage } from "./components/alif/CardAttachPage"

// TODO(Task 6+): заменить на настоящие страницы, файлы см. в плане.
function AdditionalDataPage() {
  return <div className="p-8">Дополнительные данные</div>
}
function CreditConfirmPage() {
  return <div className="p-8">Подтверждение кредита</div>
}
function SuccessPage() {
  return <div className="p-8">Кредит оформлен</div>
}

// Под GitHub Pages приложение раздаётся из подпути (BASE_URL =
// '/Texnomart/broker/'); отбрасываем завершающий слэш для basename роутера.
// Остаётся '/' для локальной разработки и обычной сборки.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/"

function RequireAlif({ stage }: { stage: "card" | "details" | "confirm" | "success" }) {
  const { state } = useScoringFlow()
  const ok =
    stage === "card"
      ? state.alifSelected
      : stage === "details"
        ? state.alifSelected && state.cardAttached
        : stage === "confirm"
          ? state.alifSelected && state.cardAttached && !!state.additionalData
          : state.creditConfirmed
  return ok ? <Outlet /> : <Navigate to="/scoring/banks" replace />
}

export const router = createBrowserRouter(
  [
    {
      element: <BrokerShell />, // топ-бар + степпер + Outlet (Task 3)
      children: [
        { path: "/", element: <Navigate to="/scoring/banks" replace /> },
        { path: "/scoring/banks", element: <BanksPage /> },
        { element: <RequireAlif stage="card" />, children: [{ path: "/scoring/alif/card", element: <CardAttachPage /> }] },
        { element: <RequireAlif stage="details" />, children: [{ path: "/scoring/alif/details", element: <AdditionalDataPage /> }] },
        { element: <RequireAlif stage="confirm" />, children: [{ path: "/scoring/alif/confirm", element: <CreditConfirmPage /> }] },
        { element: <RequireAlif stage="success" />, children: [{ path: "/scoring/alif/success", element: <SuccessPage /> }] },
        { path: "*", element: <Navigate to="/scoring/banks" replace /> },
      ],
    },
  ],
  { basename },
)
