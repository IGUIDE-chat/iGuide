/**
 * @file ./src/components/layout/LibrarySidebar.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [LAYOUT] Sidebar component displaying reading history and pinned articles.
// [布局] 显示阅读历史和置顶文章的侧边栏组件。
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TypewriterText } from '../ui/TypewriterText'
import { LibraryHistoryItem } from '../../types'
import { libraryService } from '../../services/libraryService'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'

interface LibrarySidebarProps {
  language: 'en' | 'zh'
  currentArticleId?: string | null
}

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
  language,
  currentArticleId,
}) => {
  const [history, setHistory] = useState<LibraryHistoryItem[]>([])
  const navigate = useNavigate()

  const t = {
    en: {
      title: 'History',
      clear: 'Clear',
      pinned: 'Pinned',
      today: 'Today',
      yesterday: 'Yesterday',
      thisWeek: 'This Week',
      older: 'Older',
      empty: 'No history yet',
      pin: 'Pin',
      unpin: 'Unpin',
      delete: 'Delete',
    },
    zh: {
      title: '浏览历史',
      clear: '清空',
      pinned: '置顶',
      today: '今天',
      yesterday: '昨天',
      thisWeek: '本周',
      older: '更早',
      empty: '暂无浏览记录',
      pin: '置顶',
      unpin: '取消置顶',
      delete: '删除',
    },
  }[language]

  // Subscribe to reading_history changes for dynamic refresh
  useEffect(() => {
    loadHistory()

    const channel = supabase
      .channel('reading_history_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reading_history',
        },
        () => {
          loadHistory()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadHistory = async () => {
    const data = await libraryService.getHistory()
    setHistory(data)
  }

  const handleClearHistory = async () => {
    if (
      window.confirm(
        language === 'zh'
          ? '确定要清空浏览记录吗？'
          : 'Are you sure you want to clear history?'
      )
    ) {
      await libraryService.clearHistory()
      loadHistory()
    }
  }

  const handleTogglePin = async (
    id: string,
    isPinned: boolean,
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    try {
      await libraryService.togglePin(id, isPinned)
      loadHistory()
    } catch (err) {
      console.error('Failed to toggle pin:', err)
    }
  }

  const handleDeleteClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (
      window.confirm(
        language === 'zh'
          ? '确定要删除这条记录吗？'
          : 'Are you sure you want to delete this item?'
      )
    ) {
      try {
        await libraryService.removeFromHistory(id)
        loadHistory()
      } catch (err) {
        console.error('Failed to delete item:', err)
      }
    }
  }

  const getTimeCategory = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return t.today
    if (diffDays <= 1) return t.yesterday
    if (diffDays <= 7) return t.thisWeek
    return t.older
  }

  const groupedHistory = history.reduce(
    (groups, item) => {
      let category
      if (item.isPinned) {
        category = t.pinned
      } else {
        category = getTimeCategory(item.viewedAt)
      }

      if (!groups[category]) groups[category] = []
      groups[category].push(item)
      return groups
    },
    {} as Record<string, LibraryHistoryItem[]>
  )

  const categoryOrder = [t.pinned, t.today, t.yesterday, t.thisWeek, t.older]

  return (
    <div className="flex h-full flex-col bg-[#171717]">
      <div className="mb-2 px-3 py-2 flex items-center justify-between">
        <h3 className="
          text-xs font-semibold tracking-wider text-slate-400 uppercase
        ">
          {t.title}
        </h3>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="
              text-slate-500
              hover:text-white
              text-[10px] transition-colors
            "
          >
            {t.clear}
          </button>
        )}
      </div>

      <div className="no-scrollbar space-y-4 px-2 flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-slate-600">{t.empty}</p>
          </div>
        ) : (
          categoryOrder.map((category) => {
            const items = groupedHistory[category]
            if (!items || items.length === 0) return null

            return (
              <div key={category}>
                <h4 className="
                  mb-1.5 px-2 font-medium text-slate-500 text-[10px]
                ">
                  {category}
                </h4>
                <div className="space-y-0.5">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 30,
                          opacity: { duration: 0.2 },
                        }}
                        onClick={() =>
                          navigate(`/library/article/${item.articleId}`)
                        }
                        className={`
                          group rounded-md px-3 py-2 relative cursor-pointer
                          transition-colors
                          ${
                          item.articleId === currentArticleId
                            ? 'bg-white/10 text-white'
                            : `
                              text-slate-300
                              hover:bg-white/5 hover:text-white
                            `
                        }
                        `}
                      >
                        <div className="
                          gap-1.5 flex items-start justify-between
                        ">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium flex truncate">
                              <TypewriterText
                                text={
                                  language === 'zh' && item.articleTitleZh
                                    ? item.articleTitleZh
                                    : item.articleTitle
                                }
                              />
                            </div>
                          </div>
                          <div className="
                            gap-0.5 flex opacity-0 transition-opacity
                            group-hover:opacity-100
                          ">
                            <button
                              onClick={(e) =>
                                handleTogglePin(item.id, item.isPinned, e)
                              }
                              className="
                                rounded-sm p-1
                                hover:bg-illini-orange/20
                              "
                              title={item.isPinned ? t.unpin : t.pin}
                            >
                              <svg
                                className={`
                                  h-3 w-3
                                  ${item.isPinned ? `text-illini-orange` : `
                                    text-slate-400
                                  `}
                                `}
                                fill={item.isPinned ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(item.id, e)}
                              className="
                                rounded-sm p-1
                                hover:bg-red-500/20
                              "
                              title={t.delete}
                            >
                              <svg
                                className="h-3 w-3 text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
