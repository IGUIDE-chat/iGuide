import React, { memo } from 'react';

interface ChipSectionProps {
    title: string;
    options: string[];
    selectedValues: string[];
    onToggle: (value: string) => void;
}

const ChipSection: React.FC<ChipSectionProps> = ({ title, options, selectedValues, onToggle }) => (
    <section className="mb-8">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <div className="flex flex-wrap gap-2">
            {options.map((value) => {
                const isSelected = selectedValues.includes(value);
                return (
                    <button
                        key={value}
                        onClick={() => onToggle(value)}
                        type="button"
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${isSelected
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-black'
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
