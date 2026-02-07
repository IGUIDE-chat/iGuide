import requests

# 代理配置 (使用之前截图里的信息，这应该是正确的)
PROXY_HOST = "ca.proxy-jet.io"
PROXY_PORT = "1010"
PROXY_USER = "2601146Ogu2-resi_region-US_Illinois"
PROXY_PASS = "NqPGFQ3KV0f8Sn8"

# 构造 URL
PROXY_URL = f"http://{PROXY_USER}:{PROXY_PASS}@{PROXY_HOST}:{PROXY_PORT}"

def test_proxy():
    print("🚀 Starting Proxy Connectivity Test...")
    print(f"   Target: {PROXY_HOST}:{PROXY_PORT}")
    print(f"   User:   {PROXY_USER}")
    
    proxies = {
        "http": PROXY_URL,
        "https": PROXY_URL,
    }
    
    # 1. Test HTTP
    try:
        print("\n1️⃣  Testing HTTP (http://httpbin.org/ip)...")
        r = requests.get("http://httpbin.org/ip", proxies=proxies, timeout=20)
        print(f"   ✅ Success! Your IP appears as: {r.json().get('origin')}")
    except Exception as e:
        print(f"   ❌ HTTP Connection Failed: {e}")

    # 2. Test HTTPS
    try:
        print("\n2️⃣  Testing HTTPS (https://httpbin.org/ip)...")
        r = requests.get("https://httpbin.org/ip", proxies=proxies, timeout=20)
        print(f"   ✅ Success! Your IP appears as: {r.json().get('origin')}")
    except Exception as e:
        print(f"   ❌ HTTPS Connection Failed: {e}")

if __name__ == "__main__":
    test_proxy()
