import { Language } from '../../../types';

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
        dormNotFound: 'Dorm not found',
        backToDorms: 'Back to Dorms',
        backToBrowse: 'Back to Browse',
        campus: 'Campus',
        about: 'About',
        prosAndCons: 'Pros & Cons',
        good: 'The Good',
        notSoGood: 'The Not-So-Good',
        quickStats: 'Quick Stats',
        diningHall: 'Dining Hall',
        onSite: 'On-site',
        nearby: 'Nearby',
        annualPrice: 'Annual Price',
        illiniTip: 'Illini Tip',
        tipWithAc: 'This dorm has A/C, which is a lifesaver in August and September!',
        tipWithoutAc: 'Bring a box fan! It gets hot in early fall, but the community here is worth it.',
        saved: 'Saved to Favorites',
        save: 'Save to Favorites',
        viewingHistory: 'Viewing History',
        favorites: 'My Favorites'
    },
    zh: {
        dormNotFound: '未找到该宿舍',
        backToDorms: '返回宿舍列表',
        backToBrowse: '返回浏览',
        campus: '校区',
        about: '简介',
        prosAndCons: '优缺点',
        good: '优点',
        notSoGood: '不足',
        quickStats: '快速信息',
        diningHall: '食堂',
        onSite: '楼内',
        nearby: '附近',
        annualPrice: '年费用',
        illiniTip: '伊利诺伊小贴士',
        tipWithAc: '该宿舍配有空调，8 月和 9 月会舒适很多。',
        tipWithoutAc: '建议准备风扇。初秋会比较热，但这里的社区氛围很好。',
        saved: '已加入收藏',
        save: '加入收藏',
        viewingHistory: '浏览历史',
        favorites: '我的收藏'
    }
};

export const aiChatTexts: Record<Language, AiChatText> = {
    en: {
        title: 'Illini Assistant',
        subtitle: 'Powered by DeepSeek',
        placeholder: 'Ask about dorms, culture, food...',
        thinking: 'Thinking...',
        initialMessage:
            "Hi! I'm your Illini Housing Assistant. I can help you find the best dorm based on your major, lifestyle, or budget. Try asking 'Which dorm is best for engineering students?' or 'Where is the best food?'"
    },
    zh: {
        title: '伊利诺伊助手',
        subtitle: '由 DeepSeek 驱动',
        placeholder: '可以问我宿舍、校园文化、美食等问题...',
        thinking: '思考中...',
        initialMessage:
            '你好！我是你的 UIUC 住宿助手。我可以根据你的专业、生活方式和预算推荐宿舍。你可以问我“工科学生更适合哪栋宿舍？”或“哪里吃饭更方便？”。'
    }
};
