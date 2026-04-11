/**
 * @file ./src/components/housing/store/HousingContext.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  BathroomCountFilter,
  BathroomScope,
  BedCountFilter,
  DormTag,
  FilterOption,
} from "../types/index";
import { getPriceRangeFromData } from "../constants/pricing";
import { useDormData } from "./DormDataContext";

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
  bedCountFilters: BedCountFilter[];
  setBedCountFilters: React.Dispatch<React.SetStateAction<BedCountFilter[]>>;
  bathroomCountFilters: BathroomCountFilter[];
  setBathroomCountFilters: React.Dispatch<
    React.SetStateAction<BathroomCountFilter[]>
  >;
  housingTypeDetails: "ALL" | "URH" | "PCH";
  setHousingTypeDetails: (type: "ALL" | "URH" | "PCH") => void;
  viewMode: "list" | "map";
  setViewMode: (mode: "list" | "map") => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  // Categorized tag filters
  livingConditionFilters: DormTag[];
  setLivingConditionFilters: React.Dispatch<React.SetStateAction<DormTag[]>>;
  facilityFilters: DormTag[];
  setFacilityFilters: React.Dispatch<React.SetStateAction<DormTag[]>>;
  lifestyleFilters: DormTag[];
  setLifestyleFilters: React.Dispatch<React.SetStateAction<DormTag[]>>;
  // Structured filters
  requireAc: boolean;
  setRequireAc: React.Dispatch<React.SetStateAction<boolean>>;
  bathroomTypeFilters: BathroomScope[];
  setBathroomTypeFilters: React.Dispatch<React.SetStateAction<BathroomScope[]>>;
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

const HousingFiltersContext = createContext<
  HousingFiltersContextType | undefined
>(undefined);
const HousingMapUiContext = createContext<HousingMapUiContextType | undefined>(
  undefined
);

export const HousingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { dorms } = useDormData();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOption[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>(
    getPriceRangeFromData(dorms)
  );
  const [locationFilters, setLocationFilters] = useState<string[]>([]);
  const [bedCountFilters, setBedCountFilters] = useState<BedCountFilter[]>([]);
  const [bathroomCountFilters, setBathroomCountFilters] = useState<
    BathroomCountFilter[]
  >([]);
  const [housingTypeDetails, setHousingTypeDetails] = useState<
    "ALL" | "URH" | "PCH"
  >("ALL");
  const [viewMode, setViewMode] = useState<"list" | "map">("map");
  const [sortBy, setSortBy] = useState("name-asc");
  const [showZones, setShowZones] = useState(true);
  const [showZoneLabels, setShowZoneLabels] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  // Categorized tag filters
  const [livingConditionFilters, setLivingConditionFilters] = useState<
    DormTag[]
  >([]);
  const [facilityFilters, setFacilityFilters] = useState<DormTag[]>([]);
  const [lifestyleFilters, setLifestyleFilters] = useState<DormTag[]>([]);
  // Structured filters
  const [requireAc, setRequireAc] = useState(false);
  const [bathroomTypeFilters, setBathroomTypeFilters] = useState<
    BathroomScope[]
  >([]);

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setActiveFilters([]);
    setPriceRange(getPriceRangeFromData(dorms));
    setLocationFilters([]);
    setBedCountFilters([]);
    setBathroomCountFilters([]);
    setHousingTypeDetails("ALL");
    setLivingConditionFilters([]);
    setFacilityFilters([]);
    setLifestyleFilters([]);
    setRequireAc(false);
    setBathroomTypeFilters([]);
  }, [dorms]);

  const filtersValue = useMemo<HousingFiltersContextType>(
    () => ({
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
      bedCountFilters,
      setBedCountFilters,
      bathroomCountFilters,
      setBathroomCountFilters,
      housingTypeDetails,
      setHousingTypeDetails,
      viewMode,
      setViewMode,
      sortBy,
      setSortBy,
      livingConditionFilters,
      setLivingConditionFilters,
      facilityFilters,
      setFacilityFilters,
      lifestyleFilters,
      setLifestyleFilters,
      requireAc,
      setRequireAc,
      bathroomTypeFilters,
      setBathroomTypeFilters,
      clearAllFilters,
    }),
    [
      searchTerm,
      isFilterModalOpen,
      activeFilters,
      priceRange,
      locationFilters,
      bedCountFilters,
      bathroomCountFilters,
      housingTypeDetails,
      viewMode,
      sortBy,
      livingConditionFilters,
      facilityFilters,
      lifestyleFilters,
      requireAc,
      bathroomTypeFilters,
      clearAllFilters,
    ]
  );

  const mapUiValue = useMemo<HousingMapUiContextType>(
    () => ({
      showZones,
      setShowZones,
      showZoneLabels,
      setShowZoneLabels,
      showLandmarks,
      setShowLandmarks,
    }),
    [showZones, showZoneLabels, showLandmarks]
  );

  return (
    <HousingFiltersContext.Provider value={filtersValue}>
      <HousingMapUiContext.Provider value={mapUiValue}>
        {children}
      </HousingMapUiContext.Provider>
    </HousingFiltersContext.Provider>
  );
};

/* eslint-disable react-refresh/only-export-components */
export const useHousingFilters = () => {
  const context = useContext(HousingFiltersContext);
  if (context === undefined) {
    throw new Error("useHousingFilters must be used within a HousingProvider");
  }
  return context;
};

/* eslint-disable react-refresh/only-export-components */
export const useHousingMapUi = () => {
  const context = useContext(HousingMapUiContext);
  if (context === undefined) {
    throw new Error("useHousingMapUi must be used within a HousingProvider");
  }
  return context;
};

/* eslint-disable react-refresh/only-export-components */
export const useHousing = (): HousingContextType => {
  const filters = useHousingFilters();
  const mapUi = useHousingMapUi();

  const context = useMemo(() => ({ ...filters, ...mapUi }), [filters, mapUi]);

  if (context === undefined) {
    throw new Error("useHousing must be used within a HousingProvider");
  }
  return context;
};
