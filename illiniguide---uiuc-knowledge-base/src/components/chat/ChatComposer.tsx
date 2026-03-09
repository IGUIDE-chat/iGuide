interface ChatComposerProps {
  input: string;
  isLoading: boolean;
  placeholder: string;
  helperText: string;
  containerClass: string;
  onInputChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
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
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
              !input.trim() || isLoading
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-black text-white hover:opacity-80'
            }`}
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="text-center mt-3 text-xs text-slate-400">{helperText}</div>
      </div>
    </div>
  );
};
