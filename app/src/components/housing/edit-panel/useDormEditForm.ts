/**
 * @file ./src/components/housing/edit-panel/useDormEditForm.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { useLayoutEffect, useMemo, useRef, useState } from "react"
import {
  type BathroomType,
  type DiningType,
  type Dorm,
  type DormCategorizedTags,
  type FloorPlan,
} from "../types/index"
import { type Language } from "../../../types"
import {
  type DormUpdate,
  type EditHistoryEntry,
  buildSummary,
  dormAdminService,
} from "../../../services/dormAdminService"
import { useAuth } from "../../../contexts/AuthContext"
import { dormService } from "../../../services/dormService"
import {
  deriveRoomOptions,
  getPersistedBathroomType,
  getRoomDisplayLabel,
  getStorageBathroomScope,
  normalizeFloorPlan,
} from "../../../utils/roomOptions"
import {
  buildLegacyDormTags,
  getDormPriceRange,
  sanitizeFloorPlansForStorage,
} from "../../../utils/dormData"
import { TEXT } from "./editPanelText"

interface UseDormEditFormOptions {
  dorm: Dorm
  language: Language
  onClose: () => void
  onSaved: (updated: Dorm) => void
}

type ActiveTab = "content" | "details" | "tags" | "media" | "history"
type LayoutKind = "standard" | "Studio" | "Suite" | "Cluster"

const emptyCategorized: DormCategorizedTags = {
  livingConditions: [],
  facilities: [],
  lifestyle: [],
  llcNames: [],
}

const getBathroomScopeFallback = (
  bathroomType: Dorm["bathroomType"],
  floorPlans?: FloorPlan[]
) => getStorageBathroomScope(bathroomType, floorPlans)

const getLayoutKind = (plan: FloorPlan): LayoutKind => {
  if (plan.type === "Studio" || plan.labelCode === "Studio") {
    return "Studio"
  }
  if (plan.type === "Suite" || plan.labelCode === "Suite") {
    return "Suite"
  }
  if (plan.type === "Cluster" || plan.labelCode === "Cluster") {
    return "Cluster"
  }
  return "standard"
}

const createFloorPlan = (): FloorPlan => ({
  bedCount: 1,
  bathroomCount: 0,
  bathroomScope: "communal",
  available: true,
})

function dormToSnapshot(dorm: Dorm): Record<string, unknown> {
  return {
    name: dorm.name,
    name_zh: dorm.name_zh ?? null,
    description: dorm.description,
    description_zh: dorm.description_zh ?? null,
    image_url: dorm.imageUrl ?? null,
    price: dorm.price,
    price_range: dorm.priceRange,
    application_fee: dorm.applicationFee ?? null,
    location: dorm.location,
    location_zh: dorm.location_zh ?? null,
    housing_type: dorm.housingType,
    ac: dorm.ac,
    dining: dorm.dining,
    dining_nearby_detail: dorm.diningNearbyDetail ?? null,
    bathroom_type: dorm.bathroomType,
    room_types: dorm.roomTypes ?? null,
    room_options: dorm.roomOptions ?? null,
    tags: dorm.tags ?? null,
    structured_tags: dorm.structuredTags ?? null,
    categorized_tags: dorm.categorizedTags ?? null,
    floor_plans: sanitizeFloorPlansForStorage(dorm.floorPlans) ?? null,
    gallery_images: dorm.galleryImages ?? null,
    pros: dorm.pros,
    pros_zh: dorm.pros_zh ?? null,
    cons: dorm.cons,
    cons_zh: dorm.cons_zh ?? null,
    address: dorm.address ?? null,
    address_zh: dorm.address_zh ?? null,
    website: dorm.website ?? null,
  }
}

export const useDormEditForm = ({
  dorm,
  language,
  onClose,
  onSaved,
}: UseDormEditFormOptions) => {
  const { user } = useAuth()
  const t = TEXT[language]
  const [activeTab, setActiveTab] = useState<ActiveTab>("content")
  const [contentLang, setContentLang] = useState<"en" | "zh">("en")
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // History tab state
  const [historyEntries, setHistoryEntries] = useState<EditHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const [name, setName] = useState(dorm.name)
  const [nameZh, setNameZh] = useState(dorm.name_zh ?? "")
  const [description, setDescription] = useState(dorm.description)
  const [descriptionZh, setDescriptionZh] = useState(dorm.description_zh ?? "")
  const [imageUrl, setImageUrl] = useState(dorm.imageUrl)
  const [price, setPrice] = useState(String(dorm.price))
  const [applicationFee, setApplicationFee] = useState(
    String(dorm.applicationFee ?? "")
  )
  const [location, setLocation] = useState(dorm.location)
  const [locationZh, setLocationZh] = useState(dorm.location_zh ?? "")
  const [housingType, setHousingType] = useState(dorm.housingType)
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>(
    (sanitizeFloorPlansForStorage(dorm.floorPlans) ?? []).map((plan) =>
      normalizeFloorPlan(
        plan,
        getBathroomScopeFallback(dorm.bathroomType, dorm.floorPlans)
      )
    )
  )
  const [galleryImages, setGalleryImages] = useState<string[]>(
    dorm.galleryImages ?? []
  )
  const [ac, setAc] = useState(dorm.ac)
  const [dining, setDining] = useState<DiningType>(dorm.dining)
  const [diningNearbyDetail, setDiningNearbyDetail] = useState(
    dorm.diningNearbyDetail ?? ""
  )
  const [bathroomType, setBathroomType] = useState<BathroomType>(
    dorm.bathroomType
  )
  const [pros, setPros] = useState(dorm.pros)
  const [prosZh, setProsZh] = useState(dorm.pros_zh ?? [])
  const [cons, setCons] = useState(dorm.cons)
  const [consZh, setConsZh] = useState(dorm.cons_zh ?? [])
  const [categorizedTags, setCategorizedTags] = useState<DormCategorizedTags>(
    dorm.categorizedTags ?? emptyCategorized
  )
  const [address, setAddress] = useState(dorm.address ?? "")
  const [addressZh, setAddressZh] = useState(dorm.address_zh ?? "")
  const [website, setWebsite] = useState(dorm.website ?? "")
  const [petFriendly, setPetFriendly] = useState(
    dorm.structuredTags?.petFriendly ?? false
  )

  useLayoutEffect(() => {
    setName(dorm.name)
    setNameZh(dorm.name_zh ?? "")
    setDescription(dorm.description)
    setDescriptionZh(dorm.description_zh ?? "")
    setImageUrl(dorm.imageUrl)
    setPrice(String(dorm.price))
    setApplicationFee(String(dorm.applicationFee ?? ""))
    setLocation(dorm.location)
    setLocationZh(dorm.location_zh ?? "")
    setHousingType(dorm.housingType)
    setFloorPlans(
      (sanitizeFloorPlansForStorage(dorm.floorPlans) ?? []).map((plan) =>
        normalizeFloorPlan(
          plan,
          getBathroomScopeFallback(dorm.bathroomType, dorm.floorPlans)
        )
      )
    )
    setGalleryImages([...(dorm.galleryImages ?? [])])
    setAc(dorm.ac)
    setDining(dorm.dining)
    setDiningNearbyDetail(dorm.diningNearbyDetail ?? "")
    setBathroomType(dorm.bathroomType)
    setPros([...dorm.pros])
    setProsZh([...(dorm.pros_zh ?? [])])
    setCons([...dorm.cons])
    setConsZh([...(dorm.cons_zh ?? [])])
    setCategorizedTags(dorm.categorizedTags ?? emptyCategorized)
    setAddress(dorm.address ?? "")
    setAddressZh(dorm.address_zh ?? "")
    setWebsite(dorm.website ?? "")
    setPetFriendly(dorm.structuredTags?.petFriendly ?? false)
  }, [dorm])

  useLayoutEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  useLayoutEffect(() => {
    if (activeTab !== "history") {
      return
    }
    setHistoryLoading(true)
    const loadHistory = async () => {
      try {
        const entries = await dormAdminService.getEditHistory(dorm.id)
        setHistoryEntries(entries)
      } finally {
        setHistoryLoading(false)
      }
    }
    loadHistory()
  }, [activeTab, dorm.id])

  const normalizedFloorPlans = useMemo(
    () =>
      sanitizeFloorPlansForStorage(
        floorPlans.map((plan) =>
          normalizeFloorPlan(
            plan,
            getBathroomScopeFallback(bathroomType, floorPlans)
          )
        )
      ) ?? [],
    [bathroomType, floorPlans]
  )

  const derivedRoomOptions = useMemo(
    () => deriveRoomOptions(normalizedFloorPlans, bathroomType).roomOptions,
    [normalizedFloorPlans, bathroomType]
  )

  const updateFloorPlan = (
    index: number,
    updater: (plan: FloorPlan) => FloorPlan
  ) => {
    setFloorPlans((current) =>
      current.map((plan, currentIndex) =>
        currentIndex === index ? updater(plan) : plan
      )
    )
  }

  const buildUpdate = (): DormUpdate => {
    const derived = deriveRoomOptions(normalizedFloorPlans, bathroomType)
    const finalCategorized: DormCategorizedTags = {
      ...categorizedTags,
      llcNames:
        categorizedTags.lifestyle.includes("llc") &&
        (categorizedTags.llcNames?.length ?? 0) > 0
          ? categorizedTags.llcNames
          : undefined,
    }
    const numericPrice = price === "" ? null : Number(price)
    const nextDormLike: Dorm = {
      ...dorm,
      name,
      name_zh: nameZh || undefined,
      description,
      description_zh: descriptionZh || undefined,
      imageUrl: imageUrl || "",
      price: numericPrice ?? dorm.price,
      location,
      location_zh: locationZh || undefined,
      housingType,
      ac,
      dining,
      diningNearbyDetail: diningNearbyDetail || undefined,
      bathroomType,
      roomTypes: derived.roomTypes,
      roomOptions: derived.roomOptions,
      categorizedTags: finalCategorized,
      floorPlans: normalizedFloorPlans,
      galleryImages,
      pros,
      pros_zh: prosZh,
      cons,
      cons_zh: consZh,
      applicationFee:
        applicationFee === "" ? undefined : Number(applicationFee),
      address: address || undefined,
      address_zh: addressZh || undefined,
      website: website || undefined,
    }
    const syncedTags = buildLegacyDormTags(nextDormLike)

    return {
      name,
      name_zh: nameZh || null,
      description,
      description_zh: descriptionZh || null,
      image_url: imageUrl || null,
      price: numericPrice,
      price_range:
        numericPrice === null ? null : getDormPriceRange(numericPrice),
      application_fee: applicationFee === "" ? null : Number(applicationFee),
      location,
      location_zh: locationZh || null,
      housing_type: housingType,
      room_types: derived.roomTypes.length > 0 ? derived.roomTypes : null,
      room_options: derived.roomOptions.length > 0 ? derived.roomOptions : null,
      tags: syncedTags.length > 0 ? syncedTags : null,
      categorized_tags: finalCategorized as unknown as Record<string, unknown>,
      floor_plans:
        normalizedFloorPlans.length > 0 ? normalizedFloorPlans : null,
      gallery_images: galleryImages.length > 0 ? galleryImages : null,
      ac,
      dining,
      dining_nearby_detail: diningNearbyDetail || null,
      bathroom_type: getPersistedBathroomType(
        bathroomType,
        derived.roomOptions
      ),
      pros,
      pros_zh: prosZh.length > 0 ? prosZh : null,
      cons,
      cons_zh: consZh.length > 0 ? consZh : null,
      address: address || null,
      address_zh: addressZh || null,
      website: website || null,
      structured_tags: {
        // Synced from categorizedTags
        laundry: finalCategorized.facilities.includes("laundry"),
        studyRooms: finalCategorized.facilities.includes("studyLounge"),
        kitchen: finalCategorized.facilities.includes("kitchen"),
        gymNearby: finalCategorized.facilities.includes("gym"),
        genderInclusive:
          dorm.structuredTags?.genderInclusive ??
          finalCategorized.lifestyle.includes("genderInclusive"),
        llc: finalCategorized.lifestyle.includes("llc")
          ? [...(finalCategorized.llcNames ?? [])]
          : [],
        // Admin-editable
        petFriendly,
        // Preserve existing values for legacy fields that are still used in filters
        quietFloors: finalCategorized.lifestyle.includes("quiet"),
      } as unknown as Record<string, unknown>,
    }
  }

  const refreshDorm = async () => {
    const freshDorm = await dormService.getDormById(dorm.id)
    onSaved(freshDorm ?? dorm)
  }

  const uploadImage = async (file: File, onSuccess: (url: string) => void) => {
    if (!file.type.startsWith("image/")) {
      alert(t.alerts.onlyImages)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert(t.alerts.imageTooLarge)
      return
    }

    setUploadingImage(true)
    const { publicUrl, errorMessage } =
      await dormAdminService.uploadDormImage(file)
    setUploadingImage(false)

    if (publicUrl) {
      onSuccess(publicUrl)
      return
    }

    alert(
      errorMessage
        ? `${t.alerts.imageUploadFailed}\n${errorMessage}`
        : t.alerts.imageUploadFailed
    )
  }

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    const updates = buildUpdate()
    const snapshotBefore = dormToSnapshot(dorm)
    const summary = buildSummary(dorm, updates)

    const result = await dormAdminService.updateDorm(dorm.id, updates)
    setSaving(false)

    if (!result.ok) {
      setSaveError(result.errorMessage ?? t.alerts.saveFailed)
      return
    }

    setSaveSuccess(true)
    timerRef.current = setTimeout(() => {
      setSaveSuccess(false)
    }, 2000)
    void dormAdminService.logEdit(
      dorm.id,
      dorm.name,
      user?.email ?? "unknown",
      summary,
      snapshotBefore
    )
    await refreshDorm()
  }

  const handleRestore = async (entry: EditHistoryEntry) => {
    if (!window.confirm(t.alerts.restoreConfirm)) {
      return
    }
    setRestoringId(entry.id)
    const ok = await dormAdminService.restoreSnapshot(dorm.id, entry)
    setRestoringId(null)
    if (!ok) {
      alert(t.alerts.restoreFailed)
      return
    }
    await refreshDorm()
    setActiveTab("content")
  }

  const reset = async () => {
    if (!window.confirm(t.alerts.resetConfirm)) {
      return
    }

    setResetting(true)
    const result = await dormAdminService.resetDormToStatic(dorm.id)
    setResetting(false)

    if (!result.ok) {
      setSaveError(result.errorMessage ?? t.alerts.saveFailed)
      return
    }

    await refreshDorm()
    onClose()
  }

  return {
    dorm,
    language,
    t,
    activeTab,
    setActiveTab,
    contentLang,
    setContentLang,
    saving,
    resetting,
    saveSuccess,
    saveError,
    uploadingImage,
    name,
    setName,
    nameZh,
    setNameZh,
    description,
    setDescription,
    descriptionZh,
    setDescriptionZh,
    imageUrl,
    setImageUrl,
    price,
    setPrice,
    applicationFee,
    setApplicationFee,
    location,
    setLocation,
    locationZh,
    setLocationZh,
    housingType,
    setHousingType,
    floorPlans,
    setFloorPlans,
    galleryImages,
    setGalleryImages,
    ac,
    setAc,
    dining,
    setDining,
    diningNearbyDetail,
    setDiningNearbyDetail,
    bathroomType,
    setBathroomType,
    pros,
    setPros,
    prosZh,
    setProsZh,
    cons,
    setCons,
    consZh,
    setConsZh,
    categorizedTags,
    setCategorizedTags,
    address,
    setAddress,
    addressZh,
    setAddressZh,
    website,
    setWebsite,
    petFriendly,
    setPetFriendly,
    normalizedFloorPlans,
    derivedRoomOptions,
    updateFloorPlan,
    uploadImage,
    save,
    reset,
    onClose,
    getRoomDisplayLabel,
    historyEntries,
    historyLoading,
    restoringId,
    handleRestore,
  }
}

export type { ActiveTab }
export { getLayoutKind, createFloorPlan }
export type DormEditFormState = ReturnType<typeof useDormEditForm>
