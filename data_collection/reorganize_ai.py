import os
import shutil
import logging
from transformers import pipeline

# ================= 终极配置：覆盖几乎所有大学场景 =================
# reorganize_ai.py
BASE_DIR = "uiuc_knowledge_base"
# 重点：只让 AI 处理机器看不懂的文件
TARGET_DIR = os.path.join(BASE_DIR, "uncategorized")
# 1. 详细的自然语言描述 (给 AI 看的)
# 描述越具体，AI 判断越准。不要只写 "Housing"，要写 "housing and residence hall info"
CANDIDATE_LABELS = [
    # 核心：人与组织
    "university faculty or staff profile",       # 教授、员工
    "administrative department or office",       # 行政部门 (如教务处、校长室)
    "student organization or club",              # RSO、社团

    # 招生与录取
    "university admissions and enrollment information",  # 本科/研究生招生、录取、截止日期

    # 学术与教学
    "academic course syllabus and description",  # 课程介绍
    "degree major and minor requirements",       # 专业要求
    "academic calendar and deadlines",           # 校历、截止日期
    "library resources and databases",           # 图书馆

    # 新生与支持服务
    "new student orientation and academic support services",  # 新生说明会、辅导、写作中心

    # 生活与后勤
    "student housing and residence halls",       # 宿舍
    "dining services and menus",                 # 食堂
    "campus parking and transportation",         # 停车、公交
    "health and wellness services",              # 麦金利健康中心、心理咨询
    "student immunization and vaccination requirements",  # 疫苗、免疫要求
    "campus safety and police",                  # 警察、安全

    # 学生生活与社团
    "student life organizations and campus involvement",  # 学生生活、学生组织、活动

    # 体育与休闲
    "university athletics sports and recreation programs",  # 校队、健身房、运动设施

    # 国际学生与签证 (ISSS)
    "international student and scholar services and immigration",  # ISSS、签证、移民

    # 财务与职业
    "tuition, scholarships and financial aid",   # 学费、奖学金
    "career services and job opportunities",     # 招聘、职业规划

    # 研究与新闻
    "scientific research lab or project",        # 实验室、项目
    "university news, press release or story",   # 新闻
    "public event, workshop or seminar",         # 活动、讲座

    # 规则与技术
    "university policy and code of conduct",     # 规章制度
    "it support and software services",          # IT 服务、VPN、邮箱

    # 可及性与多元包容
    "disability resources and accessibility services",     # 残障支持、无障碍服务
    "diversity equity and inclusion offices and programs", # 多元、公平与包容

    # 校友与捐赠
    "alumni relations networks and giving opportunities",  # 校友、捐赠

    # 校园服务与后勤
    "campus services logistics and id cards",    # 校园卡、打印、邮件、失物招领

    # 垃圾过滤 (非常重要)
    "login page or access denied error",         # 登录页、403
    "website navigation menu or footer",         # 纯导航栏残留
    "404 page not found"                         # 404
]

# 2. 映射到简洁的文件夹名 (给硬盘看的)
LABEL_TO_DIR = {
    # People & Org
    "university faculty or staff profile": "people",
    "administrative department or office": "about", # 或者 "admin"
    "student organization or club": "student_life",

    # Academics
    "academic course syllabus and description": "academics",
    "degree major and minor requirements": "academics",
    "academic calendar and deadlines": "events", # 或者 "academics" 看你喜好
    "library resources and databases": "library",

    # Admissions & Enrollment
    "university admissions and enrollment information": "admissions",

    # Housing & Life
    "student housing and residence halls": "housing",
    "dining services and menus": "housing", # 通常食堂归宿舍管，或者单独 "dining"
    "campus parking and transportation": "transportation",
    "health and wellness services": "health",
    "student immunization and vaccination requirements": "health",
    "campus safety and police": "safety",

    # Orientation & Support
    "new student orientation and academic support services": "student_support",

    # Student Life & Orgs
    "student life organizations and campus involvement": "student_life",

    # Athletics & Recreation
    "university athletics sports and recreation programs": "athletics",

    # International & ISSS
    "international student and scholar services and immigration": "isss",

    # Money & Job
    "tuition, scholarships and financial aid": "financial",
    "career services and job opportunities": "career",

    # Research & News
    "scientific research lab or project": "research",
    "university news, press release or story": "news",
    "public event, workshop or seminar": "events",

    # Misc
    "university policy and code of conduct": "policies",
    "it support and software services": "it_services",

    # Accessibility & DEI
    "disability resources and accessibility services": "accessibility",
    "diversity equity and inclusion offices and programs": "diversity",

    # Alumni & Giving
    "alumni relations networks and giving opportunities": "alumni",

    # Campus Services & Logistics
    "campus services logistics and id cards": "campus_services",

    # Trash
    "login page or access denied error": "trash",
    "website navigation menu or footer": "trash",
    "404 page not found": "trash"
}

