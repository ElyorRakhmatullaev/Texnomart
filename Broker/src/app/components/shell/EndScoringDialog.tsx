import type { RefObject } from "react"
import { useNavigate } from "react-router"
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
import { useScoringFlow } from "@/app/scoring-flow"

export interface EndScoringDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Куда вернуть фокус после закрытия. У диалога нет своего `AlertDialogTrigger`,
   * поэтому Radix сам фокус не возвращает — он падал бы на <body>.
   */
  returnFocusRef?: RefObject<HTMLElement | null>
}

// Подтверждение «Завершить скоринг?» — контролируемое, без собственного триггера:
// открывается и из ActionRail (≥lg), и из меню «Действия скоринга» в шапке (<lg).
// Подтверждение делает то же, что зелёная «Завершить скоринг» на экране успеха:
// сброс потока + возврат к верификации.
export function EndScoringDialog({ open, onOpenChange, returnFocusRef }: EndScoringDialogProps) {
  const navigate = useNavigate()
  const { resetFlow } = useScoringFlow()

  function handleFinish() {
    onOpenChange(false)
    resetFlow()
    navigate("/scoring/verification")
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        onCloseAutoFocus={(e) => {
          const el = returnFocusRef?.current
          if (el?.isConnected) {
            e.preventDefault()
            el.focus()
          }
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Завершить скоринг?</AlertDialogTitle>
          <AlertDialogDescription>Текущая сессия будет сброшена.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11 md:h-9">Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleFinish}
            className="h-11 bg-destructive text-white hover:bg-destructive/90 md:h-9"
          >
            Завершить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
