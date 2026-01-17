import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { TypewriterMarkdown } from './TypewriterMarkdown';
import { Language, ChatMessage } from '../types';
import { streamChatResponse } from '../services/cozeService';
import { UI_TEXT } from '../constants';
import { conversationService } from '../services/conversationService';
import { localConversationService } from '../services/localConversationService';
import { useAuth } from '../contexts/AuthContext';

interface ChatScreenProps {
   onNavigateToLibrary: () => void;
   language: Language;
   currentConversationId: string | null;
   onConversationCreated?: (conversationId: string) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
   language,
   currentConversationId,
   onConversationCreated
}) => {

   // Generate smart conversation title
   const generateSmartTitle = (text: string): string => {
      // Remove common prefixes
      let title = text
         .replace(/^(请|帮我|帮忙|能否|可以|how to|please|help me)/i, '')
         .trim();

      // Extract key information
      if (title.includes('?') || title.includes('？')) {
         // It's a question, take the core part
         title = title.split(/[?？]/)[0].trim();
      }

      // Limit length
      if (title.length > 30) {
         title = title.substring(0, 27) + '...';
      }

      return title || '新对话';
   };


   const t = UI_TEXT[language];
   const { user } = useAuth();
   const [messages, setMessages] = useState<ChatMessage[]>([]);
   const [input, setInput] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [isLoadingHistory, setIsLoadingHistory] = useState(false);
   const messagesEndRef = useRef<HTMLDivElement>(null);

   // Load conversation history when currentConversationId changes
   // BUT skip if we're in the middle of streaming (to avoid overwriting live data)
   useEffect(() => {
      if (isLoading) {
         // Skip loading if we're actively streaming - the messages are already in state
         console.log('[ChatScreen] Skipping loadConversation - streaming in progress');
         return;
      }
      if (currentConversationId) {
         // Safety Check: If logged in, ONLY allow valid UUIDs
         // This prevents race conditions where legacy/guest IDs persist for one render cycle after login
         if (user) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(currentConversationId)) {
               console.warn('[ChatScreen] Skipping load of invalid/legacy ID for logged-in user:', currentConversationId);
               return;
            }
         }
         loadConversation(currentConversationId);
      } else {
         setMessages([]);
      }
   }, [currentConversationId, isLoading]);

   const loadConversation = async (conversationId: string) => {
      setIsLoadingHistory(true);
      try {
         const service = user ? conversationService : localConversationService;
         const { data, error } = await service.getConversation(conversationId);
         if (error) throw error;

         if (data && data.messages) {
            const chatMessages = conversationService.convertToChatMessages(data.messages);
            setMessages(chatMessages);
         }
      } catch (error) {
         console.error('Failed to load conversation:', error);
      } finally {
         setIsLoadingHistory(false);
      }
   };

   // Shared function to send a message (used by form submit and suggestion clicks)
   const sendMessage = async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: text };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      // Create conversation if needed (supports both logged-in and guest users)
      let conversationId = currentConversationId;
      if (!conversationId) {
         try {
            const service = user ? conversationService : localConversationService;
            const { data, error } = await service.createConversation(
               undefined,
               generateSmartTitle(text) // Use smart title
            );
            if (error) throw error;
            if (data) {
               conversationId = data.id;
               onConversationCreated?.(data.id);
            }
         } catch (error) {
            console.error('Failed to create conversation:', error);
         }
      }

      // Save user message if we have a conversation
      if (conversationId) {
         try {
            const service = user ? conversationService : localConversationService;
            await service.saveMessage(conversationId, userMsg);
         } catch (error) {
            console.error('Failed to save user message:', error);
         }
      }

      try {
         const aiMsgId = (Date.now() + 1).toString();
         setMessages(prev => [...prev, { id: aiMsgId, role: 'model', text: '', isStreaming: true }]);

         // Call the Coze-powered service
         const stream = await streamChatResponse(
            messages.map(m => ({ role: m.role, text: m.text })),
            userMsg.text,
            language,
            conversationId || undefined, // Pass conversation ID for memory/history
            user?.id                     // Pass Supabase User ID (undefined if guest)
         );

         let fullText = '';
         let followUpQuestions: string[] | undefined;
         let lastUpdateTime = Date.now();
         const UPDATE_INTERVAL = 50; // Update every 50ms for smooth effect

         for await (const chunk of stream) {
            if (chunk.text) {
               fullText += chunk.text;
               const now = Date.now();

               // Throttle updates for smoother visual effect
               if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                  setMessages(prev => prev.map(msg =>
                     msg.id === aiMsgId ? { ...msg, text: fullText } : msg
                  ));
                  lastUpdateTime = now;
               }
            }
            if (chunk.followUpQuestions) {
               followUpQuestions = chunk.followUpQuestions;
               setMessages(prev => prev.map(msg =>
                  msg.id === aiMsgId ? { ...msg, followUpQuestions: chunk.followUpQuestions } : msg
               ));
            }
         }

         // Final update with complete text
         const aiMsg: ChatMessage = {
            id: aiMsgId,
            role: 'model',
            text: fullText,
            isStreaming: false,
            followUpQuestions
         };
         setMessages(prev => prev.map(msg =>
            msg.id === aiMsgId ? aiMsg : msg
         ));

         // Save AI message if we have a conversation and message has content
         if (conversationId && aiMsg.text && aiMsg.text.trim()) {
            try {
               const service = user ? conversationService : localConversationService;
               await service.saveMessage(conversationId, aiMsg);
            } catch (error) {
               console.error('Failed to save AI message:', error);
            }
         }
      } catch (error) {
         setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Connection error. Please try again." }]);
      } finally {
         setIsLoading(false);
      }
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
   };

   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   }, [messages]);

   // Unified Container Class: EXACTLY matching App.tsx
   // w-full max-w-3xl mx-auto px-4
   // Unified Container Class: OpenAI-like max-w-3xl for optimal readability
   const containerClass = "w-full max-w-3xl mx-auto px-4";

   return (
      <div className="flex flex-col h-full w-full relative">
         {/* Scrollable Area */}
         <div className="flex-1 overflow-y-auto w-full">
            <div className="flex flex-col min-h-full">

               {messages.length === 0 ? (
                  /* Empty State (Landing) */
                  <div className="flex-1 flex flex-col items-center justify-center p-4">
                     <AnimatePresence mode="wait">
                        <motion.div
                           key={language}
                           initial={{ opacity: 0, y: 8 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -8 }}
                           transition={{ duration: 0.2, ease: 'easeOut' }}
                           className="w-full flex flex-col items-center"
                        >
                           <div className="flex items-center gap-3 mb-8">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-xl border border-slate-100">
                                 🎓
                              </div>
                              <h2 className="text-2xl font-semibold text-slate-800 text-center tracking-tight">{t.welcomeTitle} UIUC</h2>
                           </div>

                           {/* Suggestions Grid */}
                           <div className={containerClass}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                 {t.suggestions.map((s, i) => (
                                    <button
                                       key={i}
                                       onClick={() => sendMessage(s.text)}
                                       className="p-3 border border-slate-200 rounded-2xl hover:bg-slate-50 text-left text-sm text-slate-600 transition-colors shadow-sm hover:shadow-md"
                                    >
                                       <span className="mr-2.5 text-base">{s.icon}</span>
                                       {s.text}
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </motion.div>
                     </AnimatePresence>
                  </div>
               ) : (
                  /* Message List */
                  <div className="flex-col pb-36 pt-14">
                     <AnimatePresence initial={false}>
                        {messages.map((msg, index) => (
                           <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                 duration: 0.3,
                                 ease: [0.25, 0.1, 0.25, 1],
                                 delay: index === messages.length - 1 ? 0 : 0
                              }}
                              className="w-full py-6 border-b border-transparent"
                           >
                              {/* 
                             Outer div handles background/border.
                             Inner div handles width and padding.
                             Removed 'px-4' from outer div to avoid double padding on mobile.
                          */}
                              <div className={`${containerClass} flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                 <div className="flex-shrink-0 flex flex-col relative items-end">
                                    {msg.role === 'user' ? (
                                       <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                             <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                                          </svg>
                                       </div>
                                    ) : (
                                       <div className="w-6 h-6 bg-illini-orange rounded-sm flex items-center justify-center text-white font-bold text-xs shadow-sm font-serif">
                                          I
                                       </div>
                                    )}
                                 </div>
                                 <div className={`relative flex-1 overflow-hidden pt-0.5 ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                                    <div className="font-semibold text-xs text-slate-900 mb-1">
                                       {msg.role === 'user' ? t.userRole : t.botName}
                                    </div>
                                    <div className="prose prose-slate prose-sm max-w-none leading-relaxed text-slate-800">
                                       {msg.role === 'user' ? (
                                          // User messages: plain text with pre-wrap
                                          <div className="whitespace-pre-wrap">{msg.text}</div>
                                       ) : (
                                          // AI messages: render with Typewriter effect
                                          <TypewriterMarkdown
                                             content={msg.text || ''}
                                             isStreaming={msg.isStreaming}
                                             components={{
                                                a: ({ node, ...props }) => (
                                                   <a {...props} className="text-illini-orange hover:underline" target="_blank" rel="noopener noreferrer" />
                                                ),
                                                code: ({ node, className, children, ...props }) => {
                                                   const isInline = !className;
                                                   return isInline ? (
                                                      <code className="bg-slate-100 px-1 py-0.5 rounded text-xs" {...props}>{children}</code>
                                                   ) : (
                                                      <code className="block bg-slate-100 p-2 rounded text-xs overflow-x-auto" {...props}>{children}</code>
                                                   );
                                                },
                                                ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                img: ({ node, ...props }) => (
                                                   <img
                                                      {...props}
                                                      className="rounded-lg shadow-sm max-w-full h-auto my-2 border border-slate-200"
                                                      loading="lazy"
                                                   />
                                                ),
                                             }}
                                          />
                                       )}
                                       {msg.isStreaming && (
                                          <span className="inline-flex items-center ml-1 align-middle">
                                             <svg
                                                className="animate-spin h-3.5 w-3.5 text-illini-orange"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                             >
                                                <circle
                                                   className="opacity-25"
                                                   cx="12"
                                                   cy="12"
                                                   r="10"
                                                   stroke="currentColor"
                                                   strokeWidth="4"
                                                />
                                                <path
                                                   className="opacity-75"
                                                   fill="currentColor"
                                                   d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                             </svg>
                                          </span>
                                       )}
                                    </div>
                                    {/* Follow-up Questions */}
                                    {msg.role === 'model' && msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                                       <div className="mt-3 flex flex-wrap gap-2">
                                          {msg.followUpQuestions.slice(0, 3).map((question, idx) => {
                                             const displayText = question.length > 50 ? question.substring(0, 47) + '...' : question;
                                             return (
                                                <button
                                                   key={idx}
                                                   onClick={() => sendMessage(question)}
                                                   disabled={isLoading}
                                                   title={question}
                                                   className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-illini-blue hover:text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 hover:border-illini-blue"
                                                >
                                                   💡 {displayText}
                                                </button>
                                             );
                                          })}
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </motion.div>
                        ))}
                     </AnimatePresence>
                     <div ref={messagesEndRef} />
                  </div>
               )}
            </div>
         </div>

         {/* Input Area (Sticky Bottom) */}
         <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-2 pb-6">
            <div className={containerClass}>
               <form onSubmit={handleSubmit} className="relative shadow-md rounded-[26px] border border-slate-200 bg-white focus-within:ring-1 focus-within:ring-slate-300 overflow-hidden transition-all">
                  <input
                     className="w-full py-3.5 pl-5 pr-12 text-base text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent resize-none"
                     placeholder={t.inputPlaceholder}
                     value={input}
                     onChange={e => setInput(e.target.value)}
                  />
                  <button
                     type="submit"
                     disabled={!input.trim() || isLoading}
                     className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${!input.trim() || isLoading ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-black text-white hover:opacity-80'
                        }`}
                  >
                     {isLoading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                     )}
                  </button>
               </form>
               <div className="text-center mt-3 text-xs text-slate-400">
                  {t.aiError}
               </div>
            </div>
         </div>
      </div >
   );
};