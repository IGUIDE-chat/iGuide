import React from 'react';
import { Search, Map as MapIcon, List, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import SortingDropdown from '../SortingDropdown';
import { DormListText } from './types';

interface DormListHeaderProps {
    t: DormListText;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    hasActiveFilters: boolean;
    activeFilterCount: number;
    onOpenFilters: () => void;
    sortBy: string;
    setSortBy: (sortBy: string) => void;
    viewMode: 'list' | 'map';
    setViewMode: (mode: 'list' | 'map') => void;
}

const DormListHeader: React.FC<DormListHeaderProps> = ({
    t,
    searchTerm,
    setSearchTerm,
    hasActiveFilters,
    activeFilterCount,
    onOpenFilters,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode
}) => {
    const isMapView = viewMode === 'map';
    const isListView = !isMapView;

    return (
        // 【修改点 1】：把原本的 z-10 改成了 z-50，让整个顶部栏位于最上层
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50 transition-all shadow-sm">
            <div className="px-6 py-4 flex flex-col xl:flex-row items-center gap-4">
                <div className="flex-1 w-full max-w-4xl mx-auto flex items-center justify-center gap-3">
                    <div className="relative w-full max-w-md shrink-0">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-full leading-5 bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20 sm:text-sm transition-all shadow-sm hover:bg-white hover:shadow-md focus:bg-white focus:shadow-md"
                            placeholder={t.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex-shrink-0 relative">
                        <button
                            onClick={onOpenFilters}
                            type="button"
                            className={`
                                px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap flex items-center gap-2
                                ${hasActiveFilters
                                    ? 'border-black text-black bg-gray-50'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-black'
                                }
                            `}
                        >
                            <SlidersHorizontal size={16} />
                            {t.filters}
                        </button>
                        {hasActiveFilters && (
                            <div className="absolute -top-1.5 -right-1.5 bg-black text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                {activeFilterCount}
                            </div>
                        )}
                    </div>

                    {/* 【修改点 2】：在这里加上了 relative z-50，确保下拉菜单弹出时不会被下方的卡片遮挡 */}
                    <div className="flex-shrink-0 relative z-50">
                        <SortingDropdown sortBy={sortBy} onSortChange={setSortBy} viewMode={viewMode} />
                    </div>
                </div>

                <div className="flex items-center gap-3 justify-end w-auto xl:w-fit shrink-0">
                    <div className="hidden sm:flex bg-gray-100 rounded-lg p-1 relative">
                        <motion.div
                            className="absolute bg-white shadow-sm rounded-md border border-gray-200/50"
                            initial={false}
                            animate={{ left: isListView ? '4px' : 'calc(50% - 2px)' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{
                                width: 'calc(50% - 6px)',
                                height: 'calc(100% - 8px)',
                                top: '4px'
                            }}
                        />

                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setViewMode('list');
                            }}
                            className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors duration-200 text-sm font-medium ${isListView
                                ? 'text-black'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            title={t.viewList}
                            type="button"
                        >
                            <List size={16} />
                            <span className="hidden lg:inline">{t.viewList}</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setViewMode('map');
                            }}
                            className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors duration-200 text-sm font-medium ${isMapView
                                ? 'text-black'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            title={t.viewMap}
                            type="button"
                        >
                            <MapIcon size={16} />
                            <span className="hidden lg:inline">{t.viewMap}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DormListHeader;