import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import 'rc-slider/assets/index.css';
import { useHousingFilters } from '../../contexts/HousingContext';
import { getPriceRangeFromData } from '../../constants/housing/pricing';
import { useDormData } from '../../contexts/DormDataContext';
import { DormTag, FilterOption, RoomType } from '../../types/housing';
import { TAGS_BY_CATEGORY } from '../../constants/housing/tagDefinitions';
import PriceSection from './filter-modal/PriceSection';
import HousingTypeSection from './filter-modal/HousingTypeSection';
import AmenitiesSection from './filter-modal/AmenitiesSection';
import RoomTypeSection from './filter-modal/RoomTypeSection';
import ChipSection from './filter-modal/ChipSection';
import TagFilterSection from './filter-modal/TagFilterSection';
import { FilterLanguage, MODAL_TEXT } from './filter-modal/modalText';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: FilterLanguage;
}

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, language }) => {
    const { dorms: allDorms } = useDormData();
    const {
        activeFilters,
        setActiveFilters,
        priceRange,
        setPriceRange,
        housingTypeDetails,
        setHousingTypeDetails,
        roomTypeFilters,
        setRoomTypeFilters,
        locationFilters,
        setLocationFilters,
        typeFilters,
        setTypeFilters,
        setAmenityFilters,
        setCommunityFilters,
        setLlcFilters,
        livingConditionFilters,
        setLivingConditionFilters,
        facilityFilters,
        setFacilityFilters,
        lifestyleFilters,
        setLifestyleFilters
    } = useHousingFilters();

    const t = MODAL_TEXT[language];
    const priceLimits = useMemo<[number, number]>(() => getPriceRangeFromData(allDorms), [allDorms]);

    const normalizeRange = useCallback(
        (range: [number, number]): [number, number] => {
            const minLimit = priceLimits[0];
            const maxLimit = priceLimits[1];
            const minGap = Math.max(0, Math.min(100, maxLimit - minLimit));

            let min = Number.isFinite(range[0]) ? range[0] : minLimit;
            let max = Number.isFinite(range[1]) ? range[1] : maxLimit;

            min = Math.max(minLimit, Math.min(maxLimit, min));
            max = Math.max(minLimit, Math.min(maxLimit, max));
            if (min > max) [min, max] = [max, min];

            if (minGap > 0 && max - min < minGap) {
                min = Math.max(minLimit, Math.min(min, maxLimit - minGap));
                max = min + minGap;
            }

            return [Math.round(min), Math.round(max)];
        },
        [priceLimits]
    );

    const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(() =>
        normalizeRange(priceRange)
    );
    const [localHousingType, setLocalHousingType] = useState<'ALL' | 'URH' | 'PCH'>(
        housingTypeDetails
    );
    const [localRoomTypes, setLocalRoomTypes] = useState<RoomType[]>(roomTypeFilters);
    const [localAmenities, setLocalAmenities] = useState<FilterOption[]>(activeFilters);
    const [localLocations, setLocalLocations] = useState<string[]>(locationFilters);
    const [localTypes, setLocalTypes] = useState<string[]>(typeFilters);
    const [localLivingConditions, setLocalLivingConditions] = useState<DormTag[]>(livingConditionFilters);
    const [localFacilities, setLocalFacilities] = useState<DormTag[]>(facilityFilters);
    const [localLifestyle, setLocalLifestyle] = useState<DormTag[]>(lifestyleFilters);

    useEffect(() => {
        if (!isOpen) return;
        setLocalPriceRange(normalizeRange(priceRange));
        setLocalHousingType(housingTypeDetails);
        setLocalRoomTypes(roomTypeFilters);
        setLocalAmenities(activeFilters);
        setLocalLocations(locationFilters);
        setLocalTypes(typeFilters);
        setLocalLivingConditions(livingConditionFilters);
        setLocalFacilities(facilityFilters);
        setLocalLifestyle(lifestyleFilters);
    }, [
        isOpen,
        normalizeRange,
        priceRange,
        housingTypeDetails,
        roomTypeFilters,
        activeFilters,
        locationFilters,
        typeFilters,
        livingConditionFilters,
        facilityFilters,
        lifestyleFilters
    ]);

    const locations = useMemo(
        () => Array.from(new Set(allDorms.map((dorm) => dorm.location))).sort(),
        [allDorms]
    );
    const buildingTypes = useMemo(
        () => Array.from(new Set(allDorms.map((dorm) => dorm.type))).sort(),
        [allDorms]
    );

    const handleApply = useCallback(() => {
        setPriceRange(normalizeRange(localPriceRange));
        setHousingTypeDetails(localHousingType);
        setRoomTypeFilters(localRoomTypes);
        setActiveFilters(localAmenities);
        setLocationFilters(localLocations);
        setTypeFilters(localTypes);
        setLivingConditionFilters(localLivingConditions);
        setFacilityFilters(localFacilities);
        setLifestyleFilters(localLifestyle);
        onClose();
    }, [
        localAmenities,
        localHousingType,
        localLocations,
        localPriceRange,
        localRoomTypes,
        localTypes,
        localLivingConditions,
        localFacilities,
        localLifestyle,
        normalizeRange,
        onClose,
        setActiveFilters,
        setHousingTypeDetails,
        setLocationFilters,
        setPriceRange,
        setRoomTypeFilters,
        setTypeFilters,
        setLivingConditionFilters,
        setFacilityFilters,
        setLifestyleFilters
    ]);

    const handleClear = useCallback(() => {
        setLocalPriceRange(priceLimits);
        setLocalHousingType('ALL');
        setLocalRoomTypes([]);
        setLocalAmenities([]);
        setLocalLocations([]);
        setLocalTypes([]);
        setLocalLivingConditions([]);
        setLocalFacilities([]);
        setLocalLifestyle([]);

        setPriceRange(priceLimits);
        setHousingTypeDetails('ALL');
        setRoomTypeFilters([]);
        setActiveFilters([]);
        setLocationFilters([]);
        setTypeFilters([]);
        setAmenityFilters([]);
        setCommunityFilters([]);
        setLlcFilters([]);
        setLivingConditionFilters([]);
        setFacilityFilters([]);
        setLifestyleFilters([]);
        onClose();
    }, [
        onClose,
        priceLimits,
        setActiveFilters,
        setAmenityFilters,
        setCommunityFilters,
        setHousingTypeDetails,
        setLlcFilters,
        setLocationFilters,
        setPriceRange,
        setRoomTypeFilters,
        setTypeFilters,
        setLivingConditionFilters,
        setFacilityFilters,
        setLifestyleFilters
    ]);

    const toggleStringArray = useCallback(
        (values: string[], setValues: (next: string[]) => void, value: string) => {
            if (values.includes(value)) {
                setValues(values.filter((item) => item !== value));
                return;
            }
            setValues([...values, value]);
        },
        []
    );

    const toggleRoomTypeArray = useCallback(
        (values: RoomType[], setValues: (next: RoomType[]) => void, value: RoomType) => {
            if (values.includes(value)) {
                setValues(values.filter((item) => item !== value));
                return;
            }
            setValues([...values, value]);
        },
        []
    );

    const toggleAmenity = useCallback((option: FilterOption) => {
        setLocalAmenities((prev) =>
            prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
        );
    }, []);

    const toggleDormTag = useCallback((
        tag: DormTag,
        values: DormTag[],
        setValues: (next: DormTag[]) => void
    ) => {
        if (values.includes(tag)) {
            setValues(values.filter((item) => item !== tag));
        } else {
            setValues([...values, tag]);
        }
    }, []);

    const [showFooterShadow, setShowFooterShadow] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        setShowFooterShadow(scrollHeight - scrollTop - clientHeight > 2);
    }, []);

    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, [
        handleScroll,
        isOpen,
        localPriceRange,
        localHousingType,
        localLocations,
        localTypes,
        localAmenities,
        localRoomTypes
    ]);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/45" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 translate-y-4"
                            enterTo="opacity-100 translate-y-0"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-2"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl flex flex-col max-h-[85vh]">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                    <div className="w-9" />
                                    <Dialog.Title className="text-lg font-bold">{t.filters}</Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        type="button"
                                        className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-black"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div
                                    ref={scrollContainerRef}
                                    onScroll={handleScroll}
                                    className="px-6 py-6 overflow-y-auto flex-1 scrollbar-grey modal-scroll-smooth"
                                >
                                    <ChipSection
                                        title={t.location}
                                        options={locations}
                                        selectedValues={localLocations}
                                        onToggle={(value) =>
                                            toggleStringArray(localLocations, setLocalLocations, value)
                                        }
                                        accentColor="blue"
                                    />

                                    <hr className="my-8 border-gray-100" />

                                    <HousingTypeSection
                                        t={t}
                                        value={localHousingType}
                                        onChange={setLocalHousingType}
                                    />

                                    <hr className="my-8 border-gray-100" />

                                    <PriceSection
                                        t={t}
                                        priceLimits={priceLimits}
                                        value={localPriceRange}
                                        onChange={setLocalPriceRange}
                                        normalizeRange={normalizeRange}
                                    />

                                    <hr className="my-8 border-gray-100" />

                                    <ChipSection
                                        title={t.buildingType}
                                        options={buildingTypes}
                                        selectedValues={localTypes}
                                        onToggle={(value) =>
                                            toggleStringArray(localTypes, setLocalTypes, value)
                                        }
                                        accentColor="blue"
                                    />

                                    <hr className="my-8 border-gray-100" />

                                    <AmenitiesSection
                                        title={t.amenities}
                                        language={language}
                                        selectedValues={localAmenities}
                                        onToggle={toggleAmenity}
                                    />

                                    <hr className="my-8 border-gray-100" />

                                    <RoomTypeSection
                                        title={t.roomType}
                                        language={language}
                                        selectedValues={localRoomTypes}
                                        onToggle={(value) =>
                                            toggleRoomTypeArray(localRoomTypes, setLocalRoomTypes, value)
                                        }
                                    />

                                    <hr className="my-8 border-gray-100" />

                                    <TagFilterSection
                                        title={t.livingConditions}
                                        language={language}
                                        tags={TAGS_BY_CATEGORY.livingConditions}
                                        selectedValues={localLivingConditions}
                                        onToggle={(tag) => toggleDormTag(tag, localLivingConditions, setLocalLivingConditions)}
                                    />

                                    <hr className="my-8 border-gray-100" />

                                    <TagFilterSection
                                        title={t.facilities}
                                        language={language}
                                        tags={TAGS_BY_CATEGORY.facilities}
                                        selectedValues={localFacilities}
                                        onToggle={(tag) => toggleDormTag(tag, localFacilities, setLocalFacilities)}
                                    />

                                    <hr className="my-8 border-gray-100" />

                                    <TagFilterSection
                                        title={t.lifestyle}
                                        language={language}
                                        tags={TAGS_BY_CATEGORY.lifestyle}
                                        selectedValues={localLifestyle}
                                        onToggle={(tag) => toggleDormTag(tag, localLifestyle, setLocalLifestyle)}
                                    />
                                </div>

                                <div
                                    className={`flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white z-10 transition-shadow duration-300 ${showFooterShadow ? 'shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]' : ''
                                        }`}
                                >
                                    <button
                                        onClick={handleClear}
                                        type="button"
                                        className="font-bold underline text-gray-900 hover:text-gray-700 text-sm hover:no-underline transition-colors"
                                    >
                                        {t.clearAll}
                                    </button>
                                    <button
                                        onClick={handleApply}
                                        type="button"
                                        className="px-8 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-black active:scale-[0.98] transition-colors"
                                    >
                                        {t.showPlaces}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
