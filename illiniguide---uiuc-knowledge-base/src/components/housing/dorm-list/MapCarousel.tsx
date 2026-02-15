import React from 'react';
import { Heart } from 'lucide-react';
import { Dorm } from '../../../types/housing';
import { Language } from '../../../types';
import { formatPrice } from '../../../constants/housing/pricing';

interface MapCarouselProps {
    dorms: Dorm[];
    language: Language;
    favoritesSet: Set<string>;
    onToggleFavorite: (dorm: Dorm, e?: React.MouseEvent) => void;
    onViewDetails: (dorm: Dorm) => void;
    onHoverDorm: (id: string | null) => void;
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
    onHoveringChange: (hovering: boolean) => void;
}

const MapCarousel: React.FC<MapCarouselProps> = ({
    dorms,
    language,
    favoritesSet,
    onToggleFavorite,
    onViewDetails,
    onHoverDorm,
    scrollContainerRef,
    onHoveringChange
}) => {
    const t = language === 'zh'
        ? {
            campus: '校区',
            perYear: '/年'
        }
        : {
            campus: 'Campus',
            perYear: '/ yr'
        };

    return (
        <div className="absolute bottom-6 left-0 right-0 z-10 px-4 xl:hidden">
            <div
                ref={scrollContainerRef}
                className="flex gap-3 overflow-x-auto pb-2 pr-12 snap-x snap-mandatory overscroll-x-contain scrollbar-hide"
                style={{
                    scrollBehavior: 'smooth',
                    scrollPaddingInlineStart: '4px',
                    scrollPaddingInlineEnd: '24px'
                }}
                onMouseEnter={() => onHoveringChange(true)}
                onMouseLeave={() => onHoveringChange(false)}
                onTouchStart={() => onHoveringChange(true)}
                onTouchEnd={() => onHoveringChange(false)}
            >
                {dorms.map((dorm) => {
                    const dormName = language === 'zh' && dorm.name_zh ? dorm.name_zh : dorm.name;
                    const locationLabel = language === 'zh' && dorm.location_zh ? dorm.location_zh : dorm.location;

                    return (
                        <div
                            key={dorm.id}
                            onClick={() => onViewDetails(dorm)}
                            onMouseEnter={() => onHoverDorm(dorm.id)}
                            onMouseLeave={() => onHoverDorm(null)}
                            className="flex-shrink-0 w-[240px] snap-start cursor-pointer group"
                        >
                            <div className="bg-gradient-to-br from-white/95 via-white/90 to-gray-50/95 backdrop-blur-md rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.12)] overflow-hidden h-full border border-gray-100/80 flex flex-col">
                                <div className="relative h-28 overflow-hidden bg-gray-100 shrink-0">
                                    <img
                                        src={dorm.imageUrl}
                                        alt={dormName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400';
                                        }}
                                    />
                                    <div className="absolute top-2 left-2 flex gap-1.5">
                                        {dorm.housingType === 'URH' && (
                                            <div className="bg-illini-orange/90 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">
                                                URH
                                            </div>
                                        )}
                                        {dorm.housingType === 'PCH' && (
                                            <div className="bg-illini-blue/90 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">
                                                PCH
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleFavorite(dorm, e);
                                        }}
                                        type="button"
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/10 backdrop-blur-sm"
                                    >
                                        <Heart
                                            className={`w-4 h-4 transition-colors ${favoritesSet.has(dorm.id) ? 'fill-red-500 text-red-500' : 'text-white'
                                                }`}
                                            strokeWidth={2}
                                        />
                                    </button>
                                </div>
                                <div className="p-3 flex flex-col justify-between flex-1">
                                    <div>
                                        <div className="flex justify-between items-start mb-0.5">
                                            <h3 className="font-bold text-gray-900 text-base leading-tight truncate pr-2 transition-transform duration-150 hover:scale-[1.03] origin-left">
                                                {dormName}
                                            </h3>
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <span className="text-[10px] font-bold text-gray-900">4.8</span>
                                                <span className="text-[9px] text-gray-500">(120)</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mb-1.5 truncate">{locationLabel} {t.campus}</p>
                                    </div>
                                    <div className="flex items-baseline gap-1 mt-auto">
                                        <span className="font-bold text-sm text-gray-900">{formatPrice(dorm.price)}</span>
                                        <span className="text-[10px] text-gray-500">{t.perYear}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MapCarousel;
