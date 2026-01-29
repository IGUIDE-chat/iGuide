import requests
import re
import json
import time
import concurrent.futures
import sys

# 尝试导入数据库驱动，如果没有安装则标记不可用
try:
    import psycopg2
    DB_DRIVER_AVAILABLE = True
except ImportError:
    DB_DRIVER_AVAILABLE = False

# ================= 配置区 =================
TARGET_DOMAIN = "illinois.edu"
OUTPUT_FILE = "uiuc_all_sources_combined.json"

# 伪装 Header
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
}

class TotalWarMiner:
    def __init__(self):
        self.found_domains = set()

    def clean_domain(self, raw_domain):
        """清洗域名：去空格、转小写、去通配符"""
        d = raw_domain.lower().strip()
        # 提取纯域名
        match = re.search(r'([a-zA-Z0-9.-]+\.illinois\.edu)', d)
        if match:
            d = match.group(1)
        else:
            return None
        
        if d.startswith('.'): d = d[1:]
        if '*' in d: return None 
        if not d.endswith(TARGET_DOMAIN): return None
        if len(d) > 80: return None
        return d

    def extract_from_text(self, text):
        """通用正则提取"""
        pattern = r'([a-zA-Z0-9.-]+\.illinois\.edu)'
        matches = re.findall(pattern, text, re.IGNORECASE)
        return [self.clean_domain(m) for m in matches if self.clean_domain(m)]

    # ================= 1. 快速 API 源 (并发) =================
    
    def run_rapiddns(self):
        print("   Running Source: RapidDNS...")
        try:
            url = f"https://rapiddns.io/subdomain/{TARGET_DOMAIN}?full=1"
            resp = requests.get(url, headers=HEADERS, timeout=15)
            res = self.extract_from_text(resp.text)
            print(f"   ✅ RapidDNS: 找到 {len(res)} 个")
            return res
        except Exception as e:
            print(f"   ❌ RapidDNS: 失败 ({e})")
            return []

    def run_hackertarget(self):
        print("   Running Source: HackerTarget...")
        try:
            url = f"https://api.hackertarget.com/hostsearch/?q={TARGET_DOMAIN}"
            resp = requests.get(url, headers=HEADERS, timeout=5)
            res = self.extract_from_text(resp.text)
            print(f"   ✅ HackerTarget: 找到 {len(res)} 个")
            return res
        except Exception as e:
            print(f"   ❌ HackerTarget: 失败 (超时或无响应)")
            return []

    def run_threatminer(self):
        print("   Running Source: ThreatMiner...")
        try:
            url = f"https://api.threatminer.org/v2/domain.php?q={TARGET_DOMAIN}&rt=5"
            resp = requests.get(url, headers=HEADERS, timeout=5)
            res = self.extract_from_text(resp.text)
            print(f"   ✅ ThreatMiner: 找到 {len(res)} 个")
            return res
        except Exception as e:
            print(f"   ❌ ThreatMiner: 失败 (超时或无响应)")
            return []

    def run_anubis(self):
        print("   Running Source: Anubis...")
        try:
            url = f"https://jldc.me/anubis/subdomains/{TARGET_DOMAIN}"
            resp = requests.get(url, headers=HEADERS, timeout=5)
            res = self.extract_from_text(resp.text)
            print(f"   ✅ Anubis: 找到 {len(res)} 个")
            return res
        except Exception as e:
            print(f"   ❌ Anubis: 失败 (超时或无响应)")
            return []

    def run_urlscan(self):
        print("   Running Source: URLScan...")
        try:
            url = f"https://urlscan.io/api/v1/search/?q=domain:{TARGET_DOMAIN}&size=1000"
            resp = requests.get(url, headers=HEADERS, timeout=10)
            res = self.extract_from_text(resp.text)
            print(f"   ✅ URLScan: 找到 {len(res)} 个")
            return res
        except Exception as e:
            print(f"   ❌ URLScan: 失败 (超时或无响应)")
            return []

    def run_wayback(self):
        print("   Running Source: Wayback Machine (Pagination Mode)...")
        all_domains = set()
        
        # 1. 尝试获取总页数 (每页 10000 条，减少单次压力)
        # cdx?url=...&showNumPages=true
        base_url = f"http://web.archive.org/cdx/search/cdx?url=*.{TARGET_DOMAIN}/*&output=json&collapse=urlkey&fl=original&page="
        
        try:
            # 先请求 num_pages
            num_pages_url = f"http://web.archive.org/cdx/search/cdx?url=*.{TARGET_DOMAIN}/*&output=json&collapse=urlkey&showNumPages=true"
            print("   ⏳ Wayback: 计算总页数中...")
            resp = requests.get(num_pages_url, headers=HEADERS, timeout=30)
            
            if resp.status_code == 200 and resp.text.strip().isdigit():
                num_pages = int(resp.text.strip())
                print(f"   📖 Wayback: 共发现 {num_pages} 页数据，开始逐页抓取...")
                
                # 限制最大页数，防止跑太久 (比如只跑前 5 页或更多)
                # 如果想跑全量，可以去掉 [:5]
                pages_to_scan = range(num_pages)
                if num_pages > 10:
                    print(f"   ⚠️ 页数过多 ({num_pages})，仅抓取前 10 页以节省时间...")
                    pages_to_scan = range(10)

                for page in pages_to_scan:
                    try:
                        p_url = f"{base_url}{page}"
                        r = requests.get(p_url, headers=HEADERS, timeout=20)
                        if r.status_code == 200:
                            extracted = self.extract_from_text(r.text)
                            all_domains.update(extracted)
                            print(f"      - Page {page+1}/{len(pages_to_scan)}: 提取 {len(extracted)} 个 (累计: {len(all_domains)})")
                        else:
                            print(f"      - Page {page+1}: 状态码 {r.status_code}")
                    except Exception as e:
                        print(f"      - Page {page+1}: 超时/错误 ({e})")
                        
            else:
                # 如果拿不到页数，回退到单次请求 (带 Limit)
                print("   ⚠️ 无法获取页数，回退到普通模式 (Limit 50000)...")
                url = f"http://web.archive.org/cdx/search/cdx?url=*.{TARGET_DOMAIN}/*&output=json&collapse=urlkey&fl=original&limit=50000"
                resp = requests.get(url, headers=HEADERS, timeout=40)
                all_domains.update(self.extract_from_text(resp.text))

            print(f"   ✅ Wayback Machine: 总计找到 {len(all_domains)} 个")
            return list(all_domains)

        except Exception as e:
            print(f"   ❌ Wayback Machine: 致命错误 ({e})")
            return list(all_domains)


    # ================= 2. 本地文件加载 (替代 crt.sh) =================

    def load_from_local_file(self):
        filename = "try.txt"
        print(f"   📂 读取本地文件: {filename} ...")
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 使用现有正则提取
            res = self.extract_from_text(content)
            print(f"   ✅ 本地文件 ({filename}): 提取到 {len(res)} 个域名")
            return res
        except FileNotFoundError:
            print(f"   ❌ 错误: 找不到文件 {filename}")
            return []
        except Exception as e:
            print(f"   ❌ 读取文件失败: {e}")
            return []

    # ================= 主逻辑 =================

    def start(self):
        print(f"🚀 [全能合体版] 开始全网扫描: {TARGET_DOMAIN}")
        print("="*50)

        # 1. 优先跑 API 源
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [
                executor.submit(self.run_rapiddns),
                executor.submit(self.run_hackertarget),
                executor.submit(self.run_threatminer),
                executor.submit(self.run_anubis),
                executor.submit(self.run_urlscan),
                executor.submit(self.run_wayback)
            ]
            for future in concurrent.futures.as_completed(futures):
                res = future.result()
                if res: self.found_domains.update(res)

        # 2. 读取本地 try.txt
        local_res = self.load_from_local_file()
        self.found_domains.update(local_res)

        # 3. 保存
        final_list = sorted(list(self.found_domains))
        print("\n" + "="*50)
        print(f"🎉 任务全部完成！")
        print(f"💎 聚合去重后域名总数: {len(final_list)} 个")
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(final_list, f, indent=4)
            
        print(f"💾 结果已保存为 JSON: {OUTPUT_FILE}")
        print(f"👉 务必进行 check_liveness 清洗！")

if __name__ == "__main__":
    miner = TotalWarMiner()
    miner.start()