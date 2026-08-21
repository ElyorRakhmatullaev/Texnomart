import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { OtpPanel } from "@/app/components/alif/OtpPanel"
import { useScoringFlow } from "@/app/scoring-flow"
import {
  ALIF_UNMATCHED_PHONE_MASK,
  BROKER_CLIENT,
  CARD_ATTACH_DELAY_MS,
  SEED_CARD,
  maskPanAlif,
  maskPhoneTail,
} from "@/lib/broker-mock-data"

export interface CardAttachPhaseProps {
  // Приходит от AlifCheckoutDialog, который хостит и эту фазу, и
  // DemoScenarioBar — единый источник значения, без рассинхрона между
  // подсветкой пилюли в баре и данными, которые видит и отправляет эта фаза.
  phoneMatch: boolean
}

// Экран 2 ТЗ. Привязка карты к Alif (request-attach) — отдельно от общей
// привязки на шаге «Верификация»: там карта заводится до выбора банка, здесь
// она привязывается к конкретному банку и подтверждается своим кодом.
export function CardAttachPhase({ phoneMatch }: CardAttachPhaseProps) {
  const { state, attachAlifCard, cancelOffer } = useScoringFlow()

  const card = state.cards.find((c) => c.confirmed) ?? { mask: SEED_CARD.mask }
  const phone = phoneMatch ? maskPhoneTail(BROKER_CLIENT.phone) : ALIF_UNMATCHED_PHONE_MASK

  const [attaching, setAttaching] = useState(false)

  // Таймер живёт в ref, а не в замыкании setTimeout, чтобы его можно было
  // отменить при уходе с фазы (например, «Вернуться к выбору предложения»
  // во время ожидания): без очистки колбэк всё равно сработал бы и молча
  // привязал карту к уже покинутому оператором флоу.
  const attachTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (attachTimer.current) clearTimeout(attachTimer.current)
    }
  }, [])

  function handleSuccess() {
    setAttaching(true)
    // Мок ожидания ответа request-attach.
    attachTimer.current = setTimeout(() => {
      attachAlifCard({ pan: maskPanAlif(card.mask), phone, phoneMatch })
    }, CARD_ATTACH_DELAY_MS)
  }

  return (
    <div className="px-2 py-4">
      <h2 className="text-xl font-bold text-gray-900">Привязка карты к Alif</h2>

      <div className="mt-4">
        {attaching ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
            <Loader2 className="size-4 shrink-0 animate-spin" />
            Привязываем карту…
          </div>
        ) : (
          <OtpPanel
            variant="card"
            subtitle={`Код отправлен на номер, привязанный к карте: ${phone}`}
            ctaLabel="Подтвердить привязку"
            onSuccess={handleSuccess}
          >
            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-500">Карта</span>
              <span className="text-right font-medium tabular-nums text-gray-900">
                {maskPanAlif(card.mask)}
              </span>
            </div>

            {!phoneMatch && (
              <div className="mt-3 flex gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  Телефон, привязанный к карте, не совпадает с телефоном клиента. Убедитесь, что код
                  получает владелец карты.
                </span>
              </div>
            )}
          </OtpPanel>
        )}
      </div>

      <button
        type="button"
        onClick={cancelOffer}
        className="mt-4 flex min-h-11 w-full items-center justify-center text-center text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        Вернуться к выбору предложения
      </button>
    </div>
  )
}
