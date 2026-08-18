import { createBrowserRouter, Navigate, Outlet, useNavigate } from "react-router"
import { useScoringFlow } from "./scoring-flow"
import { BrokerShell } from "./components/shell/BrokerShell"
import { BanksPage } from "./components/scoring/BanksPage"
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
            : !!state.additionalData
  return ok ? <Outlet /> : <Navigate to="/scoring/verification" replace />
}

// Заглушка — верификация клиента приходит в Task 2.
function VerificationPage() {
  const navigate = useNavigate()
  return (
    <div className="p-8">
      <p>Шаг 1 — Верификация клиента (Task 2)</p>
      <button type="button" className="mt-4 underline" onClick={() => navigate("/scoring/myid")}>
        [Заглушка] Продолжить
      </button>
    </div>
  )
}

// Заглушка — фото + проверка MyID приходят в Task 4. Сид-карта уже
// подтверждена (см. INITIAL в scoring-flow.tsx), так что гвард stage="myid"
// проходит без действий пользователя — кнопка нужна только чтобы отметить
// photoDone/myidDone и открыть /scoring/banks для сквозной проверки маршрутов.
function MyIdPhotoPage() {
  const { setPhotoDone, setMyidDone } = useScoringFlow()
  const navigate = useNavigate()
  return (
    <div className="p-8">
      <p>Шаг 2 — Проверка MyID (Task 4)</p>
      <button
        type="button"
        className="mt-4 underline"
        onClick={() => {
          setPhotoDone()
          setMyidDone()
          navigate("/scoring/banks")
        }}
      >
        [Заглушка] Пройти MyID
      </button>
    </div>
  )
}

// Заглушка — холд предоплаты приходит в Task 5 (в т.ч. редирект на /details,
// когда у выбранного банка prepayment === 0 — сейчас у Alif prepayment > 0,
// так что ветка всегда идёт через холд).
function HoldPage() {
  const { holdConfirm } = useScoringFlow()
  const navigate = useNavigate()
  return (
    <div className="p-8">
      <p>Холд предоплаты (Task 5)</p>
      <button
        type="button"
        className="mt-4 underline"
        onClick={() => {
          holdConfirm()
          navigate("/scoring/alif/details")
        }}
      >
        [Заглушка] Подтвердить холд
      </button>
    </div>
  )
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
