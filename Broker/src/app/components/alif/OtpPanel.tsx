import { useEffect, useState, type ComponentType, type ReactNode } from "react"
import { CreditCard, FileSignature } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@texnomart/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@texnomart/ui/input-otp"
import { cn } from "@texnomart/ui/utils"
import { OTP_FAIL_CODE, OTP_RESEND_SECONDS } from "@/lib/broker-mock-data"

export interface OtpPanelProps {
  variant: "card" | "credit"
  subtitle: ReactNode
  ctaLabel: string
  onSuccess: () => void
  /** Доп. контент над полем ввода: сводка/callout. */
  children?: ReactNode
}

const VARIANT_CHIP: Record<
  OtpPanelProps["variant"],
  { className: string; icon: ComponentType<{ className?: string }>; label: string }
> = {
  card: { className: "bg-gray-100 text-gray-700", icon: CreditCard, label: "Подтверждение карты" },
  credit: {
    className: "bg-emerald-50 text-emerald-700",
    icon: FileSignature,
    label: "Подтверждение кредита",
  },
}

function formatResendTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

// Начинка OTP-шага (перенесена из OtpStepCard: без карточки-обёртки, без
// заголовка H2 и без back-ссылки — это отдаётся на откуп хосту). Внутреннее
// состояние (код/ошибка/таймер) заводится через useState при каждом монтировании,
// поэтому хосты, которым нужен «чистый» шаг при повторном открытии, просто
// монтируют панель заново (через key или условный рендер).
export function OtpPanel({ variant, subtitle, ctaLabel, onSuccess, children }: OtpPanelProps) {
  const chip = VARIANT_CHIP[variant]
  const ChipIcon = chip.icon

  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [resendSeconds, setResendSeconds] = useState(OTP_RESEND_SECONDS)

  useEffect(() => {
    const id = setInterval(() => {
      setResendSeconds((prev) => (prev <= 0 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  function handleChange(value: string) {
    setCode(value)
    if (error) setError(null)
  }

  function handleSubmit() {
    if (code.length < 6) return
    if (code === OTP_FAIL_CODE) {
      setError("Неверный код. Проверьте SMS и попробуйте ещё раз")
      setCode("")
      return
    }
    onSuccess()
  }

  function handleResend() {
    setResendSeconds(OTP_RESEND_SECONDS)
    setError(null)
    toast.success("Код отправлен повторно")
  }

  return (
    <div>
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          chip.className,
        )}
      >
        <ChipIcon className="size-4" />
        {chip.label}
      </div>

      <p className="mt-4 text-sm text-gray-500">{subtitle}</p>

      {children && <div className="mt-4">{children}</div>}

      <div className="mt-6">
        <InputOTP maxLength={6} value={code} onChange={handleChange} autoFocus inputMode="numeric">
          <InputOTPGroup>
            <InputOTPSlot index={0} aria-invalid={!!error} />
            <InputOTPSlot index={1} aria-invalid={!!error} />
            <InputOTPSlot index={2} aria-invalid={!!error} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} aria-invalid={!!error} />
            <InputOTPSlot index={4} aria-invalid={!!error} />
            <InputOTPSlot index={5} aria-invalid={!!error} />
          </InputOTPGroup>
        </InputOTP>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-4 text-sm">
        {resendSeconds > 0 ? (
          <span className="text-gray-400">Отправить код повторно через {formatResendTimer(resendSeconds)}</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="font-medium text-blue-600 hover:underline"
          >
            Отправить код повторно
          </button>
        )}
      </div>

      <Button
        type="button"
        disabled={code.length < 6}
        onClick={handleSubmit}
        className="mt-6 h-11 w-full font-semibold text-black hover:opacity-90 disabled:opacity-50"
        style={{ background: "#FFD60A" }}
      >
        {ctaLabel}
      </Button>
    </div>
  )
}
