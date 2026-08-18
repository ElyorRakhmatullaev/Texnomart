import { createBrowserRouter, Navigate, Outlet } from "react-router"
import { useScoringFlow } from "./scoring-flow"
import { BrokerShell } from "./components/shell/BrokerShell"
import { BanksPage } from "./components/scoring/BanksPage"
import { VerificationPage } from "./components/scoring/VerificationPage"
import { MyIdPhotoPage } from "./components/scoring/MyIdPhotoPage"

// Под GitHub Pages приложение раздаётся из подпути (BASE_URL =
// '/Texnomart/broker/'); отбрасываем завершающий слэш для basename роутера.
// Остаётся '/' для локальной разработки и обычной сборки.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/"

// Ветка Alif (холд/доп. данные/OTP/успех) больше не отдельные маршруты — это
// фазы AlifCheckoutDialog поверх /scoring/banks (см. checkoutPhaseOf в
// scoring-flow.tsx). Оставшиеся стадии-маршруты — только шаги 1–2.
type Stage = "myid" | "banks"

function RequireStage({ stage }: { stage: Stage }) {
  const { state } = useScoringFlow()
  const ok = stage === "myid" ? state.cards.some((c) => c.confirmed) : state.myidDone
  return ok ? <Outlet /> : <Navigate to="/scoring/verification" replace />
}

export const router = createBrowserRouter(
  [
    {
      element: <BrokerShell />, // топ-бар + степпер + Outlet (Task 3)
      children: [
        { path: "/", element: <Navigate to="/scoring/verification" replace /> },
        { path: "/scoring/verification", element: <VerificationPage /> },
        {
          element: <RequireStage stage="myid" />,
          children: [{ path: "/scoring/myid", element: <MyIdPhotoPage /> }],
        },
        {
          element: <RequireStage stage="banks" />,
          children: [{ path: "/scoring/banks", element: <BanksPage /> }],
        },
        { path: "*", element: <Navigate to="/scoring/verification" replace /> },
      ],
    },
  ],
  { basename },
)
