import { AnimatePresence, motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { useState } from "react"

import { ThinkingStep } from "../../types"
import { TextShimmer } from "../ui/TextShimmer"

interface ThinkingProcessProps {
  steps: ThinkingStep[]
  isThinking: boolean
  language?: "en" | "zh"
}

// Collapsed by default: one line showing the current step while thinking,
// and a step count once done. Expanding reveals the full step list.
export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({
  steps,
  isThinking,
  language = "zh",
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (steps.length === 0 && !isThinking) return null

  const zh = language === "zh"
  const currentLabel = steps[steps.length - 1]?.label ?? (zh ? "思考中..." : "Thinking...")
  const doneLabel = zh
    ? `已思考 ${steps.length} 步`
    : `Thought for ${steps.length} step${steps.length === 1 ? "" : "s"}`

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        disabled={steps.length === 0}
        className="group flex max-w-full items-center gap-1 py-0.5 text-[13px] text-slate-400 transition-colors hover:text-slate-700"
      >
        {isThinking ? (
          <TextShimmer className="truncate">{currentLabel}</TextShimmer>
        ) : (
          <span className="truncate">{doneLabel}</span>
        )}
        <ChevronRight
          className={`size-3.5 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""} `}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && steps.length > 0 && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1 space-y-1 overflow-hidden border-l border-slate-200 pl-3 text-[13px] text-slate-500"
          >
            {steps.map((step) => (
              <li key={step.id}>
                {step.label}
                {step.detail && <span className="ml-1.5 text-slate-400">{step.detail}</span>}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
