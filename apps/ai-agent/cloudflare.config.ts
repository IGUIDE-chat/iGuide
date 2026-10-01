import { bindings, defineConfig } from "cf/config"

/**
 * Secret-like files were detected but not read or migrated: .dev.vars, .dev.vars.example. Only `secrets.required` entries are migrated.
 * @see https://developers.cloudflare.com/workers/configuration/secrets/
 */

// TODO(deploy): Workers Builds for this Worker is still configured with the
// pre-9478f98 setup (root `apps/ai-agent`, deploy `npx wrangler deploy`). There
// is no wrangler config here any more, so the next build that touches `src/`
// will fail or deploy the wrong thing. Switch it to match the `web` Worker:
// root `/`, build `pnpm install --frozen-lockfile`, deploy
// `cd apps/ai-agent && npx cf deploy`. api.iguide.chat still runs the
// 2026-09-28 version, so verify main on a preview version before switching.

export default defineConfig({
  worker: {
    name: "ai-agent",
    compatibilityDate: "2026-09-08",
    entrypoint: "src/index.ts",
    placement: {
      mode: "smart",
    },
    observability: {
      enabled: true,
    },
    env: {
      EMBEDDING_DIMENSIONS: bindings.text("384"),
      EMBEDDING_MODEL: bindings.text("multilingual-e5-small"),
      USE_TOOL_USE_RAG: bindings.text("false"),
    },
  },
})
