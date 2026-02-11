import React, { useEffect, useRef } from 'react';
import { Dorm } from '../../types/housing';
import { formatPrice } from '../../constants/housing/pricing';
import { Language } from '../../types';
import { X, MapPin, Home, Snowflake, UtensilsCrossed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DormBottomSheetProps {
    dorm: Dorm | null;
    onClose: () => void;
    onSelectDorm: (dorm: Dorm) => void;
    language?: Language;
    compareMode?: boolean;
    compareDorms?: Dorm[];
}

const DormBottomSheet: React.FC<DormBottomSheetProps> = ({
    dorm,
    onClose,
    onSelectDorm,
    language = 'en',
    compareMode = false,
    compareDorms = []
}) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const isCompare = compareMode && compareDorms.length > 0;

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const t = {
        en: {
            from: 'from',
            perRoom: '/room',
            viewDetails: 'View Details',
            close: 'Close',
            roomTypes: 'Room Types',
            compare: 'Compare',
            vs: 'vs',
            ac: 'AC',
            dining: 'Dining',
            yearly: '/year'
        },
        zh: {
            from: '起价',
            perRoom: '/房',
            viewDetails: '查看详情',
            close: '关闭',
            roomTypes: '房型',
            compare: '对比',
            vs: '对比',
            ac: '空调',
            dining: '食堂',
            yearly: '/年'
        }
    }[language];

    if (!dorm && !isCompare) return null;

    const renderDormCard = (d: Dorm, isPrimary = true) => {
        const dormName = language === 'zh' && d.name_zh ? d.name_zh : d.name;
        const dormLocation = language === 'zh' && d.location_zh ? d.location_zh : d.location;

        return (
            <div className={`flex ${isPrimary ? '' : 'opacity-75'}`}>
                <div className="w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden shadow-lg">
                    <img
                        src={d.imageUrl}
                        alt={dormName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400';
                        }}
                    />
                </div>

                <div className="flex-1 min-w-0 ml-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 text-base truncate">{dormName}</h3>
                                <div className="flex items-center text-gray-500 text-xs mt-0.5">
                                    <MapPin size={12} className="mr-1 flex-shrink-0" />
                                    <span className="truncate">{dormLocation}</span>
                                </div>
                            </div>
                            <span
                                className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                                    d.housingType === 'URH'
                                        ? 'bg-orange-100 text-illini-orange'
                                        : 'bg-blue-100 text-illini-blue'
                                }`}
                            >
                                {d.housingType === 'URH' ? 'URH' : 'PCH'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                            {d.ac && (
                                <div className="flex items-center text-gray-600" title="Air Conditioning">
                                    <Snowflake size={14} className="mr-1" />
                                    <span className="text-xs">{t.ac}</span>
                                </div>
                            )}
                            {d.dining && (
                                <div className="flex items-center text-gray-600" title="Dining Hall">
                                    <UtensilsCrossed size={14} className="mr-1" />
                                    <span className="text-xs">{t.dining}</span>
                                </div>
                            )}
                            <div className="flex items-center text-gray-600" title="Room Type">
                                <Home size={14} className="mr-1" />
                                <span className="text-xs">{d.type}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-baseline">
                            <span className="text-xs text-gray-500 mr-1">{t.from}</span>
                            <span className="text-lg font-bold text-gray-900">{formatPrice(d.price)}</span>
                            <span className="text-xs text-gray-400 ml-1">{t.perRoom}</span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectDorm(d);
                            }}
                            type="button"
                            className="bg-illini-blue text-white text-xs font-semibold py-2 px-4 rounded-full hover:bg-illini-blue/90 transition-colors shadow-md"
                        >
                            {t.viewDetails}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[2000]"
                style={{ pointerEvents: 'auto' }}
            >
                <div className="absolute inset-0 bg-black/20" onClick={onClose} />

                <motion.div
                    ref={sheetRef}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[70vh] overflow-hidden"
                    style={{ pointerEvents: 'auto' }}
                >
                    <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing" onClick={onClose}>
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                    </div>

                    <div className="px-6 pb-8 overflow-y-auto max-h-[calc(70vh-60px)]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900">
                                {isCompare ? t.compare : language === 'zh' && dorm?.name_zh ? dorm.name_zh : dorm?.name}
                            </h2>
                            <button
                                onClick={onClose}
                                type="button"
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                aria-label={t.close}
                            >
                                <X size={18} className="text-gray-600" />
                            </button>
                        </div>

                        {!isCompare && dorm && (
                            <>
                                {renderDormCard(dorm, true)}

                                <div className="h-px bg-gray-200 my-4" />

                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {language === 'zh' && dorm.description_zh ? dorm.description_zh : dorm.description}
                                </p>

                                <div className="flex flex-wrap gap-2 mt-4">
                                    {dorm.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {dorm.roomTypes && dorm.roomTypes.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2">{t.roomTypes}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {dorm.roomTypes.map((type) => (
                                                <span
                                                    key={type}
                                                    className="px-3 py-1 bg-illini-blue/10 text-illini-blue text-xs font-medium rounded-full"
                                                >
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {isCompare && compareDorms.length > 0 && (
                            <div className="space-y-4">
                                {compareDorms.map((compareDorm, index) => (
                                    <React.Fragment key={compareDorm.id}>
                                        {index > 0 && (
                                            <div className="flex items-center justify-center">
                                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                    {t.vs}
                                                </span>
                                            </div>
                                        )}
                                        {renderDormCard(compareDorm, true)}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DormBottomSheet;
