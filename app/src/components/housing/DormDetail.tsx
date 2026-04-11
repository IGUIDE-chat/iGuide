/**
 * @file ./src/components/housing/DormDetail.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Snowflake,
  Utensils,
  Bath,
  ChevronDown,
  Check,
  ThumbsUp,
  SquareDashed,
  ArrowRightLeft,
  BedSingle,
  MessageSquare,
  User,
  Pencil,
  X,
  ExternalLink,
  Globe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatPrice } from "./constants/pricing";
import {
  TAG_REGISTRY,
  getHousingTypeMeta,
  getLocalizedLabel,
} from "./constants/metadata";
import { useSharedDormInteraction } from "./store/DormUserInteractionContext";
import { useDormData } from "./store/DormDataContext";
import { useAuth } from "../../contexts/AuthContext";
import { dormService } from "../../services/dormService";
import { useDormComments } from "./hooks/useDormComments";
import { Dorm, DormTag, FloorPlan } from "./types/index";
import { Language } from "../../types";
import DormEditPanel from "./DormEditPanel";
import ImageLightbox from "./ImageLightbox";
import { dormDetailTexts } from "./i18n/dormTexts";
import {
  getBathroomScopeLabel,
  getDormBathroomSummary,
  getRoomOptionLabels,
  getStorageBathroomScope,
  normalizeFloorPlan,
} from "../../utils/roomOptions";
import { getDetailTagDisplay } from "../../utils/tagLabels";
import { useLayout } from "../../contexts/LayoutContext";

// ─── Animation variants ────────────────────────────────────────────────────
const pageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};
const _cardHover = { y: -3, scale: 1.02 } as const;
const _cardTap = { scale: 0.97 };

/** Detect if text is primarily Chinese (has CJK characters) */
const isChinese = (text: string) => /[\u4e00-\u9fff]/.test(text);
const detectLang = (text: string): "zh" | "en" =>
  isChinese(text) ? "zh" : "en";
const hasPublishedPlanPrice = (price: FloorPlan["price"]): price is number =>
  typeof price === "number" && Number.isFinite(price) && price > 0;
const getPublishedPlanPrice = (plan: FloorPlan) =>
  hasPublishedPlanPrice(plan.price) ? plan.price : null;
const getPlanKey = (plan: FloorPlan, idx: number) =>
  [
    plan.labelCode ?? "plan",
    plan.officialName ?? "unnamed",
    plan.bedCount ?? "na",
    plan.bathroomCount ?? "na",
    idx,
  ].join(":");

// ─── Props ─────────────────────────────────────────────────────────────────
interface DormDetailProps {
  language?: Language;
}

interface InlineImageNavButtonProps {
  direction: "prev" | "next";
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

const InlineImageNavButton: React.FC<InlineImageNavButtonProps> = ({
  direction,
  label,
  onClick,
  className = "",
}) => {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`
        absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center
        justify-center rounded-full bg-black/35 text-white backdrop-blur-sm
        transition-colors
        hover:bg-black/55
        ${className}
      `}
    >
      <Icon className="size-5" />
    </button>
  );
};

