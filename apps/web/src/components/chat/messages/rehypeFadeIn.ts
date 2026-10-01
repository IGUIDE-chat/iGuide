// Gemini-style reveal: wrap each text segment (one CJK character, or one run
// of non-CJK text such as a word) in <span class="fade-seg">. A CSS animation
// fades a span in when it first mounts. React keeps the DOM nodes of text that
// is already on screen, so only newly streamed segments animate.

type HastNode = {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

const SKIP_TAGS = new Set(["code", "pre", "script", "style"])

// CJK ideographs, kana, hangul, full-width forms and CJK punctuation
const CJK = "\\u2E80-\\u9FFF\\uAC00-\\uD7AF\\uF900-\\uFAFF\\uFE30-\\uFE4F\\uFF00-\\uFFEF"
const SEGMENT = new RegExp(`[${CJK}]|[^\\s${CJK}]+|\\s+`, "g")
const WHITESPACE = /^\s+$/

const toSegments = (value: string): HastNode[] =>
  (value.match(SEGMENT) ?? []).map((part) =>
    WHITESPACE.test(part)
      ? { type: "text", value: part }
      : {
          type: "element",
          tagName: "span",
          properties: { className: ["fade-seg"] },
          children: [{ type: "text", value: part }],
        },
  )

const wrapText = (node: HastNode) => {
  if (!node.children) return
  node.children = node.children.flatMap((child) => {
    if (child.type === "text" && child.value) return toSegments(child.value)
    if (child.type === "element" && SKIP_TAGS.has(child.tagName ?? "")) {
      return [child]
    }
    wrapText(child)
    return [child]
  })
}

export const rehypeFadeIn = () => (tree: HastNode) => {
  wrapText(tree)
}
