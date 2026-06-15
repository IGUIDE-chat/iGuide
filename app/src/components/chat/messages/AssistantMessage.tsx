/**
 * @file ./src/components/chat/messages/AssistantMessage.tsx
 * @description Chat (AI) Component / Module
 */

import {
  MessagePrimitive,
  ActionBarPrimitive,
  useMessage,
} from "@assistant-ui/react";
import { ThinkingProcess } from "../ThinkingProcess";
import { Typewriter } from "../../ui/Typewriter";
import { ThinkingStep } from "../../../types";

interface AssistantMessageMeta {
  thinkingSteps?: ThinkingStep[];
  isThinking?: boolean;
  followUpQuestions?: string[];
  isStreaming?: boolean;
}

interface AssistantMessageProps {
  language?: "en" | "zh";
  botName?: string;
  onFollowUpClick?: (text: string) => void;
}

const FEEDBACK_LABELS = {
  en: { helpful: "Helpful", notHelpful: "Not helpful" },
  zh: { helpful: "有帮助", notHelpful: "没帮助" },
} as const;

const actionButtonClass = `
  rounded-md p-1.5 text-slate-500 transition-colors
  hover:bg-slate-100 hover:text-slate-700
`;

/**
 * Message action bar (copy, regenerate, 👍/👎). Rendered as a static row
 * below the answer so it is always discoverable — including on touch devices
 * where there is no hover. It is hidden only while the response is streaming.
 */
const MessageActionBar: React.FC<{
  feedbackLabels: { helpful: string; notHelpful: string };
}> = ({ feedbackLabels }) => (
  <ActionBarPrimitive.Root hideWhenRunning className="mt-3 flex gap-1">
    <ActionBarPrimitive.Copy aria-label="Copy message" className={actionButtonClass}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </ActionBarPrimitive.Copy>
    <ActionBarPrimitive.Reload
      aria-label="Regenerate response"
      className={actionButtonClass}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    </ActionBarPrimitive.Reload>
    <ActionBarPrimitive.FeedbackPositive
      aria-label={feedbackLabels.helpful}
      title={feedbackLabels.helpful}
      className="
        rounded-md p-1.5 text-slate-500 transition-colors
        hover:bg-slate-100 hover:text-emerald-600
        data-[submitted]:text-emerald-600
      "
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
    </ActionBarPrimitive.FeedbackPositive>
    <ActionBarPrimitive.FeedbackNegative
      aria-label={feedbackLabels.notHelpful}
      title={feedbackLabels.notHelpful}
      className="
        rounded-md p-1.5 text-slate-500 transition-colors
        hover:bg-slate-100 hover:text-rose-600
        data-[submitted]:text-rose-600
      "
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
      </svg>
    </ActionBarPrimitive.FeedbackNegative>
  </ActionBarPrimitive.Root>
);

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  language = "zh",
  botName = "iGuide",
  onFollowUpClick,
}) => {
  const feedbackLabels = FEEDBACK_LABELS[language];
  const message = useMessage();
  const meta = message.metadata?.custom as AssistantMessageMeta | undefined;

  return (
    <MessagePrimitive.Root className="flex w-full border-b border-transparent py-6">
      <div
        className="
          mx-auto flex w-full max-w-3xl flex-col gap-4 px-4
          md:flex-row
        "
      >
        {/* Avatar — hidden on mobile */}
        <div
          className="
            relative flex hidden shrink-0 flex-col items-end
            md:flex
          "
        >
          <div
            className="
              flex size-6 items-center justify-center rounded-sm
              bg-illini-orange font-serif text-xs font-bold text-white shadow-sm
            "
          >
            I
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 pt-0.5">
          {/* Bot name label */}
          <div
            className="
              mb-1 hidden text-xs font-semibold text-slate-900
              md:block
            "
          >
            {botName}
          </div>

          {/* Thinking process */}
          {(meta?.thinkingSteps?.length || meta?.isThinking) && (
            <ThinkingProcess
              key={message.id}
              steps={meta?.thinkingSteps ?? []}
              isThinking={!!meta?.isThinking}
              language={language}
            />
          )}

          {/* Message parts — text uses the existing markdown renderer; tool calls
              fall through to assistant-ui's registered Tool UI renderers. */}
          <div
            aria-live="polite"
            className="
              prose prose-slate prose-sm max-w-none leading-relaxed
              text-slate-800
            "
          >
            <MessagePrimitive.Parts>
              {({ part }) => {
                if (part.type !== "text") return null;

                return (
                  <>
                    <Typewriter
                      text={part.text}
                      mode="static"
                      markdown
                      markdownComponents={{
                        a: ({ node: _node, ...props }) => (
                          <a
                            {...props}
                            className="
                              text-illini-orange
                              hover:underline
                            "
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ),
                        code: ({
                          node: _node,
                          className,
                          children,
                          ...props
                        }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code
                              className="
                                rounded-sm bg-slate-100 px-1 py-0.5 text-xs
                              "
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            <code
                              className="
                                block overflow-x-auto rounded-sm bg-slate-100
                                p-2 text-xs
                              "
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        ul: ({ node: _node, ...props }) => (
                          <ul
                            className="list-inside list-disc space-y-1"
                            {...props}
                          />
                        ),
                        ol: ({ node: _node, ...props }) => (
                          <ol
                            className="list-inside list-decimal space-y-1"
                            {...props}
                          />
                        ),
                        p: ({ node: _node, ...props }) => (
                          <p
                            className="
                              mb-2
                              last:mb-0
                            "
                            {...props}
                          />
                        ),
                        img: ({ node: _node, alt, ...props }) => (
                          <img
                            {...props}
                            alt={alt ?? ""}
                            className="
                              my-2 h-auto max-w-full rounded-lg border
                              border-slate-200 shadow-sm
                            "
                            loading="lazy"
                          />
                        ),
                      }}
                    />

                    {part.status.type === "running" && (
                      <span className="ml-1 inline-flex items-center align-middle">
                        <svg
                          className="size-3.5 animate-spin text-illini-orange"
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
                  </>
                );
              }}
            </MessagePrimitive.Parts>
          </div>

          {/* Action bar — copy / regenerate / feedback */}
          <MessageActionBar feedbackLabels={feedbackLabels} />

          {/* Follow-up chips */}
          {meta?.followUpQuestions && meta.followUpQuestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {meta.followUpQuestions.slice(0, 3).map((question) => {
                const displayText =
                  question.length > 50
                    ? `${question.substring(0, 47)}...`
                    : question;
                return (
                  <button
                    key={question}
                    type="button"
                    onClick={() => onFollowUpClick?.(question)}
                    title={question}
                    className="
                      rounded-full border border-slate-200 bg-slate-100 px-3
                      py-1.5 text-xs transition-colors
                      hover:border-illini-blue hover:bg-illini-blue
                      hover:text-white
                      disabled:cursor-not-allowed disabled:opacity-50
                    "
                  >
                    💡 {displayText}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};
