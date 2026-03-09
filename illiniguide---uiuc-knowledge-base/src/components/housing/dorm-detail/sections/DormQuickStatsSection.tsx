import React from 'react';
import { DollarSign, Utensils, MapPin, Wind, Bath } from 'lucide-react';
import { Dorm } from '../../../../types/housing';
import { Language } from '../../../../types';
import { getDormBathroomSummary } from '../../../../utils/roomOptions';

interface DormQuickStatsSectionProps {
    dorm: Dorm;
    language: Language;
    quickStatsLabel: string;
    diningHallLabel: string;
    onSiteLabel: string;
    nearbyLabel: string;
    annualPriceLabel: string;
    formatPrice: (price: number) => string;
}

const DINING_LABELS: Record<string, Record<Dorm['dining'], string>> = {
    en: { inside: 'On-site', nearby: 'Nearby', none: 'None' },
    zh: { inside: '楼内', nearby: '附近', none: '无' },
};

const DormQuickStatsSection: React.FC<DormQuickStatsSectionProps> = ({
    dorm,
    language,
    quickStatsLabel,
    diningHallLabel,
    annualPriceLabel,
    formatPrice
}) => {
    const diningText = DINING_LABELS[language]?.[dorm.dining] ?? DINING_LABELS.en[dorm.dining];
    const bathroomText = getDormBathroomSummary(dorm, language === 'zh' ? 'zh' : 'en');
    const locationLabel = language === 'zh' && dorm.location_zh ? dorm.location_zh : dorm.location;

    return (
        <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                {quickStatsLabel}
            </h3>
            <div className="space-y-4">
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
