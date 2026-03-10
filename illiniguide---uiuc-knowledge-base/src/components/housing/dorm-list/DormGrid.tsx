import React from 'react';
import { Dorm } from '../../../types/housing';
import { Language } from '../../../types';
import { DormCommentStats } from '../../../services/dormCommentsService';
import DormCard from '../DormCard';

interface DormGridProps {
    dorms: Dorm[];
    isListView: boolean;
    favoritesSet: Set<string>;
    onToggleFavorite: (dorm: Dorm, e?: React.MouseEvent) => void;
    onViewDetails: (dorm: Dorm) => void;
    onHoverDorm?: (dormId: string | null) => void;
    language: Language;
    commentStats?: Record<string, DormCommentStats>;
}

const DormGrid: React.FC<DormGridProps> = ({
    dorms,
    isListView,
    favoritesSet,
    onToggleFavorite,
    onViewDetails,
    onHoverDorm,
    language,
    commentStats,
}) => {
    return (
        <div
            className={`
                grid gap-6 pb-20 xl:pb-6
                ${isListView
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                    : 'grid-cols-1 2xl:grid-cols-2'
                }
            `}
        >
            {dorms.map((dorm) => {
                const stats = commentStats?.[dorm.id];
                return (
                    <DormCard
                        key={dorm.id}
                        dorm={dorm}
                        onViewDetails={onViewDetails}
                        isFavorite={favoritesSet.has(dorm.id)}
                        onToggleFavorite={(d, e) => onToggleFavorite(d, e)}
                        onHoverDorm={onHoverDorm}
                        language={language}
                        positivePercent={stats?.positivePercent}
                        totalReviews={stats?.totalComments}
                    />
                );
            })}
        </div>
    );
};

export default DormGrid;
