/**
 * @file ./src/components/housing/i18n/dormTexts.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { type Language } from "../../../types";

export interface DormDetailText {
  dormNotFound: string;
  backToDorms: string;
  backToBrowse: string;
  campus: string;
  about: string;
  prosAndCons: string;
  good: string;
  notSoGood: string;
  quickStats: string;
  housingType: string;
  diningHall: string;
  onSite: string;
  nearby: string;
  annualPrice: string;
  illiniTip: string;
  tipWithAc: string;
  tipWithoutAc: string;
  saved: string;
  save: string;
  viewingHistory: string;
  favorites: string;
  ratingsAndReviews: string;
  commentsTitle: string;
  leaveComment: string;
  submitComment: string;
  deleteComment: string;
  loginToComment: string;
  noComments: string;
  thumbsUpDorm: string;
  thumbsDownDorm: string;
  // New keys for redesigned layout
  amenities: string;
  floorPlansDesc: string;
  comparePlans: string;
  compareAdd: string;
  available: string;
  sqft: string;
  yr: string;
  mo: string;
  communalBath: string;
  privateBath: string;
  semiPrivateBath: string;
  priceRange: string;
  shareExp: string;
  loginPrompt: string;
  loginBtn: string;
  recommended: string;
  helpful: string;
  viewAllReviews: string;
  viewWebsite: string;
  positiveRating: string;
  bedSize: string;
  address: string;
}

export interface AiChatText {
  title: string;
  subtitle: string;
  placeholder: string;
  thinking: string;
  initialMessage: string;
}

export const dormDetailTexts: Record<Language, DormDetailText> = {
  en: {
    dormNotFound: "Dorm not found",
    backToDorms: "Back to Dorms",
    backToBrowse: "Back to Browse",
    campus: "Campus",
    about: "About",
    prosAndCons: "Pros & Cons",
    good: "The Good",
    notSoGood: "The Not-So-Good",
    quickStats: "Quick Stats",
    housingType: "Housing Type",
    diningHall: "Dining Hall",
    onSite: "On-site",
    nearby: "Nearby",
    annualPrice: "Annual Price",
    illiniTip: "Illini Tip",
    tipWithAc:
      "This dorm has A/C, which is a lifesaver in August and September!",
    tipWithoutAc:
      "Bring a box fan! It gets hot in early fall, but the community here is worth it.",
    saved: "Saved to Favorites",
    save: "Save to Favorites",
    viewingHistory: "Viewing History",
    favorites: "My Favorites",
    ratingsAndReviews: "Ratings & Reviews",
    commentsTitle: "Comments",
    leaveComment: "Leave a comment...",
    submitComment: "Submit",
    deleteComment: "Delete",
    loginToComment: "Log in to leave a comment",
    noComments: "No comments yet",
    thumbsUpDorm: "Recommend",
    thumbsDownDorm: "Not recommended",
    amenities: "Amenities & Features",
    floorPlansDesc: "Available room types and costs",
    comparePlans: "Compare Plans",
    compareAdd: "Compare",
    available: "Available",
    sqft: "sq ft",
    yr: "/yr",
    mo: "/mo",
    communalBath: "Communal Bath",
    privateBath: "Private Bath",
    semiPrivateBath: "Semi-Private Bath",
    priceRange: "Price Range",
    shareExp: "Share your experience",
    loginPrompt: "Log in to post a review",
    loginBtn: "Log In / Sign Up",
    recommended: "Recommended",
    helpful: "Helpful",
    viewAllReviews: "View all reviews",
    viewWebsite: "Official Website",
    positiveRating: "% Positive",
    bedSize: "Bed Size",
    address: "Address",
  },
  zh: {
    dormNotFound: "未找到该宿舍",
    backToDorms: "返回宿舍列表",
    backToBrowse: "返回浏览",
    campus: "校区",
    about: "简介",
    prosAndCons: "优缺点",
    good: "优点",
    notSoGood: "不足",
    quickStats: "快速信息",
    housingType: "住宿类型",
    diningHall: "食堂",
    onSite: "楼内",
    nearby: "附近",
    annualPrice: "年费用",
    illiniTip: "伊利诺伊小贴士",
    tipWithAc: "该宿舍配有空调，8 月和 9 月会舒适很多。",
    tipWithoutAc: "建议准备风扇。初秋会比较热，但这里的社区氛围很好。",
    saved: "已加入收藏",
    save: "加入收藏",
    viewingHistory: "浏览历史",
    favorites: "我的收藏",
    ratingsAndReviews: "评分与评论",
    commentsTitle: "评论",
    leaveComment: "写下你的评论...",
    submitComment: "提交",
    deleteComment: "删除",
    loginToComment: "登录后发表评论",
    noComments: "暂无评论",
    thumbsUpDorm: "推荐",
    thumbsDownDorm: "不推荐",
    amenities: "设施与条件",
    floorPlansDesc: "可选房型配置与费用",
    comparePlans: "对比多个户型",
    compareAdd: "加入对比",
    available: "可预订",
    sqft: "平方英尺",
    yr: "/年",
    mo: "/月",
    communalBath: "公共卫浴",
    privateBath: "独立卫浴",
    semiPrivateBath: "半独立卫浴",
    priceRange: "价格范围",
    shareExp: "分享你的居住体验",
    loginPrompt: "登录后即可发表评价",
    loginBtn: "登录 / 注册",
    recommended: "推荐",
    helpful: "有用",
    viewAllReviews: "查看全部评价",
    viewWebsite: "查看官网详情",
    positiveRating: "% 好评",
    bedSize: "床型",
    address: "地址",
  },
};

export const aiChatTexts: Record<Language, AiChatText> = {
  en: {
    title: "Illini Assistant",
    subtitle: "Powered by DeepSeek",
    placeholder: "Ask about dorms, culture, food...",
    thinking: "Thinking...",
    initialMessage:
      "Hi! I'm your Illini Housing Assistant. I can help you find the best dorm based on your major, lifestyle, or budget. Try asking 'Which dorm is best for engineering students?' or 'Where is the best food?'",
  },
  zh: {
    title: "伊利诺伊助手",
    subtitle: "由 DeepSeek 驱动",
    placeholder: "可以问我宿舍、校园文化、美食等问题...",
    thinking: "思考中...",
    initialMessage:
      "你好！我是你的 UIUC 住宿助手。我可以根据你的专业、生活方式和预算推荐宿舍。你可以问我“工科学生更适合哪栋宿舍？”或“哪里吃饭更方便？”。",
  },
};
