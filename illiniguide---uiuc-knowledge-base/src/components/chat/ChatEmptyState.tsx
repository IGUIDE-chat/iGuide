import { AnimatePresence, motion } from 'framer-motion';
import { Language } from '../../types';

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
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={language}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full flex flex-col items-center"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-xl border border-slate-100">
              🎗
            </div>
            <h2 className="text-2xl font-semibold text-slate-800 text-center tracking-tight">
              {title}
            </h2>
          </div>

          <div className={containerClass}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.text}-${index}`}
                  onClick={() => onSuggestionClick(suggestion.text)}
                  className="p-3 border border-slate-200 rounded-2xl hover:bg-slate-50 text-left text-sm text-slate-600 transition-colors shadow-sm hover:shadow-md"
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
