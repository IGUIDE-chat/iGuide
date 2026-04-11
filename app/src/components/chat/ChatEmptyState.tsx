/**
 * @file ./src/components/chat/ChatEmptyState.tsx
 * @description Chat (AI) Component / Module
 * @description_zh 此文件属于 Chat 业务域。请保持业务内聚，不要随意挂载到全局域。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Language } from "../../types";
import { BrandMark } from "../ui/branding/BrandMark";

interface Suggestion {
  icon: string;
  text: string;
}

interface ChatEmptyStateProps {
  language: Language;
  title: string;
  suggestions: Suggestion[];
  containerClass: string;
  onSuggestionClick: (text: string) => void;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  language,
  title,
  suggestions,
  containerClass,
  onSuggestionClick,
}) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={language}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex w-full flex-col items-center"
        >
          <div className="mb-8 flex items-center gap-3">
            <BrandMark
              className="size-10 rounded-xl"
              iconClassName="text-[1.4rem]"
            />
            <h2
              className="
                text-center text-2xl font-semibold tracking-tight text-slate-800
              "
            >
              {title}
            </h2>
          </div>

          <div className={containerClass}>
            <div
              className="
                grid grid-cols-1 gap-2.5
                sm:grid-cols-2
              "
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.text}-${index}`}
                  onClick={() => onSuggestionClick(suggestion.text)}
                  className="
                    rounded-2xl border border-slate-200 p-3 text-left text-sm
                    text-slate-600 shadow-sm transition-colors
                    hover:bg-slate-50 hover:shadow-md
                  "
                >
                  <span className="mr-2.5 text-base">{suggestion.icon}</span>
                  {suggestion.text}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
