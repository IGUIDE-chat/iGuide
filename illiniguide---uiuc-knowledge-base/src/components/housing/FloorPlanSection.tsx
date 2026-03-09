import React, { useState } from 'react';
import { FloorPlan } from '../../types/housing';
import { formatPrice } from '../../constants/housing/pricing';
import { Maximize, Check, X, ChevronDown, ImageOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRoomDetailLabel, getRoomDisplayLabel, getRoomOptionKey, normalizeFloorPlan } from '../../utils/roomOptions';

interface FloorPlanSectionProps {
    floorPlans: FloorPlan[];
    language?: 'en' | 'zh';
}

const TEXT = {
    en: {
        title: 'Floor Plans & Pricing',
        subtitle: 'Available room configurations and annual rates',
        price: 'Price',
        sqft: 'Sq Ft',
        available: 'Available',
        notAvailable: 'Limited',
        perYear: '/year',
        sqftLabel: 'sq ft',
        unavailable: 'Floor plan unavailable',
        priceRange: 'Price Range',
    },
    zh: {
        title: '房型图与价格',
        subtitle: '可选房型配置及年费',
        price: '价格',
        sqft: '面积',
        available: '可预订',
        notAvailable: '有限',
        perYear: '/年',
        sqftLabel: '平方英尺',
        unavailable: '暂无法显示房型图',
        priceRange: '价格范围',
    }
};

const FloorPlanSection: React.FC<FloorPlanSectionProps> = ({ floorPlans, language = 'en' }) => {
    const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const t = TEXT[language];

    if (!floorPlans || floorPlans.length === 0) {
        return null;
    }

    const normalizedPlans = floorPlans.map((plan) => normalizeFloorPlan(plan, plan.bathroomScope ?? 'communal'));
    const sortedPlans = [...normalizedPlans].sort((a, b) => a.price - b.price);

    return (
        <section className="mt-8">
            <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{t.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
            </div>

            <div className="space-y-3">
                {sortedPlans.map((plan) => {
                    const planKey = getRoomOptionKey({
                        bedCount: plan.bedCount ?? null,
                        bathroomCount: plan.bathroomCount ?? null,
                        bathroomScope: plan.bathroomScope ?? 'communal',
                        labelCode: plan.labelCode,
                    });
                    const isExpanded = expandedPlan === planKey;

                    return (
                        <motion.div
                            key={`${planKey}-${plan.price}`}
                            layout
                            className={`bg-gradient-to-br from-white/95 via-white/90 to-gray-50/95 backdrop-blur-md rounded-xl border border-gray-200/80 overflow-hidden transition-shadow ${
                                isExpanded ? 'shadow-lg border-illini-orange/30' : 'shadow-sm border-gray-200 hover:shadow-md'
                            }`}
                        >
                            <div className="p-3 cursor-pointer" onClick={() => setExpandedPlan(isExpanded ? null : planKey)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="px-2.5 py-1 rounded-lg text-sm font-semibold border bg-illini-orange/15 text-illini-orange border-illini-orange/40">
                                            {getRoomDisplayLabel({
                                                bedCount: plan.bedCount ?? null,
                                                bathroomCount: plan.bathroomCount ?? null,
                                                bathroomScope: plan.bathroomScope ?? 'communal',
                                                labelCode: plan.labelCode,
                                            }, language)}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {getRoomDetailLabel({
                                                bedCount: plan.bedCount ?? null,
                                                bathroomCount: plan.bathroomCount ?? null,
                                                bathroomScope: plan.bathroomScope ?? 'communal',
                                                labelCode: plan.labelCode,
                                            }, language)}
                                        </span>
                                        <div className="flex items-center gap-0.5">
                                            {plan.available !== false ? (
                                                <>
                                                    <Check size={12} className="text-green-500" />
                                                    <span className="text-xs text-green-600 font-medium">{t.available}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <X size={12} className="text-yellow-500" />
                                                    <span className="text-xs text-yellow-600 font-medium">{t.notAvailable}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-base font-bold text-illini-orange">{formatPrice(plan.price)}</span>
                                            <span className="text-xs text-gray-400">{t.perYear}</span>
                                        </div>

                                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                            <ChevronDown size={16} className="text-gray-400" />
                                        </motion.div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                    {plan.sqft && (
                                        <div className="flex items-center gap-1">
                                            <Maximize size={14} />
                                            <span>{plan.sqft} {t.sqftLabel}</span>
                                        </div>
                                    )}
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
                                        <div className="px-3 pb-3 md:px-4 md:pb-4 pt-0 border-t border-gray-100">
                                            {plan.imageUrl && (
                                                <div className="mt-4 rounded-lg overflow-hidden bg-gray-100">
                                                    {imageErrors[planKey] ? (
                                                        <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
                                                            <ImageOff size={28} />
                                                            <span className="text-xs">{t.unavailable}</span>
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={plan.imageUrl}
                                                            alt={`${plan.labelCode ?? 'room'} floor plan`}
                                                            className="w-full h-auto"
                                                            onError={() => setImageErrors((prev) => ({ ...prev, [planKey]: true }))}
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {plan.description && (
                                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-600">{plan.description}</p>
                                                </div>
                                            )}

                                            <div className="mt-3 grid grid-cols-2 gap-2">
                                                <div className="bg-gray-50 rounded-lg p-2.5">
                                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">{t.price}</div>
                                                    <div className="text-sm font-bold text-illini-orange mt-0.5">{formatPrice(plan.price)}</div>
                                                    <div className="text-[10px] text-gray-500">~{formatPrice(Math.round(plan.price / 12))}/month</div>
                                                </div>
                                                {plan.sqft && (
                                                    <div className="bg-gray-50 rounded-lg p-2.5">
                                                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">{t.sqft}</div>
                                                        <div className="text-sm font-bold text-gray-900 mt-0.5">{plan.sqft}</div>
                                                        <div className="text-[10px] text-gray-500">{t.sqftLabel}</div>
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
                    <span className="text-gray-500">{t.priceRange}</span>
                    <span className="font-semibold text-illini-blue">
                        {formatPrice(sortedPlans[0].price)} - {formatPrice(sortedPlans[sortedPlans.length - 1].price)}
                    </span>
                </div>
            </div>
        </section>
    );
};

export default FloorPlanSection;
