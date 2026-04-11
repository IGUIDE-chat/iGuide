/**
 * @file ./src/components/chat/messages/UserMessage.tsx
 * @description Chat (AI) Component / Module
 */

import { MessagePrimitive } from "@assistant-ui/react";

interface UserMessageProps {
  userRole?: string;
}

export function UserMessage({ userRole = "You" }: UserMessageProps) {
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

        <div className="flex flex-1 flex-col items-end overflow-hidden pt-0.5">
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
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}
