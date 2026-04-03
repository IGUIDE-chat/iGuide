// [CONFIG] Vite build configuration and plugin setup.
// [配置] Vite 构建配置和插件设置。
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { qmdSearchPlugin } from './scripts/qmdSearchGateway';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/coze': {
          target: 'https://api.coze.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/coze/, ''),
          secure: false
        },
        // DeepSeek chat proxy — in dev, injects Authorization header server-side (key never in bundle)
        '/api/deepseek-raw': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          rewrite: () => '/chat/completions',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const apiKey = env.DEEPSEEK_API_KEY;
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
              }
            });
          },
        },
        // Gemini proxy — in dev, injects API key server-side (key never in bundle)
        '/api/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const apiKey = env.GOOGLE_API_KEY;
              if (!apiKey) return;
              let body = '';
              req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
              req.on('end', () => {
                try {
                  const parsed = JSON.parse(body);
                  const model = parsed.model || 'gemini-1.5-flash';
                  delete parsed.model;
                  const newBody = JSON.stringify(parsed);
                  proxyReq.path = `/v1beta/models/${model}:generateContent?key=${apiKey}`;
                  proxyReq.setHeader('Content-Length', Buffer.byteLength(newBody));
                  proxyReq.write(newBody);
                } catch { /* pass through as-is */ }
              });
            });
          },
        },
        // Tavily search proxy — in dev, injects API key server-side (key never in bundle)
        '/api/tavily': {
          target: 'https://api.tavily.com',
          changeOrigin: true,
          rewrite: () => '/search',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              // Inject API key into the forwarded request body
              const apiKey = env.TAVILY_API_KEY;
              if (!apiKey) return;
              let body = '';
              req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
              req.on('end', () => {
                try {
                  const parsed = JSON.parse(body);
                  if (!parsed.api_key) parsed.api_key = apiKey;
                  const newBody = JSON.stringify(parsed);
                  proxyReq.setHeader('Content-Length', Buffer.byteLength(newBody));
                  proxyReq.write(newBody);
                } catch { /* pass through as-is */ }
              });
            });
          },
        }
      }
    },
    plugins: [
      qmdSearchPlugin(),
      react(),
      // Dev-only middleware for /api/translate — mirrors CF Function behaviour
      {
        name: 'translate-middleware',
        configureServer(server) {
          server.middlewares.use('/api/translate', async (req, res) => {
            const apiKey = (env.GOOGLE_API_KEY || '').trim();
            if (!apiKey) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing GOOGLE_API_KEY in .env.local' }));
              return;
            }
            let raw = '';
            req.on('data', (chunk: Buffer) => { raw += chunk.toString(); });
            req.on('end', async () => {
              try {
                const { text, targetLang } = JSON.parse(raw) as { text: string; targetLang: string };
                const prompt = `Translate the following user comment to ${targetLang}. Preserve the original tone, emotion, humor, slang, internet language, and emoji exactly. Return ONLY the translated text — no explanations, no quotes, nothing else.\n\n${text}`;
                const geminiRes = await fetch(
                  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contents: [{ parts: [{ text: prompt }] }],
                      generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
                    }),
                  },
                );
                const data = await geminiRes.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
                const translated = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ reply: translated }));
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Unknown error';
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: msg }));
              }
            });
          });
        },
      },
    ],
    define: {
      // Only inject public keys that are safe for frontend
      // NEVER inject sensitive API keys here
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_MAPBOX_TOKEN': JSON.stringify(env.VITE_MAPBOX_TOKEN || '')
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['framer-motion'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-mapbox': ['mapbox-gl'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
