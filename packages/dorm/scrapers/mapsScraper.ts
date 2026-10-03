import type { Browser, Page } from "puppeteer"
import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"

import { describeError, randomInt, type GeneratedReview } from "./dataset.ts"

/**
 * The Google Maps scraping half shared by every Puppeteer script here: launch,
 * get onto the reviews tab however this build of the page offers it, scroll for
 * more, and pull the review cards out. The scripts differ only in which dorms
 * they point it at and which write mode they use.
 */

puppeteer.use(StealthPlugin())

const VIEWPORT = { width: 1920, height: 1080 }

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

/**
 * The tab is labelled in the Maps UI language, and the browser is only asked to
 * prefer English, so keep the localized spellings the scrapers have always
 * matched.
 */
const REVIEW_TAB_LABELS = ["Review", "评价", "评论"]

/** Shorter than this is a Maps blurb or an empty card, not a review. */
const MIN_REVIEW_LENGTH = 15

export interface ScrapedReview {
  author: string
  text: string
  stars: number
}

const wait = (ms: number) => {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(() => resolve(), ms)
  return promise
}

export async function launchScraper(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--lang=en-US",
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
    ],
  })
}

export async function newScraperPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" })
  await page.setUserAgent(USER_AGENT)
  return page
}

async function clickReviewsTab(page: Page): Promise<boolean> {
  for (const tab of await page.$$('button[role="tab"]')) {
    const label = await page.evaluate((element) => (element as HTMLElement).innerText, tab)
    if (!REVIEW_TAB_LABELS.some((candidate) => label.includes(candidate))) continue
    await tab.click()
    return true
  }

  return false
}

/**
 * Maps serves the reviews through four different entry points depending on
 * whether the URL landed on a search, a place, or a partially loaded place.
 * Try them in order of how cheap they are to rule out.
 */
async function openReviewsTab(page: Page, dormId: string): Promise<boolean> {
  if (await clickReviewsTab(page)) {
    console.log(`[${dormId}] Clicked the reviews tab.`)
    return true
  }

  const firstResult = await page.$("a.hfpxzc")
  if (firstResult) {
    await firstResult.click()
    await wait(4000)
    if (await clickReviewsTab(page)) {
      console.log(`[${dormId}] Clicked the reviews tab after opening the first result.`)
      return true
    }
  }

  for (const button of await page.$$('button[jsaction*="review"]')) {
    try {
      await button.click()
      console.log(`[${dormId}] Clicked a review action button.`)
      return true
    } catch {
      // The button detached or is not clickable; fall through to the next one.
    }
  }

  const clickedCount = await page.evaluate(() => {
    for (const element of document.querySelectorAll<HTMLElement>("span, button")) {
      if (element.innerText.match(/\d+ review/i)) {
        element.click()
        return true
      }
    }
    return false
  })
  if (clickedCount) {
    console.log(`[${dormId}] Clicked the review count.`)
    return true
  }

  return false
}

/** Maps lazy-loads the review list, so scroll it and expand every "more". */
async function scrollReviews(page: Page): Promise<void> {
  const containers = [
    "div.m6QErb.DxyBCb.kA9KIf.dS8AEf",
    "div.m6QErb.DxyBCb.kA9KIf",
    "div.m6QErb.D5yXZc.xiA65.transparentBackground",
    "div.m6QErb",
  ]

  for (let round = 0; round < 6; round++) {
    await page.evaluate((selectors) => {
      for (const selector of selectors) {
        const element = document.querySelector<HTMLElement>(selector)
        if (element && element.scrollHeight > element.clientHeight) {
          element.scrollBy(0, 5000)
          return
        }
      }
      for (const element of document.querySelectorAll<HTMLElement>("div")) {
        if (element.scrollHeight > 2000 && element.scrollHeight > element.clientHeight * 1.5) {
          element.scrollBy(0, 5000)
          return
        }
      }
    }, containers)

    await wait(1500)

    for (const button of await page.$$("button.w8nwRe.kyuRq")) {
      try {
        await button.click()
      } catch {
        // The button scrolled away with the list it belongs to; skip it.
      }
    }
    await wait(500)
  }
}

/**
 * Reads the review cards off the page. Maps marks them with `.jftiEf`, but the
 * markup shifts without notice, so fall back to the review id attribute and to
 * the author's `aria-label` when the class names are gone.
 */
async function extractReviews(page: Page): Promise<ScrapedReview[]> {
  return page.evaluate((minimumLength): ScrapedReview[] => {
    const marked = document.querySelectorAll<HTMLElement>(".jftiEf")
    const cards =
      marked.length > 0
        ? [...marked]
        : [...document.querySelectorAll<HTMLElement>("[data-review-id]")]

    const collected: ScrapedReview[] = []
    for (const card of cards) {
      const author =
        card
          .querySelector<HTMLElement>('.d4r55, [class*="author"], [class*="name"], .TSUbDb a')
          ?.innerText.trim() || "Google User"
      const text =
        card
          .querySelector<HTMLElement>('.wiI7pd, [class*="review-text"], .Jtu6Td, .review-full-text')
          ?.innerText.trim() ?? ""
      if (text.length < minimumLength) continue

      const digit = card
        .querySelector<HTMLElement>('span.kvMYJc, [aria-label*="star" i]')
        ?.getAttribute("aria-label")
        ?.match(/(\d)/)?.[1]

      collected.push({ author, text, stars: digit ? Number.parseInt(digit, 10) : 3 })
    }
    return collected
  }, MIN_REVIEW_LENGTH)
}

export async function scrapeDormReviews(
  page: Page,
  dormId: string,
  url: string,
): Promise<ScrapedReview[]> {
  console.log(`[${dormId}] Opening ${url}`)
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 })
  await wait(4000)

  if (await openReviewsTab(page, dormId)) {
    await wait(3000)
  } else {
    console.log(`[${dormId}] No reviews tab found; reading whatever reviews are visible.`)
  }

  try {
    await scrollReviews(page)
  } catch (error) {
    console.log(`[${dormId}] Scrolling failed: ${describeError(error)}`)
  }

  const reviews = await extractReviews(page)
  console.log(`[${dormId}] ${reviews.length} reviews on "${await page.title()}" at ${page.url()}`)
  return reviews
}

/**
 * Walks `urls` in order, retrying each one, and returns the first scrape that
 * produced anything. A candidate URL that Google answers with a consent wall or
 * a captcha otherwise costs the whole dorm its reviews.
 */
export async function collectReviews(
  page: Page,
  dormId: string,
  urls: readonly string[],
): Promise<ScrapedReview[]> {
  for (const url of urls) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const reviews = await scrapeDormReviews(page, dormId, url)
        if (reviews.length > 0) return reviews
      } catch (error) {
        console.log(`[${dormId}] Attempt ${attempt + 1} failed: ${describeError(error)}`)
      }
    }
  }

  return []
}

/**
 * The dataset records `daysAgo` and `upvotes`, which Google does not return in
 * a form worth keeping, so they are drawn at random the way every scraped entry
 * already in the dataset was.
 */
export function toGeneratedReviews(
  dormId: string,
  reviews: readonly ScrapedReview[],
): GeneratedReview[] {
  return reviews.map((review, index) => ({
    id: `gm-real-${dormId}-${index}`,
    dormId,
    displayName: review.author,
    content: review.text,
    vote: review.stars >= 3 ? 1 : -1,
    daysAgo: randomInt(1, 300),
    upvotes: randomInt(0, 19),
  }))
}
