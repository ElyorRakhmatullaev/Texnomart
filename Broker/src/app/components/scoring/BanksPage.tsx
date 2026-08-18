import { useEffect } from "react"
import { useNavigate } from "react-router"
import { ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { useScoringFlow } from "@/app/scoring-flow"
import { BANKS, ALIF_LIMIT_DELAY_MS } from "@/lib/broker-mock-data"
import { ClientInfoBand } from "./ClientInfoBand"
import { BankCard } from "./BankCard"

export function BanksPage() {
  const { state, markAlifLimitReady, selectAlif } = useScoringFlow()
  const navigate = useNavigate()

  // Мок callback+polling: лимит Alif «приходит» через ALIF_LIMIT_DELAY_MS.
  // Если лимит уже ready (в т.ч. после перезагрузки страницы) — таймер не запускается.
  useEffect(() => {
    if (state.alifLimitStatus !== "pending") return
    const t = setTimeout(markAlifLimitReady, ALIF_LIMIT_DELAY_MS)
    return () => clearTimeout(t)
  }, [state.alifLimitStatus, markAlifLimitReady])

  const alif = BANKS.find((b) => b.id === "alif")!
  const iman = BANKS.find((b) => b.id === "iman")!

  function handleCheckout(bankId: "alif" | "iman", tenor: number) {
    if (bankId === "alif") {
      selectAlif(tenor)
      navigate(alif.prepayment > 0 ? "/scoring/alif/hold" : "/scoring/alif/details")
    } else {
      toast.info("В прототипе реализован сценарий Alif")
    }
  }

  return (
    <div className="max-w-[880px] mx-auto px-4 py-6 space-y-4">
      <ClientInfoBand />

      <div className="grid gap-4 md:grid-cols-2">
        <BankCard
          bank={alif}
          pending={!alif.instantLimit && state.alifLimitStatus === "pending"}
          onCheckout={(tenor) => handleCheckout("alif", tenor)}
        />
        <BankCard
          bank={iman}
          pending={!iman.instantLimit && state.alifLimitStatus === "pending"}
          onCheckout={(tenor) => handleCheckout("iman", tenor)}
        />
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          className="flex items-center gap-1 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-blue-600"
        >
          Запрос лимита у партнеров
          <ChevronDown className="size-4" />
        </button>
      </div>
    </div>
  )
}
