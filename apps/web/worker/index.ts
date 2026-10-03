import { createApiApp } from "./app"
import type { Env } from "./types"

const app = createApiApp()

export default {
  fetch: (request, env, ctx) => app.fetch(request, env, ctx),
} satisfies ExportedHandler<Env>
