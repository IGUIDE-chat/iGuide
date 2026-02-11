import React, { useState } from 'react';
import { FloorPlan } from '../../types/housing';
import { formatPrice } from '../../constants/housing/pricing';
import { Bed, Maximize, Check, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRoomTypeLabel } from '../../utils/housingLabels';

interface FloorPlanSectionProps {
    floorPlans: FloorPlan[];
    language?: 'en' | 'zh';
}

const FloorPlanSection: React.FC<FloorPlanSectionProps> = ({ floorPlans, language = 'en' }) => {
    const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

    const t = {
        en: {
            title: 'Floor Plans & Pricing',
            subtitle: 'Available room types and their annual rates',
            roomType: 'Room Type',
            price: 'Price',
            sqft: 'Sq Ft',
            available: 'Available',
            notAvailable: 'Limited',
            viewDetails: 'View Details',
            hideDetails: 'Hide Details',
            perYear: '/year',
            sqftLabel: 'sq ft'
        },
        zh: {
            title: '户型图与价格',
            subtitle: '可选房型及年费',
            roomType: '房型',
            price: '价格',
            sqft: '面积',
            available: '可预订',
            notAvailable: '有限',
            viewDetails: '查看详情',
            hideDetails: '收起详情',
            perYear: '/年',
            sqftLabel: '平方英尺'
        }
    }[language];

    if (!floorPlans || floorPlans.length === 0) {
        return null;
    }

    const getRoomTypeColor = (type: string): string => {
        if (type.includes('Studio')) return 'bg-purple-100 text-purple-700 border-purple-200';
        if (type.includes('1B')) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (type.includes('2B')) return 'bg-green-100 text-green-700 border-green-200';
        if (type.includes('3B')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        if (type.includes('4B')) return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const togglePlan = (type: string) => {
        setExpandedPlan(expandedPlan === type ? null : type);
    };

    const sortedPlans = [...floorPlans].sort((a, b) => a.price - b.price);

    return (
        <section className="mt-8">
            <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{t.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
            </div>

            <div className="space-y-3">
                {sortedPlans.map((plan) => {
                    const isExpanded = expandedPlan === plan.type;
                    const roomTypeLabel = getRoomTypeLabel(plan.type, language);

                    return (
                        <motion.div
                            key={plan.type}
                            layout
                            className={`bg-white rounded-xl border overflow-hidden transition-shadow ${
                                isExpanded
                                    ? 'shadow-lg border-illini-orange/30'
                                    : 'shadow-sm border-gray-200 hover:shadow-md'
                            }`}
                        >
                            <div className="p-4 cursor-pointer" onClick={() => togglePlan(plan.type)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getRoomTypeColor(plan.type)}`}>
                                            {roomTypeLabel}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {plan.available !== false ? (
                                                <>
                                                    <Check size={14} className="text-green-500" />
                                                    <span className="text-xs text-green-600 font-medium">{t.available}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <X size={14} className="text-yellow-500" />
                                                    <span className="text-xs text-yellow-600 font-medium">{t.notAvailable}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-illini-orange">{formatPrice(plan.price)}</div>
                                            <div className="text-xs text-gray-400">{t.perYear}</div>
                                        </div>

                                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                            <ChevronDown size={20} className="text-gray-400" />
                                        </motion.div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                    {plan.sqft && (
                                        <div className="flex items-center gap-1">
                                            <Maximize size={14} />
                                            <span>
                                                {plan.sqft} {t.sqftLabel}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Bed size={14} />
                                        <span>{roomTypeLabel}</span>
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
                                            {plan.imageUrl && (
                                                <div className="mt-4 rounded-lg overflow-hidden bg-gray-100">
                                                    <img src={plan.imageUrl} alt={`${roomTypeLabel} floor plan`} className="w-full h-auto" />
                                                </div>
                                            )}

                                            {plan.description && (
                                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-600">{plan.description}</p>
                                                </div>
                                            )}

                                            <div className="mt-4 grid grid-cols-2 gap-3">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-400 uppercase tracking-wider">{t.price}</div>
                                                    <div className="text-lg font-bold text-illini-orange mt-1">{formatPrice(plan.price)}</div>
                                                    <div className="text-xs text-gray-500">
                                                        ~{formatPrice(Math.round(plan.price / 12))}/month
                                                    </div>
                                                </div>
                                                {plan.sqft && (
                                                    <div className="bg-gray-50 rounded-lg p-3">
                                                        <div className="text-xs text-gray-400 uppercase tracking-wider">{t.sqft}</div>
                                                        <div className="text-lg font-bold text-gray-900 mt-1">{plan.sqft}</div>
                                                        <div className="text-xs text-gray-500">{t.sqftLabel}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            <div className="mt-4 p-4 bg-illini-blue/5 rounded-xl border border-illini-blue/10">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{language === 'zh' ? '价格范围' : 'Price Range'}</span>
                    <span className="font-semibold text-illini-blue">
                        {formatPrice(sortedPlans[0].price)} - {formatPrice(sortedPlans[sortedPlans.length - 1].price)}
                    </span>
                </div>
            </div>
        </section>
    );
};

export default FloorPlanSection;
