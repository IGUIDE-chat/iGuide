/**
 * @file ./src/components/chat/ChatThread.tsx
 * @description Chat (AI) Component / Module
 */

import * as React from "react";
import { Language } from "../../types";
import { UI_TEXT } from "../../i18n/uiText";
import { ChatEmptyState } from "./ChatEmptyState";
import { UserMessage } from "./messages/UserMessage";
import { AssistantMessage } from "./messages/AssistantMessage";
import { ChatSessionContext } from "./ChatRuntimeProvider";
import { ImeSafeTextarea } from "./ImeSafeTextarea";

interface ChatThreadProps {
  language: Language;
}

const containerClass = "w-full max-w-3xl mx-auto px-4";

export const ChatThread = ({ language }: ChatThreadProps) => {
  const t = UI_TEXT[language];
  const ctx = React.useContext(ChatSessionContext);
  const viewportRef = React.useRef<HTMLDivElement>(null);

  const messageCount = ctx?.messages.length ?? 0;

  React.useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messageCount, ctx?.isLoading]);

  if (!ctx) {
    return null;
  }

  const isEmpty = ctx.messages.length === 0;
  const lastMessageId = ctx.messages.at(-1)?.id;

  const handleSuggestionClick = (text: string) => {
    ctx.append(text);
  };

  const handleFollowUpClick = (text: string) => {
    ctx.append(text);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      const nativeEvent = event.nativeEvent as KeyboardEvent;
      if (nativeEvent.isComposing || event.keyCode === 229) {
        return;
      }
      event.preventDefault();
      ctx.handleSubmit();
    }
  };

  const canSend = ctx.input.trim().length > 0 && !ctx.isLoading;

  return (
    <div className="relative flex size-full flex-col">
      <div ref={viewportRef} className="w-full flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col">
          {isEmpty && (
            <ChatEmptyState
              language={language}
              title={t.welcomeTitle}
              suggestions={t.suggestions}
              containerClass={containerClass}
              onSuggestionClick={handleSuggestionClick}
            />
          )}

          <div className="flex-col pt-14 pb-36">
            {ctx.messages.map((m) => {
              if (m.role === "user") {
                return (
                  <UserMessage key={m.id} message={m} userRole={t.userRole} />
                );
              }
              return (
                <AssistantMessage
                  key={m.id}
                  message={m}
                  language={language}
                  botName={t.botName}
                  followUps={m.id === lastMessageId ? ctx.followUps : null}
                  onFollowUpClick={handleFollowUpClick}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full">
        <div
          className="
            bg-linear-to-t from-white via-white to-transparent pt-2 pb-6
          "
        >
          <div className={containerClass}>
            <form
              onSubmit={ctx.handleSubmit}
              className="
                relative overflow-hidden rounded-[26px] border
                border-slate-200 bg-white shadow-md transition-all
                focus-within:ring-1 focus-within:ring-slate-300
              "
            >
              <ImeSafeTextarea
                value={ctx.input}
                onChange={(e) => ctx.setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.inputPlaceholder}
                rows={1}
                className="
                  w-full resize-none bg-transparent py-3.5 pr-12 pl-5
                  text-base text-slate-900 placeholder-slate-400
                  focus:outline-none
                "
              />
              {ctx.isLoading ? (
                <button
                  type="button"
                  onClick={ctx.stop}
                  aria-label="Stop"
                  className="
                    absolute top-1/2 right-2 -translate-y-1/2 rounded-full
                    bg-black p-2 text-white transition-all
                    hover:opacity-80
                  "
                >
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="1.5" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="Send"
                  className="
                    absolute top-1/2 right-2 -translate-y-1/2 rounded-full
                    bg-black p-2 text-white transition-all
                    hover:opacity-80
                    disabled:cursor-not-allowed disabled:bg-slate-100
                    disabled:text-slate-300
                  "
                >
                  <svg
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                </button>
              )}
            </form>
            <div
              className="
                mt-3 hidden text-center text-xs text-slate-400
                md:block
              "
            >
              {t.aiError}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
