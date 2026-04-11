/**
 * @file ./src/components/housing/store/DormDataContext.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [CONTEXT] Provides dorm data from Supabase with static fallback.
// Static data is lazy-loaded via dynamic import to avoid bloating the initial bundle.
// DB data replaces it once loaded.
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Dorm } from "../types/index";
import { dormService } from "../../../services/dormService";

interface DormDataContextType {
  dorms: Dorm[];
  isLoading: boolean;
  refreshDorms: () => Promise<void>;
  getDormById: (id: string) => Dorm | undefined;
}

const DormDataContext = createContext<DormDataContextType | undefined>(
  undefined
);

export const DormDataProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDorms = useCallback(async () => {
    setIsLoading(true);
    try {
      const dbDorms = await dormService.getAllDorms();
      setDorms(dbDorms);
    } catch (err) {
      console.error(
        "[DormDataContext] Failed to load from DB, loading static fallback:",
        err
      );
      // Lazy-load static data only as a fallback
      try {
        const { UIUC_DORMS } = await import("../constants/dormData");
        setDorms(UIUC_DORMS);
      } catch (importErr) {
        console.error(
          "[DormDataContext] Failed to load static fallback:",
          importErr
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDorms();
  }, [loadDorms]);

  const getDormById = useCallback(
    (id: string): Dorm | undefined => dorms.find((d) => d.id === id),
    [dorms]
  );

  const value = useMemo<DormDataContextType>(
    () => ({ dorms, isLoading, refreshDorms: loadDorms, getDormById }),
    [dorms, isLoading, loadDorms, getDormById]
  );

  return (
    <DormDataContext.Provider value={value}>
      {children}
    </DormDataContext.Provider>
  );
};

/* eslint-disable react-refresh/only-export-components */
export const useDormData = (): DormDataContextType => {
  const ctx = useContext(DormDataContext);
  if (!ctx) {
    throw new Error("useDormData must be used within a DormDataProvider");
  }
  return ctx;
};
