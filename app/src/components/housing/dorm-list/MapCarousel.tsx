/**
 * @file ./src/components/housing/dorm-list/MapCarousel.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useRef } from "react"
import { Heart } from "lucide-react"
import { type Dorm } from "../types/index"
import { type Language } from "../../../types"
import { formatPrice } from "../constants/pricing"

/** Max movement (px) between pointer down/up to count as a tap, not a scroll drag. */
const TAP_MOVE_THRESHOLD_PX = 14

interface MapCarouselCardProps {
  dorm: Dorm
  isFav: boolean
  dormName: string
  locationLabel: string
  t: { campus: string; perYear: string }
  onToggleFavorite: (dorm: Dorm, e?: React.MouseEvent) => void
  onViewDetails: (dorm: Dorm) => void
  onHoverDorm: (id: string | null) => void
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
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)

  const activateIfTap = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) {
      return
    }
    if ((e.target as HTMLElement).closest("button")) {
      pointerStartRef.current = null
      return
    }
    const dx = e.clientX - pointerStartRef.current.x
    const dy = e.clientY - pointerStartRef.current.y
    pointerStartRef.current = null
    if (Math.hypot(dx, dy) > TAP_MOVE_THRESHOLD_PX) {
      return
    }
    onViewDetails(dorm)
  }

  return (
    <button
      type="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onViewDetails(dorm)
        }
      }}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) {
          return
        }
        pointerStartRef.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerUp={(e) => {
        activateIfTap(e)
      }}
      onPointerCancel={() => {
        pointerStartRef.current = null
      }}
      onMouseEnter={() => {
        onHoverDorm(dorm.id)
      }}
      onMouseLeave={() => {
        onHoverDorm(null)
      }}
      className="w-[210px] shrink-0 cursor-pointer touch-manipulation snap-start"
    >
      <div className="flex h-[72px] flex-row overflow-hidden rounded-xl border border-gray-100/80 bg-white/95 shadow-[0_4px_14px_rgba(0,0,0,0.14)] backdrop-blur-md">
        {/* Thumbnail */}
        <div className="relative w-[72px] shrink-0">
          <img
            src={dorm.imageUrl}
            alt={dormName}
            loading="lazy"
            decoding="async"
            className="pointer-events-none size-full object-cover"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400"
            }}
          />
          {/* Housing type badge */}
          {(dorm.housingType === "URH" || dorm.housingType === "PCH") && (
            <div
              className={`absolute top-1 left-1 rounded-sm px-1 py-0.5 text-[8px] font-bold tracking-wider text-white uppercase ${
                dorm.housingType === "URH"
                  ? `bg-illini-orange/90`
                  : `bg-illini-blue/90`
              } `}
            >
              {dorm.housingType}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between px-2.5 py-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm/tight font-bold text-gray-900">
              {dormName}
            </h3>
            <p className="mt-0.5 truncate text-[10px] text-gray-500">
              {locationLabel} {t.campus}
            </p>
          </div>
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-baseline gap-0.5">
              <span className="text-xs font-bold text-gray-900">
                {formatPrice(dorm.price)}
              </span>
              <span className="text-[9px] text-gray-400">{t.perYear}</span>
            </div>
            <button
              onPointerDown={(e) => {
                e.stopPropagation()
              }}
              onPointerUp={(e) => {
                e.stopPropagation()
              }}
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(dorm, e)
              }}
              type="button"
              className="-mr-0.5 rounded-full p-1"
            >
              <Heart
                className={`size-3.5 transition-colors ${isFav ? `fill-red-500 text-red-500` : `text-gray-300`} `}
                strokeWidth={2}
              />
            </button>
          </div>
        </div>
      </div>
    </button>
  )
}

interface MapCarouselProps {
  dorms: Dorm[]
  language: Language
  favoritesSet: Set<string>
  onToggleFavorite: (dorm: Dorm, e?: React.MouseEvent) => void
  onViewDetails: (dorm: Dorm) => void
  onHoverDorm: (id: string | null) => void
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  onHoveringChange: (hovering: boolean) => void
}

const MapCarousel: React.FC<MapCarouselProps> = ({
  dorms,
  language,
  favoritesSet,
  onToggleFavorite,
  onViewDetails,
  onHoverDorm,
  scrollContainerRef,
  onHoveringChange,
}) => {
  const t =
    language === "zh"
      ? { campus: "校区", perYear: "/年" }
      : { campus: "Campus", perYear: "/ yr" }

  return (
    <div className="absolute inset-x-0 bottom-4 z-20 px-3 xl:hidden">
      <div
        ref={scrollContainerRef}
        className="scrollbar-hide flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain pr-10 pb-1"
        style={{
          scrollBehavior: "smooth",
          scrollPaddingInlineStart: "4px",
          scrollPaddingInlineEnd: "24px",
        }}
        onMouseEnter={() => {
          onHoveringChange(true)
        }}
        onMouseLeave={() => {
          onHoveringChange(false)
        }}
        onTouchStart={() => {
          onHoveringChange(true)
        }}
        onTouchEnd={() => {
          onHoveringChange(false)
        }}
      >
        {dorms.map((dorm) => {
          const dormName =
            language === "zh" && dorm.name_zh ? dorm.name_zh : dorm.name
          const locationLabel =
            language === "zh" && dorm.location_zh
              ? dorm.location_zh
              : dorm.location
          const isFav = favoritesSet.has(dorm.id)

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
          )
        })}
      </div>
    </div>
  )
}

export default MapCarousel
