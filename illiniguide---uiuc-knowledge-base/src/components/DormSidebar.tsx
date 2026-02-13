import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Star, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UIUC_DORMS } from '../constants/housing/dormData';
import { useSharedDormInteraction } from '../contexts/DormUserInteractionContext';
import { Language } from '../types';
import { Dorm } from '../types/housing';
import { TypewriterText } from './TypewriterText';

interface DormSidebarProps {
    language: Language;
    currentDormId?: string | null;
}

interface SidebarDormItem {
    id: string;
    name: string;
    nameZh: string;
    imageUrl: string;
}

const DORM_BY_ID = new Map(UIUC_DORMS.map((dorm) => [dorm.id, dorm]));

export const DormSidebar: React.FC<DormSidebarProps> = ({ language, currentDormId }) => {
    const navigate = useNavigate();
    const {
        favorites,
        cloudFavorites,
        recentlyViewed,
        removeFavorite,
        clearFavorites,
        removeFromHistory,
        clearHistory,
        isLoading
    } = useSharedDormInteraction();

    const t = {
        en: {
            favorites: 'Favorites',
            history: 'History',
            clear: 'Clear',
            noFavorites: 'No favorite dorms yet',
            noHistory: 'No viewing history yet',
            clearFavoritesConfirm: 'Clear all dorm favorites?',
            clearHistoryConfirm: 'Clear all dorm history?'
        },
        zh: {
            favorites: '收藏',
            history: '历史记录',
            clear: '清空',
            noFavorites: '暂无收藏宿舍',
            noHistory: '暂无浏览记录',
            clearFavoritesConfirm: '确认清空全部宿舍收藏吗？',
            clearHistoryConfirm: '确认清空全部宿舍浏览记录吗？'
        }
    }[language];

    const favoriteItems = useMemo<SidebarDormItem[]>(() => {
        return favorites
            .map((favoriteId) => {
                const dorm = DORM_BY_ID.get(favoriteId);
                if (dorm) {
                    return {
                        id: dorm.id,
                        name: dorm.name,
                        nameZh: dorm.name_zh ?? '',
                        imageUrl: dorm.imageUrl ?? ''
                    };
                }

                const cloudFavorite = cloudFavorites.find((favorite) => favorite.dorm_id === favoriteId);
                if (!cloudFavorite) return null;

                return {
                    id: cloudFavorite.dorm_id,
                    name: cloudFavorite.dorm_name,
                    nameZh: cloudFavorite.dorm_name_zh ?? '',
                    imageUrl: ''
                };
            })
            .filter((item): item is SidebarDormItem => item !== null);
    }, [favorites, cloudFavorites]);

    const historyItems = useMemo<SidebarDormItem[]>(() => {
        return recentlyViewed.map((dorm: Dorm) => ({
            id: dorm.id,
            name: dorm.name,
            nameZh: dorm.name_zh ?? '',
            imageUrl: dorm.imageUrl ?? ''
        }));
    }, [recentlyViewed]);

    const openDorm = (dormId: string) => {
        navigate(`/dorms/${dormId}`);
    };

    const handleClearFavorites = () => {
        if (window.confirm(t.clearFavoritesConfirm)) {
            void clearFavorites();
        }
    };

    const handleClearHistory = () => {
        if (window.confirm(t.clearHistoryConfirm)) {
            void clearHistory();
        }
    };

    const renderDormList = (
        items: SidebarDormItem[],
        emptyText: string,
        onRemove: (dormId: string) => void
    ) => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-6">
                    <div className="w-4 h-4 border-2 border-illini-orange border-t-transparent rounded-full animate-spin" />
                </div>
            );
        }

        if (items.length === 0) {
            return (
                <div className="px-2 py-3">
                    <p className="text-[11px] text-slate-600">{emptyText}</p>
                </div>
            );
        }

        return (
            <div className="space-y-0.5">
                <AnimatePresence initial={false}>
                    {items.map((item) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, x: -16, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: 'auto' }}
                            exit={{ opacity: 0, x: 12, height: 0 }}
                            transition={{
                                type: 'spring',
                                stiffness: 500,
                                damping: 30,
                                opacity: { duration: 0.2 }
                            }}
                            onClick={() => openDorm(item.id)}
                            className={`group px-2 py-2 rounded-lg cursor-pointer transition-all ${item.id === currentDormId
                                    ? 'bg-white/20 text-white'
                                    : 'hover:bg-white/10 text-slate-300'
                                }`}
                        >
                            <div className="relative overflow-hidden">
                                <div className="pr-7 flex items-center gap-2">
                                    <div className="w-7 h-7 rounded bg-white/10 overflow-hidden flex-shrink-0">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-white/5" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div
                                            className={`text-xs font-medium truncate ${item.id === currentDormId
                                                    ? 'text-white'
                                                    : 'text-slate-300 group-hover:text-white'
                                                }`}
                                        >
                                            <TypewriterText text={language === 'zh' && item.nameZh ? item.nameZh : item.name} />
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute right-0 top-0 bottom-0 flex items-center px-1 bg-gradient-to-l from-[#2E2E2E] to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <button
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onRemove(item.id);
                                        }}
                                        className="p-1 hover:bg-red-500/20 rounded-md transition-colors"
                                        title="Remove"
                                        type="button"
                                    >
                                        <Trash2 size={12} className="text-red-400" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full px-3">
            <div className="pt-2 space-y-4">
                <section>
                    <div className="flex items-center justify-between px-1 mb-1.5">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Star size={12} className="text-illini-orange fill-illini-orange" />
                            <h3 className="text-[10px] font-semibold uppercase tracking-wider">{t.favorites}</h3>
                        </div>
                        {favoriteItems.length > 0 && (
                            <button
                                onClick={handleClearFavorites}
                                className="text-[10px] text-slate-500 hover:text-white transition-colors"
                                type="button"
                            >
                                {t.clear}
                            </button>
                        )}
                    </div>
                    {renderDormList(favoriteItems, t.noFavorites, (dormId: string) => {
                        void removeFavorite(dormId);
                    })}
                </section>

                <section>
                    <div className="flex items-center justify-between px-1 mb-1.5">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Clock size={12} />
                            <h3 className="text-[10px] font-semibold uppercase tracking-wider">{t.history}</h3>
                        </div>
                        {historyItems.length > 0 && (
                            <button
                                onClick={handleClearHistory}
                                className="text-[10px] text-slate-500 hover:text-white transition-colors"
                                type="button"
                            >
                                {t.clear}
                            </button>
                        )}
                    </div>
                    {renderDormList(historyItems, t.noHistory, (dormId: string) => {
                        void removeFromHistory(dormId);
                    })}
                </section>
            </div>
        </div>
    );
};
