import React, { useState, useMemo } from 'react';
import { Dorm, FilterOption } from '../types';
import { UIUC_DORMS } from '../constants';
import DormCard from './DormCard';
import { Search, SlidersHorizontal } from 'lucide-react';

interface DormListProps {
  onSelectDorm: (dorm: Dorm) => void;
}

const DormList: React.FC<DormListProps> = ({ onSelectDorm }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterOption[]>([]);

  const toggleFilter = (filter: FilterOption) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };

  const filteredDorms = useMemo(() => {
    return UIUC_DORMS.filter(dorm => {
      // Search match
      const searchMatch = dorm.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          dorm.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!searchMatch) return false;

      // Filter match
      if (activeFilters.length === 0) return true;
      
      const matchesAC = activeFilters.includes(FilterOption.AC) ? dorm.ac : true;
      const matchesDining = activeFilters.includes(FilterOption.DINING_IN_BUILDING) ? dorm.dining : true;
      
      // Simple logic for location filters based on tags/location data
      const matchesEng = activeFilters.includes(FilterOption.NEAR_ENGINEERING) 
        ? (dorm.tags.includes('Engineering') || dorm.id === 'isr') 
        : true;
        
      const matchesQuad = activeFilters.includes(FilterOption.NEAR_MAIN_QUAD)
        ? (dorm.location === 'Urbana' || dorm.location === 'Ikenberry') // Broad approximation
        : true;

      return matchesAC && matchesDining && matchesEng && matchesQuad;
    });
  }, [searchTerm, activeFilters]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Controls */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-illini-orange focus:border-transparent sm:text-sm shadow-sm"
              placeholder="Search dorms (e.g., 'quiet', 'engineering', 'social')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <SlidersHorizontal size={20} className="text-gray-400 mr-2 flex-shrink-0" />
            {[FilterOption.AC, FilterOption.DINING_IN_BUILDING, FilterOption.NEAR_ENGINEERING].map((filter) => (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilters.includes(filter)
                    ? 'bg-illini-blue text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredDorms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDorms.map(dorm => (
            <DormCard key={dorm.id} dorm={dorm} onViewDetails={onSelectDorm} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No dorms found matching your criteria. Try adjusting the filters!</p>
          <button 
            onClick={() => {setSearchTerm(''); setActiveFilters([]);}}
            className="mt-4 text-illini-orange font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default DormList;
