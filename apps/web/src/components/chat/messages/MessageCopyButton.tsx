import { ActionBarPrimitive } from "@assistant-ui/react"
import { Check, Copy } from "lucide-react"

interface MessageCopyButtonProps {
  label: string
}

// ActionBarPrimitive.Copy sets `data-copied` for a moment after copying
export const MessageCopyButton = ({ label }: MessageCopyButtonProps) => (
  <ActionBarPrimitive.Copy
    copiedDuration={1500}
    aria-label={label}
    title={label}
    className="group/copy flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
  >
    <Copy className="size-3.5 group-data-copied/copy:hidden" />
    <Check className="hidden size-3.5 text-emerald-500 group-data-copied/copy:block" />
  </ActionBarPrimitive.Copy>
)
