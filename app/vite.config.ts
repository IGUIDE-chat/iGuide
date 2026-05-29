// [CONFIG] Vite build configuration and plugin setup.
// [配置] Vite 构建配置和插件设置。
import { mkdir, writeFile } from "node:fs/promises";
import { type ClientRequest, type IncomingMessage, type OutgoingHttpHeaders } from "node:http";
import path from "path";
import { defineConfig, loadEnv } from "vite-plus";
import react from "@vitejs/plugin-react";
import { qmdSearchPlugin } from "./scripts/qmdSearchGateway";
import { ViteMcp } from "vite-plugin-mcp";

const TRUTHY_ENV_VALUES = new Set(["1", "true", "yes", "on"]);
const SENSITIVE_HEADERS = new Set(["authorization", "cookie", "proxy-authorization", "x-api-key"]);
const SENSITIVE_QUERY_KEYS = new Set(["access_token", "api_key", "key", "token"]);

type DevEnv = Record<string, string>;

interface LlmRequestDumpInput {
  env: DevEnv;
  provider: string;
  localPath?: string;
  upstreamUrl: string;
  proxyReq: ClientRequest;
  body: string;
}

let llmDumpCounter = 0;

function isTruthyEnv(value: string | undefined) {
  return TRUTHY_ENV_VALUES.has((value ?? "").trim().toLowerCase());
}

function redactHeaders(headers: OutgoingHttpHeaders, includeSecrets: boolean) {
  if (includeSecrets) {
    return headers;
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      SENSITIVE_HEADERS.has(key.toLowerCase()) ? "[REDACTED]" : value,
    ]),
  );
}

