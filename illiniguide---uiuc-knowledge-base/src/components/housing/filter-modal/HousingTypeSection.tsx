import React, { memo } from 'react';
import { getHousingTypeMeta, getLocalizedLabel, HOUSING_TYPE_OPTIONS } from '../../../constants/housing/metadata';
import { FilterLanguage } from './modalText';

interface HousingTypeSectionProps {
    title: string;
    language: FilterLanguage;
    value: 'ALL' | 'URH' | 'PCH';
    onChange: (value: 'ALL' | 'URH' | 'PCH') => void;
}

const HousingTypeSection: React.FC<HousingTypeSectionProps> = ({ title, language, value, onChange }) => (
    <section className="mb-8">
        <h3 className="text-xl font-bold mb-6">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HOUSING_TYPE_OPTIONS.map((option) => {
                const meta = getHousingTypeMeta(option.value);
                const selected = value === option.value;
                const accentClass =
                    option.value === 'URH'
                        ? 'border-illini-orange bg-illini-orange/10 ring-1 ring-illini-orange'
                        : 'border-illini-blue bg-blue-50/50 ring-1 ring-illini-blue';
                const hoverClass =
                    option.value === 'URH'
                        ? 'border-gray-200 hover:border-illini-orange hover:bg-illini-orange/10 active:border-illini-orange active:bg-illini-orange/10'
                        : 'border-gray-200 hover:border-illini-blue hover:bg-blue-50/50 active:border-illini-blue active:bg-blue-50/50';
                const checkboxClass = option.value === 'URH' ? 'accent-illini-orange' : 'accent-illini-blue';

                return (
                    <label
                        key={option.value}
                        className={`
                            flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors duration-200
                            ${selected ? accentClass : hoverClass}
                        `}
                    >
                        <input
                            type="checkbox"
                            className={`w-5 h-5 rounded-md ${checkboxClass}`}
                            checked={selected}
                            onChange={() => onChange(selected ? 'ALL' : option.value)}
                        />
                        <div>
                            <div className="font-bold">{getLocalizedLabel(option, language)}</div>
                            <div className="text-sm text-gray-500">{getLocalizedLabel(meta.description, language)}</div>
                        </div>
                    </label>
                );
            })}
        </div>
    </section>
);

export default memo(HousingTypeSection);
