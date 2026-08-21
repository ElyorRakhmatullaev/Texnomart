import { Info } from "lucide-react"
import { OtpPanel } from "@/app/components/alif/OtpPanel"
import { useScoringFlow } from "@/app/scoring-flow"
import { BANKS, ORDER } from "@/lib/broker-mock-data"
import { HoldStatusBar } from "./HoldStatusBar"

const ALIF = BANKS.find((b) => b.id === "alif")!

// Фаза «Код подтверждения кредита» — контент бывшего CreditOtpDialog без
// Dialog-обёртки (хост — AlifCheckoutDialog). OtpPanel монтируется вместе с
// фазой, так что её внутреннее состояние (код/ошибка/таймер) всегда чистое.
// Переход на success происходит сам (деривация в AlifCheckoutDialog) по
// факту confirmCredit — эта фаза не навигирует и ничего локально не хранит.
export function CreditOtpPhase() {
  const { state, confirmCredit } = useScoringFlow()
  const tenor = state.tenor ?? ORDER.tenor

  return (
    <div className="px-2 py-4">
      <h2 className="text-xl font-bold text-gray-900">Подтверждение кредита</h2>

      <div className="mt-4">
        <HoldStatusBar />
      </div>

      <div className="mt-4">
        <OtpPanel
          variant="credit"
          subtitle="Мы отправили код для подтверждения оформления кредита"
          ctaLabel="Завершить"
          onSuccess={confirmCredit}
        >
          <div className="grid grid-cols-2 gap-2 rounded-lg border bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-500">Банк</span>
            <span className="text-right font-medium text-gray-900">{ALIF.title}</span>

            <span className="text-gray-500">Сумма заказа</span>
            <span className="text-right font-medium tabular-nums text-gray-900">
              {ORDER.amount.toLocaleString("ru-RU")} сум
            </span>

            <span className="text-gray-500">Срок</span>
            <span className="text-right font-medium tabular-nums text-gray-900">{tenor} мес.</span>

            <span className="text-gray-500">Предоплата</span>
            <span className="text-right font-medium tabular-nums text-gray-900">
              {ALIF.prepayment.toLocaleString("ru-RU")} сум
            </span>
          </div>

          <div className="mt-3 flex gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Info className="size-4 shrink-0" />
            <span>
              Это другой код — не тот, что вы вводили при подтверждении карты. Введите код из последнего SMS.
            </span>
          </div>
        </OtpPanel>
      </div>
    </div>
  )
}
