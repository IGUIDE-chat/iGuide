import { Article, Category, Language } from './types';

export const UI_TEXT = {
  en: {
    appTitle: "UIUC Guide",
    chatTab: "Chat",
    libraryTab: "Library",
    welcomeTitle: "Hey, welcome to",
    welcomeSubtitle: "I'm your personal campus guide. Ask me about finding your way around, dorm life, or where to get the best bubble tea.",
    suggestions: [
      { icon: '💉', text: "What vaccines are required for enrollment?" },
      { icon: '🚌', text: "How does the bus system work?" },
      { icon: '☕', text: "Where are good study spots?" },
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
    genericError: "An error occurred, please try again"
  },
  zh: {
    appTitle: "UIUC 指南",
    chatTab: "AI 助手",
    libraryTab: "知识库",
    welcomeTitle: "你好，欢迎来到",
    welcomeSubtitle: "我是你的校园私人助手。关于宿舍、交通、选课或者哪里有好喝的奶茶，尽管问我。",
    suggestions: [
      { icon: '💉', text: "入学要打什么疫苗？" },
      { icon: '🚌', text: "CUMTD 公交系统怎么坐？" },
      { icon: '☕', text: "哪里适合自习？" },
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
    genericError: "发生错误，请稍后重试"
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

export const ARTICLES: Article[] = [
  // --- HOUSING ---
  {
    id: 'dorm-selection',
    category: 'housing',
    title: 'Freshman Dorm Selection Guide',
    summary: 'ISR vs. Ike vs. PAR/FAR. How to choose the right residence hall for you.',
    content: `
### Choosing Your Home at UIUC

**ISR (Illinois Street Residence)**
Best for engineering students. Recently renovated with a massive dining hall and modern amenities. Located practically on the engineering quad.

**The IKE (Ikenberry Commons)**
The social hub. "Six Pack" area. Great dining hall, huge gym (ARC) nearby. Very social atmosphere, mostly freshmen.

**PAR/FAR (Pennsylvania/Florida Avenue)**
Further south. Known for Late Night dining at PAR. Quieter, but very tight-knit communities. Good bus access to the Main Quad.

**Allen Hall**
Known for artsy, creative vibes and Unit One LLC.
    `,
    tags: ['housing', 'freshman', 'dorms', 'isr', 'ike', 'par', 'far'],
    title_zh: '大一新生宿舍选择指南',
    summary_zh: 'ISR、Ike 还是 PAR/FAR？如何选择最适合你的宿舍。',
    content_zh: `
### 在 UIUC 选择你的家

**ISR (Illinois Street Residence)**
工科生的首选。最近刚翻新过，拥有巨大的食堂和现代化的设施。地理位置极佳，就在工学院 Quad 旁边。

**The IKE (Ikenberry Commons)**
社交中心，俗称 "Six Pack"。拥有很棒的食堂，旁边就是巨大的 ARC 健身房。社交氛围浓厚，绝大多数是大一新生。

**PAR/FAR (Pennsylvania/Florida Avenue)**
位于校园南端。以 PAR 的 Late Night (夜宵) 闻名。相对安静，但社区氛围紧密。去 Main Quad 的公交车很方便。

**Allen Hall**
以艺术、创意氛围和 Unit One LLC (学习生活社区) 闻名。
    `,
    tags_zh: ['住宿', '大一', '宿舍', 'ISR', 'Ike', 'PAR', 'FAR'],
    lastUpdated: '2024-05-15'
  },

  // --- TRANSPORT ---
  {
    id: 'mtd-guide',
    category: 'transport',
    title: 'Mastering the CUMTD Bus System',
    summary: 'How to use your iCard for free rides and apps you need.',
    content: `
### Riding the Bus

UIUC students have unlimited access to the Champaign-Urbana Mass Transit District (MTD) with a valid **iCard**.

1. **Always carry your iCard.** You just flash it to the driver.
2. **Download an App.** Use 'Transit' or 'UIUC Bus' apps for real-time tracking. Google Maps is good but sometimes lags on live delays.
3. **The Illini (22) and Yellow (1)** are your best friends for getting between the Quad, Dorms, and Downtown.

**Late Night:** The SafeRides service operates after regular bus hours for on-demand safe transport.
    `,
    tags: ['bus', 'transport', 'icard', 'mtd', 'getting around'],
    title_zh: '玩转 CUMTD 公交系统',
    summary_zh: '如何用 iCard 免费乘车以及必备的公交 APP。',
    content_zh: `
### 乘坐公交车

UIUC 学生凭有效的 **iCard** 可以无限次免费乘坐香槟-厄巴纳公交系统 (MTD)。

1. **随身携带 iCard。** 上车时向司机出示即可。
2. **下载 APP。** 推荐使用 'Transit' 或 'UIUC Bus' 查看实时公交。Google Maps 也不错，但有时延迟更新不及时。
3. **Illini (22路) 和 Yellow (1路)** 是往返 Quad、宿舍和市中心的黄金线路。

**深夜出行：** 常规公交停运后，可以使用 SafeRides 服务进行点对点接送。
    `,
    tags_zh: ['公交', '交通', 'iCard', 'MTD', '出行'],
    lastUpdated: '2023-08-20'
  },
  {
    id: 'veoride-rules',
    category: 'transport',
    title: 'E-Scooters & Bikes (VeoRide)',
    summary: 'How to use campus scooters without getting fined.',
    content: `
### Using VeoRide

You will see teal e-scooters and bikes everywhere.

1.  **App:** Download the Veo app to unlock them.
2.  **Cost:** Usually $1 unlock + per minute fee. It adds up fast!
3.  **Parking:** **Crucial!** You must park in designated bike racks. If you leave it in the middle of a sidewalk, you might get fined or banned.
4.  **Riding:** Do NOT ride on the sidewalks on Green Street. Use the bike lanes.
    `,
    tags: ['scooter', 'bike', 'veo', 'transport', 'fines'],
    title_zh: '共享单车与滑板车 (VeoRide)',
    summary_zh: '如何使用校园滑板车并不被罚款。',
    content_zh: `
### 使用 VeoRide

你会看到满校园都是青色的电动滑板车和自行车。

1.  **App:** 下载 Veo App 扫码解锁。
2.  **费用:** 通常是 $1 解锁费 + 每分钟计费。骑久了很贵！
3.  **停车:** **关键！** 必须停在指定的自行车架区域。如果你把它扔在人行道中间，可能会被罚款或封号。
4.  **骑行:** 严禁在 Green Street 的人行道上骑行。请使用自行车道。
    `,
    tags_zh: ['滑板车', '自行车', 'Veo', '交通', '罚款'],
    lastUpdated: '2023-09-01'
  },

  // --- ACADEMICS ---
  {
    id: 'registration-101',
    category: 'academics',
    title: 'Course Registration Survival Guide',
    summary: 'Using Enterprise, Course Explorer, and what to do if a class is full.',
    content: `
### Registration Tips

1. **Know your Time Ticket.** Check Enterprise well in advance.
2. **Course Explorer.** Use this to find CRNs. It updates faster than the registration system UI.
3. **Notify Me.** If a class is full, set up a notification. Spots often open up during the first week of classes ("Add/Drop period").

**Gen Eds:** Don't just take "easy" classes. Take something interesting!
    `,
    tags: ['registration', 'classes', 'academics', 'course explorer', 'enterprise'],
    title_zh: '选课生存指南',
    summary_zh: 'Enterprise 使用技巧，以及课满了该怎么办。',
    content_zh: `
### 选课技巧

1. **确人你的 Time Ticket (选课时间)。** 提前在 Enterprise 查好。
2. **Course Explorer。** 用这个网站查 CRN 码。它的更新速度比选课系统界面快。
3. **Notify Me。** 如果课满了，设置个提醒。开学第一周 ("Add/Drop period") 经常会有人退课。

**通识课 (Gen Eds):** 别只选"水课"。选点真正有趣的！
    `,
    tags_zh: ['选课', '课程', '学术', 'Course Explorer', 'Enterprise'],
    lastUpdated: '2024-01-10'
  },
  {
    id: 'grainger-library',
    category: 'academics',
    title: 'Study Spots: Grainger Engineering Library',
    summary: 'The largest engineering library in the country. Open late!',
    content: `
### Grainger Library

Located on the Engineering Quad (North of Green St).

*   **Floors:**
    *   **Basement:** Group study, talking allowed.
    *   **1st Floor:** Social, Espresso Royale cafe.
    *   **2nd/3rd Floor:** Quiet zones.
    *   **4th Floor:** Absolute silence. Do not breathe too loud here.

**Exams:** During finals week, this place is packed 24/7. Arrive early to get a seat with an outlet.
    `,
    tags: ['library', 'study', 'engineering', 'grainger', 'quiet'],
    title_zh: '自习圣地：Grainger 工程图书馆',
    summary_zh: '全美最大的工程图书馆。开得很晚！',
    content_zh: `
### Grainger 图书馆

位于工学院 Quad (绿街以北)。

*   **楼层指南:**
    *   **地下室:** 小组学习区，允许说话。
    *   **一楼:** 社交区，有 Espresso Royale 咖啡厅。
    *   **二/三楼:** 安静区。
    *   **四楼:** 绝对安静区。在这里呼吸都不要太大声。

**考试周:** 期末周这里 24 小时爆满。想找个带插座的位置要早去。
    `,
    tags_zh: ['图书馆', '自习', '工学院', 'Grainger', '安静'],
    lastUpdated: '2024-03-10'
  },

  // --- DINING ---
  {
    id: 'green-street-eats',
    category: 'dining',
    title: 'Green Street Food Guide',
    summary: 'The best spots for bubble tea, late-night cravings, and lunch.',
    content: `
Green Street is the heart of campus dining.

*   **Bangkok Thai:** A classic staple.
*   **Signature Grill:** Great Indian fusion bowls.
*   **Teamoji / Kung Fu Tea:** For your boba fix.
*   **Cravings:** Authentic and affordable Chinese food.

**Tip:** Download the 'Chowbus' or 'Snackpass' apps for pickup deals.
    `,
    tags: ['food', 'restaurants', 'green street', 'dining', 'boba'],
    title_zh: 'Green Street 美食指南',
    summary_zh: '奶茶、夜宵和午餐的最佳去处。',
    content_zh: `
Green Street (绿街) 是校园餐饮的心脏。

*   **Bangkok Thai:** 经典的泰餐老店。
*   **Signature Grill:** 很棒的印墨融合菜。
*   **Teamoji / Kung Fu Tea:** 续命奶茶。
*   **Cravings:** 地道且实惠的中餐 (香槟第一家)。

**提示:** 下载 'Chowbus' 或 'Snackpass' APP 可以点单自提，常有优惠。
    `,
    tags_zh: ['美食', '餐厅', '绿街', '饮食', '奶茶'],
    lastUpdated: '2024-02-01'
  },

  // --- SAFETY ---
  {
    id: 'mckinley-health',
    category: 'safety',
    title: 'McKinley Health Center: Free Services',
    summary: 'Did you know you already paid for healthcare? How to use McKinley.',
    content: `
### McKinley Health Center

Your student fees cover most services here!

**What's Free?**
*   **Doctor Visits:** Primary care appointments are generally free.
*   **Over-the-Counter Packs:** You can get "Cold Care Packs" (cough drops, tissues, meds) and "Wound Care Packs" for free at the welcome desk.
*   **Dial-A-Nurse:** 24/7 medical advice over the phone if you aren't sure if you need to go to the ER.

**Location:** Lincoln Avenue, near the Ike and FAR/PAR.
    `,
    tags: ['health', 'doctor', 'medicine', 'mckinley', 'safety', 'free'],
    title_zh: 'McKinley 校医院：免费服务',
    summary_zh: '你知道你已经付过医疗费了吗？如何使用 McKinley。',
    content_zh: `
### McKinley 校医院

你的学杂费已经包含了这里的大部分服务！

**什么免费？**
*   **看医生:** 全科医生预约通常是免费的。
*   **非处方药包:** 你可以在前台免费领取 "感冒包" (含喉糖、纸巾、退烧药) 和 "外伤包"。
*   **Dial-A-Nurse:** 24/7 电话护士咨询。如果你不确定是否需要去急诊，可以先打这个电话。

**位置:** Lincoln Avenue，靠近 Ike 和 FAR/PAR。
    `,
    tags_zh: ['健康', '医生', '药', 'McKinley', '安全', '免费'],
    lastUpdated: '2024-08-01'
  },
  {
    id: 'safe-walks',
    category: 'safety',
    title: 'SafeWalks & SafeRides',
    summary: 'Never walk home alone at night. Campus safety services explained.',
    content: `
### Staying Safe at Night

UIUC offers services to ensure you don't have to travel alone at night.

**SafeWalks**
*   **What:** Student Patrol officers will walk with you.
*   **Number:** 217-333-1216
*   **Hours:** 9 PM to 2:30 AM.

**SafeRides**
*   **What:** MTD vans that pick you up if you are in an area not served by fixed bus routes at night.
*   **How:** Use the MTD Connect app or call.
*   **Rule:** It is *not* a free Uber. It is for safety when buses aren't running or accessible.
    `,
    tags: ['safety', 'police', 'walking', 'night', 'saferides', 'safewalks'],
    title_zh: 'SafeWalks 与 SafeRides',
    summary_zh: '永远不要独自走夜路。校园安全服务详解。',
    content_zh: `
### 夜间安全指南

UIUC 提供多种服务确保你不用独自走夜路。

**SafeWalks (陪走服务)**
*   **内容:** 学生巡逻员会陪你走到目的地。
*   **电话:** 217-333-1216
*   **时间:** 晚 9 点 至 凌晨 2:30。

**SafeRides (安全乘车)**
*   **内容:** MTD 面包车，在夜间固定公交线路覆盖不到的地方接你。
*   **方式:** 使用 MTD Connect App 或电话预约。
*   **规则:** 这*不是*免费的 Uber。它仅用于常规公交停运或无法到达时的安全保障。
    `,
    tags_zh: ['安全', '警察', '夜路', 'SafeRides', 'SafeWalks'],
    lastUpdated: '2024-08-01'
  },

  // --- SOCIAL ---
  {
    id: 'quad-day',
    category: 'social',
    title: 'Quad Day: The RSO Fair',
    summary: 'The most chaotic and fun Sunday of the year. Join one of 1000+ clubs.',
    content: `
### What is Quad Day?

Held on the Sunday before classes start, Quad Day is where hundreds of Registered Student Organizations (RSOs) set up booths on the Main Quad.

**Strategy:**
1.  **Bring Water:** It is usually hot.
2.  **Sign Up:** Don't be afraid to put your email down for 20 clubs. You can unsubscribe later.
3.  **Free Stuff:** You will get tons of pens, frisbees, and coupons.

**Missed it?** Check out the connection portal online to find clubs year-round.
    `,
    tags: ['social', 'clubs', 'rso', 'events', 'quad day', 'involvement'],
    title_zh: 'Quad Day：社团招新日',
    summary_zh: '一年中最混乱也最有趣的周日。加入 1000+ 个社团之一。',
    content_zh: `
### 什么是 Quad Day?

在开学前的周日举行，数百个注册学生组织 (RSOs) 会在 Main Quad 摆摊招新。

**攻略:**
1.  **带水:** 通常那天巨热。
2.  **尽管报名:** 别害怕给 20 个社团留邮箱。反正以后可以退订。
3.  **拿赠品:** 你会拿到无数的笔、飞盘和优惠券。

**错过了?** 全年都可以在学校官网的 connection portal 查找社团。
    `,
    tags_zh: ['社交', '社团', 'RSO', '活动', 'Quad Day'],
    lastUpdated: '2024-08-15'
  },
  {
    id: 'arc-vs-crce',
    category: 'social',
    title: 'Gym Wars: ARC vs. CRCE',
    summary: 'Which campus recreation center fits your workout style?',
    content: `
### ARC (Activities and Recreation Center)
*   **Vibe:** Massive, energetic, crowded.
*   **Best For:** Pickup basketball, huge weight lifting selection, rock climbing wall, cooking classes.
*   **Location:** Next to Memorial Stadium (near the Ike).

### CRCE (Campus Recreation Center East)
*   **Vibe:** Chill, quieter, more relaxed.
*   **Best For:** A quick treadmill run, swimming (has a slide and hot tub!), racquetball.
*   **Location:** Near Allen Hall and PAR/FAR.

**Access:** Both are free with your iCard!
    `,
    tags: ['gym', 'workout', 'sports', 'arc', 'crce', 'health'],
    title_zh: '健身房之战：ARC vs. CRCE',
    summary_zh: '哪个校园健身中心适合你？',
    content_zh: `
### ARC (Activities and Recreation Center)
*   **氛围:** 巨大、活力四射、拥挤。
*   **适合:** 打篮球、举重（器械极多）、攀岩墙、烹饪课。
*   **位置:** 纪念体育场旁边 (靠近 Ike)。

### CRCE (Campus Recreation Center East)
*   **氛围:** 冷静、安静、放松。
*   **适合:** 快速跑个步、游泳 (有滑梯和热水按摩池！)、壁球。
*   **位置:** 靠近 Allen Hall 和 PAR/FAR。

**权限:** 凭 iCard 均可免费进入！
    `,
    tags_zh: ['健身房', '运动', '体育', 'ARC', 'CRCE', '健康'],
    lastUpdated: '2024-01-20'
  }
];

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