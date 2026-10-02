import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react"

import { dormService } from "../../../services/dormService"
import { Dorm } from "../types/index"

interface DormDataContextType {
  dorms: Dorm[]
  isLoading: boolean
  refreshDorms: () => Promise<void>
  getDormById: (id: string) => Dorm | undefined
}

const DormDataContext = createContext<DormDataContextType | undefined>(undefined)

export const DormDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dorms, setDorms] = useState<Dorm[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadDorms = useCallback(async () => {
    setIsLoading(true)
    try {
      const dbDorms = await dormService.getAllDorms()
      setDorms(dbDorms)
    } catch (err) {
      console.error("[DormDataContext] Failed to load from DB, loading static fallback:", err)
      try {
        const { UIUC_DORMS } = await import("../constants/dormData")
        setDorms(UIUC_DORMS)
      } catch (importErr) {
        console.error("[DormDataContext] Failed to load static fallback:", importErr)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDorms()
  }, [loadDorms])

  const getDormById = useCallback(
    (id: string): Dorm | undefined => dorms.find((d) => d.id === id),
    [dorms],
  )

  const value = useMemo<DormDataContextType>(
    () => ({ dorms, isLoading, refreshDorms: loadDorms, getDormById }),
    [dorms, isLoading, loadDorms, getDormById],
  )

  return <DormDataContext.Provider value={value}>{children}</DormDataContext.Provider>
}

export const useDormData = (): DormDataContextType => {
  const ctx = useContext(DormDataContext)
  if (!ctx) {
    throw new Error("useDormData must be used within a DormDataProvider")
  }
  return ctx
}
