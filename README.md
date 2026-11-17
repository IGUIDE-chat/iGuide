<p align="center">
  <a href="https://iguide.chat"><img alt="Live at iguide.chat" src="https://img.shields.io/badge/live-iguide.chat-E84A27.svg?style=for-the-badge&labelColor=000000" /></a>
  <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare%20Workers-F38020.svg?style=for-the-badge&logo=cloudflareworkers&logoColor=white&labelColor=000000" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3FCF8E.svg?style=for-the-badge&logo=supabase&logoColor=white&labelColor=000000" />
  <img alt="DeepSeek" src="https://img.shields.io/badge/DeepSeek-4D6BFE.svg?style=for-the-badge&logo=deepseek&logoColor=white&labelColor=000000" />
</p>

<p align="center"><b>English</b> · <a href="./README_CN.md">中文</a></p>

# iGuide

**IlliniGuide** 🌽 is a bilingual campus assistant for students at the University of
Illinois Urbana-Champaign, built with new students in mind:
[iguide.chat](https://iguide.chat). A streaming chat about housing, courses, buses, and
campus services, a library of campus guides in English and 中文, and a dorm explorer
with a map, filters, side-by-side comparison, and favorites. The React app and every
`/api/*` route ship as one Cloudflare Worker, with Supabase for accounts, saved chats,
and dorm data.

The chat agent's only retrieval tool is a Tavily search held to official
`illinois.edu` pages; past that, it answers from general knowledge and says when it
isn't sure. Every run is bounded: at most 3 agent iterations, 5 tool calls, and 10 s
per call. The search itself:

```ts
// apps/web/worker/tools/web-search.ts
const response = await fetch("https://api.tavily.com/search", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    api_key: apiKey,
    query,
    max_results: limit,
    include_domains: ["illinois.edu", "housing.illinois.edu"],
  }),
})
```

Nobody has to sign in: guests keep their chats and favorites in the browser, and
signed-in users keep them in Supabase. Not live yet: Courses and Resume are waitlist
pages, dorm reviews are switched off (`SHOW_COMMENTS = false`), and the persona and
memory on the Profile page don't reach the model, because the app sends no token to
`/api/chat`.

## Quick start

```bash
vp install
cp apps/web/.env.local.example apps/web/.env.local   # public VITE_ values for the SPA
cp apps/web/.dev.vars.example apps/web/.dev.vars     # Worker secrets, see below
vp dev                                               # SPA + Worker on one origin → http://localhost:5173
```

Node 22.18+ or 24.11+ and the global [`vp`](https://viteplus.dev/guide/install) CLI,
which runs the pnpm the repo pins (`pnpm@12.7.0`); plain `npm install` doesn't work.
In `.dev.vars`, set `DEEPSEEK_API_KEY` (chat gets no answer without it) and
`TAVILY_API_KEY` (every search errors without it), and leave the other placeholders
empty; [AGENTS.md](AGENTS.md#secrets) lists what each one gates.
`curl http://localhost:5173/api/health` checks the Worker.

## Tests

| Command                                                               | What it checks                                                                                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `vp check --fix`                                                      | Oxfmt, type-aware Oxlint, and type-check, with fixes. `vp install` also sets it up as a pre-commit hook on staged files.              |
| `cd apps/web && node --test "worker/**/*.test.ts" "src/**/*.test.ts"` | The Worker and SPA `node:test` suites: agent loop, tool registry, MCP, SSE parsing. Two agent-loop files fail under plain Node today. |
| `vp build`                                                            | Production build of `apps/web`.                                                                                                       |

CI runs no tests: the only workflow, [React Doctor](.github/workflows/react-doctor.yml),
reviews pull requests that touch `apps/web` and never fails the check. Run all three
commands before you push; [AGENTS.md](AGENTS.md#verification) has the details.

## Repository layout

| Path                                    | What lives there                                                                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [`apps/web/src/`](apps/web/src)         | The React 19 SPA: react-router 7, Tailwind CSS 4, assistant-ui for chat, Mapbox GL for the dorm map, supabase-js for auth and user data. |
| [`apps/web/worker/`](apps/web/worker)   | The Cloudflare Worker `uiuc`: Hono routes for `/api/*`, the tool-use agent, its tools and skills, and an experimental MCP client.        |
| [`apps/web/scripts/`](apps/web/scripts) | Scripts run by hand, mostly for the dorms table: seed, media audit, data validation.                                                     |
| [`packages/dorm/`](packages/dorm)       | `@iguide/dorm`: the dorm API mounted at `/api/dorms`, the shared dorm model, the dorm SQL, and the scrapers.                             |
| [`packages/ui/`](packages/ui)           | `@iguide/ui`: UI primitives shared by the app and feature packages.                                                                      |
| [`apps/auth/`](apps/auth)               | A Vite+ starter scaffold (`@iguide/auth`); nothing uses it yet.                                                                          |
| [`tools/vite-bin/`](tools/vite-bin)     | Gives `cf build` a `vite` bin that forwards to the pinned Vite+, so builds never download an unpinned Vite.                              |
| [`tests/fixtures/`](tests/fixtures)     | Leftovers from the removed knowledge-base schema; nothing reads them.                                                                    |

## Deploys

One Worker serves the SPA and the whole API, so it's the only thing to deploy, with
the `cf` CLI and [`apps/web/cloudflare.config.ts`](apps/web/cloudflare.config.ts).
Run these from `apps/web`:

| Target                               | Commands                                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| [iguide.chat](https://iguide.chat)   | `vp exec cf build`, then `vp exec cf deploy --prebuilt`                                               |
| Preview, named after your Git branch | `CLOUDFLARE_PREVIEW_BUILD=true vp build --mode preview`, then `vp exec cf previews deploy --prebuilt` |

A fork must change the pinned `accountId` first. The rollout order (tables, dorm SQL,
seed, secrets, preview, production) and the rollback commands are in
[AGENTS.md](AGENTS.md#deploy).

## Documentation

- [AGENTS.md](AGENTS.md): repo rules, commands, secrets, architecture, endpoint access,
  verification, and deploy.
- [apps/web/AGENTS.md](apps/web/AGENTS.md): the React app and the Worker, including the
  tables the tracked SQL never creates.
- [packages/dorm/AGENTS.md](packages/dorm/AGENTS.md) ·
  [packages/dorm/README.md](packages/dorm/README.md): the dorm package boundary, its
  endpoints, and the dorm database.
- [apps/web/worker/tools](apps/web/worker/tools) ·
  [apps/web/worker/skills](apps/web/worker/skills) ·
  [apps/web/worker/routes/agent-prompts](apps/web/worker/routes/agent-prompts): agent
  tools, skills, and prompts.

## Database migrations

There's no migration runner. Paste the dorm SQL in
[`packages/dorm/scripts/migrations/`](packages/dorm/scripts/migrations) into the
Supabase SQL editor by hand, starting with `create_dorms_table.sql`.
[Dorm database](packages/dorm/AGENTS.md#dorm-database) has the order and the known
conflicts.

## Security

Provider keys stay in Worker secrets (`.dev.vars` locally) and never in `src` or a
`VITE_` variable: those are public, and only the Supabase URL, anon key, and Mapbox
token use them. The Worker holds no service-role key; it forwards the caller's token,
so Supabase RLS decides every row. It rate-limits nothing, and all guests share one
anonymous identity. See [Endpoint access](AGENTS.md#endpoint-access).

## Community

Report bugs and request features in [Issues](https://github.com/IGUIDE-chat/iGuide/issues).
Pull requests are welcome, AI-assisted ones too, as long as the agent follows
[AGENTS.md](AGENTS.md); run the [tests](#tests) before you open one.

<a href="https://github.com/IGUIDE-chat/iGuide/graphs/contributors"><img src="https://contrib.rocks/image?repo=IGUIDE-chat/iGuide" alt="Contributors" /></a>
