import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChatMessage } from '../../types/housing';
import { streamChatResponse } from '../../services/cozeService';
import { isDormMention, findMentionedDorms } from '../../utils/housingUtils';
import { TypewriterText } from './TypewriterText';
import { Language } from '../../types';
import { aiChatTexts } from './i18n/dormTexts';

interface AIChatProps {
    language: Language;
}

const AIChat: React.FC<AIChatProps> = ({ language }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const t = aiChatTexts[language];

    useEffect(() => {
        setMessages([
            {
                id: 'welcome',
                role: 'model',
                text: t.initialMessage,
                timestamp: new Date()
            }
        ]);
    }, [t.initialMessage]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: inputText,
            timestamp: new Date()
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const botMessageId = (Date.now() + 1).toString();
            const botMessageBase: ChatMessage = {
                id: botMessageId,
                role: 'model',
                text: '',
                timestamp: new Date()
            };
            setMessages((prev) => [...prev, botMessageBase]);

            const historyForCoze = messages
                .filter((message) => message.id !== 'welcome')
                .map((message) => ({
                    role: message.role,
                    text: message.text
                }));

            const stream = streamChatResponse(historyForCoze, userMessage.text, language);
            let responseText = '';

            for await (const chunk of stream) {
                if (!chunk.text) {
                    continue;
                }

                responseText += chunk.text;
                const currentText = responseText;
                setMessages((prev) =>
                    prev.map((message) =>
                        message.id === botMessageId
                            ? { ...message, text: currentText }
                            : message
                    )
                );
            }

            if (!responseText.trim()) {
                setMessages((prev) =>
                    prev.map((message) =>
                        message.id === botMessageId
                            ? { ...message, text: 'No response received. Please try again.' }
                            : message
                    )
                );
            }
        } catch (error) {
            console.error(error);
            setMessages((prev) => {
                const next = [...prev];
                const latestModelIndex = next
                    .map((message) => message.role)
                    .lastIndexOf('model');

                if (latestModelIndex >= 0 && !next[latestModelIndex].text) {
                    next[latestModelIndex] = {
                        ...next[latestModelIndex],
                        text: 'Connection failed. Please try again.'
                    };
                }

                return next;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 ${isOpen
                    ? 'bg-gray-800 rotate-90 scale-75'
                    : 'bg-gradient-to-r from-illini-orange to-orange-600 hover:scale-110'
                    }`}
            >
                {isOpen ? <X className="text-white" /> : <MessageCircle className="text-white w-8 h-8" />}
            </button>

            <div
                className={`fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden border border-gray-100 transition-all duration-300 origin-bottom-right ${isOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 translate-y-10 pointer-events-none'
                    }`}
                style={{ height: '800px', maxHeight: '85vh' }}
            >
                <div className="bg-illini-blue p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <Sparkles className="text-illini-orange w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">{t.title}</h3>
                            <p className="text-blue-200 text-xs">{t.subtitle}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, index) => {
                            const isRecent = index === messages.length - 1 && msg.role === 'model';
                            const mentionedDorms = msg.role === 'model' ? findMentionedDorms(msg.text) : [];

                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div
                                        className={`rounded-2xl px-5 py-4 text-sm shadow-sm leading-relaxed overflow-hidden ${msg.role === 'user'
                                            ? 'max-w-[85%] bg-illini-blue text-white font-medium rounded-br-none'
                                            : 'w-full bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                            }`}
                                    >
                                        {msg.role === 'model' && isRecent ? (
                                            <TypewriterText text={msg.text} />
                                        ) : msg.role === 'user' ? (
                                            <span className="whitespace-pre-wrap text-white font-medium">{msg.text}</span>
                                        ) : (
                                            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 text-gray-800">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        strong: ({ ...props }) => {
                                                            const content = String(props.children);
                                                            const isDorm = isDormMention(content);
                                                            return (
                                                                <span
                                                                    className={
                                                                        isDorm
                                                                            ? 'font-extrabold text-illini-orange'
                                                                            : 'font-bold text-gray-900'
                                                                    }
                                                                    {...props}
                                                                />
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {msg.text}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>

                                    {msg.role === 'model' && mentionedDorms.length > 0 && (
                                        <div className="mt-3 ml-2 flex flex-col gap-3 w-full">
                                            {mentionedDorms.map((dorm) => (
                                                (() => {
                                                    const dormName =
                                                        language === 'zh' && dorm.name_zh ? dorm.name_zh : dorm.name;
                                                    return (
                                                <button
                                                    key={dorm.id}
                                                    onClick={() => navigate(`/dorms/${dorm.id}`)}
                                                    type="button"
                                                    className="flex items-center gap-3 bg-white border border-gray-100 p-3 rounded-xl shadow-sm hover:shadow-md hover:border-illini-orange/30 transition-all group w-full text-left"
                                                >
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                        <img
                                                            src={dorm.imageUrl}
                                                            alt={dormName}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                    <div className="flex-grow min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-illini-orange transition-colors truncate">
                                                                {dormName}
                                                            </h4>
                                                        </div>
                                                        <div className="flex gap-1 mt-1.5 flex-wrap">
                                                            {dorm.tags.slice(0, 2).map((tag) => (
                                                                <span
                                                                    key={tag}
                                                                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-100"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </button>
                                                    );
                                                })()
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 border border-gray-100 shadow-sm flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-illini-orange animate-spin" />
                                <span className="text-xs text-gray-500">{t.thinking}</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="relative">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t.placeholder}
                            className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-illini-blue/20 focus:border-illini-blue resize-none text-sm"
                            rows={2}
                        />
                        <button
                            onClick={handleSend}
                            type="button"
                            disabled={isLoading || !inputText.trim()}
                            className="absolute right-2 bottom-2 p-2 bg-illini-orange text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AIChat;
