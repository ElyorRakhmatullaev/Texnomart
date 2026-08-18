import { Check, Download, ExternalLink } from "lucide-react"
import { useNavigate } from "react-router"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Button, buttonVariants } from "@texnomart/ui/button"
import { cn } from "@texnomart/ui/utils"
import { useScoringFlow } from "@/app/scoring-flow"
import { BANKS, ORDER } from "@/lib/broker-mock-data"

const ALIF = BANKS.find((b) => b.id === "alif")!

// Фаза «Кредит оформлен» — зелёное состояние бывшей InstallmentInfoPage без
// левой карточки-сводки страницы и без страничного контейнера: в попапе для
// контекста достаточно компактной строки предложения сверху + самой панели
// успеха. Достижима только когда state.creditConfirmed истинен
// (checkoutPhaseOf) — после перезагрузки страницы попап откроется сразу на
// этой фазе, минуя otp.
export function SuccessPhase() {
  const { state, resetFlow } = useScoringFlow()
  const navigate = useNavigate()

  const tenor = state.tenor ?? ORDER.tenor
  const contractNo = state.contractNo ?? ""
  const oneCOrderNo = state.oneCOrderNo ?? ""
  const issuedDate = format(new Date(), "dd.MM.yyyy", { locale: ru })

  function handleFinish() {
    resetFlow()
    navigate("/scoring/verification")
  }

  return (
    <div className="px-2 py-4">
      {/* Компактная строка предложения — без неё панель успеха осталась бы без контекста банка/срока/лимита */}
      <div className="flex w-full items-center gap-3 rounded-lg border p-4 text-left">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
          style={{ background: ALIF.brandColor }}
        >
          {ALIF.initial}
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span className="font-semibold text-gray-900">{ALIF.title}</span>
          <span className="text-sm text-gray-500">
            {tenor} мес. · Лимит{" "}
            <span className="font-medium tabular-nums text-gray-700">{ALIF.limit.toLocaleString("ru-RU")} сум</span>
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
          <Check className="size-5 text-emerald-600" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-semibold text-gray-900">
            Кредит оформлен! Договор №{contractNo} подписан {issuedDate}.
          </p>
          <p className="text-sm text-gray-600">
            Заявка №{oneCOrderNo} в базе 1С Texnomart создана автоматически — продолжайте оформление продажи в ней.
          </p>
        </div>

        <div className="mt-2 flex w-full flex-col gap-3">
          <a
            href={import.meta.env.BASE_URL + "contract-mock.pdf"}
            download={`Договор_${contractNo}.pdf`}
            className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full bg-white font-semibold")}
          >
            <Download className="size-4" />
            Скачать договор (PDF)
          </a>

          <a
            href={import.meta.env.BASE_URL + "contract-mock.pdf"}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full bg-white font-semibold")}
          >
            <ExternalLink className="size-4" />
            Посмотреть договор
          </a>

          <Button
            type="button"
            onClick={handleFinish}
            className="h-11 w-full bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
          >
            Завершить скоринг
          </Button>
        </div>
      </div>
    </div>
  )
}
