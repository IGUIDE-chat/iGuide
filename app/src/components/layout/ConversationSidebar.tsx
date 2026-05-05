/**
 * @file ./src/components/layout/ConversationSidebar.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import * as React from "react";
import { useEffect, useState } from "react";
import { Typewriter } from "../ui/Typewriter";
import { ConversationSummary } from "../../types";
import { conversationService } from "../../services/conversationService";
import { localConversationService } from "../../services/localConversationService";
import { useAuth } from "../../contexts/AuthContext";
import {
  BaseSidebar,
  SidebarItem,
  PinButton,
  DeleteButton,
  SidebarLoadingSpinner,
  SidebarEmptyState,
  groupByCategory,
  getCategoryOrder,
  TimeCategoryLabels,
} from "./BaseSidebar";

interface ConversationSidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string | null) => void;
  onNewConversation: () => void;
  language: "en" | "zh";
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  language,
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const t = {
    en: {
      newChat: "New Chat",
      noConversations: "No conversations yet",
      delete: "Delete",
      pin: "Pin",
      unpin: "Unpin",
      pinned: "Pinned",
      today: "Today",
      yesterday: "Yesterday",
      thisWeek: "This Week",
      older: "Older",
    },
    zh: {
      newChat: "新对话",
      noConversations: "暂无对话记录",
      delete: "删除",
      pin: "置顶",
      unpin: "取消置顶",
      pinned: "置顶对话",
      today: "今天",
      yesterday: "昨天",
      thisWeek: "本周",
      older: "更早",
    },
  }[language];

  const categoryLabels: TimeCategoryLabels = {
    pinned: t.pinned,
    today: t.today,
    yesterday: t.yesterday,
    thisWeek: t.thisWeek,
    older: t.older,
  };

  // ... (keep usage of hooks)

  // ... (keep loadConversations and other handlers)

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      // Use local service if not logged in
      const service = user ? conversationService : localConversationService;
      const { data, error } = await service.getUserConversations();

      if (error) throw error;

      if (data) {
        const summaries: ConversationSummary[] = data.map((conv) => ({
          id: conv.id,
          title: conv.title,
          updatedAt: conv.updated_at,
          isPinned: conv.is_pinned,
          messageCount: conv.messages?.length || 0,
        }));
        setConversations(summaries);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload conversations when user changes OR when a new conversation is created/selected
  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentConversationId]);

  const handleTogglePin = async (
    conversationId: string,
    isPinned: boolean,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    try {
      const service = user ? conversationService : localConversationService;
      const { error } = await service.togglePinConversation(
        conversationId,
        !isPinned
      );
      if (error) throw error;

      // Reload conversations
      loadConversations();
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  const handleDeleteClick = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(conversationId);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;

    try {
      const service = user ? conversationService : localConversationService;
      const { error } = await service.deleteConversation(showDeleteConfirm);
      if (error) throw error;

      if (showDeleteConfirm === currentConversationId) {
        onNewConversation();
      }

      loadConversations();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const groupedConversations = groupByCategory(
    conversations,
    (conv) => conv.updatedAt,
    categoryLabels
  );

  const categoryOrder = getCategoryOrder(categoryLabels);

  return (
    <>
      <BaseSidebar
        className="px-3"
        groupedItems={groupedConversations as Record<string, unknown[]>}
        categoryOrder={categoryOrder}
        isLoading={isLoading}
        loadingState={<SidebarLoadingSpinner />}
        emptyState={<SidebarEmptyState message={t.noConversations} />}
        renderItem={(item) => {
          const conv = item as ConversationSummary;
          return (
            <SidebarItem
              key={conv.id}
              id={conv.id}
              isActive={conv.id === currentConversationId}
              onClick={() => onSelectConversation(conv.id)}
              activeBgClass="bg-white/20 text-white"
              inactiveBgClass="text-slate-300 hover:bg-white/10"
            >
              <div className="relative overflow-hidden">
                <div className="pr-1">
                  <div
                    className={`
                      truncate text-xs font-medium
                      ${
                        conv.id === currentConversationId
                          ? "text-white"
                          : `
                            text-slate-300
                            group-hover:text-white
                          `
                      }
                    `}
                  >
                    <Typewriter text={conv.title} mode="animate" />
                  </div>
                  {conv.messageCount !== undefined && conv.messageCount > 0 && (
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {conv.messageCount} {language === "zh" ? "条" : "msgs"}
                    </p>
                  )}
                </div>

                <div
                  className={`
                    absolute inset-y-0 right-0 flex w-24 items-center
                    justify-end gap-0.5 bg-linear-to-l to-transparent px-2
                    opacity-0 transition-all duration-200
                    group-hover:opacity-100
                    ${
                      conv.id === currentConversationId
                        ? "from-[#454545] via-[#454545]"
                        : "from-[#2E2E2E] via-[#2E2E2E]"
                    }
                  `}
                >
                  <PinButton
                    isPinned={conv.isPinned}
                    onClick={(e) => handleTogglePin(conv.id, conv.isPinned, e)}
                    label={conv.isPinned ? t.unpin : t.pin}
                  />
                  <DeleteButton
                    onClick={(e) => handleDeleteClick(conv.id, e)}
                    label={t.delete}
                  />
                </div>
              </div>
            </SidebarItem>
          );
        }}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="
            fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4
            backdrop-blur-sm
          "
        >
          <div
            className="
              animate-scale-in w-full max-w-sm overflow-hidden rounded-xl border
              border-white/10 bg-[#1E1E1E] shadow-2xl
            "
          >
            <div className="p-5 text-center">
              <div
                className="
                  mx-auto mb-4 flex size-12 items-center justify-center
                  rounded-full bg-red-500/10
                "
              >
                <svg
                  className="size-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {language === "zh" ? "删除对话?" : "Delete Conversation?"}
              </h3>
              <p className="mb-6 text-sm text-slate-400">
                {language === "zh"
                  ? "此操作无法撤销。"
                  : "This action cannot be undone."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="
                    flex-1 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium
                    text-slate-300 transition-colors
                    hover:bg-white/10
                  "
                >
                  {language === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                  onClick={confirmDelete}
                  className="
                    flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium
                    text-white transition-colors
                    hover:bg-red-600
                  "
                >
                  {language === "zh" ? "删除" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
