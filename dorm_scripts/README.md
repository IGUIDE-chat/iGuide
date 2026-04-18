# dorm_scripts

This directory keeps scraping and dorm-review generation code out of `app/` so the app stays free of scraping-only dependencies like Puppeteer.

All scripts write to:

`app/src/components/housing/constants/googleReviews.ts`

## Included scripts

- `scrapePCHMaps.cjs` , Puppeteer-based Google Maps scraper for PCH dorms: `bromley`, `illini-tower`, `newman`, `hendrick`, `presby`, `armory`
- `scrapeMissing2.cjs` , Puppeteer-based Google Maps scraper for other missing dorms: `isr`, `par`, `allen`, `bousefield`, and similar gaps
- `fetchReviewsGPT.py` , Python script that uses the DeepSeek API to generate AI-recalled dorm reviews

## Install

Run Bun from inside this directory:

```bash
cd dorm_scripts
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

This requires `DEEPSEEK_API_KEY` or `VITE_DEEPSEEK_API_KEY` in `app/.env.local`.

## Python note

`fetchReviewsGPT.py` is separate from the Bun workflow and reads its API key from `app/.env.local`.

## Important

`dorm_scripts/` is intentionally isolated. Don’t move these scripts back into `app/`.
