// [COMPONENT] Admin slide-in panel for editing dorm content overrides.
// [组件] 管理员侧边滑出面板，用于编辑宿舍信息覆盖项。
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, RotateCcw, Upload, Loader2, FileText, Info, Tag, Image } from 'lucide-react';
import { Dorm, DormCategorizedTags, DiningType, BathroomType, DormTag, FloorPlan, RoomType } from '../../types/housing';
import { DormUpdate, dormAdminService } from '../../services/dormAdminService';
import { dormService } from '../../services/dormService';
import { Language } from '../../types';
import { getTagDisplay } from '../../utils/tagLabels';
import { TAGS_BY_CATEGORY, CATEGORY_LABELS } from '../../constants/housing/tagDefinitions';

interface DormEditPanelProps {
    dorm: Dorm;
    language: Language;
    onClose: () => void;
    onSaved: (updated: Dorm) => void;
}

type ActiveTab = 'content' | 'details' | 'tags' | 'media';

/** All valid RoomType values for the floor plan dropdown. */
const ROOM_TYPE_OPTIONS: RoomType[] = [
    'Studio', '1B1B', '2B0B', '2B1B', '2B2B', '3B0B', '3B1B', '3B2B', '3B3B',
    '4B0B', '4B1B', '4B2B', '4B3B', '4B4B', '5B2B', 'Suite', 'Cluster',
];

/** Location presets with EN/ZH labels */
const LOCATION_PRESETS: { value: string; en: string; zh: string }[] = [
    { value: 'Ikenberry', en: 'Ikenberry', zh: 'Ikenberry' },
    { value: 'Main Quad', en: 'Main Quad', zh: 'Main Quad' },
    { value: 'PAR/FAR', en: 'PAR/FAR', zh: 'PAR/FAR' },
    { value: 'Campustown', en: 'Campustown', zh: 'Campustown' },
    { value: 'South Campus', en: 'South Campus', zh: 'South Campus' },
];

/** Official UIUC Living-Learning Communities & Special Living Options */
const LLC_OPTIONS = [
    'Beckwith Residential Community',
    'Business LLC',
    'Exploration LLC',
    'Global Crossroads LLC',
    'Health Professions LLC',
    'Honors LLC',
    'Innovation LLC',
    'Intersections LLC',
    'LEADS LLC',
    'Scholars Community',
    'Sustainability LLC',
    'Transfer Community',
    'Unit One LLC',
    'WIMSE LLC',
];

// ── helpers ──────────────────────────────────────────────────────────────────

function EditableList({
    items,
    onChange,
    placeholder,
}: {
    items: string[];
    onChange: (next: string[]) => void;
    placeholder: string;
}) {
    return (
        <div className="space-y-2">
            {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                            const next = [...items];
                            next[idx] = e.target.value;
                            onChange(next);
                        }}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-illini-blue"
                    />
                    <button
                        type="button"
                        onClick={() => onChange(items.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600"
                        title="Remove"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => onChange([...items, ''])}
                className="flex items-center gap-1 text-xs text-illini-blue hover:underline"
            >
                <Plus size={12} /> {placeholder}
            </button>
        </div>
    );
}

// ── main component ────────────────────────────────────────────────────────────

