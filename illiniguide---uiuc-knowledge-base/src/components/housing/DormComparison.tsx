import React from 'react';
import { Dorm } from '../../types/housing';
import { formatPrice } from '../../constants/housing/pricing';
import { Language } from '../../types';
import { X, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDormTypeLabel, getRoomTypeLabel } from '../../utils/housingLabels';

interface DormComparisonProps {
    dorms: Dorm[];
    onClose: () => void;
    language?: Language;
}

interface ComparisonRow {
    label: string;
    label_zh: string;
    getValue: (dorm: Dorm) => React.ReactNode;
    highlightBest?: boolean;
    bestCondition?: (dorm: Dorm) => boolean;
}

const DormComparison: React.FC<DormComparisonProps> = ({ dorms, onClose, language = 'en' }) => {
    const t = {
        en: {
            title: 'Compare Dorms',
            close: 'Close',
            yes: 'Yes',
            no: 'No',
            urh: 'URH',
            pch: 'PCH',
            feature: 'Feature',
            bestOption: 'Best option'
        },
        zh: {
            title: '宿舍对比',
            close: '关闭',
            yes: '是',
            no: '否',
            urh: '校内宿舍',
            pch: '私营认证住宿',
            feature: '特征',
            bestOption: '最佳选项'
        }
    }[language];

    const comparisonRows: ComparisonRow[] = [
        {
            label: 'Name',
            label_zh: '名称',
            getValue: (dorm) => {
                const dormName = language === 'zh' && dorm.name_zh ? dorm.name_zh : dorm.name;
                return (
                    <div className="flex items-center gap-2">
                        <img src={dorm.imageUrl} alt={dormName} className="w-10 h-10 rounded-lg object-cover" />
                        <span className="font-medium text-base">{dormName}</span>
                    </div>
                );
            }
        },
        {
            label: 'Location',
            label_zh: '位置',
            getValue: (dorm) => {
                const locationLabel = language === 'zh' && dorm.location_zh ? dorm.location_zh : dorm.location;
                return <span className="text-sm text-gray-600">{locationLabel}</span>;
            }
        },
        {
            label: 'Type',
            label_zh: '类型',
            getValue: (dorm) => (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {getDormTypeLabel(dorm.type, language === 'zh' ? 'zh' : 'en')}
                </span>
            )
        },
        {
            label: 'Housing Type',
            label_zh: '住宿类型',
            getValue: (dorm) => (
                <span
                    className={`px-2 py-1 text-xs rounded-full ${
                        dorm.housingType === 'URH' ? 'bg-orange-100 text-illini-orange' : 'bg-blue-100 text-illini-blue'
                    }`}
                >
                    {dorm.housingType === 'URH' ? t.urh : t.pch}
                </span>
            )
        },
        {
            label: 'Price Range',
            label_zh: '价格范围',
            getValue: (dorm) => <span className="font-bold text-illini-orange">{formatPrice(dorm.price)}</span>,
            highlightBest: true,
            bestCondition: (dorm) => dorm.price <= 10000
        },
        {
            label: 'Air Conditioning',
            label_zh: '空调',
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
            bestCondition: (dorm) => dorm.ac
        },
        {
            label: 'Dining Hall',
            label_zh: '食堂',
            getValue: (dorm) =>
                dorm.dining ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                        <Check size={16} /> {t.yes}
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle size={16} /> {t.no}
                    </span>
                ),
            highlightBest: true,
            bestCondition: (dorm) => dorm.dining
        },
        {
            label: 'Room Types',
            label_zh: '房型',
            getValue: (dorm) => (
                <div className="flex flex-wrap gap-1">
                    {dorm.roomTypes?.slice(0, 3).map((type) => (
                        <span key={type} className="px-2 py-0.5 bg-illini-blue/10 text-illini-blue text-xs rounded">
                            {getRoomTypeLabel(type, language === 'zh' ? 'zh' : 'en')}
                        </span>
                    ))}
                    {dorm.roomTypes && dorm.roomTypes.length > 3 && (
                        <span className="text-xs text-gray-500">+{dorm.roomTypes.length - 3}</span>
                    )}
                </div>
            )
        }
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
                                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                        <td className="sticky left-0 z-10 px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200">
                                            {language === 'zh' ? row.label_zh : row.label}
                                        </td>
                                        {dorms.map((dorm) => {
                                            const isBest = row.highlightBest && row.bestCondition?.(dorm);
                                            const isWinner = Boolean(
                                                isBest && row.bestCondition && dorms.some((d) => !row.bestCondition!(d))
                                            );

                                            return (
                                                <td
                                                    key={dorm.id}
                                                    className={`px-4 py-3 align-top border-l border-gray-100 ${
                                                        isWinner ? 'bg-green-50' : ''
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

                    <div className="border-t border-gray-200 bg-white px-6 py-3 text-xs text-gray-500 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-green-700">
                            <Check size={14} />
                            <span>{t.bestOption}</span>
                        </span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DormComparison;
