// [ROOT] Global constants, configuration, and static data.
// [根组件] 全局常量、配置和静态数据。
import { Article, Category, Language } from './types';

export const UI_TEXT = {
  en: {
    appTitle: "UIUC Guide",
    chatTab: "Chat",
    libraryTab: "Library",
    welcomeTitle: "Hey, welcome to UIUC",
    welcomeSubtitle: "I'm your personal campus guide. Ask me about finding your way around, dorm life, or where to get the best bubble tea.",
    suggestions: [
      { icon: '💉', text: "What vaccines are required for freshmen?" },
      { icon: '✈️', text: "How to get from O'Hare International Airport to campus?" },
      { icon: '🛏️', text: "What dorm options are available for freshmen?" },
      { icon: '🎓', text: "How to transfer to Engineering?" }
    ],
    inputPlaceholder: "Ask anything...",
    searchPlaceholder: "Search for guides...",
    searchTitle: "Search:",
    clear: "Clear",
    noResults: "No guides found.",
    backToCategories: "Back to Categories",
    backToBrowse: "Back to Browse",
    readGuide: "Read Guide →",
    relatedTopics: "Related Topics",
    updated: "Updated",
    knowledgeBaseTitle: "Knowledge Base",
    knowledgeBaseSubtitle: "Curated guides written by students, for students. Everything from housing to late-night eats.",
    emptyCategory: "No articles yet in this category.",
    highTraffic: "High Traffic Volume",
    highTrafficMsg: "I'm a bit overwhelmed right now. You can check the Library for verified guides.",
    goToLibrary: "Go to Library →",
    botName: "UIUC Guide",
    userRole: "You",
    aiError: "AI can make mistakes. Please check important info.",

    // AI Provider Text
    providerCloud: "Cloud (Coze)",
    providerLocal: "Local (Free)",
    providerCoze: "Coze (Agent)",
    localModelDesc: "Runs in your browser. Needs ~1GB download.",
    downloadingModel: "Downloading Model...",
    modelReady: "Model Ready",
    webGpuError: "WebGPU is not supported on this device. Please use Cloud AI.",
    initLocal: "Load Local Model",

    // Login Screen
    loginTitle: "UIUC Guide",
    loginSubtitle: "UIUC Incoming Student Knowledge Base",
    loginSwitch: "Login",
    registerSwitch: "Register",
    googleLogin: "Login with Google",
    orEmail: "Or use email",
    emailLabel: "Email",
    passwordLabel: "Password",
    loginAction: "Login",
    registerAction: "Register",
    processing: "Processing...",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    registerNow: "Register Now",
    loginNow: "Login Now",
    guestMode: "Skip login, try Guest Mode",
    loginError: "Login failed, please check email/password",
    registerError: "Registration failed, try again later",
    genericError: "An error occurred, please try again",

    // Agent Tabs
    coursesTab: "Courses",
    dormsTab: "Housing",
    resumeTab: "Resume",

    // Agent Landing Pages
    comingSoon: "Coming Soon",
    notifyMe: "Join Waitlist",
    emailPlaceholder: "Enter your email",
    emailSuccess: "Thanks! We'll notify you when it's ready.",

    coursesTitle: "Course Selection Agent",
    coursesDesc: "Get personalized course recommendations based on your major and interests. No more registration stress.",

    dormsTitle: "Dorm Selection Agent",
    dormsDesc: "Find the perfect dorm for your lifestyle. Compare amenities and locations to make the best choice.",

    resumeTitle: "Resume Builder Agent",
    resumeDesc: "Create a standout resume for internships and jobs. Get AI suggestions to highlight your UIUC experience."
  },
  zh: {
    appTitle: "UIUC 指南",
    chatTab: "AI 助手",
    libraryTab: "知识库",
    welcomeTitle: "嗨~欢迎来到UIUC",
    welcomeSubtitle: "我是你的校园私人助手。关于宿舍、交通、选课或者哪里有好喝的奶茶，尽管问我。",
    suggestions: [
      { icon: '💉', text: "入学要打什么疫苗？" },
      { icon: '✈️', text: "怎么从机场到学校？" },
      { icon: '🛏️', text: "新生宿舍都各有什么优点？" },
      { icon: '🎓', text: "怎么转工院？" }
    ],
    inputPlaceholder: "随便问点什么...",
    searchPlaceholder: "搜索指南...",
    searchTitle: "搜索结果:",
    clear: "清除",
    noResults: "没有找到相关指南。",
    backToCategories: "返回分类列表",
    backToBrowse: "返回浏览",
    readGuide: "阅读全文 →",
    relatedTopics: "相关话题",
    updated: "更新于",
    knowledgeBaseTitle: "新生知识库",
    knowledgeBaseSubtitle: "由学长学姐编写的避坑指南。从租房到夜宵，应有尽有。",
    emptyCategory: "该分类下暂无文章。",
    highTraffic: "访问量过高",
    highTrafficMsg: "我现在有点忙不过来。你可以先去知识库看看现成的指南。",
    goToLibrary: "前往知识库 →",
    botName: "UIUC 助手",
    userRole: "你",
    aiError: "AI 可能会犯错，请核实重要信息。",

    // AI Provider Text
    providerCloud: "云端 (Coze)",
    providerLocal: "本地 (无限)",
    providerCoze: "Coze (智能体)",
    localModelDesc: "在浏览器运行。需下载 ~1GB 模型。",
    downloadingModel: "正在下载模型...",
    modelReady: "模型就绪",
    webGpuError: "您的设备不支持 WebGPU，请使用云端 AI。",
    initLocal: "加载本地模型",

    // Login Screen
    loginTitle: "UIUC 指南",
    loginSubtitle: "UIUC 新生知识库",
    loginSwitch: "登录",
    registerSwitch: "注册",
    googleLogin: "使用 Google 账号登录",
    orEmail: "或者使用邮箱",
    emailLabel: "邮箱",
    passwordLabel: "密码",
    loginAction: "登录",
    registerAction: "注册",
    processing: "处理中...",
    noAccount: "还没有账号？",
    hasAccount: "已有账号？",
    registerNow: "立即注册",
    loginNow: "立即登录",
    guestMode: "暂不登录，试用临时对话",
    loginError: "登录失败，请检查邮箱和密码",
    registerError: "注册失败，请稍后重试",
    genericError: "发生错误，请稍后重试",

    // Agent Tabs
    coursesTab: "选课",
    dormsTab: "选宿舍",
    resumeTab: "简历",

    // Agent Landing Pages
    comingSoon: "即将上线",
    notifyMe: "加入抢先名单",
    emailPlaceholder: "输入你的邮箱",
    emailSuccess: "谢谢！上线后我们会第一时间通知你。",

    coursesTitle: "选课助手",
    coursesDesc: "根据你的专业、兴趣和毕业要求，获取个性化选课推荐。再也不用为选课发愁。",

    dormsTitle: "选宿舍助手",
    dormsDesc: "找到最适合你生活方式的宿舍。比较设施、位置和氛围，做出最佳住宿选择。",

    resumeTitle: "简历助手",
    resumeDesc: "打造针对实习和工作的出色简历。获取 AI 驱动的建议，突出你的 UIUC 经历。"
  }
};

