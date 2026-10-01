import { ActionBarPrimitive, MessagePrimitive, useAuiState } from "@assistant-ui/react"
import { motion } from "framer-motion"
import { ArrowUpRight, RotateCcw } from "lucide-react"
import * as React from "react"

import { ThinkingStep } from "../../../types"
import { BrandMark } from "../../ui/branding/BrandMark"
import { ThinkingProcess } from "../ThinkingProcess"
import { MarkdownText } from "./MarkdownContent"
import { MarkdownLabelsContext } from "./markdownLabels"
import { MessageCopyButton } from "./MessageCopyButton"

interface AssistantMessageMeta {
  thinkingSteps?: ThinkingStep[]
  isThinking?: boolean
  followUpQuestions?: string[]
  isStreaming?: boolean
}

interface AssistantMessageProps {
  language?: "en" | "zh"
  botName?: string
  copyLabel: string
  copiedLabel: string
  regenerateLabel: string
  onFollowUpClick?: (text: string) => void
}

// Stable identity: a new object here would remount the Text part on every
// streaming update and restart the smooth reveal from scratch. Tool-call parts
// fall through to the Tool UIs registered in ChatRuntimeProvider.
const partComponents = { Text: MarkdownText }

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

const actionButtonClass =
  "flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  language = "zh",
  botName = "iGuide",
  copyLabel,
  copiedLabel,
  regenerateLabel,
  onFollowUpClick,
}) => {
  // Message state comes from the Aui store, not a per-message hook.
  const messageId = useAuiState((s) => s.message.id)
  const meta = useAuiState((s) => s.message.metadata.custom as AssistantMessageMeta)
  const hasText = useAuiState((s) =>
    s.message.parts.some((part) => part.type === "text" && part.text.length > 0),
  )

  const showThinking = !!(meta?.thinkingSteps?.length || meta?.isThinking)
  const showTypingDots = !!meta?.isStreaming && !hasText && !showThinking
  const followUps = meta?.followUpQuestions?.slice(0, 3) ?? []
  const labels = React.useMemo(() => ({ copyLabel, copiedLabel }), [copyLabel, copiedLabel])

  return (
    <MessagePrimitive.Root className="group/msg flex w-full py-4">
      <div className="mx-auto flex w-full max-w-3xl gap-3 px-4">
        <BrandMark className="hidden size-6 shrink-0 rounded-md md:flex" iconClassName="text-xs" />

        <div className="min-w-0 flex-1 pt-0.5">
          <span className="sr-only">{botName}</span>

          {showThinking && (
            <ThinkingProcess
              key={messageId}
              steps={meta?.thinkingSteps ?? []}
              isThinking={!!meta?.isThinking}
              language={language}
            />
          )}

          {showTypingDots ? (
            <TypingDots />
          ) : (
            <div aria-live="polite">
              <MarkdownLabelsContext.Provider value={labels}>
                <MessagePrimitive.Parts components={partComponents} />
              </MarkdownLabelsContext.Provider>
            </div>
          )}

          {/* Hover actions — always visible on touch screens */}
          <ActionBarPrimitive.Root
            hideWhenRunning
            className="mt-1.5 -ml-1.5 flex items-center gap-0.5 transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover/msg:opacity-100"
          >
            <MessageCopyButton label={copyLabel} />
            <ActionBarPrimitive.Reload
              aria-label={regenerateLabel}
              title={regenerateLabel}
              className={actionButtonClass}
            >
              <RotateCcw className="size-3.5" />
            </ActionBarPrimitive.Reload>
          </ActionBarPrimitive.Root>

          {followUps.length > 0 && !meta?.isStreaming && (
            <div className="mt-3 flex flex-col items-start gap-1.5">
              {followUps.map((question, index) => (
                <motion.button
                  key={question}
                  type="button"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.06 }}
                  onClick={() => onFollowUpClick?.(question)}
                  title={question}
                  className="group/chip hover:border-illini-orange/40 flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-left text-[13px] text-slate-600 shadow-xs transition-all hover:bg-orange-50/60 hover:text-slate-900"
                >
                  <span className="truncate">{question}</span>
                  <ArrowUpRight className="group-hover/chip:text-illini-orange size-3.5 shrink-0 text-slate-400 transition-transform group-hover/chip:translate-x-0.5 group-hover/chip:-translate-y-0.5" />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </MessagePrimitive.Root>
  )
}
