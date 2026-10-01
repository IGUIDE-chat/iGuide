import { AnimatePresence, motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

import { Language } from "../../types"
import { BrandMark } from "../ui/branding/BrandMark"

interface Suggestion {
  icon: string
  text: string
}

interface ChatEmptyStateProps {
  language: Language
  title: string
  subtitle: string
  suggestions: Suggestion[]
  containerClass: string
  onSuggestionClick: (text: string) => void
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  language,
  title,
  subtitle,
  suggestions,
  containerClass,
  onSuggestionClick,
}) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={language}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex w-full flex-col items-center"
        >
          <BrandMark
            className="mb-5 size-12 rounded-2xl shadow-lg shadow-orange-500/20"
            iconClassName="text-[1.6rem]"
          />
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 mb-8 max-w-md text-center text-sm/relaxed text-slate-500">
            {subtitle}
          </p>

          <div className={containerClass}>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={`${suggestion.text}-${index}`}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: 0.05 + index * 0.05 }}
                  onClick={() => onSuggestionClick(suggestion.text)}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 text-left text-sm text-slate-700 shadow-xs backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg transition-colors group-hover:bg-orange-50">
                    {suggestion.icon}
                  </span>
                  <span className="flex-1">{suggestion.text}</span>
                  <ArrowUpRight className="group-hover:text-illini-orange size-4 shrink-0 text-slate-300 transition-all" />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
