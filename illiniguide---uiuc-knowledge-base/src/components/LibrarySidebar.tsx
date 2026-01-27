// [LAYOUT] Sidebar component displaying reading history and pinned articles.
// [布局] 显示阅读历史和置顶文章的侧边栏组件。
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypewriterText } from './TypewriterText';
import { LibraryHistoryItem } from '../types';
import { libraryService } from '../services/libraryService';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface LibrarySidebarProps {
    language: 'en' | 'zh';
    currentArticleId?: string | null;
}

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
    language,
    currentArticleId
}) => {
    const [history, setHistory] = useState<LibraryHistoryItem[]>([]);
    const navigate = useNavigate();

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
            delete: 'Delete'
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
            delete: '删除'
        }
    }[language];

    // Subscribe to reading_history changes for dynamic refresh
    useEffect(() => {
        loadHistory();

        const channel = supabase
            .channel('reading_history_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'reading_history'
                },
                () => {
                    loadHistory();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadHistory = async () => {
        const data = await libraryService.getHistory();
        setHistory(data);
    };

    const handleClearHistory = async () => {
        if (window.confirm(language === 'zh' ? '确定要清空浏览记录吗？' : 'Are you sure you want to clear history?')) {
            await libraryService.clearHistory();
            loadHistory();
        }
    };

    const handleTogglePin = async (id: string, isPinned: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await libraryService.togglePin(id, isPinned);
            loadHistory();
        } catch (err) {
            console.error('Failed to toggle pin:', err);
        }
    };

    const handleDeleteClick = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(language === 'zh' ? '确定要删除这条记录吗？' : 'Are you sure you want to delete this item?')) {
            try {
                await libraryService.removeFromHistory(id);
                loadHistory();
            } catch (err) {
                console.error('Failed to delete item:', err);
            }
        }
    };

    const getTimeCategory = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return t.today;
        if (diffDays <= 1) return t.yesterday;
        if (diffDays <= 7) return t.thisWeek;
        return t.older;
    };

    const groupedHistory = history.reduce((groups, item) => {
        let category;
        if (item.isPinned) {
            category = t.pinned;
        } else {
            category = getTimeCategory(item.viewedAt);
        }

        if (!groups[category]) groups[category] = [];
        groups[category].push(item);
        return groups;
    }, {} as Record<string, LibraryHistoryItem[]>);

    const categoryOrder = [t.pinned, t.today, t.yesterday, t.thisWeek, t.older];

    return (
        <div className="flex flex-col h-full bg-[#171717]">
            <div className="flex items-center justify-between px-3 py-2 mb-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.title}</h3>
                {history.length > 0 && (
                    <button
                        onClick={handleClearHistory}
                        className="text-[10px] text-slate-500 hover:text-white transition-colors"
                    >
                        {t.clear}
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-2 space-y-4">
                {history.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-xs text-slate-600">{t.empty}</p>
                    </div>
                ) : (
                    categoryOrder.map(category => {
                        const items = groupedHistory[category];
                        if (!items || items.length === 0) return null;

                        return (
                            <div key={category}>
                                <h4 className="text-[10px] font-medium text-slate-500 mb-1.5 px-2">
                                    {category}
                                </h4>
                                <div className="space-y-0.5">
                                    <AnimatePresence initial={false}>
                                        {items.map(item => (
                                            <motion.div
                                                key={item.id}
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
                                                onClick={() => navigate(`/library/article/${item.articleId}`)}
                                                className={`px-3 py-2 rounded-md cursor-pointer transition-colors group relative ${item.articleId === currentArticleId
                                                    ? 'bg-white/10 text-white'
                                                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-1.5">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs truncate font-medium flex">
                                                            <TypewriterText
                                                                text={(language === 'zh' && item.articleTitleZh) ? item.articleTitleZh : item.articleTitle}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => handleTogglePin(item.id, item.isPinned, e)}
                                                            className="p-1 hover:bg-illini-orange/20 rounded"
                                                            title={item.isPinned ? t.unpin : t.pin}
                                                        >
                                                            <svg
                                                                className={`w-3 h-3 ${item.isPinned ? 'text-illini-orange' : 'text-slate-400'}`}
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
                                                            className="p-1 hover:bg-red-500/20 rounded"
                                                            title={t.delete}
                                                        >
                                                            <svg
                                                                className="w-3 h-3 text-red-400"
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
                    })
                )}
            </div>
        </div>
    );
};
