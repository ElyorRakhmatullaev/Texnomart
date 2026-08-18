import { useState } from "react"
import { Check, Download, ExternalLink, FileText, ShieldCheck } from "lucide-react"
import { useNavigate } from "react-router"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Badge } from "@texnomart/ui/badge"
import { Button, buttonVariants } from "@texnomart/ui/button"
import { cn } from "@texnomart/ui/utils"
import { useScoringFlow } from "@/app/scoring-flow"
import { BANKS, ORDER } from "@/lib/broker-mock-data"
import { CreditOtpDialog } from "@/app/components/alif/CreditOtpDialog"

const alif = BANKS.find((b) => b.id === "alif")!

function formatPrepayment(amount: number): string {
  return amount === 0 ? "0" : `${amount.toLocaleString("ru-RU")} сум`
}

export function InstallmentInfoPage() {
  const { state, confirmCredit, resetFlow } = useScoringFlow()
  const navigate = useNavigate()
  const [otpOpen, setOtpOpen] = useState(false)

  const contractNo = state.contractNo ?? ""
  const oneCOrderNo = state.oneCOrderNo ?? ""
  const tenor = state.tenor ?? ORDER.tenor
  const issuedDate = format(new Date(), "dd.MM.yyyy", { locale: ru })

  function handleOtpConfirmed() {
    confirmCredit()
    setOtpOpen(false)
  }

  function handleFinish() {
    resetFlow()
    navigate("/scoring/verification")
  }

  return (
    <div className="mx-auto max-w-[880px] px-4 py-6">
      <h2 className="text-xl font-bold text-gray-900">Информация по рассрочке</h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Левая карточка — сводка по кредиту */}
        <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:p-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
              style={{ background: alif.brandColor }}
            >
              {alif.initial}
            </div>
            <span className="flex-1 font-semibold text-gray-900">{alif.title}</span>
            <Badge className="border-transparent bg-green-50 text-green-700 hover:bg-green-50">
              {state.creditConfirmed ? "Оформлена" : "Одобрена"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
            <span className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-[0px_2px_4px_rgba(204,204,204,0.25)]">
              {tenor} мес.
            </span>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border p-4" style={{ borderColor: "#FFD60A" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Доступный лимит</span>
              <span className="font-semibold tabular-nums text-gray-900">
                {alif.limit.toLocaleString("ru-RU")} сум
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Срок</span>
              <span className="font-semibold tabular-nums text-red-600">0-0-{tenor}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="shrink-0 text-sm text-gray-500">Предоплата</span>
              <span className="flex flex-wrap items-center justify-end gap-x-1 gap-y-0.5 text-right font-semibold tabular-nums text-gray-900">
                <span className="whitespace-nowrap">{formatPrepayment(alif.prepayment)}</span>
                {state.holdStatus === "confirmed" && (
                  <span className="whitespace-nowrap text-xs font-normal text-emerald-600">· Подтверждена</span>
                )}
              </span>
            </div>
          </div>

          {state.creditConfirmed && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FileText className="size-4 shrink-0 text-gray-400" />
              <span>
                Договор № {contractNo} <span className="text-gray-400">от {issuedDate}</span>
              </span>
            </div>
          )}
        </div>

        {/* Правая панель — статус + действия */}
        {!state.creditConfirmed ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border bg-gray-50 p-6 text-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
              <ShieldCheck className="size-5 text-gray-600" />
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-semibold text-gray-900">Проверьте условия и завершите оформление</p>
              <p className="text-sm text-gray-500">
                После подтверждения кредит будет оформлен в Alif, договор сформируется автоматически.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => setOtpOpen(true)}
              className="mt-2 h-11 w-full bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
            >
              Завершить скоринг
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
              <Check className="size-5 text-emerald-600" />
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-semibold text-gray-900">Кредит оформлен! Договор №{contractNo} подписан.</p>
              <p className="text-sm text-gray-600">
                Заявка №{oneCOrderNo} в базе 1С Texnomart создана автоматически — продолжайте оформление продажи в
                ней.
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
        )}
      </div>

      <CreditOtpDialog open={otpOpen} onConfirmed={handleOtpConfirmed} onOpenChange={setOtpOpen} />
    </div>
  )
}
