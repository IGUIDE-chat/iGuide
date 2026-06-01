/**
 * @file ./src/components/housing/dorm-list/DormGrid.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from "react"

import { type DormCommentStats } from "../../../services/dormCommentsService"
import { type Language } from "../../../types"
import DormCard from "../DormCard"
import { type Dorm } from "../types/index"

interface DormGridProps {
  dorms: Dorm[]
  isListView: boolean
  favoritesSet: Set<string>
  onToggleFavorite: (dorm: Dorm, e?: React.MouseEvent) => void
  onViewDetails: (dorm: Dorm) => void
  onHoverDorm?: (dormId: string | null) => void
  onRatingClick?: (dorm: Dorm, e: React.MouseEvent) => void
  compareIds?: string[]
  onToggleCompare?: (dorm: Dorm) => void
  language: Language
  commentStats?: Record<string, DormCommentStats>
}

const DormGrid: React.FC<DormGridProps> = ({
  dorms,
  isListView,
  favoritesSet,
  onToggleFavorite,
  onViewDetails,
  onHoverDorm,
  onRatingClick,
  compareIds,
  onToggleCompare,
  language,
  commentStats,
}) => {
  return (
    <div
      className={`grid pb-20 xl:pb-6 ${
        isListView
          ? `grid-cols-[repeat(auto-fill,minmax(min(100%,320px),420px))] justify-center gap-6`
          : "grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3"
      } `}
    >
      {dorms.map((dorm) => {
        const stats = commentStats?.[dorm.id]
        return (
          <DormCard
            key={dorm.id}
            dorm={dorm}
            onViewDetails={onViewDetails}
            isFavorite={favoritesSet.has(dorm.id)}
            onToggleFavorite={(d, e) => {
              onToggleFavorite(d, e)
            }}
            isCompared={compareIds?.includes(dorm.id)}
            onToggleCompare={onToggleCompare}
            onHoverDorm={onHoverDorm}
            onRatingClick={onRatingClick}
            language={language}
            positivePercent={stats?.positivePercent}
            totalReviews={stats?.totalComments}
          />
        )
      })}
    </div>
  )
}

export default DormGrid
