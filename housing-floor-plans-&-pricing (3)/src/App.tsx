import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, ChevronDown, SquareDashed, MapPin, 
  Utensils, BookOpen, Music, ArrowLeft, 
  ThumbsUp, Snowflake, Bath, Palette, Users,
  MessageSquare, User, Heart, ExternalLink, ArrowRightLeft, Globe, BedSingle, Armchair
} from 'lucide-react';

type Lang = 'zh' | 'en';

const dict = {
  zh: {
    back: "返回宿舍列表",
    backShort: "返回",
    title: "iGuide",
    urh: "URH 校内宿舍",
    southCampus: "South Campus",
    positiveRating: "85% 好评",
    noAc: "无空调",
    dining: "自带食堂",
    communalBath: "公共卫浴",
    desc: "Allen Hall 是 UIUC 最具艺术和包容气息的宿舍之一，也是 Unit One 学习生活社区（LLC）的所在地。这里提供丰富的客座教授讲座、音乐练习室、陶艺工作室和暗房。虽然没有空调，但其独特的社区氛围和便利的食堂使其成为许多新生的首选。",
    viewWebsite: "查看官网详情",
    amenities: "设施与条件",
    floorPlans: "户型图与价格",
    floorPlansDesc: "可选房型配置与费用",
    compare: "对比多个户型",
    compareShort: "对比",
    single: "单人间",
    double: "双人间",
    triple: "三人间",
    available: "可预订",
    yr: "/年",
    mo: "/月",
    sqft: "平方英尺",
    planDetailPrefix: "此处显示 ",
    planDetailSuffix: " 的详细户型图与介绍",
    priceRange: "价格范围",
    beds: "张床",
    baths: "卫浴",
    shared: "公共",
    furnished: "带家具",
    compareAdd: "加入对比",
    reviews: "宿舍评价",
    reviewCount: "共 128 条评价",
    shareExp: "分享你的居住体验",
    loginPrompt: "登录后即可发表评价或点赞",
    loginBtn: "登录 / 注册",
    recommended: "推荐",
    helpful: "有用",
    viewAllReviews: "查看全部 128 条评价",
    tags: {
      artsyCreative: "艺术氛围",
      llc: "LLC 社群",
      musicRooms: "琴房",
      studyLounge: "自习室",
      laundry: "洗衣房",
      olderBuilding: "设施较旧"
    },
    reviewsData: [
      {
        id: 1,
        author: 'Alex W.',
        major: 'Computer Science',
        date: '2023年10月',
        content: 'Allen的艺术氛围真的很好！虽然没有空调，但秋天和春天开窗很舒服，带个小风扇完全能度过刚开学那几周。食堂的素食选择很多，而且经常有客座教授来做讲座，强烈推荐给喜欢社交和艺术的同学。',
        isPositive: true
      },
      {
        id: 2,
        author: 'Sarah L.',
        major: 'Undeclared',
        date: '2023年5月',
        content: 'LLC的活动非常多，很容易交到朋友。琴房隔音一般，但对于喜欢音乐的人来说很方便就在楼下。位置稍微有点偏南，但去主干道坐公交很方便。',
        isPositive: true
      }
    ]
  },
  en: {
    back: "Back to Dorms",
    backShort: "Back",
    title: "iGuide",
    urh: "URH Housing",
    southCampus: "South Campus",
    positiveRating: "85% Positive",
    noAc: "No A/C",
    dining: "Dining Hall",
    communalBath: "Communal Bath",
    desc: "Allen Hall is one of the most artistic and inclusive dorms at UIUC, home to the Unit One Living-Learning Community (LLC). It offers guest lectures, music practice rooms, a ceramics studio, and a darkroom. While it lacks A/C, its unique community vibe and convenient dining hall make it a top choice for many freshmen.",
    viewWebsite: "Official Website",
    amenities: "Amenities & Features",
    floorPlans: "Floor Plans & Pricing",
    floorPlansDesc: "Available room types and costs",
    compare: "Compare Plans",
    compareShort: "Compare",
    single: "Single",
    double: "Double",
    triple: "Triple",
    available: "Available",
    yr: "/yr",
    mo: "/mo",
    sqft: "sq ft",
    planDetailPrefix: "Detailed floor plan and description for ",
    planDetailSuffix: "",
    priceRange: "Price Range",
    beds: "Beds",
    baths: "Baths",
    shared: "Shared",
    furnished: "Furnished",
    compareAdd: "Compare",
    reviews: "Dorm Reviews",
    reviewCount: "128 Reviews",
    shareExp: "Share your experience",
    loginPrompt: "Log in to post a review or like",
    loginBtn: "Log In / Sign Up",
    recommended: "Recommended",
    helpful: "Helpful",
    viewAllReviews: "View all 128 reviews",
    tags: {
      artsyCreative: "Artsy Vibe",
      llc: "LLC Community",
      musicRooms: "Music Rooms",
      studyLounge: "Study Lounges",
      laundry: "Laundry",
      olderBuilding: "Older Facilities"
    },
    reviewsData: [
      {
        id: 1,
        author: 'Alex W.',
        major: 'Computer Science',
        date: 'Oct 2023',
        content: 'The artsy vibe at Allen is amazing! No A/C, but opening the windows in fall/spring is nice, and a small fan gets you through the first few weeks. The dining hall has great vegetarian options, and guest professors often give talks. Highly recommend for social and artsy students.',
        isPositive: true
      },
      {
        id: 2,
        author: 'Sarah L.',
        major: 'Undeclared',
        date: 'May 2023',
        content: 'Tons of LLC activities, making it super easy to make friends. Music room soundproofing is okay, but very convenient if you play an instrument. Location is a bit south, but catching a bus to the main quad is very easy.',
        isPositive: true
      }
    ]
  }
};

