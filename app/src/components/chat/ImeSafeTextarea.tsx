/**
 * @file ./src/components/chat/ImeSafeTextarea.tsx
 * @description IME-safe controlled textarea — keeps composition (CJK, Korean,
 *   etc.) buffer in local state so React's controlled value never overwrites
 *   the in-progress composition characters mid-input.
 */

import * as React from "react"

const toTextareaValue = (
  value: React.TextareaHTMLAttributes<HTMLTextAreaElement>["value"]
) => {
  if (Array.isArray(value)) {
    return value.join(",")
  }

  return value?.toString() ?? ""
}

const isNativeInputComposing = (
  event: React.ChangeEvent<HTMLTextAreaElement>
) => event.nativeEvent instanceof InputEvent && event.nativeEvent.isComposing

export const ImeSafeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(
  (
    { onChange, onCompositionEnd, onCompositionStart, value, ...props },
    ref
  ) => {
    const isComposingRef = React.useRef(false)
    const [compositionValue, setCompositionValue] = React.useState("")
    const controlledValue = toTextareaValue(value)

    const handleCompositionStart = (
      event: React.CompositionEvent<HTMLTextAreaElement>
    ) => {
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

    const handleCompositionEnd = (
      event: React.CompositionEvent<HTMLTextAreaElement>
    ) => {
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
  }
)

ImeSafeTextarea.displayName = "ImeSafeTextarea"

export default ImeSafeTextarea
