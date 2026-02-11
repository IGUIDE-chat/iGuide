import React from 'react';
import { DollarSign, Home, Utensils } from 'lucide-react';
import { Dorm } from '../../../../types/housing';

interface DormQuickStatsSectionProps {
    dorm: Dorm;
    quickStatsLabel: string;
    roomTypeLabel: string;
    diningHallLabel: string;
    onSiteLabel: string;
    nearbyLabel: string;
    annualPriceLabel: string;
    formatPrice: (price: number) => string;
}

const DormQuickStatsSection: React.FC<DormQuickStatsSectionProps> = ({
    dorm,
    quickStatsLabel,
    roomTypeLabel,
    diningHallLabel,
    onSiteLabel,
    nearbyLabel,
    annualPriceLabel,
    formatPrice
}) => {
    return (
        <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                {quickStatsLabel}
            </h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-700">
                        <Home size={18} className="mr-3 text-illini-blue" />
                        <span>{roomTypeLabel}</span>
                    </div>
                    <span className="font-medium text-gray-900">{dorm.type}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-700">
                        <Utensils size={18} className="mr-3 text-illini-blue" />
                        <span>{diningHallLabel}</span>
                    </div>
                    <span className={`font-medium ${dorm.dining ? 'text-green-600' : 'text-gray-500'}`}>
                        {dorm.dining ? onSiteLabel : nearbyLabel}
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
