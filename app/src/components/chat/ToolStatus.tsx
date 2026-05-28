/**
 * @file ./src/components/chat/ToolStatus.tsx
 * @description Chat (AI) Component / Module
 */

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

const TOOL_LABELS: Record<string, string> = {
  search_knowledge_base: "Searching knowledge base...",
  web_search: "Searching the web...",
  grep_docs: "Looking up documents...",
  custom_skills: "Running skill...",
}

function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? `Running ${toolName}...`
}

export interface ToolStatusProps {
  toolName?: string
  status: "searching" | "done" | "idle"
  summary?: string
}

export const ToolStatus: React.FC<ToolStatusProps> = ({
  toolName,
  status,
  summary,
}) => {
  const [visible, setVisible] = useState(false)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (status === "searching") {
      setVisible(true)
      if (fadeTimer.current) {
        clearTimeout(fadeTimer.current)
      }
    } else if (status === "done") {
      fadeTimer.current = setTimeout(() => setVisible(false), 1800)
    } else {
      setVisible(false)
    }

    return () => {
      if (fadeTimer.current) {
        clearTimeout(fadeTimer.current)
      }
    }
  }, [status])

  const label =
    status === "done"
      ? (summary ??
        (toolName ? `Done: ${TOOL_LABELS[toolName] ?? toolName}` : "Done"))
      : toolName
        ? getToolLabel(toolName)
        : "Working..."

  return (
    <div aria-live="polite" data-testid="tool-status">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mb-2 flex items-center gap-1.5"
          >
            {status === "searching" ? (
              <motion.div
                className="border-illini-orange size-3 rounded-full border-2 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                aria-hidden="true"
              />
            ) : (
              <svg
                className="size-3 shrink-0 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span className="text-xs text-slate-400">{label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
