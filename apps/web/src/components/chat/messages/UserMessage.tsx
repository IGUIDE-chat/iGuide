import { ActionBarPrimitive, MessagePrimitive } from "@assistant-ui/react"

import { MessageCopyButton } from "./MessageCopyButton"

interface UserMessageProps {
  userRole?: string
  copyLabel: string
}

export function UserMessage({ userRole = "You", copyLabel }: UserMessageProps) {
  return (
    <MessagePrimitive.Root className="group/msg flex w-full py-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-end px-4">
        <span className="sr-only">{userRole}</span>
        <div className="bg-illini-blue max-w-[85%] rounded-3xl rounded-br-lg px-4 py-2.5 text-[15px] leading-relaxed wrap-break-word whitespace-pre-wrap text-white shadow-sm sm:max-w-[75%]">
          <MessagePrimitive.Parts />
        </div>
        <ActionBarPrimitive.Root className="mt-1 flex items-center transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover/msg:opacity-100">
          <MessageCopyButton label={copyLabel} />
        </ActionBarPrimitive.Root>
      </div>
    </MessagePrimitive.Root>
  )
}
