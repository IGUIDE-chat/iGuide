import { ArrowUp, Loader2 } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"

interface ChatComposerProps {
  placeholder: string
  hint: string
  /** A reply is streaming; sending is blocked until it finishes. */
  isRunning: boolean
  onSend: (text: string) => void
}

/**
 * Auto-growing input with a send button that turns into a spinner while a
 * reply is running. Enter sends and Shift + Enter adds a line; an Enter that
 * confirms an IME candidate (e.g. pinyin) is left to the IME. The textarea
 * grows with its content via `field-sizing: content`, capped at ~8 lines.
 */
export const ChatComposer = ({ placeholder, hint, isRunning, onSend }: ChatComposerProps) => {
  const [value, setValue] = React.useState("")
  const canSend = !isRunning && value.trim().length > 0

  const submit = () => {
    if (!canSend) return
    onSend(value)
    setValue("")
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    submit()
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="relative flex flex-col rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)] transition-[border-color,box-shadow] focus-within:border-slate-300 focus-within:shadow-[0_8px_30px_-10px_rgba(15,23,42,0.28)]"
    >
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus
        rows={1}
        className="field-sizing-content max-h-52 min-h-10 w-full resize-none bg-transparent px-3 pt-2 pb-1 text-[15px] leading-relaxed text-slate-900 placeholder-slate-400 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-2 pl-3">
        <span className="hidden truncate text-[11px] text-slate-400 md:block">{hint}</span>
        <div className="ml-auto">
          {isRunning ? (
            <div
              className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-400"
              role="status"
              aria-label="Generating"
            >
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : (
            <Button
              type="submit"
              size="icon"
              aria-label="Send"
              disabled={!canSend}
              className="hover:bg-illini-orange size-9 rounded-full bg-slate-900 text-white active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 disabled:opacity-100"
            >
              <ArrowUp className="size-4.5" strokeWidth={2.5} />
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
