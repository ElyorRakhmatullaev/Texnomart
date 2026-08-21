import { useState } from "react"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { Button } from "@texnomart/ui/button"
import { DialogFooter } from "@texnomart/ui/dialog"
import { Skeleton } from "@texnomart/ui/skeleton"
import { cn } from "@texnomart/ui/utils"
import { buildPlans } from "@/lib/alif-application"
import { ALIF_LIMITS, ALIF_PREPAYMENT, ALIF_REJECT_REASONS, BANKS, ORDER } from "@/lib/broker-mock-data"
import { useScoringFlow } from "@/app/scoring-flow"

const ALIF = BANKS.find((b) => b.id === "alif")!
const PLANS = buildPlans(ALIF_LIMITS, ORDER.amount - ALIF_PREPAYMENT)

// Экран 1 ТЗ. Здесь выбирается условие рассрочки (condition_id) — это
// единственное место выбора: карточка банка его больше не предлагает, чтобы
// не держать один и тот же выбор в двух источниках правды.
export function OfferPhase() {
  const { state, selectPlan, confirmOffer, closeCheckout } = useScoringFlow()
  const [planId, setPlanId] = useState(state.planId ?? PLANS[0].id)

  if (state.alifLimitStatus === "rejected") {
    return (
      <div className="px-2 py-4">
        <h2 className="text-xl font-bold text-gray-900">Alif Nasiya отказал в рассрочке</h2>
        <div className="mt-4 flex gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          <div>
            <p className="font-medium">Причины отказа</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {ALIF_REJECT_REASONS.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
        <DialogFooter className="mt-6 w-full">
          <Button type="button" variant="outline" onClick={closeCheckout} className="h-11 w-full font-semibold">
            Назад к банкам
          </Button>
        </DialogFooter>
      </div>
    )
  }

  if (state.alifLimitStatus === "pending") {
    return (
      <div className="px-2 py-4">
        <h2 className="text-xl font-bold text-gray-900">Предложение Alif Nasiya</h2>
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="size-4 shrink-0 animate-spin" />
          Рассчитываем лимиты…
        </div>
        <div className="mt-4 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    )
  }

  function handleSubmit() {
    selectPlan(planId)
    confirmOffer()
  }

  return (
    <div className="px-2 py-4">
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
          style={{ background: ALIF.brandColor }}
        >
          {ALIF.initial}
        </div>
        <h2 className="flex-1 text-xl font-bold text-gray-900">{ALIF.title}</h2>
      </div>
      <p className="mt-2 text-sm text-gray-500">Выберите условие рассрочки</p>

      <div className="mt-4 space-y-2">
        {PLANS.map((plan) => {
          const selected = plan.id === planId
          return (
            <button
              key={plan.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setPlanId(plan.id)}
              className={cn(
                "flex w-full flex-col gap-2 rounded-lg border p-4 text-left transition-colors",
                selected ? "bg-amber-50/40" : "hover:bg-gray-50",
              )}
              style={selected ? { borderColor: "#FFD60A" } : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-gray-900">{plan.duration} мес.</span>
                <span className="flex items-center gap-2">
                  {plan.promo && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {plan.promo}
                    </span>
                  )}
                  {selected && <Check className="size-4 text-emerald-600" />}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                <span className="text-gray-500">Лимит</span>
                <span className="text-right font-medium tabular-nums text-gray-900 sm:text-left">
                  {plan.amount.toLocaleString("ru-RU")} сум
                </span>
                <span className="hidden sm:block" />
                <span className="text-gray-500">Ежемесячный платёж</span>
                <span className="text-right font-medium tabular-nums text-gray-900 sm:text-left">
                  {plan.monthlyPayment.toLocaleString("ru-RU")} сум
                </span>
                <span className="hidden sm:block" />
                <span className="text-gray-500">Комиссия</span>
                <span className="text-right font-medium tabular-nums text-gray-900 sm:text-left">
                  {plan.commission.toLocaleString("ru-RU")} сум
                </span>
                <span className="hidden sm:block" />
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
        <span className="text-gray-500">Предоплата</span>
        <span className="font-medium tabular-nums text-gray-900">
          {ALIF_PREPAYMENT.toLocaleString("ru-RU")} сум
        </span>
      </div>

      <DialogFooter className="mt-6 w-full sm:justify-center">
        <Button type="button" variant="outline" onClick={closeCheckout} className="h-11 flex-1 font-semibold">
          Назад
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          className="h-11 flex-1 font-semibold text-black hover:opacity-90"
          style={{ background: "#FFD60A" }}
        >
          Продолжить
        </Button>
      </DialogFooter>
    </div>
  )
}
