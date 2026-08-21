import { AlertCircle } from "lucide-react"
import { cn } from "@texnomart/ui/utils"

export interface PhaseErrorProps {
  /** Текст поля message из ответа API. */
  message: string
  className?: string
}

// Единая плашка ошибки для всех фаз (§6 ТЗ): иконка + message понятным
// текстом. Оба формата ошибок Alif сводятся в моке к строке message, поэтому
// компоненту достаточно её одной.
export function PhaseError({ message, className }: PhaseErrorProps) {
  return (
    <div
      role="alert"
      className={cn("flex gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700", className)}
    >
      <AlertCircle className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
