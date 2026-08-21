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

  function handleConfirm() {
    if (!reasonKey) return
    onConfirm(reasonKey)
    setReasonKey("")
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
          <AlertDialogCancel>Не отменять</AlertDialogCancel>
          <AlertDialogAction
            disabled={!reasonKey}
            onClick={handleConfirm}
            className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            Отменить заявку
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
