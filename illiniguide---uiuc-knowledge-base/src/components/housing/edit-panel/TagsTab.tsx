import React from 'react';
import { CATEGORY_LABELS, getTagDisplay, LLC_OPTIONS, TAGS_BY_CATEGORY } from '../../../constants/housing/metadata';
import { DormEditFormState } from './useDormEditForm';

interface TagsTabProps {
  form: DormEditFormState;
}

export const TagsTab: React.FC<TagsTabProps> = ({ form }) => {
  const { t } = form;

  return (
    <div className="space-y-5">
      {(['livingConditions', 'facilities', 'lifestyle'] as const).map((category) => (
        <div key={category}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {CATEGORY_LABELS[category][form.language]}
          </p>
          <div className="flex flex-wrap gap-2">
            {TAGS_BY_CATEGORY[category].map((tagId) => {
              const checked = form.categorizedTags[category].includes(tagId as never);
              return (
                <button
                  key={tagId}
                  type="button"
                  onClick={() =>
                    form.setCategorizedTags((prev) => ({
                      ...prev,
                      [category]: checked
                        ? prev[category].filter((tag) => tag !== tagId)
                        : [...prev[category], tagId],
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    checked
                      ? 'bg-illini-blue text-white border-illini-blue shadow-sm'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-illini-blue hover:text-illini-blue'
                  }`}
                >
                  {getTagDisplay(tagId, form.language)}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          {t.labels.llc}
        </p>
        <div className="flex flex-wrap gap-2">
          {LLC_OPTIONS.map((llc) => {
            const selected = form.categorizedTags.llcNames?.includes(llc) ?? false;
            return (
              <button
                key={llc}
                type="button"
                onClick={() =>
                  form.setCategorizedTags((prev) => {
                    const current = prev.llcNames ?? [];
                    const next = selected
                      ? current.filter((name) => name !== llc)
                      : [...current, llc];
                    return {
                      ...prev,
                      lifestyle:
                        next.length > 0
                          ? Array.from(new Set([...prev.lifestyle, 'llc']))
                          : prev.lifestyle.filter((tag) => tag !== 'llc'),
                      llcNames: next,
                    };
                  })
                }
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  selected
                    ? 'bg-illini-blue text-white border-illini-blue shadow-sm'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-illini-blue hover:text-illini-blue'
                }`}
              >
                {llc}
              </button>
            );
          })}
        </div>
        {(form.categorizedTags.llcNames?.length ?? 0) === 0 && (
          <p className="text-xs text-gray-400 mt-2">{t.hints.llc}</p>
        )}
      </div>
    </div>
  );
};
