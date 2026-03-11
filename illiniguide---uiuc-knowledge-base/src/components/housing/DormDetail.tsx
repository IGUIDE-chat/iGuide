/**
 * @file ./src/components/housing/DormDetail.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
    ArrowLeft, Heart, MapPin, Snowflake, Utensils, Bath,
    ChevronDown, Check, ThumbsUp, SquareDashed, ArrowRightLeft,
    BedSingle, MessageSquare, User, Pencil, X, ExternalLink, Globe,
} from 'lucide-react';
import { formatPrice } from './constants/pricing';
import { TAG_REGISTRY, getHousingTypeMeta, getLocalizedLabel } from './constants/metadata';
import { useSharedDormInteraction } from './store/DormUserInteractionContext';
import { useDormData } from './store/DormDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { dormService } from '../../services/dormService';
import { useDormComments } from './hooks/useDormComments';
import { Dorm, DormTag } from './types/index';
import { Language } from '../../types';
import DormEditPanel from './DormEditPanel';
import ImageLightbox from './ImageLightbox';
import { dormDetailTexts } from './i18n/dormTexts';
import { getRoomOptionLabels, normalizeFloorPlan } from '../../utils/roomOptions';

// ─── Animation variants ────────────────────────────────────────────────────
const pageVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};
const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },
};
const cardHover = { y: -3, scale: 1.02 } as const;
const cardTap = { scale: 0.97 };

/** Detect if text is primarily Chinese (has CJK characters) */
const isChinese = (text: string) => /[\u4e00-\u9fff]/.test(text);
const detectLang = (text: string): 'zh' | 'en' => isChinese(text) ? 'zh' : 'en';

// ─── Props ─────────────────────────────────────────────────────────────────
interface DormDetailProps {
    language?: Language;
}

