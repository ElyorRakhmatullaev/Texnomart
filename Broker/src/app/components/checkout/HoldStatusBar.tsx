import { CheckCircle2 } from "lucide-react"
import { useScoringFlow } from "@/app/scoring-flow"
import { ALIF_PREPAYMENT, maskCardNumber } from "@/lib/broker-mock-data"

// Плашка «предоплата удержана» для фаз после холда (доп. данные, OTP кредита).
// Без неё статус холда был виден ~600 мс на самой фазе холда и дальше исчезал,
// хотя экран обещает «до завершения оформления холд можно отменить».
//
// Чисто информационная, без действий: checkoutPhaseOf пускает на фазы после
// холда только когда holdStatus === "confirmed" И application.status !== "NEW"
// — то есть ровно там, где эта плашка видна, canCancelHold уже всегда false.
// Сама отмена холда живёт на фазе холда (HoldPhase), пока заявка ещё «Новая»;
// отсюда выход при более позднем статусе — «Отменить заявку» в шапке попапа.
export function HoldStatusBar() {
  const { state } = useScoringFlow()

  // Ни одна фаза после холда не достижима с неподтверждённым удержанием
  // (checkoutPhaseOf), так что проверка — страховка на случай гонки состояний.
  if (state.holdStatus !== "confirmed") return null

  const card = state.cards.find((c) => c.confirmed)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      <CheckCircle2 className="size-4 shrink-0" />
      <span className="font-medium">Предоплата удержана</span>
      <span className="tabular-nums">{ALIF_PREPAYMENT.toLocaleString("ru-RU")} сум</span>
      {card && <span className="text-emerald-700">· {maskCardNumber(card.mask)}</span>}
      <span className="text-xs text-gray-500">
        Холд можно отменить, только пока заявка новая. Позже — через отмену заявки.
      </span>
    </div>
  )
}
