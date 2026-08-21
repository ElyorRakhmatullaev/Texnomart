import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@texnomart/ui/alert-dialog"
import { cn } from "@texnomart/ui/utils"
import { CANCEL_REASONS } from "@/lib/alif-application"

export interface CancelApplicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reasonKey: string) => void
}

// Отмена заявки (§4 ТЗ): причина обязательна — API принимает cancel_reason_key,
// поэтому кнопка подтверждения заблокирована, пока причина не выбрана.
export function CancelApplicationDialog({ open, onOpenChange, onConfirm }: CancelApplicationDialogProps) {
  const [reasonKey, setReasonKey] = useState("")

  // Компонент не размонтируется между открытиями (меняется только `open`),
  // поэтому без явного сброса причина от отменённой/закрытой крестом попытки
  // осталась бы в стейте — при повторном открытии строка была бы уже выбрана,
  // а кнопка «Отменить заявку» — уже разблокирована. Действие необратимое,
  // так что каждое открытие должно начинаться с чистого выбора. Сброс сделан
  // именно в обработчике закрытия (а не эффектом на открытие), чтобы он
  // произошёл синхронно с самим закрытием — крестом, Escape, кликом по фону
  // или «Не отменять» — и ничего не успело мигнуть на повторном открытии.
  function handleOpenChange(next: boolean) {
    if (!next) setReasonKey("")
    onOpenChange(next)
  }

  function handleConfirm() {
    if (!reasonKey) return
    onConfirm(reasonKey)
    handleOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-h-[85dvh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 shrink-0 text-amber-500" />
            Отменить заявку?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Укажите причину отмены. Если предоплата удержана, она будет разблокирована на карте клиента.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1">
          {CANCEL_REASONS.map((reason) => (
            <button
              key={reason.key}
              type="button"
              onClick={() => setReasonKey(reason.key)}
              className={cn(
                // min-h-11 — тап-таргет ≥44px (Pattern K): один py-2.5 на text-sm даёт
                // только 40px, элемент списка должен добирать высоту сам.
                "flex min-h-11 w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                reason.key === reasonKey
                  ? "bg-amber-50 font-medium text-gray-900"
                  : "text-gray-700 hover:bg-gray-50",
              )}
            >
              {reason.label}
            </button>
          ))}
        </div>

        <AlertDialogFooter>
          {/* h-11 — тап-таргет ≥44px (Pattern K), дефолт shadcn-кнопки (h-9=36px) не дотягивает. */}
          <AlertDialogCancel className="h-11">Не отменять</AlertDialogCancel>
          <AlertDialogAction
            disabled={!reasonKey}
            onClick={handleConfirm}
            className="h-11 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            Отменить заявку
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
