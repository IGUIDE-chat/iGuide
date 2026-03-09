import React from 'react';
import { Dorm } from '../../types/housing';
import { formatPrice } from '../../constants/housing/pricing';
import { MapPin, Utensils, Wind } from 'lucide-react';
import { Language } from '../../types';
import { getHeroTags, getTagDisplay } from '../../utils/tagLabels';
import {
    deriveRoomOptions,
    getDormBathroomTagSummary,
    getRoomOptionLabels,
    getRoomTypeCountLabel,
} from '../../utils/roomOptions';

interface DormCardProps {
    dorm: Dorm;
    onViewDetails: (dorm: Dorm) => void;
    isFavorite?: boolean;
    onToggleFavorite?: (dorm: Dorm, e?: React.MouseEvent) => void;
    onHoverDorm?: (dormId: string | null) => void;
    language?: Language;
}

const TEXT = {
    en: {
        dining: 'Dining',
        noAc: 'No AC',
        unsave: 'Unsave dorm',
        save: 'Save dorm',
        roomTypes: 'Room types',
        highlights: 'Highlights',
    },
    zh: {
        dining: '食堂',
        noAc: '无空调',
        unsave: '取消收藏宿舍',
        save: '收藏宿舍',
        roomTypes: '房型',
        highlights: '亮点',
    },
};

const DormCard: React.FC<DormCardProps> = ({
    dorm,
    onViewDetails,
    isFavorite = false,
    onToggleFavorite,
    onHoverDorm,
    language = 'en',
}) => {
    const t = TEXT[language];
    const dormName = language === 'zh' && dorm.name_zh ? dorm.name_zh : dorm.name;
    const description = language === 'zh' && dorm.description_zh ? dorm.description_zh : dorm.description;
    const locationLabel = language === 'zh' && dorm.location_zh ? dorm.location_zh : dorm.location;
    const roomOptions = dorm.roomOptions ?? deriveRoomOptions(dorm.floorPlans, dorm.bathroomType).roomOptions;
    const bathroomSummary = getDormBathroomTagSummary(dorm, language);
    const visibleRoomOptions = roomOptions.slice(0, 3);

    return (
        <div
            onClick={() => onViewDetails(dorm)}
            onMouseEnter={() => onHoverDorm?.(dorm.id)}
            onMouseLeave={() => onHoverDorm?.(null)}
            className="dorm-card bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full group relative cursor-pointer"
        >
            <div className="relative h-64 overflow-hidden">
                <img
                    src={dorm.imageUrl}
                    alt={dormName}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                    <div className="bg-white px-2 py-1 rounded-md text-xs font-bold text-illini-blue shadow-sm transition-transform duration-200 group-hover:scale-110 group-hover:font-extrabold origin-top-right">
                        {formatPrice(dorm.price)}
                    </div>
                </div>

                {onToggleFavorite && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(dorm, e);
                        }}
                        type="button"
                        className="absolute top-3 left-3 p-2 rounded-full bg-white hover:bg-gray-50 text-gray-400 hover:text-red-500 transition-colors shadow-sm"
                        aria-label={isFavorite ? t.unsave : t.save}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill={isFavorite ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            className={`w-5 h-5 ${isFavorite ? 'text-red-500' : ''}`}
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                            />
                        </svg>
                    </button>
                )}
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight transition-transform duration-150 hover:scale-[1.03] origin-left antialiased">
                        {dormName}
                    </h3>
                </div>

                <div className="flex items-center text-gray-500 text-sm mb-4">
                    <MapPin size={14} className="mr-1 text-illini-orange" />
                    {locationLabel}
                </div>

                <div className="mb-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-2">
                        {t.roomTypes}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {visibleRoomOptions.map((option) => {
                            const labels = getRoomOptionLabels(option, language, roomOptions);
                            return (
                                <span
                                    key={`${option.labelCode ?? 'custom'}-${option.bedCount ?? 'na'}-${option.bathroomCount ?? 'na'}-${option.bathroomScope}`}
                                    className="inline-block px-2 py-1 rounded-md border border-gray-200 text-gray-700 text-[11px] font-medium bg-white transition-colors duration-150 hover:bg-gray-50 hover:border-gray-300"
                                >
                                    {labels.shortLabel}
                                </span>
                            );
                        })}
                        {roomOptions.length > 3 && (
                            <span className="inline-block px-2 py-1 rounded-md border border-dashed border-illini-blue/30 bg-illini-blue/5 text-illini-blue text-[11px] font-medium">
                                {getRoomTypeCountLabel(roomOptions.length, language)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mb-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-2">
                        {t.highlights}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-illini-blue/10 text-illini-blue text-xs font-medium">
                            {bathroomSummary}
                        </span>
                        {!dorm.ac && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                                <Wind size={10} className="mr-1" /> {t.noAc}
                            </span>
                        )}
                        {dorm.dining === 'inside' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-illini-orange/10 text-illini-orange text-xs font-medium transition-colors duration-150 hover:bg-illini-orange/15 hover:text-illini-orange">
                                <Utensils size={10} className="mr-1" /> {t.dining}
                            </span>
                        )}
                        {getHeroTags(dorm.categorizedTags ?? { livingConditions: [], facilities: [], lifestyle: [] }, 4)
                            .filter((tag) => tag !== 'noAc')
                            .flatMap((tag) => {
                                if (tag === 'llc' && dorm.categorizedTags?.llcNames?.length) {
                                    return dorm.categorizedTags.llcNames.map((llcName) => (
                                        <span
                                            key={llcName}
                                            className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium transition-colors duration-150 hover:bg-gray-200 hover:text-gray-800"
                                        >
                                            {llcName}
                                        </span>
                                    ));
                                }
                                return (
                                    <span
                                        key={tag}
                                        className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium transition-colors duration-150 hover:bg-gray-200 hover:text-gray-800"
                                    >
                                        {getTagDisplay(tag, language)}
                                    </span>
                                );
                            })}
                    </div>
                </div>

                <p className="text-gray-700 text-sm leading-relaxed mb-2 line-clamp-3 flex-grow antialiased">
                    {description}
                </p>
            </div>
        </div>
    );
};

export default DormCard;
