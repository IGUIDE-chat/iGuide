import type { Dorm } from "@iguide/dorm"
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react"

import { getAllDorms } from "../../../services/dormApi"
import { useRetainedState } from "./retainedState"

interface DormDataContextType {
  dorms: Dorm[]
  isLoading: boolean
  refreshDorms: () => Promise<void>
  getDormById: (id: string) => Dorm | undefined
}

const DormDataContext = createContext<DormDataContextType | undefined>(undefined)

export const DormDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // null until the first load finishes, so a later visit to /dorms reuses the list instead of refetching.
  const [loadedDorms, setDorms] = useRetainedState<Dorm[] | null>("dorms", null)
  const dorms = useMemo(() => loadedDorms ?? [], [loadedDorms])
  const [isLoading, setIsLoading] = useState(loadedDorms === null)
  const needsInitialLoad = useRef(loadedDorms === null)

  // `getAllDorms` falls back to the bundled dataset itself, so a database
  // failure never leaves this tree without data.
  const loadDorms = useCallback(async () => {
    setIsLoading(true)
    try {
      setDorms(await getAllDorms())
    } finally {
      setIsLoading(false)
    }
  }, [setDorms])

  useEffect(() => {
    if (!needsInitialLoad.current) return
    needsInitialLoad.current = false
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
