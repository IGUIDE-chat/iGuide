/**
 * @file ./src/components/housing/FilterModal.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { X } from "lucide-react"
import { Dialog, Transition } from "@headlessui/react"
import "rc-slider/assets/index.css"
import { useHousingFilters } from "./store/HousingContext"
import { getPriceRangeFromData } from "./constants/pricing"
import { useDormData } from "./store/HousingDataContext"
import {
  type BathroomCountFilter,
  type BathroomScope,
  type BedCountFilter,
  type DormTag,
  type FilterOption,
} from "./types/index"
import {
  BATHROOM_SCOPE_OPTIONS,
  FILTERABLE_LIVING_CONDITION_TAGS,
  TAGS_BY_CATEGORY,
  getLocalizedLabel,
  getTagDisplay,
  mergeLocationOptions,
} from "./constants/metadata"
import PriceSection from "./filter-modal/PriceSection"
import HousingTypeSection from "./filter-modal/HousingTypeSection"
import ChipSection from "./filter-modal/ChipSection"
import TagFilterSection from "./filter-modal/TagFilterSection"
import { type FilterLanguage, MODAL_TEXT } from "./filter-modal/modalText"

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  language: FilterLanguage
}

const BED_COUNT_OPTIONS: Array<{ value: BedCountFilter; label: string }> = [
  { value: 1, label: "1+" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
]

const buildBathroomCountOptions = (
  t: typeof MODAL_TEXT.en
): Array<{ value: BathroomCountFilter; label: string }> => [
  { value: 0, label: t.zeroBathrooms },
  { value: 1, label: t.onePlusBathrooms },
  { value: 2, label: t.twoPlusBathrooms },
]

function ToggleButtonSection<T extends string | number>({
  title,
  options,
  selectedValues,
  onToggle,
}: {
  title: string
  options: Array<{ value: T; label: string }>
  selectedValues: T[]
  onToggle: (value: T) => void
}) {
  return (
    <section className="mb-8">
      <h3 className="mb-6 text-xl font-bold">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {options.map(({ value, label }) => {
          const selected = selectedValues.includes(value)
          return (
            <button
              key={String(value)}
              type="button"
              onClick={() => onToggle(value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "border-illini-blue bg-illini-blue text-white"
                  : `hover:border-illini-blue border-gray-300 text-gray-700`
              } `}
            >
              {label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function LivingConditionsSection({
  title,
  acLabel,
  localRequireAc,
  onToggleAc,
  tags,
  selectedTags,
  onToggleTag,
  language,
}: {
  title: string
  acLabel: string
  localRequireAc: boolean
  onToggleAc: () => void
  tags: readonly DormTag[]
  selectedTags: DormTag[]
  onToggleTag: (tag: DormTag) => void
  language: FilterLanguage
}) {
  return (
    <section className="mb-8">
      <h3 className="mb-6 text-xl font-bold">{title}</h3>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onToggleAc}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            localRequireAc
              ? "border-illini-blue bg-illini-blue text-white"
              : `hover:border-illini-blue border-gray-300 text-gray-700`
          } `}
        >
          {acLabel}
        </button>
        {tags.map((tag) => {
          const selected = selectedTags.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleTag(tag)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selected
                  ? `border-illini-blue bg-illini-blue text-white`
                  : `hover:border-illini-blue border-gray-300 text-gray-700`
              } `}
            >
              {getTagDisplay(tag, language)}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const { dorms: allDorms } = useDormData()
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
  } = useHousingFilters()

  const t = MODAL_TEXT[language]
  const priceLimits = useMemo<[number, number]>(
    () => getPriceRangeFromData(allDorms),
    [allDorms]
  )
  const bathroomCountOptions = useMemo(() => buildBathroomCountOptions(t), [t])
  const bathroomScopeOptions = useMemo(
    () =>
      BATHROOM_SCOPE_OPTIONS.map((option) => ({
        value: option.value,
        label: getLocalizedLabel(option, language),
      })),
    [language]
  )

  const normalizeRange = useCallback(
    (range: [number, number]): [number, number] => {
      const minLimit = priceLimits[0]
      const maxLimit = priceLimits[1]
      const minGap = Math.max(0, Math.min(100, maxLimit - minLimit))

      let min = Number.isFinite(range[0]) ? range[0] : minLimit
      let max = Number.isFinite(range[1]) ? range[1] : maxLimit

      min = Math.max(minLimit, Math.min(maxLimit, min))
      max = Math.max(minLimit, Math.min(maxLimit, max))
      if (min > max) {
        ;[min, max] = [max, min]
      }

      if (minGap > 0 && max - min < minGap) {
        min = Math.max(minLimit, Math.min(min, maxLimit - minGap))
        max = min + minGap
      }

      return [Math.round(min), Math.round(max)]
    },
    [priceLimits]
  )

  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(() =>
    normalizeRange(priceRange)
  )
  const [localHousingType, setLocalHousingType] = useState<
    "ALL" | "URH" | "PCH"
  >(housingTypeDetails)
  const [localBedCounts, setLocalBedCounts] =
    useState<BedCountFilter[]>(bedCountFilters)
  const [localBathroomCounts, setLocalBathroomCounts] =
    useState<BathroomCountFilter[]>(bathroomCountFilters)
  const [localAmenities, setLocalAmenities] =
    useState<FilterOption[]>(activeFilters)
  const [localLocations, setLocalLocations] =
    useState<string[]>(locationFilters)
  const [localLivingConditions, setLocalLivingConditions] = useState<DormTag[]>(
    livingConditionFilters
  )
  const [localFacilities, setLocalFacilities] =
    useState<DormTag[]>(facilityFilters)
  const [localLifestyle, setLocalLifestyle] =
    useState<DormTag[]>(lifestyleFilters)
  const [localRequireAc, setLocalRequireAc] = useState(requireAc)
  const [localBathroomTypes, setLocalBathroomTypes] =
    useState<BathroomScope[]>(bathroomTypeFilters)

  useLayoutEffect(() => {
    if (!isOpen) {
      return
    }
    setLocalPriceRange(normalizeRange(priceRange))
    setLocalHousingType(housingTypeDetails)
    setLocalBedCounts(bedCountFilters)
    setLocalBathroomCounts(bathroomCountFilters)
    setLocalAmenities(activeFilters)
    setLocalLocations(locationFilters)
    setLocalLivingConditions(livingConditionFilters)
    setLocalFacilities(facilityFilters)
    setLocalLifestyle(lifestyleFilters)
    setLocalRequireAc(requireAc)
    setLocalBathroomTypes(bathroomTypeFilters)
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
  ])

  const locations = useMemo(
    () =>
      mergeLocationOptions(
        Array.from(new Set(allDorms.map((dorm) => dorm.location)))
      ).map((option) => ({
        value: option.value,
        label: getLocalizedLabel(option, language),
      })),
    [allDorms, language]
  )

  const toggleStringArray = useCallback(
    (values: string[], setValues: (next: string[]) => void, value: string) => {
      setValues(
        values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value]
      )
    },
    []
  )

  const toggleNumberArray = useCallback(
    <T extends number>(
      values: T[],
      setValues: (next: T[]) => void,
      value: T
    ) => {
      setValues(
        values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value]
      )
    },
    []
  )

  const toggleDormTag = useCallback(
    (tag: DormTag, values: DormTag[], setValues: (next: DormTag[]) => void) => {
      setValues(
        values.includes(tag)
          ? values.filter((item) => item !== tag)
          : [...values, tag]
      )
    },
    []
  )

  const handleApply = useCallback(() => {
    setPriceRange(normalizeRange(localPriceRange))
    setHousingTypeDetails(localHousingType)
    setBedCountFilters(localBedCounts)
    setBathroomCountFilters(localBathroomCounts)
    setActiveFilters(localAmenities)
    setLocationFilters(localLocations)
    setLivingConditionFilters(localLivingConditions)
    setFacilityFilters(localFacilities)
    setLifestyleFilters(localLifestyle)
    setRequireAc(localRequireAc)
    setBathroomTypeFilters(localBathroomTypes)
    onClose()
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
  ])

  const handleClear = useCallback(() => {
    setLocalPriceRange(priceLimits)
    setLocalHousingType("ALL")
    setLocalBedCounts([])
    setLocalBathroomCounts([])
    setLocalAmenities([])
    setLocalLocations([])
    setLocalLivingConditions([])
    setLocalFacilities([])
    setLocalLifestyle([])
    setLocalRequireAc(false)
    setLocalBathroomTypes([])

    setPriceRange(priceLimits)
    setHousingTypeDetails("ALL")
    setBedCountFilters([])
    setBathroomCountFilters([])
    setActiveFilters([])
    setLocationFilters([])
    setLivingConditionFilters([])
    setFacilityFilters([])
    setLifestyleFilters([])
    setRequireAc(false)
    setBathroomTypeFilters([])
    onClose()
  }, [
    onClose,
    priceLimits,
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
  ])

  const [showFooterShadow, setShowFooterShadow] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) {
      return
    }
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    setShowFooterShadow(scrollHeight - scrollTop - clientHeight > 2)
  }, [])

  useEffect(() => {
    handleScroll()
    window.addEventListener("resize", handleScroll)
    return () => window.removeEventListener("resize", handleScroll)
  }, [
    handleScroll,
    isOpen,
    localAmenities,
    localBathroomCounts,
    localBathroomTypes,
    localBedCounts,
    localHousingType,
    localLocations,
    localPriceRange,
  ])

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
              <Dialog.Panel className="flex max-h-[85vh] w-full max-w-2xl transform flex-col overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="w-9" />
                  <Dialog.Title className="text-lg font-bold">
                    {t.filters}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    type="button"
                    className="-mr-2 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="scrollbar-grey modal-scroll-smooth flex-1 overflow-y-auto p-6"
                >
                  <ChipSection
                    title={t.location}
                    options={locations}
                    selectedValues={localLocations}
                    onToggle={(value) =>
                      toggleStringArray(
                        localLocations,
                        setLocalLocations,
                        value
                      )
                    }
                    accentColor="blue"
                  />

                  <hr className="my-8 border-gray-100" />

                  <HousingTypeSection
                    title={t.typeOfPlace}
                    language={language}
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
                    onToggle={(value) =>
                      toggleNumberArray(
                        localBedCounts,
                        setLocalBedCounts,
                        value
                      )
                    }
                  />

                  <hr className="my-8 border-gray-100" />

                  <ToggleButtonSection
                    title={t.bathroomCount}
                    options={bathroomCountOptions}
                    selectedValues={localBathroomCounts}
                    onToggle={(value) =>
                      toggleNumberArray(
                        localBathroomCounts,
                        setLocalBathroomCounts,
                        value
                      )
                    }
                  />

                  <hr className="my-8 border-gray-100" />

                  <ToggleButtonSection
                    title={t.bathroomType}
                    options={bathroomScopeOptions}
                    selectedValues={localBathroomTypes}
                    onToggle={(value) =>
                      setLocalBathroomTypes((prev) =>
                        prev.includes(value)
                          ? prev.filter((item) => item !== value)
                          : [...prev, value]
                      )
                    }
                  />

                  <hr className="my-8 border-gray-100" />

                  <LivingConditionsSection
                    title={t.livingConditions}
                    acLabel={t.airConditioning}
                    localRequireAc={localRequireAc}
                    onToggleAc={() => setLocalRequireAc((prev) => !prev)}
                    tags={FILTERABLE_LIVING_CONDITION_TAGS}
                    selectedTags={localLivingConditions}
                    onToggleTag={(tag) =>
                      toggleDormTag(
                        tag,
                        localLivingConditions,
                        setLocalLivingConditions
                      )
                    }
                    language={language}
                  />

                  <hr className="my-8 border-gray-100" />

                  <TagFilterSection
                    title={t.facilities}
                    language={language}
                    tags={TAGS_BY_CATEGORY.facilities}
                    selectedValues={localFacilities}
                    onToggle={(tag) =>
                      toggleDormTag(tag, localFacilities, setLocalFacilities)
                    }
                  />

                  <hr className="my-8 border-gray-100" />

                  <TagFilterSection
                    title={t.lifestyle}
                    language={language}
                    tags={TAGS_BY_CATEGORY.lifestyle}
                    selectedValues={localLifestyle}
                    onToggle={(tag) =>
                      toggleDormTag(tag, localLifestyle, setLocalLifestyle)
                    }
                  />
                </div>

                <div
                  className={`z-10 flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 transition-shadow duration-300 ${showFooterShadow ? "shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]" : ""} `}
                >
                  <button
                    onClick={handleClear}
                    type="button"
                    className="text-sm font-bold text-gray-900 underline transition-colors hover:text-gray-700 hover:no-underline"
                  >
                    {t.clearAll}
                  </button>
                  <button
                    onClick={handleApply}
                    type="button"
                    className="rounded-lg bg-gray-900 px-8 py-3 font-bold text-white transition-colors hover:bg-black active:scale-[0.98]"
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
  )
}
