import * as React from 'react';
// [LAYOUT] Sidebar component displaying chat history and conversation management.
// [布局] 显示对话历史和管理的侧边栏组件。
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypewriterText } from './TypewriterText';
import { ConversationSummary } from '../types';
import { conversationService } from '../services/conversationService';
import { localConversationService } from '../services/localConversationService';
import { useAuth } from '../contexts/AuthContext';

interface ConversationSidebarProps {
    currentConversationId: string | null;
    onSelectConversation: (conversationId: string | null) => void;
    onNewConversation: () => void;
    language: 'en' | 'zh';
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
    currentConversationId,
    onSelectConversation,
    onNewConversation,
    language
}) => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const t = {
        en: {
            newChat: 'New Chat',
            noConversations: 'No conversations yet',
            delete: 'Delete',
            pin: 'Pin',
            unpin: 'Unpin',
            pinned: 'Pinned',
            today: 'Today',
            yesterday: 'Yesterday',
            thisWeek: 'This Week',
            older: 'Older'
        },
        zh: {
            newChat: '新对话',
            noConversations: '暂无对话记录',
            delete: '删除',
            pin: '置顶',
            unpin: '取消置顶',
            pinned: '置顶对话',
            today: '今天',
            yesterday: '昨天',
            thisWeek: '本周',
            older: '更早'
        }
    }[language];

    // ... (keep usage of hooks)

    // Reload conversations when user changes OR when a new conversation is created/selected
    useEffect(() => {
        loadConversations();
    }, [user, currentConversationId]);

    // ... (keep loadConversations and other handlers)

    const loadConversations = async () => {
        setIsLoading(true);
        try {
            // Use local service if not logged in
            const service = user ? conversationService : localConversationService;
            const { data, error } = await service.getUserConversations();

            if (error) throw error;

            if (data) {
                const summaries: ConversationSummary[] = data.map(conv => ({
                    id: conv.id,
                    title: conv.title,
                    updatedAt: conv.updated_at,
                    isPinned: conv.is_pinned,
                    messageCount: conv.messages?.length || 0
                }));
                setConversations(summaries);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTogglePin = async (conversationId: string, isPinned: boolean, e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            const service = user ? conversationService : localConversationService;
            const { error } = await service.togglePinConversation(conversationId, !isPinned);
            if (error) throw error;

            // Reload conversations
            loadConversations();
        } catch (error) {
            console.error('Failed to toggle pin:', error);
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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
            console.error('Failed to delete conversation:', error);
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

    const groupedConversations = conversations.reduce((groups, conv) => {
        if (conv.isPinned) {
            if (!groups[t.pinned]) groups[t.pinned] = [];
            groups[t.pinned].push(conv);
        } else {
            const category = getTimeCategory(conv.updatedAt);
            if (!groups[category]) groups[category] = [];
            groups[category].push(conv);
        }
        return groups;
    }, {} as Record<string, ConversationSummary[]>);

    const categoryOrder = [t.pinned, t.today, t.yesterday, t.thisWeek, t.older];

    // Removed early return for !user to allow guest mode
    // if (!user) return null;

    return (
        <>
            <div className="flex flex-col h-full px-3">
                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-5 h-5 border-2 border-illini-orange border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-6 px-2">
                            <p className="text-xs text-slate-500">{t.noConversations}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {categoryOrder.map(category => {
                                const convs = groupedConversations[category];
                                if (!convs || convs.length === 0) return null;

                                return (
                                    <div key={category}>
                                        <h4 className="text-[10px] font-semibold text-slate-500 px-2 mb-1.5 uppercase tracking-wider">
                                            {category}
                                        </h4>
                                        <div className="space-y-0.5">


                                            <AnimatePresence initial={false}>
                                                {convs.map(conv => (
                                                    <motion.div
                                                        key={conv.id}
                                                        layout
                                                        initial={{ opacity: 0, x: -20, height: 0 }}
                                                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 500,
                                                            damping: 30,
                                                            opacity: { duration: 0.2 }
                                                        }}
                                                        onClick={() => onSelectConversation(conv.id)}
                                                        className={`group relative px-2 py-2 rounded-lg cursor-pointer transition-all ${conv.id === currentConversationId
                                                            ? 'bg-white/20 text-white'
                                                            : 'hover:bg-white/10 text-slate-300'
                                                            }`}
                                                    >
                                                        <div className="relative overflow-hidden">
                                                            <div className="pr-1">
                                                                <div className={`text-xs font-medium truncate ${conv.id === currentConversationId
                                                                    ? 'text-white'
                                                                    : 'text-slate-300 group-hover:text-white'
                                                                    }`}>
                                                                    <TypewriterText text={conv.title} />
                                                                </div>
                                                                {conv.messageCount !== undefined && conv.messageCount > 0 && (
                                                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                                                        {conv.messageCount} {language === 'zh' ? '条' : 'msgs'}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className={`absolute right-0 top-0 bottom-0 w-24 flex items-center justify-end px-2 gap-0.5 bg-gradient-to-l to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 ${conv.id === currentConversationId
                                                                ? 'from-[#454545] via-[#454545]'
                                                                : 'from-[#2E2E2E] via-[#2E2E2E]'
                                                                }`}>
                                                                <button
                                                                    onClick={(e) => handleTogglePin(conv.id, conv.isPinned, e)}
                                                                    className="p-1 hover:bg-white/10 rounded-md transition-colors"
                                                                    title={conv.isPinned ? t.unpin : t.pin}
                                                                >
                                                                    <svg
                                                                        className={`w-3.5 h-3.5 ${conv.isPinned ? 'text-illini-orange' : 'text-slate-400'}`}
                                                                        fill={conv.isPinned ? 'currentColor' : 'none'}
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
                                                                    className="p-1 hover:bg-red-500/20 rounded-md transition-colors"
                                                                    title={t.delete}
                                                                >
                                                                    <svg
                                                                        className="w-3.5 h-3.5 text-red-400"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[#1E1E1E] border border-white/10 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                        <div className="p-5 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                {language === 'zh' ? '删除对话?' : 'Delete Conversation?'}
                            </h3>
                            <p className="text-slate-400 text-sm mb-6">
                                {language === 'zh'
                                    ? '此操作无法撤销。'
                                    : 'This action cannot be undone.'}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-colors"
                                >
                                    {language === 'zh' ? '取消' : 'Cancel'}
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                                >
                                    {language === 'zh' ? '删除' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
