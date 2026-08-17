import { useNavigate } from "react-router"
import { toast } from "sonner"
import { useScoringFlow } from "@/app/scoring-flow"
import { BROKER_CLIENT } from "@/lib/broker-mock-data"
import { OtpStepCard } from "./OtpStepCard"

export function CardAttachPage() {
  const { state, attachCard } = useScoringFlow()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-[880px] px-4 py-6">
      <OtpStepCard
        variant="card"
        title="Привязка карты"
        subtitle={
          <>
            Мы отправили SMS с кодом на номер, привязанный к карте <b>{BROKER_CLIENT.cardMask}</b>
          </>
        }
        ctaLabel="Подтвердить"
        completedNote={state.cardAttached ? "Карта привязана" : undefined}
        onSuccess={() => {
          attachCard()
          toast.success("Карта привязана")
          navigate("/scoring/alif/details")
        }}
        onBack={() => navigate("/scoring/banks")}
      />
    </div>
  )
}
