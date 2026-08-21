import { AlertTriangle } from "lucide-react"
import { OtpPanel } from "@/app/components/alif/OtpPanel"
import { useScoringFlow } from "@/app/scoring-flow"
import {
  ALIF_UNMATCHED_PHONE_MASK,
  BROKER_CLIENT,
  SEED_CARD,
  maskPanAlif,
  maskPhoneTail,
} from "@/lib/broker-mock-data"
import { readDemoPhoneMatch } from "./DemoScenarioBar"

// Экран 2 ТЗ. Привязка карты к Alif (request-attach) — отдельно от общей
// привязки на шаге «Верификация»: там карта заводится до выбора банка, здесь
// она привязывается к конкретному банку и подтверждается своим кодом.
export function CardAttachPhase() {
  const { state, attachAlifCard, cancelOffer } = useScoringFlow()

  const card = state.cards.find((c) => c.confirmed) ?? { mask: SEED_CARD.mask }
  const phoneMatch = readDemoPhoneMatch()
  const phone = phoneMatch ? maskPhoneTail(BROKER_CLIENT.phone) : ALIF_UNMATCHED_PHONE_MASK

  function handleSuccess() {
    attachAlifCard({ pan: maskPanAlif(card.mask), phone, phoneMatch })
  }

  return (
    <div className="px-2 py-4">
      <h2 className="text-xl font-bold text-gray-900">Привязка карты к Alif</h2>

      <div className="mt-4">
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
      </div>

      <button
        type="button"
        onClick={cancelOffer}
        className="mt-4 block w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        Вернуться к выбору предложения
      </button>
    </div>
  )
}
