import React from 'react';
import { MapPin } from 'lucide-react';
import { Dorm } from '../../../../types/housing';
import { Language } from '../../../../types';
import { getHeroTags, getTagDisplay } from '../../../../utils/tagLabels';

interface DormHeroSectionProps {
    dorm: Dorm;
    dormName: string;
    campusLabel: string;
    language?: Language;
}

const DormHeroSection: React.FC<DormHeroSectionProps> = ({ dorm, dormName, campusLabel, language = 'en' }) => {
    const allImages = [dorm.imageUrl, ...(dorm.galleryImages || [])].filter(Boolean);
    const defaultTags = { livingConditions: [], facilities: [], lifestyle: [] };
    const heroTags = getHeroTags(dorm.categorizedTags ?? defaultTags, 8);

    return (
        <div className="h-56 md:h-80 w-full relative group">
            <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide no-scrollbar">
                {allImages.map((img, i) => (
                    <img key={i} src={img} alt={`${dormName} ${i + 1}`} className="w-full h-full object-cover shrink-0 snap-center" />
                ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent flex items-end">
                <div className="p-4 md:p-8 text-white w-full">
                    <div className="flex items-center gap-1.5 mb-1 text-illini-orange font-bold uppercase tracking-wider text-xs md:text-sm">
                        <MapPin size={13} /> {dorm.location} {campusLabel}
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-2 antialiased tracking-tight leading-tight">{dormName}</h1>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {heroTags.map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 md:px-3 md:py-1 bg-white/20 rounded-full text-xs md:text-sm font-medium border border-white/30"
                            >
                                {getTagDisplay(tag, language)}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DormHeroSection;
