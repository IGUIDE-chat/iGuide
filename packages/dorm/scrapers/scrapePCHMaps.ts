import {
  appendReviews,
  describeError,
  GOOGLE_REVIEWS_PATH,
  type GeneratedReview,
} from "./dataset.ts"
import { collectReviews, launchScraper, newScraperPage, toGeneratedReviews } from "./mapsScraper.ts"

/**
 * Google Maps scraper for the Private Community High dorms, which have no place
 * page Google resolves from a plain name, so each one is searched by street
 * address.
 */

const PCH_DORMS: Record<string, string> = {
  bromley: "Bromley+Hall+910+S+Third+St+Champaign",
  "illini-tower": "Illini+Tower+409+E+Chalmers+St+Champaign",
  newman: "Newman+Hall+604+E+Armory+Ave+Champaign",
  hendrick: "Hendrick+House+904+W+Green+St+Urbana",
  presby: "Presby+Hall+805+S+Fifth+St+Champaign",
  armory: "Armory+House+1010+S+Second+St+Champaign",
}

async function main(): Promise<void> {
  console.log("Starting PCH dorms scraper...")

  const collected: GeneratedReview[] = []
  const browser = await launchScraper()
  try {
    const page = await newScraperPage(browser)
    for (const [dormId, address] of Object.entries(PCH_DORMS)) {
      const url = `https://www.google.com/maps/search/${address}`
      const reviews = await collectReviews(page, dormId, [url])
      collected.push(...toGeneratedReviews(dormId, reviews))
    }
  } finally {
    await browser.close()
  }

  const written = appendReviews(collected)
  console.log(`Scraped ${written} PCH reviews into ${GOOGLE_REVIEWS_PATH}`)
}

main().catch((error) => {
  console.error(`PCH scrape failed: ${describeError(error)}`)
  process.exitCode = 1
})
