# IlliniGuide 🌽 — Your UIUC campus guide, in English and 中文

<p align="center">
  <a href="https://iguide.chat"><img src="https://img.shields.io/badge/live-iguide.chat-E84A27?style=flat-square" alt="Live site"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-22.18%2B%20%7C%2024.11%2B-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node 22.18+ or 24.11+"></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-12.7.0-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm 12.7.0"></a>
</p>

IlliniGuide (iGuide) is a campus assistant for students at the University of Illinois Urbana-Champaign, built with new students in mind and live at [iguide.chat](https://iguide.chat). Ask it about housing, courses, buses, or campus services in a streaming chat, read a bilingual library of campus guides, or explore residence halls on a map and compare them side by side. The React app and every `/api/*` endpoint ship together as one Cloudflare Worker, with Supabase for accounts, saved chats, favorites, and dorm data.

**Grounded, not guessed.** The chat agent's one retrieval tool is a Tavily web search limited to official `illinois.edu` pages; past that, it answers from general knowledge and says when it's unsure. Every run is bounded (at most 3 agent iterations, 5 tool calls, and 10 s per tool call), provider keys never leave the Worker, and nobody has to sign in: guests keep their chats and favorites in the browser, and signed-in users store them in Supabase instead (guest data isn't carried over when you sign in).

[Website](https://iguide.chat) · [AGENTS.md](AGENTS.md) · [Issues](https://github.com/IGUIDE-chat/iGuide/issues) · [中文](README_CN.md)

## What you can do

- **Chat** — answers stream in as Markdown, with a collapsible "thinking" timeline that times each step, a card for each web search, and copy buttons. Past chats sit in the sidebar, grouped by date, with pin and delete.
- **Library** — 10 guides in 6 categories (housing, academics, transportation, food, social life, safety and health), searchable by title and tag. Signed-in users also get a reading history.
- **Dorms** — the bundled dataset covers 23 halls (19 University Housing, 4 Private Certified Housing). Search, sort, and filter by zone, type, price, beds, bathrooms, A/C, facilities, and lifestyle; browse a Mapbox map with campus zones and landmarks; compare up to 4 halls; save favorites; and open galleries and floor plans. A floating dorm assistant answers questions on every dorm page.
- **Two languages** — every page, article, and dorm label exists in English and Simplified Chinese. The app starts in your browser's language, and you can switch from the sidebar.
- **Optional accounts** — sign in with Google, Microsoft, or email through Supabase Auth. The Profile page lets you edit your display name, the AI persona, and the AI's memory of you.
- **Admin editing** — admins (`user_metadata.is_admin`) edit dorm content, tags, and photos in place, with an edit history they can restore from.

Not live yet: **Courses** and **Resume** are "coming soon" pages with an email waitlist, dorm reviews are built but switched off (`SHOW_COMMENTS = false`), and the Profile → Integrations panel is a UI mock. The persona and memory you edit on the Profile page don't reach the model: the app doesn't send its Supabase token to `/api/chat`, so the agent answers every chat as a guest. Memory only flows one way for now: the model still tags what it learns about you, and the app saves those notes for signed-in users, but nothing reads them back. The chat can still show up to three follow-up question chips, but `/api/chat` no longer asks the model for them, so they rarely appear.

## Quick start

You need Node 22.18+ or 24.11+ (what both `vite-plus` and the `cf` CLI accept) and the global `vp` CLI ([install guide](https://viteplus.dev/guide/install): `curl -fsSL https://vite.plus | bash`). `vp` is the only entry point in this README, and it drives the pnpm version the repo pins in `packageManager` (`pnpm@12.7.0`).

```bash
git clone https://github.com/IGUIDE-chat/iGuide.git
cd iGuide
vp install
cp apps/web/.env.local.example apps/web/.env.local   # public VITE_ values for the SPA
cp apps/web/.dev.vars.example apps/web/.dev.vars     # Worker secrets for local runs
```

Before you start the server, fill in `DEEPSEEK_API_KEY` and `TAVILY_API_KEY` in `.dev.vars`: chat gets no answer without the first, and every web search errors without the second. Leave the other placeholders empty. [AGENTS.md](AGENTS.md#secrets) lists what each variable gates.

```bash
vp dev
```

`vp dev` runs the real Worker behind the Vite dev server, so the SPA and `/api/*` share one origin, as they do in production. Check the Worker from a second terminal (5173 is Vite's default port; use the URL `vp dev` prints):

```bash
curl http://localhost:5173/api/health
```

## Documentation

| Goal                                           | Start here                                                                                                                                                                                         |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Learn the repo rules, commands, and data model | [AGENTS.md](AGENTS.md)                                                                                                                                                                             |
| Understand the runtime, endpoints, and access  | [AGENTS.md](AGENTS.md#architecture) · [AGENTS.md](AGENTS.md#endpoint-access)                                                                                                                       |
| Work on the React app or the Worker            | [apps/web/AGENTS.md](apps/web/AGENTS.md)                                                                                                                                                           |
| Change the agent's prompt or loop              | [apps/web/worker/routes/agent-prompts](apps/web/worker/routes/agent-prompts) · [apps/web/worker/agent](apps/web/worker/agent)                                                                      |
| Add an agent tool or skill                     | [apps/web/worker/tools](apps/web/worker/tools) · [apps/web/worker/skills](apps/web/worker/skills)                                                                                                  |
| Configure secrets and the Worker               | [apps/web/.dev.vars.example](apps/web/.dev.vars.example) · [apps/web/.env.local.example](apps/web/.env.local.example) · [apps/web/cloudflare.config.ts](apps/web/cloudflare.config.ts)             |
| Set up dorm tables and seed data               | [apps/web/AGENTS.md](apps/web/AGENTS.md#dorm-database) · [apps/web/scripts/migrations](apps/web/scripts/migrations) · [apps/web/scripts/seed-dorms-table.ts](apps/web/scripts/seed-dorms-table.ts) |
| Deploy and roll back                           | [AGENTS.md](AGENTS.md#deploy)                                                                                                                                                                      |
| See what runs on pull requests                 | [.github/workflows/react-doctor.yml](.github/workflows/react-doctor.yml)                                                                                                                           |

## Development

The repository is a pnpm workspace driven by [Vite+](https://viteplus.dev) (`vp`), the single entry point for installing, checking, building and deploying: `package.json` keeps no wrapper scripts for those. `pnpm-workspace.yaml` declares the [workspaces](https://viteplus.dev/guide/monorepo) and [catalogs](https://pnpm.io/catalogs), which today means `@iguide/web` (`apps/web`) and `@iguide/vite-bin` (`tools/vite-bin`), so plain `npm install` does not work. `vp install` also sets up a pre-commit hook that runs `vp check --fix` on staged files.

```bash
vp dev           # Vite dev server with the Worker behind it
vp check --fix   # format, lint, and type-check, with fixes
vp fmt           # Oxfmt, writes in place
vp lint          # Oxlint, type-aware and type-checked
vp build         # production build of apps/web
vp preview       # serve the production build locally
```

There is no `test` or `typecheck` script: type checking happens inside `vp check`. The Worker and SPA suites are `node:test` files, so run them from `apps/web`:

```bash
cd apps/web
node --test "worker/**/*.test.ts" "src/**/*.test.ts"
```

Two of those suites fail under plain Node today, and CI runs no tests at all; [AGENTS.md](AGENTS.md#verification) covers both. Run `vp check --fix`, the tests above, and `vp build` yourself before you push.

## Deploy

One Worker serves the SPA and the whole API, so it's the only thing to deploy. It's configured in [`apps/web/cloudflare.config.ts`](apps/web/cloudflare.config.ts) and deployed with the `cf` CLI ([Get started with Workers](https://developers.cloudflare.com/workers/get-started/guide/)); a fork must change the pinned `accountId` and `domains` first.

To deploy by hand:

```bash
cd apps/web
vp exec cf build             # Worker + SPA assets as Build Output
vp exec cf deploy --prebuilt # deploys that output without rebuilding
```

To try a branch first, deploy a Worker Preview named after your Git branch: `CLOUDFLARE_PREVIEW_BUILD=true vp build --mode preview`, then `vp exec cf previews deploy --prebuilt` ([details](https://developers.cloudflare.com/workers/configuration/previews/)).

The rollout order — create the tables the tracked SQL omits, run the dorm chain, seed, set secrets, preview, then production — and the rollback commands are in [AGENTS.md](AGENTS.md#deploy).

## Community

Report bugs and request features in [GitHub Issues](https://github.com/IGUIDE-chat/iGuide/issues). Pull requests are welcome; run `vp check` and the tests in [Development](#development) before opening one. AI-assisted PRs are welcome too, as long as the agent follows [AGENTS.md](AGENTS.md) (and [apps/web/AGENTS.md](apps/web/AGENTS.md) inside `apps/web`).

<a href="https://github.com/IGUIDE-chat/iGuide/graphs/contributors"><img src="https://contrib.rocks/image?repo=IGUIDE-chat/iGuide" alt="Contributors"></a>
