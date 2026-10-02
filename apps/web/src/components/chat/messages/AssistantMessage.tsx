import { motion } from "framer-motion"
import { RotateCcw } from "lucide-react"
import * as React from "react"

import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion"
import { Button } from "@/components/ui/button"

import type { ChatMessage, Language } from "../../../types"
import { BrandMark } from "../../ui/branding/BrandMark"
import { ThinkingProcess } from "../ThinkingProcess"
import { MarkdownContent } from "./MarkdownContent"
import { MessageCopyButton } from "./MessageCopyButton"
import { MessageSources } from "./MessageSources"

export interface AssistantMessageLabels {
  botName: string
  copyLabel: string
  copiedLabel: string
  regenerateLabel: string
  /** `{count}` is replaced with the number of sources. */
  sourcesCount: string
}

interface AssistantMessageProps {
  message: ChatMessage
  language: Language
  labels: AssistantMessageLabels
  onFollowUpClick: (text: string) => void
  /** Regenerate is not implemented yet; the button only shows once a handler is passed. */
  onRegenerate?: () => void
}

const NO_SOURCES: never[] = []

const TypingDots = () => (
  <div className="flex h-6 items-center gap-1" aria-hidden="true">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="size-1.5 rounded-full bg-slate-400"
        animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
)

/**
 * One assistant reply. While it thinks, the header shows the current step and
 * a timer; once the answer starts, the sources pill replaces that line (when
 * the reply used any sources). Links to those sources render as numbered
 * citations, and follow-up questions sit underneath as chips.
 */
export const AssistantMessage = React.memo(function AssistantMessage({
  message,
  language,
  labels,
  onFollowUpClick,
  onRegenerate,
}: AssistantMessageProps) {
  const hasText = message.text.length > 0
  const sources = message.sources ?? NO_SOURCES
  const showSources = hasText && sources.length > 0
  const showThinking =
    !showSources &&
    !!(message.thinkingSteps?.length || message.isThinking || message.thinkingEndedAt !== undefined)
  const showTypingDots = !!message.isStreaming && !hasText && !showThinking
  const followUps = message.isStreaming ? [] : (message.followUpQuestions?.slice(0, 3) ?? [])

  return (
    <div data-message-id={message.id} className="group/msg flex w-full py-4">
      <div className="mx-auto flex w-full max-w-3xl gap-3 px-4">
        <BrandMark className="hidden size-6 shrink-0 rounded-md md:flex" iconClassName="text-xs" />

        <div className="min-w-0 flex-1 pt-0.5">
          <span className="sr-only">{labels.botName}</span>

          {showSources && (
            <MessageSources
              sources={sources}
              label={labels.sourcesCount.replace("{count}", String(sources.length))}
            />
          )}

          {showThinking && (
            <ThinkingProcess
              steps={message.thinkingSteps ?? []}
              isThinking={!!message.isThinking}
              startedAt={message.thinkingStartedAt}
              endedAt={message.thinkingEndedAt}
              language={language}
            />
          )}

          {showTypingDots ? (
            <TypingDots />
          ) : (
            <div aria-live="polite">
              <MarkdownContent
                text={message.text}
                isStreaming={!!message.isStreaming}
                sources={sources}
                copyLabel={labels.copyLabel}
                copiedLabel={labels.copiedLabel}
              />
            </div>
          )}

          {!message.isStreaming && hasText && (
            // Hover actions — always visible on touch screens
            <div className="mt-1.5 -ml-1.5 flex items-center gap-0.5 transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover/msg:opacity-100">
              <MessageCopyButton text={message.text} label={labels.copyLabel} />
              {onRegenerate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={labels.regenerateLabel}
                  title={labels.regenerateLabel}
                  onClick={onRegenerate}
                  className="size-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              )}
            </div>
          )}

          {followUps.length > 0 && (
            <Suggestions className="mt-3">
              {followUps.map((question) => (
                <Suggestion
                  key={question}
                  suggestion={question}
                  onClick={onFollowUpClick}
                  title={question}
                  className="h-8 border-slate-200 bg-white text-[13px] font-normal text-slate-600 shadow-xs hover:border-orange-200 hover:bg-orange-50/60 hover:text-slate-900"
                />
              ))}
            </Suggestions>
          )}
        </div>
      </div>
    </div>
  )
})
