/**
 * @file ./src/components/housing/store/HousingDataContext.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { housingService } from "../../../services/housingService"
import { type Dorm } from "../types/index"

interface HousingDataContextType {
  dorms: Dorm[]
  isLoading: boolean
  refreshDorms: () => Promise<void>
  getDormById: (id: string) => Dorm | undefined
}

const HousingDataContext = createContext<HousingDataContextType | undefined>(
  undefined
)

export const HousingDataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [dorms, setDorms] = useState<Dorm[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadDorms = useCallback(async () => {
    setIsLoading(true)
    try {
      const housing = await housingService.getHousing()
      setDorms(housing as unknown as Dorm[])
    } catch (err) {
      console.error(
        "[HousingDataContext] Failed to load from DB, loading static fallback:",
        err
      )
      try {
        const { UIUC_DORMS } = await import("../constants/dormData")
        setDorms(UIUC_DORMS)
      } catch (importErr) {
        console.error(
          "[HousingDataContext] Failed to load static fallback:",
          importErr
        )
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
    [dorms]
  )

  const value = useMemo<HousingDataContextType>(
    () => ({ dorms, isLoading, refreshDorms: loadDorms, getDormById }),
    [dorms, isLoading, loadDorms, getDormById]
  )

  return (
    <HousingDataContext.Provider value={value}>
      {children}
    </HousingDataContext.Provider>
  )
}

export const useDormData = (): HousingDataContextType => {
  const ctx = useContext(HousingDataContext)
  if (!ctx) {
    throw new Error("useDormData must be used within a HousingDataProvider")
  }
  return ctx
}
