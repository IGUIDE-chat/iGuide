import React from 'react';
import { MapPin, Utensils, Wind } from 'lucide-react';
import { formatPrice } from '../../constants/housing/pricing';
import { Dorm } from '../../types/housing';
import { Language } from '../../types';
import { deriveRoomOptions, getRoomRangeSummary } from '../../utils/roomOptions';
import { getCardTagItems } from '../../utils/tagLabels';

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
        ac: 'AC',
        noAc: 'No AC',
        diningInside: 'Dining hall',
        diningNearby: 'Dining nearby',
        diningNone: 'No dining',
        roomSummaryLabel: 'Layouts',
        unsave: 'Unsave dorm',
        save: 'Save dorm',
        moreTags: (count: number) => `+${count}`,
    },
    zh: {
        ac: '有空调',
        noAc: '无空调',
        diningInside: '楼内食堂',
        diningNearby: '附近食堂',
        diningNone: '无食堂',
        roomSummaryLabel: '房型',
        unsave: '取消收藏宿舍',
        save: '收藏宿舍',
        moreTags: (count: number) => `+${count}`,
    },
};

function getDiningLabel(dorm: Dorm, language: Language) {
    const t = TEXT[language];
    if (dorm.dining === 'inside') {
        return t.diningInside;
    }
    if (dorm.dining === 'nearby') {
        return t.diningNearby;
    }

    return t.diningNone;
}

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
    const roomRangeSummary = getRoomRangeSummary(roomOptions, language);
    const cardTags = getCardTagItems(
        dorm.categorizedTags ?? { livingConditions: [], facilities: [], lifestyle: [] },
        language,
        4
    );

    return (
        <div
            onClick={() => onViewDetails(dorm)}
            onMouseEnter={() => onHoverDorm?.(dorm.id)}
            onMouseLeave={() => onHoverDorm?.(null)}
            className="dorm-card group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
        >
            <div className="relative h-48 overflow-hidden">
                <img
                    src={dorm.imageUrl}
                    alt={dormName}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute right-3 top-3 flex items-end">
                    <div className="origin-top-right rounded-md bg-white px-2 py-1 text-xs font-bold text-illini-blue shadow-sm transition-transform duration-200 group-hover:scale-105">
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
                        className="absolute left-3 top-3 rounded-full bg-white p-2 text-gray-400 shadow-sm transition-colors hover:bg-gray-50 hover:text-red-500"
                        aria-label={isFavorite ? t.unsave : t.save}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill={isFavorite ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            className={`h-5 w-5 ${isFavorite ? 'text-red-500' : ''}`}
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

            <div className="flex flex-grow flex-col p-4">
                <h3 className="mb-2 text-xl font-bold leading-tight text-gray-900 antialiased">
                    {dormName}
                </h3>

                <div className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px] text-gray-600">
                    <div className="col-span-2 inline-flex min-w-0 items-center gap-1">
                        <MapPin size={13} className="shrink-0 text-illini-orange" />
                        <span className="line-clamp-1">{locationLabel}</span>
                    </div>
                    <div className="inline-flex items-center gap-1">
                        <Wind size={13} className="shrink-0 text-gray-400" />
                        <span>{dorm.ac ? t.ac : t.noAc}</span>
                    </div>
                    <div className="inline-flex items-center gap-1">
                        <Utensils size={13} className="shrink-0 text-gray-400" />
                        <span>{getDiningLabel(dorm, language)}</span>
                    </div>
                </div>

                <div className="mb-2 text-sm leading-6 text-gray-700">
                    <span className="mr-1 text-gray-500">{t.roomSummaryLabel}:</span>
                    <span className="font-medium text-gray-800">{roomRangeSummary.cardSummary}</span>
                </div>

                {description && (
                    <p className="mb-3 line-clamp-1 text-sm leading-6 text-gray-600 antialiased">
                        {description}
                    </p>
                )}

                <div className="mt-auto flex flex-wrap gap-1.5">
                    {cardTags.items.map((tag) => (
                        <span
                            key={tag.id}
                            className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium ${
                                tag.layer === 'secondary'
                                    ? 'border-slate-200 bg-slate-50 text-slate-700'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            }`}
                        >
                            {tag.label}
                        </span>
                    ))}
                    {cardTags.overflowCount > 0 && (
                        <span className="inline-flex items-center rounded-full border border-dashed border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-500">
                            {t.moreTags(cardTags.overflowCount)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DormCard;
