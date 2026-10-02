import { bindings, defineConfig } from "cf/config"

export default defineConfig({
  accountId: "0481ad2de24325b3ec75151a21886fce",
  worker: {
    name: "uiuc",
    compatibilityDate: "2026-09-08",
    entrypoint: "worker/index.ts",
    placement: {
      mode: "smart",
    },
    domains: ["iguide.chat"],
    // Mirror the Dashboard settings for this Worker: its workers.dev subdomain
    // and Preview URLs are both enabled. `iguide.chat` stays a custom domain,
    // but its Production-only routing (Dashboard-owned `enabled` /
    // `previews_enabled`) cannot be expressed here, so `cf deploy` still asks
    // before touching it.
    workersDev: true,
    previewUrls: true,
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
      traces: { enabled: true },
    },
    env: {
      ASSETS: bindings.assets(),

      // Values live on the Worker as secrets, never in the repo or a VITE_ variable.
      DEEPSEEK_API_KEY: bindings.secret(),
      GOOGLE_API_KEY: bindings.secret(),
      SUPABASE_ANON_KEY: bindings.secret(),
      SUPABASE_URL: bindings.secret(),
      TAVILY_API_KEY: bindings.secret(),
    },
  },
})
