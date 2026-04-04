/**
 * @file ./src/components/housing/DormComparison.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Dorm, FloorPlan } from './types/index';
import { formatPrice } from './constants/pricing';
import { getHousingTypeMeta, getLocalizedLabel } from './constants/metadata';
import { Language } from '../../types';
import { X, Check, AlertCircle, ChevronDown, ChevronLeft, ChevronRight, BedSingle, Bath, SquareDashed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    deriveRoomOptions,
    getRoomRangeSummary,
    normalizeFloorPlan,
    getBathroomScopeLabel,
    getRoomOptionLabels,
    getStorageBathroomScope,
} from '../../utils/roomOptions';

interface DormComparisonProps {
    dorms: Dorm[];
    onClose: () => void;
    language?: Language;
}

interface ComparisonRow {
    label: string;
    getValue: (dorm: Dorm) => React.ReactNode;
    highlightBest?: boolean;
    bestCondition?: (dorm: Dorm) => boolean;
}

const TEXT = {
    en: {
        title: 'Compare Dorms',
        close: 'Close',
        yes: 'Yes',
        no: 'No',
        urh: 'URH',
        pch: 'PCH',
        feature: 'Feature',
        bestOption: 'Best option',
        roomOptions: 'Room Options',
        bathroom: 'Bathroom',
        name: 'Name',
        location: 'Location',
        housingType: 'Housing Type',
        price: 'Price',
        ac: 'Air Conditioning',
        dining: 'Dining Hall',
    },
    zh: {
        title: '宿舍对比',
        close: '关闭',
        yes: '有',
        no: '无',
        urh: '校内宿舍',
        pch: '认证校外宿舍',
        feature: '项目',
        bestOption: '推荐项',
        roomOptions: '房型',
        bathroom: '卫浴',
        name: '名称',
        location: '位置',
        housingType: '住宿类型',
        price: '价格',
        ac: '空调',
        dining: '食堂',
    },
};

const hasPublishedPrice = (price: FloorPlan['price']): price is number =>
    typeof price === 'number' && Number.isFinite(price) && price > 0;

const DormComparison: React.FC<DormComparisonProps> = ({ dorms, onClose, language = 'en' }) => {
    const t = TEXT[language];

    // Per-dorm selected floor plan index
    const [selectedPlanIdx, setSelectedPlanIdx] = useState<Record<string, number>>(() => {
        const init: Record<string, number> = {};
        dorms.forEach((d) => { init[d.id] = 0; });
        return init;
    });

    // Normalized floor plans per dorm
    const dormPlans = useMemo(() => {
        const map: Record<string, FloorPlan[]> = {};
        dorms.forEach((dorm) => {
            const defaultScope = getStorageBathroomScope(dorm.bathroomType, dorm.floorPlans);
            map[dorm.id] = (dorm.floorPlans ?? []).map((p) =>
                normalizeFloorPlan(p, p.bathroomScope ?? defaultScope),
            );
        });
        return map;
    }, [dorms]);

    const comparisonRows: ComparisonRow[] = [
        {
            label: t.name,
            getValue: (dorm) => {
                const dormName = language === 'zh' && dorm.name_zh ? dorm.name_zh : dorm.name;
                return (
                    <div className="flex items-center gap-2">
                        <img src={dorm.imageUrl} alt={dormName} className="w-10 h-10 rounded-lg object-cover" />
                        <span className="font-medium text-base">{dormName}</span>
                    </div>
                );
            },
        },
        {
            label: t.location,
            getValue: (dorm) => {
                const locationLabel = language === 'zh' && dorm.location_zh ? dorm.location_zh : dorm.location;
                return <span className="text-sm text-gray-600">{locationLabel}</span>;
            },
        },
        {
            label: t.housingType,
            getValue: (dorm) => {
                const housingTypeMeta = getHousingTypeMeta(dorm.housingType);
                return (
                    <span className={`px-2 py-1 text-xs rounded-full ${housingTypeMeta.badgeClassName}`}>
                        {getLocalizedLabel(housingTypeMeta, language)}
                    </span>
                );
            },
        },
        {
            label: t.price,
            getValue: (dorm) => <span className="font-bold text-illini-orange">{formatPrice(dorm.price)}</span>,
            highlightBest: true,
            bestCondition: (dorm) => dorm.price <= 10000,
        },
        {
            label: t.ac,
            getValue: (dorm) =>
                dorm.ac ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                        <Check size={16} /> {t.yes}
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle size={16} /> {t.no}
                    </span>
                ),
            highlightBest: true,
            bestCondition: (dorm) => dorm.ac,
        },
        {
            label: t.dining,
            getValue: (dorm) =>
                dorm.dining === 'inside' ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                        <Check size={16} /> {t.yes}
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle size={16} /> {t.no}
                    </span>
                ),
            highlightBest: true,
            bestCondition: (dorm) => dorm.dining === 'inside',
        },
        {
            label: t.roomOptions,
            getValue: (dorm) => {
                const roomOptions = dorm.roomOptions ?? deriveRoomOptions(dorm.floorPlans, dorm.bathroomType).roomOptions;
                const roomSummary = getRoomRangeSummary(roomOptions, language);
                return <span className="text-sm text-gray-700">{roomSummary.occupancyLabel}</span>;
            },
        },
        {
            label: t.bathroom,
            getValue: (dorm) => {
                const roomOptions = dorm.roomOptions ?? deriveRoomOptions(dorm.floorPlans, dorm.bathroomType).roomOptions;
                const roomSummary = getRoomRangeSummary(roomOptions, language);
                return <span className="text-sm text-gray-600">{roomSummary.bathroomLabel}</span>;
            },
        },
    ];

    // Mobile: track which dorm card is active (for swipe navigation)
    const [mobileActiveIdx, setMobileActiveIdx] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Build floor plan detail rows (shared between mobile & desktop)
    const getFloorPlanRows = () => {
        const selectedPlans = dorms.map((dorm) => {
            const plans = dormPlans[dorm.id] ?? [];
            const idx = selectedPlanIdx[dorm.id] ?? 0;
            return plans[idx] ?? null;
        });

        const planRows: { label: string; icon?: React.ReactNode; values: React.ReactNode[] }[] = [
            {
                label: language === 'zh' ? '房型' : 'Room Type',
                values: selectedPlans.map((plan) => {
                    if (!plan) return '—';
                    const opt = { bedCount: plan.bedCount ?? null, bathroomCount: plan.bathroomCount ?? null, bathroomScope: plan.bathroomScope ?? 'communal' as const, labelCode: plan.labelCode };
                    return <span className="font-semibold text-gray-800">{plan.officialName || getRoomOptionLabels(opt, language).primaryLabel}</span>;
                }),
            },
            {
                label: language === 'zh' ? '床位' : 'Beds',
                icon: <BedSingle className="w-3.5 h-3.5 text-gray-400" />,
                values: selectedPlans.map((plan) => {
                    if (!plan) return '—';
                    if (plan.bedSize) return plan.bedSize;
                    if (plan.bedCount != null) return `${plan.bedCount} ${language === 'zh' ? '张床' : plan.bedCount === 1 ? 'Bed' : 'Beds'}`;
                    return '—';
                }),
            },
            {
                label: language === 'zh' ? '卫浴' : 'Bathroom',
                icon: <Bath className="w-3.5 h-3.5 text-gray-400" />,
                values: selectedPlans.map((plan) => {
                    if (!plan) return '—';
                    const scope = plan.bathroomScope ?? 'communal';
                    const scopeLabel = getBathroomScopeLabel(scope, language);
                    if (plan.bathroomCount != null && plan.bathroomCount > 0) {
                        return `${plan.bathroomCount} ${language === 'zh' ? '卫' : plan.bathroomCount === 1 ? 'Bath' : 'Baths'} · ${scopeLabel}`;
                    }
                    return scopeLabel;
                }),
            },
            {
                label: language === 'zh' ? '面积' : 'Area',
                icon: <SquareDashed className="w-3.5 h-3.5 text-gray-400" />,
                values: selectedPlans.map((plan) => {
                    if (!plan?.sqft) return '—';
                    return `${plan.sqft} sqft (~${Math.round(plan.sqft * 0.092903)}㎡)`;
                }),
            },
            {
                label: language === 'zh' ? '年租金' : 'Annual Price',
                values: selectedPlans.map((plan) => {
                    if (!plan) return '—';
                    const p = hasPublishedPrice(plan.price) ? plan.price : null;
                    if (p != null) return <span className="font-bold text-illini-orange">{formatPrice(p)}</span>;
                    if (plan.available === false) return <span className="text-red-500 text-[13px]">{language === 'zh' ? '暂不可订' : 'Sold out'}</span>;
                    return '—';
                }),
            },
            {
                label: language === 'zh' ? '月租金' : 'Monthly',
                values: selectedPlans.map((plan) => {
                    if (!plan) return '—';
                    const p = hasPublishedPrice(plan.price) ? plan.price : null;
                    return p != null ? <span className="font-semibold text-gray-700">~{formatPrice(Math.round(p / 12))}</span> : '—';
                }),
            },
        ];

        const prices = selectedPlans.map((p) => p && hasPublishedPrice(p.price) ? p.price : null);
        const validPrices = prices.filter((p): p is number => p !== null);
        const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

        return { planRows, prices, minPrice, validPrices };
    };

    if (dorms.length < 2) return null;

    // ── Mobile: stacked card layout with swipe navigation ──
    const renderMobileView = () => {
        const activeDorm = dorms[mobileActiveIdx];
        const dormName = (d: Dorm) => language === 'zh' && d.name_zh ? d.name_zh : d.name;
        const hasFloorPlans = dorms.some((d) => (dormPlans[d.id]?.length ?? 0) > 0);
        const { planRows, prices, minPrice, validPrices } = getFloorPlanRows();

        return (
            <div className="overflow-y-auto max-h-[calc(90vh-56px)] px-4 pb-6">
                {/* Dorm tab switcher */}
                <div className="flex items-center gap-2 py-3 sticky top-0 bg-white z-10">
                    <button
                        type="button"
                        onClick={() => setMobileActiveIdx((i) => Math.max(0, i - 1))}
                        disabled={mobileActiveIdx === 0}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-30 shrink-0"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar">
                        {dorms.map((d, i) => (
                            <button
                                key={d.id}
                                type="button"
                                onClick={() => setMobileActiveIdx(i)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                                    i === mobileActiveIdx
                                        ? 'bg-illini-blue text-white'
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                <img src={d.imageUrl} alt={dormName(d)} className="w-5 h-5 rounded-full object-cover" />
                                {dormName(d)}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => setMobileActiveIdx((i) => Math.min(dorms.length - 1, i + 1))}
                        disabled={mobileActiveIdx === dorms.length - 1}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-30 shrink-0"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                {/* Page indicator dots */}
                <div className="flex justify-center gap-1.5 pb-3">
                    {dorms.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === mobileActiveIdx ? 'bg-illini-blue' : 'bg-gray-300'}`} />
                    ))}
                </div>

                {/* Active dorm card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeDorm.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                        {/* Dorm header */}
                        <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-200">
                            <img src={activeDorm.imageUrl} alt={dormName(activeDorm)} className="w-12 h-12 rounded-xl object-cover" />
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-base text-gray-900 truncate">{dormName(activeDorm)}</h3>
                                <p className="text-xs text-gray-500 truncate">
                                    {language === 'zh' && activeDorm.location_zh ? activeDorm.location_zh : activeDorm.location}
                                </p>
                            </div>
                        </div>

                        {/* Basic info rows */}
                        <div className="divide-y divide-gray-100">
                            {comparisonRows.slice(2).map((row) => {
                                const isBest = row.bestCondition?.(activeDorm);
                                return (
                                    <div key={row.label} className={`flex items-center justify-between px-4 py-3 ${isBest ? 'bg-emerald-50/60' : ''}`}>
                                        <span className="text-sm text-gray-600 shrink-0">{row.label}</span>
                                        <div className="text-sm text-right">{row.getValue(activeDorm)}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Floor plan section */}
                        {hasFloorPlans && (dormPlans[activeDorm.id]?.length ?? 0) > 0 && (() => {
                            const plans = dormPlans[activeDorm.id] ?? [];
                            const di = dorms.indexOf(activeDorm);
                            const currentIdx = selectedPlanIdx[activeDorm.id] ?? 0;

                            return (
                                <div className="border-t-4 border-gray-100">
                                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                        <h4 className="text-sm font-bold text-gray-900">{language === 'zh' ? '房型详情' : 'Floor Plan'}</h4>
                                    </div>
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <div className="relative">
                                            <select
                                                value={currentIdx}
                                                onChange={(e) => setSelectedPlanIdx((prev) => ({ ...prev, [activeDorm.id]: Number(e.target.value) }))}
                                                className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-illini-blue/30"
                                            >
                                                {plans.map((plan, i) => {
                                                    const opt = { bedCount: plan.bedCount ?? null, bathroomCount: plan.bathroomCount ?? null, bathroomScope: plan.bathroomScope ?? 'communal' as const, labelCode: plan.labelCode };
                                                    const label = plan.officialName || getRoomOptionLabels(opt, language).primaryLabel;
                                                    const price = hasPublishedPrice(plan.price) ? ` · ${formatPrice(plan.price)}` : '';
                                                    return <option key={i} value={i}>{label}{price}</option>;
                                                })}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {planRows.map((row, ri) => {
                                            const isAnnualPrice = row.label === (language === 'zh' ? '年租金' : 'Annual Price');
                                            const isCheapest = isAnnualPrice && minPrice !== null && prices[di] === minPrice && validPrices.length > 1;
                                            return (
                                                <div key={ri} className={`flex items-center justify-between px-4 py-3 ${isCheapest ? 'bg-emerald-50/60' : ''}`}>
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600 shrink-0">
                                                        {row.icon}
                                                        <span>{row.label}</span>
                                                    </div>
                                                    <div className="text-sm text-right">
                                                        {row.values[di]}
                                                        {isCheapest && (
                                                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                                                                {language === 'zh' ? '最低' : 'Lowest'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    };

    // ── Desktop: original table layout ──
    const renderDesktopView = () => {
        const { planRows, prices, minPrice, validPrices } = getFloorPlanRows();

        return (
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(85vh-72px)]">
                <table className="w-full min-w-[760px] border-collapse">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-r border-gray-200">
                                {t.feature}
                            </th>
                            {dorms.map((dorm) => {
                                const dormName = language === 'zh' && dorm.name_zh ? dorm.name_zh : dorm.name;
                                return (
                                    <th
                                        key={dorm.id}
                                        className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200 min-w-[220px]"
                                    >
                                        <div className="flex items-center gap-2">
                                            <img src={dorm.imageUrl} alt={dormName} className="w-8 h-8 rounded object-cover" />
                                            <span className="truncate text-base">{dormName}</span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {comparisonRows.map((row, rowIndex) => (
                            <tr key={row.label} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                <td className="sticky left-0 z-10 px-4 py-4 text-sm font-medium text-gray-700 border-b border-r border-gray-200 bg-inherit">
                                    <div className="flex items-center gap-2">
                                        <span>{row.label}</span>
                                        {row.highlightBest && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                                                {t.bestOption}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                {dorms.map((dorm) => {
                                    const isBest = row.bestCondition?.(dorm);
                                    return (
                                        <td
                                            key={`${row.label}-${dorm.id}`}
                                            className={`px-4 py-4 align-top text-sm border-b border-gray-200 ${
                                                isBest ? 'bg-emerald-50/60' : ''
                                            }`}
                                        >
                                            {row.getValue(dorm)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* ── Cross-dorm floor plan comparison ── */}
                {dorms.some((d) => (dormPlans[d.id]?.length ?? 0) > 0) && (
                    <div className="border-t-4 border-gray-100">
                        <div className="px-4 md:px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-[15px] md:text-base font-bold text-gray-900">
                                {language === 'zh' ? '房型对比' : 'Floor Plan Comparison'}
                            </h3>
                            <p className="text-[12px] md:text-[13px] text-gray-500 mt-0.5">
                                {language === 'zh' ? '选择每个宿舍的房型进行对比' : 'Select a floor plan from each dorm to compare'}
                            </p>
                        </div>

                        {/* Plan selectors */}
                        <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: `140px repeat(${dorms.length}, 1fr)` }}>
                            <div className="px-4 py-3 text-sm font-medium text-gray-500 border-r border-gray-200 bg-gray-50 flex items-center">
                                {language === 'zh' ? '选择房型' : 'Select Plan'}
                            </div>
                            {dorms.map((dorm) => {
                                const plans = dormPlans[dorm.id] ?? [];
                                if (plans.length === 0) {
                                    return (
                                        <div key={dorm.id} className="px-3 py-3 text-sm text-gray-400 italic border-r border-gray-200 last:border-r-0 flex items-center">
                                            {language === 'zh' ? '暂无房型' : 'No plans'}
                                        </div>
                                    );
                                }
                                const currentIdx = selectedPlanIdx[dorm.id] ?? 0;
                                return (
                                    <div key={dorm.id} className="px-3 py-3 border-r border-gray-200 last:border-r-0">
                                        <div className="relative">
                                            <select
                                                value={currentIdx}
                                                onChange={(e) => setSelectedPlanIdx((prev) => ({ ...prev, [dorm.id]: Number(e.target.value) }))}
                                                className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-[13px] font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-illini-blue/30 focus:border-illini-blue cursor-pointer"
                                            >
                                                {plans.map((plan, i) => {
                                                    const opt = { bedCount: plan.bedCount ?? null, bathroomCount: plan.bathroomCount ?? null, bathroomScope: plan.bathroomScope ?? 'communal' as const, labelCode: plan.labelCode };
                                                    const label = plan.officialName || getRoomOptionLabels(opt, language).primaryLabel;
                                                    const price = hasPublishedPrice(plan.price) ? ` · ${formatPrice(plan.price)}` : '';
                                                    return <option key={i} value={i}>{label}{price}</option>;
                                                })}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Plan comparison rows */}
                        <table className="w-full min-w-[760px] border-collapse">
                            <tbody>
                                {planRows.map((row, ri) => (
                                    <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="sticky left-0 z-10 px-4 py-3 text-sm font-medium text-gray-600 border-b border-r border-gray-200 bg-inherit w-[140px]">
                                            <div className="flex items-center gap-1.5">
                                                {row.icon}
                                                <span>{row.label}</span>
                                            </div>
                                        </td>
                                        {row.values.map((val, ci) => {
                                            const isAnnualPrice = row.label === (language === 'zh' ? '年租金' : 'Annual Price');
                                            const isCheapest = isAnnualPrice && minPrice !== null && prices[ci] === minPrice && validPrices.length > 1;
                                            return (
                                                <td
                                                    key={ci}
                                                    className={`px-4 py-3 text-sm border-b border-gray-200 ${isCheapest ? 'bg-emerald-50/60' : ''}`}
                                                >
                                                    {val}
                                                    {isCheapest && (
                                                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                                                            {language === 'zh' ? '最低' : 'Lowest'}
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[3000] flex items-end justify-center"
                style={{ pointerEvents: 'auto' }}
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/30"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="relative w-full max-w-4xl bg-white rounded-t-3xl shadow-2xl max-h-[90vh] md:max-h-[85vh] overflow-hidden"
                    style={{ pointerEvents: 'auto' }}
                >
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-10">
                        <h2 className="text-base md:text-lg font-bold text-gray-900">{t.title}</h2>
                        <button
                            onClick={onClose}
                            type="button"
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            aria-label={t.close}
                        >
                            <X size={18} className="text-gray-600" />
                        </button>
                    </div>

                    {isMobile ? renderMobileView() : renderDesktopView()}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DormComparison;
