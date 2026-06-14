/**
 * @file ./src/components/chat/messages/UserMessage.tsx
 * @description Chat (AI) Component / Module
 */

import { ActionBarPrimitive, MessagePrimitive } from "@assistant-ui/react";

interface UserMessageProps {
  userRole?: string;
  editLabel?: string;
}

export function UserMessage({
  userRole = "You",
  editLabel = "Edit",
}: UserMessageProps) {
  return (
    <MessagePrimitive.Root className="flex w-full border-b border-transparent py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-row-reverse gap-4 px-4">
        <div className="relative flex shrink-0 flex-col items-end">
          <div
            className="
              flex size-6 items-center justify-center rounded-lg bg-slate-200
              text-slate-500
            "
          >
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

        <div className="group flex flex-1 flex-col items-end overflow-hidden pt-0.5">
          <div className="mb-1 text-xs font-semibold text-slate-900">
            {userRole}
          </div>
          <div
            className="
              prose prose-slate prose-sm max-w-none leading-relaxed
              whitespace-pre-wrap text-slate-800
            "
          >
            <MessagePrimitive.Parts />
          </div>

          <ActionBarPrimitive.Root
            hideWhenRunning
            autohide="not-last"
            className="mt-1 flex"
          >
            <ActionBarPrimitive.Edit
              aria-label={editLabel}
              title={editLabel}
              className="
                rounded-md p-1.5 text-slate-400 transition-colors
                hover:bg-slate-100 hover:text-slate-700
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </ActionBarPrimitive.Edit>
          </ActionBarPrimitive.Root>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}
