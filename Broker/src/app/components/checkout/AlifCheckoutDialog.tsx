import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@texnomart/ui/dialog"
import { Progress } from "@texnomart/ui/progress"
import { CHECKOUT_STEP_COUNT, PHASE_STEP, checkoutPhaseOf, useScoringFlow } from "@/app/scoring-flow"
import { ALIF_PREPAYMENT } from "@/lib/broker-mock-data"
import { ApplicationStatusBadge } from "./ApplicationStatusBadge"
import { OfferPhase } from "./OfferPhase"
import { CardAttachPhase } from "./CardAttachPhase"
import { DetailsPhase } from "./DetailsPhase"
import { ApplicationPhase } from "./ApplicationPhase"
import { HoldPhase } from "./HoldPhase"
import { CreditOtpPhase } from "./CreditOtpPhase"
import { SuccessPhase } from "./SuccessPhase"

export function AlifCheckoutDialog() {
  const { state, closeCheckout } = useScoringFlow()
  const held = state.holdStatus === "held"

  // Фаза применяется сразу, без локального зеркала и без задержки. Раньше уход
  // с холда лагал на 600 мс, чтобы оператор успел увидеть бейдж «Предоплата
  // подтверждена»; теперь с этой фазы уводит явная кнопка «Продолжить», так
  // что бейдж виден столько, сколько нужно, и задержка стала лишней.
  const phase = checkoutPhaseOf(state, ALIF_PREPAYMENT)

  function handleOpenChange(open: boolean) {
    if (open || held) return
    closeCheckout()
  }

  const { step, title } = PHASE_STEP[phase]

  return (
    <Dialog open={state.checkoutOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[640px] max-h-[90dvh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          if (held) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (held) e.preventDefault()
        }}
      >
        <DialogTitle className="sr-only">Оформление рассрочки Alif Nasiya</DialogTitle>
        <DialogDescription className="sr-only">
          Пошаговое оформление рассрочки Alif Nasiya: выбор условия, привязка карты, дополнительные
          данные, создание заявки, предоплата, код подтверждения и результат оформления.
        </DialogDescription>

        {/* Шапка мастера: прогресс по ветке Alif + статус заявки. Внешний
            степпер описывает весь скоринг, здесь — только эта ветка. */}
        <div className="border-b pb-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-gray-700">
              Шаг {step} из {CHECKOUT_STEP_COUNT} · {title}
            </p>
            {state.application && <ApplicationStatusBadge status={state.application.status} />}
          </div>
          <Progress value={(step / CHECKOUT_STEP_COUNT) * 100} className="mt-2 h-1" />
        </div>

        {phase === "offer" && <OfferPhase />}
        {phase === "card" && <CardAttachPhase />}
        {phase === "details" && <DetailsPhase />}
        {phase === "application" && <ApplicationPhase />}
        {phase === "hold" && <HoldPhase />}
        {phase === "otp" && <CreditOtpPhase />}
        {phase === "success" && <SuccessPhase />}
      </DialogContent>
    </Dialog>
  )
}
