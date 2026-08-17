import { useLocation } from "react-router"
import { cn } from "@texnomart/ui/utils"
import { Progress } from "@texnomart/ui/progress"
import { useScoringFlow } from "@/app/scoring-flow"

const BASE_STEPS = [
  "Верификация клиента",
  "Проверка MyID",
  "Выбор рассрочки",
  "Дополнительные данные",
  "Информация по рассрочке",
]

const ALIF_STEPS = [
  "Верификация клиента",
  "Проверка MyID",
  "Выбор рассрочки",
  "Привязка карты",
  "Дополнительные данные",
  "Подтверждение кредита",
  "Информация по рассрочке",
]

function activeIndexFor(pathname: string): number {
  if (pathname.includes("/alif/card")) return 3
  if (pathname.includes("/alif/details")) return 4
  if (pathname.includes("/alif/confirm")) return 5
  if (pathname.includes("/alif/success")) return 6
  return 2 // /scoring/banks — «Выбор рассрочки»
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

  const steps = state.alifSelected ? ALIF_STEPS : BASE_STEPS
  const activeIndex = Math.min(activeIndexFor(location.pathname), steps.length - 1)

  return (
    <div className="bg-white">
      {/* ≥md — горизонтальный ряд: подпись над точкой, соединительные линии */}
      <div className="hidden overflow-x-auto md:block">
        <div className="flex min-w-max items-start justify-center gap-0 px-6 py-4">
          {steps.map((label, i) => {
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
                {i < steps.length - 1 && (
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
          Шаг {activeIndex + 1} из {steps.length} · {steps[activeIndex]}
        </p>
        <Progress value={((activeIndex + 1) / steps.length) * 100} className="h-1" />
      </div>
    </div>
  )
}
