import React from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, ExternalLink, ThumbsUp } from "lucide-react"
import { type Language } from "../../types"
import { dormDetailTexts } from "./i18n/dormTexts"

interface DormDetailGalleryProps {
  heroImage: string
  heroImages: string[]
  heroImageIndex: number
  setHeroImageIndex: (index: number) => void
  dormName: string
  dormDesc: string
  website?: string
  housingType: string
  positivePercent: number | null
  totalReviews: number
  language: Language
  onImageClick: () => void
  onReviewClick: () => void
}

const InlineImageNavButton: React.FC<{
  direction: "prev" | "next"
  label: string
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
}> = ({ direction, label, onClick, className = "" }) => {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 ${className} `}
    >
      <Icon className="size-5" />
    </button>
  )
}

export const DormDetailGallery: React.FC<DormDetailGalleryProps> = ({
  heroImage,
  heroImages,
  heroImageIndex,
  setHeroImageIndex,
  dormName,
  dormDesc,
  website,
  housingType,
  positivePercent,
  totalReviews,
  language,
  onImageClick,
  onReviewClick,
}) => {
  const t = dormDetailTexts[language]
  const safeHeroImageIndex =
    heroImages.length > 0 ? Math.min(heroImageIndex, heroImages.length - 1) : 0

  return (
    <div className="space-y-5 md:space-y-6">
      {heroImage && (
        <button
          type="button"
          tabIndex={0}
          className="relative aspect-4/3 w-full cursor-zoom-in overflow-hidden bg-slate-100 shadow-sm sm:aspect-video md:aspect-21/9 md:rounded-2xl md:rounded-3xl md:border md:border-white/60"
          onClick={onImageClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              ;(e.currentTarget as HTMLElement).click()
            }
          }}
        >
          <motion.img
            src={heroImage}
            alt={dormName}
            className="size-full object-cover"
            initial={{ scale: 1.04 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          {positivePercent !== null && (
            <motion.button
              type="button"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              onClick={(e) => {
                e.stopPropagation()
                onReviewClick()
              }}
              className="absolute top-3 right-3 flex cursor-pointer items-center gap-1 rounded-full border border-white/50 bg-white/80 px-2.5 py-1 shadow-sm backdrop-blur-md transition-colors hover:bg-white/95 md:top-4 md:right-4 md:gap-1.5 md:px-3 md:py-1.5"
            >
              <ThumbsUp className="fill-illini-orange text-illini-orange size-3.5 md:size-4" />
              <span className="text-[12px] font-bold text-slate-900 md:text-[13px]">
                {positivePercent}
                {t.positiveRating} ({totalReviews})
              </span>
            </motion.button>
          )}
          {heroImages.length > 1 && (
            <>
              <InlineImageNavButton
                direction="prev"
                label={language === "zh" ? "上一张主图" : "Previous main image"}
                onClick={(event) => {
                  event.stopPropagation()
                  setHeroImageIndex(
                    (safeHeroImageIndex - 1 + heroImages.length) %
                      heroImages.length
                  )
                }}
                className="left-3 md:left-4"
              />
              <InlineImageNavButton
                direction="next"
                label={language === "zh" ? "下一张主图" : "Next main image"}
                onClick={(event) => {
                  event.stopPropagation()
                  setHeroImageIndex(
                    (safeHeroImageIndex + 1) % heroImages.length
                  )
                }}
                className="right-3 md:right-4"
              />
              <div className="absolute right-3 bottom-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm md:right-4 md:bottom-4">
                {safeHeroImageIndex + 1} / {heroImages.length}
              </div>
            </>
          )}
        </button>
      )}

      <div className="space-y-3 pt-2">
        <p className="max-w-4xl text-[14px] leading-relaxed font-medium text-slate-600 md:text-[15px]">
          {dormDesc}
        </p>
        {(website || housingType === "URH") && (
          <a
            href={website || "https://housing.illinois.edu/"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-200 md:text-[12px]"
          >
            <span>{t.viewWebsite}</span>
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </div>
  )
}
