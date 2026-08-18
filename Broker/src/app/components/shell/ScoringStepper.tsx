import { useLocation } from "react-router"
import { cn } from "@texnomart/ui/utils"
import { Progress } from "@texnomart/ui/progress"
import { checkoutPhaseOf, useScoringFlow, type CheckoutPhase } from "@/app/scoring-flow"
import { ALIF_PREPAYMENT } from "@/lib/broker-mock-data"

const STEPS = [
  "Верификация клиента",
  "Проверка MyID",
  "Выбор рассрочки",
  "Дополнительные данные",
  "Информация по рассрочке",
]

// Шаги 4–5 больше не отдельные страницы — они достижимы только визуально,
// подсветкой во время открытого попапа AlifCheckoutDialog (см. checkoutPhaseOf).
const PHASE_INDEX: Record<CheckoutPhase, number> = {
  confirm: 2,
  hold: 2,
  details: 3,
  otp: 4,
  success: 4,
}

function activeIndexFor(pathname: string): number {
  if (pathname.includes("/verification")) return 0
  if (pathname.includes("/myid")) return 1
  if (pathname.includes("/banks")) return 2
  return 0
}

type StepStatus = "finished" | "active" | "default"

function statusFor(index: number, activeIndex: number): StepStatus {
  if (index < activeIndex) return "finished"
  if (index === activeIndex) return "active"
  return "default"
}

export function ScoringStepper() {
  const location = useLocation()
  const { state } = useScoringFlow()
  // checkoutOpen persists across the whole session (sessionStorage), so it
  // stays true even after a browser-Back to /scoring/myid, where the popup
  // isn't hosted — trust the phase-based highlight only on the banks route.
  const rawIndex =
    state.checkoutOpen && location.pathname.includes("/scoring/banks")
      ? PHASE_INDEX[checkoutPhaseOf(state, ALIF_PREPAYMENT)]
      : activeIndexFor(location.pathname)
  const activeIndex = Math.min(rawIndex, STEPS.length - 1)

  return (
    <div className="bg-white">
      {/* ≥md — горизонтальный ряд: подпись над точкой, соединительные линии */}
      <div className="hidden overflow-x-auto md:block">
        <div className="flex min-w-max items-start justify-center gap-0 px-6 py-4">
          {STEPS.map((label, i) => {
            const status = statusFor(i, activeIndex)
            return (
              <div key={label} className="flex items-start">
                <div className="flex w-20 shrink-0 flex-col items-center gap-2 px-1 lg:w-28">
                  <div className="flex h-8 items-end justify-center text-center">
                    <span
                      className={cn(
                        "text-xs font-medium leading-tight",
                        status === "active" ? undefined : "text-gray-400",
                      )}
                      style={status === "active" ? { color: "#EAB308" } : undefined}
                    >
                      {label}
                    </span>
                  </div>
                  <div className="flex h-3 items-center">
                    <span
                      aria-hidden
                      className={cn(
                        "h-3 w-3 shrink-0 rounded-full border-2",
                        status === "finished" && "border-primary bg-primary",
                        status === "active" && "bg-white border-primary",
                        status === "default" && "bg-white border-gray-300",
                      )}
                    />
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex w-6 flex-col gap-2 lg:w-10">
                    <div aria-hidden className="h-8" />
                    <div className="flex h-3 items-center">
                      <span
                        aria-hidden
                        className={cn("h-0.5 w-full", i < activeIndex ? "bg-primary" : "bg-gray-200")}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* <md — компактный режим: «Шаг N из M · Название» + тонкий Progress */}
      <div className="px-4 py-3 md:hidden">
        <p className="mb-2 text-xs font-medium text-gray-700">
          Шаг {activeIndex + 1} из {STEPS.length} · {STEPS[activeIndex]}
        </p>
        <Progress value={((activeIndex + 1) / STEPS.length) * 100} className="h-1" />
      </div>
    </div>
  )
}
