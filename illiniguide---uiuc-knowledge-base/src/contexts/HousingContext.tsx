import React, { createContext, useContext, useMemo, useState, ReactNode, useCallback } from 'react';
import { DormTag, FilterOption, RoomType } from '../types/housing';
import { getPriceRangeFromData } from '../constants/housing/pricing';
import { useDormData } from './DormDataContext';

interface HousingFiltersContextType {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    isFilterModalOpen: boolean;
    setIsFilterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    activeFilters: FilterOption[];
    setActiveFilters: React.Dispatch<React.SetStateAction<FilterOption[]>>;
    priceRange: [number, number];
    setPriceRange: React.Dispatch<React.SetStateAction<[number, number]>>;
    locationFilters: string[];
    setLocationFilters: React.Dispatch<React.SetStateAction<string[]>>;
    typeFilters: string[];
    setTypeFilters: React.Dispatch<React.SetStateAction<string[]>>;
    roomTypeFilters: RoomType[];
    setRoomTypeFilters: React.Dispatch<React.SetStateAction<RoomType[]>>;
    housingTypeDetails: 'ALL' | 'URH' | 'PCH';
    setHousingTypeDetails: (type: 'ALL' | 'URH' | 'PCH') => void;
    viewMode: 'list' | 'map';
    setViewMode: (mode: 'list' | 'map') => void;
    sortBy: string;
    setSortBy: (sort: string) => void;
    // Legacy structured tag filters
    amenityFilters: string[];
    setAmenityFilters: React.Dispatch<React.SetStateAction<string[]>>;
    communityFilters: string[];
    setCommunityFilters: React.Dispatch<React.SetStateAction<string[]>>;
    llcFilters: string[];
    setLlcFilters: React.Dispatch<React.SetStateAction<string[]>>;
    proximityFilters: string[];
    setProximityFilters: React.Dispatch<React.SetStateAction<string[]>>;
    // New categorized tag filters
    livingConditionFilters: DormTag[];
    setLivingConditionFilters: React.Dispatch<React.SetStateAction<DormTag[]>>;
    facilityFilters: DormTag[];
    setFacilityFilters: React.Dispatch<React.SetStateAction<DormTag[]>>;
    lifestyleFilters: DormTag[];
    setLifestyleFilters: React.Dispatch<React.SetStateAction<DormTag[]>>;
    clearAllFilters: () => void;
}

interface HousingMapUiContextType {
    showZones: boolean;
    setShowZones: React.Dispatch<React.SetStateAction<boolean>>;
    showZoneLabels: boolean;
    setShowZoneLabels: React.Dispatch<React.SetStateAction<boolean>>;
    showLandmarks: boolean;
    setShowLandmarks: React.Dispatch<React.SetStateAction<boolean>>;
}

type HousingContextType = HousingFiltersContextType & HousingMapUiContextType;

const HousingFiltersContext = createContext<HousingFiltersContextType | undefined>(undefined);
const HousingMapUiContext = createContext<HousingMapUiContextType | undefined>(undefined);

export const HousingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { dorms } = useDormData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterOption[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>(getPriceRangeFromData(dorms));
    const [locationFilters, setLocationFilters] = useState<string[]>([]);
    const [typeFilters, setTypeFilters] = useState<string[]>([]);
    const [roomTypeFilters, setRoomTypeFilters] = useState<RoomType[]>([]);
    const [housingTypeDetails, setHousingTypeDetails] = useState<'ALL' | 'URH' | 'PCH'>('ALL');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
    const [sortBy, setSortBy] = useState('name-asc');
    const [showZones, setShowZones] = useState(true);
    const [showZoneLabels, setShowZoneLabels] = useState(true);
    const [showLandmarks, setShowLandmarks] = useState(true);
    // Legacy structured tag filters
    const [amenityFilters, setAmenityFilters] = useState<string[]>([]);
    const [communityFilters, setCommunityFilters] = useState<string[]>([]);
    const [llcFilters, setLlcFilters] = useState<string[]>([]);
    const [proximityFilters, setProximityFilters] = useState<string[]>([]);
    // New categorized tag filters
    const [livingConditionFilters, setLivingConditionFilters] = useState<DormTag[]>([]);
    const [facilityFilters, setFacilityFilters] = useState<DormTag[]>([]);
    const [lifestyleFilters, setLifestyleFilters] = useState<DormTag[]>([]);

    const clearAllFilters = useCallback(() => {
        setSearchTerm('');
        setActiveFilters([]);
        setPriceRange(getPriceRangeFromData(dorms));
        setLocationFilters([]);
        setTypeFilters([]);
        setRoomTypeFilters([]);
        setHousingTypeDetails('ALL');
        setAmenityFilters([]);
        setCommunityFilters([]);
        setLlcFilters([]);
        setProximityFilters([]);
        setLivingConditionFilters([]);
        setFacilityFilters([]);
        setLifestyleFilters([]);
    }, [dorms]);

    const filtersValue = useMemo<HousingFiltersContextType>(() => ({
        searchTerm,
        setSearchTerm,
        isFilterModalOpen,
        setIsFilterModalOpen,
        activeFilters,
        setActiveFilters,
        priceRange,
        setPriceRange,
        locationFilters,
        setLocationFilters,
        typeFilters,
        setTypeFilters,
        roomTypeFilters,
        setRoomTypeFilters,
        housingTypeDetails,
        setHousingTypeDetails,
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        amenityFilters,
        setAmenityFilters,
        communityFilters,
        setCommunityFilters,
        llcFilters,
        setLlcFilters,
        proximityFilters,
        setProximityFilters,
        livingConditionFilters,
        setLivingConditionFilters,
        facilityFilters,
        setFacilityFilters,
        lifestyleFilters,
        setLifestyleFilters,
        clearAllFilters
    }), [
        searchTerm,
        isFilterModalOpen,
        activeFilters,
        priceRange,
        locationFilters,
        typeFilters,
        roomTypeFilters,
        housingTypeDetails,
        viewMode,
        sortBy,
        amenityFilters,
        communityFilters,
        llcFilters,
        proximityFilters,
        livingConditionFilters,
        facilityFilters,
        lifestyleFilters,
        clearAllFilters
    ]);

    const mapUiValue = useMemo<HousingMapUiContextType>(() => ({
        showZones,
        setShowZones,
        showZoneLabels,
        setShowZoneLabels,
        showLandmarks,
        setShowLandmarks
    }), [showZones, showZoneLabels, showLandmarks]);

    return (
        <HousingFiltersContext.Provider value={filtersValue}>
            <HousingMapUiContext.Provider value={mapUiValue}>
                {children}
            </HousingMapUiContext.Provider>
        </HousingFiltersContext.Provider>
    );
};

export const useHousingFilters = () => {
    const context = useContext(HousingFiltersContext);
    if (context === undefined) {
        throw new Error('useHousingFilters must be used within a HousingProvider');
    }
    return context;
};

export const useHousingMapUi = () => {
    const context = useContext(HousingMapUiContext);
    if (context === undefined) {
        throw new Error('useHousingMapUi must be used within a HousingProvider');
    }
    return context;
};

export const useHousing = (): HousingContextType => {
    const filters = useHousingFilters();
    const mapUi = useHousingMapUi();

    const context = useMemo(
        () => ({ ...filters, ...mapUi }),
        [filters, mapUi]
    );

    if (context === undefined) {
        throw new Error('useHousing must be used within a HousingProvider');
    }
    return context;
};
