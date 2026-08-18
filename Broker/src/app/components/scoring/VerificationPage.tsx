import { useState } from "react"
import { useNavigate } from "react-router"
import { CreditCard, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@texnomart/ui/input"
import { Button } from "@texnomart/ui/button"
import { Badge } from "@texnomart/ui/badge"
import { cn } from "@texnomart/ui/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@texnomart/ui/alert-dialog"
import { useScoringFlow } from "@/app/scoring-flow"
import { BROKER_CLIENT, CARD_BLOCKED_SUFFIX, CARD_NOT_FOUND_SUFFIX } from "@/lib/broker-mock-data"
import { CardOtpDialog } from "@/app/components/scoring/CardOtpDialog"

// Номер карты: держим только «сырые» цифры (макс. 16), формат для отображения
// собираем из них группами по 4 — тот же приём, что и в маске телефона
// AdditionalDataPage (разбор всей строки на каждое нажатие, а не диффом).
function extractCardDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 16)
}

function formatCardNumber(digits: string): string {
  return (digits.match(/.{1,4}/g) ?? []).join(" ")
}

// Срок карты: 4 цифры → "MM/YY".
function extractExpiryDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4)
}

function formatExpiry(digits: string): string {
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function isValidExpiry(digits: string): boolean {
  if (digits.length !== 4) return false
  const mm = Number(digits.slice(0, 2))
  return mm >= 1 && mm <= 12
}

const readOnlyFieldClass = "bg-gray-50 text-gray-700 disabled:opacity-100 disabled:cursor-default"

export function VerificationPage() {
  const { state, addCard, confirmCard, removeCard } = useScoringFlow()
  const navigate = useNavigate()

  const [cardDigits, setCardDigits] = useState("")
  const [expiryDigits, setExpiryDigits] = useState("")
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [blockedOpen, setBlockedOpen] = useState(false)
  // Маска карты, для которой сейчас открыт OTP-модал подтверждения. null — модал закрыт.
  const [otpMask, setOtpMask] = useState<string | null>(null)

  const canAdd = cardDigits.length === 16 && isValidExpiry(expiryDigits)
  const hasConfirmedCard = state.cards.some((c) => c.confirmed)

  function handleCardDigitsChange(value: string) {
    setCardDigits(extractCardDigits(value))
    if (fieldError) setFieldError(null)
  }

  function handleExpiryDigitsChange(value: string) {
    setExpiryDigits(extractExpiryDigits(value))
    if (fieldError) setFieldError(null)
  }

  function handleAddCard() {
    if (!canAdd) return
    const mask = formatCardNumber(cardDigits)
    const expiry = formatExpiry(expiryDigits)

    // Из ревью Task 2: дубликат маски создавал вторую строку, и confirmCard/removeCard
    // (ключуются по маске) задевали обе — проверяем и режем ещё до addCard.
    if (state.cards.some((c) => c.mask === mask)) {
      setFieldError("Эта карта уже добавлена")
      return
    }
    if (cardDigits.endsWith(CARD_NOT_FOUND_SUFFIX)) {
      setFieldError("Карта не найдена. Проверьте номер карты")
      return
    }
    if (cardDigits.endsWith(CARD_BLOCKED_SUFFIX)) {
      setBlockedOpen(true)
      return
    }

    addCard(mask, expiry)
    setOtpMask(mask)
  }

  function handleOtpConfirmed() {
    if (!otpMask) return
    confirmCard(otpMask)
    toast.success("Карта подтверждена")
    setCardDigits("")
    setExpiryDigits("")
    setOtpMask(null)
  }

  function handleCardRowClick(mask: string, confirmed: boolean) {
    if (confirmed) return
    setOtpMask(mask)
  }

  function handleContinue() {
    if (!hasConfirmedCard) return
    navigate("/scoring/myid")
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-[880px] rounded-lg bg-white p-6 shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:p-8">
        <p className="text-xs text-gray-400">Log Id: 123456</p>
        <h2 className="mt-1 text-xl font-bold text-gray-900">Верификация клиента</h2>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          {/* Данные клиента — предзаполненные read-only поля */}
          <div>
            <h3 className="font-semibold text-gray-900">Данные клиента</h3>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-sm text-gray-700">Номер телефона</label>
                <Input value={BROKER_CLIENT.phone} disabled className={readOnlyFieldClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">Серия и номер паспорта</label>
                <Input value={BROKER_CLIENT.passport} disabled className={readOnlyFieldClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">ПИНФЛ</label>
                <Input value={BROKER_CLIENT.pinfl} disabled className={readOnlyFieldClass} />
              </div>
            </div>
          </div>

          {/* Данные карты — список привязанных карт + форма добавления */}
          <div>
            <h3 className="font-semibold text-gray-900">Данные карты</h3>

            <div className="mt-3 space-y-2">
              {state.cards.length === 0 && (
                <p className="text-sm text-gray-500">Карты не добавлены</p>
              )}
              {state.cards.map((card, index) => (
                <div
                  key={`${card.mask}-${index}`}
                  role={card.confirmed ? undefined : "button"}
                  tabIndex={card.confirmed ? undefined : 0}
                  onClick={() => handleCardRowClick(card.mask, card.confirmed)}
                  onKeyDown={(e) => {
                    if (!card.confirmed && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault()
                      handleCardRowClick(card.mask, card.confirmed)
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3",
                    !card.confirmed && "cursor-pointer transition-colors hover:border-gray-300 hover:bg-gray-50",
                  )}
                >
                  <CreditCard className="size-5 shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{card.mask}</p>
                    <p className="text-xs text-gray-500">{card.expiry}</p>
                  </div>
                  {card.confirmed ? (
                    <Badge className="border-transparent bg-green-50 text-green-700 hover:bg-green-50">
                      Подтверждена
                    </Badge>
                  ) : (
                    <Badge className="border-transparent bg-gray-100 text-gray-600 hover:bg-gray-100">
                      Не подтверждена
                    </Badge>
                  )}
                  <button
                    type="button"
                    aria-label={`Удалить карту ${card.mask}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeCard(card.mask)
                    }}
                    className="shrink-0 text-gray-400 transition-colors hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm text-gray-700">Номер карты</label>
                <Input
                  value={formatCardNumber(cardDigits)}
                  onChange={(e) => handleCardDigitsChange(e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={!!fieldError}
                  className={fieldError ? "border-red-500 focus-visible:ring-red-500" : undefined}
                />
                {fieldError && <p className="mt-1 text-sm text-red-600">{fieldError}</p>}
              </div>
              <div className="w-[100px] shrink-0">
                <label className="mb-1 block text-sm text-gray-700">Срок карты</label>
                <Input
                  value={formatExpiry(expiryDigits)}
                  onChange={(e) => handleExpiryDigitsChange(e.target.value)}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-emerald-50 p-3">
              <p className="text-sm text-emerald-700">
                Чем больше карт, тем выше шанс получить нужный лимит
              </p>
              <Button
                type="button"
                disabled={!canAdd}
                onClick={handleAddCard}
                className="h-9 shrink-0 bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                Добавить
              </Button>
            </div>
          </div>
        </div>

        <Button
          type="button"
          disabled={!hasConfirmedCard}
          onClick={handleContinue}
          className="mt-8 h-11 w-full font-semibold text-black hover:opacity-90 disabled:opacity-50"
          style={{ background: "#FFD60A" }}
        >
          Продолжить
        </Button>
      </div>

      <CardOtpDialog
        open={otpMask !== null}
        cardMask={otpMask ?? ""}
        onConfirmed={handleOtpConfirmed}
        onOpenChange={(open) => {
          if (!open) setOtpMask(null)
        }}
      />

      <AlertDialog open={blockedOpen} onOpenChange={setBlockedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Карта заблокирована</AlertDialogTitle>
            <AlertDialogDescription>
              Лимит исчерпан на привязку. Карта заблокирована для привязки.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setBlockedOpen(false)}>Понятно</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
