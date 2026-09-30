import { SquarePlus, Send, X } from "lucide-react"
import { toast } from "sonner"

const railButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-[0px_2px_4px_rgba(204,204,204,0.25)] transition-colors hover:bg-gray-50 hover:text-gray-900"

const railCaptionClass = "w-16 text-center text-[10px] leading-tight text-gray-500"

export interface ActionRailProps {
  /**
   * Открыть подтверждение «Завершить скоринг?» — сам диалог (EndScoringDialog) живёт
   * в BrokerShell; кнопка передаёт себя, чтобы фокус вернулся на неё после закрытия.
   */
  onEndScoring: (opener: HTMLElement) => void
}

// Плавающая панель действий справа (≥lg). Ниже lg те же три действия — в меню
// «Действия скоринга» в шапке BrokerShell.
export function ActionRail({ onEndScoring }: ActionRailProps) {
  return (
    <div className="fixed top-1/2 right-6 z-10 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          aria-label="Новая вкладка"
          onClick={() => toast("Действие вне прототипа")}
          className={railButtonClass}
        >
          <SquarePlus className="h-4 w-4" />
        </button>
        <span className={railCaptionClass}>Новая вкладка</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          aria-label="Отправить лимиты в Telegram"
          onClick={() => toast("Действие вне прототипа")}
          className={railButtonClass}
        >
          <Send className="h-4 w-4" />
        </button>
        <span className={railCaptionClass}>Отправить лимиты в Telegram</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          aria-label="Завершить скоринг"
          onClick={(e) => onEndScoring(e.currentTarget)}
          className={railButtonClass}
        >
          <X className="h-4 w-4" />
        </button>
        <span className={railCaptionClass}>Завершить скоринг</span>
      </div>
    </div>
  )
}
