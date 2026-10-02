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

const hasThinking = (message: ChatMessage) =>
  !!(message.thinkingSteps?.length || message.isThinking || message.thinkingEndedAt !== undefined)

interface ReplyHeaderProps {
  message: ChatMessage
  sources: NonNullable<ChatMessage["sources"]>
  language: Language
  sourcesLabel: string
}

/**
 * While the reply thinks: the current step and a timer. Once the answer
 * starts: the sources pill, if the reply used any sources; otherwise the
 * thinking summary stays.
 */
const ReplyHeader = ({ message, sources, language, sourcesLabel }: ReplyHeaderProps) => {
  if (message.text.length > 0 && sources.length > 0) {
    return (
      <MessageSources
        sources={sources}
        label={sourcesLabel.replace("{count}", String(sources.length))}
      />
    )
  }
  if (!hasThinking(message)) return null
  return (
    <ThinkingProcess
      steps={message.thinkingSteps ?? []}
      isThinking={!!message.isThinking}
      startedAt={message.thinkingStartedAt}
      endedAt={message.thinkingEndedAt}
      language={language}
    />
  )
}

interface ReplyActionsProps {
  text: string
  copyLabel: string
  regenerateLabel: string
  onRegenerate?: () => void
}

/** Hover actions; always visible on touch screens. */
const ReplyActions = ({ text, copyLabel, regenerateLabel, onRegenerate }: ReplyActionsProps) => (
  <div className="mt-1.5 -ml-1.5 flex items-center gap-0.5 transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover/msg:opacity-100">
    <MessageCopyButton text={text} label={copyLabel} />
    {onRegenerate && (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={regenerateLabel}
        title={regenerateLabel}
        onClick={onRegenerate}
        className="size-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <RotateCcw className="size-3.5" />
      </Button>
    )}
  </div>
)

interface FollowUpSuggestionsProps {
  questions: readonly string[]
  onClick: (text: string) => void
}

const FollowUpSuggestions = ({ questions, onClick }: FollowUpSuggestionsProps) => (
  <Suggestions className="mt-3">
    {questions.map((question) => (
      <Suggestion
        key={question}
        suggestion={question}
        onClick={onClick}
        title={question}
        className="h-8 border-slate-200 bg-white text-[13px] font-normal text-slate-600 shadow-xs hover:border-orange-200 hover:bg-orange-50/60 hover:text-slate-900"
      />
    ))}
  </Suggestions>
)

/**
 * One assistant reply: a header that hands over from thinking to sources, the
 * markdown answer (links to sources render as numbered citations), hover
 * actions, and follow-up questions as chips.
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
  // Before any text the header can only show thinking, so dots stand in when it has none.
  const showTypingDots = !!message.isStreaming && !hasText && !hasThinking(message)
  const followUps = message.isStreaming ? [] : (message.followUpQuestions?.slice(0, 3) ?? [])

  return (
    <div data-message-id={message.id} className="group/msg flex w-full py-4">
      <div className="mx-auto flex w-full max-w-3xl gap-3 px-4">
        <BrandMark className="hidden size-6 shrink-0 rounded-md md:flex" iconClassName="text-xs" />

        <div className="min-w-0 flex-1 pt-0.5">
          <span className="sr-only">{labels.botName}</span>

          <ReplyHeader
            message={message}
            sources={sources}
            language={language}
            sourcesLabel={labels.sourcesCount}
          />

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
            <ReplyActions
              text={message.text}
              copyLabel={labels.copyLabel}
              regenerateLabel={labels.regenerateLabel}
              onRegenerate={onRegenerate}
            />
          )}

          {followUps.length > 0 && (
            <FollowUpSuggestions questions={followUps} onClick={onFollowUpClick} />
          )}
        </div>
      </div>
    </div>
  )
})
