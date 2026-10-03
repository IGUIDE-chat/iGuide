import {
  appendReviews,
  describeError,
  GOOGLE_REVIEWS_PATH,
  type GeneratedReview,
} from "./dataset.ts"
import { collectReviews, launchScraper, newScraperPage, toGeneratedReviews } from "./mapsScraper.ts"

/**
 * Google Maps scraper for the dorms the dataset was still missing. Each entry
 * pins the exact place URL, because searching these by name lands on the wrong
 * building often enough to be worth the coordinates.
 */

const MISSING_DORMS = [
  {
    dormId: "isr",
    url: "https://www.google.com/maps/place/Illinois+Street+Residence+Halls/@40.1099,-88.2343,17z/",
  },
  {
    dormId: "par",
    url: "https://www.google.com/maps/place/Pennsylvania+Avenue+Residence+Halls/@40.1018,-88.2220,17z/",
  },
  {
    dormId: "allen",
    url: "https://www.google.com/maps/place/Allen+Residence+Hall/@40.1041,-88.2276,17z/",
  },
  {
    dormId: "bousefield",
    url: "https://www.google.com/maps/place/Bousfield+Hall/@40.1032,-88.2363,17z/",
  },
  {
    dormId: "bromley",
    url: "https://www.google.com/maps/place/Bromley+Hall/@40.1085,-88.2347,17z/",
  },
  {
    dormId: "illini-tower",
    url: "https://www.google.com/maps/place/Illini+Tower/@40.1081,-88.2315,17z/",
  },
  {
    dormId: "newman",
    url: "https://www.google.com/maps/place/Newman+Hall/@40.1052,-88.2314,17z/",
  },
  {
    dormId: "hendrick",
    url: "https://www.google.com/maps/place/Hendrick+House/@40.1088,-88.2202,17z/",
  },
  {
    dormId: "presby",
    url: "https://www.google.com/maps/place/Presby+Hall/@40.1074,-88.2337,17z/",
  },
  {
    dormId: "armory",
    url: "https://www.google.com/maps/place/Armory+House/@40.1050,-88.2332,17z/",
  },
] as const

/** The slug Google understands, used when the pinned place URL comes up empty. */
const fallbackQuery = (dormId: string) => `${dormId.replace(/-/g, "+")}+hall+UIUC+Champaign`

async function main(): Promise<void> {
  console.log("Starting missing dorms scraper (round 2)...")

  const collected: GeneratedReview[] = []
  const browser = await launchScraper()
  try {
    const page = await newScraperPage(browser)
    for (const { dormId, url } of MISSING_DORMS) {
      const searchUrl = `https://www.google.com/maps/search/${fallbackQuery(dormId)}`
      const reviews = await collectReviews(page, dormId, [url, searchUrl])
      collected.push(...toGeneratedReviews(dormId, reviews))
    }
  } finally {
    await browser.close()
  }

  const written = appendReviews(collected)
  console.log(`Scraped ${written} reviews into ${GOOGLE_REVIEWS_PATH}`)
}

main().catch((error) => {
  console.error(`Missing-dorm scrape failed: ${describeError(error)}`)
  process.exitCode = 1
})
