/**
 * @file ./src/components/chat/messages/UserMessage.tsx
 * @description Chat (AI) Component / Module
 */

import * as React from "react"
import { type UIMessage } from "ai"
import { Pencil } from "lucide-react"
import { ImeSafeTextarea } from "../ImeSafeTextarea"
import { ChatSessionContext } from "../ChatRuntimeProvider"

interface UserMessageProps {
  message: UIMessage
  userRole?: string
}

const extractText = (message: UIMessage): string =>
  message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")

export function UserMessage({ message, userRole = "You" }: UserMessageProps) {
  const ctx = React.useContext(ChatSessionContext)
  const text = extractText(message)

  const [isEditing, setIsEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(text)
  const [locallyEdited, setLocallyEdited] = React.useState(false)

  const editingDisabled = ctx?.isLoading ?? false

  const enterEdit = () => {
    setDraft(text)
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setDraft(text)
  }

  const saveEdit = async () => {
    const next = draft.trim()
    if (!next || next === text) {
      cancelEdit()
      return
    }
    setIsEditing(false)
    setLocallyEdited(true)
    if (ctx?.editAndRegenerate) {
      await ctx.editAndRegenerate(message.id, next)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void saveEdit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelEdit()
    }
  }

  return (
    <div className="group flex w-full border-b border-transparent py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-row-reverse gap-4 px-4">
        <div className="relative flex shrink-0 flex-col items-end">
          <div className="flex size-6 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-4"
              aria-label="User"
            >
              <path
                fillRule="evenodd"
                d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-end overflow-hidden pt-0.5">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-900">
            {locallyEdited && (
              <span className="font-normal text-slate-400">(edited)</span>
            )}
            <span>{userRole}</span>
          </div>

          {isEditing ? (
            <div className="flex w-full flex-col items-stretch gap-2">
              <ImeSafeTextarea
                ref={(el) => {
                  el?.focus()
                }}
                value={draft}
                onChange={(e) => setDraft(e.currentTarget.value)}
                onKeyDown={handleKeyDown}
                rows={Math.min(8, Math.max(2, draft.split("\n").length))}
                className="w-full resize-none rounded-lg border border-slate-300 bg-white p-3 text-sm leading-relaxed text-slate-800 shadow-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={!draft.trim() || draft.trim() === text}
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Save & Regenerate
                </button>
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-row-reverse items-start gap-2">
              <div className="prose prose-slate prose-sm max-w-none leading-relaxed whitespace-pre-wrap text-slate-800">
                {text}
              </div>
              {!editingDisabled && (
                <button
                  type="button"
                  onClick={enterEdit}
                  aria-label="Edit message"
                  title="Edit message"
                  className="mt-0.5 shrink-0 rounded-md p-1.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-700 focus:opacity-100 focus:outline-none"
                >
                  <Pencil className="size-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
