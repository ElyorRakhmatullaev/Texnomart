import { Info } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@texnomart/ui/dialog"
import { OtpPanel } from "@/app/components/alif/OtpPanel"
import { BANKS, ORDER } from "@/lib/broker-mock-data"
import { useScoringFlow } from "@/app/scoring-flow"

const alif = BANKS.find((b) => b.id === "alif")!

export interface CreditOtpDialogProps {
  open: boolean
  onConfirmed: () => void
  onOpenChange: (open: boolean) => void
}

// Модал подтверждения кредита кодом из SMS («Код 2 из 2» — отдельный от
// подтверждения карты). Рендерит OtpPanel только пока диалог открыт — состояние
// панели (код/ошибка/таймер) заводится заново при каждом открытии.
export function CreditOtpDialog({ open, onConfirmed, onOpenChange }: CreditOtpDialogProps) {
  const { state } = useScoringFlow()
  const tenor = state.tenor ?? ORDER.tenor

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Подтверждение кредита</DialogTitle>
          <DialogDescription className="sr-only">Введите код из SMS для подтверждения</DialogDescription>
        </DialogHeader>

        {open && (
          <OtpPanel
            variant="credit"
            subtitle="Мы отправили код для подтверждения оформления кредита"
            ctaLabel="Завершить"
            onSuccess={onConfirmed}
          >
            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-500">Банк</span>
              <span className="text-right font-medium text-gray-900">{alif.title}</span>

              <span className="text-gray-500">Сумма заказа</span>
              <span className="text-right font-medium tabular-nums text-gray-900">
                {ORDER.amount.toLocaleString("ru-RU")} сум
              </span>

              <span className="text-gray-500">Срок</span>
              <span className="text-right font-medium tabular-nums text-gray-900">{tenor} мес.</span>

              <span className="text-gray-500">Предоплата</span>
              <span className="text-right font-medium tabular-nums text-gray-900">
                {alif.prepayment.toLocaleString("ru-RU")} сум
              </span>
            </div>

            <div className="mt-3 flex gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Info className="size-4 shrink-0" />
              <span>
                Это другой код — не тот, что вы вводили при подтверждении карты. Введите код из последнего SMS.
              </span>
            </div>
          </OtpPanel>
        )}
      </DialogContent>
    </Dialog>
  )
}
