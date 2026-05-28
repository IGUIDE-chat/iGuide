import React, { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRightLeft,
  Bath,
  BedSingle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SquareDashed,
} from "lucide-react"
import { type BathroomScope, type FloorPlan } from "./types/index"
import { type Language } from "../../types"
import { formatPrice } from "./constants/pricing"
import { dormDetailTexts } from "./i18n/dormTexts"
import {
  getBathroomScopeLabel,
  getRoomOptionLabels,
} from "../../utils/roomOptions"

interface DormDetailFloorPlansProps {
  sortedPlans: FloorPlan[]
  defaultPlanScope: BathroomScope
  minPrice: number | null
  maxPrice: number | null
  language: Language
  fadeUp: unknown
  onLightboxOpen: (images: unknown[], index: number) => void
}

const getPlanKey = (plan: FloorPlan, idx: number) =>
  [
    plan.labelCode ?? "plan",
    plan.officialName ?? "unnamed",
    plan.bedCount ?? "na",
    plan.bathroomCount ?? "na",
    idx,
  ].join(":")

const hasPublishedPlanPrice = (price: FloorPlan["price"]): price is number =>
  typeof price === "number" && Number.isFinite(price) && price > 0

const getPublishedPlanPrice = (plan: FloorPlan) =>
  hasPublishedPlanPrice(plan.price) ? plan.price : null

const PlanTitleRow: React.FC<{
  planDisplayTitle: string
  normalizedSummary: string | null
  availabilityBadgeClass: string
  showCheck: boolean
  availabilityLabel: string
  isExpanded: boolean
}> = ({
  planDisplayTitle,
  normalizedSummary,
  availabilityBadgeClass,
  showCheck,
  availabilityLabel,
  isExpanded,
}) => (
  <div className="flex w-full items-center justify-between gap-2 md:justify-start">
    <div className="flex min-w-0 flex-wrap items-center gap-1.5 md:gap-3">
      <h4 className="truncate text-[15px] font-extrabold text-slate-900 md:text-[18px]">
        {planDisplayTitle}
      </h4>
      {normalizedSummary && (
        <span className="text-[12px] font-medium text-slate-500 md:text-[14px]">
          {normalizedSummary}
        </span>
      )}
      <span
        className={`flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap md:gap-1 md:rounded-xl md:px-2.5 md:py-1 md:text-[13px] ${availabilityBadgeClass} `}
      >
        {showCheck && (
          <Check className="size-2.5 md:size-3.5" strokeWidth={3} />
        )}
        {availabilityLabel}
      </span>
    </div>
    <motion.div
      animate={{ rotate: isExpanded ? 180 : 0 }}
      transition={{ duration: 0.25 }}
      className="-mr-1 flex shrink-0 items-center justify-center text-slate-400 md:hidden"
    >
      <ChevronDown className="size-5" />
    </motion.div>
  </div>
)

const PlanRoomDetails: React.FC<{
  bedCount: number | null
  bedLabel: string
  bathLabel: string
  sqft: number | null | undefined
  sqftLabel: string
}> = ({ bedCount, bedLabel, bathLabel, sqft, sqftLabel }) => (
  <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-slate-600 md:mt-0 md:gap-4">
    {bedCount !== null && (
      <>
        <div className="flex items-center gap-1 md:gap-1.5">
          <BedSingle className="size-3.5 text-slate-400 md:size-4" />
          <span className="text-[12px] font-semibold md:text-[14px]">
            {bedLabel}
          </span>
        </div>
        <div className="size-0.5 rounded-full bg-slate-300 md:size-1" />
      </>
    )}
    <div className="flex items-center gap-1 md:gap-1.5">
      <Bath className="size-3.5 text-slate-400 md:size-4" />
      <span className="text-[12px] font-semibold md:text-[14px]">
        {bathLabel}
      </span>
    </div>
    {sqft && (
      <>
        <div className="size-0.5 rounded-full bg-slate-300 md:size-1" />
        <div className="flex items-center gap-1 md:gap-1.5">
          <SquareDashed className="size-3.5 text-slate-400 md:size-4" />
          <span className="text-[12px] font-semibold tabular-nums md:text-[14px]">
            {sqft} {sqftLabel}
            <span className="ml-1 font-medium text-slate-400">
              (~{Math.round(sqft * 0.092903)}㎡)
            </span>
          </span>
        </div>
      </>
    )}
  </div>
)

