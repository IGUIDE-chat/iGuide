import React from 'react';
import { Dorm } from '../../../types/housing';
import { Language } from '../../../types';
import DormCard from '../DormCard';

interface DormGridProps {
    dorms: Dorm[];
    isListView: boolean;
    favoritesSet: Set<string>;
    onToggleFavorite: (dorm: Dorm, e?: React.MouseEvent) => void;
    onViewDetails: (dorm: Dorm) => void;
    language: Language;
}

const DormGrid: React.FC<DormGridProps> = ({
    dorms,
    isListView,
    favoritesSet,
    onToggleFavorite,
    onViewDetails,
    language
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
            {dorms.map((dorm) => (
                <DormCard
                    key={dorm.id}
                    dorm={dorm}
                    onViewDetails={onViewDetails}
                    isFavorite={favoritesSet.has(dorm.id)}
                    onToggleFavorite={(dorm, e) => onToggleFavorite(dorm, e)}
                    language={language}
                />
            ))}
        </div>
    );
};

export default DormGrid;
