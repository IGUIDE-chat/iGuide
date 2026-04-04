/**
 * @file ./src/components/chat/ChatMessageList.tsx
 * @description Chat (AI) Component / Module
 * @description_zh 此文件属于 Chat 业务域。请保持业务内聚，不要随意挂载到全局域。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { ChatMessage } from '../../types'
import { TypewriterMarkdown } from './TypewriterMarkdown'
import { ThinkingProcess } from './ThinkingProcess'

interface ChatMessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  containerClass: string
  botName: string
  userRole: string
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onFollowUpClick: (text: string) => void
  language?: 'en' | 'zh'
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  containerClass,
  botName,
  userRole,
  messagesEndRef,
  onFollowUpClick,
  language = 'zh',
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
            className="w-full border-b border-transparent py-6"
          >
            <div
              className={`${containerClass} flex gap-4 ${
                message.role === 'user'
                  ? 'flex-row-reverse'
                  : 'flex-col md:flex-row'
              }`}
            >
              {/* Avatar: hidden on mobile for AI, always shown on desktop */}
              <div
                className={`relative flex flex-shrink-0 flex-col items-end ${message.role === 'model' ? 'hidden md:flex' : ''}`}
              >
                {message.role === 'user' ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-illini-orange font-serif text-xs font-bold text-white shadow-sm">
                    I
                  </div>
                )}
              </div>
              <div
                className={`relative flex-1 overflow-hidden pt-0.5 ${
                  message.role === 'user' ? 'flex flex-col items-end' : ''
                }`}
              >
                <div
                  className={`mb-1 text-xs font-semibold text-slate-900 ${message.role === 'model' ? 'hidden md:block' : ''}`}
                >
                  {message.role === 'user' ? userRole : botName}
                </div>
                {message.role === 'model' &&
                  (message.thinkingSteps?.length || message.isThinking) && (
                    <ThinkingProcess
                      steps={message.thinkingSteps || []}
                      isThinking={!!message.isThinking}
                      language={language}
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
                          const isInline = !className
                          return isInline ? (
                            <code
                              className="rounded bg-slate-100 px-1 py-0.5 text-xs"
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            <code
                              className="block overflow-x-auto rounded bg-slate-100 p-2 text-xs"
                              {...props}
                            >
                              {children}
                            </code>
                          )
                        },
                        ul: ({ node, ...props }) => (
                          <ul
                            className="list-inside list-disc space-y-1"
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            className="list-inside list-decimal space-y-1"
                            {...props}
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="mb-2 last:mb-0" {...props} />
                        ),
                        img: ({ node, ...props }) => (
                          <img
                            {...props}
                            className="my-2 h-auto max-w-full rounded-lg border border-slate-200 shadow-sm"
                            loading="lazy"
                          />
                        ),
                      }}
                    />
                  )}
                  {message.isStreaming && (
                    <span className="ml-1 inline-flex items-center align-middle">
                      <svg
                        className="h-3.5 w-3.5 animate-spin text-illini-orange"
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
                      {message.followUpQuestions
                        .slice(0, 3)
                        .map((question, idx) => {
                          const displayText =
                            question.length > 50
                              ? `${question.substring(0, 47)}...`
                              : question
                          return (
                            <button
                              key={`${question}-${idx}`}
                              onClick={() => onFollowUpClick(question)}
                              disabled={isLoading}
                              title={question}
                              className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs transition-colors hover:border-illini-blue hover:bg-illini-blue hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              💡 {displayText}
                            </button>
                          )
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
  )
}
