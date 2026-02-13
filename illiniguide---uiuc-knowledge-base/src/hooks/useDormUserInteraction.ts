import { useState, useEffect, useCallback } from 'react';
import { Dorm } from '../types/housing';
import { UIUC_DORMS } from '../constants/housing';
import { dormViewingService } from '../services/dormViewingService';
import { dormFavoritesService, type DormFavorite } from '../services/dormFavoritesService';
import { useAuth } from '../contexts/AuthContext';

const FAVORITES_KEY = 'uiuc-dorm-favorites';
const HISTORY_KEY = 'uiuc-dorm-history';
const MAX_HISTORY_ITEMS = 10;
const DORM_BY_ID = new Map(UIUC_DORMS.map(dorm => [dorm.id, dorm]));

/**
 * Enhanced hook for dorm user interactions with Supabase + localStorage fallback
 */
export const useDormUserInteraction = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Favorites State - Initialize from localStorage
    const [localFavorites, setLocalFavorites] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(FAVORITES_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading favorites:', error);
            return [];
        }
    });

    // Cloud favorites state
    const [cloudFavorites, setCloudFavorites] = useState<DormFavorite[]>([]);
    const [favoriteStatusMap, setFavoriteStatusMap] = useState<Record<string, boolean>>({});

    // History State
    const [recentlyViewed, setRecentlyViewed] = useState<Dorm[]>(() => {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    });

    // Persist local favorites
    useEffect(() => {
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(localFavorites));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }, [localFavorites]);

    // Persist local history
    useEffect(() => {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(recentlyViewed));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }, [recentlyViewed]);

    // Load cloud data when user is authenticated
    const loadCloudData = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const [favoritesData, historyData] = await Promise.all([
                dormFavoritesService.getFavorites(),
                dormViewingService.getHistory(MAX_HISTORY_ITEMS)
            ]);

            setCloudFavorites(favoritesData);

            const historyDorms: Dorm[] = historyData
                .map(item => DORM_BY_ID.get(item.dorm_id))
                .filter((dorm): dorm is Dorm => Boolean(dorm));
            setRecentlyViewed(historyDorms);

            const statusMap: Record<string, boolean> = {};
            favoritesData.forEach(favorite => {
                statusMap[favorite.dorm_id] = true;
            });
            setFavoriteStatusMap(statusMap);
        } catch (error) {
            console.error('Failed to load cloud data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            void loadCloudData();
        } else {
            setCloudFavorites([]);
            setFavoriteStatusMap({});
            setIsLoading(false);
        }
    }, [user, loadCloudData]);

    // Toggle Favorite - uses cloud if authenticated, local otherwise
    const toggleFavorite = useCallback(async (dormId: string, dormName: string, dormNameZh?: string) => {
        if (user) {
            const isCurrentlyFavorite = favoriteStatusMap[dormId] || false;

            // Optimistic UI update
            setFavoriteStatusMap(prev => ({ ...prev, [dormId]: !isCurrentlyFavorite }));
            setCloudFavorites(prev => {
                if (isCurrentlyFavorite) {
                    return prev.filter(favorite => favorite.dorm_id !== dormId);
                }
                const optimisticFavorite: DormFavorite = {
                    id: `optimistic-${dormId}`,
                    user_id: user.id,
                    dorm_id: dormId,
                    dorm_name: dormName,
                    dorm_name_zh: dormNameZh,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                return [optimisticFavorite, ...prev.filter(favorite => favorite.dorm_id !== dormId)];
            });

            try {
                const result = await dormFavoritesService.toggleFavorite(dormId, dormName, dormNameZh);

                if (result.added && result.favorite) {
                    setCloudFavorites(prev => [
                        result.favorite!,
                        ...prev.filter(favorite => favorite.dorm_id !== dormId)
                    ]);
                    setFavoriteStatusMap(prev => ({ ...prev, [dormId]: true }));
                } else {
                    setCloudFavorites(prev => prev.filter(favorite => favorite.dorm_id !== dormId));
                    setFavoriteStatusMap(prev => ({ ...prev, [dormId]: false }));
                }

                return result.added;
            } catch (error) {
                console.error('Failed to toggle cloud favorite:', error);
                await loadCloudData();
                throw error;
            }
        } else {
            // Use local storage
            setLocalFavorites(prev => {
                if (prev.includes(dormId)) {
                    return prev.filter(id => id !== dormId);
                } else {
                    return [...prev, dormId];
                }
            });
            return !localFavorites.includes(dormId);
        }
    }, [user, localFavorites, favoriteStatusMap, loadCloudData]);

    const removeFavorite = useCallback(async (dormId: string) => {
        if (user) {
            setCloudFavorites(prev => prev.filter(favorite => favorite.dorm_id !== dormId));
            setFavoriteStatusMap(prev => ({ ...prev, [dormId]: false }));

            try {
                await dormFavoritesService.removeFavoriteByDormId(dormId);
            } catch (error) {
                console.error('Failed to remove cloud favorite:', error);
                await loadCloudData();
            }
            return;
        }

        setLocalFavorites(prev => prev.filter(id => id !== dormId));
    }, [user, loadCloudData]);

    const clearFavorites = useCallback(async () => {
        if (user) {
            setCloudFavorites([]);
            setFavoriteStatusMap({});

            try {
                await dormFavoritesService.clearFavorites();
            } catch (error) {
                console.error('Failed to clear cloud favorites:', error);
                await loadCloudData();
            }
            return;
        }

        setLocalFavorites([]);
        localStorage.removeItem(FAVORITES_KEY);
    }, [user, loadCloudData]);

    // Check if dorm is favorited
    const isFavorite = useCallback((dormId: string): boolean => {
        if (user) {
            return favoriteStatusMap[dormId] || false;
        } else {
            return localFavorites.includes(dormId);
        }
    }, [user, localFavorites, favoriteStatusMap]);

    // Add to History - uses cloud if authenticated, local otherwise
    const addToHistory = useCallback(async (dorm: Dorm) => {
        // Always update local state for immediate UI feedback
        setRecentlyViewed(prev => {
            const filtered = prev.filter(item => item.id !== dorm.id);
            return [dorm, ...filtered].slice(0, MAX_HISTORY_ITEMS);
        });

        if (user) {
            try {
                await dormViewingService.addToHistory(dorm.id, dorm.name, dorm.name_zh);
            } catch (error) {
                console.error('Failed to add cloud history:', error);
            }
        }
    }, [user]);

    const removeFromHistory = useCallback(async (dormId: string) => {
        setRecentlyViewed(prev => prev.filter(dorm => dorm.id !== dormId));

        if (user) {
            try {
                await dormViewingService.removeFromHistoryByDormId(dormId);
            } catch (error) {
                console.error('Failed to remove cloud history item:', error);
                await loadCloudData();
            }
        }
    }, [user, loadCloudData]);

    // Clear History
    const clearHistory = useCallback(async () => {
        if (user) {
            try {
                await dormViewingService.clearHistory();
            } catch (error) {
                console.error('Failed to clear cloud history:', error);
            }
        }

        setRecentlyViewed([]);
        localStorage.removeItem(HISTORY_KEY);
    }, [user]);

    return {
        favorites: user ? cloudFavorites.map(f => f.dorm_id) : localFavorites,
        toggleFavorite,
        removeFavorite,
        clearFavorites,
        recentlyViewed,
        addToHistory,
        removeFromHistory,
        clearHistory,
        isFavorite,
        cloudFavorites,
        isLoading,
        // For direct access to cloud favorites data
        refreshCloudData: user ? loadCloudData : undefined
    };
};
