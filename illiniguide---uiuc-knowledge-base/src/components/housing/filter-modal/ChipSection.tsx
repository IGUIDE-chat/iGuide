import React, { memo } from 'react';

interface ChipSectionProps {
    title: string;
    options: string[];
    selectedValues: string[];
    onToggle: (value: string) => void;
}

const ChipSection: React.FC<ChipSectionProps> = ({ title, options, selectedValues, onToggle }) => (
    <section className="mb-8">
        <h3 className="text-xl font-bold mb-4 text-slate-800">{title}</h3>
        <div className="flex flex-wrap gap-2">
            {options.map((value) => {
                const isSelected = selectedValues.includes(value);
                return (
                    <button
                        key={value}
                        onClick={() => onToggle(value)}
                        type="button"
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${isSelected
                            ? 'bg-illini-orange text-white border-illini-orange shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-illini-orange hover:text-illini-orange hover:bg-orange-50'
                            }`}
                    >
                        {value}
                    </button>
                );
            })}
        </div>
    </section>
);

export default memo(ChipSection);