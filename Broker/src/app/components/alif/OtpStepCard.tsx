import { useEffect, useState, type ComponentType, type ReactNode } from "react"
import { CheckCircle2, CreditCard, FileSignature } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@texnomart/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@texnomart/ui/input-otp"
import { cn } from "@texnomart/ui/utils"
import { OTP_FAIL_CODE, OTP_RESEND_SECONDS } from "@/lib/broker-mock-data"

export interface OtpStepCardProps {
  variant: "card" | "credit"
  title: string
  subtitle: ReactNode
  ctaLabel: string
  onSuccess: () => void
  onBack: () => void
  /** Доп. контент над полем ввода: сводка/callout (используется, напр., экраном подтверждения кредита). */
  children?: ReactNode
  /** Если задан — шаг уже пройден: вместо поля ввода показывается зелёная строка + CTA «Продолжить». */
  completedNote?: string
}

const VARIANT_CHIP: Record<
  OtpStepCardProps["variant"],
  { className: string; icon: ComponentType<{ className?: string }>; label: string }
> = {
  card: { className: "bg-gray-100 text-gray-700", icon: CreditCard, label: "Код 1 из 2 · Привязка карты" },
  credit: {
    className: "bg-emerald-50 text-emerald-700",
    icon: FileSignature,
    label: "Код 2 из 2 · Подтверждение кредита",
  },
}

function formatResendTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export function OtpStepCard({
  variant,
  title,
  subtitle,
  ctaLabel,
  onSuccess,
  onBack,
  children,
  completedNote,
}: OtpStepCardProps) {
  const chip = VARIANT_CHIP[variant]
  const ChipIcon = chip.icon

  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [resendSeconds, setResendSeconds] = useState(OTP_RESEND_SECONDS)

  // Непрерывный тикер: живёт всё время, пока шаг не пройден. «Перезапуск» отсчёта
  // (после «Отправить код повторно») — это просто сброс resendSeconds к исходному
  // значению ниже в handleResend, сам interval при этом не пересоздаётся.
  useEffect(() => {
    if (completedNote) return
    const id = setInterval(() => {
      setResendSeconds((prev) => (prev <= 0 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [completedNote])

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
    toast.success("Код отправлен повторно")
  }

  return (
    <div className="mx-auto max-w-[560px] rounded-lg bg-white p-6 shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:p-8">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          chip.className,
        )}
      >
        <ChipIcon className="size-4" />
        {chip.label}
      </div>

      <h2 className="mt-4 text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>

      {children && <div className="mt-4">{children}</div>}

      {completedNote ? (
        <>
          <div className="mt-6 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="size-5 shrink-0" />
            {completedNote}
          </div>

          <Button
            type="button"
            onClick={onSuccess}
            className="mt-6 h-11 w-full font-semibold text-black hover:opacity-90"
            style={{ background: "#FFD60A" }}
          >
            Продолжить
          </Button>
        </>
      ) : (
        <>
          <div className="mt-6">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={handleChange}
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
          </div>

          <div className="mt-4 text-sm">
            {resendSeconds > 0 ? (
              <span className="text-gray-400">
                Отправить код повторно через {formatResendTimer(resendSeconds)}
              </span>
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
        </>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-3 block w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        Вернуться к предыдущему шагу
      </button>
    </div>
  )
}
