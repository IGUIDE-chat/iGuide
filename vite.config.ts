import { defineConfig } from "vite-plus"

// Generated output, vendored submodules and non-JS assets are not linted or formatted.
const ignorePatterns = ["**/node_modules/**", "**/dist/**", "**/.wrangler/**", "data_collection/**"]

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
        files: ["apps/web/**"],
        env: { browser: true },
      },
      {
        files: ["apps/web/functions/**"],
        env: { worker: true },
      },
      {
        files: ["apps/ai-agent/**"],
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
