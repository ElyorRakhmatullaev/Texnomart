import { useEffect, useState, type ComponentType, type ReactNode } from "react"
import { CreditCard, FileSignature } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@texnomart/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@texnomart/ui/input-otp"
import { cn } from "@texnomart/ui/utils"
import { OTP_FAIL_CODE, OTP_MAX_ATTEMPTS, OTP_RESEND_SECONDS, OTP_TTL_SECONDS } from "@/lib/broker-mock-data"

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
// состояние (код/ошибка/таймеры/попытки) заводится через useState при каждом
// монтировании, поэтому хосты, которым нужен «чистый» шаг при повторном
// открытии, просто монтируют панель заново (через key или условный рендер).
//
// Код можно «испортить» двумя способами, оба блокируют ввод до повторной
// отправки: исчерпать OTP_MAX_ATTEMPTS попыток или дождаться, пока истечёт
// его срок жизни (OTP_TTL_SECONDS). Повторная отправка — единственный выход
// из обоих состояний, поэтому в них ссылка доступна сразу, не дожидаясь
// таймера OTP_RESEND_SECONDS.
export function OtpPanel({ variant, subtitle, ctaLabel, onSuccess, children }: OtpPanelProps) {
  const chip = VARIANT_CHIP[variant]
  const ChipIcon = chip.icon

  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [resendSeconds, setResendSeconds] = useState(OTP_RESEND_SECONDS)
  const [ttlSeconds, setTtlSeconds] = useState(OTP_TTL_SECONDS)
  const [attemptsLeft, setAttemptsLeft] = useState(OTP_MAX_ATTEMPTS)

  const expired = ttlSeconds <= 0
  const attemptsSpent = attemptsLeft <= 0
  const locked = expired || attemptsSpent
  // В заблокированном состоянии ждать таймер бессмысленно — новый код нужен
  // прямо сейчас.
  const canResend = locked || resendSeconds <= 0

  // Один интервал на оба обратных отсчёта — они всегда идут синхронно.
  useEffect(() => {
    const id = setInterval(() => {
      setResendSeconds((prev) => (prev <= 0 ? 0 : prev - 1))
      setTtlSeconds((prev) => (prev <= 0 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Истечение срока — «пассивное» событие (пользователь мог ничего не нажимать),
  // поэтому сообщение выставляется отдельным эффектом, а не в обработчике.
  useEffect(() => {
    if (!expired) return
    setError("Срок действия кода истёк. Запросите новый код")
  }, [expired])

  function handleChange(value: string) {
    if (locked) return
    setCode(value)
    if (error) setError(null)
  }

  function handleSubmit() {
    if (locked || code.length < 6) return
    if (code === OTP_FAIL_CODE) {
      const left = attemptsLeft - 1
      setAttemptsLeft(left)
      setCode("")
      setError(
        left > 0
          ? `Неверный код. Осталось попыток: ${left}`
          : "Превышено число попыток. Запросите новый код",
      )
      return
    }
    onSuccess()
  }

  function handleResend() {
    setResendSeconds(OTP_RESEND_SECONDS)
    setTtlSeconds(OTP_TTL_SECONDS)
    setAttemptsLeft(OTP_MAX_ATTEMPTS)
    setCode("")
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
        <InputOTP
          maxLength={6}
          value={code}
          onChange={handleChange}
          disabled={locked}
          autoFocus
          inputMode="numeric"
        >
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
        {!error && !locked && (
          <p className="mt-2 text-xs text-gray-400">
            Код действует {formatResendTimer(ttlSeconds)}
          </p>
        )}
      </div>

      <div className="mt-4 text-sm">
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            className="font-medium text-blue-600 hover:underline"
          >
            Отправить код повторно
          </button>
        ) : (
          <span className="text-gray-400">
            Отправить код повторно через {formatResendTimer(resendSeconds)}
          </span>
        )}
      </div>

      <Button
        type="button"
        disabled={locked || code.length < 6}
        onClick={handleSubmit}
        className="mt-6 h-11 w-full font-semibold text-black hover:opacity-90 disabled:opacity-50"
        style={{ background: "#FFD60A" }}
      >
        {ctaLabel}
      </Button>
    </div>
  )
}
