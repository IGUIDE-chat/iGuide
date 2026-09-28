import { readFile } from "node:fs/promises"

import { cloudflare } from "@cloudflare/vite-plugin"
import { defineConfig, type Plugin } from "vite-plus"

/**
 * The agent imports its prompt templates as `.md` modules. Wrangler served
 * those through a Text module rule; under the Vite pipeline the file contents
 * are inlined at build time instead, so the Worker bundle ships no Markdown
 * modules and needs no upload-time rules.
 */
function markdownAsRaw(): Plugin {
  return {
    name: "markdown-as-raw",
    enforce: "pre",
    async load(id) {
      const path = id.split("?", 1)[0]
      if (!path.endsWith(".md")) return null
      const source = await readFile(path, "utf-8")
      return `export default ${JSON.stringify(source)}`
    },
  }
}

// The worker entrypoint, bindings, and build options all live in
// cloudflare.config.ts; this file only wires cf's build pipeline to Vite.
export default defineConfig({
  // Keeps the documented local gateway URL (http://localhost:8787) stable now
  // that the dev server runs through Vite instead of `wrangler dev`.
  server: {
    port: 8787,
    strictPort: true,
  },
  plugins: [markdownAsRaw(), cloudflare()],
})
