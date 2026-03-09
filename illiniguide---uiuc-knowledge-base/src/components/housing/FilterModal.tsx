import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import 'rc-slider/assets/index.css';
import { useHousingFilters } from '../../contexts/HousingContext';
import { getPriceRangeFromData } from '../../constants/housing/pricing';
import { useDormData } from '../../contexts/DormDataContext';
import { BathroomCountFilter, BathroomScope, BedCountFilter, DormTag, FilterOption } from '../../types/housing';
import { TAGS_BY_CATEGORY } from '../../constants/housing/tagDefinitions';
import PriceSection from './filter-modal/PriceSection';
import HousingTypeSection from './filter-modal/HousingTypeSection';
import ChipSection from './filter-modal/ChipSection';
import TagFilterSection from './filter-modal/TagFilterSection';
import { FilterLanguage, MODAL_TEXT } from './filter-modal/modalText';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: FilterLanguage;
}

const BED_COUNT_OPTIONS: { value: BedCountFilter; label: string }[] = [
    { value: 1, label: '1+' },
    { value: 2, label: '2+' },
    { value: 3, label: '3+' },
    { value: 4, label: '4+' },
];

const buildBathroomCountOptions = (t: typeof MODAL_TEXT.en): { value: BathroomCountFilter; label: string }[] => [
    { value: 0, label: t.zeroBathrooms },
    { value: 1, label: t.onePlusBathrooms },
    { value: 2, label: t.twoPlusBathrooms },
];

const buildBathroomScopeOptions = (t: typeof MODAL_TEXT.en): { value: BathroomScope; label: string }[] => [
    { value: 'communal', label: t.communalBath },
    { value: 'semi-private', label: t.semiPrivateBath },
    { value: 'private', label: t.privateBath },
];

