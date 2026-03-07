// [CONTEXT] Provides dorm data from Supabase with static fallback.
// Static data (UIUC_DORMS) is used as the initial value for instant rendering.
// DB data replaces it once loaded.
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Dorm } from '../types/housing';
import { UIUC_DORMS } from '../constants/housing/dormData';
import { dormService } from '../services/dormService';

interface DormDataContextType {
    dorms: Dorm[];
    isLoading: boolean;
    refreshDorms: () => Promise<void>;
    getDormById: (id: string) => Dorm | undefined;
}

const DormDataContext = createContext<DormDataContextType | undefined>(undefined);

export const DormDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [dorms, setDorms] = useState<Dorm[]>(UIUC_DORMS);
    const [isLoading, setIsLoading] = useState(true);

    const loadDorms = useCallback(async () => {
        setIsLoading(true);
        try {
            const dbDorms = await dormService.getAllDorms();
            setDorms(dbDorms);
        } catch (err) {
            console.error('[DormDataContext] Failed to load dorms:', err);
            // Keep existing data (static fallback already set)
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

export const useDormData = (): DormDataContextType => {
    const ctx = useContext(DormDataContext);
    if (!ctx) {
        throw new Error('useDormData must be used within a DormDataProvider');
    }
    return ctx;
};
