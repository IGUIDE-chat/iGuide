/**
 * @file ./src/components/chat/ThinkingProcess.tsx
 * @description Chat (AI) Component / Module
 * @description_zh 此文件属于 Chat 业务域。展示 AI 思考过程的可折叠组件。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { type ThinkingStep } from "../../types"

interface ThinkingProcessProps {
  steps: ThinkingStep[]
  isThinking: boolean
  language?: "en" | "zh"
}

const stepIcons: Record<ThinkingStep["type"], string> = {
  reasoning: "💭",
  searching: "🔍",
  tool_call: "⚙️",
  processing: "📝",
}

const ThinkingDots = () => (
  <span className="ml-1 inline-flex items-center gap-0.5">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="bg-illini-orange size-1 rounded-full"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </span>
)

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({
  steps,
  isThinking,
  language = "zh",
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const wasThinking = useRef(true)

  // Auto-collapse after thinking completes
  useEffect(() => {
    if (wasThinking.current && !isThinking) {
      const timer = setTimeout(() => {
        setIsExpanded(false)
      }, 1500)
      return () => {
        clearTimeout(timer)
      }
    }
    wasThinking.current = isThinking
  }, [isThinking])

  if (steps.length === 0 && !isThinking) {
    return null
  }

  const latestStep = steps.at(-1)
  const thinkingLabel = language === "zh" ? "思考中" : "Thinking"
  const doneLabel = language === "zh" ? "思考完成" : "Done thinking"

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => {
          setIsExpanded(!isExpanded)
        }}
        aria-expanded={isExpanded}
        className="group flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-700"
      >
        {isThinking ? (
          <motion.div
            className="border-illini-orange size-3.5 rounded-full border-2 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <svg
            className="size-3.5 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span className="font-medium">
          {isThinking ? thinkingLabel : doneLabel}
        </span>
        {isThinking && latestStep && (
          <span className="text-slate-400">
            · {latestStep.label}
            <ThinkingDots />
          </span>
        )}
        <svg
          className={`size-3 transition-transform ${isExpanded ? "rotate-180" : ""} `}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && steps.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 ml-1 space-y-1.5 border-l-2 border-slate-200 pl-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-start gap-1.5 text-xs text-slate-500"
                >
                  <span className="mt-px shrink-0">{stepIcons[step.type]}</span>
                  <div className="min-w-0">
                    <span
                      className={
                        step.done ? "text-slate-400" : "text-slate-600"
                      }
                    >
                      {step.label}
                    </span>
                    {step.detail && (
                      <p className="mt-0.5 max-w-md truncate text-slate-400">
                        {step.detail}
                      </p>
                    )}
                  </div>
                  {!step.done && isThinking && index === steps.length - 1 && (
                    <ThinkingDots />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
