import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { sumToTiyin, type ApplicationStatus } from "@/lib/alif-application"
import { ONE_C_ORDER_NO, makeContractNo, SEED_CARD, HOLD_TILL_DAYS, ALIF_PREPAYMENT } from "@/lib/broker-mock-data"

export interface Relation {
  /** Вид родства из RELATION_KINDS. */
  type: string
  /** Отформатированный номер: "+998 XX XXX XX XX". */
  phone: string
  name: string
}

export interface Survey {
  activityAreaId: string
  language: "ru" | "uz"
  car?: boolean
}

export interface AlifCard {
  /** Маска в формате Alif: 986035******1296. */
  pan: string
  /** Маска телефона, куда ушёл код: ********9848. */
  phone: string
  phoneMatch: boolean
}

export interface HoldRecord {
  /** ISO-строки. */
  at: string
  till: string
  cardPan: string
  /**
   * Сумма удержания в тийинах — ровно в том виде, в каком её принимает
   * hold-down-payment. На экран выводится через tiyinToSum: §2 ТЗ требует
   * показывать суммы в сумах.
   */
  amountTiyin: number
}

export interface AlifApplication {
  id: string
  status: ApplicationStatus
  createdAt: string
  firstPaymentDate: string
  imei?: string
  amount: number
  commission: number
  duration: number
  cancelReasonKey?: string
}

export interface AttachedCard {
  mask: string
  expiry: string
  confirmed: boolean
}

export interface ScoringFlowState {
  cards: AttachedCard[]
  photoDone: boolean
  myidDone: boolean
  alifLimitStatus: "pending" | "ready" | "rejected"
  holdStatus: "none" | "held" | "confirmed" | "cancelled"
  offerConfirmed: boolean
  checkoutOpen: boolean
  creditConfirmed: boolean
  contractNo?: string
  oneCOrderNo?: string
  planId?: string
  alifCard?: AlifCard
  relations?: Relation[]
  survey?: Survey
  application?: AlifApplication
  hold?: HoldRecord
  contractDate?: string
  sessionExpired?: boolean
}

// v2 — состояние поменялось несовместимо (planId вместо tenor, relations
// вместо additionalData, появилась заявка). Чтение делает {...INITIAL,
// ...parsed}, поэтому старый снимок дал бы полусостояние.
const STORAGE_KEY = "broker:scoring-flow:v2"

const INITIAL: ScoringFlowState = {
  cards: [{ ...SEED_CARD, confirmed: true }],
  photoDone: false,
  myidDone: false,
  alifLimitStatus: "pending",
  holdStatus: "none",
  offerConfirmed: false,
  checkoutOpen: false,
  creditConfirmed: false,
}

export type CheckoutPhase =
  | "offer"
  | "card"
  | "details"
  | "application"
  | "hold"
  | "otp"
  | "success"

// Внутренний прогресс мастера: экраны 7 и 8 ТЗ (итог кредита и договор) в
// попапе — одна фаза успеха, поэтому шагов семь, а не восемь.
export const PHASE_STEP: Record<CheckoutPhase, { step: number; title: string }> = {
  offer: { step: 1, title: "Предложение Alif" },
  card: { step: 2, title: "Привязка карты" },
  details: { step: 3, title: "Дополнительные данные" },
  application: { step: 4, title: "Создание заявки" },
  hold: { step: 5, title: "Предоплата" },
  otp: { step: 6, title: "Подтверждение кредита" },
  success: { step: 7, title: "Кредит оформлен" },
}

export const CHECKOUT_STEP_COUNT = 7

// Порядок проверок читается сверху вниз как «что сейчас блокирует прогресс»,
// а не «как далеко зашли». Два места здесь трогать нельзя:
//
// 1. Холд стоит ПОСЛЕ создания заявки — по ТЗ заявка сначала создаётся со
//    статусом NEW, и только потом удерживается предоплата.
// 2. Холд стоит ВЫШЕ otp — иначе отмена холда с шага OTP оставит оператора
//    на экране подтверждения кредита при уже разблокированных деньгах. Это
//    ровно тот баг, который чинили 19.08; менять порядок нельзя.
//
// relations и survey сохраняются одним действием экрана 3, поэтому проверки
// на survey здесь нет: заполненные relations означают пройденный экран.
//
// Условие фазы холда двойное. Заявка остаётся «Новой» после удержания — на
// рассмотрение её отправляет отдельное действие submitForReview с кнопки
// «Продолжить». Без второй половины условия деривация уводила бы оператора с
// холда сразу после удержания, а тогда предикат «отменить холд можно только
// пока заявка новая» стал бы невыполнимым: и кнопка отмены холда, и состояние
// «Холд отменён» превратились бы в мёртвый код, а статус REVIEWING не был бы
// виден нигде.
export function checkoutPhaseOf(state: ScoringFlowState, alifPrepayment: number): CheckoutPhase {
  if (state.creditConfirmed) return "success"
  if (!state.offerConfirmed) return "offer"
  if (!state.alifCard) return "card"
  if (!state.relations) return "details"
  if (!state.application) return "application"
  if (
    alifPrepayment > 0 &&
    (state.holdStatus !== "confirmed" || state.application.status === "NEW")
  ) {
    return "hold"
  }
  return "otp"
}

