import * as React from "react"
import Markdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

import type { MessageSource } from "../../../types"
import { CodeBlockHeader, CodeBlockPre } from "../../ui/CodeBlock"
import { MarkdownContext } from "./markdownContext"
import { rehypeFadeIn } from "./rehypeFadeIn"
import { SourceCitation } from "./SourceCitation"
import { findSourceIndex, normalizeUrl } from "./sourceUtils"

type HastNode = {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

const hastText = (node: HastNode): string =>
  node.type === "text" ? (node.value ?? "") : (node.children ?? []).map(hastText).join("")

/** A link to one of the reply's sources becomes a numbered citation. */
const MarkdownLink: Components["a"] = ({ node, href, children, ...props }) => {
  const { sources } = React.useContext(MarkdownContext)
  const index = href ? findSourceIndex(sources, href) : -1

  if (href && index >= 0) {
    // A bare URL (or a link whose text is its URL) says nothing beyond the
    // number. Read the text from the hast node: rehypeFadeIn has already split
    // `children` into spans.
    const text = node ? hastText(node as HastNode) : ""
    const isBareUrl = normalizeUrl(text) === normalizeUrl(href)
    return (
      <SourceCitation
        source={sources[index]}
        index={index}
        label={isBareUrl ? undefined : children}
      />
    )
  }

  return (
    <a
      {...props}
      href={href}
      className="text-illini-orange font-medium underline-offset-2 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )
}

/** Fenced code: a header (language + copy) above the block. */
const MarkdownPre: Components["pre"] = ({ node, children: _children, ...props }) => {
  const { copyLabel, copiedLabel } = React.useContext(MarkdownContext)
  const codeNode = (node as HastNode | undefined)?.children?.find(
    (child) => child.type === "element" && child.tagName === "code",
  )
  const classNames = codeNode?.properties?.className
  const languageClass = Array.isArray(classNames)
    ? classNames.map(String).find((name) => name.startsWith("language-"))
    : undefined
  const code = codeNode ? hastText(codeNode).replace(/\n$/, "") : ""

  // The block's own <code> is rendered here, so the `code` renderer below only
  // ever sees inline code.
  return (
    <>
      <CodeBlockHeader
        code={code}
        language={languageClass?.slice("language-".length)}
        copyLabel={copyLabel}
        copiedLabel={copiedLabel}
      />
      <CodeBlockPre {...props}>
        <code className={languageClass}>{code}</code>
      </CodeBlockPre>
    </>
  )
}

const components: Components = {
  a: MarkdownLink,
  pre: MarkdownPre,
  code: ({ node: _node, ...props }) => <code className="text-illini-blue font-mono" {...props} />,
  table: ({ node: _node, ...props }) => (
    <div className="table-frame">
      <table {...props} />
    </div>
  ),
  img: ({ node: _node, alt, ...props }) => (
    <img
      {...props}
      alt={alt ?? ""}
      className="my-2 h-auto max-w-full rounded-xl border border-slate-200 shadow-sm"
      loading="lazy"
    />
  ),
}

const remarkPlugins = [remarkGfm]
const rehypePlugins = [rehypeFadeIn]

interface MarkdownContentProps {
  text: string
  /** While true, newly arrived text fades in (see `.fade-seg` in index.css). */
  isStreaming: boolean
  sources: readonly MessageSource[]
  copyLabel: string
  copiedLabel: string
}

/**
 * Renders a reply's markdown. rehypeFadeIn plus the `.fade-seg` animation make
 * each newly streamed segment fade in instead of popping in.
 */
export const MarkdownContent = ({
  text,
  isStreaming,
  sources,
  copyLabel,
  copiedLabel,
}: MarkdownContentProps) => {
  const context = React.useMemo(
    () => ({ copyLabel, copiedLabel, sources }),
    [copyLabel, copiedLabel, sources],
  )

  return (
    <MarkdownContext.Provider value={context}>
      <div
        className="prose max-w-none text-[15px] text-slate-800"
        data-status={isStreaming ? "running" : "complete"}
      >
        <Markdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={components}
        >
          {text}
        </Markdown>
      </div>
    </MarkdownContext.Provider>
  )
}
