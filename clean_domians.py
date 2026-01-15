import re
import requests
import concurrent.futures
import random
import time
from urllib.parse import urlparse

# ================= 配置区 =================
INPUT_FILE = "uiuc_all_sources_combined.json" # Auto-updated input
OUTPUT_FILE = "uiuc_final_knowledge_sources.txt"
TIMEOUT_SECONDS = 20               # 代理访问可能稍慢，放宽超时
MAX_THREADS = 10                   # 有了代理可以稍微大胆一点 (10线程)

# --- 🚀 代理配置 (在此填入购买的信息) ---
# 例如 Bright Data, Smartproxy, ProxyJet 等
PROXY_HOST = "ca.proxy-jet.io"   # User provided host
PROXY_PORT = "1010"              # User provided port
PROXY_USER = "2601146Ogu2-resi_region-US_Illinois" # User provided username with targeting
PROXY_PASS = "NqPGFQ3KV0f8Sn8"   # User provided password

# 构造代理 URL (自动检测是否填写)
PROXY_URL = None
if "你的代理" not in PROXY_HOST and PROXY_HOST != "":
    PROXY_URL = f"http://{PROXY_USER}:{PROXY_PASS}@{PROXY_HOST}:{PROXY_PORT}"
    print(f"🌍 已配置代理: {PROXY_HOST}:{PROXY_PORT}")
else:
    print("⚠️ 未配置代理，将使用本机 IP (容易被封)")


# 1. 垃圾黑名单 (看到这些词直接扔掉)
BLACKLIST = [
    # --- ✉️ 邮件与通讯 ---
    'autodiscover', 'smtp', 'imap', 'pop', 'mail', 'exchange', 'lync', 'sip', 'meet', 'owa', 'mx',
    
    # --- 🌐 网络基础设施 ---
    'vpn', 'dialin', 'remote', 'proxy', 'dns', 'ns1', 'ns2', 'dhcp', 'static', 'ip-', 'gw-', 'wireless',
    
    # --- 🖨️ 硬件设备 ---
    'printer', 'xerox', 'device', 'camera', 'cam', 'door', 'sensor', 'switch',
    
    # --- 🔐 身份验证与后台工具 (新增 webtools/tools) ---
    'shibboleth', 'auth', 'ad.', 'idm', 'login', 'sso', 'partner', 'admin', 'cpanel', 'secure',
    'webtools', 'tools', 'apps', 'portal', 'service',
    
    # --- 🔗 跳转与短链接 (新增 go/redirect) ---
    'go.', 'go-test', 'redirect', 'shorturl', 'url',
    
    # --- 🚧 开发与测试环境 ---
    'test', 'dev', 'stage', 'staging', 'beta', 'qa', 'sandbox', 'demo', 'temp',
    
    # --- 🗑️ 已废弃/旧系统 ---
    'cites', 'compass', 'compass2g', 'learn'
]

# 2. 核心话题映射 (根据你的需求定制)
# 脚本会优先把匹配这些词的域名归类到对应话题下
TOPIC_MAP = {
    "🏠 宿舍/生活 (Housing)": ['housing', 'certified', 'living', 'tenant', 'dining'],
    "💰 学费/财务 (Tuition/Aid)": ['osfa', 'cost', 'paymybill', 'financial'],
    "💉 疫苗/医疗 (Health/Vaccine)": ['mckinley', 'health', 'counseling', 'safety', 'covid'],
    "🛂 签证/身份 (Visa/ISSS)": ['isss', 'international'],
    "🍔 美食/活动 (Food/Union)": ['union', 'dining', 'food', 'campusrec'],
    "🎓 转专业/学院 (Academics)": ['registrar', 'grainger', 'business', 'las', 'aces', 'media', 'faa', 'education', 'cs', 'ece', 'math', 'admissions'],
    "💼 找工/职业 (Career)": ['career', 'hireillinois', 'grad'],
    "🛍️ 购物 (Shopping)": ['bookstore', 'techzone'],
    "✈️ 机场/交通 (Transport)": ['parking', 'transportation', 'facilities'],
    "🚔 安全 (Safety)": ['police', 'dps', 'security']
}

# ================= 核心逻辑 =================

