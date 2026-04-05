/**
 * @file ./src/components/housing/DormDetail.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, Variants } from 'framer-motion'
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
} from 'lucide-react'
import { formatPrice } from './constants/pricing'
import {
  TAG_REGISTRY,
  getHousingTypeMeta,
  getLocalizedLabel,
} from './constants/metadata'
import { useSharedDormInteraction } from './store/DormUserInteractionContext'
import { useDormData } from './store/DormDataContext'
import { useAuth } from '../../contexts/AuthContext'
import { dormService } from '../../services/dormService'
import { useDormComments } from './hooks/useDormComments'
import { Dorm, DormTag, FloorPlan } from './types/index'
import { Language } from '../../types'
import DormEditPanel from './DormEditPanel'
import ImageLightbox from './ImageLightbox'
import { dormDetailTexts } from './i18n/dormTexts'
import {
  getBathroomScopeLabel,
  getDormBathroomSummary,
  getRoomOptionLabels,
  getStorageBathroomScope,
  normalizeFloorPlan,
} from '../../utils/roomOptions'
import { getDetailTagDisplay } from '../../utils/tagLabels'
import { useLayout } from '../../contexts/LayoutContext'

// ─── Animation variants ────────────────────────────────────────────────────
const pageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
}
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
}
const cardHover = { y: -3, scale: 1.02 } as const
const cardTap = { scale: 0.97 }

/** Detect if text is primarily Chinese (has CJK characters) */
const isChinese = (text: string) => /[\u4e00-\u9fff]/.test(text)
const detectLang = (text: string): 'zh' | 'en' =>
  isChinese(text) ? 'zh' : 'en'
const hasPublishedPlanPrice = (price: FloorPlan['price']): price is number =>
  typeof price === 'number' && Number.isFinite(price) && price > 0
const getPublishedPlanPrice = (plan: FloorPlan) =>
  hasPublishedPlanPrice(plan.price) ? plan.price : null
const getPlanKey = (plan: FloorPlan, idx: number) =>
  [
    plan.labelCode ?? 'plan',
    plan.officialName ?? 'unnamed',
    plan.bedCount ?? 'na',
    plan.bathroomCount ?? 'na',
    idx,
  ].join(':')

// ─── Props ─────────────────────────────────────────────────────────────────
interface DormDetailProps {
  language?: Language
}

interface InlineImageNavButtonProps {
  direction: 'prev' | 'next'
  label: string
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
}

const InlineImageNavButton: React.FC<InlineImageNavButtonProps> = ({
  direction,
  label,
  onClick,
  className = '',
}) => {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`
        h-9 w-9 bg-black/35 text-white backdrop-blur-sm
        hover:bg-black/55
        absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center
        rounded-full transition-colors
        ${className}
      `}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────
