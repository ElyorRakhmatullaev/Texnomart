import { Outlet, useNavigate } from "react-router"
import { toast } from "sonner"
import { ScoringStepper } from "./ScoringStepper"
import { ActionRail } from "./ActionRail"

export function BrokerShell() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Texnomart Broker"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <span className="text-lg font-bold leading-none">*</span>
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
        </div>
      </header>

      <div className="shrink-0 border-b bg-white">
        <ScoringStepper />
      </div>

      <main className="bg-gray-50 min-h-[calc(100vh-128px)]">
        <Outlet />
      </main>

      <ActionRail />
    </div>
  )
}
