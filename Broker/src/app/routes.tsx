import { createBrowserRouter, Navigate, Outlet } from "react-router"
import { useScoringFlow } from "./scoring-flow"
import { BrokerShell } from "./components/shell/BrokerShell"
import { BanksPage } from "./components/scoring/BanksPage"
import { VerificationPage } from "./components/scoring/VerificationPage"
import { MyIdPhotoPage } from "./components/scoring/MyIdPhotoPage"
import { HoldPage } from "./components/alif/HoldPage"
import { AdditionalDataPage } from "./components/alif/AdditionalDataPage"
import { InstallmentInfoPage } from "./components/alif/InstallmentInfoPage"
import { BANKS } from "@/lib/broker-mock-data"

// Под GitHub Pages приложение раздаётся из подпути (BASE_URL =
// '/Texnomart/broker/'); отбрасываем завершающий слэш для basename роутера.
// Остаётся '/' для локальной разработки и обычной сборки.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/"

const ALIF_PREPAYMENT = BANKS.find((b) => b.id === "alif")!.prepayment

type Stage = "myid" | "banks" | "hold" | "details" | "info"

function RequireStage({ stage }: { stage: Stage }) {
  const { state } = useScoringFlow()
  const ok =
    stage === "myid"
      ? state.cards.some((c) => c.confirmed)
      : stage === "banks"
        ? state.myidDone
        : stage === "hold"
          ? state.alifSelected
          : stage === "details"
            ? state.alifSelected && (ALIF_PREPAYMENT === 0 || state.holdStatus === "confirmed")
            : !!state.additionalData &&
              (ALIF_PREPAYMENT === 0 || state.holdStatus === "confirmed" || state.creditConfirmed)
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
        {
          element: <RequireStage stage="hold" />,
          children: [{ path: "/scoring/alif/hold", element: <HoldPage /> }],
        },
        {
          element: <RequireStage stage="details" />,
          children: [{ path: "/scoring/alif/details", element: <AdditionalDataPage /> }],
        },
        {
          element: <RequireStage stage="info" />,
          children: [{ path: "/scoring/alif/info", element: <InstallmentInfoPage /> }],
        },
        { path: "*", element: <Navigate to="/scoring/verification" replace /> },
      ],
    },
  ],
  { basename },
)
