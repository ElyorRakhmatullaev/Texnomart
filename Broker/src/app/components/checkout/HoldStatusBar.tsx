import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
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
} from "@texnomart/ui/alert-dialog"
import { useScoringFlow } from "@/app/scoring-flow"
import { ALIF_PREPAYMENT, maskCardNumber } from "@/lib/broker-mock-data"

// Плашка «предоплата удержана» для фаз после холда (доп. данные, OTP кредита).
// Без неё статус холда был виден ~600 мс на самой фазе холда и дальше исчезал,
// хотя экран обещает «до завершения оформления холд можно отменить» — здесь
// это обещание и выполняется.
//
// Отмена не навигирует сама: holdCancel меняет статус, а checkoutPhaseOf
// возвращает попап на фазу холда, где показано состояние «Холд отменён».
// Введённые доп. данные при этом сохраняются.
export function HoldStatusBar() {
  const { state, holdCancel } = useScoringFlow()
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Ни одна фаза после холда не достижима с неподтверждённым удержанием
  // (checkoutPhaseOf), так что проверка — страховка на случай гонки состояний.
  if (state.holdStatus !== "confirmed") return null

  const card = state.cards.find((c) => c.confirmed)

  function handleCancel() {
    setConfirmOpen(false)
    holdCancel()
    toast("Холд отменён — предоплата разблокирована")
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <CheckCircle2 className="size-4 shrink-0" />
        <span className="font-medium">Предоплата удержана</span>
        <span className="tabular-nums">{ALIF_PREPAYMENT.toLocaleString("ru-RU")} сум</span>
        {card && <span className="text-emerald-700">· {maskCardNumber(card.mask)}</span>}
        {/* На узком экране строка переносится — ссылка занимает свою строку целиком
            и выравнивается по левому краю, а не «висит» справа */}
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="w-full text-left font-medium text-emerald-900 underline-offset-2 transition-colors hover:underline sm:ml-auto sm:w-auto sm:text-right"
        >
          Отменить холд
        </button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отменить удержание предоплаты?</AlertDialogTitle>
            <AlertDialogDescription>
              {ALIF_PREPAYMENT.toLocaleString("ru-RU")} сум будут разблокированы на карте клиента. Оформление
              вернётся к шагу предоплаты — чтобы продолжить, удержание придётся подтвердить заново. Введённые
              данные сохранятся.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Не отменять</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Отменить холд</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
