/**
 * @file ./src/components/chat/ChatComposer.tsx
 * @description Chat (AI) Component / Module
 * @description_zh 此文件属于 Chat 业务域。请保持业务内聚，不要随意挂载到全局域。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

interface ChatComposerProps {
  input: string;
  isLoading: boolean;
  placeholder: string;
  helperText: string;
  containerClass: string;
  onInputChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onStop?: () => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  input,
  isLoading,
  placeholder,
  helperText,
  containerClass,
  onInputChange,
  onSubmit,
  onStop,
}) => {
  return (
    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-2 pb-6">
      <div className={containerClass}>
        <form
          onSubmit={onSubmit}
          className="relative shadow-md rounded-[26px] border border-slate-200 bg-white focus-within:ring-1 focus-within:ring-slate-300 overflow-hidden transition-all"
        >
          <input
            className="w-full py-3.5 pl-5 pr-12 text-base text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent resize-none"
            placeholder={placeholder}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            disabled={isLoading}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              title="Stop"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
            >
              {/* Gray × icon */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                !input.trim()
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  : 'bg-black text-white hover:opacity-80'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </button>
          )}
        </form>
        <div className="hidden md:block text-center mt-3 text-xs text-slate-400">{helperText}</div>
      </div>
    </div>
  );
};
