import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Plus, Trash2, RotateCcw, Upload, Loader2, FileText, Info, Tag, Image } from 'lucide-react';
import { BathroomScope, BathroomType, DiningType, Dorm, DormCategorizedTags, FloorPlan } from '../../types/housing';
import { Language } from '../../types';
import { DormUpdate, dormAdminService } from '../../services/dormAdminService';
import { dormService } from '../../services/dormService';
import { CATEGORY_LABELS, TAGS_BY_CATEGORY } from '../../constants/housing/tagDefinitions';
import { getTagDisplay } from '../../utils/tagLabels';
import { deriveRoomOptions, getRoomDisplayLabel, normalizeFloorPlan } from '../../utils/roomOptions';

interface DormEditPanelProps {
    dorm: Dorm;
    language: Language;
    onClose: () => void;
    onSaved: (updated: Dorm) => void;
}

type ActiveTab = 'content' | 'details' | 'tags' | 'media';
type LayoutKind = 'standard' | 'Studio' | 'Suite' | 'Cluster';

const TEXT = {
    en: {
        tabs: { content: 'Content', details: 'Details', tags: 'Tags', media: 'Media' },
        labels: {
            name: 'Name', description: 'Description', location: 'Location', pros: 'Pros', cons: 'Cons',
            housingType: 'Housing Type', annualPrice: 'Annual Price (USD)', applicationFee: 'Application Fee (USD)',
            airConditioning: 'Air Conditioning', dining: 'Dining', bathroomType: 'Bathroom Type',
            roomOptions: 'Derived Room Options', imageUrl: 'Primary Image URL', galleryImages: 'Gallery Images',
            floorPlans: 'Floor Plans & Pricing', layoutKind: 'Layout Kind', bedCount: 'Bed Count',
            bathroomCount: 'Bathroom Count', pricePerYear: 'Price / year', sqft: 'Sq Ft',
            shortDescription: 'Description', planImageUrl: 'Image URL', available: 'Available', llc: 'Living-Learning Communities (LLC)',
        },
        actions: {
            addPro: 'Add pro', addCon: 'Add con', addFloorPlan: 'Add floor plan', addGalleryImage: 'Add gallery image URL',
            reset: 'Reset to defaults', resetting: 'Resetting...', save: 'Save', saving: 'Saving...', saved: 'Saved', cancel: 'Cancel', upload: 'Upload',
        },
        values: {
            inside: 'Inside', nearby: 'Nearby', none: 'None', communal: 'Communal', semiPrivate: 'Semi-Private', private: 'Private',
            standard: 'Standard', studio: 'Studio', suite: 'Suite', cluster: 'Cluster', noFloorPlans: 'Add at least one floor plan to derive room options.',
        },
        hints: {
            customLocation: 'Or enter a custom location...', feePlaceholder: 'Leave empty if none',
            nearbyDining: 'e.g. 5 min walk to Ikenberry Dining Center', roomOptions: 'Auto-derived from floor plans',
            llc: 'Click to select LLCs available in this dorm',
        },
        alerts: {
            resetConfirm: 'Reset all overrides for this dorm? Manual edits will be deleted.',
            saveFailed: 'Save failed. Please try again.', onlyImages: 'Only image files are supported.',
            imageTooLarge: 'Image size must be 10MB or smaller.', imageUploadFailed: 'Image upload failed. Please try again.',
        },
    },
    zh: {
        tabs: { content: '内容', details: '详情', tags: '标签', media: '媒体' },
        labels: {
            name: '名称', description: '描述', location: '位置', pros: '优点', cons: '缺点',
            housingType: '住宿类型', annualPrice: '年费用（美元）', applicationFee: '申请费（美元）',
            airConditioning: '空调', dining: '食堂', bathroomType: '卫浴类型',
            roomOptions: '派生房型', imageUrl: '主图 URL', galleryImages: '图库图片',
            floorPlans: '户型图与价格', layoutKind: '布局类型', bedCount: '床位数',
            bathroomCount: '卫浴数', pricePerYear: '年价格', sqft: '面积',
            shortDescription: '描述', planImageUrl: '图片链接', available: '可预订', llc: '学习生活社区（LLC）',
        },
        actions: {
            addPro: '添加优点', addCon: '添加缺点', addFloorPlan: '添加户型', addGalleryImage: '添加图库图片链接',
            reset: '恢复默认数据', resetting: '恢复中...', save: '保存', saving: '保存中...', saved: '已保存', cancel: '取消', upload: '上传',
        },
        values: {
            inside: '楼内', nearby: '附近', none: '无', communal: '公共卫浴', semiPrivate: '半独立卫浴', private: '独立卫浴',
            standard: '标准', studio: 'Studio', suite: 'Suite', cluster: 'Cluster', noFloorPlans: '至少添加一个户型图后才会生成房型。',
        },
        hints: {
            customLocation: '或输入自定义位置...', feePlaceholder: '如无可留空',
            nearbyDining: '例如：步行 5 分钟到 Ikenberry Dining Center', roomOptions: '会根据户型图自动生成',
            llc: '点击选择该宿舍可用的 LLC',
        },
        alerts: {
            resetConfirm: '确定要恢复默认数据吗？所有手动修改都会被删除。',
            saveFailed: '保存失败，请重试。', onlyImages: '仅支持上传图片文件。',
            imageTooLarge: '图片大小不能超过 10MB。', imageUploadFailed: '图片上传失败，请重试。',
        },
    },
} as const;

