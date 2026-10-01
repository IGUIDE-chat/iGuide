import { Check, Copy } from "lucide-react"
// [COMPONENT] Code block parts: a header (language label + copy button) and a
// body. Rendered as siblings so markdown renderers can slot them in separately.
// [组件] 代码块：头部（语言标签 + 复制按钮）和代码主体，两部分相邻渲染。
import React from "react"

interface CodeBlockHeaderProps {
  code: string
  language?: string
  copyLabel?: string
  copiedLabel?: string
}

export const CodeBlockHeader: React.FC<CodeBlockHeaderProps> = ({
  code,
  language,
  copyLabel = "Copy",
  copiedLabel = "Copied",
}) => {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = () => {
    void navigator.clipboard.writeText(code).then(() => setCopied(true))
  }

  return (
    <div className="code-block-header mt-3 flex items-center justify-between rounded-t-xl border border-slate-200 bg-white px-3 py-1.5">
      <span className="font-mono text-[11px] text-slate-500 lowercase">
        {language && language !== "unknown" ? language : "text"}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
      >
        {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  )
}

// Placed directly after CodeBlockHeader; index.css squares its top corners.
export const CodeBlockPre: React.FC<React.ComponentPropsWithoutRef<"pre">> = ({
  className = "",
  ...props
}) => <pre className={`code-block-pre ${className} `} {...props} />
