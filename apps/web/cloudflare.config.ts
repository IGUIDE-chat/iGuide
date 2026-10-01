import { bindings, defineConfig } from "cf/config"

export default defineConfig({
  worker: {
    name: "web",
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
    env: {
      ASSETS: bindings.assets(),

      // Values live on the Worker as secrets, never in the repo or a VITE_ variable.
      DEEPSEEK_API_KEY: bindings.secret(),
      GOOGLE_API_KEY: bindings.secret(),
      SILICONFLOW_API_KEY: bindings.secret(),
      SUPABASE_ANON_KEY: bindings.secret(),
      SUPABASE_URL: bindings.secret(),
      TAVILY_API_KEY: bindings.secret(),
      EMBEDDING_API_BASE_URL: bindings.secret(),
      EMBEDDING_API_KEY: bindings.secret(),
      QMD_API_KEY: bindings.secret(),

      // QMD nodes are self-hosted HTTPS endpoints, not secrets, but they are
      // still deployment-specific so they stay out of the repo.
      QMD_CN_URL: bindings.secret(),
      QMD_US_URL: bindings.secret(),

      // The knowledge base index is built at 384 dimensions; changing this
      // requires re-embedding every document.
      EMBEDDING_DIMENSIONS: bindings.text("384"),
      EMBEDDING_MODEL: bindings.text("multilingual-e5-small"),
    },
  },
})
