import random
import logging

class RequestMiddleware:
    def __init__(self, proxy_file="proxies.txt"):
        # Pool of realistic, modern browser user agents
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15"
        ]
        
        # Pool of proxy endpoints (optional)
        self.proxies = []
        self._load_proxies(proxy_file)

    def _load_proxies(self, proxy_file):
        """
        Load proxy IPs from a file.
        Expected formats: http://ip:port or http://user:pass@ip:port
        """
        try:
            with open(proxy_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        # 标准化处理
                        if not line.startswith("http"):
                            line = f"http://{line}"
                        self.proxies.append(line)
            if self.proxies:
                logging.info(f"🛡️ 加载了 {len(self.proxies)} 个代理 IP")
        except FileNotFoundError:
            logging.warning("⚠️ proxies.txt not found, using direct connections without proxies")

    def get_random_header(self):
        """Return HTTP headers with a randomized User-Agent."""
        return {
            "User-Agent": random.choice(self.user_agents),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }

    def get_random_ua(self):
        """Return a random User-Agent string (for Playwright)."""
        return random.choice(self.user_agents)

    def get_random_proxy(self):
        """Return a random proxy URL (aiohttp-format) or None if not configured."""
        if not self.proxies:
            return None
        return random.choice(self.proxies)

    def get_playwright_proxy(self):
        """Return a proxy configuration dict formatted for Playwright.

        Playwright expects: {'server': 'http://ip:port', 'username': '...', 'password': '...'}
        """
        proxy_url = self.get_random_proxy()
        if not proxy_url: return None
        
        # 简单的解析逻辑
        from urllib.parse import urlparse
        parsed = urlparse(proxy_url)
        
        config = {
            "server": f"{parsed.scheme}://{parsed.hostname}:{parsed.port}"
        }
        if parsed.username:
            config["username"] = parsed.username
            config["password"] = parsed.password
            
        return config
    