export const CATEGORIES: Category[] = [
  {
    id: 'housing',
    icon: '🏠',
    label: 'Housing & Dorms',
    description: 'Dorms, apartments, and leasing guides.',
    label_zh: '住宿与宿舍',
    description_zh: '宿舍选择、公寓租房与避坑指南。'
  },
  {
    id: 'academics',
    icon: '📚',
    label: 'Academics',
    description: 'Registration, libraries, and study spots.',
    label_zh: '学术与选课',
    description_zh: '选课技巧、图书馆介绍与自习圣地。'
  },
  {
    id: 'transport',
    icon: '🚌',
    label: 'Transportation',
    description: 'MTD buses, VeoRide, and getting home.',
    label_zh: '交通出行',
    description_zh: '公交车、Veo共享单车与往返机场。'
  },
  {
    id: 'dining',
    icon: '🍔',
    label: 'Food & Dining',
    description: 'Dining halls, Green St restaurants, and cafes.',
    label_zh: '饮食餐饮',
    description_zh: '食堂攻略、绿街美食与咖啡厅。'
  },
  {
    id: 'social',
    icon: '🎉',
    label: 'Social Life',
    description: 'RSOs, Quad Day, and events.',
    label_zh: '社团与社交',
    description_zh: 'RSO 社团、Quad Day 与校园活动。'
  },
  {
    id: 'safety',
    icon: '🏥',
    label: 'Safety & Health',
    description: 'McKinley, SafeWalks, and emergency info.',
    label_zh: '安全与健康',
    description_zh: '校医院、夜间陪走与紧急联系方式。'
  },
];

export { ARTICLES } from './data/articles';

// Helper to get text based on language
export const getArticleText = (article: Article, lang: Language) => ({
  title: lang === 'zh' && article.title_zh ? article.title_zh : article.title,
  summary: lang === 'zh' && article.summary_zh ? article.summary_zh : article.summary,
  content: lang === 'zh' && article.content_zh ? article.content_zh : article.content,
  tags: lang === 'zh' && article.tags_zh ? article.tags_zh : article.tags,
});

export const getCategoryText = (category: Category, lang: Language) => ({
  label: lang === 'zh' && category.label_zh ? category.label_zh : category.label,
  description: lang === 'zh' && category.description_zh ? category.description_zh : category.description,
});