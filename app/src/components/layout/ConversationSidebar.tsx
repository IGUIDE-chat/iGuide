/**
 * @file ./src/components/layout/ConversationSidebar.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import * as React from "react";
// [LAYOUT] Sidebar component displaying chat history and conversation management.
// [布局] 显示对话历史和管理的侧边栏组件。
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TypewriterText } from "../ui/TypewriterText";
import { ConversationSummary } from "../../types";
import { conversationService } from "../../services/conversationService";
import { localConversationService } from "../../services/localConversationService";
import { useAuth } from "../../contexts/AuthContext";

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

  const getTimeCategory = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t.today;
    if (diffDays === 1) return t.yesterday;
    if (diffDays <= 7) return t.thisWeek;
    return t.older;
  };

  const groupedConversations = conversations.reduce(
    (groups, conv) => {
      if (conv.isPinned) {
        if (!groups[t.pinned]) groups[t.pinned] = [];
        groups[t.pinned].push(conv);
      } else {
        const category = getTimeCategory(conv.updatedAt);
        if (!groups[category]) groups[category] = [];
        groups[category].push(conv);
      }
      return groups;
    },
    {} as Record<string, ConversationSummary[]>
  );

  const categoryOrder = [t.pinned, t.today, t.yesterday, t.thisWeek, t.older];

  // Removed early return for !user to allow guest mode
  // if (!user) return null;

  return (
    <>
      <div className="flex h-full min-h-0 flex-col px-3">
        {/* Conversations List */}
        <div className="no-scrollbar flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div
                className="
                  size-5 animate-spin rounded-full border-2 border-illini-orange
                  border-t-transparent
                "
              ></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-2 py-6 text-center">
              <p className="text-xs text-slate-500">{t.noConversations}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categoryOrder.map((category) => {
                const convs = groupedConversations[category];
                if (!convs || convs.length === 0) return null;

                return (
                  <div key={category}>
                    <h4
                      className="
                        mb-1.5 px-2 text-[10px] font-semibold tracking-wider
                        text-slate-500 uppercase
                      "
                    >
                      {category}
                    </h4>
                    <div className="space-y-0.5">
                      <AnimatePresence initial={false}>
                        {convs.map((conv) => (
                          <motion.div
                            key={conv.id}
                            layout
                            initial={{ opacity: 0, x: -20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                              opacity: { duration: 0.2 },
                            }}
                            onClick={() => onSelectConversation(conv.id)}
                            className={`
                              group relative cursor-pointer rounded-lg p-2
                              transition-all
                              ${
                                conv.id === currentConversationId
                                  ? "bg-white/20 text-white"
                                  : `
                                    text-slate-300
                                    hover:bg-white/10
                                  `
                              }
                            `}
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
                                  <TypewriterText text={conv.title} />
                                </div>
                                {conv.messageCount !== undefined &&
                                  conv.messageCount > 0 && (
                                    <p
                                      className="
                                        mt-0.5 text-[10px] text-slate-500
                                      "
                                    >
                                      {conv.messageCount}{" "}
                                      {language === "zh" ? "条" : "msgs"}
                                    </p>
                                  )}
                              </div>

                              <div
                                className={`
                                  absolute inset-y-0 right-0 flex w-24
                                  items-center justify-end gap-0.5
                                  bg-linear-to-l to-transparent px-2 opacity-0
                                  transition-all duration-200
                                  group-hover:opacity-100
                                  ${
                                    conv.id === currentConversationId
                                      ? "from-[#454545] via-[#454545]"
                                      : "from-[#2E2E2E] via-[#2E2E2E]"
                                  }
                                `}
                              >
                                <button
                                  onClick={(e) =>
                                    handleTogglePin(conv.id, conv.isPinned, e)
                                  }
                                  className="
                                    rounded-md p-1 transition-colors
                                    hover:bg-white/10
                                  "
                                  title={conv.isPinned ? t.unpin : t.pin}
                                >
                                  <svg
                                    className={`
                                      size-3.5
                                      ${
                                        conv.isPinned
                                          ? `text-illini-orange`
                                          : `text-slate-400`
                                      }
                                    `}
                                    fill={
                                      conv.isPinned ? "currentColor" : "none"
                                    }
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
                                  onClick={(e) => handleDeleteClick(conv.id, e)}
                                  className="
                                    rounded-md p-1 transition-colors
                                    hover:bg-red-500/20
                                  "
                                  title={t.delete}
                                >
                                  <svg
                                    className="size-3.5 text-red-400"
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
                );
              })}
            </div>
          )}
        </div>
      </div>

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
