import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UIUC_DORMS } from '../../constants/housing/dormData';
import { formatPrice } from '../../constants/housing/pricing';
import { useSharedDormInteraction } from '../../contexts/DormUserInteractionContext';
import FloorPlanSection from './FloorPlanSection';
import { Language } from '../../types';
import { dormDetailTexts } from './i18n/dormTexts';
import DormHeroSection from './dorm-detail/sections/DormHeroSection';
import DormProsConsSection from './dorm-detail/sections/DormProsConsSection';
import DormQuickStatsSection from './dorm-detail/sections/DormQuickStatsSection';

interface DormDetailProps {
    language?: Language;
}

const DormDetail: React.FC<DormDetailProps> = ({ language = 'en' }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToHistory, toggleFavorite, isFavorite } = useSharedDormInteraction();
    const dorm = UIUC_DORMS.find((d) => d.id === id);
    const isSaved = dorm ? isFavorite(dorm.id) : false;

    const t = dormDetailTexts[language];

    useEffect(() => {
        if (dorm) {
            addToHistory(dorm);
        }
    }, [dorm, addToHistory]);

    if (!dorm) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-700">{t.dormNotFound}</h2>
                <button
                    type="button"
                    onClick={() => navigate('/dorms')}
                    className="mt-4 text-illini-blue hover:underline"
                >
                    {t.backToDorms}
                </button>
            </div>
        );
    }

    const dormName = language === 'zh' && dorm.name_zh ? dorm.name_zh : dorm.name;
    const dormDescription =
        language === 'zh' && dorm.description_zh ? dorm.description_zh : dorm.description;
    const dormPros = language === 'zh' && dorm.pros_zh?.length ? dorm.pros_zh : dorm.pros;
    const dormCons = language === 'zh' && dorm.cons_zh?.length ? dorm.cons_zh : dorm.cons;

    return (
        <div className="h-full overflow-y-auto w-full no-scrollbar">
            <div className="max-w-6xl mx-auto px-4 sm:px-5 py-8 pb-32 md:pt-14 md:px-6">
                <button
                    onClick={() => navigate('/dorms')}
                    type="button"
                    className="group flex items-center text-gray-500 hover:text-illini-blue mb-6 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    {t.backToBrowse}
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <DormHeroSection dorm={dorm} dormName={dormName} campusLabel={t.campus} />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x divide-gray-100">
                        <div className="col-span-2 p-8 space-y-8">
                            <section>
                                <h2 className="text-2xl font-bold text-illini-blue mb-4">{t.about}</h2>
                                <p className="text-gray-600 leading-relaxed text-lg">{dormDescription}</p>
                            </section>

                            <DormProsConsSection
                                title={t.prosAndCons}
                                goodLabel={t.good}
                                notSoGoodLabel={t.notSoGood}
                                pros={dormPros}
                                cons={dormCons}
                            />

                            {dorm.floorPlans && dorm.floorPlans.length > 0 && (
                                <FloorPlanSection
                                    floorPlans={dorm.floorPlans}
                                    language={language === 'zh' ? 'zh' : 'en'}
                                />
                            )}
                        </div>

                        <div className="col-span-1 p-8 bg-gray-50/50 space-y-6">
                            <DormQuickStatsSection
                                dorm={dorm}
                                language={language}
                                quickStatsLabel={t.quickStats}
                                roomTypeLabel={t.roomType}
                                diningHallLabel={t.diningHall}
                                onSiteLabel={t.onSite}
                                nearbyLabel={t.nearby}
                                annualPriceLabel={t.annualPrice}
                                formatPrice={formatPrice}
                            />

                            <div className="pt-6 border-t border-gray-200">
                                <div className="bg-blue-100 rounded-lg p-4">
                                    <h4 className="text-illini-blue font-bold text-sm mb-2">{t.illiniTip}</h4>
                                    <p className="text-blue-800 text-xs leading-relaxed">
                                        {dorm.ac ? t.tipWithAc : t.tipWithoutAc}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    await toggleFavorite(dorm.id, dorm.name, dorm.name_zh);
                                }}
                                type="button"
                                className={`w-full py-3 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 ${isSaved
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-illini-orange hover:bg-illini-orange-dark'
                                    }`}
                            >
                                {isSaved ? t.saved : t.save}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DormDetail;
