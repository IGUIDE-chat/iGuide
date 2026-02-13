import React, { memo } from 'react';
import { ModalText } from './modalText';

interface HousingTypeSectionProps {
    t: ModalText;
    value: 'ALL' | 'URH' | 'PCH';
    onChange: (value: 'ALL' | 'URH' | 'PCH') => void;
}

const HousingTypeSection: React.FC<HousingTypeSectionProps> = ({ t, value, onChange }) => (
    <section className="mb-8">
        <h3 className="text-xl font-bold mb-6">{t.typeOfPlace}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
                className={`
                flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors duration-200
                ${value === 'URH' ? 'border-illini-orange bg-orange-50/50 ring-1 ring-illini-orange' : 'border-gray-200 hover:border-illini-orange hover:bg-orange-50/30'}
            `}
            >
                <input
                    type="checkbox"
                    className="w-5 h-5 accent-illini-orange rounded-md"
                    checked={value === 'URH'}
                    onChange={() => onChange(value === 'URH' ? 'ALL' : 'URH')}
                />
                <div>
                    <div className="font-bold">{t.urh}</div>
                    <div className="text-sm text-gray-500">{t.urhDesc}</div>
                </div>
            </label>
            <label
                className={`
                flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors duration-200
                ${value === 'PCH' ? 'border-illini-blue bg-blue-50/50 ring-1 ring-illini-blue' : 'border-gray-200 hover:border-illini-orange hover:bg-orange-50/30'}
            `}
            >
                <input
                    type="checkbox"
                    className="w-5 h-5 accent-illini-blue rounded-md"
                    checked={value === 'PCH'}
                    onChange={() => onChange(value === 'PCH' ? 'ALL' : 'PCH')}
                />
                <div>
                    <div className="font-bold">{t.pch}</div>
                    <div className="text-sm text-gray-500">{t.pchDesc}</div>
                </div>
            </label>
        </div>
    </section>
);

export default memo(HousingTypeSection);
