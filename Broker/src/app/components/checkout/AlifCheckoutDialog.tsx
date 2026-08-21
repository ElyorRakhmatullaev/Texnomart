import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@texnomart/ui/dialog"
import { Progress } from "@texnomart/ui/progress"
import { Button } from "@texnomart/ui/button"
import { CHECKOUT_STEP_COUNT, PHASE_STEP, checkoutPhaseOf, useScoringFlow } from "@/app/scoring-flow"
import { canCancelApplication } from "@/lib/alif-application"
import { ALIF_PREPAYMENT, APPLICATION_REVIEW_DELAY_MS } from "@/lib/broker-mock-data"
import { ApplicationStatusBadge } from "./ApplicationStatusBadge"
import { OfferPhase } from "./OfferPhase"
import { CardAttachPhase } from "./CardAttachPhase"
import { DetailsPhase } from "./DetailsPhase"
import { ApplicationPhase } from "./ApplicationPhase"
import { HoldPhase } from "./HoldPhase"
import { CreditOtpPhase } from "./CreditOtpPhase"
import { SuccessPhase } from "./SuccessPhase"
import { DemoScenarioBar, readDemoPhoneMatch, writeDemoPhoneMatch } from "./DemoScenarioBar"
import { PhaseError } from "./PhaseError"
import { CancelApplicationDialog } from "./CancelApplicationDialog"

export function AlifCheckoutDialog() {
  const { state, closeCheckout, refreshSession, cancelOffer, setApplicationStatus, cancelApplication } =
    useScoringFlow()
  const held = state.holdStatus === "held"
  const [cancelOpen, setCancelOpen] = useState(false)

  // Мок «заявка на рассмотрении» — через APPLICATION_REVIEW_DELAY_MS она
  // возвращается одобренной. Эффект живёт в хосте, а не в фазе: рассмотрение
  // продолжается и после того, как деривация увела оператора дальше.
  useEffect(() => {
    if (state.application?.status !== "REVIEWING") return
    const t = setTimeout(() => setApplicationStatus("APPROVED"), APPLICATION_REVIEW_DELAY_MS)
    return () => clearTimeout(t)
  }, [state.application?.status, setApplicationStatus])

  // Единый владелец демо-переключателя «совпадение телефона»: и бар, и
  // CardAttachPhase — соседи в этом же компоненте, sessionStorage сам по себе
  // не даёт живой синхронизации между ними (same-tab записи не шлют событие
  // storage), поэтому значение живёт здесь и прокидывается пропом в обе стороны.
  const [demoPhoneMatch, setDemoPhoneMatch] = useState(readDemoPhoneMatch)

  function handleDemoPhoneMatchChange(value: boolean) {
    writeDemoPhoneMatch(value)
    setDemoPhoneMatch(value)
  }

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
            <div className="flex items-center gap-3">
              {state.application && <ApplicationStatusBadge status={state.application.status} />}
              {state.application && canCancelApplication(state.application.status) && (
                <button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  className="text-xs font-medium text-red-600 transition-colors hover:text-red-700"
                >
                  Отменить заявку
                </button>
              )}
            </div>
          </div>
          <Progress value={(step / CHECKOUT_STEP_COUNT) * 100} className="mt-2 h-1" />
        </div>

        {/* Терминальные состояния перехватываются ДО переключателя фаз. Деривация
            фазы не смотрит на статус заявки: отказанная заявка отправила бы оператора
            на фазу холда, поэтому ветка внутри фазы никогда бы не отрисовалась.
            Оговорка про creditConfirmed нужна из-за отмены продажи: она тоже ставит
            CANCELLED, но оформленный кредит при этом никуда не девается и экран
            успеха должен остаться. */}
        {state.sessionExpired ? (
          <div className="px-2 py-4">
            <PhaseError message="Сессия Alif истекла. Обновите сессию, чтобы продолжить оформление." />
            <p className="mt-3 text-sm text-gray-500">
              Введённые данные сохранены — после обновления вы вернётесь на этот же шаг.
            </p>
            <Button
              type="button"
              onClick={refreshSession}
              className="mt-6 h-11 w-full font-semibold text-black hover:opacity-90"
              style={{ background: "#FFD60A" }}
            >
              <RefreshCw className="size-4" />
              Обновить сессию
            </Button>
          </div>
        ) : !state.creditConfirmed && state.application?.status === "REJECTED" ? (
          <div className="px-2 py-4">
            <h2 className="text-xl font-bold text-gray-900">Заявка отклонена</h2>
            <PhaseError
              className="mt-4"
              message="Alif отказал в рассрочке по этой заявке. Предложите клиенту другой банк или другое условие."
            />
            <Button
              type="button"
              variant="outline"
              onClick={cancelOffer}
              className="mt-6 h-11 w-full font-semibold"
            >
              Назад к банкам
            </Button>
          </div>
        ) : !state.creditConfirmed && state.application?.status === "CANCELLED" ? (
          <div className="px-2 py-4">
            <h2 className="text-xl font-bold text-gray-900">Заявка отменена</h2>
            <p className="mt-2 text-sm text-gray-500">
              Предоплата разблокирована. Чтобы оформить рассрочку заново, вернитесь к выбору банка.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={cancelOffer}
              className="mt-6 h-11 w-full font-semibold"
            >
              Назад к банкам
            </Button>
          </div>
        ) : (
          <>
            {phase === "offer" && <OfferPhase />}
            {phase === "card" && <CardAttachPhase phoneMatch={demoPhoneMatch} />}
            {phase === "details" && <DetailsPhase />}
            {phase === "application" && <ApplicationPhase />}
            {phase === "hold" && <HoldPhase />}
            {phase === "otp" && <CreditOtpPhase />}
            {phase === "success" && <SuccessPhase />}
          </>
        )}

        <DemoScenarioBar
          phase={phase}
          phoneMatch={demoPhoneMatch}
          onPhoneMatchChange={handleDemoPhoneMatchChange}
        />

        <CancelApplicationDialog
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          onConfirm={(reasonKey) => {
            cancelApplication(reasonKey)
            toast("Заявка отменена")
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
