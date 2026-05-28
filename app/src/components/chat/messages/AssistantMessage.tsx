/**
 * @file ./src/components/chat/messages/AssistantMessage.tsx
 * @description Chat (AI) Component / Module
 */

import * as React from "react"
import { type UIMessage } from "ai"
import { Typewriter } from "../../ui/Typewriter"
import { ToolStatus } from "../ToolStatus"
import { ChatSessionContext } from "../ChatRuntimeProvider"

interface AssistantMessageProps {
  message: UIMessage
  language?: "en" | "zh"
  botName?: string
  followUps?: string[] | null
  onFollowUpClick?: (text: string) => void
}

const extractAssistantText = (message: UIMessage): string =>
  message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")

const summarizeToolResult = (result: unknown): string | undefined => {
  if (result == null) {
    return undefined
  }
  if (typeof result === "string") {
    return result.length > 80 ? `${result.slice(0, 77)}...` : result
  }
  try {
    const json = JSON.stringify(result)
    return json.length > 80 ? `${json.slice(0, 77)}...` : json
  } catch {
    return undefined
  }
}

const markdownComponents = {
  a: ({
    node: _node,
    ...props
  }: { node?: unknown } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      {...props}
      className="text-illini-orange hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  code: ({
    node: _node,
    className,
    children,
    ...props
  }: {
    node?: unknown
    className?: string
    children?: React.ReactNode
  } & React.HTMLAttributes<HTMLElement>) => {
    const isInline = !className
    return isInline ? (
      <code className="rounded-sm bg-slate-100 px-1 py-0.5 text-xs" {...props}>
        {children}
      </code>
    ) : (
      <code
        className="block overflow-x-auto rounded-sm bg-slate-100 p-2 text-xs"
        {...props}
      >
        {children}
      </code>
    )
  },
  ul: ({
    node: _node,
    ...props
  }: { node?: unknown } & React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-inside list-disc space-y-1" {...props} />
  ),
  ol: ({
    node: _node,
    ...props
  }: { node?: unknown } & React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="list-inside list-decimal space-y-1" {...props} />
  ),
  p: ({
    node: _node,
    ...props
  }: { node?: unknown } & React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-2 last:mb-0" {...props} />
  ),
  img: ({
    node: _node,
    alt,
    ...props
  }: { node?: unknown } & React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img
      {...props}
      alt={alt ?? ""}
      className="my-2 h-auto max-w-full rounded-lg border border-slate-200 shadow-sm"
      loading="lazy"
    />
  ),
}

interface ToolCallLike {
  type: string
  toolName?: string
  toolCallId?: string
  state?: string
  input?: unknown
  output?: unknown
  result?: unknown
  args?: unknown
}

const renderToolPart = (part: ToolCallLike, key: string): React.ReactNode => {
  const type = part.type

  if (type === "tool-call") {
    return <ToolStatus key={key} toolName={part.toolName} status="searching" />
  }

  if (type === "tool-result") {
    return (
      <ToolStatus
        key={key}
        toolName={part.toolName}
        status="done"
        summary={summarizeToolResult(part.result)}
      />
    )
  }

  if (type === "dynamic-tool") {
    const isDone =
      part.state === "output-available" || part.state === "output-error"
    return (
      <ToolStatus
        key={key}
        toolName={part.toolName}
        status={isDone ? "done" : "searching"}
        summary={isDone ? summarizeToolResult(part.output) : undefined}
      />
    )
  }

  if (type.startsWith("tool-")) {
    const toolName = type.slice(5)
    const isDone =
      part.state === "output-available" || part.state === "output-error"
    return (
      <ToolStatus
        key={key}
        toolName={toolName}
        status={isDone ? "done" : "searching"}
        summary={isDone ? summarizeToolResult(part.output) : undefined}
      />
    )
  }

  return null
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  message,
  language: _language = "zh",
  botName = "iGuide",
  followUps,
  onFollowUpClick,
}) => {
  const ctx = React.useContext(ChatSessionContext)
  const isLastMessage = ctx?.messages.at(-1)?.id === message.id
  const isLoading = !!ctx?.isLoading && isLastMessage

  const handleCopy = React.useCallback(() => {
    const text = extractAssistantText(message)
    if (text) {
      void navigator.clipboard?.writeText(text)
    }
  }, [message])

  const showFollowUps = !!followUps && followUps.length > 0 && !isLoading

  return (
    <div className="flex w-full border-b border-transparent py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 md:flex-row">
        <div className="relative flex hidden shrink-0 flex-col items-end md:flex">
          <div className="bg-illini-orange flex size-6 items-center justify-center rounded-sm font-serif text-xs font-bold text-white shadow-sm">
            I
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden pt-0.5">
          <div className="absolute top-0 right-0 flex gap-1">
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy message"
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
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
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>

          <div className="mb-1 hidden text-xs font-semibold text-slate-900 md:block">
            {botName}
          </div>

          <div
            aria-live="polite"
            className="prose prose-slate prose-sm max-w-none leading-relaxed text-slate-800"
          >
            {message.parts.map((part, index) => {
              const partAny = part as unknown as ToolCallLike
              const key = `${message.id}-${index}-${partAny.type}`

              if (partAny.type === "text") {
                const textPart = part as { type: "text"; text: string }
                return (
                  <Typewriter
                    key={key}
                    text={textPart.text}
                    mode={isLoading && isLastMessage ? "stream" : "static"}
                    markdown
                    markdownComponents={markdownComponents}
                  />
                )
              }

              if (partAny.type === "reasoning") {
                return null
              }

              return renderToolPart(partAny, key)
            })}
          </div>

          {showFollowUps && (
            <div className="mt-3 flex flex-wrap gap-2">
              {followUps.slice(0, 3).map((question) => {
                const displayText =
                  question.length > 50
                    ? `${question.slice(0, 47)}...`
                    : question
                return (
                  <button
                    key={question}
                    type="button"
                    onClick={() => onFollowUpClick?.(question)}
                    title={question}
                    className="hover:border-illini-blue hover:bg-illini-blue rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    💡 {displayText}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