const LOCATION_PRESETS = [
    { value: 'Ikenberry', en: 'Ikenberry', zh: 'Ikenberry' },
    { value: 'Main Quad', en: 'Main Quad', zh: 'Main Quad' },
    { value: 'PAR/FAR', en: 'PAR/FAR', zh: 'PAR/FAR' },
    { value: 'Campustown', en: 'Campustown', zh: 'Campustown' },
    { value: 'South Campus', en: 'South Campus', zh: 'South Campus' },
];

const LLC_OPTIONS = ['Beckwith Residential Community', 'Business LLC', 'Exploration LLC', 'Global Crossroads LLC', 'Health Professions LLC', 'Honors LLC', 'Innovation LLC', 'Intersections LLC', 'LEADS LLC', 'Scholars Community', 'Sustainability LLC', 'Transfer Community', 'Unit One LLC', 'WIMSE LLC'];
const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-illini-blue';
const emptyCategorized: DormCategorizedTags = { livingConditions: [], facilities: [], lifestyle: [], llcNames: [] };
const getLayoutKind = (plan: FloorPlan): LayoutKind => plan.type === 'Studio' || plan.labelCode === 'Studio' ? 'Studio' : plan.type === 'Suite' || plan.labelCode === 'Suite' ? 'Suite' : plan.type === 'Cluster' || plan.labelCode === 'Cluster' ? 'Cluster' : 'standard';
const createFloorPlan = (): FloorPlan => ({ bedCount: 1, bathroomCount: 0, bathroomScope: 'communal', price: 0, available: true });

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1"><label className="block font-medium text-gray-700">{label}</label>{children}</div>; }
function EditableList({ items, onChange, placeholder }: { items: string[]; onChange: (next: string[]) => void; placeholder: string }) { return <div className="space-y-2">{items.map((item, idx) => <div key={idx} className="flex gap-2 items-center"><input className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-illini-blue" value={item} onChange={(e) => { const next = [...items]; next[idx] = e.target.value; onChange(next); }} /><button type="button" onClick={() => onChange(items.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></div>)}<button type="button" onClick={() => onChange([...items, ''])} className="flex items-center gap-1 text-xs text-illini-blue hover:underline"><Plus size={12} /> {placeholder}</button></div>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center gap-2 cursor-pointer select-none"><div onClick={() => onChange(!checked)} className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${checked ? 'bg-illini-orange' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} /></div><span className="text-gray-700">{label}</span></label>; }

const DormEditPanel: React.FC<DormEditPanelProps> = ({ dorm, language, onClose, onSaved }) => {
    const t = TEXT[language];
    const [activeTab, setActiveTab] = useState<ActiveTab>('content');
    const [contentLang, setContentLang] = useState<'en' | 'zh'>('en');
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const [floorPlans, setFloorPlans] = useState<FloorPlan[]>((dorm.floorPlans ?? []).map((plan) => normalizeFloorPlan(plan, dorm.bathroomType)));
    const [galleryImages, setGalleryImages] = useState<string[]>(dorm.galleryImages ?? []);
    const [ac, setAc] = useState(dorm.ac);
    const [dining, setDining] = useState<DiningType>(dorm.dining);
    const [diningNearbyDetail, setDiningNearbyDetail] = useState(dorm.diningNearbyDetail ?? '');
    const [bathroomType, setBathroomType] = useState<BathroomType>(dorm.bathroomType);
    const [pros, setPros] = useState(dorm.pros);
    const [prosZh, setProsZh] = useState(dorm.pros_zh ?? []);
    const [cons, setCons] = useState(dorm.cons);
    const [consZh, setConsZh] = useState(dorm.cons_zh ?? []);
    const [categorizedTags, setCategorizedTags] = useState<DormCategorizedTags>(dorm.categorizedTags ?? emptyCategorized);

    useEffect(() => {
        setName(dorm.name); setNameZh(dorm.name_zh ?? ''); setDescription(dorm.description); setDescriptionZh(dorm.description_zh ?? '');
        setImageUrl(dorm.imageUrl); setPrice(String(dorm.price)); setApplicationFee(String(dorm.applicationFee ?? ''));
        setLocation(dorm.location); setLocationZh(dorm.location_zh ?? ''); setHousingType(dorm.housingType);
        setFloorPlans((dorm.floorPlans ?? []).map((plan) => normalizeFloorPlan(plan, dorm.bathroomType)));
        setGalleryImages([...(dorm.galleryImages ?? [])]); setAc(dorm.ac); setDining(dorm.dining);
        setDiningNearbyDetail(dorm.diningNearbyDetail ?? ''); setBathroomType(dorm.bathroomType);
        setPros([...dorm.pros]); setProsZh([...(dorm.pros_zh ?? [])]); setCons([...dorm.cons]); setConsZh([...(dorm.cons_zh ?? [])]);
        setCategorizedTags(dorm.categorizedTags ?? emptyCategorized);
    }, [dorm]);

    const normalizedFloorPlans = useMemo(() => floorPlans.map((plan) => normalizeFloorPlan(plan, bathroomType)), [bathroomType, floorPlans]);
    const derivedRoomOptions = useMemo(() => deriveRoomOptions(normalizedFloorPlans, bathroomType).roomOptions, [normalizedFloorPlans, bathroomType]);

    const updateFloorPlan = (index: number, updater: (plan: FloorPlan) => FloorPlan) => setFloorPlans((current) => current.map((plan, idx) => idx === index ? updater(plan) : plan));

    const buildUpdate = (): DormUpdate => {
        const derived = deriveRoomOptions(normalizedFloorPlans, bathroomType);
        const finalCategorized: DormCategorizedTags = { ...categorizedTags, llcNames: categorizedTags.lifestyle.includes('llc') && (categorizedTags.llcNames?.length ?? 0) > 0 ? categorizedTags.llcNames : undefined };
        return { name, name_zh: nameZh || null, description, description_zh: descriptionZh || null, image_url: imageUrl || null, price: price !== '' ? Number(price) : null, application_fee: applicationFee !== '' ? Number(applicationFee) : null, location, location_zh: locationZh || null, housing_type: housingType, room_types: derived.roomTypes.length ? derived.roomTypes : null, room_options: derived.roomOptions.length ? derived.roomOptions : null, categorized_tags: finalCategorized as unknown as Record<string, unknown>, floor_plans: normalizedFloorPlans.length ? normalizedFloorPlans : null, gallery_images: galleryImages.length ? galleryImages : null, ac, dining, dining_nearby_detail: diningNearbyDetail || null, bathroom_type: bathroomType, pros, pros_zh: prosZh.length ? prosZh : null, cons, cons_zh: consZh.length ? consZh : null };
    };

    const refreshDorm = async () => { const freshDorm = await dormService.getDormById(dorm.id); onSaved(freshDorm ?? dorm); };
    const uploadImage = async (file: File, onSuccess: (url: string) => void) => { if (!file.type.startsWith('image/')) { alert(t.alerts.onlyImages); return; } if (file.size > 10 * 1024 * 1024) { alert(t.alerts.imageTooLarge); return; } setUploadingImage(true); const { publicUrl, errorMessage } = await dormAdminService.uploadDormImage(file); setUploadingImage(false); if (publicUrl) onSuccess(publicUrl); else alert(errorMessage ? `${t.alerts.imageUploadFailed}\n${errorMessage}` : t.alerts.imageUploadFailed); };
    const save = async () => { setSaving(true); setSaveError(null); setSaveSuccess(false); if (timerRef.current) clearTimeout(timerRef.current); const result = await dormAdminService.updateDorm(dorm.id, buildUpdate()); setSaving(false); if (!result.ok) { setSaveError(result.errorMessage || t.alerts.saveFailed); return; } setSaveSuccess(true); timerRef.current = setTimeout(() => setSaveSuccess(false), 2000); await refreshDorm(); };
    const reset = async () => { if (!window.confirm(t.alerts.resetConfirm)) return; setResetting(true); const result = await dormAdminService.resetDormToStatic(dorm.id); setResetting(false); if (!result.ok) { setSaveError(result.errorMessage || t.alerts.saveFailed); return; } await refreshDorm(); onClose(); };

    return (
        <div className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-illini-blue text-white flex-shrink-0">
                <span className="font-bold text-base truncate">{language === 'zh' && dorm.name_zh ? dorm.name_zh : dorm.name}</span>
                <button type="button" onClick={onClose} className="hover:text-gray-300 flex-shrink-0 ml-2"><X size={20} /></button>
            </div>
            <div className="flex border-b border-gray-200 flex-shrink-0">
                {([{ id: 'content', icon: <FileText size={14} />, label: t.tabs.content }, { id: 'details', icon: <Info size={14} />, label: t.tabs.details }, { id: 'tags', icon: <Tag size={14} />, label: t.tabs.tags }, { id: 'media', icon: <Image size={14} />, label: t.tabs.media }] as { id: ActiveTab; icon: React.ReactNode; label: string }[]).map((tab) => (
                    <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${activeTab === tab.id ? 'border-b-2 border-illini-orange text-illini-blue' : 'text-gray-500 hover:text-illini-blue'}`}>{tab.icon}{tab.label}</button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm">
                {activeTab === 'content' && <>
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">{(['en', 'zh'] as const).map((lang) => <button key={lang} type="button" onClick={() => setContentLang(lang)} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${contentLang === lang ? 'bg-white text-illini-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{lang === 'en' ? 'English' : '中文'}</button>)}</div>
                    {contentLang === 'en' ? <>
                        <Field label={t.labels.name}><input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
                        <Field label={t.labels.description}><textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} /></Field>
                        <Field label={t.labels.location}><div className="space-y-2"><div className="flex flex-wrap gap-2">{LOCATION_PRESETS.map((preset) => <button key={preset.value} type="button" onClick={() => { setLocation(preset.value); setLocationZh(preset.zh); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${location === preset.value ? 'bg-illini-blue text-white border-illini-blue shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:border-illini-blue hover:text-illini-blue'}`}>{preset.en}</button>)}</div><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} placeholder={t.hints.customLocation} /></div></Field>
                        <Field label={t.labels.pros}><EditableList items={pros} onChange={setPros} placeholder={t.actions.addPro} /></Field>
                        <Field label={t.labels.cons}><EditableList items={cons} onChange={setCons} placeholder={t.actions.addCon} /></Field>
                    </> : <>
                        <Field label={t.labels.name}><input type="text" value={nameZh} onChange={(e) => setNameZh(e.target.value)} className={inputCls} /></Field>
                        <Field label={t.labels.description}><textarea rows={4} value={descriptionZh} onChange={(e) => setDescriptionZh(e.target.value)} className={inputCls} /></Field>
                        <Field label={t.labels.location}><div className="space-y-2"><div className="flex flex-wrap gap-2">{LOCATION_PRESETS.map((preset) => <button key={preset.value} type="button" onClick={() => { setLocation(preset.value); setLocationZh(preset.zh); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${locationZh === preset.zh ? 'bg-illini-blue text-white border-illini-blue shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:border-illini-blue hover:text-illini-blue'}`}>{preset.zh}</button>)}</div><input type="text" value={locationZh} onChange={(e) => setLocationZh(e.target.value)} className={inputCls} placeholder={t.hints.customLocation} /></div></Field>
                        <Field label={t.labels.pros}><EditableList items={prosZh} onChange={setProsZh} placeholder={t.actions.addPro} /></Field>
                        <Field label={t.labels.cons}><EditableList items={consZh} onChange={setConsZh} placeholder={t.actions.addCon} /></Field>
                    </>}
                    <hr className="border-gray-200" />
                    <button type="button" onClick={reset} disabled={resetting} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"><RotateCcw size={12} />{resetting ? t.actions.resetting : t.actions.reset}</button>
                </>}
                {activeTab === 'details' && <>
                    <Field label={t.labels.housingType}><select value={housingType} onChange={(e) => setHousingType(e.target.value as Dorm['housingType'])} className={inputCls}><option value="URH">URH</option><option value="PCH">PCH</option></select></Field>
                    <Field label={t.labels.annualPrice}><input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} /></Field>
                    <Field label={t.labels.applicationFee}><input type="number" min={0} value={applicationFee} onChange={(e) => setApplicationFee(e.target.value)} className={inputCls} placeholder={t.hints.feePlaceholder} /></Field>
                    <Toggle label={t.labels.airConditioning} checked={ac} onChange={setAc} />
                    <Field label={t.labels.dining}><select value={dining} onChange={(e) => setDining(e.target.value as DiningType)} className={inputCls}><option value="inside">{t.values.inside}</option><option value="nearby">{t.values.nearby}</option><option value="none">{t.values.none}</option></select></Field>
                    {dining === 'nearby' && <Field label={t.labels.dining}><input type="text" value={diningNearbyDetail} onChange={(e) => setDiningNearbyDetail(e.target.value)} className={inputCls} placeholder={t.hints.nearbyDining} /></Field>}
                    <Field label={t.labels.bathroomType}><select value={bathroomType} onChange={(e) => setBathroomType(e.target.value as BathroomType)} className={inputCls}><option value="communal">{t.values.communal}</option><option value="semi-private">{t.values.semiPrivate}</option><option value="private">{t.values.private}</option></select></Field>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3"><p className="text-xs font-medium text-gray-500 mb-1.5">{t.labels.roomOptions}</p><p className="text-[11px] text-gray-400 mb-2">{t.hints.roomOptions}</p><div className="flex flex-wrap gap-1.5">{derivedRoomOptions.length > 0 ? derivedRoomOptions.map((option) => <span key={`${option.labelCode ?? 'custom'}-${option.bedCount ?? 'na'}-${option.bathroomCount ?? 'na'}-${option.bathroomScope}`} className="inline-block px-2 py-0.5 rounded-md border border-gray-300 text-gray-600 text-xs bg-white">{getRoomDisplayLabel(option, language)}</span>) : <span className="text-xs text-gray-400">{t.values.noFloorPlans}</span>}</div></div>
                </>}
                {activeTab === 'tags' && <div className="space-y-5">{(['livingConditions', 'facilities', 'lifestyle'] as const).map((category) => <div key={category}><p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{CATEGORY_LABELS[category][language]}</p><div className="flex flex-wrap gap-2">{TAGS_BY_CATEGORY[category].map((tagId) => { const checked = categorizedTags[category].includes(tagId as never); return <button key={tagId} type="button" onClick={() => setCategorizedTags((prev) => ({ ...prev, [category]: checked ? prev[category].filter((tag) => tag !== tagId) : [...prev[category], tagId] }))} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${checked ? 'bg-illini-blue text-white border-illini-blue shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:border-illini-blue hover:text-illini-blue'}`}>{getTagDisplay(tagId, language)}</button>; })}</div></div>)}<div><p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t.labels.llc}</p><div className="flex flex-wrap gap-2">{LLC_OPTIONS.map((llc) => { const selected = categorizedTags.llcNames?.includes(llc) ?? false; return <button key={llc} type="button" onClick={() => setCategorizedTags((prev) => { const current = prev.llcNames ?? []; const next = selected ? current.filter((name) => name !== llc) : [...current, llc]; return { ...prev, lifestyle: next.length > 0 ? Array.from(new Set([...prev.lifestyle, 'llc'])) : prev.lifestyle.filter((tag) => tag !== 'llc'), llcNames: next }; })} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selected ? 'bg-illini-blue text-white border-illini-blue shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:border-illini-blue hover:text-illini-blue'}`}>{llc}</button>; })}</div>{(categorizedTags.llcNames?.length ?? 0) === 0 && <p className="text-xs text-gray-400 mt-2">{t.hints.llc}</p>}</div></div>}
                {activeTab === 'media' && <>
                    <Field label={t.labels.imageUrl}>
                        <div className="flex gap-2">
                            <input type="text" value={imageUrl || ''} onChange={(e) => setImageUrl(e.target.value)} className={inputCls} placeholder="https://..." />
                            <label className="flex-shrink-0 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-3 cursor-pointer transition-colors text-gray-700">
                                {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                <span className="text-xs font-medium">{t.actions.upload}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) void uploadImage(e.target.files[0], setImageUrl); e.target.value = ''; }} />
                            </label>
                        </div>
                    </Field>
                    <Field label={t.labels.galleryImages}>
                        <EditableList items={galleryImages} onChange={setGalleryImages} placeholder={t.actions.addGalleryImage} />
                    </Field>
                    <Field label={t.labels.floorPlans}>
                        <div className="space-y-3">
                            {normalizedFloorPlans.map((plan, index) => {
                                const layoutKind = getLayoutKind(plan);
                                const scope = plan.bathroomScope ?? bathroomType;
                                const preview = getRoomDisplayLabel({ bedCount: plan.bedCount ?? null, bathroomCount: plan.bathroomCount ?? null, bathroomScope: scope, labelCode: plan.labelCode }, language);
                                const update = (patch: Partial<FloorPlan>, renormalize = true) => updateFloorPlan(index, (current) => renormalize ? normalizeFloorPlan({ ...current, ...patch }, bathroomType) : { ...current, ...patch });
                                return (
                                    <div key={index} className="flex flex-col gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-xs font-bold text-gray-500">{t.labels.floorPlans} #{index + 1}</span>
                                                <div className="text-xs text-gray-400 mt-1">{preview}</div>
                                            </div>
                                            <button type="button" onClick={() => setFloorPlans((current) => current.filter((_, idx) => idx !== index))} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Field label={t.labels.layoutKind}>
                                                <select value={layoutKind} onChange={(e) => update({ type: e.target.value === 'standard' ? undefined : e.target.value as FloorPlan['type'], labelCode: e.target.value === 'standard' ? undefined : e.target.value }, true)} className={inputCls}>
                                                    <option value="standard">{t.values.standard}</option>
                                                    <option value="Studio">{t.values.studio}</option>
                                                    <option value="Suite">{t.values.suite}</option>
                                                    <option value="Cluster">{t.values.cluster}</option>
                                                </select>
                                            </Field>
                                            <Field label={t.labels.bathroomType}>
                                                <select value={scope} onChange={(e) => update({ bathroomScope: e.target.value as BathroomScope, bathroomCount: e.target.value === 'communal' ? 0 : plan.bathroomCount ?? null }, true)} className={inputCls}>
                                                    <option value="communal">{t.values.communal}</option>
                                                    <option value="semi-private">{t.values.semiPrivate}</option>
                                                    <option value="private">{t.values.private}</option>
                                                </select>
                                            </Field>
                                            {layoutKind === 'standard' && (
                                                <Field label={t.labels.bedCount}>
                                                    <select value={plan.bedCount ?? 1} onChange={(e) => update({ bedCount: Number(e.target.value), type: undefined, labelCode: undefined }, true)} className={inputCls}>
                                                        {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}</option>)}
                                                    </select>
                                                </Field>
                                            )}
                                            <Field label={t.labels.bathroomCount}>
                                                <input type="number" min={0} value={scope === 'communal' ? 0 : plan.bathroomCount ?? ''} onChange={(e) => update({ bathroomCount: e.target.value === '' ? null : Number(e.target.value) }, true)} className={inputCls} disabled={scope === 'communal'} />
                                            </Field>
                                            <Field label={t.labels.pricePerYear}>
                                                <input type="number" min={0} value={plan.price} onChange={(e) => update({ price: Number(e.target.value) }, false)} className={inputCls} />
                                            </Field>
                                            <Field label={t.labels.sqft}>
                                                <input type="number" min={0} value={plan.sqft ?? ''} onChange={(e) => update({ sqft: e.target.value === '' ? undefined : Number(e.target.value) }, false)} className={inputCls} />
                                            </Field>
                                        </div>
                                        <Field label={t.labels.shortDescription}>
                                            <input type="text" value={plan.description ?? ''} onChange={(e) => update({ description: e.target.value }, false)} className={inputCls} />
                                        </Field>
                                        <Field label={t.labels.planImageUrl}>
                                            <div className="flex gap-2">
                                                <input type="text" value={plan.imageUrl ?? ''} onChange={(e) => update({ imageUrl: e.target.value }, false)} className={inputCls} placeholder="https://..." />
                                                <label className="flex-shrink-0 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-3 cursor-pointer transition-colors text-gray-700">
                                                    <Upload size={14} />
                                                    <span className="text-xs font-medium">{t.actions.upload}</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) void uploadImage(e.target.files[0], (url) => update({ imageUrl: url }, false)); e.target.value = ''; }} />
                                                </label>
                                            </div>
                                        </Field>
                                        <Toggle label={t.labels.available} checked={plan.available !== false} onChange={(value) => update({ available: value }, false)} />
                                    </div>
                                );
                            })}
                            <button type="button" onClick={() => setFloorPlans((current) => [...current, createFloorPlan()])} className="flex items-center gap-1 text-xs text-illini-blue hover:underline"><Plus size={12} /> {t.actions.addFloorPlan}</button>
                        </div>
                    </Field>
                </>}
            </div>
            <div className="border-t border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 bg-white">
                <button type="button" onClick={save} disabled={saving} className="flex items-center justify-center gap-2 bg-illini-orange hover:bg-illini-orange-dark text-white font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 text-sm">{saving ? <Loader2 size={14} className="animate-spin" /> : null}{saving ? t.actions.saving : t.actions.save}</button>
                {saveSuccess && <span className="text-xs text-emerald-600 font-medium">{t.actions.saved}</span>}
                {saveError && <span className="text-xs text-red-600 font-medium">{saveError}</span>}
                <button type="button" onClick={onClose} className="ml-auto text-xs text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-300 rounded-lg transition-colors">{t.actions.cancel}</button>
            </div>
        </div>
    );
};

export default DormEditPanel;
