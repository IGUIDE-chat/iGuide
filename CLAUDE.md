# CLAUDE.md — IlliniGuide Repository Guide

> This file provides context for AI assistants (Claude, Gemini, etc.) working on this codebase.

---

## Project Overview

**IlliniGuide** is a bilingual (English/Chinese) AI-powered knowledge base and conversational assistant for UIUC (University of Illinois Urbana-Champaign) students. It covers dorm selection, course exploration, campus library resources, resume guidance, and a chat interface backed by AI APIs.

**Live stack:**
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Backend: Cloudflare Pages Functions (serverless) + Supabase (auth + Postgres)
- AI: Coze API (primary), DeepSeek (fallback)
- Deployment: Cloudflare Pages

---

## Repository Structure

```
iGuide/                                    # Repo root
├── illiniguide---uiuc-knowledge-base/     # Main web application (ALL active dev here)
│   ├── src/                               # React app source
│   ├── functions/api/                     # Cloudflare Pages serverless functions
│   ├── docs/                              # Project documentation
│   ├── scripts/                           # Utility/maintenance scripts
│   ├── tests/                             # Test files (Python/JS)
│   ├── supabase-migrations/               # SQL migration files
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.cjs
│   └── tsconfig.json
├── data_collection/                       # Python scripts for scraping UIUC data
├── README.md
├── CONTRIBUTING_CN.md
└── TEAM_ROLES.md
```

**The main application is in `illiniguide---uiuc-knowledge-base/`. All frontend and API work happens there.**

---

## Application Source Structure (`src/`)

```
src/
├── index.tsx              # Entry point — mounts providers and router only
├── App.tsx                # Global state composition, top-level providers, auth gate
├── app/
│   ├── routes.tsx         # Route declarations only (no business logic)
│   └── pageRegistry.ts    # Source of truth for route/page metadata mapping
├── pages/                 # Route-level pages (lazy loaded)
│   ├── chat/              # Chat interface (ChatPage.tsx)
│   ├── library/           # Knowledge library (Home, Category, Article pages)
│   ├── dorms/             # Dorm listing + detail pages
│   ├── courses/           # Course explorer landing
│   ├── profile/           # User profile page
│   └── resume/            # Resume guidance landing
├── components/            # Reusable UI components
│   └── housing/           # Dorm-specific components
│       ├── dorm-detail/
│       ├── dorm-list/
│       ├── dorm-map/
│       ├── filter-modal/
│       └── legacy/        # [Legacy - Not Mounted]
├── services/              # API clients and domain logic
│   ├── supabase.ts        # Supabase client initialization
│   ├── authService.ts     # Auth operations
│   ├── conversationService.ts
│   ├── cozeService.ts     # Coze AI API client
│   ├── deepSeekService.ts
│   ├── libraryService.ts
│   ├── dormFavoritesService.ts
│   └── dormViewingService.ts
├── contexts/              # React Context providers
│   ├── AuthContext.tsx    # User auth state + login/logout/register
│   ├── HousingContext.tsx
│   ├── DormUserInteractionContext.tsx
│   └── LayoutContext.tsx
├── constants/             # Static data and configuration constants
│   └── housing/           # Dorm datasets
├── i18n/                  # Internationalization texts (EN/ZH)
├── data/articles/         # Library article content files
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript interfaces and type definitions
├── utils/                 # Utility/helper functions
├── config/                # Runtime app config modules
└── legacy/                # [Legacy - Not Mounted] archived code
```

---

## Architecture Layers (Strict — Do Not Violate)

The codebase enforces a layered architecture. Each layer has a defined responsibility:

| Layer | Files | Rule |
|---|---|---|
| Entry | `src/index.tsx` | Mount providers and router only |
| App Composition | `src/App.tsx` | Global state, providers, auth gate |
| Route | `src/app/routes.tsx` | Route declarations only, no feature logic |
| Page | `src/pages/**` | Orchestrate components/services/context |
| Feature/Component | `src/components/**` | Reusable UI, presentation only |
| Data/Config | `src/constants/`, `src/i18n/`, `src/data/` | Static data and config |
| Service | `src/services/**` | All API calls and persistence |

**Legacy boundary:** Code in `src/legacy/**`, `src/components/housing/legacy/**`, and `legacy/projects/**` must never be imported by active runtime code.

---

## Current Routes

| Path | Component |
|---|---|
| `/` | Redirect → `/chat` |
| `/chat` | `src/pages/chat/ChatPage.tsx` |
| `/library` | `src/pages/library/LibraryHomePage.tsx` |
| `/library/category/:categoryId` | `src/pages/library/LibraryCategoryPage.tsx` |
| `/library/article/:articleId` | `src/pages/library/LibraryArticlePage.tsx` |
| `/profile` | `src/pages/profile/ProfilePage.tsx` |
| `/courses` | `src/pages/courses/CoursesLandingPage.tsx` |
| `/resume` | `src/pages/resume/ResumeLandingPage.tsx` |
| `/dorms` | `src/pages/dorms/DormListPage.tsx` |
| `/dorms/:id` | `src/pages/dorms/DormDetailPage.tsx` |
| `/dorm/:id` | Redirect → `/dorms/:id` (legacy compat) |

**Rule:** Every route in `routes.tsx` must have a corresponding entry in `src/app/pageRegistry.ts`. Add both together when creating a new page.

