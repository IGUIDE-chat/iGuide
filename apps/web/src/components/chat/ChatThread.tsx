import { ArrowDown } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"

import { UI_TEXT } from "../../i18n/uiText"
import { Language } from "../../types"
import { ChatComposer } from "./ChatComposer"
import { ChatEmptyState } from "./ChatEmptyState"
import { AssistantMessage, type AssistantMessageLabels } from "./messages/AssistantMessage"
import { UserMessage } from "./messages/UserMessage"
import { useChatSession } from "./useChatSession"
import { useTopAnchoredScroll } from "./useTopAnchoredScroll"

interface ChatThreadProps {
  language: Language
  currentConversationId: string | null
  onConversationCreated: (conversationId: string) => void
}

const containerClass = "w-full max-w-3xl mx-auto px-4"

/**
 * The /chat thread: message list, empty state, and the sticky composer.
 *
 * A newly sent question scrolls to the top of the screen and the reply
 * streams in below it without auto-following (see useTopAnchoredScroll). The
 * footer lives inside the scroll container (sticky) so the hook can subtract
 * its height when sizing the space that makes that position reachable.
 */
export const ChatThread = ({
  language,
  currentConversationId,
  onConversationCreated,
}: ChatThreadProps) => {
  const t = UI_TEXT[language]
  const { messages, isLoading, sendMessage } = useChatSession({
    language,
    currentConversationId,
    onConversationCreated,
  })

  // sendMessage changes identity whenever messages change; read it through a
  // ref so the memoized messages below keep a stable click handler.
  const sendRef = React.useRef(sendMessage)
  React.useEffect(() => {
    sendRef.current = sendMessage
  })
  const send = React.useCallback((text: string) => {
    void sendRef.current(text)
  }, [])

  const lastUserMessageId = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i].id
    }
    return undefined
  }, [messages])
  const { viewportRef, contentRef, spacerRef, footerRef, showScrollButton, scrollToEnd } =
    useTopAnchoredScroll({ anchorId: lastUserMessageId, anchorOnChange: isLoading })

  const assistantLabels = React.useMemo<AssistantMessageLabels>(
    () => ({
      botName: t.botName,
      copyLabel: t.copyLabel,
      copiedLabel: t.copiedLabel,
      regenerateLabel: t.regenerateLabel,
      sourcesCount: t.sourcesCount,
    }),
    [t],
  )

  return (
    <div className="flex size-full flex-col">
      <div ref={viewportRef} className="relative flex w-full flex-1 flex-col overflow-y-auto">
        {messages.length === 0 && (
          <ChatEmptyState
            language={language}
            title={t.welcomeTitle}
            subtitle={t.welcomeSubtitle}
            suggestions={t.suggestions}
            containerClass={containerClass}
            onSuggestionClick={send}
          />
        )}

        <div
          ref={contentRef}
          className={messages.length > 0 ? "flex shrink-0 flex-col pt-10" : "shrink-0"}
        >
          {messages.map((message) =>
            message.role === "user" ? (
              <UserMessage
                key={message.id}
                id={message.id}
                text={message.text}
                userRole={t.userRole}
                copyLabel={t.copyLabel}
              />
            ) : (
              <AssistantMessage
                key={message.id}
                message={message}
                language={language}
                labels={assistantLabels}
                onFollowUpClick={send}
              />
            ),
          )}
        </div>
        {/* Sized by useTopAnchoredScroll. shrink-0: as a flex item it would
            otherwise be squeezed to nothing once the thread overflows. */}
        <div ref={spacerRef} aria-hidden="true" className="shrink-0" />

        {/* Composer — sticks to the bottom of the viewport */}
        <div ref={footerRef} className="sticky bottom-0 mt-auto w-full shrink-0">
          <div className="bg-linear-to-t from-white via-white/95 to-transparent pt-6 pb-5">
            <div className={`relative ${containerClass}`}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t.scrollToBottom}
                title={t.scrollToBottom}
                tabIndex={showScrollButton ? 0 : -1}
                onClick={() => scrollToEnd()}
                className={`absolute -top-12 left-1/2 size-9 -translate-x-1/2 rounded-full border-slate-200 bg-white text-slate-600 shadow-md transition-all hover:bg-slate-50 hover:text-slate-900 ${
                  showScrollButton ? "" : "pointer-events-none translate-y-2 opacity-0"
                }`}
              >
                <ArrowDown className="size-4" />
              </Button>

              <ChatComposer
                placeholder={t.inputPlaceholder}
                hint={t.composerHint}
                isRunning={isLoading}
                onSend={send}
              />

              <div className="mt-2 text-center text-[11px] text-slate-400">{t.aiError}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