def clean_domains_from_text(filename):
    """从乱码文本中提取干净的子域名"""
    print(f"🧹 正在读取并清洗 {filename} ...")
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ 错误：找不到 {filename}。请新建该文件并粘贴数据。")
        return []

    # 正则提取所有 .illinois.edu
    raw_domains = re.findall(r'([a-zA-Z0-9.-]+\.illinois\.edu)', content, re.IGNORECASE)
    unique_domains = set()

    for d in raw_domains:
        d = d.lower().strip()
        if d.startswith("www."): d = d[4:] # 去掉www去重
        
        # 排除主域名
        if d == "illinois.edu": continue
        
        # 黑名单过滤
        if any(bad in d for bad in BLACKLIST): continue
        
        # 排除机器生成的长域名
        if len(d) > 45 or re.search(r'^(vm|node|host|ip)\d+', d): continue

        unique_domains.add(d)
    
    print(f"✨ 初步清洗完成，剩余 {len(unique_domains)} 个潜在域名待检测。")
    return sorted(list(unique_domains))

def check_liveness(domain):
    """检测域名是否存活且包含有用文字 (Gentle & Content-Aware)"""
    url = f"https://{domain}"
    
    # 随机延时 (即使有代理也稍微睡一下，防止把代理池跑崩)
    time.sleep(random.uniform(0.5, 1.0))
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
    
    proxies = {"http": PROXY_URL, "https": PROXY_URL} if PROXY_URL else None

    try:
        # 允许重定向
        response = requests.get(url, headers=headers, proxies=proxies, timeout=TIMEOUT_SECONDS, allow_redirects=True)
        
        # 1. 必须是 200 OK
        if response.status_code != 200:
            return None
            
        # 2. 必须是 HTML 页面 (过滤掉图片、JSON、PDF等)
        content_type = response.headers.get('Content-Type', '').lower()
        if 'html' not in content_type:
            return None
            
        # 3. 简单的内容长度检测 (去除HTML标签后)
        # 粗略去除 <script>, <style> 和标签
        text = re.sub(r'<script.*?>.*?</script>', '', response.text, flags=re.DOTALL)
        text = re.sub(r'<style.*?>.*?</style>', '', text, flags=re.DOTALL)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        
        # 如果纯文本内容少于 200 个字符，可能只是一个登录框或者默认页，对知识库没用
        if len(text) > 200:
            # 还可以顺便打印个标题看看
            title_match = re.search(r'<title>(.*?)</title>', response.text, re.IGNORECASE)
            title = title_match.group(1).strip() if title_match else "No Title"
            print(f"   📖 [内容检测通过] {title[:30]}... ({len(text)} chars)")
            return response.url.rstrip('/')
            
    except Exception as e:
        # 调试模式：打印错误信息，看看是不是代理挂了
        print(f"   ❌ {domain}: {e}")
        pass
    return None

def classify_url(url):
    """根据话题对URL进行分类"""
    for topic, keywords in TOPIC_MAP.items():
        if any(k in url for k in keywords):
            return topic
    return "📂 其他有用资源 (Others)"

def main():
    # 1. 清洗
    candidates = clean_domains_from_text(INPUT_FILE)
    if not candidates: return

    # 2. 检测
    print(f"🚀 开始并发检测 (线程数: {MAX_THREADS}, 超时: {TIMEOUT_SECONDS}s)...")
    alive_urls = set()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        # 提交所有任务
        future_to_url = {executor.submit(check_liveness, d): d for d in candidates}
        
        # 处理结果
        completed_count = 0
        total_count = len(candidates)
        
        for future in concurrent.futures.as_completed(future_to_url):
            result = future.result()
            completed_count += 1
            if result:
                alive_urls.add(result)
                print(f"✅ [存活] {result}")
            
            # 简单的进度条
            if completed_count % 50 == 0:
                print(f"--- 进度: {completed_count}/{total_count} ---")

    # 3. 分类与保存
    print("\n📦 正在分类并保存结果...")
    
    categorized_data = {k: [] for k in TOPIC_MAP.keys()}
    categorized_data["📂 其他有用资源 (Others)"] = []

    for url in sorted(list(alive_urls)):
        category = classify_url(url)
        categorized_data[category].append(url)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("# UIUC Knowledge Base Source List\n")
        f.write("# Generated by Auto-Filter Script\n\n")
        
        for topic, urls in categorized_data.items():
            if urls:
                f.write(f"\n### {topic}\n")
                for u in urls:
                    f.write(f"{u}\n")

    print("\n" + "="*40)
    print(f"🎉 全部完成！")
    print(f"📉 原始输入: {len(candidates)} 个")
    print(f"💎 最终存活: {len(alive_urls)} 个")
    print(f"📄 结果已按话题分类保存至: {OUTPUT_FILE}")
    print("="*40)

if __name__ == "__main__":
    main()