import * as React from "react"

import type { MessageSource } from "../../../types"

interface MarkdownContextValue {
  copyLabel: string
  copiedLabel: string
  /** The reply's sources; links to them render as numbered citations. */
  sources: readonly MessageSource[]
}

// Per-reply values reach the markdown element renderers through context, so
// the `components` map handed to react-markdown can stay a stable module
// constant. A new map would remount every element on each streamed update and
// replay the fade-in of text already on screen.
export const MarkdownContext = React.createContext<MarkdownContextValue>({
  copyLabel: "Copy",
  copiedLabel: "Copied",
  sources: [],
})
