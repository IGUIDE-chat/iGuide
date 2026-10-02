import { Check, Copy } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"

interface MessageCopyButtonProps {
  text: string
  label: string
}

/** Copies a message; shows a check mark for a moment afterwards. */
export const MessageCopyButton = ({ text, label }: MessageCopyButtonProps) => {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => void navigator.clipboard.writeText(text).then(() => setCopied(true))}
      className="size-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
    </Button>
  )
}
