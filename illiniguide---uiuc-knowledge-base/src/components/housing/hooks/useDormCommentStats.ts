/**
 * @file ./src/components/housing/hooks/useDormCommentStats.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { useEffect, useState } from 'react';
import { dormCommentsService, DormCommentStats } from '../../../services/dormCommentsService';

/**
 * Fetches aggregate comment stats (total reviews, positive %) for all dorms.
 * Returns a map keyed by dormId.
 */
export function useDormCommentStats() {
    const [stats, setStats] = useState<Record<string, DormCommentStats>>({});

    useEffect(() => {
        dormCommentsService.getAllDormStats().then(setStats);
    }, []);

    return stats;
}
