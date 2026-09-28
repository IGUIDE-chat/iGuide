import { bindings, defineConfig } from "cf/config"

/**
 * Secret-like files were detected but not read or migrated: .dev.vars, .dev.vars.example. Only `secrets.required` entries are migrated.
 * @see https://developers.cloudflare.com/workers/configuration/secrets/
 */

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
