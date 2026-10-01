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
      // Everything outside /api/* is served straight from the asset store, so
      // the Worker only runs for API calls.
      runWorkerFirst: ["/api/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      // Public URL, already baked into the frontend bundle as VITE_API_GATEWAY_URL.
      API_GATEWAY_URL: bindings.text("https://api.iguide.chat"),
      // Values live on the Worker as secrets, never in the repo or a VITE_ variable.
      DEEPSEEK_API_KEY: bindings.secret(),
      TAVILY_API_KEY: bindings.secret(),
      GOOGLE_API_KEY: bindings.secret(),
      COZE_API_TOKEN: bindings.secret(),
      COZE_BOT_ID: bindings.secret(),
    },
  },
})
