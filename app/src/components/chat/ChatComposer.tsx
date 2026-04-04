/**
 * @file ./src/components/chat/ChatComposer.tsx
 * @description Chat (AI) Component / Module
 * @description_zh 此文件属于 Chat 业务域。请保持业务内聚，不要随意挂载到全局域。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

interface ChatComposerProps {
  input: string
  isLoading: boolean
  placeholder: string
  helperText: string
  containerClass: string
  onInputChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  input,
  isLoading,
  placeholder,
  helperText,
  containerClass,
  onInputChange,
  onSubmit,
}) => {
  return (
    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pb-6 pt-2">
      <div className={containerClass}>
        <form
          onSubmit={onSubmit}
          className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-md transition-all focus-within:ring-1 focus-within:ring-slate-300"
        >
          <input
            className="w-full resize-none bg-transparent py-3.5 pl-5 pr-12 text-base text-slate-900 placeholder-slate-400 focus:outline-none"
            placeholder={placeholder}
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 transition-all ${
              !input.trim() || isLoading
                ? 'cursor-not-allowed bg-slate-100 text-slate-300'
                : 'bg-black text-white hover:opacity-80'
            }`}
          >
            {isLoading ? (
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            )}
          </button>
        </form>
        <div className="mt-3 hidden text-center text-xs text-slate-400 md:block">
          {helperText}
        </div>
      </div>
    </div>
  )
}
