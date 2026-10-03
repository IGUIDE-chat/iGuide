import type { DormCommentStats } from "@iguide/dorm"
import { useEffect, useState } from "react"

import { getAllDormStats } from "../../../services/dormApi"
import { SHOW_COMMENTS, SHOW_GOOGLE_REVIEWS } from "../constants/featureFlags"

export function useDormCommentStats() {
  const [stats, setStats] = useState<Record<string, DormCommentStats>>({})

  useEffect(() => {
    if (!SHOW_COMMENTS) return
    getAllDormStats().then(async (data) => {
      const updatedStats = { ...data }
      if (SHOW_GOOGLE_REVIEWS) {
        const { GOOGLE_REVIEWS } = await import("../constants/googleReviews")
        GOOGLE_REVIEWS.forEach((review) => {
          const dormId = review.dorm_id
          if (!updatedStats[dormId]) {
            updatedStats[dormId] = {
              dormId,
              totalComments: 0,
              positivePercent: 0,
              thumbsUp: 0,
            }
          }
          const st = updatedStats[dormId]
          st.totalComments += 1
          if (review.dorm_vote === 1) st.thumbsUp += 1
          st.positivePercent =
            st.totalComments > 0 ? Math.round((st.thumbsUp / st.totalComments) * 100) : 0
        })
      }
      setStats(updatedStats)
    })
  }, [])

  return stats
}