function ToggleButtonSection<T extends string | number>({
    title,
    options,
    selectedValues,
    onToggle,
}: {
    title: string;
    options: { value: T; label: string }[];
    selectedValues: T[];
    onToggle: (value: T) => void;
}) {
    return (
        <section className="mb-8">
            <h3 className="text-xl font-bold mb-6">{title}</h3>
            <div className="flex flex-wrap gap-3">
                {options.map(({ value, label }) => {
                    const selected = selectedValues.includes(value);
                    return (
                        <button
                            key={String(value)}
                            type="button"
                            onClick={() => onToggle(value)}
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                                selected
                                    ? 'bg-illini-blue text-white border-illini-blue'
                                    : 'border-gray-300 text-gray-700 hover:border-illini-blue'
                            }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </section>
    );
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
        bedCountFilters,
        setBedCountFilters,
        bathroomCountFilters,
        setBathroomCountFilters,
        locationFilters,
        setLocationFilters,
        setAmenityFilters,
        setCommunityFilters,
        setLlcFilters,
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
    } = useHousingFilters();

    const t = MODAL_TEXT[language];
    const priceLimits = useMemo<[number, number]>(() => getPriceRangeFromData(allDorms), [allDorms]);
    const bathroomCountOptions = useMemo(() => buildBathroomCountOptions(t), [t]);
    const bathroomScopeOptions = useMemo(() => buildBathroomScopeOptions(t), [t]);

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

    const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(() => normalizeRange(priceRange));
    const [localHousingType, setLocalHousingType] = useState<'ALL' | 'URH' | 'PCH'>(housingTypeDetails);
    const [localBedCounts, setLocalBedCounts] = useState<BedCountFilter[]>(bedCountFilters);
    const [localBathroomCounts, setLocalBathroomCounts] = useState<BathroomCountFilter[]>(bathroomCountFilters);
    const [localAmenities, setLocalAmenities] = useState<FilterOption[]>(activeFilters);
    const [localLocations, setLocalLocations] = useState<string[]>(locationFilters);
    const [localLivingConditions, setLocalLivingConditions] = useState<DormTag[]>(livingConditionFilters);
    const [localFacilities, setLocalFacilities] = useState<DormTag[]>(facilityFilters);
    const [localLifestyle, setLocalLifestyle] = useState<DormTag[]>(lifestyleFilters);
    const [localRequireAc, setLocalRequireAc] = useState(requireAc);
    const [localBathroomTypes, setLocalBathroomTypes] = useState<BathroomScope[]>(bathroomTypeFilters);

    useEffect(() => {
        if (!isOpen) return;
        setLocalPriceRange(normalizeRange(priceRange));
        setLocalHousingType(housingTypeDetails);
        setLocalBedCounts(bedCountFilters);
        setLocalBathroomCounts(bathroomCountFilters);
        setLocalAmenities(activeFilters);
        setLocalLocations(locationFilters);
        setLocalLivingConditions(livingConditionFilters);
        setLocalFacilities(facilityFilters);
        setLocalLifestyle(lifestyleFilters);
        setLocalRequireAc(requireAc);
        setLocalBathroomTypes(bathroomTypeFilters);
    }, [
        activeFilters,
        bathroomCountFilters,
        bathroomTypeFilters,
        bedCountFilters,
        facilityFilters,
        housingTypeDetails,
        isOpen,
        lifestyleFilters,
        livingConditionFilters,
        locationFilters,
        normalizeRange,
        priceRange,
        requireAc,
    ]);

    const locations = useMemo(
        () => Array.from(new Set(allDorms.map((dorm) => dorm.location))).sort(),
        [allDorms]
    );

    const toggleStringArray = useCallback((values: string[], setValues: (next: string[]) => void, value: string) => {
        setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    }, []);

    const toggleNumberArray = useCallback(<T extends number,>(values: T[], setValues: (next: T[]) => void, value: T) => {
        setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
    }, []);

    const toggleDormTag = useCallback((tag: DormTag, values: DormTag[], setValues: (next: DormTag[]) => void) => {
        setValues(values.includes(tag) ? values.filter((item) => item !== tag) : [...values, tag]);
    }, []);

    const handleApply = useCallback(() => {
        setPriceRange(normalizeRange(localPriceRange));
        setHousingTypeDetails(localHousingType);
        setBedCountFilters(localBedCounts);
        setBathroomCountFilters(localBathroomCounts);
        setActiveFilters(localAmenities);
        setLocationFilters(localLocations);
        setLivingConditionFilters(localLivingConditions);
        setFacilityFilters(localFacilities);
        setLifestyleFilters(localLifestyle);
        setRequireAc(localRequireAc);
        setBathroomTypeFilters(localBathroomTypes);
        onClose();
    }, [
        localAmenities,
        localBathroomCounts,
        localBathroomTypes,
        localBedCounts,
        localFacilities,
        localHousingType,
        localLifestyle,
        localLivingConditions,
        localLocations,
        localPriceRange,
        localRequireAc,
        normalizeRange,
        onClose,
        setActiveFilters,
        setBathroomCountFilters,
        setBathroomTypeFilters,
        setBedCountFilters,
        setFacilityFilters,
        setHousingTypeDetails,
        setLifestyleFilters,
        setLivingConditionFilters,
        setLocationFilters,
        setPriceRange,
        setRequireAc,
    ]);

    const handleClear = useCallback(() => {
        setLocalPriceRange(priceLimits);
        setLocalHousingType('ALL');
        setLocalBedCounts([]);
        setLocalBathroomCounts([]);
        setLocalAmenities([]);
        setLocalLocations([]);
        setLocalLivingConditions([]);
        setLocalFacilities([]);
        setLocalLifestyle([]);
        setLocalRequireAc(false);
        setLocalBathroomTypes([]);

        setPriceRange(priceLimits);
        setHousingTypeDetails('ALL');
        setBedCountFilters([]);
        setBathroomCountFilters([]);
        setActiveFilters([]);
        setLocationFilters([]);
        setAmenityFilters([]);
        setCommunityFilters([]);
        setLlcFilters([]);
        setLivingConditionFilters([]);
        setFacilityFilters([]);
        setLifestyleFilters([]);
        setRequireAc(false);
        setBathroomTypeFilters([]);
        onClose();
    }, [
        onClose,
        priceLimits,
        setActiveFilters,
        setAmenityFilters,
        setBathroomCountFilters,
        setBathroomTypeFilters,
        setBedCountFilters,
        setCommunityFilters,
        setFacilityFilters,
        setHousingTypeDetails,
        setLifestyleFilters,
        setLivingConditionFilters,
        setLlcFilters,
        setLocationFilters,
        setPriceRange,
        setRequireAc,
    ]);

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
    }, [handleScroll, isOpen, localAmenities, localBathroomCounts, localBathroomTypes, localBedCounts, localHousingType, localLocations, localPriceRange]);

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
                                        onToggle={(value) => toggleStringArray(localLocations, setLocalLocations, value)}
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

                                    <ToggleButtonSection
                                        title={t.bedCount}
                                        options={BED_COUNT_OPTIONS}
                                        selectedValues={localBedCounts}
                                        onToggle={(value) => toggleNumberArray(localBedCounts, setLocalBedCounts, value)}
                                    />

                                    <hr className="my-8 border-gray-100" />

                                    <ToggleButtonSection
                                        title={t.bathroomCount}
                                        options={bathroomCountOptions}
                                        selectedValues={localBathroomCounts}
                                        onToggle={(value) => toggleNumberArray(localBathroomCounts, setLocalBathroomCounts, value)}
                                    />

                                    <hr className="my-8 border-gray-100" />

                                    <ToggleButtonSection
                                        title={t.bathroomType}
                                        options={bathroomScopeOptions}
                                        selectedValues={localBathroomTypes}
                                        onToggle={(value) =>
                                            setLocalBathroomTypes((prev) =>
                                                prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
                                            )
                                        }
                                    />

                                    <hr className="my-8 border-gray-100" />

                                    <section className="mb-8">
                                        <h3 className="text-xl font-bold mb-6">{t.livingConditions}</h3>
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setLocalRequireAc((prev) => !prev)}
                                                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                                                    localRequireAc
                                                        ? 'bg-illini-blue text-white border-illini-blue'
                                                        : 'border-gray-300 text-gray-700 hover:border-illini-blue'
                                                }`}
                                            >
                                                {t.airConditioning}
                                            </button>
                                            {(['noAc', 'newlyRenovated'] as DormTag[]).map((tag) => {
                                                const selected = localLivingConditions.includes(tag);
                                                const label = tag === 'noAc'
                                                    ? (language === 'zh' ? '无空调' : 'No AC')
                                                    : (language === 'zh' ? '新近翻修' : 'Newly Renovated');
                                                return (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => toggleDormTag(tag, localLivingConditions, setLocalLivingConditions)}
                                                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                                                            selected
                                                                ? 'bg-illini-blue text-white border-illini-blue'
                                                                : 'border-gray-300 text-gray-700 hover:border-illini-blue'
                                                        }`}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>

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
                                    className={`flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white z-10 transition-shadow duration-300 ${
                                        showFooterShadow ? 'shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]' : ''
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
