import { Info } from "lucide-react"
import { useNavigate } from "react-router"
import { useScoringFlow } from "@/app/scoring-flow"
import { BANKS, ORDER } from "@/lib/broker-mock-data"
import { OtpStepCard } from "./OtpStepCard"

const alif = BANKS.find((b) => b.id === "alif")!

export function CreditConfirmPage() {
  const { state, confirmCredit } = useScoringFlow()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-[880px] px-4 py-6">
      <OtpStepCard
        variant="credit"
        title="Подтверждение кредита"
        subtitle={
          <>
            Мы отправили <b>новый код</b> для подтверждения оформления кредита
          </>
        }
        ctaLabel="Завершить"
        completedNote={state.creditConfirmed ? "Кредит подтверждён" : undefined}
        onSuccess={() => {
          confirmCredit()
          navigate("/scoring/alif/success")
        }}
        onBack={() => navigate("/scoring/alif/details")}
      >
        <div className="rounded-lg border bg-gray-50 px-4 py-3 grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-500">Банк</div>
          <div className="text-right font-medium text-gray-900">{alif.title}</div>

          <div className="text-gray-500">Сумма</div>
          <div className="text-right font-medium tabular-nums text-gray-900">
            {ORDER.amount.toLocaleString("ru-RU")} сум
          </div>

          <div className="text-gray-500">Срок</div>
          <div className="text-right font-medium tabular-nums text-gray-900">{ORDER.tenor} мес.</div>

          <div className="text-gray-500">Доступный лимит</div>
          <div className="text-right font-medium tabular-nums text-gray-900">
            {alif.limit.toLocaleString("ru-RU")} сум
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-amber-50 text-amber-800 px-4 py-3 text-sm flex gap-2">
          <Info className="size-4 shrink-0 mt-0.5" />
          Это другой код — не тот, что вы вводили при привязке карты. Введите код из последнего SMS.
        </div>
      </OtpStepCard>
    </div>
  )
}
