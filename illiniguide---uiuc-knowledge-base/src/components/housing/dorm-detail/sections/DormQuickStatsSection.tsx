import React from 'react';
import { Bath, Building2, DollarSign, MapPin, Utensils, Wind } from 'lucide-react';
import { Dorm } from '../../../../types/housing';
import { Language } from '../../../../types';
import { DINING_OPTIONS, getDimensionOptionLabel, getHousingTypeMeta } from '../../../../constants/housing/metadata';
import { getDormBathroomSummary } from '../../../../utils/roomOptions';

interface DormQuickStatsSectionProps {
    dorm: Dorm;
    language: Language;
    quickStatsLabel: string;
    housingTypeLabel: string;
    diningHallLabel: string;
    onSiteLabel: string;
    nearbyLabel: string;
    annualPriceLabel: string;
    formatPrice: (price: number) => string;
}

const DormQuickStatsSection: React.FC<DormQuickStatsSectionProps> = ({
    dorm,
    language,
    quickStatsLabel,
    housingTypeLabel,
    diningHallLabel,
    annualPriceLabel,
    formatPrice,
}) => {
    const diningText = getDimensionOptionLabel(DINING_OPTIONS, dorm.dining, language);
    const bathroomText = getDormBathroomSummary(dorm, language);
    const housingTypeMeta = getHousingTypeMeta(dorm.housingType);
    const locationLabel = language === 'zh' && dorm.location_zh ? dorm.location_zh : dorm.location;

    return (
        <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">{quickStatsLabel}</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-700">
                        <Building2 size={18} className="mr-3 text-illini-blue" />
                        <span>{housingTypeLabel}</span>
                    </div>
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${housingTypeMeta.badgeClassName}`}
                    >
                        {housingTypeMeta.shortLabel}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-700">
                        <MapPin size={18} className="mr-3 text-illini-blue" />
                        <span>{language === 'zh' ? '位置' : 'Location'}</span>
                    </div>
                    <span className="font-medium text-gray-900">{locationLabel}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-700">
                        <Wind size={18} className="mr-3 text-illini-blue" />
                        <span>{language === 'zh' ? '空调' : 'AC'}</span>
                    </div>
                    <span className={`font-medium ${dorm.ac ? 'text-green-600' : 'text-red-500'}`}>
                        {dorm.ac ? (language === 'zh' ? '有' : 'Yes') : (language === 'zh' ? '无' : 'No')}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-700">
                        <Bath size={18} className="mr-3 text-illini-blue" />
                        <span>{language === 'zh' ? '卫浴' : 'Bathroom'}</span>
                    </div>
                    <span className="font-medium text-gray-900">{bathroomText}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-700">
                        <Utensils size={18} className="mr-3 text-illini-blue" />
                        <span>{diningHallLabel}</span>
                    </div>
                    <span className={`font-medium ${dorm.dining === 'inside' ? 'text-green-600' : 'text-gray-500'}`}>
                        {diningText}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-700">
                        <DollarSign size={18} className="mr-3 text-illini-blue" />
                        <span>{annualPriceLabel}</span>
                    </div>
                    <span className="font-medium text-gray-900">{formatPrice(dorm.price)}</span>
                </div>
            </div>
        </div>
    );
};

export default DormQuickStatsSection;
