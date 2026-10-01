import { AuiIf, ComposerPrimitive } from "@assistant-ui/react"
import { ArrowUp, Loader2 } from "lucide-react"
import * as React from "react"

interface ChatComposerProps {
  placeholder: string
  hint: string
}

const toTextareaValue = (value: React.TextareaHTMLAttributes<HTMLTextAreaElement>["value"]) => {
  if (Array.isArray(value)) {
    return value.join(",")
  }

  return value?.toString() ?? ""
}

const isNativeInputComposing = (event: React.ChangeEvent<HTMLTextAreaElement>) =>
  event.nativeEvent instanceof InputEvent && event.nativeEvent.isComposing

const ImeSafeComposerTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ onChange, onCompositionEnd, onCompositionStart, value, ...props }, ref) => {
  const isComposingRef = React.useRef(false)
  const [compositionValue, setCompositionValue] = React.useState("")
  const controlledValue = toTextareaValue(value)

  const handleCompositionStart = (event: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = true
    setCompositionValue(event.currentTarget.value)
    onCompositionStart?.(event)
  }

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isComposingRef.current || isNativeInputComposing(event)) {
      setCompositionValue(event.currentTarget.value)
    }

    onChange?.(event)
  }

  const handleCompositionEnd = (event: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false
    setCompositionValue(event.currentTarget.value)
    onCompositionEnd?.(event)
  }

  return (
    <textarea
      {...props}
      ref={ref}
      value={isComposingRef.current ? compositionValue : controlledValue}
      onChange={handleChange}
      onCompositionEnd={handleCompositionEnd}
      onCompositionStart={handleCompositionStart}
    />
  )
})

ImeSafeComposerTextarea.displayName = "ImeSafeComposerTextarea"

const sendButtonClass =
  "flex size-9 shrink-0 items-center justify-center rounded-full transition-all"

/**
 * Auto-growing input with a send button that turns into a spinner while a
 * reply is running. The textarea is IME-safe (see ImeSafeComposerTextarea) and
 * grows with its content via `field-sizing: content`, capped at ~8 lines.
 */
export const ChatComposer = ({ placeholder, hint }: ChatComposerProps) => (
  <ComposerPrimitive.Root className="relative flex flex-col rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)] transition-all focus-within:border-slate-300 focus-within:shadow-[0_8px_30px_-10px_rgba(15,23,42,0.28)]">
    <ComposerPrimitive.Input
      placeholder={placeholder}
      autoFocus
      className="field-sizing-content max-h-52 min-h-10 w-full resize-none bg-transparent px-3 pt-2 pb-1 text-[15px] leading-relaxed text-slate-900 placeholder-slate-400 focus:outline-none"
      render={<ImeSafeComposerTextarea />}
      rows={1}
    />
    <div className="flex items-center justify-between gap-2 pl-3">
      <span className="hidden truncate text-[11px] text-slate-400 md:block">{hint}</span>
      <div className="ml-auto">
        <AuiIf condition={(s) => !s.thread.isRunning}>
          <ComposerPrimitive.Send
            aria-label="Send"
            className={`${sendButtonClass} hover:bg-illini-orange bg-slate-900 text-white active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300`}
          >
            <ArrowUp className="size-4.5" strokeWidth={2.5} />
          </ComposerPrimitive.Send>
        </AuiIf>
        <AuiIf condition={(s) => s.thread.isRunning}>
          <div
            className={`${sendButtonClass} bg-slate-100 text-slate-400`}
            role="status"
            aria-label="Generating"
          >
            <Loader2 className="size-4 animate-spin" />
          </div>
        </AuiIf>
      </div>
    </div>
  </ComposerPrimitive.Root>
)
