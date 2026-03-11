/**
 * @file ./src/components/housing/store/DormUserInteractionContext.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useDormUserInteraction } from '../hooks/useDormUserInteraction';
import { Dorm } from '../types/index';
import { DormFavorite } from '../../../services/dormFavoritesService';

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