const DormEditPanel: React.FC<DormEditPanelProps> = ({ dorm, language, onClose, onSaved }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('content');
    const [contentLang, setContentLang] = useState<'en' | 'zh'>('en');
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const saveFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Form state
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
    const [floorPlans, setFloorPlans] = useState<FloorPlan[]>(dorm.floorPlans ?? []);
    const [galleryImages, setGalleryImages] = useState<string[]>(dorm.galleryImages ?? []);
    const [ac, setAc] = useState(dorm.ac);
    const [dining, setDining] = useState<DiningType>(dorm.dining);
    const [diningNearbyDetail, setDiningNearbyDetail] = useState(dorm.diningNearbyDetail ?? '');
    const [bathroomType, setBathroomType] = useState<BathroomType>(dorm.bathroomType);

    const emptyCategorized: DormCategorizedTags = { livingConditions: [], facilities: [], lifestyle: [], llcNames: [] };
    const [categorizedTags, setCategorizedTags] = useState<DormCategorizedTags>(dorm.categorizedTags ?? emptyCategorized);
    const [customTags, setCustomTags] = useState<string[]>([]);
    const [newCustomTag, setNewCustomTag] = useState('');
    const [pros, setPros] = useState<string[]>(dorm.pros);
    const [prosZh, setProsZh] = useState<string[]>(dorm.pros_zh ?? []);
    const [cons, setCons] = useState<string[]>(dorm.cons);
    const [consZh, setConsZh] = useState<string[]>(dorm.cons_zh ?? []);

    const [uploadingImage, setUploadingImage] = useState(false);

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
        setFloorPlans([...(dorm.floorPlans ?? [])]);
        setGalleryImages([...(dorm.galleryImages ?? [])]);
        setAc(dorm.ac);
        setDining(dorm.dining);
        setDiningNearbyDetail(dorm.diningNearbyDetail ?? '');
        setBathroomType(dorm.bathroomType);
        setPros([...dorm.pros]);
        setProsZh([...(dorm.pros_zh ?? [])]);
        setCons([...dorm.cons]);
        setConsZh([...(dorm.cons_zh ?? [])]);
        setCategorizedTags(dorm.categorizedTags ?? { livingConditions: [], facilities: [], lifestyle: [], llcNames: [] });
        setCustomTags([]);
        setNewCustomTag('');
    }, [dorm.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const buildUpdate = (): DormUpdate => {
        const finalCategorizedTags: DormCategorizedTags = {
            ...categorizedTags,
            llcNames: categorizedTags.lifestyle.includes('llc') && (categorizedTags.llcNames?.length ?? 0) > 0 ? categorizedTags.llcNames : undefined,
        };

        // Derive room_types from floor plans automatically
        const derivedRoomTypes = floorPlans.length > 0
            ? Array.from(new Set(floorPlans.map(fp => fp.type)))
            : [];

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
            room_types: derivedRoomTypes.length ? derivedRoomTypes : null,
            categorized_tags: finalCategorizedTags as unknown as Record<string, unknown>,
            floor_plans: floorPlans.length ? floorPlans : null,
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

    // ── Image upload handlers ─────────────────────────────────────────────────

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert(language === 'zh' ? '仅支持上传图片文件。' : 'Only image files are supported.');
            e.target.value = '';
            return;
        }
        const maxBytes = 10 * 1024 * 1024;
        if (file.size > maxBytes) {
            alert(language === 'zh' ? '图片大小不能超过 10MB。' : 'Image size must be 10MB or smaller.');
            e.target.value = '';
            return;
        }
        setUploadingImage(true);
        const { publicUrl, errorMessage } = await dormAdminService.uploadDormImage(file);
        setUploadingImage(false);
        if (publicUrl) {
            setImageUrl(publicUrl);
        } else {
            const fallback = language === 'zh' ? '图片上传失败，请重试。' : 'Image upload failed. Please try again.';
            alert(errorMessage ? `${fallback}\n${errorMessage}` : fallback);
        }
        e.target.value = '';
    };

    const handleFloorPlanImageUpload = async (index: number, file: File) => {
        if (!file.type.startsWith('image/')) {
            alert(language === 'zh' ? '仅支持上传图片文件。' : 'Only image files are supported.');
            return;
        }
        const maxBytes = 10 * 1024 * 1024;
        if (file.size > maxBytes) {
            alert(language === 'zh' ? '图片大小不能超过 10MB。' : 'Image size must be 10MB or smaller.');
            return;
        }
        setUploadingImage(true);
        const { publicUrl, errorMessage } = await dormAdminService.uploadDormImage(file);
        setUploadingImage(false);
        if (publicUrl) {
            const next = [...floorPlans];
            next[index] = { ...next[index], imageUrl: publicUrl };
            setFloorPlans(next);
        } else {
            const fallback = language === 'zh' ? '上传失败，请重试。' : 'Upload failed. Please try again.';
            alert(errorMessage ? `${fallback}\n${errorMessage}` : fallback);
        }
    };

    // ── Save / Reset ──────────────────────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true);
        setSaveSuccess(false);
        setSaveError(null);
        if (saveFadeTimer.current) clearTimeout(saveFadeTimer.current);

        const updates = buildUpdate();
        const ok = await dormAdminService.updateDorm(dorm.id, updates);
        setSaving(false);

        if (ok) {
            setSaveSuccess(true);
            saveFadeTimer.current = setTimeout(() => setSaveSuccess(false), 2000);
            const freshDorm = await dormService.getDormById(dorm.id);
            onSaved(freshDorm ?? { ...dorm, ...updates, imageUrl: updates.image_url ?? dorm.imageUrl, housingType: (updates.housing_type ?? dorm.housingType) as Dorm['housingType'], roomTypes: (updates.room_types ?? dorm.roomTypes) as Dorm['roomTypes'] } as Dorm);
        } else {
            setSaveError(language === 'zh' ? '保存失败，请重试。' : 'Save failed. Please try again.');
        }
    };

    const handleReset = async () => {
        if (!window.confirm(
            language === 'zh'
                ? '确定要恢复默认数据吗？所有手动修改将被删除。'
                : 'Reset all overrides for this dorm? Manual edits will be deleted.'
        )) return;
        setResetting(true);
        const ok = await dormAdminService.resetDormToStatic(dorm.id);
        setResetting(false);
        if (ok) {
            const freshDorm = await dormService.getDormById(dorm.id);
            onSaved(freshDorm ?? dorm);
            onClose();
        }
    };

    // ── Custom tag helpers ────────────────────────────────────────────────────

    const handleAddCustomTag = () => {
        const tag = newCustomTag.trim();
        if (tag && !customTags.includes(tag)) {
            setCustomTags([...customTags, tag]);
            setNewCustomTag('');
        }
    };

    const handleRemoveCustomTag = (tag: string) => {
        setCustomTags(customTags.filter(t => t !== tag));
    };

    // ── Tab definitions ────────────────────────────────────────────────────────

    const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
        { id: 'content', label: language === 'zh' ? '内容' : 'Content', icon: <FileText size={14} /> },
        { id: 'details', label: language === 'zh' ? '详情' : 'Details', icon: <Info size={14} /> },
        { id: 'tags', label: language === 'zh' ? '标签' : 'Tags', icon: <Tag size={14} /> },
        { id: 'media', label: language === 'zh' ? '媒体' : 'Media', icon: <Image size={14} /> },
    ];

    // ── i18n shorthand ────────────────────────────────────────────────────────
    const zh = language === 'zh';

    // ── Location preset chips component ───────────────────────────────────────
    const LocationPresets = ({ lang }: { lang: 'en' | 'zh' }) => (
        <div className="space-y-2">
            <label className="block font-medium text-gray-700">
                {lang === 'zh' ? '位置' : 'Location'}
            </label>
            <div className="flex flex-wrap gap-2">
                {LOCATION_PRESETS.map(preset => {
                    const isActive = location === preset.value;
                    return (
                        <button
                            key={preset.value}
                            type="button"
                            onClick={() => {
                                setLocation(preset.value);
                                setLocationZh(preset.zh);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isActive
                                ? 'bg-illini-blue text-white border-illini-blue shadow-sm'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-illini-blue hover:text-illini-blue'
                                }`}
                        >
                            {lang === 'zh' ? preset.zh : preset.en}
                        </button>
                    );
                })}
            </div>
            <input
                type="text"
                value={lang === 'zh' ? locationZh : location}
                onChange={(e) => lang === 'zh' ? setLocationZh(e.target.value) : setLocation(e.target.value)}
                className={inputCls}
                placeholder={lang === 'zh' ? '或输入自定义位置...' : 'Or enter custom location...'}
            />
        </div>
    );

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-illini-blue text-white flex-shrink-0">
                <span className="font-bold text-base truncate">{dorm.name}</span>
                <button type="button" onClick={onClose} className="hover:text-gray-300 flex-shrink-0 ml-2">
                    <X size={20} />
                </button>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-gray-200 flex-shrink-0">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${activeTab === tab.id
                            ? 'border-b-2 border-illini-orange text-illini-blue'
                            : 'text-gray-500 hover:text-illini-blue'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm">

                {/* ═══ TAB: 内容 Content ═══ */}
                {activeTab === 'content' && (
                    <>
                        {/* EN/ZH toggle */}
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                            {(['en', 'zh'] as const).map((lang) => (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => setContentLang(lang)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${contentLang === lang
                                        ? 'bg-white text-illini-blue shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {lang === 'en' ? 'English' : '中文'}
                                </button>
                            ))}
                        </div>

                        {contentLang === 'en' ? (
                            <>
                                <Field label="Name">
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                                </Field>
                                <Field label="Description">
                                    <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
                                </Field>
                                <LocationPresets lang="en" />
                                <Field label="Pros">
                                    <EditableList items={pros} onChange={setPros} placeholder="Add pro" />
                                </Field>
                                <Field label="Cons">
                                    <EditableList items={cons} onChange={setCons} placeholder="Add con" />
                                </Field>
                            </>
                        ) : (
                            <>
                                <Field label="名称">
                                    <input type="text" value={nameZh} onChange={(e) => setNameZh(e.target.value)} className={inputCls} />
                                </Field>
                                <Field label="描述">
                                    <textarea rows={4} value={descriptionZh} onChange={(e) => setDescriptionZh(e.target.value)} className={inputCls} />
                                </Field>
                                <LocationPresets lang="zh" />
                                <Field label="优点">
                                    <EditableList items={prosZh} onChange={setProsZh} placeholder="添加优点" />
                                </Field>
                                <Field label="缺点">
                                    <EditableList items={consZh} onChange={setConsZh} placeholder="添加缺点" />
                                </Field>
                            </>
                        )}

                        {/* Danger zone */}
                        <hr className="border-gray-200" />
                        <div className="pt-1">
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={resetting}
                                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                            >
                                <RotateCcw size={12} />
                                {resetting
                                    ? (zh ? '重置中…' : 'Resetting…')
                                    : (zh ? '重置为默认值' : 'Reset to defaults')}
                            </button>
                        </div>
                    </>
                )}

                {/* ═══ TAB: 详情 Details ═══ */}
                {activeTab === 'details' && (
                    <>
                        <Field label={zh ? '公立/私立' : 'Housing Type'}>
                            <select value={housingType} onChange={e => setHousingType(e.target.value as typeof housingType)} className={inputCls}>
                                <option value="URH">URH</option>
                                <option value="PCH">PCH</option>
                            </select>
                        </Field>

                        <Field label={zh ? '年费用（美元）' : 'Annual Price (USD)'}>
                            <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} />
                        </Field>

                        <Field label={zh ? '申请手续费（美元）' : 'Application Fee (USD)'}>
                            <input type="number" min={0} value={applicationFee} onChange={(e) => setApplicationFee(e.target.value)} className={inputCls} placeholder={zh ? '如无可留空' : 'Leave empty if none'} />
                        </Field>

                        <Toggle
                            label={zh ? '空调' : 'Air Conditioning'}
                            checked={ac}
                            onChange={setAc}
                        />

                        <Field label={zh ? '食堂' : 'Dining'}>
                            <select value={dining} onChange={e => setDining(e.target.value as DiningType)} className={inputCls}>
                                <option value="inside">{zh ? '楼内食堂' : 'Inside'}</option>
                                <option value="nearby">{zh ? '附近' : 'Nearby'}</option>
                                <option value="none">{zh ? '无' : 'None'}</option>
                            </select>
                        </Field>
                        {dining === 'nearby' && (
                            <Field label={zh ? '附近餐饮详情' : 'Nearby Dining Details'}>
                                <input
                                    type="text"
                                    value={diningNearbyDetail}
                                    onChange={(e) => setDiningNearbyDetail(e.target.value)}
                                    className={inputCls}
                                    placeholder={zh ? '例：步行 5 分钟到 Ikenberry Dining Center' : 'e.g. 5 min walk to Ikenberry Dining Center'}
                                />
                            </Field>
                        )}

                        <Field label={zh ? '卫浴类型' : 'Bathroom Type'}>
                            <select value={bathroomType} onChange={e => setBathroomType(e.target.value as BathroomType)} className={inputCls}>
                                <option value="communal">{zh ? '公共卫浴' : 'Communal'}</option>
                                <option value="semi-private">{zh ? '半独立卫浴' : 'Semi-Private'}</option>
                                <option value="private">{zh ? '独立卫浴' : 'Private'}</option>
                            </select>
                        </Field>

                        {/* Derived room types — read-only display */}
                        {floorPlans.length > 0 && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-gray-500 mb-1.5">
                                    {zh ? '房型（自动从户型图获取）' : 'Room Types (auto-derived from Floor Plans)'}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {Array.from(new Set(floorPlans.map(fp => fp.type))).map(rt => (
                                        <span key={rt} className="inline-block px-2 py-0.5 rounded-md border border-gray-300 text-gray-600 text-xs bg-white">
                                            {rt}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ═══ TAB: 标签 Tags ═══ */}
                {activeTab === 'tags' && (
                    <div className="space-y-5">
                        {(['livingConditions', 'facilities', 'lifestyle'] as const).map(category => (
                            <div key={category}>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    {CATEGORY_LABELS[category][language]}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {TAGS_BY_CATEGORY[category].map(tagId => {
                                        const isChecked = categorizedTags[category].includes(tagId as never);
                                        return (
                                            <button
                                                key={tagId}
                                                type="button"
                                                onClick={() => {
                                                    setCategorizedTags(prev => {
                                                        const arr = prev[category] as DormTag[];
                                                        const next = isChecked
                                                            ? arr.filter(t => t !== tagId)
                                                            : [...arr, tagId];
                                                        return { ...prev, [category]: next };
                                                    });
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${isChecked
                                                    ? 'bg-illini-blue text-white border-illini-blue shadow-sm'
                                                    : 'bg-white text-gray-600 border-gray-300 hover:border-illini-blue hover:text-illini-blue'
                                                    }`}
                                            >
                                                {getTagDisplay(tagId, language)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* LLC — clickable preset chips */}
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                {zh ? '学习生活社区 (LLC)' : 'Living-Learning Communities (LLC)'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {LLC_OPTIONS.map(llc => {
                                    const llcNames = categorizedTags.llcNames ?? [];
                                    const isSelected = llcNames.some(n => {
                                        if (n === llc) return true;
                                        const cleanN = n.replace(/ LLC$/, '').trim();
                                        const cleanLlc = llc.replace(/ LLC$/, '').trim();
                                        return cleanN === cleanLlc;
                                    });
                                    return (
                                        <button
                                            key={llc}
                                            type="button"
                                            onClick={() => {
                                                const next = isSelected
                                                    ? llcNames.filter(n => {
                                                        if (n === llc) return false;
                                                        const cleanN = n.replace(/ LLC$/, '').trim();
                                                        const cleanLlc = llc.replace(/ LLC$/, '').trim();
                                                        return cleanN !== cleanLlc;
                                                    })
                                                    : [...llcNames, llc];

                                                // Sync to categorizedTags
                                                setCategorizedTags(prev => {
                                                    const lifestyle = [...prev.lifestyle];
                                                    const hasLlc = next.length > 0;

                                                    // Auto-toggle 'llc' tag in lifestyle
                                                    if (hasLlc && !lifestyle.includes('llc')) {
                                                        lifestyle.push('llc');
                                                    } else if (!hasLlc && lifestyle.includes('llc')) {
                                                        const idx = lifestyle.indexOf('llc');
                                                        if (idx > -1) lifestyle.splice(idx, 1);
                                                    }

                                                    return {
                                                        ...prev,
                                                        lifestyle,
                                                        llcNames: next
                                                    };
                                                });
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${isSelected
                                                ? 'bg-illini-blue text-white border-illini-blue shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-300 hover:border-illini-blue hover:text-illini-blue'
                                                }`}
                                        >
                                            {llc}
                                        </button>
                                    );
                                })}
                            </div>
                            {(categorizedTags.llcNames?.length ?? 0) === 0 && (
                                <p className="text-xs text-gray-400 mt-2">
                                    {zh ? '点击选择该宿舍所属的 LLC' : 'Click to select LLCs available in this dorm'}
                                </p>
                            )}
                        </div>

                        {/* Custom tags */}
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                {zh ? '自定义标签' : 'Custom Tags'}
                            </p>
                            {customTags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {customTags.map(tag => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCustomTag(tag)}
                                                className="text-gray-400 hover:text-red-500 ml-0.5"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCustomTag}
                                    onChange={(e) => setNewCustomTag(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTag(); } }}
                                    placeholder={zh ? '输入自定义标签...' : 'Enter custom tag...'}
                                    className={inputCls}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCustomTag}
                                    disabled={!newCustomTag.trim()}
                                    className="flex-shrink-0 px-3 py-2 bg-illini-blue text-white text-xs font-medium rounded-lg hover:bg-illini-blue/90 disabled:opacity-40 transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ TAB: 媒体 Media ═══ */}
                {activeTab === 'media' && (
                    <>
                        <Field label={zh ? '主图 URL' : 'Primary Image URL'}>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={imageUrl || ''}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className={inputCls}
                                    placeholder="https://..."
                                />
                                <label className="flex-shrink-0 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-3 cursor-pointer transition-colors text-gray-700">
                                    {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                    <span className="text-xs font-medium">{zh ? '上传' : 'Upload'}</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                                </label>
                            </div>
                        </Field>

                        <Field label={zh ? '图库照片' : 'Gallery Images'}>
                            <EditableList
                                items={galleryImages}
                                onChange={setGalleryImages}
                                placeholder={zh ? '添加图库照片链接' : 'Add gallery image URL'}
                            />
                        </Field>

                        <Field label={zh ? '户型图与价格' : 'Floor Plans & Pricing'}>
                            <div className="space-y-3">
                                {floorPlans.map((fp, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-500">
                                                {zh ? `户型 #${idx + 1}` : `Plan #${idx + 1}`}
                                            </span>
                                            <button type="button" onClick={() => setFloorPlans(floorPlans.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <select
                                                value={fp.type}
                                                onChange={e => { const n = [...floorPlans]; n[idx] = { ...n[idx], type: e.target.value as RoomType }; setFloorPlans(n); }}
                                                className={inputCls}
                                            >
                                                {ROOM_TYPE_OPTIONS.map(rt => (
                                                    <option key={rt} value={rt}>{rt}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                value={fp.price}
                                                onChange={e => { const n = [...floorPlans]; n[idx] = { ...n[idx], price: Number(e.target.value) }; setFloorPlans(n); }}
                                                placeholder={zh ? '价格/年' : 'Price/yr'}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={fp.imageUrl || ''}
                                                onChange={e => { const n = [...floorPlans]; n[idx] = { ...n[idx], imageUrl: e.target.value }; setFloorPlans(n); }}
                                                placeholder={zh ? '图片链接...' : 'Image URL...'}
                                                className={inputCls}
                                            />
                                            <label className="flex-shrink-0 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-2 cursor-pointer text-gray-700">
                                                <Upload size={14} />
                                                <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFloorPlanImageUpload(idx, e.target.files[0]); e.target.value = ''; }} />
                                            </label>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setFloorPlans([...floorPlans, { type: 'Studio', price: 0 }])}
                                    className="flex items-center gap-1 text-xs text-illini-blue hover:underline"
                                >
                                    <Plus size={12} /> {zh ? '添加户型' : 'Add floor plan'}
                                </button>
                            </div>
                        </Field>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 bg-white">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 bg-illini-orange hover:bg-illini-orange-dark text-white font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 text-sm"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                    {saving ? (zh ? '保存中…' : 'Saving…') : (zh ? '保存' : 'Save')}
                </button>

                {saveSuccess && (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        ✓ {zh ? '已保存' : 'Saved'}
                    </span>
                )}
                {saveError && (
                    <span className="text-xs text-red-600 font-medium">{saveError}</span>
                )}

                <button
                    type="button"
                    onClick={onClose}
                    className="ml-auto text-xs text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-300 rounded-lg transition-colors"
                >
                    {zh ? '取消' : 'Cancel'}
                </button>
            </div>
        </div>
    );
};

// ── small layout helpers ──────────────────────────────────────────────────────

const inputCls =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-illini-blue';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="block font-medium text-gray-700">{label}</label>
            {children}
        </div>
    );
}

function Toggle({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
                onClick={() => onChange(!checked)}
                className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${checked ? 'bg-illini-orange' : 'bg-gray-300'
                    }`}
            >
                <div
                    className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'
                        }`}
                />
            </div>
            <span className="text-gray-700">{label}</span>
        </label>
    );
}

export default DormEditPanel;
