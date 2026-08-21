import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { CheckCircle2, CreditCard, Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@texnomart/ui/alert-dialog"
import { Button } from "@texnomart/ui/button"
import { useScoringFlow } from "@/app/scoring-flow"
import { canCancelHold, tiyinToSum } from "@/lib/alif-application"
import { ALIF_PREPAYMENT, PREPAYMENT_HOLD_DELAY_MS, maskCardNumber } from "@/lib/broker-mock-data"

// Фаза «Удержание предоплаты» — контент бывшей HoldPage без страничного
// контейнера/степпера. Показывает все четыре статуса холда: не удержан →
// удерживается → подтверждён → отменён. Переход на следующую фазу происходит
// сам (деривация в AlifCheckoutDialog), эта фаза не навигирует.
//
// Отменённый холд остаётся видимым состоянием (раньше "cancelled" схлопывался
// в "none" и попап закрывался — от отмены не оставалось следа): пользователь
// видит, что удержание снято, и может удержать заново, не выходя из ветки.
// Это единственное место, откуда holdCancel вообще достижим: заявка остаётся
// «Новой» именно на этой фазе, до нажатия «Продолжить» — см. проверку
// canCancelHold ниже и ветку status === "confirmed".
export function HoldPhase() {
  const { state, holdHold, holdConfirm, holdCancel, cancelOffer, submitForReview } = useScoringFlow()
  const [confirmOpen, setConfirmOpen] = useState(false)

  // holdStatus персистится в sessionStorage — если попап переоткрыт заново,
  // пока холд ещё "held" (таймер подтверждения не успел сработать до
  // закрытия/перезагрузки), перезапускаем таймер, чтобы подтверждение всё
  // равно произошло.
  useEffect(() => {
    if (state.holdStatus !== "held") return
    const t = setTimeout(holdConfirm, PREPAYMENT_HOLD_DELAY_MS)
    return () => clearTimeout(t)
  }, [state.holdStatus, holdConfirm])

  const status = state.holdStatus
  const card = state.cards.find((c) => c.confirmed)

  // Правило ТЗ «отменить холд можно только пока заявка новая» выражено
  // отдельным именованным предикатом (canCancelHold), а не только неявно
  // вытекает из того, что деривация checkoutPhaseOf держит оператора на этой
  // фазе, пока статус ещё "NEW": так правило не потеряется, если порядок фаз
  // когда-нибудь изменится.
  const applicationStatus = state.application?.status
  const cancellable = applicationStatus !== undefined && canCancelHold(applicationStatus)

  function handleCancelHold() {
    setConfirmOpen(false)
    holdCancel()
    toast("Холд отменён — предоплата разблокирована")
  }

  return (
    <>
      <div className="px-2 py-4">
        <h2 className="text-xl font-bold text-gray-900">Предоплата по рассрочке</h2>
        <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">
          {ALIF_PREPAYMENT.toLocaleString("ru-RU")} сум
        </p>

        {card && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-700">
            <CreditCard className="size-4 shrink-0 text-gray-400" />
            <span>Карта списания: {maskCardNumber(card.mask)}</span>
          </div>
        )}

        <p className="mt-4 text-sm text-gray-500">
          Средства будут удержаны (холд) и списаны после оформления кредита. До завершения оформления холд можно
          отменить.
        </p>

        <div className="mt-6">
          {status === "none" && (
            <Button
              type="button"
              onClick={holdHold}
              className="h-11 w-full font-semibold text-black hover:opacity-90"
              style={{ background: "#FFD60A" }}
            >
              Подтвердить удержание
            </Button>
          )}

          {status === "held" && (
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
              <Loader2 className="size-4 shrink-0 animate-spin" />
              Предоплата удерживается…
            </div>
          )}

          {status === "confirmed" && (
            <div>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-700">
                <CheckCircle2 className="size-5 shrink-0" />
                <span className="font-medium">Предоплата подтверждена</span>
              </div>

              {state.hold && (
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-gray-50 px-4 py-3 text-sm">
                  <span className="text-gray-500">Удержано</span>
                  <span className="text-right font-medium tabular-nums text-gray-900">
                    {format(new Date(state.hold.at), "dd.MM.yyyy HH:mm", { locale: ru })}
                  </span>
                  <span className="text-gray-500">Действует до</span>
                  <span className="text-right font-medium tabular-nums text-gray-900">
                    {format(new Date(state.hold.till), "dd.MM.yyyy HH:mm", { locale: ru })}
                  </span>
                  <span className="text-gray-500">Карта</span>
                  <span className="text-right font-medium tabular-nums text-gray-900">
                    {maskCardNumber(state.hold.cardPan)}
                  </span>
                  <span className="text-gray-500">Сумма</span>
                  <span className="text-right font-medium tabular-nums text-gray-900">
                    {/* В записи холда сумма лежит в тийинах, как её принимает API; на экран
                        она выводится в сумах — §2 ТЗ. */}
                    {tiyinToSum(state.hold.amountTiyin).toLocaleString("ru-RU")} сум
                  </span>
                </div>
              )}

              <Button
                type="button"
                onClick={submitForReview}
                className="mt-4 h-11 w-full font-semibold text-black hover:opacity-90"
                style={{ background: "#FFD60A" }}
              >
                Продолжить
              </Button>

              {cancellable && (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="mt-3 block w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700"
                >
                  Отменить холд
                </button>
              )}
            </div>
          )}

          {status === "cancelled" && (
            <>
              <div className="flex gap-2 rounded-lg bg-amber-50 px-4 py-3 text-amber-800">
                <XCircle className="size-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Холд отменён</p>
                  <p className="mt-0.5">
                    Средства разблокированы. Чтобы продолжить оформление, удержите предоплату заново.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={holdHold}
                className="mt-4 h-11 w-full font-semibold text-black hover:opacity-90"
                style={{ background: "#FFD60A" }}
              >
                Удержать заново
              </Button>
            </>
          )}
        </div>

        {/* Пока холд «держится», выход запрещён — попап в этот момент заблокирован целиком */}
        {status !== "held" && status !== "confirmed" && (
          <button
            type="button"
            onClick={cancelOffer}
            className="mt-4 block w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            Вернуться к выбору предложения
          </button>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отменить удержание предоплаты?</AlertDialogTitle>
            <AlertDialogDescription>
              {ALIF_PREPAYMENT.toLocaleString("ru-RU")} сум будут разблокированы на карте клиента. Оформление
              вернётся к шагу предоплаты — чтобы продолжить, удержание придётся подтвердить заново. Введённые
              данные сохранятся.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Не отменять</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelHold}>Отменить холд</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