// ─── Component ─────────────────────────────────────────────────────────────
const DormDetail: React.FC<DormDetailProps> = ({ language = "en" }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Cross-component state (from Contexts / hooks) ──────────────────────
  const { addToHistory, toggleFavorite, isFavorite } =
    useSharedDormInteraction();
  const { user, requestLogin } = useAuth();
  const { getDormById: getFromContext, refreshDorms } = useDormData();
  const { setMobileHeaderSlot } = useLayout();
  const dormId = id ?? "";
  const {
    comments,
    loading: commentsLoading,
    saveComment,
    deleteComment,
    voteOnComment,
    thumbsUp,
  } = useDormComments(dormId);

  // ── Review stats (computed early for mobile header) ───────────────────
  const totalReviews = comments.length;
  const positivePercent =
    totalReviews > 0 ? Math.round((thumbsUp / totalReviews) * 100) : null;

  // ── Local dorm data ────────────────────────────────────────────────────
  const [dorm, setDorm] = useState<Dorm | undefined>(getFromContext(dormId));

  // ── UI state ───────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showPlanCompare, setShowPlanCompare] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [planImageIndices, setPlanImageIndices] = useState<
    Record<string, number>
  >({});
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [lightbox, setLightbox] = useState<{
    images: { src: string; alt?: string; label?: string }[];
    index: number;
  } | null>(null);

  // ── Comment form state ─────────────────────────────────────────────────
  const [commentContent, setCommentContent] = useState("");
  const [commentVote, setCommentVote] = useState<1 | -1 | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Translation state ────────────────────────────────────────────────
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [translateErrors, setTranslateErrors] = useState<
    Record<string, boolean>
  >({});

  const t = dormDetailTexts[language];

  // ── Effects ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const fromCtx = getFromContext(id);
    if (fromCtx) setDorm(fromCtx);
    dormService.getDormById(id).then((d) => {
      if (d) setDorm(d);
    });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (dorm) addToHistory(dorm);
  }, [dorm?.id, addToHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setHeroImageIndex(0);
    setPlanImageIndices({});
  }, [dorm?.id]);

  // Scroll to reviews section when navigated with #reviews hash
  useEffect(() => {
    if (location.hash === "#reviews" && dorm) {
      const el = document.getElementById("reviews");
      if (el) {
        setTimeout(
          () => el.scrollIntoView({ behavior: "smooth", block: "start" }),
          300
        );
      }
    }
  }, [location.hash, dorm?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mobile header slot: back + favorite in the AppShell header bar ────
  useEffect(() => {
    if (!dorm) {
      setMobileHeaderSlot(null);
      return () => {
        setMobileHeaderSlot(null);
      };
    }
    setMobileHeaderSlot(
      <div className="flex min-w-0 flex-1 items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/dorms")}
          className="
            flex shrink-0 items-center gap-1 text-slate-500 transition-colors
            hover:text-illini-blue
          "
        >
          <ArrowLeft className="size-4" />
          <span className="text-[13px] font-semibold">
            {language === "zh" ? "返回" : "Back"}
          </span>
        </button>
        <div className="flex-1" />
        <div className="flex shrink-0 items-center gap-1">
          {user?.isAdmin && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="
                rounded-full p-1.5 text-slate-400 transition-colors
                hover:text-illini-blue
              "
              aria-label="Edit"
            >
              <Pencil className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              toggleFavorite(dorm.id, dorm.name, dorm.name_zh);
            }}
            className="
              rounded-full p-1.5 text-slate-400 transition-colors
              hover:text-illini-orange
            "
          >
            <Heart
              className={`
                size-5 transition-colors duration-200
                ${isFavorite(dorm.id) ? `fill-illini-orange text-illini-orange` : ""}
              `}
            />
          </button>
        </div>
      </div>
    );
    return () => {
      setMobileHeaderSlot(null);
    };
  }, [
    dorm,
    language,
    user?.isAdmin,
    navigate,
    toggleFavorite,
    isFavorite,
    setMobileHeaderSlot,
  ]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (!dorm) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-700">{t.dormNotFound}</h2>
        <button
          type="button"
          onClick={() => navigate("/dorms")}
          className="
            mt-4 text-illini-blue
            hover:underline
          "
        >
          {t.backToDorms}
        </button>
      </div>
    );
  }

  // ── Derived data ───────────────────────────────────────────────────────
  const isSaved = isFavorite(dorm.id);
  const dormName = language === "zh" && dorm.name_zh ? dorm.name_zh : dorm.name;
  const dormDesc =
    language === "zh" && dorm.description_zh
      ? dorm.description_zh
      : dorm.description;
  const dormLocation =
    language === "zh" && dorm.location_zh ? dorm.location_zh : dorm.location;
  const dormAddress =
    language === "zh" && dorm.address_zh ? dorm.address_zh : dorm.address;
  const heroImages = (
    dorm.galleryImages?.length ? dorm.galleryImages : [dorm.imageUrl]
  ).filter((src): src is string => Boolean(src));
  const safeHeroImageIndex =
    heroImages.length > 0 ? Math.min(heroImageIndex, heroImages.length - 1) : 0;
  const heroImage = heroImages[safeHeroImageIndex];
  const housingMeta = getHousingTypeMeta(dorm.housingType);

  const allTags: DormTag[] = [
    ...(dorm.categorizedTags?.livingConditions ?? []),
    ...(dorm.categorizedTags?.facilities ?? []),
    ...(dorm.categorizedTags?.lifestyle ?? []),
  ];
  const positiveTags = allTags.filter(
    (t) => TAG_REGISTRY[t]?.cardTone === "positive"
  );
  const neutralTags = allTags.filter(
    (t) => TAG_REGISTRY[t]?.cardTone === "neutral"
  );
  const mutedTags = allTags.filter(
    (t) => TAG_REGISTRY[t]?.cardTone === "muted"
  );

  const diningLabel =
    dorm.dining === "inside"
      ? language === "zh"
        ? "自带食堂"
        : "Dining Hall"
      : dorm.dining === "nearby"
        ? language === "zh"
          ? "附近食堂"
          : "Dining Nearby"
        : language === "zh"
          ? "无食堂"
          : "No Dining";
  const bathroomLabel = getDormBathroomSummary(dorm, language);
  const defaultPlanScope = getStorageBathroomScope(
    dorm.bathroomType,
    dorm.floorPlans
  );

  // Floor plans
  const sortedPlans = (dorm.floorPlans ?? [])
    .map((p) => normalizeFloorPlan(p, p.bathroomScope ?? defaultPlanScope))
    .sort((a, b) => {
      const bedDelta = (a.bedCount ?? 99) - (b.bedCount ?? 99);
      if (bedDelta !== 0) return bedDelta;

      const priceDelta =
        (getPublishedPlanPrice(a) ?? Number.POSITIVE_INFINITY) -
        (getPublishedPlanPrice(b) ?? Number.POSITIVE_INFINITY);
      if (priceDelta !== 0) return priceDelta;

      return (a.officialName ?? a.labelCode ?? "").localeCompare(
        b.officialName ?? b.labelCode ?? ""
      );
    });
  const pricedPlans = sortedPlans.filter(
    (plan) => getPublishedPlanPrice(plan) != null
  );
  const minPrice = pricedPlans.length
    ? Math.min(
        ...pricedPlans.map((plan) => getPublishedPlanPrice(plan) as number)
      )
    : null;
  const maxPrice = pricedPlans.length
    ? Math.max(
        ...pricedPlans.map((plan) => getPublishedPlanPrice(plan) as number)
      )
    : null;

  // Reviews
  const displayedComments = showAllReviews ? comments : comments.slice(0, 3);

  // ── Handlers ───────────────────────────────────────────────────────────
  const toggleCompare = (key: string) =>
    setCompareIds((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const handleSubmit = async () => {
    if (!commentContent.trim()) return;
    setSubmitting(true);
    try {
      await saveComment(commentContent.trim(), commentVote);
      setCommentContent("");
      setCommentVote(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    const msg =
      language === "zh" ? "确定要删除这条评论吗？" : "Delete this comment?";
    if (!window.confirm(msg)) return;
    deleteComment(commentId);
  };

  const handleTranslate = async (commentId: string, text: string) => {
    if (translations[commentId]) {
      // Toggle off
      setTranslations((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
      return;
    }
    setTranslating((prev) => ({ ...prev, [commentId]: true }));
    setTranslateErrors((prev) => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });
    try {
      const targetLang = language === "zh" ? "English" : "中文";
      const res = await fetch("/api/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a translator. Translate the following text to ${targetLang}. Return ONLY the translation, nothing else.`,
            },
            { role: "user", content: text },
          ],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>;
        const choices = data.choices as
          | Array<{ message?: { content?: string } }>
          | undefined;
        const translated =
          choices?.[0]?.message?.content ?? (data.reply as string) ?? text;
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
      className="
        no-scrollbar size-full overflow-y-auto bg-slate-50 pb-24 font-sans
        text-slate-800
      "
      style={{
        marginRight: editOpen ? "32rem" : 0,
        transition: "margin-right 0.3s ease-in-out",
      }}
    >
      {/* ── Top bar (desktop: sticky bar; mobile: overlay on hero) ── */}
      <div
        className="
          sticky top-0 z-40 hidden border-b border-white/50 bg-white/70
          shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-xl
          md:block
        "
      >
        <div
          className="
            mx-auto flex h-14 max-w-[1000px] items-center justify-between px-6
          "
        >
          <button
            type="button"
            onClick={() => navigate("/dorms")}
            className="
              group flex items-center gap-1.5 py-2 text-slate-500
              transition-colors
              hover:text-illini-blue
            "
          >
            <ArrowLeft
              className="
                size-4 transition-transform
                group-hover:-translate-x-0.5
              "
            />
            <span className="text-[14px] font-semibold">{t.backToBrowse}</span>
          </button>

          <div className="flex items-center gap-1">
            {user?.isAdmin && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="
                  rounded-full p-2 text-slate-400 transition-colors
                  hover:bg-slate-100/50 hover:text-illini-blue
                "
                aria-label="Edit"
              >
                <Pencil className="size-4" />
              </button>
            )}
            <motion.button
              type="button"
              onClick={async () => {
                await toggleFavorite(dorm.id, dorm.name, dorm.name_zh);
              }}
              aria-label={isSaved ? t.saved : t.save}
              whileTap={{ scale: 1.35 }}
              transition={{ type: "spring", stiffness: 400, damping: 12 }}
              className="
                -mr-1 rounded-full p-2 text-slate-500 transition-colors
                hover:bg-slate-100/50 hover:text-illini-orange
              "
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isSaved ? "saved" : "unsaved"}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Heart
                    className={`
                      size-5 transition-colors duration-200
                      ${isSaved ? `fill-illini-orange text-illini-orange` : ""}
                    `}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      <main
        className="
          mx-auto mt-0 max-w-[1000px] px-4
          md:mt-8 md:px-6
        "
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="
            space-y-8
            md:space-y-10
          "
        >
          {/* ── Hero Section ── */}
          <motion.section
            variants={fadeUp}
            className="
              space-y-5
              md:space-y-6
            "
          >
            {heroImage && (
              <div
                className="
                  relative aspect-4/3 w-full cursor-zoom-in overflow-hidden
                  bg-slate-100 shadow-sm
                  sm:aspect-video
                  md:aspect-21/9 md:rounded-2xl md:rounded-3xl md:border
                  md:border-white/60
                "
                onClick={() => {
                  const gallery = heroImages.map((src, i) => ({
                    src,
                    alt: `${dormName} ${i + 1}`,
                  }));
                  setLightbox({ images: gallery, index: safeHeroImageIndex });
                }}
              >
                <motion.img
                  src={heroImage}
                  alt={dormName}
                  className="size-full object-cover"
                  initial={{ scale: 1.04 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                {positivePercent !== null && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById("reviews")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className="
                      absolute top-3 right-3 flex cursor-pointer items-center
                      gap-1 rounded-full border border-white/50 bg-white/80
                      px-2.5 py-1 shadow-sm backdrop-blur-md transition-colors
                      hover:bg-white/95
                      md:top-4 md:right-4 md:gap-1.5 md:px-3 md:py-1.5
                    "
                  >
                    <ThumbsUp
                      className="
                        size-3.5 fill-illini-orange text-illini-orange
                        md:size-4
                      "
                    />
                    <span
                      className="
                        text-[12px] font-bold text-slate-900
                        md:text-[13px]
                      "
                    >
                      {positivePercent}
                      {t.positiveRating} ({totalReviews})
                    </span>
                  </motion.button>
                )}
                {heroImages.length > 1 && (
                  <>
                    <InlineImageNavButton
                      direction="prev"
                      label={
                        language === "zh" ? "上一张主图" : "Previous main image"
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        setHeroImageIndex(
                          (prev) =>
                            (prev - 1 + heroImages.length) % heroImages.length
                        );
                      }}
                      className="
                        left-3
                        md:left-4
                      "
                    />
                    <InlineImageNavButton
                      direction="next"
                      label={
                        language === "zh" ? "下一张主图" : "Next main image"
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        setHeroImageIndex(
                          (prev) => (prev + 1) % heroImages.length
                        );
                      }}
                      className="
                        right-3
                        md:right-4
                      "
                    />
                    <div
                      className="
                        absolute right-3 bottom-3 rounded-full bg-black/40
                        px-2.5 py-1 text-[11px] font-semibold text-white
                        backdrop-blur-sm
                        md:right-4 md:bottom-4
                      "
                    >
                      {safeHeroImageIndex + 1} / {heroImages.length}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Title & Meta + Hard Facts */}
            <div
              className="
                flex flex-col justify-between gap-6
                md:flex-row md:items-start md:gap-8
              "
            >
              <div
                className="
                  flex-1 space-y-3
                  md:space-y-4
                "
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="
                      rounded-full bg-slate-200/60 px-3 py-1 text-[11px]
                      font-bold text-slate-700
                      md:text-[12px]
                    "
                  >
                    {getLocalizedLabel(housingMeta, language)} (
                    {housingMeta.shortLabel})
                  </span>
                  <span
                    className="
                      inline-flex items-center gap-1 rounded-full
                      bg-slate-200/60 px-3 py-1 text-[11px] font-bold
                      text-slate-700
                      md:text-[12px]
                    "
                  >
                    <MapPin className="size-3" />
                    {dormLocation}
                  </span>
                </div>

                <h1
                  className="
                    text-3xl font-extrabold tracking-tight text-illini-blue
                    md:text-4xl
                  "
                >
                  {dormName}
                </h1>

                {dormAddress && (
                  <div
                    className="
                      flex items-start gap-1.5 text-[13px] font-medium
                      text-slate-500
                      md:items-center md:text-[14px]
                    "
                  >
                    <MapPin
                      className="
                        mt-0.5 size-4 shrink-0
                        md:mt-0
                      "
                    />
                    <span className="leading-tight">{dormAddress}</span>
                  </div>
                )}

                {positiveTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {positiveTags.flatMap((tag, i) => {
                      const Icon = TAG_REGISTRY[tag]?.icon;
                      if (
                        tag === "llc" &&
                        (dorm.categorizedTags?.llcNames?.length ?? 0) > 1
                      ) {
                        return dorm.categorizedTags.llcNames!.map(
                          (llcName, j) => (
                            <motion.span
                              key={`llc-${j}`}
                              initial={{ opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + (i + j) * 0.06 }}
                              className="
                                inline-flex items-center gap-1 rounded-full
                                bg-illini-orange/10 px-3 py-1 text-[12px]
                                font-bold text-illini-orange
                                md:text-[13px]
                              "
                            >
                              {Icon && (
                                <Icon className="size-3.5" strokeWidth={1.5} />
                              )}
                              {llcName}
                            </motion.span>
                          )
                        );
                      }
                      return (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.06 }}
                          className="
                            inline-flex items-center gap-1 rounded-full
                            bg-illini-orange/10 px-3 py-1 text-[12px] font-bold
                            text-illini-orange
                            md:text-[13px]
                          "
                        >
                          {Icon && (
                            <Icon className="size-3.5" strokeWidth={1.5} />
                          )}
                          {getDetailTagDisplay(
                            tag,
                            dorm.categorizedTags,
                            language
                          )}
                        </motion.span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hard Facts cards */}
              <div
                className="
                  mt-2 flex w-full gap-2
                  md:mt-0 md:w-auto md:gap-3
                "
              >
                {/* AC */}
                <div
                  className={`
                    flex h-[88px] min-w-[88px] flex-1 flex-col items-center
                    justify-center rounded-2xl border p-2 shadow-sm
                    md:h-[100px] md:min-w-[100px] md:flex-none md:p-3
                    ${
             dorm.ac
               ? "border-slate-100 bg-white"
               : "border-amber-200 bg-amber-50"
           }
                  `}
                >
                  {/* Snowflake with strikethrough when no AC */}
                  <div className="relative mb-1.5">
                    <Snowflake
                      className={`
                        size-5
                        md:size-6
                        ${dorm.ac ? `text-sky-400` : `text-slate-300`}
                      `}
                      strokeWidth={1.5}
                    />
                    {!dorm.ac && (
                      <div
                        className="
                          pointer-events-none absolute inset-0 flex items-center
                          justify-center
                        "
                      >
                        <div className="
                          h-[2px] w-[140%] rotate-45 rounded-full bg-red-400
                        " />
                      </div>
                    )}
                  </div>
                  <span
                    className={`
                      text-center text-[11px] leading-tight font-bold
                      md:text-[12px]
                      ${dorm.ac ? `text-slate-700` : `text-amber-700`}
                    `}
                  >
                    {dorm.ac
                      ? language === "zh"
                        ? "有空调"
                        : "A/C"
                      : language === "zh"
                        ? "无空调"
                        : "No A/C"}
                  </span>
                  {!dorm.ac && (
                    <span
                      className="
                        mt-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px]
                        leading-none font-semibold text-amber-500
                        md:text-[10px]
                      "
                    >
                      {language === "zh" ? "注意" : "Note"}
                    </span>
                  )}
                </div>

                {/* Dining */}
                <div
                  className="
                    flex h-[88px] min-w-[88px] flex-1 flex-col items-center
                    justify-center rounded-2xl border border-slate-100 bg-white
                    p-2 shadow-sm
                    md:h-[100px] md:min-w-[100px] md:flex-none md:p-3
                  "
                >
                  <Utensils
                    className="
                      mb-1.5 size-5 shrink-0 text-[#52C41A]
                      md:size-6
                    "
                    strokeWidth={1.5}
                  />
                  <span
                    className="
                      text-center text-[11px] leading-tight font-bold
                      text-slate-700
                      md:text-[12px]
                    "
                  >
                    {diningLabel}
                  </span>
                </div>

                {/* Bathroom */}
                <div
                  className="
                    flex h-[88px] min-w-[88px] flex-1 flex-col items-center
                    justify-center rounded-2xl border border-slate-100 bg-white
                    p-2 shadow-sm
                    md:h-[100px] md:min-w-[100px] md:flex-none md:p-3
                  "
                >
                  <Bath
                    className="
                      mb-1.5 size-5 shrink-0 text-[#1890FF]
                      md:size-6
                    "
                    strokeWidth={1.5}
                  />
                  <span
                    className="
                      text-center text-[11px] leading-tight font-bold
                      text-slate-700
                      md:text-[12px]
                    "
                  >
                    {bathroomLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Description + website link */}
            <div className="space-y-3 pt-2">
              <p
                className="
                  max-w-4xl text-[14px] leading-relaxed font-medium
                  text-slate-600
                  md:text-[15px]
                "
              >
                {dormDesc}
              </p>
              {(dorm.website || dorm.housingType === "URH") && (
                <a
                  href={dorm.website || "https://housing.illinois.edu/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex w-fit items-center gap-1 rounded-full
                    bg-slate-100 px-3 py-1.5 text-[11px] font-semibold
                    text-slate-500 transition-colors
                    hover:bg-slate-200
                    md:text-[12px]
                  "
                >
                  <span>{t.viewWebsite}</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </motion.section>

          {/* ── Amenities ── */}
          {(neutralTags.length > 0 || mutedTags.length > 0) && (
            <motion.section
              variants={fadeUp}
              className="
                space-y-3
                md:space-y-4
              "
            >
              <h3
                className="
                  text-[16px] font-bold text-slate-900
                  md:text-[18px]
                "
              >
                {t.amenities}
              </h3>
              <div
                className="
                  flex flex-wrap gap-2
                  md:gap-2.5
                "
              >
                {neutralTags.map((tag, i) => {
                  const Icon = TAG_REGISTRY[tag]?.icon;
                  return (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * i }}
                      whileHover={{ y: -2, scale: 1.04 }}
                      className="
                        flex cursor-default items-center gap-1.5 rounded-lg
                        border border-white/60 bg-white/80 px-2.5 py-1
                        shadow-[0_2px_10px_rgba(0,0,0,0.02)] backdrop-blur-md
                        md:rounded-xl md:px-3 md:py-1.5
                      "
                    >
                      {Icon && (
                        <Icon
                          className="
                            size-3.5 text-slate-500
                            md:size-4
                          "
                          strokeWidth={1.5}
                        />
                      )}
                      <span
                        className="
                          text-[12px] font-semibold text-slate-700
                          md:text-[13px]
                        "
                      >
                        {getDetailTagDisplay(
                          tag,
                          dorm.categorizedTags,
                          language
                        )}
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
                      className="
                        flex cursor-default items-center gap-1.5 rounded-lg
                        border border-slate-200/50 bg-slate-100/50 px-2.5 py-1
                        md:rounded-xl md:px-3 md:py-1.5
                      "
                    >
                      {Icon && (
                        <Icon
                          className="
                            size-3.5 text-slate-400
                            md:size-4
                          "
                          strokeWidth={1.5}
                        />
                      )}
                      <span
                        className="
                          text-[12px] font-semibold text-slate-500
                          md:text-[13px]
                        "
                      >
                        {getDetailTagDisplay(
                          tag,
                          dorm.categorizedTags,
                          language
                        )}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* ── Floor Plans & Pricing ── */}
          {sortedPlans.length > 0 && (
            <motion.section
              variants={fadeUp}
              className="
                space-y-3 pt-2
                md:space-y-4
              "
            >
              <div
                className="
                  mb-4 flex items-end justify-between
                  md:mb-6
                "
              >
                <div
                  className="
                    space-y-1
                    md:space-y-1.5
                  "
                >
                  <h3
                    className="
                      text-[16px] font-bold text-slate-900
                      md:text-[18px]
                    "
                  >
                    {language === "zh"
                      ? "户型图与价格"
                      : "Floor Plans & Pricing"}
                  </h3>
                  <p
                    className="
                      text-[12px] font-medium text-slate-500
                      md:text-[13px]
                    "
                  >
                    {t.floorPlansDesc}
                  </p>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowPlanCompare(!showPlanCompare)}
                  className={`
                    flex items-center gap-1.5 rounded-xl border px-3 py-1.5
                    text-[12px] font-bold shadow-[0_2px_10px_rgba(0,0,0,0.02)]
                    backdrop-blur-md transition-all
                    md:px-4 md:py-2 md:text-[13px]
                    ${
             showPlanCompare
               ? "border-illini-blue bg-illini-blue text-white"
               : `
                 border-white/60 bg-white/80 text-illini-blue
                 hover:bg-white hover:shadow-[0_4px_15px_rgba(0,0,0,0.04)]
               `
           }
                  `}
                >
                  <ArrowRightLeft
                    className="
                      size-3.5
                      md:size-4
                    "
                  />
                  {showPlanCompare
                    ? language === "zh"
                      ? "退出对比"
                      : "Exit Compare"
                    : t.comparePlans}
                </motion.button>
              </div>

              <div className="space-y-3">
                {sortedPlans.map((plan, idx) => {
                  const resolvedBathroomScope =
                    plan.bathroomScope ?? defaultPlanScope;
                  const option = {
                    bedCount: plan.bedCount ?? null,
                    bathroomCount: plan.bathroomCount ?? null,
                    bathroomScope: resolvedBathroomScope,
                    labelCode: plan.labelCode,
                  };
                  const labels = getRoomOptionLabels(option, language);
                  const planKey = getPlanKey(plan, idx);
                  const planPrice = getPublishedPlanPrice(plan);
                  const planBathroomLabel = getBathroomScopeLabel(
                    resolvedBathroomScope,
                    language
                  );
                  const isExpanded = expandedPlanId === planKey;
                  const isCompared = compareIds.includes(planKey);
                  const planDisplayTitle =
                    plan.officialName || labels.primaryLabel;
                  const normalizedSummary =
                    plan.officialName &&
                    plan.officialName !== labels.primaryLabel
                      ? [labels.primaryLabel, labels.secondaryLabel]
                          .filter(Boolean)
                          .join(" · ")
                      : labels.secondaryLabel;
                  const availabilityLabel =
                    plan.available === false
                      ? language === "zh"
                        ? "暂不可订"
                        : "Sold out"
                      : planPrice == null
                        ? language === "zh"
                          ? "价格待公布"
                          : "Price unavailable"
                        : t.available;
                  // Multi-image arrays (fallback to legacy single fields)
                  const photos = plan.photoUrls?.length
                    ? plan.photoUrls
                    : plan.photoUrl
                      ? [plan.photoUrl]
                      : [];
                  const layouts = plan.imageUrls?.length
                    ? plan.imageUrls
                    : plan.imageUrl
                      ? [plan.imageUrl]
                      : [];
                  const thumbSrc = photos[0] || layouts[0];
                  const hasThumb =
                    Boolean(thumbSrc) && !imageErrors[`${planKey}-thumb`];
                  // Collect all available images for this plan's lightbox
                  const planImages: {
                    src: string;
                    alt?: string;
                    label?: string;
                  }[] = [];
                  photos.forEach((src, i) =>
                    planImages.push({
                      src,
                      alt: labels.primaryLabel,
                      label: `${language === "zh" ? "展示图" : "Photo"}${photos.length > 1 ? ` ${i + 1}` : ""}`,
                    })
                  );
                  layouts.forEach((src, i) =>
                    planImages.push({
                      src,
                      alt: labels.primaryLabel,
                      label: `${language === "zh" ? "户型图" : "Floor Plan"}${layouts.length > 1 ? ` ${i + 1}` : ""}`,
                    })
                  );
                  // Fallback: if no layout diagrams, use photos for the expanded view
                  const allExpandedImages =
                    layouts.length > 0 ? layouts : photos;
                  const safeExpandedIndex =
                    allExpandedImages.length > 0
                      ? Math.min(
                          planImageIndices[planKey] ?? 0,
                          allExpandedImages.length - 1
                        )
                      : 0;
                  const expandedSrc = allExpandedImages[safeExpandedIndex];
                  const hasExpandedImage =
                    Boolean(expandedSrc) && !imageErrors[`${planKey}-layout`];
                  const expandedLightboxIndex =
                    layouts.length > 0
                      ? photos.length + safeExpandedIndex // layout images are after photos
                      : safeExpandedIndex; // photos start at 0

                  return (
                    <motion.div
                      key={planKey}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.07, duration: 0.35 }}
                      onClick={() =>
                        setExpandedPlanId(isExpanded ? null : planKey)
                      }
                      className="
                        group cursor-pointer overflow-hidden rounded-xl border
                        border-slate-100 bg-white shadow-sm transition-shadow
                        duration-150
                        hover:-translate-y-px
                        hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]
                        md:rounded-2xl
                      "
                    >
                      <div
                        className="
                          flex flex-row items-center gap-4 p-3
                          md:items-start md:gap-6 md:p-5
                        "
                      >
                        {/* Thumbnail (展示图 > 户型图 > placeholder) */}
                        <div
                          className="
                            relative size-20 shrink-0 overflow-hidden rounded-lg
                            border border-slate-200/60 bg-slate-50
                            transition-colors
                            group-hover:border-slate-300
                            md:h-28 md:w-36 md:rounded-xl
                          "
                          onClick={(e) => {
                            if (planImages.length > 0) {
                              e.stopPropagation();
                              setLightbox({ images: planImages, index: 0 });
                            }
                          }}
                        >
                          {hasThumb ? (
                            <img
                              src={thumbSrc}
                              alt={planDisplayTitle}
                              className="
                                size-full object-cover transition-transform
                                duration-200
                                group-hover:scale-105
                              "
                              onError={() =>
                                setImageErrors((prev) => ({
                                  ...prev,
                                  [`${planKey}-thumb`]: true,
                                }))
                              }
                            />
                          ) : (
                            <div
                              className="
                                flex size-full items-center justify-center
                                text-slate-300
                              "
                            >
                              <SquareDashed
                                className="size-8"
                                strokeWidth={1}
                              />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div
                          className="
                            flex min-w-0 flex-1 flex-col justify-between gap-1
                            md:h-28 md:flex-row md:gap-0
                          "
                        >
                          {/* Left */}
                          <div
                            className="
                              flex h-full min-w-0 flex-col justify-center
                              gap-1.5 py-0.5
                              md:gap-3
                            "
                          >
                            <div
                              className="
                                flex w-full items-center justify-between gap-2
                                md:justify-start
                              "
                            >
                              <div
                                className="
                                  flex min-w-0 flex-wrap items-center gap-1.5
                                  md:gap-3
                                "
                              >
                                <h4
                                  className="
                                    truncate text-[15px] font-extrabold
                                    text-slate-900
                                    md:text-[18px]
                                  "
                                >
                                  {planDisplayTitle}
                                </h4>
                                {normalizedSummary && (
                                  <span
                                    className="
                                      text-[12px] font-medium text-slate-500
                                      md:text-[14px]
                                    "
                                  >
                                    {normalizedSummary}
                                  </span>
                                )}
                                <span
                                  className={`
                                    flex items-center gap-0.5 rounded-md border
                                    px-1.5 py-0.5 text-[10px] font-bold
                                    whitespace-nowrap
                                    md:gap-1 md:rounded-xl md:px-2.5 md:py-1
                                    md:text-[13px]
                                    ${
                     plan.available === false
                       ? `border-red-200 bg-red-50 text-red-600`
                       : planPrice == null
                         ? `border-amber-200 bg-amber-50 text-amber-700`
                         : `border-[#D1FAE5] bg-[#ECFDF5] text-[#059669]`
                   }
                                  `}
                                >
                                  {plan.available !== false &&
                                    planPrice != null && (
                                      <Check
                                        className="
                                          size-2.5
                                          md:size-3.5
                                        "
                                        strokeWidth={3}
                                      />
                                    )}
                                  {availabilityLabel}
                                </span>
                              </div>
                              {/* Mobile chevron */}
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.25 }}
                                className="
                                  -mr-1 flex shrink-0 items-center
                                  justify-center text-slate-400
                                  md:hidden
                                "
                              >
                                <ChevronDown className="size-5" />
                              </motion.div>
                            </div>

                            {/* Specs */}
                            <div
                              className="
                                mt-1 flex flex-wrap items-center gap-x-1.5
                                gap-y-1 text-slate-600
                                md:mt-0 md:gap-4
                              "
                            >
                              {plan.bedCount != null && (
                                <>
                                  <div
                                    className="
                                      flex items-center gap-1
                                      md:gap-1.5
                                    "
                                  >
                                    <BedSingle
                                      className="
                                        size-3.5 text-slate-400
                                        md:size-4
                                      "
                                    />
                                    <span
                                      className="
                                        text-[12px] font-semibold
                                        md:text-[14px]
                                      "
                                    >
                                      {plan.bedSize
                                        ? plan.bedSize
                                        : `${plan.bedCount} ${language === "zh" ? "张床" : plan.bedCount === 1 ? "Bed" : "Beds"}`}
                                    </span>
                                  </div>
                                  <div
                                    className="
                                      size-0.5 rounded-full bg-slate-300
                                      md:size-1
                                    "
                                  />
                                </>
                              )}
                              <div
                                className="
                                  flex items-center gap-1
                                  md:gap-1.5
                                "
                              >
                                <Bath
                                  className="
                                    size-3.5 text-slate-400
                                    md:size-4
                                  "
                                />
                                <span
                                  className="
                                    text-[12px] font-semibold
                                    md:text-[14px]
                                  "
                                >
                                  {plan.bathroomCount != null &&
                                  plan.bathroomCount > 0
                                    ? `${plan.bathroomCount} ${language === "zh" ? "卫" : plan.bathroomCount === 1 ? "Bath" : "Baths"}`
                                    : planBathroomLabel}
                                </span>
                              </div>
                              {plan.sqft && (
                                <>
                                  <div
                                    className="
                                      size-0.5 rounded-full bg-slate-300
                                      md:size-1
                                    "
                                  />
                                  <div
                                    className="
                                      flex items-center gap-1
                                      md:gap-1.5
                                    "
                                  >
                                    <SquareDashed
                                      className="
                                        size-3.5 text-slate-400
                                        md:size-4
                                      "
                                    />
                                    <span
                                      className="
                                        text-[12px] font-semibold tabular-nums
                                        md:text-[14px]
                                      "
                                    >
                                      {plan.sqft}{" "}
                                      {t.sqft ||
                                        (language === "zh"
                                          ? "平方英尺"
                                          : "sqft")}
                                      <span className="
                                        ml-1 font-medium text-slate-400
                                      ">
                                        (~{Math.round(plan.sqft * 0.092903)}㎡)
                                      </span>
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Mobile price */}
                            {planPrice != null ? (
                              <div
                                className="
                                  mt-0.5 flex items-baseline gap-1
                                  md:hidden
                                "
                              >
                                <span
                                  className="
                                    text-[16px] font-extrabold tracking-tight
                                    text-slate-900 tabular-nums
                                  "
                                >
                                  {formatPrice(planPrice)}
                                </span>
                                <span className="
                                  text-[11px] font-medium text-slate-500
                                ">
                                  {t.yr}
                                </span>
                                <span
                                  className="
                                    ml-1 text-[11px] font-medium text-slate-400
                                    tabular-nums
                                  "
                                >
                                  (~{formatPrice(Math.round(planPrice / 12))}
                                  {t.mo})
                                </span>
                              </div>
                            ) : (
                              <div
                                className={`
                                  mt-0.5 text-[12px] font-semibold
                                  md:hidden
                                  ${
                    plan.available === false ? `text-red-500` : `text-amber-600`
                  }
                                `}
                              >
                                {availabilityLabel}
                              </div>
                            )}

                            {/* Mobile compare button */}
                            {showPlanCompare && (
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.96 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCompare(planKey);
                                }}
                                className={`
                                  mt-1 flex items-center gap-1.5 rounded-lg
                                  border px-2.5 py-1 text-[11px] font-semibold
                                  transition-colors
                                  md:hidden
                                  ${
                    isCompared
                      ? `
                        border-illini-blue/30 bg-illini-blue/5 text-illini-blue
                      `
                      : `border-slate-200 bg-white text-slate-500`
                  }
                                `}
                              >
                                <div
                                  className={`
                                    flex size-3 items-center justify-center
                                    rounded-[3px] border transition-colors
                                    ${
                     isCompared
                       ? `border-illini-blue bg-illini-blue text-white`
                       : `border-slate-300`
                   }
                                  `}
                                >
                                  {isCompared && (
                                    <Check className="size-2" strokeWidth={3} />
                                  )}
                                </div>
                                {t.compareAdd}
                              </motion.button>
                            )}
                          </div>

                          {/* Right: desktop price + actions */}
                          <div
                            className="
                              hidden h-full shrink-0 flex-col items-end
                              justify-between gap-2 py-0.5
                              md:flex
                            "
                          >
                            {planPrice != null ? (
                              <div className="flex flex-col items-end">
                                <div className="flex items-baseline gap-0.5">
                                  <span
                                    className="
                                      text-[24px] font-extrabold tracking-tight
                                      text-slate-900 tabular-nums
                                    "
                                  >
                                    {formatPrice(planPrice)}
                                  </span>
                                  <span className="
                                    text-[13px] font-medium text-slate-500
                                  ">
                                    {t.yr}
                                  </span>
                                </div>
                                <div
                                  className="
                                    mt-1 inline-flex items-center rounded-md
                                    bg-slate-100 px-1.5 py-0.5 text-[12px]
                                    font-medium text-slate-500 tabular-nums
                                  "
                                >
                                  ~{formatPrice(Math.round(planPrice / 12))}
                                  {t.mo}
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`
                                  text-[13px] font-semibold
                                  ${
                    plan.available === false ? `text-red-500` : `text-amber-600`
                  }
                                `}
                              >
                                {availabilityLabel}
                              </div>
                            )}

                            <div className="flex items-center gap-3">
                              {showPlanCompare && (
                                <motion.button
                                  type="button"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCompare(planKey);
                                  }}
                                  className={`
                                    flex items-center gap-1.5 rounded-lg border
                                    px-3 py-1.5 text-[12px] font-semibold
                                    transition-colors
                                    ${
                     isCompared
                       ? `
                         border-illini-blue/30 bg-illini-blue/5 text-illini-blue
                       `
                       : `
                         border-slate-200 bg-white text-slate-500
                         hover:border-slate-300 hover:text-slate-700
                       `
                   }
                                  `}
                                >
                                  <div
                                    className={`
                                      flex size-3.5 items-center justify-center
                                      rounded-[4px] border transition-colors
                                      ${
                      isCompared
                        ? `border-illini-blue bg-illini-blue text-white`
                        : `border-slate-300`
                    }
                                    `}
                                  >
                                    <AnimatePresence>
                                      {isCompared && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          exit={{ scale: 0 }}
                                          transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 15,
                                          }}
                                        >
                                          <Check
                                            className="size-2.5"
                                            strokeWidth={3}
                                          />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  {t.compareAdd}
                                </motion.button>
                              )}
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.25 }}
                                className="
                                  flex size-8 items-center justify-center
                                  rounded-full bg-slate-50 transition-colors
                                  group-hover:bg-slate-100
                                "
                              >
                                <ChevronDown className="size-5 text-slate-400" />
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
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div
                              className="
                                mx-4 mt-2 border-t border-slate-100/50 p-4 pt-0
                                md:mx-5 md:p-5
                              "
                            >
                              {hasExpandedImage ? (
                                <div
                                  className="
                                    relative mt-3
                                    md:mt-4
                                  "
                                >
                                  <img
                                    src={expandedSrc}
                                    alt={`${labels.primaryLabel} floor plan`}
                                    className="
                                      h-auto w-full cursor-zoom-in rounded-xl
                                      border border-slate-200/50 bg-slate-50
                                      transition-opacity
                                      hover:opacity-90
                                    "
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLightbox({
                                        images: planImages,
                                        index: expandedLightboxIndex,
                                      });
                                    }}
                                    onError={() =>
                                      setImageErrors((prev) => ({
                                        ...prev,
                                        [`${planKey}-layout`]: true,
                                      }))
                                    }
                                  />
                                  {allExpandedImages.length > 1 && (
                                    <>
                                      <InlineImageNavButton
                                        direction="prev"
                                        label={
                                          language === "zh"
                                            ? "上一张户型图"
                                            : "Previous floor plan image"
                                        }
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setPlanImageIndices((prev) => ({
                                            ...prev,
                                            [planKey]:
                                              (safeExpandedIndex -
                                                1 +
                                                allExpandedImages.length) %
                                              allExpandedImages.length,
                                          }));
                                        }}
                                        className="left-3"
                                      />
                                      <InlineImageNavButton
                                        direction="next"
                                        label={
                                          language === "zh"
                                            ? "下一张户型图"
                                            : "Next floor plan image"
                                        }
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setPlanImageIndices((prev) => ({
                                            ...prev,
                                            [planKey]:
                                              (safeExpandedIndex + 1) %
                                              allExpandedImages.length,
                                          }));
                                        }}
                                        className="right-3"
                                      />
                                      <div
                                        className="
                                          absolute right-3 bottom-3 rounded-full
                                          bg-black/40 px-2.5 py-1 text-[11px]
                                          font-semibold text-white
                                          backdrop-blur-sm
                                        "
                                      >
                                        {safeExpandedIndex + 1} /{" "}
                                        {allExpandedImages.length}
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div
                                  className="
                                    mt-3 flex items-center justify-center
                                    rounded-xl border border-dashed
                                    border-slate-200/50 bg-slate-50/50 p-6
                                    text-[13px] font-medium text-slate-400
                                    md:mt-4 md:p-8 md:text-[14px]
                                  "
                                >
                                  {language === "zh"
                                    ? "暂无户型图"
                                    : "Floor plan image unavailable"}
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

              {/* Floor plan comparison table */}
              <AnimatePresence>
                {showPlanCompare &&
                  compareIds.length >= 2 &&
                  (() => {
                    const compared = compareIds
                      .map((key) => {
                        const idx = sortedPlans.findIndex(
                          (p, i) => getPlanKey(p, i) === key
                        );
                        return idx >= 0
                          ? { plan: sortedPlans[idx], idx }
                          : null;
                      })
                      .filter(
                        (x): x is { plan: FloorPlan; idx: number } => x !== null
                      );
                    if (compared.length < 2) return null;

                    const rows: { label: string; values: string[] }[] = [
                      {
                        label: language === "zh" ? "房型" : "Room Type",
                        values: compared.map(({ plan }) => {
                          const opt = {
                            bedCount: plan.bedCount ?? null,
                            bathroomCount: plan.bathroomCount ?? null,
                            bathroomScope:
                              plan.bathroomScope ?? defaultPlanScope,
                            labelCode: plan.labelCode,
                          };
                          return (
                            plan.officialName ||
                            getRoomOptionLabels(opt, language).primaryLabel
                          );
                        }),
                      },
                      {
                        label: language === "zh" ? "床位" : "Beds",
                        values: compared.map(({ plan }) =>
                          plan.bedSize
                            ? plan.bedSize
                            : plan.bedCount != null
                              ? `${plan.bedCount}`
                              : "—"
                        ),
                      },
                      {
                        label: language === "zh" ? "卫浴" : "Bathroom",
                        values: compared.map(({ plan }) => {
                          const scope = plan.bathroomScope ?? defaultPlanScope;
                          if (
                            plan.bathroomCount != null &&
                            plan.bathroomCount > 0
                          ) {
                            return `${plan.bathroomCount} ${language === "zh" ? "卫" : plan.bathroomCount === 1 ? "Bath" : "Baths"} · ${getBathroomScopeLabel(scope, language)}`;
                          }
                          return getBathroomScopeLabel(scope, language);
                        }),
                      },
                      {
                        label: language === "zh" ? "面积" : "Area",
                        values: compared.map(({ plan }) =>
                          plan.sqft
                            ? `${plan.sqft} sqft (~${Math.round(plan.sqft * 0.092903)}㎡)`
                            : "—"
                        ),
                      },
                      {
                        label: language === "zh" ? "年租金" : "Annual Price",
                        values: compared.map(({ plan }) => {
                          const p = getPublishedPlanPrice(plan);
                          return p != null
                            ? `${formatPrice(p)}${t.yr}`
                            : plan.available === false
                              ? language === "zh"
                                ? "暂不可订"
                                : "Sold out"
                              : "—";
                        }),
                      },
                      {
                        label: language === "zh" ? "月租金" : "Monthly",
                        values: compared.map(({ plan }) => {
                          const p = getPublishedPlanPrice(plan);
                          return p != null
                            ? `~${formatPrice(Math.round(p / 12))}${t.mo}`
                            : "—";
                        }),
                      },
                    ];

                    return (
                      <motion.div
                        key="plan-compare-table"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="mt-4 overflow-hidden"
                      >
                        <div
                          className="
                            overflow-x-auto rounded-xl border
                            border-illini-blue/20 bg-white
                            shadow-[0_4px_20px_rgba(19,41,75,0.06)]
                            md:rounded-2xl
                          "
                        >
                          <div
                            className="
                              flex items-center gap-2 border-b border-slate-100
                              px-4 py-3
                              md:px-5 md:py-4
                            "
                          >
                            <ArrowRightLeft className="size-4 text-illini-blue" />
                            <span
                              className="
                                text-[14px] font-bold text-slate-900
                                md:text-[15px]
                              "
                            >
                              {language === "zh"
                                ? "房型对比"
                                : "Plan Comparison"}
                            </span>
                            <span className="
                              ml-auto text-[12px] font-medium text-slate-400
                            ">
                              {compared.length}{" "}
                              {language === "zh" ? "个房型" : "plans"}
                            </span>
                          </div>
                          <table
                            className="
                              w-full text-[12px]
                              md:text-[13px]
                            "
                          >
                            <tbody>
                              {rows.map((row, ri) => (
                                <tr
                                  key={ri}
                                  className={
                                    ri % 2 === 0 ? "bg-slate-50/50" : "bg-white"
                                  }
                                >
                                  <td
                                    className="
                                      w-[100px] border-r border-slate-100 px-4
                                      py-2.5 font-semibold whitespace-nowrap
                                      text-slate-500
                                      md:w-[120px] md:px-5 md:py-3
                                    "
                                  >
                                    {row.label}
                                  </td>
                                  {row.values.map((val, ci) => (
                                    <td
                                      key={ci}
                                      className="
                                        min-w-[100px] border-r border-slate-100
                                        px-3 py-2.5 text-center font-semibold
                                        text-slate-800
                                        last:border-r-0
                                        md:px-4 md:py-3
                                      "
                                    >
                                      {val}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    );
                  })()}
              </AnimatePresence>

              {/* Price range footer */}
              {minPrice !== null && maxPrice !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="
                    mt-4 flex items-center justify-between rounded-xl border
                    border-white/50 bg-white/60 p-4
                    shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-md
                    md:rounded-2xl md:p-5
                  "
                >
                  <span
                    className="
                      text-[13px] font-semibold text-slate-600
                      md:text-[14px]
                    "
                  >
                    {t.priceRange}
                  </span>
                  <span
                    className="
                      text-[16px] font-extrabold text-slate-900
                      md:text-[18px]
                    "
                  >
                    {formatPrice(minPrice)}
                    {minPrice !== maxPrice ? ` – ${formatPrice(maxPrice)}` : ""}
                  </span>
                </motion.div>
              )}
            </motion.section>
          )}

          {/* ── Reviews ── */}
          <motion.section
            id="reviews"
            variants={fadeUp}
            className="space-y-4 border-t border-slate-200/50 pt-6 pb-8"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3
                className="
                  text-[16px] font-bold text-slate-900
                  md:text-[18px]
                "
              >
                {t.ratingsAndReviews}
              </h3>
              {totalReviews > 0 && (
                <span
                  className="
                    text-[12px] font-medium text-slate-500
                    md:text-[13px]
                  "
                >
                  {totalReviews} {language === "zh" ? "条评价" : "Reviews"}
                  {positivePercent !== null &&
                    ` · ${positivePercent}${t.positiveRating}`}
                </span>
              )}
            </div>

            {/* Login prompt / form */}
            {!user ? (
              <motion.div
                whileHover={{ scale: 1.005 }}
                className="
                  flex flex-col items-center justify-between gap-4 rounded-xl
                  border border-illini-blue/10 bg-white/60 p-5
                  shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-md
                  sm:flex-row
                  md:rounded-2xl md:p-6
                "
              >
                <div
                  className="
                    flex w-full items-center gap-3
                    sm:w-auto
                  "
                >
                  <div
                    className="
                      flex size-10 shrink-0 items-center justify-center
                      rounded-full bg-illini-blue/5
                      md:size-12
                    "
                  >
                    <MessageSquare
                      className="
                        size-5 text-illini-blue
                        md:size-6
                      "
                    />
                  </div>
                  <div>
                    <h4
                      className="
                        text-[14px] font-bold text-slate-900
                        md:text-[15px]
                      "
                    >
                      {t.shareExp}
                    </h4>
                    <p
                      className="
                        mt-0.5 text-[12px] font-medium text-slate-500
                        md:text-[13px]
                      "
                    >
                      {t.loginPrompt}
                    </p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => requestLogin()}
                  className="
                    w-full rounded-xl bg-illini-blue px-5 py-2.5 text-[13px]
                    font-bold text-white shadow-sm transition-colors
                    hover:bg-illini-blue/90
                    sm:w-auto
                    md:text-[14px]
                  "
                >
                  {t.loginBtn}
                </motion.button>
              </motion.div>
            ) : (
              <div
                className="
                  rounded-xl border border-white/60 bg-white/80 p-4
                  shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-md
                  md:rounded-2xl md:p-5
                "
              >
                <h4
                  className="
                    mb-3 text-[14px] font-bold text-slate-900
                    md:text-[15px]
                  "
                >
                  {t.shareExp}
                </h4>
                <div className="mb-3 flex gap-2">
                  {([1, -1] as const).map((vote) => (
                    <motion.button
                      key={vote}
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() =>
                        setCommentVote(commentVote === vote ? null : vote)
                      }
                      className={`
                        flex items-center gap-1.5 rounded-lg border px-3 py-1.5
                        text-[12px] font-semibold transition-colors
                        ${
               commentVote === vote && vote === 1
                 ? `
                   border-illini-orange/30 bg-illini-orange/10
                   text-illini-orange
                 `
                 : commentVote === vote && vote === -1
                   ? "border-red-200 bg-red-50 text-red-600"
                   : `
                     border-slate-200 bg-white text-slate-500
                     hover:border-slate-300
                   `
             }
                      `}
                    >
                      <ThumbsUp
                        className={`
                          size-3.5
                          ${vote === -1 ? "rotate-180" : ""}
                          ${
                commentVote === vote && vote === 1
                  ? `fill-illini-orange/20`
                  : ""
              }
                        `}
                      />
                      {vote === 1 ? t.thumbsUpDorm : t.thumbsDownDorm}
                    </motion.button>
                  ))}
                </div>
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder={t.leaveComment}
                  rows={3}
                  className="
                    w-full resize-none rounded-xl border border-slate-200
                    bg-white/50 px-3 py-2.5 text-[13px] font-medium
                    placeholder-slate-400 transition-colors
                    focus:border-illini-blue/40 focus:outline-none
                    md:text-[14px]
                  "
                />
                <div className="mt-2.5 flex justify-end">
                  <motion.button
                    type="button"
                    disabled={submitting || !commentContent.trim()}
                    onClick={handleSubmit}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="
                      rounded-xl bg-illini-blue px-5 py-2 text-[13px] font-bold
                      text-white transition-colors
                      hover:bg-illini-blue/90
                      disabled:opacity-40
                      md:text-[14px]
                    "
                  >
                    {submitting ? "..." : t.submitComment}
                  </motion.button>
                </div>
              </div>
            )}

            {/* Comment list */}
            {commentsLoading ? (
              <div className="py-6 text-center text-[13px] text-slate-400">
                {language === "zh" ? "加载中..." : "Loading..."}
              </div>
            ) : comments.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-slate-400">
                {t.noComments}
              </p>
            ) : (
              <>
                <div className="mt-4 space-y-3">
                  <AnimatePresence>
                    {displayedComments.map((comment, i) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="
                          rounded-xl border border-white/60 bg-white/80 p-4
                          shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-md
                          md:rounded-2xl md:p-5
                        "
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="
                                flex size-8 items-center justify-center
                                rounded-full border border-slate-200
                                bg-slate-100
                              "
                            >
                              <User className="size-4 text-slate-400" />
                            </div>
                            <div>
                              <div
                                className="
                                  text-[13px] leading-tight font-bold
                                  text-slate-900
                                  md:text-[14px]
                                "
                              >
                                {comment.display_name}
                              </div>
                              <div
                                className="
                                  mt-0.5 text-[11px] font-medium text-slate-500
                                  md:text-[12px]
                                "
                              >
                                {new Date(
                                  comment.created_at
                                ).toLocaleDateString(
                                  language === "zh" ? "zh-CN" : "en-US",
                                  { year: "numeric", month: "short" }
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {comment.dorm_vote === 1 && (
                              <div
                                className="
                                  flex items-center gap-1 rounded-lg
                                  bg-illini-orange/10 px-2 py-1
                                "
                              >
                                <ThumbsUp className="
                                  size-3 fill-illini-orange text-illini-orange
                                " />
                                <span className="
                                  text-[11px] font-bold text-illini-orange
                                ">
                                  {t.recommended}
                                </span>
                              </div>
                            )}
                            {user && comment.user_id === user.id && (
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteComment(comment.id)}
                                className="
                                  p-1 text-slate-300 transition-colors
                                  hover:text-red-400
                                "
                                aria-label={t.deleteComment}
                              >
                                <X className="size-3.5" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                        {translations[comment.id] ? (
                          <>
                            <p
                              className="
                                text-[13px] leading-relaxed font-medium
                                text-slate-600
                                md:text-[14px]
                              "
                            >
                              {translations[comment.id]}
                            </p>
                            <p
                              className="
                                mt-1.5 border-l-2 border-slate-200 pl-3
                                text-[12px] leading-relaxed text-slate-400
                              "
                            >
                              {comment.content}
                            </p>
                          </>
                        ) : (
                          <p
                            className="
                              text-[13px] leading-relaxed font-medium
                              text-slate-600
                              md:text-[14px]
                            "
                          >
                            {comment.content}
                          </p>
                        )}
                        {translateErrors[comment.id] && (
                          <p className="mt-1 text-[12px] text-red-400">
                            {language === "zh"
                              ? "翻译失败，点击重试"
                              : "Translation failed, click to retry"}
                          </p>
                        )}
                        <div
                          className="
                            mt-4 flex items-center gap-4 border-t
                            border-slate-100/50 pt-3
                          "
                        >
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.88 }}
                            onClick={() =>
                              voteOnComment(
                                comment.id,
                                comment.myVote === 1 ? null : 1
                              )
                            }
                            className={`
                              group flex items-center gap-1.5 transition-colors
                              ${
                  comment.myVote === 1
                    ? "text-illini-orange"
                    : `
                      text-slate-400
                      hover:text-illini-orange
                    `
                }
                            `}
                          >
                            <ThumbsUp
                              className={`
                                size-3.5
                                ${
                   comment.myVote === 1
                     ? `fill-illini-orange/20`
                     : `group-hover:fill-illini-orange/20`
                 }
                              `}
                            />
                            <span className="text-[12px] font-semibold">
                              {t.helpful}
                              {comment.upvotes > 0
                                ? ` (${comment.upvotes})`
                                : ""}
                            </span>
                          </motion.button>
                          {detectLang(comment.content) !== language && (
                            <button
                              type="button"
                              onClick={() =>
                                handleTranslate(comment.id, comment.content)
                              }
                              disabled={translating[comment.id]}
                              className="
                                flex items-center gap-1 text-[12px]
                                font-semibold text-slate-400 transition-colors
                                hover:text-illini-blue
                                disabled:opacity-50
                              "
                            >
                              <Globe className="size-3.5" />
                              {translating[comment.id]
                                ? language === "zh"
                                  ? "翻译中..."
                                  : "Translating..."
                                : translations[comment.id]
                                  ? language === "zh"
                                    ? "显示原文"
                                    : "Original"
                                  : language === "zh"
                                    ? "翻译"
                                    : "Translate"}
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
                    className="
                      w-full rounded-xl border border-white/50 bg-white/40 py-3
                      text-[13px] font-semibold text-slate-500 backdrop-blur-md
                      transition-colors
                      hover:bg-white/60 hover:text-slate-800
                      md:text-[14px]
                    "
                  >
                    {showAllReviews
                      ? language === "zh"
                        ? "收起"
                        : "Show less"
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
          onSaved={(updated) => {
            setDorm(updated);
            setEditOpen(false);
            void refreshDorms();
          }}
        />
      )}

      {/* Admin edit button */}
      {user?.isAdmin && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setEditOpen(true)}
          className="
            fixed right-6 bottom-20 z-50 flex items-center gap-2 rounded-full
            bg-illini-blue px-4 py-2.5 text-[13px] font-bold text-white
            shadow-lg transition-colors
            hover:bg-illini-blue/90
          "
        >
          <Pencil className="size-3.5" />
          {language === "zh" ? "编辑" : "Edit"}
        </motion.button>
      )}
    </motion.div>
  );
};

export default DormDetail;
