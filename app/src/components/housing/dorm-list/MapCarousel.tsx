/**
 * @file ./src/components/housing/dorm-list/MapCarousel.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useRef } from 'react';
import { Heart } from 'lucide-react';
import { Dorm } from '../types/index';
import { Language } from '../../../types';
import { formatPrice } from '../constants/pricing';

/** Max movement (px) between pointer down/up to count as a tap, not a scroll drag. */
const TAP_MOVE_THRESHOLD_PX = 14;

interface MapCarouselCardProps {
    dorm: Dorm;
    isFav: boolean;
    dormName: string;
    locationLabel: string;
    t: { campus: string; perYear: string };
    onToggleFavorite: (dorm: Dorm, e?: React.MouseEvent) => void;
    onViewDetails: (dorm: Dorm) => void;
    onHoverDorm: (id: string | null) => void;
}

const MapCarouselCard: React.FC<MapCarouselCardProps> = ({
    dorm,
    isFav,
    dormName,
    locationLabel,
    t,
    onToggleFavorite,
    onViewDetails,
    onHoverDorm,
}) => {
    const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

    const activateIfTap = (e: React.PointerEvent) => {
        if (!pointerStartRef.current) return;
        if ((e.target as HTMLElement).closest('button')) {
            pointerStartRef.current = null;
            return;
        }
        const dx = e.clientX - pointerStartRef.current.x;
        const dy = e.clientY - pointerStartRef.current.y;
        pointerStartRef.current = null;
        if (Math.hypot(dx, dy) > TAP_MOVE_THRESHOLD_PX) return;
        onViewDetails(dorm);
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onViewDetails(dorm);
                }
            }}
            onPointerDown={(e) => {
                if (e.pointerType === 'mouse' && e.button !== 0) return;
                pointerStartRef.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
                activateIfTap(e);
            }}
            onPointerCancel={() => {
                pointerStartRef.current = null;
            }}
            onMouseEnter={() => onHoverDorm(dorm.id)}
            onMouseLeave={() => onHoverDorm(null)}
            className="flex-shrink-0 w-[210px] snap-start cursor-pointer [touch-action:manipulation]"
        >
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.14)] overflow-hidden border border-gray-100/80 flex flex-row h-[72px]">
                {/* Thumbnail */}
                <div className="relative w-[72px] shrink-0">
                    <img
                        src={dorm.imageUrl}
                        alt={dormName}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover pointer-events-none"
                        onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400';
                        }}
                    />
                    {/* Housing type badge */}
                    {(dorm.housingType === 'URH' || dorm.housingType === 'PCH') && (
                        <div className={`absolute top-1 left-1 text-white text-[8px] font-bold px-1 py-0.5 rounded uppercase tracking-wider ${dorm.housingType === 'URH' ? 'bg-illini-orange/90' : 'bg-illini-blue/90'}`}>
                            {dorm.housingType}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 px-2.5 py-2 flex flex-col justify-between min-w-0">
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
                            {dormName}
                        </h3>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">
                            {locationLabel} {t.campus}
                        </p>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-baseline gap-0.5">
                            <span className="font-bold text-xs text-gray-900">{formatPrice(dorm.price)}</span>
                            <span className="text-[9px] text-gray-400">{t.perYear}</span>
                        </div>
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerUp={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(dorm, e);
                            }}
                            type="button"
                            className="p-1 -mr-0.5 rounded-full"
                        >
                            <Heart
                                className={`w-3.5 h-3.5 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-300'}`}
                                strokeWidth={2}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
        ? { campus: '校区', perYear: '/年' }
        : { campus: 'Campus', perYear: '/ yr' };

    return (
        <div className="absolute bottom-4 left-0 right-0 z-20 px-3 xl:hidden">
            <div
                ref={scrollContainerRef}
                className="flex gap-2.5 overflow-x-auto pb-1 pr-10 snap-x snap-mandatory overscroll-x-contain scrollbar-hide"
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
                    const isFav = favoritesSet.has(dorm.id);

                    return (
                        <MapCarouselCard
                            key={dorm.id}
                            dorm={dorm}
                            isFav={isFav}
                            dormName={dormName}
                            locationLabel={locationLabel}
                            t={t}
                            onToggleFavorite={onToggleFavorite}
                            onViewDetails={onViewDetails}
                            onHoverDorm={onHoverDorm}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default MapCarousel;
