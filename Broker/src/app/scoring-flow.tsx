import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { ONE_C_ORDER_NO, makeContractNo } from "@/lib/broker-mock-data"

export interface AdditionalData {
  trustee1: { phone: string; relation: string }
  trustee2?: { phone: string; relation: string }
  debitDate: string // "YYYY-MM-DD"
}

export interface ScoringFlowState {
  alifLimitStatus: "pending" | "ready"
  alifSelected: boolean
  tenor?: number
  cardAttached: boolean
  additionalData?: AdditionalData
  creditConfirmed: boolean
  contractNo?: string
  oneCOrderNo?: string
}

const STORAGE_KEY = "broker:scoring-flow"

const INITIAL: ScoringFlowState = {
  alifLimitStatus: "pending",
  alifSelected: false,
  cardAttached: false,
  creditConfirmed: false,
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
  attachCard: () => void
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

  const attachCard = useCallback(() => {
    setState((prev) => (prev.cardAttached ? prev : { ...prev, cardAttached: true }))
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
      value={{ state, markAlifLimitReady, selectAlif, attachCard, saveAdditionalData, confirmCredit, resetFlow }}
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
