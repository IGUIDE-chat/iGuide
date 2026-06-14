/**
 * @file ./src/components/chat/adapters/ImeSafeComposerTextarea.tsx
 * @description Chat (AI) Component / Module
 *
 * A textarea that defers committing IME composition (e.g. Pinyin / Japanese
 * input) so in-progress characters are not lost while the composer's
 * controlled value updates. Shared by the main composer and the edit composer.
 */

import * as React from "react";

const toTextareaValue = (
  value: React.TextareaHTMLAttributes<HTMLTextAreaElement>["value"]
) => {
  if (Array.isArray(value)) {
    return value.join(",");
  }

  return value?.toString() ?? "";
};

const isNativeInputComposing = (
  event: React.ChangeEvent<HTMLTextAreaElement>
) => event.nativeEvent instanceof InputEvent && event.nativeEvent.isComposing;

export const ImeSafeComposerTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(
  (
    { onChange, onCompositionEnd, onCompositionStart, value, ...props },
    ref
  ) => {
    const isComposingRef = React.useRef(false);
    const [compositionValue, setCompositionValue] = React.useState("");
    const controlledValue = toTextareaValue(value);

    const handleCompositionStart = (
      event: React.CompositionEvent<HTMLTextAreaElement>
    ) => {
      isComposingRef.current = true;
      setCompositionValue(event.currentTarget.value);
      onCompositionStart?.(event);
    };

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isComposingRef.current || isNativeInputComposing(event)) {
        setCompositionValue(event.currentTarget.value);
      }

      onChange?.(event);
    };

    const handleCompositionEnd = (
      event: React.CompositionEvent<HTMLTextAreaElement>
    ) => {
      isComposingRef.current = false;
      setCompositionValue(event.currentTarget.value);
      onCompositionEnd?.(event);
    };

    return (
      <textarea
        {...props}
        ref={ref}
        value={isComposingRef.current ? compositionValue : controlledValue}
        onChange={handleChange}
        onCompositionEnd={handleCompositionEnd}
        onCompositionStart={handleCompositionStart}
      />
    );
  }
);

ImeSafeComposerTextarea.displayName = "ImeSafeComposerTextarea";
