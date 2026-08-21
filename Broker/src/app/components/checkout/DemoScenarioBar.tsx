import { useState } from "react"
import { useScoringFlow, type CheckoutPhase } from "@/app/scoring-flow"
import { cn } from "@texnomart/ui/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@texnomart/ui/select"
import type { ApplicationErrorKey } from "@/lib/alif-application"

// ДЕМО-АФФОРДАНС. Реальных отказов, несовпадений телефона и бизнес-ошибок в
// моке взяться неоткуда: сеть не спрашивается, все операции успешны. Без
// явного переключателя все эти экраны — мёртвый код, который существует в
// репозитории и не существует в продукте.
//
// Панель собрана в одном месте (а не рассыпана чипами по фазам), чтобы при
// интеграции с API её можно было удалить одним движением: убрать этот файл и
// его вызов в AlifCheckoutDialog.

export interface DemoScenarioBarProps {
  phase: CheckoutPhase
  // Значение поднято в AlifCheckoutDialog — он же хостит CardAttachPhase,
  // которому нужно то же значение синхронно, а не с задержкой sessionStorage
  // (одинарные same-tab записи не шлют событие storage).
  phoneMatch: boolean
  onPhoneMatchChange: (value: boolean) => void
}

// Отдельный ключ, а не поле потока: это настройка демо-стенда, а не данные
// оформления, и она не должна попадать в состояние заявки.
export const DEMO_PHONE_MATCH_KEY = "broker:demo-phone-match"

export function readDemoPhoneMatch(): boolean {
  try {
    return sessionStorage.getItem(DEMO_PHONE_MATCH_KEY) !== "false"
  } catch {
    return true
  }
}

export function writeDemoPhoneMatch(value: boolean) {
  try {
    sessionStorage.setItem(DEMO_PHONE_MATCH_KEY, String(value))
  } catch {
    // sessionStorage недоступен — остаёмся на значении по умолчанию
  }
}

// Исход заявки на фазе «application»: одно из трёх результирующих состояний
// или одна из шести именованных бизнес-ошибок ТЗ. Читается в обработчике
// клика (ApplicationPhase.handleSubmit), а не во время рендера — см. брифы
// задачи 11.
export type DemoApplicationOutcome = "approved" | "reviewing" | "rejected" | ApplicationErrorKey

export const DEMO_APPLICATION_OUTCOME_KEY = "broker:demo-application-outcome"

export const DEMO_APPLICATION_OUTCOMES: { id: DemoApplicationOutcome; label: string }[] = [
  { id: "approved", label: "Одобрено сразу" },
  { id: "reviewing", label: "На рассмотрении" },
  { id: "rejected", label: "Отказано" },
  { id: "duplicate_marking", label: "Ошибка: маркировка занята" },
  { id: "has_reviewing", label: "Ошибка: заявка на рассмотрении" },
  { id: "has_new", label: "Ошибка: новая заявка" },
  { id: "amount_too_small", label: "Ошибка: сумма меньше 1000" },
  { id: "scoring_reject", label: "Ошибка: заявка не принята" },
  { id: "amount_too_large", label: "Ошибка: сумма свыше 100 млн" },
]

export function readDemoApplicationOutcome(): DemoApplicationOutcome {
  try {
    return (sessionStorage.getItem(DEMO_APPLICATION_OUTCOME_KEY) as DemoApplicationOutcome) ?? "approved"
  } catch {
    return "approved"
  }
}

export function writeDemoApplicationOutcome(value: DemoApplicationOutcome) {
  try {
    sessionStorage.setItem(DEMO_APPLICATION_OUTCOME_KEY, value)
  } catch {
    // sessionStorage недоступен — остаёмся на значении по умолчанию
  }
}

export function DemoScenarioBar({ phase, phoneMatch, onPhoneMatchChange }: DemoScenarioBarProps) {
  const { state, setAlifLimitStatus, expireSession } = useScoringFlow()
  const [outcome, setOutcome] = useState(readDemoApplicationOutcome)

  // Переключатели, относящиеся к текущей фазе. Фазы, у которых своих
  // сценариев нет, показывают только общий «Сессия истекла».
  const options: { label: string; active: boolean; onSelect: () => void }[] = []

  if (phase === "offer") {
    options.push(
      {
        label: "Одобрено",
        active: state.alifLimitStatus === "ready",
        onSelect: () => setAlifLimitStatus("ready"),
      },
      {
        label: "Отказ скоринга",
        active: state.alifLimitStatus === "rejected",
        onSelect: () => setAlifLimitStatus("rejected"),
      },
    )
  }

  if (phase === "card") {
    options.push(
      {
        label: "Телефон совпадает",
        active: phoneMatch,
        onSelect: () => onPhoneMatchChange(true),
      },
      {
        label: "Телефон не совпадает",
        active: !phoneMatch,
        onSelect: () => onPhoneMatchChange(false),
      },
    )
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
      <span className="text-xs font-medium text-gray-400">Демо-сценарий:</span>
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          onClick={option.onSelect}
          className={cn(
            "flex min-h-11 items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
            option.active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
          )}
        >
          {option.label}
        </button>
      ))}
      {phase === "application" && (
        <Select
          value={outcome}
          onValueChange={(value) => {
            const next = value as DemoApplicationOutcome
            writeDemoApplicationOutcome(next)
            setOutcome(next)
          }}
        >
          <SelectTrigger size="sm" className="h-11 w-auto min-w-[200px] rounded-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEMO_APPLICATION_OUTCOMES.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <button
        type="button"
        onClick={expireSession}
        className="flex min-h-11 items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
      >
        Сессия истекла
      </button>
    </div>
  )
}
