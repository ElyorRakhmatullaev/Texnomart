import { useRef, useState } from "react"
import { Outlet, useNavigate } from "react-router"
import { MoreVertical, Send, SquarePlus, X } from "lucide-react"
import { toast } from "sonner"
import { buttonVariants } from "@texnomart/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@texnomart/ui/dropdown-menu"
import { cn } from "@texnomart/ui/utils"
import { ScoringStepper } from "./ScoringStepper"
import { ActionRail } from "./ActionRail"
import { EndScoringDialog } from "./EndScoringDialog"

export function BrokerShell() {
  const navigate = useNavigate()
  // Одно подтверждение «Завершить скоринг?» на оба входа: ActionRail (≥lg) и меню шапки (<lg).
  const [endScoringOpen, setEndScoringOpen] = useState(false)
  // Кнопка, открывшая подтверждение (кнопка ActionRail или триггер меню шапки), —
  // на неё возвращается фокус после закрытия.
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const endScoringOpenerRef = useRef<HTMLElement | null>(null)
  function openEndScoring(opener: HTMLElement | null) {
    endScoringOpenerRef.current = opener
    setEndScoringOpen(true)
  }

  return (
    // min-h-dvh + flex-1 у <main>: серый фон доходит до низа окна на любой высоте
    // шапки и степпера (раньше min-h считался от 128px, а на телефоне их 117px —
    // под короткими страницами оставалась белая полоса).
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-white px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Texnomart Broker"
            // Тап-таргет 44×44 с прежним жёлтым квадратом 32px внутри; -mx-1.5
            // компенсирует поля кнопки, чтобы квадрат и адрес не сдвинулись.
            className="-mx-1.5 flex size-11 shrink-0 items-center justify-center"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold leading-none">*</span>
            </span>
          </button>
          <span className="truncate text-sm text-gray-700">Ташкент, Янги Шахар, 16а</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <button
            type="button"
            onClick={() => toast("Раздел вне прототипа")}
            className="text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            Подбор товара
          </button>
          <span className="text-sm font-semibold text-gray-900">Скоринг</span>
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-semibold text-gray-900">RU</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-400">UZ</span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
              М
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs text-gray-900">Мирхомитов</span>
              <span className="text-xs text-gray-900">Миржалол</span>
            </div>
          </div>

          {/* < lg ActionRail скрыт — те же три действия здесь. Триггер — нативный
              <button> + buttonVariants, не общий <Button> (иначе Radix-меню
              открывается за экраном). */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                ref={menuTriggerRef}
                type="button"
                aria-label="Действия скоринга"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "-mr-2 size-11 lg:hidden")}
              >
                <MoreVertical className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <DropdownMenuItem className="min-h-11" onSelect={() => toast("Действие вне прототипа")}>
                <SquarePlus />
                Новая вкладка
              </DropdownMenuItem>
              <DropdownMenuItem className="min-h-11" onSelect={() => toast("Действие вне прототипа")}>
                <Send />
                Отправить лимиты в Telegram
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="min-h-11"
                onSelect={() => openEndScoring(menuTriggerRef.current)}
              >
                <X />
                Завершить скоринг
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="shrink-0 border-b bg-white">
        <ScoringStepper />
      </div>

      <main className="flex-1 bg-gray-50">
        <Outlet />
      </main>

      <ActionRail onEndScoring={openEndScoring} />
      <EndScoringDialog
        open={endScoringOpen}
        onOpenChange={setEndScoringOpen}
        returnFocusRef={endScoringOpenerRef}
      />
    </div>
  )
}
