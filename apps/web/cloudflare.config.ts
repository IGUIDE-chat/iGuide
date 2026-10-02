import { bindings, defineConfig } from "cf/config"

export default defineConfig({
  worker: {
    name: "uiuc",
    compatibilityDate: "2026-09-08",
    entrypoint: "worker/index.ts",
    placement: {
      mode: "smart",
    },
    assets: {
      // Client-side routes such as /dorms must still resolve to index.html
      // instead of 404ing on a hard refresh.
      notFoundHandling: "single-page-application",
      // Every API endpoint lives under /api/*, so this one pattern routes the
      // whole API surface to the Worker while assets serve straight from the
      // asset store. The SPA and its API are therefore same-origin.
      runWorkerFirst: ["/api/*"],
    },
    observability: {
      enabled: true,
      logs: { enabled: true },
      issues: { enabled: true },
    },
    env: {
      ASSETS: bindings.assets(),

      // Values live on the Worker as secrets, never in the repo or a VITE_ variable.
      DEEPSEEK_API_KEY: bindings.secret(),
      GOOGLE_API_KEY: bindings.secret(),
      SILICONFLOW_API_KEY: bindings.secret(),
      SUPABASE_ANON_KEY: bindings.secret(),
      SUPABASE_URL: bindings.secret(),
      TAVILY_API_KEY: bindings.secret(),
    },
  },
})
