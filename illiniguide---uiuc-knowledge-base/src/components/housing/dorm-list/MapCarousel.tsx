import React from 'react';
import { Heart } from 'lucide-react';
import { Dorm } from '../../../types/housing';
import { formatPrice } from '../../../constants/housing/pricing';

interface MapCarouselProps {
    dorms: Dorm[];
    favoritesSet: Set<string>;
    onToggleFavorite: (dorm: Dorm) => void;
    onViewDetails: (dorm: Dorm) => void;
    onHoverDorm: (id: string | null) => void;
    scrollContainerRef: React.RefObject<HTMLDivElement | null>;
    onHoveringChange: (hovering: boolean) => void;
}

const MapCarousel: React.FC<MapCarouselProps> = ({
    dorms,
    favoritesSet,
    onToggleFavorite,
    onViewDetails,
    onHoverDorm,
    scrollContainerRef,
    onHoveringChange
}) => {
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
                {dorms.map((dorm) => (
                    <div
                        key={dorm.id}
                        onClick={() => onViewDetails(dorm)}
                        onMouseEnter={() => onHoverDorm(dorm.id)}
                        onMouseLeave={() => onHoverDorm(null)}
                        className="flex-shrink-0 w-[240px] snap-start cursor-pointer group"
                    >
                        <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.12)] overflow-hidden h-full border border-gray-100 flex flex-col">
                            <div className="relative h-28 overflow-hidden bg-gray-100 shrink-0">
                                <img
                                    src={dorm.imageUrl}
                                    alt={dorm.name}
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
                                        onToggleFavorite(dorm);
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
                                        <h3 className="font-bold text-gray-900 text-sm leading-tight truncate pr-2">
                                            {dorm.name}
                                        </h3>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            <span className="text-[10px] font-bold text-gray-900">4.8</span>
                                            <span className="text-[9px] text-gray-500">(120)</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mb-1.5 truncate">{dorm.location} Campus</p>
                                </div>
                                <div className="flex items-baseline gap-1 mt-auto">
                                    <span className="font-bold text-sm text-gray-900">{formatPrice(dorm.price)}</span>
                                    <span className="text-[10px] text-gray-500">/ yr</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MapCarousel;
