/**
 * @file ./src/components/housing/dorm-list/EmptyStates.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from 'react';
import { Search } from 'lucide-react';
import { DormListText } from './types';

interface ListEmptyStateProps {
    t: DormListText;
    onClearFilters: () => void;
}

export const ListEmptyState: React.FC<ListEmptyStateProps> = ({ t, onClearFilters }) => {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <Search size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t.noResults}</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">{t.noResultsDesc}</p>
            <button
                onClick={onClearFilters}
                type="button"
                className="text-illini-blue font-medium hover:underline bg-blue-50 px-6 py-2 rounded-full transition-colors"
            >
                {t.clearFilters}
            </button>
        </div>
    );
};

interface MapNoResultsOverlayProps {
    t: DormListText;
    hasPriceFilter: boolean;
    onAction: () => void;
}

export const MapNoResultsOverlay: React.FC<MapNoResultsOverlayProps> = ({
    t,
    hasPriceFilter,
    onAction
}) => {
    return (
        <div className="absolute inset-x-0 top-4 z-[1100] flex justify-center px-4 pointer-events-none">
            <div className="max-w-sm w-full rounded-2xl border border-gray-200 bg-white/95 shadow-xl p-5 text-center pointer-events-auto">
                <p className="text-sm font-medium text-gray-800 mb-4">{t.mapNoResults}</p>
                <button
                    onClick={onAction}
                    type="button"
                    className="px-4 py-2 rounded-lg bg-illini-blue text-white text-sm font-semibold hover:bg-illini-blue/90 transition-colors"
                >
                    {hasPriceFilter ? t.clearPrice : t.clearFilters}
                </button>
            </div>
        </div>
    );
};

interface MapEmptyViewportOverlayProps {
    t: DormListText;
}

export const MapEmptyViewportOverlay: React.FC<MapEmptyViewportOverlayProps> = ({ t }) => {
    return (
        <div className="absolute bottom-6 left-0 right-0 z-10 px-6 xl:hidden">
            <div className="max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4 text-center">
                <p className="text-sm font-medium text-gray-800 mb-0.5">{t.noDormsInArea}</p>
                <p className="text-xs text-gray-500">{t.panToSeeDorms}</p>
            </div>
        </div>
    );
};
