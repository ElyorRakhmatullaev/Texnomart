import { useEffect, useState } from "react"
import { RefreshCw, X } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@texnomart/ui/dialog"
import { Progress } from "@texnomart/ui/progress"
import { Button } from "@texnomart/ui/button"
import { CHECKOUT_STEP_COUNT, PHASE_STEP, checkoutPhaseOf, useScoringFlow } from "@/app/scoring-flow"
import { CANCEL_REASONS, canCancelApplication } from "@/lib/alif-application"
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

// Кандидаты автофокуса при открытии — как у FocusScope Radix: tabbable-элементы
// без ссылок (Radix при открытии ссылки пропускает).
const NOT_SKIPPED = ':not([disabled]):not([tabindex="-1"])'
const AUTOFOCUS_CANDIDATES = [
  `button${NOT_SKIPPED}`,
  `input${NOT_SKIPPED}`,
  `select${NOT_SKIPPED}`,
  `textarea${NOT_SKIPPED}`,
  '[tabindex]:not([tabindex="-1"]):not(a)',
].join(", ")

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

  const cancelReasonLabel = CANCEL_REASONS.find((r) => r.key === state.application?.cancelReasonKey)?.label

  return (
    <Dialog open={state.checkoutOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        // overflow-x-hidden обязателен рядом с overflow-y-auto: без него браузер по
        // спецификации CSS вычисляет overflow-x как auto (раз overflow-y — не
        // visible), и на любой фазе, где появляется вертикальный скролл, снизу
        // попапа рисуется лишний горизонтальный скроллбар без реального
        // горизонтального переполнения контента.
        // [&>button:last-child]:hidden — встроенный «×» примитива (всегда последний
        // ребёнок DialogContent) стоит абсолютом поверх правого края шапки и
        // накрывал бейдж статуса / «Отменить заявку». Вместо него — DialogClose
        // в потоке шапки (ниже); закрытие идёт тем же onOpenChange, поэтому
        // запрет закрытия во время удержания предоплаты действует и на него.
        className="sm:max-w-[640px] max-h-[90dvh] overflow-y-auto overflow-x-hidden [&>button:last-child]:hidden"
        onPointerDownOutside={(e) => {
          if (held) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (held) e.preventDefault()
        }}
        // «×» теперь первый в шапке, а Radix при открытии фокусирует первый
        // tabbable-элемент. Сохраняем прежний порядок (встроенный «×» был
        // последним): фокус получает первый элемент, кроме «×».
        onOpenAutoFocus={(e) => {
          const root = e.currentTarget as HTMLElement
          const target = [...root.querySelectorAll<HTMLElement>(AUTOFOCUS_CANDIDATES)].find(
            (el) => el.dataset.slot !== "dialog-close" && el.getClientRects().length > 0,
          )
          if (!target) return
          e.preventDefault()
          target.focus({ preventScroll: true })
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
          <div className="flex items-center gap-3">
            {/* flex-wrap + ml-auto: на узком телефоне бейдж и «Отменить заявку»
                переносятся под подпись шага (прижаты вправо), а «×» остаётся в углу */}
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3">
              <p className="text-xs font-medium text-gray-700">
                Шаг {step} из {CHECKOUT_STEP_COUNT} · {title}
              </p>
              <div className="ml-auto flex items-center gap-3">
                {state.application && <ApplicationStatusBadge status={state.application.status} />}
                {state.application && canCancelApplication(state.application.status) && (
                  <button
                    type="button"
                    onClick={() => setCancelOpen(true)}
                    // min-h-11 — тап-таргет ≥44px (Pattern K): текст text-xs сам по себе
                    // даёт кликабельную область в одну строку высотой ~16px.
                    className="inline-flex min-h-11 items-center text-xs font-medium text-red-600 transition-colors hover:text-red-700"
                  >
                    Отменить заявку
                  </button>
                )}
              </div>
            </div>
            {/* -my-3.5: тап-таргет 44px, но строка шапки остаётся высотой в подпись (16px);
                -mr-4: иконка почти там же, где стоял встроенный «×» */}
            <DialogClose
              className="-my-3.5 -mr-4 flex size-11 shrink-0 items-center justify-center rounded-md text-gray-500 outline-none transition-colors hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <X className="size-4" />
              <span className="sr-only">Закрыть</span>
            </DialogClose>
          </div>
          <Progress value={(step / CHECKOUT_STEP_COUNT) * 100} className="mt-2 h-1" />
        </div>

        {/* Терминальные состояния перехватываются ДО переключателя фаз. Деривация
            фазы не смотрит на статус заявки: отказанная заявка отправила бы оператора
            на фазу холда, поэтому ветка внутри фазы никогда бы не отрисовалась.
            Оговорка про creditConfirmed — защитная: единственный путь к статусу
            CANCELLED при уже оформленном кредите — cancelApplication, а она
            достижима только для NEW/APPROVED (canCancelApplication), которые
            creditConfirmed сменяет на ACTIVE одним и тем же setState. На практике
            эта ветка сейчас недостижима, но без неё отмена продажи (когда-то
            ошибочно ставившая CANCELLED вместо ACTIVE — см. unsellApplication)
            заменила бы экран успеха на «Заявка отменена». */}
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
            {/* cancelReasonKey — обязательное поле CancelApplicationDialog, но до сих
                пор нигде не показывалось после отмены: оператор выбирал причину и
                никогда больше её не видел. */}
            {cancelReasonLabel && (
              <p className="mt-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
                <span className="text-gray-500">Причина отмены: </span>
                {cancelReasonLabel}
              </p>
            )}
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
