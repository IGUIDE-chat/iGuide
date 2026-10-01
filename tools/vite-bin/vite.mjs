#!/usr/bin/env node
// `cf build` and `cf deploy` detect a Vite project and run `npx vite build`.
// In this workspace `vite` is an alias for @voidzero-dev/vite-plus-core, which
// ships no `vite` bin, so npx would download an unpinned vite from the
// registry. Forward to the pinned vite-plus `vp` instead.
import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import path from "node:path"

const require = createRequire(import.meta.url)
const vp = path.join(path.dirname(require.resolve("vite-plus/package.json")), "bin", "vp")

const result = spawnSync(process.execPath, [vp, ...process.argv.slice(2)], { stdio: "inherit" })
if (result.error) throw result.error
process.exit(result.status ?? 1)
