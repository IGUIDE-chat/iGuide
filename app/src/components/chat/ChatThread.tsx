/**
 * @file ./src/components/chat/ChatThread.tsx
 * @description Chat (AI) Component / Module
 */

import * as React from "react";
import { ThreadPrimitive, ComposerPrimitive } from "@assistant-ui/react";
import { Language } from "../../types";
import { UI_TEXT } from "../../i18n/uiText";
import { ChatEmptyState } from "./ChatEmptyState";
import { UserMessage } from "./messages/UserMessage";
import { AssistantMessage } from "./messages/AssistantMessage";
import { ChatSessionContext } from "./ChatRuntimeProvider";

interface ChatThreadProps {
  language: Language;
}

const containerClass = "w-full max-w-3xl mx-auto px-4";

export const ChatThread = ({ language }: ChatThreadProps) => {
  const t = UI_TEXT[language];
  const ctx = React.useContext(ChatSessionContext);

  const handleSuggestionClick = React.useCallback(
    (text: string) => {
      void ctx?.sendMessage(text);
    },
    [ctx],
  );

  const handleFollowUpClick = React.useCallback(
    (text: string) => {
      void ctx?.sendMessage(text);
    },
    [ctx],
  );

  const messageComponents = React.useMemo(
    () => ({
      UserMessage: () => <UserMessage userRole={t.userRole} />,
      AssistantMessage: () => (
        <AssistantMessage
          language={language}
          botName={t.botName}
          onFollowUpClick={handleFollowUpClick}
        />
      ),
    }),
    [language, t.userRole, t.botName, handleFollowUpClick],
  );

  return (
    <ThreadPrimitive.Root className="relative flex h-full w-full flex-col">
      <ThreadPrimitive.Viewport className="w-full flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col">
          {/* Empty state — shown when no messages */}
          <ThreadPrimitive.Empty>
            <ChatEmptyState
              language={language}
              title={t.welcomeTitle}
              suggestions={t.suggestions}
              containerClass={containerClass}
              onSuggestionClick={handleSuggestionClick}
            />
          </ThreadPrimitive.Empty>

          {/* Message list */}
          <div className="pb-36 pt-14 flex-col">
            <ThreadPrimitive.Messages components={messageComponents} />
          </div>
        </div>
      </ThreadPrimitive.Viewport>

      {/* Composer — fixed to bottom */}
      <ThreadPrimitive.ViewportFooter className="absolute bottom-0 left-0 w-full">
        <div className="bg-gradient-to-t from-white via-white to-transparent pb-6 pt-2">
          <div className={containerClass}>
            <ComposerPrimitive.Root className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-md transition-all focus-within:ring-1 focus-within:ring-slate-300">
              <ComposerPrimitive.Input
                placeholder={t.inputPlaceholder}
                className="w-full resize-none bg-transparent py-3.5 pl-5 pr-12 text-base text-slate-900 placeholder-slate-400 focus:outline-none"
                rows={1}
              />
              <ComposerPrimitive.Send className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 transition-all bg-black text-white hover:opacity-80 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Send"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              </ComposerPrimitive.Send>
            </ComposerPrimitive.Root>
            <div className="mt-3 hidden text-center text-xs text-slate-400 md:block">
              {t.aiError}
            </div>
          </div>
        </div>
      </ThreadPrimitive.ViewportFooter>
    </ThreadPrimitive.Root>
  );
};
