import React, { createContext, useContext, ReactNode } from 'react';
import { useDormUserInteraction } from '../hooks/useDormUserInteraction';
import { Dorm } from '../types/housing';
import { DormFavorite } from '../services/dormFavoritesService';

interface DormUserInteractionContextType {
    favorites: string[];
    toggleFavorite: (dormId: string, dormName: string, dormNameZh?: string) => Promise<boolean>;
    removeFavorite: (dormId: string) => Promise<void>;
    clearFavorites: () => Promise<void>;
    recentlyViewed: Dorm[];
    addToHistory: (dorm: Dorm) => Promise<void>;
    removeFromHistory: (dormId: string) => Promise<void>;
    clearHistory: () => Promise<void>;
    isFavorite: (dormId: string) => boolean;
    cloudFavorites: DormFavorite[];
    isLoading: boolean;
    refreshCloudData: (() => Promise<void>) | undefined;
}

const DormUserInteractionContext = createContext<DormUserInteractionContextType | null>(null);

export const DormUserInteractionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const value = useDormUserInteraction();
    return (
        <DormUserInteractionContext.Provider value={value}>
            {children}
        </DormUserInteractionContext.Provider>
    );
};

export const useSharedDormInteraction = (): DormUserInteractionContextType => {
    const ctx = useContext(DormUserInteractionContext);
    if (!ctx) {
        throw new Error('useSharedDormInteraction must be used within DormUserInteractionProvider');
    }
    return ctx;
};