function readInitialState(): ScoringFlowState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL
    const parsed = JSON.parse(raw) as Partial<ScoringFlowState>
    return { ...INITIAL, ...parsed }
  } catch {
    return INITIAL
  }
}

export interface ScoringFlowContextValue {
  state: ScoringFlowState
  markAlifLimitReady: () => void
  selectPlan: (planId: string) => void
  setAlifLimitStatus: (alifLimitStatus: ScoringFlowState["alifLimitStatus"]) => void
  attachAlifCard: (alifCard: AlifCard) => void
  addCard: (mask: string, expiry: string) => void
  confirmCard: (mask: string) => void
  removeCard: (mask: string) => void
  setPhotoDone: () => void
  setMyidDone: () => void
  holdHold: () => void
  holdConfirm: () => void
  holdCancel: () => void
  confirmOffer: () => void
  cancelOffer: () => void
  openCheckout: () => void
  closeCheckout: () => void
  saveDetails: (relations: Relation[], survey: Survey) => void
  createApplication: (application: AlifApplication) => void
  setApplicationStatus: (status: ApplicationStatus) => void
  submitForReview: () => void
  cancelApplication: (cancelReasonKey: string) => void
  sellApplication: () => void
  unsellApplication: () => void
  expireSession: () => void
  refreshSession: () => void
  confirmCredit: () => void
  resetFlow: () => void
}

const ScoringFlowContext = createContext<ScoringFlowContextValue | undefined>(undefined)

