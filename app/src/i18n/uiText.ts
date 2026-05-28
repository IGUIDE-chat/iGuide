/**
 * @file ./src/i18n/uiText.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { type Language } from "../types";

export type UITextEntry = {
  appTitle: string;
  chatTab: string;
  libraryTab: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  suggestions: Array<{ icon: string; text: string }>;
  inputPlaceholder: string;
  searchPlaceholder: string;
  searchTitle: string;
  clear: string;
  noResults: string;
  backToCategories: string;
  backToBrowse: string;
  readGuide: string;
  relatedTopics: string;
  updated: string;
  knowledgeBaseTitle: string;
  knowledgeBaseSubtitle: string;
  emptyCategory: string;
  highTraffic: string;
  highTrafficMsg: string;
  goToLibrary: string;
  botName: string;
  userRole: string;
  aiError: string;
  providerCloud: string;
  providerLocal: string;
  providerCoze: string;
  localModelDesc: string;
  downloadingModel: string;
  modelReady: string;
  webGpuError: string;
  initLocal: string;
  loginTitle: string;
  loginSubtitle: string;
  loginSwitch: string;
  registerSwitch: string;
  googleLogin: string;
  microsoftLogin: string;
  orEmail: string;
  emailLabel: string;
  passwordLabel: string;
  loginAction: string;
  registerAction: string;
  processing: string;
  noAccount: string;
  hasAccount: string;
  registerNow: string;
  loginNow: string;
  guestMode: string;
  loginError: string;
  registerError: string;
  genericError: string;
  coursesTab: string;
  dormsTab: string;
  resumeTab: string;
  comingSoon: string;
  notifyMe: string;
  emailPlaceholder: string;
  emailSuccess: string;
  coursesTitle: string;
  coursesDesc: string;
  dormsTitle: string;
  dormsDesc: string;
  resumeTitle: string;
  resumeDesc: string;
};

export const UI_TEXT: Record<Language, UITextEntry> = {
  en: {
    appTitle: "UIUC Guide",
    chatTab: "Chat",
    libraryTab: "Library",
    welcomeTitle: "Hey, welcome to UIUC",
    welcomeSubtitle:
      "I'm your personal campus guide. Ask me about finding your way around, dorm life, or where to get the best bubble tea.",
    suggestions: [
      { icon: "💉", text: "What vaccines are required for freshmen?" },
      {
        icon: "✈️",
        text: "How to get from O'Hare International Airport to campus?",
      },
      { icon: "🏠", text: "What dorm options are available for freshmen?" },
      { icon: "🎓", text: "How to transfer to Engineering?" },
    ],
    inputPlaceholder: "Ask anything... (replies in English by default)",
    searchPlaceholder: "Search for guides...",
    searchTitle: "Search:",
    clear: "Clear",
    noResults: "No guides found.",
    backToCategories: "Back to Categories",
    backToBrowse: "Back to Browse",
    readGuide: "Read Guide ->",
    relatedTopics: "Related Topics",
    updated: "Updated",
    knowledgeBaseTitle: "Knowledge Base",
    knowledgeBaseSubtitle:
      "Curated guides written by students, for students. Everything from housing to late-night eats.",
    emptyCategory: "No articles yet in this category.",
    highTraffic: "High Traffic Volume",
    highTrafficMsg:
      "I'm a bit overwhelmed right now. You can check the Library for verified guides.",
    goToLibrary: "Go to Library ->",
    botName: "UIUC Guide",
    userRole: "You",
    aiError: "AI can make mistakes. Please check important info.",
    providerCloud: "Cloud (Coze)",
    providerLocal: "Local (Free)",
    providerCoze: "Coze (Agent)",
    localModelDesc: "Runs in your browser. Needs ~1GB download.",
    downloadingModel: "Downloading model...",
    modelReady: "Model ready",
    webGpuError: "WebGPU is not supported on this device. Please use Cloud AI.",
    initLocal: "Load local model",
    loginTitle: "UIUC Guide",
    loginSubtitle: "UIUC Incoming Student Knowledge Base",
    loginSwitch: "Login",
    registerSwitch: "Register",
    googleLogin: "Login with Google",
    microsoftLogin: "Login with Microsoft",
    orEmail: "Or use email",
    emailLabel: "Email",
    passwordLabel: "Password",
    loginAction: "Login",
    registerAction: "Register",
    processing: "Processing...",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    registerNow: "Register now",
    loginNow: "Login now",
    guestMode: "Skip login, try Guest Mode",
    loginError: "Login failed, please check email/password",
    registerError: "Registration failed, try again later",
    genericError: "An error occurred, please try again",
    coursesTab: "Courses",
    dormsTab: "Housing",
    resumeTab: "Resume",
    comingSoon: "Coming soon",
    notifyMe: "Join waitlist",
    emailPlaceholder: "Enter your email",
    emailSuccess: "Thanks! We'll notify you when it's ready.",
    coursesTitle: "Course Selection Agent",
    coursesDesc:
      "Get personalized course recommendations based on your major and interests. No more registration stress.",
    dormsTitle: "Dorm Selection Agent",
    dormsDesc:
      "Find the perfect dorm for your lifestyle. Compare amenities and locations to make the best choice.",
    resumeTitle: "Resume Builder Agent",
    resumeDesc:
      "Create a standout resume for internships and jobs. Get AI suggestions to highlight your UIUC experience.",
  },
  zh: {
    appTitle: "UIUC 指南",
    chatTab: "AI 助手",
    libraryTab: "知识库",
    welcomeTitle: "欢迎来到 UIUC",
    welcomeSubtitle:
      "我是你的校园助手。关于宿舍、交通、选课和生活，随时可以问我。",
    suggestions: [
      { icon: "💉", text: "新生需要打哪些疫苗？" },
      { icon: "✈️", text: "怎么从奥黑尔机场到学校？" },
      { icon: "🏠", text: "新生有哪些宿舍选择？" },
      { icon: "🎓", text: "如何转入工程学院？" },
    ],
    inputPlaceholder: "随时提问…（默认以中文回复）",
    searchPlaceholder: "搜索指南...",
    searchTitle: "搜索结果：",
    clear: "清除",
    noResults: "没有找到相关指南。",
    backToCategories: "返回分类列表",
    backToBrowse: "返回浏览",
    readGuide: "阅读全文 ->",
    relatedTopics: "相关话题",
    updated: "更新于",
    knowledgeBaseTitle: "新生知识库",
    knowledgeBaseSubtitle:
      "由学长学姐整理的实用指南，从住宿到校园生活一站式覆盖。",
    emptyCategory: "该分类下暂无文章。",
    highTraffic: "当前请求较多",
    highTrafficMsg: "我现在有点忙不过来。你可以先去知识库查看已验证内容。",
    goToLibrary: "前往知识库 ->",
    botName: "UIUC 助手",
    userRole: "你",
    aiError: "AI 可能会出错，请核对重要信息。",
    providerCloud: "云端 (Coze)",
    providerLocal: "本地 (免费)",
    providerCoze: "Coze (智能体)",
    localModelDesc: "在浏览器本地运行，首次需要下载约 1GB 模型。",
    downloadingModel: "正在下载模型...",
    modelReady: "模型已就绪",
    webGpuError: "当前设备不支持 WebGPU，请使用云端 AI。",
    initLocal: "加载本地模型",
    loginTitle: "UIUC 指南",
    loginSubtitle: "UIUC 新生知识库",
    loginSwitch: "登录",
    registerSwitch: "注册",
    googleLogin: "使用 Google 登录",
    microsoftLogin: "使用 Microsoft 登录",
    orEmail: "或使用邮箱",
    emailLabel: "邮箱",
    passwordLabel: "密码",
    loginAction: "登录",
    registerAction: "注册",
    processing: "处理中...",
    noAccount: "还没有账号？",
    hasAccount: "已有账号？",
    registerNow: "立即注册",
    loginNow: "立即登录",
    guestMode: "先不登录，使用访客模式",
    loginError: "登录失败，请检查邮箱和密码",
    registerError: "注册失败，请稍后重试",
    genericError: "发生错误，请稍后重试",
    coursesTab: "选课",
    dormsTab: "宿舍",
    resumeTab: "简历",
    comingSoon: "即将上线",
    notifyMe: "加入候补名单",
    emailPlaceholder: "输入你的邮箱",
    emailSuccess: "感谢提交，我们上线后会第一时间通知你。",
    coursesTitle: "选课助手",
    coursesDesc: "根据你的专业和兴趣提供个性化选课建议，减少选课试错成本。",
    dormsTitle: "选宿舍助手",
    dormsDesc: "对比宿舍位置、设施和预算，找到最适合你的住宿方案。",
    resumeTitle: "简历助手",
    resumeDesc: "快速生成用于实习和求职的简历，并获得可执行的优化建议。",
  },
};
