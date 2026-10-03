# scrapers

Scraping and dorm-review generation code for `@iguide/dorm`, written in
TypeScript. It has its own `package.json` and is not a workspace member, so
scraping-only dependencies like Puppeteer stay out of both the app and the
package.

All scripts write to:

`apps/web/src/components/housing/constants/googleReviews.ts`

## Included scripts

| Script               | What it does                                                                  |
| :------------------- | :---------------------------------------------------------------------------- |
| `scrapePCHMaps.ts`   | Puppeteer scraper for the PCH dorms, searched by street address.              |
| `scrapeMissing2.ts`  | Puppeteer scraper for the dorms the dataset was missing, by pinned place URL. |
| `fetchReviewsGPT.ts` | DeepSeek generator for halls Google Maps has no review page for.              |

Two shared modules back them:

- `mapsScraper.ts` — the Puppeteer half: launching, getting onto the reviews tab
  however the current Google Maps build exposes it, scrolling the lazy list, and
  reading the review cards.
- `dataset.ts` — the write half: the `GeneratedReview` shape, rendering a
  `generateComment(...)` entry at the width `oxfmt` formats to, and locating the
  `GOOGLE_REVIEWS` array so appends land at the end of it.

The scrapers **append**; `fetchReviewsGPT.ts` **replaces** the array body, because
its reviews are model recall rather than scraped evidence. Both modes keep the
file's header, so neither can regress the import or the `generateComment`
signature.

## Install

Run Bun from inside this directory:

```bash
cd packages/dorm/scrapers
bun install
```

## Run the scrapers

```bash
bun run scrape:pch
# or
node scrapePCHMaps.ts
```

```bash
bun run scrape:missing
# or
node scrapeMissing2.ts
```

## Run the generator

```bash
bun run generate:reviews
# or
node fetchReviewsGPT.ts
```

This requires `DEEPSEEK_API_KEY` or the legacy `VITE_DEEPSEEK_API_KEY`, read from
`apps/web/.env.local` first and then from the environment.

## Important

`scrapers/` is intentionally isolated. Don't add it to the workspace or move
these scripts into `src/`.
