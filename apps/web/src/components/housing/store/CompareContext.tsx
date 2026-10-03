import { Dorm } from "@iguide/dorm"
import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react"

import { useDormData } from "./DormDataContext"
import { useRetainedState } from "./retainedState"

const MAX_COMPARE = 4

interface CompareContextType {
  compareIds: string[]
  compareDorms: Dorm[]
  isCompareOpen: boolean
  toggleCompare: (dormId: string) => void
  clearCompare: () => void
  openCompare: () => void
  closeCompare: () => void
}

const CompareContext = createContext<CompareContextType | undefined>(undefined)

export const CompareProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { getDormById } = useDormData()
  const [compareIds, setCompareIds] = useRetainedState<string[]>("compare.ids", [])
  const [isCompareOpen, setIsCompareOpen] = useState(false)

  const toggleCompare = useCallback(
    (dormId: string) => {
      setCompareIds((prev) => {
        if (prev.includes(dormId)) {
          return prev.filter((id) => id !== dormId)
        }
        if (prev.length >= MAX_COMPARE) return prev
        return [...prev, dormId]
      })
    },
    [setCompareIds],
  )

  const clearCompare = useCallback(() => {
    setCompareIds([])
    setIsCompareOpen(false)
  }, [setCompareIds])

  const openCompare = useCallback(() => setIsCompareOpen(true), [])
  const closeCompare = useCallback(() => setIsCompareOpen(false), [])

  const compareDorms = useMemo(
    () => compareIds.map(getDormById).filter((d): d is Dorm => d !== undefined),
    [compareIds, getDormById],
  )

  const value = useMemo(
    () => ({
      compareIds,
      compareDorms,
      isCompareOpen,
      toggleCompare,
      clearCompare,
      openCompare,
      closeCompare,
    }),
    [
      compareIds,
      compareDorms,
      isCompareOpen,
      toggleCompare,
      clearCompare,
      openCompare,
      closeCompare,
    ],
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export const useCompare = (): CompareContextType => {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error("useCompare must be used within CompareProvider")
  return ctx
}
