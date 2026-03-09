import React from 'react';
import { Dorm } from '../../types/housing';
import { formatPrice } from '../../constants/housing/pricing';
import { getHousingTypeMeta, getLocalizedLabel } from '../../constants/housing/metadata';
import { Language } from '../../types';
import { X, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    deriveRoomOptions,
    getRoomRangeSummary,
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

const DormComparison: React.FC<DormComparisonProps> = ({ dorms, onClose, language = 'en' }) => {
    const t = TEXT[language];

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

    if (dorms.length < 2) return null;

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
                    className="relative w-full max-w-4xl bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
                    style={{ pointerEvents: 'auto' }}
                >
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                        <h2 className="text-lg font-bold text-gray-900">{t.title}</h2>
                        <button
                            onClick={onClose}
                            type="button"
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            aria-label={t.close}
                        >
                            <X size={18} className="text-gray-600" />
                        </button>
                    </div>

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
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DormComparison;
