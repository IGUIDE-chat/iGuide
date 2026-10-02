import path from "path"

import { cloudflare } from "@cloudflare/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { ViteMcp } from "vite-plugin-mcp"
import { defineConfig, loadEnv, lazyPlugins } from "vite-plus"

import { deepseekRawProxyPlugin } from "./scripts/deepseekRawGateway"
import { qmdSearchPlugin } from "./scripts/qmdSearchGateway"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "")
  return {
    plugins: lazyPlugins(() => [
      // Both dev-only gateways must mount before `cloudflare()`. Vite runs
      // `configureServer` hooks in plugin order and the Cloudflare pre-middleware
      // claims every `/api/*` path, so anything registered later is unreachable.
      // Going first is what keeps local hybrid search against `qmd-content`
      // working in dev and keeps the DeepSeek key out of the browser bundle.
      deepseekRawProxyPlugin(env),
      qmdSearchPlugin({ forceMode: env.QMD_SEARCH_MODE }),
      react(),
      ViteMcp(),
      // `cf build` and `cf deploy` delegate to `vite build`, which needs the
      // Cloudflare plugin to emit the Worker plus its static assets as Build
      // Output. Under `serve` the same plugin boots the Worker behind the dev
      // server, so dev exercises the production routing table instead of a proxy
      // that only simulates it. It is not hoisted out of `lazyPlugins`: that
      // would defeat the point of the helper.
      cloudflare(),
      tailwindcss(),
    ]),
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
                return "vendor-react"
              }
              if (id.includes("framer-motion")) {
                return "vendor-motion"
              }
              if (id.includes("@supabase")) {
                return "vendor-supabase"
              }
              if (id.includes("mapbox-gl")) {
                return "vendor-mapbox"
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
  }
})
