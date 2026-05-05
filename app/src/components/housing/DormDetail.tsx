import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ArrowLeft, Heart, Pencil } from "lucide-react";
import { formatPrice } from "./constants/pricing";
import { TAG_REGISTRY } from "./constants/metadata";
import { useSharedDormInteraction } from "./store/DormUserInteractionContext";
import { useDormData } from "./store/DormDataContext";
import { useAuth } from "../../contexts/AuthContext";
import { dormService } from "../../services/dormService";
import { useDormComments } from "./hooks/useDormComments";
import { Dorm, DormTag } from "./types/index";
import { Language } from "../../types";
import DormEditPanel from "./DormEditPanel";
import ImageLightbox from "./ImageLightbox";
import { dormDetailTexts } from "./i18n/dormTexts";
import { getStorageBathroomScope, normalizeFloorPlan } from "../../utils/roomOptions";
import { useLayout } from "../../contexts/LayoutContext";
import { DormDetailHeader } from "./DormDetailHeader";
import { DormDetailGallery } from "./DormDetailGallery";
import { DormDetailInfo } from "./DormDetailInfo";
import { DormDetailReviews } from "./DormDetailReviews";
import { DormDetailFloorPlans } from "./DormDetailFloorPlans";

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

const hasPublishedPlanPrice = (price: any): price is number =>
  typeof price === "number" && Number.isFinite(price) && price > 0;
const getPublishedPlanPrice = (plan: any) => (hasPublishedPlanPrice(plan.price) ? plan.price : null);

interface DormDetailProps {
  language?: Language;
}