const PlanCompareCheckbox: React.FC<{
  isCompared: boolean
  label: string
  onToggle: (e: React.MouseEvent) => void
}> = ({ isCompared, label, onToggle }) => (
  <motion.button
    type="button"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.96 }}
    onClick={onToggle}
    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
      isCompared
        ? `border-illini-blue/30 bg-illini-blue/5 text-illini-blue`
        : `border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700`
    } `}
  >
    <div
      className={`flex size-3.5 items-center justify-center rounded-[4px] border transition-colors ${
        isCompared
          ? `border-illini-blue bg-illini-blue text-white`
          : "border-slate-300"
      } `}
    >
      <AnimatePresence>
        {isCompared && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Check className="size-2.5" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    {label}
  </motion.button>
)

const ExpandedImageNav: React.FC<{
  language: Language
  onPrev: (e: React.MouseEvent) => void
  onNext: (e: React.MouseEvent) => void
  currentIndex: number
  totalCount: number
}> = ({ language, onPrev, onNext, currentIndex, totalCount }) => (
  <>
    <button
      type="button"
      aria-label={language === "zh" ? "上一张户型图" : "Previous floor plan image"}
      onClick={onPrev}
      className="absolute top-1/2 left-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
    >
      <ChevronLeft className="size-5" />
    </button>
    <button
      type="button"
      aria-label={language === "zh" ? "下一张户型图" : "Next floor plan image"}
      onClick={onNext}
      className="absolute top-1/2 right-3 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55"
    >
      <ChevronRight className="size-5" />
    </button>
    <div className="absolute right-3 bottom-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
      {currentIndex + 1} / {totalCount}
    </div>
  </>
)

export const DormDetailFloorPlans: React.FC<DormDetailFloorPlansProps> = ({
  sortedPlans,
  defaultPlanScope,
  minPrice,
  maxPrice,
  language,
  fadeUp,
  onLightboxOpen,
}) => {
  const t = dormDetailTexts[language]
  const exitCompareLabel = language === "zh" ? "退出对比" : "Exit Compare"
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showPlanCompare, setShowPlanCompare] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [planImageIndices, setPlanImageIndices] = useState<
    Record<string, number>
  >({})

  const toggleCompare = (key: string) =>
    setCompareIds((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )

  if (sortedPlans.length === 0) {
    return null
  }

  return (
    <motion.section variants={fadeUp} className="space-y-3 pt-2 md:space-y-4">
      <div className="mb-4 flex items-end justify-between md:mb-6">
        <div className="space-y-1 md:space-y-1.5">
          <h3 className="text-[16px] font-bold text-slate-900 md:text-[18px]">
            {language === "zh" ? "户型图与价格" : "Floor Plans & Pricing"}
          </h3>
          <p className="text-[12px] font-medium text-slate-500 md:text-[13px]">
            {t.floorPlansDesc}
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowPlanCompare(!showPlanCompare)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-bold shadow-[0_2px_10px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all md:px-4 md:py-2 md:text-[13px] ${
            showPlanCompare
              ? "border-illini-blue bg-illini-blue text-white"
              : `text-illini-blue border-white/60 bg-white/80 hover:bg-white hover:shadow-[0_4px_15px_rgba(0,0,0,0.04)]`
          } `}
        >
          <ArrowRightLeft className="size-3.5 md:size-4" />
          {showPlanCompare ? exitCompareLabel : t.comparePlans}
        </motion.button>
      </div>

      <div className="space-y-3">
        {sortedPlans.map((plan, idx) => {
          const resolvedBathroomScope = plan.bathroomScope ?? defaultPlanScope
          const option = {
            bedCount: plan.bedCount ?? null,
            bathroomCount: plan.bathroomCount ?? null,
            bathroomScope: resolvedBathroomScope,
            labelCode: plan.labelCode,
          }
          const labels = getRoomOptionLabels(option, language)
          const planKey = getPlanKey(plan, idx)
          const planPrice = getPublishedPlanPrice(plan)
          const planBathroomLabel = getBathroomScopeLabel(
            resolvedBathroomScope,
            language
          )
          const isExpanded = expandedPlanId === planKey
          const isCompared = compareIds.includes(planKey)
          const planDisplayTitle = plan.officialName || labels.primaryLabel
          const normalizedSummary =
            plan.officialName && plan.officialName !== labels.primaryLabel
              ? [labels.primaryLabel, labels.secondaryLabel]
                  .filter(Boolean)
                  .join(" · ")
              : labels.secondaryLabel
          let availabilityLabel: string
          if (plan.available === false) {
            availabilityLabel = language === "zh" ? "暂不可订" : "Sold out"
          } else if (planPrice === null) {
            availabilityLabel =
              language === "zh" ? "价格待公布" : "Price unavailable"
          } else {
            availabilityLabel = t.available
          }

          let availabilityBadgeClass: string
          if (plan.available === false) {
            availabilityBadgeClass = "border-red-200 bg-red-50 text-red-600"
          } else if (planPrice === null) {
            availabilityBadgeClass =
              "border-amber-200 bg-amber-50 text-amber-700"
          } else {
            availabilityBadgeClass =
              "border-[#D1FAE5] bg-[#ECFDF5] text-[#059669]"
          }

          let photos: string[]
          if (plan.photoUrls?.length) {
            photos = plan.photoUrls
          } else if (plan.photoUrl) {
            photos = [plan.photoUrl]
          } else {
            photos = []
          }
          let layouts: string[]
          if (plan.imageUrls?.length) {
            layouts = plan.imageUrls
          } else if (plan.imageUrl) {
            layouts = [plan.imageUrl]
          } else {
            layouts = []
          }
          const thumbSrc = photos[0] || layouts[0]
          const hasThumb = Boolean(thumbSrc) && !imageErrors[`${planKey}-thumb`]

          const planImages: Array<{
            src: string
            alt?: string
            label?: string
          }> = []
          photos.forEach((src, i) =>
            planImages.push({
              src,
              alt: labels.primaryLabel,
              label: `${language === "zh" ? "展示图" : "Photo"}${photos.length > 1 ? ` ${i + 1}` : ""}`,
            })
          )
          layouts.forEach((src, i) =>
            planImages.push({
              src,
              alt: labels.primaryLabel,
              label: `${language === "zh" ? "户型图" : "Floor Plan"}${layouts.length > 1 ? ` ${i + 1}` : ""}`,
            })
          )

          const allExpandedImages = layouts.length > 0 ? layouts : photos
          const safeExpandedIndex =
            allExpandedImages.length > 0
              ? Math.min(
                  planImageIndices[planKey] ?? 0,
                  allExpandedImages.length - 1
                )
              : 0
          const expandedSrc = allExpandedImages[safeExpandedIndex]
          const hasExpandedImage =
            Boolean(expandedSrc) && !imageErrors[`${planKey}-layout`]
          const expandedLightboxIndex =
            layouts.length > 0
              ? photos.length + safeExpandedIndex
              : safeExpandedIndex

          let bedLabel: string
          if (plan.bedSize) {
            bedLabel = plan.bedSize
          } else {
            let bedUnit: string
            if (language === "zh") {
              bedUnit = "张床"
            } else {
              bedUnit = plan.bedCount === 1 ? "Bed" : "Beds"
            }
            bedLabel = `${plan.bedCount} ${bedUnit}`
          }

          let bathLabel: string
          if (plan.bathroomCount !== null && plan.bathroomCount > 0) {
            let bathUnit: string
            if (language === "zh") {
              bathUnit = "卫"
            } else {
              bathUnit = plan.bathroomCount === 1 ? "Bath" : "Baths"
            }
            bathLabel = `${plan.bathroomCount} ${bathUnit}`
          } else {
            bathLabel = planBathroomLabel
          }

          return (
            <motion.div
              key={planKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07, duration: 0.35 }}
              onClick={() => setExpandedPlanId(isExpanded ? null : planKey)}
              className="group cursor-pointer overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow duration-150 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] md:rounded-2xl"
            >
              <div className="flex flex-row items-center gap-4 p-3 md:items-start md:gap-6 md:p-5">
                <button
                  type="button"
                  tabIndex={0}
                  className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-slate-200/60 bg-slate-50 transition-colors group-hover:border-slate-300 md:h-28 md:w-36 md:rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation()
                    onLightboxOpen(planImages, 0)
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (e.currentTarget as HTMLElement).click() } }}
                >
                  {hasThumb ? (
                    <img
                      src={thumbSrc}
                      alt={planDisplayTitle}
                      className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                      onError={() =>
                        setImageErrors((prev) => ({
                          ...prev,
                          [`${planKey}-thumb`]: true,
                        }))
                      }
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-slate-300">
                      <SquareDashed className="size-8" strokeWidth={1} />
                    </div>
                  )}
                </button>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 md:h-28 md:flex-row md:gap-0">
                  <div className="flex h-full min-w-0 flex-col justify-center gap-1.5 py-0.5 md:gap-3">
                    <PlanTitleRow
                      planDisplayTitle={planDisplayTitle}
                      normalizedSummary={normalizedSummary}
                      availabilityBadgeClass={availabilityBadgeClass}
                      showCheck={plan.available !== false && planPrice !== null}
                      availabilityLabel={availabilityLabel}
                      isExpanded={isExpanded}
                    />

                    <PlanRoomDetails
                      bedCount={plan.bedCount}
                      bedLabel={bedLabel}
                      bathLabel={bathLabel}
                      sqft={plan.sqft}
                      sqftLabel={t.sqft || (language === "zh" ? "平方英尺" : "sqft")}
                    />

                    {planPrice === null ? (
                      <div
                        className={`mt-0.5 text-[12px] font-semibold md:hidden ${
                          plan.available === false
                            ? "text-red-500"
                            : "text-amber-600"
                        } `}
                      >
                        {availabilityLabel}
                      </div>
                    ) : (
                      <div className="mt-0.5 flex items-baseline gap-1 md:hidden">
                        <span className="text-[16px] font-extrabold tracking-tight text-slate-900 tabular-nums">
                          {formatPrice(planPrice)}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {t.yr}
                        </span>
                        <span className="ml-1 text-[11px] font-medium text-slate-400 tabular-nums">
                          (~{formatPrice(Math.round(planPrice / 12))}
                          {t.mo})
                        </span>
                      </div>
                    )}

                    {showPlanCompare && (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleCompare(planKey)
                        }}
                        className={`mt-1 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors md:hidden ${
                          isCompared
                            ? `border-illini-blue/30 bg-illini-blue/5 text-illini-blue`
                            : "border-slate-200 bg-white text-slate-500"
                        } `}
                      >
                        <div
                          className={`flex size-3 items-center justify-center rounded-[3px] border transition-colors ${
                            isCompared
                              ? `border-illini-blue bg-illini-blue text-white`
                              : "border-slate-300"
                          } `}
                        >
                          {isCompared && (
                            <Check className="size-2" strokeWidth={3} />
                          )}
                        </div>
                        {t.compareAdd}
                      </motion.button>
                    )}
                  </div>

                  <div className="hidden h-full shrink-0 flex-col items-end justify-between gap-2 py-0.5 md:flex">
                    {planPrice === null ? (
                      <div
                        className={`text-[13px] font-semibold ${
                          plan.available === false
                            ? "text-red-500"
                            : "text-amber-600"
                        } `}
                      >
                        {availabilityLabel}
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-[24px] font-extrabold tracking-tight text-slate-900 tabular-nums">
                            {formatPrice(planPrice)}
                          </span>
                          <span className="text-[13px] font-medium text-slate-500">
                            {t.yr}
                          </span>
                        </div>
                        <div className="mt-1 inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[12px] font-medium text-slate-500 tabular-nums">
                          ~{formatPrice(Math.round(planPrice / 12))}
                          {t.mo}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {showPlanCompare && (
                        <PlanCompareCheckbox
                          isCompared={isCompared}
                          label={t.compareAdd}
                          onToggle={(e) => {
                            e.stopPropagation()
                            toggleCompare(planKey)
                          }}
                        />
                      )}
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex size-8 items-center justify-center rounded-full bg-slate-50 transition-colors group-hover:bg-slate-100"
                      >
                        <ChevronDown className="size-5 text-slate-400" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mx-4 mt-2 border-t border-slate-100/50 p-4 pt-0 md:mx-5 md:p-5">
                      {hasExpandedImage ? (
                        <div className="relative mt-3 md:mt-4">
                          <button
                            type="button"
                            className="w-full cursor-zoom-in"
                            onClick={(e) => {
                              e.stopPropagation()
                              onLightboxOpen(planImages, expandedLightboxIndex)
                            }}
                          >
                            <img
                              src={expandedSrc}
                              alt={`${labels.primaryLabel} floor plan`}
                              className="h-auto w-full rounded-xl border border-slate-200/50 bg-slate-50 transition-opacity hover:opacity-90"
                              onError={() =>
                                setImageErrors((prev) => ({
                                  ...prev,
                                  [`${planKey}-layout`]: true,
                                }))
                              }
                            />
                          </button>
                          {allExpandedImages.length > 1 && (
                            <ExpandedImageNav
                              language={language}
                              onPrev={(event) => {
                                event.stopPropagation()
                                setPlanImageIndices((prev) => ({
                                  ...prev,
                                  [planKey]:
                                    (safeExpandedIndex -
                                      1 +
                                      allExpandedImages.length) %
                                    allExpandedImages.length,
                                }))
                              }}
                              onNext={(event) => {
                                event.stopPropagation()
                                setPlanImageIndices((prev) => ({
                                  ...prev,
                                  [planKey]:
                                    (safeExpandedIndex + 1) %
                                    allExpandedImages.length,
                                }))
                              }}
                              currentIndex={safeExpandedIndex}
                              totalCount={allExpandedImages.length}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center justify-center rounded-xl border border-dashed border-slate-200/50 bg-slate-50/50 p-6 text-[13px] font-medium text-slate-400 md:mt-4 md:p-8 md:text-[14px]">
                          {language === "zh"
                            ? "暂无户型图"
                            : "Floor plan image unavailable"}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {minPrice !== null && maxPrice !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 flex items-center justify-between rounded-xl border border-white/50 bg-white/60 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-md md:rounded-2xl md:p-5"
        >
          <span className="text-[13px] font-semibold text-slate-600 md:text-[14px]">
            {t.priceRange}
          </span>
          <span className="text-[16px] font-extrabold text-slate-900 md:text-[18px]">
            {formatPrice(minPrice)}
            {minPrice === maxPrice ? "" : ` – ${formatPrice(maxPrice)}`}
          </span>
        </motion.div>
      )}
    </motion.section>
  )
}
