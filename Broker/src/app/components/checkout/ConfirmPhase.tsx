import { Button } from "@texnomart/ui/button"
import { DialogFooter } from "@texnomart/ui/dialog"
import { useScoringFlow } from "@/app/scoring-flow"
import { BANKS, ORDER } from "@/lib/broker-mock-data"

const ALIF = BANKS.find((b) => b.id === "alif")!

// Фаза «Подтвердить выбор предложения?» (Figma-фрейм 32). Первая фаза
// попапа AlifCheckoutDialog — показывается пока offerConfirmed === false.
export function ConfirmPhase() {
  const { state, confirmOffer, closeCheckout } = useScoringFlow()
  const tenor = state.tenor ?? ORDER.tenor

  return (
    <div className="flex flex-col items-center gap-6 px-2 py-4 text-center">
      <h2 className="text-xl font-bold text-gray-900">Подтвердить выбор предложения?</h2>

      <div className="flex w-full items-center gap-3 rounded-lg border p-4 text-left">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
          style={{ background: ALIF.brandColor }}
        >
          {ALIF.initial}
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-gray-900">{ALIF.title}</span>
            <span className="text-sm font-medium text-gray-700">{tenor} мес.</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-gray-500">
            <span>
              Лимит{" "}
              <span className="font-medium tabular-nums text-gray-700">
                {ALIF.limit.toLocaleString("ru-RU")} сум
              </span>
            </span>
            <span>
              Предоплата{" "}
              <span className="font-medium tabular-nums text-gray-700">
                {ALIF.prepayment.toLocaleString("ru-RU")} сум
              </span>
            </span>
          </div>
        </div>
      </div>

      <DialogFooter className="w-full sm:justify-center">
        <Button type="button" variant="outline" onClick={closeCheckout} className="h-11 flex-1 font-semibold">
          Назад
        </Button>
        <Button
          type="button"
          onClick={confirmOffer}
          className="h-11 flex-1 font-semibold text-black hover:opacity-90"
          style={{ background: "#FFD60A" }}
        >
          Подтвердить
        </Button>
      </DialogFooter>
    </div>
  )
}
