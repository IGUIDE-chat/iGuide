// [CONFIG] Vite build configuration and plugin setup.
// [配置] Vite 构建配置和插件设置。
import path from "path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { qmdSearchPlugin } from "./scripts/qmdSearchGateway";
import type { IncomingMessage } from "http";

type ProxyMutableRequest = IncomingMessage & {
	_geminiProxyBody?: string;
	_geminiProxyPath?: string;
	_tavilyProxyBody?: string;
};

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, ".", "");
	const preProxyBodyPlugin: Plugin = {
		name: "pre-proxy-body-transform",
		configureServer(server) {
			server.middlewares.use((req, _res, next) => {
				const mutableReq = req as ProxyMutableRequest;
				const requestPath = req.url?.split("?")[0];
				if (
					req.method !== "POST" ||
					(requestPath !== "/api/gemini" && requestPath !== "/api/tavily")
				) {
					next();
					return;
				}

				let body = "";
				req.on("data", (chunk: Buffer) => {
					body += chunk.toString();
				});
				req.on("end", () => {
					try {
						const parsed = JSON.parse(body);
						if (requestPath === "/api/gemini") {
							const apiKey = env.GOOGLE_API_KEY;
							if (!apiKey) {
								next();
								return;
							}
							const model = parsed.model || "gemini-1.5-flash";
							delete parsed.model;
							mutableReq._geminiProxyPath =
								`/v1beta/models/${model}:generateContent?key=${apiKey}`;
							mutableReq._geminiProxyBody = JSON.stringify(parsed);
						} else if (requestPath === "/api/tavily") {
							if (!parsed.api_key && env.TAVILY_API_KEY) {
								parsed.api_key = env.TAVILY_API_KEY;
							}
							mutableReq._tavilyProxyBody = JSON.stringify(parsed);
						}
					} catch {
						if (requestPath === "/api/gemini") {
							const apiKey = env.GOOGLE_API_KEY;
							if (apiKey) {
								mutableReq._geminiProxyPath =
									`/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
								mutableReq._geminiProxyBody = body;
							}
						} else if (requestPath === "/api/tavily") {
							mutableReq._tavilyProxyBody = body;
						}
					}
					next();
				});
				req.on("error", () => next());
			});
		},
	};
	return {
		server: {
			port: 3000,
			host: "0.0.0.0",
			proxy: {
				"/api/coze": {
					target: "https://api.coze.com",
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/api\/coze/, ""),
					secure: false,
				},
				// DeepSeek chat proxy — in dev, injects Authorization header server-side (key never in bundle)
				"/api/deepseek-raw": {
					target: "https://api.deepseek.com",
					changeOrigin: true,
					rewrite: () => "/chat/completions",
					configure: (proxy) => {
						proxy.on("proxyReq", (proxyReq) => {
							const apiKey = env.DEEPSEEK_API_KEY;
							if (apiKey) {
								proxyReq.setHeader("Authorization", `Bearer ${apiKey}`);
							}
						});
					},
				},
				// Gemini proxy — in dev, injects API key server-side (key never in bundle)
				"/api/gemini": {
					target: "https://generativelanguage.googleapis.com",
					changeOrigin: true,
					configure: (proxy) => {
						proxy.on("proxyReq", (proxyReq, req) => {
							const mutableReq = req as ProxyMutableRequest;
							if (mutableReq._geminiProxyPath) {
								proxyReq.path = mutableReq._geminiProxyPath;
							}
							if (mutableReq._geminiProxyBody) {
								proxyReq.setHeader("Content-Type", "application/json");
								proxyReq.setHeader(
									"Content-Length",
									Buffer.byteLength(mutableReq._geminiProxyBody),
								);
								proxyReq.write(mutableReq._geminiProxyBody);
							}
						});
					},
				},
				// Tavily search proxy — in dev, injects API key server-side (key never in bundle)
				"/api/tavily": {
					target: "https://api.tavily.com",
					changeOrigin: true,
					rewrite: () => "/search",
					configure: (proxy) => {
						proxy.on("proxyReq", (proxyReq, req) => {
							const mutableReq = req as ProxyMutableRequest;
							if (mutableReq._tavilyProxyBody) {
								proxyReq.setHeader("Content-Type", "application/json");
								proxyReq.setHeader(
									"Content-Length",
									Buffer.byteLength(mutableReq._tavilyProxyBody),
								);
								proxyReq.write(mutableReq._tavilyProxyBody);
							}
						});
					},
				},
			},
		},
		plugins: [preProxyBodyPlugin, qmdSearchPlugin(), react()],
		define: {
			// Only inject public keys that are safe for frontend
			// NEVER inject sensitive API keys here
			"import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
				env.VITE_SUPABASE_URL,
			),
			"import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
				env.VITE_SUPABASE_ANON_KEY,
			),
			"import.meta.env.VITE_MAPBOX_TOKEN": JSON.stringify(
				env.VITE_MAPBOX_TOKEN || "",
			),
		},
		build: {
			chunkSizeWarningLimit: 600,
			rollupOptions: {
				output: {
					manualChunks(id) {
						if (id.includes("node_modules")) {
							if (
								id.includes("react") ||
								id.includes("react-dom") ||
								id.includes("react-router")
							) {
								return "vendor-react";
							}
							if (id.includes("framer-motion")) {
								return "vendor-motion";
							}
							if (id.includes("@supabase")) {
								return "vendor-supabase";
							}
							if (id.includes("mapbox-gl")) {
								return "vendor-mapbox";
							}
						}
					},
				},
			},
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
	};
});
