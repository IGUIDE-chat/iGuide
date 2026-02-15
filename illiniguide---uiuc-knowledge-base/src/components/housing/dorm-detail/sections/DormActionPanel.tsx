import React from 'react';
import { Clock, Star } from 'lucide-react';

interface DormActionPanelProps {
    showViewingHistory: boolean;
    showFavorites: boolean;
    isSaved: boolean;
    viewingHistoryLabel: string;
    favoritesLabel: string;
    saveLabel: string;
    savedLabel: string;
    onToggleViewingHistory: () => void;
    onToggleFavorites: () => void;
    onToggleSave: () => void;
}

const DormActionPanel: React.FC<DormActionPanelProps> = ({
    showViewingHistory,
    showFavorites,
    isSaved,
    viewingHistoryLabel,
    favoritesLabel,
    saveLabel,
    savedLabel,
    onToggleViewingHistory,
    onToggleFavorites,
    onToggleSave
}) => {
    return (
        <>
            <div className="flex gap-2 mb-3">
                <button
                    onClick={onToggleViewingHistory}
                    type="button"
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${showViewingHistory
                            ? 'bg-illini-blue text-white shadow-lg'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-illini-blue hover:text-illini-blue'
                        }`}
                >
                    <Clock size={14} />
                    {viewingHistoryLabel}
                </button>
                <button
                    onClick={onToggleFavorites}
                    type="button"
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${showFavorites
                            ? 'bg-illini-orange text-white shadow-lg'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-illini-orange hover:text-illini-orange'
                        }`}
                >
                    <Star size={14} className={isSaved ? 'fill-current' : ''} />
                    {favoritesLabel}
                </button>
            </div>

            <button
                onClick={onToggleSave}
                type="button"
                className={`w-full py-3 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 ${isSaved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-illini-orange hover:bg-illini-orange-dark'
                    }`}
            >
                {isSaved ? savedLabel : saveLabel}
            </button>
        </>
    );
};

export default DormActionPanel;