// ─── Component ─────────────────────────────────────────────────────────────
const DormDetail: React.FC<DormDetailProps> = ({ language = 'en' }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // ── Cross-component state (from Contexts / hooks) ──────────────────────
    const { addToHistory, toggleFavorite, isFavorite } = useSharedDormInteraction();
    const { user, requestLogin } = useAuth();
    const { getDormById: getFromContext, refreshDorms } = useDormData();
    const dormId = id ?? '';
    const { comments, loading: commentsLoading, saveComment, deleteComment, voteOnComment, thumbsUp } =
        useDormComments(dormId);

    // ── Local dorm data ────────────────────────────────────────────────────
    const [dorm, setDorm] = useState<Dorm | undefined>(getFromContext(dormId));

    // ── UI state ───────────────────────────────────────────────────────────
    const [editOpen, setEditOpen] = useState(false);
    const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
    const [compareIds, setCompareIds] = useState<string[]>([]);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [lightbox, setLightbox] = useState<{ images: { src: string; alt?: string; label?: string }[]; index: number } | null>(null);

    // ── Comment form state ─────────────────────────────────────────────────
    const [commentContent, setCommentContent] = useState('');
    const [commentVote, setCommentVote] = useState<1 | -1 | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // ── Translation state ────────────────────────────────────────────────
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [translating, setTranslating] = useState<Record<string, boolean>>({});
    const [translateErrors, setTranslateErrors] = useState<Record<string, boolean>>({});

    const t = dormDetailTexts[language];

    // ── Effects ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;
        const fromCtx = getFromContext(id);
        if (fromCtx) setDorm(fromCtx);
        dormService.getDormById(id).then((d) => { if (d) setDorm(d); });
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (dorm) addToHistory(dorm);
    }, [dorm?.id, addToHistory]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Loading state ──────────────────────────────────────────────────────
    if (!dorm) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-700">{t.dormNotFound}</h2>
                <button type="button" onClick={() => navigate('/dorms')} className="mt-4 text-illini-blue hover:underline">
                    {t.backToDorms}
                </button>
            </div>
        );
    }

    // ── Derived data ───────────────────────────────────────────────────────
    const isSaved = isFavorite(dorm.id);
    const dormName = language === 'zh' && dorm.name_zh ? dorm.name_zh : dorm.name;
    const dormDesc = language === 'zh' && dorm.description_zh ? dorm.description_zh : dorm.description;
    const dormLocation = language === 'zh' && dorm.location_zh ? dorm.location_zh : dorm.location;
    const dormAddress = language === 'zh' && dorm.address_zh ? dorm.address_zh : dorm.address;
    const heroImage = dorm.galleryImages?.[0] ?? dorm.imageUrl;
    const housingMeta = getHousingTypeMeta(dorm.housingType);

    const allTags: DormTag[] = [
        ...(dorm.categorizedTags?.livingConditions ?? []),
        ...(dorm.categorizedTags?.facilities ?? []),
        ...(dorm.categorizedTags?.lifestyle ?? []),
    ];
    const positiveTags = allTags.filter((t) => TAG_REGISTRY[t]?.cardTone === 'positive');
    const neutralTags = allTags.filter((t) => TAG_REGISTRY[t]?.cardTone === 'neutral');
    const mutedTags = allTags.filter((t) => TAG_REGISTRY[t]?.cardTone === 'muted');

    const diningLabel = dorm.dining === 'inside'
        ? (language === 'zh' ? '自带食堂' : 'Dining Hall')
        : dorm.dining === 'nearby'
            ? (language === 'zh' ? '附近食堂' : 'Dining Nearby')
            : (language === 'zh' ? '无食堂' : 'No Dining');
    const bathroomLabel = dorm.bathroomType === 'private' ? t.privateBath
        : dorm.bathroomType === 'semi-private' ? t.semiPrivateBath
            : t.communalBath;

    // Floor plans
    const sortedPlans = (dorm.floorPlans ?? [])
        .map((p) => normalizeFloorPlan(p, p.bathroomScope ?? 'communal'))
        .sort((a, b) => (a.bedCount ?? 99) - (b.bedCount ?? 99) || a.price - b.price);
    const minPrice = sortedPlans.length ? Math.min(...sortedPlans.map((p) => p.price)) : null;
    const maxPrice = sortedPlans.length ? Math.max(...sortedPlans.map((p) => p.price)) : null;
    const getPlanKey = (idx: number, price: number, code?: string) => `${code ?? 'plan'}-${price}-${idx}`;

    // Reviews
    const totalReviews = comments.length;
    const positivePercent = totalReviews > 0 ? Math.round((thumbsUp / totalReviews) * 100) : null;
    const displayedComments = showAllReviews ? comments : comments.slice(0, 3);

    // ── Handlers ───────────────────────────────────────────────────────────
    const toggleCompare = (key: string) =>
        setCompareIds((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

    const handleSubmit = async () => {
        if (!commentContent.trim()) return;
        setSubmitting(true);
        try {
            await saveComment(commentContent.trim(), commentVote);
            setCommentContent('');
            setCommentVote(null);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = (commentId: string) => {
        const msg = language === 'zh' ? '确定要删除这条评论吗？' : 'Delete this comment?';
        if (!window.confirm(msg)) return;
        deleteComment(commentId);
    };

    const handleTranslate = async (commentId: string, text: string) => {
        if (translations[commentId]) {
            // Toggle off
            setTranslations((prev) => { const next = { ...prev }; delete next[commentId]; return next; });
            return;
        }
        setTranslating((prev) => ({ ...prev, [commentId]: true }));
        setTranslateErrors((prev) => { const next = { ...prev }; delete next[commentId]; return next; });
        try {
            const targetLang = language === 'zh' ? 'English' : '中文';
            const res = await fetch('/api/deepseek', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: `You are a translator. Translate the following text to ${targetLang}. Return ONLY the translation, nothing else.` },
                        { role: 'user', content: text },
                    ],
                }),
            });
            if (res.ok) {
                const data = await res.json() as Record<string, unknown>;
                const choices = data.choices as Array<{ message?: { content?: string } }> | undefined;
                const translated = choices?.[0]?.message?.content ?? (data.reply as string) ?? text;
                setTranslations((prev) => ({ ...prev, [commentId]: translated }));
            } else {
                setTranslateErrors((prev) => ({ ...prev, [commentId]: true }));
            }
        } catch {
            setTranslateErrors((prev) => ({ ...prev, [commentId]: true }));
        } finally {
            setTranslating((prev) => ({ ...prev, [commentId]: false }));
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <motion.div
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            className="h-full overflow-y-auto w-full no-scrollbar font-sans text-slate-800 pb-24 bg-slate-50"
            style={{
                marginRight: editOpen ? '32rem' : 0,
                transition: 'margin-right 0.3s ease-in-out',
            }}
        >
            {/* ── Top bar ── */}
            <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="max-w-[1000px] mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate('/dorms')}
                        className="flex items-center gap-1.5 text-slate-500 hover:text-illini-blue transition-colors group py-2"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-[13px] md:text-[14px] font-semibold hidden sm:inline">{t.backToBrowse}</span>
                        <span className="text-[13px] md:text-[14px] font-semibold sm:hidden">{language === 'zh' ? '返回' : 'Back'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                        {user?.isAdmin && (
                            <button
                                type="button"
                                onClick={() => setEditOpen(true)}
                                className="p-2 text-slate-400 hover:text-illini-blue transition-colors rounded-full hover:bg-slate-100/50"
                                aria-label="Edit"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}
                        <motion.button
                            type="button"
                            onClick={async () => { await toggleFavorite(dorm.id, dorm.name, dorm.name_zh); }}
                            aria-label={isSaved ? t.saved : t.save}
                            whileTap={{ scale: 1.35 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                            className="p-2 -mr-1 text-slate-500 hover:text-illini-orange transition-colors rounded-full hover:bg-slate-100/50"
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={isSaved ? 'saved' : 'unsaved'}
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.6, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <Heart className={`w-5 h-5 transition-colors duration-200 ${isSaved ? 'fill-illini-orange text-illini-orange' : ''}`} />
                                </motion.div>
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </div>
            </div>

            <main className="max-w-[1000px] mx-auto px-4 md:px-6 mt-6 md:mt-8">
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8 md:space-y-10">

                    {/* ── Hero Section ── */}
                    <motion.section variants={fadeUp} className="space-y-5 md:space-y-6">
                        {heroImage && (
                            <div
                                className="w-full aspect-[4/3] sm:aspect-video md:aspect-[21/9] rounded-2xl md:rounded-3xl overflow-hidden relative bg-slate-100 border border-white/60 shadow-sm cursor-zoom-in"
                                onClick={() => {
                                    const gallery = (dorm.galleryImages ?? []).map((src, i) => ({ src, alt: `${dormName} ${i + 1}` }));
                                    if (gallery.length === 0 && heroImage) gallery.push({ src: heroImage, alt: dormName });
                                    setLightbox({ images: gallery, index: 0 });
                                }}
                            >
                                <motion.img
                                    src={heroImage}
                                    alt={dormName}
                                    className="w-full h-full object-cover"
                                    initial={{ scale: 1.04 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                />
                                {positivePercent !== null && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5, duration: 0.3 }}
                                        className="absolute top-3 right-3 md:top-4 md:right-4 bg-white/80 backdrop-blur-md px-2.5 py-1 md:px-3 md:py-1.5 rounded-full flex items-center gap-1 md:gap-1.5 shadow-sm border border-white/50"
                                    >
                                        <ThumbsUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-illini-orange fill-illini-orange" />
                                        <span className="text-[12px] md:text-[13px] font-bold text-slate-900">
                                            {positivePercent}{t.positiveRating} ({totalReviews})
                                        </span>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Title & Meta + Hard Facts */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-8">
                            <div className="space-y-3 md:space-y-4 flex-1">
                                <div className="flex items-center flex-wrap gap-2">
                                    <span className="px-3 py-1 text-[11px] md:text-[12px] font-bold text-slate-700 bg-slate-200/60 rounded-full">
                                        {getLocalizedLabel(housingMeta, language)} ({housingMeta.shortLabel})
                                    </span>
                                    <span className="px-3 py-1 text-[11px] md:text-[12px] font-bold text-slate-700 bg-slate-200/60 rounded-full inline-flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {dormLocation}
                                    </span>
                                </div>

                                <h1 className="text-3xl md:text-4xl font-extrabold text-illini-blue tracking-tight">
                                    {dormName}
                                </h1>

                                {dormAddress && (
                                    <div className="flex items-start md:items-center gap-1.5 text-slate-500 text-[13px] md:text-[14px] font-medium">
                                        <MapPin className="w-4 h-4 mt-0.5 md:mt-0 shrink-0" />
                                        <span className="leading-tight">{dormAddress}</span>
                                    </div>
                                )}

                                {positiveTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {positiveTags.map((tag, i) => {
                                            const Icon = TAG_REGISTRY[tag]?.icon;
                                            return (
                                                <motion.span
                                                    key={tag}
                                                    initial={{ opacity: 0, scale: 0.85 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.3 + i * 0.06 }}
                                                    className="inline-flex items-center gap-1 px-3 py-1 text-[12px] md:text-[13px] font-bold text-illini-orange bg-illini-orange/10 rounded-full"
                                                >
                                                    {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />}
                                                    {getLocalizedLabel(TAG_REGISTRY[tag], language)}
                                                </motion.span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Hard Facts cards */}
                            <div className="flex gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0">
                                {/* AC */}
                                <div className={`rounded-2xl p-2 md:p-3 flex flex-col items-center justify-center min-w-[88px] md:min-w-[100px] h-[88px] md:h-[100px] shadow-sm border flex-1 md:flex-none ${dorm.ac ? 'bg-white border-slate-100' : 'bg-amber-50 border-amber-200'
                                    }`}>
                                    {/* Snowflake with strikethrough when no AC */}
                                    <div className="relative mb-1.5">
                                        <Snowflake
                                            className={`w-5 h-5 md:w-6 md:h-6 ${dorm.ac ? 'text-sky-400' : 'text-slate-300'}`}
                                            strokeWidth={1.5}
                                        />
                                        {!dorm.ac && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-[140%] h-[2px] bg-red-400 rotate-45 rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[11px] md:text-[12px] font-bold text-center leading-tight ${dorm.ac ? 'text-slate-700' : 'text-amber-700'}`}>
                                        {dorm.ac ? (language === 'zh' ? '有空调' : 'A/C') : (language === 'zh' ? '无空调' : 'No A/C')}
                                    </span>
                                    {!dorm.ac && (
                                        <span className="mt-1 text-[9px] md:text-[10px] font-semibold text-amber-500 bg-amber-100 px-1.5 py-0.5 rounded-full leading-none">
                                            {language === 'zh' ? '注意' : 'Note'}
                                        </span>
                                    )}
                                </div>

                                {/* Dining */}
                                <div className="bg-white rounded-2xl p-2 md:p-3 flex flex-col items-center justify-center min-w-[88px] md:min-w-[100px] h-[88px] md:h-[100px] shadow-sm border border-slate-100 flex-1 md:flex-none">
                                    <Utensils className="w-5 h-5 md:w-6 md:h-6 text-[#52C41A] mb-1.5 shrink-0" strokeWidth={1.5} />
                                    <span className="text-[11px] md:text-[12px] text-slate-700 font-bold text-center leading-tight">{diningLabel}</span>
                                </div>

                                {/* Bathroom */}
                                <div className="bg-white rounded-2xl p-2 md:p-3 flex flex-col items-center justify-center min-w-[88px] md:min-w-[100px] h-[88px] md:h-[100px] shadow-sm border border-slate-100 flex-1 md:flex-none">
                                    <Bath className="w-5 h-5 md:w-6 md:h-6 text-[#1890FF] mb-1.5 shrink-0" strokeWidth={1.5} />
                                    <span className="text-[11px] md:text-[12px] text-slate-700 font-bold text-center leading-tight">{bathroomLabel}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description + website link */}
                        <div className="space-y-3 pt-2">
                            <p className="text-slate-600 text-[14px] md:text-[15px] leading-relaxed max-w-4xl font-medium">
                                {dormDesc}
                            </p>
                            {(dorm.website || dorm.housingType === 'URH') && (
                                <a
                                    href={dorm.website || 'https://housing.illinois.edu/'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] md:text-[12px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors w-fit"
                                >
                                    <span>{t.viewWebsite}</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </motion.section>

                    {/* ── Amenities ── */}
                    {(neutralTags.length > 0 || mutedTags.length > 0) && (
                        <motion.section variants={fadeUp} className="space-y-3 md:space-y-4">
                            <h3 className="text-[16px] md:text-[18px] font-bold text-slate-900">{t.amenities}</h3>
                            <div className="flex flex-wrap gap-2 md:gap-2.5">
                                {neutralTags.map((tag, i) => {
                                    const Icon = TAG_REGISTRY[tag]?.icon;
                                    return (
                                        <motion.div
                                            key={tag}
                                            initial={{ opacity: 0, scale: 0.88 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.05 * i }}
                                            whileHover={{ y: -2, scale: 1.04 }}
                                            className="px-2.5 py-1 md:px-3 md:py-1.5 bg-white/80 backdrop-blur-md border border-white/60 rounded-lg md:rounded-xl flex items-center gap-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-default"
                                        >
                                            {Icon && <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500" strokeWidth={1.5} />}
                                            <span className="text-[12px] md:text-[13px] text-slate-700 font-semibold">
                                                {getLocalizedLabel(TAG_REGISTRY[tag], language)}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                                {mutedTags.map((tag, i) => {
                                    const Icon = TAG_REGISTRY[tag]?.icon;
                                    return (
                                        <motion.div
                                            key={tag}
                                            initial={{ opacity: 0, scale: 0.88 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.05 * (neutralTags.length + i) }}
                                            whileHover={{ y: -2, scale: 1.04 }}
                                            className="px-2.5 py-1 md:px-3 md:py-1.5 bg-slate-100/50 border border-slate-200/50 rounded-lg md:rounded-xl flex items-center gap-1.5 cursor-default"
                                        >
                                            {Icon && <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" strokeWidth={1.5} />}
                                            <span className="text-[12px] md:text-[13px] text-slate-500 font-semibold">
                                                {getLocalizedLabel(TAG_REGISTRY[tag], language)}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.section>
                    )}

                    {/* ── Floor Plans & Pricing ── */}
                    {sortedPlans.length > 0 && (
                        <motion.section variants={fadeUp} className="space-y-3 md:space-y-4 pt-2">
                            <div className="flex items-end justify-between mb-4 md:mb-6">
                                <div className="space-y-1 md:space-y-1.5">
                                    <h3 className="text-[16px] md:text-[18px] font-bold text-slate-900">
                                        {language === 'zh' ? '户型图与价格' : 'Floor Plans & Pricing'}
                                    </h3>
                                    <p className="text-slate-500 text-[12px] md:text-[13px] font-medium">{t.floorPlansDesc}</p>
                                </div>
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-white/80 backdrop-blur-md border border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-xl text-[12px] md:text-[13px] font-bold text-illini-blue hover:bg-white hover:shadow-[0_4px_15px_rgba(0,0,0,0.04)] transition-all"
                                >
                                    <ArrowRightLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    {t.comparePlans}
                                </motion.button>
                            </div>

                            <div className="space-y-3">
                                {sortedPlans.map((plan, idx) => {
                                    const option = {
                                        bedCount: plan.bedCount ?? null,
                                        bathroomCount: plan.bathroomCount ?? null,
                                        bathroomScope: plan.bathroomScope ?? ('communal' as const),
                                        labelCode: plan.labelCode,
                                    };
                                    const labels = getRoomOptionLabels(option, language);
                                    const planKey = getPlanKey(idx, plan.price, plan.labelCode);
                                    const isExpanded = expandedPlanId === planKey;
                                    const isCompared = compareIds.includes(planKey);
                                    const planDisplayTitle = plan.officialName || labels.primaryLabel;
                                    const normalizedSummary = plan.officialName && plan.officialName !== labels.primaryLabel
                                        ? [labels.primaryLabel, labels.secondaryLabel].filter(Boolean).join(' · ')
                                        : labels.secondaryLabel;
                                    // Multi-image arrays (fallback to legacy single fields)
                                    const photos = plan.photoUrls?.length ? plan.photoUrls : plan.photoUrl ? [plan.photoUrl] : [];
                                    const layouts = plan.imageUrls?.length ? plan.imageUrls : plan.imageUrl ? [plan.imageUrl] : [];
                                    const thumbSrc = photos[0] || layouts[0];
                                    const layoutSrc = layouts[0];
                                    const hasThumb = Boolean(thumbSrc) && !imageErrors[`${planKey}-thumb`];
                                    const hasLayout = Boolean(layoutSrc) && !imageErrors[`${planKey}-layout`];
                                    // Collect all available images for this plan's lightbox
                                    const planImages: { src: string; alt?: string; label?: string }[] = [];
                                    photos.forEach((src, i) => planImages.push({ src, alt: labels.primaryLabel, label: `${language === 'zh' ? '展示图' : 'Photo'}${photos.length > 1 ? ` ${i + 1}` : ''}` }));
                                    layouts.forEach((src, i) => planImages.push({ src, alt: labels.primaryLabel, label: `${language === 'zh' ? '户型图' : 'Floor Plan'}${layouts.length > 1 ? ` ${i + 1}` : ''}` }));

                                    return (
                                        <motion.div
                                            key={planKey}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.07, duration: 0.35 }}
                                            onClick={() => setExpandedPlanId(isExpanded ? null : planKey)}
                                            className="group bg-white rounded-xl md:rounded-2xl border border-slate-100 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-[box-shadow] duration-150 cursor-pointer overflow-hidden shadow-sm"
                                        >
                                            <div className="p-3 md:p-5 flex flex-row items-center md:items-start gap-4 md:gap-6">
                                                {/* Thumbnail (展示图 > 户型图 > placeholder) */}
                                                <div
                                                    className="w-20 h-20 md:w-36 md:h-28 shrink-0 bg-slate-50 rounded-lg md:rounded-xl overflow-hidden border border-slate-200/60 relative group-hover:border-slate-300 transition-colors"
                                                    onClick={(e) => { if (planImages.length > 0) { e.stopPropagation(); setLightbox({ images: planImages, index: 0 }); } }}
                                                >
                                                    {hasThumb ? (
                                                        <img
                                                            src={thumbSrc}
                                                            alt={planDisplayTitle}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                            onError={() => setImageErrors((prev) => ({ ...prev, [`${planKey}-thumb`]: true }))}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <SquareDashed className="w-8 h-8" strokeWidth={1} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 flex flex-col md:flex-row justify-between gap-1 md:gap-0 min-w-0 md:h-28">
                                                    {/* Left */}
                                                    <div className="flex flex-col justify-center gap-1.5 md:gap-3 min-w-0 h-full py-0.5">
                                                        <div className="flex items-center justify-between md:justify-start w-full gap-2">
                                                            <div className="flex items-center flex-wrap gap-1.5 md:gap-3 min-w-0">
                                                                <h4 className="text-[15px] md:text-[18px] font-extrabold text-slate-900 truncate">
                                                                    {planDisplayTitle}
                                                                </h4>
                                                                {normalizedSummary && (
                                                                    <span className="text-[12px] md:text-[14px] text-slate-500 font-medium">
                                                                        {normalizedSummary}
                                                                    </span>
                                                                )}
                                                                {plan.available !== false && (
                                                                    <span className="flex items-center gap-0.5 md:gap-1 px-1.5 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-[13px] text-[#059669] bg-[#ECFDF5] border border-[#D1FAE5] rounded-md md:rounded-xl font-bold whitespace-nowrap">
                                                                        <Check className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" strokeWidth={3} />
                                                                        {t.available}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {/* Mobile chevron */}
                                                            <motion.div
                                                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                                                transition={{ duration: 0.25 }}
                                                                className="md:hidden flex items-center justify-center text-slate-400 shrink-0 -mr-1"
                                                            >
                                                                <ChevronDown className="w-5 h-5" />
                                                            </motion.div>
                                                        </div>

                                                        {/* Specs */}
                                                        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 md:gap-4 text-slate-600 mt-1 md:mt-0">
                                                            {plan.bedCount != null && (
                                                                <>
                                                                    <div className="flex items-center gap-1 md:gap-1.5">
                                                                        <BedSingle className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                                                                        <span className="text-[12px] md:text-[14px] font-semibold">
                                                                            {plan.bedSize
                                                                                ? plan.bedSize
                                                                                : `${plan.bedCount} ${language === 'zh' ? '张床' : plan.bedCount === 1 ? 'Bed' : 'Beds'}`}
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-slate-300" />
                                                                </>
                                                            )}
                                                            <div className="flex items-center gap-1 md:gap-1.5">
                                                                <Bath className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                                                                <span className="text-[12px] md:text-[14px] font-semibold">
                                                                    {plan.bathroomCount != null && plan.bathroomCount > 0
                                                                        ? `${plan.bathroomCount} ${language === 'zh' ? '卫' : plan.bathroomCount === 1 ? 'Bath' : 'Baths'}`
                                                                        : bathroomLabel}
                                                                </span>
                                                            </div>
                                                            {plan.sqft && (
                                                                <>
                                                                    <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-slate-300" />
                                                                    <div className="flex items-center gap-1 md:gap-1.5">
                                                                        <SquareDashed className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                                                                        <span className="text-[12px] md:text-[14px] font-semibold tabular-nums">
                                                                            {plan.sqft} {t.sqft || (language === 'zh' ? '平方英尺' : 'sqft')}
                                                                            <span className="text-slate-400 font-medium ml-1">
                                                                                (~{Math.round(plan.sqft * 0.092903)}㎡)
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Mobile price */}
                                                        <div className="flex md:hidden items-baseline gap-1 mt-0.5">
                                                            <span className="text-[16px] font-extrabold text-slate-900 tabular-nums tracking-tight">
                                                                {formatPrice(plan.price)}
                                                            </span>
                                                            <span className="text-[11px] text-slate-500 font-medium">{t.yr}</span>
                                                            <span className="text-[11px] text-slate-400 ml-1 font-medium tabular-nums">
                                                                (~{formatPrice(Math.round(plan.price / 12))}{t.mo})
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Right: desktop price + actions */}
                                                    <div className="hidden md:flex flex-col items-end justify-between gap-2 h-full py-0.5 shrink-0">
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex items-baseline gap-0.5">
                                                                <span className="text-[24px] font-extrabold text-slate-900 tabular-nums tracking-tight">
                                                                    {formatPrice(plan.price)}
                                                                </span>
                                                                <span className="text-[13px] text-slate-500 font-medium">{t.yr}</span>
                                                            </div>
                                                            <div className="inline-flex items-center px-1.5 py-0.5 mt-1 rounded-md bg-slate-100 text-[12px] text-slate-500 font-medium tabular-nums">
                                                                ~{formatPrice(Math.round(plan.price / 12))}{t.mo}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <motion.button
                                                                type="button"
                                                                whileHover={{ scale: 1.04 }}
                                                                whileTap={{ scale: 0.96 }}
                                                                onClick={(e) => { e.stopPropagation(); toggleCompare(planKey); }}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-colors ${isCompared
                                                                    ? 'bg-illini-blue/5 text-illini-blue border-illini-blue/30'
                                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                                                                    }`}
                                                            >
                                                                <div className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center transition-colors ${isCompared ? 'bg-illini-blue border-illini-blue text-white' : 'border-slate-300'}`}>
                                                                    <AnimatePresence>
                                                                        {isCompared && (
                                                                            <motion.div
                                                                                initial={{ scale: 0 }}
                                                                                animate={{ scale: 1 }}
                                                                                exit={{ scale: 0 }}
                                                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                                            >
                                                                                <Check className="w-2.5 h-2.5" strokeWidth={3} />
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                                {t.compareAdd}
                                                            </motion.button>
                                                            <motion.div
                                                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                                                transition={{ duration: 0.25 }}
                                                                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors"
                                                            >
                                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                                            </motion.div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded */}
                                            <AnimatePresence initial={false}>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="p-4 md:p-5 pt-0 border-t border-slate-100/50 mx-4 md:mx-5 mt-2">
                                                            {hasLayout ? (
                                                                <img
                                                                    src={layoutSrc}
                                                                    alt={`${labels.primaryLabel} floor plan`}
                                                                    className="w-full h-auto rounded-xl border border-slate-200/50 bg-slate-50 mt-3 md:mt-4 cursor-zoom-in hover:opacity-90 transition-opacity"
                                                                    onClick={(e) => { e.stopPropagation(); setLightbox({ images: planImages, index: planImages.findIndex((img) => img.src === layoutSrc) }); }}
                                                                    onError={() => setImageErrors((prev) => ({ ...prev, [`${planKey}-layout`]: true }))}
                                                                />
                                                            ) : (
                                                                <div className="bg-slate-50/50 rounded-xl p-6 md:p-8 flex items-center justify-center text-slate-400 border border-slate-200/50 border-dashed mt-3 md:mt-4 font-medium text-[13px] md:text-[14px]">
                                                                    {language === 'zh' ? '暂无户型图' : 'Floor plan image unavailable'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Price range footer */}
                            {minPrice !== null && maxPrice !== null && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-white/60 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-5 flex items-center justify-between border border-white/50 mt-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                                >
                                    <span className="text-slate-600 text-[13px] md:text-[14px] font-semibold">{t.priceRange}</span>
                                    <span className="text-[16px] md:text-[18px] font-extrabold text-slate-900">
                                        {formatPrice(minPrice)}{minPrice !== maxPrice ? ` – ${formatPrice(maxPrice)}` : ''}
                                    </span>
                                </motion.div>
                            )}
                        </motion.section>
                    )}

                    {/* ── Reviews ── */}
                    <motion.section variants={fadeUp} className="space-y-4 pt-6 pb-8 border-t border-slate-200/50">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[16px] md:text-[18px] font-bold text-slate-900">{t.ratingsAndReviews}</h3>
                            {totalReviews > 0 && (
                                <span className="text-[12px] md:text-[13px] text-slate-500 font-medium">
                                    {totalReviews} {language === 'zh' ? '条评价' : 'Reviews'}
                                    {positivePercent !== null && ` · ${positivePercent}${t.positiveRating}`}
                                </span>
                            )}
                        </div>

                        {/* Login prompt / form */}
                        {!user ? (
                            <motion.div
                                whileHover={{ scale: 1.005 }}
                                className="bg-white/60 backdrop-blur-md rounded-xl md:rounded-2xl p-5 md:p-6 border border-illini-blue/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                            >
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-illini-blue/5 flex items-center justify-center shrink-0">
                                        <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-illini-blue" />
                                    </div>
                                    <div>
                                        <h4 className="text-[14px] md:text-[15px] font-bold text-slate-900">{t.shareExp}</h4>
                                        <p className="text-[12px] md:text-[13px] text-slate-500 mt-0.5 font-medium">{t.loginPrompt}</p>
                                    </div>
                                </div>
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => requestLogin()}
                                    className="w-full sm:w-auto px-5 py-2.5 bg-illini-blue hover:bg-illini-blue/90 text-white text-[13px] md:text-[14px] font-bold rounded-xl transition-colors shadow-sm"
                                >
                                    {t.loginBtn}
                                </motion.button>
                            </motion.div>
                        ) : (
                            <div className="bg-white/80 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                <h4 className="text-[14px] md:text-[15px] font-bold text-slate-900 mb-3">{t.shareExp}</h4>
                                <div className="flex gap-2 mb-3">
                                    {([1, -1] as const).map((vote) => (
                                        <motion.button
                                            key={vote}
                                            type="button"
                                            whileHover={{ scale: 1.04 }}
                                            whileTap={{ scale: 0.94 }}
                                            onClick={() => setCommentVote(commentVote === vote ? null : vote)}
                                            className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${commentVote === vote && vote === 1
                                                ? 'bg-illini-orange/10 border-illini-orange/30 text-illini-orange'
                                                : commentVote === vote && vote === -1
                                                    ? 'bg-red-50 border-red-200 text-red-600'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                                }`}
                                        >
                                            <ThumbsUp className={`w-3.5 h-3.5 ${vote === -1 ? 'rotate-180' : ''} ${commentVote === vote && vote === 1 ? 'fill-illini-orange/20' : ''}`} />
                                            {vote === 1 ? t.thumbsUpDorm : t.thumbsDownDorm}
                                        </motion.button>
                                    ))}
                                </div>
                                <textarea
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    placeholder={t.leaveComment}
                                    rows={3}
                                    className="w-full text-[13px] md:text-[14px] border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-illini-blue/40 placeholder-slate-400 font-medium bg-white/50 transition-colors"
                                />
                                <div className="flex justify-end mt-2.5">
                                    <motion.button
                                        type="button"
                                        disabled={submitting || !commentContent.trim()}
                                        onClick={handleSubmit}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="text-[13px] md:text-[14px] font-bold text-white bg-illini-blue px-5 py-2 rounded-xl disabled:opacity-40 hover:bg-illini-blue/90 transition-colors"
                                    >
                                        {submitting ? '...' : t.submitComment}
                                    </motion.button>
                                </div>
                            </div>
                        )}

                        {/* Comment list */}
                        {commentsLoading ? (
                            <div className="text-center text-[13px] text-slate-400 py-6">
                                {language === 'zh' ? '加载中...' : 'Loading...'}
                            </div>
                        ) : comments.length === 0 ? (
                            <p className="text-[13px] text-slate-400 text-center py-6">{t.noComments}</p>
                        ) : (
                            <>
                                <div className="space-y-3 mt-4">
                                    <AnimatePresence>
                                        {displayedComments.map((comment, i) => (
                                            <motion.div
                                                key={comment.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                transition={{ delay: i * 0.05, duration: 0.3 }}
                                                className="bg-white/80 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                                            <User className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <div className="text-[13px] md:text-[14px] font-bold text-slate-900 leading-tight">
                                                                {comment.display_name}
                                                            </div>
                                                            <div className="text-[11px] md:text-[12px] text-slate-500 mt-0.5 font-medium">
                                                                {new Date(comment.created_at).toLocaleDateString(
                                                                    language === 'zh' ? 'zh-CN' : 'en-US',
                                                                    { year: 'numeric', month: 'short' }
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {comment.dorm_vote === 1 && (
                                                            <div className="flex items-center gap-1 px-2 py-1 bg-illini-orange/10 rounded-lg">
                                                                <ThumbsUp className="w-3 h-3 text-illini-orange fill-illini-orange" />
                                                                <span className="text-[11px] font-bold text-illini-orange">{t.recommended}</span>
                                                            </div>
                                                        )}
                                                        {user && comment.user_id === user.id && (
                                                            <motion.button
                                                                type="button"
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                                className="text-slate-300 hover:text-red-400 transition-colors p-1"
                                                                aria-label={t.deleteComment}
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </motion.button>
                                                        )}
                                                    </div>
                                                </div>
                                                {translations[comment.id] ? (
                                                    <>
                                                        <p className="text-[13px] md:text-[14px] text-slate-600 leading-relaxed font-medium">
                                                            {translations[comment.id]}
                                                        </p>
                                                        <p className="text-[12px] text-slate-400 leading-relaxed mt-1.5 pl-3 border-l-2 border-slate-200">
                                                            {comment.content}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <p className="text-[13px] md:text-[14px] text-slate-600 leading-relaxed font-medium">
                                                        {comment.content}
                                                    </p>
                                                )}
                                                {translateErrors[comment.id] && (
                                                    <p className="text-[12px] text-red-400 mt-1">
                                                        {language === 'zh' ? '翻译失败，点击重试' : 'Translation failed, click to retry'}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100/50">
                                                    <motion.button
                                                        type="button"
                                                        whileTap={{ scale: 0.88 }}
                                                        onClick={() => voteOnComment(comment.id, comment.myVote === 1 ? null : 1)}
                                                        className={`flex items-center gap-1.5 transition-colors group ${comment.myVote === 1 ? 'text-illini-orange' : 'text-slate-400 hover:text-illini-orange'
                                                            }`}
                                                    >
                                                        <ThumbsUp className={`w-3.5 h-3.5 ${comment.myVote === 1 ? 'fill-illini-orange/20' : 'group-hover:fill-illini-orange/20'}`} />
                                                        <span className="text-[12px] font-semibold">
                                                            {t.helpful}{comment.upvotes > 0 ? ` (${comment.upvotes})` : ''}
                                                        </span>
                                                    </motion.button>
                                                    {detectLang(comment.content) !== language && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTranslate(comment.id, comment.content)}
                                                            disabled={translating[comment.id]}
                                                            className="flex items-center gap-1 text-[12px] font-semibold text-slate-400 hover:text-illini-blue transition-colors disabled:opacity-50"
                                                        >
                                                            <Globe className="w-3.5 h-3.5" />
                                                            {translating[comment.id]
                                                                ? (language === 'zh' ? '翻译中...' : 'Translating...')
                                                                : translations[comment.id]
                                                                    ? (language === 'zh' ? '显示原文' : 'Original')
                                                                    : (language === 'zh' ? '翻译' : 'Translate')}
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {comments.length > 3 && (
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowAllReviews(!showAllReviews)}
                                        className="w-full py-3 text-[13px] md:text-[14px] font-semibold text-slate-500 hover:text-slate-800 bg-white/40 hover:bg-white/60 backdrop-blur-md rounded-xl transition-colors border border-white/50"
                                    >
                                        {showAllReviews
                                            ? (language === 'zh' ? '收起' : 'Show less')
                                            : `${t.viewAllReviews} (${comments.length})`}
                                    </motion.button>
                                )}
                            </>
                        )}
                    </motion.section>

                </motion.div>
            </main>

            {/* Image lightbox */}
            <AnimatePresence>
                {lightbox && (
                    <ImageLightbox
                        images={lightbox.images}
                        initialIndex={Math.max(lightbox.index, 0)}
                        onClose={() => setLightbox(null)}
                    />
                )}
            </AnimatePresence>

            {/* Admin edit panel */}
            {editOpen && (
                <DormEditPanel
                    dorm={dorm}
                    language={language}
                    onClose={() => setEditOpen(false)}
                    onSaved={(updated) => { setDorm(updated); setEditOpen(false); void refreshDorms(); }}
                />
            )}

            {/* Admin edit button */}
            {user?.isAdmin && (
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditOpen(true)}
                    className="fixed bottom-20 right-6 z-50 flex items-center gap-2 bg-illini-blue text-white text-[13px] font-bold px-4 py-2.5 rounded-full shadow-lg hover:bg-illini-blue/90 transition-colors"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    {language === 'zh' ? '编辑' : 'Edit'}
                </motion.button>
            )}
        </motion.div>
    );
};

export default DormDetail;
