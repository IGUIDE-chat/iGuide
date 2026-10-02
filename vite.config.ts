import { defineConfig } from "vite-plus"

// Generated output, vendored submodules and non-JS assets are not linted or formatted.
const ignorePatterns = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.cloudflare/**",
  "data_collection/**",
]

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },

  // `vp dev`, `vp build`, and `vp preview` target the web app when run at the root.
  defaultPackage: { dev: "./apps/web", build: "./apps/web", preview: "./apps/web" },
  fmt: {
    semi: false,
    sortImports: true,
    sortTailwindcss: true,
    ignorePatterns,
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
    ignorePatterns,
    overrides: [
      {
        files: ["apps/web/**", "packages/ui/**"],
        env: { browser: true },
      },
      {
        // The Worker is console-heavy by design: agent-loop diagnostics and tool
        // call traces are only visible in Workers Logs.
        files: ["apps/web/worker/**"],
        env: { worker: true },
        rules: { "no-console": "off" },
      },
      {
        files: ["tools/**"],
        env: { node: true },
      },
    ],
  },
})
