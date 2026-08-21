import { useEffect, useRef, useState } from "react"
import { addDays, format } from "date-fns"
import { Loader2 } from "lucide-react"
import { Button } from "@texnomart/ui/button"
import { DialogFooter } from "@texnomart/ui/dialog"
import { Input } from "@texnomart/ui/input"
import { cn } from "@texnomart/ui/utils"
import { APPLICATION_ERRORS, buildPlans, makeApplicationId, type ApplicationErrorKey } from "@/lib/alif-application"
import {
  ALIF_LIMITS,
  ALIF_PREPAYMENT,
  APPLICATION_SUBMIT_DELAY_MS,
  FIRST_PAYMENT_DEFAULT_DAYS,
  FIRST_PAYMENT_MAX_DAYS,
  ORDER,
  ORDER_ITEM,
} from "@/lib/broker-mock-data"
import { useScoringFlow } from "@/app/scoring-flow"
import { readDemoApplicationOutcome } from "./DemoScenarioBar"
import { PhaseError } from "./PhaseError"

const PLANS = buildPlans(ALIF_LIMITS, ORDER.amount - ALIF_PREPAYMENT)

function isoDate(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

// Экран 4 ТЗ. Товар подтягивается «из 1С» (ORDER_ITEM), условие — с экрана 1.
export function ApplicationPhase() {
  const { state, createApplication } = useScoringFlow()
  const plan = PLANS.find((p) => p.id === state.planId) ?? PLANS[0]

  const today = new Date()
  const minDate = isoDate(today)
  const maxDate = isoDate(addDays(today, FIRST_PAYMENT_MAX_DAYS))
  const [firstPaymentDate, setFirstPaymentDate] = useState(() =>
    isoDate(addDays(today, FIRST_PAYMENT_DEFAULT_DAYS)),
  )
  const [imei, setImei] = useState("")

  const dateValid = firstPaymentDate >= minDate && firstPaymentDate <= maxDate
  const imeiValid = !ORDER_ITEM.needsMarking || imei.trim().length > 0
  const canSubmit = dateValid && imeiValid

  const [submitting, setSubmitting] = useState(false)
  const [errorKey, setErrorKey] = useState<ApplicationErrorKey | null>(null)

  // Таймер живёт в ref, а не в замыкании setTimeout, чтобы его можно было
  // отменить при уходе с фазы во время ожидания (закрытие попапа и т.п.):
  // без очистки колбэк всё равно сработал бы и молча создал заявку в уже
  // покинутом оператором флоу — тот же приём, что и в CardAttachPhase.
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (submitTimer.current) clearTimeout(submitTimer.current)
    }
  }, [])

  function handleSubmit() {
    if (!canSubmit || submitting) return
    const outcome = readDemoApplicationOutcome()

    // Бизнес-ошибка приходит вместо заявки: экран остаётся на форме, ошибка
    // показывается плашкой, а поле, к которому она относится, подсвечивается.
    if (outcome !== "reviewing" && outcome !== "rejected") {
      setErrorKey(outcome)
      return
    }

    setErrorKey(null)
    setSubmitting(true)

    const status =
      outcome === "rejected" ? "REJECTED" : ALIF_PREPAYMENT > 0 ? "NEW" : "REVIEWING"

    // Мок ожидания ответа applications/store.
    submitTimer.current = setTimeout(() => {
      createApplication({
        id: makeApplicationId(),
        status,
        createdAt: new Date().toISOString(),
        firstPaymentDate,
        imei: imei.trim() || undefined,
        amount: ORDER.amount,
        commission: plan.commission,
        duration: plan.duration,
      })
    }, APPLICATION_SUBMIT_DELAY_MS)
  }

  const errorField = errorKey ? APPLICATION_ERRORS[errorKey].field : undefined

  return (
    <div className="px-2 py-4">
      <h2 className="text-xl font-bold text-gray-900">Создание заявки</h2>

      <div className="mt-4 rounded-lg border p-4">
        <p className="font-medium text-gray-900">{ORDER_ITEM.goodName}</p>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <span className="text-gray-500">Категория</span>
          <span className="text-right font-medium text-gray-900">{ORDER_ITEM.goodTypeName}</span>
          <span className="text-gray-500">Цена</span>
          <span className="text-right font-medium tabular-nums text-gray-900">
            {ORDER_ITEM.price.toLocaleString("ru-RU")} сум
          </span>
          <span className="text-gray-500">ИКПУ</span>
          <span className="text-right font-medium tabular-nums text-gray-900">{ORDER_ITEM.ikpu}</span>
          <span className="text-gray-500">SKU</span>
          <span className="text-right font-medium tabular-nums text-gray-900">{ORDER_ITEM.sku}</span>
        </div>
      </div>

      {ORDER_ITEM.needsMarking && (
        <div className="mt-4">
          <label className="mb-1 block text-sm text-gray-700">IMEI / маркировка</label>
          <Input
            value={imei}
            onChange={(e) => {
              setImei(e.target.value)
              // Оператор уже правит поле — не держим ошибку и подсветку поверх правки.
              setErrorKey(null)
            }}
            inputMode="numeric"
            placeholder="Отсканируйте или введите вручную"
            aria-invalid={errorField === "marking"}
          />
        </div>
      )}

      <div className="mt-4">
        <label className="mb-1 block text-sm text-gray-700">Дата первого платежа</label>
        <Input
          type="date"
          className="max-w-[240px]"
          value={firstPaymentDate}
          min={minDate}
          max={maxDate}
          onChange={(e) => {
            setFirstPaymentDate(e.target.value)
            // Оператор уже правит поле — не держим ошибку и подсветку поверх правки.
            setErrorKey(null)
          }}
        />
        <p className="mt-1 text-xs text-gray-400">
          Не позднее {FIRST_PAYMENT_MAX_DAYS} дней от сегодняшнего дня
        </p>
      </div>

      <div
        className={cn(
          "mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg px-4 py-3 text-sm",
          errorField === "amount" ? "bg-red-50 ring-1 ring-red-200" : "bg-gray-50",
        )}
      >
        <span className="text-gray-500">Сумма</span>
        <span className="text-right font-medium tabular-nums text-gray-900">
          {ORDER.amount.toLocaleString("ru-RU")} сум
        </span>
        <span className="text-gray-500">Комиссия</span>
        <span className="text-right font-medium tabular-nums text-gray-900">
          {plan.commission.toLocaleString("ru-RU")} сум
        </span>
        <span className="text-gray-500">Срок</span>
        <span className="text-right font-medium tabular-nums text-gray-900">{plan.duration} мес.</span>
        <span className="text-gray-500">Ежемесячный платёж</span>
        <span className="text-right font-medium tabular-nums text-gray-900">
          {plan.monthlyPayment.toLocaleString("ru-RU")} сум
        </span>
      </div>

      {errorKey && <PhaseError message={APPLICATION_ERRORS[errorKey].message} className="mt-4" />}

      <DialogFooter className="mt-6 w-full">
        <Button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
          className="h-11 w-full font-semibold text-black hover:opacity-90 disabled:opacity-50"
          style={{ background: "#FFD60A" }}
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitting ? "Создаём заявку…" : "Создать заявку"}
        </Button>
      </DialogFooter>
    </div>
  )
}
