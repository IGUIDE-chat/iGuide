/**
 * @file ./src/components/housing/DormDetailHeader.tsx
 * @description DormDetail header section - back button, title, location, tags, pricing cards
 */

import { motion } from "framer-motion"
import { Bath, MapPin, Snowflake, Utensils } from "lucide-react"
import React from "react"

import { type Language } from "../../types"
import { getDormBathroomSummary } from "../../utils/roomOptions"
import { getDetailTagDisplay } from "../../utils/tagLabels"
import {
  TAG_REGISTRY,
  getHousingTypeMeta,
  getLocalizedLabel,
} from "./constants/metadata"
import { type Dorm, type DormTag } from "./types/index"

interface DormDetailHeaderProps {
  dorm: Dorm
  language: Language
  dormName: string
  dormAddress: string | null
  dormLocation: string
  positiveTags: DormTag[]
  fadeUp: unknown
}

export const DormDetailHeader: React.FC<DormDetailHeaderProps> = ({
  dorm,
  language,
  dormName,
  dormAddress,
  dormLocation,
  positiveTags,
  fadeUp,
}) => {
  const housingMeta = getHousingTypeMeta(dorm.housingType)
  const bathroomLabel = getDormBathroomSummary(dorm, language)
  let diningLabel: string
  if (dorm.dining === "inside") {
    diningLabel = language === "zh" ? "自带食堂" : "Dining Hall"
  } else if (dorm.dining === "nearby") {
    diningLabel = language === "zh" ? "附近食堂" : "Dining Nearby"
  } else {
    diningLabel = language === "zh" ? "无食堂" : "No Dining"
  }
  const acZh = dorm.ac ? "有空调" : "无空调"
  const acEn = dorm.ac ? "A/C" : "No A/C"
  const acLabel = language === "zh" ? acZh : acEn

  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col justify-between gap-6 md:flex-row md:items-start md:gap-8"
    >
      <div className="flex-1 space-y-3 md:space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-200/60 px-3 py-1 text-[11px] font-bold text-slate-700 md:text-[12px]">
            {getLocalizedLabel(housingMeta, language)} ({housingMeta.shortLabel}
            )
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/60 px-3 py-1 text-[11px] font-bold text-slate-700 md:text-[12px]">
            <MapPin className="size-3" />
            {dormLocation}
          </span>
        </div>

        <h1 className="text-illini-blue text-3xl font-extrabold tracking-tight md:text-4xl">
          {dormName}
        </h1>

        {dormAddress && (
          <div className="flex items-start gap-1.5 text-[13px] font-medium text-slate-500 md:items-center md:text-[14px]">
            <MapPin className="mt-0.5 size-4 shrink-0 md:mt-0" />
            <span className="leading-tight">{dormAddress}</span>
          </div>
        )}

        {positiveTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {positiveTags.flatMap((tag, i) => {
              const Icon = TAG_REGISTRY[tag]?.icon
              if (
                tag === "llc" &&
                (dorm.categorizedTags?.llcNames?.length ?? 0) > 1
              ) {
                return (dorm.categorizedTags?.llcNames ?? []).map(
                  (llcName, j) => (
                    <motion.span
                      key={`llc-${llcName}`}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + (i + j) * 0.06 }}
                      className="bg-illini-orange/10 text-illini-orange inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-bold md:text-[13px]"
                    >
                      {Icon && <Icon className="size-3.5" strokeWidth={1.5} />}
                      {llcName}
                    </motion.span>
                  )
                )
              }
              return (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="bg-illini-orange/10 text-illini-orange inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-bold md:text-[13px]"
                >
                  {Icon && <Icon className="size-3.5" strokeWidth={1.5} />}
                  {getDetailTagDisplay(tag, dorm.categorizedTags, language)}
                </motion.span>
              )
            })}
          </div>
        )}
      </div>

      {/* Hard Facts cards */}
      <div className="mt-2 flex w-full gap-2 md:mt-0 md:w-auto md:gap-3">
        {/* AC */}
        <div
          className={`flex h-[88px] min-w-[88px] flex-1 flex-col items-center justify-center rounded-2xl border p-2 shadow-sm md:h-[100px] md:min-w-[100px] md:flex-none md:p-3 ${
            dorm.ac
              ? "border-slate-100 bg-white"
              : "border-amber-200 bg-amber-50"
          } `}
        >
          <div className="relative mb-1.5">
            <Snowflake
              className={`size-5 md:size-6 ${dorm.ac ? "text-sky-400" : "text-slate-300"} `}
              strokeWidth={1.5}
            />
            {!dorm.ac && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[2px] w-[140%] rotate-45 rounded-full bg-red-400" />
              </div>
            )}
          </div>
          <span
            className={`text-center text-[11px] leading-tight font-bold md:text-[12px] ${dorm.ac ? "text-slate-700" : "text-amber-700"} `}
          >
            {acLabel}
          </span>
          {!dorm.ac && (
            <span className="mt-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] leading-none font-semibold text-amber-500 md:text-[10px]">
              {language === "zh" ? "注意" : "Note"}
            </span>
          )}
        </div>

        {/* Dining */}
        <div className="flex h-[88px] min-w-[88px] flex-1 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-2 shadow-sm md:h-[100px] md:min-w-[100px] md:flex-none md:p-3">
          <Utensils
            className="mb-1.5 size-5 shrink-0 text-[#52C41A] md:size-6"
            strokeWidth={1.5}
          />
          <span className="text-center text-[11px] leading-tight font-bold text-slate-700 md:text-[12px]">
            {diningLabel}
          </span>
        </div>

        {/* Bathroom */}
        <div className="flex h-[88px] min-w-[88px] flex-1 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-2 shadow-sm md:h-[100px] md:min-w-[100px] md:flex-none md:p-3">
          <Bath
            className="mb-1.5 size-5 shrink-0 text-[#1890FF] md:size-6"
            strokeWidth={1.5}
          />
          <span className="text-center text-[11px] leading-tight font-bold text-slate-700 md:text-[12px]">
            {bathroomLabel}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
