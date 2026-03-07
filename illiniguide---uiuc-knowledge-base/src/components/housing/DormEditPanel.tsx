// [COMPONENT] Admin slide-in panel for editing dorm content overrides.
// [组件] 管理员侧边滑出面板，用于编辑宿舍信息覆盖项。
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, RotateCcw, Save, Upload, Loader2 } from 'lucide-react';
import { Dorm, FloorPlan, RoomType } from '../../types/housing';
import { DormOverride, dormAdminService } from '../../services/dormAdminService';
import { Language } from '../../types';

interface DormEditPanelProps {
    dorm: Dorm;
    language: Language;
    onClose: () => void;
    onSaved: (updated: Dorm) => void;
}

type LangTab = 'en' | 'zh';

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
    const [langTab, setLangTab] = useState<LangTab>('en');
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    // Form state mirrors DormOverride fields
    const [name, setName] = useState(dorm.name);
    const [nameZh, setNameZh] = useState(dorm.name_zh ?? '');
    const [description, setDescription] = useState(dorm.description);
    const [descriptionZh, setDescriptionZh] = useState(dorm.description_zh ?? '');
    const [imageUrl, setImageUrl] = useState(dorm.imageUrl);
    const [price, setPrice] = useState(String(dorm.price));
    const [location, setLocation] = useState(dorm.location);
    const [locationZh, setLocationZh] = useState(dorm.location_zh ?? '');
    const [type, setType] = useState(dorm.type);
    const [typeZh, setTypeZh] = useState(dorm.type_zh ?? '');
    const [housingType, setHousingType] = useState(dorm.housingType);
    const [roomTypes, setRoomTypes] = useState<string[]>(dorm.roomTypes);
    const [tags, setTags] = useState<string[]>(dorm.tags);
    const [floorPlans, setFloorPlans] = useState<FloorPlan[]>(dorm.floorPlans ?? []);
    const [galleryImages, setGalleryImages] = useState<string[]>([]); // Override gallery array

    const [ac, setAc] = useState(dorm.ac);
    const [dining, setDining] = useState(dorm.dining);
    const [pros, setPros] = useState<string[]>(dorm.pros);
    const [prosZh, setProsZh] = useState<string[]>(dorm.pros_zh ?? []);
    const [cons, setCons] = useState<string[]>(dorm.cons);
    const [consZh, setConsZh] = useState<string[]>(dorm.cons_zh ?? []);

    const [uploadingImage, setUploadingImage] = useState(false);

    // Load existing override on mount
    useEffect(() => {
        dormAdminService.getOverride(dorm.id).then((override) => {
            if (!override) return;
            if (override.name != null) setName(override.name);
            if (override.name_zh != null) setNameZh(override.name_zh);
            if (override.description != null) setDescription(override.description);
            if (override.description_zh != null) setDescriptionZh(override.description_zh);
            if (override.image_url != null) setImageUrl(override.image_url);
            if (override.price != null) setPrice(String(override.price));
            if (override.location != null) setLocation(override.location as any);
            if (override.location_zh != null) setLocationZh(override.location_zh);
            if (override.type != null) setType(override.type as any);
            if (override.type_zh != null) setTypeZh(override.type_zh);
            if (override.housing_type != null) setHousingType(override.housing_type as any);
            if (override.room_types != null) setRoomTypes(override.room_types);
            if (override.tags != null) setTags(override.tags);
            if (override.floor_plans != null) setFloorPlans(override.floor_plans);
            if (override.gallery_images != null) setGalleryImages(override.gallery_images);
            if (override.ac != null) setAc(override.ac);
            if (override.dining != null) setDining(override.dining);
            if (override.pros != null) setPros(override.pros);
            if (override.pros_zh != null) setProsZh(override.pros_zh);
            if (override.cons != null) setCons(override.cons);
            if (override.cons_zh != null) setConsZh(override.cons_zh);
        });
    }, [dorm.id]);

    const buildOverride = (): DormOverride => ({
        dorm_id: dorm.id,
        name,
        name_zh: nameZh || null,
        description,
        description_zh: descriptionZh || null,
        image_url: imageUrl || null,
        price: price !== '' ? Number(price) : null,
        location,
        location_zh: locationZh || null,
        type,
        type_zh: typeZh || null,
        housing_type: housingType,
        room_types: roomTypes.length ? roomTypes : null,
        tags: tags.length ? tags : null,
        floor_plans: floorPlans.length ? floorPlans : null,
        gallery_images: galleryImages.length ? galleryImages : null,
        ac,
        dining,
        pros,
        pros_zh: prosZh.length ? prosZh : null,
        cons,
        cons_zh: consZh.length ? consZh : null,
    });

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

    const handleSave = async () => {
        setSaving(true);
        setSaveMsg(null);
        const override = buildOverride();
        const ok = await dormAdminService.saveOverride(override);
        setSaving(false);
        if (ok) {
            setSaveMsg(language === 'zh' ? '保存成功！' : 'Saved!');
            const merged = dormAdminService.applyOverride(dorm, override);
            onSaved(merged);
        } else {
            setSaveMsg(language === 'zh' ? '保存失败，请重试。' : 'Save failed. Please try again.');
        }
    };

    const handleReset = async () => {
        if (!window.confirm(
            language === 'zh'
                ? '确定要恢复默认数据吗？所有手动修改将被删除。'
                : 'Reset all overrides for this dorm? Manual edits will be deleted.'
        )) return;
        setResetting(true);
        const ok = await dormAdminService.deleteOverride(dorm.id);
        setResetting(false);
        if (ok) {
            onSaved(dorm); // revert to original static dorm
            onClose();
        }
    };

    // ── labels ────────────────────────────────────────────────────────────────
    const labels = {
        en: {
            title: 'Edit Dorm Info',
            langEn: 'English',
            langZh: 'Chinese',
            nameLabel: 'Name',
            descLabel: 'Description',
            imageLabel: 'Image URL',
            locationLabel: 'Location',
            typeLabel: 'Dorm Type',
            housingTypeLabel: 'Housing Type',
            roomTypesLabel: 'Room Types',
            tagsLabel: 'Tags',
            floorPlansLabel: 'Floor Plans & Pricing',
            addFloorPlan: 'Add floor plan',
            galleryLabel: 'Gallery Images',
            uploadImage: 'Upload File',
            priceLabel: 'Annual Price (USD)',
            acLabel: 'Air Conditioning',
            diningLabel: 'On-site Dining',
            prosLabel: 'Pros',
            addPro: 'Add pro',
            consLabel: 'Cons',
            addCon: 'Add con',
            save: 'Save',
            reset: 'Reset to defaults',
            cancel: 'Cancel',
        },
        zh: {
            title: '编辑宿舍信息',
            langEn: '英文',
            langZh: '中文',
            nameLabel: '名称',
            descLabel: '描述',
            imageLabel: '图片 URL',
            locationLabel: '地理位置',
            typeLabel: '宿舍类型',
            housingTypeLabel: '公立/私立',
            roomTypesLabel: '房型',
            tagsLabel: '标签',
            floorPlansLabel: '户型图与详细价格 (Floor Plans)',
            addFloorPlan: '添加户型',
            galleryLabel: '图库照片 (Gallery)',
            uploadImage: '上传文件',
            priceLabel: '年费用（美元）',
            acLabel: '空调',
            diningLabel: '楼内食堂',
            prosLabel: '优点',
            addPro: '添加优点',
            consLabel: '缺点',
            addCon: '添加缺点',
            save: '保存',
            reset: '恢复默认',
            cancel: '取消',
        },
    };
    const t = labels[language];

    // ── render ────────────────────────────────────────────────────────────────
    return (
        /* Overlay */
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Dimmed background */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-label="Close edit panel"
            />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-illini-blue text-white">
                    <h2 className="font-bold text-lg">{t.title}</h2>
                    <button type="button" onClick={onClose} className="hover:text-gray-300">
                        <X size={20} />
                    </button>
                </div>

                {/* Lang tabs */}
                <div className="flex border-b border-gray-200">
                    {(['en', 'zh'] as LangTab[]).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setLangTab(tab)}
                            className={`flex-1 py-2 text-sm font-medium transition-colors ${langTab === tab
                                ? 'border-b-2 border-illini-orange text-illini-blue'
                                : 'text-gray-500 hover:text-illini-blue'
                                }`}
                        >
                            {tab === 'en' ? t.langEn : t.langZh}
                        </button>
                    ))}
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm">
                    {langTab === 'en' ? (
                        <>
                            <Field label={t.nameLabel}>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={inputCls}
                                />
                            </Field>
                            <Field label={t.descLabel}>
                                <textarea
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className={inputCls}
                                />
                            </Field>
                            <Field label={t.imageLabel}>
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
                                        <span className="sr-only sm:not-sr-only text-xs font-medium">{t.uploadImage}</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                                    </label>
                                </div>
                            </Field>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Field label={t.locationLabel}>
                                        <select value={location} onChange={e => setLocation(e.target.value as any)} className={inputCls}>
                                            <option value="Ikenberry">Ikenberry</option>
                                            <option value="Main Quad">Main Quad</option>
                                            <option value="PAR/FAR">PAR/FAR</option>
                                            <option value="Campustown">Campustown</option>
                                            <option value="South Campus">South Campus</option>
                                        </select>
                                    </Field>
                                </div>
                                <div className="flex-1">
                                    <Field label={t.housingTypeLabel}>
                                        <select value={housingType} onChange={e => setHousingType(e.target.value as any)} className={inputCls}>
                                            <option value="URH">URH</option>
                                            <option value="PCH">PCH</option>
                                        </select>
                                    </Field>
                                </div>
                            </div>
                            <Field label={t.typeLabel}>
                                <select value={type} onChange={e => setType(e.target.value as any)} className={inputCls}>
                                    <option value="Traditional">Traditional</option>
                                    <option value="Cluster">Cluster</option>
                                    <option value="Suite">Suite</option>
                                    <option value="Semi-Suite">Semi-Suite</option>
                                </select>
                            </Field>
                            <Field label={t.roomTypesLabel}>
                                <EditableList items={roomTypes} onChange={setRoomTypes} placeholder="Add room type" />
                            </Field>
                            <Field label={t.tagsLabel}>
                                <EditableList items={tags} onChange={setTags} placeholder="Add tag" />
                            </Field>
                            <Field label={t.priceLabel}>
                                <input
                                    type="number"
                                    min={0}
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className={inputCls}
                                />
                            </Field>

                            <hr className="my-2 border-gray-200" />
                            <Field label={t.floorPlansLabel}>
                                <div className="space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    {floorPlans.map((fp, idx) => (
                                        <div key={idx} className="flex flex-col gap-2 p-3 bg-white border border-gray-200 rounded shadow-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-500">Plan #{idx + 1}</span>
                                                <button type="button" onClick={() => setFloorPlans(floorPlans.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="text" value={fp.type} onChange={e => { const n = [...floorPlans]; n[idx].type = e.target.value as any; setFloorPlans(n); }} placeholder="e.g. 2B1B" className={inputCls} />
                                                <input type="number" value={fp.price} onChange={e => { const n = [...floorPlans]; n[idx].price = Number(e.target.value); setFloorPlans(n); }} placeholder="Price/yr" className={inputCls} />
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="text" value={fp.imageUrl || ''} onChange={e => { const n = [...floorPlans]; n[idx].imageUrl = e.target.value; setFloorPlans(n); }} placeholder="Image URL..." className={inputCls} />
                                                <label className="flex-shrink-0 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-2 cursor-pointer text-gray-700">
                                                    <Upload size={14} />
                                                    <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFloorPlanImageUpload(idx, e.target.files[0]); e.target.value = ''; }} />
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setFloorPlans([...floorPlans, { type: 'Studio', price: 0 }])} className="flex items-center gap-1 text-xs text-illini-blue hover:underline">
                                        <Plus size={12} /> {t.addFloorPlan}
                                    </button>
                                </div>
                            </Field>
                            <Field label={t.galleryLabel}>
                                <EditableList items={galleryImages} onChange={setGalleryImages} placeholder="Add gallery image URL" />
                            </Field>

                            <div className="flex gap-6">
                                <Toggle label={t.acLabel} checked={ac} onChange={setAc} />
                                <Toggle label={t.diningLabel} checked={dining} onChange={setDining} />
                            </div>
                            <Field label={t.prosLabel}>
                                <EditableList items={pros} onChange={setPros} placeholder={t.addPro} />
                            </Field>
                            <Field label={t.consLabel}>
                                <EditableList items={cons} onChange={setCons} placeholder={t.addCon} />
                            </Field>
                        </>
                    ) : (
                        <>
                            <Field label={t.nameLabel}>
                                <input
                                    type="text"
                                    value={nameZh}
                                    onChange={(e) => setNameZh(e.target.value)}
                                    className={inputCls}
                                />
                            </Field>
                            <Field label={t.descLabel}>
                                <textarea
                                    rows={4}
                                    value={descriptionZh}
                                    onChange={(e) => setDescriptionZh(e.target.value)}
                                    className={inputCls}
                                />
                            </Field>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Field label={t.locationLabel}>
                                        <input type="text" value={locationZh} onChange={(e) => setLocationZh(e.target.value)} className={inputCls} placeholder="中文位置..." />
                                    </Field>
                                </div>
                                <div className="flex-1">
                                    <Field label={t.typeLabel}>
                                        <input type="text" value={typeZh} onChange={(e) => setTypeZh(e.target.value)} className={inputCls} placeholder="中文分类..." />
                                    </Field>
                                </div>
                            </div>
                            <Field label={t.prosLabel}>
                                <EditableList items={prosZh} onChange={setProsZh} placeholder={t.addPro} />
                            </Field>
                            <Field label={t.consLabel}>
                                <EditableList items={consZh} onChange={setConsZh} placeholder={t.addCon} />
                            </Field>

                            <hr className="my-2 border-gray-200" />
                            <Field label={t.floorPlansLabel}>
                                <div className="space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    {floorPlans.map((fp, idx) => (
                                        <div key={idx} className="flex flex-col gap-2 p-3 bg-white border border-gray-200 rounded shadow-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-500">户型 #{idx + 1}</span>
                                                <button type="button" onClick={() => setFloorPlans(floorPlans.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="text" value={fp.type} onChange={e => { const n = [...floorPlans]; n[idx].type = e.target.value as any; setFloorPlans(n); }} placeholder="例如: 2B1B" className={inputCls} />
                                                <input type="number" value={fp.price} onChange={e => { const n = [...floorPlans]; n[idx].price = Number(e.target.value); setFloorPlans(n); }} placeholder="价格/年" className={inputCls} />
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="text" value={fp.imageUrl || ''} onChange={e => { const n = [...floorPlans]; n[idx].imageUrl = e.target.value; setFloorPlans(n); }} placeholder="图片链接..." className={inputCls} />
                                                <label className="flex-shrink-0 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-2 cursor-pointer text-gray-700">
                                                    <Upload size={14} />
                                                    <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFloorPlanImageUpload(idx, e.target.files[0]); e.target.value = ''; }} />
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setFloorPlans([...floorPlans, { type: 'Studio', price: 0 }])} className="flex items-center gap-1 text-xs text-illini-blue hover:underline">
                                        <Plus size={12} /> {t.addFloorPlan}
                                    </button>
                                </div>
                            </Field>
                            <Field label={t.galleryLabel}>
                                <EditableList items={galleryImages} onChange={setGalleryImages} placeholder="添加图库照片连结" />
                            </Field>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 space-y-2">
                    {saveMsg && (
                        <p className={`text-xs text-center ${saveMsg.includes('fail') || saveMsg.includes('失败') ? 'text-red-600' : 'text-emerald-700'}`}>
                            {saveMsg}
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 bg-illini-orange hover:bg-illini-orange-dark text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-60"
                    >
                        <Save size={16} />
                        {saving ? (language === 'zh' ? '保存中…' : 'Saving…') : t.save}
                    </button>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={resetting}
                            className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-red-600 py-1.5 border border-gray-300 rounded-lg transition-colors disabled:opacity-60"
                        >
                            <RotateCcw size={12} />
                            {t.reset}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 text-xs text-gray-500 hover:text-gray-700 py-1.5 border border-gray-300 rounded-lg transition-colors"
                        >
                            {t.cancel}
                        </button>
                    </div>
                </div>
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
