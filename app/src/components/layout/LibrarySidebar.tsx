/**
 * @file ./src/components/layout/LibrarySidebar.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useEffect, useState } from "react"
import { Typewriter } from "../ui/Typewriter"
import { type LibraryHistoryItem } from "../../types"
import { libraryService } from "../../services/libraryService"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../services/supabase"
import {
  BaseSidebar,
  DeleteButton,
  PinButton,
  SidebarEmptyState,
  SidebarItem,
  type TimeCategoryLabels,
  getCategoryOrder,
  groupByCategory,
} from "./BaseSidebar"

interface LibrarySidebarProps {
  language: "en" | "zh"
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
      title: "History",
      clear: "Clear",
      pinned: "Pinned",
      today: "Today",
      yesterday: "Yesterday",
      thisWeek: "This Week",
      older: "Older",
      empty: "No history yet",
      pin: "Pin",
      unpin: "Unpin",
      delete: "Delete",
    },
    zh: {
      title: "浏览历史",
      clear: "清空",
      pinned: "置顶",
      today: "今天",
      yesterday: "昨天",
      thisWeek: "本周",
      older: "更早",
      empty: "暂无浏览记录",
      pin: "置顶",
      unpin: "取消置顶",
      delete: "删除",
    },
  }[language]

  const categoryLabels: TimeCategoryLabels = {
    pinned: t.pinned,
    today: t.today,
    yesterday: t.yesterday,
    thisWeek: t.thisWeek,
    older: t.older,
  }

  const loadHistory = async () => {
    const data = await libraryService.getHistory()
    setHistory(data)
  }

  // Subscribe to reading_history changes for dynamic refresh
  useEffect(() => {
    loadHistory()

    const channel = supabase
      .channel("reading_history_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reading_history",
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

  const handleClearHistory = async () => {
    if (
      window.confirm(
        language === "zh"
          ? "确定要清空浏览记录吗？"
          : "Are you sure you want to clear history?"
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
      console.error("Failed to toggle pin:", err)
    }
  }

  const handleDeleteClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (
      window.confirm(
        language === "zh"
          ? "确定要删除这条记录吗？"
          : "Are you sure you want to delete this item?"
      )
    ) {
      try {
        await libraryService.removeFromHistory(id)
        loadHistory()
      } catch (err) {
        console.error("Failed to delete item:", err)
      }
    }
  }

  const groupedHistory = groupByCategory(
    history,
    (item) => item.viewedAt,
    categoryLabels
  )

  const categoryOrder = getCategoryOrder(categoryLabels)

  return (
    <BaseSidebar
      className="bg-[#171717]"
      header={
        <div className="mb-2 flex items-center justify-between px-3 py-2">
          <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            {t.title}
          </h3>
          {history.length > 0 && (
            <button
            type="button"
              onClick={handleClearHistory}
              className="text-[10px] text-slate-500 transition-colors hover:text-white"
            >
              {t.clear}
            </button>
          )}
        </div>
      }
      groupedItems={groupedHistory as Record<string, unknown[]>}
      categoryOrder={categoryOrder}
      emptyState={<SidebarEmptyState message={t.empty} />}
      renderItem={(item) => {
        const historyItem = item as LibraryHistoryItem
        return (
          <SidebarItem
            key={historyItem.id}
            id={historyItem.id}
            isActive={historyItem.articleId === currentArticleId}
            onClick={() =>
              navigate(`/library/article/${historyItem.articleId}`)
            }
            activeBgClass="bg-white/10 text-white"
            inactiveBgClass="text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <div className="flex truncate text-xs font-medium">
                  <Typewriter
                    text={
                      language === "zh" && historyItem.articleTitleZh
                        ? historyItem.articleTitleZh
                        : historyItem.articleTitle
                    }
                    mode="animate"
                  />
                </div>
              </div>
              <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <PinButton
                  isPinned={historyItem.isPinned}
                  onClick={(e) =>
                    handleTogglePin(historyItem.id, historyItem.isPinned, e)
                  }
                  label={historyItem.isPinned ? t.unpin : t.pin}
                />
                <DeleteButton
                  onClick={(e) => handleDeleteClick(historyItem.id, e)}
                  label={t.delete}
                />
              </div>
            </div>
          </SidebarItem>
        )
      }}
    />
  )
}
