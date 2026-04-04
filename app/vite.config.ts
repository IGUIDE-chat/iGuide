// [CONFIG] Vite build configuration and plugin setup.
// [配置] Vite 构建配置和插件设置。
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { qmdSearchPlugin } from './scripts/qmdSearchGateway'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/coze': {
          target: 'https://api.coze.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/coze/, ''),
          secure: false,
        },
        // DeepSeek chat proxy — in dev, injects Authorization header server-side (key never in bundle)
        '/api/deepseek-raw': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          rewrite: () => '/chat/completions',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const apiKey = env.DEEPSEEK_API_KEY
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`)
              }
            })
          },
        },
        // Gemini proxy — in dev, injects API key server-side (key never in bundle)
        '/api/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const apiKey = env.GOOGLE_API_KEY
              if (!apiKey) return
              let body = ''
              req.on('data', (chunk: Buffer) => {
                body += chunk.toString()
              })
              req.on('end', () => {
                try {
                  const parsed = JSON.parse(body)
                  const model = parsed.model || 'gemini-1.5-flash'
                  delete parsed.model
                  const newBody = JSON.stringify(parsed)
                  proxyReq.path = `/v1beta/models/${model}:generateContent?key=${apiKey}`
                  proxyReq.setHeader(
                    'Content-Length',
                    Buffer.byteLength(newBody)
                  )
                  proxyReq.write(newBody)
                } catch {
                  /* pass through as-is */
                }
              })
            })
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
              const apiKey = env.TAVILY_API_KEY
              if (!apiKey) return
              let body = ''
              req.on('data', (chunk: Buffer) => {
                body += chunk.toString()
              })
              req.on('end', () => {
                try {
                  const parsed = JSON.parse(body)
                  if (!parsed.api_key) parsed.api_key = apiKey
                  const newBody = JSON.stringify(parsed)
                  proxyReq.setHeader(
                    'Content-Length',
                    Buffer.byteLength(newBody)
                  )
                  proxyReq.write(newBody)
                } catch {
                  /* pass through as-is */
                }
              })
            })
          },
        },
      },
    },
    plugins: [qmdSearchPlugin(), react()],
    define: {
      // Only inject public keys that are safe for frontend
      // NEVER inject sensitive API keys here
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        env.VITE_SUPABASE_URL
      ),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY
      ),
      'import.meta.env.VITE_MAPBOX_TOKEN': JSON.stringify(
        env.VITE_MAPBOX_TOKEN || ''
      ),
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
      },
    },
  }
})
