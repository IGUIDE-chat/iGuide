/**
 * @file ./src/components/housing/filter-modal/AmenitiesSection.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { memo } from 'react';
import { Check, GraduationCap, MapPin, Snowflake, Utensils } from 'lucide-react';
import { FilterOption } from '../types/index';
import { FilterLanguage } from './modalText';

const DISPLAY_AMENITIES = [
    { id: FilterOption.AC, label: { en: 'Air Conditioning', zh: '空调' }, icon: Snowflake },
    { id: FilterOption.DINING_IN_BUILDING, label: { en: 'Dining Hall', zh: '食堂' }, icon: Utensils },
    { id: FilterOption.NEAR_ENGINEERING, label: { en: 'Near Engineering', zh: '靠近工程学院' }, icon: GraduationCap },
    { id: FilterOption.NEAR_MAIN_QUAD, label: { en: 'Near Main Quad', zh: '靠近主广场' }, icon: MapPin },
] as const;

interface AmenitiesSectionProps {
    title: string;
    language: FilterLanguage;
    selectedValues: FilterOption[];
    onToggle: (value: FilterOption) => void;
}

const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({ title, language, selectedValues, onToggle }) => (
    <section className="mb-8">
        <h3 className="mb-6 text-xl font-bold">{title}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {DISPLAY_AMENITIES.map((amenity) => {
                const isSelected = selectedValues.includes(amenity.id);
                const Icon = amenity.icon;

                return (
                    <label key={amenity.id} className="group flex cursor-pointer select-none items-center gap-3 py-1">
                        <div
                            className={`
                                flex h-6 w-6 items-center justify-center rounded-[4px] border transition-all duration-200
                                ${
                                    isSelected
                                        ? 'border-illini-blue bg-illini-blue text-white active:border-[#0e2240] active:bg-[#0e2240]'
                                        : 'border-gray-300 bg-white group-hover:border-illini-blue active:border-illini-blue active:bg-blue-50/50'
                                }
                            `}
                        >
                            {isSelected && <Check size={16} strokeWidth={3} />}
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={isSelected}
                                onChange={() => onToggle(amenity.id)}
                            />
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 transition-colors group-hover:text-illini-blue">
                            <Icon size={18} className="text-gray-500 group-hover:text-illini-blue" />
                            <span>{amenity.label[language] || amenity.label.en}</span>
                        </div>
                    </label>
                );
            })}
        </div>
    </section>
);

export default memo(AmenitiesSection);
