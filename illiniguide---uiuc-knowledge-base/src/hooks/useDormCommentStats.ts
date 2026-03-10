import { useEffect, useState } from 'react';
import { dormCommentsService, DormCommentStats } from '../services/dormCommentsService';

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
