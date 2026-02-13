import React from 'react';
import { MapPin } from 'lucide-react';
import { Dorm } from '../../../../types/housing';

interface DormHeroSectionProps {
    dorm: Dorm;
    dormName: string;
    campusLabel: string;
}

const DormHeroSection: React.FC<DormHeroSectionProps> = ({ dorm, dormName, campusLabel }) => {
    return (
        <div className="h-64 md:h-80 w-full relative">
            <img src={dorm.imageUrl} alt={dormName} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                <div className="p-8 text-white">
                    <div className="flex items-center gap-2 mb-2 text-illini-orange font-bold uppercase tracking-wider text-sm">
                        <MapPin size={16} /> {dorm.location} {campusLabel}
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-2 transition-transform duration-150 hover:scale-[1.03] origin-left antialiased tracking-tight">{dormName}</h1>
                    <div className="flex flex-wrap gap-2">
                        {dorm.tags.map((tag) => (
                            <span
                                key={tag}
                                className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium border border-white/30 transition-colors duration-150 hover:bg-white/40 hover:border-white/50"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DormHeroSection;
