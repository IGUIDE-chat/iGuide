import React, { memo } from 'react';
import { Check } from 'lucide-react';
import { FilterOption } from '../../../types/housing';
import { DISPLAY_AMENITIES, FilterLanguage } from './modalText';

interface AmenitiesSectionProps {
    title: string;
    language: FilterLanguage;
    selectedValues: FilterOption[];
    onToggle: (value: FilterOption) => void;
}

const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({
    title,
    language,
    selectedValues,
    onToggle
}) => (
    <section className="mb-8">
        <h3 className="text-xl font-bold mb-6">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DISPLAY_AMENITIES.map((amenity) => {
                const isSelected = selectedValues.includes(amenity.id);
                const Icon = amenity.icon;

                return (
                    <label key={amenity.id} className="flex items-center gap-3 cursor-pointer group select-none py-1">
                        <div
                            className={`
                            w-6 h-6 rounded-[4px] border flex items-center justify-center transition-all duration-200
                            ${isSelected
                                ? 'bg-illini-blue border-illini-blue text-white active:bg-[#0e2240] active:border-[#0e2240]'
                                : 'border-gray-300 group-hover:border-illini-orange bg-white active:bg-orange-50/50'}
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
                        <div className="flex items-center gap-2 text-gray-700 group-hover:text-illini-orange transition-colors">
                            <Icon size={18} className="text-gray-500 group-hover:text-illini-orange" />
                            <span>{amenity.label[language] || amenity.label.en}</span>
                        </div>
                    </label>
                );
            })}
        </div>
    </section>
);

export default memo(AmenitiesSection);
