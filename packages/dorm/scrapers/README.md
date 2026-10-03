# scrapers

Scraping and dorm-review generation code for `@iguide/dorm`. It has its own
`package.json` and is not a workspace member, so scraping-only dependencies
like Puppeteer stay out of both the app and the package.

All scripts write to:

`apps/web/src/components/housing/constants/googleReviews.ts`

## Included scripts

- `scrapePCHMaps.cjs` , Puppeteer-based Google Maps scraper for PCH dorms: `bromley`, `illini-tower`, `newman`, `hendrick`, `presby`, `armory`
- `scrapeMissing2.cjs` , Puppeteer-based Google Maps scraper for other missing dorms: `isr`, `par`, `allen`, `bousefield`, and similar gaps
- `fetchReviewsGPT.py` , Python script that uses the DeepSeek API to generate AI-recalled dorm reviews

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
node scrapePCHMaps.cjs
```

```bash
bun run scrape:missing
# or
node scrapeMissing2.cjs
```

## Run the Python script

```bash
python fetchReviewsGPT.py
```

This requires `DEEPSEEK_API_KEY` or `VITE_DEEPSEEK_API_KEY` in `apps/web/.env.local`.

## Python note

`fetchReviewsGPT.py` is separate from the Bun workflow and reads its API key from `apps/web/.env.local`.

## Important

`scrapers/` is intentionally isolated. Don’t add it to the workspace or move these scripts into `src/`.
