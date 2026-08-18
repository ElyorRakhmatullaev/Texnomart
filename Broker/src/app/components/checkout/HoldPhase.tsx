import { useEffect } from "react"
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@texnomart/ui/button"
import { useScoringFlow } from "@/app/scoring-flow"
import { ALIF_PREPAYMENT, PREPAYMENT_HOLD_DELAY_MS } from "@/lib/broker-mock-data"

// "9860 3569 7266 1296" → "9860 •••• 1296" (первые/последние 4 цифры).
function maskCardNumber(mask: string): string {
  const digits = mask.replace(/\D/g, "")
  if (digits.length < 8) return mask
  return `${digits.slice(0, 4)} •••• ${digits.slice(-4)}`
}

// Фаза «Удержание предоплаты» — контент бывшей HoldPage без страничного
// контейнера/степпера. Переход на details происходит сам (деривация в
// AlifCheckoutDialog), эта фаза не навигирует.
export function HoldPhase() {
  const { state, holdHold, holdConfirm, holdCancel, closeCheckout } = useScoringFlow()

  // holdStatus персистится в sessionStorage — если попап переоткрыт заново,
  // пока холд ещё "held" (таймер подтверждения не успел сработать до
  // закрытия/перезагрузки), перезапускаем таймер, чтобы подтверждение всё
  // равно произошло.
  useEffect(() => {
    if (state.holdStatus !== "held") return
    const t = setTimeout(holdConfirm, PREPAYMENT_HOLD_DELAY_MS)
    return () => clearTimeout(t)
  }, [state.holdStatus, holdConfirm])

  // Повторный вход после отмены холда отображается как исходное состояние —
  // отдельного экшена сброса "cancelled" → "none" в провайдере нет, это чисто
  // визуальная трактовка на уровне фазы.
  const status = state.holdStatus === "cancelled" ? "none" : state.holdStatus

  const card = state.cards.find((c) => c.confirmed)

  function handleCancel() {
    holdCancel()
    closeCheckout()
    toast("Холд отменён")
  }

  return (
    <div className="px-2 py-4">
      <h2 className="text-xl font-bold text-gray-900">Предоплата по рассрочке</h2>
      <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">
        {ALIF_PREPAYMENT.toLocaleString("ru-RU")} сум
      </p>

      {card && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-700">
          <CreditCard className="size-4 shrink-0 text-gray-400" />
          <span>Карта списания: {maskCardNumber(card.mask)}</span>
        </div>
      )}

      <p className="mt-4 text-sm text-gray-500">
        Средства будут удержаны (холд) и списаны после оформления кредита. До завершения оформления холд можно
        отменить.
      </p>

      <div className="mt-6">
        {status === "none" && (
          <Button
            type="button"
            onClick={holdHold}
            className="h-11 w-full font-semibold text-black hover:opacity-90"
            style={{ background: "#FFD60A" }}
          >
            Подтвердить удержание
          </Button>
        )}

        {status === "held" && (
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
            <Loader2 className="size-4 shrink-0 animate-spin" />
            Предоплата удерживается…
          </div>
        )}

        {status === "confirmed" && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-700">
            <CheckCircle2 className="size-5 shrink-0" />
            <span className="font-medium">Предоплата подтверждена</span>
          </div>
        )}
      </div>

      {status !== "held" && !state.creditConfirmed && (
        <button
          type="button"
          onClick={handleCancel}
          className="mt-4 block w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          Отменить холд
        </button>
      )}
    </div>
  )
}
