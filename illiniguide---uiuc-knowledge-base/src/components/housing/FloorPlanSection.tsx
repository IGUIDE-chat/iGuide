import React, { useState } from 'react';
import { BathroomScope, FloorPlan, RoomOption } from '../../types/housing';
import { formatPrice } from '../../constants/housing/pricing';
import { Maximize, Check, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRoomOptionKey, getRoomOptionLabels, normalizeFloorPlan } from '../../utils/roomOptions';

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
        unavailable: 'Floor plan image unavailable',
        priceRange: 'Price Range',
        monthly: '/month',
        viewFloorPlan: 'View floor plan',
        hideFloorPlan: 'Hide floor plan',
    },
    zh: {
        title: '户型图与价格',
        subtitle: '可选房型配置与年费用',
        price: '价格',
        sqft: '面积',
        available: '可预订',
        notAvailable: '有限',
        perYear: '/年',
        sqftLabel: '平方英尺',
        unavailable: '暂未提供户型图',
        priceRange: '价格范围',
        monthly: '/月',
        viewFloorPlan: '查看户型图',
        hideFloorPlan: '收起户型图',
    },
};

const BATHROOM_SCOPE_ORDER: Record<BathroomScope, number> = {
    communal: 0,
    'semi-private': 1,
    private: 2,
};

