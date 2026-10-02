import React, { createContext, useContext, useMemo, useState, ReactNode, useCallback } from "react"

import { getPriceRangeFromData } from "../constants/pricing"
import {
  BathroomCountFilter,
  BathroomScope,
  BedCountFilter,
  DormTag,
  FilterOption,
} from "../types/index"
import { useDormData } from "./DormDataContext"
import { useRetainedState } from "./retainedState"

interface HousingFiltersContextType {
  searchTerm: string
  setSearchTerm: (term: string) => void
  isFilterModalOpen: boolean
  setIsFilterModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  activeFilters: FilterOption[]
  setActiveFilters: React.Dispatch<React.SetStateAction<FilterOption[]>>
  priceRange: [number, number]
  setPriceRange: React.Dispatch<React.SetStateAction<[number, number]>>
  locationFilters: string[]
  setLocationFilters: React.Dispatch<React.SetStateAction<string[]>>
  bedCountFilters: BedCountFilter[]
  setBedCountFilters: React.Dispatch<React.SetStateAction<BedCountFilter[]>>
  bathroomCountFilters: BathroomCountFilter[]
  setBathroomCountFilters: React.Dispatch<React.SetStateAction<BathroomCountFilter[]>>
  housingTypeDetails: "ALL" | "URH" | "PCH"
  setHousingTypeDetails: (type: "ALL" | "URH" | "PCH") => void
  viewMode: "list" | "map"
  setViewMode: (mode: "list" | "map") => void
  sortBy: string
  setSortBy: (sort: string) => void
  livingConditionFilters: DormTag[]
  setLivingConditionFilters: React.Dispatch<React.SetStateAction<DormTag[]>>
  facilityFilters: DormTag[]
  setFacilityFilters: React.Dispatch<React.SetStateAction<DormTag[]>>
  lifestyleFilters: DormTag[]
  setLifestyleFilters: React.Dispatch<React.SetStateAction<DormTag[]>>
  requireAc: boolean
  setRequireAc: React.Dispatch<React.SetStateAction<boolean>>
  bathroomTypeFilters: BathroomScope[]
  setBathroomTypeFilters: React.Dispatch<React.SetStateAction<BathroomScope[]>>
  clearAllFilters: () => void
}

interface HousingMapUiContextType {
  showZones: boolean
  setShowZones: React.Dispatch<React.SetStateAction<boolean>>
  showZoneLabels: boolean
  setShowZoneLabels: React.Dispatch<React.SetStateAction<boolean>>
  showLandmarks: boolean
  setShowLandmarks: React.Dispatch<React.SetStateAction<boolean>>
}

type HousingContextType = HousingFiltersContextType & HousingMapUiContextType

const HousingFiltersContext = createContext<HousingFiltersContextType | undefined>(undefined)
const HousingMapUiContext = createContext<HousingMapUiContextType | undefined>(undefined)

export const HousingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { dorms } = useDormData()
  const [searchTerm, setSearchTerm] = useRetainedState("housing.searchTerm", "")
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useRetainedState<FilterOption[]>(
    "housing.activeFilters",
    [],
  )
  const [priceRange, setPriceRange] = useRetainedState<[number, number]>(
    "housing.priceRange",
    getPriceRangeFromData(dorms),
  )
  const [locationFilters, setLocationFilters] = useRetainedState<string[]>(
    "housing.locationFilters",
    [],
  )
  const [bedCountFilters, setBedCountFilters] = useRetainedState<BedCountFilter[]>(
    "housing.bedCountFilters",
    [],
  )
  const [bathroomCountFilters, setBathroomCountFilters] = useRetainedState<BathroomCountFilter[]>(
    "housing.bathroomCountFilters",
    [],
  )
  const [housingTypeDetails, setHousingTypeDetails] = useRetainedState<"ALL" | "URH" | "PCH">(
    "housing.housingTypeDetails",
    "ALL",
  )
  const [viewMode, setViewMode] = useRetainedState<"list" | "map">("housing.viewMode", "map")
  const [sortBy, setSortBy] = useRetainedState("housing.sortBy", "name-asc")
  const [showZones, setShowZones] = useRetainedState("housing.showZones", true)
  const [showZoneLabels, setShowZoneLabels] = useRetainedState("housing.showZoneLabels", true)
  const [showLandmarks, setShowLandmarks] = useRetainedState("housing.showLandmarks", true)
  const [livingConditionFilters, setLivingConditionFilters] = useRetainedState<DormTag[]>(
    "housing.livingConditionFilters",
    [],
  )
  const [facilityFilters, setFacilityFilters] = useRetainedState<DormTag[]>(
    "housing.facilityFilters",
    [],
  )
  const [lifestyleFilters, setLifestyleFilters] = useRetainedState<DormTag[]>(
    "housing.lifestyleFilters",
    [],
  )
  const [requireAc, setRequireAc] = useRetainedState("housing.requireAc", false)
  const [bathroomTypeFilters, setBathroomTypeFilters] = useRetainedState<BathroomScope[]>(
    "housing.bathroomTypeFilters",
    [],
  )

  const clearAllFilters = useCallback(() => {
    setSearchTerm("")
    setActiveFilters([])
    setPriceRange(getPriceRangeFromData(dorms))
    setLocationFilters([])
    setBedCountFilters([])
    setBathroomCountFilters([])
    setHousingTypeDetails("ALL")
    setLivingConditionFilters([])
    setFacilityFilters([])
    setLifestyleFilters([])
    setRequireAc(false)
    setBathroomTypeFilters([])
  }, [
    dorms,
    setSearchTerm,
    setActiveFilters,
    setPriceRange,
    setLocationFilters,
    setBedCountFilters,
    setBathroomCountFilters,
    setHousingTypeDetails,
    setLivingConditionFilters,
    setFacilityFilters,
    setLifestyleFilters,
    setRequireAc,
    setBathroomTypeFilters,
  ])

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
      setSearchTerm,
      setActiveFilters,
      setPriceRange,
      setLocationFilters,
      setBedCountFilters,
      setBathroomCountFilters,
      setHousingTypeDetails,
      setViewMode,
      setSortBy,
      setLivingConditionFilters,
      setFacilityFilters,
      setLifestyleFilters,
      setRequireAc,
      setBathroomTypeFilters,
    ],
  )

  const mapUiValue = useMemo<HousingMapUiContextType>(
    () => ({
      showZones,
      setShowZones,
      showZoneLabels,
      setShowZoneLabels,
      showLandmarks,
      setShowLandmarks,
    }),
    [showZones, showZoneLabels, showLandmarks, setShowZones, setShowZoneLabels, setShowLandmarks],
  )

  return (
    <HousingFiltersContext.Provider value={filtersValue}>
      <HousingMapUiContext.Provider value={mapUiValue}>{children}</HousingMapUiContext.Provider>
    </HousingFiltersContext.Provider>
  )
}

export const useHousingFilters = () => {
  const context = useContext(HousingFiltersContext)
  if (context === undefined) {
    throw new Error("useHousingFilters must be used within a HousingProvider")
  }
  return context
}

export const useHousingMapUi = () => {
  const context = useContext(HousingMapUiContext)
  if (context === undefined) {
    throw new Error("useHousingMapUi must be used within a HousingProvider")
  }
  return context
}

export const useHousing = (): HousingContextType => {
  const filters = useHousingFilters()
  const mapUi = useHousingMapUi()

  const context = useMemo(() => ({ ...filters, ...mapUi }), [filters, mapUi])

  if (context === undefined) {
    throw new Error("useHousing must be used within a HousingProvider")
  }
  return context
}
