import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BathroomType,
  DiningType,
  Dorm,
  DormCategorizedTags,
  FloorPlan,
} from '../../../types/housing';
import { Language } from '../../../types';
import {
  buildSummary,
  DormUpdate,
  dormAdminService,
  EditHistoryEntry,
} from '../../../services/dormAdminService';
import { useAuth } from '../../../contexts/AuthContext';
import { dormService } from '../../../services/dormService';
import {
  deriveRoomOptions,
  getRoomDisplayLabel,
  normalizeFloorPlan,
} from '../../../utils/roomOptions';
import { TEXT } from './editPanelText';

interface UseDormEditFormOptions {
  dorm: Dorm;
  language: Language;
  onClose: () => void;
  onSaved: (updated: Dorm) => void;
}

export type ActiveTab = 'content' | 'details' | 'tags' | 'media' | 'history';
type LayoutKind = 'standard' | 'Studio' | 'Suite' | 'Cluster';

const emptyCategorized: DormCategorizedTags = {
  livingConditions: [],
  facilities: [],
  lifestyle: [],
  llcNames: [],
};

export const getLayoutKind = (plan: FloorPlan): LayoutKind =>
  plan.type === 'Studio' || plan.labelCode === 'Studio'
    ? 'Studio'
    : plan.type === 'Suite' || plan.labelCode === 'Suite'
      ? 'Suite'
      : plan.type === 'Cluster' || plan.labelCode === 'Cluster'
        ? 'Cluster'
        : 'standard';

export const createFloorPlan = (): FloorPlan => ({
  bedCount: 1,
  bathroomCount: 0,
  bathroomScope: 'communal',
  price: 0,
  available: true,
});

function dormToSnapshot(dorm: Dorm): Record<string, unknown> {
  return {
    name: dorm.name,
    name_zh: dorm.name_zh ?? null,
    description: dorm.description,
    description_zh: dorm.description_zh ?? null,
    image_url: dorm.imageUrl ?? null,
    price: dorm.price,
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
    categorized_tags: dorm.categorizedTags ?? null,
    floor_plans: dorm.floorPlans ?? null,
    gallery_images: dorm.galleryImages ?? null,
    pros: dorm.pros,
    pros_zh: dorm.pros_zh ?? null,
    cons: dorm.cons,
    cons_zh: dorm.cons_zh ?? null,
  };
}