const DormDetail: React.FC<DormDetailProps> = ({ language = 'en' }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  // ── Cross-component state (from Contexts / hooks) ──────────────────────
  const { addToHistory, toggleFavorite, isFavorite } =
    useSharedDormInteraction()
  const { user, requestLogin } = useAuth()
  const { getDormById: getFromContext, refreshDorms } = useDormData()
  const { setMobileHeaderSlot } = useLayout()
  const dormId = id ?? ''
  const {
    comments,
    loading: commentsLoading,
    saveComment,
    deleteComment,
    voteOnComment,
    thumbsUp,
  } = useDormComments(dormId)

  // ── Review stats (computed early for mobile header) ───────────────────
  const totalReviews = comments.length
  const positivePercent =
    totalReviews > 0 ? Math.round((thumbsUp / totalReviews) * 100) : null

  // ── Local dorm data ────────────────────────────────────────────────────
  const [dorm, setDorm] = useState<Dorm | undefined>(getFromContext(dormId))

  // ── UI state ───────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false)
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showPlanCompare, setShowPlanCompare] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [heroImageIndex, setHeroImageIndex] = useState(0)
  const [planImageIndices, setPlanImageIndices] = useState<
    Record<string, number>
  >({})
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [lightbox, setLightbox] = useState<{
    images: { src: string; alt?: string; label?: string }[]
    index: number
  } | null>(null)

  // ── Comment form state ─────────────────────────────────────────────────
  const [commentContent, setCommentContent] = useState('')
  const [commentVote, setCommentVote] = useState<1 | -1 | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ── Translation state ────────────────────────────────────────────────
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [translating, setTranslating] = useState<Record<string, boolean>>({})
  const [translateErrors, setTranslateErrors] = useState<
    Record<string, boolean>
  >({})

  const t = dormDetailTexts[language]

  // ── Effects ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    const fromCtx = getFromContext(id)
    if (fromCtx) setDorm(fromCtx)
    dormService.getDormById(id).then((d) => {
      if (d) setDorm(d)
    })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (dorm) addToHistory(dorm)
  }, [dorm?.id, addToHistory]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setHeroImageIndex(0)
    setPlanImageIndices({})
  }, [dorm?.id])

  // Scroll to reviews section when navigated with #reviews hash
  useEffect(() => {
    if (location.hash === '#reviews' && dorm) {
      const el = document.getElementById('reviews')
      if (el) {
        setTimeout(
          () => el.scrollIntoView({ behavior: 'smooth', block: 'start' }),
          300
        )
      }
    }
  }, [location.hash, dorm?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mobile header slot: back + favorite in the AppShell header bar ────
  useEffect(() => {
    if (!dorm) {
      setMobileHeaderSlot(null)
      return () => {
        setMobileHeaderSlot(null)
      }
    }
    setMobileHeaderSlot(
      <div className="min-w-0 flex flex-1 items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/dorms')}
          className="
            gap-1 text-slate-500
            hover:text-illini-blue
            flex shrink-0 items-center transition-colors
          "
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-semibold text-[13px]">
            {language === 'zh' ? '返回' : 'Back'}
          </span>
        </button>
        <div className="flex-1" />
        <div className="gap-1 flex shrink-0 items-center">
          {user?.isAdmin && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="
                p-1.5 text-slate-400
                hover:text-illini-blue
                rounded-full transition-colors
              "
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              toggleFavorite(dorm.id, dorm.name, dorm.name_zh)
            }}
            className="
              p-1.5 text-slate-400
              hover:text-illini-orange
              rounded-full transition-colors
            "
          >
            <Heart
              className={`
                h-5 w-5 transition-colors duration-200
                ${isFavorite(dorm.id) ? `fill-illini-orange text-illini-orange` : ''}
              `}
            />
          </button>
        </div>
      </div>
    )
    return () => {
      setMobileHeaderSlot(null)
    }
  }, [
    dorm?.id,
    language,
    user?.isAdmin,
    navigate,
    toggleFavorite,
    isFavorite,
    setMobileHeaderSlot,
  ])

  // ── Loading state ──────────────────────────────────────────────────────
  if (!dorm) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-700">{t.dormNotFound}</h2>
        <button
          type="button"
          onClick={() => navigate('/dorms')}
          className="
            mt-4 text-illini-blue
            hover:underline
          "
        >
          {t.backToDorms}
        </button>
      </div>
    )
  }

  // ── Derived data ───────────────────────────────────────────────────────
  const isSaved = isFavorite(dorm.id)
  const dormName = language === 'zh' && dorm.name_zh ? dorm.name_zh : dorm.name
  const dormDesc =
    language === 'zh' && dorm.description_zh
      ? dorm.description_zh
      : dorm.description
  const dormLocation =
    language === 'zh' && dorm.location_zh ? dorm.location_zh : dorm.location
  const dormAddress =
    language === 'zh' && dorm.address_zh ? dorm.address_zh : dorm.address
  const heroImages = (
    dorm.galleryImages?.length ? dorm.galleryImages : [dorm.imageUrl]
  ).filter((src): src is string => Boolean(src))
  const safeHeroImageIndex =
    heroImages.length > 0 ? Math.min(heroImageIndex, heroImages.length - 1) : 0
  const heroImage = heroImages[safeHeroImageIndex]
  const housingMeta = getHousingTypeMeta(dorm.housingType)

  const allTags: DormTag[] = [
    ...(dorm.categorizedTags?.livingConditions ?? []),
    ...(dorm.categorizedTags?.facilities ?? []),
    ...(dorm.categorizedTags?.lifestyle ?? []),
  ]
  const positiveTags = allTags.filter(
    (t) => TAG_REGISTRY[t]?.cardTone === 'positive'
  )
  const neutralTags = allTags.filter(
    (t) => TAG_REGISTRY[t]?.cardTone === 'neutral'
  )
  const mutedTags = allTags.filter((t) => TAG_REGISTRY[t]?.cardTone === 'muted')

  const diningLabel =
    dorm.dining === 'inside'
      ? language === 'zh'
        ? '自带食堂'
        : 'Dining Hall'
      : dorm.dining === 'nearby'
        ? language === 'zh'
          ? '附近食堂'
          : 'Dining Nearby'
        : language === 'zh'
          ? '无食堂'
          : 'No Dining'
  const bathroomLabel = getDormBathroomSummary(dorm, language)
  const defaultPlanScope = getStorageBathroomScope(
    dorm.bathroomType,
    dorm.floorPlans
  )

  // Floor plans
  const sortedPlans = (dorm.floorPlans ?? [])
    .map((p) => normalizeFloorPlan(p, p.bathroomScope ?? defaultPlanScope))
    .sort((a, b) => {
      const bedDelta = (a.bedCount ?? 99) - (b.bedCount ?? 99)
      if (bedDelta !== 0) return bedDelta

      const priceDelta =
        (getPublishedPlanPrice(a) ?? Number.POSITIVE_INFINITY) -
        (getPublishedPlanPrice(b) ?? Number.POSITIVE_INFINITY)
      if (priceDelta !== 0) return priceDelta

      return (a.officialName ?? a.labelCode ?? '').localeCompare(
        b.officialName ?? b.labelCode ?? ''
      )
    })
  const pricedPlans = sortedPlans.filter(
    (plan) => getPublishedPlanPrice(plan) != null
  )
  const minPrice = pricedPlans.length
    ? Math.min(
        ...pricedPlans.map((plan) => getPublishedPlanPrice(plan) as number)
      )
    : null
  const maxPrice = pricedPlans.length
    ? Math.max(
        ...pricedPlans.map((plan) => getPublishedPlanPrice(plan) as number)
      )
    : null

  // Reviews
  const displayedComments = showAllReviews ? comments : comments.slice(0, 3)

  // ── Handlers ───────────────────────────────────────────────────────────
  const toggleCompare = (key: string) =>
    setCompareIds((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )

  const handleSubmit = async () => {
    if (!commentContent.trim()) return
    setSubmitting(true)
    try {
      await saveComment(commentContent.trim(), commentVote)
      setCommentContent('')
      setCommentVote(null)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = (commentId: string) => {
    const msg =
      language === 'zh' ? '确定要删除这条评论吗？' : 'Delete this comment?'
    if (!window.confirm(msg)) return
    deleteComment(commentId)
  }

  const handleTranslate = async (commentId: string, text: string) => {
    if (translations[commentId]) {
      // Toggle off
      setTranslations((prev) => {
        const next = { ...prev }
        delete next[commentId]
        return next
      })
      return
    }
    setTranslating((prev) => ({ ...prev, [commentId]: true }))
    setTranslateErrors((prev) => {
      const next = { ...prev }
      delete next[commentId]
      return next
    })
    try {
      const targetLang = language === 'zh' ? 'English' : '中文'
      const res = await fetch('/api/deepseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a translator. Translate the following text to ${targetLang}. Return ONLY the translation, nothing else.`,
            },
            { role: 'user', content: text },
          ],
        }),
      })
      if (res.ok) {
        const data = (await res.json()) as Record<string, unknown>
        const choices = data.choices as
          | Array<{ message?: { content?: string } }>
          | undefined
        const translated =
          choices?.[0]?.message?.content ?? (data.reply as string) ?? text
        setTranslations((prev) => ({ ...prev, [commentId]: translated }))
      } else {
        setTranslateErrors((prev) => ({ ...prev, [commentId]: true }))
      }
    } catch {
      setTranslateErrors((prev) => ({ ...prev, [commentId]: true }))
    } finally {
      setTranslating((prev) => ({ ...prev, [commentId]: false }))
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="
        no-scrollbar bg-slate-50 pb-24 font-sans text-slate-800 size-full
        overflow-y-auto
      "
      style={{
        marginRight: editOpen ? '32rem' : 0,
        transition: 'margin-right 0.3s ease-in-out',
      }}
    >
      {/* ── Top bar (desktop: sticky bar; mobile: overlay on hero) ── */}
      <div
        className="
          top-0 border-white/50 bg-white/70 backdrop-blur-xl
          md:block
          sticky z-40 hidden border-b shadow-[0_4px_20px_rgba(0,0,0,0.02)]
        "
      >
        <div
          className="
            h-14 px-6 mx-auto flex max-w-[1000px] items-center justify-between
          "
        >
          <button
            type="button"
            onClick={() => navigate('/dorms')}
            className="
              group gap-1.5 py-2 text-slate-500
              hover:text-illini-blue
              flex items-center transition-colors
            "
          >
            <ArrowLeft
              className="
                h-4 w-4
                group-hover:-translate-x-0.5
                transition-transform
              "
            />
            <span className="font-semibold text-[14px]">{t.backToBrowse}</span>
          </button>

          <div className="gap-1 flex items-center">
            {user?.isAdmin && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="
                  p-2 text-slate-400
                  hover:bg-slate-100/50 hover:text-illini-blue
                  rounded-full transition-colors
                "
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <motion.button
              type="button"
              onClick={async () => {
                await toggleFavorite(dorm.id, dorm.name, dorm.name_zh)
              }}
              aria-label={isSaved ? t.saved : t.save}
              whileTap={{ scale: 1.35 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
              className="
                -mr-1 p-2 text-slate-500
                hover:bg-slate-100/50 hover:text-illini-orange
                rounded-full transition-colors
              "
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isSaved ? 'saved' : 'unsaved'}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Heart
                    className={`
                      h-5 w-5 transition-colors duration-200
                      ${isSaved ? `fill-illini-orange text-illini-orange` : ''}
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
          mt-0 px-4
          md:mt-8 md:px-6
          mx-auto max-w-[1000px]
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
                  bg-slate-100 shadow-sm
                  sm:aspect-video
                  md:aspect-[21/9] md:rounded-2xl md:rounded-3xl md:border
                  md:border-white/60
                  relative aspect-4/3 w-full cursor-zoom-in overflow-hidden
                "
                onClick={() => {
                  const gallery = heroImages.map((src, i) => ({
                    src,
                    alt: `${dormName} ${i + 1}`,
                  }))
                  setLightbox({ images: gallery, index: safeHeroImageIndex })
                }}
              >
                <motion.img
                  src={heroImage}
                  alt={dormName}
                  className="size-full object-cover"
                  initial={{ scale: 1.04 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
                {positivePercent !== null && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      document
                        .getElementById('reviews')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className="
                      right-3 top-3 gap-1 border-white/50 bg-white/80 px-2.5
                      py-1 shadow-sm backdrop-blur-md
                      hover:bg-white/95
                      md:right-4 md:top-4 md:gap-1.5 md:px-3 md:py-1.5
                      absolute flex cursor-pointer items-center rounded-full
                      border transition-colors
                    "
                  >
                    <ThumbsUp
                      className="
                        h-3.5 w-3.5 fill-illini-orange text-illini-orange
                        md:h-4 md:w-4
                      "
                    />
                    <span
                      className="
                        font-bold text-slate-900
                        md:text-[13px]
                        text-[12px]
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
                        language === 'zh' ? '上一张主图' : 'Previous main image'
                      }
                      onClick={(event) => {
                        event.stopPropagation()
                        setHeroImageIndex(
                          (prev) =>
                            (prev - 1 + heroImages.length) % heroImages.length
                        )
                      }}
                      className="
                        left-3
                        md:left-4
                      "
                    />
                    <InlineImageNavButton
                      direction="next"
                      label={
                        language === 'zh' ? '下一张主图' : 'Next main image'
                      }
                      onClick={(event) => {
                        event.stopPropagation()
                        setHeroImageIndex(
                          (prev) => (prev + 1) % heroImages.length
                        )
                      }}
                      className="
                        right-3
                        md:right-4
                      "
                    />
                    <div
                      className="
                        bottom-3 right-3 bg-black/40 px-2.5 py-1 font-semibold
                        text-white backdrop-blur-sm
                        md:bottom-4 md:right-4
                        absolute rounded-full text-[11px]
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
                gap-6
                md:flex-row md:items-start md:gap-8
                flex flex-col justify-between
              "
            >
              <div
                className="
                  space-y-3
                  md:space-y-4
                  flex-1
                "
              >
                <div className="gap-2 flex flex-wrap items-center">
                  <span
                    className="
                      bg-slate-200/60 px-3 py-1 font-bold text-slate-700
                      md:text-[12px]
                      rounded-full text-[11px]
                    "
                  >
                    {getLocalizedLabel(housingMeta, language)} (
                    {housingMeta.shortLabel})
                  </span>
                  <span
                    className="
                      gap-1 bg-slate-200/60 px-3 py-1 font-bold text-slate-700
                      md:text-[12px]
                      inline-flex items-center rounded-full text-[11px]
                    "
                  >
                    <MapPin className="h-3 w-3" />
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
                      gap-1.5 font-medium text-slate-500
                      md:items-center md:text-[14px]
                      flex items-start text-[13px]
                    "
                  >
                    <MapPin
                      className="
                        mt-0.5 h-4 w-4
                        md:mt-0
                        shrink-0
                      "
                    />
                    <span className="leading-tight">{dormAddress}</span>
                  </div>
                )}

                {positiveTags.length > 0 && (
                  <div className="gap-2 pt-1 flex flex-wrap">
                    {positiveTags.flatMap((tag, i) => {
                      const Icon = TAG_REGISTRY[tag]?.icon
                      if (
                        tag === 'llc' &&
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
                                gap-1 bg-illini-orange/10 px-3 py-1 font-bold
                                text-illini-orange
                                md:text-[13px]
                                inline-flex items-center rounded-full
                                text-[12px]
                              "
                            >
                              {Icon && (
                                <Icon
                                  className="h-3.5 w-3.5"
                                  strokeWidth={1.5}
                                />
                              )}
                              {llcName}
                            </motion.span>
                          )
                        )
                      }
                      return (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.06 }}
                          className="
                            gap-1 bg-illini-orange/10 px-3 py-1 font-bold
                            text-illini-orange
                            md:text-[13px]
                            inline-flex items-center rounded-full text-[12px]
                          "
                        >
                          {Icon && (
                            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                          )}
                          {getDetailTagDisplay(
                            tag,
                            dorm.categorizedTags,
                            language
                          )}
                        </motion.span>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Hard Facts cards */}
              <div
                className="
                  mt-2 gap-2
                  md:mt-0 md:w-auto md:gap-3
                  flex w-full
                "
              >
                {/* AC */}
                <div
                  className={`
                    rounded-2xl p-2 shadow-sm
                    md:h-[100px] md:min-w-[100px] md:flex-none md:p-3
                    flex h-[88px] min-w-[88px] flex-1 flex-col items-center
                    justify-center border
                    ${
                      dorm.ac
                        ? 'border-slate-100 bg-white'
                        : 'border-amber-200 bg-amber-50'
                    }
                  `}
                >
                  {/* Snowflake with strikethrough when no AC */}
                  <div className="mb-1.5 relative">
                    <Snowflake
                      className={`
                        h-5 w-5
                        md:h-6 md:w-6
                        ${dorm.ac ? `text-sky-400` : `text-slate-300`}
                      `}
                      strokeWidth={1.5}
                    />
                    {!dorm.ac && (
                      <div
                        className="
                          inset-0 pointer-events-none absolute flex items-center
                          justify-center
                        "
                      >
                        <div
                          className="
                            bg-red-400 h-[2px] w-[140%] rotate-45 rounded-full
                          "
                        />
                      </div>
                    )}
                  </div>
                  <span
                    className={`
                      font-bold leading-tight
                      md:text-[12px]
                      text-center text-[11px]
                      ${dorm.ac ? `text-slate-700` : `text-amber-700`}
                    `}
                  >
                    {dorm.ac
                      ? language === 'zh'
                        ? '有空调'
                        : 'A/C'
                      : language === 'zh'
                        ? '无空调'
                        : 'No A/C'}
                  </span>
                  {!dorm.ac && (
                    <span
                      className="
                        mt-1 bg-amber-100 px-1.5 py-0.5 font-semibold
                        text-amber-500
                        md:text-[10px]
                        rounded-full text-[9px] leading-none
                      "
                    >
                      {language === 'zh' ? '注意' : 'Note'}
                    </span>
                  )}
                </div>

                {/* Dining */}
                <div
                  className="
                    rounded-2xl border-slate-100 bg-white p-2 shadow-sm
                    md:h-[100px] md:min-w-[100px] md:flex-none md:p-3
                    flex h-[88px] min-w-[88px] flex-1 flex-col items-center
                    justify-center border
                  "
                >
                  <Utensils
                    className="
                      mb-1.5 h-5 w-5
                      md:h-6 md:w-6
                      shrink-0 text-[#52C41A]
                    "
                    strokeWidth={1.5}
                  />
                  <span
                    className="
                      font-bold leading-tight text-slate-700
                      md:text-[12px]
                      text-center text-[11px]
                    "
                  >
                    {diningLabel}
                  </span>
                </div>

                {/* Bathroom */}
                <div
                  className="
                    rounded-2xl border-slate-100 bg-white p-2 shadow-sm
                    md:h-[100px] md:min-w-[100px] md:flex-none md:p-3
                    flex h-[88px] min-w-[88px] flex-1 flex-col items-center
                    justify-center border
                  "
                >
                  <Bath
                    className="
                      mb-1.5 h-5 w-5
                      md:h-6 md:w-6
                      shrink-0 text-[#1890FF]
                    "
                    strokeWidth={1.5}
                  />
                  <span
                    className="
                      font-bold leading-tight text-slate-700
                      md:text-[12px]
                      text-center text-[11px]
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
                  max-w-4xl font-medium leading-relaxed text-slate-600
                  md:text-[15px]
                  text-[14px]
                "
              >
                {dormDesc}
              </p>
              {(dorm.website || dorm.housingType === 'URH') && (
                <a
                  href={dorm.website || 'https://housing.illinois.edu/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    gap-1 bg-slate-100 px-3 py-1.5 font-semibold text-slate-500
                    hover:bg-slate-200
                    md:text-[12px]
                    inline-flex w-fit items-center rounded-full text-[11px]
                    transition-colors
                  "
                >
                  <span>{t.viewWebsite}</span>
                  <ExternalLink className="h-3 w-3" />
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
                  font-bold text-slate-900
                  md:text-[18px]
                  text-[16px]
                "
              >
                {t.amenities}
              </h3>
              <div
                className="
                  gap-2
                  md:gap-2.5
                  flex flex-wrap
                "
              >
                {neutralTags.map((tag, i) => {
                  const Icon = TAG_REGISTRY[tag]?.icon
                  return (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * i }}
                      whileHover={{ y: -2, scale: 1.04 }}
                      className="
                        gap-1.5 rounded-lg border-white/60 bg-white/80 px-2.5
                        py-1 backdrop-blur-md
                        md:rounded-xl md:px-3 md:py-1.5
                        flex cursor-default items-center border
                        shadow-[0_2px_10px_rgba(0,0,0,0.02)]
                      "
                    >
                      {Icon && (
                        <Icon
                          className="
                            h-3.5 w-3.5 text-slate-500
                            md:h-4 md:w-4
                          "
                          strokeWidth={1.5}
                        />
                      )}
                      <span
                        className="
                          font-semibold text-slate-700
                          md:text-[13px]
                          text-[12px]
                        "
                      >
                        {getDetailTagDisplay(
                          tag,
                          dorm.categorizedTags,
                          language
                        )}
                      </span>
                    </motion.div>
                  )
                })}
                {mutedTags.map((tag, i) => {
                  const Icon = TAG_REGISTRY[tag]?.icon
                  return (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * (neutralTags.length + i) }}
                      whileHover={{ y: -2, scale: 1.04 }}
                      className="
                        gap-1.5 rounded-lg border-slate-200/50 bg-slate-100/50
                        px-2.5 py-1
                        md:rounded-xl md:px-3 md:py-1.5
                        flex cursor-default items-center border
                      "
                    >
                      {Icon && (
                        <Icon
                          className="
                            h-3.5 w-3.5 text-slate-400
                            md:h-4 md:w-4
                          "
                          strokeWidth={1.5}
                        />
                      )}
                      <span
                        className="
                          font-semibold text-slate-500
                          md:text-[13px]
                          text-[12px]
                        "
                      >
                        {getDetailTagDisplay(
                          tag,
                          dorm.categorizedTags,
                          language
                        )}
                      </span>
                    </motion.div>
                  )
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
                  mb-4
                  md:mb-6
                  flex items-end justify-between
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
                      font-bold text-slate-900
                      md:text-[18px]
                      text-[16px]
                    "
                  >
                    {language === 'zh'
                      ? '户型图与价格'
                      : 'Floor Plans & Pricing'}
                  </h3>
                  <p
                    className="
                      font-medium text-slate-500
                      md:text-[13px]
                      text-[12px]
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
                    gap-1.5 rounded-xl px-3 py-1.5 font-bold backdrop-blur-md
                    md:px-4 md:py-2 md:text-[13px]
                    flex items-center border text-[12px]
                    shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all
                    ${
                      showPlanCompare
                        ? 'border-illini-blue bg-illini-blue text-white'
                        : `
                          border-white/60 bg-white/80 text-illini-blue
                          hover:bg-white
                          hover:shadow-[0_4px_15px_rgba(0,0,0,0.04)]
                        `
                    }
                  `}
                >
                  <ArrowRightLeft
                    className="
                      h-3.5 w-3.5
                      md:h-4 md:w-4
                    "
                  />
                  {showPlanCompare
                    ? language === 'zh'
                      ? '退出对比'
                      : 'Exit Compare'
                    : t.comparePlans}
                </motion.button>
              </div>

              <div className="space-y-3">
                {sortedPlans.map((plan, idx) => {
                  const resolvedBathroomScope =
                    plan.bathroomScope ?? defaultPlanScope
                  const option = {
                    bedCount: plan.bedCount ?? null,
                    bathroomCount: plan.bathroomCount ?? null,
                    bathroomScope: resolvedBathroomScope,
                    labelCode: plan.labelCode,
                  }
                  const labels = getRoomOptionLabels(option, language)
                  const planKey = getPlanKey(plan, idx)
                  const planPrice = getPublishedPlanPrice(plan)
                  const planBathroomLabel = getBathroomScopeLabel(
                    resolvedBathroomScope,
                    language
                  )
                  const isExpanded = expandedPlanId === planKey
                  const isCompared = compareIds.includes(planKey)
                  const planDisplayTitle =
                    plan.officialName || labels.primaryLabel
                  const normalizedSummary =
                    plan.officialName &&
                    plan.officialName !== labels.primaryLabel
                      ? [labels.primaryLabel, labels.secondaryLabel]
                          .filter(Boolean)
                          .join(' · ')
                      : labels.secondaryLabel
                  const availabilityLabel =
                    plan.available === false
                      ? language === 'zh'
                        ? '暂不可订'
                        : 'Sold out'
                      : planPrice == null
                        ? language === 'zh'
                          ? '价格待公布'
                          : 'Price unavailable'
                        : t.available
                  // Multi-image arrays (fallback to legacy single fields)
                  const photos = plan.photoUrls?.length
                    ? plan.photoUrls
                    : plan.photoUrl
                      ? [plan.photoUrl]
                      : []
                  const layouts = plan.imageUrls?.length
                    ? plan.imageUrls
                    : plan.imageUrl
                      ? [plan.imageUrl]
                      : []
                  const thumbSrc = photos[0] || layouts[0]
                  const hasThumb =
                    Boolean(thumbSrc) && !imageErrors[`${planKey}-thumb`]
                  // Collect all available images for this plan's lightbox
                  const planImages: {
                    src: string
                    alt?: string
                    label?: string
                  }[] = []
                  photos.forEach((src, i) =>
                    planImages.push({
                      src,
                      alt: labels.primaryLabel,
                      label: `${language === 'zh' ? '展示图' : 'Photo'}${photos.length > 1 ? ` ${i + 1}` : ''}`,
                    })
                  )
                  layouts.forEach((src, i) =>
                    planImages.push({
                      src,
                      alt: labels.primaryLabel,
                      label: `${language === 'zh' ? '户型图' : 'Floor Plan'}${layouts.length > 1 ? ` ${i + 1}` : ''}`,
                    })
                  )
                  const safeLayoutIndex =
                    layouts.length > 0
                      ? Math.min(
                          planImageIndices[planKey] ?? 0,
                          layouts.length - 1
                        )
                      : 0
                  const layoutSrc = layouts[safeLayoutIndex]
                  const hasLayout =
                    Boolean(layoutSrc) && !imageErrors[`${planKey}-layout`]
                  const layoutLightboxIndex = photos.length + safeLayoutIndex
                  // Fallback: if no layout diagrams, use photos for the expanded view
                  const allExpandedImages =
                    layouts.length > 0 ? layouts : photos
                  const safeExpandedIndex =
                    allExpandedImages.length > 0
                      ? Math.min(
                          planImageIndices[planKey] ?? 0,
                          allExpandedImages.length - 1
                        )
                      : 0
                  const expandedSrc = allExpandedImages[safeExpandedIndex]
                  const hasExpandedImage =
                    Boolean(expandedSrc) && !imageErrors[`${planKey}-layout`]
                  const expandedLightboxIndex =
                    layouts.length > 0
                      ? photos.length + safeExpandedIndex // layout images are after photos
                      : safeExpandedIndex // photos start at 0

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
                        group rounded-xl border-slate-100 bg-white shadow-sm
                        md:rounded-2xl
                        cursor-pointer overflow-hidden border transition-shadow
                        duration-150
                        hover:-translate-y-px
                        hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]
                      "
                    >
                      <div
                        className="
                          gap-4 p-3
                          md:items-start md:gap-6 md:p-5
                          flex flex-row items-center
                        "
                      >
                        {/* Thumbnail (展示图 > 户型图 > placeholder) */}
                        <div
                          className="
                            h-20 w-20 rounded-lg border-slate-200/60 bg-slate-50
                            group-hover:border-slate-300
                            md:h-28 md:w-36 md:rounded-xl
                            relative shrink-0 overflow-hidden border
                            transition-colors
                          "
                          onClick={(e) => {
                            if (planImages.length > 0) {
                              e.stopPropagation()
                              setLightbox({ images: planImages, index: 0 })
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
                                text-slate-300 flex size-full items-center
                                justify-center
                              "
                            >
                              <SquareDashed
                                className="h-8 w-8"
                                strokeWidth={1}
                              />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div
                          className="
                            min-w-0 gap-1
                            md:h-28 md:flex-row md:gap-0
                            flex flex-1 flex-col justify-between
                          "
                        >
                          {/* Left */}
                          <div
                            className="
                              min-w-0 gap-1.5 py-0.5
                              md:gap-3
                              flex h-full flex-col justify-center
                            "
                          >
                            <div
                              className="
                                gap-2
                                md:justify-start
                                flex w-full items-center justify-between
                              "
                            >
                              <div
                                className="
                                  min-w-0 gap-1.5
                                  md:gap-3
                                  flex flex-wrap items-center
                                "
                              >
                                <h4
                                  className="
                                    font-extrabold text-slate-900
                                    md:text-[18px]
                                    truncate text-[15px]
                                  "
                                >
                                  {planDisplayTitle}
                                </h4>
                                {normalizedSummary && (
                                  <span
                                    className="
                                      font-medium text-slate-500
                                      md:text-[14px]
                                      text-[12px]
                                    "
                                  >
                                    {normalizedSummary}
                                  </span>
                                )}
                                <span
                                  className={`
                                    gap-0.5 rounded-md px-1.5 py-0.5 font-bold
                                    md:gap-1 md:rounded-xl md:px-2.5 md:py-1
                                    md:text-[13px]
                                    flex items-center border text-[10px]
                                    whitespace-nowrap
                                    ${
                                      plan.available === false
                                        ? `
                                          border-red-200 bg-red-50 text-red-600
                                        `
                                        : planPrice == null
                                          ? `
                                            border-amber-200 bg-amber-50
                                            text-amber-700
                                          `
                                          : `
                                            border-[#D1FAE5] bg-[#ECFDF5]
                                            text-[#059669]
                                          `
                                    }
                                  `}
                                >
                                  {plan.available !== false &&
                                    planPrice != null && (
                                      <Check
                                        className="
                                          h-2.5 w-2.5
                                          md:h-3.5 md:w-3.5
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
                                  -mr-1 text-slate-400
                                  md:hidden
                                  flex shrink-0 items-center justify-center
                                "
                              >
                                <ChevronDown className="h-5 w-5" />
                              </motion.div>
                            </div>

                            {/* Specs */}
                            <div
                              className="
                                mt-1 gap-x-1.5 gap-y-1 text-slate-600
                                md:mt-0 md:gap-4
                                flex flex-wrap items-center
                              "
                            >
                              {plan.bedCount != null && (
                                <>
                                  <div
                                    className="
                                      gap-1
                                      md:gap-1.5
                                      flex items-center
                                    "
                                  >
                                    <BedSingle
                                      className="
                                        h-3.5 w-3.5 text-slate-400
                                        md:h-4 md:w-4
                                      "
                                    />
                                    <span
                                      className="
                                        font-semibold
                                        md:text-[14px]
                                        text-[12px]
                                      "
                                    >
                                      {plan.bedSize
                                        ? plan.bedSize
                                        : `${plan.bedCount} ${language === 'zh' ? '张床' : plan.bedCount === 1 ? 'Bed' : 'Beds'}`}
                                    </span>
                                  </div>
                                  <div
                                    className="
                                      h-0.5 w-0.5 bg-slate-300
                                      md:h-1 md:w-1
                                      rounded-full
                                    "
                                  />
                                </>
                              )}
                              <div
                                className="
                                  gap-1
                                  md:gap-1.5
                                  flex items-center
                                "
                              >
                                <Bath
                                  className="
                                    h-3.5 w-3.5 text-slate-400
                                    md:h-4 md:w-4
                                  "
                                />
                                <span
                                  className="
                                    font-semibold
                                    md:text-[14px]
                                    text-[12px]
                                  "
                                >
                                  {plan.bathroomCount != null &&
                                  plan.bathroomCount > 0
                                    ? `${plan.bathroomCount} ${language === 'zh' ? '卫' : plan.bathroomCount === 1 ? 'Bath' : 'Baths'}`
                                    : planBathroomLabel}
                                </span>
                              </div>
                              {plan.sqft && (
                                <>
                                  <div
                                    className="
                                      h-0.5 w-0.5 bg-slate-300
                                      md:h-1 md:w-1
                                      rounded-full
                                    "
                                  />
                                  <div
                                    className="
                                      gap-1
                                      md:gap-1.5
                                      flex items-center
                                    "
                                  >
                                    <SquareDashed
                                      className="
                                        h-3.5 w-3.5 text-slate-400
                                        md:h-4 md:w-4
                                      "
                                    />
                                    <span
                                      className="
                                        font-semibold
                                        md:text-[14px]
                                        text-[12px] tabular-nums
                                      "
                                    >
                                      {plan.sqft}{' '}
                                      {t.sqft ||
                                        (language === 'zh'
                                          ? '平方英尺'
                                          : 'sqft')}
                                      <span
                                        className="
                                          ml-1 font-medium text-slate-400
                                        "
                                      >
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
                                  mt-0.5 gap-1
                                  md:hidden
                                  flex items-baseline
                                "
                              >
                                <span
                                  className="
                                    font-extrabold tracking-tight text-slate-900
                                    text-[16px] tabular-nums
                                  "
                                >
                                  {formatPrice(planPrice)}
                                </span>
                                <span
                                  className="
                                    font-medium text-slate-500 text-[11px]
                                  "
                                >
                                  {t.yr}
                                </span>
                                <span
                                  className="
                                    ml-1 font-medium text-slate-400 text-[11px]
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
                                  mt-0.5 font-semibold
                                  md:hidden
                                  text-[12px]
                                  ${
                                    plan.available === false
                                      ? `text-red-500`
                                      : `text-amber-600`
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
                                  e.stopPropagation()
                                  toggleCompare(planKey)
                                }}
                                className={`
                                  mt-1 gap-1.5 rounded-lg px-2.5 py-1
                                  font-semibold
                                  md:hidden
                                  flex items-center border text-[11px]
                                  transition-colors
                                  ${
                                    isCompared
                                      ? `
                                        border-illini-blue/30 bg-illini-blue/5
                                        text-illini-blue
                                      `
                                      : `
                                        border-slate-200 bg-white text-slate-500
                                      `
                                  }
                                `}
                              >
                                <div
                                  className={`
                                    h-3 w-3 flex items-center justify-center
                                    rounded-[3px] border transition-colors
                                    ${
                                      isCompared
                                        ? `
                                          border-illini-blue bg-illini-blue
                                          text-white
                                        `
                                        : `border-slate-300`
                                    }
                                  `}
                                >
                                  {isCompared && (
                                    <Check
                                      className="h-2 w-2"
                                      strokeWidth={3}
                                    />
                                  )}
                                </div>
                                {t.compareAdd}
                              </motion.button>
                            )}
                          </div>

                          {/* Right: desktop price + actions */}
                          <div
                            className="
                              gap-2 py-0.5
                              md:flex
                              hidden h-full shrink-0 flex-col items-end
                              justify-between
                            "
                          >
                            {planPrice != null ? (
                              <div className="flex flex-col items-end">
                                <div className="gap-0.5 flex items-baseline">
                                  <span
                                    className="
                                      font-extrabold tracking-tight
                                      text-slate-900 text-[24px] tabular-nums
                                    "
                                  >
                                    {formatPrice(planPrice)}
                                  </span>
                                  <span
                                    className="
                                      font-medium text-slate-500 text-[13px]
                                    "
                                  >
                                    {t.yr}
                                  </span>
                                </div>
                                <div
                                  className="
                                    mt-1 rounded-md bg-slate-100 px-1.5 py-0.5
                                    font-medium text-slate-500 inline-flex
                                    items-center text-[12px] tabular-nums
                                  "
                                >
                                  ~{formatPrice(Math.round(planPrice / 12))}
                                  {t.mo}
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`
                                  font-semibold text-[13px]
                                  ${
                                    plan.available === false
                                      ? `text-red-500`
                                      : `text-amber-600`
                                  }
                                `}
                              >
                                {availabilityLabel}
                              </div>
                            )}

                            <div className="gap-3 flex items-center">
                              {showPlanCompare && (
                                <motion.button
                                  type="button"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleCompare(planKey)
                                  }}
                                  className={`
                                    gap-1.5 rounded-lg px-3 py-1.5 font-semibold
                                    flex items-center border text-[12px]
                                    transition-colors
                                    ${
                                      isCompared
                                        ? `
                                          border-illini-blue/30 bg-illini-blue/5
                                          text-illini-blue
                                        `
                                        : `
                                          border-slate-200 bg-white
                                          text-slate-500
                                          hover:border-slate-300
                                          hover:text-slate-700
                                        `
                                    }
                                  `}
                                >
                                  <div
                                    className={`
                                      h-3.5 w-3.5 flex items-center
                                      justify-center rounded-[4px] border
                                      transition-colors
                                      ${
                                        isCompared
                                          ? `
                                            border-illini-blue bg-illini-blue
                                            text-white
                                          `
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
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 15,
                                          }}
                                        >
                                          <Check
                                            className="h-2.5 w-2.5"
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
                                  h-8 w-8 bg-slate-50
                                  group-hover:bg-slate-100
                                  flex items-center justify-center rounded-full
                                  transition-colors
                                "
                              >
                                <ChevronDown className="h-5 w-5 text-slate-400" />
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
                            <div
                              className="
                                mx-4 mt-2 border-slate-100/50 p-4 pt-0
                                md:mx-5 md:p-5
                                border-t
                              "
                            >
                              {hasExpandedImage ? (
                                <div
                                  className="
                                    mt-3
                                    md:mt-4
                                    relative
                                  "
                                >
                                  <img
                                    src={expandedSrc}
                                    alt={`${labels.primaryLabel} floor plan`}
                                    className="
                                      rounded-xl border-slate-200/50 bg-slate-50
                                      h-auto w-full cursor-zoom-in border
                                      transition-opacity
                                      hover:opacity-90
                                    "
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setLightbox({
                                        images: planImages,
                                        index: expandedLightboxIndex,
                                      })
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
                                          language === 'zh'
                                            ? '上一张户型图'
                                            : 'Previous floor plan image'
                                        }
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setPlanImageIndices((prev) => ({
                                            ...prev,
                                            [planKey]:
                                              (safeExpandedIndex -
                                                1 +
                                                allExpandedImages.length) %
                                              allExpandedImages.length,
                                          }))
                                        }}
                                        className="left-3"
                                      />
                                      <InlineImageNavButton
                                        direction="next"
                                        label={
                                          language === 'zh'
                                            ? '下一张户型图'
                                            : 'Next floor plan image'
                                        }
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setPlanImageIndices((prev) => ({
                                            ...prev,
                                            [planKey]:
                                              (safeExpandedIndex + 1) %
                                              allExpandedImages.length,
                                          }))
                                        }}
                                        className="right-3"
                                      />
                                      <div
                                        className="
                                          bottom-3 right-3 bg-black/40 px-2.5
                                          py-1 font-semibold text-white
                                          backdrop-blur-sm absolute rounded-full
                                          text-[11px]
                                        "
                                      >
                                        {safeExpandedIndex + 1} /{' '}
                                        {allExpandedImages.length}
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div
                                  className="
                                    mt-3 rounded-xl border-slate-200/50
                                    bg-slate-50/50 p-6 font-medium
                                    text-slate-400
                                    md:mt-4 md:p-8 md:text-[14px]
                                    flex items-center justify-center border
                                    border-dashed text-[13px]
                                  "
                                >
                                  {language === 'zh'
                                    ? '暂无户型图'
                                    : 'Floor plan image unavailable'}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
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
                        )
                        return idx >= 0 ? { plan: sortedPlans[idx], idx } : null
                      })
                      .filter(
                        (x): x is { plan: FloorPlan; idx: number } => x !== null
                      )
                    if (compared.length < 2) return null

                    const rows: { label: string; values: string[] }[] = [
                      {
                        label: language === 'zh' ? '房型' : 'Room Type',
                        values: compared.map(({ plan }) => {
                          const opt = {
                            bedCount: plan.bedCount ?? null,
                            bathroomCount: plan.bathroomCount ?? null,
                            bathroomScope:
                              plan.bathroomScope ?? defaultPlanScope,
                            labelCode: plan.labelCode,
                          }
                          return (
                            plan.officialName ||
                            getRoomOptionLabels(opt, language).primaryLabel
                          )
                        }),
                      },
                      {
                        label: language === 'zh' ? '床位' : 'Beds',
                        values: compared.map(({ plan }) =>
                          plan.bedSize
                            ? plan.bedSize
                            : plan.bedCount != null
                              ? `${plan.bedCount}`
                              : '—'
                        ),
                      },
                      {
                        label: language === 'zh' ? '卫浴' : 'Bathroom',
                        values: compared.map(({ plan }) => {
                          const scope = plan.bathroomScope ?? defaultPlanScope
                          if (
                            plan.bathroomCount != null &&
                            plan.bathroomCount > 0
                          ) {
                            return `${plan.bathroomCount} ${language === 'zh' ? '卫' : plan.bathroomCount === 1 ? 'Bath' : 'Baths'} · ${getBathroomScopeLabel(scope, language)}`
                          }
                          return getBathroomScopeLabel(scope, language)
                        }),
                      },
                      {
                        label: language === 'zh' ? '面积' : 'Area',
                        values: compared.map(({ plan }) =>
                          plan.sqft
                            ? `${plan.sqft} sqft (~${Math.round(plan.sqft * 0.092903)}㎡)`
                            : '—'
                        ),
                      },
                      {
                        label: language === 'zh' ? '年租金' : 'Annual Price',
                        values: compared.map(({ plan }) => {
                          const p = getPublishedPlanPrice(plan)
                          return p != null
                            ? `${formatPrice(p)}${t.yr}`
                            : plan.available === false
                              ? language === 'zh'
                                ? '暂不可订'
                                : 'Sold out'
                              : '—'
                        }),
                      },
                      {
                        label: language === 'zh' ? '月租金' : 'Monthly',
                        values: compared.map(({ plan }) => {
                          const p = getPublishedPlanPrice(plan)
                          return p != null
                            ? `~${formatPrice(Math.round(p / 12))}${t.mo}`
                            : '—'
                        }),
                      },
                    ]

                    return (
                      <motion.div
                        key="plan-compare-table"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="mt-4 overflow-hidden"
                      >
                        <div
                          className="
                            rounded-xl border-illini-blue/20 bg-white
                            md:rounded-2xl
                            overflow-x-auto border
                            shadow-[0_4px_20px_rgba(19,41,75,0.06)]
                          "
                        >
                          <div
                            className="
                              gap-2 border-slate-100 px-4 py-3
                              md:px-5 md:py-4
                              flex items-center border-b
                            "
                          >
                            <ArrowRightLeft className="h-4 w-4 text-illini-blue" />
                            <span
                              className="
                                font-bold text-slate-900
                                md:text-[15px]
                                text-[14px]
                              "
                            >
                              {language === 'zh'
                                ? '房型对比'
                                : 'Plan Comparison'}
                            </span>
                            <span
                              className="
                                font-medium text-slate-400 ml-auto text-[12px]
                              "
                            >
                              {compared.length}{' '}
                              {language === 'zh' ? '个房型' : 'plans'}
                            </span>
                          </div>
                          <table
                            className="
                              md:text-[13px]
                              w-full text-[12px]
                            "
                          >
                            <tbody>
                              {rows.map((row, ri) => (
                                <tr
                                  key={ri}
                                  className={
                                    ri % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'
                                  }
                                >
                                  <td
                                    className="
                                      border-slate-100 px-4 py-2.5 font-semibold
                                      text-slate-500
                                      md:w-[120px] md:px-5 md:py-3
                                      w-[100px] border-r whitespace-nowrap
                                    "
                                  >
                                    {row.label}
                                  </td>
                                  {row.values.map((val, ci) => (
                                    <td
                                      key={ci}
                                      className="
                                        border-slate-100 px-3 py-2.5
                                        font-semibold text-slate-800
                                        md:px-4 md:py-3
                                        min-w-[100px] border-r text-center
                                        last:border-r-0
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
                    )
                  })()}
              </AnimatePresence>

              {/* Price range footer */}
              {minPrice !== null && maxPrice !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="
                    mt-4 rounded-xl border-white/50 bg-white/60 p-4
                    backdrop-blur-md
                    md:rounded-2xl md:p-5
                    flex items-center justify-between border
                    shadow-[0_4px_20px_rgba(0,0,0,0.02)]
                  "
                >
                  <span
                    className="
                      font-semibold text-slate-600
                      md:text-[14px]
                      text-[13px]
                    "
                  >
                    {t.priceRange}
                  </span>
                  <span
                    className="
                      font-extrabold text-slate-900
                      md:text-[18px]
                      text-[16px]
                    "
                  >
                    {formatPrice(minPrice)}
                    {minPrice !== maxPrice ? ` – ${formatPrice(maxPrice)}` : ''}
                  </span>
                </motion.div>
              )}
            </motion.section>
          )}

          {/* ── Reviews ── */}
          <motion.section
            id="reviews"
            variants={fadeUp}
            className="space-y-4 border-slate-200/50 pb-8 pt-6 border-t"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3
                className="
                  font-bold text-slate-900
                  md:text-[18px]
                  text-[16px]
                "
              >
                {t.ratingsAndReviews}
              </h3>
              {totalReviews > 0 && (
                <span
                  className="
                    font-medium text-slate-500
                    md:text-[13px]
                    text-[12px]
                  "
                >
                  {totalReviews} {language === 'zh' ? '条评价' : 'Reviews'}
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
                  gap-4 rounded-xl border-illini-blue/10 bg-white/60 p-5
                  backdrop-blur-md
                  sm:flex-row
                  md:rounded-2xl md:p-6
                  flex flex-col items-center justify-between border
                  shadow-[0_4px_20px_rgba(0,0,0,0.02)]
                "
              >
                <div
                  className="
                    gap-3
                    sm:w-auto
                    flex w-full items-center
                  "
                >
                  <div
                    className="
                      h-10 w-10 bg-illini-blue/5
                      md:h-12 md:w-12
                      flex shrink-0 items-center justify-center rounded-full
                    "
                  >
                    <MessageSquare
                      className="
                        h-5 w-5 text-illini-blue
                        md:h-6 md:w-6
                      "
                    />
                  </div>
                  <div>
                    <h4
                      className="
                        font-bold text-slate-900
                        md:text-[15px]
                        text-[14px]
                      "
                    >
                      {t.shareExp}
                    </h4>
                    <p
                      className="
                        mt-0.5 font-medium text-slate-500
                        md:text-[13px]
                        text-[12px]
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
                    rounded-xl bg-illini-blue px-5 py-2.5 font-bold text-white
                    shadow-sm
                    hover:bg-illini-blue/90
                    sm:w-auto
                    md:text-[14px]
                    w-full text-[13px] transition-colors
                  "
                >
                  {t.loginBtn}
                </motion.button>
              </motion.div>
            ) : (
              <div
                className="
                  rounded-xl border-white/60 bg-white/80 p-4 backdrop-blur-md
                  md:rounded-2xl md:p-5
                  border shadow-[0_4px_20px_rgba(0,0,0,0.02)]
                "
              >
                <h4
                  className="
                    mb-3 font-bold text-slate-900
                    md:text-[15px]
                    text-[14px]
                  "
                >
                  {t.shareExp}
                </h4>
                <div className="mb-3 gap-2 flex">
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
                        gap-1.5 rounded-lg px-3 py-1.5 font-semibold flex
                        items-center border text-[12px] transition-colors
                        ${
                          commentVote === vote && vote === 1
                            ? `
                              border-illini-orange/30 bg-illini-orange/10
                              text-illini-orange
                            `
                            : commentVote === vote && vote === -1
                              ? 'border-red-200 bg-red-50 text-red-600'
                              : `
                                border-slate-200 bg-white text-slate-500
                                hover:border-slate-300
                              `
                        }
                      `}
                    >
                      <ThumbsUp
                        className={`
                          h-3.5 w-3.5
                          ${vote === -1 ? 'rotate-180' : ''}
                          ${
                            commentVote === vote && vote === 1
                              ? `fill-illini-orange/20`
                              : ''
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
                    rounded-xl border-slate-200 bg-white/50 px-3 py-2.5
                    font-medium placeholder-slate-400
                    focus:border-illini-blue/40
                    md:text-[14px]
                    w-full resize-none border text-[13px] transition-colors
                    focus:outline-none
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
                      rounded-xl bg-illini-blue px-5 py-2 font-bold text-white
                      hover:bg-illini-blue/90
                      md:text-[14px]
                      text-[13px] transition-colors
                      disabled:opacity-40
                    "
                  >
                    {submitting ? '...' : t.submitComment}
                  </motion.button>
                </div>
              </div>
            )}

            {/* Comment list */}
            {commentsLoading ? (
              <div className="py-6 text-slate-400 text-center text-[13px]">
                {language === 'zh' ? '加载中...' : 'Loading...'}
              </div>
            ) : comments.length === 0 ? (
              <p className="py-6 text-slate-400 text-center text-[13px]">
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
                          rounded-xl border-white/60 bg-white/80 p-4
                          backdrop-blur-md
                          md:rounded-2xl md:p-5
                          border shadow-[0_4px_20px_rgba(0,0,0,0.02)]
                        "
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div className="gap-2.5 flex items-center">
                            <div
                              className="
                                h-8 w-8 border-slate-200 bg-slate-100 flex
                                items-center justify-center rounded-full border
                              "
                            >
                              <User className="h-4 w-4 text-slate-400" />
                            </div>
                            <div>
                              <div
                                className="
                                  font-bold leading-tight text-slate-900
                                  md:text-[14px]
                                  text-[13px]
                                "
                              >
                                {comment.display_name}
                              </div>
                              <div
                                className="
                                  mt-0.5 font-medium text-slate-500
                                  md:text-[12px]
                                  text-[11px]
                                "
                              >
                                {new Date(
                                  comment.created_at
                                ).toLocaleDateString(
                                  language === 'zh' ? 'zh-CN' : 'en-US',
                                  { year: 'numeric', month: 'short' }
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="gap-2 flex items-center">
                            {comment.dorm_vote === 1 && (
                              <div
                                className="
                                  gap-1 rounded-lg bg-illini-orange/10 px-2 py-1
                                  flex items-center
                                "
                              >
                                <ThumbsUp
                                  className="
                                    h-3 w-3 fill-illini-orange
                                    text-illini-orange
                                  "
                                />
                                <span
                                  className="
                                    font-bold text-illini-orange text-[11px]
                                  "
                                >
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
                                  p-1 text-slate-300
                                  hover:text-red-400
                                  transition-colors
                                "
                                aria-label={t.deleteComment}
                              >
                                <X className="h-3.5 w-3.5" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                        {translations[comment.id] ? (
                          <>
                            <p
                              className="
                                font-medium leading-relaxed text-slate-600
                                md:text-[14px]
                                text-[13px]
                              "
                            >
                              {translations[comment.id]}
                            </p>
                            <p
                              className="
                                mt-1.5 border-slate-200 pl-3 leading-relaxed
                                text-slate-400 border-l-2 text-[12px]
                              "
                            >
                              {comment.content}
                            </p>
                          </>
                        ) : (
                          <p
                            className="
                              font-medium leading-relaxed text-slate-600
                              md:text-[14px]
                              text-[13px]
                            "
                          >
                            {comment.content}
                          </p>
                        )}
                        {translateErrors[comment.id] && (
                          <p className="mt-1 text-red-400 text-[12px]">
                            {language === 'zh'
                              ? '翻译失败，点击重试'
                              : 'Translation failed, click to retry'}
                          </p>
                        )}
                        <div
                          className="
                            mt-4 gap-4 border-slate-100/50 pt-3 flex
                            items-center border-t
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
                              group gap-1.5 flex items-center transition-colors
                              ${
                                comment.myVote === 1
                                  ? 'text-illini-orange'
                                  : `
                                    text-slate-400
                                    hover:text-illini-orange
                                  `
                              }
                            `}
                          >
                            <ThumbsUp
                              className={`
                                h-3.5 w-3.5
                                ${
                                  comment.myVote === 1
                                    ? `fill-illini-orange/20`
                                    : `group-hover:fill-illini-orange/20`
                                }
                              `}
                            />
                            <span className="font-semibold text-[12px]">
                              {t.helpful}
                              {comment.upvotes > 0
                                ? ` (${comment.upvotes})`
                                : ''}
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
                                gap-1 font-semibold text-slate-400
                                hover:text-illini-blue
                                flex items-center text-[12px] transition-colors
                                disabled:opacity-50
                              "
                            >
                              <Globe className="h-3.5 w-3.5" />
                              {translating[comment.id]
                                ? language === 'zh'
                                  ? '翻译中...'
                                  : 'Translating...'
                                : translations[comment.id]
                                  ? language === 'zh'
                                    ? '显示原文'
                                    : 'Original'
                                  : language === 'zh'
                                    ? '翻译'
                                    : 'Translate'}
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
                      rounded-xl border-white/50 bg-white/40 py-3 font-semibold
                      text-slate-500 backdrop-blur-md
                      hover:bg-white/60 hover:text-slate-800
                      md:text-[14px]
                      w-full border text-[13px] transition-colors
                    "
                  >
                    {showAllReviews
                      ? language === 'zh'
                        ? '收起'
                        : 'Show less'
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
            setDorm(updated)
            setEditOpen(false)
            void refreshDorms()
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
            bottom-20 right-6 gap-2 bg-illini-blue px-4 py-2.5 font-bold
            text-white shadow-lg
            hover:bg-illini-blue/90
            fixed z-50 flex items-center rounded-full text-[13px]
            transition-colors
          "
        >
          <Pencil className="h-3.5 w-3.5" />
          {language === 'zh' ? '编辑' : 'Edit'}
        </motion.button>
      )}
    </motion.div>
  )
}

export default DormDetail
