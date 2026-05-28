import React from "react"
import { motion } from "framer-motion"
import { type DormTag } from "./types/index"
import { type Language } from "../../types"
import { TAG_REGISTRY } from "./constants/metadata"
import { getDetailTagDisplay } from "../../utils/tagLabels"
import { dormDetailTexts } from "./i18n/dormTexts"

interface DormDetailInfoProps {
  neutralTags: DormTag[]
  mutedTags: DormTag[]
  categorizedTags: unknown
  language: Language
  fadeUp: unknown
}

export const DormDetailInfo: React.FC<DormDetailInfoProps> = ({
  neutralTags,
  mutedTags,
  categorizedTags,
  language,
  fadeUp,
}) => {
  const t = dormDetailTexts[language]

  if (neutralTags.length === 0 && mutedTags.length === 0) {
    return null
  }

  return (
    <motion.section variants={fadeUp} className="space-y-3 md:space-y-4">
      <h3 className="text-[16px] font-bold text-slate-900 md:text-[18px]">
        {t.amenities}
      </h3>
      <div className="flex flex-wrap gap-2 md:gap-2.5">
        {neutralTags.map((tag, i) => {
          const Icon = TAG_REGISTRY[tag]?.icon
          return (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              whileHover={{ y: -2, scale: 1.04 }}
              className="flex cursor-default items-center gap-1.5 rounded-lg border border-white/60 bg-white/80 px-2.5 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)] backdrop-blur-md md:rounded-xl md:px-3 md:py-1.5"
            >
              {Icon && (
                <Icon
                  className="size-3.5 text-slate-500 md:size-4"
                  strokeWidth={1.5}
                />
              )}
              <span className="text-[12px] font-semibold text-slate-700 md:text-[13px]">
                {getDetailTagDisplay(tag, categorizedTags, language)}
              </span>
            </motion.div>
          )
        })}
        {mutedTags.map((tag, i) => {
          const Icon = TAG_REGISTRY[tag]?.icon
          return (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * (neutralTags.length + i) }}
              whileHover={{ y: -2, scale: 1.04 }}
              className="flex cursor-default items-center gap-1.5 rounded-lg border border-slate-200/50 bg-slate-100/50 px-2.5 py-1 md:rounded-xl md:px-3 md:py-1.5"
            >
              {Icon && (
                <Icon
                  className="size-3.5 text-slate-400 md:size-4"
                  strokeWidth={1.5}
                />
              )}
              <span className="text-[12px] font-semibold text-slate-500 md:text-[13px]">
                {getDetailTagDisplay(tag, categorizedTags, language)}
              </span>
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}
