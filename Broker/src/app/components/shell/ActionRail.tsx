import { useState } from "react"
import { useNavigate } from "react-router"
import { SquarePlus, Send, X } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@texnomart/ui/alert-dialog"
import { useScoringFlow } from "@/app/scoring-flow"

const railButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-[0px_2px_4px_rgba(204,204,204,0.25)] transition-colors hover:bg-gray-50 hover:text-gray-900"

const railCaptionClass = "w-16 text-center text-[10px] leading-tight text-gray-500"

export function ActionRail() {
  const navigate = useNavigate()
  const { resetFlow } = useScoringFlow()
  const [open, setOpen] = useState(false)

  const handleFinish = () => {
    setOpen(false)
    resetFlow()
    navigate("/scoring/verification")
  }

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

      <AlertDialog open={open} onOpenChange={setOpen}>
        <div className="flex flex-col items-center gap-1">
          <AlertDialogTrigger aria-label="Завершить скоринг" className={railButtonClass}>
            <X className="h-4 w-4" />
          </AlertDialogTrigger>
          <span className={railCaptionClass}>Завершить скоринг</span>
        </div>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Завершить скоринг?</AlertDialogTitle>
            <AlertDialogDescription>Текущая сессия будет сброшена.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinish}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Завершить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
