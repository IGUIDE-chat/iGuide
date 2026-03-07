import React, { memo } from 'react';
import { Check } from 'lucide-react';
import { RoomType } from '../../../types/housing';
import { ROOM_TYPES } from '../../../constants/housing/filters';
import { FilterLanguage } from './modalText';

interface RoomTypeSectionProps {
    title: string;
    language: FilterLanguage;
    selectedValues: RoomType[];
    onToggle: (value: RoomType) => void;
}

const RoomTypeSection: React.FC<RoomTypeSectionProps> = ({
    title,
    language,
    selectedValues,
    onToggle
}) => (
    <section>
        <h3 className="text-xl font-bold mb-6">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROOM_TYPES.map((type) => {
                const isSelected = selectedValues.includes(type.id);
                return (
                    <label key={type.id} className="flex items-center gap-3 cursor-pointer group select-none py-1">
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
                                onChange={() => onToggle(type.id)}
                            />
                        </div>
                        <span className="text-gray-700 group-hover:text-illini-blue transition-colors relative -top-0.5">
                            {type.label[language] || type.label.en}
                        </span>
                    </label>
                );
            })}
        </div>
    </section>
);

export default memo(RoomTypeSection);
