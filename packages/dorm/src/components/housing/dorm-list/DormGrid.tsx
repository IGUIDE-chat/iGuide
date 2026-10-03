import React from "react"

import { DormCommentStats } from "../../../services/dormCommentsService"
import { Language } from "../../../types"
import DormCard from "../DormCard"
import { Dorm } from "../types/index"

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
            onToggleFavorite={(d, e) => onToggleFavorite(d, e)}
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
