import { defineConfig } from "cf/config"

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
      // Everything outside these prefixes is served straight from the asset
      // store, so the Worker only runs for API calls and the paths that are
      // still proxied to the legacy landing site.
      runWorkerFirst: ["/api/*", "/about*", "/terms*", "/featureA*", "/featureB*"],
    },
  },
})
