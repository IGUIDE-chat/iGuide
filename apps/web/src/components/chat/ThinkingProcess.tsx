import { AnimatePresence, motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

import { ThinkingStep } from "../../types"
import { TextShimmer } from "../ui/TextShimmer"

interface ThinkingProcessProps {
  steps: ThinkingStep[]
  isThinking: boolean
  /** When the reply started (ms since epoch); enables timings. */
  startedAt?: number
  /** When the first reply text arrived (ms since epoch). */
  endedAt?: number
  language?: "en" | "zh"
}

const formatDuration = (ms: number) => {
  const clamped = Math.max(0, ms)
  if (clamped < 10_000) return `${(clamped / 1000).toFixed(1)}s`
  if (clamped < 60_000) return `${Math.round(clamped / 1000)}s`
  const minutes = Math.floor(clamped / 60_000)
  const seconds = Math.round((clamped % 60_000) / 1000)
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`
}

/** Current time, re-read every 100ms while `active` (for the live timer). */
const useNow = (active: boolean) => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(timer)
  }, [active])
  return now
}

const Duration = ({ ms }: { ms: number }) => (
  <span className="shrink-0 text-slate-400 tabular-nums">{formatDuration(ms)}</span>
)

// Collapsed by default: one line showing the current step (with a live timer)
// while thinking, and a step count plus total time once done. Expanding
// reveals each step with how long it took to reach it.
export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({
  steps,
  isThinking,
  startedAt,
  endedAt,
  language = "zh",
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const now = useNow(isThinking && startedAt !== undefined)

  if (steps.length === 0 && !isThinking) return null

  const zh = language === "zh"
  const currentLabel = steps[steps.length - 1]?.label ?? (zh ? "思考中..." : "Thinking...")
  const doneLabel = zh
    ? `已思考 ${steps.length} 步`
    : `Thought for ${steps.length} step${steps.length === 1 ? "" : "s"}`

  // Steps are stamped when they are emitted (e.g. "knowledge base retrieved"
  // arrives once retrieval finishes), so a step's cost is the gap since the
  // previous event. The initial placeholder step is stamped at startedAt.
  const stepDurations = steps.map((step, index) => {
    const previous = index === 0 ? startedAt : steps[index - 1].timestamp
    if (previous === undefined || step.timestamp === startedAt) return undefined
    return step.timestamp - previous
  })
  const lastStepAt = steps[steps.length - 1]?.timestamp ?? startedAt
  const draftingMs =
    endedAt !== undefined && lastStepAt !== undefined ? endedAt - lastStepAt : undefined
  const totalMs =
    startedAt === undefined ? undefined : (isThinking ? now : (endedAt ?? now)) - startedAt

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
        {totalMs !== undefined && (isThinking || endedAt !== undefined) && (
          <span className="shrink-0 tabular-nums">· {formatDuration(totalMs)}</span>
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
            className="mt-1 max-w-md space-y-1 overflow-hidden border-l border-slate-200 pl-3 text-[13px] text-slate-500"
          >
            {steps.map((step, index) => (
              <li key={step.id} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0">
                  {step.label}
                  {step.detail && <span className="ml-1.5 text-slate-400">{step.detail}</span>}
                </span>
                {stepDurations[index] !== undefined && <Duration ms={stepDurations[index]} />}
              </li>
            ))}
            {!isThinking && draftingMs !== undefined && (
              <li className="flex items-baseline justify-between gap-3">
                <span>{zh ? "生成回答" : "Drafting the answer"}</span>
                <Duration ms={draftingMs} />
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