const plansData = [
  { id: 1, typeKey: 'single' as const, priceYear: 8800, priceMonth: 733, area: 105, bed: 'Twin XL', bedsCount: 1, isSharedBath: true, bathsCount: 0, furnished: true },
  { id: 2, typeKey: 'double' as const, priceYear: 8500, priceMonth: 708, area: 160, bed: 'Twin XL', bedsCount: 2, isSharedBath: true, bathsCount: 0, furnished: true },
  { id: 3, typeKey: 'triple' as const, priceYear: 8000, priceMonth: 667, area: 220, bed: 'Twin XL', bedsCount: 3, isSharedBath: true, bathsCount: 0, furnished: true },
];

const tagsData = [
  { id: 'artsyCreative' as const, category: 'lifestyle', tone: 'positive', icon: Palette },
  { id: 'llc' as const, category: 'lifestyle', tone: 'positive', icon: Users },
  { id: 'musicRooms' as const, category: 'facilities', tone: 'neutral', icon: Music },
  { id: 'studyLounge' as const, category: 'facilities', tone: 'neutral', icon: BookOpen },
  { id: 'laundry' as const, category: 'facilities', tone: 'neutral', icon: null },
  { id: 'olderBuilding' as const, category: 'livingConditions', tone: 'muted', icon: null },
];