const DormDetail: React.FC<DormDetailProps> = ({ language = "en" }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { addToHistory, toggleFavorite, isFavorite } = useSharedDormInteraction();
  const { user, requestLogin } = useAuth();
  const { getDormById: getFromContext, refreshDorms } = useDormData();
  const { setMobileHeaderSlot } = useLayout();
  const dormId = id ?? "";
  const { comments, loading: commentsLoading, saveComment, deleteComment, voteOnComment, thumbsUp } = useDormComments(dormId);

  const totalReviews = comments.length;
  const positivePercent = totalReviews > 0 ? Math.round((thumbsUp / totalReviews) * 100) : null;

  const [dorm, setDorm] = useState<Dorm | undefined>(getFromContext(dormId));
  const [editOpen, setEditOpen] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [lightbox, setLightbox] = useState<{ images: { src: string; alt?: string; label?: string }[]; index: number } | null>(null);

  const t = dormDetailTexts[language];

  useEffect(() => {
    if (!id) return;
    const fromCtx = getFromContext(id);
    if (fromCtx) setDorm(fromCtx);
    dormService.getDormById(id).then((d) => {
      if (d) setDorm(d);
    });
  }, [id]);

  useEffect(() => {
    if (dorm) addToHistory(dorm);
  }, [dorm?.id, addToHistory]);

  useEffect(() => {
    setHeroImageIndex(0);
  }, [dorm?.id]);

  useEffect(() => {
    if (location.hash === "#reviews" && dorm) {
      const el = document.getElementById("reviews");
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
      }
    }
  }, [location.hash, dorm?.id]);

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
          className="flex shrink-0 items-center gap-1 text-slate-500 transition-colors hover:text-illini-blue"
        >
          <ArrowLeft className="size-4" />
          <span className="text-[13px] font-semibold">{language === "zh" ? "返回" : "Back"}</span>
        </button>
        <div className="flex-1" />
        <div className="flex shrink-0 items-center gap-1">
          {user?.isAdmin && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-full p-1.5 text-slate-400 transition-colors hover:text-illini-blue"
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
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:text-illini-orange"
          >
            <Heart
              className={`size-5 transition-colors duration-200 ${isFavorite(dorm.id) ? "fill-illini-orange text-illini-orange" : ""}`}
            />
          </button>
        </div>
      </div>
    );
    return () => {
      setMobileHeaderSlot(null);
    };
  }, [dorm, language, user?.isAdmin, navigate, toggleFavorite, isFavorite, setMobileHeaderSlot]);

  if (!dorm) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-700">{t.dormNotFound}</h2>
        <button type="button" onClick={() => navigate("/dorms")} className="mt-4 text-illini-blue hover:underline">
          {t.backToDorms}
        </button>
      </div>
    );
  }

  const isSaved = isFavorite(dorm.id);
  const dormName = language === "zh" && dorm.name_zh ? dorm.name_zh : dorm.name;
  const dormDesc = language === "zh" && dorm.description_zh ? dorm.description_zh : dorm.description;
  const dormLocation = language === "zh" && dorm.location_zh ? dorm.location_zh : dorm.location;
  const dormAddress = language === "zh" && dorm.address_zh ? dorm.address_zh : dorm.address ?? null;
  const heroImages = (dorm.galleryImages?.length ? dorm.galleryImages : [dorm.imageUrl]).filter((src): src is string => Boolean(src));
  const safeHeroImageIndex = heroImages.length > 0 ? Math.min(heroImageIndex, heroImages.length - 1) : 0;
  const heroImage = heroImages[safeHeroImageIndex];

  const allTags: DormTag[] = [
    ...(dorm.categorizedTags?.livingConditions ?? []),
    ...(dorm.categorizedTags?.facilities ?? []),
    ...(dorm.categorizedTags?.lifestyle ?? []),
  ];
  const positiveTags = allTags.filter((t) => TAG_REGISTRY[t]?.cardTone === "positive");
  const neutralTags = allTags.filter((t) => TAG_REGISTRY[t]?.cardTone === "neutral");
  const mutedTags = allTags.filter((t) => TAG_REGISTRY[t]?.cardTone === "muted");

  const defaultPlanScope = getStorageBathroomScope(dorm.bathroomType, dorm.floorPlans);

  const sortedPlans = (dorm.floorPlans ?? [])
    .map((p) => normalizeFloorPlan(p, p.bathroomScope ?? defaultPlanScope))
    .sort((a, b) => {
      const bedDelta = (a.bedCount ?? 99) - (b.bedCount ?? 99);
      if (bedDelta !== 0) return bedDelta;
      const priceDelta =
        (getPublishedPlanPrice(a) ?? Number.POSITIVE_INFINITY) - (getPublishedPlanPrice(b) ?? Number.POSITIVE_INFINITY);
      if (priceDelta !== 0) return priceDelta;
      return (a.officialName ?? a.labelCode ?? "").localeCompare(b.officialName ?? b.labelCode ?? "");
    });

  const pricedPlans = sortedPlans.filter((plan) => getPublishedPlanPrice(plan) != null);
  const minPrice = pricedPlans.length ? Math.min(...pricedPlans.map((plan) => getPublishedPlanPrice(plan) as number)) : null;
  const maxPrice = pricedPlans.length ? Math.max(...pricedPlans.map((plan) => getPublishedPlanPrice(plan) as number)) : null;

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="no-scrollbar size-full overflow-y-auto bg-slate-50 pb-24 font-sans text-slate-800"
      style={{ marginRight: editOpen ? "32rem" : 0, transition: "margin-right 0.3s ease-in-out" }}
    >
      <div className="sticky top-0 z-40 hidden border-b border-white/50 bg-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-xl md:block">
        <div className="mx-auto flex h-14 max-w-[1000px] items-center justify-between px-6">
          <button
            type="button"
            onClick={() => navigate("/dorms")}
            className="group flex items-center gap-1.5 py-2 text-slate-500 transition-colors hover:text-illini-blue"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-[14px] font-semibold">{t.backToBrowse}</span>
          </button>

          <div className="flex items-center gap-1">
            {user?.isAdmin && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100/50 hover:text-illini-blue"
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
              className="-mr-1 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100/50 hover:text-illini-orange"
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
                    className={`size-5 transition-colors duration-200 ${isSaved ? "fill-illini-orange text-illini-orange" : ""}`}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      <main className="mx-auto mt-0 max-w-[1000px] px-4 md:mt-8 md:px-6">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8 md:space-y-10">
          <motion.section variants={fadeUp} className="space-y-5 md:space-y-6">
            <DormDetailGallery
              heroImage={heroImage}
              heroImages={heroImages}
              heroImageIndex={safeHeroImageIndex}
              setHeroImageIndex={setHeroImageIndex}
              dormName={dormName}
              dormDesc={dormDesc}
              website={dorm.website}
              housingType={dorm.housingType}
              positivePercent={positivePercent}
              totalReviews={totalReviews}
              language={language}
              onImageClick={() => {
                const gallery = heroImages.map((src, i) => ({ src, alt: `${dormName} ${i + 1}` }));
                setLightbox({ images: gallery, index: safeHeroImageIndex });
              }}
              onReviewClick={() => {
                document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />

            <DormDetailHeader
              dorm={dorm}
              language={language}
              dormName={dormName}
              dormAddress={dormAddress}
              dormLocation={dormLocation}
              positiveTags={positiveTags}
              fadeUp={fadeUp}
            />
          </motion.section>

          <DormDetailInfo
            neutralTags={neutralTags}
            mutedTags={mutedTags}
            categorizedTags={dorm.categorizedTags}
            language={language}
            fadeUp={fadeUp}
          />

          <DormDetailFloorPlans
            sortedPlans={sortedPlans}
            defaultPlanScope={defaultPlanScope}
            minPrice={minPrice}
            maxPrice={maxPrice}
            language={language}
            fadeUp={fadeUp}
            onLightboxOpen={(images, index) => setLightbox({ images, index })}
          />

          <DormDetailReviews
            comments={comments}
            commentsLoading={commentsLoading}
            user={user}
            language={language}
            fadeUp={fadeUp}
            onRequestLogin={requestLogin}
            onSaveComment={saveComment}
            onDeleteComment={deleteComment}
            onVoteOnComment={voteOnComment}
          />
        </motion.div>
      </main>

      <AnimatePresence>
        {lightbox && (
          <ImageLightbox images={lightbox.images} initialIndex={Math.max(lightbox.index, 0)} onClose={() => setLightbox(null)} />
        )}
      </AnimatePresence>

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

      {user?.isAdmin && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setEditOpen(true)}
          className="fixed right-6 bottom-20 z-50 flex items-center gap-2 rounded-full bg-illini-blue px-4 py-2.5 text-[13px] font-bold text-white shadow-lg transition-colors hover:bg-illini-blue/90"
        >
          <Pencil className="size-3.5" />
          {language === "zh" ? "编辑" : "Edit"}
        </motion.button>
      )}
    </motion.div>
  );
};

export default DormDetail;
