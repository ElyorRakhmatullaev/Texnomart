import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@texnomart/ui/dialog"
import { OtpPanel } from "@/app/components/alif/OtpPanel"

export interface CardOtpDialogProps {
  open: boolean
  cardMask: string
  onConfirmed: () => void
  onOpenChange: (open: boolean) => void
}

// Модал подтверждения карты кодом из SMS. Рендерит OtpPanel только пока диалог
// открыт — это гарантирует, что при каждом открытии (даже для той же карты)
// внутреннее состояние панели (код/ошибка/таймер) заводится заново.
export function CardOtpDialog({ open, cardMask, onConfirmed, onOpenChange }: CardOtpDialogProps) {
  const last4 = cardMask.replace(/\D/g, "").slice(-4)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Встроенный «×» (последний ребёнок DialogContent) — 44×44 вместо 16×16;
          top/right-0.5 держат саму иконку на прежнем месте (центр в 24px от угла). */}
      <DialogContent className="sm:max-w-[480px] [&>button:last-child]:flex [&>button:last-child]:size-11 [&>button:last-child]:items-center [&>button:last-child]:justify-center [&>button:last-child]:top-0.5 [&>button:last-child]:right-0.5">
        <DialogHeader>
          <DialogTitle>Подтверждение карты</DialogTitle>
          <DialogDescription className="sr-only">Введите код из SMS для подтверждения</DialogDescription>
        </DialogHeader>

        {open && (
          <OtpPanel
            variant="card"
            subtitle={`Введите код из SMS, отправленного на карту •••• ${last4}`}
            ctaLabel="Подтвердить"
            onSuccess={onConfirmed}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
