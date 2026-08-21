import { useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@texnomart/ui/utils"
import { Button } from "@texnomart/ui/button"
import { Badge } from "@texnomart/ui/badge"
import { Skeleton } from "@texnomart/ui/skeleton"
import type { Bank } from "@/lib/broker-mock-data"

export interface BankCardProps {
  bank: Bank
  pending: boolean
  /**
   * Кредит уже оформлен (Alif, creditConfirmed) — бейдж «Оформлена» вместо
   * «Одобрена», а кнопка ведёт к договору: попап переоткрывается сразу на
   * фазе успеха, где договор можно посмотреть и скачать.
   */
  completed?: boolean
  onCheckout: (tenor: number) => void
}

export function BankCard({ bank, pending, completed = false, onCheckout }: BankCardProps) {
  const [tenor, setTenor] = useState(bank.defaultTenor)

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-[0px_2px_4px_rgba(204,204,204,0.25)] md:p-6">
      {/* Хедер: логотип + название + статус-бейдж */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
          style={{ background: bank.brandColor }}
        >
          {bank.initial}
        </div>
        <span className="flex-1 font-semibold text-gray-900">{bank.title}</span>
        {pending ? (
          <Badge className="border-transparent bg-amber-50 text-amber-700 hover:bg-amber-50">
            Рассчитывается…
          </Badge>
        ) : completed ? (
          <Badge className="border-transparent bg-green-50 text-green-700 hover:bg-green-50">
            ✓ Оформлена
          </Badge>
        ) : (
          <Badge className="border-transparent bg-green-50 text-green-700 hover:bg-green-50">
            ✓ Одобрена
          </Badge>
        )}
      </div>

      {/* Чипы сроков */}
      <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
        {bank.tenors.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTenor(t)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              t === tenor
                ? "bg-white text-gray-900 shadow-[0px_2px_4px_rgba(204,204,204,0.25)]"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            {t} мес.
          </button>
        ))}
      </div>

      {pending ? (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="size-4 shrink-0 animate-spin" />
            Ваш запрос отправлен, сейчас проходит оценка, ожидается ответ
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col gap-2 rounded-lg border p-4 animate-in fade-in duration-500"
          style={{ borderColor: "#FFD60A" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Доступный лимит</span>
            <span className="font-semibold tabular-nums text-gray-900">
              {bank.limit.toLocaleString("ru-RU")} сум
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Срок</span>
            <span className="font-semibold tabular-nums text-red-600">0-0-{tenor}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Предоплата</span>
            <span className="font-semibold tabular-nums text-gray-900">
              {bank.prepayment.toLocaleString("ru-RU")} сум
            </span>
          </div>
        </div>
      )}

      <Button
        type="button"
        disabled={pending}
        onClick={() => onCheckout(tenor)}
        className="h-11 font-semibold text-black hover:opacity-90 disabled:opacity-50"
        style={pending ? undefined : { background: "#FFD60A", color: "#000" }}
      >
        {pending ? "Загрузка" : completed ? "Открыть договор" : "Оформить"}
      </Button>
    </div>
  )
}