export const useDormEditForm = ({
  dorm,
  language,
  onClose,
  onSaved,
}: UseDormEditFormOptions) => {
  const { user } = useAuth();
  const t = TEXT[language];
  const [activeTab, setActiveTab] = useState<ActiveTab>('content');
  const [contentLang, setContentLang] = useState<'en' | 'zh'>('en');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // History tab state
  const [historyEntries, setHistoryEntries] = useState<EditHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const [name, setName] = useState(dorm.name);
  const [nameZh, setNameZh] = useState(dorm.name_zh ?? '');
  const [description, setDescription] = useState(dorm.description);
  const [descriptionZh, setDescriptionZh] = useState(dorm.description_zh ?? '');
  const [imageUrl, setImageUrl] = useState(dorm.imageUrl);
  const [price, setPrice] = useState(String(dorm.price));
  const [applicationFee, setApplicationFee] = useState(String(dorm.applicationFee ?? ''));
  const [location, setLocation] = useState(dorm.location);
  const [locationZh, setLocationZh] = useState(dorm.location_zh ?? '');
  const [housingType, setHousingType] = useState(dorm.housingType);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>(
    (dorm.floorPlans ?? []).map((plan) => normalizeFloorPlan(plan, dorm.bathroomType)),
  );
  const [galleryImages, setGalleryImages] = useState<string[]>(dorm.galleryImages ?? []);
  const [ac, setAc] = useState(dorm.ac);
  const [dining, setDining] = useState<DiningType>(dorm.dining);
  const [diningNearbyDetail, setDiningNearbyDetail] = useState(
    dorm.diningNearbyDetail ?? '',
  );
  const [bathroomType, setBathroomType] = useState<BathroomType>(dorm.bathroomType);
  const [pros, setPros] = useState(dorm.pros);
  const [prosZh, setProsZh] = useState(dorm.pros_zh ?? []);
  const [cons, setCons] = useState(dorm.cons);
  const [consZh, setConsZh] = useState(dorm.cons_zh ?? []);
  const [categorizedTags, setCategorizedTags] = useState<DormCategorizedTags>(
    dorm.categorizedTags ?? emptyCategorized,
  );

  useEffect(() => {
    setName(dorm.name);
    setNameZh(dorm.name_zh ?? '');
    setDescription(dorm.description);
    setDescriptionZh(dorm.description_zh ?? '');
    setImageUrl(dorm.imageUrl);
    setPrice(String(dorm.price));
    setApplicationFee(String(dorm.applicationFee ?? ''));
    setLocation(dorm.location);
    setLocationZh(dorm.location_zh ?? '');
    setHousingType(dorm.housingType);
    setFloorPlans((dorm.floorPlans ?? []).map((plan) => normalizeFloorPlan(plan, dorm.bathroomType)));
    setGalleryImages([...(dorm.galleryImages ?? [])]);
    setAc(dorm.ac);
    setDining(dorm.dining);
    setDiningNearbyDetail(dorm.diningNearbyDetail ?? '');
    setBathroomType(dorm.bathroomType);
    setPros([...dorm.pros]);
    setProsZh([...(dorm.pros_zh ?? [])]);
    setCons([...dorm.cons]);
    setConsZh([...(dorm.cons_zh ?? [])]);
    setCategorizedTags(dorm.categorizedTags ?? emptyCategorized);
  }, [dorm]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'history') return;
    setHistoryLoading(true);
    dormAdminService.getEditHistory(dorm.id)
      .then((entries) => setHistoryEntries(entries))
      .finally(() => setHistoryLoading(false));
  }, [activeTab, dorm.id]);

  const normalizedFloorPlans = useMemo(
    () => floorPlans.map((plan) => normalizeFloorPlan(plan, bathroomType)),
    [bathroomType, floorPlans],
  );

  const derivedRoomOptions = useMemo(
    () => deriveRoomOptions(normalizedFloorPlans, bathroomType).roomOptions,
    [normalizedFloorPlans, bathroomType],
  );

  const updateFloorPlan = (index: number, updater: (plan: FloorPlan) => FloorPlan) =>
    setFloorPlans((current) =>
      current.map((plan, currentIndex) => (currentIndex === index ? updater(plan) : plan)),
    );

  const buildUpdate = (): DormUpdate => {
    const derived = deriveRoomOptions(normalizedFloorPlans, bathroomType);
    const finalCategorized: DormCategorizedTags = {
      ...categorizedTags,
      llcNames:
        categorizedTags.lifestyle.includes('llc') &&
        (categorizedTags.llcNames?.length ?? 0) > 0
          ? categorizedTags.llcNames
          : undefined,
    };

    return {
      name,
      name_zh: nameZh || null,
      description,
      description_zh: descriptionZh || null,
      image_url: imageUrl || null,
      price: price !== '' ? Number(price) : null,
      application_fee: applicationFee !== '' ? Number(applicationFee) : null,
      location,
      location_zh: locationZh || null,
      housing_type: housingType,
      room_types: derived.roomTypes.length ? derived.roomTypes : null,
      room_options: derived.roomOptions.length ? derived.roomOptions : null,
      categorized_tags: finalCategorized as unknown as Record<string, unknown>,
      floor_plans: normalizedFloorPlans.length ? normalizedFloorPlans : null,
      gallery_images: galleryImages.length ? galleryImages : null,
      ac,
      dining,
      dining_nearby_detail: diningNearbyDetail || null,
      bathroom_type: bathroomType,
      pros,
      pros_zh: prosZh.length ? prosZh : null,
      cons,
      cons_zh: consZh.length ? consZh : null,
    };
  };

  const refreshDorm = async () => {
    const freshDorm = await dormService.getDormById(dorm.id);
    onSaved(freshDorm ?? dorm);
  };

  const uploadImage = async (file: File, onSuccess: (url: string) => void) => {
    if (!file.type.startsWith('image/')) {
      alert(t.alerts.onlyImages);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert(t.alerts.imageTooLarge);
      return;
    }

    setUploadingImage(true);
    const { publicUrl, errorMessage } = await dormAdminService.uploadDormImage(file);
    setUploadingImage(false);

    if (publicUrl) {
      onSuccess(publicUrl);
      return;
    }

    alert(
      errorMessage
        ? `${t.alerts.imageUploadFailed}\n${errorMessage}`
        : t.alerts.imageUploadFailed,
    );
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const updates = buildUpdate();
    const snapshotBefore = dormToSnapshot(dorm);
    const summary = buildSummary(dorm, updates);

    const result = await dormAdminService.updateDorm(dorm.id, updates);
    setSaving(false);

    if (!result.ok) {
      setSaveError(result.errorMessage || t.alerts.saveFailed);
      return;
    }

    setSaveSuccess(true);
    timerRef.current = setTimeout(() => setSaveSuccess(false), 2000);
    void dormAdminService.logEdit(dorm.id, dorm.name, user?.email ?? 'unknown', summary, snapshotBefore);
    await refreshDorm();
  };

  const handleRestore = async (entry: EditHistoryEntry) => {
    if (!window.confirm(t.alerts.restoreConfirm)) return;
    setRestoringId(entry.id);
    const ok = await dormAdminService.restoreSnapshot(dorm.id, entry);
    setRestoringId(null);
    if (!ok) {
      alert(t.alerts.restoreFailed);
      return;
    }
    await refreshDorm();
    setActiveTab('content');
  };

  const reset = async () => {
    if (!window.confirm(t.alerts.resetConfirm)) {
      return;
    }

    setResetting(true);
    const result = await dormAdminService.resetDormToStatic(dorm.id);
    setResetting(false);

    if (!result.ok) {
      setSaveError(result.errorMessage || t.alerts.saveFailed);
      return;
    }

    await refreshDorm();
    onClose();
  };

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
  };
};

export type DormEditFormState = ReturnType<typeof useDormEditForm>;