function DormDetail() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [lang, setLang] = useState<Lang>('zh');

  const toggleCompare = (id: number) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const t = dict[lang];

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleLang = () => {
    setLang(lang === 'zh' ? 'en' : 'zh');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen font-sans text-slate-800 pb-24"
    >
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1000px] mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between relative">
          <button className="flex items-center gap-1.5 md:gap-2 text-slate-500 hover:text-[#13294B] transition-colors group py-2 z-10">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[13px] md:text-[14px] font-semibold hidden sm:inline">{t.back}</span>
            <span className="text-[13px] md:text-[14px] font-semibold sm:hidden">{t.backShort}</span>
          </button>
          
          <div className="font-extrabold text-[16px] md:text-[18px] text-[#13294B] absolute left-1/2 -translate-x-1/2 w-full text-center pointer-events-none tracking-tight">
            {t.title}
          </div>

          <div className="flex items-center gap-1 md:gap-2 z-10">
            <button 
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:text-[#13294B] transition-colors rounded-full hover:bg-slate-100/50 active:scale-95"
              aria-label="Toggle Language"
            >
              <Globe className="w-4 h-4" />
              <span className="text-[12px] font-bold">{lang === 'zh' ? 'EN' : '中'}</span>
            </button>
            <button 
              onClick={() => setIsFavorited(!isFavorited)}
              className="p-2 -mr-2 text-slate-500 hover:text-[#FF5F05] transition-colors rounded-full hover:bg-slate-100/50 active:scale-95"
              aria-label="Favorite"
            >
              <Heart className={`w-5 h-5 transition-all duration-300 ${isFavorited ? 'fill-[#FF5F05] text-[#FF5F05] scale-110' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1000px] mx-auto px-4 md:px-6 mt-6 md:mt-8 space-y-8 md:space-y-10">
        
        {/* Hero Section */}
        <section className="space-y-5 md:space-y-6">
          {/* Image Gallery Placeholder */}
          <div className="w-full aspect-[4/3] sm:aspect-video md:aspect-[21/9] rounded-2xl md:rounded-3xl overflow-hidden relative bg-slate-100 border border-white/60 shadow-sm">
            <img 
              src="https://picsum.photos/seed/allen-hall-uiuc/1200/800" 
              alt="Allen Hall" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-white/80 backdrop-blur-md px-2.5 py-1 md:px-3 md:py-1.5 rounded-full flex items-center gap-1 md:gap-1.5 shadow-sm border border-white/50">
              <ThumbsUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FF5F05] fill-[#FF5F05]" />
              <span className="text-[12px] md:text-[13px] font-bold text-slate-900">{t.positiveRating}</span>
            </div>
          </div>

          {/* Title & Meta */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-8">
            <div className="space-y-3 md:space-y-4 flex-1">
              {/* 一级筛选维度：housingType & location */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-[11px] md:text-[12px] font-bold text-slate-700 bg-slate-200/60 rounded-full">
                  {t.urh}
                </span>
                <span className="px-3 py-1 text-[11px] md:text-[12px] font-bold text-slate-700 bg-slate-200/60 rounded-full">
                  {t.southCampus}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#13294B] tracking-tight">
                Allen Hall
              </h1>
              
              <div className="flex items-start md:items-center gap-1.5 text-slate-500 text-[13px] md:text-[14px] font-medium">
                <MapPin className="w-4 h-4 mt-0.5 md:mt-0 shrink-0" />
                <span className="leading-tight">1005 W Gregory Dr, Urbana, IL 61801</span>
              </div>

              {/* Vibe Tags (Positive Tone) */}
              <div className="flex flex-wrap gap-2 pt-1">
                {tagsData.filter(t => t.tone === 'positive').map(tag => (
                  <span key={tag.id} className="px-3 py-1 text-[12px] md:text-[13px] font-bold text-[#FF5F05] bg-[#FF5F05]/10 rounded-full flex items-center gap-1.5">
                    {tag.icon && <tag.icon className="w-3.5 h-3.5" />}
                    {t.tags[tag.id]}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Hard Facts (重要维度: ac, dining, bathroomType) */}
            <div className="flex gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0 overflow-x-auto pb-2 md:pb-0">
              <div className="bg-white rounded-2xl p-2 md:p-3 flex flex-col items-center justify-center min-w-[88px] md:min-w-[100px] h-[88px] md:h-[100px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 flex-1 md:flex-none">
                <Snowflake className="w-5 h-5 md:w-6 md:h-6 text-slate-400 mb-1.5 shrink-0" strokeWidth={1.5} />
                <span className="text-[11px] md:text-[12px] text-slate-700 font-bold text-center leading-tight">{t.noAc}</span>
              </div>
              <div className="bg-white rounded-2xl p-2 md:p-3 flex flex-col items-center justify-center min-w-[88px] md:min-w-[100px] h-[88px] md:h-[100px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 flex-1 md:flex-none">
                <Utensils className="w-5 h-5 md:w-6 md:h-6 text-[#52C41A] mb-1.5 shrink-0" strokeWidth={1.5} />
                <span className="text-[11px] md:text-[12px] text-slate-700 font-bold text-center leading-tight">{t.dining}</span>
              </div>
              <div className="bg-white rounded-2xl p-2 md:p-3 flex flex-col items-center justify-center min-w-[88px] md:min-w-[100px] h-[88px] md:h-[100px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 flex-1 md:flex-none">
                <Bath className="w-5 h-5 md:w-6 md:h-6 text-[#1890FF] mb-1.5 shrink-0" strokeWidth={1.5} />
                <span className="text-[11px] md:text-[12px] text-slate-700 font-bold text-center leading-tight">{t.communalBath}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 pt-2">
            <p className="text-slate-600 text-[14px] md:text-[15px] leading-relaxed max-w-4xl font-medium">
              {t.desc}
            </p>
            <a href="#" className="inline-flex items-center gap-1 text-[11px] md:text-[12px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors w-fit">
              <span>{t.viewWebsite}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </section>

        {/* Tags & Facilities (Neutral & Muted Tones) */}
        <section className="space-y-3 md:space-y-4">
          <h3 className="text-[16px] md:text-[18px] font-bold text-slate-900">{t.amenities}</h3>
          <div className="flex flex-wrap gap-2 md:gap-2.5">
            {tagsData.filter(t => t.tone === 'neutral').map(tag => (
              <div key={tag.id} className="px-2.5 py-1 md:px-3 md:py-1.5 bg-white/80 backdrop-blur-md border border-white/60 rounded-lg md:rounded-xl flex items-center gap-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {tag.icon && <tag.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500" strokeWidth={1.5} />}
                <span className="text-[12px] md:text-[13px] text-slate-700 font-semibold">{t.tags[tag.id]}</span>
              </div>
            ))}
            {tagsData.filter(t => t.tone === 'muted').map(tag => (
              <div key={tag.id} className="px-2.5 py-1 md:px-3 md:py-1.5 bg-slate-100/50 border border-slate-200/50 rounded-lg md:rounded-xl flex items-center gap-1.5">
                {tag.icon && <tag.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" strokeWidth={1.5} />}
                <span className="text-[12px] md:text-[13px] text-slate-500 font-semibold">{t.tags[tag.id]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Floor Plans & Pricing */}
        <section className="space-y-3 md:space-y-4 pt-2">
          <div className="flex items-end justify-between mb-4 md:mb-6">
            <div className="space-y-1 md:space-y-1.5">
              <h3 className="text-[16px] md:text-[18px] font-bold text-slate-900">{t.floorPlans}</h3>
              <p className="text-slate-500 text-[12px] md:text-[13px] font-medium">{t.floorPlansDesc}</p>
            </div>
            <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-white/80 backdrop-blur-md border border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-xl text-[12px] md:text-[13px] font-bold text-[#13294B] hover:bg-white hover:shadow-[0_4px_15px_rgba(0,0,0,0.04)] transition-all active:scale-95">
              <ArrowRightLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">{t.compare}</span>
              <span className="sm:hidden">{t.compareShort}</span>
            </button>
          </div>
          
          <div className="space-y-3">
            {plansData.map((plan) => (
              <div
                key={plan.id}
                onClick={() => toggleExpand(plan.id)}
                className="group bg-white/80 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/60 hover:bg-white/95 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 cursor-pointer overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
              >
                {/* Main Row */}
                <div className="p-3 md:p-5 flex flex-row items-center md:items-start gap-4 md:gap-6">
                  
                  {/* Thumbnail (Visible on both Mobile and Desktop) */}
                  <div className="w-20 h-20 md:w-36 md:h-28 shrink-0 bg-slate-50 rounded-lg md:rounded-xl overflow-hidden border border-slate-200/60 relative group-hover:border-slate-300 transition-colors">
                    <div className="absolute inset-0 bg-slate-50/50 group-hover:bg-transparent transition-colors duration-300 z-10"></div>
                    <img src={`https://picsum.photos/seed/floorplan${plan.id}/200/200?grayscale`} alt="Floor plan" className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>

                  {/* Content Container */}
                  <div className="flex-1 flex flex-col md:flex-row justify-between gap-1 md:gap-0 min-w-0 md:h-28">
                    
                    {/* Left/Middle: Info */}
                    <div className="flex flex-col justify-center gap-1.5 md:gap-3 min-w-0 h-full py-0.5">
                      {/* Title & Tags */}
                      <div className="flex items-center justify-between md:justify-start w-full gap-2">
                        <div className="flex items-center flex-wrap gap-1.5 md:gap-3 min-w-0">
                          <h4 className="text-[15px] md:text-[18px] font-extrabold text-slate-900 truncate">
                            {t[plan.typeKey]}
                          </h4>
                          <span className="flex items-center gap-0.5 md:gap-1 px-1.5 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-[13px] text-[#059669] bg-[#ECFDF5] border border-[#D1FAE5] rounded-md md:rounded-xl font-bold whitespace-nowrap">
                            <Check className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" strokeWidth={3} />
                            {t.available}
                          </span>
                        </div>
                        {/* Mobile Chevron */}
                        <div className="md:hidden flex items-center justify-center text-slate-400 shrink-0 -mr-1">
                          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expandedId === plan.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {/* Specs: Bed • Bath • Area */}
                      <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1 md:gap-4 text-slate-600 mt-1 md:mt-0">
                        <div className="flex items-center gap-1 md:gap-1.5">
                          <BedSingle className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                          <span className="text-[12px] md:text-[14px] font-semibold">{plan.bed}</span>
                        </div>
                        <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-slate-300"></div>
                        <div className="flex items-center gap-1 md:gap-1.5">
                          <Bath className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                          <span className="text-[12px] md:text-[14px] font-semibold">{plan.isSharedBath ? t.communalBath : `${plan.bathsCount} ${t.baths}`}</span>
                        </div>
                        <div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full bg-slate-300"></div>
                        <div className="flex items-center gap-1 md:gap-1.5">
                          <SquareDashed className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                          <span className="text-[12px] md:text-[14px] font-semibold tabular-nums">
                            {plan.area} {t.sqft} <span className="text-slate-400 font-medium">(~{Math.round(plan.area * 0.092903)}㎡)</span>
                          </span>
                        </div>
                      </div>

                      {/* Mobile Price */}
                      <div className="flex md:hidden items-baseline gap-1 mt-0.5">
                        <span className="text-[16px] font-extrabold text-slate-900 tabular-nums tracking-tight">
                          ${plan.priceYear.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">{t.yr}</span>
                        <span className="text-[11px] text-slate-400 ml-1 font-medium tabular-nums">
                          (~${plan.priceMonth}{t.mo})
                        </span>
                      </div>
                    </div>

                    {/* Right: Desktop Price & Actions */}
                    <div className="hidden md:flex flex-col items-end justify-between gap-2 h-full py-0.5 shrink-0">
                      {/* Price */}
                      <div className="flex flex-col justify-center items-end">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-[24px] font-extrabold text-slate-900 tabular-nums tracking-tight">
                            ${plan.priceYear.toLocaleString()}
                          </span>
                          <span className="text-[13px] text-slate-500 font-medium">{t.yr}</span>
                        </div>
                        <div className="inline-flex items-center px-1.5 py-0.5 mt-1 rounded-md bg-slate-100 text-[12px] text-slate-500 font-medium tabular-nums">
                          ~${plan.priceMonth}{t.mo}
                        </div>
                      </div>

                      {/* Desktop Actions */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCompare(plan.id); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-colors ${
                            compareIds.includes(plan.id) ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center ${compareIds.includes(plan.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300'}`}>
                            {compareIds.includes(plan.id) && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                          </div>
                          {t.compareAdd}
                        </button>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expandedId === plan.id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence initial={false}>
                  {expandedId === plan.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 md:p-5 pt-0 border-t border-slate-100/50 mx-4 md:mx-5 mt-2">
                        <div className="bg-slate-50/50 rounded-xl p-6 md:p-8 flex items-center justify-center text-slate-400 border border-slate-200/50 border-dashed mt-3 md:mt-4 font-medium text-[13px] md:text-[14px]">
                          <p>{t.planDetailPrefix}{t[plan.typeKey]}{t.planDetailSuffix}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-5 flex items-center justify-between border border-white/50 mt-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <span className="text-slate-600 text-[13px] md:text-[14px] font-semibold">{t.priceRange}</span>
            <span className="text-[16px] md:text-[18px] font-extrabold text-slate-900">
              $8,800 - $8,000
            </span>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="space-y-4 pt-6 pb-8 border-t border-slate-200/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[16px] md:text-[18px] font-bold text-slate-900">{t.reviews}</h3>
            <span className="text-[12px] md:text-[13px] text-slate-500 font-medium">{t.reviewCount}</span>
          </div>

          {/* Login Prompt Card */}
          <div className="bg-white/60 backdrop-blur-md rounded-xl md:rounded-2xl p-5 md:p-6 border border-[#13294B]/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#13294B]/5 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-[#13294B]" />
              </div>
              <div>
                <h4 className="text-[14px] md:text-[15px] font-bold text-slate-900">{t.shareExp}</h4>
                <p className="text-[12px] md:text-[13px] text-slate-500 mt-0.5 font-medium">{t.loginPrompt}</p>
              </div>
            </div>
            <button className="w-full sm:w-auto px-5 py-2.5 bg-[#13294B] hover:bg-[#13294B]/90 text-white text-[13px] md:text-[14px] font-bold rounded-xl transition-colors shadow-sm">
              {t.loginBtn}
            </button>
          </div>

          {/* Review List */}
          <div className="space-y-3 mt-4">
            {t.reviewsData.map((review) => (
              <div key={review.id} className="bg-white/80 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-[13px] md:text-[14px] font-bold text-slate-900 leading-tight">
                        {review.author}
                      </div>
                      <div className="text-[11px] md:text-[12px] text-slate-500 mt-0.5 font-medium">
                        {review.major} · {review.date}
                      </div>
                    </div>
                  </div>
                  {review.isPositive && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-[#FF5F05]/10 rounded-lg">
                      <ThumbsUp className="w-3 h-3 text-[#FF5F05] fill-[#FF5F05]" />
                      <span className="text-[11px] font-bold text-[#FF5F05]">{t.recommended}</span>
                    </div>
                  )}
                </div>
                <p className="text-[13px] md:text-[14px] text-slate-600 leading-relaxed font-medium">
                  {review.content}
                </p>
                
                {/* Interaction Actions */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100/50">
                  <button className="flex items-center gap-1.5 text-slate-400 hover:text-[#FF5F05] transition-colors group">
                    <ThumbsUp className="w-3.5 h-3.5 group-hover:fill-[#FF5F05]/20" />
                    <span className="text-[12px] font-semibold">{t.helpful} (12)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full py-3 text-[13px] md:text-[14px] font-semibold text-slate-500 hover:text-slate-800 bg-white/40 hover:bg-white/60 backdrop-blur-md rounded-xl transition-colors border border-white/50">
            {t.viewAllReviews}
          </button>
        </section>

      </main>
    </motion.div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DormDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
