import { AuiIf, ThreadPrimitive } from "@assistant-ui/react"
import { ArrowDown } from "lucide-react"
import * as React from "react"

import { UI_TEXT } from "../../i18n/uiText"
import { Language } from "../../types"
import { ChatComposer } from "./ChatComposer"
import { ChatEmptyState } from "./ChatEmptyState"
import { ChatSessionContext } from "./ChatRuntimeProvider"
import { AssistantMessage } from "./messages/AssistantMessage"
import { UserMessage } from "./messages/UserMessage"

interface ChatThreadProps {
  language: Language
}

const containerClass = "w-full max-w-3xl mx-auto px-4"

/**
 * turnAnchor="top": a newly sent question scrolls to the top of the screen and
 * the reply streams in below it without auto-following. The footer lives
 * inside the viewport (sticky) so assistant-ui can measure it for the slack
 * min-height that makes that scroll position reachable.
 */
export const ChatThread = ({ language }: ChatThreadProps) => {
  const t = UI_TEXT[language]
  const ctx = React.useContext(ChatSessionContext)

  // The context value changes on every streaming update; read it through a ref
  // so the handler (and the message components below) keep a stable identity.
  const appendRef = React.useRef(ctx?.appendMessage)
  React.useEffect(() => {
    appendRef.current = ctx?.appendMessage
  })
  const appendMessage = React.useCallback((text: string) => {
    appendRef.current?.(text)
  }, [])

  // Must be memoized: new component types here would remount every message on
  // each re-render, resetting the smooth reveal and thinking-panel state.
  const messageComponents = React.useMemo(
    () => ({
      UserMessage: () => <UserMessage userRole={t.userRole} copyLabel={t.copyLabel} />,
      AssistantMessage: () => (
        <AssistantMessage
          language={language}
          botName={t.botName}
          copyLabel={t.copyLabel}
          copiedLabel={t.copiedLabel}
          regenerateLabel={t.regenerateLabel}
          onFollowUpClick={appendMessage}
        />
      ),
    }),
    [language, t, appendMessage],
  )

  return (
    <ThreadPrimitive.Root className="flex size-full flex-col">
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="flex w-full flex-1 flex-col overflow-y-auto"
      >
        {/* Empty state — shown when no messages */}
        <AuiIf condition={({ thread }) => thread.isEmpty}>
          <ChatEmptyState
            language={language}
            title={t.welcomeTitle}
            subtitle={t.welcomeSubtitle}
            suggestions={t.suggestions}
            containerClass={containerClass}
            onSuggestionClick={appendMessage}
          />
        </AuiIf>

        {/* Message list */}
        <AuiIf condition={({ thread }) => !thread.isEmpty}>
          <div className="flex flex-col pt-10">
            <ThreadPrimitive.Messages components={messageComponents} />
          </div>
        </AuiIf>

        {/* Composer — sticks to the bottom of the viewport */}
        <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mt-auto w-full">
          <div className="bg-linear-to-t from-white via-white/95 to-transparent pt-6 pb-5">
            <div className={`relative ${containerClass}`}>
              {/* Disabled (hidden) while already at the bottom */}
              <ThreadPrimitive.ScrollToBottom
                aria-label={t.scrollToBottom}
                title={t.scrollToBottom}
                className="absolute -top-12 left-1/2 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition-all hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:translate-y-2 disabled:opacity-0"
              >
                <ArrowDown className="size-4" />
              </ThreadPrimitive.ScrollToBottom>

              <ChatComposer placeholder={t.inputPlaceholder} hint={t.composerHint} />

              <div className="mt-2 text-center text-[11px] text-slate-400">{t.aiError}</div>
            </div>
          </div>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  )
}
