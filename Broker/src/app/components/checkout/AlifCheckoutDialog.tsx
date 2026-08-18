import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@texnomart/ui/dialog"
import { checkoutPhaseOf, useScoringFlow, type CheckoutPhase } from "@/app/scoring-flow"
import { ALIF_PREPAYMENT } from "@/lib/broker-mock-data"
import { ConfirmPhase } from "./ConfirmPhase"
import { HoldPhase } from "./HoldPhase"
import { DetailsPhase } from "./DetailsPhase"
import { CreditOtpPhase } from "./CreditOtpPhase"
import { SuccessPhase } from "./SuccessPhase"

// Задержка перед автосменой hold → details ради читаемости: пользователь
// должен успеть увидеть зелёный бейдж «Предоплата подтверждена» прежде чем
// фаза сменится (сама смена фазы — мгновенная деривация из состояния).
const HOLD_TO_DETAILS_DELAY_MS = 600

// Единый попап оформления Alif Nasiya — хост фазовой машины. Фаза
// деривируется из состояния потока (checkoutPhaseOf), не хранится отдельно:
// попап всегда открывается на «текущем» шаге, в т.ч. после перезагрузки
// страницы или повторного «Оформить».
export function AlifCheckoutDialog() {
  const { state, closeCheckout } = useScoringFlow()
  const held = state.holdStatus === "held"
  const derivedPhase = checkoutPhaseOf(state, ALIF_PREPAYMENT)

  // phase лагает за derivedPhase только на переходе hold → details — это
  // единственный переход, для которого нужна пауза на читаемость бейджа
  // «Предоплата подтверждена». Все остальные смены фаз применяются сразу.
  const [phase, setPhase] = useState<CheckoutPhase>(derivedPhase)

  useEffect(() => {
    if (phase === derivedPhase) return
    if (phase === "hold" && derivedPhase === "details") {
      const t = setTimeout(() => setPhase(derivedPhase), HOLD_TO_DETAILS_DELAY_MS)
      return () => clearTimeout(t)
    }
    setPhase(derivedPhase)
  }, [derivedPhase, phase])

  // Пока предоплата «держится» (спиннер ~2с в фазе hold), закрытие попапа
  // запрещено — ни крестиком, ни Escape, ни кликом по оверлею.
  function handleOpenChange(open: boolean) {
    if (open || held) return
    closeCheckout()
  }

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
        {/* Заголовок и описание — только для скринридеров; видимый заголовок
            рендерит каждая фаза сама (разные формулировки по шагам). */}
        <DialogTitle className="sr-only">Оформление рассрочки Alif Nasiya</DialogTitle>
        <DialogDescription className="sr-only">
          Пошаговое оформление рассрочки Alif Nasiya: подтверждение предложения, удержание предоплаты,
          дополнительные данные, код подтверждения и результат оформления.
        </DialogDescription>

        {phase === "confirm" && <ConfirmPhase />}

        {phase === "hold" && <HoldPhase />}

        {phase === "details" && <DetailsPhase />}

        {phase === "otp" && <CreditOtpPhase />}

        {phase === "success" && <SuccessPhase />}
      </DialogContent>
    </Dialog>
  )
}
