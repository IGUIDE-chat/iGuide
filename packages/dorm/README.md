# @iguide/dorm

[中文](README_CN.md)

The dorm (housing) feature: list, map, detail, compare, reviews, favorites, and admin editing, plus its
database SQL, data scripts, and review scrapers. It is a workspace package so dorm code, dependencies
(Mapbox GL, rc-slider, Headless UI), and state stay out of the rest of the app.

## Boundary

The host app imports only what `src/index.ts` exports, and the package imports nothing from the host.

```tsx
import { configureDormServices, DormRoutes } from "@iguide/dorm"

configureDormServices({ supabase, streamChatResponse }) // once, before DormRoutes renders

<Route path="/dorms/*" element={<DormRoutes language={language} user={user} requestLogin={requestLogin} layout={layout} />} />
```

- `configureDormServices` lends the host's Supabase client (so dorm queries share its session) and the
  chat stream used by the housing assistant.
- `DormRoutes` owns everything under `/dorms`. Dorm data, filters, compare, and favorites are mounted
  inside it, so other pages never load dorm code or query dorm tables.
- `layout` is the slice of the host shell the dorm UI drives: the flying-heart target refs and two
  slot setters. The dorm sidebar and the dorm list's mobile header portal into those slots, so they
  keep dorm context while rendering in the shell.

In `apps/web` the only file that touches this package is `src/pages/dorms/DormRoute.tsx`, lazy-loaded
by the `/dorms/*` route.

The host must also compile Tailwind over this package's sources (`@source` in `apps/web/src/index.css`)
and define the `illini-*` theme colors the components use.

## Layout

- `src/`: the feature. Its folders mirror where the code lived in `apps/web/src`, so moved files kept
  their relative imports and history.
- `scripts/`: dorm database SQL and data scripts.
- `scrapers/`: standalone Puppeteer/Bun review scrapers, outside the workspace (see its README).

## Database and data scripts

The SQL order, the seed and data scripts, and their known conflicts are in
[AGENTS.md](AGENTS.md#dorm-database).
