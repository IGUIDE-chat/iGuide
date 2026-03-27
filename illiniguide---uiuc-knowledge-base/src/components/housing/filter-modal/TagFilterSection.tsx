/**
 * @file ./src/components/housing/filter-modal/TagFilterSection.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { memo } from 'react';
import { Check } from 'lucide-react';
import { DormTag } from '../types/index';
import { getTagDisplay } from '../constants/metadata';
import { FilterLanguage } from './modalText';

interface TagFilterSectionProps {
    title: string;
    language: FilterLanguage;
    tags: DormTag[];
    selectedValues: DormTag[];
    onToggle: (tag: DormTag) => void;
}

const TagFilterSection: React.FC<TagFilterSectionProps> = ({
    title,
    language,
    tags,
    selectedValues,
    onToggle
}) => (
    <section className="mb-8">
        <h3 className="text-xl font-bold mb-6">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tags.map((tag) => {
                const isSelected = selectedValues.includes(tag);
                return (
                    <label key={tag} className="flex items-center gap-3 cursor-pointer group select-none py-1">
                        <div
                            className={`
                            w-6 h-6 rounded-[4px] border flex items-center justify-center transition-all duration-200
                            ${isSelected
                                ? 'bg-illini-blue border-illini-blue text-white active:bg-[#0e2240] active:border-[#0e2240]'
                                : 'border-gray-300 group-hover:border-illini-blue active:border-illini-blue bg-white active:bg-blue-50/50'}
                        `}
                        >
                            {isSelected && <Check size={16} strokeWidth={3} />}
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={isSelected}
                                onChange={() => onToggle(tag)}
                            />
                        </div>
                        <span className="text-gray-700 group-hover:text-illini-blue transition-colors">
                            {getTagDisplay(tag, language)}
                        </span>
                    </label>
                );
            })}
        </div>
    </section>
);

export default memo(TagFilterSection);
