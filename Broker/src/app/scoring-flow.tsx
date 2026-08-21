import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { ONE_C_ORDER_NO, makeContractNo, SEED_CARD } from "@/lib/broker-mock-data"

export interface AdditionalData {
  trustee1: { phone: string; relation: string }
  trustee2?: { phone: string; relation: string }
  debitDate: string // "YYYY-MM-DD"
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
  alifLimitStatus: "pending" | "ready"
  alifSelected: boolean
  tenor?: number
  holdStatus: "none" | "held" | "confirmed" | "cancelled"
  offerConfirmed: boolean
  checkoutOpen: boolean
  additionalData?: AdditionalData
  creditConfirmed: boolean
  contractNo?: string
  oneCOrderNo?: string
}

const STORAGE_KEY = "broker:scoring-flow"

const INITIAL: ScoringFlowState = {
  cards: [{ ...SEED_CARD, confirmed: true }],
  photoDone: false,
  myidDone: false,
  alifLimitStatus: "pending",
  alifSelected: false,
  holdStatus: "none",
  offerConfirmed: false,
  checkoutOpen: false,
  creditConfirmed: false,
}

// Попап оформления Alif — фаза деривируется из состояния потока (не хранится
// отдельным полем), чтобы попап и степпер всегда были синхронны. Порядок
// проверок важен и читается сверху вниз как «что сейчас блокирует прогресс»:
// оформленный кредит → неподтверждённая оферта → неудержанная предоплата →
// уже введённые доп. данные.
export type CheckoutPhase = "confirm" | "hold" | "details" | "otp" | "success"

export function checkoutPhaseOf(state: ScoringFlowState, alifPrepayment: number): CheckoutPhase {
  if (state.creditConfirmed) return "success"
  if (!state.offerConfirmed) return "confirm"
  // Пока обязательная предоплата не удержана, фаза холда перевешивает уже
  // пройденные шаги: отмена холда на «Доп. данных» или на OTP возвращает
  // сюда. additionalData при этом НЕ стирается — после повторного удержания
  // деривация приводит пользователя ровно туда, где он был.
  if (alifPrepayment > 0 && state.holdStatus !== "confirmed") return "hold"
  if (state.additionalData) return "otp"
  return "details"
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
  selectAlif: (tenor: number) => void
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
  saveAdditionalData: (data: AdditionalData) => void
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

  const selectAlif = useCallback((tenor: number) => {
    setState((prev) =>
      prev.alifSelected && prev.tenor === tenor ? prev : { ...prev, alifSelected: true, tenor },
    )
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
    setState((prev) => (prev.holdStatus === "confirmed" ? prev : { ...prev, holdStatus: "confirmed" }))
  }, [])

  // Отмена холда: статус → "cancelled" и ничего больше. Ни alifSelected, ни
  // offerConfirmed, ни additionalData не сбрасываются — пользователь остаётся
  // в ветке Alif на фазе холда (checkoutPhaseOf), видит статус «Холд отменён»
  // и может удержать заново. Полный выход из ветки — отдельное действие
  // cancelOffer.
  const holdCancel = useCallback(() => {
    setState((prev) => (prev.holdStatus === "cancelled" ? prev : { ...prev, holdStatus: "cancelled" }))
  }, [])

  // Выход из ветки Alif к выбору предложения: сбрасывает подтверждение оферты
  // и холд, так что срок на карточке банка снова можно выбрать (BanksPage
  // «замораживает» его, пока offerConfirmed). Введённые доп. данные
  // сохраняются — повторный вход не заставляет заполнять их заново.
  const cancelOffer = useCallback(() => {
    setState((prev) => ({ ...prev, offerConfirmed: false, holdStatus: "none", checkoutOpen: false }))
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

  const saveAdditionalData = useCallback((data: AdditionalData) => {
    setState((prev) => ({ ...prev, additionalData: data }))
  }, [])

  const confirmCredit = useCallback(() => {
    setState((prev) =>
      prev.creditConfirmed
        ? prev
        : {
            ...prev,
            creditConfirmed: true,
            contractNo: prev.contractNo ?? makeContractNo(),
            oneCOrderNo: ONE_C_ORDER_NO,
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
        selectAlif,
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
        saveAdditionalData,
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
