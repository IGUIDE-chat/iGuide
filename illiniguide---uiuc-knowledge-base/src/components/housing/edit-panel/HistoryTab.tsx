import React from 'react';
import { History, Loader2 } from 'lucide-react';
import { DormEditFormState } from './useDormEditForm';

interface HistoryTabProps {
  form: DormEditFormState;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ form }) => {
  const { t, historyEntries, historyLoading, restoringId, handleRestore } = form;

  if (historyLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 size={20} className="animate-spin mr-2" />
        <span className="text-sm">{t.actions.loading}</span>
      </div>
    );
  }

  if (historyEntries.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <History size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">{t.hints.historyEmpty}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {historyEntries.map((entry) => (
        <li key={entry.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-800">
                {new Date(entry.changed_at).toLocaleString(form.language === 'zh' ? 'zh-CN' : 'en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">{entry.changed_by}</p>
              <p className="text-xs text-illini-blue mt-1 break-words">{entry.summary}</p>
            </div>
            <button
              type="button"
              onClick={() => handleRestore(entry)}
              disabled={restoringId !== null}
              className="flex-shrink-0 flex items-center justify-center text-xs px-2.5 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:border-illini-blue hover:text-illini-blue transition-colors disabled:opacity-40"
            >
              {restoringId === entry.id
                ? <Loader2 size={12} className="animate-spin" />
                : t.actions.restore}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};
