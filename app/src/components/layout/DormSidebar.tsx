/**
 * @file ./src/components/layout/DormSidebar.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, Heart, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSharedDormInteraction } from '../housing/store/DormUserInteractionContext'
import { useDormData } from '../housing/store/DormDataContext'
import { Language } from '../../types'
import { Dorm } from '../housing/types/index'
import { TypewriterText } from '../ui/TypewriterText'

interface DormSidebarProps {
  language: Language
  currentDormId?: string | null
  /** Ref for the favorites section heart icon SVG (flying-heart target) */
  favoritesIconRef?: React.RefObject<SVGSVGElement | null>
}

interface SidebarDormItem {
  id: string
  name: string
  nameZh: string
  imageUrl: string
}

export const DormSidebar: React.FC<DormSidebarProps> = ({
  language,
  currentDormId,
  favoritesIconRef,
}) => {
  const navigate = useNavigate()
  const { dorms } = useDormData()
  const dormById = useMemo(
    () => new Map(dorms.map((dorm) => [dorm.id, dorm])),
    [dorms]
  )
  const {
    favorites,
    cloudFavorites,
    recentlyViewed,
    removeFavorite,
    clearFavorites,
    removeFromHistory,
    clearHistory,
    isLoading,
  } = useSharedDormInteraction()

  const t = {
    en: {
      favorites: 'Favorites',
      history: 'History',
      clear: 'Clear',
      noFavorites: 'No favorite dorms yet',
      noHistory: 'No viewing history yet',
      clearFavoritesConfirm: 'Clear all dorm favorites?',
      clearHistoryConfirm: 'Clear all dorm history?',
    },
    zh: {
      favorites: '收藏',
      history: '历史记录',
      clear: '清空',
      noFavorites: '暂无收藏宿舍',
      noHistory: '暂无浏览记录',
      clearFavoritesConfirm: '确认清空全部宿舍收藏吗？',
      clearHistoryConfirm: '确认清空全部宿舍浏览记录吗？',
    },
  }[language]

  const favoriteItems = useMemo<SidebarDormItem[]>(() => {
    return favorites
      .map((favoriteId) => {
        const dorm = dormById.get(favoriteId)
        if (dorm) {
          return {
            id: dorm.id,
            name: dorm.name,
            nameZh: dorm.name_zh ?? '',
            imageUrl: dorm.imageUrl ?? '',
          }
        }

        const cloudFavorite = cloudFavorites.find(
          (favorite) => favorite.dorm_id === favoriteId
        )
        if (!cloudFavorite) return null

        return {
          id: cloudFavorite.dorm_id,
          name: cloudFavorite.dorm_name,
          nameZh: cloudFavorite.dorm_name_zh ?? '',
          imageUrl: '',
        }
      })
      .filter((item): item is SidebarDormItem => item !== null)
  }, [favorites, cloudFavorites, dormById])

  const historyItems = useMemo<SidebarDormItem[]>(() => {
    return recentlyViewed.map((dorm: Dorm) => ({
      id: dorm.id,
      name: dorm.name,
      nameZh: dorm.name_zh ?? '',
      imageUrl: dorm.imageUrl ?? '',
    }))
  }, [recentlyViewed])

  const openDorm = (dormId: string) => {
    navigate(`/dorms/${dormId}`)
  }

  const handleClearFavorites = () => {
    if (window.confirm(t.clearFavoritesConfirm)) {
      void clearFavorites()
    }
  }

  const handleClearHistory = () => {
    if (window.confirm(t.clearHistoryConfirm)) {
      void clearHistory()
    }
  }

  const renderDormList = (
    items: SidebarDormItem[],
    emptyText: string,
    onRemove: (dormId: string) => void
  ) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-6">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-illini-orange border-t-transparent" />
        </div>
      )
    }

    if (items.length === 0) {
      return (
        <div className="px-2 py-3">
          <p className="text-[11px] text-slate-600">{emptyText}</p>
        </div>
      )
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
                opacity: { duration: 0.2 },
              }}
              onClick={() => openDorm(item.id)}
              className={`group cursor-pointer rounded-lg px-2 py-2 transition-all ${
                item.id === currentDormId
                  ? 'bg-white/20 text-white'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className="relative overflow-hidden">
                <div className="flex items-center gap-2 pr-7">
                  <div className="h-7 w-7 flex-shrink-0 overflow-hidden rounded bg-white/10">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-white/5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-xs font-medium ${
                        item.id === currentDormId
                          ? 'text-white'
                          : 'text-slate-300 group-hover:text-white'
                      }`}
                    >
                      <TypewriterText
                        text={
                          language === 'zh' && item.nameZh
                            ? item.nameZh
                            : item.name
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 right-0 top-0 flex items-center bg-gradient-to-l from-[#2E2E2E] to-transparent px-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      onRemove(item.id)
                    }}
                    className="rounded-md p-1 transition-colors hover:bg-red-500/20"
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
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-3">
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto pt-2">
        <section>
          <div className="mb-1.5 flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Heart
                ref={favoritesIconRef}
                size={12}
                className="shrink-0 fill-red-500 text-red-500"
              />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider">
                {t.favorites}
              </h3>
            </div>
            {favoriteItems.length > 0 && (
              <button
                onClick={handleClearFavorites}
                className="text-[10px] text-slate-500 transition-colors hover:text-white"
                type="button"
              >
                {t.clear}
              </button>
            )}
          </div>
          {renderDormList(favoriteItems, t.noFavorites, (dormId: string) => {
            void removeFavorite(dormId)
          })}
        </section>

        <section>
          <div className="mb-1.5 flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock size={12} />
              <h3 className="text-[10px] font-semibold uppercase tracking-wider">
                {t.history}
              </h3>
            </div>
            {historyItems.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-[10px] text-slate-500 transition-colors hover:text-white"
                type="button"
              >
                {t.clear}
              </button>
            )}
          </div>
          {renderDormList(historyItems, t.noHistory, (dormId: string) => {
            void removeFromHistory(dormId)
          })}
        </section>
      </div>
    </div>
  )
}