logging.basicConfig(level=logging.INFO)

class AIClassifier:
    def __init__(self):
        print("🧠 正在加载 AI 模型 (facebook/bart-large-mnli)... 这可能需要一点时间...")
        # 使用 Zero-Shot Classification 流水线
        # 它可以直接判断一句话属于哪个类别，无需任何训练数据
        # device=-1 表示用 CPU，如果你有 NVIDIA 显卡改成 device=0
        self.classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

    def classify(self, text):
        # 截取前 500 个字符给模型看（通常开头就包含了足够的信息）
        # 这样速度快，且不会超过模型长度限制
        sample_text = text[:500]
        
        result = self.classifier(
            sample_text,
            CANDIDATE_LABELS,
            multi_label=False # 强制单选
        )
        
        # result['labels'][0] 是得分最高的标签
        # result['scores'][0] 是置信度 (0-1)
        top_label = result['labels'][0]
        confidence = result['scores'][0]
        
        return top_label, confidence

def process_files_smartly():
    if not os.path.exists(TARGET_DIR):
        print("没有找到 uncategorized 文件夹。")
        return

    ai = AIClassifier()
    files = [f for f in os.listdir(TARGET_DIR) if f.endswith(".md")]
    print(f"🤖 AI 准备就绪，开始智能审阅 {len(files)} 个文件...\n")

    stats = {"moved": 0, "deleted": 0, "uncertain": 0}

    for filename in files:
        file_path = os.path.join(TARGET_DIR, filename)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 1. 基础过滤：如果内容太短，AI 也没法看，直接扔
            if len(content) < 150:
                print(f"🗑️ [过短] {filename}")
                os.remove(file_path)
                stats["deleted"] += 1
                continue

            # 2. AI 判决
            label, score = ai.classify(content)
            folder_name = LABEL_TO_DIR[label]
            
            # 3. 决策逻辑
            if folder_name == "trash":
                print(f"🗑️ [AI判定无效] {filename} (置信度: {score:.2f})")
                os.remove(file_path)
                stats["deleted"] += 1
            
            elif score > 0.4: # 置信度阈值，你可以根据效果调整
                target_dir = os.path.join(BASE_DIR, folder_name)
                os.makedirs(target_dir, exist_ok=True)
                
                # 移动文件
                new_path = os.path.join(target_dir, filename)
                shutil.move(file_path, new_path)
                
                print(f"✅ [{folder_name.upper()}] {filename} (置信度: {score:.2f})")
                stats["moved"] += 1
            else:
                print(f"⚠️ [不确定] {filename} (最高匹配: {label}, {score:.2f}) -> 保持原位")
                stats["uncertain"] += 1

        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print("\n" + "="*30)
    print(f"🤖 AI 归类完成")
    print(f"📦 成功归类: {stats['moved']}")
    print(f"🗑️ 删除垃圾: {stats['deleted']}")
    print(f"🤔 依然存疑: {stats['uncertain']}")
    print("="*30)

if __name__ == "__main__":
    process_files_smartly()