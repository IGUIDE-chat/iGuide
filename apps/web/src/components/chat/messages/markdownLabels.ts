import * as React from "react"

interface CodeLabels {
  copyLabel: string
  copiedLabel: string
}

// Copy labels reach the code header through context so the `Text` part
// component passed to MessagePrimitive.Parts can stay a stable module export.
export const MarkdownLabelsContext = React.createContext<CodeLabels>({
  copyLabel: "Copy",
  copiedLabel: "Copied",
})
