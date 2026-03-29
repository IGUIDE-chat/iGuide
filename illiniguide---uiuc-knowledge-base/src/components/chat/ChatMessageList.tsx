/**
 * @file ./src/components/chat/ChatMessageList.tsx
 * @description Chat (AI) Component / Module
 * @description_zh 此文件属于 Chat 业务域。请保持业务内聚，不要随意挂载到全局域。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { ChatMessage } from '../../types';
import { TypewriterMarkdown } from './TypewriterMarkdown';
import { ThinkingProcess } from './ThinkingProcess';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  containerClass: string;
  botName: string;
  userRole: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onFollowUpClick: (text: string) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  containerClass,
  botName,
  userRole,
  messagesEndRef,
  onFollowUpClick,
}) => {
  return (
    <div className="flex-col pb-36 pt-14">
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.1, 0.25, 1],
              delay: index === messages.length - 1 ? 0 : 0,
            }}
            className="w-full py-6 border-b border-transparent"
          >
            <div
              className={`${containerClass} flex gap-4 ${
                message.role === 'user' ? 'flex-row-reverse' : 'md:flex-row flex-col'
              }`}
            >
              {/* Avatar: hidden on mobile for AI, always shown on desktop */}
              <div className={`flex-shrink-0 flex flex-col relative items-end ${message.role === 'model' ? 'hidden md:flex' : ''}`}>
                {message.role === 'user' ? (
                  <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-illini-orange rounded-sm flex items-center justify-center text-white font-bold text-xs shadow-sm font-serif">
                    I
                  </div>
                )}
              </div>
              <div
                className={`relative flex-1 overflow-hidden pt-0.5 ${
                  message.role === 'user' ? 'flex flex-col items-end' : ''
                }`}
              >
                <div className={`font-semibold text-xs text-slate-900 mb-1 ${message.role === 'model' ? 'hidden md:block' : ''}`}>
                  {message.role === 'user' ? userRole : botName}
                </div>
                {message.role === 'model' &&
                  (message.thinkingSteps?.length || message.isThinking) && (
                    <ThinkingProcess
                      steps={message.thinkingSteps || []}
                      isThinking={!!message.isThinking}
                    />
                  )}
                <div className="prose prose-slate prose-sm max-w-none leading-relaxed text-slate-800">
                  {message.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{message.text}</div>
                  ) : (
                    <TypewriterMarkdown
                      content={message.text || ''}
                      isStreaming={message.isStreaming}
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            className="text-illini-orange hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ),
                        code: ({ node, className, children, ...props }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code
                              className="bg-slate-100 px-1 py-0.5 rounded text-xs"
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            <code
                              className="block bg-slate-100 p-2 rounded text-xs overflow-x-auto"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc list-inside space-y-1" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal list-inside space-y-1" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="mb-2 last:mb-0" {...props} />
                        ),
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
                  {message.isStreaming && (
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
                {message.role === 'model' &&
                  message.followUpQuestions &&
                  message.followUpQuestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.followUpQuestions.slice(0, 3).map((question, idx) => {
                        const displayText =
                          question.length > 50 ? `${question.substring(0, 47)}...` : question;
                        return (
                          <button
                            key={`${question}-${idx}`}
                            onClick={() => onFollowUpClick(question)}
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
  );
};