export function ScoringFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScoringFlowState>(readInitialState)

  // Персистим весь стейт при каждом изменении.
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // sessionStorage недоступен (приватный режим и т.п.) — остаёмся в памяти
    }
  }, [state])

  const markAlifLimitReady = useCallback(() => {
    setState((prev) => (prev.alifLimitStatus === "ready" ? prev : { ...prev, alifLimitStatus: "ready" }))
  }, [])

  const selectPlan = useCallback((planId: string) => {
    setState((prev) => (prev.planId === planId ? prev : { ...prev, planId }))
  }, [])

  const setAlifLimitStatus = useCallback((alifLimitStatus: ScoringFlowState["alifLimitStatus"]) => {
    setState((prev) => (prev.alifLimitStatus === alifLimitStatus ? prev : { ...prev, alifLimitStatus }))
  }, [])

  const attachAlifCard = useCallback((alifCard: AlifCard) => {
    setState((prev) => ({ ...prev, alifCard }))
  }, [])

  const addCard = useCallback((mask: string, expiry: string) => {
    setState((prev) => ({ ...prev, cards: [...prev.cards, { mask, expiry, confirmed: false }] }))
  }, [])

  const confirmCard = useCallback((mask: string) => {
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => (c.mask === mask ? { ...c, confirmed: true } : c)),
    }))
  }, [])

  const removeCard = useCallback((mask: string) => {
    setState((prev) => ({ ...prev, cards: prev.cards.filter((c) => c.mask !== mask) }))
  }, [])

  const setPhotoDone = useCallback(() => {
    setState((prev) => (prev.photoDone ? prev : { ...prev, photoDone: true }))
  }, [])

  const setMyidDone = useCallback(() => {
    setState((prev) => (prev.myidDone ? prev : { ...prev, myidDone: true }))
  }, [])

  const holdHold = useCallback(() => {
    setState((prev) => (prev.holdStatus === "held" ? prev : { ...prev, holdStatus: "held" }))
  }, [])

  const holdConfirm = useCallback(() => {
    setState((prev) => {
      if (prev.holdStatus === "confirmed") return prev
      const at = new Date()
      const till = new Date(at.getTime() + HOLD_TILL_DAYS * 24 * 60 * 60 * 1000)
      const card = prev.cards.find((c) => c.confirmed)
      return {
        ...prev,
        holdStatus: "confirmed",
        hold: {
          at: at.toISOString(),
          till: till.toISOString(),
          cardPan: card?.mask ?? SEED_CARD.mask,
          amountTiyin: sumToTiyin(ALIF_PREPAYMENT),
        },
      }
    })
  }, [])

  // Отмена холда: статус → "cancelled" и ничего больше. Ни offerConfirmed, ни
  // application, ни relations/survey не сбрасываются — пользователь остаётся
  // в ветке Alif на фазе холда (checkoutPhaseOf), видит статус «Холд отменён»
  // и может удержать заново. Полный выход из ветки — отдельное действие
  // cancelOffer.
  const holdCancel = useCallback(() => {
    setState((prev) => (prev.holdStatus === "cancelled" ? prev : { ...prev, holdStatus: "cancelled" }))
  }, [])

  // Выход из ветки Alif к выбору предложения. Заявка и холд стираются: уход с
  // оферты и есть отказ от заявки, а без очистки отменённая заявка сделала бы
  // повторный вход тупиком — оператор снова попадал бы на терминальный экран
  // «Заявка отменена». planId и alifCard, наоборот, переживают выход: экран 1
  // переоткроется с уже выбранным планом, а повторно вводить код карты
  // оператор не должен.
  const cancelOffer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      offerConfirmed: false,
      holdStatus: "none",
      application: undefined,
      hold: undefined,
      checkoutOpen: false,
    }))
  }, [])

  const confirmOffer = useCallback(() => {
    setState((prev) => (prev.offerConfirmed ? prev : { ...prev, offerConfirmed: true }))
  }, [])

  const openCheckout = useCallback(() => {
    setState((prev) => (prev.checkoutOpen ? prev : { ...prev, checkoutOpen: true }))
  }, [])

  const closeCheckout = useCallback(() => {
    setState((prev) => (prev.checkoutOpen ? { ...prev, checkoutOpen: false } : prev))
  }, [])

  const saveDetails = useCallback((relations: Relation[], survey: Survey) => {
    setState((prev) => ({ ...prev, relations, survey }))
  }, [])

  const createApplication = useCallback((application: AlifApplication) => {
    setState((prev) => ({ ...prev, application }))
  }, [])

  const setApplicationStatus = useCallback((status: ApplicationStatus) => {
    setState((prev) =>
      prev.application ? { ...prev, application: { ...prev.application, status } } : prev,
    )
  }, [])

  // Отправка заявки на рассмотрение — отдельное действие, а не побочный эффект
  // удержания предоплаты. Пока оператор его не выполнил, заявка остаётся «Новой»,
  // и холд можно отменить.
  const submitForReview = useCallback(() => {
    setState((prev) =>
      prev.application && prev.application.status === "NEW"
        ? { ...prev, application: { ...prev.application, status: "REVIEWING" } }
        : prev,
    )
  }, [])

  // Отмена заявки снимает и холд — и "held" (удержание ещё идёт, ~2 с до
  // автоматического holdConfirm), и "confirmed" (уже подтверждён): кнопка
  // «Отменить заявку» в шапке попапа кликабельна в обоих состояниях, а
  // удержанные деньги не могут пережить заявку ни в одном из них. Если
  // оставить "held" как есть, отмена в этом окне не размораживает деньги и
  // держит попап заблокированным навсегда — таймер holdConfirm из HoldPhase
  // не сработает, потому что фаза размонтируется под терминальный экран.
  const cancelApplication = useCallback((cancelReasonKey: string) => {
    setState((prev) =>
      prev.application
        ? {
            ...prev,
            holdStatus:
              prev.holdStatus === "confirmed" || prev.holdStatus === "held"
                ? "cancelled"
                : prev.holdStatus,
            application: { ...prev.application, status: "CANCELLED", cancelReasonKey },
          }
        : prev,
    )
  }, [])

  const sellApplication = useCallback(() => {
    setState((prev) =>
      prev.application ? { ...prev, application: { ...prev.application, status: "SOLD" } } : prev,
    )
  }, [])

  const unsellApplication = useCallback(() => {
    setState((prev) =>
      prev.application ? { ...prev, application: { ...prev.application, status: "CANCELLED" } } : prev,
    )
  }, [])

  const expireSession = useCallback(() => {
    setState((prev) => (prev.sessionExpired ? prev : { ...prev, sessionExpired: true }))
  }, [])

  const refreshSession = useCallback(() => {
    setState((prev) => (prev.sessionExpired ? { ...prev, sessionExpired: false } : prev))
  }, [])

  const confirmCredit = useCallback(() => {
    setState((prev) =>
      prev.creditConfirmed
        ? prev
        : {
            ...prev,
            creditConfirmed: true,
            contractNo: prev.contractNo ?? makeContractNo(),
            // Дата подписания фиксируется здесь. Раньше SuccessPhase считала её
            // как new Date() при рендере, поэтому при повторном открытии
            // показывалась сегодняшняя дата, а не дата оформления.
            contractDate: prev.contractDate ?? new Date().toISOString(),
            oneCOrderNo: ONE_C_ORDER_NO,
            application: prev.application ? { ...prev.application, status: "ACTIVE" } : prev.application,
          },
    )
  }, [])

  const resetFlow = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    setState(INITIAL)
  }, [])

  return (
    <ScoringFlowContext.Provider
      value={{
        state,
        markAlifLimitReady,
        selectPlan,
        setAlifLimitStatus,
        attachAlifCard,
        addCard,
        confirmCard,
        removeCard,
        setPhotoDone,
        setMyidDone,
        holdHold,
        holdConfirm,
        holdCancel,
        confirmOffer,
        cancelOffer,
        openCheckout,
        closeCheckout,
        saveDetails,
        createApplication,
        setApplicationStatus,
        submitForReview,
        cancelApplication,
        sellApplication,
        unsellApplication,
        expireSession,
        refreshSession,
        confirmCredit,
        resetFlow,
      }}
    >
      {children}
    </ScoringFlowContext.Provider>
  )
}

export function useScoringFlow(): ScoringFlowContextValue {
  const ctx = useContext(ScoringFlowContext)
  if (!ctx) {
    throw new Error("useScoringFlow must be used within a ScoringFlowProvider")
  }
  return ctx
}