function redactUrl(rawUrl: string, includeSecrets: boolean) {
  if (includeSecrets) {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl);
    for (const key of SENSITIVE_QUERY_KEYS) {
      if (url.searchParams.has(key)) {
        url.searchParams.set(key, "[REDACTED]");
      }
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

function parseJsonBody(body: string) {
  if (!body.trim()) {
    return null;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

async function dumpLlmRequest({
  env,
  provider,
  localPath,
  upstreamUrl,
  proxyReq,
  body,
}: LlmRequestDumpInput) {
  if (!isTruthyEnv(env.LLM_REQUEST_DUMP)) {
    return;
  }

  const includeSecrets = isTruthyEnv(env.LLM_REQUEST_DUMP_INCLUDE_SECRETS);
  const timestamp = new Date().toISOString();
  const requestId = `${timestamp.replaceAll(/[:.]/g, "-")}-${String(++llmDumpCounter).padStart(4, "0")}`;
  const dumpDir = path.resolve(env.LLM_REQUEST_DUMP_DIR || ".debug/llm-requests");
  const filePath = path.join(dumpDir, `${requestId}-${provider}.json`);
  const bodyJson = parseJsonBody(body);

  try {
    await mkdir(dumpDir, { recursive: true });
    await writeFile(
      filePath,
      JSON.stringify(
        {
          requestId,
          timestamp,
          provider,
          localPath,
          method: proxyReq.method,
          upstreamUrl: redactUrl(upstreamUrl, includeSecrets),
          includeSecrets,
          headers: redactHeaders(proxyReq.getHeaders(), includeSecrets),
          bodyText: body,
          bodyJson,
        },
        null,
        2,
      ),
      "utf8",
    );

    console.log(`[LLM dump] ${provider} request written to ${filePath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[LLM dump] Failed to write ${provider} request: ${message}`);
  }
}

function collectRequestBody(req: IncomingMessage, onEnd: (body: string) => void) {
  const chunks: Buffer[] = [];
  req.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });
  req.on("end", () => {
    onEnd(Buffer.concat(chunks).toString("utf8"));
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      proxy: {
        "/api/chat": {
          target: "http://localhost:8787/chat",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/chat/, ""),
        },
        "/api/coze": {
          target: "https://api.coze.com",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/coze/, ""),
          secure: false,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              collectRequestBody(req, (body) => {
                void dumpLlmRequest({
                  env,
                  provider: "coze",
                  localPath: req.url,
                  upstreamUrl: `https://api.coze.com${proxyReq.path}`,
                  proxyReq,
                  body,
                });
              });
            });
          },
        },
        // DeepSeek chat proxy — in dev, injects Authorization header server-side (key never in bundle)
        "/api/deepseek-raw": {
          target: "https://api.deepseek.com",
          changeOrigin: true,
          rewrite: () => "/chat/completions",
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              const apiKey = env.DEEPSEEK_API_KEY;
              if (apiKey) {
                proxyReq.setHeader("Authorization", `Bearer ${apiKey}`);
              }
              collectRequestBody(req, (body) => {
                void dumpLlmRequest({
                  env,
                  provider: "deepseek",
                  localPath: req.url,
                  upstreamUrl: "https://api.deepseek.com/chat/completions",
                  proxyReq,
                  body,
                });
              });
            });
          },
        },
        // Gemini proxy — in dev, injects API key server-side (key never in bundle)
        "/api/gemini": {
          target: "https://generativelanguage.googleapis.com",
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              const apiKey = env.GOOGLE_API_KEY;
              if (!apiKey) {
                return;
              }
              let body = "";
              req.on("data", (chunk: Buffer) => {
                body += chunk.toString();
              });
              req.on("end", () => {
                try {
                  const parsed = JSON.parse(body);
                  const model = parsed.model ?? "gemini-1.5-flash";
                  delete parsed.model;
                  const newBody = JSON.stringify(parsed);
                  proxyReq.path = `/v1beta/models/${model}:generateContent?key=${apiKey}`;
                  proxyReq.setHeader("Content-Length", Buffer.byteLength(newBody));
                  void dumpLlmRequest({
                    env,
                    provider: "gemini",
                    localPath: req.url,
                    upstreamUrl: `https://generativelanguage.googleapis.com${proxyReq.path}`,
                    proxyReq,
                    body: newBody,
                  });
                  proxyReq.write(newBody);
                } catch {
                  /* pass through as-is */
                  void dumpLlmRequest({
                    env,
                    provider: "gemini",
                    localPath: req.url,
                    upstreamUrl: `https://generativelanguage.googleapis.com${proxyReq.path}`,
                    proxyReq,
                    body,
                  });
                }
              });
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
              // Inject API key into the forwarded request body
              const apiKey = env.TAVILY_API_KEY;
              if (!apiKey) {
                return;
              }
              let body = "";
              req.on("data", (chunk: Buffer) => {
                body += chunk.toString();
              });
              req.on("end", () => {
                try {
                  const parsed = JSON.parse(body);
                  parsed.api_key ??= apiKey;
                  const newBody = JSON.stringify(parsed);
                  proxyReq.setHeader("Content-Length", Buffer.byteLength(newBody));
                  void dumpLlmRequest({
                    env,
                    provider: "tavily",
                    localPath: req.url,
                    upstreamUrl: `https://api.tavily.com${proxyReq.path}`,
                    proxyReq,
                    body: newBody,
                  });
                  proxyReq.write(newBody);
                } catch {
                  /* pass through as-is */
                  void dumpLlmRequest({
                    env,
                    provider: "tavily",
                    localPath: req.url,
                    upstreamUrl: `https://api.tavily.com${proxyReq.path}`,
                    proxyReq,
                    body,
                  });
                }
              });
            });
          },
        },
      },
    },
    plugins: [qmdSearchPlugin(), react(), ViteMcp()],
    define: {
      // Only inject public keys that are safe for frontend
      // NEVER inject sensitive API keys here
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      "import.meta.env.VITE_MAPBOX_TOKEN": JSON.stringify(env.VITE_MAPBOX_TOKEN || ""),
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
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
