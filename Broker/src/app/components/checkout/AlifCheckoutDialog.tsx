import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@texnomart/ui/dialog"
import { checkoutPhaseOf, useScoringFlow } from "@/app/scoring-flow"
import { ALIF_PREPAYMENT } from "@/lib/broker-mock-data"
import { ConfirmPhase } from "./ConfirmPhase"

// Единый попап оформления Alif Nasiya — хост фазовой машины. Фаза
// деривируется из состояния потока (checkoutPhaseOf), не хранится отдельно:
// попап всегда открывается на «текущем» шаге, в т.ч. после перезагрузки
// страницы или повторного «Оформить».
export function AlifCheckoutDialog() {
  const { state, closeCheckout } = useScoringFlow()
  const held = state.holdStatus === "held"
  const phase = checkoutPhaseOf(state, ALIF_PREPAYMENT)

  // Пока предоплата «держится» (спиннер ~2с в фазе hold), закрытие попапа
  // запрещено — ни крестиком, ни Escape, ни кликом по оверлею.
  function handleOpenChange(open: boolean) {
    if (open || held) return
    closeCheckout()
  }

  return (
    <Dialog open={state.checkoutOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[640px]"
        onPointerDownOutside={(e) => {
          if (held) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (held) e.preventDefault()
        }}
      >
        {/* Заголовок и описание — только для скринридеров; видимый заголовок
            рендерит каждая фаза сама (разные формулировки по шагам). */}
        <DialogTitle className="sr-only">Оформление рассрочки Alif Nasiya</DialogTitle>
        <DialogDescription className="sr-only">
          Пошаговое оформление рассрочки Alif Nasiya: подтверждение предложения, удержание предоплаты,
          дополнительные данные, код подтверждения и результат оформления.
        </DialogDescription>

        {phase === "confirm" && <ConfirmPhase />}

        {/* Task 2: контент нынешней HoldPage переезжает сюда фазой HoldPhase */}
        {phase === "hold" && <div className="p-6">Фаза «Удержание предоплаты» — Task 2</div>}

        {/* Task 2: контент нынешней AdditionalDataPage переезжает сюда фазой DetailsPhase */}
        {phase === "details" && <div className="p-6">Фаза «Дополнительные данные» — Task 2</div>}

        {/* Task 3: контент нынешнего CreditOtpDialog переезжает сюда фазой CreditOtpPhase */}
        {phase === "otp" && <div className="p-6">Фаза «Код подтверждения» — Task 3</div>}

        {/* Task 3: зелёное состояние нынешней InstallmentInfoPage переезжает сюда фазой SuccessPhase */}
        {phase === "success" && <div className="p-6">Фаза «Кредит оформлен» — Task 3</div>}
      </DialogContent>
    </Dialog>
  )
}