---

## Serverless API (Cloudflare Pages Functions)

Located in `functions/api/`:

| File | Endpoint | Purpose |
|---|---|---|
| `chat.ts` | `POST /api/chat` | Coze AI chat proxy (streaming SSE) |
| `deepseek.ts` | `POST /api/deepseek` | DeepSeek chat proxy (non-streaming) |

These functions run on Cloudflare Workers (V8 runtime). They read secrets from Cloudflare environment variables, never from the frontend.

**Dev proxy:** `vite.config.ts` proxies `/api/coze` → `https://api.coze.com` for local development.

---

## Environment Variables

Create `.env.local` in `illiniguide---uiuc-knowledge-base/` (never commit this file):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
VITE_MAPBOX_TOKEN=your_mapbox_token
GEMINI_API_KEY=your_gemini_key          # optional
```

For Cloudflare Pages Functions (set in Cloudflare dashboard, not `.env`):

```
COZE_API_TOKEN=your_coze_pat
COZE_BOT_ID=your_coze_bot_id
DEEPSEEK_API_KEY=your_deepseek_key
```

---

## Development Workflow

### Setup and run

```bash
cd illiniguide---uiuc-knowledge-base
npm install
npm run dev           # starts at http://localhost:3000
```

### Available scripts

```bash
npm run dev                 # Vite dev server (port 3000)
npm run build               # Production build
npm run preview             # Preview production build
npm run typecheck           # TypeScript type-check (no emit)
npm run verify:architecture # Check architecture invariants (no legacy imports, route/page parity)
npm run check:all           # Full check suite (run before merge)
```

### Before merging

1. Run `npm run verify:architecture` — enforces:
   - No active imports from `src/legacy/**`
   - Route and page registry parity
   - Single active App/Auth source
   - Only one active root Vite config
2. Run `npm run check:all`
3. Update all structure docs together when making structural changes (see below)

---

## Coding Conventions

### TypeScript
- **No `any`** — define interfaces for all props, state, and API shapes
- Use `src/types/` for shared interfaces
- Use `src/types.ts` for top-level shared types (e.g., `Language`, `User`, `AuthContextType`)

### Styling
- **Tailwind CSS utility classes only** — no inline styles
- Brand colors are defined in `tailwind.config.cjs`:
  - `illini-blue`: `#13294B`
  - `illini-orange`: `#FF5F05`
  - `illini-orange-light`: `#FF7A30`
  - `illini-orange-dark`: `#E05504`

### Components
- Functional components only
- Use React.lazy + Suspense for page-level components (already wired in `routes.tsx`)
- Animation via `framer-motion`
- Icons via `lucide-react`

### Internationalization
- The app supports English (`'en'`) and Chinese (`'zh'`) via the `Language` type
- UI text lives in `src/i18n/` and `src/contexts/uiText.ts`
- Language is detected from `navigator.language` and passed as a prop down the component tree
- Always provide both EN and ZH strings when adding user-facing text

### File placement
| What | Where |
|---|---|
| New page component | `src/pages/<feature>/` |
| New reusable UI component | `src/components/` |
| New API/persistence logic | `src/services/` |
| New context | `src/contexts/` |
| New shared type | `src/types/` |
| New constant/dataset | `src/constants/` |
| New documentation (.md) | `docs/` |
| New utility script | `scripts/` |
| New test file | `tests/` — naming: `test_*.py` or `*.test.ts` |

---

## Supabase Database Schema

All tables use RLS (Row Level Security) — users can only access their own data.

| Table | Purpose |
|---|---|
| `conversations` | Chat conversation metadata, linked to `auth.users` |
| `messages` | Individual messages within conversations |
| `reading_history` | Library article reading history per user |

Key fields on `conversations`: `id`, `user_id`, `coze_conversation_id`, `title`, `is_pinned`, `created_at`, `updated_at`, `last_viewed_at`

Migration files are in `supabase-migrations/`. SQL utility scripts are in `scripts/`.

---

## Structural Change Checklist

When adding or moving directories/files, update ALL of the following together:

1. `README.md` (repo root)
2. `illiniguide---uiuc-knowledge-base/README.md`
3. `illiniguide---uiuc-knowledge-base/docs/FILE_RULES.md`
4. `illiniguide---uiuc-knowledge-base/docs/PAGE_REGISTRY.md` (if routes changed)
5. Run `npm run verify:architecture`

Mark legacy entries explicitly with `[Legacy - Not Mounted]`.

---

## Key Docs Reference

| File | Contents |
|---|---|
| `docs/ARCHITECTURE.md` | Layer boundaries and enforcement rules |
| `docs/FILE_RULES.md` | Canonical folder structure contract |
| `docs/PAGE_REGISTRY.md` | Route → page mapping documentation |
| `docs/SUPABASE_SETUP.md` | Full DB setup SQL and Supabase config guide |
| `docs/AGENT_ARCHITECTURE.md` | Design doc for Course/Dorm/Action agents (future) |
| `docs/CHATFLOW_SETUP.md` | Coze chatflow configuration guide |
| `.agent/rules/file-management-guide.md` | Agent-specific file org rules (always active) |

---

## Branch Convention

- Main branch: `master`
- Active feature development: `claude/` prefixed branches (e.g., `claude/add-claude-documentation-SEJaW`)
- Always develop on the designated feature branch, not directly on `master`
