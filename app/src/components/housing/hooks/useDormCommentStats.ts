/**
 * @file ./src/components/housing/hooks/useDormCommentStats.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { useEffect, useState } from "react";
import {
  dormCommentsService,
  DormCommentStats,
} from "../../../services/dormCommentsService";
import { SHOW_GOOGLE_REVIEWS } from "../constants/featureFlags";

/**
 * Fetches aggregate comment stats (total reviews, positive %) for all dorms.
 * Returns a map keyed by dormId.
 */
export function useDormCommentStats() {
  const [stats, setStats] = useState<Record<string, DormCommentStats>>({});

  useEffect(() => {
    dormCommentsService.getAllDormStats().then(async (data) => {
      const updatedStats = { ...data };
      if (SHOW_GOOGLE_REVIEWS) {
        const { GOOGLE_REVIEWS } = await import("../constants/googleReviews");
        GOOGLE_REVIEWS.forEach((review) => {
          const dormId = review.dorm_id;
          if (!updatedStats[dormId]) {
            updatedStats[dormId] = {
              dormId,
              totalComments: 0,
              positivePercent: 0,
              thumbsUp: 0,
            };
          }
          const st = updatedStats[dormId];
          st.totalComments += 1;
          if (review.dorm_vote === 1) st.thumbsUp += 1;
          st.positivePercent =
            st.totalComments > 0
              ? Math.round((st.thumbsUp / st.totalComments) * 100)
              : 0;
        });
      }
      setStats(updatedStats);
    });
  }, []);

  return stats;
}