function normalizeComparableText(value: string) {
    return value
        .toLowerCase()
        .replace(/community bathroom/g, 'communal bathroom')
        .replace(/shared bathroom/g, 'communal bathroom')
        .replace(/communal bath/g, 'communal bathroom')
        .replace(/semi-private bath/g, 'semi-private bathroom')
        .replace(/private bath/g, 'private bathroom')
        .replace(/bathrooms/g, 'bathroom')
        .replace(/\bbaths\b/g, 'bath')
        .replace(/single room/g, 'single')
        .replace(/double room/g, 'double')
        .replace(/triple room/g, 'triple')
        .replace(/quad room/g, 'quad')
        .replace(/\broom\b/g, '')
        .replace(/\bsuite\b/g, '')
        .replace(/[/.·,-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildPlanNarrative(
    option: Pick<RoomOption, 'bedCount' | 'bathroomCount' | 'bathroomScope' | 'labelCode'>,
    language: 'en' | 'zh'
) {
    const labels = getRoomOptionLabels(option, language);
    const isSpecialType = option.labelCode === 'Studio' || option.labelCode === 'Suite' || option.labelCode === 'Cluster';

    if (!labels.secondaryLabel) {
        return labels.primaryLabel;
    }

    if (language === 'zh') {
        return `${labels.primaryLabel}，${labels.secondaryLabel}`;
    }

    const bathroomText = (() => {
        const normalized = labels.secondaryLabel.toLowerCase();
        if (normalized.includes('baths')) {
            return normalized.replace('baths', 'bathrooms');
        }
        return normalized.replace('bath', 'bathroom');
    })();

    return isSpecialType
        ? `${labels.primaryLabel} with ${bathroomText}`
        : `${labels.primaryLabel} room with ${bathroomText}`;
}

const FloorPlanSection: React.FC<FloorPlanSectionProps> = ({ floorPlans, language = 'en' }) => {
    const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const t = TEXT[language];

    if (!floorPlans?.length) {
        return null;
    }

    const normalizedPlans = floorPlans.map((plan) => normalizeFloorPlan(plan, plan.bathroomScope ?? 'communal'));
    const sortedPlans = [...normalizedPlans].sort((a, b) => {
        const bedDelta = (a.bedCount ?? Number.MAX_SAFE_INTEGER) - (b.bedCount ?? Number.MAX_SAFE_INTEGER);
        if (bedDelta !== 0) {
            return bedDelta;
        }

        const bathroomScopeDelta =
            BATHROOM_SCOPE_ORDER[a.bathroomScope ?? 'communal'] - BATHROOM_SCOPE_ORDER[b.bathroomScope ?? 'communal'];
        if (bathroomScopeDelta !== 0) {
            return bathroomScopeDelta;
        }

        return a.price - b.price;
    });
    const relatedOptions: RoomOption[] = sortedPlans.map((plan) => ({
        bedCount: plan.bedCount ?? null,
        bathroomCount: plan.bathroomCount ?? null,
        bathroomScope: plan.bathroomScope ?? 'communal',
        labelCode: plan.labelCode,
    }));

    return (
        <section className="mt-8">
            <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{t.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
            </div>

            <div className="space-y-3">
                {sortedPlans.map((plan, index) => {
                    const option: RoomOption = {
                        bedCount: plan.bedCount ?? null,
                        bathroomCount: plan.bathroomCount ?? null,
                        bathroomScope: plan.bathroomScope ?? 'communal',
                        labelCode: plan.labelCode,
                    };
                    const labels = getRoomOptionLabels(option, language, relatedOptions);
                    const planDescription = plan.description?.trim();
                    const itemKey = `${getRoomOptionKey(option)}-${plan.price}-${plan.sqft ?? 'na'}-${index}`;
                    const isExpanded = expandedPlan === itemKey;
                    const hasImage = Boolean(plan.imageUrl) && !imageErrors[itemKey];
                    const hideDescription = !planDescription
                        ? true
                        : [
                            labels.primaryLabel,
                            labels.secondaryLabel,
                            labels.shortLabel,
                            buildPlanNarrative(option, 'en'),
                            buildPlanNarrative(option, 'zh'),
                        ]
                            .filter(Boolean)
                            .some((candidate) => normalizeComparableText(candidate) === normalizeComparableText(planDescription));

                    return (
                        <motion.div
                            key={itemKey}
                            layout
                            className={`rounded-xl border bg-white transition-shadow ${
                                isExpanded ? 'border-illini-orange/30 shadow-md' : 'border-gray-200 shadow-sm'
                            }`}
                        >
                            <div
                                className={`p-4 md:p-5 ${hasImage ? 'cursor-pointer select-none' : ''}`}
                                onClick={hasImage ? () => setExpandedPlan(isExpanded ? null : itemKey) : undefined}
                            >
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-2.5 py-1 rounded-lg text-sm font-semibold border bg-illini-orange/10 text-illini-orange border-illini-orange/30">
                                                {labels.primaryLabel}
                                            </span>
                                            {labels.secondaryLabel && (
                                                <span className="text-sm text-gray-600">{labels.secondaryLabel}</span>
                                            )}
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    plan.available !== false
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-yellow-50 text-yellow-700'
                                                }`}
                                            >
                                                {plan.available !== false ? (
                                                    <Check size={12} className="shrink-0" />
                                                ) : (
                                                    <X size={12} className="shrink-0" />
                                                )}
                                                {plan.available !== false ? t.available : t.notAvailable}
                                            </span>
                                            {hasImage && (
                                                <motion.span
                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="ml-auto text-gray-400"
                                                >
                                                    <ChevronDown size={16} />
                                                </motion.span>
                                            )}
                                        </div>

                                        {!hideDescription && planDescription && (
                                            <p className="mt-3 text-sm leading-relaxed text-gray-600">{planDescription}</p>
                                        )}

                                        {!hasImage && (
                                            <p className="mt-3 text-xs text-gray-400">{t.unavailable}</p>
                                        )}
                                    </div>

                                    <div className="w-full md:w-auto md:min-w-[240px]">
                                        <div className="flex flex-wrap gap-2 md:justify-end">
                                            <div className="rounded-xl bg-gray-50 px-3 py-2 min-w-[132px]">
                                                <div className="text-[10px] uppercase tracking-wider text-gray-400">{t.price}</div>
                                                <div className="mt-1 flex items-baseline gap-1">
                                                    <span className="text-base font-bold text-illini-orange">
                                                        {formatPrice(plan.price)}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{t.perYear}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ~{formatPrice(Math.round(plan.price / 12))}
                                                    {t.monthly}
                                                </div>
                                            </div>

                                            {plan.sqft && (
                                                <div className="rounded-xl bg-gray-50 px-3 py-2 min-w-[116px]">
                                                    <div className="text-[10px] uppercase tracking-wider text-gray-400">
                                                        {t.sqft}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-gray-900">
                                                        <Maximize size={14} className="text-gray-400" />
                                                        <span>{plan.sqft}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">{t.sqftLabel}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <AnimatePresence initial={false}>
                                {hasImage && isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="border-t border-gray-100"
                                    >
                                        <div className="px-4 pb-4 pt-4 md:px-5 md:pb-5">
                                            <img
                                                src={plan.imageUrl}
                                                alt={`${labels.primaryLabel} floor plan`}
                                                className="w-full h-auto rounded-xl border border-gray-200 bg-gray-50"
                                                onError={() => setImageErrors((prev) => ({ ...prev, [itemKey]: true }))}
                                            />
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
