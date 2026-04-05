/**
 * @file ./src/components/chat/messages/AssistantMessage.tsx
 * @description Chat (AI) Component / Module
 */

import { MessagePrimitive, useMessage } from '@assistant-ui/react'
import { ThinkingProcess } from '../ThinkingProcess'
import { TypewriterMarkdown } from '../TypewriterMarkdown'
import { ThinkingStep } from '../../../types'

interface AssistantMessageMeta {
  thinkingSteps?: ThinkingStep[]
  isThinking?: boolean
  followUpQuestions?: string[]
  isStreaming?: boolean
}

interface AssistantMessageProps {
  language?: 'en' | 'zh'
  botName?: string
  onFollowUpClick?: (text: string) => void
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  language = 'zh',
  botName = 'iGuide',
  onFollowUpClick,
}) => {
  const message = useMessage()
  const meta = message.metadata as AssistantMessageMeta | undefined

  const textPart = message.content.find((p) => p.type === 'text')
  const text = textPart && textPart.type === 'text' ? textPart.text : ''

  return (
    <MessagePrimitive.Root className="flex flex-col md:flex-row gap-4 py-6 w-full border-b border-transparent">
      {/* Avatar — hidden on mobile */}
      <div className="relative flex shrink-0 flex-col items-end hidden md:flex">
        <div
          className="
            h-6 w-6 rounded-sm bg-illini-orange font-serif text-xs
            font-bold text-white shadow-sm flex items-center
            justify-center
          "
        >
          I
        </div>
      </div>

      {/* Content */}
      <div className="pt-0.5 relative flex-1 overflow-hidden">
        {/* Bot name label */}
        <div className="mb-1 text-xs font-semibold text-slate-900 hidden md:block">
          {botName}
        </div>

        {/* Thinking process */}
        {(meta?.thinkingSteps?.length || meta?.isThinking) && (
          <ThinkingProcess
            steps={meta?.thinkingSteps ?? []}
            isThinking={!!meta?.isThinking}
            language={language}
          />
        )}

        {/* Prose / markdown body */}
        <div className="prose prose-slate prose-sm leading-relaxed text-slate-800 max-w-none">
          <TypewriterMarkdown
            content={text}
            isStreaming={meta?.isStreaming}
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
                    className="rounded-sm bg-slate-100 px-1 py-0.5 text-xs"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <code
                    className="rounded-sm bg-slate-100 p-2 text-xs block overflow-x-auto"
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
              ul: ({ node, ...props }) => (
                <ul className="space-y-1 list-inside list-disc" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="space-y-1 list-inside list-decimal" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="mb-2 last:mb-0" {...props} />
              ),
              img: ({ node, alt, ...props }) => (
                <img
                  {...props}
                  alt={alt ?? ''}
                  className="my-2 rounded-lg border-slate-200 shadow-sm h-auto max-w-full border"
                  loading="lazy"
                />
              ),
            }}
          />

          {/* Streaming spinner */}
          {meta?.isStreaming && (
            <span className="ml-1 inline-flex items-center align-middle">
              <svg
                className="h-3.5 w-3.5 animate-spin text-illini-orange"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-label="Loading"
                role="img"
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

        {/* Follow-up chips */}
        {meta?.followUpQuestions && meta.followUpQuestions.length > 0 && (
          <div className="mt-3 gap-2 flex flex-wrap">
            {meta.followUpQuestions.slice(0, 3).map((question) => {
              const displayText =
                question.length > 50
                  ? `${question.substring(0, 47)}...`
                  : question
              return (
                <button
                  key={question}
                  type="button"
                  onClick={() => onFollowUpClick?.(question)}
                  title={question}
                  className="
                    rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5
                    text-xs hover:border-illini-blue hover:bg-illini-blue
                    hover:text-white disabled:cursor-not-allowed disabled:opacity-50
                    transition-colors
                  "
                >
                  💡 {displayText}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </MessagePrimitive.Root>
  )
}
