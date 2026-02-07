import React from 'react';
import { Dorm } from '../types';
import { MapPin, Utensils, Wind, ArrowRight } from 'lucide-react';

interface DormCardProps {
  dorm: Dorm;
  onViewDetails: (dorm: Dorm) => void;
}

const DormCard: React.FC<DormCardProps> = ({ dorm, onViewDetails }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={dorm.imageUrl} 
          alt={dorm.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-illini-blue shadow-sm">
          {dorm.priceRange}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 leading-tight">{dorm.name}</h3>
        </div>
        
        <div className="flex items-center text-gray-500 text-sm mb-4">
          <MapPin size={14} className="mr-1 text-illini-orange" />
          {dorm.location}
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {dorm.ac && (
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
              <Wind size={10} className="mr-1" /> AC
            </span>
          )}
          {dorm.dining && (
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
              <Utensils size={10} className="mr-1" /> Dining
            </span>
          )}
          {dorm.tags.slice(0, 2).map(tag => (
            <span key={tag} className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
              {tag}
            </span>
          ))}
        </div>

        <p className="text-gray-600 text-sm mb-6 line-clamp-3 flex-grow">
          {dorm.description}
        </p>

        <button 
          onClick={() => onViewDetails(dorm)}
          className="mt-auto w-full py-2.5 px-4 bg-white border-2 border-illini-blue text-illini-blue font-semibold rounded-lg hover:bg-illini-blue hover:text-white transition-colors flex items-center justify-center gap-2 group-hover:gap-3"
        >
          View Details
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default DormCard;
