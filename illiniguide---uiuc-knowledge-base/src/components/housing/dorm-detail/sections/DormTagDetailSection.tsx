import React from 'react';
import { DormCategorizedTags, TagCategory } from '../../../../types/housing';
import { Language } from '../../../../types';
import { getTagDisplay } from '../../../../utils/tagLabels';
import { CATEGORY_LABELS } from '../../../../constants/housing/tagDefinitions';

interface DormTagDetailSectionProps {
    categorizedTags?: DormCategorizedTags;
    language: Language;
}

const CATEGORY_ORDER: TagCategory[] = ['livingConditions', 'facilities', 'lifestyle'];

const DormTagDetailSection: React.FC<DormTagDetailSectionProps> = ({ categorizedTags, language }) => {
    const hasAnyTags = CATEGORY_ORDER.some(cat => (categorizedTags[cat] ?? []).length > 0);
    if (!categorizedTags || !hasAnyTags) return null;

    return (
        <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
                {language === 'zh' ? '设施详情' : 'Facility Details'}
            </h3>
            <div className="space-y-4">
                {CATEGORY_ORDER.map(category => {
                    const tags = categorizedTags[category] ?? [];
                    if (tags.length === 0) return null;

                    return (
                        <div key={category}>
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                {CATEGORY_LABELS[category][language]}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => {
                                    let label = getTagDisplay(tag, language);
                                    // Append LLC names if it's the 'llc' tag
                                    if (tag === 'llc' && categorizedTags.llcNames?.length) {
                                        label += ` (${categorizedTags.llcNames.join(', ')})`;
                                    }
                                    return (
                                        <span
                                            key={tag}
                                            className="px-3 py-1.5 bg-illini-blue/5 text-illini-blue rounded-lg text-sm font-medium border border-illini-blue/10"
                                        >
                                            {label}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default DormTagDetailSection;
