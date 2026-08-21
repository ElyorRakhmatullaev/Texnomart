import { useScoringFlow, type CheckoutPhase } from "@/app/scoring-flow"
import { cn } from "@texnomart/ui/utils"

// ДЕМО-АФФОРДАНС. Реальных отказов, несовпадений телефона и бизнес-ошибок в
// моке взяться неоткуда: сеть не спрашивается, все операции успешны. Без
// явного переключателя все эти экраны — мёртвый код, который существует в
// репозитории и не существует в продукте.
//
// Панель собрана в одном месте (а не рассыпана чипами по фазам), чтобы при
// интеграции с API её можно было удалить одним движением: убрать этот файл и
// его вызов в AlifCheckoutDialog.

export interface DemoOption {
  id: string
  label: string
}

export interface DemoScenarioBarProps {
  phase: CheckoutPhase
}

export function DemoScenarioBar({ phase }: DemoScenarioBarProps) {
  const { state, setAlifLimitStatus, expireSession } = useScoringFlow()

  // Переключатели, относящиеся к текущей фазе. Фазы, у которых своих
  // сценариев нет, показывают только общий «Сессия истекла».
  const options: { label: string; active: boolean; onSelect: () => void }[] = []

  if (phase === "offer") {
    options.push(
      {
        label: "Одобрено",
        active: state.alifLimitStatus !== "rejected",
        onSelect: () => setAlifLimitStatus("ready"),
      },
      {
        label: "Отказ скоринга",
        active: state.alifLimitStatus === "rejected",
        onSelect: () => setAlifLimitStatus("rejected"),
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
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            option.active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
          )}
        >
          {option.label}
        </button>
      ))}
      <button
        type="button"
        onClick={expireSession}
        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
      >
        Сессия истекла
      </button>
    </div>
  )
}
