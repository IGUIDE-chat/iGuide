import {
  MarkdownTextPrimitive,
  type CodeHeaderProps,
  type MarkdownTextPrimitiveProps,
} from "@assistant-ui/react-markdown"
import * as React from "react"
import remarkGfm from "remark-gfm"

import { CodeBlockHeader, CodeBlockPre } from "../../ui/CodeBlock"
import { MarkdownLabelsContext } from "./markdownLabels"
import { rehypeFadeIn } from "./rehypeFadeIn"

type MarkdownComponents = NonNullable<MarkdownTextPrimitiveProps["components"]>

const CodeHeader = ({ language, code }: CodeHeaderProps) => {
  const labels = React.useContext(MarkdownLabelsContext)
  return <CodeBlockHeader code={code} language={language} {...labels} />
}

const components: MarkdownComponents = {
  a: ({ node: _node, ...props }) => (
    <a
      {...props}
      className="text-illini-orange font-medium underline-offset-2 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  pre: ({ node: _node, ...props }) => <CodeBlockPre {...props} />,
  CodeHeader,
  // Only inline code reaches here; fenced code goes through CodeHeader + pre
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

/**
 * `Text` part renderer for MessagePrimitive.Parts. assistant-ui paces the
 * streamed text evenly; rehypeFadeIn + the .fade-seg CSS animation make each
 * newly revealed segment fade in (Gemini-style) instead of popping in.
 */
export const MarkdownText = () => (
  <MarkdownTextPrimitive
    className="prose max-w-none text-[15px] text-slate-800"
    remarkPlugins={remarkPlugins}
    rehypePlugins={rehypePlugins}
    components={components}
  />
)
